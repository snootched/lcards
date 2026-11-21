---
description: "What a rule changes (apply): naming cards with id and tags, selectors by id, tag, type and pattern, config patches and templates in them, animations, and MSD blueprint filters."
---

# Targets and Changes

**A rule's `apply` block says what changes while the rule matches: patches for the cards it targets, animations to play, and filters on an MSD's blueprint.** The condition that drives it is on the [Conditions](./conditions) page.

## Targets

**A rule finds cards by their `id`, by a tag in their `tags`, or by their type.** Give a card an `id` to target that one card, and the same tag to several cards to target them together.

- `id` and `tags` are [card-level options](/cards/common#id-and-tags) every LCARdS card takes. A card without an `id` gets a generated one, so only a card with an `id` can be named.
- On an MSD, lines, shapes and controls take `id` and `tags` too. A control's card takes the control's `id` and `tags`, so a rule names the control to change the card inside it.
- Astrometrics points and objects are targets in the same way: see [Astrometrics rules](/cards/astrometrics/data#rules).

```yaml live controls
type: custom:lcards-layout-card
layout:
  height: 150px
  grid-gap: 6px
  grid-template-columns: 1fr 1fr
  grid-template-rows: 1fr 1fr
cards:
  - type: custom:lcards-button
    preset: lozenge
    entity: input_boolean.lcards_test_toggle
    tap_action:
      action: toggle
    text:
      name:
        content: TOGGLE
        show: true
    view_layout:
      grid-column: 1 / 3
    rules:
      - id: docs-rules-targets
        when:
          entity: input_boolean.lcards_test_toggle
          state: "on"
        apply:
          overlays:
            # one card, by its id
            docs-rules-target-bridge:
              style:
                card:
                  color:
                    background: var(--lcars-alert-yellow)
            # every card with this tag
            tag:docs-rules-engineering:
              style:
                card:
                  color:
                    background: var(--lcars-alert-red)
  - type: custom:lcards-button
    id: docs-rules-target-bridge
    preset: filled
    text:
      name:
        content: BRIDGE
        show: true
  - type: custom:lcards-button
    preset: filled
    tags:
      - docs-rules-engineering
    text:
      name:
        content: ENGINEERING
        show: true
```

::: details More about targets
- **Automatic tags:** a button or elbow also carries its type (`button`, `elbow`), its preset's name and, when it has an entity, `entity-based`; a select menu carries `select-menu` and a slider `slider`. MSD lines, shapes and controls carry `msd-overlay` and their type.
- **Types:** `type:` matches `button`, `elbow`, `slider`, `select-menu`, `chart`, `data-grid` and `astrometrics` cards, and the MSD overlay types `line`, `shape` and `control`.
- **The whole page:** rules see every card on the page, not only the cards in one section or view, so pick ids and tags no other card uses by accident.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `id` (on a card) | string | generated | The card's name, for `apply.overlays.<id>` and `overlay:` |
| `tags` (on a card) | list | - | Group names, for `tag:<name>` selectors, such as `[nav, lights]` |

## apply.overlays

**`apply.overlays` maps selectors to patches: each key picks cards, and its value is config merged over theirs while the rule matches.** A patch can change any of the card's options, not only `style`: here the third card's name changes too.

- A selector is a card's `id`, or `tag:<name>`, `type:<type>`, `pattern:<regex>` or `all`. `exclude` leaves cards out of every selector in the rule.
- The card's own config comes back when the rule stops matching.
- On an MSD, a line or shape takes its own `style` keys (`color`, `width`, `opacity` ...): see [Rules on an MSD](/cards/msd/animations#rules).

```yaml live controls
type: custom:lcards-layout-card
layout:
  height: 150px
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
        content: TOGGLE
        show: true
    view_layout:
      grid-column: 1 / 4
    rules:
      - id: docs-rules-selectors
        when:
          entity: input_boolean.lcards_test_toggle
          state: "on"
        apply:
          overlays:
            # every card whose id starts with docs-sel-, but not docs-sel-2
            "pattern:^docs-sel-":
              style:
                card:
                  color:
                    background: var(--lcars-alert-red)
            exclude: [docs-sel-2]
            # a patch can change any option: here the name
            docs-sel-3:
              text:
                name:
                  content: ALERT
  - type: custom:lcards-button
    id: docs-sel-1
    preset: filled
    text:
      name:
        content: ONE
        show: true
  - type: custom:lcards-button
    id: docs-sel-2
    preset: filled
    text:
      name:
        content: TWO
        show: true
  - type: custom:lcards-button
    id: docs-sel-3
    preset: filled
    text:
      name:
        content: THREE
        show: true
```

::: details More about apply.overlays
- **Several selectors on one card:** their patches merge in the order written. Under `style`, a later selector's keys replace the earlier one's at the first level (a later `style.card` replaces an earlier `style.card` whole); other keys are replaced whole.
- **Several rules on one card:** their patches merge deeply, the highest `priority` on top: see [Priority and Debugging](./priority#priority).
- **Quoting:** quote a `pattern:` selector whose regex holds YAML characters (`"pattern:^temp_.*$"`).
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `apply.overlays.<id>` | object | - | The patch for the card or overlay with this `id` |
| `apply.overlays.tag:<name>` | object | - | The patch for every card or overlay with this tag |
| `apply.overlays.type:<type>` | object | - | The patch for every card or overlay of this type, such as `type:slider` or `type:line` |
| `apply.overlays.pattern:<regex>` | object | - | The patch for every card or overlay whose `id` matches this JavaScript regular expression. An invalid regex is skipped |
| `apply.overlays.all` | object | - | The patch for every card and overlay on the page |
| `apply.overlays.exclude` | list / string | - | Ids left out of every selector in this rule |

## Templates in patches

**A patch value can be a template, so one rule sets a value that follows an entity.** Here the line is red above 80 and yellow below; drag the power control to see it change.

- The rules engine works out JavaScript (`[[[ ]]]`) and Jinja2 (`{{ }}`) in values directly under `style` and at the top level of a patch. Deeper values, such as a button's `text.name.content`, reach the card as written, and the card works out its own templates.
- A patch belongs to no one card, so `{entity.state}` and the `entity` variable have no entity here: read `states['...']` by id.
- The template is worked out when the rule is checked, which happens when an entity in its `when` changes. Name the entity the template reads in `when` too, as this rule does.

```yaml live controls
type: custom:lcards-msd-card
msd:
  view_box: [0, 0, 600, 120]
  overlays:
    - id: docs_tpl_line
      type: line
      anchor: [40, 60]
      attach_to: [560, 60]
      style:
        color: var(--lcars-blue)
        width: 6
rules:
  - id: docs-rules-template
    when:
      entity: input_number.lcards_test_power
      above: 0
    apply:
      overlays:
        docs_tpl_line:
          style:
            color: "[[[return Number(states['input_number.lcards_test_power'].state) > 80 ? 'var(--lcars-alert-red)' : 'var(--lcars-alert-yellow)']]]"
            width: 10
```

::: details More about templates in patches
- **Shape textures:** a `map_range` value in a patch's `shape_texture.config` (such as `fill_pct`) is worked out from its entity, as in [animations](/core/animations).
:::

## apply.animations

**`apply.animations` plays animations on cards while the rule matches, such as a blink on alert.** Each item names its target (`overlay`, `tag`, `type` or `pattern`) and a `preset`.

- An animation starts when the rule begins to match, not again while it keeps matching. A looping one stops when the rule stops matching; a one-shot plays to its end.
- Targets are list items here (`- tag: alert`), not map keys as in `apply.overlays` (`tag:alert:`).
- The animation keys and presets are on [Rule-based Animations](/core/animations/rule-based-animations) and [Animations](/core/animations).

```yaml live controls
type: custom:lcards-button
id: docs-rules-anim-btn
preset: lozenge
entity: input_boolean.lcards_test_toggle
tap_action:
  action: toggle
text:
  name:
    content: TOGGLE
    show: true
rules:
  - id: docs-rules-animation
    when:
      entity: input_boolean.lcards_test_toggle
      state: "on"
    apply:
      animations:
        - overlay: docs-rules-anim-btn
          preset: blink
          loop: true
          duration: 1000
```

::: details More about apply.animations
- **One target per item:** with more than one target key, the first of `overlay`, `tag`, `type`, `pattern` wins. `exclude` does not apply to animations.
- **Cards still loading:** a target that is not on the page yet is looked for again for about a second and a half, so a rule that matches as an MSD loads still finds its lines.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `overlay` | string | - | Target one card or overlay by its `id` |
| `tag` | string | - | Target every card or overlay with this tag |
| `type` | string | - | Target every card or overlay of this type, such as `button` or `line` |
| `pattern` | string | - | Target every card or overlay whose `id` matches this regular expression |
| `preset` | string | required | The animation preset, such as `pulse`, `blink` or `glow` |
| `loop` | boolean / number | `false` | `true` loops until the rule stops matching; a number repeats that many more times |
| `duration` | number / object | the preset's | Length, ms. Or a `map_range` that follows an entity |
| `delay` | number / object | the preset's | Wait before starting, ms. Or a `map_range` |
| `ease` | string | the preset's | anime.js easing name, such as `inOutQuad` |
| `params` | object | - | The preset's own settings; values may be `map_range` |

## apply.base_svg

**`apply.base_svg` crossfades an MSD's blueprint to other filters while the rule matches: dimmer, grey, or a red tint on alert.** Here the toggle tints the ship red.

- It works on MSD cards only, and on the MSD whose `rules` holds the rule.
- When no rule's `base_svg` holds any more, the blueprint goes back to its own `base_svg.filters`. `filters: []` (or `{}`) clears every filter while the rule matches.
- Each filter type and ready-made recipes (dimmed, backdrop, red wash, monochrome) are on [Base SVG Filters](/cards/msd/base-svg-filters).

```yaml live controls
type: custom:lcards-msd-card
grid_options:
  columns: full
  rows: 4
msd:
  base_svg:
    source: builtin:ncc-1701-a-blue
  view_box: [180, 270, 1600, 720]
rules:
  - id: docs-rules-base-svg
    when:
      entity: input_boolean.lcards_test_toggle
      state: "on"
    apply:
      base_svg:
        filters:
          - mode: svg
            type: tint
            value:
              color: alpha(var(--lcars-alert-red), 0.35)
        transition: 1500
```

::: details More about apply.base_svg
- **Two rules:** the highest-priority matching rule's `base_svg` wins. A rule from a content pack belongs to no card, so it reaches every MSD that has no rule of its own holding.
- **Older configs** wrote `filters` as one map of CSS filters (`opacity: 0.3`, `brightness: 0.7`, `blur: "2px"`, `grayscale`, `hue_rotate: "90deg"`, `sepia`, `saturate`, `contrast`, `invert`). It still works; the list form above also takes the SVG filters, such as `tint`.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `apply.base_svg.filters` | list / object | - | The blueprint's [filters](/cards/msd/base-svg-filters) while the rule matches. `[]` clears them |
| `apply.base_svg.transition` | number | `1000` | Crossfade time, ms |
