---
description: "MSD line overlay: join controls, shapes and anchors with routed lines; sides, gaps, routing modes, corners, stroke, dashes, markers and colours that follow entities."
moved_anchors:
  quick-start: /cards/msd/line-overlay#anchor-and-attach-to
  properties: /cards/msd/line-overlay#anchor-and-attach-to
  with-specific-sides: /cards/msd/line-overlay#attachment-points
  stroke: /cards/msd/line-overlay#styling
  fill-self-intersecting-closed-paths: /cards/msd/line-overlay#fill
  markers-arrows: /cards/msd/line-overlay#markers
  gradients: /cards/msd/line-overlay#gradients-and-patterns
  patterns: /cards/msd/line-overlay#gradients-and-patterns
  state-based-color-and-fill: /cards/msd/line-overlay#dynamic-styling
  templated-values: /cards/msd/line-overlay#dynamic-styling
  animations: /cards/msd/animations
  complete-property-reference: /cards/msd/line-overlay#anchor-and-attach-to
  see-also: /cards/msd/line-overlay#anchor-and-attach-to
---

# Line Overlay

`type: line`

**A line joins two places on the MSD canvas: a control to a point on the ship, one control to another, a shape's corner to an anchor.** You give the two ends; the router draws the path between them, round obstacles and alongside other lines.

- Ends can be a control, a [shape](./shape-overlay), an anchor name or `[x, y]`. A line to a control or shape follows it when it moves.
- How the router picks a path, bundles lines and avoids crossings is on [Line Routing](./routing). [Manual Routing](./manual-routing) draws a line through points you choose.

## anchor and attach_to

**`anchor` is where the line starts and `attach_to` is where it ends.** Each takes an overlay `id`, the name of an anchor, or `[x, y]` in viewBox units.

- Both ends are needed. Point at a control or shape, and pick the point on it with a [side](#attachment-points).
- Lines are drawn under controls and over shapes (`z_index` `100`), and the background is always behind them.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 240]
  anchors:
    hull: [520, 200]
  overlays:
    - id: bridge_ctl
      type: control
      position: [130, 60]
      size: [200, 60]
      card:
        type: custom:lcards-button
        entity: light.bridge
        preset: lozenge
        text:
          label:
            content: BRIDGE
            show: true
    # from the control's right edge to a named anchor
    - id: bridge_line
      type: line
      anchor: bridge_ctl
      anchor_side: right
      attach_to: hull
      style:
        color: var(--lcars-orange)
        width: 4
    # between two coordinates
    - id: plain_line
      type: line
      anchor: [40, 200]
      attach_to: [300, 200]
      style:
        color: var(--lcars-blue)
        width: 4
```

| Key | Type | Default | Description |
|---|---|---|---|
| `id` | string | required | Unique id, for rules and the Studio |
| `anchor` | string / `[x, y]` | required | Start: an overlay `id`, an anchor name or `[x, y]` |
| `attach_to` | string / `[x, y]` | required | End: an overlay `id`, an anchor name or `[x, y]` |
| `tags` | list | - | Tags for rules: the selector `tag:<name>` matches every overlay with that tag |
| `z_index` | number | `100` | Stacking order among overlays; higher is in front. Controls default to `200`, shapes to `50` |
| `animations` | list | - | Animations on the line (draw it in, march its dashes); see [Animations and Rules](./animations) |

## Attachment Points

**`anchor_side` and `attach_side` pick the point of a control or shape where the line starts or ends.** There are nine on a control or a `rect`/`circle` shape, and one per corner point on a `polyline` shape.

- On an end that is a control or shape, a side you leave out is the one nearest the other end, and the line starts out at right angles to it. Set `center` to run to the middle.
- A side also sets the direction the line leaves or arrives in: `left` and `right` make that end horizontal, `top` and `bottom` vertical. This works on an anchor or `[x, y]` end too, which has no edge to sit on.
- A corner side with a `route_hint` (`route_hint_last` at the end) runs the line along that edge, inside it: the line's outer edge is flush with the box, and it starts half its width inside the corner. A label with a border on one side and a line from that side's top corner make one clean L.
- In MSD Studio's Connect mode these points show as dots on every control (orange), shape (green) and anchor (cyan): click a start and an end to draw a line with the sides filled in. Dragging a line's end near a point snaps it on.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 260]
  overlays:
    - id: card_a
      type: control
      position: [130, 70]
      size: [180, 60]
      card:
        type: custom:lcards-button
        entity: light.port
        preset: lozenge
        text:
          label:
            content: PORT
            show: true
    - id: card_b
      type: control
      position: [470, 190]
      size: [180, 60]
      card:
        type: custom:lcards-button
        entity: light.starboard
        preset: lozenge
        text:
          label:
            content: STARBOARD
            show: true
    # right edge to left edge
    - id: h_connection
      type: line
      anchor: card_a
      anchor_side: right
      attach_to: card_b
      attach_side: left
      style:
        color: var(--lcars-orange)
        width: 4
    # bottom edge to bottom edge
    - id: v_connection
      type: line
      anchor: card_a
      anchor_side: bottom
      attach_to: card_b
      attach_side: bottom
      style:
        color: var(--lcars-blue)
        width: 4
```

