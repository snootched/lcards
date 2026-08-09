# Background Animation System Architecture

> **Canvas2D rendering architecture for animated card backgrounds**

The Background Animation System provides a modular, preset-based framework for rendering dynamic Canvas2D effects behind card content. It supports effect stacking, optional zoom transformations, and infinite scrolling patterns.

---

## System Overview

### Architecture Components

```
BackgroundAnimationRenderer (Canvas2DRenderer)
    ├─ Effect Stack (Array<BaseEffect | ZoomEffect>)
    │   ├─ GridEffect (BaseEffect)
    │   ├─ ZoomEffect (Wrapper)
    │   │   └─ Wrapped BaseEffect
    │   └─ Additional Effects...
    │
    └─ Preset System (BACKGROUND_PRESETS)
        ├─ Factory Functions
        └─ Default Configurations
```

### Key Classes

| Class | Purpose | File |
|-------|---------|------|
| `BackgroundAnimationRenderer` | Main renderer, manages effect stack | `BackgroundAnimationRenderer.js` |
| `Canvas2DRenderer` | Owns the visible `<canvas>`, RAF loop, and effect array | `renderers/Canvas2DRenderer.js` |
| `BaseEffect` | Abstract base for all effects | `effects/BaseEffect.js` |
| `GridEffect` | Configurable grid pattern effect | `effects/GridEffect.js` |
| `StarfieldEffect` | Scrolling starfield with parallax | `effects/StarfieldEffect.js` |
| `ZoomEffect` | Layered scaling wrapper | `effects/ZoomEffect.js` |
| `ImageEffect` | Static or entity-reactive image layer | `effects/ImageEffect.js` |
| `BACKGROUND_PRESETS` | Preset registry | `presets/index.js` |

**Shared utilities** (used by both `ImageEffect` and `ImageTextureEffect`):

| File | Role |
|---|---|
| `src/core/packs/shared/ImageLoader.js` | Singleton `<img>` cache; resolves `builtin:key` via AssetManager |
| `src/core/packs/shared/ImageDrawUtils.js` | CSS `background-size`/`background-position` math; SVG zero-dimension fallback |

---

## Data Flow

### 1. Configuration → Effects

```yaml
# User Configuration
background_animation:
  - preset: grid
    config: {...}
    zoom: {...}
```

```javascript
// BackgroundAnimationRenderer._loadEffects()
1. Normalize to array: Array.isArray(config) ? config : [config]
2. For each effect config:
   a. Get preset from BACKGROUND_PRESETS
   b. Call preset.createEffects(config.config)
   c. If config.zoom exists, wrap in ZoomEffect
   d. Add to effects array
3. Store effects in this._effects
```

### 2. Animation Loop

```javascript
// Canvas2DRenderer._animate()
1. Calculate deltaTime since last frame
2. Clear canvas
3. For each effect, in reverse array order (see Rendering Order below):
   update(deltaTime, width, height), then draw(ctx, width, height)
4. requestAnimationFrame(next frame)
```

### 3. Effect Rendering

