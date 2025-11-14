# SimpleButton Card - Reference Implementation

**Version:** v1.9.30+
**Status:** Production
**Purpose:** Reference implementation demonstrating SimpleCard + RulesEngine integration

---

## Overview

The `LCARdSSimpleButtonCard` serves as the **canonical reference implementation** for building SimpleCard-based cards with full RulesEngine integration. It demonstrates:

- ✅ Proper overlay registration with RulesEngine
- ✅ Dynamic style resolution with rule patches
- ✅ Inline SVG rendering for dynamic updates
- ✅ Action handling with animation triggers
- ✅ Entity state tracking and updates
- ✅ Preset and theme token support

## File Location

```
src/cards/lcards-simple-button.js
```

## Architecture

### Class Hierarchy

```
LitElement
    ↓
LCARdSNativeCard (HA integration, shadow DOM, HASS lifecycle)
    ↓
LCARdSSimpleCard (singleton access, overlay registration, helpers)
    ↓
LCARdSSimpleButtonCard (button-specific logic, SVG rendering)
```

### Key Components

1. **Config Processing** - Validates and normalizes button configuration
2. **Entity Tracking** - Watches entity state for updates
3. **Style Resolution** - Merges config + preset + theme + **rules**
4. **SVG Generation** - Creates inline SVG with dynamic styles
5. **Action Setup** - Attaches tap/hold/double_tap handlers
6. **Rules Integration** - Registers overlay and applies patches

---

## Implementation Details

### 1. Initialization

```javascript
constructor() {
    super();
    this._entity = null;
    this._buttonStyle = {}; // Resolved button style
    this._animationManager = null;
}
```

**Key State:**
- `_entity`: Current entity object (from HASS)
- `_buttonStyle`: Fully resolved style (config + preset + theme + rules)
- `_animationManager`: Reference to AnimationManager singleton

### 2. First Update Hook

```javascript
_handleFirstUpdate() {
    super._handleFirstUpdate();

    // Get AnimationManager reference
    this._animationManager = this._singletons?.animationManager;

    // 🎯 Register with RulesEngine
    this._registerOverlayForRules({
        id: `simple-button-${this._cardGuid}`,
        type: 'button',
        metadata: {
            entity: this.config.entity,
            cardType: 'simple-button',
            label: this.config.label
        }
    });

    // Resolve initial style
    this._resolveButtonStyleSync();
}
```

**Critical Steps:**
1. Get AnimationManager reference for action handlers
2. **Register overlay** with RulesEngine using unique ID
3. Resolve initial button style (includes theme, preset, and initial rules)

### 3. Style Resolution (The Heart of RulesEngine Integration)

```javascript
_resolveButtonStyleSync() {
    // Start with base style from config
    let style = { ...(this.config.style || {}) };

    // Apply preset if specified (lower priority)
    if (this.config.preset) {
        const preset = this.getStylePreset('button', this.config.preset);
        if (preset) {
            style = { ...preset, ...style }; // Config overrides preset
        }
    }

    // Get state-based overrides (e.g., brightness for lights)
    const stateOverrides = this._getStateOverrides();

    // Resolve theme tokens
    let resolvedStyle = this.resolveStyle(style, [
        'colors.accent.primary',
        'colors.text.primary'
    ], stateOverrides);

    // 🎯 Merge with rules-based styles (HIGHEST PRIORITY)
    resolvedStyle = this._getMergedStyleWithRules(resolvedStyle);

    // Only update if changed (prevents unnecessary re-renders)
    if (!this._buttonStyle ||
        JSON.stringify(this._buttonStyle) !== JSON.stringify(resolvedStyle)) {
        this._buttonStyle = resolvedStyle;
        lcardsLog.trace('[LCARdSSimpleButtonCard] Button style resolved, triggering re-render');

        // ⚠️ CRITICAL: Must call requestUpdate() to trigger re-render
        this.requestUpdate();
    }
}
```

**Style Resolution Priority (low to high):**
1. Preset styles (if specified)
2. Config styles (overrides preset)
3. Theme token resolution
4. State-based overrides
5. **Rule patches** ⭐ (highest priority, applied via `_getMergedStyleWithRules()`)

**Why JSON.stringify comparison?**
- Prevents unnecessary re-renders when style hasn't actually changed
- Critical for performance when rules re-evaluate frequently

### 4. RulesEngine Hook Implementation

