# Shape Texture System

## What It Is

The `shape_texture` feature renders an SVG-native texture or animation **inside** the button or elbow shape boundary. It is a hybrid approach that sits **alongside** the existing `background_animation` canvas system:

| System | Rendering | Scope | Animation |
|---|---|---|---|
| `background_animation` | Canvas 2D | Full card bleed | anime.js / RAF |
| `shape_texture` | SVG-native | Inside shape fill only | Declarative SVG (`<animateTransform>`, `<animate>`) |

The canvas system continues to handle full-bleed card backgrounds unchanged. `shape_texture` provides a declarative, zero-JS-overhead texture layer composited directly within the SVG shape fill.

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
  preset: pulse
  opacity:
    active: 0.8
    inactive: 0.15
    default: 0.35
  config:
    color: "var(--lcars-alert-red)"
    speed: 1.5
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

All 12 built-in presets are listed below. Color fields accept any of: `rgba()`, `#hex`, `var(--css-variable)`, `{theme:token.path}`, or state-based maps — the color pipeline resolves all formats before they reach the SVG renderer (see [Color Pipeline](#color-pipeline)).

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

Organic swirling noise effect. Large fractalNoise blobs drift diagonally while the noise continuously evolves via SMIL `<animate baseFrequency>`. The ±5 % baseFrequency variation is imperceptible as a size change but causes the blob patterns to genuinely morph over time — no scroll seams or repeating loops.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(100,180,255,0.8)` | Blob color |
| `base_frequency` | `0.010` | Turbulence base frequency (lower = larger blobs) |
| `num_octaves` | `4` | Turbulence octaves (higher = more detail) |
| `scroll_speed_x` | `7` | Diagonal scroll x component px/s |
| `scroll_speed_y` | `10` | Diagonal scroll y component px/s |

### `plasma`

Dual-colour fractalNoise wash — two colours (`color_a`/`color_b`) are screen-blended using opposing turbulence channel masks. Creates a vivid energy/plasma look.

| Config key | Default | Description |
|---|---|---|
| `color_a` | `rgba(80,0,255,0.9)` | First colour |
| `color_b` | `rgba(255,40,120,0.9)` | Second colour |
| `base_frequency` | `0.012` | Turbulence base frequency |
| `num_octaves` | `2` | Turbulence octaves |
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

Directional streaming currents. Horizontally-elongated turbulence streaks (baseFrequency x:y ratio ~6:1) are warped by a second static displacement layer, then scrolled at high speed. The warp turbulence is deliberately static — no baseFrequency animation — so there are no visible jump discontinuities.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(0,200,255,0.7)` | Streak color |
| `base_frequency` | `0.012` | Turbulence base frequency for streaks |
| `wave_scale` | `8` | Displacement map scale (warp amplitude) |
| `scroll_speed_x` | `50` | Horizontal scroll speed px/s (high = fast current) |
| `scroll_speed_y` | `0` | Vertical scroll speed px/s |

### `level`

Animated level-indicator fill bar that rises from the bottom (or fills from the left). The fill level is set via `fill_pct` (0–100), which can be a template so it tracks an entity attribute. An optional animating cubic-Bezier wave runs along the leading edge.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(0,200,100,0.7)` | Fill color |
| `fill_pct` | `50` | Fill percentage 0–100; supports templates |
| `direction` | `'up'` | `'up'` (bottom→top) \| `'right'` (left→right) |
| `edge_glow` | `true` | Thin white highlight on leading edge |
| `wave_height` | `4` | Wave amplitude in px (0 = flat edge) |
| `wave_speed` | `20` | Wave scroll speed in px/s |
| `wave_count` | `4` | Number of wave crests across the shape width |

`direction: 'right'` does not support waves — the leading edge is always flat.

### `pulse`

Breathing radial glow for attention / alert indicators. A `radialGradient` ellipse expands and contracts; `opacity` also animates to create a punchy in/out effect.

| Config key | Default | Description |
|---|---|---|
| `color` | `rgba(255,80,0,0.8)` | Glow center color (fades to transparent at edge) |
| `speed` | `1.2` | Breathe cycles per second |
| `radius` | `0.7` | Maximum glow radius as a fraction of shape diagonal |
| `min_size` | `0.15` | Minimum glow size as a fraction of max radius |

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

User-supplied image rendered inside the card shape, clipped to the shape geometry via a Canvas2D Path2D clip path. Unlike the SVG-native presets above, this uses a `<foreignObject>` Canvas2D renderer (`CanvasTextureRenderer`) — the same pipeline as all other shape texture presets. There is no continuous animation frame cost when the image is static; the frame loop is always running but the draw call is a single GPU blit.

| Config key | Default | Description |
|---|---|---|
| `url` | `''` | `/local/` path, `https://` URL, `builtin:<key>` reference, or a template (e.g. `'{entity.attributes.entity_picture}'`). SVG files are also supported — they are loaded via `<img>` and painted into Canvas2D like any raster image. |
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
    url: '{entity.attributes.entity_picture}'
    size: cover
```

**Static image example**:

```yaml
shape_texture:
  preset: image
  opacity: 0.4
  config:
    url: '/local/images/bedroom.jpg'
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
    url: 'builtin:bedroom'  # key registered in lcards-images-pack or via Config Panel
    size: cover
```

> **SVG files**: `.svg` sources work — they load via `<img>` and are painted into Canvas2D. SVG files should be self-contained; files without explicit `width`/`height` attributes fall back to canvas dimensions automatically.

> **HTTP URLs on HTTPS dashboards**: The editor shows a warning when the URL begins with `http:` and the dashboard is served over HTTPS. Mixed-content requests are blocked by most browsers — prefer `/local/` paths or `https://` URLs.

## Architecture

### SVG Layer Order

The texture layer is injected between `backgroundMarkup` and `borderMarkup`:

```
${backgroundMarkup}    ← shape fill (rect/path)
${textureMarkup}       ← <defs> + clipped texture rect/path
${borderMarkup}        ← borders
${iconData.markup}     ← icon
${textMarkup}          ← text
```

### ID Scoping

All `<defs>` IDs include a per-instance unique suffix (e.g., `stex-clip-abc12`, `stex-pattern-abc12`) generated by `_getTextureInstanceId()`. This prevents collisions when multiple cards exist on the same dashboard.

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
    ▼  Stage 3 — createDefs(id, cfg, ctx)
       SVG feFlood flood-color="…" / fill="…" attribute
       Browser HTML parser resolves any remaining CSS natively
```

All turbulence and glow presets (`fluid`, `plasma`, `flow`) use `feFlood flood-color` + `feComposite operator="in"` rather than `feColorMatrix` RGB extraction. This means any color format the SVG parser understands (including CSS custom properties that have been resolved to a concrete value by the time they reach the attribute) works correctly — no manual `rgb()` decomposition.

Fill-bar presets (`level`, `pulse`) use the color directly as an SVG `fill` / `stop-color` attribute, with the same benefit.

### `_turbPattern` Helper

All turbulence-based presets (`fluid`, `plasma`, `flow`) use the shared `_turbPattern(id, turbPrim, colorPrim, W, H, sx, sy)` helper. The key insight is:

```
<filter> applied to a <rect> INSIDE a <pattern>
    evaluates in the pattern tile's LOCAL coordinate system
    → every tile produces identical output
    → animating patternTransform translate is always seam-free
```

The old `feTile + feOffset` approach failed because browsers clip `feTile` output to the filter region. The inner-filter-in-pattern approach produces a true infinite repeat.

`_turbPattern` emits:

```svg
<filter id="stex-inner-{id}" filterUnits="userSpaceOnUse" …>
  {turbPrim}          <!-- feTurbulence; result must be "turb" -->
  {colorPrim}         <!-- colour/composite stages -->
</filter>
<pattern id="stex-pattern-{id}" …>
  <rect filter="url(#stex-inner-{id})" …/>
  <animateTransform …/>    <!-- seamless scroll -->
</pattern>
```

### Template Support

All `config` string values support synchronous JS templates (`[[[…]]]`) and `{token}` substitution, evaluated at render time via `LCARdSCardTemplateEvaluator`. No async Jinja2 is supported here (this runs synchronously on every render).

The `fill_pct` field additionally supports two template syntaxes:

```yaml
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
| `src/core/packs/textures/presets/index.js` | `SHAPE_TEXTURE_PRESETS` registry; `_turbPattern` helper |
| `src/core/packs/textures/ShapeTextureRenderer.js` | SVG string generator |
| `src/core/packs/textures/index.js` | Re-exports |
| `src/core/packs/lcards-textures-pack.js` | Pack metadata |
| `src/editor/components/lcards-shape-texture-editor.js` | Editor UI component |
| `src/core/packs/textures/effects/ImageTextureEffect.js` | Canvas2D image effect for the `image` preset |
| `src/core/packs/shared/ImageLoader.js` | Shared singleton image cache; resolves `builtin:key` via AssetManager |
| `src/core/packs/shared/ImageDrawUtils.js` | Shared cover/contain/fill draw-param math; handles SVG zero-dimension fallback |


## See Also

- [Pack System](pack-system.md)
- [Asset Manager](asset-manager.md)
