---
description: "Alert overlay position and screen effects: where the alert symbol sits, its width and height, and the blur, tint and canvas layers behind it."
---

# Position and Screen Effects

Where the alert symbol sits on the screen, how big it is, and the effects drawn over the dashboard behind it. These settings apply to `display: overlay`; the [band](./band) has its own.

## Position

**`position` places the symbol (or your content card) on the screen: in the middle, along an edge or in a corner.** A corner keeps the middle of the dashboard in view while the alert is up.

- The backdrop still covers the whole screen wherever the symbol sits, and a tap anywhere outside the symbol's box (its `width` by `height`) dismisses the alert ([Dismiss](./raising#dismiss)).

```yaml live
# A small notification in the top right corner
type: custom:lcards-alert-overlay
position: top-right
width: 380px
conditions:
  red_alert:
    content:
      type: custom:lcards-button
      preset: lozenge
      text:
        name:
          content: RED ALERT
          show: true
      style:
        card:
          color:
            background:
              default: var(--lcards-orange-dark)
```

| Value | Where |
|-------|-------|
| `center` | In the middle of the screen (the default) |
| `top`, `top-center` | Centred, at the top |
| `bottom`, `bottom-center` | Centred, at the bottom |
| `left`, `left-center`, `center-left` | Centred top to bottom, at the left edge |
| `right`, `right-center`, `center-right` | Centred top to bottom, at the right edge |
| `top-left`, `top-right`, `bottom-left`, `bottom-right` | In that corner |

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `position` | string | `center` | One of the values above. A condition can set its own |

## Size

**`width` and `height` size the symbol, or your content card, on the screen.** Percentages are of the screen, so `60%` is 60% of the screen's width.

- For the built-in symbol and other SVG component cards a width alone is enough: the height follows from the shape.
- With neither set, the symbol gets 60% of the width and 50% of the height of the screen and scales to fit inside, so it suits wide, tall and phone screens alike.
- Set a `height` for a custom content card that can't size itself from its width.

```yaml live
type: custom:lcards-alert-overlay
width: 500px # the height follows from the symbol's shape
conditions:
  black_alert:
    width: 40%
    height: 30%
```

::: details More about size
- **The default height:** `50%` applies only to the built-in symbol (or a `content` card that is itself `component: alert`) when no `width` is set either. Set a `width` without a `height`, or use another content card, and the height is `auto`: the content sizes itself.
- **Per condition:** `conditions.<key>.width` and `conditions.<key>.height` fall back to the card's values, then to these defaults.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `width` | string | `60%` | Width as a CSS length (`400px`, `50%`, `50vw`) |
| `height` | string | `50%` for the symbol with no `width`, else `auto` | Height as a CSS length. `auto`: the content sizes itself |

## layers

**`layers` sets the screen effects drawn over the dashboard behind the symbol: a filter on the dashboard, a colour over it, and an animated canvas on top.** Without `layers` the overlay shows an 8px blur and nothing else.

