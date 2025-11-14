# SimpleCard Troubleshooting Guide

**Version:** v1.9.30+
**Last Updated:** November 14, 2025
**Purpose:** Common issues and solutions for SimpleCard + RulesEngine integration

---

## Overview

This guide documents common issues encountered when building SimpleCard-based cards with RulesEngine integration, based on real debugging sessions. Each issue includes symptoms, root cause, and solution.

---

## Issue 1: Rules Evaluate But No Visual Change

### Symptoms
- Console logs show "Rule patches applied"
- Patches contain correct style values (e.g., `primary: '#00ff00'`)
- Button/card remains unchanged visually
- Entity state changes are detected
- Rules are evaluating correctly

### Root Cause
Missing `requestUpdate()` call after applying rule patches. Lit's reactive system requires explicit notification when internal state changes.

### Debug Logs
```
[RulesEngine] Rule 'light_on_green' matched
[LCARdSSimpleCard] Applied rule patches to simple-button-xxxxx
  patchCount: 1
[LCARdSSimpleButtonCard] Button style resolved
  style: { primary: '#00ff00', textColor: '#000000' }
// ❌ No re-render triggered!
```

### Solution
Always call `this.requestUpdate()` after style changes:

```javascript
// ❌ WRONG: No requestUpdate()
_onRulePatchesChanged(patches) {
    this._resolveButtonStyle();
    // Missing: this.requestUpdate();
}

// ✅ CORRECT: Call requestUpdate()
_onRulePatchesChanged(patches) {
    this._resolveButtonStyle();
    this.requestUpdate(); // Triggers Lit re-render
}

// ✅ ALSO CORRECT: Call it inside the resolve method
_resolveButtonStyle() {
    let style = this._getMergedStyleWithRules(this.config.style);
    if (JSON.stringify(this._buttonStyle) !== JSON.stringify(style)) {
        this._buttonStyle = style;
        this.requestUpdate(); // Called here
    }
}
```

### Prevention
- Always pair style updates with `requestUpdate()`
- Use JSON comparison to avoid unnecessary updates
- Check console for "re-render" log messages

---

## Issue 2: Styles Computed But Not Displayed

### Symptoms
- DOM inspector shows correct style values: `style="fill: #00ff00;"`
- Button/element still displays old color (e.g., orange instead of green)
- Console shows no errors
- Refreshing page doesn't fix it

### Root Cause
CSS classes used in `<style>` blocks are **cached by the browser** and don't update when the SVG regenerates.

### Debug Evidence
```html
<!-- What you see in DOM inspector: -->
<svg>
    <style>
        .button-bg { fill: #ff9900; }  /* Static, cached */
    </style>
    <rect class="button-bg" style="fill: #00ff00;" />
    <!-- Browser applies .button-bg class first, style attribute ignored -->
</svg>
```

### Solution
Use inline styles exclusively, remove `<style>` blocks:

```javascript
// ❌ WRONG: CSS classes in <style> block
_generateButtonSVG() {
    return `
        <svg>
            <style>
                .button-bg { fill: ${primary}; }
            </style>
            <rect class="button-bg" />
        </svg>
    `;
}

// ✅ CORRECT: Inline styles only
_generateButtonSVG() {
    return `
        <svg>
            <rect style="fill: ${primary};" />
        </svg>
    `;
}
```

### Prevention
- Never use `<style>` blocks in dynamically generated SVG
- Use inline `style` attributes exclusively
- Verify in DOM inspector that style attribute values match expected colors

---

## Issue 3: Inline Styles Overridden

### Symptoms
- Inline styles present in DOM: `style="fill: #00ff00;"`
- Element displays different color
- Inspector shows style with strikethrough/override indicator
- Computed styles tab shows unexpected value

### Root Cause
`!important` rules in static CSS override inline styles.

### Debug Evidence
```css
/* Static CSS in component styles */
.button-bg {
    fill: #ff9900 !important;  /* ← This wins over inline styles */
}
```

```html
<!-- DOM -->
<rect class="button-bg" style="fill: #00ff00;" />
<!-- Rendered as orange due to !important -->
```

### Solution
Remove all `!important` rules from static CSS:

