import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { RegisteredStep } from "./StepperContext";
import type { ProgressContext, StepContext } from "./types";

interface UseStepperOptions {
  onComplete: () => void;
  onCancel?: () => void;
  onStepChange?: (step: number) => void;
  onEnterStep?: (step: number) => void;
  // biome-ignore lint/suspicious/noConfusingVoidType: side-effect-only handlers may return nothing; only an explicit false cancels
  onExitStep?: (step: number) => void | boolean | Promise<void | boolean>;
  onError?: (error: unknown) => void;
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
  disableNavigation: () => void;
  enableNavigation: () => void;
  isNavigationDisabled: boolean;
  claimOrder: () => number;
  orderGeneration: number;
}

/**
 * Internal hook for managing stepper state and navigation.
 *
 * ## Step ordering
 *
 * Steps sort by an `order` number they claim from a counter owned by this hook. React runs
 * layout effects depth-first, siblings left-to-right, so among Steps that are not nested inside
 * one another, layout-effect order equals tree order - claiming in that order yields tree order.
 * (Steps must therefore never be nested inside other Steps; wrapper components are fine.)
 *
 * When a step mounts late it would claim a stale, too-high number and sort to the end. To repair
 * that, `orderGeneration` is bumped whenever a new step id appears; the counter resets and every
 * Step re-claims in tree order on the next commit.
 */
