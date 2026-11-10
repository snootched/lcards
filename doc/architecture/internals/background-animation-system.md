# Background Animation System Architecture

> **Canvas2D and WebGL (three.js) rendering for animated card backgrounds**

The Background Animation System renders the `background_animation` layer of buttons, elbows (through the button), the MSD card and the astrometrics card (`new BackgroundAnimationRenderer(...)` in `src/cards/lcards-button.js`, `src/cards/lcards-msd.js`, `src/cards/lcards-astrometrics-card.js`, `src/core/astrometrics/warp-drive.js`). Each card gets one `<canvas>` and one Canvas2D loop. Effects come from presets and stack in config order; a preset can have a WebGL version, drawn with three.js on one WebGL context shared by the whole page and copied into the card's canvas, with its Canvas2D version as the fallback. Optional zoom wraps any effect in layered scaling.

All files below are under `src/core/packs/backgrounds/` unless a path says otherwise. User-facing configuration (every preset and its keys, stacking, zoom, binding and animating): [Background Animations](../../core/effects/background-animations.md) and its [Preset Reference](../../core/effects/background-animations/preset-reference.md).

---

## System Overview

### Architecture Components

```
BackgroundAnimationRenderer              one per card: config, canvas, observers, bindings
    ├─ Canvas2DRenderer                  the <canvas> 2D context, RAF loop, effect array
    │   └─ Effect stack (drawn in config order, first = bottom)
    │       ├─ BaseEffect subclasses     GridEffect, StarfieldEffect, NebulaEffect, ...
    │       ├─ ThreeSceneEffect          a three.js scene as one more effect
    │       │   └─ three-runtime.js      the page's shared WebGL context (lazy chunk)
    │       └─ ZoomEffect                wraps one effect in scaled, fading layers
    ├─ EffectHandle (one per entry)      stable anime.js target, binding glides
    └─ BACKGROUND_PRESETS                createEffects() / createWebGLEffects() per preset
```

### Key Classes

| Class / module | Purpose | File |
|-------|---------|------|
| `BackgroundAnimationRenderer` | One per card: resolves the config (bare list or `{ inset, fps, effects }`), creates the canvas and the `Canvas2DRenderer`, builds each entry (`_buildEntry()`), evaluates entity bindings (`updateHass()`), recolours for alert modes (`refreshColors()`), suspends and resumes, swaps a failed WebGL entry for its fallback | `BackgroundAnimationRenderer.js` |
| `Canvas2DRenderer` | Owns the visible `<canvas>`, the RAF loop, the FPS cap, the effect array; pauses for hidden tabs, off-screen cards and reduced motion; reacts to `PerformanceMonitor` | `renderers/Canvas2DRenderer.js` |
| `BaseEffect` | Base class of every effect (`update`, `draw`, `isActive`, `destroy`, `recolorFrom`, `animatableProps`) | `effects/BaseEffect.js` |
| `GridEffect`, `StarfieldEffect`, `NebulaEffect`, `ContourFieldEffect`, `CascadeEffect`, `SolidEffect`, `ImageEffect`, `HoloSphereEffect` | Canvas2D background effects | `effects/*.js` |
| `LevelTextureEffect`, `FluidTextureEffect`, `PlasmaTextureEffect`, `FlowTextureEffect`, `ShimmerTextureEffect`, `ScanlineTextureEffect` | Canvas2D effects shared with shape textures, reused by the `level`, `fluid`, `plasma`, `flow`, `shimmer` and `scanlines` presets | `src/core/packs/textures/effects/*.js` |
| `ZoomEffect` | Layered scaling wrapper (not a `BaseEffect` subclass) | `effects/ZoomEffect.js` |
| `ThreeSceneEffect` and subclasses | A three.js scene as an effect: `WarpStarfieldEffect`, `GridGLEffect`, `ContourFieldGLEffect`, `PlasmaGLEffect`, `FluidGLEffect` (via `NoiseFieldEffect`), `HoloSphereGLEffect`, `NebulaGLEffect` | `webgl/ThreeSceneEffect.js` |
| three runtime | The page's one shared `WebGLRenderer`, `acquire()` / `release()` / `render()`, context-loss handling; registers the anime.js three.js adapter | `webgl/three-runtime.js` |
| `webglAvailable()` | One-time WebGL2 probe; `markWebGLBroken()` after a lost context | `webgl/webgl-support.js` |
| Scene modules | `createScene()` per WebGL preset: `warp-starfield.js`, `grid.js`, `holo-sphere.js`, `nebula.js`, `field-scene.js` (with `contour-field.js`, `plasma.js`, `fluid.js`), plus shared GLSL and helpers | `webgl/scenes/*.js` |
| Shared models | Geometry both tiers draw from: `holo-sphere-model.js` (Canvas2D and WebGL holo sphere), `grid-surface-model.js` (curved grid surfaces) | `effects/*-model.js` |
| `EffectHandle` | One per `background_animation` entry, kept across rebuilds: the anime.js target for `target: background` animations and binding glides | `effect-handle.js` |
| effect adapter | Registers EffectHandle with anime.js (`registerAdapter`), reading and writing `animatableProps` | `effect-adapter.js` |
| `animatableProps` helpers | `numProp()` and friends for declaring animatable keys | `effects/animatable-props.js` |
| `BACKGROUND_PRESETS` | Preset registry | `presets/index.js` |

