# Codebase Review

> **Purpose.** A snapshot of the LCARdS codebase as it stands today, intended
> as the planning input for follow-up PRs. Findings reference real files and
> line numbers; recommendations are sliced into reviewable PR-sized chunks.
>
> **Scope of this review.** Source under `src/`, documentation under `doc/`,
> build/validation tooling under `scripts/` and `.github/workflows/`. The
> backend custom component (`custom_components/lcards/`) is out of scope.
>
> **Compiled.** April 2026, against `dev` at the time of the accompanying
> docs/refactor PR. Numbers refreshed August 2026 against current `dev`
> using the same commands (see [§6](#how-these-conclusions-were-validated)).

---

## 1. Executive Summary

LCARdS is a Lit-based suite of LCARS-themed custom Lovelace cards for Home
Assistant, organised around a **global singleton core** (`window.lcards.core.*`)
that owns themes, datasources, rules, animations, validation, presets, and
asset loading. Cards are thin Lit web components that talk to that core; an
editor framework on top of `LCARdSBaseEditor` exposes every card config in
the Lovelace UI.

### Strengths

- **Clean architectural seams.** The `BaseService` → core singleton →
  `LCARdSCard` → card hierarchy is consistent and easy to reason about.
  HASS propagation, lifecycle hooks (`_handleFirstUpdate`, `_handleHassUpdate`,
  `_renderCard`, `_onRulePatchesChanged`), and cleanup are centralised on
  `LCARdSCard`, so individual cards stay small in surface area.
- **Documented internal contracts.** `.github/copilot-instructions.md` and
  `.github/instructions/*.md` describe the singleton model, template
  evaluator, datasources, animation system, and editor patterns with concrete
  do/don't examples — unusually thorough for a HA custom card project.
- **Validator infrastructure already exists.** `scripts/validate-css-vars.js`
  is a 4-pass governance gate on `--lcars-*`, `--lcards-*`, and `theme:`
  paths, wired into `npm run build` and CI. This sets a precedent for the
  doc-example validator added in this PR.
- **Unified evaluator and resolver.** `UnifiedTemplateEvaluator` (JS / token
  / datasource / Jinja2) and `ThemeTokenResolver` (with `lighten`/`darken`/
  `alpha`/`base` computed expressions) consolidate what would otherwise be
  scattered string-mangling logic. The "two-step pattern" for canvas/SVG
  colour resolution is documented and consistently used.
- **Comprehensive VitePress docs.** 102 markdown pages spanning user-facing
  card reference, core feature docs, architecture, and API reference. A
  custom markdown rule wraps `{{...}}` in `<span v-pre>` so HA template
  syntax renders cleanly.

### Highest-Risk Tech Debt

1. **Two `deepMerge` implementations with different semantics.**
   `src/utils/deepMerge.js` MUTATES its target;
   `src/core/config-manager/merge-helpers.js` returns a new object. Both
   are used — sometimes within the same render path. Consolidating without
   regressions requires a behaviour-preserving migration with tests, which
   is why it is recommended as a P0 follow-up rather than collapsed in the
   current PR.
2. **YAML examples in docs were never validated against code.**
   This PR adds `npm run validate:doc-examples` and fixed real bugs along
   the way (`type: custom:lcards-msd` → `lcards-msd-card`,
   `type: custom:lcards-button-card` → `lcards-button`). 41 snippet-style
   blocks remain as parse warnings; bringing them to zero requires careful
   per-block decisions (split into multiple blocks vs. mark
   `yaml no-validate`).
3. **Large card files.** Several cards exceed 4 000 LOC
   (`lcards-button.js` 6 977, `lcards-slider.js` 4 274,
   `lcards-elbow.js` 3 779, `LCARdSCard.js` base 4 631). Risk: lifecycle
   hooks, rendering, and zone math all live in the same file, which makes
   targeted review and unit testing harder. Splitting is a series of
   focused refactor PRs.
4. **Editor styles partially shared.** `editor-styles.js` (320 lines) and
   `editor-component-styles.js` (184 lines) provide canonical tokens, but
   ~10 editor components still declare their own `static get styles()`
   without importing them. Drift is likely.
5. **No automated test infrastructure.** Validation happens at build time
   (CSS-vars, types, hassfest) and via manual smoke testing in HA. There is
   no Vitest/Jest harness; introducing one would unlock the deepMerge
   consolidation, schema drift checks, and template-evaluator regression
   tests.
6. **Pre-existing TypeScript errors.** `npm run typecheck` now reports 123
   errors (up from 9 at the time of the original review), concentrated in
   `editor/dialogs/lcards-layout-studio-dialog.js` (29) and
   `editor/dialogs/lcards-msd-studio-dialog.js` (27) — both added after
   this review — plus scattered errors in `utils/state-color-resolver.js`,
   `utils/lcards-anim-helpers.js`, `cards/lcards-layout-card.js`, and
   others. None are introduced by this PR, but the growth means "clear the
   pre-existing errors" is now a materially bigger job than originally
   scoped; see the updated P2 backlog item below.

---

## 2. Repository Map

```
lcards/
├── custom_components/lcards/   HA backend (Python integration; out of scope here)
├── doc/                        VitePress source (102 md files)
│   ├── .vitepress/config.mts   Nav + sidebar definitions
│   ├── architecture/           Internals & subsystem reference
│   ├── cards/                  Per-card user docs
│   ├── configuration/          HA-side setup & integration
│   ├── core/                   Per-card features (presets, rules, themes…)
│   ├── development/            Developer guides + API reference
│   ├── dev/                    Internals (this report lives here)
│   └── getting-started/        Onboarding & migration
├── scripts/                    Build-time tooling (CSS-var validator, version, doc-example validator)
├── src/
│   ├── api/                    Public-surface helpers
│   ├── base/                   LCARdSCard (4 631 LOC), LCARdSNativeCard, LCARdSActionHandler
│   ├── cards/                  All Lovelace cards (button/elbow/slider/chart/data-grid/select-menu/msd/alert-overlay)
│   ├── charts/                 ApexCharts adapter
│   ├── core/                   Singleton subsystems
│   │   ├── animation/          Anime.js v4 wrapper, presets, registry, timeline resolver
│   │   ├── components/         Component registry (SVG/templates)
│   │   ├── config-manager/     Layered config merge, provenance, schema fan-out
│   │   ├── data-sources/       DS registry, processors, polling, history
│   │   ├── helpers/            Cross-cutting helpers
│   │   ├── packs/              Style/theme packs (textures, backgrounds, sounds)
│   │   ├── presets/            StylePresetManager + preset trees
│   │   ├── rules/              RulesEngine (conditional patches)
│   │   ├── screen-effects/     Full-screen effects pipeline
│   │   ├── services/           HA service wrappers
│   │   ├── sound/              Sound system
│   │   ├── systems-manager/    Overlay registry, lifecycle
│   │   ├── templates/          UnifiedTemplateEvaluator
│   │   ├── themes/             ThemeManager + ThemeTokenResolver
│   │   └── validation-service/ Schema registry + per-domain validators
│   ├── editor/
│   │   ├── base/               LCARdSBaseEditor, editor-styles.js, editor-component-styles.js
│   │   ├── cards/              One editor per card
│   │   ├── components/         Reusable tabs / pickers / list editors / yaml mode
│   │   ├── dialogs/            Modal dialogs
│   │   └── utils/              FormField, color helpers, schema-driven form
│   ├── msd/                    MSD card pipeline (multi-overlay rendering)
│   ├── panels/                 LCARdSConfigPanel (HA panel UI)
│   ├── strategies/             Lovelace strategies
│   ├── types/                  TS type stubs
│   ├── utils/                  Cross-cutting utilities (deepMerge, css-length, theme, fileutils, hashing…)
│   ├── lcards-vars.js          Allowlist for `--lcards-*` CSS variables
│   └── lcards.js               Entry point: registers cards, boots core
└── tools/                      Dev helpers (e.g. `create-editor.js`)
```

### Mapping to the workstream lens

| Workstream area     | Primary location                                              |
|---------------------|---------------------------------------------------------------|
| Core systems        | `src/core/**`                                                 |
| Cards               | `src/cards/**`, `src/base/LCARdSCard.js`, `src/msd/**`        |
| Configuration panel | `src/panels/lcards-config-panel.js`, `src/strategies/**`      |
| Editors             | `src/editor/**`                                               |

---

## 3. Findings

### 3.1 Structure & modularity

- **Singleton boot order is implicit.** `src/lcards.js` registers
  `customElements.define(...)` for all cards inside a try block, then
  `window.customCards.push(...)`. The order of singleton creation lives
  in `src/core/lcards-core.js#_performInitialization`. This works, but a
  diagram or sequence outline (Mermaid) in
  `doc/architecture/systems-arch.md` would shorten the onboarding curve.
- **Large card files conflate concerns.** Button (6 977 LOC), Slider
  (4 274), Elbow (3 779) include preset resolution, zone math, SVG
  generation, action wiring, and rule integration in a single class.
  Candidate splits:
  - `<card>-zones.js` (zone math; already a defined contract on the base)
  - `<card>-svg.js` (markup helpers)
  - `<card>-presets.js` (preset normalisation)
- **`LCARdSCard` is the centre of gravity.** 4 631 LOC. Many helpers
  (`_resolveThemeToken`, `_processTextFields`, `_rebuildZones`,
  `_getMergedStyleWithRules`, `_pxToGridUnits`) could move into focused
  mixins or helper modules without changing the public contract.
- **MSD coordinator vs. core.** `src/msd/pipeline/MsdCardCoordinator.js`
  directly imports `deepMerge` from the config-manager helpers, while
  most cards import a *different* `deepMerge` from `utils/deepMerge.js`.
  See 3.2.
- **Editor base + tabs are well-factored.** `LCARdSBaseEditor`,
  `FormField`, `editor-styles`, and `editor-component-styles` already
  encode "the canonical way" — the gap is enforcement, not design.

### 3.2 Duplication hotspots

| # | Pattern | Where | Notes |
|---|---------|-------|-------|
| 1 | `deepMerge` (mutating) | `src/utils/deepMerge.js:18` | Used by `lcards-slider`, `lcards-button` (immutable variant), `lcards-chart`, `ApexChartsAdapter`, `lcards-slider-editor`, `core/animation/presets`, `core/animation/resolveTimelines`, `StylePresetManager`. |
| 2 | `deepMerge` (immutable) | `src/core/config-manager/merge-helpers.js:29` | Used by `LCARdSCard`, `LCARdSBaseEditor`, `RulesEngine`, `MsdCardCoordinator`, `CoreConfigManager`. **Different semantics from #1.** |
| 3 | `clamp` | inline in `lcards-elbow.js:2545`, `core/animation/resolveAnimParams.js:138`, `packs/textures/effects/LevelTextureEffect.js:14`, `packs/backgrounds/BackgroundAnimationRenderer.js:244`, plus `linearMap.js` accepts a `clamp` flag | Each is a different signature; canonicalising on `(v, lo, hi)` is safe. |
| 4 | `isPlain` / `isPlainObject` | `utils/deepMerge.js:10`, `core/config-manager/merge-helpers.js:158` | Behaviourally equivalent for plain objects; differ on class instances. Pick one in a shared util. |
| 5 | Structural clone via `JSON.parse(JSON.stringify(...))` | 71 occurrences across `src/` | Loses Date/Map/undefined; risks silent bugs when configs grow. Replace with a single `cloneConfig()` helper that uses `structuredClone` where available. |
| 6 | `getNestedValue` / `setNestedValue` | `core/config-manager/merge-helpers.js:174` exists; ad-hoc dot-path walks recur in `RulesEngine`, `LCARdSBaseEditor`, `lcards-button`, `provenance-tracker` | Move all dot-path access through the existing helpers. |
| 7 | Static `static get styles()` blocks that *don't* import editor-styles | 10 components in `src/editor/components/**` | Drift risk on focus rings, button styling, label spacing. |
| 8 | Per-card "preset normalisation" pipelines | `lcards-button._resolvePreset`, `lcards-slider._resolvePreset`, `lcards-elbow._resolvePreset`, `lcards-select-menu._resolvePreset` | All do: load preset → deepMerge user overrides → resolve theme tokens. Candidate for a `BasePresetResolver`. |
| 9 | Animation easing/duration default fallbacks | scattered in `core/animation/resolveAnimParams.js`, `core/animation/presets.js`, `lcards-animation-editor.js`, `lcards-background-animation-editor.js` | Defaults should live in one place, exported as a frozen constant. |
| 10 | `setupActions(...)` boilerplate | every card | Already centralised on `LCARdSCard`, but each card calls it identically with `tap_action`/`hold_action`/`double_tap_action`. A higher-order helper `bindStandardActions(this, host)` would remove ~5 LOC per card. |

### 3.3 CSS / styling consistency

- **Canonical sources exist.** `editor-styles.js` (~320 lines) and
  `editor-component-styles.js` (~184 lines) define typography, button,
  field, panel, and tab tokens. `editorStyles` is consumed by all cards'
  editors and ~half of the shared components.
- **Drift list (components missing the import).**
  `lcards-chart-live-preview.js`,
  `lcards-msd-live-preview.js`,
  `lcards-shape-texture-editor.js`,
  `pack-explorer/lcards-pack-explorer-tab.js`,
  `templates/lcards-template-sandbox.js`,
  `editors/lcards-color-selector.js`,
  `editors/lcards-unified-segment-editor.js`,
  `editors/lcards-grid-row-editor.js`,
  `editors/lcards-border-editor.js`,
  `editors/lcards-slider-range-visualizer.js`.
- **Config panel vs. editor parity.** `lcards-config-panel.js` and the
  per-card editors share a similar tab/section layout (tab bar → panel →
  field group → row of fields), but they don't share CSS. A
  `panel-tab-styles.js` module re-using the editor tokens would
  eliminate duplicated padding/border definitions.
- **`--lcards-*` allowlist is well-policed.** The CSS-var validator
  prevents new variables from being added without an allowlist update.
  Keep this gate.

### 3.4 Testing gaps

- **No unit tests at all.** No `vitest`, `jest`, or `mocha` in
  `devDependencies`. Build-time gates (CSS vars, hassfest, version) and
  manual smoke tests in HA are the only checks.
- **High-leverage candidates for a first test pass:**
  - `deepMerge` (both variants) — pin current semantics before
    consolidation.
  - `ThemeTokenResolver` — token resolution and computed expression
    evaluation (`lighten`/`darken`/`alpha`/`base`).
  - `UnifiedTemplateEvaluator` — JS / token / datasource / Jinja2 phases.
  - `RulesEngine` — patch ordering and merge semantics.
  - `core/config-manager` — layer ordering and provenance tracking.
  - `validate-doc-examples.js` — golden fixture for the doc validator.
- **No CI gate for `npm run typecheck`.** Pre-existing errors would block
  enabling it; clean those up first.

### 3.5 Documentation gaps

**Resolved in this PR:**
- VitePress sidebar pointed `/architecture/internals/datasource-buffers`
  at a file that lives at `/architecture/animations/datasource-buffers`
  (broken link, masked by `ignoreDeadLinks: true`).
- `doc/cards/msd/index.md`, `doc/architecture/msd/index.md`, and
  `doc/architecture/animations/rule-based-animations.md` referenced
  `type: custom:lcards-msd` (the registered element is `lcards-msd-card`).
- `doc/cards/msd/line-overlay.md` referenced
  `type: custom:lcards-button-card` (correct value is `lcards-button`).
- A `Developer / Internals` nav section now exists, linking this report.
- A repo-native `npm run validate:doc-examples` command was added and
  is documented in `doc/development/index.md`.

**Remaining gaps (recommendations below):**
- No top-level "What can each card do?" feature matrix; users have to
  read each card page to discover capabilities.
- No "common patterns" cookbook (e.g. "alert-coloured button that
  blinks when a sensor is unavailable") — most knowledge lives in the
  examples folder.
- `doc/development/custom-card.md` is light on the *new* card recipe
  (CARD_TYPE, getStubConfig, registration in `src/lcards.js`,
  `_getCardSize`).
- ~~41 snippet-style YAML blocks...~~ Resolved: as of this refresh, 32
  blocks are tagged ` ```yaml alternatives ` (parse skipped, type refs
  still checked) and `npm run validate:doc-examples --strict` exits
  clean with 0 schema warnings.

---

## 4. Prioritised Recommendations Backlog

| Priority | Area     | Recommendation                                                                                                                                            | Effort | Risk | Suggested PR Slice                                                                                          | Files / Paths                                                                                                                |
|----------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|--------|------|-------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| **P0**   | core     | Consolidate `deepMerge` into one canonical, documented immutable variant; migrate all callers. Ship with a tiny test fixture pinning current semantics.   | M      | Med  | "Unify deepMerge" — single PR with table of before/after call sites + golden test.                          | `src/utils/deepMerge.js`, `src/core/config-manager/merge-helpers.js`, every importer (see §3.2 row 1-2).                     |
| **P0**   | tooling  | Introduce a unit-test runner (Vitest, no transpile config required for ESM). Seed with `deepMerge`, `ThemeTokenResolver`, `UnifiedTemplateEvaluator`.     | M      | Low  | "Bootstrap Vitest" — config + 3 small specs only; no CI changes.                                            | `vitest.config.js`, `tests/`, `package.json`.                                                                                |
| **P0**   | docs     | ✅ Done. Tagged all 41 snippet-style YAML blocks with ` ```yaml alternatives ` so the doc validator skips YAML parsing (but still checks type refs) for those blocks. Then enable `--strict` in CI.                                  | S      | Low  | "Make doc YAML zero-warning" — tagged blocks with the new `alternatives` meta hint. | `doc/core/colours.md`, `doc/core/text-fields.md`, `doc/core/rules/*`, `doc/cards/msd/line-overlay.md`, `doc/configuration/browser-mod.md`. |
| **P1**   | core     | Replace ad-hoc `clamp` and `isPlainObject` clones with shared utils.                                                                                      | S      | Low  | "Shared maths/object utils" — add `src/utils/numberUtils.js`, re-export `isPlain`.                          | §3.2 rows 3, 4.                                                                                                              |
| **P1**   | core     | Replace 71 `JSON.parse(JSON.stringify(...))` clones with `cloneConfig()` (using `structuredClone` when available, fallback otherwise).                    | M      | Med  | "Introduce cloneConfig()" — incremental: add helper, replace high-traffic call sites first.                 | `src/utils/cloneConfig.js`, callers found via `grep -rn "JSON.parse(JSON.stringify" src/`.                                   |
| **P1**   | cards    | Extract preset-normalisation into a `BasePresetResolver` mixin/helper.                                                                                    | M      | Med  | "Preset resolver shared helper" — one card per PR (start with `lcards-button`).                             | `src/cards/lcards-button.js`, `lcards-slider.js`, `lcards-elbow.js`, `lcards-select-menu.js`.                                |
| **P1**   | editors  | Make `editorStyles` import mandatory across all editor components; add an ESLint-style grep gate to validate-css-vars to catch drift.                     | S      | Low  | "Editor CSS consistency" — one-line imports + remove duplicated tokens.                                     | The 10 components listed in §3.3.                                                                                            |
| **P1**   | docs     | Add a "Cards feature matrix" page (rows = cards, columns = capabilities like presets / zones / actions / animations / rules).                             | S      | Low  | "Feature matrix" — single new page, link from `/cards/`.                                                    | `doc/cards/feature-matrix.md`, `doc/.vitepress/config.mts`.                                                                  |
| **P1**   | tooling  | Wire `npm run validate:doc-examples` into `.github/workflows/docs.yml` once warnings are zero.                                                            | XS     | Low  | "Gate docs build on YAML validator" — single workflow edit.                                                 | `.github/workflows/docs.yml`.                                                                                                |
| **P2**   | core     | Split `LCARdSCard` (4 631 LOC) into focused mixins: zones, text fields, rules patching, theme token glue, action wiring.                                  | L      | High | "LCARdSCard mixin split" — one mixin per PR, behaviour-preserving.                                          | `src/base/LCARdSCard.js`, new `src/base/mixins/*.js`.                                                                        |
| **P2**   | cards    | Split `lcards-button.js` into preset / zone / SVG / class modules.                                                                                        | L      | High | "lcards-button modularisation" — multi-PR series, one extracted module each.                                | `src/cards/lcards-button.js`, new `src/cards/button/*.js`.                                                                   |
| **P2**   | tooling  | ✅ Done. Imported all 7 non-MSD card schemas directly into `scripts/validate-doc-examples.js` (Node-importable ESM). Pre-processes each schema with `stripSchemaRestrictions` to remove empty `enum: []`, dangling `$ref`, and `additionalProperties: false` before compiling with ajv@8. Validates every card config node found in parsed YAML blocks (including nested cards). Schema issues reported in a separate `⚠️ schema warning(s)` section; `--strict` promotes them to errors. | `src/cards/schemas/*.js`, `scripts/validate-doc-examples.js`. |
| **P2**   | tooling  | Clear the 123 pre-existing TypeScript errors and gate `npm run typecheck` in CI.                                                                          | L      | Med  | "Typecheck clean + CI gate."                                                                                | `src/editor/dialogs/lcards-layout-studio-dialog.js`, `src/editor/dialogs/lcards-msd-studio-dialog.js`, `src/utils/state-color-resolver.js`, others. |
| **P2**   | config   | Share styling between the HA `LCARdSConfigPanel` tabs and the per-card editor tabs.                                                                        | M      | Low  | "Panel/editor CSS parity" — one new shared module.                                                          | `src/panels/lcards-config-panel.js`, `src/editor/base/editor-styles.js`.                                                     |
| **P2**   | docs     | Cookbook of recipes (alert-coloured button, datasource-driven sparkline, rule-driven flash, theme override).                                              | M      | Low  | "Cookbook section" — one or two recipes per PR.                                                             | `doc/cards/cookbook/**`, sidebar.                                                                                            |

---

## 5. Proposed Follow-up PR Plan

> Sized for review-in-an-hour. Each builds on the previous but is
> standalone if the order shifts.

### PR 1 — Bootstrap Vitest (P0)
- **Goal.** Make tests possible.
- **Scope.** Add Vitest config, `tests/utils/deepMerge.spec.js` pinning
  *both* current implementations' semantics, README note.
- **Key files.** `vitest.config.js`, `tests/utils/deepMerge.spec.js`,
  `package.json` (add `test` script).
- **Validation.** `npm test` green, no production code touched.

### PR 2 — Unify `deepMerge` (P0, depends on PR 1)
- **Goal.** One canonical, documented immutable `deepMerge`; mutating
  call sites either migrate to immutable or use a clearly-named
  `mergeInto` helper for the rare case where mutation is the contract.
- **Scope.** Move canonical impl into `src/utils/deepMerge.js`,
  re-export from `src/core/config-manager/merge-helpers.js` for
  back-compat, migrate all importers.
- **Key files.** §3.2 rows 1-2.
- **Validation.** Vitest specs from PR 1, build, manual smoke test of
  preset inheritance and rules patching.

### PR 3 — Doc YAML zero-warning + CI gate (P0/P1)
- **Goal.** `npm run validate:doc-examples --strict` exits clean and is
  enforced by `docs.yml`.
- **Scope.** ✅ All 41 snippet-style blocks tagged with ` ```yaml alternatives `
  (parse skipped; type refs still checked). The next step is to add the
  `--strict` flag and the workflow step.
- **Key files.** §3.5 list, `.github/workflows/docs.yml`.
- **Validation.** `npm run validate:doc-examples:strict` exits 0;
  `npm run docs:build` succeeds.

### PR 4 — Shared maths/object utils (P1)
- **Goal.** Eliminate `clamp` and `isPlainObject` duplicates.
- **Scope.** New `src/utils/numberUtils.js` with `clamp`. Promote
  `isPlain` to the canonical predicate.
- **Validation.** Vitest spec for `clamp` edge cases (NaN, equal
  bounds, reversed bounds).

### PR 5 — `cloneConfig()` (P1, depends on PR 1)
- **Goal.** One safe deep-clone helper; remove
  `JSON.parse(JSON.stringify(...))`.
- **Scope.** Add helper, replace top 10 highest-traffic call sites
  (rules engine, presets, theme manager, datasource subscribers).
- **Validation.** Spec covering Date/Map/undefined handling.

### PR 6 — Editor CSS consistency (P1)
- **Goal.** Every editor component imports `editorStyles`. Add a small
  grep validator to catch regressions.
- **Scope.** §3.3 drift list; add a check to `validate-css-vars.js`
  (or a sibling script) that fails if an `.editor*.js` file declares
  `static get styles()` without importing `editorStyles`.
- **Validation.** Validator green; visual smoke test of each editor.

### PR 7 — Cards feature matrix + cookbook seed (P1)
- **Goal.** A single page that answers "what can each card do?" and one
  worked recipe.
- **Scope.** New md pages, sidebar entries, cross-links from card pages.
- **Validation.** `npm run docs:build`, `npm run validate:doc-examples`.

### PR 8 — `BasePresetResolver` for buttons (P1)
- **Goal.** Extract preset normalisation from `lcards-button.js` into a
  reusable helper; prove the shape on one card before generalising.
- **Scope.** New `src/cards/preset/BasePresetResolver.js`; refactor
  button only.
- **Validation.** Visual smoke + Vitest spec for preset merge order.

### PR 9 — Apply `BasePresetResolver` to slider/elbow/select-menu (P1)
- **Goal.** Roll out the helper from PR 8.
- **Scope.** One card at a time inside this PR if diff is small.

### PR 10 — Typecheck clean + CI gate (P2)
- **Goal.** `npm run typecheck` is clean and enforced.
- **Scope.** Fix the 123 pre-existing errors, add the workflow step.

---

## 6. How These Conclusions Were Validated

### Commands run

```sh
# Repo overview
git log --oneline origin/dev..HEAD
git diff --stat origin/dev..HEAD
find src -type f -name '*.js' | wc -l        # 332
wc -l src/cards/*.js src/base/*.js           # see §1, §3.1

# Build-time validators
npm run validate:css-vars                    # ✓ 332 files, all valid
npm run validate:doc-examples                # ✓ added in this PR
npm run typecheck                            # 123 pre-existing errors

# Targeted searches
grep -rn 'function deepMerge\|const deepMerge\|deepMerge =' src/ --include='*.js'
grep -rn 'from.*merge-helpers\|from.*deepMerge' src/ --include='*.js'
grep -rn 'function clamp\|const clamp =' src/ --include='*.js'
grep -rn 'function isPlain\|function isPlainObject' src/ --include='*.js'
grep -rn 'JSON.parse(JSON.stringify' src/ --include='*.js' | wc -l   # 59
grep -roh 'type: custom:lcards-[a-z-]*' doc/ --include='*.md' | sort -u
grep -rn 'static CARD_TYPE' src/cards/ --include='*.js'
grep -rL 'editorStyles\|editor-styles\|editor-component-styles' src/editor/components/ --include='*.js' \
  | xargs grep -l 'static get styles\|static styles'
```

### What was specifically searched for

- **`deepMerge` duplication.** Confirmed two implementations with
  different mutation semantics, in active use across 14+ files
  (§3.2 row 1-2).
- **CSS-token reuse.** `editorStyles` import audit across
  `src/editor/components/**` (§3.3).
- **Schema validators in production code.**
  `src/core/validation-service/index.js`, `SchemaRegistry.js`,
  `OverlayValidator.js`, `ValueValidator.js`, plus the schemas in
  `src/core/validation-service/schemas/`. Confirmed schemas are
  registered at runtime by cards (`registerSchema()` static methods),
  which is why a Node-side import of the production validator is
  non-trivial — recorded as P2 follow-up.
- **Doc/code drift.** Cross-referenced `customElements.define(...)` in
  `src/lcards.js` against every `type: custom:lcards-*` value found in
  `doc/**.md`. Discrepancies fixed in this PR.
- **Sidebar reachability.** Cross-referenced every `*.md` under `doc/`
  against the link list in `doc/.vitepress/config.mts`; found one
  broken sidebar link (`/architecture/internals/datasource-buffers`),
  fixed in this PR.

### Limits of this review

- **No runtime profiling.** Statements about "high-traffic" call sites
  rely on import graph and code-reading, not measured frame budgets.
- **No deep dive into MSD pipeline.** `src/msd/` is large and was
  treated as a black box for the purposes of this review; targeted
  refactor recommendations there are best made by an MSD-area owner.
- **The doc validator now performs schema validation.** It checks unknown card types, parse failures, and validates parsed card configs against the real JSON Schemas for 7 card types (lcards-msd-card excluded). Schema issues are reported as warnings by default and promoted to errors with `--strict`. As of this refresh, `npm run validate:doc-examples --strict` reports 0 schema warnings (102 files, 518 YAML blocks, 32 tagged as alternatives, 106 schema-checked).

---

*This document is intended to evolve. PR authors should update entries
here as items are completed and add new findings as they surface.*
