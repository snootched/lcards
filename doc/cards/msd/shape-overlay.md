---
description: "MSD shape overlay: rectangles, circles and polylines for rooms, zones, walls and conduits, with fills and colours that follow entities and points lines can attach to."
moved_anchors:
  quick-start: /cards/msd/shape-overlay#kinds
  properties: /cards/msd/shape-overlay#kinds
  state-based-fill: /cards/msd/shape-overlay#dynamic-styling
  complete-property-reference: /cards/msd/shape-overlay#kinds
  see-also: /cards/msd/shape-overlay#kinds
---

# Shape Overlay

`type: shape`

**Shapes draw your own geometry on the MSD canvas: a room, a zone round a system, a wall, a conduit.** They use the same style keys as [lines](./line-overlay#styling) (dashes, markers, colours that follow an entity) and add a fill.

- Lines can attach to a shape's corners and points, the same way they attach to a control.
- Shapes are drawn under lines and controls (`z_index` `50`), over the background.

## Kinds

**`kind` picks the shape: `rect` for a box, `circle` for a round or oval area, `polyline` for a path through points.**

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 240]
  overlays:
    # a room
    - id: reactor_room
      type: shape
      kind: rect
      position: [40, 40]
      size: [180, 120]
      corner_style: round
      corner_radius: 12
      style:
        color: var(--lcars-orange)
        width: 3
        fill: var(--lcars-orange)
        fill_opacity: 0.15
    # a field
    - id: containment_field
      type: shape
      kind: circle
      position: [260, 50]
      size: [140, 140]
      style:
        color: var(--lcars-blue)
        width: 3
    # a conduit
    - id: power_conduit
      type: shape
      kind: polyline
      points:
        - [440, 40]
        - [560, 40]
        - [560, 200]
      style:
        color: var(--lcars-yellow)
        width: 4
        dash_array: "12,6"
```

| `kind` | Placed with | Drawn as |
|---|---|---|
| `rect` | `position`, `size` | A rectangle |
| `circle` | `position`, `size` | An ellipse inside the box: equal width and height give a circle |
| `polyline` | `points`, `closed` | A path through the points, open or closed |

| Key | Type | Default | Description |
|---|---|---|---|
| `id` | string | required | Unique id, for lines, rules and the Studio |
| `type` | string | required | `shape` |
| `kind` | string | required | `rect`, `circle` or `polyline` |
| `tags` | list | - | Tags for rules: the selector `tag:<name>` matches every overlay with that tag |
| `z_index` | number | `50` | Stacking order among overlays; higher is in front. Lines default to `100`, controls to `200` |
| `locked` | boolean | `false` | MSD Studio only: the shape can't be dragged, resized or have its points moved on the canvas. No effect on the dashboard |
| `animations` | list | - | Animations on the shape; see [Animations and Rules](./animations) |

## rect and circle

**A `rect` or `circle` fills a box: `position` is its top-left corner and `size` its width and height.** This differs from a control, whose `position` is its centre unless you set `attachment`.

- `position` takes `[x, y]` in viewBox units or the name of an anchor.
- A `rect` gets rounded corners with `corner_style: round` and a `corner_radius`; without both its corners are square. A `circle` has no corners.
- `obstacle: true` makes routed lines go round the box, as on a [control](./control-overlay#obstacle).

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 220]
  anchors:
    west: [20, 110]
    east: [580, 110]
  overlays:
    # rounded corners
    - id: bay
      type: shape
      kind: rect
      position: [220, 50]
      size: [160, 120]
      corner_style: round
      corner_radius: 20
      obstacle: true
      style:
        color: var(--lcars-orange)
        width: 3
        fill: var(--lcars-orange)
        fill_opacity: 0.2
    # a line routed round the bay
    - id: corridor
      type: line
      anchor: west
      attach_to: east
      style:
        color: var(--lcars-blue)
        width: 3
```

| Key | Type | Default | Description |
|---|---|---|---|
| `position` | `[x, y]` / string | required | Top-left corner: `[x, y]` in viewBox units or an anchor name |
| `size` | `[width, height]` | required | Width and height, viewBox units |
| `corner_style` | string | square corners | `rect` only: `round` rounds the corners. `miter` and `bevel` leave them square |
| `corner_radius` | number | `0` | `rect` with `corner_style: round`: the corner radius, viewBox units |
| `obstacle` | boolean | `false` | Lines routed `auto`, `smart` or `grid` go round the box |

## polyline

**A `polyline` draws a path through a list of points: a wall, a conduit, an outline.** `closed: true` joins the last point back to the first, so the shape can be filled.

- Each point is `[x, y]` in viewBox units or an anchor name. At least two points are needed.
- Bends are rounded by default with a radius of `34`, like a line's; a bend between two short runs gets a smaller one. `corner_style: miter` keeps them sharp.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 240]
  overlays:
    # an open conduit with cut-off corners
    - id: conduit
      type: shape
      kind: polyline
      corner_style: bevel
      corner_radius: 24
      points:
        - [40, 40]
        - [260, 40]
        - [260, 200]
      style:
        color: var(--lcars-blue)
        width: 6
    # a closed, filled outline with square corners
    - id: deck
      type: shape
      kind: polyline
      closed: true
      corner_style: miter
      points:
        - [340, 40]
        - [560, 40]
        - [560, 200]
        - [420, 200]
      style:
        color: var(--lcars-orange)
        width: 3
        fill: var(--lcars-orange)
        fill_opacity: 0.2
