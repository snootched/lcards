---
description: "Button card: LCARS buttons, labels, panels and bar-label headers from presets, D-pads, alert symbols, bracket and radar displays, and your own interactive SVG."
moved_anchors:
  common-properties: /cards/button/#card-options
  config-structure: /cards/button/#card-options
  modes: /cards/button/#card-options
  control: /cards/button/#card-options
  style-object: /cards/button/styles
  style-card: /cards/button/styles#style-card
  style-cursor: /cards/button/styles#style-cursor
  style-border: /cards/button/styles#style-border
  text-fields: /cards/button/styles#text-fields
  filters-list: /cards/button/styles#filters
  decorative-non-interactive-buttons: /cards/button/styles#interactive
  annotated-example: /cards/button/styles#annotated-example
  icon-style-object: /cards/button/icons#icon-style
  per-state-icons: /cards/button/icons#per-state-icons
  divider-object: /cards/button/icons#divider
  shape-texture: /cards/button/textures#shape-texture
  available-presets: /cards/button/textures#available-presets
  background-animations: /cards/button/textures#background-animation
  component-mode-d-pad: /cards/button/components#dpad
  voyager-d-pad: /cards/button/components#dpad-voyager
  component-mode-brackets-and-radar: /cards/button/components#brackets-and-radar
  component-mode-alert: /cards/button/components#alert
  alert-object: /cards/button/components#alert
  ranges-list-state-driven-preset-switching: /cards/button/components#ranges
  custom-svg-mode: /cards/button/custom-svg
  svg-object: /cards/button/custom-svg#svg
---

# Button Card

`custom:lcards-button`

**The LCARS building block: a toggle button, a label, a panel or a section header, or a D-pad, alert symbol or round display.** Most buttons need only an `entity` and a `preset`.

- A button is drawn one of three ways: a `preset` shape, a `component` (a D-pad, the alert symbol, bracket arcs or a radar scope), or your own `svg`.
- The [Elbow card](../elbow/) is built on the button, so most of these pages apply to elbows too.

::: tip Try it
- The card editor's tabs cover the options on these pages, with a live preview.
- The [Playground](./playground) lets you edit button YAML here in the docs and see the result.
:::

| Page | Covers |
|------|--------|
| [Style, Text and Hover](./styles) | Background and border colours, text, hover and cursor, filters |
| [Icons](./icons) | The icon, its area beside the text, per-state icons, the divider |
| [Textures and Backgrounds](./textures) | Moving textures inside the shape and animated backgrounds |
| [D-pads, Alerts and Scopes](./components) | The D-pad, Voyager D-pad, alert symbol, brackets and radar |
| [Custom SVG](./custom-svg) | Your own SVG with tappable parts |
| [Playground](./playground) | Edit YAML and see the button live |

---

## Quick start

**Two examples to start from: a light you toggle, and a section header.**

- Presets hide their text until you ask for it: `text.name.show: true` shows the entity's name.

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
```

```yaml live
type: custom:lcards-button
preset: bar-label-left
interactive: false
text:
  label:
    content: NAVIGATION
