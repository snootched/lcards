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

## 🔧 Development Workflows

### Build & Test Commands

```bash
npm run build          # Production build (outputs to dist/lcards.js)
npm run build:dev      # Development build with source maps
npm run clean          # Remove dist folder
npm run analyze        # Bundle size analysis
```

**Critical**: After code changes, ALWAYS run `npm run build` before testing in Home Assistant. The card loads from `dist/lcards.js`, not source files.

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

### UnifiedTemplateEvaluator (Four Template Types)

LCARdS supports multiple template syntaxes evaluated in order:

```javascript
// 1. JavaScript templates
'[[[return entity.state.toUpperCase()]]]'

// 2. Token templates
'{entity.state}'
'{entity.attributes.brightness}'
'{theme:palette.moonlight}'

// 3. DataSource templates (explicit syntax)
'{datasource:sensor_temp:.1f}°C'
'{ds:cpu_usage}'

// 4. Jinja2 templates (async, evaluated by HA)
'{{states("sensor.temp")}}'
'{% if is_state("light.kitchen", "on") %}ON{% endif %}'
```

**Creating evaluator**:

```javascript
import { UnifiedTemplateEvaluator } from '../core/templates/UnifiedTemplateEvaluator.js';

const evaluator = new UnifiedTemplateEvaluator({
  hass: this.hass,
  context: {
    entity: this.hass.states['light.kitchen'],
    config: this.config,
    hass: this.hass,
    theme: themeManager.getCurrentTheme()
  },
  dataSourceManager: window.lcards.core.dataSourceManager
});

const result = await evaluator.evaluateAsync(template);
```

**DataSource Resolution**: Waterfall pattern - live DataSource → mock fallback → error

---

## 📊 DataSource System

### Creating DataSources in Cards

Cards can define `data_sources` in config which are automatically registered:

```yaml
type: custom:lcards-button
data_sources:
  sensor_temp:
    entity_id: sensor.temperature
    update_interval: 5
    history_size: 100
    transformations:
      - type: moving_average
        window: 10
```

**Access pattern**:

```javascript
const dsManager = window.lcards.core.dataSourceManager;
const source = dsManager.getSource('sensor_temp');

// Subscribe to updates
const unsubscribe = source.subscribe((data) => {
  console.log('New value:', data.v); // { v: value, t: timestamp }
  this.requestUpdate();
});

// Cleanup on disconnect
disconnectedCallback() {
  if (this._unsubscribe) this._unsubscribe();
}
```

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

### Theme Token Resolution

```javascript
const themeManager = window.lcards.core.themeManager;
const currentTheme = themeManager.getCurrentTheme();

// Access theme values
const color = currentTheme.palette.moonlight;  // Direct access
const spacing = currentTheme.spacing.medium;

// Use in templates
'background: {theme:palette.alert-red}'
```

**Built-in themes**: `lcars-default`, `lcars-dark`, `cb-lcars` (retro LCARS)

---

## 🎬 Animation System

### anime.js v4 (Breaking Changes from v3)

LCARdS uses **anime.js v4** which has a **different API signature** than v3:

```javascript
import anime from 'animejs';

// ✅ CORRECT: anime.js v4 syntax
anime({
  targets: '.my-element',
  translateX: [0, 100],
  duration: 1000,
  easing: 'easeInOutQuad'
});

// ❌ WRONG: anime.js v3 syntax (will fail)
anime.timeline()
  .add({ targets: '.my-element', translateX: 100 });
```

**Key v4 Changes**:
- Timeline API has changed - check v4 docs
- Some easing function names differ
- `anime.timeline()` syntax updated
- Better TypeScript support

### AnimationManager Singleton

Coordinates animations across all cards:

```javascript
const animManager = window.lcards.core.animationManager;

// Register animation
animManager.registerAnimation('my-card-pulse', {
  targets: '#my-element',
  scale: [1, 1.1, 1],
  duration: 800,
  loop: true
});

// Play animation
animManager.play('my-card-pulse');

// Stop animation
animManager.stop('my-card-pulse');
```

### AnimationRegistry

Caches animation instances to avoid re-parsing:

