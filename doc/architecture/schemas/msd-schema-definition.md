# MSD (Master Systems Display) Card - Official Schema Definition

**Date:** January 11, 2026
**Purpose:** Single source of truth for MSD card configuration
**Status:** 🎯 DEFINITIVE - All implementations must match this
**Version:** 1.22+

**Architecture:** Complex multi-overlay SVG display system with intelligent routing, channels, rules, and animations

---

## ⚠️ Schema Registration (v1.22+)

**Pattern**: MSD card self-registers schema (standard LCARdS pattern)

```javascript
// MSD follows standard LCARdS card pattern:
LCARdSMSDCard.registerSchema();  // Called by lcards.js
```

**Schema Location:** `src/cards/schemas/msd-schema.js`
**Overlay Schemas:** Line and control overlay schemas in `src/core/validation-service/schemas/` (rendering infrastructure)

---

## ⚠️ Breaking Changes (v1.22+)

**Removed Fields:**
- ❌ `use_packs` - Packs now loaded globally by PackManager at startup
- ❌ `version` - No longer required in MSD configuration

**Deprecated Overlay Types:**
The following overlay types have been removed. Use LCARdS cards instead:
- ❌ `text` → Use `custom:lcards-button` with text configuration
- ❌ `button` → Use `custom:lcards-button`
- ❌ `status_grid` → Use grid of `custom:lcards-button` cards
- ❌ `apexchart` → Use `custom:lcards-chart`

**Valid Overlay Types (v1.22+):**
- ✅ `line` - SVG line/path with intelligent routing
- ✅ `control` - Embedded Home Assistant card (including all LCARdS cards)

---

## Overview

MSD (Master Systems Display) cards are the advanced card type in LCARdS, supporting:
- **Base SVG** with filters and transformations
- **Anchors** for named positioning points
- **2 overlay types:** `line` for SVG paths and `control` for embedded cards
- **Intelligent routing** with Manhattan, grid, and smart pathfinding algorithms
- **Routing channels** for controlled line bundling/avoidance
- **Global routing configuration** with smoothing, clearance, and smart routing parameters
- Integration with singleton systems (RulesEngine, DataSourceManager, ThemeManager)

**Important:** MSD cards use DataSourceManager for entity data. For lightweight entity access, use Simple Cards.

---

## Minimal Example

Basic MSD card with base SVG, anchors, and overlays:

```yaml
type: custom:lcards-msd-card

msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    filter_preset: dimmed

  anchors:
    cpu_core: [120, 80]
    memory_bank: [400, 80]
    temp_display: [50, 50]

  overlays:
    # Line connecting two anchors
    - id: cpu_memory_line
      type: line
      anchor: cpu_core
      attach_to: memory_bank
      style:
        color: var(--lcars-orange)
        width: 2

    # Embedded LCARdS button card
    - id: temp_button
      type: control
      position: temp_display
      size: [200, 60]
      card:
        type: custom:lcards-button
        entity: sensor.cpu_temp
        name: CPU Temperature
```

---

## Complete YAML Schema

