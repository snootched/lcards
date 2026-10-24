# Background Animations

> **Animated canvas-based backgrounds for LCARdS cards**

Background animations provide dynamic visual effects rendered on HTML5 Canvas behind card content. The system supports effect stacking, optional zoom transformations, and preset-based configuration.

---

## Quick Start

### Basic Grid Animation

```yaml live
type: custom:lcards-button
entity: light.living_room
text:
  label:
    content: "Animated Button"
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

## Schema Structure

Effects are rendered in order: first effect is the bottom layer. Combine with `inset` to constrain the animation canvas to a sub-area of the card.

```yaml
background_animation:
  fps: 30           # Max render FPS (default: 30). Use 60 for high-refresh/desktop displays.
  inset:            # Canvas-level inset (optional) - all sides default to 0
    top: 0
    right: 0
    bottom: 40      # e.g. leave space for a footer bar
    left: 90        # e.g. leave space for a left sidebar
  effects:
    - preset: grid
      config:
        line_spacing: 40
    - preset: starfield
      config:
        count: 150
```

### Elbow auto-framing

On elbow cards, set `inset: auto` to let the card compute the correct inset from its bar geometry automatically:

```yaml live
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
background_animation:
  inset: auto       # canvas inset auto-derived from elbow bar geometry
  effects:
    - preset: cascade
      config: {}
```

### Canvas Settings

| Property | Type | Description |
|----------|------|-------------|
| `fps` | number | Maximum frames per second for the animation render loop. Default `30`, half the native browser rate, sufficient for ambient animations and conserves CPU on low-end devices (Android tablets etc). Set to `60` for smoother feel on desktop or high-refresh displays. |
| `inset` | object \| `'auto'` | Canvas-level offset applied to all effects. `'auto'` is only meaningful on elbow cards; on other card types it resolves to all-zero. |
| `inset.top` | number | Pixels to inset from top (default: 0) |
| `inset.right` | number | Pixels to inset from right (default: 0) |
| `inset.bottom` | number | Pixels to inset from bottom (default: 0) |
| `inset.left` | number | Pixels to inset from left (default: 0) |

The canvas minimum dimension is clamped to 1 px.

### Effect-level Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `preset` | string | ✅ | Preset name (see [Available Presets](#available-presets)) |
| `config` | object | ✅ | Preset-specific configuration |
| `zoom` | object | ❌ | Optional zoom wrapper configuration |
| `enabled` | boolean | ❌ | `false` keeps the entry (and its index) but draws nothing |
| `transition` | number | ❌ | How long, in ms, an [entity-bound](#entity-binding) value glides to its new value. Default `500`, `0` snaps. |
| `renderer` | string | ❌ | For presets with a WebGL version: `auto` (default) uses WebGL when the browser has it, `canvas` always draws the Canvas2D version (no GPU use), `webgl` prefers WebGL. Without WebGL every value draws the Canvas2D version, so the background never goes blank. See [WebGL presets](#webgl-presets). |

Every preset that moves (all but `image` and `solid`) also takes `config.speed`: a time multiplier for the whole effect (`2` is twice as fast, `0` freezes it; a zoom wrapper cycles faster too). On `shimmer`, `speed` is its sweep speed.

Colour parameters in `config` accept all standard LCARdS colour formats: CSS variables, theme tokens, hex, rgba, and computed expressions (`darken()`, `alpha()`, etc.). See [Colours](../colours.md).

---

## Available Presets

Seven built-in presets are available. See the **[Preset Reference](background-animations/preset-reference.md)** for full configuration tables and examples for each.

| Preset | Description |
|--------|-------------|
| [`grid`](background-animations/preset-reference.md#grid) | Orthogonal grid with optional major/minor divisions; on WebGL also a perspective floor (`view: floor`) |
| [`grid-diagonal`](background-animations/preset-reference.md#grid-diagonal) | Diagonal hatch pattern at 45° |
| [`grid-hexagonal`](background-animations/preset-reference.md#grid-hexagonal) | Honeycomb hexagonal pattern |
| [`starfield`](background-animations/preset-reference.md#starfield) | Scrolling starfield with parallax depth layers |
| [`nebula`](background-animations/preset-reference.md#nebula) | Organic Perlin-noise nebula clouds (`volumetric: true`: noise-shaded on WebGL) |
| [`cascade`](background-animations/preset-reference.md#cascade) | LCARS data-waterfall colour-cycling background |
| [`image`](background-animations/preset-reference.md#image) | Static or entity-driven image background |
| [`warp-starfield`](background-animations/preset-reference.md#warp-starfield) | Stars flying toward you in 3D, streaking at speed (WebGL) |
| [`holo-sphere`](background-animations/preset-reference.md#holo-sphere) | Rotating wireframe planet with a scan band (WebGL, Canvas2D without it) |

### WebGL presets

`warp-starfield` is drawn with three.js. Like every WebGL preset it loads only when a card uses it, shares one WebGL context across the whole dashboard, sits in the stack like any other entry, and falls back to Canvas2D (here `starfield`) where WebGL is not available.

`grid`, `grid-diagonal` and `grid-hexagonal` draw on the GPU too: the same pixels as their Canvas2D versions in the flat view, any line width, and a perspective floor view with an animatable camera ([grid views](background-animations/preset-reference.md#grid-views-and-camera)).

`holo-sphere` is drawn with three.js too, and on Canvas2D with the same look where WebGL is not available. `nebula` with `volumetric: true` shades its clouds with noise on the GPU (opt-in, because it changes the look); without WebGL it draws the plain clouds.

`contour-field`, `plasma` and `fluid` are drawn on the GPU too where WebGL is available, with the same keys and the same field as their Canvas2D versions. On the CPU these effects pause the page each time they first draw, resize or change alert colours (up to half a second on a full-screen background); on the GPU they don't, and their noise keys become [animatable](#animatable-keys).

Set `renderer: canvas` on the entry to always draw the Canvas2D version:

```yaml
background_animation:
  - preset: warp-starfield
    renderer: canvas
    config:
      count: 400
