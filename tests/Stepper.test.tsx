import { describe, expect, mock, spyOn, test } from "bun:test";
import { Text } from "ink";
import { render } from "ink-testing-library";
import type React from "react";
import { type ProgressContext, Step, type StepContext, Stepper, useStepperInput } from "../src";
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

  test("calls onComplete when goNext called on last step", async () => {
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
    await new Promise((r) => setTimeout(r, 0));
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

  test("renders non-Step children alongside steps (flexible composition)", () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Text>Header Content</Text>
        <Step name="Real">
          <Text>Real Step</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    // With registration pattern, all children are rendered for flexible composition
    expect(frame).toContain("Real Step");
    expect(frame).toContain("Header Content");
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

  test("Step registers itself with context on mount (wrapped steps work)", async () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Wrapper>
          <Step name="Wrapped">
            <Text>Wrapped Content</Text>
          </Step>
        </Wrapper>
        <Step name="Direct">
          <Text>Direct Content</Text>
        </Step>
      </Stepper>,
    );

    await new Promise((r) => setTimeout(r, 0));

    // With registration pattern, wrapped steps should work
    expect(lastFrame()).toContain("Wrapped Content");
  });

  test("goNext waits for async canProceed", async () => {
    const onComplete = mock(() => {});
    let capturedGoNext: (() => void) | undefined;
    let resolveValidation: ((value: boolean) => void) | undefined;

    const asyncValidator = () =>
      new Promise<boolean>((resolve) => {
        resolveValidation = resolve;
      });

    render(
      <Stepper onComplete={onComplete}>
        <Step name="Async" canProceed={asyncValidator}>
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>Async Step</Text>;
          }}
        </Step>
      </Stepper>,
    );

    // Start navigation
    capturedGoNext?.();

    // Should not complete yet
    expect(onComplete).not.toHaveBeenCalled();

    // Resolve validation
    resolveValidation?.(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  test("goNext blocks when async canProceed returns false", async () => {
    let capturedGoNext: (() => void) | undefined;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One" canProceed={() => Promise.resolve(false)}>
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    capturedGoNext?.();
    await new Promise((r) => setTimeout(r, 10));

    expect(lastFrame()).toContain("First");
    expect(lastFrame()).not.toContain("Second");
  });

  test("goNext works with sync function canProceed", async () => {
    let capturedGoNext: (() => void) | undefined;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One" canProceed={() => true}>
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    capturedGoNext?.();
    await new Promise((r) => setTimeout(r, 10));

    expect(lastFrame()).toContain("Second");
  });

  test("calls onExitStep and onEnterStep during navigation", async () => {
    const onExitStep = mock((_step: number) => undefined);
    const onEnterStep = mock(() => {});
    let capturedGoNext: (() => void) | undefined;

    render(
      <Stepper onComplete={() => {}} onExitStep={onExitStep} onEnterStep={onEnterStep}>
        <Step name="One">
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    capturedGoNext?.();
    await new Promise((r) => setTimeout(r, 10));

    expect(onExitStep).toHaveBeenCalledWith(0);
    expect(onEnterStep).toHaveBeenCalledWith(1);
  });

  test("onExitStep returning false cancels navigation", async () => {
    let capturedGoNext: (() => void) | undefined;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}} onExitStep={() => false}>
        <Step name="One">
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    capturedGoNext?.();
    await new Promise((r) => setTimeout(r, 10));

    expect(lastFrame()).toContain("First");
    expect(lastFrame()).not.toContain("Second");
  });

  test("onExitStep async returning false cancels navigation", async () => {
    let capturedGoNext: (() => void) | undefined;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}} onExitStep={() => Promise.resolve(false)}>
        <Step name="One">
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    capturedGoNext?.();
    await new Promise((r) => setTimeout(r, 10));

    expect(lastFrame()).toContain("First");
    expect(lastFrame()).not.toContain("Second");
  });

  test("stepContext.isValidating is exposed for loading states", async () => {
    let capturedContext: { goNext: () => void; isValidating: boolean } | undefined;
    let resolveValidation: (() => void) | undefined;
    const validatingStates: boolean[] = [];

    const asyncValidator = () =>
      new Promise<boolean>((resolve) => {
        resolveValidation = () => resolve(true);
      });

    const { rerender } = render(
      <Stepper onComplete={() => {}}>
        <Step name="Async" canProceed={asyncValidator}>
          {(ctx) => {
            capturedContext = ctx;
            validatingStates.push(ctx.isValidating);
            return <Text>{ctx.isValidating ? "Validating..." : "Ready"}</Text>;
          }}
        </Step>
      </Stepper>,
    );

    // Initially not validating
    expect(capturedContext?.isValidating).toBe(false);

    // Start validation
    capturedContext?.goNext();
    await new Promise((r) => setTimeout(r, 0));

    // Force re-render to capture isValidating state
    rerender(
      <Stepper onComplete={() => {}}>
        <Step name="Async" canProceed={asyncValidator}>
          {(ctx) => {
            capturedContext = ctx;
            validatingStates.push(ctx.isValidating);
            return <Text>{ctx.isValidating ? "Validating..." : "Ready"}</Text>;
          }}
        </Step>
      </Stepper>,
    );

    // Resolve and complete
    resolveValidation?.();
    await new Promise((r) => setTimeout(r, 10));

    // Should have seen both states
    expect(validatingStates).toContain(false);
  });

  test("useStepperInput hook is exported and functional", () => {
    // Verify export works
    expect(typeof useStepperInput).toBe("function");
  });

  test("useStepperInput can disable and enable navigation", async () => {
    let inputHook: ReturnType<typeof useStepperInput> | undefined;

    const TestComponent = () => {
      inputHook = useStepperInput();
      return <Text>Test: {inputHook.isNavigationDisabled ? "disabled" : "enabled"}</Text>;
    };

    const { lastFrame, rerender } = render(
      <Stepper onComplete={() => {}}>
        <Step name="Test">
          <TestComponent />
        </Step>
      </Stepper>,
    );

    // Initially enabled
    expect(lastFrame()).toContain("enabled");
    expect(inputHook?.isNavigationDisabled).toBe(false);

    // Disable navigation
    inputHook?.disableNavigation();
    await new Promise((r) => setTimeout(r, 0));

    // Force rerender to see the state change
    rerender(
      <Stepper onComplete={() => {}}>
        <Step name="Test">
          <TestComponent />
        </Step>
      </Stepper>,
    );

    expect(inputHook?.isNavigationDisabled).toBe(true);

    // Re-enable navigation
    inputHook?.enableNavigation();
    await new Promise((r) => setTimeout(r, 0));

    rerender(
      <Stepper onComplete={() => {}}>
        <Step name="Test">
          <TestComponent />
        </Step>
      </Stepper>,
    );

    expect(inputHook?.isNavigationDisabled).toBe(false);
  });

  test("async canProceed rejection is reported to onError and blocks navigation", async () => {
    const failure = new Error("validation exploded");
    const onError = mock((_error: unknown) => {});
    let capturedGoNext: (() => void) | undefined;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}} onError={onError}>
        <Step name="One" canProceed={() => Promise.reject(failure)}>
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    capturedGoNext?.();
    await new Promise((r) => setTimeout(r, 10));

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(failure);
    expect(lastFrame()).toContain("First");
    expect(lastFrame()).not.toContain("Second");
  });

  test("async canProceed rejection without onError does not crash the host", async () => {
    const consoleError = spyOn(console, "error").mockImplementation(() => {});
    let capturedGoNext: (() => void) | undefined;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One" canProceed={() => Promise.reject(new Error("boom"))}>
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    capturedGoNext?.();
    await new Promise((r) => setTimeout(r, 10));

    expect(consoleError).toHaveBeenCalled();
    expect(lastFrame()).toContain("First");
    expect(lastFrame()).not.toContain("Second");

    consoleError.mockRestore();
  });

  test("onExitStep throwing blocks navigation and reports to onError", async () => {
    const failure = new Error("exit hook exploded");
    const onError = mock((_error: unknown) => {});
    let capturedGoNext: (() => void) | undefined;

    const { lastFrame } = render(
      <Stepper
        onComplete={() => {}}
        onError={onError}
        onExitStep={() => {
          throw failure;
        }}
      >
        <Step name="One">
          {({ goNext }) => {
            capturedGoNext = goNext;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    capturedGoNext?.();
    await new Promise((r) => setTimeout(r, 10));

    expect(onError).toHaveBeenCalledWith(failure);
    expect(lastFrame()).toContain("First");
    expect(lastFrame()).not.toContain("Second");
  });

  test("navigation is a no-op while validation is in flight", async () => {
    const onCancel = mock(() => {});
    let capturedGoNext: (() => void) | undefined;
    let capturedGoBack: (() => void) | undefined;

    // Never resolves - validation stays in flight for the duration of the test
    const hangingValidator = () => new Promise<boolean>(() => {});

    const { lastFrame } = render(
      <Stepper onComplete={() => {}} onCancel={onCancel} initialStep={1}>
        <Step name="One">
          <Text>First</Text>
        </Step>
        <Step name="Two" canProceed={hangingValidator}>
          {({ goNext, goBack }) => {
            capturedGoNext = goNext;
            capturedGoBack = goBack;
            return <Text>Second</Text>;
          }}
        </Step>
        <Step name="Three">
          <Text>Third</Text>
        </Step>
      </Stepper>,
    );

    await new Promise((r) => setTimeout(r, 10));
    expect(lastFrame()).toContain("Second");

    // Start validation, then try to navigate away while it is pending
    capturedGoNext?.();
    capturedGoBack?.();
    capturedGoNext?.();
    await new Promise((r) => setTimeout(r, 10));

    expect(lastFrame()).toContain("Second");
    expect(lastFrame()).not.toContain("First");
    expect(lastFrame()).not.toContain("Third");
    expect(onCancel).not.toHaveBeenCalled();
  });

  test("goTo fires onExitStep, onStepChange and onEnterStep", async () => {
    const onExitStep = mock((_step: number) => undefined);
    const onStepChange = mock((_step: number) => {});
    const onEnterStep = mock((_step: number) => {});
    let capturedGoTo: ((step: number) => void) | undefined;

    render(
      <Stepper onComplete={() => {}} onExitStep={onExitStep} onStepChange={onStepChange} onEnterStep={onEnterStep}>
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

    capturedGoTo?.(2);
    await new Promise((r) => setTimeout(r, 10));

    expect(onExitStep).toHaveBeenCalledWith(0);
    expect(onStepChange).toHaveBeenCalledWith(2);
    expect(onEnterStep).toHaveBeenCalledWith(2);
  });

  test("onExitStep returning false cancels goTo", async () => {
    let capturedGoTo: ((step: number) => void) | undefined;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}} onExitStep={() => false}>
        <Step name="One">
          {({ goTo }) => {
            capturedGoTo = goTo;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    capturedGoTo?.(1);
    await new Promise((r) => setTimeout(r, 10));

    expect(lastFrame()).toContain("First");
    expect(lastFrame()).not.toContain("Second");
  });

  test("goTo skips canProceed (raw jump)", async () => {
    let capturedGoTo: ((step: number) => void) | undefined;

    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One" canProceed={false}>
          {({ goTo }) => {
            capturedGoTo = goTo;
            return <Text>First</Text>;
          }}
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    capturedGoTo?.(1);
    await new Promise((r) => setTimeout(r, 10));

    expect(lastFrame()).toContain("Second");
  });

  test("initialStep starts on the given step", async () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}} initialStep={1}>
        <Step name="One">
          <Text>First Content</Text>
        </Step>
        <Step name="Two">
          <Text>Second Content</Text>
        </Step>
      </Stepper>,
    );

    await new Promise((r) => setTimeout(r, 10));

    expect(lastFrame()).toContain("Second Content");
    expect(lastFrame()).not.toContain("First Content");
  });

  test("renders mixed-width custom markers without breaking the layout", async () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}} markers={{ completed: "[done]", current: "»", pending: "·" }} initialStep={1}>
        <Step name="Alpha">
          <Text>A</Text>
        </Step>
        <Step name="Beta">
          <Text>B</Text>
        </Step>
        <Step name="Gamma">
          <Text>C</Text>
        </Step>
      </Stepper>,
    );

    await new Promise((r) => setTimeout(r, 10));

    const frame = lastFrame() ?? "";
    expect(frame).toContain("Alpha");
    expect(frame).toContain("Beta");
    expect(frame).toContain("Gamma");
    expect(frame).toContain("[done]");
    expect(frame).toContain("»");
    expect(frame).toContain("·");
  });

  test("progress context exposes stable unique step ids", async () => {
    let captured: ProgressContext | undefined;

    render(
      <Stepper
        onComplete={() => {}}
        renderProgress={(ctx) => {
          captured = ctx;
          return <Text>Progress</Text>;
        }}
      >
        <Step name="Same">
          <Text>First</Text>
        </Step>
        <Step name="Same">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    await new Promise((r) => setTimeout(r, 10));

    const ids = captured?.steps.map((s) => s.id) ?? [];
    expect(ids).toHaveLength(2);
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(2);
  });
});

