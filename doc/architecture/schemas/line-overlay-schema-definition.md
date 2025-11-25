# Line Overlay - Official Schema Definition

**Date:** November 2025
**Purpose:** Single source of truth for MSD line overlay configuration
**Status:** 🎯 DEFINITIVE - All implementations must match this

**Architecture:** SVG line/path rendering with intelligent routing and overlay-to-overlay attachment

---

## Overview

Line overlays are SVG-based visual connectors in MSD cards that:
- Connect anchors, overlays, or arbitrary coordinates
- Support intelligent routing with obstacle avoidance
- Provide 9-point attachment to any overlay (center + 8 directions)
- Include advanced styling (gradients, patterns, markers, effects)
- Integrate with the animation system

---

## Complete YAML Schema

```yaml
# ==============================================================================
# LINE OVERLAY CONFIGURATION
# ==============================================================================

overlays:
  - id: <overlay-id>                     # Required: Unique identifier
    type: line                           # Required: Must be "line"

    # ==========================================================================
    # SOURCE ATTACHMENT (anchor)
    # ==========================================================================

    anchor: <anchor-id> | <overlay-id> | [x, y]
      # Description: Starting point for the line
      # Values:
      #   - anchor_id: Static anchor from anchors: section
      #   - overlay_id: Any overlay ID (control, etc.) for overlay-to-overlay connection
      #   - [x, y]: Static coordinates (numbers or percentages)
      # Examples:
      #   anchor: cpu_core              # Static anchor
      #   anchor: temp_button           # Overlay attachment
      #   anchor: [100, 200]            # Static coordinates
      #   anchor: ["50%", "25%"]        # Percentage coordinates

    anchor_side: <attachment-side>
      # Description: Which side/corner of the source to attach from
      # Required: Only when anchor is an overlay_id (auto-determined if omitted)
      # Default: auto (determined by target position)
      # Values:
      #   center | top | bottom | left | right |
      #   top-left | top-right | bottom-left | bottom-right |
      #   topLeft | topRight | bottomLeft | bottomRight (aliases)
      # Gap Direction: First part of compound names determines gap direction
      #   - top-* → gap moves UP (negative Y)
      #   - bottom-* → gap moves DOWN (positive Y)
      #   - left-* → gap moves LEFT (negative X)
      #   - right-* → gap moves RIGHT (positive X)
      # Example:
      #   anchor_side: right            # Attach from right side
      #   anchor_side: bottom-right     # Attach from bottom-right corner

    anchor_gap: <number>
      # Description: Gap offset from the source attachment point (pixels)
      # Default: 0
      # Direction: Applied outward from the source based on anchor_side
      # Example:
      #   anchor_gap: 8                 # 8px gap from source edge

    # ==========================================================================
    # TARGET ATTACHMENT (attach_to)
    # ==========================================================================

    attach_to: <anchor-id> | <overlay-id> | [x, y]
      # Description: Ending point for the line
      # Values:
      #   - anchor_id: Static anchor from anchors: section
      #   - overlay_id: Any overlay ID for overlay-to-overlay connection
      #   - [x, y]: Static coordinates (numbers or percentages)
      # Examples:
      #   attach_to: memory_bank        # Static anchor
      #   attach_to: chart_overlay      # Overlay attachment
      #   attach_to: [800, 300]         # Static coordinates

    attach_side: <attachment-side>
      # Description: Which side/corner of the target to attach to
      # Required: Only when attach_to is an overlay_id (auto-determined if omitted)
      # Default: auto (determined by source position)
      # Values: Same as anchor_side
      # Example:
      #   attach_side: left             # Attach to left side
      #   attach_side: top-right        # Attach to top-right corner

    attach_gap: <number>
      # Description: Gap offset from the target attachment point (pixels)
      # Default: 0
      # Direction: Applied outward from the target based on attach_side
      # Example:
      #   attach_gap: 12                # 12px gap from target edge

    # ==========================================================================
    # ROUTING OPTIONS
    # ==========================================================================

    route: auto | manhattan | grid | smart | direct
      # Description: Routing strategy for path calculation
      # Values:
      #   - auto: Smart pathfinding with obstacle avoidance (default)
      #   - manhattan: Right-angle paths only (horizontal/vertical)
      #   - grid: A* grid-based pathfinding
      #   - smart: Optimized routing with cost analysis
      #   - direct: Straight line (no routing)

    route_mode: <mode>
      # Description: Explicit routing mode (overrides 'route' if present)
      # Used for fine-grained control over routing behavior

    route_channels: [<channel-ids>]
      # Description: Channel-aware routing using defined channels
      # Channels are rectangular areas that guide line paths
      # Example:
      #   route_channels: [main_bus, aux_bus]

    channel_mode: prefer | avoid | force
      # Description: How to use specified channels
      # Values:
      #   - prefer: Try to use channels when beneficial (default)
      #   - avoid: Stay away from channels
      #   - force: Must use channels

    clearance: <number>
      # Description: Minimum pixels from obstacles
      # Default: Inherited from routing.clearance (global default: 8)

    proximity: <number>
      # Description: Penalty weight for proximity to obstacles
      # Higher values push lines further from obstacles

    # ==========================================================================
    # CORNER AND SMOOTHING
    # ==========================================================================

    corner_style: round | bevel | miter
      # Description: Style for path corners/elbows
      # Values:
      #   - miter: Sharp vertex (default)
      #   - round: Arc radius at corners (uses corner_radius)
      #   - bevel: Straight cut at corners

    corner_radius: <number>
      # Description: Arc radius for round corners (pixels)
      # Note: Capped to half of adjacent segment length
      # Default: 12
      # Example:
      #   corner_radius: 20             # 20px corner arcs

    smoothing_mode: none | chaikin
      # Description: Path smoothing algorithm
      # Values:
      #   - none: No smoothing (default)
      #   - chaikin: Corner-cutting smoothing

    smoothing_iterations: <number>
      # Description: Number of smoothing passes
      # More iterations = smoother curves, more points
      # Default: 0

    smoothing_max_points: <number>
      # Description: Maximum points after smoothing (safety cap)
      # Default: Inherited from routing.smoothing_max_points

    # ==========================================================================
    # VISUAL STYLE
    # ==========================================================================

    style:
      # --- Core Stroke Properties ---
      color: <color>
        # Stroke color
        # Values: CSS variable, hex, rgb, theme token
        # Examples:
        #   color: var(--lcars-orange)
        #   color: "#FF9900"
        #   color: theme:colors.primary.orange

      width: <number>
        # Stroke width in pixels
        # Default: 2

      opacity: <number>
        # Stroke opacity (0-1)
        # Default: 1

      # --- Stroke Styling ---
      line_cap: round | butt | square
        # SVG stroke-linecap
        # Default: butt

      line_join: round | bevel | miter
        # SVG stroke-linejoin
        # Default: miter

      miter_limit: <number>
        # Miter limit for sharp corners
        # Default: 4

      # --- Dash Patterns ---
      dash_array: <string>
        # SVG stroke-dasharray
        # Format: "dash,gap" or "dash,gap,dash,gap,..."
        # Examples:
        #   dash_array: "6,2"           # 6px dash, 2px gap
        #   dash_array: "10,5,2,5"      # Alternating pattern

      dash_offset: <number>
        # SVG stroke-dashoffset (pixels)
        # Shifts the dash pattern

      # --- Fill Properties ---
      fill: <color> | none
        # Fill color (for thick lines or effects)
        # Default: none

      fill_opacity: <number>
        # Fill opacity (0-1)
        # Default: 1

      # --- Gradient Support ---
      gradient:
        type: linear | radial
          # Gradient type

        direction: horizontal | vertical | diagonal | diagonal-reverse
          # Direction for linear gradients
          # Default: horizontal

        stops:
          - offset: "<pct>%"           # Position (0-100%)
            color: <color>             # Color at position
          # At least 2 stops required
          # Example:
          #   stops:
          #     - offset: "0%"
          #       color: "#ff6600"
          #     - offset: "100%"
          #       color: "#ffcc00"

      # --- Pattern Support ---
      pattern:
        type: dots | grid | diagonal
          # Pattern type

        size: <number>
          # Pattern element size in pixels

        color: <color>
          # Pattern color

        opacity: <number>
          # Pattern opacity (0-1)

      # --- Markers (Line Endpoints/Midpoints) ---
      marker_start:
        type: arrow | dot | diamond | square
          # Marker shape

        size: small | medium | large
          # Marker size preset

        color: <color>
          # Marker color (defaults to line color)

        rotate: <boolean>
          # Rotate marker with line direction
          # Default: true for arrows

      marker_mid:
        type: <marker-type>
        size: <size>
        color: <color>
        # Applied at path midpoints (for multi-segment paths)

      marker_end:
        type: <marker-type>
        size: <size>
        color: <color>
        rotate: <boolean>

      # --- Effects ---
      glow:
        color: <color>
          # Glow color

        size: <number>
          # Glow blur radius (pixels)

        opacity: <number>
          # Glow opacity (0-1)

      shadow:
        color: <color>
          # Shadow color

        offset: [<x>, <y>]
          # Shadow offset [x, y] in pixels

        blur: <number>
          # Shadow blur radius (pixels)

    # ==========================================================================
    # ANIMATION
    # ==========================================================================

    animation_ref: <animation-id>
      # Reference to animation definition in animations: section
      # Enables animated line effects (trace, pulse, draw, etc.)
```

