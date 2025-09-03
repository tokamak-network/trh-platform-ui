"use client";

import { AuthenticatedLayout } from "@/components/layout";
import { CreateRollupStepper } from "@/features/rollup/components/CreateRollupStepper";
import { useCreateRollup } from "@/features/rollup/hooks/useCreateRollup";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Rocket } from "lucide-react";
import {
  NetworkAndChainStep,
  AccountAndAwsStep,
  DaoCandidateStep,
  ReviewAndDeployStep,
} from "@/features/rollup/components/steps";
import { FormProvider } from "react-hook-form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";

export default function CreateRollupPage() {
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

  const router = useRouter();
  
  // Navigation confirmation state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  
  // Router method references for interception
  const originalRouterMethods = useRef({
    push: router.push,
    replace: router.replace,
    back: router.back,
    forward: router.forward
  });
  const isNavigatingRef = useRef(false);

  // Memoized unsaved changes detection
  const hasUnsavedChanges = useMemo(() => 
    (form.formState.isDirty || hasUserInteracted) && !form.formState.isSubmitSuccessful,
    [form.formState.isDirty, form.formState.isSubmitSuccessful, hasUserInteracted]
  );

  // === Form Interaction Tracking ===
  useEffect(() => {
    if (hasUserInteracted) return;
    
    const subscription = form.watch(() => {
      setHasUserInteracted(true);
    });
    return () => subscription.unsubscribe();
  }, [form, hasUserInteracted]);

  // === Browser Navigation Protection ===
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
        return "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // === Router Method Interception ===
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const { push, replace, back, forward } = originalRouterMethods.current;
    
    const interceptNavigation = <T extends unknown[]>(originalMethod: (...args: T) => void, url?: string) => {
      return (...args: T) => {
        if (!isNavigatingRef.current) {
          const targetUrl = url || (typeof args[0] === 'string' ? args[0] : 'unknown');
          setPendingNavigation(targetUrl);
          setShowConfirmDialog(true);
          return;
        }
        return originalMethod.apply(router, args);
      };
    };

    router.push = interceptNavigation(push);
    router.replace = interceptNavigation(replace);
    router.back = interceptNavigation(back, 'back');
    router.forward = interceptNavigation(forward, 'forward');

    return () => {
      router.push = push;
      router.replace = replace;
      router.back = back;
      router.forward = forward;
    };
  }, [hasUnsavedChanges, router]);

  // === Link Click Interception ===
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    const handleLinkClick = (e: MouseEvent) => {
      if (isNavigatingRef.current) return;

      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const url = new URL(link.href);
        const currentUrl = new URL(window.location.href);
        
        if (url.pathname !== currentUrl.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavigation(url.pathname);
          setShowConfirmDialog(true);
        }
      }
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [hasUnsavedChanges]);

  // === Event Handlers ===
  const handleConfirmLeave = useCallback(() => {
    setShowConfirmDialog(false);
    if (pendingNavigation) {
      // Set flag to allow navigation
      isNavigatingRef.current = true;
      
      // Reset interaction state to prevent further confirmations
      setHasUserInteracted(false);
      // Mark form as clean
      form.reset(form.getValues(), { keepValues: true, keepDirty: false });
      
      // Handle different navigation types
      const { push, back, forward } = originalRouterMethods.current;
      if (pendingNavigation === 'back') {
        back();
      } else if (pendingNavigation === 'forward') {
        forward();
      } else {
        push(pendingNavigation);
      }
      
      setPendingNavigation(null);
      
      // Reset navigation flag after a short delay
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);
    }
  }, [pendingNavigation, form]);

  const handleCancelLeave = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingNavigation(null);
  }, []);

  // Override the onBack function to show confirmation if needed
  const handleBack = useCallback(() => {
    if (hasUnsavedChanges) {
      setPendingNavigation("/rollup");
      setShowConfirmDialog(true);
    } else {
      onBack();
    }
  }, [hasUnsavedChanges, onBack]);

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
        return <ReviewAndDeployStep />;
      default:
        return null;
    }
  };

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-100">
        {/* Main content with bottom padding to prevent overlap with fixed footer */}
        <div className="p-6 pb-24">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Deploy New Stack</h1>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Unsaved changes
                  </span>
                )}
              </div>
              <p className="text-gray-500">
                Follow the steps below to deploy your custom rollup
              </p>
            </div>

            <CreateRollupStepper
              steps={steps}
              currentStep={currentStep}
              progress={progress}
              onBack={handleBack}
            />

            <FormProvider {...form}>{renderStepContent()}</FormProvider>
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in your rollup configuration. Are you sure you want to navigate away? Your progress will be lost.
            </AlertDialogDescription>
            {pendingNavigation && pendingNavigation !== 'back' && pendingNavigation !== 'forward' && (
              <div className="mt-2 text-sm text-gray-600">
                Navigating to: <span className="font-medium">{pendingNavigation}</span>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLeave} className="bg-red-600 hover:bg-red-700">
              Leave Page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthenticatedLayout>
  );
}
