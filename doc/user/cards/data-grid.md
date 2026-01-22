# LCARdS Data Grid Card

> **Flexible LCARS-style data grid with cascade animations**
> Create authentic LCARS data visualizations with decorative or real entity data.

---

## Overview

The Data Grid card creates authentic LCARS-style data visualizations with:
- Two data input modes: decorative (random) and data (real entities/sensors)
- Cascade animations with per-row timing and authentic LCARS color cycling
- Change detection with configurable highlight animations
- Grid and timeline layouts for data mode
- Auto-detection of cell types (static text, entity references, or templates)
- Full theme integration with token support
- Performance-optimized CSS Grid layout

**📚 Comprehensive Examples:**
- **CSS Grid Features:** [`doc/examples/data-grid-css-grid-comprehensive.yaml`](../../examples/data-grid-css-grid-comprehensive.yaml)
- **Hierarchical Styling:** [`doc/examples/data-grid-hierarchical-styling.yaml`](../../examples/data-grid-hierarchical-styling.yaml)
- **Theme Tokens:** [`doc/examples/data-grid-theme-tokens.yaml`](../../examples/data-grid-theme-tokens.yaml)
- **Performance & Large Grids:** [`doc/examples/data-grid-performance.yaml`](../../examples/data-grid-performance.yaml)
- **Legacy Format Migration:** [`doc/examples/data-grid-backward-compatibility.yaml`](../../examples/data-grid-backward-compatibility.yaml)

---

## Data Modes

The Data Grid supports two modes:

### Mode 1: Decorative

Auto-generates random data for LCARS-style ambiance.

**Format Options:**

| Format | Output Example | Description |
|--------|----------------|-------------|
| `digit` | `0042`, `1337` | 4-digit numbers (zero-padded) |
| `float` | `42.17`, `3.14` | Decimal numbers (2 decimals) |
| `alpha` | `AB`, `XY` | Two uppercase letters |
| `hex` | `A3F1`, `00FF` | 4-digit hexadecimal |
| `mixed` | Various | Random mix of all formats |

**Example:**
```yaml
type: custom:lcards-data-grid
data_mode: decorative
format: hex
refresh_interval: 3000
grid:
  grid-template-rows: repeat(8, auto)
  grid-template-columns: repeat(12, 1fr)
  gap: 8px
animation:
  type: cascade
```

---

### Mode 2: Data

Display real entity/sensor data with two layout options:

#### Layout: Grid (Default)

Static grid structure with auto-detected cell types:
- **Static text:** `'CPU'` or `'Label'`
- **Entity reference:** `sensor.cpu_usage` (auto-subscribes to state)
- **Template string:** `'{{states.sensor.cpu_usage.state}}%'` (Jinja2 templates)

**Basic Example:**
```yaml
type: custom:lcards-data-grid
data_mode: data
layout: grid  # default, can omit
rows:
  - ['System', 'Value', 'Status']
  - ['CPU', sensor.cpu_usage, '{{states.sensor.cpu_usage.state|float > 80 and "HIGH" or "OK"}}']
  - ['Memory', sensor.memory_usage, 'OK']
  - ['Temp', sensor.cpu_temp, '{{states.sensor.cpu_temp.state}}°C']
grid:
  grid-template-columns: 140px 100px 100px
  gap: 8px
animation:
  type: cascade
  highlight_changes: true
```

**With Row Styling:**
```yaml
type: custom:lcards-data-grid
data_mode: data
rows:
  # Simple array (no styling)
  - ['System', 'Value', 'Status']

  # Object format with row-level styling
  - values: ['CPU', sensor.cpu_usage, 'ALERT']
    style:
      color: colors.lcars.orange
      font_weight: 600
      background: 'alpha(colors.lcars.orange, 0.1)'

  - values: ['Memory', sensor.memory_usage, 'OK']
    style:
      color: colors.lcars.blue
```

**Features:**
- Auto-detects cell types (static/entity/template)
- Subscribes to entity state changes automatically
- Full Home Assistant template syntax support
- Hierarchical styling system

#### Layout: Timeline

Flowing historical data from a single source.

**Example:**
```yaml
type: custom:lcards-data-grid
data_mode: data
layout: timeline
source: sensor.temperature
history_hours: 2
value_template: '{value}°C'
grid:
  grid-template-rows: repeat(6, auto)
  grid-template-columns: repeat(12, 1fr)
  gap: 8px
animation:
  type: cascade
```

