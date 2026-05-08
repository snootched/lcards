# HA Services — Implementation Notes

> **Architecture reference** — internals of the `lcards.*` action registration and push channel. For usage, parameters, and automation examples see the **[HA Actions user guide](/configuration/ha-actions)**.

---

## Overview

The LCARdS integration registers a set of HA **actions** (formerly called services) under the `lcards` domain. Services are registered in `async_setup_entry()` and removed cleanly on `async_unload_entry()`, so they appear and disappear with the integration lifecycle.

**Source files:**

- `custom_components/lcards/services.py` — handler implementations, voluptuous schemas
- `custom_components/lcards/services.yaml` — HA UI metadata (selector types, field labels)

→ For full service descriptions, parameter tables, YAML examples, and automation recipes see the **[HA Actions user guide](/configuration/ha-actions)**.

---

## Service Groups (Implementation Summary)

| Group | Services | Implementation pattern |
|-------|----------|----------------------|
| **Alert mode** | `set_alert_mode`, `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`, `clear_alert` | Thin wrappers — delegate to `input_select.select_option` on `input_select.lcards_alert_mode`. Idempotent. Schema: `voluptuous`. |
| **Frontend control** | `reload`, `set_log_level` | Fire `lcards_event` on the HA bus; forwarded to all subscribed browser tabs via the push channel (see below). `set_log_level` also updates the Python `logging` hierarchy. |
| **Portal overlay** | `show_portal_card`, `clear_portal_card` | Same push channel. Cards are mounted in `PortalOverlayManager` under slot `'ha-service'`, independent of `'alert-overlay'` and `'connection-overlay'`. Support per-device / per-user targeting. |
| **Borg** | `borg_assimilate`, `borg_deassimilate` | Same push channel. When targeting is specified, the shared `input_select.lcards_alert_mode` is **not** written — palette changes are local to matched devices only. |

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

→ See [Integration Service — Push Channel](../subsystems/integration-service#push-channel) for the JS-side implementation details.

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

- [HA Actions — User Guide](/configuration/ha-actions) — service descriptions, parameters, YAML, and automation examples
- [HA Integration Architecture](../ha-integration) — boot sequence, unload, Python component files
- [Integration Service](../subsystems/integration-service) — JS-side probe and push channel subscription
- [Helper Manager](../subsystems/helper-manager) — how `input_select.lcards_alert_mode` changes are consumed by the JS side
