export type DeploymentCategory = 'core' | 'integration';

const CORE_STEPS = new Set([
  'deploy-l1-contracts',
  'deploy-aws-infra',
  'deploy-local-infra',
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

export const STEP_DISPLAY_NAMES: Record<string, string> = {
  'deploy-l1-contracts': 'Deploying L1 contracts',
  'deploy-aws-infra': 'Provisioning AWS infrastructure',
  'deploy-local-infra': 'Starting local chain',
  'install-bridge': 'Installing Bridge',
  'install-block-explorer': 'Installing Block Explorer',
  'install-monitoring': 'Installing Monitoring',
  'install-drb': 'Installing DRB',
  'register-candidate': 'Registering operator candidate',
};

export function getStepDisplayName(step: string): string {
  return STEP_DISPLAY_NAMES[step] ?? step.replace(/-/g, ' ');
}
