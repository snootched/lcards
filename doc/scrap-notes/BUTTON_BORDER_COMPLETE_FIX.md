# Button Border Radius Complete Fix - v1.15.06

## Date: November 18, 2025

## Summary
Fixed three critical issues with button border rendering that were causing visual artifacts, gaps, and overlapping corners on lozenge and bullet buttons.

---

## Problems Identified

### Problem 1: Curve Type Mismatch
**Background** used quadratic bezier curves (`Q` command)
**Borders** used circular arcs (`A` command)
→ Different mathematical curves = visual misalignment

### Problem 2: Radius Adjustment Error
Border arcs were incorrectly adjusted: `radius = 34 - (strokeWidth/2) = 33`
Background used: `radius = 34`
→ 1px gap between background and border outer edge

### Problem 3: Overlapping Corners
Theme specified: `radius = 34px`
Button height: `60px`
Top radius + Bottom radius: `34px + 34px = 68px > 60px`
→ Corners overlapped, creating artifacts

---

## Solutions Implemented

### Fix 1: Use Circular Arcs Everywhere ✅
**File:** `src/cards/lcards-simple-button.js` (lines ~1990-2030)
**Change:** Convert background path from quadratic bezier to circular arcs

```javascript
// BEFORE (Quadratic Bezier):
if (topRight > 0) {
    path += ` Q ${x1} ${y0} ${x1} ${y0 + topRight}`;
}

// AFTER (Circular Arc):
if (topRight > 0) {
    path += ` A ${topRight} ${topRight} 0 0 1 ${x1} ${y0 + topRight}`;
}
```

**Result:** Background and borders now use identical curve mathematics

### Fix 2: Remove Incorrect Radius Adjustment ✅
**File:** `src/cards/lcards-simple-button.js` (lines ~2320-2375)
**Change:** Use same radius for arcs as background (no adjustment)

```javascript
// BEFORE (Incorrect adjustment):
const adjustedRadius = topLeft - (cornerWidth / 2);  // 34 - 1 = 33
const arcStart = topLeft - (cornerWidth / 2);
arcMarkup += `<path d="M 0 ${arcStart} A ${adjustedRadius} ${adjustedRadius}..."/>`;

// AFTER (Correct - same radius):
const arcRadius = topLeft;  // Use full radius: 34
arcMarkup += `<path d="M 0 ${arcRadius} A ${arcRadius} ${arcRadius}..."/>`;
```

**Reasoning:** ViewBox is already expanded by `strokeOverhang = borderWidth/2`, so stroke naturally extends outward. No radius adjustment needed!

### Fix 3: Clamp Radius to Height/2 ✅
**File:** `src/cards/lcards-simple-button.js` (lines ~1193-1202)
**Change:** Limit corner radii to prevent overlapping

```javascript
// After resolving border configuration:
const border = this._resolveBorderConfiguration();

// NEW: Clamp corner radii to half the button height
const maxRadius = height / 2;  // 60px / 2 = 30px
border.topLeft = Math.min(border.topLeft, maxRadius);
border.topRight = Math.min(border.topRight, maxRadius);
border.bottomRight = Math.min(border.bottomRight, maxRadius);
border.bottomLeft = Math.min(border.bottomLeft, maxRadius);
border.radius = Math.min(border.radius, maxRadius);
```

**Result:** For 60px tall buttons, radius clamped from 34px → 30px, creating perfect half-circles

---

## Technical Details

### SVG Stroke Behavior
- SVG strokes are **centered** on the path
- For 2px stroke: 1px extends inward, 1px extends outward
- ViewBox expansion: `viewBox="-1 -1 247.984375 62"` provides space for outward stroke
- No coordinate adjustment needed

### Circular Arc vs Quadratic Bezier
| Curve Type | Command | Visual |
|------------|---------|--------|
| Quadratic Bezier | `Q cx cy x y` | Approximates circle, but not exact |
| Circular Arc | `A rx ry rotation large-arc sweep x y` | True circular curve |