---

## Overlay-to-Overlay Attachment

Lines can attach to control overlays and static anchors:

### Attachment Points

Control overlays provide 9 attachment points (computed by MsdControlsRenderer):
```
    top-left     top-center     top-right
         ○────────────○────────────○
         │                         │
   left  ○         center          ○  right
         │            ○            │
         │                         │
         ○────────────○────────────○
 bottom-left   bottom-center   bottom-right
```

### Auto-Determination

When `anchor_side` or `attach_side` is not specified, the system automatically determines the best side based on the relative positions of source and target:

```yaml
# Source to the left of target → uses right/left sides
overlays:
  - id: button_left
    type: control
    position: [100, 100]
    size: [100, 50]

  - id: button_right
    type: control
    position: [300, 100]
    size: [100, 50]

  - id: connecting_line
    type: line
    anchor: button_left        # Auto: right side
    attach_to: button_right    # Auto: left side
```

### Gap Application

Gap is applied in the direction determined by the attachment side:

| Side | Gap Direction |
|------|---------------|
| `left` | LEFT (negative X) |
| `right` | RIGHT (positive X) |
| `top` | UP (negative Y) |
| `bottom` | DOWN (positive Y) |
| `top-left` | UP + LEFT |
| `top-right` | UP + RIGHT |
| `bottom-left` | DOWN + LEFT |
| `bottom-right` | DOWN + RIGHT |

