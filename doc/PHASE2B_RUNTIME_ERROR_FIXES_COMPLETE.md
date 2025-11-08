# Phase 2b Runtime Error Fixes (UPDATED)
*Method Name & Registry Resolution*

## Issue #1: Method Name Error
Runtime error during card loading:
```
[LCARdSOverlayCard] Failed to create overlay: TypeError: this._getOverlayType is not a function
    at Dh._createOverlayInstance (LCARdSOverlayCard.js:266:38)
```

### Root Cause
The base class `LCARdSOverlayCard` was calling `this._getOverlayType()` (private method) but the child classes (`LCARdSTextCard` and `LCARdSButtonCard`) actually define `getOverlayType()` (public method).

### Solution
Changed the base class to call the correct public method:

**File**: `/src/cards/overlays/LCARdSOverlayCard.js`
```javascript
// BEFORE (Line 266)
const overlayType = this._getOverlayType();

// AFTER
const overlayType = this.getOverlayType();
```

## Issue #2: Empty Registry Error
Second runtime error after method fix:
```
[LCARdSOverlayCard] Failed to create overlay: TypeError: t is not a constructor
    at Dh._createOverlayInstance (LCARdSOverlayCard.js:279:37)
```

### Root Cause
The `OVERLAY_REGISTRY` was initialized as an empty object `{}` but never populated with the actual overlay classes. When trying to instantiate `new OverlayClass()`, it was trying to construct `undefined`.

### Solution
Import and register the overlay classes:

**File**: `/src/cards/overlays/LCARdSOverlayCard.js`
```javascript
// Import overlay classes
import { TextOverlay } from '../../msd/overlays/TextOverlay.js';
import { ButtonOverlay } from '../../msd/overlays/ButtonOverlay.js';

// BEFORE
export const OVERLAY_REGISTRY = {};

// AFTER
export const OVERLAY_REGISTRY = {
    text: TextOverlay,
    button: ButtonOverlay
};
```

## Child Class Implementations

### LCARdSTextCard.js
```javascript
getOverlayType() {
    return 'text';  // Maps to OVERLAY_REGISTRY['text'] = TextOverlay
}
```

### LCARdSButtonCard.js
```javascript
getOverlayType() {
    return 'button';  // Maps to OVERLAY_REGISTRY['button'] = ButtonOverlay
}
```

## Registry Flow
1. Card calls `this.getOverlayType()` → returns `'text'` or `'button'`
2. Base class looks up `OVERLAY_REGISTRY[overlayType]` → finds `TextOverlay` or `ButtonOverlay` class
3. Base class instantiates `new OverlayClass(config)` → creates working overlay instance

## Status
✅ **Fixed**: Both runtime errors resolved
✅ **Build**: Clean webpack compilation
✅ **Registry**: Overlay classes properly imported and registered
✅ **Ready**: Cards can now instantiate overlay classes correctly

The overlay cards should now initialize properly in Home Assistant without any constructor or method errors.