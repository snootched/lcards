# Colour Resolution — Developer Guide

LCARdS supports three forms of colour expression throughout the theming, rules, and background animation systems. **Using the wrong resolution API is the most common source of computed colours silently not working.** This guide defines the correct pattern for each context.

---

## Colour Expression Forms

| Form | Example | Notes |
|------|---------|-------|
| Concrete value | `#93e1ff`, `rgba(0,200,255,0.7)` | Passed through unchanged |
| CSS variable | `var(--lcars-blue-light, #93e1ff)` | Resolved via `getComputedStyle` |
| Computed expression | `darken(var(--lcars-blue), 0.3)` | Requires two-step resolution |

Supported computed functions: `lighten`, `darken`, `alpha`, `saturate`, `desaturate`, `mix`

---

## The Resolution Chain

Colour resolution is a **two-step process**:

```
User config value
       │
       ▼
ThemeTokenResolver.resolve(val, val)
  • Handles computed expressions: darken(var(--x), 0.3) → '#1a3d66'
  • Handles token references: 'colors.accent.primary' → 'var(--lcars-orange)'
  • Passes through CSS vars and concrete values unchanged
       │
       ▼
ColorUtils.resolveCssVariable(val, fallback)
  • Materialises any remaining var(--name) → '#ff9900'
  • Passes through concrete hex/rgb values unchanged
       │
       ▼
Concrete colour string usable by Canvas2D, anime.js, fillStyle, etc.
```

**Why two steps?**
`ThemeTokenResolver` outputs `var(--name)` CSS strings for CSS-variable inputs (useful in Lit/CSS contexts). Canvas2D APIs (`fillStyle`, gradients) cannot use `var()` strings — they need materialised hex/rgb values. `resolveCssVariable` performs that final materialisation.

---

## Correct Patterns by Context

### A. Cards and CSS/Lit contexts

`ThemeTokenResolver.resolve()` alone is sufficient — the browser renders `var()` strings natively.

```javascript
// In a card or style resolver
const resolver = window.lcards?.core?.themeManager?.resolver;
const color = resolver ? resolver.resolve(rawValue, rawValue) : rawValue;

// Use directly as a CSS value
this.style.setProperty('--my-color', color);
```

Also used by `state-color-resolver.js` for all state-based colour lookups.

---

### B. Canvas2D effect constructors and per-frame draw calls

Always use **both steps** — the resolved value must be a concrete colour.

```javascript
import { ColorUtils } from '../../../themes/ColorUtils.js';

// In constructor or draw():
const _resolver = window.lcards?.core?.themeManager?.resolver;
const _resolve = (c) => ColorUtils.resolveCssVariable(
  (_resolver ? _resolver.resolve(c, c) : c), c
);

this.resolvedColor = _resolve(config.color);
// Works for: '#ff9900', 'var(--lcars-orange)', 'darken(var(--lcars-orange), 0.3)'
```

For **arrays of colours** (e.g. Nebula, Starfield):

```javascript
this.resolvedColors = this.colors.map(_resolve);
```

---

### C. Effect `updateConfig()` methods

Live config updates arrive **after** `_resolveConfigColors` preprocessing has already run, so `updateConfig` must also apply the two-step pattern — it cannot rely on the preprocessing pipeline.

```javascript
updateConfig(cfg) {
  super.updateConfig(cfg);
  if (cfg.color !== undefined) {
    const _res = window.lcards?.core?.themeManager?.resolver;
    this._color = ColorUtils.resolveCssVariable(
      _res ? _res.resolve(cfg.color, cfg.color) : cfg.color,
      this._defaultColor
    );
  }
}
```

---

### D. Background preset `createEffects` (config preprocessing path)

When effects are created via `BackgroundAnimationRenderer`, `_resolveConfigColors()` is called automatically on the config object before `createEffects` receives it. This handles:

- Top-level string values: `color: 'darken(var(--lcars-blue), 0.2)'`
- Nested plain objects: `colors: { start: 'var(--lcars-blue)', text: '...' }`
- Arrays of strings: `colors: ['darken(...)', '#ff0']`

**You do not need to manually resolve colours inside `createEffects`** — the config passed in is already concrete. However, effect **constructors** still need to handle the case where they are instantiated directly (outside the preset pipeline), so they should always use the two-step pattern themselves (see **Context B**).

---

## Anti-Patterns

❌ **Bare `ColorUtils.resolveCssVariable()`** on user-facing colour config
This handles `var(--name)` but silently ignores computed expressions like `darken(var(--x), 0.3)`.

```javascript
// ❌ WRONG — computed expressions are silently ignored
this.color = ColorUtils.resolveCssVariable(config.color);

// ✅ CORRECT — handles all three expression forms
const _res = window.lcards?.core?.themeManager?.resolver;
this.color = ColorUtils.resolveCssVariable(_res ? _res.resolve(config.color, config.color) : config.color, '#000');
```

❌ **`resolver.resolve()` alone for Canvas2D**
The resolver returns `var(--name)` strings for CSS variables, which Canvas2D cannot use.

```javascript
// ❌ WRONG for canvas — fillStyle receives 'var(--lcars-orange)' which is ignored
ctx.fillStyle = resolver.resolve(config.color, '#000');

// ✅ CORRECT — materialise the var() after resolving
ctx.fillStyle = ColorUtils.resolveCssVariable(resolver.resolve(config.color, '#000'), '#000');
```

❌ **Skipping nested objects or arrays in preprocessors**
`_resolveConfigColors` recurses into nested objects and arrays — do not write a simplified version that only iterates top-level keys.

---

## Reference: Where Each API Lives

| API | File | Handles |
|-----|------|---------|
| `ThemeTokenResolver.resolve()` | `src/core/themes/ThemeTokenResolver.js` | Computed expressions, token references, CSS var passthrough |
| `ColorUtils.resolveCssVariable()` | `src/core/themes/ColorUtils.js` | CSS var materialisation |
| `ColorUtils.darken/lighten/alpha/etc.` | `src/core/themes/ColorUtils.js` | Colour math on concrete values |
| `resolveStateColor()` | `src/utils/state-color-resolver.js` | State-based colour lookup with full resolution chain |
| `_resolveConfigColors()` | `src/core/packs/backgrounds/BackgroundAnimationRenderer.js` | Preprocessing for background effect configs |
| `parseColorToRgba()` | `src/core/packs/textures/effects/noise-helpers.js` | Pixel-level effects needing numeric `{r,g,b,a}` |