```

| Key | Type | Default | Description |
|---|---|---|---|
| `points` | list | required | The points in order, each `[x, y]` or an anchor name. At least two |
| `closed` | boolean | `false` | Join the last point back to the first, so `style.fill` shows |
| `corner_style` | string | `round` | `round`, `miter` (sharp) or `bevel` (cut off) |
| `corner_radius` | number | `34` | Arc radius (`round`) or size of the cut (`bevel`), viewBox units |
| `corner_angle` | number | `45` | `bevel` only: angle of the cut, `0` to `90` degrees |
| `smoothing_mode` | string | `none` | `chaikin` softens the path into curves |
| `smoothing_iterations` | number | `0` | Smoothing passes, `0` to `5`. `chaikin` needs at least `1` |

## Attachment Points

**Lines attach to a shape like they attach to a control: name the shape in `anchor` or `attach_to` and a point in `anchor_side` or `attach_side`.**

- A `rect` or `circle` has the nine points of its box: `top`, `bottom`, `left`, `right`, `center` and the four corners (`top-left` ...). On a circle the corners are the box's corners, outside the circle.
- A `polyline` has one point per entry in `points`: `vertex0`, `vertex1` and so on, in order.
- In MSD Studio's Connect mode these show as green dots on the canvas (controls are orange, anchors cyan); drag a line's end near one to snap it on.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 260]
  overlays:
    - id: wall
      type: shape
      kind: polyline
      corner_style: miter
      points:
        - [40, 40]
        - [240, 40]
        - [240, 220]
      style:
        color: var(--lcars-blue)
        width: 4
    - id: room
      type: shape
      kind: rect
      position: [380, 60]
      size: [180, 120]
      style:
        color: var(--lcars-orange)
        width: 3
    # from the wall's middle point to the room's top-left corner
    - id: connector
      type: line
      anchor: wall
      anchor_side: vertex1
      attach_to: room
      attach_side: top-left
      style:
        color: var(--lcars-yellow)
        width: 3
```

| Key | Type | Default | Description |
|---|---|---|---|
| [`anchor_side`, `attach_side`](./line-overlay#attachment-points) | | | Set on the line: a box point, or `vertex<N>` on a polyline |

## Styling

**A shape takes the same `style` keys as a line, plus a fill that counts.** See [Line Overlay: Styling](./line-overlay#styling) for every key.

- `style.fill` shows on every `rect` and `circle` and on a `closed` polyline. Without a `style.color` the outline is `var(--lcars-orange)`.
- Markers (`marker_start`, `marker_mid`, `marker_end`) only work on a polyline; a box has no ends.
- `line_cap` shapes each dash of a dashed outline, so `dash_array: "0,10"` with `line_cap: round` draws a ring of dots. `line_join` and `miter_limit` have no effect on a circle.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 220]
  overlays:
    # a dotted ring
    - id: sensor_ring
      type: shape
      kind: circle
      position: [60, 30]
      size: [160, 160]
      style:
        color: var(--lcars-blue)
        width: 8
        dash_array: "0,16"
        line_cap: round
    # a polyline with an arrow
    - id: flow
      type: shape
      kind: polyline
      points:
        - [300, 180]
        - [300, 50]
        - [560, 50]
      style:
        color: var(--lcars-orange)
        width: 4
        marker_end:
          type: arrow
          size: 20
```

| Key | Type | Default | Description |
|---|---|---|---|
| `style.color` | colour / state map | `var(--lcars-orange)` | Outline colour |
| `style.fill` | colour / state map | `none` | Fill colour |
| `style.fill_opacity` | number | `1` | `0` to `1` |
| [Line style keys](./line-overlay#styling) | | | `width`, `opacity`, `line_cap`, `line_join`, `dash_array`, `gradient`, `pattern`, markers and `animatable`, as on a line |

## Dynamic Styling

**A shape's outline and fill can follow an entity: a room that lights up, a field that turns red on a breach.** Give the shape its own `entity` and make `style.color` or `style.fill` a map of states.

- The keys are the same as on a line or button: `active`, `inactive`, a state name, a range such as `above:90`. `state_attribute` and `ranges_attribute` work as on a [line](./line-overlay#dynamic-styling).
- Both colours update on their own when the entity changes. Rules can restyle shapes too; see [Animations and Rules](./animations).
- Change the toggle under the card to see the field follow.

```yaml live controls
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 220]
  overlays:
    - id: containment_field
      type: shape
      kind: circle
      position: [220, 30]
      size: [160, 160]
      entity: input_boolean.lcards_test_doors
      style:
        width: 4
        color:
          active: var(--lcars-alert-red)
          inactive: var(--lcars-green)
        fill:
          active: alpha(var(--lcars-alert-red), 0.4)
          inactive: alpha(var(--lcars-green), 0.15)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `entity` | string | - | The entity a state map in `style.color` or `style.fill` follows |
| `state_attribute` | string | - | Match this attribute's value against the state keys instead of the state |
| `ranges_attribute` | string | - | Compare this attribute against `above:`, `below:` and `between:` keys |

## Drawing & Editing in MSD Studio

**The Shapes tab and the canvas toolbar have three draw tools: Polyline, Rectangle and Circle.**

- **Polyline:** click to place each point; double-click (or turn the tool off) to finish. Points snap to the grid, with a live preview as you go.
- **Rectangle and circle:** drag from one corner to the opposite one, with a live preview.
- **Editing:** select a shape to drag its points (polyline) or its resize handles (rectangle, circle) on the canvas.
- The Bounding Boxes and Attachment Points toggles at the top right of the Shapes tab show the same aids as on the Controls tab.
