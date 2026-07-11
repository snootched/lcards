# Rule Conditions

The `when` block of a rule evaluates to `true` or `false`. When it matches, the rule's `apply` block fires. When it stops matching, the patch is removed.

---

## All Conditions at a Glance

| Condition type | Key | What it checks |
|---------------|-----|----------------|
| **Entity state** | `entity` | Entity state against a comparison |
| **Entity attribute** | `entity_attr` | Named entity attribute against a comparison |
| **Map range** | `map_range_cond` | Entity state linearly mapped to a new scale, then compared |
| **Time range** | `time_between` | Current time falls within a `"HH:MM-HH:MM"` window |
| **Day of week** | `weekday_in` | Current day is in a list |
| **Sun elevation** | `sun_elevation` | Sun is `above`/`below` a degree threshold |
| **Random chance** | `random_chance` | Evaluates true with a given probability (0.0–1.0) |
| **JavaScript** | `condition` / `javascript` | Arbitrary JS expression — returns truthy |
| **Jinja2** | `condition` / `jinja2` | Arbitrary HA Jinja2 template — returns truthy |
| **All of (AND)** | `all` | Every sub-condition must be true |
| **Any of (OR)** | `any` | At least one sub-condition must be true |
| **Not (NOT)** | `not` | Inverts a single sub-condition |

---

## Logical Operators

Combine any conditions with `all`, `any`, and `not`. They nest arbitrarily.

### `all` — AND

```yaml
when:
  all:
    - entity: binary_sensor.motion
      state: "on"
    - entity: input_boolean.night_mode
      state: "on"
```

Shorthand: a bare list at the top level is treated as `all`:

```yaml
when:
  - entity: binary_sensor.motion
    state: "on"
  - entity: input_boolean.night_mode
    state: "on"
```

### `any` — OR

```yaml
when:
  any:
    - entity: binary_sensor.door_front
      state: "on"
    - entity: binary_sensor.door_back
      state: "on"
```

### `not` — NOT

```yaml
when:
  not:
    entity: input_boolean.away_mode
    state: "on"
```

### Nested logic

```yaml
when:
  all:
    - entity: binary_sensor.motion
      state: "on"
    - any:
        - time_between: "08:00-12:00"
        - time_between: "14:00-20:00"
    - not:
        entity: input_boolean.guest_mode
        state: "on"
```

---

## Entity Conditions

### State check

```yaml
when:
  entity: light.living_room
  state: "on"           # alias for 'equals'
```

### Attribute check

```yaml
when:
  entity_attr: light.living_room
  attribute: brightness
  above: 128
```

### Comparison operators

All operators work on both `entity` state and `entity_attr` values.

| Operator | Type | Example | Description |
|----------|------|---------|-------------|
| `state` | string | `state: "on"` | Exact match (alias for `equals`) |
| `equals` | string / number | `equals: "on"` | Exact equality (`==`) |
| `not_equals` | string / number | `not_equals: "off"` | Not equal (`!=`) |
| `above` | number | `above: 25` | Numeric greater-than (`>`) |
| `at_least` | number | `at_least: 25` | Numeric greater-than-or-equal (`>=`) |
| `below` | number | `below: 90` | Numeric less-than (`<`) |
| `at_most` | number | `at_most: 90` | Numeric less-than-or-equal (`<=`) |
| `in` | list | `in: ["on", "idle"]` | State is in list |
| `not_in` | list | `not_in: ["off", "unavailable"]` | State is not in list |
| `regex` | string | `regex: "^heat"` | State matches regular expression |

`above` and `below` can be combined in a single condition to express a range:

```yaml
when:
  entity: sensor.temperature
  above: 18
  below: 26
```

### Examples

```yaml alternatives
# Exact state match
when:
  entity: input_select.mode
  equals: "night"

# Not off or unavailable
when:
  entity: light.desk
  not_in: ["off", "unavailable"]

# Attribute threshold
when:
  entity_attr: light.living_room
  attribute: brightness
  above: 200

# Regex — match any "heating*" state
when:
  entity: climate.lounge
  regex: "^heat"
```

---

## Time Conditions

### Time range

```yaml
when:
  time_between: "22:00-06:00"   # wraps past midnight automatically
```

