---
description: "Select menu card: an input_select or select entity as a grid of LCARS option buttons, or a manual menu of buttons with their own actions."
moved_anchors:
  common-properties: /cards/select-menu/#card-options
  config-structure: /cards/select-menu/#card-options
  grid-object: /cards/select-menu/layout#grid
  height-modes: /cards/select-menu/layout#height-modes
  options: /cards/select-menu/options#options
  object-form-entity-order-per-option-overrides: /cards/select-menu/options#object-form
  array-form-explicit-order-and-filtering: /cards/select-menu/options#array-form
  per-option-fields: /cards/select-menu/options#per-option-fields
  actions: /cards/select-menu/options#actions
  style-object: /cards/select-menu/styles#style
  text-layer-visibility: /cards/select-menu/styles#text-layer-visibility
  button-template: /cards/select-menu/styles#button-template
  rules-engine: /cards/select-menu/styles#rules-engine
  full-example: /cards/select-menu/styles#full-example
---

# Select Menu Card

`custom:lcards-select-menu`

**A grid of LCARS buttons, one per option of an `input_select` or `select` entity: tap one to select it.** The selected option lights up, and the card follows the entity when something else changes it.

- Each option is a real [button card](../button/) underneath, so every button preset and the button's `style` keys work here.
- Without an entity, the card is a manual menu: list the buttons in `options` and give each one its own action.

::: tip Try it
- The card editor has tabs for the config, the grid, the style, the options and the actions, with a live preview.
- The [Playground](./playground) lets you edit select menu YAML here in the docs and see the result.
:::

| Page | Covers |
|------|--------|
| [Options and Actions](./options) | Which options show, their labels and icons, and what a tap does |
| [Grid and Sizing](./layout) | Columns, gaps and row height, and how the card sizes itself in a dashboard |
| [Styles](./styles) | Colours, text and borders for every option, the button template, rules |
| [Playground](./playground) | Edit YAML and see the select menu live |

---

## Quick Start

**Three menus to start from: an entity's options as they are, the same options with your own labels, and a manual menu of navigation buttons.** Tap an option in the first two to select it.

- `grid.columns` sets how many buttons sit side by side; the card adds rows for the rest.
- Keys under `options` must match the entity's option values exactly, including case.

```yaml live
# The entity's options, one column
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: lozenge
```

```yaml live
# Four columns with your own labels
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: capped
grid:
  columns: 4
  gap: 6px
options:
  Auto:
    label: AUTO
  Cool:
    label: CHILL
  Heat:
    label: WARM
  "Off":
    label: STANDBY
```

```yaml live
# A manual menu: no entity, each option navigates
type: custom:lcards-select-menu
preset: lozenge
grid:
  columns: 2
  gap: 4px
options:
  - value: bridge
    label: BRIDGE
    tap_action:
      action: navigate
      navigation_path: /lovelace/bridge
  - value: engineering
    label: ENGINEERING
    tap_action:
      action: navigate
      navigation_path: /lovelace/engineering
```

## Layouts and Presets

**`preset` picks the button look for every option, and `grid` arranges them.** A few layouts and presets against a sample `input_select` (tap an option to select it):

<CardGallery set="select-menu-layouts" />

## Card Options

**The select menu's own top-level keys.** Each block has its own page; this table links to it.

- The card also takes the keys every LCARdS card takes (`height`, `width`, `overflow`, `z_index`, `grid_options`, `id`, `tags`, `data_sources` ...): see [Common card properties](../common).
- In a sections view the card asks for enough rows to show every option ([Grid and Sizing](./layout#sizing-in-a-dashboard)).

```yaml live
type: custom:lcards-select-menu
entity: input_select.lcards_test_mode
preset: bullet
grid:
  columns: 3
hold_action:
  action: more-info
```

::: details More about the entity
- **Domains:** `input_select.*` options are set with `input_select.select_option`, and `select.*` options with `select.select_option`.
- **Loading:** while the configured entity is not in Home Assistant, the card shows "Loading…" instead of buttons.
- **No entity:** the card cannot list options or show which one is selected, so it needs array-form `options`, and a tap does nothing unless the option or the card sets a `tap_action`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | string | required | `custom:lcards-select-menu` |
| `entity` | string | - | The `input_select` or `select` entity whose options become buttons and whose state marks the selected one |
| `preset` | string | - | The [button preset](../button/#presets) every option button uses (`lozenge`, `bullet`, `capped`, `outline`, `toggle-tab` ...) |
| `grid` | object | one column | How the buttons are arranged: see [grid](./layout#grid) |
| `options` | object / list | the entity's options | Labels, icons, styles and actions per option, and which options show: see [options](./options#options) |
| `style` | object | from the preset | Colours, text and borders for every option: see [style](./styles#style) |
| `button_template` | object | - | Any other button card keys for every option: see [button_template](./styles#button-template) |
| `tap_action` | object | select the option | Replaces the tap of every option: see [Actions](./options#actions) |
| `hold_action` | object | `action: none` | Hold action for every option |
| `double_tap_action` | object | `action: none` | Double-tap action for every option |
