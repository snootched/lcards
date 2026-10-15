---
description: "How to compose an LCARS dashboard from LCARdS cards: which card for which job, laying out a screen on a layout view, and recipes for rules, data sources and alert mode."
---

# Building a Dashboard

How to go from single cards to a whole LCARS screen. The [Dashboard Gallery](dashboard-gallery) shows five finished examples built this way; this page explains the choices behind them.

## Pick the cards

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
| The screen itself | [Layout View](../cards/layout-view/) | A CSS grid for the whole view; [Layout Card](../cards/layout-view/#layout-card) for a grid inside one area |

## Lay out the screen

Build the view on a [Layout View](../cards/layout-view/): name the regions in `grid-template-areas`, then put each card in one with `view_layout: { grid-area: ... }`.

```yaml
views:
  - title: Bridge
    path: bridge
    type: custom:lcards-layout-view
    layout:
      height: calc(100dvh - var(--header-height, 56px))   # fill the screen below HA's toolbar
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
            bar_width: 170     # the same width as the sidebar column
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
```

Things that make the difference:

- **Match the frame to the sidebar.** Give the header and footer elbows a `bar_width` equal to the sidebar column, so the bars line up with the buttons below.
- **`minmax(0, 1fr)`, not `1fr`,** for columns and rows that hold a chart, an MSD or a grid. A plain `1fr` can't shrink below its content, and the view overflows the screen.
- **Fixed heights for button rows** (`54px`), the flexible track (`minmax(0, 1fr)`) for the area that should take the rest.
- **Some cards draw to their cell's height:** the D-pad, the alert symbol, Picard and shaped sliders. Give them a cell whose height suits them; a tall cell makes a D-pad wider than its column. `justify-self: center` in `view_layout` centres one in a wide area.
- **Data grids stretch their rows** to fill the area. Set `grid-auto-rows` (and `align-content: start`) under the card's `grid:` for a compact table.
- **Lozenge buttons hide their label** by design; set `text.label.show: true` when the button should say something. For a title on an elbow, set its `position` (for example `bottom-right`) and a `color`.
- **Fill leftover space** with a `panel-dark` button or a decorative data grid instead of leaving holes in the frame.

## Recipes

### A status that changes colour at a threshold

A rule on the card itself: the card's `id` is the target, and higher `priority` wins when both rules match.

```yaml
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
                background: var(--lcars-alert-red, #cc0000)
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
                background: var(--lcars-alert-yellow, #ffcc00)
```

See [Rules](../core/rules/) for conditions (time ranges, templates, `all`/`any`) and for restyling other cards by tag.

### A smoothed live reading with its history

A [data source](../core/datasources/) keeps recent values and runs processors over them. Show the smoothed value in text with `{ds:name.processor}` and chart the raw and smoothed buffers together.

```yaml
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

```yaml
type: custom:lcards-button
preset: lozenge
text:
  label:
    content: "DECK {ds:deck_temp.smoothed:.1f} °C"   # the data source defined on the chart
    show: true
```

Data source names are shared across the dashboard, so the button reads the source the chart defines. `{ds:deck_temp}` without a format shows the raw value with its unit.

### A screen that follows alert mode

LCARdS cards already recolour themselves when an [alert mode](../core/alert-mode) is active. Add the overlay for the full-screen effect and buttons that raise and clear an alert through the `lcards.*` [actions](../configuration/ha-actions):

```yaml
type: custom:lcards-layout-card
layout:
  grid-template-columns: 1fr 1fr
  grid-gap: 6px
cards:
  - type: custom:lcards-alert-overlay
  - type: custom:lcards-button
    preset: lozenge
    text:
      label:
        content: RED ALERT
        show: true
    tap_action:
      action: perform-action
      service: lcards.red_alert
  - type: custom:lcards-button
    preset: lozenge
    text:
      label:
        content: STAND DOWN
        show: true
    tap_action:
      action: perform-action
      service: lcards.clear_alert
```

Automations can react to the alert level too: `input_select.lcards_alert_mode` always holds the current mode.

## Check it

Before saving a dashboard, run it through the [config checker](../cards/ai-assistance#check-what-it-wrote): `node lcards-validate.mjs my-dashboard.yaml` reports keys LCARdS doesn't have and names that don't exist (a misspelt preset, animation or theme token), each at its path in the YAML.
