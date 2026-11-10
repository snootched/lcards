---
description: "Borg assimilation: an LCARdS Easter egg that turns every dashboard Borg green, swaps the font, plays a full-screen assimilation intro and keeps screen effects until you restore it."
moved_anchors:
  home-assistant-services: /core/borg-actions
  lcards-borg-assimilate: /core/borg-actions#lcards-borg-assimilate
  lcards-borg-deassimilate: /core/borg-actions#lcards-borg-deassimilate
  targeting: /core/borg-actions#targeting
  intro-canvas-params-borg-assimilation-effect: /core/borg#intro-canvas
  performance: /core/borg#intro-canvas
  notes: /core/borg#sequence-of-events
---

# Borg Assimilation

**Borg assimilation is an LCARdS Easter egg that takes over the whole dashboard: Borg colours, a Borg font, a full-screen assimilation and lingering screen effects, until you restore it.** Start it from an automation, a dashboard button or the browser console.

- **Colours:** the palette shifts toward Borg yellow-green (hue 110°), slightly desaturated and darker. `paletteHue` picks another hue.
- **Font:** LCARS text switches to the `lcards_borg` typeface.
- **Intro:** injection sites appear with a breathing glow and grow tendrils, an assimilation front spreads out and overruns the screen with Borg circuitry, a Borg cube emerges at the centre and bursts of signal corruption tear the picture. It stays until someone clicks the screen, or until a timeout.
- **After the intro:** screen effects stay on (by default a light glitch, a green tint and a saturation boost) until the dashboard is restored. Restoring plays a short glitch, then puts the colours, font and screen back.

