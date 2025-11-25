# RulesEngine Template Syntax Reference

**Status:** Active
**Related:** RulesEngine Jinja2 Integration

---

## Overview

The RulesEngine supports multiple template syntaxes for rule conditions, with automatic detection of template types. This document defines the official syntax for each template type and the detection priority.

---

## Template Types

### 1. Jinja2 Templates (Server-Side)

**Syntax:** `{{ expression }}` or `{% control %}`

**Evaluation:** Server-side via Home Assistant WebSocket API (`render_template`)

**Detection Markers:**
- Double braces: `{{...}}`
- Control structures: `{%...%}`
- Jinja2 functions: `states()`, `state_attr()`, `is_state()`, `now()`
- Filters: `| float`, `| round`, etc.

**Use Cases:**
- Access any Home Assistant entity
- Use Home Assistant helper functions
- Complex aggregations across multiple entities
- Time-based conditions with `now()`

**Examples:**

```yaml
rules:
  # Simple numeric comparison
  - id: temp_high
    when:
      condition: "{{ states('sensor.temperature') | float > 25 }}"
    apply:
      overlays:
        warning:
          style:
            color: red

  # Multiple entity check
  - id: lights_and_temp
    when:
      condition: "{{ states('sensor.temp') | float > 25 and is_state('light.desk', 'on') }}"
    apply:
      overlays:
        alert:
          style:
            visible: true

  # Time-based condition
  - id: evening_hours
    when:
      condition: "{{ now().hour >= 18 and now().hour < 23 }}"
    apply:
      profiles:
        - evening

  # Aggregation
  - id: many_lights_on
    when:
      condition: "{{ states.light | selectattr('state', 'eq', 'on') | list | count > 3 }}"
    apply:
      overlays:
        alert:
          style:
            visible: true

  # State attribute access
  - id: brightness_check
    when:
      condition: "{{ state_attr('light.desk', 'brightness') | int > 128 }}"
    apply:
      overlays:
        bright:
          style:
            visible: true
```

**Available Context in Jinja2:**
- All Home Assistant states via `states()` or `states.<domain>`
- Helper functions: `is_state()`, `state_attr()`, `now()`, `as_timestamp()`
- All Jinja2 filters: `| float`, `| int`, `| round`, `| default`, etc.
- Control structures: `{% if %}`, `{% for %}`, etc.

---

### 2. JavaScript Expressions (Client-Side)

**Syntax:** Plain JavaScript expression (no delimiters)

**Evaluation:** Client-side in browser context

**Detection:** Fallback type if not Jinja2 or tokens

**Use Cases:**
- Simple entity state checks
- Client-side calculations
- Complex boolean logic
- Access to Math, Date functions

**Examples:**

```yaml
rules:
  # Simple state check
  - id: light_on
    when:
      condition: "entity.state === 'on'"
    apply:
      overlays:
        indicator:
          style:
            color: green

  # Complex boolean logic
  - id: bright_light
    when:
      condition: "entity.state === 'on' && entity.attributes.brightness > 128"
    apply:
      overlays:
        bright_indicator:
          style:
            visible: true

  # Math operations
  - id: temp_rounded
    when:
      condition: "Math.round(parseFloat(entity.state)) > 25"
    apply:
      overlays:
        warning:
          style:
            color: red

  # Multi-line complex logic
  - id: color_temp_check
    when:
      condition: |
        entity.state === 'on' &&
        entity.attributes.brightness > 100 &&
        entity.attributes.color_temp < 500
    apply:
      overlays:
        warm_light:
          style:
            visible: true

  # Date/time checks
  - id: recent_update
    when:
      condition: "(Date.now() - new Date(entity.last_updated).getTime()) < 60000"
    apply:
      overlays:
        fresh:
          style:
            visible: true
```

