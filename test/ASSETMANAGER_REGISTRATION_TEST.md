# AssetManager Registration Testing Guide

This guide explains how to verify that button and slider components are properly registered with the AssetManager after the fixes from Issue #156.

## Quick Test (Browser Console)

After loading LCARdS in Home Assistant or the test page, run these commands in the browser console:

### Test 1: Check Button Components
```javascript
// Should return ~23 button components
window.lcards.core.assetManager.listAssets('button').length
// Expected: 23

// View all button components
window.lcards.core.assetManager.listAssets('button')
```

### Test 2: Check Slider Components
```javascript
// Should return 3 slider components
window.lcards.core.assetManager.listAssets('slider').length
// Expected: 3

// View all slider components
window.lcards.core.assetManager.listAssets('slider')
```

### Test 3: Check Button Metadata
```javascript
// Should return metadata for 'base' button component
window.lcards.core.assetManager.getMetadata('button', 'base')
// Expected: { pack: 'lcards_buttons', type: 'svg-function', registeredAt: <timestamp> }
```

### Test 4: Check Slider Metadata
```javascript
// Should return metadata for 'picard' slider component
window.lcards.core.assetManager.getMetadata('slider', 'picard')
// Expected: { pack: 'lcards_sliders', type: 'svg-function', orientation: 'vertical', ... }
```

## Automated Test Page

Open `test/test-assetmanager-registration.html` in your browser:

1. Navigate to the repository directory
2. Open `test/test-assetmanager-registration.html` in a web browser
3. Click "Run All Tests" button
4. Verify all 5 tests pass:
   - ✅ AssetManager exists
   - ✅ Button components registered (23 components)
   - ✅ Slider components registered (3 components)
   - ✅ Button metadata has correct structure
   - ✅ Slider metadata has correct structure

### Expected Output

```
Test Summary
✅ Passed: 5 | ❌ Failed: 0
```

## Button Components Expected

The following 23 button components should be registered:

1. `base` - Foundation button
2. `lozenge` - Fully rounded (left icon)
3. `lozenge-right` - Fully rounded (right icon)
4. `bullet` - Half-rounded right
5. `bullet-right` - Half-rounded left
6. `capped` - Left side rounded
7. `capped-right` - Right side rounded
8. `barrel` - Solid rectangular
9. `barrel-right` - Solid rectangular (right icon)
10. `filled` - Picard style filled
11. `filled-right` - Picard style filled (right icon)
12. `outline` - Border only (Picard style)
13. `outline-right` - Border only (right icon)
14. `icon` - Icon-only compact
15. `text-only` - Text without icon
16. `bar-label-base` - Bar label base
17. `bar-label-left` - Left aligned bar label
18. `bar-label-center` - Center aligned bar label
19. `bar-label-right` - Right aligned bar label
20. `bar-label-square` - Square bar label
21. `bar-label-lozenge` - Rounded bar label
22. `bar-label-bullet-left` - Half-rounded bar label (right)
23. `bar-label-bullet-right` - Half-rounded bar label (left)

## Slider Components Expected

The following 3 slider components should be registered:

1. `basic` - Basic slider (orientation-agnostic)
2. `picard` - Picard vertical slider with decorative elbows
3. `picard-vertical` - Picard vertical with inset ranges

## Troubleshooting

### AssetManager not found
If `window.lcards.core.assetManager` is undefined:
- Check that LCARdS core has initialized
- Verify `dist/lcards.js` is built and loaded
- Check browser console for initialization errors

### Components not registered
If `listAssets()` returns empty array:
- Verify registration functions are being called
- Check console for registration errors
- Ensure build includes the new button components file

### Webpack build fails
If build shows errors about dynamic imports:
- Verify imports are at module top level (not inside functions/conditionals)
- Check that both `registerSliderComponents` and `registerButtonComponents` are imported statically
- Run `npm run build` to see specific webpack errors

## Verification Checklist

- [ ] Webpack build succeeds without errors
- [ ] AssetManager exists at `window.lcards.core.assetManager`
- [ ] Button components list returns 23 items
- [ ] Slider components list returns 3 items
- [ ] Button metadata includes `pack: 'lcards_buttons'`
- [ ] Slider metadata includes `pack: 'lcards_sliders'`
- [ ] Both component types have `type: 'svg-function'`
- [ ] All components have `registeredAt` timestamp

## Implementation Details

### Files Modified
- `src/lcards.js` - Converted dynamic import to static imports (lines 43-44, 144-146)

### Files Created
- `src/core/packs/components/buttons/index.js` - Button component registry with 23 components

### Key Changes
1. **Static Imports**: Moved from conditional dynamic `await import()` to top-level `import` statements
2. **Registration Call**: Now calls both `registerSliderComponents()` and `registerButtonComponents()` 
3. **Metadata Structure**: Both component types register with pack name, type, and timestamp

### Benefits
- ✅ Webpack can statically analyze imports (proper code splitting)
- ✅ Consistent API for all component types
- ✅ Button components discoverable via AssetManager
- ✅ No breaking changes to existing functionality
