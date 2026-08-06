# Getting Started

`ink-stepper` is a component for building interactive step-by-step wizard flows in [Ink](https://github.com/vadimdemedes/ink) applications. It handles navigation state, input coordination, and validation so you can focus on building your CLI steps.

## Installation

### Requirements

`ink-stepper` declares its runtime as peer dependencies, so install them alongside it:

- `ink` — `^6.6.0 || ^7.0.0`
- `react` — `^19.2.3`

Installing from JSR effectively requires Ink 7: the JSR package pins `npm:ink@^7.0.0` in its import map.

### [NPM](https://www.npmjs.com/package/ink-stepper)

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

```bash [deno]
deno add npm:ink-stepper
```

:::

### [JSR](https://jsr.io/@archcorsair/ink-stepper)

::: code-group

```bash [npm]
npx jsr add @archcorsair/ink-stepper
```

```bash [pnpm]
pnpm i jsr:@archcorsair/ink-stepper
```

```bash [yarn]
yarn add jsr:@archcorsair/ink-stepper
```

```bash [bun]
bunx jsr add @archcorsair/ink-stepper
```

```bash [deno]
deno add jsr:@archcorsair/ink-stepper
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

Save it as `app.tsx` and run it with `bun app.tsx` (or `npx tsx app.tsx`) to see an interactive wizard in your terminal — both handle ESM and TSX without extra configuration.

## Try the Example

The repository ships a runnable wizard that exercises the full API — render-function steps, an input
coordinated with `useStepperInput`, async validation with error handling, a conditional step, and a
`goTo` jump, with every lifecycle callback logged as it fires:

```bash
git clone https://github.com/archcorsair/ink-stepper
cd ink-stepper && bun install
bun run example

# start on a specific step
INITIAL_STEP=2 bun run example
```

The source lives in [`examples/wizard.tsx`](https://github.com/archcorsair/ink-stepper/blob/main/examples/wizard.tsx).

## Docs for LLMs

This site publishes itself in LLM-friendly plain text: [`/llms.txt`](https://archcorsair.github.io/ink-stepper/llms.txt) for the index and [`/llms-full.txt`](https://archcorsair.github.io/ink-stepper/llms-full.txt) for every page in one file.
