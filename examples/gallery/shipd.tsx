#!/usr/bin/env bun
/**
 * Gallery: "shipd" - a hands-free release pipeline (docs/tapes/shipd.tape).
 *
 *   bun examples/gallery/shipd.tsx
 *
 * The inverse of a form wizard: nobody touches the keyboard. Keyboard navigation
 * is off and each step drives itself - it runs its tasks, then calls goNext()
 * programmatically when they finish. The stepper becomes a live pipeline
 * visualizer. Task durations come from a seeded PRNG, so the run is reproducible.
 */
import { Box, render, Text, useApp, useInput } from "ink";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Step, type StepContext, Stepper } from "../../src";
import { Card, Footer, GalleryProgress, Header, mulberry32, Spinner, sleep, WIDTH } from "./ui";

const ACCENT = "magenta";
const rand = mulberry32(11);
const dur = (min: number, max: number): number => Math.round((min + rand() * (max - min)) / 10) * 10;

interface Task {
  label: string;
  detail: string;
  ms: number;
}

const PIPELINE: ReadonlyArray<{ name: string; tasks: Task[] }> = [
  {
    name: "Build",
    tasks: [
      { label: "compile src", detail: "dist/index.js 9.1 kB", ms: dur(700, 1100) },
      { label: "emit declarations", detail: "dist/index.d.ts", ms: dur(400, 700) },
    ],
  },
  {
    name: "Test",
    tasks: [
      { label: "unit suite", detail: "52 pass, 0 fail", ms: dur(900, 1300) },
      { label: "compat matrix", detail: "ink 6.6.0 + 7.1.1", ms: dur(700, 1000) },
    ],
  },
  {
    name: "Bundle",
    tasks: [
      { label: "minify", detail: "2.3 kB gzip", ms: dur(400, 700) },
      { label: "provenance manifest", detail: "sigstore", ms: dur(400, 600) },
    ],
  },
  {
    name: "Publish",
    tasks: [
      { label: "npm publish", detail: "@orbit/cli@2.1.0", ms: dur(900, 1300) },
      { label: "jsr publish", detail: "@orbit/cli@2.1.0", ms: dur(700, 1000) },
    ],
  },
  {
    name: "Verify",
    tasks: [
      { label: "registry serves 2.1.0", detail: "latest tag moved", ms: dur(600, 900) },
      { label: "tarball integrity", detail: "sha512 ok", ms: dur(400, 600) },
    ],
  },
];

const TOTAL_MS = PIPELINE.flatMap((p) => p.tasks).reduce((sum, task) => sum + task.ms, 0);

/** Runs the step's tasks in order, then advances the stepper. */
function PipelineStep({ stepIndex, ctx }: { stepIndex: number; ctx: StepContext }): React.JSX.Element {
  const [doneCount, setDoneCount] = useState(0);
  const goNextRef = useRef(ctx.goNext);
  goNextRef.current = ctx.goNext;
  const tasks = PIPELINE[stepIndex]?.tasks ?? [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const task of tasks) {
        await sleep(task.ms);
        if (cancelled) return;
        setDoneCount((prev) => prev + 1);
      }
      await sleep(250);
      if (!cancelled) goNextRef.current();
    })();
    return () => {
      cancelled = true;
    };
  }, [tasks]);

  return (
    <Card>
      {tasks.map((task, i) => (
        <Box key={task.label} width={WIDTH - 6} justifyContent="space-between">
          <Text>
            {i < doneCount ? (
              <Text color="green">✓ </Text>
            ) : i === doneCount ? (
              <Spinner color={ACCENT} />
            ) : (
              <Text dimColor>· </Text>
            )}
            {i === doneCount ? <Text bold> {task.label}</Text> : <Text dimColor={i > doneCount}> {task.label}</Text>}
          </Text>
          <Text dimColor>
            {i < doneCount ? `${task.detail} · ${task.ms}ms` : i === doneCount ? "running" : "queued"}
          </Text>
        </Box>
      ))}
    </Card>
  );
}

function Elapsed({ running }: { running: boolean }): React.JSX.Element {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setMs((prev) => prev + 100), 100);
    return () => clearInterval(id);
  }, [running]);
  return <Text dimColor>{(ms / 1000).toFixed(1)}s</Text>;
}

function App(): React.JSX.Element {
  const { exit } = useApp();
  const [done, setDone] = useState(false);

  useInput(
    (input) => {
      if (input === "q") {
        exit();
        setTimeout(() => process.exit(0), 20);
      }
    },
    { isActive: done },
  );

  if (done) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Header badge="shipd" badgeColor={ACCENT} title="release pipeline" right="@orbit/cli" />
        <Box marginTop={1}>
          <GalleryProgress
            accent={ACCENT}
            steps={PIPELINE.map(({ name }) => ({ id: name, name, completed: true, current: false }))}
          />
        </Box>
        <Card>
          <Box>
            <Text bold color="black" backgroundColor="green">
              {" ✓ shipped "}
            </Text>
            <Text bold> @orbit/cli 2.1.0 is live</Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text dimColor>{"registries  "}</Text>npm + jsr
            </Text>
            <Text>
              <Text dimColor>{"pipeline    "}</Text>10 tasks · {(TOTAL_MS / 1000).toFixed(1)}s
            </Text>
            <Text>
              <Text dimColor>{"provenance  "}</Text>attested (sigstore)
            </Text>
          </Box>
        </Card>
        <Footer left="q quit" right="done" />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Header badge="shipd" badgeColor={ACCENT} title="release pipeline" right="@orbit/cli" />
      <Box marginTop={1} flexDirection="column">
        <Stepper
          onComplete={() => setDone(true)}
          keyboardNav={false}
          renderProgress={({ steps }) => <GalleryProgress steps={steps} accent={ACCENT} />}
        >
          {PIPELINE.map((phase, i) => (
            <Step key={phase.name} name={phase.name}>
              {(ctx) => <PipelineStep stepIndex={i} ctx={ctx} />}
            </Step>
          ))}
        </Stepper>
        <Footer left="hands-free · steps advance on completion" right={<Elapsed running />} />
      </Box>
    </Box>
  );
}

render(<App />);
