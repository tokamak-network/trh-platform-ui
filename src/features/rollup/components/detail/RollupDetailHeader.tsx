import { ThanosStack } from "../../schemas/thanos";
import { RollupItem } from "../RollupItem";
import { useDRBDeploymentInfo } from "@/features/drb/api/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dices, Server, Clock, CheckCircle, Loader2, AlertCircle, Crown } from "lucide-react";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "just now";
}

interface RollupDetailHeaderProps {
  stack: ThanosStack;
}

export function RollupDetailHeader({ stack }: RollupDetailHeaderProps) {
  const isSystemStack = stack?.name?.includes("(System)") || false;
  const drbInfo = useDRBDeploymentInfo(stack?.id || "");

  if (isSystemStack) {
    return <DRBDetailHeader drbInfo={drbInfo} />;
  }

  return <RollupItem stack={stack} className="border-0 shadow-none" />;
}

interface DRBDetailHeaderProps {
  drbInfo: ReturnType<typeof useDRBDeploymentInfo>;
}

function DRBDetailHeader({ drbInfo }: DRBDetailHeaderProps) {
  const { deploymentInfo, isCompleted, isInProgress, isFailed, nodeType } = drbInfo;
  const leaderInfo = deploymentInfo?.leaderInfo;
  const regularNodeInfo = deploymentInfo?.regularNodeInfo;
  const timestamp = nodeType === "leader" ? leaderInfo?.deploymentTimestamp : regularNodeInfo?.deploymentTimestamp;

  const nodeLabel = nodeType === "leader" ? "Leader" : nodeType === "regular" ? "Regular" : "";

  return (
    <Card className="border-0 shadow-md bg-gradient-to-r from-purple-50/80 via-white to-blue-50/80">
      <CardContent className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow">
              <Dices className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800">
                DRB {nodeLabel} Node
              </h1>
              <p className="text-slate-500 text-xs">Distributed Randomness Beacon on Thanos Sepolia</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge isCompleted={isCompleted} isInProgress={isInProgress} isFailed={isFailed} />

            <Badge variant="outline" className="flex items-center gap-1 bg-white text-xs py-0.5">
              {nodeType === "leader" ? (
                <Crown className="h-3 w-3 text-amber-500" />
              ) : (
                <Server className="h-3 w-3 text-slate-500" />
              )}
              {nodeLabel || "DRB"}
            </Badge>

            {timestamp && (
              <Badge variant="outline" className="flex items-center gap-1 bg-white text-slate-600 text-xs py-0.5">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(new Date(timestamp))}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ isCompleted, isInProgress, isFailed }: { isCompleted: boolean; isInProgress: boolean; isFailed: boolean }) {
  if (isCompleted) {
    return (
      <Badge className="bg-green-100 text-green-700 border-green-200 flex items-center gap-1 text-xs py-0.5">
        <CheckCircle className="h-3 w-3" />
        Active
      </Badge>
    );
  }
  if (isInProgress) {
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 flex items-center gap-1 text-xs py-0.5 animate-pulse">
        <Loader2 className="h-3 w-3 animate-spin" />
        Deploying
      </Badge>
    );
  }
  if (isFailed) {
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 flex items-center gap-1 text-xs py-0.5">
        <AlertCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-xs py-0.5">
      Not Deployed
    </Badge>
  );
}
