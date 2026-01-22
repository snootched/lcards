# Segment Animation Guide

## Overview
This guide addresses common questions about segment animations in LCARdS button cards.

## Issues Addressed

### 1. Scale Animation Reset on Leave

**Problem**: Scale animations remain scaled after hover ends.

**Solution**: Add an `on_leave` trigger with `scale-reset` preset or explicit scale animation.

```yaml
type: custom:lcards-button
component: dpad
dpad:
  segments:
    down:
      entity: light.tv
      animations:
        # Scale up on hover
        - trigger: on_hover
          preset: scale
          scale: 1.1
          duration: 200
        # Reset scale when mouse leaves
        - trigger: on_leave
          preset: scale-reset
          duration: 200
      tap_action:
        action: toggle
```

**Alternative**: Use explicit scale values:
```yaml
- trigger: on_leave
  preset: scale
  scale: 1.0  # Return to original size
  duration: 200
```

---

### 2. Loop Count Parameter

**Problem**: `loop: 3` doesn't work - anime.js v4 supports numeric loop counts.

**Solution**: All presets now support numeric loop values.

**Supported loop values**:
- `loop: true` - Loop infinitely
- `loop: false` - Play once (default for most presets)
- `loop: 3` - Loop exactly 3 times
- `loop: 0` - Same as `false`, play once

**Example - Glow 3 times on entity change**:
```yaml
type: custom:lcards-button
component: dpad
dpad:
  segments:
    down:
      entity: light.tv
      animations:
        - trigger: on_entity_change
          preset: glow
          loop: 3           # Glow exactly 3 times
          duration: 500
          color: '#ff9900'
      tap_action:
        action: toggle
```

**Presets supporting numeric loop**:
- `pulse` - Default: `loop: true`
- `fade` - Default: `loop: false`
- `glow` - Default: `loop: true`
- `scale` - Default: `loop: false`
- `blink` - Default: `loop: true`
- `shimmer` - Default: `loop: true`
- `strobe` - Default: `loop: true`
- `flicker` - Default: `loop: true`

---

### 3. Entity Change Animation Triggering

**Problem**: `on_entity_change` only fires when segment causes the action.

**Clarification**: This is NOT the case - entity changes are monitored globally via Home Assistant's state system.

**How it works**:
1. Card subscribes to HASS state updates in `_onHassChanged()`
2. Monitors ALL entities referenced by segments
3. Triggers `on_entity_change` animation whenever ANY change occurs to tracked entities
4. Works regardless of what caused the state change (your segment, another card, automation, etc.)

**Debugging tips**:
- Check console logs for `[LCARdSButton] Entity states changed`
- Verify entity is correctly specified: `segment.entity` or fallback to `config.entity`
- Ensure animation has correct trigger: `trigger: on_entity_change`

**Example - Flash when light changes (from anywhere)**:
```yaml
type: custom:lcards-button
component: dpad
dpad:
  segments:
    up:
      entity: light.tv  # Monitors this specific entity
      animations:
        - trigger: on_entity_change
          preset: pulse
          loop: 2
          duration: 300
          max_scale: 1.15
      tap_action:
        action: toggle

    down:
      # If no entity specified, uses card-level entity
      animations:
        - trigger: on_entity_change
          preset: glow
          loop: 3
          duration: 500
      tap_action:
        action: toggle

# Card-level entity (fallback for segments without entity)
entity: light.living_room
```

---

## Complete Example

```yaml
type: custom:lcards-button
component: dpad
entity: light.tv  # Card-level entity (fallback)

dpad:
  segments:
    up:
      entity: light.tv
      animations:
        # Quick pulse on hover (infinite)
        - trigger: on_hover
          preset: pulse
          max_scale: 2.1
          min_opacity: 0.8
          duration: 5000
        # Reset when leaving
        - trigger: on_leave
          preset: scale-reset
          duration: 200
      tap_action:
        action: toggle

    down:
      entity: light.tv
      animations:
        # Quick pulse on tap
        - trigger: on_tap
          preset: pulse
          duration: 300
          loop: 1
        # Scale on hover
        - trigger: on_hover
          preset: scale
          scale: 1.1
          duration: 200
        # Reset scale on leave
        - trigger: on_leave
          preset: scale-reset
          duration: 200
        # Glow 3 times when entity changes
        - trigger: on_entity_change
          preset: glow
          loop: 3
          duration: 400
          blur_max: 15
          color: '#ff9900'
      tap_action:
        action: toggle

    center:
      animations:
        # Shimmer on hover
        - trigger: on_hover
          preset: shimmer
          color_to: '#ffffff'
          duration: 1000
          loop: true
        # Fade out on leave
        - trigger: on_leave
          preset: fade
          from: 1
          to: 1
          duration: 200
      tap_action:
        action: call-service
        service: media_player.media_play_pause
```

---

## Animation Parameters Reference

### Common Parameters (all presets)
- `trigger` - When to play: `on_load`, `on_tap`, `on_hold`, `on_hover`, `on_leave`, `on_entity_change`
- `duration` - Animation duration in milliseconds
- `easing` - Easing function (see anime.js docs)
- `loop` - `true` (infinite), `false` (once), or number (e.g., `3`)
- `alternate` - `true` to reverse direction on alternate loops
- `delay` - Delay before starting (ms)

### Preset-Specific Parameters

#### `pulse`
- `max_scale` - Maximum scale (default: 1.2)
- `min_opacity` - Minimum opacity (default: 0.7)

#### `scale`
- `scale` - Target scale factor (default: 1.1)
- `from` - Starting scale (default: 1)

#### `scale-reset`
- No additional parameters, always returns to scale: 1

#### `glow`
- `color` or `glow_color` - Glow color (default: blue)
- `blur_min` - Minimum blur radius (default: 0)
- `blur_max` - Maximum blur radius (default: 10)

#### `fade`
- `from` - Starting opacity (default: 0)
- `to` - Ending opacity (default: 1)

#### `shimmer`
- `color_from` - Starting color (default: current fill)
- `color_to` or `shimmer_color` - Target color
- `opacity_from` - Starting opacity (default: 1)
- `opacity_to` - Ending opacity (default: 0.5)

---

## Tips & Best Practices

1. **Hover + Leave Pattern**: Always pair `on_hover` animations with `on_leave` to reset state
2. **Loop Count**: Use numeric loops for entity changes to avoid infinite animations
3. **Performance**: Avoid too many simultaneous animations (max 2-3 per segment)
4. **Duration**: Keep hover animations fast (200-500ms) for responsive feel
5. **Entity Monitoring**: Card automatically tracks all segment entities - no setup needed

---

## Troubleshooting

### Animation doesn't play
- Check console for warnings about missing elements
- Verify trigger name is correct
- Ensure segment has valid `selector` or uses component preset

### Scale doesn't reset
- Add `on_leave` trigger with `scale-reset` preset

### Loop count ignored
- Ensure using anime.js v4 compatible preset (all built-in presets support it)
- Check console for parameter parsing errors

### Entity change not firing
- Verify entity exists and is accessible in HASS
- Check that entity state is actually changing
- Look for debug logs: `[LCARdSButton] Entity states changed`
