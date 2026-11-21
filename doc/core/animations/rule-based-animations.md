---
description: "Rule-based animations: start animations on any number of cards when a Rules Engine rule matches, target them by id, tag, type or pattern, and stop them when it no longer matches."
moved_anchors:
  see-also: /core/animations/rule-based-animations
---

# Rule-based Animations

A rule's `apply.animations` plays animations on any number of cards while the rule matches. Use it instead of a card's own [`on_entity_change`](/core/animations/entity-change-triggers) animations when one condition should animate several cards, or the condition involves several entities. Rules themselves are covered in the [Rules Engine](/core/rules/).

## Basic structure

**Add an `animations` list to a rule's `apply` block; each entry names its targets and a preset.** The animations start when the rule matches and looping ones stop when it no longer does.

- A rule sits in the `rules` list of any LCARdS card, but every card's rules run in one engine for the whole page, so a rule on one card can animate others. Give each rule an `id` no other card uses.
- The animations start when the rule changes from not matching to matching, including when the page loads with the condition already true. They don't start again while it stays matched.

```yaml live controls
type: custom:lcards-button
id: docs-anim-rule-basic-btn
entity: input_boolean.lcards_test_toggle
preset: lozenge
tags:
  - docs-anim-temperature
text:
  name:
    content: Temperature
    show: true
tap_action:
  action: toggle
# while the toggle is on, every card tagged docs-anim-temperature pulses
rules:
  - id: docs-anim-rule-basic
    when:
      entity: input_boolean.lcards_test_toggle
      state: "on"
    apply:
      animations:
        - tag: docs-anim-temperature
          preset: pulse
          loop: true
          duration: 1000
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `apply.animations` | list | - | Animations to play while the rule matches. Each entry has one [target](#targeting) and the [animation keys](#animation-parameters) |

## Targeting

**Each entry names its targets with one of `overlay`, `tag`, `type` or `pattern`.** Tags are the usual way to animate a group: give the cards the same entry in `tags` and target that.

- `overlay` is a card's `id` (or an MSD overlay's, or an astrometrics point's or object's). `tag` matches a card's `tags`. Buttons and elbows also carry their card type, their preset name and, when they have an entity, `entity-based` as tags.
- `type` is the kind of card or overlay: `button`, `elbow`, `slider`, `select-menu`, `chart`, `data-grid` or `astrometrics`, an MSD's `line`, `shape` or `control`, or `astrometrics-point` and `astrometrics-object`. It reaches every one on the page.
- `pattern` is a regular expression matched against the ids.
- Only one is used, in the order `overlay`, `tag`, `type`, `pattern`: an entry with both `overlay` and `tag` targets the overlay only.

```yaml live controls
type: custom:lcards-layout-card
layout:
  height: 120px
  grid-gap: 6px
  grid-template-columns: 1fr 1fr 1fr
  grid-template-rows: 1fr 1fr
cards:
  - type: custom:lcards-button
    preset: lozenge
    entity: input_boolean.lcards_test_toggle
    tap_action:
      action: toggle
    text:
      name:
        content: ALERT
        show: true
    view_layout:
      grid-column: 1 / 4
    rules:
      - id: docs-anim-rule-targets
        when:
          entity: input_boolean.lcards_test_toggle
          state: "on"
        apply:
          animations:
            # one card, by id
            - overlay: docs-anim-deck-sensors
              preset: blink
              loop: true
            # every card with the tag
            - tag: docs-anim-deck-engines
              preset: pulse
              loop: true
  - type: custom:lcards-button
    id: docs-anim-deck-sensors
    preset: filled
    text:
      name:
        content: SENSORS
        show: true
  - type: custom:lcards-button
    preset: filled
    tags:
      - docs-anim-deck-engines
    text:
      name:
        content: WARP
        show: true
  - type: custom:lcards-button
    preset: filled
    tags:
      - docs-anim-deck-engines
    text:
      name:
        content: IMPULSE
        show: true
```

`type` and `pattern` written out:

```yaml alternatives
# every button on the page
- type: button
  preset: pulse
  loop: true

# every card whose id starts with temp_
- pattern: "^temp_"
  preset: shimmer
  loop: true
```

::: details More about targeting
- **Not the same as style selectors:** `apply.overlays` names its groups in the map key (`tag:alert-buttons:`), while an animation entry has a key of its own (`- tag: alert-buttons`).
- **Cards that load later:** when a rule matches before its target has loaded (an MSD's overlays still being built), it keeps looking for about a second and a half, then skips that entry.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `overlay` | string | - | One card or overlay, by `id` |
| `tag` | string | - | Every card and overlay with this tag |
| `type` | string | - | Every card or overlay of this kind |
| `pattern` | string | - | Every card and overlay whose id matches this regular expression |

## Animation parameters

**An entry takes the preset, its `params` and the timing keys of a card's own animations.** `map_range` works here too, in `duration`, `delay` and any `params` value.

- An entry has no `trigger`: the rule matching is what plays it.

```yaml live controls
type: custom:lcards-button
id: docs-anim-rule-params-btn
entity: input_boolean.lcards_test_doors
preset: lozenge
text:
  name:
    content: Doors
    show: true
