---
description: "MSD control overlay: put any Home Assistant card on the MSD canvas, place it by coordinates, anchor or another control, and connect lines to its attachment points."
moved_anchors:
  quick-start: /cards/msd/control-overlay#card
  properties: /cards/msd/control-overlay#card
  examples: /cards/msd/control-overlay#card
  built-in-home-assistant-card: /cards/msd/control-overlay#card
  lcards-card-with-action: /cards/msd/control-overlay#card
  custom-card: /cards/msd/control-overlay#card
  entity-list: /cards/msd/control-overlay#card
  connecting-two-controls-with-a-line: /cards/msd/control-overlay#attachment-points
---

# Control Overlay

`type: control`

**A control puts a real card on the MSD canvas: an LCARdS button, a Home Assistant thermostat, a custom card.** The card works as it does anywhere else (taps, more-info, live states); the control decides where it sits and how big it is, and gives lines nine points to connect to.

- Sizes and positions are in viewBox units, the same coordinates as the background, so a control stays on its part of the blueprint however wide the card is drawn.
- Controls are drawn over lines and shapes, so a line can run under a card and seem to stop at its edge.

## card

**`card` is the embedded card's own config, exactly as you would write it on a dashboard.** `id` names the control, so lines, rules and other controls can refer to it.

- Any card works: LCARdS cards, Home Assistant's own cards (`thermostat`, `entities`, `sensor`) and custom cards from HACS. The card fills the control's `size`.
- The card's own `entity`, actions and styles stay on the card. The control itself has no entity.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 200]
  overlays:
    - id: warp_control
      type: control
      position: [160, 100]
      size: [240, 70]
      tags: [engineering]
      card:
        type: custom:lcards-button
        entity: switch.warp_drive
        preset: lozenge
        text:
          label:
            content: WARP DRIVE
            show: true
        tap_action:
          action: toggle
    - id: impulse_control
      type: control
      position: [440, 100]
      size: [240, 70]
      tags: [engineering]
      card:
        type: custom:lcards-button
        entity: light.impulse_deck
        preset: lozenge
        text:
          label:
            content: IMPULSE
            show: true
        tap_action:
          action: toggle
```

::: details More about card
- **Home Assistant and custom cards:** they render on a dashboard but not in these docs (the docs have no Home Assistant frontend), so here is one as plain YAML:

  ```yaml
  - id: climate_control
    type: control
    position: sickbay
    size: [220, 130]
    card:
      type: thermostat
      entity: climate.sickbay
  ```

- **Entities the control cannot see:** a control updates its card when an entity named in `card` changes. If the card depends on others (a card that finds its entities by itself), list them in [`triggers_update`](#triggers-update).
- **Animations** on a control animate its frame; see [Animations and Rules](./animations).
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `id` | string | required | Unique id: the name lines, rules and other controls use |
| `type` | string | required | `control` |
| `card` | object | required | The embedded card's config |
| `tags` | list | - | Tags for rules: the selector `tag:<name>` matches every overlay with that tag |
| `z_index` | number | `200` | Stacking order among overlays; higher is in front. Lines default to `100` and shapes to `50`, so controls cover both |
| `locked` | boolean | `false` | MSD Studio only: the control can't be dragged or resized on the canvas (it stays editable in the list). No effect on the dashboard |
| `animations` | list | - | Animations on the control's frame; see [Animations and Rules](./animations) |

## position

**`position` says where the control goes and `attachment` says which point of the control lands there.** By default the control's centre sits on its position.

- `position` takes `[x, y]`, the name of an anchor (see [Background and Anchors](./background#anchors)), or another control's `id`.
- `attachment: top-left` makes `position` the control's top-left corner, which is easier when you line controls up in a column. Any of the nine [attachment points](#attachment-points) works.
- Placed on another control, a control centres on it. `position_side` picks a different point of that control, for example `right` to start beside it.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 220]
  anchors:
    bridge: [150, 110]
  overlays:
    # centred on a named anchor
    - id: bridge_ctl
      type: control
      position: bridge
      size: [200, 60]
      card:
        type: custom:lcards-button
        entity: light.bridge
        preset: lozenge
        text:
          label:
            content: BRIDGE
            show: true
    # its left edge on the bridge control's right edge
    - id: helm_ctl
      type: control
      position: bridge_ctl
      position_side: right
      attachment: left
      size: [160, 60]
      card:
        type: custom:lcards-button
        entity: light.helm
        preset: lozenge
        text:
          label:
            content: HELM
            show: true
    # top-left corner at [400, 150]
    - id: ops_ctl
      type: control
      position: [400, 150]
      attachment: top-left
      size: [180, 50]
      card:
        type: custom:lcards-button
        entity: light.ops
        preset: lozenge
        text:
          label:
            content: OPS
            show: true
```

