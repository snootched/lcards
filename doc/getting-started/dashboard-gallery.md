---
description: "Five complete LCARdS dashboards (bridge, engineering, environmental, security, alert mode) to copy, with the YAML and a screenshot of each."
---

# Dashboard Gallery

Complete dashboards, not single cards: each one is a whole view built from LCARdS cards on a [Layout View](../cards/layout-view/), shown as it renders in Home Assistant. Copy one, swap in your own entities, and build from there.

To use one:

1. Create a dashboard (**Settings > Dashboards > Add dashboard**), open it, then **Edit dashboard > Raw configuration editor**.
2. Paste the YAML and save.
3. Replace the `lcards_test_*` helpers and the sample temperature sensor with your own entities.
4. Check your version with the [config checker](../cards/ai-assistance#check-what-it-wrote) before you save it: `node lcards-validate.mjs my-dashboard.yaml`.

They look best with an [HA-LCARS](https://github.com/th3jesta/ha-lcars) theme, and need no other custom cards.

## Bridge

An LCARS frame (header and footer elbows, a sidebar of buttons) around a status grid, two sliders, a toggle and a history chart.

<img alt="Bridge dashboard: sidebar buttons, a status grid, power and shields sliders, a lights button and a temperature chart" src="/gallery/bridge.webp" />

::: details YAML
<<< @/gallery/dashboards/bridge.yaml
:::

## Engineering

A [Master Systems Display](../cards/msd/) of the built-in NCC-1701-A blueprint. Two controls are wired to the ship's own bridge and warp core markers by routed lines, beside a power column.

<img alt="Engineering dashboard: an MSD ship blueprint with two control buttons connected to it by lines, a vertical power gauge, a slider and a status grid" src="/gallery/engineering.webp" />

::: details YAML
<<< @/gallery/dashboards/engineering.yaml
:::

## Environmental

A shaped temperature slider, a humidity gauge, a status grid and a temperature history chart.

<img alt="Environmental dashboard: a shaped temperature slider, a humidity gauge, a climate grid and a temperature chart" src="/gallery/environmental.webp" />

::: details YAML
<<< @/gallery/dashboards/environmental.yaml
:::

## Security

Door and light toggles whose labels follow their state, a [select menu](../cards/select-menu/) for the security mode, a D-pad stepping a value (a stand-in for a camera pan), a status grid and a decorative data block.

<img alt="Security dashboard: toggle buttons, a mode selector, a status grid, a D-pad, a slider and a block of decorative LCARS numbers" src="/gallery/security.webp" />

::: details YAML
<<< @/gallery/dashboards/security.yaml
:::

## Alert mode

The alert symbol, buttons that raise and clear an [alert mode](../core/alert-mode) through the `lcards.*` [actions](../configuration/ha-actions), and the [alert overlay](../cards/alert-overlay/) that covers the view while an alert is active.

<img alt="Alert dashboard: red, yellow and blue alert buttons and a stand-down button beside a large red alert symbol" src="/gallery/alert.webp" />

::: details YAML
<<< @/gallery/dashboards/alert.yaml
:::

## Make your own

The pictures are taken with `npm run gallery:shots` (`scripts/dashboard-shots.mjs`), which checks a YAML file, writes it to a hidden dashboard on a development Home Assistant and saves a screenshot. New gallery dashboards are welcome: use only `lcards_test_*` helpers (the tool creates them on the development Home Assistant) and check the screenshot before adding it.
