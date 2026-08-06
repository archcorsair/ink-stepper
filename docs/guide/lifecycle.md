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

    // Perform cleanup or save - no return value needed
    await saveData(stepIndex);
  }}
>
  {/* ... */}
</Stepper>
```

The signature is `(step: number) => void | boolean | Promise<void | boolean>`. Only an explicit `false` cancels navigation, so a handler that just performs a side effect can return nothing.

### Preventing Navigation

If `onExitStep` returns `false` (or a Promise that resolves to `false`), the navigation is cancelled, and the user remains on the current step. This applies to `goNext()`, `goBack()` and `goTo()` alike.

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

## Callback Order

Every user-initiated navigation runs the same sequence:

```
onExitStep(from)  →  onStepChange(to)  →  onEnterStep(to)
```

`goNext()` additionally resolves `canProceed` before any of it; if the check fails, nothing fires. Reaching the end of the wizard calls `onComplete` instead of the change/enter pair, and going back from the first step calls `onCancel`.

`onExitStep` runs **before** those terminal callbacks too:

```
onExitStep(last)   →  onComplete()      // advancing past the last step
onExitStep(0)      →  onCancel()        // going back from the first step
```

So returning `false` from `onExitStep` blocks completion and cancellation exactly the same way it blocks a step change — the wizard stays where it is and neither `onComplete` nor `onCancel` fires.

## Programmatic Jumps with `goTo`

`goTo(index)` fires the same full lifecycle as `goNext`/`goBack`, so `onExitStep` can cancel a jump by returning `false`. Two things make it different:

- It **skips `canProceed`** on the current step — `goTo` is a raw jump, not a validated advance. Use it for "back to summary" style navigation, not to bypass validation on the way forward.
- The index is **clamped** to the valid range, and a jump to the current index is a no-op (no callbacks fire).

```tsx
import { Text, useInput } from 'ink';

function EditFirstHint({ onEdit }: { onEdit: () => void }) {
  useInput((input) => {
    if (input === '1') onEdit();
  });

  return <Text dimColor>Press "1" to edit the first step.</Text>;
}

<Step name="Review">
  {({ goTo }) => <EditFirstHint onEdit={() => goTo(0)} />}
</Step>
```

The Review step of [`examples/wizard.tsx`](https://github.com/archcorsair/ink-stepper/blob/main/examples/wizard.tsx) is exactly this: press `1` to `goTo(0)` and watch the lifecycle log.

Like `goNext` and `goBack`, `goTo` does nothing while async validation is in flight or while navigation is disabled via [`useStepperInput`](/guide/input-coordination).

## Errors in Callbacks

If `onExitStep` throws or returns a rejecting Promise, navigation is blocked and the error is passed to the `onError` prop (or logged via `console.error` when that prop is omitted). See [Validation](/guide/validation#error-handling).

## Silent Index Repairs

Conditional steps can appear and disappear. When that happens, the Stepper keeps the user on the same step by re-pointing the internal index at the step they were already on. If that step itself was removed, the index stays put — whichever step slides into that position becomes active — and only clamps to the last remaining step when the removed step was the last one.

These repairs are **not** navigation: `onExitStep`, `onStepChange` and `onEnterStep` do not fire for them. Only user-initiated `goNext()`/`goBack()`/`goTo()` calls and keyboard navigation trigger the lifecycle.
