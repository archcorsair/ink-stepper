#!/usr/bin/env bun
/**
 * Recording showcase for the README hero GIF (docs/tapes/wizard.tape).
 *
 *   bun examples/demo.tsx
 *
 * A fictional "orbit" project-setup wizard styled like a shippable product. Layout is
 * budgeted for the recording terminal: every line stays within 62 columns (the tape
 * records at FontSize 15 / Width 720px, about 64 columns). Generated values come from a
 * seeded PRNG so recordings are reproducible byte for byte.
 *
 * The progress bar is a custom `renderProgress` renderer with fixed geometry (equal-width
 * marker cells, 16-column segments) so the bar spans the card width and never changes
 * length as steps complete; it re-implements the brightness pulse for the current marker.
 *
 * For the interactive kitchen-sink demo of every library feature, see wizard.tsx.
 */
import { Box, render, Text, useApp, useInput } from "ink";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type ProgressContext, Step, type StepContext, Stepper, useStepperInput } from "../src";

const WIDTH = 62;
const VALIDATE_MS = 700;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Seeded PRNG (mulberry32) - recordings must be reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);
const PROJECT_ID = `proj_${Array.from({ length: 6 }, () => "0123456789abcdef"[Math.floor(rand() * 16)]).join("")}`;

const STACKS = ["Bun + Ink", "Node + Ink", "Deno + Ink"];

function printableOnly(input: string): string {
  return [...input]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f;
    })
    .join("");
}

// ---------------------------------------------------------------------------
// Chrome
// ---------------------------------------------------------------------------

function Header(): React.JSX.Element {
  return (
    <Box width={WIDTH} justifyContent="space-between">
      <Box>
        <Text bold color="black" backgroundColor="cyan">
          {" orbit "}
        </Text>
        <Text dimColor> project setup</Text>
      </Box>
      <Text dimColor>v1.4.2</Text>
    </Box>
  );
}

function Card({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Box width={WIDTH} flexDirection="column" borderStyle="round" borderColor="gray" paddingX={2} paddingY={1}>
      {children}
    </Box>
  );
}

function Footer({ left, step }: { left: string; step: string }): React.JSX.Element {
  return (
    <Box width={WIDTH} justifyContent="space-between" marginTop={1}>
      <Text dimColor>{left}</Text>
      <Text dimColor>{step}</Text>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Field: always-focused single-line input
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  busy: boolean;
  error: string | null;
  onEdit: (updater: (prev: string) => string) => void;
  onSubmit: () => void;
}

/**
 * Holds keyboard focus for the whole step (navigation stays disabled), and hands
 * Enter to the stepper by re-enabling navigation just for the goNext call.
 */
function Field({ label, value, placeholder, busy, error, onEdit, onSubmit }: FieldProps): React.JSX.Element {
  useInput((input, key) => {
    if (busy) return;
    if (key.return) {
      onSubmit();
      return;
    }
    if (key.backspace || key.delete) {
      // Functional update: never loses keystrokes to a stale closure.
      onEdit((prev) => prev.slice(0, -1));
      return;
    }
    if (key.ctrl || key.meta || key.tab || key.escape) return;
    const text = printableOnly(input);
    if (text.length > 0) onEdit((prev) => prev + text);
  });

  return (
    <Box flexDirection="column">
      <Text>{label}</Text>
      <Box marginTop={1}>
        <Text color="cyan" bold>
          {"❯ "}
        </Text>
        {value ? <Text>{value}</Text> : <Text dimColor>{placeholder}</Text>}
        {!busy && <Text color="cyan">▌</Text>}
      </Box>
      <Box marginTop={1}>
        {busy ? (
          <Text color="yellow">◐ checking…</Text>
        ) : error ? (
          <Text color="red" bold>
            ✗ {error}
          </Text>
        ) : (
          <Text dimColor> </Text>
        )}
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Fixed-geometry progress bar (renderProgress)
// ---------------------------------------------------------------------------

const MARKER_W = 3; // every marker cell renders exactly this wide
const SEGMENT_W = 16;
const STRIDE = MARKER_W + SEGMENT_W;

const PULSE_COLORS: ReadonlyArray<{ color: string; dim: boolean }> = [
  { color: "cyanBright", dim: false },
  { color: "cyan", dim: false },
  { color: "cyan", dim: true },
  { color: "cyan", dim: false },
];

function usePulseColor(): { color: string; dim: boolean } {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % PULSE_COLORS.length), 280);
    return () => clearInterval(id);
  }, []);
  return PULSE_COLORS[phase % PULSE_COLORS.length] ?? { color: "cyan", dim: false };
}

