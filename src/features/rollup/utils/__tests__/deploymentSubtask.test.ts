import { describe, it, expect } from 'vitest';
import { extractCurrentSubtask, extractStepProgress } from '../deploymentSubtask';
import { ThanosDeploymentLog } from '@/features/rollup/schemas/thanos-deployments';

function makeLogs(messages: string[]): ThanosDeploymentLog[] {
  return messages.map((message, i) => ({
    id: String(i),
    stack_id: 'stack-1',
    deployment_id: 'dep-1',
    message,
    created_at: new Date(Date.now() + i * 1000).toISOString(),
  }));
}

describe('extractCurrentSubtask', () => {
  it('returns null for empty logs', () => {
    expect(extractCurrentSubtask([])).toBeNull();
  });

  it('returns null when no pattern matches', () => {
    expect(extractCurrentSubtask(makeLogs(['random log line', 'another line']))).toBeNull();
  });

  it('pattern 1 — phase header', () => {
    const result = extractCurrentSubtask(
      makeLogs(['=== Phase 1/2: Deploying L2CrossTrade pair ==='])
    );
    expect(result?.label).toBe('Phase 1/2: Deploying L2CrossTrade pair');
  });

  it('pattern 2 — stage header', () => {
    const result = extractCurrentSubtask(makeLogs(['=== STAGE A - vpc/eks/efs ===']));
    expect(result?.label).toBe('Stage A: vpc/eks/efs');
  });

  it('pattern 2 — stage header without detail', () => {
    const result = extractCurrentSubtask(makeLogs(['=== STAGE B ===']));
    expect(result?.label).toBe('Stage B');
  });

  it('pattern 3 — trh-sdk stage A header with detail', () => {
    const result = extractCurrentSubtask(
      makeLogs(['Deploying Stage A AWS infrastructure (vpc/eks/efs/secretsmanager)'])
    );
    expect(result?.label).toBe('Stage A: vpc/eks/efs/secretsmanager');
  });

  it('pattern 3 — trh-sdk stage B header without detail', () => {
    const result = extractCurrentSubtask(
      makeLogs(['Deploying Stage B AWS infrastructure'])
    );
    expect(result?.label).toBe('Stage B');
  });

  it('pattern 4 — L1 contract initialized', () => {
    const result = extractCurrentSubtask(makeLogs(['✅ SystemConfig initialized']));
    expect(result?.label).toBe('Initialized: SystemConfig');
  });

  it('pattern 5 — general success emoji', () => {
    const result = extractCurrentSubtask(makeLogs(['✅ Bridge deployed successfully']));
    expect(result?.label).toBe('Bridge deployed successfully');
  });

  it('pattern 5 — error emoji', () => {
    const result = extractCurrentSubtask(makeLogs(['❌ Helm install failed for op-node']));
    expect(result?.label).toBe('Helm install failed for op-node');
  });

  it('pattern 6 — terraform creating', () => {
    const result = extractCurrentSubtask(
      makeLogs(['module.vpc.aws_vpc.this[0]: Creating...'])
    );
    expect(result?.label).toBe('Creating: module.vpc.aws_vpc.this[0]');
  });

  it('pattern 7 — terraform creation complete', () => {
    const result = extractCurrentSubtask(
      makeLogs([
        'module.vpc.aws_vpc.this[0]: Creating...',
        'module.vpc.aws_vpc.this[0]: Creation complete after 5s [id=vpc-abc]',
      ])
    );
    expect(result?.label).toBe('Creation complete: module.vpc.aws_vpc.this[0]');
  });

  it('pattern 8 — forge output', () => {
    const result = extractCurrentSubtask(
      makeLogs(['[forge]   Setting predeploy implementations with L1 contract dependencies:'])
    );
    // \s+ is greedy — leading whitespace after [forge] is consumed by the pattern
    expect(result?.label).toBe(
      'forge: Setting predeploy implementations with L1 contract dependencies:'
    );
  });

  it('pattern 9 — helm install', () => {
    const result = extractCurrentSubtask(
      makeLogs(['Installing helm release cross-trade-1234'])
    );
    expect(result?.label).toBe('Helm: cross-trade-1234');
  });

  it('pattern 10 — cross-trade sub-phase', () => {
    const result = extractCurrentSubtask(
      makeLogs(['  ↳ cross-trade: deploying L2 contracts via deposit tx (this takes 20-40 min)...'])
    );
    expect(result?.label).toBe(
      'CrossTrade: deploying L2 contracts via deposit tx (this takes 20-40 min)...'
    );
  });

  it('pattern 11 — generic verb fallback', () => {
    const result = extractCurrentSubtask(makeLogs(['Cloning tokamak-thanos-stack repository']));
    expect(result?.label).toBe('Cloning tokamak-thanos-stack');
  });

  it('priority — pattern 4 wins over pattern 5 for initialized lines', () => {
    const result = extractCurrentSubtask(makeLogs(['✅ OptimismPortal initialized']));
    expect(result?.label).toBe('Initialized: OptimismPortal');
  });

  it('uses newest matching log line (scans from end)', () => {
    const result = extractCurrentSubtask(
      makeLogs([
        'module.vpc.aws_vpc.this[0]: Creating...',
        'module.eks.aws_eks_cluster.this[0]: Creating...',
      ])
    );
    // newest line (index 1) matches first
    expect(result?.label).toBe('Creating: module.eks.aws_eks_cluster.this[0]');
  });

  it('parses JSON log messages', () => {
    const jsonMsg = JSON.stringify({
      level: 'info',
      msg: 'module.vpc.aws_vpc.this[0]: Creating...',
      timestamp: '2026-05-09T00:00:00Z',
    });
    const result = extractCurrentSubtask(makeLogs([jsonMsg]));
    expect(result?.label).toBe('Creating: module.vpc.aws_vpc.this[0]');
  });

  it('strips ANSI escape codes before matching', () => {
    const result = extractCurrentSubtask(
      makeLogs(['\x1b[1mmodule.vpc.aws_vpc.this[0]: Creating...\x1b[0m'])
    );
    expect(result?.label).toBe('Creating: module.vpc.aws_vpc.this[0]');
  });

  it('truncates labels exceeding 80 chars', () => {
    const longMsg = '✅ ' + 'x'.repeat(90) + ' completed';
    const result = extractCurrentSubtask(makeLogs([longMsg]));
    expect(result!.label.length).toBe(80);
    expect(result!.label.endsWith('…')).toBe(true);
  });
});

