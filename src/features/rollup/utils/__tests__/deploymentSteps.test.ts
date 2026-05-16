import { describe, it, expect } from 'vitest';
import { categorizeStep, getStepDisplayName } from '../deploymentSteps';

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

describe('getStepDisplayName', () => {
  it('returns display name for known core steps', () => {
    expect(getStepDisplayName('deploy-l1-contracts')).toBe('Deploying L1 contracts');
    expect(getStepDisplayName('deploy-aws-infra')).toBe('Provisioning AWS infrastructure');
    expect(getStepDisplayName('deploy-local-infra')).toBe('Starting local chain');
  });

  it('returns display name for known integration steps', () => {
    expect(getStepDisplayName('install-bridge')).toBe('Installing Bridge');
    expect(getStepDisplayName('install-block-explorer')).toBe('Installing Block Explorer');
    expect(getStepDisplayName('install-monitoring')).toBe('Installing Monitoring');
    expect(getStepDisplayName('install-drb')).toBe('Installing DRB');
    expect(getStepDisplayName('register-candidate')).toBe('Registering operator candidate');
  });

  it('falls back to humanized slug for unknown steps', () => {
    expect(getStepDisplayName('some-unknown-step')).toBe('some unknown step');
  });
});
