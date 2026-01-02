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