```javascript
/**
 * Hook called when rule patches change
 * @param {Object} patches - Updated rule patches
 * @private
 */
_onRulePatchesChanged(patches) {
    lcardsLog.debug('[LCARdSSimpleButtonCard] Rule patches changed, re-resolving style');

    // Re-resolve style to pick up new rule patches
    this._resolveButtonStyleSync();

    // requestUpdate() called inside _resolveButtonStyleSync()
}
```

**Flow:**
1. RulesEngine detects entity state change
2. Rules re-evaluate
3. Patches generated and cached
4. Base class calls `_onRulePatchesChanged()`
5. Card re-resolves style (merges in new patches)
6. `requestUpdate()` triggers re-render
7. SVG regenerated with new colors

### 5. SVG Rendering (Critical for Dynamic Updates)

```javascript
_generateSimpleButtonSVG() {
    const { primary = '#ff9900', textColor = '#ffffff' } = this._buttonStyle;
    const label = this.config.label || 'Button';

    // ✅ CORRECT: Use inline styles, not CSS classes
    return `
        <svg viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg">
            <rect
                x="0" y="0"
                width="200" height="50"
                rx="25"
                style="fill: ${primary}; stroke: none;"
            />
            <text
                x="100" y="50%"
                text-anchor="middle"
                dominant-baseline="middle"
                style="fill: ${textColor}; font-family: 'Antonio', sans-serif; font-size: 16px; font-weight: 700;"
            >
                ${label}
            </text>
        </svg>
    `;
}
```

**⚠️ Critical Implementation Details:**

**❌ WRONG - CSS Classes:**
```svg
<svg>
    <style>
        .button-bg { fill: #ff9900; }  /* Static, cached by browser */
        .button-text { fill: #ffffff !important; }  /* !important blocks inline */
    </style>
    <rect class="button-bg" />
    <text class="button-text">Label</text>
</svg>
```

**Problems with CSS classes:**
1. Browser caches `<style>` blocks even when SVG regenerates
2. CSS class definitions don't change when variables change
3. `!important` rules block inline style overrides
4. No way to dynamically update without full DOM replacement

**✅ CORRECT - Inline Styles:**
```svg
<svg>
    <rect style="fill: ${primary};" />
    <text style="fill: ${textColor};">Label</text>
</svg>
```

**Why inline styles work:**
1. Evaluated fresh on every render
2. Variables interpolated directly into style string
3. No CSS specificity issues
4. No caching problems
5. Lit re-renders actually update the visual

### 6. Action Setup

```javascript
_setupButtonActions() {
    if (!this.shadowRoot) {
        lcardsLog.trace('[LCARdSSimpleButtonCard] Shadow root not available yet');
        return;
    }

    const buttonElement = this.shadowRoot.querySelector(`[data-overlay-id="simple-button-${this._cardGuid}"]`);

    if (!buttonElement) {
        lcardsLog.trace('[LCARdSSimpleButtonCard] Button element not found yet (normal during initial render)');
        return;
    }

    // Setup actions with animation support
    const actionConfig = {
        tap_action: this.config.tap_action || { action: 'toggle' },
        hold_action: this.config.hold_action || { action: 'more-info' },
        double_tap_action: this.config.double_tap_action
    };

    // Attach action handlers
    const cleanupFn = this.setupActions(buttonElement, actionConfig, {
        entity: this._entity,
        hass: this.hass,
        getAnimationManager: () => this._animationManager,
        overlayId: `simple-button-${this._cardGuid}`
    });

    // Store cleanup function
    if (cleanupFn) {
        this._actionCleanup = cleanupFn;
    }

    lcardsLog.trace('[LCARdSSimpleButtonCard] Actions attached successfully');
}
```

**Key Points:**
- Uses `data-overlay-id` selector to find button element
- Passes AnimationManager reference for animation triggers
- Stores cleanup function for proper disconnection
- Trace-level logging (called frequently during updates)

### 7. HASS Update Handling

```javascript
_handleHassUpdate(newHass, oldHass) {
    // Base class feeds HASS to singletons
    super._handleHassUpdate(newHass, oldHass);

    // Get updated entity
    if (this.config.entity) {
        this._entity = this.getEntityState(this.config.entity);

        // Re-resolve style (may trigger rule evaluation)
        this._resolveButtonStyleSync();

        // Re-setup actions if entity changed
        this._setupButtonActions();
    }
}
```

