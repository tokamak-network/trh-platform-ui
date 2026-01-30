import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { installDRB, uninstallDRB, InstallDRBRequestBody } from "../services/drbService";
import { queryClient } from "@/providers/query-provider";
import { integrationKeys } from "@/features/integrations/api/queries";

type InstallParams = { stackId: string } & InstallDRBRequestBody;

export const useInstallDRBMutation = () =>
  useMutation({
    mutationFn: ({ stackId, ...body }: InstallParams) => installDRB(stackId, body),
    onMutate: () => toast.loading("Deploying DRB...", { id: "drb" }),
    onSuccess: (response, { stackId }) => {
      toast.success("DRB deployment started", { id: "drb" });
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(stackId) });
      // Also invalidate the new stack if it's different (for regular nodes)
      const newStackId = response.data?.stackId;
      if (newStackId && newStackId !== stackId) {
        queryClient.invalidateQueries({ queryKey: integrationKeys.list(newStackId) });
      }
    },
    onError: (error: Error) => toast.error(error.message || "Failed to deploy DRB", { id: "drb" }),
  });

export const useUninstallDRBMutation = () =>
  useMutation({
    mutationFn: ({ stackId }: { stackId: string }) => uninstallDRB(stackId),
    onMutate: () => toast.loading("Uninstalling DRB...", { id: "drb-uninstall" }),
    onSuccess: (_, { stackId }) => {
      toast.success("DRB uninstall started", { id: "drb-uninstall" });
      queryClient.invalidateQueries({ queryKey: integrationKeys.list(stackId) });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to uninstall DRB", { id: "drb-uninstall" }),
  });
