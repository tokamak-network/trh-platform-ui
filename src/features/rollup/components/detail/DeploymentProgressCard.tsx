"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import { useThanosDeploymentsQuery, useThanosDeploymentLogsQuery } from "@/features/rollup/api/queries";
import { formatDuration, formatEtaMs } from "@/features/rollup/utils/durationUtils";
import { classifyLogLevel } from "@/features/rollup/utils/logLevel";
import { categorizeStep, getStepDisplayName } from "@/features/rollup/utils/deploymentSteps";
import { extractStepProgress } from "@/features/rollup/utils/deploymentSubtask";
import { computeVelocity, computePhaseMetrics, InProgressEntry } from "@/features/rollup/utils/deploymentProgress";
import { LogDialog } from "@/features/rollup/components/detail/LogDialog";
import { ThanosDeployment, ThanosDeploymentLog } from "@/features/rollup/schemas/thanos-deployments";
import toast from "react-hot-toast";

function parseFirstErrorText(raw: string): string {
  try {
    const p = JSON.parse(raw);
    const t = p.msg ?? p.message ?? raw;
    return typeof t === 'string' ? t : raw;
  } catch {
    return raw;
  }
}

function ActivityLine({
  deployment,
  stackId,
  logs,
}: {
  deployment: ThanosDeployment;
  stackId: string;
  logs: ThanosDeploymentLog[];
}) {
  const [logOpen, setLogOpen] = React.useState(false);

  const lastError = React.useMemo(
    () => logs.slice().reverse().find((l) => classifyLogLevel(l.message) === 'error'),
    [logs]
  );

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {lastError && (
          <span className="flex items-center gap-1 text-xs text-red-600 italic truncate max-w-[300px]">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {parseFirstErrorText(lastError.message).slice(0, 100)}
          </span>
        )}
        <button
          onClick={() => setLogOpen(true)}
          className={`text-xs px-2 py-0.5 rounded border transition-colors shrink-0 ${
            lastError
              ? 'border-red-300 text-red-600 hover:bg-red-50'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Logs →
        </button>
      </div>
      <LogDialog open={logOpen} onOpenChange={setLogOpen} deployment={deployment} stackId={stackId} />
    </>
  );
}

function MetricBox({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-white/60 backdrop-blur-sm px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold tabular-nums text-slate-900 leading-tight">{value}</p>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

interface PhaseProgressCardProps {
  phaseRows: ThanosDeployment[];
  now: number;
  isIntegrationPhase: boolean;
  stackId: string;
}

function PhaseProgressCard({ phaseRows, now, isIntegrationPhase, stackId }: PhaseProgressCardProps) {
  const inProgressRows = phaseRows.filter((r) => r.status === 'InProgress');
  const row0 = inProgressRows[0];
  const row1 = inProgressRows[1]; // parallel case (l1-contracts + aws-infra)

  // Fetch logs for up to 2 parallel InProgress rows; query is disabled when id is undefined
  const { data: logs0 = [] } = useThanosDeploymentLogsQuery(
    row0?.stack_id, row0?.id, { limit: 5000, refetchIntervalMs: 5000 }
  );
  const { data: logs1 = [] } = useThanosDeploymentLogsQuery(
    row1?.stack_id, row1?.id, { limit: 5000, refetchIntervalMs: 5000 }
  );

  const entries = React.useMemo<InProgressEntry[]>(() => {
    const result: InProgressEntry[] = [];
    if (row0) {
      result.push({
        row: row0,
        logProgress: extractStepProgress(logs0),
        velocity: computeVelocity(logs0),
      });
    }
    if (row1) {
      result.push({
        row: row1,
        logProgress: extractStepProgress(logs1),
        velocity: computeVelocity(logs1),
      });
    }
    return result;
  }, [row0, row1, logs0, logs1]);

  const metrics = React.useMemo(
    () => computePhaseMetrics(phaseRows, entries, now),
    [phaseRows, entries, now]
  );

  const accent = isIntegrationPhase
    ? { bar: 'bg-emerald-500', spinner: 'text-emerald-600', label: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', card: 'from-emerald-50 to-green-100' }
    : { bar: 'bg-blue-500', spinner: 'text-blue-600', label: 'text-blue-700', badge: 'bg-blue-100 text-blue-700 border-blue-200', card: 'from-blue-50 to-indigo-100' };

  const sessionStartMs = phaseRows.reduce((min, r) => {
    if (!r.started_at) return min;
    const t = new Date(r.started_at).getTime();
    return t < min ? t : min;
  }, Infinity);
  const wallClock = isFinite(sessionStartMs)
    ? formatDuration(new Date(sessionStartMs).toISOString(), undefined, now)
    : '—';
  const progressPct = metrics.progress != null ? Math.round(metrics.progress * 100) : null;

  const stepRangeLabel = metrics.inProgressCount > 1
    ? `Step ${metrics.stepIndex}–${metrics.stepIndex + metrics.inProgressCount - 1}/${metrics.stepTotal}`
    : `Step ${metrics.stepIndex}/${metrics.stepTotal}`;

  const inProgressLabels = inProgressRows
    .map((r) => getStepDisplayName(r.step))
    .join(', ');

  const substepHint = metrics.substep
    ? `step ${metrics.substep.current} / ${metrics.substep.total}`
    : undefined;

  return (
    <Card className={`border-0 shadow-xl bg-gradient-to-br ${accent.card}`}>
      <CardContent className="pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Loader2 className={`w-4 h-4 animate-spin ${accent.spinner}`} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${accent.label}`}>
              {isIntegrationPhase ? 'Installing Integrations' : 'Deployment in progress'}
            </span>
          </div>
          <Badge variant="outline" className={`flex items-center gap-1 shrink-0 ${accent.badge}`}>
            <Loader2 className="w-3 h-3 animate-spin" />
            In Progress
          </Badge>
        </div>

        {isIntegrationPhase && (
          <p className="text-xs text-slate-500 mb-2">
            Chain is deployed. Integrations are continuing in the background.
          </p>
        )}

        {/* Phase metrics */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2 my-3">
          <MetricBox label="Elapsed" value={wallClock} />
          {metrics.etaMs != null && (
            <MetricBox
              label="ETA"
              value={formatEtaMs(metrics.etaMs)}
              hint={new Date(now + metrics.etaMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
          )}
          {progressPct != null && (
            <MetricBox
              label="Progress"
              value={`${progressPct}%`}
              hint={substepHint}
            />
          )}
        </div>

        {/* Secondary step line */}
        <p className="text-[10px] text-slate-500 mb-2 truncate">
          {stepRangeLabel} · {inProgressLabels}
        </p>

        {/* Progress bar (only when phase-level progress is available) */}
        {progressPct != null && (
          <div className="mb-3">
            <div className="h-1.5 rounded-full bg-white/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${accent.bar}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Error / Logs for primary row */}
        <ActivityLine deployment={metrics.primaryRow} stackId={stackId} logs={logs0} />
      </CardContent>
    </Card>
  );
}

interface DeploymentProgressCardProps {
  stackId?: string;
}

export function DeploymentProgressCard({ stackId }: DeploymentProgressCardProps) {
  const { data: deployments = [] } = useThanosDeploymentsQuery(stackId);
  const [now, setNow] = React.useState(Date.now());

  const corePhaseRows = React.useMemo(
    () => deployments.filter(
      (d) => categorizeStep(d.step) === 'core' &&
      (d.status === 'InProgress' || d.status === 'Pending' || d.status === 'Success')
    ),
    [deployments]
  );

  const integPhaseRows = React.useMemo(
    () => deployments.filter(
      (d) => categorizeStep(d.step) === 'integration' &&
      (d.status === 'InProgress' || d.status === 'Pending' || d.status === 'Success')
    ),
    [deployments]
  );

  const phase: 'core' | 'integration' | null =
    corePhaseRows.some((d) => d.status === 'InProgress') ? 'core'
    : integPhaseRows.some((d) => d.status === 'InProgress') ? 'integration'
    : null;

  const activeRows = phase === 'core' ? corePhaseRows : integPhaseRows;

  const prevCoreInProgressRef = React.useRef(
    corePhaseRows.filter((d) => d.status === 'InProgress').length
  );
  React.useEffect(() => {
    const coreInProgress = corePhaseRows.filter((d) => d.status === 'InProgress').length;
    const integInProgress = integPhaseRows.filter((d) => d.status === 'InProgress').length;
    const wasCore = prevCoreInProgressRef.current > 0;
    if (wasCore && coreInProgress === 0 && integInProgress > 0) {
      toast.success('Chain deployed. Integrations will continue installing in the background.');
    }
    prevCoreInProgressRef.current = coreInProgress;
  }, [corePhaseRows, integPhaseRows]);

  React.useEffect(() => {
    if (phase === null) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [phase]);

  if (!phase) return null;

  return (
    <PhaseProgressCard
      phaseRows={activeRows}
      now={now}
      isIntegrationPhase={phase === 'integration'}
      stackId={stackId ?? ''}
    />
  );
}
