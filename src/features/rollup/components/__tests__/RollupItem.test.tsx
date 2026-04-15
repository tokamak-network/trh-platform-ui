import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { RollupItem } from '../RollupItem';
import { ThanosStack, ThanosStackStatus } from '../../schemas/thanos';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('react-hot-toast', () => ({
  toast: { loading: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../api/mutations', () => ({
  useDeleteRollupMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useResumeRollupMutation: () => ({ mutate: vi.fn(), isPending: false }),
  useStopRollupMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

function makeStack(status: ThanosStackStatus): ThanosStack {
  return {
    id: 'test-id',
    name: 'test-rollup',
    type: 'optimistic-rollup',
    network: 'testnet',
    status,
    config: {
      network: 'testnet',
      type: 'optimistic-rollup' as any,
      l1RpcUrl: '',
      awsRegion: '',
      chainName: 'Test Chain',
      l1BeaconUrl: '',
      l2BlockTime: 2,
      adminAccount: '',
      awsAccessKey: '',
      batcherAccount: '',
      deploymentPath: '',
      challengePeriod: 7,
      challengerAccount: '',
      proposerAccount: '',
      sequencerAccount: '',
      awsSecretAccessKey: '',
      outputRootFrequency: 1,
      batchSubmissionFrequency: 1,
    },
    deployment_path: '',
    metadata: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    deleted_at: null,
  };
}

describe('RollupItem destroy button', () => {
  it('is enabled for PENDING status so user can cancel a not-yet-started deployment', () => {
    render(<RollupItem stack={makeStack(ThanosStackStatus.PENDING)} />);
    const destroyBtn = screen.getByRole('button', { name: 'Destroy Rollup' });
    expect(destroyBtn).not.toBeDisabled();
  });

  it('is not rendered for TERMINATED status since infrastructure is already gone', () => {
    render(<RollupItem stack={makeStack(ThanosStackStatus.TERMINATED)} />);
    expect(screen.queryByRole('button', { name: 'Destroy Rollup' })).not.toBeInTheDocument();
  });
});
