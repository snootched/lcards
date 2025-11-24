# Overlay System Guide

> **Visual elements layered on your LCARS interface**
> Overlays are interactive and informational elements positioned over your LCARS background, connected to live data sources.

---

## ⚠️ Important: Overlay Type Changes (v1.16.22+)

As of v1.16.22+, MSD supports only **2 overlay types**:

| Type | Description |
|------|-------------|
| **line** | SVG line/path overlays for visual connectors |
| **card** / **control** | Embedded Home Assistant cards (SimpleCards, custom cards, built-in cards) |

**Previous overlay types have been removed:**
- ❌ `text` → Use SimpleCards (e.g., `lcards-text-card`)
- ❌ `button` → Use SimpleCards (e.g., `lcards-button-card`)
- ❌ `status_grid` → Use SimpleCards with grid layout
- ❌ `apexchart` → Use `SimpleChart` card

---

## 📋 Table of Contents

1. [Current Overlay Types](#current-overlay-types)
2. [Line Overlay](#line-overlay)
3. [Card/Control Overlay](#cardcontrol-overlay)
4. [Migrating from Legacy Overlays](#migrating-from-legacy-overlays)
5. [Common Concepts](#common-concepts)
6. [Best Practices](#best-practices)

---

## Current Overlay Types

### Quick Comparison

| Type | Best For | Complexity |
|------|----------|------------|
| **line** | Visual connectors, dividers, paths | ⭐ Simple |
| **card/control** | Any HA card functionality | ⭐⭐ Moderate |

### Architecture

```yaml
# Current overlay structure
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
- LCARdS SimpleCards (`custom:lcards-*`)
- Any custom Home Assistant card
- Built-in HA cards (button, light, entities, etc.)

**Use cases:**
- Light and device controls
- Sensor displays
- Charts and graphs (via SimpleChart)
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

## Migrating from Legacy Overlays

### Text Overlay → SimpleCard

**Before (deprecated):**
```yaml
overlays:
  - id: temp_display
    type: text
    source: temperature
    position: [100, 100]
    style:
      content: "Temperature: {value}°F"
      font_size: 24px
      color: var(--lcars-orange)
```

**After (current):**
```yaml
overlays:
  - id: temp_display
    type: control
    position: [100, 100]
    size: [200, 50]
    card:
      type: custom:lcards-text-card
      entity: sensor.temperature
      content: "Temperature: {{ state }}°F"
      style:
        font_size: 24px
        color: var(--lcars-orange)
```

### Button Overlay → SimpleCard

**Before (deprecated):**
```yaml
overlays:
  - id: light_toggle
    type: button
    source: light.living_room
    position: [100, 100]
    size: [200, 60]
    style:
      label: "Living Room"
      color: var(--lcars-orange)
    actions:
      - service: light.toggle
```

**After (current):**
```yaml
overlays:
  - id: light_toggle
    type: control
    position: [100, 100]
    size: [200, 60]
    card:
      type: custom:lcards-button-card
      entity: light.living_room
      name: "Living Room"
      tap_action:
        action: toggle
```

### ApexCharts Overlay → SimpleChart

**Before (deprecated):**
```yaml
overlays:
  - id: temp_chart
    type: apexchart
    source: temperature
    position: [100, 100]
    size: [400, 200]
    style:
      chart_type: line
```

**After (current):**
```yaml
overlays:
  - id: temp_chart
    type: control
    position: [100, 100]
    size: [400, 200]
    card:
      type: custom:lcards-simple-chart
      entity: sensor.temperature
      chart_type: line
      hours_to_show: 24
```

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

### Use SimpleCards for Content

Instead of MSD native overlays, use LCARdS SimpleCards:
- `lcards-button-card` - Interactive buttons
- `lcards-text-card` - Text displays
- `lcards-simple-chart` - Charts and graphs

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

## 📚 Related Documentation

### Current Overlay Guides
- **[Line Overlay Guide](line-overlay.md)** - SVG lines and paths
- **[Control Overlay Guide](control-overlay.md)** - Embedded HA cards

### SimpleCards
- **[SimpleChart Card](cards/simple-chart.md)** - Chart functionality
- **[SimpleButton Card](cards/simple-button.md)** - Button controls

### Architecture
- **[Control Overlay System](../../../architecture/subsystems/control-overlay-system.md)** - Technical details
- **[Advanced Renderer](../../../architecture/subsystems/advanced-renderer.md)** - Rendering system

---

**Last Updated:** November 2025
**Version:** 2025.11 (Post-Architecture Refactor)
**Current Overlay Types:** line, card/control
