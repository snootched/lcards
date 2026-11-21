---
description: "LCARdS themes: theme:colors.ui.primary style tokens, the token namespaces, and the --lcards-* colour palette every page gets, with its shade scale."
moved_anchors:
  example-colors-ui: /core/themes#colors-ui
  usage: /core/themes#lcards-css-colour-palette
---

# Themes

**A theme gives LCARdS cards their default colours, fonts and sizes as named tokens, such as `colors.ui.primary`, that the cards look up when they draw.** It works alongside the HA-LCARS system theme: most colour tokens point at an HA-LCARS variable, with an LCARdS palette colour as the fallback.

- Write `theme:` and a token path in a card's config, and the card takes that value from the active theme instead of a fixed colour.
- LCARdS also adds its own `--lcards-*` colour palette to every page, so `var(--lcards-orange)` works with or without HA-LCARS.
- [Alert modes](../alert-mode#alert-colours) recolour both, so a card that uses theme tokens or palette colours changes with the alert level.

::: tip Find a token
The [Config Panel](../../configuration/index.md#theme-studio)'s Theme Studio lists every token and CSS variable. A card editor's **Main Engineering > Theme** tab shows the tokens that card uses, with a button that copies the `theme:` reference.
:::

## Built-in Themes

**`lcards-default` is the theme LCARdS loads at startup, and today the only one.** Themes come in content packs, so new packs can change the look of every card at once.

- The [Pack Explorer](../../configuration/index.md#pack-explorer) shows every token a theme provides.
- To change a single token without a new theme, use **Token Overrides** in the Theme Studio: for everyone, one user or one device.

| Theme | Description |
|-------|-------------|
| `lcards-default` | The standard LCARS look, built on the HA-LCARS colours with LCARdS fallbacks |

## Using Theme Tokens

**Write `theme:` and a token path as the whole value of a colour or size setting, and the card takes that value from the active theme.** Use it for colours that should follow their role (structure, accent, alert) rather than a fixed shade.

- In a text field's `content`, put the token in braces to write its value into the text: `{theme:colors.ui.primary}` is a [token template](../templates/#token-templates). In a colour or size setting, write it without braces.
- Inside a [colour function](../colours/values#computed-colour-tokens) the prefix is optional: `alpha(colors.ui.primary, 0.4)`.
- The [config checker](../../getting-started/config-checker) warns about a token path that doesn't exist and suggests the closest one.

```yaml live controls
type: custom:lcards-button
entity: light.demo
preset: lozenge
text:
  name:
    show: true
    color: theme:colors.text.onLight
style:
  card:
    color:
      background:
        active: theme:colors.ui.tertiary
        inactive: theme:colors.ui.quaternary
```

| Write | Where | Example |
|-------|-------|---------|
| `theme:<path>` | The whole value of a colour or size setting | `color: theme:colors.ui.primary` |
| `{theme:<path>}` | Inside text, as a template | `content: "SIZE {theme:typography.fontSize.base}"` |
| `<path>` | Inside a colour function | `background: alpha(colors.ui.primary, 0.4)` |

## Token Namespaces

**Tokens are grouped by what they set: colours, type, borders, effects, and the defaults of each card.** The Theme Studio lists them all; a card editor's **Main Engineering > Theme** tab lists the ones that card uses.

| Namespace | What it holds | Example |
|-----------|---------------|---------|
| `colors` | Colours by role: `text`, `ui`, `card`, `status`, `chart`, `alert`, `grid` | `colors.alert.red` |
| `typography` | Font family, sizes, weights and text transform | `typography.fontSize.base` (`14`) |
| `borders` | Border widths and corner radii | `borders.radius.lg` (`8`) |
| `effects` | Opacity steps for states such as inactive and unavailable | `effects.opacity.inactive` (`0.7`) |
| `components` | Each card's own defaults: `button`, `elbow`, `slider`, `chart`, `line`, `alert`, `dpad`, `backgroundAnimation` | `components.button.background.active` |

### colors.ui

**The four structure colours of an LCARS screen, by role.** In `lcards-default` each takes the HA-LCARS theme colour, and falls back to an LCARdS palette colour without HA-LCARS.

| Token | `lcards-default` value |
|-------|---------|
| `colors.ui.primary` | `var(--lcars-ui-primary, var(--lcards-gray-medium))` |
| `colors.ui.secondary` | `var(--lcars-ui-secondary, var(--lcards-gray-medium-light))` |
| `colors.ui.tertiary` | `var(--lcars-ui-tertiary, var(--lcards-orange-medium-dark))` |
| `colors.ui.quaternary` | `var(--lcars-ui-quaternary, var(--lcards-gray-dark))` |

## LCARdS CSS Colour Palette

**LCARdS adds `--lcards-<colour>-<shade>` CSS variables to every page at startup: five colour families of twelve names each, plus `--lcards-moonlight`.** They work anywhere a CSS colour does, and don't need to be in your HA-LCARS theme.

- The base colour has two names: `--lcards-orange` and `--lcards-orange-medium` are the same colour.
- The colours below are the normal (green alert) values. In an [alert mode](../alert-mode#alert-colours) every variable shifts with it, so you never change your references.
- To follow the HA-LCARS theme where there is one, name its colour first and the palette as the fallback: `var(--lcars-orange, var(--lcards-orange))`.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  label:
    show: true
    content: PALETTE
    color: var(--lcards-blue-darkest)
style:
  card:
    color:
      background: var(--lcars-blue, var(--lcards-blue-light))
  border:
    color: var(--lcards-orange)
    width: 3
```

### Orange

| Swatch | CSS variable | Tone | Hex | Notes |
|---|---|---|---|---|
| ![](https://placehold.co/20x20/d91604/d91604.png) | `--lcards-orange-darkest` | 05 | `#d91604` | Canon |
| ![](https://placehold.co/20x20/e01808/e01808.png) | `--lcards-orange-10` | 10 | `#e01808` | Computed (interpolated) |
| ![](https://placehold.co/20x20/ef1d10/ef1d10.png) | `--lcards-orange-dark` | 20 | `#ef1d10` | Canon |
| ![](https://placehold.co/20x20/e7442a/e7442a.png) | `--lcards-orange-medium-dark` | 30 | `#e7442a` | Canon |
| ![](https://placehold.co/20x20/ff6753/ff6753.png) | `--lcards-orange`, `--lcards-orange-medium` | 40 | `#ff6753` | Canon (base orange) |
| ![](https://placehold.co/20x20/ff715d/ff715d.png) | `--lcards-orange-50` | 50 | `#ff715d` | Computed (interpolated) |
| ![](https://placehold.co/20x20/ff7b66/ff7b66.png) | `--lcards-orange-60` | 60 | `#ff7b66` | Computed (interpolated) |
| ![](https://placehold.co/20x20/ff8470/ff8470.png) | `--lcards-orange-medium-light` | 70 | `#ff8470` | Canon |
| ![](https://placehold.co/20x20/ff977b/ff977b.png) | `--lcards-orange-light` | 80 | `#ff977b` | Canon |
| ![](https://placehold.co/20x20/ffb399/ffb399.png) | `--lcards-orange-lightest` | 90 | `#ffb399` | Canon |
| ![](https://placehold.co/20x20/ffceb3/ffceb3.png) | `--lcards-orange-95` | 95 | `#ffceb3` | Computed (extrapolated) |

### Gray

| Swatch | CSS variable | Tone | Hex | Notes |
|---|---|---|---|---|
| ![](https://placehold.co/20x20/1e2229/1e2229.png) | `--lcards-gray-darkest` | 05 | `#1e2229` | Canon |
| ![](https://placehold.co/20x20/232933/232933.png) | `--lcards-gray-10` | 10 | `#232933` | Computed (interpolated) |
| ![](https://placehold.co/20x20/2f3749/2f3749.png) | `--lcards-gray-dark` | 20 | `#2f3749` | Canon |
| ![](https://placehold.co/20x20/52596e/52596e.png) | `--lcards-gray-medium-dark` | 30 | `#52596e` | Canon |
| ![](https://placehold.co/20x20/6d748c/6d748c.png) | `--lcards-gray`, `--lcards-gray-medium` | 40 | `#6d748c` | Canon (base gray) |
| ![](https://placehold.co/20x20/7d849b/7d849b.png) | `--lcards-gray-50` | 50 | `#7d849b` | Computed (interpolated) |
| ![](https://placehold.co/20x20/8d94aa/8d94aa.png) | `--lcards-gray-60` | 60 | `#8d94aa` | Computed (interpolated) |
| ![](https://placehold.co/20x20/9ea5ba/9ea5ba.png) | `--lcards-gray-medium-light` | 70 | `#9ea5ba` | Canon |
| ![](https://placehold.co/20x20/d2d5df/d2d5df.png) | `--lcards-gray-light` | 80 | `#d2d5df` | Canon |
| ![](https://placehold.co/20x20/f3f4f7/f3f4f7.png) | `--lcards-gray-lightest` | 90 | `#f3f4f7` | Canon |
| ![](https://placehold.co/20x20/f8f9fc/f8f9fc.png) | `--lcards-gray-95` | 95 | `#f8f9fc` | Computed (extrapolated) |
| ![](https://placehold.co/20x20/dfe1e8/dfe1e8.png) | `--lcards-moonlight` | - | `#dfe1e8` | Near-white, for text and labels (not part of the scale) |

### Blue

| Swatch | CSS variable | Tone | Hex | Notes |
|---|---|---|---|---|
| ![](https://placehold.co/20x20/002241/002241.png) | `--lcards-blue-darkest` | 05 | `#002241` | Canon |
| ![](https://placehold.co/20x20/082b48/082b48.png) | `--lcards-blue-10` | 10 | `#082b48` | Computed (interpolated) |
| ![](https://placehold.co/20x20/1c3c55/1c3c55.png) | `--lcards-blue-dark` | 20 | `#1c3c55` | Canon |
| ![](https://placehold.co/20x20/2a7193/2a7193.png) | `--lcards-blue-medium-dark` | 30 | `#2a7193` | Canon |
| ![](https://placehold.co/20x20/37a6d1/37a6d1.png) | `--lcards-blue`, `--lcards-blue-medium` | 40 | `#37a6d1` | Canon (base blue) |
| ![](https://placehold.co/20x20/48b2db/48b2db.png) | `--lcards-blue-50` | 50 | `#48b2db` | Computed (interpolated) |
| ![](https://placehold.co/20x20/58bee6/58bee6.png) | `--lcards-blue-60` | 60 | `#58bee6` | Computed (interpolated) |
| ![](https://placehold.co/20x20/67caf0/67caf0.png) | `--lcards-blue-medium-light` | 70 | `#67caf0` | Canon |
| ![](https://placehold.co/20x20/93e1ff/93e1ff.png) | `--lcards-blue-light` | 80 | `#93e1ff` | Canon |
| ![](https://placehold.co/20x20/00eeee/00eeee.png) | `--lcards-blue-lightest` | 90 | `#00eeee` | Canon: an electric cyan accent, not a pale tint (see [Shade Scale](#shade-scale)) |
| ![](https://placehold.co/20x20/44ffff/44ffff.png) | `--lcards-blue-95` | 95 | `#44ffff` | Computed (extrapolated) |

### Green

| Swatch | CSS variable | Tone | Hex | Notes |
|---|---|---|---|---|
| ![](https://placehold.co/20x20/0c2a15/0c2a15.png) | `--lcards-green-darkest` | 05 | `#0c2a15` | Canon |
| ![](https://placehold.co/20x20/0b2e16/0b2e16.png) | `--lcards-green-10` | 10 | `#0b2e16` | Computed (interpolated) |
| ![](https://placehold.co/20x20/083717/083717.png) | `--lcards-green-dark` | 20 | `#083717` | Canon |
| ![](https://placehold.co/20x20/095320/095320.png) | `--lcards-green-medium-dark` | 30 | `#095320` | Canon |
| ![](https://placehold.co/20x20/266239/266239.png) | `--lcards-green`, `--lcards-green-medium` | 40 | `#266239` | Canon (base green) |
| ![](https://placehold.co/20x20/306d43/306d43.png) | `--lcards-green-50` | 50 | `#306d43` | Computed (interpolated) |
| ![](https://placehold.co/20x20/3b784e/3b784e.png) | `--lcards-green-60` | 60 | `#3b784e` | Computed (interpolated) |
| ![](https://placehold.co/20x20/458359/458359.png) | `--lcards-green-medium-light` | 70 | `#458359` | Canon |
| ![](https://placehold.co/20x20/80bb93/80bb93.png) | `--lcards-green-light` | 80 | `#80bb93` | Canon |
| ![](https://placehold.co/20x20/b8e0c1/b8e0c1.png) | `--lcards-green-lightest` | 90 | `#b8e0c1` | Canon |
| ![](https://placehold.co/20x20/cdf6d6/cdf6d6.png) | `--lcards-green-95` | 95 | `#cdf6d6` | Computed (extrapolated) |

### Yellow

| Swatch | CSS variable | Tone | Hex | Notes |
|---|---|---|---|---|
| ![](https://placehold.co/20x20/70602c/70602c.png) | `--lcards-yellow-darkest` | 05 | `#70602c` | Canon |
| ![](https://placehold.co/20x20/847131/847131.png) | `--lcards-yellow-10` | 10 | `#847131` | Computed (interpolated) |
| ![](https://placehold.co/20x20/ac943b/ac943b.png) | `--lcards-yellow-dark` | 20 | `#ac943b` | Canon |
| ![](https://placehold.co/20x20/d2bf50/d2bf50.png) | `--lcards-yellow-medium-dark` | 30 | `#d2bf50` | Canon |
| ![](https://placehold.co/20x20/f9ef97/f9ef97.png) | `--lcards-yellow`, `--lcards-yellow-medium` | 40 | `#f9ef97` | Canon (base yellow) |
| ![](https://placehold.co/20x20/fbf3a8/fbf3a8.png) | `--lcards-yellow-50` | 50 | `#fbf3a8` | Computed (interpolated) |
| ![](https://placehold.co/20x20/fdf6b9/fdf6b9.png) | `--lcards-yellow-60` | 60 | `#fdf6b9` | Computed (interpolated) |
| ![](https://placehold.co/20x20/fffac9/fffac9.png) | `--lcards-yellow-medium-light` | 70 | `#fffac9` | Canon |
| ![](https://placehold.co/20x20/e7e6de/e7e6de.png) | `--lcards-yellow-light` | 80 | `#e7e6de` | Canon: turns toward beige, not a smooth step (see [Shade Scale](#shade-scale)) |
| ![](https://placehold.co/20x20/f5f5dc/f5f5dc.png) | `--lcards-yellow-lightest` | 90 | `#f5f5dc` | Canon: warm white, cream |
| ![](https://placehold.co/20x20/fbfbe2/fbfbe2.png) | `--lcards-yellow-95` | 95 | `#fbfbe2` | Computed (extrapolated) |

### Shade Scale

**Each family has eleven shades, from darkest to lightest, matching the eleven tones of Home Assistant's own colour scale (`--ha-color-<family>-05` to `-95`).** The Tone column above says which tone a shade fills.

- The seven canon shades have names: `-darkest`, `-dark`, `-medium-dark`, the base colour, `-medium-light`, `-light` and `-lightest`. They are the original hand-picked Picard-screen colours and are never changed.
- The four computed shades in between have numbers only: `-10`, `-50`, `-60` and `-95`. The canon shades have no numeric names: write `--lcards-orange-dark`, not `--lcards-orange-20`.
- Not every family is a smooth ramp: blue's `-lightest` is a vivid electric cyan, and yellow's `-light` and `-lightest` turn toward parchment. These are choices in the canon palette, not slips in the computed shades.

| Shade | Tone | Origin |
|---|---|---|
| `-darkest` | 05 | Canon: the deepest, near-black tone |
| `-10` | 10 | Computed: between `-darkest` and `-dark` |
| `-dark` | 20 | Canon |
| `-medium-dark` | 30 | Canon |
| base, `-medium` | 40 | Canon: the core colour (`--lcards-<colour>`) |
| `-50` | 50 | Computed: between the base and `-medium-light` |
| `-60` | 60 | Computed: between the base and `-medium-light` |
| `-medium-light` | 70 | Canon |
| `-light` | 80 | Canon |
| `-lightest` | 90 | Canon: the palest of the original seven |
| `-95` | 95 | Computed: beyond `-lightest` |

::: details More about the computed shades
- **How they were made:** in OKLCH colour space, anchored to the canon shades, so that Home Assistant's colour system gets the eleven steps it expects. `scripts/generate-lcards-palette-scale.js` generates them.
- **The palest step:** `-95` keeps the hue and chroma of `-lightest` and only moves the lightness toward white, rather than fading to white, because LCARS palettes stay vivid even at their palest.
- **Where they are used:** the HA-LCARS LCARdS theme profiles map the whole scale onto Home Assistant's `--ha-color-*` tokens; see [ha-css-vars.md](../../development/ha-css-vars.md#layer-1-colour-palette-atoms).
:::

## HA-LCARS Theme Profiles

**HA-LCARS includes two LCARdS theme profiles that use the `--lcards-*` palette as their single source of colour.** They remap the HA-LCARS chrome variables and Home Assistant's own colour tokens (`--ha-color-*`), so stock Home Assistant components, LCARdS cards and the HA-LCARS chrome share one palette, alert-mode colour shifts included.

→ [HA-LCARS Theme Profiles](../../configuration/ha-lcars-theme-profiles.md)
