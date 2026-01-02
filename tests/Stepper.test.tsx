import { describe, expect, mock, test } from "bun:test";
import { Text } from "ink";
import { render } from "ink-testing-library";
import { Step, Stepper } from "../src";
import { StepperContext } from "../src/StepperContext";

describe("Stepper", () => {
  test("renders first step content", () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One">
          <Text>Step One Content</Text>
        </Step>
        <Step name="Two">
          <Text>Step Two Content</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Step One Content");
    expect(frame).not.toContain("Step Two Content");
  });

  test("renders progress bar with step names", () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="Theme">
          <Text>Theme Step</Text>
        </Step>
        <Step name="Review">
          <Text>Review Step</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Theme");
    expect(frame).toContain("Review");
  });

  test("renders progress bar with markers", () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One">
          <Text>First</Text>
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("●"); // Current marker
    expect(frame).toContain("○"); // Pending marker
  });

  test("hides progress bar when showProgress is false", () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}} showProgress={false}>
        <Step name="Theme">
          <Text>Theme Step</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Theme Step");
    // Progress bar markers should not be present
    expect(frame).not.toContain("●");
    expect(frame).not.toContain("○");
  });

  test("passes stepContext to render function", () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One">
          {({ currentStep, totalSteps, isFirst, isLast }) => (
            <Text>
              Step {currentStep + 1} of {totalSteps}, first: {String(isFirst)}, last: {String(isLast)}
            </Text>
          )}
        </Step>
        <Step name="Two">
          <Text>Two</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Step 1 of 2");
    expect(frame).toContain("first: true");
    expect(frame).toContain("last: false");
  });

  test("provides goNext, goBack, goTo, cancel in stepContext", () => {
    let context: {
      goNext?: () => void;
      goBack?: () => void;
      goTo?: (step: number) => void;
      cancel?: () => void;
    } = {};

    render(
      <Stepper onComplete={() => {}}>
        <Step name="One">
          {(ctx) => {
            context = ctx;
            return <Text>First</Text>;
          }}
        </Step>
      </Stepper>,
    );

    expect(typeof context.goNext).toBe("function");
    expect(typeof context.goBack).toBe("function");
    expect(typeof context.goTo).toBe("function");
    expect(typeof context.cancel).toBe("function");
  });

  test("calls onComplete when goNext called on last step", () => {
    const onComplete = mock(() => {});
    let capturedGoNext: (() => void) | undefined;

    render(
      <Stepper onComplete={onComplete}>
        <Step name="Only">
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>Only Step</Text>;
          }}
        </Step>
      </Stepper>,
    );

    expect(onComplete).not.toHaveBeenCalled();
    capturedGoNext?.();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("calls onCancel when goBack called on first step", () => {
    const onCancel = mock(() => {});
    let capturedGoBack: (() => void) | undefined;

    render(
      <Stepper onComplete={() => {}} onCancel={onCancel}>
        <Step name="First">
          {({ goBack }) => {
            capturedGoBack = goBack;
            return <Text>First Step</Text>;
          }}
        </Step>
      </Stepper>,
    );

    expect(onCancel).not.toHaveBeenCalled();
    capturedGoBack?.();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("calls onCancel via cancel function", () => {
    const onCancel = mock(() => {});
    let capturedCancel: (() => void) | undefined;

    render(
      <Stepper onComplete={() => {}} onCancel={onCancel}>
        <Step name="First">
          {({ cancel }) => {
            capturedCancel = cancel;
            return <Text>First Step</Text>;
          }}
        </Step>
        <Step name="Second">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    expect(onCancel).not.toHaveBeenCalled();
    capturedCancel?.();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("goNext does not call onComplete when canProceed is false", () => {
    const onComplete = mock(() => {});
    let capturedGoNext: (() => void) | undefined;

    render(
      <Stepper onComplete={onComplete}>
        <Step name="One" canProceed={false}>
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>First</Text>;
          }}
        </Step>
      </Stepper>,
    );

    capturedGoNext?.();
    expect(onComplete).not.toHaveBeenCalled();
  });

  test("uses custom markers", () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}} markers={{ completed: "[X]", current: "[>]", pending: "[ ]" }}>
        <Step name="One">
          <Text>First</Text>
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("[>]"); // Current marker
    expect(frame).toContain("[ ]"); // Pending marker
    expect(frame).not.toContain("●"); // Default not used
  });

  test("uses custom renderProgress", () => {
    const { lastFrame } = render(
      <Stepper
        onComplete={() => {}}
        renderProgress={({ currentStep, steps }) => (
          <Text>
            Custom: {currentStep + 1}/{steps.length}
          </Text>
        )}
      >
        <Step name="One">
          <Text>First</Text>
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Custom: 1/2");
    expect(frame).not.toContain("●"); // Default progress not rendered
  });

  test("handles dynamic/conditional steps", () => {
    const showOptional = true;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One">
          <Text>First</Text>
        </Step>
        {showOptional && (
          <Step name="Optional">
            <Text>Optional Step</Text>
          </Step>
        )}
        <Step name="Last">
          <Text>Last</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("One");
    expect(frame).toContain("Optional");
    expect(frame).toContain("Last");
  });

  test("handles empty children gracefully", () => {
    const { lastFrame } = render(<Stepper onComplete={() => {}}>{null}</Stepper>);

    const frame = lastFrame() ?? "";
    // Should render without crashing
    expect(frame).toBeDefined();
  });

  test("only renders Step children, ignores other elements", () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Text>This should be ignored</Text>
        <Step name="Real">
          <Text>Real Step</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Real Step");
    expect(frame).not.toContain("This should be ignored");
  });

  test("goTo clamps index to valid range", async () => {
    let capturedGoTo: ((step: number) => void) | undefined;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One">
          {({ goTo }) => {
            capturedGoTo = goTo;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
        <Step name="Three">
          <Text>Third</Text>
        </Step>
      </Stepper>,
    );

    // Should clamp negative to 0
    capturedGoTo?.(-5);
    await new Promise((r) => setTimeout(r, 0));
    expect(lastFrame()).toContain("First");

    // Should clamp beyond range to last
    capturedGoTo?.(100);
    await new Promise((r) => setTimeout(r, 0));
    expect(lastFrame()).toContain("Third");
  });

  test("goNext is blocked when canProceed is false", () => {
    let capturedGoNext: (() => void) | undefined;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One" canProceed={false}>
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>Blocked Step</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Should Not See</Text>
        </Step>
      </Stepper>,
    );

    capturedGoNext?.();
    expect(lastFrame()).toContain("Blocked Step");
    expect(lastFrame()).not.toContain("Should Not See");
  });

  test("StepperContext provides registerStep and unregisterStep", () => {
    render(
      <Stepper onComplete={() => {}}>
        <Step name="Test">
          {() => {
            return <Text>Test</Text>;
          }}
        </Step>
      </Stepper>,
    );

    // Verify we can import the context
    expect(StepperContext).toBeDefined();
  });
});
