# Connection Overlay System

> **Singleton**: `window.lcards.core.connectionOverlayService`
> **Console API**: `window.lcards.connectionOverlay.*`
> **Source**: `src/core/services/ConnectionOverlayService.js`
> **Config UI**: LCARdS Config Panel → Connectivity tab

---

## Overview

The Connection Overlay Service monitors the Home Assistant WebSocket connection and displays a full-screen overlay whenever the frontend loses contact with the HA server. It is a `BaseService` singleton that is active on every page the LCARdS module is loaded — no card placement is required.

Key capabilities:

- **Automatic detection** via two complementary signals (WS events + `hass.connected` flag)
- **Per-scope config** via the ScopedSettings waterfall — device, user, or global overrides
- **Config auto-refresh** — re-reads config from the scoped waterfall after every HA reconnect, so settings saved just before an HA restart are always picked up without a page reload
- **Three display modes** — simple text message, a full custom HA card, or a Borg-assimilation takeover
- **Optional reconnection banner** — brief confirmation overlay that auto-dismisses after reconnection
- **SEM integration** — backdrop, canvas, and colour effect layers via `ScreenEffectManager`
- **Stackable with alert overlay** — both overlays can be visible simultaneously; the connection overlay renders on top when both are active

---

## Architecture

```
ConnectionOverlayService (BaseService singleton)
    │
    ├─ Detection (two signals)
    │   ├─ hass.connection WS events  ('disconnected' / 'ready')  ← primary
    │   └─ hass.connected flag in updateHass()                    ← belt-and-suspenders
    │
    ├─ Config waterfall (ScopedSettingsService)
    │   device scope → user scope → global scope → localStorage cache → built-in defaults
    │
    └─ Portal (delegated to PortalOverlayManager, slot 'connection-overlay')
        └─ PortalOverlayManager → ScreenEffectManager portal (position:fixed, z:9100)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/core/services/ConnectionOverlayService.js` | Core singleton service |
| `src/core/services/PortalOverlayManager.js` | Shared portal DOM lifecycle engine |
| `src/core/services/ScopedSettingsConstants.js` | Flat storage key constants (`CONN_OVERLAY_*`) |
| `src/panels/components/lcards-connectivity-tab.js` | Config Panel UI |
| `src/lcards.js` | `window.lcards.connectionOverlay` console API shim |

---

## Detection Strategy

Two complementary signals are monitored so that disconnection is caught reliably under all conditions:

1. **`hass.connection` WebSocket events** (primary) — `home-assistant-js-websocket` fires `'disconnected'` on close and `'ready'` on (re)connect on the `Connection` object. The library has **no** `'reconnected'` event — `'ready'` is the correct reconnect signal, and it fires after auth completes on both the initial connection and every subsequent reconnect. These fire regardless of dashboard activity, avoiding false positives from idle dashboards (no state changes → no `updateHass` calls is normal and is **not** a disconnect signal).

2. **`hass.connected` flag** (belt-and-suspenders) — HA propagates the `hass.connected` boolean on connect/disconnect transitions. `updateHass()` monitors it to catch any edge-cases where the WS event fires slightly outside the `updateHass` call cycle.

The service subscribes to `hass.connection` events each time it sees a new `connection` object, and unsubscribes from the old one. Subscription is idempotent — re-subscribing to the same connection object is skipped.

---

## Config Schema

### Resolved config shape

This mirrors `DEFAULT_CONFIG` in `ConnectionOverlayService.js` — the built-in defaults before any scoped-settings overrides are applied. **`enabled` defaults to `false`** — the overlay is opt-in and must be explicitly turned on per scope.

