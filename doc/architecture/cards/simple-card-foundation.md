# LCARdS Simple Card Architecture

## Overview

The Simple Card foundation provides a minimal, clear base for building single-purpose Home Assistant cards that leverage LCARdS singleton systems without MSD complexity.

## Philosophy

**Explicit Over Magic**
- Card explicitly requests what it needs
- No auto-subscriptions or hidden behavior
- Clear, predictable lifecycle

**Minimal Foundation**
- Only essential helpers provided
- Card owns its rendering logic
- Simple template processing

**Singleton Integration** ⭐
- Direct access to CoreSystemsManager, theme, rules, animations
- Entity caching with 80-90% performance improvement
- Reactive subscriptions via `subscribeToEntity()` API
- No intermediate abstraction layers
- Cards use what they need

## Class Hierarchy

```
LitElement
    ↓
LCARdSNativeCard (HA integration, shadow DOM, actions)
    ↓
LCARdSSimpleCard (singleton access, helpers)
    ↓
[Your Simple Card] (rendering, logic)
```

## When to Use

### Use Simple Card For:
- ✅ Single-purpose cards (buttons, labels, status)
- ✅ Cards with 1-3 entities
- ✅ Template-driven content
- ✅ Action-based interactions
- ✅ Simple state displays

### Use MSD Card For:
- ✅ Multi-overlay displays
- ✅ Complex navigation/routing
- ✅ Grid-based layouts
- ✅ Custom SVG composition
- ✅ Advanced animation sequences

## Creating a Simple Card

### Basic Structure

```javascript
import { html } from 'lit';
import { LCARdSSimpleCard } from '../base/LCARdSSimpleCard.js';

export class MySimpleCard extends LCARdSSimpleCard {

    // 1. Define reactive properties
    static get properties() {
        return {
            ...super.properties,
            _myState: { type: String, state: true }
        };
    }

    // 2. Initialize state
    constructor() {
        super();
        this._myState = 'initial';
    }

    // 3. Handle HASS updates (optional)
    _handleHassUpdate(newHass, oldHass) {
        // Process entity changes
        this._myState = this._entity?.state || 'unknown';
    }

    // 4. Render your content
    _renderCard() {
        return html`
            <div class="my-card">
                <!-- Your rendering here -->
            </div>
        `;
    }
}
```

### Available Helpers

#### CoreSystemsManager Integration

**Cached Entity Access** - 80-90% faster with multiple cards:
```javascript
// Automatic caching with fallback
const entity = this.getEntityState('light.bedroom');
// Uses CoreSystemsManager cache first, falls back to direct HASS
```

**Reactive Entity Subscriptions** - Get notified when entities change:
```javascript
// Subscribe to entity changes
const unsubscribe = this.subscribeToEntity(
  'sensor.temperature',
  (entityId, newState, oldState) => {
    console.log(`Temperature changed: ${oldState.state} -> ${newState.state}`);
    this.requestUpdate(); // Trigger re-render
  }
);

// Cleanup (handled automatically in _onDisconnected)
unsubscribe();
```

**Automatic Lifecycle Management**:
- Card registration on connect (automatic)
- Entity cache population (automatic)
- Subscription cleanup on disconnect (automatic)
- Memory leak prevention (automatic)

#### Template Processing

```javascript
// Process [[[JavaScript]]] and {{tokens}}
const result = this.processTemplate(template);
```

#### Theme Access

```javascript
// Get theme token value
const color = this.getThemeToken('colors.accent.primary', '#ff9900');

// Get style preset
const preset = this.getStylePreset('button', 'lozenge');
```

#### Style Resolution

```javascript
// Combine base + theme + state
const style = this.resolveStyle(
    baseStyle,                    // Base styles
    ['colors.primary'],           // Theme tokens to apply
    { opacity: 0.8 }              // State overrides
);
```

#### Entity Access

```javascript
// Get current entity (cached via CoreSystemsManager)
const entity = this._entity;

// Get other entity (cached, 80-90% faster with multiple cards)
const other = this.getEntityState('light.bedroom');

// Subscribe to entity changes (reactive updates)
const unsubscribe = this.subscribeToEntity('sensor.temp', (id, newState, oldState) => {
  this._temperature = newState.state;
  this.requestUpdate();
});
```

#### Service Calls

```javascript
// Call HA service
await this.callService('light', 'turn_on', {
    entity_id: 'light.bedroom',
    brightness: 255
});
```

#### Actions

```javascript
// Setup action handlers
this._actionCleanup = this.setupActions(element, {
    tap_action: { action: 'toggle' },
    hold_action: { action: 'more-info' }
});
```

### RulesEngine Integration

SimpleCard provides first-class RulesEngine support for dynamic styling and behavior based on entity states.

#### Overview

