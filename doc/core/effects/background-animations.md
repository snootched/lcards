---
description: "Background animations: animated layers (grids, starfields, nebulae, a data cascade, a warp field) drawn behind button, elbow, slider, MSD and astrometrics cards, with stacking, zoom, entity binding and animation."
moved_anchors:
  schema-structure: /core/effects/background-animations#effect-options
  effect-level-properties: /core/effects/background-animations#effect-options
  canvas-settings: /core/effects/background-animations#canvas-options
  elbow-auto-framing: /core/effects/background-animations#canvas-options
  basic-grid-animation: /core/effects/background-animations#quick-start
  grid-with-zoom-effect: /core/effects/background-animations/stacking-and-zoom#zoom-wrapper
  stacked-effects: /core/effects/background-animations/stacking-and-zoom#effect-stacking
  zoom-wrapper: /core/effects/background-animations/stacking-and-zoom#zoom-wrapper
  how-it-works: /core/effects/background-animations/stacking-and-zoom#zoom-wrapper
  configuration: /core/effects/background-animations/stacking-and-zoom#zoom-wrapper
  parameters: /core/effects/background-animations/stacking-and-zoom#zoom-wrapper
  opacity-fade-logic: /core/effects/background-animations/stacking-and-zoom#zoom-wrapper
  examples: /core/effects/background-animations/stacking-and-zoom#examples
  examples-1: /core/effects/background-animations/stacking-and-zoom#examples
  effect-stacking: /core/effects/background-animations/stacking-and-zoom#effect-stacking
  stacking-rules: /core/effects/background-animations/stacking-and-zoom#effect-stacking
  example-layered-grid-hexagons: /core/effects/background-animations/stacking-and-zoom#effect-stacking
  performance-tips: /core/effects/background-animations/stacking-and-zoom#effect-stacking
  lcars-grid-background: /core/effects/background-animations/stacking-and-zoom#examples
  honeycomb-zoom: /core/effects/background-animations/stacking-and-zoom#examples
  diagonal-stripes: /core/effects/background-animations/stacking-and-zoom#examples
  complex-layered-effect: /core/effects/background-animations/stacking-and-zoom#examples
  entity-binding: /core/effects/background-animations/binding-and-animation#entity-binding
  map-range-recommended: /core/effects/background-animations/binding-and-animation#map-range
  template-string-advanced: /core/effects/background-animations/binding-and-animation#templates
  which-keys-follow-an-entity: /core/effects/background-animations/binding-and-animation#which-keys-follow-an-entity
  animating-the-background: /core/effects/background-animations/binding-and-animation#animating-the-background
  example-warp-speed-on-red-alert: /core/effects/background-animations/binding-and-animation#animating-the-background
  animatable-keys: /core/effects/background-animations/binding-and-animation#animatable-keys
  animation-not-visible: /core/effects/background-animations#troubleshooting
  poor-performance: /core/effects/background-animations#troubleshooting
  pattern-misalignment: /core/effects/background-animations#troubleshooting
  colours-not-resolving: /core/effects/background-animations#troubleshooting
  performance-considerations: /core/effects/background-animations#troubleshooting
  canvas-rendering-optimization: /core/effects/background-animations#troubleshooting
  browser-compatibility: /core/effects/background-animations#troubleshooting
  resource-usage: /core/effects/background-animations#troubleshooting
  see-also: /core/effects/background-animations
---

# Background Animations

**`background_animation` draws moving layers behind a card's content: grids, starfields, nebulae, an LCARS data cascade, a warp field, a rotating planet.** It works on the button, elbow, slider, MSD and astrometrics cards.

- The value is a list of effects. Each entry names a `preset` and gives that preset's keys in `config`; the first entry is the bottom layer.
- The background sits behind the card's own fill, so it shows best on a card with a transparent fill, such as the button's `outline` preset, or inside an elbow's arms.
- On the MSD card it goes under `msd:` (`msd.background_animation`); on every other card it is a top-level key.

::: tip Try it
- The button and elbow editors have a Background Animation section on the Effects tab, with every preset's keys and a live preview. The MSD and Astrometrics Studios have one too.
:::

| Page | Covers |
|------|--------|
| [Preset Reference](./background-animations/preset-reference) | Every preset and its `config` keys |
| [Stacking and Zoom](./background-animations/stacking-and-zoom) | Layering several effects, the zoom wrapper, example backgrounds |
| [Binding and Animation](./background-animations/binding-and-animation) | Keys that follow an entity, animating the background from triggers and rules, the animatable keys |

---

## Quick start

**Two backgrounds to start from: a scrolling grid behind a button, and a data cascade inside an elbow's arms.**

