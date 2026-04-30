# Developer Guide

Documentation for developers extending LCARdS — building custom cards, editors, and packs.

## How-to Guides

| Page | Description |
|---|---|
| [Building a Custom Card](custom-card.md) | Extend `LCARdSCard`, wire lifecycle hooks, register in `lcards.js` |
| [Building an Editor](building-an-editor.md) | Add a visual editor to your card using `LCARdSBaseEditor` |
| [Building a Pack](building-a-pack.md) | Bundle style presets, components, themes, audio, and more into a distributable pack |

## API Reference

| Page | Description |
|---|---|
| [Animation API](anim-api.md) | `window.lcards.anim.*` — anime.js v4 access, helpers, presets, scopes |
| [Assets & SVG API](assets-api.md) | Font loading, SVG cache, SVG/anchor helpers, text measure cache |
| [Color Resolution](color-resolution.md) | Correct patterns for resolving CSS vars, computed expressions (`darken`, `lighten`, `alpha`, etc.) in all contexts |
| [Debug API](debug-api.md) | Console introspection: log level, core singletons, MSD cards, data sources |
| [Helpers API](helpers-api.md) | WebSocket-based HA helper management — create, read, update, delete |

## Release Notes

| Page | Description |
|---|---|
| [Changelog](changelog.md) | Release notes and breaking changes |

## Internals

| Page | Description |
|---|---|
| [Codebase Review](/dev/codebase-review) | Architecture findings, duplication hotspots, and prioritized follow-up PR slices |

## Repository validation commands

These run in CI and are safe to run locally before opening a PR:

| Command | What it does |
|---|---|
| `npm run validate:css-vars` | Audits every `--lcars-*`, `--lcards-*`, and `theme:` reference against the allowlists in `scripts/ha-lcars-theme-vars.js` and `src/lcards-vars.js`. Gates `npm run build`. |
| `npm run validate:doc-examples` | Parses every fenced `yaml`/`yml` block in `doc/**.md` and checks that any `type: custom:lcards-*` value matches a real custom element registered in `src/lcards.js`. Add `--strict` to fail on parse warnings, or `--verbose` for per-block output. Use the meta hint ` ```yaml no-validate ` to opt a snippet-style block out. |
| `npm run typecheck` | Runs `tsc` against the JSDoc-typed sources. |
| `npm run docs:build` | Builds the VitePress site. |

