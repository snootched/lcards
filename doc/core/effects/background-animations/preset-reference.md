# Background Animation Preset Reference

**Every built-in background animation preset, with its keys and an example.** Each effect in `background_animation` names a `preset` and passes that preset's own settings in its `config` block; the [Background Animations](../background-animations.md) page covers the list itself, zoom, stacking and entity binding.

- Every example here is a full card you can copy. The outline button preset has a transparent fill, so the background shows through it.
- Keys marked "from the theme" take their default from the LCARdS Default theme's tokens, so they follow your Home Assistant theme's colours.
- Every preset takes `opacity`, and every preset that moves takes `speed`, a time multiplier for the whole effect (`2` runs it twice as fast, `0` freezes it).

---

## `grid`

**`grid` draws a scrolling grid of lines, with brighter major lines every few rows and columns.** It is the base of every grid look: plain lines, a dot field, a honeycomb, polar rings, a perspective floor or a wireframe surface.

- Size the grid with `line_spacing` for even squares, or with `num_rows` and `num_cols` (both) for an exact cell count.
- With the LCARdS Default theme every third line is major; set both intervals to `0` for a plain grid.
- Where WebGL is available the grid is drawn on the GPU ([WebGL presets](../background-animations.md#webgl-presets)), the same pixels as the Canvas2D version in the flat view. On WebGL it can also be seen [as a floor](#grid-views-and-camera) or drawn [on a cylinder, dome, sphere](#grid-surfaces) or [funnel](#grid-wells); `pattern: polar` draws [rings and spokes](#polar-pattern).

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: SENSOR GRID
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: grid
    config:
      line_spacing: 30
      color: alpha(var(--lcars-orange), 0.3)
      color_major: alpha(var(--lcars-orange), 0.8)
      major_row_interval: 4
      major_col_interval: 4
      line_width_major: 2
```

A field of dots instead of lines (`pattern: dots`, sized by `dot_radius`, one dot every `line_spacing` px):

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: DOT FIELD
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: grid
    config:
      pattern: dots
      line_spacing: 24
      dot_radius: 2
      color: alpha(var(--lcars-orange), 0.5)
```

<EffectPlayground preset="grid" />

::: details More about grid
- **Patterns:** `pattern: diagonal` and `pattern: hexagonal` (sized by `hex_radius`) draw the same lines as the [`grid-diagonal`](#grid-diagonal) and [`grid-hexagonal`](#grid-hexagonal) presets, but with `grid`'s other options (`num_rows`/`num_cols`, major and minor intervals). The dedicated presets are shorthands with their own defaults, so either works.
- **Line widths:** `line_width` is another name for `line_width_minor`; when both are set, `line_width_minor` wins.
- **Major colour:** `color_major` falls back to `color` when you set only `color`, so the major lines then differ only in width.
- **Border lines:** `show_border_lines` acts on the horizontal and vertical lines; the diagonal, hexagonal, dot and polar patterns have none to drop.
- **Without the theme:** where no theme is loaded the fallbacks are `rgba(255, 153, 102, 0.3)` for `color` and `0` for the intervals.
- **Other grid looks:**

```yaml
# Plain grid: no major lines
- preset: grid
  config:
    line_spacing: 50
    major_row_interval: 0
    major_col_interval: 0

# Filled cells
- preset: grid
  config:
    line_spacing: 60
    line_width: 2
    color: alpha(var(--lcars-ice), 0.5)
    fill_color: alpha(var(--lcars-ice), 0.08)

# Honeycomb, sized through the base grid preset
- preset: grid
  config:
    pattern: hexagonal
    hex_radius: 25
    major_row_interval: 3
    major_col_interval: 3
    color: alpha(var(--lcars-orange), 0.3)
    color_major: alpha(var(--lcars-orange), 0.6)
```
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `line_spacing` | number | `40` | px between lines (between dots, or between rings on `polar`) |
| `num_rows` | integer | - | Exact number of rows, 1 to 100; with `num_cols` it replaces `line_spacing` |
| `num_cols` | integer | - | Exact number of columns, 1 to 100 |
| `line_width` | number | `1` | Minor line width in px (another name for `line_width_minor`) |
| `line_width_minor` | number | `1` | Minor line width in px |
| `line_width_major` | number | `2` | Major line width in px |
| `color` | colour | 30% of the theme's primary UI colour | Minor line colour |
| `color_major` | colour | `color`, else 60% of the theme's primary UI colour | Major line colour |
| `major_row_interval` | integer | `3` (from the theme) | A major line every N rows; `0` for none |
| `major_col_interval` | integer | `3` (from the theme) | A major line every N columns; `0` for none |
| `scroll_speed_x` | number | `20` | Horizontal scroll in px per second; `0` on a floor, a polar chart or a surface unless set (see the sections below) |
| `scroll_speed_y` | number | `20` | Vertical scroll in px per second; `40` on a floor, `0` on a polar chart or a surface unless set |
| `pattern` | string | `both` | `both`, `horizontal`, `vertical`, `diagonal`, `hexagonal`, `dots` or `polar` |
| `dot_radius` | number | `2` | Dot radius in px, for `pattern: dots` |
| `hex_radius` | number | `40` | Hexagon size in px, for `pattern: hexagonal` |
| [Polar keys](#polar-pattern) | | | `spoke_count`, `polar_x`, `polar_y`, for `pattern: polar` |
| [View and camera keys](#grid-views-and-camera) | | | `view`, `camera_tilt`, `camera_yaw`, `camera_roll`, `camera_distance`, `fov`, `scan_period`, `scan_color` |
| [Surface keys](#grid-surfaces) | | | `surface`, `surface_size`, `surface_length`, `surface_axis`, `surface_side`, `back_opacity`, `surface_rotate_x`, `surface_rotate_y`, `surface_rotate_z` |
| [Well keys](#grid-wells) | | | `well_shape`, `well_throat`, `well_profile`, `well_profile_to`, `well_morph`, `well_ripple`, `well_ripple_waves`, `well_ripple_speed` |
| `show_border_lines` | boolean | `true` | Draw the lines at the canvas edges |
| `fill_color` | colour | `transparent` | Fill behind each cell |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

### Polar pattern

**`pattern: polar` draws rings round a centre and spokes out from it, the charts of the Voyager astrometrics lab.** It draws on both tiers (the Canvas2D grid draws it too): flat, as a floor (`view: floor` gives the tilted galaxy map) and on [curved surfaces](#grid-surfaces).

- A polar chart holds still unless a scroll speed is set: `scroll_speed_y` sends rings outward like a sonar pulse, `scroll_speed_x` turns the spokes.
- Spokes crowd toward the centre and fade to their average there; `show_border_lines` has no tiles to act on.
- On a curved surface, polar draws rings along the axis every `line_spacing` px and exactly `spoke_count` meridians round it: a dome facing you (`surface_axis: horizontal`) becomes a polar disc, a well the classic gravity well picture.
- `polar_x`, `polar_y`, `spoke_count` and the scroll speeds are [animatable](./binding-and-animation#animatable-keys).

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: GALACTIC MAP
    show: true
grid_options:
  rows: 4
background_animation:
  - preset: grid
    config:
      pattern: polar
      view: floor
      camera_tilt: 30
      spoke_count: 24
      major_row_interval: 4
      major_col_interval: 6
      color: var(--lcards-blue-light)
      color_major: var(--lcards-moonlight)
```

<CardGallery set="grid-polar" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `line_spacing` | number | `40` | px between rings |
| `spoke_count` | integer | `12` | Spokes round the centre, 0 to 360; `0` draws rings only |
| `polar_x` | number | `0.5` | The centre across the card, as a fraction of its width (values outside 0 to 1 move it off the card) |
| `polar_y` | number | `0.5` | The centre down the card, as a fraction of its height |
| `major_row_interval` | integer | `3` (from the theme) | Every Nth ring is major |
| `major_col_interval` | integer | `3` (from the theme) | Every Nth spoke is major |
| `scroll_speed_y` | number | `0` | Rings move outward at this many px per second (negative: inward) |
| `scroll_speed_x` | number | `0` | Turns the spokes: `line_spacing` px of scroll turns them by one spoke |

### Grid views and camera

**On WebGL the grid lies on a plane seen through a camera, so the same grid can be face-on or a perspective floor running to a horizon.** These keys apply to `grid`, `grid-diagonal` and `grid-hexagonal`; without WebGL (or with `renderer: canvas`) the flat grid is drawn.

- `view: floor` streams the grid toward you (`scroll_speed_y` defaults to `40`, `scroll_speed_x` to `0`) and sweeps a scan line every 7 seconds.
- Line widths are px in every view (`line_width`, `line_width_major`), and lines fade out toward the horizon where they crowd, so the distance stays calm.
- The camera keys are [animatable](./binding-and-animation#animatable-keys): a flat grid tips into a floor when `camera_tilt` animates from 90 to 10.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: FLOOR GRID
    show: true
grid_options:
  rows: 4
background_animation:
  - preset: grid
    config:
      view: floor
      line_spacing: 50
      line_width: 2
      major_row_interval: 4
      major_col_interval: 4
      color: var(--lcards-orange)
      color_major: var(--lcards-moonlight)
      scan_period: 5
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `view` | string | `flat` | `flat`: face-on. `floor`: a perspective floor streaming toward you |
| `camera_tilt` | number | `90` flat, `10` floor | How far the camera looks down, 0 to 90 degrees: 90 is straight down. On a surface see [Grid surfaces](#grid-surfaces) |
| `camera_yaw` | number | `0` | Turns the camera around the grid, in degrees |
| `camera_roll` | number | `0` | Turns the camera round its line of sight, in degrees (positive: the picture turns clockwise). With tilt and yaw the camera can look from any direction |
| `camera_distance` | number | `1` | Zoom: at 1, `line_spacing` is true px at the middle of the card; 2 is twice as far away |
| `fov` | number | `60` | Field of view, 5 to 150 degrees: wider exaggerates the floor perspective |
| `scan_period` | number | `0` flat, `7` floor | Seconds per scan line sweep from the far side to the near side; `0` is off |
| `scan_color` | colour | `var(--lcards-moonlight)` | Scan line colour |

### Grid surfaces

**On WebGL the grid can also be drawn on a curved surface: a cylinder, a dome (a half sphere), a sphere or a [well](#grid-wells), the wireframes of LCARS astrometrics displays.** The same keys apply to `grid`, `grid-diagonal` and `grid-hexagonal`; without WebGL (or with `renderer: canvas`) the flat grid is drawn.

- The scroll that runs round the surface spins it: `scroll_speed_x` on an upright cylinder, a dome or a sphere, `scroll_speed_y` on a horizontal cylinder. By default a surface spins and does not slide along its axis, and a whole number of cells goes round, so there is no seam.
- From outside the camera circles the surface: `camera_tilt` is its height above the equator (default 15; 35 on a well). From inside, `camera_tilt` looks up (default 0) and `camera_distance` above 1 steps back along the view.
- `surface_rotate_x`, `_y` and `_z` turn the surface itself (applied in that order), so it can face any way while the camera keys still circle it; all of them are animatable.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: WARP TUNNEL
    show: true
grid_options:
  rows: 4
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
      color: var(--lcards-orange)
      color_major: var(--lcards-moonlight)
```

<CardGallery set="grid-surfaces" />

::: details More about surfaces
- **Spacing and widths:** `line_spacing` is true px at the front of the surface, and line widths are px everywhere. Lines fade where they crowd (toward the edges, the poles and into the distance).
- **Camera:** `camera_yaw` turns round the surface, `camera_distance` zooms and `camera_roll` turns the picture, from outside and inside alike.
- **Edges:** the open ends of a cylinder and the base of a dome get a rim line (`line_width_major`, `color_major`) while `show_border_lines` is on.
- **Patterns:** a cylinder and a well take every pattern. On a dome or sphere, `diagonal` and `hexagonal` draw rows and columns. [`polar`](#polar-pattern) draws rings along the axis and `spoke_count` meridians.
- **Scan line:** `scan_period` sweeps along the axis, from the top (or the pole) down.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `surface` | string | `plane` | `plane`: the flat grid or floor (`view`). `cylinder`, `dome`, `sphere`, `well`: the grid on that surface |
| `surface_size` | number | `0.8` | Diameter, as a fraction of the card's shorter side (a well's rim), 0.05 to 4 |
| `surface_length` | number | `1` | Cylinder length or well depth, as a fraction of the card's size along its axis; `0` runs a cylinder off the card and into the distance |
| `surface_axis` | string | `vertical` | `vertical`: an upright cylinder, a dome over the floor, a well opening upward. `horizontal`: a cylinder lying across the card, a dome or well facing you |
| `surface_side` | string | `outside` | `outside`: look at the surface. `inside`: look out from its centre (a tunnel down a horizontal cylinder, a planetarium inside a dome); a well is always seen from outside |
| `back_opacity` | number | `0.25` | Opacity of the far side seen from outside, 0 to 1; `0` hides it |
| `surface_rotate_x` | number | `0` | Turns the surface itself, in degrees: positive tips its top toward you |
| `surface_rotate_y` | number | `0` | Positive turns its front to the right |
| `surface_rotate_z` | number | `0` | Positive leans its top to the left (counter-clockwise) |

### Grid wells

**`surface: well` is a funnel: a surface of revolution from its rim down to its bottom, of any profile.** The gravity well and the wormhole of the Voyager astrometrics displays are wells. It takes every [surface key](#grid-surfaces): `surface_size` is the rim's diameter, `surface_length` the depth.

- `well_profile` gives any shape as a list of diameters from the rim down: `[1, 0.4, 0.2, 0.15]` is a trumpet, `[1, 0.25, 1]` an hourglass (a wormhole), `[1, 0.9, 0.5, 0]` a closed bowl, `[1, 1]` a straight tube (with a ripple, a pulsing conduit).
- The rings are evenly spaced along the surface (`line_spacing` px apart, however steep it is); a ripple passes through them, so they ride the swell.
- `well_throat`, `well_morph` and the ripple keys are [animatable](./binding-and-animation#animatable-keys): animate `well_morph` from 0 to 1 to reshape the funnel, or `well_throat` to let it breathe.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: GRAVITY WELL
    show: true
grid_options:
  rows: 4
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
      color: var(--lcards-orange)
```

A morph from a trumpet to an hourglass and back, with a card animation on `well_morph`:

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: MORPH
    show: true
grid_options:
  rows: 3
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

<CardGallery set="grid-wells" />

::: details More about wells
- **Sharp edges:** the well is drawn as 64 stacked slices, each an exact hit, so its edges stay sharp at any shape.
- **Round only:** a wobble that is not round about the axis (a bulge on one side, a bending axis) is not something a well can do.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `well_shape` | string | `trumpet` | `trumpet`: the gravity well, nearly flat at the rim and plunging to the throat. `cone`: straight sides. `bowl`: rounded toward the bottom. `wormhole`: two trumpets throat to throat (an hourglass, the throat halfway down) |
| `well_throat` | number | `0.15` | The throat of a `well_shape`, as a fraction of the rim, 0.02 to 1 (1 is a cylinder) |
| `well_profile` | list | - | Any shape: diameters as fractions of `surface_size`, from the rim down to the bottom, evenly spaced along the depth. A smooth curve passes through every one. Replaces `well_shape` and `well_throat` |
| `well_profile_to` | list | - | A second profile in the same form, for `well_morph` |
| `well_morph` | number | `0` | Blends from the well's shape (0) to `well_profile_to` (1) |
| `well_ripple` | number | `0` | Ripples running along the well: their height, as a fraction of the local radius, 0 to 0.9 (0.1 is a gentle swell) |
| `well_ripple_waves` | number | `3` | Ripple wavelengths along the depth, 0 to 12 |
| `well_ripple_speed` | number | `0.5` | Waves per second: positive runs down toward the bottom, negative up toward the rim |

---

## `grid-diagonal`

**`grid-diagonal` draws a 45° hatch of scrolling lines.** It is the `grid` preset fixed to `pattern: diagonal`, with tighter spacing and a slower scroll by default.

- It takes the [view and camera](#grid-views-and-camera), [surface](#grid-surfaces) and [well](#grid-wells) keys on WebGL.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: HATCHED
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: grid-diagonal
    config:
      line_spacing: 40
      line_width: 2
      color: alpha(var(--lcars-orange), 0.5)
      fill_color: alpha(var(--lcars-orange), 0.06)
      scroll_speed_x: 40
      scroll_speed_y: 0
```

<EffectPlayground preset="grid-diagonal" />

::: details More about grid-diagonal
- **Fixed pattern:** `pattern`, the major line keys and `show_border_lines` are not read by this preset; use [`grid`](#grid) with `pattern: diagonal` for those.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `line_spacing` | number | `30` | px between lines |
| `line_width` | number | `1` | Line width in px |
| `color` | colour | 30% of the theme's primary UI colour | Line colour |
| `scroll_speed_x` | number | `15` | Horizontal scroll in px per second |
| `scroll_speed_y` | number | `15` | Vertical scroll in px per second |
| `fill_color` | colour | `transparent` | Fill behind each cell |
| [View, surface and well keys](#grid-views-and-camera) | | | As on `grid` |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

---

## `grid-hexagonal`

**`grid-hexagonal` draws a scrolling honeycomb, with brighter major hexagons at regular intervals.** It is the `grid` preset fixed to `pattern: hexagonal`, sized by `hex_radius`.

- Major hexagons are picked by their row and column in the endless scrolling pattern (modulo the interval), so they keep a regular pattern as the honeycomb moves.
- `color_major` does not follow `color`: set both when you change the colour.
- It takes the [view and camera](#grid-views-and-camera), [surface](#grid-surfaces) and [well](#grid-wells) keys on WebGL.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: HONEYCOMB
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: grid-hexagonal
    config:
      hex_radius: 30
      color: alpha(var(--lcars-orange), 0.3)
      color_major: alpha(var(--lcars-orange), 0.8)
      major_row_interval: 4
      major_col_interval: 4
      line_width_major: 3
```

<EffectPlayground preset="grid-hexagonal" />

::: details More about grid-hexagonal
- **Plain honeycomb:** set `major_row_interval: 0` and `major_col_interval: 0`.
- **Filled cells:** `fill_color` paints behind every hexagon, for example `alpha(var(--lcars-ice), 0.07)`.
- **Border lines:** `show_border_lines` is not read by this preset.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `hex_radius` | number | `40` | Hexagon size in px |
| `line_width_minor` | number | `1` | Minor hexagon line width in px |
| `line_width_major` | number | `2` | Major hexagon line width in px |
| `color` | colour | 30% of the theme's primary UI colour | Minor hexagon colour |
| `color_major` | colour | 60% of the theme's primary UI colour | Major hexagon colour |
| `major_row_interval` | integer | `3` | A major hexagon every N rows; `0` for none |
| `major_col_interval` | integer | `3` | A major hexagon every N columns; `0` for none |
| `scroll_speed_x` | number | `20` | Horizontal scroll in px per second |
| `scroll_speed_y` | number | `20` | Vertical scroll in px per second |
| `fill_color` | colour | `transparent` | Fill behind each hexagon |
| [View, surface and well keys](#grid-views-and-camera) | | | As on `grid` |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

---

## `starfield`

**`starfield` scrolls a field of stars in parallax layers, the farther layers slower, for a sense of depth.** Each star takes one of the `colors` at random.

- For a "flying through space" look, stop the scroll and add a [zoom wrapper](./stacking-and-zoom#zoom-wrapper): each zoom layer gets its own seed (the base seed plus the layer number), so every zoom level shows different stars.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: DEEP SPACE
    show: true
grid_options:
  rows: 3
background_animation:
  # A stationary starfield inside a zoom wrapper
  - preset: starfield
    config:
      count: 200
      colors:
        - var(--lcards-blue-lightest)
        - var(--lcards-moonlight)
        - var(--lcars-blue)
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

::: details More about starfield
- **Scrolling field:** leave out the zoom and set `scroll_speed_x` (for example `50`) for stars drifting past in layers.
- **One colour:** `color` sets one colour for every star; it is the key to animate.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `count` | integer | `150` | Number of stars |
| `min_radius` | number | `0.5` | Smallest star radius in px |
| `max_radius` | number | `2` | Largest star radius in px |
| `min_opacity` | number | `0.3` | Dimmest star, 0 to 1 |
| `max_opacity` | number | `1` | Brightest star, 0 to 1 |
| `colors` | colour / list | `var(--lcars-text-light, var(--lcards-moonlight))` (from the theme) | One colour or a list; each star picks one |
| `color` | colour | - | One colour for every star |
| `scroll_speed_x` | number | `30` | Horizontal scroll in px per second |
| `scroll_speed_y` | number | `0` | Vertical scroll in px per second |
| `parallax_layers` | integer | `3` | Depth layers, 1 to 5: more layers, more depth |
| `depth_factor` | number | `0.5` | Speed difference between layers, 0 (uniform) to 1 |
| `seed` | integer | random | The same seed gives the same stars |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

---

## `nebula`

**`nebula` draws soft, drifting clouds whose edges are pushed around by Perlin noise, for an organic nebula.** Each cloud takes one of the `colors` at random.

- `turbulence` sets how far the noise pushes the cloud edges and `noise_scale` the size of its features (smaller: larger features).
- `volumetric: true` keeps the same clouds (seed, positions, colours and drift) and shades each one with noise on the GPU ([WebGL presets](../background-animations.md#webgl-presets)): wisps that slowly evolve inside, and an edge that `turbulence` makes ragged. Without WebGL, or with `renderer: canvas`, the plain clouds are drawn.
- Slow scroll speeds (3 to 10 px per second) suit a nebula; a zoom wrapper adds depth.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: NEBULA
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: nebula
    config:
      cloud_count: 6
      min_radius: 0.2
      max_radius: 0.5
      colors:
        - var(--lcards-blue-medium)
        - var(--lcards-orange)
        - var(--lcars-violet)
      turbulence: 0.7
      scroll_speed_x: 3
      scroll_speed_y: 3
      volumetric: true
```

<EffectPlayground preset="nebula" />

::: details More about nebula
- **Nebula and zoom:** set both scroll speeds to `0` and add a `zoom` block (for example `layers: 4`, `scale_from: 0.6`, `scale_to: 2.0`, `duration: 20`) for clouds that rush toward you.
- **Volumetric is opt-in** because it changes how a nebula looks; `noise_scale` then sets the wisp size.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `cloud_count` | integer | `4` | Number of clouds, 1 to 10 |
| `min_radius` | number | `0.15` | Smallest cloud radius, as a fraction of the canvas size |
| `max_radius` | number | `0.4` | Largest cloud radius, as a fraction of the canvas size |
| `min_opacity` | number | `0.3` | Dimmest cloud, 0 to 1 |
| `max_opacity` | number | `0.8` | Brightest cloud, 0 to 1 |
| `colors` | colour / list | `var(--lcards-blue-medium)`, `var(--lcards-orange)`, `var(--lcards-blue-light)` (from the theme) | One colour or a list; each cloud picks one |
| `turbulence` | number | `0.5` | How far the noise pushes the cloud edges, 0 to 1 |
| `noise_scale` | number | `0.003` | Noise feature size: smaller values make larger features |
| `scroll_speed_x` | number | `5` | Horizontal scroll in px per second |
| `scroll_speed_y` | number | `5` | Vertical scroll in px per second |
| `seed` | integer | random | The same seed gives the same clouds |
| `volumetric` | boolean | `false` | Shade the clouds with drifting noise on the GPU; needs WebGL |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

---

## `contour-field`

**`contour-field` slices a drifting noise field into colour bands like a topographic map, the LCARS star-chart contour look.** Noise shapes the terrain, `num_bands` slices it into rings across its full range, `fill_level` floods the lowest rings with a waterline, and `colors` fills the rest.

- Lower `num_bands` with a larger `cell_size` gives a blocky, retro-LCARS look; raise them for a smooth, photographic nebula look.
- Where WebGL is available it is drawn on the GPU ([WebGL presets](../background-animations.md#webgl-presets)): the same field, pixel for pixel, with no pause when the card first draws, resizes or changes alert colours, and `noise_scale`, `num_bands` and `fill_level` become animatable. Without WebGL, or with `renderer: canvas`, the Canvas2D version draws it.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: STAR CHART
    show: true
grid_options:
  rows: 3
background_animation:
  # Retro blocky contours, flat rings
  - preset: contour-field
    config:
      num_bands: 6
      cell_size: 4
      colors:
        - alpha(var(--lcars-blue), 0.15)
        - alpha(var(--lcars-blue), 0.55)
      blend_colors: false
```

<EffectPlayground preset="contour-field" />

::: details More about contour-field
- **Smooth look:** `num_bands: 32`, `cell_size: 1` and `blend_colors: true` give a near-continuous gradient.
- **Fill:** the waterline floods and drains over the terrain without changing it. Flooded rings take `fill_color` composited over their own colour; an empty `fill_color` (`""`) leaves them transparent, empty space between the blobs.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `seed` | integer | random | The same seed and settings always give the same field |
| `noise_scale` | number | `0.005` | Smaller: a few large blobs; larger: many small ripples |
| `num_octaves` | integer | `2` | Layers of fine detail, 1 (smooth) to 8 (rough, cloud-like) |
| `num_bands` | integer | `5` | Contour rings, 2 to 64: low gives bold stepped rings, high a near-continuous gradient |
| `cell_size` | integer | `1` | Sample size in px, 1 to 16: larger is blockier |
| `fill_level` | number | `0.45` | Waterline height, 0 (no water) to 0.95 |
| `fill_color` | colour | `alpha(var(--lcars-midnight-blue, var(--lcards-blue-darkest)), 0.30)` | Colour over the flooded rings; `""` for transparent |
| `blend_colors` | boolean | `true` | `true`: smooth fades between rings. `false`: flat, hard-edged rings |
| `colors` | colour / list | five stops of `alpha(#130b81, …)` from 0.08 to 0.80 | One colour, or several stops across the contour range |
| `scroll_speed_x` | number | `-3` | Horizontal drift in px per second |
| `scroll_speed_y` | number | `0.45` | Vertical drift in px per second |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

---

## `cascade`

**`cascade` is the LCARS data waterfall: rows of random data cells that cycle through three colours, each row on its own rhythm.** It replicates the classic CB-LCARS `cb-lcars-animation-cascade` background; the characters are decorative, not real data.

- Each cell holds `colors.start` for most of the cycle, snaps to `colors.text`, then fades to `colors.end` and loops (the keyframes are in the table below).
- `pattern` picks the row rhythm; `speed_multiplier` scales it, and `duration` replaces every row's duration.
- Use `opacity` 0.4 to 0.7 so card content stays readable, and combine it with `grid` or `starfield` for layered depth.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: DATA CASCADE
    show: true
grid_options:
  rows: 3
background_animation:
  # Cascade behind a faint grid
  - preset: cascade
    config:
      format: hex
      pattern: niagara
      speed_multiplier: 1.2
      colors:
        start: var(--lcards-blue-lightest)
        text: var(--lcars-dark-blue)
        end: var(--lcards-moonlight)
      opacity: 0.7
  - preset: grid
    config:
      line_spacing: 40
      color: alpha(var(--lcars-ice), 0.15)
      scroll_speed_x: 5
      scroll_speed_y: 5
      opacity: 0.4
```

Custom per-row timing (`pattern: custom`) takes a `timing` list, one entry per row and used round-robin when there are more rows than entries. Its `duration` is milliseconds and its `delay` is seconds:

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: CUSTOM TIMING
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: cascade
    config:
      format: digit
      pattern: custom
      timing:
        - duration: 1500
          delay: 0.1
        - duration: 2200
          delay: 0.3
        - duration: 900
          delay: 0.05
      opacity: 0.6
```

<EffectPlayground preset="cascade" />

::: details More about cascade
- **Colour cycle keyframes:**

| Cycle position | Colour | Phase |
|----------------|--------|-------|
| 0% to 75% | `colors.start` | Hold |
| 75% to 80% | `colors.start` to `colors.text` | Fast transition |
| 80% to 90% | `colors.text` | Hold |
| 90% to 100% | `colors.text` to `colors.end` | Fade out (loops) |

- **Timing patterns:**

| Pattern | Duration | Delay | Description |
|---------|----------|-------|-------------|
| `default` | 2 to 4 s (varies per row) | 0.1 to 0.8 s | Authentic LCARS rhythm |
| `niagara` | 2 s (uniform) | 0.1 to 0.8 s | Smooth waterfall |
| `fast` | 1 s (uniform) | 0 to 0.35 s | Rapid cycling |
| `custom` | from `timing` | from `timing` | Your own list; without `timing` it uses `default` |

- **Live data:** `refresh_interval` above 0 re-randomises the cells every that many ms, for example `format: mixed` with `refresh_interval: 2000`.
- **Shortest row:** a row's cycle is never shorter than 100 ms.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `num_rows` | integer | from the canvas height and font size | Rows |
| `num_cols` | integer | from the canvas width and font size | Columns |
| `gap` | number | `4` | px between cells |
| `format` | string | `hex` | Cell data: `hex`, `digit`, `float`, `alpha` or `mixed` |
| `refresh_interval` | integer | `0` | ms between new cell data; `0` keeps the data fixed |
| `font_size` | number | `10` | Font size in px |
| `font_family` | string | `'Antonio', monospace` | CSS font family |
| `colors.start` | colour | `var(--lcards-blue-light)` | Colour held for the first 75% of the cycle |
| `colors.text` | colour | `var(--lcards-blue-darkest)` | Colour of the mid-cycle snap (75% to 90%) |
| `colors.end` | colour | `var(--lcards-moonlight)` | Colour the cycle fades to (90% to 100%) |
| `pattern` | string | `default` | Row rhythm: `default`, `niagara`, `fast` or `custom` |
| `timing` | list | - | For `pattern: custom`: one entry per row |
| `timing[].duration` | number | - | The row's cycle, in ms |
| `timing[].delay` | number | - | The row's start offset, in seconds |
| `speed_multiplier` | number | `1` | Divides every row's duration: `2` is twice as fast |
| `duration` | integer | - | Every row's cycle in ms; wins over `pattern` and `speed_multiplier` |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

---

## `level`

**`level` is an animated tank or gauge fill: a fill level with a wavy top edge, an optional gradient, sloshing and an edge glow.** Bind `fill_pct` to an entity to show a real level.

- Two waves can overlap on the edge: the second is off until `wave2_height` is above 0.
- `slosh_amount` rocks the fluid from side to side, scaled by `wave_height`.

```yaml live controls
type: custom:lcards-button
preset: outline
entity: input_number.lcards_test_value
text:
  name:
    content: TANK LEVEL
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: level
    config:
      # The fill follows the entity's 0 to 100 value
      fill_pct:
        map_range:
          entity: input_number.lcards_test_value
          input: [0, 100]
          output: [0, 100]
      color_a: alpha(var(--lcars-green), 0.7)
      color_b: alpha(var(--lcars-dark-blue), 0.9)
      wave_height: 6
      wave2_height: 3
      slosh_amount: 0.5
      slosh_period: 2.5
```

<EffectPlayground preset="level" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `fill_pct` | number | `50` | Fill level, 0 to 100 |
| `direction` | string | `up` | Fill direction: `up`, `down`, `left` or `right` |
| `color_a` | colour | `rgba(0,200,100,0.7)` | Fill colour, or the gradient's start |
| `color_b` | colour | - | Gradient end colour; leave it out for a flat fill |
| `gradient_crossover` | number | `80` | Percent of the fill height that stays `color_a`, 0 to 100 |
| `edge_glow` | boolean | `true` | Glow along the fill edge |
| `edge_glow_color` | colour | `rgba(255,255,255,0.7)` | Glow colour |
| `edge_glow_width` | number | `6` | Glow spread in px |
| `wave_height` | number | `4` | Main wave height in px |
| `wave_speed` | number | `20` | Main wave speed in degrees of phase per second; negative reverses it |
| `wave_count` | integer | `4` | Main wave cycles across the width |
| `wave2_height` | number | `0` | Second wave height in px; `0` turns it off |
| `wave2_count` | integer | `5` | Second wave cycles across the width |
| `wave2_speed` | number | `-15` | Second wave speed |
| `slosh_amount` | number | `0` | Sloshing strength, 0 (off) to 1 |
| `slosh_period` | number | `3` | Seconds per slosh, at least 0.5 |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

---

## Texture Presets

**`fluid`, `plasma`, `flow`, `shimmer` and `scanlines` are texture generators with a small shared shape: a colour (or two), a couple of shape keys and `opacity`.** They are documented together here.

- `fluid` and `plasma` are drawn on the GPU where WebGL is available ([WebGL presets](../background-animations.md#webgl-presets)): the same field as the Canvas2D version, without its pause on first draw, resize and alert colour changes, and with `base_frequency` and the colours animatable. Without WebGL, or with `renderer: canvas`, the Canvas2D version draws them.

### `fluid`

**`fluid` is a swirling noise field: an organic, continuously morphing wash of one colour.**

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: FLUID
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: fluid
    config:
      color: alpha(var(--lcars-ice), 0.8)
      base_frequency: 0.01
      num_octaves: 4
```

<EffectPlayground preset="fluid" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | colour | `rgba(100,180,255,0.8)` | Wash colour |
| `base_frequency` | number | `0.010` | Noise detail: lower makes larger features |
| `num_octaves` | integer | `4` | Layers of noise detail, 1 to 8 |
| `scroll_speed_x` | number | `7` | Horizontal drift |
| `scroll_speed_y` | number | `10` | Vertical drift |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

### `plasma`

**`plasma` is a two-colour plasma field: vivid bands that alternate between `color_a` and `color_b` as they drift.**

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: PLASMA
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: plasma
    config:
      color_a: alpha(var(--lcars-violet), 0.9)
      color_b: alpha(var(--lcars-red), 0.9)
      base_frequency: 0.012
```

<EffectPlayground preset="plasma" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color_a` | colour | `rgba(80,0,255,0.9)` | First colour |
| `color_b` | colour | `rgba(255,40,120,0.9)` | Second colour |
| `base_frequency` | number | `0.012` | Noise detail: lower makes larger features |
| `scroll_speed_x` | number | `8` | Horizontal drift |
| `scroll_speed_y` | number | `5` | Vertical drift |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

### `flow`

**`flow` streams streaks in one direction, for energy conduits or a data stream.**

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: EPS CONDUIT
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: flow
    config:
      color: alpha(var(--lcars-ice), 0.7)
      wave_scale: 8
      scroll_speed_x: 50
```

<EffectPlayground preset="flow" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | colour | `rgba(0,200,255,0.7)` | Streak colour |
| `base_frequency` | number | `0.012` | Noise detail: lower makes larger features |
| `wave_scale` | number | `8` | Streak waviness |
| `scroll_speed_x` | number | `50` | Horizontal stream speed |
| `scroll_speed_y` | number | `0` | Vertical stream speed |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

### `shimmer`

**`shimmer` sweeps a single highlight band across the card at an angle, like light catching metal.** The band leaves one side and comes back in on the other.

- On `shimmer`, `speed` is the sweep speed in px per second rather than the usual time multiplier, so `12` sweeps twice as fast as the default `6`.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: SHIMMER
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: shimmer
    config:
      color: alpha(var(--lcards-moonlight), 0.55)
      highlight_width: 0.35
      angle: 30
```

<EffectPlayground preset="shimmer" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | colour | `rgba(255,255,255,0.55)` | Highlight colour |
| `highlight_width` | number | `0.35` | Band width, as a fraction of the card's diagonal |
| `speed` | number | `6` | Sweep speed, px per second along the sweep |
| `angle` | number | `30` | Sweep angle in degrees, 0 to 360 |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

### `scanlines`

**`scanlines` lays CRT-style scanlines over the card, still unless you give them a scroll speed.** It works well on top of another texture.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: VIEWSCREEN
    show: true
grid_options:
  rows: 3
background_animation:
  # A fluid wash with scanlines over it
  - preset: fluid
    config:
      color: alpha(var(--lcars-ice), 0.6)
  - preset: scanlines
    config:
      color: alpha(var(--lcars-black), 0.3)
      line_spacing: 4
      line_width: 1.5
```

<EffectPlayground preset="scanlines" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | colour | `rgba(0,0,0,0.25)` | Line colour |
| `line_spacing` | number | `4` | px between lines |
| `line_width` | number | `1.5` | Line width in px |
| `direction` | string | `horizontal` | `horizontal` or `vertical` lines |
| `scroll_speed_x` | number | `0` | Horizontal scroll in px per second |
| `scroll_speed_y` | number | `0` | Vertical scroll in px per second |
| `speed` | number | `1` | Time multiplier for the whole effect |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

---

## `image`

**`image` draws your own image as a full-bleed background behind the card's artwork, stacked with any other effects.** `source` takes a `/local/` path, an `https://` URL, a `builtin:` asset, a Home Assistant media library item or a template.

- `source` supports every LCARdS template syntax (`{entity.attributes.entity_picture}`, `[[[JS]]]`, and so on). Templates are evaluated on every Home Assistant update, so the image follows entity attribute changes.
- The editor's "Image Source" field has a **Browse Home Assistant Media** mode that opens Home Assistant's media browser (browse or upload) and stores the picked item's `media_content_id` as `source`.
- These examples are plain YAML, not live cards: they need an image file in your own Home Assistant.

```yaml
type: custom:lcards-button
preset: outline
text:
  name:
    content: BEDROOM
    show: true
grid_options:
  rows: 3
background_animation:
  # Your room picture with a grid over it
  - preset: image
    config:
      source: /local/images/Areas/Bedroom.jpg
      size: cover
      opacity: 0.85
  - preset: grid
    config:
      color: alpha(var(--lcars-orange), 0.25)
      line_spacing: 40
```

Other sources, as fragments for a `background_animation` list:

```yaml
# Live entity thumbnail (camera or media player)
- preset: image
  config:
    source: "{entity.attributes.entity_picture}"
    size: cover

# Named image from the asset library
- preset: image
  config:
    source: builtin:bedroom
    size: cover
    opacity: 0.8

# Image picked from the Home Assistant media library
- preset: image
  config:
    source: media-source://media_source/local/bedroom.jpg
    size: cover
    opacity: 0.8
```

::: details More about image
- **`source`, not `url`:** the key is `source`; `url` is not read (earlier versions of this page used `url`, which never worked).
- **SVG files:** `.svg` files work as sources; they load through an `<img>` element and paint into the canvas. They must be self-contained (no external resource references), and files without `width`/`height` attributes are drawn at the canvas size.
- **Media library:** a `media-source://` ID is turned into a real URL when the card draws, and that URL is cached for 15 minutes since it may carry an expiring signed token. See [Asset Manager](../../../architecture/subsystems/asset-manager.md).
- **HTTP URLs:** an `http://` URL on an HTTPS dashboard is blocked by the browser's mixed-content policy; use `/local/` paths or `https://` URLs. The editor warns when it sees an HTTP URL.
- **Tiling:** with `repeat: true` the image tiles at its own size, and `size` and `position` are not used.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `source` | string | `""` | `/local/` path, `https://` URL, `builtin:<key>`, `media-source://` content ID or a template string |
| `size` | string | `cover` | `cover`: fill (may crop). `contain`: fit (may letterbox). `fill`: stretch. `<n>px`: that width in px, the height following the image's aspect ratio. Anything else draws as `cover` |
| `position` | string | `center` | CSS `background-position`: keywords (`top left`) or percentages (`50% 0%`) |
| `repeat` | boolean | `false` | Tile the image, for textures or patterns |
| `opacity` | number | `1` | Effect opacity, 0 to 1; blend it with the effects above |

---

## `solid`

**`solid` fills the whole background with one flat colour.** It sits behind `base_svg`, so the tint shows through any transparent parts of the artwork on top without touching the artwork itself.

- It is the simplest preset: one fill per frame and no noise. Put it first in the list to tint under a procedural layer (the list draws bottom to top).

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: TINTED GRID
    show: true
grid_options:
  rows: 3
background_animation:
  # A tint under a grid
  - preset: solid
    config:
      color: alpha(var(--lcars-dark-blue), 0.6)
  - preset: grid
    config:
      color: alpha(var(--lcards-moonlight), 0.15)
```

<EffectPlayground preset="solid" />

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | colour | `rgba(0, 0, 0, 0.4)` | Fill colour; its alpha sets how much shows through `base_svg` |
| `opacity` | number | `1` | Multiplies with any alpha already in `color` |

---

## `warp-starfield`

**`warp-starfield` flies stars toward you in 3D with three.js (WebGL); above `speed: 1` they stretch into streaks, so animating `speed` reads as going to warp.** Without WebGL (or if the browser drops the WebGL context) the plain [`starfield`](#starfield) is drawn with the same config.

- `spectrum: true` splits each streak into colour along its length, as in some TNG warp shots (details below).
- The camera keys mean the same as on the [grid](#grid-views-and-camera), so either can follow an entity.
- Animatable: `speed`, `streak`, `camera_tilt`, `camera_yaw`, `camera_roll`, `fov`, `color`, `opacity` and the transform keys.

```yaml live controls
type: custom:lcards-button
preset: outline
text:
  name:
    content: WARP DRIVE
    show: true
grid_options:
  rows: 3
background_animation:
  # Warp while the alert mode is red, with the warp spectrum
  - preset: warp-starfield
    transition: 2000
    config:
      count: 1200
      streak: 1.5
      spectrum: true
      speed: "[[[ return states['input_select.lcards_alert_mode']?.state === 'red_alert' ? 8 : 1 ]]]"
```

Banking: the stars stream from left or right as a value moves.

```yaml live controls
type: custom:lcards-button
preset: outline
text:
  name:
    content: BANKING
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: warp-starfield
    transition: 1500
    config:
      speed: 4
      camera_yaw:
        map_range:
          entity: input_number.lcards_test_value
          input: [0, 100]
          output: [-30, 30]
```

::: details More about warp-starfield
- **Spectrum:** a Doppler shift of the star's own colour, violet toward the tail (nearer the direction of travel) and red toward the head. White stars show the whole rainbow; a blue star streaks green to violet, its tail fading as it shifts past violet. It fades in as the dots stretch, so stars at `speed: 1` keep their colour.
- **Colours and alerts:** the default star colour follows the alert palette; a fixed colour such as `#ffffff` does not.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `count` | integer | `600` | Number of stars, 1 to 20000 |
| `min_radius` | number | `0.5` | Smallest star size |
| `max_radius` | number | `2` | Largest star size |
| `colors` | colour / list | `var(--lcards-moonlight)` | Star colours; each star takes one |
| `color` | colour | - | One colour for every star (the key to animate) |
| `streak` | number | `1` | How long the streaks grow per unit of speed above 1; `0` keeps dots at any speed |
| `spectrum` | boolean | `false` | Split each streak into colour along its length |
| `spectrum_direction` | string | `doppler` | `doppler`: violet toward the tail. `reverse`: violet toward the head |
| `speed` | number | `1` | How fast the stars fly (a time multiplier) |
| `seed` | integer | random | The same seed gives the same stars |
| `camera_tilt` | number | `0` | Looks down (positive) or up from the direction of travel, -40 to 40 degrees: the stars stream from a point higher or lower on the card |
| `camera_yaw` | number | `0` | Looks right (positive) or left of the direction of travel, -40 to 40 degrees, as when turning at warp |
| `camera_roll` | number | `0` | Banks the view round its line of sight, in degrees (positive: clockwise) |
| `fov` | number | `70` | Field of view, 20 to 120 degrees: wider makes a deeper tunnel of streaks |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

---

## `holo-sphere`

**`holo-sphere` is an LCARS planetary display: a wireframe sphere of latitude rings and meridians turning slowly on a tilted axis, its far side dimmed, with a scan band sweeping up it.** It is drawn with three.js where WebGL is available and on Canvas2D otherwise, with the same look (`renderer: canvas` forces the Canvas2D version).

- `size`, `position_x` and `position_y` place the sphere anywhere on the card, even partly off it.
- Animatable: `rotate_speed`, `tilt`, `size`, `position_x`, `position_y`, `back_opacity`, `line_width`, `color`, `scan_color`, `speed`, `opacity` and the transform keys. A `rotate_speed` change never jumps the rotation.

```yaml live controls
type: custom:lcards-button
preset: outline
text:
  name:
    content: PLANET SCAN
    show: true
grid_options:
  rows: 4
background_animation:
  # A planet off to one side, spinning faster as the value rises
  - preset: holo-sphere
    transition: 1500
    config:
      size: 1.4
      position_x: 0.85
      tilt: 15
      rotate_speed:
        map_range:
          entity: input_number.lcards_test_value
          input: [0, 100]
          output: [0.5, 6]
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | colour | `var(--lcards-blue-light)` | Wireframe colour (follows the alert palette) |
| `scan_color` | colour | `var(--lcards-moonlight)` | Scan band colour (follows the alert palette) |
| `rotate_speed` | number | `1` | Revolutions per minute; negative turns the other way |
| `tilt` | number | `20` | Axis tilt, -90 to 90 degrees; positive leans the north pole toward you |
| `latitude_lines` | integer | `7` | Rings between the poles, 0 to 64 |
| `longitude_lines` | integer | `12` | Meridians around the sphere, 0 to 128 |
| `size` | number | `0.8` | Diameter as a fraction of the card's shorter side (above 1 overflows the card) |
| `position_x` | number | `0.5` | Centre across the card, 0 (left) to 1 (right) |
| `position_y` | number | `0.5` | Centre down the card, 0 (top) to 1 (bottom) |
| `back_opacity` | number | `0.2` | Brightness of the far side, 0 to 1; `0` hides it |
| `line_width` | number | `1` | Wireframe line width in px, at least 0.1 |
| `scan_period` | number | `6` | Seconds per scan sweep, including a short rest; `0` turns the band off |
| `speed` | number | `1` | Time multiplier for the rotation and the scan |
| `opacity` | number | `1` | Effect opacity, 0 to 1 |

---

## See Also

- [Background Animations overview](../background-animations.md): schema, zoom wrapper, effect stacking, entity binding
- [Animations](../../animations.md): anime.js-powered card animations (different system)