export function useStepper({
  onComplete,
  onCancel,
  onStepChange,
  onEnterStep,
  onExitStep,
  onError,
  initialStep = 0,
  controlledStep,
}: UseStepperOptions): UseStepperReturn {
  const [internalStep, setInternalStep] = useState(initialStep);
  const [registeredSteps, setRegisteredSteps] = useState<RegisteredStep[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isNavigationDisabled, setIsNavigationDisabled] = useState(false);

  // Synchronous mirrors of the guard state. State updates are batched/async, so rapid
  // back-to-back navigation calls would otherwise read a stale value and slip past the guard.
  const isValidatingRef = useRef(false);
  const isNavigationDisabledRef = useRef(false);

  // --- Step ordering ---------------------------------------------------------------------
  // Counter Steps claim from, plus the generation that counter belongs to.
  const orderCounterRef = useRef(0);
  const [orderGeneration, setOrderGeneration] = useState(0);
  const lastResetGenerationRef = useRef(0);
  // Synchronous mirror of the registered ids. State updates are batched, so membership has to be
  // tracked outside of state to be readable from the layout effect in the very same commit.
  const idSetRef = useRef<Set<string>>(new Set());
  const prevIdSetRef = useRef<Set<string>>(new Set());
  // Id of the step the user is actually on, so an insertion/removal elsewhere cannot shift it.
  const activeIdRef = useRef<string | null>(null);
  // Latest sorted step list, readable from navigation callbacks captured in earlier renders.
  const sortedStepsRef = useRef<RegisteredStep[]>([]);

  // Reset the counter once per generation, during render, so it is already zero when the Steps'
  // layout effects run in this commit. Idempotent, therefore safe under StrictMode double-render.
  if (lastResetGenerationRef.current !== orderGeneration) {
    orderCounterRef.current = 0;
    lastResetGenerationRef.current = orderGeneration;
  }

  const claimOrder = useCallback(() => orderCounterRef.current++, []);

  const disableNavigation = useCallback(() => {
    isNavigationDisabledRef.current = true;
    setIsNavigationDisabled(true);
  }, []);

  const enableNavigation = useCallback(() => {
    isNavigationDisabledRef.current = false;
    setIsNavigationDisabled(false);
  }, []);

  /** True when navigation must not start (validation in flight or navigation disabled). */
  const isBlocked = useCallback(() => isValidatingRef.current || isNavigationDisabledRef.current, []);

  const handleError = useCallback(
    (error: unknown) => {
      if (onError) {
        onError(error);
        return;
      }
      console.error("ink-stepper: error during navigation:", error);
    },
    [onError],
  );

  // Use controlled step if provided, otherwise internal
  const currentStep = controlledStep ?? internalStep;

  // Sort registered steps by claimed order (see the ordering note on this hook)
  const sortedSteps = useMemo(() => [...registeredSteps].sort((a, b) => a.order - b.order), [registeredSteps]);

  // `registeredSteps` is state and therefore lags `idSetRef` while a re-registration is in flight.
  // Repairing against a momentarily incomplete list would clamp the user onto a step they never
  // chose, so repairs only run once the committed list agrees with the synchronous registry.
  const membershipSettled =
    sortedSteps.length === idSetRef.current.size && sortedSteps.every((step) => idSetRef.current.has(step.id));

  // Keep the user on the same step across insertions/removals elsewhere in the list, by pinning to
  // the active step's id rather than its index. Adjusting state during render is the documented
  // React pattern for this: the render is discarded and restarted before commit, so no frame with
  // the wrong step ever reaches the terminal. Deliberately silent - the user did not navigate, so
  // onStepChange/onEnterStep/onExitStep must NOT fire for these repairs.
  if (controlledStep === undefined && membershipSettled && sortedSteps.length > 0) {
    const activeId = activeIdRef.current;
    const activeIndex = activeId === null ? -1 : sortedSteps.findIndex((step) => step.id === activeId);
    if (activeIndex !== -1) {
      if (activeIndex !== internalStep) setInternalStep(activeIndex);
    } else if (internalStep > sortedSteps.length - 1) {
      setInternalStep(sortedSteps.length - 1);
    }
  }

  const totalSteps = sortedSteps.length;
  const currentStepConfig = sortedSteps[currentStep];
  const currentStepId = currentStepConfig?.id ?? null;

  // Remember which step the user is on, so the repair above can find it again after a reorder.
  useLayoutEffect(() => {
    if (currentStepId !== null) activeIdRef.current = currentStepId;
    sortedStepsRef.current = sortedSteps;
  }, [currentStepId, sortedSteps]);

  /**
   * Apply a user-initiated navigation. The active id is recorded synchronously here because the
   * render-phase repair above runs before the layout effect that records it, and would otherwise
   * read the pre-navigation id and immediately revert the move. The step list is read from a ref
   * so that a navigation handler captured in an earlier render still resolves the current list.
   */
  const commitStep = useCallback((step: number) => {
    activeIdRef.current = sortedStepsRef.current[step]?.id ?? activeIdRef.current;
    setInternalStep(step);
  }, []);

  /** Insert the step, or replace an existing registration (order/name/canProceed can all change). */
  const registerStep = useCallback((step: RegisteredStep) => {
    idSetRef.current.add(step.id);
    setRegisteredSteps((prev) => {
      const index = prev.findIndex((s) => s.id === step.id);
      if (index === -1) return [...prev, step];

      const existing = prev[index];
      // Bail out when nothing changed, otherwise a re-registration would schedule a render forever.
      if (
        existing !== undefined &&
        existing.name === step.name &&
        existing.canProceed === step.canProceed &&
        existing.order === step.order
      ) {
        return prev;
      }

      const next = [...prev];
      next[index] = step;
      return next;
    });
  }, []);

  const unregisterStep = useCallback((id: string) => {
    idSetRef.current.delete(id);
    setRegisteredSteps((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Detect newly registered ids and force an order resync. Only additions matter: removals leave
  // the remaining orders in a valid relative sequence (the sort tolerates gaps). The resync commit
  // itself adds no ids, so it cannot bump again - convergence takes exactly one extra commit.
  useLayoutEffect(() => {
    let hasNewId = false;
    for (const id of idSetRef.current) {
      if (!prevIdSetRef.current.has(id)) {
        hasNewId = true;
        break;
      }
    }
    prevIdSetRef.current = new Set(idSetRef.current);
    if (hasNewId) setOrderGeneration((generation) => generation + 1);
  });

  const resolveCanProceed = useCallback(async (): Promise<boolean> => {
    const canProceed = currentStepConfig?.canProceed ?? true;
    if (typeof canProceed === "function") {
      isValidatingRef.current = true;
      setIsValidating(true);
      try {
        return await canProceed();
      } finally {
        isValidatingRef.current = false;
        setIsValidating(false);
      }
    }
    return canProceed;
  }, [currentStepConfig]);

  const goNext = useCallback(async () => {
    // Guard read before any await so a second call cannot slip past mid-validation
    if (isBlocked()) return;

    try {
      if (!(await resolveCanProceed())) return;
      // Call onExitStep - can cancel navigation by returning false
      if (onExitStep && (await onExitStep(currentStep)) === false) return;
    } catch (error) {
      handleError(error);
      return;
    }

    if (currentStep >= totalSteps - 1) {
      onComplete();
    } else {
      const newStep = currentStep + 1;
      commitStep(newStep);
      onStepChange?.(newStep);
      onEnterStep?.(newStep);
    }
  }, [
    resolveCanProceed,
    currentStep,
    totalSteps,
    onComplete,
    onStepChange,
    onExitStep,
    onEnterStep,
    isBlocked,
    handleError,
    commitStep,
  ]);

  const goBack = useCallback(async () => {
    if (isBlocked()) return;

    try {
      // Call onExitStep - can cancel navigation by returning false
      if (onExitStep && (await onExitStep(currentStep)) === false) return;
    } catch (error) {
      handleError(error);
      return;
    }

    if (currentStep <= 0) {
      onCancel?.();
    } else {
      const newStep = currentStep - 1;
      commitStep(newStep);
      onStepChange?.(newStep);
      onEnterStep?.(newStep);
    }
  }, [currentStep, onCancel, onStepChange, onExitStep, onEnterStep, isBlocked, handleError, commitStep]);

  /**
   * Jump straight to a step. Fires the same lifecycle as goNext/goBack but deliberately
   * skips canProceed - goTo is a raw jump, not a validated advance.
   */
  const goTo = useCallback(
    async (step: number) => {
      if (isBlocked()) return;

      const clampedStep = Math.max(0, Math.min(step, totalSteps - 1));
      if (clampedStep === currentStep) return;

      try {
        // Call onExitStep - can cancel navigation by returning false
        if (onExitStep && (await onExitStep(currentStep)) === false) return;
      } catch (error) {
        handleError(error);
        return;
      }

      commitStep(clampedStep);
      onStepChange?.(clampedStep);
      onEnterStep?.(clampedStep);
    },
    [totalSteps, currentStep, onStepChange, onExitStep, onEnterStep, isBlocked, handleError, commitStep],
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
        id: step.id,
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
    disableNavigation,
    enableNavigation,
    isNavigationDisabled,
    claimOrder,
    orderGeneration,
  };
}
