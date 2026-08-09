---
applyTo: "src/core/data-sources/**, src/cards/**"
---

# LCARdS DataSource System Rules

---

## What is a DataSource?

A DataSource wraps a single HA entity subscription with optional:
- **History** — a rolling window of past values
- **Processing** — named processor pipeline (`smooth`, `scale`, `convert_unit`, `threshold`, etc. — see `processing:` below; the older `transformations`/`aggregations` config keys are rejected at runtime)
- **Polling interval** — override the default HA push update rate
- **Coalescing** — debounce rapid updates before notifying subscribers

DataSources are identified by a string `name` that is unique within the `DataSourceManager`. Multiple cards can share the same DataSource — the manager deduplicates by name.

---

## Declaring DataSources in Card Config

The simplest way is the `data_sources:` key in card YAML. `LCARdSCard._processConfigAsync()` creates them automatically:

```yaml
type: custom:lcards-chart
data_sources:
  cpu_temp:
    entity: sensor.cpu_temperature
    periodic_update_interval: 5000   # ms between periodic polls (default 1000)
    history: { enabled: true, hours: 6 }  # rolling history preload window
    windowSeconds: 3600               # in-memory buffer window (camelCase)
    minEmitMs: 250                    # minimum ms between subscriber calls
    coalesceMs: 120                   # debounce window
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
// data emitted to subscribers (getCurrentData() returns the same shape)
{
  t: 1713340800000,   // timestamp ms since epoch
  v: 42.7,             // current value (number, string, or object depending on entity)
  buffer: RollingBuffer, // rolling history buffer instance — not a plain array; use its methods, e.g. buffer.last()
  stats: { ... },       // internal counters, incl. historyLoaded
  processing: { ... },  // named processor outputs, keyed by processor name from `processing:` config
  entity: 'sensor.cpu_temperature',
  unit_of_measurement: '°C',
  historyReady: true    // true once history preload has loaded at least one point
}
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
