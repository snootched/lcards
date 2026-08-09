# HA CSS Variable Reference

> **HA 2026.6+ required.** All variables documented here are available from HA 2026.6 onwards. Source files are in the [HA frontend repository](https://github.com/home-assistant/frontend/tree/dev/src/resources/theme).

LCARdS targets HA 2026.6+ and uses HA CSS variables throughout its editor, panel, and theme code. This document catalogues every available variable, the actual value it resolves to in the default HA theme, and the current LCARdS implementation status.

---

## Variable Sources

| Source file | Category |
|---|---|
| `src/resources/theme/core.globals.ts` | Motion, border-radius, border-width, spacing |
| `src/resources/theme/typography.globals.ts` | Font families, sizes, weights, line-heights |
| `src/resources/theme/semantic.globals.ts` | Box shadows (light/dark responsive) |
| `src/resources/theme/color/core.globals.ts` | Colour palette atoms |
| `src/resources/theme/color/semantic.globals.ts` | Semantic colour tokens (fills, borders, surfaces, text) |
| `src/resources/theme/color/color.globals.ts` | Legacy HA semantic vars (theme-author overridable) |
| `src/resources/theme/color/wa.globals.ts` | WebAwesome component aliases |
| `src/resources/theme/main.globals.ts` | Layout, opacity, direction, app shell |
| `src/resources/theme/animations.globals.ts` | Keyframe definitions (not variables) |

---

## Motion

**Source:** `core.globals.ts`
**Important:** All five vars automatically collapse to `1ms` when `prefers-reduced-motion: reduce` is set. Using these vars gives LCARdS reduced-motion support for free.

| Variable | Default value | LCARdS usage |
|---|---|---|
| `--ha-animation-duration-none` | `1ms` | Not used directly |
| `--ha-animation-duration-instant` | `75ms` | Not yet used |
| `--ha-animation-duration-fast` | `150ms` | All 0.15s transitions |
| `--ha-animation-duration-normal` | `250ms` | All 0.2s transitions (with `, 0.2s` fallback) |
| `--ha-animation-duration-slow` | `350ms` | All 0.3s transitions (with `, 0.3s` fallback) |

**LCARdS pattern:**
```css
/* Exact match — no fallback needed */
transition: all var(--ha-animation-duration-fast);

/* Approximate match — include original as fallback */
transition: all var(--ha-animation-duration-normal, 0.2s);
transition: max-height var(--ha-animation-duration-slow, 0.3s);
```

---

## Border Radius

**Source:** `core.globals.ts`

| Variable | Value | Common use |
|---|---|---|
| `--ha-border-radius-square` | `0` | Flat containers |
| `--ha-border-radius-sm` | `4px` | Tags, badges, inline code |
| `--ha-border-radius-md` | `8px` | Toolbars, form containers |
| `--ha-border-radius-lg` | `12px` | Same as `--ha-card-border-radius` |
| `--ha-border-radius-xl` | `16px` | |
| `--ha-border-radius-2xl` | `20px` | |
| `--ha-border-radius-3xl` | `24px` | Expansion panels |
| `--ha-border-radius-4xl` | `28px` | |
| `--ha-border-radius-5xl` | `32px` | |
| `--ha-border-radius-6xl` | `36px` | |
| `--ha-border-radius-pill` | `9999px` | Chips, pills |
| `--ha-border-radius-circle` | `50%` | Avatars, circular buttons |

**No HA var for:** 3px, 6px, 10px, 22px — these remain hardcoded where used.

**LCARdS implementation:** `--ha-border-radius-sm/md/lg/3xl` used throughout `editor/base/` and `editor/components/shared/`. Expansion panels use `var(--ha-card-border-radius, var(--ha-border-radius-3xl))` so the LCARS theme's large card radius applies.

---

## Border Width

**Source:** `core.globals.ts`

| Variable | Value |
|---|---|
| `--ha-border-width-sm` | `1px` |
| `--ha-border-width-md` | `2px` |
| `--ha-border-width-lg` | `3px` |

**LCARdS implementation:** All structural borders in `editor/base/`, `editor/components/`, and `panels/components/` use these vars. Pattern:
```css
border: var(--ha-border-width-sm) solid var(--divider-color);
border: var(--ha-border-width-md) solid var(--primary-color);
```

---

## Spacing

**Source:** `core.globals.ts`
**Scale:** `--ha-space-N` where value = N × 4px. Full range is 1–20 (4px–80px).

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

**No HA var for:** 2px, 6px, 10px, 14px, 18px — leave those hardcoded.

**LCARdS implementation:** All padding, margin, and gap values that are 4px multiples use `--ha-space-*` across `editor/base/` and `editor/components/shared/`. Shorthand values mixing mapped and unmapped sizes (e.g. `padding: 2px 8px`) are left as-is or split into separate properties.

---

## Typography

**Source:** `typography.globals.ts`
**Note:** Font sizes use `calc(Xpx * var(--ha-font-size-scale))` where `--ha-font-size-scale: 1` by default. Users who change their HA font scale will have all these sizes scale proportionally.

### Font Size

| Variable | Default (scale=1) | LCARdS usage |
|---|---|---|
| `--ha-font-size-xs` | `10px` | Not currently used |
| `--ha-font-size-s` | `12px` | Helper text, badges, small labels |
| `--ha-font-size-m` | `14px` | Body text, form labels, descriptions |
| `--ha-font-size-l` | `16px` | Section headers |
| `--ha-font-size-xl` | `20px` | Not currently used |
| `--ha-font-size-2xl` | `24px` | Not currently used |
| `--ha-font-size-3xl` | `28px` | Not currently used |
| `--ha-font-size-4xl` | `32px` | Not currently used |
| `--ha-font-size-5xl` | `40px` | Not currently used |

**No HA var for:** 13px, 18px — remain hardcoded.

**LCARdS implementation:** `--ha-font-size-s/m/l` used throughout `editor/base/` and `editor/components/shared/`. Panel files use em/rem for intentional relative scaling — those are correct as-is.

### Font Weight

| Variable | Value | Semantic use |
|---|---|---|
| `--ha-font-weight-light` | `300` | |
| `--ha-font-weight-normal` | `400` | Body text |
| `--ha-font-weight-medium` | `500` | Labels, actions |
| `--ha-font-weight-bold` | `700` | Headings |
| `--ha-font-weight-body` | `var(--ha-font-weight-normal)` | |
| `--ha-font-weight-heading` | `var(--ha-font-weight-bold)` | |
| `--ha-font-weight-action` | `var(--ha-font-weight-medium)` | Buttons |

**No HA var for:** 600 — HA uses 300/400/500/700 only.

### Font Family

| Variable | Default value | Use |
|---|---|---|
| `--ha-font-family-body` | `Roboto, Noto, sans-serif` | UI body text |
| `--ha-font-family-heading` | `var(--ha-font-family-body)` | Headings |
| `--ha-font-family-code` | `monospace` | Code blocks |
| `--ha-font-family-longform` | `ui-sans-serif, system-ui, sans-serif` | Long-form text |

**LCARdS/HA-LCARS theme:** The LCARS theme YAML sets `ha-font-family-body` to the Tungsten/Antonio font stack, which cascades to all HA components.

### Line Height

| Variable | Value |
|---|---|
| `--ha-line-height-condensed` | `1.2` |
| `--ha-line-height-normal` | `1.6` |
| `--ha-line-height-expanded` | `2` |

---

## Elevation / Box Shadow

**Source:** `semantic.globals.ts`
**Responsive:** Different values for light and dark HA themes.

| Variable | Light theme | Dark theme |
|---|---|---|
| `--ha-box-shadow-s` | `0 1px 2px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.12)` | same with opacity 0.4/0.5 |
| `--ha-box-shadow-m` | `0 3px 6px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.15)` | same with opacity 0.35/0.45 |
| `--ha-box-shadow-l` | `0 6px 12px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.2)` | same with opacity 0.4/0.55 |

**LCARdS implementation:** Used everywhere — editor panels, overlays, cards. The `--wa-shadow-s/m/l` WebAwesome aliases resolve to these same vars.

---

## Colour System

HA 2026.6 uses a **three-layer colour architecture**:

```
Palette atoms  →  Semantic tokens  →  Legacy semantic vars
(ha-color-primary-40)   (ha-color-fill-primary-loud-resting)   (--primary-color)
```

When a LCARdS theme overrides palette atoms, the semantic tokens cascade automatically. When legacy semantic vars are set, they affect both old and new HA components.

---

### Layer 1 — Colour Palette Atoms

**Source:** `color/core.globals.ts`
**Purpose:** Raw colour scales. Do not use directly in component CSS — use semantic tokens instead. These are the values theme authors override to remap HA's entire colour system.

Each palette has 11 stops (05–95) going from darkest to lightest.

| Palette | Key value | All stops |
|---|---|---|
| `--ha-color-primary-*` (teal/cyan) | `primary-40: #009ac7` | 05=`#001721` → 95=`#eff9fe` |
| `--ha-color-neutral-*` (grey) | `neutral-40: #5e5e5e` | 05=`#141414` → 95=`#f3f3f3` |
| `--ha-color-orange-*` | `orange-60: #f36d00` | 05=`#280700` → 95=`#fff0e4` |
| `--ha-color-red-*` | `red-50: #dc3146` | 05=`#2a040b` → 95=`#fff0ef` |
| `--ha-color-green-*` | `green-50: #00883c` | 05=`#031608` → 95=`#e3f9e3` |
| `--ha-color-black` | `#000000` | |
| `--ha-color-white` | `#ffffff` | |

**LCARdS/HA-LCARS theme mapping:** All five palettes are fully remapped in both the Red Accent and Blue Accent themes, 1:1 across the full 11-stop scale (not a lossy nearest-stop collapse — LCARdS's own palette was expanded to a genuine 11-stop scale specifically to support this; see [LCARdS Colour Palette](../core/themes/index.md#lcards-css-colour-palette)):

| HA palette | LCARdS Red theme maps to | LCARdS Blue theme maps to |
|---|---|---|
| `ha-color-primary-*` | `--lcards-orange-*` scale | `--lcards-blue-*` scale |
| `ha-color-neutral-*` | `--lcards-gray-*` scale | `--lcards-gray-*` scale |
| `ha-color-orange-*` | `--lcards-yellow-*` scale | `--lcards-yellow-*` scale |
| `ha-color-red-*` | `--lcards-orange-*` scale | `--lcards-orange-*` scale |
| `ha-color-green-*` | `--lcards-green-*` scale | `--lcards-green-*` scale |

**Remapping the palette alone is not sufficient.** HA's semantic tokens (Layer 2, below) assume any hue survives readably at a given tone number — true for HA's smoothly-generated palettes, not for every hand-picked LCARdS hue (orange has a much narrower usable-lightness band than blue). Both Picard profiles therefore also explicitly override the full `on-*`/`fill-*`/`border-*`/`surface-*` semantic layer, each value WCAG-validated rather than trusting the tone-index convention blindly — see Layer 2 below.

---

### Layer 2 — Semantic Colour Tokens

**Source:** `color/semantic.globals.ts`
**Responsive:** Different light/dark values. All reference palette atoms — so remapping the palette atoms (Layer 1) cascades here automatically.

#### Text

| Variable | Light resolves to | Dark resolves to |
|---|---|---|
| `--ha-color-text-primary` | `neutral-05` (#141414) | `neutral-90` |
| `--ha-color-text-secondary` | `neutral-40` (#5e5e5e) | `neutral-60` |
| `--ha-color-text-disabled` | `neutral-60` (#989898) | `neutral-40` |
| `--ha-color-text-link` | `primary-40` (#009ac7) | `primary-50` |
| `--ha-color-text-primary-inverted` | `white` | `neutral-05` |
| `--ha-color-text-secondary-inverted` | `neutral-20` | `neutral-80` |

#### Surfaces

| Variable | Light | Dark | Use |
|---|---|---|---|
| `--ha-color-surface-default` | `white` | `#1c1c1c` | Cards, dialogs |
| `--ha-color-surface-low` | `neutral-95` (#f3f3f3) | `neutral-10` | Raised containers |
| `--ha-color-surface-lower` | `neutral-90` (#e6e6e6) | `neutral-05` | Double-raised |
| `--ha-color-surface-default-inverted` | `neutral-10` | `white` | Inverted callouts |
| `--ha-color-surface-low-inverted` | `neutral-05` | `neutral-90` | |
| `--ha-color-on-surface-default` | `neutral-05` | `neutral-90` | Text on surface-default |

#### Form Backgrounds

| Variable | Light | Dark |
|---|---|---|
| `--ha-color-form-background` | `neutral-95` | `neutral-10` |
| `--ha-color-form-background-hover` | `neutral-90` | `neutral-15` |
| `--ha-color-form-background-disabled` | `neutral-80` | `neutral-20` |

**LCARdS/HA-LCARS theme:** `ha-color-form-background` is explicitly set in both light (40% moonlight mix) and dark (30% moonlight mix) mode sections to give form inputs a subtle LCARS-tinted background.

#### Borders (`quiet` < `normal` < `loud`)

Nine combinations: primary/neutral/danger/warning/success × quiet/normal/loud.

| Pattern | Light example | Use |
|---|---|---|
| `--ha-color-border-neutral-quiet` | `neutral-90` | Subtle dividers |
| `--ha-color-border-neutral-normal` | `neutral-60` | Visible borders |
| `--ha-color-border-neutral-loud` | `neutral-40` | Emphasis borders |
| `--ha-color-border-primary-quiet/normal/loud` | primary-90/70/40 | Primary-tinted borders |
| `--ha-color-border-danger-quiet/normal/loud` | red-90/70/40 | Danger zones |
| `--ha-color-border-warning-quiet/normal/loud` | orange-90/70/40 | Warnings |
| `--ha-color-border-success-quiet/normal/loud` | green-90/70/40 | Success states |

#### Fills (interactive backgrounds)

Pattern: `--ha-color-fill-[role]-[loudness]-[state]`
Loudness: `quiet` / `normal` / `loud`
State: `resting` / `hover` / `active`
Roles: `primary`, `neutral`, `disabled`, `danger`, `warning`, `success`

Key values (light theme):
| Variable | Value | Use |
|---|---|---|
| `--ha-color-fill-primary-loud-resting` | `primary-40` | Filled primary button |
| `--ha-color-fill-primary-normal-resting` | `primary-90` | Tinted primary container |
| `--ha-color-fill-primary-quiet-resting` | `primary-95` | Very light primary tint |
| `--ha-color-fill-neutral-loud-resting` | `neutral-40` | Filled neutral button |
| `--ha-color-fill-neutral-normal-resting` | `neutral-90` | Default chip/badge |
| `--ha-color-fill-danger-loud-resting` | `red-50` | Danger button |
| `--ha-color-fill-warning-loud-resting` | `orange-70` | Warning button |
| `--ha-color-fill-success-loud-resting` | `green-50` | Success badge |

**HA's `<ha-button>` `appearance` attribute maps directly onto this scale**: `appearance="accent"` uses `fill-{role}-loud-resting`, `appearance="filled"` uses `fill-{role}-normal-resting` (`ha-button.ts`). HA's generated ramps guarantee `quiet < normal < loud` reads as a real prominence hierarchy; LCARdS's hand-picked canon palette doesn't guarantee this everywhere (e.g. blue's `-lightest` stop is a deliberately vivid electric-cyan accent, more saturated than its own family's tone-40 anchor). Where this is a confirmed visible problem, fix it with a hand-picked tone-number swap for that specific (role, mode, tier) cell in `generate-lcards-ha-semantic-tokens.js`'s `FILL` table — not an automated chroma-clamping pass (a prior automated attempt made real UI worse and was reverted).

#### On-Colors (text on fills)

Pattern: `--ha-color-on-[role]-[loudness]`

| Variable | Light value | Use |
|---|---|---|
| `--ha-color-on-primary-loud` | `white` | Text on filled primary button |
| `--ha-color-on-primary-normal` | `primary-40` | Text in tinted primary container |
| `--ha-color-on-neutral-loud` | `white` | Text on filled neutral button |
| `--ha-color-on-danger-loud` | `white` | Text on danger button |
| `--ha-color-on-warning-loud` | `white` | Text on warning button |
| `--ha-color-on-success-loud` | `white` | Text on success button |

**Not derived from a contrast formula.** These are hand-picked *tone references* — HA never computes an actual WCAG ratio here, and `on-*-loud` is a hardcoded literal `white` for every role in every theme regardless of the hue underneath it. LCARdS's two Picard profiles instead run each value through `generate-lcards-ha-semantic-tokens.js`: HA's tone-index convention picks a starting value, then real WCAG contrast math (4.5:1 AA) against the actual resolved LCARdS hex substitutes white/black wherever the mechanical default fails — see [Regenerating the theme profiles](#regenerating-the-theme-profiles) below.

#### Other

| Variable | Value | Use |
|---|---|---|
| `--ha-color-focus` | `neutral-60` in light | Focus ring colour |
| `--ha-color-shadow-scrollable-fade` | `rgba(0,0,0,0.08)` | Scroll shadow gradient |
| `--ha-color-border-normal` | alias | Generic border |

---

### Layer 3 — Legacy Semantic Variables

**Source:** `color/color.globals.ts`
**Theme-author overridable:** These are the variables set in HA theme YAML files (including our `ha-lcars-lcards-themes.yaml`). They feed both legacy HA components and some new ones.

#### Core Palette

| Variable | Default | LCARdS/HA-LCARS theme |
|---|---|---|
| `--primary-color` | `#009ac7` (primary-40) | `var(--lcars-ui-tertiary)` — orange or blue per theme variant |
| `--dark-primary-color` | darker teal | |
| `--light-primary-color` | lighter teal | |
| `--accent-color` | `#ff9800` | `var(--lcars-orange)` |

#### Text

| Variable | Light default | LCARdS/HA-LCARS |
|---|---|---|
| `--primary-text-color` | `#141414` (via ha-color-text-primary) | `var(--lcars-text-gray)` |
| `--secondary-text-color` | `#5e5e5e` | `var(--lcars-text-gray)` |
| `--text-primary-color` | `#ffffff` (text ON primary bg) | `var(--lcars-text-gray)` |
| `--disabled-text-color` | `~#989898` | `"#555"` |

#### Surfaces

| Variable | Light default | LCARdS/HA-LCARS |
|---|---|---|
| `--primary-background-color` | `#fafafa` | `var(--lcars-background-color)` (#000000) |
| `--secondary-background-color` | `#e5e5e5` | `var(--lcars-ui-quaternary)` |
| `--card-background-color` | `#ffffff` | `var(--secondary-background-color)` |
| `--clear-background-color` | transparent | |

#### Status

| Variable | Default |
|---|---|
| `--error-color` | `#db4437` |
| `--warning-color` | `#ffa600` |
| `--success-color` | `#43a047` |
| `--info-color` | `#039be5` |

**LCARdS/HA-LCARS:** `success-color`, `warning-color`, `error-color` overridden per light/dark mode in theme YAML.

#### State Indicators

| Variable | Default |
|---|---|
| `--state-active-color` | `#ffc107` (amber) |
| `--state-inactive-color` | `#9e9e9e` (grey) |
| `--state-unavailable-color` | disabled text |
| `--state-icon-color` | mid-grey |

#### Domain State Colors

Full set of per-domain state colors. Pattern: `--state-[domain]-color` or `--state-[domain]-[condition]-color`.

Domains covered: `alarm_control_panel`, `alert`, `binary_sensor`, `climate`, `cover`, `device_tracker`, `fan`, `light`, `lock`, `media_player`, `person`, `switch`, `vacuum`, `lawn_mower`, `weather`.

**LCARdS/HA-LCARS:** Several climate states overridden: `state-climate-auto-color`, `state-climate-heat-color`, `state-climate-cool-color`, etc. mapped to LCARS colors.

#### Named Colour Palette (Material Design)

Available as CSS variables for use in card configs and themes:

`--red-color`, `--pink-color`, `--purple-color`, `--deep-purple-color`, `--indigo-color`, `--blue-color`, `--light-blue-color`, `--cyan-color`, `--teal-color`, `--green-color`, `--light-green-color`, `--lime-color`, `--yellow-color`, `--amber-color`, `--orange-color`, `--deep-orange-color`, `--brown-color`, `--light-grey-color`, `--grey-color`, `--dark-grey-color`, `--blue-grey-color`, `--black-color`, `--white-color`

#### Data Visualization

`--color-1` through `--color-54` — 54 distinct hues for history graphs, energy dashboards, calendar.

#### RGB Component Variants (Legacy)

Used for `rgba(var(--rgb-primary-color), 0.5)` patterns. **Superseded by `color-mix()`** — prefer `color-mix(in srgb, var(--primary-color) 50%, transparent)` in new code.

`--rgb-primary-color`, `--rgb-accent-color`, `--rgb-primary-text-color`, `--rgb-secondary-text-color`, `--rgb-card-background-color`, `--rgb-warning-color`, `--rgb-error-color`, `--rgb-success-color`, `--rgb-info-color`

---

### Layer 3b — WebAwesome Aliases

**Source:** `color/wa.globals.ts`
Maps HA semantic tokens to WebAwesome component var names. Available for use in LCARdS if targeting WA components directly.

Pattern: `--wa-color-[role]-fill-[loudness]`, `--wa-color-[role]-border-[loudness]`, `--wa-color-[role]-on-[loudness]` where role = brand/neutral/success/warning/danger.

---

## Layout / App Shell

**Source:** `main.globals.ts`

| Variable | Value | Use |
|---|---|---|
| `--header-height` | `56px` | Top app bar height (40px in LCARS theme) |
| `--direction` | `ltr` | Text direction |
| `--ha-dialog-scrim-backdrop-filter` | `brightness(68%)` | Modal overlay blur |
| `--dark-primary-opacity` | `0.87` | Primary text opacity on light bg |
| `--dark-secondary-opacity` | `0.54` | Secondary text opacity on light bg |
| `--dark-disabled-opacity` | `0.38` | Disabled element opacity |
| `--light-primary-opacity` | `1` | Primary text opacity on dark bg |
| `--light-secondary-opacity` | `0.7` | Secondary text opacity on dark bg |
| `--light-disabled-opacity` | `0.3` | Disabled element opacity on dark bg |

---

## LCARdS Implementation Summary

### What LCARdS CSS code uses

| Category | Status |
|---|---|
| `--ha-animation-duration-*` | ✅ All transitions in editor/base, editor/components, panels |
| `--ha-border-radius-sm/md/lg/xl/3xl` | ✅ All structural radii in scope files |
| `--ha-border-width-sm/md` | ✅ All border declarations in editor and panel files |
| `--ha-space-1` through `--ha-space-10` | ✅ All 4px-multiple spacing in editor/base and editor/components/shared |
| `--ha-font-size-s/m/l` | ✅ All font sizes in editor/base and editor/components/shared |
| `--ha-box-shadow-s/m/l` | ✅ All box shadows |
| `--primary-color`, `--accent-color`, `--*-text-color` | ✅ Used throughout |
| `--primary-background-color`, `--secondary-background-color`, `--card-background-color` | ✅ Used throughout |
| `--error-color`, `--warning-color`, `--success-color`, `--info-color` | ✅ Used throughout |
| `--divider-color`, `--chip-background-color` | ✅ Used for borders and structural dividers |
| `--ha-font-size-xl/2xl/3xl/4xl/5xl` | ⬜ Not yet needed — no UI elements at those sizes |
| `--ha-font-weight-*` | ⬜ Still hardcoded (500, 600, 700); future cleanup pass |
| `--ha-line-height-*` | ⬜ Still hardcoded; future cleanup pass |
| `--ha-space-11` through `--ha-space-20` | ⬜ No values that large in editor scope |
| `--ha-color-*` semantic tokens | ✅ Not used directly in LCARdS's own component CSS, but explicitly set (not just cascaded) by both HA-LCARS Picard theme profiles — see below |

### What the HA-LCARS theme profile sets

**Authoritative source:** `ha-lcars/src/themes/lcards_picard_{red,blue}.yaml` (in the separate `ha-lcars` repository), assembled by ha-lcars's own **unmodified, stock** `py/generate_themes.py` into the installable `ha-lcars/themes/lcars.yaml`. `yaml/theme/ha-lcars-lcards-themes.yaml` in *this* repo is a vendored copy-paste-able mirror for users who don't want to depend on the ha-lcars HACS release cycle — keep it resynced when the ha-lcars source changes.

**Both profile files are fully self-contained — zero changes to shared ha-lcars source** (`preamble.yaml`, `defaults.yaml`, `generate_themes.py` are byte-identical to upstream `origin/master`). Everything LCARdS-specific, including the four numeric palette stops per family (`-10`/`-50`/`-60`/`-95`) that used to live in ha-lcars's shared `&lcars-variables` anchor, is declared directly in each profile file — a genuine drop-in with no upstream PR or fork maintenance required.

Each profile sets:

| Category | Status |
|---|---|
| `ha-color-primary-05` through `-95` | ✅ Full 1:1 11-stop mapping to LCARdS orange (Red) or blue (Blue) — no lossy collapsing |
| `ha-color-neutral-05` through `-95` | ✅ Full 1:1 mapping to LCARdS gray scale |
| `ha-color-orange-05` through `-95` | ✅ Full 1:1 mapping to LCARdS yellow scale |
| `ha-color-red-05` through `-95` | ✅ Full 1:1 mapping to LCARdS orange scale (errors/danger → orange) |
| `ha-color-green-05` through `-95` | ✅ Full 1:1 mapping to LCARdS green scale |
| `ha-color-on-{primary,neutral,disabled,danger,warning,success}-{quiet,normal,loud}` | ✅ Set per light/dark mode, WCAG-validated against the actual resolved fill colors (Phase-2 correction applied where HA's mechanical tone-index default fails 4.5:1) |
| `ha-color-fill-{primary,neutral,disabled,danger,warning,success}-{quiet,normal,loud}-{resting,hover,active}` | ✅ Set per light/dark mode, following HA's own tone-index convention |
| `ha-color-border-{primary,neutral,danger,warning,success}-{quiet,normal,loud}` | ✅ Set per light/dark mode |
| `ha-color-surface-{default,low,lower}(-inverted)`, `ha-color-on-surface-default` | ✅ Set per light/dark mode |
| `ha-color-form-background` | ✅ Light and dark mode values (moonlight tint) |
| `ha-color-form-background-hover/-disabled` | ✅ Set per light/dark mode (previously cascaded from the neutral palette only) |
| `primary-color`, `accent-color` | ✅ Set via `lcars-ui-tertiary` |
| `primary-background-color`, `secondary-background-color` | ✅ Set to LCARS black and quaternary gray |
| `card-background-color`, `ha-card-background` | ✅ Set |
| `primary-text-color`, `secondary-text-color` | ✅ Set to LCARS text gray |
| `success-color`, `warning-color`, `error-color` | ✅ Per light/dark mode overrides |
| Climate domain state colors | ✅ Mapped to LCARS palette |
| Sidebar, header, slider, toggle vars | ✅ Full LCARS styling |
| `ha-font-family-body` | ✅ Set to Tungsten/Antonio LCARS font stack |
| `ha-box-shadow-s/m/l` | ⬜ Not overridden — default HA shadows used |
| `ha-animation-duration-*` | ⬜ Not overridden — default timing used |
| `ha-border-radius-*` | ⬜ Not overridden — uses `ha-card-border-radius: var(--lcars-outer-radius)` for cards |

Build-time validation: ha-lcars's own stock `generate_themes.py` runs its existing non-fatal WCAG verifier, `verify_contrast_rule()`, on every build (checks `lcars-ui-*`/`lcars-card-*` LCARS-aesthetic decorative text across all 24 themes). The `on-*`/`fill-*` semantic-token pairs are validated separately, client-side, by `generate-lcards-ha-semantic-tokens.js` itself (see below) — no ha-lcars-side verifier needed.

---

## Regenerating the theme profiles

Three scripts in `lcards/scripts/`, run in order, take the LCARdS canon palette all the way to installable ha-lcars theme files. All three are idempotent — safe to re-run after any change, they replace their own previously-written blocks rather than duplicating them.

**1. `generate-lcards-palette-scale.js` — 7 canon stops → 11-stop scale**

Reads the 7 hand-picked canon Picard-screen anchors from `src/core/themes/paletteInjector.js`'s `GREEN_ALERT_PALETTE` (the *only* place those 7 values should ever be hand-edited) and computes the 4 gap/extrapolated stops per family (`-10`, `-50`, `-60`, `-95`) via OKLCH interpolation.

```bash
npm run lcars:palette-scale          # dry run, writes reports/palette-scale-review.html for human review
npm run lcars:palette-scale:write    # patches GREEN_ALERT_PALETTE in paletteInjector.js, resyncs the docs snapshot (below)
```

Always review `reports/palette-scale-review.html` before the `:write` variant — the `-95` slot in particular is extrapolated (no real anchor on either side) and is a judgment call, not a mechanical derivation. A snapshot of this review artifact (per-family swatch rows: canon anchors vs. computed/extrapolated stops, contrast ratios, and `<wa-button>` fill/accent mockups) is kept as visual reference at **[Palette Scale Review](/reports/palette-scale-review.html)** — it's a static copy, not live-generated; `lcars:palette-scale:write` keeps it in sync automatically.

**2. `generate-lcards-ha-semantic-tokens.js` — palette → both ha-lcars profile files**

Reads the full resolved palette back out of `paletteInjector.js` and derives everything both profile files need:
- The 4 numeric palette-stop declarations per family (literal hex, self-contained — no shared ha-lcars source touched).
- The 1:1 `ha-color-{primary,neutral,orange,red,green}-{05..95}` ramp.
- The full `on-*`/`fill-*`/`border-*`/`surface-*`/`form-background-*` semantic layer, per light/dark mode, WCAG-validated (see Layer 2 above).

```bash
npm run lcars:semantic-tokens          # dry run, prints YAML + contrast report to console
npm run lcars:semantic-tokens:write    # patches both profile YAML files in ../ha-lcars/src/themes/
```

This assumes a sibling `ha-lcars` checkout at `../ha-lcars` relative to this repo. **It does not touch anything outside `src/themes/lcards_picard_{red,blue}.yaml`** — no shared ha-lcars files.

**3. Regenerate the installable theme file and rebuild**

```bash
npm run lcars:generate-themes   # ha-lcars's own stock generator — assembles themes/lcars.yaml
npm run build                   # validates CSS vars, rebuilds LCARdS itself
npm run lcars:export-vendored   # resyncs the copy-paste-able yaml/theme/ha-lcars-lcards-themes.yaml
```

Or run steps 2+3 together for the common case (tuning semantic tokens, not touching the canon palette anchors):

```bash
npm run lcars:regenerate
```

**Values that are hand-maintained, not generated** (edit directly in the two profile files, no script involved):
- `lcars-settings-card-color` — the medium-luminance background ha-lcars uses for config/dialog/profile/more-info panels (paired with hardcoded white text in ha-lcars's own shared `card-mod-css`). Currently `var(--lcards-gray)` in both profiles.
- `lcars-ui-{primary,secondary,tertiary,quaternary}` and their `-text` companions, and everything under `modes:` that isn't a `ha-color-*` semantic token (e.g. `lcars-alert-color`, `success-color`/`warning-color`/`error-color`, `lcars-ui-quaternary-text`) — these drive most of the rest of HA's UI indirectly via `defaults.yaml`'s fallback chain (e.g. `lcars-ui-app-header-background-color: var(--lcars-ui-primary)`) and don't need per-profile overrides beyond the base set already present.

---

## Useful Patterns

### Structural container backgrounds (editor/panel sections)

```css
/* Standard section — 50% blend, works with HA-LCARS where card-bg = secondary-bg */
background-color: color-mix(
    in srgb,
    var(--secondary-background-color) 50%,
    color-mix(in srgb, var(--primary-background-color) 25%, transparent)
);

/* Focused/active state — slightly more opaque */
background-color: color-mix(
    in srgb,
    var(--secondary-background-color) 65%,
    color-mix(in srgb, var(--primary-background-color) 35%, transparent)
);

/* Inner card/container — solid secondary background */
background: var(--secondary-background-color);
```

### Hover states

```css
/* Primary-tinted hover */
background: color-mix(in srgb, var(--primary-color) 15%, var(--secondary-background-color));
```

### Light overlays (on colored backgrounds)

```css
/* White hover on primary-color header */
background: color-mix(in srgb, white 20%, transparent);

/* Text-color tint (works in both light/dark) */
background: color-mix(in srgb, var(--primary-text-color) 10%, transparent);
```

### Status zone borders and backgrounds

```css
border-top: var(--ha-border-width-sm) solid color-mix(in srgb, var(--error-color) 40%, transparent);
background: color-mix(in srgb, var(--error-color) 5%, transparent);
```

### Code block backgrounds

```css
/* Terminal/code feel — darker than card background */
background: var(--primary-background-color);
```
