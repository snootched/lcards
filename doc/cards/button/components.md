---
description: "Button card components: the D-pad and Voyager D-pad with an action per segment, bracket arcs and radar scopes, and the Starfleet alert symbol with condition presets switched by value (ranges)."
---

# D-pads, Alerts and Scopes

`component` swaps the button's shape for a ready-made drawing whose parts (segments) each take their own colours and actions: a D-pad, the Voyager D-pad, the alert symbol, bracket arcs and a radar scope.

- A component draws to the height of its grid cell and keeps its proportions. In a sections view it asks for 6 columns and 5 rows (`alert` 4 rows, `dpad_voyager` 6); `grid_options` in your config changes that.
- Text fields go into the component's zones with `zone` (such as `center`); every component also has a `full` zone covering the whole drawing. See [Zones](/core/text-fields-zones).

## dpad

**`component: dpad` draws a nine-part direction pad, each part with its own action.** Use it for a TV remote, a camera mount or a media player.

- The segments are `up`, `down`, `left`, `right`, `center` and the corners `up-left`, `up-right`, `down-left`, `down-right`. `default` sets keys for every segment at once.
- A segment without a `tap_action` does nothing when tapped; the card's own `tap_action` doesn't run for it.

```yaml live
type: custom:lcards-button
component: dpad
dpad:
  segments:
    # every segment: gray, and a hold opens the TV's dialog
    default:
      style:
        fill: var(--lcars-gray)
      hold_action:
        action: more-info
    center:
      entity: media_player.tv
      style:
        fill:
          default: var(--lcars-orange)
          hover: var(--lcars-yellow)
      tap_action:
        action: call-service
        service: media_player.media_play_pause
        target:
          entity_id: media_player.tv
    up:
      style:
        fill: var(--lcars-blue)
      tap_action:
        action: call-service
        service: media_player.volume_up
        target:
          entity_id: media_player.tv
    down:
      style:
        fill: var(--lcars-blue)
      tap_action:
        action: call-service
        service: media_player.volume_down
        target:
          entity_id: media_player.tv
```

::: details More about dpad
- **Zones:** text zones use underscores (`up_left`, `down_right`), while the segments use hyphens (`up-left`). A text field without `zone` goes into the first zone, `up`.
- **Order:** the theme's D-pad colours, then `segments.default`, then the segment's own keys, so a segment's own `style` wins over `default` and `default` over the theme. The same holds on every component.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dpad.segments.default` | object | - | [Segment keys](#segment-keys) for every segment |
| `dpad.segments.<id>` | object | the theme's D-pad colours | [Segment keys](#segment-keys) for one segment: `up`, `down`, `left`, `right`, `center`, `up-left`, `up-right`, `down-left`, `down-right` |

### Segment keys

**The keys a segment takes, on every component and in [custom SVG](./custom-svg).** A style colour can be a state map, with `hover` and `pressed` keys for the pointer.

- A segment follows the card's `entity` unless it sets its own, so one D-pad can show several devices.

```yaml live
type: custom:lcards-button
component: dpad
dpad:
  segments:
    center:
      entity: light.living_room
      tap_action:
        action: toggle
      hold_action:
        action: more-info
      style:
        fill:
          active: var(--lcars-yellow)
          inactive: var(--lcars-gray)
        stroke: var(--lcars-orange)
        stroke-width: 2
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `entity` | string | the card's `entity` | The entity this segment shows and acts on |
| `tap_action` | object | - | What a tap on the segment does: see [Actions](/core/actions) |
| `hold_action` | object | - | What a hold does |
| `double_tap_action` | object | - | What a double tap does |
| `style.fill` | colour / state map | from the component | Fill colour |
| `style.stroke` | colour / state map | from the component | Outline colour |
| `style.stroke-width` | number / string / state map | from the component | Outline width in px (0 to 50), or a CSS length |
| `style.opacity` | number / state map | - | Opacity, 0 to 1 |
| `text` | string | - | Text written into the segment's element, for an SVG `<text>` element. May be a template |
| `animations` | list | - | Animations on this segment only: the same entries as the card's [animations](/core/animations) |
| `selector` | string | `#<segment id>` | CSS selector for the part of the drawing, to target several elements at once |

## dpad_voyager

**`component: dpad_voyager` draws the D-pad as on Voyager's consoles, with every shape of the artwork a segment of its own.** It has 56 segments; configure them under `dpad_voyager.segments` with the same [segment keys](#segment-keys).

- The main segments are `center`, `up_arrow`, `down_arrow`, `left_arrow`, `right_arrow` and the corners `up_left`, `up_right`, `down_left`, `down_right`.
- Each arm also has `<arm>_shaft`, `<arm>_outer` and `<arm>_ring` (and the up arm `up_inner` and `up_seam`). The decorative band round them is `ring_<direction>_<n>` (such as `ring_up_1` or `ring_upright_2`), `ring_down`, `ring_downright`, `top_bar_1` to `top_bar_7` and `accent_1` to `accent_6`.

```yaml live
type: custom:lcards-button
component: dpad_voyager
dpad_voyager:
  segments:
    center:
      entity: light.demo
      tap_action:
        action: toggle
      style:
        fill:
          active: var(--lcards-orange)
          inactive: var(--lcards-gray)
    up_arrow:
      tap_action:
        action: call-service
        service: media_player.volume_up
        target:
          entity_id: media_player.tv
    down_arrow:
      tap_action:
        action: call-service
        service: media_player.volume_down
        target:
          entity_id: media_player.tv
```

