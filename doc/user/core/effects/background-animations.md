# Background Animations

> **Animated canvas-based backgrounds for LCARdS cards**

Background animations provide dynamic visual effects rendered on HTML5 Canvas behind card content. The system supports effect stacking, optional zoom transformations, and preset-based configuration.

---

## 🎯 Quick Start

### Basic Grid Animation

```yaml
type: custom:lcards-button
name: "Animated Button"
entity_id: light.living_room
style:
  width: 400
  height: 300
background_animation:
  - preset: grid
    config:
      line_spacing: 50
      color: "rgba(255, 153, 102, 0.4)"
```

### Grid with Zoom Effect

```yaml
background_animation:
  - preset: grid
    config:
      line_spacing: 60
      color: "rgba(102, 204, 255, 0.6)"
    zoom:
      layers: 5
      scale_from: 0.5
      scale_to: 2.0
      duration: 15
```

### Stacked Effects

```yaml
background_animation:
  - preset: grid-diagonal
    config:
      line_spacing: 80
      color: "rgba(255, 153, 102, 0.2)"
      scroll_speed_x: 30
  - preset: grid-hexagonal
    config:
      hex_radius: 40
      color: "rgba(102, 204, 255, 0.3)"
    zoom:
      layers: 3
      duration: 20
```

---

## 📋 Schema Structure

Background animations use an **array-based schema** where effects are rendered in order (first effect = bottom layer):

```yaml
background_animation:
  - preset: <preset_name>
    config:
      # Preset-specific configuration
    zoom:
      # Optional zoom wrapper
```

### Top-Level Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `preset` | string | ✅ | Preset name (see [Available Presets](#available-presets)) |
| `config` | object | ✅ | Preset-specific configuration |
| `zoom` | object | ❌ | Optional zoom wrapper configuration |

---

## 🎨 Available Presets

### `grid`

Unified configurable grid with major/minor line divisions. Supports both cell-based and spacing-based sizing.

**When to use:**
- Standard grid backgrounds
- Both simple grids and enhanced grids with major line divisions
- Scrolling grid effects

**Configuration:**

```yaml
preset: grid
config:
  # Sizing (choose one approach)
  line_spacing: 40           # Spacing-based: pixels between lines
  num_rows: 10              # Cell-based: number of rows
  num_cols: 10              # Cell-based: number of columns

  # Line Styling
  line_width: 1             # Minor line width (default: 1)
  line_width_minor: 1       # Explicit minor line width
  line_width_major: 2       # Major line width (default: 2)
  color: "rgba(255, 153, 102, 0.3)"        # Minor line color
  color_major: "rgba(255, 153, 102, 0.6)"  # Major line color (defaults to color)

  # Major Line Divisions (0 = disabled)
  major_row_interval: 5     # Major line every N rows (0 = no major lines)
  major_col_interval: 5     # Major line every N columns (0 = no major lines)

  # Scrolling
  scroll_speed_x: 20        # Horizontal scroll speed (px/sec)
  scroll_speed_y: 20        # Vertical scroll speed (px/sec)

  # Pattern
  pattern: "both"           # "both", "horizontal", "vertical"
  show_border_lines: true   # Draw lines at canvas edges
```

**Modes:**

- **Simple Mode**: Set `major_row_interval: 0` and `major_col_interval: 0` for basic grid
- **Enhanced Mode**: Set intervals > 0 to enable major line divisions
- **Spacing-based**: Use `line_spacing` for uniform grid
- **Cell-based**: Use `num_rows` and `num_cols` for exact cell count

**Example - Simple Grid:**

```yaml
- preset: grid
  config:
    line_spacing: 50
    color: "rgba(255, 153, 102, 0.3)"
    major_row_interval: 0
    major_col_interval: 0
```

**Example - Enhanced Grid with Divisions:**

```yaml
- preset: grid
  config:
    line_spacing: 40
    color: "rgba(255, 153, 102, 0.3)"
    color_major: "rgba(255, 153, 102, 0.8)"
    major_row_interval: 5
    major_col_interval: 5
    line_width: 1
    line_width_major: 2
```

