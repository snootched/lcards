---
description: "Placing LCARdS text fields: the nine named positions, padding from the zone edges, exact pixel or percent coordinates, alignment and rotation."
---

# Placing Text

Where a text field sits within its [zone](./text-fields-zones): a named position with padding, exact coordinates, how the text lines up on that point, and rotation. The other field keys are on the [Text Fields](./text-fields#per-field-options) page.

## position

**One of nine named places in the zone, such as `top-left` or `center`.** It is the usual way to place text, and it sets the alignment for you: `top-left` text starts at the left and hangs from the top.

- `padding` keeps the text away from the zone's edges, on the sides the position touches. `center` sits in the middle of the zone, whatever the padding.
- The short forms `top`, `bottom`, `left` and `right` mean `top-center`, `bottom-center`, `center-left` and `center-right`. The older `left-center` and `right-center` still work too.

```
┌──────────────┬──────────────┬──────────────┐
│   top-left   │  top-center  │   top-right  │
├──────────────┼──────────────┼──────────────┤
│  center-left │    center    │ center-right │
├──────────────┼──────────────┼──────────────┤
│ bottom-left  │bottom-center │ bottom-right │
└──────────────┴──────────────┴──────────────┘
```

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  default:
    font_size: 12
    color: var(--lcars-black)
  a:
    content: TOP-LEFT
    position: top-left
  b:
    content: CENTER
    position: center
  c:
    content: BOTTOM-RIGHT
    position: bottom-right
    padding:
      right: 30
      bottom: 6
grid_options:
  rows: 2
```

::: details More about position
- **No position at all:** a field without `position`, `x`/`y` or `x_percent`/`y_percent` (and none from `text.default` or the preset) is centred in its zone. Fields named `name` and `state` are the exception: they go `top-left` and `bottom-right`.
- **The button presets' default:** the base button preset sets `text.default.position: center-right`, so a new field on a preset button goes there unless you say otherwise.
- **Padding by side:** a number is the same on every side. In `text.default` and on a field, the sides merge: a field's `padding.top` leaves the default's left and right as they are.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `position` | string | from `text.default` or the preset, else `center` | `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center`, `bottom-right`, or a short form |
| `padding` | number / object | `8`, or the preset's | Space between the text and the zone's edges, px: one number for every side, or the sides below |
| `padding.top` | number | `8` | Top padding, px |
| `padding.right` | number | `8` | Right padding, px |
| `padding.bottom` | number | `8` | Bottom padding, px |
| `padding.left` | number | `8` | Left padding, px |

## x and y

**Exact coordinates in the zone, in pixels (`x`, `y`) or as a percentage of its width and height (`x_percent`, `y_percent`).** Use them when a named position is not where you need the text.

- Set both keys of a pair: `x` without `y` (or `x_percent` without `y_percent`) is ignored. Pixels win over percentages, and both win over `position`.
- Coordinates are measured from the zone's top-left corner, not the card's.
- Write `"y":` quoted in Home Assistant's code editor, which reads a bare `y` as `true`.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  marker:
    content: "30% ACROSS"
    x_percent: 30
    y_percent: 50
    anchor: middle
    baseline: middle
    font_size: 14
    color: var(--lcars-black)
grid_options:
  rows: 2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `x` | number | - | Left offset in the zone, px. Needs `y` |
| `y` | number | - | Top offset in the zone, px. Needs `x` |
| `x_percent` | number | - | Left offset as a percentage of the zone's width, `0` to `100`. Needs `y_percent` |
| `y_percent` | number | - | Top offset as a percentage of the zone's height, `0` to `100`. Needs `x_percent` |

## anchor and baseline

**How the text lines up on its point: `anchor` horizontally, `baseline` vertically.** A named position sets both; set them yourself to change it, or with `x` and `y`.

- `anchor: end` puts the end of the text on the point, so a column of numbers lines up on the right.
- With `x`/`y` or `x_percent`/`y_percent` and no `anchor` or `baseline`, the text starts at the point and sits on it like a line of writing.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  left:
    content: START
    x_percent: 50
    y_percent: 30
    anchor: start
    baseline: middle
    color: var(--lcars-black)
  right:
    content: END
    x_percent: 50
    y_percent: 70
    anchor: end
    baseline: middle
    color: var(--lcars-black)
grid_options:
  rows: 2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `anchor` | string | from `position` | `start` (text begins at the point), `middle` or `end` (text ends at the point) |
| `baseline` | string | from `position` | `hanging` (text hangs below the point), `middle`, `central` or `alphabetic` (text sits on the point) |

## rotation

**Turns the text round its point, in degrees.** Use it for a label running up a vertical bar.

- Positive values turn clockwise. A [background](./text-fields-style#text-background) box turns with its text.

```yaml live
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 60
    bar_height: 20
    color: var(--lcars-orange)
text:
  side:
    content: DECK 7
    zone: vertical_bar
    position: center
    rotation: -90
    font_size: 14
    color: var(--lcars-black)
grid_options:
  rows: 3
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `rotation` | number | `0` | Rotation in degrees, `-360` to `360`. Negative turns anticlockwise |
