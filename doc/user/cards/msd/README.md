# MSD Card

`custom:lcards-msd`

Master Systems Display — a zoomable SVG canvas on which you position any Home Assistant card as an overlay. Lines (routes) connect anchors across the canvas. Supports rules-based automation of both overlay styles and base SVG filters.

---

## Quick Start

```yaml
type: custom:lcards-msd
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
  anchors:
    bridge: [520, 380]
    engineering: [620, 520]
  overlays:
    - id: bridge-status
      type: control
      anchor: bridge
      size: [180, 80]
      card:
        type: custom:lcards-button
        entity: light.bridge
        preset: lozenge
    - id: engineering-line
      type: line
      route: auto
      from: bridge
      to: engineering
```

---

## Top-Level Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-msd` (required) |
| `msd` | object | Full MSD configuration (required) |
| `id` | string | Card ID for rule targeting |
| `tags` | list | Tags for rule targeting |
| `rules` | list | Rules for dynamic overlay styling — see [Rules Engine](../../core/rules/README.md) |
| `data_sources` | object | DataSource definitions — see [DataSources](../../core/datasources/README.md) |

---

## `msd` Object

| Option | Type | Description |
|--------|------|-------------|
| `base_svg` | object | SVG source and filters (required) |
| `view_box` | string / array | `"auto"` or `[minX, minY, width, height]` |
| `anchors` | object | Named `[x, y]` anchor points for overlay placement |
| `overlays` | list | Control and line overlays — see below |
| `routing` | object | Global line routing settings |
| `debug` | object | Debug visualisation options |

---

