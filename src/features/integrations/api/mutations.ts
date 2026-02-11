import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  uninstallIntegration,
  installBridgeIntegration,
  installUptimeIntegration,
  installBlockExplorerIntegration,
  installMonitoringIntegration,
  registerDaoCandidateIntegration,
  uninstallMonitoringIntegration,
  disableEmailAlert,
  disableTelegramAlert,
  configureTelegramAlert,
  configureEmailAlert,
  cancelIntegration,
  retryIntegration,
} from "../services/integrationService";
import { queryClient } from "@/providers/query-provider";
import { integrationKeys } from "./queries";

/**
 * Generic factory function to create mutation hooks with common toast and query invalidation logic
 */
function createMutationHook<TData, TVariables, TError = Error>(config: {
  mutationFn: (variables: TVariables) => Promise<TData>;
  toastId: string;
  loadingMessage: string;
  successMessage: string;
  errorMessage: string;
  invalidateQueries?: (variables: TVariables) => void;
}) {
  return (
    options?: {
      onSuccess?: (data: TData, variables: TVariables) => void;
      onError?: (error: TError) => void;
    }
  ) => {
    return useMutation<TData, TError, TVariables>({
      mutationFn: config.mutationFn,
      onMutate: () => {
        toast.loading(config.loadingMessage, {
          id: config.toastId,
        });
      },
      onSuccess: (data, variables) => {
        toast.success(config.successMessage, {
          id: config.toastId,
        });
        config.invalidateQueries?.(variables);
        options?.onSuccess?.(data, variables);
      },
      onError: (error: TError) => {
        toast.error(
          error instanceof Error
            ? error.message || config.errorMessage
            : config.errorMessage,
          {
            id: config.toastId,
          }
        );
        options?.onError?.(error);
      },
    });
  };
}

export const useUninstallIntegrationMutation = createMutationHook<
  void,
  { stackId: string; type: "bridge" | "block-explorer" | "monitoring" | "register-candidate" | "system-pulse" }