**Flow:**
1. HASS updates (entity state changed)
2. Base class feeds HASS to singletons (including RulesEngine)
3. Card updates `_entity` reference
4. Style re-resolved (rules may have changed)
5. Actions re-attached (entity context updated)

---

## Configuration Example

```yaml
type: custom:lcards-simple-button
entity: light.bedroom
label: Bedroom Light
preset: lozenge
style:
  primary: '#ff9900'
  textColor: '#ffffff'
tap_action:
  action: toggle
hold_action:
  action: more-info
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
        primary: '#00ff00'      # Green when ON
        textColor: '#000000'    # Black text when ON
```

**Result:**
- Default: Orange button with white text
- When light ON: Green button with black text (via rules)
- Click: Toggle light
- Hold: Show more-info dialog

---

## Debugging Checklist

When implementing a similar card, verify:

- [ ] ✅ Overlay registered with unique ID in `_handleFirstUpdate()`
- [ ] ✅ `_onRulePatchesChanged()` hook implemented
- [ ] ✅ `_getMergedStyleWithRules()` called in style resolution
- [ ] ✅ `requestUpdate()` called after style changes
- [ ] ✅ Inline styles used in rendering (not CSS classes)
- [ ] ✅ No `!important` rules in static CSS
- [ ] ✅ Style comparison uses JSON.stringify to prevent duplicate updates
- [ ] ✅ Initial evaluation works (test by refreshing with entity already in target state)
- [ ] ✅ Entity updates trigger style re-resolution
- [ ] ✅ Action handlers attached with AnimationManager reference

---

## Common Pitfalls

### 1. Forgetting `requestUpdate()`

**Symptom:** Rules evaluate, patches applied, but no visual change

**Solution:**
```javascript
_onRulePatchesChanged(patches) {
    this._resolveButtonStyleSync();
    this.requestUpdate(); // ← Don't forget this!
}
```

### 2. Using CSS Classes

**Symptom:** Colors correct in DOM inspector but wrong on screen

**Solution:** Use inline styles, not `<style>` blocks with classes

### 3. `!important` in CSS

**Symptom:** Inline styles present but overridden

**Solution:** Remove all `!important` rules from static CSS

### 4. Missing Initial Evaluation

**Symptom:** Button wrong color when page loads with entity already in trigger state

**Solution:** Base class handles this automatically (v1.9.30+). Ensure you call `_registerOverlayForRules()` in `_handleFirstUpdate()`.

### 5. Duplicate Re-renders

**Symptom:** Performance issues, excessive logging

**Solution:** Compare styles with JSON.stringify before calling `requestUpdate()`:
```javascript
if (JSON.stringify(this._buttonStyle) !== JSON.stringify(resolvedStyle)) {
    this._buttonStyle = resolvedStyle;
    this.requestUpdate();
}
```

---

## Testing

### Test File Example

```yaml
# test/test-simple-button-rules.yaml
views:
  - title: Button Tests
    cards:
      - type: custom:lcards-simple-button
        entity: light.test_light
        label: Test Button
        rules:
          - id: test_rule
            when:
              entity: light.test_light
              conditions:
                - attribute: state
                  operator: '=='
                  value: 'on'
            apply:
              style:
                primary: '#00ff00'
```

### Test Scenarios

1. **Initial State**: Load page with light OFF → Button should be orange
2. **Turn On**: Toggle light ON → Button should turn green
3. **Turn Off**: Toggle light OFF → Button should turn orange
4. **Refresh While On**: Light ON, refresh page → Button should be green immediately
5. **Multiple Buttons**: Add 5 buttons for same light → All should update together

---

## Performance Characteristics

- **Entity Access**: Cached via CoreSystemsManager (~80-90% faster)
- **Rule Evaluation**: Dirty-tracked, only re-evaluates when entity changes
- **Style Resolution**: JSON comparison prevents unnecessary re-renders
- **SVG Rendering**: Inline styles evaluated on every render (fast)
- **Memory**: Single overlay registration, automatic cleanup on disconnect

---

## Related Documentation

- [Simple Card Foundation](../simple-card-foundation.md) - Base class architecture
- [RulesEngine](../subsystems/rules-engine.md) - Rule syntax and evaluation
- [Action System](../UNIFIED_ACTION_SYSTEM.md) - Action handlers and animations
- [Troubleshooting Guide](./simple-card-troubleshooting.md) - Common issues and solutions

---

**Last Updated:** November 14, 2025
**Author:** LCARdS Development Team
**Status:** ✅ Production-ready reference implementation
