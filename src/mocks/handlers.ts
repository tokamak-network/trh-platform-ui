import { http, HttpResponse } from 'msw';
import { MOCK_PRESETS, MOCK_PRESET_DETAILS } from '@/features/rollup/schemas/preset';

export let fundingScenario: 'unfunded' | 'funded' = 'unfunded';

export function setFundingScenario(scenario: 'unfunded' | 'funded'): void {
  fundingScenario = scenario;
}

// ---------------------------------------------------------------------------
// Mock deployed stacks – one per preset with a non-TON fee token
// ---------------------------------------------------------------------------

const MOCK_STACKS = [
  {
    id: 'mock-general-eth-001',
    name: 'Thanos',
    type: 'optimistic-rollup',
    network: 'Testnet',
    status: 'Deployed',
    config: {
      network: 'Testnet',
      chainName: 'general-eth',
      presetId: 'general',
      feeToken: 'ETH',
      infraProvider: 'local',
      l1RpcUrl: 'https://eth-sepolia.example.com',
      l1BeaconUrl: 'https://ethereum-sepolia-beacon-api.publicnode.com',
      awsRegion: '',
      awsAccessKey: '',
      awsSecretAccessKey: '',
      l2BlockTime: 2,
      batchSubmissionFrequency: 1800,
      outputRootFrequency: 1800,
      challengePeriod: 10,
      adminAccount: '0x1111111111111111111111111111111111111111',
      sequencerAccount: '0x2222222222222222222222222222222222222222',
      batcherAccount: '0x3333333333333333333333333333333333333333',
      proposerAccount: '0x4444444444444444444444444444444444444444',
      challengerAccount: '0x5555555555555555555555555555555555555555',
      deploymentPath: '/app/storage/deployments/Thanos/Testnet/general-eth',
    },
    metadata: {
      layer1: 'Ethereum Sepolia',
      layer2: 'Thanos Stack',
      l2RpcUrl: 'http://localhost:8545',
      bridgeUrl: 'http://localhost:3001',
      explorerUrl: 'http://localhost:4001',
      monitoringUrl: 'http://localhost:3002',
      l1ChainId: 11155111,
      l2ChainId: 111551111,
    },
    deployment_path: '/app/storage/deployments/Thanos/Testnet/general-eth',
    created_at: '2026-03-29T00:00:00Z',
    updated_at: '2026-03-29T01:00:00Z',
    deleted_at: null,
  },
  {
    id: 'mock-defi-usdt-001',
    name: 'Thanos',
    type: 'optimistic-rollup',
    network: 'Testnet',
    status: 'Deployed',
    config: {
      network: 'Testnet',
      chainName: 'defi-usdt',
      presetId: 'defi',
      feeToken: 'USDT',
      infraProvider: 'local',
      l1RpcUrl: 'https://eth-sepolia.example.com',
      l1BeaconUrl: 'https://ethereum-sepolia-beacon-api.publicnode.com',
      awsRegion: '',
      awsAccessKey: '',
      awsSecretAccessKey: '',
      l2BlockTime: 2,
      batchSubmissionFrequency: 900,
      outputRootFrequency: 900,
      challengePeriod: 10,
      adminAccount: '0x1111111111111111111111111111111111111111',
      sequencerAccount: '0x2222222222222222222222222222222222222222',
      batcherAccount: '0x3333333333333333333333333333333333333333',
      proposerAccount: '0x4444444444444444444444444444444444444444',
      challengerAccount: '0x5555555555555555555555555555555555555555',
      deploymentPath: '/app/storage/deployments/Thanos/Testnet/defi-usdt',
    },
    metadata: {
      layer1: 'Ethereum Sepolia',
      layer2: 'Thanos Stack',
      l2RpcUrl: 'http://localhost:8545',
      bridgeUrl: 'http://localhost:3001',
      explorerUrl: 'http://localhost:4001',
      monitoringUrl: 'http://localhost:3002',
      l1ChainId: 11155111,
      l2ChainId: 111551112,
    },
    deployment_path: '/app/storage/deployments/Thanos/Testnet/defi-usdt',
    created_at: '2026-03-29T00:00:00Z',
    updated_at: '2026-03-29T01:00:00Z',
    deleted_at: null,
  },
  {
    id: 'mock-gaming-eth-001',
    name: 'Thanos',
    type: 'optimistic-rollup',
    network: 'Testnet',
    status: 'Deployed',
    config: {
      network: 'Testnet',
      chainName: 'gaming-eth',
      presetId: 'gaming',
      feeToken: 'ETH',
      infraProvider: 'local',
      l1RpcUrl: 'https://eth-sepolia.example.com',
      l1BeaconUrl: 'https://ethereum-sepolia-beacon-api.publicnode.com',
      awsRegion: '',
      awsAccessKey: '',
      awsSecretAccessKey: '',
      l2BlockTime: 2,
      batchSubmissionFrequency: 300,
      outputRootFrequency: 600,
      challengePeriod: 10,
      adminAccount: '0x1111111111111111111111111111111111111111',
      sequencerAccount: '0x2222222222222222222222222222222222222222',
      batcherAccount: '0x3333333333333333333333333333333333333333',
      proposerAccount: '0x4444444444444444444444444444444444444444',
      challengerAccount: '0x5555555555555555555555555555555555555555',
      deploymentPath: '/app/storage/deployments/Thanos/Testnet/gaming-eth',
    },
    metadata: {
      layer1: 'Ethereum Sepolia',
      layer2: 'Thanos Stack',
      l2RpcUrl: 'http://localhost:8545',
      bridgeUrl: 'http://localhost:3001',
      explorerUrl: 'http://localhost:4001',
      monitoringUrl: 'http://localhost:3002',
      l1ChainId: 11155111,
      l2ChainId: 111551113,
    },
    deployment_path: '/app/storage/deployments/Thanos/Testnet/gaming-eth',
    created_at: '2026-03-29T00:00:00Z',
    updated_at: '2026-03-29T01:00:00Z',
    deleted_at: null,
  },
  {
    id: 'mock-full-usdc-001',
    name: 'Thanos',
    type: 'optimistic-rollup',
    network: 'Testnet',
    status: 'Deployed',
    config: {
      network: 'Testnet',
      chainName: 'full-usdc',
      presetId: 'full',
      feeToken: 'USDC',
      infraProvider: 'local',
      l1RpcUrl: 'https://eth-sepolia.example.com',
      l1BeaconUrl: 'https://ethereum-sepolia-beacon-api.publicnode.com',
      awsRegion: '',
      awsAccessKey: '',
      awsSecretAccessKey: '',
      l2BlockTime: 2,
      batchSubmissionFrequency: 600,
      outputRootFrequency: 600,
      challengePeriod: 10,
      adminAccount: '0x1111111111111111111111111111111111111111',
      sequencerAccount: '0x2222222222222222222222222222222222222222',
      batcherAccount: '0x3333333333333333333333333333333333333333',
      proposerAccount: '0x4444444444444444444444444444444444444444',
      challengerAccount: '0x5555555555555555555555555555555555555555',
      deploymentPath: '/app/storage/deployments/Thanos/Testnet/full-usdc',
    },
    metadata: {
      layer1: 'Ethereum Sepolia',
      layer2: 'Thanos Stack',
      l2RpcUrl: 'http://localhost:8545',
      bridgeUrl: 'http://localhost:3001',
      explorerUrl: 'http://localhost:4001',
      monitoringUrl: 'http://localhost:3002',
      l1ChainId: 11155111,
      l2ChainId: 111551114,
    },
    deployment_path: '/app/storage/deployments/Thanos/Testnet/full-usdc',
    created_at: '2026-03-29T00:00:00Z',
    updated_at: '2026-03-29T01:00:00Z',
    deleted_at: null,
  },
];

