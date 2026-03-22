# Debug API

Browser console tools for LCARdS development, accessed via `window.lcards.debug`.

::: tip Runtime snapshot
```javascript
window.lcards.info()   // prints version, build date, log level, core status
```
:::

::: tip URL log level override
Append `?lcards_log_level=debug` (or `trace`) to the HA URL to set the log level before the page fully loads — useful for catching early init errors.
:::

---

## General Debug Utilities

### `setLevel(level)` — Log level

Sets the global log level for all LCARdS output.

```javascript
window.lcards.debug.setLevel('error')   // errors only
window.lcards.debug.setLevel('warn')
window.lcards.debug.setLevel('info')    // default
window.lcards.debug.setLevel('debug')
window.lcards.debug.setLevel('trace')   // maximum verbosity
```

> Also available as `window.lcards.setGlobalLogLevel(level)` for backward compatibility.

### `getLevel()` — Current log level

Returns the current global log level string.

```javascript
window.lcards.debug.getLevel()
// Returns: 'info'
```

### `perf` — Performance monitor

Shortcuts to the internal performance monitor.

| Property / Method | Description |
|---|---|
| `perf.fps()` | Current measured FPS |
| `perf.status()` | Full status object |
| `perf.thresholds` | Active threshold config `{ disable3D, reduceEffects }` |

```javascript
window.lcards.debug.perf.fps()
window.lcards.debug.perf.status()
// { fps: 60, isMonitoring: true, settled: true, thresholds: { ... }, ... }
```

> **Note:** `window.lcards.perf` no longer exists — use `window.lcards.debug.perf`.

### `theme` — Theme inspection

Shortcuts to `ThemeManager` state.

| Method | Description |
|---|---|
| `theme.current()` | Active theme object (id, name, tokens) |
| `theme.alertMode()` | Current alert mode name |
| `theme.list()` | All registered theme IDs |
| `theme.token(path, fallback?)` | Resolve a token path against the active theme |
| `theme.info()` | Full `ThemeManager.getDebugInfo()` snapshot |

```javascript
window.lcards.debug.theme.alertMode()
// → 'red_alert'

window.lcards.debug.theme.token('colors.accent.primary')
// → '#7EB6E8'

window.lcards.debug.theme.list()
// → ['lcards-default', 'lcars-ds9', ...]
```

---

## Other Console APIs

These live on the root `window.lcards` namespace rather than `debug.*`:

| API | Description |
|---|---|
| `window.lcards.info()` | Runtime snapshot — version, build date, log level, core status |
| `window.lcards.alert.*` | Alert mode control — see [Alert Mode](../core/alert-mode.md) |
| `window.lcards.sound.*` | Sound system debug — `play(event)`, `preview(assetKey)`, `getSchemes()`, `getEvents()` |

---

## Core Systems Introspection

Introspect the `window.lcards.core.*` singleton registry directly. These live on `window.lcards.debug` (wired by `CoreDebugAPI` at core init time) and have nothing to do with MSD.

### `debug.core()`

Returns `window.lcards.core.getDebugInfo()` — a snapshot of all core manager states.

```javascript
window.lcards.debug.core()
// → { systemsManager: {...}, dataSourceManager: {...}, rulesManager: {...}, ... }
```

### `debug.singleton(manager)`

Returns `getDebugInfo()` for a specific core singleton by name.

```javascript
window.lcards.debug.singleton('dataSourceManager')
window.lcards.debug.singleton('animationManager')
window.lcards.debug.singleton('rulesManager')
```

**Valid names:**

| Manager | What it tells you |
|---|---|
| `systemsManager` | Entity subscriptions, overlay registry |
| `dataSourceManager` | Active sources, buffer sizes, subscribers |
| `rulesManager` | Active rules, last evaluation results |
| `animationManager` | Active animations, registry stats |
| `themeManager` | Active theme, registered tokens |
| `stylePresetManager` | Loaded presets, pack contributions |
| `assetManager` | Loaded SVGs, font status |
| `packManager` | Loaded packs, load order |
| `soundManager` | Active scheme, event bindings |
| `componentManager` | Registered SVG components |
| `helperManager` | Helper entity states |
| `validationService` | Validation rule cache |

::: tip Full singleton API reference
`debug.singleton()` returns a lightweight stats snapshot. Each singleton has a dedicated subsystem doc with all properties and methods:

[Systems Manager](../architecture/subsystems/systems-manager.md) · [DataSource System](../architecture/subsystems/datasource-system.md) · [Rules Engine](../architecture/subsystems/rules-engine.md) · [Theme System](../architecture/subsystems/theme-system.md) · [Animation Manager](../architecture/subsystems/animation-manager.md) · [Pack System](../architecture/subsystems/pack-system.md) · [Asset Manager](../architecture/subsystems/asset-manager.md) · [Component Manager](../architecture/subsystems/component-manager.md) · [Style Preset Manager](../architecture/subsystems/style-preset-manager.md) · [Helper Manager](../architecture/subsystems/helper-manager.md) · [Sound System](../architecture/subsystems/sound-system.md) · [Validation Service](../architecture/subsystems/validation-service.md)
:::

### `debug.singletons()`

Lists all managers that expose `getDebugInfo()` and returns a combined snapshot.

```javascript
window.lcards.debug.singletons()
// → { managers: ['systemsManager', 'animationManager', ...], count: 12, coreInitialized: true }
```

---

