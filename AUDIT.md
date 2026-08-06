# Repo Audit — ink-stepper

Date: 2026-08-06 · Audited at commit `8e1f0d9` · All findings verified by running tests, builds, and repros locally.

Baseline health: **good**. 28/28 tests pass, `tsc --noEmit` is clean, `biome check` exits 0 (6 warnings, all in docs CSS), build works. The findings below are ranked by severity.

---

## 🔴 Critical

### C1. Published npm package ships the development JSX runtime

The `build` script runs `bunup` without `NODE_ENV=production`, so Bun applies the **dev** JSX transform. The bundle published to npm imports `react/jsx-dev-runtime` and calls `jsxDEV(...)`:

```
$ npm pack ink-stepper@0.2.1 && grep -o "jsx-dev-runtime" package/dist/index.js
jsx-dev-runtime
```

Consequences for consumers: dev-mode JSX overhead and debug bookkeeping in production apps, and potential breakage in environments that only expose `react/jsx-runtime`. The CI publish workflow (`.github/workflows/publish.yml`) has the same problem since it runs the same script. JSR is unaffected (it publishes `src/` directly).

**Fix (one line):** `"build": "NODE_ENV=production bunup"` in `package.json` — verified locally that this produces `import { jsx, jsxs } from "react/jsx-runtime"`. Then cut a patch release (0.2.2) to replace the affected artifact on npm.

**Resolution:** ✅ Fixed. `build` is now `NODE_ENV=production bunup`, and the emitted bundle imports `react/jsx-runtime` instead of `react/jsx-dev-runtime`; the publish workflow inherits the fix because it calls the same script. Both manifests are bumped to 0.2.2 so the next tag replaces the affected artifact on npm.

### C2. Conditional steps mounted *after* initial render are ordered wrong

`Step` assigns its sort order from a module-level `globalMountOrder` counter at first mount (`src/Step.tsx:6`, `src/Step.tsx:33`). A step that toggles on later (the exact pattern the README advertises under "Wrapped & Nested Steps": `{showOptional && <Step .../>}`) gets a counter value higher than every already-mounted step, so it sorts to the **end** regardless of its position in the tree.

Verified repro — a `MID` step toggled on 10ms after mount, placed between `AAA` and `ZZZ` in JSX:

```
●━━━━━━○━━━━━━○
AAA   ZZZ      MID     ← should be AAA MID ZZZ
```

This corrupts both the progress bar and navigation order (`goNext` from AAA goes to ZZZ, then to MID). The existing test only covers a condition that is `true` at first render, which is why it passes.

**Fix direction (not one-line):** derive order from tree position rather than mount time — e.g. walk `Children`/element tree in `Stepper` to index steps, or have `Step` re-register with a fresh order when the sibling set changes. Worth a design decision before implementing; at minimum, document the limitation.

**Resolution:** ✅ Fixed via the re-registration route. The module-level counter is gone: each `Step` claims its order from a counter owned by the parent `Stepper` in layout-effect order (which equals tree order for non-nested siblings), and the `Stepper` bumps an `orderGeneration` whenever a new step id appears, resetting the counter so every Step re-claims in tree order on the next commit. In uncontrolled mode the active step is additionally pinned by id, so an insertion or removal elsewhere in the list no longer shifts the user — and those repairs deliberately fire no lifecycle callbacks. The one remaining constraint (a `Step` must not be nested inside another `Step`) is documented in the README, the Basic Usage guide, and the component API page.

---

## 🟡 Low-hanging fruit — CI & tooling

### T1. CI never runs typecheck or lint
`.github/workflows/test.yml` only runs `bun test`. The repo has `typecheck` and `lint` scripts that are one step each to add. Right now a PR with type errors or lint violations goes green.

**Resolution:** ✅ Fixed — `test.yml` now runs `typecheck` and `lint` before the tests.

### T2. Publish workflow has no quality gate
`.github/workflows/publish.yml` publishes on tag push without running tests or typecheck first, and publishes JSR **before** npm — if the npm step fails you get a half-release. Also nothing verifies the tag matches `package.json`/`jsr.json` versions. Fix: run test + typecheck + lint as a job the publish job `needs`, and add a tag↔version assertion.

**Resolution:** ✅ Fixed — a `check` job (typecheck, lint, test, build) now gates the publish job via `needs`, the tag is asserted against both `package.json` and `jsr.json`, and npm publishes before JSR.

### T3. Tests are never typechecked
`tsconfig.json` has `"include": ["src"]`, so `tsc --noEmit` skips `tests/`. Add `"tests"` to the include (types are already available via `@types/bun`).

**Resolution:** ✅ Fixed — `tests` added to `include`; `tsc --noEmit` covers the suite.

### T4. `setup-bun` version drift
`deploy-docs.yml` uses `oven-sh/setup-bun@v1`; the other two workflows use `@v2`. Bump for consistency.

**Resolution:** ✅ Fixed — every workflow now pins `oven-sh/setup-bun@v2`.

### T5. Version sync between `package.json` and `jsr.json` is manual
The `version:*` scripts (`bun pm version …`) bump only `package.json`; `jsr.json` is bumped by hand (see commit history: `chore: bump jsr package to v0.2.1`). One forgotten edit publishes mismatched versions. Add a small sync script or a CI assertion that the two match.

**Resolution:** ✅ Fixed both ways — `scripts/sync-versions.ts` propagates the `package.json` version into `jsr.json` from every `version:*` script, and the publish workflow asserts tag ↔ manifest agreement.

---

## 🟡 Low-hanging fruit — code

