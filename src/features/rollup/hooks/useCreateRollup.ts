"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Network, Database, Tag, CheckCircle } from "lucide-react";
import { useDeployRollupMutation } from "../api";
import { CHAIN_NETWORK } from "../const";
import type { CreateRollupFormData } from "../schemas/create-rollup";
import {
  convertFormToDeploymentRequest,
  createRollupSchema,
} from "../schemas/create-rollup";
import { useRollupCreationContext, defaultFormData } from "../context/RollupCreationContext";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";

export const STEPS = [
  {
    id: 1,
    title: "Network & Chain",
    description: "Configure network and chain settings",
    icon: Network,
  },
  {
    id: 2,
    title: "Account & AWS",
    description: "Setup accounts and AWS configuration",
    icon: Database,
  },
  {
    id: 3,
    title: "DAO Candidate",
    description: "Register your rollup as a DAO candidate",
    icon: Tag,
  },
  {
    id: 4,
    title: "Review & Deploy",
    description: "Review configuration and deploy",
    icon: CheckCircle,
  },
];

const isLocalNetwork = (network: string | undefined) =>
  network === CHAIN_NETWORK.LOCAL_TESTNET;

export function useCreateRollup() {
  const router = useRouter();
  const { state, updateFormData, updateCurrentStep, resetState } = useRollupCreationContext();

  const form = useForm<CreateRollupFormData>({
    resolver: zodResolver(createRollupSchema),
    defaultValues: state.formData || defaultFormData,
  });

  const [showChecklist, setShowChecklist] = useState(false);

  // Load saved data when component mounts
  useEffect(() => {
    if (state.formData) {
      // Reset with saved data but keep it as the new default values
      form.reset(state.formData, { keepDefaultValues: true });
    }
  }, [state.formData, form]);

  // Watch for form changes and save to context
  useEffect(() => {
    const subscription = form.watch((data, { name }) => {
      // Save to context whenever any field changes
      if (name && data) {
        updateFormData(data as CreateRollupFormData);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, updateFormData]);

  const getProgress = (step: number) => {
    switch (step) {
      case 1:
        return 25;
      case 2:
        return 50;
      case 3:
        return 75;
      case 4:
        return 100;
      default:
        return 0;
    }
  };

  const progress = getProgress(state.currentStep);

  const deployMutation = useDeployRollupMutation({
    onSuccess: () => {
      // Reset form and context state on successful deployment
      form.reset(defaultFormData);
      resetState();
    },
    onError: (error) => {
      form.setError("root", {
        message: error.message || "Failed to deploy rollup",
      });
    },
  });

  // Validation types from rollupService
  const [estimatedCost, setEstimatedCost] = useState<{
    deploymentGasEth: string;
  } | undefined>(undefined);

  const buildValidationPayload = useCallback((formData: CreateRollupFormData) => ({
    network: formData.networkAndChain.network,
    l1RpcUrl: formData.networkAndChain.l1RpcUrl,
    l1BeaconUrl: formData.networkAndChain.l1BeaconUrl,
    l2BlockTime: formData.networkAndChain.l2BlockTime
      ? parseInt(formData.networkAndChain.l2BlockTime)
      : 6,
    batchSubmissionFrequency: formData.networkAndChain.batchSubmissionFreq
      ? parseInt(formData.networkAndChain.batchSubmissionFreq)
      : 1440,
    outputRootFrequency: formData.networkAndChain.outputRootFreq
      ? parseInt(formData.networkAndChain.outputRootFreq)
      : 240,
    challengePeriod: formData.networkAndChain.challengePeriod
      ? parseInt(formData.networkAndChain.challengePeriod)
      : 12,
    adminAddress: formData.accountAndAws.adminAccount,
    sequencerAddress: formData.accountAndAws.sequencerAccount,
    batcherAddress: formData.accountAndAws.batchAccount,
    proposerAddress: formData.accountAndAws.proposerAccount,
    awsAccessKey: formData.accountAndAws.awsAccessKey,
    awsSecretAccessKey: formData.accountAndAws.awsSecretKey,
    awsRegion: formData.accountAndAws.awsRegion,
    chainName: formData.networkAndChain.chainName,
    mainnetConfirmation:
      formData.networkAndChain.network === "mainnet" &&
        formData.confirmation?.agreedToMainnetRisks
        ? {
          acknowledgedIrreversibility: true,
          acknowledgedCosts: true,
          acknowledgedRisks: true,
          confirmationTimestamp: new Date().toISOString(),
        }
        : undefined,
  }), []);

  const validateAndEstimateDeployment = useCallback(async () => {
    const isValid = await form.trigger();
    if (!isValid) return false;

    const formData = form.getValues();

    try {
      toast.loading("Validating deployment parameters...");

      const { validateDeployment } = await import("../services/rollupService");
      const validationResult = await validateDeployment(buildValidationPayload(formData));

      if (!validationResult.allValid) {
        toast.dismiss();
        const errors = Object.entries(validationResult.checks)
          .filter(([, check]) => !check.valid)
          .map(([key, check]) => `${key}: ${check.error}`)
          .join("\n");

        toast.error(`Validation Failed:\n${errors}`, { duration: 5000 });
        return false;
      }

      if (validationResult.estimatedCost) {
        setEstimatedCost(validationResult.estimatedCost);
      }

      toast.dismiss();
      toast.success("Validation passed!");
      return true;
    } catch {
      toast.dismiss();
      toast.error("Validation service unavailable. Please try again later.");
      return false;
    }
  }, [form, setEstimatedCost, buildValidationPayload]);

  const handleDeployRollup = async () => {
    const formData = form.getValues();

    if (!isLocalNetwork(formData.networkAndChain.network)) {
      const isValid = await validateAndEstimateDeployment();
      if (!isValid) return;
    }

    const request = convertFormToDeploymentRequest(formData);
    form.setError("root", { message: "" });
    await deployMutation.mutateAsync(request);
  };

  const validateStep1 = async (isLocal: boolean): Promise<boolean | "blocked"> => {
    const baseFields = [
      "networkAndChain.network",
      "networkAndChain.chainName",
      ...(isLocal
        ? (["networkAndChain.kubeconfigPath"] as const)
        : (["networkAndChain.l1RpcUrl", "networkAndChain.l1BeaconUrl"] as const)),
    ] as const;

    const advancedFields = [
      "networkAndChain.l2BlockTime",
      "networkAndChain.batchSubmissionFreq",
      "networkAndChain.outputRootFreq",
      "networkAndChain.challengePeriod",
    ] as const;

    const isValid = await form.trigger([
      ...baseFields,
      ...(!isLocal && form.getValues("networkAndChain.advancedConfig")
        ? advancedFields
        : []),
    ]);

    if (!isValid) return false;
    if (isLocal) return true;

    return verifyRpcConnection();
  };

  const verifyRpcConnection = async (): Promise<boolean | "blocked"> => {
    const formData = form.getValues();
    const rpcUrl = formData.networkAndChain.l1RpcUrl;

    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      toast.loading("Verifying RPC connection...", { id: "check-rpc" });
      const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, { staticNetwork: null });

      const timeoutPromise = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("RPC Connection Timed out")), 5000);
      });

      const network = await Promise.race([provider.getNetwork(), timeoutPromise]);
      clearTimeout(timer);

      const chainId = Number(network.chainId);

      if (formData.networkAndChain.network === "mainnet" && chainId !== 1) {
        throw new Error(`Chain ID mismatch: Got ${chainId}, expected 1 (Mainnet)`);
      } else if (formData.networkAndChain.network === "testnet" && chainId !== 11155111) {
        throw new Error(`Chain ID mismatch: Got ${chainId}, expected 11155111 (Sepolia)`);
      }

      toast.success("RPC Connection Verified", { id: "check-rpc" });
      return true;
    } catch (error) {
      clearTimeout(timer);
      let msg = "Unknown RPC validation error";
      if (error instanceof Error) {
        msg = error.message;
        if ("code" in error && (error as { code: unknown }).code === "NETWORK_ERROR") {
          msg = "Network Error (CORS or Invalid URL)";
        }
      }
      toast.error(`RPC Validation Failed:\n${msg}`, { id: "check-rpc" });
      return "blocked";
    }
  };

  const validateStep2 = async (isLocal: boolean): Promise<boolean> => {
    const accountFields = [
      "accountAndAws.seedPhrase",
      "accountAndAws.adminAccount",
      "accountAndAws.adminPrivateKey",
      "accountAndAws.proposerAccount",
      "accountAndAws.proposerPrivateKey",
      "accountAndAws.batchAccount",
      "accountAndAws.batchPrivateKey",
      "accountAndAws.sequencerAccount",
      "accountAndAws.sequencerPrivateKey",
    ] as const;
    const awsFields = [
      "accountAndAws.accountName",
      "accountAndAws.credentialId",
      "accountAndAws.awsAccessKey",
      "accountAndAws.awsSecretKey",
      "accountAndAws.awsRegion",
    ] as const;
    return form.trigger([
      ...accountFields,
      ...(isLocal ? [] : awsFields),
    ]);
  };

  const validateStep3 = async (isLocal: boolean): Promise<boolean | "skipped"> => {
    if (isLocal) {
      form.setValue("daoCandidate", undefined);
      updateCurrentStep(state.currentStep + 1);
      return "skipped";
    }
    if (form.getValues("daoCandidate")) {
      return form.trigger([
        "daoCandidate.amount",
        "daoCandidate.memo",
        "daoCandidate.nameInfo",
      ] as const);
    }
    return true;
  };

  const goToNextStep = async () => {
    if (state.currentStep === STEPS.length) {
      const formData = form.getValues();
      if (formData.networkAndChain.network === "mainnet") {
        const isValid = await form.trigger();
        if (isValid) {
          setShowChecklist(true);
        }
        return;
      }

      await handleDeployRollup();
      return;
    }

    const isLocal = isLocalNetwork(form.getValues("networkAndChain.network"));
    let result: boolean | "blocked" | "skipped" = false;

    switch (state.currentStep) {
      case 1:
        result = await validateStep1(isLocal);
        break;
      case 2:
        result = await validateStep2(isLocal);
        break;
      case 3:
        result = await validateStep3(isLocal);
        break;
      default:
        result = true;
    }

    if (result === "blocked" || result === "skipped") return;

    if (result) {
      updateCurrentStep(state.currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (state.currentStep > 1) {
      updateCurrentStep(state.currentStep - 1);
    }
  };

  const onBack = () => {
    router.push("/rollup");
  };

  return {
    form,
    currentStep: state.currentStep,
    progress,
    steps: STEPS,
    goToNextStep,
    goToPreviousStep,
    onBack,
    isDeploying: deployMutation.isPending,
    showChecklist,
    setShowChecklist,
    handleDeployRollup,
    estimatedCost,
    validateAndEstimateDeployment,
  };
}