/**
 * Bar geometry is constant: N equal-width marker cells joined by fixed segments,
 * so completing a step recolors the bar without ever changing its length.
 */
function DemoProgress({ steps }: Pick<ProgressContext, "steps">): React.JSX.Element {
  const pulse = usePulseColor();

  const markerCell = (step: ProgressContext["steps"][number]): React.JSX.Element => {
    if (step.completed) {
      return (
        <Text key={step.id} color="green">
          {" ✓ "}
        </Text>
      );
    }
    if (step.current) {
      return (
        <Text key={step.id} color={pulse.color} bold dimColor={pulse.dim}>
          {" ● "}
        </Text>
      );
    }
    return (
      <Text key={step.id} color="white">
        {" ○ "}
      </Text>
    );
  };

  // Label row: each name centered under its marker cell, clamped into the row.
  const rowWidth = steps.length * STRIDE - SEGMENT_W;
  const labels: React.JSX.Element[] = [];
  let cursor = 0;
  steps.forEach((step, i) => {
    const center = i * STRIDE + MARKER_W / 2;
    const start = Math.max(cursor, Math.min(Math.round(center - step.name.length / 2), rowWidth - step.name.length));
    labels.push(
      <Text key={step.id}>
        {" ".repeat(start - cursor)}
        <Text color={step.completed ? "green" : step.current ? "cyan" : "white"} bold={step.current}>
          {step.name}
        </Text>
      </Text>,
    );
    cursor = start + step.name.length;
  });

  return (
    <Box flexDirection="column" marginBottom={1} marginLeft={1}>
      <Box>
        {steps.map((step, i) => (
          <Text key={step.id}>
            {i > 0 && <Text color={step.completed ? "green" : "gray"}>{"━".repeat(SEGMENT_W)}</Text>}
            {markerCell(step)}
          </Text>
        ))}
      </Box>
      <Box>{labels}</Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

function App(): React.JSX.Element {
  const { exit } = useApp();
  const [projectName, setProjectName] = useState("");
  const [stackIndex, setStackIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const emailRef = useRef(email);
  emailRef.current = email;

  useInput(
    (input) => {
      if (input === "q") {
        exit();
        setTimeout(() => process.exit(0), 20);
      }
    },
    { isActive: done },
  );

  const validateEmail = useCallback(async () => {
    await sleep(VALIDATE_MS);
    const ok = /^[^@\s]+@[a-z0-9-]+\.[a-z]{2,}$/i.test(emailRef.current);
    setEmailError(ok ? null : "use your work email (name@sable.dev)");
    return ok;
  }, []);

  if (done) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Header />
        <Box marginTop={1}>
          <DemoProgress
            steps={["Project", "Stack", "Team", "Review"].map((name) => ({
              id: name,
              name,
              completed: true,
              current: false,
            }))}
          />
        </Box>
        <Card>
          <Box>
            <Text bold color="black" backgroundColor="green">
              {" ✓ ready "}
            </Text>
            <Text bold> {projectName} created</Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text dimColor>{"id      "}</Text>
              {PROJECT_ID}
            </Text>
            <Text>
              <Text dimColor>{"stack   "}</Text>
              {STACKS[stackIndex]}
            </Text>
            <Text>
              <Text dimColor>{"team    "}</Text>
              {email}
            </Text>
          </Box>
        </Card>
        <Footer left="q quit" step="done" />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Header />
      <Box marginTop={1} flexDirection="column">
        <Stepper
          onComplete={() => setDone(true)}
          onCancel={() => exit()}
          renderProgress={({ steps }) => <DemoProgress steps={steps} />}
        >
          <Step name="Project" canProceed={projectName.trim().length > 0}>
            {(ctx) => (
              <ProjectStep
                ctx={ctx}
                value={projectName}
                onEdit={setProjectName}
                footer={<Footer left="type a name · ↵ continue" step={stepLabel(ctx)} />}
              />
            )}
          </Step>

          <Step name="Stack">
            {(ctx) => (
              <Box flexDirection="column">
                <Card>
                  <Text>Choose a stack</Text>
                  <Box marginTop={1} flexDirection="column">
                    <StackPicker index={stackIndex} onChange={setStackIndex} />
                  </Box>
                </Card>
                <Footer left="↑↓ select · ↵ continue · ⎋ back" step={stepLabel(ctx)} />
              </Box>
            )}
          </Step>

          <Step name="Team" canProceed={validateEmail}>
            {(ctx) => (
              <TeamStep
                ctx={ctx}
                value={email}
                error={emailError}
                onEdit={(updater) => {
                  setEmail(updater);
                  setEmailError(null);
                }}
                footer={<Footer left="invite a teammate · ↵ continue" step={stepLabel(ctx)} />}
              />
            )}
          </Step>

          <Step name="Review">
            {(ctx) => (
              <Box flexDirection="column">
                <Card>
                  <Text>Everything look right?</Text>
                  <Box marginTop={1} flexDirection="column">
                    <Text>
                      <Text dimColor>{"project "}</Text>
                      {projectName}
                    </Text>
                    <Text>
                      <Text dimColor>{"stack   "}</Text>
                      {STACKS[stackIndex]}
                    </Text>
                    <Text>
                      <Text dimColor>{"team    "}</Text>
                      {email}
                    </Text>
                  </Box>
                </Card>
                <Footer left="↵ create project · ⎋ back" step={stepLabel(ctx)} />
              </Box>
            )}
          </Step>
        </Stepper>
      </Box>
    </Box>
  );
}

function stepLabel(ctx: StepContext): string {
  return `step ${ctx.currentStep + 1} of ${ctx.totalSteps}`;
}

function StackPicker({ index, onChange }: { index: number; onChange: (next: number) => void }): React.JSX.Element {
  useInput((_input, key) => {
    if (key.downArrow) onChange(Math.min(index + 1, STACKS.length - 1));
    if (key.upArrow) onChange(Math.max(index - 1, 0));
  });

  return (
    <>
      {STACKS.map((stack, i) => (
        <Text key={stack} color={i === index ? "cyan" : undefined} dimColor={i !== index} bold={i === index}>
          {i === index ? "❯ " : "  "}
          {stack}
        </Text>
      ))}
    </>
  );
}

interface InputStepProps {
  ctx: StepContext;
  value: string;
  onEdit: (updater: (prev: string) => string) => void;
  footer: React.ReactNode;
  error?: string | null;
}

/** Text-input step: keeps focus via useStepperInput, hands Enter to goNext. */
function useFieldSubmit(ctx: StepContext): () => void {
  const { disableNavigation, enableNavigation } = useStepperInput();

  // Keep stepper keys off while the field owns the keyboard; release on unmount.
  useEffect(() => {
    disableNavigation();
    return () => {
      enableNavigation();
    };
  }, [disableNavigation, enableNavigation]);

  return () => {
    // goNext's guard reads synchronously, so enable -> call -> re-disable is race-free.
    enableNavigation();
    ctx.goNext();
    disableNavigation();
  };
}

function ProjectStep({ ctx, value, onEdit, footer }: InputStepProps): React.JSX.Element {
  const submit = useFieldSubmit(ctx);
  return (
    <Box flexDirection="column">
      <Card>
        <Field
          label="Name your project"
          value={value}
          placeholder="my-project"
          busy={false}
          error={null}
          onEdit={onEdit}
          onSubmit={submit}
        />
      </Card>
      {footer}
    </Box>
  );
}

function TeamStep({ ctx, value, error, onEdit, footer }: InputStepProps): React.JSX.Element {
  const submit = useFieldSubmit(ctx);
  return (
    <Box flexDirection="column">
      <Card>
        <Field
          label="Team email"
          value={value}
          placeholder="you@company.dev"
          busy={ctx.isValidating}
          error={error ?? null}
          onEdit={onEdit}
          onSubmit={submit}
        />
      </Card>
      {footer}
    </Box>
  );
}

render(<App />);
