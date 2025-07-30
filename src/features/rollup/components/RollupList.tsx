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
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { Rollup, statusConfig } from "../schemas/rollup";

interface RollupListProps {
  rollups: Rollup[];
  onCreateRollup: () => void;
}

export function RollupList({ rollups, onCreateRollup }: RollupListProps) {
  const router = useRouter();

  const handleViewRollup = (id: string) => {
    router.push(`/rollup/${id}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-3 h-3" />;
      case "maintenance":
        return <AlertTriangle className="w-3 h-3" />;
      case "inactive":
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (rollups.length === 0) {
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
      {rollups.map((rollup) => {
        const statusInfo = statusConfig[rollup.status];

        return (
          <Card
            key={rollup.id}
            className="hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => handleViewRollup(rollup.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${statusInfo.color}`}
                    />
                    <div>
                      <h3 className="text-lg font-semibold">{rollup.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge
                          variant={statusInfo.variant}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(rollup.status)}
                          {statusInfo.label}
                        </Badge>
                        <Badge variant="outline">{rollup.type}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {rollup.lastActivity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium">{rollup.transactions}</p>
                    <p className="text-xs text-muted-foreground">
                      Transactions
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{rollup.users}</p>
                    <p className="text-xs text-muted-foreground">Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{rollup.tvl}</p>
                    <p className="text-xs text-muted-foreground">TVL</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{rollup.uptime}</p>
                    <p className="text-xs text-muted-foreground">Uptime</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{rollup.gasPrice}</p>
                    <p className="text-xs text-muted-foreground">Gas Price</p>
                  </div>

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
                        {rollup.status === "active" ? (
                          <>
                            <Pause className="mr-2 h-4 w-4" />
                            Pause Rollup
                          </>
                        ) : (
                          <>
                            <Play className="mr-2 h-4 w-4" />
                            Start Rollup
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
