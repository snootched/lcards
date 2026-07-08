# Animation Preset Reference

All built-in animation presets, their parameters, and defaults. Pass preset-specific parameters via the `params` block in your animation config.

---

## Motion Presets

### `pulse`

Scale and brightness breathing effect.

| Param | Default | Description |
|-------|---------|-------------|
| `max_scale` | `1.15` | Peak scale factor (alias: `scale`) |
| `max_brightness` | `1.4` | Peak brightness (1.0 = normal) |
| `duration` | `1200` | ms per cycle |
| `ease` | `inOutSine` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `glow`

Animated drop-shadow bloom.

| Param | Default | Description |
|-------|---------|-------------|
| `color` | `var(--lcars-blue)` | Glow colour (alias: `glow_color`) |
| `blur_min` | `0` | Minimum shadow blur (px) |
| `blur_max` | `10` | Maximum shadow blur (px) |
| `duration` | `1500` | ms per cycle |
| `ease` | `inOutSine` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `shake`

Horizontal vibrate effect.

| Param | Default | Description |
|-------|---------|-------------|
| `intensity` | `10` | Max displacement in px |
| `duration` | `500` | Total duration (ms) |
| `frequency` | `4` | Number of side-to-side shakes |
| `ease` | `inOutSine` | Easing function |
| `loop` | `false` | Loop continuously |

### `bounce`

Elastic scale bounce.

| Param | Default | Description |
|-------|---------|-------------|
| `scale_max` | `1.2` | Peak scale factor |
| `duration` | `800` | Duration (ms) |
| `bounces` | `3` | Number of bounces |
| `ease` | `outElastic` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

> **`ease`/`duration` are only used as documented when `bounces` is `1` or less.** With the default `bounces: 3`, the code force-overrides `ease` to `easeOutQuad` and multiplies `duration` by `bounces` (2400ms by default) — your own `ease`/`duration` values are silently discarded in that case. Set `bounces: 1` if you need your own easing/duration to actually take effect.

### `rotate`

Rotation animation.

| Param | Default | Description |
|-------|---------|-------------|
| `from` | `0` | Starting angle (degrees) |
| `to` | `360` | Ending angle (degrees) |
| `direction` | — | Shorthand: `clockwise` (0→360) or `counterclockwise` (0→−360) |
| `duration` | `1000` | Duration (ms) |
| `ease` | `linear` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

### `blink`

Slow opacity blink.

| Param | Default | Description |
|-------|---------|-------------|
| `max_opacity` | `1.0` | Peak opacity |
| `min_opacity` | `0.3` | Trough opacity |
| `duration` | `1200` | ms per half-cycle |
| `ease` | `linear` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `strobe`

Rapid opacity flicker.

| Param | Default | Description |
|-------|---------|-------------|
| `max_opacity` | `1.0` | Peak opacity |
| `min_opacity` | `0` | Trough opacity |
| `duration` | `100` | ms per half-cycle |
| `ease` | `linear` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `skew`

Skew/slant transformation.

| Param | Default | Description |
|-------|---------|-------------|
| `skewX` | `0` | Target horizontal skew (degrees) |
| `skewY` | `0` | Target vertical skew (degrees) |
| `from_skewX` | `0` | Starting horizontal skew |
| `from_skewY` | `0` | Starting vertical skew |
| `duration` | `600` | Duration (ms) |
| `ease` | `inOutQuad` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

---

### `fade`

Simple opacity transition.

| Param | Default | Description |
|-------|---------|-------------|
| `from` | `1` | Starting opacity |
| `to` | `0.3` | Target opacity |
| `duration` | `1000` | Duration (ms) |
| `ease` | `linear` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

### `slide`

Slide in from a direction.

| Param | Default | Description |
|-------|---------|-------------|
| `from` | `right` | Entry side: `left`, `right`, `top`, `bottom` (alias: `direction`) — prefer these four |
| `distance` | `100` | Distance in px (or `%` string) |
| `duration` | `600` | Duration (ms) |
| `ease` | `easeOutQuad` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

> A legacy `up`/`down` pair is also accepted, but confusingly maps the *opposite* way you'd expect versus `top`/`bottom` (`up` behaves like `bottom`, `down` behaves like `top`) — use `left`/`right`/`top`/`bottom` instead to avoid the mix-up.

### `scale`

