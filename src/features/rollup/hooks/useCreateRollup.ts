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

  const goToNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1);
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
