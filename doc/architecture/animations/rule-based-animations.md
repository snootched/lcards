# Rule-Based Animation Triggering

## Overview

Rule-based animations allow you to trigger animations across multiple overlays when RulesEngine conditions are met. This eliminates the need to duplicate condition logic in animation configs and enables powerful cross-card animation coordination.

## Basic Usage

Add an `animations` array to a rule's `apply` section:

```yaml
rules:
  - id: high_temp_alert
    when:
      entity: sensor.cpu_temp
      above: 75
    apply:
      animations:
        - tag: temperature_widgets
          preset: alert_pulse
          duration: 1000
          loop: true
```

## Animation Targeting

Rule animations support multiple targeting strategies:

### 1. Direct Overlay ID

Target a specific overlay by ID:

```yaml
animations:
  - overlay: temp_display_1
    preset: fade_in
    duration: 500
```

### 2. Tag-Based Targeting

Target all overlays with a specific tag (recommended for cross-card coordination):

```yaml
animations:
  - tag: critical_alert
    preset: alert_flash
    duration: 300
    loop: true
```

**Example:** Tag overlays in multiple cards with `critical_alert`, and a single rule will animate all of them.

### 3. Type-Based Targeting

Target all overlays of a specific type:

```yaml
animations:
  - type: gauge
    preset: pulse
    duration: 800
```

### 4. Pattern-Based Targeting

Use regex patterns to match overlay IDs:

```yaml
animations:
  - pattern: "^temp_.*"
    preset: glow
    duration: 600
```

## Lifecycle Management

### Automatic Start on Match

Animations execute when their rule transitions from unmatched to matched:

```yaml
rules:
  - id: door_open
    when:
      entity: binary_sensor.front_door
      state: "on"
    apply:
      animations:
        - tag: door_widgets
          preset: warning_pulse
          loop: true
```

When `binary_sensor.front_door` changes to "on", all overlays tagged with `door_widgets` start the pulsing animation.

### Automatic Stop on Unmatch

Looping animations automatically stop when the rule transitions from matched to unmatched:

```yaml
# Rule matches: Animations start
# Rule unmatches: Looping animations stop automatically
```

**No manual cleanup needed!** The RulesEngine tracks which animations are active for each rule and stops them when conditions no longer match.

## Priority System

When multiple rules target the same overlay, the highest priority rule's animations take precedence:

```yaml
rules:
  # Warning level
  - id: temp_warning
    priority: 1
    when:
      entity: sensor.cpu_temp
      above: 70
    apply:
      animations:
        - tag: temp_display
          preset: pulse
          duration: 1500
          loop: true

  # Critical level (higher priority overrides warning)
  - id: temp_critical
    priority: 10
    when:
      entity: sensor.cpu_temp
      above: 85
    apply:
      animations:
        - tag: temp_display
          preset: alert_flash
          duration: 300
          loop: true
```

**Behavior:**
- 70-85°F: Slow pulse (warning)
- 85°F+: Fast flash (critical rule overrides warning)
- Below 70°F: All animations stop

## Cross-Card Coordination

Rule-based animations enable powerful multi-card coordination through tags:

### Example: Multi-Card Temperature Alert

**Bridge MSD Card:**
```yaml
type: custom:lcards-msd
id: bridge
overlays:
  - id: cpu_temp_display
    type: text
    tags: [temp_widget]
    text: "{entity.state}°F"
    entity: sensor.cpu_temp
```

**Engineering MSD Card:**
```yaml
type: custom:lcards-msd
id: engineering
overlays:
  - id: cpu_gauge
    type: gauge
    tags: [temp_widget]
    entity: sensor.cpu_temp
```

**Shared Rule (defined in either card):**
```yaml
rules:
  - id: high_temp_alert
    when:
      entity: sensor.cpu_temp
      above: 75
    apply:
      animations:
        - tag: temp_widget
          preset: alert_flash
          duration: 500
          loop: true
```

**Result:** When temperature exceeds 75°F, BOTH the text display in the bridge card AND the gauge in the engineering card start flashing. When temperature drops below 75°F, both stop flashing.

