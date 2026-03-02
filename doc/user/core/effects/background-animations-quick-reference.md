# Background Animation Quick Reference

> **Cheat sheet for background animation configuration**

---

## 📋 Complete Parameter Reference

### Grid Preset

```yaml
- preset: grid
  config:
    # Sizing (choose one)
    line_spacing: 40          # Spacing-based mode
    num_rows: 10              # Cell-based mode
    num_cols: 10              # Cell-based mode

    # Styling
    line_width: 1             # Minor line width (default)
    line_width_minor: 1       # Explicit minor line width
    line_width_major: 2       # Major line width
    color: "rgba(255, 153, 102, 0.3)"
    color_major: "rgba(255, 153, 102, 0.6)"

    # Major lines (0 = disabled)
    major_row_interval: 5
    major_col_interval: 5

    # Scrolling
    scroll_speed_x: 20        # px/sec
    scroll_speed_y: 20        # px/sec

    # Pattern
    pattern: "both"           # both|horizontal|vertical
    show_border_lines: true
```

### Grid-Diagonal Preset

```yaml
- preset: grid-diagonal
  config:
    line_spacing: 60
    line_width: 1
    color: "rgba(255, 153, 102, 0.4)"
    scroll_speed_x: 30
    scroll_speed_y: 0
    show_border_lines: true
```

### Grid-Hexagonal Preset

```yaml
- preset: grid-hexagonal
  config:
    hex_radius: 30            # Hexagon size
    line_width_minor: 1
    line_width_major: 2
    color: "rgba(255, 153, 102, 0.3)"
    color_major: "rgba(255, 153, 102, 0.6)"
    major_row_interval: 3     # 0 = disabled
    major_col_interval: 3     # 0 = disabled
    scroll_speed_x: 10
    scroll_speed_y: 10
    show_border_lines: true
```

### Grid-Filled Preset

```yaml
- preset: grid-filled
  config:
    line_spacing: 50
    line_width: 1
    color: "rgba(255, 153, 102, 0.4)"
    fill_color: "rgba(255, 153, 102, 0.1)"
    scroll_speed_x: 20
    scroll_speed_y: 20
    pattern: "both"
    show_border_lines: true
```

### Starfield Preset

```yaml
- preset: starfield
  config:
    count: 150                # Number of stars
    min_radius: 0.5          # Minimum star size (px)
    max_radius: 2            # Maximum star size (px)
    min_opacity: 0.3         # 0-1
    max_opacity: 1.0         # 0-1
    colors:                  # Single color or array
      - "var(--lcards-blue-lightest)"
      - "#4455ff"
    scroll_speed_x: 30       # px/sec
    scroll_speed_y: 0        # px/sec
    parallax_layers: 3       # 1-5 depth layers
    depth_factor: 0.5        # 0-1 speed variance
    seed: 1                  # Random seed
```

### Nebula Preset

```yaml
- preset: nebula
  config:
    cloud_count: 4           # Number of clouds (1-10)
    min_radius: 0.15         # Min cloud radius (0-1, fraction)
    max_radius: 0.4          # Max cloud radius (0-1, fraction)
    min_opacity: 0.3         # 0-1
    max_opacity: 0.8         # 0-1
    colors:                  # Single color or array
      - "var(--lcards-blue-medium)"
      - "var(--lcards-orange)"
      - "var(--lcards-blue-light)"
    turbulence: 0.5          # 0-1 distortion intensity
    noise_scale: 0.003       # 0.001-0.01 (smaller = larger features)
    scroll_speed_x: 5        # px/sec
    scroll_speed_y: 5        # px/sec
    seed: 1                  # Random seed
```

### Cascade Preset

```yaml
- preset: cascade
  config:
    # Grid sizing (omit for auto)
    num_rows: null           # null = auto-size from canvas height
    num_cols: null           # null = auto-size from canvas width
    gap: 4                   # px between cells

    # Data
    format: hex              # hex|digit|float|alpha|mixed
    refresh_interval: 0      # ms (0 = static data)

    # Typography
    font_size: 10            # px
    font_family: "'Antonio', monospace"

    # Colours
    colors:
      start: "#99ccff"       # 0-75% hold
      text:  "#4466aa"       # 80-90% hold
      end:   "#aaccff"       # 90-100% fade

    # Timing
    pattern: default         # default|niagara|fast|custom
    speed_multiplier: 1.0    # 2.0 = 2× faster
    duration: null           # ms override (null = use pattern)

    opacity: 1.0
```

### Zoom Wrapper

