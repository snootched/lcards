---
description: "What LCARdS text fields show: templates in content (tokens, JavaScript, Jinja2, data sources), literal text with template: false, and display_format for entity states (friendly, raw, parts, unit)."
---

# Content and Formats

What a text field shows: fixed text, or a template that follows an entity, and how entity states and attributes are written out. The other field keys are on the [Text Fields](./text-fields#per-field-options) page.

## content

**The text the field shows: plain words, or a template that works out a value.** Templates follow their entities, so the text changes when the state does.

- `content` takes all four [template](/core/templates/) types: `{entity.state}` tokens, `[[[ ]]]` JavaScript, `{{ }}` Jinja2 (worked out by Home Assistant) and `{ds:name}` data sources.
- Set `template: false` to show text such as `{entity.state}` literally.
- A field whose content comes out empty is not drawn.

```yaml live controls
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
text:
  default:
    font_size: 13
    color: var(--lcars-black)
  token:
    content: "{entity.state}" # token
    position: top-left
  script:
    content: "[[[return Math.round((entity.attributes.brightness || 0) / 255 * 100) + '%']]]" # JavaScript
    position: top-right
  literal:
    content: "{entity.state}"
    template: false # shown as written
    position: bottom-left
grid_options:
  rows: 2
```

```yaml alternatives
# Token substitution
content: "{entity.state}"
content: "{entity.attributes.brightness}"
content: "{theme:colors.text.onDark}"

# JavaScript
content: "[[[return Math.round(entity.attributes.brightness / 255 * 100) + '%']]]"

# Jinja2 (worked out by Home Assistant)
content: "{{ states('sensor.temperature') }}°C"

# Data source: Home Assistant's own formatting, with the unit
content: "{ds:temp}"
# Data source: your own precision, and your own unit
content: "{ds:temp:.1f} °C"
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `content` | string | from the preset, else - | The text. Templates are worked out unless `template` is `false` |
| `template` | boolean | `true` | `false` shows `{...}` and `[[[...]]]` as written |

## display_format

**How entity values in `content` tokens are written: as Home Assistant shows them, as the raw state, or as value and unit.** A door sensor reads `Open` rather than `on`, as on Home Assistant's own cards.

- Set it on one field, or in `text.default` for every field on the card.
- It changes only the text. Which colour or state a card picks (`active`, `inactive` ...) always uses the raw state.
- `[[[ ]]]` JavaScript always gets the raw entity, and `{{ }}` Jinja2 is formatted by Home Assistant, so neither is affected.

| Value | Shows | Example |
|-------|-------|---------|
| `friendly` | Home Assistant's translated display text, as on its own cards | `Open` |
| `raw` | The state or attribute exactly as stored | `on` |
| `parts` | The value and unit from Home Assistant's formatter, joined | `23.5 °C` |
| `unit` | Only the unit | `°C` |

```yaml live
type: custom:lcards-button
entity: sensor.outdoor_temperature
preset: lozenge
text:
  default:
    display_format: parts
    font_size: 16
    color: var(--lcars-black)
  reading:
    content: "{entity.state}" # 12.3 °C
    position: top-left
  unit:
    content: "{entity.state}"
    display_format: unit # °C only
    position: top-right
  stored:
    content: "{entity.state}"
    display_format: raw # 12.3
    position: bottom-left
grid_options:
  rows: 2
```

::: details More about display_format
- **In JavaScript:** call `hass.formatEntityState(entity)` in a `[[[ ]]]` template for the friendly text there.
- **Slider units:** the units the slider adds to its labels come from the same Home Assistant formatter, so they match its display.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `display_format` | string | `friendly` | `friendly`, `raw`, `parts` or `unit` |
