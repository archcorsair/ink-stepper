import type { ReactNode } from "react";

/**
 * Context passed to step content when using render function pattern.
 */
export interface StepContext {
  /** Navigate to the next step (respects canProceed) */
  goNext: () => void;
  /** Navigate to the previous step */
  goBack: () => void;
  /** Jump to a specific step by index (zero-based) */
  goTo: (step: number) => void;
  /** Cancel the wizard (calls onCancel) */
  cancel: () => void;
  /** Current step index (zero-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether this is the first step */
  isFirst: boolean;
  /** Whether this is the last step */
  isLast: boolean;
  /** Whether async validation is in progress */
  isValidating: boolean;
}

/**
 * Props for the Step component.
 */
export interface StepProps {
  /** Display name shown in progress bar */
  name: string;
  /** Whether navigation to next step is allowed (default: true). Can be boolean or async function. */
  canProceed?: boolean | (() => boolean | Promise<boolean>);
  /** Step content - either ReactNode or render function receiving StepContext */
  children: ReactNode | ((context: StepContext) => ReactNode);
}

/**
 * Context passed to custom progress bar renderer.
 */
export interface ProgressContext {
  /** Current step index (zero-based) */
  currentStep: number;
  /** Array of step metadata */
  steps: Array<{
    name: string;
    completed: boolean;
    current: boolean;
  }>;
}

/**
 * Marker configuration for the progress bar.
 */
export interface StepperMarkers {
  /** Marker for completed steps (default: ' ✓ ') */
  completed?: string;
  /** Marker for current step (default: '●') */
  current?: string;
  /** Marker for pending steps (default: '○') */
  pending?: string;
}

/**
 * Props for the Stepper component.
 */
export interface StepperProps {
  /** Step elements (must be Step components) */
  children: ReactNode;
  /** Called when advancing past the last step */
  onComplete: () => void;
  /** Called when canceling (Escape on first step or cancel() call) */
  onCancel?: () => void;
  /** Called when the current step changes (step is zero-based) */
  onStepChange?: (step: number) => void;
  /** Called before leaving a step (can be async, return false to cancel navigation) */
  onExitStep?: (step: number) => undefined | boolean | Promise<undefined | boolean>;
  /** Called after entering a step */
  onEnterStep?: (step: number) => void;
  /** Controlled step index (zero-based) - when provided, Stepper is controlled */
  step?: number;
  /** Enable keyboard navigation (Enter/Escape) (default: true) */
  keyboardNav?: boolean;
  /** Show the progress bar (default: true) */
  showProgress?: boolean;
  /** Custom progress bar renderer */
  renderProgress?: (context: ProgressContext) => ReactNode;
  /** Custom markers for progress bar states */
  markers?: StepperMarkers;
}

/**
 * Internal step configuration extracted from Step children.
 */
export interface StepConfig {
  name: string;
  canProceed: boolean;
  children: ReactNode | ((context: StepContext) => ReactNode);
}
