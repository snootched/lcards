# Shape Texture System

## What It Is

The `shape_texture` feature renders a Canvas2D texture or animation **inside** the button or elbow shape boundary. It sits **alongside** the existing `background_animation` canvas system:

| System | Rendering | Scope | Animation |
|---|---|---|---|
| `background_animation` | Canvas2D | Full card bleed | anime.js / RAF |
| `shape_texture` | Canvas2D | Inside shape fill only | Canvas2D RAF loop |

The background animation system handles full-bleed card backgrounds. `shape_texture` mounts a `<canvas>` element inside a `<foreignObject>` placeholder in the card SVG, clipped to the shape geometry via Canvas2D Path2D, and drives all presets through a shared RAF loop (`CanvasTextureRenderer`).

## Supported Card Types

- **Button card** — preset mode only (no custom SVG, no component mode)
- **Elbow card** — simple and segmented styles

The guard `_supportsShapeTexture()` on `LCARdSButton` returns `true` only when `!this._processedSvg && !this.config?.component && !this.config?.svg`.

## Config Schema

```yaml
type: custom:lcards-button
preset: lozenge
entity: light.bedroom
shape_texture:
  preset: grid           # See Preset Reference for all options
  opacity: 0.3           # 0–1, or state-based object
  speed: 1.0             # Global speed multiplier (0 = static), or state-based object
  mix_blend_mode: normal # CSS mix-blend-mode (normal | multiply | screen | overlay | …)
  config:                # Preset-specific parameters
    color: "rgba(255,255,255,0.4)"
    line_spacing: 40
    scroll_speed_x: 20
    scroll_speed_y: 0
    pattern: both        # grid only: both | horizontal | vertical
```

### State-based opacity example

```yaml
shape_texture:
  preset: fluid
  opacity:
    active: 0.8
    inactive: 0.15
    default: 0.35
  config:
    color: "var(--lcars-alert-red)"
```

### State-based speed example (animated → static on active)

```yaml
shape_texture:
  preset: grid
  speed:
    default: 1.0
    active: 0.0    # freeze animation when active
  opacity: 0.25
```

### State-based fill level example

```yaml
shape_texture:
  preset: level
  config:
    color: "rgba(0,220,120,0.75)"
    fill_pct:
      default: 0
      template: "[[[return entity.attributes.battery_level ?? 0]]]"
```

## Preset Reference

