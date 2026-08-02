# Shape Overlay

`type: shape`

Freeform geometry on the MSD canvas — polylines (walls, connectors, custom paths), rectangles and circles (rooms, zones, highlights). Shares its full styling system with the [Line Overlay](./line-overlay.md): dashed strokes, state-based color and fill, markers, and animations.

---

## Quick Start

```yaml
overlays:
  - id: reactor_room
    type: shape
    kind: rect
    position: [200, 150]
    size: [180, 120]
    corner_style: round
    corner_radius: 12
    style:
      color: var(--lcars-orange)
      width: 2
      fill: var(--lcars-orange)
      fill_opacity: 0.15

  - id: power_conduit
    type: shape
    kind: polyline
    points:
      - [100, 100]
      - [300, 100]
      - [300, 300]
    style:
      color: var(--lcars-blue)
      width: 3
      dash_array: "5,5"
```

---

## Kinds

| `kind` | Geometry fields | Renders as |
|--------|-----------------|------------|
| `polyline` | `points`, `closed` | `<path>` — open path, or closed with `fill` support when `closed: true` |
| `rect` | `position`, `size` | `<rect>` |
| `circle` | `position`, `size` | `<ellipse>` — `rx = size[0]/2`, `ry = size[1]/2` (use equal width/height for a true circle) |

`rect`/`circle` reuse the exact `position` + `size` convention as [control overlays](./control-overlay.md) — `position` is the top-left corner, in viewBox units.

---

