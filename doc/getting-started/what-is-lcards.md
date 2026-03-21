::: warning ⚠️ Work in Progress
LCARdS is a **hobby** project and not a fully commissioned Starfleet product — expect the occasional tribble.

Documentation is under heavy construction - it may not be complete and/or accurate to the current build of the project.

:::

# What is LCARdS?

![LCARdS Banner](/img/lcards-banner.gif)

**Build Star Trek LCARS-style dashboards in Home Assistant** — reactive controls, coordinated animations, and a full Master Systems Display, all in one unified card system.

LCARdS originates from, and supersedes, the [CB-LCARS](https://github.com/snootched/cb-lcars) project. It is designed to accompany the [HA-LCARS theme](https://github.com/th3jesta/ha-lcars).

:::: tabs
=== Button

**`lcards-button`** — All standard LCARS buttons, plus advanced multi-segment controls.

- Built-in preset library: lozenge, bullet, capped, outline, pill, text, and more
- **Component mode** — embed SVG components (D-pad, Alert, custom shapes) with per-segment interactivity
- Canvas-based **background animations** — stackable layers with zoom and pan
- Rules Engine integration — styles hot-patched at runtime

[Button Documentation](button/)

=== Elbow

**`lcards-elbow`** — Classic LCARS corner designs.

- Built-in presets: `header-left`, `header-right`, `footer-left`, `footer-right`
- **Simple** and **segmented** (Picard-style double elbow) styles
- Authentic LCARS arc geometry or diagonal-cut corners with configurable angle
- Symbiont support — embed other HA cards inside the elbow area

[Elbow Documentation](elbow/)

=== Slider

**`lcards-slider`** — Interactive sliders for display and control.

- Built-in presets: **pills** (segmented bar) and **gauge** (ruler with tick marks)
- Horizontal and vertical orientations with independent fill inversion
- Separate min/max for display range vs. control range
- Domain auto-detection — interactive for controllable domains, display-only for sensors

[Slider Documentation](slider-card/)

=== Data Grid

**`lcards-data-grid`** — LCARS data grids with cascade animations.

- **Data mode** — real entity states, attributes, or template values
- **Decorative mode** — cascading generated data for aesthetics
- LCARS-style cascade animation with built-in speed presets
- CSS Grid layout with full style cascading

[Data Grid Documentation](data-grid/)

=== Chart

**`lcards-chart`** — LCARdS integrated charting via ApexCharts.

- 15+ chart types: line, area, bar, pie, scatter, heatmap, radar, and more
- Single entity, multi-entity, or data source with processor buffers
- Moving averages, min/max, rolling statistics from data source integration

[Chart Documentation](chart/)

=== MSD

**`lcards-msd`** — Master Systems Display canvas.

- Embed any HA card as a positioned **control overlay**
- **Line overlays** — SVG lines with smart routing and avoid-obstacle algorithms
- **Studio Editor** — visual configuration with live preview and drag-to-reposition
- Animate lines independently with rules

[MSD Documentation](msd/)

=== Alert Overlay

**`lcards-alert-overlay`** — Full-screen dashboard overlay reacting to alert state.

- Activates automatically on `input_select.lcards_alert_mode` change
- Full-screen backdrop with blur + tint layers
- Configurable per-condition content card, position, and size
- Portal rendering — appended to `document.body` above all HA stacking

[Alert Overlay Documentation](alert-overlay/)

::::

## What Makes It Different

Every card shares a common set of core features — you get these without any extra configuration.

**State-aware styling** — cards change colour and style in response to HA entity state, individually or in coordinated groups via the [Rules Engine](../core/rules/).

**Templates everywhere** — any text field accepts entity state, attributes, theme tokens, data source values, JavaScript expressions, or Jinja2. [Learn more →](../core/templates/)

**Alert Mode** — a single helper entity shifts the entire dashboard colour palette, plays sounds, and activates an overlay card simultaneously. [Learn more →](../core/alert-mode.md)

**Animations** — Anime.js v4 is built in; animate any element in response to interactions or entity state changes. [Learn more →](../core/animations.md)

**Data Sources** — subscribe to entities, buffer history, run processing pipelines (moving averages, min/max), and use the results in any card field or chart. [Learn more →](../core/datasources/)

## Next Steps

→ **[Installation](installation.md)** — install via HACS in under a minute

→ **[Quick Start](quick-start.md)** — add your first card and explore the editors

→ **[Coming from CB-LCARS?](cb-lcars-migration.md)** — feature mapping table