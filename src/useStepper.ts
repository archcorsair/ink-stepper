import { useCallback, useMemo, useState } from "react";
import type { ProgressContext, StepConfig, StepContext } from "./types";

interface UseStepperOptions {
  steps: StepConfig[];
  onComplete: () => void;
  onCancel?: () => void;
  onStepChange?: (step: number) => void;
}

interface UseStepperReturn {
  currentStep: number;
  stepContext: StepContext;
  progressContext: ProgressContext;
  currentStepConfig: StepConfig | undefined;
}

/**
 * Internal hook for managing stepper state and navigation.
 */
export function useStepper({ steps, onComplete, onCancel, onStepChange }: UseStepperOptions): UseStepperReturn {
  const [currentStep, setCurrentStep] = useState(0);

  const totalSteps = steps.length;
  const currentStepConfig = steps[currentStep];
  const canProceed = currentStepConfig?.canProceed ?? true;

  const goNext = useCallback(() => {
    if (!canProceed) return;

    if (currentStep >= totalSteps - 1) {
      onComplete();
    } else {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  }, [canProceed, currentStep, totalSteps, onComplete, onStepChange]);

  const goBack = useCallback(() => {
    if (currentStep <= 0) {
      onCancel?.();
    } else {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  }, [currentStep, onCancel, onStepChange]);

  const goTo = useCallback(
    (step: number) => {
      const clampedStep = Math.max(0, Math.min(step, totalSteps - 1));
      if (clampedStep !== currentStep) {
        setCurrentStep(clampedStep);
        onStepChange?.(clampedStep);
      }
    },
    [totalSteps, currentStep, onStepChange],
  );

  const cancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const stepContext: StepContext = useMemo(
    () => ({
      goNext,
      goBack,
      goTo,
      cancel,
      currentStep,
      totalSteps,
      isFirst: currentStep === 0,
      isLast: currentStep === totalSteps - 1,
    }),
    [goNext, goBack, goTo, cancel, currentStep, totalSteps],
  );

  const progressContext: ProgressContext = useMemo(
    () => ({
      currentStep,
      steps: steps.map((step, idx) => ({
        name: step.name,
        completed: idx < currentStep,
        current: idx === currentStep,
      })),
    }),
    [currentStep, steps],
  );

  return {
    currentStep,
    stepContext,
    progressContext,
    currentStepConfig,
  };
}