```yaml
# ==============================================================================
# MSD CARD CONFIGURATION
# ==============================================================================

type: custom:lcards-msd-card | custom:lcards-msd | custom:cb-lcars-card
  # Required: Card type identifier

msd:
  # ==========================================================================
  # BASE SVG CONFIGURATION
  # ==========================================================================

  base_svg:
    # Required: Base SVG configuration

    source: <svg-source>
      # Required: SVG source
      # Values:
      #   - builtin:<key> - Built-in SVG from AssetManager
      #   - /local/path.svg - Local file in www/ folder
      #   - none - No base SVG (view_box required)
      # Examples:
      #   source: builtin:ncc-1701-a-blue
      #   source: /local/my-ship.svg
      #   source: none

    filter_preset: <preset-name>
      # Optional: CSS filter preset to apply
      # Values: dimmed | subtle | backdrop | faded | red-alert | monochrome | none
      # Default: none
      # Example:
      #   filter_preset: dimmed

    filters:
      # Optional: Custom filter values (overrides preset)
      opacity: <0-1>
        # Optional: Opacity value (0 = transparent, 1 = opaque)
        # Example: opacity: 0.3

      blur: <css-length>
        # Optional: Blur radius
        # Example: blur: "3px"

      brightness: <number>
        # Optional: Brightness multiplier (1 = normal)
        # Example: brightness: 0.8

      contrast: <number>
        # Optional: Contrast multiplier (1 = normal)
        # Example: contrast: 1.2

      grayscale: <0-1>
        # Optional: Grayscale amount (0 = color, 1 = grayscale)
        # Example: grayscale: 0.5

      hue_rotate: <css-angle>
        # Optional: Hue rotation angle
        # Example: hue_rotate: "90deg"

      invert: <0-1>
        # Optional: Invert amount (0 = normal, 1 = inverted)
        # Example: invert: 0.8

      saturate: <number>
        # Optional: Saturation multiplier (1 = normal)
        # Example: saturate: 1.5

      sepia: <0-1>
        # Optional: Sepia tone amount (0 = none, 1 = full sepia)
        # Example: sepia: 0.6

  # ==========================================================================
  # VIEW BOX CONFIGURATION
  # ==========================================================================

  view_box: auto | [minX, minY, width, height]
    # Optional: SVG viewBox for coordinate system
    # Default: auto (extracted from base_svg)
    # Values:
    #   - auto - Auto-extract from base SVG
    #   - [minX, minY, width, height] - Explicit viewBox
    # Required: When base_svg.source is "none"
    # Examples:
    #   view_box: auto
    #   view_box: [0, 0, 800, 600]

  # ==========================================================================
  # ANCHORS - NAMED POSITIONING POINTS
  # ==========================================================================

  anchors:
    # Optional: Named anchor points for overlay positioning
    # Format: anchor_name: [x, y]
    # Coordinates: Absolute pixels or percentages

    <anchor_id>: [x, y]
      # Position: [x, y] coordinates
      # Values: Numbers (pixels) or strings with % (percentage)
      # Examples:
      #   cpu_core: [120, 80]
      #   power_button: ["50%", "25%"]
      #   status_light: [200, 150]

  # ==========================================================================
  # ROUTING - GLOBAL LINE ROUTING CONFIGURATION
  # ==========================================================================

  routing:
    # Optional: Global routing configuration for all lines
    # Lines can override these with per-line properties

    clearance: <number>
      # Optional: Minimum clearance around obstacles (pixels)
      # Default: 0
      # Used in: Grid and smart routing modes
      # Example: clearance: 10

    grid_resolution: <number>
      # Optional: Grid cell size for grid-based routing (pixels)
      # Default: 64
      # Min: 5
      # Used in: Grid and smart routing modes
      # Example: grid_resolution: 32

    # ----------------------------------------------------------------------
    # Path Smoothing Configuration
    # ----------------------------------------------------------------------

    smoothing_mode: none | chaikin
      # Optional: Path smoothing algorithm
      # Default: none
      # Values:
      #   - none: No smoothing (sharp corners)
      #   - chaikin: Chaikin corner-cutting algorithm (smooth curves)
      # Example: smoothing_mode: chaikin

    smoothing:
      # Optional: Nested smoothing configuration (alternate format)
      mode: none | chaikin
        # Same as smoothing_mode

      iterations: <number>
        # Optional: Number of smoothing iterations
        # Default: 1
        # Min: 1
        # Max: 5 (clamped)
        # More iterations = smoother but more points
        # Example: iterations: 2

      max_points: <number>
        # Optional: Maximum points after smoothing
        # Default: 160
        # Min: 1
        # Prevents excessive subdivision
        # Example: max_points: 400

    smoothing_iterations: <number>
      # Optional: Smoothing iterations (flat format)
      # Same as smoothing.iterations
      # Example: smoothing_iterations: 2

    smoothing_max_points: <number>
      # Optional: Max points after smoothing (flat format)
      # Same as smoothing.max_points
      # Example: smoothing_max_points: 200

    # ----------------------------------------------------------------------
    # Smart Routing Configuration
    # ----------------------------------------------------------------------

    smart_proximity: <number>
      # Optional: Proximity band for smart routing optimization (pixels)
      # Default: 0
      # When > 0, smart routing tries to avoid getting close to obstacles
      # Works with clearance to create avoidance bands
      # Example: smart_proximity: 20

    smart_detour_span: <number>
      # Optional: Maximum detour distance for smart routing (pixels)
      # Default: 48
      # Min: 1
      # How far smart routing can shift elbows to avoid obstacles
      # Example: smart_detour_span: 64

    smart_max_extra_bends: <number>
      # Optional: Maximum additional bends allowed by smart routing
      # Default: 3
      # Min: 0
      # Limits path complexity during optimization
      # Example: smart_max_extra_bends: 5

    smart_min_improvement: <number>
      # Optional: Minimum cost improvement to accept detour (pixels)
      # Default: 4
      # Min: 0
      # Threshold for accepting routing optimizations
      # Example: smart_min_improvement: 8

    smart_max_detours_per_elbow: <number>
      # Optional: Maximum detour attempts per elbow
      # Default: 4
      # Min: 1
      # Limits computation during smart routing
      # Example: smart_max_detours_per_elbow: 6

    # ----------------------------------------------------------------------
    # Channel Configuration
    # ----------------------------------------------------------------------

    channel_force_penalty: <number>
      # Optional: Penalty for lines outside forced channels
      # Default: 800
      # Min: 0
      # Applied when route_channel_mode is 'force' and line exits channel
      # Example: channel_force_penalty: 1000

    channel_avoid_multiplier: <number>
      # Optional: Multiplier for avoid channel penalties
      # Default: 1.0
      # Min: 0
      # Applied when route_channel_mode is 'avoid'
      # Example: channel_avoid_multiplier: 1.5

    channel_target_coverage: <number>
      # Optional: Target channel coverage for prefer mode (0-1)
      # Default: 0.6 (60%)
      # Min: 0, Max: 1
      # When route_channel_mode is 'prefer', routing tries to achieve this coverage
      # Example: channel_target_coverage: 0.8

    channel_shaping_max_attempts: <number>
      # Optional: Maximum attempts for channel shaping
      # Default: 12
      # Min: 1
      # Number of iterations to improve channel coverage
      # Example: channel_shaping_max_attempts: 20

    channel_shaping_span: <number>
      # Optional: Maximum shift distance during channel shaping (pixels)
      # Default: 32
      # Min: 1
      # How far shaping can move elbows to enter channels
      # Example: channel_shaping_span: 48

    channel_min_coverage_gain: <number>
      # Optional: Minimum coverage improvement to accept shaping (0-1)
      # Default: 0.04 (4%)
      # Min: 0, Max: 1
      # Threshold for accepting shaping iterations
      # Example: channel_min_coverage_gain: 0.1

    # ----------------------------------------------------------------------
    # Cost Function Weights
    # ----------------------------------------------------------------------

    cost_defaults:
      # Optional: Cost function weights for routing algorithms

      bend: <number>
        # Optional: Cost weight for each bend/elbow in path
        # Default: 10
        # Higher values prefer straighter paths with fewer bends
        # Example: bend: 15

      proximity: <number>
        # Optional: Cost weight for proximity to obstacles
        # Default: 4
        # Higher values make routing avoid getting close to obstacles
        # Works with smart_proximity setting
        # Example: proximity: 8

  # ==========================================================================
  # CHANNELS - ROUTING CHANNEL DEFINITIONS
  # ==========================================================================

  channels:
    # Optional: Named routing channels that influence line behavior
    # Channels are rectangular regions with bundling/avoiding behavior

    <channel_id>:
      # Channel identifier (used in line route_channels)

      bounds: [x, y, width, height]
        # Required: Channel rectangle
        # Format: [x, y, width, height] in pixels
        # Example: bounds: [100, 50, 200, 100]

      type: bundling | avoiding | waypoint
        # Required: Channel behavior type
        # Values:
        #   - bundling: Lines prefer to route through this area
        #   - avoiding: Lines try to avoid this area
        #   - waypoint: Lines must pass through this area
        # Example: type: bundling

      weight: <number>
        # Optional: Channel influence weight
        # Default: 0.5
        # Min: 0
        # Higher values = stronger influence
        # Example: weight: 0.8

    # Examples:
    power_corridor:
      bounds: [100, 200, 300, 50]
      type: bundling
      weight: 0.7

    equipment_area:
      bounds: [500, 100, 200, 200]
      type: avoiding
      weight: 0.6

  # ==========================================================================
  # OVERLAYS - LINE AND CONTROL OVERLAYS
  # ==========================================================================

  overlays:
    # Optional: Array of overlay configurations
    # Each overlay is either a line (SVG path) or control (embedded card)
    # See separate schema docs for detailed overlay properties:
    #   - line-overlay-schema-definition.md
    #   - control-overlay-schema-definition.md

    - id: <overlay-id>
      # Required: Unique overlay identifier

      type: line | control
        # Required: Overlay type
        # Values:
        #   - line: SVG line/path with routing
        #   - control: Embedded Home Assistant card

    # Line Overlay Example:
    - id: power_line
      type: line
      anchor: power_source
      attach_to: power_load
      routing_strategy: smart
      route_channels: [power_corridor]
      style:
        color: '#ff9900'
        width: 3

    # Control Overlay Example:
    - id: status_button
      type: control
      position: [200, 100]
      size: [150, 50]
      card:
        type: custom:lcards-button
        entity: sensor.system_status
        name: System Status

  # ==========================================================================
  # DEBUG CONFIGURATION
  # ==========================================================================

  debug:
    # Optional: Debug visualization and logging

    enabled: <boolean>
      # Optional: Enable debug mode
      # Default: false
      # Shows debug overlays and enables verbose logging
      # Example: enabled: true

    show_anchors: <boolean>
      # Optional: Show anchor points visually
      # Default: false
      # Renders anchor markers on canvas
      # Example: show_anchors: true

    show_routing: <boolean>
      # Optional: Show routing grid visualization
      # Default: false
      # Renders routing grid and obstacles
      # Example: show_routing: true

    validation: <boolean>
      # Optional: Enable validation debug logging
      # Default: false
      # Logs detailed validation results
      # Example: validation: true

    strictValidation: <boolean>
      # Optional: Use strict validation mode
      # Default: false
      # Treats warnings as errors
      # Example: strictValidation: true

# ==============================================================================
# ROOT-LEVEL PROPERTIES (Shared Across Cards)
# ==============================================================================

data_sources:
  # Optional: Named data source definitions (can share with other cards)
  <source_id>:
    entity: <entity_id>
      # Required: Entity ID to fetch data from
      # Example: entity: sensor.temperature

    windowSeconds: <number>
      # Optional: Time window for historical data (seconds)
      # Min: 1
      # Example: windowSeconds: 3600  # 1 hour

rules:
  # Optional: Dynamic styling rules (can share with other cards)
  # See RulesEngine documentation for rule syntax
```

