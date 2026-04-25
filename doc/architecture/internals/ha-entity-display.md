# HA Entity Display Utility (`src/utils/ha-entity-display.js`)

Single source of truth for all HA i18n/locale-aware formatting in LCARdS.

## Purpose

Delegates entirely to the `hass.format*` public API family (stable since HA 2024.4+, guaranteed on the LCARdS 2026.3.0 minimum). All cards, editors, charts, and datasource utilities **must** import from this module — never call `hass.format*` directly elsewhere.

## Why a Centralized Utility?

- **Single integration point:** If the HA API changes, only this file needs updating.
- **Safe fallbacks:** All exports include graceful fallbacks so a missing or erroring `hass` method never reaches the render pipeline as `undefined` or `null`.
- **No custom translation tables:** All translation is delegated to HA — LCARdS does not ship locale JSON or string maps.

## Exports

| Export | Description |
|--------|-------------|
| `haFormatState(hass, stateObj)` | HA-translated display state (e.g. `"on"` → `"Open"` for a door sensor) |
| `haFormatEntityName(hass, stateObj)` | HA-formatted friendly name |
| `haFormatAttrValue(hass, stateObj, key)` | HA-formatted attribute value (e.g. `battery_level 80` → `"80 %"`) |
| `haFormatAttrName(hass, stateObj, key)` | HA-formatted attribute name (e.g. `"battery_level"` → `"Battery Level"`) |
| `haFormatStateParts(hass, stateObj)` | State as ToParts array: `[{value:'23.5'},{value:'°C'}]` |
| `haFormatAttrParts(hass, stateObj, key)` | Attribute as ToParts array |
| `haFormatNumber(hass, value, opts)` | Locale-aware number formatting — respects `hass.locale.number_format` (comma_decimal, decimal_comma, space_comma, quote_decimal, none, system) and `language`. Mirrors HA's `numberFormatToLocale()`. |
| `haFormatDate(hass, ts, opts)` | Locale-aware date formatting — respects `hass.locale.language`, `time_format` (12/24h), and `date_format` (DMY/MDY/YMD) via `formatToParts()` reordering. Mirrors HA's `formatDateNumeric()`. |
| `joinParts(parts)` | Join a ToParts array to a single display string |
| `extractUnit(parts)` | Extract the unit portion from a ToParts array |

## LCARdSCard Convenience Methods

`LCARdSCard` exposes protected wrapper methods for cards to use directly without importing the utility:

```javascript
this._getStateDisplay(entity?)        // → haFormatState
this._getEntityName(entity?)          // → haFormatEntityName
this._getAttributeDisplay(key, entity?) // → haFormatAttrValue
this._getAttributeName(key, entity?)  // → haFormatAttrName
```

All default to `this._entity` when no entity is provided.

## Important Constraints

- **State classification must use raw values.** `haFormatState` returns a display string (e.g. `"Open"`) — never use it for `_classifyEntityState()` or icon resolution. Those must always use the raw `entity.state` value (`"on"`, `"off"`, etc.).
- **JS templates are unaffected.** `[[[...]]]` templates receive raw entity objects and can call `hass.formatEntityState(entity)` directly.
- **Jinja2 templates are server-evaluated** and unaffected.
