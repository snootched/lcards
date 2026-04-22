# LCARdS AI Coding Agent Instructions

> **LCARdS**: Star Trek LCARS card system for Home Assistant - Lit-based web components with singleton architecture

---

## 🏗️ Architecture Fundamentals

### Singleton-Based Core System

LCARdS uses a **global singleton pattern** accessed via `window.lcards.core.*` for shared intelligence:

```javascript
// Core singletons (all extend BaseService)
window.lcards.core.themeManager       // Theme & design tokens
window.lcards.core.dataSourceManager  // Entity subscriptions & polling
window.lcards.core.rulesManager       // Conditional styling engine
window.lcards.core.animationManager   // Animation coordination
window.lcards.core.validationService  // Config validation
window.lcards.core.stylePresetManager // Style system & presets
window.lcards.core.animationRegistry  // Animation caching
```

**Critical Pattern**: All services extend `BaseService` which provides `updateHass()` and `ingestHass()` for HASS object propagation. Cards should NOT manage HASS distribution - the core handles it.

### Card Architecture Hierarchy

```
LitElement (Lit web component)
    ↓
LCARdSNativeCard (HA integration, shadow DOM, actions)
    ↓
    ├─→ LCARdSCard → Simple cards (Button, Chart, Slider, etc.)
    │   • Direct singleton access
    │   • Template evaluation via UnifiedTemplateEvaluator
    │   • Lifecycle: _handleFirstUpdate(), _handleHassUpdate(), _renderCard()
    │   • ⭐ Go-forward architecture for all new cards
    │
    └─→ LCARdSMSDCard → Complex multi-overlay displays
        • Advanced rendering pipeline
        • Navigation & routing
        • Multiple control/line overlays
```

**When to use which base**:
- `LCARdSCard`: Single-purpose cards (buttons, labels, single entity display)
- `LCARdSMSDCard`: Multi-overlay complex displays with routing

---

## �️ Zone System

Every card that supports text fields exposes **named zones** — rectangular regions of the SVG surface that text fields can be targeted to via `zone: <name>`.

### Key APIs (all in `LCARdSCard`)

```javascript
// Populated by _rebuildZones() every render cycle
this._zones  // Map<name, { bounds: { x, y, width, height } }>

// Called by cards at start of each render to rebuild the zone map
this._rebuildZones(width, height)
//   → calls this._calculateZones(width, height)  (subclass override)
//   → then  this._mergeUserZones(width, height)   (applies config.zones)

// For string-based SVG pipelines (button)
this._generateZoneTextMarkup(textFields)   // → SVG string with <g translate> groups
this._generateZoneDebugMarkup()             // → SVG string with debug overlay

// For DOM-based SVG pipelines (slider, elbow)
this._injectTextFieldsToElement(svgEl, w, h)
this._injectZoneDebugOverlay(svgEl)
```

### Auto-zones per card

| Card | Auto zones |
|------|------------|
| Button (preset) | `body` |
| Button (component) | Named `text_areas` from SVG def |
| Slider | `track` + `left`/`right`/`top`/`bottom` when border enabled |
| Elbow (simple, L-corner left) | `vertical_bar`, `left_bar` (alias), `horizontal_bar`, `body`, `full` |
| Elbow (simple, L-corner right) | `vertical_bar`, `right_bar` (alias), `horizontal_bar`, `body`, `full` |
| Elbow (simple, open) | `horizontal_bar`, `body`, `full` |
| Elbow (simple, contained) | `left_bar`, `right_bar`, `horizontal_bar`, `body`, `full` |
| Elbow (segmented) | `outer_*`, `inner_*` bars, `body`, `full` |
| Elbow (frame) | `top`, `bottom`, `left`, `right`, `body`, `full` |

### User-defined zones

Users can add or override zones via `config.zones`. Mixed px/percent per axis is supported — px takes precedence when both are present:

```yaml
zones:
  sidebar:
    x: 0
    y: 0
    width: 80
    height_percent: 100
```

### Debug overlay

`config.debug_zones: true` renders coloured dashed rects + zone name labels on top of the card. Toggle in the editor's **Zones → Developer Tools** section. **Remove before shipping** — the key persists in config when left on.

