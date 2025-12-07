# LCARdS Data Grid Card - Quick Reference

**Component:** `custom:lcards-data-grid`
**Purpose:** Flexible LCARS-style data grid with cascade animations and multiple data modes

---

## Overview

The Data Grid card creates authentic LCARS-style data visualizations with:
- Three data input modes: random (decorative), template (manual), datasource (real-time)
- Cascade animations with per-row timing and authentic LCARS color cycling
- Change detection with configurable highlight animations
- Timeline and spreadsheet layouts for DataSource mode
- Full theme integration with token support
- Performance-optimized CSS Grid layout

---

## Complete Schema

```yaml
type: custom:lcards-data-grid

# ==============================================================================
# DATA MODE (Required - choose one)
# ==============================================================================

data_mode: random | template | datasource

# ------------------------------------------------------------------------------
# RANDOM MODE - Decorative data generation
# ------------------------------------------------------------------------------

format: digit | float | alpha | hex | mixed  # Data format (default: mixed)
refresh_interval: <number>                   # Auto-refresh in ms (0 = disabled)

# ------------------------------------------------------------------------------
# TEMPLATE MODE - Manual grid with templates
# ------------------------------------------------------------------------------

rows:
  - [<value>, <value>, ...]  # Row 1
  - [<value>, <value>, ...]  # Row 2
  # Values can be:
  # - Static text: 'Label'
  # - Entity state: '{{states.sensor.temp.state}}'
  # - Entity attribute: '{{states.sensor.temp.attributes.unit}}'
  # - Jinja2 logic: '{% if ... %}...{% endif %}'

# ------------------------------------------------------------------------------
# DATASOURCE MODE - Real-time data integration
# ------------------------------------------------------------------------------

layout: timeline | spreadsheet               # Layout type (required for datasource mode)

# Timeline Layout - flowing data from single source
source: <string>                             # Entity ID or DataSource name
history_hours: <number>                      # Hours of history to preload (default: 1)
value_template: <string>                     # Format template (default: '{value}')

# Spreadsheet Layout - structured multi-source grid
data_sources:                                # DataSource definitions (optional, can auto-create)
  <name>:
    entity: <entity_id>                      # Entity to track

columns:                                     # Column definitions (required for spreadsheet)
  - header: <string>                         # Column header text
    width: <number>                          # Column width in px (optional)
    align: left | center | right             # Alignment (default: left)

rows:                                        # Row definitions (required for spreadsheet)
  - sources:
      - type: static | datasource
        column: <number>                     # Column index (0-based)
        value: <any>                         # For static type
        source: <string>                     # For datasource type (name or entity)
        format: <string>                     # Format template (default: '{value}')
        aggregation: last | avg | min | max  # Aggregation (default: last)

# ==============================================================================
# GRID CONFIGURATION
# ==============================================================================

grid:
  rows: <number>                             # Number of rows (random/template/timeline)
  columns: <number>                          # Number of columns (required)
  gap: <number>                              # Gap between cells in px (default: 8)
  cell_width: auto | <number>                # Cell width: 'auto' or fixed px (default: auto)

# ==============================================================================
# STYLING
# ==============================================================================

# Typography
font_size: <number>                          # Font size in px (default: 18)
font_family: <string>                        # Font family (default: 'Antonio', 'Helvetica Neue', sans-serif)
font_weight: <number>                        # Font weight (default: 400)

# Colors
color: <color>                               # Default text color (hex, theme token, CSS var)
                                             # Examples: '#99ccff', 'theme:colors.lcars.blue', 'var(--primary-text-color)'

# Alignment
align: left | center | right                 # Cell text alignment (default: right)

# Spreadsheet Header Styling (spreadsheet layout only)
header_style:
  background: <color>                        # Header background color (default: theme:colors.background.header)
  color: <color>                             # Header text color (default: theme:colors.text.header)
  font_size: <number>                        # Header font size in px (default: same as font_size)
  font_weight: <number>                      # Header font weight (default: 700)
  text_transform: uppercase | lowercase | capitalize | none  # Text transform (default: uppercase)
  divider_color: <color>                     # Divider line color (default: theme:colors.divider)
  divider_width: <number>                    # Divider line width in px (default: 2)

# ==============================================================================
# CASCADE ANIMATION
# ==============================================================================

animation:
  type: cascade                              # Enable cascade animation

  # Timing Pattern
  pattern: default | niagara | fast | custom
  # - default: Varied organic (3s, 3s, 4s, 4s, 4s, 2s, 2s, 2s)
  # - niagara: Smooth uniform (all 2s)
  # - fast: Quick waterfall (all 1s)
  # - custom: User-defined (see below)

  # Color Cycle (3-color cascade)
  colors:
    start: <color>                           # Starting color (75% dwell)
    text: <color>                            # Middle color (10% snap)
    end: <color>                             # Ending color (10% brief)

  # Speed Controls (choose one)
  speed_multiplier: <number>                 # Speed multiplier (2.0 = twice as fast)
  duration: <number>                         # Override all row durations (ms)

  # Advanced
  easing: <string>                           # Easing function (default: 'linear')

  # Custom Pattern (when pattern: custom)
  timing:
    - duration: <number>                     # Duration in ms
      delay: <number>                        # Delay in seconds
    - duration: <number>
      delay: <number>
    # Pattern repeats for remaining rows

  # Change Detection (highlight cells when values change)
  highlight_changes: <boolean>               # Enable change detection (default: false)
  change_preset: pulse | glow | flash        # Animation preset (default: pulse)
  change_duration: <number>                  # Duration in ms (default: 500)
  change_easing: <string>                    # Easing function (default: 'easeOutQuad')
  change_params: <object>                    # Additional preset-specific parameters (optional)
    # Preset-specific params override preset defaults
    # Example for 'pulse': { max_scale: 1.08, min_opacity: 0.8 }
    # Example for 'glow': { color: '#ff9966', blur_max: 12 }
  max_highlight_cells: <number>              # Max cells to animate per update (default: 50)

# ==============================================================================
# CARD METADATA (Optional)
# ==============================================================================

id: <string>                                 # Card identifier for rules/animations
tags: [<string>, ...]                        # Tags for rules engine
```

