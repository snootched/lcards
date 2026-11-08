---
description: "MSD manual routing: draw a line through waypoints you choose, coordinates or anchor names, with a corner radius per waypoint."
moved_anchors:
  overview: /cards/msd/manual-routing#waypoints
  configuration: /cards/msd/manual-routing#waypoints
  waypoint-syntax: /cards/msd/manual-routing#waypoints
  coordinate-waypoints: /cards/msd/manual-routing#waypoints
  example-order-impact: /cards/msd/manual-routing#waypoint-order-matters
  best-practices: /cards/msd/manual-routing#waypoint-order-matters
  planning-routes: /cards/msd/manual-routing#waypoint-order-matters
  avoiding-double-back: /cards/msd/manual-routing#waypoint-order-matters
  line-not-routing-through-waypoints: /cards/msd/manual-routing#troubleshooting
  line-doubles-back-unexpectedly: /cards/msd/manual-routing#troubleshooting
  waypoints-not-visible-in-editor: /cards/msd/manual-routing#waypoints-in-msd-studio
---

# Manual Routing

**`route: manual` draws a line exactly where you say: from its start, through each waypoint in order, to its end.** Use it when a line must follow a set path on the blueprint, or for a decorative line.

- A manual line doesn't pathfind, bundle or avoid crossings. Other lines still see it: they avoid crossing it and can bundle beside it.
- For lines that should adapt when the layout changes, the automatic modes and [channels](./routing#channels) are usually the better tool; see [When to Use Manual Routing](#when-to-use-manual-routing).

## waypoints

**`waypoints` lists the points the line passes through, between `anchor` and `attach_to`.** A waypoint is `[x, y]` in viewBox units or the name of an anchor.

- The line runs `anchor`, then each waypoint in turn, then `attach_to`, with a straight run between each pair. A waypoint that isn't level with the one before gives a diagonal run.
- Each bend is rounded with the line's `corner_radius` (or cut with `corner_style: bevel`), shrinking to fit between short runs.
- `waypoints` only work with `route: manual`; on any other route they are ignored.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 500]
  anchors:
    start_point: [40, 60]
    nav_anchor: [200, 300]
    end_point: [560, 440]
  overlays:
    - type: line
      id: my_line
      anchor: start_point
      attach_to: end_point
      route: manual
      waypoints:
        # first a coordinate
        - [100, 200]
        # then a named anchor
        - nav_anchor
        # then another coordinate, then on to attach_to
        - [300, 400]
      style:
        color: var(--lcars-blue)
        width: 3
```

| Key | Type | Default | Description |
|---|---|---|---|
| `route` | string | `auto` | `manual` to draw through `waypoints` |
| `waypoints` | list | - | The points to pass through, in order: `[x, y]`, `[x, y, radius]` or an anchor name |
| [Corner keys](./line-overlay#corners) | | | `corner_style`, `corner_radius`, `corner_angle`, `smoothing_mode`, `smoothing_iterations`, as on any line |

## Named Anchor Waypoints

**A waypoint can be an anchor's name instead of a coordinate, so the line passes through wherever that anchor is.** Move the anchor and every line through it follows.

- The name is looked up when the card draws. A name that matches no anchor is skipped, and the line goes straight to the next point.
- Named waypoints keep the layout readable and easy to change: `engineering_junction` says more than `[412, 318]`.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 240]
  anchors:
    start: [40, 200]
    junction: [300, 40]
    finish: [560, 200]
  overlays:
    - id: junction_mark
      type: shape
      kind: circle
      position: [290, 30]
      size: [20, 20]
      style:
        color: var(--lcards-moonlight)
        fill: var(--lcards-moonlight)
    - id: via_junction
      type: line
      anchor: start
      attach_to: finish
      route: manual
      waypoints:
        - [40, 40]
        - junction
        - [560, 40]
      style:
        color: var(--lcars-orange)
        width: 4
```

