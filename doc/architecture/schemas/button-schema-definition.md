# LCARdS Button Card - Official Schema Definition

**Purpose:** Single source of truth for schema - update tokens, presets, code, and docs from this
**Status:** 🎯 DEFINITIVE - All implementations must match this

---

## Complete YAML Schema

```yaml
type: custom:lcards-button

# Core properties
entity: <entity-id>              # Optional - if omitted, always uses 'active' state
text:                            # Multi-text label system
  <field-id>:                    # Arbitrary field ID (e.g., 'label', 'title', 'status')
    content: <string>            # Text content to display
    position: <position-name>    # Named position or explicit coordinates
    x: <number>                  # Explicit x coordinate (overrides position)
    y: <number>                  # Explicit y coordinate (overrides position)
    x_percent: <number>          # Percentage x position (0-100)
    y_percent: <number>          # Percentage y position (0-100)
    rotation: <number>           # Rotation angle in degrees (positive = clockwise)
    padding: <number|object>     # Uniform or {top, right, bottom, left}
    font_size: <number>          # Font size in pixels (default: 14)
    color: <color|object>        # Color string or {active, inactive, unavailable}
    font_weight: <css-value>     # Font weight (default: bold)
    font_family: <css-value>     # Font family
    text_transform: none | uppercase | lowercase | capitalize  # Text transformation
    anchor: start | middle | end # Text anchor (default: from position)
    baseline: hanging | central | alphabetic  # Baseline (default: from position)
    show: <boolean>              # Show/hide field (default: true)
    template: <boolean>          # Enable template processing (default: true)
preset: <preset-name>            # Optional - style preset to apply first

# Icon Area Configuration
icon_area: left | right | top | bottom | none  # Where icon's reserved space is (default: left)
icon_area_size: <number>         # Optional: override calculated area size (width for left/right, height for top/bottom)

# Icon Configuration
icon: <icon-string>              # Simple: 'mdi:lightbulb', 'si:github', 'entity', null
# OR advanced:
icon:
  icon: <icon-string>            # 'mdi:lightbulb', 'si:github', 'entity'

  # Position WITHIN the icon area (if icon_area is set)
  # OR absolute position on button (if icon_area: none)
  position: <position-name>      # Named position (see below)
  x: <number>                    # Explicit x coordinate (within area or absolute)
  y: <number>                    # Explicit y coordinate (within area or absolute)
  x_percent: <number>            # Percentage x position (0-100, within area or absolute)
  y_percent: <number>            # Percentage y position (0-100, within area or absolute)

  # Sizing
  size: <number>                 # Icon size in pixels (default: 24)

  # State-based colors
  color: <color>                 # Simple uniform color
  # OR state-based:
  color:
    active: <color>
    inactive: <color>
    unavailable: <color>
    default: <color>

  # Background (optional badge/indicator style)
  background:
    color: <color>               # Simple uniform background
    # OR state-based:
    color:
      active: <color>
      inactive: <color>
      unavailable: <color>
      default: <color>
    radius: <number|percent>     # Border radius (e.g., 4, '50%' for circle)
    padding: <number>            # Space between icon and background edge

  # Padding
  padding: <number>              # Uniform padding
  # OR per-side:
  padding:
    top: <number>
    right: <number>
    bottom: <number>
    left: <number>

  # Rotation
  rotation: <number>             # Rotation angle in degrees (positive = clockwise)

  # Visibility
  show: <boolean>                # Explicitly show/hide icon (default: true from preset/config)

# Icon Area Behavior:
# - icon_area: left/right   → Creates vertical divider, icon positioned within left/right area
# - icon_area: top/bottom   → Creates horizontal divider, icon positioned within top/bottom area
# - icon_area: none         → No divider, icon positioned absolutely on button (like text fields)
# - If icon_area is set, icon.position is relative to that area
# - If icon_area: none, icon.position is absolute on the button

# Position Names (for both text and icon):
# - Corners: top-left, top-right, bottom-left, bottom-right
# - Edge centers: top-center, bottom-center, left-center, right-center
# - Synonyms: top (=top-center), bottom (=bottom-center), left (=left-center), right (=right-center)
# - Center: center
# - Default for icon within area: center
# - Default for text: center

# SVG Background & Interactive Segments (Phase 1 & 2)
svg:
  # Phase 1: Full SVG Background
  content: <string>              # Inline SVG markup (with or without outer <svg> tag)
  src: <path>                    # External SVG path or data URI
  viewBox: <string>              # ViewBox (e.g., "0 0 100 100", auto-detected if omitted)
  preserveAspectRatio: <string>  # Default: "xMidYMid meet"
  enable_tokens: <boolean>       # Enable {{entity.state}} tokens (default: true)
  allow_scripts: <boolean>       # Allow scripts (SECURITY RISK, default: false)

  # Phase 2: Interactive Segments (Entity State Awareness)
  segments:
    - id: <string>               # Segment identifier
      selector: <css-selector>   # CSS selector (e.g., "#arrow-up", "[data-segment=up]")
      entity: <entity-id>        # Optional entity (inherits card entity if omitted)

      # Actions (same structure as card actions)
      tap_action: <action>
      hold_action: <action>
      double_tap_action: <action>

      # State-based styling (auto-detects format)
      style:
        # STATE-FIRST FORMAT (recommended):
        active:                  # Entity state when on/playing/unlocked/etc
          fill: <color>
          stroke: <color>
          stroke-width: <number>
          opacity: <number>
        inactive:                # Entity state when off/paused/locked/etc
          fill: <color>
          stroke: <color>
        hover:                   # Mouse over (interaction state)
          stroke: <color>
          stroke-width: <number>
        pressed:                 # Mouse down (interaction state)
          fill: <color>
        default:                 # Fallback
          fill: <color>

        # OR PROPERTY-FIRST FORMAT (alternative):
        fill:
          active: <color>
          inactive: <color>
          hover: <color>
          pressed: <color>
          default: <color>
        stroke:
          active: <color>
          inactive: <color>

# Style (CB-LCARS schema)
style:
  # Card colors
  card:
    color:
      # Border/outline colors (per state)
      default: <color>
      active: <color>
      inactive: <color>
      unavailable: <color>

      # Background fill colors (per state)
      background:
        default: <color>
        active: <color>
        inactive: <color>
        unavailable: <color>

  # Border configuration (grouped)
  border:
    # Width - uniform or per-side
    width: <css-size>            # Uniform width (default: 2px)
    # OR per-side:
    width:
      top: <css-size>
      right: <css-size>
      bottom: <css-size>
      left: <css-size>

    # Radius - uniform or per-corner
    radius: <css-size>           # Uniform radius
    # OR per-corner:
    radius:
      top_left: <css-size>
      top_right: <css-size>
      bottom_right: <css-size>
      bottom_left: <css-size>

    # Border colors (per state)
    color:
      default: <color>
      active: <color>
      inactive: <color>
      unavailable: <color>

    # Individual side styling (advanced)
    top:
      width: <css-size>
      color: <color>
    right:
      width: <css-size>
      color: <color>
    bottom:
      width: <css-size>
      color: <color>
    left:
      width: <css-size>
      color: <color>  # Text defaults (for current label, future texts array inherits these)
  text:
    default:
      # Text colors (per state)
      color:
        default: <color>
        active: <color>
        inactive: <color>
        unavailable: <color>

      # Typography
      font_size: <css-size>      # Default: 14px
      font_weight: <css-value>   # Default: bold
      font_family: <css-font-stack>  # Default: 'LCARS', 'Antonio', sans-serif

  # Visual effects
  opacity: <number>              # 0-1 (applied to entire button)

# Actions
tap_action:
  action: toggle | call-service | navigate | more-info | none
  service: <service-name>        # For call-service
  service_data: <object>         # For call-service
  navigation_path: <path>        # For navigate

hold_action:
  action: <same as tap_action>
  # ... same fields

double_tap_action:
  action: <same as tap_action>
  # ... same fields

# Rules Engine (correct syntax)
rules:
  - when:
      # Option 1: JavaScript/Jinja2/Token condition
      condition: <expression>

      # Option 2: Entity condition
      entity: <entity-id>
      state: <value>
      above: <number>
      below: <number>

      # Option 3: Logical operators
      all:
        - condition: <expression>
        - entity: <entity-id>
          state: <value>
      any:
        - condition: <expression>
        - entity: <entity-id>
          state: <value>

    apply:
      style:
        <same structure as style above>
```