### Anti-patterns

❌ Don't access `this._zones` before calling `_rebuildZones` — it will be empty or stale
❌ Don't call `_calculateZones` directly — always go through `_rebuildZones` so user overrides are applied
❌ Don't embed text markup via `_processTextFields(textFields, fullWidth, fullHeight)` in a zone-aware card — use `_generateZoneTextMarkup` (button) or `_injectTextFieldsToElement` (slider/elbow) instead

---

## �🔧 Development Workflows

### Build & Test Commands

```bash
npm run build          # Production build (outputs to dist/lcards.js)
npm run build:dev      # Development build with source maps
npm run clean          # Remove dist folder
npm run analyze        # Bundle size analysis
```

**Critical**: After code changes, ALWAYS run `npm run build` before testing in Home Assistant. The card loads from `dist/lcards.js`, not source files.

### CSS Variable Governance

All CSS variable references (`--lcars-*`, `--lcards-*`) and theme token paths (`theme:`) are validated by `scripts/validate-css-vars.js` (4-pass). The build is **gated** on this validator — a violation breaks `npm run build`.

```bash
npm run validate:css-vars          # Run the validator
npm run validate:css-vars:verbose  # Show all valid refs alongside violations
```

**Rules for new CSS variable references**:
- `--lcars-*` — must appear in `scripts/ha-lcars-theme-vars.js` allowlist
- `--lcards-*` — must appear in `src/lcards-vars.js`
- `theme:` paths — must start with a declared namespace: `colors.`, `typography.`, `borders.`, `effects.`, `components.`, `palette.`, `colors.grid.`, `colors.lcars.`, `colors.ui.`
- Computed expressions in presets/config must carry the `theme:` prefix: `theme:lighten(...)`, `theme:alpha(...)`

If you add a new `--lcars-*` or `--lcards-*` variable, add it to the appropriate allowlist file **before** referencing it in source. If you add a top-level token path prefix, add it to `THEME_PATH_ALLOWED_PREFIXES` in the validator.

### File Structure Conventions

```
src/
  ├─ base/              # Base classes (LCARdSCard, LCARdSNativeCard, ActionHandler)
  ├─ cards/             # Card implementations (lcards-button.js, lcards-msd.js)
  ├─ core/              # Singleton systems (themes, rules, datasources, validation)
  ├─ editor/            # Visual editor components
  │   ├─ base/          # Editor base class (LCARdSBaseEditor)
  │   ├─ cards/         # Card-specific editors
  │   └─ components/    # Reusable editor UI (color pickers, form fields)
  ├─ msd/               # MSD-specific rendering pipeline
  ├─ utils/             # Utilities (logging, provenance tracking)
  └─ lcards.js          # Entry point (registers all cards, initializes core)
```

### Logging System

**ALWAYS use structured logging**:

```javascript
import { lcardsLog } from '../utils/lcards-logging.js';

lcardsLog.debug('[MyClass] Operation started', { data: value });
lcardsLog.info('[MyClass] Processing complete');
lcardsLog.warn('[MyClass] Deprecated usage detected');
lcardsLog.error('[MyClass] Operation failed:', error);
```

Log levels: `error` → `warn` → `info` → `debug` → `trace`

Control level in HA dev console: `window.lcards.setGlobalLogLevel('debug')`

**Pattern**: Use `[ClassName]` prefix for all log messages to enable filtering.

---

## 🎨 Template System

> Full evaluator API, token context keys, Jinja2 auto-tracking, and `_preEvaluateStyleTemplates` pattern: see `.github/instructions/templates.instructions.md`.

Four eval types in order: **JS** (`[[[...]]]`) → **Token** (`{entity.state}`) → **DataSource** (`{datasource:name}`) → **Jinja2** (`{{...}}`). Use `UnifiedTemplateEvaluator` — never tokenize manually.

---

## 📊 DataSource System

> Full config schema, subscribe pattern, data shape `{ v, t, history }`, and programmatic creation: see `.github/instructions/datasources.instructions.md`.

Declare `data_sources:` in card config; subscriptions are auto-cleaned on disconnect. Access via `window.lcards.core.dataSourceManager.getSource(name)`.

