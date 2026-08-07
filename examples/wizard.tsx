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
 *   Welcome   - keyboard navigation, the pulsing current marker (`pulse`)
 *   Name      - a hand-rolled text input coordinated through `useStepperInput`
 *   Validate  - async `canProceed` with `isValidating`, plus an `onError` path that must not crash
 *   Extra     - a conditional step ("t") that must appear in TREE position when toggled on
 *   Review    - `goTo` jump back to the first step, then `onComplete`
 *
 * Global keys: "t" toggles the conditional Extra step, "m" cycles marker themes (the `markers`
 * prop), "q" quits. Each step's key bar shows only the keys that work right now. Lifecycle
 * callbacks append to the log under the wizard, so onExitStep -> onStepChange -> onEnterStep
 * ordering is observable.
 */
import { Box, render, Text, useApp, useInput } from "ink";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Step, type StepContext, Stepper, type StepperMarkers, useStepperInput } from "../src";

const VALIDATION_DELAY_MS = 800;
const MAX_LOG_ENTRIES = 3;

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

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------

interface KeyHint {
  cap: string;
  label: string;
}

/** Keycap-styled hint row: only the keys that do something on the current step. */
function KeyBar({ hints }: { hints: KeyHint[] }): React.JSX.Element {
  return (
    <Box marginTop={1}>
      {hints.map((hint) => (
        <Box key={hint.cap} marginRight={2}>
          <Text bold color="black" backgroundColor="cyan">
            {` ${hint.cap} `}
          </Text>
          <Text dimColor> {hint.label}</Text>
        </Box>
      ))}
    </Box>
  );
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧"];

/** Braille spinner - the classic frame-swapping terminal animation. */
function Spinner({ color }: { color?: string }): React.JSX.Element {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 120);
    return () => {
      clearInterval(id);
    };
  }, []);

  return <Text color={color}>{SPINNER_FRAMES[frame]}</Text>;
}

interface StepFrameProps {
  title: string;
  ctx: StepContext;
  hints: KeyHint[];
  children: React.ReactNode;
}