---

## Color Value Types

Colors can be any of:
- **CSS Variables:** `var(--lcars-orange)`, `var(--ha-card-background)`
- **Theme Tokens:** `theme:components.button.base.background.active`
- **Computed Tokens:** `alpha(colors.accent.primary, 0.7)`, `darken(colors.ui.error, 20)`
- **Direct CSS:** `'#FF9900'`, `'rgb(255, 153, 0)'`, `'orange'`

---

## State-Based Properties

These properties support state-specific values (active/inactive/unavailable):
- `card.color.{state}` - Border/outline color
- `card.color.background.{state}` - Fill color
- `border.color.{state}` - Border stroke color
- `text.default.color.{state}` - Text color

**State Resolution:**
1. Check `{property}.{currentState}` (e.g., `background.active`)
2. Fall back to `{property}.default` if not found
3. Fall back to theme token default
4. Fall back to hardcoded default

---



## Border Flexibility

### Per-Side Width

Control width of each border side independently:

```yaml
style:
  border:
    width:
      top: 3px
      right: 1px
      bottom: 3px
      left: 1px
```

### Per-Corner Radius

Control radius of each corner independently:

```yaml
style:
  border:
    radius:
      top_left: 20px
      top_right: 8px
      bottom_right: 20px
      bottom_left: 8px
```