---

### `grid-diagonal`

Diagonal hatch pattern at 45° angle.

**When to use:**
- Diagonal striped backgrounds
- Warning/caution visual effects
- Layered with other patterns for complexity

**Configuration:**

```yaml
preset: grid-diagonal
config:
  line_spacing: 60          # Spacing between diagonal lines
  line_width: 1             # Line width
  color: "rgba(255, 153, 102, 0.4)"
  scroll_speed_x: 30        # Horizontal scroll speed
  scroll_speed_y: 0         # Vertical scroll speed
  show_border_lines: true
```

**Example:**

```yaml
- preset: grid-diagonal
  config:
    line_spacing: 80
    line_width: 2
    color: "rgba(255, 153, 102, 0.5)"
    scroll_speed_x: 40
```

---

### `grid-hexagonal`

Honeycomb hexagonal pattern with major/minor hex support.

**When to use:**
- Honeycomb backgrounds
- Organic, sci-fi aesthetics
- Complex tessellation patterns

**Configuration:**

```yaml
preset: grid-hexagonal
config:
  hex_radius: 30            # Radius of hexagons
  line_width_minor: 1       # Minor hex line width
  line_width_major: 2       # Major hex line width
  color: "rgba(255, 153, 102, 0.3)"        # Minor hex color
  color_major: "rgba(255, 153, 102, 0.6)"  # Major hex color
  major_row_interval: 3     # Major hex every N rows (0 = disabled)
  major_col_interval: 3     # Major hex every N columns (0 = disabled)
  scroll_speed_x: 10        # Horizontal scroll speed
  scroll_speed_y: 10        # Vertical scroll speed
  show_border_lines: true
```

**Major/Minor Logic:**

Major hexagons are determined by global tile position (row, column) modulo the interval. This creates a regular pattern of emphasized hexagons across the infinite scrolling canvas.

**Example - Simple Honeycomb:**

```yaml
- preset: grid-hexagonal
  config:
    hex_radius: 40
    color: "rgba(102, 204, 255, 0.4)"
    major_row_interval: 0
    major_col_interval: 0
```

**Example - Honeycomb with Major Hexes:**

```yaml
- preset: grid-hexagonal
  config:
    hex_radius: 35
    color: "rgba(255, 153, 102, 0.3)"
    color_major: "rgba(255, 153, 102, 0.8)"
    major_row_interval: 4
    major_col_interval: 4
    line_width_minor: 1
    line_width_major: 3
```

---

### `grid-filled`

Grid with cell background fills in addition to line strokes.

**When to use:**
- Solid cell backgrounds
- Checkerboard patterns
- Color-blocked grids

**Configuration:**

```yaml
preset: grid-filled
config:
  line_spacing: 50          # Cell size
  line_width: 1             # Border line width
  color: "rgba(255, 153, 102, 0.4)"      # Line color
  fill_color: "rgba(255, 153, 102, 0.1)" # Cell background fill
  scroll_speed_x: 20
  scroll_speed_y: 20
  pattern: "both"
  show_border_lines: true
```

**Example:**

```yaml
- preset: grid-filled
  config:
    line_spacing: 60
    color: "rgba(102, 204, 255, 0.5)"
    fill_color: "rgba(102, 204, 255, 0.08)"
    line_width: 2
```

---

## 🔍 Zoom Wrapper

The zoom wrapper applies a **layered scaling effect** with opacity fades to any preset, creating a pseudo-3D depth illusion.

### How It Works

The zoom wrapper:
1. Takes any base effect (grid, diagonal, hexagonal, etc.)
2. Renders multiple scaled layers from `scale_from` to `scale_to`
3. Applies opacity fade-in and fade-out over the zoom cycle
4. Animates continuously over `duration` seconds

### Configuration

