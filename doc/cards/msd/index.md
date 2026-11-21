---
description: "The LCARdS MSD card (custom:lcards-msd-card): a Master Systems Display. Home Assistant cards placed on a ship blueprint or floor plan, joined by routed lines, with shapes, animations and rules."
moved_anchors:
  minimal-example: /cards/msd/#quick-start
  top-level-options: /cards/msd/#card-options
  msd-object: /cards/msd/background#msd
  base-svg-object: /cards/msd/background#base-svg
  filters: /cards/msd/base-svg-filters
  anchors-object: /cards/msd/background#anchors
  automatic-anchors: /cards/msd/background#automatic-anchors
  control-overlay: /cards/msd/control-overlay
  line-overlay: /cards/msd/line-overlay
  routing-algorithms: /cards/msd/routing
  shape-overlay: /cards/msd/shape-overlay
  routing-object: /cards/msd/routing#routing
  channels-object: /cards/msd/routing#channels
  animations-overlay-group-object: /cards/msd/animations#msd-animations
  rules-engine-integration: /cards/msd/animations#rules
  annotated-example: /cards/msd/quick-start#putting-it-together
---

# MSD Card

`custom:lcards-msd-card`

<video class="doc-video" src="/img/cards/msd-motion.webm" poster="/img/cards/msd.webp" title="MSD card: a starship blueprint inside shield arcs that turn orange, then red, as shield strength drops, with three controls joined to the ship by routed lines" autoplay loop muted playsinline></video>

**A Master Systems Display: a ship blueprint, deck plan or floor plan with live Home Assistant cards placed on it, joined to the drawing by lines that find their own way round it.** Shapes add rooms, zones and conduits, and rules and animations bring the whole display to life.

- The drawing is an SVG: one of the built-in blueprints, your own file, or a blank canvas. Every position on the card is measured in the drawing's own units, so the display scales as one.
- **Overlays** sit on the drawing: controls (any card), lines and shapes. A line runs between two named points (anchors), and routes round the controls and the ship by itself.
- Lines and shapes can follow entities: colours by state, animations, and rules that restyle several overlays at once.

::: tip Try it
- The card editor's **Open Configuration Studio** opens the MSD Studio: a full-screen editor where you pick the blueprint, draw controls and shapes on the canvas and connect lines with a click.
- [Getting Started](./quick-start) builds a first display in the Studio, step by step.
:::

| Page | Covers |
|------|--------|
| [Getting Started](./quick-start) | A first display in the MSD Studio, and a complete example to copy |
| [Background and Anchors](./background) | The `msd` block, the blueprint, the view box, anchors and an animated background |
| [Control Overlay](./control-overlay) | Any card placed on the drawing |
| [Line Overlay](./line-overlay) | Lines between anchors and overlays: sides, gaps, colours, markers |
| [Shape Overlay](./shape-overlay) | Rooms, zones and conduits: rectangles, circles and polylines |
| [Line Routing](./routing) | How lines find their way, bundling, crossings, channels and the routing settings |
| [Manual Routing](./manual-routing) | Lines through waypoints you place |
| [Animations and Rules](./animations) | Animations on the blueprint and on groups of overlays, and rules that restyle overlays |
| [Base SVG Filters](./base-svg-filters) | Dim, blur or tint the blueprint so the overlays stand out |

## Quick start

**A blueprint, two controls in its empty corners, and a line from each control to a point on the ship.**