**Shared utilities** (used by both `ImageEffect` and `ImageTextureEffect`):

| File | Role |
|---|---|
| `src/core/packs/shared/ImageLoader.js` | Singleton `<img>` cache; resolves `builtin:key` via AssetManager |
| `src/core/packs/shared/ImageDrawUtils.js` | CSS `background-size`/`background-position` math; SVG zero-dimension fallback |

---

## Data Flow

### 1. Configuration to effects

```yaml
# User Configuration
background_animation:
  - preset: grid
    config: {...}
    zoom: {...}
```

```javascript
// BackgroundAnimationRenderer.init() -> _loadEffects() -> _buildEntry(entry, handle)
1. _resolveConfig(): a bare list, or { inset, fps, effects } (fps: the Canvas2DRenderer cap, default 30)
2. For each entry (index i):
   a. Get or create handles[i] (an EffectHandle; a new one only when the preset id changes)
   b. Pick the tier (see "WebGL (three.js) tier" below): createWebGLEffects() or createEffects()
   c. Resolve colours to concrete values, strip template-valued keys (updateHass() pushes them),
      give a seeded preset the handle's seed when the config sets none
   d. Apply a fixed `speed` to every effect
   e. If entry.zoom: wrap in ZoomEffect (a zoomed starfield: one starfield + ZoomEffect per layer)
   f. Add the drawn objects to the Canvas2DRenderer, in config order; handle.attach(effects, drawn)
3. Register each entry for entity bindings (updateHass), with its `transition`
4. Canvas2DRenderer.start(); attach an IntersectionObserver (not when the card is in preview mode, `isPreviewMode()`: the card editor, the card picker, dashboard edit mode) and a ResizeObserver
```

Each entry's `EffectHandle` is the stable anime.js target for `target: background` animations and for binding glides; see [Background effects as anime.js targets](../../development/anim-api.md#background-effects-as-anime-js-targets).

### 2. Animation Loop

```javascript
// Canvas2DRenderer._animate()
1. Return if stopped, suspended (off-screen) or paused for a hidden tab
2. Under reduced quality (PerformanceMonitor), skip every other tick
3. FPS cap: skip the tick until 1000 / fps ms have passed since the last drawn frame
4. _drawEffects(deltaTime): clear the canvas, then for each effect in array order
   (first = bottom): update(deltaTime, width, height), then draw(ctx, width, height),
   inside the effect's x/y/rotate/scale transform when one is set
5. Hard frame budget: a pass over 500 ms (after 3 cold-start frames) stops the loop
   and schedules a recovery probe
6. Under prefers-reduced-motion: keep this frame and schedule no more
7. requestAnimationFrame(next frame)
```

### 3. Effect Rendering

```javascript
// GridEffect.draw()
1. Apply scroll offset via ctx.translate(scrollX, scrollY) - updated each frame, no bound/wrap
2. Compute how many tiles are needed to cover the viewport at the current scroll position
3. For each tile: draw cell fill, then minor grid lines, then major grid lines
   (batched into single stroke() calls per line style - no offscreen/cached canvas)
```

A `ThreeSceneEffect` draws differently: it seeks its scene to the effect clock, renders it on the shared WebGL context and `drawImage()`s the result into the card's canvas at its place in the stack (next section).

### 4. Updates after start

