---
applyTo: "src/cards/**, src/editor/**, src/core/**, src/msd/**, src/charts/**, src/base/**"
---

# LCARdS State-Based Color & Token Resolution Rules

These rules apply to all card and editor source files. Color resolution has multiple forms; using the wrong one silently breaks Canvas2D, SVG, and anime.js targets.

---

## One Grammar, One Resolver

`src/core/themes/color-syntax.js` defines every accepted colour value (hex, named, all CSS colour functions, `var()`, `theme:` tokens, the computed functions `alpha darken lighten saturate desaturate mix base` with nesting, and `match-light`). Use its exports; never write a local list, regex or parser:

- `COLOR_VALUE_PATTERN`: the schema `pattern` for every colour field
- `isColorValue` / `isCssColor` / `isComputedColor`: detection
- `parseColor`: `{ r, g, b, a }` without a DOM (incl. `color-mix(in srgb, ...)`)

`src/core/themes/resolve-color.js` `resolveColor(value, { concrete, element, fallback })` is the only way to resolve a colour outside the card helpers:

```javascript
import { resolveColor } from '../../core/themes/resolve-color.js';

resolveColor(value);                                     // CSS target: Lit, inline styles
resolveColor(value, { concrete: true, element: this });  // Canvas2D, SVG attributes, anime.js, ApexCharts
```

- **CSS target** keeps CSS variables live (computed functions become `color-mix(var(...))`). Alert modes rewrite palette variables without re-rendering cards, so this is what makes colours follow an alert.
- **Concrete target** returns `#rrggbb` / `rgba()`, read at call time from `element` (section-scoped vars). SVG presentation attributes cannot hold `var()`; a `color-mix(var())` there renders black.
- Apply it in effect constructors **and** `updateConfig()`; `_resolveConfigColors()` (BackgroundAnimationRenderer) already runs it over preset configs.

`mix(a, b, w)` equals `color-mix(in srgb, a w%, b)`. `base(x)` resolves to the green-alert baseline. `resolver.resolve()` strips `theme:` itself.

### ❌ Anti-patterns (guard tests fail on these)

```javascript
ColorUtils.resolveCssVariable(resolver.resolve(c, c), c);   // use resolveColor(c, { concrete: true })
/^(alpha|darken|lighten)\(/.test(value);                  // use isComputedColor(value)
value.match(/rgba?\((\d+)/);                              // use parseColor(value)
{ type: 'string', pattern: '^(#[0-9A-Fa-f]{6}|var\\(--)' } // use COLOR_VALUE_PATTERN
```

---

## State-Based Color Resolution

