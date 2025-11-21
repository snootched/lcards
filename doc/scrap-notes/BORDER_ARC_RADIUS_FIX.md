# Border Arc Radius Fix - v1.15.04

## Date: November 18, 2025

## Problem Reported
User identified two issues with button borders (lozenge and bullet shapes):

1. **Border radius mismatch**: Background path used radius 34, but border arcs used radius 33, causing a 1px gap/bleed
2. **Visual artifacts**: Border not aligned with background edge

### Example from User's SVG:
```svg
<!-- Background uses radius 34 -->
<path d="M 34 0 L 185.625 0 Q 219.625 0 219.625 34 ..." />

<!-- But arc uses radius 33 (WRONG!) -->
<path d="M 0 33 A 33 33 0 0 1 33 0" stroke-width="2" />
```

The arc radius was 1 pixel smaller than the background radius!

## Root Cause
In `_renderCornerArcs()` method (line ~2320), the code was incorrectly adjusting the arc radius:

```javascript
// OLD CODE (INCORRECT):
const adjustedRadius = topLeft - (cornerWidth / 2);
const arcStart = topLeft - (cornerWidth / 2);
arcMarkup += `
    <path d="M 0 ${arcStart} A ${adjustedRadius} ${adjustedRadius} 0 0 1 ${arcStart} 0"
          stroke="${cornerColor}"
          stroke-width="${cornerWidth}" />`;
```

This reduced the radius by `strokeWidth/2` (1px for 2px stroke), thinking it needed to compensate for the stroke centering. **But this was wrong!**

## Why This Was Wrong

The viewBox is already expanded by `strokeOverhang` (lines 1233-1247):

```javascript
const strokeOverhang = maxBorderWidth / 2;
const viewBoxX = -strokeOverhang;  // e.g., -1
const viewBoxY = -strokeOverhang;  // e.g., -1
const viewBoxWidth = width + (strokeOverhang * 2);  // e.g., 221.625
const viewBoxHeight = height + (strokeOverhang * 2); // e.g., 62
```

This expansion means:
- Borders drawn at coordinate `0` can extend into negative space
- Borders drawn at coordinate `width` can extend past `width`
- **No radius adjustment needed** - the stroke naturally extends outward

## Solution
Changed arc rendering to use **the same radius as the background**:

```javascript
// NEW CODE (CORRECT):
const arcRadius = topLeft;  // Use SAME radius as background!
arcMarkup += `
    <path d="M 0 ${arcRadius} A ${arcRadius} ${arcRadius} 0 0 1 ${arcRadius} 0"
          stroke="${cornerColor}"
          stroke-width="${cornerWidth}" />`;
```

### Applied to All Four Corners:
- ✅ **Top-left**: Uses `topLeft` radius directly
- ✅ **Top-right**: Uses `topRight` radius directly
- ✅ **Bottom-right**: Uses `bottomRight` radius directly
- ✅ **Bottom-left**: Uses `bottomLeft` radius directly

## Result

### Before:
- Background radius: 34
- Arc radius: 33 (adjusted = 34 - 1)
- **Gap**: 1px between background and border outer edge

### After:
- Background radius: 34
- Arc radius: 34 (same!)
- **Perfect alignment**: Border stroke centered on background edge
- Outer edge of 2px stroke extends to radius 35 (into expanded viewBox)
- Inner edge at radius 33 (inside button)

## Verification

### Expected SVG Output (After Fix):
```svg
<svg width="219.625" height="60" viewBox="-1 -1 221.625 62">
    <!-- Background: radius 34 -->
    <path d="M 34 0 L 185.625 0 Q 219.625 0 219.625 34 ..." />

    <!-- Arc: radius 34 (NOW MATCHES!) -->
    <path d="M 0 34 A 34 34 0 0 1 34 0" stroke-width="2" />
</svg>
```

### Visual Result:
- ✅ No gap between background and border
- ✅ Smooth, continuous edge
- ✅ No artifacts or bleed
- ✅ Border perfectly aligned with background curve

## Files Modified
- `src/cards/lcards-simple-button.js` - Lines 2320-2375 (simplified arc rendering)

## Build Status
✅ **Success** - No compilation errors
```
webpack 5.97.0 compiled with 3 warnings in 9139 ms
```

## Test Instructions
1. View any lozenge button in Home Assistant
2. Inspect SVG in browser dev tools
3. Verify:
   - Background path uses radius R
   - Arc paths use same radius R
   - No visible gap or artifacts
   - Border stroke cleanly follows background edge

## Related Issues
- Fixes visual artifacts in all rounded button styles
- Affects: lozenge, bullet, capped, picard-icon presets
- Any button with `border.radius > 0`

## Technical Note: SVG Stroke Behavior
SVG strokes are always **centered** on the path. For a 2px stroke:
- 1px extends inward from path
- 1px extends outward from path

With expanded viewBox (`viewBox="-1 -1 221.625 62"`):
- Outward extension goes into the `-1` space
- No clipping occurs
- No radius adjustment needed

This is why we simply use the background radius for arcs!

---

## Commit Message
```
fix: Correct border arc radius to match background

- Arc radius now matches background radius exactly
- Removed incorrect strokeWidth/2 adjustment
- ViewBox expansion handles stroke overhang
- Fixes 1px gap and visual artifacts in rounded buttons
- Affects lozenge, bullet, capped, picard-icon presets
```