::: details More about dpad_voyager
- **Zones:** every segment is also a text zone of the same name, so a label can sit on any part. A text field without `zone` goes into `up_left`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `dpad_voyager.segments.default` | object | - | [Segment keys](#segment-keys) for every segment |
| `dpad_voyager.segments.<id>` | object | the theme's D-pad colours | [Segment keys](#segment-keys) for one segment |

## Brackets and Radar

**Two decorative round components: `brackets` frames a reading between two arcs, `radar` draws a scope.** Put a number or label in the `center` zone with a text field.

- `brackets` has the segments `left` and `right`, and the zones `center`, `left` and `right`.
- `radar` has the segments `rim`, `rings`, `inner-ring`, `cross` and `sweep` (the wedge), and the zone `center`. Their colours come from the theme's primary and secondary colours.

```yaml live
type: custom:lcards-button
component: brackets
text:
  label:
    content: "88"
    position: center
    font_size: 48
    color: theme:colors.ui.tertiary
```

```yaml live
type: custom:lcards-button
component: radar
radar:
  segments:
    sweep:
      style:
        fill: var(--lcars-orange)
    rim:
      style:
        stroke: var(--lcars-blue)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `brackets.segments.default` | object | - | [Segment keys](#segment-keys) for both arcs |
| `brackets.segments.<id>` | object | the theme's secondary colour | [Segment keys](#segment-keys) for `left` or `right` |
| `radar.segments.default` | object | - | [Segment keys](#segment-keys) for every part |
| `radar.segments.<id>` | object | the theme's colours | [Segment keys](#segment-keys) for `sweep`, `rings`, `inner-ring`, `cross` or `rim` |

## alert

**`component: alert` draws the Starfleet alert symbol: a shield with bars that sweep in light, and two lines of text.** `preset` picks the condition, and [`ranges`](#ranges) can switch it by a sensor's value.

- The presets are `default`, `condition_red`, `condition_yellow`, `condition_blue`, `condition_green`, `condition_gray` and `condition_black`. Each sets the shield and bar colours, the sweep colours and the text (`ALERT` over `CONDITION: RED` ...).
- The text fields are `alert_text` (zone `alert_line`) and `sub_text` (zone `sub_line`); set `text.alert_text.content` to change the words.

```yaml live
type: custom:lcards-button
component: alert
preset: condition_yellow
alert:
  color:
    shape: var(--lcars-orange)
text:
  sub_text:
    content: "DECK 7"
```

::: details More about alert
- **Your own presets:** `alert.custom_presets` adds presets or changes built-in ones, keyed by name. A preset with the name of a built-in one is merged over it, so you give only what changes. Each takes `segments.shape.style.fill`, `segments.bars.style.stroke` and `text.<field>.content` / `text.<field>.color`, and `extends: <preset>` builds on another preset.
- **Order:** the component's colours, then the preset's, then `alert.color`, then `alert.segments`; a matching range's `color` wins over all of them while it matches.
- **The sweep:** the bars' light sweep is two looping `on_load` animations with the ids `bars-top-sweep` and `bars-bottom-sweep`. An entry in `animations` with the same `id` changes it.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `preset` | string | `default` | The condition: `default`, `condition_red`, `condition_yellow`, `condition_blue`, `condition_green`, `condition_gray`, `condition_black`, or one of your `custom_presets` |
| `alert.color.shape` | colour | from the preset | Fill of the shield |
| `alert.color.bars` | colour | from the preset | Colour of the bars |
| `alert.segments.shape.style.fill` | colour | from the preset | Fill of the shield, as a segment style |
| `alert.segments.bars.style.stroke` | colour | from the preset | Colour of the bars, as a segment style |
| `alert.custom_presets` | object | - | Your own or changed presets, keyed by name |

### ranges

**`ranges` switches the component's preset by the entity's value: red alert above 80, yellow from 50.** The first entry that matches wins; when none matches, the card's `preset` (or `default`) is used.

- `above` and `below` are strict (`>` and `<`); `at_least` and `at_most` include the value itself. Combine one of each for a band, as in the example, so neighbouring bands meet without a gap.
- The value is the entity's state, or the attribute in `ranges_attribute` (or the entry's own `attribute`). `brightness_pct` is a light's brightness as 0 to 100.

```yaml live
type: custom:lcards-button
component: alert
entity: sensor.threat_level
ranges:
  - preset: condition_red
    at_least: 80 # 80 and up
  - preset: condition_yellow
    at_least: 50 # 50 up to 80
    below: 80
  - preset: default
    below: 50
```

::: details More about ranges
- **Text values:** `equals` compares as text, so it also matches states such as `"on"` or `"armed_away"`. An entry with `equals` ignores its number keys.
- **Changed meaning:** `above` used to include the value itself here (`>=`). A range that relied on a value landing exactly on an `above` boundary now needs `at_least`.
- **Attributes:** ranges are checked on every update, so a range on an attribute (a light's brightness) switches even when the state stays `on`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `ranges[].preset` | string | required | The component preset to use while this entry matches |
| `ranges[].above` | number | - | Matches when the value is greater than this |
| `ranges[].at_least` | number | - | Matches when the value is this or greater |
| `ranges[].below` | number | - | Matches when the value is less than this |
| `ranges[].at_most` | number | - | Matches when the value is this or less |
| `ranges[].equals` | string / number / boolean | - | Matches when the value is exactly this, compared as text |
| `ranges[].attribute` | string | `ranges_attribute` | The attribute this entry compares |
| `ranges[].color.shape` | colour | - | Shield fill while this entry matches |
| `ranges[].color.bars` | colour | - | Bar colour while this entry matches |
