# Helper Manager

> **`window.lcards.core.helperManager`**: Lifecycle management for the Home Assistant helper entities LCARdS uses.

---

## Overview

`LCARdSHelperManager` extends `BaseService` and manages the Home Assistant helpers (`input_select`, `input_boolean`, `input_number` and `input_text`, plus one template `sensor` that has to be set up by hand) behind alert mode, alert colour tuning, sound settings and the HA-LCARS theme values. It detects missing helpers, creates them through Home Assistant's helper WebSocket commands, gives typed read/write access by short key, notifies subscribers when a helper changes, and applies changes of `input_select.lcards_alert_mode` to the theme (the [alert-mode auto-switch](#alert-mode-auto-switch)).

Helpers hold state shared by every browser (one Home Assistant entity per setting). Per-user and per-device settings live in [Scoped Settings](scoped-settings.md) instead, with the helper value as their `globalFallback`.

---

## Key Files

| File | Role |
|---|---|
| `src/core/helpers/lcards-helper-manager.js` | Service: state listener, value cache, subscriptions, auto-switch, public API |
| `src/core/helpers/lcards-helper-registry.js` | `HELPER_REGISTRY`: every helper with its key, entity ID, domain, category, default and creation parameters; `getAllHelpers()`, `getHelpersByCategory()`, `getHelperDefinition()`, `findHelperByEntityId()`, `getCategories()`, `generateHelpersYAML()` |
| `src/core/helpers/lcards-helper-api.js` | Home Assistant calls: `createHelper()` (`<domain>/create`), `ensureHelper()`, `updateHelperConfig()`, `updateHelperEntityId()`, `deleteHelper()`, `setHelperValue()` (service calls), `getHelperValue()`, `helperExists()`, `verifyHelperAPIAvailable()` |

---

## Helper Registry

`HELPER_REGISTRY` defines 49 helpers in three categories. The API takes the **key**, not the entity ID.

| Category | Count | Contents |
|---|---|---|
| `alert_system` | 36 | `alert_mode`, `alert_mode_auto_switch`, `alert_message`, `alert_transition_style`, and 32 `alert_lab_*` colour-tuning numbers per alert colour |
| `ha_lcars_theme` | 7 | HA-LCARS theme values (`lcars_sound`, `lcars_texture`, `lcars_elbow_angle`, `lcars_vertical`, `lcars_horizontal`, `lcars_menu_font`) and `lcars_header`, a template `sensor` with `ws_create_params: null` (not creatable; skipped by `ensureHelper()`) |
| `sound` | 6 | `sound_enabled`, `sound_cards_enabled`, `sound_ui_enabled`, `sound_alerts_enabled`, `sound_volume`, `sound_scheme` |

The commonly used ones:

| Key | Entity | Default | Purpose |
|---|---|---|---|
| `alert_mode` | `input_select.lcards_alert_mode` | `green_alert` | Current alert state; every option carries the `_alert` suffix (`green_alert`, `red_alert`, `yellow_alert`, `blue_alert`, `gray_alert`, `black_alert`) |
| `alert_mode_auto_switch` | `input_boolean.lcards_alert_mode_auto_switch` | off | Apply the stored alert mode when a page loads |
| `alert_message` | `input_text.lcards_alert_message` | `""` | Message text for the alert overlay |
| `alert_transition_style` | `input_select.lcards_alert_transition_style` | `off` | Transition used when the alert mode changes |
| `sound_enabled` | `input_boolean.lcards_sound_enabled` | off | Global sound on/off |
| `sound_volume` | `input_number.lcards_sound_volume` | 0.5 | Master volume, 0-1 in steps of 0.05 |
| `sound_scheme` | `input_select.lcards_sound_scheme` | `none` | Active sound scheme; its options are kept in sync with the loaded schemes (`updateSelectOptions()`) |

Run `window.lcards.core.helperManager.getAllHelpers()` for the full list, or see [Persistent Helpers](../../configuration/persistent-helpers.md). Helpers can be created from the [Config Panel](../../configuration/index.md) (Helpers tab), which calls `ensureAllHelpers()`.

---

## State Tracking

On the first `updateHass()` with a HASS (`_autoSwitchInitialized` guards it), the manager:

1. **Subscribes once** to `state_changed` (`_setupStateListeners()`): one subscription for all helpers, looked up through `_helperKeyByEntity`. One subscription per helper multiplied the event traffic per tab enough to overflow Home Assistant's pending-message queue at startup.
2. **Sets up the alert-mode auto-switch** (`_setupAlertModeAutoSwitch()`).

Each change event updates `_valueCache` with the new state string and calls the key's subscribers with `(newValue, oldValue)`. Later `updateHass()` calls refresh the cache from `hass.states` (`_updateValueCache()`).

Besides the core's distribution, `LCARdSNativeCard`'s `hass` setter forwards every real HASS to `helperManager.ingestHass()` (which calls `updateHass()`), so the manager is fed on any page with an LCARdS card.

Values are entity **state strings** as Home Assistant reports them: `'on'` / `'off'` for booleans, `'0.5'` for numbers.

---

## Alert-Mode Auto-Switch

