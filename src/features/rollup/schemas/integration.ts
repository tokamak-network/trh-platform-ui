export interface IntegrationInfo {
  url?: string;
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
}

export interface Integration {
  id: string;
  stack_id: string;
  type: "bridge" | "block-explorer" | "monitoring" | "register-candidate";
  status: "Pending" | "InProgress" | "Completed" | "Failed";
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
    label: "DAO Candidate",
    description: "DAO candidate registration",
    icon: "🏛️",
    color: "from-orange-500 to-red-400",
  },
} as const;