Simple scale transform animation. Ideal for button feedback.

| Param | Default | Description |
|-------|---------|-------------|
| `scale` | `1.1` | Target scale factor |
| `from` | `1` | Starting scale |
| `duration` | `200` | Duration (ms) |
| `ease` | `outQuad` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

### `scale-reset`

Returns an element to its original scale (1.0). Pair with `on_leave` to reset hover effects.

| Param | Default | Description |
|-------|---------|-------------|
| `duration` | `200` | Duration (ms) |
| `ease` | `outQuad` | Easing function |

```yaml
# Typical hover + reset pair
animations:
  - preset: scale
    trigger: on_hover
    params:
      scale: 1.1
  - preset: scale-reset
    trigger: on_leave
```

---

## Text Animation Presets

Target individual text elements with `target: "[data-field-id='my-field']"` to restrict the animation to a specific text field.

### `text-reveal`

Characters, words, or lines appear in sequence with a stagger effect.

| Param | Default | Description |
|-------|---------|-------------|
| `split` | `chars` | Split unit: `chars`, `words`, or `lines` |
| `direction` | `first` | Stagger origin: `first`, `last`, `center`, `random`, or a numeric index |
| `stagger` | `50` | Delay between units (ms) |
| `duration` | `800` | Duration per unit (ms) |
| `ease` | `easeOutQuad` | Easing function |
| `from_opacity` | `0` | Starting opacity of each unit |
| `from_y` | `20` | Starting Y offset (px) |
| `loop` | `false` | Loop continuously |

### `text-scramble`

Matrix-style character scramble before settling on the real text.

| Param | Default | Description |
|-------|---------|-------------|
| `duration` | `800` | ms each character spends scrambling |
| `stagger` | `40` | Delay between characters starting (ms) |
| `delay` | `0` | Initial delay before animation starts (ms) |
| `settle_at` | `0.85` | Fraction (0–1) of `duration` spent scrambling |
| `characters` | `A-Z 0-9 !@#$%^&*` | Pool of random characters to cycle through |
| `loop` | `false` | Loop continuously |

### `text-glitch`

Rapid position and opacity jitter for a glitch/malfunction effect.

| Param | Default | Description |
|-------|---------|-------------|
| `intensity` | `5` | Max displacement in px / SVG units |
| `duration` | `300` | ms per glitch cycle |
| `stagger` | `50` | Delay between characters (ms) |
| `color_shift` | `false` | Also jitters colour — HTML text targets only, silently ignored on SVG text |
| `loop` | `false` | Loop continuously |

### `text-typewriter`

Characters appear one at a time at a fixed speed.

| Param | Default | Description |
|-------|---------|-------------|
| `speed` | `100` | ms per character |
| `loop` | `false` | Loop continuously |

---

## Visual Effect Presets

### `shimmer`

Fill colour and opacity animation for shimmering effects.

| Param | Default | Description |
|-------|---------|-------------|
| `color_from` | — | Starting colour. If either `color_from` or `color_to` is omitted, colour animation is skipped entirely — opacity still animates |
| `color_to` | — | Target colour (alias: `shimmer_color`) — see `color_from` |
| `opacity_from` | `1` | Starting opacity |
| `opacity_to` | `0.5` | Ending opacity |
| `duration` | `1500` | Duration (ms) |
| `ease` | `inOutSine` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `flicker`

Randomised opacity animation for flickering effects.

| Param | Default | Description |
|-------|---------|-------------|
| `max_opacity` | `1` | Maximum opacity |
| `min_opacity` | `0.3` | Minimum opacity |
| `duration` | `1000` | Duration (ms) |
| `ease` | `linear` | Easing function |
| `loop` | `true` | Loop continuously |

### `cascade`

Staggered animation across multiple target elements.

| Param | Default | Description |
|-------|---------|-------------|
| `stagger` | `100` | Delay between elements (ms) |
| `property` | `opacity` | CSS property to animate |
| `from` | `0` | Starting value |
| `to` | `1` | Ending value |
| `duration` | `1000` | Duration (ms) |
| `ease` | `outExpo` | Easing function |
| `loop` | `false` | Loop continuously |

### `ripple`

Expanding scale with opacity fade.

| Param | Default | Description |
|-------|---------|-------------|
| `scale_max` | `1.5` | Maximum scale |
| `opacity_min` | `0` | Minimum opacity at peak |
| `duration` | `1000` | Duration (ms) |
| `ease` | `outExpo` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

