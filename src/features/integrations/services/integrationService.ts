import { apiDelete, apiGet, apiPost } from "@/lib/api";
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
  type: Integration["type"]
): Promise<void> => {
  await apiDelete(`stacks/thanos/${stackId}/integrations/${type}`);
};

export const installBridgeIntegration = async (
  stackId: string
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/bridge`);
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
