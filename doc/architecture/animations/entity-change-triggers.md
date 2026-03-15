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

> **⚠️ Important:** Looping animations triggered by `on_entity_change` do NOT automatically stop when state changes back. They will loop indefinitely. For auto-stopping looping animations, use rule-based animations instead. See [Best Practices](#best-practices) for details.

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

## Use Cases

### 1. Visual Feedback on State Changes

```yaml
overlays:
  - id: fan_icon
    type: icon
    entity: fan.bedroom
    animations:
      - trigger: on_entity_change
        entity: fan.bedroom
        to_state: "on"
        preset: spin
        loop: true
        duration: 2000
```

**Note:** Looping animations triggered by `on_entity_change` will loop indefinitely. Unlike rule-based animations, they do NOT automatically stop when state changes back.

### 2. Button Press Feedback

```yaml
overlays:
  - id: toggle_button
    type: button
    entity: switch.lights
    animations:
      - trigger: on_entity_change
        entity: switch.lights
        preset: flash
        duration: 200
```

### 3. Sensor Value Changes

```yaml
overlays:
  - id: temp_display
    type: text
    entity: sensor.temperature
    animations:
      - trigger: on_entity_change
        entity: sensor.temperature
        preset: highlight
        duration: 400
```

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

## Examples

### Example 1: Door Open Alert

```yaml
overlays:
  - id: door_status
    type: text
    text: "FRONT DOOR"
    animations:
      - trigger: on_entity_change
        entity: binary_sensor.front_door
        from_state: "off"
        to_state: "on"
        preset: alert_pulse
        duration: 500
        loop: 3  # Flash 3 times when door opens
```

### Example 2: Light Dimming Effect

```yaml
overlays:
  - id: light_widget
    type: icon
    entity: light.bedroom
    animations:
      # Brightness increase
      - trigger: on_entity_change
        entity: light.bedroom
        to_state: "on"
        preset: glow
        duration: 600

      # Brightness decrease
      - trigger: on_entity_change
        entity: light.bedroom
        to_state: "off"
        preset: dim
        duration: 800
```

### Example 3: Multi-Sensor Dashboard

```yaml
overlays:
  - id: cpu_temp
    type: gauge
    entity: sensor.cpu_temp
    animations:
      - trigger: on_entity_change
        entity: sensor.cpu_temp
        preset: pulse
        duration: 400

  - id: memory_usage
    type: gauge
    entity: sensor.memory_usage
    animations:
      - trigger: on_entity_change
        entity: sensor.memory_usage
        preset: pulse
        duration: 400

  - id: disk_usage
    type: gauge
    entity: sensor.disk_usage
    animations:
      - trigger: on_entity_change
        entity: sensor.disk_usage
        preset: pulse
        duration: 400
```

Each gauge pulses independently when its sensor updates.

## Implementation Details

### Subscription Lifecycle

1. **Overlay Initialization:**
   - TriggerManager registers `on_entity_change` animations
   - Calls `_setupEntityChangeListeners()`
   - Subscribes via `CoreSystemsManager.subscribeToEntity()`

2. **State Change Event:**
   - CoreSystemsManager detects entity state change
   - Triggers subscribed callbacks with `(newState, oldState)`
   - TriggerManager filters by `from_state`/`to_state`
   - Matching animations execute via `AnimationManager.playAnimation()`

3. **Overlay Destruction:**
   - TriggerManager.destroy() called
   - Entity subscriptions cleaned up
   - No memory leaks

### State Filtering Logic

```javascript
// Pseudocode
if (animation.from_state && oldState?.state !== animation.from_state) {
  return; // Skip - from_state doesn't match
}

if (animation.to_state && newState?.state !== animation.to_state) {
  return; // Skip - to_state doesn't match
}

// Both filters passed (or not specified) - play animation
playAnimation(animation);
```

## Best Practices

### 1. Use State Filters to Avoid Unnecessary Animations

```yaml
# Good: Only animate on specific transition
animations:
  - trigger: on_entity_change
    entity: light.bedroom
    to_state: "on"
    preset: glow

# Avoid: Animates on EVERY state change (even brightness adjustments)
animations:
  - trigger: on_entity_change
    entity: light.bedroom
    preset: glow
```

### 2. Combine with Other Triggers

```yaml
overlays:
  - id: button
    type: button
    entity: switch.lights
    animations:
      # Animate on tap
      - trigger: on_tap
        preset: press
        duration: 150

      # Animate on state change (from external sources)
      - trigger: on_entity_change
        entity: switch.lights
        preset: flash
        duration: 200
```

### 3. Be Careful with Looping Animations

```yaml
# ⚠️ CAUTION: Will loop forever after first state change
animations:
  - trigger: on_entity_change
    entity: sensor.temperature
    preset: spin
    loop: true

# ✅ BETTER: Use rule-based for auto-stop
rules:
  - id: temp_high
    when:
      entity: sensor.temperature
      above: 75
    apply:
      animations:
        - overlay: temp_display
          preset: spin
          loop: true  # Stops when temp drops below 75
```

## Troubleshooting

### Animation Not Triggering

1. **Verify entity ID:** Check that the entity exists in HASS
2. **Check state filters:** Ensure `from_state`/`to_state` match actual states
3. **Enable logging:**
   ```javascript
   window.lcards.setGlobalLogLevel('debug')
   ```
4. **Inspect state changes:** Look for "Entity change detected" logs

### Animation Triggers on Wrong State

- **Review state values:** State values are strings (use `"on"`, `"off"`, not `true`/`false`)
- **Check old state:** `from_state` compares against the OLD state
- **Check new state:** `to_state` compares against the NEW state

### Memory Leaks

If overlays are frequently created/destroyed, verify cleanup:

```javascript
// Check active subscriptions
console.log(window.lcards.core.systemsManager._entitySubscriptions);
```

Subscriptions should be cleaned up when overlays are destroyed.
