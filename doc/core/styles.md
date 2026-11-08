---
description: "The style: block on LCARdS buttons and select menu options: background and border colours by state, border width and corner radius, plus where the icon and card size are set."
moved_anchors:
  structure: /core/styles
  style-card-color-background: /core/styles#style-card
  border-radius: /core/styles#style-border
  border-colour-with-state-variants: /core/styles#style-border
  style-icon: /core/styles#icon-style
---

# Card Styles

**The `style:` block sets how a button looks: its background, its border and its corners.** Start from a [preset](presets.md) for the shape, then set only what you want to change.

- These keys are the button's. The [select menu](/cards/select-menu/styles) takes the same keys for its option buttons; the slider, elbow and other cards have their own style keys on their pages.
- Every colour takes one colour or a [state map](colours.md) with one colour per state (`default`, `active`, `inactive`, `unavailable`, `hover`, `pressed`, exact states and ranges).
- [Rules](rules/) can change any style value while the dashboard runs.

```yaml live controls
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
style:
  card:
    color:
      background:
        default: var(--lcards-orange)
        inactive: var(--lcards-gray-dark)
  border:
    color: var(--lcards-blue)
    width: 2
    radius: 8
tap_action:
  action: toggle
```

## style.card

**`style.card.color.background` is the card's fill colour, one colour or one per state.** Use it to light a button when its entity is on and dim it when off.

- A single colour (`background: var(--lcards-orange)`) is used in every state.
- In a state map, `active` is used while the entity is on, `inactive` while it is off and `unavailable` when Home Assistant cannot reach it; `default` is the fallback when no other key matches.
- `hover` and `pressed` colour the button while the pointer is over it or it is pressed. They have no effect when [`interactive`](/cards/button/styles#interactive) is `false`.

```yaml live controls
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
style:
  card:
    color:
      background:
        default: var(--lcards-orange)
        active: var(--lcards-orange)
        inactive: var(--lcards-gray-dark)
        unavailable: var(--lcards-gray-darkest)
        hover: var(--lcards-orange-light)
        pressed: var(--lcards-orange-dark)
tap_action:
  action: toggle
```

::: details More about style.card
- **Colour formats:** CSS variables, `theme:` token paths, colour functions, hex and the other formats on the [Colours](colours.md) page all work, on their own or as values in a state map.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.card.color.background` | colour / state map | from the preset (theme button colours) | The card's fill |

## style.border

**The border's colour, width and corner radius.** Rounded presets set the radius for you; set it yourself for a custom shape.

- `width` and `radius` take one number for every side or corner, or an object with one key per side (`top`, `right`, `bottom`, `left`) or corner (`top_left`, `top_right`, `bottom_right`, `bottom_left`). The sides or corners an object leaves out keep the preset's value.
- The border colour takes a state map like the background, so a border can light up when the entity is on.
- A radius larger than half the button's height (or width) is made smaller to fit, so a tall button keeps its shape.

```yaml live controls
type: custom:lcards-button
entity: light.living_room
preset: outline
text:
  name:
    show: true
style:
  border:
    width: 3
    color:
      default: var(--lcards-gray)
      active: var(--lcards-orange)
      inactive: var(--lcards-gray-dark)
    radius:
      top_left: 12
      top_right: 12
      bottom_right: 4
      bottom_left: 4
tap_action:
  action: toggle
```

::: details More about style.border
- **Without a preset:** a button with no `preset` draws a `2` px border with `20` px corners unless you set them.
- **Theme values:** `width` and `radius` also take a CSS variable, such as `var(--ha-border-radius-lg)`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.border.color` | colour / state map | the button's own colour (theme button colours) | Border colour. It matches the fill by default, so on a filled preset set a different colour to see the border |
| `style.border.width` | number / string / object | from the preset: `0` on most | Border width in px, a token, or one per side |
| `style.border.width.top` | number / string | from the preset | Top border width |
| `style.border.width.right` | number / string | from the preset | Right border width |
| `style.border.width.bottom` | number / string | from the preset | Bottom border width |
| `style.border.width.left` | number / string | from the preset | Left border width |
| `style.border.radius` | number / string / object | from the preset | Corner radius in px (0 to 100), a CSS variable, or one per corner |
| `style.border.radius.top_left` | number / string | from the preset | Top-left corner radius |
| `style.border.radius.top_right` | number / string | from the preset | Top-right corner radius |
| `style.border.radius.bottom_right` | number / string | from the preset | Bottom-right corner radius |
| `style.border.radius.bottom_left` | number / string | from the preset | Bottom-left corner radius |

## icon_style

**The icon's colour and size are set in `icon_style`, at the top level of the card, not inside `style:`.** The icon shows when `show_icon` is `true`, and its colour can follow the entity's state like the background.

```yaml live controls
type: custom:lcards-button
entity: light.living_room
preset: lozenge
show_icon: true
icon: mdi:lightbulb
text:
  name:
    show: true
icon_style:
  size: 28
  color:
    active: var(--lcards-yellow)
    inactive: var(--lcards-gray)
tap_action:
  action: toggle
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `icon_style.color` | colour / state map | the preset's icon colour | Icon colour |
| `icon_style.size` | number | `24` | Icon size, 8 to 200 px |
| [All icon keys](/cards/button/icons#icon-style) | | | Position, rotation, padding and spacing, on the button's Icons page |

## Dimensions

**The card's size is set at the top level of the card, not inside `style:`.** By default a card is as big as its cell; set a size for a fixed card or for one outside a sections grid.

- A number is pixels (`200` is `200px`); a string takes any CSS length, such as `50%` or `10vh`.
- `min_height` is a floor for a card that sizes itself. When `height` is set too, the card is exactly `height` tall and `min_height` is ignored.

```yaml live controls
type: custom:lcards-button
entity: light.living_room
preset: lozenge
width: 200
height: 48
text:
  name:
    show: true
tap_action:
  action: toggle
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `width` | number / string | the cell's width | Card width: a number is px, or any CSS length |
| `height` | number / string | the cell's height | Card height: a number is px, or any CSS length |
| `min_height` | number / string | the button's preset: the theme's button height | Smallest height (a number is px). Ignored when `height` is set |
| [More sizing keys](/cards/common#sizing) | | | `min_width`, `max_height`, `max_width` and how sizes work in a sections grid |

## Interaction with Presets and Rules

**A card's look is built in layers, and each layer wins over the one before it.** You only set the values that differ from the preset; anything you leave out comes from the layer below.

- The layers, lowest first: LCARdS and theme defaults, the [preset](presets.md), your `style:` block, then [rule](rules/) patches while the dashboard runs.
- To see which layer set each value, open the card editor's [Main Engineering](../cards/main-engineering.md#provenance) tab and its **Provenance** panel.

```yaml live controls
# The preset gives the shape and colours, the style block makes it blue,
# and a rule turns it red while the kitchen light is on (tap to toggle)
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
id: layered-btn
text:
  name:
    content: LAYERS
    show: true
style:
  card:
    color:
      background: var(--lcards-blue)
rules:
  - id: layered-red
    when:
      entity: light.kitchen
      state: "on"
    apply:
      overlays:
        layered-btn:
          style:
            card:
              color:
                background: var(--lcars-red)
tap_action:
  action: toggle
```

## Related

- [Presets](presets.md): named style collections for quick setup
- [Colours](colours.md): accepted colour formats, theme tokens, state maps
- [Rules Engine](rules/): how style patches are applied at runtime
- [Main Engineering](../cards/main-engineering.md): inspect runtime effective config per card
- [Button styles](/cards/button/styles): text fields, hover, the cursor and filters on a button
