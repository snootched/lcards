# Component Presets Reference

Component presets provide ready-made interactive SVG shapes with pre-configured segments for common control patterns.

## Overview

Component presets eliminate the need to create custom SVG markup by providing battle-tested, theme-aware components. They automatically:

- Load optimized SVG shapes
- Configure segment selectors
- Apply theme-based styling
- Support all segment features (actions, animations, entity tracking)

**Note:** For LCARS-style bar labels (horizontal bars with text), see [Bar Label Presets Reference](./bar-label-presets.md).

## Using Component Presets

### Basic Syntax

```yaml
type: custom:lcards-button
component: <component-name>

<component-name>:
  segments:
    <segment-id>:
      # Segment configuration
```

### Configuration Structure

**Top Level:**
```yaml
type: custom:lcards-button
component: dpad           # Component preset name
entity: <entity_id>       # Optional: default entity for all segments
```

**Component Level:**
```yaml
dpad:                     # Component-specific configuration
  segments:               # Segment overrides/configuration
    <segment-id>:
      entity: <entity_id>    # Segment-specific entity (overrides card entity)
      tap_action: <action>   # Action configuration
      hold_action: <action>
      double_tap_action: <action>
      style: <style-config>  # Segment-specific styling
      animations: <anim-array> # Segment-specific animations
```

---

## Available Components

### dpad

**Interactive 9-segment directional control for remotes, media players, and navigation.**

<img src="/local/lcards/docs/dpad-preview.png" alt="D-Pad preview" width="200" />

#### Segments

The dpad provides 9 interactive segments:

| Segment ID | Description | Default Theme Style |
|------------|-------------|---------------------|
| `up` | Up arrow | Directional (blue-gray) |
| `down` | Down arrow | Directional (blue-gray) |
| `left` | Left arrow | Directional (blue-gray) |
| `right` | Right arrow | Directional (blue-gray) |
| `up-left` | Upper-left corner | Diagonal (lighter blue) |
| `up-right` | Upper-right corner | Diagonal (lighter blue) |
| `down-left` | Lower-left corner | Diagonal (lighter blue) |
| `down-right` | Lower-right corner | Diagonal (lighter blue) |
| `center` | Center button | Center (purple) |

#### Theme Tokens

The dpad component uses these theme tokens (customizable per theme):

**Directional Arrows:**
- `components.dpad.segment.directional.fill` - Fill color
- `components.dpad.segment.directional.stroke` - Stroke color
- `components.dpad.segment.directional.stroke-width` - Stroke width

**Diagonal Corners:**
- `components.dpad.segment.diagonal.fill` - Fill color
- `components.dpad.segment.diagonal.stroke` - Stroke color
- `components.dpad.segment.diagonal.stroke-width` - Stroke width

**Center Button:**
- `components.dpad.segment.center.fill` - Fill color
- `components.dpad.segment.center.stroke` - Stroke color
- `components.dpad.segment.center.stroke-width` - Stroke width

#### Example: Basic Remote Control

```yaml
type: custom:lcards-button
component: dpad
entity: remote.living_room

dpad:
  segments:
    up:
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: UP

    down:
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: DOWN

    left:
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: LEFT

    right:
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: RIGHT

    center:
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: SELECT

    # Optional: use corner buttons
    up-left:
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: HOME

    up-right:
      tap_action:
        action: call-service
        service: remote.send_command
        data:
          command: BACK
```

#### Example: Media Player Control

```yaml
type: custom:lcards-button
component: dpad
entity: media_player.living_room

dpad:
  segments:
    up:
      tap_action:
        action: call-service
        service: media_player.volume_up

    down:
      tap_action:
        action: call-service
        service: media_player.volume_down

    left:
      tap_action:
        action: call-service
        service: media_player.media_previous_track

    right:
      tap_action:
        action: call-service
        service: media_player.media_next_track

    center:
      tap_action:
        action: call-service
        service: media_player.media_play_pause
```

#### Example: Multi-Entity Light Control

Each segment can control a different entity:

```yaml
type: custom:lcards-button
component: dpad

dpad:
  segments:
    up:
      entity: light.bedroom
      tap_action: { action: toggle }
      animations:
        - preset: glow
          trigger: on_entity_change
          color: '#ff9900'
          loop: 2
          duration: 400

    down:
      entity: light.kitchen
      tap_action: { action: toggle }

    left:
      entity: light.living_room
      tap_action: { action: toggle }

    right:
      entity: light.hallway
      tap_action: { action: toggle }

    center:
      entity: light.all_lights
      tap_action:
        action: call-service
        service: light.turn_on
        data:
          brightness_pct: 100
```

