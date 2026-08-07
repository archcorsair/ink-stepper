# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2026-08-07

### Added

- `pulse` prop on `Stepper` - animates the current-step marker in the default progress bar by
  cycling its brightness (bright → normal → dim → normal), the same frame-swapping technique CLI
  spinners use. Off by default; composes with custom `markers`; ignored with `renderProgress`.

### Fixed

- Progress bar labels wider than their marker column (e.g. an 8-character name over a 1-wide
  marker) overflowed flush into the next label with no gap; overflowing labels now keep at least
  one space of separation.

### Changed

- Example wizard polish: default pulsing markers (matching the README demo), a keycap-styled hint
  bar per step showing only the keys active right now, an "m" key cycling marker themes to demo the
  `markers` prop live, a braille spinner during async validation, and a color-coded lifecycle log.

- CI runs an ink compatibility matrix covering the full declared peer range - the exact 6.x floor
  (6.6.0) and the latest 7.x - in addition to the lockfile-pinned version, so the dual-major claim
  stays verified. An API-surface audit against ink 7 confirmed every ink API this library uses is
  unchanged or additive across the two majors.

## [0.2.2] - 2026-08-06

### Added

- `onError` prop on `Stepper` - receives any error thrown by an async `canProceed` or `onExitStep`
  callback. Without it, errors are logged via `console.error` instead of crashing the host process.
- `initialStep` prop on `Stepper` - starting step index for uncontrolled mode (default `0`, ignored
  when the controlled `step` prop is provided).
- `ProgressContext.steps` entries now carry a stable `id`, usable as a React key in custom
  progress renderers.
- Runnable example wizard at `examples/wizard.tsx` (`bun run example`, `INITIAL_STEP=<n>` to start
  elsewhere) exercising render-function steps, `useStepperInput`, async validation, `onError`,
  a conditional step, and `goTo`.

### Fixed

- Published npm bundle shipped the development JSX runtime (`react/jsx-dev-runtime`). The build now
  runs with `NODE_ENV=production`, emitting `react/jsx-runtime`.
- Conditional steps mounted after the initial render were ordered last instead of by their position
  in the tree.
- Errors thrown from an async `canProceed` or `onExitStep` escaped as unhandled rejections, which
  terminates the host Node process. Navigation is now blocked and the error is reported.
- `goNext`, `goBack`, and `goTo` are no-ops while validation is in flight or navigation is disabled -
  previously only the keyboard path honoured those guards.
- `goTo` now fires the full lifecycle (`onExitStep` -> `onStepChange` -> `onEnterStep`) and can be
  cancelled by returning `false` from `onExitStep`. It still deliberately skips `canProceed`
  (raw-jump semantics).
- Default progress bar used step names as React keys, colliding when two steps share a name; it now
  keys off the registered step id.
- Progress bar label widths were computed from the completed marker for every step, so labels drifted
  out of alignment with mixed-width markers. Widths are now per-step.

### Removed

- Dead internal `StepConfig` interface.

### Changed

- The `ink` peer range is widened to `^6.6.0 || ^7.0.0` - the test suite passes against ink 7.1.1.
  The JSR import map pins `npm:ink@^7.0.0` (Deno npm specifiers cannot express compound ranges, and
  JSR validates imports against the installed ink 7); a JSR publish dry run now gates the publish
  workflow so an unsatisfiable import range fails before anything ships.
- Dev dependencies bumped to current versions (`@biomejs/biome` 2.5.x with a migrated config,
  `@types/bun`, `@types/react`, `bunup`) and `react-devtools-core` removed (unused; it pulled in a
  `shell-quote` version with a critical advisory). `bun audit` is clean for both the root and the
  docs workspace, whose vitepress toolchain was also brought current.
- `onExitStep` return type widened to `void | boolean | Promise<void | boolean>`. Side-effect-only
  handlers no longer have to return a value; only an explicit `false` cancels navigation.
- Steps mounted after the initial render keep the user on the same step in uncontrolled mode - the
  active step is now pinned by id rather than by index, and these repairs fire no lifecycle callbacks.
- CI now runs `typecheck` and `lint` alongside tests, and typechecks `tests/`.
- Publish workflow gates on a `check` job, asserts the pushed tag matches both `package.json` and
  `jsr.json`, and publishes to npm before JSR.
- Version bumps sync `jsr.json` from `package.json` via the npm-style `version` lifecycle script
  (`scripts/sync-versions.ts` + `git add`), so the release commit that `bun pm version` tags always
  carries both manifests in agreement.
- `jsr.json` now excludes `tests/`, `examples/`, `docs/`, `.github/`, and `scripts/` from the JSR
  package.
- Publish workflow verifies after publishing that both npm and JSR actually serve the tagged
  version, failing the run otherwise. Each registry's publish step is also guarded by an
  already-published check, so re-running the workflow after a partial failure retries only the
  registry that is still missing the version. The tag ↔ manifest assertion now runs in the `check`
  job, before the credentialed publish job starts.
- Package metadata: `author`, `homepage`, `bugs`, and `sideEffects` (scoped to `./src/**`, which marks
  every published file under `dist/` as side-effect free for consumer tree-shaking).
- Populated the previously empty `.editorconfig`.
- README and the VitePress docs updated for the new props, `goTo` lifecycle, step-ordering rules, and
  the input-coordination ordering caveat.

## [0.2.1] - Earlier

See git history.

## [0.2.0] - Earlier

See git history.

[0.2.2]: https://github.com/archcorsair/ink-stepper/releases/tag/v0.2.2
[0.2.1]: https://github.com/archcorsair/ink-stepper/releases/tag/v0.2.1
[0.2.0]: https://github.com/archcorsair/ink-stepper/releases/tag/v0.2.0