| Trigger | Method | What happens |
|---|---|---|
| HASS update | `updateHass(hass, entity, cardConfig)` | Re-evaluates template and `map_range` values per entry and applies them to the handle (glide over `transition` ms, default 500, snap under reduced motion) or through the effect's `updateConfig()` |
| Alert mode / palette change | `refreshColors()` (from `LCARdSCard`, `LCARdSMSDCard._onAlertModeChanged()`) | Builds each entry again with the new palette; live effects copy the colours (`recolorFrom()`), or the entry is swapped in place keeping seed, clocks and animated values |
| Card off-screen / back | IntersectionObserver -> `suspendAnimation()` / `resumeAnimation()` | Loop pauses while the card is out of the viewport (tab hiding is handled by `visibilitychange` instead) |
| Card removed from the DOM (view change) | `suspend()` / `resume()` | Stops the loop and releases WebGL scenes (`releaseGPU()`), keeping canvas and effects |
| Container resize | ResizeObserver -> `handleResize()` | Canvas buffer follows the container size (minus the inset) |
| Permanent removal | `destroy()` | Tears down canvas, observers, effects and handles |

---

## WebGL (three.js) tier

Nine presets declare `renderer: 'webgl'` in `presets/index.js`. They come in two shapes:

- **Two versions in one preset** (`grid`, `grid-diagonal`, `grid-hexagonal`, `nebula`, `contour-field`, `fluid`, `plasma`, `holo-sphere`): `createWebGLEffects()` builds the three.js effect and `createEffects()` the Canvas2D one. `createWebGLEffects()` may return `null` when the config has no WebGL version (`nebula` without `volumetric: true`), and `_buildEntry()` then uses `createEffects()`.
- **WebGL only, with a named fallback** (`warp-starfield`): `createEffects()` builds the WebGL effect, and `fallback: 'starfield'` names the Canvas2D preset drawn instead, with the same config.

`_buildEntry()` (`BackgroundAnimationRenderer.js:461`) draws the Canvas2D version when the entry sets `renderer: canvas` (`auto` and `webgl` both prefer WebGL; schema in `src/cards/schemas/common-schemas.js`), when `webglAvailable()` is false, or after the entry failed once (`handle.forceFallback`). Canvas2D-only presets ignore `renderer`.

**How a scene reaches the card** (`webgl/ThreeSceneEffect.js`):

1. A `ThreeSceneEffect` is an ordinary effect in the card's `Canvas2DRenderer` stack, so the FPS cap, tab and off-screen pauses, `PerformanceMonitor`, the reduced-motion held frame, `_xform` and `ZoomEffect` apply unchanged.
2. On its first `draw()` it loads `three-runtime.js` and its scene module with dynamic `import()` (three.js stays out of the main chunk), acquires the shared renderer, builds the scene with `createScene({ params, colors })`, and compiles it off the frame (`compileAsync`) before the first real draw.
3. Each `draw()`: `scene.seek(elapsedTime)` (scene animations are anime.js animations built with `autoplay: false`, driven by the effect clock, so pause, held frames and `speed` changes need no extra code), `runtime.render(scene, camera, w, h)` on the shared context, then `ctx.drawImage()` of the rendered `w x h` region into the card's canvas at the effect's opacity.
4. **One context for the page** (`webgl/three-runtime.js`): browsers keep about 16 live WebGL contexts and drop the oldest, so every scene renders into one shared offscreen canvas (an `OffscreenCanvas` handing over an `ImageBitmap` where available, otherwise a DOM canvas). The canvas only grows; each render uses its bottom-left `w x h` corner. The last user to `release()` disposes the context.
5. **Failure**: a load or render error, or a lost context, calls `host.fail()`, which makes `_fallbackEntry()` rebuild that entry with the Canvas2D version at the same place in the stack. A lost shared context also calls `markWebGLBroken()`, so later cards on the page go straight to Canvas2D.
6. **Suspend**: `releaseGPU()` disposes the scene and releases the context; the next draw builds it again and its motion carries on from the effect clock.

**Scene module contract** (from the `ThreeSceneEffect` header): `createScene({ params, colors })` returns `{ scene, camera, seek(timeMs, effect), resize(w, h), setParam(key, value), setColors(colors), dispose() }`. Numeric keys declared with `sceneProp()` and colour keys with `sceneColorProp()` become animatable props that forward to the live scene.