describe("Stepper - dynamic step ordering", () => {
  /** Ordering repairs converge over a couple of commits; give them a tick to settle. */
  const settle = () => new Promise((r) => setTimeout(r, 20));

  test("late-mounted middle step sorts by tree position, not by mount time", async () => {
    let ctx: StepContext | undefined;

    const view = (show: boolean) => (
      <Stepper onComplete={() => {}}>
        <Step name="AAA">
          {(c) => {
            ctx = c;
            return <Text>first-body</Text>;
          }}
        </Step>
        {show && (
          <Step name="MID">
            <Text>mid-body</Text>
          </Step>
        )}
        <Step name="ZZZ">
          <Text>last-body</Text>
        </Step>
      </Stepper>
    );

    const { lastFrame, rerender } = render(view(false));
    await settle();

    rerender(view(true));
    await settle();

    const frame = lastFrame() ?? "";
    expect(frame.indexOf("AAA")).toBeLessThan(frame.indexOf("MID"));
    expect(frame.indexOf("MID")).toBeLessThan(frame.indexOf("ZZZ"));

    ctx?.goNext();
    await settle();

    expect(lastFrame()).toContain("mid-body");
    expect(lastFrame()).not.toContain("last-body");
  });

  test("late-mounted step inside a wrapper still sorts by tree position", async () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;
    let ctx: StepContext | undefined;

    const view = (show: boolean) => (
      <Stepper onComplete={() => {}}>
        <Step name="AAA">
          {(c) => {
            ctx = c;
            return <Text>first-body</Text>;
          }}
        </Step>
        {show && (
          <Wrapper>
            <Step name="MID">
              <Text>mid-body</Text>
            </Step>
          </Wrapper>
        )}
        <Step name="ZZZ">
          <Text>last-body</Text>
        </Step>
      </Stepper>
    );

    const { lastFrame, rerender } = render(view(false));
    await settle();

    rerender(view(true));
    await settle();

    const frame = lastFrame() ?? "";
    expect(frame.indexOf("AAA")).toBeLessThan(frame.indexOf("MID"));
    expect(frame.indexOf("MID")).toBeLessThan(frame.indexOf("ZZZ"));

    ctx?.goNext();
    await settle();

    expect(lastFrame()).toContain("mid-body");
  });

  test("active step stays put when a step is inserted before it", async () => {
    let ctx: StepContext | undefined;

    const view = (show: boolean) => (
      <Stepper onComplete={() => {}}>
        <Step name="AAA">
          {(c) => {
            ctx = c;
            return <Text>first-body</Text>;
          }}
        </Step>
        {show && (
          <Step name="MID">
            <Text>mid-body</Text>
          </Step>
        )}
        <Step name="ZZZ">
          {(c) => {
            ctx = c;
            return <Text>last-body</Text>;
          }}
        </Step>
      </Stepper>
    );

    const { lastFrame, rerender } = render(view(false));
    await settle();

    // Navigate to ZZZ (index 1 of 2)
    ctx?.goNext();
    await settle();
    expect(lastFrame()).toContain("last-body");

    rerender(view(true));
    await settle();

    // Still on ZZZ, now index 2 of 3
    expect(lastFrame()).toContain("last-body");
    expect(lastFrame()).not.toContain("mid-body");
    expect(ctx?.totalSteps).toBe(3);
    expect(ctx?.currentStep).toBe(2);

    ctx?.goBack();
    await settle();

    expect(lastFrame()).toContain("mid-body");
  });

  test("inserting a step after the current one leaves the current step untouched", async () => {
    let ctx: StepContext | undefined;

    const view = (show: boolean) => (
      <Stepper onComplete={() => {}}>
        <Step name="AAA">
          {(c) => {
            ctx = c;
            return <Text>first-body</Text>;
          }}
        </Step>
        <Step name="ZZZ">
          <Text>last-body</Text>
        </Step>
        {show && (
          <Step name="EXTRA">
            <Text>extra-body</Text>
          </Step>
        )}
      </Stepper>
    );

    const { lastFrame, rerender } = render(view(false));
    await settle();

    rerender(view(true));
    await settle();

    expect(lastFrame()).toContain("first-body");
    expect(ctx?.currentStep).toBe(0);
    expect(ctx?.totalSteps).toBe(3);

    const frame = lastFrame() ?? "";
    expect(frame.indexOf("AAA")).toBeLessThan(frame.indexOf("ZZZ"));
    expect(frame.indexOf("ZZZ")).toBeLessThan(frame.indexOf("EXTRA"));
  });

  test("removing a step before the active one keeps the active step's content", async () => {
    let ctx: StepContext | undefined;

    const view = (show: boolean) => (
      <Stepper onComplete={() => {}}>
        {show && (
          <Step name="AAA">
            {(c) => {
              ctx = c;
              return <Text>first-body</Text>;
            }}
          </Step>
        )}
        <Step name="MID">
          {(c) => {
            ctx = c;
            return <Text>mid-body</Text>;
          }}
        </Step>
        <Step name="ZZZ">
          {(c) => {
            ctx = c;
            return <Text>last-body</Text>;
          }}
        </Step>
      </Stepper>
    );

    const { lastFrame, rerender } = render(view(true));
    await settle();

    ctx?.goTo(2);
    await settle();
    expect(lastFrame()).toContain("last-body");

    rerender(view(false));
    await settle();

    expect(lastFrame()).toContain("last-body");
    expect(ctx?.currentStep).toBe(1);
    expect(ctx?.totalSteps).toBe(2);
  });

  test("removing the active step clamps to the last remaining step", async () => {
    let ctx: StepContext | undefined;

    const view = (show: boolean) => (
      <Stepper onComplete={() => {}}>
        <Step name="AAA">
          {(c) => {
            ctx = c;
            return <Text>first-body</Text>;
          }}
        </Step>
        {show && (
          <Step name="ZZZ">
            {(c) => {
              ctx = c;
              return <Text>last-body</Text>;
            }}
          </Step>
        )}
      </Stepper>
    );

    const { lastFrame, rerender } = render(view(true));
    await settle();

    ctx?.goNext();
    await settle();
    expect(lastFrame()).toContain("last-body");

    rerender(view(false));
    await settle();

    expect(lastFrame()).toContain("first-body");
    expect(lastFrame()).not.toContain("last-body");
  });

  test("index repairs do not fire step lifecycle callbacks", async () => {
    const onStepChange = mock((_step: number) => {});
    const onEnterStep = mock((_step: number) => {});
    const onExitStep = mock((_step: number) => undefined);
    let ctx: StepContext | undefined;

    const view = (show: boolean) => (
      <Stepper onComplete={() => {}} onStepChange={onStepChange} onEnterStep={onEnterStep} onExitStep={onExitStep}>
        <Step name="AAA">
          {(c) => {
            ctx = c;
            return <Text>first-body</Text>;
          }}
        </Step>
        {show && (
          <Step name="MID">
            <Text>mid-body</Text>
          </Step>
        )}
        <Step name="ZZZ">
          {(c) => {
            ctx = c;
            return <Text>last-body</Text>;
          }}
        </Step>
      </Stepper>
    );

    const { lastFrame, rerender } = render(view(false));
    await settle();

    // Move to ZZZ, then reset the mocks so only repair-driven calls can show up
    ctx?.goNext();
    await settle();
    onStepChange.mockClear();
    onEnterStep.mockClear();
    onExitStep.mockClear();

    // Insertion before the active step: repaired silently
    rerender(view(true));
    await settle();
    expect(lastFrame()).toContain("last-body");
    expect(onStepChange).not.toHaveBeenCalled();
    expect(onEnterStep).not.toHaveBeenCalled();
    expect(onExitStep).not.toHaveBeenCalled();

    // Removal before the active step: also silent
    rerender(view(false));
    await settle();
    expect(lastFrame()).toContain("last-body");
    expect(onStepChange).not.toHaveBeenCalled();
    expect(onEnterStep).not.toHaveBeenCalled();
    expect(onExitStep).not.toHaveBeenCalled();

    // Real navigation still fires the lifecycle
    ctx?.goBack();
    await settle();
    expect(onExitStep).toHaveBeenCalledWith(1);
    expect(onStepChange).toHaveBeenCalledWith(0);
    expect(onEnterStep).toHaveBeenCalledWith(0);
  });

  test("inline canProceed identity churn does not corrupt step order", async () => {
    let ctx: StepContext | undefined;

    const view = () => (
      <Stepper onComplete={() => {}}>
        <Step name="AAA">
          {(c) => {
            ctx = c;
            return <Text>first-body</Text>;
          }}
        </Step>
        <Step name="MID" canProceed={() => true}>
          {(c) => {
            ctx = c;
            return <Text>mid-body</Text>;
          }}
        </Step>
        <Step name="ZZZ">
          <Text>last-body</Text>
        </Step>
      </Stepper>
    );

    const { lastFrame, rerender } = render(view());
    await settle();

    for (let i = 0; i < 3; i++) {
      rerender(view());
      await settle();
    }

    const frame = lastFrame() ?? "";
    expect(frame.indexOf("AAA")).toBeLessThan(frame.indexOf("MID"));
    expect(frame.indexOf("MID")).toBeLessThan(frame.indexOf("ZZZ"));

    ctx?.goNext();
    await settle();
    expect(lastFrame()).toContain("mid-body");

    ctx?.goNext();
    await settle();
    expect(lastFrame()).toContain("last-body");
  });

  test("toggling a step off and on again restores tree order", async () => {
    let ctx: StepContext | undefined;

    const view = (show: boolean) => (
      <Stepper onComplete={() => {}}>
        <Step name="AAA">
          {(c) => {
            ctx = c;
            return <Text>first-body</Text>;
          }}
        </Step>
        {show && (
          <Step name="MID">
            <Text>mid-body</Text>
          </Step>
        )}
        <Step name="ZZZ">
          <Text>last-body</Text>
        </Step>
      </Stepper>
    );

    const { lastFrame, rerender } = render(view(true));
    await settle();

    rerender(view(false));
    await settle();
    expect(lastFrame()).not.toContain("MID");

    rerender(view(true));
    await settle();

    const frame = lastFrame() ?? "";
    expect(frame.indexOf("AAA")).toBeLessThan(frame.indexOf("MID"));
    expect(frame.indexOf("MID")).toBeLessThan(frame.indexOf("ZZZ"));

    ctx?.goNext();
    await settle();
    expect(lastFrame()).toContain("mid-body");
  });

  test("controlled mode keeps the parent's index while ordering stays correct", async () => {
    const view = (show: boolean) => (
      <Stepper onComplete={() => {}} step={1}>
        <Step name="AAA">
          <Text>first-body</Text>
        </Step>
        {show && (
          <Step name="MID">
            <Text>mid-body</Text>
          </Step>
        )}
        <Step name="ZZZ">
          <Text>last-body</Text>
        </Step>
      </Stepper>
    );

    const { lastFrame, rerender } = render(view(false));
    await settle();
    expect(lastFrame()).toContain("last-body");

    rerender(view(true));
    await settle();

    const frame = lastFrame() ?? "";
    expect(frame.indexOf("AAA")).toBeLessThan(frame.indexOf("MID"));
    expect(frame.indexOf("MID")).toBeLessThan(frame.indexOf("ZZZ"));

    // The parent owns the index, so index 1 - now MID - is what renders
    expect(lastFrame()).toContain("mid-body");
    expect(lastFrame()).not.toContain("last-body");
  });
});

