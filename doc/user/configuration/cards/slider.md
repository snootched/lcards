# LCARdS Slider Card

**Interactive slider and gauge display card for controlling and monitoring entity values.**

The slider card provides both interactive controls (for lights, covers, fans, etc.) and read-only gauge displays (for sensors) with two distinct visual styles: segmented pills or gauge rulers with tick marks.

---

## Quick Start

### Basic Light Slider
```yaml
type: custom:lcards-slider
entity: light.bedroom
component: horizontal
```

### Sensor Gauge Display
```yaml
type: custom:lcards-slider
entity: sensor.temperature
component: horizontal
style:
  track:
    type: gauge  # Visual style: gauge ruler with ticks
```

### Bordered Slider with Text
```yaml
type: custom:lcards-slider
entity: light.bedroom
component: horizontal
style:
  border:
    left:
      size: 120
      color: var(--lcars-orange)
    top:
      size: 10
      color: var(--lcars-orange)
  text:
    fields:
      label:
        content: "{entity.attributes.friendly_name}"
        area: left
        position: top-left
      state:
        content: "{entity.state}"
        area: left
        position: center
```

---

## Core Concepts

### Visual Styles vs Interactivity

The slider card separates **visual style** from **interactivity**:

| Property | Controls | Values |
|----------|----------|--------|
| `style.track.type` | **Visual appearance** | `pills` (segmented bar) or `gauge` (ruler with ticks) |
| `control.locked` | **Interactivity** | `true` (read-only) or `false` (controllable) |

**Examples:**
- **Interactive Pills:** Light slider with segmented bars (default for lights)
- **Interactive Gauge:** Light slider with gauge ruler visual (set `style.track.type: gauge`)
- **Read-only Gauge:** Sensor display with gauge ruler (auto-locked for sensors)

### Automatic Behavior

The card automatically configures itself based on entity domain:

| Domain | Default Visual | Default Locked | Default Attribute |
|--------|---------------|----------------|-------------------|
| `light` | `pills` | `false` | `brightness` |
| `cover` | `pills` | `false` | `current_position` |
| `fan` | `pills` | `false` | `percentage` |
| `input_number` | `pills` | `false` | (uses state) |
| `number` | `pills` | `false` | (uses state) |
| `sensor` | `gauge` | `true` | (uses state) |

All defaults can be overridden via configuration.

---

## Configuration Reference

### Base Properties

```yaml
type: custom:lcards-slider
entity: string                  # Required. Entity ID to control/display
component: string              # Required. Component name (horizontal, vertical, picard)
```

### Components

Available slider components:

| Component | Orientation | Description | Use Case |
|-----------|-------------|-------------|----------|
| `horizontal` | Horizontal | Simple horizontal track | General purpose sliders |
| `vertical` | Vertical | Simple vertical track | Tall vertical controls |
| `picard` | Vertical | Decorative segmented elbows (TNG style) | Complex LCARS aesthetic |

**Note:** Component determines **orientation only**. Visual style (pills vs gauge) is controlled by `style.track.type`.

---

### Control Configuration

Configure how the slider interacts with entities:

```yaml
control:
  min: number              # Minimum value (default: 0 or entity's min attribute)
  max: number              # Maximum value (default: 100 or entity's max attribute)
  step: number             # Step increment (default: 1 or entity's step attribute)
  attribute: string        # Entity attribute to control (auto-detected by domain)
  locked: boolean          # Disable interaction (default: auto-set by domain)
```

#### Examples

**Custom Range for Light:**
```yaml
control:
  min: 10      # Minimum brightness 10%
  max: 50      # Maximum brightness 50%
  step: 2      # Increment by 2%
```

**Control Cover Position:**
```yaml
entity: cover.blinds
control:
  attribute: current_position
  min: 0
  max: 100
```

**Read-only Display:**
```yaml
control:
  locked: true  # Prevent user interaction
```

---

### Track Visual Style

Choose between pills (segmented bar) or gauge (ruler) visual style:

```yaml
style:
  track:
    type: string           # 'pills' or 'gauge'
    orientation: string    # 'horizontal' or 'vertical' (auto-detected from component)
    margin: number | object  # Margin around track (px)
```

