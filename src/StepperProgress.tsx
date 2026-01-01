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
            <Fragment key={step.name}>
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
          // Calculate width: marker width + segment width (if not first)
          const width = isFirst ? markers.completed.length : SEGMENT_WIDTH + markers.completed.length;

          return (
            <Box key={step.name} width={width} justifyContent="center">
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