```yaml
zoom:
  layers: 5                 # Number of scaled layers (more = smoother but slower)
  scale_from: 0.5          # Starting scale (0.5 = 50% size)
  scale_to: 2.0            # Ending scale (2.0 = 200% size)
  duration: 15             # Animation duration in seconds
  opacity_fade_in: 15      # Fade-in threshold (% of duration)
  opacity_fade_out: 75     # Fade-out threshold (% of duration)
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `layers` | number | 4 | Number of scaled instances to render. More layers = smoother effect but higher CPU usage. Range: 2-10. |
| `scale_from` | number | 0.5 | Starting scale factor. 0.5 = half size, 1.0 = actual size. Range: 0.1-1.0. |
| `scale_to` | number | 2.0 | Ending scale factor. 2.0 = double size. Range: 1.0-5.0. |
| `duration` | number | 15 | Full zoom cycle duration in seconds. Range: 5-60. |
| `opacity_fade_in` | number | 15 | Percentage of duration where opacity fades in from 0 to 1. Range: 0-100. |
| `opacity_fade_out` | number | 75 | Percentage of duration where opacity starts fading out to 0. Range: 0-100. |

### Opacity Fade Logic

```
Progress 0% ──────► opacity_fade_in ──────► opacity_fade_out ──────► 100%
         fade in from 0 to 1           full opacity           fade out to 0
```

### Examples

**Subtle Zoom:**

```yaml
- preset: grid
  config:
    line_spacing: 50
    color: "rgba(255, 153, 102, 0.4)"
  zoom:
    layers: 3
    scale_from: 0.8
    scale_to: 1.5
    duration: 20
    opacity_fade_in: 10
    opacity_fade_out: 80
```

**Dramatic Zoom:**

```yaml
- preset: grid-diagonal
  config:
    line_spacing: 80
    color: "rgba(102, 204, 255, 0.6)"
  zoom:
    layers: 6
    scale_from: 0.3
    scale_to: 3.0
    duration: 10
    opacity_fade_in: 20
    opacity_fade_out: 70
```

---

## 🎭 Effect Stacking

Multiple effects can be stacked by providing an array. Effects render in order (first = bottom layer, last = top layer).

### Stacking Rules

1. **Order matters**: First effect in array renders first (bottom)
2. **Independent configuration**: Each effect has its own config and optional zoom
3. **Alpha blending**: Use RGBA colors with alpha < 1.0 for transparency
4. **Performance**: More effects = higher CPU usage, test on target hardware

### Example: Layered Grid + Hexagons

```yaml
background_animation:
  # Layer 1 (bottom): Fast scrolling diagonal grid
  - preset: grid-diagonal
    config:
      line_spacing: 100
      color: "rgba(255, 153, 102, 0.15)"
      scroll_speed_x: 50
      scroll_speed_y: 0

  # Layer 2 (middle): Slow scrolling grid
  - preset: grid
    config:
      line_spacing: 50
      color: "rgba(255, 153, 102, 0.2)"
      scroll_speed_x: 10
      scroll_speed_y: 10

  # Layer 3 (top): Zooming hexagons
  - preset: grid-hexagonal
    config:
      hex_radius: 40
      color: "rgba(102, 204, 255, 0.3)"
      scroll_speed_x: 0
      scroll_speed_y: 0
    zoom:
      layers: 4
      scale_from: 0.5
      scale_to: 2.0
      duration: 18
```

### Performance Tips

- **Limit layers**: 2-3 effects is usually sufficient
- **Use opacity**: Lower alpha values reduce visual noise
- **Disable scroll on zoom**: Set `scroll_speed_x: 0` and `scroll_speed_y: 0` when using zoom
- **Reduce zoom layers**: Use 3-4 layers instead of 6-8 for better performance
- **Test on device**: Performance varies by browser and hardware

---

## 🎨 Color Configuration

All color parameters support multiple formats:

### RGBA (Recommended)

```yaml
color: "rgba(255, 153, 102, 0.4)"  # Orange at 40% opacity
```

### Theme Variables

```yaml
color: "{theme:palette.moonlight}"
```

### Hex Colors

```yaml
color: "#FF9966"
```

### Named Colors

```yaml
color: "orange"
```

---

## 📐 Common Patterns

### LCARS Grid Background

```yaml
background_animation:
  - preset: grid
    config:
      line_spacing: 50
      color: "rgba(255, 153, 102, 0.3)"
      scroll_speed_x: 15
      scroll_speed_y: 15
