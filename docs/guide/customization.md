# Customization

`ink-stepper` allows you to customize the visual appearance of the progress bar to match your CLI's theme.

## Custom Markers

You can change the symbols used for completed, current, and pending steps using the `markers` prop.

```tsx
<Stepper
  markers={{
    completed: '[x]',
    current: '[o]',
    pending: '[ ]'
  }}
  onComplete={handleComplete}
>
  {/* ... */}
</Stepper>
```

**Defaults:**
- Completed: `" ✓ "` (padded to 3 characters)
- Current: `●`
- Pending: `○`

Markers may differ in width from one another — the default set already does. The progress bar sizes each label column from the marker actually rendered for that step, so the labels stay aligned with their markers as steps complete.

## Custom Progress Renderer

For complete control over the progress bar, use the `renderProgress` prop. This allows you to replace the default renderer entirely.

```tsx
<Stepper
  renderProgress={({ currentStep, steps }) => (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        Step {currentStep + 1} of {steps.length}
      </Text>
      <Box>
        {steps.map(step => (
          <Text key={step.id} color={step.completed ? 'green' : 'gray'}>
            {step.completed ? '■' : '□'}{' '}
          </Text>
        ))}
      </Box>
    </Box>
  )}
  onComplete={handleComplete}
>
  {/* ... */}
</Stepper>
```

The `renderProgress` function receives a `ProgressContext` object:

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

::: tip
Use `step.id` as the React key when mapping over `steps`. Two steps are allowed to share a `name`, so names are not safe keys.
:::

## Hiding the Progress Bar

If you don't want a progress bar at all, set `showProgress={false}`.

```tsx
<Stepper showProgress={false} onComplete={handleComplete}>
  {/* ... */}
</Stepper>
```