### Individual Side Styling

Complete control over each side (width + color):

```yaml
style:
  border:
    top:
      width: 3px
      color: 'var(--lcars-orange)'
    right:
      width: 1px
      color: 'var(--lcars-gray)'
    bottom:
      width: 3px
      color: 'var(--lcars-orange)'
    left:
      width: 1px
      color: 'var(--lcars-gray)'
```

### Mixed Configurations

You can mix uniform and per-side settings:

```yaml
style:
  border:
    width: 2px               # Default for all sides
    width:
      top: 3px              # Override just top
    radius:
      top_left: 20px
      top_right: 8px
      bottom_right: 20px
      bottom_left: 8px
    color:
      active: 'black'        # Applies to all sides
```

---

## Rules Engine Syntax

### Correct Syntax (from rules-engine-template-syntax.md)

**JavaScript Expression:**
```yaml
rules:
  - when:
      condition: "entity.state === 'on'"
    apply:
      style:
        card:
          color:
            background:
              active: 'var(--lcars-yellow)'
```

**Jinja2 Template:**
```yaml
rules:
  - when:
      condition: "{{ states('sensor.temperature') | float > 25 }}"
    apply:
      style:
        text:
          default:
            color:
              active: 'red'
```

**Entity Condition:**
```yaml
rules:
  - when:
      entity: sensor.temperature
      above: 25
    apply:
      style:
        card:
          color:
            background:
              active: 'var(--lcars-ui-red)'
```

**Logical Operators:**
```yaml
rules:
  - when:
      all:
        - entity: light.desk
          state: 'on'
        - condition: "{{ now().hour >= 18 }}"
    apply:
      style:
        card:
          color:
            background:
              active: 'var(--lcars-purple)'
```

### WRONG Syntax (Do Not Use)

❌ **Incorrect:**
```yaml
rules:
  - conditions:  # WRONG - should be 'when'
      - entity: light.desk
        state: 'on'
    style_patch:  # WRONG - should be 'apply'
      background_color: 'red'  # WRONG - use nested schema
```

✅ **Correct:**
```yaml
rules:
  - when:
      entity: light.desk
      state: 'on'
    apply:
      style:
        card:
          color:
            background:
              active: 'red'
```

---

## Icon Syntax

### Icon Area Configuration

The button can reserve space for an icon with a divider separating it from the text area:

