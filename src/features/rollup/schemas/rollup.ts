export type RollupStatus = "active" | "maintenance" | "inactive";
export type RollupType = "Optimistic" | "ZK Rollup";

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
  active: {
    color: "bg-green-500",
    icon: "CheckCircle",
    label: "Active",
    variant: "default" as const,
  },
  maintenance: {
    color: "bg-yellow-500",
    icon: "AlertTriangle",
    label: "Maintenance",
    variant: "secondary" as const,
  },
  inactive: {
    color: "bg-red-500",
    icon: "XCircle",
    label: "Inactive",
    variant: "destructive" as const,
  },
};
