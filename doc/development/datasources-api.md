# DataSources Debug API

Introspection tools for the DataSource system, accessed via `window.lcards.debug.datasources`.

::: tip Discover the API in the console
```javascript
window.lcards.debug.datasources.help()
window.lcards.debug.datasources.list()
```
:::

---

## Methods

### `list()`

Returns an array of all active DataSource names.

```javascript
window.lcards.debug.datasources.list()
// Returns: ['sensor_temp', 'cpu_usage', ...]
```

### `get(name)`

Returns a DataSource instance by name.

```javascript
window.lcards.debug.datasources.get('sensor_temp')
```

### `listProcessors(dsName)`

Returns the processor keys registered on a DataSource.

```javascript
window.lcards.debug.datasources.listProcessors('sensor_temp')
// Returns: ['moving_average', 'rate_limiter', ...]
```

### `showProcessorGraph(dsName)`

Logs the processor execution order to the console and returns the dependency graph.

```javascript
window.lcards.debug.datasources.showProcessorGraph('sensor_temp')
// Returns: { nodes: [{ name, type }, ...], edges: [{ from, to }, ...] }
```

### `inspectProcessor(dsName, processorName)`

Returns detailed information about a specific processor.

```javascript
window.lcards.debug.datasources.inspectProcessor('sensor_temp', 'moving_average')
// Returns: {
//   name, type, config, dependency,
//   currentValue, bufferSize, bufferCapacity, stats
// }
```

### `validate(dsName)`

Validates a DataSource configuration and returns a structured report.

```javascript
window.lcards.debug.datasources.validate('sensor_temp')
// Returns: {
//   valid: true,
//   errors: [],
//   warnings: [],
//   info: { entity, hasProcessors, processorCount, bufferSize, bufferCapacity, started }
// }
```

### `getStats(dsName)`

Returns comprehensive statistics for a DataSource.

```javascript
window.lcards.debug.datasources.getStats('sensor_temp')
// Returns: {
//   entity, started,
//   buffer: { size, capacity, oldest, newest },
//   stats, processing
// }
```

### `help()`

Prints a method summary table to the console.

---

## See Also

- [MSD Debug API](debug-api.md)
- [DataSources](../architecture/subsystems/data-sources.md)
- [DataSource Buffers](../architecture/subsystems/datasource-buffers.md)
