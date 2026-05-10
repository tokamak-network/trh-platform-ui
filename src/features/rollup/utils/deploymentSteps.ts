export type DeploymentCategory = 'core' | 'integration';

const CORE_STEPS = new Set([
  'deploy-l1-contracts',
  'deploy-aws-infra',
]);

const INTEGRATION_STEPS = new Set([
  'install-bridge',
  'install-block-explorer',
  'install-monitoring',
  'install-drb',
  'register-candidate',
]);

export function categorizeStep(step: string): DeploymentCategory | 'unknown' {
  if (CORE_STEPS.has(step)) return 'core';
  if (INTEGRATION_STEPS.has(step)) return 'integration';
  return 'unknown';
}
