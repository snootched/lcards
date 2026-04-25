# Actions

LCARdS cards support actions `tap_action`, `hold_action`, and `double_tap_action`. These follow the standard Home Assistant action model.

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
| `pipeline_id` | string | Assist pipeline ID to use (optional, `assist` action only) |
| `start_listening` | boolean | Start the Assist pipeline in listening mode (optional, `assist` action only) |

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

## Hover Effects & Cursor

Hover behaviour (visual feedback like colour changes and animations when the pointer is over the card) can be disabled when interactivy feedback is not desired (for instance using a button card as a decorative panel.)  You may also customize which cursor is shown on hover, should you desire.

These options are configured directly on the card, and not on individual action objects.

### `interactive`

Controls whether the card shows visual hover feedback.

| Value | Cursor | Hover colour change | Hover animations |
|-------|--------|---------------------|------------------|
| `true` (default) | pointer (hand) | Yes | Yes |
| `false` | default (arrow) | No | No |

Tap and hold actions are unaffected by this flag.

```yaml
type: custom:lcards-button
interactive: false    # decorative — no hand cursor or hover effects
tap_action:
  action: toggle      # still fires on tap
```

### `style.cursor`

Overrides the CSS cursor independently of `interactive`. Useful when you want hover effects but a non-standard cursor shape, or want to suppress the cursor without disabling all hover effects.

```yaml
type: custom:lcards-button
style:
  cursor: crosshair   # any valid CSS cursor value
```

Common cursor values: `pointer`, `default`, `none`, `not-allowed`, `crosshair`, `grab`, `zoom-in`, `help`, `wait`, `progress`, `move`, `copy`, `text`.

---

## Double-Tap Disambiguation

When `double_tap_action` is configured, a 300 ms window is used to distinguish a single tap from a double tap. If the second tap arrives within 300 ms, the double-tap action fires instead of the single-tap action.