---

## Routing Configuration

### Global Defaults

Set in the `routing:` section of MSD config:

```yaml
routing:
  default_mode: manhattan
  clearance: 8
  grid_resolution: 56
  cost_defaults:
    distance: 1
    bend: 12
    proximity: 4
    channel: 0.6
  smoothing_mode: none
  smoothing_iterations: 0
```

### Per-Overlay Overrides

Line overlays can override global routing:

```yaml
overlays:
  - id: priority_line
    type: line
    anchor: source
    attach_to: target
    route: grid
    clearance: 16              # Override global
    corner_style: round
    corner_radius: 20
    smoothing_mode: chaikin
    smoothing_iterations: 2
```

### Channel-Based Routing

Define channels for guided routing:

```yaml
routing:
  channels:
    - id: main_bus
      rect: [400, 200, 800, 120]  # [x, y, width, height]
    - id: aux_bus
      rect: [400, 600, 800, 120]

overlays:
  - id: guided_line
    type: line
    anchor: source
    attach_to: target
    route_channels: [main_bus]
    channel_mode: prefer
```

---

## Complete Examples

### Example 1: Simple Line Between Anchors

```yaml
anchors:
  cpu: [100, 100]
  memory: [400, 100]

overlays:
  - id: cpu_to_memory
    type: line
    anchor: cpu
    attach_to: memory
    style:
      color: var(--lcars-orange)
      width: 2
```

