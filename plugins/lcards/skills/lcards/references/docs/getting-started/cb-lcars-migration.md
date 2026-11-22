# Coming from CB-LCARS

**LCARdS grew out of, and supersedes, the [CB-LCARS](https://github.com/snootched/cb-lcars) project: most of its features are here, rebuilt, and the table below gives the LCARdS equivalent of each card.**

- CB-LCARS was based on [Custom Button Card](https://github.com/custom-cards/button-card); LCARdS is built from scratch with Lit and needs no other custom cards.

::: tip You can run both at once
CB-LCARS and LCARdS can coexist while you move over. New features and fixes go into LCARdS only.

The configuration formats differ, so card configs don't carry over directly.
:::

## Feature Comparison

**Each CB-LCARS card or feature and its LCARdS equivalent.**

✅ Present | ❌ Not present | ⚠️ Partial

| Feature | CB-LCARS | LCARdS | Notes |
|---|:---:|:---:|---|
| Buttons | ✅ `cb-lcars-button-card` | ✅ `lcards-button` | Built-in `preset` collection provides the standard LCARS button styles, which are completely configurable. |
| Multi-Segment Buttons | ❌ | ✅ `lcards-button` | Allows complex button designs (known as `component`) to be used as advanced multi-segment/multi-touch controls, configured via `segments`. |
| DPAD | ✅ `cb-lcars-dpad-card` | ✅ `lcards-button` | First advanced button to use the `component` feature of `lcards-button`. |
| ALERT | ⚠️ background animation | ✅ `lcards-button` | Promoted to a button card component: allows full interactive configuration. |
| Labels | ✅ `cb-lcars-label-card` | ✅ `lcards-button` | Label functionality is available via `lcards-button`. Additional presets available for text labels with or without decoration. |
| Elbows | ✅ `cb-lcars-elbow-card` | ✅ `lcards-elbow` | Equivalent in LCARdS: enhanced with more corner styles (e.g. straight cut with configurable angles). |
| Double Elbows | ✅ `cb-lcars-double-elbow-card` | ✅ `lcards-elbow` | Double Elbow functionality is now consolidated into a single unified `lcards-elbow` card. |
| Sliders | ✅ `cb-lcars-multimeter-card` | ✅ `lcards-slider` | Completely replacing the former multimeter card. Vastly improved: configurable direction, inversion, display min/max, control min/max, and more. |
| Cascade Data Grid | ⚠️ background animation | ✅ `lcards-data-grid` | CB-LCARS provided a decorative-only version as a background animation. `lcards-data-grid` is a full-featured grid that can show real entity data, text, etc. Decorative mode is still available. |
| Text | ✅ `cb-lcars-text-card` | ✅ `lcards-button` | Text-only button presets, or text fields on any card. |
| Picard-style controls | ✅ `cb-lcars-picard-card` | ✅ `lcards-elbow`, `lcards-slider` | Segmented (double) elbows and frames on `lcards-elbow`; the `picard` slider component with the `picard-gauge-vertical` preset; `filled` and `outline` button presets. |
| Layouts | ⚠️ `custom:layout-card` (separate install) | ✅ `lcards-layout-card`, `lcards-layout-view` | LCARdS has its own grid layouts with visual editors. Replace `custom:layout-card` with `lcards-layout-card`: change the `type` and remove `layout_type`; the `layout` and `view_layout` keys stay the same. See [Layout Card](../cards/layout-card/). |
| Select menu | ❌ | ✅ `lcards-select-menu` | A grid of buttons for an `input_select` or `select` entity. |
| card-mod | ⚠️ required | ✅ not needed | LCARdS needs no other custom cards or card-mod. |
| Charts / Graphs | ❌ | ✅ `lcards-chart` | Embedded ApexCharts library providing 15+ chart types to plot entity/data. |
| MSD (Master Systems Display) | ❌ | ✅ `lcards-msd-card` | Full MSD system in a card. Embed controls, connect routing lines, add animations to reflect statuses. |
| Background Animations | ✅ GRID, ALERT, GEO Array, Pulsewave | ⚠️ ✅ | Background animations split into stackable layers: mix and match building blocks. ✅ GRID (enhanced), ✅ ALERT (button component), ✅ Starfield & Nebula (enhanced). ⚠️ GEO Array, Pulsewave (pending). |
| Element Animations | ❌ | ✅ | Embedded Anime.js v4 enabling animation of any SVG element (cards, lines/stroke, text, etc.). |
| Symbiont (embedded cards) | ✅ | ✅ | In the [elbow card](../cards/elbow/symbiont): embeds any card and imprints the elbow's colours and font on it. `custom_style` adds your own CSS without UIX, and a `uix` block on the embedded card is passed through. |
| State-based Styling / Custom States | ✅ | ✅✅ | CB-LCARS has a limited set of states. LCARdS uses common state groupings (`default` \| `active` \| `inactive` \| `unavailable`) plus the ability to define ***any state*** for customised styling. Integrates with the core rules engine for hot-patching. |
| Sounds | ❌ | ✅ | Customisable sounds for many UI and card event types (tap, double tap, hold, hover, sidebar expand/collapse, and more). |
| Alert Overlay | ❌ | ✅ `lcards-alert-overlay` | Dashboard-level card that reacts to `input_select.lcards_alert_mode` and displays a full-screen configurable backdrop with an embedded content card. |

## Moving a Card Over

**Rebuild each CB-LCARS card as its LCARdS card: keep the entity and actions, pick the matching preset or elbow type, then carry the label, colours and sizes across.** The tables below give the usual matches; anything not listed has no direct equivalent, so restyle it with the card's own options.

- **Card and template:** `type: custom:cb-lcars-<kind>-card` with `cblcars_card_type` (the template) becomes one LCARdS card type with a `preset` (buttons) or an `elbow.type` (elbows).
- **Settings:** `cblcars_card_config` holds the CB-LCARS settings (`entity`, `label`, actions and the template `variables`). In LCARdS they sit at the top level of the card.
- **Sizing:** `layout_options` (`grid_columns`, `grid_rows`) becomes Home Assistant's own `grid_options` (`columns`, `rows`).
- **Colours:** use theme colours (`var(--lcars-...)` or `theme:` tokens) and LCARdS state maps (`active`, `inactive`, `unavailable` and any state). See [Colours](../core/colours).
- **Ask an assistant:** with the [LCARdS skill](ai-assistance) loaded, paste a CB-LCARS dashboard and ask for it in LCARdS: it keeps your entities and actions, rebuilds each card and lists what has no equivalent.

```yaml no-validate
# CB-LCARS
type: custom:cb-lcars-button-card
cblcars_card_type: cb-lcars-button-lozenge
cblcars_card_config:
  entity: light.kitchen
  label: KITCHEN
  show_label: true
layout_options:
  grid_columns: 2
  grid_rows: 1
```

```yaml
# LCARdS
type: custom:lcards-button
preset: lozenge
entity: light.kitchen
text:
  name:
    content: KITCHEN
    show: true
grid_options:
  columns: 6
  rows: 1
```

::: details Templates and their LCARdS matches
| CB-LCARS (`cblcars_card_type`) | LCARdS |
|---|---|
| `cb-lcars-button-lozenge`, `-right` | `lcards-button`, `preset: lozenge`, `lozenge-right` |
| `cb-lcars-button-bullet`, `-right` | `lcards-button`, `preset: bullet`, `bullet-right` |
| `cb-lcars-button-capped`, `-right` | `lcards-button`, `preset: capped`, `capped-right` |
| `cb-lcars-button-picard`, `-right` | `lcards-button`, `preset: outline`, `outline-right` |
| `cb-lcars-button-picard-filled`, `-right` | `lcards-button`, `preset: filled`, `filled-right` |
| `custom:cb-lcars-label-card` | `lcards-button`, `preset: text-only`, or a `bar-label-*` preset for a label in a bar (`cb-lcars-label-picard-square`: `bar-label-square`) |
| `cb-lcars-header`, `-right`, `-open`, `-contained` | `lcards-elbow`, `elbow.type: header-left`, `header-right`, `header-open`, `header-contained` |
| `cb-lcars-footer`, `-right`, `-open`, `-contained` | `lcards-elbow`, `elbow.type: footer-left`, `footer-right`, `footer-open`, `footer-contained` |
| `cb-lcars-header-picard`, `cb-lcars-footer-picard` (double elbow card) | `lcards-elbow`, `elbow.style: segmented` with the matching `elbow.type` |
| `cb-lcars-slider`, `cb-lcars-slider-gauge` (multimeter, slider cards) | `lcards-slider`, `preset: pills-basic`, `gauge-basic` (Picard: `picard-gauge-vertical`) |
| `cb-lcars-cascade` | `lcards-data-grid` (decorative mode) |
| `custom:cb-lcars-dpad-card` | `lcards-button`, `component: dpad` |
| `custom:layout-card` | `lcards-layout-card` (see the table above) |
:::

::: details Settings and their LCARdS keys
| CB-LCARS | LCARdS |
|---|---|
| `cblcars_card_config.entity` | `entity` |
| `label` with `show_label: true` | `text.name.content` with `show: true` (lozenge, bullet, capped, outline, filled); `text.label.content` on the bar-label and panel presets |
| `tap_action`, `hold_action`, `double_tap_action` | the same keys: see [Actions](../core/actions) |
| `variables.card.color.default`, `active`, `inactive`, `unavailable` | `style.card.color.background` with the same state keys |
| `variables.text.label.color` | `text.<field>.color`, a colour or a state map |
| `variables.text.label.font_size`, `font_weight` | `text.<field>.font_size`, `font_weight` |
| `variables.card.border.left.size`, `top.size` (elbows) | `elbow.segment.bar_width`, `bar_height` |
| `variables.card.border.top.left_radius` (elbows) | `elbow.segment.outer_curve` |
| `variables.card.border.color` (elbows) | `elbow.segment.color` |
| `layout_options.grid_columns`, `grid_rows` | `grid_options.columns`, `rows` (the old grid had 4 columns, the new one 12: multiply the columns by 3) |
| `card_mod` | not needed: use the card's own style keys, or UIX for anything else |
:::
