# Select Menu Card

`custom:lcards-select-menu`

Renders an `input_select` or `select` entity as a grid of LCARS-styled option buttons. Tapping a button calls `select_option` on the entity and the card updates immediately to reflect the new active option.

Each button is a full `lcards-button` under the hood, so every preset, style override, and action type the button card supports is available here.

---

## Quick Start

```yaml
# Minimal — entity options auto-enumerated, single column, lozenge preset
type: custom:lcards-select-menu
entity: input_select.view_selector
preset: lozenge
```

```yaml
# 3-column grid with custom labels and icons
type: custom:lcards-select-menu
entity: input_select.room_scene
preset: lozenge
grid:
  columns: 3
  gap: 6px
options:
  Relax:
    label: RELAX
    icon: mdi:sofa
  Movie:
    label: MOVIE
    icon: mdi:television-play
  Work:
    label: WORK
    icon: mdi:desk-lamp
```

```yaml
# Manual options list (no entity required)
type: custom:lcards-select-menu
preset: lozenge
grid:
  columns: 2
  gap: 4px
options:
  - value: bridge
    label: BRIDGE
    icon: mdi:bridge
    tap_action:
      action: navigate
      navigation_path: /lovelace/bridge
  - value: engineering
    label: ENGINEERING
    tap_action:
      action: navigate
      navigation_path: /lovelace/engineering
```

---

