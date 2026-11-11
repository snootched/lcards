---
description: "Elbow card bars and curves: simple and segmented styles, bar sizes, corner curve keywords, paired elbows, diagonal cuts and HA-LCARS theme sizes."
---

# Bars and Curves

How an elbow is sized: how thick its bars are, how its corners curve, and whether it is one elbow or two. Frames have their own page, [Frames](./frame); colours are on [Colour, Text and Effects](./appearance#colours).

## Elbow styles

**`elbow.style` draws one elbow (`simple`) or two concentric elbows with a gap between them (`segmented`), the double elbow of TNG and Picard screens.**

- A simple elbow is sized by [`elbow.segment`](#elbow-segment), a segmented one by [`elbow.segments`](#elbow-segments); the style reads only its own block.
- Segmented works on the four corners, the diagonal caps and frames. Other types, and an unknown style, draw simple.

<CardGallery set="elbow-styles" />

```yaml live
type: custom:lcards-elbow
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 4
    outer_segment:
      bar_width: 90
      bar_height: 20
      color: var(--lcars-orange)
    inner_segment:
      bar_width: 30
      bar_height: 10
      color: var(--lcards-moonlight)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `elbow.style` | string | `simple` | `simple` or `segmented` |

## `elbow.segment`

**The bars, curves and colour of a simple elbow.** `bar_width` is the vertical bar down the side, `bar_height` the horizontal bar across the top or bottom.

- Leave `bar_height` out and the top bar is as thick as the side bar.
- Sizes are px, or a CSS length such as `clamp(60px, 8vw, 120px)` that follows the screen size; the elbow measures it again when the window is resized.
- The corner curves default to the classic LCARS proportions: the outer radius is half the side bar and the inner radius half the outer. Give a thin bar a curve bigger than itself and the inner curve follows it instead, so the bend keeps the bar's width all the way round. [Arc radius modes](#arc-radius-modes) has the other choices.

```yaml live
type: custom:lcards-elbow
elbow:
  type: footer-right
  segment:
    bar_width: 120
    bar_height: 30
    outer_curve: 60
    inner_curve: 30
    color: var(--lcars-african-violet)
```

::: details More about elbow.segment
- **px strings:** a string with a unit the elbow doesn't measure as CSS (`"90px"`) is read as its number.
- **Bar types:** on `bar-slant-*` and `bar-parallelogram` the card is the bar, so the bar sizes and curves don't change the shape; only `diagonal_angle` and `color` do.
- **Frames:** a frame takes its sizes from [`elbow.frame`](./frame), and only `color` from here.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `bar_width` | number / string | `90` | Thickness of the vertical bar: px (10 to 500), a CSS length, or `theme` ([HA-LCARS](#ha-lcars-theme-binding)) |
| `bar_height` | number / string | `bar_width` | Thickness of the horizontal bar: px (10 to 500), a CSS length, or `theme` |
| `outer_curve` | number / string | `auto` | Radius of the outer corner: px (0 to 500), a CSS length or a [keyword](#arc-radius-modes) |
| `inner_curve` | number / string | `outer_curve` less the bar when the curve is bigger than the bar, else half of it | Radius of the inner corner: px, a CSS length or a [keyword](#arc-radius-modes). Unset, a bend whose curve is bigger than the bar keeps one width all the way round |
| `outer_curve_clamp` | string / number | `card` | Upper limit for the outer radius: see [Paired elbows](#paired-elbows) |
| `diagonal_angle` | number / string | `45` | Cut angle in degrees (0 to 90) for the diagonal caps and slanted bars, or `theme`: see [Diagonal cuts](#diagonal-cuts) |
| `color` | colour / state map | the theme's header or footer colour | Fill colour: see [Colours](./appearance#colours) |

## Arc radius modes

**`outer_curve` and `inner_curve` take a radius in px or a keyword that works it out from the bar sizes.** Keywords keep the curve in proportion when you change the bars.

- The curve always meets both bars smoothly; the radius only moves where along each bar it starts.
- `inner_curve` takes the same keywords, worked out from the bars on their own rather than from `outer_curve`; only `auto` is half of the outer radius. So `outer_curve: arm_max` with `inner_curve: arm_height` gives a large outer sweep with a tight inner corner.
- The outer radius is capped at the card's smaller side unless you change [`outer_curve_clamp`](#paired-elbows).

Each mode with a 90 px wide vertical bar and a 24 px horizontal bar:

<CardGallery set="elbow-arc-modes" />

```yaml live
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 24
    outer_curve: arm_fill
    inner_curve: arm_height
    color: var(--lcars-orange)
```

| Value | Radius | Use |
|-------|--------|-----|
| `auto` or `arm_width` | `bar_width / 2` | The classic LCARS corner, sweeping through the vertical bar. For `inner_curve`, `auto` is `outer_curve / 2` |
| `arm_height` | `bar_height / 2` | Based on the horizontal bar; small with a thin top bar |
| `arm_max` | `max(bar_width, bar_height) / 2` | The same as `auto` for the usual wide side bar and thin top bar, and still right when the bars are the other way round. Best for paired elbows |
| `arm_min` | `min(bar_width, bar_height) / 2` | Based on the thinner bar, for compact corners |
| `arm_fill` | `max(bar_width, bar_height)` | The biggest sweep, filling the whole thicker bar |
| a number | that many px | Set the radius yourself |

### Paired elbows

**Two elbows that should match (a header and a footer, or a left and a right) need the same outer radius in cards of different heights.** By default the outer radius is capped at the card's smaller side, so a short card gets a smaller curve than a tall one with the same settings.

- `outer_curve_clamp: none` removes the cap, so the radius depends only on the bars. A number caps it at that many px instead.
- Use `arm_max` for the curve, so both elbows work it out the same way.

```yaml live
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 130
    bar_height: 15
    outer_curve: arm_max # 65 px
    outer_curve_clamp: none
    color: var(--lcars-orange)
```

```yaml live
type: custom:lcards-elbow
elbow:
  type: footer-left
  segment:
    bar_width: 130
    bar_height: 15
    outer_curve: arm_max
    outer_curve_clamp: none
    color: var(--lcars-orange)
```

::: details More about outer_curve_clamp
- **Without the cap:** a radius bigger than the card is drawn as it is, and the card cuts off what falls outside it.
- **History:** this is the fix for issue #361, two elbows with the same settings in cards of different heights.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `outer_curve_clamp` | string / number | `card` | `card`: cap the outer radius at the card's smaller side. `none`: no cap. A number: cap at that many px |

## Diagonal cuts

**`diagonal_angle` sets the straight cuts on the diagonal-cap types and the slanted ends of the bar types.**

- On a diagonal cap each corner is cut instead of curved. The cut is as long as `outer_curve` on the outer corner and `inner_curve` on the inner one; `45` cuts evenly, a smaller angle runs the cut further along the bar, a larger one further down the side.
- On `bar-slant-right`, `bar-slant-left` and `bar-parallelogram` the whole card is the bar. `90` is a square end and `45` a cut as long as the bar is thick; angles below 10 count as 10, and a cut never takes more than half the card's width.

```yaml live
type: custom:lcards-elbow
elbow:
  type: diagonal-cap-left
  segment:
    bar_width: 90
    bar_height: 24
    outer_curve: 40
    diagonal_angle: 45
    color: var(--lcars-orange)
```

```yaml live
type: custom:lcards-elbow
grid_options:
  rows: 1
elbow:
  type: bar-slant-right
  segment:
    diagonal_angle: 60
    color: var(--lcars-blue)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `elbow.segment.diagonal_angle` | number / string | `45` | The cut angle in degrees, 0 to 90, or `theme` to follow `input_number.lcars_elbow_angle` ([HA-LCARS](#ha-lcars-theme-binding)) |

## `elbow.segments`

**The two elbows of the segmented style: the outer one, the inner one and the gap between them.** Set `elbow.style: segmented` to use it.

- Both segments are required, each with its own `bar_width`.
- The inner elbow sits inside the outer one, `gap` px in from its bars. Leave the inner `outer_curve` out and it follows the outer elbow's inner curve less the gap, so the two curves stay concentric. Leave its `inner_curve` out too and the inner bar keeps one even width round the corner, like a line drawn inside the outer sweep.
- Each segment can follow an entity of its own: with `entity_id` its colour state map matches that entity, and a tap on it acts on that entity. Its own `tap_action`, `hold_action` and `double_tap_action` replace the card's for that segment; the ones it leaves out are the card's.

```yaml live
type: custom:lcards-elbow
elbow:
  type: footer-right
  style: segmented
  segments:
    gap: 6
    outer_segment:
      bar_width: 100
      bar_height: 24
      outer_curve: arm_max
      color: var(--lcars-orange)
    inner_segment:
      bar_width: 40
      bar_height: 12
      color: var(--lcars-african-violet)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `gap` | number | `4` | Space between the outer and inner elbow, px (0 to 50) |
| `outer_segment` | object | required | The outer elbow: the [segment keys](#segment-keys) |
| `inner_segment` | object | required | The inner elbow: the [segment keys](#segment-keys) |

### Segment keys

**Each segment takes the simple style's keys, plus an entity of its own.** The defaults differ in three places: `bar_width` is required, the inner elbow's outer curve follows the outer elbow, and with both its curves left out the inner elbow keeps an even width round the corner.

- A `bar_height` near 0 (such as `0.01`) leaves that segment's horizontal bar out; `0` itself counts as not set.
- The inner segment's `diagonal_angle` defaults to the outer one's.

```yaml live
type: custom:lcards-elbow
elbow:
  type: header-right
  style: segmented
  segments:
    outer_segment:
      bar_width: 90
      bar_height: 20
      color: var(--lcars-orange)
    inner_segment:
      bar_width: 30
      bar_height: 10
      outer_curve: arm_width # its own curve instead of the concentric one
      color: var(--lcards-moonlight)
```

A segment that follows its own entity: the inner elbow shows and toggles the switch, the outer one the light.

```yaml live
type: custom:lcards-elbow
entity: light.kitchen
tap_action:
  action: toggle
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 4
    outer_segment:
      bar_width: 90
      bar_height: 20
      color:
        active: var(--lcars-orange)
        inactive: alpha(var(--lcars-orange), 0.3)
    inner_segment:
      bar_width: 30
      bar_height: 10
      entity_id: switch.coffee_maker # its colour and taps follow this
      color:
        active: var(--lcars-blue)
        inactive: alpha(var(--lcars-blue), 0.3)
      hold_action:
        action: more-info
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `bar_width` | number / string | required | Thickness of the vertical bar: px (1 to 500), a CSS length, or `theme` ([HA-LCARS](#ha-lcars-theme-binding)) |
| `bar_height` | number / string | `bar_width` | Thickness of the horizontal bar: px (up to 500), a CSS length, or `theme` |
| `outer_curve` | number / string | outer: `auto`; inner: the outer elbow's inner curve less `gap` | Outer corner radius: px, a CSS length or a [keyword](#arc-radius-modes) |
| `inner_curve` | number / string | `outer_curve` less the bar when the curve is bigger than the bar, else half of it | Inner corner radius: px, a CSS length or a [keyword](#arc-radius-modes) |
| `outer_curve_clamp` | string / number | `card` | Upper limit for the outer radius, as in [Paired elbows](#paired-elbows) |
| `diagonal_angle` | number / string | outer: `45`; inner: the outer one's | Cut angle on the diagonal caps, or `theme` |
| `color` | colour / state map | the theme's header or footer colour | Fill colour of this segment: see [Colours](./appearance#colours). A state map follows `entity_id`, else the card's `entity` |
| `entity_id` | string | the card's `entity` | The entity this segment follows: its colour state map matches this entity's state, and its taps act on it |
| `tap_action` | object | the card's `tap_action` | What a tap on this segment does, on its `entity_id`: see [Actions](/core/actions) |
| `hold_action` | object | the card's `hold_action` | What a hold on this segment does |
| `double_tap_action` | object | the card's `double_tap_action` | What a double tap on this segment does |

## HA-LCARS theme binding

**With the [HA-LCARS theme](https://github.com/th3jesta/ha-lcars), `theme` ties bar sizes and the cut angle to the theme's helpers, so every elbow on the dashboard changes together.** Change the helper and every elbow set to `theme` redraws.

- `bar_width: theme` reads `input_number.lcars_vertical`, `bar_height: theme` reads `input_number.lcars_horizontal` and `diagonal_angle: theme` reads `input_number.lcars_elbow_angle`. The helper's entity id works as the value too.
- On the segmented style set them on either segment, or both.

This example needs the HA-LCARS helpers, which the docs site doesn't have, so it is not live:

```yaml
type: custom:lcards-elbow
elbow:
  type: footer-right
  segment:
    bar_width: theme # input_number.lcars_vertical
    bar_height: theme # input_number.lcars_horizontal
```

::: details More about theme binding
- **Missing helpers:** a bar set to `theme` is 90 px and an angle 45 degrees until the helper exists.
- **Background inset:** an [`inset: auto`](./appearance#background-animation-inset) background follows the new bar sizes too.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `elbow.segment.bar_width` | string | `90` | `theme` (or `input_number.lcars_vertical`) follows that helper |
| `elbow.segment.bar_height` | string | `bar_width` | `theme` (or `input_number.lcars_horizontal`) follows that helper |
| `elbow.segment.diagonal_angle` | string | `45` | `theme` (or `input_number.lcars_elbow_angle`) follows that helper |
| `elbow.segments.outer_segment.bar_width` | string | required | `theme` follows `input_number.lcars_vertical`; `bar_height` and `diagonal_angle` as on `elbow.segment`. The same on `inner_segment` |