### `glitch`

Random position and colour shifts for a malfunction effect.

| Param | Default | Description |
|-------|---------|-------------|
| `intensity` | `5` | Max pixel displacement |
| `frequency` | `10` | Number of glitch steps |
| `duration` | `1000` | Duration (ms) |
| `loop` | `false` | Loop continuously |

> `ease` is hardcoded to `linear` and `alternate` has no effect — both are ignored if set.

### `scan-line`

Moving highlight gradient across the element.

| Param | Default | Description |
|-------|---------|-------------|
| `direction` | `horizontal` | `horizontal` or anything else (conventionally `vertical`) — only the literal value `horizontal` is special-cased in code, so any other value behaves as vertical |
| `color` | `rgba(255,255,255,0.3)` | Scan line colour |
| `duration` | `2000` | Duration (ms) |
| `ease` | `linear` | Easing function |
| `loop` | `true` | Loop continuously |

---

## Color Animation Presets

### `color-shift`

Animates a colour property from one value to another.

| Param | Default | Description |
|-------|---------|-------------|
| `color_from` | — | Starting colour (required) |
| `color_to` | — | Target colour (required) |
| `property` | `color` | CSS property: `color`, `fill`, `stroke`, `background-color`, etc. |
| `duration` | `1000` | Duration (ms) |
| `ease` | `inOutQuad` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

### `border-pulse`

Animate border colour and/or width. At least one pair (`color_from`/`color_to` or `width_from`/`width_to`) must be specified.

| Param | Default | Description |
|-------|---------|-------------|
| `color_from` | — | Starting border colour |
| `color_to` | — | Ending border colour |
| `width_from` | — | Starting border width |
| `width_to` | — | Ending border width |
| `duration` | `1000` | Duration (ms) |
| `ease` | `inOutSine` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `cascade-color`

LCARS-style colour cascade through three keyframe colours. Uses theme tokens for default colours.

| Param | Default | Description |
|-------|---------|-------------|
| `colors` | theme cascade colours | Array of 3 colours: `[start, mid, end]` — only the first 3 entries are used |
| `property` | `color` | CSS property to animate |
| `mode` | auto-computed | `css` or `animejs`. Auto-computed from `interactive`/`stagger_from`/`axis` when unset — set it explicitly and it will **not** be re-computed even if you also set those, which can look inconsistent with the auto behavior. If in doubt, leave unset. |
| `duration` | `5000` | ms per full cycle |
| `ease` | `linear` | Easing function |
| `loop` | `true` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |
| `delay` | `0` | Start delay before the whole cascade begins (ms) — unlike the stagger-* presets, this is the canonical single start-offset, not a per-element step |
| `stagger_delay` | `100` | Delay between elements — only applies in `animejs` mode |
| `stagger_from` | — | Stagger origin: `first`, `last`, `center`, or `random` |
| `axis` | `row` | Stagger axis: `row` or `column` |
| `interactive` | `false` | Pause on hover, resume on leave — only wired up in `animejs` mode |

---

## SVG-Specific Presets

### `draw`

SVG path drawing animation using `strokeDashoffset`. Apply to `<path>` elements.

| Param | Default | Description |
|-------|---------|-------------|
| `reverse` | `false` | Draw in reverse direction |
| `duration` | `2000` | Duration (ms) |
| `ease` | `easeInOutSine` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

### `march`

CSS-based marching dashed line animation. More performant than JS for continuous use.

