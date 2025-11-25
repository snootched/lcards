# Simple Chart Card - Official Schema Definition (v1.16.22)

**Date:** November 23, 2025
**Purpose:** Single source of truth for schema - update tokens, presets, code, and docs from this
**Status:** 🎯 DEFINITIVE - All implementations must match this

**Architecture:** Standalone SimpleCard with full feature parity to MSD ApexChartsOverlay
**Adapter:** Uses ApexChartsAdapter for 50+ advanced styling properties

---

## Complete YAML Schema

```yaml
type: custom:lcards-simple-chart

# ============================================================================
# DATA SOURCE CONFIGURATION
# ============================================================================

# OPTION 1: Simple entity reference (auto-creates DataSource)
source: <entity-id>                    # Single entity (e.g., 'sensor.temperature')
attribute: <attribute-name>            # Optional: entity attribute to track

# OPTION 2: Multiple sources (auto-creates DataSources)
sources:                               # Array of entity IDs
  - <entity-id-1>
  - <entity-id-2>
series_names:                          # Optional: custom names for legend
  - <name-1>
  - <name-2>

# OPTION 3: Advanced DataSource configuration (NEW in v1.16!)
data_sources:
  <source-name>:                       # Arbitrary DataSource ID
    entity: <entity-id>                # Required: entity to track
    attribute: <attribute-name>        # Optional: entity attribute
    window_seconds: <number>           # Rolling window size (default: 3600)
    minEmitMs: <number>                # Minimum time between emissions (throttling)
    coalesceMs: <number>               # Coalesce rapid changes within window
    maxDelayMs: <number>               # Maximum delay before forced emission
    history:
      preload: <boolean>               # Preload history on initialization
      hours: <number>                  # Hours of history to preload
      days: <number>                   # Days of history to preload

# Reference data_sources by name:
source: <source-name>                  # Single DataSource
# OR
sources: [<source-name-1>, <source-name-2>]  # Multiple DataSources

# ============================================================================
# CHART CONFIGURATION
# ============================================================================

chart_type: line | area | bar | column | scatter | heatmap | radialBar | pie | donut
height: <number>                       # Chart height in pixels (default: 300)
width: <number>                        # Chart width in pixels (default: container width)

# X-Axis Configuration
xaxis_type: datetime | category | numeric  # X-axis type (default: datetime)
time_window: <number>                  # Time window in seconds (for datetime)
max_points: <number>                   # Maximum data points to display

# Legend
show_legend: <boolean>                 # Show/hide legend (default: false)

# ============================================================================
# STYLING (via ApexChartsAdapter)
# ============================================================================

style:
  # ===== SERIES COLORS =====
  colors: [<color>, ...]               # Array of series colors

  # ===== STROKE/LINE =====
  stroke_width: <number>               # Line width (default: 2)
  stroke_colors: [<color>, ...]        # Stroke colors (defaults to series colors)
  curve: smooth | straight | stepline | monotoneCubic  # Line curve style

  # ===== FILL (for area/bar charts) =====
  fill_type: solid | gradient | pattern | image
  fill_opacity: <number>               # 0-1 (default: 0.9)
  fill_colors: [<color>, ...]          # Fill colors (can alternate for bars)
  fill_gradient:                       # Gradient configuration
    shade: dark | light                # Gradient shade direction
    type: horizontal | vertical | diagonal1 | diagonal2
    shadeIntensity: <number>           # 0-1
    gradientToColors: [<color>, ...]   # End colors for gradient
    inverseColors: <boolean>           # Invert gradient direction
    opacityFrom: <number>              # Starting opacity (0-1)
    opacityTo: <number>                # Ending opacity (0-1)
    stops: [<number>, ...]             # Gradient stop positions (0-100)

  # ===== GRID =====
  show_grid: <boolean>                 # Show/hide grid (default: true)
  grid_color: <color>                  # Grid line color
  grid_opacity: <number>               # Grid opacity (0-1)
  grid_stroke_dash_array: <number>     # Dashed grid lines (0 = solid)
  grid_row_colors: [<color>, ...]      # Alternating row background colors
  grid_column_colors: [<color>, ...]   # Alternating column background colors

  # ===== AXES =====
  axis_color: <color>                  # Unified axis label color
  xaxis_color: <color>                 # X-axis specific label color
  yaxis_color: <color>                 # Y-axis specific label color
  axis_border_color: <color>           # Axis border/line color
  axis_ticks_color: <color>            # Axis tick marks color

  # ===== MARKERS (data points) =====
  marker_size: <number>                # Marker size in pixels (default: 4)
  marker_colors: [<color>, ...]        # Marker fill colors
  marker_stroke_colors: [<color>, ...] # Marker border colors
  marker_stroke_width: <number>        # Marker border width
  marker_shape: circle | square | rect # Marker shape

  # ===== LEGEND =====
  legend_position: top | bottom | left | right
  legend_color: <color>                # Legend text color
  legend_colors: [<color>, ...]        # Individual legend item colors
  legend_font_size: <number>           # Legend font size

  # ===== DATA LABELS =====
  show_data_labels: <boolean>          # Show values on data points
  data_label_colors: [<color>, ...]    # Data label text colors
  data_label_font_size: <number>       # Data label font size

  # ===== THEME =====
  theme_mode: light | dark             # Chart theme mode (default: dark)
  theme_palette: <palette-name>        # ApexCharts color palette name

  # ===== MONOCHROME MODE =====
  monochrome:
    enabled: <boolean>                 # Enable monochrome color scheme
    color: <color>                     # Base color for monochrome
    shade_to: light | dark             # Shade direction
    shade_intensity: <number>          # Shading intensity (0-1, default: 0.65)

  # ===== TYPOGRAPHY =====
  font_family: <css-font-family>       # Chart font family
  font_size: <number>                  # Base font size

  # ===== DISPLAY =====
  show_toolbar: <boolean>              # Show ApexCharts toolbar (default: false)
  show_tooltip: <boolean>              # Show tooltips on hover (default: true)
  tooltip_theme: light | dark          # Tooltip theme

  # ===== BACKGROUND =====
  background_color: <color>            # Chart background (default: transparent)
  foreground_color: <color>            # Chart foreground/text color

  # ===== ANIMATIONS =====
  animation_preset: <preset-name>      # Named animation preset
  # Available presets:
  #   - lcars_standard   (800ms, smooth, gradual)
  #   - lcars_dramatic   (1200ms, cinematic entrance)
  #   - lcars_minimal    (400ms, quick and responsive)
  #   - lcars_realtime   (0ms entrance, fast updates)
  #   - lcars_alert      (600ms, attention-grabbing)
  #   - none             (disable all animations)

  # ===== ADVANCED: RAW APEXCHARTS OPTIONS =====
  chart_options:                       # Direct ApexCharts options pass-through
    # Any valid ApexCharts configuration
    # Deep-merged as HIGHEST PRECEDENCE override
    # ⚠️ Use with caution - bypasses validation
    chart:
      toolbar:
        tools:
          download: true
          selection: true
    plotOptions:
      bar:
        horizontal: true
    # ... any ApexCharts option ...

# ============================================================================
# THEME TOKEN RESOLUTION
# ============================================================================

# Colors can use:
# 1. Direct values:     "#FF9900", "rgba(255,153,0,0.5)"
# 2. CSS variables:     "var(--lcars-orange)", "var(--primary-color)"
# 3. Theme tokens:      "theme:colors.primary.orange", "theme:colors.ui.border"
#
# Theme tokens are resolved via LCARdS theme system
# CSS variables are resolved from HA/custom themes
# Invalid tokens fall back gracefully to defaults

# ============================================================================
# RULES & ANIMATIONS
# ============================================================================

rules:                                 # Optional: dynamic behavior rules
  <rule-id>:
    condition: <jinja2-template>       # Rule trigger condition
    # ... standard rules schema ...

animations:                            # Optional: anime.js animations
  <animation-id>:
    # ... standard animations schema ...

# ============================================================================
# COMPLETE EXAMPLES
# ============================================================================

# Example 1: Simple usage (auto-creates DataSource)
type: custom:lcards-simple-chart
source: sensor.temperature
chart_type: line
height: 300

# Example 2: Multi-series with custom names
type: custom:lcards-simple-chart
sources:
  - sensor.indoor_temperature
  - sensor.outdoor_temperature
series_names: ["Indoor", "Outdoor"]
chart_type: line
height: 300
show_legend: true
style:
  colors: ["#FF9900", "#99CCFF"]

# Example 3: Advanced data_sources config
type: custom:lcards-simple-chart
data_sources:
  temperature:
    entity: sensor.temperature
    window_seconds: 7200           # 2 hour window
    minEmitMs: 500                 # Throttle updates
    coalesceMs: 200                # Coalesce rapid changes
    history:
      preload: true
      hours: 2
source: temperature
chart_type: area
height: 300
style:
  colors: ["#FF9900"]
  fill_opacity: 0.3
  curve: smooth

# Example 4: Advanced styling
type: custom:lcards-simple-chart
source: sensor.temperature
chart_type: line
height: 300
style:
  # Series
  colors: ["#FF9900"]
  stroke_width: 3
  curve: smooth

  # Grid
  show_grid: true
  grid_color: "rgba(255, 255, 255, 0.1)"
  grid_row_colors: ["transparent", "rgba(255, 255, 255, 0.05)"]

  # Axes
  xaxis_color: "#FFCC00"
  yaxis_color: "#FF9900"
  axis_border_color: "#666666"

  # Markers
  marker_colors: ["#FF9900"]
  marker_stroke_colors: ["#FFFFFF"]
  marker_stroke_width: 2

  # Theme
  theme_mode: dark
  font_family: "Antonio, sans-serif"
  background_color: "rgba(0, 0, 0, 0.3)"

# Example 5: Monochrome theme
type: custom:lcards-simple-chart
source: sensor.temperature
chart_type: area
height: 300
style:
  monochrome:
    enabled: true
    color: "#FF9900"
    shade_to: dark
    shade_intensity: 0.65
  fill_opacity: 0.4

# Example 6: Animation presets
type: custom:lcards-simple-chart
source: sensor.temperature
chart_type: line
height: 300
style:
  animation_preset: lcars_minimal  # Quick 400ms animation

# Example 7: Theme tokens
type: custom:lcards-simple-chart
source: sensor.temperature
chart_type: line
height: 300
style:
  colors: ["theme:colors.primary.orange"]
  grid_color: "theme:colors.ui.border"
  xaxis_color: "theme:colors.accent.yellow"

# Example 8: Raw ApexCharts options override
type: custom:lcards-simple-chart
source: sensor.temperature
chart_type: bar
height: 300
style:
  colors: ["#FF9900"]
  chart_options:
    plotOptions:
      bar:
        horizontal: true
        distributed: true
    dataLabels:
      enabled: true
      formatter: |
        function(val) {
          return val.toFixed(1) + "°C";
        }
```

