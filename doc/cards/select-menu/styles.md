---
description: "Select menu card styles: background, text and border colours for selected and unselected options, the button_template for any other button key, which text fields show, rules and a full example."
---

# Styles

How the option buttons look: colours for the selected and the other options, text and borders, and any other button card key through the button template.

## style

**`style` sets the colours, text and borders of every option button, on top of the preset.** It has the same shape as the [button card's style](../button/styles), so a colour can be a state map.

- In a state map, `active` is the selected option and `inactive` the others. `hover` and `pressed` apply while the pointer is over a button or pressing it, `unavailable` when the entity is unavailable, and `default` on a menu without an entity.
- Each layer wins over the one before, key by key: the preset, then `button_template.style`, then the card's `style`, then the option's own [`style`](./options#per-option-fields), then [rules](#rules-engine).
- `opacity` dims every option but the selected one, so the selection stands out.

```yaml live
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: lozenge
grid:
  columns: 4
  gap: 6px
style:
  card:
    color:
      background:
        active: var(--lcars-orange)
        inactive: var(--lcars-dark-gray)
  text:
    default:
      color:
        active: var(--lcars-black)
        inactive: var(--lcards-moonlight)
      font_size: 18
      font_weight: 700
  border:
    radius: 6
  opacity: 0.6
```

::: details More about style
- **Layers merge key by key:** a later layer changes only the keys it sets. A card `style.card.color.background.active` keeps the template's `inactive` colour, and an option's `style.border.width` keeps the card's colours.
- **One value or a state map:** a colour given as one value in one layer and as a state map in a later one is replaced by the map, so the states the map leaves out fall back to the theme.
- **Per-side borders:** a per-side `border.width` or per-corner `border.radius` object in a later layer keeps the earlier layer's single value on the sides it leaves out.
- **Opacity:** `opacity` applies to the whole option button. Without an `entity` no option is selected, so it applies to none.
- **Rules:** a rule patches the card's style through its `id` or `tags`, over every other layer: see [Rules Engine](#rules-engine).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.card.color.background` | colour / state map | from the preset | Button fill |
| `style.text.default.color` | colour / state map | from the preset | Label colour |
| `style.text.default.font_size` | number / string | from the preset | Label size, px or a CSS size |
| `style.text.default.font_weight` | number / string | from the preset | CSS font weight |
| `style.text.default.text_transform` | string | from the preset | `uppercase`, `lowercase`, `capitalize` or `none` |
| `style.text.default.letter_spacing` | string | - | CSS letter spacing, such as `0.1em` or `2px` |
| `style.border.radius` | number / string | from the preset | Corner radius, px or a CSS value |
| `style.border.radius.top_left` | number | from the preset | One corner, px; likewise `top_right`, `bottom_right` and `bottom_left` |
| `style.border.width` | number / string | from the preset | Border width, px |
| `style.border.color` | colour / state map | from the preset | Border colour |
| `style.opacity` | number | `1` | Opacity of every option but the selected one, 0 to 1 |

## Text Layer Visibility

**Each button shows the option's label and nothing else: the card hides the button's `name` and `state` text fields.** The label is the button's `text.label` field, centred.

- To show `name` or `state` as well, turn them on in `button_template.text`. By default `name` is the entity's friendly name and `state` its state (the selected option); the template's `content` sets other text, templates included.
- Any other text setting in the template (`font_size`, `position`, `color` ...) applies too. The label's text is always the option's `label`, whatever the template says.

```yaml live
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: lozenge
grid:
  columns: 2
  gap: 6px
  grid-auto-rows: 64px
button_template:
  text:
    label:
      font_size: 20
    name:
      show: true
      content: MODE
    state:
      show: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `button_template.text.label.show` | boolean | `true` | The option's label; its text is always the option's `label` |
| `button_template.text.name.show` | boolean | `false` | The button's name field |
| `button_template.text.state.show` | boolean | `false` | The button's state field |
| `button_template.text.label.font_size` | number / string | from the preset | The label's size; the label's other text settings work the same way |

## button_template

**`button_template` is a [button card](../button/) config that every option starts from.** Use it for button keys the select menu does not have itself: textures, sounds, animations, padding, more text fields.

- The card, the option and the card's own keys are applied over it, so `type`, `entity`, `preset`, `state_classification` and the label's text always come from the select menu. `id` and `tags` in the template are dropped: the menu's own go to the rules engine.
- An `icon` in the template shows on every option without its own `icon`.
- The editor's Style tab opens the button editor on this template.

```yaml live
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: outline
grid:
  columns: 2
  gap: 6px
button_template:
  shape_texture:
    preset: scanlines
    opacity: 0.25
    config:
      line_spacing: 4
      color: var(--lcars-orange)
```

::: details More about button_template
- **Actions in the template:** `tap_action`, `hold_action` and `double_tap_action` in the template are the last choice before the built-in default: see [Actions](./options#actions).
- **Style in the template:** `button_template.style` is the first layer of [style](#style), under the card's and the option's.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `button_template` | object | - | Any [button card](../button/#card-options) keys for every option |
| `button_template.style` | object | - | Style under the card's `style` |
| `button_template.text` | object | - | Text fields; `name` and `state` are hidden unless shown here |
| `button_template.icon` | string | - | Icon for every option without its own |

## Rules Engine

**The card registers with the rules engine as type `select-menu`, so a rule can target it by its `id`, its `tags` or its type.** Rules are written in any card's `rules` list: see the [Rules Engine](../../core/rules/) page.

- The card's tags for rules are `select-menu` plus its own `tags`; without an `id` it gets a generated one.
- A rule's `style` patch applies to every option button, over the card's and the options' own style. When the rule stops matching, the buttons go back to their style.
- An option can carry its own `rules` list too: see [Per-option fields](./options#per-option-fields).

```yaml live
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: lozenge
id: deck-nav
tags:
  - nav
grid:
  columns: 2
  gap: 6px
rules:
  - id: away-recolours-nav
    when:
      entity: binary_sensor.away_mode
      state: "on"
    apply:
      overlays:
        tag:nav:
          style:
            card:
              color:
                background:
                  active: var(--lcars-red)
                  inactive: var(--lcars-gray)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `id` | string | generated | The card's id for rule selectors |
| `tags` | list | - | Tags for `tag:` selectors |
| `rules` | list | - | Rules this card loads: see [Rules Engine](../../core/rules/) |

## Full Example

**A six-deck navigation menu: three columns of fixed-height lozenges with icons, wide-spaced labels and one style for the card.** The array form lists the decks in the order you want.

```yaml live
type: custom:lcards-select-menu
entity: input_select.deck_view
preset: lozenge
id: deck-nav
tags:
  - nav
grid:
  columns: 3
  gap: 6px
  grid-auto-rows: 52px
style:
  border:
    radius: 14
  text:
    default:
      font_size: 14
      letter_spacing: 0.08em
      text_transform: uppercase
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
```
