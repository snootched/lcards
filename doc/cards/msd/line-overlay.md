# Line Overlay

`type: line`

Connects two overlays (controls, other lines' anchors, or [shapes](./shape-overlay.md)) with a routed SVG line. Supports automatic or manual routing, attachment side control, gap offsets, state-based color, and rich SVG styling including gradients, patterns, arrows, and dash patterns.

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
      color: var(--lcars-orange)
      width: 2
```

---

## Properties

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | — | Unique identifier (required) |
| `type` | string | — | Must be `line` |
| `anchor` | string | — | Source overlay ID, anchor name, or `[x, y]` (required) |
| `attach_to` | string | — | Destination overlay ID, anchor name, or `[x, y]` (required) |
| `anchor_side` | string | auto | Attachment side on source — see [Attachment Points](#attachment-points) |
| `attach_side` | string | auto | Attachment side on destination |
| `anchor_gap` | number | `0` | Offset in px from source edge |
| `attach_gap` | number | `0` | Offset in px from destination edge |
| `anchor_gap_x` | number | — | Horizontal-only offset from source (overrides `anchor_gap` on X) |
| `anchor_gap_y` | number | — | Vertical-only offset from source (overrides `anchor_gap` on Y) |
| `attach_gap_x` | number | — | Horizontal-only offset from destination |
| `attach_gap_y` | number | — | Vertical-only offset from destination |
| `route` | string | `auto` | Routing mode — see [Routing Modes](#routing-modes) |
| `waypoints` | array | — | Explicit coordinate/anchor-name list for `manual` routing |
| `route_hint` | string | auto | Initial segment direction: `xy` (horizontal first) or `yx` |
| `route_hint_last` | string | auto | Final segment direction (same values as `route_hint`) |
| `route_channels` | list | — | Channel IDs this line routes through |
| `clearance` | number | — | Min clearance around obstacles in px (overrides global default) |
| `corner_style` | string | `round` | `miter`, `round`, or `bevel` — for routed corners |
| `corner_radius` | number | `34` | Arc radius (round) or chamfer size (bevel), in px |
| `corner_angle` | number | `45` | `bevel` only: diagonal cut angle, 0–90° |
| `smoothing_mode` | string | `none` | `none` or `chaikin` |
| `smoothing_iterations` | number | `0` | Smoothing pass count (0–5) |
| `entity` | string | — | Entity to bind `style.color` / `style.fill` to (state-color object) — independent of any control's own entity |
| `state_attribute` | string | — | Attribute whose value is matched against state-color keys instead of the raw entity state (mirrors the button card's `state_attribute`) |
| `ranges_attribute` | string | — | Attribute value compared against `above:`/`below:`/`between:` keys (mirrors the button card's `ranges_attribute`) |
| `z_index` | number | `100` | Stacking order — default paints below controls (200), above `base_svg` |
| `tags` | list | — | Tags for rule targeting |
| `style` | object | — | SVG style — see [Styling](#styling) |
| `animations` | array | — | anime.js animations — see [Animations in MSD](../../architecture/msd/index.md) |

---

## Attachment Points

Lines connect to any of 9 named sides on an overlay (control, or [shape](./shape-overlay.md) of kind `rect`/`circle`) — or to a specific vertex (`vertex0`, `vertex1`, ...) of a `polyline` shape. Omit the side fields and the system picks the closest pair automatically.

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

In the MSD Studio editor, entering Connect Mode shows these as clickable dots on every control/shape/anchor — click a source point then a target point to create a line prefilled with the correct `anchor`/`attach_to`/`*_side`. Dragging an existing line's endpoint near a valid point snaps onto it the same way.

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

`route_hint`/`route_hint_last` steer the first/last segment direction for every pathfinding mode (`manhattan`, `smart`, `grid`, and `auto` once it upgrades to one of those) — not just `manhattan`. If you don't set them explicitly, `anchor_side`/`attach_side` set to `left`/`right`/`top`/`bottom` auto-derive the equivalent hint (`left`/`right` → horizontal, `top`/`bottom` → vertical), even when `anchor`/`attach_to` is a plain coordinate or named point anchor with no attachment-point geometry of its own — the side still expresses "leave/arrive from this direction." Corner sides (`top-left`, etc.) and `center` are ambiguous for a single axis and fall back to an automatic direction based on which axis has the larger distance between the two endpoints.

```yaml
# Straight line
- id: direct_line
  type: line
  anchor: card_a
  attach_to: card_b
  route: direct
  style:
    color: var(--lcars-blue)
    width: 2

# L-shaped (good for flowchart-style diagrams)
- id: manhattan_line
  type: line
  anchor: card_a
  anchor_side: bottom
  attach_to: card_b
  attach_side: top
  route: manhattan
  style:
    color: var(--lcars-orange)
    width: 2

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
    color: var(--lcars-green)
    width: 2
```

See [Manual Routing](./manual-routing.md) for the full waypoints syntax.

---

## Styling

### Stroke

```yaml
style:
  color: var(--lcars-orange)    # Color — CSS variable, hex, rgb/rgba, theme: token, or a state-color object (see Dynamic Styling)
  width: 2                      # Thickness in viewBox units
  opacity: 0.8                  # 0–1
```

`stroke` / `stroke_width` (underscore) are accepted as legacy aliases for `color` / `width` — new configs should use `color`/`width`.

### Dash patterns

```yaml
style:
  dash_array: "5,5"       # 5px dash, 5px gap — string "5,5" or array [5, 5]
  dash_offset: 0           # Starting offset
  line_cap: round           # round | square | butt — no effect on closed shapes
  line_join: miter          # miter | round | bevel — at path corners
  miter_limit: 4             # Used when line_join: miter
```

### Fill (self-intersecting/closed paths)

```yaml
style:
  fill: var(--lcars-blue)     # literal/token/CSS value, or a state-color object (see Dynamic Styling)
  fill_opacity: 0.3           # 0–1
```

`fill` defaults to `none`. It matters most on [shape overlays](./shape-overlay.md) (`rect`/`circle`/closed `polyline`), where it's the primary way to shade a room/zone — but it applies to any line style resolution the same way.

### Gradients

```yaml
style:
  gradient:
    stops:
      - { offset: '0%', color: var(--lcars-blue) }
      - { offset: '100%', color: var(--lcars-orange) }
```

Renders as a standard left-to-right SVG `linearGradient` built from `stops`. A shorthand string form is also accepted: `gradient: "var(--lcars-blue)-to-var(--lcars-orange)"`. `type`/`direction` fields are accepted in config but not yet applied to the render (always a horizontal linear gradient regardless of value) — don't rely on `type: radial` or a non-horizontal `direction` doing anything yet.

### Patterns

```yaml
style:
  pattern:
    color: var(--lcars-orange)
    size: 8
    opacity: 0.5
```

Currently always renders as a repeating dot pattern (a 1px-radius circle tiled at `size` spacing) regardless of `pattern.type` — `type: lines`/`diagonal`/`grid`/custom SVG are accepted in config but not yet implemented differently from `dots`.

### Markers (arrows)

```yaml
style:
  marker_end:
    type: arrow            # arrow (alias: triangle) | dot | diamond | line | rect (alias: square)
    size: 10                # px — a plain pixel size, default 10 (not a small/medium/large preset)
    fill: var(--lcars-orange)   # defaults to line color
    stroke: none                # optional outline
    stroke_width: 0
    align: center                # center (default) | edge — 'edge' pins the shape's back edge (not tip) to the endpoint, so a thick line's cap never pokes past a pointed marker

  marker_start:
    type: dot
    size: 6
```

Both `fill` and `stroke` accept the literal string `"match_line"` to inherit the line's own resolved color, staying in sync as it changes live (entity-bound or templated). Markers always inherit the line's opacity (not opt-in). `marker_mid` places the same shape at every interior waypoint/corner.

---

## Dynamic Styling

### State-based color and fill

`style.color` and `style.fill` accept a state-color object, resolved against the line's own `entity` — the same pipeline used by buttons and sliders:

```yaml
overlays:
  - id: status_line
    type: line
    anchor: card_a
    attach_to: card_b
    entity: binary_sensor.link_active
    style:
      color:
        active: var(--lcars-green)
        inactive: var(--lcars-red)
      width: 2
      marker_end:
        type: arrow
        size: 10
```

`state_attribute` matches an attribute's value against the state-color keys instead of the raw entity state; `ranges_attribute` compares an attribute against `above:`/`below:`/`between:` keys — both scoped per-line, independent of any control's own entity.

### Templated values

Style fields also accept Jinja2/JS template expressions, evaluated against data sources:

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
      color: >
        {link_status == 'on' ? 'var(--lcars-green)' : 'var(--lcars-red)'}
      dash_array: >
        {link_status == 'on' ? 'none' : '5,5'}
      width: 2
```

---

## Animations

Lines accept an `animations:` array — anime.js triggers/presets, same syntax as control overlays and `base_svg.animations`:

```yaml
- id: power_line
  type: line
  anchor: reactor
  attach_to: bridge
  style:
    color: var(--lcars-blue)
  animations:
    - trigger: on_load
      preset: march
      duration: 1500
      loop: true
```

See the Animation Preset Reference (docs site → Core → Animations) for the full list of presets and parameters.

---

## Complete Property Reference

```yaml
overlays:
  - id: string                    # Required: Unique identifier
    type: line                    # Required: Must be "line"
    anchor: string                # Required: Source overlay ID, anchor name, or [x, y]
    attach_to: string             # Required: Destination overlay ID, anchor name, or [x, y]

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
    route_hint: string            # Optional: xy | yx (default: auto)
    route_hint_last: string       # Optional: xy | yx (default: auto)
    route_channels: [string]      # Optional: channel IDs to route through
    clearance: number             # Optional: obstacle clearance in px

    # Corner rendering / smoothing (routed corners, and manual waypoint paths)
    corner_style: string          # miter | round | bevel (default: round)
    corner_radius: number         # px (default: 34)
    corner_angle: number          # bevel only, 0-90 (default: 45)
    smoothing_mode: string        # none | chaikin (default: none)
    smoothing_iterations: number  # 0-5 (default: 0)

    # State-color binding
    entity: string                 # entity for style.color / style.fill state keys
    state_attribute: string        # match an attribute instead of raw state
    ranges_attribute: string       # attribute for above:/below:/between: keys

    # Visibility & targeting
    z_index: number               # Optional: Stacking order (default: 100)
    tags: [string]                # Optional: Rule targeting tags

    # Styling
    style:                        # Optional styling
      color: string | object      # Line color — literal/token, or state-color object (default: var(--lcars-white))
      width: number                # Line thickness (default: 2)
      opacity: number               # Transparency 0-1 (default: 1.0)
      line_cap: string               # round | square | butt (default: butt)
      line_join: string              # round | miter | bevel (default: miter)
      miter_limit: number            # Miter limit (default: 4)
      dash_array: string | array     # Dash pattern (e.g. "5,5" or [5, 5])
      dash_offset: number            # Dash offset (default: 0)
      fill: string | object          # Fill color — literal/token, or state-color object (default: none)
      fill_opacity: number           # Fill opacity 0-1 (default: 1)
      gradient: object                # { stops: [{offset, color}, ...] } — always linear
      pattern: object                 # { color, size, opacity } — always dots
      animatable: boolean             # Eligible as an animation target (default: true)

      # Markers
      marker_start:               # Start marker
        type: string              # arrow | dot | diamond | line | rect (aliases: triangle, square)
        size: number               # px (default: 10)
        fill: string               # Marker fill color, or "match_line"
        stroke: string              # Marker outline color, or "match_line"
        stroke_width: number         # Outline thickness
        align: string                 # center (default) | edge
      marker_mid:                 # Mid-point markers (same shape/fields)
      marker_end:                 # End marker (same shape/fields)

    # Animations
    animations:
      - trigger: string             # on_load | on_tap | on_hold | on_hover | on_leave | on_entity_change
        preset: string
```

---

## See Also

- [Shape Overlay](./shape-overlay.md) — polylines/rects/circles sharing this exact style system
- [Control Overlay](./control-overlay.md)
- [Manual Routing](./manual-routing.md)
