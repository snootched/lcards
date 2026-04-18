# Background Animations

> **Animated canvas-based backgrounds for LCARdS cards**

Background animations provide dynamic visual effects rendered on HTML5 Canvas behind card content. The system supports effect stacking, optional zoom transformations, and preset-based configuration.

---

## Quick Start

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

## Schema Structure

Effects are rendered in order — first effect is the bottom layer. Combine with `inset` to constrain the animation canvas to a sub-area of the card.

```yaml
background_animation:
  fps: 30           # Max render FPS (default: 30). Use 60 for high-refresh/desktop displays.
  inset:            # Canvas-level inset (optional) — all sides default to 0
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

```yaml
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
| `fps` | number | Maximum frames per second for the animation render loop. Default `30` — half the native browser rate, sufficient for ambient animations and conserves CPU on low-end devices (Android tablets etc). Set to `60` for smoother feel on desktop or high-refresh displays. |
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

Colour parameters in `config` accept all standard LCARdS colour formats — CSS variables, theme tokens, hex, rgba, and computed expressions (`darken()`, `alpha()`, etc.). See [Colours](../colours.md).

---

## Available Presets

Seven built-in presets are available. See the **[Preset Reference](background-animations/preset-reference.md)** for full configuration tables and examples for each.

| Preset | Description |
|--------|-------------|
| [`grid`](background-animations/preset-reference.md#grid) | Orthogonal grid with optional major/minor divisions |
| [`grid-diagonal`](background-animations/preset-reference.md#grid-diagonal) | Diagonal hatch pattern at 45° |
| [`grid-hexagonal`](background-animations/preset-reference.md#grid-hexagonal) | Honeycomb hexagonal pattern |
| [`starfield`](background-animations/preset-reference.md#starfield) | Scrolling starfield with parallax depth layers |
| [`nebula`](background-animations/preset-reference.md#nebula) | Organic Perlin-noise nebula clouds |
| [`cascade`](background-animations/preset-reference.md#cascade) | LCARS data-waterfall colour-cycling background |
| [`image`](background-animations/preset-reference.md#image) | Static or entity-driven image background |

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

- **FPS cap**: Default is 30fps — suitable for most devices. Set `fps: 60` only on desktop/high-refresh displays where the extra smoothness is noticeable.
- **Limit layers**: 2-3 effects is usually sufficient
- **Use opacity**: Lower alpha values reduce visual noise
- **Disable scroll on zoom**: Set `scroll_speed_x: 0` and `scroll_speed_y: 0` when using zoom
- **Reduce zoom layers**: Use 3-4 layers instead of 6-8 for better performance
- **Test on device**: Performance varies by browser and hardware

---

## Entity Binding

Effect config parameters can react to live HA entity state or attributes. Works identically in both `background_animation` and `shape_texture`.

### `map_range` — Recommended

Linearly maps an entity attribute (or state) from one numeric range to another. No template knowledge required.

```yaml
config:
  scroll_speed_x:
    map_range:
      attribute: brightness   # entity attribute to read (omit to use entity.state)
      input:  [0, 255]        # input range (raw entity value)
      output: [-200, 200]     # output range (effect param value)
      # entity_id: light.other  # optional — defaults to the card's config.entity
      # clamp: true             # optional, default true — clamp output to range
```

**Full example — plasma speed tracks light brightness:**

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

### Template string — Advanced

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

**Supported template types:** `[[[JavaScript]]]`, `{token.path}` — both work in any config key.

> **Note:** Both forms are available in `shape_texture.config` and `background_animation` effect `config`. The UI editor does not expose entity binding — use YAML mode to configure it.

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

- **Theme tokens**: Verify token path exists in the active theme — see [Themes](../themes/)
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

- [Preset Reference](background-animations/preset-reference.md) — full config tables and examples for all 7 presets
- [Animations](../animations.md) — anime.js-powered card animations (different system)
- [Filters](filters.md) — SVG filter effects

