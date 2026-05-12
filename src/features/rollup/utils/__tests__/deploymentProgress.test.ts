import { describe, it, expect } from 'vitest';
import { computeVelocity, computePhaseMetrics } from '../deploymentProgress';
import { ThanosDeploymentLog, ThanosDeployment } from '@/features/rollup/schemas/thanos-deployments';

function makeLog(message: string, createdAt: Date): ThanosDeploymentLog {
  return { id: '1', stack_id: 's1', deployment_id: 'd1', message, created_at: createdAt.toISOString() };
}

function makeDeployment(overrides: Partial<ThanosDeployment> = {}): ThanosDeployment {
  return {
    id: 'd1',
    stack_id: 's1',
    step: 'deploy-aws-infra',
    status: 'InProgress',
    started_at: new Date(0).toISOString(),
    ...overrides,
  };
}

const BASE = new Date('2024-01-01T00:00:00Z').getTime();

describe('computeVelocity', () => {
  it('returns null for empty logs', () => {
    expect(computeVelocity([])).toBeNull();
  });

  it('returns null for single step log (need >= 2 samples)', () => {
    const logs = [makeLog('[deployer] Step 3/18: foo', new Date(BASE))];
    expect(computeVelocity(logs)).toBeNull();
  });

  it('returns null when no step N/M logs present', () => {
    const logs = [
      makeLog('some random log line', new Date(BASE)),
      makeLog('another log', new Date(BASE + 5000)),
    ];
    expect(computeVelocity(logs)).toBeNull();
  });

  it('computes velocity from two step N/M logs', () => {
    const logs = [
      makeLog('[deployer] Step 1/18: something', new Date(BASE)),
      makeLog('[deployer] Step 3/18: something else', new Date(BASE + 20_000)),
    ];
    // 2 substeps in 20 sec = 0.1 substeps/sec
    const v = computeVelocity(logs);
    expect(v).toBeCloseTo(0.1, 5);
  });

  it('uses last 5 samples when fewer than 5 in last 60s', () => {
    const logs = [
      makeLog('Step 1/18: a', new Date(BASE - 200_000)), // outside 60s window
      makeLog('Step 2/18: b', new Date(BASE - 150_000)), // outside 60s window
      makeLog('Step 3/18: c', new Date(BASE - 100_000)), // outside 60s window
      makeLog('Step 5/18: d', new Date(BASE - 50_000)),  // outside 60s window
      makeLog('Step 6/18: e', new Date(BASE)),            // now (reference point)
    ];
    // Uses last 5 samples: step 1 → step 6 over 200s = 5/200 = 0.025 substeps/sec
    const v = computeVelocity(logs);
    expect(v).toBeCloseTo(0.025, 5);
  });

  it('parses JSON-wrapped log messages', () => {
    const logs = [
      makeLog(JSON.stringify({ msg: '[deployer] Step 2/18: foo' }), new Date(BASE)),
      makeLog(JSON.stringify({ msg: '[deployer] Step 4/18: bar' }), new Date(BASE + 10_000)),
    ];
    const v = computeVelocity(logs);
    expect(v).toBeCloseTo(0.2, 5);
  });

  it('returns null when substep count does not increase', () => {
    const logs = [
      makeLog('Step 5/18: foo', new Date(BASE)),
      makeLog('Step 5/18: still here', new Date(BASE + 10_000)),
    ];
    expect(computeVelocity(logs)).toBeNull();
  });
});

