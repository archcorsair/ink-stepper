/**
 * Shared chrome for the docs-gallery examples (recorded via docs/tapes/*.tape).
 *
 * Every gallery app records at FontSize 15 / Width 720px (~64 columns), so all
 * layout here is budgeted to a 62-column envelope. The progress bar has fixed
 * geometry: equal-width marker cells joined by segments sized from the step
 * count, so the bar spans the card width and never changes length - even when
 * a conditional step inserts itself mid-flow (the segments recompute, the
 * envelope stays put).
 */
import { Box, Text, useInput } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import { type ProgressContext, type StepContext, useStepperInput } from "../../src";

export const WIDTH = 62;

export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Seeded PRNG (mulberry32) - recordings must be reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function printableOnly(input: string): string {
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

export interface HeaderProps {
  badge: string;
  badgeColor: string;
  title: string;
  right: React.ReactNode;
}

export function Header({ badge, badgeColor, title, right }: HeaderProps): React.JSX.Element {
  return (
    <Box width={WIDTH} justifyContent="space-between">
      <Box>
        <Text bold color="black" backgroundColor={badgeColor}>
          {` ${badge} `}
        </Text>
        <Text dimColor> {title}</Text>
      </Box>
      <Text dimColor>{right}</Text>
    </Box>
  );
}

export function Card({
  children,
  borderColor = "gray",
}: {
  children: React.ReactNode;
  borderColor?: string;
}): React.JSX.Element {
  return (
    <Box width={WIDTH} flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={2} paddingY={1}>
      {children}
    </Box>
  );
}

export function Footer({ left, right }: { left: React.ReactNode; right: React.ReactNode }): React.JSX.Element {
  return (
    <Box width={WIDTH} justifyContent="space-between" marginTop={1}>
      <Text dimColor>{left}</Text>
      <Text dimColor>{right}</Text>
    </Box>
  );
}

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧"];

export function Spinner({ color }: { color?: string }): React.JSX.Element {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame((prev) => (prev + 1) % SPINNER_FRAMES.length), 120);
    return () => clearInterval(id);
  }, []);
  return <Text color={color}>{SPINNER_FRAMES[frame]}</Text>;
}

// ---------------------------------------------------------------------------
// Fixed-geometry progress bar
// ---------------------------------------------------------------------------

const MARKER_W = 3;
const BAR_SPAN = 60; // total columns the bar occupies, regardless of step count

const PULSE_COLORS: ReadonlyArray<{ color: string; dim: boolean }> = [
  { color: "cyanBright", dim: false },
  { color: "cyan", dim: false },
  { color: "cyan", dim: true },
  { color: "cyan", dim: false },
];

function usePulseColor(accent: string): { color: string; dim: boolean } {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhase((p) => (p + 1) % PULSE_COLORS.length), 280);
    return () => clearInterval(id);
  }, []);
  if (accent !== "cyan") {
    // Same staircase, arbitrary accent: bright -> normal -> dim -> normal.
    const dims = [false, false, true, false];
    return { color: phase === 0 ? `${accent}Bright` : accent, dim: dims[phase % 4] ?? false };
  }
  return PULSE_COLORS[phase % PULSE_COLORS.length] ?? { color: "cyan", dim: false };
}

export interface GalleryProgressProps {
  steps: ProgressContext["steps"];
  /** Accent for the current step (defaults to cyan) */
  accent?: string;
}

/**
 * Constant-envelope progress bar: segments are sized from the step count so the
 * bar always spans BAR_SPAN columns. Inserting or removing a step re-flows the
 * segments, not the envelope.
 */
export function GalleryProgress({ steps, accent = "cyan" }: GalleryProgressProps): React.JSX.Element {
  const pulse = usePulseColor(accent);
  const count = Math.max(steps.length, 2);
  const segmentW = Math.floor((BAR_SPAN - count * MARKER_W) / (count - 1));
  const stride = MARKER_W + segmentW;
  const rowWidth = count * stride - segmentW;

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

  const labels: React.JSX.Element[] = [];
  let cursor = 0;
  steps.forEach((step, i) => {
    const center = i * stride + MARKER_W / 2;
    const start = Math.max(cursor, Math.min(Math.round(center - step.name.length / 2), rowWidth - step.name.length));
    labels.push(
      <Text key={step.id}>
        {" ".repeat(Math.max(0, start - cursor))}
        <Text color={step.completed ? "green" : step.current ? accent : "white"} bold={step.current}>
          {step.name}
        </Text>
      </Text>,
    );
    cursor = Math.max(cursor, start) + step.name.length;
  });

  return (
    <Box flexDirection="column" marginBottom={1} marginLeft={1}>
      <Box>
        {steps.map((step, i) => (
          <Text key={step.id}>
            {i > 0 && <Text color={step.completed ? "green" : "gray"}>{"━".repeat(segmentW)}</Text>}
            {markerCell(step)}
          </Text>
        ))}
      </Box>
      <Box>{labels}</Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Typed field + submit coordination
// ---------------------------------------------------------------------------

/**
 * Field-owned keyboard: keeps stepper navigation disabled while mounted and
 * hands Enter to the stepper by re-enabling navigation just for the goNext call
 * (the navigation guard reads synchronously, so this is race-free).
 */
export function useFieldSubmit(ctx: StepContext): () => void {
  const { disableNavigation, enableNavigation } = useStepperInput();

  useEffect(() => {
    disableNavigation();
    return () => {
      enableNavigation();
    };
  }, [disableNavigation, enableNavigation]);

  return () => {
    enableNavigation();
    ctx.goNext();
    disableNavigation();
  };
}

export interface FieldProps {
  label: React.ReactNode;
  value: string;
  placeholder: string;
  accent?: string;
  busy?: boolean;
  status?: React.ReactNode;
  onEdit: (updater: (prev: string) => string) => void;
  onSubmit: () => void;
}

/** Always-focused single-line input with functional edits (stale-closure safe). */
export function Field({
  label,
  value,
  placeholder,
  accent = "cyan",
  busy = false,
  status,
  onEdit,
  onSubmit,
}: FieldProps): React.JSX.Element {
  useInput((input, key) => {
    if (busy) return;
    if (key.return) {
      onSubmit();
      return;
    }
    if (key.backspace || key.delete) {
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
        <Text color={accent} bold>
          {"\u276f "}
        </Text>
        {value ? <Text>{value}</Text> : <Text dimColor>{placeholder}</Text>}
        {!busy && <Text color={accent}>{"\u258c"}</Text>}
      </Box>
      {status !== undefined && <Box marginTop={1}>{status}</Box>}
    </Box>
  );
}
