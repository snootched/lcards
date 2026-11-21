---
description: "Elbow card symbiont: embed any Home Assistant card in the elbow's open area, place and size it, and imprint colours, fonts and corner radii on it to match."
---

# Symbiont

**The symbiont puts another Home Assistant card inside the elbow's open area: a chart, a camera, an alarm panel or any other card.** LCARdS mounts the card inside the bars and can "imprint" colours, fonts and corner radii on it so it matches the LCARS frame, without changing the embedded card's own config.

## Embedding a card

**`symbiont.card` is the card to embed, written exactly as on a dashboard; `enabled: true` turns it on.** The card fills the open area inside the bars.

- The open area starts at the inner edge of the bars (both elbows and the gap on a segmented elbow, every side of a frame). It follows each type's arms: both sides on the contained types, no side bar on the open types, and the whole card on the bar types. `position` adds padding inside it.
- Home Assistant's own cards (`entities`, `alarm-panel`, `thermostat` ...) only exist in Home Assistant, so the live example here embeds an LCARdS card.

```yaml live
type: custom:lcards-elbow
grid_options:
  rows: 4
elbow:
  type: header-left
  segment:
    bar_width: 100
    bar_height: 22
    color: var(--lcars-orange)
symbiont:
  enabled: true
  position:
    top: 10
    left: 10
    right: 10
    bottom: 10
  card:
    type: custom:lcards-slider
    entity: sensor.desk_sensor_temperature
    preset: gauge-basic
```

A Home Assistant card goes in the same way:

```yaml
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 100
    bar_height: 22
symbiont:
  enabled: true
  card:
    type: alarm-panel
    entity: alarm_control_panel.home
    states:
      - arm_away
      - arm_home
```