describe('computePhaseMetrics', () => {
  it('computes elapsedMs from min(started_at) across all phase rows', () => {
    const row1 = makeDeployment({ id: 'r1', step: 'deploy-l1-contracts', started_at: new Date(BASE).toISOString() });
    const row2 = makeDeployment({ id: 'r2', step: 'deploy-aws-infra', started_at: new Date(BASE + 5_000).toISOString() });
    const now = BASE + 30_000;
    const metrics = computePhaseMetrics([row1, row2], [
      { row: row1, logProgress: null, velocity: null },
      { row: row2, logProgress: null, velocity: null },
    ], now);
    // sessionStartMs = BASE (min of both)
    expect(metrics.elapsedMs).toBe(30_000);
  });

  it('returns etaMs = null when no velocity data', () => {
    const row = makeDeployment();
    const metrics = computePhaseMetrics([row], [
      { row, logProgress: { current: 5, total: 18 }, velocity: null },
    ], BASE + 60_000);
    expect(metrics.etaMs).toBeNull();
    expect(metrics.progress).toBeNull();
  });

  it('computes etaMs from velocity and remaining substeps', () => {
    const row = makeDeployment({ started_at: new Date(BASE).toISOString() });
    const now = BASE + 30_000;
    const metrics = computePhaseMetrics([row], [
      { row, logProgress: { current: 5, total: 18 }, velocity: 0.1 },
    ], now);
    // remaining = 13 substeps, velocity = 0.1/sec → 130s = 130_000ms
    expect(metrics.etaMs).toBeCloseTo(130_000, -2);
  });

  it('uses max(remaining) for parallel InProgress rows', () => {
    const now = BASE + 30_000;
    const row1 = makeDeployment({ id: 'r1', step: 'deploy-l1-contracts', started_at: new Date(BASE).toISOString() });
    const row2 = makeDeployment({ id: 'r2', step: 'deploy-aws-infra', started_at: new Date(BASE).toISOString() });
    const metrics = computePhaseMetrics([row1, row2], [
      { row: row1, logProgress: null, velocity: null },
      { row: row2, logProgress: { current: 5, total: 18 }, velocity: 0.1 },
    ], now);
    // row1 has no velocity → rowRemainingMs[0] = null → currentRemainingMs = null → etaMs = null
    expect(metrics.etaMs).toBeNull();
  });

  it('includes completed step actual duration in total', () => {
    const completedRow = makeDeployment({
      id: 'r1',
      step: 'deploy-l1-contracts',
      status: 'Success',
      started_at: new Date(BASE).toISOString(),
      finished_at: new Date(BASE + 60_000).toISOString(), // 60s actual
    });
    const currentRow = makeDeployment({
      id: 'r2',
      step: 'deploy-aws-infra',
      status: 'InProgress',
      started_at: new Date(BASE + 60_000).toISOString(),
    });
    const now = BASE + 90_000; // 30s into current step
    const metrics = computePhaseMetrics([completedRow, currentRow], [
      { row: currentRow, logProgress: { current: 3, total: 18 }, velocity: 0.1 },
    ], now);
    // currentRemainingMs = 15 substeps / 0.1/s = 150s = 150_000ms
    // totalMs = 60_000 (completed) + 30_000 (current elapsed) + 150_000 (remaining) = 240_000ms
    // progress = (60_000 + 30_000) / 240_000 = 0.375
    expect(metrics.progress).toBeCloseTo(0.375, 3);
  });

  it('progress is capped at 1', () => {
    const row = makeDeployment({ started_at: new Date(BASE).toISOString() });
    const now = BASE + 100_000;
    const metrics = computePhaseMetrics([row], [
      { row, logProgress: { current: 18, total: 18 }, velocity: 0.1 },
    ], now);
    // remaining = 0 → etaMs = 0 → totalMs = currentElapsed → progress = 1
    expect(metrics.progress).toBeLessThanOrEqual(1);
  });

  it('reports correct stepIndex for sequential steps', () => {
    const done = makeDeployment({ id: 'r1', status: 'Success', step: 'deploy-l1-contracts', started_at: new Date(BASE).toISOString(), finished_at: new Date(BASE + 60_000).toISOString() });
    const current = makeDeployment({ id: 'r2', step: 'deploy-aws-infra', started_at: new Date(BASE + 60_000).toISOString() });
    const pending = makeDeployment({ id: 'r3', step: 'deploy-local-infra', status: 'Pending', started_at: new Date(BASE).toISOString() });
    const metrics = computePhaseMetrics([done, current, pending], [
      { row: current, logProgress: null, velocity: null },
    ], BASE + 90_000);
    expect(metrics.stepIndex).toBe(2); // 1 completed + 1 (current)
    expect(metrics.stepTotal).toBe(3);
  });
});
