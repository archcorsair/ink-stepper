# Getting Started

`ink-stepper` is a component for building interactive step-by-step wizard flows in [Ink](https://github.com/vadimdemedes/ink) applications. It handles navigation state, input coordination, and validation so you can focus on building your CLI steps.

## Installation

Install the package using your preferred package manager:

::: code-group

```bash [npm]
npm install ink-stepper
```

```bash [pnpm]
pnpm add ink-stepper
```

```bash [yarn]
yarn add ink-stepper
```

```bash [bun]
bun add ink-stepper
```

:::

## Quick Start

Here is a minimal example of a stepper with three steps:

```tsx
import React from 'react';
import { render, Text } from 'ink';
import { Stepper, Step } from 'ink-stepper';

function App() {
  return (
    <Stepper
      onComplete={() => console.log('All done!')}
      onCancel={() => console.log('Cancelled.')}
    >
      <Step name="Welcome">
        <Text>Welcome to the wizard! Press Enter to continue.</Text>
      </Step>

      <Step name="Info">
        <Text>This is step 2.</Text>
      </Step>

      <Step name="Finish">
        <Text>Ready to submit? Press Enter to finish.</Text>
      </Step>
    </Stepper>
  );
}

render(<App />);
```

Run this with `ts-node` (or `bun`) to see an interactive wizard in your terminal.