const MOCK_STACK_MAP: Record<string, typeof MOCK_STACKS[0]> = Object.fromEntries(
  MOCK_STACKS.map(s => [s.id, s])
);

const MOCK_INTEGRATIONS = (stackId: string) => {
  const stack = MOCK_STACK_MAP[stackId];
  const preset = stack?.config.presetId ?? 'general';
  const hasExplorer = ['defi', 'gaming', 'full'].includes(preset);
  const hasMonitoring = ['defi', 'gaming', 'full'].includes(preset);

  const integrations: Array<{
    id: string; type: string; status: string;
    url: string; installedAt: string;
  }> = [
    {
      id: `${stackId}-bridge`,
      type: 'bridge',
      status: 'Installed',
      url: stack?.metadata?.bridgeUrl ?? 'http://localhost:3001',
      installedAt: '2026-03-29T01:00:00Z',
    },
  ];
  if (hasExplorer) {
    integrations.push({
      id: `${stackId}-blockexplorer`,
      type: 'blockExplorer',
      status: 'Installed',
      url: stack?.metadata?.explorerUrl ?? 'http://localhost:4001',
      installedAt: '2026-03-29T01:00:00Z',
    });
  }
  if (hasMonitoring) {
    integrations.push({
      id: `${stackId}-monitoring`,
      type: 'monitoring',
      status: 'Installed',
      url: stack?.metadata?.monitoringUrl ?? 'http://localhost:3002',
      installedAt: '2026-03-29T01:00:00Z',
    });
  }
  return integrations;
};

