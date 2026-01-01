import { Box, useInput } from "ink";
import React, { useMemo } from "react";
import { Step } from "./Step";
import { StepperProgress } from "./StepperProgress";
import type { StepConfig, StepperProps } from "./types";
import { useStepper } from "./useStepper";

/**
 * Extracts step configuration from Step children.
 */
function extractSteps(children: React.ReactNode): StepConfig[] {
  return React.Children.toArray(children)
    .filter(
      (child): child is React.ReactElement<React.ComponentProps<typeof Step>> =>
        React.isValidElement(child) && child.type === Step,
    )
    .map((child) => ({
      name: child.props.name,
      canProceed: child.props.canProceed ?? true,
      children: child.props.children,
    }));
}

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
  keyboardNav = true,
  showProgress = true,
  renderProgress,
  markers,
}: StepperProps): React.JSX.Element {
  const steps = useMemo(() => extractSteps(children), [children]);

  const { stepContext, progressContext, currentStepConfig } = useStepper({
    steps,
    onComplete,
    onCancel,
  });

  // Keyboard navigation
  useInput(
    (_input, key) => {
      if (key.return) {
        stepContext.goNext();
      }
      if (key.escape) {
        stepContext.goBack();
      }
    },
    { isActive: keyboardNav },
  );

  // Render current step content
  const renderStepContent = () => {
    if (!currentStepConfig) return null;

    const { children: stepChildren } = currentStepConfig;

    if (typeof stepChildren === "function") {
      return stepChildren(stepContext);
    }

    return stepChildren;
  };

  return (
    <Box flexDirection="column">
      {/* Progress bar */}
      {showProgress &&
        (renderProgress ? renderProgress(progressContext) : <StepperProgress {...progressContext} markers={markers} />)}

      {/* Current step content */}
      {renderStepContent()}
    </Box>
  );
}
