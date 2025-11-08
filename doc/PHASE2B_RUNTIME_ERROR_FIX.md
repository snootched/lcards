# Phase 2b Runtime Error Fix
*Method Name Resolution*

## Issue
Runtime error during card loading:
```
[LCARdSOverlayCard] Failed to create overlay: TypeError: this._getOverlayType is not a function
    at Dh._createOverlayInstance (LCARdSOverlayCard.js:266:38)
```

## Root Cause
The base class `LCARdSOverlayCard` was calling `this._getOverlayType()` (private method) but the child classes (`LCARdSTextCard` and `LCARdSButtonCard`) actually define `getOverlayType()` (public method).

## Solution
Changed the base class to call the correct public method:

**File**: `/src/cards/overlays/LCARdSOverlayCard.js`
```javascript
// BEFORE (Line 266)
const overlayType = this._getOverlayType();

// AFTER
const overlayType = this.getOverlayType();
```

## Child Class Implementations

### LCARdSTextCard.js
```javascript
getOverlayType() {
    return 'text';
}
```

### LCARdSButtonCard.js
```javascript
getOverlayType() {
    return 'button';
}
```

## Status
✅ **Fixed**: Runtime error resolved
✅ **Build**: Clean webpack compilation
✅ **Ready**: Cards can now load without method errors

The overlay cards should now initialize properly in Home Assistant without the `_getOverlayType is not a function` error.