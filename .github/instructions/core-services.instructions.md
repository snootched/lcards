---
applyTo: src/core/**
---

# LCARdS Core Services Rules

These rules apply to all files under `src/core/`. They govern how singleton services are structured, initialized, and exposed.

---

## BaseService — Extension Pattern

Every singleton service must extend `BaseService`:

```javascript
import { BaseService } from '../BaseService.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

export class MyService extends BaseService {
  constructor() {
    super();
    // this._serviceName is auto-set to 'MyService' by BaseService
    this.initialized = false;
  }

  /**
   * Override if this service consumes HASS data.
   * Default BaseService implementation is a safe no-op.
   */
  updateHass(hass) {
    this._hass = hass;
    // update internal state with new entity data
  }

  /**
   * Override if you need a distinct ingestHass path.
   * Default forwards to updateHass().
   */
  // ingestHass(hass) { ... }
}
```

Only override `updateHass()` / `ingestHass()` if the service uses HASS data (e.g. DataSourceManager, RulesEngine). Theme-only or animation-only services should leave them as inherited no-ops.

---

## HASS Propagation Chain

Cards do **not** propagate HASS directly to services. The chain is:

```
LCARdSCard._onHassChanged()
  → window.lcards.core.ingestHass(newHass)        // only when relevant entities changed
    → LCARdSCore._updateHass(hass)
      → each registered service.updateHass(hass)
```

**Do not** call `service.updateHass()` from a card. Rely on the core propagation.

The ingest is **debounced and deduplicated** — `LCARdSCore` batches rapid HASS updates via microtask scheduling. Never assume synchronous delivery.

---

## Adding a New Service to LCARdSCore

1. Import in `src/core/lcards-core.js`
2. Add a `null`-initialized property to the constructor
3. Instantiate inside `_performInitialization()` in order (respect deps):

```javascript
// In constructor:
this.myService = null;

// In _performInitialization():
this.myService = new MyService();
await this.myService.initialize(hass); // if async init needed
lcardsLog.debug('[LCARdSCore] ✅ MyService initialized');
```

4. Expose on `window.lcards.core`:

```javascript
// At the bottom of _performInitialization() or in the namespace setup block:
window.lcards.core.myService = this.myService;
```

5. Add a getter if lazy access is needed:

```javascript
getMyService() {
  return this.myService;
}
```

---

## Initialization Order in `_performInitialization()`

The current order — respect dependencies:

1. `injectPalette()` — CSS vars (no deps)
2. `systemsManager` — entity tracking (no deps)
3. `dataSourceManager` — depends on `hass`
4. `rulesManager` — connects to `systemsManager`
5. `themeManager` — no deps (packs loaded later by PackManager)
6. `animationManager` — depends on `systemsManager`
7. `performanceMonitor` — no deps
8. `validationService` — depends on `hass`
9. `configManager` — depends on `validationService`
10. `stylePresetManager` — no deps (packs loaded later)
11. `animationRegistry` — no deps
12. `actionHandler`, `componentManager`, `packManager`, etc.

If your service depends on another, initialize it after that service.

---

## Global Namespace

Access pattern from anywhere in the codebase:

```javascript
// Core singletons
window.lcards.core.themeManager
window.lcards.core.dataSourceManager
window.lcards.core.rulesManager
window.lcards.core.animationManager
window.lcards.core.validationService
window.lcards.core.stylePresetManager
window.lcards.core.animationRegistry

// These 7 are the ones cards interact with most — window.lcards.core actually
// exposes the FULL LCARdSCore instance (15+ more singletons: actionHandler,
// configManager, assetManager, componentManager, helperManager, soundManager,
// packManager, performanceMonitor, and others). See _performInitialization()
// in src/core/lcards-core.js for the complete, current list.

// Debug APIs
window.lcards.debug.msd.*
window.lcards.cards.msd.*

// Alert API
window.lcards.alert.red()
window.lcards.alert.yellow()
window.lcards.alert.off()
```

Never access services via direct class imports at runtime — always go through `window.lcards.core.*` so you get the singleton instance.

---

## Logging in Services

Always use the `lcardsLog` structured logger with `[ServiceName]` prefix:

```javascript
lcardsLog.debug('[MyService] Operation started', { count: items.length });
lcardsLog.warn('[MyService] Unexpected state', { value });
lcardsLog.error('[MyService] Failed:', error);
```

Control level in browser console: `window.lcards.setGlobalLogLevel('debug')`

---

## `hass.connection` event listeners — never self-remove synchronously

`home-assistant-js-websocket`'s `Connection.fireEvent()` dispatches `'disconnected'`/`'ready'` via a plain `Array.forEach()` over the **live** listeners array, and `removeEventListener()` does an in-place `splice()` on that same array. If a listener removes itself (or an earlier-registered listener) *while still inside its own callback*, the array shifts and `forEach` silently skips whichever listener was registered immediately after it — that listener never sees the event.

This caused issue #381: `SoundManager._subscribeToNotifications()`'s `onDisconnect` handler called `connection.removeEventListener('disconnected', onDisconnect)` on itself synchronously. Because `SoundManager.updateHass()` runs before `ConnectionOverlayService.updateHass()` in `LCARdSCore._updateHass()`, SoundManager's listener sat at an earlier array index — so on the very first `'disconnected'` event of the page session, it removed itself and caused `ConnectionOverlayService`'s listener (registered right after it) to be skipped entirely. Every subsequent disconnect worked fine, because by then SoundManager's listener no longer existed to cause the skip. This is why the bug only ever manifested on the *first* WS disconnect of a browser session.

**Rule:** if a `hass.connection` listener needs to remove itself (or anything else) from inside its own callback, defer the removal with `queueMicrotask()` so it doesn't mutate the array mid-dispatch:

```javascript
const onDisconnect = () => {
  // ... handle disconnect ...
  queueMicrotask(() => connection.removeEventListener('disconnected', onDisconnect));
};
connection.addEventListener('disconnected', onDisconnect);
```

Any new code that calls `connection.addEventListener('disconnected', ...)` or `connection.addEventListener('ready', ...)` directly (bypassing `ConnectionOverlayService`) must follow this rule.

---

## Anti-patterns

❌ Don't call `service.updateHass()` from cards — let `LCARdSCore.ingestHass()` distribute it
❌ Don't initialize services outside `_performInitialization()` — initialization order matters
❌ Don't expose services on `window.lcards.core` before they are initialized — other code may read them on first HASS frame
❌ Don't use `console.log()` — use `lcardsLog` with a severity level
❌ Don't create services that depend on `window.lcards.core.*` being available at construction time — use lazy references or accept deps via constructor
❌ Don't call `connection.removeEventListener()` synchronously from inside a `hass.connection` event callback — defer with `queueMicrotask()` (see "`hass.connection` event listeners" above)
