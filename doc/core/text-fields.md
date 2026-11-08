---
description: "Text fields on the button, elbow and slider cards: any number of named labels, each placed in a zone and styled on its own, with shared defaults in text.default."
moved_anchors:
  how-it-works: /core/text-fields#inheritance
  position-values: /core/text-fields-placement#position
  example: /core/text-fields#quick-start
  text-background: /core/text-fields-style#text-background
  aligning-stacked-cards: /core/text-fields-style#aligning-stacked-cards
  colour-in-text-fields: /core/text-fields-style#color
  template-content: /core/text-fields-content#content
  zones: /core/text-fields-zones
  auto-calculated-zones-per-card-type: /core/text-fields-zones#zones-per-card
  routing-a-field-to-a-zone: /core/text-fields-zones#zone
  custom-zones-config-zones: /core/text-fields-zones#zones
  debug-overlay: /core/text-fields-zones#debug-zones
  font-size-percent-and-cap-height-ratio: /core/text-fields-style#filling-a-zone
  display-format: /core/text-fields-content#display-format
  yaml-examples: /core/text-fields-content#display-format
  notes: /core/text-fields-content#display-format
---

# Text Fields

**`text` puts any number of labels on a button, elbow or slider, each one placed and styled on its own.** You name each field (`label`, `value`, `unit` ...), give it `content`, and say where it goes.

- Every key under `text` except `default` is a field that is drawn. `text.default` holds the style every field starts from, so a field only sets what differs.
- Fields go into **zones**: named areas of the card such as a slider's `track` or an elbow's `horizontal_bar`. `position` then places the text within its zone.
- `content` takes [templates](/core/templates/), so a field can show an entity's state, a sum or a server-side Jinja2 value.
- The [astrometrics card](/cards/astrometrics/points#labels) uses the same keys for its point labels, placed round the point instead of in zones.

::: tip Try it
The card editor's **Text** tab (**Text Fields** on the slider) adds and styles fields with a live preview; the **Zones** tab shows and adds zones.
:::

| Page | Covers |
|------|--------|
| [Placing Text](./text-fields-placement) | `position`, `padding`, exact coordinates, alignment and rotation |
| [Zones](./text-fields-zones) | The zones each card has, your own zones, and the zone outlines |
| [Fonts, Colour and Backgrounds](./text-fields-style) | Font keys, sizing text to its zone, colour by state, the box behind a label |
| [Content and Formats](./text-fields-content) | Templates in `content`, and how entity states are formatted |

## Quick start

**A small label and a large reading on one button.** Both fields share the font and colour in `text.default`.

```yaml live
type: custom:lcards-button
entity: sensor.outdoor_temperature
preset: lozenge
text:
  default:
    font_family: "Antonio, sans-serif"
    color: var(--lcards-moonlight)
  label:
    content: Outdoor
    show: true
    position: top-left
    font_size: 11
    text_transform: uppercase
  value:
    content: "[[[return parseFloat(entity.state).toFixed(1) + '°C']]]"
    position: center
    font_size: 32
    font_weight: bold
    color:
      default: var(--lcards-moonlight)
      unavailable: var(--lcars-alert-red)
grid_options:
  rows: 2
```

## Inheritance

**`text.default` is the style every field on the card starts from; it is never drawn itself.** Set the font, size and colour once, and only what differs on each field.

- A field's own key wins over `text.default`, and `text.default` wins over the preset's defaults.
- Padding is merged side by side: a field that sets only `padding.top` keeps the left and right padding from `text.default`.
- What a field inherits is its style and alignment: the font keys, `color`, `position`, `padding`, `anchor`, `baseline`, `rotation`, `stretch`, `display_format` and the background keys. `content`, `show`, `zone`, `x` and `y` are set per field.

```yaml live controls
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
text:
  default:
    font_size: 12
    font_family: "Antonio, sans-serif"
    color: var(--lcards-moonlight)
  label:
    content: Brightness
    show: true
    position: top-left
    # font_size, font_family and color come from default
  value:
    content: "[[[return Math.round((entity.attributes.brightness || 0) / 255 * 100) + '%']]]"
    position: center
    font_size: 28
    font_weight: bold
    color:
      default: var(--lcards-moonlight)
      active: var(--lcars-orange)
grid_options:
  rows: 2
```

::: details More about inheritance
- **Preset fields:** what you write in `text.default` wins over what a preset sets on one of its own fields (such as the bar-label presets' `padding` and `font_size_percent` on `label`), and a key on the field itself wins over both.
- **`style.text.default`:** on the button, this sets the same style at a lower priority than `text.default`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `text` | object | from the preset | The fields, keyed by any name you choose |
| `text.default` | object | from the preset | Style every field inherits. It is not drawn |
| `text.<name>` | object | - | One field: the keys in [Per-field options](#per-field-options) |

## Preset-defined fields

**The button presets already hold three fields, `name`, `state` and `label`, positioned and styled for the preset.** Turn one on with `show: true`, or change its `content`.

- Most presets hide all three. The bar-label and panel presets show `label`; the filled and toggle-tab presets show `name`.
- A field with any other name (`value`, `subtitle` ...) is yours alone and shows by default.

```yaml live
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
text:
  name:
    show: true # the entity's name, where the preset puts it
  state:
    show: true # the entity's state, where the preset puts it
  label:
    content: DECK 7
    show: true
grid_options:
  rows: 2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `text.name.content` | string | `"{entity.attributes.friendly_name}"` | The entity's name |
| `text.name.show` | boolean | `false` | Show the name. The base preset puts it bottom right |
| `text.state.content` | string | `"{entity.state}"` | The entity's state |
| `text.state.show` | boolean | `false` | Show the state. The base preset puts it top right |
| `text.label.content` | string | a random code such as `3f-a2c` | A general-purpose label: two hex digits, a dash and three more, picked at random by a template |
| `text.label.show` | boolean | `false` | Show the label. The base preset puts it in the centre |

## Per-field options

**Every key a field takes, with the page that explains it.** All of them also work in `text.default` except those listed under [Inheritance](#inheritance) as set per field.

```yaml live
type: custom:lcards-button
entity: sensor.outdoor_temperature
preset: lozenge
text:
  reading:
    content: "{entity.state}"
    display_format: parts
    position: center-right
    font_size: 20
    letter_spacing: 2
    color: var(--lcars-orange)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `content` | string | from the preset, else - | The text. [Templates](./text-fields-content#content) work |
| `show` | boolean | `true` | Show or hide the field |
| `template` | boolean | `true` | `false` shows `{...}` and `[[[...]]]` literally: see [content](./text-fields-content#content) |
| `display_format` | string | `friendly` | How entity values in `content` are written: see [display_format](./text-fields-content#display-format) |
| `zone` | string | the card's main zone | The zone the field goes in: see [Zones](./text-fields-zones#zone) |
| [Placement keys](./text-fields-placement) | | | `position`, `padding`, `x`, `y`, `x_percent`, `y_percent`, `anchor`, `baseline`, `rotation` |
| [Font keys](./text-fields-style#fonts) | | | `font_size`, `font_family`, `font_weight`, `text_transform`, `letter_spacing` |
| [Zone-filling keys](./text-fields-style#filling-a-zone) | | | `font_size_percent`, `cap_height_ratio`, `stretch` |
| [`color`](./text-fields-style#color) | colour / state map | the theme's text colour | Text colour, by state if you like |
| [Background keys](./text-fields-style#text-background) | | | `background`, `background_padding`, `background_radius`, `background_width`, `background_min_width` |