::: details More about embedding
- **Cards not loaded yet:** Home Assistant loads many of its own cards (`alarm-panel`, `thermostat`, `media-player` ...) only when a dashboard first shows one, so on a fresh page load the card may not exist yet. LCARdS then mounts it through Home Assistant's own card loader, which loads it; the card appears once it has loaded, with nothing to configure.
- **Changing the config:** turning the symbiont on or off, or changing the card's `type`, mounts a new card. Other changes (position, imprint, `custom_style`) apply to the card already there.
- **Overflow:** the container clips the card at its edges by default; `overflow` (or `overflow_x` and `overflow_y` for one direction) lets it scroll or spill out.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `symbiont.enabled` | boolean | `false` | Turn the embedded card on |
| `symbiont.card` | object | - | Any Home Assistant card config (`type` and its keys). `uix` and `card_mod` blocks are passed through: see [Using UIX](#using-uix-with-symbiont) |
| `symbiont.position.top` | number | `0` | Padding above the card inside the open area, px |
| `symbiont.position.left` | number | `0` | Padding on the left, px |
| `symbiont.position.right` | number | `0` | Padding on the right, px |
| `symbiont.position.bottom` | number | `0` | Padding below, px |
| `symbiont.overflow` | string | `hidden` | CSS overflow of the container in both directions: `visible`, `hidden`, `clip`, `scroll` or `auto` |
| `symbiont.overflow_x` | string | `overflow` | Horizontal overflow; overrides `overflow` |
| `symbiont.overflow_y` | string | `overflow` | Vertical overflow; overrides `overflow` |
| `symbiont.size` | object | the whole open area | An explicit size: see [Size and anchor](#size-and-anchor) |
| `symbiont.anchor` | string | `top-left` | Where a sized card sits: see [Size and anchor](#size-and-anchor) |
| `symbiont.imprint` | object | - | Styles pressed onto the card: see [imprint](#imprint) |
| `symbiont.custom_style` | string | - | Your own CSS for the card: see [custom_style](#custom-style) |

## Size and anchor

**`size` gives the embedded card a width and height of its own, and `anchor` says where in the open area it sits.** Without `size` the card fills the open area (inside the `position` padding).

- `anchor` does nothing without `size`, since the card already fills the space.
- A width or height you leave out is the full open area.

```yaml live
type: custom:lcards-elbow
grid_options:
  rows: 4
elbow:
  type: footer-right
  segment:
    bar_width: 90
    bar_height: 20
    color: var(--lcars-african-violet)
symbiont:
  enabled: true
  size:
    width: 60%
    height: 60
  anchor: center
  card:
    type: custom:lcards-slider
    entity: light.bedroom
    preset: pills-basic
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `symbiont.size.width` | number / string | the open area's width | A number is px; a string is any CSS length (`95%`, `300px`, `clamp(200px, 80%, 600px)`) |
| `symbiont.size.height` | number / string | the open area's height | The same, for the height |
| `symbiont.anchor` | string | `top-left` | `top-left`, `top-center`, `top-right`, `middle-left`, `center`, `middle-right`, `bottom-left`, `bottom-center` or `bottom-right` |

## `imprint`

**Imprint presses the elbow's style onto the embedded card: background, text colour, font and corner radii.** It adds a `<style>` to the embedded card, so the card keeps its own config.

- Colours follow the elbow's `entity`, so they change with its state like the elbow's own colours. They take the same values: CSS variables, theme tokens, `alpha()` and the other colour functions, and state maps.
- An `imprint` block with no `border_radius` rounds the one corner of the card that sits against the elbow's inner curve, to match it; the other corners keep the card's own radius.

This example needs Home Assistant's alarm panel card, so it is not live:

```yaml
type: custom:lcards-elbow
entity: alarm_control_panel.home
elbow:
  type: header-left
  segment:
    bar_width: 100
    bar_height: 22
symbiont:
  enabled: true
  card:
    type: alarm-panel
    entity: alarm_control_panel.home
  imprint:
    background:
      default: alpha(var(--lcars-black), 0.5)
      active: alpha(var(--lcars-red), 0.25)
    text:
      color:
        default: var(--lcars-orange)
        active: var(--lcars-red)
    border_radius:
      top_left: match # the elbow's inner curve
      top_right: 0
      bottom_left: 0
      bottom_right: 0
```

::: details More about imprint
- **Where it goes:** the styles land on the card's `ha-card` (or the card itself) with `!important`. Background and text colour are also set as `--ha-card-background` and `--primary-text-color` on the container, for cards that read those.
- **Turning it off:** `imprint.enabled: false` removes the injected styles, `custom_style` included.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `symbiont.imprint.enabled` | boolean | `true` | `false` turns off all injected styles, `custom_style` too |
| `symbiont.imprint.background` | colour / state map | - | Background of the embedded card |
| `symbiont.imprint.text.color` | colour / state map | - | Text colour |
| `symbiont.imprint.text.font_size` | string | - | Font size, such as `14px` |
| `symbiont.imprint.text.font_family` | string | - | Font family |
| `symbiont.imprint.border_radius` | object | the corner against the elbow matches it | Corner radii: see [imprint.border_radius](#imprint-border-radius) |

### `imprint.border_radius`

**Sets the embedded card's corner radii, one corner at a time.** `match` copies the elbow's inner curve, which suits the corner that sits against it.

- A corner you leave out keeps the card's own radius.
- `match_host` is the older form: `true` (the default when `border_radius` is left out) rounds only the corner against the elbow and ignores the per-corner keys; `false` uses the per-corner keys.

```yaml
symbiont:
  enabled: true
  card:
    type: entities
    entities:
      - sensor.temperature
  imprint:
    border_radius:
      top_left: match
      bottom_right: 12
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `top_left` | number / string | - | `match` (the elbow's inner curve) or a radius in px |
| `top_right` | number / string | - | The same, top right |
| `bottom_left` | number / string | - | The same, bottom left |
| `bottom_right` | number / string | - | The same, bottom right |
| `match_host` | boolean | `true` | Older form: `true` matches only the corner against the elbow, `false` uses the per-corner keys |

## `custom_style`

**`custom_style` adds your own CSS to the embedded card, with nothing else to install.** Use it for overrides that imprint has no key for.

- It is added after the imprint styles, so it wins where both set the same property.
- It needs imprint on: `imprint.enabled: false` turns it off too.

```yaml
symbiont:
  enabled: true
  card:
    type: entities
    entities:
      - sensor.temperature
  custom_style: |
    ha-card {
      --ha-card-border-radius: 0;
      --secondary-text-color: var(--lcards-moonlight);
    }
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `symbiont.custom_style` | string | - | CSS added to the embedded card's shadow root, after the imprint styles |

## Using UIX with symbiont

**[UIX](https://github.com/Lint-Free-Technology/uix) (UI eXtension, which HA-LCARS uses) styles symbiont cards as it does any card: put the `uix` block in the embedded card's config and LCARdS passes it through.** An older `card_mod` block is passed through too and UIX reads it, but card-mod itself no longer works with current Home Assistant.

- UIX styles go on first; the imprint and `custom_style` come after them, so **imprint wins** where both set the same property. Properties only one of them sets don't clash.
- To let UIX style the card on its own, set `imprint.enabled: false` (which also turns off `custom_style`). For simple overrides, `custom_style` needs nothing else installed.

```yaml
symbiont:
  enabled: true
  card:
    type: alarm-panel
    entity: alarm_control_panel.home
    uix:
      style: |
        ha-card {
          background: transparent !important;
          box-shadow: none !important;
          border: 1px solid var(--lcars-blue) !important;
          border-radius: 0 !important;
        }
  imprint:
    text:
      color:
        default: var(--lcars-orange)
        active: var(--lcars-red)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `symbiont.card.uix` | object | - | The embedded card's UIX styles, passed through unchanged |
