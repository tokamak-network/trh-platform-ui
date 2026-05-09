'use client';

import React from 'react';
import { useThanosDeploymentLogsQuery } from '@/features/rollup/api/queries';
import { ThanosDeployment } from '@/features/rollup/schemas/thanos-deployments';
import { extractCurrentSubtask } from '@/features/rollup/utils/deploymentSubtask';
import { getStepShortName } from '@/features/rollup/utils/stepNames';

interface ActiveStepPillProps {
  deployment: ThanosDeployment;
}

export function ActiveStepPill({ deployment }: ActiveStepPillProps) {
  const { data: logs = [] } = useThanosDeploymentLogsQuery(
    deployment.stack_id,
    deployment.id,
    { limit: 50, refetchIntervalMs: 5000 }
  );

  const subtask = React.useMemo(() => extractCurrentSubtask(logs), [logs]);

  return (
    <div className="flex flex-col gap-0.5">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        {getStepShortName(deployment)}
      </span>
      <span className="text-xs text-muted-foreground italic pl-3">
        ↳ {subtask?.label ?? 'Initializing…'}
      </span>
    </div>
  );
}
