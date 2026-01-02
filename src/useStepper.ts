import { useCallback, useMemo, useState } from "react";
import type { ProgressContext, StepContext } from "./types";
import type { RegisteredStep } from "./StepperContext";

interface UseStepperOptions {
  onComplete: () => void;
  onCancel?: () => void;
  onStepChange?: (step: number) => void;
  initialStep?: number;
  controlledStep?: number;
}

interface UseStepperReturn {
  currentStep: number;
  currentStepId: string | null;
  stepContext: StepContext;
  progressContext: ProgressContext;
  registeredSteps: RegisteredStep[];
  registerStep: (step: RegisteredStep) => void;
  unregisterStep: (id: string) => void;
  isValidating: boolean;
}

/**
 * Internal hook for managing stepper state and navigation.
 */
export function useStepper({
  onComplete,
  onCancel,
  onStepChange,
  initialStep = 0,
  controlledStep,
}: UseStepperOptions): UseStepperReturn {
  const [internalStep, setInternalStep] = useState(initialStep);
  const [registeredSteps, setRegisteredSteps] = useState<RegisteredStep[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Use controlled step if provided, otherwise internal
  const currentStep = controlledStep ?? internalStep;

  // Sort registered steps by mount order
  const sortedSteps = useMemo(
    () => [...registeredSteps].sort((a, b) => a.order - b.order),
    [registeredSteps],
  );

  const totalSteps = sortedSteps.length;
  const currentStepConfig = sortedSteps[currentStep];
  const currentStepId = currentStepConfig?.id ?? null;

  const registerStep = useCallback((step: RegisteredStep) => {
    setRegisteredSteps((prev) => {
      // Avoid duplicates
      if (prev.some((s) => s.id === step.id)) return prev;
      return [...prev, step];
    });
  }, []);

  const unregisterStep = useCallback((id: string) => {
    setRegisteredSteps((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const resolveCanProceed = useCallback(async (): Promise<boolean> => {
    const canProceed = currentStepConfig?.canProceed ?? true;
    if (typeof canProceed === "function") {
      setIsValidating(true);
      try {
        return await canProceed();
      } finally {
        setIsValidating(false);
      }
    }
    return canProceed;
  }, [currentStepConfig]);

  const goNext = useCallback(async () => {
    const canProceed = await resolveCanProceed();
    if (!canProceed) return;

    if (currentStep >= totalSteps - 1) {
      onComplete();
    } else {
      const newStep = currentStep + 1;
      setInternalStep(newStep);
      onStepChange?.(newStep);
    }
  }, [resolveCanProceed, currentStep, totalSteps, onComplete, onStepChange]);

  const goBack = useCallback(() => {
    if (currentStep <= 0) {
      onCancel?.();
    } else {
      const newStep = currentStep - 1;
      setInternalStep(newStep);
      onStepChange?.(newStep);
    }
  }, [currentStep, onCancel, onStepChange]);

  const goTo = useCallback(
    (step: number) => {
      const clampedStep = Math.max(0, Math.min(step, totalSteps - 1));
      if (clampedStep !== currentStep) {
        setInternalStep(clampedStep);
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
      isValidating,
    }),
    [goNext, goBack, goTo, cancel, currentStep, totalSteps, isValidating],
  );

  const progressContext: ProgressContext = useMemo(
    () => ({
      currentStep,
      steps: sortedSteps.map((step, idx) => ({
        name: step.name,
        completed: idx < currentStep,
        current: idx === currentStep,
      })),
    }),
    [currentStep, sortedSteps],
  );

  return {
    currentStep,
    currentStepId,
    stepContext,
    progressContext,
    registeredSteps: sortedSteps,
    registerStep,
    unregisterStep,
    isValidating,
  };
}
