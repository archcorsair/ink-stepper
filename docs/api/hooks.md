# Hooks

## `useStepperInput`

A hook for coordinating input focus with Stepper keyboard navigation. Use this in custom input components to prevent keyboard conflicts.

```tsx
import { useStepperInput } from 'ink-stepper';

const { disableNavigation, enableNavigation, isNavigationDisabled } = useStepperInput();
```

### Returns

| Name | Type | Description |
| :--- | :--- | :--- |
| `disableNavigation` | `() => void` | Disables global Stepper navigation (Enter/Escape). |
| `enableNavigation` | `() => void` | Re-enables global Stepper navigation. |
| `isNavigationDisabled` | `boolean` | Current status of navigation. |

While navigation is disabled, `goNext()`, `goBack()` and `goTo()` are no-ops as well — not just the Enter/Escape keys. Call `enableNavigation()` **before** navigating from a submit handler, otherwise the navigation call is silently dropped. See [Input Coordination](/guide/input-coordination#re-enable-before-navigating).

Like `useStepperContext` (which it calls internally), this hook throws if used outside a `<Stepper>`.

---

## `useStepperContext`

A hook to access the internal Stepper context. Useful for building deeply nested components that need to control the wizard.

```tsx
import { useStepperContext } from 'ink-stepper';

const { stepContext, currentStepId } = useStepperContext();
```

`stepContext` is `null` when no step is active, so guard before using it. The hook throws if called outside a `<Stepper>`.

### Returns

[`StepperContextValue`](/api/types#steppercontextvalue).
