---
description: "Colours in LCARdS: every colour format a card accepts (CSS variables, theme tokens, colour functions, hex, rgb, oklch), state maps that follow an entity, attribute-driven colours and your own state buckets."
moved_anchors:
  css-variables: /core/colours/values#css-variables
  theme-token-paths: /core/colours/values#theme-token-paths
  computed-colour-tokens: /core/colours/values#computed-colour-tokens
  base-alert-mode-immune-colours: /core/colours/values#base
  state-based-colour-maps: /core/colours/state-maps
  state-keys: /core/colours/state-maps#state-keys
  resolution-order: /core/colours/state-maps#resolution-order
  where-colour-maps-are-valid: /core/colours/state-maps#where-colour-maps-are-valid
  examples: /core/colours/state-maps#state-keys
  climate-card-multi-field-state-colours: /core/colours/state-maps#state-keys
  numeric-sensor-range-based-colour: /core/colours/state-maps#number-keys
  template-strings-as-colour-values: /core/colours/state-maps#template-strings-as-colour-values
  driving-colour-from-a-different-entity-than-the-one-bound-to-the-card: /core/colours/state-maps#colour-from-another-entity
  range-conditions-on-non-numeric-entities-ranges-attribute: /core/colours/attributes#ranges-attribute
  special-virtual-attributes: /core/colours/attributes#ranges-attribute
  example-light-with-brightness-based-colour-and-icon: /core/colours/attributes#ranges-attribute
  supported-cards: /core/colours/attributes#ranges-attribute
  exact-match-keys-from-an-attribute-state-attribute: /core/colours/attributes#state-attribute
  what-it-affects: /core/colours/attributes#state-attribute
  state-attribute-vs-ranges-attribute: /core/colours/attributes#state-attribute
  supported-cards-1: /core/colours/attributes#state-attribute
  custom-state-classification-state-classification: /core/colours/attributes#state-classification
  built-in-bucket-overrides: /core/colours/attributes#state-classification
  custom-buckets: /core/colours/attributes#custom-buckets
  keys: /core/colours/attributes#state-classification
  priority-within-the-resolver: /core/colours/attributes#state-classification
  examples-1: /core/colours/attributes#state-classification
  supported-cards-2: /core/colours/attributes#state-classification
---

# Colours

**Every colour key on every LCARdS card takes the same colour values: a CSS variable, a theme token, a colour function, or any CSS colour.** A colour key can also take a state map, which picks a colour from the card's entity state.

- Colours built from CSS variables and theme tokens follow the [alert mode](./alert-mode): when red alert shifts the palette, they change with it, without a refresh. Hex and named colours stay as they are.
- A state map (`active`, `inactive`, `above:50`, a state name ...) picks the colour as the entity changes; templates work too.

| Page | Covers |
|------|--------|
| [Colour Values](./colours/values) | CSS variables, theme tokens, colour functions such as `alpha()` and `darken()`, `base()`, `match-light` |
| [State Maps](./colours/state-maps) | Colours by state: state and number keys, the order they are checked in, where maps work, templates |
| [Attributes and Buckets](./colours/attributes) | Colours from an attribute (`ranges_attribute`, `state_attribute`) and your own state groups (`state_classification`) |

---

## Quick start

**Two examples to start from: one fixed colour, and a colour that follows the entity.**

- A fixed colour is a plain value. A colour that follows the entity is a map of states to colours, with `default` for everything else.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  label:
    show: true
    content: FIXED
style:
  card:
    color:
      background: alpha(var(--lcars-blue), 0.6)
```

```yaml live controls
type: custom:lcards-button
entity: input_boolean.lcards_test_toggle
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
style:
  card:
    color:
      background:
        active: var(--lcars-orange)
        inactive: var(--lcars-gray)
        unavailable: var(--lcars-alert-red)
```

## Colour value formats

**What you can write in a colour key.** Every format works in every colour key, on its own or as a value in a [state map](./colours/state-maps).

- Quote hex colours in YAML: unquoted, `#ff9900` starts a comment and the key is left empty.

| Format | Example | Notes |
|--------|---------|-------|
| CSS variable | `var(--lcards-orange)` | Any `--lcards-*`, `--lcars-*` or Home Assistant variable. See [CSS variables](./colours/values#css-variables) |
| Theme token path | `theme:colors.ui.primary` | A colour from the active theme. See [Theme token paths](./colours/values#theme-token-paths) |
| Colour function | `darken(var(--lcards-orange), 0.2)` | `alpha()`, `darken()`, `lighten()`, `saturate()`, `desaturate()`, `mix()`, `base()`. See [Computed colour tokens](./colours/values#computed-colour-tokens) |
| Hex | `"#F90"`, `"#FF9900"`, `"#FF990080"` | 3, 4, 6 or 8 digits; the last digit (of 4) or pair (of 8) is the alpha |
| Named colour | `black`, `orange`, `transparent` | Any CSS colour name, in lower case, and `currentColor` |
| RGB / HSL | `rgba(255, 153, 0, 0.5)`, `hsl(36 100% 50%)` | Comma or space syntax, optional `/ alpha` |
| Other CSS colours | `oklch(0.75 0.17 60)`, `color-mix(in srgb, red 25%, blue)` | `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`, `color-mix()` |
| Match light | `match-light` | The colour of the card's light entity. See [match-light](./colours/values#match-light) |

## Card keys

**Three top-level card keys change how state maps read the entity.** They are on the [Attributes and Buckets](./colours/attributes) page.

```yaml live controls
type: custom:lcards-button
entity: light.tv
preset: lozenge
ranges_attribute: brightness_pct # ranges compare the brightness, 0 to 100
text:
  name:
    show: true
style:
  card:
    color:
      background:
        above:70: var(--lcars-yellow)
        active: var(--lcars-orange)
        inactive: var(--lcars-gray)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `ranges_attribute` | string | the state | The attribute that range keys (`above:N`, `between:N:M` ...) compare: see [ranges_attribute](./colours/attributes#ranges-attribute) |
| `state_attribute` | string | - | The attribute whose value picks exact-match keys: see [state_attribute](./colours/attributes#state-attribute) |
| `state_classification` | object | - | Which states count as active or inactive, and your own named groups: see [state_classification](./colours/attributes#state-classification) |
