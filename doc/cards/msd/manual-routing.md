# Manual Routing Guide

**Last Updated**: January 23, 2026
**LCARdS Version**: 1.29.07

## Overview

Manual routing allows you to explicitly define the path a line takes by specifying waypoints. The line will travel through each waypoint **in the order they appear in the array**.

## Configuration

```yaml
type: custom:lcards-msd-card
msd:
  overlays:
    - type: line
      id: my_line
      anchor: start_point
      attach_to: end_point
      route: manual           # Enables manual routing
      waypoints:              # Array processed in order
        - [100, 200]          # Waypoint 1: coordinate waypoint (line goes here first)
        - "nav_anchor"        # Waypoint 2: named anchor (follows anchor position)
        - [300, 400]          # Waypoint 3: coordinate waypoint (then here)
        # Finally connects to attach_to endpoint
      style:
        color: var(--lcars-blue)
        width: 2
```

## Waypoint Syntax

Waypoints support two formats:

### Coordinate Waypoints

Fixed coordinates in the viewBox coordinate system:

```yaml
waypoints:
  - [150, 200]  # Fixed position at x=150, y=200
  - [300, 200]  # Fixed position at x=300, y=200
```

### Named Anchor Waypoints

Reference anchor names to create dynamic waypoints that follow anchors:

```yaml
waypoints:
  - "my_anchor"        # Routes through anchor at runtime
  - [300, 200]         # Then to fixed coordinate
  - "other_anchor"     # Then through another anchor
```

**Benefits of Named Anchors:**
- ✅ Waypoints automatically update when anchors move
- ✅ Cleaner configuration for routing through specific controls
- ✅ Easier to maintain when layout changes
- ✅ Reduces coupling to specific coordinates

**How It Works:**
The router resolves anchor names to their current coordinates at render time. If an anchor moves, all lines using it as a waypoint automatically adjust.

## Waypoint Order Matters

⚠️ **CRITICAL**: Waypoints are processed **sequentially** in array order. The line path will be:

```
anchor → waypoint[0] → waypoint[1] → waypoint[2] → ... → attach_to
```

### Example: Order Impact

**Config A** (horizontal then vertical):
```yaml
waypoints:
  - [300, 100]  # Move right first
  - [300, 400]  # Then down
```
Creates an L-shaped path going **right → down**.

**Config B** (vertical then horizontal):
```yaml
waypoints:
  - [300, 400]  # Move down first
  - [300, 100]  # Then up (doubles back!)
```
Creates a path going **down → up** - the line appears to "double back" on itself.

## Visual Editing in MSD Studio

### Entering Waypoint Mode

1. **Hover over any line** - Line shows subtle blue glow indicating it's selectable
2. **Click the line** - Line highlights with **blue glow** and enters waypoint mode
3. Cursor changes to **crosshair**
4. Existing waypoints show as **numbered green circles**

### Exiting Waypoint Mode

**Three ways to exit:**
- Click on **empty canvas area** (not on lines, waypoints, or overlays)
- Press **ESC** key
- Click **View Mode** in the toolbar

### Waypoint Markers

- **Green circles with numbers** (1, 2, 3...) show processing order
- **Number indicates position in waypoints array**
- Line follows: `start → 1 → 2 → 3 → end`

### Adding Waypoints

**Coordinate Waypoints:**
1. Click anywhere on the canvas
2. New waypoint added **at the end** of the array (highest number)
3. Line automatically converts to `route: manual`

**Named Anchor Waypoints:**
1. Enable **Show Anchors** in canvas toolbar
2. Click any **yellow anchor marker**
3. Anchor name added as waypoint (e.g., `"nav_anchor"`)
4. Line will route through the anchor's position
5. If anchor moves, line automatically adjusts

### Reordering Waypoints

**Currently**: Waypoints can only be added at the end.

**To reorder**: Edit YAML directly or delete/re-add in desired order.

### Editing Waypoints

- **Drag marker**: Repositions that waypoint
- **Double-click marker**: Deletes that waypoint (renumbers remaining)

### Example Workflow

```
Initial: start → end (no waypoints)

Click line → Click canvas at [200, 100]:
  Waypoint 1 appears
  Path: start → ① → end

Click canvas at [400, 100]:
  Waypoint 2 appears
  Path: start → ① → ② → end

Double-click waypoint 1:
  Waypoint 1 deleted
  Waypoint 2 becomes waypoint 1
  Path: start → ① → end
```

## Best Practices

### Planning Routes

1. **Sketch the path** on paper showing anchor → WP1 → WP2 → target
2. **Work left-to-right or top-to-bottom** to avoid doubling back
3. **Use channels** for complex routing instead of many waypoints

### Avoiding Double-Back

❌ **Bad** (doubles back):
```yaml
waypoints:
  - [100, 200]  # Go left
  - [400, 200]  # Go right (crosses previous path)
  - [400, 400]  # Go down
```

✅ **Good** (progressive path):
```yaml
waypoints:
  - [200, 200]  # Gradual right
  - [300, 300]  # Down-right diagonal
  - [400, 400]  # Continue to target
```

### When to Use Manual Routing

**Use manual routing when**:
- Path must follow specific design constraints
- Avoiding channels/obstacles in custom ways
- Creating decorative curved paths
- Debugging smart routing behavior

**Use smart/grid routing when**:
- Path needs to adapt to layout changes
- Many lines share similar routing patterns
- Channels define clear routing zones
- Config maintenance is a priority

## Technical Details

### Path Algorithm

```javascript
// Simplified RouterCore._computeManual() logic
const pts = [
  [anchorX, anchorY],          // Start
  ...waypoints,                 // All waypoints in order
  [attachToX, attachToY]        // End
];

// Remove duplicate consecutive points
// Convert to SVG path string
```

### Coordinate System

- **Waypoints use viewBox coordinates** (not pixel positions)
- **Origin (0,0)** at top-left of viewBox
- **X increases right**, **Y increases down**

### Example Coordinate Calculation

```yaml
view_box: [0, 0, 1920, 1080]  # Full HD viewBox

# Waypoint at center of screen:
waypoints:
  - [960, 540]  # viewBox center (not window pixels)
```

## Troubleshooting

### Line Not Routing Through Waypoints

**Symptom**: Line ignores waypoints, routes directly to target.

**Cause**: `route` field not set to `'manual'`.

**Fix**:
```yaml
route: manual  # REQUIRED for waypoints to work
waypoints:
  - [100, 200]
```

### Line Doubles Back Unexpectedly

**Symptom**: Line crosses itself or zigzags.

**Cause**: Waypoint order creates backtracking path.

**Fix**: Reorder waypoints to follow a progressive path. Check numbered markers in editor.

### Waypoints Not Visible in Editor

**Symptom**: Click line but no numbered circles appear.

**Cause 1**: Line not selected (no blue glow).
**Fix**: Click the line path itself, not empty space.

**Cause 2**: Waypoints array empty.
**Fix**: Add waypoints by clicking canvas in ADD_WAYPOINT mode.
