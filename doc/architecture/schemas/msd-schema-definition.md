# MSD (Master Systems Display) Card - Official Schema Definition

**Date:** November 2025
**Purpose:** Single source of truth for MSD card schema
**Status:** 🎯 DEFINITIVE - All implementations must match this

**Architecture:** Complex multi-overlay SVG display system with routing, rules, and animations

---

## Overview

MSD (Master Systems Display) cards are the advanced card type in LCARdS, supporting:
- Multiple overlay types rendered in SVG viewBox coordinates
- Line routing with intelligent pathfinding
- Anchor-based positioning system
- Integration with global singleton systems (RulesEngine, DataSourceManager, ThemeManager)
- Real-time entity subscriptions and data processing

**Important:** MSD cards use DataSourceManager directly for entity data. For lightweight entity access, use Simple Cards which use CoreSystemsManager.

---

## Complete YAML Schema

```yaml
# ==============================================================================
# MSD CARD CONFIGURATION
# ==============================================================================

type: custom:lcards-msd-card

# ==============================================================================
# BASE SVG CONFIGURATION
# ==============================================================================

base_svg:
  # Source SVG template
  source: <source-string>                # Required: SVG source reference
    # Formats:
    #   builtin:<key>      - Packaged SVG template (e.g., 'builtin:ncc-1701-a-blue')
    #   /local/path.svg    - Local file from Home Assistant www directory
    #   "none"             - No base SVG (overlay-only mode, requires explicit view_box)

  # Optional: CSS filter effects to dim/blur base SVG (emphasizes overlays)
  # Filters apply ONLY to base SVG content, not to overlays
  filter_preset: <preset-name>           # Built-in preset: dimmed, subtle, backdrop, faded, red-alert, monochrome
                                         # Themes can override via theme.msd.filter_presets

  # Optional: Explicit filter values (override preset values)
  filters:
    opacity: <number>                    # 0.0-1.0 (default: 1.0)
    blur: <css-length>                   # CSS length (e.g., '3px', '0.5rem')
    brightness: <number>                 # 0.0+ (default: 1.0)
    contrast: <number>                   # 0.0+ (default: 1.0)
    grayscale: <number>                  # 0.0-1.0 (default: 0)
    sepia: <number>                      # 0.0-1.0 (default: 0)
    hue_rotate: <degrees>                # -360 to 360 degrees
    saturate: <number>                   # 0.0+ (default: 1.0)
    invert: <number>                     # 0.0-1.0 (default: 0)

# ==============================================================================
# VIEW BOX
# ==============================================================================

# SVG viewBox - coordinate system for all overlays
view_box: auto                           # Auto-extract from base_svg (default)
# OR explicit:
view_box: [<minX>, <minY>, <width>, <height>]  # Array of 4 numbers

# If base_svg.source is "none", view_box MUST be explicitly specified

# ==============================================================================
# ANCHORS
# ==============================================================================

# User-defined anchor points for positioning
# Coordinates may be numbers or percentage strings
# Anchor IDs starting with "__" or "msd-internal-" are reserved for internal use
anchors:
  <anchor-id>: [<x>, <y>]                # Numeric coordinates
  <anchor-id>: ["<pct>%", "<pct>%"]      # Percentage coordinates

# Examples:
#   cpu_core: [120, 80]
#   memory_bank: ["60%", "40%"]
#   center_point: ["50%", "50%"]

# ==============================================================================
# PACK SYSTEM
# ==============================================================================

# Optional: Load configuration packs (if omitted, builtin:[core] assumed)
use_packs:
  builtin: [<pack-names>]                # Built-in packs to load
  external: [<urls>]                     # External pack URLs

# Optional: Remove items by ID after pack merges
remove:
  animations: [<animation-ids>]
  rules: [<rule-ids>]
  overlays: [<overlay-ids>]

# ==============================================================================
# DATA SOURCES
# ==============================================================================

# Data source definitions for entity subscriptions and data processing
# These register with the global DataSourceManager singleton
data_sources:
  <source-name>:                         # Arbitrary DataSource ID
    entity: <entity-id>                  # Required: Home Assistant entity to track
    attribute: <attribute-name>          # Optional: entity attribute instead of state
    window_seconds: <number>             # Rolling window size in seconds (default: 3600)
    minEmitMs: <number>                  # Minimum time between emissions (throttling)
    coalesceMs: <number>                 # Coalesce rapid changes within window
    maxDelayMs: <number>                 # Maximum delay before forced emission
    emitOnSameValue: <boolean>           # Emit even when value unchanged (default: false)
    history:
      preload: <boolean>                 # Preload history on initialization
      hours: <number>                    # Hours of history to preload
      days: <number>                     # Days of history to preload

# Example:
#   cpu_temp:
#     entity: sensor.cpu_temp
#     window_seconds: 3600
#     minEmitMs: 250
#     coalesceMs: 120
#     history: { preload: true, hours: 6 }

# ==============================================================================
# OVERLAYS
# ==============================================================================

# MSD supports 2 overlay types:
#   - line: SVG lines/paths for visual connectors
#   - control: Embedded Home Assistant cards (any card type including LCARdS
#              LCARdS Cards, standard HA cards, and third-party custom cards)

overlays:
  # --- LINE OVERLAY ---
  - id: <overlay-id>                     # Required: Unique identifier
    type: line                           # Required: Overlay type

    # Source attachment
    anchor: <anchor-id> | [x, y]         # Starting point (anchor ID or coordinates)
    anchor_side: <side>                  # Optional: Side of source to attach from
    anchor_gap: <number>                 # Optional: Gap from source edge (pixels)

    # Target attachment
    attach_to: <anchor-id> | <overlay-id> | [x, y]  # Ending point
    attach_side: <side>                  # Optional: Side of target to attach to
    attach_gap: <number>                 # Optional: Gap from target edge (pixels)

    # Attachment sides:
    #   center | top | bottom | left | right |
    #   top-left | top-right | bottom-left | bottom-right |
    #   topLeft | topRight | bottomLeft | bottomRight (aliases)

    # Routing options
    route: auto | manhattan | grid | smart | direct  # Routing strategy
    route_mode: <mode>                   # Explicit routing mode
    route_channels: [<channel-ids>]      # Channel-aware routing
    channel_mode: prefer | avoid | force # Channel behavior
    clearance: <number>                  # Minimum pixels from obstacles
    proximity: <number>                  # Proximity penalty weight

    # Corner and smoothing
    corner_style: round | bevel | miter  # Elbow style (default: miter)
    corner_radius: <number>              # Arc radius for round elbows (pixels)
    smoothing_mode: none | chaikin       # Path smoothing algorithm
    smoothing_iterations: <number>       # Smoothing passes
    smoothing_max_points: <number>       # Safety cap on points

    # Visual style
    style:
      # Core stroke properties
      color: <color>                     # Stroke color (CSS variable, hex, theme token)
      width: <number>                    # Stroke width (pixels)
      opacity: <number>                  # Stroke opacity (0-1)

      # Stroke styling
      line_cap: round | butt | square    # Line cap style
      line_join: round | bevel | miter   # Line join style
      miter_limit: <number>              # Miter limit for sharp corners

      # Dash patterns
      dash_array: <string>               # Dash pattern (e.g., "6,2")
      dash_offset: <number>              # Dash offset (pixels)

      # Fill (for thick lines or effects)
      fill: <color> | none               # Fill color
      fill_opacity: <number>             # Fill opacity (0-1)

      # Gradient support
      gradient:
        type: linear | radial
        direction: horizontal | vertical | diagonal | diagonal-reverse
        stops:
          - offset: "<pct>%"
            color: <color>

      # Pattern support
      pattern:
        type: dots | grid | diagonal
        size: <number>
        color: <color>
        opacity: <number>

      # Markers (arrows, dots, diamonds, squares)
      marker_start:
        type: arrow | dot | diamond | square
        size: small | medium | large
        color: <color>
        rotate: <boolean>                # Rotate with line direction

      marker_mid:
        type: <marker-type>
        size: <size>
        color: <color>

      marker_end:
        type: <marker-type>
        size: <size>
        color: <color>
        rotate: <boolean>

      # Effects
      glow:
        color: <color>
        size: <number>
        opacity: <number>

      shadow:
        color: <color>
        offset: [<x>, <y>]
        blur: <number>

    # Animation reference
    animation_ref: <animation-id>        # Reference to animation definition

  # --- CONTROL OVERLAY ---
  - id: <overlay-id>                     # Required: Unique identifier
    type: control                        # Required: Overlay type

    # Position and size (in viewBox coordinates)
    position: <anchor-id> | [x, y]       # Position (anchor reference or coordinates)
    size: [<width>, <height>]            # Size in viewBox units

    # Embedded card configuration
    card:
      type: <card-type>                  # Home Assistant card type
      entity: <entity-id>                # Entity for the card
      # ... any card-specific configuration

    # Simple Cards (recommended)
    card:
      type: custom:lcards-button  # LCARdS button
      entity: light.living_room
      label: "Living Room"
      preset: lozenge

    # OR
    card:
      type: custom:lcards-chart   # LCARdS chart
      source: sensor.temperature
      chart_type: line

    # OR any standard HA card
    card:
      type: entities                     # Standard HA entities card
      entities:
        - sensor.temperature
        - sensor.humidity

# ==============================================================================
# ROUTING CONFIGURATION (GLOBAL DEFAULTS)
# ==============================================================================

routing:
  default_mode: manhattan                # Default routing mode for overlays
  clearance: <number>                    # Default minimum pixels from obstacles
  grid_resolution: <number>              # Routing grid size (pixels)

  # Channel shaping options
  channel_target_coverage: <number>      # Coverage goal for 'prefer' (0-1)
  channel_shaping_max_attempts: <number> # Max elbow adjustments
  channel_shaping_span: <number>         # Pixel shift per attempt
  channel_min_coverage_gain: <number>    # Minimum coverage delta to accept

  # Grid tuning
  grid_resolution_multipliers: [<numbers>]
  grid_resolution_max: <number>

  # Cost weights for pathfinding
  cost_defaults:
    distance: <number>                   # Distance cost weight
    bend: <number>                       # Bend cost weight
    proximity: <number>                  # Proximity cost weight
    channel: <number>                    # Channel cost weight
    spacing: <number>                    # Spacing cost weight

  # Fallback options
  fallback:
    max_cost_multiple: <number>          # Max cost multiplier before fallback
    enable_two_elbow: <boolean>          # Allow two-elbow fallback

  # Channel definitions
  channels:
    - id: <channel-id>
      rect: [<x>, <y>, <width>, <height>]

  # Smoothing defaults
  smoothing_mode: none | chaikin         # Default smoothing (none = disabled)
  smoothing_iterations: <number>         # Default smoothing passes
  smoothing_max_points: <number>         # Default max points after smoothing

# ==============================================================================
# ANIMATIONS
# ==============================================================================

animations:
  - id: <animation-id>                   # Required: Unique identifier
    preset: <preset-name>                # Required: Animation preset
      # Built-in presets: pulse, fade, draw, motionpath

    params:
      duration: <number>                 # Duration in milliseconds
      loop: <boolean>                    # Loop animation
      alternate: <boolean>               # Alternate direction on loop
      easing: <easing-function>          # Easing function
      # ... preset-specific parameters

# Example:
#   - id: pulse_fast
#     preset: pulse
#     params:
#       duration: 1200
#       loop: true
#       alternate: true
#       max_scale: 1.15
#       min_opacity: 0.65

# ==============================================================================
# TIMELINES
# ==============================================================================

timelines:
  - id: <timeline-id>                    # Required: Unique identifier
    globals:
      autoplay: <boolean>                # Auto-start on load
      easing: <easing-function>          # Default easing for steps
    steps:
      - targets: <css-selector>          # Target element(s)
        offset: <offset>                 # Timing offset (e.g., "+=120")
        preset: <preset-name>            # Animation preset
        params:
          duration: <number>
          # ... preset parameters

# ==============================================================================
# RULES
# ==============================================================================

# Rules integrate with the global RulesEngine singleton
# Rule changes are distributed to all registered cards
rules:
  - id: <rule-id>                        # Required: Unique identifier
    priority: <number>                   # Higher executes earlier (default: 0)
    stop: <boolean>                      # Stop further processing for this overlay

    # Condition(s) - must use 'all' or 'any' array
    when:
      all:                               # ALL conditions must match
        - entity: <entity-id>
          state: <value>                 # Exact state match
          above: <number>                # Numeric comparison
          below: <number>                # Numeric comparison
        - condition: <expression>        # JavaScript/Jinja2 expression
        - time_between: "HH:MM-HH:MM"    # Time range (24h format)
        - regex: <pattern>               # Regex match on state

      # OR use 'any':
      any:                               # ANY condition must match
        - entity: <entity-id>
          state: 'on'
        - entity: <other-entity>
          state: 'on'

    # Actions to apply when conditions match
    apply:
      overlays:
        - id: <overlay-id>               # Target overlay
          style:                         # Style overrides
            color: <color>
            width: <number>
            # ... any style property

      # Dynamic base_svg filter changes
      base_svg:
        filter_preset: <preset-name>     # Switch to different filter preset
        filters:                         # Or specify explicit filters
          brightness: <number>
          # ...
        transition: <number>             # Transition duration (ms)

      # Animation triggers
      animations:
        - ref: <animation-id>            # Animation to trigger/override
          override:
            params:
              duration: <number>

# Example:
#   - id: cpu_hot
#     priority: 20
#     when:
#       all:
#         - entity: sensor.cpu_temp
#           above: 75
#     apply:
#       overlays:
#         - id: line_cpu
#           style: { color: 'var(--lcars-red)', width: 4 }
#       animations:
#         - ref: pulse_fast
#           override:
#             params: { duration: 900 }
```

