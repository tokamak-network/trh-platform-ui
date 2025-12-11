import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import { Integration, GetIntegrationsResponse } from "../schemas/integration";

export const getIntegrations = async (
  stackId: string
): Promise<Integration[]> => {
  const response = await apiGet<GetIntegrationsResponse>(
    `stacks/thanos/${stackId}/integrations`
  );
  return response.data.integrations;
};

export const uninstallIntegration = async (
  stackId: string,
  type: Integration["type"],
  id?: string
): Promise<void> => {
  // Map cross-trade types (old and new) to the same API endpoint
  let apiType: string = type;
  let url: string;
  
  if (type === "cross-trade-l2-to-l1" || type === "cross-trade-l2-to-l2") {
    apiType = "cross-trade";
    // Include id in URL for cross-trade uninstall
    if (id) {
      url = `stacks/thanos/${stackId}/integrations/${apiType}/${id}`;
    } else {
      url = `stacks/thanos/${stackId}/integrations/${apiType}`;
    }
  } else {
    url = `stacks/thanos/${stackId}/integrations/${apiType}`;
  }
  
  await apiDelete(url);
};

export const uninstallMonitoringIntegration = async (
  stackId: string
): Promise<void> => {
  await apiDelete(`stacks/thanos/${stackId}/integrations/monitoring`);
};

export const installBridgeIntegration = async (
  stackId: string
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/bridge`);
};

export const installUptimeIntegration = async (
  stackId: string
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/system-pulse`);
};

export interface InstallBlockExplorerRequestBody {
  databaseUsername: string;
  databasePassword: string;
  coinmarketcapKey: string;
  walletConnectId: string;
}

export const installBlockExplorerIntegration = async (
  stackId: string,
  body: InstallBlockExplorerRequestBody
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/block-explorer`, body);
};

export interface InstallMonitoringRequestBody {
  grafanaPassword: string;
  loggingEnabled: boolean;
  alertManager: {
    telegram: {
      enabled: boolean;
      apiToken: string;
      criticalReceivers: Array<{ chatId: string }>;
    };
    email: {
      enabled: boolean;
      smtpSmarthost: string;
      smtpFrom: string;
      smtpAuthPassword: string;
      alertReceivers: string[];
    };
  };
}

export const installMonitoringIntegration = async (
  stackId: string,
  body: InstallMonitoringRequestBody
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/monitoring`, body);
};

export interface RegisterDaoCandidateRequestBody {
  amount: number;
  memo: string;
  nameInfo?: string;
}

export const registerDaoCandidateIntegration = async (
  stackId: string,
  body: RegisterDaoCandidateRequestBody
): Promise<void> => {
  await apiPost(
    `stacks/thanos/${stackId}/integrations/register-candidate`,
    body
  );
};

export interface InstallCrossChainBridgeRequestBody {
  mode: "l2_to_l1" | "l2_to_l2";
  projectId: string;
  l1ChainConfig: {
    rpc: string;
    chainId: number;
    privateKey: string;
    isDeployedNew: boolean;
    deploymentScriptPath?: string;
    contractName?: string;
    blockExplorerConfig?: {
      apiKey?: string;
      url: string;
      type: string;
    } | null;
    crossTradeProxyAddress?: string;
    crossTradeAddress?: string;
  };
  l2ChainConfig: Array<{
    rpc: string;
    chainId: number;
    privateKey: string;
    isDeployedNew: boolean;
    deploymentScriptPath?: string;
    contractName?: string;
    blockExplorerConfig?: {
      apiKey?: string;
      url: string;
      type: string;
    } | null;
    crossDomainMessenger: string; // required
    crossTradeProxyAddress?: string;
    crossTradeAddress?: string;
    nativeTokenAddress: string; // required
    l1StandardBridgeAddress: string; // required
    l1UsdcBridgeAddress: string; // required
    l1CrossDomainMessenger: string; // required
    l1Tokens?: Record<string, string>; // token name -> L1 address
    l2Tokens?: Record<string, string>; // token name -> L2 address
  }>;
  tokens?: Array<{
    tokenName: string;
    l1TokenAddress: string;
    l2TokenInputs: Array<{
      chainId: number;
      tokenAddress: string;
    }>;
  }>;
}

