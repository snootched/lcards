---
applyTo: "src/core/data-sources/**, src/cards/**"
---

# LCARdS DataSource System Rules

---

## What is a DataSource?

A DataSource wraps a single HA entity subscription with optional:
- **History** — a rolling window of past values
- **Processing** — named processor pipeline (`smooth`, `scale`, `convert_unit`, `threshold`, etc. — see `processing:` below; the older `transformations`/`aggregations` config keys are rejected at runtime)
- **Emit throttle**: `min_emit_ms` / `coalesce_ms` / `max_delay_ms` / `emit_on_same_value` shape when subscribers are called (leading emit after a quiet spell, one trailing emit with the latest value for a burst); the buffer and processors still record every value
- **Periodic refresh**: `periodic_update_interval` re-emits the last value for `duration` processors

DataSources are identified by a string `name` that is unique within the `DataSourceManager`. Multiple cards can share the same DataSource — the manager deduplicates by name.

---

## Declaring DataSources in Card Config

The simplest way is the `data_sources:` key in card YAML. `LCARdSCard._processConfigAsync()` creates them automatically:

```yaml
type: custom:lcards-chart
data_sources:
  cpu_temp:
    entity: sensor.cpu_temperature
    periodic_update_interval: 5000   # ms between re-emits, only with a duration processor (default 1000)
    history: { enabled: true, hours: 6 }  # rolling history preload window
    window_seconds: 3600              # in-memory buffer window
    min_emit_ms: 250                  # minimum ms between subscriber calls (default 100)
    coalesce_ms: 120                  # wait after the last change of a burst (default 40% of min_emit_ms)
    max_delay_ms: 500                 # longest a change waits for its emit (default 3 x coalesce_ms)
    processing:
      smoothed:
        type: smooth
        method: moving_average
        window: 10
  power_usage:
    entity: sensor.power_usage
    history: { hours: 1 }
```

`transformations:`/`aggregations:` (the old config format) are rejected at construction time — `DataSource.js` throws if either key is present, with an error message pointing at the replacement `processing:` field shown above.

The `name` key (`cpu_temp`, `power_usage`) is the ID you use in templates and subscriptions.

Timing keys are snake_case. The camelCase spellings (`windowSeconds`, `minEmitMs`, `sampleMs`, `coalesceMs`, `maxDelayMs`, `emitOnSameValue`) are still read for old configs but deprecated; never write them in new code, docs or examples.

The throttle lives in `DataSource._queueEmit()` / `_flushEmit()`. Subscriber callbacks can be fewer than state changes: when every point matters, read `data.buffer` or a processor buffer instead of counting callbacks. Initial emission, `subscribe()` hydration and periodic updates are not throttled.

---

## Accessing DataSources in Cards

```javascript
// Get the manager singleton
const dsManager = this._singletons?.dataSourceManager
               || window.lcards?.core?.dataSourceManager;

// Get a source by name
const source = dsManager.getSource('cpu_temp');
if (!source) return; // not yet created

// Subscribe — returns an unsubscribe function
const unsubscribe = source.subscribe((data) => {
  // data.v — current value
  // data.t — timestamp (ms)
  // data.buffer — RollingBuffer instance (not a plain array) holding history
  this._currentTemp = data.v;
  this.requestUpdate();
});

// Store unsubscribe for cleanup
this._datasourceSubscriptions.set('cpu_temp', unsubscribe);
```

DataSource subscriptions are auto-cleaned by `LCARdSCard._onDisconnected()` via `this._datasourceSubscriptions`. Do **not** manually call the unsubscribe in `_onDisconnected()` — that causes double-cleanup.

---

## Programmatic Creation

If you need to create a DataSource without the config key (e.g. dynamically from user interaction):

```javascript
const source = await dsManager.createDataSource(
  'my_source',           // name (must be unique)
  {
    entity: 'sensor.temperature',
    periodic_update_interval: 10000,
    history: { hours: 1 }
  },
  this._getDisplayId(),  // cardId for tracking
  false                  // autoCreated = false (explicitly configured)
);
```

`createDataSource()` is idempotent — if the name already exists it returns the existing source and adds `cardId` to its dependency set.

When the last card leaves a source (`removeCardFromSource()`, called by `LCARdSCard._onDisconnected()`), the manager stops and removes it after `SOURCE_RELEASE_DELAY_MS` (30 s) unless a card asks for the name again first, the name was ever requested without a `cardId` (MSD/config sources are never released), or something else still subscribes to it. So: always unsubscribe what you subscribe, and pass a `cardId` only for sources a card owns.

---

## Using DataSources in Templates

Reference them in any template string evaluated by `UnifiedTemplateEvaluator`:

```
{datasource:cpu_temp}            — current value as string
{datasource:cpu_temp:.1f}°C     — formatted float
{datasource:cpu_temp:.0f}%      — formatted int
{ds:cpu_temp}                    — short alias
```

The evaluator resolves these synchronously via `dataSource.getCurrentData()`. If the source has no value yet, the token evaluates to the empty string.

---

## DataSource Data Shape

```javascript
// data emitted to subscribers (_buildEmitData)
{
  t: 1713340800000,   // timestamp ms since epoch (arrival time)
  v: 42.7,             // current value, always a number (non-numeric states are skipped or enum_mapping'd)
  buffer: RollingBuffer, // rolling history buffer instance, not a plain array; use its methods, e.g. buffer.last()
  stats: { ... },       // counters: received, invalid, updates, emits, coalesced, skipsSameValue, historyLoaded, ...
  processing: { ... },  // named processor outputs, keyed by processor name from `processing:` config
  entity: 'sensor.cpu_temperature',
  unit_of_measurement: '°C',
  historyReady: true    // true once history preload has loaded at least one point
}
// initial emission adds isInitialEmission: true; periodic updates add isPeriodicUpdate: true
```

`getCurrentData()` returns `t`, `v`, `buffer`, `stats`, `processing`, `entity`, `historyReady` plus `metadata` (copy of the entity metadata: `unit_of_measurement`, `device_class`, `friendly_name`, ...), `bufferSize` and `started`. It has **no** top-level `unit_of_measurement`: read `getCurrentData().metadata.unit_of_measurement` (or `source.getMetadata()`).

```javascript
```

---

## Inspecting DataSources (Browser Console)

```javascript
// See all registered sources
window.lcards.core.dataSourceManager.sources

// Get a specific source
window.lcards.core.dataSourceManager.getSource('cpu_temp')

// Inspect its current value, history, config
const s = window.lcards.core.dataSourceManager.getSource('cpu_temp');
s.getCurrentData(); s.cfg; s.buffer;

// Which cards use which sources
window.lcards.core.dataSourceManager._sourceToCards
```

---

## Anti-patterns

❌ Don't call `source.subscribe()` inside `_renderCard()` — subscriptions accumulate on every render
❌ Don't manually unsubscribe in `_onDisconnected()` if you stored the function in `this._datasourceSubscriptions` — the base class handles it
❌ Don't use `dsManager.sources` to iterate all sources for a single card's data — use `getSource(name)` directly
❌ Don't create DataSources with `autoCreated = true` from card code — that flag is reserved for the pipeline's automatic entity-to-source promotion
❌ Don't assume the source exists immediately after calling `createDataSource()` with `await` — the first data push is asynchronous (HA subscription or poll cycle is pending)