**Why it matters:** Even small differences become visible at button scale, especially with borders

### Radius Clamping Logic
For a button with height `H`:
- Maximum safe radius: `H / 2`
- If `topRadius + bottomRadius > H` → corners overlap
- Solution: `actualRadius = Math.min(themeRadius, H/2)`

**Example:**
- Button height: 60px
- Theme radius: 34px (from HA card borders)
- Clamped radius: `Math.min(34, 30)` = **30px** ✅
- Result: 30px + 30px = 60px (perfect!)

---

## Before & After

### Before (v1.15.03):
```svg
<svg width="245.984375" height="60">
    <!-- Background: Quadratic bezier, radius 34 -->
    <path d="M 34 0 L ... Q 0 60 0 26 Q 0 0 34 0 Z" />

    <!-- Border: Circular arc, radius 33 (adjusted) -->
    <path d="M 0 33 A 33 33 0 0 1 33 0" stroke-width="2" />
</svg>
```
**Problems:**
- ❌ Different curve types (Q vs A)
- ❌ Different radii (34 vs 33)
- ❌ Overlapping corners (34 + 34 > 60)
- ❌ Visual artifacts and gaps

### After (v1.15.06):
```svg
<svg width="245.984375" height="60">
    <!-- Background: Circular arc, radius 30 (clamped) -->
    <path d="M 30 0 L ... A 30 30 0 0 1 0 30 L 0 30 A 30 30 0 0 1 30 0 Z" />

    <!-- Border: Circular arc, radius 30 (matching) -->
    <path d="M 0 30 A 30 30 0 0 1 30 0" stroke-width="2" />
    <path d="M 30 60 A 30 30 0 0 1 0 30" stroke-width="2" />
</svg>
```
**Results:**
- ✅ Same curve type (A in both)
- ✅ Same radius (30 in both)
- ✅ Perfect fit (30 + 30 = 60)
- ✅ Clean, smooth edges

---

## Files Modified
1. **src/cards/lcards-simple-button.js**
   - Lines 1193-1202: Added radius clamping logic
   - Lines 1990-2030: Changed background to use circular arcs
   - Lines 2320-2375: Removed incorrect radius adjustment from border arcs

---

## Impact
- ✅ Fixes visual artifacts in **all rounded button styles**
- ✅ Affects: `lozenge`, `lozenge-right`, `bullet`, `bullet-right`, `capped`, `picard-icon`
- ✅ Perfect half-circles on pill-shaped buttons
- ✅ Clean border alignment at all button heights
- ✅ No more overlapping corners

---

## Testing Verification

### Test Case: Bullet Button (60px height)
**Expected SVG:**
- Background radius: 30px (clamped from 34px)
- Border radius: 30px (matching)
- Arc coordinates:
  - Top-left: `M 0 30 A 30 30 0 0 1 30 0`
  - Bottom-left: `M 30 60 A 30 30 0 0 1 0 30`
- Visual: Perfect half-circles, no gaps, no artifacts

### Test Case: Lozenge Button (60px height)
**Expected SVG:**
- All four corners with 30px radius
- Perfect pill shape
- Smooth, continuous border around entire button

---

## Build Status
✅ **Success** - Version 1.15.06
```
webpack 5.97.0 compiled with 3 warnings in 9063 ms
```

---

## Commit Message
```
fix: Complete button border radius alignment

- Use circular arcs (A) in both background and borders
- Remove incorrect radius adjustment (was causing 1px gap)
- Clamp radius to height/2 to prevent overlapping corners
- Ensures perfect half-circles for lozenge/bullet buttons
- Fixes visual artifacts and border misalignment

Fixes #[issue-number]
```

---

## Related Documentation
- See `BUTTON_PRESET_FIXES.md` for button preset structure fixes
- See `MASTER_IMPLEMENTATION_PLAN.md` for Phase 1 progress
