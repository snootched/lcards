# Segmented Elbow - Final Clean Schema Design

## Design Principles

1. **Explicit over implicit** - All parameters clearly named
2. **No ambiguity** - Each parameter has one clear meaning
3. **Sensible defaults** - Common cases require minimal config
4. **Full control** - Advanced users can set everything

---

## The Four Parameters Per Segment

Each segment has exactly **4 properties**:

1. **`bar_width`** - Horizontal bar thickness (vertical sidebar width)
2. **`bar_height`** - Vertical bar thickness (horizontal bar height)
3. **`outer_curve`** - Outer corner radius (convex curve)
4. **`inner_curve`** - Inner corner radius (concave curve)

---

## Proposed Clean Schema

```yaml
type: custom:lcards-elbow
entity: <entity_id>

elbow:
  type: header-left | header-right | footer-left | footer-right
  style: segmented

  # NOTE: border is NOT used for segmented style!
  # Canvas dimensions are determined by parent card's size config
  # Only the segment bar_width and bar_height matter

  # Segmented style configuration
  segments:
    gap: <number>           # Gap between outer and inner segments (default: 4)

    # Outer segment (the frame)
    outer_segment:
      bar_width: <number>       # Horizontal bar thickness (required)
      bar_height: <number>      # Vertical bar thickness (default: bar_width)
      outer_curve: <number>     # Outer corner radius (default: bar_width / 2)
      inner_curve: <number>     # Inner corner radius (default: outer_curve / 2)
      color: <color>            # Optional color override

    # Inner segment (the content area)
    inner_segment:
      bar_width: <number>       # Horizontal bar thickness (required)
      bar_height: <number>      # Vertical bar thickness (default: bar_width)
      outer_curve: <number>     # Outer corner radius (default: auto-concentric)
      inner_curve: <number>     # Inner corner radius (default: outer_curve / 2)
      color: <color>            # Optional color override

# All other card properties (icon, text, actions, etc.)
preset: <preset_name>
icon: <icon_config>
text: <text_config>
tap_action: <action>
# ... etc
```

---

## Default Calculation Logic

### Outer Segment Defaults

```
bar_height = bar_width (if not specified)
outer_curve = bar_width / 2 (if not specified)
inner_curve = outer_curve / 2 (if not specified) [LCARS formula]
```

### Inner Segment Defaults

```
bar_height = bar_width (if not specified)
outer_curve = (outer_segment.inner_curve) - gap (if not specified) [Concentric]
inner_curve = outer_curve / 2 (if not specified) [LCARS formula]
```

### Gap Default

```
gap = 4 (if not specified)
```

---

## Usage Examples

### Example 1: Minimal Config (Most Common)

```yaml
elbow:
  type: header-left
  style: segmented
  segments:
    outer_segment:
      bar_width: 30
      outer_curve: 85       # Explicit outer curve
    inner_segment:
      bar_width: 60
```

**What happens:**
```
Outer segment:
  bar_width: 30
  bar_height: 30 (auto)
  outer_curve: 85 (specified)
  inner_curve: 42.5 (auto: 85/2)

Inner segment:
  bar_width: 60
  bar_height: 60 (auto)
  outer_curve: 38.5 (auto: 42.5 - 4, concentric)
  inner_curve: 19.25 (auto: 38.5/2)

Gap: 4 (default)
```

---

### Example 2: Override Inner Curve (Fine-Tuning)

```yaml
elbow:
  type: header-left
  style: segmented
  segments:
    outer_segment:
      bar_width: 30
      outer_curve: 85
    inner_segment:
      bar_width: 60
      outer_curve: 55       # Override concentric default
```

**What happens:**
```
Outer segment:
  bar_width: 30
  bar_height: 30
  outer_curve: 85
  inner_curve: 42.5

Inner segment:
  bar_width: 60
  bar_height: 60
  outer_curve: 55 (overridden, breaks concentricity)
  inner_curve: 27.5 (auto: 55/2)

Gap: 4
```

---

### Example 3: Full Control (All Parameters)

```yaml
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 6
    outer_segment:
      bar_width: 25
      bar_height: 35        # Different from width
      outer_curve: 60
      inner_curve: 30       # Override LCARS formula
      color: "#FF9C00"
    inner_segment:
      bar_width: 80
      bar_height: 70        # Different from width
      outer_curve: 45
      inner_curve: 20       # Override LCARS formula
      color: "#FFCC99"
```

