# Sound System Architecture

> **UI audio coordination for LCARdS — `window.lcards.core.soundManager`**

The Sound System provides event-driven audio feedback for all LCARdS interactions and HA UI events. It is a single-instance `BaseService` that lives at `window.lcards.core.soundManager`.

---

## System Overview

### Architecture Components

```
SoundManager (BaseService singleton)
    │
    ├─ Tier 1 — Card interactions
    │   └─ LCARdSActionHandler.setupActions()
    │       calls soundManager.play(eventType, { cardOverride })
    │
    ├─ Tier 2 — Global HA UI listeners (document-level)
    │   ├─ hass-toggle-menu         → menu_expand
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
        └─ Integration persistent storage key: 'sound_overrides'  (JSON eventType→assetKey map)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/core/sound/SoundManager.js` | Core singleton — all playback, listeners, scheme management |
| `src/core/packs/sounds/builtin-sounds.js` | `lcards_default` scheme + asset definitions |
| `src/core/helpers/lcards-helper-registry.js` | Helper definitions for 6 sound config helpers |
| `src/editor/components/sound/lcards-sound-source-selector.js` | Shared per-event source picker (scheme default / mute / bundled asset / HA media) used by all override tables |
| `src/editor/components/sound/lcards-card-sound-tab.js` | Per-card sound override tab |
| `src/panels/components/lcards-sound-config-tab.js` | Global Config Panel Sound tab — schemes, overrides, custom scheme save |

---

## Event Types & Categories

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
| `menu_expand` | Hamburger / sidebar toggle (`hass-toggle-menu`) |
| `nav_page` | `location-changed` event (view/page navigation) |
| `dialog_open` | Any HA dialog opens (except more-info) |
| `dialog_close` | Any HA dialog dismissed (save or cancel) |
| `dashboard_edit_start` | Dashboard edit mode entered |
| `dashboard_edit_save` | Dashboard edit mode exited |

### `alerts` — `input_boolean.lcards_sound_alerts`

| Event | Trigger |
|-------|---------|
| `alert_red` | Alert mode set to `red_alert` |
| `alert_yellow` | Alert mode set to `yellow_alert` |
| `alert_blue` | Alert mode set to `blue_alert` |
| `alert_gray` | Alert mode set to `gray_alert` |
| `alert_black` | Alert mode set to `black_alert` |
| `alert_clear` | Alert mode cleared (back to normal) |
| `system_ready` | LCARdS initialization complete |
| `error` | System error condition |
| `notification` | General notification event |

---

## HA Helper Integration

Six input helpers store the **global** sound configuration. They are created via the Sound Config Panel or manually via YAML.

| Helper key | Entity ID | Type | Purpose |
|---|---|---|---|
| `sound_enabled` | `input_boolean.lcards_sound_enabled` | boolean | Master on/off |
| `sound_cards_enabled` | `input_boolean.lcards_sound_cards` | boolean | Card interaction category |
| `sound_ui_enabled` | `input_boolean.lcards_sound_ui` | boolean | UI navigation category |
| `sound_alerts_enabled` | `input_boolean.lcards_sound_alerts` | boolean | Alerts category |
| `sound_volume` | `input_number.lcards_sound_volume` | number 0–1 | Master volume |
| `sound_scheme` | `input_select.lcards_sound_scheme` | select | Active scheme name |

**Enable model**: the master toggle (`sound_enabled`) is **opt-in** — if the helper doesn't exist, `_isEnabled()` returns `false` and everything is silent until the user creates the helper and sets it `on`. Category toggles are **opt-out from master** — a missing category helper defaults to on (as long as master is on); only an explicit `'off'` disables that category. So a fresh install is silent by default, and users get full category control once they opt in.

**`'none'` is a genuine empty scheme**, not a "not configured yet" sentinel. `_getActiveSchemeName()` resolves it from the cached scoped value → live HA helper → the helper's `default_value` (`'none'`). `_getActiveScheme()` looks it up in `_soundSchemes` as-is, and since `'none'` is never a real key there it always resolves to `{}` — every event silent, per the "omitted events → silence" rule below. Per-event overrides still apply on top of `'none'`, so it doubles as "silent except for events I explicitly configure" — unlike the master `sound_enabled` toggle, which silences everything unconditionally, overrides included.

