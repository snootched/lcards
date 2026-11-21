---
description: "Full-screen effects over every dashboard: backdrop blur and colour filters, tints and vignettes, TV static, pixelation, glitches, scanlines and Borg assimilation, fired from an automation or the browser console."
---

# Screen Effects

**Screen effects cover the whole browser window, above Home Assistant and every LCARdS card: blur, colour tints, TV static, pixelation, glitches, CRT scanlines and more.** Use them for alert states, dramatic transitions and feedback from an automation.

- They are fired by the `lcards.trigger_effect` action (from an automation, a script or **Developer tools > Actions**) or from the browser console, so the examples on this page are action data and console code rather than live cards.
- The [alert overlay card](../../cards/alert-overlay/overlay#layers) uses the same presets in its `layers`; its page shows them live on the Alert Studio's mock screen.
- Effects never catch clicks or taps: the dashboard under them keeps working.

## Quick Start

**Fire an effect with the `lcards.trigger_effect` action, or try one from the browser console.** Each effect goes in one of three slots (`backdrop`, `color`, `canvas`), with a `preset` and its settings.

- Run the action from an automation or script, or from **Developer tools > Actions** to try it.
- Without `duration` an effect stays until `lcards.clear_effect` (or the next `lcards.trigger_effect`) removes it.

```yaml
# In an automation or script: glitch every LCARdS browser for 1.5 seconds
action: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: glitch
  duration: 1500
```

```js
// In the browser console: TV static for 2 seconds, then gone
window.lcards.screenEffect.play('static', { duration: 2000 })

// Effects that stay until cleared
window.lcards.screenEffect.applySlot('backdrop', 'blur', { amount: '12px' })
window.lcards.screenEffect.applySlot('color', 'color-tint', { color: 'alpha(var(--lcars-alert-red), 0.35)' })
window.lcards.screenEffect.clear()
```

## Preset Reference

**Every preset belongs to one of three slots, and each slot shows one preset at a time.** The slots stack: the backdrop filter changes the dashboard itself, the canvas animation is drawn over it, and the colour layer goes on top.

- Put each preset in its own slot (`blur` in `backdrop`, `static` in `canvas` ...); the [Slots](#slots) table lists which goes where.
- Settings you leave out take the defaults in each preset's table. Setting names are written as in the tables (`tintStrength`, `pixelSize`).
- The alert overlay below uses all three slots; its own page has the [layers](../../cards/alert-overlay/overlay#layers) in full.

```yaml live
type: custom:lcards-alert-overlay
layers:
  # blur the dashboard
  backdrop:
    preset: blur
    amount: 12px
  # CRT lines over it
  canvas:
    preset: scanlines
    opacity: 0.3
  # a red tint on top
  color:
    preset: color-tint
    color: alpha(var(--lcars-alert-red), 0.3)
```

::: details More about presets
- **Colours:** colour settings (`color-tint`'s `color`, `color` on `static` and `pixelate`, `color` and `glowColor` on `borg-assimilation`) take any LCARdS colour: CSS colours, `var(--lcars-*)` and `var(--lcards-*)` variables, `theme:` tokens and computed colours such as `alpha(var(--lcars-alert-red), 0.4)`. They are read when the effect starts, so a running effect keeps its colour if the alert mode changes.
- **Reduced motion:** with reduced motion on, `static`, `pixelate` and `glitch` hold a single frame, `scanlines` stop scrolling, and `borg-assimilation` shows its finished picture without flicker or corruption.
- **Your own presets:** the console API can add presets at runtime; see [Console API](#console-api).
:::

### Backdrop presets

**Backdrop presets filter the dashboard behind the effect layer with a CSS `backdrop-filter`: the dashboard still shows through, changed.** They work best on dashboards with plenty on them.

#### `blur`

**Blurs everything behind the effect layer.**

```yaml
action: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: blur
      amount: 12px
  duration: 3000
```

| Key | Type | Default | Description |
|---|---|---|---|
| `amount` | string | `8px` | CSS blur radius: `4px` subtle, `20px` heavy |

#### `saturate`

**Makes the colours behind the effect layer stronger.**

```yaml
action: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: saturate
      amount: 300%
  duration: 3000
```

| Key | Type | Default | Description |
|---|---|---|---|
| `amount` | string | `200%` | CSS saturation, such as `150%` or `400%` |

#### `grayscale`

**Takes the colour out of the screen behind the effect layer.**

```yaml
action: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: grayscale
      amount: 50%
  duration: 3000
```

| Key | Type | Default | Description |
|---|---|---|---|
| `amount` | string | `100%` | CSS grayscale amount: `100%` is black and white, `50%` partly grey |

#### `contrast`

**Raises (or lowers) the contrast of the screen behind the effect layer.**

```yaml
action: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: contrast
      amount: 150%
  duration: 3000
```

| Key | Type | Default | Description |
|---|---|---|---|
| `amount` | string | `200%` | CSS contrast amount, such as `150%` or `300%` |

#### `hue-rotate`

**Turns every hue on screen round the colour wheel.**

```yaml
action: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: hue-rotate
      angle: 90deg
  duration: 3000
```

| Key | Type | Default | Description |
|---|---|---|---|
| `angle` | string | `180deg` | CSS hue rotation, such as `90deg` or `-45deg` |

### Color tint presets

**Colour presets lay a colour over the whole screen, above the canvas animation.** The colour layer is a plain element with a CSS background.

#### `color-tint`

**A see-through colour over the entire screen.** Its alpha sets how much of the dashboard shows through.

```yaml
action: lcards.trigger_effect
data:
  layers:
    color:
      preset: color-tint
      color: alpha(var(--lcars-alert-red), 0.4)
  duration: 2000
```

| Key | Type | Default | Description |
|---|---|---|---|
| `color` | colour | `rgba(0,0,0,0.5)` | The tint, any LCARdS colour; use one with alpha |

#### `vignette`

**Darkens the edges of the screen with a radial fade, like a film vignette.** The middle stays clear.

```yaml
action: lcards.trigger_effect
data:
  layers:
    color:
      preset: vignette
      opacity: 0.8
  duration: 3000
```

| Key | Type | Default | Description |
|---|---|---|---|
| `opacity` | number | `0.7` | How dark the edges get, 0 to 1 |

### Canvas presets

**Canvas presets draw an animation over the whole screen.** `static`, `pixelate` and `glitch` blend into the dashboard with a CSS blend mode, so the content shows through; `scanlines` draws see-through dark lines.

::: info Canvas and screen content
For browser security reasons, canvas effects can't read the dashboard's pixels; they draw their own textures over it. The result is an obscuring or distorting layer over the real content, not a filter of it.
:::

#### `static`

**TV static: chunky random noise over the screen.** The noise is drawn small and scaled up with hard pixel edges, and blends in with `mix-blend-mode: overlay`.

```yaml
action: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: static
      scale: 6
      opacity: 0.7
  duration: 800
```

| Key | Type | Default | Description |
|---|---|---|---|
| `opacity` | number | `0.55` | Strength of the whole effect, 0 to 1 |
| `scale` | number | `4` | Grain size: `2` is fine, `8` very coarse |
| `color` | colour | `#ffffff` | Colour blended into the noise, by `tintStrength` |
| `tintStrength` | number | `0` | 0 to 1 blend toward `color`: `0` is pure noise, `1` solid colour |

#### `pixelate`

**A mosaic of small dark blocks with slight differences in lightness, like a low-resolution, degraded signal.** It blends with `mix-blend-mode: multiply`, so the blocks darken the content, and redraws about 8 times a second.

```yaml
action: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: pixelate
      pixelSize: 12
      opacity: 0.6
  duration: 2000
```

| Key | Type | Default | Description |
|---|---|---|---|
| `pixelSize` | number | `8` | Block size in px; larger is chunkier |
| `opacity` | number | `0.75` | Strength of the whole effect, 0 to 1 |
| `variance` | number | `0.35` | Lightness difference between blocks, 0 to 1: `0` is even, `1` the most contrast |
| `baseLight` | number | `80` | Base grey of the blocks, 0 (black) to 255 (white); lower is darker |
| `color` | colour | `#8c9aa6` | Colour blended into each block, by `tintStrength` |
| `tintStrength` | number | `0` | 0 to 1 blend toward `color`: `0` is a neutral grey mosaic, `1` solid colour blocks |

#### `glitch`

**Thin horizontal bands shifted sideways, with red and cyan fringes at their edges: data corruption.** Only a small share of the rows glitch in each frame; it blends with `mix-blend-mode: overlay`.

```yaml
action: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: glitch
      intensity: 0.12
      maxShift: 60
  duration: 1000
```

| Key | Type | Default | Description |
|---|---|---|---|
| `intensity` | number | `0.08` | Share of the bands glitched in each frame, 0 to 1. Keep it low (0.05–0.15) for a subtle effect |
| `maxShift` | number | `40` | Largest sideways shift, px |
| `bandHeight` | number | `4` | Height of each band, px |
| `opacity` | number | `0.85` | Strength of the whole effect, 0 to 1 |
| `fps` | number | `20` | Frames per second |

#### `scanlines`

**CRT-style horizontal lines across the screen, still or scrolling down.**

```yaml
action: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: scanlines
      lineHeight: 3
      opacity: 0.35
      scroll: 40
```

| Key | Type | Default | Description |
|---|---|---|---|
| `lineHeight` | number | `4` | Height of each line, px; the gap between lines is the same |
| `opacity` | number | `0.25` | Darkness of the lines, 0 to 1 |
| `scroll` | number | `0` | Scroll speed in px per second: `0` is still, more scrolls down |

#### `borg-assimilation`

**Green tendrils grow across the screen from several injection sites while an assimilation front spreads from them and overruns the screen with Borg circuitry; a Borg cube emerges in the middle and bursts of signal corruption tear the picture.** This is the effect behind [Borg Assimilation](../borg.md), and it can be fired on its own.

- It runs on WebGL in a background worker. `renderer: canvas` plays the classic intro instead (tendrils with nano-probe particles, drawn with Canvas2D), and browsers without WebGL2 get the classic one whatever `renderer` says.
- Fired on its own it stays until it is cleared, or until `duration` runs out.

```yaml
action: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: borg-assimilation
      siteCount: 5
      color: var(--lcars-martian)
```

::: details More about borg-assimilation
- **Browser support:** the effect needs a browser with OffscreenCanvas and web workers; elsewhere it is skipped and nothing shows.
- **Limits:** on WebGL, `siteCount`, `tendrilsPerSite`, `tendrilLength` and `particleCount` are held to the ranges in the table.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `siteCount` | number | `7` | Number of injection sites, 1 to 20 |
| `tendrilsPerSite` | number | `8` | Tendrils grown from each site, 1 to 24 |
| `tendrilLength` | number | `600` | Longest tendril reach in px, 100 to 1200 |
| `particleCount` | number | `2` | Particles travelling each tendril, 0 to 6; `0` turns them off |
| `color` | colour | `#00cc44` | Tendril, branch and site colour |
| `glowColor` | colour | `#00ff66` | Glow at each site and round the particles |
| `renderer` | string | `auto` | `auto` or `webgl`: the WebGL intro where the browser supports it; `canvas`: the classic intro |
| `cube` | boolean | `true` | WebGL: the Borg cube in the middle |
| `cubeStyle` | string | `detailed` | WebGL: `detailed` (solid cube with machinery, rail lattice, pulsing glows and a halo) or `classic` (wireframe) |
| `corruption` | number | `0.5` | WebGL: signal corruption strength, 0 to 1; `0` turns it off |
| `overrun` | number | `0.65` | WebGL: how dark the screen gets behind the assimilation front, 0 to 1 |
| `seed` | number | - | WebGL: the same layout every time |

## Home Assistant Service

**Two actions fire and clear screen effects from automations and scripts, on every LCARdS browser or only some.** They need the LCARdS integration, and they reach the browsers that have Home Assistant open.

### `lcards.trigger_effect`

**Plays one or more screen effects, one per slot.** Give each slot you want a `preset` and its settings.

- A slot you leave out keeps what it shows, so a blur stays while a later call adds static. Set a slot to `null` to clear it.
- `duration` clears the slots that call set after that many milliseconds; each slot keeps its own timer, so a later effect is never cut short. Without it the effects stay until `lcards.clear_effect` or a later call replaces them.
- Without a target the effects play on every browser. With targets, a browser plays them when it matches any of the device or user targets; a target that matches nobody fails the action. See [Targeting](../../configuration/ha-actions#targeting).
- Find this browser's device and user ids in the browser console with `window.lcards.targeting.getMyIds()`.

```yaml
# Full red alert: blur, red tint and TV static, cleared after 5 seconds
action: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: blur
      amount: 12px
    color:
      preset: color-tint
      color: alpha(var(--lcars-alert-red), 0.35)
    canvas:
      preset: static
      opacity: 0.3
  duration: 5000
```

::: details More examples
```yaml
# A blur on one user's browsers, until lcards.clear_effect
action: lcards.trigger_effect
data:
  layers:
    backdrop:
      preset: blur
      amount: 16px
  target_user_ids:
    - a1b2c3d4e5f6
```

```yaml
# A vignette on one browser, by its device id
action: lcards.trigger_effect
data:
  layers:
    color:
      preset: vignette
      opacity: 0.8
  duration: 3000
  target_device_ids:
    - abc123def456
```

```yaml
# The kitchen tablet, by the device name set in the LCARdS config panel
action: lcards.trigger_effect
data:
  layers:
    canvas:
      preset: glitch
      intensity: 0.15
  duration: 1200
  target_device_names:
    - Kitchen tablet
```
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `layers` | object | required | The effects, one entry per slot |
| `layers.backdrop` | object | - | A [backdrop preset](#backdrop-presets) and its settings |
| `layers.color` | object | - | A [colour preset](#color-tint-presets) and its settings |
| `layers.canvas` | object | - | A [canvas preset](#canvas-presets) and its settings |
| `layers.<slot>.preset` | string | required | The preset for that slot |
| `duration` | number | - | Clear every slot after this many ms, at least `100`. Without it the effects stay |
| `target_device_ids` | list | - | Only these browsers, by LCARdS device id |
| `target_device_names` | list | - | Only these browsers, by the device name set in LCARdS (any case; a name shared by several devices reaches all of them) |
| `target_user_ids` | list | - | Only these Home Assistant users, by user id |
| `target_user_names` | list | - | Only these Home Assistant users, by name (any case) |

#### Slots

| Slot | Presets | Drawn with |
|------|---------|------------|
| `backdrop` | `blur`, `grayscale`, `saturate`, `contrast`, `hue-rotate` | CSS `backdrop-filter` on the dashboard behind |
| `canvas` | `static`, `pixelate`, `glitch`, `scanlines`, `borg-assimilation` | An animated canvas (Canvas2D; WebGL for `borg-assimilation`) |
| `color` | `color-tint`, `vignette` | A see-through element with a CSS background, on top |

### `lcards.clear_effect`

**Clears screen effects: every slot, or only the one in `slot`.** Use `slot` to take off one layer and keep the others.

```yaml
# In an automation or script: take off the canvas effect, keep the blur and tint
action: lcards.clear_effect
data:
  slot: canvas
```

::: details More examples
```yaml
# Everything, on every browser
action: lcards.clear_effect
```

```yaml
# Everything, on one browser only
action: lcards.clear_effect
data:
  target_device_ids:
    - abc123def456
```
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `slot` | string | every slot | `backdrop`, `canvas` or `color`: clear only that slot |
| `target_device_ids` | list | - | Only these browsers, by LCARdS device id |
| `target_device_names` | list | - | Only these browsers, by device name |
| `target_user_ids` | list | - | Only these Home Assistant users, by user id |
| `target_user_names` | list | - | Only these Home Assistant users, by name |

## Console API

**`window.lcards.screenEffect` runs the same effects from the browser console, on this browser only.** Handy for trying presets and settings before you put them in an automation.

- `applySlot()` and `apply()` show an effect until it is cleared; `play()` takes it off again after `duration` ms (default `1000`) and returns a promise that settles then.
- A new effect in a slot replaces the one there; the other slots are left alone (unlike `lcards.trigger_effect`).
- `registerPreset()` adds a preset: `slot`, `defaults`, and an `enter(el, params)` function that starts the effect on the slot's element and returns a function that stops it.

```js
// An effect in a slot, until cleared
window.lcards.screenEffect.applySlot('backdrop', 'blur', { amount: '12px' })
window.lcards.screenEffect.applySlot('color', 'color-tint', { color: 'alpha(var(--lcars-alert-red), 0.35)' })
window.lcards.screenEffect.applySlot('canvas', 'static', { opacity: 0.3 })

// apply(): the same, in the preset's own slot
window.lcards.screenEffect.apply('blur', { amount: '12px' })

// play(): gone again after duration ms
window.lcards.screenEffect.play('static', { duration: 2000, scale: 6 })

// Take effects off
window.lcards.screenEffect.clearSlot('backdrop')   // one slot
window.lcards.screenEffect.clear()                  // every slot

// What is there
window.lcards.screenEffect.list()                   // preset names
window.lcards.screenEffect.catalog()                // name, label, slot, settings and defaults of each
window.lcards.screenEffect.getPreset('glitch')      // one preset's definition

// Your own preset
window.lcards.screenEffect.registerPreset('my-green', {
  slot: 'color',
  defaults: { color: 'alpha(var(--lcars-green), 0.3)' },
  params_schema: [{ key: 'color', type: 'color-text' }],  // marks color as a colour to resolve
  enter(el, params) {
    el.style.background = params.color;
    return () => { el.style.background = ''; };
  },
})
window.lcards.screenEffect.apply('my-green')
```

## Related

- [Alert Overlay: Position and Screen Effects](../../cards/alert-overlay/overlay#layers): the same presets as the overlay's `layers`, shown live
- [Borg Assimilation](../borg.md): the full Borg sequence built on these effects
- [Actions](../../configuration/ha-actions): every LCARdS action, with targeting
- [Background Animations](./background-animations.md): card-scoped canvas animations
- [Card Animations](../animations.md): anime.js per-element animations
