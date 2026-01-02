# Lifecycle Hooks

`ink-stepper` provides lifecycle hooks that allow you to execute logic when steps are entered or exited. This is useful for analytics, saving data, or performing cleanup.

## Entering a Step

The `onEnterStep` callback is triggered whenever the active step changes. It receives the index of the new step.

```tsx
<Stepper
  onEnterStep={(stepIndex) => {
    console.log(`Navigated to step ${stepIndex}`);
    analytics.trackView(`step_${stepIndex}`);
  }}
>
  {/* ... */}
</Stepper>
```

## Exiting a Step

The `onExitStep` callback is triggered *before* leaving the current step. It can be used to validate data, save state, or prevent navigation.

```tsx
<Stepper
  onExitStep={async (stepIndex) => {
    console.log(`Leaving step ${stepIndex}`);
    
    // Perform cleanup or save
    await saveData(stepIndex);

    // Return true to allow navigation, false to cancel
    return true; 
  }}
>
  {/* ... */}
</Stepper>
```

### Preventing Navigation

If `onExitStep` returns `false` (or a Promise that resolves to `false`), the navigation is cancelled, and the user remains on the current step. This applies to both `goNext()` and `goBack()`.

```tsx
<Stepper
  onExitStep={(step) => {
    if (step === 0 && !formIsValid) {
      console.log('Cannot leave step 0 yet!');
      return false;
    }
    return true;
  }}
>
  {/* ... */}
</Stepper>
```
