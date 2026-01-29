import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useIntegrationsQuery } from "@/features/integrations/api/queries";
import { DRBDeploymentInfo, getThanosSepolia } from "../services/drbService";

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
    const drbIntegrations = integrations.filter((i) => i.type === "drb");
    if (drbIntegrations.length === 0) return null;

    // Prefer active/in-progress integrations over failed ones
    // Priority: InProgress/Pending > Completed > Failed/Cancelled/etc
    const activeStatuses = ["InProgress", "Pending", "Completed"];
    const active = drbIntegrations.find((i) => activeStatuses.includes(i.status));
    if (active) return active;

    // Fall back to the most recent one (last in array since ordered by created_at asc)
    return drbIntegrations[drbIntegrations.length - 1];
  }, [integrations]);

  const deploymentInfo = useMemo((): DRBDeploymentInfo | null => {
    if (!drbIntegration || drbIntegration.status !== "Completed") return null;

    const info = drbIntegration.info;
    if (!info?.contract || !info?.application) return null;

    return {
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

  const status = drbIntegration?.status;

  return {
    integration: drbIntegration,
    deploymentInfo,
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
