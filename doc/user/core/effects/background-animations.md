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

### `starfield`

Scrolling starfield with parallax layers and multi-color support.

**When to use:**
- Space/sci-fi backgrounds
- Subtle animated depth
- Combined with zoom for dynamic star movement

**Configuration:**

```yaml
preset: starfield
config:
  count: 150                # Number of stars
  min_radius: 0.5          # Minimum star radius in pixels
  max_radius: 2            # Maximum star radius in pixels
  min_opacity: 0.3         # Minimum star opacity (0-1)
  max_opacity: 1.0         # Maximum star opacity (0-1)
  colors:                  # Single color or array of colors
    - "var(--lcards-blue-lightest)"
    - "#4455ff"
  scroll_speed_x: 30       # Horizontal scroll speed (px/sec)
  scroll_speed_y: 0        # Vertical scroll speed (px/sec)
  parallax_layers: 3       # Number of depth layers (1-5)
  depth_factor: 0.5        # Speed variance between layers (0-1)
  seed: 1                  # Random seed for star generation
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | number | 150 | Total number of stars to generate |
| `min_radius` | number | 0.5 | Minimum star size in pixels |
| `max_radius` | number | 2 | Maximum star size in pixels |
| `min_opacity` | number | 0.3 | Minimum star opacity (0-1) |
| `max_opacity` | number | 1.0 | Maximum star opacity (0-1) |
| `colors` | string \| array | "#ffffff" | Single color or array of colors. Each star randomly selects one color. Supports CSS variables. |
| `scroll_speed_x` | number | 30 | Horizontal scroll speed in pixels/second |
| `scroll_speed_y` | number | 0 | Vertical scroll speed in pixels/second |
| `parallax_layers` | number | 3 | Number of depth layers for parallax effect (1-5) |
| `depth_factor` | number | 0.5 | Speed multiplier between layers (0=all same speed, 1=max variance) |
| `seed` | number | 1 | Random seed for reproducible star patterns |

**Parallax Layers:**

Stars are distributed across multiple depth layers, with farther layers moving slower:
- Layer 0 (farthest): moves at `depth_factor` speed
- Layer N-1 (closest): moves at full speed
- Intermediate layers: interpolated speeds

**Seeded Random:**

Each starfield instance uses a seeded random number generator for reproducible patterns. When using zoom with multiple layers, each zoom layer receives a unique seed (incrementing from base seed), ensuring different star patterns per layer.

**Example - Simple Starfield:**

```yaml
- preset: starfield
  config:
    count: 200
    colors: "var(--lcards-blue-lightest)"
    scroll_speed_x: 40
```

**Example - Multi-Color Starfield:**

```yaml
- preset: starfield
  config:
    count: 250
    min_radius: 0.8
    max_radius: 2.5
    colors:
      - "var(--lcards-blue-lightest)"
      - "var(--lcards-moonlight)"
      - "#ffffff"
    parallax_layers: 4
    scroll_speed_x: 50
```

**Example - Starfield with Zoom (Recommended):**

```yaml
- preset: starfield
  config:
    count: 200
    min_radius: 0.5
    max_radius: 2
    colors:
      - "var(--lcards-blue-lightest)"
      - "#4455ff"
    scroll_speed_x: 0        # Stationary stars
    scroll_speed_y: 0
    parallax_layers: 4
  zoom:
    layers: 6
    scale_from: 0.5
    scale_to: 2.5
    duration: 15
    opacity_fade_in: 15
    opacity_fade_out: 75
