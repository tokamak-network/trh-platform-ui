import { apiGet, apiPost } from "@/lib/api";
import { Rollup, RollupType } from "../schemas/rollup";
import type { RollupDeploymentRequest } from "../schemas/create-rollup";
import {
  GetAllThanosStacksResponse,
  GetThanosStackResponse,
  ThanosStack,
} from "../schemas/thanos";

export const deployRollup = async (request: RollupDeploymentRequest) => {
  const response = await apiPost<{ id: string }>("stacks/thanos", request, {
    timeout: 30000, // Increase timeout for deployment
  });
  return response;
};

export const mockRollups: Rollup[] = [
  {
    id: "1",
    name: "DeFi Rollup",
    status: "active",
    type: RollupType.OPTIMISTIC_ROLLUP,
    transactions: "2.4M",
    users: "45.2K",
    tvl: "$125M",
    uptime: "99.9%",
    lastActivity: "2 minutes ago",
    gasPrice: "0.001 ETH",
  },
  {
    id: "2",
    name: "Gaming Chain",
    status: "active",
    type: RollupType.ZK_ROLLUP,
    transactions: "1.8M",
    users: "32.1K",
    tvl: "$89M",
    uptime: "99.7%",
    lastActivity: "5 minutes ago",
    gasPrice: "0.0008 ETH",
  },
  {
    id: "3",
    name: "NFT Marketplace",
    status: "maintenance",
    type: RollupType.OPTIMISTIC_ROLLUP,
    transactions: "956K",
    users: "18.5K",
    tvl: "$45M",
    uptime: "98.2%",
    lastActivity: "1 hour ago",
    gasPrice: "0.0012 ETH",
  },
  {
    id: "4",
    name: "Social Network",
    status: "inactive",
    type: RollupType.ZK_ROLLUP,
    transactions: "234K",
    users: "8.2K",
    tvl: "$12M",
    uptime: "95.1%",
    lastActivity: "2 days ago",
    gasPrice: "0.0015 ETH",
  },
];

export const getRollups = (): Rollup[] => {
  return mockRollups;
};

export const getRollupById = (id: string): Rollup | undefined => {
  return mockRollups.find((rollup) => rollup.id === id);
};

export const getThanosStacks = async (): Promise<ThanosStack[]> => {
  const response = await apiGet<GetAllThanosStacksResponse>("stacks/thanos");

  return response.data.stacks;
};

export const getThanosStackById = async (id: string): Promise<ThanosStack> => {
  const response = await apiGet<GetThanosStackResponse>(`stacks/thanos/${id}`);
  return response.data.stack;
};

export const calculateRollupStats = () => {
  const totalRollups = mockRollups.length;
  const activeRollups = mockRollups.filter((r) => r.status === "active").length;
  const totalUsers = mockRollups.reduce(
    (sum, r) => sum + Number.parseFloat(r.users.replace("K", "")),
    0
  );
  const totalTVL = mockRollups.reduce(
    (sum, r) =>
      sum + Number.parseFloat(r.tvl.replace("$", "").replace("M", "")),
    0
  );

  return {
    totalRollups,
    activeRollups,
    totalUsers: totalUsers.toFixed(1) + "K",
    totalTVL: "$" + totalTVL.toFixed(0) + "M",
  };
};
