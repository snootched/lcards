---
description: "on_entity_change animations: play when an entity changes, gate on from_state and to_state, loop while a condition holds (while), check on load, watch an attribute such as brightness_pct, and follow a value with map_range."
moved_anchors:
  basic-usage: /core/animations/entity-change-triggers#watching-an-entity
  while-condition-keys: /core/animations/entity-change-triggers#lifecycle-conditions-while
  examples: /core/animations/entity-change-triggers
  alert-strobe-while-above-threshold: /core/animations/entity-change-triggers#lifecycle-conditions-while
  entrance-on-state-change-fade-on-return: /core/animations/entity-change-triggers#state-gates-from-state-to-state
  brightness-driven-speed: /core/animations/entity-change-triggers#map-range-with-on-entity-change
  see-also: /core/animations/entity-change-triggers
---

# Entity Change Triggers

`trigger: on_entity_change` plays an animation when an entity changes: once on a change, or for as long as a condition holds. The keys every animation takes are on the [Card Animations](/core/animations#animation-options) page.

## Watching an entity

**`entity` names the entity to watch; the animation plays each time it changes.** Use it for a flash when a door opens, or a bounce when a light switches.

- Any change counts: the state, or only an attribute (a light's brightness while it stays on). Use [state gates](#state-gates-from-state-to-state) or [`while`](#lifecycle-conditions-while) to play on some changes only.
- An entry without gates also plays once when the card loads: see [check_on_load](#check-on-load).
- Without `entity`, a button plays on its own entity's state changes (not its attributes), and `while`, `attribute` and `check_on_load` are not used. Other cards need `entity`.

```yaml live
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
animations:
  # bounces each time the light changes
  - trigger: on_entity_change
    entity: light.workbench
    preset: bounce
    check_on_load: false
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `trigger` | string | `on_load` | `on_entity_change` |
| `entity` | string | - | The entity to watch. Needed for `while`, `attribute` and `check_on_load`; without it a button watches its own entity's state |

## State gates (`from_state` / `to_state`)

**`from_state` and `to_state` play the animation only on one transition: to on, from off, or exactly from off to on.** They decide when it starts; a looping animation they start keeps running.

- Use `to_state` alone when only the new value matters, `from_state` alone when only the old one does, and both for one exact transition.
- An update that keeps the value (an attribute change, a re-sent state) is not a transition, so a gated animation doesn't play again on it.
- Values are compared as text: write `"on"`, `"off"` and numbers in quotes.
- To stop a loop when the value changes back, use [`while`](#lifecycle-conditions-while) instead.

```yaml live
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
animations:
  # slides in from the left when the light turns on
  - trigger: on_entity_change
    entity: light.workbench
    to_state: "on"
    preset: slide
    params:
      from: left
      duration: 400
  # dims and comes back when it turns off
  - trigger: on_entity_change
    entity: light.workbench
    to_state: "off"
    preset: fade
    duration: 300
    loop: 1
    alternate: true
    params:
      from: 1
      to: 0.6
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `from_state` | string | - | Play only when the value changes from this. Never plays on load, which has no previous value |
| `to_state` | string | - | Play only when the value changes to this, or on load when it is already this (see [check_on_load](#check-on-load)) |

## Lifecycle conditions (`while`)

**`while` plays the animation for as long as a condition holds and stops it when it no longer does.** Use it with `loop: true`: a pulse while a light is on, a strobe while a temperature is too high.

- When the condition becomes true the animation starts; when it becomes false it stops, and the card goes back to how it looked before.
- Without `loop: true` it plays once each time the condition becomes true.
- `state` and `not_state` compare text and are used alone: with `state` set, the other keys are not read. The four number bounds combine, so `at_least: 20` with `at_most: 80` is an inclusive range and `above: 20` with `below: 80` an exclusive one. A value that isn't a number (`unavailable`) fails every bound.
- `from_state` and `to_state` on the same entry still gate the start.

```yaml live
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
animations:
  # pulses while the light is on
  - trigger: on_entity_change
    entity: light.workbench
    preset: pulse
    loop: true
    while:
      state: "on"
```

The other conditions, one per block:

```yaml alternatives
# strobe while the temperature is above 80
while:
  above: 80

# while the value is anything but unavailable
while:
  not_state: unavailable

# inclusive range: 20 <= value <= 80
while:
  at_least: 20
  at_most: 80

# exclusive range: 20 < value < 80
while:
  above: 20
  below: 80
```

::: details More about while
- **In the editor:** the animation editor's **Play while...** list has each key, plus **Between (inclusive)** and **Between (exclusive)** for the two ranges.
- **Re-renders:** a card that re-renders while the condition holds (its colour follows the state, say) restarts the animation on the new card, so it keeps running.
- **Rules:** for a condition on several entities, or to animate other cards, use a [rule](/core/animations/rule-based-animations).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `while` | object | - | The condition the animation plays while. Needs `entity` |
| `while.state` | string | - | Play while the value is this |
| `while.not_state` | string | - | Play while the value is not this |
| `while.above` | number | - | Play while the value is more than this |
| `while.at_least` | number | - | Play while the value is this or more |
| `while.below` | number | - | Play while the value is less than this |
| `while.at_most` | number | - | Play while the value is this or less |
| `loop` | boolean / number | the preset's | `true` to keep playing while the condition holds |

## `check_on_load`

**`check_on_load` decides whether the animation looks at the entity when the card loads, or waits for a change.** It is on by default, so the card shows the current state straight away.

- On load, a `while` animation starts if its condition already holds, a `to_state` animation plays if the entity is already in that state, and an entry with no gates plays once. A `from_state` animation never plays on load.
- Set `check_on_load: false` for an animation that should only answer a change: a flash when the light switches, not every time the page opens.
- A re-render of the card is not a load: it doesn't replay the animation.

```yaml live
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
animations:
  # the light is already on, but this waits for the next time it turns on
  - trigger: on_entity_change
    entity: light.workbench
    to_state: "on"
    preset: glow
    loop: 2
    check_on_load: false
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `check_on_load` | boolean | `true` | Look at the entity when the card loads. `false` waits for the next change |

## Attributes

**`attribute` watches one attribute of the entity instead of its state: a light's brightness, a cover's position, a thermostat's action.** It applies to `from_state`, `to_state` and `while` alike.

- `brightness_pct` is a light's brightness as 0–100, worked out from Home Assistant's 0–255 `brightness`. A light that is off has no brightness, so it fails every number bound.
- The animation editor's **Attribute** field lists the chosen entity's attributes, with `brightness_pct` after `brightness`; pick the entity first.

```yaml live controls
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
animations:
  # glows while the light is more than half bright
  - trigger: on_entity_change
    entity: light.workbench
    attribute: brightness_pct
    preset: glow
    loop: true
    while:
      above: 50
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `attribute` | string | the state | The attribute to compare. `brightness_pct` gives a light's brightness as 0–100 |

## `map_range` with `on_entity_change`

**An entity can set an animation's numbers as well as start it: the brighter the light, the faster it pulses.** Write a [`map_range`](/core/animations/timing-and-easing#map-range-descriptors) in place of `duration`, `delay` or a `params` value.

- On a looping animation, a `map_range` in `duration` keeps following the entity while it plays. Other values are read when the animation starts.

```yaml live controls
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
animations:
  # pulses while the light is on: 2 s at its dimmest, 0.4 s at full brightness
  - trigger: on_entity_change
    entity: light.workbench
    preset: pulse
    loop: true
    while:
      state: "on"
    duration:
      map_range:
        entity: light.workbench
        attribute: brightness_pct
        input: [0, 100]
        output: [2000, 400]
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| [map_range keys](/core/animations/timing-and-easing#map-range-descriptors) | | | `entity`, `attribute`, `input`, `output`, `clamp` |
