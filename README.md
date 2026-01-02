# ink-stepper

Step-by-step wizard component for [Ink](https://github.com/vadimdemedes/ink) terminal applications.

```
━━━━━ ✓ ━━━━━━━━━━ ✓ ━━━━━━━━━━●━━━━━━━━━━○━━━━━
    Theme       Directory     Review      Done

┌─────────────────────────────────────────────────┐
│                                                 │
│  Review your selections:                        │
│                                                 │
│    Theme: Dark                                  │
│    Directory: ~/projects                        │
│                                                 │
│  Press Enter to continue, Escape to go back     │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Installation

```bash
# npm
npm install ink-stepper

# jsr
npx jsr add @archcorsair/ink-stepper

# pnpm
pnpm add ink-stepper

# bun
bun add ink-stepper
```

## Usage

```tsx
import { Stepper, Step } from "ink-stepper";
import { Text } from "ink";

function App() {
  return (
    <Stepper onComplete={() => process.exit(0)} onCancel={() => process.exit(1)}>
      <Step name="Theme">
        <ThemeSelector />
      </Step>
      <Step name="Directory" canProceed={pathIsValid}>
        {({ goNext, goBack }) => (
          <PathInput onConfirm={goNext} onBack={goBack} />
        )}
      </Step>
      <Step name="Review">
        {({ goBack, isLast }) => (
          <Review onBack={goBack} showFinish={isLast} />
        )}
      </Step>
    </Stepper>
  );
}
```

## API

### `<Stepper>`

Main container component that orchestrates step navigation.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | required | Step elements |
| `onComplete` | `() => void` | required | Called when advancing past the last step |
| `onCancel` | `() => void` | - | Called when canceling (Escape on first step or `cancel()`) |
| `onStepChange` | `(step: number) => void` | - | Called when current step changes (zero-based index) |
| `onEnterStep` | `(step: number) => void` | - | Called after entering a step |
| `onExitStep` | `(step: number) => void \| boolean \| Promise<boolean>` | - | Called before leaving a step (return `false` to cancel) |
| `step` | `number` | - | Controlled step index (zero-based) |
| `keyboardNav` | `boolean` | `true` | Enable Enter/Escape navigation |
| `showProgress` | `boolean` | `true` | Show the progress bar |
| `renderProgress` | `(ctx: ProgressContext) => ReactNode` | - | Custom progress bar renderer |
| `markers` | `StepperMarkers` | - | Custom progress bar markers |

### `<Step>`

Marker component for defining individual steps.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | required | Display name in progress bar |
| `canProceed` | `boolean \| (() => boolean \| Promise<boolean>)` | `true` | Whether navigation to next step is allowed (supports async) |
| `children` | `ReactNode \| (ctx: StepContext) => ReactNode` | required | Step content |

### StepContext

Context passed to step content when using the render function pattern:

```tsx
interface StepContext {
  goNext: () => void;           // Navigate to next step (respects canProceed)
  goBack: () => void;           // Navigate to previous step
  goTo: (step: number) => void; // Jump to specific step (zero-based)
  cancel: () => void;           // Cancel the wizard
  currentStep: number;          // Current step index (zero-based)
  totalSteps: number;           // Total number of steps
  isFirst: boolean;             // Whether this is the first step
  isLast: boolean;              // Whether this is the last step
  isValidating: boolean;        // Whether async validation is in progress
}
```

### ProgressContext

Context passed to custom progress bar renderer:

```tsx
interface ProgressContext {
  currentStep: number;
  steps: Array<{
    name: string;
    completed: boolean;
    current: boolean;
  }>;
}
```

## Keyboard Navigation

By default, keyboard navigation is enabled:
- **Enter** - Advance to next step (if `canProceed` is true)
- **Escape** - Go back (or cancel if on first step)

Disable with `keyboardNav={false}`.

## Validation

### Synchronous Validation

Control navigation with the `canProceed` prop:

```tsx
function App() {
  const [isValid, setIsValid] = useState(false);

  return (
    <Stepper onComplete={handleComplete}>
      <Step name="Input" canProceed={isValid}>
        {({ goNext }) => (
          <TextInput
            onChange={(value) => setIsValid(value.length > 0)}
            onSubmit={goNext}
          />
        )}
      </Step>
    </Stepper>
  );
}
```

### Async Validation

`canProceed` supports async functions for server-side validation:

```tsx
function App() {
  const validateEmail = async () => {
    const response = await fetch(`/api/validate?email=${email}`);
    return response.ok;
  };

  return (
    <Stepper onComplete={handleComplete}>
      <Step name="Email" canProceed={validateEmail}>
        {({ goNext, isValidating }) => (
          <Box flexDirection="column">
            <TextInput value={email} onChange={setEmail} />
            {isValidating && <Text color="yellow">Validating...</Text>}
            <Button onPress={goNext} disabled={isValidating}>
              Continue
            </Button>
          </Box>
        )}
      </Step>
    </Stepper>
  );
}
```

The `isValidating` flag in StepContext is `true` while async validation is running, allowing you to show loading states.

## Lifecycle Hooks

### onEnterStep / onExitStep

Execute logic when entering or leaving steps:

```tsx
<Stepper
  onComplete={handleComplete}
  onEnterStep={(step) => {
    analytics.track(`entered_step_${step}`);
  }}
  onExitStep={async (step) => {
    // Save draft before leaving
    await saveDraft(step);
    return true; // Allow navigation
  }}
>
  ...
</Stepper>
```

`onExitStep` can return `false` (sync or async) to cancel navigation:

```tsx
<Stepper
  onComplete={handleComplete}
  onExitStep={(step) => {
    if (hasUnsavedChanges) {
      return confirm("Discard changes?");
    }
    return true;
  }}
>
  ...
</Stepper>
```

## Input Coordination

When steps contain interactive inputs (TextInput, Select, etc.), use `useStepperInput` to prevent keyboard conflicts:

```tsx
import { useStepperInput } from "ink-stepper";

function EmailInput() {
  const { disableNavigation, enableNavigation } = useStepperInput();
  const [value, setValue] = useState("");

  return (
    <TextInput
      value={value}
      onChange={setValue}
      onFocus={disableNavigation}  // Disable Enter/Escape handling
      onBlur={enableNavigation}    // Re-enable when done
    />
  );
}
```

This prevents Enter from advancing the step while the user is typing.

## Controlled Mode

For external state management, use the `step` prop:

```tsx
function App() {
  const [currentStep, setCurrentStep] = useState(0);

  return (
    <Stepper
      step={currentStep}
      onStepChange={setCurrentStep}
      onComplete={handleComplete}
    >
      <Step name="One">...</Step>
      <Step name="Two">...</Step>
    </Stepper>
  );
}
```

## Wrapped & Nested Steps

Steps can be wrapped in custom components, fragments, or conditional logic:

```tsx
const StepGroup = ({ children }) => <>{children}</>;

<Stepper onComplete={handleComplete}>
  <StepGroup>
    <Step name="Wrapped">
      <Text>This works!</Text>
    </Step>
  </StepGroup>
  {showOptional && (
    <Step name="Optional">
      <Text>Conditional step</Text>
    </Step>
  )}
</Stepper>
```

## Custom Progress Bar

### Custom Markers

Customize the progress bar markers without replacing the entire component:

```tsx
<Stepper
  onComplete={handleComplete}
  markers={{ completed: "[X]", current: "[>]", pending: "[ ]" }}
>
  ...
</Stepper>
```

Default markers: `✓` (completed), `●` (current), `○` (pending)

### Custom Renderer

Full control over progress bar rendering:

```tsx
<Stepper
  onComplete={handleComplete}
  renderProgress={({ currentStep, steps }) => (
    <Text>
      Step {currentStep + 1} of {steps.length}: {steps[currentStep].name}
    </Text>
  )}
>
  ...
</Stepper>
```

## Advanced: useStepperContext

For advanced use cases, access the full stepper context:

```tsx
import { useStepperContext } from "ink-stepper";

function CustomStepContent() {
  const { stepContext, currentStepId } = useStepperContext();

  return (
    <Box>
      <Text>Step {stepContext.currentStep + 1}</Text>
      <Button onPress={stepContext.goNext}>Next</Button>
    </Box>
  );
}
```

## Exports

```tsx
// Components
export { Stepper, Step } from "ink-stepper";

// Hooks
export { useStepperContext, useStepperInput } from "ink-stepper";

// Types
export type {
  StepperProps,
  StepProps,
  StepContext,
  ProgressContext,
  StepperMarkers,
  StepperContextValue,
  RegisteredStep,
  UseStepperInputReturn,
} from "ink-stepper";
```

## License

MIT