**Features:**
- Displays historical data flowing left-to-right
- Preloads specified hours of history
- Auto-updates with new data points
- Value formatting with template strings

---

### Migration from Old Modes

**Old `random` mode:**
```yaml
# OLD
data_mode: random
format: mixed

# NEW (just rename mode)
data_mode: decorative
format: mixed
```

**Old `template` mode:**
```yaml
# OLD
data_mode: template
rows:
  - ['CPU', '{{states.sensor.cpu.state}}%']

# NEW (identical config, just change mode name)
data_mode: data
layout: grid  # optional, this is default
rows:
  - ['CPU', '{{states.sensor.cpu.state}}%']
```

**Old `datasource` timeline:**
```yaml
# OLD
data_mode: datasource
layout: timeline
source: sensor.temperature

# NEW (identical, just change mode name)
data_mode: data
layout: timeline
source: sensor.temperature
```

**Old `datasource` spreadsheet (no longer supported):**
```yaml
# OLD (complex datasource spreadsheet syntax)
data_mode: datasource
layout: spreadsheet
columns:
  - header: Location
  - header: Temperature
rows:
  - sources:
      - {type: static, column: 0, value: 'Living Room'}
      - {type: datasource, column: 1, source: sensor.living_temp}

# NEW (simpler auto-detect syntax)
data_mode: data
layout: grid
rows:
  - ['Location', 'Temperature']  # Row 0 as header (style it with rows[0].style)
  - ['Living Room', sensor.living_temp]
  - ['Bedroom', sensor.bedroom_temp]
```

---

## Complete Schema

