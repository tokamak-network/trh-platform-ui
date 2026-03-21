"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Layers, FileText, CheckCircle } from "lucide-react";
import { z } from "zod";
import { useRollupCreationContext } from "../context/RollupCreationContext";
import { usePresetDetailQuery } from "../api/queries";
import { toast } from "react-hot-toast";
import type { PresetSummary, PresetDetail, PresetFieldOverride } from "../schemas/preset";
import { getPresetUIMetadata } from "../schemas/preset";
import { presetBasicInfoSchema } from "../schemas/create-rollup";

export const PRESET_STEPS = [
  {
    id: 1,
    title: "Choose Preset",
    description: "Select a deployment template",
    icon: Layers,
  },
  {
    id: 2,
    title: "Basic Info",
    description: "Chain name, network and credentials",
    icon: FileText,
  },
  {
    id: 3,
    title: "Review & Deploy",
    description: "Confirm configuration and deploy",
    icon: CheckCircle,
  },
];

const presetWizardSchema = z.object({
  presetBasicInfo: presetBasicInfoSchema,
});

type PresetWizardFormData = z.infer<typeof presetWizardSchema>;

export function usePresetWizard() {
  const router = useRouter();
  const { state, updateCurrentStep, setSelectedPreset, setPendingDeploymentId } =
    useRollupCreationContext();

  const [overrides, setOverrides] = useState<PresetFieldOverride[]>([]);

  const form = useForm<PresetWizardFormData>({
    resolver: zodResolver(presetWizardSchema),
    defaultValues: {
      presetBasicInfo: {
        chainName: "",
        network: "Testnet",
        l1RpcUrl: "",
        l1BeaconUrl: "",
        seedPhrase: Array(12).fill(""),
        awsAccessKey: "",
        awsSecretKey: "",
        awsRegion: "",
        feeToken: "TON" as const,
      },
    },
  });

  const selectedPresetId = state.selectedPreset?.id ?? null;

  const { data: presetDetail } = usePresetDetailQuery(selectedPresetId ?? undefined);

  const handleSelectPreset = useCallback(
    (preset: PresetSummary) => {
      // PresetSummary and PresetDetail are both aliases for PresetDefinition
      setSelectedPreset(preset as PresetDetail);
      const uiMeta = getPresetUIMetadata(preset.id);
      form.setValue("presetBasicInfo.feeToken", uiMeta.defaultFeeToken, { shouldValidate: true });
    },
    [setSelectedPreset, form]
  );

  const getProgress = (step: number) => {
    return Math.round((step / PRESET_STEPS.length) * 100);
  };

  const progress = getProgress(state.currentStep);

  const handleDeploy = useCallback(async () => {
    const basicInfo = form.getValues("presetBasicInfo");

    try {
      toast.loading("Initiating deployment...", { id: "preset-deploy" });

      const { startPresetDeployment } = await import("../services/presetService");
      const result = await startPresetDeployment({
        presetId: selectedPresetId!,
        chainName: basicInfo.chainName,
        network: basicInfo.network,
        infraProvider: basicInfo.infraProvider,
        // Form stores seedPhrase as string[] (12 words) for per-word input UX,
        // but deployWithPresetRequestSchema and the backend PresetDeployRequest expect
        // a single space-joined string (e.g., "word1 word2 ... word12").
        seedPhrase: basicInfo.seedPhrase.join(" "),
        feeToken: basicInfo.feeToken,
        awsAccessKey: basicInfo.awsAccessKey ?? "",
        awsSecretKey: basicInfo.awsSecretKey ?? "",
        awsRegion: basicInfo.awsRegion ?? "",
        l1RpcUrl: basicInfo.l1RpcUrl,
        l1BeaconUrl: basicInfo.l1BeaconUrl,
        reuseDeployment: basicInfo.network === "Mainnet" ? (basicInfo.reuseDeployment ?? true) : undefined,
        overrides: overrides.length > 0 ? overrides : undefined,
      });

      toast.success("Deployment initiated!", { id: "preset-deploy" });
      setPendingDeploymentId(result.deploymentId);
      router.push("/rollup");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to initiate deployment",
        { id: "preset-deploy" }
      );
    }
  }, [form, selectedPresetId, overrides, setPendingDeploymentId, router]);

  const goToNextStep = useCallback(async () => {
    if (state.currentStep === 1) {
      if (!selectedPresetId) {
        toast.error("Please select a preset to continue.");
        return;
      }
      updateCurrentStep(2);
      return;
    }

    if (state.currentStep === 2) {
      const isValid = await form.trigger("presetBasicInfo");
      if (!isValid) return;
      updateCurrentStep(3);
      return;
    }

    if (state.currentStep === 3) {
      await handleDeploy();
    }
  }, [state.currentStep, selectedPresetId, form, updateCurrentStep, handleDeploy]);

  const goToPreviousStep = useCallback(() => {
    if (state.currentStep > 1) {
      updateCurrentStep(state.currentStep - 1);
    }
  }, [state.currentStep, updateCurrentStep]);

  const onBack = () => {
    router.push("/rollup");
  };

  return {
    form,
    currentStep: state.currentStep,
    progress,
    steps: PRESET_STEPS,
    selectedPresetId,
    selectedPreset: state.selectedPreset,
    presetDetail: presetDetail ?? null,
    overrides,
    setOverrides,
    handleSelectPreset,
    goToNextStep,
    goToPreviousStep,
    onBack,
    network: form.watch("presetBasicInfo.network"),
    pendingDeploymentId: state.pendingDeploymentId,
  };
}
