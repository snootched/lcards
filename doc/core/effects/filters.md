---
description: "Card filters: stack CSS filters (blur, brightness, drop shadow ...) and SVG filter primitives (tint, colour matrix, turbulence ...) on a button, elbow, data grid or MSD blueprint."
moved_anchors:
  basic-usage: /core/effects/filters#filters
  filter-object-structure: /core/effects/filters#filters
  css-filters-mode-css-or-omitted: /core/effects/filters#css-filters
  drop-shadow-value: /core/effects/filters#drop-shadow
  stacked-css-example: /core/effects/filters#css-filters
  svg-filters-mode-svg: /core/effects/filters#svg-filters
  svg-examples: /core/effects/filters#svg-filters
  live-demos: /core/effects/filters#css-filters
  blur: /core/effects/filters#css-filters
  brightness: /core/effects/filters#css-filters
  contrast: /core/effects/filters#css-filters
  saturate: /core/effects/filters#css-filters
  hue-rotate: /core/effects/filters#css-filters
  grayscale: /core/effects/filters#css-filters
  sepia: /core/effects/filters#css-filters
  invert: /core/effects/filters#css-filters
  opacity: /core/effects/filters#css-filters
  fegaussianblur: /core/effects/filters#svg-value-keys
  fecolormatrix: /core/effects/filters#svg-value-keys
  feoffset: /core/effects/filters#svg-value-keys
  feblend: /core/effects/filters#svg-value-keys
  fecomposite: /core/effects/filters#svg-value-keys
  femorphology: /core/effects/filters#svg-value-keys
  feturbulence: /core/effects/filters#svg-value-keys
  fedisplacementmap: /core/effects/filters#svg-value-keys
  tint: /core/effects/filters#svg-value-keys
---

# Filters

**Filters change how a whole card looks: blur it, brighten it, take the colour out, tint it, give it a shadow or warp it.** Stack several in a list to combine them.

- `filters` works on the [button](../../cards/button/) and [elbow](../../cards/elbow/) cards, and on the [data grid](../../cards/data-grid/) with CSS filters only. The MSD card has the same filters for its blueprint as `base_svg.filters` ([Base SVG Filters](../../cards/msd/base-svg-filters)).
- There are two kinds: the browser's CSS filters, which most looks need, and SVG filter primitives for what CSS can't do, such as a real colour tint or a distortion.

## filters

**`filters` is a list of filters applied to the card, one after another.** Each entry names a `type` and gives its `value`; SVG filters also need `mode: svg`.

- The CSS filters run first, in list order, then the SVG filters, chained in list order. Where you put an SVG entry among the CSS ones makes no difference.
- On the button and elbow the filters apply to the card's drawing (its SVG), so the shape, its text and its icon change together.
- An SVG type written without `mode: svg` is read as a CSS filter, which doesn't exist, so it is skipped (with a warning in the browser console).

```yaml live controls
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
# softened and brighter
filters:
  - type: blur
    value: 1px
  - type: brightness
    value: 1.3
```

