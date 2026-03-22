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
  v: 72.5,             // Raw entity state value (main buffer)
  celsius: 22.5,       // Processor output keyed by processor's `key`
  rolling_avg: 71.8,   // Another processor output
  t: 1707580800000     // Timestamp (ms)
}
```

---

## Config Schema

```yaml
data_sources:
  temp_sensor:
    entity_id: sensor.temperature
    update_interval: 5          # polling interval (seconds); 0 = push-only
    history_size: 100           # rolling buffer depth
    processors:
      - type: unit_conversion
        key: celsius
        from_unit: fahrenheit
        to_unit: celsius
      - type: smooth
        key: rolling_avg
        window: 10
```

---

## Processors Reference

| Type | Key field | Output |
|---|---|---|
| `unit_conversion` | custom | Converted numeric value |
| `smooth` | custom | Moving average |
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

---

## Card Usage

```javascript
// In _handleFirstUpdate():
const dsm = window.lcards.core.dataSourceManager;
await dsm.initializeFromConfig(this.config.data_sources || {});

const source = dsm.getSource('temp_sensor');
this._unsubscribe = source.subscribe((data) => {
  this._temp = data.celsius;
  this.requestUpdate();
});

// In disconnectedCallback():
if (this._unsubscribe) this._unsubscribe();
```

---

## Template Access

```yaml
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
| `getSource(name)` | `DataSource\|null` | DataSource by its config key name |
| `initializeFromConfig(dsConfig)` | `Promise<void>` | Register and start all DataSources from a card config block |

### DataSource instance

| Method | Returns | Description |
|---|---|---|
| `subscribe(cb)` | `() => void` | Subscribe to value updates `{ v, t }`; returns unsubscribe fn |
| `getValue()` | `any` | Current value (synchronous) |
| `getHistory()` | `Object[]` | Recent value buffer `[{ v, t }, ...]` |

---

## Console Access

::: code-group
```javascript [Snapshot]
window.lcards.debug.singleton('dataSourceManager')
// → { type: 'DataSourceManager', sourceCount: 4, sources: [...] }
```
```javascript [Live object]
const dsm = window.lcards.core.dataSourceManager

dsm.sources                           // Map of all active DataSource instances
dsm.getSource('sensor_temp')          // specific DataSource instance
dsm.getSource('sensor_temp').subscribe(cb)  // subscribe to updates
dsm.getSource('sensor_temp').getHistory()   // recent value history
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

- [DataSource Buffer Reference](../animations/datasource-buffers.md)
- [Template System](template-system.md)
