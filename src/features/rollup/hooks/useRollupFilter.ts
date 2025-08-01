import { useState, useMemo } from "react";
import { Rollup, RollupType } from "../schemas/rollup";
import { ThanosStackStatus } from "../schemas/thanos";

interface UseRollupFilterProps {
  rollups: Rollup[];
}

interface UseRollupFilterReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  filteredRollups: Rollup[];
}

export function useRollupFilter({
  rollups,
}: UseRollupFilterProps): UseRollupFilterReturn {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredRollups = useMemo(() => {
    return rollups.filter((rollup) => {
      const matchesSearch = rollup.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Handle status filter using ThanosStackStatus values
      const matchesStatus =
        statusFilter === "all" ||
        // Convert the rollup.status to match ThanosStackStatus format if needed
        (rollup.status === "active" &&
          statusFilter === ThanosStackStatus.DEPLOYED) ||
        (rollup.status === "maintenance" &&
          statusFilter === ThanosStackStatus.UPDATING) ||
        (rollup.status === "inactive" &&
          statusFilter === ThanosStackStatus.STOPPED) ||
        // Direct match for stacks that already use ThanosStackStatus
        rollup.status === statusFilter;

      // Handle type filter using RollupType enum
      const matchesType = typeFilter === "all" || rollup.type === typeFilter;

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
