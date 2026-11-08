---
description: "MSD card base SVG filters: dim, blur, desaturate or tint the blueprint with CSS filters and SVG filter primitives so the overlays stand out, with recipes to copy."
moved_anchors:
  overview: /cards/msd/base-svg-filters#filters
  quick-start: /cards/msd/base-svg-filters#filters
  filter-types: /cards/msd/base-svg-filters#css-filters
  svg-filter-primitives: /cards/msd/base-svg-filters#svg-filters
  common-filter-recipes: /cards/msd/base-svg-filters#recipes
  red-wash-alert: /cards/msd/base-svg-filters#red-wash
  clear-all-filters: /cards/msd/base-svg-filters#filters
  overlay-only-mode: /cards/msd/background#a-blank-canvas
  see-also: /cards/msd/
---

# Base SVG Filters

Filters change how the blueprint looks: dimmer, softer, grey or tinted, so the controls and lines on it stand out. They apply to the blueprint only; overlays stay sharp. The same filters work on the button and data grid cards ([Filters](../../core/effects/filters)).

## filters

**`base_svg.filters` is a list of filters applied to the blueprint, one after another.** Each entry names a `type` and gives its `value`; `mode: svg` marks the SVG filter primitives, and CSS filters need no `mode`.

- CSS filters (`opacity`, `blur`, `grayscale` ...) are quick and cover most needs. SVG filters (`tint`, `feColorMatrix` ...) do what CSS can't, such as a real colour tint.
- The CSS filters run first, in list order, then the SVG filters, chained in list order: each one works on the result of the one before.
- `filters: []` clears them. A [rule](./animations#rules) can crossfade the blueprint to other filters while a condition holds, such as a red tint on alert.
- In the MSD Studio, the Base SVG tab's **Filters (base_svg)** section adds and edits them, with a guide to each type.

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 5
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    # faded and darker, with a blue tint over it
    filters:
      - type: opacity
        value: 0.6
      - type: brightness
        value: 0.8
      - mode: svg
        type: tint
        value:
          color: alpha(var(--lcars-blue), 0.2)
  view_box: [180, 270, 1600, 720]
```

::: details More about filters
- **Older configs** wrote `filters` as one map (`opacity: 0.5`, `blur: 3px`). Write a list of entries instead, as on this page.
- **Live values:** filter values are fixed; templates and entity bindings don't work in them. Use a [rule](./animations#rules) to change them with an entity.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `filters[].type` | string | required | The filter: one of the [CSS filters](#css-filters) or [SVG filters](#svg-filters) below |
| `filters[].value` | number / string / object | per type | A number or string for a CSS filter, the keys listed below for the others |
| `filters[].mode` | string | `css` | `css` or `svg`. Set `svg` for the SVG filters |

## CSS filters

**The browser's own CSS filters: fade, blur, brighten, desaturate and shift the colours of the blueprint.** Most take one number as `value`; `blur` and `hue-rotate` take a length or an angle as a string.

- Stack several to combine them: a faded, slightly blurred blueprint is two entries.
- Each type below has a playground: move the sliders to see it on a sample shape, and copy the YAML it prints.

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 5
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    # grey, softened and faded
    filters:
      - type: grayscale
        value: 1
      - type: blur
        value: 2px
      - type: opacity
        value: 0.6
  view_box: [180, 270, 1600, 720]
```

### opacity

**How see-through the blueprint is, from `0` (invisible) to `1` (solid).** The usual way to push a busy blueprint into the background.

<FilterPlayground type="opacity" />

```yaml
filters:
  - type: opacity
    value: 0.5
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number | `1` | `0` to `1`. Above `1` changes nothing |

### blur

**A soft focus over the blueprint, as a length in px.** It gives a sense of depth and hides fine detail.

<FilterPlayground type="blur" />

```yaml
filters:
  - type: blur
    value: 3px
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | string | `0px` | Blur radius in px, such as `"3px"` |

### brightness

**Darker or brighter: `1` is unchanged, lower is darker, higher is brighter.**

<FilterPlayground type="brightness" />

```yaml
filters:
  - type: brightness
    value: 0.7
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number | `1` | `0` is black. No upper limit; the Studio goes to `3` |

### contrast

**Less or more contrast: `1` is unchanged, lower softens hard edges and mutes colours.**

<FilterPlayground type="contrast" />

```yaml
filters:
  - type: contrast
    value: 0.8
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number | `1` | `0` is flat grey. No upper limit; the Studio goes to `3` |

### grayscale

**Takes the colour out: `0` is full colour, `1` completely grey.** For a monochrome display, or to give the blueprint less weight.

<FilterPlayground type="grayscale" />

```yaml
filters:
  - type: grayscale
    value: 0.5
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number | `0` | `0` to `1` |

### sepia

**A warm brown tone, from `0` (none) to `1` (full).**

<FilterPlayground type="sepia" />

```yaml
filters:
  - type: sepia
    value: 0.3
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number | `0` | `0` to `1` |

### hue-rotate

**Turns every colour round the colour wheel by an angle.** A quick way to recolour a blueprint, or to mark an alert state.

<FilterPlayground type="hue-rotate" />

```yaml
filters:
  - type: hue-rotate
    value: 45deg
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | string | `0deg` | An angle in deg, such as `"45deg"`. `0deg` to `360deg` covers the wheel; larger values wrap round |

### saturate

**Less or more colour: `1` is unchanged, lower mutes the colours, higher makes them stronger.**

<FilterPlayground type="saturate" />

```yaml
filters:
  - type: saturate
    value: 0.6
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number | `1` | `0` is grey. No upper limit; the Studio goes to `3` |

### invert

**Inverts the colours, from `0` (normal) to `1` (fully inverted).** For a light blueprint on a dark display, or special effects.

<FilterPlayground type="invert" />

```yaml
filters:
  - type: invert
    value: 0.2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number | `0` | `0` to `1` |

### drop-shadow

**A shadow behind the blueprint's lines, for depth or emphasis.**

<FilterPlayground type="drop-shadow" />

```yaml
filters:
  - type: drop-shadow
    value:
      x: 2
      "y": 2
      blur: 4px
      color: var(--lcars-black)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value.x` | number | `0` | Shadow offset to the right, px |
| `value.y` | number | `0` | Shadow offset down, px |
| `value.blur` | string | `0px` | Shadow blur radius, such as `"4px"` |
| `value.color` | colour | black | Shadow colour |

## SVG filters

**SVG filter primitives, for effects the CSS filters can't give: a real colour tint, colour matrices, glows, outlines and distortion.** Each entry needs `mode: svg`, and its `value` is a set of keys.

- They chain: each primitive works on the result of the one before it in the list, so a blur followed by a blend makes a glow.
- `tint` is the friendly one: a single entry for a colour wash. The others are the browser's SVG primitives, named as in SVG (`feGaussianBlur` ...).

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 5
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    # a soft glow: blur the blueprint, then blend the blur back over it
    filters:
      - mode: svg
        type: feGaussianBlur
        value:
          stdDeviation: 6
      - mode: svg
        type: feBlend
        value:
          mode: screen
  view_box: [180, 270, 1600, 720]
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `mode` | string | `css` | Must be `svg` for these |
| `value` | object | per type | See each type below |

### feGaussianBlur

**A blur that chains with the other SVG filters, smoother than the CSS blur.** The base for glows and soft shadows.

<FilterPlayground type="feGaussianBlur" />

```yaml
filters:
  - mode: svg
    type: feGaussianBlur
    value:
      stdDeviation: 4
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value.stdDeviation` | number | `0` | How much to blur: `0` is none |

### feColorMatrix

**Changes colours with a colour matrix: saturation, a hue turn, transparency from brightness, or a custom 4 by 5 matrix.** For colour changes beyond the CSS `saturate` and `hue-rotate`.

<FilterPlayground type="feColorMatrix" />

```yaml
filters:
  - mode: svg
    type: feColorMatrix
    value:
      type: saturate
      values: 1.5
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value.type` | string | `saturate` | `saturate`, `hueRotate`, `luminanceToAlpha` (darker parts become see-through) or `matrix` |
| `value.values` | number / string / list | `1` for `saturate`, `0` for `hueRotate` | The saturation factor, the hue angle in degrees, or 20 numbers for `matrix` (a list or a string). Not used by `luminanceToAlpha` |

### feOffset

**Moves the result by `dx` and `dy` px.** With a blur and a blend, it makes a shadow of your own.

<FilterPlayground type="feOffset" />

```yaml
filters:
  - mode: svg
    type: feOffset
    value:
      dx: 3
      dy: 3
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value.dx` | number | `0` | Move right (negative: left), px |
| `value.dy` | number | `0` | Move down (negative: up), px |

### feBlend

**Blends the result so far back over the original blueprint with a blend mode.** After a blur, `screen` or `lighten` gives a glow.

<FilterPlayground type="feBlend" />

```yaml
filters:
  - mode: svg
    type: feBlend
    value:
      mode: screen
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value.mode` | string | `normal` | Any of the 16 CSS blend modes: `normal`, `multiply`, `screen`, `darken`, `lighten`, `overlay`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color`, `luminosity` |

### feComposite

**Combines the result so far with the original blueprint by a compositing operator, or a formula of your own.** For layering beyond the blend modes.

<FilterPlayground type="feComposite" />

```yaml
filters:
  - mode: svg
    type: feComposite
    value:
      operator: over
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value.operator` | string | `over` | `over`, `in`, `out`, `atop`, `xor` or `arithmetic` |
| `value.k1` | number | `0` | `arithmetic` only: the result is `k1 * a * b + k2 * a + k3 * b + k4` (a: the result so far, b: the blueprint) |
| `value.k2` | number | `0` | `arithmetic` only |
| `value.k3` | number | `0` | `arithmetic` only |
| `value.k4` | number | `0` | `arithmetic` only |

### feMorphology

**Thins (`erode`) or thickens (`dilate`) the blueprint's lines.** For outlines, or heavier strokes on a fine drawing.

<FilterPlayground type="feMorphology" />

```yaml
filters:
  - mode: svg
    type: feMorphology
    value:
      operator: dilate
      radius: 2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value.operator` | string | `erode` | `erode` thins, `dilate` thickens |
| `value.radius` | number | `1` | How far to thin or thicken |

### feTurbulence

**Noise for organic textures, usually followed by `feDisplacementMap` to warp the blueprint.** On its own it draws only the noise, in place of the blueprint.

<FilterPlayground type="feTurbulence" />

```yaml
filters:
  - mode: svg
    type: feTurbulence
    value:
      baseFrequency: 0.02
      numOctaves: 3
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value.type` | string | `turbulence` | `turbulence` (cloudy) or `fractalNoise` (softer) |
| `value.baseFrequency` | number | `0.05` | `0` to `1`: lower is larger features |
| `value.numOctaves` | integer | `1` | `1` to `10` layers of detail |
| `value.seed` | number | `0` | Change it for a different pattern |

### feDisplacementMap

**Warps the image by the colours of the result before it: wavy, liquid or turbulent distortion.** Put an `feTurbulence` right before it to give it something to warp by.

<FilterPlayground type="feDisplacementMap" />

```yaml
filters:
  - mode: svg
    type: feTurbulence
    value:
      baseFrequency: 0.02
      numOctaves: 3
  - mode: svg
    type: feDisplacementMap
    value:
      scale: 20
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value.scale` | number | `10` | How strong the distortion is |
| `value.xChannelSelector` | string | `R` | The colour channel that moves pixels across: `R`, `G`, `B` or `A` |
| `value.yChannelSelector` | string | `G` | The colour channel that moves pixels up and down |

### tint

**A flat colour wash over the blueprint, from one entry: the alert tint.** The colour's alpha sets how much of the blueprint shows through.

- It covers the blueprint's whole area, background included, not only its lines.

<FilterPlayground type="tint" />

```yaml
filters:
  - mode: svg
    type: tint
    value:
      color: alpha(var(--lcars-alert-red), 0.35)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value.color` | colour | black at 50% | The wash colour, with its alpha, such as `alpha(var(--lcars-alert-red), 0.35)` |

## Recipes

**Filter lists to copy for the usual looks.** Each is a `base_svg.filters` value; change the numbers to taste.

### Dimmed

**Lower opacity and brightness: a quieter blueprint that still shows its detail.** A good default.

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 4
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    filters:
      - type: opacity
        value: 0.5
      - type: brightness
        value: 0.8
  view_box: [180, 270, 1600, 720]
```

### Subtle

**A light fade with a slight blur and a little less colour: the detail stays, the weight goes.**

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 4
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    filters:
      - type: opacity
        value: 0.6
      - type: blur
        value: 1px
      - type: grayscale
        value: 0.2
  view_box: [180, 270, 1600, 720]
```

### Backdrop

**Strong dimming with a blur, for displays full of data where the overlays carry everything.**

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 4
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    filters:
      - type: opacity
        value: 0.3
      - type: blur
        value: 3px
      - type: brightness
        value: 0.6
  view_box: [180, 270, 1600, 720]
```

### Faded

**Less colour and contrast with a fade: a muted, minimal look.**

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 4
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    filters:
      - type: opacity
        value: 0.4
      - type: grayscale
        value: 0.5
      - type: contrast
        value: 0.7
  view_box: [180, 270, 1600, 720]
```

### Red wash

**A real red tint with the SVG `tint` filter, for alert states.** Put it in a [rule](./animations#rules) to show it only during an alert.

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 4
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    filters:
      - mode: svg
        type: tint
        value:
          color: alpha(var(--lcars-alert-red), 0.35)
  view_box: [180, 270, 1600, 720]
```

### Monochrome

**Fully grey with lower contrast, so only the overlays carry colour.**

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 4
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    filters:
      - type: opacity
        value: 0.6
      - type: grayscale
        value: 1
      - type: contrast
        value: 0.8
  view_box: [180, 270, 1600, 720]
```