```yaml
type: custom:lcards-data-grid

# ==============================================================================
# DATA MODE (Required - choose one)
# ==============================================================================

data_mode: decorative | data

# ------------------------------------------------------------------------------
# DECORATIVE MODE - Decorative data generation
# ------------------------------------------------------------------------------

format: digit | float | alpha | hex | mixed  # Data format (default: mixed)
refresh_interval: <number>                   # Auto-refresh in ms (0 = disabled)

# ------------------------------------------------------------------------------
# DATA MODE - Real entity/sensor data
# ------------------------------------------------------------------------------

layout: grid | timeline                      # Layout type (default: grid)

# Grid Layout - static structure with auto-detected cells
rows:
  - [<value>, <value>, ...]  # Row 1 (simple array)
  - values: [<value>, <value>, ...]  # Row 2 (with styling)
    style:
      color: <color>
      font_weight: <number>
  # Cell values auto-detect:
  # - Static text: 'Label' or 'CPU'
  # - Entity reference: sensor.temperature
  # - Template: '{{states.sensor.temp.state}}°C'

# Timeline Layout - flowing data from single source
source: <string>                             # Entity ID or DataSource name
history_hours: <number>                      # Hours of history to preload (default: 1)
value_template: <string>                     # Format template (default: '{value}')

# ==============================================================================
# GRID CONFIGURATION
# ==============================================================================

# STANDARD CSS GRID (Recommended)
# All standard CSS Grid properties pass through to the browser.
# This gives you full control over grid layout with native CSS Grid.
grid:
  # Track Sizing (defines explicit grid structure)
  grid-template-columns: repeat(12, 1fr)     # Column track sizing
  grid-template-rows: repeat(8, auto)        # Row track sizing

  # Gap Control (spacing between cells)
  gap: 8px                                   # Uniform gap (shorthand)
  row-gap: 20px                              # Vertical gap only
  column-gap: 5px                            # Horizontal gap only
  # Note: Specify either 'gap' OR 'row-gap'/'column-gap', not both

  # Auto-Placement (how cells fill the grid)
  grid-auto-flow: row | column | dense       # Auto-placement algorithm (default: row)

  # Item Alignment (how cells align within their grid areas)
  justify-items: stretch | start | end | center  # Horizontal alignment (default: stretch)
  align-items: stretch | start | end | center    # Vertical alignment (default: stretch)

  # Container Alignment (how the grid aligns within the card)
  justify-content: start | end | center | space-between | space-around | space-evenly
  align-content: start | end | center | space-between | space-around | space-evenly

  # Implicit Grid (sizing for auto-generated tracks)
  grid-auto-columns: 100px                   # Width of implicit columns
  grid-auto-rows: 50px                       # Height of implicit rows

  # Advanced Features (browser-dependent)
  grid-template-areas: |                     # Named grid areas
    "header header header"
    "sidebar content aside"

# BACKWARD-COMPATIBLE SHORTHAND (Deprecated)
# Still supported for compatibility, but logs deprecation warning:
grid:
  rows: 8                                    # Number of rows (converts to grid-template-rows)
  columns: 12                                # Number of columns (converts to grid-template-columns)
  gap: 8                                     # Gap in px (converts to gap property)
  cell_width: auto | <number>                # Cell width: 'auto' (1fr) or fixed px

# ==============================================================================
# HIERARCHICAL CELL STYLING
# ==============================================================================

# Style Resolution Hierarchy (lower priority to higher):
# 1. Grid-wide defaults (style property)
# 2. Header defaults (header_style property) - for header rows only
# 3. Column-level overrides (columns[i].style)
# 4. Row-level overrides (rows[i].style)
# 5. Cell-level overrides (highest priority)

# Grid-wide Style (applies to all cells)
style:
  font_size: <number>                        # Font size in px (default: 18)
  font_family: <string>                      # Font family (default: 'Antonio', 'Helvetica Neue', sans-serif)
  font_weight: <number>                      # Font weight (default: 400)
  color: <color>                             # Text color (default: theme:colors.grid.cellText)
  background: <color>                        # Background color (default: transparent)
  align: left | center | right               # Text alignment (default: right)
  padding: <size>                            # Cell padding (default: 8px)
  border_width: <number>                     # Border width in px
  border_color: <color>                      # Border color
  border_style: solid | dashed | dotted      # Border style
  # ... any CSS property (underscore converts to kebab-case)

# Header Style (spreadsheet mode only)
header_style:
  background: <color>                        # Header background (default: theme:colors.grid.headerBackground)
  color: <color>                             # Header text color (default: theme:colors.grid.headerText)
  font_size: <number>                        # Header font size (default: 16)
  font_weight: <number>                      # Header font weight (default: 700)
  text_transform: uppercase | lowercase      # Text transform (default: uppercase)
  padding: <size>                            # Header padding (default: 12px 8px)
  border_bottom_width: <number>              # Bottom border width (default: 2)
  border_bottom_color: <color>               # Bottom border color (default: theme:colors.grid.divider)
  border_bottom_style: solid                 # Bottom border style

# Column-level Style (spreadsheet mode)
columns:
  - header: Location
    width: 140                               # Column width in px
    align: left                              # Column alignment
    style:                                   # Column-wide style override
      color: colors.lcars.blue
      font_weight: 500

# Row-level Style (all modes)
rows:
  - style:                                   # Style for entire row
      background: colors.grid.rowAlt
      font_weight: 600

# Cell-level Style (template mode)
rows:
  - values: ['Cell 1', 'Cell 2', 'Cell 3']
    style:                                   # Row-wide style
      background: colors.grid.rowAlt
    cellStyles:                              # Per-cell style array
      - color: colors.lcars.red              # Style for first cell
        font_weight: 900
      - null                                 # No override for second cell
      - color: colors.lcars.blue             # Style for third cell

# Cell-level Style (spreadsheet mode)
rows:
  - sources:
      - column: 0
        value: "ALERT"
        style:                               # Cell-specific override
          color: colors.lcars.red
          font_weight: 900
          background: 'alpha(colors.lcars.red, 0.2)'

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
    # See "Change Animation Presets" section below for detailed parameters

# ==============================================================================
# CHANGE ANIMATION PRESETS
# ==============================================================================

# PULSE PRESET
# Scales and fades the cell to draw attention
animation:
  change_preset: pulse
  change_params:
    max_scale: 1.08                          # Maximum scale factor (default: 1.05)
    min_opacity: 0.8                         # Minimum opacity (default: 0.7)

# GLOW PRESET
# Adds an animated glow/shadow effect around the cell
animation:
  change_preset: glow
  change_params:
    color: '#ff9966'                         # Glow color (default: preset color)
    blur_max: 12                             # Maximum blur radius in px (default: 8)

# FLASH PRESET
# Rapidly changes background color to highlight the cell
animation:
  change_preset: flash
  change_params:
    color: '#ffcc00'                         # Flash color (default: preset color)
    intensity: 0.8                           # Flash intensity 0-1 (default: 0.6)
  max_highlight_cells: <number>              # Max cells to animate per update (default: 50)

# ==============================================================================
# CARD METADATA (Optional)
# ==============================================================================

id: <string>                                 # Card identifier for rules/animations
tags: [<string>, ...]                        # Tags for rules engine
```

