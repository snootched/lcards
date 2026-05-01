# Base SVG Filters Reference

> **Visual filters for base SVG layer**
> Apply opacity, blur, brightness, and other effects to make overlays more prominent

## Overview

Apply visual filters to the base SVG layer to make overlays more prominent while keeping overlays crisp and clear.

## Quick Start

**Apply a preset**:
```yaml
base_svg:
  source: builtin:ncc-1701-a-blue
  filter_preset: dimmed
```

**Custom filters**:
```yaml
base_svg:
  source: builtin:ncc-1701-a-blue
  filters:
    opacity: 0.5
    blur: "3px"
```

**Combine preset with overrides**:
```yaml
base_svg:
  source: builtin:ncc-1701-a-blue
  filter_preset: dimmed
  filters:
    opacity: 0.3  # Override preset's 0.5
```

---

## Filter Types

### Opacity
Controls transparency of base SVG (0.0 = invisible, 1.0 = fully opaque).

```yaml
filters:
  opacity: 0.5  # 50% transparent
```

**Use cases**: Dim background artwork to emphasize overlays.

### Blur
Applies Gaussian blur (softens focus).

```yaml
filters:
  blur: "3px"  # Moderate blur
```

**Use cases**: Create depth, de-emphasize background detail.

### Brightness
Adjusts brightness level (1.0 = normal, <1.0 = darker, >1.0 = brighter).

```yaml
filters:
  brightness: 0.7  # 30% darker
```

**Use cases**: Darken background, adjust visibility.

### Contrast
Adjusts contrast (1.0 = normal, <1.0 = lower contrast, >1.0 = higher contrast).

```yaml
filters:
  contrast: 0.8  # Reduce contrast
```

**Use cases**: Soften harsh edges, mute colors.

### Grayscale
Converts to grayscale (0.0 = full color, 1.0 = completely gray).

```yaml
filters:
  grayscale: 0.5  # 50% desaturated
```

**Use cases**: Monochrome displays, reduced visual weight.

### Sepia
Applies sepia tone (warm brown tint).

```yaml
filters:
  sepia: 0.3  # Slight warmth
```

**Use cases**: Vintage aesthetic, warm backgrounds.

### Hue Rotate
Rotates colors around the color wheel (in degrees).

```yaml
filters:
  hue_rotate: 45  # Shift hues by 45 degrees
```

**Use cases**: Color theme adjustments, alert states.

### Saturate
Adjusts color saturation (1.0 = normal, <1.0 = less saturated, >1.0 = more saturated).

```yaml
filters:
  saturate: 0.6  # Reduce saturation
```

**Use cases**: Mute vibrant colors, adjust visual intensity.

### Invert
Inverts colors (0.0 = normal, 1.0 = fully inverted).

```yaml
filters:
  invert: 0.2  # Slight inversion
```

**Use cases**: High-contrast themes, special effects.

---

## Built-in Presets

### `none`
Clear all filters (remove filtering).

```yaml
# No filters applied
filter_preset: none
```

**Best for**: Removing filters, returning to unfiltered state.

### `dimmed`
Reduces opacity and brightness for subtle background.

```yaml
# Equivalent to:
filters:
  opacity: 0.5
  brightness: 0.8
```

**Best for**: General use, balanced visibility.

### `subtle`
Light dimming with slight blur and desaturation.

```yaml
# Equivalent to:
filters:
  opacity: 0.6
  blur: "1px"
  grayscale: 0.2
```

**Best for**: Maintaining detail while reducing emphasis.

### `backdrop`
Heavy dimming with blur for strong overlay emphasis.

```yaml
# Equivalent to:
filters:
  opacity: 0.3
  blur: "3px"
  brightness: 0.6
```

**Best for**: Data-heavy displays, prominent overlays.

### `faded`
Desaturated and dimmed for muted background.

```yaml
# Equivalent to:
filters:
  opacity: 0.4
  grayscale: 0.5
  contrast: 0.7
```

**Best for**: Minimal aesthetic, reduced visual clutter.

### `red-alert`
Brightened with warm hue shift for alert state.

```yaml
# Equivalent to:
filters:
  opacity: 0.7
  brightness: 1.2
  hue_rotate: -30
  saturate: 1.5
```

**Best for**: Alert states, emergency displays.

### `monochrome`
Full grayscale with enhanced contrast.

```yaml
# Equivalent to:
filters:
  grayscale: 1.0
  contrast: 1.2
  brightness: 0.9
```

**Best for**: Professional displays, reduced color distraction.

---

## Overlay-Only Mode

Create cards without any base SVG (pure overlay displays).

```yaml
base_svg:
  source: "none"
view_box: [0, 0, 1920, 1200]  # REQUIRED when source is "none"

overlays:
  - type: control
    id: main_display
    # ... overlay config
```

**Requirements**:
- `view_box` must be explicitly defined (4-element array)
- No anchor extraction (all overlays need explicit coordinates)

**Use cases**:
- Pure data displays
- Custom overlay compositions
- Testing/prototyping

---

## Theme Overrides

Themes can define custom filter presets.

**Theme YAML**:
```yaml
lcars-custom:
  name: "LCARS Custom"
  msd:
    filter_presets:
      dimmed:
        opacity: 0.3  # Override built-in 0.5
        blur: "2px"   # Add blur

      custom-preset:
        opacity: 0.4
        grayscale: 0.8
        contrast: 1.1
```

**Card Config**:
```yaml
theme: lcars-custom
base_svg:
  source: builtin:ncc-1701-a-blue
  filter_preset: dimmed  # Uses theme override
```

**Priority**: Theme presets override built-in presets, explicit filters override everything.

---

## Technical Details

### Filter Isolation

Filters apply **only to base SVG content**, not to overlays. This is achieved by wrapping base SVG content in an internal group:

```html
<svg viewBox="0 0 1920 1200">
  <g id="__msd-base-content" style="filter: blur(3px)">
    <!-- Base SVG ship template - FILTERED -->
  </g>
  <g id="msd-overlay-container">
    <!-- Overlays - NOT filtered, remain crisp -->
  </g>
</svg>
```

**Result**: Base artwork is filtered while overlays remain sharp and clear.

### Reserved IDs

IDs starting with `__` (double underscore) or `msd-internal-` are reserved for internal MSD use:
- `__msd-base-content` - Base SVG content wrapper (for filter isolation)
- Not extracted as anchors
- Not validated as user anchors
- Invisible to anchor system

**User anchors**: Can use any ID except those starting with `__` or `msd-internal-`.

### Performance

- **GPU-accelerated**: CSS filters use hardware acceleration
- **Single application**: Filters applied once after initial render
- **No overhead**: No ongoing performance impact
- **Optional transitions**: CSS-based animations available

---

## See Also

- [Line Overlay](./line-overlay.md)
- [Control Overlay](./control-overlay.md)
- [Rules Engine](../../core/rules/)