---

## Color Value Types

Colors can be any of:
- **CSS Variables:** `var(--lcars-orange)`, `var(--ha-card-background)`
- **Theme Tokens:** `theme:colors.primary.orange`, `theme:colors.ui.border`
- **Computed Tokens:** `alpha(colors.accent.primary, 0.7)`, `darken(colors.ui.error, 20)`
- **Direct CSS:** `'#FF9900'`, `'rgb(255, 153, 0)'`, `'orange'`

---

## Architecture Integration

### Singleton Systems

MSD cards integrate with global singleton systems:

| Singleton | Usage in MSD |
|-----------|--------------|
| `lcardsCore.dataSourceManager` | Entity subscriptions and data processing |
| `lcardsCore.rulesEngine` | Conditional logic and rule distribution |
| `lcardsCore.themeManager` | Theme tokens and color resolution |
| `lcardsCore.animationManager` | Animation coordination |
| `lcardsCore.validationService` | Configuration validation |

**Key Point:** Data sources and rules defined in MSD cards are registered with global singletons, making them available system-wide. Any card (MSD or Simple) can access the same data sources.

### Per-Card Systems

Each MSD card instance has:
- **MSD SystemsManager** - Card orchestration
- **AdvancedRenderer** - SVG generation
- **RouterCore** - Line path calculation
- **TemplateProcessor** - Template resolution
- **MsdControlsRenderer** - Card embedding

