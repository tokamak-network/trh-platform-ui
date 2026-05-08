"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useThanosDeploymentsQuery } from "@/features/rollup/api/queries";
import { ThanosDeployment } from "@/features/rollup/schemas/thanos-deployments";
import { formatDuration } from "@/features/rollup/utils/durationUtils";

const STEP_SHORT_NAMES: Record<string, string> = {
  "deploy-l1-contracts": "L1 Contracts",
  "deploy-aws-infra": "Infrastructure",
  "destroy-aws-infra": "Destroy Infrastructure",
  "install-bridge": "Bridge",
  "uninstall-bridge": "Bridge",
  "install-block-explorer": "Block Explorer",
  "uninstall-block-explorer": "Block Explorer",
  "install-monitoring": "Monitoring",
  "uninstall-monitoring": "Monitoring",
  "install-drb": "DRB Nodes",
  "register-candidate": "DAO Registration",
};

const getStepShortName = (d: ThanosDeployment): string => {
  if (d.step === "deploy-aws-infra" && d.config) {
    const provider = d.config.infraProvider as string | undefined;
    if (provider === "local") return "Local Infrastructure";
    if (provider === "aws") return "AWS Infrastructure";
  }
  return STEP_SHORT_NAMES[d.step] ?? d.step.replace(/-/g, " ");
};

interface DeploymentProgressCardProps {
  stackId?: string;
}

export function DeploymentProgressCard({ stackId }: DeploymentProgressCardProps) {
  const { data: deployments = [] } = useThanosDeploymentsQuery(stackId);
  const [now, setNow] = React.useState(Date.now());

  const activeRows = React.useMemo(
    () => deployments.filter((d) => d.status === "InProgress" || d.status === "Pending"),
    [deployments]
  );

  React.useEffect(() => {
    if (activeRows.length === 0) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [activeRows.length]);

  if (activeRows.length === 0) return null;

  const sessionStartMs = Math.min(
    ...activeRows.map((d) => new Date(d.started_at).getTime())
  );
  const wallClock = formatDuration(new Date(sessionStartMs).toISOString(), undefined, now);

  return (
    <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-100">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Deployment in progress
              </span>
            </div>
            <div className="text-4xl font-semibold tabular-nums text-slate-900 mb-3">
              {wallClock}
            </div>
            <div className="flex flex-wrap gap-2">
              {activeRows.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  {getStepShortName(d)}
                </span>
              ))}
            </div>
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