**What happens:**
```
Outer segment:
  bar_width: 25
  bar_height: 35 (specified)
  outer_curve: 60 (specified)
  inner_curve: 30 (specified, overrides auto 30)

Inner segment:
  bar_width: 80
  bar_height: 70 (specified)
  outer_curve: 45 (specified)
  inner_curve: 20 (specified, overrides auto 22.5)

Gap: 6 (specified)
```

---

### Example 4: Simple Equal Segments

```yaml
elbow:
  type: header-left
  style: segmented
  segments:
    outer_segment:
      bar_width: 40
      outer_curve: 60
    inner_segment:
      bar_width: 40
      # Auto-concentric: outer_curve = (60/2) - 4 = 26
```

**What happens:**
```
Outer segment:
  bar_width: 40
  bar_height: 40
  outer_curve: 60
  inner_curve: 30

Inner segment:
  bar_width: 40
  bar_height: 40
  outer_curve: 26 (auto: 30 - 4)
  inner_curve: 13 (auto: 26/2)

Gap: 4
Both segments same thickness!
```

---

## Visual Guide

```yaml
segments:
  gap: 4

  outer_segment:
    bar_width: 30         # ───┐
    bar_height: 30        # ───┤ How thick the bars are
    outer_curve: 85       # ───┤ Outside corner radius
    inner_curve: 42.5     # ───┘ Inside corner radius (usually auto)

  inner_segment:
    bar_width: 60         # ───┐
    bar_height: 60        # ───┤ How thick the bars are
    outer_curve: 55       # ───┤ Outside corner radius
    inner_curve: 27.5     # ───┘ Inside corner radius (usually auto)
```

**Result:**
```
        ╭─────────────────  ← outer_segment.outer_curve (85)
        │╭────────────────  ← outer_segment.inner_curve (42.5, auto)
  gap→  ││
  4px   ││    ╭──────────  ← inner_segment.outer_curve (55)
        ││    │╭─────────  ← inner_segment.inner_curve (27.5, auto)
        ││    ││
        └┴────┴┴─────────
         30   60
         bar_width
```

---

## Required vs Optional

### Outer Segment
- ✅ **Required:** `bar_width`
- ⚪ **Optional:** `bar_height` (defaults to `bar_width`)
- ⚪ **Optional:** `outer_curve` (defaults to `bar_width / 2`)
- ⚪ **Optional:** `inner_curve` (defaults to `outer_curve / 2`)
- ⚪ **Optional:** `color`

### Inner Segment
- ✅ **Required:** `bar_width`
- ⚪ **Optional:** `bar_height` (defaults to `bar_width`)
- ⚪ **Optional:** `outer_curve` (defaults to concentric calculation)
- ⚪ **Optional:** `inner_curve` (defaults to `outer_curve / 2`)
- ⚪ **Optional:** `color`

### Gap
- ⚪ **Optional:** `gap` (defaults to `4`)

---

## Common Patterns

### Pattern 1: "Standard Picard-style" (Thin frame, thick content)
```yaml
segments:
  outer_segment:
    bar_width: 30
    outer_curve: 85
  inner_segment:
    bar_width: 60
```

---

### Pattern 2: "Custom curves" (Break concentricity)
```yaml
segments:
  outer_segment:
    bar_width: 30
    outer_curve: 85
  inner_segment:
    bar_width: 60
    outer_curve: 55      # Not concentric!
```

---

### Pattern 3: "Uniform width bars"
```yaml
segments:
  gap: 6
  outer_segment:
    bar_width: 50
    outer_curve: 75
  inner_segment:
    bar_width: 50
```

---

### Pattern 4: "Asymmetric bars" (Different horizontal/vertical)
```yaml
segments:
  outer_segment:
    bar_width: 20
    bar_height: 40       # Tall horizontal bar, thin sidebar
    outer_curve: 60
  inner_segment:
    bar_width: 60
    bar_height: 30       # Short horizontal bar, thick sidebar
```

---

## Migration from Old Schema

### Old Schema → New Schema

```yaml
# OLD (v1.24.16 and earlier):
elbow:
  radius:
    outer: 85
  segments:
    gap: 4
    outer:
      horizontal: 30
      vertical: 30
      radius: 85
    inner:
      horizontal: 60
      vertical: 60
      radius: 55

# NEW (Clean schema):
elbow:
  segments:
    gap: 4
    outer_segment:
      bar_width: 30
      bar_height: 30
      outer_curve: 85
      # inner_curve: auto
    inner_segment:
      bar_width: 60
      bar_height: 60
      outer_curve: 55
      # inner_curve: auto
```