| Preset | WebGL effect | Scene module | Canvas2D version |
|---|---|---|---|
| `warp-starfield` | `WarpStarfieldEffect` | `scenes/warp-starfield.js` (InstancedMesh, streaks with `speed`) | the `starfield` preset |
| `grid`, `grid-diagonal`, `grid-hexagonal` | `GridGLEffect` (the `GridEffect` as its model) | `scenes/grid.js` (flat, `view: floor`, curved `surface`s) | `GridEffect` (flat grid only) |
| `nebula` (`volumetric: true`) | `NebulaGLEffect` | `scenes/nebula.js` | `NebulaEffect` |
| `contour-field` | `ContourFieldGLEffect` | `scenes/field-scene.js` + `contour-field.js` | `ContourFieldEffect` |
| `plasma` | `PlasmaGLEffect` | `scenes/field-scene.js` + `plasma.js` | `PlasmaTextureEffect` |
| `fluid` | `FluidGLEffect` | `scenes/field-scene.js` + `fluid.js` | `FluidTextureEffect` |
| `holo-sphere` | `HoloSphereGLEffect` | `scenes/holo-sphere.js` (per-pixel sphere) | `HoloSphereEffect` (same `holo-sphere-model.js`) |

Importing `three-runtime.js` also registers the anime.js three.js adapter (`animejs/adapters/three`), so scenes animate cameras, meshes, instances, materials and uniforms with plain `animate()`. Tests and benchmarks read `stats()` from the runtime.

---

## Effect Interface (BaseEffect)

All effects must implement the `BaseEffect` interface:

```javascript
class BaseEffect {
  /**
   * Check if effect should render
   * @returns {boolean}
   */
  isActive() {}

  /**
   * Update effect state (called every frame)
   * @param {number} deltaTime - Time since last frame (ms)
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  update(deltaTime, width, height) {}

  /**
   * Render effect to canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  draw(ctx, width, height) {}

  /**
   * Cleanup resources
   */
  destroy() {}

  /** What anime.js and entity bindings may change live, keyed by YAML config key */
  static animatableProps = { opacity, speed };
}
```

### Interface Contract

- **`isActive()`**: Return `false` to skip rendering (optimization)
- **`update()`**: Update internal state (time, positions, etc.)
- **`draw()`**: Render to provided canvas context
- **`destroy()`**: Clean up resources (listeners, timers, etc.)
- **`speed`**: a time multiplier. `BaseEffect.update()` runs the elapsed clock at `speed`; an effect that moves by `deltaTime` multiplies by `this.speed` itself.
- **`static animatableProps`**: the keys that can be animated or glide on a binding; declare only what is cheap to change every frame (helpers in `effects/animatable-props.js`).

Optional hooks the renderer looks for:

- **`recolorFrom(fresh)`**: take the colours of a freshly built copy after a palette change and return `true`. `BaseEffect` implements it from `static recolorFields` (the fields to copy); an effect that bakes colours into images returns `false` and is rebuilt instead.
- **`updateConfig(values)`**: apply entity-bound values that are not in `animatableProps` (`_applyViaUpdateConfig()`).
- **`releaseGPU()`**: free GPU resources when the card leaves the page (`ThreeSceneEffect`).
- **`host`**: when an effect has this property, `_buildEntry()` sets it to `{ requestFrame, fail }` (a scene that finished loading asks for a frame; one that failed asks for its fallback).

---

## ZoomEffect Wrapper Architecture

`ZoomEffect` is a **compositor** (not a BaseEffect subclass) that wraps any effect with layered scaling.

### Why Not Extend BaseEffect?

- Zoom is a **transformation wrapper**, not an independent effect
- It delegates to a base effect's `update()` and `draw()` methods
- It renders multiple scaled/faded layers of the same effect
- Composition over inheritance for flexibility

### Implementation

