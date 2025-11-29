# Simple Button Card - Quick Reference

**Component:** `custom:lcards-simple-button`
**Schema:** CB-LCARS Nested Schema with Multi-Text Support

---

## Complete Schema

```yaml
type: custom:lcards-simple-button
entity: <entity_id>           # Optional: Home Assistant entity
preset: <preset_name>          # Optional: 'lozenge', 'lozenge-right', etc.

# Icon Area Configuration
icon_area: left | right | top | bottom | none  # Where icon's reserved space is (default: left)
icon_area_size: <number>       # Optional: override calculated area size (width for left/right, height for top/bottom)

# Icon Configuration
icon: <icon_string>            # Simple: 'mdi:lightbulb', 'si:github', 'entity'
# OR advanced:
icon:
  icon: <icon_string>          # 'mdi:lightbulb', 'si:github', 'entity'
  position: <position-name>    # Position WITHIN the icon area (e.g., 'top', 'center', 'bottom')
  size: <number>               # Icon size in pixels (default: 24)
  color: <color>               # Simple color OR {active, inactive, unavailable}
  rotation: <number>           # Rotation angle in degrees
  padding: <number>            # Uniform padding OR {top, right, bottom, left}
  background:                  # Optional badge/indicator style
    color: <color>             # Background color (can be state-based)
    radius: <number>           # Border radius (e.g., 4, '50%' for circle)
    padding: <number>          # Space between icon and background
  show: <boolean>              # Explicitly show/hide icon

# Multi-text label system
text:
  <field-id>:                  # Any field ID (e.g., 'label', 'title', 'status')
    content: <string>          # Text to display
    position: <position-name>  # Named position (see below)
    x: <number>                # Explicit x coordinate (overrides position)
    y: <number>                # Explicit y coordinate (overrides position)
    x_percent: <number>        # Percentage x position (0-100)
    y_percent: <number>        # Percentage y position (0-100)
    rotation: <number>         # Rotation angle in degrees (positive = clockwise)
    padding: <number>          # Uniform padding OR {top, right, bottom, left}
    font_size: <number>        # Font size in pixels (default: 14)
    color: <color>             # Color OR {active, inactive, unavailable}
    font_weight: <css-value>   # Font weight (default: bold)
    font_family: <css-value>   # Font family
    text_transform: none | uppercase | lowercase | capitalize  # Text transformation
    anchor: start | middle | end  # Text anchor (default: from position)
    baseline: hanging | central | alphabetic  # Baseline (default: from position)
    show: <boolean>            # Show/hide field (default: true)
    template: <boolean>        # Enable template processing (default: true)

# SVG Backgrounds & Interactive Segments
svg:
  content: <string>            # Inline SVG markup
  src: <path>                  # External SVG file or data URI
  viewBox: <string>            # ViewBox (e.g., "0 0 100 100", auto-detected if omitted)
  preserveAspectRatio: <string> # Default: "xMidYMid meet"
  enable_tokens: <boolean>     # Enable {{entity.state}} tokens (default: true)
  allow_scripts: <boolean>     # Allow scripts (SECURITY RISK, default: false)

  # Interactive segments with entity state awareness
  segments:
    - id: <string>             # Segment identifier
      selector: <css-selector> # e.g., "#arrow-up", "[data-segment=up]"
      entity: <entity_id>      # Optional: different entity per segment
      tap_action: <action>     # Action configuration
      hold_action: <action>
      style:                   # State-based styling (auto-detects format)
        # State-first format:
        active:                # When entity is on/playing/unlocked
          fill: <color>
          stroke: <color>
          stroke-width: <number>
        inactive:              # When entity is off/paused/locked
          fill: <color>
        hover:                 # Mouse over
          stroke: <color>
        pressed:               # Mouse down
          fill: <color>
        # OR property-first format:
        fill:
          active: <color>
          inactive: <color>
          hover: <color>

style:
  # Card background colors (state-based)
  card:
    color:
      background:
        active: <color>        # When entity is ON/active
        inactive: <color>      # When entity is OFF/inactive
        unavailable: <color>   # When entity is unavailable/unknown

  # Border configuration
  border:
    width: <css-size>          # e.g. '2px' OR {top, right, bottom, left}
    radius: <css-size>         # e.g. '8px' OR {top_left, top_right, bottom_right, bottom_left}
    color:
      active: <color>
      inactive: <color>
      unavailable: <color>
    # Individual side styling (optional):
    top: {width: <css-size>, color: <color>}
    right: {width: <css-size>, color: <color>}
    bottom: {width: <css-size>, color: <color>}
    left: {width: <css-size>, color: <color>}

  # Text styling
  text:
    default:
      color:
        active: <color>
        inactive: <color>
        unavailable: <color>
      font_size: <css-size>    # e.g. '16px'
      font_weight: <css-value> # e.g. 'bold', '600'
      font_family: <css-value> # e.g. "'LCARS', sans-serif"

# Actions
tap_action:
  action: <action_type>        # 'toggle', 'call-service', 'navigate', 'more-info', 'none'
  service: <service_name>      # For 'call-service'
  target:
    entity_id: <entity_id>

hold_action:
  action: <action_type>

double_tap_action:
  action: <action_type>

# Rules Engine (dynamic styling)
rules:
  - when:
      condition: <javascript|jinja2|token|entity>
      type: <condition_type>
    apply:
      style:
        <nested_schema>        # Same as style: above
```

