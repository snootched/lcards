# Picard Component Usage Examples

This file contains example configurations for using the new Picard slider component.

## Example 1: Basic Picard with Pills

```yaml
type: custom:lcards-slider
entity: light.bedroom
component: picard
preset: pills-basic
```

**Result:** Picard borders (state-aware blue/gray) + segmented pill track

---

## Example 2: Picard with Gauge (Read-Only Display)

```yaml
type: custom:lcards-slider
entity: sensor.temperature
component: picard
preset: gauge-basic
```

**Result:** Picard borders + gauge ruler + separate progress bar (cyan)

---

## Example 3: Picard with Gauge and Range Indicators

```yaml
type: custom:lcards-slider
entity: climate.thermostat
component: picard
preset: gauge-basic
ranges:
  - min: 0
    max: 18
    color: '#0066FF'
    label: 'Cold'
  - min: 18
    max: 24
    color: '#00FF00'
    label: 'Comfortable'
  - min: 24
    max: 30
    color: '#FF6600'
    label: 'Warm'
```

**Result:** Picard borders + gauge + progress bar + colored range bars with labels

---

## Example 4: Customized Picard - No Animation, Custom Colors

```yaml
type: custom:lcards-slider
entity: light.living_room
component: picard
preset: pills-basic
show_animation: false              # Disable pulsing indicator
animation_speed: 1.5               # Faster pulse (if enabled)
style:
  border:
    radius: 12                     # Rounded corners
    top:
      color:
        on: '#FF0000'              # Red border when light is on
        off: '#666666'             # Gray when off
  range:
    frame:
      thickness: 8                 # Thicker decorative frame
      color: '#FF9900'             # Orange frame
```

**Result:** Customized Picard with rounded corners, no animation, red active borders

---

## Example 5: Picard with Custom Range Border Styling

```yaml
type: custom:lcards-slider
entity: climate.thermostat
component: picard
preset: gauge-basic
ranges:
  - min: 0
    max: 20
    color: '#3366FF'
    label: 'Cool'
  - min: 20
    max: 25
    color: '#33CC99'
    label: 'OK'
  - min: 25
    max: 30
    color: '#FF6633'
    label: 'Warm'
style:
  range:
    border:
      color: '#000000'             # Black inset borders (default)
      gap: 3                       # 3px gap between outer and inner rects
    frame:
      color: '#2765FD'             # Blue decorative frame
      thickness: 5                 # Frame thickness
```

**Result:** Picard with custom range styling

---

## Configurable Options

The Picard component supports the following customization options:

### Animation Control
- `show_animation`: `true` | `false` (default: `true`)
  - Show/hide pulsing animation indicator in top-left
- `animation_speed`: number (default: `2`)
  - Animation pulse speed in seconds

### Border Styling
- `style.border.radius`: number (default: `0`)
  - Border radius for rounded corners
- `style.border.top.color`: string | state object
  - Top border color (state-aware, defaults to `#2766FF` when active, `#9DA4B9` when inactive)
- `style.border.bottom.color`: string | state object
  - Bottom border color (default: `#9DA4B9`)

### Range Styling
- `style.range.frame.color`: string (default: `#2765FD`)
  - Color of decorative frame around range area
- `style.range.frame.thickness`: number (default: `5`)
  - Thickness of decorative frame
- `style.range.border.color`: string (default: `#000000`)
  - Color of inset borders around range indicators
- `style.range.border.gap`: number (default: `5`)
  - Gap between outer border and inner range color (pixels)

### Progress Bar Styling
- `style.gauge.progress_bar.color`: string | state object (default: `#00EDED`)
  - Color of progress bar fill in progress zone

### State-Aware Colors

State-aware color properties support multiple formats:

```yaml
# Simple string (same color for all states)
style:
  border:
    top:
      color: '#FF0000'

# State object (different colors per state)
style:
  border:
    top:
      color:
        on: '#2766FF'        # Blue when entity is on/active
        off: '#9DA4B9'       # Gray when entity is off/inactive
        default: '#666666'   # Fallback for unknown states
```

---

## Component Features

The Picard component includes:

1. **State-Aware Borders**: Top-left and bottom-left borders change color based on entity state (blue when active, gray when inactive)
2. **Animated Indicator**: Optional pulsing indicator in top-left corner (can be disabled)
3. **Separate Progress Zone**: Cyan progress bar fills from bottom to top, independent of gauge/pills
4. **Range Indicators Zone**: Colored bars with black inset borders and optional labels
5. **Decorative Frame**: Blue frame around range indicator area
6. **Track Zone**: Pills or gauge content (controlled by preset)

---

## Architecture Notes

The Picard component uses the new **render function architecture**, which enables:
- Dynamic SVG generation at runtime
- Full access to card config, state, and styling
- Separate zones for progress, ranges, and track content
- Automatic scaling to container dimensions

This is the go-forward pattern for creating advanced slider components.

---

## Comparison: Basic vs Picard

| Feature | Basic Component | Picard Component |
|---------|----------------|------------------|
| Visual Style | Plain background | LCARS-styled borders |
| State Awareness | No | Yes (borders change color) |
| Animation | No | Optional pulsing indicator |
| Progress Zone | Combined with track | Separate zone |
| Range Zone | No | Dedicated zone with frame |
| Orientation | Auto (horizontal/vertical) | Vertical only |
| Customization | Limited | Extensive |

---

## Troubleshooting

### Picard not appearing in dropdown
- Ensure you're using the latest version with render function support
- Check browser console for component load errors

### Borders not changing color
- Verify entity state is changing (`on`/`off`)
- Check `style.border.top.color` configuration
- Entity domain must support state classification (light, switch, number, input_number)

### Animation not showing
- Verify `show_animation: true` (default)
- Check `style.animation.indicator.color` isn't transparent

### Ranges not appearing
- Ensure `ranges` array is defined in config
- Verify range `min` and `max` values are within display range
- Check zone injection in browser dev tools (look for `#range-zone`)

---

For more information, see:
- Main documentation: `doc/cards/slider/README.md`
- Component architecture: `doc/architecture/subsystems/components.md`