```javascript
class ZoomEffect {
  constructor(config = {}) {
    this.baseEffect = config.baseEffect;  // Wrapped effect (required)
    this.layers = config.layers ?? 3;
    this.scaleFrom = config.scaleFrom ?? 1;
    this.scaleTo = config.scaleTo ?? 2;
    this.duration = config.duration ?? 10;      // seconds
    this.opacityFadeIn = config.opacityFadeIn ?? 10;   // percent
    this.opacityFadeOut = config.opacityFadeOut ?? 80; // percent
    // layerIndex/totalLayers (optional) let several ZoomEffect instances
    // act as one staggered layer each, instead of looping `layers` internally
  }

  isActive() {
    return this._isActive;  // does not additionally gate on baseEffect.isActive()
  }

  update(deltaTime, width, height) {
    this._elapsedTime += deltaTime / 1000;
    this.baseEffect.update(deltaTime, width, height);
  }

  draw(ctx, width, height) {
    // Render the base effect ONCE per frame into an off-screen buffer - 
    // every layer below stamps this buffer via drawImage() (a cheap GPU
    // blit) instead of re-running the full baseEffect.draw() N times.
    this._frameCtx.clearRect(0, 0, width, height);
    this.baseEffect.draw(this._frameCtx, width, height);

    const cycleProgress = (this._elapsedTime % this.duration) / this.duration;

    for (let i = 0; i < this.layers; i++) {
      const layerOffset = i / this.layers;  // or layerIndex/totalLayers in multi-instance mode
      const layerProgress = (cycleProgress + layerOffset) % 1.0;
      const scale = this.scaleFrom + (this.scaleTo - this.scaleFrom) * layerProgress;
      const opacity = this._fadeOpacity(layerProgress);  // ramps via opacityFadeIn/opacityFadeOut
      if (opacity <= 0) continue;

      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);
      ctx.globalAlpha = opacity;
      ctx.drawImage(this._frameCanvas, 0, 0);
      ctx.restore();
    }
  }
}
```

### Key Features

- **Layered Rendering**: Stamps N scaled copies of a single per-frame render of the base effect
- **Opacity Fading**: Fade-in and fade-out based on progress percentage
- **Scale Interpolation**: Linear interpolation from `scaleFrom` to `scaleTo`
- **Time Management**: Cycles animation over `duration` seconds
- **Delegation**: Calls base effect's `update()` every frame; `draw()` once per frame into an off-screen buffer, then `drawImage()`-stamps that buffer per layer

---

## Preset System

### Preset Structure

Presets are objects in `presets/index.js` keyed by preset id. `_buildEntry()` reads these members:

| Member | Required | Meaning |
|---|---|---|
| `name`, `description` | yes | Shown in the editor |
| `guide` | no | `{ summary, params: [{ key, default, description }], example }` for the editor and docs; a `seed` entry in `params` makes the renderer supply a seed |
| `createEffects(config, cardInstance)` | yes | Returns the effect instances (the Canvas2D version, or the WebGL effect for a `fallback` preset) |
| `renderer` | no | `'webgl'` when the preset has a WebGL version (an internal marker, not the YAML key) |
| `createWebGLEffects(config, cardInstance)` | no | The WebGL version; `null` means "no WebGL version for this config" |
| `fallback` | no | Id of the Canvas2D preset to draw instead of a WebGL-only preset |
| `options(config, cardInstance)` | no | A helper some presets share between both factories (defaults and theme tokens) |

```javascript
export const BACKGROUND_PRESETS = {
  'grid': {
    name: 'Grid',
    description: 'Configurable grid with major/minor line divisions',
    guide: { summary: '...', params: [/* ... */], example: '...' },
    renderer: 'webgl',

    createEffects(config, cardInstance = null) {
      return [new GridEffect(this.options(config, cardInstance))];
    },
    createWebGLEffects(config, cardInstance = null) {
      return gridWebGL(config, this.options(config, cardInstance));
    },
    options(config, cardInstance = null) {
      // line_spacing -> lineSpacing, theme-token defaults, ...
    }
  }
};
```

### Preset Registry Patterns

#### Single Effect Preset

```javascript
'grid': {
  createEffects(config) {
    return [new GridEffect(config)];
  }
}
```

#### Multi-Effect Preset

```javascript
'complex': {
  createEffects(config) {
    return [
      new GridEffect(config.grid),
      new HexEffect(config.hex)
    ];
  }
}
```

### Preset Naming Conventions

- **Base preset**: `grid`, `starfield`, `nebula`
- **Variants**: `grid-diagonal`, `grid-hexagonal`
- **No zoom presets**: Zoom is applied via wrapper, not dedicated presets

### Current Presets

Seventeen presets (`BACKGROUND_PRESETS`, `presets/index.js`). Their keys, defaults and examples are in the user docs ([Preset Reference](../../core/effects/background-animations/preset-reference.md)); the table here is the implementation map. The preset's own `guide` (summary, params, example) feeds the editor and the docs.

