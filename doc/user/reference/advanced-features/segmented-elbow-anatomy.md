# Segmented Elbow - Visual Anatomy Guide

## The Four Radii Explained

Each segmented elbow has **FOUR different radii**:

```
                    ← border.horizontal (200px) →
                ┌─────────────────────────────────┐
                │                                 │
     radius     │  ╭─────────────────────────────┤  ← Outer segment
     .outer     │  │                             │     (thin frame)
     = 85px →   │  │ ← 30px thick bars           │
                │  │                             │
                │  │  outerSegmentOuterRadius    │
                │  │  = 85px (outer curve)       │
                │  │                             │
                │  │    ┌─ gap: 4px              │
                │  │    │                        │
                │  ├────┼───────────────────────►│
                │  │    │  outerSegmentInnerRadius
                │  │    │  = 42.5px (inner curve, auto-calc)
                │  │    │                        │
                │  │    │   ╭────────────────────┤  ← Inner segment
                │  │    │   │                    │     (thick content)
                │  │    │   │ ← 60px thick bars  │
                │  │    │   │                    │
                │  │    │   │  innerSegmentOuterRadius
                │  │    │   │  = 55px (your setting!)
                │  │    │   │                    │
                │  │    │   ├───────────────────►│
                │  │    │   │  innerSegmentInnerRadius
                │  │    │   │  = 27.5px (auto-calc)
                │  │    │   │                    │
                │  │    │   │                    │
                └──┴────┴───┴────────────────────┘
```

---

## What Each Radius Controls

### 1. Outer Segment Outer Radius (85px)
**What it is:** The outside corner curve of the outer frame
**Controlled by:** `radius.outer: 85` OR `segments.outer.radius: 85`
**SVG:** `<path d="... A 85 85 0 0 1 ..." />`
**Visual:** The big sweeping curve on the outside edge

```
     ╭─────  ← This curve (85px radius)
     │
     │
```

---

### 2. Outer Segment Inner Radius (42.5px - AUTO)
**What it is:** The inside corner curve of the outer frame
**Controlled by:** AUTO-CALCULATED (outer / 2, LCARS formula)
**Cannot override:** This is always calculated
**SVG:** `<path d="... A 42.5 42.5 0 0 0 ..." />`
**Visual:** The inner edge curve of the frame

```
       ╭───  ← Outer curve (85px)
       │╭──  ← This inner curve (42.5px, auto)
       ││
```

---

### 3. Inner Segment Outer Radius (55px)
**What it is:** The outside corner curve of the inner content area
**Controlled by:** `segments.inner.radius: 55` OR auto-concentric
**Default (auto):** `(outerSegmentInnerRadius) - gap` = `42.5 - 4` = `38.5px`
**Your override:** `55px`
**SVG:** `<path d="... A 55 55 0 0 1 ..." />`
**Visual:** The content area's outer corner

```
       ╭───   ← Outer frame inner (42.5px)
   gap │ 4px
       │ ╭─   ← This curve (55px, your setting)
       │ │
```

---

### 4. Inner Segment Inner Radius (27.5px - AUTO)
**What it is:** The inside corner curve of the inner content area
**Controlled by:** AUTO-CALCULATED (innerOuter / 2, LCARS formula)
**Cannot override:** This is always calculated
**SVG:** `<path d="... A 27.5 27.5 0 0 0 ..." />`
**Visual:** The innermost concave curve

```
       │ ╭─   ← Inner segment outer (55px)
       │ │╭   ← This innermost curve (27.5px, auto)
       │ ││
```

---

## Your Configuration Decoded

```yaml
elbow:
  radius:
    outer: 85                    # Sets #1: outerSegmentOuterRadius
  segments:
    gap: 4
    outer:
      horizontal: 30             # Bar thickness (not a radius!)
    inner:
      horizontal: 60             # Bar thickness (not a radius!)
      radius: 55                 # Sets #3: innerSegmentOuterRadius
```

**The four radii that result:**

