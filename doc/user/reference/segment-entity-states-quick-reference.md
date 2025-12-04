# Segment Entity States - Quick Reference

Quick guide for configuring entity state awareness in segmented SVG buttons.

## State Types

### Entity States (Persistent)
Colors that persist based on entity state:
- `active` - Entity is "on" (lights on, media playing, locked, heating, etc.)
- `inactive` - Entity is "off" (lights off, media paused, unlocked, idle, etc.)
- `unavailable` - Entity is unavailable
- `unknown` - Entity state is unknown
- Custom states - Any state name (e.g., `playing`, `buffering`, `heating`)

### Interaction States (Transient)
Colors that appear during user interaction:
- `hover` - Mouse over segment
- `pressed` - During click (renamed from "active" in v1.20.10)

### Special Keys
- `default` - Fallback for unmapped states

## Priority Order

1. **Interaction state** (hover/pressed) - highest priority
2. **Entity state** (direct match like "playing")
3. **Entity state** (mapped like on→active)
4. **Fallback/default**

## Common Patterns

### Pattern 1: Toggle Control (Light, Switch)
```yaml
segment:
  selector: '#segment-id'  # CSS selector to find SVG element
  entity: light.living_room
  tap_action:
    action: toggle
  style:
    active:      # When on (orange stays visible)
      fill: '#ff9966'
    inactive:    # When off (blue stays visible)
      fill: '#6688aa'
    hover:       # Mouse over (white border added)
      stroke: '#ffffff'
    pressed:     # During click (bright orange flash)
      fill: '#ffcc99'
```

### Pattern 2: Media Control
```yaml
segment:
  selector: '#segment-id'  # CSS selector to find SVG element
  entity: media_player.tv
  tap_action:
    action: call-service
    service: media_player.media_play
  style:
    playing:     # Direct state match (green stays visible)
      fill: '#66cc66'
    paused:      # Direct state match (orange stays visible)
      fill: '#ff9966'
    inactive:    # off/idle (gray stays visible)
      fill: '#444444'
    hover:
      stroke: '#ffffff'
    pressed:
      fill: '#88ee88'
```

### Pattern 3: Stateless Button (Remote)
```yaml
segment:
  selector: '#segment-id'  # CSS selector to find SVG element
  # No entity - only interaction states
  tap_action:
    action: call-service
    service: remote.send_command
    data:
      command: up
  style:
    default:     # Normal state
      fill: '#6688aa'
    hover:       # Mouse over
      fill: '#7799bb'
    pressed:     # During click
      fill: '#88aabb'
```

### Pattern 4: Climate Control
```yaml
segment:
  selector: '#segment-id'  # CSS selector to find SVG element
  entity: climate.living_room
  tap_action:
    action: call-service
    service: climate.set_hvac_mode
    data:
      hvac_mode: heat
  style:
    heating:     # Custom state (red stays visible)
      fill: '#ff6666'
    cooling:     # Custom state (blue stays visible)
      fill: '#6699ff'
    inactive:    # off/idle (gray stays visible)
      fill: '#444444'
    hover:
      stroke: '#ffffff'
    pressed:
      fill: '#ff8888'
```

## State Mapping Reference

### Automatically Mapped to `active`:
- `on`, `playing`, `locked`, `home`, `open`, `cleaning`
- `armed_*` (all arm modes)
- `heating`, `cooling`, `drying`, `fan_only`
- `above_horizon`, `detected`

### Automatically Mapped to `inactive`:
- `off`, `paused`, `idle`, `stopped`, `unlocked`
- `not_home`, `away`, `closed`, `docked`, `returning`
- `disarmed`, `standby`, `below_horizon`, `clear`

### Always Passed Through:
- `unavailable`, `unknown`
- All custom states (e.g., `buffering`, `charging`)

## Common Mistakes

❌ **Using `active` for interaction state**
```yaml
style:
  active:   # Ambiguous - entity state or interaction?
    fill: '#ff0000'
```

✅ **Use `pressed` for interaction, `active` for entity**
```yaml
style:
  active:    # Entity state (persistent)
    fill: '#ff9966'
  pressed:   # Interaction state (transient)
    fill: '#ffcc99'
```

---

❌ **Forgetting hover/pressed overlay**
```yaml
style:
  active:
    fill: '#ff9966'
  inactive:
    fill: '#6688aa'
  # Missing hover/pressed - no interaction feedback
```

✅ **Add interaction states**
```yaml
style:
  active:
    fill: '#ff9966'
  inactive:
    fill: '#6688aa'
  hover:      # Visual feedback on hover
    stroke: '#ffffff'
  pressed:    # Visual feedback on click
    fill: '#ffcc99'
```

---

❌ **Not specifying entity for stateful segments**
```yaml
segment:
  selector: '#segment-id'  # CSS selector to find SVG element
  # Missing entity - won't reflect state
  tap_action:
    action: toggle
    entity: light.living_room
  style:
    active:
      fill: '#ff9966'
```

✅ **Specify entity at segment level**
```yaml
segment:
  selector: '#segment-id'  # CSS selector to find SVG element
  entity: light.living_room  # Required for state awareness
  tap_action:
    action: toggle
  style:
    active:
      fill: '#ff9966'
```

## Tips & Tricks

💡 **Inheritance**: Segment uses `card.entity` if `segment.entity` not specified

💡 **Partial Styles**: Define only the properties you want to change
```yaml
hover:
  stroke: '#ffffff'  # Only change stroke, keep fill from entity state
```

💡 **Multiple Properties**: Combine fills, strokes, opacity, etc.
```yaml
active:
  fill: '#ff9966'
  stroke: '#ffbb88'
  stroke-width: 3
  opacity: 1.0
```

💡 **Default Fallback**: Always provide a `default` key for unknown states
```yaml
style:
  playing: { fill: '#66cc66' }
  paused: { fill: '#ff9966' }
  default: { fill: '#444444' }  # Fallback for other states
```

## Version Support

- **v1.20.07** - Segment actions working
- **v1.20.09** - Target parameter support
- **v1.20.10** - Entity state awareness (current)

## See Also

- [Segment Animation Guide](segment-animation-guide.md)
- [Button Quick Reference](../configuration/button-quick-reference.md)