## Animation Parameters

All standard animation parameters are supported:

```yaml
animations:
  - tag: my_target
    preset: fade_in           # Required: Animation preset name
    duration: 1000           # Optional: Duration in milliseconds
    delay: 100               # Optional: Delay before starting
    easing: easeInOutQuad    # Optional: Easing function
    loop: true               # Optional: Loop animation (stops on unmatch)
    direction: alternate     # Optional: Animation direction
```

## Complex Conditions

Rule-based animations leverage the full power of the RulesEngine:

### Multi-Entity Conditions

```yaml
rules:
  - id: system_critical
    when:
      all:
        - entity: sensor.cpu_temp
          above: 80
        - entity: sensor.memory_usage
          above: 90
    apply:
      animations:
        - tag: system_status
          preset: alert_flash
          duration: 300
          loop: true
```

### Time-Based Conditions

```yaml
rules:
  - id: nighttime_motion
    when:
      all:
        - entity: binary_sensor.motion
          state: "on"
        - sun: below_horizon
    apply:
      animations:
        - tag: motion_indicators
          preset: glow
          duration: 800
```

### Template Conditions

```yaml
rules:
  - id: complex_alert
    when:
      template: "{{ states('sensor.temp') | float > 75 and is_state('switch.fan', 'off') }}"
    apply:
      animations:
        - tag: alert_overlays
          preset: urgent_flash
          loop: true
```

## Best Practices

### 1. Use Tags for Flexibility

Tag overlays semantically to enable flexible targeting:

```yaml
# Good: Semantic tags
tags: [temperature, critical, propulsion]

# Avoid: Overly specific IDs
id: bridge_main_upper_left_temp_gauge_3
```

### 2. Set Appropriate Priorities

Use priority levels to create animation hierarchies:

```yaml
# Info level: priority 1
# Warning level: priority 5
# Critical level: priority 10
```

### 3. Prefer Looping for State Indicators

Use `loop: true` for animations that indicate an ongoing state:

```yaml
# Good: Loop while door is open
animations:
  - tag: door_status
    preset: pulse
    loop: true

# Avoid: One-shot animation (will only play once on transition)
animations:
  - tag: door_status
    preset: pulse
    loop: false
```

### 4. Consider Performance

Be mindful of the number of simultaneous looping animations:

```yaml
# Good: Targeted animation
animations:
  - tag: critical_widgets  # Only 2-3 overlays
    preset: flash
    loop: true

# Caution: May impact performance
animations:
  - type: text  # Could be 50+ overlays
    preset: complex_animation
    loop: true
```

## Comparison with Direct Triggers

| Feature | Rule-Based | Direct Trigger (`on_entity_change`) |
|---------|-----------|-------------------------------------|
| Scope | Multi-overlay, cross-card | Single overlay |
| Conditions | Full RulesEngine power | Simple state transitions |
| Targeting | ID, tag, type, pattern | N/A (implicit) |
| Automatic Stop | Yes (on unmatch) | No |
| Use Case | Complex logic, coordination | Simple reactive animations |

## Troubleshooting

### Animations Not Triggering

1. **Check overlay registry:** Ensure overlays are registered with SystemsManager
2. **Verify targeting:** Use browser console to inspect overlay metadata
3. **Check rule evaluation:** Look for rule match logs in browser console
4. **Enable debug logging:**
   ```javascript
   window.lcards.setGlobalLogLevel('debug')
   ```

### Animations Not Stopping

1. **Verify loop parameter:** Non-looping animations won't be tracked for stopping
2. **Check rule unmatch:** Ensure the rule actually unmatches when expected
3. **Review logs:** Look for "Stopping animations for rule" messages

### Cross-Card Animations Not Working

1. **Confirm shared tags:** Verify both cards use the same tag value
2. **Check initialization order:** Ensure both cards are initialized before rule evaluation
3. **Verify SystemsManager:** Confirm both cards are using the global Core singleton

## Related Documentation

