#!/usr/bin/env bun
/**
 * Runnable ink-stepper demo / manual smoke test.
 *
 *   bun examples/wizard.tsx
 *   INITIAL_STEP=2 bun examples/wizard.tsx
 *
 * It imports from `../src` on purpose, so it always exercises the working tree rather than a
 * previously built `dist`. Every step demonstrates one feature of the library:
 *
 *   Welcome   - plain (non render-function) step content
 *   Name      - a hand-rolled text input coordinated through `useStepperInput`
 *   Validate  - async `canProceed` with `isValidating`, plus an `onError` path that must not crash
 *   Extra     - a conditional step that must appear in TREE position when toggled on
 *   Review    - `goTo` jump back to the first step, then `onComplete`
 *
 * Every lifecycle callback appends to the event log rendered under the wizard, which makes the
 * ordering of onExitStep -> onStepChange -> onEnterStep observable.
 */
import { Box, render, Text, useApp, useInput } from "ink";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Step, type StepContext, Stepper, useStepperInput } from "../src";

const VALIDATION_DELAY_MS = 800;
const MAX_LOG_ENTRIES = 4;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Printable characters only - drops control bytes so escape sequences never land in the value. */
function printableOnly(input: string): string {
  return [...input]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f;
    })
    .join("");
}

interface LogEntry {
  id: number;
  text: string;
}

/** Shared chrome so every step prints the active step name + index in a greppable form. */
function StepFrame({
  title,
  ctx,
  children,
}: {
  title: string;
  ctx: StepContext;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Text bold color="cyan">
        Active: {title} ({ctx.currentStep + 1}/{ctx.totalSteps})
      </Text>
      {children}
    </Box>
  );
}