The RulesEngine allows cards to react to entity state changes with style patches that have **highest priority** in the style resolution chain:

```
Style Resolution Priority:
1. Base config style (lowest)
2. Preset styles
3. Theme token resolution
4. State overrides
5. Rule patches (highest) ⭐
```

#### Basic Setup

```javascript
export class MySimpleCard extends LCARdSSimpleCard {

    constructor() {
        super();
        this._cardStyle = {}; // Your card's style state
    }

    // 1. Register overlay with RulesEngine
    _handleFirstUpdate() {
        super._handleFirstUpdate();

        // Register this card as an overlay for rules
        this._registerOverlayForRules({
            id: `my-card-${this._cardGuid}`,
            type: 'button', // or 'label', 'custom', etc.
            metadata: {
                entity: this.config.entity,
                cardType: 'my-simple-card'
            }
        });
    }

    // 2. Implement the patch changed hook
    _onRulePatchesChanged(patches) {
        // Called when rules re-evaluate and patches change
        // Re-resolve style to pick up new rule patches
        this._resolveCardStyle();
    }

    // 3. Merge rule patches into style
    _resolveCardStyle() {
        let style = { ...(this.config.style || {}) };

        // Apply preset
        if (this.config.preset) {
            const preset = this.getStylePreset('card', this.config.preset);
            style = { ...preset, ...style };
        }

        // Apply theme tokens
        style = this.resolveStyle(style, ['colors.primary']);

        // ⭐ Merge with rule patches (highest priority)
        style = this._getMergedStyleWithRules(style);

        // Only update if changed (prevents unnecessary re-renders)
        if (JSON.stringify(this._cardStyle) !== JSON.stringify(style)) {
            this._cardStyle = style;
            this.requestUpdate(); // ⚠️ CRITICAL: Trigger re-render
        }
    }
}
```

#### YAML Configuration

```yaml
type: custom:my-simple-card
entity: light.bedroom
style:
  primary: '#ff9900'
  textColor: '#ffffff'
rules:
  - id: light_on_green
    when:
      entity: light.bedroom
      conditions:
        - attribute: state
          operator: '=='
          value: 'on'
    apply:
      style:
        primary: '#00ff00'  # Green when on
        textColor: '#000000'
```

#### Critical Implementation Details

**1. Always call `requestUpdate()` after applying patches:**

```javascript
_onRulePatchesChanged(patches) {
    this._resolveCardStyle();
    // ✅ REQUIRED: Lit won't re-render without this
    this.requestUpdate();
}
```

**2. Use inline styles, not CSS classes:**

```javascript
// ❌ WRONG: CSS classes are static and cached
return html`
    <svg>
        <style>
            .button-bg { fill: ${primary}; }
        </style>
        <rect class="button-bg" />
    </svg>
`;

// ✅ CORRECT: Inline styles update dynamically
return html`
    <svg>
        <rect style="fill: ${primary};" />
    </svg>
`;
```

**3. Never use `!important` in static CSS:**

```css
/* ❌ WRONG: Blocks inline style updates */
.button-bg {
    fill: #ff9900 !important;
}

/* ✅ CORRECT: Let inline styles override */
.button-bg {
    fill: #ff9900;
}
```

**4. Trigger initial evaluation when HASS available:**

The base class handles this automatically when you register your overlay. The system will:
- Register overlay when `_registerOverlayForRules()` is called
- Check if HASS is already available
- Trigger initial rule evaluation if HASS is ready
- Set up callback for future rule changes

#### Performance Optimization

**Entity-Specific Rule Evaluation**

SimpleCards use the same efficient entity-based monitoring as MSD cards:

```javascript
// Automatically called in _onConnected() after rules are loaded
await this._rulesManager.setupHassMonitoring(this._hass);
```

**How it works:**

1. **WebSocket Subscription**: Subscribes directly to HASS `state_changed` events
2. **Dependency Tracking**: Only listens to entities referenced in your rules
3. **Selective Dirty-Marking**: Only marks rules dirty when their entities change
4. **Efficient Callbacks**: Only triggers re-evaluation when rules are actually dirty

**Performance Benefits:**

- ✅ **No unnecessary evaluations**: Rules only run when their entities change
- ✅ **Shared monitoring**: Multiple cards share the same WebSocket subscription
- ✅ **Low overhead**: O(1) entity lookup via cached Set

**Example:**

```yaml
# Rule only re-evaluates when sensor.cpu_temp changes
# Ignores changes to sensor.memory, light.bedroom, etc.
rules:
  - id: cpu_hot_red
    when:
      entity: sensor.cpu_temp
      conditions:
        - attribute: state
          operator: '>'
          value: 80
    apply:
      style:
        primary: '#ff0000'
```

**Debug Logging:**

