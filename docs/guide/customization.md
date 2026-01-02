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
- Completed: `✓`
- Current: `●`
- Pending: `○`

## Custom Progress Renderer

For complete control over the progress bar, use the `renderProgress` prop. This allows you to replace the default renderer entirely.

```tsx
<Stepper
  renderProgress={({ currentStep, steps }) => (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        Step {currentStep + 1} of {steps.length}
      </Text>
      <Text color="green">
        {steps.map(s => s.completed ? '■' : '□').join(' ')}
      </Text>
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
  currentStep: number;
  steps: Array<{
    name: string;
    completed: boolean;
    current: boolean;
  }>;
}
```

## Hiding the Progress Bar

If you don't want a progress bar at all, set `showProgress={false}`.

```tsx
<Stepper showProgress={false} onComplete={handleComplete}>
  {/* ... */}
</Stepper>
```