### Example 2: Overlay-to-Overlay with Gaps

```yaml
overlays:
  - id: status_panel
    type: control
    position: [50, 50]
    size: [200, 100]
    card:
      type: custom:lcards-simple-button
      entity: sensor.status

  - id: detail_panel
    type: control
    position: [400, 50]
    size: [250, 120]
    card:
      type: entities
      entities:
        - sensor.temperature

  - id: connection
    type: line
    anchor: status_panel
    anchor_side: right
    anchor_gap: 10
    attach_to: detail_panel
    attach_side: left
    attach_gap: 10
    style:
      color: var(--lcars-cyan)
      width: 3
      corner_style: round
      corner_radius: 15
```

### Example 3: Styled Line with Markers

```yaml
overlays:
  - id: data_flow
    type: line
    anchor: [100, 150]
    attach_to: [600, 150]
    route: manhattan
    style:
      color: var(--lcars-yellow)
      width: 3
      opacity: 0.9
      line_cap: round
      marker_start:
        type: dot
        size: medium
        color: var(--lcars-blue)
      marker_end:
        type: arrow
        size: large
        color: var(--lcars-yellow)
        rotate: true
      glow:
        color: var(--lcars-yellow)
        size: 6
        opacity: 0.5
```

### Example 4: Animated Gradient Line

```yaml
animations:
  - id: trace_flow
    preset: motionpath
    params:
      duration: 3000
      loop: true

overlays:
  - id: animated_line
    type: line
    anchor: source_anchor
    attach_to: target_anchor
    route: smart
    corner_style: round
    corner_radius: 12
    style:
      width: 4
      gradient:
        type: linear
        direction: horizontal
        stops:
          - offset: "0%"
            color: "#ff6600"
          - offset: "50%"
            color: "#ffcc00"
          - offset: "100%"
            color: "#ff6600"
    animation_ref: trace_flow
```

### Example 5: Dashed Line with Shadow

```yaml
overlays:
  - id: secondary_connection
    type: line
    anchor: panel_a
    anchor_side: bottom
    attach_to: panel_b
    attach_side: top
    attach_gap: 8
    style:
      color: var(--lcars-gray)
      width: 2
      dash_array: "8,4"
      dash_offset: 0
      shadow:
        color: "rgba(0,0,0,0.3)"
        offset: [2, 2]
        blur: 4
```

---

## Priority Resolution

When resolving attachment points, the system uses this priority:

1. **Overlay attachment points** - If target is an overlay ID with attachment points
2. **Static anchors** - From the `anchors:` section
3. **Coordinate arrays** - Direct `[x, y]` coordinates

---

## Implementation Notes

### Attachment Point Registration

Control overlays register their attachment points during rendering via `MsdControlsRenderer`. The `AttachmentPointManager` singleton maintains all attachment points.

### Virtual Anchors

When a line attaches to an overlay with a specific side, a virtual anchor is created:
- `overlay_id` → center point
- `overlay_id.right` → right side center
- `overlay_id.top-left` → top-left corner

### Path Caching

LineOverlay caches computed paths for performance. Paths are invalidated when:
- Source or target position changes
- Routing parameters change
- Obstacles/channels change

---

**Status:** 🎯 DEFINITIVE SCHEMA - Use this for line overlay implementations