- [Entity Change Triggers](./entity-change-triggers.md) - Simple entity state monitoring
- [Datasource Buffers](./datasource-buffers.md) - Datasource structure reference
- [Animation System Overview](../subsystems/animation-system.md) - Complete animation architecture
- [RulesEngine Reference](../subsystems/rules-engine.md) - Rule condition syntax

## Reactive Animation Parameters (`map_range`)

Animation parameter values can be **proportionally mapped** from a live entity value using a `map_range` descriptor. This allows continuously reactive animations — for example, making marching ants move faster as power flow increases, or shifting a line color from green to red as a temperature rises.

### Numeric Parameter Mapping

Map a numeric entity value to a numeric animation parameter:

```yaml
rules:
  - id: power_flow_reactive
    when:
      entity: sensor.grid_power
      above: 0
    apply:
      animations:
        - tag: power_line
          preset: march
          loop: true
          params:
            speed:
              map_range:
                entity: sensor.grid_power
                input: [0, 5000]     # entity value range (watts)
                output: [8, 0.5]     # animation speed range (seconds — lower = faster)
                clamp: true          # optional, default: true
```

When `sensor.grid_power` is `0W`, `speed` resolves to `8` (slow). When it reaches `5000W`, `speed` resolves to `0.5` (fast). Values are linearly interpolated.

### Color Interpolation

Map a numeric entity value to a hex color string:

```yaml
rules:
  - id: temp_color_reactive
    when:
      entity: sensor.cpu_temp
      above: 0
    apply:
      animations:
        - tag: temp_line
          preset: march
          loop: true
          params:
            color:
              map_range:
                entity: sensor.cpu_temp
                input: [20, 90]              # temperature range (°C)
                output: ['#00ff88', '#ff4400']  # green → red
                clamp: true
```

Only 6-digit hex colors (`#rrggbb`) are supported for color interpolation.

### Combining Multiple Mapped Params

Multiple params can be mapped simultaneously:

```yaml
params:
  speed:
    map_range:
      entity: sensor.grid_power
      input: [0, 5000]
      output: [8, 0.5]
  color:
    map_range:
      entity: sensor.grid_power
      input: [0, 5000]
      output: ['#00ff88', '#ff4400']
```

### Top-Level Field Mapping

`duration` and `delay` also accept `map_range` descriptors:

```yaml
- tag: my_overlay
  preset: pulse
  duration:
    map_range:
      entity: sensor.cpu_load
      input: [0, 100]
      output: [2000, 300]
  loop: true
```

### `map_range` Descriptor Fields

| Field | Required | Description |
|-------|----------|-------------|
| `entity` | ✅ | Home Assistant entity ID to read value from |
| `input` | ✅ | `[inMin, inMax]` — input value range |
| `output` | ✅ | `[outMin, outMax]` — numeric or `['#hex', '#hex']` for colors |
| `attribute` | ❌ | Entity attribute to use instead of `state` |
| `clamp` | ❌ | Clamp output to range bounds (default: `true`) |

### Relationship to `map_range_cond`

`map_range_cond` is the **condition-side** sibling — it maps a value and then tests the result (returns `true`/`false`). The `map_range` descriptor used in params is the **output-side** equivalent — it maps a value and **returns** it as the param.

Both use the same underlying `linearMap` utility. See [RulesEngine Reference](../subsystems/rules-engine.md) for `map_range_cond` condition syntax.

### Step-Based Alternative

For simpler cases with 2–3 discrete states, multiple rules with `above`/`below` conditions are often clearer and require no new syntax:

```yaml
rules:
  - id: power_low
    when: { entity: sensor.grid_power, below: 1000 }
    apply:
      animations:
        - tag: power_line
          preset: march
          loop: true
          params: { speed: 8, color: '#00ff88' }

  - id: power_high
    when: { entity: sensor.grid_power, above: 1000 }
    apply:
      animations:
        - tag: power_line
          preset: march
          loop: true
          params: { speed: 0.8, color: '#ff4400' }
```

Use `map_range` when smooth/continuous mapping is preferred over discrete thresholds.