---

## Implementation Notes

### DataSource Auto-Creation

When using simple `source` or `sources`, SimpleChart automatically creates DataSources with default settings:
- `window_seconds`: 3600 (1 hour)
- `history.preload`: false
- No throttling/coalescing

For advanced control, use `data_sources` config to specify:
- Custom window sizes
- History preloading
- Update throttling
- Coalescing behavior

### Style Property Resolution Order

1. **Chart-type defaults** from ApexChartsAdapter
2. **Theme tokens** resolved recursively
3. **User style properties** from `style:` block
4. **CSS variables** resolved in final pass
5. **`chart_options` overrides** (highest precedence)

### Animation Presets

Animation presets control ApexCharts' built-in SVG animations (not anime.js):

| Preset | Speed | Use Case |
|--------|-------|----------|
| `lcars_standard` | 800ms | Default, smooth entrance |
| `lcars_dramatic` | 1200ms | Important reveals, alerts |
| `lcars_minimal` | 400ms | Secondary displays |
| `lcars_realtime` | 0ms | High-frequency sensor feeds |
| `lcars_alert` | 600ms | Attention-grabbing |
| `none` | 0ms | Disable all animations |

Presets configure:
- `speed`: Initial entrance animation duration
- `easing`: Easing function (linear, easein, easeout, easeinout)
- `animateGradually`: Stagger animation for series/points
- `dynamicAnimation`: Speed of data update animations

