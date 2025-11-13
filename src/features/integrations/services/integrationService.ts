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
  type: Integration["type"]
): Promise<void> => {
  await apiDelete(`stacks/thanos/${stackId}/integrations/${type}`);
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
  await apiPost(`stacks/thanos/${stackId}/integrations/uptime-service`);
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
