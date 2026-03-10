import { useQuery } from "@tanstack/react-query";
import {
  getRollups,
  getRollupById,
  getThanosStacks,
  getThanosStackById,
  getThanosDeployments,
  getThanosDeploymentLogs,
  getRegisterMetadataDAO,
  getBackupStatus,
  getBackupCheckpoints,
} from "../services/rollupService";
import { getPresets, getPresetDetail, getFundingStatus } from "../services/presetService";

export const rollupKeys = {
  all: ["rollups"] as const,
  thanosStacks: ["thanosStacks"] as const,
  thanosStack: (id: string) => [...rollupKeys.thanosStacks, id] as const,
  thanosDeployments: (stackId: string) =>
    [...rollupKeys.thanosStack(stackId), "deployments"] as const,
  integrations: (stackId: string) =>
    [...rollupKeys.thanosStack(stackId), "integrations"] as const,
  registerMetadataDAO: (stackId: string) =>
    [...rollupKeys.thanosStack(stackId), "register-metadata-dao"] as const,
  backupStatus: (stackId: string) =>
    [...rollupKeys.thanosStack(stackId), "backup-status"] as const,
  backupCheckpoints: (stackId: string, limit?: string) =>
    [...rollupKeys.thanosStack(stackId), "backup-checkpoints", limit] as const,
  lists: () => [...rollupKeys.all, "list"] as const,
  list: (filters: string) => [...rollupKeys.lists(), { filters }] as const,
  details: () => [...rollupKeys.all, "detail"] as const,
  detail: (id: string) => [...rollupKeys.details(), id] as const,
  presets: ["presets"] as const,
  presetDetail: (id: string) => [...rollupKeys.presets, id] as const,
  fundingStatus: (deploymentId: string) => ["fundingStatus", deploymentId] as const,
} as const;

export const useRollups = () => {
  return useQuery({
    queryKey: rollupKeys.lists(),
    queryFn: getRollups,
    refetchInterval: 120000, // 2 minutes
  });
};

export const useRollup = (id: string) => {
  return useQuery({
    queryKey: rollupKeys.detail(id),
    queryFn: () => getRollupById(id),
    refetchInterval: 120000, // 2 minutes
  });
};

export const useThanosStacksQuery = () => {
  return useQuery({
    queryKey: rollupKeys.thanosStacks,
    queryFn: getThanosStacks,
    retry: 2,
    refetchInterval: 120000, // 2 minutes
  });
};

export const useThanosStackByIdQuery = (id: string) => {
  return useQuery({
    queryKey: rollupKeys.thanosStack(id),
    queryFn: () => getThanosStackById(id),
    refetchInterval: 120000, // 2 minutes
  });
};

export { useIntegrationsQuery } from "@/features/integrations/api/queries";

export const useThanosDeploymentsQuery = (id?: string) => {
  return useQuery({
    queryKey: id
      ? rollupKeys.thanosDeployments(id)
      : (["thanosStacks", "deployments", "disabled"] as const),
    queryFn: () => getThanosDeployments(id as string),
    enabled: Boolean(id),
    refetchInterval: 10000, // 10 seconds
  });
};

export const useThanosDeploymentLogsQuery = (
  stackId?: string,
  deploymentId?: string,
  options?: {
    limit?: number;
    afterId?: string;
    refetchIntervalMs?: number | false;
  }
) => {
  return useQuery({
    queryKey:
      stackId && deploymentId
        ? [
            ...rollupKeys.thanosDeployments(stackId),
            deploymentId,
            "logs",
            options?.limit ?? 200,
            options?.afterId,
          ]
        : (["thanosStacks", "deployments", "logs", "disabled"] as const),
    queryFn: () =>
      getThanosDeploymentLogs(stackId as string, deploymentId as string, {
        limit: options?.limit,
        afterId: options?.afterId,
      }),
    enabled: Boolean(stackId && deploymentId),
    refetchInterval: options?.refetchIntervalMs ?? 5000,
  });
};

export const useRegisterMetadataDAOQuery = (id?: string) => {
  return useQuery({
    queryKey: id
      ? rollupKeys.registerMetadataDAO(id)
      : (["thanosStacks", "register-metadata-dao", "disabled"] as const),
    queryFn: () => getRegisterMetadataDAO(id as string),
    enabled: Boolean(id),
    refetchInterval: 120000, // 2 minutes
  });
};

export const useBackupStatusQuery = (id?: string) => {
  return useQuery({
    queryKey: id
      ? rollupKeys.backupStatus(id)
      : (["thanosStacks", "backup-status", "disabled"] as const),
    queryFn: () => getBackupStatus(id as string),
    enabled: Boolean(id),
    staleTime: 30000,
  });
};

export const useBackupCheckpointsQuery = (id?: string, limit?: string) => {
  return useQuery({
    queryKey: id
      ? rollupKeys.backupCheckpoints(id, limit)
      : (["thanosStacks", "backup-checkpoints", "disabled"] as const),
    queryFn: () => getBackupCheckpoints(id as string, limit),
    enabled: Boolean(id),
    staleTime: 60000,
  });
};

export const usePresetsQuery = () => {
  return useQuery({
    queryKey: rollupKeys.presets,
    queryFn: getPresets,
    staleTime: 300000, // 5 minutes - presets rarely change
  });
};

export const usePresetDetailQuery = (id?: string) => {
  return useQuery({
    queryKey: id ? rollupKeys.presetDetail(id) : (["presets", "disabled"] as const),
    queryFn: () => getPresetDetail(id as string),
    enabled: Boolean(id),
    staleTime: 300000,
  });
};

export const useFundingStatusQuery = (deploymentId?: string) => {
  return useQuery({
    queryKey: deploymentId
      ? rollupKeys.fundingStatus(deploymentId)
      : (["fundingStatus", "disabled"] as const),
    queryFn: () => getFundingStatus(deploymentId as string),
    enabled: Boolean(deploymentId),
    refetchInterval: 10000, // 10-second polling
  });
};

