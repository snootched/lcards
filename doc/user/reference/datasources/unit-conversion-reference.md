# Unit Conversion Reference

> **All supported unit conversion codes**
> Quick reference for 50+ unit conversions in transformations

## Overview

Quick reference for all supported unit conversion codes in transformations.

---

## Temperature

| Code | Unit | Example |
|------|------|---------|
| `c` | Celsius (°C) | `from: c, to: f` |
| `f` | Fahrenheit (°F) | `from: f, to: c` |
| `k` | Kelvin (K) | `from: k, to: c` |

**Supported Conversions**: c↔f, c↔k, f↔k

---

## Power

| Code | Unit | Example |
|------|------|---------|
| `w` | Watts (W) | `from: w, to: kw` |
| `kw` | Kilowatts (kW) | `from: kw, to: mw` |
| `mw` | Megawatts (MW) | `from: mw, to: kw` |

**Supported Conversions**: w↔kw, kw↔mw, w↔mw

---

## Energy

| Code | Unit | Example |
|------|------|---------|
| `wh` | Watt-hours (Wh) | `from: wh, to: kwh` |
| `kwh` | Kilowatt-hours (kWh) | `from: kwh, to: mwh` |
| `mwh` | Megawatt-hours (MWh) | `from: mwh, to: kwh` |
| `j` | Joules (J) | `from: j, to: kwh` |

**Supported Conversions**: wh↔kwh, kwh↔mwh, j↔kwh

---

## Distance

| Code | Unit | Example |
|------|------|---------|
| `mm` | Millimeters (mm) | `from: mm, to: cm` |
| `cm` | Centimeters (cm) | `from: cm, to: m` |
| `m` | Meters (m) | `from: m, to: km` |
| `km` | Kilometers (km) | `from: km, to: m` |
| `in` | Inches (in) | `from: in, to: cm` |
| `ft` | Feet (ft) | `from: ft, to: m` |

**Supported Conversions**: mm→cm→m→km (sequential), in↔cm, ft↔m

---

## 🚗 Speed

| Code | Unit | Example |
|------|------|---------|
| `ms` | Meters/Second (m/s) | `from: ms, to: kmh` |
| `kmh` | Kilometers/Hour (km/h) | `from: kmh, to: mph` |
| `mph` | Miles/Hour (mph) | `from: mph, to: kmh` |

**Supported Conversions**: ms↔kmh, kmh↔mph, ms↔mph

---

## 🌪️ Pressure

| Code | Unit | Example |
|------|------|---------|
| `hpa` | Hectopascals (hPa) | `from: hpa, to: bar` |
| `bar` | Bar | `from: bar, to: hpa` |
| `psi` | PSI | `from: psi, to: hpa` |
| `mmhg` | mmHg | `from: mmhg, to: hpa` |

**Supported Conversions**: hpa↔bar, hpa↔psi, hpa↔mmhg

---

## Data Size

| Code | Unit | Example |
|------|------|---------|
| `b` | Bytes (B) | `from: b, to: kb` |
| `kb` | Kilobytes (KB) | `from: kb, to: mb` |
| `mb` | Megabytes (MB) | `from: mb, to: gb` |
| `gb` | Gigabytes (GB) | `from: gb, to: tb` |
| `tb` | Terabytes (TB) | `from: tb, to: gb` |

**Supported Conversions**: b→kb→mb→gb→tb (sequential, bidirectional)

---

## 🫗 Volume

| Code | Unit | Example |
|------|------|---------|
| `ml` | Milliliters (mL) | `from: ml, to: l` |
| `l` | Liters (L) | `from: l, to: gal` |
| `gal` | Gallons (gal) | `from: gal, to: l` |

**Supported Conversions**: ml↔l, l↔gal

---

## 🏠 Home Assistant Specific

### Brightness Conversions
| Code | Description | Range |
|------|-------------|-------|
| `brightness_to_percent` | 0-255 → 0-100% | HA brightness to percentage |
| `percent_to_brightness` | 0-100% → 0-255 | Percentage to HA brightness |

### Percentage Conversions
| Code | Description |
|------|-------------|
| `percent_to_decimal` | 0-100 → 0.0-1.0 |
| `decimal_to_percent` | 0.0-1.0 → 0-100 |

### Special Conversions
| Code | Description |
|------|-------------|
| `lux_to_percent` | Light level to percentage (capped at 100%) |
| `dbm_to_percent` | WiFi signal strength to percentage |
| `rssi_to_percent` | Generic signal strength to percentage |

---

## 📝 Usage Examples

### Simple Temperature Conversion
```yaml
transformations:
  fahrenheit:
    type: unit_conversion
    from: c
    to: f
```

### Chained Conversions
```yaml
transformations:
  # Convert to Fahrenheit
  fahrenheit:
    type: unit_conversion
    from: c
    to: f

  # Then scale to comfort percentage
  comfort:
    type: scale
    input_source: fahrenheit
    input_range: [32, 95]
    output_range: [0, 100]
```

### Power Monitoring
```yaml
transformations:
  kilowatts:
    type: unit_conversion
    from: w
    to: kw

  cost_per_hour:
    type: expression
    input_source: kilowatts
    expression: "value * 0.12"  # $0.12 per kWh
```

---

## ⚠️ Important Notes

1. **Use short codes**: `c`, not `celsius` or `Celsius`
2. **Lowercase only**: All unit codes are lowercase
3. **Category matching**: Can only convert within the same category (e.g., temperature to temperature)
4. **Visual editor**: Shows friendly names but saves correct codes
5. **Bidirectional**: Most conversions work both ways (from→to and to→from)

---

## 🔍 Finding Available Conversions

The visual editor will:
- Show you available unit categories
- Only allow compatible conversions
- Prevent invalid combinations (e.g., temperature to pressure)
- Display a preview of your conversion

Or check the processor source code:
`src/core/data-sources/transformations/TransformationProcessor.js`

---

## 🆘 Troubleshooting

### "No conversion method available"

**Cause**: Using wrong unit code or incompatible conversion

**Fix**: Check this reference for correct codes
```yaml
# ❌ Wrong
from: celsius
to: fahrenheit

# ✅ Correct
from: c
to: f
```

### Conversion not working

**Causes**:
1. Typo in unit code
2. Trying to convert between incompatible categories
3. Case sensitivity (use lowercase)

**Fix**: Use the visual editor - it validates automatically!

---

## See Also

- [Transformations Format Guide](./transformations-aggregations-format.md) - Syntax reference
- [Transformation Reference](./transformations.md) - All transformation types
- [Computed Sources](./computed-sources.md) - JavaScript expressions

---

[← Back to Reference](../README.md) | [User Guide →](../../README.md)
