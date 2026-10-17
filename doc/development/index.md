# Developer Guide

Documentation for developers extending LCARdS: building custom cards, editors, and packs.

## How-to Guides

| Page | Description |
|---|---|
| [Building a Custom Card](custom-card.md) | Extend `LCARdSCard`, wire lifecycle hooks, register in `lcards.js` |
| [Building an Editor](building-an-editor.md) | Add a visual editor to your card using `LCARdSBaseEditor` |
| [Building a Pack](building-a-pack.md) | Bundle style presets, components, themes, audio, and more into a distributable pack |

## API Reference

| Page | Description |
|---|---|
| [Animation API](anim-api.md) | `window.lcards.anim.*`: anime.js v4 access, helpers, presets, scopes |
| [Assets & SVG API](assets-api.md) | Font loading, SVG cache, SVG/anchor helpers, text measure cache |
| [Backend WS API](backend-api.md) | `lcards/*` WebSocket commands: storage, HA service targeting, degraded mode |
| [Color Resolution](colour-resolution.md) | Correct patterns for resolving CSS vars, computed expressions (`darken`, `lighten`, `alpha`, etc.) in all contexts |
| [Type Checking](typescript.md) | How TypeScript checks our JavaScript, the rules for new code, and how to fix common errors |
| [Debug API](debug-api.md) | Console introspection: log level, core singletons, MSD cards, data sources |
| [Helpers API](helpers-api.md) | WebSocket-based HA helper management: create, read, update, delete |

## CSS & Theming

| Page | Description |
|---|---|
| [HA CSS Variable Reference](ha-css-vars.md) | Every HA 2026.6+ CSS variable, its default value, and current LCARdS usage |

## Internals

| Page | Description |
|---|---|

## Repository validation commands

These run in CI and are safe to run locally before opening a PR:

| Command | What it does |
|---|---|
| `npm run validate:css-vars` | Audits every `--lcars-*`, `--lcards-*`, and `theme:` reference against the allowlists in `scripts/ha-lcars-theme-vars.js` and `src/lcards-vars.js`. Gates `npm run build`. |
| `npm run validate:doc-examples` | Parses every fenced `yaml`/`yml` block in `doc/**.md`, checks that any `type: custom:lcards-*` value matches a registered element, and validates parsed card and view configs against the real JSON Schemas listed in `scripts/lib/card-schemas.js` (every card including MSD, plus the layout view). Add `--strict` to promote schema and parse warnings to errors. Two fence meta hints: ` ```yaml alternatives ` skips YAML parsing but still checks type refs; ` ```yaml no-validate ` skips the block entirely. |
| `npm run validate:config -- <file>` | Checks any LCARdS YAML (a card, a view, a whole dashboard or HA's `.storage/lovelace*` JSON) with the same checker as the doc examples: schema errors and unknown keys at their path, plus warnings for names that aren't built in (presets, animation presets, sounds, theme tokens...). `--strict` fails on warnings, `--json` for tools. `npm run build:validator` bundles it into one standalone file. |
| `npm run validate:schema-descriptions` | Fails when a schema property is added without a `description` (descriptions are published in `lcards-schema.json`). The existing backlog is listed in `scripts/schema-description-baseline.txt`; after filling some, run `npm run validate:schema-descriptions:update`. Gates `npm run build`. |
| `npm run typecheck` | Runs `tsc` against the JSDoc-typed sources. |
| `npm run docs:build` | Builds the VitePress site. |
| `npm run generate:llm-schema` | Writes the published JSON Schemas: `lcards-schema.json` (everything) and `schema/` (an index, one file per card, view and strategy, and `shared/` for the big subsystems), into `doc/public/` (gitignored). Runs inside `docs:build` and `docs:serve`. |

