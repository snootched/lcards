# Entity Change Animation Triggers

## Overview

The `on_entity_change` trigger provides simple, declarative entity state monitoring for animations. Unlike rule-based animations, this is designed for straightforward reactive animations on individual overlays without complex condition logic.

## Basic Usage

Add an animation with the `on_entity_change` trigger directly to an overlay:

```yaml
overlays:
  - id: light_icon
    type: icon
    entity: light.bedroom
    animations:
      - trigger: on_entity_change
        entity: light.bedroom
        preset: fade_in
        duration: 300
```

Whenever `light.bedroom` changes state, the fade-in animation plays.

> **Important:** Looping animations triggered by `on_entity_change` do NOT automatically stop when state changes back. They will loop indefinitely. For auto-stopping looping animations, use rule-based animations instead. See [Best Practices](#best-practices) for details.

## State Transition Filtering

Optionally filter animations to specific state transitions using `from_state` and `to_state`:

### On State Example

```yaml
animations:
  - trigger: on_entity_change
    entity: light.bedroom
    to_state: "on"
    preset: glow
    duration: 500
```

Animates only when the light turns ON (any previous state → "on").

### Off State Example

```yaml
animations:
  - trigger: on_entity_change
    entity: light.bedroom
    to_state: "off"
    preset: fade_out
    duration: 300
```

Animates only when the light turns OFF (any previous state → "off").

### Specific Transition Example

```yaml
animations:
  - trigger: on_entity_change
    entity: binary_sensor.door
    from_state: "off"
    to_state: "on"
    preset: alert_pulse
    duration: 200
    loop: 5
```

Animates only when the door opens ("off" → "on"), not when it closes.

## Multiple Animations

You can define multiple `on_entity_change` animations on a single overlay:

```yaml
overlays:
  - id: light_button
    type: button
    entity: light.bedroom
    animations:
      # Animate on turn on
      - trigger: on_entity_change
        entity: light.bedroom
        to_state: "on"
        preset: fade_in
        duration: 300

      # Animate on turn off
      - trigger: on_entity_change
        entity: light.bedroom
        to_state: "off"
        preset: fade_out
        duration: 300
```

## Multi-Entity Monitoring

An overlay can monitor multiple entities:

```yaml
overlays:
  - id: system_status
    type: text
    animations:
      # Monitor CPU temp
      - trigger: on_entity_change
        entity: sensor.cpu_temp
        preset: pulse
        duration: 500

      # Monitor memory usage
      - trigger: on_entity_change
        entity: sensor.memory_usage
        preset: glow
        duration: 800
```

## Integration with Entity Subscription

The `on_entity_change` trigger uses the centralized `CoreSystemsManager.subscribeToEntity()` system:

- **Automatic subscription:** When the overlay initializes
- **Automatic cleanup:** When the overlay is destroyed
- **Efficient:** Shared subscriptions across overlays monitoring the same entity

## Comparison with Rule-Based Animations

| Feature | `on_entity_change` | Rule-Based (`apply.animations`) |
|---------|-------------------|--------------------------------|
| **Scope** | Single overlay | Multi-overlay, cross-card |
| **Targeting** | Implicit (overlay itself) | Explicit (tag, ID, type, pattern) |
| **Conditions** | State transitions only | Full RulesEngine conditions |
| **State Filters** | `from_state`, `to_state` | Any conditional logic |
| **Auto-stop Looping** | No | Yes (on unmatch) |
| **Setup** | Simple, declarative | Requires rule definition |
| **Best For** | Simple reactive animations | Complex multi-entity logic |

## When to Use Each

### Use `on_entity_change` When:

- Monitoring a **single entity** on a **single overlay**
- Need **simple state change** reactions
- Want **minimal configuration**
- Don't need automatic stopping of looping animations

### Use Rule-Based Animations When:

- Need **multi-entity conditions** (AND/OR logic)
- Want **cross-card coordination** (same animation on multiple overlays)
- Need **automatic stop** for looping animations
- Require **complex conditional logic** (templates, time-based, etc.)

## See Also

- [Animation System Overview](./)
- [Rule-Based Animations](rule-based-animations.md)
- [Animation Manager](../subsystems/animation-manager.md)