---

## Data Modes

### Mode 1: Random (Decorative)

Auto-generates random data for LCARS-style ambiance.

**Format Options:**

| Format | Output Example | Description |
|--------|----------------|-------------|
| `digit` | `0042`, `1337` | 4-digit numbers (zero-padded) |
| `float` | `42.17`, `3.14` | Decimal numbers (2 decimals) |
| `alpha` | `AB`, `XY` | Two uppercase letters |
| `hex` | `A3F1`, `00FF` | 4-digit hexadecimal |
| `mixed` | Various | Random mix of all formats |

**Basic Example:**
```yaml
type: custom:lcards-data-grid
data_mode: random
format: hex
grid:
  rows: 8
  columns: 12
```

**With Auto-Refresh:**
```yaml
type: custom:lcards-data-grid
data_mode: random
format: mixed
refresh_interval: 3000     # Update every 3 seconds
grid:
  rows: 6
  columns: 10
animation:
  highlight_changes: true  # Animate changes
```

---

### Mode 2: Template (Manual Grid)

Define grid content using Home Assistant templates.

**Template Syntax:**
- **Static text:** `'CPU'`
- **Entity state:** `'{{states.sensor.cpu_usage.state}}'`
- **Entity attribute:** `'{{states.sensor.temp.attributes.unit}}'`
- **Jinja2 logic:** `'{% if states.sensor.temp.state|float > 22 %}WARM{% else %}COOL{% endif %}'`

**Basic Example:**
```yaml
type: custom:lcards-data-grid
data_mode: template
rows:
  - ['Label', 'Value', 'Status']
  - ['CPU', '{{states.sensor.cpu_usage.state}}%', 'OK']
  - ['RAM', '{{states.sensor.memory_usage.state}}%', 'OK']
font_size: 16
```