---

## Property Reference

### Base SVG

**Purpose**: Provides the background SVG graphic for the MSD display

**source** (required):
- Built-in SVGs: `builtin:ncc-1701-a-blue`, `builtin:defiant-blue`, etc.
- Local files: `/local/custom-display.svg` (in `www/` folder)
- No SVG: `none` (requires explicit `view_box`)

**filter_preset** (optional):
- Pre-defined CSS filter combinations
- `dimmed`: Reduces opacity and brightness
- `subtle`: Slight opacity reduction
- `backdrop`: Heavy opacity for background
- `faded`: Grayscale + reduced opacity
- `red-alert`: Red hue shift + brightness
- `monochrome`: Full grayscale

**filters** (optional):
- Custom CSS filters override preset
- All standard CSS filter functions supported
- Applied as `filter: <function>(<value>)` CSS

---

### View Box

**Purpose**: Defines the coordinate system for overlay positioning

**auto** (default):
- Extracts viewBox from base SVG automatically
- Recommended for built-in SVGs

**[minX, minY, width, height]**:
- Explicit coordinate system definition
- Required when `base_svg.source` is `"none"`
- Example: `[0, 0, 800, 600]` creates 800x600 pixel coordinate space

---

### Anchors

**Purpose**: Named positioning points for overlays

