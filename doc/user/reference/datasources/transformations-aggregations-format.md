# Transformations & Aggregations Format Reference

> **Syntax guide for keyed object format**
> Keyed object format for transformations and aggregations (v1.13.04+)

## Keyed Object Format (Recommended)

As of v1.13.04, transformations and aggregations use a **keyed object format** instead of arrays. This provides:

- **Better readability** - Clear keys instead of array indices
- **Easier updates** - Modify specific transforms without touching others
- **Consistency** - Matches other config patterns in LCARdS
- **No `key:` property needed** - The key IS the property name

### Migration Example

**OLD (Array Format - Still Supported)**:
```yaml
data_sources:
  my_sensor:
    entity: sensor.temperature
    transformations:
      - type: unit_conversion
        conversion: c_to_f
        key: fahrenheit    # ← Key was a property
      - type: scale
        input_source: fahrenheit
        input_range: [32, 95]
        output_range: [0, 100]
        key: comfort_percent
```

**NEW (Keyed Object Format - Recommended)**:
```yaml
data_sources:
  my_sensor:
    entity: sensor.temperature
    transformations:
      fahrenheit:          # ← Key is now the property name
        type: unit_conversion
        from: c            # ← Uses from/to instead of conversion
        to: f
      comfort_percent:     # ← Direct key, no nesting
        type: scale
        input_source: fahrenheit
        input_range: [32, 95]
        output_range: [0, 100]
```

---

## Unit Conversion Property Changes

Unit conversions now use **`from` and `to` properties** instead of a single `conversion` string:

**OLD**:
```yaml
transformations:
  - type: unit_conversion
    conversion: c_to_f    # Single string
    key: fahrenheit
```

**NEW**:
```yaml
transformations:
  fahrenheit:
    type: unit_conversion
    from: c               # Separate properties
    to: f
```

### Benefits
- **Visual Editor Support**: Dialog can validate compatible conversions
- **Category-based**: Prevents incompatible conversions (e.g., temperature → pressure)
- **Clearer Intent**: Explicit source and target units

---

## 📊 Aggregations Format

Aggregations follow the same keyed object pattern:

**OLD (Array)**:
```yaml
aggregations:
  - type: min_max
    key: daily_stats
    window: 24h
    min: true
    max: true
  - type: moving_average
    key: avg_10
    window_size: 10
```

**NEW (Keyed Object)**:
```yaml
aggregations:
  daily_stats:
    type: min_max
    window: 24h
    min: true
    max: true
  avg_10:
    type: moving_average
    window_size: 10
```

---

## 🔧 Complete Example

```yaml
data_sources:
  temperature_analysis:
    entity: sensor.outdoor_temp
    history:
      preload: true
      hours: 24

    transformations:
      # Convert to Fahrenheit
      fahrenheit:
        type: unit_conversion
        from: c
        to: f
        debug: true

      # Normalize to 0-100 scale
      comfort_scale:
        type: scale
        input_source: fahrenheit
        input_range: [32, 95]
        output_range: [0, 100]

      # Smooth the result
      smoothed:
        type: smooth
        input_source: comfort_scale
        method: exponential
        alpha: 0.3

    aggregations:
      # Daily statistics
      daily_stats:
        type: min_max
        input_source: comfort_scale
        window: 24h
        min: true
        max: true
        avg: true

      # Recent trend
      trend:
        type: recent_trend
        input_source: smoothed
        samples: 10
```

### Usage in Overlays

```yaml
overlays:
  - type: text
    content: "Temp: {temperature_analysis.transformations.fahrenheit:.1f}°F"

  - type: text
    content: "Comfort: {temperature_analysis.transformations.comfort_scale:.0f}%"

  - type: text
    content: "Smoothed: {temperature_analysis.transformations.smoothed:.0f}%"

  - type: text
    content: "Daily Max: {temperature_analysis.aggregations.daily_stats.max:.0f}%"
```

---

## 🔄 Backward Compatibility

The system **supports both formats**:

- **Array format** (legacy) - Still works, converted internally
- **Object format** (preferred) - Native support, no conversion needed

You can migrate gradually - no need to update everything at once!

---

## 📝 Visual Editor

The visual editor automatically uses the new format when you:

1. Click "Add Transformation" or "Add Aggregation"
2. Fill in the dialog
3. Save

The editor handles the object format natively, making it easier to:
- View existing transforms/aggregations
- Edit specific items
- Add new items without affecting others
- See transformation/aggregation counts

---

## 🎯 Best Practices

### ✅ DO
```yaml
transformations:
  descriptive_name:      # Use clear, descriptive keys
    type: scale
    # ...

  another_transform:     # Each transform is a sibling
    type: smooth
    # ...
```

### ❌ DON'T
```yaml
transformations:
  - type: scale         # Don't use array format (though it still works)
    key: transform1     # Don't use generic keys
```

---

## 🔍 Available Transformation Types

All transformation types work with the new format:

- `unit_conversion` - Convert between units (now uses `from`/`to`)
- `scale` - Map input range to output range
- `smooth` - Apply smoothing algorithms
- `expression` - Custom JavaScript expressions
- `statistical` - Statistical operations

## 📊 Available Aggregation Types

All aggregation types work with the new format:

- `min_max` - Track minimum, maximum, average
- `moving_average` - Rolling average over window
- `rate_of_change` - Calculate rate of change
- `recent_trend` - Detect trends (rising/falling/stable)
- `duration` - Track time spent in state

---

## 🆘 Troubleshooting

### "No conversion method available for undefined to unknown"

**Cause**: Using old `conversion: c_to_f` format or `from_unit`/`to_unit` properties

**Fix**: Update to use `from` and `to`:
```yaml
transformations:
  fahrenheit:
    type: unit_conversion
    from: c     # ← Use these
    to: f       # ← Not 'conversion' or 'from_unit'
```

### Transformation count shows 0

**Cause**: Using array format - editor doesn't count array items correctly

**Fix**: Convert to keyed object format (or re-save in editor)

---

## See Also

- [Computed Sources Guide](./computed-sources.md) - Calculated data sources
- [Transformation Reference](./transformations.md) - All transformation types
- [Aggregation Reference](./aggregations.md) - All aggregation types

---

[← Back to Reference](../README.md) | [User Guide →](../../README.md)