- `br` and `wc` are markers built into this blueprint (its bridge and warp core): see [Automatic anchors](./background#automatic-anchors).
- `attachment: top-left` makes `position` the control's top-left corner. Without it, `position` is the control's centre.
- `route: auto` draws each line around the ship, not through it.

```yaml live
type: custom:lcards-msd-card
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
  overlays:
    - id: bridge-ctl
      type: control
      attachment: top-left
      position: [60, 60]
      size: [360, 100]
      card:
        type: custom:lcards-button
        entity: light.bridge
        preset: lozenge
        text:
          label:
            content: BRIDGE
            show: true
            font_size: 30
    - id: core-ctl
      type: control
      attachment: top-left
      position: [60, 1040]
      size: [360, 100]
      card:
        type: custom:lcards-button
        entity: switch.warp_core
        preset: lozenge
        text:
          label:
            content: WARP CORE
            show: true
            font_size: 30
    - id: bridge-line
      type: line
      anchor: bridge-ctl
      attach_to: br
      route: auto
    - id: core-line
      type: line
      anchor: core-ctl
      attach_to: wc
      route: auto
```

## Overlay types

**Everything on the drawing is one of three overlay types, listed under `msd.overlays`.** Each has an `id` (required, and what lines and rules use to find it) and a `type`.

- Overlays paint in `z_index` order, higher in front. Unset, controls paint over lines and lines over shapes.
- A button, chart or slider on the drawing is a normal card inside a control overlay; the MSD has no widgets of its own.

| Type | Draws | Placed with | `z_index` default | Page |
|------|-------|-------------|-------------------|------|
| `control` | Any Home Assistant or LCARdS card | `position`, `size`, `attachment` | `200` | [Control Overlay](./control-overlay) |
| `line` | A line from one anchor or overlay to another | `anchor`, `attach_to`, `route` | `100` | [Line Overlay](./line-overlay) |
| `shape` | A rectangle, circle or polyline | `kind`, then `position` and `size`, or `points` | `50` | [Shape Overlay](./shape-overlay) |

## Card options

**The card's own top-level keys: the `msd` block holds the display, the rest are the keys every LCARdS card takes.** Each links to its page.

- Rules restyle overlays through their ids and the card's `id` and `tags`: see [Rules](./animations#rules).
- In a sections view the card takes the full width and 8 rows unless `grid_options` says otherwise, and can't be made smaller than 2 by 4.

```yaml live
type: custom:lcards-msd-card
id: bridge-display
tags:
  - ship-displays
grid_options:
  columns: full
  rows: 5
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
  view_box: [180, 270, 1600, 720]
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `type` | string | required | `custom:lcards-msd-card` |
| `msd` | object | required | The display: blueprint, view box, anchors, overlays, routing, animations. See [msd](./background#msd) |
| `id` | string | - | This card's name for rules and logs: see [id and tags](../common#id-and-tags) |
| `tags` | list | - | Group names for rules: see [id and tags](../common#id-and-tags) |
| `rules` | list | - | Rules that restyle overlays and play animations: see [Rules](./animations#rules) and the [Rules Engine](../../core/rules/) |
| `data_sources` | object | - | Named entity subscriptions with history and processing: see [Data Sources](../../core/datasources/) |
| `height` | number / string | the cell's height | Card height: see [Sizing](../common#sizing) |
| `width` | number / string | the cell's width | Card width: see [Sizing](../common#sizing) |
| `min_height` | number / string | - | Smallest height: see [Minimum and maximum size](../common#minimum-and-maximum-size) |
| `min_width` | number / string | - | Smallest width: see [Minimum and maximum size](../common#minimum-and-maximum-size) |
| `max_height` | number / string | - | Largest height: see [Minimum and maximum size](../common#minimum-and-maximum-size) |
| `max_width` | number / string | - | Largest width: see [Minimum and maximum size](../common#minimum-and-maximum-size) |
| `overflow` | string | - | What happens to content outside the card: see [overflow](../common#overflow) |
| `overflow_x` | string | - | Left to right only, over `overflow` |
| `overflow_y` | string | - | Top to bottom only, over `overflow` |
| `z_index` | integer | - | The card's stacking order on the dashboard: see [z_index](../common#z-index) |
| `grid_options` | object | full width, 8 rows | Home Assistant's cell size in a sections view: see [grid_options](../common#grid-options) |
