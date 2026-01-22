# Overlay System Guide

> **Visual elements layered on your LCARS interface**
> Overlays are interactive and informational elements positioned over your LCARS background, connected to live data sources.

---

## Table of Contents

1. [Overlay Types](#overlay-types)
2. [Line Overlay](#line-overlay)
3. [Card/Control Overlay](#cardcontrol-overlay)
4. [Common Concepts](#common-concepts)
5. [Best Practices](#best-practices)

---

## Overlay Types

MSD supports **2 overlay types**:

| Type | Description |
|------|-------------|
| **line** | SVG line/path overlays for visual connectors |
| **card** / **control** | Embedded Home Assistant cards (LCARdS Cards, custom cards, built-in cards) |

### Quick Comparison

| Type | Best For | Complexity |
|------|----------|------------|
| **line** | Visual connectors, dividers, paths | ⭐ Simple |
| **card/control** | Any HA card functionality | ⭐⭐ Moderate |

### Example

```yaml
# Overlay structure
overlays:
  # Line overlay
  - id: power_line
    type: line
    attach_start: panel1.middle-right
    attach_end: panel2.middle-left
    style:
      color: var(--lcars-orange)
      stroke_width: 2
      marker_end: arrow

  # Card/Control overlay - embed any HA card
  - id: temp_display
    type: control
    position: [100, 100]
    size: [200, 80]
    card:
      type: custom:lcards-text-card
      entity: sensor.temperature
      content: "Temperature: {value}°F"
```

---

## Line Overlay

**Visual connectors and paths between elements**

```yaml
overlays:
  - id: connection_line
    type: line
    attach_start: sensor_panel.middle-right
    attach_end: display_panel.middle-left
    style:
      color: var(--lcars-blue)
      stroke_width: 2
      marker_end: arrow
```

**Use cases:**
- Connection indicators between panels
- Visual dividers
- Data flow visualization
- Decorative accents
- LCARS-style routing lines

**Capabilities:**
- ✅ Attachment point system (9 points per overlay)
- ✅ Custom markers (arrow, diamond, circle)
- ✅ Dash patterns
- ✅ LCARS color integration
- ✅ Animated drawing

📖 **[Complete Line Overlay Guide →](line-overlay.md)**

---

## Card/Control Overlay

**Embed any Home Assistant card in your MSD**

```yaml
overlays:
  - id: light_control
    type: control  # or use 'card', 'custom:*', 'hui-*'
    position: [100, 100]
    size: [200, 80]
    card:
      type: custom:lcards-button-card
      entity: light.living_room
      name: "Living Room"
```

**Supported card types:**
- LCARdS LCARdS Cards (`custom:lcards-*`)
- Any custom Home Assistant card
- Built-in HA cards (button, light, entities, etc.)

**Use cases:**
- Light and device controls
- Sensor displays
- Charts and graphs (via LCARdS Chart)
- Status displays
- Interactive controls

**Capabilities:**
- ✅ Full HA card functionality
- ✅ Real-time state updates
- ✅ Actions and interactions
- ✅ Theme integration
- ✅ Attachment points for line connections

📖 **[Complete Control Overlay Guide →](control-overlay.md)**

---

## Common Concepts

### Positioning

All overlays use absolute positioning:

```yaml
position: [x, y]    # [horizontal, vertical] in viewBox units
```

### Sizing

Card overlays require explicit size:

```yaml
size: [width, height]    # [horizontal, vertical] in viewBox units
```

### Attachment Points

Both line and card overlays support 9-point attachment:

```
top-left    top-center    top-right
middle-left middle-center middle-right
bottom-left bottom-center bottom-right
```

Usage:
```yaml
attach_start: overlay_id.middle-right
attach_end: another_overlay.middle-left
```

---

## Best Practices

### Use LCARdS Cards for Content

Use LCARdS LCARdS Cards for interactive content:
- `lcards-button-card` - Interactive buttons
- `lcards-text-card` - Text displays
- `lcards-chart` - Charts and graphs

### Keep Lines Simple

Lines are best for visual connections:
```yaml
- id: data_flow
  type: line
  attach_start: input.middle-right
  attach_end: output.middle-left
  style:
    marker_end: arrow
```

### Use Anchors for Positioning

Define anchors for consistent positioning:
```yaml
anchors:
  left_panel:
    position: [50, 100]
    size: [300, 200]
  right_panel:
    position: [400, 100]
    size: [300, 200]

overlays:
  - id: connector
    type: line
    attach_start: left_panel.middle-right
    attach_end: right_panel.middle-left
```

---

## Related Documentation

### Overlay Guides
- **[Line Overlay Guide](line-overlay.md)** - SVG lines and paths
- **[Control Overlay Guide](control-overlay.md)** - Embedded HA cards

### Architecture
- **[Control Overlay System](../../../architecture/subsystems/control-overlay-system.md)** - Technical details
- **[Advanced Renderer](../../../architecture/subsystems/advanced-renderer.md)** - Rendering system

---

[← Back to Configuration](../README.md) | [User Guide →](../../README.md)
