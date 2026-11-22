---
name: lcards
description: Write, fix and explain LCARdS configuration for Home Assistant (Star Trek LCARS-style cards and dashboards). Use when the user wants an LCARdS card, view or dashboard (custom:lcards-button, elbow, slider, chart, data-grid, select-menu, msd-card, layout-card, alert-overlay, lcards-layout-view, the lcars-shell strategy), wants to plan or brainstorm one, asks what LCARdS can do, asks why their LCARdS YAML doesn't work, wants to report an LCARdS bug or request a feature, wants to drive LCARdS from automations (lcards.* actions such as red_alert), or asks about a Star Trek / LCARS dashboard, the HA-LCARS theme (its --lcars-* colour variables, themes, uix classes such as header-left) or UIX styling alongside LCARdS.
license: MIT
compatibility: Agent Skills format (agentskills.io). The config checker in scripts/ needs code execution and Node.js 20 or newer; without it, check keys against the schemas in references/.
---

# LCARdS

<!-- Built for LCARdS 2026.11.0 -->

LCARdS is a Home Assistant integration of LCARS-style cards, a grid view type and a shell dashboard strategy, all configured in YAML. This skill holds the real schemas, the built-in names, the docs and a checker for the LCARdS version in `references/schema/index.json` (`lcards_version`). Use them instead of memory: LCARdS has hundreds of options and guessed keys are silently ignored or rejected.

## Workflow

Most users don't know how much LCARdS can do (animations, alert modes, sounds, screen effects, rules, MSDs, 3D scenes). Your job is to find out what they want, show them what's possible for their entities, agree on a design, then build it. Talk it through for a new dashboard, a new screen or a vague request ("make me an engineering screen", "make my button cooler"). Skip straight to step 5 when the user asks for a finished file in one go, asks for one specific card or key, or already gave everything you need; then use sensible defaults and say what you chose. Don't search the web for pictures of LCARS screens at any step: show what LCARdS can draw with the gallery pictures (step 2).

1. **Find out the goal.** Ask a few short questions per turn, not a form, and skip anything the request or connected tools already answer:
   - What the screen is for and which rooms, devices or systems it covers.
   - Where it runs: wall tablet, phone or desktop (sets the archetype and the columns).
   - The look: Picard or classic (TNG, DS9, Voyager), and whether they use HA-LCARS and which theme (`references/ha-lcars/themes.md`); the theme often answers the look.
   - The entities. Ask for the user's real entity ids; never invent them. If you can reach their Home Assistant, look up areas, entities and states there and propose them instead of asking: through connected Home Assistant tools (for example the community ha-mcp server) or, where you can run code, its REST API with a long-lived access token the user offers you (`/api/states`, `/api/template`). Don't change the user's Home Assistant unless they ask you to. With neither, ask them to list the entities.
   **Ask how colours should work before you build a screen** (the user needs to decide this up front; changing it later means editing every card):
   - **By state** (the usual choice for a working dashboard): controls bound to entities leave their colour unset and take the theme's on, off and unavailable colours from their preset, or get a state map only where one entity needs its own.
   - **By hand:** every part, controls included, gets its own theme role with `active` and `inactive` pairs, like the gallery samples. Say plainly that this hand-assigns every colour and that moving to state colours later means removing them card by card.
   - **Mixed:** decorative parts (sweeps, bars, code blocks, cascades) by hand, controls by state.
   If you can't ask (the user asked for a finished file in one go), use mixed, and say in your answer which you used and how to change it. Never copy the gallery's or the patterns' per-control `active`/`inactive` roles onto the user's controls unless they chose by hand: the samples pick colours by hand only because their entities are test helpers (`references/docs/getting-started/lcars-design.md`, "Setting the Colours").
