# Datasource Buffer Structure

## Overview

As of LCARdS v1.12+, datasources use a simplified buffer structure with **main buffers** and **processor buffers**. This replaces the older `transformations` and `aggregations` nested structure.

## Buffer Structure

Datasource data objects have the following structure:

```javascript
{
  v: <value>,           // Main buffer (raw datasource value)
  <processorKey>: <value>,  // Processor buffer 1
  <processorKey>: <value>,  // Processor buffer 2
  // ... additional processor buffers
  t: <timestamp>        // Timestamp of last update
}
```

### Main Buffer (`v`)

The main buffer holds the raw, unprocessed value from the datasource:

```javascript
const data = {
  v: 72.5,              // Raw temperature value
  celsius: 22.5,        // Processor: fahrenheit → celsius
  rolling_avg: 71.8,    // Processor: moving average
  t: 1707580800000      // Timestamp
};
```

### Processor Buffers

Processor buffers are named outputs from data processors. Each processor has a unique key:

| Processor Type | Key | Example Value |
|---------------|-----|---------------|
| `unit_conversion` | Custom (e.g., `celsius`) | `22.5` |
| `moving_average` | Custom (e.g., `rolling_avg`) | `71.8` |
| `rate_of_change` | Custom (e.g., `rate`) | `0.3` |
| `threshold` | Custom (e.g., `is_high`) | `true` |

## Accessing Buffer Values

### In Templates

Reference buffers using dot notation:

```yaml
# Main buffer
text: "{datasource:temp_sensor}"        # Uses .v
text: "{ds:temp_sensor}"                # Short form

# Processor buffer
text: "{datasource:temp_sensor.celsius}°C"
text: "{ds:temp_sensor.rolling_avg:.1f}"

# Multiple processors
text: "Temp: {ds:temp_sensor.celsius:.1f}°C (avg: {ds:temp_sensor.rolling_avg:.1f}°C)"
```

### In JavaScript

Access via `DataSourceManager`:

```javascript
const source = dataSourceManager.getSource('temp_sensor');
const data = source.getCurrentData();

// Main buffer
console.log(data.v);              // 72.5

// Processor buffers
console.log(data.celsius);        // 22.5
console.log(data.rolling_avg);    // 71.8
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
// Extracted: data.celsius (processor buffer)

// Input: datasource: "temp_sensor"
// Parsed: datasource = "temp_sensor", path = []
// Extracted: data.v (main buffer)
```

## Processor Configuration

Define processors in the datasource `processors` array:

```yaml
data_sources:
  temp_sensor:
    entity_id: sensor.temperature
    update_interval: 5
    history_size: 100
    processors:
      # Unit conversion processor
      - type: unit_conversion
        key: celsius                    # Output buffer key
        from_unit: fahrenheit
        to_unit: celsius

      # Moving average processor
      - type: moving_average
        key: rolling_avg               # Output buffer key
        window: 10

      # Rate of change processor
      - type: rate_of_change
        key: temp_rate                 # Output buffer key
        window: 5
```

**Result data structure:**

```javascript
{
  v: 72.5,              // Main: raw Fahrenheit value
  celsius: 22.5,        // Processor: converted to Celsius
  rolling_avg: 71.8,    // Processor: 10-point moving average
  temp_rate: 0.3,       // Processor: rate of change
  t: 1707580800000
}
```

## Migration from Old Structure

### OLD Structure (Deprecated)

```javascript
{
  v: 72.5,
  transformations: {
    celsius: 22.5
  },
  aggregations: {
    rolling_avg: 71.8
  }
}
```

### NEW Structure (Current)

```javascript
{
  v: 72.5,
  celsius: 22.5,        // Flattened
  rolling_avg: 71.8     // Flattened
}
```

### Migration Examples

#### Template Migration

```yaml
# OLD (still works with warning)
text: "{datasource:temp.transformations.celsius}°C"

# NEW (recommended)
text: "{datasource:temp.celsius}°C"
```

#### Animation Migration

```yaml
# OLD
animations:
  - trigger: on_datasource_change
    datasource: temp.transformations.celsius
    preset: pulse

# NEW
animations:
  - trigger: on_datasource_change
    datasource: temp.celsius
    preset: pulse
```

### Backward Compatibility

The old nested paths (`transformations.key`, `aggregations.key`) are **deprecated** but may still work with warnings logged. Update to the flat structure to avoid future issues.

## AnimationManager Implementation

The `_extractValueFromPath()` method in AnimationManager handles buffer extraction:

```javascript
/**
 * Extract value from datasource using dot notation path
 * NEW: Updated for datasource buffer structure (main buffer + processor buffers)
 * 
 * @param {Object} data - Datasource data object
 * @param {Array<string>} pathParts - Path parts (e.g., ['celsius'])
 * @returns {*} Extracted value
 */
_extractValueFromPath(data, pathParts) {
  // No path specified - return main buffer value
  if (pathParts.length === 0) {
    return data.v;
  }

  // Single path part - look for processor buffer
  const processorKey = pathParts[0];
  
  if (data[processorKey] !== undefined) {
    // Found processor buffer - return its value
    return data[processorKey];
  }

  // Processor buffer not found - fallback to main buffer
  console.warn(`Processor buffer '${processorKey}' not found. Falling back to main buffer.`);
  return data.v;
}
```

### Extraction Examples

```javascript
const data = {
  v: 72.5,
  celsius: 22.5,
  rolling_avg: 71.8,
  t: 1707580800000
};

// No path → main buffer
_extractValueFromPath(data, [])
// Returns: 72.5

// Path: ["celsius"] → processor buffer
_extractValueFromPath(data, ["celsius"])
// Returns: 22.5

// Path: ["rolling_avg"] → processor buffer
_extractValueFromPath(data, ["rolling_avg"])
// Returns: 71.8

// Path: ["unknown"] → fallback to main buffer
_extractValueFromPath(data, ["unknown"])
// Warns and returns: 72.5
```

## Best Practices

### 1. Use Descriptive Processor Keys

```yaml
# Good: Clear, semantic keys
processors:
  - type: unit_conversion
    key: celsius
  - type: moving_average
    key: avg_5min

# Avoid: Generic keys
processors:
  - type: unit_conversion
    key: proc1
  - type: moving_average
    key: proc2
```

### 2. Document Processor Outputs

Add comments to clarify processor purposes:

```yaml
data_sources:
  cpu_temp:
    entity_id: sensor.cpu_temp
    processors:
      # Convert to Celsius for international users
      - type: unit_conversion
        key: celsius
        from_unit: fahrenheit
        to_unit: celsius

      # Smooth out sensor noise
      - type: moving_average
        key: smoothed
        window: 10
```

### 3. Fallback to Main Buffer

Design templates to gracefully handle missing processors:

```yaml
# Template tries processor first, falls back to main buffer
text: "{datasource:temp.celsius:.1f}°C"

# If 'celsius' processor doesn't exist, AnimationManager logs warning
# and returns data.v instead
```

### 4. Avoid Nested Paths

The new structure does NOT support nested paths:

```yaml
# ❌ WRONG: Multi-level nesting not supported
datasource: temp.processors.celsius

# ✅ CORRECT: Flat structure
datasource: temp.celsius
```

## Common Patterns

### Temperature Conversion

```yaml
data_sources:
  room_temp:
    entity_id: sensor.temperature
    processors:
      - type: unit_conversion
        key: celsius
        from_unit: fahrenheit
        to_unit: celsius

overlays:
  - id: temp_display
    type: text
    text: "{ds:room_temp.celsius:.1f}°C"
```

### Smoothed Sensor Data

```yaml
data_sources:
  cpu_usage:
    entity_id: sensor.cpu_percent
    processors:
      - type: moving_average
        key: smoothed
        window: 30

overlays:
  - id: cpu_gauge
    type: gauge
    value: "{ds:cpu_usage.smoothed}"
```

### Combined Processors

```yaml
data_sources:
  power_usage:
    entity_id: sensor.power
    processors:
      # Convert watts to kilowatts
      - type: unit_conversion
        key: kilowatts
        from_unit: watt
        to_unit: kilowatt

      # Calculate rate of change
      - type: rate_of_change
        key: trend
        source: kilowatts  # Apply to converted value
        window: 5

overlays:
  - id: power_display
    type: text
    text: "{ds:power_usage.kilowatts:.2f} kW (trend: {ds:power_usage.trend:+.3f})"
```

## Debugging

### Inspect Datasource Data

Use browser console to inspect current buffer structure:

```javascript
// Get datasource
const source = window.lcards.core.dataSourceManager.getSource('temp_sensor');

// Get current data
const data = source.getCurrentData();
console.log(data);
// Output: { v: 72.5, celsius: 22.5, rolling_avg: 71.8, t: 1707580800000 }

// List available processor buffers
Object.keys(data).filter(k => k !== 'v' && k !== 't');
// Output: ['celsius', 'rolling_avg']
```

### Enable Detailed Logging

```javascript
window.lcards.setGlobalLogLevel('debug');
```

Look for AnimationManager warnings:

```
[AnimationManager] Processor buffer 'unknown_key' not found in datasource. Available: v, celsius, rolling_avg, t. Falling back to main buffer.
```

## Related Documentation

- [Rule-Based Animations](./rule-based-animations.md) - Using datasources in rule conditions
- [Entity Change Triggers](./entity-change-triggers.md) - Simple entity monitoring
- [DataSource System](../subsystems/datasource-system.md) - Complete datasource architecture
- [Template System](../subsystems/template-system.md) - Template evaluation with datasources