export const installCrossChainBridgeIntegration = async (
  stackId: string,
  body: InstallCrossChainBridgeRequestBody
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/cross-trade`, body);
};

export const installCrossTradeL2ToL1Integration = async (
  stackId: string,
  body: Omit<InstallCrossChainBridgeRequestBody, "mode">
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/cross-trade`, {
    ...body,
    mode: "l2_to_l1" as const,
  });
};

export const installCrossTradeL2ToL2Integration = async (
  stackId: string,
  body: Omit<InstallCrossChainBridgeRequestBody, "mode">
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/cross-trade`, {
    ...body,
    mode: "l2_to_l2" as const,
  });
};

export const disableEmailAlert = async (stackId: string): Promise<void> => {
  await apiDelete(`stacks/thanos/${stackId}/integrations/monitoring/disable-email`);
};

export const disableTelegramAlert = async (stackId: string): Promise<void> => {
  await apiDelete(`stacks/thanos/${stackId}/integrations/monitoring/disable-telegram`);
};

export interface ConfigureTelegramAlertRequestBody {
  apiToken: string;
  criticalReceivers: Array<{ ChatId: string }>;
}

export const configureTelegramAlert = async (
  stackId: string,
  body: ConfigureTelegramAlertRequestBody
): Promise<void> => {
  await apiPut(`stacks/thanos/${stackId}/integrations/monitoring/telegram`, body);
};

export interface ConfigureEmailAlertRequestBody {
  smtpSmarthost: string;
  smtpFrom: string;
  smtpAuthPassword: string;
  alertReceivers: string[];
}

export const configureEmailAlert = async (
  stackId: string,
  body: ConfigureEmailAlertRequestBody
): Promise<void> => {
  await apiPut(`stacks/thanos/${stackId}/integrations/monitoring/email`, body);
};

export const cancelIntegration = async (
  stackId: string,
  integrationId: string
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/${integrationId}/cancel`);
};

export const retryIntegration = async (
  stackId: string,
  integrationId: string
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/${integrationId}/retry`);
};

export interface L2ChainConfig {
  rpc: string;
  chain_id: number;
  private_key: string;
  is_deployed_new: boolean;
  chain_name: string;
  block_explorer_config?: {
    api_key?: string;
    url: string;
    type: string;
  };
  cross_domain_messenger: string;
  deployment_script_path?: string;
  contract_name?: string;
  native_token_address: string;
  l1_standard_bridge_address: string;
  l1_usdc_bridge_address: string;
  l1_cross_domain_messenger: string;
  cross_trade_proxy_address?: string;
  cross_trade_address?: string;
}

export const getL2ChainConfigs = async (
  stackId: string,
  mode: "l2_to_l1" | "l2_to_l2"
): Promise<L2ChainConfig[]> => {
  const response = await apiGet<L2ChainConfig[]>(
    `stacks/thanos/${stackId}/cross-trade/l2-chain-config?mode=${mode}`
  );
  return response.data;
};

export interface RegisterTokensRequest {
  tokenName: string;
  l1TokenAddress: string;
  l2TokenInputs: Array<{
    chainId: number;
    tokenAddress: string;
  }>;
}

export interface RegisterTokensAPIRequest {
  mode: "l2_to_l1" | "l2_to_l2";
  tokens: RegisterTokensRequest[];
}

export const registerTokens = async (
  stackId: string,
  body: RegisterTokensAPIRequest
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/cross-trade/register-tokens`, body);
};

export interface BlockExplorerConfig {
  apiKey?: string;
  url: string;
  type: string;
}

export interface L2CrossTradeChainInput {
  rpc: string;
  chainId: number;
  privateKey: string;
  isDeployedNew: boolean;
  chainName: string;
  blockExplorerConfig?: BlockExplorerConfig | null;
  crossDomainMessenger: string;
  crossTradeProxyAddress?: string;
  nativeTokenAddress: string;
  crossTradeAddress?: string;
  l2Tokens?: Record<string, string>;
  l1Tokens?: Record<string, string>;
  l1StandardBridgeAddress: string;
  l1USDCBridgeAddress: string; // Note: capital USDC to match backend
  l1CrossDomainMessenger: string;
}

export interface DeployNewL2ChainRequest {
  mode: "l2_to_l1" | "l2_to_l2";
  l2ChainConfig: L2CrossTradeChainInput;
}

export const deployNewL2Chain = async (
  stackId: string,
  body: DeployNewL2ChainRequest
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/cross-trade/deploy-l2-chain`, body);
};
