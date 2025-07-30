import { useState, useMemo } from "react";
import { Rollup } from "../schemas/rollup";

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
      const matchesStatus =
        statusFilter === "all" || rollup.status === statusFilter;
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
