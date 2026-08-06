# Base SVG Filters Reference

> **Visual filters for base SVG layer**
> Apply opacity, blur, brightness, tint, and other effects to make overlays more prominent

## Overview

Apply visual filters to the base SVG layer to make overlays more prominent while keeping overlays crisp and clear.

## Quick Start

**Simple filters** (legacy object format, CSS filters only):
```yaml
base_svg:
  source: builtin:ncc-1701-a-blue
  filters:
    opacity: 0.5
    blur: "3px"
```

**Stackable filters** (array format, supports CSS and SVG filter primitives):
```yaml
base_svg:
  source: builtin:ncc-1701-a-blue
  filters:
    - { mode: css, type: opacity, value: 0.5 }
    - { mode: svg, type: tint, value: { color: 'rgba(180,0,0,0.35)' } }
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

### Drop Shadow
Creates a drop shadow behind the element.

```yaml
filters:
  - { mode: css, type: drop-shadow, value: { x: 2, y: 2, blur: '4px', color: '#000000' } }
```

**Use cases**: Depth/emphasis via a classic drop shadow.

---

## SVG Filter Primitives

Lower-level SVG `<filter>` primitives, for effects the CSS filter list above
can't express. Requires array format with `mode: svg` — SVG filters need an
`<svg>` root, so these aren't available on non-SVG cards like data-grid.
Chain multiple primitives in the same `filters:` array to compose more
complex effects (each primitive's output feeds the next).

### feGaussianBlur
SVG blur filter — smoother than CSS blur, chains with other SVG filters.

```yaml
filters:
  - { mode: svg, type: feGaussianBlur, value: { stdDeviation: 4 } }
```

**Use cases**: Softening, glow bases, chaining with feOffset for shadows.

### feColorMatrix
Powerful color transformation using matrix operations. Supports hue
rotation, saturation, luminance-to-alpha, and custom 4x5 color mapping
matrices.

```yaml
filters:
  - { mode: svg, type: feColorMatrix, value: { type: saturate, values: 1.5 } }
```

**Use cases**: Advanced color remapping beyond CSS saturate/hue-rotate.

### feOffset
Shifts the filter result by dx/dy pixels. Essential for creating shadow
effects when combined with blur.

```yaml
filters:
  - { mode: svg, type: feOffset, value: { dx: 3, dy: 3 } }
```

**Use cases**: Building custom shadow effects when chained with feGaussianBlur/feBlend.

### feBlend
Blends the current filter result with another input (SourceGraphic by
default) using any of the 16 standard CSS blend modes (multiply, screen,
overlay, etc.).

```yaml
filters:
  - { mode: svg, type: feBlend, value: { mode: screen } }
```

**Use cases**: Glow effects — try screen/lighten mode after a blur.

### feComposite
Combines two inputs (the previous filter result and SourceGraphic by
default) using Porter-Duff compositing operators, or a custom arithmetic
formula.

```yaml
filters:
  - { mode: svg, type: feComposite, value: { operator: over } }
```

**Use cases**: Advanced layering/compositing beyond simple blend modes.

### feMorphology
Erodes (thins) or dilates (fattens) shapes. Useful for creating outline
effects or adjusting edge thickness.

```yaml
filters:
  - { mode: svg, type: feMorphology, value: { operator: dilate, radius: 2 } }
```

**Use cases**: Outline/edge-thickness effects.

### feTurbulence
Generates Perlin noise patterns for organic textures. Commonly used with
feDisplacementMap for distortion/warping effects.

```yaml
filters:
  - { mode: svg, type: feTurbulence, value: { baseFrequency: 0.02, numOctaves: 3 } }
```

**Use cases**: Organic noise textures, paired with feDisplacementMap.

### feDisplacementMap
Warps/distorts the image based on color values from another source. Perfect
for wavy, liquid, or turbulent effects.

```yaml
filters:
  - { mode: svg, type: feTurbulence, value: { baseFrequency: 0.02, numOctaves: 3 } }
  - { mode: svg, type: feDisplacementMap, value: { scale: 20 } }
```

**Use cases**: Wavy, liquid, or turbulent distortion effects.

::: tip
Add a Turbulence filter right before this one — Turbulence generates the
displacement map this filter distorts by.
:::

### Tint

The one friendly *compound* SVG type — internally expands to a chained
`feFlood`+`feComposite` pair, so it composites a flat color wash over the
base SVG (a real color tint, not an approximation) from a single filter
entry. Same SVG-only requirement as the primitives above — not available on
non-SVG cards like data-grid. The color's alpha channel controls how much
of the artwork shows through.

```yaml
filters:
  - { mode: svg, type: tint, value: { color: 'rgba(180,0,0,0.35)' } }
```

**Use cases**: Alert/status washes, theme-colored overlays, quick visual state changes.

---

## Common Filter Recipes

Copy-paste `filters:` arrays for common effects.

### Dimmed
Reduces opacity and brightness for a subtle background.

```yaml
filters:
  opacity: 0.5
  brightness: 0.8
```

**Best for**: General use, balanced visibility.

### Subtle
Light dimming with slight blur and desaturation.

```yaml
filters:
  opacity: 0.6
  blur: "1px"
  grayscale: 0.2
```

**Best for**: Maintaining detail while reducing emphasis.

### Backdrop
Heavy dimming with blur for strong overlay emphasis.

```yaml
filters:
  opacity: 0.3
  blur: "3px"
  brightness: 0.6
```

**Best for**: Data-heavy displays, prominent overlays.

### Faded
Desaturated and dimmed for a muted background.

```yaml
filters:
  opacity: 0.4
  grayscale: 0.5
  contrast: 0.7
```

**Best for**: Minimal aesthetic, reduced visual clutter.

### Red Wash (alert)
A real red color tint using the SVG `tint` filter, rather than the old
`red-alert` preset's hue-rotate approximation.

```yaml
filters:
  - { mode: svg, type: tint, value: { color: 'rgba(180,0,0,0.35)' } }
```

**Best for**: Alert states, emergency displays.

### Monochrome
Full grayscale with reduced contrast.

```yaml
filters:
  opacity: 0.6
  grayscale: 1.0
  contrast: 0.8
```

**Best for**: Professional displays, reduced color distraction.

### Clear all filters
```yaml
filters: []
```

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

## See Also

- [Line Overlay](./line-overlay.md)
- [Control Overlay](./control-overlay.md)
- [Rules Engine](../../core/rules/)