```

## Presets

**`preset` picks the shape and the text layout.** Any `style`, `text` or icon key you set overrides the preset.

### Standard Buttons

**Filled, outlined and text-only buttons with rounded, half-rounded or square ends.** The `-right` versions put the icon area on the right.

<CardGallery set="button-presets" />

- The `toggle-tab` line is the tab's top border, so it can go on any side at any thickness: `style.border.width.left: 6` with `top: 0` moves it to the left edge.

| Preset | Description |
|--------|-------------|
| `lozenge` | Rounded at both ends, icon area on the left |
| `lozenge-right` | Rounded at both ends, icon shown on the right |
| `bullet` | Flat left end, rounded right end, icon area on the left |
| `bullet-right` | Rounded left end, flat right end, icon shown on the right |
| `capped` | Rounded left end, flat right end, icon area on the left |
| `capped-right` | Flat left end, rounded right end, icon shown on the right |
| `barrel` | Square corners, no border, icon area on the left |
| `barrel-right` | Square corners, no border, icon area on the right |
| `filled` | Square filled block with the name on the right |
| `filled-right` | Square filled block with the name on the left |
| `outline` | Transparent background with a border (Picard style) |
| `outline-right` | Like `outline`, icon area on the right |
| `icon` | Square icon-only button with rounded corners |
| `text-only` | No background or border: text alone |
| `toggle-tab` | Dark square tab with a centred name; a coloured line along the top shows the state |

### Panels

**Square-cornered blocks with a code label, for number columns and fillers.** With an entity they show the theme accent when on and the dark structure tone when off.

- Panels are decorative: they set `interactive: false`, so they don't change colour on hover.

<CardGallery set="button-panels" />

| Preset | Description |
|--------|-------------|
| `panel-light` | Light structure block with a code label |
| `panel-dark` | Dark structure block with a code label |
| `panel-flagged` | Dark code block with a thin accent flag on its left edge |

### Bar Labels

**Horizontal bars whose text sits on a black background that breaks the bar: the classic LCARS header.** The text grows with the card's height.

- A bar label is 56 px tall (one sections-view row) unless you set `height`.

<CardGallery set="button-bar-labels" />

| Preset | Description |
|--------|-------------|
| `bar-label-base` | Bar label foundation: filled bar, text that scales with the height, centred |
| `bar-label-left` | Text on the left |
| `bar-label-center` | Text centred |
| `bar-label-right` | Text on the right |
| `bar-label-square` | Square corners |
| `bar-label-lozenge` | Rounded at both ends |
| `bar-label-bullet-left` | Flat left end, rounded right end |
| `bar-label-bullet-right` | Rounded left end, flat right end |
| `bar-label-capped-left` | Rounded left end, flat right end |
| `bar-label-capped-right` | Flat left end, rounded right end |

## Card options

**The button's own top-level keys.** Each block has its own page; this table links to it.

- The button also takes the keys every LCARdS card takes (`height`, `width`, `grid_options`, `id`, `tags`, `tap_action`, `hold_action`, `double_tap_action`, `animations`, `sounds`, `data_sources`, `rules` ...): see [Common card properties](../common).
- Set one of `preset`, `component` or `svg`. With `component`, `preset` names the component's own preset (such as `condition_red` on the alert).

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge-right
icon: mdi:sofa
text:
  name:
    show: true
tap_action:
  action: toggle
hold_action:
  action: more-info
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | string | required | `custom:lcards-button` |
| `entity` | string | - | The entity the button shows and acts on |
| `preset` | string | - | The shape: see [Presets](#presets). With `component`, the component's preset |
| `component` | string | - | `dpad`, `dpad_voyager`, `alert`, `brackets` or `radar`: see [D-pads, Alerts and Scopes](./components) |
| `svg` | object | - | Your own SVG: see [Custom SVG](./custom-svg) |
| `style` | object | from the preset | Background, border, cursor and text defaults: see [Style, Text and Hover](./styles) |
| `text` | object | from the preset | Text on the card: see [Text fields](./styles#text-fields) |
| `interactive` | boolean | `true` with an action or a switchable entity, else `false` | `false`: no hover colour or hover animations. See [interactive](./styles#interactive) |
| `filters` | list | - | CSS and SVG filters: see [filters](./styles#filters) |
| `show_icon` | boolean | `false`, `true` on some presets | Show the icon: see [Icons](./icons#icon) |
| `icon` | string | the entity's icon | The icon: see [Icons](./icons#icon) |
| `icon_area` | string | `left` | Where the icon's area sits: see [Icons](./icons#icon) |
| `icon_area_size` | number | fits the icon | Width (or height) of the icon area: see [Icons](./icons#icon) |
| `icon_area_background` | colour / state map | - | Background of the icon area: see [Icons](./icons#icon) |
| `icon_style` | object | - | Icon colour, size, position: see [icon_style](./icons#icon-style) |
| `divider` | object | from the preset | The line between icon and text: see [divider](./icons#divider) |
| `shape_texture` | object | - | A texture inside the shape: see [shape_texture](./textures#shape-texture) |
| `background_animation` | list | - | An animated background: see [background_animation](./textures#background-animation) |
| `dpad` | object | - | D-pad segments: see [dpad](./components#dpad) |
| `dpad_voyager` | object | - | Voyager D-pad segments: see [dpad_voyager](./components#dpad-voyager) |
| `brackets` | object | - | Bracket segments: see [Brackets and Radar](./components#brackets-and-radar) |
| `radar` | object | - | Radar segments: see [Brackets and Radar](./components#brackets-and-radar) |
| `alert` | object | - | Alert colours and presets: see [alert](./components#alert) |
| `ranges` | list | - | Switch the component's preset by value: see [ranges](./components#ranges) |
| `ranges_attribute` | string | the state | The attribute that [range colours](/core/colours/attributes#ranges-attribute) and `ranges` compare |
| `state_attribute` | string | - | The attribute whose value picks [exact-match colours](/core/colours/attributes#state-attribute) |
| `state_classification` | object | - | Which states count as active or inactive: see [state_classification](/core/colours/attributes#state-classification) |
