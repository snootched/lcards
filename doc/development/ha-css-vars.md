# Home Assistant CSS Variable Reference

> **Home Assistant 2026.11 or later.** LCARdS refuses to load on anything older (`MIN_HA_VERSION` in `custom_components/lcards/const.py:9`), so every variable on this page is available to LCARdS code. Values are read from the Home Assistant frontend source, `src/resources/theme/` ([on GitHub](https://github.com/home-assistant/frontend/tree/dev/src/resources/theme)); `file:line` citations refer to frontend `20261028.2`, the 2026.11 release line.

This page is the one reference for Home Assistant CSS variables in LCARdS: what each variable is called, the value it has in the default Home Assistant theme (light and dark), and the rules LCARdS code follows when it uses them. `CLAUDE.md` and `.github/instructions/editor.instructions.md` keep only the short rules and link here.

It does not track which LCARdS files use which variable. Search the code for that (`grep -rn "var(--ha-space-" src/`).

---

## Variable Sources

All paths are under `src/resources/theme/` in the frontend checkout. `theme.ts:13-22` joins them into one stylesheet in this order, so a later file wins when two set the same variable on `html`.

| Source file | Category |
|---|---|
| `core.globals.ts` | Border width, border radius (including picture radius), spacing, motion |
| `main.globals.ts` | Header height, opacities, direction, safe-area insets, dialog scrim, scrollbar |
| `typography.globals.ts` | Font families, sizes, weights, line heights, font smoothing |
| `semantic.globals.ts` | Box shadows (light and dark) |
| `color/core.globals.ts` | Colour palette atoms |
| `color/semantic.globals.ts` | Semantic colour tokens: text, borders, fills, on-colours, surfaces, forms (light and dark) |
| `color/color.globals.ts` | Legacy semantic variables that themes override (`--primary-color` and friends), light and dark |
| `color/wa.globals.ts` | WebAwesome colour aliases |
| `wa.globals.ts` | WebAwesome non-colour aliases: focus ring, spacing, borders, radii, font sizes, shadows, form controls |
| `animations.globals.ts` | Keyframes (`fade-in`, `fade-out`, `scale`), no variables |

**Dark mode.** The dark values come from `darkSemanticStyles` (`semantic.globals.ts:16`), `darkSemanticColorStyles` (`color/semantic.globals.ts:182`) and `darkColorStyles` (`color/color.globals.ts:341`). Home Assistant applies them as theme variables when the dark mode is active (`src/common/dom/apply_themes_on_element.ts:56`), not through a media query. A variable without a dark entry keeps its light value; the tables below say "same".

### Theme variables, not globals

Some variables that look global are not defined by any globals file. Home Assistant components read them with a fallback, and only a theme sets them. Always give the fallback when you read one.

| Variable | Read by | Fallback there |
|---|---|---|
| `--ha-card-background` | `ha-card` (`src/components/ha-card.ts:12-15`) | `var(--card-background-color, white)` |
| `--ha-card-border-radius` | `ha-card` (`ha-card.ts:19`) and many `hui-*` cards | `var(--ha-border-radius-lg)` (12px) |
| `--ha-card-border-width` | `ha-card` (`ha-card.ts:20`) | `1px` |
| `--ha-card-border-color` | `ha-card` (`ha-card.ts:22`) | `var(--divider-color, #e0e0e0)` |
| `--ha-card-box-shadow` | `ha-card` (`ha-card.ts:17`) | `none` |
| `--ha-card-header-color`, `--ha-card-header-font-family`, `--ha-card-header-font-size` | `ha-card` header (`ha-card.ts:41-43`) | `var(--primary-text-color)`, `inherit`, `var(--ha-font-size-2xl)` |
| `--code-font-family` | `ha-assist-chat.ts:937` | `monospace` (the global is `--ha-font-family-code`) |
| `--code-editor-background-color` | `ha-code-editor.ts:1915`, `codemirror.ts:265` | `var(--card-background-color)` |
| `--text-accent-color` | `ha-sidebar.ts:860` | `var(--text-primary-color)` |
| `--ha-dialog-surface-background` | `--wa-color-surface-raised` (`color/wa.globals.ts:59`) | `var(--mdc-theme-surface, #fff)` |

HA-LCARS sets `ha-card-border-radius: var(--lcars-outer-radius)`, `ha-card-border-width: 0px` and `text-accent-color` in its base theme (`yaml/theme/ha-lcars-all-themes.yaml`, the `&base` block).

---

## Motion

**Source:** `core.globals.ts:47-61`. All five collapse to `1ms` under `prefers-reduced-motion: reduce` (`core.globals.ts:54-62`), so using them gives reduced-motion support for free.

| Variable | Value |
|---|---|
| `--ha-animation-duration-none` | `1ms` |
| `--ha-animation-duration-instant` | `75ms` |
| `--ha-animation-duration-fast` | `150ms` |
| `--ha-animation-duration-normal` | `250ms` |
| `--ha-animation-duration-slow` | `350ms` |

```css
/* Exact match: no fallback needed */
transition: all var(--ha-animation-duration-fast);

/* Approximate match: keep the original duration as the fallback */
transition: all var(--ha-animation-duration-normal, 0.2s);
transition: max-height var(--ha-animation-duration-slow, 0.3s);
```

---

## Border Radius

**Source:** `core.globals.ts:10-23`.

| Variable | Value | Common use |
|---|---|---|
| `--ha-border-radius-square` | `0` | Flat containers |
| `--ha-border-radius-sm` | `4px` | Tags, badges, inline code |
| `--ha-border-radius-md` | `8px` | Toolbars, form containers |
| `--ha-border-radius-lg` | `12px` | The `ha-card` fallback when a theme sets no `--ha-card-border-radius` |
| `--ha-border-radius-xl` | `16px` | |
| `--ha-border-radius-2xl` | `20px` | |
| `--ha-border-radius-3xl` | `24px` | Expansion panels, `--wa-panel-border-radius` |
| `--ha-border-radius-4xl` | `28px` | |
| `--ha-border-radius-5xl` | `32px` | |
| `--ha-border-radius-6xl` | `36px` | |
| `--ha-border-radius-pill` | `9999px` | Chips, pills |
| `--ha-border-radius-circle` | `50%` | Avatars, circular buttons |
| `--ha-picture-border-radius` | `var(--ha-border-radius-lg)` | Entity pictures, person and badge images (`ha-badge.ts:135`, `state-badge.ts:271`) |
| `--ha-picture-border-radius-sm` | `var(--ha-border-radius-sm)` | Small pictures (`ha-related-items.ts:576`) |

No Home Assistant variable for 3px, 6px, 10px or 22px: leave those hardcoded.

LCARdS expansion panels use `var(--ha-card-border-radius, var(--ha-border-radius-3xl))`, so the HA-LCARS card radius applies when that theme is active.

---

## Border Width

**Source:** `core.globals.ts:6-8`.

| Variable | Value |
|---|---|
| `--ha-border-width-sm` | `1px` |
| `--ha-border-width-md` | `2px` |
| `--ha-border-width-lg` | `3px` |

```css
border: var(--ha-border-width-sm) solid var(--divider-color);
border: var(--ha-border-width-md) solid var(--primary-color);
```

---

## Spacing

**Source:** `core.globals.ts:26-45`. `--ha-space-N` is N × 4px, for N from 1 to 20.

| Variable | Value | Variable | Value |
|---|---|---|---|
| `--ha-space-1` | `4px` | `--ha-space-11` | `44px` |
| `--ha-space-2` | `8px` | `--ha-space-12` | `48px` |
| `--ha-space-3` | `12px` | `--ha-space-13` | `52px` |
| `--ha-space-4` | `16px` | `--ha-space-14` | `56px` |
| `--ha-space-5` | `20px` | `--ha-space-15` | `60px` |
| `--ha-space-6` | `24px` | `--ha-space-16` | `64px` |
| `--ha-space-7` | `28px` | `--ha-space-17` | `68px` |
| `--ha-space-8` | `32px` | `--ha-space-18` | `72px` |
| `--ha-space-9` | `36px` | `--ha-space-19` | `76px` |
| `--ha-space-10` | `40px` | `--ha-space-20` | `80px` |

No Home Assistant variable for 2px, 6px, 10px, 14px or 18px: leave those hardcoded. A shorthand that mixes the two (`padding: 2px 8px`) stays as it is or is split into separate properties.

---

## Typography

**Source:** `typography.globals.ts`. Font sizes are `calc(Npx * var(--ha-font-size-scale))` with `--ha-font-size-scale: 1` (`typography.globals.ts:11-20`), so they follow the user's font scale.

### Font Size

| Variable | Value at scale 1 |
|---|---|
| `--ha-font-size-xs` | `10px` |
| `--ha-font-size-s` | `12px` |
| `--ha-font-size-m` | `14px` |
| `--ha-font-size-l` | `16px` |
| `--ha-font-size-xl` | `20px` |
| `--ha-font-size-2xl` | `24px` |
| `--ha-font-size-3xl` | `28px` |
| `--ha-font-size-4xl` | `32px` |
| `--ha-font-size-5xl` | `40px` |

No Home Assistant variable for 13px or 18px. Panel files that use `em` / `rem` for relative scaling are fine as they are. The root font size is `14px` (`typography.globals.ts:10`).

### Font Weight

**Source:** `typography.globals.ts:22-30`.

| Variable | Value |
|---|---|
| `--ha-font-weight-light` | `300` |
| `--ha-font-weight-normal` | `400` |
| `--ha-font-weight-medium` | `500` |
| `--ha-font-weight-bold` | `700` |
| `--ha-font-weight-body` | `var(--ha-font-weight-normal)` |
| `--ha-font-weight-heading` | `var(--ha-font-weight-bold)` |
| `--ha-font-weight-action` | `var(--ha-font-weight-medium)` (buttons) |

No Home Assistant variable for 600.

### Font Family

**Source:** `typography.globals.ts:6-8, 27`.

| Variable | Value |
|---|---|
| `--ha-font-family-body` | `Roboto, Noto, sans-serif` |
| `--ha-font-family-heading` | `var(--ha-font-family-body)` |
| `--ha-font-family-code` | `monospace` |
| `--ha-font-family-longform` | `ui-sans-serif, system-ui, sans-serif` |

HA-LCARS sets `ha-font-family-body: var(--font-family)`, its LCARS font stack, in the `&base` block, so every Home Assistant component picks it up. A host element that does not inherit `--ha-font-family-body` shows Roboto next to LCARS labels.

### Line Height and Smoothing

**Source:** `typography.globals.ts:32-37`.

| Variable | Value |
|---|---|
| `--ha-line-height-condensed` | `1.2` |
| `--ha-line-height-normal` | `1.6` |
| `--ha-line-height-expanded` | `2` |
| `--ha-font-smoothing` | `antialiased` (for `-webkit-font-smoothing`, `src/resources/styles.ts:20`) |
| `--ha-moz-osx-font-smoothing` | `grayscale` (for `-moz-osx-font-smoothing`) |

---

## Elevation / Box Shadow

**Source:** `semantic.globals.ts:10-12` (light), `:18-20` (dark).

| Variable | Light | Dark |
|---|---|---|
| `--ha-box-shadow-s` | `0 1px 2px 0 rgba(0,0,0,0.08), 0 1px 3px 0 rgba(0,0,0,0.12)` | same offsets, opacity `0.4` / `0.5` |
| `--ha-box-shadow-m` | `0 3px 6px -1px rgba(0,0,0,0.1), 0 8px 16px -2px rgba(0,0,0,0.15)` | same offsets, opacity `0.35` / `0.45` |
| `--ha-box-shadow-l` | `0 6px 12px -3px rgba(0,0,0,0.12), 0 16px 32px -6px rgba(0,0,0,0.2)` | same offsets, opacity `0.4` / `0.55` |

`--wa-shadow-s/m/l` alias these (`wa.globals.ts:37-39`). `color/wa.globals.ts:66` also sets `--wa-shadow-l` to `4px 8px 12px 0 rgba(0, 0, 0, 0.3)`, but `wa.globals.ts` loads later (`theme.ts:20`), so `--wa-shadow-l` is `var(--ha-box-shadow-l)`.

---

## Layout / App Shell

**Source:** `main.globals.ts`.

| Variable | Value | Use |
|---|---|---|
| `--header-height` | `56px` (`:9`) | Top app bar height (HA-LCARS sets `40px`) |
| `--dark-divider-opacity` | `0.12` (`:12`) | Dark text on a light background |
| `--dark-disabled-opacity` | `0.38` | |
| `--dark-secondary-opacity` | `0.54` | |
| `--dark-primary-opacity` | `0.87` | |
| `--light-divider-opacity` | `0.12` (`:18`) | Light text on a dark background |
| `--light-disabled-opacity` | `0.3` | |
| `--light-secondary-opacity` | `0.7` | |
| `--light-primary-opacity` | `1` | |
| `--direction` | `ltr` (`:24`) | Text direction |
| `--float-start` / `--float-end` | `left` / `right` | |
| `--margin-title-ltr` / `--margin-title-rtl` | `0 0 0 24px` / `0 24px 0 0` | |
| `--ha-dialog-scrim-backdrop-filter` | `brightness(68%)` (`:53`) | Modal backdrop |

### Safe Area

**Source:** `main.globals.ts:31-50`. For layouts that must stay clear of notches and home indicators (full-screen dialogs, overlays). Each `--safe-area-inset-*` reads `--app-safe-area-inset-*` first (set by the companion apps), then `env(safe-area-inset-*, 0px)`.

| Variable | Value |
|---|---|
| `--safe-area-inset-top`, `-bottom`, `-left`, `-right` | `var(--app-safe-area-inset-<side>, env(safe-area-inset-<side>, 0px))` |
| `--safe-area-inset-x` | left + right |
| `--safe-area-inset-y` | top + bottom |
| `--safe-area-offset-left`, `-right`, `-top`, `-bottom` | Half the difference between opposite insets (0 if negative), for centring in an asymmetric safe area |
| `--safe-width` | `calc(100vw - left inset - right inset)`: use instead of `100vw` |
| `--safe-height` | `calc(100vh - top inset - bottom inset)`: use instead of `100vh` |

---

## WebAwesome Aliases (Non-Colour)

**Source:** `wa.globals.ts:6-48`. Home Assistant's `ha-*` components are built on WebAwesome; these map WebAwesome's variables onto Home Assistant's. Use the `--ha-*` names in LCARdS CSS; the `--wa-*` names are for styling inside WebAwesome components (`wa-button-group`, `wa-*` parts).

| Variable | Value |
|---|---|
| `--wa-focus-ring-style` / `-width` / `-offset` | `solid` / `2px` / `2px` |
| `--wa-focus-ring` | `var(--wa-focus-ring-style) var(--wa-focus-ring-width) var(--wa-focus-ring-color)` |
| `--wa-space-xs` / `-m` / `-l` / `-xl` | `var(--ha-space-2)` / `-4` / `-6` / `-8` |
| `--wa-font-weight-action` / `-body` | `var(--ha-font-weight-medium)` / `var(--ha-font-weight-normal)` |
| `--wa-transition-normal` / `-fast` | `var(--ha-animation-duration-fast)` / `var(--ha-animation-duration-instant)` |
| `--wa-transition-easing` | `ease` |
| `--wa-border-style` | `solid` |
| `--wa-border-width-s` / `-m` / `-l` | `var(--ha-border-width-sm)` / `-md` / `-lg` |
| `--wa-border-radius-s` / `-m` / `-l` / `-pill` | `var(--ha-border-radius-sm)` / `-md` / `-lg` / `-pill` |
| `--wa-line-height-condensed` | `var(--ha-line-height-condensed)` |
| `--wa-font-size-s` / `-m` / `-l` | `var(--ha-font-size-s)` / `-m` / `-l` |
| `--wa-shadow-s` / `-m` / `-l` | `var(--ha-box-shadow-s)` / `-m` / `-l` |
| `--wa-form-control-padding-block` | `0.75em` |
| `--wa-form-control-value-line-height` | `var(--wa-line-height-condensed)` |
| `--wa-form-control-value-font-weight` | `var(--wa-font-weight-body)` |
| `--wa-form-control-border-radius` | `var(--wa-border-radius-l)` |
| `--wa-form-control-border-style` / `-width` | `var(--wa-border-style)` / `var(--wa-border-width-s)` |
| `--wa-form-control-height` | `40px` |
| `--wa-form-control-padding-inline` | `var(--ha-space-3)` |

---

## Colour System

Home Assistant uses three colour layers:

```
Palette atoms  →  Semantic tokens  →  Legacy semantic vars
(--ha-color-primary-40)   (--ha-color-fill-primary-loud-resting)   (--primary-color)
```

A theme that overrides the palette atoms changes the semantic tokens too, since they reference the atoms. A theme that sets the legacy variables changes both old and new Home Assistant components (`--primary-text-color` is itself `var(--ha-color-text-primary)` in light mode).

---

### Layer 1: Colour Palette Atoms

**Source:** `color/core.globals.ts:14-80`. Raw colour scales, 11 stops each, dark (`05`) to light (`95`). Home Assistant's own comment (`:9`) says not to use them directly in components: use the semantic tokens. Theme authors override them to remap Home Assistant's whole palette.

| Stop | `primary` | `neutral` | `orange` | `red` | `green` |
|---|---|---|---|---|---|
| `05` | `#001721` | `#141414` | `#280700` | `#2a040b` | `#031608` |
| `10` | `#002e3e` | `#202020` | `#3b0f00` | `#3e0913` | `#052310` |
| `20` | `#004156` | `#363636` | `#5e1c00` | `#631323` | `#0a3a1d` |
| `30` | `#006787` | `#4a4a4a` | `#7e2900` | `#8a132c` | `#0a5027` |
| `40` | `#009ac7` | `#5e5e5e` | `#9d3800` | `#b30532` | `#036730` |
| `50` | `#18bcf2` | `#7a7a7a` | `#c94e00` | `#dc3146` | `#00883c` |
| `60` | `#37c8fd` | `#989898` | `#f36d00` | `#f3676c` | `#00ac49` |
| `70` | `#7bd4fb` | `#b1b1b1` | `#ff9342` | `#fd8f90` | `#5dc36f` |
| `80` | `#b9e6fc` | `#cccccc` | `#ffbb89` | `#ffb8b6` | `#93da98` |
| `90` | `#dff3fc` | `#e6e6e6` | `#ffe0c8` | `#ffdedc` | `#c2f2c1` |
| `95` | `#eff9fe` | `#f3f3f3` | `#fff0e4` | `#fff0ef` | `#e3f9e3` |

The variables are `--ha-color-<palette>-<stop>`, plus `--ha-color-black: #000000` and `--ha-color-white: #ffffff` (`:14-15`).

**HA-LCARS LCARdS profiles.** On the ha-lcars branch `lcards-semantic-colors` (not merged yet; `master` maps each stop to the nearest LCARdS colour, see [What the HA-LCARS profiles set](#what-the-ha-lcars-profiles-set)), both Picard profiles remap all five palettes 1:1 across the 11 stops, onto LCARdS's own 11-stop scales ([LCARdS Colour Palette](../core/themes/index.md#lcards-css-colour-palette)):

| Home Assistant palette | Red Accent profile | Blue Accent profile |
|---|---|---|
| `--ha-color-primary-*` | `--lcards-orange-*` | `--lcards-blue-*` |
| `--ha-color-neutral-*` | `--lcards-gray-*` | `--lcards-gray-*` |
| `--ha-color-orange-*` | `--lcards-yellow-*` | `--lcards-yellow-*` |
| `--ha-color-red-*` | `--lcards-orange-*` | `--lcards-orange-*` |
| `--ha-color-green-*` | `--lcards-green-*` | `--lcards-green-*` |

**Remapping the palette alone is not enough.** Home Assistant's semantic tokens (Layer 2) assume any hue stays readable at a given tone number. That holds for Home Assistant's generated palettes, not for every hand-picked LCARdS hue (orange has a much narrower usable lightness band than blue). So both profiles also set the whole `on-*`, `fill-*`, `border-*` and `surface-*` layer, each value checked against WCAG contrast; see [What the HA-LCARS profiles set](#what-the-ha-lcars-profiles-set).

---

### Layer 2: Semantic Colour Tokens

**Source:** `color/semantic.globals.ts`: light block `:8-180`, dark block `:182-333`. They reference the palette atoms, so remapping Layer 1 changes them too. Palette atoms are written without the `--ha-color-` prefix below (`neutral-05` is `var(--ha-color-neutral-05)`).

#### Text

| Variable | Light | Dark |
|---|---|---|
| `--ha-color-text-primary` | `neutral-05` (`:13`) | `var(--white-color)` (`:185`) |
| `--ha-color-text-secondary` | `neutral-40` | `neutral-80` |
| `--ha-color-text-disabled` | `neutral-60` | same |
| `--ha-color-text-link` | `primary-40` | `primary-60` |
| `--ha-color-text-primary-inverted` | `var(--ha-color-white)` | `var(--ha-color-black)` |
| `--ha-color-text-secondary-inverted` | `neutral-20` | `neutral-40` |

#### Surfaces

| Variable | Light (`:164-170`) | Dark (`:320-326`) | Use |
|---|---|---|---|
| `--ha-color-surface-default` | `var(--ha-color-white)` | `neutral-10` (`#202020`) | Cards, dialogs |
| `--ha-color-surface-low` | `neutral-95` | `neutral-05` | Raised containers |
| `--ha-color-surface-lower` | `neutral-90` | `var(--ha-color-black)` | Double-raised |
| `--ha-color-surface-default-inverted` | `neutral-10` | `var(--ha-color-white)` | Inverted callouts |
| `--ha-color-surface-low-inverted` | `neutral-05` | `neutral-95` | |
| `--ha-color-surface-lower-inverted` | `var(--ha-color-black)` | `var(--ha-color-90)`, which does not exist (`:325`), so the variable is invalid in dark mode | |
| `--ha-color-on-surface-default` | `neutral-05` | `neutral-95` | Text on `surface-default` |

#### Form Backgrounds

| Variable | Light (`:173-175`) | Dark (`:329-331`) |
|---|---|---|
| `--ha-color-form-background` | `neutral-95` | `neutral-20` |
| `--ha-color-form-background-hover` | `neutral-90` | `neutral-30` |
| `--ha-color-form-background-disabled` | `neutral-80` | `neutral-20` |

#### Borders (`quiet` < `normal` < `loud`)

Fifteen variables: five roles (primary, neutral, danger, warning, success) × three levels. `--ha-color-border-<role>-<level>`, light `:22-44`, dark `:193-206`.

| Role | Light quiet / normal / loud | Dark quiet / normal / loud |
|---|---|---|
| `primary` | `primary-90` / `primary-70` / `primary-40` | same |
| `neutral` | `neutral-90` / `neutral-60` / `neutral-40` | `neutral-40` / `neutral-50` / `neutral-70` |
| `danger` | `red-90` / `red-70` / `red-40` | same / `red-50` / `red-50` |
| `warning` | `orange-90` / `orange-70` / `orange-40` | same / `orange-50` / `orange-50` |
| `success` | `green-90` / `green-70` / `green-40` | same |

#### Fills (interactive backgrounds)

`--ha-color-fill-<role>-<loudness>-<state>`: loudness `quiet` / `normal` / `loud`, state `resting` / `hover` / `active`. Roles `primary`, `neutral`, `disabled`, `danger`, `warning`, `success`; `disabled` has no `active`. Light `:47-131`, dark `:209-288`. Values are tone numbers of the role's palette (`danger` is `red`, `warning` is `orange`, `success` is `green`, `disabled` is `neutral`).

| Role | Loudness | Light resting / hover / active | Dark resting / hover / active |
|---|---|---|---|
| `primary` | quiet | 95 / 90 / 95 | 05 / 10 / 05 |
| `primary` | normal | 90 / 80 / 90 | 10 / 20 / 10 |
| `primary` | loud | 40 / 30 / 40 | same |
| `neutral` | quiet | 95 / 90 / 95 | 05 / 10 / `neutral-00` (does not exist, `:221`) |
| `neutral` | normal | 90 / 80 / 90 | 10 / 20 / 10 |
| `neutral` | loud | 40 / 30 / 40 | 60 / 70 / 60 |
| `disabled` | quiet | 95 / 90 | 10 / 20 |
| `disabled` | normal | 95 / 90 | 20 / 30 |
| `disabled` | loud | 80 / 70 | 30 / 40 |
| `danger` | quiet | 95 / 90 / 95 | 05 / 10 / 05 |
| `danger` | normal | 90 / 80 / 90 | 10 / 20 / 10 |
| `danger` | loud | 50 / 40 / 50 | 40 / 30 / 40 |
| `warning` | quiet | 95 / 90 / 95 | 05 / 10 / 05 |
| `warning` | normal | 90 / 80 / 90 | 10 / 20 / 10 |
| `warning` | loud | 70 / 50 / 70 | 40 / 30 / 40 |
| `success` | quiet | 95 / 90 / 95 | 05 / 10 / 05 |
| `success` | normal | 90 / 80 / 90 | 10 / 20 / 10 |
| `success` | loud | 50 / 40 / 50 | 40 / 30 / 40 |

**`<ha-button>` maps onto this scale**: `appearance="accent"` uses `fill-{role}-loud-resting`, `appearance="filled"` uses `fill-{role}-normal-resting`, through the `--wa-color-*` aliases (`src/components/ha-button.ts:205-240`). Home Assistant's generated ramps make `quiet < normal < loud` a real prominence order; LCARdS's hand-picked canon palette does not guarantee it everywhere (blue's `-lightest` stop is a vivid electric cyan, more saturated than the family's tone-40 anchor). Where that is a confirmed visible problem, swap the tone number for that one (role, mode, tier) cell in the `FILL` table (`src/core/themes/themeGeneratorCore.js:342`), shared by the Theme Generator and `generate-lcards-ha-semantic-tokens.js`. Do not add an automated chroma-clamping pass: an earlier attempt made the real UI worse and was reverted.

#### On-Colours (text on fills)

`--ha-color-on-<role>-<loudness>`, light `:134-161`, dark `:291-317`.

| Role | Light quiet / normal / loud | Dark quiet / normal / loud |
|---|---|---|
| `primary` | `primary-50` / `primary-40` / `var(--white-color)` | `primary-70` / `primary-60` / same |
| `neutral` | `neutral-50` / `neutral-40` / `var(--white-color)` | `neutral-70` / `neutral-60` / `var(--white-color)` |
| `disabled` | `neutral-80` / `neutral-70` / `neutral-95` | `neutral-40` / `neutral-50` / `neutral-50` |
| `danger` | `red-50` / `red-40` / `var(--white-color)` | `red-70` / `red-60` / `var(--white-color)` |
| `warning` | `orange-50` / `orange-40` / `var(--white-color)` | `orange-70` / `orange-60` / `var(--white-color)` |
| `success` | `green-50` / `green-40` / `var(--white-color)` | `green-70` / `green-60` / `var(--white-color)` |

**Not derived from a contrast formula.** These are tone references; Home Assistant computes no WCAG ratio, and `on-*-loud` is `var(--white-color)` for every role whatever the hue underneath. The two LCARdS Picard profiles run each value through `generate-lcards-ha-semantic-tokens.js` instead: the tone-index convention picks a starting value, then WCAG contrast (4.5:1, AA) against the resolved LCARdS colour swaps in white or black where the default fails. See [Regenerating the theme profiles](#regenerating-the-theme-profiles).

#### Other

| Variable | Light | Dark | Use |
|---|---|---|---|
| `--ha-color-focus` | `neutral-60` (`:10`) | same | Focus ring (`--wa-focus-ring-color`) |
| `--ha-color-shadow-scrollable-fade` | `rgba(0, 0, 0, 0.08)` (`:178`) | same | Scroll shadow gradient |
| `--ha-color-border-normal` | not set | `primary-50` (`:193`) | Set in dark mode only; nothing in the frontend reads it |

---

### Layer 3: Legacy Semantic Variables

**Source:** `color/color.globals.ts`: light `:5-339`, dark `:341-402`. These are the variables Home Assistant theme YAML files set (including HA-LCARS). They feed older Home Assistant components and many new ones.

#### Text

| Variable | Light | Dark |
|---|---|---|
| `--primary-text-color` | `var(--ha-color-text-primary)` (`:8`) | `#e1e1e1` (`:347`) |
| `--secondary-text-color` | `var(--ha-color-text-secondary)` | `#9b9b9b` |
| `--text-primary-color` | `#ffffff`: text on a `--primary-color` background (`:10`) | same |
| `--text-light-primary-color` | `#212121` | same |
| `--disabled-text-color` | `#bdbdbd` (`:12`) | `#6f6f6f` (`:349`) |

#### Main Interface

| Variable | Light | Dark |
|---|---|---|
| `--primary-color` | `var(--ha-color-primary-40)` (`:15`) | same |
| `--dark-primary-color` | `#0288d1` | same |
| `--darker-primary-color` | `#016194` | same |
| `--light-primary-color` | `#b3e5fc` | same |
| `--accent-color` | `#ff9800` (`:19`) | same |
| `--divider-color` | `rgba(0, 0, 0, 0.12)` | `rgba(225, 225, 225, 0.12)` |
| `--outline-color` | `rgba(0, 0, 0, 0.12)` | `rgba(225, 225, 225, 0.12)` |
| `--outline-hover-color` | `rgba(0, 0, 0, 0.24)` | `rgba(225, 225, 225, 0.24)` |
| `--shadow-color` | `rgba(0, 0, 0, 0.16)` | `rgba(0, 0, 0, 0.48)` |
| `--scrollbar-thumb-color` | `rgb(194, 194, 194)` | `rgb(110, 110, 110)` |
| `--disabled-color` | `#bdbdbd` (`:70`) | `#464646` (`:393`) |

#### Backgrounds

| Variable | Light (`:46-49`) | Dark (`:343-346`) |
|---|---|---|
| `--primary-background-color` | `#fafafa` | `#111111` |
| `--secondary-background-color` | `#e5e5e5` | `#282828` |
| `--card-background-color` | `#ffffff` | `#1c1c1c` |
| `--clear-background-color` | `#ffffff` | `#111111` |

#### Status

| Variable | Value (`:40-43`) |
|---|---|
| `--error-color` | `#db4437` |
| `--warning-color` | `#ffa600` |
| `--success-color` | `#43a047` |
| `--info-color` | `#039be5` |

No dark overrides. There are no `--error-background-color`, `--warning-background-color` or `--info-background-color` variables: mix the status colour with `transparent` (see [Useful Patterns](#useful-patterns)).

#### State Indicators

| Variable | Value |
|---|---|
| `--state-icon-color` | `#44739e` (`:55`) |
| `--state-active-color` | `var(--amber-color)` (`:175`) |
| `--state-inactive-color` | `var(--grey-color)` |
| `--state-unavailable-color` | `var(--state-icon-unavailable-color, var(--disabled-text-color))` |
| `--state-icon-error-color` | `var(--error-state-color, var(--error-color))` (`:265`) |

#### Domain State Colours

**Source:** `color/color.globals.ts:180-260`. Pattern: `--state-<domain>-<state>-color`, plus `--state-<domain>-active-color` for the generic on state. Domains: `alarm_control_panel`, `alert`, `binary_sensor` (by device class), `climate`, `cover`, `device_tracker`, `fan`, `humidifier`, `lawn_mower`, `light`, `lock`, `media_player`, `person`, `plant`, `sensor` (battery), `siren`, `sun`, `switch`, `update`, `vacuum`, `valve`, `water_heater`, `weather`. Each refers to a named colour below, for example `--state-light-active-color: var(--amber-color)` (`:217`).

HA-LCARS maps the climate states (`state-climate-auto-color`, `-heat-color`, `-cool-color` and the rest) to LCARS colours in its `&base` block.

#### Named Colour Palette (Material Design)

**Source:** `color/color.globals.ts:71-93`. Usable in card configs and themes.

`--red-color`, `--pink-color`, `--purple-color`, `--deep-purple-color`, `--indigo-color`, `--blue-color`, `--light-blue-color`, `--cyan-color`, `--teal-color`, `--green-color`, `--light-green-color`, `--lime-color`, `--yellow-color`, `--amber-color`, `--orange-color`, `--deep-orange-color`, `--brown-color`, `--light-grey-color`, `--grey-color`, `--dark-grey-color`, `--blue-grey-color`, `--black-color`, `--white-color`

#### Data Visualisation and Energy

`--color-1` through `--color-54` (`:96-149`): distinct hues for history graphs, energy dashboards, calendars and maps. Energy flows have their own: `--energy-grid-consumption-color`, `--energy-grid-return-color`, `--energy-solar-color`, `--energy-non-fossil-color`, `--energy-battery-out-color`, `--energy-battery-in-color`, `--energy-gas-color`, `--energy-water-color` (`:60-67`).

#### RGB Component Variants (Legacy)

**Source:** `color/color.globals.ts:26-36`. For `rgba(var(--rgb-primary-color), 0.5)`. Prefer `color-mix(in srgb, var(--primary-color) 50%, transparent)` in new code.

| Variable | Light default |
|---|---|
| `--rgb-primary-color` | `0, 154, 199` |
| `--rgb-accent-color` | `255, 152, 0` |
| `--rgb-primary-text-color` | `33, 33, 33` |
| `--rgb-secondary-text-color` | `114, 114, 114` |
| `--rgb-text-primary-color` | `255, 255, 255` |
| `--rgb-card-background-color` | `255, 255, 255` |
| `--rgb-warning-color` / `-error-` / `-success-` / `-info-` | `255, 166, 0` / `219, 68, 55` / `67, 160, 71` / `3, 155, 229` |

#### Component Groups

Also in `color/color.globals.ts`, for matching Home Assistant's own surfaces:

| Group | Variables |
|---|---|
| Sidebar and app header (`:266-300`) | `--sidebar-text-color`, `--sidebar-background-color`, `--sidebar-selected-text-color`, `--sidebar-selected-icon-color`, `--sidebar-icon-color`, `--app-header-text-color`, `--app-header-background-color`, `--app-header-border-bottom`, `--app-theme-color` |
| Sliders (`:271-273`) | `--slider-color`, `--slider-secondary-color`, `--slider-track-color` |
| Tables and code (`:276-280`) | `--table-header-background-color`, `--table-row-background-color`, `--table-row-alternative-background-color`, `--data-table-background-color`, `--markdown-code-background-color` |
| Inputs (`:155-166`, dark `:360-371`) | `--input-idle-line-color`, `--input-hover-line-color`, `--input-fill-color`, `--input-ink-color`, `--input-label-ink-color`, ... |
| Chips (`:335-337`) | `--ha-assist-chip-filled-container-color`, `--ha-assist-chip-active-container-color`, `--chip-background-color` |
| Label badges (`:52`, `:169-172`, `:274-275`) | `--label-badge-red`, `-blue`, `-green`, `-yellow`, `-grey`, `--label-badge-background-color`, `--label-badge-text-color` |
| Material (`:284-334`) | `--mdc-theme-*`, `--mdc-text-field-*`, `--mdc-select-*`: still defined, but the MDC components are gone; do not use them to style `ha-button` |
| Dark only (`:373-398`) | `--codemirror-*`, `--map-filter`, `--ha-button-primary-light-color` and three more `--ha-button-*` colours |

---

### Layer 3b: WebAwesome Colour Aliases

**Source:** `color/wa.globals.ts:5-71`. Maps the semantic tokens onto WebAwesome names, for styling inside WebAwesome components.

| Pattern | Maps to |
|---|---|
| `--wa-color-<role>-fill-loud` / `-normal` | `--ha-color-fill-<role>-loud-resting` / `-normal-resting` |
| `--wa-color-<role>-fill-quiet` | `--ha-color-fill-<role>-quiet-hover` (hover, not resting) |
| `--wa-color-<role>-border-<level>` | `--ha-color-border-<role>-<level>`; except `--wa-color-brand-border-normal`, which is `var(--ha-color-primary-50)` (`:9`) |
| `--wa-color-<role>-on-<level>` | `--ha-color-on-<role>-<level>` |

`<role>` is `brand` (Home Assistant `primary`), `neutral`, `success`, `warning` or `danger`.

| Variable | Value |
|---|---|
| `--wa-color-text-quiet` | `var(--ha-color-text-secondary)` |
| `--wa-color-text-normal` | `var(--primary-text-color)` |
| `--wa-color-surface-default` | `var(--card-background-color)` |
| `--wa-color-surface-raised` | `var(--ha-dialog-surface-background, var(--mdc-theme-surface, #fff))` |
| `--wa-color-surface-border` | `var(--ha-color-border-neutral-quiet)` |
| `--wa-panel-border-radius` / `-style` / `-width` | `var(--ha-border-radius-3xl)` / `solid` / `1px` |
| `--wa-focus-ring-color` | `var(--ha-color-focus)` |
| `--wa-form-control-background-color` | `var(--wa-color-surface-raised)` |
| `--wa-form-control-border-color` | `var(--ha-color-border-neutral-quiet)` |
| `--wa-form-control-value-color` | `var(--primary-text-color)` |
| `--wa-form-control-placeholder-color` | `var(--ha-color-text-secondary)` |

The Theme Generator keeps a copy of this alias list (`WA_COLOR_ALIAS_VARS` in `src/core/themes/themeGeneratorCore.js`); nothing checks it against the frontend, so update it by hand when this file changes.

---

## Rules for LCARdS Code

The short form of these rules is in `CLAUDE.md` (its CSS variables section) and `.github/instructions/editor.instructions.md` ("CSS & Theming Conventions").

| Property | Rule |
|---|---|
| Box shadow | `var(--ha-box-shadow-s)` (hover, tight cards), `-m` (floating panels, overlays), `-l` (dialogs). Never `box-shadow: 0 2px 4px rgba(0,0,0,X)`. Decorative glows, coloured shadows and focus rings stay as they are |
| Border radius | The `--ha-border-radius-*` scale above. Card-like containers: `var(--ha-card-border-radius, var(--ha-border-radius-lg))` |
| Border width | `border: var(--ha-border-width-sm) solid ...` (1px), `-md` (2px), `-lg` (3px). Never `1px` / `2px` in a border declaration |
| Spacing | `var(--ha-space-N)` for every multiple of 4px |
| Transition duration | `var(--ha-animation-duration-fast)` for 0.15s; `var(--ha-animation-duration-normal, 0.2s)` and `var(--ha-animation-duration-slow, 0.3s)` with the original as fallback |
| Font size and weight | `--ha-font-size-*`, `--ha-font-weight-*` where a value matches |
| Font family | `var(--ha-font-family-body)` for UI text, `var(--ha-font-family-code)` for code |
| Colour | Theme variables only (`--primary-color`, `--primary-text-color`, `--secondary-background-color`, the status colours, the semantic tokens); never `rgba(60,60,60,X)` or `rgba(255,255,255,X)` in structural CSS. LCARS colours come from `--lcars-*` / `--lcards-*` or `theme:` tokens ([Colour Resolution](colour-resolution.md#css-variables-and-theme-tokens)) |
| Theme variables | Read `--ha-card-*` and the other [theme variables](#theme-variables-not-globals) with a fallback |

Home Assistant components: `<ha-button variant="danger | warning | brand">` (never `--mdc-theme-primary` overrides), `ha-input` / `ha-textarea` (not `ha-textfield`), `ha-spinner size="small"` (not `ha-circular-progress`). The full component rules are in `.github/instructions/editor.instructions.md`.

---

## What the HA-LCARS Profiles Set

**Files:** `ha-lcars/src/themes/lcards_picard_{red,blue}.yaml` in the ha-lcars repository, assembled by ha-lcars's own unmodified `py/generate_themes.py` into the installable `ha-lcars/themes/lcars.yaml`. `yaml/theme/ha-lcars-lcards-themes.yaml` in this repo is a copy-and-paste mirror of the two profiles for users who do not want to wait for an ha-lcars release; `yaml/theme/ha-lcars-all-themes.yaml` vendors the whole generated `lcars.yaml` for the Theme Generator's "Load from ha-lcars library" picker. User-facing description: [HA-LCARS Theme Profiles](../configuration/ha-lcars-theme-profiles.md).

The profile files change nothing in shared ha-lcars source (`preamble.yaml`, `defaults.yaml`, `generate_themes.py`). Everything LCARdS-specific, including the four numeric palette stops per family (`-10`, `-50`, `-60`, `-95`), is declared in each profile.

**The source is ha-lcars `master`.** Its generated `themes/lcars.yaml` carries 375 `ha-color-*` entries: every theme gets the `ha-color-primary-{05..95}` ramp, mixed in OKLCH from `--lcars-ui-tertiary` (`src/defaults.yaml`); the shared preamble sets `ha-color-text-primary`, `ha-color-form-background` (with `-hover` and `-disabled`) and `ha-color-fill-primary-quiet-resting` (`src/preamble.yaml`); and the two Picard profiles map the five palettes onto the nearest LCARdS colour (`--lcards-orange-darkest` ... `--lcards-orange-lightest`) and set `ha-color-form-background` per mode.

The LCARdS 11-stop palette for the Picard profiles (the 1:1 mapping in [Layer 1](#layer-1-colour-palette-atoms), with the `on-*`, `fill-*`, `border-*` and `surface-*` layer) is on the ha-lcars branch `lcards-semantic-colors` (checkpoint `bd888e1`), not merged into `master` yet; the rows marked "Each profile" below describe that branch and the vendored mirror. Check out that branch before running the scripts below.

| Variables | Set by |
|---|---|
| `ha-color-{primary,neutral,orange,red,green}-{05..95}` | Each profile: 1:1 onto the LCARdS scales (table in [Layer 1](#layer-1-colour-palette-atoms)) |
| `ha-color-on-{role}-{quiet,normal,loud}` | Each profile, per light and dark mode: WCAG-checked against the resolved fills |
| `ha-color-fill-{role}-{loudness}-{state}` | Each profile, per mode, following Home Assistant's tone-index convention |
| `ha-color-border-{role}-{level}` | Each profile, per mode |
| `ha-color-surface-*`, `ha-color-on-surface-default` | Each profile, per mode |
| `ha-color-form-background` | Each profile: `color-mix` of `--lcards-moonlight` with transparent, 40% light, 30% dark |
| `ha-color-form-background-hover`, `-disabled` | Each profile, per mode |
| `success-color`, `warning-color`, `error-color` | Each profile, per mode |
| `primary-color`, `primary-background-color`, `secondary-background-color`, `accent-color` | HA-LCARS `&base`: `var(--lcars-ui-tertiary)`, `var(--lcars-background-color)`, `var(--lcars-ui-quaternary)`, `var(--lcars-ui-accent-color)` |
| `primary-text-color`, `secondary-text-color`, `text-primary-color` | HA-LCARS `&base`: `var(--lcars-primary-text)` |
| `disabled-text-color` | HA-LCARS `&base`: `var(--lcars-graphite)` |
| `card-background-color`, `ha-card-border-radius`, `ha-card-border-width` | HA-LCARS `&base`: `var(--secondary-background-color)`, `var(--lcars-outer-radius)`, `0px` |
| `ha-font-family-body`, `header-height` | HA-LCARS `&base`: `var(--font-family)`, `40px` |
| Climate state colours, sidebar, header and label-badge variables | HA-LCARS `&base` |
| `ha-box-shadow-*`, `ha-animation-duration-*`, `ha-border-radius-*` | Not set: Home Assistant defaults |

ha-lcars's `generate_themes.py` runs its own non-fatal WCAG check, `verify_contrast_rule()`, on every build (the `lcars-ui-*` / `lcars-card-*` text across all 24 themes). The `on-*` / `fill-*` pairs are checked by `generate-lcards-ha-semantic-tokens.js` itself (below).

---

## Regenerating the theme profiles

Scripts in `scripts/`, run in order, take the LCARdS canon palette to installable ha-lcars theme files. All are idempotent: they replace the blocks they wrote before.

**1. `generate-lcards-palette-scale.js`: 7 canon stops to an 11-stop scale**

Reads the 7 hand-picked canon Picard anchors from `GREEN_ALERT_PALETTE` in `src/core/themes/paletteInjector.js` (the only place those 7 values are edited by hand) and computes the 4 missing stops per family (`-10`, `-50`, `-60`, `-95`) by OKLCH interpolation.

```bash
npm run lcars:palette-scale          # dry run: writes reports/palette-scale-review.html for review
npm run lcars:palette-scale:write    # patches GREEN_ALERT_PALETTE and copies the review page into doc/public/reports/
```

Review `reports/palette-scale-review.html` before the `:write` variant; `-95` is extrapolated (no anchor on either side), a judgement call, not a derivation. A copy of the review page (per-family swatch rows, canon anchors against computed stops, contrast ratios, `<wa-button>` fill and accent mockups) is kept at **[Palette Scale Review](/reports/palette-scale-review.html)**; `lcars:palette-scale:write` refreshes it.

**2. `generate-lcards-ha-semantic-tokens.js`: palette to both ha-lcars profile files**

Reads the resolved palette from `paletteInjector.js` and writes what both profiles need:

- the 4 numeric palette-stop declarations per family (literal hex, so no shared ha-lcars source changes);
- the 1:1 `ha-color-{primary,neutral,orange,red,green}-{05..95}` ramp;
- the whole `on-*`, `fill-*`, `border-*`, `surface-*` and `form-background-*` layer per light and dark mode, WCAG-checked (see [Layer 2](#layer-2-semantic-colour-tokens)). The tone tables (`BORDER`, `ON`, `FILL`, `SURFACE`, `FORM_BACKGROUND_TONES`) are in `src/core/themes/themeGeneratorCore.js`, transcribed from `color/semantic.globals.ts` and shared with the Theme Generator.

```bash
npm run lcars:semantic-tokens          # dry run: prints the YAML and a contrast report
npm run lcars:semantic-tokens:write    # patches both profile files in ../ha-lcars/src/themes/
```

It expects an `ha-lcars` checkout at `../ha-lcars` and touches nothing there but `src/themes/lcards_picard_{red,blue}.yaml`.

**3. Assemble the theme file, rebuild and re-vendor**

```bash
npm run lcars:generate-themes   # ha-lcars's own generator: assembles ../ha-lcars/themes/lcars.yaml
npm run build                   # validates CSS variables, rebuilds LCARdS
npm run lcars:export-vendored   # refreshes yaml/theme/ha-lcars-lcards-themes.yaml (the two profiles)
npm run lcars:export-all-themes # refreshes yaml/theme/ha-lcars-all-themes.yaml (every theme, for the Theme Generator)
```

`npm run lcars:regenerate` runs steps 2 and 3 in one go (`package.json:68`), the usual case when you tune semantic tokens and leave the canon anchors alone.

**Hand-maintained values** (edit them in the two profile files; no script writes them):

- `lcars-settings-card-color`: the medium-luminance background ha-lcars uses for config, dialog, profile and more-info panels (with white text from ha-lcars's shared `card-mod-css`). `var(--lcards-gray)` in both profiles of the vendored mirror.
- `lcars-ui-{primary,secondary,tertiary,quaternary}` and their `-text` companions, and everything under `modes:` that is not an `ha-color-*` token (`lcars-alert-color`, `success-color`, `warning-color`, `error-color`, `lcars-ui-quaternary-text`). These drive most of Home Assistant's UI through `defaults.yaml`'s fallback chain (for example `lcars-ui-app-header-background-color: var(--lcars-ui-primary)`).

---

## Useful Patterns

### Structural container backgrounds (editor and panel sections)

**The card standard is `secondary-background-color` 50% over `primary-background-color` 25%.** Use it for any semi-transparent container inside a card, dialog or panel; a form section is the one exception (below).

```css
/* Card standard: works with HA-LCARS, where card-background = secondary-background */
background-color: color-mix(
    in srgb,
    var(--secondary-background-color) 50%,
    color-mix(in srgb, var(--primary-background-color) 25%, transparent)
);

/* Focused or active state: a little more opaque */
background-color: color-mix(
    in srgb,
    var(--secondary-background-color) 65%,
    color-mix(in srgb, var(--primary-background-color) 35%, transparent)
);

/* Inner card or container: solid secondary background */
background: var(--secondary-background-color);
```

**Form sections only: 30% instead of 50%.** `lcards-form-section` (`src/editor/components/shared/lcards-form-section.js`) uses a lighter version of the same mix on its `ha-expansion-panel`, resting and expanded:

```css
ha-expansion-panel {
    background-color: color-mix(
        in srgb,
        var(--secondary-background-color) 30%,
        color-mix(in srgb, var(--primary-background-color) 25%, transparent)
    );
}
```

The only other users are containers drawn to look like a form section: the Pack Explorer's tree pane (`.tree-pane`, "a section card on the inset, like lcards-form-section", `src/editor/components/pack-explorer/lcards-pack-explorer-tab.js`) and the data source browser's detail blocks (`.detail-section`, "reads like an lcards-form-section card", `src/editor/components/datasources/lcards-datasource-browser.js`). Anything else takes the 50% card standard. The focused form section uses the 65%/35% mix above.

Never use `color-mix(in srgb, var(--secondary-background-color) 50%, transparent)` alone inside a card: under HA-LCARS `card-background-color` is `secondary-background-color`, so it has no contrast. Anchor it with `--primary-background-color` as above.

**Page-level backgrounds** (outside cards, where secondary is not the card background):

```css
background: color-mix(in srgb, var(--secondary-background-color) 50%, transparent);
```

### Hover states

```css
/* Primary-tinted hover */
background: color-mix(in srgb, var(--primary-color) 15%, var(--secondary-background-color));
```

### Overlays

```css
/* Text-colour tint: works in light and dark */
background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);

/* Hover on a --primary-color header only: tint with the colour of text on primary */
background: color-mix(in srgb, var(--text-primary-color) 20%, transparent);
```

### Status zones

```css
border-top: var(--ha-border-width-sm) solid color-mix(in srgb, var(--error-color) 40%, transparent);
background: color-mix(in srgb, var(--error-color) 5%, transparent);
```

The same works for `--warning-color`, `--success-color` and `--info-color`, or use the semantic fills (`var(--ha-color-fill-danger-quiet-resting)`), which follow the theme's palette.

### Code block backgrounds

```css
/* Terminal feel: darker than the card background */
background: var(--primary-background-color);
font-family: var(--ha-font-family-code);
```