```js
{
  enabled:  false,          // Opt-in — must be explicitly enabled per scope
  dismiss:  true,           // Whether clicking the backdrop dismisses it
  position: 'center',       // Content anchor: 'center' | 'top' | 'top-left' | 'bottom-right' | ...
  width:    'auto',         // CSS width for the content container ('auto' = size to content)
  height:   'auto',         // CSS height for the content container

  // Milliseconds to wait after a disconnect event before showing the overlay.
  // 0 = show immediately. Absorbs brief blips (mobile WiFi handoff, HA restart transients).
  disconnect_delay_ms: 2500,

  message: {
    mode:      'text',         // 'text' | 'card' | 'borg'
    text:      'Connection Lost',
    color:     'var(--error-color)',
    font:      'Antonio',      // lcards font registry key
    size:      42,             // px
    weight:    '400',          // CSS font-weight
    transform: 'uppercase',    // CSS text-transform
    // SEM layers used only when mode = 'borg' — mirrors the connectivity tab's
    // Borg-mode editor defaults (borg-assimilation canvas preset + saturate/tint).
    borgLayers: {
      canvas:   { preset: 'borg-assimilation', siteCount: 8, tendrilsPerSite: 5, tendrilLength: 600, particleCount: 2, color: 'var(--lcars-martian)', glowColor: 'var(--lcards-yellow)' },
      backdrop: { preset: 'saturate', amount: '200%' },
      color:    { preset: 'color-tint', color: 'rgba(0,60,0,0.25)' },
      paletteHue: 110,
      fontSwap:   true,
    },
  },

  reconnected: {
    enabled:              true,
    text:                 'Connection Established',
    color:                'var(--primary-color)',
    auto_dismiss_seconds: 3,
    font:      'Antonio',
    size:      42,
    weight:    '400',
    transform: 'uppercase',
    content:   null,           // Optional HA card config (card mode)
  },

  layers: {
    backdrop: null,            // null = disabled, or { preset, ...params }
    color:    { preset: 'color-tint', color: 'rgba(0,0,0,0.55)' },
    canvas:   { preset: 'static', opacity: 0.55 },
  },

  content: null,               // Optional HA card config when mode = 'card'
}
```

### Position values

| Value | Anchor |
|-------|--------|
| `center` *(default)* | Centred horizontally and vertically |
| `top` / `top-center` | Top edge, horizontally centred |
| `top-left` | Top-left corner |
| `top-right` | Top-right corner |
| `left` / `left-center` | Left edge, vertically centred |
| `right` / `right-center` | Right edge, vertically centred |
| `bottom` / `bottom-center` | Bottom edge, horizontally centred |
| `bottom-left` | Bottom-left corner |
| `bottom-right` | Bottom-right corner |

---

## Config Resolution — Scoped Waterfall

Config is stored as **25 flat keys** in `ScopedSettingsService` (one per independently overridable field). Resolution order, first non-null wins:

```
Device scope → User scope → Global scope → Built-in defaults
```

Flat keys are independent — a device-scoped colour does **not** clobber a global-scoped text value. This allows kiosks or individual users to override only the fields they care about.

Config is re-read from the full waterfall after every HA reconnect (`_doReconnected()` → `loadConfig()`), so settings saved just before an HA restart are picked up automatically without a page reload. A brief in-memory optimistic patch is also applied immediately after a successful save so that `_onDisconnected()` sees the correct flags even if the subsequent `loadConfig()` WS reads are interrupted by an HA restart.

### Flat key constants (from `ScopedSettingsConstants.js`)

| Constant | Key string | Field |
|----------|-----------|-------|
| `CONN_OVERLAY_ENABLED` | `conn_overlay_enabled` | `enabled` |
| `CONN_OVERLAY_DISMISS` | `conn_overlay_dismiss` | `dismiss` |
| `CONN_OVERLAY_POSITION` | `conn_overlay_position` | `position` |
| `CONN_OVERLAY_WIDTH` | `conn_overlay_width` | `width` |
| `CONN_OVERLAY_HEIGHT` | `conn_overlay_height` | `height` |
| `CONN_OVERLAY_CONTENT` | `conn_overlay_content` | `content` |
| `CONN_OVERLAY_SEM` | `conn_overlay_sem` | `layers` (entire object) |
| `CONN_OVERLAY_MSG_MODE` | `conn_overlay_msg_mode` | `message.mode` |
| `CONN_OVERLAY_MSG_TEXT` | `conn_overlay_msg_text` | `message.text` |
| `CONN_OVERLAY_MSG_COLOR` | `conn_overlay_msg_color` | `message.color` |
| `CONN_OVERLAY_MSG_FONT` | `conn_overlay_msg_font` | `message.font` |
| `CONN_OVERLAY_MSG_SIZE` | `conn_overlay_msg_size` | `message.size` |
| `CONN_OVERLAY_MSG_WEIGHT` | `conn_overlay_msg_weight` | `message.weight` |
| `CONN_OVERLAY_MSG_TRANSFORM` | `conn_overlay_msg_transform` | `message.transform` |
| `CONN_OVERLAY_RECON_ENABLED` | `conn_overlay_recon_enabled` | `reconnected.enabled` |
| `CONN_OVERLAY_RECON_TEXT` | `conn_overlay_recon_text` | `reconnected.text` |
| `CONN_OVERLAY_RECON_COLOR` | `conn_overlay_recon_color` | `reconnected.color` |
| `CONN_OVERLAY_RECON_DISMISS_SECS` | `conn_overlay_recon_dismiss_secs` | `reconnected.auto_dismiss_seconds` |
| `CONN_OVERLAY_RECON_FONT` | `conn_overlay_recon_font` | `reconnected.font` |
| `CONN_OVERLAY_RECON_SIZE` | `conn_overlay_recon_size` | `reconnected.size` |
| `CONN_OVERLAY_RECON_WEIGHT` | `conn_overlay_recon_weight` | `reconnected.weight` |
| `CONN_OVERLAY_RECON_TRANSFORM` | `conn_overlay_recon_transform` | `reconnected.transform` |
| `CONN_OVERLAY_RECON_CONTENT` | `conn_overlay_recon_content` | `reconnected.content` |
| `CONN_OVERLAY_BORG_SEM` | `conn_overlay_borg_sem` | `message.borgLayers` (entire object) |
| `CONN_OVERLAY_DISCONNECT_DELAY` | `conn_overlay_disconnect_delay` | `disconnect_delay_ms` |

