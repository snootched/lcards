# Phase 5: Quick Reference Guide

## What Changed?

### 1. Line Editor Schema Fix ✅
**Before (Incorrect)**:
```yaml
overlays:
  - type: line
    id: line_1
    source: { type: 'anchor', id: 'cpu' }      # ❌ WRONG
    target: { type: 'anchor', id: 'memory' }   # ❌ WRONG
    routing: { mode: 'manhattan' }             # ❌ WRONG
    style:
      stroke: '#FF9900'                        # ❌ WRONG
      stroke_width: 3                          # ❌ WRONG
```

**After (Correct)**:
```yaml
overlays:
  - type: line
    id: line_1
    anchor: cpu                                # ✅ CORRECT
    attach_to: memory                          # ✅ CORRECT
    route: manhattan                           # ✅ CORRECT (string)
    style:
      color: '#FF9900'                         # ✅ CORRECT
      width: 3                                 # ✅ CORRECT
```

### 2. Channels Tab Implementation ✅
**New Feature**: Visual routing channel management

```yaml
channels:
  power_corridor:
    type: bundling          # Lines prefer to route through
    bounds: [100, 50, 200, 100]  # [x, y, width, height]
    priority: 10
    color: "#00FF00"
  
  avoid_zone:
    type: avoiding          # Lines try to avoid
    bounds: [400, 200, 150, 150]
    priority: 20
    color: "#FF0000"
```

---

## Line Editor Changes

### Property Mapping
| Old Property | New Property | Type | Notes |
|--------------|--------------|------|-------|
| `source` | `anchor` | string or [x,y] | Source point |
| `target` | `attach_to` | string or [x,y] | Target point |
| `source.point` | `anchor_side` | string | Only for overlays |
| `target.point` | `attach_side` | string | Only for overlays |
| `source.gap` | `anchor_gap` | number | Gap in pixels |
| `target.gap` | `attach_gap` | number | Gap in pixels |
| `routing.mode` | `route` | string | Direct string value |
| `style.stroke` | `style.color` | string | CSS color |
| `style.stroke_width` | `style.width` | number | Width in pixels |
| `style.stroke_dasharray` | `style.dash_array` | string | Dash pattern |

### Attachment Sides
Available when connecting to overlay IDs:
- `center` (default)
- `top`, `bottom`, `left`, `right`
- `top-left`, `top-right`, `bottom-left`, `bottom-right`

### Routing Modes
- `auto` - Smart routing with obstacle avoidance (default)
- `direct` - Straight line
- `manhattan` - 90° angles
- `orthogonal` - Right angles
- `bezier` - Curved
- `smart` - Optimized pathfinding
- `grid` - Grid-aligned

---

## Channels Tab Features

