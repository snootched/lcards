# What LCARdS can do: a catalogue for suggesting features

Use this file while you talk with the user (SKILL.md, "Workflow"). It lists what LCARdS can do, grouped by what someone wants their screen to do, so you can suggest things they may not know exist. Each line says what the feature is and where to read the details before you write any YAML. The names themselves (every preset, animation, background, sound, model) are in `schema/registries.json`; the docs pages in each line describe them.

Paths are relative to `references/`. Suggest only what fits the user's entities and the screen; one or two less-known ideas per proposal are better than the whole list.

## Make a reading feel alive

- **Colours that follow state.** Any colour key takes a state map (`active`, `inactive`, `unavailable`, a state name, `zero`, `above:N`, `between:A:B`), from the entity or from an attribute such as a light's brightness. `docs/core/colours/state-maps.md`, `docs/core/colours/attributes.md`.
- **Gauges and bars.** The slider card shows a sensor read-only as pill bars, a ruler gauge, a shaped fill, a ring gauge or a Picard gauge column, with coloured value bands and value markers. Slider presets in `registries.json` (`slider_presets`). `docs/cards/slider-card/index.md`, `docs/cards/slider-card/components.md`, `docs/cards/slider-card/ranges.md`.
- **Brackets round a value.** The button's `brackets` component frames a reading in LCARS bracket arcs. `docs/cards/button/components.md`.
- **Animations when something changes.** 42 animation presets (pulse, glow, blink, ripple, shimmer, text-decode, text-scramble, sensor-sweep, ...), played on a tap, on hover, when the card appears, when an entity changes (gated by from/to state, looping while a condition holds) or from a rule. `animation_presets`; `docs/core/animations.md`, `docs/core/animations/triggers.md`, `docs/core/animations/entity-change-triggers.md`, `docs/core/animations/preset-reference.md`.
- **Numbers that follow an entity.** Animation and background settings can follow a value with `map_range` (a fan's speed drives a starfield's speed). `docs/core/animations/timing-and-easing.md`, `docs/core/effects/background-animations/binding-and-animation.md`.
- **Textures inside shapes.** Buttons and elbows fill their own shape with a texture (grid, dots, fluid, plasma, shimmer, flow, level, pulse, scanlines, image); `level` fills to a value. `docs/cards/button/textures.md`, `docs/cards/elbow/appearance.md`.
- **Text that formats itself.** Templates in any text field: `{entity.state}` tokens, `[[[ ]]]` JavaScript, `{{ }}` Jinja2, `{ds:name}` data source values; friendly, raw or split state display. `docs/core/templates/index.md`, `docs/core/text-fields-content.md`.

## React to the house

- **Alert modes.** Red, yellow, blue, gray and black alert recolour every dashboard at once, play the alert sound and raise the alert overlay. Raise them from automations (`lcards.red_alert`, `lcards.set_alert_mode`, ...) or a button. `docs/core/alert-mode.md`, `docs/configuration/ha-actions.md`.
- **The alert overlay.** A full-screen alert symbol with blur and tint behind it, or a band across the screen that leaves the dashboard usable; different content, text and effects per condition, auto-dismiss. `docs/cards/alert-overlay/index.md`, `docs/cards/alert-overlay/conditions.md`, `docs/cards/alert-overlay/band.md`.
- **Alert colours tuned by the user.** The Alert Mode Lab in the LCARdS panel sets how each alert recolours the screen. `docs/configuration/alert-mode-lab.md`.
- **Rules.** Restyle any card or group of cards (by `id` or `tag`) while a condition holds: entity states, numbers, time of day, weekday, sun elevation, templates; rules also start animations and tint an MSD blueprint. `docs/core/rules/index.md`, `docs/core/rules/conditions.md`, `docs/core/rules/examples.md`.
- **Screen effects.** Full-screen blur, colour filters, tints, vignettes, TV static, pixelation, glitches and scanlines over every dashboard, fired from an automation (`lcards.trigger_effect`). `docs/core/effects/screen-effects.md`.
- **Sounds.** LCARS beeps on taps, toggles and alerts with a sound scheme, per-card overrides and muting, and `lcards.play_sound` from automations (a chime when the door opens). Sound assets and events in `registries.json`. `docs/core/sounds.md`, `docs/configuration/sounds.md`.
- **Pop-up cards.** `lcards.show_portal_card` puts any card over the screen from an automation (a camera when the doorbell rings). `docs/configuration/ha-actions.md`.
- **The connection overlay.** A full-screen LCARS screen while a browser loses its connection to Home Assistant. `docs/configuration/connectivity.md`.
- **The Borg.** An Easter egg: the whole dashboard turns Borg green with an assimilation intro, from `lcards.borg_assimilate`. `docs/core/borg.md`, `docs/core/borg-actions.md`.
- **One device or user only.** Effects, alerts and sounds can target some browsers or users. `docs/configuration/ha-actions.md` (Targeting), `docs/configuration/users-devices.md`, `docs/configuration/browser-mod.md`.