### Simple Cards in MSD

Control overlays can embed any Simple Card:

```yaml
overlays:
  - id: temp_button
    type: control
    position: [100, 100]
    size: [200, 80]
    card:
      type: custom:lcards-button
      entity: climate.hvac
      label: "HVAC Control"
```

This allows combining MSD's layout capabilities with Simple Card's lightweight rendering.

---

## Validation Rules

1. **Overlays** require `id` + `type`; coordinate fields accept anchor ID or `[x, y]`
2. **Anchor coordinates** must be numbers or percentage strings
3. **Reserved anchor IDs**: `__*` and `msd-internal-*` are reserved for internal use
4. **Line overlays** must have `anchor` (source) and `attach_to` (target)
5. **Control overlays** require `position`, `size`, and `card` configuration
6. **Rules** must have `when` with `all` or `any` array of conditions
7. **Time format**: `"HH:MM-HH:MM"` in 24-hour format
8. **Animations**: `preset` must exist in runtime preset registry

---

## Resolution Timing

1. Load base_svg (if any)
2. If `view_box: auto` → extract SVG viewBox
3. Extract SVG anchors from base_svg
4. Merge user `anchors` (override duplicates)
5. Resolve overlay position references
6. Register data_sources with DataSourceManager
7. Register rules with RulesEngine
8. Render overlays

