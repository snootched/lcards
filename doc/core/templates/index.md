---
description: "LCARdS templates: {entity.state} tokens, [[[ ]]] JavaScript, {{ }} Jinja2 and {ds:name} data source values; where each kind works, the order they run in, and how a card follows the entities its templates read (triggers_update)."
moved_anchors:
  syntax-overview: /core/templates#token-templates
---

# Templates

**Templates put live values into a card's settings: an entity's state in a label, a word or colour worked out in JavaScript, a Home Assistant Jinja2 template, or a processed [data source](../datasources/) value.** There are four kinds, and one string can mix them.

- **Tokens** `{entity.state}` are the quickest: they fill in a value without asking Home Assistant.
- **JavaScript** `[[[ ]]]` is for logic and calculations, **Jinja2** `{{ }}` is Home Assistant's own template language, and **data sources** `{ds:name}` show values that LCARdS has smoothed, converted or otherwise processed.
- A card works out its templates again when an entity it follows changes; see [Entity Tracking](#entity-tracking-reactivity) for which ones it follows.

::: tip Try it
A card editor's **Main Engineering > Templates** tab lists every template on the card with its live result, and opens any of them in a sandbox that completes entities, data sources and theme tokens. See [Main Engineering](../../cards/main-engineering#templates).
:::

## Token Templates

**A token in single braces fills in one value: the card's entity state, an attribute, another entity, a config value, a variable or a theme token.** It is worked out at once, in the browser, with no round trip to Home Assistant.

- `{entity.state}` is the state as Home Assistant shows it: translated, and with its unit (`21.5 °C`, `Open`). A text field's [`display_format`](../text-fields-content#display-format) picks the raw state or the unit only.
- The card does not follow an entity named in a `{states.…}` token by itself: list it in [`triggers_update`](#manual-tracking-with-triggers-update), as below.
- Anything in single braces is read as a token, so one that names nothing (a typo, an attribute the entity doesn't have) shows as nothing. On a text field, `template: false` shows braces as written.
- Tokens are an LCARdS shorthand, not Jinja2. If you know Home Assistant's templates, [Jinja2](#jinja2-templates) gives you all of it; use tokens where the value must be ready at once.

```yaml live controls
type: custom:lcards-button
entity: sensor.demo_temperature
preset: lozenge
variables:
  deck: DECK 7
triggers_update:
  - light.demo
text:
  default:
    color: var(--lcars-black)
  reading:
    content: "{entity.state}"
    position: top-left
  deck:
    content: "{variables.deck}"
    position: top-right
  light:
    content: "LIGHT {states.light.demo.state}"
    position: bottom-left
grid_options:
  rows: 2
```

| Token | Value |
|-------|-------|
| `{entity.state}` | The card entity's state, as Home Assistant shows it |
| `{entity.attributes.NAME}` | One of its attributes, as Home Assistant shows it |
| `{states.domain.object_id.state}` | The state of another entity, named by its full entity ID |
| `{states.domain.object_id.attributes.NAME}` | An attribute of another entity |
| `{config.NAME}` | A value from this card's own config |
| `{variables.NAME}` | One of the card's [`variables`](../../cards/common#variables) |
| `{hass.user.name}` | The name of the Home Assistant user looking at the dashboard |
| `{theme:token.path}` | A theme token's value: see [Themes](../themes/) |

## JavaScript Templates

**`[[[ ]]]` runs JavaScript in the browser and puts in what it returns: use it for any logic or calculation.** Write `return` with the value; a template that returns nothing shows as nothing.

- JavaScript gets the raw entity: `entity.state` is `on`, not `On`, and a number in a state is a string, so use `Number(entity.state)` to calculate with it.
- A template with an error is shown as written, and the browser console logs a warning.
- The card does not follow entities a template reads from `states` or `hass.states`: list them in [`triggers_update`](#manual-tracking-with-triggers-update).

```yaml live controls
type: custom:lcards-button
entity: light.demo
preset: lozenge
text:
  default:
    color: var(--lcars-black)
  status:
    content: "[[[ return entity.state === 'on' ? 'ACTIVE' : 'STANDBY' ]]]"
    position: top-left
  level:
    content: >-
      [[[
        const b = entity.attributes.brightness;
        return entity.state === 'on' && b ? Math.round(b / 255 * 100) + '%' : '-';
      ]]]
    position: top-right
grid_options:
  rows: 2
```

| Variable | Type | Contents |
|----------|------|----------|
| `entity` | object | The card's entity: `entity.state`, `entity.attributes`, `entity.entity_id`, `entity.last_changed` |
| `states` | object | Every entity's state object by ID, as `states['sensor.outdoor_temp'].state` |
| `hass` | object | The whole Home Assistant object: `hass.states`, `hass.user`, `hass.formatEntityState(entity)` ... |
| `user` | object | The current Home Assistant user (`hass.user`) |
| `config` | object | This card's whole config |
| `variables` | object | The card's `variables` |
| `theme` | object | The active theme, with its tokens: `theme.colors.ui.primary` |

## Jinja2 Templates

**`{{ }}` and `{% %}` are Home Assistant's own templates, rendered by Home Assistant: every function and filter you know from automations works.** Use them when you already know Home Assistant's templating, or need something only the server knows.

- The value arrives a moment after the card draws, since Home Assistant renders it. On an error, or with no answer in 5 seconds, the template is shown as written.
- Entities named in `states('…')`, `is_state`, `state_attr`, `is_state_attr` and `has_value` are [followed automatically](#automatic-tracking).
- The card's `config` and `variables`, and `user` (the user's name), are passed in: `{{ variables.room }}` works.

```yaml live controls
type: custom:lcards-button
entity: light.demo
preset: lozenge
text:
  default:
    color: var(--lcars-black)
  temperature:
    content: "{{ states('sensor.demo_temperature') | float(0) | round(1) }} °C"
    position: top-left
  status:
    content: "{% if is_state('light.demo', 'on') %}LIGHT ON{% else %}LIGHT OFF{% endif %}"
    position: bottom-left
grid_options:
  rows: 2
```

::: details More about Jinja2 templates
- **When it renders:** each time the card works out its templates, not continuously. `now()` moves on only when the card refreshes, which is when an entity it follows changes.
- **The whole string goes to Home Assistant:** text around the template and any tokens already filled in are sent with it and come back unchanged.
:::

## Data Source Templates

**`{ds:name}` puts in the current value of a [data source](../datasources/), a live value LCARdS keeps and processes in the browser; `{datasource:name}` is the same.** Declare the data source in the card's `data_sources`, and the card updates whenever it does.

- Without a format, the value is shown as Home Assistant shows numbers, with the entity's unit: `21.4 °C`.
- With a format, you own the output: the number is formatted to it and **no unit is added**, so write your own after it.
- A dot picks a [processor](../datasources/#processors)'s value: `{ds:name.processor}`, and one statistic of a `statistics` processor with `{ds:name.processor.max}`. A processor's value has no unit, and without a format shows as a plain number.

```yaml live
type: custom:lcards-button
preset: lozenge
data_sources:
  outdoor_temp:
    entity: sensor.demo_outdoor_temperature
    processing:
      fahrenheit:
        type: convert_unit
        from: c
        to: f
text:
  default:
    color: var(--lcars-black)
  native:
    content: "{ds:outdoor_temp}" # Home Assistant's number format, with the unit
    position: top-left
  precise:
    content: "{ds:outdoor_temp:.2f} °C" # your precision, your unit
    position: top-right
  converted:
    content: "{ds:outdoor_temp.fahrenheit:.0f} °F" # a processor's value
    position: bottom-left
grid_options:
  rows: 2
```

| Format | Example | Result |
|--------|---------|--------|
| (none) | `{ds:temp}` | `21.4 °C`: Home Assistant's number format, with the entity's unit |
| `:.Nf` | `{ds:temp:.1f}` | `21.4`: N decimal places, no unit |
| `:int` | `{ds:temp:int}` | `21`: rounded to a whole number, no unit |
| `:.N%` | `{ds:level:.0%}` | `75%`: a percentage. A value whose unit is already `%` is not multiplied by 100 |
| `:str` | `{ds:mode:str}` | The value as plain text |
| `:bool` | `{ds:flag:bool}` | `true` or `false` |

The number format follows your Home Assistant language settings, so `{ds:temp}` reads `21,4 °C` where a comma is the decimal mark. An unknown format shows the plain number.

## Where Templates Work

**Text takes all four kinds of template; colour and other style settings take JavaScript and Jinja2.** For a theme colour in a style setting, use [`theme:`](../themes/#using-theme-tokens) instead of a token.

| Setting | Template kinds |
|---------|----------------|
| `text.<field>.content` on the button, elbow and slider ([Text Fields](../text-fields-content#content)) | All four |
| Data grid cells ([Data Grid](../../cards/data-grid/data)) | All four |
| Astrometrics label `content` ([Live Data](../../cards/astrometrics/data#templates)) | All four |
| Slider `style.ranges[].label.text` ([Ranges](../../cards/slider-card/ranges)) | All four |
| Slider `style.ranges[].value`, `.min` and `.max` | Tokens, JavaScript and data sources: no Jinja2, since positions are worked out again on every state change |
| Style values: `style`, `icon_style` (`icon_style.icon` included) and a text field's `color` on the button, elbow and slider; the elbow's `elbow` settings; `style` on the chart; MSD overlay styles | JavaScript and Jinja2 |
| Rule `condition` ([Rule Conditions](../rules/conditions#template-conditions)) | JavaScript and Jinja2 |

## Template Evaluation Order

**When one string mixes kinds, they are worked out in a fixed order: JavaScript, then tokens, then data sources, then Jinja2.** Each step works on the text the one before left.

1. `[[[ ]]]`: JavaScript
2. `{token}`: tokens
3. `{ds:…}` / `{datasource:…}`: data sources
4. `{{ }}`: Jinja2, last because it waits for Home Assistant

Settings that must have a value at once, such as a slider marker's position, stop after step 3.

## Entity Tracking & Reactivity

**A card works out its templates again when an entity it follows changes: its own `entity`, the entities its Jinja2 templates name, and the entities in `triggers_update`.** A data source in the card's own `data_sources` updates it too, whenever the data source changes.

### Automatic tracking

**Entities named in a Jinja2 template are found and followed with no extra config.** The card reads the entity IDs written in `states()`, `state_attr()`, `is_state()`, `is_state_attr()` and `has_value()`.

- Only IDs written out in quotes are found. An ID built from variables, or the `states.sensor.x.state` form, isn't: add those to `triggers_update`.

```yaml live controls
type: custom:lcards-button
entity: light.demo
preset: lozenge
text:
  default:
    color: var(--lcars-black)
  toggle:
    content: "{% if is_state('input_boolean.lcards_test_toggle', 'on') %}TOGGLE ON{% else %}TOGGLE OFF{% endif %}" # followed: is_state()
    position: top-left
grid_options:
  rows: 2
```

### Manual tracking with `triggers_update`

**`triggers_update` lists more entities whose changes make the card work out its templates again.** Use it for the entities LCARdS can't find for itself: those a JavaScript template reads, those in `{states.…}` tokens, and IDs a Jinja2 template builds.

- It adds to what the card follows; its own `entity` is always followed.

```yaml live controls
type: custom:lcards-button
entity: light.demo
preset: lozenge
triggers_update:
  - input_boolean.lcards_test_toggle
  - sensor.demo_temperature
text:
  default:
    color: var(--lcars-black)
  status:
    content: |
      [[[
        const toggle = states['input_boolean.lcards_test_toggle']?.state;
        const temp = states['sensor.demo_temperature']?.state;
        return toggle === 'on' ? `ON (${Number(temp).toFixed(1)}°)` : 'OFF';
      ]]]
    position: top-left
grid_options:
  rows: 2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `triggers_update` | list | - | Entity IDs to follow as well as the card's own: when one changes, the card works out all its templates again |
