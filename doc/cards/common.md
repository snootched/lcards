---
description: "Options every LCARdS card takes: id and tags for rules, variables for templates, height and width overrides, overflow, z_index and grid_options."
moved_anchors:
  common-properties: /cards/common#more-options-on-every-card
  variables-variables: /cards/common#variables
  card-identification-id-and-tags: /cards/common#id-and-tags
  sizing-height-width-min-height-min-width-max-height-max-width: /cards/common#sizing
  default-behaviour: /cards/common#sizing
  override-formats: /cards/common#sizing
  height-and-width: /cards/common#sizing
  min-height-and-min-width: /cards/common#minimum-and-maximum-size
  max-height-and-max-width: /cards/common#minimum-and-maximum-size
  when-to-use-sizing-overrides: /cards/common#sizing
  overflow-overflow-overflow-x-overflow-y: /cards/common#overflow
  stacking-z-index: /cards/common#z-index
  home-assistant-grid-sizing-grid-options: /cards/common#grid-options
  height-width-min-height-min-width-vs-grid-options: /cards/common#grid-options
  sizing-inside-custom-layout-card: /cards/common#inside-custom-layout-card
  card-features: /cards/common#more-options-on-every-card
---

# Common Card Properties

**Every LCARdS card takes the same set of card-level options: an `id` and `tags` for the rules engine, `variables` for templates, size overrides and `grid_options`.** They sit at the top level of the card's YAML, next to `type`.

