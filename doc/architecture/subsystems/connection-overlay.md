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
- **Offline-first** — reads a localStorage cache at construction, so the overlay appears immediately even after a hard browser refresh while HA is already offline
- **Two display modes** — simple text message or a full custom HA card
- **Optional reconnection banner** — brief confirmation overlay that auto-dismisses after reconnection
- **SEM integration** — backdrop, canvas, and colour effect layers via `ScreenEffectManager`
- **Alert overlay co-existence** — automatically suppressed when a non-default alert mode is active

---

## Architecture

```
ConnectionOverlayService (BaseService singleton)
    │
    ├─ Detection (two signals)
    │   ├─ hass.connection WS events  ('disconnected' / 'reconnected')  ← primary
    │   └─ hass.connected flag in updateHass()                          ← belt-and-suspenders
    │
    ├─ Config waterfall (ScopedSettingsService)
    │   device scope → user scope → global scope → localStorage cache → built-in defaults
    │
    ├─ Portal (inside ScreenEffectManager's position:fixed div, z-index:9100)
    │   ├─ dismissEl   (z:10)  — click-catcher for user dismiss
    │   └─ wrapperEl   (z:11)  — flex container for content card / text message
    │       └─ contentContainer — mounts the card element or text div
    │
    └─ SEM slot ownership
        backdrop / canvas / color slots acquired on show, released on hide
```

### Key Files

| File | Purpose |
|------|---------|
| `src/core/services/ConnectionOverlayService.js` | Core singleton service |
| `src/core/services/ScopedSettingsConstants.js` | Flat storage key constants (`CONN_OVERLAY_*`) |
| `src/panels/components/lcards-connectivity-tab.js` | Config Panel UI |
| `src/lcards.js` | `window.lcards.connectionOverlay` console API shim |

---

## Detection Strategy

Two complementary signals are monitored so that disconnection is caught reliably under all conditions:

1. **`hass.connection` WebSocket events** (primary) — `home-assistant-js-websocket` fires `'disconnected'` / `'reconnected'` on the `Connection` object immediately when the underlying WebSocket closes or reopens. This fires regardless of dashboard activity, avoiding false positives from idle dashboards (no state changes → no `updateHass` calls is normal and is **not** a disconnect signal).

2. **`hass.connected` flag** (belt-and-suspenders) — HA propagates the `hass.connected` boolean on connect/disconnect transitions. `updateHass()` monitors it to catch any edge-cases where the WS event fires slightly outside the `updateHass` call cycle.

The service subscribes to `hass.connection` events each time it sees a new `connection` object, and unsubscribes from the old one. Subscription is idempotent — re-subscribing to the same connection object is skipped.

---

## Config Schema

### Resolved config shape

```js
{
  enabled:  true,          // Whether the overlay is active at all
  dismiss:  true,          // Whether clicking the backdrop dismisses it
  position: 'center',      // Content anchor: 'center' | 'top' | 'top-left' | 'bottom-right' | ...
  width:    'auto',        // CSS width for the content container ('auto' = size to content)
  height:   'auto',        // CSS height for the content container

  message: {
    mode:      'text',         // 'text' | 'card'
    text:      'Connection Lost',
    color:     '#93e1ff',
    font:      'Antonio',      // lcards font registry key
    size:      26,             // px
    weight:    '400',          // CSS font-weight
    transform: 'uppercase',    // CSS text-transform
  },

  reconnected: {
    enabled:              false,
    text:                 'Connection Restored',
    color:                '#4caf50',
    auto_dismiss_seconds: 3,
    font:      'Antonio',
    size:      26,
    weight:    '400',
    transform: 'uppercase',
    content:   null,           // Optional HA card config (card mode)
  },

  layers: {
    backdrop: null,            // null = disabled, or { preset, ...params }
    color:    { preset: 'color-tint', color: 'rgba(0,0,0,0.55)' },
    canvas:   { preset: 'static', intensity: 0.45 },
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

Config is stored as **23 flat keys** in `ScopedSettingsService` (one per independently overridable field). Resolution order, first non-null wins:

```
Device scope → User scope → Global scope → localStorage cache → Built-in defaults
```

Flat keys are independent — a device-scoped colour does **not** clobber a global-scoped text value. This allows kiosks or individual users to override only the fields they care about.

The localStorage cache (key: `lcards_connection_overlay_config`) is written every time the full waterfall is read and is loaded synchronously at service construction. This means the overlay uses the last-known config immediately on page load, even if HA is already offline.

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

---

## Portal Structure

The overlay injects directly into `ScreenEffectManager`'s shared `position:fixed` portal (`z-index:9100`, appended to `document.body`). This makes the overlay visible on any page — no Lovelace card is needed.

```
ScreenEffectManager portal  (position:fixed, inset:0, z:9100)
  ├─ SEM slot elements      (backdrop, canvas, color)
  ├─ dismissEl              (position:absolute, inset:0, z:10)  — click-to-dismiss target
  └─ wrapperEl              (position:absolute, inset:0, z:11, display:flex)
      └─ contentContainer   (flex child — width/height from config)
          └─ content card element  OR  text <div>