```javascript
// ❌ WRONG: !important blocks inline styles
static get styles() {
    return css`
        .button-bg {
            fill: #ff9900 !important;  /* ← Remove this */
        }
    `;
}

// ✅ CORRECT: No !important, inline styles can override
static get styles() {
    return css`
        .button-bg {
            fill: #ff9900;  /* Default, overridable */
        }
    `;
}

// ✅ EVEN BETTER: Remove static styling entirely if dynamic
static get styles() {
    return css`
        /* No fill styling - use inline styles exclusively */
    `;
}
```

### Prevention
- Avoid `!important` in component CSS
- Use inline styles for dynamic properties
- Check Chrome DevTools "Computed" tab for override sources

---

## Issue 4: Rules Don't Evaluate on Page Load

### Symptoms
- Page loads with entity already in target state (e.g., light already ON)
- Button shows default style (orange) instead of rule style (green)
- Toggling entity triggers correct style change
- Rules work after first state change

### Root Cause
**Prior to v1.9.30:** Rules weren't evaluated when overlay registered if HASS was already available.

**As of v1.9.30:** Base class automatically triggers initial evaluation.

### Solution
**If on v1.9.30+:** Ensure you're calling `_registerOverlayForRules()` in `_handleFirstUpdate()`:

```javascript
_handleFirstUpdate() {
    super._handleFirstUpdate();

    // ✅ This automatically triggers initial evaluation
    this._registerOverlayForRules({
        id: `button-${this._cardGuid}`,
        type: 'button'
    });

    this._resolveButtonStyle();
}
```

**If on older version:** Manually trigger initial evaluation:

```javascript
_handleFirstUpdate() {
    super._handleFirstUpdate();

    this._registerOverlayForRules({
        id: `button-${this._cardGuid}`,
        type: 'button'
    });

    // Manually trigger initial evaluation
    if (this.hass && this._singletons?.rulesEngine) {
        this._singletons.rulesEngine.ingestHass(this.hass);
    }

    this._resolveButtonStyle();
}
```

### Prevention
- Always use v1.9.30+ for automatic initial evaluation
- Test by refreshing page with entity already in trigger state
- Check console for "initial rule evaluation" debug message

---

## Issue 5: Excessive Re-renders / Performance Issues

### Symptoms
- Console flooded with "style resolved" messages
- Laggy UI interactions
- High CPU usage
- Same style recomputed repeatedly

### Root Cause
Missing style comparison before triggering `requestUpdate()`, causing re-render on every HASS update even when style unchanged.

### Solution
Compare styles before triggering update:

```javascript
// ❌ WRONG: Always triggers update
_resolveButtonStyle() {
    let style = this._getMergedStyleWithRules(this.config.style);
    this._buttonStyle = style;
    this.requestUpdate(); // Called every time!
}

// ✅ CORRECT: Only update if changed
_resolveButtonStyle() {
    let style = this._getMergedStyleWithRules(this.config.style);

    // Compare with JSON.stringify
    if (JSON.stringify(this._buttonStyle) !== JSON.stringify(style)) {
        this._buttonStyle = style;
        this.requestUpdate(); // Only when actually changed
    }
}
```

### Prevention
- Always use JSON.stringify comparison for object comparisons
- Monitor console log frequency
- Use Chrome Performance profiler to detect excessive re-renders

---

## Issue 6: Multiple Overlays Conflicting

### Symptoms
- Card with multiple sub-components (button + icon)
- Rules applying to wrong component
- Styles bleeding between components

### Root Cause
Overlay IDs not unique or not properly filtered in patch application.

### Solution
Use unique IDs and filter patches correctly:

```javascript
_handleFirstUpdate() {
    super._handleFirstUpdate();

    // ✅ Register each component with unique ID
    this._registerOverlayForRules({
        id: `button-${this._cardGuid}`,
        type: 'button'
    });

    this._registerOverlayForRules({
        id: `icon-${this._cardGuid}`,
        type: 'icon'
    });
}

_onRulePatchesChanged(patches) {
    // ✅ Check which component the patches are for
    if (patches.overlayId?.startsWith('button-')) {
        this._resolveButtonStyle();
    } else if (patches.overlayId?.startsWith('icon-')) {
        this._resolveIconStyle();
    }
    this.requestUpdate();
}
```

