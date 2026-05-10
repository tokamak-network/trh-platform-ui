"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Loader2 } from "lucide-react";
import { useThanosDeploymentsQuery, useThanosDeploymentLogsQuery } from "@/features/rollup/api/queries";
import { formatDuration } from "@/features/rollup/utils/durationUtils";
import { extractCurrentSubtask } from "@/features/rollup/utils/deploymentSubtask";
import { classifyLogLevel } from "@/features/rollup/utils/logLevel";
import { categorizeStep } from "@/features/rollup/utils/deploymentSteps";
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

  const subtask = React.useMemo(() => extractCurrentSubtask(logs), [logs]);
  const firstError = React.useMemo(
    () => logs.find((l) => classifyLogLevel(l.message) === 'error'),
    [logs]
  );

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {firstError ? (
          <span className="flex items-center gap-1 text-xs text-red-600 italic truncate max-w-[300px]">
            <AlertCircle className="w-3 h-3 shrink-0" />
            {parseFirstErrorText(firstError.message).slice(0, 100)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground italic">
            ↳ {subtask?.label ?? 'Initializing…'}
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
      <LogDialog
        open={logOpen}
        onOpenChange={setLogOpen}
        deployment={deployment}
        stackId={stackId}
      />
    </>
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

  // Fire toast once when core finishes but integrations are still running
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
  const wallClock = formatDuration(new Date(sessionStartMs).toISOString(), undefined, now);

  const primaryStep = activeRows.reduce((a, b) =>
    new Date(a.started_at) <= new Date(b.started_at) ? a : b
  );

  const isIntegrationPhase = phase === 'integration';

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-100">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                {isIntegrationPhase ? 'Installing Integrations' : 'Deployment in progress'}
              </span>
            </div>
            {isIntegrationPhase && (
              <p className="text-xs text-slate-500 mb-2">
                Chain is deployed. Integrations are continuing in the background.
              </p>
            )}
            <div className="text-4xl font-semibold tabular-nums text-slate-900 mb-3">
              {wallClock}
            </div>
            <ActivityLine deployment={primaryStep} stackId={stackId ?? ''} />
          </div>
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1 shrink-0"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            In Progress
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
