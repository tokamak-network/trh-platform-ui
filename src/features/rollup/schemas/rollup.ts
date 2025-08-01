export type RollupStatus = "active" | "maintenance" | "inactive";
export enum RollupType {
  OPTIMISTIC_ROLLUP = "optimistic-rollup",
  ZK_ROLLUP = "zk-rollup",
}

export interface Rollup {
  id: string;
  name: string;
  status: RollupStatus;
  type: RollupType;
  transactions: string;
  users: string;
  tvl: string;
  uptime: string;
  lastActivity: string;
  gasPrice: string;
}

export const statusConfig = {
  Pending: {
    color: "bg-blue-500",
    icon: "Clock",
    label: "Pending",
    variant: "secondary" as const,
  },
  Deployed: {
    color: "bg-green-500",
    icon: "CheckCircle",
    label: "Deployed",
    variant: "default" as const,
  },
  Stopped: {
    color: "bg-gray-500",
    icon: "Pause",
    label: "Stopped",
    variant: "outline" as const,
  },
  Deploying: {
    color: "bg-blue-600 text-white px-1",
    icon: "Loader",
    label: "Deploying",
    variant: "secondary" as const,
  },
  Updating: {
    color: "bg-purple-500",
    icon: "RefreshCw",
    label: "Updating",
    variant: "secondary" as const,
  },
  Terminating: {
    color: "bg-orange-500",
    icon: "Trash2",
    label: "Terminating",
    variant: "secondary" as const,
  },
  Terminated: {
    color: "bg-gray-700",
    icon: "X",
    label: "Terminated",
    variant: "outline" as const,
  },
  FailedToDeploy: {
    color: "bg-red-500",
    icon: "AlertCircle",
    label: "Failed to Deploy",
    variant: "destructive" as const,
  },
  FailedToUpdate: {
    color: "bg-red-500",
    icon: "AlertCircle",
    label: "Failed to Update",
    variant: "destructive" as const,
  },
  FailedToTerminate: {
    color: "bg-red-500",
    icon: "AlertCircle",
    label: "Failed to Terminate",
    variant: "destructive" as const,
  },
  Unknown: {
    color: "bg-gray-400",
    icon: "HelpCircle",
    label: "Unknown",
    variant: "outline" as const,
  },
};
