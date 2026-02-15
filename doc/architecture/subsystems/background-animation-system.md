# Background Animation System Architecture

> **Canvas2D rendering architecture for animated card backgrounds**

The Background Animation System provides a modular, preset-based framework for rendering dynamic Canvas2D effects behind card content. It supports effect stacking, optional zoom transformations, and infinite scrolling patterns.

---

## 🏗️ System Overview

### Architecture Components

```
BackgroundAnimationRenderer (Canvas2DRenderer)
    ├─ Effect Stack (Array<BaseEffect | ZoomEffect>)
    │   ├─ GridEffect (BaseEffect)
    │   ├─ ZoomEffect (Wrapper)
    │   │   └─ Wrapped BaseEffect
    │   └─ Additional Effects...
    │
    ├─ Preset System (BACKGROUND_PRESETS)
    │   ├─ Factory Functions
    │   └─ Default Configurations
    │
    └─ Offscreen Pattern Canvas (cached)
```

### Key Classes

| Class | Purpose | File |
|-------|---------|------|
| `BackgroundAnimationRenderer` | Main renderer, manages effect stack | `BackgroundAnimationRenderer.js` |
| `BaseEffect` | Abstract base for all effects | `BaseEffect.js` |
| `GridEffect` | Configurable grid pattern effect | `GridEffect.js` |
| `ZoomEffect` | Layered scaling wrapper | `ZoomEffect.js` |
| `BACKGROUND_PRESETS` | Preset registry | `presets/index.js` |

---

## 📊 Data Flow

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
// Canvas2DRenderer.animate()
1. Calculate deltaTime since last frame
2. Update all effects: effect.update(deltaTime, width, height)
3. Clear canvas
4. Draw all effects: effect.draw(ctx, width, height)
5. requestAnimationFrame(next frame)
```

### 3. Effect Rendering

```javascript
// GridEffect.draw()
1. Check if active: if (!this.isActive()) return
2. Update scroll offset based on deltaTime
3. Draw pattern to offscreen canvas (if not cached)
4. Tile pattern across visible canvas with infinite scroll
5. Draw major lines (if enabled)
```

---

## 🎨 Effect Interface (BaseEffect)

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

## 🔍 ZoomEffect Wrapper Architecture

`ZoomEffect` is a **compositor** (not a BaseEffect subclass) that wraps any effect with layered scaling.

### Why Not Extend BaseEffect?

- Zoom is a **transformation wrapper**, not an independent effect
- It delegates to a base effect's `update()` and `draw()` methods
- It renders multiple scaled/faded layers of the same effect
- Composition over inheritance for flexibility

### Implementation

```javascript
class ZoomEffect {
  constructor(config) {
    this._baseEffect = config.baseEffect;  // Wrapped effect
    this._layers = config.layers ?? 4;
    this._scaleFrom = config.scaleFrom ?? 0.5;
    this._scaleTo = config.scaleTo ?? 2.0;
    this._duration = config.duration ?? 15;
    // ... opacity thresholds
  }

  isActive() {
    return this._isActive && this._baseEffect.isActive();
  }

  update(deltaTime, width, height) {
    this._time += deltaTime / 1000;
    this._baseEffect.update(deltaTime, width, height);
  }

  draw(ctx, width, height) {
    for (let i = 0; i < this._layers; i++) {
      const progress = (i / (this._layers - 1)) * 100;
      const scale = this._interpolateScale(progress);
      const opacity = this._calculateOpacity(progress);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(width / 2, height / 2);
      ctx.scale(scale, scale);
      ctx.translate(-width / 2, -height / 2);

      this._baseEffect.draw(ctx, width, height);

      ctx.restore();
    }
  }
}
```

### Key Features

- **Layered Rendering**: Renders N scaled instances of base effect
- **Opacity Fading**: Fade-in and fade-out based on progress percentage
- **Scale Interpolation**: Linear interpolation from `scaleFrom` to `scaleTo`
- **Time Management**: Cycles animation over `duration` seconds
- **Delegation**: Calls base effect's `update()` and `draw()` methods

---

## 🎯 Preset System

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
- **Variants**: `grid-diagonal`, `grid-hexagonal`, `grid-filled`
- **No zoom presets**: Zoom is applied via wrapper, not dedicated presets

### Current Presets

| Preset | Effect(s) | Description |
|--------|-----------|-------------|
| `grid` | GridEffect | Unified grid with spacing/cell-based sizing and major/minor divisions |
| `grid-diagonal` | GridEffect | 45° diagonal hatch pattern |
| `grid-hexagonal` | GridEffect | Honeycomb hexagonal tessellation |
| `grid-filled` | GridEffect | Grid with cell background fills |

---

## 📐 GridEffect Deep Dive

### Pattern Types

```javascript
const PATTERNS = {
  both: 'both',           // Horizontal + vertical lines
  horizontal: 'horizontal', // Horizontal lines only
  vertical: 'vertical',   // Vertical lines only
  diagonal: 'diagonal',   // 45° diagonal lines
  hexagonal: 'hexagonal'  // Hexagonal tessellation
};
```

### Sizing Modes

#### Spacing-Based

```javascript
lineSpacing: 40  // 40px between lines
```

Calculates line count based on canvas dimensions:

```javascript
const numRows = Math.ceil(height / lineSpacing) + 1;
const numCols = Math.ceil(width / lineSpacing) + 1;
```

#### Cell-Based

```javascript
numRows: 10
numCols: 10
```

Calculates spacing based on canvas dimensions:

```javascript
const rowSpacing = height / numRows;
const colSpacing = width / numCols;
```

### Major/Minor Line System

Major lines are drawn at intervals over the base grid:

```javascript
// Configuration
majorRowInterval: 5      // Major line every 5 rows
majorColInterval: 5      // Major line every 5 columns

