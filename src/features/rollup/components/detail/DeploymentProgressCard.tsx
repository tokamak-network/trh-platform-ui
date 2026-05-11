"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import { useThanosDeploymentsQuery, useThanosDeploymentLogsQuery } from "@/features/rollup/api/queries";
import { formatDuration, formatEtaMs } from "@/features/rollup/utils/durationUtils";
import { classifyLogLevel } from "@/features/rollup/utils/logLevel";
import { categorizeStep } from "@/features/rollup/utils/deploymentSteps";
import { extractStepProgress } from "@/features/rollup/utils/deploymentSubtask";
import { LogDialog } from "@/features/rollup/components/detail/LogDialog";
import { ThanosDeployment } from "@/features/rollup/schemas/thanos-deployments";
import toast from "react-hot-toast";

function parseFirstErrorText(raw: string): string {
  try {
    const p = JSON.parse(raw);
    const t = p.msg ?? p.message ?? raw;
    return typeof t === 'string' ? t : raw;
  } catch {
    return raw;
  }
}

function ActivityLine({ deployment, stackId }: { deployment: ThanosDeployment; stackId: string }) {
  const [logOpen, setLogOpen] = React.useState(false);

  const { data: logs = [] } = useThanosDeploymentLogsQuery(
    deployment.stack_id,
    deployment.id,
    { limit: 100, refetchIntervalMs: 5000 }
  );

  const firstError = React.useMemo(
    () => logs.find((l) => classifyLogLevel(l.message) === 'error'),
    [logs]
  );

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {firstError && (
          <span className="flex items-center gap-1 text-xs text-red-600 italic truncate max-w-[300px]">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {parseFirstErrorText(firstError.message).slice(0, 100)}
          </span>
        )}
        <button
          onClick={() => setLogOpen(true)}
          className={`text-xs px-2 py-0.5 rounded border transition-colors shrink-0 ${
            firstError
              ? 'border-red-300 text-red-600 hover:bg-red-50'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Logs →
        </button>
      </div>
      <LogDialog open={logOpen} onOpenChange={setLogOpen} deployment={deployment} stackId={stackId} />
    </>
  );
}

function MetricBox({
  label,
  value,
  hint,
  muted = false,
}: {
  label: string;
  value: string;
  hint?: string;
  muted?: boolean;
}) {
  return (
    <div className={`rounded-xl bg-white/60 backdrop-blur-sm px-3 py-2.5 transition-opacity ${muted ? 'opacity-40' : ''}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className="text-xl font-bold tabular-nums text-slate-900 leading-tight">{value}</p>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p>}
    </div>
  );
}

interface DeploymentProgressCardInnerProps {
  primaryStep: ThanosDeployment;
  sessionStartMs: number;
  now: number;
  isIntegrationPhase: boolean;
  stackId: string;
}