**With Conditionals:**
```yaml
type: custom:lcards-data-grid
data_mode: template
rows:
  - ['Room', 'Temp', 'Status']
  - ['Living', '{{states.sensor.living_temp.state}}°C', '{% if states.sensor.living_temp.state|float > 22 %}WARM{% else %}COOL{% endif %}']
  - ['Bedroom', '{{states.sensor.bedroom_temp.state}}°C', '{% if states.sensor.bedroom_temp.state|float > 22 %}WARM{% else %}COOL{% endif %}']
```

**Features:**
- Full Home Assistant template syntax
- Auto-updates when tracked entities change
- Supports Jinja2 filters and conditionals
- State and attribute access

---

### Mode 3: DataSource (Real-Time)

Integrate with LCARdS DataSource system for advanced data handling.

#### Timeline Layout

Display flowing data from a single source.

**Example:**
```yaml
type: custom:lcards-data-grid
data_mode: datasource
layout: timeline
source: sensor.temperature    # Entity or DataSource name
grid:
  rows: 6
  columns: 12
history_hours: 1              # Preload 1 hour of history
value_template: '{value}°C'   # Format values
animation:
  type: cascade
  highlight_changes: true
```

**Features:**
- Flows new values left-to-right, top-to-bottom
- Supports historical data preload
- Auto-creates DataSource from entity if needed
- Change detection highlights new values (disabled by default to avoid false positives from shifting)

---

#### Spreadsheet Layout

Structured grid with multiple data sources.

**Example:**
```yaml
type: custom:lcards-data-grid
data_mode: datasource
layout: spreadsheet

# Define columns
columns:
  - header: Room
    width: 120
    align: left
  - header: Temperature
    width: 100
    align: center
  - header: Humidity
    width: 100
    align: center

# Define rows with data sources
rows:
  - sources:
      - type: static
        column: 0
        value: Living Room
      - type: datasource
        column: 1
        source: sensor.living_temperature
        format: '{value}°C'
      - type: datasource
        column: 2
        source: sensor.living_humidity
        format: '{value}%'

  - sources:
      - type: static
        column: 0
        value: Bedroom
      - type: datasource
        column: 1
        source: sensor.bedroom_temperature
        format: '{value}°C'
      - type: datasource
        column: 2
        source: sensor.bedroom_humidity
        format: '{value}%'

font_size: 15
animation:
  type: cascade
  highlight_changes: true
  change_preset: glow
```

**Features:**
- Column headers with configurable width and alignment
- Mix static labels with dynamic data
- Per-cell value formatting
- Independent data sources per cell
- Efficient update handling

---

## Cascade Animation

The signature LCARS feature: row-by-row color cycling powered by AnimationManager.

### Basic Cascade

```yaml
animation:
  type: cascade
  pattern: default           # Animation timing pattern
  colors:
    start: colors.lcars.blue
    text: colors.lcars.dark-blue
    end: colors.lcars.moonlight
```

### Animation Patterns

| Pattern | Description | Row Durations | Use Case |
|---------|-------------|---------------|----------|
| `default` | Varied organic | 3s, 3s, 4s, 4s, 4s, 2s, 2s, 2s | Standard displays |
| `niagara` | Smooth uniform | All 2s | Smooth wave effect |
| `fast` | Quick cascade | All 1s | Rapid updates |
| `custom` | User-defined | See below | Precise control |

### Color Cycle Timing

Authentic LCARS CSS keyframe timing:
- **0-75%**: `start` color - **long dwell**
- **80-90%**: `text` color - **snap/flash**
- **90-100%**: `end` color - **brief transition**

All cells in a row change color together. Each row has independent timing based on pattern.

### Speed Control

**Option 1: Speed Multiplier**
```yaml
animation:
  type: cascade
  pattern: default
  speed_multiplier: 2.0      # 2x faster
```

**Option 2: Duration Override**
```yaml
animation:
  type: cascade
  pattern: default
  duration: 1500             # All rows use 1500ms
```

### Custom Timing Pattern

Define precise timing for each row:

```yaml
animation:
  type: cascade
  pattern: custom
  timing:
    - { duration: 3000, delay: 100 }   # Row 1
    - { duration: 3000, delay: 200 }   # Row 2
    - { duration: 4000, delay: 300 }   # Row 3
    - { duration: 2000, delay: 150 }   # Row 4
    # Pattern repeats for remaining rows
  colors:
    start: '#99ccff'
    text: '#4466aa'
    end: '#aaccff'
```