export const handlers = [
  // Auth
  http.get('/api/proxy/auth/profile', () => {
    return HttpResponse.json({
      id: 'test-user',
      email: 'admin@gmail.com',
      role: 'Admin',
    });
  }),

  http.post('/api/proxy/auth/login', () => {
    return HttpResponse.json({
      data: { token: 'mock-jwt-token', user: { id: 'test-user', email: 'admin@gmail.com', role: 'Admin' } },
      success: true,
    });
  }),

  // Presets
  http.get('/api/proxy/stacks/thanos/presets', () => {
    return HttpResponse.json({ data: MOCK_PRESETS, success: true });
  }),

  http.get('/api/proxy/stacks/thanos/presets/:id', ({ params }) => {
    const preset = MOCK_PRESET_DETAILS[params.id as string];
    if (!preset) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ data: preset, success: true });
  }),

  // Preset deployment
  http.post('/api/proxy/stacks/thanos/preset-deploy', () => {
    return HttpResponse.json({
      data: { deploymentId: 'test-deploy-001' },
      success: true,
    });
  }),

  http.get('/api/proxy/stacks/thanos/preset-deploy/:id/funding', () => {
    if (fundingScenario === 'funded') {
      return HttpResponse.json({
        data: {
          deploymentId: 'test-deploy-001',
          status: 'ready',
          accounts: [
            { role: 'admin', address: '0x1111111111111111111111111111111111111111', requiredWei: '500000000000000000', currentWei: '500000000000000000', fulfilled: true },
            { role: 'sequencer', address: '0x2222222222222222222222222222222222222222', requiredWei: '500000000000000000', currentWei: '500000000000000000', fulfilled: true },
            { role: 'batcher', address: '0x3333333333333333333333333333333333333333', requiredWei: '500000000000000000', currentWei: '500000000000000000', fulfilled: true },
            { role: 'proposer', address: '0x4444444444444444444444444444444444444444', requiredWei: '500000000000000000', currentWei: '500000000000000000', fulfilled: true },
          ],
          allFulfilled: true,
        },
        success: true,
      });
    }
    return HttpResponse.json({
      data: {
        deploymentId: 'test-deploy-001',
        status: 'funding',
        accounts: [
          { role: 'admin', address: '0x1111111111111111111111111111111111111111', requiredWei: '500000000000000000', currentWei: '0', fulfilled: false },
          { role: 'sequencer', address: '0x2222222222222222222222222222222222222222', requiredWei: '500000000000000000', currentWei: '0', fulfilled: false },
          { role: 'batcher', address: '0x3333333333333333333333333333333333333333', requiredWei: '500000000000000000', currentWei: '0', fulfilled: false },
          { role: 'proposer', address: '0x4444444444444444444444444444444444444444', requiredWei: '500000000000000000', currentWei: '0', fulfilled: false },
        ],
        allFulfilled: false,
      },
      success: true,
    });
  }),

  // Stack list (must come before /:id to avoid route conflict)
  http.get('/api/proxy/stacks/thanos', () => {
    return HttpResponse.json({
      status: 200,
      message: 'Successfully',
      data: { stacks: MOCK_STACKS },
    });
  }),

  // Stack detail
  http.get('/api/proxy/stacks/thanos/:id', ({ params }) => {
    const stack = MOCK_STACK_MAP[params.id as string];
    if (!stack) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      status: 200,
      message: 'Successfully',
      data: { stack },
    });
  }),

  // Integrations
  http.get('/api/proxy/stacks/thanos/:id/integrations', ({ params }) => {
    return HttpResponse.json({
      status: 200,
      message: 'Successfully',
      data: { integrations: MOCK_INTEGRATIONS(params.id as string) },
    });
  }),

  // Deployments history
  http.get('/api/proxy/stacks/thanos/:id/deployments', ({ params }) => {
    const stack = MOCK_STACK_MAP[params.id as string];
    return HttpResponse.json({
      status: 200,
      message: 'Successfully',
      data: {
        deployments: [
          {
            id: `${params.id as string}-deploy-1`,
            stackId: params.id,
            status: 'completed',
            createdAt: stack?.created_at ?? '2026-03-29T00:00:00Z',
            completedAt: stack?.updated_at ?? '2026-03-29T01:00:00Z',
            logs: ['Deploying...', 'Deployment complete'],
          },
        ],
      },
    });
  }),

  // Logs
  http.get('/api/proxy/stacks/thanos/:id/logs', () => {
    return HttpResponse.json({
      status: 200,
      message: 'Successfully',
      data: { logs: [] },
    });
  }),
];