```

> **💡 Tip:** Starfield works exceptionally well with zoom effects. Each zoom layer gets a unique seed, creating 6 different star patterns that zoom independently, producing a compelling "flying through space" effect.

---

### `nebula`

Layered nebula clouds with Perlin noise turbulence and organic movement.

**When to use:**
- Space/sci-fi atmospheric backgrounds
- Organic, flowing visual effects
- Colorful cosmic backgrounds

**Configuration:**

```yaml
preset: nebula
config:
  cloud_count: 4           # Number of nebula clouds (1-10)
  min_radius: 0.15         # Minimum cloud radius (0-1, fraction of canvas)
  max_radius: 0.4          # Maximum cloud radius (0-1, fraction of canvas)
  min_opacity: 0.3         # Minimum cloud opacity (0-1)
  max_opacity: 0.8         # Maximum cloud opacity (0-1)
  colors:                  # Single color or array of colors
    - "var(--lcards-blue-medium)"
    - "var(--lcards-orange)"
    - "var(--lcards-blue-light)"
  turbulence: 0.5          # Turbulence intensity (0-1)
  noise_scale: 0.003       # Perlin noise scale (0.001-0.01)
  scroll_speed_x: 5        # Horizontal scroll speed (px/sec)
  scroll_speed_y: 5        # Vertical scroll speed (px/sec)
  seed: 1                  # Random seed for cloud generation
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `cloud_count` | number | 4 | Number of nebula clouds to generate (1-10) |
| `min_radius` | number | 0.15 | Minimum cloud radius as fraction of canvas size (0-1) |
| `max_radius` | number | 0.4 | Maximum cloud radius as fraction of canvas size (0-1) |
| `min_opacity` | number | 0.3 | Minimum cloud opacity (0-1) |
| `max_opacity` | number | 0.8 | Maximum cloud opacity (0-1) |
| `colors` | string \| array | ["#FF00FF"] | Single color or array of colors. Each cloud randomly selects one color. Supports CSS variables. |
| `turbulence` | number | 0.5 | Turbulence displacement intensity (0=none, 1=maximum distortion) |
| `noise_scale` | number | 0.003 | Perlin noise scale factor. Smaller values create larger noise features. |
| `scroll_speed_x` | number | 5 | Horizontal scroll speed in pixels/second |
| `scroll_speed_y` | number | 5 | Vertical scroll speed in pixels/second |
| `seed` | number | 1 | Random seed for reproducible cloud patterns |

**Perlin Noise Turbulence:**

Nebula clouds use 2D Perlin noise to create organic, flowing patterns:
- Each pixel's position is displaced based on noise value
- `turbulence` controls displacement magnitude
- `noise_scale` controls noise feature size (smaller = larger features)
- Creates realistic cloud-like formations

**Seeded Random:**

Each nebula instance uses a seeded random number generator for reproducible cloud patterns. This ensures consistent placement and colors across sessions with the same seed.

**Example - Simple Nebula:**

```yaml
- preset: nebula
  config:
    cloud_count: 3
    colors: "var(--lcards-purple)"
    scroll_speed_x: 10
    scroll_speed_y: 10
```

**Example - Multi-Color Cosmic Nebula:**

```yaml
- preset: nebula
  config:
    cloud_count: 6
    min_radius: 0.2
    max_radius: 0.5
    min_opacity: 0.4
    max_opacity: 0.9
    colors:
      - "var(--lcards-blue-medium)"
      - "var(--lcards-orange)"
      - "var(--lcards-purple)"
      - "var(--lcards-blue-light)"
    turbulence: 0.7
    noise_scale: 0.002
    scroll_speed_x: 3
    scroll_speed_y: 3
```

**Example - Nebula with Zoom:**

```yaml
- preset: nebula
  config:
    cloud_count: 5
    colors:
      - "var(--lcards-blue-medium)"
      - "var(--lcards-orange)"
    turbulence: 0.6
    scroll_speed_x: 0
    scroll_speed_y: 0
  zoom:
    layers: 4
    scale_from: 0.6
    scale_to: 2.0
    duration: 20
    opacity_fade_in: 20
    opacity_fade_out: 70
```

> **💡 Tip:** Nebula works beautifully with slow scroll speeds (3-10 px/sec) to create a drifting cosmic effect. Combine with zoom for mesmerizing depth.

---

### `cascade`

LCARS data-waterfall colour-cycling background. Renders cascading rows of random data cells that cycle through three configurable colour stops, replicating the classic CB-LCARS `cb-lcars-animation-cascade` decorative background.

**When to use:**
- Backgrounds for elbow cards and symbiont combos without occupying the symbiont slot
- Any card where the CB-LCARS cascade decoration is desired
- Stacked behind grid or starfield effects for layered data-display aesthetics

**Configuration:**

