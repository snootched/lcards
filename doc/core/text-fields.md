# Text Fields

Most LCARdS cards support a flexible `text` object that lets you place any number of labelled text fields anywhere on the card. Fields inherit from a shared `default` block so you only need to set what differs per field.

---

## Structure

```yaml
text:
  default:                  # Shared defaults — not rendered as text
    font_size: 12
    font_family: "Antonio, sans-serif"
    color: "var(--lcards-moonlight)"

  label:                    # Arbitrary field name — renders as text
    content: "Temperature"
    position: top-left

  value:                    # Another field
    content: "{entity.state}°C"
    position: center
    font_size: 28
    font_weight: bold
```

Field names are arbitrary. Use any name that is meaningful to you. The special key `default` is never rendered — it only provides default styles inherited by all other fields.

---

## `text.default` Options

Shared defaults applied to all text fields. Any option listed in the per-field table below is valid here.

```yaml
text:
  default:
    font_size: 12
    font_family: "Antonio, sans-serif"
    color: "var(--lcards-moonlight)"
    position: center
```

---

## Per-Field Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `content` | string | — | Text content; supports all [template syntaxes](templates/) |
| `show` | boolean | `true` | Show or hide this field |
| `position` | string | from `default` | Grid position — see Position Values below |
| `x` | number | — | Absolute X in pixels (overrides `position`) |
| `y` | number | — | Absolute Y in pixels (overrides `position`) |
| `x_percent` | number | — | X as percentage of card width (0–100) |
| `y_percent` | number | — | Y as percentage of card height (0–100) |
| `font_size` | number / string | from `default` | Size in px, or CSS value (`14px`, `1.2rem`, `var(--lcars-text-size)`) |
| `font_size_percent` | number | — | Font size as a percentage of the **zone height** (1–100+); overrides `font_size` when set. 100 = full zone height. See [Zones](#zones). |
| `font_weight` | string / number | `"normal"` | CSS font-weight keyword (`normal`, `bold`) or numeric (100–900) |
| `font_family` | string | from `default` | CSS font-family or variable, e.g. `"Antonio, sans-serif"` or `var(--lcars-font)` |
| `text_transform` | string | `"none"` | `none`, `uppercase`, `lowercase`, `capitalize` |
| `color` | string / object | from `default` | Colour string or [state-based colour map](colours.md) |
| `anchor` | string | `"middle"` | SVG horizontal alignment: `start` (left), `middle` (centre), `end` (right) |
| `baseline` | string | `"middle"` | SVG vertical alignment: `hanging` (top), `middle`, `central`, `alphabetic` (bottom) |
| `rotation` | number | `0` | Rotation in degrees (−360 to 360) |
| `padding` | number / object | — | Offset in px: single number (all sides) or `{ top, right, bottom, left }` |
| `stretch` | boolean / number | — | Stretch/compress glyph spacing to fill a fraction of the **zone width** using SVG `textLength`. `true` = 100%, `0.8` = 80%. Pairs naturally with `font_size_percent` to fill both axes independently. |
| `zone` | string | auto | Named zone to render this field inside. Defaults to the card's primary zone (`body`, `track`, first border, etc.). See [Zones](#zones). |
| `template` | boolean | `false` | Enable legacy template evaluation for `content` |
| `display_format` | string | `"friendly"` | How to format entity state/attribute tokens — see [Display Format](#display-format) below |

### Position Values

```
top-left      top-center      top-right
center-left   center          center-right
bottom-left   bottom-center   bottom-right
```

Absolute positioning with `x`/`y` or `x_percent`/`y_percent` overrides `position`.

---

## Inheritance

Fields inherit every property from `text.default`. Only set what differs per field:

```yaml
text:
  default:
    font_size: 12
    font_family: "Antonio, sans-serif"
    color: "var(--lcards-moonlight)"

  label:
    content: "Brightness"
    position: top-left
    # inherits font_size, font_family, color from default

  value:
    content: "[[[return Math.round(entity.attributes.brightness / 255 * 100) + '%']]]"
    position: center
    font_size: 28          # overrides the default 12
    font_weight: bold
    color:
      default: "var(--lcards-moonlight)"
      active: "var(--lcards-orange)"
```

---

## Text Background

Adding a `background` color to a text field draws an opaque rectangle behind the glyphs, creating the classic LCARS bar-break effect where the label floats inside a colored bar.

`background` accepts the same state-map object as text `color` — a plain string is **not** supported; always use object form:

```yaml
# Single colour (all states)
background:
  default: black

# State-reactive colour
background:
  default: black
  active: var(--lcars-ui-red)
  inactive: transparent
```

| Property | Type | Default | Description |
|---|---|---|---|
| `background` | state-map | — | Background rect colour — must be a state-map object (`{ default: 'black' }`). Supports all states used by text `color`. |
| `background_padding` | number (px) | `8` | Horizontal space between glyphs and box edges |
| `background_radius` | number (px) | `4` | Corner radius of the background rect |
| `background_width` | number (px) | auto | **Fixed** explicit width. Overrides auto-sizing — text overflows if content is wider |
| `background_min_width` | number (px) | — | **Minimum** width. Auto-sizes from text but never shrinks below this value |

### Aligning stacked cards

When stacking several `bar-label-*` cards, each value field naturally auto-sizes to its text content, resulting in misaligned box edges. Use `background_min_width` (safe for dynamic content) or `background_width` (exact pin) to make all boxes the same width:

```yaml
text:
  value:
    content: "[[[return entity.state + ' W']]]"
    anchor: end
    background:
      default: black
    background_min_width: 120   # all stacked cards share this minimum box width
```

> **Note on `background_width` + `anchor`:** when a fixed width is set, `background_padding` no longer controls box _width_ — it still controls the anchor offset so the text sits `background_padding` px from the box's anchored edge. Extra space accumulates on the opposite side. With `anchor: end` this means the right edge stays pinned and extra space grows leftward, which is usually the desired alignment behaviour.

---
## Colour in Text Fields

The `color` field accepts both a plain colour string and a [state-based colour map](colours.md):

```yaml
text:
  status:
    content: "{entity.state}"
    color:
      default: "var(--lcards-moonlight)"
      active: "var(--lcards-orange)"
      inactive: "var(--lcards-gray)"
      unavailable: "var(--lcards-alert-red)"
      heat: "var(--lcards-alert-red)"
```

---

## Template Content

The `content` field supports all four template syntaxes:

```yaml
# Token substitution
content: "{entity.state}"
content: "{entity.attributes.brightness}"
content: "{theme:colors.text.onDark}"

# JavaScript
content: "[[[return Math.round(entity.attributes.brightness / 255 * 100) + '%']]]"

# Jinja2 (server-evaluated)
content: "{{ states('sensor.temperature') }}°C"

# DataSource — HA-native (locale-formatted + unit)
content: "{ds:temp}"
# DataSource — explicit precision (no auto-unit, you control the suffix)
# content: "{ds:temp:.1f} °C"
```

See [Templates](templates/) for full details.

---

## Comprehensive Example

```yaml
type: custom:lcards-button
entity: sensor.outdoor_temperature
preset: lozenge

text:
  default:
    font_family: "Antonio, sans-serif"
    color: "var(--lcards-moonlight)"

  label:
    content: "Outdoor"
    position: top-left
    font_size: 11
    text_transform: uppercase

  value:
    content: "[[[return parseFloat(entity.state).toFixed(1) + '°C']]]"
    position: center
    font_size: 32
    font_weight: bold
    color:
      default: "var(--lcards-moonlight)"
      unavailable: "var(--lcards-alert-red)"

  sub:
    content: "{{ state_attr('sensor.outdoor_temperature', 'friendly_name') }}"
    position: bottom-center
    font_size: 10
    color: "var(--lcards-gray)"
```

---

## Zones

Every card automatically divides its SVG surface into named **zones** — rectangular areas that text fields can be targeted to via the `zone:` key.  The 9-point positioning system, padding, and `font_size_percent` all operate within the zone bounds, not the full card.

### Auto-calculated zones per card type

| Card | Auto zones |
|------|------------|
| **Button** (preset mode, no icon) | `body` = full card area · `full` = full card area (always) |
| **Button** (preset mode, area icon) | `body` = card area excluding icon strip · `full` = full card area · `icon` = icon strip only |
| **Button** (component mode) | Named zones sourced from the SVG component's internal `zones` definition — these are declared by the component pack, not by your card config |
| **Slider** | `track` (inner track bounds) + one zone per enabled border: `left`, `right`, `top`, `bottom` |
| **Elbow** (simple, L-corner left) | `vertical_bar` · `left_bar` *(alias for `vertical_bar`)* · `horizontal_bar` · `body` · `full` |
| **Elbow** (simple, L-corner right) | `vertical_bar` · `right_bar` *(alias for `vertical_bar`)* · `horizontal_bar` · `body` · `full` |
| **Elbow** (simple, open) | `horizontal_bar` · `body` · `full` — no vertical bar zone |
| **Elbow** (simple, contained) | `left_bar` · `right_bar` · `horizontal_bar` · `body` · `full` |
| **Elbow** (segmented) | `outer_vertical_bar` · `inner_vertical_bar` · `outer_horizontal_bar` · `inner_horizontal_bar` · `body` · `full` |
| **Elbow** (frame) | `top` · `bottom` · `left` · `right` · `body` · `full` |

### Routing a field to a zone

```yaml
text:
  label:
    content: "Brightness"
    zone: horizontal_bar     # render inside the elbow's horizontal bar
    position: center
    font_size_percent: 60    # 60% of the horizontal_bar height
```

Fields without a `zone:` key fall back to the card's primary zone (`body`, `track`, or the first enabled border).

### Custom zones (config.zones)

You can define additional zones or override auto-calculated ones with `config.zones`.  Values accept pixels, percent, or a mix per axis:

```yaml
zones:
  sidebar:
    x: 0
    y: 0
    width: 80
    height_percent: 100     # full card height, fixed 80 px wide

  value_area:
    x_percent: 30
    y_percent: 0
    width_percent: 70
    height_percent: 100
```

| Key | Type | Description |
|-----|------|-------------|
| `x` | number (px) | Left edge in pixels |
| `y` | number (px) | Top edge in pixels |
| `width` | number (px) | Width in pixels |
| `height` | number (px) | Height in pixels |
| `x_percent` | number (0–100) | Left edge as % of card width |
| `y_percent` | number (0–100) | Top edge as % of card height |
| `width_percent` | number (0–100) | Width as % of card width |
| `height_percent` | number (0–100) | Height as % of card height |

Px takes precedence over percent when both are present on the same axis.  Percent values are resolved against the card's actual rendered pixel dimensions at rebuild time, so they are responsive to card size changes.

Custom zone names that match an auto-calculated zone (e.g. `body`) **replace** the auto-calculated bounds entirely.

Zones can be managed visually using the **Zones** tab in the card editor.

### Debug overlay

Set `debug_zones: true` on any card to render a coloured, dashed overlay showing every zone's bounds and name on top of the card. Useful when designing text layouts or diagnosing zone placement.

```yaml
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
debug_zones: true
zones:
  sidebar:
    x: 0
    y: 0
    width: 60
    height_percent: 100
```

The toggle is also available in the **Zones → Developer Tools** section of the card editor. Remove or set to `false` before committing your dashboard config.

### font_size_percent and cap_height_ratio

`font_size_percent: 100` makes cap-height letters fill the full zone height.  The SVG `font-size` attribute is set to `zone_height / cap_height_ratio` so the visible cap-tops span the entire zone; `font_size_percent: 50` makes them fill half the zone height, and so on.  The text is optically centred at the target position via a matching y-shift.

The default `cap_height_ratio` is `0.86` (measured for the Antonio font used in LCARS themes — at this value `font_size_percent: 100` causes caps to fill the zone exactly).  Set a custom value on any text field to calibrate for other fonts; `cap_height_ratio: 1.0` means caps equal the full em-square with no correction.

`font_size_percent` controls the **vertical** fill; add `stretch: true` to also fill the **horizontal** axis.  The two are independent — SVG scales glyph spacing via `textLength` without affecting font size:

```yaml
text:
  label:
    content: LCARDS
    zone: zone_1
    font_size_percent: 100   # caps fill zone height
    stretch: true            # glyph spacing fills zone width
```

---

## Display Format

The `display_format` option controls how entity state and attribute token values are rendered. It is valid on any individual text field or as a card-wide default in `text.default`.

| Value | Description | Example (door sensor) |
|-------|-------------|----------------------|
| `friendly` | HA-translated display string — matches native HA cards (**default**) | `"Open"` |
| `raw` | Unmodified state/attribute value from `hass.states` | `"on"` |
| `parts` | Value and unit joined from HA's ToParts API | `"23.5 °C"` |
| `unit` | Unit portion only from HA's ToParts API | `"°C"` |

### YAML Examples

**Door sensor — show friendly state:**
```yaml
text:
  status:
    content: "{entity.state}"
    display_format: friendly   # "Open" or "Closed" instead of "on"/"off"
```

**Temperature sensor — show just the unit:**
```yaml
text:
  unit_label:
    content: "{entity.state}"
    display_format: unit       # "°C"
```

**Raw value for logic in JS template (display_format not needed here):**
```yaml
text:
  raw_debug:
    content: "[[[return entity.state]]]"   # JS templates always receive raw values
```

**Card-wide default — all text fields use friendly display:**
```yaml
text:
  default:
    display_format: friendly
  label:
    content: "{entity.state}"     # inherits friendly from default
  value:
    content: "{entity.attributes.battery_level}"
    display_format: parts         # overrides default for this field: "80 %"
```

### Notes

- `display_format` only affects display strings. State classification logic (active/inactive/unavailable) always operates on raw state values.
- `[[[JavaScript]]]` templates are **unaffected** — they always receive the raw entity object. Call `hass.formatEntityState(entity)` directly if needed.
- Jinja2 templates (`{{ ... }}`) are server-evaluated and unaffected.
- When `show_unit: true` is set on a slider or text field, the unit is derived from HA's ToParts API to ensure it matches HA's own display exactly.

---
