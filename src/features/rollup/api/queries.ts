import { useQuery } from "@tanstack/react-query";
import {
  getRollups,
  getRollupById,
  getThanosStacks,
  getThanosStackById,
} from "../services/rollupService";
import { getIntegrations } from "../services/integrationService";

export const rollupKeys = {
  all: ["rollups"] as const,
  thanosStacks: ["thanosStacks"] as const,
  thanosStack: (id: string) => [...rollupKeys.thanosStacks, id] as const,
  integrations: (stackId: string) =>
    [...rollupKeys.thanosStack(stackId), "integrations"] as const,
  lists: () => [...rollupKeys.all, "list"] as const,
  list: (filters: string) => [...rollupKeys.lists(), { filters }] as const,
  details: () => [...rollupKeys.all, "detail"] as const,
  detail: (id: string) => [...rollupKeys.details(), id] as const,
} as const;

export const useRollups = () => {
  return useQuery({
    queryKey: rollupKeys.lists(),
    queryFn: getRollups,
  });
};

export const useRollup = (id: string) => {
  return useQuery({
    queryKey: rollupKeys.detail(id),
    queryFn: () => getRollupById(id),
  });
};

export const useThanosStacksQuery = () => {
  return useQuery({
    queryKey: rollupKeys.thanosStacks,
    queryFn: getThanosStacks,
    retry: 2,
  });
};

export const useThanosStackByIdQuery = (id: string) => {
  return useQuery({
    queryKey: rollupKeys.thanosStack(id),
    queryFn: () => getThanosStackById(id),
  });
};

export const useIntegrationsQuery = (stackId: string) => {
  return useQuery({
    queryKey: rollupKeys.integrations(stackId),
    queryFn: () => getIntegrations(stackId),
    enabled: !!stackId,
  });
};