```yaml
preset: cascade
config:
  # Grid sizing (null = auto-size from canvas dimensions + font metrics)
  num_rows: null           # Rows (omit for auto)
  num_cols: null           # Columns (omit for auto)
  gap: 4                   # Cell gap in pixels

  # Data format
  format: hex              # hex | digit | float | alpha | mixed
  refresh_interval: 0      # ms between cell data refreshes (0 = static)

  # Typography
  font_size: 10            # Font size in pixels
  font_family: "'Antonio', monospace"

  # Colour cycling (start → text hold → end)
  # Defaults match CB-LCARS: bright LCARS blue → dark navy snap → pale moonlight
  colors:
    start: "var(--lcars-blue, #2266ff)"       # Cycle start colour (bright dominant hold)
    text:  "var(--lcards-blue-darkest, #112244)"  # Mid/text snap colour (dark navy)
    end:   "var(--lcars-moonlight, #e7f3f7)"  # Cycle end colour (pale fade-out)

  # Timing
  pattern: default         # default | niagara | fast | custom
  speed_multiplier: 1.0    # 2.0 = twice as fast, 0.5 = half speed
  duration: null           # ms — override all row durations (null = use pattern)

  opacity: 1.0             # Overall opacity (0-1)
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `num_rows` | number \| null | null | Number of rows. `null` = auto-derive from canvas height and font size. |
| `num_cols` | number \| null | null | Number of columns. `null` = auto-derive from canvas width and font size. |
| `gap` | number | 4 | Pixel gap between cells. |
| `format` | string | `'hex'` | Cell data format: `hex`, `digit`, `float`, `alpha`, `mixed`. |
| `refresh_interval` | number | 0 | Milliseconds between random data regeneration (0 = static). |
| `font_size` | number | 10 | Font size in pixels. |
| `font_family` | string | `"'Antonio', monospace"` | CSS font-family string. |
| `colors.start` | string | `'var(--lcars-blue, #2266ff)'` | Colour at cycle start (hold phase, 0–75%). Supports CSS variables. |
| `colors.text` | string | `'var(--lcards-blue-darkest, #112244)'` | Colour at mid-cycle snap (dark navy, 75–90%). Supports CSS variables. |
| `colors.end` | string | `'var(--lcars-moonlight, #e7f3f7)'` | Colour at cycle end (90–100% fade). Supports CSS variables. |
| `pattern` | string | `'default'` | Timing pattern: `default` (authentic LCARS rhythm), `niagara` (uniform waterfall), `fast` (rapid cycling), `custom` (user-supplied array). |
| `timing` | array | — | Custom timing: array of `{ duration, delay }` objects (used when `pattern: custom`). |
| `speed_multiplier` | number | 1.0 | Speed multiplier applied to all row durations (2.0 = twice as fast). |
| `duration` | number \| null | null | Override all row durations in ms. Takes precedence over pattern and speed_multiplier when set. |
| `opacity` | number | 1 | Overall effect opacity (0–1). Inherited from BaseEffect. |

**Colour Cycle Keyframes:**

The colour cycle for each row follows the CB-LCARS / data-grid keyframe structure:

| Cycle position | Colour | Phase |
|----------------|--------|-------|
| 0%–75% | `colors.start` | Hold |
| 75%–80% | `colors.start` → `colors.text` | Fast fade in |
| 80%–90% | `colors.text` | Hold |
| 90%–100% | `colors.text` → `colors.end` | Fast fade out (loops) |

**Timing Patterns:**

| Pattern | Duration | Delay | Description |
|---------|----------|-------|-------------|
| `default` | 2–4 s (varies per row) | 0.1–0.8 s | Authentic LCARS rhythm from CB-LCARS |
| `niagara` | 2 s (all rows) | 0.1–0.8 s | Smooth uniform waterfall |
| `fast` | 1 s (all rows) | 0–0.35 s | Rapid cycling |
| `custom` | user-defined | user-defined | Supply `timing` array |

**Example — Basic cascade background:**

```yaml
- preset: cascade
  config:
    format: hex
    pattern: niagara
    speed_multiplier: 1.2
    colors:
      start: "var(--lcars-blue-lightest)"
      text: "var(--lcars-dark-blue)"
      end: "var(--lcars-moonlight)"
    opacity: 0.7
```

**Example — Cascade behind a grid:**

```yaml
- preset: cascade
  config:
    format: hex
    pattern: default
    colors:
      start: "var(--lcars-blue, #2266ff)"
      text: "var(--lcards-blue-darkest, #112244)"
      end: "var(--lcars-moonlight, #e7f3f7)"
    opacity: 0.5
- preset: grid
  config:
    line_spacing: 40
    color: "rgba(102, 204, 255, 0.15)"
    scroll_speed_x: 5
    scroll_speed_y: 5
    opacity: 0.4
```

**Example — Fast cascade with data refresh:**

```yaml
- preset: cascade
  config:
    format: mixed
    pattern: fast
    speed_multiplier: 2.0
    refresh_interval: 2000
    font_size: 8
    opacity: 0.6
```

> **💡 Tip:** Use `opacity: 0.4–0.7` for cascade backgrounds so card content remains readable. Combine with `grid` or `starfield` for layered depth effects.

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

## Related Documentation

- [User Docs Index](../../README.md)
- [Button Card](../../cards/button/README.md) — applies background animations to buttons
- [Animations](../animations.md) — card element animations
- [Theme System](../themes/README.md) — colour token system
- [Template System](../templates/README.md) — dynamic value resolution

---

*Last Updated: February 15, 2026*
