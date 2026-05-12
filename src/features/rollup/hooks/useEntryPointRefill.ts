"use client";

import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import { ThanosStack, ThanosStackStatus } from "../schemas/thanos";

// EntryPoint predeploy address (fixed across all chains)
const ENTRYPOINT_ADDRESS = "0x4200000000000000000000000000000000000063";

// Thresholds (in TON / ETH — the L2 native gas token)
export const REFILL_TRIGGER_THRESHOLD = 0.5;  // TON
export const REFILL_AMOUNT = 5;               // TON
export const WARN_THRESHOLD = 1.0;            // TON

// Deposited(address indexed account, uint256 totalDeposit)
const DEPOSITED_TOPIC = ethers.id("Deposited(address,uint256)");

export type RefillStatus = "healthy" | "warning" | "critical" | "unknown";

export interface RefillEvent {
  blockNumber: number;
  transactionHash: string;
  amount: string;      // formatted ETH string
  timestamp?: number;  // unix seconds
}

export interface EntryPointRefillData {
  balance: string;          // formatted, e.g. "3.21"
  balanceNum: number;
  adminBalance: string;     // formatted admin wallet balance
  adminBalanceNum: number;
  status: RefillStatus;
  /** estimated seconds until trigger threshold is hit (null if unavailable) */
  etaSeconds: number | null;
  recentRefills: RefillEvent[];
  updatedAt: number;        // Date.now()
}

async function fetchRefillData(stack: ThanosStack): Promise<EntryPointRefillData> {
  const rpcUrl = stack.metadata?.l2RpcUrl;
  const adminHex = stack.config.adminAccount
    ? stack.config.adminAccount.startsWith("0x")
      ? stack.config.adminAccount
      : null   // private key — skip balance check
    : null;

  if (!rpcUrl) throw new Error("No L2 RPC URL in stack metadata");

  const chainId = stack.metadata?.l2ChainId;
  try {
    return await _fetchRefillData(rpcUrl, adminHex, chainId);
  } catch (e) {
    console.error("[EntryPointRefill] fetch failed", { rpcUrl, error: e });
    throw e;
  }
}

async function _fetchRefillData(rpcUrl: string, adminHex: string | null, chainId?: number): Promise<EntryPointRefillData> {

  // Pass chainId explicitly to skip eth_chainId auto-detection on every call (ethers.js v6).
  // Use `new ethers.Network` (not Network.from) — custom L2 chains aren't in ethers' built-in list.
  const network = chainId ? new ethers.Network("", chainId) : undefined;
  const provider = new ethers.JsonRpcProvider(rpcUrl, network, network ? { staticNetwork: network } : undefined);

  // Parallel: EntryPoint balance + admin balance + recent logs
  const [epBalanceWei, adminBalanceWei, latestBlock] = await Promise.all([
    provider.getBalance(ENTRYPOINT_ADDRESS),
    adminHex ? provider.getBalance(adminHex).catch(() => BigInt(0)) : Promise.resolve(BigInt(0)),
    provider.getBlockNumber(),
  ]);

  const balance = parseFloat(ethers.formatEther(epBalanceWei));
  const adminBalance = parseFloat(ethers.formatEther(adminBalanceWei));

  // Determine status
  let status: RefillStatus = "healthy";
  if (balance < REFILL_TRIGGER_THRESHOLD) status = "critical";
  else if (balance < WARN_THRESHOLD) status = "warning";

  // Fetch recent Deposited events (last ~2000 blocks ≈ ~1h at 2s block time)
  const fromBlock = Math.max(0, latestBlock - 2000);
  let recentRefills: RefillEvent[] = [];
  try {
    const logs = await provider.getLogs({
      address: ENTRYPOINT_ADDRESS,
      topics: [DEPOSITED_TOPIC],
      fromBlock,
      toBlock: latestBlock,
    });

    // Fetch timestamps for the last 5 refill events (limit RPC calls)
    const recentLogs = logs.slice(-5).reverse();
    recentRefills = await Promise.all(
      recentLogs.map(async (log) => {
        const block = await provider.getBlock(log.blockNumber).catch(() => null);
        const amount = log.data !== "0x"
          ? parseFloat(ethers.formatEther(ethers.AbiCoder.defaultAbiCoder().decode(["uint256"], log.data)[0] as bigint))
          : 0;
        return {
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          amount: amount.toFixed(6),
          timestamp: block?.timestamp,
        };
      })
    );
  } catch {
    // Logs may not be available on all nodes — degrade gracefully
  }

  // ETA estimation: use burn rate from last 2000 blocks
  let etaSeconds: number | null = null;
  if (recentRefills.length >= 2 && status === "healthy") {
    // Rough: (balance - threshold) / burn_rate
    // Burn rate estimated from time between refills
    const newest = recentRefills[0];
    const oldest = recentRefills[recentRefills.length - 1];
    if (newest.timestamp && oldest.timestamp && newest.timestamp !== oldest.timestamp) {
      const totalConsumed = recentRefills.reduce((s, r) => s + parseFloat(r.amount), 0);
      const totalSeconds = oldest.timestamp - newest.timestamp;
      if (totalSeconds > 0 && totalConsumed > 0) {
        const burnPerSec = totalConsumed / totalSeconds;
        etaSeconds = (balance - REFILL_TRIGGER_THRESHOLD) / burnPerSec;
      }
    }
  }

  return {
    balance: balance.toFixed(6),
    balanceNum: balance,
    adminBalance: adminBalance.toFixed(6),
    adminBalanceNum: adminBalance,
    status,
    etaSeconds,
    recentRefills,
    updatedAt: Date.now(),
  };
}

export function useEntryPointRefill(stack?: ThanosStack) {
  const isDeployed = stack?.status === ThanosStackStatus.DEPLOYED;
  const hasRpc = Boolean(stack?.metadata?.l2RpcUrl);

  return useQuery({
    queryKey: ["entryPointRefill", stack?.id],
    queryFn: () => fetchRefillData(stack!),
    enabled: isDeployed && hasRpc,
    refetchInterval: 30_000,   // 30s polling
    staleTime: 15_000,
    retry: 2,
  });
}
