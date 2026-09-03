# Templates

LCARdS cards support dynamic content through four template syntaxes. You can mix them freely in most string values.

---

## Syntax Overview

### 1. Token Templates `{...}`

Simple substitutions for entity state, attributes, theme values, and data source values.

```yaml
text:
  label:
    content: "{entity.state}"                          # Entity state
  sublabel:
    content: "{entity.attributes.brightness}"          # Attribute
  other_entity:
    content: "{states.sensor.outdoor_temp.state}"      # A DIFFERENT entity's state
  title:
    content: "{theme:colors.text.onDark}"              # Theme token
  reading:
    content: "{ds:temp}"                              # DataSource: HA-native (locale-formatted + unit)
```

**Available tokens:**

| Token | Value |
|-------|-------|
| `{entity.state}` | Current entity state string |
| `{entity.attributes.NAME}` | Any entity attribute by name |
| `{states.domain.object_id.state}` | State of a **different** entity, referenced by full entity ID |
| `{states.domain.object_id.attributes.NAME}` | Attribute `NAME` of a different entity |
| `{config.NAME}` | A value from this card's own config |
| `{variables.NAME}` | A value from `config.variables` |
| `{hass.user.name}` | The current Home Assistant user's name |
| `{theme:token.path}` | Theme token value — see [Themes](../themes/) |

For DataSource values (`{ds:...}`), see [Section 4](#4-data-source-templates-ds--datasource) below.

> [!NOTE]
> This single-brace `{...}` syntax is an LCARdS-specific shorthand, not a Home Assistant or Jinja2 convention — it exists because it resolves synchronously (no network round trip), which some render paths require. If you already know HA's Jinja2 templating from automations or other cards, reach for [Jinja2 templates](#3-jinja2-templates) (`{{ }}`, real double braces) instead — it's the actual HA template engine and supports everything you already know (`states()`, `state_attr()`, filters, etc.). Use single-brace tokens when you specifically need the synchronous fast path.

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
| `states` | object | Shorthand for `hass.states` — a different entity's state object, e.g. `states['sensor.outdoor_temp'].state` |
| `config` | object | This card's full config |
| `variables` | object | `config.variables` |
| `theme` | object | Current theme token tree |
| `user` | object | Current Home Assistant user (`hass.user`) |

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

### 4. Data Source Templates `{ds:...}` / `{datasource:...}`

For values from a named [data source](../datasources/). The `{ds:name}` shorthand and the `{datasource:name}` long form are equivalent.

**No format specifier** → HA-native display: locale-formatted number + unit from entity metadata (e.g. `4,73 °C`). Equivalent to HA's `haFormatEntityState()`.

**With a format specifier** → you own the output. The number is formatted to the spec and returned with **no auto-unit** — append any suffix you want.

| Specifier | Example | Result |
|-----------|---------|--------|
| *(none)* | `{ds:temp}` | `4,73 °C` — HA-native, locale-formatted + unit |
| `:.Nf` | `{ds:temp:.1f}` | `4,7` — N decimal places, no unit |
| `:int` | `{ds:temp:int}` | `5` — rounded integer, no unit |
| `:.N%` | `{ds:progress:.0%}` | `75%` — percentage |
| `:str` | `{ds:label:str}` | raw string coercion |

To access a specific **processor buffer**, use the long form with a dotted path:

```yaml
data_sources:
  temp:
    entity: sensor.temperature
    processing:
      f: { type: convert_unit, from: c, to: f }

text:
  value:
    content: "{ds:temp}"                    # HA-native: "4,73 °C"
    # content: "{ds:temp:.2f} °C"           # explicit precision: "4,73 °C" (no auto-unit)
    # content: "{datasource:temp.f:.0f}"    # processor buffer: "76" (Fahrenheit, no unit)
```

See [Data Sources](../datasources/) for declaring and configuring sources.

---

## Where Templates Work

Templates are evaluated in most string-valued config properties:

- `text.*.content` — label text
- `style.*` — style values, including colours and token references
- `tap_action.service_data.*` — action parameters
- `tap_action.navigation_path` — dashboard path
- `tap_action.url_path` — URL
- `icon` — icon name
- `rules.*.when.*.condition` — rule condition expressions (JS and Jinja2) — see [Rule Conditions](../rules/conditions.md)
- Slider card `style.ranges[].value` / `.min` / `.max` — marker/band positions (JS, token, and DataSource only — no Jinja2, since these resolve synchronously on every state update) and `style.ranges[].label.text` — marker caption text (all 4 types, including Jinja2) — see [Slider Card](../../cards/slider-card/)

---

## Template Evaluation Order

When a value could match multiple syntaxes, evaluation proceeds in this order:

1. `[[[...]]]` — JavaScript (evaluated first)
2. `{token}` — Token substitution
3. `{ds:...}` / `{datasource:...}` — data source
4. `{{...}}` — Jinja2 (HA server-evaluated, async)

---

## Entity Tracking & Reactivity

LCARdS re-renders a card (and re-evaluates all its templates) whenever a relevant entity changes state.

### Automatic tracking

Entity references in **Jinja2** templates are detected automatically — no extra config needed:

```yaml
text:
  label:
    content: "{{ states('sensor.temperature') }}°C"   # ✅ auto-tracked
  status:
    content: >-
      {% if is_state('binary_sensor.motion', 'on') %}
        Motion detected
      {% endif %}                                       # ✅ sensor tracked automatically
```

The following Jinja2 call patterns are scanned:
`states()`, `state_attr()`, `is_state()`, `is_state_attr()`, `has_value()`

### Manual tracking with `triggers_update`

JavaScript templates (`[[[...]]]`) are opaque to static analysis — LCARdS cannot know which entities they reference. Declare them explicitly:

```yaml
type: custom:lcards-button
entity: light.kitchen
triggers_update:
  - binary_sensor.desk_sensor_motion
  - sensor.toronto_temperature

text:
  label:
    content: |
      [[[
        const motion = hass.states['binary_sensor.desk_sensor_motion']?.state;
        const temp   = hass.states['sensor.toronto_temperature']?.state;
        return motion === 'on' ? `Motion (${temp}°)` : 'Clear';
      ]]]
```

`triggers_update` also works for **token** or **data source** templates whose entity IDs are assembled dynamically and cannot be inferred at parse time.

> [!NOTE]
> `triggers_update` is additive — the card's primary `entity` is always tracked regardless.

