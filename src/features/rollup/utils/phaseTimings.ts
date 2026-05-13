import { ThanosDeploymentLog } from '@/features/rollup/schemas/thanos-deployments';

export interface AwsInfraPhases {
  stageAStart: string | null;
  stageBStart: string | null;
  k8sDone: string | null;
  presetStart: string | null;
}

const ANSI_RE = /\x1b\[[0-9;]*[A-Za-z]/g;

function parseText(message: string): string {
  let text = message;
  try {
    const parsed = JSON.parse(message);
    const raw = parsed.msg ?? parsed.message ?? message;
    text = typeof raw === 'string' ? raw : String(raw);
  } catch {
    // not JSON
  }
  return text.replace(ANSI_RE, '').trim();
}

const STAGE_A_RE = /Deploying Stage A AWS infrastructure/;
const STAGE_B_RE = /Deploying Thanos stack infrastructure.*Stage B/;
const K8S_DONE_RE = /Helm charts installed successfully/;
const PRESET_START_RE = /Installing preset modules/;

// logs must be in ASC order (oldest first). Takes FIRST match for each boundary.
export function extractAwsInfraPhases(logs: ThanosDeploymentLog[]): AwsInfraPhases {
  const phases: AwsInfraPhases = {
    stageAStart: null,
    stageBStart: null,
    k8sDone: null,
    presetStart: null,
  };

  for (const log of logs) {
    const text = parseText(log.message);
    const ts = log.created_at;

    if (phases.stageAStart === null && STAGE_A_RE.test(text)) phases.stageAStart = ts;
    if (phases.stageBStart === null && STAGE_B_RE.test(text)) phases.stageBStart = ts;
    if (phases.k8sDone === null && K8S_DONE_RE.test(text)) phases.k8sDone = ts;
    if (phases.presetStart === null && PRESET_START_RE.test(text)) phases.presetStart = ts;
  }

  return phases;
}
