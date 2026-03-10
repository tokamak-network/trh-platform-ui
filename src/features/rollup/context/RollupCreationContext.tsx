"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { CreateRollupFormData } from "../schemas/create-rollup";
import type { PresetDetail } from "../schemas/preset";

export type WizardMode = "classic" | "preset";

interface RollupCreationState {
  formData: CreateRollupFormData | null;
  currentStep: number;
  hasUnsavedChanges: boolean;
  wizardMode: WizardMode;
  selectedPreset: PresetDetail | null;
  pendingDeploymentId: string | null;
}

interface RollupCreationContextType {
  state: RollupCreationState;
  updateFormData: (data: CreateRollupFormData) => void;
  updateCurrentStep: (step: number) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  resetState: () => void;
  setWizardMode: (mode: WizardMode) => void;
  setSelectedPreset: (preset: PresetDetail | null) => void;
  setPendingDeploymentId: (id: string | null) => void;
}

const defaultFormData: CreateRollupFormData = {
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
reuseDeployment: true,
    enableBackup: false,
  },
  accountAndAws: {
    seedPhrase: Array(12).fill(""),
    adminAccount: "",
    adminPrivateKey: "",
    proposerAccount: "",
    proposerPrivateKey: "",
    batchAccount: "",
    batchPrivateKey: "",
    sequencerAccount: "",
    sequencerPrivateKey: "",
    accountName: "",
    credentialId: "",
    awsAccessKey: "",
    awsSecretKey: "",
    awsRegion: "",
  },
  daoCandidate: undefined,
  confirmation: {
    agreedToMainnetRisks: false,
  },
};

const initialState: RollupCreationState = {
  formData: null,
  currentStep: 1,
  hasUnsavedChanges: false,
  wizardMode: "preset",
  selectedPreset: null,
  pendingDeploymentId: null,
};

const RollupCreationContext = createContext<RollupCreationContextType | undefined>(undefined);

export function RollupCreationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RollupCreationState>(initialState);

  const updateFormData = (data: CreateRollupFormData) => {
    setState(prev => ({
      ...prev,
      formData: data,
      hasUnsavedChanges: true,
    }));
  };

  const updateCurrentStep = (step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
    }));
  };

  const setHasUnsavedChanges = (hasChanges: boolean) => {
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: hasChanges,
    }));
  };

  const resetState = () => {
    setState(initialState);
  };

  const setWizardMode = (mode: WizardMode) => {
    setState(prev => ({ ...prev, wizardMode: mode, currentStep: 1 }));
  };

  const setSelectedPreset = (preset: PresetDetail | null) => {
    setState(prev => ({ ...prev, selectedPreset: preset }));
  };

  const setPendingDeploymentId = (id: string | null) => {
    setState(prev => ({ ...prev, pendingDeploymentId: id }));
  };

  return (
    <RollupCreationContext.Provider
      value={{
        state,
        updateFormData,
        updateCurrentStep,
        setHasUnsavedChanges,
        resetState,
        setWizardMode,
        setSelectedPreset,
        setPendingDeploymentId,
      }}
    >
      {children}
    </RollupCreationContext.Provider>
  );
}

export function useRollupCreationContext() {
  const context = useContext(RollupCreationContext);
  if (context === undefined) {
    throw new Error("useRollupCreationContext must be used within a RollupCreationProvider");
  }
  return context;
}

export { defaultFormData };