| Key | Type | Default | Description |
|---|---|---|---|
| `anchor_side` | string | nearest side | Where on the start overlay the line begins: `top`, `bottom`, `left`, `right`, `center`, `top-left`, `top-right`, `bottom-left`, `bottom-right`, or `vertex0`, `vertex1` ... on a polyline shape |
| `attach_side` | string | nearest side | Where on the end overlay the line arrives; same values |

## Gap System

**A gap leaves a space between the overlay's edge and the end of the line.** Use it so a line stops short of a card instead of touching it.

- The gap moves the end straight out from the side: left from `left`, up from `top`, and out on both axes from a corner.
- A gap needs a side on an overlay end. An anchor or `[x, y]` end has no edge to step out from.
- `attach_gap_x` and `attach_gap_y` set the two directions of the end's gap separately, for a corner.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 160]
  overlays:
    - id: card_a
      type: control
      position: [130, 80]
      size: [180, 60]
      card:
        type: custom:lcards-button
        entity: light.port
        preset: lozenge
        text:
          label:
            content: PORT
            show: true
    - id: card_b
      type: control
      position: [470, 80]
      size: [180, 60]
      card:
        type: custom:lcards-button
        entity: light.starboard
        preset: lozenge
        text:
          label:
            content: STARBOARD
            show: true
    - id: gap_line
      type: line
      anchor: card_a
      anchor_side: right
      # 20 out from card_a's right edge
      anchor_gap: 20
      attach_to: card_b
      attach_side: left
      # 20 out from card_b's left edge
      attach_gap: 20
      style:
        color: var(--lcars-orange)
        width: 4
```

| Key | Type | Default | Description |
|---|---|---|---|
| `anchor_gap` | number | `0` | Space between the start overlay's side and the line, viewBox units |
| `attach_gap` | number | `0` | Space between the end overlay's side and the line, viewBox units |
| `attach_gap_x` | number | `attach_gap` | The end's gap across, for a corner or `left`/`right` side |
| `attach_gap_y` | number | `attach_gap` | The end's gap up or down, for a corner or `top`/`bottom` side |

## Routing Modes

**`route` picks how the path is drawn: found round obstacles and other lines (`auto`), straight, one bend, a side stub and then straight, or through your own points.** Leave it out for `auto`, which suits almost every line.

- `auto`, `smart` and `grid` lines bundle with nearby lines and avoid crossing them; see [Line Routing](./routing). `direct`, `angled`, `manhattan` and `manual` lines keep their shape, though other lines still bundle beside them and avoid crossing them.
- `route_hint` and `route_hint_last` set which way the first and last stretch run, for every mode except `direct`, `angled` and `manual`. A side (`anchor_side`, `attach_side`) sets them for you when you leave them out.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 380]
  anchors:
    a1: [40, 40]
    b1: [560, 120]
    a2: [40, 160]
    b2: [560, 280]
    a3: [40, 360]
    b3: [460, 290]
  overlays:
    # straight
    - id: direct_line
      type: line
      anchor: a1
      attach_to: b1
      route: direct
      style:
        color: var(--lcars-blue)
        width: 3
    # one bend, vertical first
    - id: manhattan_line
      type: line
      anchor: a1
      attach_to: b1
      route: manhattan
      route_hint: yx
      style:
        color: var(--lcars-orange)
        width: 3
    # through two points of your own
    - id: manual_line
      type: line
      anchor: a2
      attach_to: b2
      route: manual
      waypoints:
        - [300, 160]
        - [300, 280]
      style:
        color: var(--lcars-green)
        width: 3
    # a stub out of the right side, then straight at an angle
    - id: angled_line
      type: line
      anchor: a3
      attach_to: b3
      route: angled
      anchor_side: right
      stub_length: 120
      corner_radius: 12
      style:
        color: var(--lcars-yellow)
        width: 3
```

