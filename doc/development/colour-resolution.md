# Colour Resolution: Developer Guide

Every LCARdS colour goes through one grammar and one resolver. This page says which call to use in which context, so a colour that works in one card works in all of them.

---

## One Grammar: `color-syntax.js`

`src/core/themes/color-syntax.js` is the single definition of a colour value. It is pure (no DOM), so schemas, workers, editors and node tests share it.

| Form | Examples |
|------|----------|
| CSS colour | `#f90`, `#ff990080`, `black`, `transparent`, `rgb(255 153 0 / 50%)`, `hsl(36, 100%, 50%)`, `oklch(0.75 0.17 60)`, `color-mix(in srgb, red 25%, blue)` |
| CSS variable | `var(--lcars-orange)`, `var(--lcars-orange, #ff9900)` |
| Theme token | `theme:colors.ui.primary`, `theme:darken(colors.ui.primary, 0.2)` |
| Computed function | `alpha()`, `darken()`, `lighten()`, `saturate()`, `desaturate()`, `mix()`, `base()`; arguments may be tokens, variables or other computed functions: `alpha(darken(var(--lcars-orange), 0.2), 0.5)` |
| Card keyword | `match-light` (and `match-brightness` inside a computed function) |

| Export | Use |
|--------|-----|
| `COLOR_VALUE_PATTERN` | The schema `pattern` for every colour field (validation accepts exactly what the resolver handles) |
| `isColorValue(v)` | Any config colour (the grammar above) |
| `isCssColor(v)` | Syntax the browser accepts as-is (no `theme:`, computed functions or keywords) |
| `isComputedColor(v)` | Starts with a computed function |
| `parseColor(v)` | `{ r, g, b, a }` for hex, named, rgb/hsl (comma or space syntax), oklch, `color(srgb ...)` and `color-mix(in srgb, ...)` |
| `COMPUTED_COLOR_FUNCTIONS`, `CSS_NAMED_COLORS` | The lists; never copy them |

`mix(a, b, w)` gives the same result as `color-mix(in srgb, a w%, b)`, channel for channel. `base(x)` reads the green-alert baseline of a token or `--lcars-*`/`--lcards-*` variable, so the colour ignores alert modes.

---

## One Resolver: `resolveColor()`

```javascript
import { resolveColor } from '../core/themes/resolve-color.js';

resolveColor(value);                                   // CSS target
resolveColor(value, { concrete: true, element: this }); // Canvas2D, SVG attributes, anime.js, ApexCharts
resolveColor(value, { concrete: true, fallback: '#888' });
```

It strips `theme:`, evaluates tokens and computed functions through `ThemeTokenResolver`, and returns the fallback for an unknown token or a value nothing could evaluate.

### CSS target (default)

For Lit templates, inline styles and CSS custom properties. CSS variables **stay live**: `alpha(var(--lcars-orange), 0.5)` becomes `color-mix(in srgb, var(--lcars-orange) 50%, transparent)`. Alert modes rewrite the palette variables without re-rendering cards, so a live colour follows the alert; a materialised one would not. `saturate()` and `desaturate()` have no `color-mix()` form and always read the current value.

### Concrete target

For anything that cannot hold `var()`: Canvas2D `fillStyle`, SVG presentation attributes set from JS or baked into markup, anime.js keyframes, ApexCharts options. Returns `#rrggbb` or `rgba(r, g, b, a)`, read at call time from `element`, so section-scoped theme variables apply. Concrete results are never cached.

---

## In Cards

Cards resolve state maps (`{ active: ..., inactive: ... }`), templates and `match-light` before any of the above. Use the `LCARdSCard` helpers, which accept a plain value or a state map alike:

| Helper | Target | Use for |
|--------|--------|---------|
| `this._resolveEntityStateColor(config, fallback)` | CSS | Lit templates and inline styles |
| `this._resolveColorValue(config, fallback)` | Concrete | SVG attributes, Canvas2D, anime.js |
| `this._resolveStateValue(options)` | CSS | A state driven by another entity, or a non-colour state value |

`resolveStateColor()` (`src/utils/state-color-resolver.js`) is the shared state lookup underneath. Call it directly only when the entity is not the card's own (data-grid cells do this, per cell).

---

## Outside Cards

Effects, overlays and helpers call `resolveColor()` directly.

```javascript
// Canvas2D effect: constructor and updateConfig() alike
const _resolve = (c) => resolveColor(c, { concrete: true });
this._color = _resolve(config.color);
this._colors = config.colors.map(_resolve);
```

`BackgroundAnimationRenderer._resolveConfigColors()` runs `resolveColor(..., { concrete: true })` over every colour-like string in an effect config (nested objects and arrays included) before `createEffects` receives it, so preset factories get concrete colours. Effect constructors still resolve their own colours, since they can be created outside that pipeline.

Pixel effects that need numbers use `parseColorToRgba()` (`noise-helpers.js`) on a concrete colour.

---

## Anti-Patterns

The guard tests (`tests/core/color-syntax.test.js`, `tests/core/resolve-color.test.js`) fail on these.

```javascript
// ❌ A local list or regex of computed functions
/^(alpha|darken|lighten)\(/.test(value);
// ✅
isComputedColor(value);

// ❌ Hand-parsing hex or rgb()
value.match(/rgba?\((\d+)/);
// ✅
parseColor(value);

// ❌ Hand-rolled resolve-then-materialise
ColorUtils.resolveCssVariable(resolver.resolve(c, c), c);
// ✅
resolveColor(c, { concrete: true });

// ❌ A colour pattern in a schema
{ type: 'string', pattern: '^(#[0-9A-Fa-f]{6}|rgb\\(|var\\(--)' }
// ✅
{ type: 'string', pattern: COLOR_VALUE_PATTERN }
```

Also avoid the concrete target in CSS contexts: it freezes the colour until the next repaint.

---

## Alert Modes

An alert mode rewrites the palette CSS variables. CSS-target colours follow by themselves; concrete ones are repainted through `LCARdSCard._onAlertModeChanged(mode)`, which `ThemeManager` calls the moment the variables are written (mid-transition). When a card keeps concrete colours somewhere new (a cached SVG fragment, an animation, a canvas), make sure its `_onAlertModeChanged` refreshes them; `tests/browser/alert-palette.spec.js` checks each card. See [Theme System](../architecture/subsystems/theme-system.md#alert-mode-integration).

---

## Reference

| API | File |
|-----|------|
| Grammar, detection, `parseColor()` | `src/core/themes/color-syntax.js` |
| `resolveColor()` | `src/core/themes/resolve-color.js` |
| `ThemeTokenResolver.resolve()` (`context.materialize` for concrete) | `src/core/themes/ThemeTokenResolver.js` |
| Colour maths, `resolveCssVariable()`, `toHex()` | `src/core/themes/ColorUtils.js` |
| `getBaselineColors()` (the `base()` snapshot) | `src/core/themes/paletteInjector.js` |
| `resolveStateColor()` | `src/utils/state-color-resolver.js` |
| `parseColorToRgba()` | `src/core/packs/textures/effects/noise-helpers.js` |

The one exception is `BorgAssimilationWorker.js`: it runs from a Blob URL, cannot import modules, and only receives concrete colours.
