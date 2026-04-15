"use client";

import { useEffect } from "react";
import { AuthenticatedLayout } from "@/components/layout";
import { CreateRollupStepper } from "@/features/rollup/components/CreateRollupStepper";
import { PreDeploymentChecklistDialog } from "@/features/rollup/components/PreDeploymentChecklistDialog";
import { useCreateRollup } from "@/features/rollup/hooks/useCreateRollup";
import { usePresetWizard } from "@/features/rollup/hooks/usePresetWizard";
import { useRollupCreationContext } from "@/features/rollup/context/RollupCreationContext";


import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import {
  NetworkAndChainStep,
  AccountAndAwsStep,
  DaoCandidateStep,
  ReviewAndDeployStep,
} from "@/features/rollup/components/steps";
import {
  PresetSelectionStep,
  BasicInfoStep,
  ConfigReview,
} from "@/features/rollup/components/preset";
import { FormProvider } from "react-hook-form";

// --- Preset Mode Wizard ---
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
    handleSelectPreset,
    pendingDeploymentId,
  } = usePresetWizard();

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

            <WizardModeTabs />

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
              </div>
            </div>
          </footer>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

// --- Classic Mode Wizard (unchanged) ---
function ClassicWizardContent() {
  const {
    form,
    currentStep,
    progress,
    steps,
    onBack,
    goToNextStep,
    goToPreviousStep,
    isDeploying,
    showChecklist,
    setShowChecklist,
    handleDeployRollup,
    estimatedCost,
    validateAndEstimateDeployment,
  } = useCreateRollup();

  useEffect(() => {
    if (currentStep === 4) {
      validateAndEstimateDeployment();
    }
  }, [currentStep, validateAndEstimateDeployment]);

  const handleSkipDaoCandidate = () => {
    form.setValue("daoCandidate", undefined);
    goToNextStep();
  };

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <NetworkAndChainStep />;
      case 2:
        return <AccountAndAwsStep />;
      case 3:
        return <DaoCandidateStep />;
      case 4:
        return <ReviewAndDeployStep estimatedCost={estimatedCost} />;
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
                Follow the steps below to deploy your custom rollup
              </p>
            </div>

            <WizardModeTabs />

            <CreateRollupStepper
              steps={steps}
              currentStep={currentStep}
              progress={progress}
              onBack={onBack}
            />

            <FormProvider {...form}>{renderStepContent()}</FormProvider>
          </div>
          <PreDeploymentChecklistDialog
            open={showChecklist}
            onOpenChange={setShowChecklist}
            onConfirm={handleDeployRollup}
            isDeploying={isDeploying}
            network="mainnet"
          />
        </div>

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
                <div className="flex gap-3">
                  {currentStep === 3 && (
                    <Button
                      variant="outline"
                      onClick={() => handleSkipDaoCandidate()}
                      type="button"
                      className="flex items-center"
                    >
                      Skip this step
                    </Button>
                  )}
                  <Button
                    onClick={goToNextStep}
                    disabled={form.formState.isValidating || isDeploying}
                    className="flex items-center gap-2"
                  >
                    {isLastStep ? "Deploy Rollup" : "Next"}
                    {isLastStep && isDeploying ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : isLastStep ? (
                      <Rocket className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

// --- Mode Toggle Tabs ---
function WizardModeTabs() {
  const { state, setWizardMode } = useRollupCreationContext();
  const { wizardMode } = state;

  return (
    <div className="flex gap-1 p-1 bg-gray-200 rounded-lg w-fit">
      <button
        type="button"
        onClick={() => setWizardMode("preset")}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          wizardMode === "preset"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Preset Mode
      </button>
      <button
        type="button"
        onClick={() => setWizardMode("classic")}
        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
          wizardMode === "classic"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Classic Mode
      </button>
    </div>
  );
}

// --- Mode Selector ---
function CreateRollupContent() {
  const { state, resetState } = useRollupCreationContext();
  const { wizardMode } = state;

  useEffect(() => {
    resetState();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (wizardMode === "preset") {
    return <PresetWizardContent />;
  }

  return <ClassicWizardContent />;
}

export default function CreateRollupPage() {
  return <CreateRollupContent />;
}