### B1. Unhandled promise rejection can crash the host app
`goNext`/`goBack` are async and invoked fire-and-forget from `useInput` (`src/Stepper.tsx:66-69`). If a user's async `canProceed` or `onExitStep` throws/rejects, it becomes an unhandled rejection — which **terminates the Node process** by default. Wrap the callback invocations in try/catch (and decide: swallow, or surface via an optional `onError` prop).

**Resolution:** ✅ Fixed — the callback invocations are wrapped in try/catch and the error is surfaced through a new optional `onError` prop (falling back to `console.error`); navigation is blocked either way, so the process no longer terminates.

### B2. Programmatic navigation ignores `isValidating` / `isNavigationDisabled`
Only the keyboard path checks the guards (`src/Stepper.tsx:64`). `goNext`/`goBack` called from a render-function context are unguarded, so a user can navigate away mid-validation, and the still-pending validation resolves against a stale closure. Add the same guard inside `goNext`/`goBack` in `useStepper`.

**Resolution:** ✅ Fixed — `goNext`, `goBack` and `goTo` all bail out on a shared `isBlocked()` guard, read from synchronous refs so back-to-back calls cannot slip past batched state updates.

### B3. `goTo` skips lifecycle hooks
`goNext`/`goBack` fire `onExitStep`/`onEnterStep`, but `goTo` fires only `onStepChange` (`src/useStepper.ts:126-135`) and bypasses `canProceed` entirely. Either call the hooks there too, or document the asymmetry — right now it's silent.

**Resolution:** ✅ Fixed — `goTo` now fires the full lifecycle (`onExitStep` → `onStepChange` → `onEnterStep`) and is cancellable from `onExitStep`. The `canProceed` skip was kept deliberately as raw-jump semantics and is documented in the type JSDoc, the README, and the lifecycle guide.

### B4. Progress bar uses `step.name` as React key
`src/StepperProgress.tsx:41,61` — two steps with the same display name collide (React warning, potential misrendering). Registered steps already have unique `useId` ids; pass those through `ProgressContext`, or fall back to index.

**Resolution:** ✅ Fixed — `ProgressContext.steps` entries carry the registered `id`, and the default progress bar keys off it. Custom renderers get the same id.

### B5. Progress label alignment assumes all markers are the same width
Label column width is computed from `markers.completed.length` for every step (`src/StepperProgress.tsx:58`), but the markers row renders each state's actual marker. With the defaults (`" ✓ "` = 3 wide vs `●`/`○` = 1 wide) the labels drift out of alignment as step count grows; custom mixed-width markers make it worse. Compute per-step width from the marker actually rendered.

**Resolution:** ✅ Fixed — the label column width is computed per step from the marker that step actually renders, with a regression test covering mixed-width custom markers.

### B6. Dead code: `StepConfig`
`src/types.ts:96-100` — never imported, never exported from `index.ts`, and its shape (`canProceed: boolean`) doesn't match the real registered-step type. Delete it.

**Resolution:** ✅ Fixed — deleted; no references remain in code or docs.

### B7. `initialStep` exists but isn't exposed
`useStepper` accepts `initialStep` (`src/useStepper.ts:11`) but `Stepper` never passes it, so it's unreachable. Either expose it as a `Stepper` prop (cheap, useful — resume a wizard at step N) or remove the option.

**Resolution:** ✅ Fixed — exposed as the `initialStep` prop (default `0`, ignored in controlled mode) and demonstrated by the example app's `INITIAL_STEP` env var.

---

## 🟢 Polish / hygiene

- **`package.json` metadata:** `author` is empty; no `homepage`, `bugs`, `engines`, or `sideEffects: false` (the last helps consumers' tree-shaking).
  **Resolution:** ✅ `author`, `homepage`, `bugs` and `sideEffects` (scoped to `./src/**`, which marks the published `dist/` files side-effect free) added. `engines` deliberately left off — the package constrains runtimes through its `ink`/`react` peer deps.
- **`.editorconfig` is empty (0 bytes)** — populate it or delete it.
  **Resolution:** ✅ Populated (utf-8, LF, 2-space indent, final newline, trim trailing whitespace).
- **No CHANGELOG** — with two registries and tagged releases, even a minimal `CHANGELOG.md` (or GitHub Releases notes) helps consumers.
  **Resolution:** ✅ Added `CHANGELOG.md` in Keep a Changelog format, starting with the 0.2.2 entry.
- **README nit:** says default completed marker is `✓`, actual default is `" ✓ "` (padded). Also `onExitStep` return type in the props table reads `void | boolean | Promise<boolean>` while the code allows `Promise<undefined | boolean>` — trivially different but worth matching.
  **Resolution:** ✅ Both fixed in the docs sweep; the props table now reads `void | boolean | Promise<void | boolean>`, matching `src/types.ts`, and the marker default is documented as `" ✓ "` in the README and the customization guide.
- **`bun test --only-failures`** in the `test` script means successful CI runs show no per-test output. Harmless, but plain `bun test` in CI gives more useful logs.
  **Resolution:** ✅ CI (test and publish workflows) now calls `bun test` directly; the `--only-failures` script is kept for quiet local runs.

---

## Suggested action order

1. **C1** — one-line fix + patch release (highest impact, lowest effort).
2. **T1, T3, T4** — CI/tsconfig one-liners.
3. **B1, B2, B4, B6, B7** — small, safe code fixes.
4. **T2, T5** — publish-pipeline hardening.
5. **B3, B5** — need small design decisions (lifecycle semantics, width calc).
6. **C2** — real design work; decide approach (tree-order registration) or document the limitation first.

---

**Status:** every finding above now carries a Resolution line — all of them were addressed on branch `claude/repo-audit-improvements-v7cgrd` (test suite grown from 28 to 48). The findings themselves are left as written, as a record of the state at commit `8e1f0d9`.