interface NameStepProps {
  value: string;
  focused: boolean;
  onChange: (next: string) => void;
  onFocusChange: (focused: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
}

/**
 * Minimal text input, deliberately dependency-free.
 *
 * It takes focus on mount and calls `disableNavigation()` so the Stepper stops treating Enter and
 * Escape as navigation. Note the ordering in the Enter branch: `enableNavigation()` has to run
 * BEFORE `onSubmit()`, because `goNext()` is a no-op while navigation is disabled.
 */
function NameStep({ value, focused, onChange, onFocusChange, onSubmit, onBack }: NameStepProps): React.JSX.Element {
  const { disableNavigation, enableNavigation } = useStepperInput();

  useEffect(() => {
    disableNavigation();
    onFocusChange(true);
    return () => {
      enableNavigation();
      onFocusChange(false);
    };
  }, [disableNavigation, enableNavigation, onFocusChange]);

  useInput(
    (input, key) => {
      if (key.return) {
        enableNavigation();
        onFocusChange(false);
        onSubmit();
        return;
      }
      if (key.escape) {
        enableNavigation();
        onFocusChange(false);
        onBack();
        return;
      }
      if (key.backspace || key.delete) {
        onChange(value.slice(0, -1));
        return;
      }
      if (key.ctrl || key.meta || key.tab) return;

      const text = printableOnly(input);
      if (text.length > 0) onChange(value + text);
    },
    { isActive: focused },
  );

  return (
    <Box flexDirection="column">
      <Text>What is your name?</Text>
      <Text color="green">
        {"> "}
        {value}
        {focused ? "_" : ""}
      </Text>
      <Text dimColor>
        {focused
          ? "typing - stepper navigation is disabled (Enter submits, Escape goes back)"
          : "input released - stepper navigation is active again"}
      </Text>
    </Box>
  );
}

interface ValidateStepProps {
  ctx: StepContext;
  failNext: boolean;
  onToggleFail: () => void;
}

function ValidateStep({ ctx, failNext, onToggleFail }: ValidateStepProps): React.JSX.Element {
  useInput((input) => {
    if (input === "e") onToggleFail();
  });

  return (
    <Box flexDirection="column">
      <Text>Enter runs an async canProceed ({VALIDATION_DELAY_MS}ms fake server round-trip).</Text>
      <Text dimColor>Press "e" to arm a throwing validator - onError logs it and the app keeps running.</Text>
      <Text color={failNext ? "red" : "gray"}>error mode: {failNext ? "ARMED (next check throws)" : "off"}</Text>
      {ctx.isValidating ? <Text color="yellow">* validating...</Text> : <Text dimColor>idle</Text>}
    </Box>
  );
}

interface ReviewStepProps {
  ctx: StepContext;
  name: string;
  extraEnabled: boolean;
}

function ReviewStep({ ctx, name, extraEnabled }: ReviewStepProps): React.JSX.Element {
  useInput((input) => {
    if (input === "1") ctx.goTo(0);
  });

  return (
    <Box flexDirection="column">
      <Text>Collected so far:</Text>
      <Text> name: {name || "(empty)"}</Text>
      <Text> extra step: {extraEnabled ? "on" : "off"}</Text>
      <Text dimColor>Press "1" to goTo(0) (raw jump, skips canProceed). Enter completes the wizard.</Text>
    </Box>
  );
}

function parseInitialStep(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function App(): React.JSX.Element {
  const { exit } = useApp();
  const [name, setName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [failNext, setFailNext] = useState(false);
  const [events, setEvents] = useState<LogEntry[]>([]);
  const nextEventId = useRef(0);

  const log = useCallback((text: string) => {
    const id = nextEventId.current++;
    setEvents((prev) => [...prev, { id, text }].slice(-MAX_LOG_ENTRIES));
  }, []);

  const finish = useCallback(
    (line: string) => {
      exit();
      // Write after ink unmounted, so the summary is not overwritten by the final frame.
      setTimeout(() => {
        process.stdout.write(`${line}\n`);
        process.exit(0);
      }, 20);
    },
    [exit],
  );

  // Global keys. Held off while the Name input has focus so "t"/"q" can be typed into it.
  useInput(
    (input) => {
      if (input === "t") setShowExtra((prev) => !prev);
      if (input === "q") finish("WIZARD QUIT (q)");
    },
    { isActive: !isTyping },
  );

  const validateOnServer = useCallback(async () => {
    await sleep(VALIDATION_DELAY_MS);
    if (failNext) {
      setFailNext(false);
      throw new Error("server said no (simulated)");
    }
    return true;
  }, [failNext]);

  return (
    <Box flexDirection="column">
      <Stepper
        onComplete={() => finish(`WIZARD COMPLETE name=${name || "(empty)"} extra=${showExtra ? "on" : "off"}`)}
        onCancel={() => finish("WIZARD CANCELLED")}
        onStepChange={(step) => log(`change -> ${step}`)}
        onEnterStep={(step) => log(`enter  ${step}`)}
        onExitStep={(step) => {
          log(`exit   ${step}`);
          return true;
        }}
        onError={(error) => log(`error: ${error instanceof Error ? error.message : String(error)}`)}
        initialStep={parseInitialStep(process.env.INITIAL_STEP)}
        markers={{ completed: "[x]", current: "[>]", pending: "[ ]" }}
      >
        <Step name="Welcome">
          {(ctx) => (
            <StepFrame title="Welcome" ctx={ctx}>
              <Text>ink-stepper demo wizard.</Text>
              <Text dimColor>Enter = next, Escape = back (cancels on the first step)</Text>
              <Text dimColor>"t" = toggle the conditional Extra step, "q" = quit</Text>
              <Text dimColor>"e" (on Validate) = make the next async check throw</Text>
              <Text dimColor>"1" (on Review) = goTo(0)</Text>
              <Text dimColor>INITIAL_STEP=&lt;n&gt; starts the wizard on step n</Text>
            </StepFrame>
          )}
        </Step>

        <Step name="Name" canProceed={name.trim().length > 0}>
          {(ctx) => (
            <StepFrame title="Name" ctx={ctx}>
              <NameStep
                value={name}
                focused={isTyping}
                onChange={setName}
                onFocusChange={setIsTyping}
                onSubmit={ctx.goNext}
                onBack={ctx.goBack}
              />
            </StepFrame>
          )}
        </Step>

        <Step name="Validate" canProceed={validateOnServer}>
          {(ctx) => (
            <StepFrame title="Validate" ctx={ctx}>
              <ValidateStep ctx={ctx} failNext={failNext} onToggleFail={() => setFailNext((prev) => !prev)} />
            </StepFrame>
          )}
        </Step>

        {showExtra && (
          <Step name="Extra">
            {(ctx) => (
              <StepFrame title="Extra" ctx={ctx}>
                <Text>Conditional step, mounted after the first render.</Text>
                <Text dimColor>It sorts into tree position (4th), not to the end of the list.</Text>
              </StepFrame>
            )}
          </Step>
        )}

        <Step name="Review">
          {(ctx) => (
            <StepFrame title="Review" ctx={ctx}>
              <ReviewStep ctx={ctx} name={name} extraEnabled={showExtra} />
            </StepFrame>
          )}
        </Step>
      </Stepper>

      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>events (oldest first, last {MAX_LOG_ENTRIES})</Text>
        {events.length === 0 ? (
          <Text dimColor> (none yet)</Text>
        ) : (
          events.map((entry) => (
            <Text key={entry.id} color="magenta">
              {" "}
              {entry.text}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
}

render(<App />);
