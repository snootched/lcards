# Sound System Architecture

> **UI audio coordination for LCARdS — `window.lcards.core.soundManager`**

The Sound System provides event-driven audio feedback for all LCARdS interactions and HA UI events. It is a single-instance `BaseService` that lives at `window.lcards.core.soundManager`.

---

## 🏗️ System Overview

### Architecture Components

```
SoundManager (BaseService singleton)
    │
    ├─ Tier 1 — Card interactions
    │   └─ LCARdSActionHandler.setupActions()
    │       calls soundManager.play(eventType, { cardOverride })
    │
    ├─ Tier 2 — Global HA UI listeners (document-level)
    │   ├─ click (capture)          → nav_sidebar, menu_expand
    │   ├─ location-changed         → nav_page
    │   ├─ hass-action              → card_tap / card_hold / card_double_tap
    │   ├─ show-dialog              → dialog_open
    │   ├─ hass-more-info           → more_info_open
    │   ├─ dialog-closed            → dialog_close
    │   └─ history.replaceState patch → dashboard_edit_start / dashboard_edit_save
    │
    ├─ Scheme Registry (Map<name, eventMap>)
    │   └─ Registered via PackManager.registerPack() → registerSchemes()
    │
    ├─ Audio Cache (Map<assetKey, HTMLAudioElement>)
    │   └─ URL resolved from AssetManager registry (no async preload needed)
    │
    └─ Override Store
        └─ localStorage key: 'lcards_sound_overrides'  (JSON eventType→assetKey map)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/core/sound/SoundManager.js` | Core singleton — all playback, listeners, scheme management |
| `src/core/packs/sounds/builtin-sounds.js` | `lcards_default` scheme + asset definitions |
| `src/core/helpers/lcards-helper-registry.js` | Helper definitions for 6 sound config helpers |

---

## 🔊 Event Types & Categories

Event types are grouped into three categories, each controlled by an independent `input_boolean` helper.

### `cards` — `input_boolean.lcards_sound_cards`

| Event | Trigger |
|-------|---------|
| `card_tap` | Any tap on a LCARdS card or standard HA card |
| `card_hold` | Hold action |
| `card_double_tap` | Double-tap action |
| `card_hover` | Hover (desktop pointer) |
| `button_tap` | LCARdS button element tap |
| `toggle_on` / `toggle_off` | Toggle state change |
| `slider_drag_start` / `slider_drag_end` | Slider grab / release |
| `slider_change` | Per-tick slider value change (silenced in default scheme) |
| `more_info_open` | More-info panel opened |

### `ui` — `input_boolean.lcards_sound_ui`

| Event | Trigger |
|-------|---------|
| `nav_sidebar` | Sidebar navigation item click |
| `menu_expand` | Hamburger / expand icon click |
| `nav_page` | `location-changed` event (view/page navigation) |
| `dialog_open` | Any HA dialog opens (except more-info) |
| `dialog_close` | Any HA dialog dismissed (save or cancel) |
| `dashboard_edit_start` | Dashboard edit mode entered |
| `dashboard_edit_save` | Dashboard edit mode exited |

### `alerts` — `input_boolean.lcards_sound_alerts`

| Event | Trigger |
|-------|---------|
| `alert_activate` | Alert mode set to red / yellow / blue |
| `alert_clear` | Alert mode set to green (cleared) |
| `alert_escalate` | Alert escalation (reserved) |
| `system_ready` | LCARdS initialization complete |
| `error` | System error condition |
| `notification` | General notification event |

---

## ⚙️ HA Helper Integration

Six input helpers store sound configuration. They are created via the Sound Config Panel or manually via YAML.

| Helper key | Entity ID | Type | Purpose |
|---|---|---|---|
| `sound_enabled` | `input_boolean.lcards_sound_enabled` | boolean | Master on/off (default **off** — opt-in) |
| `sound_cards_enabled` | `input_boolean.lcards_sound_cards` | boolean | Card interaction category |
| `sound_ui_enabled` | `input_boolean.lcards_sound_ui` | boolean | UI navigation category |
| `sound_alerts_enabled` | `input_boolean.lcards_sound_alerts` | boolean | Alerts category |
| `sound_volume` | `input_number.lcards_sound_volume` | number 0–1 | Master volume |
| `sound_scheme` | `input_select.lcards_sound_scheme` | select | Active scheme name |

**Category opt-out model**: If a category helper doesn't exist yet, `_isCategoryEnabled()` returns `true` (play sounds). The master `sound_enabled` helper defaults to `false` (opt-in — no sounds until explicitly turned on).

**Scheme options sync**: When packs register schemes via `registerSchemes()`, SoundManager calls `helperManager.updateSelectOptions('sound_scheme', schemeNames)` to keep the input_select options in sync with loaded packs. This is non-fatal if the helper doesn't exist yet.

---

## 🎵 Sound Resolution Order

`play(eventType, context)` resolves the asset key in strict priority order:

```
1. context.cardOverride
   │  null  → explicitly silenced (return immediately)
   │  string → use this asset key directly
   │
2. localStorage override (lcards_sound_overrides)
   │  { eventType: assetKey } — per-event user override
   │
3. Active scheme mapping
   │  scheme[eventType] === null  → scheme-silenced (return)
   │  scheme[eventType] === string → use this asset key
   │
4. No mapping found → silence (return)
```

---

