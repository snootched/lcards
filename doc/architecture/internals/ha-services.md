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

16 services total, registered from `_ALL_SERVICES` in `services.py`:

| Group | Services | Implementation pattern |
|-------|----------|----------------------|
| **Alert mode** | `set_alert_mode`, `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`, `clear_alert` | Thin wrappers — delegate to `input_select.select_option` on `input_select.lcards_alert_mode`, **unless** a targeting field is given, in which case they fire a targeted `set_alert_mode` push event instead and leave the shared helper untouched. Idempotent. Schema: `voluptuous`. |
| **Frontend control** | `reload`, `set_log_level` | Always fire `lcards_event` on the HA bus via the push channel (see below) — never conditional on targeting. `set_log_level` also updates the Python `logging` hierarchy. |
| **Screen effects & sound** | `trigger_effect`, `clear_effect`, `play_sound` | Always fire via the push channel. `trigger_effect` sets per-slot (`backdrop`/`color`/`canvas`) effect layers with an optional auto-clear `duration`; `clear_effect` clears one slot or all; `play_sound` plays a configured UI event sound or one exact asset. |
| **Portal overlay** | `show_portal_card`, `clear_portal_card` | Always fire via the push channel. Cards are mounted in `PortalOverlayManager` under slot `'ha-service'`, independent of `'alert-overlay'` and `'connection-overlay'`. |
| **Borg** | `borg_assimilate`, `borg_deassimilate` | Always fire via the push channel. When targeting is specified, the shared `input_select.lcards_alert_mode` is **not** written — palette changes are local to matched devices only. |

All 16 services accept the same four optional targeting fields — `target_device_ids`, `target_device_names`, `target_user_ids`, `target_user_names` — resolved server-side by `_async_resolve_targets()` and merged (explicit IDs + name lookups) before being attached to the outgoing event as `target_device_ids`/`target_user_ids`. Omitting all four is a broadcast. → Full field semantics: [HA Actions user guide](/configuration/ha-actions).

---

## Push Channel Architecture

Nine services (`reload`, `set_log_level`, `trigger_effect`, `clear_effect`, `play_sound`, `show_portal_card`, `clear_portal_card`, `borg_assimilate`, `borg_deassimilate`) always route through a dedicated **server-push channel** instead of the WebSocket request/response pattern. The 7 alert-mode services route through the same channel only when a targeting field is supplied (otherwise they write `input_select.lcards_alert_mode` directly — see the service table above):

```
Python service handler (via _fire_targeted_event())
    → hass.bus.async_fire("lcards_event", { "action": "...", ...payload })
        → HA internal event bus
            → ws_subscribe._forward() (websocket_api.py, @callback)
                → connection.send_message(event_message(...))
                    → every browser tab subscribed via lcards/subscribe
                        → IntegrationService._handleLcardsEvent(data)
                            → dispatches on payload.action (see event payload table
                              in HA Integration Architecture)
```

Browser tabs subscribe using the `lcards/subscribe` WS command (not the HA-native `subscribeEvents` API, which is restricted to admin users for custom event types). This means **all users including non-admins** receive push events.

Transport is always a **broadcast** — every subscribed tab receives every event. When an event carries `target_device_ids`/`target_user_ids` (i.e. a service call supplied targeting fields), each `IntegrationService._isEventTargetedAtMe()` self-filters client-side and silently drops events not addressed to it; there is no server-side targeted delivery to a single connection.

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
