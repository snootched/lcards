# Datasource Buffer Structure

## Overview

Datasources use a buffer structure with **main buffers** and **processor buffers**.

## Buffer Structure

Datasource data objects have the following structure (verified against `DataSource.js`'s emitted/returned shape):

```javascript
{
  v: <value>,            // Main buffer (raw datasource value)
  t: <timestamp>,        // Timestamp of last update
  processing: {
    <processorKey>: <value>,  // Processor buffer 1
    <processorKey>: <value>,  // Processor buffer 2
    // ... additional processor buffers
  }
}
```

### Main Buffer (`v`)

The main buffer holds the raw, unprocessed value from the datasource:

```javascript
const data = {
  v: 72.5,              // Raw temperature value
  t: 1707580800000,     // Timestamp
  processing: {
    celsius: 22.5,       // Processor: fahrenheit → celsius
    rolling_avg: 71.8    // Processor: moving average
  }
};
```

### Processor Buffers

Processor buffers are named outputs from data processors. Each processor has a unique key:

| Processor Type | Key | Example Value |
|---------------|-----|---------------|
| `convert_unit` | Custom (e.g., `celsius`) | `22.5` |
| `smooth` (`method: moving_average`) | Custom (e.g., `rolling_avg`) | `71.8` |
| `rate` | Custom (e.g., `rate`) | `0.3` |
| `threshold` | Custom (e.g., `is_high`) | `true` |

## Accessing Buffer Values

### In Templates

Reference buffers using dot notation:

```yaml alternatives
# Main buffer — no format spec: HA-native (locale-formatted + unit, e.g. "23,4 °C")
text: "{datasource:temp_sensor}"        # Uses .v
text: "{ds:temp_sensor}"                # Short form

# Processor buffer — no format spec: unit appended from entity metadata
text: "{datasource:temp_sensor.celsius}"

# With format spec — you own the output (no auto-unit)
text: "{ds:temp_sensor.rolling_avg:.1f}"           # "71.8"
text: "{ds:temp_sensor.celsius:.1f} °C"            # "23.4 °C" — manual unit

# Multiple in one string
text: "Temp: {ds:temp_sensor.celsius:.1f} (avg: {ds:temp_sensor.rolling_avg:.1f})"
```

### In JavaScript

Access via `DataSourceManager`:

```javascript
const source = dataSourceManager.getSource('temp_sensor');
const data = source.getCurrentData();

// Main buffer
console.log(data.v);                     // 72.5

// Processor buffers — nested under `processing`
console.log(data.processing.celsius);        // 22.5
console.log(data.processing.rolling_avg);    // 71.8
```

### In Animations

Reference in animation datasource triggers:

```yaml
animations:
  - trigger: on_datasource_change
    datasource: temp_sensor.celsius
    preset: pulse
    duration: 500
```

The `AnimationManager` extracts values using `_extractValueFromPath()`:

```javascript
// Input: datasource: "temp_sensor.celsius"
// Parsed: datasource = "temp_sensor", path = ["celsius"]
// Extracted: data.processing.celsius (processor buffer)

// Input: datasource: "temp_sensor"
// Parsed: datasource = "temp_sensor", path = []
// Extracted: data.v (main buffer)
```

## Processor Configuration

Define processors in the datasource `processing` map (keyed by output buffer name):

```yaml
data_sources:
  temp_sensor:
    entity: sensor.temperature
    history: { hours: 6 }
    processing:
      # Unit conversion processor
      celsius:
        type: convert_unit
        from: fahrenheit
        to: celsius

      # Smooth processor (default method is exponential; use method: moving_average for window-based)
      rolling_avg:
        type: smooth
        method: moving_average
        window: 10

      # Rate of change processor
      temp_rate:
        type: rate
```

**Result data structure** (processor outputs are nested under `processing`, not spread onto the top level):

```javascript
{
  v: 72.5,              // Main: raw Fahrenheit value
  t: 1707580800000,
  processing: {
    celsius: 22.5,       // Processor: converted to Celsius
    rolling_avg: 71.8,   // Processor: 10-point moving average
    temp_rate: 0.3       // Processor: rate of change
  }
}
```

## See Also

- [DataSource System](../subsystems/datasource-system.md)
- [Template System](../subsystems/template-system.md)
