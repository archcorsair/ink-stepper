# Basic Usage

The core of `ink-stepper` revolves around the `<Stepper>` container and `<Step>` components.

## The Stepper Component

The `<Stepper>` component orchestrates the flow. It requires an `onComplete` callback, which triggers when the user presses Enter on the final step.

```tsx
<Stepper
  onComplete={() => process.exit(0)}
  onCancel={() => process.exit(1)}
>
  {/* Steps go here */}
</Stepper>
```

### Key Props

- `onComplete`: Function called when the wizard finishes.
- `onCancel`: Function called when the user presses Escape on the first step.
- `initialStep`: (Optional) The index of the step to start on in uncontrolled mode (default: `0`). Ignored when the controlled `step` prop is provided.
- `onError`: (Optional) Called when an async `canProceed` or `onExitStep` throws. See [Validation](/guide/validation#error-handling).

## Defining Steps

Use the `<Step>` component to define each page of your wizard. Every step needs a unique `name` which is displayed in the progress bar.

```tsx
<Step name="Configuration">
  <Text>Step content goes here.</Text>
</Step>
```

### Accessing Step Context

If you need to programmatically control navigation (e.g., from your own key binding instead of just pressing Enter), you can use the function-as-child pattern to access `StepContext`. Ink has no click targets, so wire the control up with `useInput`:

```tsx
import { Box, Text, useInput } from 'ink';

function NextHint({ onNext }: { onNext: () => void }) {
  useInput((input) => {
    if (input === 'n') onNext();
  });

  return <Text dimColor>Press "n" to continue.</Text>;
}

<Step name="Manual Control">
  {({ goNext }) => (
    <Box flexDirection="column">
      <Text>Custom controls:</Text>
      <NextHint onNext={goNext} />
    </Box>
  )}
</Step>
```

The context provides:
- `goNext()`: Advance to the next step (respects `canProceed`).
- `goBack()`: Return to the previous step (cancels the wizard from the first step).
- `goTo(index)`: Jump to a specific step. The index is clamped to the valid range, and unlike `goNext` this skips `canProceed` — it is a raw jump. It still fires the full lifecycle, see [Lifecycle Hooks](/guide/lifecycle#programmatic-jumps-with-goto).
- `cancel()`: Cancel the wizard (calls `onCancel`).
- `isFirst`, `isLast`: Boolean flags for current position.
- `currentStep`, `totalSteps`: Numeric indicators.
- `isValidating`: `true` while an async `canProceed` is running.

`goNext()`, `goBack()` and `goTo()` are all no-ops while validation is in flight or while navigation has been disabled via [`useStepperInput`](/guide/input-coordination).

## Keyboard Navigation

Keyboard navigation is on by default:

- **Enter** — advance to the next step (subject to `canProceed`).
- **Escape** — go back to the previous step; on the first step it cancels the wizard and calls `onCancel`.

Turn it off with `keyboardNav={false}` if your steps handle all input themselves:

```tsx
<Stepper onComplete={handleComplete} keyboardNav={false}>
  {/* ... */}
</Stepper>
```

Both keys are ignored while an async `canProceed` is running and while navigation has been disabled via [`useStepperInput`](/guide/input-coordination).

## Conditional Steps

Steps may be wrapped in components or rendered conditionally. They are ordered by their position in the element tree, not by the time they mounted, so a step toggled on later slots into its JSX position:

```tsx
<Stepper onComplete={handleComplete}>
  <Step name="Account">{/* ... */}</Step>
  {needsBilling && <Step name="Billing">{/* ... */}</Step>}
  <Step name="Review">{/* ... */}</Step>
</Stepper>
```

In uncontrolled mode the user stays on the same step when another step is inserted or removed elsewhere — the active step is tracked by identity, not by index — and no lifecycle callbacks fire for that repair. If the active step itself is removed, the index is kept, so whichever step slides into that position becomes active; it only clamps to the last remaining step when the removed step was the last one.

::: warning
A `<Step>` must not be nested inside another `<Step>`; that breaks the tree-order guarantee. Wrapper components, fragments, and conditionals around a `<Step>` are fine.
:::
