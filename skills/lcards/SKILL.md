---
name: lcards
description: Write, fix and explain LCARdS configuration for Home Assistant (Star Trek LCARS-style cards and dashboards). Use when the user wants an LCARdS card, view or dashboard (custom:lcards-button, elbow, slider, chart, data-grid, select-menu, msd-card, layout-card, alert-overlay, lcards-layout-view, the lcars-shell strategy), asks why their LCARdS YAML doesn't work, wants to drive LCARdS from automations (lcards.* actions such as red_alert), or asks about a Star Trek / LCARS dashboard, the HA-LCARS theme (its --lcars-* colour variables, themes, uix classes such as header-left) or UIX styling alongside LCARdS.
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

## HA-LCARS and UIX

Many LCARdS users also run **HA-LCARS**, the LCARS theme for all of Home Assistant, which styles stock cards through **UIX** (UI eXtension, the successor to card-mod). Three layers, each with its own vocabulary:

| Layer | Configured with | Reference |
|---|---|---|
| LCARdS cards | the card's own keys (`style:`, `preset:`, `text:`, ...) | `references/schema/`, `references/docs/` |
| HA-LCARS theme | the selected theme; `--lcars-*` CSS variables; `uix: { class: header-left }` on **stock** cards | `references/ha-lcars/` |
| UIX | `uix: { style: ... }` CSS on any card, UIX theme keys | `references/uix/` |

- Ask whether the user runs HA-LCARS (and which theme) before choosing colours. With HA-LCARS, colour LCARdS cards with its role variables (`var(--lcars-card-button-color)`, `var(--lcars-ui-tertiary)`; `references/ha-lcars/variables.md`) so they follow theme switches; use palette variables (`var(--lcars-orange)`) only for a colour that must stay fixed. Without HA-LCARS, `--lcars-*` variables don't exist: use LCARdS theme tokens or `--lcards-*` palette colours instead.
- HA-LCARS classes (`header-left`, `middle-right`, `button-lozenge-left`, `entity-bullet-right`, ...) style stock cards: markdown, heading, button, entities (`references/ha-lcars/guide.md`). LCARdS cards draw their own LCARS shapes, so reach for an LCARdS card (an elbow for a header bar, a lozenge button) rather than a class. Never invent a class or a variable: only the names in these references exist.
- `uix:` (and the older `card_mod:`) are accepted on any card, LCARdS cards included. Prefer an LCARdS option when one exists: the checker checks it, and it keeps working when LCARdS changes its internal markup. Use `uix: style:` only for what no option covers. card-mod itself no longer works with current Home Assistant: tell users who still have it to replace it with UIX (`references/uix/faq.md`).
- HA-LCARS needs UIX, its fonts, `lcars.js` and a few helper entities (`references/ha-lcars/themes.md`). When a screen depends on them, say so in the hand-over.

## Rules

- Card types are `type: custom:<tag>`: `custom:lcards-button`, `custom:lcards-msd-card`, ... Views: `type: custom:lcards-layout-view`. Strategy: `strategy: { type: custom:lcars-shell }`.
- Only keys the schema declares. If something the user wants has no key, say so instead of inventing one.
- Names must exist: presets, components, animation and background presets, filters, sound assets, MSD backgrounds (`builtin:<name>`) and theme tokens are listed in `references/schema/registries.json`.
- Theme tokens need the `theme:` prefix: `theme:colors.ui.primary`. Colours may be hex, `rgb()`, `var(--name)`, a token or a colour function (`alpha(var(--lcars-orange), 0.5)`). HA-LCARS variables are `var(--lcars-...)`, never `theme:lcars-...`.
- Templates: Jinja2 `{{ states('sensor.x') }}`, JavaScript `[[[ return entity.state ]]]`, LCARdS tokens `{entity.state}`, data sources `{ds:name}` / `{ds:name.processor:.1f}`.
- Rules live in a card's `rules:` list; a rule targets cards and MSD overlays by `id` or `tag:<tag>` under `apply.overlays`.
- Layout views: columns and rows that hold charts, MSDs or grids use `minmax(0, 1fr)`; a lozenge button shows its label only with `text.<field>.show: true`.
- Actions from automations or buttons: `lcards.red_alert`, `lcards.clear_alert`, `lcards.trigger_effect`, `lcards.play_sound`, ... (`references/docs/configuration/ha-actions.md`).

## What's here

- `references/schema/`: `index.json`; `cards/`, `views/`, `strategies/` (one JSON Schema each); `shared/`; `registries.json` (built-in names).
- `references/docs/`: the user docs as markdown, by section (`getting-started/`, `configuration/`, `cards/`, `core/`).
- `references/gallery/`: complete example dashboards (they use `lcards_test_*` placeholder helpers).
- `references/ha-lcars/`: `variables.md` (every `--lcars-*` variable, what it colours, its default), `themes.md` (each theme's colours, selecting a theme, helper entities), `guide.md` (HA-LCARS install, classes, layout tips). Generated from HA-LCARS at the commit named in each file.
- `references/uix/`: the UIX styling docs (`quick-start.md`, `faq.md`, `using/cards.md`, `using/templates.md`, `using/themes.md`, `concepts/dom.md`, ...). For UIX Forge and Broker, see the UIX site.
- `scripts/lcards-validate.mjs`: the config checker (`--json` for machine-readable output, `--strict` to fail on warnings). It also warns on a misspelt `var(--lcars-...)`. In the Claude Code plugin it runs by itself on every LCARdS YAML file you write; read and fix what it reports.
