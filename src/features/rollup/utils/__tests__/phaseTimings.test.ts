import { describe, it, expect } from 'vitest';
import { extractAwsInfraPhases } from '../phaseTimings';
import { ThanosDeploymentLog } from '@/features/rollup/schemas/thanos-deployments';

function makeLog(message: string, createdAt: string): ThanosDeploymentLog {
  return { id: '1', stack_id: 's1', deployment_id: 'd1', message, created_at: createdAt };
}

const T0 = new Date('2026-05-13T03:04:59Z');
const T = (offsetMs: number) => new Date(T0.getTime() + offsetMs).toISOString();

describe('extractAwsInfraPhases', () => {
  it('returns all nulls for empty logs', () => {
    const phases = extractAwsInfraPhases([]);
    expect(phases.stageAStart).toBeNull();
    expect(phases.stageBStart).toBeNull();
    expect(phases.k8sDone).toBeNull();
    expect(phases.presetStart).toBeNull();
  });

  it('detects stage A start', () => {
    const phases = extractAwsInfraPhases([
      makeLog('Deploying Stage A AWS infrastructure (vpc/eks/efs/secretsmanager)', T(0)),
    ]);
    expect(phases.stageAStart).toBe(T(0));
  });

  it('detects stage B start', () => {
    const phases = extractAwsInfraPhases([
      makeLog('Deploying Thanos stack infrastructure (Stage B — full apply)', T(1000)),
    ]);
    expect(phases.stageBStart).toBe(T(1000));
  });

  it('detects k8s done from helm success log', () => {
    const phases = extractAwsInfraPhases([
      makeLog('✅ Helm charts installed successfully', T(2000)),
    ]);
    expect(phases.k8sDone).toBe(T(2000));
  });

  it('detects preset start', () => {
    const phases = extractAwsInfraPhases([
      makeLog('🔧 Installing preset modules for preset=full', T(3000)),
    ]);
    expect(phases.presetStart).toBe(T(3000));
  });

  it('parses JSON-wrapped log messages', () => {
    const phases = extractAwsInfraPhases([
      makeLog(JSON.stringify({ msg: 'Deploying Stage A AWS infrastructure (vpc/eks/efs/secretsmanager)' }), T(0)),
    ]);
    expect(phases.stageAStart).toBe(T(0));
  });

  it('strips ANSI escape codes', () => {
    const phases = extractAwsInfraPhases([
      makeLog('\x1b[32mDeploying Stage A AWS infrastructure (vpc/eks/efs)\x1b[0m', T(0)),
    ]);
    expect(phases.stageAStart).toBe(T(0));
  });

  it('takes the FIRST occurrence of each boundary', () => {
    const phases = extractAwsInfraPhases([
      makeLog('Deploying Stage A AWS infrastructure', T(0)),
      makeLog('Deploying Stage A AWS infrastructure', T(1000)), // duplicate
    ]);
    expect(phases.stageAStart).toBe(T(0));
  });

  it('extracts all phases from a realistic log sequence', () => {
    const logs = [
      makeLog('Deploying Stage A AWS infrastructure (vpc/eks/efs/secretsmanager)', T(0)),
      makeLog('module.vpc: Creating...', T(60_000)),
      makeLog('module.eks: Creating...', T(120_000)),
      makeLog('Deploying Thanos stack infrastructure (Stage B — full apply)', T(778_000)),
      makeLog('Installing helm release op-geth', T(800_000)),
      makeLog('✅ Helm charts installed successfully', T(1_066_000)),
      makeLog('✅ Genesis anchor state initialized in AnchorStateRegistry', T(1_291_000)),
      makeLog('🔧 Installing preset modules for preset=full', T(1_300_000)),
      makeLog('Installing helm release uptime-kuma', T(1_350_000)),
      makeLog('🎉 Thanos Stack installation completed successfully!', T(2_223_000)),
    ];
    const phases = extractAwsInfraPhases(logs);
    expect(phases.stageAStart).toBe(T(0));
    expect(phases.stageBStart).toBe(T(778_000));
    expect(phases.k8sDone).toBe(T(1_066_000));
    expect(phases.presetStart).toBe(T(1_300_000));
  });

  it('handles partial log sequence gracefully', () => {
    const logs = [
      makeLog('Deploying Stage A AWS infrastructure (vpc/eks/efs/secretsmanager)', T(0)),
      makeLog('module.vpc: Creating...', T(60_000)),
    ];
    const phases = extractAwsInfraPhases(logs);
    expect(phases.stageAStart).toBe(T(0));
    expect(phases.stageBStart).toBeNull();
    expect(phases.k8sDone).toBeNull();
    expect(phases.presetStart).toBeNull();
  });
});