### Channel Types
1. **Bundling** 🟢
   - Lines prefer to route through these areas
   - Use for: Cable management, power corridors
   - Color: Green (#00FF00)

2. **Avoiding** 🔴
   - Lines try to stay out of these areas
   - Use for: Sensitive equipment, obstructions
   - Color: Red (#FF0000)

3. **Waypoint** 🔵
   - Lines must pass through these areas
   - Use for: Routing hubs, junctions
   - Color: Blue (#0000FF)

### Channel Properties
- **id**: Unique identifier (e.g., `power_corridor`)
- **type**: `bundling`, `avoiding`, or `waypoint`
- **bounds**: `[x, y, width, height]` in ViewBox coordinates
- **priority**: 1-100 (higher = stronger influence)
- **color**: Hex color for visualization in editor

### CRUD Operations
| Action | How To | Icon |
|--------|--------|------|
| **Create** | Click "Add Channel" button | ➕ |
| **Read** | View channel list in Channels tab | 👁️ |
| **Update** | Click pencil icon on channel item | ✏️ |
| **Delete** | Click trash icon, confirm deletion | 🗑️ |

### Draw Channel Mode
1. Click "Draw on Canvas" button
2. Cursor changes to crosshair ✚
3. Click first corner
4. Click second corner (diagonal)
5. Form opens with pre-calculated bounds

---

## UI Navigation

### MSD Studio Tabs
```
┌──────────────────────────────────────────────────────────┐
│  Base SVG  │  Anchors  │  Controls  │  Lines  │ Channels │ Debug │
└──────────────────────────────────────────────────────────┘
              Phase 2     Phase 3      Phase 4   ← Phase 5 → Phase 6
```

### Mode Toolbar
```
┌───────────────────────────────────────────────────────┐
│  👁️ View  │  📍 Place Anchor  │  🎛️ Place Control  │
│  📏 Connect Line  │  ▭ Draw Channel                 │
└───────────────────────────────────────────────────────┘
```

---

## Example Configurations

### Simple Line Between Anchors
```yaml
overlays:
  - type: line
    id: cpu_to_mem
    anchor: cpu_core
    attach_to: memory
    route: manhattan
    style:
      color: var(--lcars-orange)
      width: 2
```

### Line Between Overlays with Gaps
```yaml
overlays:
  - type: line
    id: status_connection
    anchor: status_panel      # Overlay ID
    anchor_side: right        # Only appears for overlays
    anchor_gap: 10
    attach_to: detail_panel
    attach_side: left
    attach_gap: 10
    route: auto
    style:
      color: var(--lcars-cyan)
      width: 3
```

### Styled Line with Markers
```yaml
overlays:
  - type: line
    id: data_flow
    anchor: source_anchor
    attach_to: target_anchor
    route: smart
    style:
      color: var(--lcars-yellow)
      width: 3
      dash_array: "5,5"
      marker_end:
        type: arrow
        size: medium
```

### Routing Channel
```yaml
channels:
  main_bus:
    type: bundling
    bounds: [300, 200, 400, 100]
    priority: 15
    color: "#00FF00"
```

---

## Common Workflows

### Create Line with Channels
1. **Setup**:
   - Add anchors or controls
   - Define routing channels

2. **Create Line**:
   - Lines Tab → Add Line
   - Select anchor and attach_to
   - Choose routing mode
   - Lines will consider channels during routing

3. **Verify**:
   - Preview shows line routing through/around channels
   - Save and test in dashboard

### Migrate Existing Config
Existing configs with old schema will continue to work:
- Editor will read both old and new properties
- Saved configs will use new schema
- No manual migration required

---

## Keyboard Shortcuts

| Action | Shortcut | Context |
|--------|----------|---------|
| Save | N/A | Click Save button |
| Cancel | N/A | Click Cancel button |
| Exit Mode | Click active mode again | Mode toolbar |
| Close Dialog | Click X or Cancel | Any dialog |

---

## Debug Visualization

Channels automatically render in editor preview:
- **Bundling**: Green dashed rectangle
- **Avoiding**: Red dashed rectangle
- **Waypoint**: Blue dashed rectangle
- **Label**: Shows channel ID and type

---

## Tips & Best Practices

### Lines
✅ **DO**:
- Use `auto` routing for flexible pathfinding
- Set gaps when attaching to overlays
- Use attachment sides for precise connections
- Test different routing modes for best results

❌ **DON'T**:
- Use old schema properties (source, target, routing.mode)
- Forget to set line IDs
- Overlap lines unnecessarily

### Channels
✅ **DO**:
- Use bundling channels for cable management areas
- Use avoiding channels around sensitive equipment
- Set higher priority for critical channels
- Name channels descriptively (e.g., `power_corridor_main`)

❌ **DON'T**:
- Create overlapping channels with conflicting types
- Set extremely high priorities unless necessary
- Make channels too small (hard to route through)

---

## Schema Reference

### Official Documentation
- **Line Schema**: `doc/architecture/schemas/line-overlay-schema-definition.md`
- **MSD Schema**: `doc/architecture/schemas/msd-schema-definition.md`

### Key Differences
| Aspect | Old Schema | New Schema |
|--------|-----------|------------|
| Source | Object with type/id | String or array |
| Target | Object with type/id | String or array |
| Routing | Object | String |
| Style | stroke/stroke_width | color/width |
| Sides | Nested in point | Top-level properties |

---

## Troubleshooting

### Line doesn't appear
- ✅ Check anchor/attach_to values are valid
- ✅ Verify overlays exist if referencing overlay IDs
- ✅ Check style.color is set
- ✅ Try different routing modes

### Channel not showing
- ✅ Verify routing_channels enabled in debug settings
- ✅ Check bounds are within viewBox
- ✅ Ensure color is valid hex

### Form doesn't save
- ✅ Fill required fields (ID)
- ✅ Check for validation errors
- ✅ Check browser console for errors

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| Phase 5 | 2026-01-10 | Line schema fix + Channels tab |
| Phase 4 | 2025-12 | Lines tab (incorrect schema) |
| Phase 3 | 2025-12 | Controls management |
| Phase 2 | 2025-11 | Base SVG + Anchors |
| Phase 1 | 2025-11 | Studio foundation |

---

**Quick Access**:
- Testing Guide: `PHASE5_TESTING_GUIDE.md`
- Implementation Summary: This file
- Schema Definition: `doc/architecture/schemas/line-overlay-schema-definition.md`

---

**Status**: ✅ Implementation Complete | 🧪 Testing Required
**Version**: Phase 5.0
**Last Updated**: 2026-01-10
