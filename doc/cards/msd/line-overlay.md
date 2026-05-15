# Line Overlay

`type: line`

Connects two overlays with a routed SVG line. Supports automatic or manual routing, attachment side control, gap offsets, and rich SVG styling including arrows and dash patterns.

---

## Quick Start

```yaml
overlays:
  - id: control1
    type: control
    position: [100, 100]
    size: [120, 40]
    card:
      type: custom:lcards-button
      entity: light.living_room

  - id: control2
    type: control
    position: [300, 200]
    size: [120, 40]
    card:
      type: custom:lcards-button
      entity: light.kitchen

  - id: line1
    type: line
    anchor: control1
    attach_to: control2
    style:
      stroke: var(--lcars-orange)
      stroke-width: 2
```

---

## Properties

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | — | Unique identifier (required) |
| `type` | string | — | Must be `line` |
| `anchor` | string | — | Source overlay ID (required) |
| `attach_to` | string | — | Destination overlay ID (required) |
| `anchor_side` | string | auto | Attachment side on source — see [Attachment Points](#attachment-points) |
| `attach_side` | string | auto | Attachment side on destination |
| `anchor_gap` | number | `0` | Offset in px from source edge |
| `attach_gap` | number | `0` | Offset in px from destination edge |
| `anchor_gap_x` | number | — | Horizontal-only offset from source (overrides `anchor_gap` on X) |
| `anchor_gap_y` | number | — | Vertical-only offset from source (overrides `anchor_gap` on Y) |
| `attach_gap_x` | number | — | Horizontal-only offset from destination |
| `attach_gap_y` | number | — | Vertical-only offset from destination |
| `route` | string | `auto` | Routing mode — see [Routing Modes](#routing-modes) |
| `waypoints` | array | — | Explicit coordinate list for `manual` routing |
| `visible` | boolean | `true` | Show or hide the line |
| `z_index` | number | — | Stacking order |
| `tags` | list | — | Tags for rule targeting |
| `style` | object | — | SVG style — see [Styling](#styling) |

---

## Attachment Points

Lines connect to any of 9 named sides on an overlay. Omit the side fields and the system picks the closest pair automatically.

| Side | Description |
|------|-------------|
| `top` | Top edge centre |
| `bottom` | Bottom edge centre |
| `left` | Left edge centre |
| `right` | Right edge centre |
| `center` | Exact centre |
| `top-left` | Top-left corner |
| `top-right` | Top-right corner |
| `bottom-left` | Bottom-left corner |
| `bottom-right` | Bottom-right corner |

### With specific sides

```yaml
- id: h_connection
  type: line
  anchor: card_a
  anchor_side: right
  attach_to: card_b
  attach_side: left
```

---

## Gap System

Gaps offset the line endpoint away from the overlay edge.

| Side | Gap direction |
|------|---------------|
| `left` | Leftward (−X) |
| `right` | Rightward (+X) |
| `top` | Upward (−Y) |
| `bottom` | Downward (+Y) |
| corners | Diagonally outward |

```yaml
- id: gap_line
  type: line
  anchor: card_a
  anchor_side: right
  anchor_gap: 20          # 20px out from right edge of card_a
  attach_to: card_b
  attach_side: left
  attach_gap: 20          # 20px out from left edge of card_b
```

For independent axis control use `anchor_gap_x` / `anchor_gap_y` (overrides `anchor_gap` on that axis).

---

## Routing Modes

| Mode | Description |
|------|-------------|
| `auto` | Smart pathfinding with obstacle avoidance (default) |
| `direct` | Straight line between endpoints |
| `manhattan` | L-shaped single bend |
| `smart` | Multi-bend pathfinding |
| `grid` | Grid-constrained routing |
| `manual` | Explicit `waypoints` list |

```yaml
# Straight line
- id: direct_line
  type: line
  anchor: card_a
  attach_to: card_b
  route: direct
  style:
    stroke: var(--lcars-blue)
    stroke-width: 2

# L-shaped (good for flowchart-style diagrams)
- id: manhattan_line
  type: line
  anchor: card_a
  anchor_side: bottom
  attach_to: card_b
  attach_side: top
  route: manhattan
  style:
    stroke: var(--lcars-orange)
    stroke-width: 2

# Manual with waypoints
- id: manual_line
  type: line
  anchor: card_a
  attach_to: card_b
  route: manual
  waypoints:
    - [200, 100]
    - [200, 300]
  style:
    stroke: var(--lcars-green)
    stroke-width: 2
```

See [Manual Routing](./manual-routing.md) for the full waypoints syntax.

---

## Styling

### Stroke

```yaml
style:
  stroke: var(--lcars-orange)   # Color — CSS variable, hex, rgb, or rgba
  stroke-width: 2               # Thickness in px
  opacity: 0.8                  # 0–1
```

### Dash patterns

```yaml
style:
  stroke-dasharray: "5,5"       # 5px dash, 5px gap
  stroke-dashoffset: 0          # Starting offset
  stroke-linecap: round         # round | square | butt
```

### Markers (arrows)

```yaml
style:
  marker_end:
    type: arrow           # arrow | dot | diamond | square | triangle | line | rect
    size: medium          # small | medium | large | custom
    fill: var(--lcars-orange)   # defaults to line color
    stroke: none                # optional outline
    stroke_width: 0

  marker_start:
    type: dot
    size: small
```

**Size presets:** `small` = 4px, `medium` = 6px (default), `large` = 10px. Use `size: custom` with `custom_size: <px>` for exact control.

---

## Dynamic Styling

Line style properties support token expressions, allowing color and pattern to change based on entity state:

```yaml
data_sources:
  link_status:
    type: entity
    entity: binary_sensor.link_active

overlays:
  - id: status_line
    type: line
    anchor: card_a
    attach_to: card_b
    style:
      stroke: >
        {link_status == 'on' ? 'var(--lcars-green)' : 'var(--lcars-red)'}
      stroke-dasharray: >
        {link_status == 'on' ? 'none' : '5,5'}
      stroke-width: 2
      marker_end:
        type: arrow
        size: medium
```

---

## Complete Property Reference

```yaml
overlays:
  - id: string                    # Required: Unique identifier
    type: line                    # Required: Must be "line"
    anchor: string                # Required: Source overlay ID
    attach_to: string             # Required: Destination overlay ID

    # Attachment Configuration
    anchor_side: string           # Optional: Source side (default: auto)
    attach_side: string           # Optional: Destination side (default: auto)

    # Gap System
    anchor_gap: number            # Optional: Source offset in pixels (default: 0)
    attach_gap: number            # Optional: Destination offset in pixels (default: 0)
    anchor_gap_x: number          # Optional: Source horizontal offset
    anchor_gap_y: number          # Optional: Source vertical offset
    attach_gap_x: number          # Optional: Destination horizontal offset
    attach_gap_y: number          # Optional: Destination vertical offset

    # Routing
    route: string                 # Optional: Routing mode (default: "auto")
                                  # Options: auto, direct, manhattan, smart, grid, manual
    waypoints:                    # For route: manual
      - [x, y]

    # Visibility
    visible: boolean              # Optional: Show/hide (default: true)
    z_index: number               # Optional: Stacking order
    tags: [string]                # Optional: Rule targeting tags

    # Styling
    style:                        # Optional styling
      stroke: string              # Line color (default: var(--lcars-white))
      stroke-width: number        # Line thickness (default: 2)
      opacity: number             # Transparency 0-1 (default: 1.0)
      stroke-dasharray: string    # Dash pattern (e.g. "5,5")
      stroke-dashoffset: number   # Dash offset (default: 0)
      stroke-linecap: string      # round | square | butt (default: butt)
      stroke-linejoin: string     # round | miter | bevel (default: miter)
      stroke-miterlimit: number   # Miter limit (default: 4)
      filter: string              # SVG filter: url(#id)

      # Markers
      marker_start:               # Start marker
        type: string              # arrow | dot | diamond | square | triangle | line | rect
        size: string              # small | medium | large | custom
        custom_size: number       # px (when size: custom)
        fill: string              # Marker fill color
        stroke: string            # Marker outline color
        stroke_width: number      # Outline thickness
      marker_mid:                 # Mid-point markers (same shape)
        type: string
        size: string
      marker_end:                 # End marker (same shape)
        type: string
        size: string
```
