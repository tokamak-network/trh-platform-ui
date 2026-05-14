"use client";

import { useEffect } from "react";
import { AuthenticatedLayout } from "@/components/layout";
import { CreateRollupStepper } from "@/features/rollup/components/CreateRollupStepper";
import { usePresetWizard } from "@/features/rollup/hooks/usePresetWizard";
import { useRollupCreationContext } from "@/features/rollup/context/RollupCreationContext";
import { useThanosStack } from "@/features/rollup/hooks/useThanosStack";
import { ThanosStackStatus } from "@/features/rollup/schemas/thanos";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle } from "lucide-react";
import { ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import {
  PresetSelectionStep,
  BasicInfoStep,
  ConfigReview,
} from "@/features/rollup/components/preset";
import { FormProvider } from "react-hook-form";

function PresetWizardContent() {
  const {
    form,
    currentStep,
    progress,
    steps,
    onBack,
    goToNextStep,
    goToPreviousStep,
    selectedPresetId,
    presetDetail,
    setOverrides,
    handleSelectPreset,
    network,
  } = usePresetWizard();

  const { resetState } = useRollupCreationContext();
  const { stacks } = useThanosStack();

  // Block new deployments while any non-LocalDevnet stack is Pending or Deploying
  // to prevent L1 nonce conflicts from concurrent use of the same admin key.
  const isDeploymentInProgress = stacks.some(
    (s) =>
      (s.status === ThanosStackStatus.PENDING || s.status === ThanosStackStatus.DEPLOYING) &&
      s.network !== "LocalDevnet"
  );

  useEffect(() => {
    resetState();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <PresetSelectionStep
            selectedPresetId={selectedPresetId}
            onSelect={handleSelectPreset}
          />
        );
      case 2:
        return (
          <FormProvider {...form}>
            <BasicInfoStep />
          </FormProvider>
        );
      case 3:
        return (
          <div className="space-y-6">
            {isDeploymentInProgress && (
              <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-500" />
                <div>
                  <p className="font-medium">Deployment in progress</p>
                  <p className="text-sm">
                    Another stack is currently deploying. Starting a second deployment
                    would cause L1 nonce conflicts on the same admin key. Wait for the
                    active deployment to finish before proceeding.
                  </p>
                </div>
              </div>
            )}
            {presetDetail && (
              <ConfigReview
                preset={presetDetail}
                network={network}
                onOverridesChange={setOverrides}
                feeToken={form.watch("presetBasicInfo.feeToken")}
                infraProvider={form.watch("presetBasicInfo.infraProvider")}
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-100">
        <div className="p-6 pb-24">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Deploy New Stack</h1>
              </div>
              <p className="text-gray-500">
                Choose a preset and deploy your custom rollup in minutes
              </p>
            </div>

            <CreateRollupStepper
              steps={steps}
              currentStep={currentStep}
              progress={progress}
              onBack={onBack}
            />

            {renderStepContent()}
          </div>
        </div>

        {/* Fixed footer */}
        <div className="fixed bottom-0 right-0 left-[250px] bg-white">
          <footer className="border-t py-4 shadow-md">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={isFirstStep}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                {isLastStep && isDeploymentInProgress ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <Button
                            disabled
                            className="flex items-center gap-2 pointer-events-none"
                          >
                            Deploy Rollup
                            <Rocket className="h-4 w-4" />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Another deployment is in progress — wait for it to complete.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    onClick={goToNextStep}
                    disabled={currentStep === 1 && !selectedPresetId}
                    className="flex items-center gap-2"
                  >
                    {isLastStep ? "Deploy Rollup" : "Next"}
                    {isLastStep ? (
                      <Rocket className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

export default function CreateRollupPage() {
  return <PresetWizardContent />;
}