---

## Color Value Types

### 1. CSS Variables
```yaml
color: 'var(--lcars-orange)'
color: 'var(--lcars-color-text, #FFFFFF)'  # With fallback
```

### 2. Theme Tokens
```yaml
color: 'theme:components.button.base.background.active'
```

### 3. Computed Tokens
```yaml
color: alpha(colors.accent.primary, 0.7)      # Transparency
color: darken(colors.accent.primary, 20%)     # Darker
color: lighten(colors.accent.primary, 20%)    # Lighter
```

### 4. Direct Colors
```yaml
color: '#FF9900'
color: 'rgb(255, 153, 0)'
color: 'orange'
```

---

## Icon Syntax (HA-Style)

**No `type` field needed - just use strings directly:**

```yaml
icon: 'mdi:lightbulb'              # Material Design Icons
icon: 'si:github'                  # Simple Icons
icon: 'entity'                     # Use entity's own icon
```

### Icon Area Placement

Control where the icon's reserved space is with **horizontal or vertical dividers**:

```yaml
icon_area: left                    # Icon on left with vertical divider (default)
icon_area: right                   # Icon on right with vertical divider
icon_area: top                     # Icon on top with horizontal divider
icon_area: bottom                  # Icon on bottom with horizontal divider
icon_area: none                    # No reserved space, icon positioned absolutely
```

### Icon Positioning Within Area

```yaml
icon_area: left                    # Creates left icon area with vertical divider
icon_area_size: 60                 # Optional: explicit area width (default: auto-calculated)
icon:
  icon: 'mdi:lightbulb'
  position: center                 # Position WITHIN the left area
  # position options: top, center, bottom, top-left, top-right, etc.
  size: 24                         # pixels (default: 24)
  color: 'black'                   # CSS color (can be state-based)
  rotation: 45                     # Rotation angle in degrees
  show: true                       # explicitly show/hide
```

### State-Based Icon Colors

```yaml
icon:
  icon: 'mdi:lightbulb'
  color:
    active: 'green'                # When entity is ON
    inactive: 'red'                # When entity is OFF
    unavailable: 'gray'            # When entity unavailable
```

### Icon Background (Badge Style)

```yaml
icon:
  icon: 'mdi:alert'
  color: 'white'
  background:
    color: 'red'                   # Can also be state-based
    radius: 50%                    # Circle background
    padding: 4                     # Space around icon
```

### Icon Rotation

```yaml
icon:
  icon: 'mdi:refresh'
  rotation: 90                     # Rotate 90 degrees clockwise
```

**Auto-Icon Behavior:**

Presets like `lozenge` set `show_icon: true` by default. If you don't specify an icon and an entity exists, it automatically uses the entity's icon:

```yaml
type: custom:lcards-simple-button
entity: light.kitchen
preset: lozenge
text:
  label:
    content: "Kitchen"
# No icon specified - automatically uses light.kitchen's icon
```

This is equivalent to explicitly setting `icon: 'entity'`.

---

## Border Flexibility

### Uniform Border
```yaml
border:
  width: 2px
  radius: 8px
  color:
    active: 'black'
```

### Per-Corner Radius
```yaml
border:
  radius:
    top_left: 20px
    top_right: 8px
    bottom_right: 20px
    bottom_left: 8px
```

### Per-Side Width
```yaml
border:
  width:
    top: 3px
    right: 1px
    bottom: 3px
    left: 1px
```

### Individual Side Styling
```yaml
border:
  top:
    width: 3px
    color: 'var(--lcars-orange)'
  bottom:
    width: 1px
    color: 'var(--lcars-gray)'
```

---

## Rules Engine

**Correct Syntax:** Use `when`/`apply` blocks (NOT `conditions` arrays)

### JavaScript Condition
```yaml
rules:
  - when:
      condition: "entity.attributes.brightness > 200"
      type: javascript
    apply:
      style:
        card:
          color:
            background:
              active: 'var(--lcars-yellow)'
```

### Jinja2 Template
```yaml
rules:
  - when:
      condition: "{{ state_attr('light.living_room', 'brightness') > 200 }}"
      type: jinja2
    apply:
      style:
        text:
          default:
            color:
              active: 'red'
```

### Token Syntax
```yaml
rules:
  - when:
      condition: "${entity.attributes.brightness} > 200"
      type: token
    apply:
      style:
        border:
          color:
            active: 'theme:colors.warning'
```

### Entity State
```yaml
rules:
  - when:
      condition: "on"
      type: entity
    apply:
      style:
        card:
          color:
            background:
              active: 'green'
```

---

## Complete Examples

### Example 1: Basic Entity Button
```yaml
type: custom:lcards-simple-button
entity: light.living_room
label: "Living Room"
icon: 'mdi:lightbulb'

style:
  card:
    color:
      background:
        active: 'var(--lcars-orange)'
        inactive: alpha(colors.accent.primary, 0.5)

tap_action:
  action: toggle
```

### Example 2: Lozenge with Per-Side Borders
```yaml
type: custom:lcards-simple-button
preset: lozenge
label: "Engineering"
icon: 'mdi:wrench'

style:
  border:
    top:
      width: 3px
      color: 'var(--lcars-yellow)'
    bottom:
      width: 1px
      color: 'var(--lcars-gray)'
```

### Example 3: Brightness-Aware Button
```yaml
type: custom:lcards-simple-button
entity: light.bedroom
label: "Bedroom"
icon: 'entity'

style:
  card:
    color:
      background:
        active: 'var(--lcars-blue)'
        inactive: 'var(--lcars-gray)'

  text:
    default:
      color:
        active: 'white'
        inactive: 'var(--lcars-color-text-disabled)'
      font_size: 16px
      font_weight: bold

rules:
  - when:
      condition: "entity.attributes.brightness > 200"
      type: javascript
    apply:
      style:
        card:
          color:
            background:
              active: 'var(--lcars-yellow)'
        text:
          default:
            color:
              active: 'black'
```

### Example 4: Service Call Button
```yaml
type: custom:lcards-simple-button
text:
  label:
    content: "All Lights Off"
icon: 'mdi:lightbulb-off'

style:
  card:
    color:
      background:
        active: 'var(--lcars-ui-red)'
  text:
    default:
      color:
        active: 'white'
      font_size: 18px
      font_weight: bold

tap_action:
  action: call-service
  service: light.turn_off
  target:
    area_id: all
```

### Example 5: Icon Area Variations

