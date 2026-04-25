# Rule-based Animations

The Rules Engine can trigger animations across any number of cards simultaneously when conditions are met. This is more powerful than per-card `on_entity_change` animations when you need to coordinate multiple cards or use complex multi-entity conditions.

---

## Basic Structure

Add an `animations` array to a rule's `apply` block:

```yaml
rules:
  - id: high_temp_alert
    when:
      entity: sensor.cpu_temp
      above: 75
    apply:
      animations:
        - tag: temperature_widgets
          preset: pulse
          loop: true
          duration: 1000
```

When `sensor.cpu_temp` exceeds 75, all cards tagged `temperature_widgets` start pulsing. When it drops back below 75, the rule unmatches and the animations **stop automatically** — no cleanup needed.

---

## Targeting

Each item in `apply.animations` is an object whose **first property** identifies the target. Exactly one of the following properties must be present (evaluated in order, mutually exclusive):

| Property | Value | Targets |
|----------|-------|---------|
| `overlay` | overlay ID string | A single overlay by its `id:` value |
| `tag` | tag name string | All overlays that carry this tag |
| `type` | card type string | All overlays of this type (e.g. `lcards-button`) |
| `pattern` | regex string | All overlays whose ID matches the regex |

```yaml
apply:
  animations:
    - overlay: my-status-button   # targets one specific overlay
      preset: glow

    - tag: alert-indicators        # targets all overlays tagged 'alert-indicators'
      preset: blink
      loop: true

    - type: lcards-button          # targets all button cards
      preset: pulse
      loop: true

    - pattern: "^temp_.*"          # targets all overlays with IDs starting with 'temp_'
      preset: shimmer
      loop: true
```

::: info Different from style patch selectors
Style patches (`apply.overlays`) use **colon-prefixed map keys** — e.g. `tag:alert-buttons:`. Animation commands use **property names on array items** — e.g. `- tag: alert-buttons`. The two systems look similar but have different YAML structures.
:::

---

## Animation Parameters

All the same options available in per-card animations work in `apply.animations`:

```yaml
apply:
  animations:
    - tag: alert-buttons
      preset: pulse
      loop: true
      duration: 800
      delay: 0
      ease: inOutQuad
      params:
        max_scale: 1.1
        color: "#ff4400"
```

`map_range` descriptors work here too — map a live sensor value to an animation parameter:

```yaml
apply:
  animations:
    - tag: wind-indicators
      preset: rotate
      loop: true
      params:
        speed:
          map_range:
            entity: sensor.wind_speed
            input: [0, 50]
            output: [3000, 300]
            clamp: true
```

---

## Lifecycle — Automatic Stop on Unmatch

Looping animations started by a rule are tracked by the Rules Engine. When the rule transitions from matched to unmatched, all looping animations it started are stopped automatically.

```yaml
# Rule matches  → animations start on all tagged cards
# Rule unmatches → looping animations stop on all those cards
rules:
  - id: door_alert
    when:
      entity: binary_sensor.front_door
      state: "on"
    apply:
      animations:
        - tag: door-widgets
          preset: strobe
          loop: true
```

Non-looping animations (`loop: false`) run to completion regardless of whether the rule unmatches during playback.

---

## Multi-Card Coordination Example

Red alert: pulse action buttons, strobe the alert overlay, shimmer all elbows — all from one rule.

```yaml
rules:
  - id: red_alert_active
    when:
      entity: input_select.lcars_alert_mode
      state: red_alert
    apply:
      style:
        primary_color: "var(--lcars-alert-red)"
      animations:
        - tag: action-buttons
          preset: pulse
          loop: true
          params:
            max_scale: 1.08
            color: "var(--lcars-alert-red)"
        - overlay: main-alert-overlay
          preset: strobe
          loop: true
        - type: lcards-elbow
          preset: shimmer
          loop: true
          params:
            color_to: "var(--lcars-alert-red)"
```

---

## Combining with Style Patches

The `apply` block can mix `style`, `animations`, and other directives. All take effect simultaneously when the rule matches:

```yaml
apply:
  style:
    primary_color: "var(--lcars-alert-yellow)"
    label: "WARNING"
  animations:
    - overlay: alert-badge
      preset: blink
      loop: true
```

---

## See Also

- [Animations overview](../animations.md) — structure, per-card triggers, options
- [Preset Reference](preset-reference.md) — all available presets
- [Entity Change Triggers](entity-change-triggers.md) — per-card entity-based triggers
- [Rules Engine](../rules/) — full rules reference including conditions and the `apply` block
