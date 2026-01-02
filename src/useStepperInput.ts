import { useStepperContext } from "./StepperContext";

export interface UseStepperInputReturn {
  /** Disable Stepper keyboard navigation (call when input is focused) */
  disableNavigation: () => void;
  /** Re-enable Stepper keyboard navigation (call when input blurs) */
  enableNavigation: () => void;
  /** Whether navigation is currently disabled */
  isNavigationDisabled: boolean;
}

/**
 * Hook for coordinating input focus with Stepper keyboard navigation.
 *
 * Use this when a step contains interactive inputs (TextInput, Select, etc.)
 * that need to handle their own keyboard events without triggering Stepper navigation.
 *
 * @example
 * ```tsx
 * function MyStep() {
 *   const { disableNavigation, enableNavigation } = useStepperInput();
 *
 *   return (
 *     <TextInput
 *       onFocus={disableNavigation}
 *       onBlur={enableNavigation}
 *       // ...
 *     />
 *   );
 * }
 * ```
 */
export function useStepperInput(): UseStepperInputReturn {
  const { disableNavigation, enableNavigation, isNavigationDisabled } = useStepperContext();
  return { disableNavigation, enableNavigation, isNavigationDisabled };
}
