# Input Coordination

When building CLI applications, multiple components often vie for keyboard input. `ink-stepper` uses `ink`'s `useInput` hook to handle Enter and Escape keys. If your step content also contains interactive components (like text inputs, selects, etc.), this can lead to conflicts.

For example, typing "Enter" to submit a text input might accidentally trigger the Stepper to advance to the next step.

## The `useStepperInput` Hook

To solve this, `ink-stepper` exports a `useStepperInput` hook. Use this hook within your custom components to temporarily disable the Stepper's navigation handling while your component has focus.

```tsx
import { useStepperInput } from 'ink-stepper';
import { TextInput } from 'ink-text-input'; // hypothetically

function MyInput() {
  const { disableNavigation, enableNavigation } = useStepperInput();
  const [value, setValue] = useState('');

  return (
    <TextInput
      value={value}
      onChange={setValue}
      onFocus={disableNavigation} // Disable Stepper nav
      onBlur={enableNavigation}   // Re-enable Stepper nav
      onSubmit={() => {
        // Handle submission logic here
        // Then potentially manually trigger goNext()
      }}
    />
  );
}
```

## How it Works

1. **`disableNavigation()`**: Tells the parent `<Stepper>` to ignore global Enter/Escape keys.
2. **`enableNavigation()`**: Tells the parent `<Stepper>` to resume listening to Enter/Escape keys.

This ensures that when a user is interacting with a specific input field, they don't accidentally navigate away from the current step.

The flag is not limited to the keyboard: while navigation is disabled, `goNext()`, `goBack()` and `goTo()` are no-ops too. That is what makes the ordering rule below matter.

## Re-enable Before Navigating

A submit handler that both releases the input and advances the wizard must call `enableNavigation()` **before** `goNext()`:

```tsx
useInput((input, key) => {
  if (key.return) {
    enableNavigation(); // must come first
    onSubmit();         // calls goNext()
  }
});
```

::: danger Silent failure
If you call `goNext()` while navigation is still disabled, nothing happens — no error, no warning. The symptom is a dead Enter key: the input accepts the submission but the wizard never advances.
:::

The same applies to a handler that calls `goBack()` or `goTo()`. If you prefer to re-enable on unmount (a cleanup in `useEffect`), remember that the cleanup runs *after* the navigation call, which is too late — re-enable explicitly in the handler as well.

See [`examples/wizard.tsx`](https://github.com/archcorsair/ink-stepper/blob/main/examples/wizard.tsx) (the `NameStep` component) for a complete, runnable version of this pattern.