## MSD Card API (`window.lcards.cards.msd`)

Production utilities for locating MSD card elements by config ID. These work in normal use — not just debug sessions.

| Method | Returns | Description |
|---|---|---|
| `getAll()` | `Element[]` | All MSD card elements registered with `SystemsManager` |
| `getById(id)` | `Element\|null` | MSD card element whose config `id` matches, or `null` |

```javascript
window.lcards.cards.msd.getAll()
window.lcards.cards.msd.getById('bridge')

// Inspect any card's pipeline
const card = window.lcards.cards.msd.getById('bridge')
card._msdPipeline?.getResolvedModel()?.overlays
```

---

## MSD Debug Namespace (`debug.msd`)

Introspection tools for MSD cards, accessed via `window.lcards.debug.msd`.

::: tip Discover the API in the console
```javascript
window.lcards.debug.msd.help()           // list all namespaces
window.lcards.debug.msd.help('routing')  // show methods in a namespace
window.lcards.debug.msd.usage('data')    // show usage examples for a namespace
```
:::

---

## Root Methods

### `help([topic])`

Prints all available namespaces (no args) or the methods in a specific namespace.

### `usage([namespace])`

Shows detailed usage examples for a namespace.

### `listMsdCards()`

Lists all MSD cards registered with SystemsManager.

```javascript
window.lcards.debug.msd.listMsdCards()
// Returns: [{ id, systemId, hasConfig, hasPipeline, overlayCount, routingChannels, element }]
```

> For singleton manager introspection, see [Core Systems Introspection](#core-systems-introspection) above.

---

## Namespaces

All namespace methods are called as `window.lcards.debug.msd.<namespace>.<method>()`.

### `routing` — Routing resolution

| Method | Description |
|--------|-------------|
| `inspect(overlayId, cardId?)` | Inspect routing resolution for an overlay |
| `stats(cardId?)` | Routing statistics |
| `invalidate(id, cardId?)` | Invalidate cached routing for an overlay |
| `inspectAs(overlayId, mode, cardId?)` | Inspect routing as a specific mode |
| `visualize(overlayId)` | Visualize routing (not yet implemented) |

```javascript
window.lcards.debug.msd.routing.inspect('my_overlay')
window.lcards.debug.msd.routing.stats()
```

### `data` — DataSource state

| Method | Description |
|--------|-------------|
| `trace(entityId, cardId?)` | Trace data flow for an entity through DataSource → overlay |

```javascript
window.lcards.debug.msd.data.trace('sensor.temperature')
```

> For broader DataSource introspection, use `window.lcards.debug.datasources.*`.

### `rules` — Rules engine

| Method | Description |
|--------|-------------|
| `listActive(options?, cardId?)` | List currently active/enabled rules |

```javascript
window.lcards.debug.msd.rules.listActive()
window.lcards.debug.msd.rules.listActive({ includeDisabled: true, verbose: true })
```

> For full rules engine introspection, use `window.lcards.debug.singleton('rulesManager')`.

### `animations` — Animation state

| Method | Description |
|--------|-------------|
| `active()` | List currently active animations |
| `dump()` | Dump full animation state |
| `registryStats()` | Animation registry statistics |
| `inspect(id)` | Inspect a specific animation instance |
| `timeline(id)` | Show timeline details for an animation |
| `trigger(id)` | Manually trigger an animation |

```javascript
window.lcards.debug.msd.animations.active()
window.lcards.debug.msd.animations.inspect('my_anim_id')
```

### `overlays` — Overlay inspection

| Method | Description |
|--------|-------------|
| `inspect(id)` | Full overlay inspection |
| `getBBox(id)` | Get bounding box for an overlay |
| `getTransform(id)` | Get transform info for an overlay |
| `getState(id)` | Get current state of an overlay |
| `findByType(type)` | Find overlays by type |
| `findByEntity(entityId)` | Find overlays bound to an entity |
| `tree()` | Show overlay hierarchy tree |
| `list()` | List all overlays |

```javascript
window.lcards.debug.msd.overlays.list()
window.lcards.debug.msd.overlays.findByEntity('sensor.temperature')
```

### `pipeline` — Pipeline lifecycle

| Method | Description |
|--------|-------------|
| `stages(cardId?)` | Show pipeline stages |
| `timing(cardId?)` | Pipeline execution timing |
| `config(cardId?)` | Pipeline configuration |
| `errors(cardId?)` | Pipeline errors |
| `rerun(cardId?)` | Force pipeline re-execution |
| `getInstance(cardId?)` | Get pipeline instance reference |

```javascript
window.lcards.debug.msd.pipeline.stages()
window.lcards.debug.msd.pipeline.rerun()
```

### `anchors` — Anchor system

| Method | Description |
|--------|-------------|
| `getAll(cardId?)` | Get all anchors |
| `get(anchorId, cardId?)` | Get a specific anchor |
| `trace(anchorId, cardId?)` | Trace anchor resolution |
| `list(cardId?)` | List all anchor IDs |
| `print(cardId?)` | Print formatted anchor summary |

```javascript
window.lcards.debug.msd.anchors.list()
window.lcards.debug.msd.anchors.trace('my_anchor')
```

---

## See Also

- [DataSource System](../architecture/subsystems/datasource-system.md)
- [Systems Manager](../architecture/subsystems/systems-manager.md)
- [Rules Engine](../architecture/subsystems/rules-engine.md)