```yaml
# Icon area on left side (default)
icon_area: left
icon:
  icon: 'mdi:lightbulb'

# Icon area on right side
icon_area: right
icon:
  icon: 'mdi:power'

# Icon area on top
icon_area: top
icon:
  icon: 'mdi:menu'

# Icon area on bottom
icon_area: bottom
icon:
  icon: 'mdi:check'

# No icon area - icon positioned absolutely
icon_area: none
icon:
  icon: 'mdi:star'
  position: top-right
```

### Icon Specification

**Simple Icons:**
```yaml
icon: 'mdi:lightbulb'    # Material Design Icons
icon: 'si:github'        # Simple Icons
icon: 'entity'           # Use entity's icon attribute
icon: null               # No icon
```

**Advanced (with positioning and state-based styling):**
```yaml
icon_area: left          # Icon area on left
icon:
  icon: 'mdi:lightbulb'
  position: center       # Centered within left area (default)
  size: 24
  color:
    active: 'var(--lcars-orange)'
    inactive: 'var(--lcars-gray)'
    unavailable: 'var(--lcars-ui-red)'
  padding: 8
  rotation: 0
  show: true
```

### Icon Positioning Within Area

When `icon_area` is set, `icon.position` is relative to that area:

```yaml
icon_area: left
icon:
  icon: 'mdi:lightbulb'
  position: top          # Top of left area

icon_area: right
icon:
  icon: 'mdi:power'
  position: bottom       # Bottom of right area

icon_area: left
icon:
  icon: 'mdi:home'
  x: 10                  # 10px from left edge of icon area
  y: 20                  # 20px from top of icon area
```

### Icon Without Area (Absolute Positioning)

When `icon_area: none`, icon is positioned absolutely on the button like text fields:

```yaml
icon_area: none
icon:
  icon: 'mdi:star'
  position: top-right    # Absolute position on button
  size: 16

icon_area: none
icon:
  icon: 'mdi:alert'
  x_percent: 90          # 90% from left of button
  y_percent: 10          # 10% from top of button
```

**Icon with Background (badge style):**
```yaml
icon_area: none
icon:
  icon: 'mdi:alert'
  position: top-right
  size: 20
  color: white
  background:
    color:
      active: 'var(--lcars-ui-red)'
      inactive: 'transparent'
    radius: '50%'       # Circular background
    padding: 6          # Space between icon and background edge
  padding: 5            # Additional outer padding
```

**Rotated Icon:**
```yaml
icon_area: left
icon:
  icon: 'mdi:arrow-up'
  position: center
  rotation: 90          # Point right
  color: black
```

### Icon State-Based Colors

Icons support state-based colors that change based on entity state:

```yaml
icon:
  icon: 'mdi:lightbulb'
  color:
    active: 'var(--lcars-orange)'      # When entity is ON
    inactive: 'var(--lcars-gray)'      # When entity is OFF
    unavailable: 'var(--lcars-ui-red)' # When unavailable
    default: 'black'                   # Fallback color
```

### Icon Background

Add a background shape behind the icon for badge or indicator effects:

```yaml
icon:
  icon: 'mdi:bell'
  background:
    color:
      active: 'var(--lcars-ui-red)'
      inactive: 'transparent'
    radius: '50%'         # Circular (can also use pixel values like 4)
    padding: 6            # Space between icon and background edge
```

---

## Theme Token Paths

Theme tokens should use this structure:

```javascript
components: {
  button: {
    base: {
      // Background colors
      background: {
        active: 'var(--lcars-orange)',
        inactive: 'alpha(colors.accent.primary, 0.7)',
        unavailable: 'var(--lcars-ui-gray)'
      },

      // Border configuration
      border: {
        width: '2px',
        radius: '8px',
        color: {
          active: 'black',
          inactive: 'var(--lcars-gray)',
          unavailable: 'var(--lcars-ui-gray)'
        }
        // Per-side/corner also supported:
        // width: { top: '2px', right: '2px', bottom: '2px', left: '2px' }
        // radius: { top_left: '20px', top_right: '8px', ... }
        // top: { width: '3px', color: 'red' }
      },

      // Text defaults
      text: {
        default: {
          color: {
            active: 'black',
            inactive: 'var(--lcars-color-text-disabled)',
            unavailable: 'var(--lcars-ui-red)'
          },
          font_size: '14px',
          font_weight: 'bold',
          font_family: "'LCARS', 'Antonio', sans-serif"
        }
      }
    }
  }
}
```

