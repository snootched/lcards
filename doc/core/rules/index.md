# Rules Engine

Rules let you apply style changes to groups of cards based on entity state — without touching each card individually. A single rule can update dozens of overlays at once.

---

## Concept

A rule watches one or more entities. When a condition matches, it pushes a **patch** to all targeted overlays. When the condition no longer matches, the patch is removed.

```mermaid
flowchart LR
    E[Entity state changes] --> R[Rule evaluates condition]
    R -- matches --> P[Patch applied to targets]
    R -- no match --> C[Patch cleared from targets]
    P --> T1[Overlay tagged 'nav']
    P --> T2[Overlay tagged 'nav']
    P --> T3[Overlay id: header]

    style E fill:#37a6d1,stroke:#93e1ff,color:#fff
    style R fill:#2f3749,stroke:#52596e,color:#fff
    style P fill:#ffb399,stroke:#e7442a,color:#000
    style C fill:#6d748c,stroke:#d2d5df,color:#fff
```

---

## Where Rules Live

Rules are defined in the `rules` array of any card config, or in content packs. You manage them from the **Rules** tab in any card editor.

---

## Rule Structure

Every rule requires `id`, `when`, and `apply`. All other fields are optional.

```yaml
rules:
  - id: my-rule               # Required: unique identifier
    priority: 10              # Optional: higher wins (default 0)
    enabled: true             # Optional: disable without deleting (default true)
    stop: false               # Optional: stop evaluating lower-priority rules (default false)
    when:                     # Required: condition(s) to evaluate
      entity: binary_sensor.motion_hallway
      state: "on"
    apply:                    # Required: what to change when condition matches
      overlays:
        tag:nav:              # Selector: all overlays tagged 'nav'
          style:
            color: "{theme:colors.ui.primary}"
        header-card:          # Selector: overlay with this exact ID
          style:
            card:
              color:
                background: "#1a1a2e"
```

---

## Conditions (`when`)

A `when` block evaluates to `true` or `false`. When it matches, the `apply` block fires; when it stops matching, the patch is removed.

**Quick reference — all condition types** (see [Conditions Reference](conditions.md) for full details):

| Type | Key | Example |
|------|-----|---------|
| Entity state | `entity` | `entity: light.x` + `state: "on"` |
| Entity attribute | `entity_attr` | `entity_attr: light.x` + `attribute: brightness` + `above: 128` |
| Numeric range | `above` / `below` | `above: 18` (or combined: `above: 18` + `below: 26`) |
| Not equal / in list | `not_equals`, `in`, `not_in` | `not_in: ["off", "unavailable"]` |
| Regex | `regex` | `regex: "^heat"` |
| Map range | `map_range_cond` | Map raw sensor value to a new scale, then compare |
| Time range | `time_between` | `time_between: "22:00-06:00"` |
| Day of week | `weekday_in` | `weekday_in: [mon, tue, wed, thu, fri]` |
| Sun elevation | `sun_elevation` | `sun_elevation: { below: 0 }` |
| Random chance | `random_chance` | `random_chance: 0.25` |
| JavaScript | `condition` / `javascript` | `condition: "[[[return ...]]]"` |
| Jinja2 | `condition` / `jinja2` | `condition: "{{ ... }}"` |
| AND | `all` | `all: [...]` |
| OR | `any` | `any: [...]` |
| NOT | `not` | `not: { entity: ... }` |

**Simple examples:**

```yaml alternatives
# Entity state check
when:
  entity: light.bedroom
  state: "on"

# Numeric range
when:
  entity: sensor.temperature
  above: 18
  below: 26

# AND logic
when:
  all:
    - entity: binary_sensor.motion
      state: "on"
    - time_between: "08:00-23:00"

# Template (JavaScript)
when:
  condition: "[[[return states['sensor.temperature'].state > 25]]]"
```

> For the full condition reference — all operators, `map_range_cond`, `random_chance`, nested logic, template variables — see **[Conditions Reference](conditions.md)**.

---

## Apply Block (`apply`)

### Overlay Patches

The `apply.overlays` object maps **selectors** to patch objects. Selectors are the keys; the value is any overlay config fragment to merge.

```yaml
apply:
  overlays:
    my-overlay-id:          # Direct ID — exact match
      style:
        color: var(--lcars-red)

    tag:alert:              # Tag selector — all overlays tagged 'alert'
      style:
        color: var(--lcars-alert-red)

    type:gauge:             # Type selector — all overlays of type 'gauge'
      style:
        opacity: 1

    pattern:^temp_.*:       # Regex pattern — overlays whose ID matches
      style:
        color: var(--lcars-yellow)

    all:                    # Wildcard — every registered overlay
      style:
        opacity: 0.5
    exclude: [header, nav]  # Exclude specific IDs from 'all' or tag/type/pattern selectors
```

Multiple selectors in one rule are applied in order; later selectors' style keys override earlier ones for the same overlay.

Patch values support all template types (`{entity.state}`, `[[[JS]]]`, `{{jinja}}`):

```yaml
apply:
  overlays:
    temp-display:
      style:
        color: "[[[return parseFloat(states['sensor.temperature'].state) > 30 ? 'var(--lcars-red)' : 'var(--lcars-blue)']]]"
```

### Base SVG Filters (MSD cards)