```

---
## Zoom Wrapper

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

## Effect Stacking

Multiple effects can be stacked by providing an array. Effects render in order (first = bottom layer, last = top layer).

::: warning Changed in 2026.10
Earlier versions drew the stack upside down (the last entry at the bottom), against this page. If you tuned a stacked background to that order, reverse the list.
:::

### Stacking Rules

1. **Order matters**: First effect in array renders first (bottom)
2. **Independent configuration**: Each effect has its own config and optional zoom
3. **Alpha blending**: Use RGBA colours with alpha < 1.0 for transparency
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

- **FPS cap**: Default is 30fps, suitable for most devices. Set `fps: 60` only on desktop/high-refresh displays where the extra smoothness is noticeable.
- **Limit layers**: 2-3 effects is usually sufficient
- **Use opacity**: Lower alpha values reduce visual noise
- **Disable scroll on zoom**: Set `scroll_speed_x: 0` and `scroll_speed_y: 0` when using zoom
- **Reduce zoom layers**: Use 3-4 layers instead of 6-8 for better performance
- **Test on device**: Performance varies by browser and hardware

---

## Entity Binding

Effect config parameters can react to live Home Assistant entity state or attributes. Works identically in both `background_animation` and `shape_texture`.

### `map_range`: Recommended

Linearly maps an entity attribute (or state) from one numeric range to another. No template knowledge required.

```yaml
config:
  scroll_speed_x:
    map_range:
      attribute: brightness   # entity attribute to read (omit to use entity.state)
      input:  [0, 255]        # input range (raw entity value)
      output: [-200, 200]     # output range (effect param value)
      # entity_id: light.other  # optional - defaults to the card's config.entity
      # clamp: true             # optional, default true - clamp output to range
```

**Full example, plasma speed tracks light brightness:**

```yaml
entity: light.tv
background_animation:
  inset: auto
  effects:
    - preset: plasma
      config:
        scroll_speed_x:
          map_range:
            attribute: brightness
            input:  [0, 255]
            output: [-200, 200]
        scroll_speed_y:
          map_range:
            attribute: brightness
            input:  [0, 255]
            output: [5, 60]
```

**`map_range` parameters:**

| Key | Type | Required | Description |
|-----|------|----------|-------------|
| `attribute` | string | ❌ | Entity attribute to read. Omit to use `entity.state`. |
| `input` | `[min, max]` | ✅ | Expected range of the raw entity value. |
| `output` | `[min, max]` | ✅ | Desired output range for the effect param. |
| `entity_id` | string | ❌ | Override entity. Defaults to card-bound `entity`. |
| `clamp` | boolean | ❌ | Clamp output to range (default: `true`). |

### Template string: Advanced

Evaluated on every hass update. Full JavaScript template access.

```yaml
config:
  # Direct string template (evaluates to a number)
  fill_pct: "[[[return entity.attributes.brightness / 2.55]]]"

  # Object form with fallback default
  wave_speed:
    template: "[[[return entity.attributes.color_temp / 5]]]"
    default: 20
```

**Supported template types:** `[[[JavaScript]]]`, `{token.path}`.

### Which keys follow an entity

A bound value is applied in one of three ways, depending on the key:

- **Glides** (the [animatable keys](#animatable-keys)): the effect moves to the new value over `transition` ms (default 500) instead of jumping. The first value after the card loads, `transition: 0` and reduced motion snap.
- **Snaps**: other keys of the `level`, `fluid`, `plasma`, `flow`, `shimmer`, `scanlines`, `image` and `contour-field` presets are applied at once (a noise re-bake, a new image source).
- **Fixed**: other keys of `grid`, `grid-diagonal`, `grid-hexagonal`, `starfield`, `nebula`, `cascade` and `solid` (star `count`, grid `pattern`, ...) are set when the effect is created. A binding on one is logged once in the browser console and has no effect.

```yaml
# Grid scroll speed follows a light's brightness, gliding over 1.5 s
entity: light.tv
background_animation:
  - preset: grid
    transition: 1500
    config:
      scroll_speed_x:
        map_range:
          attribute: brightness
          input: [0, 255]
          output: [0, 120]
