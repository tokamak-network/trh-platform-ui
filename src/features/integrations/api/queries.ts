import { useQuery } from "@tanstack/react-query";
import { getIntegrations, getBlockExplorerConfig } from "../services/integrationService";

export const integrationKeys = {
  list: (stackId: string) => ["thanosStacks", stackId, "integrations"] as const,
  blockExplorerConfig: (stackId: string) =>
    ["thanosStacks", stackId, "integrations", "block-explorer", "config"] as const,
} as const;

export const useIntegrationsQuery = (stackId: string) => {
  return useQuery({
    queryKey: integrationKeys.list(stackId),
    queryFn: () => getIntegrations(stackId),
    enabled: !!stackId,
    refetchInterval: 5000, // 5 seconds for realtime updates
  });
};

export const useBlockExplorerConfigQuery = (
  stackId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: integrationKeys.blockExplorerConfig(stackId),
    queryFn: () => getBlockExplorerConfig(stackId),
    enabled: !!stackId && enabled,
    staleTime: 30_000, // config rarely changes; cache 30s
  });
};
