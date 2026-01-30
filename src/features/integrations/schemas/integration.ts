export interface IntegrationInfo {
  url?: string;
  // Monitoring credentials
  username?: string;
  password?: string;
  // AlertManager configuration snapshot returned by API
  alert_manager?: {
    email?: {
      enabled: boolean;
      smtpFrom: string;
      smtpSmarthost: string;
      alertReceivers: string[];
      smtpAuthPassword: string;
    };
    telegram?: {
      enabled: boolean;
      apiToken: string;
      criticalReceivers: {
        ChatId: string;
      }[];
    };
  };
  safe_wallet?: {
    owners: string[];
    address: string;
    threshold: number;
  };
  candidate_registration?: {
    candidate_memo: string;
    candidate_name: string;
    staking_amount: number;
    registration_time: string;
    rollup_config_address: string;
  };
  contracts?: {
    mode: "l2_to_l1" | "l2_to_l2";
    l1_cross_trade_proxy_address: string;
    l1_cross_trade_address: string;
    l2_cross_trade_proxy_addresses: Record<number, string>;
    l2_cross_trade_addresses: Record<number, string>;
  };
  registered_tokens?: Array<{
    token_name: string;
    l1_token_address: string;
    l2_token_inputs: Array<{
      rpc: string;
      chain_id: number;
    }>;
  }>;
  // DRB (Distributed Randomness Beacon) metadata
  nodeType?: "leader" | "regular";
  contract?: {
    contractAddress: string;
    contractName: "CommitReveal2" | "CommitReveal2L2";
    chainId: number;
    consumerExampleV2Address?: string;
  };
  application?: {
    leaderNodeUrl: string;
  };
  leaderInfo?: {
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
  };
  regularNodeInfo?: {
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
  };
  databaseType?: "rds" | "local";
}

export interface Integration {
  id: string;
  stack_id: string;
  type: "bridge" | "block-explorer" | "monitoring" | "register-candidate" | "system-pulse" | "cross-trade-l2-to-l1" | "cross-trade-l2-to-l2" | "drb";
  status: "Pending" | "InProgress" | "Failed" | "Stopped" | "Completed" | "Terminating" | "Terminated" | "Cancelling" | "Cancelled" | "Unknown";
  config: Record<string, unknown>;
  info: IntegrationInfo;
  log_path: string;
  reason: string;
}

export interface GetIntegrationsResponse {
  integrations: Integration[];
}

export const INTEGRATION_TYPES = {
  bridge: {
    label: "Bridge",
    description: "Cross-chain bridge for asset transfers",
    icon: "🔗",
    color: "from-blue-500 to-cyan-400",
  },
  "block-explorer": {
    label: "Block Explorer",
    description: "Blockchain explorer for transaction tracking",
    icon: "🔍",
    color: "from-purple-500 to-pink-400",
  },
  monitoring: {
    label: "Monitoring",
    description: "System monitoring and analytics",
    icon: "📊",
    color: "from-green-500 to-emerald-400",
  },
  "register-candidate": {
    label: "Staking/DAO Candidate Registration",
    description: "Staking/DAO candidate registration",
    icon: "🏛️",
    color: "from-orange-500 to-red-400",
  },
  "system-pulse": {
    label: "System Pulse",
    description: "System Pulse provides real-time visibility into platform health and service availability",
    icon: "⏱️",
    color: "from-indigo-500 to-blue-400",
  },
  "cross-trade-l2-to-l1": {
    label: "Cross-Trade: L2 to L1",
    description: "Cross-chain bridge for L2 to L1 trading",
    icon: "💰",
    color: "from-blue-500 to-cyan-400",
  },
  "cross-trade-l2-to-l2": {
    label: "Cross-Trade: L2 to L2",
    description: "Cross-chain bridge for L2 to L2 trading",
    icon: "💰",
    color: "from-indigo-500 to-purple-400",
  },
  "drb": {
    label: "DRB (Distributed Randomness Beacon)",
    description: "Verifiable on-chain randomness using Commit-Reveal2 protocol",
    icon: "🎲",
    color: "from-amber-500 to-orange-400",
  }
} as const;
