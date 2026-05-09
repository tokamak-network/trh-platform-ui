import { describe, it, expect } from 'vitest';
import { extractCurrentSubtask } from '../deploymentSubtask';
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
