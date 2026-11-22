# Bring It to Life

**A laid-out screen comes to life when it reacts: these three examples recolour a card at a threshold, chart a smoothed live reading, and switch the whole screen into alert mode.** Each is a small, working piece to copy into your own screen; the linked pages cover the rest of each feature.

## A status that changes colour at a threshold

**A rule on the card itself recolours it as a reading climbs: the card's `id` is the rule's target, and the higher `priority` wins when both rules match.** Drag the temperature under the card past 60 and then 80.

- See [Rules](../core/rules/) for other conditions (time ranges, templates, `all`/`any`) and for restyling other cards by tag.

```yaml live controls
type: custom:lcards-button
id: reactor_status
entity: sensor.reactor_temperature
preset: lozenge
text:
  label:
    content: "REACTOR {{ states('sensor.reactor_temperature') | int }} °C"
    show: true
rules:
  - id: reactor-hot
    priority: 20
    when:
      entity: sensor.reactor_temperature
      above: 80
    apply:
      overlays:
        reactor_status:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
  - id: reactor-warm
    priority: 10
    when:
      entity: sensor.reactor_temperature
      above: 60
    apply:
      overlays:
        reactor_status:
          style:
            card:
              color:
                background: var(--lcars-alert-yellow)
```

## A smoothed live reading with its history

**A [data source](../core/datasources/) keeps an entity's recent values and runs processors over them: chart the raw and smoothed values together, and show the smoothed one in any text.**

- On the chart, each `sources` entry with `datasource:` plots the data source; `buffer` picks a processor's result instead of the raw values.
- Data source names are shared across the dashboard, so a button elsewhere can read the source the chart defines as `{ds:deck_temp.smoothed:.1f}`. `{ds:deck_temp}` without a format shows the raw value with its unit.

```yaml live
type: custom:lcards-chart
data_sources:
  deck_temp:
    entity: sensor.deck_temperature
    history:
      hours: 6
    processing:
      smoothed:
        type: smooth
        method: exponential
        alpha: 0.3
sources:
  - datasource: deck_temp
    name: Raw
  - datasource: deck_temp
    buffer: smoothed
    name: Smoothed
```

This button reads the data source the chart defines, so it needs the chart on the same dashboard (it is a plain block for that reason):

```yaml
type: custom:lcards-button
preset: lozenge
text:
  label:
    content: "DECK {ds:deck_temp.smoothed:.1f} °C" # the data source defined on the chart
    show: true
```

## A screen that follows alert mode

**LCARdS cards already recolour themselves when an [alert mode](../core/alert-mode) is active; add buttons that raise and clear an alert, and an overlay for the full-screen effect.** The buttons run the `lcards.*` [actions](../configuration/ha-actions): tap RED ALERT here and this page goes to red alert.

- Automations can react to the alert level too: `input_select.lcards_alert_mode` always holds the current mode.

```yaml live
type: custom:lcards-layout-card
layout:
  grid-template-columns: 1fr 1fr
  grid-template-rows: 56px
  grid-gap: 6px
cards:
  - type: custom:lcards-button
    preset: lozenge
    text:
      label:
        content: RED ALERT
        show: true
    tap_action:
      action: perform-action
      perform_action: lcards.red_alert
  - type: custom:lcards-button
    preset: lozenge
    text:
      label:
        content: STAND DOWN
        show: true
    tap_action:
      action: perform-action
      perform_action: lcards.clear_alert
```

Add the [alert overlay](../cards/alert-overlay/) once to the view: it covers the screen with the alert symbol while an alert is active. Here it shows on a mock screen; pick a condition to see it.

```yaml live
type: custom:lcards-alert-overlay
```
