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
| `keyboardNav` | `boolean` | `true` | Enable Enter/Escape navigation |
| `showProgress` | `boolean` | `true` | Show the progress bar |
| `renderProgress` | `(ctx: ProgressContext) => ReactNode` | - | Custom progress bar renderer |
| `markers` | `StepperMarkers` | - | Custom progress bar markers |

### `<Step>`

Marker component for defining individual steps.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | required | Display name in progress bar |
| `canProceed` | `boolean` | `true` | Whether navigation to next step is allowed |
| `children` | `ReactNode \| (ctx: StepContext) => ReactNode` | required | Step content |

### StepContext

Context passed to step content when using the render function pattern:

```tsx
interface StepContext {
  goNext: () => void;      // Navigate to next step (respects canProceed)
  goBack: () => void;      // Navigate to previous step
  goTo: (step: number) => void;  // Jump to specific step (zero-based)
  cancel: () => void;      // Cancel the wizard
  currentStep: number;     // Current step index (zero-based)
  totalSteps: number;      // Total number of steps
  isFirst: boolean;        // Whether this is the first step
  isLast: boolean;         // Whether this is the last step
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

## Conditional Steps

Steps can be conditionally rendered:

```tsx
<Stepper onComplete={handleComplete}>
  <Step name="Intro">
    <IntroScreen />
  </Step>
  {showAdvancedOptions && (
    <Step name="Advanced">
      <AdvancedOptions />
    </Step>
  )}
  <Step name="Finish">
    <FinishScreen />
  </Step>
</Stepper>
```

## Validation

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

When `canProceed` is `false`, `goNext()` and Enter key will not advance.

## License

MIT
