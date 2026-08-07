import { Box, Text } from "ink";
import { Fragment, useEffect, useState } from "react";
import type { ProgressContext, StepperMarkers } from "./types";

const DEFAULT_MARKERS: Required<StepperMarkers> = {
  completed: " ✓ ",
  current: "●",
  pending: "○",
};

const SEGMENT_WIDTH = 6;

// Brightness staircase for the current marker when `pulse` is on: bright →
// normal → dim → normal, then loop. Terminals expose exactly these three
// intensity levels (SGR bold/normal/dim), so this is the whole palette.
const PULSE_FRAMES: ReadonlyArray<{ color: string; dim: boolean }> = [
  { color: "cyanBright", dim: false },
  { color: "cyan", dim: false },
  { color: "cyan", dim: true },
  { color: "cyan", dim: false },
];
const PULSE_INTERVAL_MS = 280;

/** Cycles through pulse frames on an interval while enabled; parks on frame 0 otherwise. */
function usePulseFrame(enabled: boolean): { color: string; dim: boolean } {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      setFrame((prev) => (prev + 1) % PULSE_FRAMES.length);
    }, PULSE_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, [enabled]);

  const frameConfig = PULSE_FRAMES[frame % PULSE_FRAMES.length];
  return frameConfig ?? { color: "cyan", dim: false };
}

interface StepperProgressProps extends ProgressContext {
  markers?: StepperMarkers;
  /** Pulse the current marker's brightness (see StepperProps.pulse) */
  pulse?: boolean;
}

/**
 * Default progress bar component for the Stepper.
 *
 * Displays a visual progress indicator with step markers and labels:
 * ```
 * ━━━━ ✓ ━━━━━●━━━━━○━━━━━○━━━━
 *    Theme  Directory  Import  Review
 * ```
 */
export function StepperProgress({
  steps,
  markers: customMarkers,
  pulse = false,
}: StepperProgressProps): React.JSX.Element {
  const markers = { ...DEFAULT_MARKERS, ...customMarkers };
  const pulseFrame = usePulseFrame(pulse);

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Progress line with markers */}
      <Box>
        {steps.map((step, idx) => {
          const isFirst = idx === 0;
          const marker = step.completed ? markers.completed : step.current ? markers.current : markers.pending;

          const lineColor = step.completed ? "green" : "gray";
          const markerColor = step.completed ? "green" : step.current ? (pulse ? pulseFrame.color : "cyan") : "gray";
          const markerDim = step.current && pulse ? pulseFrame.dim : false;

          return (
            <Fragment key={step.id}>
              {/* Leading segment (except for first step) */}
              {!isFirst && <Text color={lineColor}>{"━".repeat(SEGMENT_WIDTH)}</Text>}
              {/* Marker */}
              <Text color={markerColor} bold={step.current} dimColor={markerDim}>
                {marker}
              </Text>
            </Fragment>
          );
        })}
      </Box>

      {/* Labels row */}
      <Box>
        {steps.map((step, idx) => {
          const isFirst = idx === 0;
          // Mirror the marker actually rendered above, since markers can differ in width per
          // state (the defaults are " ✓ " = 3 wide vs ● / ○ = 1). Using a shared width here
          // makes the label row drift away from the marker row as steps complete.
          // minWidth (not width) so a label longer than its column overflows instead of wrapping.
          const marker = step.completed ? markers.completed : step.current ? markers.current : markers.pending;
          const width = isFirst ? marker.length : SEGMENT_WIDTH + marker.length;

          return (
            <Box key={step.id} minWidth={width} flexShrink={0} justifyContent="center">
              <Text
                color={step.completed ? "green" : step.current ? "cyan" : "gray"}
                bold={step.current}
                dimColor={!step.completed && !step.current}
              >
                {step.name}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
