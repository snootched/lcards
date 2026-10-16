---
name: lcards
description: Write, fix and explain LCARdS configuration for Home Assistant (Star Trek LCARS-style cards and dashboards). Use when the user wants an LCARdS card, view or dashboard (custom:lcards-button, elbow, slider, chart, data-grid, select-menu, msd-card, layout-card, alert-overlay, lcards-layout-view, the lcars-shell strategy), asks why their LCARdS YAML doesn't work, or wants to drive LCARdS from automations (lcards.* actions such as red_alert).
license: MIT
compatibility: Agent Skills format (agentskills.io). The config checker in scripts/ needs code execution and Node.js 20 or newer; without it, check keys against the schemas in references/.
---

# LCARdS

LCARdS is a Home Assistant integration of LCARS-style cards, a grid view type and a shell dashboard strategy, all configured in YAML. This skill holds the real schemas, the built-in names, the docs and a checker for the LCARdS version in `references/schema/index.json` (`lcards_version`). Use them instead of memory: LCARdS has hundreds of options and guessed keys are silently ignored or rejected.

## Workflow

1. **Understand the screen.** Which entities (ask for the user's real entity ids; never invent them), which cards, and where they go. If Home Assistant tools are connected (for example the community ha-mcp server), look up areas, entities and states there instead of asking, and don't change the user's Home Assistant unless they ask you to. For a whole dashboard, read `references/docs/getting-started/building-dashboards.md` first.
2. **Load only the schemas you need.** `references/schema/index.json` lists every card, view and strategy with its file and the shared files it uses. Read the card's file (`references/schema/cards/<tag>.json`, 2 to 75 KB) and the shared files it references (`../shared/<name>.json`) only when the request touches them (rules, animations, background animations, state colours, filters).
3. **Read the docs page** for each card (`references/docs/cards/<card>/index.md`) for worked examples, and a gallery dashboard (`references/gallery/*.yaml`) when composing a screen.
4. **Write the YAML** following the rules below.
5. **Check it** when you can run code: save it to a file and run `node scripts/lcards-validate.mjs <file>` (Node 20+). Fix every error. Fix every warning too: an unknown name is almost always a typo (use the suggested name); a legacy-format warning means an older chart or data grid layout that still works but can be updated. Without code execution, check each key against the schema yourself.
6. **Hand it over** with where to paste it (card editor YAML tab, or **Edit dashboard > Raw configuration editor** for a whole dashboard) and which placeholder entities to replace.

## Checking YAML the user pastes

When the user pastes LCARdS YAML (theirs, or written by another tool) and asks why it doesn't work or to check it: save it to a file and run the checker on it, then explain each error and warning in plain words at its path, and give the corrected YAML. Run the checker again on your fix. Without code execution, compare each key with the card's schema and each name with `registries.json`.

## Rules

- Card types are `type: custom:<tag>`: `custom:lcards-button`, `custom:lcards-msd-card`, ... Views: `type: custom:lcards-layout-view`. Strategy: `strategy: { type: custom:lcars-shell }`.
- Only keys the schema declares. If something the user wants has no key, say so instead of inventing one.
- Names must exist: presets, components, animation and background presets, filters, sound assets, MSD backgrounds (`builtin:<name>`) and theme tokens are listed in `references/schema/registries.json`.
- Theme tokens need the `theme:` prefix: `theme:colors.ui.primary`. Colours may be hex, `rgb()`, `var(--name)`, a token or a colour function (`alpha(var(--lcars-orange), 0.5)`).
- Templates: Jinja2 `{{ states('sensor.x') }}`, JavaScript `[[[ return entity.state ]]]`, LCARdS tokens `{entity.state}`, data sources `{ds:name}` / `{ds:name.processor:.1f}`.
- Rules live in a card's `rules:` list; a rule targets cards and MSD overlays by `id` or `tag:<tag>` under `apply.overlays`.
- Layout views: columns and rows that hold charts, MSDs or grids use `minmax(0, 1fr)`; a lozenge button shows its label only with `text.<field>.show: true`.
- Actions from automations or buttons: `lcards.red_alert`, `lcards.clear_alert`, `lcards.trigger_effect`, `lcards.play_sound`, ... (`references/docs/configuration/ha-actions.md`).

## What's here

- `references/schema/`: `index.json`; `cards/`, `views/`, `strategies/` (one JSON Schema each); `shared/`; `registries.json` (built-in names).
- `references/docs/`: the user docs as markdown, by section (`getting-started/`, `configuration/`, `cards/`, `core/`).
- `references/gallery/`: complete example dashboards (they use `lcards_test_*` placeholder helpers).
- `scripts/lcards-validate.mjs`: the config checker (`--json` for machine-readable output, `--strict` to fail on warnings).
