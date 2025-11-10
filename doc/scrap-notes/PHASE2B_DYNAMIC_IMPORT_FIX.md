# Phase 2b Runtime Error - Dynamic Import Fix
*Resolving Webpack Bundling Issues*

## The Persistent Error
Despite fixing method names, registry population, and constructor parameters, the error persisted:
```
TypeError: t is not a constructor at Dh._createOverlayInstance (LCARdSOverlayCard.js:285:37)
```

## Root Cause: Webpack Bundling Issues
The problem was that webpack was mangling the static imports during bundling, causing the imported overlay classes to not be recognized as constructors. This is a common issue with:
- Circular dependencies
- Complex import chains
- Webpack's code minification and mangling

## Console Evidence
The logs showed:
```
[LCARdSTextCard] Text overlay registered in registry
[LCARdSButtonCard] Button overlay registered in registry
TypeError: t is not a constructor  // <- Still failing despite "registration"
```

This indicated that while the cards were attempting to register, the actual classes weren't properly imported.

## Solution: Dynamic Imports
Switched from static imports to dynamic imports to avoid webpack bundling issues:

### Before (Static Imports)
```javascript
import { TextOverlay } from '../../msd/overlays/TextOverlay.js';
import { ButtonOverlay } from '../../msd/overlays/ButtonOverlay.js';

export const OVERLAY_REGISTRY = {
    text: TextOverlay,
    button: ButtonOverlay
};
```

### After (Dynamic Imports)
```javascript
export const OVERLAY_REGISTRY = {};

async function loadOverlayClasses() {
    try {
        // Dynamic imports to avoid bundling issues
        const { TextOverlay } = await import('../../msd/overlays/TextOverlay.js');
        const { ButtonOverlay } = await import('../../msd/overlays/ButtonOverlay.js');

        // Populate registry
        OVERLAY_REGISTRY.text = TextOverlay;
        OVERLAY_REGISTRY.button = ButtonOverlay;

        return true;
    } catch (error) {
        lcardsLog.error('[LCARdSOverlayCard] Failed to load overlay classes:', error);
        return false;
    }
}
```

## Enhanced Registry Loading
Updated `_waitForRegistry` method to dynamically load classes:

```javascript
async _waitForRegistry(overlayType, maxWait = 5000) {
    // First attempt to load overlay classes if registry is empty
    if (!OVERLAY_REGISTRY || Object.keys(OVERLAY_REGISTRY).length === 0) {
        lcardsLog.debug('[LCARdSOverlayCard] Registry empty, loading overlay classes...');
        await loadOverlayClasses();
    }

    while (Date.now() - startTime < maxWait) {
        if (OVERLAY_REGISTRY && OVERLAY_REGISTRY[overlayType]) {
            return; // Success!
        }

        // Retry loading if still empty after delay
        if (Date.now() - startTime > 1000 && Object.keys(OVERLAY_REGISTRY).length === 0) {
            await loadOverlayClasses();
        }

        await new Promise(resolve => setTimeout(resolve, 50));
    }
}
```

## Key Benefits
1. **Avoids Circular Dependencies**: Dynamic imports prevent webpack from trying to resolve all dependencies at bundle time
2. **Deferred Loading**: Classes are loaded only when needed, reducing initial bundle complexity
3. **Error Resilience**: Multiple retry attempts if initial loading fails
4. **Debug Visibility**: Clear logging of loading status and failures

## Expected Flow Now
1. Card initializes with empty registry
2. `_waitForRegistry()` detects empty registry
3. `loadOverlayClasses()` dynamically imports TextOverlay and ButtonOverlay
4. Registry populated with actual constructor functions
5. `new OverlayClass()` succeeds with proper constructors

## Status
✅ **Build**: Clean webpack compilation
✅ **Dynamic Imports**: Avoiding static import bundling issues
✅ **Registry Loading**: Async loading with retry logic
✅ **Debugging**: Enhanced logging for troubleshooting

This approach should resolve the webpack mangling issues that were preventing the overlay classes from being properly instantiated.