---

## Complete Examples

### Example 1: Basic MSD with Lines

```yaml
type: custom:lcards-msd-card
base_svg:
  source: builtin:ncc-1701-a-blue
  filter_preset: dimmed

view_box: auto

anchors:
  cpu: [120, 80]
  memory: [400, 80]

overlays:
  - id: line_cpu_mem
    type: line
    anchor: cpu
    attach_to: memory
    style:
      color: var(--lcars-orange)
      width: 2
      corner_style: round
      corner_radius: 12
```

### Example 2: MSD with Embedded Simple Cards

```yaml
type: custom:lcards-msd-card
base_svg:
  source: "none"
view_box: [0, 0, 800, 600]

overlays:
  - id: temperature_chart
    type: control
    position: [50, 50]
    size: [300, 200]
    card:
      type: custom:lcards-chart
      source: sensor.temperature
      chart_type: line
      height: 200

  - id: hvac_button
    type: control
    position: [400, 50]
    size: [150, 60]
    card:
      type: custom:lcards-button
      entity: climate.hvac
      label: "HVAC"
      preset: lozenge

  - id: connecting_line
    type: line
    anchor: temperature_chart
    anchor_side: right
    attach_to: hvac_button
    attach_side: left
    attach_gap: 10
    style:
      color: var(--lcars-cyan)
      width: 2
```

