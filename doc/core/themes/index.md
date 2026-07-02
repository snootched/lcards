# Themes

To complement the HA-LCARS system theme - LCARdS adds a token-based theme system for its cards. Instead of hardcoding colours and other default settings, we can reference named tokens that the active theme resolves at runtime.  Currently the `lcards-default` theme is loaded at startup, but in the future  new theme packs can be added to easily change the look of all the cards.

---

## Built-in Themes

| Theme | Description |
|-------|-------------|
| `lcards-default` | Standard LCARS look |

Themes are provided by content packs. See the [Config Panel](../../configuration/index.md) Pack Explorer to view all the tokens that theme provides.

---

## Using Theme Tokens

Reference a token in card configs, such as a colour or size field using  `{theme:token.path}`:

```yaml
style:
  border:
    color: "{theme:colors.ui.primary}"
  card:
    color:
      background: "{theme:colors.ui.primary}"
```

---

## Token Namespaces

Tokens are organized into namespaces. Browse all available tokens in the [Config Panel](../../configuration/index.md) Theme Browser tab.

### Example: `colors.ui.*`

Semantic colours that map to UI roles.  In the default theme, prefer HA-LCARS theme colours but provide LCARdS fallbacks:

| Token | `lcards-default` value |
|-------|---------|
| `colors.ui.primary` | `var(--lcars-ui-primary, var(--lcards-gray-medium))` |
| `colors.ui.secondary` | `var(--lcars-ui-secondary, var(--lcards-gray-medium-light))` |
| `colors.ui.tertiary` | `var(--lcars-ui-tertiary, var(--lcards-orange-medium-dark))` |
| `colors.ui.quaternary` | `var(--lcars-ui-quaternary, var(--lcards-gray-dark))` |

---

## LCARdS CSS Colour Palette

LCARdS injects a complete set of `--lcards-<colour>-<shade>` CSS variables at startup.
These colours can be used anywhere and do not need to be in your HA-LCARS theme file.

> **Note:** Colours shown are the **green_alert (normal) mode** baseline values.
> When an alert mode is active (e.g. `red_alert`, `blue_alert`), all variables are
> HSL-transformed automatically — you never need to change your references.

---

### 🟠 Orange