### Color Options

**Theme Tokens (Recommended):**
```yaml
animation:
  colors:
    start: theme:colors.lcars.blue
    text: theme:colors.lcars.dark-blue
    end: theme:colors.lcars.moonlight
```

**CSS Variables:**
```yaml
animation:
  colors:
    start: var(--lcars-blue, #99ccff)
    text: var(--lcars-dark-blue, #4466aa)
    end: var(--lcars-moonlight, #aaccff)
```

**Hex Colors:**
```yaml
animation:
  colors:
    start: '#99ccff'
    text: '#4466aa'
    end: '#aaccff'
```

---

## Change Detection

Highlight cells when values change.

### Basic Configuration

```yaml
animation:
  highlight_changes: true    # Enable change detection
  change_preset: pulse       # Animation preset
```

### Animation Presets

| Preset | Effect | Duration | Use Case |
|--------|--------|----------|----------|
| `pulse` | Brightness + scale | 500ms | Default, subtle |
| `glow` | Drop-shadow glow | 600ms | Draw attention |
| `flash` | Quick color flash | 300ms | Rapid updates |

### Advanced Configuration

Fine-tune change animations with custom parameters:

```yaml
animation:
  highlight_changes: true
  change_preset: pulse
  change_duration: 800           # Custom duration in ms
  change_easing: easeOutCubic    # Custom easing function
  change_params:                 # Preset-specific parameters
    max_scale: 1.1               # Scale up to 110%
    min_opacity: 0.7             # Fade to 70% opacity
  max_highlight_cells: 30        # Limit animations for performance
```

**Available Easing Functions:**
- `linear` - Constant speed
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad` - Quadratic
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic` - Cubic
- `easeInQuart`, `easeOutQuart`, `easeInOutQuart` - Quartic
- `easeInElastic`, `easeOutElastic`, `easeInOutElastic` - Elastic bounce
- And more from anime.js easing library

**Preset-Specific Parameters:**

**Pulse Preset:**
```yaml
change_params:
  max_scale: 1.08              # Maximum scale (default: 1.05)
  min_opacity: 0.8             # Minimum opacity (default: 0.7)
```

**Glow Preset:**
```yaml
change_params:
  color: '#ff9966'             # Glow color (default: preset color)
  blur_max: 12                 # Maximum blur radius (default: 8)
```

**Flash Preset:**
```yaml
change_params:
  color: '#ffcc00'             # Flash color (default: preset color)
```

### Performance Limiting

Prevent excessive animations on large grids:

```yaml
animation:
  highlight_changes: true
  max_highlight_cells: 50    # Limit to 50 animated cells per update
```

### Cascade + Change Detection

Both can work together:

```yaml
animation:
  type: cascade              # Background cascade
  pattern: niagara
  highlight_changes: true    # Plus change highlights
  change_preset: pulse
  colors:
    start: theme:colors.lcars.blue
    text: theme:colors.lcars.dark-blue
    end: theme:colors.lcars.moonlight
```

---

## Grid Configuration

### Basic Grid

```yaml
grid:
  rows: 8                    # Number of rows
  columns: 12                # Number of columns
  gap: 8                     # Gap between cells (px)
  cell_width: auto           # 'auto' or fixed px
```

### Cell Width Options

**Auto-sizing (default):**
```yaml
grid:
  columns: 12
  cell_width: auto          # Equal-width columns
```

**Fixed width:**
```yaml
grid:
  columns: 12
  cell_width: 80            # 80px per cell
```

### Cell Alignment

```yaml
align: left | center | right   # Default: right
```

Applies to all cells. For per-column alignment in spreadsheet mode, use column config.

---

## Styling

### Typography

```yaml
font_size: 18               # Cell text size in px
font_family: "'Antonio', 'Helvetica Neue', sans-serif"
font_weight: 400            # Font weight
```

### Colors

**Single color for all cells:**
```yaml
color: '#99ccff'            # Hex color
```

