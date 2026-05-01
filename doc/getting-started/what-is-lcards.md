::: warning ⚠️ Work in Progress
LCARdS is a **hobby** project and not a fully commissioned Starfleet product — expect the occasional tribble.

Documentation is under **heavy** construction - it may not be complete and/or accurate to the current build of the project.

:::

# What is LCARdS?

![LCARdS Banner](/img/lcards-banner.gif)

**Build Star Trek LCARS-style dashboards in Home Assistant** — reactive controls, coordinated animations, and a full Master Systems Display, all in one unified card system.

LCARdS originates from, and supersedes, the [CB-LCARS](https://github.com/snootched/cb-lcars) project. It is designed to accompany the [HA-LCARS theme](https://github.com/th3jesta/ha-lcars).

## The Cards

| Card | What it does |
|------|-------------|
| [**Button**](../cards/button/) | All standard LCARS button shapes — lozenge, bullet, pill, capped, and more — plus component mode for multi-segment SVG controls |
| [**Elbow**](../cards/elbow/) | Classic LCARS corner elements with authentic arc geometry; simple and Picard-style segmented variants |
| [**Slider**](../cards/slider-card/) | Interactive pill or gauge sliders — horizontal or vertical, auto-detects controllable vs. display-only entities |
| [**Chart**](../cards/chart/) | 15+ chart types via ApexCharts, with data source integration for history, moving averages, and statistics |
| [**Data Grid**](../cards/data-grid/) | LCARS data grids with cascade animation — real entity data or decorative generated values |
| [**MSD**](../cards/msd/) | Master Systems Display canvas — embed any HA card as a positioned overlay, add routed SVG lines, edit visually in the Studio Editor |
| [**Alert Overlay**](../cards/alert-overlay/) | Full-screen dashboard overlay that activates automatically on alert mode change |

→ [Full card reference](../cards/)

## What Makes It Different

Every card shares a common set of core features — you get these without any extra configuration.

**State-aware styling** — cards change colour and style in response to HA entity state, individually or in coordinated groups via the [Rules Engine](../core/rules/).

**Templates everywhere** — any text field accepts entity state, attributes, theme tokens, data source values, JavaScript expressions, or Jinja2. [Learn more →](../core/templates/)

**Alert Mode** — a single helper entity shifts the entire dashboard colour palette, plays sounds, and activates an overlay card simultaneously. [Learn more →](../core/alert-mode.md)

**Animations** — Anime.js v4 is built in; animate any element in response to interactions or entity state changes. [Learn more →](../core/animations.md)

**Data Sources** — subscribe to entities, buffer history, run processing pipelines (moving averages, min/max), and use the results in any card field or chart. [Learn more →](../core/datasources/)

## Next Steps

→ **[Installation](installation.md)** — install via HACS in under a minute

→ **[Coming from CB-LCARS?](cb-lcars-migration.md)** — feature mapping table