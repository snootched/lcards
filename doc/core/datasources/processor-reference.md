# Processor Reference

Complete reference for all 12 DataSource processor types.

## Overview

Processors transform data as it flows through a DataSource. Each processor:
- Has a unique **name** (the key in the `processing` object)
- Specifies a **type** (one of 12 processor types)
- Optionally uses `input_source` to depend on another processor
- Outputs a value accessible in templates as `{datasource.processor_name}`

Each section has a **Try it** lab: it runs the real LCARdS processors over a day of generated sample history and charts the raw values against each processor's output. Select **Edit** to change the YAML; any `sensor.*` entity id gets a sample signal.

## Quick Reference

| Type | Purpose | Common Use |
|------|---------|------------|
| [`convert_unit`](#convert-unit) | Unit conversion | Temperature °F↔°C, power W↔kW |
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

### Try it

```yaml lab
entity: sensor.demo_temperature
processing:
  fahrenheit:
    type: convert_unit
    from: c
    to: f
```

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

### Try it

```yaml lab
entity: sensor.demo_humidity
processing:
  normalized:
    type: scale
    input_range: [0, 100]
    output_range: [0, 1]
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
  window: 10                      # moving_average and gaussian: samples (default 10)
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

### Try it

```yaml lab
# A spiky power sensor: compare the three methods
entity: sensor.demo_power
processing:
  exponential:
    type: smooth
    method: exponential
    alpha: 0.2
  moving_average:
    type: smooth
    method: moving_average
    window: 6
  gaussian:
    type: smooth
    method: gaussian
    window: 6
```

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

- `value`, `v` - Current value: the `input_source` processor's output, else the raw entity value
- `timestamp`, `t` - Time of the value (epoch ms)
- `sources[0], sources[1]...` - The outputs of the processors listed in `sources` (they always run first)
- `entity` - The entity's state object (`state`, `attributes`, `entity_id`, `last_changed`, `last_updated`)
- `buffer` - The data source's raw value buffer
- `Math`, plus the shortcuts `abs`, `min`, `max`, `round`, `floor`, `ceil`, `pow`, `sqrt`

The expression is a single JavaScript expression (it is evaluated as `return (expression)`), so use the conditional operator rather than `if` or `return` statements. An expression that throws returns no value for that sample.

### Try it

```yaml lab
# How far the temperature is from its 24 h mean
entity: sensor.demo_temperature
processing:
  daily:
    type: statistics
    window: 24h
    stats: [mean]
  deviation:
    type: expression
    sources: [daily]
    expression: "value - sources[0].mean"
```

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
  expression: "sources[0] + 0.33 * sources[1] - 0.7 * sources[2] - 4.0"
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
- `sum` - Sum of the values

`avg` and `stddev` are accepted as aliases of `mean` and `std_dev`. Defaults: `window: session`, `stats: [min, max, mean]`. A time window covers this processor's own recent inputs, up to the data source's buffer size (`window_seconds` x 10 points, at least 60; 600 by default).

### Output

Returns an object with the requested stats, plus `oldest` and `newest` (timestamps of the first and last value in the window) and `window`:
```javascript
{
  min: 18.5,
  max: 24.3,
  mean: 21.2,
  median: 21.0,
  count: 144,
  oldest: 1760000000000,
  newest: 1760086400000,
  window: '24h'
}
```

With `max_points: N` it returns the last N of these results as a time series (each with a `t` timestamp) instead.

### Try it

```yaml lab
entity: sensor.demo_outdoor_temperature
processing:
  last_hour:
    type: statistics
    window: 1h
    stats: [min, max, mean]
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

### Try it

```yaml lab
# An energy meter (kWh): its rate per hour is the power in kW
entity: sensor.demo_energy
processing:
  kw:
    type: rate
    unit: per_hour
    smoothing: true
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

### Try it

```yaml lab
# trend outputs a word, so it shows in the table, not the chart
entity: sensor.demo_outdoor_temperature
processing:
  smoothed:
    type: smooth
    alpha: 0.3
  direction:
    type: trend
    input_source: smoothed
    samples: 6
    threshold: 0.02
```

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
  duration_human: "1h 0m",        // Human-readable
  in_condition: true              // Whether the condition holds now
}
```

Conditions compare numbers (`>`, `>=`, `<`, `<=`, `==`, `!=`). On/off entities arrive as `1`/`0` (other text states need `enum_mapping` on the data source), so test them with `== 1`.

### Try it

```yaml lab
# Minutes spent above 21.5 °C (resets each time it drops below)
entity: sensor.demo_temperature
processing:
  warm:
    type: duration
    condition: "> 21.5"
```

### Examples

```yaml
# Time above threshold
high_temp_duration:
  type: duration
  input_source: celsius
  condition: "> 25"
  reset_on: "< 20"

# Motion detection duration (binary_sensor: on = 1)
motion_duration:
  type: duration
  condition: "== 1"

# Door open duration (binary_sensor: open = on = 1)
door_open_time:
  type: duration
  condition: "== 1"
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

Prevents rapid switching near the threshold. `hysteresis` is the width of a dead band centred on the threshold:
- When rising: switches to `above` at `threshold + hysteresis / 2`
- When falling: switches to `below` at `threshold - hysteresis / 2`

The first value picks the starting state against `threshold` itself.

### Try it

```yaml lab
# 1 when warm, 0 when not; the 1 °C band stops flapping around 21.5
entity: sensor.demo_temperature
processing:
  warm:
    type: threshold
    threshold: 21.5
    hysteresis: 1
```

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
  hysteresis: 2  # Switches at 26°C rising, 24°C falling

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

### Try it

```yaml lab
# Cap the spikes of a power sensor at 600 W
entity: sensor.demo_power
processing:
  capped:
    type: clamp
    min: 0
    max: 600
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

### Try it

```yaml lab
entity: sensor.demo_temperature
processing:
  whole:
    type: round
    precision: 0
  floored:
    type: round
    precision: 0
    method: floor
```

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

### Try it

```yaml lab
# Energy used since the previous reading (kWh)
entity: sensor.demo_energy
processing:
  used:
    type: delta
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

Processors can depend on each other using `input_source` (and an expression's `sources`):

```yaml lab
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
2. `smoothed` (depends on `fahrenheit`)
3. `rounded` and `stats` (both depend on `smoothed`)

Each value runs through the whole chain in that order before the next value arrives.

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