```javascript
// Enable to see entity-specific evaluation
lcardsLog.setLogLevel('debug');

// Look for these messages:
// "[RulesEngine] Processing entity change: sensor.cpu_temp -> 85"
// "[RulesEngine] Marked 1 rules dirty for entity sensor.cpu_temp"
```

#### Complete Flow

```mermaid
graph TD
    A[Card Connected] --> B[_handleFirstUpdate]
    B --> C[_registerOverlayForRules]
    C --> D{HASS Available?}
    D -->|Yes| E[Trigger Initial Evaluation]
    D -->|No| F[Wait for HASS]
    F --> G[HASS Update]
    G --> E
    E --> H[Rules Evaluate]
    H --> I[Patches Generated]
    I --> J[_onRulePatchesChanged callback]
    J --> K[_resolveCardStyle]
    K --> L[_getMergedStyleWithRules]
    L --> M[requestUpdate]
    M --> N[Render with new styles]

    O[Entity State Change] --> P[HASS Update]
    P --> H
```

#### Debugging Rules Integration

Common issues and solutions:

| Issue | Symptom | Solution |
|-------|---------|----------|
| Rules evaluate but no visual change | Console shows patches applied but colors don't change | Add `this.requestUpdate()` after style changes |
| Styles computed but not displayed | Logs show correct colors but DOM shows old colors | Use inline styles, not CSS classes |
| Inline styles ignored | DOM shows correct style attribute but wrong rendering | Remove `!important` from static CSS |
| Rules don't evaluate on load | Button shows default style when light already ON | Base class handles this automatically |

#### Performance Notes

- Rule evaluation is **cached and dirty-tracked** - only re-evaluates when entity states change
- Style comparison uses JSON stringify - only triggers re-render if style actually changed
- Patches are **reference-compared** - identical patches don't trigger callbacks
- Initial evaluation happens once on registration if HASS available

#### Advanced: Multiple Overlays

If your card has multiple sub-components (like a button with multiple parts):

```javascript
_handleFirstUpdate() {
    super._handleFirstUpdate();

    // Register main button
    this._registerOverlayForRules({
        id: `button-${this._cardGuid}`,
        type: 'button',
        metadata: { entity: this.config.entity }
    });

    // Register sub-components
    this._registerOverlayForRules({
        id: `icon-${this._cardGuid}`,
        type: 'icon',
        metadata: { entity: this.config.entity }
    });
}

// Apply patches to correct component
_onRulePatchesChanged(patches) {
    // Patches include overlayId - check which component they're for
    if (patches.overlayId.startsWith('button-')) {
        this._resolveButtonStyle();
    } else if (patches.overlayId.startsWith('icon-')) {
        this._resolveIconStyle();
    }
    this.requestUpdate();
}
```

## HASS Distribution Integration

SimpleCard integrates with the singleton HASS distribution system and CoreSystemsManager:

### Automatic HASS Updates
- Inherits from `LCARdSNativeCard` which gets HASS from HA
- `_onHassChanged()` called automatically when HASS updates
- Entity references updated automatically via CoreSystemsManager cache

### Feeding HASS to Singletons
- SimpleCard calls `window.lcards.core.ingestHass(hass)` to update singletons
- This enables cross-card coordination and shared entity state
- Rules engine, theme manager, CoreSystemsManager get updated HASS data

### Entity Caching via CoreSystemsManager ⭐
- CoreSystemsManager maintains global entity state cache
- First entity access: Cache miss → Direct HASS lookup → Cache population
- Subsequent accesses: Cache hit (~80-90% faster)
- Cache automatically updated on HASS changes
- All SimpleCards share the same cache

### HASS Flow
```
Home Assistant
    ↓
Card.hass = hass (automatic via LCARdSNativeCard)
    ↓
_onHassChanged() (SimpleCard override)
    ↓
window.lcards.core.ingestHass(hass) (feed to singletons)
    ↓  ↓  ↓
    ↓  ↓  └─> CoreSystemsManager.updateHass(hass)
    ↓  ↓         ├─> Detect changed entities
    ↓  ↓         ├─> Update entity cache
    ↓  ↓         └─> Notify subscribers
    ↓  └─> RulesEngine, ThemeManager, etc.
    └─> All other cards get updated via singleton system
```

**Performance Comparison:**
- **Without CoreSystemsManager**: 10 cards × 10 HASS lookups = 100 operations
- **With CoreSystemsManager**: 1 cache update + 10 cache reads = ~10 operations
- **Result**: ~80-90% performance improvement with multiple cards

## Example: Simple Label Card

