# LCARdS — Claude Code Instructions

LCARdS is a Star Trek LCARS-style card system for Home Assistant. It ships as a single Vite-built ESM bundle (`custom_components/lcards/lcards.js`) injected into every HA page by a Python custom integration. All frontend work is in `src/`; all backend work is in `custom_components/lcards/`.

---

## Maintainer cookbook

`COOKBOOK.md` (repo root) is the runbook for CI workflows, every npm script, test layers and the release process. Keep it current when scripts or workflows change (and `scripts/help.js`, which `npm run help` prints). Release notes are drafted with the `lcards-release-notes` project skill (`.claude/skills/`).

---

## Detailed instruction files

The `.github/instructions/` directory contains authoritative rules for each subsystem. Read the relevant file before touching that area — these override any generic guidance:

- `.github/instructions/cards.instructions.md` — lifecycle hooks, entity access, action handling, cleanup, zones
- `.github/instructions/core-services.instructions.md` — BaseService pattern, HASS propagation, init order
- `.github/instructions/templates.instructions.md` — four eval types, UnifiedTemplateEvaluator API
- `.github/instructions/datasources.instructions.md` — DataSource config, subscriptions, data shape
- `.github/instructions/state-color.instructions.md` — color resolution patterns A vs B, theme tokens
- `.github/instructions/animation.instructions.md` — anime.js v4 API, AnimationManager, alert mode
- `.github/instructions/editor.instructions.md` — FormField API, approved HA elements, _updateConfig
- `.github/instructions/msd.instructions.md` — MSD pipeline, overlays, routing, navigation
- `.github/instructions/releases.instructions.md`: release notes pages (`doc/releases/`), lifecycle, pictures, GitHub export

---

## Build workflow

```bash
npm run build                    # full validated build — use for ALL builds including dev/test
npm run validate:css-vars        # CSS variable linter (also runs inside `npm run build`)
npm run validate:ha-compat       # known-dead HA elements/hooks/imports lint (also runs inside `npm run build`)
npm test                         # all node:test suites under tests/
npm run validate:css-vars:verbose
npm run typecheck                # TypeScript checks (full sorted list)
npm run typecheck:check          # fail only on errors not in scripts/tsc-baseline.txt (CI gate)
```

`npm run build` runs in order: doc-example validation (strict: schema errors and unknown keys fail) → schema description check (`scripts/check-schema-descriptions.js`: a new schema property without a `description` fails; the backlog is `scripts/schema-description-baseline.txt`) → docs em-dash check → CSS var validation → version sync → Vite integration build → asset copy. `npm run docs:build` also fails on any link to a missing `#anchor` (`scripts/check-doc-anchors.js`). When a doc example needs a key the schema doesn't declare, add it to the card schema (shared card-level keys live in `cardLevelProperties` in `src/cards/schemas/common-schemas.js`) rather than marking the block `no-validate`. `scripts/lib/card-schemas.js` is the one list of schemas (every card including MSD, the layout view, the shell strategy) used by the doc validator, the description check and `generate-llm-schema.js`, built with the same option lists the cards pass at runtime (`TEXT_POSITIONS` in `src/cards/schemas/schema-options.js`, built-in presets and components); `tests/docs/schema-registry.test.js` fails if a registered card has no entry or the lists drift. `generate-llm-schema.js` (packing in `scripts/lib/schema-publish.js`) writes the full bundle plus per-card files under `schema/` with big subsystems in `schema/shared/`; `tests/docs/schema-publish.test.js` proves the packing lossless, compiles every file in ajv and holds the size budgets (card files < 100 KB). `tests/core/presets-doc.test.js` keeps the `doc/core/presets.md` tables in sync with the packs. It will fail if any validator finds a violation. The Vite build runs in `--mode integration`, which (per `vite.config.js`) writes directly into `custom_components/lcards/lcards.js`, with no `dist/` output and no manual copy step. The bundle is minified with esbuild (`keepNames` on, sourcemaps map back to `src/`), and the build writes `.br`/`.gz` siblings for `lcards.js` and `chunks/*.js`, which HA's static handler serves when the browser accepts them. The legacy `dist/` folder is retired; other Vite modes write to the gitignored `tmp/vite-build/`.

