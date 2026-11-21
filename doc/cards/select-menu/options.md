---
description: "Select menu card options and actions: which options show and in what order, labels, icons and per-option styles, and what tap, hold and double-tap do."
---

# Options and Actions

Which buttons the menu shows, what each one says, and what happens when you tap, hold or double-tap one. Colours and text for every option are on [Styles](./styles).

## options

**`options` changes the buttons: their labels, icons, styles and actions, and which options show.** Leave it out and the card shows every option of the entity, labelled with its value, in the entity's order.

- `options` takes two forms. As a map keyed by option value ([object form](#object-form)) it changes some options and keeps the entity's list. As a list ([array form](#array-form)) it is the list: only those options show, in that order.
- Option values are case-sensitive: `Off` and `off` are different options. Quote values YAML would read as something else, such as `"Off"` or `"On"`.

```yaml live
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: lozenge
grid:
  columns: 2
  gap: 6px
options:
  Auto:
    label: AUTOMATIC
  Heat:
    label: WARM
    style:
      card:
        color:
          background:
            active: var(--lcars-red)
            inactive: var(--lcars-dark-red)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `options` | object / list | the entity's options | Object form: changes per option, entity order kept. List: the options to show, in order |
| [Per-option fields](#per-option-fields) | | | `value`, `label`, `icon`, `style`, `tap_action`, `hold_action`, `double_tap_action` |

### Object form

**A map keyed by option value changes just the options you name; every other option still shows with its defaults.** The buttons stay in the entity's order.

- A key that is not one of the entity's options is ignored, so the object form cannot add buttons. Use the [array form](#array-form) for that.
- The object form needs an entity: without one there is no option list to change, and the card shows nothing.

```yaml live
type: custom:lcards-select-menu
entity: input_select.lcards_test_mode
preset: capped
grid:
  columns: 3
  gap: 4px
options:
  alpha:
    label: ALPHA SHIFT
  gamma:
    label: GAMMA SHIFT
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `options.<value>` | object | - | Changes for the option with this value: the [per-option fields](#per-option-fields) except `value` |

### Array form

**A list of options sets exactly which buttons show and in what order.** Options of the entity you leave out are hidden, and an entry the entity does not have still shows.

- Every entry needs `value`. With an entity, the button whose `value` matches the entity's state is the selected one.
- Use the array form for a manual menu without an entity: give each entry its own `tap_action` (or set one for the whole card), because without an entity a tap does nothing by default.

```yaml live
# Reordered, and Off left out
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: bullet
grid:
  columns: 3
  gap: 4px
options:
  - value: Heat
    label: HEAT
  - value: Cool
    label: COOL
  - value: Auto
    label: AUTO
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `options[].value` | string | required | The option this button stands for |
| [Per-option fields](#per-option-fields) | | | `label`, `icon`, `style` and the actions |

### Per-option fields

**The keys one option takes, in either form.** A per-option key wins over the same key set for the whole card.

- `icon` adds an icon area to that button only; options without an icon keep the whole button for their label.
- A per-option `style` has the same shape as the card's [style](./styles#style) and merges over it key by key.
- The card-level keys `rules`, `sounds`, `variables`, `zones` and `debug_zones` go to that option's button, so its label can use its own `variables`.

```yaml live
type: custom:lcards-select-menu
entity: input_select.demo_mode
preset: lozenge
grid:
  columns: 2
  gap: 6px
options:
  - value: Auto
    label: AUTO
    icon: mdi:thermostat-auto
  - value: Cool
    label: COOL
    icon: mdi:snowflake
    style:
      card:
        color:
          background:
            inactive: var(--lcars-blue)
  - value: Heat
    label: "{variables.mode}"
    icon: mdi:fire
    variables:
      mode: WARM
  - value: "Off"
    label: STANDBY
    hold_action:
      action: more-info
```

::: details More about per-option fields
- **Per-option style merges:** an option's `style` changes only the keys it sets; the card's other colours, text and border settings stay.
- **Card-level keys:** an option's `variables`, `zones` and `sounds` merge over the same keys in [`button_template`](./styles#button-template), and its `rules` load after the template's. Rules are global: an option's rule can target any card by its `id` or `tags`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | string | required in a list | The option value. In object form the key is the value |
| `label` | string | the value | Text on the button |
| `icon` | string | - | An icon such as `mdi:home` (or `si:github`); sets `show_icon: true` for this button |
| `style` | object | the card's `style` | Style for this button: same keys as [style](./styles#style) |
| `tap_action` | object | the card's | Tap action for this button: see [Actions](#actions) |
| `hold_action` | object | the card's | Hold action for this button |
| `double_tap_action` | object | the card's | Double-tap action for this button |
| `variables` | object | - | Your own values for this button's templates (`{variables.<name>}`): see [Variables](../common#variables) |
| `rules` | list | - | Rules this button loads: see [Rules Engine](../../core/rules/) |
| `sounds` | object | - | Sound overrides for this button: see [Card Sounds](../../core/sounds.md) |
| `zones` | object | - | Named areas on this button that text fields and animations can target |
| `debug_zones` | boolean | `false` | Outline this button's zones |

## Actions

**A tap selects the option; you can replace that for one option, for the whole card, or in the button template.** Hold and double-tap do nothing unless you set them.

- For each of the three actions, the first one set in this order wins: the option's own, the card's, the [button template](./styles#button-template)'s, then the built-in default.
- The built-in tap calls `input_select.select_option` (or `select.select_option` for a `select.*` entity) with the option's value. Without an entity there is no built-in tap.
- Hold and double-tap default to `action: none`, so a hold never falls through to the tap and selects an option by accident.

```yaml live
type: custom:lcards-select-menu
entity: input_select.lcards_test_mode
preset: capped
grid:
  columns: 3
  gap: 4px
# every option: hold for more information
hold_action:
  action: more-info
options:
  - value: alpha
    label: ALPHA
  - value: beta
    label: BETA
  # this option navigates instead of selecting
  - value: gamma
    label: SETTINGS
    tap_action:
      action: navigate
      navigation_path: /config
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `tap_action` | object | select the option | Any [action](../../core/actions.md); on the card it replaces the tap of every option without its own |
| `hold_action` | object | `action: none` | Any [action](../../core/actions.md) |
| `double_tap_action` | object | `action: none` | Any [action](../../core/actions.md) |