---

## Portal Structure

The overlay is managed entirely by `PortalOverlayManager` (POM) under the named slot `'connection-overlay'`. `ConnectionOverlayService` calls `pom.show('connection-overlay', options)` and `pom.hide('connection-overlay')` — it does not manage any DOM directly.

POM injects the following structure into `ScreenEffectManager`'s shared `position:fixed` portal (`z-index:9100`, appended to `document.body`):

```
ScreenEffectManager portal  (position:fixed, inset:0, z:9100)
  ├─ SEM slot elements          (backdrop, canvas, color)
  │
  ├─ [slot: 'alert-overlay']    ← when alert overlay is also active
  │   ├─ dismissEl  (z:10)
  │   └─ wrapperEl  (z:11)
  │
  └─ [slot: 'connection-overlay']
      ├─ dismissEl              (position:absolute, inset:0, z:10)  — click-to-dismiss
      └─ wrapperEl              (position:absolute, inset:0, z:11, display:flex)
          └─ contentContainer   (flex child — width/height from config)
              └─ content card element  OR  text <div>
```

Slots are independent DOM subtrees. When both overlays are active, the connection overlay renders on top because its elements are appended after the alert overlay's elements.

---

## SEM Layer Ownership

When the overlay is visible with `layers` configured, `PortalOverlayManager` acquires the `backdrop`, `canvas`, and `color` SEM slots on behalf of the `'connection-overlay'` slot. Only one POM slot can own the SEM effect slots at a time (last-in-wins). All three slots are explicitly cleared when the slot is hidden — even if only some were occupied — to avoid leaving stale effects.

POM calls `sem.setOverlayOccupied(true)` as soon as any slot is shown, and `sem.setOverlayOccupied(false)` when all slots have been hidden.

---

## Alert Overlay Co-existence

Both the connection overlay and the alert overlay use `PortalOverlayManager` with independent named slots (`'connection-overlay'` and `'alert-overlay'`). They stack freely — there is no suppression logic. If an alert is active and HA disconnects, the connection overlay appears on top of the alert overlay (last `appendChild` wins at equal z-index).

The SEM effect slots are shared (last-in-wins): the connection overlay's `layers` config will evict the alert overlay's SEM effects if both are active simultaneously. If the connection overlay is configured without `layers` (text or card mode only), the alert backdrop effects are unaffected.

---

## Reconnection Banner

When `config.reconnected.enabled` is `true`, a brief confirmation overlay is shown after reconnection instead of immediately removing the portal:

1. The disconnect content is unmounted
2. Either a custom card (`config.reconnected.content`) or a plain text `<div>` is rendered
3. A timer fires after `auto_dismiss_seconds` and calls `_removePortal()`

The banner uses `PortalOverlayManager` under the `'connection-overlay'` slot — the existing slot is replaced (last-in-wins). No additional DOM elements are created.

---

## Display Modes

### Text mode (`message.mode = 'text'`)

A plain `<div>` is rendered in the content container using inline styles only (no CSS custom properties). This ensures the overlay remains styled correctly while disconnected, when the HA theme system may not be fully operational.

Styling fields: `text`, `color`, `font` (resolved via font registry), `size` (px), `weight`, `transform`.

### Card mode (`message.mode = 'card'`)

An arbitrary HA card config (`config.content`) is mounted as a custom element via `ha-card-factory`. The card element receives `hass` updates via `applyHassToCard()` on every `updateHass()` call. `width` and `height` from config are applied to the content container so the card fills a predictable area.

### Borg mode (`message.mode = 'borg'`)

