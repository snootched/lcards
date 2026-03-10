# Templates

LCARdS cards support dynamic content through four template syntaxes. You can mix them freely in most string values.

---

## Syntax Overview

### 1. Token Templates `{...}`

Simple substitutions for entity state, attributes, theme values, and DataSource values.

```yaml
text:
  label:
    content: "{entity.state}"                          # Entity state
  sublabel:
    content: "{entity.attributes.brightness}"          # Attribute
  title:
    content: "{theme:palette.moonlight}"               # Theme token
  reading:
    content: "{ds:temp:.1f}°C"                         # DataSource with format
```

**Available tokens:**

| Token | Value |
|-------|-------|
| `{entity.state}` | Current entity state string |
| `{entity.attributes.NAME}` | Any entity attribute |
| `{theme:token.path}` | Theme token value — see [Themes](../themes/README.md) |
| `{ds:source_name}` | DataSource current value |
| `{datasource:source:.2f}` | DataSource with format specifier |
| `{datasource:source.processor:.0f}` | Specific processor buffer with format |

**Format specifiers** follow Python `str.format()` style:

| Specifier | Example | Result |
|-----------|---------|--------|
| `:.1f` | `{ds:temp:.1f}` | `21.3` (1 decimal) |
| `:.0f` | `{ds:temp:.0f}` | `21` (integer) |
| `:.2f` | `{ds:temp:.2f}` | `21.34` (2 decimals) |
| `:%` | `{ds:progress:%}` | `0.75%` (percentage) |

---

### 2. JavaScript Templates `[[[...]]]`

For any logic or calculation. Return the final value.

```yaml
text:
  label:
    content: "[[[return entity.state === 'on' ? 'Active' : 'Inactive']]]"

  brightness:
    content: "[[[return Math.round(entity.attributes.brightness / 255 * 100) + '%']]]"

  climate_status:
    content: >
      [[[
        const state = entity.state;
        const temp = entity.attributes.current_temperature;
        return state === 'heating' ? `Heating to ${entity.attributes.temperature}°` : `${temp}°`;
      ]]]
```

**Available context:**

| Variable | Type | Contents |
|----------|------|----------|
| `entity` | object | Current entity state — `entity.state`, `entity.attributes.*`, `entity.entity_id`, `entity.last_changed` |
| `hass` | object | Full Home Assistant object — `hass.states`, `hass.services`, `hass.user`, `hass.themes` |
| `config` | object | This card's full config |
| `theme` | object | Current theme token tree |

---

### 3. Jinja2 Templates `{{...}}`

Evaluated server-side by Home Assistant. Supports all HA template functions.

```yaml
text:
  label:
    content: "{{ states('sensor.temperature') }}°C"
  status:
    content: "{% if is_state('light.kitchen', 'on') %}On{% else %}Off{% endif %}"
  diff:
    content: "{{ (states('sensor.temp_inside')|float - states('sensor.temp_outside')|float)|round(1) }}°"
```

> [!NOTE]
> Jinja2 templates are evaluated asynchronously by HA. There may be a brief delay before values appear after a page load.

---

### 4. DataSource Templates `{ds:...}` / `{datasource:...}`

For values from a named [DataSource](../datasources/README.md). Supports format specifiers and processor buffer access.

```yaml
data_sources:
  temp:
    entity: sensor.temperature
    processing:
      f: { type: convert_unit, from: c, to: f }

text:
  value:
    content: "{ds:temp:.1f}°C"              # Current value, 1 decimal
    # Or from a specific processor buffer:
    # content: "{datasource:temp.f:.0f}°F"
```

---

## Where Templates Work

Templates are evaluated in most string-valued config properties:

- `text.*.content` — label text
- `style.*.color.*` — colour values when referencing theme tokens
- `tap_action.service_data.*` — action parameters
- `tap_action.navigation_path` — dashboard path
- `tap_action.url_path` — URL
- `icon` — icon name
- `shape_texture.config.fill_pct` — numeric parameters

---

## Template Evaluation Order

When a value could match multiple syntaxes, evaluation proceeds in this order:

1. `[[[...]]]` — JavaScript (evaluated first)
2. `{ds:...}` / `{datasource:...}` — DataSource
3. `{{...}}` — Jinja2 (HA server-evaluated)
4. `{token}` — Token substitution (evaluated last)

---

## State-Based Colours

Colours support state variants without templates. This is the recommended approach for colour changes on entity state:

```yaml
style:
  border:
    color:
      default: "var(--lcards-inactive)"
      active: "var(--lcards-orange)"
      inactive: "var(--lcards-inactive)"
      unavailable: "var(--lcards-alert-red)"
      heat: "var(--lcards-alert-red)"        # Custom state — exact match
      cool: "var(--lcards-blue)"             # Custom state — exact match
```

See [Colours](../colours.md) for the full state classification table and all supported formats.

---

## Computed Colour Tokens

The theme resolver supports derived colours in any colour field:

```yaml
style:
  border:
    color:
      active: "darken(var(--lcards-orange), 0.2)"
      inactive: "alpha(var(--lcards-orange), 0.3)"
  text:
    value:
      color: "lighten(var(--lcards-blue), 0.15)"
```

---

## Related

- [DataSources](../datasources/README.md)
- [Themes](../themes/README.md)
- [Colours](../colours.md)
