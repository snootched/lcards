# Simple Button Card - Official Schema Definition

**Purpose:** Single source of truth for schema - update tokens, presets, code, and docs from this
**Status:** 🎯 DEFINITIVE - All implementations must match this

---

## Complete YAML Schema

```yaml
type: custom:lcards-simple-button

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
- [x] Update `_generateSimpleButtonSVG()` to only read nested paths
- [x] Update `_resolveBorderConfiguration()` for nested schema only

### 4. Documentation
- [x] Update `simple-button-schema-definition.md` with finalized schema
- [x] Update `simple-button-quick-reference.md` to match exactly
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
type: custom:lcards-simple-button
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
