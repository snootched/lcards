---
description: "MSD card animations and rules: animate parts of the blueprint, animate a whole group of overlays with one entry, and restyle overlays, play animations and tint the blueprint with rules."
---

# Animations and Rules

An MSD can animate in four places, all with the same animation keys as every LCARdS card ([Animations](../../core/animations)), and rules can restyle its overlays while a condition holds.

| Where | Animates | Page |
|-------|----------|------|
| `animations` on a line, shape or control | That overlay | [Line Overlay](./line-overlay), [Shape Overlay](./shape-overlay), [Control Overlay](./control-overlay) |
| `msd.base_svg.animations` | Parts of the blueprint, by id or class | [base_svg.animations](#base-svg-animations) |
| `msd.animations` | A group of overlays, by selector | [msd.animations](#msd-animations) |
| `rules[].apply.animations` | Overlays, while a rule matches | [Rules](#rules) |

None of them play in the MSD Studio's preview while you edit; check the effect on the dashboard.

## base_svg.animations

**Animations on parts of the blueprint itself: a marker that blinks, a deck that glows, a conduit that draws in.** Each one names the element to animate with `target` (or several with `targets`), a CSS selector such as `#br` (an id in the SVG) or `.deck` (a class).

- The selector is looked for inside the blueprint only, never in the overlays.
- Open the SVG in a text editor or the browser's inspector to find its ids; the MSD Studio's animation editor lists them for you on the Base SVG tab.

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 5
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
    # the bridge marker (a circle with id br) blinks
    animations:
      - trigger: on_load
        preset: blink
        target: "#br"
        loop: true
  view_box: [180, 270, 1600, 720]
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `base_svg.animations` | list | - | Animations, each with the [animation keys](../../core/animations#animation-options); `target` or `targets` picks the part of the blueprint |

## msd.animations

**One animation for a whole group of overlays, picked by a CSS selector, instead of the same entry on every overlay.** Use it for a set of shields that draw in together, every line on the card, or all the controls.

- The selector runs over all the overlays at once, so it works the same on shapes, lines and controls. Each overlay carries `data-overlay-id` (its id) and `data-overlay-type` (`line`, `shape` or `control`) to select by.
- On a line or shape, aim at the drawn part inside it by adding `[data-animatable="true"]`, as below. A selector that matches only the overlay's wrapper still fades, moves and scales it, but colour animations (stroke, fill) show nothing there.
- On a control, the selector reaches the frame the card sits in, not the card inside it: fades, movement and glows work, but the card's own parts can't be animated from here.

```yaml live
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 4
msd:
  view_box: [0, 0, 800, 300]
  # every overlay whose id starts with conduit_ draws in, then out again
  animations:
    - trigger: on_load
      preset: draw
      target: '[data-overlay-id^="conduit_"] [data-animatable="true"]'
      duration: 1500
      loop: true
      alternate: true
  overlays:
    - id: conduit_upper
      type: shape
      kind: polyline
      points:
        - [60, 80]
        - [400, 80]
        - [400, 150]
        - [740, 150]
      style:
        color: var(--lcars-orange)
        width: 6
    - id: conduit_lower
      type: shape
      kind: polyline
      points:
        - [60, 220]
        - [400, 220]
        - [400, 150]
      style:
        color: var(--lcars-blue)
        width: 6
```

::: details More about msd.animations
- **The selector, picked for you:** in the MSD Studio, the target picker offers **All Shapes overlays**, **All Lines overlays** and **All Controls overlays**, and an **All "prefix_*" overlays** entry for every two or more overlays whose ids share the text before their first underscore (`shield_fore`, `shield_aft` ... give **All "shield_*" overlays**). They already aim at the drawn part, so prefer them over writing the selector by hand.
- **Why the wrapper isn't enough for colours:** each line or shape is a `<g data-overlay-id="...">` round the element that is actually drawn, and that element sets its own stroke and fill (from `style.color` and `style.fill`). A colour animated on the wrapper is inherited only where nothing closer sets it, so it never shows.
- **Other cards in a control:** for a Home Assistant card that isn't an LCARdS card, the control's frame is all an animation can reach.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `msd.animations` | list | - | Animations, each with the [animation keys](../../core/animations#animation-options); `target` or `targets` is a selector over all the overlays |

## Rules

**Rules change the display while a condition holds: they restyle overlays, play animations on them and tint the blueprint.** The rule sits in the card's `rules` list and works like a rule on any card ([Rules Engine](../../core/rules/)); this section covers what it can do on an MSD.

- Under `apply.overlays`, name an overlay by its `id` and give the style to use. A line or shape takes its `style` keys (`color`, `width`, `opacity`, `dash_array`, `fill`); the [Rules Engine](../../core/rules/) also has selectors for groups (`tag:`, `type:`, `pattern:`, `all`).
- Animations under `apply.animations` start when the rule matches and stop when it no longer does. Name the overlay with `overlay:` (its id), or a group with `tag:`, `type:` or `pattern:`.
- `apply.base_svg` crossfades the blueprint to other [filters](./base-svg-filters), such as a red tint on alert; `filters: []` clears them.
- For an animation with no condition (these all draw in on load), use [msd.animations](#msd-animations) instead.

```yaml live controls
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 5
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
  view_box: [180, 270, 1600, 720]
  overlays:
    - id: reactor-ctl
      type: control
      attachment: top-left
      position: [190, 886]
      size: [340, 96]
      card:
        type: custom:lcards-button
        preset: lozenge
        entity: input_boolean.lcards_test_toggle
        text:
          name:
            content: REACTOR
            show: true
            font_size: 30
    - id: reactor-line
      type: line
      anchor: reactor-ctl
      attach_to: wc
      route: auto
      corner_style: round
      style:
        color: var(--lcards-gray-medium-light)
        width: 4
# while the toggle is on: the line turns red and blinks, and the ship takes a red tint
rules:
  - id: msd-reactor-alert
    when:
      entity: input_boolean.lcards_test_toggle
      state: "on"
    apply:
      overlays:
        reactor-line:
          style:
            color: var(--lcars-alert-red)
      animations:
        - overlay: reactor-line
          preset: blink
          loop: true
      base_svg:
        filters:
          - mode: svg
            type: tint
            value:
              color: alpha(var(--lcars-alert-red), 0.35)
        transition: 500
```

::: details More about rules on an MSD
- **Rule ids are shared:** every card's rules run in one engine, keyed by `id`, so give each rule a name no other card uses.
- **The highest priority wins** when two matching rules both set `base_svg`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `apply.overlays.<id>` | object | - | The overlay's new `style` while the rule matches. Also takes the Rules Engine's group selectors |
| `apply.animations` | list | - | Animations played while the rule matches: `overlay` (an id), `tag`, `type` or `pattern`, with `preset`, `duration`, `loop`, `params` ... |
| `apply.base_svg.filters` | list | - | The blueprint's [filters](./base-svg-filters) while the rule matches. `[]` clears them |
| `apply.base_svg.transition` | number | `1000` | How long the crossfade to the new filters takes, ms |