**Usage in config:**
```yaml
style:
  card:
    color:
      background:
        active: theme:components.button.base.background.active
  border:
    radius: theme:components.button.base.border.radius
  text:
    default:
      color:
        active: theme:components.button.base.text.default.color.active
```

---

## Preset Structure

Presets should follow the same schema:

```javascript
button: {
  lozenge: {
    border: {
      radius: {
        top_left: '50%',
        top_right: '8px',
        bottom_right: '50%',
        bottom_left: '8px'
      }
    }
  }
}
```

---

## Multi-Text Label System (Phase 1)

**Status:** ✅ IMPLEMENTED

The multi-text label system allows multiple text fields with flexible positioning and rotation.

### Named Positions

Named positions for both text fields and icons with automatic anchor/baseline:

- **Corners:** `top-left`, `top-right`, `bottom-left`, `bottom-right`
- **Edge Centers:** `top-center`, `bottom-center`, `left-center`, `right-center`
- **Center:** `center`
- **Synonyms (edge center shortcuts):**
  - `top` → `top-center`
  - `bottom` → `bottom-center`
  - `left` → `left-center`
  - `right` → `right-center`

**Default positions:**
- Icons: `left-center` (or just `left`)
- Text fields: `center` (except preset fields like `name`, `state`)

### Basic Syntax

```yaml
# Simple shorthand
label: "Button Text"

# Full multi-text syntax
text:
  label:
    content: "Button Text"
    position: center        # or 'top', 'left', 'bottom-right', etc.
```

**Position Synonyms:**
For convenience, edge positions have shortcuts:
- `left` → `left-center`
- `right` → `right-center`
- `top` → `top-center`
- `bottom` → `bottom-center`

### Multiple Fields

```yaml
text:
  title:
    content: "Room Control"
    position: top-center
    font_size: 16
    font_weight: bold

  subtitle:
    content: "Living Room"
    position: center
    font_size: 14

  status:
    content: "Active"
    position: bottom-center
    font_size: 12
    color: "#66FF66"
```

### Custom Padding

```yaml
text:
  label:
    content: "Padded Text"
    position: top-left
    padding: 20  # Uniform padding

  custom:
    content: "Custom Padding"
    position: top-right
    padding:
      top: 25
      left: 30
      bottom: 10
      right: 15
```

### State-Based Colors

```yaml
text:
  label:
    content: "State Colors"
    position: center
    color:
      active: "#66FF66"       # When entity is ON
      inactive: "#FF6666"     # When entity is OFF
      unavailable: "#666666"  # When unavailable
```

### Preset Fields

Three fields have default positions:
- `label`: defaults to `center`
- `name`: defaults to `top-left`
- `state`: defaults to `bottom-right`

```yaml
text:
  label:
    content: "Main Label"
    # Uses default center position

  name:
    content: "Device Name"
    # Uses default top-left position

  state:
    content: "ON"
    # Uses default bottom-right position
```

### Icon Area Awareness

Text automatically accounts for icon space:

```yaml
icon_area: left           # Icon reserves space on left with divider
icon_area_size: 80        # Optional, auto-calculated if omitted
icon:
  icon: mdi:lightbulb
  position: center        # Position within left icon area

text:
  label:
    content: "With Icon"
    position: center      # Centers in remaining text area (right of divider)
```

### Text Rotation

Text can be rotated at any angle around its anchor point:

```yaml
text:
  horizontal:
    content: "HORIZONTAL"
    position: center
    rotation: 0  # Default: no rotation

  vertical:
    content: "VERTICAL"
    position: left-center
    rotation: 90  # Rotate 90° clockwise

  diagonal:
    content: "DIAGONAL"
    position: top-right
    rotation: 45  # Rotate 45° clockwise

  upside_down:
    content: "UPSIDE DOWN"
    position: bottom-center
    rotation: 180  # Rotate 180° (upside down)

  counter_clockwise:
    content: "COUNTER"
    position: right-center
    rotation: -90  # Rotate 90° counter-clockwise
```

**Rotation Details:**
- Rotation angle in degrees (positive = clockwise, negative = counter-clockwise)
- Text rotates around its anchor point (x, y coordinates)
- Combines with all positioning methods (named positions, explicit x/y, percentages)
- Uses SVG `transform="rotate(angle x y)"` attribute

### Explicit Coordinates and Percentages

Use absolute pixel coordinates or percentages for precise positioning:

```yaml
text:
  absolute_position:
    content: "At (100, 30)"
    x: 100
    y: 30
    anchor: middle
    baseline: central

  relative_position:
    content: "At 50%, 50%"
    x_percent: 50
    y_percent: 50
    anchor: middle
    baseline: central
```

**Positioning Priority:**
1. Explicit `x` and `y` (highest priority)
2. Percentage `x_percent` and `y_percent`
3. Named `position`
4. Default: `center`

---

## SVG Backgrounds & Interactive Segments

### Phase 1: Full SVG Backgrounds

Replace the button background with custom SVG content:

```yaml
type: custom:lcards-button
svg:
  content: |
    <rect width="100" height="100" fill="url(#grad1)" />
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#ff9900;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#cc6600;stop-opacity:1" />
      </linearGradient>
    </defs>
  viewBox: "0 0 100 100"
```

**SVG Configuration Properties:**
- `content` - Inline SVG markup (with or without outer `<svg>` tag)
- `src` - External SVG path (`/local/shapes/icon.svg`) or data URI
- `viewBox` - ViewBox for scaling (auto-detected if omitted)
- `preserveAspectRatio` - Aspect ratio handling (default: `xMidYMid meet`)
- `enable_tokens` - Enable template token replacement (default: `true`)
- `allow_scripts` - Allow script elements (SECURITY RISK, default: `false`)

**Token Support in SVG:**
```yaml
svg:
  enable_tokens: true
  content: |
    <circle cx="50" cy="50" r="40"
            fill="{{entity.state == 'on' ? 'var(--lcars-orange)' : 'var(--lcars-blue)'}}" />
```

**Security:**
- Scripts and event handlers are sanitized by default
- External resources in `foreignObject` are blocked
- `javascript:` and `data:` URLs are stripped
- Set `allow_scripts: true` only for trusted content

**Text Click-Through:**
- All `<text>`, `<tspan>`, and `<foreignObject>` elements automatically get `pointer-events="none"`
- This allows text to overlay interactive segments without blocking interactions

---

### Phase 2: Interactive Segments (Entity State Awareness)

Create multi-action regions within SVG with independent entity states and interactions:

```yaml
type: custom:lcards-button
entity: remote.living_room    # Card-level entity (default for segments)
svg:
  content: |
    <svg viewBox="0 0 100 100">
      <!-- Each segment is a clickable region -->
      <path id="arrow-up" d="M 40,30 L 50,15 L 60,30 ..." fill="#6688aa" />
      <path id="arrow-down" d="M 40,70 L 50,85 L 60,70 ..." fill="#6688aa" />
      <circle id="center-btn" cx="50" cy="50" r="10" fill="#9966cc" />
    </svg>
  viewBox: "0 0 100 100"
  segments:
    - id: up
      selector: "#arrow-up"
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: UP
      style:
        fill:
          default: "#6688aa"
          hover: "#ffcc00"
          pressed: "#ff9900"

    - id: down
      selector: "#arrow-down"
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: DOWN
      style:
        fill:
          default: "#6688aa"
          hover: "#ffcc00"
          pressed: "#ff9900"

    - id: center
      selector: "#center-btn"
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: SELECT
      style:
        fill:
          default: "#9966cc"
          hover: "#ffcc00"
          pressed: "#ff9900"
```

