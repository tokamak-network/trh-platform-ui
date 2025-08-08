import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  uninstallIntegration,
  installBridgeIntegration,
  installBlockExplorerIntegration,
} from "../services/integrationService";
import { queryClient } from "@/providers/query-provider";
import { integrationKeys } from "./queries";

export const useUninstallIntegrationMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: ({
      stackId,
      type,
    }: {
      stackId: string;
      type: "bridge" | "block-explorer" | "monitoring" | "register-candidate";
    }) => uninstallIntegration(stackId, type),
    onMutate: () => {
      toast.loading("Uninstalling component...", {
        id: "uninstall-integration",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Uninstall initiated successfully", {
        id: "uninstall-integration",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to uninstall component", {
        id: "uninstall-integration",
      });
      options?.onError?.(error);
    },
  });
};

export const useInstallBridgeMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: ({ stackId }: { stackId: string }) =>
      installBridgeIntegration(stackId),
    onMutate: () => {
      toast.loading("Installing Bridge...", { id: "install-bridge" });
    },
    onSuccess: (_data, variables) => {
      toast.success("Bridge installation initiated", { id: "install-bridge" });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to install bridge", {
        id: "install-bridge",
      });
      options?.onError?.(error);
    },
  });
};

export interface InstallBlockExplorerVariables {
  stackId: string;
  databaseUsername: string;
  databasePassword: string;
  coinmarketcapKey: string;
  walletConnectId: string;
}

export const useInstallBlockExplorerMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (variables: InstallBlockExplorerVariables) =>
      installBlockExplorerIntegration(variables.stackId, {
        databaseUsername: variables.databaseUsername,
        databasePassword: variables.databasePassword,
        coinmarketcapKey: variables.coinmarketcapKey,
        walletConnectId: variables.walletConnectId,
      }),
    onMutate: () => {
      toast.loading("Installing Block Explorer...", {
        id: "install-block-explorer",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Block Explorer installation initiated", {
        id: "install-block-explorer",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to install Block Explorer", {
        id: "install-block-explorer",
      });
      options?.onError?.(error);
    },
  });
};
