import { createContext, useContext } from "react";
import type { StepContext } from "./types";

/**
 * Metadata for a step registered within the Stepper.
 */
export interface RegisteredStep {
  /** Unique identifier for the step (generated via useId) */
  id: string;
  /** Display name of the step */
  name: string;
  /**
   * Validation function or boolean flag to control navigation.
   * If a function, it can be async.
   */
  canProceed: boolean | (() => boolean | Promise<boolean>);
  /**
   * Sort order for the step, claimed from the parent Stepper's counter.
   * Reflects the step's position in the element tree, not the time it mounted.
   */
  order: number;
}

/**
 * Value provided by the StepperContext to child components.
 */
export interface StepperContextValue {
  /** Register a new step with the parent Stepper */
  registerStep: (step: RegisteredStep) => void;
  /** Unregister a step (e.g., on unmount) */
  unregisterStep: (id: string) => void;
  /**
   * Context helper for the current step (navigation methods, status, etc.).
   * Null if the component is not currently active/rendered.
   */
  stepContext: StepContext | null;
  /** ID of the currently active step */
  currentStepId: string | null;
  /** Temporarily disable Stepper navigation (e.g., when input is focused) */
  disableNavigation: () => void;
  /** Re-enable Stepper navigation */
  enableNavigation: () => void;
  /** Whether navigation is currently disabled */
  isNavigationDisabled: boolean;
  /**
   * Claim the next sort order slot from the Stepper's counter.
   *
   * Steps claim in layout-effect order, which for non-nested siblings equals tree order.
   * @internal
   */
  claimOrder: () => number;
  /**
   * Bumped by the Stepper whenever a new step id appears, forcing every Step to re-claim
   * its order against a freshly reset counter so tree order is restored.
   * @internal
   */
  orderGeneration: number;
}

/**
 * React Context for internal Stepper state management.
 * @internal
 */
export const StepperContext: React.Context<StepperContextValue | null> = createContext<StepperContextValue | null>(
  null,
);

/**
 * Hook to access the internal Stepper context.
 *
 * Use this if you need to build custom components that interact with the Stepper
 * (e.g., custom navigation buttons or step indicators).
 *
 * @throws Error if used outside a <Stepper> component.
 * @returns The Stepper context value.
 */
export function useStepperContext(): StepperContextValue {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error("useStepperContext must be used within a Stepper");
  }
  return context;
}
