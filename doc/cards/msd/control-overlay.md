# Control Overlay

`type: control`

Embeds any Home Assistant card — built-in or custom — at a fixed position on the MSD canvas. Supports all 9 attachment points for line connections.

---

## Quick Start

```yaml
type: custom:lcards-msd-card
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
  anchors:
    bridge: [520, 380]
  overlays:
    - id: bridge_status
      type: control
      anchor: bridge
      size: [200, 90]
      card:
        type: custom:lcards-button
        entity: light.bridge
        preset: lozenge
```

---

## Properties

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | — | Unique identifier — required; used for line connections and rule targeting |
| `type` | string | — | Must be `control` |
| `card` | object | — | Any HA card config (required) |
| `anchor` | string | — | Named anchor to centre the overlay on |
| `position` | array | — | Explicit `[x, y]` coordinates — overrides `anchor` |
| `size` | array | — | `[width, height]` in viewBox units |
| `visible` | boolean | `true` | Show or hide the overlay |
| `z_index` | number | — | Stacking order (higher = in front) |
| `tags` | list | — | Tags for rule targeting |

Either `anchor` or `position` must be provided.

---

## Attachment Points

Lines connect to any of 9 named points on a control overlay's bounding box:

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

Omit `anchor_side` / `attach_side` on the connecting line and the system picks the closest sides automatically.

---

## Examples

### Built-in HA card

```yaml
- id: climate_control
  type: control
  anchor: sickbay
  size: [220, 130]
  card:
    type: thermostat
    entity: climate.sickbay
```

### LCARdS card with action

```yaml
- id: warp_control
  type: control
  anchor: engineering
  size: [200, 90]
  tags: [engineering]
  card:
    type: custom:lcards-button
    entity: switch.warp_drive
    preset: lozenge
    text:
      label:
        content: "WARP DRIVE"
    tap_action:
      action: toggle
```

### Custom card

```yaml
- id: temp_graph
  type: control
  anchor: bridge
  size: [340, 180]
  card:
    type: custom:mini-graph-card
    entities:
      - sensor.bridge_temperature
    hours_to_show: 6
    line_width: 2
```

### Entity list

```yaml
- id: systems_panel
  type: control
  position: [100, 400]
  size: [300, 200]
  card:
    type: entities
    title: System Status
    entities:
      - sensor.warp_speed
      - sensor.shield_strength
      - sensor.hull_integrity
```

### Connecting two controls with a line

```yaml
overlays:
  - id: sensor_card
    type: control
    anchor: bridge
    size: [180, 80]
    card:
      type: sensor
      entity: sensor.warp_speed

  - id: graph_card
    type: control
    anchor: engineering
    size: [300, 150]
    card:
      type: custom:mini-graph-card
      entities: [sensor.warp_speed]
      hours_to_show: 6

  - id: link
    type: line
    anchor: sensor_card
    anchor_side: bottom
    attach_to: graph_card
    attach_side: top
```

---

## Rules Engine Integration

Control overlays integrate with the rules engine via `id` and `tags`. Reference them in `rules` to change style dynamically:

```yaml
type: custom:lcards-msd-card
msd:
  overlays:
    - id: warp_core
      type: control
      anchor: engineering
      size: [200, 90]
      tags: [critical, engineering]
      card:
        type: custom:lcards-button
        entity: sensor.warp_core_temp
        preset: lozenge

rules:
  - id: warp-overheat
    when:
      entity: sensor.warp_core_temp
      above: 90
    apply:
      overlays:
        warp_core:
          style:
            color: "var(--lcards-alert-red)"
```

See [Rules Engine](../../core/rules/) for targeting multiple overlays at once with `tag:`, `type:`, `pattern:`, and `all:` selectors.