**Format**: `anchor_name: [x, y]`

**Coordinates**:
- Absolute pixels: `[120, 80]`
- Percentages: `["50%", "25%"]` (relative to viewBox)
- Mixed: `[100, "50%"]`

**Usage**:
- Line overlay endpoints: `anchor: cpu_core`
- Control overlay positioning: `position: status_display`
- Reference points for overlay-to-overlay connections

---

### Routing Configuration

**Purpose**: Global defaults for line routing behavior

#### Clearance & Grid

**clearance** (default: 0):
- Minimum distance from obstacles (pixels)
- Used in grid and smart routing
- Creates safety buffer around controls
- Example: `clearance: 10` keeps lines 10px from obstacles

**grid_resolution** (default: 64):
- Grid cell size for pathfinding (pixels)
- Smaller values = more precise but slower
- Larger values = faster but less precise
- Typical range: 16-64 pixels
- Used in `grid` and `smart` routing modes

#### Smoothing

**Purpose**: Converts sharp corners into smooth curves

**smoothing_mode** / **smoothing.mode** (default: `'none'`):
- `none`: Sharp Manhattan routing (90° angles)
- `chaikin`: Chaikin corner-cutting algorithm (smooth curves)

**smoothing_iterations** / **smoothing.iterations** (default: 1):
- Number of smoothing passes
- More iterations = smoother curves but more points
- Clamped to 1-5 iterations