#### Margin Configuration

Single value (all sides):
```yaml
style:
  track:
    margin: 10  # 10px on all sides
```

Per-side values:
```yaml
style:
  track:
    margin:
      top: 10
      right: 5
      bottom: 10
      left: 5
```

---

### Pills Style (Segmented Bar)

Configure appearance of segmented pills:

```yaml
style:
  track:
    type: pills
    segments:
      count: number        # Number of pills (undefined = auto-calculate)
      gap: number          # Gap between pills in px (default: 4)
      shape:
        radius: number     # Border radius in px (default: 4)
      size:
        height: number     # Pill height in px (default: 12)
        width: number      # Pill width in px (auto-calculated)
      gradient:
        interpolated: boolean  # Always true for pills (each pill gets unique color)
        start: string      # Start color (CSS color or variable)
        end: string        # End color (CSS color or variable)
      appearance:
        unfilled:
          opacity: number  # Opacity for unfilled pills (default: 0.2)
        filled:
          opacity: number  # Opacity for filled pills (default: 1.0)
```

#### Pill Count Behavior

**Auto-sizing (recommended):**
```yaml
style:
  track:
    segments:
      count: undefined  # Omit to auto-calculate based on container size
      size:
        width: 12       # Fixed pill width
        height: 12
      gap: 4
```
- Card calculates: `count = floor((trackWidth + gap) / (width + gap))`
- Pills scale automatically when grid size changes
- Maintains consistent pill dimensions

**Fixed count:**
```yaml
style:
  track:
    segments:
      count: 20  # Always 20 pills
      gap: 4
```
- Pill width auto-calculated to fill available space
- Pill dimensions change when grid size changes

#### Gradient Interpolation

Pills **always** use interpolated colors. Each pill receives a unique solid color calculated from the gradient range:

```yaml
style:
  track:
    segments:
      count: 12
      gradient:
        start: '#FF0000'  # Red
        end: '#00FF00'    # Green
```

