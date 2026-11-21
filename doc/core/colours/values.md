---
description: "LCARdS colour values: CSS variables, theme token paths, the colour functions alpha(), darken(), lighten(), saturate(), desaturate(), mix() and base(), and match-light."
---

# Colour Values

The colour values you write most: palette variables, theme tokens, colour functions that derive one colour from another, and `match-light`. The full list of accepted formats (hex, `rgb()`, `oklch()` ...) is on the [Colours](../colours#colour-value-formats) page.

## CSS variables

**`var(--name)` uses a colour variable, so the card follows the theme and the alert mode.** It is the usual way to colour a card.

- LCARdS sets the `--lcards-*` palette itself, so those variables are there with any Home Assistant theme. The `--lcars-*` variables come from the HA-LCARS theme.
- In an alert mode, LCARdS shifts both palettes, and every colour that uses them follows at once. Use [`base()`](#base) for a colour that should not change.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  label:
    show: true
    content: PALETTE
    color: var(--lcards-moonlight)
style:
  card:
    color:
      background: var(--lcards-orange)
  border:
    color: var(--lcars-alert-red)
    width: 2
```

Some common ones:

| Variable | Notes |
|----------|-------|
| `var(--lcards-orange)`, `var(--lcards-orange-medium)` | LCARdS orange |
| `var(--lcards-blue)`, `var(--lcards-blue-light)` | LCARdS blue |
| `var(--lcards-moonlight)` | Near-white, for text and labels |
| `var(--lcards-gray)` | A standby grey |
| `var(--lcars-alert-red)`, `var(--lcars-alert-yellow)` | The HA-LCARS alert colours |

The [LCARdS CSS colour palette](../themes/#lcards-css-colour-palette) lists every `--lcards-*` shade.

## Theme token paths

**`theme:` followed by a token path takes a colour from the active theme.** Use it for colours that should match the theme's roles (primary, secondary, alert) rather than a fixed shade.

- A token path names a colour by its role, so changing the theme changes every card that uses it.
- Inside a colour function, a token path works without the `theme:` prefix: `alpha(colors.ui.primary, 0.4)`.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  label:
    show: true
    content: THEME
    color: theme:colors.text.onDark
style:
  card:
    color:
      background: theme:colors.ui.secondary
  border:
    color: theme:colors.alert.red
    width: 2
```

Some common ones:

| Token | Notes |
|-------|-------|
| `theme:colors.ui.primary` | The theme's main structure colour |
| `theme:colors.ui.secondary` | The secondary structure colour |
| `theme:colors.text.onDark` | Text on a dark background |
| `theme:colors.alert.red` | The alert red |

[Themes](../themes/) lists the token paths.

## Computed colour tokens

**Colour functions derive a colour from another: a darker shade, a lighter one, a see-through one, or a mix of two.** Use them to make a hover colour, a dimmed background or a glow from one palette colour.

- The first argument is any colour value, including another function: functions nest. Amounts are `0` to `1`, or a percentage (`15%`).
- A function over a CSS variable stays live, so it follows the alert mode too.
- An argument can be a token path, with or without `theme:`. A `theme:` in front of the whole function changes nothing: `theme:alpha(colors.ui.primary, 0.4)` is `alpha(colors.ui.primary, 0.4)`.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  label:
    show: true
    content: COMPUTED
    color: lighten(var(--lcards-blue), 30%)
style:
  card:
    color:
      background: alpha(darken(var(--lcards-orange), 0.2), 0.5)
  border:
    color: theme:alpha(colors.ui.primary, 0.4)
    width: 2
```

::: details More about colour functions
- **Leaving out the amount:** `darken()`, `lighten()`, `saturate()` and `desaturate()` use `0.2`, `alpha()` uses `1`, and `mix()` uses `0.5`.
- **`saturate()` and `desaturate()`** read a CSS variable's value at the moment the card draws, so after an alert-mode change they keep the old colour until the card draws again. The other functions follow at once.
:::

| Function | Example | Result |
|----------|---------|--------|
| `darken(colour, amount)` | `darken(var(--lcards-orange), 0.2)` | 20% towards black |
| `lighten(colour, amount)` | `lighten(var(--lcards-blue), 15%)` | 15% towards white |
| `alpha(colour, opacity)` | `alpha(var(--lcards-orange), 0.6)` | Opacity set to 60% |
| `saturate(colour, amount)` | `saturate(var(--lcards-orange-medium), 0.2)` | More vivid |
| `desaturate(colour, amount)` | `desaturate(var(--lcards-orange), 0.5)` | Closer to grey |
| `mix(colour1, colour2, weight)` | `mix(var(--lcars-red), var(--lcars-blue), 0.25)` | 25% of the first colour; the same as `color-mix(in srgb, var(--lcars-red) 25%, var(--lcars-blue))` |
| `base(colour)` | `base(var(--lcards-blue))` | The colour without the alert mode: see [base()](#base) |

### `base()`

**`base()` gives a variable's or token's normal (green alert) colour, whatever the alert mode.** Use it for a colour that must not change in red alert, such as a status light that means something on its own.

- `base()` takes a token path (`colors.ui.primary`), a variable (`var(--lcards-blue)`) or just its name (`--lcards-blue`).
- It works in every colour key, including animation and effect settings. A plain `var()` there follows the alert mode; wrap it in `base()` to keep it still.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  label:
    show: true
    content: ALWAYS BLUE
style:
  card:
    color:
      # stays this blue in red alert
      background: base(--lcards-blue-lightest)
  border:
    color: alpha(base(colors.ui.primary), 0.5)
    width: 2
```

::: details More about base()
- **Where the normal colour comes from:** for `--lcars-*` variables, the values LCARdS records when the theme loads; for `--lcards-*` variables, the LCARdS green alert palette.
- **Other variables**, and a `--lcars-*` variable before the theme has loaded, give their current value, as `var()` would.
:::

## `match-light`

**`match-light` is the current colour of the card's light.** Use it to tint a button or slider the colour the light is set to.

- It works when the card's `entity` is a `light.` entity that is on. When the light is off there is no colour, so put `match-light` under `active` in a [state map](./state-maps) and give `inactive` its own colour.
- `match-brightness` is the light's brightness as an opacity from `0` to `1`, for use inside a colour function: `alpha(match-light, match-brightness)`.
- A white-only light gives a warm white, brighter as the light is brighter.

```yaml live controls
type: custom:lcards-button
entity: light.tv
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
        active: alpha(match-light, match-brightness)
        inactive: var(--lcars-gray)
  border:
    color:
      active: match-light
      inactive: var(--lcars-gray)
    width: 2
```
