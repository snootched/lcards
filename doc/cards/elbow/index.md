# Elbow Card

`custom:lcards-elbow`

The Elbow card creates the iconic LCARS corner/cap shapes — the L-shaped coloured bars that frame sections of an LCARS interface. Extends the button card so it inherits text, actions, rules, animations, and templates.

---

## Quick Start

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
```

---

## Top-Level Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-elbow` (required) |
| `elbow` | object | Elbow geometry and styling (required) |
| `entity` | string | Entity to monitor (for state-based styling) |
| `preset` | string | Style preset name (inherits from button presets, e.g. `lozenge`, `pill`) |
| `ranges_attribute` | string | Entity attribute used for `above:`/`below:`/`between:` range conditions — see [Range Conditions](../../core/colours.md#range-conditions-on-non-numeric-entities-ranges_attribute) |
| `id` | string | Card ID for rule targeting — see [Rules Engine](../../core/rules/index.md) |
| `tags` | list | Tags for rule targeting — see [Rules Engine](../../core/rules/index.md) |
| `height` | string / number | Card height — see [Sizing](../../core/sizing.md) |
| `width` | string / number | Card width — see [Sizing](../../core/sizing.md) |
| `min_height` | string / number | Minimum card height — see [Sizing](../../core/sizing.md) |
| `min_width` | string / number | Minimum card width — see [Sizing](../../core/sizing.md) |
| `text` | object | Text labels — see [Text Fields](../../core/text-fields.md) |
| `tap_action` | object | Tap action — see [Actions](../../core/actions.md) |
| `hold_action` | object | Hold action — see [Actions](../../core/actions.md) |
| `double_tap_action` | object | Double-tap action — see [Actions](../../core/actions.md) |
| `animations` | list | Card animations — see [Animations](../../core/animations.md) |
| `background_animation` | list / object | Canvas background animations — see [Background Animations](../../core/background-animations.md) |
| `shape_texture` | object | SVG texture inside the elbow shape fill |
| `filters` | list | Visual filters (CSS / SVG filter primitives) — see [Filters](../../core/filters.md) |
| `sounds` | object | Per-card sound overrides — see [Sounds](../../core/sounds.md) |
| `data_sources` | object | DataSource subscriptions — see [DataSources](../../core/data-sources.md) |
| `triggers_update` | list | Extra entity IDs that force template re-evaluation |
| `grid_options` | object | HA grid layout options (`columns`, `rows`, `min_columns`, `min_rows`) |

---

## Elbow Types

Set via `elbow.type`. The type determines the corner position and shape of the L-bar.

| Type | Description | Styles |
|------|-------------|--------|
| `header-left` | Top-left corner — vertical bar on left, horizontal bar on top | simple, segmented |
| `header-right` | Top-right corner — vertical bar on right, horizontal bar on top | simple, segmented |
| `footer-left` | Bottom-left corner — vertical bar on left, horizontal bar on bottom | simple, segmented |
| `footer-right` | Bottom-right corner — vertical bar on right, horizontal bar on bottom | simple, segmented |
| `header-contained` | Horizontal bar with mirrored elbows on both left and right ends (top) | simple |
| `footer-contained` | Horizontal bar with mirrored elbows on both left and right ends (bottom) | simple |
| `header-open` | Simple horizontal bar at top — no vertical arms | simple |
| `footer-open` | Simple horizontal bar at bottom — no vertical arms | simple |
| `diagonal-cap-left` | Top-left with configurable diagonal cut on both corners (controlled by `segment.diagonal_angle`) | simple, segmented |
| `diagonal-cap-right` | Top-right with configurable diagonal cut on both corners | simple, segmented |
| `diagonal-cap-footer-left` | Bottom-left with configurable diagonal cut on both corners | simple, segmented |
| `diagonal-cap-footer-right` | Bottom-right with configurable diagonal cut on both corners | simple, segmented |
| `frame` | Full rectangular frame — 2–4 sided border with per-side widths and per-corner radii | simple, segmented |

---

## Elbow Styles

### Simple (default)

Single elbow — one curved L-shape.

```yaml
elbow:
  type: header-left
  style: simple
  segment:
    bar_width: 90       # Vertical bar thickness (px)
    bar_height: 20      # Horizontal bar thickness (px)
    outer_curve: auto   # Corner radius — 'auto' = bar_width / 2 (LCARS formula)
    color:
      default: "var(--lcards-orange)"
      active: "var(--lcards-orange-medium)"
```

### Segmented (TNG / Picard style)

Two concentric elbows with a gap — the double-elbow look from Star Trek TNG.

```yaml
elbow:
  type: header-left
  style: segmented
  segments:
    gap: 4
    outer_segment:
      bar_width: 90
      bar_height: 20
      color: "var(--lcars-orange)"
    inner_segment:
      bar_width: 30
      bar_height: 10
      color: "var(--lcars-moonlight)"
```

---

## Segment Options (Simple Style)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `bar_width` | number / `"theme"` | `90` | Vertical bar thickness in px. Use `"theme"` to bind to `input_number.lcars_vertical` |
| `bar_height` | number / `"theme"` | `20` | Horizontal bar thickness in px. Use `"theme"` to bind to `input_number.lcars_horizontal` |
| `outer_curve` | number / `"auto"` | `"auto"` | Corner arc radius. `auto` = `bar_width / 2` |
| `inner_curve` | number | — | Inner arc radius (omit for LCARS formula: `outer / 2`) |
| `diagonal_angle` | number | `45` | Angle of the diagonal cap in degrees (diagonal-cap elbow types only) |
| `color` | string / object | — | Fill colour — [state map](../../core/colours.md) supported |

---

## Segments Options (Segmented Style)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gap` | number | `4` | Gap in px between outer and inner elbow |
| `outer_segment` | object | — | Outer (frame) segment config — see below |
| `inner_segment` | object | — | Inner (content) segment config — see below |

### `outer_segment` and `inner_segment` fields

Both `outer_segment` and `inner_segment` share the same schema:

| Option | Type | Description |
|--------|------|-------------|
| `bar_width` | number | Vertical bar thickness in px (**required**) |
| `bar_height` | number | Horizontal bar thickness in px |
| `outer_curve` | number | Outer corner radius in px |
| `inner_curve` | number | Inner corner radius in px |
| `color` | string / object | Fill colour — [state map](../../core/colours.md) supported |
| `entity_id` | string | Entity ID for state-based colour on this segment |
| `tap_action` | object | Tap action for this segment — see [Actions](../../core/actions.md) |
| `hold_action` | object | Hold action for this segment |
| `double_tap_action` | object | Double-tap action for this segment |

---

## HA-LCARS Theme Binding

If you use the [HA-LCARS theme](https://github.com/th3jesta/ha-lcars), bind bar dimensions to the theme helpers to keep all elbows synchronised:

```yaml
elbow:
  type: footer-right
  segment:
    bar_width: theme     # Reads input_number.lcars_vertical
    bar_height: theme    # Reads input_number.lcars_horizontal
```

Changing the helper value updates every elbow using `theme` binding simultaneously.

---

## Text Labels

Elbows inherit the full button text system. Common use: a label on the horizontal bar.

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 120
    bar_height: 22
text:
  section:
    content: NAVIGATION
    position: top-right
    font_size: 11
    font_weight: bold
    color: "var(--lcards-moonlight)"
```

See [Text Fields](../../core/text-fields.md) for the complete reference.

---

## Background Animation Inset

Elbow cards support a canvas-level `inset` on `background_animation` so the animation fills only the open content area, not the LCARS bars.

### Auto inset (recommended)

Use `inset: auto` to let the card automatically derive the correct inset from its bar geometry:

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
background_animation:
  inset: auto       # canvas sized to avoid the elbow bars
  effects:
    - preset: grid
      config:
        line_spacing: 40
        color: "alpha(var(--lcards-orange), 0.3)"
```

### Manual inset

Supply explicit pixel values when you need precise control:

```yaml
background_animation:
  inset:
    top: 20         # height of horizontal top bar
    left: 90        # width of vertical left bar
    right: 0
    bottom: 0
  effects:
    - preset: starfield
      config:
        count: 150
```

> **Note**: `inset: auto` is computed from the resolved bar geometry at runtime and updates automatically when theme bar dimensions change via `input_number` helpers.

---

## Shape Texture

Elbow cards support the same `shape_texture` feature as button cards — an SVG-native texture or animation clipped to the elbow shape fill (simple and segmented styles). Configuration is identical.

See [Button card — Shape Texture](../button/#shape-texture) for the full preset reference and examples.

---

## Symbiont

The Symbiont feature embeds any Home Assistant card inside the elbow's content area. LCARdS mounts the card in the open frame and can optionally inject styles directly into the embedded card's shadow root ("imprinting"), keeping the look consistent with your LCARS theme without modifying the embedded card's own config.

### Basic Example

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 100
    bar_height: 22
symbiont:
  enabled: true
  card:
    type: alarm-panel
    entity: alarm_control_panel.home
    states:
      - arm_away
      - arm_home
```

### Symbiont Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable or disable the symbiont |
| `card` | object | — | Any valid HA card config (`type` + card properties) |
| `position` | object | — | Padding (px) within the elbow content area |
| `position.top` | number | `10` | Top padding |
| `position.left` | number | `10` | Left padding |
| `position.right` | number | `10` | Right padding |
| `position.bottom` | number | `0` | Bottom padding |
| `imprint` | object | — | Shadow-root style injection — see below |
| `custom_style` | string | — | Raw CSS appended to the embedded card's shadow root (no card-mod required) |

### Imprint

Imprint injects a `<style>` element directly into the embedded card's shadow root. Properties are resolved against the elbow's entity state, so they react to state changes exactly like the elbow's own colours.

| Option | Type | Description |
|--------|------|-------------|
| `imprint.enabled` | boolean | `true` by default — set `false` to disable all injection |
| `imprint.background` | string / state map | Background colour injected on `ha-card` |
| `imprint.text.color` | string / state map | Text colour injected on `ha-card` |
| `imprint.text.font_size` | string | Font size (e.g. `"14px"`) |
| `imprint.text.font_family` | string | Font family string |
| `imprint.border_radius` | object | Per-corner border radii — see below |

Colour values accept the same forms as everywhere else in LCARdS: hex, `rgba()`, `var(--token)`, `darken()`/`lighten()`/`alpha()` expressions, and full state maps with `default`/`active`/`inactive`/named-state keys.

#### State-Reactive Imprint

```yaml
symbiont:
  enabled: true
  card:
    type: alarm-panel
    entity: alarm_control_panel.home
  imprint:
    background:
      default: "rgba(0,0,0,0.5)"
      active: "alpha(var(--lcars-red), 0.25)"
    text:
      color:
        default: "var(--lcars-orange)"
        active: "var(--lcars-red)"
    border_radius:
      top_left: match       # copies the elbow inner arc radius
      top_right: 0
      bottom_left: 0
      bottom_right: 0
```

#### Border Radius Options

Each corner accepts one of:

| Value | Effect |
|-------|--------|
| `"match"` | Mirrors the elbow's inner arc radius (recommended for the corner adjacent to the elbow) |
| number | Fixed radius in px |
| *(absent)* | Not injected — card keeps its own radius |

The legacy shorthand `imprint.border_radius.match_host: true` (default when `border_radius` is omitted) automatically applies `match` to only the single corner that is adjacent to the elbow hull, leaving the other three corners at `0`. Set to `false` to suppress all radius injection.

### Custom Style

`custom_style` lets you inject arbitrary CSS into the embedded card's shadow root without card-mod:

```yaml
symbiont:
  enabled: true
  card:
    type: entities
    entities:
      - sensor.temperature
  custom_style: |
    ha-card {
      --ha-card-border-radius: 0;
      --secondary-text-color: var(--lcars-moonlight);
    }
```

The custom style is appended **after** imprint styles, so it takes precedence when both set the same property.

### Using card-mod with Symbiont

card-mod works with symbiont cards. The `card_mod` block is part of the embedded card's config and is passed straight through to it.

**Injection order:**
1. card-mod injects its `<style>` during `setConfig`
2. LCARdS imprint appends its `<style id="lcards-symbiont-imprint">` after the card is ready

Because imprint is appended later in the shadow root, **imprint wins when both set the same property**. For properties that do not overlap there is no conflict.

```yaml
symbiont:
  enabled: true
  card:
    type: alarm-panel
    entity: alarm_control_panel.home
    card_mod:
      style: |
        ha-card {
          background: transparent !important;
          box-shadow: none !important;
          border: 1px solid var(--lcars-blue, #93e1ff) !important;
          border-radius: 0 !important;
        }
  imprint:
    text:
      color:
        default: "var(--lcars-orange)"
        active: "var(--lcars-red)"
```

> **Note:** `custom_style` injects raw CSS without card-mod. For simple shadow-root overrides prefer `custom_style` — it avoids a card-mod dependency and is handled entirely by LCARdS.

### Lazy-Loaded HA Card Types

HA lazy-loads many of its own built-in card modules (e.g. `alarm-panel`, `thermostat`, `media-player`) — they are only imported when they first appear on a dashboard. On a fresh page load, before another dashboard view has triggered the import, the element is not yet registered.

LCARdS handles this automatically: when the requested type is not yet registered, it routes through HA's internal `hui-card` wrapper which triggers the correct dynamic import. The card renders as soon as HA finishes loading the module — no configuration required.

---

## Examples

### Standard header cap pair

```yaml
# Left cap
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: theme
    bar_height: theme

# Right cap
type: custom:lcards-elbow
elbow:
  type: header-right
  segment:
    bar_width: theme
    bar_height: theme
```

### State-reactive elbow

Changes colour when a sensor is above threshold (using [Rules Engine](../../core/rules/)):

```yaml
type: custom:lcards-elbow
id: alert-cap
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    color:
      default: "var(--lcards-orange)"
```

Then define a rule that patches `id: alert-cap` when the sensor is high.

---
