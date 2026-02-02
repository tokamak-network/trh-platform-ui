"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CommitReveal2L2_ABI, ConsumerExampleV2_ABI, THANOS_SEPOLIA_CHAIN } from "../contracts/abis";

export interface RequestInfo {
  requestId: bigint;
  requester: string;
  fulfillBlockNumber: bigint;
  randomNumber: bigint;
  isRefunded: boolean;
  requestFee: bigint;
}

export interface DRBContractState {
  operators: string[];
  operatorCount: number;
  currentRound: bigint;
  roundStartTime: bigint;
  flatFee: bigint;
  requestCount: bigint;
  requests: RequestInfo[];
  isLoading: boolean;
  error: string | null;
}

interface UseDRBContractProps {
  commitReveal2Address?: string;
  consumerExampleAddress?: string;
  rpcUrl?: string;
}

export function useDRBContract({
  commitReveal2Address,
  consumerExampleAddress,
  rpcUrl,
}: UseDRBContractProps) {
  const [state, setState] = useState<DRBContractState>({
    operators: [],
    operatorCount: 0,
    currentRound: BigInt(0),
    roundStartTime: BigInt(0),
    flatFee: BigInt(0),
    requestCount: BigInt(0),
    requests: [],
    isLoading: false,
    error: null,
  });

  const getProvider = useCallback(() => {
    const url = rpcUrl || THANOS_SEPOLIA_CHAIN.rpcUrl;
    return new ethers.JsonRpcProvider(url);
  }, [rpcUrl]);

  const fetchContractState = useCallback(async () => {
    if (!commitReveal2Address) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const provider = getProvider();

      // CommitReveal2L2 contract
      const commitReveal2 = new ethers.Contract(
        commitReveal2Address,
        CommitReveal2L2_ABI,
        provider
      );

      // Fetch operators and round info
      const [operators, operatorCount, roundInfo, flatFee] = await Promise.all([
        commitReveal2.getActivatedOperators() as Promise<string[]>,
        commitReveal2.getActivatedOperatorsLength() as Promise<bigint>,
        commitReveal2.getCurRoundAndStartTime() as Promise<[bigint, bigint]>,
        commitReveal2.s_flatFee() as Promise<bigint>,
      ]);

      let requests: RequestInfo[] = [];
      let requestCount = BigInt(0);

      // ConsumerExampleV2 contract (if available)
      if (consumerExampleAddress) {
        const consumerExample = new ethers.Contract(
          consumerExampleAddress,
          ConsumerExampleV2_ABI,
          provider
        );

        try {
          const mainInfos = await consumerExample.getMainInfos();
          requestCount = mainInfos[0] as bigint;
          const rawRequests = mainInfos[1] as Array<{
            requestId: bigint;
            requester: string;
            fulfillBlockNumber: bigint;
            randomNumber: bigint;
            isRefunded: boolean;
            requestFee: bigint;
          }>;

          // Filter out empty requests (requestId = 0)
          requests = rawRequests
            .filter((r) => r.requestId > 0)
            .map((r) => ({
              requestId: r.requestId,
              requester: r.requester,
              fulfillBlockNumber: r.fulfillBlockNumber,
              randomNumber: r.randomNumber,
              isRefunded: r.isRefunded,
              requestFee: r.requestFee,
            }));
        } catch {
          // Consumer contract might not have any requests yet
        }
      }

      setState({
        operators,
        operatorCount: Number(operatorCount),
        currentRound: roundInfo[0],
        roundStartTime: roundInfo[1],
        flatFee,
        requestCount,
        requests,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to fetch contract state",
      }));
    }
  }, [commitReveal2Address, consumerExampleAddress, getProvider]);

  const estimateRequestPrice = useCallback(
    async (callbackGasLimit: number = 100000): Promise<bigint> => {
      if (!commitReveal2Address) return BigInt(0);

      try {
        const provider = getProvider();
        const commitReveal2 = new ethers.Contract(
          commitReveal2Address,
          CommitReveal2L2_ABI,
          provider
        );

        const gasPrice = (await provider.getFeeData()).gasPrice || BigInt(1000000000);
        const price = await commitReveal2.estimateRequestPrice(callbackGasLimit, gasPrice);
        return price as bigint;
      } catch {
        return BigInt(0);
      }
    },
    [commitReveal2Address, getProvider]
  );

  const requestRandomNumber = useCallback(
    async (signer: ethers.Signer): Promise<ethers.TransactionResponse> => {
      if (!consumerExampleAddress) {
        throw new Error("Consumer contract address not available");
      }

      const consumerExample = new ethers.Contract(
        consumerExampleAddress,
        ConsumerExampleV2_ABI,
        signer
      );

      // Estimate the required fee
      const estimatedFee = await estimateRequestPrice();
      // Add 20% buffer to the estimated fee
      const feeWithBuffer = (estimatedFee * BigInt(120)) / BigInt(100);

      const tx = await consumerExample.requestRandomNumber({ value: feeWithBuffer });
      return tx;
    },
    [consumerExampleAddress, estimateRequestPrice]
  );

  useEffect(() => {
    fetchContractState();
  }, [fetchContractState]);

  return {
    ...state,
    fetchContractState,
    estimateRequestPrice,
    requestRandomNumber,
  };
}
