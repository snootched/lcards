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

**Singleton Integration**
- Direct access to theme, rules, animations
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
// Get current entity
const entity = this._entity;

// Get other entity
const other = this.getEntityState('light.bedroom');
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

## HASS Distribution Integration

SimpleCard integrates with the singleton HASS distribution system:

### Automatic HASS Updates
- Inherits from `LCARdSNativeCard` which gets HASS from HA
- `_onHassChanged()` called automatically when HASS updates
- Entity references updated automatically

### Feeding HASS to Singletons
- SimpleCard calls `window.lcards.core.ingestHass(hass)` to update singletons
- This enables cross-card coordination and shared entity state
- Rules engine, theme manager, etc. get updated HASS data

### HASS Flow
```
Home Assistant
    ↓
Card.hass = hass (automatic via LCARdSNativeCard)
    ↓
_onHassChanged() (SimpleCard override)
    ↓
window.lcards.core.ingestHass(hass) (feed to singletons)
    ↓
All other cards get updated via singleton system
```

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

## Migration from V2

### Before (V2 - Complex)

```javascript
// ❌ Over-engineered
export class MyV2Card extends LCARdSV2Card {
    constructor() {
        super();
        this.systemsManager = new V2CardSystemsManager(this);
        // ... complex initialization
    }

    _applyOverlayPatch(patch) {
        // ... overlay logic (wrong abstraction)
    }
}
```

### After (Simple - Clean)

```javascript
// ✅ Clean and clear
export class MySimpleCard extends LCARdSSimpleCard {
    _renderCard() {
        const text = this.processTemplate(this.config.text);
        return html`<div>${text}</div>`;
    }
}
```

## API Reference

### LCARdSSimpleCard Properties

| Property | Type | Description |
|----------|------|-------------|
| `_entity` | Object | Current entity state (if config.entity set) |
| `_singletons` | Object | Singleton system references |
| `_initialized` | Boolean | Whether card is fully initialized |

### LCARdSSimpleCard Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `processTemplate(template)` | template: string | string | Process [[[JS]]] and {{token}} templates |
| `getThemeToken(path, fallback)` | path: string, fallback: any | any | Get theme token value |
| `getStylePreset(type, name)` | type: string, name: string | Object\|null | Get style preset config |
| `resolveStyle(base, tokens, overrides)` | base: Object, tokens: Array, overrides: Object | Object | Resolve combined styles |
| `getEntityState(entityId)` | entityId?: string | Object\|null | Get entity state |
| `callService(domain, service, data)` | domain: string, service: string, data?: Object | Promise | Call HA service |
| `setupActions(element, actions)` | element: HTMLElement, actions: Object | Function | Setup action handlers |

### Lifecycle Hooks

| Hook | When Called | Purpose |
|------|-------------|---------|
| `_handleHassUpdate(newHass, oldHass)` | HASS updates | React to entity changes |
| `_handleFirstUpdate(changedProps)` | First render | Initial setup |
| `_renderCard()` | Every render | Return card content HTML |

## Summary

Simple Card provides exactly what you need:
- ✅ Singleton access
- ✅ Template processing
- ✅ Style resolution
- ✅ Action handling
- ✅ Entity management
- ✅ HASS distribution integration

Nothing more, nothing less.