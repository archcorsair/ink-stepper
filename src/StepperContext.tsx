import { createContext, useContext } from "react";
import type { StepContext } from "./types";

export interface RegisteredStep {
  id: string;
  name: string;
  canProceed: boolean | (() => boolean | Promise<boolean>);
  order: number;
}

export interface StepperContextValue {
  registerStep: (step: RegisteredStep) => void;
  unregisterStep: (id: string) => void;
  stepContext: StepContext | null;
  currentStepId: string | null;
  disableNavigation: () => void;
  enableNavigation: () => void;
  isNavigationDisabled: boolean;
}

export const StepperContext = createContext<StepperContextValue | null>(null);

export function useStepperContext(): StepperContextValue {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("useStepperContext must be used within a Stepper");
  }
  return context;
}
