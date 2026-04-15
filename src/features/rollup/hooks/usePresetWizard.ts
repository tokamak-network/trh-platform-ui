"use client";

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Layers, FileText } from "lucide-react";
import { z } from "zod";
import { useRollupCreationContext } from "../context/RollupCreationContext";
import { usePresetDetailQuery } from "../api/queries";
import { toast } from "react-hot-toast";
import type { PresetSummary, PresetDetail } from "../schemas/preset";
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
    title: "Basic Info & Deploy",
    description: "Chain name, network and credentials",
    icon: FileText,
  },
];

const presetWizardSchema = z.object({
  presetBasicInfo: presetBasicInfoSchema,
});

type PresetWizardFormData = z.infer<typeof presetWizardSchema>;

export function usePresetWizard() {
  const router = useRouter();
  const { state, updateCurrentStep, setSelectedPreset, setPendingDeploymentId, resetState } =
    useRollupCreationContext();

  const form = useForm<PresetWizardFormData>({
    resolver: zodResolver(presetWizardSchema),
    defaultValues: {
      presetBasicInfo: {
        presetId: "",
        chainName: "",
        network: "Testnet",
        awsAccessKey: "",
        awsSecretKey: "",
      },
    },
  });

  const selectedPresetId = state.selectedPreset?.id ?? null;

  const { data: presetDetail } = usePresetDetailQuery(selectedPresetId ?? undefined);

  const handleSelectPreset = useCallback(
    (preset: PresetSummary) => {
      // PresetSummary and PresetDetail are both aliases for PresetDefinition
      setSelectedPreset(preset as PresetDetail);
      form.setValue("presetBasicInfo.presetId", preset.id, { shouldValidate: true });
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
        presetId: basicInfo.presetId,
        chainName: basicInfo.chainName,
        network: basicInfo.network,
        awsAccessKey: basicInfo.awsAccessKey,
        awsSecretKey: basicInfo.awsSecretKey,
      });

      toast.success("Deployment initiated!", { id: "preset-deploy" });
      setPendingDeploymentId(result.deploymentId);
      resetState();
      router.push("/rollup");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to initiate deployment",
        { id: "preset-deploy" }
      );
    }
  }, [form, setPendingDeploymentId, resetState, router]);

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
    handleSelectPreset,
    handleDeploy,
    goToNextStep,
    goToPreviousStep,
    onBack,
    network: form.watch("presetBasicInfo.network"),
    pendingDeploymentId: state.pendingDeploymentId,
  };
}