```javascript
// GridEffect.draw()
1. Apply scroll offset via ctx.translate(scrollX, scrollY) — updated each frame, no bound/wrap
2. Compute how many tiles are needed to cover the viewport at the current scroll position
3. For each tile: draw cell fill, then minor grid lines, then major grid lines
   (batched into single stroke() calls per line style — no offscreen/cached canvas)
```

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
}
```

### Interface Contract

- **`isActive()`**: Return `false` to skip rendering (optimization)
- **`update()`**: Update internal state (time, positions, etc.)
- **`draw()`**: Render to provided canvas context
- **`destroy()`**: Clean up resources (listeners, timers, etc.)

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
    // Render the base effect ONCE per frame into an off-screen buffer —
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

Presets are defined in `presets/index.js` as factory functions:

```javascript
export const BACKGROUND_PRESETS = {
  'grid': {
    name: 'Grid',
    description: 'Configurable grid with major/minor line divisions',

    createEffects(config) {
      const gridConfig = {
        lineSpacing: config.line_spacing ?? 40,
        lineWidthMinor: config.line_width_minor ?? 1,
        color: config.color ?? 'rgba(255, 153, 102, 0.3)',
        // ... more params
      };

      return [new GridEffect(gridConfig)];
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

| Preset | Effect(s) | Description |
|--------|-----------|-------------|
| `grid` | GridEffect | Unified grid with spacing/cell-based sizing, major/minor divisions, optional cell fill |
| `grid-diagonal` | GridEffect | 45° diagonal hatch pattern with optional background fill |
| `grid-hexagonal` | GridEffect | Honeycomb hexagonal tessellation with optional cell fill |
| `starfield` | StarfieldEffect | Parallax multi-layer scrolling star field |
| `nebula` | NebulaEffect | Gas-cloud turbulence effect |
| `contour-field` | ContourFieldEffect | Topographic-style banded noise field (LCARS star-chart contour look) |
| `solid` | SolidEffect | Flat colour fill rendered behind the card SVG (cheapest preset — single fill per frame) |
| `cascade` | CascadeEffect | Falling character/symbol cascade |
| `level` | LevelTextureEffect | Animated fill-bar level indicator |
| `fluid` | FluidTextureEffect | Organic fractal noise blobs |
| `plasma` | PlasmaTextureEffect | Dual-colour energy wash |
| `flow` | FlowTextureEffect | Directional streaming currents |
| `shimmer` | ShimmerTextureEffect | Directional light-sweep highlight |
| `scanlines` | ScanlineTextureEffect | CRT scan-line overlay |
| `image` | ImageEffect | User-supplied image (static or entity-reactive via template URL) |


---

## Effect Stacking

### Rendering Order

`Canvas2DRenderer._animate()` updates and draws effects in **reverse array order** (`effects.length - 1` down to `0`), which allows an inactive effect to be safely removed mid-loop via `removeEffect()`. The practical result: the effect added **first** (index `0`) is drawn **last** and ends up visually **on top**; the effect added **last** is drawn first and sits at the **bottom**.

```javascript
for (let i = this.effects.length - 1; i >= 0; i--) {
  const effect = this.effects[i];
  if (!effect.isActive()) { this.removeEffect(effect); continue; }
  effect.update(deltaTime, width, height);
  effect.draw(ctx, width, height);
}
```

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
2. Every 60 frames, computes average FPS and emits a `lcards:performance-check` window event
3. Each `Canvas2DRenderer` subscribes to this event and acts on the payload
4. A 5-second settle window is applied on start/restart to discard startup jank

### Thresholds

| Threshold | Default | Behaviour |
|-----------|---------|----------|
| `reduceEffects` | 24 fps | `Canvas2DRenderer` skips every other render frame — halves draw work while keeping the RAF loop alive |
| `disable3D` | 12 fps | `Canvas2DRenderer.stop()` is called after **3 consecutive** checks below this level — recovery probe is scheduled automatically (see below) |

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
- Otherwise, `start()` is called — the PM's 5-second settle window resets so stale low-FPS readings are discarded, and the device gets a fresh evaluation.
- If FPS recovers: the renderer runs normally and the backoff counter resets on the next `clear()` / card destruction.
- If FPS is still too low: PM fires `shouldDisable3D` again → another stop + the next (longer) backoff delay.

This means a device that temporarily spikes under load (e.g. a heavy page load on an Android tablet) will automatically resume animations 5 minutes later, while a device that is genuinely overloaded will progressively back off to a 30-minute retry cadence rather than hammering start/stop.

### Relationship to the per-card `fps:` cap

- The `fps:` config key (default `30`) is a **render budget** — the canvas is only cleared and redrawn when at least `1000/fps` ms have elapsed since the last drawn frame. This is the primary throttle for CPU budget on low-end devices.
- The PM thresholds are **emergency degradation** — they activate only when the device genuinely cannot sustain even the capped rate.
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

Threshold changes via `setThresholds()` are session-only — they reset on page reload. To make them permanent, update the defaults in `src/core/animation/PerformanceMonitor.js`.


## See Also

- [Pack System](../subsystems/pack-system.md)
- [Animation Manager](../subsystems/animation-manager.md)
- [DataSource System](../subsystems/datasource-system.md)
