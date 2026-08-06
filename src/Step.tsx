import { useId, useLayoutEffect, useRef } from "react";
import { useStepperContext } from "./StepperContext";
import type { StepProps } from "./types";

/**
 * Step component - registers with Stepper and renders when current.
 *
 * Sort order comes from a counter owned by the parent Stepper and claimed in layout-effect order,
 * which equals tree order for sibling Steps. Do not nest a Step inside another Step - that breaks
 * the tree-order guarantee (wrapper components around a Step are fine).
 *
 * @example
 * ```tsx
 * <Stepper onComplete={handleComplete}>
 *   <Step name="Theme">
 *     <ThemeSelector />
 *   </Step>
 *   <Step name="Directory" canProceed={pathIsValid}>
 *     {({ goNext }) => <PathInput onConfirm={goNext} />}
 *   </Step>
 * </Stepper>
 * ```
 */
export function Step({ name, canProceed = true, children }: StepProps): React.ReactNode {
  const id = useId();
  const { registerStep, unregisterStep, stepContext, currentStepId, claimOrder, orderGeneration } = useStepperContext();

  // Sort order, plus the generation of the counter it was claimed from
  const orderRef = useRef<number | null>(null);
  const claimedGenerationRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    // Claim on first registration, and again whenever the Stepper resets its counter. Effect
    // re-runs from prop identity churn (e.g. an inline canProceed) must keep the existing order -
    // claiming on every run would push this step to the end of the list.
    if (orderRef.current === null || claimedGenerationRef.current !== orderGeneration) {
      orderRef.current = claimOrder();
      claimedGenerationRef.current = orderGeneration;
    }

    registerStep({
      id,
      name,
      canProceed,
      order: orderRef.current,
    });

    return () => {
      unregisterStep(id);
    };
  }, [id, name, canProceed, orderGeneration, claimOrder, registerStep, unregisterStep]);

  // Only render if this is the current step
  if (currentStepId !== id) return null;

  if (!stepContext) return null;

  if (typeof children === "function") {
    return children(stepContext);
  }

  return children;
}