**Available Context in JavaScript:**
- `entity` - Current entity object (if rule has entity context)
- `state` - Shortcut for `entity.state`
- `attributes` - Shortcut for `entity.attributes`
- `hass` - HASS object with all states
- `states` - All HASS states object
- `getEntity(entityId)` - Function to get any entity
- `Math` - JavaScript Math object
- `Date` - JavaScript Date object
- `parseFloat`, `parseInt` - Parsing functions
- `String`, `Number`, `Boolean` - Type constructors

**Security Note:** JavaScript evaluation uses Function constructor, which is safe for trusted rule configurations but should not be used with untrusted user input.

---

### 3. Token Templates (Client-Side)

**Syntax:** `{token.path}` (single braces)

**Evaluation:** Client-side token resolution, then JavaScript evaluation

**Detection Markers:**
- Single braces: `{...}`
- Not Jinja2 double braces: `{{...}}`
- Not MSD datasources: `{sensor.temperature}` (excluded)

**Use Cases:**
- Mix static values with dynamic entity data
- Reference config variables or datasources
- Simple value substitution in expressions

**Examples:**

```yaml
rules:
  # Token in expression
  - id: token_state_check
    when:
      condition: "{entity.state} === 'on'"
    apply:
      overlays:
        indicator:
          style:
            visible: true

  # Multiple tokens
  - id: token_comparison
    when:
      condition: "{entity.attributes.brightness} > {variables.threshold}"
    apply:
      overlays:
        alert:
          style:
            visible: true

  # Token with JavaScript function
  - id: token_with_math
    when:
      condition: "parseFloat({entity.state}) > 25"
    apply:
      overlays:
        warning:
          style:
            color: red

  # Multiple tokens in complex expression
  - id: token_complex
    when:
      condition: "{entity.state} === 'on' && {entity.attributes.brightness} > {config.min_brightness}"
    apply:
      overlays:
        active:
          style:
            visible: true
```

**Token Resolution:**
1. Tokens like `{entity.state}` are extracted
2. Values are resolved from context
3. String values are quoted: `{entity.state}` → `"on"`
4. Numeric values are direct: `{entity.attributes.brightness}` → `150`
5. Resolved code is evaluated as JavaScript expression

**Note:** Tokens are resolved BEFORE JavaScript evaluation, so the result is pure JavaScript code.

---

### 4. Entity Conditions (Existing Syntax)

**Syntax:** YAML object with entity field

**Evaluation:** Compiled condition evaluation (existing system)

**Use Cases:**
- Simple entity comparisons
- Backward compatibility
- Declarative condition style

**Examples:**

```yaml
rules:
  # State match
  - id: light_state
    when:
      entity: light.living_room
      state: "on"
    apply:
      overlays:
        indicator:
          style:
            color: green

  # Numeric comparison
  - id: temp_threshold
    when:
      entity: sensor.temperature
      above: 25
      below: 35
    apply:
      overlays:
        warning:
          style:
            visible: true

  # Logical operators
  - id: complex_entity_condition
    when:
      all:
        - entity: light.desk
          state: "on"
        - entity: sensor.temperature
          above: 20
        - any:
            - entity: binary_sensor.manual_override
              state: "on"
            - time:
                after: "08:00"
    apply:
      overlays:
        status:
          style:
            visible: true
```

**Existing Entity Condition Fields:**
- `entity` - Entity ID
- `state` - Exact state match
- `above` - Greater than (numeric)
- `below` - Less than (numeric)
- `equals` - Numeric equality
- `not_equals` - Numeric inequality
- `in` - Value in list
- `not_in` - Value not in list
- `regex` - Regular expression match

---

## Auto-Detection Logic

### Detection Priority

The RulesEngine automatically detects template type in this order:

1. **Jinja2** (Highest Priority)
   - Most specific syntax
   - Has `{{...}}` or `{%...%}`
   - Has Jinja2 functions: `states()`, `now()`, `is_state()`
   - Has filters: `| float`, `| round`, etc.

