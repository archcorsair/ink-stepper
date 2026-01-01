import type { StepProps } from "./types";

/**
 * Step component - a marker component for defining stepper steps.
 *
 * This component never renders anything itself. The Stepper parent
 * extracts props from Step children to build its internal configuration.
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
export function Step(_props: StepProps): null {
  return null;
}