## Show one big thing

- **MSD (Master Systems Display).** A ship blueprint or the user's own floor plan with Home Assistant cards placed on it and joined by routed lines, labelled schematics with leader lines, shapes for rooms and zones that colour by entity, animations and rules. Built-in blueprints in `msd_backgrounds` (a Galaxy class line drawing among them). `docs/cards/msd/index.md`, `docs/cards/msd/quick-start.md`, `docs/cards/msd/background.md`, `docs/cards/msd/line-overlay.md`, `docs/cards/msd/shape-overlay.md`.
- **Astrometrics.** 3D scenes: galaxy maps with territories, sector maps, a sky dome with the sun and moon where they really are, the solar system at real positions, real Earth satellites, a radar scope, starbases and ships (built-in models of the Enterprise-D, the refit Enterprise, Deep Space 9, Earth Spacedock, Utopia Planitia), nebulae, wormholes, the Borg cube. Points can follow entities (a phone on a globe), numbers and colours can follow states, tap a point to fly to it. Start from a starter scene. `docs/cards/astrometrics/index.md`, `docs/cards/astrometrics/starters.md`, `docs/cards/astrometrics/data.md`, `docs/cards/astrometrics/effects.md`, `docs/cards/astrometrics/objects.md`.
- **Charts.** Lines, areas, columns, heatmaps, gauges, pies, radar, timelines of states, range bands; from history, long-term statistics or data sources; threshold lines, state bands behind a series (when the heating was on), linked charts that zoom together. `docs/cards/chart/index.md`, `docs/cards/chart/types.md`, `docs/cards/chart/series.md`, `docs/cards/chart/examples.md`.
- **Data grid.** A block of LCARS numbers with the colour cascade (decorative), or real rows of entity states and templates with colours by value. `docs/cards/data-grid/index.md`, `docs/cards/data-grid/data.md`.

## Control things

- **Buttons.** 28 presets (lozenge, bullet, capped, pill, outline, bar labels, panels, toggle tab, ...); tap, hold and double-tap actions; confirmation before an action. `button_presets`; `docs/core/presets.md`, `docs/core/actions.md`, `docs/cards/button/index.md`.
- **Sliders.** Lights, covers, fans, climate and media players, horizontal or vertical, with separate display and control ranges. `docs/cards/slider-card/control.md`.
- **Select menu.** An `input_select` or `select` entity as a grid of option buttons, or a menu of buttons with their own actions (scenes, modes). `docs/cards/select-menu/index.md`.
- **D-pad.** The LCARS and Voyager D-pads with an action per segment (a TV remote, a camera). Button components (`component:` dpad, dpad_voyager, brackets, alert) in `registries.json` (`components`). `docs/cards/button/components.md`.
- **Your own SVG.** Draw a button from SVG; every element with an id is a tappable segment with its own entity and colours. `docs/cards/button/custom-svg.md`.
- **Controls on a schematic.** Any card placed on an MSD (a light switch in its room on the floor plan). `docs/cards/msd/control-overlay.md`.
- **Automations driving the screen.** Every `lcards.*` action (alerts, effects, sounds, astrometrics fly-to and clock, portal cards). `docs/configuration/ha-actions.md`.

## Frame and decorate