tap_action:
  action: toggle
rules:
  - id: docs-anim-rule-params
    when:
      entity: input_boolean.lcards_test_doors
      state: "on"
    apply:
      animations:
        - overlay: docs-anim-rule-params-btn
          preset: glow
          loop: true
          duration: 800
          delay: 0
          ease: inOutQuad
          params:
            color: var(--lcars-orange)
            blur_max: 12
            # the glow grows with the shields
            blur_min:
              map_range:
                entity: input_number.lcards_test_shields
                input: [0, 100]
                output: [0, 8]
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `preset` | string | required | What the animation does: see the [Preset Reference](/core/animations/preset-reference) |
| `params` | object | the preset's defaults | The preset's own settings. Each value may be a [`map_range`](/core/animations/timing-and-easing#map-range-descriptors) |
| `duration` | number / object | the preset's | Length of one play, ms, or a `map_range` |
| `delay` | number / object | `0` | Wait before it starts, ms, or a `map_range` |
| `loop` | boolean / number | `false` | `true` repeats until the rule stops matching, a number repeats that many more times |
| `ease` | string | the preset's | An [easing](/core/animations/timing-and-easing#easing-functions) name or a curve with numbers as a string |

## Lifecycle: automatic stop on unmatch

**When the rule stops matching, the looping animations it started stop and the cards go back to how they looked.** Animations that play once run to the end, even if the rule stops matching while they play.

- An entry with `loop` set to `true` or a number counts as looping, and is stopped.
- Nothing needs cleaning up: start and stop both follow the rule.

```yaml live controls
type: custom:lcards-button
id: docs-anim-rule-life-btn
entity: input_boolean.lcards_test_lights
preset: lozenge
text:
  name:
    content: Lights
    show: true
tap_action:
  action: toggle
rules:
  - id: docs-anim-rule-life
    when:
      entity: input_boolean.lcards_test_lights
      state: "on"
    apply:
      animations:
        # strobes until the lights go off
        - overlay: docs-anim-rule-life-btn
          preset: strobe
          loop: true
        # one fade-in when they come on; it finishes even if they go off at once
        - overlay: docs-anim-rule-life-btn
          preset: fade
```

::: details More about stopping
- **Several rules on one card:** when a rule stops matching, only the looping animations it started stop; another rule's loop on the same card keeps running.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `loop` | boolean / number | `false` | Any value but `false` makes the entry stop when the rule stops matching |

## Multi-card coordination example

**One rule for a red alert: recolour a group of cards, pulse them, blink one and shimmer the elbow.** Switch the toggle under the cards on and off.

```yaml live controls
type: custom:lcards-layout-card
layout:
  height: 160px
  grid-gap: 6px
  grid-template-columns: 1fr 1fr 1fr
  grid-template-rows: 1fr 1fr
cards:
  - type: custom:lcards-elbow
    elbow:
      type: header-left
    view_layout:
      grid-column: 1 / 4
    rules:
      - id: docs-anim-rule-red-alert
        when:
          entity: input_boolean.lcards_test_toggle
          state: "on"
        apply:
          overlays:
            tag:docs-anim-action-buttons:
              style:
                card:
                  color:
                    background: var(--lcars-alert-red)
          animations:
            - tag: docs-anim-action-buttons
              preset: pulse
              loop: true
              params:
                max_scale: 1.08
            - overlay: docs-anim-main-alert
              preset: strobe
              loop: true
            - type: elbow
              preset: shimmer
              loop: true
              params:
                color_to: var(--lcars-alert-red)
  - type: custom:lcards-button
    id: docs-anim-main-alert
    preset: filled
    text:
      name:
        content: RED ALERT
        show: true
  - type: custom:lcards-button
    preset: filled
    tags:
      - docs-anim-action-buttons
    text:
      name:
        content: SHIELDS
        show: true
  - type: custom:lcards-button
    preset: filled
    tags:
      - docs-anim-action-buttons
    text:
      name:
        content: PHASERS
        show: true
```

## Combining with style patches

**One `apply` block can restyle cards and animate them at the same time.** Both take effect when the rule matches and end when it no longer does.

- `apply.overlays` changes the style of the cards it names; `apply.animations` animates them. See the [Rules Engine](/core/rules/) for `apply.overlays`.

```yaml live controls
type: custom:lcards-button
id: docs-anim-alert-badge
entity: input_boolean.lcards_test_visible
preset: lozenge
text:
  name:
    content: Warning
    show: true
tap_action:
  action: toggle
rules:
  - id: docs-anim-rule-warning
    when:
      entity: input_boolean.lcards_test_visible
      state: "on"
    apply:
      # yellow and blinking while the switch is on
      overlays:
        docs-anim-alert-badge:
          style:
            card:
              color:
                background: var(--lcars-alert-yellow)
      animations:
        - overlay: docs-anim-alert-badge
          preset: blink
          loop: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `apply.overlays.<id>` | object | - | The card's new `style` while the rule matches: see the [Rules Engine](/core/rules/) |
| `apply.animations` | list | - | Animations played while the rule matches |
