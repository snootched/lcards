---
description: "Complete LCARdS dashboards to copy (bridge, engineering, environmental, security, alert mode, and Picard-era operations and sciences screens), with the YAML and a screenshot of each."
---

# Dashboard Gallery

Complete dashboards, not single cards: each one is a whole view built from LCARdS cards on a [Layout View](../cards/layout-view/), recorded in Home Assistant while its entities change (lights switch, levels move, alerts sound). Copy one, swap in your own entities, and build from there.

To use one:

1. Create a dashboard (**Settings > Dashboards > Add dashboard**), open it, then **Edit dashboard > Raw configuration editor**.
2. Paste the YAML and save.
3. Replace the `lcards_test_*` helpers and the sample temperature sensor with your own entities.
4. Paste your version into [Check Your Config](config-checker) before you save it.

They look best with an [HA-LCARS](https://github.com/th3jesta/ha-lcars) theme, and need no other custom cards.

## Bridge

An LCARS frame (header and footer elbows, a sidebar of buttons) around a status grid, two sliders, a toggle and a history chart.

<video class="doc-video" src="/gallery/bridge.webm" poster="/gallery/bridge.webp" title="Bridge dashboard: sidebar buttons, a status grid, power and shields sliders, a lights button and a temperature chart" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/bridge.yaml
:::

## Engineering

A [Master Systems Display](../cards/msd/) of the built-in NCC-1701-A blueprint in a Picard-era frame. Shield arcs around the ship change colour with shield strength, and three controls are joined to the ship's own bridge, warp core and shuttle bay markers by routed lines. Square sidebar buttons, a tick band, a systems table and Picard sliders surround it.

<video class="doc-video" src="/gallery/engineering.webm" poster="/gallery/engineering.webp" title="Engineering dashboard: a ship blueprint inside shield arcs, with three square control buttons joined to it by lines, a column of square sidebar buttons, a tick band, a systems table, two Picard sliders and a data cascade" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/engineering.yaml
:::

## Environmental

A shaped temperature slider, a humidity gauge, a status grid and a temperature history chart.

<video class="doc-video" src="/gallery/environmental.webm" poster="/gallery/environmental.webp" title="Environmental dashboard: a shaped temperature slider, a humidity gauge, a climate grid and a temperature chart" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/environmental.yaml
:::

## Security

Door and light toggles whose labels follow their state, a [select menu](../cards/select-menu/) for the security mode, a D-pad stepping a value (a stand-in for a camera pan), a status grid and a decorative data block.

<video class="doc-video" src="/gallery/security.webm" poster="/gallery/security.webp" title="Security dashboard: toggle buttons, a mode selector, a status grid, a D-pad, a slider and a block of decorative LCARS numbers" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/security.yaml
:::

## Alert mode

Buttons that raise and clear an [alert mode](../core/alert-mode) through the `lcards.*` [actions](../configuration/ha-actions), beside an everyday systems screen. The [alert overlay](../cards/alert-overlay/) covers the view with the symbol for the active alert: red, then yellow.

<video class="doc-video" src="/gallery/alert.webm" poster="/gallery/alert.webp" title="Alert dashboard: alert buttons beside a systems table, a data cascade and a chart; red alert covers it with the red overlay, then yellow alert with the yellow one" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/alert.yaml
:::

## Picard era

Later LCARS screens (as on the USS Titan) use thinner, double-ringed frames, square-ended buttons, cooler blues and greys, and dense readouts with small orange accents. These two use the same cards in that style.

### Operations

Segmented double elbows, filled buttons that light up with their state, a [select menu](../cards/select-menu/) in the outline style, a cascade of changing hex values, a status table and two Picard sliders.

<video class="doc-video" src="/gallery/titan-operations.webm" poster="/gallery/titan-operations.webp" title="Operations dashboard: grey double elbows with orange accents framing light and door buttons, a mode selector, a blue cascade of hex numbers, a status table, two vertical Picard sliders and a temperature history" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/titan-operations.yaml
:::

### Sciences

Segmented [frames](../cards/elbow/#frame-type) around a history chart with a smoothed [data source](../core/datasources/) trend and a set of radial gauges, a sensor table and hourly averages.

<video class="doc-video" src="/gallery/sciences.webm" poster="/gallery/sciences.webp" title="Sciences dashboard: a framed temperature history with a smoothed trend line, framed radial gauges for power, shields and humidity, a sensor table and a column chart of hourly averages" autoplay loop muted playsinline></video>

::: details YAML
<<< @/gallery/dashboards/sciences.yaml
:::
