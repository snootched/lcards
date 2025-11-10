# LCARdS Overlay Cards - Phase 2b

## Overview

Phase 2b introduces standalone overlay cards that extract and reuse the existing MSD overlay classes (TextOverlay, ButtonOverlay) to work in both MSD and standalone contexts. This eliminates code duplication while providing simple, standalone cards for LCARS-styled UI elements.

## Architecture

The overlay cards follow a shared architecture:

- **LCARdSOverlayCard**: Base class extending LCARdSNativeCard
- **Context-Aware Overlays**: Existing MSD overlays modified to support dual-context operation
- **Unified API**: Same overlay classes work in both MSD and standalone modes
- **Core Integration**: Access to Phase 2a core systems (rules, themes, animations)

### Key Components

```
/src/cards/overlays/
├── LCARdSOverlayCard.js      # Base overlay card class
├── LCARdSTextCard.js         # Text overlay card
├── LCARdSButtonCard.js       # Button overlay card
└── index.js                  # Main exports and registration
```

## Available Cards

### LCARdS Text Card (`lcards-text-card`)

Displays text with LCARS styling and template support.

#### Configuration

```yaml
type: custom:lcards-text-card
text: "Temperature: {{sensor.temperature}}°C"
position:
  x: 50          # X position (percentage)
  y: 50          # Y position (percentage)
style:
  fontSize: "24px"
  color: "#FF9900"
  fontFamily: "LCARS"
  textAlign: "center"
  fontWeight: "normal"
animation:
  enabled: false
  type: "fade"
  duration: 1000
```

#### Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `text` | string | ✅ | - | Text content (supports templates) |
| `position.x` | number | - | 50 | X position as percentage |
| `position.y` | number | - | 50 | Y position as percentage |
| `style.fontSize` | string | - | "16px" | Font size |
| `style.color` | string | - | "#FF9900" | Text color |
| `style.fontFamily` | string | - | "LCARS" | Font family |
| `style.textAlign` | string | - | "center" | Text alignment |
| `style.fontWeight` | string | - | "normal" | Font weight |
| `animation.enabled` | boolean | - | false | Enable animations |
| `animation.type` | string | - | "fade" | Animation type |
| `animation.duration` | number | - | 1000 | Animation duration (ms) |

#### Template Support

The text card supports Home Assistant template syntax:

```yaml
# Entity state
text: "{{sensor.temperature}}"

# Entity attribute
text: "{{sensor.temperature.attributes.unit_of_measurement}}"

# Complex templates
text: "Temperature: {{sensor.temperature}}°{{sensor.temperature.attributes.unit_of_measurement}}"
```

### LCARdS Button Card (`lcards-button-card`)

Interactive LCARS-styled buttons with action support.

#### Configuration

```yaml
type: custom:lcards-button-card
label: "Toggle Light"
entity: "light.living_room"
position:
  x: 50          # X position (percentage)
  y: 50          # Y position (percentage)
  width: 120     # Button width (pixels)
  height: 40     # Button height (pixels)
style:
  fontSize: "14px"
  color: "#FFFFFF"
  backgroundColor: "#FF9900"
  borderColor: "#FF9900"
  fontFamily: "LCARS"
  borderRadius: "20px"
action:
  tap:
    action: "toggle"
    target:
      entity_id: "light.living_room"
animation:
  enabled: false
  type: "pulse"
  duration: 500
```

#### Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `label` | string | ✅ | - | Button label (supports templates) |
| `entity` | string | - | - | Entity ID for default actions |
| `position.x` | number | - | 50 | X position as percentage |
| `position.y` | number | - | 50 | Y position as percentage |
| `position.width` | number | - | 120 | Button width in pixels |
| `position.height` | number | - | 40 | Button height in pixels |
| `style.fontSize` | string | - | "14px" | Font size |
| `style.color` | string | - | "#FFFFFF" | Text color |
| `style.backgroundColor` | string | - | "#FF9900" | Background color |
| `style.borderColor` | string | - | "#FF9900" | Border color |
| `style.fontFamily` | string | - | "LCARS" | Font family |
| `style.borderRadius` | string | - | "20px" | Border radius |
| `action.tap` | object | - | - | Tap/click action |
| `action.hold` | object | - | - | Hold action |
| `action.double_tap` | object | - | - | Double tap action |

#### Actions

Button cards support standard Home Assistant card actions:

```yaml
# Toggle entity
action:
  tap:
    action: "toggle"
    target:
      entity_id: "light.living_room"

# Call service
action:
  tap:
    action: "call-service"
    service: "light.turn_on"
    target:
      entity_id: "light.living_room"
    service_data:
      brightness: 255

# Navigate
action:
  tap:
    action: "navigate"
    navigation_path: "/lovelace/dashboard"

# More info dialog
action:
  tap:
    action: "more-info"
    target:
      entity_id: "sensor.temperature"
```

## Usage Examples

### Simple Text Display

```yaml
type: custom:lcards-text-card
text: "LCARS INTERFACE ACTIVE"
position: { x: 50, y: 20 }
style:
  fontSize: "28px"
  color: "#FF9900"
  fontFamily: "LCARS"
  textAlign: "center"
```

### Dynamic Entity State

```yaml
type: custom:lcards-text-card
text: "Current Temperature: {{sensor.living_room_temperature}}°C"
position: { x: 50, y: 40 }
style:
  fontSize: "20px"
  color: "#00FF00"
```

### Control Button

```yaml
type: custom:lcards-button-card
label: "MAIN LIGHTING"
entity: "light.living_room"
position: { x: 25, y: 60, width: 150, height: 45 }
style:
  fontSize: "16px"
  backgroundColor: "#FF6600"
  borderColor: "#FF6600"
action:
  tap:
    action: "toggle"
  hold:
    action: "more-info"
```

### Information Button

```yaml
type: custom:lcards-button-card
label: "{{sensor.weather.state}} {{sensor.weather.attributes.temperature}}°"
position: { x: 75, y: 60, width: 180, height: 35 }
style:
  fontSize: "14px"
  backgroundColor: "#0099CC"
action:
  tap:
    action: "navigate"
    navigation_path: "/lovelace/weather"
```

## Integration with Lovelace

### Manual Cards

Add directly to your dashboard YAML:

```yaml
views:
  - title: "LCARS Interface"
    cards:
      - type: custom:lcards-text-card
        text: "{{sensor.temperature}}°C"
        # ... configuration

      - type: custom:lcards-button-card
        label: "Control Panel"
        # ... configuration
```

### Picture Elements

Use as elements in picture-elements cards:

```yaml
type: picture-elements
image: "/local/lcars-background.png"
elements:
  - type: custom:lcards-text-card
    text: "BRIDGE STATUS: ACTIVE"
    position: { x: 50, y: 10 }

  - type: custom:lcards-button-card
    label: "RED ALERT"
    position: { x: 80, y: 90 }
    style:
      backgroundColor: "#FF0000"
```

### Grid Layout

```yaml
type: grid
square: false
columns: 2
cards:
  - type: custom:lcards-text-card
    text: "SENSORS"

  - type: custom:lcards-button-card
    label: "CONTROLS"
```

## Technical Details

### Core Systems Integration

The overlay cards integrate with LCARdS Phase 2a core systems:

- **Theme System**: Automatic color and style resolution
- **Animation System**: Built-in animation support
- **Data Source System**: Template processing and entity resolution
- **Validation System**: Configuration validation

### Context Detection

Overlay classes automatically detect their operating context:

- **MSD Mode**: Full SystemsManager access with advanced features
- **Standalone Mode**: Core system access with simplified operations

### Performance

- Overlay instances are cached and reused
- Template processing is optimized for common patterns
- Incremental DOM updates minimize re-rendering
- Font loading and style resolution are cached

## Troubleshooting

### Common Issues

#### Card Not Found
```
Error: Card type 'lcards-text-card' not found
```
**Solution**: Ensure LCARdS is loaded and registered:
```yaml
resources:
  - url: /hacsfiles/lcards/lcards.js
    type: module
```

#### Template Not Processing
```
Text shows: "{{sensor.temperature}}" instead of value
```
**Solutions**:
- Verify entity exists in Home Assistant
- Check entity ID spelling
- Ensure LCARdS core systems are loaded

#### Styling Issues
```
Text appears with wrong font or color
```
**Solutions**:
- Verify LCARS fonts are loaded
- Check CSS color values (#FF9900 format)
- Ensure position values are within bounds (0-100)

#### Actions Not Working
```
Button click has no effect
```
**Solutions**:
- Verify entity exists for toggle actions
- Check action syntax matches HA standards
- Ensure target entity_id is correct

### Debug Mode

Enable debug logging:
```
?lcards_log_level=debug
```

Check browser console for:
- Overlay registration messages
- Template processing logs
- Core system availability
- Action handler events

## Roadmap

### Phase 2c (Future)
- Additional overlay types (gauge, chart, image)
- Enhanced animation presets
- Advanced styling options
- Performance optimizations

### Integration
- Visual editor support
- HACS integration
- Documentation updates
- Example configurations