---

## 🎯 Rules Engine Integration

### Registering Overlays for Rules

Cards must explicitly register overlays to receive rule patches:

```javascript
_handleFirstUpdate() {
  super._handleFirstUpdate();

  // Register with RulesEngine
  this._registerOverlayForRules({
    id: `button-${this._cardGuid}`,
    type: 'button'
  });

  this._resolveStyle();
}

_onRulePatchesChanged(patches) {
  // Re-resolve styles with new patches
  this._resolveStyle();
}

_resolveStyle() {
  let style = { ...this.config.style };

  // Apply rule patches
  style = this._getMergedStyleWithRules(style);

  this._cardStyle = style;
  this.requestUpdate(); // CRITICAL!
}
```

**Critical**: ALWAYS call `this.requestUpdate()` after applying patches to trigger re-render.

---

## 🎨 Theme System

### Token Namespaces

The token tree has seven declared namespaces. Only the populated ones resolve at runtime; phantom namespaces silently fall through to the fallback value.

| Namespace | Status | Notes |
|-----------|--------|-------|
| `colors` | ✅ Populated | Full palette, ui, text, status, chart, card, lcars, grid |
| `typography` | ✅ Populated | Font families, sizes, weights |
| `borders` | ✅ Populated | Radius values |
| `effects` | ✅ Populated | Opacity levels (base, inactive, unavailable, disabled, overlay) |
| `components` | ✅ Populated | button, elbow, slider, chart, alert, dpad, backgroundAnimation |
| `spacing` | ❌ Phantom | Declared in resolver but no token entries — always returns fallback |
| `animations` | ❌ Phantom | Declared in resolver but no token entries — always returns fallback |

### Theme Token Resolution

Always access the live resolver via the singleton — **never** import `themeTokenResolver` at module level (it is an empty shell with no token tree).

```javascript
// ✅ CORRECT — live resolver, picks up theme changes and user overrides
const resolver = window.lcards?.core?.themeManager?.resolver;
const color = resolver ? resolver.resolve('colors.ui.primary', fallback) : fallback;

// In templates (token syntax — theme: prefix required in config/preset data)
'{theme:palette.alert-red}'
'{theme:lighten(colors.card.button, 0.2)}'
```

### `theme:` Prefix Convention

The `theme:` prefix is **required** in any config value or preset that references a token path or computed token expression. `LCARdSCard._resolveThemeToken()` strips it before passing to the resolver.

| Context | Correct form | Notes |
|---------|-------------|-------|
| Card config / preset value | `'theme:colors.ui.primary'` | Prefix required |
| Card config / preset — computed | `'theme:lighten(colors.card.button, 0.2)'` | Prefix required |
| Token file value (cross-reference) | `'darken(colors.card.button, 0.35)'` | No prefix — resolver receives bare string |
| Template string | `'{theme:palette.moonlight}'` | Prefix required in the token syntax |

❌ `'lighten(colors.card.button, 0.2)'` in a preset — missing `theme:` prefix; resolver never called, expression rendered as literal string
❌ `'theme:darken(x, 0.3)'` inside `lcardsDefaultTokens.js` — double-prefix breaks resolution

**Built-in themes**: `lcars-default`, `lcars-dark`, `cb-lcars` (retro LCARS)

---

## 🎬 Animation System

> anime.js v4 API diff table, AnimationManager/Registry usage, trigger routing, `prefers-reduced-motion` guard, and alert mode: see `.github/instructions/animation.instructions.md`.

**Critical**: LCARdS uses **anime.js v4** — API differs from v3. Use `anime.createTimeline()` not `anime.timeline()`, `anime.animate(targets, props)` not `anime({targets, ...props})`, easing `'inOutQuad'` not `'easeInOutQuad'`. Alert mode: `window.lcards.alert.red/yellow/off()`.

---

## 🖼️ Visual Editor System

> Approved HA elements, `FormField.renderField()` API, `editorStyles` requirement, shared components, and `_updateConfig()` rules: see `.github/instructions/editor.instructions.md`.

All editors extend `LCARdSBaseEditor`. Use `FormField.renderField(this, 'path', options)` for all fields — never raw `<input>`/`<select>`. Always commit via `this._updateConfig(partial)`.