#### Example: With Hover Animations

```yaml
type: custom:lcards-button
component: dpad
entity: remote.roku

dpad:
  segments:
    up:
      tap_action:
        action: call-service
        service: remote.send_command
        data: { command: UP }
      animations:
        - preset: pulse
          trigger: on_hover
          max_scale: 1.3
          duration: 1000
        - preset: scale-reset
          trigger: on_leave
          duration: 200

    down:
      tap_action:
        action: call-service
        service: remote.send_command
        data: { command: DOWN }
      animations:
        - preset: scale
          trigger: on_hover
          scale: 1.1
          duration: 200
        - preset: scale-reset
          trigger: on_leave

    center:
      tap_action:
        action: call-service
        service: remote.send_command
        data: { command: SELECT }
      animations:
        - preset: pulse
          trigger: on_tap
          duration: 300
          loop: 1
```

#### Example: Custom Styling

Override theme defaults with custom colors:

```yaml
type: custom:lcards-button
component: dpad

dpad:
  segments:
    up:
      tap_action: { action: more-info }
      style:
        # State-based styling
        default:
          fill: '#336699'
          stroke: '#4488bb'
          stroke-width: 2
        hover:
          fill: '#ff9900'
          stroke: '#ffbb00'
          stroke-width: 3
        pressed:
          fill: '#cc6600'

    center:
      tap_action: { action: toggle }
      style:
        default:
          fill: '#9966cc'
          stroke: '#bb88ee'
          stroke-width: 2
        active:  # When entity is on
          fill: '#ff9900'
          stroke: '#ffbb00'
        inactive:  # When entity is off
          fill: '#6688aa'
          stroke: '#8899bb'
```

---

## Common Patterns

### Pattern: Hover Feedback

Add visual feedback on hover without affecting entity actions:

```yaml
dpad:
  segments:
    up:
      tap_action: { action: toggle }
      animations:
        - preset: scale
          trigger: on_hover
          scale: 1.1
          duration: 200
        - preset: scale-reset
          trigger: on_leave
          duration: 200
```

### Pattern: Entity State Indicators

Use animations to show when entities change state:

```yaml
dpad:
  segments:
    up:
      entity: light.bedroom
      tap_action: { action: toggle }
      animations:
        - preset: glow
          trigger: on_entity_change
          color: '#ff9900'
          loop: 3
          duration: 400
      style:
        active:    # Light on
          fill: '#ff9966'
        inactive:  # Light off
          fill: '#6688aa'
```

### Pattern: Coordinated Actions

All directional arrows share the same action pattern:

```yaml
dpad:
  segments:
    up: &nav-action
      tap_action:
        action: call-service
        service: remote.send_command
        data: { command: UP }

    down:
      <<: *nav-action
      tap_action:
        action: call-service
        service: remote.send_command
        data: { command: DOWN }

    left:
      <<: *nav-action
      tap_action:
        action: call-service
        service: remote.send_command
        data: { command: LEFT }

    right:
      <<: *nav-action
      tap_action:
        action: call-service
        service: remote.send_command
        data: { command: RIGHT }
```

### Pattern: Disabled Segments

Omit segments you don't need - they'll use theme defaults:

```yaml
dpad:
  segments:
    # Only configure the segments you need
    up:
      tap_action: { action: toggle }
    down:
      tap_action: { action: toggle }
    center:
      tap_action: { action: more-info }

    # Corners left unconfigured - still visible but no actions
```

---

## Segment Configuration Reference

All segments support these properties:

### Entity

```yaml
entity: light.bedroom    # Optional: Override card-level entity
```

### Actions

```yaml
tap_action:              # Single tap/click
  action: toggle

hold_action:             # Hold for 500ms
  action: more-info

double_tap_action:       # Double tap/click
  action: call-service
  service: light.turn_on
  data:
    brightness_pct: 100
```

See [Actions Reference](../configuration/actions.md) for all action types.

### Style

State-based styling with auto-detection of format:

**State-First Format:**
```yaml
style:
  default:               # Default state
    fill: '#6688aa'
    stroke: '#8899bb'
    stroke-width: 2
  active:                # Entity is on
    fill: '#ff9966'
  inactive:              # Entity is off
    fill: '#6688aa'
  hover:                 # Mouse over
    stroke: '#ffffff'
    stroke-width: 4
  pressed:               # Mouse down
    fill: '#cc6600'
```

