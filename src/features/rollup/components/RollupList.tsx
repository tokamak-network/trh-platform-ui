import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Play,
  Pause,
  Settings,
  Eye,
  Activity,
  Clock,
  ExternalLink,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Loader,
  X,
  Globe,
  Server,
  LucideIcon,
} from "lucide-react";
import { statusConfig } from "../schemas/rollup";
import { ThanosStack, ThanosStackStatus } from "../schemas/thanos";
import { useThanosStack } from "../hooks/useThanosStack";
import { useEffect } from "react";
import { getLastActivityTime, formatRelativeTime } from "../utils/dateUtils";

// Map of icon names to their components
const IconMap: Record<string, LucideIcon> = {
  CheckCircle,
  Clock,
  Pause,
  Loader,
  RefreshCw,
  Trash2,
  X,
  AlertCircle,
  HelpCircle,
};

// Dynamic status icon component
const StatusIcon = ({ iconName }: { iconName: string }) => {
  const Icon = IconMap[iconName];
  return Icon ? <Icon className="w-3 h-3" /> : null;
};

interface RollupListProps {
  onCreateRollup: () => void;
}

export function RollupList({ onCreateRollup }: RollupListProps) {
  const router = useRouter();
  const { stacks, isLoading, isError } = useThanosStack();

  const handleViewRollup = (id: string) => {
    router.push(`/rollup/${id}`);
  };

  const getStatusBadge = (status: ThanosStackStatus) => {
    const statusColors: Record<string, string> = {
      [ThanosStackStatus.PENDING]: statusConfig.Pending.color,
      [ThanosStackStatus.DEPLOYED]: statusConfig.Deployed.color,
      [ThanosStackStatus.STOPPED]: statusConfig.Stopped.color,
      [ThanosStackStatus.DEPLOYING]: statusConfig.Deploying.color,
      [ThanosStackStatus.UPDATING]: statusConfig.Updating.color,
      [ThanosStackStatus.TERMINATING]: statusConfig.Terminating.color,
      [ThanosStackStatus.TERMINATED]: statusConfig.Terminated.color,
      [ThanosStackStatus.FAILED_TO_DEPLOY]: statusConfig.FailedToDeploy.color,
      [ThanosStackStatus.FAILED_TO_UPDATE]: statusConfig.FailedToUpdate.color,
      [ThanosStackStatus.FAILED_TO_TERMINATE]:
        statusConfig.FailedToTerminate.color,
      [ThanosStackStatus.UNKNOWN]: statusConfig.Unknown.color,
    };

    const color =
      statusColors[status] || statusColors[ThanosStackStatus.UNKNOWN];
    return <div className={`w-3 h-3 rounded-full ${color}`} />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-10 h-10 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-semibold mb-2">Loading rollups...</h3>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Trash2 className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Error loading rollups</h3>
          <p className="text-muted-foreground mb-6">
            There was a problem fetching your rollups. Please try again later.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stacks || stacks.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No rollups found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your filters to see more results or get started by
            creating your first rollup.
          </p>
          <Button onClick={onCreateRollup} variant="default">
            <Plus className="w-4 h-4 mr-2" />
            Create Rollup
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {stacks.map((stack) => {
        const statusInfo = statusConfig[stack.status];

        return (
          <Card
            key={stack.id}
            className="hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => handleViewRollup(stack.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(stack.status)}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {stack.config.chainName}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge
                          variant={statusInfo.variant}
                          className={`flex items-center gap-1 ${statusInfo.color}`}
                        >
                          <StatusIcon iconName={statusInfo.icon} />
                          {statusInfo.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 bg-gray-200"
                        >
                          <Globe className="w-3 h-3" />
                          {stack.network}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 bg-gray-200"
                        >
                          <Server className="w-3 h-3" />
                          {stack.name}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 text-gray-500"
                        >
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(
                            getLastActivityTime(
                              stack.created_at,
                              stack.updated_at,
                              stack.deleted_at
                            )
                          )}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {stack.metadata?.l2_url && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(stack.metadata?.l2_url, "_blank");
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        L2 URL
                      </Button>
                    </div>
                  )}

                  {stack.metadata?.bridge_url && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(stack.metadata?.bridge_url, "_blank");
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Bridge
                      </Button>
                    </div>
                  )}

                  {stack.metadata?.block_explorer_url && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            stack.metadata?.block_explorer_url,
                            "_blank"
                          );
                        }}
                      >
                        <ExternalLink className="w-3 h-3" />
                        Explorer
                      </Button>
                    </div>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        {stack.status === ThanosStackStatus.DEPLOYED ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Stop Rollup
                          </>
                        ) : stack.status === ThanosStackStatus.STOPPED ? (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start Rollup
                          </>
                        ) : (
                          <>
                            <Settings className="mr-2 h-4 w-4" />
                            Manage
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