```yaml
# Left icon area (default)
type: custom:lcards-simple-button
entity: light.living_room
icon_area: left
icon_area_size: 60
icon:
  icon: 'mdi:lightbulb'
  position: top                    # Top of left area
  rotation: 45
  color:
    active: 'yellow'
    inactive: 'gray'
text:
  label:
    content: "Living Room"
    position: center

---

# Top icon area with horizontal divider
type: custom:lcards-simple-button
entity: climate.bedroom
icon_area: top
icon_area_size: 50
icon:
  icon: 'mdi:thermostat'
  position: center                 # Center of top area
  color:
    active: 'orange'
    inactive: 'blue'
text:
  label:
    content: "Bedroom"
    position: center               # Center of text area below divider
  temp:
    content: "72°F"
    position: bottom-right
```

---

## Presets

Built-in style presets extend `button.base` theme:

| Preset | Description |
|--------|-------------|
| **`lozenge`** | Fully rounded (50% radius all corners), icon on left |
| **`lozenge-right`** | Lozenge with icon on right |
| **`bullet`** | Half rounded (right side), icon on left |
| **`bullet-right`** | Half rounded (left side), icon on right |
| **`capped`** | Single side rounded (left), icon on left |
| **`capped-right`** | Single side rounded (right), icon on right |
| **`barrel`** | Square corners, solid background |
| **`barrel-right`** | Square corners with icon on right |
| **`filled`** | Larger text (Picard style), icon on left |
| **`filled-right`** | Larger text with icon on right |
| **`outline`** | Transparent background with colored border |
| **`outline-right`** | Outline style with icon on right |
| **`icon`** | Icon-only compact button |
| **`text-only`** | Pure text label with no background or border |

**Usage:**
```yaml
type: custom:lcards-simple-button
preset: lozenge
label: "Rounded"
# Preset automatically sets: icon_area: left, icon.position: center, etc.
```

**Override preset styles:**
```yaml
type: custom:lcards-simple-button
preset: lozenge
label: "Custom Lozenge"
icon_area_size: 80                 # Override icon area width
icon:
  rotation: 45                     # Add rotation
style:
  border:
    color:
      active: 'var(--lcars-yellow)'
```

### Text-Only Labels

Use the `text-only` preset for pure text labels without button appearance:

```yaml
type: custom:lcards-simple-button
preset: text-only
text:
  label:
    content: "ENVIRONMENTAL CONTROLS"
    font_size: 18
    color: "var(--lcars-orange)"
```

**Use Cases:**
- Section headers
- Status indicators (without entity binding)
- Decorative labels
- Panel titles

**Note:** Text-only labels still support actions (`tap_action`, etc.) and entity binding for dynamic content.

---

## State Resolution

Entity states map to button states:

| Entity State | Button State | Description |
|--------------|--------------|-------------|
| `on`, `open`, `locked`, `home`, `playing`, `active` | `active` | Entity is "on" |
| `off`, `closed`, `unlocked`, `away`, `paused`, `idle` | `inactive` | Entity is "off" |
| `unavailable`, `unknown` | `unavailable` | Entity not available |

**Auto-opacity:**
- `active`: 1.0 (100%)
- `inactive`: 0.7 (70%)
- `unavailable`: 0.5 (50%)

---

## SVG Backgrounds & Interactive Segments

Replace button background with custom SVG and create multi-action interactive regions.

### Basic SVG Background

```yaml
type: custom:lcards-simple-button
svg:
  content: |
    <rect width="100" height="100" fill="url(#grad1)" />
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ff9900" stop-opacity="1" />
        <stop offset="100%" stop-color="#cc6600" stop-opacity="1" />
      </linearGradient>
    </defs>
  viewBox: "0 0 100 100"
text:
  label:
    content: "Gradient Button"
    position: center
    color: white
```

### External SVG File

```yaml
type: custom:lcards-simple-button
svg:
  src: "/local/shapes/starfleet-delta.svg"
text:
  label:
    content: "Starfleet"
    position: bottom-center
```

### SVG with Entity Tokens

```yaml
type: custom:lcards-simple-button
entity: light.bedroom
svg:
  enable_tokens: true
  content: |
    <circle cx="50" cy="50" r="40"
            fill="{{entity.state == 'on' ? 'var(--lcars-orange)' : 'var(--lcars-blue)'}}" />
  viewBox: "0 0 100 100"
text:
  state:
    content: "{{entity.state}}"
    position: center
```

