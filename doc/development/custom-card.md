# Building a Custom Card

This guide walks through creating a new LCARdS card from scratch — from the class skeleton through registration in Home Assistant.

## Class Hierarchy

Every LCARdS card sits in this hierarchy:

```
LitElement
  └── LCARdSNativeCard   (shadow DOM, HASS binding, GUID, error boundary)
        └── LCARdSCard   (actions, templates, rules engine, style presets)
              └── YourCard
```

Extend `LCARdSCard` for any new card. Only drop to `LCARdSNativeCard` if you need very tight rendering control and do not need the action / template / rules pipeline.

## 1. Create the Card File

Create `src/cards/lcards-mycard.js`:

```javascript
import { LCARdSCard } from '../base/LCARdSCard.js';
import { html, css }  from 'lit';
import { lcardsLog }  from '../utils/lcards-logging.js';

export class LCARdSMyCard extends LCARdSCard {

  // ── Static contract ──────────────────────────────────────────────────────

  /** Minimum config stub shown in the HA card picker. */
  static getStubConfig() {
    return {
      type: 'custom:lcards-mycard',
      entity: 'sensor.my_sensor',
    };
  }

  /** Register YAML validation schema with CoreConfigManager. */
  static registerSchema() {
    // Optional — omit if your card needs no YAML validation.
    // Example:
    // window.lcards?.core?.configManager?.registerCardSchema('lcards-mycard', schema);
  }

  /** Height hint for the HA grid (50 px per row unit). */
  getCardSize() {
    const height = this._toPxInt(this.config?.height) || 56;
    return Math.ceil(height / 50) || 1;
  }

  // ── Optional: Visual Editor ───────────────────────────────────────────────
  static getConfigElement() {
    return document.createElement('lcards-mycard-editor');
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  static get styles() {
    return [
      super.styles,
      css`
        :host { display: block; width: 100%; height: 100%; }
        .my-card { width: 100%; height: 100%; }
      `,
    ];
  }

  // ── Constructor ──────────────────────────────────────────────────────────
  constructor() {
    super();
    this._myState = null;   // card-private state
  }

  // ── Lifecycle hooks ──────────────────────────────────────────────────────

  /**
   * Called once after the first Lit render.
   * Use for: rules registration, DataSource subscriptions, one-time DOM setup.
   */
  _handleFirstUpdate(changedProps) {
    super._handleFirstUpdate(changedProps);   // ALWAYS call super

    // Register with the Rules Engine so dynamic style patches apply.
    this._registerOverlayForRules(
      this.config.id || this._cardGuid,  // stable overlay ID
      'mycard',                           // overlay type
      ['mycard']                          // initial tags
    );

    lcardsLog.debug('[LCARdSMyCard] First update complete');
  }

  /**
   * Called on every HASS update.
   * Cache entity references here — do NOT read this.hass.states inside render().
   */
  _handleHassUpdate(newHass, oldHass) {
    super._handleHassUpdate(newHass, oldHass);  // ALWAYS call super

    if (!this.config.entity) return;

    const oldState = this._entity?.state;
    // this._entity is kept current by the base class; read it directly.
    if (this._entity?.state !== oldState) {
      lcardsLog.debug('[LCARdSMyCard] Entity state changed', { state: this._entity?.state });
      this.requestUpdate();
    }
  }

  /**
   * Called when the Rules Engine pushes new style patches.
   * Re-resolve any cached styles and call requestUpdate().
   */
  _onRulePatchesChanged(patches) {
    this._resolveStyle();  // see below
  }

  // ── Style resolution ─────────────────────────────────────────────────────

  _resolveStyle() {
    let style = { ...(this.config.style || {}) };

    // Merge rules patches on top (highest priority).
    style = this._getMergedStyleWithRules(style);

    this._cardStyle = style;
    this.requestUpdate();   // CRITICAL — always call after updating _cardStyle
  }

  // ── Render ───────────────────────────────────────────────────────────────

  /** Called on every render cycle. Return a Lit html template. */
  _renderCard() {
    const state = this._entity?.state ?? 'unavailable';
    const bg    = this._cardStyle?.background || 'var(--lcars-orange, #FF9900)';

    return html`
      <div class="my-card" style="background:${bg}">
        <span>${state}</span>
      </div>
    `;
  }
}
```