- Most cards need none of them: a card fills the cell Home Assistant gives it, and `grid_options` sets how big that cell is.
- The size overrides (`height`, `width` and their minimum and maximum) change how big the card draws inside its cell, for a card outside a sections grid or one that must keep a fixed size.
- The alert overlay is the exception: it takes none of these, see its [card options](/cards/alert-overlay/#card-options).

## id and tags

**`id` names one card and `tags` put it in groups, so [rules](/core/rules/) can restyle that card or every card in a group.** Neither changes how the card looks on its own; they also label the card in debug logs.

- Under a rule's `apply.overlays`, a card's id is the key that targets it (`kitchen-light-btn:`) and `tag:<name>` targets a group (`tag:lights:`).

```yaml live
# A rule on this card turns it blue while the kitchen light is on (tap to toggle)
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
id: kitchen-light-btn
tags:
  - kitchen
  - lights
text:
  name:
    content: KITCHEN
    show: true
rules:
  - id: kitchen-on
    when:
      entity: light.kitchen
      state: "on"
    apply:
      overlays:
        kitchen-light-btn:
          style:
            card:
              color:
                background: var(--lcards-blue)
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `id` | string | - | This card's name for rules (the key under `apply.overlays`) and logs |
| `tags` | list | - | Group names for rules (`tag:<name>`), such as `[nav, lights]` |

## variables

**`variables` holds your own named values, so a value used in several places on a card is set once.** Templates read them: `{variables.<name>}` in a token template and `variables.<name>` inside a `[[[ JavaScript ]]]` template.

- A variable can hold anything YAML can: text, a number, a colour, a list. See [Templates](/core/templates/) for where templates work.

```yaml live
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
variables:
  accent: var(--lcards-orange)
  room: Kitchen
text:
  label:
    content: "{variables.room}"
    show: true
style:
  card:
    color:
      background:
        active: "[[[ return variables.accent ]]]"
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `variables` | object | - | Your own named values: `variables.<name>` in JavaScript templates, `{variables.<name>}` in token templates |

## Sizing

**`height` and `width` set the card's own size, overriding the cell it sits in.** By default a card is as big as its cell and its drawing scales to fit, so you only need these for a fixed size or for a card outside a sections grid.

- A number is pixels (`200` is `200px`); a string takes any CSS length: `px`, `%`, `vh` and `vw`, `em` and `rem`, or `calc()`.
- In a sections view Home Assistant still sizes the cell from `grid_options` (or the card's own row count), so a card taller than its cell overlaps the cards below it. Set `grid_options.rows` to match.
- A pixel `height` also sets the rows the card reports in a masonry view: the height divided by 50, rounded up.

```yaml live
# A fixed 120 px tall button, half the width of its cell (two rows, so it fits)
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
height: 120
width: 50%
grid_options:
  rows: 2
text:
  name:
    content: FIXED SIZE
    show: true
```

::: details More about sizing
- **Where it helps:** a card in a horizontal stack or another container that doesn't use the sections grid, a chart or MSD at an exact pixel height, or a pair of `height` and `width` that keeps proportions.
- **Relative units:** `vh`, `%` and other relative heights can't be turned into rows before the card draws, so the card reports its usual row count for them.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `height` | number / string | the cell's height | Card height: a number is px, or any CSS length (`200px`, `50vh`, `calc(100% - 8px)`) |
| `width` | number / string | the cell's width | Card width: a number is px, or any CSS length (`300px`, `100%`) |

### Minimum and maximum size

**`min_height`, `min_width`, `max_height` and `max_width` keep a card that sizes itself between a floor and a ceiling.** The card still fills its cell, but never shrinks below the minimum or grows past the maximum.

- A `height` or `width` wins over the minimum on the same side: the card is exactly that size.
- A button (and an elbow or slider) has a floor already: its presets set `min_height` to the theme's button height (56 px with the LCARdS theme), and without one it keeps `--lcards-button-min-height` (40 px unless your theme sets it). In a [Layout Card](/cards/layout-card/) or [layout view](/cards/layout-view/) cell of a fixed height it follows the cell instead; elsewhere set `min_height: 0` to let it follow a shorter cell.

```yaml live
# A two-row cell, but never taller than 80 px or wider than 300 px
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
max_height: 80
max_width: 300
grid_options:
  rows: 2
text:
  name:
    content: CEILING
    show: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `min_height` | number / string | the button's preset: the theme's button height; others none | Smallest height (a number is px). Cleared when `height` is set; the preset's gives way in a layout cell of a fixed height |
| `min_width` | number / string | - | Smallest width (a number is px). Cleared when `width` is set |
| `max_height` | number / string | - | Largest height (a number is px, or any CSS length) |
| `max_width` | number / string | - | Largest width (a number is px, or any CSS length) |

## overflow

**`overflow` sets what happens to content that doesn't fit inside the card: it can spill out, be cut off, or scroll.** `overflow_x` and `overflow_y` set one direction each and win over `overflow` for that direction.

- The values are CSS's: `visible` (spills out), `hidden` (cut off), `clip` (cut off, and no scrolling from code either), `scroll` (always a scrollbar) and `auto` (a scrollbar only when needed).

```yaml live
# Cut off anything drawn outside the card, such as a glow
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
overflow: hidden
text:
  name:
    content: CLIPPED
    show: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `overflow` | string | - | Both directions: `visible`, `hidden`, `clip`, `scroll` or `auto` |
| `overflow_x` | string | - | Left to right only, over `overflow` |
| `overflow_y` | string | - | Top to bottom only, over `overflow` |

## z_index

**`z_index` sets which card is drawn on top where cards overlap.** A higher number is in front of a lower one; cards that set none share the default stacking order.

- It only orders cards that overlap in the same container, such as cards placed over each other in a [Layout Card](/cards/layout-card/).

```yaml live
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
z_index: 10
text:
  name:
    content: IN FRONT
    show: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `z_index` | integer | - | Stacking order, higher in front. The card editor offers -999 to 9999 |

## grid_options

**`grid_options` is Home Assistant's own setting for how many columns and rows of a sections view the card takes.** It sizes the cell; the card then fills it.

- A section is 12 columns wide, and each row is 56 px with an 8 px gap. Without `grid_options` each card asks for its own size: a button is one row, a d-pad five.
- `grid_options` sizes the cell and `height` / `width` size the card in it; in a sections view `grid_options` is usually all you need.

```yaml live
# Half the section's width, two rows tall
type: custom:lcards-button
entity: light.kitchen
preset: lozenge
grid_options:
  columns: 6
  rows: 2
text:
  name:
    content: TWO ROWS
    show: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `grid_options.columns` | number / string | the card's own | Columns of 12 to span, or `full` |
| `grid_options.rows` | number / string | the card's own | Rows to take, or `auto` |

## Inside custom:layout-card

**Use the LCARdS [Layout Card](/cards/layout-card/) rather than `custom:layout-card` to arrange LCARdS cards in a grid.** Inside `custom:layout-card`'s grid, LCARdS cards shrink to their minimum height (its rows are `auto` high) and `card_margin` is ignored; the LCARdS Layout Card has neither problem and adds the Layout Studio.

- Moving over is one line: set `type: custom:lcards-layout-card` and remove `layout_type`. The `layout` keys and each card's `view_layout` stay the same.

```yaml live
type: custom:lcards-layout-card
layout:
  grid-template-columns: repeat(3, 1fr)
  grid-template-rows: 1fr
  height: 120px
cards:
  - type: custom:lcards-button
    preset: lozenge
  - type: custom:lcards-button
    preset: lozenge
  - type: custom:lcards-button
    preset: lozenge
```

::: details Staying on custom:layout-card?
Add this to the layout card itself (not the LCARdS card) so its rows fill their height. `card_margin` stays ignored there; the LCARdS Layout Card is the fix.

```yaml
type: custom:layout-card
layout_type: custom:grid-layout
card_mod:
  style: |
    grid-layout {
      --layout-height: 100% !important;
    }
```
:::

## More options on every card

**Most cards also take these options, each with its own page.**

| Option | Covers |
|--------|--------|
| [`text`](/core/text-fields) | Text fields with templates, per-field styling and zones |
| [`tap_action`, `hold_action`, `double_tap_action`](/core/actions) | Any Home Assistant action |
| [`preset`](/core/presets) | Style presets (button, elbow, slider; select menu options) |
| [`rules`](/core/rules/) | Restyle this or other cards when conditions match |
| [`animations`](/core/animations) | Animations on load, tap, state change and more |
| [`background_animation`](/core/effects/background-animations) | Animated canvas backgrounds (button, elbow, slider) |
| [`filters`](/core/effects/filters) | CSS and SVG filters on the card |
| [`sounds`](/core/sounds) | Per-card sound overrides, or `enabled: false` |
| [`data_sources`](/core/datasources/) | Named entity subscriptions with history and processing |
| [`triggers_update`](/core/templates/#manual-tracking-with-triggers-update) | Extra entities that re-evaluate templates |
| [`zones`, `debug_zones`](/core/text-fields-zones) | Your own named text zones, and outlines for every zone |
| [`state_attribute`, `ranges_attribute`, `state_classification`](/core/colours) | State colours from an attribute or your own state buckets |
| [Themes](/core/themes/) | The design tokens cards read (colours, fonts, sizes) |
