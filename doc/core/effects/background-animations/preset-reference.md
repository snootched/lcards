# Background Animation Preset Reference

All built-in background animation presets with full configuration options and examples. Pass preset-specific parameters via the `config` block in each effect entry.

---

## `grid`

Orthogonal grid with optional major/minor line divisions and scrolling.

**Configuration:**

```yaml
preset: grid
config:
  # Sizing (choose one approach)
  line_spacing: 40           # Spacing-based: pixels between lines
  num_rows: 10               # Cell-based: number of rows
  num_cols: 10               # Cell-based: number of columns

  # Line styling
  line_width: 1              # Minor line width (default: 1)
  line_width_minor: 1        # Explicit minor line width
  line_width_major: 2        # Major line width (default: 2)
  color: "rgba(255, 153, 102, 0.3)"        # Minor line colour
  color_major: "rgba(255, 153, 102, 0.6)"  # Major line colour (defaults to color)

  # Major line divisions (0 = disabled)
  major_row_interval: 5      # Major line every N rows (0 = no major lines)
  major_col_interval: 5      # Major line every N columns (0 = no major lines)

  # Scrolling
  scroll_speed_x: 20         # Horizontal scroll speed (px/sec)
  scroll_speed_y: 20         # Vertical scroll speed (px/sec)

  # Pattern
  pattern: "both"            # "both" | "horizontal" | "vertical"
  show_border_lines: true    # Draw lines at canvas edges
  fill_color: ""             # Optional cell background fill (empty = transparent)
```

**Modes:**

- **Simple**: Set `major_row_interval: 0` and `major_col_interval: 0` — basic uniform grid
- **Enhanced**: Set intervals > 0 — adds emphasised major lines at regular intervals
- **Spacing-based**: Use `line_spacing` for a uniform grid
- **Cell-based**: Use `num_rows` / `num_cols` for an exact cell count

**Examples:**

```yaml
# Simple grid
- preset: grid
  config:
    line_spacing: 50
    color: "rgba(255, 153, 102, 0.3)"
    major_row_interval: 0
    major_col_interval: 0

# Enhanced grid with major divisions
- preset: grid
  config:
    line_spacing: 40
    color: "rgba(255, 153, 102, 0.3)"
    color_major: "rgba(255, 153, 102, 0.8)"
    major_row_interval: 5
    major_col_interval: 5
    line_width: 1
    line_width_major: 2

# Filled grid
- preset: grid
  config:
    line_spacing: 60
    color: "rgba(102, 204, 255, 0.5)"
    fill_color: "rgba(102, 204, 255, 0.08)"
    line_width: 2
```

---

## `grid-diagonal`

Diagonal hatch pattern at 45°.

**Configuration:**

```yaml
preset: grid-diagonal
config:
  line_spacing: 60           # Spacing between diagonal lines
  line_width: 1              # Line width
  color: "rgba(255, 153, 102, 0.4)"
  scroll_speed_x: 30         # Horizontal scroll speed (px/sec)
  scroll_speed_y: 0          # Vertical scroll speed (px/sec)
  show_border_lines: true
  fill_color: ""             # Optional background fill (empty = transparent)
```

**Examples:**

```yaml
# Basic diagonal
- preset: grid-diagonal
  config:
    line_spacing: 80
    line_width: 2
    color: "rgba(255, 153, 102, 0.5)"
    scroll_speed_x: 40

# Diagonal with fill
- preset: grid-diagonal
  config:
    line_spacing: 60
    color: "rgba(255, 153, 102, 0.4)"
    fill_color: "rgba(255, 153, 102, 0.06)"
```

---

## `grid-hexagonal`

Honeycomb hexagonal pattern with major/minor hex support.

**Configuration:**

```yaml
preset: grid-hexagonal
config:
  hex_radius: 30             # Radius of hexagons
  line_width_minor: 1        # Minor hex line width
  line_width_major: 2        # Major hex line width
  color: "rgba(255, 153, 102, 0.3)"        # Minor hex colour
  color_major: "rgba(255, 153, 102, 0.6)"  # Major hex colour
  major_row_interval: 3      # Major hex every N rows (0 = disabled)
  major_col_interval: 3      # Major hex every N columns (0 = disabled)
  scroll_speed_x: 10         # Horizontal scroll speed (px/sec)
  scroll_speed_y: 10         # Vertical scroll speed (px/sec)
  show_border_lines: true
  fill_color: ""             # Optional cell background fill (empty = transparent)
```