| Mode | What it draws |
|---|---|
| `auto` | The default: full pathfinding with obstacle avoidance, bundling and crossing avoidance. The same as `smart` |
| `direct` | A straight line between the ends. Never pathfinds |
| `angled` | A straight stub out of `anchor_side` (and into `attach_side` when set), then one straight run at any angle. `stub_length` sets the stub. Never pathfinds |
| `manhattan` | One bend (or a few, to leave and arrive on the sides you set). No pathfinding, bundling or crossing avoidance |
| `smart` | Pathfinding plus a refinement pass that nudges bends for room and clearance |
| `grid` | Pathfinding, bundling and crossing avoidance, without the refinement pass |
| `manual` | Straight runs through your `waypoints`; see [Manual Routing](./manual-routing) |

::: details More about route hints
- **Values:** `xy` and `yx` name the order of the two directions. On `route_hint`, `xy` starts horizontal and `yx` starts vertical. On `route_hint_last`, `xy` ends vertical and `yx` ends horizontal.
- **From sides:** with no hint set, `anchor_side: left` or `right` starts the line horizontal and `top` or `bottom` vertical; `attach_side` does the same for the end. A corner or `center` side doesn't set a direction.
- **Neither:** the line starts along whichever axis is longer between the two ends, and ends the same way it started.
- **Order:** a hint you set wins over a side, and a side wins over the distance rule.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `route` | string | `auto` | `auto`, `direct`, `angled`, `manhattan`, `smart`, `grid` or `manual` |
| `route_hint` | string | from `anchor_side` | First stretch: `xy` horizontal, `yx` vertical |
| `route_hint_last` | string | from `attach_side` | Last stretch: `xy` vertical, `yx` horizontal |
| `waypoints` | list | - | `manual` only: the points to pass through, in order: `[x, y]`, `[x, y, radius]` or an anchor name. See [Manual Routing](./manual-routing#per-waypoint-corner-radius) |
| `route_channels` | list | - | Channel ids this line routes through; see [channels](./routing#channels) |
| `clearance` | number | `routing.clearance` | Space kept round obstacles for this line, viewBox units |

## Corners

**`corner_style` and `corner_radius` shape every bend: rounded (the default), square, or cut off diagonally.** The radius is a target; a bend between two short runs gets a smaller one so it fits.

- `bevel` cuts the corner off; `corner_angle` tilts the cut toward the run going in (`0`) or coming out (`90`).
- `corner_radius_mode: forced` keeps room for the full radius at every bend, at the cost of more detours and crossings; [Corner Size](./routing#corner-size-target-vs-forced) explains when that helps.
- `smoothing_mode: chaikin` softens the whole path into curves. Set `smoothing_iterations` too: with `0` nothing changes.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 240]
  anchors:
    s1: [40, 40]
    end_1: [200, 200]
    s2: [220, 40]
    end_2: [380, 200]
    s3: [400, 40]
    end_3: [560, 200]
  overlays:
    # rounded, radius 34 (the default)
    - id: round_line
      type: line
      anchor: s1
      attach_to: end_1
      route: manhattan
      style:
        color: var(--lcars-orange)
        width: 6
    # square
    - id: miter_line
      type: line
      anchor: s2
      attach_to: end_2
      route: manhattan
      corner_style: miter
      style:
        color: var(--lcars-blue)
        width: 6
    # cut diagonally
    - id: bevel_line
      type: line
      anchor: s3
      attach_to: end_3
      route: manhattan
      corner_style: bevel
      corner_radius: 40
      style:
        color: var(--lcars-green)
        width: 6
```

::: details More about corners
- **Fitting:** a bend's radius is at most half the shorter run either side of it, and shrinks near another line so the two strokes don't touch. A wider stroke gets a slightly smaller radius for the same reason.
- **The first run:** routed lines keep a short straight run at each end before turning. `stub_length` sets it for one line; leave it unset unless a line turns later than it should, and check what the router chose first in the [debugger](./routing#debugging).
- **Corner room:** `corner_room_weight` (on `smart` and `auto` lines) lets the router move a bend a little to give a squeezed corner its full radius. `0` turns it off for this line.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `corner_style` | string | `round` | `round`, `miter` (square) or `bevel` (cut off) |
| `corner_radius` | number | `34` | Arc radius (`round`) or size of the cut (`bevel`), viewBox units. On a `manual` line one corner can differ: `[x, y, radius]` |
| `corner_radius_mode` | string | `auto` | `auto`: the radius shrinks where room is short. `forced`: room for the full radius is kept at every bend |
| `corner_angle` | number | `45` | `bevel` only: angle of the cut, `0` to `90` degrees |
| `stub_length` | number | the router's | Straight run at each end before the first turn, viewBox units |
| `corner_room_weight` | number | `routing.corner_room_weight` (`4`) | How hard the router works to give a squeezed corner its full radius. `0` turns it off |
| `smoothing_mode` | string | `none` | `none` or `chaikin` |
| `smoothing_iterations` | number | `0` | Smoothing passes, `0` to `5` |

## Styling

**`style` sets how the line is drawn: colour, width, opacity and the shape of its ends.** The same `style` works on [shapes](./shape-overlay#styling).

- `width` is in viewBox units, so a line gets thicker as the card is drawn bigger, like everything else on the canvas.
- `color` takes a colour or a map of states; see [Dynamic Styling](#dynamic-styling).

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 160]
  anchors:
    a: [40, 50]
    b: [560, 50]
    c: [40, 110]
    d: [560, 110]
  overlays:
    - id: thick_line
      type: line
      anchor: a
      attach_to: b
      style:
        color: var(--lcars-orange)
        width: 10
        line_cap: round
    - id: faint_line
      type: line
      anchor: c
      attach_to: d
      style:
        color: var(--lcars-blue)
        width: 4
        opacity: 0.5
```

| Key | Type | Default | Description |
|---|---|---|---|
| `style.color` | colour / state map | `theme:colors.ui.tertiary` | Line colour. `style.stroke` is an older name |
| `style.width` | number | `2` | Width, viewBox units. `style.stroke_width` is an older name |
| `style.opacity` | number | `1` | `0` to `1`. Markers fade with the line |
| `style.line_cap` | string | `butt` | `butt`, `round` or `square`: the ends of the line and of every dash |
| `style.line_join` | string | the line's `corner_style`, else `miter` | `miter`, `round` or `bevel`: how the stroke turns at a sharp corner |
| `style.miter_limit` | number | `4` | With `line_join: miter`: how far a sharp join may stick out |
| `style.animatable` | boolean | `true` | `false`: animations skip this line |
| [Dashes](#dash-patterns), [fill](#fill), [gradients and patterns](#gradients-and-patterns), [markers](#markers) | | | The other `style` keys |

### Dash Patterns

**`style.dash_array` breaks the line into dashes or dots.** Give dash and gap lengths, as `"5,5"` or `[5, 5]`.

- `line_cap: round` rounds every dash. For round dots use a dash of length `0`: `dash_array: "0,8"` with `line_cap: round` draws circles as wide as the line.
- A short dash with round caps (`"2,2"`) draws pills, not dots. MSD Studio's Dotted and Dash-Dot patterns use zero-length dashes for you; for other spacing pick Custom with a dash length of `0`.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 160]
  anchors:
    a: [40, 50]
    b: [560, 50]
    c: [40, 110]
    d: [560, 110]
  overlays:
    # dashes
    - id: dashed_line
      type: line
      anchor: a
      attach_to: b
      style:
        color: var(--lcars-orange)
        width: 4
        dash_array: "20,10"
    # round dots
    - id: dotted_line
      type: line
      anchor: c
      attach_to: d
      style:
        color: var(--lcars-blue)
        width: 8
        dash_array: "0,16"
        line_cap: round
```

| Key | Type | Default | Description |
|---|---|---|---|
| `style.dash_array` | string / list | solid | Dash and gap lengths, `"5,5"` or `[5, 5]` |
| `style.dash_offset` | number | `0` | Where along the pattern the line starts |

### Fill

**`style.fill` fills the area a path encloses.** It matters most on [shapes](./shape-overlay) (rooms, zones); a line only encloses an area where its path crosses itself.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 220]
  anchors:
    a: [100, 40]
    b: [500, 40]
  overlays:
    # an open U: the fill closes it from end to start
    - id: loop_line
      type: line
      anchor: a
      attach_to: b
      route: manual
      corner_style: miter
      waypoints:
        - [100, 180]
        - [500, 180]
      style:
        color: var(--lcars-blue)
        width: 3
        fill: var(--lcars-blue)
        fill_opacity: 0.3
```

| Key | Type | Default | Description |
|---|---|---|---|
| `style.fill` | colour / state map | `none` | Fill colour |
| `style.fill_opacity` | number | `1` | `0` to `1` |

### Gradients and Patterns

**`style.gradient` fades the line from one colour to another; `style.pattern` draws it in dots.** Either one replaces `color`.

- A gradient always runs left to right. `type` and `direction` are accepted but not used yet.
- A pattern is always dots: small circles `size` apart. Other pattern types are accepted but drawn as dots.
- The short form `gradient: "var(--lcars-blue)-to-var(--lcars-orange)"` is two stops.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 160]
  anchors:
    a: [40, 50]
    b: [560, 50]
    c: [40, 110]
    d: [560, 110]
  overlays:
    - id: gradient_line
      type: line
      anchor: a
      attach_to: b
      style:
        width: 10
        gradient:
          stops:
            - offset: 0%
              color: var(--lcars-blue)
            - offset: 100%
              color: var(--lcars-orange)
    - id: pattern_line
      type: line
      anchor: c
      attach_to: d
      style:
        width: 10
        pattern:
          color: var(--lcars-orange)
          size: 8
          opacity: 0.8
```

| Key | Type | Default | Description |
|---|---|---|---|
| `style.gradient` | object / string | - | A left-to-right gradient |
| `style.gradient.stops` | list | - | Each stop has `offset` (`0%` to `100%`) and `color` |
| `style.pattern` | object | - | A dot pattern along the line |
| `style.pattern.color` | colour | the text colour | Dot colour |
| `style.pattern.size` | number | `8` | Spacing of the dots, viewBox units |
| `style.pattern.opacity` | number | `0.5` | Dot opacity |

### Markers

**Markers put a shape on the ends of a line or on each bend: arrows, dots, diamonds, ticks.** `marker_end` is the end at `attach_to`, `marker_start` the end at `anchor`, `marker_mid` every bend.

- A start marker points away from the line, so `arrow` at both ends gives a two-headed arrow.
- `align: edge` puts the back of an arrow or diamond on the end instead of its middle, so the tip is the outermost point and a thick line can't poke past it.
- `fill: match_line` (or `stroke: match_line`) keeps the marker the line's colour as it changes with an entity. Without a `fill` the marker takes the line's colour when drawn.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 200]
  anchors:
    a: [60, 50]
    b: [540, 50]
    c: [60, 150]
    d: [540, 150]
  overlays:
    - id: arrow_line
      type: line
      anchor: a
      attach_to: b
      style:
        color: var(--lcars-orange)
        width: 4
        marker_start:
          type: dot
          size: 16
        marker_end:
          type: arrow
          size: 20
          align: edge
    - id: diamond_line
      type: line
      anchor: c
      attach_to: d
      style:
        color: var(--lcars-blue)
        width: 4
        marker_end:
          type: diamond
          size: 24
          fill: var(--lcars-yellow)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `style.marker_start` | object | - | Marker at the `anchor` end; the same keys as `marker_end` |
| `style.marker_mid` | object | - | Marker on every bend; the same keys as `marker_end` |
| `style.marker_end` | object | - | Marker at the `attach_to` end; keys below |
| `style.marker_end.type` | string | required | `arrow`, `dot`, `diamond`, `line` (a tick across the line) or `rect`. `triangle` and `square` are older names; an unknown type draws a dot |
| `style.marker_end.size` | number | `10` | Size in viewBox units; it doesn't change with the line's width |
| `style.marker_end.fill` | colour | the line's colour | Fill, or `match_line` |
| `style.marker_end.stroke` | colour | `none` | Outline, or `match_line` |
| `style.marker_end.stroke_width` | number | `0` | Outline width |
| `style.marker_end.align` | string | `center` | `center` or `edge` (see above) |
| `style.marker_end.width` | number | `size` | `rect` only: its width |
| `style.marker_end.height` | number | `size` | `rect` only: its height |
| `style.marker_end.filled` | boolean | `false` (`true` for `square`) | `rect` only: filled, or drawn as an outline |

## Dynamic Styling

**A line can take its colour from an entity: green while a link is up, red when it drops.** Give the line its own `entity` and make `style.color` (or `style.fill`) a map of states.

- The keys are the same as on a button: `active`, `inactive`, `unavailable`, `default`, a state name, or a range such as `above:90`. `state_attribute` matches an attribute instead of the state, and `ranges_attribute` compares an attribute against the range keys.
- `style.color` also takes a Jinja2 (`{{ }}`) or JavaScript (`[[[ ]]]`) template, which can read any entity.
- Change the toggles under the card to see both lines follow.

```yaml live controls
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 160]
  anchors:
    a: [40, 50]
    b: [560, 50]
    c: [40, 110]
    d: [560, 110]
  overlays:
    # a map of states, on the line's own entity
    - id: status_line
      type: line
      anchor: a
      attach_to: b
      entity: input_boolean.lcards_test_toggle
      style:
        width: 6
        color:
          active: var(--lcars-green)
          inactive: var(--lcars-red)
        marker_end:
          type: arrow
          size: 20
          fill: match_line
    # a template
    - id: template_line
      type: line
      anchor: c
      attach_to: d
      style:
        width: 6
        color: "{{ 'var(--lcars-blue)' if is_state('input_boolean.lcards_test_doors', 'on') else 'var(--lcars-orange)' }}"
```

| Key | Type | Default | Description |
|---|---|---|---|
| `entity` | string | - | The entity a state map in `style.color` or `style.fill` follows |
| `state_attribute` | string | - | Match this attribute's value against the state keys instead of the state |
| `ranges_attribute` | string | - | Compare this attribute against `above:`, `below:` and `between:` keys |

## Rules Engine Integration

**Rules restyle lines while a condition holds, across many lines at once.** Name a line by `id`, or every line with a tag (`tag:<name>`), under a rule's `apply.overlays`.

- A rule's `style` changes the line in place, without redrawing the card, so running animations carry on. The keys it can change this way are `color`, `width`, `opacity`, `dash_array`, `line_cap` and `fill`.
- Change the toggle under the card to see the rule apply. [Animations and Rules](./animations#rules) has the full story.

```yaml live controls
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 160]
  anchors:
    a: [40, 50]
    b: [560, 50]
    c: [40, 110]
    d: [560, 110]
  overlays:
    - id: power_a
      type: line
      anchor: a
      attach_to: b
      tags: [power]
      style:
        color: var(--lcars-blue)
        width: 6
    - id: power_b
      type: line
      anchor: c
      attach_to: d
      tags: [power]
      style:
        color: var(--lcars-blue)
        width: 6
rules:
  - id: power-alert
    when:
      entity: input_boolean.lcards_test_toggle
      state: "on"
    apply:
      overlays:
        tag:power:
          style:
            color: var(--lcars-alert-red)
            dash_array: "12,6"
```

| Key | Type | Default | Description |
|---|---|---|---|
| `rules` | list | - | Card-level rules; each `apply.overlays` entry names a line by `id` or `tag:<name>`. See [Rules Engine](../../core/rules/) |
| [`id` and `tags`](#anchor-and-attach-to) | | | How a rule finds the line |
