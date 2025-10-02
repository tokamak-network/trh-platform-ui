import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { Integration, GetIntegrationsResponse } from "../schemas/integration";
import { BackupStatusData, BackupCheckpoint } from "../schemas/backup";

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

export const getBackupStatus = async (
  stackId: string
): Promise<BackupStatusData> => {
  const response = await apiGet<BackupStatusData>(
    `stacks/thanos/${stackId}/integrations/backup/status/db`
  );
  return response.data;
};

export const getBackupCheckpoints = async (
  stackId: string,
  limit: number = 3
): Promise<BackupCheckpoint[]> => {
  const response = await apiGet<BackupCheckpoint[]>(
    `stacks/thanos/${stackId}/integrations/backup/checkpoints/db?limit=${limit}`
  );
  return response.data;
};

export const createBackupSnapshot = async (
  stackId: string
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/backup/snapshot`);
};

export interface ConfigureBackupRequestBody {
  daily: string;
  keep: string;
}

export const configureBackup = async (
  stackId: string,
  body: ConfigureBackupRequestBody
): Promise<void> => {
  await apiPost(`stacks/thanos/${stackId}/integrations/backup/configure`, body);
};
