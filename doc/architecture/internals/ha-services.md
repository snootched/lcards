# Home Assistant Services: Implementation Notes

> **Architecture reference**: how the `lcards.*` actions are registered, validated and delivered. For what each action does, with YAML and automation examples, see the **[Home Assistant Actions user guide](/configuration/ha-actions)**.

---

## Overview

The integration registers 18 Home Assistant **actions** (formerly called services) in the `lcards` domain. `async_setup_services(hass)` runs in `async_setup_entry()` and `async_remove_services(hass)` in `async_unload_entry()`, so the actions exist only while the config entry is loaded ([boot sequence](../ha-integration#boot-sequence)).

**Source files:**

- `custom_components/lcards/services.py`: one closure handler per action inside `async_setup_services()`, the `probatio` schemas, targeting resolution and the event helper.
- `custom_components/lcards/services.yaml`: names, descriptions and field selectors for Developer tools > Actions and the automation editor. It is UI metadata only; validation is the schema in `services.py`.
- `src/core/services/IntegrationService.js`: the browser side of every action that is delivered as an event ([Integration Service: Handled actions](../subsystems/integration-service#handled-actions)).

Two tests keep the files in step: `tests/docs/llms-txt.test.js` fails when the `SERVICE_*` names in `services.py` and the top-level keys of `services.yaml` differ, or when `doc/configuration/ha-actions.md` misses an action; `tests/core/borg-sound.test.js` checks that `_SOUND_EVENT_TYPES` and the `play_sound` selector offer the page sound events.

---

## Registration and Schemas

Every action name is a `SERVICE_*` constant (`services.py:192-209`), listed in `_ALL_SERVICES` (`:211-230`) for removal, and registered with `hass.services.async_register(DOMAIN, name, handler, schema=...)` (`:540-691`). Schemas use `probatio` imported as `vol` (`services.py:53`), the voluptuous-compatible library Home Assistant uses since 2026.10. Home Assistant validates the call against the schema before the handler runs, so a bad field never reaches a handler; it is rejected with a validation error in the UI or the automation trace.

All 18 schemas include the four targeting fields (`_TARGET_FIELDS`, `services.py:96-101`): each an optional list of non-empty strings. Unknown fields are rejected (the schemas do not allow extra keys).

| Action | Schema (besides targeting) |
|---|---|
| `set_alert_mode` | `mode`: required, one of `_ALERT_MODES` (`green_alert`, `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`) |
| `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`, `clear_alert` | none |
| `reload` | none |
| `set_log_level` | `level`: required, one of `LOG_LEVEL_OPTIONS` (`off`, `error`, `warn`, `info`, `debug`, `trace`) |
| `trigger_effect` | `layers`: required dict; `duration`: int, at least 100 (ms) |
| `clear_effect` | `slot`: one of `""`, `backdrop`, `canvas`, `color` |
| `play_sound` | `event_type`: one of `_SOUND_EVENT_TYPES` (`services.py:78-88`, kept in step with `EVENT_CATEGORY` in `src/core/sound/SoundManager.js`); `asset_key`: non-empty string. Then `vol.Any`: an `event_type` or an `asset_key` is required ("play_sound needs an event_type or an asset_key") |
| `fly_to` | `card_id`: required non-empty string; `view`, `point`: non-empty strings; `duration`: int 0-60000; `warp`: bool. Then `vol.Any`: a `view` or a `point` is required ("fly_to needs a view or a point") |
| `set_clock` | `card_id`: required non-empty string; `date`: non-empty string; `rate`: a number (coerced to float), `"live"`, or a string with a unit matching `^-?\d+(\.\d+)?\s*(s\|min\|h\|d\|w\|mo\|y)\s*(/\s*s)?$` (for example `1 h/s`, `30 d/s`). Then `vol.Any`: a `date` or a `rate` is required ("set_clock needs a date or a rate") |
| `show_portal_card` | `content`: required dict; `layers`: dict; `position`: one of the nine positions (`top-left` ... `bottom-right`, `center`); `width`, `height`: strings; `duration`: int, at least 100; `dismiss`: bool |
| `clear_portal_card` | none |
| `borg_assimilate` | `intro_duration`: int 1000-60000; `transition_style`: `flash`, `fade_only`, `blur_fade`, `off`; `site_count`, `tendrils_per_site`: int 1-20; `tendril_length`: int 100-1200; `particle_count`: int 0-6; `renderer`: `auto`, `webgl`, `canvas`; `cube`: `detailed`, `classic`, `none`; `corruption`, `overrun`: float 0-1; `suppress_persistent`, `font_swap`: bool; `palette_hue`: int 0-359 (coerced); `sound`: string; `intro_layers`, `persistent_layers`: dicts |
| `borg_deassimilate` | `with_outro`: bool; `outro_layers`: dict; `revert_transition_style`: as `transition_style`; `sound`: string |

**`clear_effect` "All slots".** The action form's slot selector has an "All slots" choice whose value is `""` (`services.yaml`, `clear_effect.slot`), which is why the schema accepts the empty string. The handler turns `""` and a missing slot alike into "all": `slot = call.data.get("slot") or None`, and the payload carries `slot` only when it is set (`services.py:397-408`).

---

## Service Groups

| Group | Actions | Handler pattern |
|-------|---------|-----------------|
| **Alert mode** | `set_alert_mode`, `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`, `clear_alert` | Resolve targets. With targets: fire a `set_alert_mode` event (`{ mode }`) and leave the shared helper alone. Without: `_async_set_alert_mode(hass, mode)` (`services.py:233-252`), which checks that `input_select.lcards_alert_mode` exists and calls `input_select.select_option` with `blocking=True`. The shortcut actions are the same handler with a fixed mode (`clear_alert` = `green_alert`). |
| **Frontend control** | `reload`, `set_log_level` | Always events. `set_log_level` resolves its targets first, then sets the Python level on `custom_components.lcards` (process-wide, also for a targeted call) and fires `{ level }`; a target that matches nobody fails the call before the level changes. Neither changes the saved `log_level` option. |
| **Screen effects and sound** | `trigger_effect`, `clear_effect`, `play_sound` | Always events. `trigger_effect` sends `{ layers, duration? }` (`duration` only when truthy); `clear_effect` `{ slot? }`; `play_sound` `{ event_type?, asset_key? }`. |
| **Astrometrics** | `fly_to`, `set_clock` | Always events. The payload is `card_id` plus every other given field that is not `None` (`view`, `point`, `duration`, `warp`; `date`, `rate`). |
| **Portal overlay** | `show_portal_card`, `clear_portal_card` | Always events. `show_portal_card` always sends all seven keys, filling `position: "center"`, `width`/`height: "auto"` and `dismiss: true`, with `layers` and `duration` as `None` when not given. |
| **Borg** | `borg_assimilate`, `borg_deassimilate` | Always events, normalised first (below). Neither ever writes `input_select.lcards_alert_mode`, targeted or not: each browser switches its own palette to `borg_alert` through `ThemeManager.setAlertMode()` and returns to its previous alert mode on deassimilate. |

What the browser does with each payload, including the per-slot behaviour of `trigger_effect` (a slot left out is untouched, `null` clears it, `duration` gives each slot its own timer through `ScreenEffectManager.applySlotFor()`), is in [Integration Service: Handled actions](../subsystems/integration-service#handled-actions).

### Borg payload normalisation

`handle_borg_assimilate` (`services.py:431-516`) builds the payload the browser expects:

- The flat shortcuts `site_count`, `tendrils_per_site`, `tendril_length`, `particle_count` become camelCase canvas params (`siteCount`, ...); `renderer`, `corruption` and `overrun` are copied as they are; `cube: none` becomes `cube: false`, `cube: detailed | classic` becomes `cube: true` plus `cubeStyle`.
- Those go into `intro_layers.canvas`. When `intro_layers` is also given, its `canvas` keys win on overlap, after their snake_case keys are converted (`site_count`, `tendrils_per_site`, `tendril_length`, `particle_count`, `glow_color`, `cube_style`).
- `persistent_layers` is passed through; when it is absent, `suppress_persistent: true` sends `persistent_layers: {}`.
- `font_swap` is sent as `fontSwap`, `palette_hue` as `paletteHue` (the hue, 0-359 degrees, the palette shifts toward; the browser defaults to 110), `sound` only when non-empty.

`handle_borg_deassimilate` (`:518-536`) copies `with_outro`, `outro_layers`, `revert_transition_style` and a non-empty `sound`. How the browser maps these to `assimilate()` / `deassimilate()` options is in [Borg Assimilation: Action payload to options](../subsystems/borg-assimilation#action-payload-to-options).

---

## Targeting

`_async_resolve_targets(hass, call)` (`services.py:105-168`) returns `(device_ids, user_ids)`:

1. Start from `target_device_ids` and `target_user_ids` as given.
2. `target_device_names`: lower-case each name and add every device whose `display_name` (lower-cased) in the `_device_<id>` storage records matches (`storage.get_namespaced_entities("_device")`). Several devices with the same name are all added. Without storage (entry not set up) a warning is logged and names resolve to nothing.
3. `target_user_names`: lower-case and match against `user.name` of every user from `hass.auth.async_get_users()`.
4. If both lists are empty but any targeting field was given, raise `ServiceValidationError`. Otherwise return the lists (empty lists mean broadcast).

`_fire_targeted_event(hass, action, extra, device_ids, user_ids)` (`services.py:171-188`) fires `lcards_event` with `{ "action": action, **extra }` and adds `target_device_ids` / `target_user_ids` only when non-empty, so a broadcast payload carries no target keys. Browsers keep an event when either list names them (union).

---

## Errors

| Case | Raised by | Message | Result |
|---|---|---|---|
| A field fails its schema (unknown mode, `duration` under 100, `palette_hue` 400, unknown field, ...) | Home Assistant, from the registered schema | the schema error | call rejected, handler not run |
| `fly_to` with neither `view` nor `point` | schema `vol.Any` | "fly_to needs a view or a point" | rejected |
| `set_clock` with neither `date` nor `rate` | schema `vol.Any` | "set_clock needs a date or a rate" | rejected |
| `play_sound` with neither `event_type` nor `asset_key` | schema `vol.Any` | "play_sound needs an event_type or an asset_key" | rejected (before, it fired an event every browser ignored and the call reported success) |
| Targeting given but matches no device or user (a misspelt name, a device never registered, storage not loaded) | `_async_resolve_targets()` | "LCARdS: no device or user matches the target (names: [...])" (`ServiceValidationError`) | call fails; nothing is fired, never a broadcast (`set_log_level` leaves the Python level unchanged too) |
| Alert action without targeting, and `input_select.lcards_alert_mode` does not exist | `_async_set_alert_mode()` | "LCARdS: input_select.lcards_alert_mode does not exist. Create the LCARdS helpers (LCARdS config panel, Helpers tab, Create All) and try again." (`ServiceValidationError`) | call fails (before, the call did nothing and still reported success) |
| Alert mode the helper does not offer as an option | `input_select.select_option` (Home Assistant) | Home Assistant's own error | call fails (`blocking=True` passes it through) |
| Integration not set up | - | - | the `lcards.*` actions are not registered; automations calling them fail as unknown actions |

`ServiceValidationError` shows as a user-facing error in the action UI and in the automation trace. A targeted alert action does not need the helper, so it never hits the missing-helper error.

Things that are not errors on the backend: `fly_to` / `set_clock` for a `card_id` no open dashboard shows fly or set nothing (each browser logs how many cards it reached).

---

## Push Channel Architecture

Eleven actions (`reload`, `set_log_level`, `trigger_effect`, `clear_effect`, `play_sound`, `fly_to`, `set_clock`, `show_portal_card`, `clear_portal_card`, `borg_assimilate`, `borg_deassimilate`) always go to the browsers as an event; the seven alert actions do only when targeting is given.

```
handler (services.py)
  _async_resolve_targets()                    -> (device_ids, user_ids) or ServiceValidationError
  _fire_targeted_event()
    hass.bus.async_fire("lcards_event", { action, ...payload, target_*? })
      Home Assistant event bus
        _forward() in ws_subscribe (websocket_api.py, @callback), once per subscription
          connection.send_message(event_message(id, event.data))
            every browser subscribed with lcards/subscribe
              IntegrationService._handleLcardsEvent(data)
                _isEventTargetedAtMe(payload)? no: drop
                switch (payload.action) ...
```

Browsers subscribe with LCARdS's own `lcards/subscribe` command, open to non-admin users (Home Assistant's `subscribe_events` is admin-only for custom event types), so every dashboard receives the events. Delivery is always a broadcast; there is no per-connection delivery. More: [Python to JS Push Channel](../ha-integration#python-to-js-push-channel).

---

## Adding an Action

1. Add a `SERVICE_*` constant and put it in `_ALL_SERVICES` (`services.py`).
2. Write the handler inside `async_setup_services()`: resolve targets with `_async_resolve_targets()`, build the payload (leave out fields that were not given), fire with `_fire_targeted_event()`.
3. Register it with a `probatio` schema that includes `**_TARGET_FIELDS`; enforce "one of these fields is required" in the schema (`vol.All(..., vol.Any(...))` as `fly_to` does) rather than in the browser.
4. Describe it in `services.yaml` (name, description, a selector per field, the four targeting fields). Descriptions are user-facing: "Home Assistant" in full, no em dashes.
5. Handle the `action` in `IntegrationService._handleLcardsEvent()`.
6. Document it in `doc/configuration/ha-actions.md` (the `llms-txt` test fails otherwise) and in the tables on this page and [Home Assistant Integration Architecture](../ha-integration#home-assistant-services-actions).

---

## Related

- [Home Assistant Actions: User Guide](/configuration/ha-actions): what each action does, YAML and automation examples
- [Home Assistant Integration Architecture](../ha-integration): boot sequence, WebSocket commands, push channel
- [Integration Service](../subsystems/integration-service): the browser-side probe, subscription and handlers
- [Borg Assimilation](../subsystems/borg-assimilation): what the Borg actions drive
- [Helper Manager](../subsystems/helper-manager): how the browsers follow `input_select.lcards_alert_mode`
- [Theme System: Alert Mode Integration](../subsystems/theme-system#alert-mode-integration): how a browser applies an alert mode