**smoothing_max_points** / **smoothing.max_points** (default: 160):
- Maximum points after smoothing
- Prevents excessive subdivision
- Typical range: 100-400 points

**Example**:
```yaml
routing:
  smoothing_mode: chaikin
  smoothing_iterations: 2
  smoothing_max_points: 200
```

#### Smart Routing

**Purpose**: Intelligent obstacle avoidance and path optimization

**smart_proximity** (default: 0):
- Proximity band around obstacles (pixels)
- When > 0, routing avoids getting close to obstacles
- Works with `clearance` to create avoidance zones
- Example: With `clearance: 10` and `smart_proximity: 20`, total avoidance is 30px

**smart_detour_span** (default: 48):
- Maximum distance for elbow shifts (pixels)
- How far smart routing can move path segments
- Larger values allow more optimization but increase computation

**smart_max_extra_bends** (default: 3):
- Maximum additional bends allowed during optimization
- Prevents overly complex paths
- Smart routing can add bends to avoid obstacles

**smart_min_improvement** (default: 4):
- Minimum cost reduction to accept optimization (pixels)
- Prevents minor, computationally expensive changes
- Higher values = fewer optimizations

**smart_max_detours_per_elbow** (default: 4):
- Maximum optimization attempts per corner
- Limits computation time
- Higher values = better optimization but slower

**Example**:
```yaml
routing:
  smart_proximity: 20
  smart_detour_span: 64
  smart_max_extra_bends: 5
  smart_min_improvement: 8
```

#### Channel Configuration

**Purpose**: Fine-tune channel routing behavior

**channel_force_penalty** (default: 800):
- Penalty cost when line exits forced channel
- Applied when `route_channel_mode: force`
- High penalty ensures lines stay in channel

