# Button Card

`custom:lcards-button`

The Button card covers everything from simple labels and toggle buttons to complex interactive components like D-pads and multi-segment SVG controls. Elbows use the same base so every feature here is also available in the [Elbow card](../elbow/README.md).

---

## Modes

The card operates in one of three modes, selected by which top-level key is present:

| Mode | Key | Use for |
|------|-----|---------|
| **Preset** | `preset` | Standard LCARS buttons — lozenge, bullet, capped, etc. |
| **Component** | `component` | Interactive multi-segment controls (D-pad, alert shape) |
| **Custom SVG** | `svg` | Your own SVG with interactive segments |

---

## Top-Level Options

| Option | Type | Description |
|--------|------|-------------|
| `type` | string | `custom:lcards-button` (required) |
| `entity` | string | Entity to monitor and control |
| `id` | string | Custom card ID for rule targeting |
| `tags` | list | Tags for rule targeting (e.g. `[nav, lights]`) |
| `preset` | string | Button shape preset (preset mode) |
| `component` | string | Component type: `dpad` or `alert` (component mode) |
| `svg` | object | Custom SVG config (svg mode) |
| `text` | object | Text field definitions — see [Text Fields](../../core/text-fields.md) |
| `icon` | string | MDI icon (e.g. `mdi:lightbulb`) |
| `icon_area` | string | Icon position: `left`, `right`, `top`, `bottom`, `none` |
| `icon_area_size` | number | Icon area width/height in px (default: 60) |
| `icon_style` | object | Advanced icon styling — see below |
| `divider` | object | Divider between icon area and content area — see below |
| `style` | object | Visual styles — see below |
| `tap_action` | object | Tap action — see [Actions](../../core/actions.md) |
| `hold_action` | object | Hold action |
| `double_tap_action` | object | Double-tap action |
| `animations` | list | Card animations — see [Animations](../../core/animations.md) |
| `background_animation` | list / object | Canvas background animations — see [Background Animations](../../core/effects/background-animations.md) |
| `shape_texture` | object | SVG texture inside the button fill — see below |
| `filters` | list | CSS / SVG filters — see below |
| `data_sources` | object | DataSource definitions — see [DataSources](../../core/datasources/README.md) |
| `sounds` | object | Per-card sound overrides — see [Sound Effects](../../core/sounds.md) |
| `grid_options` | object | HA grid layout (`columns`, `rows`) |

---

## `style` Object

### `style.card`

| Field | Type | Description |
|-------|------|-------------|
| `color.background` | string / object | Card background — [state map](../../core/colours.md) supported |

### `style.border`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `color` | string / object | theme | Border colour — [state map](../../core/colours.md) supported |
| `width` | number | `0` | Border width in px |
| `radius` | number / object | theme | Corner radius in px, or `{ top_left, top_right, bottom_left, bottom_right }` |
| `style` | string | `solid` | CSS border-style (`solid`, `dashed`, `dotted`) |

### `style.text.default` and `style.text.<field>`

Shorthand for setting text styles inside the style block (equivalent to top-level `text.default.*`):

| Field | Type | Description |
|-------|------|-------------|
| `color` | string / object | Text colour — [state map](../../core/colours.md) supported |
| `font_size` | number / string | Font size in px or CSS value |
| `font_weight` | string / number | CSS font-weight |
| `font_family` | string | CSS font-family |

See [Text Fields](../../core/text-fields.md) for the full per-field options table.

```yaml
style:
  card:
    color:
      background:
        default: "var(--ha-card-background)"
        active: "alpha(var(--lcards-orange), 0.08)"
  border:
    color:
      default: "var(--lcards-inactive)"
      active: "var(--lcards-orange)"
    width: 2
    radius: 12          # or per-corner: { top_left: 20, top_right: 4, bottom_left: 4, bottom_right: 20 }
  text:
    default:
      color: "var(--lcards-moonlight)"
      font_size: 13
```

---

## `icon_style` Object

Fine-grained control over the icon appearance and placement within its area.

| Field | Type | Description |
|-------|------|-------------|
| `color` | string / object | Icon colour — [state map](../../core/colours.md) supported |
| `size` | number | Icon size in px |
| `area_size` | number | Width/height of the icon area in px |
| `position` | string | Icon position within its area |
| `x` | number | Absolute X offset in px (overrides `position`) |
| `y` | number | Absolute Y offset in px (overrides `position`) |
| `x_percent` | number | X as percentage of icon area width |
| `y_percent` | number | Y as percentage of icon area height |
| `rotation` | number | Icon rotation in degrees |
| `padding` | number / object | Padding in px (number = all sides, or `{ top, right, bottom, left }`) |
| `spacing` | number | Space between icon and text area (px) |

