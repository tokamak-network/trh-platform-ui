import { useCallback, useMemo } from "react";
import { useThanosStackByIdQuery, useThanosStacksQuery } from "../api/queries";
import { ThanosStack, ThanosStackStatus } from "../schemas/thanos";

interface UseThanosStackResult {
  stacks: ThanosStack[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  getStackByStatus: (status: ThanosStackStatus) => ThanosStack[];
}

export const useThanosStack = (): UseThanosStackResult => {
  const {
    data: stacks = [],
    isLoading,
    isError,
    error,
  } = useThanosStacksQuery();

  console.log("stacks", stacks);

  const getStackByStatus = useCallback(
    (status: ThanosStackStatus) => {
      return stacks.filter((stack) => stack.status === status);
    },
    [stacks]
  );

  return {
    stacks,
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