---

## 🔄 Card Lifecycle

> Full lifecycle hook docs, `super` call requirements, and integration with rules/DataSources: see `.github/instructions/cards.instructions.md`.

Hooks in order: `_handleFirstUpdate` (setup, once) → `_handleHassUpdate` (HASS changes) → `_renderCard` (every render) → `_onRulePatchesChanged` (style patches). Always call `super` first.

---

## 🏷️ Required Card Properties & Card Size

Every card **must** declare `static CARD_TYPE = 'my-card'` (matches CoreConfigManager schema key) and `static getStubConfig()` (minimum viable config for the card picker). Override `_getCardSize()` using `this._pxToGridUnits(h) ?? 3` — returning `1` for a taller card causes HA layout clipping.

> Full details and examples: see `.github/instructions/cards.instructions.md`.

---

## 🎨 Color Resolution

**The most commonly missed pattern.** LCARdS supports three color expression forms:
- Concrete: `#93e1ff`, `rgba(255,153,0,0.5)`
- CSS variable: `var(--lcars-blue, #93e1ff)`
- Computed: `darken(var(--lcars-blue), 0.3)`, `alpha(#ff9900, 0.5)`

### Always use the two-step pattern for Canvas2D contexts

`ThemeTokenResolver` handles computed expressions but outputs `var()` strings. Canvas2D cannot use `var()` — `resolveCssVariable` materialises them.

```javascript
// ✅ CORRECT — works for all three expression forms
const _resolver = window.lcards?.core?.themeManager?.resolver;
const _resolve = (c) => ColorUtils.resolveCssVariable(
  (_resolver ? _resolver.resolve(c, c) : c), c
);
this.resolvedColor = _resolve(config.color);
this.resolvedColors = this.colors.map(_resolve); // for arrays
```

### In cards / CSS / Lit contexts

`resolver.resolve()` alone is enough — the browser handles `var()` natively.

```javascript
const resolver = window.lcards?.core?.themeManager?.resolver;
const color = resolver ? resolver.resolve(rawValue, rawValue) : rawValue;
```

### In `updateConfig()` methods

Live config updates bypass the `_resolveConfigColors` preprocessing pipeline — apply the two-step pattern here too.

```javascript
// ✅ CORRECT in updateConfig
const _res = window.lcards?.core?.themeManager?.resolver;
this._color = ColorUtils.resolveCssVariable(
  _res ? _res.resolve(cfg.color, cfg.color) : cfg.color, fallback
);
```

### Anti-patterns

❌ `ColorUtils.resolveCssVariable(config.color)` alone — silently ignores `darken/lighten/alpha` expressions
❌ `resolver.resolve(config.color)` alone for canvas — `var()` strings break `fillStyle`
❌ Writing a config preprocessor that only iterates top-level keys — always recurse into nested objects and arrays

> Full reference: `doc/development/color-resolution.md`

---

## 🎮 Action Handling

Use `this.setupActions(el, { tap_action, hold_action, double_tap_action })` for all interactions — never raw click/pointer listeners. Use `this.callService(domain, service, data)` — never `this.hass.callService()` directly.

> Full examples and cleanup behaviour: see `.github/instructions/cards.instructions.md`.

---

## 👁️ Preview Mode Guard & 🧹 Cleanup

Guard expensive init with `if (this.isPreviewMode() === 'picker') return` — do **not** guard `'editor'`. The base `_onDisconnected()` auto-cleans: core registration, overlay, entity subscriptions, DataSources, ResizeObserver, actions handler. Only override `_onDisconnected()` for card-specific teardown (timers, AbortControllers); always call `super._onDisconnected()` last.

> Full cleanup table and examples: see `.github/instructions/cards.instructions.md`.

---

## 🚨 Critical Patterns

### Provenance Tracking

**ALWAYS track config origins** for debugging:

```javascript
import { ProvenanceTracker } from '../utils/provenance-tracker.js';

// Track config application
ProvenanceTracker.track(this._cardGuid, {
  action: 'apply_preset',
  source: 'user_selection',
  presetId: 'basic',
  timestamp: Date.now()
});
```

