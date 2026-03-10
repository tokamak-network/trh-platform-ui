"use client";

import { useFundingStatusQuery } from "../api/queries";
import type { FundingAccount } from "../schemas/preset";

const WEI_PER_ETH = BigInt("1000000000000000000");

export function weiToEth(wei: string): string {
  try {
    const weiBig = BigInt(wei);
    const eth = Number(weiBig * BigInt(1000) / WEI_PER_ETH) / 1000;
    return eth.toFixed(4);
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
