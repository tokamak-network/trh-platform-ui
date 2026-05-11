import { describe, it, expect } from 'vitest';
import { categorizeStep } from '../deploymentSteps';

describe('categorizeStep', () => {
  it('classifies deploy-l1-contracts as core', () => {
    expect(categorizeStep('deploy-l1-contracts')).toBe('core');
  });

  it('classifies deploy-aws-infra as core', () => {
    expect(categorizeStep('deploy-aws-infra')).toBe('core');
  });

  it('classifies deploy-local-infra as core', () => {
    expect(categorizeStep('deploy-local-infra')).toBe('core');
  });

  it('classifies install-bridge as integration', () => {
    expect(categorizeStep('install-bridge')).toBe('integration');
  });

  it('classifies unknown step as unknown', () => {
    expect(categorizeStep('some-unknown-step')).toBe('unknown');
  });
});