**channel_avoid_multiplier** (default: 1.0):
- Multiplier for avoid channel penalties
- Applied when `route_channel_mode: avoid`
- Higher values make avoidance stronger

**channel_target_coverage** (default: 0.6):
- Target coverage for prefer mode (0-1 = 0%-100%)
- When `route_channel_mode: prefer`, routing tries to achieve this
- 0.6 = 60% of line path should be in channel

**channel_shaping_max_attempts** (default: 12):
- Maximum iterations for channel shaping optimization
- More attempts = better coverage but slower
- Typical range: 8-20

**channel_shaping_span** (default: 32):
- Maximum elbow shift distance during shaping (pixels)
- How far shaping can move path segments to enter channels
- Similar to `smart_detour_span` but for channel optimization

**channel_min_coverage_gain** (default: 0.04):
- Minimum coverage improvement to accept shaping (0-1)
- Prevents minor, expensive optimizations
- 0.04 = 4% coverage improvement required

**Example**:
```yaml
routing:
  channel_target_coverage: 0.8
  channel_shaping_max_attempts: 20
  channel_shaping_span: 48
```

#### Cost Function

**Purpose**: Weight factors for routing algorithm cost calculations

**cost_defaults.bend** (default: 10):
- Cost per bend/elbow in path
- Higher values prefer straighter paths
- Lower values allow more bends for shorter paths

**cost_defaults.proximity** (default: 4):
- Cost weight for proximity to obstacles
- Works with `smart_proximity`
- Higher values make routing avoid obstacles more strongly

**Example**:
```yaml
routing:
  cost_defaults:
    bend: 15        # Prefer fewer bends
    proximity: 8    # Strongly avoid obstacles
```

---

### Channels

**Purpose**: Define routing regions that influence line behavior

**Format**: Named channel definitions with bounds and behavior type

**bounds** (required):
- Rectangle: `[x, y, width, height]`
- Example: `[100, 50, 300, 100]` = rect at (100,50) with size 300x100

**type** (required):
- `bundling`: Lines prefer to route through this area (cable management)
- `avoiding`: Lines try to avoid this area (sensitive equipment)
- `waypoint`: Lines must pass through this area (required routing)

**weight** (optional, default: 0.5):
- Channel influence strength (0-1)
- Higher values = stronger influence on routing
- Typical range: 0.3-0.9

**Line Usage**:
Lines reference channels in their `route_channels` array:
```yaml
overlays:
  - id: power_line
    type: line
    route_channels: [power_corridor, data_trunk]
    route_channel_mode: prefer
```

**Example Configuration**:
```yaml
channels:
  power_corridor:
    bounds: [100, 200, 300, 50]
    type: bundling
    weight: 0.7

  equipment_zone:
    bounds: [500, 100, 200, 200]
    type: avoiding
    weight: 0.8

  data_trunk:
    bounds: [50, 400, 700, 80]
    type: bundling
    weight: 0.6
```

---

## Complete Examples

### Example 1: Basic Enterprise Display

```yaml
type: custom:lcards-msd-card

msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    filter_preset: dimmed

  view_box: auto

  anchors:
    cpu_1: [120, 100]
    cpu_2: [120, 200]
    gpu: [400, 150]
    status: [50, 50]

  overlays:
    # Simple line
    - id: cpu_gpu_line
      type: line
      anchor: cpu_1
      attach_to: gpu
      style:
        color: '#ff9900'
        width: 2

    # Status display
    - id: status_card
      type: control
      position: status
      size: [200, 80]
      card:
        type: custom:lcards-button
        entity: sensor.system_status
        name: System Status
```

### Example 2: Advanced Routing with Channels

