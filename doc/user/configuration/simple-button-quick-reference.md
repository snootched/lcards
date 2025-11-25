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

- **`lozenge`** - Fully rounded (50% radius all corners), icon on left
- **`lozenge-right`** - Lozenge with icon on right

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