## Properties

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | string | — | Unique identifier (required) |
| `type` | string | — | Must be `shape` |
| `kind` | string | — | `polyline`, `rect`, or `circle` (required) |
| `points` | array | — | `polyline` only: ordered vertex list. Each entry is `[x, y]` or an anchor-name string. Minimum 2 |
| `closed` | boolean | `false` | `polyline` only: close the path back to its first point, enabling `style.fill` |
| `position` | string / array | — | `rect`/`circle`: named anchor or `[x, y]` top-left corner |
| `size` | array | — | `rect`/`circle`: `[width, height]` in viewBox units |
| `corner_style` | string | `round` | `polyline`: `miter`, `round`, or `bevel`. `rect`: only `round` has an effect (sets `rx`/`ry`) — `miter`/`bevel` render as sharp corners. No effect on `circle` |
| `corner_radius` | number | `34` | `polyline`: arc radius (round) or diagonal chamfer size (bevel), in viewBox units. `rect`: sets `rx`/`ry` directly |
| `corner_angle` | number | `45` | `polyline` + `corner_style: bevel` only: diagonal cut angle, 0–90° |
| `smoothing_mode` | string | `none` | `polyline` only: `none` or `chaikin` |
| `smoothing_iterations` | number | `0` | `polyline` only: smoothing pass count (0–5) |
| `entity` | string | — | Entity to bind `style.color` / `style.fill` to (state-color object) |
| `state_attribute` | string | — | Attribute whose value is matched against state-color keys instead of the raw entity state |
| `ranges_attribute` | string | — | Attribute value compared against `above:`/`below:`/`between:` keys |
| `z_index` | number | `50` | Stacking order — default paints below lines (100) and controls (200), above `base_svg` |
| `locked` | boolean | `false` | Editor-only: when true, MSD Studio disables drag/resize/vertex-editing for this overlay |
| `tags` | list | — | Tags for rule targeting |
| `style` | object | — | Full styling — see [Styling](#styling) below |
| `animations` | array | — | anime.js animations — same syntax as line/control overlays |

---

## Attachment Points

Lines can `attach_to` a shape exactly like they attach to a control:

*   **`rect` / `circle`** — the same 9-point bounding-box grid as controls: `top`, `bottom`, `left`, `right`, `center`, `top-left`, `top-right`, `bottom-left`, `bottom-right`.
*   **`polyline`** — one attachment point per vertex, named `vertex0`, `vertex1`, ... in point order (a polyline has no bounding box that makes sense to attach to, so there's no 9-point grid).

```yaml
- id: wall
  type: shape
  kind: polyline
  points: [[100, 100], [300, 100], [300, 300]]

- id: room
  type: shape
  kind: rect
  position: [400, 100]
  size: [150, 100]

- id: connector
  type: line
  anchor: wall
  anchor_side: vertex1        # the middle point of the wall polyline
  attach_to: room
  attach_side: top-left
```

In the MSD Studio editor, enter Connect Mode to see these as clickable dots directly on the canvas (green, distinct from controls' orange and anchors' cyan) — or drag a line endpoint near a shape to have it snap on.

---

## Styling

Shapes share `line`'s complete style system — see [Line Overlay: Styling](./line-overlay.md#styling) for the full reference (stroke color/width/opacity, dash patterns, gradients, patterns, markers). Two differences worth calling out:

*   **`fill`** is meaningful on every shape kind (`rect`, `circle`, and `closed: true` polylines), not just an incidental self-intersection fill. It accepts the same state-color object as `color`, resolved against the shape's own `entity`.
*   **Markers** (`marker_start`/`marker_mid`/`marker_end`) only apply to `polyline` — meaningless for `rect`/`circle`, which have no path direction to attach a marker to.

### State-based fill

```yaml
overlays:
  - id: containment_field
    type: shape
    kind: circle
    position: [300, 300]
    size: [120, 120]
    entity: binary_sensor.containment_breach
    style:
      color: var(--lcars-orange)
      width: 2
      fill:
        active: var(--lcards-alert-red)
        inactive: alpha(var(--lcars-green), 0.2)
```

Both `color` and `fill` update live on entity state change, the same as a line's `style.color`.

---

## Drawing & Editing in MSD Studio

The Shapes tab (and the canvas toolbar) provide three draw tools — Polyline, Rectangle, Circle:

*   **Polyline** — click to place each point; double-click (or toggle the toolbar button off) to finish. Grid-snaps while drawing, with a live preview of the in-progress shape.
*   **Rectangle / Circle** — click-drag from one corner to the opposite corner, with live preview.
*   Select an existing shape to drag its vertices (polyline) or resize handles (rect/circle) directly on the canvas.
*   The Bounding Boxes / Attachment Points toggles (top-right of the Shapes tab action row) show/hide the same overlays available on the Controls tab.

---

## Complete Property Reference

```yaml
overlays:
  - id: string                    # Required: Unique identifier
    type: shape                   # Required: Must be "shape"
    kind: string                  # Required: polyline | rect | circle

    # Polyline geometry
    points:                       # polyline only, minimum 2
      - [x, y]                    # literal coordinate...
      - anchor_name                # ...or a static anchor name
    closed: boolean                # polyline only (default: false)

    # Rect/circle geometry
    position: [x, y]               # or a named anchor string
    size: [width, height]          # circle: rx=width/2, ry=height/2

    # Corner/smoothing
    corner_style: string           # miter | round | bevel (default: round)
    corner_radius: number          # viewBox units (default: 34)
    corner_angle: number           # bevel only, 0-90 (default: 45)
    smoothing_mode: string         # none | chaikin (default: none)
    smoothing_iterations: number   # 0-5 (default: 0)

    # State-color binding
    entity: string                 # entity for style.color / style.fill state keys
    state_attribute: string        # match an attribute instead of raw state
    ranges_attribute: string       # attribute for above:/below:/between: keys

    # Visibility & targeting
    z_index: number                # default: 50
    locked: boolean                # default: false, editor-only
    tags: [string]

    # Styling — identical field set to line overlays
    style:
      color: string | object       # stroke color, literal or state-color object
      width: number                 # stroke width (default: 2)
      opacity: number                # stroke opacity 0-1 (default: 1)
      line_cap: string               # butt | round | square (default: butt)
      line_join: string              # miter | round | bevel
      miter_limit: number            # default: 4
      dash_array: string | array     # e.g. "5,5" or [5, 5]
      dash_offset: number            # default: 0
      fill: string | object          # fill color, literal or state-color object
      fill_opacity: number           # default: 1
      gradient: object                # see Line Overlay
      pattern: object                 # see Line Overlay
      marker_start: object            # polyline only
      marker_mid: object              # polyline only
      marker_end: object              # polyline only
      animatable: boolean             # default: true

    # Animations
    animations:
      - trigger: string             # on_load | on_tap | on_hold | on_hover | on_leave | on_entity_change
        preset: string
        # ...see the Animation Preset Reference
```

---

## See Also

- [Line Overlay](./line-overlay.md) — shares the same styling system
- [Control Overlay](./control-overlay.md) — same `position`/`size` convention for `rect`/`circle`
- [MSD Rendering Pipeline](../../architecture/msd/index.md) — `ShapeOverlay` internals