View provenance in editor's "Provenance" tab.

### Entity State Access

Use `this.subscribeToEntity(id, cb)` (event-driven, auto-unsubscribed on disconnect) or `this.getEntityState(id?)` (synchronous snapshot). Never access `this.hass.states` directly on render, and never call `systemsManager.subscribeToEntity()` from a card — it won't auto-track.

> Full examples: see `.github/instructions/cards.instructions.md`.

---

## ✏️ Editor Patterns

### Committing Config Changes

Always use `this._updateConfig(partial)` — it deep-merges, validates, syncs the YAML tab, and fires `config-changed` to HA with debounce:

```javascript
// In an editor field event handler:
_handleColorChange(ev) {
  this._updateConfig({ style: { color: ev.detail.value } });
}

// ❌ NEVER do this directly — breaks YAML sync and bypasses validation:
this.config = { ...this.config, color: ev.detail.value };
fireEvent(this, 'config-changed', { config: this.config });
```

### Firing Events to HA

`fireEvent` comes from `custom-card-helpers`. Always use it, never `dispatchEvent(new CustomEvent(...))` for HA-facing events:

```javascript
import { fireEvent } from 'custom-card-helpers';
fireEvent(this, 'config-changed', { config: this.config });
```

### Editor Field Rendering

Use `LCARdSFormFieldHelper.renderField(editor, configPath, options?)` — the canonical field API. Do **not** render raw `<input>`, `<select>`, or bare `ha-selector` elements.

```javascript
import { LCARdSFormFieldHelper as FormField } from '../components/shared/lcards-form-field.js';

// In a _renderConfig() method:
FormField.renderField(this, 'entity')
FormField.renderField(this, 'style.primary_color', { type: 'color', label: 'Primary Color' })
FormField.renderField(this, 'preset', {
  type: 'select',
  label: 'Preset',
  options: [{ value: 'default', label: 'Default' }]
})
```

**Available field types:** `entity`, `text`, `number`, `color`, `select`, `checkbox`

See `.github/instructions/editor.instructions.md` for the complete editor reference (approved HA elements, shared components, required styles).

---

## 🎨 Shadow DOM & Styles

All LCARdS cards use Lit's shadow DOM. Always define styles with the `static get styles()` pattern using the `css` tagged template:

```javascript
import { LitElement, html, css } from 'lit';

export class MyCard extends LCARdSCard {

  static get styles() {
    return css`
      :host {
        display: block;
        box-sizing: border-box;
      }
      .container {
        /* Styles here are scoped to this element's shadow DOM */
      }
    `;
  }

  _renderCard() {
    return html`<div class="container">...</div>`;
  }
}
```

**Rules**:
- `:host` styles the custom element itself (affects its layout in the HA grid)
- Never inject `<style>` tags in `_renderCard()` — they leak across Lit updates
- CSS custom properties (`var()`) **do** pierce shadow DOM — use them for theming
- External stylesheets do **not** pierce shadow DOM — always use `static get styles()`

---

## 📦 Custom Element Registration

**Pattern**: All cards register in `src/lcards.js` entry point:

```javascript
// In src/lcards.js
import { MyCard } from './cards/my-card.js';

customElements.define('lcards-my-card', MyCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'lcards-my-card',
  name: 'My Card',
  description: 'Description here'
});
```

**Never** register cards in their own files - centralize in entry point.

---

## 📖 Documentation

**Comprehensive docs** at `doc/`:
- `doc/README.md` - Documentation index
- `doc/architecture/` - System architecture & API reference
- `doc/user/` - User guides & configuration reference

**Keep docs in sync**: When changing core systems, update relevant docs in `doc/architecture/subsystems/`.

---

## 🧪 Testing Patterns

**No automated test infrastructure** - manual testing required:

1. Make code changes
2. `npm run build`
3. Copy `dist/lcards.js` to HA `www/community/lcards/`
4. Hard refresh browser (Ctrl+Shift+R)
5. Test in HA Lovelace editor

**Template Sandbox**: Use built-in template sandbox (Template tab in editor) to test template evaluation with mock data.

---

## 🎯 Common Tasks

### Adding a New Card