**Property-First Format:**
```yaml
style:
  fill:
    default: '#6688aa'
    active: '#ff9966'
    inactive: '#6688aa'
    hover: '#ff9900'
  stroke:
    default: '#8899bb'
    hover: '#ffffff'
  stroke-width:
    default: 2
    hover: 4
```

**Supported CSS Properties:**
- `fill` - Fill color
- `stroke` - Stroke/border color
- `stroke-width` - Stroke width (number)
- `opacity` - Opacity (0-1)
- `transform` - CSS transform

**Supported States:**
- `default` - Default/fallback state
- `active` - Entity is on/playing/unlocked/etc.
- `inactive` - Entity is off/paused/locked/etc.
- `unavailable` - Entity is unavailable
- `hover` - Mouse is over segment
- `pressed` - Mouse button is down

**State Priority:**
1. `pressed` (interaction state - highest)
2. `hover` (interaction state)
3. `active`/`inactive`/`unavailable` (entity state)
4. `default` (fallback - lowest)

### Animations

Array of animation configurations:

```yaml
animations:
  - preset: pulse               # Animation preset name
    trigger: on_hover          # When to play
    max_scale: 1.3             # Preset-specific params
    duration: 1000             # Duration in ms
    loop: true                 # Loop count (true/false/number)

  - preset: scale-reset
    trigger: on_leave
    duration: 200
```

**Animation Triggers:**
- `on_load` - When card first renders
- `on_tap` - On click/tap
- `on_hold` - On hold (500ms)
- `on_hover` - Mouse enters segment
- `on_leave` - Mouse leaves segment
- `on_entity_change` - Entity state changes

See [Animation Presets Reference](./animation-presets.md) for all presets and parameters.

---

## Theme Customization

Component presets use theme tokens for consistent styling. To customize in your theme:

```yaml
# In your custom theme
components:
  dpad:
    segment:
      directional:
        fill:
          active: '#ff9966'
          inactive: '#6688aa'
          hover: '#ffbb00'
        stroke:
          active: '#ffbb88'
          inactive: '#8899bb'
        stroke-width: 2

      diagonal:
        fill:
          active: '#8899bb'
          inactive: '#556688'
        stroke:
          active: '#aabbcc'
          inactive: '#778899'
        stroke-width: 1.5

      center:
        fill:
          active: '#9966cc'
          inactive: '#664488'
        stroke:
          active: '#bb88ee'
          inactive: '#886699'
        stroke-width: 2
```

---

## Troubleshooting

### Segment not responding to clicks

**Possible causes:**
- Action not configured (segments without actions are non-interactive)
- Check browser console for errors
- Verify entity exists in Home Assistant

**Solution:**
```yaml
dpad:
  segments:
    up:
      tap_action: { action: toggle }  # Must have at least one action
```

### Animations not playing

**Possible causes:**
- Element not found (should be automatic with component presets)
- Animation trigger not firing
- Animation preset not found

**Solution:**
- Check console logs for warnings
- Verify animation trigger name: `on_hover`, `on_tap`, `on_entity_change`, etc.
- See [Segment Animation Guide](../../../SEGMENT_ANIMATION_GUIDE.md)

### Entity state not updating segment colors

**Possible causes:**
- Entity not specified or incorrect
- Style states not configured
- Entity state doesn't map to `active`/`inactive`

**Solution:**
```yaml
dpad:
  segments:
    up:
      entity: light.bedroom  # Ensure entity is specified
      style:
        active:   # Must define states
          fill: '#ff9966'
        inactive:
          fill: '#6688aa'
```

### Hover not working

**Possible causes:**
- On touch device (hover only works on desktop)
- Pointer events disabled
- Element not rendered

**Solution:**
- Test on desktop device with mouse
- Check that animations use correct trigger: `on_hover`
- Inspect element in browser DevTools

---

## See Also

- [Simple Button Quick Reference](../configuration/button-quick-reference.md) - Complete button card documentation
- [Animation Presets Reference](./animation-presets.md) - All animation presets
- [Segment Animation Guide](../../../SEGMENT_ANIMATION_GUIDE.md) - Detailed animation examples
- [Actions Reference](../configuration/actions.md) - All available actions
