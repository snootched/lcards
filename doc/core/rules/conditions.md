---
description: "Rule conditions (when): entity states and attributes, numeric comparisons, map_range_cond, time of day, weekday, sun elevation, random chance, all/any/not, JavaScript and Jinja2 templates."
moved_anchors:
  logical-operators: /core/rules/conditions#all-any-and-not
  all-and: /core/rules/conditions#all-any-and-not
  any-or: /core/rules/conditions#all-any-and-not
  not-not: /core/rules/conditions#all-any-and-not
  nested-logic: /core/rules/conditions#all-any-and-not
  combining-conditions-full-example: /core/rules/conditions#all-any-and-not
  entity-conditions: /core/rules/conditions#entity
  state-check: /core/rules/conditions#entity
  attribute-check: /core/rules/conditions#entity-attr
  examples: /core/rules/conditions#comparison-operators
  time-conditions: /core/rules/conditions#time-between
  time-range: /core/rules/conditions#time-between
  day-of-week: /core/rules/conditions#weekday-in
  map-range-condition: /core/rules/conditions#map-range-cond
  see-also: /core/rules/
---

# Rule Conditions

**A rule's `when` block is its condition: while it is true the rule's `apply` block holds, and when it turns false the patch comes off.** It can test an entity, the time, the sun, a template, or several of these combined. The rest of a rule is on the [Rules Engine](./) page.

- A rule is checked again when an entity it names changes: the `entity` of a condition, or an entity a template reads. A rule with a `time_between`, `weekday_in` or `random_chance` condition is also checked at the start of every minute.
- The examples on this page each hold one rule on one button. Use the controls under a card to change the entity and watch the rule match.

## All conditions at a glance

**One key picks the kind of condition; the table links to each.**

