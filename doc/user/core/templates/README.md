# Templates

LCARdS cards support dynamic content through four template syntaxes. You can mix them freely in most string values.

---

## Syntax Overview

### 1. Token Templates `{...}`

Simple substitutions for entity state, attributes, and theme values.

```yaml
text:
  label:
    content: "{entity.state}"          # Entity state
  sublabel:
    content: "{entity.attributes.brightness}"  # Attribute
  title:
    content: "{theme:palette.moonlight}"       # Theme token
```

**Available tokens:**

| Token | Value |
|-------|-------|
| `{entity.state}` | Current entity state string |
| `{entity.attributes.NAME}` | Any entity attribute |
| `{theme:token.path}` | Theme token value |
| `{ds:source_name}` | DataSource current value |
| `{datasource:source:.2f}` | DataSource with format spec |

---

### 2. JavaScript Templates `[[[...]]]`

For any logic or calculation. Return the final value.

```yaml
text:
  label:
    content: "[[[return entity.state === 'on' ? 'Active' : 'Inactive']]]"

  brightness:
    content: "[[[return Math.round(entity.attributes.brightness / 255 * 100) + '%']]]"
```

The context provides:
- `entity` — current entity state object
- `hass` — full Home Assistant object
- `config` — this card's config
- `theme` — current theme object

---

### 3. Jinja2 Templates `{{...}}`

Evaluated server-side by Home Assistant. Supports all HA template functions.

```yaml
text:
  label:
    content: "{{ states('sensor.temperature') }}°C"
  status:
    content: "{% if is_state('light.kitchen', 'on') %}On{% else %}Off{% endif %}"
```

> [!NOTE]
> Jinja2 templates are evaluated asynchronously by HA. There may be a brief delay before values appear after a page load.

---

### 4. DataSource Templates `{ds:...}` / `{datasource:...}`

For values from a named [DataSource](../datasources/README.md). Supports format specifiers.

```yaml
data_sources:
  temp:
    entity: sensor.temperature
    processing:
      f: { type: convert_unit, from: c, to: f }

text:
  value:
    content: "{ds:temp:.1f}°C"          # Current value, 1 decimal
    # Or from a specific processor:
    # content: "{datasource:temp.f:.0f}°F"
```

---

## Where Templates Work

Templates are evaluated in most string-valued config properties:

- `text.*.content` — label text
- `style.*.color.*` — colour values (when referencing theme tokens)
- `tap_action.service_data.*` — action parameters
- `icon` — icon name

---

## Template Evaluation Order

When a value could match multiple syntaxes, evaluation proceeds:

```mermaid
flowchart LR
    A[Config value] --> B{[[[...]]]?}
    B -- yes --> C[JavaScript eval]
    B -- no --> D{ds: token?}
    D -- yes --> E[DataSource lookup]
    D -- no --> F{{...} Jinja2?}
    F -- yes --> G[HA server eval]
    F -- no --> H[Token substitution]

    style A fill:#2f3749,stroke:#52596e,color:#fff
    style C fill:#ffb399,stroke:#e7442a,color:#000
    style E fill:#ffb399,stroke:#e7442a,color:#000
    style G fill:#ffb399,stroke:#e7442a,color:#000
    style H fill:#ffb399,stroke:#e7442a,color:#000
```

---

## State-Based Colours

Colours support state variants without templates. This is the recommended approach for colour changes on entity state:

```yaml
style:
  border:
    color:
      default: "#444444"
      active: "#FF9900"
      inactive: "#222222"
      unavailable: "#880000"
```

States map as:
- `default` — fallback for any unmatched state
- `active` — entity is `on`, `open`, `home`, `playing`, etc.
- `inactive` — entity is `off`, `closed`, `away`, etc.
- `unavailable` — entity is unavailable or unknown
- Any custom state string (e.g. `"buffering"`, `"charging"`) — exact match

---

## Related

- [DataSources](../datasources/README.md)
- [Themes](../themes/README.md)
