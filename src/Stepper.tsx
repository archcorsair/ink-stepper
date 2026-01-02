import { Box, useInput } from "ink";
import React, { useMemo } from "react";
import { StepperContext, type StepperContextValue } from "./StepperContext";
import { StepperProgress } from "./StepperProgress";
import type { StepperProps } from "./types";
import { useStepper } from "./useStepper";

/**
 * Stepper component for building step-by-step wizard flows.
 *
 * @example
 * ```tsx
 * <Stepper onComplete={handleComplete} onCancel={handleExit}>
 *   <Step name="Theme">
 *     <ThemeSelector />
 *   </Step>
 *   <Step name="Directory" canProceed={pathIsValid}>
 *     {({ goNext, goBack }) => (
 *       <PathInput onConfirm={goNext} onBack={goBack} />
 *     )}
 *   </Step>
 *   <Step name="Review">
 *     {({ goBack }) => <Review onBack={goBack} />}
 *   </Step>
 * </Stepper>
 * ```
 */
export function Stepper({
  children,
  onComplete,
  onCancel,
  onStepChange,
  onEnterStep,
  onExitStep,
  step: controlledStep,
  keyboardNav = true,
  showProgress = true,
  renderProgress,
  markers,
}: StepperProps): React.JSX.Element {
  const {
    stepContext,
    progressContext,
    currentStepId,
    registerStep,
    unregisterStep,
    isValidating,
    disableNavigation,
    enableNavigation,
    isNavigationDisabled,
  } = useStepper({
    onComplete,
    onCancel,
    onStepChange,
    onEnterStep,
    onExitStep,
    controlledStep,
  });

  // Keyboard navigation
  useInput(
    (_input, key) => {
      if (isValidating || isNavigationDisabled) return; // Block navigation during validation or when disabled
      if (key.return) {
        stepContext.goNext();
      }
      if (key.escape) {
        stepContext.goBack();
      }
    },
    { isActive: keyboardNav },
  );

  const contextValue: StepperContextValue = useMemo(
    () => ({
      registerStep,
      unregisterStep,
      stepContext,
      currentStepId,
      disableNavigation,
      enableNavigation,
      isNavigationDisabled,
    }),
    [registerStep, unregisterStep, stepContext, currentStepId, disableNavigation, enableNavigation, isNavigationDisabled],
  );

  return (
    <StepperContext.Provider value={contextValue}>
      <Box flexDirection="column">
        {/* Progress bar */}
        {showProgress &&
          progressContext.steps.length > 0 &&
          (renderProgress ? renderProgress(progressContext) : <StepperProgress {...progressContext} markers={markers} />)}

        {/* Step children - they self-register and self-render */}
        {children}
      </Box>
    </StepperContext.Provider>
  );
}
