# Adding a Core Service

A core service is a singleton the whole page shares: one instance, created by `LCARdSCore` at startup, reachable as `window.lcards.core.<name>`, fed the Home Assistant object by the core. Add one when several cards (or a card and the config panel) need the same state or connection; a feature only one card uses belongs in that card. This guide is the how-to; the existing services, their startup order and how HASS reaches them are in [Core Subsystems](../architecture/subsystems/), and the rules for code under `src/core/` are in `.github/instructions/core-services.instructions.md`.

## Checklist

1. Write the class in `src/core/`, extending `BaseService` ([step 1](#_1-the-service-class)).
2. Create it in `LCARdSCore._performInitialization()` after the services it needs ([step 2](#_2-create-it-in-the-core)).
3. Add it to `LCARdSCore._updateHass()` if it needs HASS, and to `destroy()` ([step 3](#_3-hass-and-teardown)).
4. Give it a `getDebugInfo()` ([step 4](#_4-debug-info)).
5. Test it ([step 5](#_5-tests)).
6. Document it in `doc/architecture/subsystems/` ([step 6](#_6-document-it)).

## 1. The service class

`BaseService` (`src/core/BaseService.js`) is small: it sets `this._serviceName` to the class name and gives no-op `updateHass(hass)` and `ingestHass(hass)` (which forwards to `updateHass()`) plus `getServiceInfo()`. A service that uses HASS overrides `updateHass()`; one that doesn't leaves it alone.

The sample follows the pattern of `IntegrationService` and `DeviceIdentityManager` (`src/core/services/`): keep the latest HASS, start the real work on the first HASS that has a connection, tell subscribers about changes.

```javascript
// src/core/services/ServerTimeZoneService.js
import { BaseService } from '../BaseService.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

/**
 * The Home Assistant server's time zone, for cards that show server time.
 * Subscribers hear about a change once, not on every HASS update.
 */
export class ServerTimeZoneService extends BaseService {
    constructor() {
        super();
        /** @type {any} */
        this._hass = null;
        /** @type {string|null} */
        this._timeZone = null;
        /** @type {Set<(tz: string) => void>} */
        this._listeners = new Set();
    }

    /**
     * Called by LCARdSCore._updateHass() on every distributed HASS object.
     * The first one is the module-load stub (no connection, no config).
     * @param {any} hass
     */
    updateHass(hass) {
        this._hass = hass;
        const tz = hass?.config?.time_zone;
        if (!tz || tz === this._timeZone) return;
        this._timeZone = tz;
        lcardsLog.debug('[ServerTimeZoneService] Time zone', { tz });
        for (const listener of this._listeners) {
            try { listener(tz); } catch (err) { lcardsLog.warn('[ServerTimeZoneService] Listener failed:', err); }
        }
    }

    /** @returns {string|null} */
    getTimeZone() {
        return this._timeZone;
    }

    /**
     * @param {(tz: string) => void} listener - called on a change, not on subscribe
     * @returns {() => void} unsubscribe
     */
    subscribe(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    /** Read by window.lcards.debug.singleton('serverTimeZoneService') */
    getDebugInfo() {
        return { timeZone: this._timeZone, listeners: this._listeners.size };
    }

    destroy() {
        this._listeners.clear();
        this._hass = null;
    }
}
```

Rules that apply to every service:

- **Logging** through `lcardsLog` with a `[ServiceName]` prefix, never `console.log`.
- **No dependency on `window.lcards.core` in the constructor.** The core is still being built. Take what you need as constructor arguments (`new AnimationManager(this.systemsManager)`, `new PackManager(this)`) or read `window.lcards.core.<other>` lazily when a method runs.
- **Connection listeners never remove themselves synchronously.** `Connection.fireEvent()` in home-assistant-js-websocket loops over the live listener array, so a listener that calls `removeEventListener()` inside its own callback makes the next listener miss the event (issue #381). Defer it:

```javascript
const onDisconnect = () => {
    // ... handle the disconnect ...
    queueMicrotask(() => connection.removeEventListener('disconnected', onDisconnect));
};
connection.addEventListener('disconnected', onDisconnect);
```

- **Storage and backend calls** go through `IntegrationService` and `ScopedSettingsService`, which handle a missing integration (degraded mode) and the admin-only global scope. See [Backend WS API](backend-api.md).

## 2. Create it in the core

In `src/core/lcards-core.js`:

```javascript
import { ServerTimeZoneService } from './services/ServerTimeZoneService.js';

// constructor(), with the other services
this.serverTimeZoneService = null;   // Home Assistant server time zone

// _performInitialization(hass), after the services it depends on
this.serverTimeZoneService = new ServerTimeZoneService();
lcardsLog.debug('[LCARdSCore] ✅ ServerTimeZoneService created');
```

- **Where in the order.** `_performInitialization()` creates the services one after another (`injectPalette()`, `systemsManager`, `dataSourceManager`, `rulesManager`, `themeManager`, ... `packManager`, then `screenEffectManager` to `connectionOverlayService`). Create yours after everything it uses; a service with no dependencies goes with the late group, before `this._coreInitialized = true`. The numbered order with what each step needs is in [Core Subsystems: Initialization Order](../architecture/subsystems/#initialization-order).
- **Async setup.** If the service needs an `initialize()` that must finish before cards use it, `await` it there (as `assetManager.initialize()` is). Anything that waits for the backend runs after `integrationService.onReady()` and must not block startup (see how theme overrides and the connection overlay config load).
- **No extra exposure step.** `src/lcards-main.js` assigns `window.lcards.core = lcardsCore`, so `this.serverTimeZoneService` already is `window.lcards.core.serverTimeZoneService`. It exists only after `_performInitialization()` has created it, so callers use optional chaining: `window.lcards?.core?.serverTimeZoneService?.getTimeZone()`.
- **Access from cards** goes through `window.lcards.core`, never a module import of the class (that would be a second instance). `LCARdSCard._initializeSingletons()` copies only seven services into `this._singletons`; leave that list alone unless most cards need yours.

## 3. HASS and teardown

**The core does not distribute HASS to every service: `_updateHass(hass)` calls a hand-written list.** Add yours there if it overrides `updateHass()`:

```javascript
// LCARdSCore._updateHass(hass), with the others
if (this.serverTimeZoneService) {
    this.serverTimeZoneService.updateHass(hass);
}
```

How HASS gets there, so you know what the service sees:

- Cards call `window.lcards.core.ingestHass(hass)` only when one of their own or tracked entities changed. `ingestHass()` keeps the latest object and runs `_updateHass()` once per microtask, so delivery is never synchronous and many cards updating together cause one call.
- While no card is registered (or a portal overlay shows a card), the core polls `<home-assistant>.hass` every 500 ms (`_startGlobalHassFeed()`), so the service also gets HASS on pages without LCARdS cards.
- At module load the core is initialised with a stub (`states: {}`, no `connection`), so check for `hass.connection` (or the fields you read) before starting work.
- A card never calls `service.updateHass()` itself.

The list order matters only when services depend on each other within one update (the issue #381 bug came from `SoundManager` running before `ConnectionOverlayService`). The full chain: [Core Subsystems: HASS distribution](../architecture/subsystems/#hass-distribution).

`LCARdSCore.destroy()` also lists its services by hand; add a `destroy()` call there when the service holds listeners, timers or subscriptions:

```javascript
if (this.serverTimeZoneService) {
    this.serverTimeZoneService.destroy();
    this.serverTimeZoneService = null;
}
```

## 4. Debug info

A `getDebugInfo()` method is all the debug API needs. `window.lcards.debug.singleton('serverTimeZoneService')` calls it, and `window.lcards.debug.singletons()` lists every property of the core that has one (`src/api/CoreDebugAPI.js`). Add it to `LCARdSCore.getDebugInfo()` too if it belongs in the `window.lcards.debug.core()` snapshot. See [Debug API: debug.singleton(manager)](debug-api.md#debug-singleton-manager).

## 5. Tests

A service is plain JavaScript, so most of it is tested in node (`tests/core/`):

```javascript
// tests/core/server-time-zone-service.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFakeHass } from '../helpers/fake-hass.js';
import { ServerTimeZoneService } from '../../src/core/services/ServerTimeZoneService.js';

test('subscribers hear a time zone change once', () => {
    const service = new ServerTimeZoneService();
    const heard = [];
    service.subscribe(tz => heard.push(tz));
    const hass = createFakeHass();                  // config.time_zone is 'UTC'
    service.updateHass(hass);
    service.updateHass({ ...hass });                // same zone: no second call
    service.updateHass({ ...hass, config: { ...hass.config, time_zone: 'Europe/Berlin' } });
    assert.deepEqual(heard, ['UTC', 'Europe/Berlin']);
    assert.equal(service.getTimeZone(), 'Europe/Berlin');
    service.destroy();
});
```

- `tests/helpers/fake-hass.js`: `createFakeHass({ states, replies, onSubscribe, user })` gives a browser-safe fake with a service-call spy (`hass.serviceCalls`) and a scripted connection (`hass.connection.sent`, `hass.connection.push()`).
- `tests/helpers/jsdom-env.js`: `installJsdom()` installs a jsdom `document` and `window` for code that touches the DOM, and is how a test runs the real core headless (`await lcardsCore.initialize(createFakeHass())`; see `tests/core/rules-core-wiring.test.js`). Clear `lcardsCore._globalHassTimer` in `after()`.
- Run one file with `node --no-maglev --import ./tests/setup/browser-shims.js --import ./tests/setup/vite-imports.js --test <file>`; `npm test` runs them all. See [Testing](testing.md).

## 6. Document it

- A page `doc/architecture/subsystems/<name>.md`: what it owns, its public API, when it gets HASS, console access.
- In `doc/architecture/subsystems/index.md`: a row in the Quick Reference table, a short section, its step in the Initialization Order table, and its place in the HASS distribution list if it is in `_updateHass()`.
- The numbered order in `.github/instructions/core-services.instructions.md`, and the singleton list in `CLAUDE.md` if cards will use it.
- If it adds a `--lcards-*` CSS variable, register it in `src/lcards-vars.js`.

## Related

- [Core Subsystems](../architecture/subsystems/): every service, the startup order and the HASS chain
- [Card Foundation](../architecture/cards/lcards-card-foundation.md): how cards read the core
- [Debug API](debug-api.md)
- [Type Checking](typescript.md)