Major hexagons are determined by global tile position (row, column) modulo the interval, producing a regular pattern of emphasised hexagons across the infinite scrolling canvas.

**Examples:**

```yaml
# Simple honeycomb
- preset: grid-hexagonal
  config:
    hex_radius: 40
    color: "rgba(102, 204, 255, 0.4)"
    major_row_interval: 0
    major_col_interval: 0

# Honeycomb with major hexes
- preset: grid-hexagonal
  config:
    hex_radius: 35
    color: "rgba(255, 153, 102, 0.3)"
    color_major: "rgba(255, 153, 102, 0.8)"
    major_row_interval: 4
    major_col_interval: 4
    line_width_minor: 1
    line_width_major: 3

# Filled honeycomb
- preset: grid-hexagonal
  config:
    hex_radius: 40
    color: "rgba(102, 204, 255, 0.4)"
    fill_color: "rgba(102, 204, 255, 0.07)"
    major_row_interval: 0
    major_col_interval: 0
```

---

## `starfield`

Scrolling starfield with parallax depth layers and multi-colour support.

**Configuration:**

```yaml
preset: starfield
config:
  count: 150                 # Number of stars
  min_radius: 0.5            # Minimum star radius (px)
  max_radius: 2              # Maximum star radius (px)
  min_opacity: 0.3           # Minimum star opacity (0–1)
  max_opacity: 1.0           # Maximum star opacity (0–1)
  colors:                    # Single colour or array — each star picks one randomly
    - "var(--lcards-blue-lightest)"
    - "#4455ff"
  scroll_speed_x: 30         # Horizontal scroll speed (px/sec)
  scroll_speed_y: 0          # Vertical scroll speed (px/sec)
  parallax_layers: 3         # Number of depth layers (1–5)
  depth_factor: 0.5          # Speed variance between layers (0 = uniform, 1 = max)
  seed: 1                    # Random seed for reproducible star patterns
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `count` | 150 | Total stars to generate |
| `min_radius` | 0.5 | Minimum star size in pixels |
| `max_radius` | 2 | Maximum star size in pixels |
| `min_opacity` | 0.3 | Minimum opacity (0–1) |
| `max_opacity` | 1.0 | Maximum opacity (0–1) |
| `colors` | `"#ffffff"` | Single colour or array. Supports CSS variables. |
| `scroll_speed_x` | 30 | Horizontal speed (px/sec) |
| `scroll_speed_y` | 0 | Vertical speed (px/sec) |
| `parallax_layers` | 3 | Depth layers (1–5). More layers = more depth. |
| `depth_factor` | 0.5 | Speed multiplier between layers |
| `seed` | 1 | Random seed. Each zoom layer gets an incremented seed automatically. |

Stars are distributed across depth layers with farther layers moving slower. When using the zoom wrapper, each layer receives a unique seed — producing distinct star patterns per zoom level for a convincing "flying through space" effect.

**Examples:**

```yaml
# Simple starfield
- preset: starfield
  config:
    count: 200
    colors: "var(--lcards-blue-lightest)"
    scroll_speed_x: 40

# Multi-colour with parallax
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

# Stationary starfield + zoom (recommended combination)
- preset: starfield
  config:
    count: 200
    min_radius: 0.5
    max_radius: 2
    colors:
      - "var(--lcards-blue-lightest)"
      - "#4455ff"
    scroll_speed_x: 0
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

---

## `nebula`

Layered nebula clouds with Perlin noise turbulence and organic drifting movement.

**Configuration:**

