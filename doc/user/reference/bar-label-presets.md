# Bar Label Presets Reference

Bar label presets provide horizontal bar designs with positioned text for LCARS-style section headers, status labels, and entity names. These presets replace legacy CB-LCARS label templates with a cleaner, more flexible implementation.

## Visual Pattern

```
[████████ COLORED BAR ████████]  TEXT CONTENT  [████████ COLORED BAR ████████]
                                  └─ opaque box ─┘
```

The colored borders create horizontal bars, while text sits in an opaque background box that "breaks" the bar - a classic LCARS aesthetic.

---

## Using Bar Label Presets

### Basic Syntax

```yaml
type: custom:lcards-button
preset: bar-label-center
text:
  label:
    content: "YOUR TEXT HERE"
```

### With Entity State

```yaml
type: custom:lcards-button
preset: bar-label-left
entity: light.living_room
text:
  label:
    content: "{{entity.attributes.friendly_name}}"
```

---

## Available Presets

### `bar-label-left`

Text positioned on left side of bar.

**Use Cases:** Status labels, entity names, left-aligned headers

```yaml
type: custom:lcards-button
preset: bar-label-left
entity: light.living_room
text:
  label:
    content: "LIVING ROOM"
```

**Renders:** `[████]  LIVING ROOM  [██████████████]`

---

### `bar-label-center`

Text centered in bar.

**Use Cases:** Section titles, centered headers, dividers

```yaml
type: custom:lcards-button
preset: bar-label-center
text:
  label:
    content: "STATUS REPORT"
```

**Renders:** `[████████]  STATUS REPORT  [████████]`

---

### `bar-label-right`

Text positioned on right side of bar.

**Use Cases:** Right-aligned status text, values

```yaml
type: custom:lcards-button
preset: bar-label-right
entity: sensor.temperature
text:
  label:
    content: "{{entity.state}}°C"
```

**Renders:** `[██████████████]  72°C  [████]`

---

### `bar-label-square`

Full-height bar with square corners, centered text.

**Use Cases:** Large status indicators, key values

```yaml
type: custom:lcards-button
preset: bar-label-square
height: 80
text:
  label:
    content: "READY"
    font_size: 60
```

**Renders:** Tall rectangular bar with large centered text

---

### `bar-label-lozenge`

Full-height bar with rounded ends (pill shape), centered text.

**Use Cases:** Modern LCARS aesthetic, pill-shaped labels

```yaml
type: custom:lcards-button
preset: bar-label-lozenge
text:
  label:
    content: "ONLINE"
```

**Renders:** Lozenge/pill-shaped bar with rounded ends

---

### `bar-label-bullet-left`

Half-lozenge with rounded left side, flat right side.

**Use Cases:** Left-pointing indicators, directional labels

```yaml
type: custom:lcards-button
preset: bar-label-bullet-left
text:
  label:
    content: "FORWARD"
```

**Renders:** `(████]  FORWARD  [████████]`

---

### `bar-label-bullet-right`

Half-lozenge with flat left side, rounded right side.

**Use Cases:** Right-pointing indicators, directional labels

```yaml
type: custom:lcards-button
preset: bar-label-bullet-right
text:
  label:
    content: "STARBOARD"
```

**Renders:** `[████████]  STARBOARD  [████)`

---

## Customization

### Multiple Text Fields

Add multiple text elements with different positioning:

```yaml
type: custom:lcards-button
preset: bar-label-left
entity: light.bedroom
text:
  title:
    content: "BEDROOM"
    position: left-center
    font_size: 32
  status:
    content: "{{entity.state}}"
    position: right-center
    font_size: 20
    color:
      active: "#66FF66"
      inactive: "#666666"
```

---

### Custom Colors

Override border and text colors:

```yaml
type: custom:lcards-button
preset: bar-label-center
text:
  label:
    content: "ALERT"
style:
  card:
    border:
      color:
        default: theme:colors.status.error
  text:
    default:
      color:
        default: theme:colors.status.error
```

---

### Remove Opaque Background

For transparent text over full bar:

```yaml
type: custom:lcards-button
preset: bar-label-center
text:
  label:
    content: "NO BACKGROUND"
    background: null
```

---

### Adjust Background Padding

Control spacing around text:

```yaml
type: custom:lcards-button
preset: bar-label-left
text:
  label:
    content: "COMPACT"
    background_padding: 5
```

---

## Full Examples

### Section Header

```yaml
type: custom:lcards-button
preset: bar-label-center
width: 400
height: 50
text:
  label:
    content: "ENGINEERING DECK 12"
    font_size: 28
style:
  card:
    border:
      color:
        default: theme:colors.accent.orange
```

