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

**Enable model**: The master toggle (`sound_enabled`) uses **opt-in** — if the helper entity doesn't exist, `_isEnabled()` returns `false` and all sounds are silent. The user must explicitly create the helper and set it to `on`. Category toggles use **opt-out from master** — if a category helper doesn't exist, that category is on as long as the master is. Only an explicit `'off'` state on a category helper disables it. This split means sounds are silent by default on a fresh install, and users get full category control once they've deliberately enabled the system.

**`'none'` is a genuine empty scheme**, not a "not configured yet, fall back to something" sentinel — `_getActiveSchemeName()` resolves it from the cached scoped value, then the live HA helper, then the helper's own `default_value` ('none' — a missing entity resolves here too). `_getActiveScheme()` looks it up in `_soundSchemes` as-is; since `'none'` is never a real key there, it always resolves to `{}` (every event silent by default, per the "omitted events → silence" rule below). This is distinct from the master `sound_enabled` toggle: per-event overrides (global/user/device) still apply on top of `'none'`, so it's usable as "silent by default, except for the events I explicitly configure" — muting via `sound_enabled` instead silences everything unconditionally, including any overrides.

**Scheme options sync**: the *first* sync each session is deliberately deferred until both pack-provided schemes (registered synchronously during core init) and persisted custom schemes (loaded asynchronously from backend storage, see [Custom Sound Schemes](#custom-sound-schemes)) have had their chance to register — see `_doLoadCustomSchemes()`. Every `registerSchemes()` call before that point just adds to `_soundSchemes` without syncing; syncing with an incomplete list would be actively harmful, since `input_select.set_options` unconditionally resets the entity's *value* to its first option on every call, and the entity is shared across every open browser tab. After the first sync, later `registerSchemes()` calls (e.g. saving a new custom scheme live) sync immediately as before — there's no second startup wave left to race. This is non-fatal if the helper doesn't exist yet.

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

`SoundManager._ensureOverridesLoaded()` is called once after the integration probe resolves. It loads all scoped settings asynchronously and populates five in-memory caches:

| Cache | What it holds |
|-------|---------------|
| `_cachedEnabled` | Scoped `sound_enabled` value (device → user → global waterfall) |
| `_cachedVolume` | Scoped `sound_volume` (device → user → global waterfall) |
| `_cachedScheme` | Scoped `sound_scheme` (device → user → global waterfall) |
| `_globalOverridesCache` | Per-event overrides from global scope (`sound_overrides`, global tier) |
| `_overridesCache` | Per-event overrides from user scope (`sound_overrides`, user tier) |
| `_deviceOverridesCache` | Per-event overrides from device scope (`sound_overrides`, device tier) |

The synchronous read methods (`_isEnabled()`, `_getVolume()`, `_getActiveScheme()`) return the cached values when available, falling back to the live HA helper otherwise.

`_getOverrides()` (private, used inside `play()`) returns the merged result: `{ ...globalOverridesCache, ...userOverridesCache, ...deviceOverridesCache }` — device-scope wins on a per-event basis.

`refreshScopedCache()` (public) clears all five caches and re-reads from the backend. The config panel calls this after every write so `play()` picks up changes immediately without a page reload.

This means:
- First render: uses the HA helpers (synchronous, available instantly).
- After first probe & cache load: uses the scoped values (highest-priority tier wins).

### Config Panel

Users configure their scoped overrides in **LCARdS Config Panel → Sounds → Per-User / Per-Device Overrides** (collapsible section at the bottom of the Sounds tab).

Admins manage all users and devices from **LCARdS Config Panel → Users & Devices**.

For a complete reference see the [Scoped Settings Service](scoped-settings.md) and [Device Identity Manager](device-identity.md) docs.

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

`mountGlobalUIListener()` attaches all Tier 2 listeners. It is idempotent (safe to call multiple times; exits early if already mounted). Called by `LCARdSCore` after initialization.

### Browser Autoplay Policy

Modern browsers block audio playback until the user has interacted with the page. SoundManager does not implement its own interaction guard — it relies on the browser's native policy. Practically this means:

- Card tap / hold / navigation sounds work immediately after any first user touch or click.
- The `system_ready` startup sound requires the HA dashboard URL to be added to the browser's "allowed to autoplay" list (see [Sound Effects → Browser Audio Policy](../../configuration/sounds#browser-audio-policy) for per-browser instructions).

### Sidebar Menu Toggle Handler

Listens for `hass-toggle-menu` on `window`. HA's `ha-menu-button` dispatches this event when the hamburger is tapped. Some HA versions dispatch it twice per click (button + host component), so the handler deduplicates events within a 200 ms window — only the first firing plays `menu_expand`. This approach is more reliable than click-path detection, which would also fire for icon buttons inside sidebar navigation links and cause double sounds.

### `hass-action` Handler

Catches tap/hold/double_tap on non-LCARdS HA cards (Mushroom, built-in HA cards, etc.) that fire the composed `hass-action` event. Guards against double-firing by skipping events whose `composedPath()` passes through any `LCARDS-*` element (LCARdS cards handle their own sounds via `LCARdSActionHandler`).

### `show-dialog` Handler

Fires on any HA dialog open except `ha-more-info-dialog` (which is handled separately as `more_info_open` to give it a distinct event type).

### `dialog-closed` Handler

Fires on any HA dialog dismiss (save, cancel, ESC, or close button). Skips dialogs whose `localName` starts with `lcards-` to avoid double-sounds from LCARdS-owned panels.

### Dashboard Edit Mode (`history.replaceState` patch)

HA uses `history.replaceState` (not a DOM event) to toggle `?edit=1` in the URL when entering/exiting dashboard edit mode. SoundManager patches `window.history.replaceState`, compares the `edit=1` param before/after, and fires `dashboard_edit_start` or `dashboard_edit_save` on change. The original function is saved as `_historyReplaceStateOrig` and restored in `destroy()`.

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

Any `assetKey` value may instead be a `media-source://…` content ID picked via the HA media library — the per-card and Config Panel sound-override pickers offer a **Browse HA Media** mode alongside bundled assets (see [Asset Manager — Media Source Resolution Flow](asset-manager#media-source-resolution-flow)). `_playAsset()` detects the `media-source://` prefix and routes to `_playMediaSourceAsset()` instead of the synchronous registry lookup:

```javascript
async _playMediaSourceAsset(mediaContentId) {
    const url = await this._core?.assetManager?.resolveMediaSourceUrl?.(mediaContentId);
    // rebuilds the cached Audio element if the resolved URL has changed —
    // media-source URLs may carry an expiring signed token, unlike the
    // permanent URLs used by bundled audio_assets
    ...
}
```

Unlike bundled assets, the cached `Audio` element is rebuilt whenever the resolved URL differs from what's cached, since `AssetManager.resolveMediaSourceUrl()` re-resolves (and may return a different signed URL) after its own 15-minute cache window expires.

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

Beyond pack-provided schemes, users can save, edit, and delete named schemes from the Config Panel. This is **global scope only** — user/device scopes don't manage schemes themselves, they just select a scheme (built-in or custom) from the global list and layer their own per-event overrides on top via device/user tiers, exactly as before (see [Overrides vs. the Active Scheme selector](#overrides-vs-the-active-scheme-selector) below for how that composes with custom schemes specifically).

```javascript
// Create — snapshots whatever's currently shown in the Per-Event Overrides table
const created = await sm.saveCustomScheme('Bridge Ops', overridesMap);
// → { ok: true, name: 'custom:bridge-ops' }  (slugified, 'custom:'-prefixed)
// → { ok: false, error: '...' }               (empty name, name collision, or backend unavailable)

// Update — overwrite an existing custom scheme's event map directly
// (the Config Panel calls this once per explicit Save while editing that scheme — see below)
const updated = await sm.updateCustomScheme('custom:bridge-ops', overridesMap);
// → { ok: true } | { ok: false, error: '...' }  (not a custom scheme / not found / backend unavailable)

// Delete
const deleted = await sm.deleteCustomScheme('custom:bridge-ops');
// → { ok: true } | { ok: false, error: '...' }  (not a custom scheme / backend unavailable)

// Read a scheme's raw event map (e.g. to display/edit it directly)
const mapping = sm.getSchemeMapping('custom:bridge-ops');  // { card_tap: 'my_asset', ... }
```

- **Naming**: the display name is slugified (lowercased, non-alphanumerics collapsed to `-`) and prefixed `custom:` to form the full scheme name (e.g. `"Bridge Ops"` → `custom:bridge-ops`). `isCustomScheme(name)` checks for this prefix — used by the Config Panel to badge custom schemes distinctly (`🛠️ bridge-ops (custom)`) in the Sound Scheme dropdown, and to gate which schemes can be edited/deleted (pack-provided schemes cannot be modified or deleted this way).
- **Persistence**: create/update/delete all read-modify-write the same flat, global (non-scoped) backend key, `custom_sound_schemes` (`STORAGE_KEY_CUSTOM_SOUND_SCHEMES` in `ScopedSettingsConstants.js`) — a `{ [fullSchemeName]: eventMap }` object — via `IntegrationService.readStorage()`/`writeStorage()` directly (not the per-user/device `ScopedSettingsService` waterfall, since a saved scheme is a shared named preset, not a personal setting). `_writeCustomSchemes(mutate)` is the shared private helper for this read-modify-write pattern.
- **Availability**: `registerSchemes()` / direct `_soundSchemes` mutation is called immediately after a successful write, so the change (new scheme, updated mapping, or removal) is reflected in the Sound Scheme dropdown without a reload.
- **Startup load**: `_ensureCustomSchemesLoaded()` mirrors `_ensureOverridesLoaded()`'s one-shot, wait-for-integration-probe pattern — called from `updateHass()`, it reads `custom_sound_schemes` once the integration is ready and registers every entry found.
- **Deleting the active scheme**: the Config Panel resets the `sound_scheme` helper to `'none'` immediately after a successful delete, since the just-deleted name is no longer a valid selection — the Per-Event Overrides table then re-sources from the (untouched) global overrides, per below.

### Overrides vs. the Active Scheme selector

The Per-Event Overrides table is **scheme-sourced**, not a single flat layer that sits on top of every scheme equally:

| Active Scheme | Table displays/edits | Edits persist to |
|---|---|---|
| Built-in (pack-provided), incl. `none` | The global override layer (`sound_overrides`, global tier) | **Staged locally only** — `sm.saveGlobalOverrides(overridesMap)` (single whole-map write) |
| Custom (`custom:…`) | That scheme's own event map (`sm.getSchemeMapping(name)`) | **Staged locally only** — `sm.updateCustomScheme(name, overridesMap)` |

Both contexts are **staged, not auto-saved** — editing a dropdown only updates local `_overrides`; nothing hits the backend until the user clicks the explicit **Save** button, `_saveOverrideChanges()` (branches to whichever of the two calls above applies). `lcards-sound-config-tab.js`'s `_reloadOverridesForActiveScheme()` re-derives `_overrides` from the correct source every time the Active Scheme selector changes (including externally, via its `sound_scheme` helper subscription) or on initial load — this also discards any unsaved staged edits, same as clicking **Discard**. `_setOverride()` is a pure local-state mutation now (no longer async).

**Why staged, not auto-saved** — two independent reasons, one per context:
- **Global**: per-event overrides always win over the active scheme during `play()`'s resolution (step 2 beats step 3), so a batch of overrides being built up "on the way to" a new/updated scheme needs to be treated as a single atomic unit, not a series of individual immediate backend writes. Auto-saving each change also raced with **Save as new scheme**: `saveCustomScheme()` registering a new scheme name triggers a background options-sync against the shared HA `input_select` entity (see below), and that sync's own "restore the previously-active scheme" step could land after the Config Panel's own explicit scheme switch and silently revert it — with global overrides auto-saving throughout, the visible symptom was "my override changes disappeared" even though the data was actually fine.
- **Custom scheme**: a scheme has no memory of whatever it may have been cloned from at creation time — once created it's a fully independent, standalone mapping. With auto-save, the *only* way to undo a single accidental edit was "Clear all overrides in this scheme," which reverts every event to silent, not to whatever was last saved. Staging gives a proper **Discard** (revert to last-saved) that's cleanly distinct from that kind of destructive clear.

**"Reset to scheme defaults" only exists for built-in schemes** — it clears the global override layer via `_resetOverrides()` (an *immediate*, already-confirmed write; its own inline "Are you sure?" banner is the explicit-commit step for that destructive action, distinct from casual staged dropdown edits), falling back to whatever the active built-in scheme (e.g. `lcards_default`) itself defines. A custom scheme has no such fallback to reset to — it's only editable (Save/Discard) or duplicatable (Save as new scheme), never "reset." The reset-overrides button's render condition checks `!isCustomScheme(schemeValue)`, and `_resetOverrides()` itself no longer branches on scheme type (removed as unreachable dead code — it's only ever invoked from that button).

`_overridesDirty` tracks whether local `_overrides` differs from the last-saved state (global or the active custom scheme, whichever applies). The save-scheme form, the reset confirmation, and the steady-state action row (unsaved-changes indicator + Save/Discard, Save as new scheme, and — built-in only — Reset to scheme defaults) are **mutually exclusive and share a single render slot** (`.overrides-action-row`) rather than stacking as separate banners. **Save as new scheme** reads `_overrides` as-is (staged edits included, from either context) — this is the intended way to promote a batch of staged edits straight into a scheme without ever explicitly saving them first. `SoundManager.waitForSchemeSync()` (see below) still guards the explicit scheme-switch-after-save from racing the background options-sync, independent of the staging fix.

**`SoundManager._getOverrides()`** additionally *skips the global tier* during playback resolution whenever the active scheme is custom (`isCustomScheme(this._getActiveSchemeName())`) — otherwise stale global overrides from a previous built-in-scheme session could still mask a custom scheme's own settings. User/device override tiers are **not** skipped — they keep applying on top of whichever scheme (built-in or custom) is globally active, the existing, unchanged per-user/device personalization layer.

Global overrides are **never cleared or migrated** by scheme switching or by **Save as new scheme** — they simply stop being displayed/consulted while a custom scheme is active, and reappear exactly as they were (last explicitly saved) when switching back to a built-in scheme. An earlier version of this had Save as new scheme clear global afterward, on the assumption the promoted values were now redundant there — that was wrong once overrides became staged rather than auto-saved (see above): the *staged* draft being promoted was frequently never written to global in the first place, so clearing "cleaned up" values that actually belonged to an earlier, unrelated explicit Save, silently destroying them. Save as new scheme is a pure read of local state now; it never writes to or clears global, regardless of source.

Custom schemes fully support `media-source://…` event mappings (see [HA Media Library Sounds](#ha-media-library-sounds) above) — saving/updating a scheme snapshots whatever asset keys or media-source IDs are currently set as overrides.

### Scheme-options sync coordination

Registering a new scheme (`saveCustomScheme()`) or removing one (`deleteCustomScheme()`) updates the shared HA `input_select.lcards_sound_scheme` entity's options list — a real network round trip (`input_select.set_options`, which unconditionally resets the entity's *value* to its first option, plus a restore call). Any Config Panel flow that explicitly switches the active scheme right after triggering one of these must `await sm.waitForSchemeSync()` first — otherwise the sync's own restore step is a separate, independently-timed call that can land *after* the explicit switch and silently revert it. Both `_confirmSaveScheme()` and `_deleteScheme()` do this.

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

`system_ready` and `error` are fired by `LCARdSCore._performInitialization()` at the end of the core init sequence. Because overrides and scoped settings are loaded asynchronously (they depend on the integration probe completing after HASS is distributed), `play()` must not be called until that load finishes — otherwise per-event overrides and scoped scheme selections are not yet in memory.

The solution is a non-blocking fire-and-forget:

```javascript
// In LCARdSCore._performInitialization():
this.soundManager.ensureReady().then(() => {
    if (!window._lcardsSystemReadyPlayed) {
        window._lcardsSystemReadyPlayed = true;
        this.soundManager.play('system_ready');
    }
});
```

**`ensureReady()`** returns the promise from `_ensureOverridesLoaded()`. If `updateHass()` already triggered the load earlier, the same in-flight or completed promise is returned — no duplicate load. The `.then()` chain is non-blocking, so core init completes immediately and cards mount normally.

**`window._lcardsSystemReadyPlayed`** is a page-load flag. `window` is completely reset on any true page load (including hard refresh), so the sound plays once per load. It survives SPA navigation and module re-initialization, preventing `system_ready` from replaying when LCARdS re-inits mid-session (e.g. navigating to the Config Panel).

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
// → { type: 'SoundManager', initialized: true, schemesCount: 3, activeScheme: 'lcards_default', overrideCount: 0 }
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
