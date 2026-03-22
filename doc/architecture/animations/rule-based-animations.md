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

## See Also

- [Animation System Overview](./)
- [Entity Change Triggers](entity-change-triggers.md)
- [Rules Engine](../subsystems/rules-engine.md)
- [Animation Manager](../subsystems/animation-manager.md)
