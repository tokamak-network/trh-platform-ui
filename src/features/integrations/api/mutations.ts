import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  uninstallIntegration,
  installBridgeIntegration,
  installUptimeIntegration,
  installBlockExplorerIntegration,
  installMonitoringIntegration,
  registerDaoCandidateIntegration,
  installCrossChainBridgeIntegration,
  installCrossTradeL2ToL1Integration,
  installCrossTradeL2ToL2Integration,
  uninstallMonitoringIntegration,
  disableEmailAlert,
  disableTelegramAlert,
  configureTelegramAlert,
  configureEmailAlert,
  cancelIntegration,
  retryIntegration,
  InstallCrossChainBridgeRequestBody,
  registerTokens,
  RegisterTokensAPIRequest,
  deployNewL2Chain,
  DeployNewL2ChainRequest,
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
      type: "bridge" | "block-explorer" | "monitoring" | "register-candidate" | "system-pulse" | "cross-trade-l2-to-l1" | "cross-trade-l2-to-l2" | "drb";
      id?: string;
    }) => {
      return uninstallIntegration(stackId, type);
    },
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

export const useInstallUptimeMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: ({ stackId }: { stackId: string }) =>
      installUptimeIntegration(stackId),
    onMutate: () => {
      toast.loading("Installing System Pulse...", { id: "install-system-pulse" });
    },
    onSuccess: (_data, variables) => {
      toast.success("System Pulse installation initiated", { id: "install-system-pulse" });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to install System Pulse", {
        id: "install-system-pulse",
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

export interface InstallMonitoringVariables {
  stackId: string;
  grafanaPassword: string;
  loggingEnabled: boolean;
  alertManager: {
    telegram: {
      enabled: boolean;
      apiToken: string;
      criticalReceivers: Array<{ chatId: string }>;
    };
    email: {
      enabled: boolean;
      smtpSmarthost: string;
      smtpFrom: string;
      smtpAuthPassword: string;
      alertReceivers: string[];
    };
  };
}

export const useInstallMonitoringMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (variables: InstallMonitoringVariables) =>
      installMonitoringIntegration(variables.stackId, {
        grafanaPassword: variables.grafanaPassword,
        loggingEnabled: variables.loggingEnabled,
        alertManager: variables.alertManager,
      }),
    onMutate: () => {
      toast.loading("Installing Monitoring...", {
        id: "install-monitoring",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Monitoring installation initiated", {
        id: "install-monitoring",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to install Monitoring", {
        id: "install-monitoring",
      });
      options?.onError?.(error);
    },
  });
};

export const useUninstallMonitoringMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: ({ stackId }: { stackId: string }) =>
      uninstallMonitoringIntegration(stackId),
    onMutate: () => {
      toast.loading("Uninstalling Monitoring...", {
        id: "uninstall-monitoring",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Monitoring uninstall initiated", {
        id: "uninstall-monitoring",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to uninstall Monitoring", {
        id: "uninstall-monitoring",
      });
      options?.onError?.(error);
    },
  });
};

export interface RegisterDaoCandidateVariables {
  stackId: string;
  amount: number;
  memo: string;
  nameInfo?: string;
}

export const useRegisterDaoCandidateMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (variables: RegisterDaoCandidateVariables) =>
      registerDaoCandidateIntegration(variables.stackId, {
        amount: variables.amount,
        memo: variables.memo,
        nameInfo: variables.nameInfo,
      }),
    onMutate: () => {
      toast.loading("Registering DAO Candidate...", {
        id: "register-dao-candidate",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("DAO Candidate registration initiated", {
        id: "register-dao-candidate",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to register DAO Candidate", {
        id: "register-dao-candidate",
      });
      options?.onError?.(error);
    },
  });
};

export interface InstallCrossChainBridgeVariables {
  stackId: string;
  mode: "l2_to_l1" | "l2_to_l2";
  projectId: string;
  l1ChainConfig: InstallCrossChainBridgeRequestBody["l1ChainConfig"];
  l2ChainConfig: InstallCrossChainBridgeRequestBody["l2ChainConfig"];
}

export interface InstallCrossTradeL2ToL1Variables {
  stackId: string;
  projectId: string;
  l1ChainConfig: InstallCrossChainBridgeRequestBody["l1ChainConfig"];
  l2ChainConfig: InstallCrossChainBridgeRequestBody["l2ChainConfig"];
  tokens?: InstallCrossChainBridgeRequestBody["tokens"];
}

export const useInstallCrossTradeL2ToL1Mutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (variables: InstallCrossTradeL2ToL1Variables) =>
      installCrossTradeL2ToL1Integration(variables.stackId, {
        projectId: variables.projectId,
        l1ChainConfig: variables.l1ChainConfig,
        l2ChainConfig: variables.l2ChainConfig,
        ...(variables.tokens && { tokens: variables.tokens }),
      }),
    onMutate: () => {
      toast.loading("Installing Cross-Trade L2 to L1...", {
        id: "install-cross-trade-l2-to-l1",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Cross-Trade L2 to L1 installation initiated", {
        id: "install-cross-trade-l2-to-l1",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to install Cross-Trade L2 to L1", {
        id: "install-cross-trade-l2-to-l1",
      });
      options?.onError?.(error);
    },
  });
};

export interface InstallCrossTradeL2ToL2Variables {
  stackId: string;
  projectId: string;
  l1ChainConfig: InstallCrossChainBridgeRequestBody["l1ChainConfig"];
  l2ChainConfig: InstallCrossChainBridgeRequestBody["l2ChainConfig"];
  tokens?: InstallCrossChainBridgeRequestBody["tokens"];
}

