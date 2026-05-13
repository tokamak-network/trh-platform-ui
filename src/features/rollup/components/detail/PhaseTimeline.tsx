"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { DeploymentSession } from "@/features/rollup/utils/sessionGrouping";
import { extractAwsInfraPhases } from "@/features/rollup/utils/phaseTimings";
import { useThanosDeploymentLogsQuery } from "@/features/rollup/api/queries";
import { ThanosDeployment } from "@/features/rollup/schemas/thanos-deployments";
import { formatDuration } from "@/features/rollup/utils/durationUtils";

const STEP_LABELS: Record<string, string> = {
  "deploy-l1-contracts": "L1 Contracts",
  "deploy-aws-infra": "AWS Infrastructure",
  "deploy-local-infra": "Local Infrastructure",
  "install-system-pulse": "System Pulse",
  "install-cross-trade-bridge": "CrossTrade Bridge",
  "install-bridge": "Bridge",
  "install-block-explorer": "Block Explorer",
  "install-monitoring": "Monitoring Dashboard",
  "install-drb": "DRB Nodes",
  "register-candidate": "Staking / DAO",
};

interface PhaseRowDef {
  label: string;
  startedAt?: string;
  finishedAt?: string;
  indent?: boolean;
}

// Component that fetches logs and renders sub-phases for a completed aws-infra step
function AwsInfraSubPhases({
  stackId,
  awsRow,
  now,
}: {
  stackId: string;
  awsRow: ThanosDeployment;
  now: number;
}) {
  const { data: logs = [] } = useThanosDeploymentLogsQuery(stackId, awsRow.id, {
    limit: 10000,
    refetchIntervalMs: false,
  });

  const phases = React.useMemo(() => extractAwsInfraPhases(logs), [logs]);
  const { stageAStart, stageBStart, k8sDone, presetStart } = phases;

  const subRows: PhaseRowDef[] = [];

  if (stageAStart && stageBStart) {
    subRows.push({ label: "EKS / VPC / EFS", startedAt: stageAStart, finishedAt: stageBStart });
  }
  if (stageBStart && k8sDone) {
    subRows.push({ label: "K8s / Helm", startedAt: stageBStart, finishedAt: k8sDone });
  }
  if (k8sDone) {
    // L1 Init & Anchor ends at presetStart if found, otherwise at step finished_at
    const initEnd = presetStart ?? awsRow.finished_at;
    if (initEnd) {
      subRows.push({ label: "L1 Init & Anchor", startedAt: k8sDone, finishedAt: initEnd });
    }
  }
  if (presetStart && awsRow.finished_at) {
    subRows.push({ label: "Preset Modules", startedAt: presetStart, finishedAt: awsRow.finished_at });
  }

  if (subRows.length === 0) return null;

  return (
    <>
      {subRows.map((row, idx) => (
        <tr key={`sub-${idx}`} className="border-t border-slate-100/80 text-slate-500">
          <td className="py-1.5 pl-6 text-xs">
            <span className="text-slate-300 mr-1.5">↳</span>
            {row.label}
          </td>
          <td className="py-1.5 text-right font-mono text-xs pr-1 tabular-nums">
            {formatDuration(row.startedAt, row.finishedAt, now)}
          </td>
        </tr>
      ))}
    </>
  );
}

function SessionCard({
  session,
  stackId,
  now,
}: {
  session: DeploymentSession;
  stackId: string;
  now: number;
}) {
  const sortedRows = React.useMemo(
    () =>
      [...session.rows].sort(
        (a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime(),
      ),
    [session.rows],
  );

  const isComplete = session.rows.every(
    (r) => r.status === "Success" || r.status === "Failed" || r.status === "Stopped",
  );
  const totalDuration = formatDuration(session.startedAt, session.finishedAt, now);
  const sessionDate = new Date(session.startedAt).toLocaleString();

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-gray-100">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-800 text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            {sessionDate}
          </CardTitle>
          {isComplete && (
            <span className="text-sm font-medium text-slate-600">
              Total: {totalDuration}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <table className="w-full text-sm">
          <tbody>
            {sortedRows.map((row) => {
              const label = STEP_LABELS[row.step] ?? row.step.replace(/-/g, " ");
              const duration = formatDuration(row.started_at, row.finished_at, now);
              const isAwsInfra = row.step === "deploy-aws-infra" && row.status === "Success";

              return (
                <React.Fragment key={row.id}>
                  <tr className="border-t border-slate-200/60">
                    <td className="py-1.5 font-medium text-slate-800">{label}</td>
                    <td className="py-1.5 text-right font-mono text-xs pr-1 tabular-nums text-slate-700">
                      {duration}
                    </td>
                  </tr>
                  {isAwsInfra && (
                    <AwsInfraSubPhases stackId={stackId} awsRow={row} now={now} />
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

interface PhaseTimelineProps {
  sessions: DeploymentSession[];
  stackId: string;
  now?: number;
}

export function PhaseTimeline({ sessions, stackId, now = Date.now() }: PhaseTimelineProps) {
  if (sessions.length === 0) return null;

  return (
    <div className="space-y-4">
      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} stackId={stackId} now={now} />
      ))}
    </div>
  );
}
