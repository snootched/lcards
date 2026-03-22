# Animation System

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

## See Also

- [Entity Change Triggers](entity-change-triggers.md)
- [Rule-based Animations](rule-based-animations.md)
- [DataSource Buffers](../animations/datasource-buffers.md)
- [Animation Manager](../subsystems/animation-manager.md)
- [anime.js v4 Documentation](https://animejs.com)
