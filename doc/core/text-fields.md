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
| `font_size_percent` | number | — | Font size as a percentage of the text area height (1–100); overrides `font_size` in component mode |
| `font_weight` | string / number | `"normal"` | CSS font-weight keyword (`normal`, `bold`) or numeric (100–900) |
| `font_family` | string | from `default` | CSS font-family or variable, e.g. `"Antonio, sans-serif"` or `var(--lcars-font)` |
| `text_transform` | string | `"none"` | `none`, `uppercase`, `lowercase`, `capitalize` |
| `color` | string / object | from `default` | Colour string or [state-based colour map](colours.md) |
| `anchor` | string | `"middle"` | SVG horizontal alignment: `start` (left), `middle` (centre), `end` (right) |
| `baseline` | string | `"middle"` | SVG vertical alignment: `hanging` (top), `middle`, `central`, `alphabetic` (bottom) |
| `rotation` | number | `0` | Rotation in degrees (−360 to 360) |
| `padding` | number / object | — | Offset in px: single number (all sides) or `{ top, right, bottom, left }` |
| `stretch` | boolean / number | — | Stretch text to fill available width; `true` = 100%, `0.8` = 80% |
| `text_area` | string | — | Named text area key (component mode only) |
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

# DataSource
content: "{ds:temp:.1f}°C"
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