## Top-Level Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-select-menu` (required) |
| `entity` | string | `input_select.*` or `select.*` entity to monitor and control |
| `preset` | string | Button shape preset applied to every option button (e.g. `lozenge`, `bullet`) |
| `id` | string | Card ID for rule targeting |
| `tags` | list | Tags for rule targeting (e.g. `[nav, scenes]`) |
| `grid` | object | Layout grid — see [`grid`](#grid-object) below |
| `options` | object / list | Option overrides — see [`options`](#options) below |
| `style` | object | Visual style overrides for all buttons — see [`style`](#style-object) below |
| `button_template` | object | Advanced base `lcards-button` config applied to every option — see [`button_template`](#button_template) below |
| `tap_action` | object | Card-level tap action fallback — see [Actions](../../../core/actions.md) |
| `hold_action` | object | Card-level hold action fallback |
| `double_tap_action` | object | Card-level double-tap action fallback |
| `grid_options` | object | HA grid layout (`columns`, `rows`) |

---

## `grid` Object

Controls how the option buttons are arranged.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `columns` | number / string | `1` | Number of equal-width columns, or any valid CSS `grid-template-columns` string |
| `grid-template-columns` | string | — | Raw CSS value — overrides `columns` when set |
| `gap` | string | `4px` | Gap applied to both rows and columns |
| `row_gap` / `row-gap` | string | `gap` | Row gap override |
| `column_gap` / `column-gap` | string | `gap` | Column gap override |
| `grid-auto-rows` | string | `56px` | Height of each row |
| `grid-auto-flow` | string | `row` | CSS `grid-auto-flow` value |

```yaml
grid:
  columns: 3
  gap: 6px
  grid-auto-rows: 48px
```

---

## `options`

Defines which options appear and how each one looks. Two forms are accepted:

### Object form — entity order, per-option overrides

Keys match the entity's option values (case-sensitive). The order of the entity attribute is preserved. Any option not listed in the object still appears with its defaults.

```yaml
options:
  Bridge:
    label: BRIDGE
    icon: mdi:bridge
  Engineering:
    label: ENGINEERING
    icon: mdi:engine
```

### Array form — explicit order and filtering

Provides full control over order, and options not listed are hidden. A `value` field is required for each entry. Use this form for manual menus that don't need an entity.

```yaml
options:
  - value: bridge
    label: BRIDGE
    icon: mdi:bridge
    tap_action:
      action: navigate
      navigation_path: /lovelace/bridge
  - value: engineering
    label: ENGINEERING
```

### Per-option fields

| Field | Type | Description |
|-------|------|-------------|
| `value` | string | Entity option value (required in array form; the key in object form) |
| `label` | string | Display text. Defaults to `value` |
| `icon` | string | MDI icon (e.g. `mdi:home`). Sets `show_icon: true` automatically |
| `style` | object | Per-option style overrides — same structure as card-level [`style`](#style-object) |
| `tap_action` | object | Per-option tap action — see [Actions](../../../core/actions.md) |
| `hold_action` | object | Per-option hold action |
| `double_tap_action` | object | Per-option double-tap action |

---

## `style` Object

Applies to every option button. Same structure as the button card's [`style`](../button/README.md#style-object).

The style resolves in this order (last wins): preset defaults → `button_template.style` → card-level `style` → per-option `style`.

```yaml
style:
  card:
    color:
      background:
        default: "#223355"
        active: "#FF9900"
  border:
    radius: 14
    width: 0
  text:
    default:
      font_size: 11
      letter_spacing: "0.08em"
      text_transform: uppercase
```

### Text layer visibility

The card manages text layer visibility automatically:

| Layer | Default | Notes |
|-------|---------|-------|
| `text.label` | `show: true` | **Primary display text** — always shows the option label |
| `text.name` | `show: false` | Hidden by default (would show LCARS top-left tag) |
| `text.state` | `show: false` | Hidden by default |

To restore `name` or `state` visibility, add them to `button_template.text`:

```yaml
button_template:
  text:
    state:
      show: true
```

---

## `button_template`

Advanced config that is spread into every option's `lcards-button` config before card-level and per-option values are applied. Use this to set button properties that are not directly exposed by the select-menu (e.g. `min_height`, `padding`, background animations, sounds).

The following fields are **always stripped** from `button_template` because the card manages them directly: `type`, `entity`, `icon`, `show_icon`, `preset`, `tap_action`, `hold_action`, `double_tap_action`, `id`, `tags`, `text.label.content`.

```yaml
button_template:
  min_height: 40
  text:
    label:
      font_size: 10
      letter_spacing: "0.1em"
  background_animation:
    - preset: scanlines
      opacity: 0.05
```

The **Style tab** in the visual editor opens a full `lcards-button` sub-editor to configure the template interactively.

---

## Actions

Actions follow a waterfall priority — the first value found in this chain wins:

```
per-option action → card-level action → button_template action → built-in default
```

**Default tap action** calls `input_select.select_option` (or `select.select_option` for `select.*` entities) with the option's value.

**Hold and double-tap** default to `{ action: none }` so they do not fall through to the tap action unintentionally. Set them explicitly at card-level or per-option to add behaviour.

```yaml
# Card-level hold opens more-info for all options
hold_action:
  action: more-info

# Per-option override for one specific option
options:
  - value: settings
    label: SETTINGS
    tap_action:
      action: navigate
      navigation_path: /config
```

---

## Supported Entity Domains

| Domain | Notes |
|--------|-------|
| `input_select.*` | Full read/write — calls `input_select.select_option` |
| `select.*` | Full read/write — calls `select.select_option` |

The `entity` field is optional. Omitting it disables automatic option enumeration and active-state detection — use with array-form `options` for fully manual menus.

---

## Rules Engine

The card registers with the rules engine as type `select-menu`. Use `id` and `tags` to target it from rules.

```yaml
rules:
  - conditions:
      - entity: binary_sensor.away_mode
        state: "on"
    targets:
      - tags: [nav]
    patches:
      style:
        card:
          color:
            background:
              default: "#1a1a2e"
```

---

## Full Example

```yaml
type: custom:lcards-select-menu
entity: input_select.deck_view
preset: lozenge
id: deck-nav
tags: [nav]

grid:
  columns: 3
  gap: 6px
  grid-auto-rows: 52px

style:
  border:
    radius: 14
  text:
    default:
      font_size: 10
      letter_spacing: "0.08em"
      text_transform: uppercase

button_template:
  text:
    label:
      font_size: 10

options:
  - value: bridge
    label: BRIDGE
    icon: mdi:bridge
  - value: engineering
    label: ENGINEERING
    icon: mdi:engine
  - value: sickbay
    label: SICKBAY
    icon: mdi:medical-bag
  - value: tactical
    label: TACTICAL
    icon: mdi:radar
  - value: holodecks
    label: HOLODECKS
    icon: mdi:virtual-reality
  - value: science
    label: SCIENCE
    icon: mdi:flask

tap_action:
  action: perform-action
  perform_action: input_select.select_option
  target:
    entity_id: input_select.deck_view
hold_action:
  action: more-info
double_tap_action:
  action: none
```
