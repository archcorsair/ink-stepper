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
