---
description: "Rule examples to copy: a three-level temperature alert, day and night mode on an MSD, and a multi-condition climate alert with animations and a blueprint tint."
---

# Rule Examples

**Whole rule sets to copy and change.** Each shows several rule keys working together; the keys are explained on the [Rules Engine](./), [Conditions](./conditions), [Targets and Changes](./changes) and [Priority and Debugging](./priority) pages.

## Temperature alert

**Three rules colour one card by temperature: red above 30, yellow above 25, blue below.** Drag the temperature control to move between them.

- The critical rule has the highest priority and `stop: true`, so above 30 nothing else changes the card.
- Between 25 and 30 only the warning rule matches; below 25 only the normal one.

```yaml live controls
type: custom:lcards-button
id: docs-rules-temp-display
preset: lozenge
text:
  name:
    content: TEMPERATURE
    show: true
rules:
  - id: docs-rules-temp-critical
    priority: 100
    stop: true
    when:
      entity: input_number.lcards_test_temperature
      above: 30
    apply:
      overlays:
        docs-rules-temp-display:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
  - id: docs-rules-temp-warning
    priority: 50
    when:
      entity: input_number.lcards_test_temperature
      above: 25
    apply:
      overlays:
        docs-rules-temp-display:
          style:
            card:
              color:
                background: var(--lcars-alert-yellow)
  - id: docs-rules-temp-normal
    priority: 10
    when:
      entity: input_number.lcards_test_temperature
      below: 25
    apply:
      overlays:
        docs-rules-temp-display:
          style:
            card:
              color:
                background: var(--lcars-blue)
```

## Day and night mode

**Two time-based rules on an MSD: at night the blueprint dims and the lines tagged `nav` fade; by day both come back.** They go in the MSD card's `rules`.

- Time rules are checked at the start of every minute, so the switch happens on time.
- `filters: []` clears the blueprint's filters for the day.
- It is the `rules` of an MSD of your own (with lines tagged `nav`), so it is shown as YAML only.

```yaml
rules:
  - id: night-mode
    priority: 100
    when:
      time_between: "22:00-06:00"
    apply:
      base_svg:
        filters:
          - type: opacity
            value: 0.5
          - type: brightness
            value: 0.8
        transition: 2000
      overlays:
        tag:nav:
          style:
            opacity: 0.5

  - id: day-mode
    priority: 90
    when:
      time_between: "06:00-22:00"
    apply:
      base_svg:
        filters: []
        transition: 2000
      overlays:
        tag:nav:
          style:
            opacity: 1
```

## Multi-condition with animations

**One rule with three conditions: hot, humid and the air conditioning off.** While all three hold, the cards tagged `status` turn red and pulse, and the MSD's blueprint takes a red tint.

- `not` turns "the air conditioning is on" into "it is not on".
- `stop: true` with the high priority keeps other rules off the `status` cards while this one holds.
- The entities are your own (a temperature and humidity sensor, a climate entity), so this example is shown as YAML only. Put it in the MSD card's `rules`.

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
        filters:
          - mode: svg
            type: tint
            value:
              color: alpha(var(--lcars-alert-red), 0.35)
        transition: 500
```