::: details More about filters
- **Live values:** filter values are fixed; templates and entity bindings don't work in them.
- **Data grid:** the grid takes CSS filters only. SVG filters need an SVG to attach to, so the grid skips them and logs a warning.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `filters` | list | - | The filters, applied in order |
| `filters[].type` | string | required | The filter: one of the [CSS filters](#css-filters) or [SVG filters](#svg-filters) |
| `filters[].value` | number / string / object | per type | A number or string for a CSS filter, an object of [value keys](#svg-value-keys) for an SVG filter |
| `filters[].mode` | string | `css` | `css` or `svg`. Set `svg` for the SVG filters |

## CSS Filters

**The browser's own CSS filters: blur, brighten, change the contrast or saturation, shift the hues, fade or turn the card grey.** Leave out `mode` (or write `mode: css`); most take one number as `value`.

- `blur` takes a length and `hue-rotate` an angle, as strings with their unit (`"4px"`, `"90deg"`).
- Every CSS entry needs a valid `value`. One without a `value`, or a `blur` without `px`, makes the browser drop the CSS filters of the whole list, not just that entry.
- Each filter has a playground under the example: move the sliders to see it on a sample shape, and copy the YAML it prints.

```yaml live controls
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
# faded colours, a little darker, slightly soft
filters:
  - type: saturate
    value: 0.4
  - type: brightness
    value: 0.85
  - type: blur
    value: 1px
```

::: details Try each CSS filter
The playgrounds run the real filter code on a sample shape.

**`blur`**

<FilterPlayground type="blur" />

**`brightness`**

<FilterPlayground type="brightness" />

**`contrast`**

<FilterPlayground type="contrast" />

**`saturate`**

<FilterPlayground type="saturate" />

**`hue-rotate`**

<FilterPlayground type="hue-rotate" />

**`grayscale`**

<FilterPlayground type="grayscale" />

**`sepia`**

<FilterPlayground type="sepia" />

**`invert`**

<FilterPlayground type="invert" />

**`opacity`**

<FilterPlayground type="opacity" />

**`drop-shadow`**

<FilterPlayground type="drop-shadow" />
:::

| `type` | `value` | Example | Effect |
|--------|---------|---------|--------|
| `blur` | string, `px` | `"4px"` | Gaussian blur; `"0px"` is none |
| `brightness` | number | `1.4` | `0` is black, `1` unchanged, above `1` brighter |
| `contrast` | number | `1.2` | `0` is grey, `1` unchanged, above `1` more contrast |
| `saturate` | number | `0.5` | `0` is grey, `1` unchanged, above `1` stronger colour |
| `hue-rotate` | string, `deg` | `"90deg"` | Turns every hue round the colour wheel; `"0deg"` is none |
| `grayscale` | number, 0 to 1 | `1` | `1` is fully grey, `0` none |
| `sepia` | number, 0 to 1 | `0.6` | `1` is full sepia, `0` none |
| `invert` | number, 0 to 1 | `1` | `1` inverts the colours fully, `0` none |
| `opacity` | number, 0 to 1 | `0.5` | How see-through the card is; `1` is solid. For a see-through background only, use the background colour's alpha (`style.card.color.background`) |
| `drop-shadow` | object | see [below](#drop-shadow) | A shadow outside the shape |

### drop-shadow

**A shadow behind the card's shape, for depth or a glow.** The shadow follows the drawn shape, not the card's box.

- `x` and `y` are numbers in px; `blur` is a length string such as `"6px"`.
- The colour goes straight into CSS, so `var(--lcars-*)` variables and CSS colours work, but `theme:` tokens and `alpha()` don't.

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
filters:
  - type: drop-shadow
    value:
      x: 2
      "y": 2
      blur: 6px
      color: var(--lcars-orange)
```

::: details More about drop-shadow
- **Short form:** `value` can also be the CSS shadow as one string, such as `"2px 2px 6px black"`. The card reads it, but the config checker and the editor expect the object.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `value.x` | number | `0` | Offset to the right, px (negative is left) |
| `value.y` | number | `0` | Offset down, px (negative is up) |
| `value.blur` | string | `0px` | Blur radius, such as `"6px"` |
| `value.color` | colour | black | Shadow colour: a CSS colour or `var(--lcars-*)` |

## SVG Filters

**SVG filter primitives, for effects the CSS filters can't give: a real colour tint, colour matrices, glows, outlines and distortion.** Each entry needs `mode: svg`, and its `value` is an object of [value keys](#svg-value-keys).

- They chain: each primitive works on the result of the one before it in the list, so a blur followed by a blend makes a glow.
- `tint` is the friendly one: a single entry for a colour wash. The others are the browser's SVG primitives, named as in SVG (`feGaussianBlur` ...).
- The filter area reaches half the card's size past each edge, so a glow, shadow or warp has room outside the shape.

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
# a soft glow: blur the card, then blend the blur back over it
filters:
  - mode: svg
    type: feGaussianBlur
    value:
      stdDeviation: 4
  - mode: svg
    type: feBlend
    value:
      mode: screen
```

::: details Try each SVG filter
The playgrounds run the real filter code on a sample shape.

**`feGaussianBlur`**

<FilterPlayground type="feGaussianBlur" />

**`feColorMatrix`**

<FilterPlayground type="feColorMatrix" />

**`feOffset`**

<FilterPlayground type="feOffset" />

**`feBlend`**

<FilterPlayground type="feBlend" />

**`feComposite`**

<FilterPlayground type="feComposite" />

**`feMorphology`**

<FilterPlayground type="feMorphology" />

**`feTurbulence`**

<FilterPlayground type="feTurbulence" />

**`feDisplacementMap`**

<FilterPlayground type="feDisplacementMap" />

On its own `feDisplacementMap` has nothing to warp by, so this playground may look unchanged. Chain it after `feTurbulence` in a real config to see the distortion.

**`tint`**

<FilterPlayground type="tint" />
:::

| `type` | Value keys | Effect |
|--------|------------|--------|
| `feGaussianBlur` | `stdDeviation` | Gaussian blur that chains with the other SVG filters; smoother than the CSS blur |
| `feColorMatrix` | `type`, `values` | Colour changes: saturation, hue turn, luminance to alpha or a custom matrix |
| `feOffset` | `dx`, `dy` | Shifts the result; with a blur, makes a shadow |
| `feBlend` | `mode`, `in2` | Blends the result with the card (or another input) in a CSS blend mode |
| `feComposite` | `operator`, `k1` to `k4`, `in2` | Combines the result with the card (or another input) |
| `feMorphology` | `operator`, `radius` | Thins (`erode`) or thickens (`dilate`) the shapes |
| `feTurbulence` | `type`, `baseFrequency`, `numOctaves`, `seed` | Makes a noise texture, usually for `feDisplacementMap` |
| `feDisplacementMap` | `scale`, `xChannelSelector`, `yChannelSelector`, `in`, `in2` | Warps the card by the colours of the result before it |
| `tint` | `color` | A flat colour wash over the card, such as an alert tint |

### SVG Value Keys

**The keys each SVG filter takes in its `value`; a key you leave out takes the default in the table.** Inputs name what a primitive works on: `SourceGraphic` (the card as drawn), `SourceAlpha` (its shape only), or the result of the primitive before.

- `feBlend` and `feComposite` combine the previous result (on top) with `in2`, which is the card itself unless you set it.
- `feDisplacementMap` warps `in` (the card) by `in2` (the previous result, such as `feTurbulence` noise). `feTurbulence` makes new content and ignores what came before it.
- `tint` starts from a flat colour and lays it over the card, so SVG filters listed before a `tint` have no effect. Its wash covers the whole filter area, background included, not only the shape.

```yaml live
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
# noise, then warp the card by it
filters:
  - mode: svg
    type: feTurbulence
    value:
      baseFrequency: 0.04
      numOctaves: 2
      seed: 5
  - mode: svg
    type: feDisplacementMap
    value:
      scale: 8
      xChannelSelector: R
      yChannelSelector: G
```

::: details More about the SVG value keys
- **Colour matrix values:** with `type: saturate`, `values` is a multiplier (`0` grey, `1` unchanged); with `type: hueRotate`, an angle in degrees; with `type: matrix`, 20 numbers (a 4x5 matrix) as a list or a space-separated string. `luminanceToAlpha` takes no `values`.
- **Arithmetic composite:** with `operator: arithmetic`, the result is `k1*i1*i2 + k2*i1 + k3*i2 + k4`, where `i1` is the previous result and `i2` is `in2`.
- **Tint colour:** `tint`'s `color` takes any LCARdS colour, `theme:` tokens and `alpha()` included; its alpha sets how much of the card shows through.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `stdDeviation` | number | `0` | `feGaussianBlur`: amount of blur |
| `type` | string | `saturate` | `feColorMatrix`: `saturate`, `hueRotate`, `luminanceToAlpha` or `matrix` |
| `values` | number / string / list | `1` saturate, `0` hueRotate | `feColorMatrix`: meaning depends on `type`; see the details above |
| `dx` | number | `0` | `feOffset`: shift right, px (negative is left) |
| `dy` | number | `0` | `feOffset`: shift down, px (negative is up) |
| `mode` | string | `normal` | `feBlend`: `normal`, `multiply`, `screen`, `darken`, `lighten`, `overlay`, `color-dodge`, `color-burn`, `hard-light`, `soft-light`, `difference`, `exclusion`, `hue`, `saturation`, `color` or `luminosity` |
| `operator` | string | `over` | `feComposite`: `over`, `in`, `out`, `atop`, `xor` or `arithmetic` |
| `k1` | number | `0` | `feComposite`: arithmetic coefficient, only with `operator: arithmetic` |
| `k2` | number | `0` | `feComposite`: arithmetic coefficient, only with `operator: arithmetic` |
| `k3` | number | `0` | `feComposite`: arithmetic coefficient, only with `operator: arithmetic` |
| `k4` | number | `0` | `feComposite`: arithmetic coefficient, only with `operator: arithmetic` |
| `in2` | string | `SourceGraphic` | `feBlend`, `feComposite`: the second input |
| `operator` | string | `erode` | `feMorphology`: `erode` (thinner) or `dilate` (thicker) |
| `radius` | number | `1` | `feMorphology`: how far to thin or thicken |
| `type` | string | `turbulence` | `feTurbulence`: `turbulence` (cloudy) or `fractalNoise` (softer) |
| `baseFrequency` | number | `0.05` | `feTurbulence`: `0` to `1`; lower is larger features |
| `numOctaves` | integer | `1` | `feTurbulence`: `1` to `10` layers of detail |
| `seed` | number | `0` | `feTurbulence`: change it for a different pattern |
| `scale` | number | `10` | `feDisplacementMap`: how strong the distortion is |
| `xChannelSelector` | string | `R` | `feDisplacementMap`: the channel that moves pixels across: `R`, `G`, `B` or `A` |
| `yChannelSelector` | string | `G` | `feDisplacementMap`: the channel that moves pixels up and down |
| `in` | string | `SourceGraphic` | `feDisplacementMap`: the image it warps |
| `in2` | string | the previous result | `feDisplacementMap`: the map it warps by |
| `color` | colour | `rgba(0,0,0,0.5)` | `tint`: the wash colour, with its alpha |

## Mixing CSS and SVG Filters

**CSS and SVG filters can share one list.** The CSS filters are applied first, in their order, then the SVG filters as one chain, whatever order the entries are in.

```yaml live controls
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    show: true
filters:
  # CSS
  - type: brightness
    value: 1.2
  # SVG
  - mode: svg
    type: feColorMatrix
    value:
      type: saturate
      values: 0.6
```

## Related

- [Base SVG Filters](../../cards/msd/base-svg-filters): the same filters on an MSD card's blueprint, with recipes and rules that change them on a condition
- [Animations](../animations.md): animate a card over time; the `pulse` preset animates a brightness filter
- [Styles](../styles.md): card background and border styles
- [Background Animations](background-animations.md): canvas-based animated backgrounds (separate from filters)