**Theme integration:**
```yaml
color: theme:colors.text.primary
```

**CSS variables:**
```yaml
color: var(--primary-text-color)
```

**Note:** Cascade animation overrides this color during the color cycle.

### Grid Spacing

```yaml
grid:
  gap: 8                   # Gap between cells in px
```

Individual cell padding is auto-calculated from gap value.

---

## Theme Integration

### Using Theme Tokens

Reference the theme system:

```yaml
color: theme:colors.text.primary

animation:
  colors:
    start: theme:colors.lcars.blue
    text: theme:colors.lcars.dark-blue
    end: theme:colors.lcars.moonlight
```

**Common Theme Tokens:**
- `theme:colors.lcars.blue` - LCARS blue (#99ccff)
- `theme:colors.lcars.dark-blue` - Dark blue (#4466aa)
- `theme:colors.lcars.moonlight` - Moonlight (#aaccff)
- `theme:colors.lcars.orange` - LCARS orange
- `theme:colors.lcars.yellow` - LCARS yellow
- `theme:colors.text.primary` - Primary text color
- `theme:colors.background.card` - Card background
- `theme:colors.divider` - Divider lines

### Using CSS Variables

Reference Home Assistant theme variables:

```yaml
color: var(--primary-text-color)

animation:
  colors:
    start: var(--lcars-blue, #99ccff)  # With fallback
    text: var(--lcars-dark-blue, #4466aa)
    end: var(--lcars-moonlight, #aaccff)
```

---

## Complete Examples

### Example 1: Decorative LCARS Display

Classic random data cascade for ambiance:

```yaml
type: custom:lcards-data-grid
data_mode: random
format: hex
grid:
  rows: 8
  columns: 12
  gap: 8
font_size: 18
color: theme:colors.lcars.blue
animation:
  type: cascade
  pattern: niagara
  colors:
    start: '#99ccff'
    text: '#4466aa'
    end: '#aaccff'
```

---

### Example 2: Live Sensor Status Board

Template-based grid with live entity data:

```yaml
type: custom:lcards-data-grid
data_mode: template
rows:
  - ['SYSTEM', 'VALUE', 'STATUS']
  - ['CPU TEMP', '{{states.sensor.cpu_temperature.state}}°C', '{% if states.sensor.cpu_temperature.state|float > 70 %}HOT{% else %}OK{% endif %}']
  - ['CPU LOAD', '{{states.sensor.cpu_usage.state}}%', '{% if states.sensor.cpu_usage.state|float > 80 %}HIGH{% else %}OK{% endif %}']
  - ['MEMORY', '{{states.sensor.memory_usage.state}}%', '{% if states.sensor.memory_usage.state|float > 90 %}HIGH{% else %}OK{% endif %}']
  - ['DISK', '{{states.sensor.disk_usage.state}}%', '{% if states.sensor.disk_usage.state|float > 85 %}FULL{% else %}OK{% endif %}']
font_size: 16
align: left
animation:
  type: cascade
  pattern: fast
  highlight_changes: true
  colors:
    start: theme:colors.lcars.orange
    text: theme:colors.lcars.yellow
    end: theme:colors.lcars.orange
```

---

### Example 3: Temperature Timeline

Historical temperature data in timeline layout:

```yaml
type: custom:lcards-data-grid
data_mode: datasource
layout: timeline
source: sensor.outdoor_temperature
grid:
  rows: 6
  columns: 12
  gap: 6
history_hours: 2            # Show last 2 hours
value_template: '{value}°C'
font_size: 14
align: center
animation:
  type: cascade
  pattern: default
  max_highlight_cells: 20
  colors:
    start: '#99ccff'
    text: '#6699cc'
    end: '#99ccff'
```

---

### Example 4: Multi-Sensor Spreadsheet

Structured data grid with multiple sources:

```yaml
type: custom:lcards-data-grid
data_mode: datasource
layout: spreadsheet

columns:
  - header: Location
    width: 140
    align: left
  - header: Temp
    width: 80
    align: center
  - header: Humidity
    width: 80
    align: center
  - header: Status
    width: 100
    align: center

rows:
  - sources:
      - type: static
        column: 0
        value: Living Room
      - type: datasource
        column: 1
        source: sensor.living_temperature
        format: '{value}°C'
      - type: datasource
        column: 2
        source: sensor.living_humidity
        format: '{value}%'
      - type: static
        column: 3
        value: NORMAL

  - sources:
      - type: static
        column: 0
        value: Bedroom
      - type: datasource
        column: 1
        source: sensor.bedroom_temperature
        format: '{value}°C'
      - type: datasource
        column: 2
        source: sensor.bedroom_humidity
        format: '{value}%'
      - type: static
        column: 3
        value: NORMAL

font_size: 15
header_style:
  background: colors.lcars.dark-blue
  color: colors.lcars.blue
  font_size: 16
  font_weight: 700
  text_transform: uppercase
  divider_color: colors.lcars.blue
  divider_width: 2
animation:
  type: cascade
  pattern: default
  highlight_changes: true
  colors:
    start: theme:colors.lcars.blue
    text: theme:colors.lcars.dark-blue
    end: theme:colors.lcars.moonlight
```

---

### Example 5: High-Performance Auto-Refresh

Rapid updates with performance controls:

```yaml
type: custom:lcards-data-grid
data_mode: random
format: mixed
refresh_interval: 2000      # Update every 2 seconds
grid:
  rows: 10
  columns: 15
  gap: 6
font_size: 14
animation:
  type: cascade
  pattern: fast
  highlight_changes: true
  max_highlight_cells: 30   # Limit for performance
  colors:
    start: '#99ccff'
    text: '#4466aa'
    end: '#aaccff'
```

---

## Troubleshooting

### Grid Not Appearing

**Check:**
1. `data_mode` is specified correctly
2. Required fields for mode are provided:
   - Random: `grid.rows` and `grid.columns`
   - Template: `rows` array
   - DataSource: `source` (timeline) or `columns`+`rows` (spreadsheet)
3. Console for errors (F12)

### Cascade Animation Not Working

**Check:**
1. `animation.type: cascade` is set
2. Colors are valid (hex, theme tokens, or CSS vars)
3. AnimationManager is loaded (check console logs)
4. Pattern name is correct

### Template Values Not Updating

**Check:**
1. Entity IDs are correct in templates
2. Entities have recent state changes
3. Template syntax is valid: `{{states.entity_id.state}}`
4. Console for template processing errors

### DataSource Mode Errors

**Check:**
1. DataSource exists or entity ID is valid
2. DataSourceManager is initialized (check console)
3. Source name matches registered DataSource
4. For spreadsheet: column indices are 0-based and match column definitions

### Change Detection Not Working

**Check:**
1. `animation.highlight_changes: true` is set
2. Data is actually changing (check entity history)
3. `max_highlight_cells` isn't limiting animations too much
4. Mode supports updates (all modes do)

### Performance Issues

**Solutions:**
1. Reduce grid size (fewer rows/columns)
2. Increase `refresh_interval` for random mode
3. Lower `max_highlight_cells` limit
4. Use `pattern: fast` for quicker cycles
5. Disable change detection if not needed

---

## Technical Notes

### Animation Architecture

The Data Grid uses AnimationManager for all animations:
- **Cascade:** Per-row independent animations with anime.js keyframes
- **Change detection:** One-shot animations on modified cells
- **Scope management:** All animations registered under grid overlay ID

### Performance Optimizations

- CSS Grid layout (native browser optimization)
- Change detection limits (`max_highlight_cells`)
- Efficient template processing
- DataSource subscription management
- ResizeObserver for responsive sizing

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires CSS Grid support
- Requires Web Components (Custom Elements)
- anime.js v4 for animations

---

## Further Reading

- **Animation System:** See `doc/architecture/animation-system.md`
- **DataSource System:** See LCARdS DataSource documentation
- **Theme System:** See LCARdS theme documentation
- **Template Syntax:** Home Assistant template documentation

---

**Version:** 2.3.22
**Last Updated:** December 7, 2024
**Status:** Stable - Authentic LCARS cascade animation with three data modes
