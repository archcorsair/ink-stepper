#!/usr/bin/env bun
/**
 * Gallery: "oncall" - an incident-response runbook walker (docs/tapes/oncall.tape).
 *
 *   bun examples/gallery/oncall.tsx
 *
 * A live runbook, not a form: y-key confirmations, an elapsed-incident clock in
 * the header, and the library's dynamic-step feature in its natural habitat -
 * selecting SEV-1 during triage inserts an "Escalate" step into the flow in real
 * time (arrow between severities and watch the progress bar gain and lose a
 * marker without changing width).
 */
import { Box, render, Text, useApp, useInput } from "ink";
import type React from "react";
import { useEffect, useState } from "react";
import { Step, type StepContext, Stepper } from "../../src";
import { Card, Field, Footer, GalleryProgress, Header, Spinner, useFieldSubmit } from "./ui";

const ACCENT = "yellow";

const SEVERITIES = [
  { name: "SEV-3", blurb: "degraded, no user impact" },
  { name: "SEV-2", blurb: "partial outage, workaround exists" },
  { name: "SEV-1", blurb: "checkout is down - all hands" },
];

const MITIGATIONS = ["disable experimental banner rollout", "drain canary pods (us-east-1)"];

const ERROR_RATES = ["4.1%", "2.6%", "1.2%", "0.4%"];

function Clock({ frozen }: { frozen: boolean }): React.JSX.Element {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (frozen) return;
    const id = setInterval(() => setSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(id);
  }, [frozen]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return (
    <Text color={frozen ? "green" : "red"}>
      ⏱ {mm}:{ss}
    </Text>
  );
}

