---
description: "Elbow card frames: type frame draws a rectangular border of two to four sides, with a thickness per side, curves per corner and an optional inner ring."
---

# Frames

`elbow.type: frame` draws a border round the card instead of an L-shape, to frame a chart, a camera or a group of cards. The other elbow types are on [Bars and Curves](./bars).

## `elbow.frame`

**The sizes of a frame: how thick each side is, which sides are drawn and how each corner curves.** Set the sizes for every side at once, then change single sides or corners.

- The colour comes from `elbow.segment.color`, as for every elbow; a frame has no colour of its own.
- Switch a side off with `enabled: false` and the frame is open there; the sides next to it keep their outer corner curve, so they end in a rounded cap.
- Sizes are px, or a CSS length such as `clamp(20px, 3vw, 40px)` that follows the screen size; the frame measures it again when the window is resized.
- The open area inside the frame is where text without a `zone`, a [background animation](./appearance#background-animation-inset) and a [symbiont card](./symbiont) go.

```yaml live
type: custom:lcards-elbow
grid_options:
  rows: 4
elbow:
  type: frame
  segment:
    color: var(--lcars-orange)
  frame:
    bar_width: 40 # left and right sides
    bar_height: 16 # top and bottom
    right:
      enabled: false # open on the right
    corners:
      top_left:
        outer_curve: 40
```

::: details More about elbow.frame
- **Text zones:** a frame has a zone for each side it draws (`top`, `bottom`, `left`, `right`) plus `body` for the open area and `full` for the whole card.
- **Curve limits:** an outer curve is capped at half the card's width or height, and an inner curve at half the open area's.
- **Open sides:** where a side is off, the bars beside it end square; a corner's own `outer_curve` rounds that end instead.
- **Side thickness keys:** `bar_width`, `bar_height` and `thickness` all set one side's thickness; if you set more than one, `bar_width` wins, then `bar_height`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `bar_width` | number / string | `90` | Thickness of the left and right sides: px or a CSS length |
| `bar_height` | number / string | `bar_width` | Thickness of the top and bottom sides: px or a CSS length |
| `outer_curve` | number / string | half of `bar_width` | Outer radius of every corner: px or a CSS length |
| `inner_curve` | number / string | concentric with `outer_curve` | Inner radius of every corner: px or a CSS length. Unset, a side keeps one width round the corner (`outer_curve` less the side's thickness) whenever the curve is bigger than the side; otherwise half of `outer_curve` |
| `top` | object | - | The top side, with the side keys below |
| `bottom` | object | - | The bottom side |
| `left` | object | - | The left side |
| `right` | object | - | The right side |
| `top.enabled` | boolean | `true` | `false` leaves that side open. The same on `bottom`, `left` and `right` |
| `top.bar_width` | number / string | `bar_height` on top and bottom, `bar_width` on the left and right | Thickness of that side: px or a CSS length. `bar_height` and `thickness` do the same. The same on every side |
| `corners.top_left` | object | - | One corner; also `top_right`, `bottom_left` and `bottom_right` |
| `corners.top_left.outer_curve` | number / string | the frame's `outer_curve`; `0` beside an open side | Outer radius of that corner: px or a CSS length. Set it to round the end of a bar whose side is open |
| `corners.top_left.inner_curve` | number / string | the frame's `inner_curve` | Inner radius of that corner: px or a CSS length |
| `segments` | object | - | `style: segmented` only: an inner ring, see [Segmented frame](#segmented-frame) |

## Segmented frame

**With `style: segmented`, `frame.segments` draws a second, thinner ring inside the first, with a gap between them.** It is the frame version of the [segmented elbow](./bars#elbow-styles).

- `inner_frame` takes every key of `elbow.frame` (sides, corners, curves) for the inner ring, plus a colour of its own. Without one it takes the outer ring's colour.
- The inner ring starts inside the outer ring's sides, `gap` px in.

```yaml live
type: custom:lcards-elbow
grid_options:
  rows: 4
elbow:
  type: frame
  style: segmented
  segment:
    color: var(--lcars-orange)
  frame:
    bar_width: 30
    segments:
      gap: 6
      inner_frame:
        bar_width: 10
        color: var(--lcards-moonlight)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `segments.gap` | number / string | `4` | Space between the outer and inner ring: px or a CSS length |
| `segments.inner_frame` | object | - | The inner ring: the same keys as `elbow.frame` |
| `segments.inner_frame.bar_width` | number / string | `28` | Thickness of the inner ring's left and right sides, px; its other sizes default from it as on the outer ring |
| `segments.inner_frame.color` | colour / state map | the outer ring's colour (`elbow.segment.color`) | Colour of the inner ring |