### Prevention
- Use descriptive, unique overlay IDs
- Include card GUID in overlay ID
- Log overlay IDs in patch application for debugging

---

## Issue 7: Rules Config Not Loading

### Symptoms
- `config.rules` defined in YAML
- No rules registered in RulesEngine
- No "Rule loaded" debug messages
- Rules have no effect

### Root Cause
Rules loaded before singletons available, or rules not properly formatted.

### Solution
Verify singleton availability and config format:

```javascript
_processValidatedConfig(result) {
    this.config = result.config;

    // ✅ Check if singletons available before loading rules
    if (this._singletons?.rulesEngine) {
        this._loadRulesFromConfig();
    } else {
        // Defer until singletons ready
        this._hasRulesToLoad = true;
    }
}

async _initializeSingletons() {
    this._singletons = { /* ... */ };

    // ✅ Load deferred rules
    if (this._hasRulesToLoad) {
        this._loadRulesFromConfig();
        this._hasRulesToLoad = false;
    }
}
```

**Verify YAML format:**

```yaml
# ✅ CORRECT
rules:
  - id: light_on
    when:
      entity: light.bedroom
      conditions:
        - attribute: state
          operator: '=='
          value: 'on'
    apply:
      style:
        primary: '#00ff00'

# ❌ WRONG: Missing 'id'
rules:
  - when:
      entity: light.bedroom
```

### Prevention
- Always include `id` in rule definitions
- Check console for "Rule loaded" messages
- Verify singleton availability before loading rules

---

## Debugging Checklist

When implementing RulesEngine integration, verify:

- [ ] ✅ `_registerOverlayForRules()` called in `_handleFirstUpdate()`
- [ ] ✅ Unique overlay ID used (include card GUID)
- [ ] ✅ `_onRulePatchesChanged()` hook implemented
- [ ] ✅ `_getMergedStyleWithRules()` called in style resolution
- [ ] ✅ `requestUpdate()` called after style changes
- [ ] ✅ Inline styles used in rendering (no `<style>` blocks)
- [ ] ✅ No `!important` rules in static CSS
- [ ] ✅ Style comparison uses `JSON.stringify()`
- [ ] ✅ Initial evaluation works (test with entity already in state)
- [ ] ✅ Rules loaded from config (check console logs)

---

## Debug Logging

Enable trace-level logging for detailed flow:

```javascript
// In browser console:
localStorage.setItem('lcards-log-level', 'trace');
location.reload();

// Watch for these key messages:
// ✅ "Overlay registered with RulesEngine"
// ✅ "Rule evaluation callback triggered"
// ✅ "Applied rule patches"
// ✅ "Button style resolved, triggering re-render"
```

---

## Performance Best Practices

1. **Style Comparison:** Always use JSON.stringify to compare objects
2. **Patch Caching:** Let base class handle patch caching
3. **Selective Updates:** Only call `requestUpdate()` when style actually changed
4. **Inline Styles:** Faster than class-based styling for dynamic updates
5. **Single Registration:** Register overlay once in `_handleFirstUpdate()`

---

## Testing Strategy

### Test Scenarios

1. **Initial State:** Load page with entity in default state
2. **Rule Trigger:** Change entity to trigger rule
3. **Rule Clear:** Change entity to clear rule
4. **Page Refresh:** Reload with entity in trigger state
5. **Multiple Cards:** Test with 5+ cards for same entity
6. **Rapid Changes:** Toggle entity quickly (test debouncing)

### Expected Results

- ✅ Visual updates within 100ms of state change
- ✅ No console errors or warnings
- ✅ Correct colors at all times
- ✅ Performance <16ms per update (60fps)
- ✅ Memory stable over time

---

## Related Documentation

- [Simple Card Foundation](../simple-card-foundation.md) - Architecture overview
- [SimpleButton Implementation](./simple-button-implementation.md) - Reference implementation
- [RulesEngine](../subsystems/rules-engine.md) - Rule syntax and evaluation
- [Action System](../UNIFIED_ACTION_SYSTEM.md) - Action handlers

---

**Last Updated:** November 14, 2025
**Maintainer:** LCARdS Development Team
**Status:** Active - Based on real debugging sessions
