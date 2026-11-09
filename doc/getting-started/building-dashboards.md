---
description: "How to compose an LCARS dashboard from LCARdS cards: which card for which job, laying out a screen on a layout view, and recipes for rules, data sources and alert mode."
---

# Building a Dashboard

**Go from single cards to a whole LCARS screen: pick the cards for each job, then lay them out on a layout view.** The [Dashboard Gallery](dashboard-gallery) shows what can be built.

- For the look (colour roles, frames, screen shapes and ready-made patterns) see [Designing LCARS Screens](lcars-design). The [AI skill](ai-assistance) follows the same guide.
- Before saving, paste the dashboard into [Check Your Config](config-checker).

## Pick the cards

**Each LCARS job has a card: elbows for the frame, buttons for blocks and labels, sliders for levels, and a layout view for the screen itself.**

| You want | Use | Notes |
|---|---|---|
| The LCARS frame: corners, bars, headers | [Elbow](../cards/elbow/) | `header-left`/`footer-left` corners, `frame` for a full border; text labels sit on the bars |
| Buttons, labels, status pills | [Button](../cards/button/) | Presets for the classic shapes; `component: dpad` or `alert` for the D-pad and the alert symbol |
| A value you can set or read at a glance | [Slider](../cards/slider-card/) | Pills, gauges, shaped and Picard styles; read-only on sensors |
| Pick one of several options | [Select Menu](../cards/select-menu/) | One button per `input_select` option |
| Rows of readings | [Data Grid](../cards/data-grid/) | Entities, templates and data sources in a table; decorative mode for LCARS number blocks |
| History | [Chart](../cards/chart/) | Entity history, statistics or data sources |
| A ship or floor plan with live controls | [MSD](../cards/msd/) | Cards placed on an SVG, wired with routed lines |
| A full-screen alert | [Alert Overlay](../cards/alert-overlay/) | Shows over the view while an alert mode is active |
| The screen itself | [Layout View](../cards/layout-view/) | A CSS grid for the whole view; [Layout Card](../cards/layout-card/) for a grid inside one area |

::: info Using `custom:layout-card`?
LCARdS has its own [Layout Card](../cards/layout-card/) and [Layout View](../cards/layout-view/): the same grid keys, with a visual editor and more. LCARdS cards inside `custom:layout-card` can shrink and lose their margins, and moving over is a one-line change: see [Sizing inside `custom:layout-card`](../cards/common#inside-custom-layout-card).
:::

## Lay out the screen

**Build the view on a [Layout View](../cards/layout-view/): name the regions in `grid-template-areas`, then put each card in one with `view_layout.grid-area`.** The example is one view: in a dashboard's raw configuration it goes in the `views:` list.

- **Match the frame to the sidebar.** Give the header and footer elbows a `bar_width` equal to the sidebar column, so the bars line up with the buttons below.
- **Use `minmax(0, 1fr)`, not `1fr`,** for columns and rows that hold a chart, an MSD or a grid. A plain `1fr` can't shrink below its content, and the view overflows the screen.
- **Give button rows fixed heights** (`54px`), and the area that should take the rest a flexible track (`minmax(0, 1fr)`).

```yaml live
title: Bridge
path: bridge
type: custom:lcards-layout-view
layout:
  # fill the screen below Home Assistant's toolbar (the default)
  height: calc(100dvh - var(--header-height, 56px))
  padding: 12px
  grid-gap: 6px
  grid-template-columns: 170px minmax(0, 1fr)
  grid-template-rows: 64px 54px 54px minmax(0, 1fr) 64px
  grid-template-areas: |
    "header header"
    "nav1   main"
    "nav2   main"
    "filler main"
    "footer footer"
cards:
  - type: custom:lcards-elbow
    elbow:
      type: header-left
      segment:
        bar_width: 170 # the same width as the sidebar column
        bar_height: 22
    view_layout:
      grid-area: header
  - type: custom:lcards-button
    preset: lozenge
    text:
      label:
        content: LIGHTS
        show: true
    view_layout:
      grid-area: nav1
  - type: custom:lcards-button
    preset: lozenge
    text:
      label:
        content: DOORS
        show: true
    view_layout:
      grid-area: nav2
  # fill leftover space instead of leaving a hole in the frame
  - type: custom:lcards-button
    preset: panel-dark
    min_height: 0
    view_layout:
      grid-area: filler
  # the main area: a chart, an MSD or a data grid
  - type: custom:lcards-data-grid
    data_mode: decorative
    view_layout:
      grid-area: main
  - type: custom:lcards-elbow
    elbow:
      type: footer-left
      segment:
        bar_width: 170
        bar_height: 22
    view_layout:
      grid-area: footer
```

::: details More about laying out cards
- **Some cards draw to their cell's height:** the D-pad, the alert symbol, Picard and shaped sliders. Give them a cell whose height suits them; a tall cell makes a D-pad wider than its column. `justify-self: center` in `view_layout` centres one in a wide area.
- **Data grids stretch their rows** to fill the area. Set `grid-auto-rows` (and `align-content: start`) under the card's `grid:` for a compact table.
- **Lozenge buttons hide their label** by design; set `text.label.show: true` when the button should say something. For a title on an elbow, set its `position` (for example `bottom-right`) and a `color`.
- **Fill leftover space** with a `panel-dark` button or a decorative data grid instead of leaving holes in the frame.
:::

## Recipes

### A status that changes colour at a threshold

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

### A smoothed live reading with its history

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

### A screen that follows alert mode

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

## Check it

**Before saving a dashboard, paste it into [Check Your Config](config-checker).** It reports keys LCARdS doesn't have and names that don't exist (a misspelt preset, animation or theme token), each at its path in the YAML.

Want help writing it? [Getting AI Help](ai-assistance) shows how to have Claude or another assistant write the YAML for you.
