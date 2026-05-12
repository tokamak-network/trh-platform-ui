import { ThanosDeployment, ThanosDeploymentLog } from '../schemas/thanos-deployments';
import { StepProgress } from './deploymentSubtask';

// Only for steps that actually emit "step N/M" log lines — verified from Go source
// deploy-aws-infra: Stage A (5 steps) + Stage B (13 non-FP baseline) = 18
// deploy-local-infra: 7 steps non-FP baseline
const STEP_SUBSTEP_TOTAL: Record<string, number> = {
  'deploy-aws-infra': 18,
  'deploy-local-infra': 7,
};

const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;
const STEP_PROGRESS_RE = /\bstep\s+(\d+)\s*\/\s*(\d+)/i;

function parseLogText(message: string): string {
  let text = message;
  try {
    const parsed = JSON.parse(message);
    const raw = parsed.msg ?? parsed.message ?? message;
    text = typeof raw === 'string' ? raw : String(raw);
  } catch {
    // not JSON — use as-is
  }
  return text.replace(ANSI_RE, '').trim();
}

// Computes substep/sec velocity from log timestamps.
// Requires logs in ASC order (oldest first). Returns null if insufficient data.
export function computeVelocity(logs: ThanosDeploymentLog[]): number | null {
  const samples: Array<{ ts: number; current: number }> = [];
  for (const log of logs) {
    const text = parseLogText(log.message);
    const m = text.match(STEP_PROGRESS_RE);
    if (m) {
      const current = parseInt(m[1], 10);
      const total = parseInt(m[2], 10);
      if (total > 0 && current > 0) {
        samples.push({ ts: new Date(log.created_at).getTime(), current });
      }
    }
  }
  if (samples.length < 2) return null;

  const lastTs = samples[samples.length - 1].ts;
  const inWindow = samples.filter((s) => s.ts >= lastTs - 60_000);
  // Use last 60s window if it has >= 5 samples, otherwise fall back to last 5 samples
  const window = inWindow.length >= 5 ? inWindow : samples.slice(-5);
  if (window.length < 2) return null;

  const first = window[0];
  const last = window[window.length - 1];
  const dtMs = last.ts - first.ts;
  const dSubstep = last.current - first.current;
  if (dtMs <= 0 || dSubstep <= 0) return null;

  return dSubstep / (dtMs / 1000); // substeps/sec
}

export interface InProgressEntry {
  row: ThanosDeployment;
  logProgress: StepProgress | null;
  velocity: number | null; // substeps/sec
}

export interface PhaseMetrics {
  elapsedMs: number;
  etaMs: number | null;
  progress: number | null; // 0..1
  stepIndex: number;
  stepTotal: number;
  primaryRow: ThanosDeployment;
  substep: StepProgress | null;
  inProgressCount: number;
}

export function computePhaseMetrics(
  phaseRows: ThanosDeployment[],
  inProgressEntries: InProgressEntry[],
  now: number,
): PhaseMetrics {
  const sessionStartMs = Math.min(...phaseRows.map((r) => new Date(r.started_at).getTime()));
  const elapsedMs = now - sessionStartMs;

  const completed = phaseRows.filter((r) => r.status === 'Success');
  const pending = phaseRows.filter((r) => r.status === 'Pending');

  const completedActualMs = completed.reduce((sum, r) => {
    if (!r.finished_at) return sum;
    return sum + new Date(r.finished_at).getTime() - new Date(r.started_at).getTime();
  }, 0);

  const currentElapsedMs = inProgressEntries.reduce((max, e) => {
    return Math.max(max, now - new Date(e.row.started_at).getTime());
  }, 0);

  // Each parallel InProgress row must finish — use max(remaining)
  const rowRemainingMs: Array<number | null> = inProgressEntries.map((e) => {
    if (!e.velocity || e.velocity <= 0 || !e.logProgress || e.logProgress.total <= 0) return null;
    const remaining = Math.max(0, e.logProgress.total - e.logProgress.current);
    return (remaining / e.velocity) * 1000;
  });

  const currentRemainingMs: number | null =
    rowRemainingMs.length > 0 && rowRemainingMs.every((r) => r !== null)
      ? Math.max(...(rowRemainingMs as number[]))
      : null;

  // Estimate pending steps using max velocity observed from current steps
  const maxVelocity =
    inProgressEntries
      .map((e) => e.velocity)
      .filter((v): v is number => v !== null && v > 0)
      .reduce((a, b) => Math.max(a, b), 0) || null;

  let pendingMs: number | null = pending.length === 0 ? 0 : null;
  if (pending.length > 0 && maxVelocity) {
    let total = 0;
    for (const row of pending) {
      const substepTotal = STEP_SUBSTEP_TOTAL[row.step];
      if (!substepTotal) {
        pendingMs = null;
        break;
      }
      total += (substepTotal / maxVelocity) * 1000;
      pendingMs = total;
    }
  }

  const etaMs =
    currentRemainingMs !== null && pendingMs !== null ? currentRemainingMs + pendingMs : null;

  const totalMs = etaMs !== null ? completedActualMs + currentElapsedMs + etaMs : null;

  const progress =
    totalMs && totalMs > 0
      ? Math.min(1, (completedActualMs + currentElapsedMs) / totalMs)
      : null;

  const primaryRow =
    inProgressEntries[0]?.row ?? completed[completed.length - 1] ?? phaseRows[0];
  const primarySubstep = inProgressEntries[0]?.logProgress ?? null;

  return {
    elapsedMs,
    etaMs,
    progress,
    stepIndex: completed.length + 1,
    stepTotal: phaseRows.length,
    primaryRow,
    substep: primarySubstep,
    inProgressCount: inProgressEntries.length,
  };
}
