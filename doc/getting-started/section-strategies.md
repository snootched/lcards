---
description: "LCARS section strategies: automatic sections for Home Assistant's sections dashboards that fill themselves with LCARdS cards for an area or other target: readings, gauges, controls and code blocks."
---

# Section Strategies

**An automatic section fills itself with cards for the area (or devices, labels, entities) you pick, and stays up to date.** LCARdS adds four to Home Assistant's sections dashboards, each an LCARS building block: a readings table, a gauge bank, control pills and a code-block panel.

- They work in any sections view, beside your own sections and Home Assistant's built-in automatic sections.
- When you add a light to an area, rename a sensor or move a device, the section rebuilds itself. You change its settings, not its cards.
- Every section starts with a title bar and uses your theme's LCARS colours.

![Four LCARS sections on a sections dashboard: readings for an area, a bank of gauges, toggle pills and a panel of code blocks](/img/strategies/lcars-sections.webp)

| Section | In the chooser | Shows |
|---|---|---|
| [`custom:lcars-readings`](#lcars-readings) | LCARS readings | A readings table of sensors |
| [`custom:lcars-gauges`](#lcars-gauges) | LCARS gauges | Upright gauges for percentages, temperatures and numbers |
| [`custom:lcars-controls`](#lcars-controls) | LCARS controls | Rounded pills that toggle lights, switches, fans and toggles |
| [`custom:lcars-blocks`](#lcars-blocks) | LCARS blocks | Small code blocks that light up while their entity is on |

## Add a section

**Sections are added in the dashboard's edit mode, from Create section.** The dashboard's view must be a sections view, Home Assistant's default for new dashboards.

1. Open the dashboard, select the pencil, and select the **Create section** tile at the end of the view.
2. Pick **Automatic section**, then one of the LCARS sections under **Community sections**. Each tile shows a preview built from the area with the most matching entities.
3. On the **Strategy** tab, pick an area (or devices, floors, labels or entities) and, if you like, a title. Save.

::: details More about adding sections
- **Not in the chooser:** the Community sections heading appears only when the browser has loaded LCARdS. Hard refresh the page (Ctrl+Shift+R) after installing or updating.
- **Change it later:** select the section's pencil in edit mode; the Strategy tab holds its settings, and the three-dot menu shows them as YAML.
- **Width and visibility:** the section's other tabs (appearance, visibility) work as for any section.
:::

## Section keys

**Every LCARS section takes the same two keys, the ones Home Assistant's own Entities section uses.** The settings form writes them for you; this is what its YAML looks like inside a sections view.

- `target` can name several things at once; the section shows the matching entities of all of them.
- Hidden entities and configuration or diagnostic entities are left out, unless you name them under `entity_id`.
- Names are shortened for the small LCARS labels: the area's name and any words every name in the section starts with are dropped ("Bridge Temperature" in the Bridge reads TEMPERATURE).

```yaml
type: sections
sections:
  - strategy:
      type: custom:lcars-readings
      title: BRIDGE
      target:
        area_id: bridge
  - strategy:
      type: custom:lcars-controls
      target:
        floor_id: deck_1
        entity_id:
          - switch.coffee_maker
```

| Key | Type | Default | Description |
|---|---|---|---|
| `type` | string | required | The section: `custom:lcars-readings`, `custom:lcars-gauges`, `custom:lcars-controls` or `custom:lcars-blocks` |
| `title` | string | the area's name | The title bar's text. Without it: the target's area name when the target is one area, else READINGS, LEVELS, CONTROLS or SYSTEMS |
| `target.area_id` | string or list | - | Areas: entities in the area, directly or through their device |
| `target.floor_id` | string or list | - | Floors: every area on them |
| `target.device_id` | string or list | - | Devices: their entities |
| `target.label_id` | string or list | - | Labels on entities, devices or areas |
| `target.entity_id` | string or list | - | Entities, shown even when hidden |

## lcars-readings

**A readings table: each sensor's name and its value, numbered, as on a Picard data screen.** Use it for an area's temperature, humidity, power and the like.

- Sensors with a device class or a unit are listed; temperature, humidity, light level, CO2, pressure, power, energy and battery come first, in that order, then the rest by name.
- The first row is in the accent colour. At most 12 rows.

```yaml
type: sections
sections:
  - strategy:
      type: custom:lcars-readings
      target:
        area_id: living_room
```

| Key | Type | Default | Description |
|---|---|---|---|
| [Section keys](#section-keys) | | | `type`, `title`, `target` |

## lcars-gauges

**A bank of upright Picard gauges, each with its value in the top cap and a short name in the bottom one.** Use it for levels: humidity, battery, a temperature or a number helper.

- Sensors in % and temperature, humidity or battery sensors become gauges, and so do number helpers and number entities. Drag a number helper's gauge to set it.
- Four gauges sit side by side in a section, at most eight in all. Each cap shows one word, shortened (TEMP, HUMID, BATT).

```yaml
type: sections
sections:
  - strategy:
      type: custom:lcars-gauges
      title: LEVELS
      target:
        label_id: climate
```

| Key | Type | Default | Description |
|---|---|---|---|
| [Section keys](#section-keys) | | | `type`, `title`, `target` |

## lcars-controls

**Rounded LCARS pills that toggle the lights, switches, fans and toggle helpers of the target.** Tap a pill to toggle it, hold it for its more-info dialog.

- Two pills sit side by side, at most 16. A pill shows its state by colour.

```yaml
type: sections
sections:
  - strategy:
      type: custom:lcars-controls
      target:
        area_id: kitchen
```

| Key | Type | Default | Description |
|---|---|---|---|
| [Section keys](#section-keys) | | | `type`, `title`, `target` |

## lcars-blocks

**A Picard code-block panel: a small block per light, switch, fan or toggle helper, lit in the accent while it is on.** It shows the same entities as LCARS controls, in the denser Picard style.

- Blocks sit two wide beside a thin bar. Tap a block to toggle it, hold it for its more-info dialog. At most 24.

```yaml
type: sections
sections:
  - strategy:
      type: custom:lcars-blocks
      title: SYSTEMS
      target:
        floor_id: upstairs
```

| Key | Type | Default | Description |
|---|---|---|---|
| [Section keys](#section-keys) | | | `type`, `title`, `target` |