```javascript
import { html, css } from 'lit';
import { LCARdSSimpleCard } from '../base/LCARdSSimpleCard.js';

export class LCARdSSimpleLabelCard extends LCARdSSimpleCard {

    static get properties() {
        return {
            ...super.properties,
            _displayText: { type: String, state: true }
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                .label-container {
                    padding: 16px;
                    font-family: var(--lcars-font-family, 'Antonio', sans-serif);
                    font-size: 18px;
                    color: var(--primary-text-color);
                }
            `
        ];
    }

    _handleHassUpdate(newHass, oldHass) {
        // Process template when entity changes
        const template = this.config.text || '{{entity.state}}';
        this._displayText = this.processTemplate(template);
    }

    _renderCard() {
        return html`
            <div class="label-container">
                ${this._displayText}
            </div>
        `;
    }
}

customElements.define('lcards-simple-label', LCARdSSimpleLabelCard);
```

## Best Practices

### 1. Minimal State

Only store what you need:

```javascript
constructor() {
    super();
    this._displayValue = null;  // ✅ Minimal state
}
```

### 2. Explicit Processing

Process templates explicitly:

```javascript
_handleHassUpdate(newHass, oldHass) {
    // ✅ Explicit: only when needed
    this._value = this.processTemplate(this.config.value);
}
```

### 3. Clear Lifecycle

Use provided hooks:

```javascript
_handleFirstUpdate() {
    // ✅ Initial setup
    this._setupCard();
}

_handleHassUpdate() {
    // ✅ React to changes
    this._updateDisplay();
}
```

### 4. Cleanup

Always cleanup resources:

```javascript
disconnectedCallback() {
    if (this._cleanup) {
        this._cleanup();  // ✅ Release resources
    }
    super.disconnectedCallback();
}
```

## Testing

Create test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Simple Card Test</title>
    <script type="module" src="/dist/lcards.js"></script>
</head>
<body>
    <lcards-simple-button
        entity="light.bedroom"
        label="Test Button"
        preset="lozenge">
    </lcards-simple-button>
</body>
</html>
```

## API Reference

### LCARdSSimpleCard Properties

| Property | Type | Description |
|----------|------|-------------|
| `_entity` | Object | Current entity state (if config.entity set) |
| `_singletons` | Object | Singleton system references (systemsManager, theme, rules, etc.) |
| `_initialized` | Boolean | Whether card is fully initialized |
| `_entitySubscriptions` | Set | Tracked entity subscriptions for cleanup |
| `_cardContext` | Object | CoreSystemsManager registration context |
| `_overlayRegistered` | Boolean | Whether overlay is registered with RulesEngine |
| `_currentRulePatches` | Object | Cached rule patches for this overlay |

### LCARdSSimpleCard Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `processTemplate(template)` | template: string | string | Process [[[JS]]] and {{token}} templates |
| `getThemeToken(path, fallback)` | path: string, fallback: any | any | Get theme token value |
| `getStylePreset(type, name)` | type: string, name: string | Object\|null | Get style preset config |
| `resolveStyle(base, tokens, overrides)` | base: Object, tokens: Array, overrides: Object | Object | Resolve combined styles |
| `getEntityState(entityId)` | entityId?: string | Object\|null | Get entity state (cached via CoreSystemsManager) |
| `subscribeToEntity(entityId, callback)` | entityId: string, callback: Function | Function | Subscribe to entity changes (returns unsubscribe function) |
| `callService(domain, service, data)` | domain: string, service: string, data?: Object | Promise | Call HA service |
| `setupActions(element, actions)` | element: HTMLElement, actions: Object | Function | Setup action handlers |
| `_registerOverlayForRules(overlay)` | overlay: Object | void | Register overlay with RulesEngine for rule-based styling |
| `_getMergedStyleWithRules(baseStyle)` | baseStyle: Object | Object | Merge base style with active rule patches (rules have highest priority) |
| `_applyRulePatches(patches)` | patches: Object | void | Internal method to apply rule patches and trigger callback |

### Lifecycle Hooks

| Hook | When Called | Purpose |
|------|-------------|---------|
| `_handleHassUpdate(newHass, oldHass)` | HASS updates | React to entity changes |
| `_handleFirstUpdate(changedProps)` | First render | Initial setup |
| `_renderCard()` | Every render | Return card content HTML |
| `_onRulePatchesChanged(patches)` | Rule patches change | React to rule-based style changes (implement in subclass) |

## Summary

Simple Card provides exactly what you need:
- ✅ CoreSystemsManager integration (entity caching + subscriptions)
- ✅ 80-90% faster entity access with multiple cards
- ✅ Reactive entity subscription API
- ✅ Automatic lifecycle management (register, cleanup)
- ✅ RulesEngine integration (dynamic styling based on state)
- ✅ Overlay registration and patch system
- ✅ Singleton access (theme, rules, animations)
- ✅ Template processing
- ✅ Style resolution with priority chain
- ✅ Action handling
- ✅ Entity management
- ✅ HASS distribution integration

Nothing more, nothing less.

---

**Status:** ✅ RulesEngine fully integrated with SimpleCard