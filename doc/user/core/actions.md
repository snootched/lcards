# Actions

Every LCARdS card supports `tap_action`, `hold_action`, and `double_tap_action`. These follow the standard Home Assistant action model with a few extensions for animation triggers.

---

## Action Object Options

| Field | Type | Description |
|-------|------|-------------|
| `action` | string | Action type — see table below (required) |
| `entity` | string | Override entity for `toggle` / `more-info` (defaults to the card's `entity`) |
| `service` | string | Service to call, e.g. `light.turn_on` (alias: `perform_action`) |
| `service_data` | object | Data passed to the service (alias: `data`) |
| `target` | object | HA service target — `entity_id`, `device_id`, or `area_id` |
| `navigation_path` | string | Dashboard path for `navigate` action, must start with `/` |
| `url_path` | string | URL to open for `url` action |
| `confirmation` | boolean / object | Show a confirmation dialog before executing |

---

## Action Types

| `action` value | Description |
|---------------|-------------|
| `toggle` | Toggle the card's entity on/off |
| `more-info` | Open the HA more-info dialog for the entity |
| `call-service` | Call a HA service (use `service` + `service_data`) |
| `perform-action` | Alias for `call-service` (HA 2024+ naming) |
| `navigate` | Navigate to a dashboard path |
| `url` | Open a URL |
| `assist` | Open the HA Assist dialog |
| `none` | Do nothing — suppresses the default action |

---

## Confirmation Dialog

Set `confirmation: true` to use a simple yes/no prompt, or supply an object for a custom message:

```yaml
tap_action:
  action: call-service
  service: switch.turn_on
  service_data:
    entity_id: switch.gate
  confirmation:
    text: "Open the gate?"
```

---

## Double-Tap Disambiguation

When `double_tap_action` is configured, a 300 ms window is used to distinguish a single tap from a double tap. If the second tap arrives within 300 ms, the double-tap action fires instead of the single-tap action.

---

## Templates in Action Data

`service_data` values support all template syntaxes:

```yaml
tap_action:
  action: call-service
  service: light.turn_on
  service_data:
    entity_id: light.kitchen
    brightness_pct: "[[[return Math.round(entity.attributes.brightness / 255 * 100)]]]"
    transition: 1
```

---

## Comprehensive Example

A light button with all three action types:

```yaml
type: custom:lcards-button
entity: light.living_room
preset: lozenge
text:
  name:
    content: Living Room
tap_action:
  action: toggle

hold_action:
  action: more-info

double_tap_action:
  action: call-service
  service: light.turn_on
  service_data:
    brightness_pct: 100
    color_name: white
  confirmation:
    text: "Set living room to full bright?"
```

### Service call with target

```yaml
tap_action:
  action: call-service
  service: light.turn_on
  target:
    area_id: living_room
  service_data:
    brightness_pct: 80
    color_temp: 4000
```

### Navigation button

```yaml
tap_action:
  action: navigate
  navigation_path: /lovelace/lights

hold_action:
  action: navigate
  navigation_path: /lovelace/home
```

---

## Slider Actions

Sliders use a named `actions` map instead of top-level `tap_action`:

```yaml
actions:
  on_change:
    action: call-service
    service: light.turn_on
    service_data:
      brightness_pct: "{slider.value}"    # Current slider value
  on_release:
    action: call-service
    service: input_number.set_value
    service_data:
      value: "{slider.value}"
```

See [Slider card](../cards/slider/README.md#actions) for the full named action reference.

---

## Related

- [Button card](../cards/button/README.md)
- [Templates](templates/README.md)
- [Animations](animations.md) — `on_tap`, `on_hold`, `on_double_tap` animation triggers