```yaml
preset: nebula
config:
  cloud_count: 4             # Number of nebula clouds (1–10)
  min_radius: 0.15           # Minimum cloud radius (0–1, fraction of canvas)
  max_radius: 0.4            # Maximum cloud radius (0–1, fraction of canvas)
  min_opacity: 0.3           # Minimum cloud opacity (0–1)
  max_opacity: 0.8           # Maximum cloud opacity (0–1)
  colors:                    # Single colour or array — each cloud picks one randomly
    - "var(--lcards-blue-medium)"
    - "var(--lcards-orange)"
    - "var(--lcards-blue-light)"
  turbulence: 0.5            # Displacement intensity (0 = none, 1 = maximum)
  noise_scale: 0.003         # Perlin noise scale (0.001–0.01; smaller = larger features)
  scroll_speed_x: 5          # Horizontal scroll speed (px/sec)
  scroll_speed_y: 5          # Vertical scroll speed (px/sec)
  seed: 1                    # Random seed for reproducible cloud patterns
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `cloud_count` | 4 | Number of clouds (1–10) |
| `min_radius` | 0.15 | Minimum radius as fraction of canvas size |
| `max_radius` | 0.4 | Maximum radius as fraction of canvas size |
| `min_opacity` | 0.3 | Minimum cloud opacity |
| `max_opacity` | 0.8 | Maximum cloud opacity |
| `colors` | `["#FF00FF"]` | Single colour or array. Supports CSS variables. |
| `turbulence` | 0.5 | Perlin noise displacement magnitude |
| `noise_scale` | 0.003 | Noise scale factor. Smaller values create larger features. |
| `scroll_speed_x` | 5 | Horizontal speed (px/sec) |
| `scroll_speed_y` | 5 | Vertical speed (px/sec) |
| `seed` | 1 | Random seed for reproducible placement |

Each cloud's pixel positions are displaced via 2D Perlin noise — `turbulence` controls the magnitude, `noise_scale` controls feature size — producing realistic organic cloud shapes.

**Examples:**

```yaml
# Simple nebula
- preset: nebula
  config:
    cloud_count: 3
    colors: "var(--lcards-purple)"
    scroll_speed_x: 10
    scroll_speed_y: 10

# Multi-colour cosmic nebula
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

# Nebula + zoom
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

> Nebula works well with slow scroll speeds (3–10 px/sec). Combine with zoom for deep cosmic depth.

---

## `contour-field`

Topographic-style banded noise field — an LCARS star-chart contour look. Paints a drifting noise field, then slices it into colour bands like a topographic map.

**Configuration:**

```yaml
preset: contour-field
config:
  # Noise — shapes the raw terrain
  seed: 1                    # Random seed for a reproducible field
  noise_scale: 0.005         # Smaller = a few large blobs; larger = many small ripples
  num_octaves: 2             # Layers of fine detail (1 = smooth, 8 = rough/cloud-like)

  # Contour Bands — always sliced across the full peaks-and-valleys range
  num_bands: 5               # Low = bold stepped rings; high = near-continuous gradient
  cell_size: 1                # Sample resolution — larger is blockier/cheaper

  # Fill — floods/drains a waterline over the terrain, doesn't change it
  fill_level: 0.45            # 0 = no water, full terrain visible
  fill_color: ""              # Colour for flooded rings (empty = transparent "space")

  # Colour — what fills each ring above the waterline
  blend_colors: true          # true = smooth fades; false = flat, hard-edged rings
  colors:                     # One colour, or several stops across the contour range
    - "alpha(#130b81, 0.08)"
    - "alpha(#130b81, 0.25)"
    - "alpha(#130b81, 0.42)"
    - "alpha(#130b81, 0.62)"
    - "alpha(#130b81, 0.80)"

  scroll_speed_x: -3          # Horizontal scroll speed (px/sec)
  scroll_speed_y: 0.45        # Vertical scroll speed (px/sec)
  opacity: 1                  # Overall effect opacity
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `seed` | random | Random seed — same seed + settings always produce the same field |
| `noise_scale` | 0.005 | Noise detail — lower = larger, smoother features |
| `num_octaves` | 2 | Layers of noise detail |
| `num_bands` | 5 | Number of contour rings |
| `cell_size` | 1 | Sample resolution in px |
| `fill_level` | 0.45 | Waterline height, 0–1 |
| `fill_color` | — | Colour painted over flooded rings |
| `blend_colors` | true | Smooth band transitions vs. hard edges |
| `colors` | — | Colour stop(s) across the contour range |
| `scroll_speed_x` | -3 | Horizontal drift speed (px/sec) |
| `scroll_speed_y` | 0.45 | Vertical drift speed (px/sec) |
| `opacity` | 1 | Overall effect opacity |

**Examples:**

```yaml
# Retro-LCARS blocky contours
- preset: contour-field
  config:
    num_bands: 6
    cell_size: 4
    colors: ["#130b81"]
    blend_colors: false

