# Text Rotation - Technical Details

**Version:** v1.14.18
**Date:** November 16, 2025

---

## ✅ Rotation Anchor Point Confirmation

### **YES - Text rotates around its anchor point (x, y coordinates)**

The SVG transform implementation:

```javascript
// From _generateTextElements() at line ~1920
if (field.rotation && field.rotation !== 0) {
    textAttrs.push(`transform="rotate(${field.rotation} ${field.x} ${field.y})"`);
}
```

**SVG Syntax:** `rotate(angle centerX centerY)`
- `angle`: Rotation in degrees (positive = clockwise)
- `centerX, centerY`: The rotation pivot point = the text's x, y coordinates

---

## How Anchor and Baseline Affect Rotation

The `anchor` and `baseline` properties determine **where on the text** the rotation pivot is:

### **anchor** (horizontal alignment)
- `start`: Text starts at x coordinate → pivot at **left edge**
- `middle`: Text centered at x coordinate → pivot at **horizontal center**
- `end`: Text ends at x coordinate → pivot at **right edge**

### **baseline** (vertical alignment)
- `hanging`: Text hangs from y coordinate → pivot at **top edge**
- `central`: Text centered at y coordinate → pivot at **vertical center**
- `alphabetic`: Text baseline at y coordinate → pivot at **baseline**

---

## Examples

### Example 1: Rotate around center
```yaml
text:
  centered:
    content: "CENTERED ROTATION"
    x: 100
    y: 50
    anchor: middle      # Horizontal center
    baseline: central   # Vertical center
    rotation: 45        # Rotates around (100, 50) - the text center
```

### Example 2: Rotate around left edge
```yaml
text:
  left_pivot:
    content: "LEFT PIVOT"
    x: 100
    y: 50
    anchor: start       # Left edge at x
    baseline: central   # Vertical center
    rotation: 90        # Rotates around left-center point
```

### Example 3: Rotate around top-right corner
```yaml
text:
  corner:
    content: "CORNER"
    x: 100
    y: 50
    anchor: end         # Right edge at x
    baseline: hanging   # Top edge at y
    rotation: -45       # Rotates around top-right corner
```

---

## Named Positions + Rotation

When using named positions, the system automatically sets appropriate anchor/baseline:

```yaml
text:
  top_left_rotated:
    content: "TOP LEFT"
    position: top-left
    rotation: 45
    # Auto sets: anchor=start, baseline=hanging
    # Rotates around top-left corner of button

  center_rotated:
    content: "CENTER"
    position: center
    rotation: 90
    # Auto sets: anchor=middle, baseline=central
    # Rotates around exact center of button
```

---

## Visual Representation

```
anchor: start         anchor: middle        anchor: end
baseline: hanging     baseline: hanging     baseline: hanging
    ↓                     ↓                     ↓
    ●--TEXT--             --TEXT--              --TEXT--●
    (top-left)            (top-center)          (top-right)


anchor: middle
baseline: central
    ↓
    --TEXT--
       ●
   (true center)
```

**The ● symbol = rotation pivot point**

When you apply `rotation: 45`, the text spins around that ● point.

---

## Test Case Reference

See **Test 13** in `test/test-multitext-phase1.yaml` for working examples:
- 0° (horizontal)
- 45° (diagonal)
- 90° (vertical up)
- -90° (vertical down)
- -45° (diagonal back)
- 180° (upside down)

All tests confirmed working in dashboard! ✅

---

## Summary

**Q: Does rotation use the anchor point as the rotation point?**

**A: YES!** The text rotates around its `(x, y)` coordinates, and the `anchor`/`baseline` properties determine which part of the text is positioned at those coordinates, making them the effective rotation pivot.

This gives you full control over rotation behavior by combining:
1. Position (`x, y` or named position)
2. Anchor point (`anchor`, `baseline`)
3. Rotation angle (`rotation`)