- Give the card some height (`grid_options.rows` in a sections view) so there is room to see the effect.
- On an elbow, `inset: auto` keeps the background inside the bars; see [Canvas options](#canvas-options).

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
      color: alpha(var(--lcars-orange), 0.4)
      scroll_speed_x: 15
      scroll_speed_y: 15
```

```yaml live
type: custom:lcards-elbow
grid_options:
  rows: 4
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    color: var(--lcars-orange)
background_animation:
  inset: auto # inside the bars
  effects:
    - preset: cascade
```

## Available presets

**`preset` picks the effect; the [Preset Reference](./background-animations/preset-reference) lists each one's `config` keys.** There are seventeen.

- `config` is optional for most presets: a key you leave out takes the preset's default. `image` needs a `source`.
- The presets marked WebGL draw on the GPU where the browser has WebGL and fall back to a Canvas2D version where it does not; see [WebGL presets](#webgl-presets).

| Preset | Draws |
|--------|-------|
| [`grid`](./background-animations/preset-reference#grid) | A grid with optional major and minor lines; polar rings and spokes (`pattern: polar`); on WebGL also a perspective floor (`view: floor`) or a cylinder, dome, sphere or funnel (`surface`) |
| [`grid-diagonal`](./background-animations/preset-reference#grid-diagonal) | Diagonal hatching (WebGL) |
| [`grid-hexagonal`](./background-animations/preset-reference#grid-hexagonal) | A honeycomb (WebGL) |
| [`starfield`](./background-animations/preset-reference#starfield) | Scrolling stars in parallax depth layers |
| [`nebula`](./background-animations/preset-reference#nebula) | Soft nebula clouds; `volumetric: true` shades them with noise on WebGL |
| [`contour-field`](./background-animations/preset-reference#contour-field) | Banded contours like a star chart (WebGL) |
| [`cascade`](./background-animations/preset-reference#cascade) | The LCARS data waterfall: rows of numbers cycling colour |
| [`level`](./background-animations/preset-reference#level) | A fill bar with waves and sloshing, for a tank or gauge |
| [`fluid`](./background-animations/preset-reference#fluid) | A swirling colour wash (WebGL) |
| [`plasma`](./background-animations/preset-reference#plasma) | Two-colour plasma bands (WebGL) |
| [`flow`](./background-animations/preset-reference#flow) | Streaks streaming in one direction |
| [`shimmer`](./background-animations/preset-reference#shimmer) | A highlight band sweeping across |
| [`scanlines`](./background-animations/preset-reference#scanlines) | CRT-style scanlines |
| [`image`](./background-animations/preset-reference#image) | An image, fixed or from an entity |
| [`solid`](./background-animations/preset-reference#solid) | A flat colour |
| [`warp-starfield`](./background-animations/preset-reference#warp-starfield) | Stars flying at you in 3D, streaking at speed (WebGL; `starfield` without it) |
| [`holo-sphere`](./background-animations/preset-reference#holo-sphere) | A rotating wireframe planet with a scan band (WebGL; the same look on Canvas2D) |

## WebGL presets

**Some presets draw on the GPU with three.js where the browser has WebGL, and fall back to Canvas2D where it does not, so the background never goes blank.** `renderer` on the entry chooses.

- `warp-starfield` and `holo-sphere` are three.js scenes. Without WebGL, `warp-starfield` draws a `starfield` and `holo-sphere` the same sphere on Canvas2D.
- `grid`, `grid-diagonal` and `grid-hexagonal` draw the same pixels as their Canvas2D versions in the flat view. On WebGL they also do a perspective floor with a camera ([grid views](./background-animations/preset-reference#grid-views-and-camera)), cylinders, domes and spheres seen from outside or inside ([grid surfaces](./background-animations/preset-reference#grid-surfaces)), and funnels that can morph and ripple ([grid wells](./background-animations/preset-reference#grid-wells)).
- `contour-field`, `plasma` and `fluid` draw the same field on the GPU, with the same keys. On WebGL their noise keys become [animatable](./background-animations/binding-and-animation#animatable-keys).
- `nebula` uses WebGL only with `volumetric: true` (opt-in, because it changes the look); without WebGL it draws the plain clouds.

<CardGallery set="background-webgl" />

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: WARP
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: warp-starfield
    config:
      count: 400
```

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: CANVAS2D
    show: true
grid_options:
  rows: 3
background_animation:
  # always the Canvas2D version: for warp-starfield, a starfield
  - preset: warp-starfield
    renderer: canvas
    config:
      count: 400
```

::: details More about WebGL presets
- **One context:** a WebGL preset loads only when a card uses it, and all of them share one WebGL context across the dashboard. Each sits in the stack like any other entry.
- **Why the GPU helps the noise presets:** on the CPU, `contour-field`, `plasma` and `fluid` work out their whole field when they first draw, resize or change alert colours, which can pause the page for a moment on a large background. On the GPU they don't.
- **A lost context:** if a three.js scene fails to start or loses its context, that entry switches to its Canvas2D version for good.
- **Off-screen:** a three.js scene gives the shared context back while its card is off the page.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `renderer` | string | `auto` | `auto`: WebGL when the browser has it, Canvas2D otherwise. `webgl`: the same, stated outright. `canvas`: always the Canvas2D version (no GPU use). Presets that are Canvas2D only ignore it |

## Effect options

**The keys of one entry in the list: which preset, its settings, and how it is drawn.** Any number of entries can be stacked; see [Stacking and Zoom](./background-animations/stacking-and-zoom).

- Colours in `config` take every LCARdS colour form: CSS variables, `theme:` tokens, `alpha()` and the other computed colours, rgba and hex. See [Colours](../colours).
- Any `config` value can follow an entity with `map_range` or a template; see [Binding and Animation](./background-animations/binding-and-animation).

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: DEFLECTOR
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: starfield
    config:
      count: 150
      speed: 0.5 # half speed
  # kept in the list, drawn only once enabled
  - preset: grid
    enabled: false
    config:
      color: alpha(var(--lcars-orange), 0.3)
```

::: details More about effect options
- **`speed` and the zoom wrapper:** `speed` also runs the [zoom](./background-animations/stacking-and-zoom#zoom-wrapper) cycle faster, whether it is fixed in `config`, bound to an entity or animated.
- **Disabled entries keep their place:** an entry with `enabled: false` still counts when an animation picks an entry by number (`effect:`).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `preset` | string | required | The effect: see [Available presets](#available-presets) |
| `config` | object | the preset's defaults | The preset's own keys: see the [Preset Reference](./background-animations/preset-reference) |
| `config.speed` | number | `1` | Time multiplier for every preset that moves (all but `image` and `solid`): `2` is twice as fast, `0` freezes it. On `shimmer` it is the sweep speed in px per second (default `6`) |
| `enabled` | boolean | `true` | `false` keeps the entry in the list but draws nothing |
| `renderer` | string | `auto` | For presets with a WebGL version: see [WebGL presets](#webgl-presets) |
| `transition` | number | `500` | Milliseconds an [entity-bound](./background-animations/binding-and-animation#entity-binding) value takes to glide to a new value. `0` snaps |
| `zoom` | object | - | Draws the effect as layers zooming outward: see [Zoom wrapper](./background-animations/stacking-and-zoom#zoom-wrapper) |

## Canvas options

**To set where the background is drawn, or its frame rate, write `background_animation` as an object with the list under `effects`.** `inset` keeps the canvas off the card's edges, for a sidebar or footer bar that should stay clear.

- `inset: auto` works on elbow cards: it fits the canvas inside the elbow's arms and follows the bars when they change. The [elbow's appearance page](/cards/elbow/appearance#background-animation-inset) covers how it treats each elbow type. On every other card `auto` means no inset.
- A side you leave out of an `inset` object is `0`.
- `fps` caps how often the background redraws. It is read only in the object form.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: CANVAS INSET
    show: true
grid_options:
  rows: 3
background_animation:
  inset:
    left: 60 # keep the left 60 px clear
    bottom: 20
  effects:
    - preset: grid-hexagonal
      config:
        hex_radius: 20
        color: alpha(var(--lcars-ice), 0.4)
```

::: details More about canvas options
- **Frame rate:** the default cap of 30 frames per second is plenty for ambient motion and spares low-end devices such as wall tablets. Set `60` for a smoother look on a desktop or high-refresh screen; `0` removes the cap. The editor's Canvas Settings section sets it.
- **Size:** the canvas follows the card's size as it changes (a sections grid settling, the sidebar opening), less the inset, and is never smaller than 1 px.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `background_animation` | list / object | - | A list of effects, or an object with `effects`, `inset` and `fps` |
| `effects` | list | required in the object form | The effects, bottom layer first: see [Effect options](#effect-options) |
| `inset` | string / object | none | `auto`: inside an elbow's arms (no inset on other cards). An object: px per side |
| `inset.top` | number | `0` | Space kept clear at the top, px |
| `inset.right` | number | `0` | Space kept clear on the right, px |
| `inset.bottom` | number | `0` | Space kept clear at the bottom, px |
| `inset.left` | number | `0` | Space kept clear on the left, px |
| `fps` | number | `30` | Most frames per second the background draws. `0`: no cap |

## Troubleshooting

**When a background doesn't show, looks wrong or slows a device down, check these first.**

- **Nothing shows:** the card's own fill may cover it (try the button's `outline` preset), the colour may be fully transparent, or the card may have no height to draw in. A preset name the card doesn't know is logged in the browser console and that entry is skipped.
- **A colour doesn't resolve:** check that a `theme:` token path exists in the active theme ([Themes](../themes/)). Quote hex colours (`"#ff9966"`): unquoted, YAML reads everything after `#` as a comment.
- **A device slows down:** use fewer stacked effects and fewer zoom layers, wider `line_spacing`, and set scroll speeds to `0` where you don't need the motion.

::: details More about how a background runs
- **Pauses on its own:** the background stops drawing while its card is scrolled off the page or the browser tab is hidden, and carries on where it left off.
- **Reduced motion:** when the device asks for reduced motion, the background draws one frame and holds it.
- **A struggling device:** if the frame rate falls very low, the background pauses itself and tries again later.
- **Patterns that line up:** stacked grids line up best with the same `line_spacing` (or multiples of it), and major line intervals that divide the card's size evenly.
- **A different system:** [Animations](../animations) animate a card's own parts; background animations are drawn on a canvas behind them. An animation can still [target the background](./background-animations/binding-and-animation#animating-the-background). [Filters](./filters) are SVG filter effects on the card.
:::
