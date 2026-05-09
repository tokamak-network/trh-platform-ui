import { ThanosDeployment } from '@/features/rollup/schemas/thanos-deployments';

const STEP_SHORT_NAMES: Record<string, string> = {
  'deploy-l1-contracts': 'L1 Contracts',
  'deploy-aws-infra': 'Infrastructure',
  'destroy-aws-infra': 'Destroy Infrastructure',
  'install-bridge': 'Bridge',
  'uninstall-bridge': 'Bridge',
  'install-block-explorer': 'Block Explorer',
  'uninstall-block-explorer': 'Block Explorer',
  'install-monitoring': 'Monitoring',
  'uninstall-monitoring': 'Monitoring',
  'install-drb': 'DRB Nodes',
  'register-candidate': 'DAO Registration',
};

export function getStepShortName(d: ThanosDeployment): string {
  if (d.step === 'deploy-aws-infra' && d.config) {
    const provider = d.config.infraProvider as string | undefined;
    if (provider === 'local') return 'Local Infrastructure';
    if (provider === 'aws') return 'AWS Infrastructure';
  }
  return STEP_SHORT_NAMES[d.step] ?? d.step.replace(/-/g, ' ');
}
