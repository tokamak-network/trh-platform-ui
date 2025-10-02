import { useQuery } from "@tanstack/react-query";
import { getIntegrations, getBackupStatus, getBackupCheckpoints } from "../services/integrationService";

export const integrationKeys = {
  list: (stackId: string) => ["thanosStacks", stackId, "integrations"] as const,
  backupStatus: (stackId: string) => ["thanosStacks", stackId, "integrations", "backup", "status"] as const,
  backupCheckpoints: (stackId: string, limit?: number) => ["thanosStacks", stackId, "integrations", "backup", "checkpoints", limit] as const,
} as const;

export const useIntegrationsQuery = (stackId: string) => {
  return useQuery({
    queryKey: integrationKeys.list(stackId),
    queryFn: () => getIntegrations(stackId),
    enabled: !!stackId,
    refetchInterval: 120000, // 2 minutes
  });
};

export const useBackupStatusQuery = (stackId: string) => {
  return useQuery({
    queryKey: integrationKeys.backupStatus(stackId),
    queryFn: () => getBackupStatus(stackId),
    enabled: !!stackId,
    refetchInterval: 300000, // 5 minutes
  });
};

export const useBackupCheckpointsQuery = (stackId: string, limit: number = 3) => {
  return useQuery({
    queryKey: integrationKeys.backupCheckpoints(stackId, limit),
    queryFn: () => getBackupCheckpoints(stackId, limit),
    enabled: !!stackId,
    refetchInterval: 300000, // 5 minutes
  });
};
