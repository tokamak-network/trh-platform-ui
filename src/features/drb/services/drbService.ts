import { apiPost, apiDelete, apiGet } from "@/lib/api";

// Thanos Sepolia Network Configuration (Alpha Release)
export const THANOS_SEPOLIA = {
  chainId: 111551119090,
  rpcUrl: "https://rpc.thanos-sepolia.tokamak.network",
  explorerUrl: "https://explorer.thanos-sepolia.tokamak.network",
  name: "Thanos Sepolia",
  nativeToken: "TON",
} as const;

// Node type for drb deployment
export type DRBNodeType = "leader" | "regular";

// ec2 configuration for regular nodes
export interface DRBEC2Config {
  instanceType?: string;
  keyPairName: string;
  subnetId?: string;
  instanceName?: string;
}

export interface InstallDRBRequestBody {
  // node type "leader" or "regular"
  nodeType: DRBNodeType;

  // Network Configuration
  useCurrentChain: boolean;
  rpc?: string;
  chainId?: number;

  // Deployer Configuration for leader node
  privateKey?: string;

  // Leader Connection for regular nodes
  leaderIp?: string;
  leaderPort?: number;
  leaderPeerId?: string;
  leaderEoa?: string;
  contractAddress?: string;

  // Regular Node Configuration
  nodePort?: number;
  eoaPrivateKey?: string;

  // aws Infrastructure
  awsConfig: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };

  // ec2 configuration for regular nodes
  ec2Config?: DRBEC2Config;

  // Database
  databaseConfig: {
    type: "rds" | "local";
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

export interface DRBRegularNodeInfo {
  nodeUrl: string;
  nodeIp: string;
  nodePort: number;
  nodePeerId?: string;
  nodeEoa: string;
  instanceId?: string;
  instanceType?: string;
  region: string;
  chainId: number;
  rpcUrl: string;
  leaderIp: string;
  leaderPort: number;
  leaderPeerId: string;
  leaderEoa: string;
  contractAddress: string;
  deploymentTimestamp: string;
}

export interface DRBDeploymentInfo {
  nodeType: DRBNodeType;
  contract?: DRBContractInfo;
  application?: DRBApplicationInfo;
  leaderInfo?: DRBLeaderInfo;
  regularNodeInfo?: DRBRegularNodeInfo;
  databaseType: "rds" | "local";
}

export interface GetDRBInfoResponse {
  status: "pending" | "in_progress" | "installed" | "failed" | "not_installed" | "terminating" | "cancelling" | "cancelled";
  message?: string;
  nodeType?: DRBNodeType;
  deployment?: DRBDeploymentInfo;
  failureReason?: string;
}

// Stack-based DRB deployment
export const installDRB = (stackId: string, body: InstallDRBRequestBody) =>
  apiPost(`stacks/thanos/${stackId}/integrations/drb`, body);

export const uninstallDRB = (stackId: string) =>
  apiDelete(`stacks/thanos/${stackId}/integrations/drb`);

// Get drb deployment info and status
export const getDRBInfo = (stackId: string) =>
  apiGet<GetDRBInfoResponse>(`stacks/thanos/${stackId}/integrations/drb`);

// Get Thanos Sepolia system stack (creates if doesn't exist)
export const getThanosSepolia = () =>
  apiGet<{ stack: { id: string; name: string } }>("stacks/thanos/system/thanos-sepolia");