```

### Honeycomb + Zoom

```yaml
background_animation:
  - preset: grid-hexagonal
    config:
      hex_radius: 35
      color: "rgba(102, 204, 255, 0.4)"
      major_row_interval: 0
      major_col_interval: 0
    zoom:
      layers: 5
      scale_from: 0.5
      scale_to: 2.0
      duration: 15
```

### Diagonal Stripes

```yaml
background_animation:
  - preset: grid-diagonal
    config:
      line_spacing: 60
      line_width: 2
      color: "rgba(255, 153, 102, 0.5)"
      scroll_speed_x: 40
      scroll_speed_y: 0
```

### Complex Layered Effect

```yaml
background_animation:
  # Base layer: filled grid
  - preset: grid-filled
    config:
      line_spacing: 80
      color: "rgba(255, 153, 102, 0.3)"
      fill_color: "rgba(255, 153, 102, 0.05)"
      scroll_speed_x: 10
      scroll_speed_y: 10

  # Mid layer: diagonal lines
  - preset: grid-diagonal
    config:
      line_spacing: 100
      color: "rgba(255, 153, 102, 0.2)"
      scroll_speed_x: 30

  # Top layer: zooming hexagons
  - preset: grid-hexagonal
    config:
      hex_radius: 40
      color: "rgba(102, 204, 255, 0.25)"
    zoom:
      layers: 4
      duration: 20
```

---

## 🔧 Troubleshooting

### Animation Not Visible

- **Check opacity**: Ensure alpha channel > 0 (e.g., `rgba(255, 153, 102, 0.4)`)
- **Check z-index**: Background renders behind card content
- **Check canvas size**: Animation respects card `width` and `height` in style

### Poor Performance

- **Reduce layers**: Use fewer effects in stack
- **Lower zoom layers**: Use 3-4 instead of 6-8
- **Increase line spacing**: Fewer lines = better performance
- **Disable unnecessary scroll**: Set speeds to 0 when not needed

### Pattern Misalignment

- **Hexagonal patterns**: Use `hex_radius` multiples for smooth tiling
- **Grid spacing**: Use consistent `line_spacing` across effects
- **Major line intervals**: Use values that divide evenly into canvas dimensions

### Colors Not Resolving

- **Theme tokens**: Verify token exists in current theme
- **RGBA format**: Use quotes around RGBA strings
- **Hex colors**: Include `#` prefix

---

## 🚀 Performance Considerations

### Canvas Rendering Optimization

- Background animations use **offscreen canvas with pattern caching**
- Patterns tile infinitely with no seams
- Major/minor line calculations use modulo arithmetic for efficiency

### Browser Compatibility

- Requires HTML5 Canvas support
- Tested on Chrome, Firefox, Safari, Edge
- Performance varies by hardware acceleration support

### Resource Usage

| Configuration | CPU Usage | Recommendation |
|--------------|-----------|----------------|
| Single effect, no zoom | Low | ✅ Use freely |
| Single effect + zoom (3-4 layers) | Medium | ✅ Good for most cards |
| 2-3 stacked effects | Medium-High | ⚠️ Test on target device |
| 3+ stacked effects + zoom | High | ❌ Avoid unless necessary |

---

## 📚 Related Documentation

- **[Pack System](../../../architecture/subsystems/pack-system.md)** - Background rendering architecture
- **[Theme System](../themes/themes.md)** - Color token system
- **[Template System](../templates/)** - Dynamic value resolution

---

*Last Updated: February 15, 2026*