# Smooth photographic nebula look
- preset: contour-field
  config:
    num_bands: 32
    cell_size: 1
    colors:
      - "alpha(var(--lcars-blue), 0.15)"
      - "alpha(var(--lcars-blue), 0.55)"
    blend_colors: true
```

::: tip
Lower `num_bands` + `cell_size` for a blocky, retro-LCARS look; raise them for a smooth, photographic nebula look.
:::

---

## `cascade`

LCARS data-waterfall background. Renders cascading rows of random data cells cycling through three configurable colour stops — replicates the classic CB-LCARS `cb-lcars-animation-cascade` decorative background.

**Configuration:**

```yaml
preset: cascade
config:
  # Grid sizing (null = auto from canvas dimensions + font metrics)
  num_rows: null             # Rows (null = auto)
  num_cols: null             # Columns (null = auto)
  gap: 4                     # Cell gap in pixels

  # Data format
  format: hex                # hex | digit | float | alpha | mixed
  refresh_interval: 0        # ms between cell refreshes (0 = static data)

  # Typography
  font_size: 10              # Font size in pixels
  font_family: "'Antonio', monospace"

  # Colour cycling (start → text hold → end)
  colors:
    start: "var(--lcars-blue, #2266ff)"           # Bright dominant hold (0–75%)
    text:  "var(--lcards-blue-darkest, #112244)"  # Dark navy snap (75–90%)
    end:   "var(--lcars-moonlight, #e7f3f7)"      # Pale fade-out (90–100%)

  # Timing
  pattern: default           # default | niagara | fast | custom
  speed_multiplier: 1.0      # 2.0 = twice as fast, 0.5 = half speed
  duration: null             # ms — overrides pattern when set

  opacity: 1.0               # Overall opacity (0–1)
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `num_rows` | null | Rows. `null` = auto from canvas height and font size |
| `num_cols` | null | Columns. `null` = auto from canvas width and font size |
| `gap` | 4 | Pixel gap between cells |
| `format` | `'hex'` | Cell data: `hex`, `digit`, `float`, `alpha`, `mixed` |
| `refresh_interval` | 0 | Ms between data regeneration (0 = static) |
| `font_size` | 10 | Font size in pixels |
| `font_family` | `"'Antonio', monospace"` | CSS font-family |
| `colors.start` | `var(--lcars-blue)` | Colour at cycle start (hold 0–75%) |
| `colors.text` | `var(--lcards-blue-darkest)` | Colour at mid-cycle snap (75–90%) |
| `colors.end` | `var(--lcars-moonlight)` | Colour at cycle end (90–100%) |
| `pattern` | `'default'` | `default` (authentic LCARS rhythm), `niagara` (uniform waterfall), `fast`, `custom` |
| `timing` | — | Custom array of `{ duration, delay }` (used when `pattern: custom`) |
| `speed_multiplier` | 1.0 | Multiplier applied to all row durations |
| `duration` | null | Override all row durations in ms (takes precedence over pattern) |
| `opacity` | 1 | Overall effect opacity |

**Colour cycle keyframes:**

| Cycle position | Colour | Phase |
|----------------|--------|-------|
| 0%–75% | `colors.start` | Hold |
| 75%–80% | `colors.start` → `colors.text` | Fast transition |
| 80%–90% | `colors.text` | Hold |
| 90%–100% | `colors.text` → `colors.end` | Fade out (loops) |

**Timing patterns:**

| Pattern | Duration | Delay | Description |
|---------|----------|-------|-------------|
| `default` | 2–4 s (varies per row) | 0.1–0.8 s | Authentic LCARS rhythm |
| `niagara` | 2 s (uniform) | 0.1–0.8 s | Smooth waterfall |
| `fast` | 1 s (uniform) | 0–0.35 s | Rapid cycling |
| `custom` | user-defined | user-defined | Supply `timing` array |

**Examples:**

```yaml
# Basic cascade
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

# Cascade behind a grid overlay
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

# Fast cascade with live data refresh
- preset: cascade
  config:
    format: mixed
    pattern: fast
    speed_multiplier: 2.0
    refresh_interval: 2000
    font_size: 8
    opacity: 0.6
```

> Use `opacity: 0.4–0.7` so card content remains readable. Combine with `grid` or `starfield` for layered depth.

---