```yaml
icon: mdi:thermometer
icon_area: left
icon_style:
  color:
    default: "var(--lcards-inactive)"
    active: "var(--lcards-orange)"
  size: 32
  padding: 8
```

---

## `divider` Object

Thin line between the icon area and the content area.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `color` | string / object | theme | Divider colour — [state map](../../core/colours.md) supported |
| `width` | number | theme | Divider thickness in px |

```yaml
divider:
  color: "var(--lcards-orange)"
  width: 2
```

---

## `filters` List

CSS and SVG filters applied to the card.

| Field | Type | Description |
|-------|------|-------------|
| `mode` | string | `css` (default) or `svg` |
| `type` | string | CSS type (`blur`, `brightness`, `contrast`, `saturate`, `drop-shadow`) or SVG primitive |
| `value` | string / number / object | Filter parameters |

```yaml
filters:
  - type: blur
    value: 4

  - type: brightness
    value: 0.8

  - type: saturate
    value: 0.5
```

---

## Text Fields

Multiple text labels can be placed anywhere on the card. See [Text Fields](../../core/text-fields.md) for the full reference.

```yaml
text:
  default:
    font_family: "Antonio, sans-serif"
    color: "var(--lcards-moonlight)"
  name:
    content: "Temperature"
    position: top-left
    font_size: 11
  value:
    content: "{entity.state}°C"
    position: center
    font_size: 28
    font_weight: bold
    color:
      default: "var(--lcards-moonlight)"
      unavailable: "var(--lcards-alert-red)"
```

---

## Preset Mode

### Available Presets

Common presets: `lozenge`, `bullet`, `capped`, `outline`, `pill`, `text`. Additional presets depend on installed packs — browse them in the card editor.

---

## Component Mode: D-pad

D-pad segments: `center`, `up`, `down`, `left`, `right`, `up-left`, `up-right`, `down-left`, `down-right`

The `default` key under `segments` applies shared config to all segments.

| Field | Type | Description |
|-------|------|-------------|
| `entity` | string | Entity for this segment (state-based colours, icons) |
| `tap_action` | object | Action on tap — see [Actions](../../core/actions.md) |
| `hold_action` | object | Action on hold |
| `double_tap_action` | object | Action on double-tap |
| `style.fill` | string / object | Segment fill colour — [state map](../../core/colours.md) supported |
| `style.stroke` | string / object | Segment stroke colour |
| `style.stroke_width` | number | Stroke width in px |
| `text` | object | Per-segment text labels |
| `icon` | string | MDI icon for this segment |
| `animations` | list | Segment-specific animations |

```yaml
type: custom:lcards-button
component: dpad
dpad:
  segments:
    default:
      style:
        fill:
          default: "var(--lcards-inactive)"
          active: "var(--lcards-orange)"
    center:
      entity: media_player.tv
      tap_action:
        action: call-service
        service: media_player.media_play_pause
        target:
          entity_id: media_player.tv
    up:
      tap_action:
        action: call-service
        service: media_player.volume_up
        target:
          entity_id: media_player.tv
    down:
      tap_action:
        action: call-service
        service: media_player.volume_down
        target:
          entity_id: media_player.tv
```

---

## Component Mode: Alert

The alert component displays a Starfleet alert symbol with animated bar elements.

```yaml
type: custom:lcards-button
component: alert
preset: default          # default, red, yellow, blue, green, grey, black

# State-driven preset switching
entity: sensor.threat_level
ranges:
  - preset: red
    above: 80
  - preset: yellow
    above: 50
  - preset: default
    above: 0
```

---

## Custom SVG Mode

```yaml
type: custom:lcards-button
svg:
  content: |
    <svg viewBox="0 0 200 100">
      <rect id="btn-a" x="10" y="10" width="80" height="80" fill="var(--lcards-orange)" rx="8"/>
      <rect id="btn-b" x="110" y="10" width="80" height="80" fill="var(--lcards-blue)" rx="8"/>
    </svg>
  segments:
    default:
      style:
        fill:
          active: "var(--lcards-orange-medium)"
    btn-a:
      entity: light.zone_a
      tap_action:
        action: toggle
    btn-b:
      entity: light.zone_b
      tap_action:
        action: toggle
```

