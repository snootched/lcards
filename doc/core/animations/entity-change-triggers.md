# Entity Change Triggers

The `on_entity_change` trigger fires an animation whenever a watched entity's state (or attribute) changes. This page covers the full set of options available for entity-based triggering.

---

## Basic Usage

```yaml
animations:
  - trigger: on_entity_change
    entity: binary_sensor.motion
    preset: pulse
    to_state: "on"
```

If `entity` is omitted, the card's own entity is watched.

---

## State Gates (`from_state` / `to_state`)

These are **fire-and-forget gates** — they filter *when* the animation starts but do not stop a looping animation once it has begun.

```yaml
# Only fires when transitioning from "off" → "on"
- trigger: on_entity_change
  entity: light.kitchen
  from_state: "off"
  to_state: "on"
  preset: bounce
```

Use `to_state` alone when you only care about the destination. Use `from_state` alone when you only care about the origin. Combine both for exact transition matching.

> To stop a loop when the entity state changes, use `while` instead.

---

## Lifecycle Conditions (`while`)

`while` turns an animation into a **lifecycle-managed loop** — it starts when the condition becomes true and stops automatically when it becomes false. Requires `loop: true`.

```yaml
# Pulse while the light is on; stop when it turns off
- trigger: on_entity_change
  entity: light.kitchen
  preset: pulse
  loop: true
  while:
    state: 'on'
  check_on_load: true
```

### `while` condition keys

Use exactly one key:

| Key | Meaning |
|-----|---------|
| `state` | entity value equals this string |
| `not_state` | entity value does NOT equal this string |
| `above` | numeric value strictly greater than threshold |
| `at_least` | numeric value greater than or equal to threshold |
| `below` | numeric value strictly less than threshold |
| `at_most` | numeric value less than or equal to threshold |

### `check_on_load`

| Value | Behaviour |
|-------|-----------|
| `true` (default) | Evaluate the condition immediately when the card loads. If already met, start the animation straight away. |
| `false` | Only react to state transitions that occur *after* load. |

Set `check_on_load: false` when you want the animation to appear reactive (responding to changes) rather than presenting its current state on page load.

---

## Attributes

Use `attribute` to watch a specific entity attribute instead of the main state:

```yaml
- trigger: on_entity_change
  entity: light.living_room
  attribute: brightness_pct   # 0–100, computed from raw 0–255 brightness
  while:
    above: 50
  preset: glow
  loop: true
```

`brightness_pct` is a special computed attribute that converts the raw HA brightness value (0–255) to a 0–100 percentage for easier threshold comparisons.

`attribute` applies to `from_state`, `to_state`, and `while` alike.

---

## `map_range` with `on_entity_change`

Entity values can be mapped to animation parameters dynamically:

```yaml
- trigger: on_entity_change
  entity: sensor.wind_speed
  preset: rotate
  loop: true
  params:
    speed:
      map_range:
        entity: sensor.wind_speed
        input: [0, 50]
        output: [2000, 200]   # faster rotation when windier
        clamp: true
```

See the [Animations overview](../animations.md#map_range-descriptors) for the full `map_range` reference.

---

## Examples

### Alert strobe while above threshold

```yaml
- trigger: on_entity_change
  entity: sensor.cpu_temp
  while:
    above: 80
  preset: strobe
  loop: true
  check_on_load: true
```

### Entrance on state change, fade on return

```yaml
- trigger: on_entity_change
  entity: binary_sensor.front_door
  to_state: "on"
  preset: slide
  params:
    from: left
    duration: 400

- trigger: on_entity_change
  entity: binary_sensor.front_door
  to_state: "off"
  preset: fade
  params:
    from: 1
    to: 0.6
  duration: 300
  loop: 1
  alternate: true
```

### Brightness-driven speed

```yaml
- trigger: on_entity_change
  entity: light.desk
  attribute: brightness_pct
  preset: pulse
  loop: true
  while:
    above: 0
  params:
    max_scale:
      map_range:
        entity: light.desk
        attribute: brightness_pct
        input: [0, 100]
        output: [1.02, 1.2]
        clamp: true
```

---

## See Also

- [Animations overview](../animations.md) — structure, options, easing
- [Preset Reference](preset-reference.md) — all available presets
- [Rule-based Animations](rule-based-animations.md) — entity conditions across multiple cards via the Rules Engine
