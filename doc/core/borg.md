# Borg Assimilation

The Borg Assimilation mode uses LCARdS core systems to tranform the entire dashboard interface into a Borg-assimilated state:

- **Palette shift**: the UI colour palette is pushed toward Borg yellow-green (HSL ~110°) system-wide. The hue is configurable via the `paletteHue` option (or the Palette Hue control in the Config Panel).
- **Font swap**: all LCARS text switches to the `lcards_borg` typeface
- **Canvas intro**: a full-screen assimilation plays. Injection sites appear with a breathing glow and grow tendrils; an assimilation front spreads out from them and overruns the screen with Borg circuitry; a Borg cube emerges at the centre while bursts of signal corruption tear the picture. It runs on WebGL in a dedicated Web Worker on an `OffscreenCanvas`, so the main thread (and the LCARS UI) stays fully responsive. The classic intro (tendrils and injection sites only, drawn with Canvas2D) is still there: set `renderer: canvas` (see [Classic intro](#classic-intro)). Browsers without WebGL2 play the classic intro.
- **Click-to-dismiss**: the intro stays on screen until the user clicks anywhere on the canvas (or until an optional timeout expires). After dismissal, persistent layers activate.
- **Persistent layers**: after the intro is dismissed, zero or more SEM presets remain active per slot (default: glitch on `canvas` + subtle green colour tint on `color` + saturation boost on `backdrop`)

Calling `deassimilate()` plays a brief glitch outro, then cleanly reverts palette, font, and all screen effects.

---

## Layers format

All three stages (`intro`, `persistentLayers`, and `outroLayers`) accept the same **layers dict** that `lcards.trigger_effect` uses:

```js
{
  canvas:   { preset: 'scanlines', opacity: 0.2 },   // SEM canvas slot
  backdrop: { preset: 'blur', amount: '8px' },        // SEM backdrop slot
  color:    { preset: 'color-tint', color: 'rgba(0,40,0,0.1)' }, // SEM color slot
}
```

Each key is an SEM slot name; the value is `{ preset, ...params }`. Unknown slots are ignored.

> **`intro.canvas` is special**: the canvas slot during the intro is always hardcoded to the `borg-assimilation` preset. Any `preset` key you include in `intro.canvas` is silently stripped. All other keys are forwarded as effect params.
>
> **Naming convention:** the JavaScript console API uses camelCase (`siteCount`, `tendrilsPerSite`, `glowColor`). The Home Assistant service YAML layer (`intro_layers.canvas`) accepts **either** snake_case (`site_count`, `tendrils_per_site`, `glow_color`) or camelCase; both are normalised before being sent to the browser.

::: tip SEM preset reference
All available presets for the `backdrop`, `color`, and `canvas` slots (and every parameter each accepts) are documented in **[Screen Effects → Preset Reference](effects/screen-effects.md#preset-reference)**.
For the Borg assimilation feature, the most relevant presets are:
- **`canvas`**: `borg-assimilation` (intro), `scanlines`, `glitch`, `static`
- **`color`**: `color-tint`, `vignette`
- **`backdrop`**: `blur`
:::

---

## Console API

Open the browser developer tools (`F12`) on any LCARdS dashboard and use the browser console:

```js
// Begin assimilation - intro stays until clicked (all defaults)
window.lcards.borg.assimilate()

// Auto-dismiss the intro after 10 seconds (user can still click to dismiss early)
window.lcards.borg.assimilate({ duration: 10000 })

// Full custom call
window.lcards.borg.assimilate({
  duration: 10000,              // ms - auto-dismiss timeout; 0 = click-to-dismiss only
  transitionStyle: 'blur_fade', // palette transition: 'flash'|'fade_only'|'blur_fade'|'off'

  // Intro layers - shown during the canvas animation, cleared on dismiss
  intro: {
    canvas:   { siteCount: 12, tendrilsPerSite: 10, tendrilLength: 800, particleCount: 3 }, // params for the borg-assimilation effect
    backdrop: { preset: 'blur', amount: '6px' },       // optional extra layer behind the canvas
    color:    { preset: 'color-tint', color: 'rgba(0,60,0,0.15)' }, // optional colour overlay
  },

  // Persistent layers - applied after intro is dismissed, held until deassimilation
  persistentLayers: {
    canvas: { preset: 'scanlines', lineHeight: 3, opacity: 0.20, scroll: 2 },
    color:  { preset: 'color-tint', color: 'rgba(0, 60, 0, 0.12)' },
  },
})

// Shift the palette to blue instead of Borg green
window.lcards.borg.assimilate({ paletteHue: 240 })

// Suppress all persistent layers - just palette + font change, no lingering effects
window.lcards.borg.assimilate({ persistentLayers: {} })

// Check current state
window.lcards.borg.status   // → true while assimilated

// Revert everything (with default glitch outro)
window.lcards.borg.deassimilate()

// Immediate silent revert (no outro)
window.lcards.borg.deassimilate({ withOutro: false })

// Custom outro layers + transition
window.lcards.borg.deassimilate({
  outroLayers: {
    canvas: { preset: 'glitch', duration: 800, intensity: 0.6 },
    color:  { preset: 'color-tint', color: 'rgba(0,255,80,0.4)', duration: 800 },
  },
  revertTransitionStyle: 'fade_only',
})

// Shortcut alias on the alert namespace
window.lcards.alert.borg()
```

### `assimilate(opts?)` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | `number` (ms) | `0` | Auto-dismiss the intro after this many ms. `0` (default) = click-to-dismiss only. |
| `transitionStyle` | `string` | `'blur_fade'` | Palette transition style: `'blur_fade'`, `'flash'`, `'fade_only'`, or `'off'` |
| `intro` | `Object` (layers dict) | `{ canvas: { siteCount: 8, tendrilsPerSite: 5, tendrilLength: 600, particleCount: 2, color: 'var(--lcars-martian)', glowColor: 'var(--lcards-yellow)' }, backdrop: { preset: 'saturate', amount: '200%' }, color: { preset: 'color-tint', color: 'rgba(0,60,0,0.25)' } }` | Layers shown during the intro. Per-slot merged with defaults. `intro.canvas` params override the `borg-assimilation` effect (see [`intro.canvas` params](#intro-canvas-params-borg-assimilation-effect) below); `intro.backdrop` and `intro.color` are optional extra layers applied alongside the canvas and cleared on dismiss. See [Preset Reference](effects/screen-effects.md#preset-reference) for all available presets and params. |
| `persistentLayers` | `Object` (layers dict) | glitch on `canvas` + color-tint on `color` + saturate on `backdrop` | Layers applied after the intro is dismissed and held until `deassimilate()`. Omit to use defaults; pass `{}` to suppress all persistent effects. See [Preset Reference](effects/screen-effects.md#preset-reference) for all available presets and params. |
| `paletteHue` | `number` (0–359) | `110` | HSL hue the UI palette is shifted toward during assimilation. `110` = Borg yellow-green (default). `240` = blue, `0` or `360` = red. Applied before the palette swap fires. Automatically reset to the built-in default on `deassimilate()`. |
| `fontSwap` | `boolean` | `true` | Whether to inject the Borg typeface across all dashboard text. Set to `false` to keep the existing font while all other assimilation effects (palette, canvas intro, persistent layers) still run. |
| `sound` | `string` | - | A sound to play as the assimilation starts: a file URL (`'/local/sounds/borg.mp3'`), a media library id (`'media-source://…'`) or a sound asset key. `'none'` plays nothing. Omitted: the `borg_assimilate` [sound event](#sounds). |

#### `intro.canvas` params (`borg-assimilation` effect)

| Param | Default | Description |
|-------|---------|-------------|
| `siteCount` | `8` | Number of Borg injection sites on screen (1–20) |
| `tendrilsPerSite` | `5` | Bézier tendrils grown from each injection site (1–24) |
| `tendrilLength` | `600` | Maximum tendril reach in pixels: longer tendrils span more of the screen (100–1200) |
| `particleCount` | `2` | Nano-probe particles travelling each tendril and branch continuously. Set to `0` to disable (0–6) |
| `color` | `'var(--lcars-martian)'` | Tendril and injection site colour (any CSS colour string, supports CSS variables and token expressions) |
| `glowColor` | `'var(--lcards-yellow)'` | Inner glow colour at each injection site and nano-probe particle halos |
| `renderer` | `'auto'` | `'auto'` and `'webgl'` play the WebGL intro where the browser supports WebGL2; `'canvas'` plays the [classic intro](#classic-intro). Without WebGL2 every value plays the classic one |
| `cube` | `true` | WebGL intro: a rotating Borg cube emerges at the centre of the screen. `false` leaves it out |
| `cubeStyle` | `'detailed'` | WebGL intro: `'detailed'` draws a solid cube coming in corner first, covered in machinery that rises and sinks at several scales, with a thin rail lattice among the blocks, slowly pulsing green glows deep inside and a soft halo. `'classic'` draws the lighter glowing wireframe cube |
| `corruption` | `0.5` | WebGL intro: strength of the signal corruption bursts (block displacement, scanline tearing, colour fringing), 0 to 1. `0` turns them off |
| `overrun` | `0.65` | WebGL intro: how dark the screen gets behind the assimilation front, 0 to 1. `0` draws only the circuitry over your dashboard |
| `seed` | - | WebGL intro: a number gives the same layout every time |

With the WebGL intro, `particleCount` sets the light pulses travelling along each tendril.

#### Classic intro

The original Canvas2D intro (signal flicker, injection sites, Bézier tendrils with nano-probe particles, bridges between them) stays available with all of its params. Set `renderer: canvas` to keep it:

```js
window.lcards.borg.assimilate({ intro: { canvas: { renderer: 'canvas' } } })
```

From an automation, add `renderer: canvas` to the `lcards.borg_assimilate` action. In the Config Panel, pick **Classic (Canvas2D)** under Renderer in the Borg canvas effect.

#### Performance

The WebGL intro draws the whole screen every frame on the graphics card while it shows. On a slow wall tablet, lower `corruption`, use `cubeStyle: 'classic'` or turn off the `cube`, or use the classic intro. With the browser console at debug level (`window.lcards.setGlobalLogLevel('debug')`) the frame rate is logged every 5 seconds.

### `deassimilate(opts?)` options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `withOutro` | `boolean` | `true` | Play outro layers before reverting. Set to `false` for an immediate silent revert. |
| `outroLayers` | `Object` (layers dict) | `{ canvas: { preset: 'glitch', duration: 1200, intensity: 0.4, opacity: 0.7 } }` | Layers applied as the outro. The longest `duration` value found in any layer's params determines how long to wait before reverting. Falls back to 1200 ms if none are specified. Omit to use defaults. See [glitch params](effects/screen-effects.md#glitch) for all available options. |
| `revertTransitionStyle` | `string` | `'fade_only'` | Palette transition back to normal: `'flash'`, `'fade_only'`, `'blur_fade'`, or `'off'` |
| `sound` | `string` | - | A sound to play as the deassimilation starts, as for `assimilate()`. Omitted: the `borg_deassimilate` [sound event](#sounds). |

### Sounds

Assimilation and deassimilation each fire a sound event, **Borg assimilation** (`borg_assimilate`) and **Borg deassimilation** (`borg_deassimilate`), in the Alerts category. LCARdS ships no Borg audio, so both are silent until you give them a sound. Three ways:

- **Config Panel:** in the sound overrides, pick a file for the two Borg rows from the Home Assistant media library.
- **A sound scheme of your own** (saved from the Config Panel, or a pack's `sound_schemes`): map the events to a file. A scheme value can be a sound asset key, a media library id or a URL; a file in the `www` folder of your Home Assistant configuration is served under `/local/`:

  ```yaml
  borg_assimilate: /local/sounds/borg.mp3
  borg_deassimilate: /local/sounds/borg-restore.mp3
  ```

- **One call:** the `sound` option (console) or the `sound` field (Home Assistant action) plays a file for that call only; `none` keeps it silent.

The Alerts sound switch and the master sound switch apply to all three.

### Sequence of events

When `assimilate()` is called:

1. The `borg_assimilate` sound plays (or the `sound` option's file); the `borg_alert` palette is applied immediately (HSL hue-shift to ~110°, slightly desaturated and darkened)
2. `lcards_borg` font is loaded and injected as a `:root` CSS override; both fire in parallel (skipped if `fontSwap: false`)
3. Intro layers are applied:
   - `intro.canvas` → `borg-assimilation` effect (signal flicker → injection sites → growing tendrils → assimilation front and Borg cube on WebGL)
   - `intro.backdrop` and `intro.color` (if specified) → applied to their SEM slots alongside the canvas
4. The intro stays visible until the user **clicks anywhere on the canvas**, or until `duration` ms elapses (if positive)
5. All intro layers are cleared (canvas, backdrop, color slots)
6. `persistentLayers` are applied to their respective SEM slots and held until `deassimilate()`

When `deassimilate()` is called:

1. `_assimilated` is set to `false` immediately: if the intro is still showing, it is cancelled (no click required)
2. The `borg_deassimilate` sound plays (or the `sound` option's file); `outroLayers` are applied to their SEM slots (unless `withOutro: false`)
3. The manager waits for the longest `duration` param across all outro layers (minimum 1200 ms)
4. Palette is transitioned back to `green_alert` using `revertTransitionStyle`
5. The Borg font override `<style>` tag is removed from `document.head` (only if font was injected during assimilation; skipped when `fontSwap: false` was passed)
6. All active screen effects are cleared

---

## Home Assistant Services

The LCARdS integration exposes two services in the `lcards.*` namespace that can trigger and clear the Easter egg from automations, scripts, or the Developer Tools → Actions panel.

### `lcards.borg_assimilate`

Trigger the Borg assimilation on one or all connected browsers.

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `intro_duration` | No | - | Auto-dismiss the intro after this many ms (1000–60000). **Omit** to use click-to-dismiss. |
| `site_count` | No | `8` | Number of injection sites on screen (1–20) |
| `tendrils_per_site` | No | `5` | Bézier tendrils per injection site (1–24) |
| `tendril_length` | No | `600` | Maximum tendril reach in pixels (100–1200) |
| `particle_count` | No | `2` | Nano-probe particles per tendril (0–6); `0` disables particles |
| `renderer` | No | `auto` | `auto` or `webgl`: the WebGL intro where the browser supports it; `canvas`: the [classic intro](#classic-intro) |
| `cube` | No | `detailed` | WebGL intro: the Borg cube, `detailed` (solid cube with machinery, lattice, glows and halo), `classic` (wireframe) or `none` (no cube) |
| `corruption` | No | `0.5` | WebGL intro: signal corruption strength (0–1); `0` turns it off |
| `overrun` | No | `0.65` | WebGL intro: darkness behind the assimilation front (0–1) |
| `transition_style` | No | `blur_fade` | Palette transition: `blur_fade`, `flash`, `fade_only`, `off` |
| `font_swap` | No | `true` | Set to `false` to skip the Borg font injection; all other effects (palette, canvas intro, persistent layers) still run. |
| `sound` | No | - | A sound for this call: a file URL (`/local/sounds/borg.mp3`), a media library id or a sound asset key; `none` for silence. Empty: the `borg_assimilate` [sound event](#sounds). |
| `suppress_persistent` | No | `false` | Suppress all persistent effects after intro. Ignored if `persistent_layers` is also set. |
| `intro_layers` | No | - | **Advanced.** Full per-slot layers dict. `intro_layers.canvas` canvas param keys can use either snake_case (`site_count`, `tendrils_per_site`, `glow_color`) or camelCase; both are normalised server-side. Values override the corresponding flat shortcuts; missing keys fall back to the flat values. See [Preset Reference](effects/screen-effects.md#preset-reference) for all available presets and params per slot. |
| `persistent_layers` | No | - | **Advanced.** Full per-slot layers dict. Overrides `suppress_persistent` when set. Pass `{}` to suppress all. See [Preset Reference](effects/screen-effects.md#preset-reference) for all available presets and params per slot. |
| `target_device_ids` | No | - | List of browser device UUIDs: leave empty for all |
| `target_device_names` | No | - | List of device display names (resolved server-side) |
| `target_user_ids` | No | - | List of Home Assistant user IDs: leave empty for all |
| `target_user_names` | No | - | List of Home Assistant user display names (case-insensitive) |

**Broadcast, click-to-dismiss (intro stays until user interacts):**

```yaml
action: lcards.borg_assimilate
```

**Auto-dismiss after 12 seconds with a gentle fade:**

```yaml
action: lcards.borg_assimilate
data:
  intro_duration: 12000
  transition_style: fade_only
```

**More injection sites, denser tendrils, longer reach:**

```yaml
action: lcards.borg_assimilate
data:
  site_count: 12
  tendrils_per_site: 14
  tendril_length: 900
  particle_count: 3
```

**Keep the classic intro:**

```yaml
action: lcards.borg_assimilate
data:
  renderer: canvas
```

**WebGL intro without the cube, gentler corruption, dashboard still visible behind the front:**

```yaml
action: lcards.borg_assimilate
data:
  cube: none
  corruption: 0.2
  overrun: 0.3
```

**Custom intro, flat shortcuts + blur backdrop via advanced object:**

```yaml
action: lcards.borg_assimilate
data:
  intro_duration: 10000
  transition_style: blur_fade
  site_count: 12
  intro_layers:
    backdrop:
      preset: blur
      amount: "6px"
```

**Suppress all persistent effects (palette + font change only):**

```yaml
action: lcards.borg_assimilate
data:
  suppress_persistent: true
```

**Custom persistent layers via advanced object, colour tint only, no scanlines:**

```yaml
action: lcards.borg_assimilate
data:
  persistent_layers:
    color:
      preset: color-tint
      color: "rgba(0, 60, 0, 0.2)"
```

**Suppress all persistent effects (palette + font change only):**

```yaml
action: lcards.borg_assimilate
data:
  persistent_layers: {}
```

**Target a specific device:**

```yaml
action: lcards.borg_assimilate
data:
  intro_duration: 10000
  target_device_names:
    - Living Room TV
```

**In an automation, assimilate all browsers for Halloween, auto-revert after 30 minutes:**

```yaml
automation:
  - alias: "Halloween Borg Mode"
    trigger:
      - platform: time
        at: "20:00:00"
    action:
      - action: lcards.borg_assimilate
        data:
          intro_duration: 10000
      - delay:
          minutes: 30
      - action: lcards.borg_deassimilate
```

---

### `lcards.borg_deassimilate`

Reverse the Borg assimilation and restore all browsers to normal.

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `with_outro` | No | `true` | Play outro layers before reverting. Set to `false` for an immediate silent revert. |
| `outro_layers` | No | - | Layers dict for the outro. The longest `duration` param across all layers determines the wait time. Omit for defaults (glitch on canvas, 1200 ms). See [glitch params](effects/screen-effects.md#glitch) for all available options. |
| `revert_transition_style` | No | `fade_only` | Palette transition back to normal: `flash`, `fade_only`, `blur_fade`, `off` |
| `sound` | No | - | A sound for this call, as for `lcards.borg_assimilate`. Empty: the `borg_deassimilate` [sound event](#sounds). |
| `target_device_ids` | No | - | List of browser device UUIDs: leave empty for all |
| `target_device_names` | No | - | List of device display names (resolved server-side) |
| `target_user_ids` | No | - | List of Home Assistant user IDs: leave empty for all |
| `target_user_names` | No | - | List of Home Assistant user display names (case-insensitive) |

**Broadcast (restore all connected browsers, default glitch outro):**

```yaml
action: lcards.borg_deassimilate
```

**Immediate silent revert (no outro):**

```yaml
action: lcards.borg_deassimilate
data:
  with_outro: false
```

**Custom outro layers:**

```yaml
action: lcards.borg_deassimilate
data:
  outro_layers:
    canvas:
      preset: glitch
      duration: 800
      intensity: 0.6
  revert_transition_style: fade_only
```

---

## Targeting

All four standard targeting fields work the same as other `lcards.*` services:

- **No targeting fields** → broadcast to all connected browsers
- **`target_device_ids`** → list of UUIDs from `localStorage.getItem('lcards_device_id')` in each browser
- **`target_device_names`** → display names set in the LCARdS Config Panel or via `?lcards_device=` URL param; non-unique names match all devices sharing that name
- **`target_user_ids`** → Home Assistant user IDs
- **`target_user_names`** → Home Assistant user display names (case-insensitive)

When targeting is used, the global `input_select.lcards_alert_mode` is **not** written; the Borg palette change is applied locally on matching devices only and does not persist across reloads.

---

## Notes

- The `borg_alert` palette uses pure HSL math starting from the `green_alert` baseline; no static palette file is required
- Calling `assimilate()` while already assimilated is a no-op (a warning is logged)
- Calling `deassimilate()` while not assimilated is a no-op (a warning is logged)
- Calling `deassimilate()` during the canvas intro immediately cancels the click-dismiss Promise; the `deassimilate` sequence proceeds without waiting for user interaction
- The canvas intro uses `pointer-events: auto` while visible; all intro SEM slots (canvas, backdrop, color) are cleared on dismiss so Home Assistant UI interaction works normally
- The font override injects a `<style id="lcards-borg-font-override">` tag on `document.head`; `deassimilate()` removes it cleanly, only when `fontSwap` was `true` (the default) during the corresponding `assimilate()` call
- `window.lcards.alert.borg()` is a convenience alias for `window.lcards.borg.assimilate()`
- `intro_layers`/`persistent_layers`/`outro_layers` are object selectors in the Home Assistant service; pass them as a YAML mapping, not as a list
- When no `duration` key appears in any outro layer, the manager falls back to 1200 ms before reverting the palette
