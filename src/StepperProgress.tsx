import { Box, Text } from "ink";
import { Fragment } from "react";
import type { ProgressContext, StepperMarkers } from "./types";

const DEFAULT_MARKERS: Required<StepperMarkers> = {
  completed: " ✓ ",
  current: "●",
  pending: "○",
};

const SEGMENT_WIDTH = 6;

interface StepperProgressProps extends ProgressContext {
  markers?: StepperMarkers;
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
export function StepperProgress({ steps, markers: customMarkers }: StepperProgressProps): React.JSX.Element {
  const markers = { ...DEFAULT_MARKERS, ...customMarkers };

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Progress line with markers */}
      <Box>
        {steps.map((step, idx) => {
          const isFirst = idx === 0;
          const marker = step.completed ? markers.completed : step.current ? markers.current : markers.pending;

          const lineColor = step.completed ? "green" : "gray";
          const markerColor = step.completed ? "green" : step.current ? "cyan" : "gray";

          return (
            <Fragment key={step.id}>
              {/* Leading segment (except for first step) */}
              {!isFirst && <Text color={lineColor}>{"━".repeat(SEGMENT_WIDTH)}</Text>}
              {/* Marker */}
              <Text color={markerColor} bold={step.current}>
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