This is the link between the `alert_mode` helper and the [Theme System](theme-system.md):

- **On change**: a subscriber on `alert_mode` calls `window.lcards.setAlertMode(newMode)` for every change of the helper, whatever `alert_mode_auto_switch` says. It skips the call when `themeManager.getAlertMode()` already equals the new mode (the change came from `setAlertMode()` itself syncing the helper), and pushes the current HASS to the core first.
- **Auto-switch turned on**: when `alert_mode_auto_switch` goes from off to on, the current `alert_mode` is applied.
- **On page load**: if `alert_mode_auto_switch` is on and `alert_mode` holds one of the six LCARdS modes, it is applied with `{ skipTransition: true }`. Home Assistant can report a transient state while it restores the helper, so the check is retried after 100 ms, 750 ms and 2500 ms and then on every later `updateHass()` until it succeeds or becomes moot (auto-switch off, or a real change event arrived).

Targeted alerts from the `lcards.set_alert_mode` action do not go through the helper: `IntegrationService` calls `setAlertMode(mode, { skipHelperSync: true })` on the targeted browsers only.

---

## Value API

```javascript
const hm = window.lcards.core.helperManager;

// Read: the cache, else hass.states, else the registry default (synchronous)
const mode = hm.getHelperValue('alert_mode');   // 'green_alert'

// Write: a service call (select_option, set_value, turn_on / turn_off)
await hm.setHelperValue('alert_mode', 'red_alert');

// Subscribe to changes
const unsub = hm.subscribeToHelper('alert_mode', (newValue, oldValue) => {
  console.log('Alert mode changed to', newValue);
});
unsub();   // removes just this callback
```

| Method | Returns | Description |
|---|---|---|
| `getHelperValue(key)` | any | Cached value; otherwise read live from `hass.states` (not cached), else the registry `default_value`; `null` for an unknown key |
| `setHelperValue(key, value)` | `Promise<void>` | Calls the domain's service; `input_number` values are clamped to the entity's own `min` / `max`; the cache is updated at once (booleans as `'on'` / `'off'`). Throws for an unknown key or without HASS |
| `helperExists(key)` | `boolean` | The entity is in `hass.states` |
| `subscribeToHelper(key, cb)` | `() => void` | Add a `(newValue, oldValue)` callback; returns its unsubscribe function |
| `unsubscribeFromHelper(key)` | `void` | Remove **every** callback for the key, including the manager's own auto-switch subscriber on `alert_mode`; prefer the returned function |
| `resolveHelperBindings(config, bindings)` | `Object` | Copy of `config` with `{ configKey: helperKey }` bindings replaced by helper values |

---

## Creating Helpers

| Method | Returns | Description |
|---|---|---|
| `getMissingHelpers()` | `Object[]` | Synchronous: the registry definitions whose entity is not in `hass.states` (all of them without HASS) |
| `ensureHelper(key)` | `Promise<{ exists, created, entity_id, skipped? }>` | Create one helper if missing (`<domain>/create`, then rename the entity ID if Home Assistant chose another), then write its `default_value` after 300 ms. Helpers with `ws_create_params: null` return `skipped: true` |
| `ensureAllHelpers()` | `Promise<{ total, existing, created, failed, errors }>` | `ensureHelper()` for every registry entry; failures are collected, not thrown |
| `resetCategoryToDefaults(category?)` | `Promise<{ success, failed, skipped }>` | Write the default to every existing helper of a category (or all), skipping helpers without a default and those marked `excludeFromBulkReset` |
| `updateSelectOptions(key, options, preferredValue?)` | `Promise<{ optionsUpdated, restored }>` | Replace an `input_select`'s options persistently (`input_select/update`), falling back to the `input_select.set_options` service (not persistent) when that fails, for example for non-admins; then restore the selected value |
| `generateYAML(category?)` | `string` | YAML for the helpers, for manual setup |
| `getHelpersByCategory(category)` / `getAllHelpers()` | `Object[]` | Registry definitions |

Creating and updating helpers uses Home Assistant's admin-only helper commands, so it works for admins only.

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('helperManager')
// → { type: 'HelperManager', subscriptionsCount: 2, stateListeners: 1, watchedHelpers: 49,
//      cachedValues: 48, autoSwitchInitialized: true }
```
```javascript [Live object]
const hm = window.lcards.core.helperManager

hm.getHelperValue('alert_mode')                     // current value of a helper
await hm.setHelperValue('alert_mode', 'red_alert')  // update a helper
hm.subscribeToHelper('alert_mode', cb)              // listen for changes
hm.getMissingHelpers()                              // definitions not yet created
await hm.ensureAllHelpers()                         // create the missing ones
```
:::

`stateListeners` is 1 once the shared `state_changed` subscription exists (0 before); `watchedHelpers` is the number of helper entity IDs it watches.

---

## See Also

- [Persistent Helpers](../../configuration/persistent-helpers.md)
- [Helpers API (development)](../../development/helpers-api.md)
- [Alert Mode](../../core/alert-mode.md)
- [Config Panel](../../configuration/index.md)
- [Theme System](theme-system.md)
