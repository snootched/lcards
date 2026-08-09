# DataSource System

> **`window.lcards.core.dataSourceManager`** — Named entity data buffers with history and processing pipelines.

---

## Overview

`DataSourceManager` extends `BaseService` and manages a collection of named `DataSource` instances. Each source subscribes to a single HA entity, records a rolling value history, runs processor pipelines, and notifies subscribers on every update.

Cards never talk to HA entity state directly for data — they declare data sources in config and subscribe to the manager.

---

## Key Classes

| Class | File | Role |
|---|---|---|
| `DataSourceManager` | `core/data-sources/DataSourceManager.js` | Lifecycle, card registration, entity index |
| `DataSource` | `core/data-sources/DataSource.js` | Single entity subscription, buffer, processor chain |
| `RollingBuffer` | `core/data-sources/RollingBuffer.js` | Fixed-size circular value history |
| `ProcessorManager` | `core/data-sources/ProcessorManager.js` | Runs processor chain; writes keyed output buffers |

---

## Data Object Structure

Every subscriber callback receives:

```javascript
{
  t: 1707580800000,          // Timestamp (ms)
  v: 72.5,                   // Raw entity state value (main buffer)
  buffer: RollingBuffer,     // Reference to the main value-history buffer
  stats: { updates, lastUpdate, ... },
  entity: 'sensor.temperature',
  unit_of_measurement: '°F',
  historyReady: true,        // Whether history preload has completed
  processing: {
    celsius: 22.5,           // Processor output, keyed by its name in `processing:`
    rolling_avg: 71.8,       // Another processor output
  },
}
```

Processor outputs are nested under `processing`, not spread onto the top level of the emitted object.

---

## Config Schema

```yaml
data_sources:
  temp_sensor:
    entity: sensor.temperature
    update_interval: 5000       # throttle, in MILLISECONDS (0–10000); default 100
    history: { hours: 6 }       # historical preload window (hours: 1–168, or days: 1–7)
    processing:                 # named map, not a list — each key is the processor's name
      celsius:
        type: convert_unit
        from: fahrenheit
        to: celsius
      rolling_avg:
        type: smooth
        method: exponential
        alpha: 0.3
```

---

## Processors Reference

| Type | Key field | Output |
|---|---|---|
| `convert_unit` | custom | Converted numeric value |
| `smooth` | custom | Smoothed value (exponential, moving average, or gaussian) |
| `rate` | custom | Rate of change per second |
| `delta` | custom | Difference from previous value |
| `round` | custom | Rounded to N decimal places |
| `scale` | custom | Linear scale (min→max mapping) |
| `clamp` | custom | Value clamped to [min, max] |
| `threshold` | custom | Boolean: value above threshold |
| `trend` | custom | `"rising"` / `"falling"` / `"stable"` |
| `statistics` | custom | `{ min, max, avg, stddev }` object |
| `duration` | custom | Duration entity formatted string |
| `expression` | custom | Arbitrary JS expression result |

## Processor Execution Order & Chaining

