# MSD Card

`custom:lcards-msd-card`

Master Systems Display — a zoomable SVG canvas on which you position any Home Assistant card as an overlay. Lines (routes) connect anchors across the canvas, and shapes (polylines, rectangles, circles) add freeform decorative or structural geometry — rooms, zones, conduits. Supports rules-based automation of overlay styles and base SVG filters.

---

## Quick Start

```yaml
type: custom:lcards-msd-card
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
      anchor: bridge
      attach_to: engineering
```

---

## Top-Level Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-msd-card` (required) |
| `msd` | object | Full MSD configuration (required) |
| `id` | string | Card ID for rule targeting |
| `tags` | list | Tags for rule targeting |
| `rules` | list | Rules for dynamic overlay styling — see [Rules Engine](../../core/rules/) |
| `data_sources` | object | data source definitions — see [Data Sources](../../core/datasources/) |

---

## `msd` Object

| Option | Type | Description |
|--------|------|-------------|
| `base_svg` | object | SVG source and filters (required) |
| `view_box` | string / array | `"auto"` or `[minX, minY, width, height]` |
| `anchors` | object | Named `[x, y]` anchor points for overlay placement |
| `overlays` | list | Control, line, and shape overlays — see below |
| `routing` | object | Global line routing settings |

---

## `base_svg` Object

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | SVG source — `builtin:<name>`, `/local/path.svg`, a `media-source://…` content ID picked via the HA media library, or `none` |
| `filters` | list | CSS/SVG filters (opacity, blur, brightness, tint, etc.) — see [Base SVG Filters](./base-svg-filters.md) |

In MSD Studio's Base SVG tab, the "Browse HA Media" source mode lets you pick an SVG uploaded to Home Assistant's media library, filtered to SVG's actual MIME type (`image/svg+xml`) so only SVG files show up — alongside the existing Asset Library (built-in ships) and Custom Path (typed `/local/…` or URL) modes.

### Filters

Filters shift the visual weight of the base SVG so overlays stand out, or
apply a color tint. See [Base SVG Filters](./base-svg-filters.md) for the
full type reference and a set of copy-paste recipes (dimmed, subtle,
backdrop, faded, red wash, monochrome).

```yaml
base_svg:
  source: builtin:ncc-1701-a-blue
  filters:
    opacity: 0.5
    brightness: 0.8
```

Rules can change `filters` dynamically — see the rules example below.

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

Full reference: [Control Overlay](./control-overlay.md) — attachment points, `card:` examples, rules integration.

### Line Overlay

Routes a line between two anchors on the canvas.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Line ID (required) |
| `type` | string | `line` |
| `anchor` | string | Source anchor name |
| `attach_to` | string | Target anchor name |
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
  anchor: engineering
  attach_to: bridge
  route: manhattan
  route_hint: yx
  corner_style: round
  corner_radius: 6
```

Full reference: [Line Overlay](./line-overlay.md) — attachment sides, gaps, dynamic/state-based color, gradients, patterns, markers, animations.

### Shape Overlay

Freeform geometry — polylines, rectangles, circles — for rooms, zones, conduits, and other decorative or structural shapes. Shares its complete styling system with the line overlay (dashed strokes, state-based color/fill, animations), and lines can attach to a shape's corners or vertices the same way they attach to controls.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Shape ID (required) |
| `type` | string | `shape` |
| `kind` | string | `polyline`, `rect`, or `circle` |
| `points` | list | `polyline` only: ordered `[x, y]`/anchor-name vertices |
| `position` / `size` | array | `rect`/`circle` only: same convention as control overlays |

```yaml
- id: engineering-bay
  type: shape
  kind: rect
  position: [560, 460]
  size: [200, 140]
  corner_style: round
  corner_radius: 12
  style:
    color: var(--lcars-orange)
    width: 2
    fill: alpha(var(--lcars-orange), 0.12)
```

Full reference: [Shape Overlay](./shape-overlay.md) — all three kinds, attachment points, drawing/editing in MSD Studio.

---

## `routing` Object

Global defaults that apply to all lines unless overridden per-line:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `default_mode` | string | `manhattan` | Default routing mode |
| `clearance` | number | `0` | Global obstacle clearance in px |
| `auto_upgrade_simple_lines` | boolean | `true` | Auto-upgrade to smart routing when needed |

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
        filters:
          - { mode: svg, type: tint, value: { color: 'rgba(180,0,0,0.35)' } }
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

See [Rules Engine](../../core/rules/) for the full condition and apply reference.

---

## Annotated Example

An MSD card with three anchors, a control overlay, a line, and a rule that changes the base SVG filter on alert:

```yaml
type: custom:lcards-msd-card
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    filters:
      opacity: 0.5
      brightness: 0.8

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
      anchor: engineering
      attach_to: bridge
      route: manhattan
      route_hint: yx
      corner_style: round
      corner_radius: 6

  routing:
    default_mode: manhattan
    clearance: 10

rules:
  - id: reactor-alert
    when:
      entity: sensor.reactor_temp
      above: 90
    apply:
      base_svg:
        filters:
          - { mode: svg, type: tint, value: { color: 'rgba(180,0,0,0.35)' } }
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