function SeverityStep({ index, onChange }: { index: number; onChange: (next: number) => void }): React.JSX.Element {
  useInput((_input, key) => {
    if (key.downArrow) onChange(Math.min(index + 1, SEVERITIES.length - 1));
    if (key.upArrow) onChange(Math.max(index - 1, 0));
  });

  return (
    <Card>
      <Text>Set incident severity</Text>
      <Box marginTop={1} flexDirection="column">
        {SEVERITIES.map((sev, i) => (
          <Text key={sev.name} bold={i === index}>
            <Text color={i === index ? ACCENT : "white"}>
              {i === index ? "❯ " : "  "}
              {sev.name}
            </Text>
            <Text dimColor>
              {"  "}
              {sev.blurb}
            </Text>
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>SEV-1 inserts an escalation step into the runbook</Text>
      </Box>
    </Card>
  );
}

function ChecklistStep({
  items,
  checked,
  onCheck,
}: {
  items: string[];
  checked: number;
  onCheck: () => void;
}): React.JSX.Element {
  useInput((input) => {
    if (input === "y" && checked < items.length) onCheck();
  });

  return (
    <Card>
      <Text>Mitigation checklist</Text>
      <Box marginTop={1} flexDirection="column">
        {items.map((item, i) => (
          <Text key={item}>
            {i < checked ? (
              <Text color="green">[✓] </Text>
            ) : i === checked ? (
              <Text color={ACCENT} bold>
                [y] {""}
              </Text>
            ) : (
              <Text dimColor>[ ] </Text>
            )}
            <Text dimColor={i > checked}>{item}</Text>
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        {checked < items.length ? (
          <Text dimColor>press y to confirm each action</Text>
        ) : (
          <Text color="green">all mitigations in place — Enter to continue</Text>
        )}
      </Box>
    </Card>
  );
}

function EscalateStep({ paged, onPage }: { paged: boolean; onPage: () => void }): React.JSX.Element {
  useInput((input) => {
    if (input === "y" && !paged) onPage();
  });

  return (
    <Card borderColor="red">
      <Text>
        <Text color="red" bold>
          SEV-1 protocol
        </Text>
        {"  page the incident commander"}
      </Text>
      <Box marginTop={1}>
        {paged ? (
          <Text color="green">✓ paged @dana — acknowledged in 42s</Text>
        ) : (
          <Text color={ACCENT}>[y] send the page</Text>
        )}
      </Box>
    </Card>
  );
}

function VerifyStep({ done, onDone }: { done: boolean; onDone: () => void }): React.JSX.Element {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (done) return;
    if (tick >= ERROR_RATES.length - 1) {
      onDone();
      return;
    }
    const id = setTimeout(() => setTick((prev) => prev + 1), 900);
    return () => clearTimeout(id);
  }, [tick, done, onDone]);

  return (
    <Card>
      <Text>Watch checkout error rate recover</Text>
      <Box marginTop={1}>
        {done ? (
          <Text color="green">✓ 0.4% — back within SLO</Text>
        ) : (
          <Text color={ACCENT}>
            <Spinner color={ACCENT} /> error rate {ERROR_RATES[tick]} and falling…
          </Text>
        )}
      </Box>
    </Card>
  );
}

function HandoffStep({
  ctx,
  note,
  onEdit,
}: {
  ctx: StepContext;
  note: string;
  onEdit: (updater: (prev: string) => string) => void;
}): React.JSX.Element {
  const submit = useFieldSubmit(ctx);
  return (
    <Card>
      <Field
        label="Handoff note for the next shift"
        value={note}
        placeholder="what changed and why"
        accent={ACCENT}
        onEdit={onEdit}
        onSubmit={submit}
      />
    </Card>
  );
}

function App(): React.JSX.Element {
  const { exit } = useApp();
  const [severity, setSeverity] = useState(1); // SEV-2 preselected
  const [checked, setChecked] = useState(0);
  const [paged, setPaged] = useState(false);
  const [verified, setVerified] = useState(false);
  const [note, setNote] = useState("");
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

  const sev1 = severity === 2;

  if (done) {
    return (
      <Box flexDirection="column" paddingX={1} paddingY={1}>
        <Header badge="oncall" badgeColor="red" title="INC-4022 · checkout latency" right={<Clock frozen />} />
        <Box marginTop={1}>
          <GalleryProgress
            accent={ACCENT}
            steps={["Triage", "Mitigate", ...(sev1 ? ["Escalate"] : []), "Verify", "Handoff"].map((name) => ({
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
              {" ✓ resolved "}
            </Text>
            <Text bold> INC-4022 mitigated</Text>
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text>
              <Text dimColor>{"severity  "}</Text>
              {SEVERITIES[severity]?.name}
            </Text>
            <Text>
              <Text dimColor>{"handoff   "}</Text>
              {note || "(none)"}
            </Text>
            <Text>
              <Text dimColor>{"followup  "}</Text>postmortem due Friday
            </Text>
          </Box>
        </Card>
        <Footer left="q quit" right="incident closed" />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Header badge="oncall" badgeColor="red" title="INC-4022 · checkout latency" right={<Clock frozen={false} />} />
      <Box marginTop={1} flexDirection="column">
        <Stepper
          onComplete={() => setDone(true)}
          onCancel={() => exit()}
          renderProgress={({ steps }) => <GalleryProgress steps={steps} accent={ACCENT} />}
        >
          <Step name="Triage">{() => <SeverityStep index={severity} onChange={setSeverity} />}</Step>

          <Step name="Mitigate" canProceed={checked >= MITIGATIONS.length}>
            {() => <ChecklistStep items={MITIGATIONS} checked={checked} onCheck={() => setChecked((c) => c + 1)} />}
          </Step>

          {sev1 && (
            <Step name="Escalate" canProceed={paged}>
              {() => <EscalateStep paged={paged} onPage={() => setPaged(true)} />}
            </Step>
          )}

          <Step name="Verify" canProceed={verified}>
            {() => <VerifyStep done={verified} onDone={() => setVerified(true)} />}
          </Step>

          <Step name="Handoff" canProceed={note.trim().length > 0}>
            {(ctx) => <HandoffStep ctx={ctx} note={note} onEdit={setNote} />}
          </Step>
        </Stepper>
        <Footer left="runbook · confirm each action" right={`${sev1 ? 5 : 4} steps`} />
      </Box>
    </Box>
  );
}

render(<App />);
