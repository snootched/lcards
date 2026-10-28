# Background Animation Preset Reference

All built-in background animation presets with full configuration options and examples. Pass preset-specific parameters via the `config` block in each effect entry.

---

## `grid`

Orthogonal grid with optional major/minor line divisions and scrolling. Drawn on the GPU where WebGL is available ([WebGL presets](../background-animations.md#webgl-presets)), the same pixels as the Canvas2D version in the flat view, which draws it without WebGL or with `renderer: canvas`. On WebGL the grid can also be seen [as a floor](#grid-views-and-camera) or drawn [on a cylinder, dome, sphere](#grid-surfaces) or [funnel](#grid-wells); `pattern: polar` draws [rings and spokes](#polar-pattern).

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
  pattern: "both"            # "both" | "horizontal" | "vertical" | "diagonal" | "hexagonal" | "dots" | "polar"
  dot_radius: 2              # Dot radius in px - only used when pattern is "dots"
  hex_radius: 40             # Hexagon size in px - only used when pattern is "hexagonal"
  spoke_count: 12            # Spokes round the centre - only used when pattern is "polar"
  polar_x: 0.5               # Polar centre across the card (0 left, 1 right)
  polar_y: 0.5               # Polar centre down the card (0 top, 1 bottom)
  show_border_lines: true    # Draw lines at canvas edges
  fill_color: ""             # Optional cell background fill (empty = transparent)
```

**Modes:**

- **Simple**: Set `major_row_interval: 0` and `major_col_interval: 0`: basic uniform grid
- **Enhanced**: Set intervals > 0: adds emphasised major lines at regular intervals
- **Spacing-based**: Use `line_spacing` for a uniform grid
- **Cell-based**: Use `num_rows` / `num_cols` for an exact cell count

`pattern: diagonal` and `pattern: hexagonal` (sized by `hex_radius`) produce the same line pattern as the dedicated [`grid-diagonal`](#grid-diagonal)/[`grid-hexagonal`](#grid-hexagonal) presets below, but combined with `grid`'s other options (`num_rows`/`num_cols`, major/minor intervals); the dedicated presets remain as convenience shorthands with their own tuned defaults, so either works. `pattern: dots` is a separate mode: a field of dots instead of lines, sized by `dot_radius`.

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

# Dot field
- preset: grid
  config:
    pattern: dots
    line_spacing: 30
    dot_radius: 2
    color: "rgba(255, 153, 102, 0.4)"

# Honeycomb, sized via the base grid preset
- preset: grid
  config:
    pattern: hexagonal
    hex_radius: 25
    major_row_interval: 3
    major_col_interval: 3
    color: "rgba(255, 153, 102, 0.3)"
    color_major: "rgba(255, 153, 102, 0.6)"
```

<EffectPlayground preset="grid" />

### Polar pattern

`pattern: polar` draws rings round a centre and spokes out from it, the charts of the Voyager astrometrics lab. It draws on both tiers (the Canvas2D grid draws it too), flat, as a floor (`view: floor` gives the tilted galaxy map) and on [curved surfaces](#grid-surfaces).

<CardGallery set="grid-polar" />

| Parameter | Default | Description |
|-----------|---------|-------------|
| `line_spacing` | 40 | px between rings |
| `spoke_count` | 12 | Spokes round the centre; 0 draws rings only |
| `polar_x`, `polar_y` | 0.5 | The centre, as fractions of the card's width and height (values outside 0 to 1 move it off the card) |
| `major_row_interval` | 0 | Every Nth ring is major |
| `major_col_interval` | 0 | Every Nth spoke is major |
| `scroll_speed_y` | 0 | Rings move outward at this many px per second (negative: inward), a sonar pulse |
| `scroll_speed_x` | 0 | Turns the spokes: `line_spacing` px of scroll turns them by one spoke |

A polar chart holds still unless a scroll speed is set. Spokes crowd toward the centre and fade to their average there; `show_border_lines` has no tiles to act on. `polar_x`, `polar_y`, `spoke_count` and the scroll speeds are [animatable](../background-animations.md#animatable-keys).

On a curved surface, polar draws rings along the axis every `line_spacing` px and exactly `spoke_count` meridians round it: a dome facing you (`surface_axis: horizontal`) becomes a polar disc, a well the classic gravity well picture.

```yaml
background_animation:
  - preset: grid
    config:
      pattern: polar
      view: floor
      camera_tilt: 30
      spoke_count: 24
      major_row_interval: 4
      major_col_interval: 6
      color: "var(--lcards-blue-light)"
      color_major: "var(--lcards-moonlight)"
```

### Grid views and camera

On WebGL the grid lies on a plane seen through a camera, so the same grid can be face-on or a perspective floor running to a horizon. These keys apply to `grid`, `grid-diagonal` and `grid-hexagonal`; without WebGL (or with `renderer: canvas`) the flat grid is drawn.

| Parameter | Default | Description |
|-----------|---------|-------------|
| `view` | `flat` | `flat`: face-on. `floor`: a perspective floor streaming toward you (scroll defaults `scroll_speed_x: 0`, `scroll_speed_y: 40`) |
| `camera_tilt` | 90 flat, 10 floor | How far the camera looks down, in degrees: 90 is straight down |
| `camera_yaw` | 0 | Turns the camera around the grid, in degrees |
| `camera_roll` | 0 | Turns the camera round its line of sight, in degrees (positive: the picture turns clockwise). With tilt and yaw the camera can look from any direction |
| `camera_distance` | 1 | Zoom: at 1, `line_spacing` is true px at the middle of the card |
| `fov` | 60 | Field of view in degrees: wider exaggerates the floor perspective |
| `scan_period` | 0 flat, 7 floor | Seconds per scan line sweep from the far side to the near side; 0 is off |
| `scan_color` | `var(--lcards-moonlight)` | Scan line colour |

Line widths are px in every view (`line_width`, `line_width_major`), and lines fade out toward the horizon where they crowd, so the distance stays calm. The camera keys are [animatable](../background-animations.md#animatable-keys): a flat grid tips into a floor when `camera_tilt` animates from 90 to 10.

```yaml
background_animation:
  - preset: grid
    config:
      view: floor
      line_spacing: 50
      line_width: 2
      major_row_interval: 4
      major_col_interval: 4
      color: "var(--lcards-orange)"
      color_major: "var(--lcards-moonlight)"
      scan_period: 5
```

### Grid surfaces

On WebGL the grid can also be drawn on a curved surface: a cylinder, a dome (a half sphere), a sphere or a [well](#grid-wells) (a funnel of any profile), the wireframes of LCARS astrometrics displays. The same keys apply to `grid`, `grid-diagonal` and `grid-hexagonal`; without WebGL (or with `renderer: canvas`) the flat grid is drawn.

<CardGallery set="grid-surfaces" />

| Parameter | Default | Description |
|-----------|---------|-------------|
| `surface` | `plane` | `plane`: the flat grid or floor (`view`). `cylinder`, `dome`, `sphere`, `well`: the grid on that surface |
| `surface_size` | 0.8 | Diameter, as a fraction of the card's shorter side (a well's rim) |
| `surface_length` | 1 | Cylinder length or well depth, as a fraction of the card's size along its axis; 0 runs a cylinder off the card and into the distance |
| `surface_axis` | `vertical` | `vertical`: an upright cylinder, a dome over the floor, a well opening upward. `horizontal`: a cylinder lying across the card, a dome or well facing you |
| `surface_side` | `outside` | `outside`: look at the surface. `inside`: look out from its centre (a tunnel down a horizontal cylinder, a planetarium inside a dome); a well is always seen from outside |
| `back_opacity` | 0.25 | Opacity of the far side seen from outside; 0 hides it |
| `surface_rotate_x` | 0 | Turns the surface itself, in degrees: positive tips its top toward you |
| `surface_rotate_y` | 0 | Positive turns its front to the right |
| `surface_rotate_z` | 0 | Positive leans its top to the left (counter-clockwise) |

How the keys you already know behave on a surface:

- **Spacing and widths:** `line_spacing` is true px at the front of the surface, and line widths are px everywhere. Lines fade where they crowd (toward the edges, the poles and into the distance).
- **Scroll is spin:** the scroll that runs round the surface turns it: `scroll_speed_x` on an upright cylinder, a dome or a sphere; `scroll_speed_y` rolls a horizontal cylinder. By default a surface spins and does not slide along its axis. A whole number of cells goes round, so there is no seam.
- **Camera:** from outside the camera circles the surface: `camera_tilt` is its height above the equator (default 15; 35 on a well), `camera_yaw` turns round it, `camera_distance` zooms, `camera_roll` turns the picture. From inside, `camera_tilt` looks up (default 0) and `camera_yaw` turns; `camera_distance` above 1 steps back along the view.
- **Orientation:** `surface_rotate_x`, `_y` and `_z` turn the surface itself (applied in that order), so it can face any way while the camera keys still circle it. All of them are animatable: a tumbling or leaning surface is one animation.
- **Edges:** the open ends of a cylinder and the base of a dome get a rim line (`line_width_major`, `color_major`) while `show_border_lines` is on.
- **Patterns:** a cylinder and a well take every pattern. On a dome or sphere, `diagonal` and `hexagonal` draw rows and columns. [`polar`](#polar-pattern) draws rings along the axis and `spoke_count` meridians.
- **Scan line:** `scan_period` sweeps along the axis, from the top (or the pole) down.

```yaml
background_animation:
  - preset: grid
    config:
      surface: cylinder
      surface_axis: horizontal
      surface_side: inside
      surface_length: 0
      line_spacing: 30
      scroll_speed_x: 60
      major_col_interval: 4
      color: "var(--lcards-orange)"
      color_major: "var(--lcards-moonlight)"
```

### Grid wells

`surface: well` is a funnel: a surface of revolution from its rim down to its bottom, of any profile. The gravity well and the wormhole of the Voyager astrometrics displays are wells. It takes every [surface key](#grid-surfaces): `surface_size` is the rim's diameter, `surface_length` the depth.

<CardGallery set="grid-wells" />

| Parameter | Default | Description |
|-----------|---------|-------------|
| `well_shape` | `trumpet` | `trumpet`: the gravity well, nearly flat at the rim and plunging to the throat. `cone`: straight sides. `bowl`: rounded toward the bottom. `wormhole`: two trumpets throat to throat (an hourglass, the throat halfway down) |
| `well_throat` | 0.15 | The throat of a `well_shape`, as a fraction of the rim (1 is a cylinder) |
| `well_profile` | | Any shape: diameters as fractions of `surface_size`, from the rim down to the bottom, evenly spaced along the depth. A smooth curve passes through every one. Replaces `well_shape` and `well_throat` |
| `well_profile_to` | | A second profile in the same form, for `well_morph` |
| `well_morph` | 0 | Blends from the well's shape (0) to `well_profile_to` (1) |
| `well_ripple` | 0 | Ripples running along the well: their height, as a fraction of the local radius (0.1 is a gentle swell) |
| `well_ripple_waves` | 3 | Ripple wavelengths along the depth |
| `well_ripple_speed` | 0.5 | Waves per second: positive runs down toward the bottom, negative up toward the rim |

Some profiles: `[1, 0.4, 0.2, 0.15]` is a trumpet, `[1, 0.25, 1]` an hourglass (a wormhole), `[1, 0.9, 0.5, 0]` a closed bowl, `[1, 1]` a straight tube (with a ripple, a pulsing conduit). The rings are evenly spaced along the surface (`line_spacing` px apart, however steep it is); a ripple passes through them, so they ride the swell.

`well_throat`, `well_morph` and the ripple keys are [animatable](../background-animations.md#animatable-keys): animate `well_morph` from 0 to 1 to reshape the funnel, or `well_throat` to let it breathe.

```yaml
background_animation:
  - preset: grid
    config:
      surface: well
      well_profile: [1.2, 0.5, 0.2, 0.12, 0.1]
      well_ripple: 0.12
      well_ripple_speed: 0.6
      pattern: polar
      spoke_count: 24
      line_spacing: 20
      camera_tilt: 40
      color: "var(--lcards-orange)"
```

A morph from a trumpet to an hourglass and back:

```yaml
type: custom:lcards-elbow
elbow:
  type: frame
background_animation:
  inset: auto
  effects:
    - preset: grid
      config:
        surface: well
        well_profile: [1, 0.35, 0.18, 0.12]
        well_profile_to: [1, 0.3, 0.15, 1]
        camera_tilt: 20
animations:
  - trigger: on_load
    target: background
    effect: 0
    preset: custom
    params:
      well_morph: [0, 1]
      duration: 5000
      ease: inOutSine
      loop: true
      alternate: true
```

The well is drawn as 64 stacked slices, each an exact hit, so its edges stay sharp at any shape. A wobble that is not round about the axis (a bulge on one side, a bending axis) is not something a well can do.

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

<EffectPlayground preset="grid-diagonal" />

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

<EffectPlayground preset="grid-hexagonal" />

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
  colors:                    # Single colour or array - each star picks one randomly
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

Stars are distributed across depth layers with farther layers moving slower. When using the zoom wrapper, each layer receives a unique seed, producing distinct star patterns per zoom level for a convincing "flying through space" effect.

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

<EffectPlayground preset="starfield" />

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
  colors:                    # Single colour or array - each cloud picks one randomly
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
| `volumetric` | `false` | Shade the clouds with drifting noise on the GPU: wisps inside and a turbulent edge, instead of smooth gradients. Needs WebGL |

Each cloud's pixel positions are displaced via 2D Perlin noise (`turbulence` controls the magnitude, `noise_scale` controls feature size) producing realistic organic cloud shapes.

**Volumetric clouds:** `volumetric: true` keeps the same clouds (same `seed`, positions, colours and drift) and shades each one with noise on the GPU ([WebGL presets](../background-animations.md#webgl-presets)): wisps that slowly evolve inside the cloud, and an edge that `turbulence` makes ragged. `noise_scale` sets the wisp size. Without WebGL, or with `renderer: canvas`, the plain clouds are drawn. It is opt-in because it changes how a nebula looks.

```yaml
- preset: nebula
  config:
    cloud_count: 5
    colors: ["var(--lcards-purple)", "var(--lcards-blue-medium)"]
    turbulence: 0.7
    volumetric: true
```

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

<EffectPlayground preset="nebula" />

---

## `contour-field`

Topographic-style banded noise field: an LCARS star-chart contour look. Paints a drifting noise field, then slices it into colour bands like a topographic map.

Drawn on the GPU where WebGL is available ([WebGL presets](../background-animations.md#webgl-presets)): the same field, pixel for pixel, with no pause when the card first draws, resizes or changes alert colours, and `noise_scale`, `num_bands` and `fill_level` become animatable. Without WebGL, or with `renderer: canvas`, the Canvas2D version draws it.

**Configuration:**

```yaml
preset: contour-field
config:
  # Noise - shapes the raw terrain
  seed: 1                    # Random seed for a reproducible field
  noise_scale: 0.005         # Smaller = a few large blobs; larger = many small ripples
  num_octaves: 2             # Layers of fine detail (1 = smooth, 8 = rough/cloud-like)

  # Contour Bands - always sliced across the full peaks-and-valleys range
  num_bands: 5               # Low = bold stepped rings; high = near-continuous gradient
  cell_size: 1                # Sample resolution - larger is blockier/cheaper

  # Fill - floods/drains a waterline over the terrain, doesn't change it
  fill_level: 0.45            # 0 = no water, full terrain visible
  fill_color: ""              # Colour for flooded rings (empty = transparent "space")

  # Colour - what fills each ring above the waterline
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
| `seed` | random | Random seed: same seed + settings always produce the same field |
| `noise_scale` | 0.005 | Noise detail: lower = larger, smoother features |
| `num_octaves` | 2 | Layers of noise detail |
| `num_bands` | 5 | Number of contour rings |
| `cell_size` | 1 | Sample resolution in px |
| `fill_level` | 0.45 | Waterline height, 0–1 |
| `fill_color` | - | Colour painted over flooded rings |
| `blend_colors` | true | Smooth band transitions vs. hard edges |
| `colors` | - | Colour stop(s) across the contour range |
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

<EffectPlayground preset="contour-field" />

---

## `cascade`

LCARS data-waterfall background. Renders cascading rows of random data cells cycling through three configurable colour stops. Replicates the classic CB-LCARS `cb-lcars-animation-cascade` decorative background.

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
    end:   "var(--lcards-moonlight, #e7f3f7)"      # Pale fade-out (90–100%)

  # Timing
  pattern: default           # default | niagara | fast | custom
  speed_multiplier: 1.0      # 2.0 = twice as fast, 0.5 = half speed
  duration: null             # ms - overrides pattern when set

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
| `colors.end` | `var(--lcards-moonlight)` | Colour at cycle end (90–100%) |
| `pattern` | `'default'` | `default` (authentic LCARS rhythm), `niagara` (uniform waterfall), `fast`, `custom` |
| `timing` | - | Custom array of `{ duration, delay }`, one per row (applied round-robin if there are more rows than entries), used when `pattern: custom`. **`duration` is milliseconds, `delay` is seconds**, easy to mix up since only one of the two is ms. |
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
      end: "var(--lcards-moonlight)"
    opacity: 0.7

# Cascade behind a grid overlay
- preset: cascade
  config:
    format: hex
    pattern: default
    colors:
      start: "var(--lcars-blue, #2266ff)"
      text: "var(--lcards-blue-darkest, #112244)"
      end: "var(--lcards-moonlight, #e7f3f7)"
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

# Custom per-row timing - duration is ms, delay is seconds
- preset: cascade
  config:
    format: digit
    pattern: custom
    timing:
      - { duration: 1500, delay: 0.1 }
      - { duration: 2200, delay: 0.3 }
      - { duration: 900,  delay: 0.05 }
    colors:
      start: "var(--lcars-blue)"
      text: "var(--lcards-blue-darkest)"
      end: "var(--lcards-moonlight)"
    opacity: 0.6
```

> Use `opacity: 0.4–0.7` so card content remains readable. Combine with `grid` or `starfield` for layered depth.

<EffectPlayground preset="cascade" />

---

## `level`

Animated tank/gauge-style fill bar: colour gradient, dual overlapping waves, sloshing physics, and an edge glow.

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
| `color_b` | - | Gradient end colour |
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

<EffectPlayground preset="level" />

---

## Texture Presets

`fluid`, `plasma`, `flow`, `shimmer`, and `scanlines` are texture generators sharing a small, near-identical config shape: a colour (or two), a couple of shape parameters, and `opacity`. Documented together here rather than as five separate essays.

`fluid` and `plasma` are drawn on the GPU where WebGL is available ([WebGL presets](../background-animations.md#webgl-presets)): the same field as the Canvas2D version, without its pause on first draw, resize and alert colour changes, and with `base_frequency` and the colours animatable. Without WebGL, or with `renderer: canvas`, the Canvas2D version draws them.

### `fluid`

Swirling noise field: organic, continuously morphing colour wash.

```yaml
preset: fluid
config:
  color: "rgba(100,180,255,0.8)"
  base_frequency: 0.010    # Noise detail - lower = larger features
  num_octaves: 4           # Layers of noise detail
  scroll_speed_x: 7
  scroll_speed_y: 10
  opacity: 1
```

<EffectPlayground preset="fluid" />

### `plasma`

Two-colour plasma bands: a vivid, classic alternating colour field.

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

<EffectPlayground preset="plasma" />

### `flow`

Directional streaming streaks: energy conduits / data-stream look.

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

<EffectPlayground preset="flow" />

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

<EffectPlayground preset="shimmer" />

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

**Example, layered texture stack:**

```yaml
- preset: fluid
  config:
    color: "rgba(100,180,255,0.6)"
- preset: scanlines
  config:
    color: "rgba(0,0,0,0.15)"
```

<EffectPlayground preset="scanlines" />

---

## `image`

User-supplied image rendered as a full-bleed canvas background behind the card SVG. Drawn at `z-index: -1` and composited with any other effects in the stack.

> **Correction:** every example on this page previously used `url:` as the config key; that never worked. `ImageEffect` (and the real editor UI) only ever read/write `source:`. Fixed below.

The `source` field supports all LCARdS template syntaxes: `{entity.attributes.entity_picture}`, `[[[JS]]]`, etc. Templates are evaluated on every HASS update, so the image automatically follows entity attribute changes.

**Configuration:**

```yaml
preset: image
config:
  source: '/local/images/bedroom.jpg'  # Required
  size: 'cover'                      # 'cover' | 'contain' | 'fill' | '<n>px'
  position: 'center'                 # CSS background-position string
  opacity: 1                         # Composite opacity (0–1)
  repeat: false                      # Tile the image instead of fitting it
```

| Config key | Default | Description |
|---|---|---|
| `source` | `''` | `/local/` path, `https://` URL, `builtin:<key>`, `media-source://…` content ID (Home Assistant media library item), or a template string |
| `size` | `'cover'` | `cover`: fill (may crop) · `contain`: fit (may letterbox) · `fill`: stretch · `<n>px`: explicit width in px, height scales to match the image's aspect ratio |
| `position` | `'center'` | CSS `background-position`: keywords (`top left`) or percentages (`50% 0%`) |
| `opacity` | `1` | Layer opacity. Use with other stacked effects for blending. |
| `repeat` | `false` | Tile the image: useful for textures or patterns |

**Examples:**

```yaml alternatives
# Room area card
background_animation:
  effects:
    - preset: image
      config:
        source: '/local/images/Areas/Bedroom.jpg'
        size: cover
        opacity: 0.85

# Live entity thumbnail (camera / media player)
background_animation:
  effects:
    - preset: image
      config:
        source: '{entity.attributes.entity_picture}'
        size: cover

# Image + grid overlay
background_animation:
  effects:
    - preset: image
      config:
        source: '/local/backgrounds/lcars-panel.jpg'
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
        source: 'builtin:bedroom'
        size: cover
        opacity: 0.8

# Image picked from the Home Assistant Media Library
background_animation:
  effects:
    - preset: image
      config:
        source: 'media-source://media_source/local/bedroom.jpg'
        size: cover
        opacity: 0.8
```

::: info SVG files
`.svg` files work as image sources; they load via an `<img>` element and paint into Canvas2D. SVG files must be self-contained (no external resource references). Files without explicit `width`/`height` attributes are rendered at canvas size automatically.
:::

::: info Home Assistant Media Library
The editor's "Image Source" field offers a **Browse Home Assistant Media** mode that opens Home Assistant's native media browser (browse or upload) and stores the picked item's `media_content_id` as `source`. This is resolved to a real URL at render time via `AssetManager.resolveMediaSourceUrl()`, cached for 15 minutes since resolved URLs may carry an expiring signed token. See [Asset Manager](../../../architecture/subsystems/asset-manager.md).
:::

No live demo here: a meaningful preview needs a real image, and there's no built-in asset that resolves outside a full Home Assistant + LCARdS runtime (the demos on this page only load the renderer itself, not the full asset-manager pack system `builtin:`/media-library references depend on).

::: warning HTTP URLs
Using an `http://` URL on an HTTPS dashboard is blocked by the browser's mixed-content policy. Use `/local/` paths or `https://` URLs instead. The editor shows a warning when an HTTP URL is detected.
:::

---

## `solid`

A single flat colour, filling the whole background canvas. Renders behind `base_svg`: the tint shows through any transparent regions of the SVG artwork on top, without touching the artwork itself. The cheapest, simplest preset: a single fill per frame, no procedural noise.

**Configuration:**

```yaml
preset: solid
config:
  color: "rgba(0, 0, 0, 0.4)"   # Fill colour - alpha controls how much shows through base_svg
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

<EffectPlayground preset="solid" />

---

## `warp-starfield`

Stars flying toward you in 3D, drawn with three.js (WebGL). Above `speed: 1` the stars stretch into streaks, so animating `speed` reads as going to warp. Without WebGL (or if the browser drops the WebGL context) the plain [`starfield`](#starfield) is drawn with the same config.

**Configuration:**

```yaml
preset: warp-starfield
config:
  count: 600                 # Number of stars
  min_radius: 0.5            # Smallest star size
  max_radius: 2              # Largest star size
  colors:                    # Each star takes one of them
    - "var(--lcards-moonlight)"
    - "var(--lcards-blue-lightest)"
  streak: 1                  # Streak length per unit of speed above 1 (0 = dots)
  spectrum: false            # Streaks split into colour (a Doppler shift)
  spectrum_direction: doppler # doppler (violet toward the tail) or reverse
  speed: 1                   # How fast the stars fly
  seed: 1                    # Same seed, same layout
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `count` | 600 | Number of stars |
| `min_radius` / `max_radius` | 0.5 / 2 | Star size range |
| `colors` / `color` | `var(--lcards-moonlight)` | Star colours; `color` sets one colour for every star (the key to animate). The default follows the alert palette; a fixed colour such as `#ffffff` does not |
| `streak` | 1 | How long the streaks grow per unit of speed above 1. `0` keeps dots at any speed |
| `spectrum` | `false` | Each streak splits into colour along its length, as in some TNG warp shots: a Doppler shift of the star's own colour, violet toward the tail (nearer the direction of travel) and red toward the head. White stars show the whole rainbow; a blue star streaks green to violet, its tail fading as it shifts past violet. It fades in as the dots stretch, so stars at `speed: 1` keep their colour |
| `spectrum_direction` | `doppler` | `reverse` puts violet toward the head instead |
| `speed` | 1 | Time multiplier |
| `seed` | random | Star layout |
| `camera_tilt` | 0 | Looks down (positive) or up from the direction of travel, in degrees (-40 to 40): the stars stream from a point higher or lower on the card |
| `camera_yaw` | 0 | Looks right (positive) or left of the direction of travel, in degrees (-40 to 40), as when turning at warp |
| `camera_roll` | 0 | Banks the view round its line of sight, in degrees (positive: clockwise) |
| `fov` | 70 | Field of view in degrees: wider makes a deeper tunnel of streaks |

Animatable: `speed`, `streak`, `camera_tilt`, `camera_yaw`, `camera_roll`, `fov`, `color`, `opacity` and the transform keys. The camera keys mean the same as on the [grid](#grid-views-and-camera), so either can follow an entity.

**Examples:**

```yaml
# Dense warp field, warping while the alert mode is red (with the warp spectrum)
- preset: warp-starfield
  transition: 2000
  config:
    count: 1200
    streak: 1.5
    spectrum: true
    speed: "[[[ return states['input_select.lcards_alert_mode']?.state === 'red_alert' ? 8 : 1 ]]]"

# Banking: the stars stream from left or right as a value moves
- preset: warp-starfield
  transition: 1500
  config:
    speed: 4
    camera_yaw:
      map_range:
        entity_id: input_number.lcards_test_value
        input: [0, 100]
        output: [-30, 30]
```

---

## `holo-sphere`

An LCARS planetary display: a wireframe sphere of latitude rings and meridians turning slowly on a tilted axis, its far side dimmed, with a scan band sweeping up it. Drawn with three.js where WebGL is available and on Canvas2D otherwise, with the same look (`renderer: canvas` forces the Canvas2D version).

**Configuration:**

```yaml
preset: holo-sphere
config:
  color: "var(--lcards-blue-light)"     # Wireframe
  scan_color: "var(--lcards-moonlight)" # Scan band
  rotate_speed: 1                       # Revolutions per minute
  tilt: 20                              # Degrees, north pole toward you
  latitude_lines: 7
  longitude_lines: 12
  size: 0.8                             # Diameter, fraction of the card's shorter side
  position_x: 0.5                       # 0 left, 1 right
  position_y: 0.5                       # 0 top, 1 bottom
  back_opacity: 0.2                     # Far side brightness
  line_width: 1                         # px
  scan_period: 6                        # Seconds per sweep, 0 = no band
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `color` | `var(--lcards-blue-light)` | Wireframe colour (follows the alert palette) |
| `scan_color` | `var(--lcards-moonlight)` | Scan band colour (follows the alert palette) |
| `rotate_speed` | 1 | Revolutions per minute; negative turns the other way |
| `tilt` | 20 | Axis tilt in degrees; positive leans the north pole toward you |
| `latitude_lines` | 7 | Rings between the poles |
| `longitude_lines` | 12 | Meridians around the sphere |
| `size` | 0.8 | Diameter as a fraction of the card's shorter side (above 1 overflows the card) |
| `position_x`, `position_y` | 0.5 | Centre on the card, 0 to 1 |
| `back_opacity` | 0.2 | Brightness of the far side: 0 hides it |
| `line_width` | 1 | Wireframe line width in px |
| `scan_period` | 6 | Seconds per scan sweep, including a short rest; 0 turns the band off |
| `speed` | 1 | Time multiplier for the rotation and the scan |

Animatable: `rotate_speed`, `tilt`, `size`, `position_x`, `position_y`, `back_opacity`, `line_width`, `color`, `scan_color`, `speed`, `opacity` and the transform keys. A `rotate_speed` change never jumps the rotation. A planet off to one side, spinning faster while a light is on:

```yaml
- preset: holo-sphere
  transition: 1500
  config:
    size: 1.4
    position_x: 0.85
    tilt: 15
    rotate_speed:
      map_range:
        entity_id: input_number.lcards_test_value
        input: [0, 100]
        output: [0.5, 6]
```

---

## See Also

- [Background Animations overview](../background-animations.md): schema, zoom wrapper, effect stacking, entity binding
- [Animations](../../animations.md): anime.js-powered card animations (different system)