2. **Tokens** (Medium Priority)
   - Has `{...}` (single braces)
   - Not `{{...}}` (double braces)
   - Not MSD datasource like `{sensor.temperature}`

3. **JavaScript** (Fallback)
   - Plain expression
   - No template markers
   - Evaluated as JavaScript expression

### Detection Examples

```yaml
# Detected as JINJA2 (has {{ and states() function)
condition: "{{ states('sensor.temp') | float > 25 }}"

# Detected as JINJA2 (has {{ and filter)
condition: "{{ value | round(1) }}"

# Detected as TOKEN (has single braces)
condition: "{entity.state} === 'on'"

# Detected as JAVASCRIPT (no markers, plain expression)
condition: "entity.state === 'on'"

# Detected as JAVASCRIPT (no markers)
condition: "entity.attributes.brightness > 100"

# Detected as JAVASCRIPT (Math function)
condition: "Math.round(parseFloat(entity.state)) > 25"
```

### Edge Cases

**Ambiguous Case:**
```yaml
condition: "value > 25"
```
**Resolution:** Treated as JavaScript (fallback)

**Mixed Markers:**
```yaml
condition: "{{ states('sensor.temp') }} > 25"
```
**Resolution:** Treated as Jinja2 ({{ takes precedence)

**Token with Braces:**
```yaml
condition: "{entity.state} === 'on' && {entity.attributes.brightness} > 100"
```
**Resolution:** Treated as JavaScript with tokens (tokens resolved first)

---

## Explicit Type Override

For edge cases or clarity, you can explicitly specify the template type:

### Explicit Jinja2

```yaml
when:
  jinja2: "{{ states('sensor.temp') > 25 }}"
```

### Explicit JavaScript

```yaml
when:
  javascript: "entity.state === 'on'"
  # OR
  js: "entity.state === 'on'"
```

**Use Cases for Explicit Type:**
- Debugging auto-detection issues
- Forcing specific evaluation context
- Documentation/clarity in complex rules

---

## Mixing Condition Types

You can mix different condition types within logical operators:

```yaml
rules:
  - id: mixed_conditions
    when:
      all:
        # Entity condition (existing syntax)
        - entity: light.desk
          state: "on"

        # Jinja2 condition
        - condition: "{{ states('sensor.temp') | float > 20 }}"

        # JavaScript condition
        - condition: "entity.attributes.brightness > 100"

        # Token condition
        - condition: "{entity.state} === 'on'"
    apply:
      overlays:
        complex_match:
          style:
            visible: true
```

---

## Performance Considerations

### Evaluation Speed

**Fastest:** Entity conditions (compiled, sync)
**Fast:** JavaScript expressions (client-side, sync)
**Fast:** Token templates (resolve + JS eval, sync)
**Slower:** Jinja2 templates (WebSocket call, async)

### Best Practices

1. **Use entity conditions** for simple comparisons when possible
2. **Use JavaScript** for client-side logic without server round-trip
3. **Use Jinja2** when you need:
   - Server-side calculations
   - Access to entities not in rule context
   - Home Assistant helper functions
   - Aggregations across multiple entities

4. **Avoid Jinja2 in high-frequency rules** (entity state changes every second)
5. **Cache Jinja2 results** when appropriate (future enhancement)

---

## Comparison Table

| Feature | Entity | JavaScript | Token | Jinja2 |
|---------|--------|------------|-------|--------|
| **Syntax** | YAML object | Plain expression | `{token}` | `{{...}}` |
| **Evaluation** | Compiled | Client-side | Client-side | Server-side |
| **Speed** | ⚡⚡⚡ Fast | ⚡⚡ Fast | ⚡⚡ Fast | ⚡ Slower |
| **Async** | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Server Access** | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Math Functions** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |
| **HA Functions** | ❌ No | ❌ No | ❌ No | ✅ Yes |
| **Entity Access** | 🔸 Rule entity only | 🔸 Via context | 🔸 Via tokens | ✅ All entities |
| **Auto-Detect** | ❌ N/A | ✅ Fallback | ✅ Yes | ✅ Yes |

---

## Migration Guide

### From Old Syntax

If you're migrating from older rule syntax:

```yaml
# OLD: Entity-only conditions
when:
  entity: sensor.temperature
  above: 25

# NEW: Still works! (backward compatible)
when:
  entity: sensor.temperature
  above: 25

# OR: Use new template syntax
when:
  condition: "entity.state > 25"
  # OR
  condition: "{{ states('sensor.temperature') | float > 25 }}"
```

### Adding Template Conditions

```yaml
# Add template condition to existing rule
rules:
  - id: my_rule
    when:
      all:
        - entity: light.desk
          state: "on"

        # NEW: Add Jinja2 condition
        - condition: "{{ now().hour >= 18 }}"

        # NEW: Add JavaScript condition
        - condition: "entity.attributes.brightness > 100"
```

---

## Common Patterns

### Pattern: Time-Based Rules

```yaml
# Jinja2 for server time
when:
  condition: "{{ now().hour >= 18 and now().hour < 23 }}"

# JavaScript for client time (if acceptable)
when:
  condition: "(new Date()).getHours() >= 18"
```

### Pattern: Multiple Entity Check

```yaml
# Jinja2 for cross-entity access
when:
  condition: "{{ is_state('light.desk', 'on') and is_state('light.floor', 'on') }}"

# Entity conditions for same result
when:
  all:
    - entity: light.desk
      state: "on"
    - entity: light.floor
      state: "on"
```

### Pattern: Attribute Checks

```yaml
# JavaScript for current entity
when:
  condition: "entity.attributes.brightness > 128 && entity.attributes.color_temp < 400"

# Jinja2 for any entity
when:
  condition: "{{ state_attr('light.desk', 'brightness') | int > 128 }}"
```

### Pattern: Calculations

```yaml
# JavaScript for simple math
when:
  condition: "Math.round(parseFloat(entity.state)) > 25"

# Jinja2 for server-side calculation
when:
  condition: "{{ (states('sensor.temp1') | float + states('sensor.temp2') | float) / 2 > 25 }}"
```

---

## Troubleshooting

### Condition Not Evaluating

**Check:**
1. Template type detected correctly? (enable debug logging)
2. Syntax valid for template type?
3. Variables available in context?
4. Async conditions awaited? (Jinja2)

**Debug:**
```yaml
# Add explicit type to verify detection
when:
  jinja2: "{{ states('sensor.temp') | float > 25 }}"
  # instead of
  condition: "{{ states('sensor.temp') | float > 25 }}"
```

### Unexpected Type Detection

**Solution:** Use explicit type override

```yaml
# If auto-detected as wrong type, specify explicitly
when:
  javascript: "entity.state === 'on'"  # Force JavaScript
  # OR
  jinja2: "{{ is_state(entity_id, 'on') }}"  # Force Jinja2
```

### Performance Issues

**If Jinja2 conditions are slow:**
1. Check for template complexity
2. Reduce number of entities queried
3. Consider caching (future feature)
4. Use JavaScript for simple logic

---

## Future Enhancements

Planned for future versions:

- 🔮 Jinja2 result caching
- 🔮 JavaScript sandbox mode
- 🔮 Custom JavaScript function registry
- 🔮 Template performance profiling
- 🔮 Template compilation caching
- 🔮 Parallel Jinja2 evaluation

---

## References

- [TemplateDetector.js](../../src/core/templates/TemplateDetector.js) - Auto-detection implementation
- [compileConditions.js](../../src/core/rules/compileConditions.js) - Condition compiler
- [RulesEngine.js](../../src/core/rules/RulesEngine.js) - Rule evaluation engine
- [UnifiedTemplateEvaluator.js](../../src/core/templates/UnifiedTemplateEvaluator.js) - Template orchestration

---

*Document version: 2.0 (November 13, 2025)*
