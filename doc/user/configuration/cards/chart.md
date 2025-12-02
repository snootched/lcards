# Simple Chart Card - User Guide

> **Powerful standalone charting with 15+ chart types**
> Create interactive, real-time charts using ApexCharts library without requiring MSD.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Data Source Configuration](#data-source-configuration)
4. [Chart Types](#chart-types)
5. [Multi-Series Charts](#multi-series-charts)
6. [Styling Guide](#styling-guide)
7. [Theme Integration](#theme-integration)
8. [Animation Presets](#animation-presets)
9. [Advanced Features](#advanced-features)
10. [Complete Examples](#complete-examples)
11. [Migration from MSD](#migration-from-msd)
12. [Troubleshooting](#troubleshooting)

---

## Overview

The **Simple Chart Card** is a standalone card that provides powerful charting capabilities using the ApexCharts library, with full integration into LCARdS theme and data systems.

### Key Features

✅ **15+ chart types** - Line, area, bar, column, pie, scatter, heatmap, radar, and more
✅ **Real-time updates** - Live data from Home Assistant entities
✅ **Multi-series support** - Multiple data sources on one chart
✅ **Advanced data sources** - Inline DataSource configuration with history preload, throttling, coalescing
✅ **50+ style properties** - Complete control over colors, markers, grid, axes, typography
✅ **Theme integration** - LCARdS theme tokens and HA CSS variables
✅ **Animation presets** - LCARS-appropriate motion profiles
✅ **Performance optimized** - Data windowing and efficient updates
✅ **Standalone** - Works without MSD (~8KB smaller bundle)

### When to Use Simple Chart

- **Time series monitoring** - Temperature, humidity, power over time
- **Comparisons** - Bar charts for comparing values
- **Distributions** - Pie/donut charts for proportions
- **Multi-sensor tracking** - Indoor vs outdoor temperature
- **Historical analysis** - Preload hours of data for trends
- **Custom dashboards** - Standalone charts in Lovelace views

---

## Quick Start

### Minimal Configuration

The absolute minimum needed for a chart:

```yaml
type: custom:lcards-chart
source: sensor.temperature
chart_type: line
height: 300
```

**Result:** A simple line chart showing temperature data with automatic DataSource creation.

### With Basic Styling

Add colors and customize appearance:

```yaml
type: custom:lcards-chart
source: sensor.temperature
chart_type: area
height: 300
style:
  colors: ["#FF9900"]
  fill_opacity: 0.3
  curve: smooth
```

---

## Data Source Configuration

SimpleChart offers three levels of data source configuration, from simple to advanced.

### Level 1: Simple Entity Reference

Auto-creates DataSource with default settings (1 hour window, no history preload):

```yaml
type: custom:lcards-chart
source: sensor.temperature        # Single entity
chart_type: line
height: 300
```

**With attribute:**
```yaml
source: weather.home
attribute: temperature           # Track specific attribute
```

### Level 2: Multiple Sources

Auto-creates multiple DataSources:

```yaml
type: custom:lcards-chart
sources:
  - sensor.indoor_temperature
  - sensor.outdoor_temperature
series_names: ["Indoor", "Outdoor"]  # Custom legend names
chart_type: line
height: 300
show_legend: true
style:
  colors: ["#FF9900", "#99CCFF"]
```

### Level 3: Advanced DataSource Configuration

**NEW in v1.16!** Define advanced DataSource settings inline:

```yaml
type: custom:lcards-chart
data_sources:
  temperature:
    entity: sensor.temperature
    window_seconds: 7200           # 2 hour rolling window
    minEmitMs: 500                 # Throttle: minimum 500ms between updates
    coalesceMs: 200                # Coalesce: group changes within 200ms
    maxDelayMs: 1000               # Maximum delay before forced emission
    history:
      preload: true                # Preload historical data on init
      hours: 2                     # Load 2 hours of history

source: temperature                # Reference by name
chart_type: area
height: 300
```

**Multiple Advanced Sources:**
```yaml
data_sources:
  indoor_temp:
    entity: sensor.indoor_temperature
    window_seconds: 3600
    history: { preload: true, hours: 1 }

  outdoor_temp:
    entity: sensor.outdoor_temperature
    window_seconds: 3600
    history: { preload: true, hours: 1 }

sources: [indoor_temp, outdoor_temp]
series_names: ["Indoor", "Outdoor"]
chart_type: line
height: 300
show_legend: true
```

### DataSource Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `entity` | string | **required** | Entity ID to track |
| `attribute` | string | null | Entity attribute to track |
| `window_seconds` | number | 3600 | Rolling window size (seconds) |
| `minEmitMs` | number | 0 | Minimum time between emissions (throttling) |
| `coalesceMs` | number | 0 | Coalesce rapid changes within window |
| `maxDelayMs` | number | 0 | Maximum delay before forced emission |
| `history.preload` | boolean | false | Preload history on initialization |
| `history.hours` | number | 0 | Hours of history to preload |
| `history.days` | number | 0 | Days of history to preload |

**Performance Tips:**
- Use `minEmitMs` to throttle high-frequency sensors (< 100ms updates)
- Use `coalesceMs` to group rapid state changes
- Use `history.preload` for immediate chart population
- Adjust `window_seconds` based on data frequency and display needs

---

## Chart Types

SimpleChart supports all ApexCharts chart types:

### Line Charts

Best for trends over time:

```yaml
type: custom:lcards-chart
source: sensor.temperature
chart_type: line
height: 300
style:
  stroke_width: 2
  curve: smooth                   # smooth, straight, stepline
  marker_size: 4
```

### Area Charts

Best for showing volume/magnitude:

```yaml
chart_type: area
style:
  fill_opacity: 0.5
  fill_type: gradient
  curve: smooth
```

### Bar/Column Charts

Best for comparisons:

```yaml
chart_type: bar                    # Horizontal bars
# OR
chart_type: column                 # Vertical bars

style:
  fill_colors: ["#FF9900", "#FFCC00"]  # Alternating colors
```

### Scatter Plots

Best for correlations:

```yaml
chart_type: scatter
style:
  marker_size: 8
```

### Pie/Donut Charts

Best for proportions:

```yaml
chart_type: pie                    # Full circle
# OR
chart_type: donut                  # Ring shape
```

### Other Types

- `heatmap` - Heat map grid
- `radialBar` - Circular progress
- `radar` - Spider/radar chart
- `candlestick` - Financial OHLC data
- `boxPlot` - Statistical distributions
- `rangeBar` - Timeline/schedule visualization
- `treemap` - Hierarchical data

---

## Multi-Series Charts

Display multiple data sources on one chart.

### Simple Multi-Series

```yaml
type: custom:lcards-chart
sources:
  - sensor.cpu_temperature
  - sensor.gpu_temperature
series_names: ["CPU", "GPU"]
chart_type: line
height: 300
show_legend: true
style:
  colors: ["#FF9900", "#99CCFF"]
  stroke_width: 2
```

### Advanced Multi-Series with DataSource Config

```yaml
data_sources:
  cpu:
    entity: sensor.cpu_temperature
    window_seconds: 1800          # 30 min window
    minEmitMs: 250                # Throttle updates
    history: { preload: true, hours: 0.5 }

  gpu:
    entity: sensor.gpu_temperature
    window_seconds: 1800
    minEmitMs: 250
    history: { preload: true, hours: 0.5 }

sources: [cpu, gpu]
series_names: ["CPU", "GPU"]
chart_type: area
height: 300
show_legend: true
style:
  colors: ["#FF6600", "#6699FF"]
  fill_opacity: 0.3
```

**Multi-Series Notes:**
- SimpleChart waits for ALL series to have initial data before rendering
- Updates are synchronized - when any series changes, all series re-render
- Each series can have independent DataSource configuration
- Series colors are applied in order from `colors` array

---

## Styling Guide

SimpleChart provides 50+ styling properties via ApexChartsAdapter.

### Series Colors

```yaml
style:
  colors: ["#FF9900", "#FFCC00", "#99CCFF"]  # Series colors
  stroke_colors: ["#FF9900"]                  # Line/border colors
  fill_colors: ["#FF9900"]                    # Fill colors (area/bar)
```

### Stroke/Line Styling

```yaml
style:
  stroke_width: 3                   # Line width
  curve: smooth                     # smooth | straight | stepline | monotoneCubic
  stroke_dash_array: 5              # Dashed lines (0 = solid)
```

### Fill Styling (Area/Bar Charts)

```yaml
style:
  fill_type: gradient               # solid | gradient | pattern | image
  fill_opacity: 0.7                 # 0-1
  fill_gradient:
    shade: dark                     # dark | light
    type: vertical                  # horizontal | vertical | diagonal1 | diagonal2
    shadeIntensity: 0.5
    opacityFrom: 0.9
    opacityTo: 0.3
```

### Grid Styling

```yaml
style:
  show_grid: true
  grid_color: "rgba(255, 255, 255, 0.1)"
  grid_opacity: 0.3
  grid_stroke_dash_array: 4        # Dashed grid
  grid_row_colors:                 # Alternating row backgrounds
    - "transparent"
    - "rgba(255, 255, 255, 0.05)"
  grid_column_colors:              # Alternating column backgrounds
    - "transparent"
    - "rgba(255, 255, 255, 0.03)"
```

### Axes Styling

```yaml
style:
  axis_color: "#FFFFFF"            # Unified axis label color
  xaxis_color: "#FFCC00"           # X-axis specific
  yaxis_color: "#FF9900"           # Y-axis specific
  axis_border_color: "#666666"     # Axis lines
  axis_ticks_color: "#444444"      # Tick marks
```

### Markers (Data Points)

```yaml
style:
  marker_size: 4
  marker_colors: ["#FF9900"]
  marker_stroke_colors: ["#FFFFFF"]
  marker_stroke_width: 2
  marker_shape: circle             # circle | square | rect
```

### Legend Styling

```yaml
show_legend: true
style:
  legend_position: bottom          # top | bottom | left | right
  legend_color: "#FFFFFF"
  legend_colors: ["#FF9900", "#FFCC00"]
  legend_font_size: 14
```

### Data Labels

```yaml
style:
  show_data_labels: true
  data_label_colors: ["#FFFFFF"]
  data_label_font_size: 12
```

### Typography

```yaml
style:
  font_family: "Antonio, sans-serif"
  font_size: 12
```

### Display Options

```yaml
style:
  show_toolbar: false              # ApexCharts toolbar
  show_tooltip: true               # Hover tooltips
  tooltip_theme: dark              # light | dark
```

### Background

```yaml
style:
  background_color: "rgba(0, 0, 0, 0.3)"
  foreground_color: "#FFFFFF"
```

---

## Theme Integration

SimpleChart fully integrates with LCARdS themes and HA CSS variables.

### Using Theme Tokens

Reference LCARdS theme system:

```yaml
style:
  colors: ["theme:colors.primary.orange"]
  stroke_colors: ["theme:colors.primary.orange"]
  grid_color: "theme:colors.ui.border"
  xaxis_color: "theme:colors.accent.yellow"
  yaxis_color: "theme:colors.primary.orange"
  marker_colors: ["theme:colors.primary.orange"]
  marker_stroke_colors: ["theme:colors.ui.white"]
  background_color: "theme:colors.background.card"
```

**Common Theme Tokens:**
- `theme:colors.primary.orange` - Primary LCARS orange
- `theme:colors.accent.yellow` - Accent yellow
- `theme:colors.accent.blue` - Accent blue
- `theme:colors.ui.border` - Border color
- `theme:colors.ui.white` - White/foreground
- `theme:colors.background.card` - Card background

### Using CSS Variables

Reference HA theme variables:

```yaml
style:
  colors: ["var(--lcars-orange)"]
  grid_color: "var(--lcars-gray)"
  background_color: "var(--primary-background-color)"
```

**With Fallbacks:**
```yaml
colors: ["var(--lcars-orange, #FF9900)"]  # Falls back to #FF9900
```

### Monochrome Mode

Generate automatic color variations from single base color:

```yaml
style:
  monochrome:
    enabled: true
    color: "#FF9900"               # Base color
    shade_to: dark                 # light | dark
    shade_intensity: 0.65          # 0-1 (intensity of shading)
  fill_opacity: 0.4
```

Monochrome automatically generates:
- Darker/lighter shades for fills
- Stroke variations
- Marker colors
- Cohesive color palette from single color

### Theme Mode

```yaml
style:
  theme_mode: dark                 # light | dark
```

---

## Animation Presets

Control chart animations with LCARS-appropriate presets.

### Available Presets

```yaml
style:
  animation_preset: lcars_standard   # Choose from presets below
```

| Preset | Speed | Description | Use Case |
|--------|-------|-------------|----------|
| `lcars_standard` | 800ms | Smooth, professional | Default for most charts |
| `lcars_dramatic` | 1200ms | Cinematic entrance | Important reveals, alerts |
| `lcars_minimal` | 400ms | Quick, responsive | Secondary displays |
| `lcars_realtime` | 0ms | No entrance, fast updates | Live sensor feeds |
| `lcars_alert` | 600ms | Attention-grabbing | Critical alerts |
| `none` | 0ms | Disabled | Performance-critical |

### Animation Components

Presets control:
- **Entrance animation**: Initial chart reveal speed
- **Easing**: Motion curve (linear, easein, easeout, easeinout)
- **Gradual animation**: Stagger effect for series/data points
- **Dynamic animation**: Speed of data updates

### Examples

**Fast updates for realtime data:**
```yaml
chart_type: line
style:
  animation_preset: lcars_realtime  # No entrance delay
```

**Dramatic entrance for alerts:**
```yaml
chart_type: area
style:
  animation_preset: lcars_dramatic  # 1200ms cinematic
```

**Minimal for secondary displays:**
```yaml
chart_type: bar
style:
  animation_preset: lcars_minimal   # 400ms quick
```

---

## Advanced Features

### Raw ApexCharts Options Pass-Through

For advanced customization, pass raw ApexCharts configuration:

```yaml
style:
  colors: ["#FF9900"]              # Still use standard properties
  chart_options:                   # Raw ApexCharts options
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

**⚠️ Warning:** `chart_options` bypasses validation. Use standard `style` properties when possible.

**Merge Priority:**
1. Chart-type defaults
2. Theme tokens
3. Standard `style` properties
4. CSS variables
5. **`chart_options` (highest precedence)**

### X-Axis Configuration

```yaml
xaxis_type: datetime                # datetime | category | numeric
time_window: 3600                   # Seconds (for datetime)
max_points: 100                     # Maximum data points
```

### Size Control

```yaml
height: 400                         # Chart height in pixels
width: 800                          # Chart width (defaults to container)
```

---

## Complete Examples

### Temperature Monitor with History

```yaml
type: custom:lcards-chart
data_sources:
  temperature:
    entity: sensor.temperature
    window_seconds: 7200          # 2 hour window
    history:
      preload: true
      hours: 2                    # Show 2 hours immediately

source: temperature
chart_type: area
height: 300
style:
  colors: ["#FF9900"]
  fill_opacity: 0.3
  curve: smooth
  animation_preset: lcars_standard
  background_color: "rgba(0, 0, 0, 0.2)"
```

### Multi-Sensor Comparison

```yaml
type: custom:lcards-chart
data_sources:
  indoor:
    entity: sensor.indoor_temperature
    window_seconds: 3600
    history: { preload: true, hours: 1 }

  outdoor:
    entity: sensor.outdoor_temperature
    window_seconds: 3600
    history: { preload: true, hours: 1 }

sources: [indoor, outdoor]
series_names: ["Indoor", "Outdoor"]
chart_type: line
height: 300
show_legend: true
style:
  colors: ["#FF9900", "#99CCFF"]
  stroke_width: 2
  curve: smooth
  grid_color: "rgba(255, 255, 255, 0.1)"
  marker_colors: ["#FF9900", "#99CCFF"]
  marker_stroke_colors: ["#FFFFFF"]
  marker_stroke_width: 2
```

### Styled Bar Chart

```yaml
type: custom:lcards-chart
source: sensor.daily_energy
chart_type: bar
height: 300
style:
  colors: ["#FF9900"]
  fill_colors: ["#FF9900", "#FFCC00"]  # Alternating bars
  grid_row_colors: ["transparent", "rgba(255, 255, 255, 0.05)"]
  animation_preset: lcars_minimal
```

### Theme-Integrated Chart

```yaml
type: custom:lcards-chart
source: sensor.temperature
chart_type: line
height: 300
style:
  colors: ["theme:colors.primary.orange"]
  grid_color: "theme:colors.ui.border"
  xaxis_color: "theme:colors.accent.yellow"
  yaxis_color: "theme:colors.primary.orange"
  marker_colors: ["theme:colors.primary.orange"]
  background_color: "theme:colors.background.card"
  stroke_width: 2
```

### Advanced Multi-Series with Custom Styling

```yaml
type: custom:lcards-chart
data_sources:
  cpu_temp:
    entity: sensor.cpu_temperature
    window_seconds: 1800
    minEmitMs: 250
    coalesceMs: 100
    history:
      preload: true
      hours: 0.5

source: cpu_temp
chart_type: area
height: 400
show_legend: false
xaxis_type: datetime

style:
  # Colors
  colors: ["#FF6600"]
  stroke_colors: ["#FF6600"]
  fill_colors: ["#FF6600"]
  fill_type: gradient
  fill_opacity: 0.5

  # Grid
  show_grid: true
  grid_color: "rgba(255, 255, 255, 0.1)"
  grid_row_colors: ["transparent", "rgba(255, 255, 255, 0.03)"]

  # Axes
  xaxis_color: "#999999"
  yaxis_color: "#999999"
  axis_border_color: "#444444"

  # Markers
  marker_colors: ["#FF6600"]
  marker_stroke_colors: ["#FFFFFF"]
  marker_stroke_width: 2

  # Typography
  font_family: "Antonio, sans-serif"
  font_size: 11

  # Display
  show_toolbar: false
  show_tooltip: true
  tooltip_theme: dark
  background_color: "rgba(0, 0, 0, 0.2)"

  # Animation
  animation_preset: lcars_standard
```

---

## Migration from MSD

SimpleChart provides full feature parity with MSD ApexChartsOverlay.

### Before (MSD Overlay):

```yaml
type: custom:lcards-msd
data_sources:
  temperature:
    type: entity
    entity: sensor.temperature

overlays:
  - id: temp_chart
    type: apexchart
    source: temperature
    position: [100, 100]
    size: [300, 150]
    style:
      chart_type: line
      color: "#FF9900"
```

### After (SimpleChart):

```yaml
type: custom:lcards-chart
source: sensor.temperature
chart_type: line
height: 150
style:
  colors: ["#FF9900"]
```

### Key Changes:

1. **No MSD wrapper** - Direct card type
2. **Simplified data sources** - Auto-creation or inline config
3. **No position/size** - Standard HA card sizing
4. **Same style properties** - Full compatibility

### Migration Benefits:

- ✅ ~8KB smaller bundle (no overlay renderer)
- ✅ Standalone usage (no MSD required)
- ✅ Simpler configuration
- ✅ Better performance
- ✅ All MSD features work

---

## Troubleshooting

### Chart Not Appearing

**Check:**
1. Entity ID is valid: `source: sensor.temperature`
2. Chart type is specified: `chart_type: line`
3. Height is set: `height: 300`
4. Console for errors (F12)

### No Data Showing

**Check:**
1. Entity has history in recorder
2. Entity state is numeric
3. DataSource created successfully (check console logs)
4. Window size appropriate: `window_seconds: 3600`

### Only One Series in Multi-Series

**Fixed in v1.16.22!** Multi-series now waits for all series to have initial data.

**Check:**
1. All entities exist and have data
2. Series names match count: `series_names: ["A", "B"]`
3. Console for DataSource creation logs

### Style Properties Not Applying

**Check:**
1. Property names correct (use underscores): `stroke_width` not `strokeWidth`
2. Values valid: colors as strings, numbers as numbers
3. Theme tokens valid: `theme:colors.primary.orange`
4. CSS variables available: `var(--lcars-orange)`

### Animation Not Working

**Check:**
1. Preset name correct: `animation_preset: lcars_minimal`
2. View console for "Applied animation preset" log
3. Refresh page to see entrance animation

### Performance Issues

**Solutions:**
1. Reduce `window_seconds`: `window_seconds: 1800`
2. Limit `max_points`: `max_points: 100`
3. Use `minEmitMs` throttling: `minEmitMs: 500`
4. Disable animations: `animation_preset: none`

---

## Further Reading

- **Schema Definition:** See `doc/architecture/schemas/chart-schema-definition.md`
- **ApexCharts Docs:** https://apexcharts.com/docs/
- **DataSource System:** See LCARdS DataSource documentation
- **Theme System:** See LCARdS theme system documentation

---

**Version:** 1.16.22
**Last Updated:** November 23, 2025