SVG elements with `id` attributes become interactive segments.

> **Note**: When using CSS custom properties in SVG `fill` attributes, browser support can vary. Using `currentColor` in the SVG with CSS `color` styling via JavaScript is a reliable cross-browser alternative. The example above works in modern browsers and the HA web app.

---

## Shape Texture

`shape_texture` renders an SVG-native texture or animation **inside** the button shape fill — clipped to the shape boundary. Available in **preset mode only**. Elbow cards also support this feature.

```yaml
shape_texture:
  preset: fluid
  opacity: 0.4            # 0–1, or state-based map
  mix_blend_mode: screen
  speed: 1.0              # 0 = static
  config: {}
```

### Available Presets

| Preset | Description | Key Config |
|--------|-------------|-----------|
| `grid` | Scrolling orthogonal grid lines | `line_spacing`, `pattern` (both/horizontal/vertical) |
| `diagonal` | Scrolling diagonal hatching | `line_spacing` |
| `hexagonal` | Scrolling hexagonal grid | `hex_radius` |
| `dots` | Scrolling dot grid | `dot_radius`, `spacing` |
| `fluid` | Organic swirling fractalNoise | `base_frequency`, `num_octaves` |
| `plasma` | Dual-colour turbulence wash | `color_a`, `color_b`, `base_frequency` |
| `shimmer` | Directional light-sweep | `angle`, `highlight_width`, `speed` |
| `flow` | Directional streaming currents | `wave_scale`, `scroll_speed_x` |
| `level` | Fill bar with optional wave | `fill_pct`, `direction`, `wave_height` |
| `pulse` | Breathing radial glow | `radius`, `min_size`, `speed` |
| `scanlines` | CRT-style scan-line overlay | `line_spacing`, `direction` |

All `color` fields accept `var(--lcards-*)`, `{theme:...}`, `rgba()`, hex, or a state-based map.

For full parameter reference see [Shape Texture System](../../architecture/subsystems/shape-texture-system.md).

---

## Background Animations

See [Background Animations](../../core/effects/background-animations.md) for full docs.

```yaml
background_animation:
  - preset: grid
    config:
      line_spacing: 40
      color: "alpha(var(--lcards-orange), 0.3)"
```

---

## Annotated Example

A lozenge button with entity binding, state-based colours, templates, an animation, and actions:

```yaml
type: custom:lcards-button
entity: light.workbench
preset: lozenge

text:
  default:
    font_family: "Antonio, sans-serif"
  label:
    content: Workbench
    position: top-left
    font_size: 11
    text_transform: uppercase
    color: "var(--lcards-moonlight)"
  value:
    content: "[[[return entity.state === 'on' ? Math.round(entity.attributes.brightness / 255 * 100) + '%' : 'Off']]]"
    position: center
    font_size: 26
    font_weight: bold
    color:
      default: "var(--lcards-moonlight)"
      inactive: "var(--lcards-inactive)"

icon: mdi:desk-lamp
icon_area: left
icon_style:
  color:
    default: "var(--lcards-inactive)"
    active: "var(--lcards-orange)"
  size: 28

style:
  border:
    color:
      default: "var(--lcards-inactive)"
      active: "var(--lcards-orange)"
    width: 2

tap_action:
  action: toggle

hold_action:
  action: more-info

animations:
  - trigger: on_tap
    preset: bounce
    params:
      scale_max: 1.05
      bounces: 2
    duration: 400

  - trigger: on_entity_change
    entity: light.workbench
    to_state: "on"
    check_on_load: true
    preset: glow
    params:
      color: "var(--lcards-orange)"
      blur_max: 12
    loop: true
```

---

## Related

- [Text Fields](../../core/text-fields.md)
- [Colours](../../core/colours.md)
- [Actions](../../core/actions.md)
- [Templates](../../core/templates/README.md)
- [Themes](../../core/themes/README.md)
- [Rules Engine](../../core/rules/README.md)
- [Animations](../../core/animations.md)
- [Background Animations](../../core/effects/background-animations.md)
- [Shape Texture System](../../architecture/subsystems/shape-texture-system.md)
- [Elbow card](../elbow/README.md)
