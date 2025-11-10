import { useQuery } from "@tanstack/react-query";
import { getIntegrations } from "../services/integrationService";

export const integrationKeys = {
  list: (stackId: string) => ["thanosStacks", stackId, "integrations"] as const,
} as const;

export const useIntegrationsQuery = (stackId: string) => {
  return useQuery({
    queryKey: integrationKeys.list(stackId),
    queryFn: () => getIntegrations(stackId),
    enabled: !!stackId,
    refetchInterval: 10000, // 10 seconds
  });
};
