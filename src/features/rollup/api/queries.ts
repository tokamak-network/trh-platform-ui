import { useQuery } from "@tanstack/react-query";
import { getRollups, getRollupById } from "../services/rollupService";

export const rollupKeys = {
  all: ["rollups"] as const,
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