All 11 built-in presets are listed below. Color fields accept any of: `rgba()`, `#hex`, `var(--css-variable)`, `{theme:token.path}`, or state-based maps — the color pipeline resolves all formats before they reach the Canvas2D renderer (see [Color Pipeline](#color-pipeline)).

### `grid`

Scrolling orthogonal grid lines.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(255,255,255,0.3)` | Line color |
| `line_width` | `1` | Stroke width in px |
| `line_spacing` | `40` | Grid cell size in px |
| `scroll_speed_x` | `20` | Horizontal scroll speed px/s (negative = reverse) |
| `scroll_speed_y` | `0` | Vertical scroll speed px/s |
| `pattern` | `'both'` | `'both'` \| `'horizontal'` \| `'vertical'` |

### `diagonal`

Scrolling diagonal hatching.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(255,255,255,0.3)` | Line color |
| `line_width` | `1` | Stroke width in px |
| `line_spacing` | `40` | Tile size in px |
| `scroll_speed_x` | `20` | Horizontal scroll speed px/s |
| `scroll_speed_y` | `20` | Vertical scroll speed px/s |

### `hexagonal`

Scrolling hexagonal grid (pointy-top orientation).

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(255,255,255,0.3)` | Stroke color |
| `line_width` | `1` | Stroke width |
| `hex_radius` | `20` | Hex cell radius in px |
| `scroll_speed_x` | `15` | Horizontal scroll speed px/s |
| `scroll_speed_y` | `0` | Vertical scroll speed px/s |

### `dots`

Scrolling dot grid.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(255,255,255,0.4)` | Dot fill color |
| `dot_radius` | `2` | Dot radius in px |
| `spacing` | `20` | Grid cell size in px |
| `scroll_speed_x` | `15` | Horizontal scroll speed px/s |
| `scroll_speed_y` | `0` | Vertical scroll speed px/s |

### `fluid`

Organic swirling noise field. Uses a Canvas2D fBm (fractional Brownian motion) Perlin-style value-noise algorithm that advances its offset each frame, producing a seamlessly morphing colour wash — no repeating loops or scroll seams. `base_frequency` controls feature size (lower = larger blobs); `num_octaves` controls detail.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(100,180,255,0.8)` | Blob color |
| `base_frequency` | `0.010` | Turbulence base frequency (lower = larger blobs) |
| `num_octaves` | `4` | Turbulence octaves (higher = more detail) |
| `scroll_speed_x` | `7` | Diagonal scroll x component px/s |
| `scroll_speed_y` | `10` | Diagonal scroll y component px/s |

### `plasma`

Dual-colour Canvas2D fBm plasma field. Two colours blend across a continuously scrolling noise field to produce a vivid energy/plasma look. Per-pixel cost scales with `num_octaves`.

| Config key | Default | Description |
|---|---|---|
| `color_a` | `rgba(80,0,255,0.9)` | First colour |
| `color_b` | `rgba(255,40,120,0.9)` | Second colour |
| `base_frequency` | `0.012` | Noise frequency (lower = larger features) |
| `num_octaves` | `3` | fBm octave count (higher = more detail, more CPU) |
| `scroll_speed_x` | `8` | Horizontal scroll speed px/s |
| `scroll_speed_y` | `5` | Vertical scroll speed px/s |

### `shimmer`

A directional light-sweep gradient that continuously traverses the shape. The angle parameter controls sweep direction; the highlight sweeps from off-left to off-right over a 3× tile width to avoid visible wrap.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(255,255,255,0.55)` | Highlight color |
| `highlight_width` | `0.35` | Highlight band width as a fraction of tile width (0–1) |
| `speed` | `2.5` | Sweep speed in px/s |
| `angle` | `30` | Sweep angle in degrees |

### `flow`

Directional streaming currents. Draws parallel horizontal gradient bands with sine-wave Y offsets that scroll at high speed, giving the impression of flowing current streaks. `wave_scale` controls the lateral warp amplitude; `num_streaks` controls band density.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(0,200,255,0.7)` | Streak colour |
| `base_frequency` | `0.012` | Controls streak sine-wave density |
| `wave_scale` | `8` | Sine amplitude in px (warp depth) |
| `num_streaks` | `8` | Number of parallel bands |
| `streak_width` | `0.8` | Band height as fraction of slot (>1 = overlap/blend) |
| `blur` | `0` | Gaussian blur radius px (softens band edges) |
| `scroll_speed_x` | `50` | Horizontal sweep speed px/s |
| `scroll_speed_y` | `0` | Vertical drift speed px/s |

### `level`

Animated level-indicator fill bar that rises from the bottom (or fills from the left). The fill level is set via `fill_pct` (0–100), which can be a template so it tracks an entity attribute. An optional animating cubic-Bezier wave runs along the leading edge.

| Config key | Default | Description |
|---|---|---|
| `color` / `color_a` | `rgba(0,200,100,0.7)` | Primary fill colour (bottom/left). `color` is a backward-compatible alias for `color_a`. |
| `color_b` | `null` | Secondary colour (top/right). When set, a gradient is drawn from `color_a` to `color_b`. |
| `gradient_crossover` | `80` | 0–100 — percentage of fill height that stays `color_a` before transitioning to `color_b`. |
| `fill_pct` | `50` | Fill percentage 0–100; supports templates. |
| `direction` | `'up'` | `'up'` (bottom→top) \| `'right'` (left→right) |
| `edge_glow` | `true` | Bloom highlight on the leading edge. |
| `edge_glow_color` | `rgba(255,255,255,0.7)` | Edge glow colour. |
| `edge_glow_width` | `6` | Glow spread radius in px. |
| `wave_height` | `4` | Primary wave amplitude in px (0 = flat edge). |
| `wave_speed` | `20` | Primary wave phase rate in deg/s (negative = reverse). |
| `wave_count` | `4` | Sine cycles across the shape width. |
| `wave2_height` | `0` | Secondary wave amplitude in px (0 = disabled). |
| `wave2_count` | `5` | Secondary wave cycle count. |
| `wave2_speed` | `-15` | Secondary wave phase rate in deg/s. |
| `slosh_amount` | `0` | 0–1 tilt intensity. Makes the fluid rock as if in a vessel. |
| `slosh_period` | `3` | Seconds per slosh cycle. |

`direction: 'right'` does not support waves — the leading edge is always flat.

### `scanlines`

Classic CRT-style scan-line overlay. Works as a darkening (or lightening) overlay on top of any shape fill colour.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(0,0,0,0.25)` | Line color |
| `line_spacing` | `4` | Distance between lines in px |
| `line_width` | `1.5` | Line stroke width in px |
| `direction` | `'horizontal'` | `'horizontal'` \| `'vertical'` |
| `scroll_speed_y` | `0` | Vertical scroll speed px/s (horizontal direction) |
| `scroll_speed_x` | `0` | Horizontal scroll speed px/s (vertical direction) |

### `image`

User-supplied image rendered inside the card shape, clipped to the shape geometry via a Canvas2D Path2D clip path. Like all other presets, this runs inside `CanvasTextureRenderer`. There is no continuous per-frame draw cost when the image is static — the RAF loop is always running but the draw call is a single GPU blit.

| Config key | Default | Description |
|---|---|---|
| `source` | `''` | `/local/` path, `https://` URL, `builtin:<key>` reference, or a template (e.g. `'{entity.attributes.entity_picture}'`). SVG files are also supported — they are loaded via `<img>` and painted into Canvas2D like any raster image. |
| `size` | `'cover'` | `'cover'` \| `'contain'` \| `'fill'` \| `'<n>px'` (explicit pixel size for the shorter axis) |
| `position` | `'center'` | CSS `background-position` style string — keywords (`top left`, `center`, `bottom right`) or percentages (`50% 50%`) |
| `repeat` | `false` | If `true`, tiles the image across the shape rather than fitting it |
| `opacity` | `1` | Top-level `shape_texture.opacity` applies here via the standard pipeline; no `config.opacity` needed |

**Template URL example** (entity thumbnail):

```yaml
shape_texture:
  preset: image
  opacity: 0.75
  mix_blend_mode: overlay
  config:
    source: '{entity.attributes.entity_picture}'
    size: cover
```

**Static image example**:

```yaml
shape_texture:
  preset: image
  opacity: 0.4
  config:
    source: '/local/images/bedroom.jpg'
    size: cover
    position: center top
```

**Named asset from the Asset Library**:

```yaml
shape_texture:
  preset: image
  opacity: 0.5
  mix_blend_mode: overlay
  config:
    source: 'builtin:bedroom'  # key registered in lcards-images-pack or via Config Panel
    size: cover
```

> **SVG files**: `.svg` sources work — they load via `<img>` and are painted into Canvas2D. SVG files should be self-contained; files without explicit `width`/`height` attributes fall back to canvas dimensions automatically.

> **HTTP URLs on HTTPS dashboards**: The editor shows a warning when the URL begins with `http:` and the dashboard is served over HTTPS. Mixed-content requests are blocked by most browsers — prefer `/local/` paths or `https://` URLs.

## Architecture

### SVG Layer Order

The texture layer is injected between `backgroundMarkup` and `borderMarkup`:

```
${backgroundMarkup}    ← shape fill (rect/path)
${textureMarkup}       ← <foreignObject class="button-texture-host"> placeholder
${borderMarkup}        ← borders
${iconData.markup}     ← icon
${textMarkup}          ← text
```

`${textureMarkup}` emits a `<foreignObject>` sized to the full card. After Lit renders the SVG, `_mountCanvasTexture()` locates the `<foreignObject>` and passes it to `CanvasTextureRenderer`, which appends a `<canvas>` (100% × 100%, `pointer-events:none`) inside it. A `ResizeObserver` keeps the canvas dimensions in sync with the layout.

### ID Scoping

A per-instance unique suffix (e.g., `abc12`) generated by `_getTextureInstanceId()` is used in debug logging and distinguishes multiple texture instances on the same dashboard.

### Color Pipeline

Colors in `shape_texture` config travel through a four-stage resolution pipeline before reaching the SVG renderer:

```
User config value (JS template / token / theme token / CSS var / rgba / hex / state map)
    │
    ▼  Stage 0 — Template evaluation (in _resolveShapeTextureConfig)
    │  Evaluates [[[JS]]] and {token} templates in all config string values
    │  fill_pct also supports { default: N, template: "[[[...]]]" } object form
    │
    ▼  Stage 1 — resolveThemeTokensRecursive()   (in _resolveShapeTextureConfig)
    │  Resolves {theme:…} tokens → CSS variable or concrete value
    │
    ▼  Stage 2 — ColorUtils.resolveCssVariable() (per color field, same function)
    │  Resolves var(--…) CSS variables → concrete color strings
    │
    ▼  Stage 3 — TextureEffect constructor / update()
       Canvas2D fillStyle / strokeStyle / createLinearGradient stop-color
       Color is already a concrete rgba/hex string by this stage
```

By the time a color value reaches the Canvas2D effect, it is a concrete `rgba(…)` or `#hex` string. No CSS variable resolution happens inside the effect — that is handled in Stage 2 by `ColorUtils.resolveCssVariable()` in `_resolveShapeTextureConfig()`. This means effects can pass the color string directly to `ctx.fillStyle` or `ctx.strokeStyle` without further processing.

### Template Support

All `config` string values support synchronous JS templates (`[[[…]]]`) and `{token}` substitution, evaluated at render time via `LCARdSCardTemplateEvaluator`. No async Jinja2 is supported here (this runs synchronously on every render).

The `fill_pct` field additionally supports two template syntaxes:

```yaml alternatives
# Form 1 — direct string template (evaluated as a numeric value)
shape_texture:
  preset: level
  config:
    fill_pct: "[[[return entity.attributes.battery_level ?? 0]]]"

# Form 2 — object with template key and fallback default
shape_texture:
  preset: level
  config:
    fill_pct:
      default: 0
      template: "[[[return entity.attributes.battery_level ?? 0]]]"
```

In Form 2, `default` is used if the template evaluation fails or returns a non-numeric result.

Any other config string field can use the same template syntax:

```yaml
shape_texture:
  preset: grid
  config:
    color: "[[[return entity.state === 'on' ? 'rgba(0,200,100,0.7)' : 'rgba(200,0,0,0.5)']]]"
    scroll_speed_x: "{entity.attributes.speed_override}"
```

State-based object maps (`active`/`inactive`/`default` keys) remain supported for `color`, `opacity`, and `speed` as before.

---

### Rules Engine Integration

The Rules Engine can patch `shape_texture` via `apply.overlays`. Standard template strings in patch values are evaluated automatically. For continuous numeric mapping, `fill_pct` (and any other numeric config field) also supports `map_range` descriptors, resolved by `_evaluateTemplatesInPatches` before the patch reaches the card:

```yaml
rules:
  - id: tank_level
    when:
      entity: sensor.tank_level
      above: -1
    apply:
      overlays:
        my-tank-button:
          shape_texture:
            config:
              fill_pct:
                map_range:
                  entity: sensor.tank_level
                  input: [0, 100]
                  output: [0, 100]
```

Because `_resolveShapeTextureConfig()` reads directly from `this.config` at every render (no result is cached), rule patches that modify `shape_texture` via `_applyRulePatches()` are automatically reflected on the next render cycle without any extra invalidation step.

---

### Key Files

| File | Role |
|---|---|
| `src/core/packs/textures/CanvasTextureRenderer.js` | Main Canvas2D renderer — creates `<canvas>`, drives RAF loop, manages `ResizeObserver`, delegates to effect |
| `src/core/packs/textures/presets/index.js` | `CANVAS_TEXTURE_PRESETS` registry (also exported as `SHAPE_TEXTURE_PRESETS` for backward compat) |
| `src/core/packs/textures/effects/` | One `BaseTextureEffect` subclass per preset |
| `src/core/packs/textures/effects/noise-helpers.js` | Shared fBm noise math and `parseColorToRgba` used by fluid/plasma effects |
| `src/core/packs/textures/index.js` | Re-exports |
| `src/core/packs/lcards-textures-pack.js` | Pack metadata |
| `src/editor/components/lcards-shape-texture-editor.js` | Editor UI component |
| `src/core/packs/shared/ImageLoader.js` | Singleton image cache; resolves `builtin:key` references via AssetManager |
| `src/core/packs/shared/ImageDrawUtils.js` | Cover/contain/fill draw-param math used by `ImageTextureEffect` |


## See Also

- [Pack System](../subsystems/pack-system.md)
- [Asset Manager](../subsystems/asset-manager.md)
