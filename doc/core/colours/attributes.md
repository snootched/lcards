---
description: "LCARdS colours from entity attributes and your own state groups: ranges_attribute (range keys on a light's brightness or any attribute), state_attribute (exact keys from an attribute such as hvac_action) and state_classification (custom active, inactive and named buckets)."
---

# Attributes and Buckets

Three card keys that change what a [state map](./state-maps) reads: `ranges_attribute` and `state_attribute` read an attribute instead of the state, and `state_classification` decides which states count as active, inactive or a group of your own. They are top-level keys on the button, elbow and slider cards; `state_classification` works on the data grid and astrometrics cards too.

## `ranges_attribute`

**`ranges_attribute` makes the number keys (`zero`, `above:N`, `between:N:M` ...) compare an attribute instead of the state.** Use it for an entity whose state is not a number: a light is `on`, a cover `open`, but their brightness and position are numbers in attributes.

- `brightness_pct` is a light's brightness as `0` to `100` (Home Assistant stores it as `0` to `255`), so limits read as percentages. Any other value is an attribute name, such as `current_position` or `color_temp`.
- It applies to every state map on the card at once: colours, borders, text and icons. Exact state keys and `active` / `inactive` still read the state.
- When the light is off, `brightness_pct` is `0`, so `zero` and `below:N` keys match before `inactive` does. Use an `"off"` key for the off look, as below.

```yaml live controls
type: custom:lcards-button
entity: light.tv
preset: lozenge
ranges_attribute: brightness_pct # range keys compare the brightness, 0 to 100
show_icon: true
text:
  name:
    show: true
tap_action:
  action: toggle
icon_style:
  color:
    active: match-light
    inactive: var(--lcards-gray)
  icon:
    "off": mdi:lightbulb-off
    above:90: mdi:lightbulb-alert # brighter than 90 %
    below:20: mdi:lightbulb-outline # dimmer than 20 %
    default: mdi:lightbulb
style:
  card:
    color:
      background:
        "off": var(--lcars-gray)
        above:70: var(--lcars-yellow)
        active: alpha(match-light, 0.5)
```

::: details More about ranges_attribute
- **A missing attribute,** or one that is not a number, leaves the range keys reading the state. For a light that state is `on`, so no range key matches.
- **The button's [`ranges`](/cards/button/components#ranges)** (preset switching) compare the same attribute; a `ranges` entry can name its own with `attribute`.
- **Parts with their own entity** read their own state: an elbow segment with `entity_id`, and data grid cells. MSD [line and shape overlays](/cards/msd/line-overlay#dynamic-styling) take their own `ranges_attribute`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `ranges_attribute` | string | the state | The attribute the number keys compare. `brightness_pct`: a light's brightness, 0 to 100. `state`: the state, as when unset |

## `state_attribute`

**`state_attribute` makes the exact keys match an attribute's value instead of the state.** Use it when an attribute says more than the state: a thermostat's state is its mode (`heat`), but `hvac_action` says whether it is heating right now (`heating`, `idle`).

- The attribute is checked first; when no key matches its value, the state is checked as usual. `active`, `inactive` and `unavailable` always follow the state.
- It applies to every state map on the card: icon colour and icon, `icon_area_background`, background, border and text colours.
- It works alongside `ranges_attribute`: one attribute for the exact keys, another for the number keys.

```yaml live
type: custom:lcards-button
entity: climate.living_room
preset: lozenge
state_attribute: hvac_action # heating, cooling, idle or off
show_icon: true
icon: mdi:thermostat
text:
  name:
    show: true
icon_style:
  color:
    heating: var(--lcars-alert-red)
    cooling: var(--lcards-blue)
    idle: var(--lcards-gray)
    "off": var(--lcards-gray)
icon_area_background:
  heating: alpha(var(--lcars-alert-red), 0.15)
  cooling: alpha(var(--lcards-blue), 0.15)
  idle: transparent
```

::: details More about state_attribute
- **Booleans and empty values:** the value is turned into text before it is matched, so a `true` / `false` attribute matches the keys `"true"` and `"false"` (quoted), and an empty (`null`) attribute matches `"null"`.
- **A missing attribute** is skipped, and the state is matched as usual.
- **Parts with their own entity** (an elbow segment with `entity_id`, data grid cells) match their own state. MSD [line and shape overlays](/cards/msd/line-overlay#dynamic-styling) take their own `state_attribute`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `state_attribute` | string | - | The attribute whose value is matched against exact keys before the state, such as `hvac_action`, `effect` or `preset_mode` |

## `state_classification`

**`state_classification` decides which states count as `active` and `inactive`, and where every other state goes.** Use it when the built-in lists get it wrong for your entity, or to send unlisted states to `default`.

- States you list win over the built-in lists: `inactive: [home]` makes `home` inactive although it is normally active.
- `else` is the group for every state no list names. It is `inactive` unless you set it; `else: default` makes those states use your `default` colour instead of the preset's inactive colour.
- `unavailable` and `unknown` always count as `unavailable`. An exact state key in a colour map still wins over any group.

```yaml live controls
type: custom:lcards-button
entity: input_select.lcards_test_mode
preset: lozenge
text:
  name:
    show: true
state_classification:
  active: [alpha] # alpha counts as active
  else: default # beta and gamma use default, not inactive
style:
  card:
    color:
      background:
        active: var(--lcars-green)
        default: var(--lcars-blue)
```

::: details More about state_classification
- **The order states are sorted in:** `unavailable` and `unknown`, then your `active` list, your `inactive` list, your own groups, the built-in active list, and last `else`.
- **`else: active`** treats every state as active except `unavailable` and `unknown`, which suits an entity that is only ever on or unavailable.
- **In the card editor,** `else` is a dropdown; the lists are set in YAML.
- **Data grid and astrometrics cards** use the card's `state_classification` for every cell's or point's entity.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `state_classification.active` | list | - | More states that count as active, added to the built-in list |
| `state_classification.inactive` | list | - | States that count as inactive, even ones on the built-in active list |
| `state_classification.<name>` | list | - | The states in a group of your own: see [Custom buckets](#custom-buckets) |
| `state_classification.else` | string | `inactive` | The group for every other state: `active`, `inactive`, `default` or one of your own names |

### Custom buckets

**Any other key in `state_classification` makes a group of your own, which you then use as a key in state maps.** Use it to give several states one colour, such as every zone that means "at work".

- A group's name can be anything except `active`, `inactive`, `unavailable`, `default`, `else` and `unknown`.
- `else` can name one of your groups, so every unlisted state lands in it.

```yaml live controls
type: custom:lcards-button
entity: input_select.lcards_test_mode
preset: lozenge
text:
  name:
    show: true
state_classification:
  ready: [alpha]
  standby: [beta]
  else: alert # gamma and anything else
style:
  card:
    color:
      background:
        ready: var(--lcars-green)
        standby: var(--lcars-blue)
        alert: var(--lcars-alert-red)
        unavailable: var(--lcars-gray)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `state_classification.<name>` | list | - | The states in the group `<name>`; use `<name>:` as a key in any state map on the card |