Processors run in **dependency order**, not config order. `ProcessorManager` performs a topological sort (Kahn's algorithm) at initialization. The resolved execution order is logged at `debug` level on startup.

Each processor declares its input via `input_source`:
- **No `input_source`**: processor reads from the raw entity value pushed by HA
- **`input_source: other_key`**: processor reads from the *output* of the named processor

A processor only ever sees one input — either the raw entity value or the output of its `input_source` target. Processors with no shared dependencies run in an unspecified order relative to each other; only declared chains are ordered.

**Circular dependencies throw at initialization** — the DataSource will fail to configure.

```yaml
data_sources:
  temp_sensor:
    entity: sensor.outdoor_temp
    processing:
      # Step 1 — reads raw entity value (no input_source)
      celsius:
        type: convert_unit
        from: f
        to: c

      # Step 2 — reads output of 'celsius' processor
      smoothed:
        type: smooth
        input_source: celsius
        method: moving_average
        window: 5

      # Step 3 — reads output of 'smoothed'
      display:
        type: round
        input_source: smoothed
        precision: 1
```

> `convert_unit`'s own `from`/`to` fields are unit codes, not dependency references — don't confuse them with the chaining `input_source` field above. This double-use of the word "from" is a real overload in the underlying processor config, not a documentation inconsistency.

Access each stage in templates: `{ds:temp_sensor.celsius}`, `{ds:temp_sensor.smoothed}`, `{ds:temp_sensor.display}`.

---

## Card Usage

```javascript
// In _handleFirstUpdate():
const dsm = window.lcards.core.dataSourceManager;
await dsm.initializeFromConfig(this.config.data_sources || {});

const source = dsm.getSource('temp_sensor');
this._unsubscribe = source.subscribe((data) => {
  this._temp = data.processing.celsius;  // processor outputs live under data.processing
  this.requestUpdate();
});

// In disconnectedCallback():
if (this._unsubscribe) this._unsubscribe();
```

---

## Template Access

```yaml alternatives
text: "{ds:temp_sensor}"                   # HA-native: locale-formatted + unit
text: "{ds:temp_sensor.celsius:.1f}"       # processor buffer: 1 decimal, no auto-unit
text: "{ds:temp_sensor.celsius:.1f} °C"   # explicit unit suffix
text: "{datasource:temp_sensor.rolling_avg}"  # explicit prefix, HA-native
```

> **No format spec** → HA-native (locale + unit). **With format spec** → number only, you control the suffix.

---

## Public API

Two levels: the **DataSourceManager** singleton and individual **DataSource** instances.

### DataSourceManager

| Property / Method | Returns | Description |
|---|---|---|
| `sources` | `Map<name, DataSource>` | All active DataSource instances |
| `getSource(name)` | `DataSource\|undefined` | DataSource by its config key name |
| `initializeFromConfig(dsConfig)` | `Promise<number>` | Register and start all DataSources from a card config block; resolves to the count of successfully created sources |

### DataSource instance

| Method | Returns | Description |
|---|---|---|
| `subscribe(cb)` | `() => void` | Subscribe to value updates (the full data object above); returns unsubscribe fn |
| `getCurrentData()` | `Object` | Snapshot of the latest emitted data object (same shape as the subscribe callback payload) |
| `getRecent(count = 100)` | `Object[]` | Last `count` raw `{ t, v }` points from the main buffer |

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('dataSourceManager')
// → { sources: 4, entityIndex: 3, enhanced_sources: [{ id: 'temp_sensor', ... }, ...],
//      dot_notation_test: {} }
```
```javascript [Live object]
const dsm = window.lcards.core.dataSourceManager

dsm.sources                                 // Map of all active DataSource instances
dsm.getSource('sensor_temp')                // specific DataSource instance
dsm.getSource('sensor_temp').subscribe(cb)  // subscribe to updates
dsm.getSource('sensor_temp').getCurrentData()  // latest emitted data object
dsm.getSource('sensor_temp').getRecent(50)     // last 50 { t, v } points
```
:::

---

## Debug Namespace (`window.lcards.debug.datasources`)

Specialized introspection tools for deep DataSource analysis — processor graphs, validation, buffer stats.

::: tip
```javascript
window.lcards.debug.datasources.help()   // print method summary
window.lcards.debug.datasources.list()   // list all active source names
```
:::

| Method | Description |
|---|---|
| `list()` | All active DataSource names |
| `get(name)` | DataSource instance by name |
| `listProcessors(dsName)` | Processor keys registered on a DataSource |
| `showProcessorGraph(dsName)` | Log processor execution order; returns `{ nodes, edges }` |
| `inspectProcessor(dsName, processorName)` | Config, currentValue, buffer size, and stats for one processor |
| `validate(dsName)` | Config validation report `{ valid, errors, warnings, info }` |
| `getStats(dsName)` | Full stats: entity, buffer `{ size, capacity, oldest, newest }`, processing |

```javascript
const ds = window.lcards.debug.datasources

ds.list()                                            // ['sensor_temp', 'cpu_usage', ...]
ds.validate('sensor_temp')                           // { valid: true, errors: [], warnings: [] }
ds.getStats('sensor_temp')                           // { entity, buffer: { size, capacity, ... } }
ds.listProcessors('sensor_temp')                     // ['moving_average', 'rate_limiter', ...]
ds.inspectProcessor('sensor_temp', 'moving_average') // { config, currentValue, bufferSize, stats }
ds.showProcessorGraph('sensor_temp')                 // logs + returns { nodes, edges }
```

---

## See Also

- [DataSource Buffer Reference](../internals/datasource-buffers.md)
- [Template System](template-system.md)