### Interactive Segments - Remote Control

Create a D-pad with separate actions for each direction:

```yaml
type: custom:lcards-simple-button
entity: remote.living_room
svg:
  content: |
    <svg viewBox="0 0 100 100">
      <!-- Up arrow -->
      <path id="arrow-up" d="M 40,30 L 50,15 L 60,30 L 55,30 L 55,45 L 45,45 L 45,30 Z" />

      <!-- Down arrow -->
      <path id="arrow-down" d="M 40,70 L 50,85 L 60,70 L 55,70 L 55,55 L 45,55 L 45,70 Z" />

      <!-- Left arrow -->
      <path id="arrow-left" d="M 30,40 L 15,50 L 30,60 L 30,55 L 45,55 L 45,45 L 30,45 Z" />

      <!-- Right arrow -->
      <path id="arrow-right" d="M 70,40 L 85,50 L 70,60 L 70,55 L 55,55 L 55,45 L 70,45 Z" />

      <!-- Center button -->
      <circle id="center-circle" cx="50" cy="50" r="10" />
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

    - id: left
      selector: "#arrow-left"
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: LEFT
      style:
        fill:
          default: "#6688aa"
          hover: "#ffcc00"

    - id: right
      selector: "#arrow-right"
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: RIGHT
      style:
        fill:
          default: "#6688aa"
          hover: "#ffcc00"

    - id: center
      selector: "#center-circle"
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: SELECT
      style:
        fill:
          default: "#9966cc"
          hover: "#ffcc00"
```

### Multi-Light Control - Different Entity Per Segment

Each segment can control a different entity with entity state awareness:

```yaml
type: custom:lcards-simple-button
svg:
  content: |
    <svg viewBox="0 0 100 100">
      <rect width="100" height="100" fill="#000000" />

      <!-- Bedroom light segment -->
      <rect id="light-bedroom" x="10" y="10" width="35" height="80" rx="8" />
      <text x="27.5" y="55" text-anchor="middle" fill="white" font-size="12">BED</text>

      <!-- Living room light segment -->
      <rect id="light-living" x="55" y="10" width="35" height="80" rx="8" />
      <text x="72.5" y="55" text-anchor="middle" fill="white" font-size="12">LIV</text>
    </svg>
  viewBox: "0 0 100 100"
  segments:
    - id: bedroom
      selector: "#light-bedroom"
      entity: light.bedroom              # Controls bedroom light
      tap_action:
        action: toggle
      style:
        active:                           # Light on
          fill: "#ff9966"
          stroke: "#ffbb88"
          stroke-width: 3
        inactive:                         # Light off
          fill: "#6688aa"
          stroke: "#8899bb"
          stroke-width: 2
        hover:                            # Mouse over
          stroke: "#ffffff"
          stroke-width: 4

    - id: living_room
      selector: "#light-living"
      entity: light.living_room          # Controls living room light
      tap_action:
        action: toggle
      style:
        active:
          fill: "#ff9966"
          stroke: "#ffbb88"
          stroke-width: 3
        inactive:
          fill: "#6688aa"
          stroke: "#8899bb"
          stroke-width: 2
        hover:
          stroke: "#ffffff"
          stroke-width: 4
```

**Key Features:**
- **Entity Tracking:** Segment entities are automatically tracked - card updates when ANY segment entity changes
- **Entity States:** Entity states (`on`, `off`, `playing`, `paused`, etc.) automatically map to `active`/`inactive`
- **Text Click-Through:** Text elements automatically get `pointer-events: none` - hover works even over text
- **State Priority:** `hover`/`pressed` (interaction) > entity state > `default`
- **Style Formats:** Auto-detects state-first `{ active: { fill: "#f90" } }` OR property-first `{ fill: { active: "#f90" } }`

**Supported States:**
- **Entity:** `active`, `inactive`, `unavailable`, `default`
- **Interaction:** `hover` (mouse over), `pressed` (mouse down)
- **Auto-Mapping:** 40+ entity states automatically mapped (on→active, off→inactive, playing→active, paused→inactive, etc.)

---

