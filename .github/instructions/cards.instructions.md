---
applyTo: src/cards/**
---

# LCARdS Card Development Rules

These rules apply to all files under `src/cards/`. They complement `copilot-instructions.md` with precise API-level detail.

---

## Required Static Members

Every card class **must** declare both:

```javascript
export class MyCard extends LCARdSCard {

  /** Used by CoreConfigManager for schema lookup and preset merging */
  static CARD_TYPE = 'my-card';

  /** Minimal config shown in the HA card picker gallery */
  static getStubConfig() {
    return {
      type: 'custom:lcards-my-card',
      entity: 'light.example'
    };
  }
}
```

`CARD_TYPE` must match the key registered in `CoreConfigManager`'s schema map. If absent, `processConfig()` silently skips validation and preset merging.

`getStubConfig()` must include `type` and `entity` (if the card needs one). It is the minimum viable config for the card to render in the picker.

---

## Lifecycle Hooks — Correct Order

Override only what you need. Call `super` first in every hook:

```javascript
// 1. Called once after first render — do setup here
_handleFirstUpdate(changedProps) {
  super._handleFirstUpdate(changedProps);

  // Guard: skip expensive init in preview contexts (card picker, editor preview)
  if (this._isPreviewMode) return;

  // Setup actions, register rules overlay, subscribe to entities
  this._setupCardActions();
  this._registerOverlayForRules(`my-card-${this._cardGuid}`, 'my-card');
  this.subscribeToEntity(this.config.entity, (id, newState) => {
    this._entity = newState;
    this.requestUpdate();
  });
}

// 2. Called on every HASS update
_handleHassUpdate(newHass, oldHass) {
  super._handleHassUpdate(newHass, oldHass);
  // React to specific entity changes here if needed
}

// 3. Called every render — return Lit template
_renderCard() {
  return html`<div>...</div>`;
}

// 4. Called when rule patches change
_onRulePatchesChanged() {
  this._resolveStyle(); // Must reach requestUpdate()
}

// 5. Card-specific teardown only (base handles everything else)
_onDisconnected() {
  if (this._myInterval) {
    clearInterval(this._myInterval);
    this._myInterval = null;
  }
  super._onDisconnected(); // Always last
}
```

---

## Entity Access

### Preferred: event-driven via `subscribeToEntity()`

Fires on initial load and every subsequent state change. **Auto-unsubscribed** on disconnect — do NOT manually call unsubscribe in `_onDisconnected`.

```javascript
this.subscribeToEntity(this.config.entity, (entityId, newState, oldState) => {
  this._entity = newState;
  this.requestUpdate();
});
```

### Snapshot: `getEntityState()`

Returns the current cached state without subscribing. Use for one-time reads.

```javascript
const state = this.getEntityState('sensor.temperature');
const ownState = this.getEntityState(); // uses config.entity
```

### ❌ Anti-patterns

```javascript
// WRONG — bypasses cache, no change notifications
render() { const s = this.hass.states[this.config.entity]; }

// WRONG — manual subscription not auto-tracked for cleanup
const unsub = this._singletons.systemsManager.subscribeToEntity(id, cb);
```

---

## Action Handling

Use `setupActions()` for **all** tap/hold/double-tap interactions. Never bind raw click/pointer listeners for HA actions.

```javascript
_handleFirstUpdate() {
  super._handleFirstUpdate();
  const el = this.shadowRoot.querySelector('.interactive');
  if (el) {
    this.setupActions(el, {
      tap_action:        this.config.tap_action,
      hold_action:       this.config.hold_action,
      double_tap_action: this.config.double_tap_action
    });
  }
}
```

Use the inherited `callService()` wrapper — never call `this.hass.callService()` directly:

```javascript
// ✅ CORRECT
await this.callService('light', 'turn_on', { entity_id: this.config.entity, brightness: 255 });

// ❌ WRONG — bypasses error handling and logging
await this.hass.callService('light', 'turn_on', { entity_id: this.config.entity });
```

---

## Rules Engine Integration

```javascript
_handleFirstUpdate() {
  super._handleFirstUpdate();
  // signature: (overlayId, type, tags = [])
  this._registerOverlayForRules(`my-card-${this._cardGuid}`, 'my-card');
  this._resolveStyle();
}

_onRulePatchesChanged() {
  this._resolveStyle();
}

