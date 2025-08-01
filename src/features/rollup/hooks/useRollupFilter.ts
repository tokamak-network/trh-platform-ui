import { useState, useMemo } from "react";
import { RollupType } from "../schemas/rollup";
import { ThanosStack, ThanosStackStatus } from "../schemas/thanos";

interface UseRollupFilterProps {
  rollups: ThanosStack[];
}

interface UseRollupFilterReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  filteredRollups: ThanosStack[];
}

export function useRollupFilter({
  rollups,
}: UseRollupFilterProps): UseRollupFilterReturn {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredRollups = useMemo(() => {
    return rollups.filter((stack) => {
      // Search by chain name
      const matchesSearch = stack.config.chainName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Handle status filter using ThanosStackStatus values
      const matchesStatus =
        statusFilter === "all" || stack.status === statusFilter;

      // Handle type filter using RollupType enum
      const stackType =
        stack.type || (stack.config?.type ? stack.config.type : null);
      const matchesType = typeFilter === "all" || stackType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [rollups, searchTerm, statusFilter, typeFilter]);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    filteredRollups,
  };
}
