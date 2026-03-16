# LCARdS User Documentation

> **LCARS-inspired custom cards for Home Assistant**

---

## Cards

The LCARdS fleet. Each card is independent but shares the same core systems.

| Card | Type | Purpose |
|------|------|---------|
| [Button](cards/button/README.md) | `custom:lcards-button` | Buttons, labels, D-pad, multi-segment SVG |
| [Elbow](cards/elbow/README.md) | `custom:lcards-elbow` | LCARS corner/cap decorations |
| [Select Menu](cards/select-menu/README.md) | `custom:lcards-select-menu` | Grid of option buttons for input_select / select entities |
| [Slider](cards/slider/README.md) | `custom:lcards-slider` | Interactive sliders and gauge displays |
| [Chart](cards/chart/README.md) | `custom:lcards-chart` | Data visualization (ApexCharts) |
| [Data Grid](cards/data-grid/README.md) | `custom:lcards-data-grid` | Tabular entity data with cascade animations |
| [MSD](cards/msd/README.md) | `custom:lcards-msd` | Master Systems Display with routing lines |

---

## Common Card Features

Features and concepts shared across all cards.

| Topic | What it covers |
|-------|---------------|
| [Common Card Properties](cards/common.md) | `id`, `tags`, `height`, `width`, `grid_options` — properties shared by every card |
| [Colours](../core/colours.md) | All accepted colour formats, state-based colour maps, resolution order |
| [Actions](../core/actions.md) | `tap_action`, `hold_action`, `double_tap_action` — all action types and options |
| [Text Fields](../core/text-fields.md) | Multi-field text system — placement, fonts, colour, templates |
| [Templates](../core/templates/README.md) | Dynamic content: JS, Jinja2, LCARdS token datasource templates |
| [Animations](../core/animations.md) | Per-card animations with multiple trigger types |
| [Background Animations](../core/effects/background-animations.md) | Canvas-based animated backgrounds (grid, starfield, nebula, etc.) |
| [Sound Effects](../core/sounds.md) | LCARS-style audio feedback for interactions and alerts |
| [Rules Engine](../core/rules/README.md) | Advanced conditional system for styling applied across cards |
| [DataSources](../core/datasources/README.md) | Subscribes to HA Entity to provide history and processing pipelines for cards to consume |
| [Themes](../core/themes/README.md) | Built-in token-based theming for providing colour, sizing etc. |

---

## Config Panel

[LCARdS Config Panel](../configuration/config-panel.md) — Central hub for managing helpers, alert settings, sounds, and more.

---

## Quick Example

```yaml
type: custom:lcards-button
entity: light.living_room
preset: lozenge

text:
  label:
    content: Living Room
    show: true
    position: top-left
    color: "var(--lcards-moonlight)"
  value:
    content: "{entity.state}"
    position: center
    color:
      default: "var(--lcards-moonlight)"
      active: "var(--lcards-orange)"

style:
  border:
    color:
      default: "var(--lcards-gray)"
      active: "var(--lcards-orange)"
    width: 2

tap_action:
  action: toggle
```
