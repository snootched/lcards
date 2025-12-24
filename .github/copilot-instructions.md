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

**Use cached singleton access** (80-90% faster than direct HASS):

```javascript
// ❌ BAD: Direct HASS access on every render
render() {
  const state = this.hass.states[this.config.entity_id];
  return html`${state.state}`;
}

// ✅ GOOD: Cache entity reference
_handleHassUpdate(newHass, oldHass) {
  super._handleHassUpdate(newHass, oldHass);
  this._entity = newHass.states[this.config.entity_id];
  this.requestUpdate();
}

render() {
  return html`${this._entity?.state}`;
}
```

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
2. Create editor `src/editor/cards/lcards-mycard-editor.js` extending `LCARdSBaseEditor`
3. Register in `src/lcards.js`:
   ```javascript
   import { MyCard } from './cards/lcards-mycard.js';
   customElements.define('lcards-mycard', MyCard);
   ```
4. Add schema to CoreConfigManager if using validation
5. Build and test

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

❌ **Don't** pass HASS object manually between components - use singleton propagation
❌ **Don't** create new template evaluators for each evaluation - reuse instances
❌ **Don't** register custom elements in card files - centralize in `src/lcards.js`
❌ **Don't** access `this.hass.states` on every render - cache entity references
❌ **Don't** forget `requestUpdate()` after applying rule patches
❌ **Don't** use `console.log()` - use `lcardsLog` with severity level
❌ **Don't** skip provenance tracking for config changes

---

*Last Updated: December 2025 | LCARdS v1.12.01*
