---
description: "Styling LCARdS text fields: font keys, sizing text to fill its zone (font_size_percent, cap_height_ratio, stretch), colour by entity state, and the background box behind a bar label."
---

# Fonts, Colour and Backgrounds

How a text field looks: its font, sizing it to fill its zone, its colour, and the box behind a bar label. Every key here also works in `text.default`, so a whole card can share one style. The other field keys are on the [Text Fields](./text-fields#per-field-options) page.

## Fonts

**The font, size, weight, case and letter spacing of a field.** Set them in `text.default` for the whole card, and on a field where it differs.

- The button presets set the theme's LCARS font in upper case, so lower case needs `text_transform: none`.
- `font_size` in pixels stays the same however big the card is. To scale text with the card, use [`font_size_percent`](#filling-a-zone).

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  default:
    color: var(--lcars-black)
  title:
    content: Shuttle bay
    position: top-left
    font_size: 18
    font_weight: bold
    text_transform: uppercase
    letter_spacing: 3
  sub:
    content: Doors sealed
    position: bottom-left
    font_size: 12
    font_family: "Antonio, sans-serif"
    text_transform: none
grid_options:
  rows: 2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `font_size` | number / string | the preset's, else `14` | Size in px (`1` to `200`), or a CSS size such as `14px` or `1.2rem` |
| `font_family` | string | the theme's font (`LCARS`, `Antonio`) | A CSS font family or stack, such as `"Antonio, sans-serif"` or `var(--lcars-font)` |
| `font_weight` | string / number | `normal` | `normal`, `bold`, or `100` to `900`. The bar-label presets use `100` |
| `text_transform` | string | `none`; `uppercase` in the button presets | `none`, `uppercase`, `lowercase` or `capitalize` |
| `letter_spacing` | number / string | `normal` | Space between letters: px as a number (`2`), or a CSS value (`0.1em`, `2px`) |

## Filling a zone

**`font_size_percent` sizes text to its zone's height, and `stretch` spreads it across the zone's width.** Text sized this way grows and shrinks with the card, which is how the bar-label presets fill their bar.

- `font_size_percent: 100` makes the capital letters fill the zone's height; `50` fills half of it. Use it instead of `font_size`, not with it.
- `stretch` spaces and widens the letters to fill a share of the zone's width: `true` is all of it, `0.8` is 80 %. Height and width are independent, so the two keys work together.
- `cap_height_ratio` tells LCARdS how tall a font's capitals are, as a share of its size. The theme's `0.86` is right for Antonio; set it for another font so `100` still fills the zone exactly.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  title:
    content: WARP CORE
    position: center
    font_size_percent: 60 # capitals 60 % of the height
    stretch: 0.8 # letters spread over 80 % of the width
    color: var(--lcars-black)
grid_options:
  rows: 2
```

::: details More about filling a zone
- **Centred positions:** the capitals fill exactly the percentage on the `center`, `center-left` and `center-right` positions, measured inside the top and bottom padding. On the top and bottom positions the font size is that percentage of the zone's height.
- **Without a ratio:** with no `cap_height_ratio` from the field, the preset or the theme, the font size itself is the percentage of the zone, so capitals come out a little smaller. The elbow uses `0.87` then.
- **Stretch and position:** on a button with a component, stretched text starts at the left padding and fills the zone's width inside the padding. Elsewhere it spreads from its point to the share of the zone's whole width, so it fits best with `position: center`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `font_size_percent` | number | - | Font size as a percentage of the zone's height, `1` to `100` |
| `cap_height_ratio` | number | `0.86`, from the theme | Height of the font's capitals as a share of its size, `0.1` to `1.0`. `1.0` means no correction |
| `stretch` | boolean / number | - | Fill a share of the zone's width: `true` for all of it, or a fraction from `0` to `1` |

## color

**The text colour: one colour, or a map that picks one by the entity's state.** A map makes a value turn red when the entity is unavailable, or bright when a light is on.

- The map's keys are the [state colour keys](/core/colours): `default`, `active`, `inactive`, `unavailable` and the others.
- A colour set on the field or in `text.default` wins over the preset's text colour.

```yaml live
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
text:
  status:
    content: "{entity.state}"
    show: true
    position: center
    font_size: 22
    color:
      default: var(--lcards-moonlight)
      active: var(--lcars-orange)
      inactive: var(--lcars-gray)
      unavailable: var(--lcars-alert-red)
grid_options:
  rows: 2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | colour / state map | the theme's text colour for the state | A colour, or a [state map](/core/colours) of colours |

## Text background

**A box behind the text, the classic LCARS bar break: the label sits in a gap in a coloured bar.** The bar-label presets use it with a black box.

- The box is as tall as the zone and as wide as the text plus `background_padding` on each side.
- `background` takes a colour or a state map, as `color` does.

```yaml live
type: custom:lcards-button
entity: light.kitchen
preset: bar-label-left
text:
  label:
    show: true
    content: Kitchen lights
    background:
      default: var(--lcars-black)
      active: var(--lcars-blue)
    background_padding: 20
```

::: details More about the text background
- **Presets:** the bar-label presets set a black box, `background_padding: 15` and `background_radius: 0`.
- **Fixed width and anchor:** with `background_width` set, `background_padding` no longer sets the box's width, but it still sets how far the text sits from the box's anchored edge. Extra space goes to the other side, so with `anchor: end` the right edge stays put and the box grows to the left.
- **Components:** text on a button with a `component` has no background box.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `background` | colour / state map | - | Box colour, by state if you like |
| `background_padding` | number | `8` | Space between the text and the box's left and right edges, px |
| `background_radius` | number | `4` | Corner radius, px. `0` is square |
| `background_width` | number | as wide as the text | A fixed width, px. Longer text runs past the box |
| `background_min_width` | number | - | The narrowest the box gets, px. It still grows with longer text |

### Aligning stacked cards

**`background_min_width` gives the boxes on a stack of bar-label cards the same width, so their edges line up.** Each box would otherwise be as wide as its own text.

- `background_min_width` is safe for values that change length; `background_width` pins an exact width.

```yaml live
type: custom:lcards-button
entity: sensor.power
preset: bar-label-right
text:
  label:
    show: true
    content: "[[[return entity.state + ' W']]]"
    background_min_width: 120 # every card in the stack uses the same value
```