**Segment Configuration:**
- `id` - Unique segment identifier (for debugging)
- `selector` - CSS selector to find SVG elements (e.g., `#arrow-up`, `[data-segment="up"]`, `.button-group`)
- `entity` - Optional entity for this segment (inherits card entity if omitted)
- `tap_action` / `hold_action` / `double_tap_action` - Actions (same structure as card actions)
- `style` - State-based styling (see Style Formats below)

**Entity Tracking:**
- Segments with `entity` are automatically tracked for HASS updates
- Card re-renders when ANY segment entity changes
- Segment inherits card entity if `entity` is omitted
- Each segment can control a different entity

**Example: Multi-Light Control** (different entities per segment)
```yaml
type: custom:lcards-button
svg:
  content: |
    <svg viewBox="0 0 100 100">
      <circle id="light1" cx="25" cy="50" r="20" fill="gray" />
      <circle id="light2" cx="75" cy="50" r="20" fill="gray" />
    </svg>
  segments:
    - id: bedroom
      selector: "#light1"
      entity: light.bedroom        # Controls bedroom light
      tap_action:
        action: toggle
      style:
        fill:
          inactive: "#6688aa"
          active: "#ff9966"        # Orange when light is on
          hover: "#ffcc00"

    - id: living_room
      selector: "#light2"
      entity: light.living_room    # Controls living room light
      tap_action:
        action: toggle
      style:
        fill:
          inactive: "#6688aa"
          active: "#ff9966"        # Orange when light is on
          hover: "#ffcc00"
```

---

### Segment Style Formats

Segments support **BOTH** style formats - auto-detected at runtime:

#### State-First Format (Recommended for YAML)
States at top level, properties nested inside:

```yaml
style:
  active:                # Entity state: light is on
    fill: "#ff9966"
    stroke: "#ffbb88"
    stroke-width: 3
  inactive:              # Entity state: light is off
    fill: "#6688aa"
    stroke: "#8899bb"
    stroke-width: 2
  hover:                 # Interaction state: mouse over
    stroke: "#ffffff"
    stroke-width: 4
  pressed:               # Interaction state: mouse down
    fill: "#ffcc99"
  default:               # Fallback
    fill: "#888888"
```

#### Property-First Format (Alternative)
Properties at top level, states nested inside:

```yaml
style:
  fill:
    active: "#ff9966"
    inactive: "#6688aa"
    hover: "#ffcc00"
    pressed: "#ffcc99"
    default: "#888888"
  stroke:
    active: "#ffbb88"
    inactive: "#8899bb"
    hover: "#ffffff"
  stroke-width:
    active: 3
    inactive: 2
    hover: 4
```

**Format Detection:**
- Auto-detects by checking if first value contains style properties (`fill`, `stroke`, `opacity`)
- Both formats produce identical results
- State-first is more compact for YAML

**Supported Style Properties:**
- `fill` - Fill color
- `stroke` - Stroke/border color
- `stroke-width` - Border width
- `opacity` - Element opacity (0-1)

**State Priority (High to Low):**
1. **Interaction States** - `hover` (mouse over), `pressed` (mouse down during click)
2. **Entity State (Direct)** - Exact entity state (`on`, `off`, `playing`, `paused`, etc.)
3. **Entity State (Mapped)** - Automatically mapped to Button conventions:
   - `on`, `playing`, `unlocked`, `open`, `home` → `active`
   - `off`, `paused`, `stopped`, `locked`, `closed`, `away` → `inactive`
   - `unavailable`, `unknown` → `unavailable`
   - 40+ entity states automatically mapped
4. **Default State** - `default` fallback
5. **First Available** - Any defined state

**Entity State Examples:**
```yaml
# Light: on/off mapped to active/inactive
entity: light.bedroom
style:
  fill:
    active: "#ff9966"     # Applied when light is on
    inactive: "#6688aa"   # Applied when light is off
    unavailable: "#ff0000"

# Media Player: detailed state mapping
entity: media_player.spotify
style:
  fill:
    playing: "#00ff00"    # Direct match
    paused: "#ffcc00"     # Direct match
    # 'playing' also maps to 'active' as fallback
    # 'paused' also maps to 'inactive' as fallback
```

