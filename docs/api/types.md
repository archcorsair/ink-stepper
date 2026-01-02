# Types

## `StepContext`

Passed to the render function of a `<Step>` or available via `useStepperContext().stepContext`.

```ts
interface StepContext {
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
```

## `ProgressContext`

Passed to `renderProgress`.

```ts
interface ProgressContext {
  /** Current step index (zero-based) */
  currentStep: number;
  /** Array of step metadata */
  steps: Array<{
    name: string;
    completed: boolean;
    current: boolean;
  }>;
}
```

## `StepperMarkers`

Configuration for default progress bar.

```ts
interface StepperMarkers {
  /** Marker for completed steps (default: ' ✓ ') */
  completed?: string;
  /** Marker for current step (default: '●') */
  current?: string;
  /** Marker for pending steps (default: '○') */
  pending?: string;
}
```