## `base_svg` Object

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | SVG source — `builtin:<name>`, `/local/path.svg`, or `none` |
| `filter_preset` | string | Named filter preset — see table below |
| `filters` | list | Additional CSS/SVG filters — see [Button card — Filters](../button/README.md#filters-list) |

### Filter Presets

Filter presets apply a CSS filter combination to the base SVG to shift the visual weight, letting overlays stand out:

| Preset | Opacity | Effect |
|--------|---------|--------|
| `dimmed` | 0.5 | Moderate de-emphasis, brightness 0.8 |
| `subtle` | 0.6 | Gentle — slight blur + 20% desaturate |
| `backdrop` | 0.3 | Heavy dimming, 3 px blur, brightness 0.6 |
| `faded` | 0.4 | Washed-out — 50% desaturate, contrast 0.7 |
| `red-alert` | 1.0 | Brightened with +10° hue rotation — a deliberate shift that warms the SVG palette slightly; combine with rules-based card colour changes for a full alert look |
| `monochrome` | 0.6 | Full greyscale, contrast 0.8 |
| `none` | — | Remove all filters |

```yaml
base_svg:
  source: builtin:ncc-1701-a-blue
  filter_preset: dimmed
```

Rules can change `filter_preset` dynamically — see the rules example below.

---

## `anchors` Object

Named points used for overlay placement and line routing. Values are `[x, y]` in SVG user units (matching the SVG `viewBox`). Percentages are also accepted.

```yaml
anchors:
  bridge: [520, 380]
  engineering: [620, 520]
  sickbay: ["40%", "55%"]   # Percentage of viewBox dimensions
```

---

## Overlay Types

### Control Overlay

Embeds any HA card at a position on the canvas.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Overlay ID — required; used for rule targeting |
| `type` | string | `control` |
| `anchor` | string | Anchor name to centre on |
| `position` | array | Explicit `[x, y]` position (overrides `anchor`) |
| `size` | array | `[width, height]` in px |
| `card` | object | Any HA card config |
| `visible` | boolean | Show/hide overlay (`true` by default) |
| `z_index` | number | Stacking order (higher = in front) |
| `tags` | list | Tags for rule targeting |

```yaml
- id: engine-status
  type: control
  anchor: engineering
  size: [200, 90]
  z_index: 10
  card:
    type: custom:lcards-button
    entity: sensor.warp_core_status
    preset: lozenge
```

### Line Overlay

Routes a line between two anchors on the canvas.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Line ID (required) |
| `type` | string | `line` |
| `from` | string | Source anchor name |
| `to` | string | Target anchor name |
| `route` | string | Routing algorithm — see table below |
| `waypoints` | list | Intermediate `[x, y]` points or anchor names |
| `route_hint` | string | Initial segment direction: `xy` (horizontal first) or `yx` |
| `corner_style` | string | `miter`, `round`, or `bevel` |
| `corner_radius` | number | Radius for `round` corners in px |
| `route_channels` | list | Channel IDs this line routes through |
| `clearance` | number | Min clearance around obstacles in px |

#### Routing Algorithms

| `route` value | Description |
|--------------|-------------|
| `auto` | System decides (recommended) |
| `direct` | Straight line |
| `manhattan` | L-shaped (single bend) |
| `smart` | Intelligent multi-bend pathfinding |
| `grid` | A* on pixel grid |
| `manual` | Explicit `waypoints` list |

```yaml
- id: power-line
  type: line
  from: engineering
  to: bridge
  route: manhattan
  route_hint: yx
  corner_style: round
  corner_radius: 6
```

---

## `routing` Object

Global defaults that apply to all lines unless overridden per-line:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `default_mode` | string | `manhattan` | Default routing mode |
| `clearance` | number | `0` | Global obstacle clearance in px |
| `auto_upgrade_simple_lines` | boolean | `true` | Auto-upgrade to smart routing when needed |

---

## `debug` Object

Visualisation aids — useful while building your layout:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable debug overlays |
| `show_anchors` | boolean | `false` | Show anchor points as circles |
| `show_grid` | boolean | `false` | Show routing grid |
| `show_routing` | boolean | `false` | Show line routing paths |

```yaml
debug:
  enabled: true
  show_anchors: true
```

---

## Rules Engine Integration

The MSD card integrates with the global Rules Engine to dynamically restyle overlays and change the base SVG filter:

```yaml
rules:
  - id: warp-alert
    when:
      entity: sensor.warp_core_temp
      above: 95
    apply:
      base_svg:
        filter_preset: red-alert
        transition: 500          # Crossfade in ms
      overlays:
        engine-status:
          style:
            color: "var(--lcards-alert-red)"
      animations:
        - overlay: engine-status
          preset: pulse
          loop: true
```

See [Rules Engine](../../core/rules/README.md) for the full condition and apply reference.

---

## Annotated Example

An MSD card with three anchors, a control overlay, a line, and a rule that changes the base SVG filter on alert:

```yaml
type: custom:lcards-msd
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    filter_preset: dimmed

  view_box: auto

  anchors:
    bridge: [520, 380]
    engineering: [620, 520]
    sickbay: [410, 460]

  overlays:
    - id: bridge-card
      type: control
      anchor: bridge
      size: [180, 80]
      tags: [status-displays]
      card:
        type: custom:lcards-button
        entity: sensor.bridge_status
        preset: lozenge
        text:
          name:
            content: Bridge
        tap_action:
          action: more-info

    - id: power-line
      type: line
      from: engineering
      to: bridge
      route: manhattan
      route_hint: yx
      corner_style: round
      corner_radius: 6

  routing:
    default_mode: manhattan
    clearance: 10

  debug:
    enabled: false
    show_anchors: false

rules:
  - id: reactor-alert
    when:
      entity: sensor.reactor_temp
      above: 90
    apply:
      base_svg:
        filter_preset: red-alert
        transition: 500
      overlays:
        bridge-card:
          style:
            color: "var(--lcards-alert-red)"
      animations:
        - tag: status-displays
          preset: pulse
          loop: true
```

---

## Related

- [Rules Engine](../../core/rules/README.md)
- [DataSources](../../core/datasources/README.md)
- [Colours](../../core/colours.md)
- [Templates](../../core/templates/README.md)
- [Button card](../button/README.md)