```

The portal and its content elements are created on first show (`_createPortal()`) and removed on hide (`_removePortal()`). Portal creation is idempotent — a second call while already shown is a no-op.

---

## SEM Layer Ownership

When the overlay is visible, `ConnectionOverlayService` acquires the `backdrop`, `canvas`, and `color` slots from `ScreenEffectManager` by calling `sem.applySlot()` for each non-null layer in `config.layers`. All three slots are explicitly cleared on hide — even if only some were occupied — to avoid leaving stale effects.

The service sets `sem.setOverlayOccupied(true)` while visible, which signals to other consumers (such as the screen effect console API) that the portal is in use.

---

## Alert Overlay Co-existence

When a non-default alert mode is active (`window.lcards.core.themeManager.currentAlertMode !== 'green_alert'`), `_onDisconnected()` suppresses the connection overlay — the alert overlay takes priority. The connection overlay will show on the next `_onDisconnected()` evaluation once the alert clears.

If the connection drops *during* an active alert, the disconnect is silently ignored until the alert clears and the next disconnect event is received.

---

## Reconnection Banner

When `config.reconnected.enabled` is `true`, a brief confirmation overlay is shown after reconnection instead of immediately removing the portal:

1. The disconnect content is unmounted
2. Either a custom card (`config.reconnected.content`) or a plain text `<div>` is rendered
3. A timer fires after `auto_dismiss_seconds` and calls `_removePortal()`

The banner uses the same portal and SEM slots as the disconnect overlay — no additional DOM elements are created.

---

## Display Modes

### Text mode (`message.mode = 'text'`)

A plain `<div>` is rendered in the content container using inline styles only (no CSS custom properties). This ensures the overlay remains styled correctly while disconnected, when the HA theme system may not be fully operational.

Styling fields: `text`, `color`, `font` (resolved via font registry), `size` (px), `weight`, `transform`.

### Card mode (`message.mode = 'card'`)

An arbitrary HA card config (`config.content`) is mounted as a custom element via `ha-card-factory`. The card element receives `hass` updates via `applyHassToCard()` on every `updateHass()` call. `width` and `height` from config are applied to the content container so the card fills a predictable area.

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
| **ScreenEffectManager** | Provides the shared `position:fixed` portal and named effect slots. `ConnectionOverlayService` injects its content into the portal and acquires backdrop/canvas/color slots while visible. |
| **ScopedSettingsService** | Stores the 23 flat config keys at device/user/global scope. Waterfall resolution is done in `loadConfig()` via parallel `sss.read()` calls. |
| **Alert overlay** (`lcards-alert-overlay`) | Alert takes priority — connection overlay is suppressed when `currentAlertMode !== 'green_alert'`. Both systems use the same SEM portal; they do not run simultaneously. |
| **ThemeManager** | Checked for `currentAlertMode` to implement alert co-existence. No theming dependency — all text styles use explicit inline values to remain functional while disconnected. |
| **AssetManager** | Font keys in config (e.g. `'Antonio'`) are resolved to CSS `font-family` strings via `assetManager.getRegistry('font')`. Falls back to `<key>, sans-serif` if the registry is unavailable. |
| **Config Panel** (`lcards-connectivity-tab`) | UI tab that reads/writes config via the `window.lcards.connectionOverlay` API. Supports scope switching (device/user/global) and per-field override badges. Includes "Simulate Disconnect" and "Clear Test" buttons that call `showWith()` / `hide()`. |