```yaml
type: custom:lcards-msd-card

msd:
  base_svg:
    source: builtin:defiant-blue
    filter_preset: subtle

  anchors:
    power_source: [100, 100]
    power_load_1: [600, 100]
    power_load_2: [600, 300]
    data_in: [100, 500]
    data_out: [700, 500]

  routing:
    clearance: 10
    grid_resolution: 32
    smoothing_mode: chaikin
    smoothing_iterations: 2
    smart_proximity: 15
    smart_detour_span: 48
    channel_target_coverage: 0.8
    cost_defaults:
      bend: 12
      proximity: 6

  channels:
    power_trunk:
      bounds: [150, 80, 400, 60]
      type: bundling
      weight: 0.8

    data_corridor:
      bounds: [150, 480, 500, 60]
      type: bundling
      weight: 0.7

    sensitive_equipment:
      bounds: [300, 200, 200, 150]
      type: avoiding
      weight: 0.9

  overlays:
    # Power distribution with channel routing
    - id: power_1
      type: line
      anchor: power_source
      attach_to: power_load_1
      routing_strategy: smart
      route_channels: [power_trunk]
      route_channel_mode: prefer
      style:
        color: '#ff0000'
        width: 3

    - id: power_2
      type: line
      anchor: power_source
      attach_to: power_load_2
      routing_strategy: smart
      route_channels: [power_trunk]
      route_channel_mode: prefer
      style:
        color: '#ff0000'
        width: 3

    # Data flow avoiding sensitive areas
    - id: data_line
      type: line
      anchor: data_in
      attach_to: data_out
      routing_strategy: smart
      route_channels: [data_corridor, sensitive_equipment]
      route_channel_mode: prefer
      clearance: 20
      style:
        color: '#0099ff'
        width: 2
        dash_array: '5,5'
```

### Example 3: Complex Multi-Overlay Display

```yaml
type: custom:lcards-msd-card

msd:
  base_svg:
    source: /local/custom-ops-center.svg
    filters:
      opacity: 0.4
      brightness: 0.7

  view_box: [0, 0, 1000, 600]

  anchors:
    server_1: [200, 150]
    server_2: [200, 300]
    server_3: [200, 450]
    storage: [800, 300]
    monitor_area: [50, 50]
    chart_area: [600, 50]

  routing:
    clearance: 12
    grid_resolution: 24
    smoothing:
      mode: chaikin
      iterations: 3
      max_points: 300
    smart_proximity: 20
    smart_detour_span: 64
    smart_max_extra_bends: 4
    channel_target_coverage: 0.75
    cost_defaults:
      bend: 15
      proximity: 8

  channels:
    network_trunk:
      bounds: [250, 100, 500, 400]
      type: bundling
      weight: 0.9

  overlays:
    # Server connections with animations
    - id: server1_storage
      type: line
      anchor: server_1
      attach_to: storage
      routing_strategy: smart
      route_channels: [network_trunk]
      route_channel_mode: prefer
      style:
        color: '#00ff00'
        width: 2
      animation_ref: pulse

    - id: server2_storage
      type: line
      anchor: server_2
      attach_to: storage
      routing_strategy: smart
      route_channels: [network_trunk]
      style:
        color: '#00ff00'
        width: 2

    - id: server3_storage
      type: line
      anchor: server_3
      attach_to: storage
      routing_strategy: smart
      route_channels: [network_trunk]
      style:
        color: '#00ff00'
        width: 2

    # Status monitor
    - id: system_monitor
      type: control
      position: monitor_area
      size: [180, 100]
      z_index: 10
      card:
        type: custom:lcards-button
        entity: sensor.cluster_status
        name: Cluster Status
        style:
          background: var(--lcars-blue)

    # Performance chart
    - id: perf_chart
      type: control
      position: chart_area
      size: [350, 180]
      z_index: 10
      card:
        type: custom:lcards-chart
        entity: sensor.cpu_usage
        name: CPU Performance
        span: 1h
```

---

## Migration from Legacy Formats

### Removed: Legacy Overlay Types

**Before (v1.21 and earlier)**:
```yaml
overlays:
  - id: label
    type: text              # ❌ REMOVED
    text: "System Status"

  - id: btn
    type: button            # ❌ REMOVED
    entity: light.kitchen
```