| Preset | Canvas2D effect | WebGL effect (`renderer: 'webgl'`) |
|--------|-----------------|-------------|
| `grid` | `GridEffect` | `GridGLEffect` |
| `grid-diagonal` | `GridEffect` | `GridGLEffect` |
| `grid-hexagonal` | `GridEffect` | `GridGLEffect` |
| `starfield` | `StarfieldEffect` | - |
| `warp-starfield` | the `starfield` preset (`fallback`) | `WarpStarfieldEffect` |
| `nebula` | `NebulaEffect` | `NebulaGLEffect` (only with `volumetric: true`) |
| `contour-field` | `ContourFieldEffect` | `ContourFieldGLEffect` |
| `holo-sphere` | `HoloSphereEffect` | `HoloSphereGLEffect` |
| `cascade` | `CascadeEffect` | - |
| `level` | `LevelTextureEffect` | - |
| `fluid` | `FluidTextureEffect` | `FluidGLEffect` |
| `plasma` | `PlasmaTextureEffect` | `PlasmaGLEffect` |
| `flow` | `FlowTextureEffect` | - |
| `shimmer` | `ShimmerTextureEffect` | - |
| `scanlines` | `ScanlineTextureEffect` | - |
| `image` | `ImageEffect` | - |
| `solid` | `SolidEffect` | - |

The config checker's registries take the preset ids straight from `BACKGROUND_PRESETS` (`scripts/lib/registries.js:77`); a new preset's keys go in its params schema (`src/cards/schemas/background-animation-params-schemas.js`).

---

## Effect Stacking

### Rendering Order

`Canvas2DRenderer._drawEffects()` (called from `_animate()`) updates and draws effects in **array order**: the effect added **first** (index `0`, the first `background_animation` entry) is drawn first and sits at the **bottom**; the last is drawn last, **on top**. This matches the user docs and the MSD overlay tie-break (same `z_index`: declared first is underneath). Inactive effects are collected during the pass and removed after it, so the array is never changed while it is iterated.

```javascript
let inactive = null;
for (const effect of this.effects) {
  if (!effect.isActive()) { (inactive ??= []).push(effect); continue; }
  effect.update(deltaTime, width, height);
  effect.draw(ctx, width, height);   // inside its _xform transform when set
}
inactive?.forEach((effect) => this.removeEffect(effect));
```

Before 2026.10 the loop ran backwards (to remove inactive effects mid-loop), which drew the stack upside down against the docs. `tests/browser/background-animation.spec.js` checks the order on a real canvas.

### Alpha Blending

Effects should use RGBA colours with alpha < 1.0 for transparency:

```javascript
color: "rgba(255, 153, 102, 0.3)"  // 30% opacity
```

Canvas uses **source-over compositing** by default, allowing layers to blend.

### Performance Optimization

- **Skip inactive effects**: `isActive()` check before rendering (and the effect is removed from the stack)
- **Frame-buffer reuse in `ZoomEffect`**: the wrapped effect's `draw()` runs once per frame into an off-screen canvas; each zoom layer stamps that buffer via `drawImage()` instead of re-running the full draw path
- **Limit layers**: 2-3 effects maximum for smooth performance

---

## Animation Governor (PerformanceMonitor)

`AnimationPerformanceMonitor` (`src/core/animation/PerformanceMonitor.js`) is a global singleton (`window.lcards.core.performanceMonitor`) that runs a single RAF loop to measure device FPS independently of any card's render loop. It is ref-counted: it starts when the first `Canvas2DRenderer` starts and stops when the last one stops.

### How It Works

1. Maintains a rolling 60-frame window of inter-frame deltas
2. Once every 60 frames (about once a second at 60 fps) computes the average FPS over the window and, after the settle window, emits a `lcards:performance-check` window event (`fps`, `shouldReduceEffects`, `shouldDisable3D`). A restart of the loop begins a new window, so the time it was stopped never counts as a frame
3. Each `Canvas2DRenderer` subscribes to this event and acts on the payload
4. A 5-second settle window is applied on start/restart to discard startup jank

### Thresholds

| Threshold | Default | Behaviour |
|-----------|---------|----------|
| `reduceEffects` | 24 fps | `Canvas2DRenderer` skips every other render frame, halves draw work while keeping the RAF loop alive |
| `disable3D` | 12 fps | `Canvas2DRenderer.stop()` is called after **3 consecutive** checks below this level (below 12 fps, 60 frames take over 5 s, so at least 15 s of low frame rate); recovery probe is scheduled automatically (see below) |