function DeploymentProgressCardInner({
  primaryStep,
  sessionStartMs,
  now,
  isIntegrationPhase,
  stackId,
}: DeploymentProgressCardInnerProps) {
  const { data: logs = [] } = useThanosDeploymentLogsQuery(
    primaryStep.stack_id,
    primaryStep.id,
    { limit: 5000, refetchIntervalMs: 5000 }
  );

  const stepProgress = React.useMemo(() => extractStepProgress(logs), [logs]);

  const elapsedMs = now - sessionStartMs;
  const pct = stepProgress && stepProgress.total > 0
    ? stepProgress.current / stepProgress.total
    : null;
  const etaMs = pct && pct > 0 ? Math.round(elapsedMs / pct) - elapsedMs : null;
  const etaAbsolute = etaMs != null
    ? new Date(now + etaMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const wallClock = formatDuration(new Date(sessionStartMs).toISOString(), undefined, now);
  const progressPct = pct != null ? Math.round(pct * 100) : null;

  const stepLabel = primaryStep.step
    .replace(/^(deploy-|install-)/, '')
    .replace(/-/g, ' ');

  const accent = isIntegrationPhase
    ? { bar: 'bg-emerald-500', spinner: 'text-emerald-600', label: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', card: 'from-emerald-50 to-green-100' }
    : { bar: 'bg-blue-500', spinner: 'text-blue-600', label: 'text-blue-700', badge: 'bg-blue-100 text-blue-700 border-blue-200', card: 'from-blue-50 to-indigo-100' };

  return (
    <Card className={`border-0 shadow-xl bg-gradient-to-br ${accent.card}`}>
      <CardContent className="pt-5 pb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Loader2 className={`w-4 h-4 animate-spin ${accent.spinner}`} />
            <span className={`text-xs font-semibold uppercase tracking-wide ${accent.label}`}>
              {isIntegrationPhase ? 'Installing Integrations' : 'Deployment in progress'}
            </span>
          </div>
          <Badge variant="outline" className={`flex items-center gap-1 shrink-0 ${accent.badge}`}>
            <Loader2 className="w-3 h-3 animate-spin" />
            In Progress
          </Badge>
        </div>

        {isIntegrationPhase && (
          <p className="text-xs text-slate-500 mb-2">
            Chain is deployed. Integrations are continuing in the background.
          </p>
        )}

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 my-3">
          <MetricBox label="Elapsed" value={wallClock} />
          <MetricBox
            label="ETA"
            value={etaMs != null ? formatEtaMs(etaMs) : '—'}
            hint={etaAbsolute ?? 'calculating…'}
            muted={etaMs == null}
          />
          <MetricBox
            label="Progress"
            value={progressPct != null ? `${progressPct}%` : '—'}
            hint={stepProgress ? `step ${stepProgress.current} / ${stepProgress.total}` : 'no step data'}
            muted={progressPct == null}
          />
        </div>

        {/* Progress bar */}
        {progressPct != null && (
          <div className="mb-3">
            <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-1">
              <span className="capitalize">{stepLabel}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/50 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${accent.bar}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Error / Logs */}
        <ActivityLine deployment={primaryStep} stackId={stackId} />
      </CardContent>
    </Card>
  );
}

interface DeploymentProgressCardProps {
  stackId?: string;
}

export function DeploymentProgressCard({ stackId }: DeploymentProgressCardProps) {
  const { data: deployments = [] } = useThanosDeploymentsQuery(stackId);
  const [now, setNow] = React.useState(Date.now());

  const active = React.useMemo(
    () => deployments.filter((d) => d.status === "InProgress" || d.status === "Pending"),
    [deployments]
  );
  const coreActive = React.useMemo(
    () => active.filter((d) => categorizeStep(d.step) === 'core'),
    [active]
  );
  const integrationActive = React.useMemo(
    () => active.filter((d) => categorizeStep(d.step) === 'integration'),
    [active]
  );

  const phase: 'core' | 'integration' | null =
    coreActive.length > 0 ? 'core'
    : integrationActive.length > 0 ? 'integration'
    : null;

  const activeRows = phase === 'core' ? coreActive : integrationActive;

  const prevCoreCountRef = React.useRef(coreActive.length);
  React.useEffect(() => {
    const wasCore = prevCoreCountRef.current > 0;
    const noCoreNow = coreActive.length === 0;
    if (wasCore && noCoreNow && integrationActive.length > 0) {
      toast.success('Chain deployed. Integrations will continue installing in the background.');
    }
    prevCoreCountRef.current = coreActive.length;
  }, [coreActive.length, integrationActive.length]);

  React.useEffect(() => {
    if (activeRows.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeRows.length]);

  if (!phase) return null;

  const sessionStartMs = Math.min(
    ...activeRows.map((d) => new Date(d.started_at).getTime())
  );
  const primaryStep = activeRows.reduce((a, b) =>
    new Date(a.started_at) <= new Date(b.started_at) ? a : b
  );

  return (
    <DeploymentProgressCardInner
      primaryStep={primaryStep}
      sessionStartMs={sessionStartMs}
      now={now}
      isIntegrationPhase={phase === 'integration'}
      stackId={stackId ?? ''}
    />
  );
}
