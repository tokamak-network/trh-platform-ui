import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  deployRollup,
  deleteRollup,
  resumeRollup,
} from "../services/rollupService";
import { invalidateThanosStacks } from "../hooks/useThanosStack";
import { queryClient } from "@/providers/query-provider";
import { rollupKeys } from "./queries";
export {
  useUninstallIntegrationMutation,
  useInstallBridgeMutation,
} from "@/features/integrations/api/mutations";

export const useDeployRollupMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const router = useRouter();

  return useMutation({
    mutationFn: deployRollup,
    onMutate: () => {
      toast.loading("Deploying your rollup...", {
        id: "deploy-rollup",
      });
    },
    onSuccess: () => {
      toast.success("Rollup deployment initiated successfully!", {
        id: "deploy-rollup",
      });
      invalidateThanosStacks();
      router.push("/rollup");
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to deploy rollup", {
        id: "deploy-rollup",
      });
      options?.onError?.(error);
    },
  });
};

export const useDeleteRollupMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: deleteRollup,
    onMutate: () => {
      toast.loading("Destroying rollup...", {
        id: "delete-rollup",
      });
    },
    onSuccess: (_data, id) => {
      toast.success("Rollup destruction initiated successfully!", {
        id: "delete-rollup",
      });
      invalidateThanosStacks();
      if (id) {
        queryClient.invalidateQueries({ queryKey: rollupKeys.thanosStack(id) });
        queryClient.invalidateQueries({
          queryKey: rollupKeys.thanosDeployments(id),
        });
      }
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to destroy rollup", {
        id: "delete-rollup",
      });
      options?.onError?.(error);
    },
  });
};

export const useResumeRollupMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  return useMutation({
    mutationFn: resumeRollup,
    onMutate: () => {
      toast.loading("Resuming rollup...", {
        id: "resume-rollup",
      });
    },
    onSuccess: (_data, id) => {
      toast.success("Rollup resume initiated successfully!", {
        id: "resume-rollup",
      });
      invalidateThanosStacks();
      if (id) {
        queryClient.invalidateQueries({ queryKey: rollupKeys.thanosStack(id) });
        queryClient.invalidateQueries({
          queryKey: rollupKeys.thanosDeployments(id),
        });
      }
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resume rollup", {
        id: "resume-rollup",
      });
      options?.onError?.(error);
    },
  });
};