// Drawing logic
if (majorRowInterval > 0 && row % majorRowInterval === 0) {
  ctx.strokeStyle = colorMajor;
  ctx.lineWidth = lineWidthMajor;
} else {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidthMinor;
}
```

**Setting to 0 disables major lines** (simple mode).

### Hexagonal Pattern Geometry

Hexagons are drawn with proper tiling dimensions:

```javascript
const hexHeight = hexRadius * Math.sqrt(3);
const patternWidth = 3 * hexRadius;   // 2 hexagon columns
const patternHeight = 2 * hexHeight;  // 2 hexagon rows with stagger
```

Each pattern tile contains 3×3 hexagons to ensure seamless tiling:

```javascript
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    const globalRow = Math.floor(offsetY / hexHeight) + row;
    const globalCol = Math.floor(offsetX / (1.5 * hexRadius)) + col;

    const isMajor =
      (majorRowInterval > 0 && globalRow % majorRowInterval === 0) &&
      (majorColInterval > 0 && globalCol % majorColInterval === 0);

    // Draw hexagon with major/minor styling
  }
}
```

### Infinite Scrolling

Patterns use modulo arithmetic for seamless infinite scrolling:

```javascript
// Update scroll offset
this._offsetX += (scrollSpeedX / 1000) * deltaTime;
this._offsetY += (scrollSpeedY / 1000) * deltaTime;

// Wrap offset to pattern dimensions
this._offsetX %= patternWidth;
this._offsetY %= patternHeight;

// Tile pattern with offset
for (let x = -patternWidth; x < width + patternWidth; x += patternWidth) {
  for (let y = -patternHeight; y < height + patternHeight; y += patternHeight) {
    ctx.drawImage(patternCanvas, x - offsetX, y - offsetY);
  }
}
```

### Fill Color Support

Fill color renders cell backgrounds before line strokes:

```javascript
if (fillColor) {
  ctx.fillStyle = ColorUtils.resolveCssVariable(fillColor, ctx.canvas);
  for (let row = 0; row < numRows; row++) {
    for (let col = 0; col < numCols; col++) {
      const x = col * colSpacing;
      const y = row * rowSpacing;
      ctx.fillRect(x, y, colSpacing, rowSpacing);
    }
  }
}
```

---

## 🎭 Effect Stacking

### Rendering Order

Effects render in array order (first = bottom, last = top):

```javascript
for (const effect of this._effects) {
  if (effect.isActive()) {
    effect.draw(ctx, width, height);
  }
}
```

### Alpha Blending

Effects should use RGBA colors with alpha < 1.0 for transparency:

```javascript
color: "rgba(255, 153, 102, 0.3)"  // 30% opacity
```

Canvas uses **source-over compositing** by default, allowing layers to blend.

### Performance Optimization

- **Skip inactive effects**: `isActive()` check before rendering
- **Cache patterns**: Offscreen canvas for pattern generation
- **Limit layers**: 2-3 effects maximum for smooth performance

---

## 🚀 Adding New Effects

### 1. Create Effect Class

```javascript
// src/core/packs/backgrounds/effects/StarfieldEffect.js
import { BaseEffect } from './BaseEffect.js';

export class StarfieldEffect extends BaseEffect {
  constructor(config) {
    super();
    this._stars = [];
    this._numStars = config.numStars ?? 100;
    this._speed = config.speed ?? 50;
    // Initialize stars
  }

  isActive() {
    return true;
  }

  update(deltaTime, width, height) {
    // Update star positions
    for (const star of this._stars) {
      star.y += (this._speed / 1000) * deltaTime;
      if (star.y > height) star.y = 0;
    }
  }