### Multi-Series Synchronization

For multi-series charts, SimpleChart waits for ALL series to have initial data before rendering. This prevents race conditions where only one series appears.

Update behavior: When any series data changes, ALL series are re-rendered together to maintain consistency.

### Theme Token Syntax

Theme tokens follow the pattern `theme:path.to.token`:

```yaml
colors: ["theme:colors.primary.orange"]    # → Resolved from active theme
grid_color: "theme:colors.ui.border"       # → Theme border color
xaxis_color: "theme:colors.accent.yellow"  # → Theme accent color
```

Invalid or unresolved tokens fall back to:
1. Defaults from ApexChartsAdapter
2. Chart-type-specific defaults
3. ApexCharts built-in defaults

### CSS Variable Syntax

CSS variables use standard CSS `var()` syntax:

```yaml
colors: ["var(--lcars-orange)"]           # → Resolved from HA theme
grid_color: "var(--lcars-gray)"           # → Custom CSS variable
background_color: "var(--primary-color)"  # → HA theme variable
```

Variables support fallback values:
```yaml
colors: ["var(--lcars-orange, #FF9900)"]  # → Falls back to #FF9900
```

### Chart Options Pass-Through

The `chart_options` property allows direct ApexCharts configuration:

```yaml
style:
  chart_options:
    chart:
      toolbar:
        show: true
        tools:
          download: true
    plotOptions:
      bar:
        horizontal: true
```