2. **Propose.** Read `references/features.md` (what LCARdS can do, by goal, with a table of ideas per entity type). Offer two or three concepts that differ in a real way (layout, what's the centrepiece, how much moves), and say which you recommend and why. For each concept give:
   - one or two sentences on the idea, and a rough layout sketch in a text box (areas and what goes in them);
   - the features it uses, tied to the user's entities ("the front door sensor raises a yellow alert with a chirp", "the fan's speed drives the starfield");
   - one or two features they may not know about. Don't list everything; offer more if they ask.
   **To show a look or a style, link pictures of real LCARdS screens**, not pictures from the web: stills from the shows and fan art show what inspired LCARS, not what LCARdS draws. Every gallery dashboard `references/gallery/<name>.yaml` has a picture at `https://lcards.unimatrix01.ca/gallery/<name>.webp`; show it inline when you can (embed it, or fetch it and show it, converting it to PNG if your interface can't show WebP) and always give the plain link under it (`[Classic console](...webp)`), so the user can open it even when the picture doesn't show (all of them: https://lcards.unimatrix01.ca/getting-started/dashboard-gallery.html). Classic sweeps: `classic-console`, `bridge`, `classic-wings`; classic bracket bars: `classic-bracket`; Picard: `picard-console`, `picard-display`, `picard-split`; tile wall: `picard-tiles`; portrait (phone or tall tablet): `picard-portrait`; alert modes: `alert`; leader styles on a schematic: classic `engineering`, Picard `picard-display`, bracket `classic-bracket`. If you do show a still from the shows, say it is inspiration and point to the closest gallery picture for what you would build.
   Keep each concept short. If the user's interface can show choices to pick from, use it; otherwise number the concepts.
   For a single card ("make my button cooler"), skip the layout and offer two or three concrete options instead (an animation preset, colours by state, a texture or component, a sound on tap), each in a line with what it would look like.
3. **Refine.** The user picks, mixes or changes things. Explain any feature they ask about in a sentence or two with a tiny YAML snippet. Settle the open questions before you build: colours by state or by hand (step 1), and on a schematic the leader style (step 5).
4. **Show a picture when you can** (offer it; never required). Once the draft YAML is written and checked (steps 5 to 9), and before the user pastes it:
   - **A preview** (any chat that can run code): `node scripts/lcards-preview-link.mjs <file> --html lcards-preview.html` (with Python but no Node: `python3 scripts/lcards-preview-link.py <file> --html lcards-preview.html`) prints a link to the docs' preview page with the YAML inside it and writes a small page that opens it; the user sees the real cards on sample states. **Never retype the link:** it is thousands of random-looking characters, and one slip breaks it. Give the user the HTML file (save it where they can download or open it: your interface's file outputs, or the folder you're working in) and tell them to open it. Only when you can't hand over a file, paste the link exactly as the script printed it, and tell the user that if the page says it couldn't be read, the link was copied wrong and they can paste the YAML instead. Without code execution, point the user to https://lcards.unimatrix01.ca/getting-started/preview.html to paste the YAML. A link over about 60,000 characters may be cut off by the chat app: offer the paste route as well.
   - **A screenshot** (when you can create a dashboard in the user's Home Assistant and take a screenshot): ask first, put the draft on a separate dashboard, show the screenshot, and delete that dashboard when you're done.
   Until then, the layout sketch from step 2 is the picture.
5. **Design it like LCARS** when you're composing more than a card or two: read `references/docs/getting-started/lcars-design.md` (the guidelines and screen archetypes) and `references/docs/getting-started/lcars-patterns.md` (the patterns, as YAML). Pick a look (Picard or classic; ask, or infer it from the user's HA-LCARS theme), then pick the screen archetype that suits the job and the device (a phone gets a portrait panel; one main system gets a display; many similar things get a tile wall) and fill its areas with patterns. Vary it: borrow sections and groupings from the gallery dashboards and the patterns freely, but don't reproduce a whole gallery screen with new labels; two requests for different rooms should not come back as the same screen. These are guidelines to choose from, not rules. Take every colour from a theme role (`theme:colors.ui.primary`, ...), never a hex value. Scale decides most of the look: give small parts fixed px tracks (blocks about 64 x 24 px, letters about half the block's height: `font_size` 13 to 14) and leave `minmax(0, 1fr)` to the one main display; put 50 to 90 small parts on a full screen; leave no empty region larger than about a tenth of the screen. Build the screen from the patterns as modules whose slots take either a decorative part or a control of the same size, so the user can swap one for the other. Numbers should mean something: show the user's readings with short labels (a readings table), and use at most one decorative number cascade filling an area (short groups between a code-block column's blocks are part of the column). Sweeps and bars that run off the screen end square; short capped bars and pills keep their round caps. On a schematic (an MSD), ask which leader style the user wants before you build it (classic: labels in columns, lines sweeping round; Picard: out of the side with a tight bend; Picard bracket: a bar on every label, with lines either level and straight from label columns beside the drawing, or a long stub and one sharp diagonal from labels above and below), and use that one style for every label unless the user asks otherwise (if you didn't ask, pick one that suits the look and say which you used); each leader line leaves its label from the side facing the part (`anchor_side: left` or `right`, text aligned toward it) and turns once near the part with a curve, never `corner_style: miter` (the bracket style instead runs straight, or takes a short stub and one sharp diagonal with `route: angled`, in its bar's colour); see the labelled schematic pattern. Before answering, go down the "Check a screen" table in lcars-design.md and fix what misses.
6. **Load only the schemas you need.** `references/schema/index.json` lists every card, view and strategy with its file and the shared files it uses. Read the card's file (`references/schema/cards/<tag>.json`, 2 to 75 KB) and the shared files it references (`../shared/<name>.json`) only when the request touches them (rules, animations, background animations, state colours, filters).
7. **Read the docs page** for each card (`references/docs/cards/<card>/index.md`) for worked examples, and a gallery dashboard (`references/gallery/*.yaml`) when composing a screen. When you adapt a gallery dashboard, keep its frame but go through every label as well as every entity: the sample's names belong to the sample (a ship's name or registry such as NCC-1701-D, readouts such as EPS FLOW or SHIP STATUS, a stage or mode). Rename each to fit the user's screen, or make it a plain code block. The checker can't see these. If you write the YAML with a script, quote codes with leading zeros (`'08'`): the checker warns about them.
8. **Write the YAML** following the rules below.
9. **Check it** when you can run code: save it to a file and run `node scripts/lcards-validate.mjs <file>` (Node 20+). Fix every error. Fix every warning too: an unknown name is almost always a typo (use the suggested name); a legacy-format warning means an older chart or data grid layout that still works but can be updated. Without code execution, check each key against the schema yourself.
10. **Hand it over** with where to paste it (card editor YAML tab, or **Edit dashboard > Raw configuration editor** for a whole dashboard), which placeholder entities to replace, and two or three "ideas for later": features from the catalogue that would suit this screen but weren't used.