Result:
- Pill 1: Pure red (#FF0000)
- Pill 2: Red-orange
- Pill 6: Yellow
- Pill 11: Yellow-green
- Pill 12: Pure green (#00FF00)

Each pill is a **solid color** (not a gradient within the pill). Gaps between pills show the color steps.

#### Examples

**High-density Pills:**
```yaml
style:
  track:
    type: pills
    segments:
      count: 40
      gap: 2
      shape:
        radius: 2
      size:
        height: 8
```

**Custom Gradient:**
```yaml
style:
  track:
    type: pills
    segments:
      gradient:
        start: 'var(--lcars-blue)'
        end: 'var(--lcars-orange)'
      appearance:
        unfilled:
          opacity: 0.1   # Nearly invisible when unfilled
```

---

### Gauge Style (Ruler with Ticks)

Configure gauge ruler appearance:

```yaml
style:
  track:
    type: gauge
  gauge:
    progress_bar:
      color: string      # Progress fill color (default: var(--picard-lightest-blue))
      height: number     # Bar height in px (default: 12)
      radius: number     # Border radius in px (default: 2)
    scale:
      tick_marks:
        major:
          enabled: boolean     # Show major ticks (default: true)
          interval: number     # Value interval for major ticks (default: 10)
          color: string        # Tick color (default: var(--lcars-card-button))
          height: number       # Tick height in px (default: 15)
          width: number        # Tick width in px (default: 2)
        minor:
          enabled: boolean     # Show minor ticks (default: true)
          interval: number     # Value interval for minor ticks (default: 2)
          color: string        # Tick color (default: var(--lcars-card-button))
          height: number       # Tick height in px (default: 10)
          width: number        # Tick width in px (default: 1)
      labels:
        enabled: boolean       # Show value labels (default: true)
        unit: string          # Unit suffix (default: '' or entity's unit_of_measurement)
        color: string         # Label color (default: var(--lcars-card-button))
        font_size: number     # Font size in px (default: 14)
        padding: number       # Space between tick and label in px (default: 3)
    indicator:
      enabled: boolean        # Show indicator line/thumb (default: false)
      type: string           # 'line' or 'thumb' (default: line)
      color: string          # Indicator color (default: var(--lcars-white))
      size:
        width: number        # Indicator width in px (default: 4)
        height: number       # Indicator height in px (default: 25)
      border:
        color: string        # Border color (default: var(--lcars-black))
        width: number        # Border width in px (default: 1)
```

#### Tick Mark Intervals

Intervals are in **value units** (not pixels):

```yaml
control:
  min: 0
  max: 100
style:
  gauge:
    scale:
      tick_marks:
        major:
          interval: 20  # Ticks at 0, 20, 40, 60, 80, 100
        minor:
          interval: 5   # Ticks at 0, 5, 10, 15, 20, 25...
```

For temperature sensor with custom range:
```yaml
control:
  min: -20
  max: 120
style:
  gauge:
    scale:
      tick_marks:
        major:
          interval: 20  # Ticks at -20, 0, 20, 40, 60, 80, 100, 120
```

#### Examples

**Minimal Gauge (No Ticks):**
```yaml
style:
  track:
    type: gauge
  gauge:
    scale:
      tick_marks:
        major:
          enabled: false
        minor:
          enabled: false
      labels:
        enabled: false
```

**Temperature Gauge:**
```yaml
entity: sensor.outdoor_temperature
style:
  track:
    type: gauge
  gauge:
    scale:
      tick_marks:
        major:
          interval: 10
          color: var(--lcars-orange)
        minor:
          interval: 2
      labels:
        unit: '°C'  # Will show as "20°C", "30°C", etc.
```

**Gauge with Line Indicator:**
```yaml
style:
  gauge:
    indicator:
      enabled: true
      type: line
      color: var(--lcars-white)
      size:
        width: 4
        height: 30
```

---

### CSS Borders

Add simple CSS borders around the slider (uses standard CSS border properties):

```yaml
style:
  border:
    left:
      size: number       # Border width/size in px
      color: string      # Border color (CSS color or variable)
    top:
      size: number
      color: string
    right:
      size: number
      color: string
    bottom:
      size: number
      color: string
```

**Note:** Use `size` (recommended) or `width` (legacy) for border dimensions.

#### Border + Track Layout

Borders are applied as CSS borders on the container. Track content injects into the remaining space:

```
┌─────────────────────────────────┐
│ Top Border (10px)               │
├────┬────────────────────────────┤
│ L  │ Track Zone                 │
│ e  │ (pills/gauge inject here)  │
│ f  │                            │
│ t  │                            │
│    │                            │
│ B  │                            │
│ o  │                            │
│ r  │                            │
│ d  │                            │
│ e  │                            │
│ r  │                            │
└────┴────────────────────────────┘
```

#### Examples

**L-shaped Border (LCARS Style):**
```yaml
style:
  border:
    left:
      size: 120
      color: var(--lcars-orange)
    top:
      size: 10
      color: var(--lcars-orange)
```

**All Sides Bordered:**
```yaml
style:
  border:
    left:
      size: 40
      color: var(--lcars-blue)
    top:
      size: 12
      color: var(--lcars-blue)
    right:
      size: 40
      color: var(--lcars-blue)
    bottom:
      size: 12
      color: var(--lcars-blue)
```

---

### Text Fields

The slider card inherits the text field system from LCARdSButton, providing consistent text rendering across all card types.

```yaml
style:
  text:
    fields:
      field_name:           # Custom field name
        content: string     # Text content (supports templates)
        area: string        # Text area: 'left', 'top', 'right', 'bottom', 'track'
        position: string    # Position within area (see below)
        color: string       # Text color (default: var(--lcars-white))
        font_size: number   # Font size in px (default: 14)
```

#### Text Areas

Text fields can be positioned in different areas based on your component and borders:

| Area | Description | Available When |
|------|-------------|----------------|
| `left` | Left border area | `border.left` is configured |
| `top` | Top border area | `border.top` is configured |
| `right` | Right border area | `border.right` is configured |
| `bottom` | Bottom border area | `border.bottom` is configured |
| `track` | Track zone (over pills/gauge) | Always available |

#### Position Values

Standard position keywords:
- `top-left`, `top-center`, `top-right`
- `center-left`, `center`, `center-right`
- `bottom-left`, `bottom-center`, `bottom-right`

#### Template Support

Text fields support entity templates:

| Template | Description | Example |
|----------|-------------|---------|
| `{entity.state}` | Entity state | `"on"`, `"25.3"` |
| `{entity.attributes.X}` | Entity attribute | `{entity.attributes.friendly_name}` → `"Bedroom Light"` |
| `{entity.attributes.brightness}` | Specific attribute | `"128"` (raw brightness value) |

**Null Handling:** If a template resolves to `null` or `undefined`, it displays as an empty string (blank).

#### Examples

**Border Label Text:**
```yaml
style:
  border:
    left:
      size: 120
      color: var(--lcars-orange)
  text:
    fields:
      title:
        content: "{entity.attributes.friendly_name}"
        area: left
        position: top-left
        font_size: 16
      status:
        content: "{entity.state}"
        area: left
        position: center
        color: var(--lcars-blue)
      brightness:
        content: "{entity.attributes.brightness}"
        area: left
        position: bottom-right
        font_size: 12
```

**Track Overlay Text:**
```yaml
style:
  text:
    fields:
      value:
        content: "{entity.state}%"
        area: track
        position: center
        font_size: 18
        color: var(--lcars-white)
```

---

## Complete Examples

### 1. Classic LCARS Light Control

```yaml
type: custom:lcards-slider
entity: light.bedroom
component: horizontal
grid_options:
  rows: 2
  columns: 3
style:
  border:
    left:
      size: 120
      color: var(--lcars-orange)
    top:
      size: 10
      color: var(--lcars-orange)
  track:
    type: pills
    segments:
      count: 20
      gap: 3
      gradient:
        start: var(--lcars-red)
        end: var(--lcars-green)
  text:
    fields:
      label:
        content: "{entity.attributes.friendly_name}"
        area: left
        position: top-left
        font_size: 16
      state:
        content: "{entity.state}"
        area: left
        position: center
        color: var(--lcars-blue)
```

### 2. Vertical Temperature Gauge

```yaml
type: custom:lcards-slider
entity: sensor.outdoor_temperature
component: vertical
grid_options:
  rows: 6
  columns: 2
style:
  track:
    type: gauge
  gauge:
    progress_bar:
      color: var(--lcars-orange)
    scale:
      tick_marks:
        major:
          interval: 10
          color: var(--lcars-white)
        minor:
          interval: 2
      labels:
        enabled: true
        unit: '°C'
control:
  min: -20
  max: 40
  locked: true
```

### 3. Minimal Cover Control

```yaml
type: custom:lcards-slider
entity: cover.living_room_blinds
component: horizontal
style:
  track:
    type: pills
    segments:
      count: 15
      gap: 4
      gradient:
        start: var(--lcars-tan)
        end: var(--lcars-blue)
control:
  attribute: current_position
  min: 0
  max: 100
```

### 4. High-Density Pill Slider

```yaml
type: custom:lcards-slider
entity: light.desk_lamp
component: horizontal
grid_options:
  rows: 1
  columns: 4
style:
  track:
    type: pills
    segments:
      # Auto-size with fixed width
      size:
        width: 8
        height: 10
      gap: 2
      shape:
        radius: 2
      gradient:
        start: '#FF0000'
        end: '#00FF00'
```

### 5. Interactive Gauge (Ruler Style, Still Controllable)

```yaml
type: custom:lcards-slider
entity: light.bedroom
component: horizontal
style:
  track:
    type: gauge  # Visual style: gauge ruler
  gauge:
    scale:
      tick_marks:
        major:
          interval: 20
control:
  locked: false  # Explicitly enable interaction (auto-detected for lights)
```

### 6. Custom Range Light Control

```yaml
type: custom:lcards-slider
entity: light.mood_lighting
component: horizontal
control:
  min: 10      # Won't go below 10% brightness
  max: 50      # Won't go above 50% brightness
  step: 2      # Changes in 2% increments
style:
  track:
    type: pills
    segments:
      count: 20
      gradient:
        start: var(--lcars-orange)
        end: var(--lcars-orange)  # Solid color
```

---

## Entity Domain Support

### Lights (`light.*`)

**Default Behavior:**
- Visual style: `pills`
- Locked: `false`
- Attribute: `brightness`
- Range: 0-100 (percentage scale)

**Brightness Conversion:**
The slider operates in percentage space (0-100%) regardless of control min/max. The card automatically converts:
- **Reading:** Home Assistant brightness (0-255) → Slider value (0-100%)
- **Writing:** Slider value (0-100%) → Home Assistant brightness (0-255)

**Custom Range:**
```yaml
control:
  min: 10  # Slider constrained to 10-50%
  max: 50  # Light will receive 10%-50% brightness
```
- Input range limited to 10-50 within 0-100 visual track
- Pills fill based on position in full visual range (10 = 10% fill, 50 = 50% fill)

### Covers (`cover.*`)

**Default Behavior:**
- Visual style: `pills`
- Locked: `false`
- Attribute: `current_position`
- Range: 0-100

### Fans (`fan.*`)

**Default Behavior:**
- Visual style: `pills`
- Locked: `false`
- Attribute: `percentage`
- Range: 0-100

### Input Numbers (`input_number.*`)

**Default Behavior:**
- Visual style: `pills`
- Locked: `false`
- Attribute: (uses state)
- Range: Inherits from entity attributes or 0-100

### Numbers (`number.*`)

Same as `input_number`.

### Sensors (`sensor.*`)

**Default Behavior:**
- Visual style: `gauge`
- Locked: `true` (read-only)
- Attribute: (uses state)
- Range: 0-100 (override with `control.min`/`max`)

---

## Architecture Notes

### Extension of LCARdSButton

The slider card extends `LCARdSButton` and inherits:
- Text field system (`style.text.fields`)
- Template processing
- Entity binding
- SVG border injection

This provides a consistent API across button, elbow, and slider cards.

### Visual Range vs Control Range

**Important distinction:**

| Concept | Description | Range |
|---------|-------------|-------|
| **Visual Range** | What pills/gauge display | Always 0-100 |
| **Control Range** | User-configurable subset | e.g., 10-50 for lights |
| **Value Space** | Domain-agnostic percentages | 0-100% |

**Example:** Light with `min: 10, max: 50`
- Visual track: Full width (0-100% positions)
- Control input: Sized to 40% width, positioned at 10% offset
- Pill fill: Based on visual position (value 30 = 30% fill, not 50%)
- Brightness: Direct percentage conversion (value 30 = 30% brightness = 76/255)

### Memoization

Track content (pills/gauge) is memoized for performance:
- Cache key: Configuration hash (count, gap, colors, size, etc.)
- Cache invalidation: Configuration changes, container size changes
- Benefit: Opacity updates don't regenerate DOM (60fps smooth animation)

---

## Schema Reference

Full configuration schema:

```yaml
type: custom:lcards-slider          # Required
entity: string                       # Required. Entity ID

# Component
component: string                    # Required. Component name

# Grid positioning (inherited from button)
grid_options:
  rows: number
  columns: number

# Control configuration
control:
  min: number                       # Minimum value (default: 0 or entity min)
  max: number                       # Maximum value (default: 100 or entity max)
  step: number                      # Step increment (default: 1 or entity step)
  attribute: string                 # Entity attribute (auto-detected by domain)
  locked: boolean                   # Disable interaction (auto-set by domain)

# Style configuration
style:
  # CSS borders (simple frame)
  border:
    left:
      size: number                  # Border width in px
      color: string                 # CSS color or variable
    top:
      size: number
      color: string
    right:
      size: number
      color: string
    bottom:
      size: number
      color: string

  # Track visual style
  track:
    type: 'pills' | 'gauge'         # Visual style
    orientation: 'horizontal' | 'vertical'  # Auto-detected from component
    margin: number | object         # Margin around track zone

    # Pills configuration (when type: pills)
    segments:
      count: number                 # Number of pills (undefined = auto)
      gap: number                   # Gap in px (default: 4)
      shape:
        radius: number              # Border radius (default: 4)
      size:
        height: number              # Pill height (default: 12)
        width: number               # Pill width (auto-calculated)
      gradient:
        start: string               # Start color
        end: string                 # End color
      appearance:
        unfilled:
          opacity: number           # Unfilled opacity (default: 0.2)
        filled:
          opacity: number           # Filled opacity (default: 1.0)

  # Gauge configuration (when type: gauge)
  gauge:
    progress_bar:
      color: string                 # Fill color
      height: number                # Bar height in px (default: 12)
      radius: number                # Border radius (default: 2)
    scale:
      tick_marks:
        major:
          enabled: boolean          # Show major ticks (default: true)
          interval: number          # Value interval (default: 10)
          color: string             # Tick color
          height: number            # Tick height in px (default: 15)
          width: number             # Tick width in px (default: 2)
        minor:
          enabled: boolean          # Show minor ticks (default: true)
          interval: number          # Value interval (default: 2)
          color: string             # Tick color
          height: number            # Tick height in px (default: 10)
          width: number             # Tick width in px (default: 1)
      labels:
        enabled: boolean            # Show labels (default: true)
        unit: string                # Unit suffix
        color: string               # Label color
        font_size: number           # Font size (default: 14)
        padding: number             # Tick-label spacing (default: 3)
    indicator:
      enabled: boolean              # Show indicator (default: false)
      type: 'line' | 'thumb'        # Indicator type (default: line)
      color: string                 # Indicator color
      size:
        width: number               # Indicator width (default: 4)
        height: number              # Indicator height (default: 25)
      border:
        color: string               # Border color
        width: number               # Border width (default: 1)

  # Text fields (inherited from button)
  text:
    fields:
      [field_name]:
        content: string             # Text content (supports templates)
        area: string                # Text area: left, top, right, bottom, track
        position: string            # Position keyword
        color: string               # Text color (default: var(--lcars-white))
        font_size: number           # Font size (default: 14)
```

---

## Migration Notes

### From v2.1.x to v2.2.x

**Breaking Changes:**
1. **Legacy `config.mode` deprecated** - Use `style.track.type` instead
   - Old: `mode: slider` → New: `style.track.type: pills`
   - Old: `mode: gauge` → New: `style.track.type: gauge`

2. **SVG text zone removed** - Use `style.text.fields` instead
   - Old: `style.text.value.enabled: true`
   - New: Define text fields in `style.text.fields` object

3. **Text system unified with button** - Consistent API across cards
   - Old: Custom slider text positioning
   - New: Use button's text field system with `area` and `position`

**New Features:**
- Control range configuration (`control.min`, `max`, `step`)
- Visual range vs control range separation
- Improved brightness mapping for lights
- Template null handling (displays as empty string)
- Border size configuration (`size` or `width` properties)

---

## Troubleshooting

### Pills don't fill correctly
- Check that `control.min` and `max` match expected range
- For lights: Range should be 0-100 (percentages)
- Verify entity state is within configured range

### Slider doesn't respond to input
- Check `control.locked` is not `true`
- Verify entity domain is controllable (not a sensor)
- Check browser console for errors

### Gauge ticks are misaligned
- Ensure `control.min` and `max` match your data range
- Verify `tick_marks.major.interval` is a reasonable value
- For temperature: Set `min` and `max` to cover expected range

### Text doesn't appear in border area
- Verify border is configured: `style.border.left.size: 120`
- Check text `area` matches border location: `area: left`
- Ensure text `content` template is valid

### Brightness jumps to 100% when min/max configured
- This was a bug in v2.2.68 and earlier
- Fixed in v2.2.69: Direct percentage conversion
- Update to latest version

---

## See Also

- [Button Card Documentation](./button.md) - Shared text field system
- [Elbow Button Documentation](./elbow-button.md) - Similar bordered cards
- [Template Conditions](../template-conditions.md) - Dynamic content
- [LCARS Theme Variables](../../../getting-started/theme-setup.md) - Color tokens