_resolveStyle() {
  let style = { ...this.config.style };
  style = this._getMergedStyleWithRules(style); // apply rule patches last
  this._cardStyle = style;
  this.requestUpdate(); // CRITICAL
}
```

---

## Card Size

Override `_getCardSize()` when the card is taller than 1 grid row. Compute it inline from the resolved pixel height (grid row ≈ 50px):

```javascript
_getCardSize() {
  const h = this._configPx(this.config.style?.height) || 200;
  return Math.ceil(h / 50); // see lcards-chart.js / lcards-msd.js for real examples
}
```

---

## Sizing in Nested Grids (hui-card)

HA wraps every card in `<hui-card>` (light DOM, no styles, no height of its own). Card hosts are `height: 100%` from the base CSS. Empirically verified rules for cards living inside `lcards-layout-card` / `lcards-layout-view` tracks:

- **Content-sized tracks (`auto`, `max-content`) cannot reliably measure a card through hui-card.** Percentage-height hosts contribute 0 or garbage to intrinsic track sizing. If a card must drive a content-sized parent track, compute its natural height from config and set it as a **definite inline pixel height on the host** (reference implementation: `lcards-select-menu` `grid.height: 'fit'`). The parent track should be `minmax(0, max-content)` — sizes to the published height, capped by the container.
- **Filling a bounded track**: host stays `height: 100%`, track is `minmax(0, 1fr)` — never bare `1fr`. Bare `1fr` = `minmax(auto, 1fr)`, whose auto minimum lets the card's intrinsic min-content inflate the track and overflow the layout. To compute exact child sizes from the container, use a `ResizeObserver` (reference: select-menu `grid.height: '100%'`) — but never combine container measurement with a content-sized parent track (circular → shrink spiral).
- **Buttons never shrink below the theme minimum.** With no `height`/`min_height` config, `--lcars-button-min-height` (typically 56px) applies — a button in a collapsed `0px` row still paints ~56px past the row (overflow is visible throughout). Panel strips/fillers placed in collapsible rows must set `min_height: 1`.
- A ResizeObserver-computed size must **never lock in an inflated measurement**: if the observed container can grow from your own content (auto-min track), the feedback loop ratifies overflow forever. Fix the track (`minmax(0, …)`) before trusting the measurement.

---

## Preview Mode Guard

The base class (`LCARdSNativeCard`) only tracks a boolean: `isPreviewMode()` / `this._isPreviewMode` returns `true` or `false` (`_detectPreviewMode()` in `src/base/LCARdSNativeCard.js`). Use it to skip expensive init in preview/picker contexts:

```javascript
_handleFirstUpdate() {
  super._handleFirstUpdate();
  if (this._isPreviewMode) return; // skip DataSource subscriptions, animations, ResizeObserver
  this._initFullSetup();
}
```

`isPreviewMode()` returning the tri-state `false`/`'editor'`/`'picker'` string is **`LCARdSMSDCard`-specific** — `lcards-msd.js` overrides `_detectPreviewMode()` without calling `super()` and does its own picker-vs-editor distinction (`this._isPreviewMode === 'picker'`). Don't rely on the tri-state form outside `lcards-msd.js`; see `msd.instructions.md`.

---

## Zone System

Zones are named rectangular regions on the SVG surface that text fields can be routed to via `zone: <name>`.

**Always call `_rebuildZones()` at the top of each render before using zone data:**

```javascript
_renderCard() {
  const { width, height } = this._containerSize || { width: 400, height: 200 };
  this._rebuildZones(width, height); // clears, recalculates, merges user zones
  return html`...`;
}
```

**To define auto-zones for your card geometry**, override `_calculateZones()`:

```javascript
_calculateZones(width, height) {
  this._zones.set('left', { bounds: { x: 0, y: 0, width: width * 0.3, height } });
  this._zones.set('body', { bounds: { x: width * 0.3, y: 0, width: width * 0.7, height } });
}
```

`_generateZoneTextMarkup`/`_generateZoneDebugMarkup`/`_injectTextFieldsToElement` are defined on `LCARdSButton`, not on base `LCARdSCard` — available to `LCARdSButton` and its subclasses (`LCARdSSlider`, `LCARdSElbow`) only. Cards extending `LCARdSCard` directly (chart, data-grid, alert-overlay, layout-card, select-menu, msd) don't have them.

**SVG string pipeline** — use `_generateZoneTextMarkup(textFields)`:

```javascript
const textSvg = this._generateZoneTextMarkup(this.config.text_fields);
const debugSvg = this._generateZoneDebugMarkup(); // empty unless config.debug_zones: true
```

**DOM SVG pipeline** — use `_injectTextFieldsToElement(svgEl, w, h)`:

```javascript
this._injectTextFieldsToElement(this._svgEl, width, height);
```

❌ Never call `_calculateZones()` directly — always go through `_rebuildZones()` so user overrides are applied.
❌ Never access `this._zones` before calling `_rebuildZones()` — it will be empty or stale.
❌ Do not use `_processTextFields()` in zone-aware cards — use `_generateZoneTextMarkup` or `_injectTextFieldsToElement`.

---

## Cleanup Rules

`_onDisconnected()` in the base class automatically handles:
- `core.unregisterCard()` (core registry)
- `systemsManager.unregisterOverlay()` (overlay registry)
- All `subscribeToEntity()` calls (auto-tracked set)
- Registered DataSources
- ResizeObserver
- `setupActions()` handler
- Theme overrides listener

**Cards must NOT duplicate any of these cleanup calls.** Only add an `_onDisconnected()` override for card-specific teardown (timers, AbortControllers, 3rd-party instances). Always call `super._onDisconnected()` last.

---

## Custom Element Registration

Register the card element in `src/lcards.js` — never in the card file itself. Card editors are the exception: each self-registers with the same guard, in its own editor file. Guard against double-registration:

```javascript
if (!customElements.get('lcards-my-card')) {
  customElements.define('lcards-my-card', MyCard);
}
```

`window.customCards` metadata is a single guarded bulk push of an array (`LCARdSCardClasses`), not a per-card call — add your card's `{ type, name, description }` entry to that array in `src/lcards.js` rather than calling `window.customCards.push({...})` yourself:

```javascript
window.customCards.push(...LCARdSCardClasses); // guarded by !window.customCards.some(c => c.type === 'lcards-button')
```
