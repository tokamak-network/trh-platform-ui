"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Network, Database, Tag, CheckCircle } from "lucide-react";
import { useDeployRollupMutation } from "../api";
import type { CreateRollupFormData } from "../schemas/create-rollup";
import {
  convertFormToDeploymentRequest,
  createRollupSchema,
} from "../schemas/create-rollup";
import { useRollupCreationContext, defaultFormData } from "../context/RollupCreationContext";
import { toast } from "react-hot-toast";

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

  const handleDeployRollup = async () => {
    // Validate all form fields before deployment
    const isValid = await form.trigger();
    if (!isValid) {
      return;
    }

    const formData = form.getValues();

    // Pre-deployment Validation
    try {
      toast.loading("Validating deployment parameters...", { id: "validate-deployment" });

      const validationPayload = {
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
        // Use ADDRESSES (not private keys) for validation
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
      };

      const { validateDeployment } = await import("../services/rollupService");
      const validationResult = await validateDeployment(validationPayload);

      if (!validationResult.allValid) {
        const errors = Object.entries(validationResult.checks)
          .filter(([_, check]: [string, any]) => !check.valid)
          .map(([key, check]: [string, any]) => `${key}: ${check.error}`)
          .join("\n");

        toast.error(`Validation Failed:\n${errors}`, {
          id: "validate-deployment",
          duration: 5000,
        });
        return;
      }

      toast.success("Validation passed!", { id: "validate-deployment" });
    } catch (error) {
      console.error("Validation error:", error);
      toast.error("Validation service unavailable. Proceeding with caution...", {
        id: "validate-deployment",
      });
      // Optionally return here to enforce validation success
    }

    const request = convertFormToDeploymentRequest(formData);

    form.setError("root", { message: "" });

    // Use the mutation directly - the isSubmitting state will be handled by the button's disabled state
    // which checks for deployMutation.isPending
    await deployMutation.mutateAsync(request);
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

    // Validate current step fields
    let isValid = false;

    switch (state.currentStep) {
      case 1: // Network & Chain step
        const baseFields = [
          "networkAndChain.network",
          "networkAndChain.chainName",
          "networkAndChain.l1RpcUrl",
          "networkAndChain.l1BeaconUrl",
        ] as const;

        const advancedFields = [
          "networkAndChain.l2BlockTime",
          "networkAndChain.batchSubmissionFreq",
          "networkAndChain.outputRootFreq",
          "networkAndChain.challengePeriod",
        ] as const;

        isValid = await form.trigger([
          ...baseFields,
          ...(form.getValues("networkAndChain.advancedConfig")
            ? advancedFields
            : []),
        ]);
        break;
      case 2: // Account & AWS step
        isValid = await form.trigger([
          "accountAndAws.seedPhrase",
          "accountAndAws.adminAccount",
          "accountAndAws.adminPrivateKey",
          "accountAndAws.proposerAccount",
          "accountAndAws.proposerPrivateKey",
          "accountAndAws.batchAccount",
          "accountAndAws.batchPrivateKey",
          "accountAndAws.sequencerAccount",
          "accountAndAws.sequencerPrivateKey",
          "accountAndAws.accountName",
          "accountAndAws.credentialId",
          "accountAndAws.awsAccessKey",
          "accountAndAws.awsSecretKey",
          "accountAndAws.awsRegion",
        ] as const);
        break;
      case 3: // DAO Candidate step
        // If daoCandidate exists, validate its fields
        if (form.getValues("daoCandidate")) {
          isValid = await form.trigger([
            "daoCandidate.amount",
            "daoCandidate.memo",
            "daoCandidate.nameInfo",
          ] as const);
        } else {
          // If daoCandidate is undefined (skipped), validation passes
          isValid = true;
        }
        break;
      default:
        isValid = true;
    }

    if (isValid) {
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
  };
}
