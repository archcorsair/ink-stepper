# Components

## `<Stepper>`

The main container component.

### Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `onComplete` | `() => void` | **Required** | Callback fired when the user completes the final step. |
| `children` | `ReactNode` | **Required** | The step components. |
| `onCancel` | `() => void` | `undefined` | Callback fired when the user cancels (Escape on first step). |
| `onStepChange` | `(step: number) => void` | `undefined` | Callback fired when the active step index changes. |
| `onEnterStep` | `(step: number) => void` | `undefined` | Callback fired after entering a new step. |
| `onExitStep` | `(step: number) => void \| boolean \| Promise<void \| boolean>` | `undefined` | Callback fired before leaving a step. Return `false` to prevent navigation; no return value is needed otherwise. |
| `onError` | `(error: unknown) => void` | `undefined` | Called when an async `canProceed` or `onExitStep` callback throws or rejects. Navigation is blocked in that case. When omitted, the error is logged via `console.error`. |
| `step` | `number` | `undefined` | If provided, puts the stepper in controlled mode. |
| `initialStep` | `number` | `0` | Starting step index for uncontrolled mode. Ignored when `step` is provided. |
| `keyboardNav` | `boolean` | `true` | Whether to enable built-in Enter/Escape navigation. |
| `showProgress` | `boolean` | `true` | Whether to display the progress bar. |
| `renderProgress` | `(ctx: ProgressContext) => ReactNode` | `undefined` | Custom renderer for the progress bar. |
| `markers` | `StepperMarkers` | `undefined` | Custom configuration for progress bar symbols. |

---

## `<Step>`

Represents a single step in the wizard.

### Props

| Name | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Required** | The display name of the step (used in the progress bar). |
| `children` | `ReactNode \| (ctx: StepContext) => ReactNode` | **Required** | The content of the step. Can be a function to access navigation controls. |
| `canProceed` | `boolean \| (() => boolean \| Promise<boolean>)` | `true` | Whether navigation to the next step is allowed. Can be a boolean or an (async) function. |

### Example

```tsx
<Step name="Verification" canProceed={isVerified}>
  <Text>Please verify your identity.</Text>
</Step>
```

### Ordering

Steps sort by their position in the element tree, not by the time they mounted, so a conditionally rendered `<Step>` that appears later still occupies its JSX position.

::: warning
A `<Step>` must not be nested inside another `<Step>` — that breaks the tree-order guarantee. Wrapper components, fragments, and conditionals around a `<Step>` are supported.
:::
