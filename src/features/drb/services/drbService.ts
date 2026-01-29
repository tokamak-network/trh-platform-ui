import { apiPost, apiDelete, apiGet } from "@/lib/api";

// Thanos Sepolia Network Configuration (Alpha Release)
export const THANOS_SEPOLIA = {
  chainId: 111551119090,
  rpcUrl: "https://rpc.thanos-sepolia.tokamak.network",
  explorerUrl: "https://explorer.thanos-sepolia.tokamak.network",
  name: "Thanos Sepolia",
  nativeToken: "TON",
} as const;

export interface InstallDRBRequestBody {
  useCurrentChain: boolean;
  rpc?: string;
  chainId?: number;
  privateKey: string;
  // AWS Infrastructure
  awsConfig: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  // Database
  databaseConfig: {
    type: "rds";
    username: string;
    password: string;
  };
}

export interface DRBContractInfo {
  contractAddress: string;
  contractName: "CommitReveal2" | "CommitReveal2L2";
  chainId: number;
  consumerExampleV2Address?: string;
}

export interface DRBApplicationInfo {
  leaderNodeUrl: string;
}

export interface DRBLeaderInfo {
  leaderUrl: string;
  leaderIp: string;
  leaderPort: number;
  leaderPeerId: string;
  leaderEoa: string;
  commitReveal2L2Address: string;
  consumerExampleV2Address?: string;
  chainId: number;
  rpcUrl: string;
  deploymentTimestamp: string;
  clusterName: string;
  namespace: string;
}

export interface DRBDeploymentInfo {
  contract: DRBContractInfo;
  application: DRBApplicationInfo;
  leaderInfo?: DRBLeaderInfo;
  databaseType: "rds";
}

// Stack-based DRB deployment
export const installDRB = (stackId: string, body: InstallDRBRequestBody) =>
  apiPost(`stacks/thanos/${stackId}/integrations/drb`, body);

export const uninstallDRB = (stackId: string) =>
  apiDelete(`stacks/thanos/${stackId}/integrations/drb`);

// Get Thanos Sepolia system stack (creates if doesn't exist)
export const getThanosSepolia = () =>
  apiGet<{ stack: { id: string; name: string } }>("stacks/thanos/system/thanos-sepolia");
