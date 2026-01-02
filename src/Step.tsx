import { useId, useLayoutEffect, useRef } from "react";
import { useStepperContext } from "./StepperContext";
import type { StepProps } from "./types";

// Global counter for step mount order - ensures deterministic ordering
let globalMountOrder = 0;

/**
 * Step component - registers with Stepper and renders when current.
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
  const { registerStep, unregisterStep, stepContext, currentStepId } = useStepperContext();

  // Track mount order - assigned once on first effect run
  const orderRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    // Assign order on first registration only
    if (orderRef.current === null) {
      orderRef.current = globalMountOrder++;
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
  }, [id, name, canProceed, registerStep, unregisterStep]);

  // Only render if this is the current step
  if (currentStepId !== id) return null;

  if (!stepContext) return null;

  if (typeof children === "function") {
    return children(stepContext);
  }

  return children;
}
