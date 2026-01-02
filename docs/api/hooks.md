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

---

## `useStepperContext`

A hook to access the internal Stepper context. Useful for building deeply nested components that need to control the wizard.

```tsx
import { useStepperContext } from 'ink-stepper';

const { stepContext, currentStepId } = useStepperContext();
```

### Returns

`StepperContextValue` (see Types).
