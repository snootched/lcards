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

### Blending two colours

`interpolateColor(from, to, t, { element })` (`resolve-color.js:88`) resolves both ends to concrete colours, then blends them at `t` (held to 0–1) with premultiplied alpha, so a transparent end fades without dragging its RGB in. Either end may be any colour form above. It returns `null` when an end is not a colour. `map_range` colour outputs use it (`mapRangeOutput()` in `src/utils/linearMap.js`), as does `CascadeEffect`.

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

## CSS Variables and Theme Tokens

**A colour in LCARdS code is a CSS variable (`--lcars-*`, `--lcards-*` or a Home Assistant variable) or a `theme:` token, and the build checks that each one exists.** `npm run build` runs `scripts/validate-css-vars.js`, which scans `src/` and exits 1 on any name it does not know (`validate-css-vars.js:501`). Run it alone with `npm run validate:css-vars` (`:verbose` lists every reference it found).

### Registering a CSS variable

| Prefix | Where the name must exist | Notes |
|--------|---------------------------|-------|
| `--lcars-*` | The HA-LCARS theme itself: `../ha-lcars/themes/lcars.yaml` when that checkout exists, else the theme file on GitHub (`HA_LCARS_THEME_URL`, `scripts/ha-lcars-theme-vars.js:22`) | Also add a newly referenced name to `STATIC_FALLBACK_VARS` (`ha-lcars-theme-vars.js:103`), the list used when neither source can be read. A name HA-LCARS does not define but LCARdS documents as user-settable goes in `LCARS_USER_CONVENTION_VARS` (`validate-css-vars.js:165`); a name removed upstream that still has a fallback goes in `LCARS_DEPRECATED_VARS` (`:180`, warns, does not fail) |
| `--lcards-*` | A key of `GREEN_ALERT_PALETTE` in `src/core/themes/paletteInjector.js:25`, which `injectPalette()` writes on the document root (`paletteInjector.js:118`) | The validator reads the quoted keys of that file (`buildLcardsAllowlist()`, `validate-css-vars.js:85`). Layout and editor variables that are not palette colours go in `LCARDS_COMPONENT_VARS` (`:191`). `src/lcards-vars.js` is not involved: it holds the version, project URL and fonts |
| `--ha-*` and other Home Assistant variables | The frontend's globals files | Not allowlisted by this validator. `scripts/validate-ha-compat.js` (also in the build) fails on known-dead elements and hooks. Names and values: [Home Assistant CSS Variable Reference](ha-css-vars.md) |

A name built in a template literal (`` `--lcards-${family}-` ``) ends in `-` at the match and is skipped (`validate-css-vars.js:350-351`).

### The `theme:` prefix

A config value that refers to a token must start with `theme:`; inside the token tree, references are bare paths.

| Where the value lives | Form |
|-----------------------|------|
| Card config, style presets | `theme:colors.ui.primary`, `theme:alpha(colors.card.buttonOff, 0.2)` |
| Text templates | `{theme:colors.text.onDark}` (`LCARdSCardTemplateEvaluator.js:280`) |
| `lcardsDefaultTokens.js` (one token referring to another) | `colors.ui.primary`, `darken(colors.card.button, 0.35)`: no prefix |

Without the prefix the value is not a token reference: `CoreConfigManager._resolveThemeTokens()` only replaces config strings that start with `theme:`. The validator's third pass checks every `theme:` path in `src/` against the default token tree (`src/core/packs/themes/tokens/lcardsDefaultTokens.js`), allowing the prefixes and functions in `scripts/lib/theme-token-rules.js` (`THEME_PATH_ALLOWED_PREFIXES`, `THEME_PATH_EXEMPTIONS`); the config checker uses the same rules for user and docs YAML (`registryIssues()`, `scripts/lib/config-validator.js:254`).

### Theme tokens in JavaScript

Read tokens through the singleton, never through a module import of the resolver:

```javascript
// ✅ The live resolver: active theme, scoped overrides, alert-mode cache clears
const tm = window.lcards?.core?.themeManager;
const primary = tm?.getToken('theme:colors.ui.primary', 'var(--lcards-gray-medium)');
const resolver = tm?.resolver;

// ❌ The module binding is null until ThemeManager activates a theme, and a copy taken before that stays null
import { themeTokenResolver } from '../core/themes/ThemeTokenResolver.js';
```

`ThemeManager` creates the resolver when it activates a theme (`initializeTokenResolver()`, `ThemeManager.js:177-178`; the export is `ThemeTokenResolver.js:664`). Inside a card, `this.getThemeToken(path, fallback)` calls `getToken()` and records the use for provenance. For colours, prefer `resolveColor()` or the card helpers above: they accept tokens, variables and literals alike.

### Phantom namespaces

The default token tree has five namespaces: `colors`, `typography`, `borders`, `effects` and `components`. The resolver also treats `spacing.*` and `animations.*` as token paths (`ThemeTokenResolver.js:199`, `:401`), but no theme defines them, so every `theme:spacing.*` or `theme:animations.*` lookup returns its fallback. There is no `palette` namespace either. Use Home Assistant's `--ha-space-*` and `--ha-animation-duration-*` variables for spacing and timing.

The token tree, resolution order and scoped overrides are in [Theme System](../architecture/subsystems/theme-system.md#theme-tokens).

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

An alert mode rewrites the palette CSS variables. CSS-target colours follow by themselves; concrete ones are repainted through `LCARdSCard._onAlertModeChanged(mode)`, which `ThemeManager` calls the moment the variables are written (mid-transition). When a card keeps concrete colours somewhere new (a cached SVG fragment, an animation, a canvas), make sure its `_onAlertModeChanged` refreshes them; `tests/browser/alert-palette.spec.js` checks each card. How a mode is applied: [Theme System](../architecture/subsystems/theme-system.md#alert-mode-integration); what users see: [Alert Mode](../core/alert-mode.md).

---

## Reference

| API | File |
|-----|------|
| Grammar, detection, `parseColor()` | `src/core/themes/color-syntax.js` |
| `resolveColor()`, `interpolateColor()` | `src/core/themes/resolve-color.js` |
| CSS variable check | `scripts/validate-css-vars.js`, `scripts/ha-lcars-theme-vars.js`, `scripts/lib/theme-token-rules.js` |
| `ThemeTokenResolver.resolve()` (`context.materialize` for concrete) | `src/core/themes/ThemeTokenResolver.js` |
| Colour maths, `resolveCssVariable()`, `toHex()` | `src/core/themes/ColorUtils.js` |
| `getBaselineColors()` (the `base()` snapshot) | `src/core/themes/paletteInjector.js` |
| `resolveStateColor()` | `src/utils/state-color-resolver.js` |
| `parseColorToRgba()` | `src/core/packs/textures/effects/noise-helpers.js` |

The one exception is `BorgAssimilationWorker.js`: it runs from a Blob URL, cannot import modules, and only receives concrete colours.