::: details More about position
- **`anchor` on a control** is an older name for `position`. It still works, but `position` wins when both are set; use `position`.
- **Order matters for `position_side`:** the control you place against must come earlier in `overlays`. If it isn't ready yet, the control falls back to that control's centre.
- **No size:** a control without `size` is drawn 100 by 100.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `position` | `[x, y]` / string | required | Where the control goes: `[x, y]` in viewBox units, an anchor name, or another control's `id` |
| `size` | `[width, height]` | `[100, 100]` | Size in viewBox units |
| `attachment` | string | `center` | Which point of this control sits on `position`: one of the nine [attachment points](#attachment-points) |
| `position_side` | string | `center` | When `position` is another control's `id`: which of that control's nine points to use. Ignored for an anchor or `[x, y]` |

## Attachment Points

**Every control has nine named points that lines connect to: the middle of each edge, each corner and the centre.** A line names the control in `anchor` or `attach_to` and picks the point with `anchor_side` or `attach_side`.

- Left out, the side is the one nearest the line's other end. Set it when you want a particular side.
- The [line overlay](./line-overlay#attachment-points) page covers sides, gaps and how a side also sets the direction a line leaves in.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 260]
  overlays:
    - id: sensor_card
      type: control
      position: [150, 60]
      size: [200, 60]
      card:
        type: custom:lcards-button
        entity: sensor.warp_speed
        preset: lozenge
        text:
          label:
            content: WARP SPEED
            show: true
    - id: graph_card
      type: control
      position: [450, 200]
      size: [200, 60]
      card:
        type: custom:lcards-button
        entity: sensor.shield_strength
        preset: lozenge
        text:
          label:
            content: SHIELDS
            show: true
    # from the bottom of one control to the left of the other
    - id: link
      type: line
      anchor: sensor_card
      anchor_side: bottom
      attach_to: graph_card
      attach_side: left
      style:
        color: var(--lcars-orange)
        width: 4
```

| Point | Where |
|---|---|
| `top` | Middle of the top edge |
| `bottom` | Middle of the bottom edge |
| `left` | Middle of the left edge |
| `right` | Middle of the right edge |
| `center` | The centre |
| `top-left` | Top-left corner |
| `top-right` | Top-right corner |
| `bottom-left` | Bottom-left corner |
| `bottom-right` | Bottom-right corner |

## obstacle

**`obstacle: true` makes routed lines go round the control instead of across it.** Use it for a card that sits between two things a line joins.

- Only lines routed `auto` (the default), `smart` or `grid` avoid obstacles; `direct`, `angled`, `manhattan` and `manual` lines keep their shape. See [Line Routing](./routing#obstacles).
- `clearance` on the line, or in [`routing`](./routing#routing), keeps lines a set distance from the box.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 240]
  anchors:
    west: [40, 120]
    east: [560, 120]
  overlays:
    - id: core_status
      type: control
      position: [300, 120]
      size: [200, 70]
      obstacle: true
      card:
        type: custom:lcards-button
        entity: switch.warp_core
        preset: lozenge
        text:
          label:
            content: WARP CORE
            show: true
    - id: bypass
      type: line
      anchor: west
      attach_to: east
      style:
        color: var(--lcars-blue)
        width: 4
```

| Key | Type | Default | Description |
|---|---|---|---|
| `obstacle` | boolean | `false` | Lines routed `auto`, `smart` or `grid` go round this control's box |

## triggers_update

**`triggers_update` lists entities the embedded card depends on that LCARdS can't see in its config.** A control only refreshes its card when an entity it knows about changes, which keeps a busy MSD fast.

- LCARdS finds the entities named in `card` by itself. You only need this for a card that picks its entities another way, such as an alert card that finds every entity of a device class.
- `triggers_update: all` refreshes this control on every Home Assistant update. Use it only when the entities can't be listed. `msd.triggers_update: all` does the same for every control on the card and is best avoided.

```yaml live
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 160]
  overlays:
    - id: alerts
      type: control
      position: [300, 80]
      size: [300, 70]
      triggers_update:
        - binary_sensor.hull_breach
        - binary_sensor.core_breach
      card:
        type: custom:lcards-button
        entity: switch.red_alert
        preset: lozenge
        text:
          label:
            content: ALERTS
            show: true
```

| Key | Type | Default | Description |
|---|---|---|---|
| `triggers_update` | list / `all` | - | Extra entity ids that refresh this control, or `all` for every update |

## Rules Engine Integration

**Rules can change a control while a condition holds: dim it, hide it, flag it.** Name the control by `id` (or every control with a tag, `tag:<name>`) under the rule's `apply.overlays`.

- A rule's `style` on a control is set as CSS on the control's frame, so frame-wide properties such as `opacity` work. The embedded card keeps its own colours.
- Change the switch under the card to see the rule apply. [Animations and Rules](./animations#rules) has the full story, including animations a rule starts and stops.

```yaml live controls
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 160]
  overlays:
    - id: warp_core
      type: control
      position: [300, 80]
      size: [260, 70]
      tags: [engineering]
      card:
        type: custom:lcards-button
        entity: input_boolean.lcards_test_toggle
        preset: lozenge
        text:
          label:
            content: WARP CORE
            show: true
rules:
  - id: warp-offline
    when:
      entity: input_boolean.lcards_test_toggle
      state: "off"
    apply:
      overlays:
        warp_core:
          style:
            opacity: 0.3
```

| Key | Type | Default | Description |
|---|---|---|---|
| `rules` | list | - | Card-level rules; each `apply.overlays` entry names a control by `id` or `tag:<name>`. See [Rules Engine](../../core/rules/) |
| [`id` and `tags`](#card) | | | How a rule finds the control |
