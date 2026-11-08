---
description: "Slider card ring gauge, shaped fills and Picard gauge: angles, thickness, scale, value markers, centre text, shapes and colours."
---

# Ring, Shaped and Picard

**Three looks that draw their own shape instead of a [pill bar or ruler](./styles).** Use them when a plain bar is not the look you want: a round dial, a filled lozenge or a framed Picard-era gauge.

- Pick one with a preset, or set `component` yourself to combine it with another preset.
- They draw to the card's cell. In a sections view each asks for a cell that fits it: a ring 4 rows, Picard 7 rows by 6 columns, an upright slider 4 rows by 3 columns. `grid_options` changes it.

| `component` | Presets | Looks like |
|---|---|---|
| `ring` | `ring`, `picard-ring` | A thick arc round a large value: [Ring gauge](#ring-gauge) |
| `shaped` | `shaped-vertical`, `shaped-horizontal` | A solid fill inside a shape: [Shaped component](#shaped-component) |
| `picard` | `picard-gauge-vertical` | A framed upright gauge with scanning lights: [Picard component](#picard-component) |

---

## Ring gauge

**A round dial: drag round the ring, or tap a point on it, to set the value.** Use it for a light, a thermostat or any number you want to read at a glance.

- Angles are in degrees, with `0` at the top, counted clockwise. The default runs from `-135` to `135`, which leaves the gap at the bottom.
- Set `-90` to `90` for a half ring, or the same angle twice for a full ring.
- The ring is read-only for sensors, or when `control.locked: true` is set.

```yaml live
type: custom:lcards-slider
entity: light.bedroom
preset: ring
style:
  ring:
    thickness: 16%
    fill:
      color: var(--lcards-blue)
```

::: details More about the ring
- **Keyboard:** the arrow keys change the value by one `control.step` while the ring has focus (Page Up and Page Down by ten, Home and End to the ends). A press on the centre text does nothing.
- **Size:** the ring stays round and is as large as its arc allows. A full ring fills the card's smaller side; a half ring fills a card twice as wide as it is tall. The centre text stays inside the arc (above the cut on a half ring).
- **Wrapping:** an end angle at or before the start wraps round.
- **Ranges:** [range](./ranges) bands draw as arcs over the track, under the value arc, at full opacity unless the range sets `opacity`.
- **Other track keys:** `style.track.invert_fill` grows the value from the end angle back to the start. The [drag badge](./control#drag-value-badge) sits in the centre. Borders and track margins don't apply.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `style.ring.start_angle` | number | `-135` | Where the minimum sits, degrees (0 = top, clockwise) |
| `style.ring.end_angle` | number | `135` | Where the maximum sits; equal to `start_angle` draws a full ring |
| `style.ring.thickness` | number / string | `12%` | Band thickness: a percentage of the diameter (`12%`) or px (`14`, `14px`) |
| `style.ring.cap` | string | `round` | Arc ends: `round` or `flat` |
| `style.ring.fill.color` | colour / state map | theme | Value arc colour; a [state map](/core/colours) works |
| `style.ring.track.color` | colour / state map | theme | Unfilled ring colour; a state map works |
| `style.ring.padding` | number | auto | Room outside the ring for the scale, markers and their labels, px. Worked out from them when unset |
| `style.ring.focus_ring` | boolean | `false` | Outline the ring while it has keyboard focus; the keys work either way |
| `style.ring.scale` | object | - | Ticks and labels outside the ring: see [Scale](#scale) |

### The picard-ring preset

**The Picard-era ring: a near-full thick ring with flat ends, a small label over a large number.** Use it for zone and level readouts in the Protostar style.

- It is still `component: ring`, so every ring key, [Scale](#scale) and [value marker](#value-markers) works on it.

```yaml live
type: custom:lcards-slider
entity: input_number.target_level
preset: picard-ring
text:
  name:
    content: Zone N
style:
  ring:
    scale:
      tick_marks:
        major:
          interval: 20
        minor:
          interval: 5
      labels:
        show_unit: false
  # a red band at the top of the range
  ranges:
    - min: 80
      max: 100
      color: theme:colors.status.error
```

Ring variants (drag any of them):

<CardGallery set="slider-ring" />

::: details More about picard-ring
- **What it sets:** `start_angle: -165`, `end_angle: 165`, `thickness: 20%` and `cap: flat`, with a half-transparent track. The name is upper case, in the fill colour, over a large state.
- **The `ring` preset** sets `-135` to `135`, `thickness: 12%` and round caps, with the name small above a large state.
:::

### Scale

**Ticks and value labels round the outside of the ring, so you can read a value off the dial.** They work like the gauge's [`scale`](./styles#style-gauge) and take the same keys.

- A plain ring has no scale. Each part shows once its block is set: the major ticks, the minor ticks or the labels.
- The labels sit at the major tick interval. Minor ticks are left out where a major tick falls, and the end of a full ring gets no tick, since it is the same point as the start.
- The ring shrinks to make room for the scale. Set `style.ring.padding` to choose that room yourself, for example to line up several rings.

```yaml live
type: custom:lcards-slider
entity: light.bedroom
preset: ring
style:
  ring:
    start_angle: -120
    end_angle: 120
    scale:
      tick_marks:
        major:
          interval: 25
          height: 10
          color: var(--lcards-orange)
        minor:
          interval: 5
      labels:
        show_unit: false
        font_size: 13
```

| Key | Type | Default | Description |
|---|---|---|---|
| `style.ring.scale.tick_marks.major.interval` | number | `10` | Value units between major ticks, counted from the minimum |
| `style.ring.scale.tick_marks.major.height` | number | `8` | Tick length, px, outward from the ring |
| `style.ring.scale.tick_marks.major.width` | number | `2` | Tick line width, px |
| `style.ring.scale.tick_marks.major.color` | colour / state map | theme | Major tick colour |
| `style.ring.scale.tick_marks.major.enabled` | boolean | `true` | `false` hides the major ticks while keeping the block |
| `style.ring.scale.tick_marks.minor.interval` | number | `2` | Value units between minor ticks |
| `style.ring.scale.tick_marks.minor.height` | number | `4` | Tick length, px |
| `style.ring.scale.tick_marks.minor.width` | number | `1` | Tick line width, px |
| `style.ring.scale.tick_marks.minor.color` | colour / state map | theme | Minor tick colour |
| `style.ring.scale.tick_marks.minor.enabled` | boolean | `true` | `false` hides the minor ticks while keeping the block |
| `style.ring.scale.labels.show_unit` | boolean | `true` | Add the unit to each label |
| `style.ring.scale.labels.unit` | string | entity unit | Unit to add; wins over the entity's unit |
| `style.ring.scale.labels.color` | colour / state map | theme | Label colour |
| `style.ring.scale.labels.font_size` | number | `12` | Label size, px |
| `style.ring.scale.labels.padding` | number | `3` | Gap between the ticks and the labels, px |
| `style.ring.scale.labels.enabled` | boolean | `true` | `false` hides the labels while keeping the block |

### Value markers

**A [range](./ranges) with a `value` instead of `min` and `max` draws a marker at that value on the ring.** Use it to show a second number on the dial, such as the current temperature against the target.

- A marker takes its colour from the range's `color`, or `indicator.color` when set.
- A marker and its label move with [value tweens](./control#value-tween).
- The label sits outside the ring, past the marker and past the scale, so it never lands on a scale label.

```yaml live
type: custom:lcards-slider
entity: climate.living_room
preset: ring
control:
  min: 10
  max: 30
  step: 0.5
text:
  state:
    content: "{entity.attributes.temperature}°"
style:
  ring:
    scale:
      tick_marks:
        major:
          interval: 5
      labels:
        show_unit: false
  ranges:
    # the room's current temperature, the dial shows the target
    - value: "{entity.attributes.current_temperature}"
      indicator:
        type: triangle
        color: theme:colors.status.success
      label:
        text: NOW
```

::: details More about value markers
- **Placement:** `indicator.align` anchors a marker at the inner edge of the band (`start`), its middle (`center`) or its outer edge (`end`). A triangle at `start` sits inside the ring and points out; elsewhere it points in.
- **Size:** `size.width` runs round the ring and `size.height` along the radius. A `round` dot uses `width` for both.
- **Ignored here:** `indicator.rotation` and `indicator.offset.x` don't apply on a ring; the marker always turns with the ring.
- **All range keys:** the [ranges page](./ranges#value-marker-fields) lists every marker key; the rows below are how the ring reads them.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `style.ranges[].value` | number / string | required | The value to mark: a number or a template such as `{entity.attributes.current_temperature}` |
| `indicator.type` | string | `line` | `line`: a line across the band. `triangle`: outside the ring, pointing in. `round`: a dot on the band |
| `indicator.align` | string | by type | `start`, `center` or `end`. A line starts at `start`, a triangle at `end`, a dot at `center` |
| `indicator.color` | colour / state map | the range's `color` | Marker colour. Without either, `style.gauge.marker_indicator.color`, then the theme |
| `indicator.size.width` | number | by type | Size round the ring, px. Line: about a fifth of the band (at least 2). Triangle: `12`. Dot: half the band (at least 6) |
| `indicator.size.height` | number | by type | Size along the radius, px. Line: the band plus 6. Triangle: `10`. Not used by a dot |
| `indicator.offset.y` | number | `0` | Move the marker outward, px; negative moves it inward |
| `indicator.border.enabled` | boolean | `false` | Outline a triangle or dot |
| `indicator.border.color` | colour / state map | theme | Outline colour |
| `indicator.border.width` | number | `1` | Outline width, px |
| `label.text` | string | - | Caption outside the ring; templates work |
| `label.color` | colour / state map | theme | Caption colour |
| `label.font_size` | number | `12` | Caption size, px |
| `label.offset.x` | number | `0` | Move the caption sideways, px |
| `label.offset.y` | number | `0` | Move the caption down, px; negative moves it up |

### Centre text

**Four text zones inside the ring hold the name, the value and anything else you add.** Use them to move a field, for example to put the name under a half ring.

- The zones are `label` (above the value), `value` (the middle), `sublabel` (below) and `center` (the whole inner area).
- The presets put `name` in `label` and `state` in `value`. Size text with `font_size_percent` (see [zones](/core/text-fields-style#filling-a-zone)), so it grows and shrinks with the ring.

```yaml live
type: custom:lcards-slider
entity: light.bedroom
preset: ring
style:
  ring:
    start_angle: -90
    end_angle: 90
    thickness: 20%
    cap: flat          # round caps would poke below the half ring
text:
  # the name under the half ring
  name:
    zone: sublabel
    position: top
```

| Key | Type | Default | Description |
|---|---|---|---|
| `text.<field>.zone` | string | preset | `label`, `value`, `sublabel` or `center`. The ring presets use `label` for `name` and `value` for `state` |
| `text.<field>.position` | string | preset | Where the text sits inside its zone, such as `top`, `center` or `bottom` |
| `text.<field>.font_size_percent` | number | preset | Text height as a percentage of the zone's height (1–100). The `ring` preset uses 60 for the name and 85 for the state |

## Shaped component

**A solid fill inside a shape: a lozenge, hexagon, diamond or your own outline.** Use it for a level, a volume or a brightness that should read as a filled container.

- Pick it with the `shaped-vertical` or `shaped-horizontal` preset. They set the orientation, the text bands and where the name and state go; with `component: shaped` alone, also set `style.track.orientation`.
- The text sits in bands outside the shape: top and bottom when upright, left and right when flat. Send a text field to one with `zone: top`, `bottom`, `left` or `right`.
- [Range](./ranges) bands draw inside the shape, under the fill, at full opacity unless the range sets `opacity`. Value markers are not drawn.

```yaml live
type: custom:lcards-slider
entity: light.bedroom
preset: shaped-horizontal
style:
  shaped:
    type: hexagon
    fill:
      color: var(--lcards-blue)
    track:
      background: var(--lcards-gray-darkest)
    text_bands:
      left:
        size: 110
      right:
        size: 70
```

::: details More about shaped
- **Your own shape:** `type: polygon` takes its corners in `polygon.points`, each `[x, y]` a fraction (0–1) of the shape's width and height, for example `[[0, 0], [1, 0.5], [0, 1]]` for a triangle. `type: path` takes an SVG path in `path.d`.
- **Empty bands:** a band set to `0` is not a text zone, so a field sent there has nowhere to go.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `style.shaped.type` | string | `lozenge` | `lozenge`, `rect`, `rounded`, `diamond`, `hexagon`, `polygon` or `path` |
| `style.shaped.radius` | number | auto | Corner radius, px, for `lozenge` (half the shorter side) and `rounded` (`8`) |
| `style.shaped.fill.color` | colour / state map | theme | The filled part; a [state map](/core/colours) works. Falls back to `style.gauge.fill.color.active` |
| `style.shaped.track.background` | colour / state map | theme | The empty part; a state map works. Falls back to `style.track.background` |
| `style.shaped.text_bands.top.size` | number | `36` | Top text band height, px (upright) |
| `style.shaped.text_bands.bottom.size` | number | `36` | Bottom text band height, px (upright) |
| `style.shaped.text_bands.left.size` | number | `60` | Left text band width, px (flat) |
| `style.shaped.text_bands.right.size` | number | `60` | Right text band width, px (flat) |
| `style.shaped.polygon.points` | list | - | For `polygon`: the corners as `[x, y]` pairs, fractions (0–1) of the shape |
| `style.shaped.path.d` | string | - | For `path`: an SVG path `d` in absolute coordinates |
| `style.shaped.path.translate` | boolean | `false` | Measure the path from the shape's top-left corner instead of the card's |

## Picard component

**The Picard-era upright gauge: a framed range column, a solid value bar and three scanning lights.** Use it for a tall readout with a ruler, such as a temperature or a power level.

- Pick it with the `picard-gauge-vertical` preset, which sets `component: picard` and an upright track. The ruler on the right is the gauge's [`scale`](./styles#style-gauge).
- The frame and the value bar take the top border's colour unless you set their own.
- With [ranges](./ranges), the frame becomes a notched outline and the ranges fill the column inside it. Without ranges, the frame is a solid bar.

```yaml live
type: custom:lcards-slider
entity: sensor.temperature
preset: picard-gauge-vertical
style:
  range:
    frame:
      color:
        active: var(--lcards-blue-light)
        inactive: var(--lcards-gray-dark)
  solid_bar:
    color:
      active: var(--lcards-green)
      inactive: var(--lcards-gray)
  animation:
    indicator:
      color: lighten(var(--lcards-orange), 0.2)
  # bands in the framed range column
  ranges:
    - min: 0
      max: 60
      color: var(--lcards-blue)
      opacity: 0.7
    - min: 60
      max: 100
      color: var(--lcards-orange)
      opacity: 0.7
```

::: details More about Picard
- **Scanning lights:** the three lights at the top left pulse one after another, every `animation_speed` seconds. They stand still when the device asks for reduced motion, and `show_animation: false` removes them.
- **Range opacity:** like any gauge band, a range in the column is drawn at `0.3` opacity unless it sets `opacity`.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `style.range.frame.color` | colour / state map | `style.border.top.color` | The frame round the range column |
| `style.range.border.color` | colour / state map | theme | The lines between the ranges in the column |
| `style.range.border.gap` | number | `2` | Width of those lines, px |
| `style.solid_bar.color` | colour / state map | `style.border.top.color` | The solid value bar |
| `style.animation.indicator.color` | colour / state map | theme | The scanning lights |
| `show_animation` | boolean | `true` | Show the scanning lights |
| `animation_speed` | number | `2` | Seconds for one pulse of the lights, `0.1` to `10` |