- There are three slots, each with its own presets: [`backdrop`](#layers-backdrop) filters the dashboard behind the overlay, [`color`](#layers-color) lays a colour over it, and [`canvas`](#layers-canvas) draws an animation above the colour.
- Set only the slots you want. Once `layers` is set, a slot you leave out stays off, so `layers` with only `color` has no blur.
- `layers: null` turns every layer off: the symbol shows over the dashboard as it is.
- A condition can change one slot and keep the others, or turn a slot off with `null`; see [Per-Condition Settings](./conditions#condition-keys).

```yaml live
type: custom:lcards-alert-overlay
dismiss_mode: reset
layers:
  # blur the dashboard
  backdrop:
    preset: blur
    amount: 12px
  # dim it with a red tint
  color:
    preset: color-tint
    color: alpha(theme:colors.alert.red, 0.35)
  # TV static on top
  canvas:
    preset: static
    opacity: 0.3
```

::: details More about layers
- **Colours:** the colour settings (`color-tint`'s `color`, and `color` on the `static` and `pixelate` canvas presets) take any LCARdS colour: `rgb()`/`rgba()`, `var(--css-variable)`, theme tokens (`theme:palette.moonlight`), CSS colour names and computed expressions (`alpha(theme:colors.ui.primary, 0.4)`). For colours that follow the alert mode use `var(--lcards-*)` or `var(--lcars-*)` variables.
- **Older configs:** a card-level `backdrop` with `blur`, `opacity` and `color` (from older versions) is still read when `layers` is not set: `blur` becomes a blur layer and `color` a `color-tint`, with `opacity` (default `0.6`) multiplied into the colour's alpha. The Alert Studio converts it to `layers` when you change a layer.
- **The band:** in `display: band` the layers are off unless you set them; see [Alert Band](./band).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `layers` | object or `null` | - | The screen effects; `null` turns them all off |
| `layers.backdrop` | object | an 8px blur when `layers` is not set | The [backdrop filter](#layers-backdrop) |
| `layers.color` | object | - | The [colour layer](#layers-color) |
| `layers.canvas` | object | - | The [canvas animation](#layers-canvas) |

### layers.backdrop

**The backdrop slot filters the dashboard behind the overlay: blur it, take the colour out, or shift its hues.** It is a CSS `backdrop-filter`, so the dashboard shows through, changed.

```yaml live
type: custom:lcards-alert-overlay
layers:
  backdrop:
    preset: grayscale
    amount: 80%
```

| Preset | What it does | Setting |
|--------|--------------|---------|
| `blur` | Blurs the dashboard | `amount`, default `8px` |
| `grayscale` | Takes out the colour | `amount`, default `100%` |
| `saturate` | Makes colours stronger | `amount`, default `200%` |
| `contrast` | Raises the contrast | `amount`, default `200%` |
| `hue-rotate` | Shifts every hue round the colour wheel | `angle`, default `180deg` |

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `preset` | string | required | One of the presets above |
| `amount` | string | by preset | CSS value for `blur` (`4px` subtle, `20px` heavy), `grayscale`, `saturate` and `contrast` |
| `angle` | string | `180deg` | `hue-rotate` only: the angle (`90deg`, `270deg`) |

### layers.color

**The colour slot lays a colour over the dashboard, above the backdrop filter: a flat tint, or a vignette that darkens the edges.**

```yaml live
type: custom:lcards-alert-overlay
layers:
  color:
    preset: vignette
    opacity: 0.8
```

| Preset | What it does |
|--------|--------------|
| `color-tint` | A flat colour over the whole screen; use a colour with alpha so the dashboard shows through |
| `vignette` | A dark fade from clear in the middle to dark at the edges |

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `preset` | string | required | `color-tint` or `vignette` |
| `color` | colour | `rgba(0,0,0,0.5)` | `color-tint` only: the tint, any colour (alpha sets how much shows through) |
| `opacity` | number | `0.7` | `vignette` only: how dark the edges get, 0 to 1 |

### layers.canvas

**The canvas slot draws an animation over the dashboard, above the colour layer: TV static, a mosaic, glitch bands or scanlines.**

```yaml live
type: custom:lcards-alert-overlay
layers:
  canvas:
    preset: scanlines
    lineHeight: 3
    opacity: 0.3
    scroll: 2
```

| Preset | What it does | Settings |
|--------|--------------|----------|
| `static` | TV static noise | `opacity`, `scale`, `color`, `tintStrength` |
| `pixelate` | Mosaic blocks | `pixelSize`, `opacity`, `variance`, `baseLight`, `color`, `tintStrength` |
| `glitch` | Bands shifted sideways | `intensity`, `maxShift`, `bandHeight`, `opacity`, `fps` |
| `scanlines` | CRT lines across the screen | `lineHeight`, `opacity`, `scroll` |

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `preset` | string | required | One of the presets above |
| `opacity` | number | `0.55` static, `0.75` pixelate, `0.85` glitch, `0.25` scanlines | How strong the effect is, 0 to 1 |
| `scale` | number | `4` | `static`: grain size, 1 to 16; larger is chunkier |
| `pixelSize` | number | `8` | `pixelate`: block size in px, 2 to 64 |
| `variance` | number | `0.35` | `pixelate`: brightness difference between blocks, 0 to 1 (`0` is even) |
| `baseLight` | number | `80` | `pixelate`: base grey level, 0 (black) to 255 (white) |
| `color` | colour | `#ffffff` static, `#8c9aa6` pixelate | `static` and `pixelate`: the colour blended in, by `tintStrength` |
| `tintStrength` | number | `0` | `static` and `pixelate`: how far to blend toward `color`, 0 to 1 (`0` is white noise or a grey mosaic) |
| `intensity` | number | `0.08` | `glitch`: share of lines shifted each frame, 0.01 to 0.5 |
| `maxShift` | number | `40` | `glitch`: largest sideways shift in px |
| `bandHeight` | number | `4` | `glitch`: height of each band in px |
| `fps` | number | `20` | `glitch`: frames per second, 1 to 60 |
| `lineHeight` | number | `4` | `scanlines`: height of each line in px, 1 to 20 |
| `scroll` | number | `0` | `scanlines`: scroll speed, 0 to 10 (`0` is still) |
