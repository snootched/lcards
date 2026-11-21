---
description: "Animation triggers: play an animation on a tap, double tap or hold, on hover, once on load, each time a card appears (on_show), on an entity change or on a data source update."
---

# Triggers

`trigger` on an animation entry says when it plays. This page covers every trigger except `on_entity_change`, which has its own page: [Entity Change Triggers](/core/animations/entity-change-triggers).

## trigger

**One trigger per entry; give a card several entries to react to several things.** Leave `trigger` out and the entry plays when the card loads.

- `on_state_change`, `on_redraw` and `on_exit` are not triggers (the config checker rejects them, and they never fire). For state changes use `on_entity_change`.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: Triggers
    show: true
animations:
  # once when the card loads
  - trigger: on_load
    preset: fade
    params:
      from: 0
      to: 1
  # on every tap
  - trigger: on_tap
    preset: bounce
  # on a long press
  - trigger: on_hold
    preset: shake
```

| Trigger | Plays |
|---------|-------|
| `on_load` | Once, when the card first renders |
| `on_show` | Each time the card appears: when its view opens, when a visibility condition shows it, or when you come back from another view |
| `on_tap` | When the card is tapped or clicked |
| `on_double_tap` | When the card is double-tapped |
| `on_hold` | On a long press |
| `on_hover` | While the mouse is over the card |
| `on_leave` | When the mouse leaves the card |
| `on_entity_change` | When a watched entity changes: see [Entity Change Triggers](/core/animations/entity-change-triggers) |
| `on_datasource_change` | When a [data source](/core/datasources/) updates: see [on_datasource_change](#on-datasource-change) |

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `trigger` | string | `on_load` | When the entry plays: one of the triggers above |

## Taps and holds

**`on_tap`, `on_double_tap` and `on_hold` play when you touch the card, alongside its tap, double-tap and hold actions.** Use them for feedback that the press landed.

- The animation and the action both happen: a tap that toggles a light also plays the `on_tap` animation.
- On a slider, tap and hold animations sit on its border caps, where the actions are. On a data grid a tap anywhere on the grid plays them, and [`tap-ripple`](/core/animations/preset-reference#tap-ripple) starts from the tap point.

```yaml live
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
hold_action:
  action: more-info
animations:
  # grows and shrinks back once
  - trigger: on_tap
    preset: pulse
    loop: 1
    duration: 200
  - trigger: on_hold
    preset: shake
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `trigger` | string | `on_load` | `on_tap`, `on_double_tap` or `on_hold` |

## Hover

**`on_hover` plays while the mouse is over the card, and `on_leave` when it moves off.** A looping hover animation, such as a glow, stops as soon as the mouse leaves.

- Hover only works with a mouse or trackpad: on a touch screen these triggers never fire.
- Leaving the card first stops the `on_hover` animations, then plays the `on_leave` ones.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: Hover me
    show: true
animations:
  # glows while the mouse is over the card
  - trigger: on_hover
    preset: glow
    params:
      color: var(--lcars-orange)
      blur_max: 12
  # a short fade when it leaves
  - trigger: on_leave
    preset: fade
    duration: 300
    loop: 1
    alternate: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `trigger` | string | `on_load` | `on_hover` or `on_leave` |

## Entrance animations with `on_show`

**`on_show` plays each time the card is put on the page: when its view opens, when a visibility condition shows it, or when you come back from another view.** Use it, not `on_load`, for entrance animations.

- `on_load` plays once per card. Home Assistant builds a card hidden by a `visibility` condition and only attaches it when the condition is met, so an `on_load` animation has already run, out of sight, by the time it appears.
- `on_show` does not play again while the card stays on the page: state changes and re-renders don't replay it.
- Give several cards the same `on_show` animation with rising `delay` values to build a view up piece by piece when it opens.

```yaml live
type: custom:lcards-button
preset: filled
text:
  name:
    content: Perimeter Armed
    show: true
animations:
  # slides in from the left and fades in, each time the card appears
  - trigger: on_show
    preset: slide
    params:
      from: left
      distance: 120
      duration: 600
  - trigger: on_show
    preset: fade
    params:
      from: 0
      to: 1
      duration: 600
```

::: details More about on_show
- **With a visibility condition:** add a `visibility` list to the card (here, a condition on `alarm_control_panel.home` with `state: armed_away`) and the entrance plays every time the alarm is armed. The docs show the card without one.
- **A re-render while it plays:** a card that re-renders just after it appears plays its entrance again from the start, so it is not cut short.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `trigger` | string | `on_load` | `on_show` plays each time the card appears; `on_load` once, when it first renders |

## on_datasource_change

**`on_datasource_change` plays each time a [data source](/core/datasources/) on the card gets a new value.** Use it to flash a reading when it updates.

- `datasource` names the source from the card's `data_sources`. The animation plays on every update, whatever the value.
- The data source must exist when the card loads; one that doesn't is skipped with a warning in the browser console.
- Shown as the animation entry only: it needs a data source defined on the card.

```yaml
animations:
  - trigger: on_datasource_change
    datasource: outdoor_temp
    preset: blink
    loop: 1
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `datasource` | string | required | The data source to watch, by name. A name with a dot (`outdoor_temp.rolling_avg`) still watches the whole source |
