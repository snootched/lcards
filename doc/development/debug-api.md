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

### `core()`

Returns debug info from `window.lcards.core.getDebugInfo()`.

### `singleton(manager)`

Returns debug info for a specific core singleton, e.g. `singleton('dataSourceManager')`.

### `singletons()`

Lists all singleton managers that expose a `getDebugInfo()` method.

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
| `stats()` | DataSource statistics |
| `list()` | List all active DataSources |
| `get(sourceName)` | Get a specific DataSource instance |
| `dump()` | Dump all DataSource data |
| `trace(entityId, cardId?)` | Trace data flow for an entity (not yet implemented) |
| `history(entityId, n)` | Get history for an entity (not yet implemented) |

```javascript
window.lcards.debug.msd.data.list()
window.lcards.debug.msd.data.get('sensor_temp')
```

### `styles` — Style resolution

| Method | Description |
|--------|-------------|
| `resolutions(overlayId)` | Show style token resolutions for an overlay |
| `findByToken(tokenPath)` | Find overlays using a specific token |
| `provenance()` | Show style provenance information |
| `listTokens()` | List all registered style tokens |
| `getTokenValue(tokenPath)` | Get the current value of a style token |

```javascript
window.lcards.debug.msd.styles.resolutions('my_overlay')
window.lcards.debug.msd.styles.findByToken('palette.alert-red')
```

### `charts` — Chart configuration

| Method | Description |
|--------|-------------|
| `validate(guid)` | Validate chart config for an overlay |
| `validateAll()` | Validate all chart configurations |
| `getFormatSpec(guid)` | Get the format specification for a chart overlay |
| `listTypes()` | List all registered chart types |

### `rules` — Rules engine

| Method | Description |
|--------|-------------|
| `trace(overlayId?)` | Trace rule evaluation |
| `evaluate(overlayId?)` | Evaluate rules and return results |
| `listActive(options?)` | List currently active rules |
| `debugRule(ruleId)` | Debug a specific rule |

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

### `packs` — Pack management

| Method | Description |
|--------|-------------|
| `list()` | List all registered packs |
| `get(packId)` | Get details for a specific pack |
| `issues(packId?)` | Show issues with pack(s) |
| `order()` | Show pack load order |

### `visual` — Visual debugging

| Method | Description |
|--------|-------------|
| `enable()` | Enable visual debug mode |
| `disable()` | Disable visual debug mode |
| `toggle()` | Toggle visual debug mode |
| `status()` | Current visual debug status |
| `getActive()` | Get active visual debug elements |
| `refresh()` | Refresh visual debug state |

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

- [DataSources Debug API](datasources-api.md)
- [Runtime API](runtime-api.md)
- [Systems Manager](../architecture/subsystems/systems-manager.md)
- [Rules Engine](../architecture/subsystems/rules-engine.md)
