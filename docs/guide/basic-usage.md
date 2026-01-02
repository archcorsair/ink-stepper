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
- `initialStep`: (Optional) The index of the step to start on (default: 0).

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
- `goNext()`: Advance to the next step.
- `goBack()`: Return to the previous step.
- `goTo(index)`: Jump to a specific step.
- `isFirst`, `isLast`: Boolean flags for current position.
- `currentStep`, `totalSteps`: Numeric indicators.