::: info Reactivity
The Rules Engine is reactive — it only re-evaluates when a watched entity changes. Add `entity: sensor.time` to purely time-based rules so they re-evaluate every minute.
:::

```yaml
when:
  all:
    - entity: sensor.time      # triggers re-evaluation every minute
    - time_between: "22:00-06:00"
```

### Day of week

```yaml
when:
  weekday_in: [mon, tue, wed, thu, fri]
```

Valid values: `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`.

### Sun elevation

```yaml alternatives
# Night — sun below horizon
when:
  sun_elevation:
    below: 0

# Golden hour — sun low but above horizon
when:
  sun_elevation:
    above: 0
    below: 8
```

---

## Map Range Condition

Linearly maps an entity's numeric state from one scale to another, then applies a comparison against the mapped value. Useful when the raw entity value is in a different unit than the threshold you want to test.

```yaml
when:
  map_range_cond:
    entity: sensor.brightness_raw   # numeric state to read
    input:  [0, 1000]               # raw value range
    output: [0, 100]                # mapped value range
    above: 70                       # compare mapped value — here: > 70%
```

| Property | Required | Description |
|----------|----------|-------------|
| `entity` | ✅ | Entity whose `state` is mapped |
| `input` | ✅ | `[min, max]` — expected range of the raw entity value |
| `output` | ✅ | `[min, max]` — range the value is mapped into |
| `clamp` | ❌ | Clamp input to range before mapping (default `true`) |
| `above` / `below` / `equals` … | ✅ (one) | Comparison applied to the **mapped** value |

---

## Random Chance

Evaluates to `true` with the given probability each time the rule re-evaluates. Value is a float `0.0`–`1.0`.

```yaml
when:
  random_chance: 0.25    # true roughly 25% of the time
```

Useful for stochastic alert animations or randomised accent cycling. Because rules re-evaluate on entity changes, pair with a frequently-changing entity (e.g. `sensor.time`) to get periodic random evaluations.

---

## Template Conditions

For logic that doesn't fit a built-in condition, write JavaScript or Jinja2 directly.

### JavaScript

Use `[[[ ]]]` syntax. Return any truthy value to match. The variables `entity`, `hass`, and `states` are available.

```yaml
when:
  condition: "[[[return states['sensor.temperature'].state > 25]]]"
```

Multi-line (YAML block scalar):

```yaml
when:
  condition: |
    [[[
      const temp = parseFloat(states['sensor.temperature'].state);
      const humid = parseFloat(states['sensor.humidity'].state);
      return temp > 24 && humid > 60;
    ]]]
```

Explicit form (equivalent):

```yaml
when:
  javascript: "return states['light.bedroom'].state === 'on'"
```

**Available variables:**

| Variable | Description |
|----------|-------------|
| `entity` | The card's bound entity object (if any) |
| `hass` | Full Home Assistant object |
| `states` | `hass.states` — shorthand for all entity states |

### Jinja2

Use `{{ }}` syntax. The template is evaluated by Home Assistant's engine. Return any truthy value.

```yaml
when:
  condition: "{{ states('sensor.temperature') | float > 25 }}"
```

Explicit form:

```yaml
when:
  jinja2: "{{ states('climate.lounge') == 'heat' }}"
```

### Choosing between JS and Jinja2

| | JavaScript | Jinja2 |
|---|---|---|
| Evaluated by | Browser | Home Assistant server |
| Latency | Synchronous, instant | Async round-trip |
| Access to HA functions | ❌ (use `states` directly) | ✅ (`is_state`, `state_attr`, filters…) |
| Best for | Fast logic, math, multi-entity | HA-native functions, formatted values |

---

## Combining Conditions — Full Example

```yaml
rules:
  - id: comfort-alert
    when:
      all:
        # Temperature out of range
        - entity: sensor.temperature
          above: 26
        # Not already in alert mode
        - not:
            entity: input_boolean.alert_active
            state: "on"
        # Only during occupied hours
        - any:
            - time_between: "07:00-23:00"
            - entity: binary_sensor.presence
              state: "on"
    apply:
      overlays:
        tag:status:
          style:
            color: "{theme:colors.alert.yellow}"
```

---

## See Also

- [Rules Engine](index.md) — rule structure, apply block, priority, examples
- [Templates](../templates/) — template syntax used outside of rules