describe('extractStepProgress', () => {
  it('returns null for empty logs', () => {
    expect(extractStepProgress([])).toBeNull();
  });

  it('returns null when no step pattern present', () => {
    expect(extractStepProgress(makeLogs(['random line', 'another line']))).toBeNull();
  });

  it('parses "[deployer] Step X/Y:" format', () => {
    const result = extractStepProgress(
      makeLogs(['[deployer] Step 12/51: Deploying L2OutputOracle'])
    );
    expect(result).toEqual({ current: 12, total: 51 });
  });

  it('parses "step X/Y complete" format (trh-sdk)', () => {
    const result = extractStepProgress(makeLogs(['step 3/12 complete']));
    expect(result).toEqual({ current: 3, total: 12 });
  });

  it('returns the latest (newest) step count by scanning from end', () => {
    const result = extractStepProgress(
      makeLogs([
        '[deployer] Step 1/26: Deploying SystemConfig',
        '[deployer] Step 2/26: Deploying L1CrossDomainMessenger',
      ])
    );
    expect(result).toEqual({ current: 2, total: 26 });
  });

  it('parses JSON log messages', () => {
    const jsonMsg = JSON.stringify({ level: 'info', msg: 'step 13/51 complete' });
    const result = extractStepProgress(makeLogs([jsonMsg]));
    expect(result).toEqual({ current: 13, total: 51 });
  });

  it('parses JSON-wrapped "[deployer] Step N/M:" format (zap logger output from deploy-local-infra)', () => {
    const jsonMsg = JSON.stringify({
      level: 'info',
      msg: '[deployer] Step 4/8: Initializing SystemConfig',
      timestamp: '2026-05-11T10:00:00.000Z',
      caller: 'local_network.go:207',
    });
    const result = extractStepProgress(makeLogs([jsonMsg]));
    expect(result).toEqual({ current: 4, total: 8 });
  });

  it('returns null when total is 0 (guards against divide-by-zero)', () => {
    expect(extractStepProgress(makeLogs(['step 0/0']))).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(extractStepProgress(makeLogs(['STEP 5/10 done']))).toEqual({ current: 5, total: 10 });
  });

  it('parses "Phase N/M" header (CrossTrade local deploy)', () => {
    const result = extractStepProgress(
      makeLogs(['=== Phase 2/2: Deploying L2toL2CrossTradeL2 pair (l2Nonce=11) ==='])
    );
    expect(result).toEqual({ current: 2, total: 2 });
  });

  it('parses "Phase N/M" — phase 1 of 2', () => {
    const result = extractStepProgress(
      makeLogs(['=== Phase 1/2: Deploying L2CrossTrade pair ==='])
    );
    expect(result).toEqual({ current: 1, total: 2 });
  });

  it('parses STAGE A → step 1/2', () => {
    const result = extractStepProgress(makeLogs(['=== STAGE A - vpc/eks/efs ===']));
    expect(result).toEqual({ current: 1, total: 2 });
  });

  it('parses STAGE B → step 2/2', () => {
    const result = extractStepProgress(makeLogs(['=== STAGE B ===']));
    expect(result).toEqual({ current: 2, total: 2 });
  });

  it('prefers step N/M over Phase N/M when both present (step wins as it is more precise)', () => {
    const result = extractStepProgress(
      makeLogs([
        '=== Phase 1/2: Deploying L2CrossTrade pair ===',
        '[deployer] Step 5/20: SomeContract',
      ])
    );
    expect(result).toEqual({ current: 5, total: 20 });
  });
});