Use `npm run build` for all builds, including active development and HA testing, so the validators always run. (`npm run build:integration` skips the doc/CSS-var validation and version sync — it exists only for CI/release and shouldn't be used for dev/test.)

If `custom_components/lcards/` is bind-mounted into your HA devcontainer, a hard-refresh (Ctrl+Shift+R) after building is enough — no copy step needed. The hard refresh is required, not optional: `lcards.js` is a small loader stub that imports the hashed main chunk (`chunks/lcards-main-*.js`), and each build deletes the previous chunks, so a soft reload with a cached stub can 404 the old main chunk. Card editors, the config panel, the grid edit overlay and the theme generator are lazy chunks; keep them out of the main chunk (the `size budget` test in `tests/browser/bundle.spec.js` fails if the main chunk grows past its ceiling). The `www/community/lcards/` HACS-frontend-plugin install path is legacy; the integration auto-removes that old resource registration on startup (`custom_components/lcards/frontend.py`).

### Versioning

Scheme: `YYYY.MM.SEQ[-dev.N]` (e.g. `2026.08.1`, `2026.08.1-dev.2`) — the sequence resets to `0` on each new month, mirroring HA's own CalVer. `package.json` is the single source of truth; `npm run build` (via `scripts/set-version.js`) propagates it to `custom_components/lcards/manifest.json` (HA calver, suffix stripped) and `const.py` (full raw string).

Version bumps are always manual/deliberate — nothing bumps automatically. To bump:

```bash
npm run bump-version              # stable: promote a -dev.N build, or advance SEQ (reset on month rollover)
npm run bump-version:dev          # dev: increment -dev.N, or start -dev.1 on the next base
```

Typical flow: iterate on `dev` with `bump-version:dev`; when ready to ship, `bump-version` to strip the suffix; merge `dev` → `main` via PR with that stable version already in `package.json`; run the `Release` GitHub Action on `main`.

Release notes are the docs page `doc/releases/<version>.md` (Releases section of the docs site); the `Release` workflow exports it as the GitHub release body and fails a stable release whose page is missing or still `status: testing`. Start the page at the first dev build. See `.github/instructions/releases.instructions.md`.

### HA frontend/core impact analysis (local, manual)

```bash
npm run check:ha-impact:quick    # fast, free, deterministic file/CSS-var diff only
npm run check:ha-impact          # also hands the diff off to the Claude Code CLI for a HIGH/MEDIUM/LOW markdown report
```

Diffs the local `frontend` (and optionally `homeassistant-core`, via `--include-core`) workspace checkouts against the last commit analyzed, filtered to paths LCARdS depends on. Pass `--pull` to update those checkouts first (skipped if dirty). Reports land in `reports/ha-impact/` — review, mark ✅, then delete once resolved. Not part of CI; run it after pulling `frontend`/`homeassistant-core`, or periodically as a health check. See `scripts/check-ha-impact.js`.

Automated tests (`npm test`, node:test) live under `tests/` in suites for charts, core, data-grid, docs, editor, ha-compat, layout, routing and support. The `test*` scripts preload `tests/setup/browser-shims.js` (`window`, `__LCARDS_VERSION__`, `requestAnimationFrame`) and `tests/setup/vite-imports.js` (Vite-style `?raw` and `.json` imports for `src/`), so run a single file with `node --import ./tests/setup/browser-shims.js --import ./tests/setup/vite-imports.js --test <file>`. Shared helpers: `tests/helpers/fake-hass.js` (browser-safe fake `hass` with service-call spy and scripted connection) and `tests/helpers/jsdom-env.js` (installs a jsdom `document`/window for tests that need one, e.g. headless `lcardsCore.initialize()`). Card rendering and editor behaviour are still tested manually in HA Lovelace.

Browser and real-HA layers (Playwright, system `/usr/bin/chromium`; run `npm run build` first, they use the built bundle):

```bash
npm run test:browser             # Layer A: cards mounted from tests/browser/fixtures/*.yaml against a fake hass
npm run test:visual              # Layer B: screenshot baselines (local only); add -- --update-snapshots after an intended change
npm run test:ha                  # Layer C: smoke tests against the dev HA; needs a long-lived token in $HA_TOKEN or .ha-token (gitignored)
npm run test:docs                # docs site: live card demos + playgrounds on the built site and the dev server (run npm run docs:build first)
```

Layer A/B serve `custom_components/lcards/` at `/lcards/` via `tests/browser/serve.mjs` and mount one card per fixture in `tests/browser/www/harness.html` (`?case=<fixture>`). The harness deep-freezes each config like HA does, so in-place config mutation fails in tests too; `window.__setState(id, state)` pushes a state change (new hass snapshot plus `state_changed` event) and `window.__reconfigure(config)` calls `setConfig` on the live card. Visual tests pin `now=` (sample values follow the time of day) and `seed=` (randomness reseeded just before the card mounts). Cards that size to 100% (charts) need a definite height: `mountCase(page, name, { height: '300' })`. Docs live demos (`doc/.vitepress/theme/CardDemo.vue`) mount the real cards from the production bundle at `/lcards/`: `npm run docs:build` copies it into `doc/public/lcards/` (gitignored) for the built site, while the dev server (`docs:serve`) serves `/lcards/` straight from `custom_components/lcards/` (a middleware in `doc/.vitepress/config.mts`), so `npm run build` refreshes it; they share `tests/helpers/card-env.js` with the browser harness. Load the bundle with a module `<script>` tag, never `import()` (the Vite dev server rejects imports from `public/`). Every `yaml live` block for button, elbow, slider, select menu and MSD renders a real card; starters live in `card-demo-starters.js`. `<CardGallery set="..." />` (`CardGallery.vue`) renders a grid of real cards, one per option value (every preset, elbow type, ...), from the sets in `card-demo-galleries.js`; both components share `card-demo-runtime.js` (bundle loader, sample hass, sizing: sections-grid rows, at least 3 for an elbow). `tests/docs/card-demo-starters.test.js` schema-checks every starter and gallery tile. Look at a screenshot of any new gallery: the tests check that cards render, not that they look right. ```` ```yaml lab ```` blocks (processor reference page) render `ProcessorLab.vue`: the real processors run over sample history via `src/core/data-sources/processor-preview.js` (pure, lazy-import only; also meant for the editor preview), and `tests/docs/processor-lab.test.js` runs every lab block in node. Layer C creates only `lcards_test_*` helpers and the `lcards-test` dashboard (config in `tests/ha/dashboard.yaml`).

CI (`.github/workflows/validate-integration.yml`) runs `npm test`, `npm run typecheck:check` (fails only on TypeScript errors not listed in `scripts/tsc-baseline.txt`) and `npm run test:browser`. When you fix baseline errors, tighten it with `node scripts/check-typecheck-baseline.js --update`.

---

## File structure

```
src/
  base/       — LCARdSNativeCard, LCARdSCard (base classes), ActionHandler
  cards/      — card implementations (lcards-button.js, lcards-msd.js, etc.)
  core/       — singleton services (themes, rules, datasources, validation, etc.)
  editor/
    base/     — LCARdSBaseEditor, editor-styles.js
    cards/    — card-specific editors
    components/shared/ — FormField, color pickers, zone editor, etc.
  msd/        — MSD pipeline (ConfigProcessor, CardModel, PipelineCore, AdvancedRenderer)
  utils/      — lcards-logging.js, color-utils.js, provenance-tracker.js
  lcards.js   — loader stub (Vite entry): reads ?log=, imports lcards-main.js
  lcards-main.js — registers all custom elements, initializes core
custom_components/lcards/
  __init__.py, frontend.py, websocket_api.py, storage.py, services.py
doc/          — VitePress documentation site
scripts/      — build validators and utilities
```

---

## Core architecture

LCARdS uses a **global singleton pattern**. Cards access shared services via `window.lcards.core.*`:

```javascript
window.lcards.core.themeManager
window.lcards.core.dataSourceManager
window.lcards.core.rulesManager
window.lcards.core.animationManager
window.lcards.core.validationService
window.lcards.core.stylePresetManager
window.lcards.core.animationRegistry
```

All singletons extend `BaseService`. HASS is distributed by `LCARdSCore.ingestHass()` — cards never push HASS to services directly.

Card hierarchy: `LitElement` → `LCARdSNativeCard` → `LCARdSCard` → card implementations. MSD cards extend `LCARdSCard` via `LCARdSMSDCard`.

---

## Must-follow patterns (summary)

### User-facing text: no em dashes

Never write em dashes (U+2014, or the `—` escape) in user-facing text: UI strings, labels, helper text, schema `description`s, and anything under `doc/`. Use real punctuation instead (a colon, comma, semicolon, parentheses or a new sentence). Empty-value placeholders render `-`, joined separators use ` · `, and "none" dropdown options use parentheses, e.g. `'(Use entity state)'`. Numeric ranges may keep the en dash (`0–100`). The published schemas (`doc/public/lcards-schema.json` and `doc/public/schema/`, gitignored) are generated from `src/cards/schemas/`, so fix the source rather than editing the JSON.

### Logging — always structured, never console.log

```javascript
import { lcardsLog } from '../utils/lcards-logging.js';
lcardsLog.debug('[MyClass] message', { data });
```

### Color resolution — one grammar, one resolver

Colour syntax (schema pattern, detection, parsing) lives only in `src/core/themes/color-syntax.js`. Resolve with `resolveColor(value)` for Lit/CSS (CSS variables stay live, so alert modes recolour without a re-render) or `resolveColor(value, { concrete: true, element })` for Canvas2D/SVG attributes/anime.js (`src/core/themes/resolve-color.js`). In cards use `_resolveColorValue()` (concrete) / `_resolveEntityStateColor()` (CSS). Guard tests fail on local colour lists, regexes, parsers or resolve-then-`resolveCssVariable` lambdas.
See `state-color.instructions.md` and `doc/development/colour-resolution.md`.

### Theme tokens — always via singleton, never module import

```javascript
// CORRECT
const resolver = window.lcards?.core?.themeManager?.resolver;
// WRONG — module-level instance has no token tree
import { themeTokenResolver } from '...ThemeTokenResolver.js';
```

The `theme:` prefix is required in any config value that references a token path: `'theme:colors.ui.primary'`.
`spacing.*` and `animations.*` are phantom namespaces — they always return fallback.

### CSS variables — register before use

New `--lcars-*` vars must be added to `scripts/ha-lcars-theme-vars.js`.
New `--lcards-*` vars must be added to `src/lcards-vars.js`.
The build fails if you reference an unregistered variable.

### HA CSS variables — always use, never hardcode (HA 2026.6+)

**Box shadows:** `var(--ha-box-shadow-s/m/l)` — never write `box-shadow: 0 Xpx Xpx rgba(0,0,0,X)`.

**Border radius** (full scale available):

| Value | Variable |
|---|---|
| 4px | `var(--ha-border-radius-sm)` |
| 8px | `var(--ha-border-radius-md)` |
| 12px | `var(--ha-border-radius-lg)` (= `--ha-card-border-radius`) |
| 16px | `var(--ha-border-radius-xl)` |
| 20px | `var(--ha-border-radius-2xl)` |
| 24px | `var(--ha-border-radius-3xl)` |
| 28px | `var(--ha-border-radius-4xl)` |
| 32px | `var(--ha-border-radius-5xl)` |
| 36px | `var(--ha-border-radius-6xl)` |
| pill | `var(--ha-border-radius-pill)` (9999px) |
| circle | `var(--ha-border-radius-circle)` (50%) |

No HA var for 6px, 3px, 22px — leave those hardcoded.

**Border width:** `var(--ha-border-width-sm)` = 1px, `var(--ha-border-width-md)` = 2px, `var(--ha-border-width-lg)` = 3px. Always use these in `border: var(--ha-border-width-sm) solid …` — never hardcode `1px`/`2px` in border declarations.

**Spacing** (4px scale, `--ha-space-N` where value = N×4px):

| px | Variable | px | Variable |
|---|---|---|---|
| 4px | `var(--ha-space-1)` | 24px | `var(--ha-space-6)` |
| 8px | `var(--ha-space-2)` | 28px | `var(--ha-space-7)` |
| 12px | `var(--ha-space-3)` | 32px | `var(--ha-space-8)` |
| 16px | `var(--ha-space-4)` | 40px | `var(--ha-space-10)` |
| 20px | `var(--ha-space-5)` | 48px | `var(--ha-space-12)` |

No HA var for 2px, 6px, 10px, 14px, 18px — leave those hardcoded.

**Animation duration** (automatically collapses to 1ms with `prefers-reduced-motion: reduce`):

| Duration | Variable |
|---|---|
| 75ms | `var(--ha-animation-duration-instant)` |
| 150ms (= 0.15s) | `var(--ha-animation-duration-fast)` |
| 250ms (≈ 0.2s) | `var(--ha-animation-duration-normal, 0.2s)` |
| 350ms (≈ 0.3s) | `var(--ha-animation-duration-slow, 0.3s)` |

Use `var(--ha-animation-duration-fast/normal/slow, <original>)` — fallback preserves original speed when HA var is unavailable.

**Semi-transparent backgrounds inside cards** (compatible with HA-LCARS where `card-background-color = secondary-background-color`):
```css
background-color: color-mix(
    in srgb,
    var(--secondary-background-color) 50%,
    color-mix(in srgb, var(--primary-background-color) 25%, transparent)
);
```
Never use `rgba(60,60,60,X)` or `rgba(255,255,255,X)` in structural CSS — these are theme-blind.

**Buttons:** `<ha-button variant="danger/warning/brand">` — never use `--mdc-theme-primary` CSS overrides.

**HA 2026.6+:** Use `ha-input`/`ha-textarea` (not `ha-textfield`), `ha-textarea resize="auto"`. Loading spinner: `ha-spinner size="small"` (`ha-circular-progress` was removed from HA's frontend entirely — silently renders 0×0, no error).

Full reference: `.github/instructions/editor.instructions.md` → CSS & Theming Conventions.

### Custom element registration — centralized and guarded

```javascript
// In src/lcards-main.js only — never in the card file
if (!customElements.get('lcards-my-card')) {
  customElements.define('lcards-my-card', MyCard);
}
```

This centralization applies to the **card** element only. Editors self-register with the same guard, in their own file (e.g. `src/editor/cards/lcards-mycard-editor.js`).

### Editor config commits — always via _updateConfig

```javascript
// CORRECT
this._updateConfig({ style: { color: ev.detail.value } });
// WRONG — bypasses YAML sync and validation
this.config = { ...this.config };
```

### Entity access — subscribe, don't poll

```javascript
// CORRECT — auto-unsubscribed on disconnect
this.subscribeToEntity(this.config.entity, (id, state) => { ... });
// WRONG — bypasses cache, no change notifications
this.hass.states[this.config.entity]
```

### Service calls — use inherited wrapper

```javascript
// CORRECT
await this.callService('light', 'turn_on', { entity_id: '...' });
// WRONG
await this.hass.callService('light', 'turn_on', { ... });
```

### Animation — anime.js v4 API (not v3)

```javascript
// CORRECT v4
anime.animate(targets, { x: 100 });
anime.createTimeline();
// easing: 'inOutQuad'

// WRONG v3 syntax
anime({ targets, translateX: 100 });
anime.timeline();
// easing: 'easeInOutQuad'
```

---

## Debugging in the HA browser console

```javascript
window.lcards.setGlobalLogLevel('debug')
window.lcards.core.dataSourceManager.sources
window.lcards.core.rulesManager.rules
window.lcards.core.themeManager.getActiveTheme()
window.lcards.cards.msd.getAll()
window.lcards.debug.msd.pipeline.getInstance('card-id')  // dump the resolved pipeline instance for a card
window.lcards.debug.msd.overlays.tree('card-id')          // dump the resolved overlay tree
window.lcards.debug.msd.routing.inspect('line-id')   // cached route + meta.debug (resolved stubLength/gridResolution/cornerRadiusMode/cornerRadius)
window.lcards.debug.msd.routing.inspectAll()         // like inspect(), for every overlay in the route cache at once
window.lcards.debug.msd.routing.trunks('card-id')    // every discovered/configured trunk row
```

---

## Adding new cards (checklist)

1. Create `src/cards/lcards-mycard.js` extending `LCARdSCard`
2. Declare `static CARD_TYPE = 'my-card'` and `static getStubConfig()`
3. Create editor at `src/editor/cards/lcards-mycard-editor.js` extending `LCARdSBaseEditor` (self-registers its own custom element with the same guard)
4. Register the card element in `src/lcards-main.js` with the double-registration guard
5. Add schema to `CoreConfigManager` if using validation, and add it to `scripts/lib/card-schemas.js` (doc validation, description check, published schema); give every property a `description`
6. Override `_getCardSize()` for pixel-configured heights, e.g. `return Math.ceil((this._configPx(this.config?.height) || 200) / 50);` (see `lcards-chart.js`/`lcards-msd.js` for real examples)
7. Run `npm run build` and test in HA

---

## Adding new core services (checklist)

1. Create in `src/core/` extending `BaseService`
2. Import and instantiate in `src/core/lcards-core.js` `_performInitialization()` (respect initialization order)
3. Expose on `window.lcards.core.myService`
4. Document in `doc/architecture/subsystems/`
