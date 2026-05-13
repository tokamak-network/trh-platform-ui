import { describe, it, expect } from 'vitest';
import { groupIntoSessions } from '../sessionGrouping';
import { ThanosDeployment } from '@/features/rollup/schemas/thanos-deployments';

function makeDeployment(overrides: Partial<ThanosDeployment> = {}): ThanosDeployment {
  return {
    id: 'd1',
    stack_id: 's1',
    step: 'deploy-aws-infra',
    status: 'Success',
    started_at: new Date(0).toISOString(),
    ...overrides,
  };
}

const T0 = new Date('2026-05-13T03:04:59Z');
const T = (offsetMs: number) => new Date(T0.getTime() + offsetMs).toISOString();

describe('groupIntoSessions', () => {
  it('returns empty array for empty input', () => {
    expect(groupIntoSessions([])).toEqual([]);
  });

  it('puts a single deployment in one session', () => {
    const d = makeDeployment({ started_at: T(0) });
    const sessions = groupIntoSessions([d]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].rows).toHaveLength(1);
  });

  it('groups parallel deployments (same start time) into one session', () => {
    const d1 = makeDeployment({ id: 'd1', step: 'deploy-l1-contracts', started_at: T(0), finished_at: T(627_000) });
    const d2 = makeDeployment({ id: 'd2', step: 'deploy-aws-infra', started_at: T(0), finished_at: T(2438_000) });
    const sessions = groupIntoSessions([d1, d2]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].rows).toHaveLength(2);
  });

  it('groups sequential steps within 5 min gap into one session', () => {
    // aws-infra finishes, then install steps start 4 seconds later
    const d1 = makeDeployment({ id: 'd1', step: 'deploy-aws-infra', started_at: T(0), finished_at: T(2438_000) });
    const d2 = makeDeployment({ id: 'd2', step: 'install-cross-trade-bridge', started_at: T(2438_000 + 4_000), finished_at: T(2438_000 + 4_000 + 1028_000) });
    const sessions = groupIntoSessions([d1, d2]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].rows).toHaveLength(2);
  });

  it('creates new session when gap > 5 minutes', () => {
    const d1 = makeDeployment({ id: 'd1', started_at: T(0), finished_at: T(627_000) });
    const gapMs = 6 * 60_000; // 6 min gap
    const d2 = makeDeployment({ id: 'd2', step: 'install-bridge', started_at: T(627_000 + gapMs) });
    const sessions = groupIntoSessions([d1, d2]);
    expect(sessions).toHaveLength(2);
  });

  it('sets startedAt to min(started_at) of session rows', () => {
    const d1 = makeDeployment({ id: 'd1', step: 'deploy-l1-contracts', started_at: T(0), finished_at: T(627_000) });
    const d2 = makeDeployment({ id: 'd2', step: 'deploy-aws-infra', started_at: T(1_000), finished_at: T(2438_000) });
    const sessions = groupIntoSessions([d1, d2]);
    expect(sessions[0].startedAt).toBe(T(0));
  });

  it('sets finishedAt to max(finished_at) of session rows', () => {
    const d1 = makeDeployment({ id: 'd1', step: 'deploy-l1-contracts', started_at: T(0), finished_at: T(627_000) });
    const d2 = makeDeployment({ id: 'd2', step: 'deploy-aws-infra', started_at: T(0), finished_at: T(2438_000) });
    const sessions = groupIntoSessions([d1, d2]);
    expect(sessions[0].finishedAt).toBe(T(2438_000));
  });

  it('returns sessions in reverse chronological order (newest first)', () => {
    const d1 = makeDeployment({ id: 'd1', started_at: T(0), finished_at: T(600_000) });
    const gapMs = 10 * 60_000;
    const d2 = makeDeployment({ id: 'd2', step: 'install-bridge', started_at: T(600_000 + gapMs) });
    const sessions = groupIntoSessions([d1, d2]);
    expect(sessions[0].startedAt).toBe(T(600_000 + gapMs)); // newer first
    expect(sessions[1].startedAt).toBe(T(0));
  });

  it('handles step with no finished_at (in-progress)', () => {
    const d1 = makeDeployment({ id: 'd1', step: 'deploy-aws-infra', status: 'InProgress', started_at: T(0), finished_at: undefined });
    const sessions = groupIntoSessions([d1]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].finishedAt).toBeUndefined();
  });

  it('groups full deployment run into one session', () => {
    // Simulates the baseline data: deploy-l1-contracts || deploy-aws-infra → install-system-pulse || install-cross-trade-bridge
    const d1 = makeDeployment({ id: 'd1', step: 'deploy-l1-contracts', started_at: T(0), finished_at: T(627_000) });
    const d2 = makeDeployment({ id: 'd2', step: 'deploy-aws-infra', started_at: T(0), finished_at: T(2438_000) });
    const d3 = makeDeployment({ id: 'd3', step: 'install-system-pulse', started_at: T(2438_000 + 4_000), finished_at: T(2438_000 + 4_000 + 2_600) });
    const d4 = makeDeployment({ id: 'd4', step: 'install-cross-trade-bridge', started_at: T(2438_000 + 4_000), finished_at: T(2438_000 + 4_000 + 1028_000) });
    const sessions = groupIntoSessions([d1, d2, d3, d4]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].rows).toHaveLength(4);
  });
});
