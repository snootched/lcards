---
description: "Card animations: presets that pulse, glow, slide and draw a card or parts of it, played on a tap, when a view opens, when an entity changes or from a rule."
moved_anchors:
  basic-structure: /core/animations#quick-start
  triggers: /core/animations/triggers
  entrance-animations-with-on-show: /core/animations/triggers#entrance-animations-with-on-show
  map-range-descriptors: /core/animations/timing-and-easing#map-range-descriptors
  easing-functions: /core/animations/timing-and-easing#easing-functions
  reduced-motion: /core/animations/timing-and-easing#reduced-motion
  animating-svg-elements-that-have-their-own-transform: /core/animations#targets
  comprehensive-example: /core/animations#putting-it-together
  see-also: /core/animations
---

# Card Animations

**Animations make a card move: a pulse when you tap it, a glow while a light is on, a slide-in when a view opens.** Every LCARdS card takes an `animations` list. Each entry names a `preset` (what moves) and a `trigger` (when it plays).

- A card can have as many entries as you like, each with its own trigger. An entry without `trigger` plays when the card loads.
- Each preset has its own duration, easing and looping; set `duration`, `loop` or `ease` on the entry to change them.
- When the device asks for less motion, animations jump to their end or stay still: see [Reduced motion](/core/animations/timing-and-easing#reduced-motion).

::: tip Try it
- The button and elbow editors have an animation editor on the **Effects** tab, with a field for every option on these pages; the data grid and MSD studios have one too.
- Every example here is live: tap the cards.
:::

| Page | Covers |
|------|--------|
| [Triggers](/core/animations/triggers) | Taps, holds, hover, on load, entrances with `on_show`, data source changes |
| [Entity Change Triggers](/core/animations/entity-change-triggers) | Play on a state change, loop while a condition holds, follow an attribute |
| [Timing and Easing](/core/animations/timing-and-easing) | Duration, delay, loops, numbers that follow an entity (`map_range`), easing, reduced motion |
| [Rule-based Animations](/core/animations/rule-based-animations) | Animate many cards at once from a rule |
| [Preset Reference](/core/animations/preset-reference) | Every built-in preset and its `params` |

---

## Quick start

**Two entries to start from: a bounce on every tap, and a pulse that runs while the light is on.** Tap the card to switch the light and watch the pulse start and stop.

- `params` holds the preset's own settings, here how far the pulse grows. The [Preset Reference](/core/animations/preset-reference) lists them for each preset.

```yaml live
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  name:
    show: true
tap_action:
  action: toggle
animations:
  # a quick bounce on every tap
  - trigger: on_tap
    preset: bounce
    duration: 400
    params:
      scale_max: 1.08
      bounces: 2
  # a pulse while the light is on
  - trigger: on_entity_change
    entity: light.workbench
    preset: pulse
    loop: true
    while:
      state: "on"
    params:
      max_scale: 1.05
```

## Available presets

**`preset` picks what the animation does.** Each name links to its parameters and defaults in the [Preset Reference](/core/animations/preset-reference).

| Category | Presets |
|----------|---------|
| Motion | [`bounce`](/core/animations/preset-reference#bounce), [`blink`](/core/animations/preset-reference#blink), [`fade`](/core/animations/preset-reference#fade), [`glow`](/core/animations/preset-reference#glow), [`pulse`](/core/animations/preset-reference#pulse), [`rotate`](/core/animations/preset-reference#rotate), [`scale`](/core/animations/preset-reference#scale), [`scale-reset`](/core/animations/preset-reference#scale-reset), [`shake`](/core/animations/preset-reference#shake), [`skew`](/core/animations/preset-reference#skew), [`slide`](/core/animations/preset-reference#slide), [`strobe`](/core/animations/preset-reference#strobe) |
| Colour | [`cascade-color`](/core/animations/preset-reference#cascade-color), [`color-shift`](/core/animations/preset-reference#color-shift), [`shimmer`](/core/animations/preset-reference#shimmer) |
| Text | [`text-glitch`](/core/animations/preset-reference#text-glitch), [`text-reveal`](/core/animations/preset-reference#text-reveal), [`text-decode`](/core/animations/preset-reference#text-decode), [`text-scramble`](/core/animations/preset-reference#text-scramble), [`text-typewriter`](/core/animations/preset-reference#text-typewriter) |
| Visual effects | [`cascade`](/core/animations/preset-reference#cascade), [`flicker`](/core/animations/preset-reference#flicker), [`glitch`](/core/animations/preset-reference#glitch), [`ripple`](/core/animations/preset-reference#ripple) |
| SVG | [`draw`](/core/animations/preset-reference#draw), [`march`](/core/animations/preset-reference#march), [`morph`](/core/animations/preset-reference#morph) |
| Stagger | [`stagger-grid`](/core/animations/preset-reference#stagger-grid), [`stagger-wave`](/core/animations/preset-reference#stagger-wave), [`stagger-radial`](/core/animations/preset-reference#stagger-radial), [`stagger-flash`](/core/animations/preset-reference#stagger-flash), [`tap-ripple`](/core/animations/preset-reference#tap-ripple) |
| Effects | [`boot-sequence`](/core/animations/preset-reference#boot-sequence), [`sensor-sweep`](/core/animations/preset-reference#sensor-sweep) |
| Timeline | [`timeline-cascade`](/core/animations/preset-reference#timeline-cascade), [`timeline-attention`](/core/animations/preset-reference#timeline-attention), [`sequence`](/core/animations/preset-reference#sequence) |
| Advanced | [`chaos`](/core/animations/preset-reference#chaos), [`physics-spring`](/core/animations/preset-reference#physics-spring) |
| Utility | [`motionpath`](/core/animations/preset-reference#motionpath), [`set`](/core/animations/preset-reference#set), [`custom`](/core/animations/preset-reference#custom) |

## Targets

**Without a target an animation moves the whole card; `target` or `targets` picks parts of it, such as one text field.** Use it to scramble just the label, or blink just the state.

- The selector is a CSS selector looked for inside the card. Text fields carry `data-field-id` with their name, so `[data-field-id='name']` is the name text.
- `target` animates every element the selector matches; `targets` takes a list of selectors and animates the first match of each.
- `target: background` animates the card's [background animations](/core/effects/background-animations/binding-and-animation#animating-the-background) instead of its elements; `effect` picks one of them.

```yaml live
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  name:
    show: true
  state:
    show: true
    content: "{entity.state}"
    position: center
tap_action:
  action: toggle
animations:
  # only the state text blinks when you tap
  - trigger: on_tap
    preset: blink
    target: "[data-field-id='state']"
    loop: 3
    duration: 200
```

::: details More about targets
- **A selector that matches nothing:** the animation still plays, on the whole card, with a warning in the browser console.
- **SVG elements with their own transform:** an element with its own `transform` (common in SVGs exported from Inkscape, such as MSD base images) keeps it, so it stays exactly where it was drawn. A `scale`, `rotate` or `pulse` animation on a rotated or scaled group then turns about a point slightly off the group's centre. Colour, opacity, stroke and draw animations are not affected.
- **MSD overlays:** on an MSD, a line or shape picks its drawn part by itself; see [MSD Animations and Rules](/cards/msd/animations).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `target` | string | the whole card | CSS selector for the elements to animate, or `background` for the card's background animations |
| `targets` | string / list | - | One or more CSS selectors; the first element each one matches is animated |
| `effect` | number | every effect | With `target: background`: the index of the `background_animation` entry to animate (`0` is the first, the bottom layer) |

## Putting it together

**One button with an entrance, tap feedback, a hover glow and two entity animations.** Hover over it with a mouse, tap it, and watch the light switch on and off.

```yaml live
type: custom:lcards-button
entity: light.workbench
preset: lozenge
text:
  label:
    show: true
    content: Workbench
    position: top-left
  state:
    show: true
    content: "{entity.state}"
    position: center
tap_action:
  action: toggle
animations:
  # entrance: fades in once when the card loads
  - trigger: on_load
    preset: fade
    duration: 800
    params:
      from: 0
      to: 1
  # tap feedback: a quick bounce
  - trigger: on_tap
    preset: bounce
    duration: 400
    params:
      scale_max: 1.08
      bounces: 2
  # hover: glows while the mouse is over the card
  - trigger: on_hover
    preset: glow
    params:
      color: var(--lcars-orange)
      blur_max: 12
  # pulses while the light is on
  - trigger: on_entity_change
    entity: light.workbench
    preset: pulse
    loop: true
    while:
      state: "on"
    params:
      max_scale: 1.05
  # dims and comes back once when the light turns off
  - trigger: on_entity_change
    entity: light.workbench
    to_state: "off"
    preset: fade
    duration: 300
    loop: 1
    alternate: true
    params:
      from: 1
      to: 0.7
```

## Animation options

**Every key an animation entry takes, on every LCARdS card.** The same entries go in an MSD's `animations` lists; a rule's `apply.animations` takes a smaller set ([Rule-based Animations](/core/animations/rule-based-animations#animation-parameters)).

- `duration`, `delay`, `loop`, `alternate` and `ease` can also sit inside `params`; the entry's own key wins when both are set.

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: Options
    show: true
animations:
  - id: tap-glow
    trigger: on_tap
    preset: glow
    duration: 600
    delay: 100
    loop: 2
    alternate: true
    ease: inOutSine
    params:
      color: var(--lcars-yellow)
```

::: details More about animation options
- **Unrecognised keys warn, they don't block.** A key the animation or its `params` doesn't know (a leftover from switching `preset`, say) gives a console warning but never stops the card loading. Only a wrong type on a key it does know (`duration: fast`) is an error. Clear leftovers anyway: some presets read `params` differently depending on what else is there.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `preset` | string | required | What the animation does: see [Available presets](#available-presets) |
| `trigger` | string | `on_load` | When it plays: see [Triggers](/core/animations/triggers) |
| `params` | object | the preset's defaults | The preset's own settings: see the [Preset Reference](/core/animations/preset-reference). Each value may be a [`map_range`](/core/animations/timing-and-easing#map-range-descriptors) |
| `id` | string | - | A name for the entry, for debugging: letters, digits, `-` and `_` |
| `enabled` | boolean | `true` | `false` keeps the entry but never plays it |
| `duration` | number / object | the preset's | Length of one play, ms, or a `map_range`: see [Timing](/core/animations/timing-and-easing#timing) |
| `delay` | number / object | `0` | Wait before it starts, ms, or a `map_range` |
| `loop` | boolean / number | the preset's | `true` repeats for ever, `false` plays once, a number repeats that many more times |
| `alternate` | boolean | the preset's | Play every other repeat backwards |
| `ease` | string / object | the preset's | The easing curve: see [Easing](/core/animations/timing-and-easing#easing-functions) |
| `essential_motion` | boolean | `false` | Keep playing when the device asks for reduced motion: see [Reduced motion](/core/animations/timing-and-easing#reduced-motion) |
| `target` | string | the whole card | What to animate: see [Targets](#targets) |
| `targets` | string / list | - | Several things to animate: see [Targets](#targets) |
| `effect` | number | every effect | With `target: background`: which background animation |
| `entity` | string | - | `on_entity_change`: the entity to watch: see [Entity Change Triggers](/core/animations/entity-change-triggers#watching-an-entity) |
| `attribute` | string | the state | `on_entity_change`: an attribute to watch instead of the state; `brightness_pct` gives a light's brightness as 0–100 |
| `from_state` | string | - | `on_entity_change`: play only when the value changes from this |
| `to_state` | string | - | `on_entity_change`: play only when the value changes to this |
| `while` | object | - | `on_entity_change`: play while this holds and stop when it no longer does: see [while](/core/animations/entity-change-triggers#lifecycle-conditions-while) |
| `check_on_load` | boolean | `true` | `on_entity_change`: also check the entity when the card loads |
| `datasource` | string | - | `on_datasource_change`: the data source to watch: see [on_datasource_change](/core/animations/triggers#on-datasource-change) |
