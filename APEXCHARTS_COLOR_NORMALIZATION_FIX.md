# ApexCharts Color Normalization Fix

## Problem Statement

The ApexChartsAdapter modernization (merged PR) introduced a regression where single color string values were passed directly to ApexCharts instead of being normalized to arrays. ApexCharts expects color properties to be arrays and throws `e.push is not a function` when it receives a string.

## Root Cause

The modernization removed the old `resolveColorArray()` helper function that included type normalization. The new simplified code extracted color values directly without type normalization, which caused issues when users provided single color strings instead of arrays.

**Example of broken config:**
```yaml
style:
  colors:
    series: '#FF9900'  # ❌ String causes error
```

**What ApexCharts expects:**
```yaml
style:
  colors:
    series: ['#FF9900']  # ✅ Array format required
```

## Solution Implemented

Added a `normalizeColorArray()` helper function that safely converts single color strings to arrays while preserving existing array values and null/undefined values.

### Changes Made

**File: `src/charts/ApexChartsAdapter.js`**

1. **Added `normalizeColorArray()` helper** (lines 301-336)
   - Converts single color strings → single-element arrays
   - Returns arrays as-is (no modification)
   - Returns null for null/undefined inputs
   - Logs warning for invalid types

2. **Updated color array extractions** (lines 346-390)
   - ✅ `colors` (series colors)
   - ✅ `strokeColors`
   - ✅ `fillColors`
   - ✅ `gridRowColors` / `gridColumnColors`
   - ✅ `legendColors`
   - ✅ `markerColors` / `markerStrokeColors`
   - ✅ `dataLabelColors`

3. **Kept single-value colors unchanged**
   - ❌ `backgroundColor`, `foregroundColor`, `gridColor` (these are individual values, not arrays)
   - ❌ Axis colors (`xaxisColor`, `yaxisColor`, etc.)

### Code Example

```javascript
/**
 * Normalize color value to array format for ApexCharts
 */
const normalizeColorArray = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Single string color → convert to array
  if (typeof value === 'string') {
    return [value];
  }
  
  // Already an array → return as-is
  if (Array.isArray(value)) {
    return value;
  }
  
  // Invalid type → log warning and return null
  lcardsLog.warn('[ApexChartsAdapter] Invalid color value type:', typeof value, value);
  return null;
};

// Usage example
let colors = normalizeColorArray(style.colors?.series);
// Single string: '#FF9900' → ['#FF9900']
// Array: ['#FF9900', '#99CCFF'] → ['#FF9900', '#99CCFF']
// Null/undefined → null
```

## Testing

Created comprehensive test suite: `test/test-color-normalization.cjs`

**Test Results:**
```
✅ Test 1: normalizeColorArray function exists
✅ Test 2: Function has proper JSDoc documentation
✅ Test 3: Function converts strings to arrays
✅ Test 4: Function handles null/undefined
✅ Test 5: Function handles arrays
✅ Test 6: All color arrays are normalized
✅ Test 7: Single-value colors remain unchanged
✅ Test 8: Documentation explains ApexCharts array requirement
```

## Why This Is Needed

The modernization correctly removed **redundant theme token resolution** (which is now handled by the chart card), but accidentally also removed **legitimate type normalization** that is an adapter responsibility. 

This is similar to CSS variable resolution that we kept - it's **adapter-specific logic for compatibility with the underlying library** (ApexCharts), not theme resolution logic.

ApexCharts is strict about expecting arrays for color properties, so we need to normalize user input regardless of how theme tokens are resolved.

## Non-Breaking Change

This fix is **completely backward compatible**:
- ✅ Single color strings now work (fixes regression)
- ✅ Color arrays continue to work as before
- ✅ No user config changes required
- ✅ Restores functionality that existed before modernization

## Success Criteria

All success criteria met:
- [x] `normalizeColorArray()` helper added with full JSDoc
- [x] All color array extractions use normalization helper
- [x] Single-value colors (background, foreground, axis) remain unchanged
- [x] Chart initialization succeeds with both string and array color configs
- [x] No console errors or warnings during chart rendering
- [x] Existing charts continue to work without modification
- [x] Build completes successfully
- [x] Comprehensive test suite passes

## Migration Notes

**For Users:**
- No action required - this fix automatically handles both formats
- Both `colors: { series: '#FF9900' }` and `colors: { series: ['#FF9900'] }` now work

**For Developers:**
- Type normalization is now handled consistently for all color array properties
- Single-value color properties (backgroundColor, foregroundColor, axis colors) are intentionally NOT normalized
- The pattern can be extended to other properties if needed

## Related Files

- **Modified:** `src/charts/ApexChartsAdapter.js`
- **Added:** `test/test-color-normalization.cjs`
- **Built:** `dist/lcards.js` (production bundle updated)