```yaml
apply:
  base_svg:
    filter_preset: "red-alert"   # Named preset
    filters:                     # Or custom filter properties
      opacity: 0.3
      brightness: 0.7
      blur: "2px"
      grayscale: 0.5
      hue_rotate: "90deg"
      sepia: 0.3
      saturate: 0.8
      contrast: 1.2
      invert: 0.1
    transition: 1500             # Transition duration in ms (default 300)
```

Built-in presets: `none` (clear), `dimmed`, `subtle`, `backdrop`, `faded`, `red-alert`, `monochrome`.

Use `filter_preset: "none"` or `filters: {}` to clear all filters.

### Animations

Target by **direct ID** using `overlay:` (matches the card's `id:` field):

```yaml
apply:
  animations:
    - overlay: my-button-id    # Target a specific card by its id: value
      preset: blink
      loop: true               # Loop until rule unmatches
      duration: 1000           # ms
      params:                  # Preset-specific parameters
        max_scale: 1.1
```

Target by **tag** to affect multiple cards at once:

```yaml
apply:
  animations:
    - tag: alert-buttons       # All overlays tagged 'alert-buttons'
      preset: pulse
      loop: true
      duration: 800            # ms
      delay: 0                 # ms before start
      ease: inOutQuad
      params:
        speed: 2
        color: "#ff4400"
```

Animation selectors (mutually exclusive, evaluated in order): `overlay` (direct ID), `tag`, `type`, `pattern` (regex).

Animations started by a rule are **automatically stopped** when the rule unmatches.

### Profiles

```yaml
apply:
  profiles:
    - night_mode
    - dim_displays
```

---

## Priority

Higher `priority` wins when multiple rules would patch the same overlay property. Default is `0`. Rules are evaluated in descending priority order.

```yaml
rules:
  - id: normal-style
    priority: 0
    when:
      entity: sensor.temperature
      below: 25
    apply:
      overlays:
        temp-display:
          style:
            color: var(--lcars-blue)

  - id: alert-override
    priority: 100              # This wins when active
    when:
      entity: sensor.temperature
      above: 30
    apply:
      overlays:
        temp-display:
          style:
            color: var(--lcars-red)
```

Use `stop: true` to prevent lower-priority rules from being evaluated at all once a rule matches:

```yaml
rules:
  - id: critical-alert
    priority: 100
    stop: true                 # No lower-priority rules run if this matches
    when:
      entity: binary_sensor.emergency
      state: "on"
    apply:
      overlays:
        all:
          style:
            color: var(--lcars-alert-red)
```

---

## Tagging Overlays

Add `tags` to any overlay so rules can target it with `tag:` selectors:

```yaml
# MSD overlay
overlays:
  - id: nav-button-1
    type: button
    tags: [nav, main-panel]

# Non-MSD card
type: custom:lcards-button
tags: [nav, main-panel]
```

---

## Examples

### Temperature Alert

```yaml
rules:
  - id: temp-critical
    priority: 100
    stop: true
    when:
      entity: sensor.temperature
      above: 30
    apply:
      overlays:
        temp-display:
          style:
            color: var(--lcars-red)
      base_svg:
        filter_preset: red-alert
        transition: 500

  - id: temp-warning
    priority: 50
    when:
      entity: sensor.temperature
      above: 25
    apply:
      overlays:
        temp-display:
          style:
            color: var(--lcars-yellow)

  - id: temp-normal
    priority: 10
    when:
      entity: sensor.temperature
      below: 25
    apply:
      overlays:
        temp-display:
          style:
            color: var(--lcars-blue)
```

### Day/Night Mode (time-based)

```yaml
rules:
  - id: night-mode
    priority: 100
    when:
      all:
        - entity: sensor.time       # retriggers every minute
        - time_between: "22:00-06:00"
    apply:
      base_svg:
        filter_preset: dimmed
        transition: 2000
      overlays:
        tag:nav:
          style:
            opacity: 0.5

  - id: day-mode
    priority: 90
    when:
      all:
        - entity: sensor.time
        - time_between: "06:00-22:00"
    apply:
      base_svg:
        filter_preset: "none"
        transition: 2000
      overlays:
        tag:nav:
          style:
            opacity: 1
```

### Multi-condition with Animations

```yaml
rules:
  - id: climate-critical
    priority: 100
    stop: true
    when:
      all:
        - entity: sensor.temperature
          above: 28
        - entity: sensor.humidity
          above: 70
        - not:
            entity: climate.ac
            state: "on"
    apply:
      overlays:
        tag:status:
          style:
            color: var(--lcars-red)
      animations:
        - tag: status
          preset: pulse
          loop: true
      base_svg:
        filter_preset: red-alert
        transition: 500
```

---

## Viewing Active Rules

In any card editor, the **Rules** tab shows:
- All rules currently in the system
- Which rules are currently active (condition matched)
- Which patches are being applied to this overlay

From the browser console:

```javascript
const rm = window.lcards.core.rulesManager;
rm.getAllRules()                     // all registered rules
rm.getTrace()                        // detailed evaluation trace
rm.getRecentMatches(30000)           // matches in the last 30 s
rm.getRuleTrace('my-rule-id', 20)    // history for one rule
```

---

## See Also

- [Conditions Reference](conditions.md) — all condition types, operators, `map_range_cond`, `random_chance`, template conditions
- [Rule-Based Animations](../animations/rule-based-animations.md) — triggering animations across cards from rules
- [Architecture: Rules Engine](../../architecture/subsystems/rules-engine.md)

---