---

## Hierarchical Styling Examples

### Grid-Wide Styling

Apply styles to all cells in the grid:

```yaml
type: custom:lcards-data-grid
data_mode: random
style:
  color: colors.grid.cellText
  background: 'alpha(colors.grid.cellBackground, 0.05)'
  font_size: 20
  font_weight: 500
  padding: 10px
  border_width: 1
  border_color: colors.grid.border
  border_style: solid
grid:
  grid-template-columns: repeat(12, 1fr)
  gap: 8px
```

### Column-Level Styling (Spreadsheet Mode)

Override styles for specific columns:

```yaml
type: custom:lcards-data-grid
data_mode: datasource
layout: spreadsheet

columns:
  - header: Status
    width: 100
    align: center
    style:
      color: colors.lcars.orange
      font_weight: 700
      background: 'alpha(colors.lcars.orange, 0.1)'

  - header: Location
    width: 140
    align: left
    style:
      color: colors.lcars.blue
      font_weight: 500

  - header: Value
    width: 80
    align: right
    # No style override - uses grid-wide defaults
```

### Row-Level Styling (Template Mode)

Style entire rows or specific cells:

```yaml
type: custom:lcards-data-grid
data_mode: template

rows:
  # Row 1: Header row with custom styling
  - values: ['Location', 'Status', 'Alert']
    style:
      background: colors.grid.headerBackground
      color: colors.grid.headerText
      font_weight: 700
      text_transform: uppercase
      border_bottom_width: 2
      border_bottom_color: colors.grid.divider

  # Row 2: Normal row
  - values: ['Deck 1', 'ACTIVE', 'NONE']

  # Row 3: Alert row with red styling
  - values: ['Deck 2', 'WARNING', 'CRITICAL']
    style:
      background: 'alpha(colors.grid.error, 0.2)'
      color: colors.grid.error
      font_weight: 600
```

### Cell-Level Styling (Template Mode)

Fine-grained control over individual cells:

```yaml
type: custom:lcards-data-grid
data_mode: template

style:
  color: colors.grid.cellText
  font_size: 16

rows:
  - values: ['System', 'Status', 'Priority']
    cellStyles:
      - color: colors.lcars.blue          # First cell: blue
        font_weight: 700
      - color: colors.lcars.orange        # Second cell: orange
        font_weight: 700
      - color: colors.lcars.red           # Third cell: red
        font_weight: 700

  - values: ['Shields', 'ONLINE', 'HIGH']
    cellStyles:
      - null                              # Use grid defaults
      - color: colors.grid.success        # Green for online
        font_weight: 600
      - color: colors.grid.error          # Red for high priority
        font_weight: 600
```

### Cell-Level Styling (Spreadsheet Mode)

Style specific cells based on data source:

```yaml
type: custom:lcards-data-grid
data_mode: datasource
layout: spreadsheet

columns:
  - header: Location
    width: 140
  - header: Temperature
    width: 100
  - header: Status
    width: 100

rows:
  - sources:
      # Location cell
      - column: 0
        type: static
        value: 'Bridge'

      # Temperature cell
      - column: 1
        type: datasource
        source: sensor.bridge_temp
        format: '{value}°C'
        style:
          color: colors.lcars.blue

      # Status cell with conditional styling
      - column: 2
        type: static
        value: 'ALERT'
        style:
          color: colors.grid.error
          font_weight: 900
          background: 'alpha(colors.grid.error, 0.2)'
          border_width: 2
          border_color: colors.grid.error
          border_style: solid
```

### CSS Grid Advanced Examples

Use any CSS Grid property:

```yaml
# Grid with named areas
grid:
  grid-template-columns: 1fr 2fr 1fr
  grid-template-rows: auto auto
  grid-template-areas: |
    "header header header"
    "sidebar content aside"
  gap: 12px

# Grid with minmax columns
grid:
  grid-template-columns: minmax(100px, 1fr) repeat(3, 1fr) minmax(150px, 1fr)
  grid-auto-rows: 50px
  gap: 8px

# Grid with dense packing
grid:
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr))
  grid-auto-flow: dense
  gap: 4px
```

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

## Theme Token Reference

### Grid-Specific Color Tokens

All grid colors can be referenced via theme tokens. Default values shown for Classic LCARS theme:

```yaml
# Cell Colors
colors.grid.cellText: '#99ccff'              # Default cell text color
colors.grid.cellBackground: 'transparent'    # Default cell background
colors.grid.cellHighlight: 'rgba(255, 153, 0, 0.3)'  # Change highlight color

# Header Colors (spreadsheet mode)
colors.grid.headerText: '#def'               # Header text color
colors.grid.headerBackground: '#1a1a1a'      # Header background color

# Row Alternates
colors.grid.rowAlt: 'rgba(255, 255, 255, 0.05)'  # Alternate row background

# Borders/Dividers
colors.grid.divider: '#333'                  # Default divider/border color
colors.grid.border: '#555'                   # Border color

# Cascade Animation Colors
colors.grid.cascadeStart: '#99ccff'          # Cascade start color
colors.grid.cascadeMid: '#4466aa'            # Cascade middle color
colors.grid.cascadeEnd: '#aaccff'            # Cascade end color

# State Colors
colors.grid.error: '#ff0000'                 # Error state color
colors.grid.warning: '#ff9900'               # Warning state color
colors.grid.success: '#00ff00'               # Success state color
```

### Generic Color Tokens

These are available across all LCARdS components:

```yaml
colors.text.primary: '#ffffff'               # Primary text color
colors.text.secondary: '#999999'             # Secondary text color
colors.text.header: '#def'                   # Header text color
colors.background.header: '#1a1a1a'          # Header background
colors.background.surface: 'transparent'     # Surface background
colors.divider: '#333'                       # Generic divider color
```

### Using Theme Tokens

Reference tokens in your configuration:

```yaml
# Direct token reference
style:
  color: colors.grid.cellText
  background: colors.grid.cellBackground

# Computed colors (using token functions)
style:
  color: 'alpha(colors.grid.cellText, 0.8)'
  background: 'darken(colors.grid.headerBackground, 0.2)'
```

---

## CSS Grid Support & Limitations

### ✅ Fully Supported CSS Grid Features

The following CSS Grid properties pass through directly to the browser and work as expected:

- **Track Sizing:** `grid-template-columns`, `grid-template-rows`
  - Supports `repeat()`, `minmax()`, `fr` units, fixed sizes, `auto`
  - Parses and respects for grid dimensions

- **Gap Control:** `gap`, `row-gap`, `column-gap`
  - Use either unified `gap` OR separate `row-gap`/`column-gap`
  - Don't specify both (separate gaps take precedence)

- **Auto-Placement:** `grid-auto-flow` (row, column, dense)

- **Item Alignment:** `justify-items`, `align-items`

- **Container Alignment:** `justify-content`, `align-content`

- **Implicit Grid:** `grid-auto-columns`, `grid-auto-rows`

### ❌ Unsupported CSS Grid Features

The following features are **not supported** due to the 2D array data model (`_gridData[row][col]`):

- **Cell Spanning:** `grid-column`, `grid-row`, `grid-column-start/end`, `grid-row-start/end`
  - The card uses a strict 2D array where each cell occupies exactly one grid position
  - Spanning would require cells to occupy multiple positions, breaking the array model

- **Named Grid Areas:** `grid-template-areas` with `grid-area` placement
  - While `grid-template-areas` passes through to CSS, cells cannot be assigned to named areas
  - Each cell is positioned by its row/column index in the data array

- **Explicit Cell Positioning:** Direct `grid-column: 2 / 4` or `grid-row: 1 / 3` on cells
  - Cell positions are determined by array indices, not CSS properties

**Architectural Note:** These limitations are fundamental to the data model. Supporting spanning or explicit positioning would require a complete rewrite from a 2D array to a sparse grid structure with explicit cell placement. The current model prioritizes simplicity, performance, and compatibility with the three data modes (random, template, datasource).

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
- 5-level style hierarchy with caching

### Performance Characteristics

**Tested Configuration:**
- Grid Size: 20×20 (400 cells)
- Animation: Cascade with change detection
- Refresh: Every 10 seconds
- Result: Smooth performance, stable rendering

**Recommendations:**
- Keep grids under 500 cells for optimal performance
- Use `max_highlight_cells` to limit change animations
- Consider disabling change detection for very large grids with frequent updates

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
- **Examples:** See `doc/examples/data-grid-*.yaml` for comprehensive examples

---

[← Back to Cards](./README.md) | [User Guide →](../README.md)
