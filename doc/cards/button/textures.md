---
description: "Button card textures and backgrounds: shape_texture (grids, dots, fluid, plasma, shimmer, flow, level, pulse, scanlines, image) inside the button's shape, and background_animation behind it."
---

# Textures and Backgrounds

Movement and pattern on a button: a texture drawn inside the button's own shape, or an animated background behind the whole card.

## shape_texture

**`shape_texture` draws a pattern or a moving effect inside the button's fill, clipped to its shape.** Use it for a grid on a panel, a shimmer across a lozenge, or a level that rises with a sensor.

- It works on preset buttons (and on [elbows](../elbow/)), not with a `component` or your own `svg`.
- `opacity`, `speed` and every colour in `config` can follow the entity's state with a state map. Numbers and colours in `config` can also follow a value with `map_range` or a template.

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
shape_texture:
  preset: grid
  opacity:
    active: 0.6
    inactive: 0.1
  mix_blend_mode: screen
  speed: 0.5
  config:
    line_spacing: 12
    color: var(--lcards-moonlight)
```

::: details More about shape_texture
- **Speed:** `speed` multiplies the preset's own scroll or sweep speed; `0` holds it still.
- **Following a value:** any number or colour in `config` can be `{ map_range: { entity, attribute, input, output, clamp } }`, the same keys as `map_range` in [animations](/core/animations). With two colours as `output` the colour is blended between them; each can be any colour LCARdS accepts (a hex of any length, a named colour, `rgb()` or `hsl()`, a CSS variable, a `theme:` token or a computed colour such as `alpha()`). `entity` defaults to the card's entity, `attribute` to its state, and `clamp` is on unless set to `false` (`entity_id`, the older name for `entity`, still works).
- **Full parameter reference:** every preset's keys and defaults are in [Shape Texture System](/architecture/internals/shape-texture-system).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `shape_texture.preset` | string | required | The texture: see [Available Presets](#available-presets) |
| `shape_texture.opacity` | number / state map | `0.3` | Texture opacity, 0 to 1 |
| `shape_texture.mix_blend_mode` | string | `normal` | How the texture mixes with the fill: `normal`, `multiply`, `screen`, `overlay`, `hard-light`, `soft-light`, `color-burn` or `color-dodge` |
| `shape_texture.speed` | number / state map | `1` | Speed multiplier; `0` is still |
| `shape_texture.config` | object | the preset's defaults | The preset's own keys: see the table below |

### Available Presets

**The textures `shape_texture.preset` takes, and the main keys of each.** Every `color` key takes a CSS variable, a theme token, `rgba()`, hex or a state map.

```yaml live
type: custom:lcards-button
entity: sensor.battery
preset: capped
text:
  name:
    content: BATTERY
    show: true
shape_texture:
  preset: level
  opacity: 0.8
  config:
    color: var(--lcars-blue)
    fill_pct: "[[[return Number(entity.state)]]]"
    wave_height: 3
```

| Preset | What it draws | Main `config` keys |
|--------|---------------|--------------------|
| `grid` | Scrolling grid lines | `line_spacing`, `pattern` (`both`, `horizontal`, `vertical`) |
| `diagonal` | Scrolling diagonal hatching | `line_spacing` |
| `hexagonal` | Scrolling hexagonal grid | `hex_radius` |
| `dots` | Scrolling dot grid | `dot_radius`, `spacing` |
| `fluid` | Swirling noise, an organic wash of colour | `base_frequency`, `num_octaves` |
| `plasma` | Two-colour turbulent bands | `color_a`, `color_b`, `base_frequency` |
| `shimmer` | A band of light sweeping across | `angle`, `highlight_width`, `speed` |
| `flow` | Streaks streaming one way | `wave_scale`, `scroll_speed_x` |
| `level` | A fill bar with a wave on top | `fill_pct`, `direction`, `wave_height`, `color` (the fill), `color_b` (a tint at the leading edge) |
| `pulse` | A radial glow breathing in and out | `color`, `speed` (pulses per second), `radius`, `min_size` |
| `scanlines` | CRT-style scan lines | `line_spacing`, `direction` |
| `image` | Your image, clipped to the shape | `source`, `size`, `position`, `repeat` |

## background_animation

**`background_animation` draws animated layers (grids, starfields, nebulae, a data cascade) behind the button's content.** The [Background Animations](/core/effects/background-animations) page has every preset and its keys.

- The background sits behind the button's fill, so it shows best on a button with a transparent fill, such as the `outline` preset.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: SENSOR GRID
    show: true
grid_options:
  rows: 2
background_animation:
  - preset: grid
    config:
      line_spacing: 20
      color: alpha(var(--lcars-orange), 0.3)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `background_animation` | list / object | - | A list of effects (bottom layer first), or `inset` plus `effects`: see [Background Animations](/core/effects/background-animations#canvas-options) |
| `background_animation[].preset` | string | required | The effect: see [Available Presets](/core/effects/background-animations#available-presets) |
| `background_animation[].config` | object | the preset's defaults | The effect's own keys |