## 2. Lifecycle Hooks Summary

| Hook | When it fires | Typical use |
|------|--------------|-------------|
| `_handleFirstUpdate(changedProps)` | Once, after first render | Rules registration, DataSource subscriptions |
| `_handleHassUpdate(newHass, oldHass)` | Every HASS push | Cache `this._entity`, trigger re-render on state change |
| `_renderCard()` | Every render | Return Lit `html` template |
| `_onRulePatchesChanged(patches)` | Rules Engine pushes new patch | Merge patches into style, call `requestUpdate()` |
| `_onConfigSet(config)` | `setConfig()` called by HA | Override if you need to react to raw config before base processes it |

::: warning Always call `super`
Every `_handleFirstUpdate` and `_handleHassUpdate` override must call `super` before your code, or base-class wiring (logging, entity tracking, template processing) will be skipped.
:::

## 3. Entity State — Correct Pattern

**Cache the entity in `_handleHassUpdate`, read from cache in render:**

```javascript
// Good — base class updates this._entity automatically
_renderCard() {
  return html`<span>${this._entity?.state}</span>`;
}

// Bad — re-reads the entire states map on every render cycle
_renderCard() {
  const state = this.hass.states[this.config.entity_id]?.state;
  return html`<span>${state}</span>`;
}
```

`this._entity` is kept in sync by `LCARdSCard._handleHassUpdate`. You only need to override `_handleHassUpdate` when you want to react to the change (e.g. trigger animations or re-resolve a style).

## 4. Rules Engine Integration

Register the overlay in `_handleFirstUpdate` and re-resolve styles when patches arrive:

```javascript
_handleFirstUpdate(changedProps) {
  super._handleFirstUpdate(changedProps);

  this._registerOverlayForRules(
    this.config.id || this._cardGuid,
    'mycard',
    ['mycard', ...(this.config.tags || [])]
  );

  this._resolveStyle();
}

_onRulePatchesChanged(patches) {
  this._resolveStyle();
}

_resolveStyle() {
  let style = { ...(this.config.style || {}) };
  style = this._getMergedStyleWithRules(style);
  this._cardStyle = style;
  this.requestUpdate();  // required
}
```

## 5. Register the Card

All registration happens in `src/lcards.js`. Never call `customElements.define` from the card file itself.

```javascript
// src/lcards.js (inside the initializeCustomCard().then() block)

import { LCARdSMyCard } from './cards/lcards-mycard.js';

// 1. Register the custom element.
customElements.define('lcards-mycard', LCARdSMyCard);

// 2. Register YAML schema (optional).
LCARdSMyCard.registerSchema?.();

// 3. Advertise to the HA card picker.
window.customCards = window.customCards || [];
window.customCards.push({
  type:        'lcards-mycard',
  name:        'My Card',
  preview:     true,
  description: 'One-line description shown in the card picker',
});
```

## 6. Build and Test

```bash
npm run build          # production build → dist/lcards.js
npm run build:dev      # with source maps
```

Copy `dist/lcards.js` to `<HA config>/www/community/lcards/lcards.js`, then hard-refresh (Ctrl+Shift+R) in the browser. The card selector should now show your new card.

## 7. Logging

Use `lcardsLog` — never `console.log`:

```javascript
import { lcardsLog } from '../utils/lcards-logging.js';

lcardsLog.debug('[LCARdSMyCard] State changed', { state });
lcardsLog.warn ('[LCARdSMyCard] Config missing entity');
lcardsLog.error('[LCARdSMyCard] Render failed:', err);
```

Enable debug output in the HA dev console:
```javascript
window.lcards.setGlobalLogLevel('debug')
```

## Related

- [Building an Editor](building-an-editor.md)
- [Building a Pack](building-a-pack.md)
- [Helpers API](helpers-api.md)
- [Core Architecture](../architecture/systems-arch.md)
