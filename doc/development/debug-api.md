# Debug API

Browser console tools for LCARdS development: the log level, the `window.lcards.debug.*` namespaces, and the other console APIs on `window.lcards`. Everything here is set up by the bundle on every Home Assistant page; open the browser's developer tools on a dashboard and type into the console.

::: tip Runtime snapshot
```javascript
window.lcards.info()   // version (frontend and integration), build date, Home Assistant version and theme,
                       // UIX / card-mod, log level, preview flag, registered cards, core status
```
For a bug report, `await window.lcards.support.copy()` copies the full checked support info as markdown ([Getting Help](/getting-started/getting-help#other-ways-to-collect-info)).
:::

---

## Log Level

**Four places set the level; the later one wins** (`src/lcards-main.js:8-29`).

1. The level saved in this browser (`localStorage` key `lcards-global-log-level`), else `info`. Module-level logs from before core startup use this one (`src/utils/lcards-logging.js:14-28`).
2. The integration's **Log level** option: `frontend.py` puts it on the script URL as `/lcards/lcards.js?v=<version>&log=<level>`, and the loader stub hands it on as `window.__LCARDS_BOOT__.log` (`src/lcards.js:13-30`).
3. `?lcards_log_level=<level>` on the page URL, for one session without touching the integration settings. Useful for catching early startup errors.
4. `window.lcards.setGlobalLogLevel(level)` in the console, at any time.

Every way of setting the level also saves it in this browser, so it survives reloads.

### `setGlobalLogLevel(level)`

Sets the level for all LCARdS output. Valid levels are `off`, `error`, `warn`, `info`, `debug` and `trace`; anything else falls back to `info` with a warning (`lcards-logging.js:30-45`).

```javascript
window.lcards.setGlobalLogLevel('off')     // nothing at all
window.lcards.setGlobalLogLevel('error')   // errors only
window.lcards.setGlobalLogLevel('warn')
window.lcards.setGlobalLogLevel('info')    // default
window.lcards.setGlobalLogLevel('debug')
window.lcards.setGlobalLogLevel('trace')   // maximum verbosity
```

The `lcards.set_log_level` action sets it remotely on every browser (or targeted ones) and the Python logger too ([Home Assistant Actions](/configuration/ha-actions)).

### `getGlobalLogLevel()`

Returns the current level string.

```javascript
window.lcards.getGlobalLogLevel()
// → 'info'
```

---

## General Debug Utilities

These live on `window.lcards.debug`, set up in `src/lcards-main.js:243-322`.

### `perf`: Performance monitor

Shortcuts to the core performance monitor (`window.lcards.core.performanceMonitor`), which drives the frame guards of background animations.

| Property / Method | Description |
|---|---|
| `perf.fps()` | Current measured FPS, or `null` without a monitor |
| `perf.status()` | `{ fps, isMonitoring, settled, settleMs, consecutiveLow, lowRequiredCount, thresholds }` |
| `perf.thresholds` | Active thresholds `{ disable3D, reduceEffects }` (defaults 12 and 24 FPS, `PerformanceMonitor.js:19-22`) |

```javascript
window.lcards.debug.perf.fps()
window.lcards.debug.perf.status()
// → { fps: 60, isMonitoring: true, settled: true, settleMs: ..., thresholds: { disable3D: 12, reduceEffects: 24 }, ... }
```

### `theme`: Theme inspection

Shortcuts to `ThemeManager` state.

| Method | Description |
|---|---|
| `theme.current()` | Active theme object (id, name, tokens) |
| `theme.alertMode()` | Current alert mode name |
| `theme.list()` | All registered theme IDs |
| `theme.token(path, fallback?)` | Resolve a token path against the active theme |
| `theme.info()` | `ThemeManager.getDebugInfo()`: `{ initialized, activeTheme, availableThemes, resolverCacheSize, themeCount }` |

```javascript
window.lcards.debug.theme.alertMode()
// → 'green_alert'

window.lcards.debug.theme.token('colors.ui.primary')
// → 'var(--lcars-ui-primary, var(--lcards-gray-medium))'

window.lcards.debug.theme.list()
// → ['lcards-default', ...]   (plus any themes from packs)
```

Token values are often CSS variables, which stay live so alert modes recolour without a re-render. The only built-in theme is `lcards-default` (`src/core/packs/builtin-themes.js:22`); the token tree is [Theme System](../architecture/subsystems/theme-system.md).

### `webgl`: Shared WebGL context

Tools for the three.js background tier, which renders every WebGL background on one shared context (`src/lcards-main.js:250-279`).

| Method | Description |
|---|---|
| `await webgl.stats()` | Users of the shared context, the context, how many contexts were created (loads the three.js chunk if needed) |
| `webgl.frameStats(reset?)` | Background frame cost on this page: `{ cards, meanMsPerCardFrame, maxMs, perCard }`; `true` resets the counters after reading |
| `await webgl.loseContext()` | Simulates the browser dropping the context, to test the Canvas2D fallback |

Details: [Animation API: three.js background scenes](./anim-api#three-js-background-scenes).

---

## Core Systems Introspection

Snapshots of the `window.lcards.core.*` singletons. They live on `window.lcards.debug`, attached by `CoreDebugAPI.create()` during core initialization (`src/api/CoreDebugAPI.js`, `src/core/lcards-core.js:274-278`), and have nothing to do with MSD.

### `debug.core()`

Returns `window.lcards.core.getDebugInfo()` (`lcards-core.js:634-656`): the core's own state (initialized flag, card count and load order, pending cards) plus the snapshot of every manager in the table below.

```javascript
window.lcards.debug.core()
// → { coreInitialized: true, cardCount: 6, cardLoadOrder: [...], pendingCards: 0,
//     systemsManager: {...}, dataSourceManager: {...}, rulesManager: {...}, ..., hasHass: true }
```

### `debug.singleton(manager)`

Returns `getDebugInfo()` of one core singleton, by its property name on `window.lcards.core`. An unknown name returns `{ error, manager, available: [...] }` with the names that exist; a singleton without `getDebugInfo()` returns `{ error, manager, type }`.

```javascript
window.lcards.debug.singleton('dataSourceManager')
window.lcards.debug.singleton('animationManager')
window.lcards.debug.singleton('rulesManager')
```

**Singletons with a snapshot:**

| Manager | What the snapshot holds |
|---|---|
| `systemsManager` | Registered cards and overlays, entity state and subscription counts |
| `dataSourceManager` | Source count, entity index size, and each source's own debug info (entity, current value, buffer, processors, stats) |
| `rulesManager` | Rule count, dirty rules, evaluation counts, the entity/rule dependency index, recent matches and the trace |
| `animationManager` | Scope count, active and registered animation counts |
| `performanceMonitor` | Monitoring flag, current FPS, reference count, thresholds |
| `themeManager` | Active theme, available themes, resolver cache size |
| `stylePresetManager` | Loaded packs with their preset categories, cache size, presets by type |
| `assetManager` | Asset registries per type (SVG, fonts, ...) with their assets and pending loads |
| `packManager` | Loaded packs and their count |
| `soundManager` | Scheme count and names, audio cache size, helper option sync state |
| `componentManager` | Registered components, by type |
| `helperManager` | Subscription, watched helper and cached value counts, alert auto-switch state |
| `validationService` | Config, stats, cache sizes, available schemas |
| `configManager` | Processing stats and the registered card schemas and defaults |

The other singletons (`integrationService`, `scopedSettingsService`, `deviceIdentityManager`, `connectionOverlayService`, `screenEffectManager`, `borgAssimilationManager`, `portalOverlayManager`) have no `getDebugInfo()`: inspect them on `window.lcards.core` directly.

::: tip Full singleton API reference
`debug.singleton()` returns a lightweight stats snapshot. Each singleton has a subsystem page with all properties and methods:

[Systems Manager](../architecture/subsystems/systems-manager.md) · [DataSource System](../architecture/subsystems/datasource-system.md) · [Rules Engine](../architecture/subsystems/rules-engine.md) · [Theme System](../architecture/subsystems/theme-system.md) · [Animation Manager](../architecture/subsystems/animation-manager.md) · [Pack System](../architecture/subsystems/pack-system.md) · [Asset Manager](../architecture/subsystems/asset-manager.md) · [Component Manager](../architecture/subsystems/component-manager.md) · [Style Preset Manager](../architecture/subsystems/style-preset-manager.md) · [Helper Manager](../architecture/subsystems/helper-manager.md) · [Sound System](../architecture/subsystems/sound-system.md) · [Validation Service](../architecture/subsystems/validation-service.md)
:::

### `debug.singletons()`

Lists the singletons that have `getDebugInfo()`.

```javascript
window.lcards.debug.singletons()
// → { managers: ['systemsManager', 'dataSourceManager', ...], count: 14, coreInitialized: true }
```

### `debug.datasources`

DataSource introspection (`src/api/DataSourceDebugAPI.js`): `list()`, `get(name)`, `listProcessors(dsName)`, `showProcessorGraph(dsName)`, `inspectProcessor(dsName, processorName)`, `validate(dsName)`, `getStats(dsName)` and `help()`. Each method is described in [DataSource System: Debug Namespace](../architecture/subsystems/datasource-system.md#debug-namespace-window-lcards-debug-datasources).

```javascript
window.lcards.debug.datasources.list()
window.lcards.debug.datasources.getStats('temp_sensor')
```

---

## Other Console APIs

**These live on the root `window.lcards` namespace** (`src/lcards-main.js` unless noted). Most are documented on the page of their feature.

| API | Description |
|---|---|
| `version` | The frontend version string |
| `info()` | Runtime snapshot (above) |
| `support.collect(opts?)`, `report(opts?)`, `copy(opts?)`, `openIssue(opts?)` | Support info for bug reports; `{ includeConfig: true }` adds data source names and entity IDs. See [Getting Help](/getting-started/getting-help#other-ways-to-collect-info) |
| `await refreshOptions()` | Re-reads the integration options (`lcards/info`) after changing them, without a reload |
| `alert.set(mode)`, `get()`, `red()`, `yellow()`, `blue()`, `gray()`, `black()`, `green()`, `off()`, `borg(opts?)` | Alert mode control. See [Alert Mode: From the browser console](/core/alert-mode#from-the-browser-console) |
| `alert.config` (also `alertConfig`) | Alert colour transforms: `setParam(mode, parameter, value, applyNow?)`, `getTransform(mode)`, `reset(mode, applyNow?)`, `resetAll(applyNow?)`, `export()`, `import(overrides)` |
| `setAlertMode(mode)`, `getAlertMode()`, `redAlert()`, `yellowAlert()`, `blueAlert()`, `grayAlert()`, `blackAlert()`, `greenAlert()`, `normalAlert()` | Older root shortcuts for the same |
| `borg.assimilate(opts?)`, `deassimilate(opts?)`, `status` | The Borg effect. See [Borg: Console API](/core/borg#console-api) |
| `screenEffect.apply()`, `play()`, `applySlot()`, `clearSlot()`, `clear()`, `registerPreset()`, `getPreset()`, `catalog()`, `list()` | Full-screen effects. See [Screen Effect System: Console API](../architecture/subsystems/screen-effects.md#console-api) |
| `connectionOverlay.show()`, `showWith()`, `hide()`, `simulateReconnect()`, `getConfig()`, `saveConfig()`, `clearConfig()`, `loadConfig()` | The connection-lost overlay. See [Connection Overlay: Console API](../architecture/subsystems/connection-overlay.md#console-api) |
| `sound.play(eventType, ctx?)`, `playAsset(assetKey)`, `preview(assetKey)`, `getSchemes()`, `getEvents()` | Sound system. `play` goes through the event's mapping and the enable switches; `playAsset` and `preview` play one asset key |
| `targeting.getMyIds()` | `{ deviceId, userId }` of this browser, for the targeting fields of the `lcards.*` actions ([Backend API: Targeting](./backend-api#targeting)) |
| `loadAlertPreview()` | Lazy-loads the `lcards-alert-preview` element (the Alert Studio's mock screen; the docs site mounts it) |
| `findCardByConfig(config)` | The connected LCARdS card rendered from this config object (the editor's Provenance tab uses it) |
| `anim.*` and the root aliases `anime`, `animejs`, `animateElement`, `waitForElement` | Animation helpers. See [Animation API](./anim-api) |
| `svgHelpers`, `anchorHelpers`, `findSvgAnchors`, `loadFont`, `loadUserSVG`, `getSVGFromCache` | Asset helpers. See [Assets API](./assets-api) |
| `setGlobalLogLevel()`, `getGlobalLogLevel()` | The [log level](#log-level) |
| `core` | The core singleton: `window.lcards.core.themeManager`, `.dataSourceManager`, ... |
| `theme`, `styleResolver`, `animationManager` | Shortcuts to `core.themeManager`, `core.stylePresetManager` and `core.animationManager` (the last set by `AnimationManager.js:505-509`) |
| `cards.msd` | MSD card lookup, below |

---

## MSD Card API (`window.lcards.cards.msd`)

Production utilities for finding MSD card elements by their config `id` (`src/msd/index.js:36-90`). They work in normal use, not just in debug sessions.

| Method | Returns | Description |
|---|---|---|
| `getAll()` | `Element[]` | All MSD card elements registered with `SystemsManager` |
| `getById(id)` | `Element\|null` | The MSD card element whose config `id` matches, or `null` |

```javascript
window.lcards.cards.msd.getAll()
window.lcards.cards.msd.getById('bridge')

// Inspect any card's pipeline
const card = window.lcards.cards.msd.getById('bridge')
card._msdPipeline?.getResolvedModel()?.overlays
```

---

## MSD Debug Namespace (`debug.msd`)

Introspection tools for MSD cards (`src/api/MsdDebugAPI.js`, attached by `src/msd/index.js:96-100`).

- **`cardId`.** Every method that takes an optional `cardId` means the card's config `id` (for example `'bridge'`); without it the first MSD card on the page is used. `listMsdCards()` shows the IDs.
- **Discover the API in the console:**

```javascript
window.lcards.debug.msd.help()           // list all namespaces
window.lcards.debug.msd.help('routing')  // the methods of one namespace
window.lcards.debug.msd.usage('data')    // usage examples for a namespace
```

### Root Methods

| Method | Description |
|---|---|
| `help(topic?)` | All namespaces, or the methods of one |
| `usage(namespace?)` | Usage examples |
| `listMsdCards()` | `[{ id, systemId, hasConfig, hasPipeline, overlayCount, routingChannels, element }]` for every MSD card |

```javascript
window.lcards.debug.msd.listMsdCards()
```

For singleton manager introspection, see [Core Systems Introspection](#core-systems-introspection) above.

### `routing`: Routing resolution

| Method | Description |
|--------|-------------|
| `inspect(overlayId, cardId?)` | The overlay's routed points and path, read from the route cache: `{ pts, d, meta, cacheKey }`. `meta.debug` holds the resolved `stubLength`, `gridResolution`, `cornerRadiusMode` and `cornerRadius`. It never computes or changes routing state |
| `inspectAll(cardId?)` | Like `inspect()`, for every overlay in the route cache at once |
| `trunks(cardId?)` | Every trunk row (configured and discovered) with its bounds, centerline and members |
| `stats(cardId?)` | Router statistics: cache size, obstacle count, trunk and crossing registry counts, registry version |
| `invalidate(id?, cardId?)` | Invalidate the cached route of one overlay (`'*'`, the default, for all) |

```javascript
window.lcards.debug.msd.routing.inspect('line-id')
window.lcards.debug.msd.routing.inspectAll()
console.table(window.lcards.debug.msd.routing.trunks('bridge'))
window.lcards.debug.msd.routing.stats()
```

### `data`: DataSource state

| Method | Description |
|--------|-------------|
| `trace(entityId, cardId?)` | Trace an entity's data through DataSources to the overlays that use it |

```javascript
window.lcards.debug.msd.data.trace('sensor.temperature')
```

For DataSources in general, use [`window.lcards.debug.datasources`](#debug-datasources).

### `rules`: Rules engine

| Method | Description |
|--------|-------------|
| `listActive(options?, cardId?)` | The card's active rules; `{ includeDisabled: true, verbose: true }` for all of them in detail |

```javascript
window.lcards.debug.msd.rules.listActive()
window.lcards.debug.msd.rules.listActive({ includeDisabled: true, verbose: true })
```

For the rules engine itself, use `window.lcards.debug.singleton('rulesManager')`.

### `animations`: Animation state

| Method | Description |
|--------|-------------|
| `active(cardId?)` | Currently running animations |
| `dump(cardId?)` | The full animation state |
| `inspect(overlayId, cardId?)` | The animations of one overlay |
| `trigger(overlayId, presetName, params?, cardId?)` | Run an animation preset on an overlay, for testing |

```javascript
window.lcards.debug.msd.animations.active()
window.lcards.debug.msd.animations.inspect('cpu_status')
window.lcards.debug.msd.animations.trigger('cpu_status', 'pulse', { duration: 500 })
```

### `overlays`: Overlay inspection

| Method | Description |
|--------|-------------|
| `inspect(id, cardId?)` | Full overlay inspection |
| `getBBox(id, cardId?)` | The overlay's bounding box |
| `getTransform(id, cardId?)` | The overlay's transform |
| `getState(id, cardId?)` | The overlay's current state |
| `findByType(type, cardId?)` | Overlays of one type |
| `findByEntity(entityId, cardId?)` | Overlays bound to an entity |
| `tree(cardId?)` | The resolved overlays grouped by type |
| `list(cardId?)` | All overlays |

```javascript
window.lcards.debug.msd.overlays.list()
window.lcards.debug.msd.overlays.tree('bridge')
window.lcards.debug.msd.overlays.findByEntity('sensor.temperature')
```

### `pipeline`: Pipeline lifecycle

| Method | Description |
|--------|-------------|
| `stages(cardId?)` | The pipeline stages |
| `timing(cardId?)` | Pipeline execution timing |
| `config(cardId?)` | The pipeline's config |
| `errors(cardId?)` | Pipeline errors |
| `rerun(cardId?)` | Run the pipeline again |
| `getInstance(cardId?)` | The pipeline instance itself |

```javascript
window.lcards.debug.msd.pipeline.stages()
window.lcards.debug.msd.pipeline.getInstance('bridge')
window.lcards.debug.msd.pipeline.rerun()
```

### `anchors`: Anchor system

| Method | Description |
|--------|-------------|
| `getAll(cardId?)` | All anchors of the resolved model, `{ name: [x, y] }` |
| `get(name, cardId?)` | One anchor's `[x, y]`, or `null` |
| `trace(cardId?)` | Where the anchors sit at each pipeline stage (card model, resolved model, ...) |
| `list(cardId?)` | All anchor names |
| `print(cardId?)` | A formatted anchor summary |

```javascript
window.lcards.debug.msd.anchors.list()
window.lcards.debug.msd.anchors.trace()
```

---

## See Also

- [DataSource System](../architecture/subsystems/datasource-system.md)
- [Systems Manager](../architecture/subsystems/systems-manager.md)
- [Rules Engine](../architecture/subsystems/rules-engine.md)
- [Testing](./testing): test layers for turning a console finding into a test