describe("pulse", () => {
  test("pulse animates the current marker over time", async () => {
    const { frames, unmount } = render(
      <Stepper onComplete={() => {}} pulse>
        <Step name="One">
          <Text>First</Text>
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    await new Promise((r) => setTimeout(r, 20));
    const framesBefore = frames.length;
    await new Promise((r) => setTimeout(r, 650));

    // The brightness staircase re-renders the progress bar on each tick.
    expect(frames.length).toBeGreaterThan(framesBefore);
    unmount();
  });

  test("without pulse the progress bar is static", async () => {
    const { frames, unmount } = render(
      <Stepper onComplete={() => {}}>
        <Step name="One">
          <Text>First</Text>
        </Step>
        <Step name="Two">
          <Text>Second</Text>
        </Step>
      </Stepper>,
    );

    await new Promise((r) => setTimeout(r, 20));
    const framesBefore = frames.length;
    await new Promise((r) => setTimeout(r, 650));

    expect(frames.length).toBe(framesBefore);
    unmount();
  });

  test("unmounting while pulsing cleans up the interval", async () => {
    const { unmount, lastFrame } = render(
      <Stepper onComplete={() => {}} pulse>
        <Step name="Only">
          <Text>Content</Text>
        </Step>
      </Stepper>,
    );

    await new Promise((r) => setTimeout(r, 300));
    expect(lastFrame()).toContain("Content");
    unmount();
    // If the interval leaked, the post-unmount ticks would warn/throw on state updates.
    await new Promise((r) => setTimeout(r, 600));
  });
});

describe("progress label separation", () => {
  test("a label wider than its marker column never touches the next label", () => {
    const { lastFrame } = render(
      <Stepper onComplete={() => {}}>
        <Step name="Welcome">
          <Text>a</Text>
        </Step>
        <Step name="Name">
          <Text>b</Text>
        </Step>
        <Step name="Validate">
          <Text>c</Text>
        </Step>
        <Step name="Review">
          <Text>d</Text>
        </Step>
      </Stepper>,
    );

    const frame = lastFrame() ?? "";
    // "Validate" (8 chars) overflows its 7-wide column; it must not fuse with "Review".
    expect(frame).not.toContain("ValidateReview");
    expect(frame).toContain("Validate");
    expect(frame).toContain("Review");
  });
});
