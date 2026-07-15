# Button Card

`custom:lcards-button`

The Button card covers everything from simple labels and toggle buttons to complex interactive components like D-pads and multi-segment SVG controls. Elbows are derived from the same base - most features here are also available in the [Elbow card](../elbow/).

---

## Quick Start

```yaml
# Lozenge button — entity toggle
type: custom:lcards-button
entity: light.living_room
preset: lozenge
tap_action:
  action: toggle
```

```yaml
# Bar-label section header (decorative)
type: custom:lcards-button
preset: bar-label-left
interactive: false
text:
  label:
    content: NAVIGATION
```

---

## Common Properties

The following properties are shared across LCARdS cards. See [Common Card Properties](../common.md) for full details.

| Category | Config keys | Reference |
|----------|-------------|-----------|
| Sizing | `height`, `width`, `min_height`, `min_width`, `max_height`, `max_width` | [Sizing](../common.md#sizing-height-width-min_height-min_width-max_height-max_width) |
| Overflow | `overflow`, `overflow_x`, `overflow_y` | [Overflow](../common.md#overflow-overflow-overflow_x-overflow_y) |
| Stacking | `z_index` | [Stacking](../common.md#stacking-z_index) |
| Identity | `id`, `tags` | [ID & Tags](../common.md#card-identification-id-and-tags) |
| HA Grid | `grid_options` | [HA Grid Sizing](../common.md#ha-grid-sizing-grid_options) |
| Data | `data_sources`, `triggers_update` | [Data Sources](../../core/datasources/) |
| Text labels | `text` | [Text Fields](../../core/text-fields.md) |
| Actions | `tap_action`, `hold_action`, `double_tap_action` | [Actions](../../core/actions.md) |
| Animations | `animations`, `background_animation` | [Animations](../../core/animations.md) |
| Sounds | `sounds` | [Sounds](../../core/sounds.md) |
| Rules | via `id` / `tags` | [Rules Engine](../../core/rules/) |

---

## Config Structure

Annotated map of all top-level keys. You only need the keys relevant to your use case — everything else has sensible defaults.

```yaml
type: custom:lcards-button

# ── Identity & entity ──────────────────────────────────────────────────────────
entity: light.living_room   # entity to monitor / control (optional for decorative)
id: my-button               # rules engine targeting (unique per dashboard)
tags: [nav, lights]         # group tags for rules engine

# ── Mode (choose one) ──────────────────────────────────────────────────────────
preset: lozenge             # preset mode  ← most common
component: dpad             # component mode: 'dpad' or 'alert'
svg:                        # custom SVG mode
  content: "<svg>...</svg>"

# ── Core display ───────────────────────────────────────────────────────────────
interactive: true           # false = suppress hover effects (actions still fire)
icon: mdi:lightbulb
icon_area: left             # left | right | top | bottom | none
icon_area_size: 60
icon_area_background:           # string or state-based: default | active | inactive | hover | pressed | unavailable
  default: transparent
  active: "var(--lcars-orange)"
icon_style: {}              # colour, size, position, rotation — see icon_style
divider: {}                 # line between icon area and content

# ── Appearance ─────────────────────────────────────────────────────────────────
style:
  card:
    color:
      background:               # string or state-based object
        default: "var(--ha-card-background)"
        active: "alpha(var(--lcars-orange), 0.15)"
  border:
    color:                      # string or state-based object
      default: "var(--lcars-orange)"
      inactive: "alpha(var(--lcars-orange), 0.3)"
    width: 2
    radius: 8
  text:
    default:
      color:                    # string or state-based object
        default: "var(--lcars-moonlight)"
shape_texture:
  preset: fluid
filters: []

# ── Text labels ────────────────────────────────────────────────────────────────
text:
  default:
    font_family: "Antonio, sans-serif"
  label:
    content: "My Label"
    position: top-left

# ── Actions ────────────────────────────────────────────────────────────────────
tap_action:
  action: toggle
hold_action:
  action: more-info
double_tap_action:
  action: navigate
  navigation_path: /lights

# ── Animations & effects ───────────────────────────────────────────────────────
animations: []
background_animation: []
sounds: {}

# ── Component-specific (only needed for the chosen component mode) ─────────────
dpad:
  segments:
    default:                    # shared properties inherited by all segments
      style:
        fill:                   # stateColorSchema
          default: "var(--lcars-orange)"
          inactive: "alpha(var(--lcars-orange), 0.3)"
    center:                     # per-segment override (up/down/left/right/center)
      tap_action:
        action: toggle
alert:
  color:                        # fill/stroke shorthand — plain strings, not state-based
    shape: "var(--lcars-orange)"    # fill colour for the shield shape
    bars: "var(--lcars-moonlight)"  # stroke colour for the bar lines
ranges: []
ranges_attribute: ""

# ── Layout ─────────────────────────────────────────────────────────────────────
height: 60
width: 200
min_height: 40
max_height: 200
overflow: hidden
z_index: 0
grid_options:
  columns: 4
  rows: 1
data_sources: {}
triggers_update: []
```

---

## Modes

The card operates in one of three modes, selected by which top-level key is present:

| Mode | Key | Use for |
|------|-----|---------|
| **Preset** | `preset` | Standard LCARS buttons — lozenge, bullet, capped, etc. |
| **Component** | `component` | Interactive multi-segment controls (D-pad, alert shape) |
| **Custom SVG** | `svg` | Your own SVG with interactive segments |

---

## Presets

### Standard Buttons

| Preset | Description |
|--------|-----------|
| `lozenge` | Fully rounded on both ends, icon area on left |
| `lozenge-right` | Fully rounded on both ends, icon area on right |
| `bullet` | Rounded right end, flat left — icon area on left |
| `bullet-right` | Rounded left end, flat right — icon area on right |
| `capped` | Rounded left end, flat right — icon area on left |
| `capped-right` | Rounded right end, flat left — icon area on right |
| `barrel` | Flat corners, no border, icon area on left |
| `barrel-right` | Flat corners, no border, icon area on right |
| `filled` | Transparent border, large text label on right |
| `filled-right` | Transparent border, large text label on left |
| `outline` | Transparent background, border only — Picard style |
| `outline-right` | Transparent background, border only, icon area on right |
| `icon` | Square icon-only button with large rounded corners |
| `text-only` | No background or border — pure text label |

### Bar Labels

Horizontal bars with an opaque text background that creates a "break" in the bar — classic LCARS header style.

| Preset | Description |
|--------|-----------|
| `bar-label-base` | Bar label foundation — filled button, auto-scaling text, centered |
| `bar-label-left` | Bar label with left-aligned text |
| `bar-label-center` | Bar label with centered text |
| `bar-label-right` | Bar label with right-aligned text |
| `bar-label-square` | Bar label with square corners |
| `bar-label-lozenge` | Bar label with fully rounded ends |
| `bar-label-bullet-left` | Bar label with flat left, rounded right |
| `bar-label-bullet-right` | Bar label with rounded left, flat right |
| `bar-label-capped-left` | Bar label with rounded left, flat right |
| `bar-label-capped-right` | Bar label with flat left, rounded right |

---

## Card Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-button` (required) |
| `entity` | string | Entity to monitor and control |
| `preset` | string | Button shape preset — see [Presets](#presets) |
| `component` | string | Component type: `dpad` or `alert` — see [Component Mode: D-pad](#component-mode-d-pad) |
| `svg` | object | Custom SVG config — see [Custom SVG Mode](#custom-svg-mode) |
| `interactive` | boolean | `true` by default. Set `false` to suppress hover effects — see [Decorative Buttons](#decorative--non-interactive-buttons) |
| `ranges_attribute` | string | Entity attribute for range conditions — see [Range Conditions](../../core/colours.md#range-conditions-on-non-numeric-entities-ranges_attribute) |
| `state_attribute` | string | Attribute whose string value drives exact-key colour matching — see [state_attribute](../../core/colours.md#exact-match-keys-from-an-attribute--state_attribute) |
| `state_classification` | object | Override which state bucket unmapped states fall into (`else: default\|active\|inactive`) — see [state_classification](../../core/colours.md#custom-state-classification--state_classification) |
| `ranges` | list | State-driven preset switching — see [Component Mode: Alert](#component-mode-alert) |
| `control` | object | Control behaviour — see [Control](#control) |
| `show_icon` | boolean | Show/hide the icon (default: `true`) |
| `icon` | string | MDI icon (e.g. `mdi:lightbulb`) |
| `icon_area` | string | Icon position: `left`, `right`, `top`, `bottom`, `none` (default: `left`) |
| `icon_area_size` | number | Icon area width/height in px (default: `60`) |
| `icon_area_background` | string / object | Icon area background — [state map](../../core/colours.md) supported |
| `icon_style` | object | Advanced icon styling — see [`icon_style` Object](#icon_style-object) |
| `divider` | object | Divider between icon area and content — see [`divider` Object](#divider-object) |
| `dpad` | object | D-pad segment config — see [Component Mode: D-pad](#component-mode-d-pad) |
| `alert` | object | Alert component config — see [Component Mode: Alert](#component-mode-alert) |
| `style` | object | Visual styles — see [`style` Object](#style-object) |
| `shape_texture` | object | SVG texture inside the button shape — see [Shape Texture](#shape-texture) |
| `filters` | list | CSS / SVG filters — see [`filters` List](#filters-list) |

---

## Control

| Field | Type | Description |
|-------|------|-------------|
| `control.attribute` | string | Entity attribute to control (leave blank to control entity state directly) |

```yaml
control:
  attribute: brightness   # control light brightness directly
```

---

## `style` Object

### `style.card`

| Field | Type | Description |
|-------|------|-------------|
| `color.background` | string / object | Card background — [state map](../../core/colours.md) supported |

### `style.cursor`

| Field | Type | Description |
|-------|------|-------------|
| `cursor` | string | CSS cursor shown on hover. Any valid CSS cursor value. Overrides the automatic cursor (which is `pointer` when `interactive: true`, `default` when `interactive: false`). Common values: `pointer`, `default`, `none`, `not-allowed`, `crosshair`, `grab`, `zoom-in`, `help`, `wait`, `progress`, `move`, `copy`, `text`. |

### `style.border`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `color` | string / object | theme | Border colour — [state map](../../core/colours.md) supported |
| `width` | number / string / object | `0` | Border width in px, a theme token string, or `{ top, right, bottom, left }` per-side |
| `radius` | number / string / object | theme | Corner radius in px, a theme token string, or `{ top_left, top_right, bottom_right, bottom_left }` per-corner |

```yaml
style:
  card:
    color:
      background:
        default: "var(--ha-card-background)"
        active: "alpha(var(--lcards-orange), 0.08)"
  border:
    color:
      default: "var(--lcards-gray)"
      active: "var(--lcards-orange)"
    width: 2
    radius: 12          # or per-corner: { top_left: 20, top_right: 4, bottom_left: 4, bottom_right: 20 }
```

---

## `icon_style` Object

Fine-grained control over the icon appearance and placement within its area.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | string | `mdi` | Icon type: `mdi`, `si` (Simple Icons), or `entity` (entity state icon) |
| `icon` | string / object | — | MDI icon name, or a [state map](../../core/colours.md) of icon names — overrides the top-level `icon` field |
| `color` | string / object | theme | Icon colour — [state map](../../core/colours.md) supported |
| `size` | number | `24` | Icon size in px |
| `position` | string | `center` | Icon position within its area |
| `x` | number | — | Absolute X offset in px (overrides `position`) |
| `y` | number | — | Absolute Y offset in px (overrides `position`) |
| `x_percent` | number | — | X as percentage of icon area width (0–100) |
| `y_percent` | number | — | Y as percentage of icon area height (0–100) |
| `rotation` | number | `0` | Icon rotation in degrees (-360 to 360) |
| `padding` | number / object | — | Padding in px (number = all sides, or `{ top, right, bottom, left }`) |
| `padding_left` | number | — | Left padding in px — overrides `padding` |
| `padding_right` | number | — | Right padding in px — overrides `padding` |
| `padding_top` | number | — | Top padding in px — overrides `padding` |
| `padding_bottom` | number | — | Bottom padding in px — overrides `padding` |
| `spacing` | number | `8` | Space between icon and text area in px |

```yaml
icon: mdi:thermometer
icon_area: left
icon_style:
  color:
    default: "var(--lcards-gray)"
    active: "var(--lcards-orange)"
  size: 32
  padding: 8
```

### Per-State Icons

Set `icon_style.icon` to a state map to swap the icon based on entity state (including range conditions):

```yaml
entity: light.tv
ranges_attribute: brightness_pct   # range keys compare against brightness 0–100 %
icon: mdi:lightbulb                # default / fallback icon
icon_style:
  icon:
    active: mdi:lightbulb
    inactive: mdi:lightbulb-off
    above:90: mdi:lightbulb-alert
    below:20: mdi:lightbulb-outline
```

The same resolution order as state-based colours applies (exact state → zero → ranges → non_zero → classified → default). See [Range Conditions on Non-Numeric Entities](../../core/colours.md#range-conditions-on-non-numeric-entities-ranges_attribute) for the `ranges_attribute` pattern.

---

## `divider` Object

Thin line between the icon area and the content area.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `color` | string / object | theme | Divider colour — [state map](../../core/colours.md) supported |
| `width` | number | theme | Divider thickness in px |

```yaml
divider:
  color: "var(--lcards-orange)"
  width: 2
```

---

## `filters` List

CSS and SVG filters applied to the card.

| Field | Type | Description |
|-------|------|-------------|
| `mode` | string | `css` (default) or `svg` |
| `type` | string | CSS type (`blur`, `brightness`, `contrast`, `saturate`, `drop-shadow`) or SVG primitive |
| `value` | string / number / object | Filter parameters |

```yaml
filters:
  - type: blur
    value: 4

  - type: brightness
    value: 0.8

  - type: saturate
    value: 0.5
```

---

## Text Fields

Multiple text labels can be placed anywhere on the card. See [Text Fields](../../core/text-fields.md) for the full reference.

```yaml
text:
  default:
    font_family: "Antonio, sans-serif"
    color: "var(--lcards-moonlight)"
  name:
    content: "Temperature"
    position: top-left
    font_size: 11
  value:
    content: "{entity.state}°C"
    position: center
    font_size: 28
    font_weight: bold
    color:
      default: "var(--lcards-moonlight)"
      unavailable: "var(--lcards-alert-red)"
```

---

## Component Mode: D-pad

D-pad segments: `center`, `up`, `down`, `left`, `right`, `up-left`, `up-right`, `down-left`, `down-right`

The `default` key under `segments` applies shared config to all segments.

| Field | Type | Description |
|-------|------|-------------|
| `entity` | string | Entity for this segment (state-based colours, icons) |
| `tap_action` | object | Action on tap — see [Actions](../../core/actions.md) |
| `hold_action` | object | Action on hold |
| `double_tap_action` | object | Action on double-tap |
| `style.fill` | string / object | Segment fill colour — [state map](../../core/colours.md) supported |
| `style.stroke` | string / object | Segment stroke colour — [state map](../../core/colours.md) supported |
| `style.stroke-width` | number / string / object | Stroke width in px, CSS string, or state-based map |
| `style.opacity` | number / object | Segment opacity (0–1) or state-based map |
| `text` | object | Per-segment text labels |
| `icon` | string | MDI icon for this segment |
| `animations` | list | Segment-specific animations |

```yaml
type: custom:lcards-button
component: dpad
dpad:
  segments:
    default:
      style:
        fill:
          default: "var(--lcards-gray)"
          active: "var(--lcards-orange)"
    center:
      entity: media_player.tv
      tap_action:
        action: call-service
        service: media_player.media_play_pause
        target:
          entity_id: media_player.tv
    up:
      tap_action:
        action: call-service
        service: media_player.volume_up
        target:
          entity_id: media_player.tv
    down:
      tap_action:
        action: call-service
        service: media_player.volume_down
        target:
          entity_id: media_player.tv
```

---

## Component Mode: Alert

The alert component displays a Starfleet alert symbol with animated bar elements.

### `alert` Object

| Field | Type | Description |
|-------|------|-------------|
| `alert.color.shape` | string | Fill colour override for the shield shape |
| `alert.color.bars` | string | Stroke colour override for the bar lines |
| `alert.custom_presets` | object | Custom or override presets merged over built-ins (keyed by preset name) |
| `alert.segments` | object | Per-segment fine-grained style overrides (`shape`, `bars`) |

### `ranges` List (state-driven preset switching)

| Field | Type | Description |
|-------|------|-------------|
| `ranges[].preset` | string | Component preset name to apply when this range matches (required) |
| `ranges[].attribute` | string | Override `ranges_attribute` for this entry only |
| `ranges[].above` | number | Match when value is > this threshold (strictly greater) |
| `ranges[].at_least` | number | Match when value is ≥ this threshold (inclusive) |
| `ranges[].below` | number | Match when value is < this threshold (strictly less) |
| `ranges[].at_most` | number | Match when value is ≤ this threshold (inclusive) |
| `ranges[].equals` | string / number / boolean | Match when value equals this |
| `ranges[].color.shape` | string | Transient shape fill override while this range is active |
| `ranges[].color.bars` | string | Transient bars stroke override while this range is active |

::: warning Behavior change
`above`/`below` are now strict (`>`/`<`), matching every other comparison
system in LCARdS. Previously `above` here meant `>=`. If you have an
existing `ranges:` config relying on a value landing exactly on an `above`
boundary, use the new `at_least` key instead to get the old inclusive
behavior explicitly (see the example below).
:::

```yaml
type: custom:lcards-button
component: alert
preset: default          # default, red, yellow, blue, green, grey, black

# State-driven preset switching
entity: sensor.threat_level
ranges:
  - preset: red
    at_least: 80          # value >= 80
  - preset: yellow
    at_least: 50
    below: 80              # 50 <= value < 80 — tiles with no gap against red/default
  - preset: default
    below: 50              # value < 50
```

---

## Custom SVG Mode

### `svg` Object

| Field | Type | Description |
|-------|------|-------------|
| `svg.content` | string | Inline SVG markup |
| `svg.src` | string | URL to an external SVG file |
| `svg.viewBox` | string | Override the SVG `viewBox` attribute |
| `svg.preserveAspectRatio` | string | SVG `preserveAspectRatio` value |
| `svg.enable_tokens` | boolean | Resolve `{theme:...}` tokens inside the SVG markup |
| `svg.allow_scripts` | boolean | Allow `<script>` elements inside the SVG (default: `false`) |
| `svg.segments` | object | Interactive segment configs keyed by element `id` — use `default` for shared config |

```yaml
type: custom:lcards-button
svg:
  content: |
    <svg viewBox="0 0 200 100">
      <rect id="btn-a" x="10" y="10" width="80" height="80" fill="var(--lcards-orange)" rx="8"/>
      <rect id="btn-b" x="110" y="10" width="80" height="80" fill="var(--lcards-blue)" rx="8"/>
    </svg>
  segments:
    default:
      style:
        fill:
          active: "var(--lcards-orange-medium)"
    btn-a:
      entity: light.zone_a
      tap_action:
        action: toggle
    btn-b:
      entity: light.zone_b
      tap_action:
        action: toggle
```

SVG elements with `id` attributes become interactive segments.

> **Note**: When using CSS custom properties in SVG `fill` attributes, browser support can vary. Using `currentColor` in the SVG with CSS `color` styling via JavaScript is a reliable cross-browser alternative. The example above works in modern browsers and the HA web app.

---

## Shape Texture

`shape_texture` renders a Canvas2D texture or animation **inside** the button shape fill — clipped to the shape boundary. Available in **preset mode only**. Elbow cards also support this feature.

```yaml
shape_texture:
  preset: fluid
  opacity: 0.4            # 0–1, or state-based map
  mix_blend_mode: screen
  speed: 1.0              # 0 = static
  config: {}
```

### Available Presets

| Preset | Description | Key Config |
|--------|-------------|-----------|
| `grid` | Scrolling orthogonal grid lines | `line_spacing`, `pattern` (both/horizontal/vertical) |
| `diagonal` | Scrolling diagonal hatching | `line_spacing` |
| `hexagonal` | Scrolling hexagonal grid | `hex_radius` |
| `dots` | Scrolling dot grid | `dot_radius`, `spacing` |
| `fluid` | Organic swirling fractalNoise | `base_frequency`, `num_octaves` |
| `plasma` | Dual-colour turbulence wash | `color_a`, `color_b`, `base_frequency` |
| `shimmer` | Directional light-sweep | `angle`, `highlight_width`, `speed` |
| `flow` | Directional streaming currents | `wave_scale`, `scroll_speed_x` |
| `level` | Fill bar with optional wave | `fill_pct`, `direction`, `wave_height` |
| `pulse` | Breathing radial glow | `radius`, `min_size`, `speed` |
| `scanlines` | CRT-style scan-line overlay | `line_spacing`, `direction` |
| `image` | User-supplied image clipped to shape | `url`, `size`, `position`, `repeat` |
All `color` fields accept `var(--lcards-*)`, `{theme:...}`, `rgba()`, hex, or a state-based map.

For full parameter reference see [Shape Texture System](../../architecture/internals/shape-texture-system.md).

---

## Background Animations

See [Background Animations](../../core/effects/background-animations.md) for full docs.

```yaml
background_animation:
  - preset: grid
    config:
      line_spacing: 40
      color: "alpha(var(--lcards-orange), 0.3)"
```

---

## Decorative / Non-Interactive Buttons

By default every button shows a pointer cursor and changes colour on hover. For purely decorative panels that should not signal interactivity, set `interactive: false`.

| What changes | `interactive: true` (default) | `interactive: false` |
|---|---|---|
| Cursor on hover | `pointer` (hand) | `default` (arrow) |
| Background colour on hover | Changes to hover colour from preset/style | No change |
| Hover animations | Fire | Suppressed |
| Tap / hold actions | Fire normally | Fire normally |

```yaml
type: custom:lcards-button
entity: light.corridor
preset: lozenge
interactive: false          # decorative — no hand cursor or hover colour change
tap_action:
  action: toggle             # action still works if you want it
```

To keep hover effects but override only the cursor shape, use `style.cursor` independently:

```yaml
type: custom:lcards-button
style:
  cursor: crosshair          # any valid CSS cursor string
```

---

## Annotated Example

A lozenge button with entity binding, state-based colours, templates, an animation, and actions:

```yaml
type: custom:lcards-button
entity: light.workbench
preset: lozenge

text:
  default:
    font_family: "Antonio, sans-serif"
  label:
    content: Workbench
    position: top-left
    font_size: 11
    text_transform: uppercase
    color: "var(--lcards-moonlight)"
  value:
    content: "[[[return entity.state === 'on' ? Math.round(entity.attributes.brightness / 255 * 100) + '%' : 'Off']]]"
    position: center
    font_size: 26
    font_weight: bold
    color:
      default: "var(--lcards-moonlight)"
      inactive: "var(--lcards-gray)"

icon: mdi:desk-lamp
icon_area: left
icon_style:
  color:
    default: "var(--lcards-gray)"
    active: "var(--lcards-orange)"
  size: 28

style:
  border:
    color:
      default: "var(--lcards-gray)"
      active: "var(--lcards-orange)"
    width: 2

tap_action:
  action: toggle

hold_action:
  action: more-info

animations:
  - trigger: on_tap
    preset: bounce
    params:
      scale_max: 1.05
      bounces: 2
    duration: 400

  - trigger: on_entity_change
    entity: light.workbench
    to_state: "on"
    check_on_load: true
    preset: glow
    params:
      color: "var(--lcards-orange)"
      blur_max: 12
    loop: true
```

---