```javascript
const registry = window.lcards.core.animationRegistry;

// Get cached animation (or create if new)
const animation = registry.getOrCreate('button-pulse', () => ({
  targets: '.button',
  scale: [1, 1.05, 1],
  duration: 600,
  easing: 'easeInOutQuad'
}));

animation.play();
```

### Alert Mode Animations

Special animation presets for red/yellow alert states:

```javascript
// Trigger alert mode (activates across all registered cards)
window.lcards.alert.red();   // Red alert
window.lcards.alert.yellow(); // Yellow alert
window.lcards.alert.off();    // Clear alert

// Cards listen for alert events and apply preset animations
```

**MSD Animation Presets**: Located in `src/msd/presets/alert-mode/` with specific timelines for overlay pulsing, color shifts, and line animations.

---

## 🖼️ Visual Editor System

### Editor Base Class Pattern

All card editors extend `LCARdSBaseEditor` and use declarative tab configuration:

```javascript
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';

export class MyCardEditor extends LCARdSBaseEditor {
  constructor() {
    super();
    this.cardType = 'my-card';
  }

  _getTabDefinitions() {
    return [
      { label: 'Config', content: () => this._renderFromConfig(this._getConfigTabConfig()) },
      { label: 'YAML', content: () => this._renderYamlTab() }
    ];
  }

  _getConfigTabConfig() {
    return [
      {
        type: 'section',
        title: 'Basic Settings',
        fields: [
          { type: 'entity', path: 'entity_id', label: 'Entity' },
          { type: 'text', path: 'name', label: 'Name' }
        ]
      }
    ];
  }
}
```

**Available field types**: `entity`, `text`, `number`, `color`, `select`, `checkbox`, `custom`

---

## 🔄 Card Lifecycle

### LCARdSCard Lifecycle Hooks

```javascript
export class MyCard extends LCARdSCard {

  // 1. Called once on first render
  _handleFirstUpdate(changedProps) {
    super._handleFirstUpdate(changedProps);
    // Setup: register with RulesEngine, subscribe to DataSources
  }

  // 2. Called on HASS updates
  _handleHassUpdate(newHass, oldHass) {
    super._handleHassUpdate(newHass, oldHass);
    // Update entity references, recompute state
  }

  // 3. Called on every render
  _renderCard() {
    return html`<div>Card content</div>`;
  }

  // 4. Called when rule patches change
  _onRulePatchesChanged(patches) {
    this._resolveStyle(); // Must call requestUpdate()
  }
}
```

---

## 🏷️ Required Card Properties

Every card class **must** declare these two static members:

```javascript
export class MyCard extends LCARdSCard {

  /** Used by CoreConfigManager for schema lookup & config processing */
  static CARD_TYPE = 'my-card';

  /** Returns a minimal config shown in the HA card picker */
  static getStubConfig() {
    return {
      type: 'custom:lcards-my-card',
      entity: 'light.example'
    };
  }
}
```

**`CARD_TYPE`** must match the key registered in `CoreConfigManager`'s schema map. If absent, `processConfig()` cannot find the schema and silently skips validation and preset merging.

**`getStubConfig()`** should return the *minimum viable config* for the card to render meaningfully in the card picker gallery. Always include `type` and `entity` if the card needs one.

---

## 📐 Card Size

Override `_getCardSize()` to return the card's height in HA grid rows. Use the inherited `_pxToGridUnits()` helper for pixel-based configs:

```javascript
_getCardSize() {
  const h = this.config.style?.height;
  // _pxToGridUnits returns null for non-px values (%, em, etc.) → fall back to default
  return this._pxToGridUnits(h) ?? 3;
}
```

Returning the default `1` when a card is taller causes HA to clip the card in dashboard layout mode.

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

### setupActions()

Use the inherited `setupActions()` for all tap/hold/double-tap interactions — never bind raw click/pointer listeners for HA actions.

```javascript
_handleFirstUpdate() {
  super._handleFirstUpdate();

  const el = this.shadowRoot.querySelector('.interactive');
  if (el) {
    // Returns cleanup function; base also cleans up on disconnect
    this._actionsCleanup = this.setupActions(el, {
      tap_action: this.config.tap_action,
      hold_action: this.config.hold_action,
      double_tap_action: this.config.double_tap_action
    });
  }
}
```