| # | Name | Value | Source |
|---|------|-------|--------|
| 1 | Outer segment outer | 85px | `radius.outer` |
| 2 | Outer segment inner | 42.5px | AUTO (85/2) |
| 3 | Inner segment outer | 55px | `segments.inner.radius` |
| 4 | Inner segment inner | 27.5px | AUTO (55/2) |

---

## What You CAN Control

✅ **Radius #1:** Outer segment's outer curve
   - `radius.outer: 85`
   - OR `segments.outer.radius: 85`

✅ **Radius #3:** Inner segment's outer curve
   - `segments.inner.radius: 55`
   - OR omit for auto-concentric (38.5px in your case)

---

## What You CANNOT Control (Auto-Calculated)

❌ **Radius #2:** Outer segment's inner curve
   - Always = Radius #1 / 2 (LCARS formula)
   - In your case: 85 / 2 = 42.5px

❌ **Radius #4:** Inner segment's inner curve
   - Always = Radius #3 / 2 (LCARS formula)
   - In your case: 55 / 2 = 27.5px

**Why?** LCARS aesthetic requires the inner curve to be exactly half the outer curve for authentic proportions.

---

## Terminology Cheat Sheet

### Current (Confusing)
- `segments.inner.radius` = "Inner segment's outer radius" 😵

### Better (Proposed)
- `segments.inner.corner_radius` = "Inner segment's corner curve" ✅
- `segments.inner.curve` = "Inner segment curve" ✅

### Technical (Internal)
- `innerSegmentOuterRadius` = Radius #3 above

---

## Common Questions

### Q: "Can I set the inner segment's inner radius?"
**A:** No, it's auto-calculated (outer / 2). This maintains LCARS proportions.

### Q: "What does segments.inner.radius actually control?"
**A:** The inner segment's outer corner curve (Radius #3). The curve on the outside edge of the thick inner bars.

### Q: "Why is there a gap between 42.5px and 55px?"
**A:** Because you overrode concentricity! Auto would give 38.5px (42.5 - 4). You set 55px, so the gap is larger.

### Q: "How do I get perfect concentricity?"
**A:** Omit `segments.inner.radius`. System calculates: `innerOuter = outerInner - gap`.

---

## Visual Comparison

### Auto-Concentric (radius.inner omitted)
```
       ╭─────  85px outer curve
       │╭────  42.5px (auto)
  4px →││
       ││╭───  38.5px (auto: 42.5 - 4)
       │││╭──  19.25px (auto)
       ││││

Parallel curves, constant gap
```

### Your Config (radius.inner: 55)
```
       ╭─────  85px outer curve
       │╭────  42.5px (auto)
  Gap varies!
       │   ╭──  55px (YOUR SETTING)
       │   │╭─  27.5px (auto)
       │   ││

Non-parallel curves, variable gap
```

---

## Recommendation

**For clarity, think in terms of:**

1. **Segment 1 (outer frame):**
   - Bar thickness: `outer.horizontal` (30px)
   - Corner curve: `radius.outer` (85px)

2. **Segment 2 (inner content):**
   - Bar thickness: `inner.horizontal` (60px)
   - Corner curve: `inner.radius` (55px, or auto)

3. **Gap between segments:** `segments.gap` (4px)

**Ignore the "inner radius of outer segment" stuff** - that's auto-calculated for LCARS aesthetics.

---

## Summary

🎯 **You control 2 of 4 radii:**
- Outer segment's corner: `radius.outer`
- Inner segment's corner: `segments.inner.radius` (optional)

🤖 **System calculates 2 of 4 radii:**
- Each segment's inner edge curve (LCARS formula: outer/2)

📐 **LCARS Formula:**
```
For each segment:
  innerCurve = outerCurve / 2
```

💡 **Concentricity:**
```
If segments.inner.radius omitted:
  innerSegmentCurve = (outerSegmentInnerCurve) - gap

If segments.inner.radius specified:
  innerSegmentCurve = your value (may break concentricity)
```