| Condition | Key | What it checks |
|-----------|-----|----------------|
| [Entity state](#entity) | `entity` | The entity's state against a [comparison](#comparison-operators) |
| [Entity attribute](#entity-attr) | `entity_attr` | One attribute of an entity against a comparison |
| [Map range](#map-range-cond) | `map_range_cond` | The state mapped onto a new scale, then compared |
| [All, any, not](#all-any-and-not) | `all`, `any`, `not` | Every, at least one, or none of the conditions inside |
| [Time range](#time-between) | `time_between` | The time is inside a `"HH:MM-HH:MM"` window |
| [Day of week](#weekday-in) | `weekday_in` | Today is in a list of days |
| [Sun elevation](#sun-elevation) | `sun_elevation` | The sun is above or below an angle |
| [Random chance](#random-chance) | `random_chance` | True with a probability from `0` to `1` |
| [JavaScript](#javascript) | `condition`, `javascript`, `js` | A JavaScript expression returns a truthy value |
| [Jinja2](#jinja2) | `condition`, `jinja2` | A Home Assistant Jinja2 template renders true |

## entity

**`entity` tests an entity's state: on its own, or with a comparison such as `state: "on"` or `above: 25`.** This is the condition most rules use.

- `state` means exactly the same as `equals`. Quote `"on"` and `"off"`, or YAML may read them as true and false.
- With no comparison at all, the condition is true while the entity has a state.

```yaml live controls
type: custom:lcards-button
id: docs-cond-entity-btn
preset: lozenge
entity: input_boolean.lcards_test_toggle
tap_action:
  action: toggle
text:
  name:
    content: TOGGLE
    show: true
rules:
  - id: docs-cond-entity
    when:
      entity: input_boolean.lcards_test_toggle
      state: "on"
    apply:
      overlays:
        docs-cond-entity-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
```

::: details More about entity
- **Missing entities:** a condition on an entity that does not exist (a typo, a deleted helper) is false.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `entity` | string | required | The entity whose state is tested |
| [Comparison operators](#comparison-operators) | | | `state`, `equals`, `not_equals`, `above`, `at_least`, `below`, `at_most`, `in`, `not_in`, `regex` |

### Comparison operators

**The comparison keys test a value: an entity's state, an attribute or a mapped value.** They work the same in `entity`, `entity_attr` and `map_range_cond` conditions.

- The four numeric operators combine: every one you give must hold, so `above: 18` with `below: 26` is a range. `at_least` and `at_most` include the bound itself.
- A condition uses one of the other operators at most, the first it finds in the order of the table, and then ignores any numeric ones next to it. Write a second condition in an `all` list to test two things.
- The editor's operator list also offers "between" (`at_least` plus `at_most`) and "between (exclusive)" (`above` plus `below`), and fills in both bounds.

```yaml live controls
type: custom:lcards-button
id: docs-cond-range-btn
preset: lozenge
text:
  name:
    content: POWER 40 TO 80
    show: true
rules:
  # an inclusive range: 40 <= power <= 80
  - id: docs-cond-range
    when:
      entity: input_number.lcards_test_power
      at_least: 40
      at_most: 80
    apply:
      overlays:
        docs-cond-range-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-yellow)
```

::: details More about comparison operators
- **Numbers and text:** `equals` and `not_equals` compare loosely, so `equals: 25` matches the state `"25"`. `in` and `not_in` compare exactly, and states are text: write `in: ["1", "2"]`, not `in: [1, 2]`.
- **Not a number:** a numeric operator on a state that is not a number (`unavailable`, `unknown`) is false.
- **Regular expressions:** `regex` is a JavaScript regular expression tested against the state; one that does not compile is false.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `state` | string / number | - | Equal to this. The same as `equals` |
| `equals` | string / number | - | Equal to this (`==`) |
| `not_equals` | string / number | - | Not equal to this (`!=`) |
| `above` | number | - | Greater than this (`>`) |
| `at_least` | number | - | Greater than or equal to this (`>=`) |
| `below` | number | - | Less than this (`<`) |
| `at_most` | number | - | Less than or equal to this (`<=`) |
| `in` | list | - | One of these values, such as `["on", "idle"]` |
| `not_in` | list | - | None of these values, such as `["off", "unavailable"]` |
| `regex` | string | - | Matches this regular expression, such as `"^heat"` |

## entity_attr

**`entity_attr` tests one attribute of an entity instead of its state, such as a light's `brightness`.** Name the entity in `entity_attr` and the attribute in `attribute`, then add a [comparison](#comparison-operators).

- The condition editor writes the same test as `entity` plus `attribute`; both forms work.
- The sample light here has a brightness of 200, so the rule matches.

```yaml live controls
type: custom:lcards-button
id: docs-cond-attr-btn
preset: lozenge
entity: light.demo
text:
  name:
    content: BRIGHT
    show: true
rules:
  - id: docs-cond-attr
    when:
      entity_attr: light.demo
      attribute: brightness
      above: 128
    apply:
      overlays:
        docs-cond-attr-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-yellow)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `entity_attr` | string | required | The entity whose attribute is tested |
| `attribute` | string | required | The attribute's name. Without it the condition is false |
| [Comparison operators](#comparison-operators) | | | Applied to the attribute's value |

## map_range_cond

**`map_range_cond` maps an entity's numeric state from one scale onto another, then compares the mapped value.** Use it when the threshold you think in is on a different scale from the raw value: a percentage of a power range, say.

- `input` is the range the raw value moves over, `output` the range it is mapped onto, and the comparison keys sit inside `map_range_cond` next to them.
- Here power (0 to 100) is mapped onto 0 to 5000 W, and the rule matches above 4000 W.

```yaml live controls
type: custom:lcards-button
id: docs-cond-map-btn
preset: lozenge
text:
  name:
    content: OVER 4000 W
    show: true
rules:
  - id: docs-cond-map
    when:
      map_range_cond:
        entity: input_number.lcards_test_power
        input: [0, 100]
        output: [0, 5000]
        above: 4000
    apply:
      overlays:
        docs-cond-map-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
```

::: details More about map_range_cond
- **Not a number:** a state that is not a number, or an `input` or `output` that is not two numbers, makes the condition false.
- **`state` is not an alias here:** write `equals` to test for one mapped value.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `entity` | string | required | The entity whose state is mapped |
| `input` | `[min, max]` | required | The range of the raw value |
| `output` | `[min, max]` | required | The range it is mapped onto |
| `clamp` | boolean | `true` | Keep the mapped value inside `output` when the raw value leaves `input` |
| [Comparison operators](#comparison-operators) | | | Applied to the **mapped** value; give at least one |

## all, any and not

**`all`, `any` and `not` combine conditions: every one, at least one, or the opposite.** They nest to any depth, so a rule can say "this, and one of those, but not that".

- A bare list under `when` means `all`.
- `not` takes one condition. Given a list, it is true unless every item in the list is true.
- Here the button turns red while power is above 50, the doors are not open, and the lights are on or the mode is `gamma`.

```yaml live controls
type: custom:lcards-button
id: docs-cond-logic-btn
preset: lozenge
text:
  name:
    content: COMBINED
    show: true
rules:
  - id: docs-cond-logic
    when:
      all:
        # power above 50
        - entity: input_number.lcards_test_power
          above: 50
        # doors not open
        - not:
            entity: input_boolean.lcards_test_doors
            state: "on"
        # lights on, or the mode is gamma
        - any:
            - entity: input_boolean.lcards_test_lights
              state: "on"
            - entity: input_select.lcards_test_mode
              state: gamma
    apply:
      overlays:
        docs-cond-logic-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `all` | list | - | True when every condition in the list is true (AND) |
| `any` | list | - | True when at least one condition in the list is true (OR) |
| `not` | condition | - | True when the condition inside is false (NOT) |

## time_between

**`time_between` is true inside a time window each day, such as `"22:00-06:00"` for the night.** A window that ends before it starts runs past midnight.

- The rule is checked at the start of every minute, so it turns on and off on time with no entity to watch.

```yaml live
type: custom:lcards-button
id: docs-cond-time-btn
preset: lozenge
text:
  name:
    content: DAY SHIFT
    show: true
rules:
  - id: docs-cond-time
    when:
      time_between: "08:00-20:00"
    apply:
      overlays:
        docs-cond-time-btn:
          style:
            card:
              color:
                background: var(--lcars-blue)
```

::: details More about time_between
- **Format:** two-digit hours and minutes, 24-hour (`"08:00-20:00"`, not `"8:00-20:00"`); any other text is false.
- **Edges:** both ends count, to the minute: `"08:00-20:00"` is true from 08:00 through 20:00. The time is the browser's local time.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `time_between` | string | - | `"HH:MM-HH:MM"`, start then end. Wraps past midnight when the end is earlier |

## weekday_in

**`weekday_in` is true on the days you list, such as weekdays only.** Pair it with `time_between` in an `all` list for "weekday mornings".

- Like `time_between`, the rule is checked at the start of every minute, so it follows the day as it changes.

```yaml live
type: custom:lcards-button
id: docs-cond-weekday-btn
preset: lozenge
text:
  name:
    content: WEEKDAY
    show: true
rules:
  - id: docs-cond-weekday
    when:
      weekday_in: [mon, tue, wed, thu, fri]
    apply:
      overlays:
        docs-cond-weekday-btn:
          style:
            card:
              color:
                background: var(--lcars-blue)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `weekday_in` | list | - | Days from `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun` (any case). The browser's local day |

## sun_elevation

**`sun_elevation` compares the sun's height above the horizon, in degrees, for rules that follow daylight.** Below `0` the sun has set; a few degrees above it is the golden hour.

- It takes the four numeric operators, which combine as on an entity: `above: 0` with `below: 8` is a band.
- The elevation comes from Home Assistant's `sun.sun` entity (its `elevation` attribute).

```yaml live
type: custom:lcards-button
id: docs-cond-sun-btn
preset: lozenge
text:
  name:
    content: DAYLIGHT
    show: true
rules:
  - id: docs-cond-sun
    when:
      sun_elevation:
        above: 0
    apply:
      overlays:
        docs-cond-sun-btn:
          style:
            card:
              color:
                background: var(--lcars-yellow)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `sun_elevation.above` | number | - | The sun is higher than this, degrees |
| `sun_elevation.at_least` | number | - | The sun is at this height or higher, degrees |
| `sun_elevation.below` | number | - | The sun is lower than this, degrees (`0` is the horizon) |
| `sun_elevation.at_most` | number | - | The sun is at this height or lower, degrees |

## random_chance

**`random_chance` is true with the probability you give, drawn again each time the rule is checked.** Use it for alerts or accents that come and go at random.

- `0.25` is true about one time in four; `0` is never and `1` is always.
- The rule is checked at the start of every minute (and when an entity it names changes), and each check is a new draw.

```yaml live
type: custom:lcards-button
id: docs-cond-chance-btn
preset: lozenge
text:
  name:
    content: ONE IN TWO
    show: true
rules:
  - id: docs-cond-chance
    when:
      random_chance: 0.5
    apply:
      overlays:
        docs-cond-chance-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `random_chance` | number | - | The probability of being true, `0.0` to `1.0` |

## Template conditions

**For logic no built-in condition covers, write the condition as JavaScript or a Jinja2 template.** `condition` tells the two apart by their brackets: `[[[ ]]]` is JavaScript, `{{ }}` is Jinja2.

- A `condition` with neither (`condition: light.desk is on`) never matches, and a warning is logged in the browser console.
- [Templates](/core/templates/) covers the template syntax used elsewhere in LCARdS.

### JavaScript

**`condition: "[[[ ... ]]]"` runs JavaScript in the browser; the rule matches when it returns a truthy value.** The code must `return` its result.

- The rule is checked again when an entity read as `states['domain.object']` (or `hass.states['domain.object']`) changes. Entities read any other way, such as a computed id, do not trigger it.
- A YAML block (`condition: |`) holds longer code. `javascript:` (or `js:`) takes the same code without the brackets.

```yaml live controls
type: custom:lcards-button
id: docs-cond-js-btn
preset: lozenge
text:
  name:
    content: POWER ABOVE 80
    show: true
rules:
  - id: docs-cond-js
    when:
      condition: |
        [[[
          const power = Number(states['input_number.lcards_test_power'].state);
          return power > 80;
        ]]]
    apply:
      overlays:
        docs-cond-js-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
```

::: details More about JavaScript conditions
- **Errors:** code that throws makes the condition false; the error is logged in the browser console.
- **`entity`:** rules are shared by every card on the page, and `entity` is the entity of the card that happens to check the rule, which may not be the card holding it. Read `states['...']` by id instead.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `condition` | string | - | JavaScript inside `[[[ ]]]` |
| `javascript` | string | - | The same code without `[[[ ]]]`. `js` is a short name for it |
| `entity` (in the code) | object | - | The bound entity of a card on the page, or `null` |
| `hass` (in the code) | object | - | The full Home Assistant object |
| `states` (in the code) | object | - | `hass.states`: every entity's state object by id |

### Jinja2

**`condition: "{{ ... }}"` is a Home Assistant template, rendered by Home Assistant; the rule matches when it renders true.** It can use Home Assistant's own functions and filters (`is_state`, `state_attr`, `float` ...).

- The rule is checked again when an entity the template reads (`states('...')`, `is_state('...')`) changes.
- `True`, `true`, `1`, `yes` and `on` count as true; `False`, `false`, `0`, `no`, `off`, `none` and an empty result as false. Any other number is true unless it is `0`, and any other text is true.

```yaml live controls
type: custom:lcards-button
id: docs-cond-jinja-btn
preset: lozenge
text:
  name:
    content: MODE GAMMA
    show: true
rules:
  - id: docs-cond-jinja
    when:
      condition: "{{ is_state('input_select.lcards_test_mode', 'gamma') }}"
    apply:
      overlays:
        docs-cond-jinja-btn:
          style:
            card:
              color:
                background: var(--lcars-alert-red)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `condition` | string | - | A template inside `{{ }}` |
| `jinja2` | string | - | A template, named as Jinja2 explicitly |

### Choosing between JS and Jinja2

**JavaScript is instant and runs in the browser; Jinja2 runs on Home Assistant and has its functions.**

| | JavaScript | Jinja2 |
|---|---|---|
| Evaluated by | Browser | Home Assistant server |
| Latency | Synchronous, instant | Async round-trip |
| Access to Home Assistant functions | No (use `states` directly) | Yes (`is_state`, `state_attr`, filters ...) |
| Best for | Fast logic, math, multi-entity | Home Assistant native functions, formatted values |

## Invalid conditions

**A condition LCARdS does not recognise never matches, so a typo turns the rule off rather than on everywhere.**

- **Unknown key** (a typo such as `entitty:`): the condition never matches.
- **Plain-string `condition:`** (no `[[[ ]]]` or `{{ }}`, such as `condition: light.desk is on`): a warning is logged in the browser console and the condition never matches. Wrap it as JavaScript or Jinja2 instead.
