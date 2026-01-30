import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIntegrationsQuery } from "@/features/integrations/api/queries";
import { DRBDeploymentInfo, DRBNodeType, getDRBInfo, GetDRBInfoResponse, getThanosSepolia } from "../services/drbService";

// query keys for drb queries
export const drbKeys = {
  all: ["drb"] as const,
  info: (stackId: string) => [...drbKeys.all, "info", stackId] as const,
};

/**
 * Hook to get the Thanos Sepolia system stack.
 * This is used for alpha release where DRB can be deployed without a user-created stack.
 */
export const useThanosSepolia = () => {
  return useQuery({
    queryKey: ["thanos-sepolia-system"],
    queryFn: async () => {
      const response = await getThanosSepolia();
      return response.data?.stack;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get DRB deployment info from the integrations list.
 * Returns the DRB integration if it exists and is completed.
 */
export const useDRBDeploymentInfo = (stackId: string) => {
  const { data: integrations, isLoading, error } = useIntegrationsQuery(stackId);

  const drbIntegration = useMemo(() => {
    if (!integrations) return null;
    // Filter out Terminated integrations - they should be treated as "uninstalled"
    const drbIntegrations = integrations.filter((i) => i.type === "drb" && i.status !== "Terminated");
    if (drbIntegrations.length === 0) return null;

    // Prefer active/in-progress integrations over failed ones
    // Priority: InProgress/Pending > Completed > Failed/Cancelled/etc
    const activeStatuses = ["InProgress", "Pending", "Completed", "Terminating"];
    const active = drbIntegrations.find((i) => activeStatuses.includes(i.status));
    if (active) return active;

    // Fall back to the most recent one (last in array since ordered by created_at asc)
    return drbIntegrations[drbIntegrations.length - 1];
  }, [integrations]);

  const deploymentInfo = useMemo((): DRBDeploymentInfo | null => {
    if (!drbIntegration || drbIntegration.status !== "Completed") return null;

    const info = drbIntegration.info;
    const nodeType: DRBNodeType = info?.nodeType || "leader";

    // for the regular nodes we may not have contract and application info
    if (nodeType === "regular") {
      return {
        nodeType,
        regularNodeInfo: info?.regularNodeInfo ? {
          nodeUrl: info.regularNodeInfo.nodeUrl,
          nodeIp: info.regularNodeInfo.nodeIp,
          nodePort: info.regularNodeInfo.nodePort,
          nodePeerId: info.regularNodeInfo.nodePeerId,
          nodeEoa: info.regularNodeInfo.nodeEoa,
          instanceId: info.regularNodeInfo.instanceId,
          instanceType: info.regularNodeInfo.instanceType,
          region: info.regularNodeInfo.region,
          chainId: info.regularNodeInfo.chainId,
          rpcUrl: info.regularNodeInfo.rpcUrl,
          leaderIp: info.regularNodeInfo.leaderIp,
          leaderPort: info.regularNodeInfo.leaderPort,
          leaderPeerId: info.regularNodeInfo.leaderPeerId,
          leaderEoa: info.regularNodeInfo.leaderEoa,
          contractAddress: info.regularNodeInfo.contractAddress,
          deploymentTimestamp: info.regularNodeInfo.deploymentTimestamp,
        } : undefined,
        databaseType: info?.databaseType ?? "rds",
      };
    }

    // but for leader nodes require contract or application info
    if (!info?.contract || !info?.application) return null;

    return {
      nodeType,
      contract: {
        contractAddress: info.contract.contractAddress,
        contractName: info.contract.contractName,
        chainId: info.contract.chainId,
        consumerExampleV2Address: info.contract.consumerExampleV2Address,
      },
      application: {
        leaderNodeUrl: info.application.leaderNodeUrl,
      },
      leaderInfo: info.leaderInfo ? {
        leaderUrl: info.leaderInfo.leaderUrl,
        leaderIp: info.leaderInfo.leaderIp,
        leaderPort: info.leaderInfo.leaderPort,
        leaderPeerId: info.leaderInfo.leaderPeerId,
        leaderEoa: info.leaderInfo.leaderEoa,
        commitReveal2L2Address: info.leaderInfo.commitReveal2L2Address,
        consumerExampleV2Address: info.leaderInfo.consumerExampleV2Address,
        chainId: info.leaderInfo.chainId,
        rpcUrl: info.leaderInfo.rpcUrl,
        deploymentTimestamp: info.leaderInfo.deploymentTimestamp,
        clusterName: info.leaderInfo.clusterName,
        namespace: info.leaderInfo.namespace,
      } : undefined,
      databaseType: info.databaseType ?? "rds",
    };
  }, [drbIntegration]);

  // gets node type from config or info
  const nodeType = useMemo((): DRBNodeType | undefined => {
    if (!drbIntegration) return undefined;
    const infoNodeType = drbIntegration.info?.nodeType;
    const configNodeType = drbIntegration.config?.nodeType as DRBNodeType | undefined;
    return infoNodeType || configNodeType || "leader";
  }, [drbIntegration]);

  const status = drbIntegration?.status;

  return {
    integration: drbIntegration,
    deploymentInfo,
    nodeType,
    status,
    reason: drbIntegration?.reason,
    isInstalled: !!drbIntegration,
    isCompleted: status === "Completed",
    isInProgress: status === "InProgress" || status === "Pending",
    isTerminating: status === "Terminating",
    isCancelling: status === "Cancelling",
    isFailed: status === "Failed",
    isCancelled: status === "Cancelled",
    isLoading,
    error,
  };
};

/**
 * Hook to directly query DRB info using the dedicated endpoint.
 * Provides more detailed status information than the integrations list.
 */
export const useDRBInfo = (stackId: string, enabled = true) => {
  return useQuery({
    queryKey: drbKeys.info(stackId),
    queryFn: async (): Promise<GetDRBInfoResponse> => {
      const response = await getDRBInfo(stackId);
      return response.data!;
    },
    enabled: enabled && !!stackId,
    staleTime: 30 * 1000, // 30sec
  });
};
