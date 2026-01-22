# Template Conditions in Rules

> **Use JavaScript or Jinja2 templates for dynamic rule conditions**
> Write powerful, flexible conditions using JavaScript expressions or Home Assistant templates.

---

## Table of Contents

1. [Overview](#overview)
2. [JavaScript Conditions](#javascript-conditions)
3. [Jinja2 Conditions](#jinja2-conditions)
4. [Choosing Between JavaScript and Jinja2](#choosing-between-javascript-and-jinja2)
5. [Complete Examples](#complete-examples)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Overview

LCARdS supports **two types of template conditions** in rules:

1. **JavaScript** - Using `[[[ ]]]` syntax with direct access to Home Assistant states
2. **Jinja2** - Using `{{ }}` syntax with Home Assistant's template engine

Both types evaluate to boolean (`true`/`false`) and work seamlessly with the rules engine.

### When to Use Templates

Use template conditions when you need:
- ✅ Complex logic (multiple entities, calculations)
- ✅ Numeric comparisons with formulas
- ✅ String manipulation or pattern matching
- ✅ Time-based calculations
- ✅ Attribute access from entities

Use simple entity conditions when:
- ✅ Checking a single entity state
- ✅ Simple above/below thresholds
- ✅ Basic time ranges

---

## JavaScript Conditions

JavaScript conditions use the `[[[  ]]]` syntax and have direct access to Home Assistant's state object.

### Syntax

```yaml
rules:
  - id: example_js_rule
    when:
      any:
        - condition: "[[[return states['light.bedroom'].state === 'on']]]"
    apply:
      # ... your styling
```

**Important:**
- Must be wrapped in `[[[ ]]]` (triple brackets)
- Must include `return` statement
- Expression must evaluate to boolean

### Available Context

Inside JavaScript conditions, you have access to:

| Object | Description | Example |
|--------|-------------|---------|
| `states` | All entity states object | `states['light.bedroom']` |
| `hass` | Full Home Assistant object | `hass.states['sensor.temp']` |
| `entity` | Current entity (if rule has entity) | `entity.state` |

### Accessing Entity States

```javascript
// Get entity state
states['light.bedroom'].state  // 'on' or 'off'

// Get entity attributes
states['climate.living_room'].attributes.temperature  // 72.5

// Get entity last_changed
states['sensor.motion'].last_changed  // timestamp

// Check if entity exists
states['sensor.temp'] !== undefined
```

### Examples

#### Simple State Check

```yaml
rules:
  - id: light_on
    when:
      any:
        - condition: "[[[return states['light.bedroom'].state === 'on']]]"
```

#### Numeric Comparison

```yaml
rules:
  - id: temp_high
    when:
      any:
        - condition: "[[[return parseFloat(states['sensor.temperature'].state) > 25]]]"
```

#### Multiple Entities (AND)

```yaml
rules:
  - id: both_lights_on
    when:
      any:
        - condition: |
            [[[
              return states['light.bedroom'].state === 'on' &&
                     states['light.bathroom'].state === 'on'
            ]]]
```

#### Multiple Entities (OR)

```yaml
rules:
  - id: any_light_on
    when:
      any:
        - condition: |
            [[[
              return states['light.bedroom'].state === 'on' ||
                     states['light.bathroom'].state === 'on' ||
                     states['light.kitchen'].state === 'on'
            ]]]
```

#### Attribute Access

```yaml
rules:
  - id: hvac_cooling
    when:
      any:
        - condition: "[[[return states['climate.house'].attributes.hvac_action === 'cooling']]]"
```

#### Battery Level Check

```yaml
rules:
  - id: low_battery
    when:
      any:
        - condition: "[[[return states['sensor.phone_battery'].attributes.battery_level < 20]]]"
```

#### Time-Based with Calculation

```yaml
rules:
  - id: working_hours
    when:
      any:
        - condition: |
            [[[
              const hour = new Date().getHours();
              return hour >= 9 && hour < 17;
            ]]]
```

#### Complex Multi-Condition

```yaml
rules:
  - id: comfort_check
    when:
      any:
        - condition: |
            [[[
              const temp = parseFloat(states['sensor.temperature'].state);
              const humidity = parseFloat(states['sensor.humidity'].state);
              const hvacOn = states['climate.ac'].state !== 'off';

              return (temp > 25 || humidity > 60) && !hvacOn;
            ]]]
```

---

## Jinja2 Conditions

Jinja2 conditions use Home Assistant's native template engine with `{{ }}` syntax.

### Syntax

```yaml
rules:
  - id: example_jinja_rule
    when:
      any:
        - condition: "{{ states('light.bedroom') == 'on' }}"
    apply:
      # ... your styling
```

**Important:**
- Must be wrapped in `{{ }}` (double curly braces)
- Must be quoted in YAML (use double or single quotes)
- Expression must evaluate to boolean (`true`/`false`)

### Home Assistant Functions

| Function | Description | Example |
|----------|-------------|---------|
| `states('entity_id')` | Get entity state | `states('light.bedroom')` |
| `state_attr('entity', 'attr')` | Get attribute | `state_attr('climate.ac', 'temperature')` |
| `is_state('entity', 'state')` | Check state equality | `is_state('light.bedroom', 'on')` |
| `has_value('entity')` | Check if entity has value | `has_value('sensor.temp')` |

### Jinja2 Filters

| Filter | Description | Example |
|--------|-------------|---------|
| `\| float` | Convert to number | `states('sensor.temp') \| float` |
| `\| int` | Convert to integer | `states('sensor.count') \| int` |
| `\| round(n)` | Round to n decimals | `states('sensor.temp') \| float \| round(1)` |
| `\| upper` | Uppercase | `states('sensor.mode') \| upper` |
| `\| lower` | Lowercase | `states('sensor.mode') \| lower` |

### Examples

#### Simple State Check

```yaml
rules:
  - id: light_on
    when:
      any:
        - condition: "{{ states('light.bedroom') == 'on' }}"
```

#### Numeric Comparison

```yaml
rules:
  - id: temp_high
    when:
      any:
        - condition: "{{ states('sensor.temperature') | float > 25 }}"
```

#### Multiple Entities (AND)

```yaml
rules:
  - id: both_lights_on
    when:
      any:
        - condition: "{{ states('light.bedroom') == 'on' and states('light.bathroom') == 'on' }}"
```

#### Multiple Entities (OR)

```yaml
rules:
  - id: any_light_on
    when:
      any:
        - condition: "{{ states('light.bedroom') == 'on' or states('light.bathroom') == 'on' or states('light.kitchen') == 'on' }}"
```

#### Attribute Access

```yaml
rules:
  - id: hvac_cooling
    when:
      any:
        - condition: "{{ state_attr('climate.house', 'hvac_action') == 'cooling' }}"
```

#### Battery Level Check

```yaml
rules:
  - id: low_battery
    when:
      any:
        - condition: "{{ state_attr('sensor.phone_battery', 'battery_level') | int < 20 }}"
```

#### Using is_state Helper

```yaml
rules:
  - id: door_open
    when:
      any:
        - condition: "{{ is_state('binary_sensor.front_door', 'on') }}"
```

#### Complex Multi-Condition

```yaml
rules:
  - id: comfort_check
    when:
      any:
        - condition: "{{ (states('sensor.temperature') | float > 25 or states('sensor.humidity') | float > 60) and not is_state('climate.ac', 'cool') }}"
```

---

## Choosing Between JavaScript and Jinja2

### Use JavaScript When:

✅ **You prefer JavaScript syntax**
- More familiar with JavaScript than Jinja2
- Want to use modern ES6+ features
- Need complex multi-line logic

✅ **You need local calculations**
- Time zone handling (`new Date()`)
- Math operations
- String manipulation with JS methods

✅ **You want IDE support**
- Better autocomplete in most editors
- Syntax highlighting for JavaScript

### Use Jinja2 When:

✅ **You prefer Home Assistant templates**
- Already use Jinja2 in HA automations
- Familiar with HA template functions
- Want consistency with HA config

✅ **You need HA-specific functions**
- `is_state()`, `state_attr()` helpers
- HA template filters
- Time-based HA functions

✅ **Shorter, simpler expressions**
- One-line comparisons
- Basic state checks
- Simple numeric comparisons

### Performance

Both JavaScript and Jinja2 have similar performance:
- JavaScript: ~0.01-0.1ms per evaluation
- Jinja2: ~0.1-0.5ms per evaluation (includes HA call)

**Recommendation:** Choose based on preference, not performance.

---

## Complete Examples

### Example 1: Temperature Monitoring (Both Syntaxes)

#### JavaScript Version

```yaml
rules:
  # Critical temperature
  - id: temp_critical_js
    priority: 100
    when:
      any:
        - condition: "[[[return parseFloat(states['sensor.temperature'].state) > 35]]]"
    apply:
      overlays:
        temp_display:
          style:
            color: var(--lcars-red)
            glow_size: 8

  # Normal temperature
  - id: temp_normal_js
    priority: 10
    when:
      any:
        - condition: "[[[return parseFloat(states['sensor.temperature'].state) <= 25]]]"
    apply:
      overlays:
        temp_display:
          style:
            color: var(--lcars-blue)
```

#### Jinja2 Version

```yaml
rules:
  # Critical temperature
  - id: temp_critical_jinja
    priority: 100
    when:
      any:
        - condition: "{{ states('sensor.temperature') | float > 35 }}"
    apply:
      overlays:
        temp_display:
          style:
            color: var(--lcars-red)
            glow_size: 8

  # Normal temperature
  - id: temp_normal_jinja
    priority: 10
    when:
      any:
        - condition: "{{ states('sensor.temperature') | float <= 25 }}"
    apply:
      overlays:
        temp_display:
          style:
            color: var(--lcars-blue)
```

### Example 2: Multi-Sensor Alert (JavaScript)

```yaml
rules:
  - id: climate_alert
    when:
      any:
        - condition: |
            [[[
              const temp = parseFloat(states['sensor.temperature'].state);
              const humidity = parseFloat(states['sensor.humidity'].state);
              const motion = states['binary_sensor.motion'].state === 'on';
              const acOn = states['climate.ac'].state !== 'off';

              // Alert if: (hot OR humid) AND motion detected AND AC not running
              return (temp > 27 || humidity > 65) && motion && !acOn;
            ]]]
    apply:
      base_svg:
        filter_preset: red-alert
      overlays:
        alert_text:
          style:
            color: var(--lcars-red)
            font_size: 36
            glow_size: 12
```

### Example 3: Time-Based Modes (Jinja2)

```yaml
rules:
  # Morning mode (6am-12pm)
  - id: morning_mode
    priority: 100
    when:
      all:
        - entity: sensor.time  # Updates every minute
          state_available: true
        - condition: "{{ now().hour >= 6 and now().hour < 12 }}"
    apply:
      base_svg:
        filter_preset: subtle
      overlays:
        mode_text:
          content: "Good Morning"
          style:
            color: var(--lcars-orange)

  # Evening mode (6pm-11pm)
  - id: evening_mode
    priority: 90
    when:
      all:
        - entity: sensor.time
          state_available: true
        - condition: "{{ now().hour >= 18 and now().hour < 23 }}"
    apply:
      base_svg:
        filter_preset: dimmed
      overlays:
        mode_text:
          content: "Good Evening"
          style:
            color: var(--lcars-blue)
```

---

## Best Practices

### 1. Use YAML Pipe for Multi-Line JavaScript

```yaml
# ✅ Good - Readable multi-line
- condition: |
    [[[
      const temp = parseFloat(states['sensor.temperature'].state);
      return temp > 25 && temp < 30;
    ]]]

# ❌ Bad - Hard to read
- condition: "[[[const temp = parseFloat(states['sensor.temperature'].state); return temp > 25 && temp < 30;]]]"
```

### 2. Always Return Boolean

```yaml
# ✅ Good - Explicit boolean
- condition: "[[[return states['light.bedroom'].state === 'on']]]"

# ❌ Bad - Truthy but not boolean
- condition: "[[[return states['light.bedroom'].state]]]"
```

### 3. Handle Missing Entities

```yaml
# ✅ Good - Check entity exists
- condition: |
    [[[
      const sensor = states['sensor.temperature'];
      if (!sensor) return false;
      return parseFloat(sensor.state) > 25;
    ]]]

# ❌ Bad - Will error if sensor doesn't exist
- condition: "[[[return parseFloat(states['sensor.temperature'].state) > 25]]]"
```

### 4. Use parseFloat for Numeric States

```yaml
# ✅ Good - Convert to number
- condition: "[[[return parseFloat(states['sensor.temp'].state) > 25]]]"

# ❌ Bad - String comparison
- condition: "[[[return states['sensor.temp'].state > 25]]]"  # "30" > 25 might not work as expected
```

### 5. Quote Jinja2 Templates in YAML

```yaml
# ✅ Good - Quoted
- condition: "{{ states('light.bedroom') == 'on' }}"

# ❌ Bad - Not quoted (YAML parsing error)
- condition: {{ states('light.bedroom') == 'on' }}
```

### 6. Use entity Parameter When Available

For rules that already have an entity, you can use the `entity` context:

```yaml
rules:
  - id: light_state_check
    when:
      all:
        - entity: light.bedroom  # This is available as 'entity' in JS
          state_available: true
        - condition: "[[[return entity.state === 'on']]]"  # Use 'entity' instead of states lookup
```

---

## Troubleshooting

### JavaScript Conditions

#### Error: "SyntaxError: Unexpected token"

**Problem:** Invalid JavaScript syntax

```yaml
# ❌ Wrong
- condition: "[[[return states['light.bedroom'].state = 'on']]]"  # Single = is assignment

# ✅ Correct
- condition: "[[[return states['light.bedroom'].state === 'on']]]"  # Triple === for equality
```

#### Error: "Cannot read property 'state' of undefined"

**Problem:** Entity doesn't exist

```yaml
# ❌ Wrong - No null check
- condition: "[[[return states['sensor.missing'].state === 'on']]]"

# ✅ Correct - Check existence
- condition: |
    [[[
      const sensor = states['sensor.missing'];
      return sensor && sensor.state === 'on';
    ]]]
```

#### Condition Always False

**Problem:** String comparison instead of numeric

```yaml
# ❌ Wrong - "25" as string
- condition: "[[[return states['sensor.temp'].state > 20]]]"  # Might compare strings

# ✅ Correct - Convert to number
- condition: "[[[return parseFloat(states['sensor.temp'].state) > 20]]]"
```

### Jinja2 Conditions

#### Error: "TemplateError: Must be quoted"

**Problem:** Jinja2 template not quoted in YAML

```yaml
# ❌ Wrong
- condition: {{ states('light.bedroom') == 'on' }}

# ✅ Correct
- condition: "{{ states('light.bedroom') == 'on' }}"
```

#### Condition Not Updating

**Problem:** Missing entity trigger

For time-based Jinja2 conditions, add `sensor.time`:

```yaml
# ❌ Wrong - Won't update
when:
  any:
    - condition: "{{ now().hour >= 18 }}"

# ✅ Correct - Includes trigger
when:
  all:
    - entity: sensor.time  # Triggers every minute
      state_available: true
    - condition: "{{ now().hour >= 18 }}"
```

#### Error: "Result is not boolean"

**Problem:** Jinja2 returns string instead of boolean

```yaml
# ❌ Wrong - Returns 'True' as string
- condition: "{{ states('light.bedroom') }}"

# ✅ Correct - Explicit comparison
- condition: "{{ states('light.bedroom') == 'on' }}"
```

### General Issues

#### Rule Not Triggering

1. **Check logs** - Enable debug mode to see rule evaluation:
   ```javascript
   window.lcards.debug.rules.enable()
   ```

2. **Verify entity exists** - Check entity ID in Developer Tools → States

3. **Test condition separately** - Test JavaScript/Jinja2 in browser console or HA Templates

4. **Check priority** - Higher priority rules might be stopping evaluation

#### Rule Applying Wrong Values

1. **Check rule order** - Multiple matching rules apply in priority order
2. **Use `stop: true`** - Stop lower-priority rules from overriding
3. **Test incrementally** - Comment out other rules to isolate issue

---

## Related Documentation

- **[Rules Configuration](rules.md)** - Complete rules engine documentation
- **[JavaScript Quick Start](../../examples/JAVASCRIPT_RULES_QUICK_START.md)** - JavaScript examples
- **[Jinja2 Examples](../../examples/test-jinja2-rules.yaml)** - Jinja2 test cases
- **[Rules Engine Architecture](../../architecture/subsystems/rules-engine.md)** - Technical implementation

---

[← Back to Configuration](./README.md) | [Rules Guide](./rules.md)