| Key | Type | Default | Description |
|---|---|---|---|
| `waypoints` | list | - | An entry that is a string is an anchor name |

## Per-Waypoint Corner Radius

**A coordinate waypoint can carry a third number, the radius of its own corner: `[x, y, radius]`.** Other corners keep the line's `corner_radius`.

- With `corner_style: bevel` the third number is the size of that corner's cut.
- Like `corner_radius`, it is a target: a corner between short runs still gets a smaller one so it fits.
- An anchor-name waypoint is a string and can't carry a radius; its corner always uses the line's `corner_radius`.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 300]
  anchors:
    a: [40, 40]
    b: [560, 260]
  overlays:
    - id: mixed_corners
      type: line
      anchor: a
      attach_to: b
      route: manual
      corner_style: round
      corner_radius: 34
      waypoints:
        # tighter corner
        - [200, 40, 8]
        # the line's 34
        - [200, 260]
        # wider corner
        - [400, 260, 60]
        - [400, 40]
        - [560, 40]
      style:
        color: var(--lcars-blue)
        width: 4
```

| Key | Type | Default | Description |
|---|---|---|---|
| `waypoints` | list | - | `[x, y, radius]`: this corner's radius (or bevel size), viewBox units |
| `corner_radius` | number | `34` | The radius of every other corner |

## Waypoint Order Matters

**Waypoints are used strictly in the order you list them: `anchor`, then the first, the second ..., then `attach_to`.** Swap two and the line doubles back on itself.

- Sketch the path first (start, waypoint 1, waypoint 2, end), and list points so the line keeps moving one way: left to right, or top to bottom.
- Many waypoints to steer a line round things is a sign a [channel](./routing#channels) or an [obstacle](./routing#obstacles) would do the job with less upkeep.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 300]
  anchors:
    a1: [40, 60]
    b1: [280, 260]
    a2: [320, 60]
    b2: [560, 260]
  overlays:
    # right, then down: a clean L
    - id: in_order
      type: line
      anchor: a1
      attach_to: b1
      route: manual
      waypoints:
        - [280, 60]
      style:
        color: var(--lcars-blue)
        width: 4
    # down past the end, then back up: it doubles back
    - id: doubles_back
      type: line
      anchor: a2
      attach_to: b2
      route: manual
      corner_style: miter
      waypoints:
        - [320, 290]
        - [560, 290]
      style:
        color: var(--lcars-orange)
        width: 4
```

| Key | Type | Default | Description |
|---|---|---|---|
| `waypoints` | list | - | Used in list order, first to last |

## Waypoints in MSD Studio

**In MSD Studio, select a line and use the Add Waypoint tool to place waypoints on the canvas.**

- Click the canvas to add a coordinate waypoint at the end of the list; click an anchor's marker to add it by name. Adding a waypoint switches the line to `route: manual`.
- Each waypoint shows as a numbered marker. Drag a marker to move it, and drag a corner's radius handle to set that corner's own radius.
- Click empty canvas to leave the tool.

## When to Use Manual Routing

**Manual routing suits a path that must be exact; the automatic modes suit a layout that will change.**

- **Use `manual`** when the path must follow the blueprint or a design rule, to steer round channels or obstacles in a way the router won't, for decorative paths, or to check what an automatic line ought to look like.
- **Use `auto`** (or `smart`, `grid`) when the path should adapt as controls move, when many lines share similar routes, when [channels](./routing#channels) mark clear routing zones, or when you want less to maintain.

## Troubleshooting

**Most manual-line problems are a missing `route: manual` or waypoints in the wrong order.**

- **The line ignores its waypoints and goes straight to the end:** `route` isn't `manual`. Waypoints are only used on a manual line.
- **The line crosses itself or zigzags:** the waypoint order makes it go back. Reorder them so the path keeps moving one way; the Studio's numbered markers show the order.
- **No numbered markers in the Studio:** select the line first (click the line itself, not the empty canvas next to it). A line with no waypoints yet has no markers; add some with the Add Waypoint tool.
