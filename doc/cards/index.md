# The Fleet

:::: tabs
=== Button

![Button Card](/img/lcards-button.png)

### **`lcards-button`**
All standard LCARS buttons, plus advanced multi-segment controls.

- Built-in preset library: lozenge, bullet, capped, outline, pill, text, and more
- **Component mode** — embed SVG components (D-pad, Alert, custom shapes) with per-segment interactivity
- Canvas-based **background animations** — stackable layers with zoom and pan
- Rules Engine integration — styles hot-patched at runtime

[Button Documentation](button/)

=== Elbow

### **`lcards-elbow`**
Classic LCARS corner designs.

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

=== Select Menu

**`lcards-select-menu`** — Grid of option buttons built from input_select/select entities or custom options.

- Creates a grid of buttons from an `input_select`|`select` entity for an easy to use options selector
- Fully customizable layout with CSS grid
- Ability to re-order options, customize labels, and even add additonal custom options to the list
- Fully cuztomizable actions with per-entry overrides

[Selct Menu Documentation](select-menu/)

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

=== Alert Overlay

**`lcards-alert-overlay`** — Full-screen dashboard overlay reacting to alert state.

- Activates automatically on `input_select.lcards_alert_mode` change
- Full-screen backdrop with blur + tint layers
- Configurable per-condition content card, position, and size
- Portal rendering — appended to `document.body` above all HA stacking

[Alert Overlay Documentation](alert-overlay/)

=== MSD

**`lcards-msd`** — Master Systems Display canvas.

- Embed any HA card as a positioned **control overlay**
- **Line overlays** — SVG lines with smart routing and avoid-obstacle algorithms
- **Studio Editor** — visual configuration with live preview and drag-to-reposition
- Animate lines independently with rules

[MSD Documentation](msd/)

::::

## Common Card Features

Features and concepts shared across all cards.

| Topic | What it covers |
|-------|---------------|
| [Common Card Properties](cards/common.md) | `id`, `tags`, `height`, `width`, `grid_options` — properties shared by every card |
| [Colours](../core/colours.md) | All accepted colour formats, state-based colour maps, resolution order |
| [Actions](../core/actions.md) | `tap_action`, `hold_action`, `double_tap_action` — all action types and options |
| [Text Fields](../core/text-fields.md) | Multi-field text system — placement, fonts, colour, templates |
| [Templates](../core/templates/) | Dynamic content: JS, Jinja2, LCARdS token data source templates |
| [Animations](../core/animations.md) | Per-card animations with multiple trigger types |
| [Background Animations](../core/effects/background-animations.md) | Canvas-based animated backgrounds (grid, starfield, nebula, etc.) |
| [Sound Effects](../core/sounds.md) | LCARS-style audio feedback for interactions and alerts |
| [Rules Engine](../core/rules/) | Advanced conditional system for styling applied across cards |
| [Data Sources](../core/datasources/) | Subscribes to HA Entity to provide history and processing pipelines for cards to consume |
| [Themes](../core/themes/) | Built-in token-based theming for providing colour, sizing etc. |