Instead of the standard portal overlay, a disconnect delegates entirely to `BorgAssimilationManager.assimilate(opts)` — `message.borgLayers` (minus `paletteHue`, passed separately) becomes the `intro` layer config. There is no `disconnect_delay_ms` tolerance window in this mode; assimilation starts immediately on disconnect. On reconnect, `BorgAssimilationManager.deassimilate()` reverts it — the `reconnected.*` text/banner fields are not used.

---

## Console API

```js
// Force-show the overlay (useful for testing without disconnecting)
window.lcards.connectionOverlay.show()

// Show with a temporary preview config (not persisted; restored on hide)
window.lcards.connectionOverlay.showWith({ message: { text: 'Testing...' } })

// Hide the overlay
window.lcards.connectionOverlay.hide()

// Read the currently active resolved config
window.lcards.connectionOverlay.getConfig()

// Save config to global scope (default)
await window.lcards.connectionOverlay.saveConfig({
  message: { text: 'No Connection', color: '#ff9900' }
})

// Save to device scope only (overrides for this browser)
await window.lcards.connectionOverlay.saveConfig(
  { enabled: false },
  'device'
)

// Remove all overrides from device scope (falls back to user/global)
await window.lcards.connectionOverlay.clearConfig('device')

// Reload config from the scoped waterfall
await window.lcards.connectionOverlay.loadConfig()
```

---

## Relationship to Other Systems

| System | Relationship |
|--------|-------------|
| **PortalOverlayManager** | Owns all portal DOM for the connection overlay. `ConnectionOverlayService` calls `pom.show/hide('connection-overlay')` and has no direct DOM dependencies. |
| **ScreenEffectManager** | Provides the shared `position:fixed` portal and named effect slots. POM acquires/releases SEM slots on behalf of the connection overlay. |
| **ScopedSettingsService** | Stores the 25 flat config keys at device/user/global scope. Waterfall resolution is done in `loadConfig()` via parallel `sss.read()` calls. |
| **Alert overlay** (`lcards-alert-overlay`) | Both overlays use POM and stack independently. The connection overlay renders on top when both are active. SEM effect slots are last-in-wins. |
| **AssetManager** | Font keys in config (e.g. `'Antonio'`) are resolved to CSS `font-family` strings via `assetManager.getRegistry('font')`. Falls back to `<key>, sans-serif` if the registry is unavailable. |
| **Config Panel** (`lcards-connectivity-tab`) | UI tab that reads/writes config via the `window.lcards.connectionOverlay` API. Supports scope switching (device/user/global) and per-field override badges. Includes "Simulate Disconnect" / "Clear Test" buttons and admin broadcast controls. |
| **IntegrationService** | Receives `reload_connection_config` lcards_events and calls `loadConfig()` to update the runtime config and re-render the active overlay. |

---

## Remote Config Sync

When an admin saves connectivity settings for a remote device or user from the Config Panel, the affected browser automatically picks up the new settings via the `lcards_event` push channel:

```
Admin browser
  → save to device/user/global scope
    → ConnectionOverlayService.saveConfig() fires lcards/fire_event
      → Python hass.bus.async_fire("lcards_event", { action: "reload_connection_config", target_device_ids: [...] })
        → Matching browsers receive event via lcards/subscribe
          → IntegrationService._handleLcardsEvent() → case 'reload_connection_config'
            → connectionOverlayService.loadConfig()
              → Updates runtime config and re-renders active overlay immediately
              → Dispatches 'lcards-connection-config-changed' DOM event
                → Config Panel tab auto-refreshes badge state (or shows stale-data banner)
```

**Targeting rules** (set by `saveConfig()` automatically):

| Scope saved | Broadcast target |
|---|---|
| Remote device scope | Only that device UUID |
| Remote user scope | All sessions logged in as that user |
| Own-user scope | All sessions logged in as the saving user |
| Global scope | All connected browsers (no target filter) |
| Own-device scope | No broadcast needed — `loadConfig()` runs locally |

### Admin buttons in Config Panel action row

| Button | Action |
|---|---|
| **Reload Config** | Broadcasts `reload_connection_config` to all browsers — they call `loadConfig()` without a page reload |
| **Reload Pages** | Broadcasts `action: reload` — all browsers call `window.location.reload()` (nuclear option for deep state drift) |

### Config Panel live update

When a `reload_connection_config` event fires on a browser that has the Config Panel open:

- **No unsaved edits**: the panel silently re-loads `_scopedValues` and rebuilds its form — badges update to reflect the new scope state.
- **Unsaved edits present**: a blue info banner appears — "Settings were updated from another device. [Discard edits & refresh]" — preserving the in-progress work until the user decides.
