# Types

## `StepContext`

Passed to the render function of a `<Step>` or available via `useStepperContext().stepContext`.

```ts
interface StepContext {
  /** Navigate to the next step (respects canProceed) */
  goNext: () => void;
  /** Navigate to the previous step */
  goBack: () => void;
  /**
   * Jump to a specific step by index (zero-based).
   *
   * The index is clamped to the valid range and fires the full lifecycle
   * (`onExitStep` -> `onStepChange` -> `onEnterStep`); returning `false` from
   * `onExitStep` cancels the jump. Unlike `goNext`, `goTo` deliberately skips
   * the current step's `canProceed` check - it is a raw jump.
   */
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

`goNext`, `goBack` and `goTo` are all no-ops while `isValidating` is `true` or while navigation has been disabled via [`useStepperInput`](/api/hooks#usestepperinput).

## `StepperProps`

Props for the `<Stepper>` component.

```ts
interface StepperProps {
  /** Step elements, plus any other content to render alongside every step */
  children: ReactNode;
  /** Called when advancing past the last step */
  onComplete: () => void;
  /** Called when canceling (Escape on first step or cancel() call) */
  onCancel?: () => void;
  /** Called when the current step changes (step is zero-based) */
  onStepChange?: (step: number) => void;
  /** Called before leaving a step (can be async, return false to cancel navigation) */
  onExitStep?: (step: number) => void | boolean | Promise<void | boolean>;
  /** Called after entering a step */
  onEnterStep?: (step: number) => void;
  /**
   * Called when an async `canProceed` or `onExitStep` callback throws or rejects.
   * Navigation is blocked in that case. When omitted, the error is logged via `console.error`.
   */
  onError?: (error: unknown) => void;
  /** Controlled step index (zero-based) - when provided, Stepper is controlled */
  step?: number;
  /** Starting step index for uncontrolled mode (default: 0). Ignored when `step` is provided. */
  initialStep?: number;
  /** Enable keyboard navigation (Enter/Escape) (default: true) */
  keyboardNav?: boolean;
  /** Show the progress bar (default: true) */
  showProgress?: boolean;
  /** Custom progress bar renderer */
  renderProgress?: (context: ProgressContext) => ReactNode;
  /** Custom markers for progress bar states */
  markers?: StepperMarkers;
  /**
   * Pulse the current-step marker in the default progress bar by cycling its
   * brightness (bright → normal → dim → normal), the way terminal spinners
   * animate (default: false). Ignored when `renderProgress` is provided.
   */
  pulse?: boolean;
}
```

`children` is not restricted to `<Step>` elements. Anything else you put inside the `<Stepper>` renders on every step, which is handy for a shared header, footer, or status line.

## `StepProps`

Props for the `<Step>` component.

```ts
interface StepProps {
  /** Display name shown in progress bar */
  name: string;
  /** Whether navigation to next step is allowed (default: true). Can be boolean or async function. */
  canProceed?: boolean | (() => boolean | Promise<boolean>);
  /** Step content - either ReactNode or render function receiving StepContext */
  children: ReactNode | ((context: StepContext) => ReactNode);
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
    /** Stable unique identifier for the step - safe to use as a React key */
    id: string;
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

## `UseStepperInputReturn`

Returned by [`useStepperInput`](/api/hooks#usestepperinput).

```ts
interface UseStepperInputReturn {
  /** Disable Stepper keyboard navigation (call when input is focused) */
  disableNavigation: () => void;
  /** Re-enable Stepper keyboard navigation (call when input blurs) */
  enableNavigation: () => void;
  /** Whether navigation is currently disabled */
  isNavigationDisabled: boolean;
}
```

## `StepperContextValue`

Returned by [`useStepperContext`](/api/hooks#usesteppercontext). This is the internal Stepper context; the members marked `@internal` exist for the `<Step>` component's own bookkeeping and are not part of the supported surface.

```ts
interface StepperContextValue {
  /** Register a new step with the parent Stepper */
  registerStep: (step: RegisteredStep) => void;
  /** Unregister a step (e.g., on unmount) */
  unregisterStep: (id: string) => void;
  /**
   * Context helper for the current step (navigation methods, status, etc.).
   * Null if the component is not currently active/rendered.
   */
  stepContext: StepContext | null;
  /** ID of the currently active step */
  currentStepId: string | null;
  /** Temporarily disable Stepper navigation (e.g., when input is focused) */
  disableNavigation: () => void;
  /** Re-enable Stepper navigation */
  enableNavigation: () => void;
  /** Whether navigation is currently disabled */
  isNavigationDisabled: boolean;
  /**
   * Claim the next sort order slot from the Stepper's counter.
   *
   * Steps claim in layout-effect order, which for non-nested siblings equals tree order.
   * @internal
   */
  claimOrder: () => number;
  /**
   * Bumped by the Stepper whenever a new step id appears, forcing every Step to re-claim
   * its order against a freshly reset counter so tree order is restored.
   * @internal
   */
  orderGeneration: number;
}
```

## `RegisteredStep`

Metadata for a step registered within the Stepper.

```ts
interface RegisteredStep {
  /** Unique identifier for the step (generated via useId) */
  id: string;
  /** Display name of the step */
  name: string;
  /**
   * Validation function or boolean flag to control navigation.
   * If a function, it can be async.
   */
  canProceed: boolean | (() => boolean | Promise<boolean>);
  /**
   * Sort order for the step, claimed from the parent Stepper's counter.
   * Reflects the step's position in the element tree, not the time it mounted.
   */
  order: number;
}
```