## `level`

Animated tank/gauge-style fill bar — colour gradient, dual overlapping waves, sloshing physics, and an edge glow.

**Configuration:**

```yaml
preset: level
config:
  color_a: "rgba(0,200,100,0.7)"    # Primary fill colour (or gradient start)
  color_b: ""                       # Gradient end colour (empty = flat fill)
  gradient_crossover: 80            # % of fill height where the gradient crosses over
  fill_pct: 50                      # Fill level, 0-100

  direction: up                     # up | down | left | right

  edge_glow: true
  edge_glow_color: "rgba(255,255,255,0.7)"
  edge_glow_width: 6

  wave_height: 4                    # Primary wave amplitude (px)
  wave_speed: 20
  wave_count: 4

  wave2_height: 0                   # Secondary wave amplitude (0 = disabled)
  wave2_count: 5
  wave2_speed: -15

  slosh_amount: 0                   # Sloshing displacement (0 = disabled)
  slosh_period: 3

  opacity: 1
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `color_a` | `rgba(0,200,100,0.7)` | Primary fill colour / gradient start |
| `color_b` | — | Gradient end colour |
| `fill_pct` | 50 | Fill level, 0–100 |
| `direction` | `up` | Fill direction |
| `edge_glow` | true | Glow along the fill edge |
| `wave_height` / `wave_speed` / `wave_count` | 4 / 20 / 4 | Primary wave shape |
| `wave2_height` / `wave2_count` / `wave2_speed` | 0 / 5 / -15 | Secondary overlapping wave |
| `slosh_amount` / `slosh_period` | 0 / 3 | Sloshing physics |
| `opacity` | 1 | Overall effect opacity |

**Examples:**

```yaml
# Simple gauge
- preset: level
  config:
    fill_pct: 65
    color_a: "var(--lcars-blue)"

# Sloshing tank with dual waves
- preset: level
  config:
    fill_pct: 40
    color_a: "rgba(0,200,100,0.7)"
    color_b: "rgba(0,120,60,0.9)"
    wave_height: 6
    wave2_height: 3
    slosh_amount: 8
    slosh_period: 2.5
```

---

## Texture Presets

`fluid`, `plasma`, `flow`, `shimmer`, and `scanlines` are one-shot Canvas2D texture generators sharing a small, near-identical config shape — a colour (or two), a couple of shape parameters, and `opacity`. Documented together here rather than as five separate essays.

### `fluid`

Swirling noise field — organic, continuously morphing colour wash.

```yaml
preset: fluid
config:
  color: "rgba(100,180,255,0.8)"
  base_frequency: 0.010    # Noise detail — lower = larger features
  num_octaves: 4           # Layers of noise detail
  scroll_speed_x: 7
  scroll_speed_y: 10
  opacity: 1
```

### `plasma`

Two-colour plasma bands — a vivid, classic alternating colour field.

```yaml
preset: plasma
config:
  color_a: "rgba(80,0,255,0.9)"
  color_b: "rgba(255,40,120,0.9)"
  base_frequency: 0.012
  scroll_speed_x: 8
  scroll_speed_y: 5
  opacity: 1
```

### `flow`

Directional streaming streaks — energy conduits / data-stream look.

```yaml
preset: flow
config:
  color: "rgba(0,200,255,0.7)"
  base_frequency: 0.012
  wave_scale: 8             # Streak waviness
  scroll_speed_x: 50
  scroll_speed_y: 0
  opacity: 1
```

### `shimmer`

A single highlight band that periodically sweeps across the canvas at an angle.

```yaml
preset: shimmer
config:
  color: "rgba(255,255,255,0.55)"
  highlight_width: 0.35     # Band width, fraction of canvas size
  speed: 2.5
  angle: 30                 # Sweep angle in degrees
  opacity: 1
```

### `scanlines`

Static CRT-style scanline overlay.

```yaml
preset: scanlines
config:
  color: "rgba(0,0,0,0.25)"
  line_spacing: 4
  line_width: 1.5
  direction: horizontal      # horizontal | vertical
  opacity: 1
```

**Example — layered texture stack:**

```yaml
- preset: fluid
  config:
    color: "rgba(100,180,255,0.6)"
- preset: scanlines
  config:
    color: "rgba(0,0,0,0.15)"
