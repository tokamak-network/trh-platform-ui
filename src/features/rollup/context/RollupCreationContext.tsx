"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { PresetDetail } from "../schemas/preset";

interface RollupCreationState {
  currentStep: number;
  selectedPreset: PresetDetail | null;
  pendingDeploymentId: string | null;
}

interface RollupCreationContextType {
  state: RollupCreationState;
  updateCurrentStep: (step: number) => void;
  resetState: () => void;
  setSelectedPreset: (preset: PresetDetail | null) => void;
  setPendingDeploymentId: (id: string | null) => void;
}

const initialState: RollupCreationState = {
  currentStep: 1,
  selectedPreset: null,
  pendingDeploymentId: null,
};

const RollupCreationContext = createContext<RollupCreationContextType | undefined>(undefined);

export function RollupCreationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RollupCreationState>(initialState);

  const updateCurrentStep = (step: number) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
    }));
  };

  const resetState = () => {
    setState(initialState);
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
        updateCurrentStep,
        resetState,
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