/** Shared chrome: bordered step card with a title line and a per-step key bar. */
function StepFrame({ title, ctx, hints, children }: StepFrameProps): React.JSX.Element {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          {title}
        </Text>
        <Text dimColor>
          {"  ·  "}step {ctx.currentStep + 1} of {ctx.totalSteps}
        </Text>
      </Box>
      {children}
      <KeyBar hints={hints} />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

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
      <Text>What should we call you?</Text>
      <Box marginTop={1}>
        <Text color="cyan" bold>
          {"❯ "}
        </Text>
        <Text>{value}</Text>
        {focused && <Text color="cyan">▌</Text>}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          {focused
            ? "input has the keyboard - stepper navigation is paused (useStepperInput)"
            : "input released - stepper navigation is active again"}
        </Text>
      </Box>
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
      <Text>
        Enter runs an async <Text color="cyan">canProceed()</Text> ({VALIDATION_DELAY_MS}ms fake server round-trip).
      </Text>
      <Box marginTop={1}>
        {ctx.isValidating ? (
          <Text color="yellow">
            <Spinner color="yellow" /> validating - navigation is locked
          </Text>
        ) : failNext ? (
          <Text color="red">⚠ error armed - the next check throws (onError catches it)</Text>
        ) : (
          <Text dimColor>○ idle - press Enter to validate</Text>
        )}
      </Box>
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
      <Text>Everything the wizard collected:</Text>
      <Box marginTop={1} flexDirection="column">
        <Text>
          <Text dimColor>{"name        "}</Text>
          {name ? <Text color="green">{name}</Text> : <Text dimColor>(empty)</Text>}
        </Text>
        <Text>
          <Text dimColor>{"extra step  "}</Text>
          {extraEnabled ? <Text color="green">on</Text> : <Text dimColor>off</Text>}
        </Text>
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// App shell
// ---------------------------------------------------------------------------

type EventKind = "change" | "enter" | "exit" | "error";

interface LogEntry {
  id: number;
  kind: EventKind;
  text: string;
}

const EVENT_COLORS: Record<EventKind, string> = {
  change: "cyan",
  enter: "green",
  exit: "yellow",
  error: "red",
};

/** Marker themes cycled with "m" - `undefined` means the library defaults ( ✓ / ● / ○ ). */
const MARKER_THEMES: ReadonlyArray<{ name: string; markers: StepperMarkers | undefined }> = [
  { name: "default", markers: undefined },
  { name: "ascii", markers: { completed: "[x]", current: "[>]", pending: "[ ]" } },
  { name: "squares", markers: { completed: " ■ ", current: "▣", pending: "□" } },
];

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
  const [markerTheme, setMarkerTheme] = useState(0);
  const [events, setEvents] = useState<LogEntry[]>([]);
  const nextEventId = useRef(0);

  const log = useCallback((kind: EventKind, text: string) => {
    const id = nextEventId.current++;
    setEvents((prev) => [...prev, { id, kind, text }].slice(-MAX_LOG_ENTRIES));
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

  // Global keys. Held off while the Name input has focus so "t"/"m"/"q" can be typed into it.
  useInput(
    (input) => {
      if (input === "t") setShowExtra((prev) => !prev);
      if (input === "m") setMarkerTheme((prev) => (prev + 1) % MARKER_THEMES.length);
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

  const theme = MARKER_THEMES[markerTheme] ?? MARKER_THEMES[0];

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Stepper
        onComplete={() => finish(`WIZARD COMPLETE name=${name || "(empty)"} extra=${showExtra ? "on" : "off"}`)}
        onCancel={() => finish("WIZARD CANCELLED")}
        onStepChange={(step) => log("change", `onStepChange(${step})`)}
        onEnterStep={(step) => log("enter", `onEnterStep(${step})`)}
        onExitStep={(step) => {
          log("exit", `onExitStep(${step})`);
          return true;
        }}
        onError={(error) => log("error", `onError: ${error instanceof Error ? error.message : String(error)}`)}
        initialStep={parseInitialStep(process.env.INITIAL_STEP)}
        markers={theme?.markers}
        pulse
      >
        <Step name="Welcome">
          {(ctx) => (
            <StepFrame
              title="Welcome"
              ctx={ctx}
              hints={[
                { cap: "↵", label: "start" },
                { cap: "⎋", label: "cancel" },
              ]}
            >
              <Text>
                Step-by-step wizards for <Text color="cyan">Ink</Text> terminal apps.
              </Text>
              <Box marginTop={1}>
                <Text dimColor>Watch the current marker pulse above - that's the `pulse` prop.</Text>
              </Box>
            </StepFrame>
          )}
        </Step>

        <Step name="Name" canProceed={name.trim().length > 0}>
          {(ctx) => (
            <StepFrame
              title="Name"
              ctx={ctx}
              hints={[
                { cap: "↵", label: "submit" },
                { cap: "⎋", label: "back" },
              ]}
            >
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
            <StepFrame
              title="Validate"
              ctx={ctx}
              hints={[
                { cap: "↵", label: "validate + next" },
                { cap: "e", label: failNext ? "disarm error" : "arm error" },
                { cap: "⎋", label: "back" },
              ]}
            >
              <ValidateStep ctx={ctx} failNext={failNext} onToggleFail={() => setFailNext((prev) => !prev)} />
            </StepFrame>
          )}
        </Step>

        {showExtra && (
          <Step name="Extra">
            {(ctx) => (
              <StepFrame
                title="Extra"
                ctx={ctx}
                hints={[
                  { cap: "↵", label: "next" },
                  { cap: "⎋", label: "back" },
                ]}
              >
                <Text>Conditional step, mounted after the first render.</Text>
                <Box marginTop={1}>
                  <Text dimColor>It sorts into tree position (before Review), not to the end of the list.</Text>
                </Box>
              </StepFrame>
            )}
          </Step>
        )}

        <Step name="Review">
          {(ctx) => (
            <StepFrame
              title="Review"
              ctx={ctx}
              hints={[
                { cap: "↵", label: "finish" },
                { cap: "1", label: "goTo(0)" },
                { cap: "⎋", label: "back" },
              ]}
            >
              <ReviewStep ctx={ctx} name={name} extraEnabled={showExtra} />
            </StepFrame>
          )}
        </Step>
      </Stepper>

      {/* App-level keys + lifecycle log */}
      <Box marginTop={1}>
        <Text dimColor>
          t extra step{showExtra ? " ✓" : ""} · m markers ({theme?.name}) · q quit
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {events.length === 0 ? (
          <Text dimColor>lifecycle · quiet so far</Text>
        ) : (
          events.map((entry) => (
            <Text key={entry.id} color={EVENT_COLORS[entry.kind]} dimColor={entry.kind !== "error"}>
              {"↳ "}
              {entry.text}
            </Text>
          ))
        )}
      </Box>
    </Box>
  );
}

render(<App />);