  draw(ctx, width, height) {
    ctx.fillStyle = 'white';
    for (const star of this._stars) {
      ctx.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  destroy() {
    this._stars = [];
  }
}
```

### 2. Add Preset

```javascript
// src/core/packs/backgrounds/presets/index.js
import { StarfieldEffect } from '../effects/StarfieldEffect.js';

export const BACKGROUND_PRESETS = {
  // ... existing presets

  'starfield': {
    name: 'Starfield',
    description: 'Scrolling starfield effect',

    createEffects(config) {
      return [new StarfieldEffect({
        numStars: config.num_stars ?? 100,
        speed: config.speed ?? 50,
        color: config.color ?? 'rgba(255, 255, 255, 0.8)'
      })];
    }
  }
};
```

### 3. Test Configuration

```yaml
background_animation:
  - preset: starfield
    config:
      num_stars: 200
      speed: 75
      color: "rgba(255, 255, 255, 0.9)"
```

---

## 🔧 Troubleshooting

### Pattern Seams Visible

**Cause**: Pattern dimensions don't tile correctly

**Solution**: Ensure pattern width/height match geometry:

```javascript
// For hexagons
patternWidth = 3 * hexRadius
patternHeight = 2 * hexHeight

// For grids
patternWidth = lineSpacing
patternHeight = lineSpacing
```

### Major Lines Not Aligning During Scroll

**Cause**: Major line calculation uses local pattern coordinates instead of global

**Solution**: Track global tile position:

```javascript
const globalRow = Math.floor(offsetY / lineSpacing) + row;
const isMajor = globalRow % majorRowInterval === 0;
```

### Poor Performance

**Optimization checklist**:
- ✅ Use offscreen canvas for pattern generation
- ✅ Cache patterns (don't regenerate each frame)
- ✅ Skip inactive effects with `isActive()` check
- ✅ Limit number of stacked effects
- ✅ Reduce zoom layers (3-4 instead of 6-8)
- ✅ Increase line spacing (fewer lines = better performance)

### Zoom Effect Not Visible

**Common issues**:
- Base effect `isActive()` returns false
- Opacity fade thresholds set incorrectly
- `scale_from` and `scale_to` too similar
- Layer count too low (use 3+ for smooth effect)

---

## 📊 Performance Benchmarks

### Test Configuration

- Canvas size: 600×400px
- Browser: Chrome 120 (hardware acceleration enabled)
- Hardware: M1 MacBook Pro

### Results

| Configuration | FPS | CPU Usage |
|--------------|-----|-----------|
| Single grid, no zoom | 60 | ~5% |
| Single grid + zoom (4 layers) | 60 | ~12% |
| Single hexagonal + zoom | 58 | ~15% |
| 2 effects stacked | 60 | ~10% |
| 3 effects + zoom | 55 | ~22% |
| 3 effects + 2 zooms | 45 | ~35% |

### Recommendations

- **Target 60 FPS**: Single effect or 2 simple stacked effects
- **Target 30 FPS**: 2-3 stacked effects with zoom
- **Avoid**: 3+ effects with multiple zooms (high CPU usage)

---

## 🔍 Code References

### Key Files

- **[BackgroundAnimationRenderer.js](../../../../../../src/core/packs/backgrounds/BackgroundAnimationRenderer.js)** - Main renderer
- **[BaseEffect.js](../../../../../../src/core/packs/backgrounds/effects/BaseEffect.js)** - Effect interface
- **[GridEffect.js](../../../../../../src/core/packs/backgrounds/effects/GridEffect.js)** - Grid effect implementation
- **[ZoomEffect.js](../../../../../../src/core/packs/backgrounds/effects/ZoomEffect.js)** - Zoom wrapper
- **[presets/index.js](../../../../../../src/core/packs/backgrounds/presets/index.js)** - Preset registry

### Related Systems

- **[Pack System](../pack-system.md)** - Background pack architecture
- **[Canvas2DRenderer](../../../../../../src/core/packs/Canvas2DRenderer.js)** - Base canvas renderer

---

## 📚 Future Enhancements

### Planned Features

- [ ] **StarfieldEffect**: Parallax scrolling star particles
- [ ] **NebulaEffect**: Animated gradient clouds with SVG filters
- [ ] **BracketEffect**: LCARS-style corner brackets
- [ ] **GeometricArrayEffect**: Animated geometric shapes
- [ ] **ScanLineEffect**: Horizontal/vertical scan line overlay

### Editor Integration

- [ ] Visual preset picker with thumbnails
- [ ] Dynamic config form based on selected preset
- [ ] Zoom toggle with sliders
- [ ] Effect list builder for stacking
- [ ] Live preview canvas

### Performance

- [ ] WebGL backend option for complex effects
- [ ] Effect LOD (Level of Detail) based on performance
- [ ] Adaptive layer count for zoom effects
- [ ] Worker thread offloading for pattern generation

---

*Last Updated: February 15, 2026*