| Param | Default | Description |
|-------|---------|-------------|
| `dash_length` | `10` | Length of each dash (auto-detected from the element's existing `stroke-dasharray` if present) |
| `gap_length` | `5` | Gap between dashes (auto-detected from the element's existing `stroke-dasharray` if present) |
| `speed` | `2` | Seconds per cycle. If `speed` is unset but `duration` (ms) is set, `duration` is converted to seconds instead — `speed` wins if both are given |
| `direction` | `forward` | `forward` or `reverse` |
| `loop` | `true` | `true` = infinite marching (the default), `false`/`0` = play once, a number = that many iterations |

---

## Stagger Presets

Animate multiple target elements at once with anime.js's `stagger()` helper — each target starts a fixed step later than the previous one. Requires multiple elements matched by `target`/`targets` (a single-element animation just plays with no visible stagger).

> Naming note: `stagger-grid` here is unrelated to the deprecated [`grid-stagger`](#grid-stagger) in Advanced Presets — different fields, different defaults. Prefer `stagger-grid` (this one actually staggers correctly).

### `stagger-grid`

Stagger across a `[cols, rows]` grid of targets, with a configurable wave origin.

| Param | Default | Description |
|-------|---------|-------------|
| `grid` | `[1, 1]` | Grid dimensions `[cols, rows]` — validated; warns and no-ops on the wrong shape |
| `from` | `start` | Wave origin: `start`, `end`, `center`, `edges`, or an `[x, y]` position |
| `delay` | `100` | Per-element stagger step (ms) — not the canonical single start-offset |
| `property` | `scale` | CSS property to animate |
| `from_value` | `0.8` | Starting value |
| `to_value` | `1` | Ending value |
| `duration` | `600` | Duration per element (ms) |
| `ease` | `outQuad` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

```yaml
- preset: stagger-grid
  trigger: on_load
  targets: "[id^='cell-']"
  params:
    grid: [6, 2]
    from: center
    delay: 50
```

### `stagger-wave`

A wave ripples through a linear sequence of targets.

| Param | Default | Description |
|-------|---------|-------------|
| `delay` | `100` | Per-element stagger step (ms) — not the canonical single start-offset |
| `direction` | `normal` | `normal` or `reverse` — any other value collapses to `normal` |
| `property` | `translateY` | CSS property to animate |
| `amplitude` | `-20` | Peak displacement, used in a 3-point `[0, amplitude, 0]` path |
| `duration` | `800` | Duration per element (ms) |
| `ease` | `easeOutElastic` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |

```yaml
- preset: stagger-wave
  trigger: on_load
  targets: ".list-item"
  params:
    delay: 80
    amplitude: -30
```

### `stagger-radial`

Stagger radiating outward from a point.

| Param | Default | Description |
|-------|---------|-------------|
| `from` | `center` | `center`, or an `[x, y]` pixel position |
| `delay` | `50` | Per-element stagger step (ms) — not the canonical single start-offset |
| `property` | `scale` | CSS property to animate |
| `from_value` | `0` | Starting value |
| `to_value` | `1` | Ending value |
| `duration` | `800` | Duration per element (ms) |
| `ease` | `easeOutExpo` | Easing function |
| `loop` | `false` | Loop continuously |

> `alternate` isn't read by this preset — setting it has no effect.

```yaml
- preset: stagger-radial
  trigger: on_load
  targets: ".dot"
  params:
    from: center
    delay: 40
    property: opacity
```

### `stagger-flash`

A lead/trail colour sweep across targets, driven by the Web Animations API directly rather than anime.js — used for a fast, cheap "scanning highlight" effect.

| Param | Default | Description |
|-------|---------|-------------|
| `lead_color` | `var(--primary-color)` | Colour of the sweep's leading edge |
| `trail_color` | `#444444` | Colour left behind after the sweep passes |
| `lead_pct` | `20` | Width of the lead band, as a percent of the total sweep (clamped to 1–50) |
| `duration` | `2000` | Total sweep duration (ms) |
| `delay` | `duration / 12` | Per-element stagger step (ms) — not the canonical single start-offset |
| `grid` | — | `[cols, rows]` — only forwarded into an otherwise-inert internal config, not meaningfully used |
| `from` | `first` | `first`, `last`, or `center` |
| `property` | `stroke` | Must be a WAAPI-animatable CSS property |
| `with_opacity` | `true` | Also fade opacity as part of the sweep |
| `trail_opacity` | `0.25` | Opacity left behind after the sweep passes (only if `with_opacity`) |
| `loop` | `true` | Maps to the WAAPI `iterations` option (`Infinity` vs `1`) — not the generic anime.js loop mechanism |

---

## Timeline Presets

Multi-phase animations built with anime.js's `createTimeline()`. Unlike most presets, the canonical top-level `duration`/`ease`/`alternate`/`delay` fields aren't used — timing/easing lives per-phase instead (only `loop` is honored generically).

### `timeline-cascade`

A generic multi-step timeline you fully define yourself.

| Param | Default | Description |
|-------|---------|-------------|
| `steps` | — | Required, at least 1. Array of step objects, each with: `targets` (CSS selector, falls back to the animated element if absent), `params` (arbitrary anime.js tween properties, e.g. `scale`/`opacity`), `duration`, and `offset` (`'+=N'` relative, `'<'` overlap-with-previous, or an absolute ms number) |
| `loop` | `false` | Loop the full timeline |

```yaml
- preset: timeline-cascade
  trigger: on_load
  params:
    steps:
      - params: { opacity: [0, 1] }
        duration: 400
      - params: { scale: [1, 1.1] }
        duration: 300
        offset: "<"
```

### `timeline-attention`

A fixed 3-phase "look at me" sequence: scale up, shake, settle back.

| Param | Default | Description |
|-------|---------|-------------|
| `scale_max` | `1.15` | Peak scale during phase 1 |
| `shake_intensity` | `5` | Peak horizontal displacement during phase 2 (px) |
| `duration_scale` | `200` | Duration of phase 1 — scale up (ms) |
| `duration_shake` | `300` | Duration of phase 2 — shake (ms) |
| `duration_settle` | `400` | Duration of phase 3 — settle back (ms) |
| `loop` | `false` | Loop the full sequence |

---

## Utility Presets

### `set`

Immediately sets properties without animation. Useful for establishing initial state before other animations run.

| Param | Default | Description |
|-------|---------|-------------|
| `properties` | — | Object with CSS properties to set immediately |

> `duration`/`ease`/`loop`/`alternate`/`delay` are all ignored — `duration` is hardcoded to `0` since this preset applies its properties immediately rather than tweening.

```yaml
animations:
  - preset: set
    trigger: on_load
    params:
      properties:
        opacity: 0.5
        fill: red
```

### `motionpath`

Animates an element along an SVG path's route, using anime.js v4's `createMotionPath()`. Works in two modes:

- **Move an existing element** — set `target`/`targets` to the element you want to travel, and `params.path` to a *different* element defining the route (e.g. a line's id). `target`/`targets` and `params.path` must be two different elements — pointing `path` at the same element being animated has no sane interpretation and is rejected with a console warning.
- **Self-contained tracer** — set `params.shape` and skip `target`/`targets` entirely. motionpath creates and animates its own shape (a small dot/rect/diamond) traveling along `params.path` — useful for a "energy flowing along a line" effect without needing a separate control or element. If `shape` and an explicit `target`/`targets` are both set, `shape` wins (with a console warning).

| Param | Default | Description |
|-------|---------|-------------|
| `path` | — | Required. CSS selector (`#id` or `.class`) for the route element. Can be any real SVG geometry element (`path`/`circle`/`rect`/`ellipse`/`line`/`polyline`/`polygon`) — if the selector resolves to a wrapper group instead (e.g. an MSD line overlay's own `<g id="...">`), the actual drawable geometry inside it is found automatically. |
| `duration` | `4000` | Duration (ms) for one full pass along the path |
| `ease` | `linear` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `false` | Reverse on each loop |
| `rotate` | `true` | Auto-rotate the element/shape to face its direction of travel as it moves. A sibling of `shape` below (applies either way this preset is used) — not a field inside `shape`. |
| `anchor` | `'50% 50%'` | CSS `transform-origin` — the pivot point rotation happens around. A sibling of `shape`, not a field inside it. |
| `shape` | — | Opt-in self-contained tracer shape, see below. |

**`shape` object** (only used in tracer mode):

| Field | Default | Description |
|-------|---------|-------------|
| `type` | `circle` | `circle`, `rect`, or `diamond` |
| `size` | `10` | Diameter (circle/diamond) or width/height fallback (rect), in px |
| `width` | `size` | `rect` only — overrides `size` for width |
| `height` | `size` | `rect` only — overrides `size` for height |
| `fill` | `currentColor` | Fill colour — theme tokens/CSS vars work like everywhere else |
| `stroke` | `none` | Stroke colour |
| `stroke_width` | `0` | Stroke width (px) |

Field names deliberately mirror line markers' (`marker_start`/`marker_end`) styling options.

```yaml
# Move an existing control along a line named "line_2"
- trigger: on_load
  preset: motionpath
  target: "#my-control-id"
  duration: 3000
  loop: true
  alternate: true
  params:
    path: "#line_2"

# Self-contained tracer — no separate target needed. Can be declared directly
# on the line's own `animations:` block, with `path` pointing at itself — that's
# the expected, common case in this mode (there's nothing to move but the tracer).
- trigger: on_load
  preset: motionpath
  duration: 3000
  loop: true
  alternate: true
  params:
    path: "#line_2"
    rotate: true
    shape:
      type: circle
      size: 10
      fill: "var(--lcards-orange)"
```

---

## Advanced Presets

### `sequence`

Timeline-based animation with multiple steps at specified offsets. Uses `anime.js` `createTimeline()` internally.

| Param | Default | Description |
|-------|---------|-------------|
| `steps` | — | Array of step objects (required, at least 1) — each has the same fields as a normal anime.js animate call plus an optional `offset` (an absolute ms number, `'+=N'` relative, or `'<'` for overlap-with-previous) |
| `duration` | `2000` | Default duration per step (used when a step doesn't set its own) |
| `ease` | `outQuad` | Default easing per step (used when a step doesn't set its own) |
| `loop` | `false` | Loop the full sequence |

```yaml
- preset: sequence
  trigger: on_tap
  params:
    steps:
      - opacity: [0, 1]
        duration: 500
      - scale: [1, 1.2]
        duration: 300
        offset: 500
```

> Use `offset`, not `at` — `at` is not read anywhere and silently has no effect on step positioning.

### `grid-stagger`

::: warning Deprecated — does not actually stagger
`grid-stagger` never staggers multiple elements correctly — a confirmed, unfixed bug in how it builds its per-element delay internally. Every element ends up with identical (non-staggered) timing regardless of config. It's kept registered only for backward compatibility with existing configs and has been removed from the editor's preset picker. For a working staggered-grid effect, use [`stagger-grid`](#stagger-grid) instead — a similarly-named but different, functioning preset.
:::

Staggered animation across grid elements, with waves emanating from a chosen origin.

| Param | Default | Description |
|-------|---------|-------------|
| `grid` | `[10, 10]` | Grid dimensions `[cols, rows]` |
| `from` | `center` | Wave origin: `center`, `first`, `last`, `random`, or `[x, y]` |
| `property` | `scale` | CSS property to animate |
| `from_value` | `1` | Starting value |
| `to_value` | `1.5` | Ending value |
| `stagger_duration` | `50` | Delay between elements (ms) |
| `wave_duration` | `1000` | Duration per element animation (ms) |
| `ease` | `inOutQuad` | Easing function |
| `loop` | `false` | Loop continuously |
| `alternate` | `true` | Reverse on each loop |

### `chaos`

Randomised multi-property animation for glitch and malfunction effects.

| Param | Default | Description |
|-------|---------|-------------|
| `properties` | `['x', 'y', 'rotate']` | Properties to randomise (`x`/`y` map to `translateX`/`translateY`) |
| `range` | `{x: [-50,50], y: [-50,50], rotate: [-15,15]}` | Min/max `[min, max]` per property — keys should match `properties` |
| `duration_min` | `200` | Minimum animation duration (ms) |
| `duration_max` | `800` | Maximum animation duration (ms) |
| `composition` | `blend` | `blend` or `replace` |
| `ease` | `inOutQuad` | Easing function |
| `loop` | `true` | Loop continuously |

> The canonical top-level `duration` field isn't used at all here — `duration_min`/`duration_max` replace it entirely.

### `physics-spring`

Spring-physics animation using anime.js v4 spring easing. Produces natural, organic motion.

| Param | Default | Description |
|-------|---------|-------------|
| `property` | `scale` | CSS property to animate |
| `from` | — | Starting value (required — typically a number, but a colour string is also valid for colour-like properties) |
| `to` | — | Target value (required, see `from`) |
| `stiffness` | `100` | Spring stiffness (higher = snappier) |
| `damping` | `10` | Spring damping (higher = less bounce) |
| `mass` | `1` | Spring mass (higher = slower) |
| `velocity` | `0` | Initial velocity |
| `loop` | `false` | Loop continuously — this one canonical field genuinely is respected |

> The canonical `ease`/`duration`/`alternate` fields are entirely bypassed here — spring dynamics determine the effective duration/motion internally.

---

## See Also

- [Animations overview](../animations.md) — structure, triggers, options, easing reference
- [Entity Change Triggers](entity-change-triggers.md) — `on_entity_change` deep-dive
- [Rule-based Animations](rule-based-animations.md) — triggering presets via the Rules Engine

