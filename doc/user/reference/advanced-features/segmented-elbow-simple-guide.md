# Segmented Elbow Configuration Guide

> **Simple guide to configuring segmented elbows**
> Auto-sizing, custom segments, and configuration modes

## Overview

A **segmented elbow** has two concentric L-shaped segments with a gap between them:

```
Outer segment (thin frame)
  ╭──────────────╮
  │   Gap (4px)  │
  │  ╭───────────┤
  │  │ Inner seg │
  │  │ (thicker) │
```

## Configuration Modes

### Mode 1: Auto Sizing (Simplest) ⭐ Recommended

Just specify the gap and let the system calculate everything:

```yaml
elbow:
  type: header-left
  style: segmented
  border:
    horizontal: 180   # Total width available
    vertical: 20      # Total height
  radius:
    outer: 85         # Radius for outer segment
  segments:
    gap: 4            # Gap between segments
```

**What happens:**
- Outer segment uses entire border area
- Outer radius: 85px (as specified)
- Inner segment calculated automatically
- Inner radius: (85/2) - 4 = 38.5px (concentric)
- All radii follow LCARS formula (inner_radius = outer_radius / 2)

**When to use:** Default choice for standard LCARS look

---

### Mode 2: Custom Segment Sizes

Control the thickness of each segment explicitly:

```yaml
elbow:
  type: header-left
  style: segmented
  border:
    horizontal: 180
  radius:
    outer: 85
  segments:
    gap: 4
    outer:
      horizontal: 30    # Thin outer (30px bars)
      vertical: 30
    inner:
      horizontal: 60    # Thick inner (60px bars)
      vertical: 60
```

**What happens:**
- Outer segment: 30px thick bars, radius 85px
- Inner segment: 60px thick bars
- Inner radius: (85/2) - 4 = 38.5px (still concentric!)
- Segments positioned with 4px gap

**When to use:**
- Reversed proportions (thin outer, thick inner)
- Specific bar thickness requirements
- Custom visual designs

---

### Mode 3: Break Concentricity (Advanced)

Override the inner segment's radius to break the concentric relationship:

```yaml
elbow:
  type: header-left
  style: segmented
  radius:
    outer: 85
  segments:
    gap: 4
    outer:
      horizontal: 30
      vertical: 30
    inner:
      horizontal: 60
      vertical: 60
      radius: 55        # 🎯 Explicit inner radius
```

**What happens:**
- Outer segment: radius 85px
- Inner segment: radius 55px (NOT concentric)
- Inner would auto-calculate to 38.5px, but you override it
- Creates asymmetric curve relationship

**When to use:**
- Fine-tuning for specific designs
- Matching mockups/specifications
- Creating unique non-concentric effects
- Inner bars too wide/narrow for auto radius

---

## Common Scenarios

### Scenario 1: "Standard Picard-style double elbow"

```yaml
elbow:
  type: header-left
  style: segmented
  border:
    horizontal: 120
    vertical: 20
  radius:
    outer: 60
  segments:
    gap: 4
```

Simple, concentric, proportional.

---

### Scenario 2: "Thin frame with thick inner content area"

```yaml
elbow:
  type: header-left
  style: segmented
  radius:
    outer: 85
  segments:
    gap: 4
    outer:
      horizontal: 30    # Thin frame
      vertical: 30
    inner:
      horizontal: 80    # Thick content area
      vertical: 80
```

Still concentric by default.

---

### Scenario 3: "Wide inner bars need tighter curve"

```yaml
elbow:
  type: header-left
  style: segmented
  radius:
    outer: 85
  segments:
    gap: 4
    outer:
      horizontal: 30
      vertical: 30
    inner:
      horizontal: 60
      vertical: 60
      radius: 30        # Tighter than auto 38.5px
```

Breaks concentricity for visual preference.

---

### Scenario 4: "Inner curve matches specific design spec"

