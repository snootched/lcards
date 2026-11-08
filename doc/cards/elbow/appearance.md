---
description: "Elbow card colour, text and effects: fill colours and state maps, text on the bars and in the open area, shape textures and background animations fitted inside the bars."
---

# Colour, Text and Effects

How an elbow looks once its shape is set: the fill colour, text on its bars, a texture in the fill and an animated background in the open area. Shapes and sizes are on [Bars and Curves](./bars) and [Frames](./frame).

## Colours

**`color` paints the elbow: one colour, or a state map that changes with the card's `entity`.** Set it on `elbow.segment` for a simple elbow or a frame, and on each segment of a segmented elbow.

- On a segmented elbow a segment with its own [`entity_id`](./bars#elbow-segments) matches its state map against that entity instead.

- Without a colour the elbow takes the theme's header colour, or its footer colour on the footer types.
- A single colour is used in every state and doesn't change on hover. A state map keeps the theme's colours for the states it leaves out, including `hover` and `pressed`.
- Colours take everything described on the [Colours](/core/colours) page: CSS variables, theme tokens, `alpha()` and other colour functions, and state keys such as `active`, `inactive` and `unavailable`.

```yaml live
type: custom:lcards-elbow
entity: light.kitchen
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    color:
      active: var(--lcars-orange)
      inactive: alpha(var(--lcars-orange), 0.3)
      hover: var(--lcars-yellow)
tap_action:
  action: toggle
```

::: details More about colours
- **Theme tokens:** the defaults are `components.elbow.header.background` and `components.elbow.footer.background`. A theme can give one elbow type its own colours under `components.elbow.<type>.background`, such as `components.elbow.diagonal-cap-left.background`.
- **Frames:** the outer ring uses `elbow.segment.color` and the inner ring of a segmented frame its own [`inner_frame.color`](./frame#segmented-frame).
- **Old key:** `elbow.colors.background` still works but is deprecated; use `elbow.segment.color`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `elbow.segment.color` | colour / state map | the theme's header or footer colour | Fill of a simple elbow, or the outer ring of a frame |
| `elbow.segments.outer_segment.color` | colour / state map | the theme's header or footer colour | Fill of the outer elbow of a segmented elbow; a state map follows the segment's `entity_id`, else the card's `entity` |
| `elbow.segments.inner_segment.color` | colour / state map | the theme's header or footer colour | Fill of the inner elbow; a state map follows the segment's `entity_id`, else the card's `entity` |
| `interactive` | boolean | `true` | `false` turns off the hover and pressed colours |

## Text labels

**Elbows take the [button's text fields](/core/text-fields), placed in named zones: on a bar, or in the open area inside the bars.** A label on the top bar is the classic use.

- A field without a `zone` goes in `body`, the open area. Set `zone: horizontal_bar` (or `vertical_bar`) to put it on a bar.
- `position` places the text within its zone; `top-right` in `body` sits just under the bar.

```yaml live
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 120
    bar_height: 22
    color: var(--lcars-orange)
text:
  section:
    content: NAVIGATION
    zone: horizontal_bar
    position: right
    font_size: 14
    font_weight: bold
    color: var(--lcars-black)
  code:
    content: "04-1173"
    zone: vertical_bar
    position: bottom-right
    color: var(--lcars-black)
  status:
    content: ALL SYSTEMS NOMINAL
    position: top-right
    color: var(--lcards-moonlight)
```

::: details More about text zones
- **Simple corners:** `vertical_bar` (also called `left_bar` or `right_bar`), `horizontal_bar`, `body` and `full`.
- **Open types:** `horizontal_bar`, `body` and `full`.
- **Contained types:** `left_bar`, `right_bar`, `horizontal_bar`, `body` and `full`.
- **Segmented:** `outer_vertical_bar`, `inner_vertical_bar`, `outer_horizontal_bar`, `inner_horizontal_bar`, `body` and `full`.
- **Bar types:** `body` and `full` are both the whole bar.
- **Frames:** `top`, `bottom`, `left`, `right` (for the sides it draws), `body` and `full`.
- **Unknown zones:** a field whose `zone` the elbow doesn't have goes in `body`. The [Zones](/core/text-fields-zones#zones-per-card) section has pictures of each layout.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `text.<name>` | object | - | One text field: `content`, `position`, `font_size`, `color` and the other [text field keys](/core/text-fields#per-field-options) |
| `text.<name>.zone` | string | `body` | The zone the field is placed in |

## Shape texture

**`shape_texture` draws a texture or animation inside the elbow's fill, clipped to its shape**, such as a grid, a plasma wash or a scrolling pattern. It works as on the button card.

- On a segmented elbow the texture fills both elbows, and on a frame its ring (both rings on a segmented frame).
- The presets and their settings are listed on the button page: [Shape texture](../button/textures#shape-texture).

```yaml live
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 24
    color: var(--lcars-blue)
shape_texture:
  preset: fluid
  opacity: 0.5
  mix_blend_mode: screen
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `shape_texture.preset` | string | - | `grid`, `diagonal`, `hexagonal`, `dots`, `fluid`, `shimmer`, `plasma`, `flow`, `level`, `pulse`, `scanlines` or `image` |
| `shape_texture.opacity` | number / state map | - | Texture opacity, 0 to 1 |
| `shape_texture.speed` | number / state map | - | Animation speed multiplier; `0` keeps it still |
| `shape_texture.mix_blend_mode` | string | - | How the texture blends with the fill: `normal`, `multiply`, `screen`, `overlay`, `hard-light`, `soft-light`, `color-burn` or `color-dodge` |
| `shape_texture.config` | object | - | The preset's own settings |

## Background animation inset

**`background_animation.inset` fits an animated background into the open area, so it doesn't run under the bars.** `inset: auto` works the space out from the elbow's bars.

- `auto` follows each type's arms: the top or bottom bar, and the side bar on its side. The contained types have a side bar on both sides, the open types none, and on the bar types the whole card is the bar, so nothing is inset.
- `auto` keeps up when the bars change, including bars bound to the [HA-LCARS helpers](./bars#ha-lcars-theme-binding).
- Give px values per side instead when you want the background somewhere else.
- The effects themselves are described on [Background animations](/core/effects/background-animations).

```yaml live
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    color: var(--lcars-orange)
background_animation:
  inset: auto # inside the bars
  effects:
    - preset: grid
      config:
        line_spacing: 40
        color: alpha(var(--lcars-orange), 0.3)
```

::: details More about the inset
- **Manual inset:** `inset` with `top`, `left`, `right` and `bottom` in px; a side you leave out is `0`. For the example above that is `top: 20` and `left: 90`.
- **Segmented and frames:** `auto` counts both elbows and the gap, or every side a frame draws (both rings on a segmented frame).
- **List form:** `background_animation` can also be just the list of effects, with no inset.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `background_animation.inset` | string / object | none | `auto`: the open area inside the bars. An object: px per side |
| `background_animation.inset.top` | number | `0` | Space at the top, px; `right`, `bottom` and `left` work the same |
| `background_animation.effects` | list | - | The effects, drawn bottom to top: see [Background animations](/core/effects/background-animations) |
