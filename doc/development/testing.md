# Testing

LCARdS has five test layers, from fast node tests to smoke tests against a real Home Assistant. This page says what each layer is for, how it is set up and which one a change needs. The commands, what CI runs and the run-one-file recipe are in the maintainer cookbook: [COOKBOOK.md: Tests](https://github.com/snootched/lcards/blob/main/COOKBOOK.md#tests), [npm scripts](https://github.com/snootched/lcards/blob/main/COOKBOOK.md#npm-scripts) and [CI workflows](https://github.com/snootched/lcards/blob/main/COOKBOOK.md#ci-workflows).

**Rule of thumb: every fix and every new behaviour gets a test in the layer that can see it** (COOKBOOK.md, Tests). A console check or a screenshot you looked at once is not a test.

---

## Which Layer for What

| Layer | Runs | Use it for | Not for |
|---|---|---|---|
| [Node tests](#node-tests) | CI and local, `npm test` | Pure logic: config processing, schemas and docs checks, routing, templates, colour resolution, Python rules run from node, source guards | Anything that needs layout, a real Lit render or a browser API |
| [Layer A: browser components](#layer-a-browser-components) | CI and local, `npm run test:browser` | A real card from the built bundle in Chromium against a fake `hass`: rendering, state updates, actions, sizing, editors and studios | Home Assistant's own frontend (dialogs in `home-assistant`, the card picker, real recorder data) |
| [Layer B: visual baselines](#layer-b-visual-baselines) | local only, `npm run test:visual` | Pixel baselines of a few canonical cards, to catch unintended visual change | Behaviour (use Layer A) |
| [Layer C: real Home Assistant](#layer-c-real-home-assistant) | local only, `npm run test:ha` | The integration, WebSocket commands and permissions, services, Lovelace dashboards, editors inside Home Assistant | Anything Layer A can already see (Layer C is slow and needs the dev Home Assistant) |
| [Docs site](#docs-site-tests) | CI (without `@gpu`) and local, `npm run test:docs` | The built docs: live demos, galleries, playgrounds, the config checker, published files, moved anchors | Card behaviour (test that in Layer A; the docs tests only check that demos render) |

All four Playwright layers use the built bundle, so run `npm run build` first (and `npm run docs:build` for the docs tests).

---

## Node Tests

**`node:test` suites under `tests/`, one folder per area.**

- **Folders:** `charts`, `core` (the biggest), `data-grid`, `docs`, `editor`, `ha-compat`, `layout`, `msd`, `routing` (`npm run test:routing` runs it alone), `support`. `npm test` runs every `tests/**/*.test.js` (`package.json`, `test` script); `tests/fixtures/` holds shared input files.
- **Preloads:** every `test*` script runs node with two `--import`s (`package.json`):
  - `tests/setup/browser-shims.js` gives `window` (as `globalThis`), `__LCARDS_VERSION__` and `requestAnimationFrame`, which `src/` modules touch at import time. Deliberately no fake `document`: Lit fails on a partial one.
  - `tests/setup/vite-imports.js` makes the Vite import forms `src/` uses load in node: `import text from './file?raw'` and `import data from './file.json'` (only for the repo's own sources).
- **`--no-maglev`** is on every node script that runs the config checker (the tests, `validate-doc-examples`, `validate:config`). V8's Maglev compiler otherwise spends up to 10 GB optimising ajv's huge generated validators, and the `astro-starters` and `demo-dashboard` tests get killed for memory (COOKBOOK.md, Tests).
- **Helpers** in `tests/helpers/`:
  - `fake-hass.js`: `createFakeHass({ states, replies })`, a browser-safe `hass` with a service-call spy (`hass.serviceCalls`), a scripted connection (`hass.connection.sent`, `replies` for `sendMessagePromise`) and `hass.connection.push(id, payload)` to deliver a subscription message. The docs harness imports it too, so it has no `node:` imports.
  - `jsdom-env.js`: `installJsdom()` puts a real jsdom `document` and window APIs on `globalThis` for tests that need them (theme activation, a headless `lcardsCore.initialize()`); `env.restore()` takes it down.
  - `card-env.js` (the card environment shared with the browser harness and the docs demos), `source-scan.js` (`findInSource()` for source guard tests), `demo-states.js`, `allowed-entities.js`, `ha-jinja.js`.
- **Guard tests** read the source instead of running it: colour syntax only in `color-syntax.js`, no `@ts-ignore`, known-dead Home Assistant elements (`tests/ha-compat/`), the schema vocabulary, docs format and the "Home Assistant" spelling (`tests/docs/`). When one fails, fix the code, not the guard.
- **Python from node:** pure Python rules are tested by running the file in `python3` from a node test, for example `tests/support/device-access.test.js` for `custom_components/lcards/device_access.py`.

---

## Layer A: Browser Components

**One real card per fixture, from the built bundle, in Chromium against a fake `hass`** (`playwright.config.js`, project `component`; specs `tests/browser/*.spec.js`).

- **Server:** `tests/browser/serve.mjs` serves `custom_components/lcards/` at `/lcards/` (as Home Assistant does, `.br`/`.gz` included), `tests/helpers/` at `/helpers/`, the fixtures at `/fixtures/` and the harness at `/`.
- **Fixtures:** `tests/browser/fixtures/<case>.yaml`, one card config each. `mountCase(page, '<case>', params)` from `tests/browser/support.js` opens `harness.html?case=<case>` and waits until the card has rendered; `expectNoErrors(page)` fails on any LCARdS console error.
- **Harness** (`tests/browser/www/harness.html` and `harness.js`): loads `/lcards/lcards.js?v=test` like Home Assistant, mounts the card and exposes:
  - `window.__setState(entityId, state)`: pushes a state change (a new `hass` snapshot plus a `state_changed` event);
  - `window.__reconfigure(config)`: `setConfig` on the live card;
  - `window.__card`, `window.__hass` (with `serviceCalls`), `window.__events` (`hass-more-info`, `show-dialog`, `location-changed`), `window.__errors`, `window.__mountExtra(config)`.
- **Configs are deep-frozen**, as Home Assistant freezes Lovelace configs (`deepFreeze()` in `tests/helpers/card-env.js`), so code that mutates its config in place fails here too.
- **Harness parameters:** `width`, `height`, `freeze=1` (removes CSS transitions; animations keep running), `now=<ms>`, `seed=<n>`, `log=<level>`, `connectFirst=1` (attach and give `hass` before `setConfig`, the order Home Assistant uses on a live reconfigure), `historyDelay=<entity_id>:<ms>`.
- **Cards that size to 100%** (charts, rings) need a definite size: `mountCase(page, 'chart-area', { height: '300' })`.
- **CI** runs it on every push and PR (Validate workflow, Tests and Typecheck job) with two retries; locally a failure is a failure (`playwright.config.js`).

---

## Layer B: Visual Baselines

**Screenshot baselines of canonical cards** (`tests/browser/visual.spec.js`, project `visual`; images in `tests/browser/visual.spec.js-snapshots/`).

- **Local only:** fonts render differently from machine to machine.
- **Deterministic input:** each case mounts with `freeze=1` (no CSS transitions), `now=` (the sample entity values follow the time of day) and `seed=1` (`Math.random` is reseeded just before the card mounts, so generated decoration is stable); chart cases also fix the browser clock for their time axis.
- **Tolerance** is an absolute pixel budget (`maxDiffPixels: 40`, per-pixel `threshold: 0.2`), because a ratio let a whole missing label pass.
- **After an intended visual change** refresh with `npm run test:visual -- --update-snapshots=all`. The plain `--update-snapshots` only rewrites baselines that fail, and keeps the ones that still pass within the tolerance. Look at every changed image before committing it.

---

## Layer C: Real Home Assistant

**Smoke tests against the dev Home Assistant** (`playwright.ha.config.js`; `tests/ha/ha.spec.js`, client `tests/ha/ha-client.mjs`). Local only, never on CI.

- **Needs:** `npm run build` (the bind-mounted `custom_components/lcards/` is what Home Assistant serves), the dev Home Assistant at `HA_URL` (default `http://localhost:8123`) and a long-lived admin token in `$HA_TOKEN` or the first line of `.ha-token` in the repo root (gitignored). Without a token every test skips.
- **Fixtures it creates if missing:** only `lcards_test_*` helpers (`TEST_HELPERS`; the dashboard gallery's extra ones are `GALLERY_HELPERS`) and the `lcards-test` dashboard, rewritten from `tests/ha/dashboard.yaml` (`ensureHelpers()`, `ensureDashboard()`). Tests use these fixtures, never personal entities, and clean up what else they create (a temporary user, below).
- **Non-admin cases:** `withNonAdminUser(admin, async (user, userId) => { ... })` creates a temporary non-admin user, logs it in for a token, runs the callback with a client for that user, then deletes the user and its scoped storage. Use it for every permission check (the storage and `lcards/fire_event` rules on [Backend API](./backend-api)).
- **One worker,** because the tests change shared Home Assistant state; Home Assistant's service worker is blocked, since it reloads the page a few seconds into a fresh profile.

---

## Docs Site Tests

**The built docs site in Chromium** (`playwright.docs.config.js`; specs `tests/docs-site/`, shared helpers `tests/docs-site/support.js`).

- **Two servers:** project `built` runs every spec against `vitepress preview` of the built site; project `dev` runs `dev-server.spec.js` against `vitepress dev`, which serves `/lcards/` differently and once broke the demos there.
- **What they cover:** live card demos (`live-cards.spec.js`), galleries, playgrounds, the processor lab, the demo board, the browser config checker, the published schemas and `llms.txt` (`published-files.spec.js`) and moved anchors (`moved-anchors.spec.js`).
- **`@gpu` tags:** pages of many WebGL cards (astrometrics) and a few CPU-heavy pages are tagged with `gpuTag(url)`; CI has no GPU and skips them (`grepInvert: /@gpu/`), one astrometrics page stays on CI as a smoke test. Locally they run on the real GPU through four Chromium flags (without them headless Chromium draws WebGL on the CPU).
- **`Accept-Encoding: identity`:** `vitepress preview` brotli-compresses every response at the highest level, uncached, which cost seconds per page for the main chunk; the tests ask for uncompressed responses.
- **Channels:** `DOCS_BASE` (`/`, `/dev/`, `/v/<version>/`) puts every spec path under the channel's base (`underBase()` in `support.js`), so a channel can be tested locally with `DOCS_BASE=/dev/ npm run docs:build && DOCS_BASE=/dev/ npm run test:docs` (COOKBOOK.md, Gotchas).

---

## Docs Live Demos

**Docs examples are tests too: they render the real cards and are schema-checked.** How to write them is the [`lcards-docs-writer` skill](https://github.com/snootched/lcards/blob/main/.claude/skills/lcards-docs-writer/SKILL.md) and [COOKBOOK.md: Docs site](https://github.com/snootched/lcards/blob/main/COOKBOOK.md#docs-site).

- **` ```yaml live `** renders a live demo above the YAML, picked by the card's `type:` (`LIVE_DEMOS` in `doc/.vitepress/config.mts`): `CardDemo.vue` for button, elbow, slider, select menu, MSD, layout card and view, astrometrics and the alert overlay (on the Alert Studio's mock screen); `ChartDemo.vue` and `DataGridDemo.vue` for charts and data grids. `collapsed` folds the YAML away, `controls` adds a control for each entity the YAML names.
- **`<CardGallery set="..." />`** renders a grid of real cards, one per option value (every preset, every elbow type), from the sets in `card-demo-galleries.js`. Look at a screenshot of a new gallery: the tests check that cards render, not that they look right.
- **` ```yaml lab `** wraps the example in `ProcessorLab.vue`: the real DataSource processors run over sample history (`src/core/data-sources/processor-preview.js`).
- **Node checks:** every YAML block is validated strictly against the schema in `npm run build`; `tests/docs/card-demo-starters.test.js` schema-checks every demo starter and gallery tile, `tests/docs/processor-lab.test.js` runs every lab block in node, and `tests/docs/demo-dashboard.test.js` and `dashboard-gallery.test.js` validate the demo views and gallery dashboards offline.
- **Browser checks:** the docs site tests above mount every demo on the built site and fail on any error.

---

## Running Heavy Tests

**Run one heavy job at a time:** `npm test`, `npm run typecheck`, the doc-example validation, `npm run build` and every Playwright layer.

- Each one loads the whole bundle, the generated validators or a fleet of browsers; two at once on a laptop already running the dev Home Assistant ran out of memory.
- A Playwright failure that only shows in a full run and passes alone is usually machine load (the Home Assistant container, the editor, other browsers), not a bug: rerun that spec alone before chasing it.

---

## See Also

- [Type Checking](./typescript): `npm run typecheck`, the other gate that runs on CI
- [Debug API](./debug-api): the console tools for finding what a test should check
- [Backend API](./backend-api): the commands and permission rules the Layer C tests cover
