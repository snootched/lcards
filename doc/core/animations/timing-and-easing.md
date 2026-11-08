---
description: "Animation timing and easing: duration, delay, loops and alternate, numbers that follow an entity with map_range, anime.js v4 easing curves and springs, and reduced motion."
---

# Timing and Easing

How long an animation takes, how often it repeats, how it speeds up and slows down, and what happens when the device asks for less motion. The other animation keys are on the [Card Animations](/core/animations#animation-options) page.

## Timing

**`duration`, `delay`, `loop` and `alternate` set how long one play takes, when it starts and how many times it repeats.** Leave them out and the preset's own timing applies.

- Each preset has its own defaults: `pulse` takes 1200 ms and loops for ever, `fade` takes 1000 ms and plays once. The [Preset Reference](/core/animations/preset-reference) lists them.
- `loop` counts repeats after the first play: `loop: 1` plays twice. With `alternate: true` every other play runs backwards, so `loop: 1` with `alternate: true` goes there and back once.
- The same keys inside `params` work too; the entry's own key wins when both are set.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: Tap me
    show: true
animations:
  # dims to 30 % and comes back, twice, after a short wait
  - trigger: on_tap
    preset: fade
    duration: 250
    delay: 100
    loop: 3
    alternate: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `duration` | number / object | the preset's | Length of one play, ms, or a [`map_range`](#map-range-descriptors). No upper limit |
| `delay` | number / object | `0` | Wait before the first play, ms, or a `map_range` |
| `loop` | boolean / number | the preset's | `true` repeats for ever, `false` plays once, a number repeats that many more times |
| `alternate` | boolean | the preset's | Play every other repeat backwards |

## `map_range` descriptors

**A number that follows an entity: a spin that speeds up with the wind, a pulse that slows as the battery drains.** Write `map_range` in place of the number, with the entity and the two ranges to map between.

- It maps the entity's value from `input` to `output` in a straight line. With `output: [2000, 400]` a higher value gives a shorter duration, so the animation runs faster.
- It works in `duration`, `delay` and any value in `params`, on a card's own animations and in a rule's `apply.animations`.
- On a looping animation, a `map_range` in `duration` keeps following the entity while the animation runs: the speed changes as the value does. Every other value is read once, when the animation starts.
- `output` can also be two colours, for a colour param: the colour is blended between them, transparency too. Each can be any colour LCARdS accepts (a hex of any length, a named colour, `rgb()` or `hsl()`, a CSS variable, a `theme:` token or a computed colour such as `alpha()`).

```yaml live controls
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
animations:
  # pulses while the light is on, faster the brighter it is
  - trigger: on_entity_change
    entity: light.workbench
    preset: pulse
    loop: true
    while:
      state: "on"
    duration:
      map_range:
        entity: light.workbench
        attribute: brightness_pct
        input: [0, 100]
        output: [2000, 400]
```

::: details More about map_range
- **A value it can't use:** an entity that doesn't exist, a missing attribute or a state that isn't a number (`unavailable`) leaves the value out, so the preset's default applies.
- **The same words elsewhere:** button textures, astrometrics objects and the rules' `map_range_cond` use the same `entity`, `attribute`, `input`, `output` and `clamp`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `map_range.entity` | string | required | The entity to follow |
| `map_range.attribute` | string | the state | An attribute to read instead. `brightness_pct` gives a light's brightness as 0–100 |
| `map_range.input` | list | required | `[min, max]` of the entity's value |
| `map_range.output` | list | required | `[min, max]` of the result: two numbers, or two colours in any form |
| `map_range.clamp` | boolean | `true` | Keep the result inside `output` when the value goes past `input` |

## Easing functions

**`ease` sets how the animation speeds up and slows down: a gentle start, a bounce at the end, a spring.** LCARdS runs anime.js v4, so ease names have no `ease` prefix: `inOutQuad`, `outElastic`, `inOutSine`.

- An anime.js v3 name such as `easeInOutQuad` is not a v4 name: it plays as `linear`. Write `inOutQuad`.
- A curve with numbers is written as a string, as in the [anime.js easing editor](https://animejs.com/easing-editor), whose output you can paste in: `steps(4)`, `cubicBezier(0.4, 0, 0.2, 1)`, `spring({ bounce: 0.4, duration: 500 })`. The animation editor offers these too, with a field for each number.
- The object form takes `type` and `params`; a spring sets its own length, so `duration` has no effect with it.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: Spring
    show: true
animations:
  # springs out and back on each tap
  - trigger: on_tap
    preset: scale
    loop: 1
    alternate: true
    ease:
      type: spring
      params:
        stiffness: 150
        damping: 20
```

Every form `ease` takes, one per line:

```yaml alternatives
ease: inOutQuad                     # a named curve
ease: outElastic                    # elastic bounce at the end
ease: linear                        # constant speed
ease: steps(4)                      # four jumps instead of a smooth curve
ease: cubicBezier(0.4, 0, 0.2, 1)   # a custom curve, as in CSS
ease: spring({ bounce: 0.4, duration: 500 })  # pasted from the anime.js easing editor
ease:                               # spring physics
  type: spring
  params:
    stiffness: 150
    damping: 20
```

| Curve | Names |
|-------|-------|
| Power | `in`, `out`, `inOut`, `outIn` |
| Quad, Cubic, Quart, Quint | `inQuad`, `outQuad`, `inOutQuad`, `outInQuad` (and the same for `Cubic`, `Quart`, `Quint`) |
| Sine, Circ, Expo | `inSine`, `outSine`, `inOutSine`, `outInSine` (and the same for `Circ`, `Expo`) |
| Back | `inBack`, `outBack`, `inOutBack`, `outInBack` |
| Elastic | `inElastic`, `outElastic`, `inOutElastic`, `outInElastic` |
| Bounce | `inBounce`, `outBounce`, `inOutBounce`, `outInBounce` |
| Other | `linear`, `steps(N)`, `cubicBezier(x1, y1, x2, y2)`, `irregular(steps, randomness)`, `spring({ bounce, duration })` |

::: details More about easing
- **Object `params` by `type`:** `in`, `out`, `inOut`, `outIn` take `power` (`1.675`); the `Back` curves `overshoot` (`1.70158`); the `Elastic` curves `amplitude` (`1`) and `period` (`0.3`); `cubicBezier` takes `x1`, `y1`, `x2`, `y2` (`0.25`, `0.1`, `0.25`, `1`); `spring` takes `mass` (`1`), `stiffness` (`100`), `damping` (`10`) and `velocity` (`0`); `steps` takes `steps` (`10`) and `fromStart` (`false`); `irregular` takes `steps` (`10`) and `randomness` (`1`); `custom` takes `customString`, any of the string forms above.
- **`ease_params`:** a string `ease` with `params.ease_params` is read as the object form: `ease: outBack` with `ease_params: { overshoot: 3 }` is a stronger overshoot.
- **`easing`:** the anime.js v3 key is still read when `ease` is missing, but the config checker flags it as unknown. Write `ease`.
- **A bad curve:** a string with numbers that can't be read, or an unknown `type`, plays as `linear`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `ease` | string / object | the preset's | A curve name, a curve with numbers as a string, or `type` with `params` |
| `ease.type` | string | - | Object form: the curve (`spring`, `cubicBezier`, `steps`, `irregular`, `linear`, `custom`, `inBack` ...) |
| `ease.params` | object | that curve's defaults | Object form: the curve's numbers (see above) |
| `params.ease_params` | object | - | Numbers for a string `ease`, as in the object form |

## Reduced motion

**When the device asks for less motion (the Reduce motion accessibility setting, `prefers-reduced-motion: reduce`), LCARdS does not play animations.** An animation that runs once jumps straight to where it would end, so entrance and `on_show` animations still leave the card visible.

- A looping animation (pulse, glow, blink, cascades) does not run, and canvas background and screen effects show a still frame. Turning the setting back off lets the next trigger play.
- Some motion carries meaning: an alert flash that should catch the eye even when everything else stays still. Mark that animation with `essential_motion: true` and it plays anyway. Use it sparingly; people turn the setting on because motion bothers them.
- The animation editor has the same switch (**Essential motion**).

```yaml live controls
type: custom:lcards-button
entity: input_boolean.lcards_test_doors
preset: lozenge
text:
  name:
    content: Front door
    show: true
animations:
  # blinks when the door opens, even with Reduce motion on
  - trigger: on_entity_change
    entity: input_boolean.lcards_test_doors
    to_state: "on"
    preset: blink
    essential_motion: true
    duration: 400
    loop: 6
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `essential_motion` | boolean | `false` | Keep playing when the device asks for reduced motion. Only for motion that carries meaning |