| Swatch | CSS Variable | Hex | Notes |
|---|---|---|---|
| ![](https://placehold.co/20x20/d91604/d91604.png) | `--lcards-orange-darkest` / `-05` | `#d91604` | Canon |
| ![](https://placehold.co/20x20/e01808/e01808.png) | `--lcards-orange-10` | `#e01808` | Computed (interpolated) |
| ![](https://placehold.co/20x20/ef1d10/ef1d10.png) | `--lcards-orange-dark` / `-20` | `#ef1d10` | Canon |
| ![](https://placehold.co/20x20/e7442a/e7442a.png) | `--lcards-orange-medium-dark` / `-30` | `#e7442a` | Canon |
| ![](https://placehold.co/20x20/ff6753/ff6753.png) | `--lcards-orange` / `-medium` / `-40` | `#ff6753` | Canon (base orange) |
| ![](https://placehold.co/20x20/ff715d/ff715d.png) | `--lcards-orange-50` | `#ff715d` | Computed (interpolated) |
| ![](https://placehold.co/20x20/ff7b66/ff7b66.png) | `--lcards-orange-60` | `#ff7b66` | Computed (interpolated) |
| ![](https://placehold.co/20x20/ff8470/ff8470.png) | `--lcards-orange-medium-light` / `-70` | `#ff8470` | Canon |
| ![](https://placehold.co/20x20/ff977b/ff977b.png) | `--lcards-orange-light` / `-80` | `#ff977b` | Canon |
| ![](https://placehold.co/20x20/ffb399/ffb399.png) | `--lcards-orange-lightest` / `-90` | `#ffb399` | Canon |
| ![](https://placehold.co/20x20/ffceb3/ffceb3.png) | `--lcards-orange-95` | `#ffceb3` | Computed (extrapolated) |

---

### ⚫ Gray

| Swatch | CSS Variable | Hex | Notes |
|---|---|---|---|
| ![](https://placehold.co/20x20/1e2229/1e2229.png) | `--lcards-gray-darkest` / `-05` | `#1e2229` | Canon |
| ![](https://placehold.co/20x20/232933/232933.png) | `--lcards-gray-10` | `#232933` | Computed (interpolated) |
| ![](https://placehold.co/20x20/2f3749/2f3749.png) | `--lcards-gray-dark` / `-20` | `#2f3749` | Canon |
| ![](https://placehold.co/20x20/52596e/52596e.png) | `--lcards-gray-medium-dark` / `-30` | `#52596e` | Canon |
| ![](https://placehold.co/20x20/6d748c/6d748c.png) | `--lcards-gray` / `-medium` / `-40` | `#6d748c` | Canon (base gray) |
| ![](https://placehold.co/20x20/7d849b/7d849b.png) | `--lcards-gray-50` | `#7d849b` | Computed (interpolated) |
| ![](https://placehold.co/20x20/8d94aa/8d94aa.png) | `--lcards-gray-60` | `#8d94aa` | Computed (interpolated) |
| ![](https://placehold.co/20x20/9ea5ba/9ea5ba.png) | `--lcards-gray-medium-light` / `-70` | `#9ea5ba` | Canon |
| ![](https://placehold.co/20x20/d2d5df/d2d5df.png) | `--lcards-gray-light` / `-80` | `#d2d5df` | Canon |
| ![](https://placehold.co/20x20/f3f4f7/f3f4f7.png) | `--lcards-gray-lightest` / `-90` | `#f3f4f7` | Canon |
| ![](https://placehold.co/20x20/f8f9fc/f8f9fc.png) | `--lcards-gray-95` | `#f8f9fc` | Computed (extrapolated) |
| ![](https://placehold.co/20x20/dfe1e8/dfe1e8.png) | `--lcards-moonlight` | `#dfe1e8` | Near-white; used for text/labels (not part of the 11-stop scale) |

---

### 🔵 Blue

| Swatch | CSS Variable | Hex | Notes |
|---|---|---|---|
| ![](https://placehold.co/20x20/002241/002241.png) | `--lcards-blue-darkest` / `-05` | `#002241` | Canon |
| ![](https://placehold.co/20x20/082b48/082b48.png) | `--lcards-blue-10` | `#082b48` | Computed (interpolated) |
| ![](https://placehold.co/20x20/1c3c55/1c3c55.png) | `--lcards-blue-dark` / `-20` | `#1c3c55` | Canon |
| ![](https://placehold.co/20x20/2a7193/2a7193.png) | `--lcards-blue-medium-dark` / `-30` | `#2a7193` | Canon |
| ![](https://placehold.co/20x20/37a6d1/37a6d1.png) | `--lcards-blue` / `-medium` / `-40` | `#37a6d1` | Canon (base blue) |
| ![](https://placehold.co/20x20/48b2db/48b2db.png) | `--lcards-blue-50` | `#48b2db` | Computed (interpolated) |
| ![](https://placehold.co/20x20/58bee6/58bee6.png) | `--lcards-blue-60` | `#58bee6` | Computed (interpolated) |
| ![](https://placehold.co/20x20/67caf0/67caf0.png) | `--lcards-blue-medium-light` / `-70` | `#67caf0` | Canon |
| ![](https://placehold.co/20x20/93e1ff/93e1ff.png) | `--lcards-blue-light` / `-80` | `#93e1ff` | Canon |
| ![](https://placehold.co/20x20/00eeee/00eeee.png) | `--lcards-blue-lightest` / `-90` | `#00eeee` | Canon — electric cyan-teal accent, **not** a smooth continuation of the ramp (see Shade Scale note below) |
| ![](https://placehold.co/20x20/44ffff/44ffff.png) | `--lcards-blue-95` | `#44ffff` | Computed (extrapolated, neon/electric method — see note below) |

---

### 🟢 Green

| Swatch | CSS Variable | Hex | Notes |
|---|---|---|---|
| ![](https://placehold.co/20x20/0c2a15/0c2a15.png) | `--lcards-green-darkest` / `-05` | `#0c2a15` | Canon |
| ![](https://placehold.co/20x20/0b2e16/0b2e16.png) | `--lcards-green-10` | `#0b2e16` | Computed (interpolated) |
| ![](https://placehold.co/20x20/083717/083717.png) | `--lcards-green-dark` / `-20` | `#083717` | Canon |
| ![](https://placehold.co/20x20/095320/095320.png) | `--lcards-green-medium-dark` / `-30` | `#095320` | Canon |
| ![](https://placehold.co/20x20/266239/266239.png) | `--lcards-green` / `-medium` / `-40` | `#266239` | Canon (base green) |
| ![](https://placehold.co/20x20/306d43/306d43.png) | `--lcards-green-50` | `#306d43` | Computed (interpolated) |
| ![](https://placehold.co/20x20/3b784e/3b784e.png) | `--lcards-green-60` | `#3b784e` | Computed (interpolated) |
| ![](https://placehold.co/20x20/458359/458359.png) | `--lcards-green-medium-light` / `-70` | `#458359` | Canon |
| ![](https://placehold.co/20x20/80bb93/80bb93.png) | `--lcards-green-light` / `-80` | `#80bb93` | Canon |
| ![](https://placehold.co/20x20/b8e0c1/b8e0c1.png) | `--lcards-green-lightest` / `-90` | `#b8e0c1` | Canon |
| ![](https://placehold.co/20x20/cdf6d6/cdf6d6.png) | `--lcards-green-95` | `#cdf6d6` | Computed (extrapolated) |

---

### 🟡 Yellow

| Swatch | CSS Variable | Hex | Notes |
|---|---|---|---|
| ![](https://placehold.co/20x20/70602c/70602c.png) | `--lcards-yellow-darkest` / `-05` | `#70602c` | Canon |
| ![](https://placehold.co/20x20/847131/847131.png) | `--lcards-yellow-10` | `#847131` | Computed (interpolated) |
| ![](https://placehold.co/20x20/ac943b/ac943b.png) | `--lcards-yellow-dark` / `-20` | `#ac943b` | Canon |
| ![](https://placehold.co/20x20/d2bf50/d2bf50.png) | `--lcards-yellow-medium-dark` / `-30` | `#d2bf50` | Canon |
| ![](https://placehold.co/20x20/f9ef97/f9ef97.png) | `--lcards-yellow` / `-medium` / `-40` | `#f9ef97` | Canon (base yellow) |
| ![](https://placehold.co/20x20/fbf3a8/fbf3a8.png) | `--lcards-yellow-50` | `#fbf3a8` | Computed (interpolated) |
| ![](https://placehold.co/20x20/fdf6b9/fdf6b9.png) | `--lcards-yellow-60` | `#fdf6b9` | Computed (interpolated) |
| ![](https://placehold.co/20x20/fffac9/fffac9.png) | `--lcards-yellow-medium-light` / `-70` | `#fffac9` | Canon |
| ![](https://placehold.co/20x20/e7e6de/e7e6de.png) | `--lcards-yellow-light` / `-80` | `#e7e6de` | Canon — desaturates toward beige, **not** a smooth continuation of the ramp (see Shade Scale note below) |
| ![](https://placehold.co/20x20/f5f5dc/f5f5dc.png) | `--lcards-yellow-lightest` / `-90` | `#f5f5dc` | Canon — warm white / cream |
| ![](https://placehold.co/20x20/fbfbe2/fbfbe2.png) | `--lcards-yellow-95` | `#fbfbe2` | Computed (extrapolated) |

---

### Shade Scale

Each colour family carries **two parallel naming schemes** for the same 11-stop scale, which lines up 1:1 with Home Assistant's own `--ha-color-<family>-<tone>` tonal system (`05`/`10`/`20`/`30`/`40`/`50`/`60`/`70`/`80`/`90`/`95`):

| Named shade | Numeric tone | Description | Origin |
|---|---|---|---|
| `-darkest` | `-05` | Deepest / near-black tone | **Canon** — hand-picked Picard-screen colour |
| *(none — numeric only)* | `-10` | | Computed — interpolated between `-05` and `-20` |
| `-dark` | `-20` | Dark variant | **Canon** |
| `-medium-dark` | `-30` | Between dark and mid | **Canon** |
| *(base / `-medium`)* | `-40` | Core reference colour — `--lcards-<colour>`, `--lcards-<colour>-medium`, and `--lcards-<colour>-40` all resolve to the same value | **Canon** |
| *(none — numeric only)* | `-50` | | Computed — interpolated between `-40` and `-70` |
| *(none — numeric only)* | `-60` | | Computed — interpolated between `-40` and `-70` |
| `-medium-light` | `-70` | Between mid and light | **Canon** |
| `-light` | `-80` | Light variant | **Canon** |
| `-lightest` | `-90` | Palest tone at the original 7-stop scale | **Canon** |
| *(none — numeric only)* | `-95` | Lightest of all | Computed — extrapolated beyond `-90` using a neon/electric method (holds hue and chroma from `-lightest`, only lightness moves toward white — chosen over a fade-to-white approach because LCARS palettes read as vibrant even at their palest steps) |

**The 7 named/canon stops (`-darkest` through `-lightest`) are the original, hand-authored Picard-screen colours and are never altered.** The 4 numeric-only stops (`-10`, `-50`, `-60`, `-95`) were added later, computed in OKLCH colour space and anchored to the canon values, purely to give Home Assistant's own semantic colour system (`--ha-color-*`) the same 11-stop resolution it expects — see [ha-css-vars.md](../../development/ha-css-vars.md#layer-1--colour-palette-atoms) for how these feed the HA-LCARS Picard theme profiles. Generated by `scripts/generate-lcards-palette-scale.js`.

Not every family's canon stops form a perfectly smooth ramp — blue's `-lightest` is a deliberately vibrant electric-cyan accent rather than a pale tint, and yellow's `-light`/`-lightest` desaturate toward a parchment/beige tone. These are original design choices in the canon palette, not artifacts of the computed stops.

> Gray also includes `--lcards-moonlight` — a near-white warm gray used for text, labels, and chart axes (not part of the 11-stop scale).

---

### Usage

```css
/* Direct reference */
color: var(--lcards-blue-light);

/* Prefer HA-LCARS theme variable, fall back to lcards palette */
color: var(--lcars-orange, var(--lcards-orange-medium));

/* With hex fallback */
color: var(--lcards-orange-medium, #ff6753);
```

---

## HA-LCARS Theme Profiles

LCARdS ships ready-made theme profiles that extend HA-LCARS using the `--lcards-*` palette as the single source of truth. They remap both the HA-LCARS chrome variables and the HA core colour tokens (`--ha-color-*`) so that stock HA components, LCARdS cards, and the HA-LCARS chrome all share the same palette — including alert-mode hue rotations.

→ [HA-LCARS Theme Profiles](../../configuration/ha-lcars-theme-profiles.md)