**Interaction Overlay:**
- `hover` and `pressed` states overlay on top of entity state
- Entity state persists - returns after interaction
- Example: Light on (orange) → hover (white border overlay) → returns to orange

---

## Future: Multi-Text Support (Phase 2)

Phase 2 will add:
- Multi-line text wrapping
- Text rotation ✅ **DONE**
- Template support in content ✅ **DONE**
- Advanced positioning (explicit x/y coordinates) ✅ **DONE**
- Percentage-based positioning ✅ **DONE**

Remaining Phase 2 features:

```yaml
# Future Phase 2 syntax (not yet implemented)
text:
  dynamic:
    content: "{entity.state}"
    position: top-left
    wrap: true
    max_width: 150
```

---

## Implementation Checklist

To implement this schema:

### 1. Theme Tokens
- [x] Update `lcarsClassicTokens.js` to use consistent `font_size`
- [x] Organize `components.button.base` structure clearly
- [x] Use `border.{width|radius|color.state}` nested structure
- [x] Use `text.default.{color.state|font_size|font_weight|font_family}` structure

### 2. Presets
- [x] Update button presets (e.g., `lozenge`) in `loadBuiltinPacks.js`
- [x] Use `border.radius` nested structure
- [x] Use `text.default.font_size` (not `size`)
- [x] Ensure all presets follow nested schema

### 3. Button Code
- [x] Remove all backward compatibility code for flat keys
- [x] Only support nested schema paths
- [x] Update `_resolveButtonStyleSync()` to only use nested paths
- [x] Update `_generateButtonSVG()` to only read nested paths
- [x] Update `_resolveBorderConfiguration()` for nested schema only

### 4. Documentation
- [x] Update `button-schema-definition.md` with finalized schema
- [x] Update `button-quick-reference.md` to match exactly
- [x] Remove all backward compatibility references
- [x] Standardize on `font_size` everywhere
- [x] Add BREAKING CHANGES notice

### 5. Testing
- [ ] Update all test configs to use nested schema
- [ ] Verify buttons render correctly
- [ ] Test rules engine integration
- [ ] Test computed tokens in nested paths

---



## Complete Example

```yaml
type: custom:lcards-button
entity: light.living_room

# Icon area on left with state-based colors
icon_area: left
icon:
  icon: 'mdi:lightbulb'
  position: center         # Centered within left area
  size: 28
  color:
    active: 'var(--lcars-orange)'
    inactive: 'var(--lcars-gray)'
    unavailable: 'var(--lcars-ui-red)'
  padding: 10

# Multiple text fields in text area
text:
  title:
    content: "Living Room"
    position: top          # Top of text area
    font_size: 14
    font_weight: normal

  label:
    content: "Main Light"
    position: center       # Center of text area
    font_size: 18

  status:
    content: "{entity.attributes.brightness}%"
    position: bottom-right # Bottom-right of text area
    font_size: 12

style:
  card:
    color:
      background:
        active: 'var(--lcars-orange)'
        inactive: alpha(colors.accent.primary, 0.5)
        unavailable: 'var(--lcars-ui-gray)'

  border:
    width: 2px
    radius:
      top_left: 20px
      top_right: 8px
      bottom_right: 20px
      bottom_left: 8px
    color:
      active: 'black'
      inactive: 'var(--lcars-gray)'

  text:
    default:
      color:
        active: 'black'
        inactive: 'var(--lcars-color-text-disabled)'
      font_size: 16px
      font_weight: bold

tap_action:
  action: toggle

rules:
  - when:
      condition: "entity.attributes.brightness > 200"
    apply:
      style:
        card:
          color:
            background:
              active: 'var(--lcars-yellow)'
      # Can also override icon color in rules
      icon:
        color:
          active: 'var(--lcars-yellow)'
```

---

**Status:** 🎯 DEFINITIVE SCHEMA - Use this to update all implementations
