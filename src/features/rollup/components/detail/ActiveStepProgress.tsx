'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useThanosDeploymentLogsQuery } from '@/features/rollup/api/queries';
import { ThanosDeployment } from '@/features/rollup/schemas/thanos-deployments';
import {
  extractCurrentSubtask,
  extractStepProgress,
} from '@/features/rollup/utils/deploymentSubtask';
import { classifyLogLevel } from '@/features/rollup/utils/logLevel';
import { getStepShortName } from '@/features/rollup/utils/stepNames';
import { LogDialog } from './LogDialog';

interface ActiveStepProgressProps {
  deployment: ThanosDeployment;
  stackId: string;
}

function parseFirstErrorText(raw: string): string {
  try {
    const p = JSON.parse(raw);
    const t = p.msg ?? p.message ?? raw;
    return typeof t === 'string' ? t : raw;
  } catch {
    return raw;
  }
}

export function ActiveStepProgress({ deployment, stackId }: ActiveStepProgressProps) {
  const [logOpen, setLogOpen] = React.useState(false);

  const { data: logs = [] } = useThanosDeploymentLogsQuery(
    deployment.stack_id,
    deployment.id,
    { limit: 100, refetchIntervalMs: 5000 }
  );

  const stepProgress = React.useMemo(() => extractStepProgress(logs), [logs]);
  const subtask = React.useMemo(() => extractCurrentSubtask(logs), [logs]);
  const firstErrorLog = React.useMemo(
    () => logs.find((l) => classifyLogLevel(l.message) === 'error'),
    [logs]
  );

  const pct = stepProgress
    ? Math.round((stepProgress.current / stepProgress.total) * 100)
    : null;

  return (
    <>
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <span className="text-sm font-medium text-slate-800">
          {getStepShortName(deployment)}
        </span>

        {stepProgress && pct !== null && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>
                Step {stepProgress.current} / {stepProgress.total}
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-48 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {firstErrorLog ? (
            <span className="flex items-center gap-1 text-xs text-red-600 italic truncate max-w-[260px]">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {parseFirstErrorText(firstErrorLog.message).slice(0, 80)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              ↳ {subtask?.label ?? 'Initializing…'}
            </span>
          )}

          <button
            onClick={() => setLogOpen(true)}
            className={`text-xs px-2 py-0.5 rounded border transition-colors shrink-0 ${
              firstErrorLog
                ? 'border-red-300 text-red-600 hover:bg-red-50'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Logs →
          </button>
        </div>
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