```

---

## `image`

User-supplied image rendered as a full-bleed canvas background behind the card SVG. Drawn at `z-index: -1` and composited with any other effects in the stack.

The `url` supports all LCARdS template syntaxes — `{entity.attributes.entity_picture}`, `[[[JS]]]`, etc. Templates are evaluated on every HASS update, so the image automatically follows entity attribute changes.

**Configuration:**

```yaml
preset: image
config:
  url: '/local/images/bedroom.jpg'  # Required
  size: 'cover'                      # 'cover' | 'contain' | 'fill' | '<n>px'
  position: 'center'                 # CSS background-position string
  opacity: 1                         # Composite opacity (0–1)
  repeat: false                      # Tile the image instead of fitting it
```

| Config key | Default | Description |
|---|---|---|
| `url` | `''` | `/local/` path, `https://` URL, `builtin:<key>`, `media-source://…` content ID (HA media library item), or a template string |
| `size` | `'cover'` | `cover` — fill (may crop) · `contain` — fit (may letterbox) · `fill` — stretch · `<n>px` — explicit size for the shorter axis |
| `position` | `'center'` | CSS `background-position`: keywords (`top left`) or percentages (`50% 0%`) |
| `opacity` | `1` | Layer opacity. Use with other stacked effects for blending. |
| `repeat` | `false` | Tile the image — useful for textures or patterns |

**Examples:**

```yaml alternatives
# Room area card
background_animation:
  effects:
    - preset: image
      config:
        url: '/local/images/Areas/Bedroom.jpg'
        size: cover
        opacity: 0.85

# Live entity thumbnail (camera / media player)
background_animation:
  effects:
    - preset: image
      config:
        url: '{entity.attributes.entity_picture}'
        size: cover

# Image + grid overlay
background_animation:
  effects:
    - preset: image
      config:
        url: '/local/backgrounds/lcars-panel.jpg'
        size: cover
        opacity: 0.6
    - preset: grid
      config:
        color: 'rgba(255,153,102,0.25)'
        line_spacing: 40

# Named image from Asset Library
background_animation:
  effects:
    - preset: image
      config:
        url: 'builtin:bedroom'
        size: cover
        opacity: 0.8

# Image picked from the HA Media Library
background_animation:
  effects:
    - preset: image
      config:
        url: 'media-source://media_source/local/bedroom.jpg'
        size: cover
        opacity: 0.8
```

::: info SVG files
`.svg` files work as image sources — they load via an `<img>` element and paint into Canvas2D. SVG files must be self-contained (no external resource references). Files without explicit `width`/`height` attributes are rendered at canvas size automatically.
:::

::: info HA Media Library
The editor's "Image Source" field offers a **Browse HA Media** mode that opens Home Assistant's native media browser (browse or upload) and stores the picked item's `media_content_id` as `url`. This is resolved to a real URL at render time via `AssetManager.resolveMediaSourceUrl()`, cached for 15 minutes since resolved URLs may carry an expiring signed token. See [Asset Manager](../../../architecture/subsystems/asset-manager.md).
:::

::: warning HTTP URLs
Using an `http://` URL on an HTTPS dashboard is blocked by the browser's mixed-content policy. Use `/local/` paths or `https://` URLs instead. The editor shows a warning when an HTTP URL is detected.
:::

---

## `solid`

A single flat colour, filling the whole background canvas. Renders behind `base_svg` — the tint shows through any transparent regions of the SVG artwork on top, without touching the artwork itself. The cheapest, simplest preset — a single fill per frame, no procedural noise.

**Configuration:**

```yaml
preset: solid
config:
  color: "rgba(0, 0, 0, 0.4)"   # Fill colour — alpha controls how much shows through base_svg
  opacity: 1                    # Multiplies with any alpha already in color
```

**Examples:**

```yaml
# Tint behind base_svg, base_svg's own artwork untouched
- preset: solid
  config:
    color: "rgba(180, 0, 0, 0.35)"

# Stacked under a procedural layer (array order = bottom → top)
- preset: solid
  config:
    color: "var(--lcars-blue)"
- preset: grid
  config:
    color: "rgba(255,255,255,0.15)"
```

---

## See Also

- [Background Animations overview](../background-animations.md) — schema, zoom wrapper, effect stacking, entity binding
- [Animations](../../animations.md) — anime.js-powered card animations (different system)
