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
   **Ask how colours should work before you build a screen** (the user needs to decide this up front; changing it later means editing every card):
   - **By state** (the usual choice for a working dashboard): controls bound to entities leave their colour unset and take the theme's on, off and unavailable colours from their preset, or get a state map only where one entity needs its own.
   - **By hand:** every part, controls included, gets its own theme role with `active` and `inactive` pairs, like the gallery samples. Say plainly that this hand-assigns every colour and that moving to state colours later means removing them card by card.
   - **Mixed:** decorative parts (sweeps, bars, code blocks, cascades) by hand, controls by state.
   If you can't ask (the user asked for a finished file in one go), use mixed, and say in your answer which you used and how to change it. Never copy the gallery's or the patterns' per-control `active`/`inactive` roles onto the user's controls unless they chose by hand: the samples pick colours by hand only because their entities are test helpers (`references/docs/getting-started/lcars-design.md`, "Colours by state or by hand").
2. **Design it like LCARS** when you're composing more than a card or two: read `references/docs/getting-started/lcars-design.md` (the guidelines and screen archetypes) and `references/docs/getting-started/lcars-patterns.md` (the patterns, as YAML). Pick a look (Picard or classic; ask, or infer it from the user's HA-LCARS theme), then pick the screen archetype that suits the job and the device (a phone gets a portrait panel; one main system gets a display; many similar things get a tile wall) and fill its areas with patterns. Vary it: borrow sections and groupings from the gallery dashboards and the patterns freely, but don't reproduce a whole gallery screen with new labels; two requests for different rooms should not come back as the same screen. These are guidelines to choose from, not rules. Take every colour from a theme role (`theme:colors.ui.primary`, ...), never a hex value. Scale decides most of the look: give small parts fixed px tracks (blocks about 64 x 24 px, letters about half the block's height: `font_size` 13 to 14) and leave `minmax(0, 1fr)` to the one main display; put 50 to 90 small parts on a full screen; leave no empty region larger than about a tenth of the screen. Build the screen from the patterns as modules whose slots take either a decorative part or a control of the same size, so the user can swap one for the other. Numbers should mean something: show the user's readings with short labels (a readings table), and use at most one decorative number cascade filling an area (short groups between a code-block column's blocks are part of the column). Sweeps and bars that run off the screen end square; short capped bars and pills keep their round caps. On a schematic (an MSD), ask which leader style the user wants before you build it (classic: labels in columns, lines sweeping round; Picard: out of the side with a tight bend; Picard bracket: a bar on every label, with lines either level and straight from label columns beside the drawing, or a long stub and one sharp diagonal from labels above and below), and use that one style for every label unless the user asks otherwise (if you can't ask, pick one that suits the look and say which you used); each leader line leaves its label from the side facing the part (`anchor_side: left` or `right`, text aligned toward it) and turns once near the part with a curve, never `corner_style: miter` (the bracket style instead runs straight, or takes a short stub and one sharp diagonal with `route: angled`, in its bar's colour); see the labelled schematic pattern. Before answering, go down the "Check a screen" table in lcars-design.md and fix what misses.
3. **Load only the schemas you need.** `references/schema/index.json` lists every card, view and strategy with its file and the shared files it uses. Read the card's file (`references/schema/cards/<tag>.json`, 2 to 75 KB) and the shared files it references (`../shared/<name>.json`) only when the request touches them (rules, animations, background animations, state colours, filters).
4. **Read the docs page** for each card (`references/docs/cards/<card>/index.md`) for worked examples, and a gallery dashboard (`references/gallery/*.yaml`) when composing a screen.
5. **Write the YAML** following the rules below.
6. **Check it** when you can run code: save it to a file and run `node scripts/lcards-validate.mjs <file>` (Node 20+). Fix every error. Fix every warning too: an unknown name is almost always a typo (use the suggested name); a legacy-format warning means an older chart or data grid layout that still works but can be updated. Without code execution, check each key against the schema yourself.
7. **Hand it over** with where to paste it (card editor YAML tab, or **Edit dashboard > Raw configuration editor** for a whole dashboard) and which placeholder entities to replace.

## Checking YAML the user pastes

When the user pastes LCARdS YAML (theirs, or written by another tool) and asks why it doesn't work or to check it: save it to a file and run the checker on it, then explain each error and warning in plain words at its path, and give the corrected YAML. Run the checker again on your fix. Without code execution, compare each key with the card's schema and each name with `registries.json`.

## Restyling a dashboard the user pastes

When the user gives you an existing dashboard (theirs, an older LCARdS one, or from another tool) and asks to make it look right, LCARS-correct or "like the gallery":

1. Keep what it does: every entity, control and action stays, and so do the user's names and labels unless they ask otherwise. Ask the questions from steps 1 and 2 that its YAML doesn't already answer (look, colours by state or by hand, the MSD leader style).
2. Rebuild it with the design guide and the patterns (step 2): fixed px tracks for small parts, theme roles for colours, the right archetype for the device, one leader style per MSD.
3. Grade it before you hand it over: go down the "Check a screen" table in `references/docs/getting-started/lcars-design.md` and give the user each row as met, fixed, or left as is with the reason. Run the checker (step 6) and fix what it reports.
4. Hand over the new YAML with a short list of what changed and why.

## HA-LCARS and UIX

Many LCARdS users also run **HA-LCARS**, the LCARS theme for all of Home Assistant, which styles stock cards through **UIX** (UI eXtension, the successor to card-mod). Three layers, each with its own vocabulary:

| Layer | Configured with | Reference |
|---|---|---|
| LCARdS cards | the card's own keys (`style:`, `preset:`, `text:`, ...) | `references/schema/`, `references/docs/` |
| HA-LCARS theme | the selected theme; `--lcars-*` CSS variables; `uix: { class: header-left }` on **stock** cards | `references/ha-lcars/` |
| UIX | `uix: { style: ... }` CSS on any card, UIX theme keys | `references/uix/` |

- Colour cards by role so they follow the user's theme (and its light/dark and alert modes): prefer the `theme:` tokens (`theme:colors.ui.primary`, `theme:colors.card.buttonOn`, ...), which resolve to the HA-LCARS role variable when HA-LCARS is installed and fall back to the LCARdS palette when it isn't. A bare `var(--lcars-...)` is empty without HA-LCARS, so give it a fallback (`var(--lcars-blue, var(--lcards-blue-medium))`). Use a fixed palette colour only where a colour must not follow the theme. The HA-LCARS variables and what each colours are in `references/ha-lcars/variables.md`.
- HA-LCARS classes (`header-left`, `middle-right`, `button-lozenge-left`, `entity-bullet-right`, ...) style stock cards: markdown, heading, button, entities (`references/ha-lcars/guide.md`). LCARdS cards draw their own LCARS shapes, so reach for an LCARdS card (an elbow for a header bar, a lozenge button) rather than a class. Never invent a class or a variable: only the names in these references exist.
- `uix:` (and the older `card_mod:`) are accepted on any card, LCARdS cards included. Prefer an LCARdS option when one exists: the checker checks it, and it keeps working when LCARdS changes its internal markup. Use `uix: style:` only for what no option covers. card-mod itself no longer works with current Home Assistant: tell users who still have it to replace it with UIX (`references/uix/faq.md`).
- HA-LCARS needs UIX, its fonts, `lcars.js` and a few helper entities (`references/ha-lcars/themes.md`). When a screen depends on them, say so in the hand-over.

## Rules

- Decorative buttons (titles, dot rows, fillers, readouts of a sensor or number) need no `interactive` key: a button with no action and no entity a tap can toggle shows no hover colour or hand cursor. A label bound to a light, switch or input boolean only for its text or colour gets `tap_action: { action: none }`, which also turns its hover off. Set `interactive: true` or `false` only to override.
- Card types are `type: custom:<tag>`: `custom:lcards-button`, `custom:lcards-msd-card`, ... Views: `type: custom:lcards-layout-view`. Strategy: `strategy: { type: custom:lcars-shell }`.
- Only keys the schema declares. If something the user wants has no key, say so instead of inventing one.
- Names must exist: presets, components, animation and background presets, filters, sound assets, MSD backgrounds (`builtin:<name>`) and theme tokens are listed in `references/schema/registries.json`.
- Theme tokens need the `theme:` prefix: `theme:colors.ui.primary`. Colours may be hex, `rgb()`, `var(--name)`, a token or a colour function (`alpha(var(--lcars-orange), 0.5)`). HA-LCARS variables are `var(--lcars-...)`, never `theme:lcars-...`.
- Templates: Jinja2 `{{ states('sensor.x') }}`, JavaScript `[[[ return entity.state ]]]`, LCARdS tokens `{entity.state}`, data sources `{ds:name}` / `{ds:name.processor:.1f}`.
- Rules live in a card's `rules:` list; a rule targets cards and MSD overlays by `id` or `tag:<tag>` under `apply.overlays`.
- Layout views: columns and rows that hold charts, MSDs or grids use `minmax(0, 1fr)`; a lozenge button shows its label only with `text.<field>.show: true`.
- Astrometrics at true scale: real numbers with `units` on the card (`m`, `km`, `au`, `ly`, `pc`); a part in other units (Sol in km inside a galaxy in ly) is a `type: system` object with its own `units`, `points` and `objects`, one level deep. Ids are card-wide; a view's `distance` is in its target point's units, `fade`/`min_distance`/`max_distance` in their owner's (`references/docs/cards/astrometrics/scale.md`).
- Quote `y`, `n`, `yes`, `no`, `on`, `off` (any case) wherever they are keys or bare values: `"y": 20`, `label: "N"`, `state: "on"`. Home Assistant's code editor (2026.8+) reads them unquoted as `true`/`false`; the checker warns about each.
- Actions from automations or buttons: `lcards.red_alert`, `lcards.clear_alert`, `lcards.trigger_effect`, `lcards.play_sound`, ... (`references/docs/configuration/ha-actions.md`).

## What's here

- `references/schema/`: `index.json`; `cards/`, `views/`, `strategies/` (one JSON Schema each); `shared/`; `registries.json` (built-in names).
- `references/docs/`: the user docs as markdown, by section (`getting-started/`, `configuration/`, `cards/`, `core/`).
- `references/gallery/`: complete example dashboards (they use `lcards_test_*` placeholder helpers).
- `references/ha-lcars/`: `variables.md` (every `--lcars-*` variable, what it colours, its default), `themes.md` (each theme's colours, selecting a theme, helper entities), `guide.md` (HA-LCARS install, classes, layout tips). Generated from HA-LCARS at the commit named in each file.
- `references/uix/`: the UIX styling docs (`quick-start.md`, `faq.md`, `using/cards.md`, `using/templates.md`, `using/themes.md`, `concepts/dom.md`, ...). For UIX Forge and Broker, see the UIX site.
- `scripts/lcards-validate.mjs`: the config checker (`--json` for machine-readable output, `--strict` to fail on warnings). It also warns on a misspelt `var(--lcars-...)`. In the Claude Code plugin it runs by itself on every LCARdS YAML file you write; read and fix what it reports.
