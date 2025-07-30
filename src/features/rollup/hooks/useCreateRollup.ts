"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Network, Database, Tag, CheckCircle } from "lucide-react";
import type { CreateRollupFormData } from "../schemas/create-rollup";
import { createRollupSchema } from "../schemas/create-rollup";

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
  const [currentStep, setCurrentStep] = useState(1);
  const router = useRouter();

  const form = useForm<CreateRollupFormData>({
    resolver: zodResolver(createRollupSchema),
    defaultValues: {
      networkAndChain: {
        network: "",
        chainName: "",
        l1RpcUrl: "",
        l1BeaconUrl: "",
        advancedConfig: false,
        l2BlockTime: "2",
        batchSubmissionFreq: "1440",
        outputRootFreq: "240",
        challengePeriod: "12",
      },
      accountAndAws: {
        accountName: "",
        awsAccessKey: "",
        awsSecretKey: "",
        awsRegion: "",
      },
      daoCandidate: {
        daoName: "",
        daoDescription: "",
        daoWebsite: "",
      },
    },
  });

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

  const progress = getProgress(currentStep);

  const goToNextStep = async () => {
    if (currentStep < STEPS.length) {
      // Validate current step fields
      let isValid = false;

      switch (currentStep) {
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
            "accountAndAws.proposerAccount",
            "accountAndAws.batchAccount",
            "accountAndAws.sequencerAccount",
            "accountAndAws.accountName",
            "accountAndAws.awsAccessKey",
            "accountAndAws.awsSecretKey",
            "accountAndAws.awsRegion",
          ] as const);
          break;
        case 3: // DAO Candidate step
          isValid = await form.trigger([
            "daoCandidate.daoName",
            "daoCandidate.daoDescription",
            "daoCandidate.daoWebsite",
          ] as const);
          break;
        default:
          isValid = true;
      }

      if (isValid) {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onBack = () => {
    router.push("/rollup");
  };

  return {
    form,
    currentStep,
    progress,
    steps: STEPS,
    goToNextStep,
    goToPreviousStep,
    onBack,
  };
}
