# Controlled Mode

By default, `<Stepper>` manages its own internal state (which step is currently active). However, there are scenarios where you might want to control the step index from a parent component, such as:

- Syncing the step with a URL or external store.
- Implementing complex custom navigation logic outside the stepper.
- Restoring a session from a saved state.

## Using the `step` Prop

To enable controlled mode, pass the `step` prop (zero-based index) to the `<Stepper>` component. You should also listen to `onStepChange` to update your external state.

```tsx
import { useState } from 'react';
import { Stepper, Step } from 'ink-stepper';

function App() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <Stepper
      step={currentStep}
      onStepChange={(newStep) => {
        // You can intercept or modify the change here if needed
        setCurrentStep(newStep);
      }}
      onComplete={() => console.log('Done')}
    >
      <Step name="A"><Text>Step A</Text></Step>
      <Step name="B"><Text>Step B</Text></Step>
      <Step name="C"><Text>Step C</Text></Step>
    </Stepper>
  );
}
```

When `step` is provided:
1. The Stepper will always render the step at that index.
2. Calls to `goNext()`, `goBack()`, etc., will trigger `onStepChange` with the new index, but the Stepper **will not update visually** until you update the `step` prop.
3. The `initialStep` prop is ignored — the parent owns the index from the first render.

::: tip
`onStepChange` never fires for the initial render, in either mode. Only `goNext()`, `goBack()` and `goTo()` invoke it, so a wizard that starts on `initialStep={2}` reports nothing until the user actually navigates — seed your own state with the same starting index instead of waiting for a callback.
:::

## Conditional Steps in Controlled Mode

In uncontrolled mode the Stepper keeps the user on the same step when steps are added or removed elsewhere in the list. In controlled mode it cannot: the index you pass is the source of truth, so inserting a step **before** the current index changes which step that index points at.

```tsx
// step={1} with these children renders "B"
<Step name="A"><Text>A</Text></Step>
<Step name="B"><Text>B</Text></Step>
<Step name="C"><Text>C</Text></Step>

// after inserting a step before B, step={1} renders "New" instead
<Step name="A"><Text>A</Text></Step>
<Step name="New"><Text>New</Text></Step>
<Step name="B"><Text>B</Text></Step>
<Step name="C"><Text>C</Text></Step>
```

If you mount steps conditionally, adjust your own state when the set changes (for example, increment the index when you insert a step ahead of the user).

Step *ordering* itself is unaffected — steps always sort by their position in the element tree, whenever they mount.