**After (v1.22+)**:
```yaml
overlays:
  - id: label
    type: control           # ✅ Use control overlay
    position: [100, 50]
    size: [200, 40]
    card:
      type: custom:lcards-button
      name: "System Status"

  - id: btn
    type: control
    position: [100, 100]
    size: [150, 50]
    card:
      type: custom:lcards-button
      entity: light.kitchen
```

### Removed: use_packs Field

**Before**:
```yaml
msd:
  use_packs: [my-theme-pack, my-style-pack]  # ❌ REMOVED
```

**After**:
Packs are now loaded globally by PackManager at startup. Configure packs in theme configuration or global settings.

---

## Integration with Core Systems

### PackManager
- Loads global packs (themes, style presets, rules, animations)
- MSD cards automatically use loaded packs
- No per-card pack configuration needed

### DataSourceManager
- Handles entity subscriptions and data processing
- MSD cards use DataSourceManager for all entity access
- Define data sources at root level for sharing

### RulesEngine
- Applies conditional styling to overlays
- Rules can target overlays by ID or type
- Define rules at root level for sharing

### ThemeManager
- Provides theme tokens and color palettes
- MSD inherits active theme automatically
- Use `var(--lcars-color)` in styles

### StylePresetManager
- Applies style presets to overlays
- Presets available globally from loaded packs

### AnimationRegistry
- Manages animation definitions
- Reference animations via `animation_ref` in overlays

---

## Validation

**Schema Location**: `src/cards/schemas/msd-schema.js`

**Validation Features**:
- Required field checking (`base_svg.source`, `msd` object)
- Type validation (strings, numbers, arrays, objects)
- Enum validation (filter presets, channel types)
- Range validation (opacity 0-1, clearance >= 0)
- Cross-field validation (view_box required when source is "none")

**Deprecated Field Warnings**:
- `use_packs` → Warning: Remove field
- `version` → Warning: Remove field

**Error Handling**:
- Validation errors prevent MSD initialization
- Warnings logged to console
- Debug mode provides detailed validation output

---

## Performance Considerations

**Routing Performance**:
- `grid_resolution`: Smaller = slower but more precise (16-64px typical)
- `smart_max_detours_per_elbow`: Higher = better optimization but slower (2-6 typical)
- `channel_shaping_max_attempts`: Higher = better coverage but slower (8-20 typical)
- `smoothing_iterations`: More iterations = smoother but more points (1-3 typical)

**Optimization Tips**:
- Use `manhattan` or `direct` routing for simple paths (fastest)
- Use `grid` for obstacle avoidance (medium speed)
- Use `smart` only when needed (slowest but best quality)
- Limit `smoothing_iterations` to 2-3 for most cases
- Set `smoothing_max_points` to prevent excessive subdivision

**Caching**:
- RouterCore caches computed paths
- Cache keyed by route parameters
- Invalidated on anchor/obstacle changes

---

## Debugging

**Enable Debug Mode**:
```yaml
msd:
  debug:
    enabled: true
    show_anchors: true
    show_routing: true
    validation: true
```

**Console Access**:
```javascript
// Get MSD card instance
const card = document.querySelector('lcards-msd-card');

// Access pipeline
const pipeline = card._msdPipeline;

// Inspect routing
console.log(pipeline.coordinator.router.stats());

// View validation issues
console.log(window.lcards.debug.msd.validation.issues());

// Check routing cache
window.__msdDebug?.routing?.inspect('line_id');
```

---

## Related Documentation

- **[Line Overlay Schema](./line-overlay-schema-definition.md)** - Complete line overlay configuration
- **[Control Overlay Schema](./control-overlay-schema-definition.md)** - Control overlay configuration
- **[Routing System](../subsystems/routing-system.md)** - Routing algorithms and optimization
- **[Channel System](../subsystems/channel-system.md)** - Channel routing behavior

---

*Last Updated: January 11, 2026*
*Schema Version: 1.22+*
*Programmatic Schema: `src/cards/schemas/msd-schema.js`*