## 🌐 Global Listener Architecture

`mountGlobalUIListener()` attaches all Tier 2 listeners. It is idempotent (safe to call multiple times; exits early if already mounted). Called by `LCARdSCore` after initialization.

### Browser Autoplay Guard

A one-shot capture-phase `click` listener sets `_userInteracted = true`. Until this fires, all `_playAsset()` calls are silently dropped (browser autoplay policy). `preview()` bypasses this guard via `force=true`.

### Click Handler (sidebar sounds)

Capture-phase `click` on `document`. Checks `composedPath()` for `HA-SIDEBAR` or `role="navigation"`, then discriminates between hamburger buttons (`HA-ICON-BUTTON`) → `menu_expand` and nav items (`PAPER-ICON-ITEM`, `role=option/menuitem`) → `nav_sidebar`.

### `hass-action` Handler

Catches tap/hold/double_tap on non-LCARdS HA cards (Mushroom, built-in HA cards, etc.) that fire the composed `hass-action` event. Guards against double-firing by skipping events whose `composedPath()` passes through any `LCARDS-*` element (LCARdS cards handle their own sounds via `LCARdSActionHandler`).

### `show-dialog` Handler

Fires on any HA dialog open except `ha-more-info-dialog` (which is handled separately as `more_info_open` to give it a distinct event type).

### `dialog-closed` Handler

Fires on any HA dialog dismiss (save, cancel, ESC, or close button). Skips dialogs whose `localName` starts with `lcards-` to avoid double-sounds from LCARdS-owned panels.

### Dashboard Edit Mode (`history.replaceState` patch)

HA uses `history.replaceState` (not a DOM event) to toggle `?edit=1` in the URL when entering/exiting dashboard edit mode. SoundManager patches `window.history.replaceState`, compares the `edit=1` param before/after, and fires `dashboard_edit_start` or `dashboard_edit_save` on change. The original function is saved as `_historyReplaceStateOrig` and restored in `destroy()`.

---

## 🎤 Audio Asset Resolution

Asset URLs are resolved synchronously from `AssetManager`'s internal registry:

```javascript
const registry = this._core?.assetManager?.getRegistry('audio');
const entry = registry?.assets?.get(assetKey);
const url = entry?.url;
```

`Audio` elements are created once per asset key and cached in `_audioCache`. On each play:
1. `audio.volume` is set from `_getVolume()`
2. `audio.currentTime = 0` (allows rapid re-trigger)
3. `audio.play()` — `.catch(() => {})` suppresses `AbortError` from fast replays

No async preloading is required — the browser fetches the URL on first play.

---

## 📦 Pack Integration

Sound packs declare `sound_schemes` and `audio_assets` in their pack definition:

```javascript
export const MY_SOUND_PACK = {
  id: 'my_sound_pack',
  version: '1.0.0',
  name: 'My Sound Pack',

  // Registered with AssetManager
  audio_assets: {
    my_tap: {
      url: '/hacsfiles/lcards/sounds/my_pack/tap.mp3',
      description: 'Tap beep',
    },
  },

  // Registered with SoundManager
  sound_schemes: {
    my_scheme: {
      card_tap:   'my_tap',
      nav_sidebar: 'my_tap',
      card_hover:  null,    // Silence this event in this scheme
      // Omitted events → silence
    },
  },
};
```

`PackManager.registerPack()` routes `audio_assets` to `AssetManager` and `sound_schemes` to `SoundManager.registerSchemes()`. The `sound_scheme` input_select options are updated automatically after registration.

---

## 🗃️ Override Storage

Per-event overrides are stored in `localStorage` under the key `lcards_sound_overrides` as a JSON object:

```json
{ "card_tap": "my_tap", "nav_sidebar": null }
```

`null` values are not stored — `setOverride(eventType, null)` deletes the key. `_getOverrides()` returns `{}` on parse failure (never throws).

---

## ➕ Adding a New Event Type

1. Add the key to `EVENT_CATEGORY` in `SoundManager.js` with the appropriate category (`'cards'`, `'ui'`, or `'alerts'`).
2. Add a human-readable label to `SOUND_EVENT_LABELS`.
3. Add a mapping to `LCARDS_DEFAULT_SCHEME` in `builtin-sounds.js` (use `null` to silence by default).
4. Fire it via `soundManager.play('my_new_event')` at the appropriate call site.

---

## 🔌 Public API

```javascript
const sm = window.lcards.core.soundManager;

// Playback
sm.play('card_tap');
sm.play('card_tap', { cardOverride: 'my_asset' }); // card-level override
sm.play('card_tap', { cardOverride: null });        // silence this event

sm.preview('my_asset');                            // bypass enable checks
sm.previewScheme('lcars_classic', 'card_tap');     // preview a scheme

// Overrides
const overrides = sm.getOverrides();               // { eventType: assetKey }
await sm.setOverride('card_tap', 'my_asset');      // set override
await sm.setOverride('card_tap', null);            // clear override
await sm.clearAllOverrides();                       // clear all

// Scheme introspection
const names = sm.getSchemeNames();                 // ['none', 'lcards_default', ...]
const events = sm.getEventTypes();                 // [{ key, label, category }, ...]

// Lifecycle
sm.mountGlobalUIListener();                        // called by LCARdSCore
sm.subscribeToAlertMode();                         // called by LCARdSCore
sm.destroy();                                      // cleanup
```
