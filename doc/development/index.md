# Developer Guide

Documentation for developers working on LCARdS itself: adding cards, options, editors, packs and core services, and the APIs they use. Everything lives in one repository and ships as one bundle, so these guides are about changing that code; there is no plugin API for cards or packs shipped separately. How the pieces work inside is in the [Architecture](../architecture/) section.

## How-to Guides

| Page | Description |
|---|---|
| [Building a Custom Card](custom-card.md) | Extend `LCARdSCard`, the schema, registration in `src/lcards-main.js`, element types, card size, build and test |
| [Adding a Card Option](adding-a-card-option.md) | A new or changed YAML key end to end: schema, runtime, editor, docs, registries and tests |
| [Building a Studio Editor](building-an-editor.md) | Studio dialogs (the dialog pattern, live preview, the shared panels and controls, launching from the card editor), plus a basic `LCARdSBaseEditor` card editor |
| [Building a Pack](building-a-pack.md) | Style presets, components, themes, rules, assets and sound schemes in a built-in pack |
| [Adding a Core Service](adding-a-core-service.md) | A `BaseService` singleton: startup order, HASS distribution, debug info, tests and docs |
| [Testing](testing.md) | The test layers (node, browser, visual, real Home Assistant, docs site), their helpers and when to use each |
| [Type Checking](typescript.md) | How TypeScript checks our JavaScript, the rules for new code, and how to fix common errors |
| [Colour Resolution](colour-resolution.md) | Resolving colours, theme tokens and computed expressions (`darken`, `lighten`, `alpha`, ...) in CSS, SVG, Canvas2D and anime.js |

## API Reference

| Page | Description |
|---|---|
| [Animation API](anim-api.md) | `window.lcards.anim.*`: anime.js v4 access, helpers, presets, scopes |
| [Assets and SVG API](assets-api.md) | Font loading, SVG cache, SVG and anchor helpers, text measure cache |
| [Backend WS API](backend-api.md) | `lcards/*` WebSocket commands and the integration's actions: storage, Home Assistant service targeting, degraded mode |
| [Debug API](debug-api.md) | Console introspection: log level, core singletons, MSD cards, data sources |
| [Helpers API](helpers-api.md) | LCARdS's own helper registry: the `input_*` helpers it creates, reads, writes and watches |

## CSS and Theming

| Page | Description |
|---|---|
| [Home Assistant CSS Variables](ha-css-vars.md) | The Home Assistant CSS variables LCARdS uses (minimum Home Assistant 2026.11), their default values and where LCARdS uses them |

## Architecture

| Page | Description |
|---|---|
| [Architecture overview](../architecture/) | How the bundle, the integration, the core and the cards fit together |
| [Card Foundation](../architecture/cards/lcards-card-foundation.md) | `LCARdSNativeCard` and `LCARdSCard`: lifecycle, HASS flow, entities, rules, preview mode, cleanup |
| [Core Subsystems](../architecture/subsystems/) | Every `window.lcards.core.*` service, the startup order and how HASS reaches them |

## Build, test and release

The commands are kept in one place, `COOKBOOK.md` in the repository root (not on this site): its sections are [Daily loop](https://github.com/snootched/lcards/blob/main/COOKBOOK.md#daily-loop) (build, hard refresh, tests, docs server), [npm scripts](https://github.com/snootched/lcards/blob/main/COOKBOOK.md#npm-scripts) (every script, and which ones `npm run build` already runs), [Tests](https://github.com/snootched/lcards/blob/main/COOKBOOK.md#tests), [CI workflows](https://github.com/snootched/lcards/blob/main/COOKBOOK.md#ci-workflows), [Docs site](https://github.com/snootched/lcards/blob/main/COOKBOOK.md#docs-site) and [Releases](https://github.com/snootched/lcards/blob/main/COOKBOOK.md#releases). `npm run help` prints the same script list in the terminal.

The short version:

- `npm run build` is the only build, for development and releases alike. It runs every validator first (strict doc examples, schema descriptions, em dashes and "Home Assistant" in the docs, CSS variables, the Home Assistant compatibility lint, typecheck) and writes the bundle into `custom_components/lcards/`. Hard-refresh the browser afterwards (Ctrl+Shift+R).
- `npm test` runs the node tests; `npm run test:browser` the browser tests against the built bundle. CI runs both, plus the checks inside the build.
- `npm run validate:config -- <file>` checks any LCARdS YAML (a card, a view, a dashboard) with the same checker as the doc examples.
- Code rules live in `CLAUDE.md` and `.github/instructions/*.md`; read the file for the area you change.