export const useInstallCrossTradeL2ToL2Mutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (variables: InstallCrossTradeL2ToL2Variables) =>
      installCrossTradeL2ToL2Integration(variables.stackId, {
        projectId: variables.projectId,
        l1ChainConfig: variables.l1ChainConfig,
        l2ChainConfig: variables.l2ChainConfig,
        ...(variables.tokens && { tokens: variables.tokens }),
      }),
    onMutate: () => {
      toast.loading("Installing Cross-Trade L2 to L2...", {
        id: "install-cross-trade-l2-to-l2",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Cross-Trade L2 to L2 installation initiated", {
        id: "install-cross-trade-l2-to-l2",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to install Cross-Trade L2 to L2", {
        id: "install-cross-trade-l2-to-l2",
      });
      options?.onError?.(error);
    },
  });
};

export const useDisableEmailAlertMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: ({ stackId }: { stackId: string }) =>
      disableEmailAlert(stackId),
    onMutate: () => {
      toast.loading("Disabling email alerts...", {
        id: "disable-email-alert",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Email alerts disabled successfully", {
        id: "disable-email-alert",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disable email alerts", {
        id: "disable-email-alert",
      });
      options?.onError?.(error);
    },
  });
};

export const useDisableTelegramAlertMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: ({ stackId }: { stackId: string }) =>
      disableTelegramAlert(stackId),
    onMutate: () => {
      toast.loading("Disabling telegram alerts...", {
        id: "disable-telegram-alert",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Telegram alerts disabled successfully", {
        id: "disable-telegram-alert",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disable telegram alerts", {
        id: "disable-telegram-alert",
      });
      options?.onError?.(error);
    },
  });
};

export interface ConfigureTelegramAlertVariables {
  stackId: string;
  apiToken: string;
  criticalReceivers: Array<{ ChatId: string }>;
}

export const useConfigureTelegramAlertMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (variables: ConfigureTelegramAlertVariables) =>
      configureTelegramAlert(variables.stackId, {
        apiToken: variables.apiToken,
        criticalReceivers: variables.criticalReceivers,
      }),
    onMutate: () => {
      toast.loading("Configuring Telegram alerts...", {
        id: "configure-telegram-alert",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Telegram alerts configured successfully", {
        id: "configure-telegram-alert",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to configure Telegram alerts", {
        id: "configure-telegram-alert",
      });
      options?.onError?.(error);
    },
  });
};

export interface ConfigureEmailAlertVariables {
  stackId: string;
  smtpSmarthost: string;
  smtpFrom: string;
  smtpAuthPassword: string;
  alertReceivers: string[];
}

export const useConfigureEmailAlertMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (variables: ConfigureEmailAlertVariables) =>
      configureEmailAlert(variables.stackId, {
        smtpSmarthost: variables.smtpSmarthost,
        smtpFrom: variables.smtpFrom,
        smtpAuthPassword: variables.smtpAuthPassword,
        alertReceivers: variables.alertReceivers,
      }),
    onMutate: () => {
      toast.loading("Configuring email alerts...", {
        id: "configure-email-alert",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Email alerts configured successfully", {
        id: "configure-email-alert",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to configure email alerts", {
        id: "configure-email-alert",
      });
      options?.onError?.(error);
    },
  });
};

export const useCancelIntegrationMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: ({
      stackId,
      integrationId,
    }: {
      stackId: string;
      integrationId: string;
    }) => cancelIntegration(stackId, integrationId),
    onMutate: () => {
      toast.loading("Cancelling installation...", {
        id: "cancel-integration",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Installation cancelled successfully", {
        id: "cancel-integration",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel installation", {
        id: "cancel-integration",
      });
      options?.onError?.(error);
    },
  });
};

export interface RegisterTokensVariables {
  stackId: string;
  mode: "l2_to_l1" | "l2_to_l2";
  tokens: RegisterTokensAPIRequest["tokens"];
}

export const useRegisterTokensMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (variables: RegisterTokensVariables) =>
      registerTokens(variables.stackId, {
        mode: variables.mode,
        tokens: variables.tokens,
      }),
    onMutate: () => {
      toast.loading("Registering tokens...", {
        id: "register-tokens",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Tokens registered successfully", {
        id: "register-tokens",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to register tokens", {
        id: "register-tokens",
      });
      options?.onError?.(error);
    },
  });
};

export const useRetryIntegrationMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: ({
      stackId,
      integrationId,
    }: {
      stackId: string;
      integrationId: string;
    }) => retryIntegration(stackId, integrationId),
    onMutate: () => {
      toast.loading("Retrying installation...", {
        id: "retry-integration",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("Installation retry initiated successfully", {
        id: "retry-integration",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to retry installation", {
        id: "retry-integration",
      });
      options?.onError?.(error);
    },
  });
};

export interface DeployNewL2ChainVariables {
  stackId: string;
  mode: "l2_to_l1" | "l2_to_l2";
  l2ChainConfig: DeployNewL2ChainRequest["l2ChainConfig"];
}

export const useDeployNewL2ChainMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: (variables: DeployNewL2ChainVariables) =>
      deployNewL2Chain(variables.stackId, {
        mode: variables.mode,
        l2ChainConfig: variables.l2ChainConfig,
      }),
    onMutate: () => {
      toast.loading("Deploying new L2 chain...", {
        id: "deploy-l2-chain",
      });
    },
    onSuccess: (_data, variables) => {
      toast.success("L2 chain deployment initiated", {
        id: "deploy-l2-chain",
      });
      queryClient.invalidateQueries({
        queryKey: integrationKeys.list(variables.stackId),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to deploy L2 chain", {
        id: "deploy-l2-chain",
      });
      options?.onError?.(error);
    },
  });
};
