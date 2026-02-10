# LCARdS Animation System Documentation

This directory contains comprehensive documentation for the LCARdS animation system, including triggering mechanisms, configuration patterns, and best practices.

## Documentation Files

### [Rule-Based Animations](./rule-based-animations.md)
Complete guide to triggering animations based on RulesEngine conditions. Learn how to:
- Define animations in `apply.animations` sections
- Target overlays by ID, tag, type, or pattern
- Coordinate animations across multiple cards
- Leverage automatic lifecycle management (start/stop)
- Use priority-based animation hierarchies

**Use when:** You need complex multi-entity conditions, cross-card coordination, or automatic stopping of looping animations.

### [Entity Change Triggers](./entity-change-triggers.md)
Simple, declarative entity state monitoring for animations. Learn how to:
- Set up `on_entity_change` trigger on overlays
- Filter animations by state transitions (`from_state`, `to_state`)
- Monitor multiple entities on a single overlay
- Understand entity subscription lifecycle

**Use when:** You need simple reactive animations on a single overlay monitoring a single entity.

### [Datasource Buffers](./datasource-buffers.md)
Reference guide for the datasource buffer structure used in animations and templates. Learn about:
- Main buffer (`data.v`) vs processor buffers
- Accessing processor outputs (e.g., `data.celsius`, `data.rolling_avg`)
- Migration from old `transformations`/`aggregations` structure
- AnimationManager buffer extraction implementation
- Best practices and debugging techniques

**Use when:** Working with datasource-driven animations or templates with data processors.

## Quick Start

### Triggering Animations with Rules

```yaml
rules:
  - id: high_temp_alert
    when:
      entity: sensor.cpu_temp
      above: 75
    apply:
      animations:
        - tag: temp_widgets
          preset: alert_pulse
          loop: true
```

### Simple Entity Change Animation

```yaml
overlays:
  - id: light_icon
    animations:
      - trigger: on_entity_change
        entity: light.bedroom
        to_state: "on"
        preset: glow
        duration: 500
```

### Using Datasource Processors

```yaml
data_sources:
  temp_sensor:
    entity_id: sensor.temperature
    processors:
      - type: unit_conversion
        key: celsius
        from_unit: fahrenheit
        to_unit: celsius

overlays:
  - id: temp_display
    text: "{ds:temp_sensor.celsius:.1f}°C"
```

## Animation System Architecture

The LCARdS animation system consists of several integrated components:

```
┌─────────────────────────────────────────────────────────────┐
│                     Animation Triggering                     │
├─────────────────────┬───────────────────┬───────────────────┤
│   RulesEngine       │  TriggerManager   │  ActionHelpers    │
│ (Complex Conditions)│ (Entity Changes)  │ (User Interactions)│
└──────────┬──────────┴─────────┬─────────┴──────────┬────────┘
           │                    │                    │
           └────────────────────┼────────────────────┘
                                │
                       ┌────────▼─────────┐
                       │ AnimationManager │
                       │  - playAnimation │
                       │  - stopAnimations│
                       │  - Scope mgmt    │
                       └────────┬─────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
           ┌────────▼──────────┐   ┌────────▼─────────┐
           │ AnimationRegistry │   │  anime.js v4     │
           │ (Preset Caching)  │   │ (Execution)      │
           └───────────────────┘   └──────────────────┘
```

### Component Responsibilities

- **RulesEngine:** Evaluates complex conditions and triggers animations on rule match/unmatch
- **TriggerManager:** Manages overlay-specific animation triggers (on_entity_change, on_datasource_change)
- **ActionHelpers:** Handles interactive triggers (on_tap, on_hover, on_hold, on_double_tap)
- **AnimationManager:** Central orchestrator for animation execution and lifecycle
- **AnimationRegistry:** Caches animation instances for performance
- **anime.js v4:** Low-level animation execution engine

## Trigger Types

| Trigger | Handler | Scope | Use Case |
|---------|---------|-------|----------|
| `on_load` | TriggerManager | Single overlay | Initial render animations |
| `on_tap` | ActionHelpers | Single overlay | User tap interactions |
| `on_hold` | ActionHelpers | Single overlay | User hold interactions |
| `on_hover` | ActionHelpers | Single overlay | Mouse hover effects |
| `on_double_tap` | ActionHelpers | Single overlay | Double-tap actions |
| `on_entity_change` | TriggerManager | Single overlay | Simple state reactions |
| `on_datasource_change` | AnimationManager | Single overlay | Datasource value changes |
| **Rule-based** | RulesEngine | Multi-overlay | Complex conditions, cross-card |

## Feature Comparison

### Rule-Based vs Entity Change

