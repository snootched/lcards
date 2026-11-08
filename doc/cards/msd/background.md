---
description: "MSD card background and anchors: the msd block, the base SVG blueprint and its sources, the view box, a blank canvas, named anchors, the anchors found in the blueprint, and an animated background."
---

# Background and Anchors

The drawing an MSD is built on, and the named points on it that overlays and lines use. The overlays themselves have their own pages: [Control Overlay](./control-overlay), [Line Overlay](./line-overlay) and [Shape Overlay](./shape-overlay).

## msd

**Everything the display shows lives under the card's `msd` key: the blueprint, the view box, the anchors, the overlays and how lines are routed.** The other top-level keys (`id`, `rules`, sizing) are on the [overview](./#card-options).

- An `msd` needs a blueprint (`base_svg.source`) or a `view_box`. A `view_box` with no blueprint is a [blank canvas](#a-blank-canvas).
- Every position, size and distance under `msd` is in the drawing's own units (its view box), not pixels, so the whole display scales with the card.

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 5
msd:
  # the blueprint, and the part of it to show
  base_svg:
    source: builtin:ncc-1701-a-blue
  view_box: [180, 270, 1600, 720]
  # a card on the drawing, and a line from it to the bridge marker (br)
  overlays:
    - id: bridge-ctl
      type: control
      attachment: top-left
      position: [190, 278]
      size: [340, 96]
      card:
        type: custom:lcards-button
        preset: lozenge
        entity: input_boolean.lcards_test_lights
        text:
          name:
            content: BRIDGE
            show: true
            font_size: 30
    - id: bridge-line
      type: line
      anchor: bridge-ctl
      attach_to: br
      route: auto
      corner_style: round
      style:
        color: var(--lcards-gray-medium-light)
        width: 3
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `msd.base_svg` | object | - | The blueprint: see [base_svg](#base-svg). Not needed for a blank canvas |
| `msd.view_box` | `auto` / list | `auto` | The part of the drawing shown, `[min_x, min_y, width, height]`: see [view_box](#view-box) |
| `msd.anchors` | object | - | Your own named points: see [anchors](#anchors) |
| `msd.overlays` | list | - | The controls, lines and shapes: see [Overlay types](./#overlay-types) |
| `msd.routing` | object | - | Card-wide line routing settings: see [Line Routing](./routing#routing) |
| `msd.channels` | object | - | Named corridors that guide lines: see [Line Routing](./routing#channels) |
| `msd.animations` | list | - | One animation for a group of overlays: see [msd.animations](./animations#msd-animations) |
| `msd.background_animation` | list / object | - | An animated canvas behind the drawing: see [background_animation](#background-animation) |
| `msd.triggers_update` | string | - | `all`: every control gets every Home Assistant update. Slower; prefer `triggers_update` on the one control that needs it ([Control Overlay](./control-overlay)) |

## base_svg

**The blueprint the display is drawn on: a built-in ship, your own SVG file, or none.** Its markers and outline also give you [anchors](#automatic-anchors) to attach lines to without placing any yourself.

- `source` takes `builtin:<name>` (see [Built-in blueprints](#built-in-blueprints)), a file in your `/config/www` folder as `/local/<file>.svg`, a full `https://` URL (the site must allow it), or an SVG from the Home Assistant media library as `media-source://...`.
- In the MSD Studio's Base SVG tab, **Asset library** lists the built-in blueprints, **Custom path** takes a `/local/` path or a URL, and **Browse Home Assistant media** picks an SVG from the media library (it lists only SVG files).
- `render_visual: false` hides the blueprint but still reads its anchors: use it with an [animated or image background](#background-animation) and anchors placed on that instead.

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 6
msd:
  base_svg:
    source: builtin:ncc-1701-kelvin
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `base_svg.source` | string | required | `builtin:<name>`, `/local/<file>.svg`, an `https://` URL, `media-source://...`, or `none` for a [blank canvas](#a-blank-canvas) |
| `base_svg.filters` | list | - | Dim, blur or tint the blueprint: see [Base SVG Filters](./base-svg-filters) |
| `base_svg.render_visual` | boolean | `true` | `false`: don't draw the blueprint, only read its anchors and view box |
| `base_svg.harvest_landmarks` | boolean | `true` | Work out anchors from the blueprint's outline: see [Automatic anchors](#automatic-anchors) |
| `base_svg.harvest_svg_elements` | boolean | `true` | Use the blueprint's own named markers as anchors: see [Automatic anchors](#automatic-anchors) |
| `base_svg.animations` | list | - | Animations on parts of the blueprint, by id or class: see [base_svg.animations](./animations#base-svg-animations) |

### Built-in blueprints

**The blueprints that come with LCARdS, for `source: builtin:<name>`.** The MSD Studio's Asset library lists the same ones.

| Source | Blueprint |
|--------|-----------|
| `builtin:ncc-1701-a` | USS Enterprise NCC-1701-A (Constitution class refit), the master systems display |
| `builtin:ncc-1701-a-blue` | The same ship in blue, with markers for the bridge (`br`), warp core (`wc`) and shuttle bay (`sb`) |
| `builtin:ncc-1701-kelvin` | USS Enterprise NCC-1701 of the Kelvin timeline films |
| `builtin:enterprise-d-shuttlecraft15-anomaly` | Shuttlecraft 15, a type-6 shuttle of the Enterprise-D, with anomaly markers |

## view_box

**Which part of the drawing the card shows, and the coordinates every position on it uses.** By default it is the blueprint's own view box, so the whole drawing fits the card.

- Give `[min_x, min_y, width, height]` to show only part of the blueprint: the card crops to it and keeps its shape (width to height).
- Overlay positions stay in the blueprint's coordinates whatever the view box: cropping moves the window, not the overlays.
- In the MSD Studio, the Base SVG tab's ViewBox section switches between **Auto-detect from SVG** and a custom view box.

```yaml live
# Only the ship's middle, cropped from the 1920 by 1200 blueprint
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 5
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
  view_box: [180, 270, 1600, 720]
```

::: details More about view_box
- **No view box in the SVG:** with `auto`, an SVG file that has no `viewBox` of its own is read as `[0, 0, 400, 200]`. Give `view_box` for such a file.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `view_box` | `auto` / list | `auto` | `auto`: the blueprint's own view box. Or `[min_x, min_y, width, height]` in the blueprint's units; required for a blank canvas |

### A blank canvas

**A display with no blueprint: give a `view_box` and draw everything with overlays.** Use it for a panel of controls wired together, or a floor plan drawn from shapes.

- A `view_box` with no `base_svg` is a blank canvas; `base_svg.source: none` says the same thing and needs a `view_box` too.
- With no blueprint there are no automatic anchors: place overlays by `[x, y]` or by your own [anchors](#anchors).

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 4
msd:
  view_box: [0, 0, 800, 300]
  overlays:
    - id: deck
      type: shape
      kind: rect
      position: [40, 40]
      size: [720, 220]
      corner_style: round
      corner_radius: 24
      style:
        color: var(--lcars-orange)
        width: 3
        fill: alpha(var(--lcars-orange), 0.1)
    - id: lights-ctl
      type: control
      position: [400, 150]
      size: [260, 80]
      card:
        type: custom:lcards-button
        preset: lozenge
        entity: input_boolean.lcards_test_lights
        text:
          name:
            content: DECK LIGHTS
            show: true
```

## anchors

**Your own named points on the drawing, for placing controls and for the ends of lines.** A control's `position`, a line's `anchor` or `attach_to`, and a shape's `position` or `points` can all name an anchor instead of giving `[x, y]`.

- Each anchor is `[x, y]` in the drawing's units. Either value may be a percentage of the view box instead (`"40%"`), measured from its top-left corner.
- An anchor you name here wins over an [automatic anchor](#automatic-anchors) of the same name, so you can move a blueprint's marker without editing the file.
- In the MSD Studio, the Anchors tab adds anchors with **Add Anchor** or by clicking **Place on Canvas**.

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 4
msd:
  view_box: [0, 0, 800, 300]
  anchors:
    port: [150, 120]
    starboard: ["80%", "40%"]
    relay: ["50%", "85%"]
  overlays:
    # controls centred on two anchors
    - id: port-ctl
      type: control
      position: port
      size: [200, 70]
      card:
        type: custom:lcards-button
        preset: lozenge
        entity: input_boolean.lcards_test_lights
        text:
          name:
            content: PORT
            show: true
    - id: starboard-ctl
      type: control
      position: starboard
      size: [200, 70]
      card:
        type: custom:lcards-button
        preset: lozenge
        entity: input_boolean.lcards_test_doors
        text:
          name:
            content: STARBOARD
            show: true
    # lines from each control to the relay anchor
    - id: port-line
      type: line
      anchor: port-ctl
      attach_to: relay
      route: auto
      corner_style: round
    - id: starboard-line
      type: line
      anchor: starboard-ctl
      attach_to: relay
      route: auto
      corner_style: round
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `anchors.<name>` | `[x, y]` | - | A named point in the drawing's units. Each value may be a percentage of the view box, as `"40%"` |

## Automatic anchors

**A blueprint gives you anchors of its own, so lines can attach to it before you place any: its named markers, and landmarks worked out from its outline.** Both are on by default.

- **Landmarks** (`harvest_landmarks`) come from the blueprint's silhouette: `hull_center` (its middle), `extremity_bow` and `extremity_stern` (the right-most and left-most points), `extremity_top` and `extremity_bottom`, and on a twin-hulled shape such as a ship with nacelles, `lateral_a` and `lateral_b` (the tips of the two hulls).
- **Markers** (`harvest_svg_elements`): every `<circle>`, `<ellipse>`, `<text>` and `<rect>` in the SVG with an `id` is an anchor of that name (a rectangle by its centre). The built-in `ncc-1701-a-blue` has `br`, `wc` and `sb` this way.
- When names collide, your [anchors](#anchors) win over markers, and markers over landmarks.

```yaml live
type: custom:lcards-msd-card
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
  overlays:
    - id: top-ctl
      type: control
      attachment: top-left
      position: [60, 60]
      size: [360, 100]
      card:
        type: custom:lcards-button
        entity: input_boolean.lcards_test_lights
        preset: lozenge
        text:
          name:
            content: TOP
            show: true
            font_size: 30
    - id: centre-ctl
      type: control
      attachment: top-left
      position: [60, 1040]
      size: [360, 100]
      card:
        type: custom:lcards-button
        entity: input_boolean.lcards_test_toggle
        preset: lozenge
        text:
          name:
            content: CENTRE
            show: true
            font_size: 30
    # a landmark from the outline, and one from the middle of the ship
    - id: top-line
      type: line
      anchor: top-ctl
      attach_to: extremity_top
      route: auto
    - id: centre-line
      type: line
      anchor: centre-ctl
      attach_to: hull_center
      route: auto
```

::: details More about automatic anchors
- **Facing:** `extremity_bow` is the right-most point, so it is the bow only on a blueprint that faces right.
- **Landmarks that share a spot:** a landmark that lands on the same place as one before it is left out. On a ship whose nacelles reach furthest, `lateral_a` and `lateral_b` take that spot and `extremity_bow` or `extremity_stern` may not exist.
- **Ids from a drawing program:** marker names come from the SVG as exported, so they can be numbered (`g293`) rather than meaningful. Ids that start with `__` or `msd-internal-` are skipped.
- **In the MSD Studio:** the Anchors tab lists both kinds read-only, as **Base SVG: Computed** (landmarks) and **Base SVG: Harvested** (markers), with a search box. **Promote to User Anchor** opens the Add Anchor form at that point, so you can give a `g293` a proper name under `anchors`; **Promote All** does it for every entry the search matches.
- **Turning them off:** set `harvest_landmarks: false` or `harvest_svg_elements: false` to drop either kind, for example a long list of numbered markers. Turning landmarks off also saves the work of reading the outline when the card loads.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `base_svg.harvest_landmarks` | boolean | `true` | Landmarks from the blueprint's outline: `hull_center`, `extremity_bow`, `extremity_stern`, `extremity_top`, `extremity_bottom`, `lateral_a`, `lateral_b` |
| `base_svg.harvest_svg_elements` | boolean | `true` | The blueprint's named `<circle>`, `<ellipse>`, `<text>` and `<rect>` elements, by their `id` |

## background_animation

**An animated canvas behind the drawing: a starfield, a grid, a nebula, or a still image.** It is the same background the button and elbow cards use, with every preset of [Background Animations](../../core/effects/background-animations).

- It draws behind the blueprint and every overlay, whatever their `z_index`.
- To use a picture instead of a blueprint, set `base_svg.render_visual: false` and add the `image` preset: the blueprint's anchors and view box still apply, so you can keep its markers or place your own anchors on the picture.
- In the MSD Studio it is the Base SVG tab's **Background Effects** section; the Studio's preview doesn't draw it.

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 5
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
  view_box: [180, 270, 1600, 720]
  # stars drifting behind the ship
  background_animation:
    - preset: starfield
      config:
        count: 200
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `background_animation` | list / object | - | A list of effects (`preset` and `config`), or `inset` and `effects`: see [Background Animations](../../core/effects/background-animations) |