>({
  mutationFn: ({ stackId, type }) => uninstallIntegration(stackId, type),
  toastId: "uninstall-integration",
  loadingMessage: "Uninstalling component...",
  successMessage: "Uninstall initiated successfully",
  errorMessage: "Failed to uninstall component",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export const useInstallBridgeMutation = createMutationHook<
  void,
  { stackId: string }
>({
  mutationFn: ({ stackId }) => installBridgeIntegration(stackId),
  toastId: "install-bridge",
  loadingMessage: "Installing Bridge...",
  successMessage: "Bridge installation initiated",
  errorMessage: "Failed to install bridge",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export const useInstallUptimeMutation = createMutationHook<
  void,
  { stackId: string }
>({
  mutationFn: ({ stackId }) => installUptimeIntegration(stackId),
  toastId: "install-system-pulse",
  loadingMessage: "Installing System Pulse...",
  successMessage: "System Pulse installation initiated",
  errorMessage: "Failed to install System Pulse",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export interface InstallBlockExplorerVariables {
  stackId: string;
  databaseUsername: string;
  databasePassword: string;
  coinmarketcapKey: string;
  walletConnectId: string;
}

export const useInstallBlockExplorerMutation = createMutationHook<
  void,
  InstallBlockExplorerVariables
>({
  mutationFn: (variables) =>
    installBlockExplorerIntegration(variables.stackId, {
      databaseUsername: variables.databaseUsername,
      databasePassword: variables.databasePassword,
      coinmarketcapKey: variables.coinmarketcapKey,
      walletConnectId: variables.walletConnectId,
    }),
  toastId: "install-block-explorer",
  loadingMessage: "Installing Block Explorer...",
  successMessage: "Block Explorer installation initiated",
  errorMessage: "Failed to install Block Explorer",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

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

export const useInstallMonitoringMutation = createMutationHook<
  void,
  InstallMonitoringVariables
>({
  mutationFn: (variables) =>
    installMonitoringIntegration(variables.stackId, {
      grafanaPassword: variables.grafanaPassword,
      loggingEnabled: variables.loggingEnabled,
      alertManager: variables.alertManager,
    }),
  toastId: "install-monitoring",
  loadingMessage: "Installing Monitoring...",
  successMessage: "Monitoring installation initiated",
  errorMessage: "Failed to install Monitoring",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export const useUninstallMonitoringMutation = createMutationHook<
  void,
  { stackId: string }
>({
  mutationFn: ({ stackId }) => uninstallMonitoringIntegration(stackId),
  toastId: "uninstall-monitoring",
  loadingMessage: "Uninstalling Monitoring...",
  successMessage: "Monitoring uninstall initiated",
  errorMessage: "Failed to uninstall Monitoring",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export interface RegisterDaoCandidateVariables {
  stackId: string;
  amount: number;
  memo: string;
  nameInfo?: string;
}

export const useRegisterDaoCandidateMutation = createMutationHook<
  void,
  RegisterDaoCandidateVariables
>({
  mutationFn: (variables) =>
    registerDaoCandidateIntegration(variables.stackId, {
      amount: variables.amount,
      memo: variables.memo,
      nameInfo: variables.nameInfo,
    }),
  toastId: "register-dao-candidate",
  loadingMessage: "Registering DAO Candidate...",
  successMessage: "DAO Candidate registration initiated",
  errorMessage: "Failed to register DAO Candidate",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export const useDisableEmailAlertMutation = createMutationHook<
  void,
  { stackId: string }
>({
  mutationFn: ({ stackId }) => disableEmailAlert(stackId),
  toastId: "disable-email-alert",
  loadingMessage: "Disabling email alerts...",
  successMessage: "Email alerts disabled successfully",
  errorMessage: "Failed to disable email alerts",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export const useDisableTelegramAlertMutation = createMutationHook<
  void,
  { stackId: string }
>({
  mutationFn: ({ stackId }) => disableTelegramAlert(stackId),
  toastId: "disable-telegram-alert",
  loadingMessage: "Disabling telegram alerts...",
  successMessage: "Telegram alerts disabled successfully",
  errorMessage: "Failed to disable telegram alerts",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export interface ConfigureTelegramAlertVariables {
  stackId: string;
  apiToken: string;
  criticalReceivers: Array<{ chatId: string }>;
}

export const useConfigureTelegramAlertMutation = createMutationHook<
  void,
  ConfigureTelegramAlertVariables
>({
  mutationFn: (variables) =>
    configureTelegramAlert(variables.stackId, {
      apiToken: variables.apiToken,
      criticalReceivers: variables.criticalReceivers,
    }),
  toastId: "configure-telegram-alert",
  loadingMessage: "Configuring Telegram alerts...",
  successMessage: "Telegram alerts configured successfully",
  errorMessage: "Failed to configure Telegram alerts",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export interface ConfigureEmailAlertVariables {
  stackId: string;
  smtpSmarthost: string;
  smtpFrom: string;
  smtpAuthPassword: string;
  alertReceivers: string[];
}

export const useConfigureEmailAlertMutation = createMutationHook<
  void,
  ConfigureEmailAlertVariables
>({
  mutationFn: (variables) =>
    configureEmailAlert(variables.stackId, {
      smtpSmarthost: variables.smtpSmarthost,
      smtpFrom: variables.smtpFrom,
      smtpAuthPassword: variables.smtpAuthPassword,
      alertReceivers: variables.alertReceivers,
    }),
  toastId: "configure-email-alert",
  loadingMessage: "Configuring email alerts...",
  successMessage: "Email alerts configured successfully",
  errorMessage: "Failed to configure email alerts",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export const useCancelIntegrationMutation = createMutationHook<
  void,
  { stackId: string; integrationId: string }
>({
  mutationFn: ({ stackId, integrationId }) =>
    cancelIntegration(stackId, integrationId),
  toastId: "cancel-integration",
  loadingMessage: "Cancelling installation...",
  successMessage: "Installation cancelled successfully",
  errorMessage: "Failed to cancel installation",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});

export const useRetryIntegrationMutation = createMutationHook<
  void,
  { stackId: string; integrationId: string }
>({
  mutationFn: ({ stackId, integrationId }) =>
    retryIntegration(stackId, integrationId),
  toastId: "retry-integration",
  loadingMessage: "Retrying installation...",
  successMessage: "Installation retry initiated successfully",
  errorMessage: "Failed to retry installation",
  invalidateQueries: (variables) => {
    queryClient.invalidateQueries({
      queryKey: integrationKeys.list(variables.stackId),
    });
  },
});
