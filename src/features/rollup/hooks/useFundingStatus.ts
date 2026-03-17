"use client";

import { formatEther } from "ethers";
import { useFundingStatusQuery } from "../api/queries";
import type { FundingAccount } from "../schemas/preset";

export function weiToEth(wei: string): string {
  try {
    return parseFloat(formatEther(wei)).toFixed(4);
  } catch {
    return "0.0000";
  }
}

export function isFulfilled(account: FundingAccount): boolean {
  return account.fulfilled;
}

export function useFundingStatus(deploymentId?: string) {
  const query = useFundingStatusQuery(deploymentId);

  const allFulfilled = query.data?.allFulfilled ?? false;
  const status = query.data?.status ?? "pending";
  const accounts = query.data?.accounts ?? [];

  const accountsWithEth = accounts.map((acc) => ({
    ...acc,
    requiredEth: weiToEth(acc.requiredWei),
    currentEth: weiToEth(acc.currentWei),
  }));

  return {
    ...query,
    allFulfilled,
    status,
    accounts: accountsWithEth,
    txHash: query.data?.txHash,
    message: query.data?.message,
  };
}