## Theme Token Reference

### Background Colors
```
components.button.base.background.active
components.button.base.background.inactive
components.button.base.background.unavailable
```

### Text Colors
```
components.button.base.text.default.color.active
components.button.base.text.default.color.inactive
components.button.base.text.default.color.unavailable
```

### Border Properties
```
components.button.base.border.width
components.button.base.border.radius
components.button.base.border.color.active
components.button.base.border.color.inactive
components.button.base.border.color.unavailable
```

### Font Properties
```
components.button.base.text.default.font_size
components.button.base.text.default.font_weight
components.button.base.text.default.font_family
```

---

## Multi-Text Label System

Multiple text fields with flexible positioning and rotation.

### Named Positions

Nine pre-defined positions:
- **Corners:** `top-left`, `top-right`, `bottom-left`, `bottom-right`
- **Edges:** `top-center`, `bottom-center`, `left-center`, `right-center`
- **Center:** `center`

### Basic Example

```yaml
# Simple shorthand
label: "Button"

# Full multi-text syntax
text:
  label:
    content: "Button"
    position: center
```

### Multiple Fields

```yaml
text:
  title:
    content: "Living Room"
    position: top-center
    font_size: 16
    font_weight: bold

  status:
    content: "2 lights on"
    position: bottom-center
    font_size: 12
    color: "#66FF66"
```

### Preset Fields

Three fields have default positions:

```yaml
text:
  label:
    content: "Main"     # Defaults to center
  name:
    content: "Name"     # Defaults to top-left
  state:
    content: "ON"       # Defaults to bottom-right
```

### Custom Padding

```yaml
text:
  label:
    content: "Text"
    position: top-left
    padding: 20  # Uniform

  other:
    content: "More"
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
    content: "Light"
    position: center
    color:
      active: "#66FF66"
      inactive: "#FF6666"
      unavailable: "#666666"
```

### With Icons

Text automatically accounts for icon area space:

```yaml
icon_area: left                    # Icon on left with vertical divider
icon_area_size: 60                 # Optional: explicit area width
icon:
  icon: mdi:lightbulb
  position: center                 # Position within left area

text:
  label:
    content: "Light"
    position: center               # Centers in text area (right of divider)
```

**With top/bottom icon areas:**

```yaml
icon_area: top                     # Icon on top with horizontal divider
icon_area_size: 50                 # Optional: explicit area height
icon:
  icon: mdi:lightbulb
  position: left                   # Position within top area

text:
  label:
    content: "Light"
    position: center               # Centers in text area (below divider)
```

### Text Rotation

Rotate text at any angle (in degrees):

```yaml
text:
  horizontal:
    content: "NORMAL"
    position: center
    rotation: 0

  vertical:
    content: "VERTICAL"
    position: left-center
    rotation: 90

  diagonal:
    content: "DIAGONAL"
    position: top-right
    rotation: 45

  upside_down:
    content: "FLIPPED"
    position: bottom-center
    rotation: 180
```

### Explicit Positioning

Use absolute coordinates or percentages:

```yaml
text:
  absolute:
    content: "At (100, 30)"
    x: 100
    y: 30
    anchor: middle
    baseline: central

  relative:
    content: "At 50%"
    x_percent: 50
    y_percent: 50
```

**Positioning Priority:**
1. Explicit `x`, `y` (highest)
2. Percentage `x_percent`, `y_percent`
3. Named `position`
4. Default: center



## Troubleshooting

### Button not showing colors
- Check entity state is resolving correctly
- Verify color values are valid CSS
- Use browser DevTools to inspect SVG element
- Check theme tokens are defined

### Rules not applying
- Verify `when`/`apply` syntax (not `conditions`)
- Check condition type matches expression
- Use browser console for JavaScript errors
- Test condition expression in HA template tool

### Icons not displaying
- Ensure icon syntax is `'mdi:icon'` format
- Check icon exists in Material Design Icons
- Verify Simple Icons with `'si:icon'` format
- For custom icons, use `icon_path` property

---

**For complete implementation details, see:**
- `simple-button-schema-definition.md` - Full schema specification
