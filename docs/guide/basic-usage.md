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

If you need to programmatically control navigation (e.g., from a custom button instead of just pressing Enter), you can use the function-as-child pattern to access `StepContext`:

```tsx
<Step name="Manual Control">
  {({ goNext, goBack, isLast }) => (
    <Box flexDirection="column">
      <Text>Custom controls:</Text>
      <Text color="blue" onPress={goNext}>
        [ Next > ]
      </Text>
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

## Conditional Steps

Steps may be wrapped in components or rendered conditionally. They are ordered by their position in the element tree, not by the time they mounted, so a step toggled on later slots into its JSX position:

```tsx
<Stepper onComplete={handleComplete}>
  <Step name="Account">{/* ... */}</Step>
  {needsBilling && <Step name="Billing">{/* ... */}</Step>}
  <Step name="Review">{/* ... */}</Step>
</Stepper>
```

In uncontrolled mode the user stays on the same step when another step is inserted or removed elsewhere — the active step is tracked by identity, not by index — and no lifecycle callbacks fire for that repair. If the active step itself is removed, the index clamps to the last remaining step.

::: warning
A `<Step>` must not be nested inside another `<Step>`; that breaks the tree-order guarantee. Wrapper components, fragments, and conditionals around a `<Step>` are fine.
:::