**Scheme options sync**: the first sync each session is deferred until both pack-provided schemes (registered synchronously during core init) and persisted custom schemes (loaded asynchronously, see [Custom Sound Schemes](#custom-sound-schemes)) have had a chance to register (`_doLoadCustomSchemes()`) — `input_select.set_options` resets the entity's *value* to its first option on every call, and the entity is shared across every open tab, so syncing against an incomplete list would visibly reset users' selections. Later `registerSchemes()` calls (e.g. saving a scheme live) sync immediately. Non-fatal if the helper doesn't exist yet.

---

## Per-User / Per-Device Overrides

> **Requires**: LCARdS integration v1.12+ (`scoped_storage` capability)

All four per-event settings support **user and device scopes** via the `ScopedSettingsService` waterfall:

| Setting | Scopes | Global fallback |
|---------|--------|----------------|
| `sound_enabled` | device, user, global | `input_boolean.lcards_sound_enabled` |
| `sound_volume` | device, user, global | `input_number.lcards_sound_volume` |
| `sound_scheme` | device, user, global | `input_select.lcards_sound_scheme` |
| `sound_overrides` | device, user, global | backend flat key |

Note: Per-category toggles (`sound_cards_enabled`, etc.) are global-only — they cannot be scoped per user or device.

### How it works

`SoundManager._ensureOverridesLoaded()` runs once after the integration probe resolves, loading all scoped settings asynchronously into five in-memory caches:

| Cache | What it holds |
|-------|---------------|
| `_cachedEnabled` / `_cachedVolume` / `_cachedScheme` | Scoped `sound_enabled` / `sound_volume` / `sound_scheme` (device → user → global waterfall) |
| `_globalOverridesCache` / `_overridesCache` / `_deviceOverridesCache` | Per-event overrides (`sound_overrides`) at the global / user / device tier |

The synchronous read methods (`_isEnabled()`, `_getVolume()`, `_getActiveScheme()`) return cached values when available, falling back to the live HA helper before the first load completes. `_getOverrides()` (used inside `play()`) merges `{ ...global, ...user, ...device }`, so device wins per event. `refreshScopedCache()` (public) clears all five caches and re-reads from the backend — the Config Panel calls this after every write so `play()` picks up changes without a page reload.

### Config Panel

Users configure scoped overrides in **LCARdS Config Panel → Sounds → Per-User / Per-Device Overrides**. Admins manage all users and devices from **LCARdS Config Panel → Users & Devices**. See [Scoped Settings Service](scoped-settings.md) and [Device Identity Manager](device-identity.md) for the underlying storage model.

---

## Sound Resolution Order

`play(eventType, context)` resolves the asset key in strict priority order:

```
1. context.cardOverride
   │  null  → explicitly silenced (return immediately)
   │  string → use this asset key directly
   │
2. Merged per-event override (device-scope wins, then user, then global)
   │  _getOverrides() = { ...globalOverridesCache, ...userOverridesCache, ...deviceOverridesCache }
   │  the global tier is OMITTED entirely when the active scheme is custom —
   │  see "Overrides vs. the Active Scheme selector" under Custom Sound
   │  Schemes below. User/device tiers always apply regardless.
   │  eventType in overrides:
   │    null   → explicitly muted (return immediately)
   │    string → use this asset key
   │
3. Active scheme mapping (scheme resolved from device/user/global waterfall)
   │  scheme[eventType] === null  → scheme-silenced (return)
   │  scheme[eventType] === string → use this asset key
   │
4. No mapping found → silence (return)
```

---

## Global Listener Architecture

`mountGlobalUIListener()` attaches all Tier 2 listeners. It's idempotent (exits early if already mounted) and is called by `LCARdSCore` after initialization.

- **Browser autoplay policy** — SoundManager relies on the browser's native autoplay policy rather than implementing its own interaction guard. Tap/hold/navigation sounds work immediately after any first touch or click; the `system_ready` startup sound additionally requires the dashboard URL to be on the browser's "allowed to autoplay" list (see [Sound Effects → Browser Audio Policy](../../configuration/sounds#browser-audio-policy)).
- **Sidebar menu toggle** — listens for `hass-toggle-menu` on `window` (dispatched by HA's `ha-menu-button`). Some HA versions dispatch it twice per click, so the handler dedupes within a 200 ms window and only the first firing plays `menu_expand`.
- **`hass-action`** — catches tap/hold/double_tap on non-LCARdS HA cards (Mushroom, built-in HA cards, etc.). Skips events whose `composedPath()` passes through any `LCARDS-*` element, since LCARdS cards handle their own sounds via `LCARdSActionHandler`.
- **`show-dialog`** — fires on any HA dialog open except `ha-more-info-dialog`, which gets its own `more_info_open` event type.
- **`dialog-closed`** — fires on any HA dialog dismiss (save, cancel, ESC, close button); skips `lcards-*` dialogs to avoid double-sounds from LCARdS-owned panels.
- **Dashboard edit mode** — HA toggles `?edit=1` in the URL via `history.replaceState` (not a DOM event), so SoundManager patches `window.history.replaceState`, compares the `edit=1` param before/after, and fires `dashboard_edit_start`/`dashboard_edit_save` on change. The original function is restored in `destroy()`.

---

## Audio Asset Resolution

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

### HA Media Library Sounds

Any `assetKey` value may instead be a `media-source://…` content ID picked via the HA media library — the per-card and Config Panel sound-override pickers offer a **Browse HA Media** mode alongside bundled assets (see [Asset Manager — Media Source Resolution Flow](asset-manager#media-source-resolution-flow)). `_playAsset()` detects the `media-source://` prefix and routes to `_playMediaSourceAsset()` instead of the synchronous registry lookup. Unlike bundled assets, the cached `Audio` element is rebuilt whenever the resolved URL differs from what's cached, since `AssetManager.resolveMediaSourceUrl()` may return a different signed URL after its own 15-minute cache window expires.

---

## Pack Integration

Sound packs declare `sound_schemes` and `audio_assets` in their pack definition:

```javascript
export const MY_SOUND_PACK = {
  id: 'my_sound_pack',
  version: '1.0.0',
  name: 'My Sound Pack',

  // Registered with AssetManager
  audio_assets: {
    my_tap: {
      url: '/hacsfiles/my-sound-pack/tap.mp3',
      description: 'Tap beep',
    },
  },

  // Registered with SoundManager
  sound_schemes: {
    my_scheme: {
      card_tap:    'my_tap',
      menu_expand: 'my_tap',
      card_hover:  null,    // Silence this event in this scheme
      // Omitted events → silence
    },
  },
};
```

`PackManager.registerPack()` routes `audio_assets` to `AssetManager` and `sound_schemes` to `SoundManager.registerSchemes()`. The `sound_scheme` input_select options are updated automatically after registration.

---

## Custom Sound Schemes

Beyond pack-provided schemes, users can save, edit, and delete named schemes from the Config Panel. This is **global scope only** — user/device scopes don't manage schemes themselves, they select a scheme (built-in or custom) from the global list and layer their own per-event overrides on top via the device/user tiers (see [Overrides vs. the Active Scheme selector](#overrides-vs-the-active-scheme-selector) below).

```javascript
// Create — snapshots whatever's currently shown in the Per-Event Overrides table
const created = await sm.saveCustomScheme('Bridge Ops', overridesMap);
// → { ok: true, name: 'custom:bridge-ops' }  (slugified, 'custom:'-prefixed)
// → { ok: false, error: '...' }               (empty name, name collision, or backend unavailable)

// Update — overwrite an existing custom scheme's event map directly
const updated = await sm.updateCustomScheme('custom:bridge-ops', overridesMap);
// → { ok: true } | { ok: false, error: '...' }  (not a custom scheme / not found / backend unavailable)

// Delete
const deleted = await sm.deleteCustomScheme('custom:bridge-ops');
// → { ok: true } | { ok: false, error: '...' }

// Read a scheme's raw event map (e.g. to display/edit it directly)
const mapping = sm.getSchemeMapping('custom:bridge-ops');  // { card_tap: 'my_asset', ... }
```

- **Naming**: the display name is slugified (lowercased, non-alphanumerics collapsed to `-`) and prefixed `custom:` (e.g. `"Bridge Ops"` → `custom:bridge-ops`). `isCustomScheme(name)` checks for this prefix — the Config Panel uses it to badge custom schemes (`🛠️ bridge-ops (custom)`) and to gate which schemes can be edited/deleted (pack-provided schemes cannot be).
- **Persistence**: create/update/delete read-modify-write the flat, global (non-scoped) backend key `custom_sound_schemes` (`STORAGE_KEY_CUSTOM_SOUND_SCHEMES`) — a `{ [fullSchemeName]: eventMap }` object — via `IntegrationService.readStorage()`/`writeStorage()` directly, not the per-user/device `ScopedSettingsService` waterfall, since a saved scheme is a shared named preset rather than a personal setting.
- **Availability**: a successful write immediately re-registers the scheme in `_soundSchemes`, so the Sound Scheme dropdown reflects the change without a reload.
- **Startup load**: `_ensureCustomSchemesLoaded()` reads `custom_sound_schemes` once the integration probe resolves and registers every entry found — a one-shot pattern mirroring `_ensureOverridesLoaded()`.
- **Deleting the active scheme**: the Config Panel resets the `sound_scheme` helper to `'none'` immediately after a successful delete, since the deleted name is no longer selectable.

Custom schemes fully support `media-source://…` event mappings (see [HA Media Library Sounds](#ha-media-library-sounds) above) — saving/updating a scheme snapshots whatever asset keys or media-source IDs are currently set as overrides.

### Overrides vs. the Active Scheme selector

The Per-Event Overrides table is **scheme-sourced** — what it shows, and where edits are saved, depends on the active scheme:

| Active Scheme | Table displays/edits | Edits persist via |
|---|---|---|
| Built-in (pack-provided), incl. `none` | The global override layer (`sound_overrides`, global tier) | `sm.saveGlobalOverrides(overridesMap)` (single whole-map write) |
| Custom (`custom:…`) | That scheme's own event map (`sm.getSchemeMapping(name)`) | `sm.updateCustomScheme(name, overridesMap)` |

Both contexts are **staged, not auto-saved**: editing a row only updates local `_overrides` in the Config Panel component; nothing hits the backend until the explicit **Save** button (`_saveOverrideChanges()`, which branches to whichever call above applies). Switching the Active Scheme selector — including externally, via its `sound_scheme` helper subscription — re-derives `_overrides` from the correct source and discards any unsaved edits, the same as clicking **Discard**.

**"Reset to scheme defaults"** exists only for built-in schemes: it clears the global override layer (`_resetOverrides()`, an immediate write gated by its own confirmation banner), falling back to whatever the active built-in scheme itself defines. A custom scheme has no such fallback — it's only editable (Save/Discard) or duplicatable via **Save as new scheme**, which promotes the currently staged `_overrides` into a new scheme without requiring an explicit Save first.

`SoundManager._getOverrides()` skips the global override tier during `play()` resolution whenever the active scheme is custom (`isCustomScheme(this._getActiveSchemeName())`), so a previous built-in scheme's global overrides never leak into a custom scheme. User/device tiers are never skipped — they keep applying on top of whichever scheme is active. Global overrides themselves are never cleared or migrated by scheme switching or by **Save as new scheme**; they simply stop being displayed while a custom scheme is active and reappear when switching back to a built-in scheme.

### Scheme-options sync coordination

Registering (`saveCustomScheme()`) or removing (`deleteCustomScheme()`) a scheme updates the shared HA `input_select.lcards_sound_scheme` entity's options list — a network round trip (`input_select.set_options`, which resets the entity's *value* to its first option, followed by a restore call). Any flow that explicitly switches the active scheme right after one of these calls must `await sm.waitForSchemeSync()` first, so the restore step can't land after — and silently revert — the explicit switch. Both `_confirmSaveScheme()` and `_deleteScheme()` in the Config Panel do this.

---

## Override Storage

Per-event overrides are stored as a flat `{ eventType: assetKey }` JSON object under the key `sound_overrides` in scoped storage. Two independent tiers exist:

| Tier | Storage path | Who sees it |
|------|-------------|-------------|
| `global` | integration-level flat key | all users, all devices |
| `user` | per-user scoped storage | that user only, all their devices |
| `device` | per-device scoped storage | that device only, regardless of user |

User-scope overrides win on a per-event basis (individual events can be user-overridden while others fall through to global).

`null` asset key values silence the event — they **are** stored (as `null`) in the override map. To remove an override entirely (revert to scheme), call `setOverride(eventType, undefined, scope)` or use the clear operation. `_getOverrides()` returns `{}` on any read failure (never throws).

---

## Adding a New Event Type

1. Add the key to `EVENT_CATEGORY` in `SoundManager.js` with the appropriate category (`'cards'`, `'ui'`, or `'alerts'`).
2. Add a human-readable label to `SOUND_EVENT_LABELS`.
3. Add a mapping to `LCARDS_DEFAULT_SCHEME` in `builtin-sounds.js` (use `null` to silence by default).
4. Fire it via `soundManager.play('my_new_event')` at the appropriate call site.

---

## Startup Sound Sequencing

`system_ready` and `error` are fired by `LCARdSCore._performInitialization()` at the end of core init. Because overrides and scoped settings load asynchronously (they depend on the integration probe completing after HASS is distributed), `play()` must not run until that finishes — otherwise per-event overrides and scoped scheme selections aren't in memory yet. The fix is a non-blocking fire-and-forget:

```javascript
// In LCARdSCore._performInitialization():
this.soundManager.ensureReady().then(() => {
    if (!window._lcardsSystemReadyPlayed) {
        window._lcardsSystemReadyPlayed = true;
        this.soundManager.play('system_ready');
    }
});
```

`ensureReady()` returns the (possibly already in-flight) promise from `_ensureOverridesLoaded()`, so there's no duplicate load; the `.then()` chain doesn't block core init. `window._lcardsSystemReadyPlayed` is a page-load flag — reset on any true page load, but preserved across SPA navigation and module re-init — so the sound plays exactly once per load, including when LCARdS re-inits mid-session (e.g. navigating to the Config Panel).

---

## Public API

```javascript
const sm = window.lcards.core.soundManager;

// Playback
sm.play('card_tap');
sm.play('card_tap', { cardOverride: 'my_asset' }); // card-level override
sm.play('card_tap', { cardOverride: null });        // silence this event

sm.preview('my_asset');                            // bypass enable checks
sm.previewScheme('lcars_classic', 'card_tap');     // preview a scheme

sm.playAsset('my_asset');                          // respects master sound_enabled,
                                                    // skips per-category gate — used by
                                                    // the lcards.play_sound HA action

// Global overrides (shared across all users and devices)
const overrides = sm.getOverrides('global');       // { eventType: assetKey }
await sm.setOverride('card_tap', 'my_asset', 'global');  // set a single global override immediately
await sm.setOverride('card_tap', null, 'global');        // silence globally
await sm.clearAllOverrides('global');                    // clear all global overrides
await sm.saveGlobalOverrides({ card_tap: 'my_asset', card_hover: null });  // replace the whole
                                                          // map in one write — used by the Config
                                                          // Panel's explicit Save button for a
                                                          // batch of staged edits

// Wait for any in-flight/queued scheme-options sync to settle before an
// explicit scheme switch (see "Scheme-options sync coordination" above)
await sm.waitForSchemeSync();

// Device-scoped overrides
const deviceOverrides = sm.getOverrides('device');   // { eventType: assetKey }
await sm.setOverride('card_tap', 'my_asset', 'device');  // set device override
await sm.clearAllOverrides('device');                    // clear all device overrides

// Cache invalidation — call after any external storage write
await sm.refreshScopedCache();                     // re-reads all 5 caches from backend

// Startup sequencing — await before playing sounds that must respect overrides
await sm.ensureReady();                            // resolves when overrides/scoped settings are loaded

// Scheme introspection
const names = sm.getSchemeNames();                 // ['none', 'lcards_default', ..., 'custom:bridge-ops']
const events = sm.getEventTypes();                 // [{ key, label, category }, ...]
sm.isCustomScheme('custom:bridge-ops');            // true — user-created vs. pack-provided

// Custom schemes (global scope only — event -> assetKey | media-source id | null)
const result = await sm.saveCustomScheme('Bridge Ops', sm.getOverrides('global'));   // create
// → { ok: true, name: 'custom:bridge-ops' } or { ok: false, error: '...' }
sm.getSchemeMapping('custom:bridge-ops');                                            // read raw event map
await sm.updateCustomScheme('custom:bridge-ops', updatedMap);                        // overwrite
await sm.deleteCustomScheme('custom:bridge-ops');                                    // remove

// Lifecycle
sm.mountGlobalUIListener();                        // called by LCARdSCore
sm.subscribeToAlertMode();                         // called by LCARdSCore
sm.destroy();                                      // cleanup

// Diagnostics — dumps enable/category state, helper cache contents, computed results
sm.diagnose()
```

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('soundManager')
// → {
//   type: 'SoundManager',
//   schemesCount: 3,
//   schemeNames: ['none', 'lcards_default', 'custom:bridge-ops'],
//   audioCacheSize: 12,
//   schemesOptionsSynced: true,
//   syncInProgress: false,
//   syncScheduled: false
// }
```
```javascript [Live object]
const sm = window.lcards.core.soundManager

sm.play('card_tap')                                      // fire an event
sm.preview('my_asset')                                   // play a specific asset directly
sm.previewEvent('system_ready')                          // preview event (bypasses enable checks)
sm.getSchemeNames()                                      // ['none', 'lcards_default', ...]
sm.getEventTypes()                                       // [{ key, label, category }, ...]
sm.getOverrides('global')                                // global per-event overrides
sm.getOverrides('user')                                  // user-scoped per-event overrides
await sm.setOverride('card_tap', 'my', 'global')         // set global persistent override
await sm.setOverride('card_tap', 'my', 'user')           // set user-scoped override
await sm.clearAllOverrides('global')                     // wipe all global overrides
await sm.refreshScopedCache()                            // force cache reload after admin writes
await sm.ensureReady()                                   // wait for overrides to be fully loaded
```
:::
