import { ThanosDeploymentLog } from '@/features/rollup/schemas/thanos-deployments';

export interface SubtaskMatch {
  label: string;
}

export interface StepProgress {
  current: number;
  total: number;
}

const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;

function stripAndParse(message: string): string {
  let text = message;
  try {
    const parsed = JSON.parse(message);
    const raw = parsed.msg ?? parsed.message ?? message;
    text = typeof raw === 'string' ? raw : String(raw);
  } catch {
    // not JSON — use as-is
  }
  return text.replace(ANSI_RE, '').replace(/\r/g, '').trim();
}

function truncate(s: string, max = 80): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

interface Pattern {
  re: RegExp;
  format: (m: RegExpMatchArray) => string;
}

const PATTERNS: Pattern[] = [
  // CrossTrade local deploy phase headers
  {
    re: /===\s*Phase\s*(\d+)\/(\d+):\s*(.+?)\s*===/,
    format: (m) => `Phase ${m[1]}/${m[2]}: ${m[3]}`,
  },
  // AWS infra stage headers
  {
    re: /===\s*STAGE\s*([A-Z])(?:\s*-\s*(.+?))?\s*===/,
    format: (m) => (m[2] ? `Stage ${m[1]}: ${m[2]}` : `Stage ${m[1]}`),
  },
  // trh-sdk Stage A/B header
  {
    re: /Deploying Stage ([AB]) AWS infrastructure(?:\s*\((.+?)\))?/,
    format: (m) => (m[2] ? `Stage ${m[1]}: ${m[2]}` : `Stage ${m[1]}`),
  },
  // L1 contract initializer completion
  {
    re: /✅\s*(.+?)\s+initialized/,
    format: (m) => `Initialized: ${m[1]}`,
  },
  // General success/error markers (at least 3 printable chars after emoji)
  {
    re: /^(?:✅|❌)\s*(.{3,})/,
    format: (m) => m[1],
  },
  // Terraform resource in-progress
  {
    re: /(module\.[\w_]+[\w_.[\]"]*): (Creating|Modifying|Destroying)\.\.\./,
    format: (m) => `${m[2]}: ${m[1]}`,
  },
  // Terraform resource completion
  {
    re: /(module\.[\w_]+[\w_.[\]"]*): (Creation|Modifications|Destruction) complete/,
    format: (m) => `${m[2]} complete: ${m[1]}`,
  },
  // forge output from tokamak-deployer
  {
    re: /\[forge\]\s+(.+)/,
    format: (m) => `forge: ${m[1]}`,
  },
  // Helm release install/upgrade
  {
    re: /(?:Installing|Upgrading) helm release\s+(\S+)/i,
    format: (m) => `Helm: ${m[1]}`,
  },
  // CrossTrade sub-phase
  {
    re: /cross-trade:\s*(.+)/i,
    format: (m) => `CrossTrade: ${m[1]}`,
  },
  // Generic action verb fallback
  {
    re: /(?:^|\s)(Deploying|Installing|Initializing|Configuring|Generating|Building|Cloning|Downloading)\s+([\w./-]+)/,
    format: (m) => `${m[1]} ${m[2]}`,
  },
];

// logs must be in ASC order (oldest first, newest last) — matches backend behavior
export function extractCurrentSubtask(logs: ThanosDeploymentLog[]): SubtaskMatch | null {
  for (let i = logs.length - 1; i >= 0; i--) {
    const text = stripAndParse(logs[i].message);
    if (!text) continue;
    for (const { re, format } of PATTERNS) {
      const m = text.match(re);
      if (m) {
        return { label: truncate(format(m)) };
      }
    }
  }
  return null;
}

const STEP_PROGRESS_RE = /\bstep\s+(\d+)\s*\/\s*(\d+)/i;
const PHASE_RE = /===\s*Phase\s*(\d+)\/(\d+)/i;
const STAGE_RE = /===\s*STAGE\s*([AB])\b/i;
const STAGE_MAP: Record<string, number> = { A: 1, B: 2 };

// logs must be in ASC order (oldest first, newest last)
// Priority: step N/M > Phase N/M > STAGE A/B (step is most precise)
export function extractStepProgress(logs: ThanosDeploymentLog[]): StepProgress | null {
  let phaseResult: StepProgress | null = null;
  let stageResult: StepProgress | null = null;

  for (let i = logs.length - 1; i >= 0; i--) {
    const text = stripAndParse(logs[i].message);

    const stepM = text.match(STEP_PROGRESS_RE);
    if (stepM) {
      const current = parseInt(stepM[1], 10);
      const total = parseInt(stepM[2], 10);
      if (total > 0) return { current, total };
    }

    if (phaseResult === null) {
      const phaseM = text.match(PHASE_RE);
      if (phaseM) {
        const current = parseInt(phaseM[1], 10);
        const total = parseInt(phaseM[2], 10);
        if (total > 0) phaseResult = { current, total };
      }
    }

    if (stageResult === null) {
      const stageM = text.match(STAGE_RE);
      if (stageM) {
        const key = stageM[1].toUpperCase();
        const current = STAGE_MAP[key];
        if (current !== undefined) stageResult = { current, total: 2 };
      }
    }
  }

  return phaseResult ?? stageResult ?? null;
}