1. Create `src/cards/lcards-mycard.js` extending `LCARdSCard`
2. Add required static properties (see **Required Card Properties** section):
   ```javascript
   static CARD_TYPE = 'my-card';
   static getStubConfig() { return { type: 'custom:lcards-my-card', entity: 'light.example' }; }
   ```
3. Create editor `src/editor/cards/lcards-mycard-editor.js` extending `LCARdSBaseEditor`
4. Register in `src/lcards.js`:
   ```javascript
   import { MyCard } from './cards/lcards-mycard.js';
   customElements.define('lcards-my-card', MyCard);
   window.customCards = window.customCards || [];
   window.customCards.push({ type: 'lcards-my-card', name: 'My Card', description: '...' });
   ```
5. Add schema to CoreConfigManager if using validation
6. Override `_getCardSize()` if the card is taller than 1 grid row
7. Build and test

### Adding a New Singleton Service

1. Create service in `src/core/` extending `BaseService`
2. Initialize in `src/core/lcards-core.js` `_performInitialization()`
3. Expose on `window.lcards.core.myService`
4. Document in `doc/architecture/subsystems/`

### Debugging Issues

```javascript
// Browser console commands
window.lcards.setGlobalLogLevel('debug')  // Enable debug logging
window.lcards.core.dataSourceManager.sources  // Inspect DataSources
window.lcards.core.rulesManager.rules  // Inspect rules
window.lcards.core.themeManager.getCurrentTheme()  // Current theme

// Check card registration
console.log(window.customCards)

// Access card instance (in HA elements inspector)
$0._singletons.rulesManager  // From any card element
```

---

## ⚠️ Anti-Patterns to Avoid

❌ **Don't** pass HASS object manually between components — use singleton propagation via `ingestHass()`
❌ **Don't** create new template evaluators for each evaluation — reuse instances
❌ **Don't** register custom elements in card files — centralize in `src/lcards.js`
❌ **Don't** access `this.hass.states` on every render — use `this.subscribeToEntity()` or `this.getEntityState()`
❌ **Don't** call `systemsManager.subscribeToEntity()` directly from a card — use `this.subscribeToEntity()` so it auto-tracks for cleanup
❌ **Don't** manually call `core.unregisterCard()` or `systemsManager.unregisterOverlay()` — the base handles it
❌ **Don't** forget `requestUpdate()` after applying rule patches
❌ **Don't** use `console.log()` — use `lcardsLog` with severity level
❌ **Don't** skip provenance tracking for config changes
❌ **Don't** bind raw click/pointer handlers for HA actions — use `setupActions()`
❌ **Don't** call `this.hass.callService()` directly — use the inherited `callService()` helper
❌ **Don't** run heavy init in picker preview — check `this.isPreviewMode() === 'picker'` first
❌ **Don't** inject `<style>` tags inside `_renderCard()` — use `static get styles()` with `css` template
❌ **Don't** update editor config with direct assignment — use `this._updateConfig(partial)` in editors
❌ **Don't** call `ColorUtils.resolveCssVariable()` alone on color values — use the two-step resolver pattern for Canvas2D/SVG/anime.js contexts
❌ **Don't** use bare `customElements.define('name', Class)` — always guard with `if (!customElements.get('name'))` to prevent double-registration errors when the module is evaluated more than once (e.g. HMR, panel re-mount)
❌ **Don't** `import { themeTokenResolver } from '...ThemeTokenResolver.js'` — that module-level instance has no token tree and silently returns all fallbacks; always use `window.lcards.core.themeManager.resolver`
❌ **Don't** write computed token expressions in presets/config without the `theme:` prefix — `'lighten(colors.x, 0.2)'` is treated as a literal string, not a token expression
❌ **Don't** use phantom token namespaces (`spacing.*`, `animations.*`) — they are declared in the resolver but have no entries in the token file and always produce the fallback value
❌ **Don't** add new `--lcars-*` or `--lcards-*` CSS variable references without first adding them to the allowlist in `scripts/ha-lcars-theme-vars.js` or `src/lcards-vars.js` — the build will fail validation

---

*Last Updated: April 2026 | LCARdS v1.12.01*
