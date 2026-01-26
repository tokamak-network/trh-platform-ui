"use client";

import { FormProvider } from "react-hook-form";
import { ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import { AuthenticatedLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { CreateRollupStepper } from "@/features/rollup/components/CreateRollupStepper";
import { useCreateRollup } from "@/features/rollup/hooks/useCreateRollup";
import {
  NetworkAndChainStep,
  AccountAndAwsStep,
  DaoCandidateStep,
  ReviewAndDeployStep,
} from "@/features/rollup/components/steps";

const STEP_COMPONENTS = [
  NetworkAndChainStep,
  AccountAndAwsStep,
  DaoCandidateStep,
  ReviewAndDeployStep,
];

function CreateRollupContent() {
  const {
    form,
    currentStep,
    progress,
    steps,
    onBack,
    goToNextStep,
    goToPreviousStep,
    isDeploying,
  } = useCreateRollup();

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;
  const StepComponent = STEP_COMPONENTS[currentStep - 1];

  const handleSkip = () => {
    form.setValue("daoCandidate", undefined);
    goToNextStep();
  };

  return (
    <AuthenticatedLayout>
      <section className="p-6 pb-24">
        <div className="max-w-5xl mx-auto space-y-6">
          <header>
            <h1 className="text-2xl font-semibold">Deploy New Stack</h1>
            <p className="text-gray-500 text-sm mt-1">
              Follow the steps below to deploy your custom rollup
            </p>
          </header>

          <CreateRollupStepper
            steps={steps}
            currentStep={currentStep}
            progress={progress}
            onBack={onBack}
          />

          <FormProvider {...form}>
            {StepComponent && <StepComponent />}
          </FormProvider>
        </div>
      </section>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 right-0 left-16 bg-white border-t py-3 shadow-sm z-30">
        <div className="max-w-5xl mx-auto px-6 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={isFirstStep}
            size="sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep === 3 && (
              <Button variant="outline" onClick={handleSkip} size="sm">
                Skip
              </Button>
            )}
            <Button
              onClick={goToNextStep}
              disabled={form.formState.isValidating || isDeploying}
              size="sm"
            >
              {isLastStep ? "Deploy" : "Next"}
              {isLastStep && isDeploying ? (
                <span className="ml-1 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isLastStep ? (
                <Rocket className="h-4 w-4 ml-1" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </footer>
    </AuthenticatedLayout>
  );
}

export default function CreateRollupPage() {
  return <CreateRollupContent />;
}