::: tip Try it
The buttons in the [Quick start](#quick-start) assimilate this page and restore it. In the LCARdS Config Panel, the **Connectivity** tab's **Resistance is Futile** display style runs the assimilation when the connection to Home Assistant is lost; **Simulate Disconnect** shows it.
:::

| Page | Covers |
|------|--------|
| [Borg Actions](/core/borg-actions) | `lcards.borg_assimilate` and `lcards.borg_deassimilate`: every field, examples and targeting |
| [Screen Effects](/core/effects/screen-effects#preset-reference) | The presets the intro, persistent and outro layers can use |

## Quick start

**The `lcards.borg_assimilate` action assimilates every connected browser, and `lcards.borg_deassimilate` restores them.** On this page the two buttons below run it here only.

- Clicking anywhere on the screen ends the intro; the screen effects after it stay until you restore.
- The assimilation is not stored: a page reload, or a browser opened later, shows the normal dashboard.

```yaml live
# Assimilates this page; the intro ends after 10 seconds or on a click
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: ASSIMILATE
    show: true
style:
  card:
    color:
      background:
        default: var(--lcars-green)
tap_action:
  action: perform-action
  perform_action: lcards.borg_assimilate
  data:
    intro_duration: 10000
```

```yaml live
# Restores this page
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: RESTORE
    show: true
tap_action:
  action: perform-action
  perform_action: lcards.borg_deassimilate
```

From an automation or a script (not live here):

```yaml
action: lcards.borg_assimilate
```

From the browser console:

```js
window.lcards.borg.assimilate()     // window.lcards.alert.borg() does the same
window.lcards.borg.status           // true while assimilated
window.lcards.borg.deassimilate()
```

## Sequence of events

**Assimilation changes the colours and the font first, plays the intro until it is dismissed, then applies the persistent layers.** Restoring plays the outro, then reverts everything.

When assimilation starts:

1. The `borg_assimilate` sound plays (or the `sound` option's sound), and the palette starts shifting to Borg colours with the `transitionStyle` transition.
2. The `lcards_borg` font loads and replaces the LCARS font, at the same time (skipped with `fontSwap: false`).
3. The intro layers show: the `borg-assimilation` effect on the canvas slot, with the intro's `backdrop` and `color` layers behind and over it.
4. The intro stays until someone clicks anywhere on the screen, or until `duration` ms have passed.
5. All intro layers are cleared, and the persistent layers are applied. They stay until the dashboard is restored.

When it is restored:

1. If the intro is still showing, it ends at once, without a click.
2. The `borg_deassimilate` sound plays (or the `sound` option's sound), and the outro layers show (skipped with `withOutro: false`).
3. After the longest `duration` in the outro layers, and at least 1200 ms, the palette goes back to the alert mode that was active before the assimilation, with the `revertTransitionStyle` transition.
4. The Borg font is removed (if it was swapped in) and every screen effect is cleared.

::: details More about the sequence
- **Twice in a row:** starting an assimilation while one is running, or restoring when nothing is assimilated, does nothing (a warning is logged). The alert mode to go back to is the one from before the first start.
- **The alert mode afterwards:** restoring returns the colours to the alert mode that was active when the assimilation started (red alert stays red alert). It is `green_alert` when that mode is unknown or was itself a Borg alert. The `input_select.lcards_alert_mode` helper is never changed by the Borg.
- **Clicks during the intro:** the intro takes every click until it is dismissed; after it, the dashboard works normally under the persistent layers.
- **All screen effects:** restoring clears every screen effect, including one started separately with `lcards.trigger_effect`.
- **The font:** the Borg typeface replaces `--lcars-font` and `--lcars-fallback-font`, so text in another font keeps it.
- **Palette hue:** a custom `paletteHue` lasts for that assimilation only; restoring resets it.
:::

## intro.canvas

**`intro.canvas` sets up the assimilation intro itself: how many injection sites, how many tendrils, their colours, the cube and the signal corruption.** The canvas slot always plays the `borg-assimilation` effect during the intro; a `preset` given here is ignored.

- The WebGL intro (the default) runs on the graphics card in a worker, so the dashboard stays responsive. Browsers without WebGL2 play the [classic intro](#classic-intro).
- With the WebGL intro, `particleCount` sets the light pulses travelling along each tendril.
- In the [actions](/core/borg-actions#lcards-borg-assimilate) these keys are flat fields in snake_case (`site_count`, `tendrils_per_site`, ...), or go under `intro_layers.canvas` in either spelling.
- On a slow wall tablet, lower `corruption`, use the classic cube or none, or play the classic intro.

```yaml
# From an automation: a denser intro, no cube
action: lcards.borg_assimilate
data:
  intro_layers:
    canvas:
      siteCount: 12
      tendrilsPerSite: 10
      tendrilLength: 800
      particleCount: 3
      cube: false
      seed: 7
```

```js
// The same from the browser console
window.lcards.borg.assimilate({
  intro: {
    canvas: {
      siteCount: 12,
      tendrilsPerSite: 10,
      tendrilLength: 800,
      particleCount: 3,
      cube: false,
      seed: 7,
    },
  },
})
```

::: details More about the intro
- **Reduced motion:** with reduced motion set on the device, the intro draws its finished picture once, with no flicker, tearing or movement.
- **No OffscreenCanvas:** in a browser without OffscreenCanvas and Web Workers the intro canvas draws nothing; the intro's backdrop and colour layers still show and the screen still waits for a click or the `duration`.
- **On its own:** the `borg-assimilation` effect can also run without the rest of the assimilation, through `lcards.trigger_effect`; see [Screen Effects](/core/effects/screen-effects#borg-assimilation). Played that way it starts from its own defaults (7 sites, 8 tendrils per site, green colours).
- **Frame rate:** with the console at debug level (`window.lcards.setGlobalLogLevel('debug')`) the WebGL intro logs its frame rate.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `siteCount` | number | `8` | Injection sites on the screen, 1 to 20 |
| `tendrilsPerSite` | number | `5` | Tendrils grown from each injection site, 1 to 24 (1 to 20 as the actions' flat `tendrils_per_site`) |
| `tendrilLength` | number | `600` | Longest tendril reach in pixels, 100 to 1200 |
| `particleCount` | number | `2` | Nano-probe particles (WebGL: light pulses) travelling each tendril, 0 to 6; `0` turns them off |
| `color` | string | `var(--lcars-martian)` | Tendril and injection site colour: any CSS colour, variable or LCARdS colour expression |
| `glowColor` | string | `var(--lcards-yellow)` | Glow at each injection site and around the particles |
| `renderer` | string | `auto` | `auto` and `webgl` play the WebGL intro where the browser supports WebGL2; `canvas` plays the classic intro |
| `cube` | boolean | `true` | WebGL intro: a rotating Borg cube emerges at the centre; `false` leaves it out |
| `cubeStyle` | string | `detailed` | WebGL intro: `detailed` is a solid cube, corner first, covered in machinery with a rail lattice, pulsing glows and a soft halo; `classic` is the lighter glowing wireframe cube |
| `corruption` | number | `0.5` | WebGL intro: strength of the signal corruption bursts (block displacement, scanline tearing, colour fringing), 0 to 1; `0` turns them off |
| `overrun` | number | `0.65` | WebGL intro: how dark the screen gets behind the assimilation front, 0 to 1; `0` draws only the circuitry over the dashboard |
| `seed` | number | - | WebGL intro: a number gives the same layout every time |

### Classic intro

**The classic intro is the original Canvas2D animation: signal flicker, injection sites, Bézier tendrils with nano-probe particles and bridges between them.** Set `renderer: canvas` to play it; every `intro.canvas` key above except the WebGL ones applies.

- In the Config Panel, pick **Classic (Canvas2D)** under Renderer in the Borg canvas effect.

```yaml
# From an automation
action: lcards.borg_assimilate
data:
  renderer: canvas
```

```js
// From the browser console
window.lcards.borg.assimilate({ intro: { canvas: { renderer: 'canvas' } } })
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `renderer` | string | `auto` | `canvas` plays the classic intro; `auto` and `webgl` play the WebGL intro where the browser supports WebGL2 |

## Layers format

**The intro, the persistent layers and the outro each take a layers map: one entry per screen effect slot, each with a `preset` and that preset's settings.** It is the same format as `lcards.trigger_effect`.

- The slots are `canvas`, `backdrop` and `color`; other names are ignored, and so is a slot without a `preset` (except `intro.canvas`, which never takes one).
- `intro` is merged with the defaults slot by slot: give `backdrop` and you replace the default intro backdrop, while the default `color` layer stays. A slot with no `preset` (for example `backdrop: {}`) turns that default layer off.
- `persistentLayers` and `outroLayers` replace their defaults entirely. An empty map (`persistentLayers: {}`) leaves no effects after the intro.
- [Screen Effects](/core/effects/screen-effects#preset-reference) lists every preset and its settings. The ones most used here are `scanlines`, `glitch` and `static` (canvas), `color-tint` and `vignette` (color) and `blur` and `saturate` (backdrop).

```yaml
# From an automation: blurred intro, then scanlines and a green tint
action: lcards.borg_assimilate
data:
  intro_layers:
    backdrop:
      preset: blur
      amount: 6px
  persistent_layers:
    canvas:
      preset: scanlines
      lineHeight: 3
      opacity: 0.2
      scroll: 2
    color:
      preset: color-tint
      color: alpha(var(--lcars-green), 0.12)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `intro.canvas` | map | see [intro.canvas](#intro-canvas) | The `borg-assimilation` effect's settings; no `preset` |
| `intro.backdrop` | map | `saturate`, `amount: 200%` | A layer behind the intro; cleared when the intro ends |
| `intro.color` | map | `color-tint`, `color: rgba(0,60,0,0.25)` | A colour layer over the intro; cleared when the intro ends |
| `persistentLayers.canvas` | map | `glitch`, `intensity: 0.08`, `maxShift: 400`, `bandHeight: 3`, `fps: 20` | Canvas layer kept after the intro |
| `persistentLayers.color` | map | `color-tint`, `color: rgba(0, 60, 0, 0.10)` | Colour layer kept after the intro |
| `persistentLayers.backdrop` | map | `saturate`, `amount: 200%` | Backdrop layer kept after the intro |
| `outroLayers.canvas` | map | `glitch`, `duration: 1200`, `intensity: 0.4`, `opacity: 0.7` | The outro; any outro layer's `duration` sets how long the outro plays, at least 1200 ms |

## Console API

**`window.lcards.borg.assimilate(opts)` and `window.lcards.borg.deassimilate(opts)` run the Borg from the browser console, with the same options as the actions in camelCase.** Open the developer tools (F12) on any LCARdS dashboard.

- `window.lcards.borg.status` is `true` while assimilated.
- The console calls affect this browser only.

```js
// Blue instead of Borg green, auto-dismiss after 10 seconds, keep the font
window.lcards.borg.assimilate({
  duration: 10000,
  paletteHue: 240,
  fontSwap: false,
  transitionStyle: 'fade_only',
})

// Restore at once, with no outro
window.lcards.borg.deassimilate({ withOutro: false })
```

### assimilate(opts?) options

**The options of `assimilate()`: the intro's timeout and transition, the layers, the hue, the font and the sound.** As an action, the same options have snake_case names; [Borg Actions](/core/borg-actions#lcards-borg-assimilate) has them all.

```yaml
# The action equivalent of the console call above
action: lcards.borg_assimilate
data:
  intro_duration: 10000
  font_swap: false
  transition_style: fade_only
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `duration` | number | `0` | Ends the intro after this many ms; `0` waits for a click. A click still ends it earlier |
| `transitionStyle` | string | `blur_fade` | Palette transition: `blur_fade`, `flash`, `fade_only` or `off` |
| `intro` | map | see [Layers format](#layers-format) | Intro layers, merged slot by slot with the defaults |
| `persistentLayers` | map | see [Layers format](#layers-format) | Layers kept after the intro; `{}` for none |
| `paletteHue` | number | `110` | The hue (0 to 359) the palette shifts toward: `110` is Borg yellow-green, `240` blue, `0` red. As an action: `palette_hue` |
| `fontSwap` | boolean | `true` | `false` keeps the dashboard font; everything else still runs |
| `sound` | string | the `borg_assimilate` [sound event](#sounds) | A sound for this call: a file URL (`/local/sounds/borg.mp3`), a media library id (`media-source://...`) or a sound asset key; `none` plays nothing |

### deassimilate(opts?) options

**The options of `deassimilate()`: whether to play the outro, its layers, the transition back and the sound.**

```yaml
# From an automation: a shorter, stronger outro
action: lcards.borg_deassimilate
data:
  outro_layers:
    canvas:
      preset: glitch
      duration: 800
      intensity: 0.6
  revert_transition_style: fade_only
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `withOutro` | boolean | `true` | `false` restores at once, with no outro and no wait |
| `outroLayers` | map | see [Layers format](#layers-format) | Outro layers, replacing the default glitch; the longest `duration` in them sets the wait, at least 1200 ms. See [glitch](/core/effects/screen-effects#glitch) |
| `revertTransitionStyle` | string | `fade_only` | Palette transition back to normal: `fade_only`, `flash`, `blur_fade` or `off` |
| `sound` | string | the `borg_deassimilate` [sound event](#sounds) | A sound for this call, as for `assimilate()` |

## Sounds

**Assimilation and restoring each fire a sound event, Borg assimilation (`borg_assimilate`) and Borg deassimilation (`borg_deassimilate`), in the Alerts category.** LCARdS ships no Borg audio, so both are silent until you give them a sound.

- **Config Panel:** in the **Sounds** tab's overrides, pick a file for the two Borg rows from the Home Assistant media library.
- **Your own sound scheme** (saved from the Config Panel, or a pack's `sound_schemes`): map the events to a sound asset key, a media library id or a URL. A file in the `www` folder of your Home Assistant configuration is served under `/local/`.
- **One call:** the `sound` option (console) or field (action) plays a sound for that call only; `none` keeps it silent.
- The Alerts switch and the master sound switch apply to all three.

```yaml
# In a sound scheme
borg_assimilate: /local/sounds/borg.mp3
borg_deassimilate: /local/sounds/borg-restore.mp3
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `borg_assimilate` | sound | silent | Plays as assimilation starts |
| `borg_deassimilate` | sound | silent | Plays as restoring starts |
