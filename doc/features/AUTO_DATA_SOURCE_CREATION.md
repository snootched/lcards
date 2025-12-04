# Auto Data Source Creation

**Feature:** Automatic DataSource creation for chart cards and other cards that reference entities.

## Overview

Both LCARdS Chart cards and MSD overlays now support **auto-creation** of DataSources when entities are referenced directly. This eliminates boilerplate configuration and makes cards more user-friendly.

## Background: MSD Pattern

In MSD, there were two ways to provide data:

### 1. Explicit DataSource Definition (Manual)

```yaml
type: custom:lcards-msd
config:
  data_sources:
    temp_sensor:
      entity: sensor.temperature
      history:
        enabled: true
        hours: 24

  overlays:
    - type: apexchart
      source: temp_sensor  # Reference named data source
```

### 2. Template Entity Auto-Creation (MSD Feature)

MSD already had logic to auto-create DataSources for entities found in templates:

```yaml
overlays:
  - type: text
    content: "Temperature: {sensor.temperature}"  # Auto-creates data source!
```

This was implemented in `SystemsManager._createTemplateDataSources()`.

## New Feature: Chart Auto-Creation

### LCARdS Chart Standalone Usage

Now LCARdS Chart can be used standalone **without any MSD config**:

```yaml
# Just reference the entity directly!
type: custom:lcards-chart
source: sensor.temperature  # Auto-creates DataSource with history
chart_type: line
```

The card will:
1. Check if `sensor.temperature` data source exists
2. If not, **auto-create it** with sensible defaults:
   - `history.enabled: true` (charts need history!)
   - `history.hours: 24` (or custom via `history_hours` config)
   - `windowSeconds: 3600` (1 hour window)
   - `minEmitMs: 1000` (1 second minimum between updates)
   - `coalesceMs: 200` (200ms coalescing for smooth updates)
   - Marked with `_autoCreated: true` and `_chartEntity: true` flags

### Custom History Hours

```yaml
type: custom:lcards-chart
source: sensor.energy_usage
chart_type: bar
history_hours: 48  # Override default 24 hours
```

### Multi-Series Auto-Creation

Works with multiple sources too:

```yaml
type: custom:lcards-chart
sources:
  - sensor.temperature
  - sensor.humidity
  - sensor.pressure
chart_type: line
# All three auto-created if they don't exist!
```

## Implementation

### Location

`src/cards/lcards-chart.js` → `_subscribeToDataSources()` method

### Logic

```javascript
async _subscribeToDataSources() {
  for (let sourceId of sources) {
    let dataSource = dataSourceManager.getSource(sourceId);

    if (!dataSource) {
      // Validate entity ID format
      if (!/^[a-z_]+\.[a-z0-9_]+$/.test(sourceId)) {
        warn("Invalid source - must be entity ID");
        continue;
      }

      // Auto-create with chart-optimized settings
      dataSource = await dataSourceManager.createDataSource(sourceId, {
        entity: sourceId,
        history: { enabled: true, hours: config.history_hours || 24 },
        windowSeconds: 3600,
        minEmitMs: 1000,
        coalesceMs: 200,
        _autoCreated: true,
        _chartEntity: true
      });
    }

    // Subscribe...
  }
}
```

### Entity ID Validation

Only valid entity IDs are auto-created:
- **Valid**: `sensor.temperature`, `climate.living_room`, `binary_sensor.door_open`
- **Invalid**: `my_source`, `temp`, `sensor` (must have domain.name format)

## Benefits

### 1. Simplified Configuration

**Before** (MSD required):
```yaml
type: custom:lcards-msd
config:
  data_sources:
    temp: { entity: sensor.temperature, history: { enabled: true } }
    humid: { entity: sensor.humidity, history: { enabled: true } }
  overlays:
    - type: apexchart
      sources: [temp, humid]
```

**After** (standalone):
```yaml
type: custom:lcards-chart
sources: [sensor.temperature, sensor.humidity]
chart_type: line
```

### 2. Consistent with MSD Template Pattern

MSD already auto-creates data sources for template entities. This extends that pattern to chart sources.

### 3. Reduced Boilerplate

No need to define data sources separately when using simple entity references.

### 4. Better Developer Experience

Cards "just work" with entity IDs - no DataSource configuration knowledge required.

## Limitations

### 1. Only Works for Entity IDs

Auto-creation **only** works for direct entity references (format: `domain.name`).

If you need:
- Custom DataSource settings (advanced windowing, aggregations, etc.)
- Non-entity data sources
- Complex transformations

You must **manually define** the DataSource in MSD config.

### 2. Default Settings Only

Auto-created DataSources use sensible defaults but may not be optimal for all use cases.

For advanced control, define explicitly:
```yaml
data_sources:
  temp_advanced:
    entity: sensor.temperature
    history:
      enabled: true
      hours: 168  # 1 week
    aggregations:
      - type: moving_average
        window: 10
```

### 3. MSD Context Preferred

In MSD configs, it's still **recommended** to define data sources explicitly for:
- Documentation clarity
- Performance optimization (shared across overlays)
- Advanced features

## Future Enhancements

### 1. Other LCARdSCards

Extend auto-creation to other cards:
- `lcards-button` - auto-create for `entity:` config
- `lcards-text` - auto-create for template entities
- `lcards-status` - auto-create for `entity:` config

### 2. Smart Defaults

Detect entity domain and adjust settings:
- `sensor.*` → enable history
- `binary_sensor.*` → disable history (state-only)
- `climate.*` → enable attribute tracking

### 3. Configuration Hints

Warn users when auto-created DataSource may not be optimal:
```
⚠️ Auto-created DataSource for sensor.temperature
💡 For better performance, define explicitly in MSD config
```

## Testing

See test guides:
- `test/lcards-chart-standalone-test.md` - Standalone chart with auto-creation
- `test/msd-unified-overlay-test.md` - MSD integration testing

## Summary

✅ **LCARdS Chart** now auto-creates DataSources for entity IDs
✅ Works standalone (no MSD config needed)
✅ Follows MSD template entity pattern
✅ Validated entity ID format
✅ Customizable history hours
✅ Multi-series support

**Next Step:** Extend to other LCARdSCards (button, text, status) for consistency.
