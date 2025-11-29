# Unnecessary Re-renders Fix - November 28, 2025

## Issue

Cards were re-rendering on **every HASS update**, even when:
- No entity was configured
- No tracked entities changed
- No relevant state changes occurred

From the trace logs, a button card with no entity rendered **6 times** in quick succession after the SVG loaded, all triggered by irrelevant HASS updates.

## Root Cause

In `LCARdSNativeCard.js`, the `hass` setter was calling `requestUpdate()` unconditionally on every HASS change:

```javascript
set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;

    if (hass && oldHass !== hass) {
        this._onHassChanged(hass, oldHass);
        this.requestUpdate();  // ← PROBLEM: Always triggers re-render!
    }
}
```

This caused **every card to re-render on every HASS update**, regardless of whether the update was relevant to that card. With 394 entities in the system, this meant:
- Wasted CPU cycles
- Unnecessary DOM updates
- Poor performance, especially on low-end devices
- Excessive logging

## Solution

Made re-rendering conditional based on relevance checking:

### 1. Added `_shouldUpdateOnHassChange()` Method

```javascript
_shouldUpdateOnHassChange(newHass, oldHass) {
    // First HASS update - always render
    if (!oldHass) {
        return true;
    }

    // Check if card's configured entity changed
    if (this.config?.entity) {
        const oldState = oldHass?.states?.[this.config.entity];
        const newState = newHass?.states?.[this.config.entity];
        if (oldState !== newState) {
            return true;
        }
    }

    // Check if any tracked entities changed (from templates)
    if (this._trackedEntities && this._trackedEntities.length > 0) {
        const hasTrackedChanges = this._trackedEntities.some(entityId => {
            const oldState = oldHass?.states?.[entityId];
            const newState = newHass?.states?.[entityId];
            return oldState !== newState;
        });
        if (hasTrackedChanges) {
            return true;
        }
    }

    // No relevant changes - skip re-render
    return false;
}
```

### 2. Updated `hass` Setter

```javascript
set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;

    if (hass && oldHass !== hass) {
        // Determine if this HASS change is relevant to this card
        const shouldUpdate = this._shouldUpdateOnHassChange(hass, oldHass);

        // Always call _onHassChanged (for monitoring, core updates, etc.)
        this._onHassChanged(hass, oldHass);

        // Only trigger re-render if relevant entities changed
        if (shouldUpdate) {
            lcardsLog.trace(`[LCARdSNativeCard] Requesting re-render due to relevant entity changes`);
            this.requestUpdate();
        } else {
            lcardsLog.trace(`[LCARdSNativeCard] Skipping re-render - no relevant entity changes`);
        }
    }
}
```

## Impact

### Before Fix
- Card with **no entity**: Re-rendered on every HASS update (6+ times after SVG load)
- Card with **entity**: Re-rendered on every HASS update, even when other entities changed
- Card with **templates**: Re-rendered on every HASS update, even when unrelated entities changed

### After Fix
- Card with **no entity**: Renders once during setup, then never again ✅
- Card with **entity**: Only re-renders when that specific entity changes ✅
- Card with **templates**: Only re-renders when tracked template entities change ✅

## Performance Improvements

- **Reduced CPU usage**: Cards only render when needed
- **Reduced DOM manipulation**: Fewer unnecessary SVG regenerations
- **Better battery life**: Especially important on mobile devices
- **Cleaner logs**: No more spam from irrelevant renders

## Testing

To verify the fix:

1. **Refresh your browser** to load the updated code
2. **Open console** and filter for "Skipping re-render"
3. **Watch unrelated entity changes**: You should see:
   ```
   LCARdS|trace [LCARdSNativeCard] Skipping re-render - no relevant entity changes
   ```
4. **No more "Rendering button background" spam** when entities change

## Files Modified

- `src/base/LCARdSNativeCard.js`:
  - Added `_shouldUpdateOnHassChange()` method to check relevance
  - Modified `hass` setter to conditionally call `requestUpdate()`

## Notes

This fix applies to **all cards** that extend `LCARdSNativeCard`, including:
- `lcards-simple-button`
- `lcards-simple-label`
- Any future card implementations

The `_onHassChanged()` callback is **still called on every HASS update** to allow cards to:
- Update internal state references (`this._entity`)
- Set up monitoring
- Forward HASS to core systems

But **re-rendering is now conditional** based on actual relevance to the card.
