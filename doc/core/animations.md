# Card Animations

LCARdS cards support anime.js-powered animations triggered by user interactions or entity state changes. Each card can have multiple animations with different triggers.

::: info anime.js v4
LCARdS uses **anime.js v4**, which has a different API from v3. Key differences users should know:
- The `ease` property uses v4 naming convention: `inOutQuad`, `outElastic`, `inOutSine` (no `ease` prefix). v3-style names like `easeInOutQuad` are passed through as-is and may work, but v4 names are preferred.
- The `easing` property from v3 is not supported — always use `ease`.
- Spring physics: `{ type: 'spring', params: { stiffness: 150, damping: 20 } }` syntax is the same.
:::

---

## Available Presets

See the **[Preset Reference](animations/preset-reference.md)** for full parameter tables and examples for all built-in presets.

| Category | Presets |
|----------|---------|
| Motion | [`bounce`](animations/preset-reference.md#bounce), [`blink`](animations/preset-reference.md#blink), [`fade`](animations/preset-reference.md#fade), [`glow`](animations/preset-reference.md#glow), [`pulse`](animations/preset-reference.md#pulse), [`rotate`](animations/preset-reference.md#rotate), [`scale`](animations/preset-reference.md#scale), [`scale-reset`](animations/preset-reference.md#scale-reset), [`shake`](animations/preset-reference.md#shake), [`slide`](animations/preset-reference.md#slide), [`strobe`](animations/preset-reference.md#strobe) |
| Text | [`text-glitch`](animations/preset-reference.md#text-glitch), [`text-reveal`](animations/preset-reference.md#text-reveal), [`text-scramble`](animations/preset-reference.md#text-scramble), [`text-typewriter`](animations/preset-reference.md#text-typewriter) |
| Visual Effects | [`cascade`](animations/preset-reference.md#cascade), [`flicker`](animations/preset-reference.md#flicker), [`ripple`](animations/preset-reference.md#ripple), [`shimmer`](animations/preset-reference.md#shimmer) |
| SVG | [`draw`](animations/preset-reference.md#draw), [`march`](animations/preset-reference.md#march) |
| Utility | [`motionpath`](animations/preset-reference.md#motionpath), [`set`](animations/preset-reference.md#set) |

---

## Basic Structure

Animations are defined in a card's `animations` array:

```yaml
animations:
  - id: tap-pulse           # Optional identifier
    trigger: on_tap
    preset: pulse
  - trigger: on_entity_change
    preset: glow
    entity: binary_sensor.motion
    to_state: "on"
    params:
      color: "{theme:colors.alert.red}"
```

---

## Triggers

| Trigger | When it fires |
|---------|--------------|
| `on_tap` | Card is tapped or clicked |
| `on_hold` | Long-press on the card |
| `on_hover` | Mouse enters the card |
| `on_leave` | Mouse leaves the card |
| `on_load` | Card is rendered on page load |
| `on_entity_change` | A watched entity changes state |

---

## Animation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `trigger` | string | — | When to run (required) |
| `preset` | string | — | Animation preset name (required) |
| `id` | string | — | Optional identifier — alphanumeric, hyphens, and underscores only |
| `enabled` | boolean | `true` | Set to `false` to disable without removing |
| `duration` | number | preset default | Duration in ms (0–10 000). Accepts a `map_range` descriptor. |
| `delay` | number | `0` | Delay before starting (ms). Accepts a `map_range` descriptor. |
| `loop` | boolean / number | preset default | `true` = infinite loop, `false` = once, number = iteration count |
| `alternate` | boolean | preset default | Reverse direction on each loop |
| `ease` | string / object | preset default | Easing function — see below |
| `params` | object | — | Preset-specific parameters. Each value may be a `map_range` descriptor. |
| `target` | string | — | CSS selector or `data-field-id` to restrict which element animates |
| `entity` | string | card entity | Entity to watch (for `on_entity_change`) |
| `attribute` | string | — | Attribute to read instead of entity state. Applies to `from_state`, `to_state`, and `while`. Use `brightness_pct` for a 0–100 light brightness percentage. |
| `from_state` | string | — | **Fire-and-forget gate:** only trigger when transitioning FROM this value |
| `to_state` | string | — | **Fire-and-forget gate:** only trigger when transitioning TO this value |
| `while` | object | — | **Lifecycle condition** (`loop: true` required): plays while true, stops when false — see [Entity Change Triggers](animations/entity-change-triggers.md) |
| `check_on_load` | boolean | `true` | Evaluate condition on card load. Starts a looping animation immediately if the `while` condition is already met, or fires once if already in `to_state`. Set to `false` to react only to state transitions after load. |

> **`to_state` / `from_state` vs `while`:** `to_state` and `from_state` are fire-and-forget gates — they control when an animation *starts* but will not stop a looping animation. Use `while` to auto-stop a loop when the condition clears.

---

## `map_range` descriptors

Parameters that accept a number (`duration`, `delay`, any `params` field) can instead be a `map_range` descriptor that maps a live entity value linearly into the parameter range:

```yaml
- trigger: on_entity_change
  entity: sensor.wind_speed
  preset: rotate
  loop: true
  params:
    speed:
      map_range:
        entity: sensor.wind_speed
        input: [0, 50]           # entity value range
        output: [2000, 200]      # animation duration — faster when windier
        clamp: true
```

`map_range` works in both inline `config.animations` and rule-based `apply.animations`.

| Field | Required | Description |
|---|---|---|
| `entity` | ✅ | HA entity to read |
| `attribute` | — | Attribute instead of state (supports `brightness_pct`) |
| `input` | ✅ | `[min, max]` input range |
| `output` | ✅ | `[min, max]` numeric, or `['#hex', '#hex']` for colour interpolation |
| `clamp` | — | Clamp input to range (default `true`) |

---

## Easing Functions

LCARdS uses **anime.js v4** easing names (without the `ease` prefix used in v3):

```yaml
ease: "inOutQuad"       # Standard in-out (v4) — was easeInOutQuad in v3
ease: "outElastic"      # Elastic bounce out
ease: "inOutSine"       # Smooth sine curve
ease: "linear"          # Constant speed
ease:                    # Spring physics
  type: spring
  params:
    stiffness: 150
    damping: 20
```

**Common easing names (v4):**

| Category | Names |
|----------|-------|
| Quad | `inQuad`, `outQuad`, `inOutQuad` |
| Cubic | `inCubic`, `outCubic`, `inOutCubic` |
| Sine | `inSine`, `outSine`, `inOutSine` |
| Expo | `inExpo`, `outExpo`, `inOutExpo` |
| Elastic | `inElastic`, `outElastic`, `inOutElastic` |
| Back | `inBack`, `outBack`, `inOutBack` |
| Bounce | `inBounce`, `outBounce`, `inOutBounce` |
| Other | `linear`, `steps(N)` |

---

## Comprehensive Example

A button showing: load animation, tap feedback, hover glow, entity change with state filter, and a text scramble targeted to a specific field.

```yaml
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  label:
    content: Workbench
    position: top-left
  state:
    content: "{entity.state}"
    position: center

animations:
  # Entrance animation — runs once on load
  - trigger: on_load
    preset: fade
    params:
      from: 0
      to: 1
    duration: 800

  # Tap feedback — quick bounce
  - trigger: on_tap
    preset: bounce
    params:
      scale_max: 1.08
      bounces: 2
    duration: 400

  # Hover glow — looping while mouse is over
  - trigger: on_hover
    preset: glow
    params:
      color: "var(--lcars-orange)"
      blur_max: 12

  # Entity turns on — pulse while on
  - trigger: on_entity_change
    entity: light.workbench
    preset: pulse
    loop: true
    while:
      state: 'on'
    check_on_load: true
    params:
      max_scale: 1.05

  # Entity turns off — brief fade-down
  - trigger: on_entity_change
    entity: light.workbench
    to_state: "off"
    preset: fade
    params:
      from: 1
      to: 0.7
    duration: 300
    loop: 1
    alternate: true
```

---

## See Also

- [Preset Reference](animations/preset-reference.md) — all built-in presets: motion, text effects, visual effects, SVG, utility
- [Entity Change Triggers](animations/entity-change-triggers.md) — `on_entity_change` deep-dive: `while` lifecycle, gates, `attribute`, `check_on_load`
- [Rule-based Animations](animations/rule-based-animations.md) — trigger animations across multiple cards via the Rules Engine
- [Rules Engine](rules/) — conditions and multi-card coordination
- [Animation Architecture](../architecture/animations/) — developer reference: component diagram, trigger type comparison
