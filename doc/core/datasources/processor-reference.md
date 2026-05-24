# Processor Reference

Complete reference for all 12 DataSource processor types.

## Overview

Processors transform data as it flows through a DataSource. Each processor:
- Has a unique **name** (the key in the `processing` object)
- Specifies a **type** (one of 12 processor types)
- Optionally uses `input_source` to depend on another processor
- Outputs a value accessible in templates as `{datasource.processor_name}`

## Quick Reference

| Type | Purpose | Common Use |
|------|---------|------------|
| [`convert_unit`](#convert_unit) | Unit conversion | Temperature °F↔°C, power W↔kW |
| [`scale`](#scale) | Map range to range | 0-100 → 0-255, normalize values |
| [`smooth`](#smooth) | Reduce noise | Smooth jittery sensors |
| [`expression`](#expression) | Custom formula | Calculate derived values |
| [`statistics`](#statistics) | Min/max/mean/etc | Aggregate over time window |
| [`rate`](#rate) | Rate of change | Watts → watts/hour |
| [`trend`](#trend) | Direction detection | Increasing/decreasing/stable |
| [`duration`](#duration) | Time tracking | Time spent above threshold |
| [`threshold`](#threshold) | Binary conversion | Above/below → 1/0 |
| [`clamp`](#clamp) | Limit to range | Keep within min/max |
| [`round`](#round) | Round precision | 2 decimals, floor, ceil |
| [`delta`](#delta) | Change detection | Difference from last value |

---

## `convert_unit`

Convert between measurement units.

### Configuration

```yaml
processor_name:
  type: convert_unit
  from: c          # Source unit
  to: f            # Target unit
```

### Supported Units

**Temperature:**
- `c` (Celsius), `f` (Fahrenheit), `k` (Kelvin)

**Power:**
- `w`, `kw`, `mw`, `gw` (watts → gigawatts)

**Energy:**
- `wh`, `kwh`, `mwh` (watt-hours)
- `j`, `kj`, `mj` (joules)

**Distance:**
- `mm`, `cm`, `m`, `km` (metric)
- `in`, `ft`, `yd`, `mi` (imperial)

**Speed:**
- `ms` (meters/second), `kmh`, `mph`

**Pressure:**
- `hpa`, `bar`, `psi`, `mmhg`

**Data:**
- `b`, `kb`, `mb`, `gb`, `tb`

**Volume:**
- `ml`, `l` (liters), `gal` (gallons)

**Mass:**
- `g`, `kg` (kilograms), `lb`, `oz`

**Home Assistant:**
- `brightness` (0-255 ↔ 0-100%)
- `percent` (0-100)

### Examples

```yaml
# Temperature conversion
fahrenheit:
  type: convert_unit
  from: c
  to: f

# Power to kilowatts
kilowatts:
  type: convert_unit
  from: w
  to: kw

# Brightness to percentage
percent:
  type: convert_unit
  from: brightness
  to: percent
```

---

## `scale`

Map input range to output range with optional curve.

### Configuration

```yaml
processor_name:
  type: scale
  input_source: source_processor  # Optional
  input_range: [0, 100]
  output_range: [0, 255]
  curve: linear                   # linear, exponential, logarithmic, sigmoid
```

### Examples

```yaml
# Normalize 0-100 to 0-1
normalized:
  type: scale
  input_range: [0, 100]
  output_range: [0, 1]

# Temperature comfort index
comfort:
  type: scale
  input_source: fahrenheit
  input_range: [32, 95]
  output_range: [0, 100]

# RGB brightness
rgb:
  type: scale
  input_range: [0, 100]
  output_range: [0, 255]
  curve: exponential  # More natural brightness perception
```

---

## `smooth`

Apply smoothing algorithms to reduce noise.

### Configuration

```yaml
processor_name:
  type: smooth
  input_source: source_processor  # Optional
  method: exponential             # exponential, moving_average, gaussian
  window: 10                      # For moving_average (samples)
  alpha: 0.3                      # For exponential (0-1, lower = more smoothing)
```

### Methods

**Exponential:**
- Lightweight (single value state)
- Good for real-time displays
- `alpha`: 0.1 (heavy) to 0.9 (light smoothing)

**Moving Average:**
- Accurate averaging
- Requires buffer of `window` samples
- Good for historical analysis

**Gaussian:**
- Weighted average with bell curve
- Smoothest result
- Computationally heavier

### Examples

```yaml
# Light exponential smoothing
smoothed:
  type: smooth
  method: exponential
  alpha: 0.3

# 10-sample moving average
moving_avg:
  type: smooth
  input_source: converted
  method: moving_average
  window: 10

# Smooth temperature readings
smooth_temp:
  type: smooth
  input_source: fahrenheit
  method: gaussian
  window: 5
```

---

## `expression`

Evaluate custom JavaScript expressions.

### Configuration

```yaml
processor_name:
  type: expression
  input_source: source_processor  # Optional: single source
  sources:                        # Optional: multiple sources
    - processor1
    - processor2
  expression: "value * 2"    # JavaScript expression
```

### Context Variables

- `value` - Current value (if `input_source` specified)
- `sources[0], sources[1]...` - Array of source values (if `sources` specified)
- `metadata` - DataSource metadata object
- `states` - Full HA states object
- `hass` - Full HASS object

### Examples

```yaml
# Simple calculation
doubled:
  type: expression
  expression: "value * 2"

# Temperature-humidity comfort formula
comfort:
  type: expression
  sources:
    - temperature
    - humidity
  expression: "sources[0] - ((100 - sources[1]) * 0.5)"

# Conditional logic
status:
  type: expression
  input_source: temperature
  expression: "value > 25 ? 'hot' : 'cold'"

# Complex formula
feels_like:
  type: expression
  sources:
    - temp_f
    - humidity
    - wind_speed
  expression: |
    const t = sources[0];
    const h = sources[1];
    const w = sources[2];
    return t + 0.33 * h - 0.7 * w - 4.0;
```

---

## `statistics`

Calculate statistical measures over a time window.

### Configuration

```yaml
processor_name:
  type: statistics
  input_source: source_processor  # Optional
  window: 24h                     # Time window or 'session'
  stats:                  # Array of statistics to calculate
    - min
    - max
    - mean
```

### Available Statistics

- `min` - Minimum value
- `max` - Maximum value
- `mean` - Average
- `median` - Middle value
- `std_dev` - Standard deviation
- `q1` - 25th percentile
- `q3` - 75th percentile
- `range` - max - min
- `count` - Number of samples

### Output

Returns object with requested stats:
```javascript
{
  min: 18.5,
  max: 24.3,
  mean: 21.2,
  median: 21.0,
  count: 144
}
```

### Examples

```yaml
# Daily temperature statistics
daily_stats:
  type: statistics
  input_source: fahrenheit
  window: 24h
  stats: [min, max, mean]

# Session-wide stats
session_stats:
  type: statistics
  window: session
  stats: [min, max, range]

# Full statistical analysis
complete_stats:
  type: statistics
  input_source: sensor_value
  window: 1h
  stats: [min, max, mean, median, std_dev, q1, q3]
```

**Template Access:**
```yaml
overlays:
  - content: "Min: {temp.daily_stats.min:.1f}°F"
  - content: "Max: {temp.daily_stats.max:.1f}°F"
  - content: "Avg: {temp.daily_stats.mean:.1f}°F"
```

---

## `rate`

Calculate rate of change over time.

### Configuration

```yaml
processor_name:
  type: rate
  input_source: source_processor  # Optional
  unit: per_second                # per_second, per_minute, per_hour
  smoothing: true                 # Optional: apply smoothing
```

### Examples

```yaml
# Power consumption rate
power_rate:
  type: rate
  input_source: kilowatts
  unit: per_hour

# Data transfer rate
transfer_rate:
  type: rate
  input_source: bytes_transferred
  unit: per_second

# Temperature change rate
temp_rate:
  type: rate
  input_source: celsius
  unit: per_minute
  smoothing: true
```

---

## `trend`

Detect trend direction (increasing, decreasing, stable).

### Configuration

```yaml
processor_name:
  type: trend
  input_source: source_processor  # Optional
  samples: 5                      # Number of samples to analyze
  threshold: 0.01                 # Minimum change to detect trend
```

### Output

Returns string:
- `"increasing"` - Value trending up
- `"decreasing"` - Value trending down
- `"stable"` - No significant change

### Examples

```yaml
# Temperature trend
temp_trend:
  type: trend
  input_source: celsius
  samples: 10
  threshold: 0.1

# Battery trend
battery_trend:
  type: trend
  input_source: battery_percent
  samples: 5
  threshold: 1
```

**Template Usage:**
```yaml
overlays:
  - content: "Trend: {temp.temp_trend}"  # "increasing"
  - content: |
      {% if temp.temp_trend == 'increasing' %}↗{% endif %}
```

---

## `duration`

Track time spent in a condition.

### Configuration

```yaml
processor_name:
  type: duration
  input_source: source_processor  # Optional
  condition: "> 20"               # Condition expression
  reset_on: "< 15"                # Optional: reset condition
```

### Output

Returns object:
```javascript
{
  duration_ms: 3600000,           // Milliseconds
  duration_human: "1h 0m 0s"      // Human-readable
}
```

### Examples

```yaml
# Time above threshold
high_temp_duration:
  type: duration
  input_source: celsius
  condition: "> 25"
  reset_on: "< 20"

# Motion detection duration
motion_duration:
  type: duration
  condition: "== 'on'"

# Door open duration
door_open_time:
  type: duration
  input_source: door_state
  condition: "== 'open'"
```

**Template Access:**
```yaml
overlays:
  - content: "High temp for: {temp.high_temp_duration.duration_human}"
```

---

## `threshold`

Convert value to binary based on threshold.

### Configuration

```yaml
processor_name:
  type: threshold
  input_source: source_processor  # Optional
  threshold: 20
  above: 1                        # Value when above threshold
  below: 0                        # Value when below threshold
  hysteresis: 2                   # Optional: prevent flapping
```

### Hysteresis

Prevents rapid switching near threshold:
- When rising: triggers at `threshold + hysteresis`
- When falling: triggers at `threshold - hysteresis`

### Examples

```yaml
# Simple binary
is_hot:
  type: threshold
  input_source: celsius
  threshold: 25
  above: 1
  below: 0

# With hysteresis (prevents flapping at 25°C)
comfort_alert:
  type: threshold
  input_source: temperature
  threshold: 25
  above: 1
  below: 0
  hysteresis: 2  # Triggers at 27°C up, 23°C down

# Custom values
temp_level:
  type: threshold
  input_source: fahrenheit
  threshold: 75
  above: "hot"
  below: "comfortable"
```

---

## `clamp`

Limit value to minimum and maximum bounds.

### Configuration

```yaml
processor_name:
  type: clamp
  input_source: source_processor  # Optional
  min: 0
  max: 100
```

### Examples

```yaml
# Clamp percentage
percent_clamped:
  type: clamp
  min: 0
  max: 100

# Limit temperature range
temp_limited:
  type: clamp
  input_source: celsius
  min: -10
  max: 40

# Prevent negative values
positive_only:
  type: clamp
  input_source: calculated
  min: 0
```

---

## `round`

Round to specified precision.

### Configuration

```yaml
processor_name:
  type: round
  input_source: source_processor  # Optional
  precision: 1                    # Decimal places
  method: round                   # round, floor, ceil
```

### Methods

- `round` - Standard rounding (0.5 → 1)
- `floor` - Always round down (0.9 → 0)
- `ceil` - Always round up (0.1 → 1)

### Examples

```yaml
# 1 decimal place
rounded:
  type: round
  precision: 1

# No decimals
whole_number:
  type: round
  input_source: temperature
  precision: 0

# Always round down
floored:
  type: round
  input_source: value
  precision: 0
  method: floor

# Round to nearest 5
rounded_5:
  type: expression
  expression: "Math.round(value / 5) * 5"
```

---

## `delta`

Calculate change from previous value.

### Configuration

```yaml
processor_name:
  type: delta
  input_source: source_processor  # Optional
  absolute: false                 # true = absolute change, false = signed
```

### Examples

```yaml
# Signed change
temp_change:
  type: delta
  input_source: celsius
  absolute: false

# Absolute change
abs_change:
  type: delta
  input_source: power
  absolute: true

# Detect large jumps
significant_change:
  type: expression
  input_source: temp_change
  expression: "Math.abs(value) > 5"
```

---

## Chaining Processors

Processors can depend on each other using `input_source`:

```yaml
data_sources:
  temp:
    entity: sensor.temperature
    processing:
      # 1. Convert to Fahrenheit (no dependencies)
      fahrenheit:
        type: convert_unit
        from: c
        to: f

      # 2. Smooth (depends on fahrenheit)
      smoothed:
        type: smooth
        input_source: fahrenheit
        method: exponential
        alpha: 0.3

      # 3. Round (depends on smoothed)
      rounded:
        type: round
        input_source: smoothed
        precision: 1

      # 4. Statistics (depends on smoothed, parallel with rounded)
      stats:
        type: statistics
        input_source: smoothed
        window: 24h
        stats: [min, max, mean]
```

**Execution Order:**
1. `fahrenheit` (no dependencies)
2. `smoothed` and `stats` (both depend on `fahrenheit`, run in parallel)
3. `rounded` (depends on `smoothed`)

---

## Performance Notes

**Lightweight Processors:**
- `convert_unit`, `scale`, `round`, `clamp`, `threshold`, `delta`
- Single-pass calculations, minimal memory

**Medium Weight:**
- `smooth` (exponential)
- `expression` (simple formulas)
- `rate`, `trend`

**Heavier Processors:**
- `smooth` (moving average, gaussian)
- `statistics` (requires window buffer)
- `duration`
- `expression` (complex formulas)

**Best Practices:**
1. Only create processors you actually use
2. Use `update_interval` to throttle high-frequency sources
3. Prefer exponential smoothing over moving average for displays
4. Limit statistics windows to what you need
5. Avoid deeply nested processor chains (>5 levels)

---

*Last updated: February 2026 | LCARdS v1.12+*