### Example 3: Rules-Based Styling

```yaml
type: custom:lcards-msd-card
base_svg:
  source: builtin:ncc-1701-a-blue

data_sources:
  cpu_temp:
    entity: sensor.cpu_temp
    window_seconds: 3600
    history:
      preload: true
      hours: 2

overlays:
  - id: status_line
    type: line
    anchor: [100, 100]
    attach_to: [400, 100]
    style:
      color: var(--lcars-orange)
      width: 2

rules:
  - id: cpu_hot
    priority: 10
    when:
      all:
        - entity: sensor.cpu_temp
          above: 80
    apply:
      overlays:
        - id: status_line
          style:
            color: var(--lcars-red)
            width: 4
      base_svg:
        filter_preset: red-alert
```

---

## Deprecated Features

The following features exist in legacy configurations but are no longer actively used in rendering:

- **`palettes`** - Color palette definitions (use theme tokens instead)
- **`profiles`** - Style profile groupings (use rules instead)
- **`active_profiles`** - Profile activation (use rules instead)

**Validation Behavior:** These fields are still validated to provide helpful error messages if misconfigured, but they have no effect on rendering. The validation ensures configurations using these fields won't break, but the values are not processed by the rendering pipeline.

**Recommendation:** Migrate to theme tokens and rules for equivalent functionality.

---

**Status:** 🎯 DEFINITIVE SCHEMA - Use this to update all implementations
