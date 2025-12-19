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
}

export interface Integration {
  id: string;
  stack_id: string;
  type: "bridge" | "block-explorer" | "monitoring" | "register-candidate" | "system-pulse";
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
    logo: "/icons/integrations/bridge.png",
    color: "from-blue-500 to-cyan-400",
  },
  "block-explorer": {
    label: "Block Explorer",
    description: "Blockchain explorer for transaction tracking",
    logo: "/icons/integrations/explorer.png",
    color: "from-purple-500 to-pink-400",
  },
  monitoring: {
    label: "Monitoring",
    description: "System monitoring and analytics",
    logo: "/icons/integrations/monitor.png",
    color: "from-green-500 to-emerald-400",
  },
  "register-candidate": {
    label: "Staking/DAO Candidate Registration",
    description: "Staking/DAO candidate registration",
    logo: "/icons/integrations/staking.png",
    color: "from-orange-500 to-red-400",
  },
  "system-pulse": {
    label: "System Pulse",
    description: "System Pulse provides real-time visibility into platform health and service availability",
    logo: "/icons/integrations/pulse.png",
    color: "from-indigo-500 to-blue-400",
  },
} as const;
