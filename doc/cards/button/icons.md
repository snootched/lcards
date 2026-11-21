---
description: "Button card icons: show_icon, the icon area beside the text, icon_style (colour, size, position, rotation, padding), per-state icons and the divider."
---

# Icons

The icon on a button: which one, where its area sits, how it is coloured and placed, a different icon per state, and the divider line between the icon and the text.

## icon

**`show_icon: true` shows an icon in an area of its own beside the text.** The icon is `icon`, or the entity's own icon when you leave `icon` out.

- Most presets hide the icon, so setting `icon` alone is not enough: add `show_icon: true`. The `icon` preset and the `-right` lozenge, bullet and capped presets show it already.
- `icon_area` puts the area on the `left`, `right`, `top` or `bottom` edge, and the text fills the rest. `none` reserves no area: the icon sits over the button like a text field, placed by [`icon_style.position`](#icon-style).

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge
show_icon: true
icon: mdi:sofa
icon_area_background:
  active: var(--lcars-yellow)
  inactive: var(--lcars-gray)
text:
  name:
    show: true
tap_action:
  action: toggle
```

::: details More about icon
- **Icon names:** `mdi:` for Material Design Icons, `si:` for Simple Icons, `entity` for the entity's own icon. Other installed icon sets (such as `hue:`) work too.
- **Area size:** without `icon_area_size` the area is as wide as the icon plus a little space each side and the divider. A larger area leaves the icon centred in it, so it reads as a coloured cap.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `show_icon` | boolean | `false`, `true` on `icon` and the `-right` lozenge, bullet and capped presets | Show the icon |
| `icon` | string | the entity's icon | `mdi:...`, `si:...` or `entity` |
| `icon_area` | string | `left`, or the preset's | `left`, `right`, `top`, `bottom` or `none` |
| `icon_area_size` | number | fits the icon | Width of a left or right area (height of a top or bottom one), 20 to 500 px |
| `icon_area_background` | colour / state map | - | Fill of the icon area, clipped to the button's shape |

## icon_style

**`icon_style` sets the icon's colour, size, position and rotation.** The colour can follow the entity's state like any other colour.

- The icon shrinks to fit the button's height, keeping `spacing` clear above and below it.
- `position` places the icon inside its area (`center`, `top-left`, `bottom-right` ...). With `icon_area: none` it places the icon on the whole button, `padding` away from the edges.
- `x` and `y` (or `x_percent` and `y_percent`) place the icon's top-left corner anywhere on the button. Set both of a pair; the icon then has no area of its own.

```yaml live
type: custom:lcards-button
entity: sensor.temperature
preset: barrel
show_icon: true
icon: mdi:thermometer
icon_area: none
icon_style:
  position: top-right
  padding: 10
  size: 32
  rotation: -15
  color: var(--lcards-moonlight) # a plain colour: every state
text:
  name:
    show: true
    position: bottom-left
    color: var(--lcards-moonlight)
grid_options:
  rows: 2
```

::: details More about icon_style
- **Nudging inside the area:** `padding` as an object (`top`, `right`, `bottom`, `left`) moves the icon within its area away from that edge. `padding_left`, `padding_right`, `padding_top` and `padding_bottom` set one side on their own: each is the same as that side of the object and wins over it, and the other sides keep their values.
- **Colour fallback:** without `icon_style.color` the icon takes the preset's icon colour, then the theme's, then the button's text colour.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `icon_style.color` | colour / state map | the preset's icon colour | Icon colour |
| `icon_style.icon` | string / state map | - | Icon per state, instead of `icon`: see [Per-State Icons](#per-state-icons) |
| `icon_style.size` | number | `24` | Icon size, 8 to 200 px |
| `icon_style.position` | string | `center` | Where the icon sits in its area, or on the button with `icon_area: none` |
| `icon_style.x` | number | - | Left edge of the icon from the button's left, px. Needs `y` |
| `icon_style.y` | number | - | Top edge of the icon from the button's top, px. Needs `x` |
| `icon_style.x_percent` | number | - | Left edge as a percentage of the button's width (0 to 100). Needs `y_percent` |
| `icon_style.y_percent` | number | - | Top edge as a percentage of the button's height (0 to 100). Needs `x_percent` |
| `icon_style.rotation` | number | `0` | Rotation in degrees, -360 to 360 |
| `icon_style.padding` | number / object | `8` | A number: space from the button's edges with `icon_area: none`. An object: nudges the icon inside its area |
| `icon_style.padding.top` | number | `0` | Move the icon down from the top of its area, px |
| `icon_style.padding.right` | number | `0` | Move the icon in from the right of its area, px |
| `icon_style.padding.bottom` | number | `0` | Move the icon up from the bottom of its area, px |
| `icon_style.padding.left` | number | `0` | Move the icon in from the left of its area, px |
| `icon_style.padding_top` | number | `0` | One side of `padding`: the same as `padding.top`, and wins over it. 0 to 200 px |
| `icon_style.padding_right` | number | `0` | The same as `padding.right`, and wins over it. 0 to 200 px |
| `icon_style.padding_bottom` | number | `0` | The same as `padding.bottom`, and wins over it. 0 to 200 px |
| `icon_style.padding_left` | number | `0` | The same as `padding.left`, and wins over it. 0 to 200 px |
| `icon_style.spacing` | number | `8` | Space kept round the icon in its area, 0 to 100 px |

### Per-State Icons

**`icon_style.icon` as a state map swaps the icon by state, including value ranges.** Use it for a bulb that changes with brightness or a lock that shows open and closed.

- The icon is picked in the same order as [state colours](/core/colours/state-maps#resolution-order): the exact state, `zero`, ranges, `non_zero`, active or inactive, `default`, and last the top-level `icon`.
- [`ranges_attribute`](/core/colours/attributes#ranges-attribute) makes the range keys compare an attribute; `brightness_pct` is a light's brightness as 0 to 100.

```yaml live controls
type: custom:lcards-button
entity: light.tv
preset: lozenge
show_icon: true
ranges_attribute: brightness_pct # ranges compare brightness, 0 to 100
icon: mdi:lightbulb # used when nothing below matches
icon_style:
  icon:
    above:90: mdi:lightbulb-alert
    below:20: mdi:lightbulb-outline
    active: mdi:lightbulb
    inactive: mdi:lightbulb-off
text:
  name:
    show: true
tap_action:
  action: toggle
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `icon_style.icon` | string / state map | - | One icon, or an icon per state key (`active`, `inactive`, `unavailable`, an exact state, `above:N`, `below:N` ...). A string may be a template |

## divider

**The line between the icon area and the text.** Set `width: 0` to hide it.

- The divider is only drawn when the icon shows in a `left`, `right`, `top` or `bottom` area.

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge
show_icon: true
divider:
  color: var(--lcars-orange)
  width: 2
text:
  name:
    show: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `divider.width` | number | `5` with a preset, `6` without | Thickness in px, 0 to 200. `0` hides it |
| `divider.color` | colour | the theme's button text colour (black) | Divider colour. One colour, not a state map |
