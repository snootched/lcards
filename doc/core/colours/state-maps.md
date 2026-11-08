---
description: "LCARdS state maps: colours that follow an entity with state keys (active, inactive, unavailable, a state name), number keys (zero, above:N, between:N:M), the order they are checked in, where they work, and templates as colours."
---

# State Maps

**A state map is a colour key given one colour per state instead of one colour.** The card picks the colour that matches its entity's state, and changes it as the state changes. Each value is any [colour value](../colours#colour-value-formats).

```yaml live
type: custom:lcards-button
entity: climate.living_room
preset: lozenge
text:
  name:
    show: true
style:
  card:
    color:
      background:
        heat: var(--lcars-alert-red) # an exact state
        cool: var(--lcards-blue)
        active: var(--lcars-orange) # any other "on" state
        default: var(--lcars-gray)
```

## State keys

**State keys pick a colour by what the entity is doing: an exact state, or on, off and unavailable.** Use `active` and `inactive` for anything that switches; add an exact state (`heat`, `playing`) where one state needs its own colour.

- An exact state key wins over `active` and `inactive`, so `heat:` colours a heating thermostat even though `heat` also counts as active.
- On a button or elbow, a preset or the theme fills in the background and text colour for the current state group when your map does not name it. With only `default` set, an off entity shows the preset's (or theme's) inactive colour, not your `default`; set `inactive` too, or use [`state_classification`](./attributes#state-classification) `else: default`.
- `hover` and `pressed` colour a [button's](/cards/button/styles#style-card) background and border while the pointer is over it or it is pressed.

```yaml live
type: custom:lcards-button
entity: climate.living_room
preset: lozenge
text:
  label:
    show: true
    content: Climate
    position: top-left
    color:
      default: var(--lcards-moonlight)
      active: var(--lcards-orange)
      unavailable: var(--lcars-alert-red)
  state:
    show: true
    content: "{entity.state}"
    position: center
    color:
      heat: var(--lcars-alert-red)
      cool: var(--lcards-blue)
      auto: var(--lcards-orange)
      default: var(--lcards-moonlight)
style:
  card:
    color:
      background:
        default: var(--ha-card-background)
        active: alpha(var(--lcards-orange), 0.08)
  border:
    color:
      default: var(--lcards-gray)
      active: var(--lcards-orange)
      heat: var(--lcars-alert-red)
      cool: var(--lcards-blue)
      unavailable: var(--lcars-alert-red)
    width: 2
```

::: details More about active and inactive
- **`active`** is any of these states: `on` · `open` · `playing` · `home` · `heat` · `cool` · `auto` · `fan_only` · `dry` · `locked` · `armed_home` · `armed_away` · `armed_night` · `armed_vacation` · `armed_custom_bypass` · `cleaning` · `mowing` · `docked` · `returning` · `paused` · `active` · `above_horizon`.
- **`inactive`** is every other state, such as `off`, `closed`, `idle`, `standby`, `unlocked` or `disarmed`, except `unavailable` and `unknown`.
- **Your own groups:** [`state_classification`](./attributes#state-classification) adds states to these lists, and makes groups of your own.
- **Quote `"on"` and `"off"`** when you use them as exact keys: Home Assistant's code editor reads them as true and false otherwise.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `default` | colour | - | Any state no other key matches, and a card with no entity |
| `active` | colour | - | The entity is on, open, playing, heating ...: see the list above |
| `inactive` | colour | - | Any other state |
| `unavailable` | colour | - | The state is `unavailable` or `unknown` |
| `hover` | colour | - | Button background and border while the pointer is over the card |
| `pressed` | colour | - | Button background and border while it is pressed |
| `<state>` | colour | - | Exactly this state, such as `heat`, `cooling`, `buffering` |

## Number keys

**Number keys pick a colour by the entity's value: zero, above or below a limit, or inside a band.** Use them for a sensor, a battery or a level, so the colour turns yellow or red past a limit.

- The value is the state read as a number. For an entity whose state is not a number (a light is `on`), [`ranges_attribute`](./attributes#ranges-attribute) compares an attribute instead.
- When several range keys match, the most specific wins: a `between` beats an `above`, which beats a `below`. Among `between` keys the narrowest band wins, among `above` keys the highest limit, and among `below` keys the lowest.

```yaml live controls
type: custom:lcards-button
entity: input_number.lcards_test_power
preset: lozenge
text:
  name:
    show: true
style:
  card:
    color:
      background:
        zero: var(--lcars-alert-red) # exactly 0
        below:20: var(--lcars-alert-red) # critical
        below:50: var(--lcars-alert-yellow) # low
        between:40:60: var(--lcars-blue) # wins over below:50 from 40 to 49
        non_zero: var(--lcars-green) # any other level
        default: var(--lcars-gray)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `zero` | colour | - | The value is exactly `0`. Checked before the range keys |
| `non_zero` | colour | - | Any other number, when no range key matched |
| `above:N` | colour | - | The value is more than `N`: `above:50` |
| `at_least:N` | colour | - | The value is `N` or more: `at_least:50` |
| `below:N` | colour | - | The value is less than `N`: `below:20` |
| `at_most:N` | colour | - | The value is `N` or less: `at_most:20` |
| `between:N:M` | colour | - | From `N` to `M`, both included: `between:20:80` |
| `between_exclusive:N:M` | colour | - | Between `N` and `M`, neither included: `between_exclusive:20:80` |

## Resolution order

**The card checks the keys in this order and uses the first that matches.**

1. **The [`state_attribute`](./attributes#state-attribute) value**, when the card sets it: a key equal to that attribute's value.
2. **The exact state:** a key equal to the state, such as `heat`.
3. **`zero`:** the value is `0`.
4. **The range keys** (`above`, `at_least`, `below`, `at_most`, `between`, `between_exclusive`): the most specific match, as in [Number keys](#number-keys).
5. **`non_zero`:** any other number.
6. **The state group:** `active`, `inactive`, `unavailable`, or a group of your own from [`state_classification`](./attributes#state-classification).
7. **`default`.**

Steps 3 to 5 read the state as a number, or the attribute named by [`ranges_attribute`](./attributes#ranges-attribute). Icons chosen by state (`icon_style.icon`) follow the same order.

## Where colour maps are valid

**State maps work in most colour keys that belong to the card's entity.** On these pages the key tables say "state map" where one works.

- **Button and elbow:** `style.card.color.background`, `style.border.color`, `style.text.default.color`, `text.<field>.color`, `style.text.<field>.color` and `style.text.<field>.background`, `icon_style.color`, `icon_area_background`, and `shape_texture.config.color` (`color_a`, `color_b`, `edge_glow_color`).
- **Elbow:** `elbow.segment.color`, each segment's `color` in `elbow.segments`, `symbiont.imprint.background` and `symbiont.imprint.text.color`.
- **Slider:** `style.gauge.indicator.color` and `.border.color`, `style.gauge.progress_bar.color`, `style.ranges[].color`, `style.shaped.fill.color`, `style.border.<side>.color` and more: see the [Slider Card](/cards/slider-card/styles) pages.
- **Other cards:** data grid cell `color` and `background` ([Conditional colours](/cards/data-grid/data#conditional-colours)), MSD line and shape `style.color` ([Dynamic styling](/cards/msd/line-overlay#dynamic-styling)), and astrometrics points and objects ([Colours from entities](/cards/astrometrics/data#colours-from-entities)).

The settings of a [background animation](/core/effects/background-animations) and a button's `divider.color` take one colour (or, for a background animation, a template), not a state map.

## Template strings as colour values

**A colour key can be a template, which works the colour out each time the entities it reads change.** Use it when a state map cannot say it: two entities at once, or a rule with `and` and `or`.

- Jinja2 (`{{ }}`, `{% %}`) and JavaScript (`[[[ ]]]`) templates work, as the whole value or as one value in a state map. The template must give a colour value.
- A Jinja2 template follows every entity it names. A JavaScript template that reads other entities needs them in `triggers_update` on the card: see [Templates](/core/templates/#manual-tracking-with-triggers-update).
- For most cases a state map with [`state_attribute`](./attributes#state-attribute) is simpler to read.

```yaml live
type: custom:lcards-button
entity: climate.living_room
preset: lozenge
show_icon: true
icon: mdi:thermostat
text:
  name:
    show: true
icon_style:
  # red while heating, blue otherwise
  color: "{{ 'var(--lcars-alert-red)' if state_attr('climate.living_room', 'hvac_action') == 'heating' else 'var(--lcards-blue)' }}"
```

### Colour from another entity

**A state map follows the card's own entity; for a colour that follows a different entity, use a template.** A template can read any entity, whatever the card is bound to.

- Some parts have an entity of their own, and their state maps follow it: an elbow segment's `entity_id`, a data grid cell, an MSD line or shape's `entity`, and the `entity` in an astrometrics colour map.

```yaml live controls
type: custom:lcards-slider
entity: input_number.lcards_test_value # the slider sets this
preset: gauge-basic
style:
  gauge:
    indicator:
      # green while the toggle is on
      color: "{{ 'var(--lcards-green)' if is_state('input_boolean.lcards_test_toggle', 'on') else 'var(--lcards-gray)' }}"
```