```yaml
elbow:
  type: header-left
  style: segmented
  radius:
    outer: 100
  segments:
    gap: 6
    outer:
      horizontal: 25
      vertical: 25
      radius: 60        # 🎯 Override outer segment too
    inner:
      horizontal: 80
      vertical: 80
      radius: 35        # 🎯 Precise inner spec
```

Complete control over all radii.

---

## Parameters Explained

### `radius.outer`
- **Controls:** Outer segment's outer radius
- **Default:** Auto-calculated from outer segment width
- **Use when:** You want a specific outer curve

### `segments.outer.radius`
- **Controls:** Same as radius.outer, but segment-specific
- **Overrides:** radius.outer
- **Use when:** Need different radius than global setting

### `segments.inner.radius`
- **Controls:** Inner segment's outer radius
- **Default:** Auto-calculated for concentricity: `(outer_inner_radius) - gap`
- **Overrides:** Concentric calculation
- **Use when:** Auto-calculated radius doesn't match your design

### Concentricity

**Concentric (default):**
```
Inner segment's outer radius = (Outer segment's inner radius) - gap
```

The curves are parallel, maintaining constant gap.

**Non-concentric (with segments.inner.radius):**
```
Inner segment uses your explicit radius value
```

The curves are NOT parallel, gap varies.

---

## Quick Decision Tree

**1. Do you need custom segment thicknesses?**
- ❌ No → Use Mode 1 (auto sizing)
- ✅ Yes → Continue...

**2. Is the auto-calculated inner radius acceptable?**
- ✅ Yes → Use Mode 2 (custom sizes, auto radius)
- ❌ No → Continue...

**3. What's wrong with the auto radius?**
- Too large → Set `segments.inner.radius` to smaller value
- Too small → Set `segments.inner.radius` to larger value
- Use Mode 3 (break concentricity)

---

## Visual Guide

### Auto Sizing (Mode 1)
```
Outer: 85px radius
  ╭──────────────────────╮
  │ Outer (thin frame)   │
  │  ╭─────────────╮  Gap: 4px
  │  │ Inner (auto)│     │
  │  │ 38.5px rad  │←────┤ Concentric
  │  ╰─────────────╯     │
  ╰──────────────────────╯
```

### Custom Sizes (Mode 2)
```
Outer: 85px radius
  ╭──────────────────────╮
  │ 30px outer bars      │
  │  ╭───────────────╮ Gap: 4px
  │  │ 60px inner    │   │
  │  │ 38.5px radius │←──┤ Still concentric!
  │  ╰───────────────╯   │
  ╰──────────────────────╯
```

### Non-Concentric (Mode 3)
```
Outer: 85px radius
  ╭──────────────────────╮
  │ 30px outer bars      │
  │    ╭─────────╮ Gap varies
  │    │ Inner   │       │
  │    │ 55px rad│←──────┤ NOT parallel
  │    ╰─────────╯       │
  ╰──────────────────────╯
```

---

## Migration Notes

**Old config (factor-based):**
```yaml
segments:
  factor: 4
```

**New equivalent (auto sizing):**
```yaml
segments:
  gap: 4
  # System automatically calculates proportional sizing
```

**Old config (explicit with ignored radius):**
```yaml
radius:
  outer: 85
segments:
  outer:
    horizontal: 30
  inner:
    horizontal: 60
  # BUG: radius.outer was ignored, inner used horizontal/2
```

**New fixed config:**
```yaml
radius:
  outer: 85           # ✅ Now respected!
segments:
  outer:
    horizontal: 30
  ## Summary

✅ **Default is simple:** Just set `radius.outer` and `segments.gap`
✅ **Custom sizes optional:** Add `segments.outer` / `segments.inner`
✅ **Fine-tuning available:** Use `segments.inner.radius` when needed
✅ **Concentricity maintained** unless explicitly overridden

**Recommendation:** Start with Mode 1, add complexity only if needed.

---

## See Also

- [Segmented Elbow Anatomy](./segmented-elbow-anatomy.md) - Technical details on radii calculations


---

[← Back to Reference](../README.md) | [User Guide →](../../README.md)
