# Build by Hand

**Go from single cards to a whole LCARS screen: pick the cards for each job, then lay them out on a layout view.** For quicker routes (a generated dashboard, LCARS sections, a sample to copy) see [Building a Dashboard](building-dashboards).

## Pick the cards

**Each LCARS job has a card: elbows for the frame, buttons for blocks and labels, sliders for levels, and a layout view for the screen itself.**

| You want | Use | Notes |
|---|---|---|
| The LCARS frame: corners, bars, headers | [Elbow](../cards/elbow/) | `header-left`/`footer-left` corners, `frame` for a full border; text labels sit on the bars |
| Buttons, labels, status pills | [Button](../cards/button/) | Presets for the classic shapes; `component: dpad` or `alert` for the D-pad and the alert symbol |
| A value you can set or read at a glance | [Slider](../cards/slider-card/) | Pills, gauges, shaped and Picard styles; read-only on sensors |
| Pick one of several options | [Select Menu](../cards/select-menu/) | One button per `input_select \| select` option |
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

## Check it

**Something not working? You can check your config by pasting it into [Check Your Config](config-checker).** It will show you invalid keys and configuration values against LCARdS schema.

When the screen is laid out, [Bring It to Life](bring-it-to-life) shows it reacting to your home.