```yaml
zoom:
  layers: 5                   # 2-10, default: 4
  scale_from: 0.5            # 0.1-1.0, default: 0.5
  scale_to: 2.0              # 1.0-5.0, default: 2.0
  duration: 15               # 5-60 seconds, default: 15
  opacity_fade_in: 15        # 0-100%, default: 15
  opacity_fade_out: 75       # 0-100%, default: 75
```

---

## 🎨 Color Formats

| Format | Example | Notes |
|--------|---------|-------|
| RGBA | `"rgba(255, 153, 102, 0.4)"` | Recommended (alpha control) |
| Hex | `"#FF9966"` | No transparency |
| Named | `"orange"` | Limited palette |
| Theme Token | `"{theme:palette.moonlight}"` | Dynamic theme colors |

---

## 📐 Common Values

### Line Spacing

| Value | Effect | Use Case |
|-------|--------|----------|
| 20-30px | Dense grid | Subtle background |
| 40-60px | Standard grid | Most common |
| 80-100px | Sparse grid | Bold, open look |

### Scroll Speed

| Value | Effect | Use Case |
|-------|--------|----------|
| 0 | Static | No movement (use with zoom) |
| 10-20 | Slow | Subtle animation |
| 30-50 | Medium | Standard animation |
| 60+ | Fast | Dynamic, energetic |

### Opacity (Alpha)

| Value | Effect | Use Case |
|-------|--------|----------|
| 0.1-0.2 | Very subtle | Background layer |
| 0.3-0.5 | Visible | Standard layer |
| 0.6-0.8 | Prominent | Foreground layer |
| 0.9-1.0 | Opaque | Solid overlay |

### Zoom Layers

| Value | Performance | Quality |
|-------|-------------|---------|
| 2-3 | High FPS | Choppy zoom |
| 4-5 | Medium FPS | Smooth zoom |
| 6-8 | Lower FPS | Very smooth |
| 9+ | Poor FPS | Avoid |

---

## 🎯 Preset Combinations

### Subtle Background

```yaml
background_animation:
  - preset: grid
    config:
      line_spacing: 50
      color: "rgba(255, 153, 102, 0.15)"
      scroll_speed_x: 10
      scroll_speed_y: 10
```

### Dynamic Layers

```yaml
background_animation:
  - preset: grid-diagonal
    config:
      line_spacing: 100
      color: "rgba(255, 153, 102, 0.2)"
      scroll_speed_x: 40
  - preset: grid
    config:
      line_spacing: 50
      color: "rgba(255, 153, 102, 0.25)"
      scroll_speed_x: 15
      scroll_speed_y: 15
```

### Zoom Effect

```yaml
background_animation:
  - preset: grid-hexagonal
    config:
      hex_radius: 35
      color: "rgba(102, 204, 255, 0.4)"
    zoom:
      layers: 5
      scale_from: 0.5
      scale_to: 2.0
      duration: 15
```

### Complex Stack

```yaml
background_animation:
  - preset: grid-filled
    config:
      line_spacing: 80
      color: "rgba(255, 153, 102, 0.3)"
      fill_color: "rgba(255, 153, 102, 0.05)"
      scroll_speed_x: 10
      scroll_speed_y: 10
  - preset: grid-diagonal
    config:
      line_spacing: 100
      color: "rgba(255, 153, 102, 0.2)"
      scroll_speed_x: 30
  - preset: grid-hexagonal
    config:
      hex_radius: 40
      color: "rgba(102, 204, 255, 0.25)"
    zoom:
      layers: 4
      duration: 20
```

---

## ⚡ Performance Tips

| Tip | Impact | When to Use |
|-----|--------|-------------|
| Single effect | ✅ Best | Most cards |
| 2 effects | ✅ Good | Layered look |
| 3+ effects | ⚠️ Careful | Only when needed |
| Zoom (3-4 layers) | ✅ Good | Standard zoom |
| Zoom (6+ layers) | ⚠️ CPU heavy | Avoid on slow devices |
| Alpha < 0.5 | ✅ Better | Reduces visual noise |
| Disable scroll on zoom | ✅ Better | Less computation |
| Increase line_spacing | ✅ Better | Fewer lines to draw |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Animation not visible | Check alpha > 0, verify canvas has width/height |
| Pattern seams visible | Use proper spacing values, check hex_radius |
| Poor performance | Reduce layers, increase spacing, fewer effects |
| Colors not resolving | Use quotes for RGBA, verify theme tokens exist |
| Zoom too subtle | Increase scale_to, reduce scale_from |
| Zoom too choppy | Increase layers (4-5), adjust duration |

---

## Related

- [Full Documentation](./background-animations.md) — complete reference
- [User Docs Index](../../README.md)
- [Button Card](../../cards/button/README.md) — applies background animations

---

*Last Updated: February 15, 2026*
