# Filters

LCARdS cards support stackable CSS and SVG visual filters applied directly to the card's rendered output. Combine multiple filters in any order to create blur, glow, colour shift, grain, or displacement effects.

---

## Basic Usage

`filters` is a top-level card property. It takes an array of filter objects:

```yaml
type: custom:lcards-button
entity: light.living_room
filters:
  - type: blur
    value: 3px
  - type: brightness
    value: 1.3
```

Filters are applied in order — first filter is innermost.

---

## Filter Object Structure

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | — | Filter type (required) — see tables below |
| `value` | string / number / object | — | Filter value — format depends on type |
| `mode` | string | `css` | `css` for CSS filter functions, `svg` for SVG filter primitives |

---

## CSS Filters (`mode: css` or omitted)

CSS filters map to standard CSS `filter` functions. They are simple, performant, and suitable for most visual effects.

| `type` | `value` format | Example | Effect |
|--------|---------------|---------|--------|
| `blur` | `"Npx"` | `"4px"` | Gaussian blur |
| `brightness` | number (multiplier) | `1.4` | Increase / decrease brightness |
| `contrast` | number (multiplier) | `1.2` | Increase / decrease contrast |
| `saturate` | number (multiplier) | `0.5` | Increase / decrease colour saturation |
| `hue-rotate` | `"Ndeg"` | `"90deg"` | Rotate all hues by N degrees |
| `grayscale` | number (0–1) | `1` | Full grayscale at `1`, none at `0` |
| `sepia` | number (0–1) | `0.6` | Sepia tint |
| `invert` | number (0–1) | `1` | Full colour inversion at `1` |
| `opacity` | number (0–1) | `0.5` | Transparency (prefer `style.card.color.background` alpha for most uses) |
| `drop-shadow` | object or string | see below | Drop shadow _outside_ the shape |

### `drop-shadow` value

```yaml
filters:
  - type: drop-shadow
    value:
      x: 2px
      y: 2px
      blur: 6px
      color: "rgba(255, 100, 0, 0.6)"
```

Or as a shorthand string:

```yaml
filters:
  - type: drop-shadow
    value: "2px 2px 6px rgba(255, 100, 0, 0.6)"
```

### Stacked CSS example

```yaml
filters:
  - type: saturate
    value: 0.4
  - type: brightness
    value: 0.85
  - type: blur
    value: 1px
```

---

## SVG Filters (`mode: svg`)

SVG filters use the browser's SVG filter pipeline and support compositing, displacement, turbulence, and colour matrix operations. More powerful than CSS filters — use when CSS isn't sufficient.

Multiple SVG filter primitives in the same `filters:` array are chained in sequence (output of each becomes input to the next).

| `type` | `value` fields | Effect |
|--------|---------------|--------|
| `feGaussianBlur` | `stdDeviation` (number) | Gaussian blur (SVG quality) |
| `feColorMatrix` | `type` (`saturate` / `hueRotate` / `matrix` / `luminanceToAlpha`), `values` | Colour transformations |
| `feOffset` | `dx`, `dy` (numbers) | Shift the image — use before `feBlend` for shadow effects |
| `feBlend` | `mode` (`normal` / `multiply` / `screen` / `overlay` / etc.), `in2` | Blend two layers |
| `feComposite` | `operator` (`over` / `in` / `out` / `arithmetic`), plus `k1–k4` for arithmetic | Composite two layers |
| `feMorphology` | `operator` (`erode` / `dilate`), `radius` | Shrink or grow shapes |
| `feTurbulence` | `type` (`turbulence` / `fractalNoise`), `baseFrequency`, `numOctaves`, `seed` | Generate noise texture |
| `feDisplacementMap` | `scale`, `xChannelSelector`, `yChannelSelector`, `in2` | Distort using a displacement map |
| `tint` | `color` | Flat colour wash composited over the content (e.g. an alert tint). Expands internally to a chained `feFlood` + `feComposite` pair. |

### SVG examples

```yaml alternatives
# Subtle colour shift
filters:
  - mode: svg
    type: feColorMatrix
    value:
      type: hueRotate
      values: 45

# Noise-based distortion (combine with feDisplacementMap)
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

---

## Mixing CSS and SVG Filters

CSS and SVG filters in the same `filters:` array are applied separately and composited together. CSS filters are collected and applied as a single CSS `filter` property; SVG filters are assembled into an inline `<filter>` element.

```yaml
filters:
  - type: brightness       # CSS
    value: 1.2
  - mode: svg              # SVG
    type: feColorMatrix
    value:
      type: saturate
      values: 0.6
```

---

## Live Demos

Every filter type below runs live in your browser — the actual `applyBaseSvgFilters()` source, not a hand-copied approximation — with tweakable controls and a copy-pasteable YAML snippet.

### CSS Filters

#### `blur`
<FilterPlayground type="blur" />

#### `brightness`
<FilterPlayground type="brightness" />

#### `contrast`
<FilterPlayground type="contrast" />

#### `saturate`
<FilterPlayground type="saturate" />

#### `hue-rotate`
<FilterPlayground type="hue-rotate" />

#### `grayscale`
<FilterPlayground type="grayscale" />

#### `sepia`
<FilterPlayground type="sepia" />

#### `invert`
<FilterPlayground type="invert" />

#### `opacity`
<FilterPlayground type="opacity" />

#### `drop-shadow`
<FilterPlayground type="drop-shadow" />

### SVG Filters

#### `feGaussianBlur`
<FilterPlayground type="feGaussianBlur" />

#### `feColorMatrix`
<FilterPlayground type="feColorMatrix" />

#### `feOffset`
<FilterPlayground type="feOffset" />

#### `feBlend`
<FilterPlayground type="feBlend" />

#### `feComposite`
<FilterPlayground type="feComposite" />

#### `feMorphology`
<FilterPlayground type="feMorphology" />

#### `feTurbulence`
<FilterPlayground type="feTurbulence" />

#### `feDisplacementMap`
<FilterPlayground type="feDisplacementMap" />

> `feDisplacementMap` distorts using a displacement map from another source — on its own (without a `feTurbulence` primitive feeding it real noise) this demo has nothing to displace *by*, so it may look like a no-op. Chain it after `feTurbulence` in a real config to see the distortion.

#### `tint`
<FilterPlayground type="tint" />

---

## Related

- [Animations](../animations.md) — animate CSS filter values over time using the `pulse` or custom anime.js presets
- [Styles](../styles.md) — card background and border styles
- [Background Animations](background-animations.md) — canvas-based animated backgrounds (separate from filters)