| Feature | Rule-Based | Entity Change |
|---------|-----------|---------------|
| **Configuration** | In `rules` array | In `overlay.animations` |
| **Targeting** | Multi-overlay (tag, type, ID, pattern) | Single overlay (implicit) |
| **Conditions** | Full RulesEngine logic | State transitions only |
| **Auto-stop** | Yes (on unmatch) | No |
| **Cross-card** | Yes | No |
| **Best for** | Complex logic, coordination | Simple reactions |

## Common Patterns

### 1. Alert System with Priority Levels

```yaml
rules:
  - id: warning
    priority: 1
    when:
      entity: sensor.cpu_temp
      above: 70
    apply:
      animations:
        - tag: alert_target
          preset: pulse
          loop: true

  - id: critical
    priority: 10
    when:
      entity: sensor.cpu_temp
      above: 85
    apply:
      animations:
        - tag: alert_target
          preset: alert_flash
          loop: true
```

### 2. Cross-Card Status Coordination

```yaml
# Card 1
overlays:
  - id: status_1
    tags: [system_status]

# Card 2
overlays:
  - id: status_2
    tags: [system_status]

# Shared rule (in either card)
rules:
  - id: system_alert
    when:
      entity: binary_sensor.system_error
      state: "on"
    apply:
      animations:
        - tag: system_status
          preset: alert_flash
          loop: true
```

### 3. Interactive Feedback with State Sync

```yaml
overlays:
  - id: toggle_button
    type: button
    entity: switch.lights
    animations:
      # Tap feedback
      - trigger: on_tap
        preset: press
        duration: 150

      # External state changes
      - trigger: on_entity_change
        entity: switch.lights
        preset: flash
        duration: 200
```

## Performance Considerations

### Animation Count

Be mindful of simultaneous animations:

```yaml
# ⚠️ May impact performance (50+ overlays)
animations:
  - type: text
    preset: complex_animation
    loop: true

# ✅ Better: Targeted animations
animations:
  - tag: critical_widgets  # 2-3 overlays
    preset: flash
    loop: true
```

### Looping Animations

Always ensure looping animations have a stop condition:

```yaml
# ✅ GOOD: Rule-based with automatic stop
rules:
  - id: alert
    when:
      entity: sensor.value
      above: threshold
    apply:
      animations:
        - tag: target
          loop: true  # Stops when rule unmatches

# ⚠️ CAUTION: Entity change doesn't auto-stop
animations:
  - trigger: on_entity_change
    entity: sensor.value
    preset: spin
    loop: true  # Will loop forever after first change!
```

## Debugging

Enable debug logging to see animation execution:

```javascript
window.lcards.setGlobalLogLevel('debug');
```

Look for key log messages:

- `[RulesEngine] 🎬 Executing N animation(s) for rule: X`
- `[RulesEngine] 🛑 Stopping animations for rule: X`
- `[TriggerManager] 🎬 Triggering animation for overlay on entity change`
- `[AnimationManager] 📊 Datasource change: X`

## Migration Guide

### From Interactive-Only Animations

**Before:**
```yaml
overlays:
  - id: button
    animations:
      - trigger: on_tap
        preset: press
```

**After (adding entity change):**
```yaml
overlays:
  - id: button
    animations:
      - trigger: on_tap
        preset: press
      - trigger: on_entity_change  # NEW
        entity: switch.lights
        preset: flash
```

### From Duplicate Rule Logic

**Before (duplicated logic):**
```yaml
overlays:
  - id: widget_1
    animations:
      - trigger: on_entity_change
        entity: sensor.cpu_temp
        # Complex state filtering...

  - id: widget_2
    animations:
      - trigger: on_entity_change
        entity: sensor.cpu_temp
        # Same complex logic duplicated...
```

**After (single rule):**
```yaml
overlays:
  - id: widget_1
    tags: [cpu_alert]
  - id: widget_2
    tags: [cpu_alert]

rules:
  - id: cpu_high
    when:
      entity: sensor.cpu_temp
      above: 75  # Logic defined once
    apply:
      animations:
        - tag: cpu_alert
          preset: alert_flash
          loop: true
```

## Additional Resources

- [Animation Presets Reference](../subsystems/animation-presets.md) - Available animation presets
- [RulesEngine Documentation](../subsystems/rules-engine.md) - Rule condition syntax
- [SystemsManager Reference](../subsystems/systems-manager.md) - Entity subscription system
- [anime.js v4 Documentation](https://animejs.com) - Animation library documentation

## Support

For questions, bug reports, or feature requests:
- GitHub Issues: [LCARdS Repository](https://github.com/snootched/LCARdS/issues)
- Discussions: Use GitHub Discussions for general questions