- **Elbows and frames.** LCARS corners, caps, slanted bars and frames; simple or segmented (Picard double elbow); text on the bars; another card inside the open area (a symbiont) styled to match. The shapes (`elbow.type`: header-left, footer-open, bar-slant-left, frame, ...) are listed under `components.elbow` in `registries.json`. `docs/cards/elbow/index.md`, `docs/cards/elbow/bars.md`, `docs/cards/elbow/frame.md`, `docs/cards/elbow/symbiont.md`.
- **Background animations.** Animated layers behind buttons, elbows, sliders, MSDs and astrometrics: grids, starfields, warp starfield, nebula, data cascade, plasma, fluid, holo sphere, scanlines; stack several, zoom them outward. `background_presets`; `docs/core/effects/background-animations.md`, `docs/core/effects/background-animations/stacking-and-zoom.md`.
- **Filters.** Stack CSS and SVG filters (blur, glow, tint, turbulence, displacement) on a card or a blueprint. `filters`; `docs/core/effects/filters.md`, `docs/cards/msd/base-svg-filters.md`.
- **Number cascades and code blocks.** A decorative data grid, short groups of numbers between blocks. `docs/getting-started/lcars-patterns.md`.
- **Alert symbol.** The Starfleet alert symbol as a button component, switched by value or condition. `docs/cards/button/components.md`.

## Lay out the screen

- **Layout view.** A whole dashboard view as one CSS grid with named areas, edited in place on the dashboard. `docs/cards/layout-view/index.md`, `docs/getting-started/build-by-hand.md`.
- **Layout card.** A sub-grid inside one card, with the visual Layout Studio. `docs/cards/layout-card/index.md`.
- **The LCARS shell strategy.** A ready-made LCARS frame generated as a whole dashboard (`strategy: { type: custom:lcars-shell }`). `schema/strategies/lcars-shell.json`, `docs/getting-started/lcars-patterns.md`.
- **Screen archetypes and patterns.** Ready layouts (display, portrait panel, tile wall, ...) and modules to fill them. `docs/getting-started/lcars-design.md`, `docs/getting-started/lcars-patterns.md`, the gallery (`gallery/`).
- **Visibility.** Cards inside a layout keep Home Assistant's visibility conditions (show the garage tile only while the door is open). `docs/cards/layout-card/index.md`.

## Look and theme

- **HA-LCARS themes.** The HA-LCARS theme sets the colours, fonts and sizes; LCARdS cards follow it through theme roles. `ha-lcars/themes.md`, `ha-lcars/variables.md`, `docs/configuration/ha-lcars-theme-profiles.md`.
- **Theme Lab.** The user builds their own HA-LCARS palette in the LCARdS panel. `docs/configuration/ha-lcars-theme-lab.md`.
- **Theme tokens.** `theme:colors.ui.primary` and friends, so a screen follows the theme and recolours in alert modes. `docs/core/themes/index.md`.

## Compute and combine data

- **Data sources.** Follow an entity in the browser, keep its history, and run it through processors (smoothing, scaling, unit conversion, rolling statistics), then show it in text (`{ds:name}`) or a chart. `docs/core/datasources/index.md`, `docs/core/datasources/processor-reference.md`.
- **Templates.** Four kinds, in any text and most values. `docs/core/templates/index.md`.

## Suggestions by entity

Starting points; pick what suits the screen.

| The user has | Ideas |
|---|---|
| `light` | button that toggles, colour by state or brightness (`ranges_attribute`), slider for brightness, `level` texture filling to brightness |
| `switch`, `input_boolean`, `fan` | toggle buttons in a pill group, an animation on change, a fan's speed driving a background's speed |
| `cover` | vertical slider, a shaped fill, a select menu of positions |
| `climate` | slider for the set point, a chart with state bands for heating, a rule that turns the panel orange above a temperature |
| `sensor` (temperature, power, humidity) | readings table, ruler or ring gauge with value bands, chart with a threshold line, a data source to smooth it |
| `binary_sensor` (door, motion, leak) | status lamp coloured by state, an alert or a sound from an automation, a pulse animation while open |
| `media_player` | D-pad as a remote, volume slider, a select menu of sources |
| `input_select`, `select` | select menu |
| `person`, `device_tracker` | a point on an astrometrics globe or map, a status tile |
| `sun.sun`, location | the sky dome with the real sun and moon, rules by sun elevation (day and night look) |
| `alarm_control_panel` | alert modes and the alert overlay, a confirmation on arm and disarm |
| a floor plan or a favourite ship | an MSD with controls in each room or system |