Besides these thresholds, `Canvas2DRenderer` has its own **hard frame budget**: one update and draw pass over 500 ms (`hardFrameBudgetMs`) stops the loop at once and takes the same recovery path, except during the first 3 frames after `start()` (`coldStartGraceFrames`), which are only logged.

Note: these thresholds measure **device-level FPS** (the PM's own RAF loop), not the per-card capped output rate configured via `fps:`. A card capped at 30fps on a 60fps device will show 60fps in the PM.

### Recovery Mechanism

When `shouldDisable3D` triggers, the animation does not stop permanently. A recovery probe is scheduled automatically using exponential backoff:

| Attempt | Delay before probe |
|---------|--------------------|
| 1st kill | 5 min |
| 2nd kill | 10 min |
| 3rd kill | 20 min |
| 4th+ kill | 30 min (cap) |

When the probe fires:
- If the tab is hidden or the card is off-screen, the probe is deferred (without consuming the backoff slot) and rescheduled at the same delay.
- Otherwise, `start()` is called; the PM's 5-second settle window resets so stale low-FPS readings are discarded, and the device gets a fresh evaluation.
- If FPS recovers: the renderer runs normally and the backoff counter resets on the next `clear()` / card destruction.
- If FPS is still too low: PM fires `shouldDisable3D` again → another stop + the next (longer) backoff delay.

This means a device that temporarily spikes under load (e.g. a heavy page load on an Android tablet) will automatically resume animations 5 minutes later, while a device that is genuinely overloaded will progressively back off to a 30-minute retry cadence rather than hammering start/stop.

### Relationship to the per-card `fps:` cap

- The `fps:` config key (default `30`) is a **render budget**: the canvas is only cleared and redrawn when at least `1000/fps` ms have elapsed since the last drawn frame. This is the primary throttle for CPU budget on low-end devices.
- The PM thresholds are **emergency degradation**: they activate only when the device genuinely cannot sustain even the capped rate.
- The thresholds are intentionally set below the default 30fps cap so that normal 30fps operation never spuriously triggers frame-skipping.

### Console Troubleshooting

All PM state is exposed via the browser console:

```javascript
// Current measured FPS
window.lcards.core.performanceMonitor.getFPS()

// Current thresholds
window.lcards.core.performanceMonitor.thresholds
// → { disable3D: 12, reduceEffects: 24 }

// Override thresholds for a session (e.g. to test behaviour on fast hardware)
window.lcards.core.performanceMonitor.setThresholds({ reduceEffects: 50, disable3D: 30 })

// Number of active Canvas2DRenderer subscribers
window.lcards.core.performanceMonitor._refCount

// Check / inspect recovery state on a renderer instance
// (renderer = card._backgroundRenderer.renderer, the Canvas2DRenderer)
renderer._disabledByPerformance  // true = currently stopped by PM, recovery pending
renderer._recoveryAttempts        // how many times PM has killed this renderer
renderer._recoveryTimer           // non-null = probe is scheduled

// Force an immediate recovery restart (cancels any pending timer)
if (renderer._recoveryTimer) { clearTimeout(renderer._recoveryTimer); renderer._recoveryTimer = null; }
renderer._disabledByPerformance = false;
renderer.start();

// Enable verbose animation logging to trace PM events
window.lcards.setGlobalLogLevel('debug')
```

Threshold changes via `setThresholds()` are session-only; they reset on page reload. To make them permanent, update the defaults in `src/core/animation/PerformanceMonitor.js`. The same state is on `window.lcards.debug.perf` ([Debug API: `perf`](../../development/debug-api.md#perf-performance-monitor)); the monitor itself is described under [Animation Manager: PerformanceMonitor](../subsystems/animation-manager.md#performancemonitor).



## See Also

- [Background Animations](../../core/effects/background-animations.md) (user docs) and its [Preset Reference](../../core/effects/background-animations/preset-reference.md)
- [Shape Texture System](./shape-texture-system.md) (the texture effects the `level`, `fluid`, `plasma`, `flow`, `shimmer` and `scanlines` presets reuse)
- [MSD Rendering Pipeline](../msd/index.md) (the MSD `background_animation` layer)
- [Pack System](../subsystems/pack-system.md)
- [Animation Manager](../subsystems/animation-manager.md)
- [DataSource System](../subsystems/datasource-system.md)