**⚠️ Warning:** `chart_options` bypasses validation and type checking. Use with caution. Prefer standard `style` properties when available.

Deep merge order ensures `chart_options` has highest precedence, overriding all other configurations.

---

## Architecture Integration

### SimpleCard Foundation

SimpleChart extends `LCARdSSimpleCard` base class:
- ✅ Automatic entity tracking
- ✅ Rules engine integration
- ✅ Animation system integration
- ✅ Theme system integration
- ✅ DataSource auto-creation
- ✅ `data_sources` config processing

### ApexChartsAdapter Integration

All styling passes through `ApexChartsAdapter.generateOptions()`:
- 50+ style properties
- Theme token resolution
- CSS variable resolution
- Chart-type defaults
- Monochrome mode
- Animation presets

### Singleton Architecture

SimpleChart uses core singletons:
- `DataSourceManager` for data subscriptions
- `ThemeManager` for theme token resolution
- `CoreConfigManager` for PackRegistry access (animation presets)
- `RulesManager` for dynamic behavior

Works in both standalone and MSD contexts without MSD-specific dependencies.

---

## SimpleChart Features

SimpleChart provides full chart functionality:

**Example:**
```yaml
type: custom:lcards-simple-chart
source: sensor.temperature
chart_type: line
```

All chart features available:
- ✅ All chart types
- ✅ Multi-series
- ✅ Advanced styling
- ✅ Theme integration
- ✅ Animation presets
- ✅ `chart_options` override
- ✅ `data_sources` config (inline DataSource configuration)
- ✅ Works standalone (no MSD required)

---

**Status:** Complete SimpleChart schema documentation