`setupActions()` automatically handles HA actions (navigate, call-service, more-info, toggle, url, fire-event, assist), integrates card-level `sounds` config, and supports anime.js animation triggers.

### callService()

Use the inherited `callService()` helper — do **not** call `this.hass.callService()` directly:

```javascript
// ✅ CORRECT — wrapped with error handling and logging
await this.callService('light', 'turn_on', {
  entity_id: this.config.entity,
  brightness: 255
});

// ❌ AVOID — bypasses base-class error handling
await this.hass.callService('light', 'turn_on', { entity_id: ... });
```

---

## 👁️ Preview Mode Guard

`isPreviewMode()` returns `false`, `'editor'`, or `'picker'`. The `'picker'` state means the card is in the HA card picker gallery — skip any expensive initialisation.

```javascript
_handleFirstUpdate() {
  super._handleFirstUpdate();

  if (this.isPreviewMode() === 'picker') {
    // Skip: SVG loading, DataSource subscriptions, animations, ResizeObservers
    return;
  }

  // Full init — runs when live on dashboard or in the editor panel
  this._initExpensiveSetup();
}
```

**Do NOT** guard against `'editor'` — the editor preview should render normally so designers see live changes.

---

## 🧹 Disconnection & Cleanup

`LCARdSCard._onDisconnected()` automatically handles all standard cleanup:

| What | How it's cleaned up |
|------|---------------------|
| Core registration | `core.unregisterCard()` |
| SystemsManager overlay | `systemsManager.unregisterOverlay()` |
| `subscribeToEntity()` calls | Auto-tracked set, fully cleared |
| Registered DataSources | Auto-deregistered |
| ResizeObserver | Disconnected |
| `setupActions()` handler | Cleanup fn called |

**Cards must NOT duplicate these cleanup calls.** Only add an `_onDisconnected()` override for card-specific teardown:

```javascript
_onDisconnected() {
  // Cancel own timers / abort controllers / 3rd-party instances
  if (this._myInterval) {
    clearInterval(this._myInterval);
    this._myInterval = null;
  }
  super._onDisconnected(); // Always call super last
}
```

**Key rule**: If you subscribed via `this.subscribeToEntity()`, do NOT also manually unsubscribe — that is double-cleanup.

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

`LCARdSCard` provides two first-class entity access helpers. Prefer them over direct `this.hass.states` access.

#### Event-driven (preferred) — `subscribeToEntity()`

Fires a callback whenever the entity changes. Subscriptions are **automatically unsubscribed** when the card disconnects — no manual cleanup needed.

```javascript
_handleFirstUpdate() {
  super._handleFirstUpdate();

  // Callback fires on initial load and on every state change
  this.subscribeToEntity(this.config.entity, (entityId, newState, oldState) => {
    this._entity = newState;
    this.requestUpdate();
  });
}
```

#### Synchronous snapshot — `getEntityState()`

Returns the current cached state without subscribing. Useful for one-time reads or after a `subscribeToEntity` callback already fired.

```javascript
const state = this.getEntityState('sensor.temperature');
// or use the card's own entity:
const state = this.getEntityState();
```

#### Anti-pattern — raw HASS access

```javascript
// ❌ BAD: bypasses caching, no auto-cleanup event-driven updates
render() {
  const state = this.hass.states[this.config.entity_id];
  return html`${state.state}`;
}

// ❌ BAD: manual systemsManager.subscribeToEntity() is not auto-tracked
const unsub = this._singletons.systemsManager.subscribeToEntity(id, cb);
// (you'd have to manually call unsub() in _onDisconnected)
```

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

### Editor Field Types

`LCARdSBaseEditor._getConfigTabConfig()` accepts these field types:

| Type | Use Case |
|------|----------|
| `entity` | Entity ID picker |
| `text` | Free-form text input |
| `number` | Numeric with optional min/max/step |
| `color` | Color picker (supports `var()` and computed expressions) |
| `select` | Dropdown — pair with `options: [{ value, label }]` |
| `checkbox` | Boolean toggle |
| `custom` | Inject any Lit `html` template via `render` callback |

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

---

*Last Updated: March 2026 | LCARdS v1.12.01*