**Renders:** Centered orange bar with "ENGINEERING DECK 12" text

---

### Entity Status with Value

```yaml
type: custom:lcards-button
preset: bar-label-left
entity: sensor.warp_core_temp
width: 350
text:
  title:
    content: "WARP CORE TEMP"
    position: left-center
    font_size: 24
  value:
    content: "{{entity.state}}°K"
    position: right-center
    font_size: 32
    color:
      default: "#FFBB66"
style:
  card:
    border:
      color:
        default: theme:colors.accent.orange
```

**Renders:** `[████]  WARP CORE TEMP    1573°K  [████]`

---

### Animated Entity Status

Glow effect on entity state changes:

```yaml
type: custom:lcards-button
preset: bar-label-left
entity: light.living_room
text:
  label:
    content: "{{entity.attributes.friendly_name}}"
animations:
  - preset: glow
    trigger: on_entity_change
    duration: 400
    color: var(--lcars-orange)
  - preset: pulse
    trigger: on_hover
    duration: 500
```

**Result:** Bar glows orange whenever the light state changes, and pulses on hover.

---

### Alert Indicator

```yaml
type: custom:lcards-button
preset: bar-label-bullet-right
entity: binary_sensor.security_breach
width: 300
height: 60
text:
  label:
    content: "{{entity.state == 'on' ? 'BREACH DETECTED' : 'SECURE'}}"
    font_size: 28
style:
  card:
    border:
      color:
        active: theme:colors.status.error
        inactive: theme:colors.status.success
  text:
    default:
      color:
        active: theme:colors.status.error
        inactive: theme:colors.status.success
```

**Renders:** Red bar with "BREACH DETECTED" when active, green with "SECURE" when inactive

---

### Lozenge Status Pill

```yaml
type: custom:lcards-button
preset: bar-label-lozenge
entity: person.captain
width: 250
height: 70
text:
  label:
    content: "{{entity.state | upper}}"
    font_size: 40
style:
  card:
    border:
      color:
        default: theme:colors.accent.blue
```

**Renders:** Pill-shaped blue bar with "HOME" or "AWAY" in large text

---

## Migration from CB-LCARS

### `cb-lcars-label-picard` → `bar-label-left`

**Before:**
```yaml
type: custom:button-card
template: cb-lcars-label-picard
label: "LCARS LABEL"
```

**After:**
```yaml
type: custom:lcards-button
preset: bar-label-left
text:
  label:
    content: "LCARS LABEL"
```

---

### `cb-lcars-label-picard-square` → `bar-label-square`

**Before:**
```yaml
type: custom:button-card
template: cb-lcars-label-picard-square
label: "STATUS"
```

**After:**
```yaml
type: custom:lcards-button
preset: bar-label-square
text:
  label:
    content: "STATUS"
```

---

## Technical Details

### Text Background Rendering

Bar label presets use the `text.{field}.background` property to render an opaque SVG `<rect>` behind text:

```yaml
text:
  label:
    content: "TEXT"
    background: black       # Opaque background color
    background_padding: 10  # Space around text
    background_radius: 4    # Corner rounding
```

Background dimensions are automatically calculated based on text content length and font size.

---

### Border Configuration

Bars are created using SimpleButton's border system:

```yaml
style:
  card:
    border:
      left: { width: 60, color: '#FF9966' }  # Left bar
      right: { width: 40, color: '#FF9966' }  # Right bar
```

Text positioning accounts for border widths automatically via the `_calculateTextAreaBounds()` method.

---

## Preset Summary

| Preset | Description | Text Position | Use Case |
|--------|-------------|---------------|----------|
| `bar-label-left` | Left-aligned text | left-center | Status labels, entity names |
| `bar-label-center` | Centered text | center | Section titles, headers |
| `bar-label-right` | Right-aligned text | right-center | Values, right-aligned status |
| `bar-label-square` | Square corners, centered | center | Large indicators |
| `bar-label-lozenge` | Rounded ends, centered | center | Pill-shaped labels |
| `bar-label-bullet-left` | Half-lozenge, left round | left-center | Left-pointing labels |
| `bar-label-bullet-right` | Half-lozenge, right round | right-center | Right-pointing labels |

---

## See Also

- [SimpleButton Quick Reference](../configuration/button-quick-reference.md) - Complete button card documentation
- [Component Presets Reference](./component-presets.md) - Interactive SVG component presets
- [Animation Presets Reference](./animation-presets.md) - Animation presets and triggers
