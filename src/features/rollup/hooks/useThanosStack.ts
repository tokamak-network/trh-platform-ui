import { useCallback, useMemo } from "react";
import {
  rollupKeys,
  useThanosStackByIdQuery,
  useThanosStacksQuery,
} from "../api/queries";
import { ThanosStack, ThanosStackStatus } from "../schemas/thanos";
import { queryClient } from "@/providers/query-provider";

interface UseThanosStackResult {
  stacks: ThanosStack[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  getStackByStatus: (status: ThanosStackStatus) => ThanosStack[];
}

export const invalidateThanosStacks = () => {
  queryClient.invalidateQueries({ queryKey: rollupKeys.thanosStacks });
};

export const useThanosStack = (): UseThanosStackResult => {
  const {
    data: stacks = [],
    isLoading,
    isError,
    error,
  } = useThanosStacksQuery();

  // Filter out system stacks (e.g., "Thanos Sepolia (System)")
  const userStacks = useMemo(() => {
    return stacks.filter((stack) => !stack.name.includes("(System)"));
  }, [stacks]);

  const getStackByStatus = useCallback(
    (status: ThanosStackStatus) => {
      return userStacks.filter((stack) => stack.status === status);
    },
    [userStacks]
  );

  return {
    stacks: userStacks,
    isLoading,
    isError,
    error,
    getStackByStatus,
  };
};

export const useThanosStackById = (id: string) => {
  const {
    data: stack,
    isLoading,
    isError,
    error,
  } = useThanosStackByIdQuery(id);
  return {
    stack,
    isLoading,
    isError,
    error,
  };
};