```

> **Note:** Both forms are available in `shape_texture.config` and `background_animation` effect `config`. The UI editor does not expose entity binding; use YAML mode to configure it.

---

## Animating the background

An animation can target the card's background effects instead of an element: set `target: background`, and optionally `effect:` to the index of one `background_animation` entry (`0` is the first, the bottom layer; without it, every entry). Use `preset: custom` and put the effect's keys in `params`, written like any anime.js property (`[from, to]`, a single end value, keyframes). Triggers, `while`, rules (`apply.animations`), easing, `loop`/`alternate` and reduced motion all work as for element animations; stopping a running animation puts the values back.

The animation keeps running when an alert mode recolours the background (the effects are rebuilt with the new palette, and pick up the animated values).

### Example: warp speed on red alert

```yaml
type: custom:lcards-button
entity: input_select.lcards_alert_mode
background_animation:
  - preset: starfield
    zoom:
      layers: 4
      duration: 12
    config:
      scroll_speed_x: 0
animations:
  # Ramp the stars (and the zoom cycle) to 8x over 2 s when red alert starts
  - trigger: on_entity_change
    entity: input_select.lcards_alert_mode
    to_state: red_alert
    target: background
    effect: 0
    preset: custom
    params:
      speed: [1, 8]
      duration: 2000
      ease: inOutQuad
  # And back down when it ends
  - trigger: on_entity_change
    entity: input_select.lcards_alert_mode
    from_state: red_alert
    target: background
    effect: 0
    preset: custom
    params:
      speed: 1
      duration: 3000
      ease: outQuad
```

The same result with an [entity binding](#entity-binding) and no animations: the template picks the speed, `transition` sets the glide.

```yaml
type: custom:lcards-button
entity: input_select.lcards_alert_mode
background_animation:
  - preset: starfield
    transition: 2000
    zoom:
      layers: 4
      duration: 12
    config:
      scroll_speed_x: 0
      speed: "[[[ return entity.state === 'red_alert' ? 8 : 1 ]]]"
```

### Animatable keys

Every effect: `opacity`, and the transform keys `x`, `y` (offset in px), `rotate` (degrees) and `scale` (about the centre). Every effect that moves: `speed`. Colour keys accept every LCARdS colour format.

| Preset | Keys |
|---|---|
| `grid`, `grid-diagonal`, `grid-hexagonal` | `scroll_speed_x`, `scroll_speed_y`, `line_spacing`, `line_width`, `line_width_minor`, `line_width_major`, `color`, `color_major`, `fill_color` (those the preset takes); on WebGL also `camera_tilt`, `camera_yaw`, `camera_distance`, `fov`, `scan_color` |
| `starfield` | `scroll_speed_x`, `scroll_speed_y`, `color` (one colour for every star) |
| `nebula` | `scroll_speed_x`, `scroll_speed_y`, `turbulence` |
| `contour-field` | `scroll_speed_x`, `scroll_speed_y`; on WebGL also `noise_scale`, `num_bands`, `fill_level` |
| `cascade` | (the common keys) |
| `level` | `fill_pct`, `wave_height`, `wave_speed`, `wave2_height`, `wave2_speed`, `slosh_amount` |
| `fluid` | `scroll_speed_x`, `scroll_speed_y`; on WebGL also `base_frequency`, `color` |
| `plasma` | `scroll_speed_x`, `scroll_speed_y`; on WebGL also `base_frequency`, `color_a`, `color_b` |
| `flow` | `scroll_speed_x`, `scroll_speed_y`, `wave_scale` |
| `scanlines` | `scroll_speed_x`, `scroll_speed_y`, `line_spacing`, `line_width` |
| `shimmer` | `highlight_width`, `angle` |
| `image` | `opacity` only |
| `solid` | `opacity`, `color` |
| `warp-starfield` | `streak`, `color` |
| `holo-sphere` | `rotate_speed`, `tilt`, `size`, `position_x`, `position_y`, `back_opacity`, `line_width`, `color`, `scan_color` |

Other keys are left out on purpose: changing them means rebuilding the effect (a new star layout, a noise re-bake), too slow to do every frame. The WebGL versions of the noise presets have no bake, so their noise keys are animatable there; under `renderer: canvas` or without WebGL they keep the Canvas2D list. A key that isn't animatable is logged once in the browser console.

---

## Examples

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
  # Base layer: grid with fill
  - preset: grid
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

## Troubleshooting

### Animation Not Visible

- **Check opacity**: Colour alpha channel must be > 0 (e.g., `rgba(255, 153, 102, 0.4)` or `alpha(var(--lcars-orange), 0.4)`)
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

### Colours Not Resolving

- **Theme tokens**: Verify token path exists in the active theme; see [Themes](../themes/)
- **Quotes**: RGBA and computed expressions must be quoted in YAML
- **Hex colours**: Include the `#` prefix

---

## Performance Considerations

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

## See Also

- [Preset Reference](background-animations/preset-reference.md): full config tables and examples for all 7 presets
- [Animations](../animations.md): anime.js-powered card animations (different system)
- [Filters](filters.md): SVG filter effects