## Astrometrics starters

**Start an astrometrics card from a starter when one fits the idea: whole scenes (a galaxy, the solar system, Deep Space 9, the Bajoran wormhole, Earth's satellites) and parts to add (a planet, a wormhole, a nebula field, a starbase).** `references/docs/cards/astrometrics/starters.md` shows each one, and `references/docs/cards/astrometrics/index.md` ("Where to start") matches goals to them. Build them with the starter tool, not by copying the page's YAML: its settings change the whole starter at once.

- `node scripts/lcards-starter.mjs list` lists them; `show <id>` gives a starter's settings, defaults and notes; `build <id> key=value ...` prints the card YAML (values are YAML: `size=120`, `centre=[0, 0, 0]`).
- A setting of type `setting` (such as the wormhole's `power`) can follow the user's entity: `power=light.floor_lamp` opens it while the light is on, `power='{entity: light.floor_lamp, attribute: brightness_pct}'` by its brightness, and `power='{entity: media_player.tv, playing: 100, paused: 40, default: 0}'` by state. The tool threads the entity through every part that depends on it; never link a starter by editing its numbers by hand.
- A part goes into an existing card with `--into card.yaml` (its ids get the `prefix` setting); a scene replaces the card's scene unless `--merge`. Then place the card in the layout like any other and run the checker.
- Without code execution, tell the user to add the starter in the Astrometrics Studio (edit the card, **Open Astrometrics Studio**, **Starters**), which has the same settings and a link button for an entity.

## Checking YAML the user pastes

When the user pastes LCARdS YAML (theirs, or written by another tool) and asks why it doesn't work or to check it: save it to a file and run the checker on it, then explain each error and warning in plain words at its path, and give the corrected YAML. Run the checker again on your fix. Without code execution, compare each key with the card's schema and each name with `registries.json`.

## Restyling a dashboard the user pastes

When the user gives you an existing dashboard (theirs, an older LCARdS one, or from another tool) and asks to make it look right, LCARS-correct or "like the gallery":

1. Keep what it does: every entity, control and action stays, and so do the user's names and labels unless they ask otherwise. Ask the questions from step 1 that its YAML doesn't already answer (look, colours by state or by hand, the MSD leader style), and offer a few features from `references/features.md` that would suit it.
2. Rebuild it with the design guide and the patterns (step 5): fixed px tracks for small parts, theme roles for colours, the right archetype for the device, one leader style per MSD.
3. Grade it before you hand it over: go down the "Check a screen" table in `references/docs/getting-started/lcars-design.md` and give the user each row as met, fixed, or left as is with the reason. Run the checker (step 9) and fix what it reports.
4. Hand over the new YAML with a short list of what changed and why.

A CB-LCARS dashboard (`custom:cb-lcars-*-card` with `cblcars_card_type` and `cblcars_card_config`) is a restyle too: map each card with the tables in `references/docs/getting-started/cb-lcars-migration.md` ("Moving a Card Over"), keep every entity and action, and list what has no LCARdS equivalent.

## Reporting a problem or a feature request

When the user thinks LCARdS has a bug, or wants a feature, help them write a report the maintainer can verify, fix and test. Never file it yourself (no `gh issue create`, no GitHub tools): hand the user a finished draft to paste into the form. They review it and submit it.

1. **Rule out the config first.** Run the checker on their YAML (step 9) and read the card's docs page: many "bugs" are a misspelt key, a preset that doesn't exist or an option on the wrong card. Ask them to run the health check: **LCARdS** sidebar panel, **Welcome**, **Support & system info** (2026.11 and newer). If either finds the cause, fix it and stop.
2. **Look for an existing issue** at https://github.com/snootched/LCARdS/issues (open and closed). If one matches, the user adds their details there instead.
3. **Make a minimal repro:** the smallest YAML that still shows the problem. Keep the whole view when the problem is about layout or sizing. Replace real devices with helpers (`input_boolean`, `input_number`, `input_select`) the maintainer can create, and remove personal names, addresses, tokens and IPs. Check the repro with the checker too.
4. **Draft the bug report in the form's own fields** (`.github/ISSUE_TEMPLATE/bug_report.yml`):
   - **Affected card type**, **LCARdS version**, **Home Assistant version**, **browser**.
   - **LCARdS support info:** the user pastes it from **Report an issue** or **Copy support info** in the same panel section; never make it up.
   - **What happened?** What they expected, then what they saw instead. Observed facts only.
   - **Steps to reproduce**, numbered, starting from the minimal YAML.
   - **Card YAML** (the minimal repro) and **browser console output** (errors and warnings, if any).
   - **Additional context:** the last version that worked, any workaround they found, and, only if they have one, a suspected cause marked **"Guess, not confirmed:"**. Never a proposed code fix.
5. **One problem per report.** Two problems are two reports.
6. **A feature request** uses the feature form: what the user is trying to do and why, what they do today instead, and what would help. Describe the goal, not how to build it.
7. **Hand over** the draft as markdown, section by section in the form's order, and tell the user to open it with **Report an issue** in the LCARdS panel (it fills in the versions and support info) or at https://github.com/snootched/LCARdS/issues/new/choose.

A user who wants to change LCARdS code themselves sends a pull request: point them (or their coding assistant) to `CONTRIBUTING.md` in the repository, whose "Instructions for AI assistants" cover the rest.

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
- Astrometrics numbers that follow an entity (any number on a point or object, the card's `time_scale`, `warp_factor`): a range `{ entity, attribute, input, output, clamp, smooth }` (the `map_range` words), or a value per state with the state colour keys and numbers (`active`, `inactive`, `unavailable`, `zero`, `non_zero`, `above:N`, `between:A:B`, any state: `{ entity: media_player.tv, playing: 1, paused: 0.4, default: 0 }`). A matching state wins, then the range, then `default` (the value while the entity has no number). For a light's brightness use `attribute: brightness_pct` (0 to 100 %, 0 while off); `brightness` is 0 to 255. Read by its state alone, an active entity (on, playing, home) is the high end of `input` (`references/docs/cards/astrometrics/data.md`).
- Quote `y`, `n`, `yes`, `no`, `on`, `off` (any case) wherever they are keys or bare values: `"y": 20`, `label: "N"`, `state: "on"`. Home Assistant's code editor (2026.8+) reads them unquoted as `true`/`false`; the checker warns about each.
- Actions from automations or buttons: `lcards.red_alert`, `lcards.clear_alert`, `lcards.trigger_effect`, `lcards.play_sound`, ... (`references/docs/configuration/ha-actions.md`).

## What's here

- `references/features.md`: what LCARdS can do, grouped by goal, with ideas per entity type; read it when proposing a design or when the user asks what's possible.
- `references/schema/`: `index.json`; `cards/`, `views/`, `strategies/` (one JSON Schema each); `shared/`; `registries.json` (built-in names).
- `references/docs/`: the user docs as markdown, by section (`getting-started/`, `configuration/`, `cards/`, `core/`).
- `references/gallery/`: complete example dashboards (they use `lcards_test_*` placeholder helpers).
- `references/ha-lcars/`: `variables.md` (every `--lcars-*` variable, what it colours, its default), `themes.md` (each theme's colours, selecting a theme, helper entities), `guide.md` (HA-LCARS install, classes, layout tips). Generated from HA-LCARS at the commit named in each file.
- `references/uix/`: the UIX styling docs (`quick-start.md`, `faq.md`, `using/cards.md`, `using/templates.md`, `using/themes.md`, `concepts/dom.md`, ...). For UIX Forge and Broker, see the UIX site.
- `scripts/lcards-preview-link.mjs` (and `.py` for Python): a link to the docs' preview page with the YAML inside, and a page file that opens it (step 4).
- `scripts/lcards-starter.mjs`: astrometrics starters as card YAML, with their settings (see "Astrometrics starters").
- `scripts/lcards-validate.mjs`: the config checker (`--json` for machine-readable output, `--strict` to fail on warnings). It also warns on a misspelt `var(--lcars-...)`. In the Claude Code plugin it runs by itself on every LCARdS YAML file you write; read and fix what it reports.
