import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { deployRollup } from "../services/rollupService";

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
