#!/usr/bin/env bun
/**
 * Gallery: "atlas" - a guarded database migration (docs/tapes/atlas.tape).
 *
 *   bun examples/gallery/atlas.tsx
 *
 * The stepper as a safety mechanism: review a schema diff, watch a dry run, and
 * pass a typed-confirmation gate (type the database name to unlock - the
 * terraform/prisma destructive-action pattern, expressed as canProceed) before
 * anything touches prod. The apply phase then advances itself. Seeded PRNG for
 * generated stats keeps recordings reproducible.
 */
import { Box, render, Text, useApp, useInput } from "ink";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Step, type StepContext, Stepper } from "../../src";
import { Card, Field, Footer, GalleryProgress, Header, mulberry32, Spinner, sleep, useFieldSubmit } from "./ui";

const ACCENT = "blue";
const DB_NAME = "prod-billing";
const rand = mulberry32(23);
const ROWS_SCANNED = (12000 + Math.floor(rand() * 900)).toLocaleString("en-US");

const DIFF = [
  { kind: "+", text: "create table invoices (7 columns)", color: "green" },
  { kind: "~", text: "alter index users_email_idx → unique", color: "yellow" },
  { kind: "-", text: "drop column users.legacy_flag", color: "red" },
] as const;

const DRY_CHECKS = ["scan production rows", "detect conflicts", "estimate lock time"];
const DRY_RESULTS = [`${ROWS_SCANNED} rows · ok`, "0 conflicts", "no table locks"];

const APPLY_MS = [900, 1100, 800] as const;

function DryRunStep({ done, onDone }: { done: boolean; onDone: () => void }): React.JSX.Element {
  const [progress, setProgress] = useState(done ? DRY_CHECKS.length : 0);

  useEffect(() => {
    if (done) return;
    if (progress >= DRY_CHECKS.length) {
      onDone();
      return;
    }
    const id = setTimeout(() => setProgress((prev) => prev + 1), 800);
    return () => clearTimeout(id);
  }, [progress, done, onDone]);

  return (
    <Card>
      <Text>Dry run against a shadow schema</Text>
      <Box marginTop={1} flexDirection="column">
        {DRY_CHECKS.map((check, i) => (
          <Text key={check}>
            {i < progress ? (
              <Text color="green">✓ </Text>
            ) : i === progress && !done ? (
              <Spinner color={ACCENT} />
            ) : (
              <Text dimColor>· </Text>
            )}
            <Text dimColor={i > progress}> {check}</Text>
            {i < progress && (
              <Text dimColor>
                {"  ·  "}
                {DRY_RESULTS[i]}
              </Text>
            )}
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        {done ? <Text color="green">safe to apply — Enter to continue</Text> : <Text dimColor>analyzing…</Text>}
      </Box>
    </Card>
  );
}

function ConfirmStep({
  ctx,
  value,
  onEdit,
}: {
  ctx: StepContext;
  value: string;
  onEdit: (updater: (prev: string) => string) => void;
}): React.JSX.Element {
  const submit = useFieldSubmit(ctx);
  const matches = value === DB_NAME;
  const partial = DB_NAME.startsWith(value) && value.length > 0;

  return (
    <Card borderColor="red">
      <Field
        label={
          <Text>
            This will modify{" "}
            <Text bold color="red">
              {DB_NAME}
            </Text>
            . Type the database name to unlock.
          </Text>
        }
        value={value}
        placeholder={DB_NAME}
        accent={ACCENT}
        onEdit={onEdit}
        status={
          matches ? (
            <Text color="green">✓ names match — Enter to apply</Text>
          ) : partial ? (
            <Text dimColor>keep typing…</Text>
          ) : value.length > 0 ? (
            <Text color="red">✗ names don't match</Text>
          ) : (
            <Text dimColor>the gate stays locked until the names match</Text>
          )
        }
        onSubmit={submit}
      />
    </Card>
  );
}

function ApplyStep({ ctx }: { ctx: StepContext }): React.JSX.Element {
  const [doneCount, setDoneCount] = useState(0);
  const goNextRef = useRef(ctx.goNext);
  goNextRef.current = ctx.goNext;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const ms of APPLY_MS) {
        await sleep(ms);
        if (cancelled) return;
        setDoneCount((prev) => prev + 1);
      }
      await sleep(300);
      if (!cancelled) goNextRef.current();
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card>
      <Text>Applying migration 20260812_1</Text>
      <Box marginTop={1} flexDirection="column">
        {DIFF.map((change, i) => (
          <Text key={change.text}>
            {i < doneCount ? (
              <Text color="green">✓ </Text>
            ) : i === doneCount ? (
              <Spinner color={ACCENT} />
            ) : (
              <Text dimColor>· </Text>
            )}
            <Text color={change.color} dimColor={i > doneCount}>
              {" "}
              {change.kind}
            </Text>
            <Text dimColor={i > doneCount}> {change.text}</Text>
            {i < doneCount && (
              <Text dimColor>
                {"  ·  "}
                {APPLY_MS[i]}ms
              </Text>
            )}
          </Text>
        ))}
      </Box>
    </Card>
  );
}

function App(): React.JSX.Element {
  const { exit } = useApp();
  const [dryDone, setDryDone] = useState(false);
  const [confirm, setConfirm] = useState("");
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
        <Header badge="atlas" badgeColor={ACCENT} title="schema migrate" right={DB_NAME} />
        <Box marginTop={1}>
          <GalleryProgress
            accent={ACCENT}
            steps={["Plan", "Dry run", "Confirm", "Apply"].map((name) => ({
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
              {" ✓ migrated "}
            </Text>
            <Text bold> 20260812_1 applied</Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text dimColor>{"database  "}</Text>
              {DB_NAME}
            </Text>
            <Text>
              <Text dimColor>{"changes   "}</Text>3 (1 create · 1 alter · 1 drop)
            </Text>
            <Text>
              <Text dimColor>{"duration  "}</Text>
              {(APPLY_MS.reduce((a, b) => a + b, 0) / 1000).toFixed(1)}s · zero downtime
            </Text>
          </Box>
        </Card>
        <Footer left="q quit" right="done" />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Header badge="atlas" badgeColor={ACCENT} title="schema migrate" right={DB_NAME} />
      <Box marginTop={1} flexDirection="column">
        <Stepper
          onComplete={() => setDone(true)}
          onCancel={() => exit()}
          renderProgress={({ steps }) => <GalleryProgress steps={steps} accent={ACCENT} />}
        >
          <Step name="Plan">
            {() => (
              <Card>
                <Text>3 pending changes</Text>
                <Box marginTop={1} flexDirection="column">
                  {DIFF.map((change) => (
                    <Text key={change.text}>
                      <Text color={change.color} bold>
                        {change.kind}
                      </Text>
                      <Text> {change.text}</Text>
                    </Text>
                  ))}
                </Box>
              </Card>
            )}
          </Step>

          <Step name="Dry run" canProceed={dryDone}>
            {() => <DryRunStep done={dryDone} onDone={() => setDryDone(true)} />}
          </Step>

          <Step name="Confirm" canProceed={confirm === DB_NAME}>
            {(ctx) => <ConfirmStep ctx={ctx} value={confirm} onEdit={setConfirm} />}
          </Step>

          <Step name="Apply">{(ctx) => <ApplyStep ctx={ctx} />}</Step>
        </Stepper>
        <Footer left="guarded migration · nothing runs unconfirmed" right="20260812_1" />
      </Box>
    </Box>
  );
}

render(<App />);
