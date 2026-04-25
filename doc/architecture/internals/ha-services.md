# HA Services (Actions)

> **`lcards.*` action namespace** — Control LCARdS from automations, scripts, voice assistants, and Developer Tools.

---

## Overview

The LCARdS integration registers a set of HA **actions** (formerly called services) under the `lcards` domain. They are available from:

- **Developer Tools → Actions** (one-shot testing)
- **Automations & Scripts** (`action:` blocks with YAML or the visual editor)
- **Voice assistants** that call HA services
- The **REST / WebSocket API** for external integrations

Services are registered in `async_setup_entry()` and removed cleanly on `async_unload_entry()`, so they appear and disappear with the integration lifecycle.

---

## File

`custom_components/lcards/services.py`
`custom_components/lcards/services.yaml`

---

## Service Reference

### Alert Mode Services

Alert state is stored in `input_select.lcards_alert_mode` — the single source of truth. All alert services call `input_select.select_option` on that entity, which propagates automatically to:

- `ThemeManager` — switches colour palette
- `SoundManager` — triggers alert sounds
- Alert overlay animations on registered MSD cards

#### `lcards.set_alert_mode`

Set any alert mode by name.

| Field | Type | Required | Options |
|-------|------|----------|---------|
| `mode` | `select` | ✅ | `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`, `green_alert` |

```yaml
action: lcards.set_alert_mode
data:
  mode: red_alert
```

#### `lcards.red_alert`

Activates red alert mode. No parameters.

```yaml
action: lcards.red_alert
```

#### `lcards.yellow_alert`

Activates yellow alert mode. No parameters.

```yaml
action: lcards.yellow_alert
```

#### `lcards.blue_alert`

Activates blue alert mode. No parameters.

```yaml
action: lcards.blue_alert
```

#### `lcards.gray_alert`

Activates gray alert mode. No parameters.

```yaml
action: lcards.gray_alert
```

#### `lcards.black_alert`

Activates black alert mode. No parameters.

```yaml
action: lcards.black_alert
```

#### `lcards.clear_alert`

Returns to normal (sets mode to `green_alert`). No parameters.

```yaml
action: lcards.clear_alert
```

---

### Frontend Control Services

These services use the **Python → JS push channel** (`lcards_event` HA bus event) to instruct connected browser tabs directly — no page refresh required for `set_log_level`.

#### `lcards.reload`

Forces all connected LCARdS browser tabs to reload (`window.location.reload()`). Useful after pushing new assets or changing configuration.

```yaml
action: lcards.reload
```

::: warning
This *immediately* reloads every browser tab that has LCARdS loaded. Use with care if users are actively interacting with dashboards.
:::

#### `lcards.set_log_level`

Changes the JS frontend log level at runtime across all connected tabs, *and* updates the Python logger hierarchy simultaneously.

| Field | Type | Required | Options |
|-------|------|----------|---------|
| `level` | `select` | ✅ | `off`, `error`, `warn`, `info`, `debug`, `trace` |

```yaml
action: lcards.set_log_level
data:
  level: debug
```

Once applied, verbose log output appears immediately in the browser console — no HA restart or page reload required.

---

## Automation Examples

### Trigger red alert on a motion sensor

```yaml
alias: Red alert on motion
trigger:
  - platform: state
    entity_id: binary_sensor.hallway_motion
    to: "on"
action:
  - action: lcards.red_alert
```

### Cycle through alert modes on a button press

```yaml
alias: Demo alert cycle
trigger:
  - platform: state
    entity_id: input_button.demo_alert
action:
  - action: lcards.set_alert_mode
    data:
      mode: "{{ states('input_select.demo_alert_cycle') }}"
```

### Enable debug logging when a dev mode flag is set

```yaml
alias: LCARdS debug on dev mode
trigger:
  - platform: state
    entity_id: input_boolean.lcards_dev_mode
action:
  - choose:
      - conditions:
          - condition: state
            entity_id: input_boolean.lcards_dev_mode
            state: "on"
        sequence:
          - action: lcards.set_log_level
            data:
              level: debug
      - conditions:
          - condition: state
            entity_id: input_boolean.lcards_dev_mode
            state: "off"
        sequence:
          - action: lcards.set_log_level
            data:
              level: warn
```

---

## Push Channel Architecture

`lcards.reload` and `lcards.set_log_level` use a dedicated **server-push channel** instead of the WebSocket request/response pattern:

```
Python service handler
    → hass.bus.async_fire("lcards_event", { "action": "...", ...payload })
        → HA internal event bus
            → ws_subscribe._forward() (websocket_api.py, @callback)
                → connection.send_message(event_message(...))
                    → every browser tab subscribed via lcards/subscribe
                        → IntegrationService._handleLcardsEvent(data)
                            → window.location.reload()  (reload)
                            → window.lcards.setGlobalLogLevel(level)  (set_log_level)
```

Browser tabs subscribe using the `lcards/subscribe` WS command (not the HA-native `subscribeEvents` API, which is restricted to admin users for custom event types). This means **all users including non-admins** receive push events.

This is a **broadcast** — all connected browser tabs receive the event simultaneously. There is no targeted delivery to a single tab.

→ See [Integration Service — Push Channel](integration-service#push-channel) for the JS-side implementation details.

---

## Graceful Degradation

### Missing `input_select.lcards_alert_mode`

If the `input_select.lcards_alert_mode` helper hasn't been created (e.g. a fresh install without running the LCARdS setup helper), alert services log a `WARNING` and exit cleanly — they do **not** raise an exception or crash HA:

```
WARNING (MainThread) [custom_components.lcards.services]
LCARdS: failed to set alert mode 'red_alert' — is input_select.lcards_alert_mode defined? (...)
```

### Integration not loaded

If the integration entry is not active, the `lcards.*` services are not registered and will not appear in Developer Tools → Actions or in automations.

---

## Implementation Notes

- Alert services are intentionally **thin wrappers** — they delegate to `input_select.select_option` rather than directly touching JS state, because `input_select.lcards_alert_mode` is the established source of truth that HelperManager already monitors.
- Services are idempotent — calling `lcards.red_alert` when already in red alert is harmless.
- Schema validation is enforced by `voluptuous` in `services.py`; invalid `mode` or `level` values are rejected by HA before the handler fires.

---

## Related

- [HA Integration Architecture](../ha-integration) — boot sequence, unload, Python component files
- [Integration Service](integration-service) — JS-side probe and push channel subscription
- [Helper Manager](helper-manager) — how `input_select.lcards_alert_mode` changes are consumed by the JS side