**Key changes:**
- `outer` → `outer_segment`
- `inner` → `inner_segment`
- `horizontal` → `bar_width`
- `vertical` → `bar_height`
- `radius` → `outer_curve`
- `radius.outer` (global) → removed (set on segment directly)
- New: `inner_curve` (previously couldn't control)

---

## Parameter Name Rationale

### Why `bar_width` / `bar_height`?
- ✅ Clear: "bar" refers to the straight edges
- ✅ Unambiguous: width/height are standard dimensions
- ❌ Alternative rejected: `horizontal`/`vertical` (confusing which bar)
- ❌ Alternative rejected: `thickness` (ambiguous dimension)

### Why `outer_curve` / `inner_curve`?
- ✅ Clear: "curve" is the corner radius
- ✅ Matches visual: outer edge vs inner edge
- ❌ Alternative rejected: `radius` (ambiguous which one)
- ❌ Alternative rejected: `corner_radius` (verbose)

### Why `outer_segment` / `inner_segment`?
- ✅ Explicit: clearly identifies which segment
- ✅ Self-documenting: code reads naturally
- ❌ Alternative rejected: `outer`/`inner` (too short, ambiguous)
- ❌ Alternative rejected: `frame`/`content` (not standard LCARS terminology)

---

## Implementation Notes

### Parsing Priority

For each parameter, check in this order:

1. New schema name (e.g., `outer_segment.outer_curve`)
2. Calculate default if not specified

No fallbacks to old schema - clean break.

### Validation

```javascript
// Required
if (!config.segments?.outer_segment?.bar_width) {
    throw new Error('outer_segment.bar_width is required');
}
if (!config.segments?.inner_segment?.bar_width) {
    throw new Error('inner_segment.bar_width is required');
}

// Defaults
outerSegment.bar_height = outerSegment.bar_height ?? outerSegment.bar_width;
outerSegment.outer_curve = outerSegment.outer_curve ?? outerSegment.bar_width / 2;
outerSegment.inner_curve = outerSegment.inner_curve ?? outerSegment.outer_curve / 2;

innerSegment.bar_height = innerSegment.bar_height ?? innerSegment.bar_width;
innerSegment.outer_curve = innerSegment.outer_curve ??
    Math.max(0, outerSegment.inner_curve - gap);
innerSegment.inner_curve = innerSegment.inner_curve ?? innerSegment.outer_curve / 2;
```

---

## Documentation Structure

### User Guide
1. **Quick Start** - Minimal config example
2. **Parameter Reference** - Full table of all parameters
3. **Visual Anatomy** - Diagram showing all 4 parameters per segment
4. **Common Patterns** - 5-6 real-world examples
5. **Advanced** - Full control examples

### Technical Docs
1. **Schema Definition** - Complete YAML schema
2. **Default Calculation** - Algorithm for auto-values
3. **Validation Rules** - What's required, what's optional
4. **Internal Mapping** - How config maps to geometry

---

## Summary

### Clean Schema Benefits

✅ **Explicit** - Every parameter clearly named
✅ **Predictable** - Sensible defaults for common cases
✅ **Flexible** - Can override any of the 8 parameters
✅ **Self-documenting** - Names describe what they control
✅ **No legacy** - Clean break, no backwards compatibility cruft

### Configuration Complexity

**Minimal (most common):**
```yaml
segments:
  outer_segment: { bar_width: 30, outer_curve: 85 }
  inner_segment: { bar_width: 60 }
```

**Moderate (fine-tuning):**
```yaml
segments:
  outer_segment: { bar_width: 30, outer_curve: 85 }
  inner_segment: { bar_width: 60, outer_curve: 55 }
```

**Full control (advanced):**
```yaml
segments:
  gap: 6
  outer_segment: { bar_width: 25, bar_height: 35, outer_curve: 60, inner_curve: 30 }
  inner_segment: { bar_width: 80, bar_height: 70, outer_curve: 45, inner_curve: 20 }
```

---

## Next Steps

1. ✅ Schema design complete
2. ⏭️ Implement new parser (break compatibility)
3. ⏭️ Update all documentation
4. ⏭️ Create migration guide
5. ⏭️ Version bump (breaking change: v2.0.0)
