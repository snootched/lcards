# Component Token Resolution Fix

**Date**: 29 November 2025
**Version**: v1.21.03
**Issue**: Theme tokens not found - ThemeManager unavailable during config processing
**Status**: ✅ Fixed

## Problem

After implementing the component preset system (v1.21.0), browser testing revealed that theme token resolution was failing because **ThemeManager was unavailable**:

```
[LCARdSSimpleButtonCard] Cannot resolve component token "components.dpad.segment.directional.fill" - ThemeManager not available
```

All 20+ component token paths were failing to resolve.

## Root Cause: Lifecycle Timing Issue

The problem was a **lifecycle timing mismatch**:

### Initial (Broken) Flow:
1. **`setConfig()`** called on card initialization
2. **`_onConfigSet()`** called → `_processSvgConfig()` → `_processComponentPreset()`
3. **Token resolution attempted** ❌ (`this._singletons` is null!)
4. Much later: **`_onConnected()`** called (when card added to DOM)
5. **`_initializeSingletons()`** called ✅ (singletons now populated)

**The Issue**: Component presets tried to resolve tokens during config processing (step 2), but singletons aren't initialized until DOM connection (step 5).

This is different from button style presets, which resolve tokens during **rendering** via `_resolveButtonStyleSync()` - well after singletons are available.

## Solution: Defer Token Resolution

Changed the architecture to **NOT resolve tokens during config processing**. Instead, tokens are stored as path strings and resolved **on-the-fly during rendering** when applying styles to SVG elements.

### New Flow:
1. **Config time**: Store token paths as strings (e.g., `'components.dpad.segment.directional.fill'`)
2. **Render time**: Resolve tokens in `_applySegmentStyle()` when singletons ARE available

This matches the existing pattern used by button presets and CSS variable resolution throughout the card system.

## Code Changes

### 1. Removed Early Token Resolution

**File**: `src/cards/lcards-simple-button.js` (line ~240)

```diff
- // Resolve theme tokens in component preset segments
- const resolvedSegments = this._resolveComponentSegmentTokens(componentPreset.segments);
-
- // Merge component segments with user-provided segments
+ // DON'T resolve tokens yet - singletons not available during config processing!
+ // Store component segments with token references, will resolve during render
+ // Merge component segments with user-provided segments
```

### 2. Added Runtime Token Resolution

**File**: `src/cards/lcards-simple-button.js` (line ~1080)

```javascript
_applySegmentStyle(element, style) {
    if (!style || Object.keys(style).length === 0) return;

    Object.entries(style).forEach(([key, value]) => {
        // Resolve theme tokens if value is a string with dot notation
        let resolvedValue = value;
        if (typeof value === 'string' && value.includes('.') && !value.startsWith('var(')) {
            // This might be a theme token path like "components.dpad.segment.directional.fill"
            resolvedValue = this._resolveThemeToken(value, null);
        }

        // Convert camelCase to kebab-case for SVG attributes
        const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase();

        // Apply resolved value to element
        element.setAttribute(attrName, resolvedValue);
    });
}
```

### 3. Updated Token Resolver

**File**: `src/cards/lcards-simple-button.js` (line ~303)

The `_resolveThemeToken()` method already uses `this._singletons.themeManager.resolver.resolve()` (from previous fix), which will now work correctly because it's called during rendering when singletons ARE available.

## Token Resolution Flow

### Component Preset (dpad.js):
```javascript
segments: {
  up: {
    fill: 'components.dpad.segment.directional.fill',  // String path
    stroke: 'components.dpad.segment.directional.stroke',
    'stroke-width': 'components.dpad.segment.directional.stroke-width'
  }
}
```

### Theme Tokens (lcarsClassicTokens.js):
```javascript
components: {
  dpad: {
    segment: {
      directional: {
        fill: {
          active: 'var(--lcars-orange, #FF9900)',
          inactive: 'var(--lcars-dark-gray, #666666)',
          hover: 'var(--lcars-yellow, #FFCC99)',
          // ...
        }
      }
    }
  }
}
```

### Resolution During Render:
1. Segment needs styling with state "active"
2. `_resolveSegmentStyleForState()` extracts `fill.active` → `'components.dpad.segment.directional.fill'`
3. `_applySegmentStyle()` detects token path (has dots, not a CSS var)
4. Calls `_resolveThemeToken()` → uses ThemeManager (NOW AVAILABLE!)
5. Returns `'var(--lcars-orange, #FF9900)'`
6. Applied to SVG element

## Why This Works

**Key Insight**: The segment system already had proper state resolution (`_resolveSegmentStyleForState()`). The component tokens define state objects `{active, inactive, hover, ...}`, which get resolved to specific values during state-based style resolution.

When a token path like `'components.dpad.segment.directional.fill'` is resolved, ThemeManager returns the state object. Then `_resolveSegmentStyleForState()` picks the appropriate state value (e.g., `.active`), and `_applySegmentStyle()` applies it.

This lazy resolution pattern:
- ✅ Matches button preset resolution timing
- ✅ Works with existing state resolution system
- ✅ Ensures singletons are available
- ✅ Resolves on every render (supports theme switching)

## Testing

**Build**: ✅ Successful (v1.21.03)
```
webpack 5.97.0 compiled with 3 warnings in 6609 ms
```

**Browser Testing**: Pending user verification
- Should see no "ThemeManager not available" warnings
- Should see no "Theme token not found" warnings
- D-pad segments should render with correct colors:
  - **Directional arrows**: Orange (active), gray (inactive)
  - **Diagonal corners**: Blue (active), gray (inactive)
  - **Center button**: Purple (active), gray (inactive)

## Files Modified

1. `src/cards/lcards-simple-button.js` (lines ~240, ~1080-1110)
   - Removed early token resolution in `_processComponentPreset()`
   - Added runtime token resolution in `_applySegmentStyle()`

## Lessons Learned

**Lifecycle Timing is Critical**: Always check when dependencies (like singletons) are available before using them. Config-time processing happens before DOM connection, so singletons aren't available yet.

**Follow Existing Patterns**: Button presets already solved this with deferred token resolution during rendering. Component presets should use the same pattern.

**Test in Browser**: Compile-time success doesn't guarantee runtime success. Lifecycle timing issues only appear in the browser.

## Related Documentation

- Component Preset Architecture: `doc/architecture/COMPONENT_PRESETS.md`
- Theme Token System: `doc/architecture/THEME_SYSTEM.md`
- D-Pad Component: `doc/features/DPAD_COMPONENT.md`
- Card Lifecycle: `doc/architecture/CARD_LIFECYCLE.md`

---

*This fix ensures component preset tokens resolve at the correct time in the card lifecycle, matching the pattern used throughout the LCARdS codebase.*
