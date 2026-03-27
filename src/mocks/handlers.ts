import { http, HttpResponse } from 'msw';
import { MOCK_PRESETS, MOCK_PRESET_DETAILS } from '@/features/rollup/schemas/preset';

// Mutable scenario flag for E2E test control (E2E-03)
export let fundingScenario: 'unfunded' | 'funded' = 'unfunded';

export function setFundingScenario(scenario: 'unfunded' | 'funded'): void {
  fundingScenario = scenario;
}

export const handlers = [
  // GET /api/proxy/stacks/thanos/presets — Preset list for step 1
  http.get('/api/proxy/stacks/thanos/presets', () => {
    return HttpResponse.json({
      data: MOCK_PRESETS,
      success: true,
    });
  }),

  // GET /api/proxy/stacks/thanos/presets/:id — Preset detail
  http.get('/api/proxy/stacks/thanos/presets/:id', ({ params }) => {
    const preset = MOCK_PRESET_DETAILS[params.id as string];
    if (!preset) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({
      data: preset,
      success: true,
    });
  }),

  // POST /api/proxy/stacks/thanos/preset-deploy — Deploy initiation
  http.post('/api/proxy/stacks/thanos/preset-deploy', () => {
    return HttpResponse.json({
      data: { deploymentId: 'test-deploy-001' },
      success: true,
    });
  }),

  // GET /api/proxy/stacks/thanos/preset-deploy/:id/funding — Funding status polling
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

  // GET /api/proxy/auth/profile — Auth profile (prevents redirect to /auth)
  // NOTE: authService.getCurrentUser() calls userSchema.parse(response) directly
  // (not response.data), so we return the user object without the API wrapper.
  http.get('/api/proxy/auth/profile', () => {
    return HttpResponse.json({
      id: 'test-user',
      email: 'admin@gmail.com',
      role: 'Admin',
    });
  }),

  // POST /api/proxy/auth/login — Login endpoint
  http.post('/api/proxy/auth/login', () => {
    return HttpResponse.json({
      data: { token: 'mock-jwt-token', user: { id: 'test-user', email: 'admin@gmail.com', role: 'Admin' } },
      success: true,
    });
  }),
];
