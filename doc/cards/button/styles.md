---
description: "Button card style: background and border colours by state, corner radius, text fields, hover effects and the cursor, CSS and SVG filters."
---

# Style, Text and Hover

How a button looks and reacts: its background and border, the text on it, what happens when the pointer is over it, and filters. Colours take a plain colour or a [state map](/core/colours#state-based-colour-maps) (`default`, `active`, `inactive`, `unavailable`, `hover`, `pressed`, exact states and ranges).

## style.card

**`style.card.color.background` is the button's fill colour, one colour or one per state.** Use it to light a button when its entity is on and dim it when off.

- `hover` and `pressed` keys colour the button while the pointer is over it or it is pressed. They have no effect when [`interactive`](#interactive) is `false`.

```yaml live
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
        active: var(--lcars-orange)
        inactive: var(--lcars-gray)
        hover: var(--lcars-yellow)
tap_action:
  action: toggle
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.card.color.background` | colour / state map | from the preset (theme button colours) | The button's fill |

## style.border

**The border's colour, width and corner radius.** Rounded presets set the radius for you; set it yourself for a custom shape.

- `width` and `radius` take one number for every side or corner, or an object with one key per side (`top`, `right`, `bottom`, `left`) or corner (`top_left`, `top_right`, `bottom_right`, `bottom_left`). The sides or corners an object leaves out keep the preset's value.
- A radius larger than half the button's height (or width) is made smaller to fit, so a tall button keeps its shape.

```yaml live
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
      active: var(--lcars-orange)
      inactive: var(--lcars-gray)
    radius:
      top_left: 24
      bottom_right: 24
tap_action:
  action: toggle
```

::: details More about style.border
- **Rounded presets:** `lozenge`, `bullet` and `capped` take their round ends from the Home Assistant theme's card radius (`--ha-card-border-radius`, 34 px in HA-LCARS), not from the button's height.
- **Theme values:** `width` and `radius` also take a theme token or a CSS variable, such as `theme:components.button.radius.large` or `var(--ha-border-radius-lg)`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.border.color` | colour / state map | the button's own colour (theme button colours) | Border colour. It matches the fill by default, so on a filled preset set a different colour to see the border |
| `style.border.width` | number / string / object | from the preset: `0` on most | Border width in px, a token, or one per side |
| `style.border.width.top` | number / string | from the preset | Top border width |
| `style.border.width.right` | number / string | from the preset | Right border width |
| `style.border.width.bottom` | number / string | from the preset | Bottom border width |
| `style.border.width.left` | number / string | from the preset | Left border width |
| `style.border.radius` | number / string / object | from the preset | Corner radius in px (0 to 100), a token, or one per corner |
| `style.border.radius.top_left` | number / string | from the preset | Top-left corner radius |
| `style.border.radius.top_right` | number / string | from the preset | Top-right corner radius |
| `style.border.radius.bottom_right` | number / string | from the preset | Bottom-right corner radius |
| `style.border.radius.bottom_left` | number / string | from the preset | Bottom-left corner radius |

## Text Fields

**`text` puts any number of labels on the button, each placed and styled on its own.** The full reference is the [Text Fields](/core/text-fields) page.

- Every preset already has three fields: `name` (the entity's name), `state` (its state) and `label` (a random code). Most presets hide them until you set `show: true`; fields with any other name show by default.
- `text.default` sets the font, size and colour for every field on the card, and `style.text.default` does the same at a lower priority.

```yaml live
type: custom:lcards-button
entity: sensor.temperature
preset: barrel
text:
  default:
    font_family: "Antonio, sans-serif"
    color: var(--lcards-moonlight)
  name:
    content: TEMPERATURE
    show: true
    position: top-left
    font_size: 11
  value:
    content: "{entity.state}"
    position: center
    font_size: 28
    font_weight: bold
    color:
      default: var(--lcards-moonlight)
      unavailable: var(--lcars-alert-red)
grid_options:
  rows: 2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `text` | object | from the preset | The fields, keyed by any name you choose: see [Text Fields](/core/text-fields) |
| `text.default` | object | - | Font, size and colour for every field |
| `style.text.default.color` | colour / state map | the theme's button text colour | Text colour for every field, below `text.default` |
| `style.text.default.font_size` | number / string | from the preset | Font size for every field |
| `style.text.default.font_weight` | string / number | from the preset | Font weight for every field |
| `style.text.default.font_family` | string | from the preset | Font for every field |
| `style.text.default.letter_spacing` | number / string | `normal` | Space between letters for every field: px as a number, or a CSS value (`0.1em`) |
| `style.text.default.text_transform` | string | from the preset | Case for every field: `none`, `uppercase`, `lowercase` or `capitalize` |

## interactive

**`interactive: false` makes a button decorative: no hand cursor, no hover colour, no hover animations.** Use it for panels, headers and fillers that shouldn't look tappable.

- Taps and holds still run their actions, so a decorative button can still do something.

```yaml live
type: custom:lcards-button
entity: light.corridor
preset: lozenge
interactive: false # no hand cursor or hover colour
text:
  name:
    show: true
tap_action:
  action: toggle # still works
```

::: details More about interactive
- **What changes:** with `interactive: true` (the default) the cursor is a hand (`pointer`), the background changes to the hover colour from the preset or `style`, and hover animations run. With `false` the cursor is the arrow (`default`), the colour stays, and hover animations don't run.
- **Presets:** the panel presets set `interactive: false` for you.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `interactive` | boolean | `true` (`false` on panel presets) | `false`: no hand cursor, hover colour or hover animations. Actions still run |

## style.cursor

**`style.cursor` sets the mouse cursor over the button, whatever `interactive` says.** Use it to keep the hover effects but show a different cursor.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  label:
    content: TARGET
    show: true
style:
  cursor: crosshair
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `style.cursor` | string | `pointer`, or `default` when `interactive: false` | Any CSS cursor: `pointer`, `default`, `none`, `not-allowed`, `crosshair`, `grab`, `zoom-in`, `help`, `wait`, `progress`, `move`, `copy`, `text` ... |

## filters

**`filters` runs CSS or SVG filters over the whole button: blur, brightness, colour shifts, glows.** They apply in order, the first innermost. The [Filters](/core/effects/filters) page lists every type and its value.

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
filters:
  - type: brightness
    value: 0.8
  - type: saturate
    value: 0.5
  - type: blur
    value: 1px
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `filters[].mode` | string | `css` | `css` for CSS filter functions, `svg` for SVG filter primitives |
| `filters[].type` | string | required | A CSS filter (`blur`, `brightness`, `contrast`, `saturate`, `drop-shadow` ...) or an SVG primitive |
| `filters[].value` | string / number / object | - | The filter's value: its form depends on the type (`blur` takes a length such as `4px`) |

## Annotated Example

**A lozenge with state colours, a templated value, an icon, actions and two animations.** Each part is labelled.

```yaml live
type: custom:lcards-button
entity: light.workbench
preset: lozenge
grid_options:
  rows: 2
# text: a small name at the top left, the brightness in the middle
text:
  default:
    font_family: "Antonio, sans-serif"
  label:
    content: Workbench
    show: true
    position: top-left
    font_size: 14
    text_transform: uppercase
    color: var(--lcards-moonlight)
  value:
    content: "[[[return entity.state === 'on' ? Math.round(entity.attributes.brightness / 255 * 100) + '%' : 'Off']]]"
    position: center
    font_size: 26
    font_weight: bold
    color:
      default: var(--lcards-moonlight)
      inactive: var(--lcards-gray)
# icon: grey when off, orange when on
show_icon: true
icon: mdi:desk-lamp
icon_area: left
icon_style:
  color:
    default: var(--lcards-gray)
    active: var(--lcards-orange)
  size: 28
# border: orange when on
style:
  border:
    color:
      default: var(--lcards-gray)
      active: var(--lcards-orange)
    width: 2
# actions
tap_action:
  action: toggle
hold_action:
  action: more-info
# animations: a bounce on tap, a glow while the light is on
animations:
  - trigger: on_tap
    preset: bounce
    params:
      scale_max: 1.05
      bounces: 2
    duration: 400
  - trigger: on_entity_change
    entity: light.workbench
    to_state: "on"
    check_on_load: true
    preset: glow
    params:
      color: var(--lcards-orange)
      blur_max: 12
    loop: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `animations` | list | - | Animations on triggers such as `on_tap` and `on_entity_change`: see [Animations](/core/animations) |
| `tap_action` | object | - | What a tap does: see [Actions](/core/actions) |
| `hold_action` | object | - | What a hold does |
| `double_tap_action` | object | - | What a double tap does |