Use the card's built-in wrapper methods. They accept a plain colour or a state map alike (a plain `'alpha(#f90, .5)'` and the same value inside `{ default: ... }` resolve identically).

| Method | Target | Use for |
|--------|--------|---------|
| `this._resolveColorValue(config, fallback)` | Concrete | SVG attributes, Canvas2D, anime.js |
| `this._resolveEntityStateColor(config, fallback)` | CSS | Lit templates, inline styles (includes match-light) |
| `this._resolveStateValue(options)` | CSS | A state driven by another entity, or non-colour state values |

`_resolveColorValue` selects the state value unresolved, substitutes match-light, then makes one `resolveColor(..., { concrete: true, element: this })` call (no DOM probe for LCARdS's own forms).

Call `resolveStateColor()` directly only when the entity is not the card's own (data-grid cells). Pass `resolveTokens: false` to get the selected value as configured.

```javascript
const fill = this._resolveColorValue(this.config.style.color, '#888888');      // SVG attribute
const bg = this._resolveEntityStateColor(this._buttonStyle?.card?.color?.background, 'var(--lcars-orange, #FF9900)'); // CSS
const color = this._resolveStateValue({
  actualState: this._entity?.state,
  classifiedState: this._classifyEntityState(),
  colorConfig: this.config.style.color,
  fallback: null
});
```

### Config color-object key priority (lowest → highest)

1. `default` — catch-all fallback
2. Classified state: `active`, `inactive`, `unavailable`, `unknown`
3. Numeric: `zero` (exact), then `above:N`/`at_least:N` / `below:N`/`at_most:N` / `between:N:M`/`between_exclusive:N:M` (narrowest wins), then `non_zero`
4. Actual raw entity state (e.g. `heat`, `playing`, `locked`)
5. `state_attribute` value — `String(entity.attributes[state_attribute])` — **highest priority** (only when `state_attribute` is configured)

```yaml
style:
  color:
    default:      '#666666'
    active:       '#FF9900'
    heat:         '#FF6600'   # overrides 'active' when state is 'heat'
    above:80:     '#00FF00'   # numeric range (requires ranges_attribute)
    between:20:80: '#FFFF00'
    below:20:     '#FF0000'
    fade:         '#FF0000'   # matches effect attribute == "fade" (requires state_attribute: effect)
    "true":       '#00FF00'   # matches boolean attribute == true (requires state_attribute: charging)
```

### Classified state mapping

`_classifyEntityState()` maps raw entity states to one of:

- `active` — on, playing, open, locked, heating, cooling, cleaning, … (built-in list in `LCARdSCard.js`)
- `inactive` — off, paused, idle, closed, unlocked, disarmed, … (catch-all)
- `unavailable` — unavailable, unknown (always, cannot be overridden)
- `default` — no entity

**`state_classification` config override** — users can augment or change the catch-all via `this.config.state_classification`:

```js
// Lookup order inside _classifyEntityState():
// 1. unavailable/unknown → always 'unavailable'
// 2. sc.active?.includes(state) → 'active'            (user explicit, built-in override)
// 3. sc.inactive?.includes(state) → 'inactive'        (user explicit, built-in override)
// 4. custom bucket keys (non-reserved) → key name     (e.g. 'work_zone', 'away')
// 5. built-in activeStates.includes(state) → 'active'
// 6. sc.else ?? 'inactive'                            (catch-all, default 'inactive')
```

Reserved key names that cannot be used as custom buckets: `active`, `inactive`, `unavailable`, `default`, `else`, `unknown`.

When adding new code that calls `_classifyEntityState()` with a card's entity, no changes are needed — the method reads `this.config` automatically.

---

## Theme Token Resolution

```javascript
// Get a typed token value
const value = this.getThemeToken('palette.moonlight', fallbackValue);

// In templates (token syntax)
'{theme:palette.moonlight}'

// Direct resolver access — always via singleton, never via module import
const resolver = window.lcards?.core?.themeManager?.resolver;
const resolved = resolver ? resolver.resolve(rawValue, rawValue) : rawValue;
```

Built-in themes: `lcars-default`, `lcars-dark`, `cb-lcars`

---

## Token Namespace & Prefix Rules

### Populated vs. Phantom Namespaces

The resolver recognises seven namespaces. Only reference **populated** ones — phantom namespaces silently return the fallback on every lookup.

| Namespace | Populated? |
|-----------|------------|
| `colors.*` | ✅ |
| `typography.*` | ✅ |
| `borders.*` | ✅ |
| `effects.*` | ✅ |
| `components.*` | ✅ |
| `spacing.*` | ❌ Phantom |
| `animations.*` | ❌ Phantom |

### `theme:` Prefix Rule

The `theme:` prefix signals that a string is a token reference, not a literal. `_resolveThemeToken()` strips it before passing to the resolver.

| Where the value lives | Required form |
|-----------------------|---------------|
| Card config property | `'theme:colors.ui.primary'` |
| Style preset value | `'theme:lighten(colors.card.button, 0.2)'` |
| Template string | `'{theme:palette.moonlight}'` |
| Inside `lcardsDefaultTokens.js` (cross-ref) | `'darken(colors.card.button, 0.35)'` — **no prefix** |

```javascript
// ✅ In a preset
color: 'theme:colors.ui.primary'
background: 'theme:alpha(colors.card.buttonOff, 0.2)'

// ❌ Missing theme: prefix — expression is treated as a literal string
background: 'alpha(colors.card.buttonOff, 0.2)'

// ❌ theme: prefix inside the token file — breaks resolution
// (token file values are already bare)
button: { color: 'theme:colors.ui.primary' }   // WRONG in token file
```

### Alert-immune baseline: `base()`

`theme:base(colors.ui.primary)` always resolves to the pre-alert (`green_alert`) baseline snapshot value, bypassing live DOM reads — use it wherever a color must stay stable even when alert mode mutates the palette. Composable with the other computed functions, `base()` resolves first: `'theme:alpha(base(colors.ui.primary), 0.5)'`.

### Module Import Anti-Pattern

```javascript
// ❌ NEVER — module-level instance has no token tree, all lookups return fallback
import { themeTokenResolver } from '../../core/themes/ThemeTokenResolver.js';

// ✅ CORRECT — live singleton with active theme and user overrides
const resolver = window.lcards?.core?.themeManager?.resolver;
```

---

## `ranges_attribute` Config Key

Set `config.ranges_attribute` to use an entity attribute value (instead of the raw state string) as the numeric input for `above:`/`at_least:` / `below:`/`at_most:` / `between:`/`between_exclusive:` range keys:

```yaml
ranges_attribute: brightness_pct   # special virtual attr: brightness / 2.55
ranges_attribute: color_temp       # any literal attribute name
```

`_getNumericStateForRanges()` in `LCARdSCard` handles this automatically — all `_resolveStateValue()` calls inherit it.

---

## `state_attribute` Config Key

Set `config.state_attribute` to use an entity attribute value (serialized via `String()`) as the **highest-priority** key for exact-match state color lookups. This overrides `entity.state` for key matching while leaving classified state (active/inactive) unaffected — it is always derived from `entity.state`.

Use cases:
- **Boolean attributes**: `charging: true` → write config key `"true"` / `"false"`
- **Discrete string attributes**: `effect: "fade"` → write config key `"fade"`, `"rainbow"`, etc.
- **`null` attribute values**: writes `"null"` as the lookup key

```yaml
entity: light.bedroom
state_attribute: effect        # use effect attribute as the exact-match key source
ranges_attribute: brightness_pct   # can coexist — independently controls range keys

style:
  color:
    fade:     '#FF0000'   # matches effect == "fade"
    rainbow:  '#00FF00'   # matches effect == "rainbow"
    "null":   '#444444'   # matches null attribute (String(null) = "null")
    active:   '#FF9900'   # classified fallback (entity is "on")
    default:  '#888888'
```

Boolean example:

```yaml
entity: binary_sensor.motion
state_attribute: is_charging

style:
  color:
    "true":  '#00FF00'   # attribute is true
    "false": '#FF0000'   # attribute is false
    default: '#888888'
```

`_getAttributeStateForMatching()` in `LCARdSCard` handles this automatically — all `_resolveStateValue()` calls inherit it.
