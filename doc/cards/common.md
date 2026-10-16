# Common Card Properties

LCARdS share a set of common top-level configuration properties regardless of card type.  This page documents them alongside how sizing interacts with the HA grid system.

## Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Custom card ID for [Rules Engine](../core/rules/) targeting (e.g. `my-light-btn`) |
| `tags` | list | One or more string tags for Rules Engine group targeting (e.g. `[nav, lights]`) |
| `height` | number / string | CSS height override applied to the card host element (see below) |
| `width` | number / string | CSS width override applied to the card host element (see below) |
| `min_height` | number / string | Minimum height floor: card will not shrink below this value (see below) |
| `min_width` | number / string | Minimum width floor: card will not shrink below this value (see below) |
| `max_height` | number / string | Maximum height ceiling: card will not grow beyond this value (see below) |
| `max_width` | number / string | Maximum width ceiling: card will not grow beyond this value (see below) |
| `overflow` | string | CSS overflow shorthand for both axes: `visible`, `hidden`, `clip`, `scroll`, or `auto` |
| `overflow_x` | string | Horizontal axis overflow: same values as `overflow`; overrides the shorthand |
| `overflow_y` | string | Vertical axis overflow: same values as `overflow`; overrides the shorthand |
| `z_index` | integer | CSS z-index on the card host element (range: -999 to 9999) |
| `grid_options` | object | HA grid sizing: `rows` and `columns` for the Lovelace grid (see below) |
| `data_sources` | object | Named data source definitions: see [Data Sources](../core/datasources/) |
| `triggers_update` | list | Extra entity IDs that trigger template re-evaluation; see [Templates](../core/templates/#manual-tracking-with-triggers-update) |
| `preset` | string | Style preset (button, slider, elbow; select menu option buttons): see [Presets](../core/presets.md) |
| `rules` | list | Rules that restyle this or other cards when conditions match: see [Rules Engine](../core/rules/) |
| `animations` | list | Trigger-based animations (on load, on tap, on state change, ...): see [Animations](../core/animations.md) |
| `background_animation` | list | Canvas background effects (button, elbow, slider): see [Background Animations](../core/effects/background-animations.md) |
| `filters` | list | CSS / SVG filters applied to the card: see [Filters](../core/effects/filters.md) |
| `sounds` | object | Per-card sound overrides or `enabled: false`: see [Card Sounds](../core/sounds.md) |
| `variables` | object | Your own named values for templates (see [Variables](#variables-variables) below) |
| `zones` / `debug_zones` | object / boolean | Extra named text zones, and outlines for every zone: see [Text Fields](../core/text-fields.md) |
| `state_attribute` / `ranges_attribute` / `state_classification` | string / string / object | Drive state colours from an attribute or custom buckets: see [Colours](../core/colours.md) |

## Variables (`variables`)

`variables` holds your own named values. Reference them in templates so a value used in several places is set once:

```yaml live
type: custom:lcards-button
entity: light.kitchen
variables:
  accent: "var(--lcars-orange)"
  room: Kitchen
text:
  label:
    content: "{variables.room}"
style:
  card:
    color:
      background:
        active: "[[[ return variables.accent ]]]"
```

Use `{variables.<name>}` in token templates and `variables.<name>` inside `[[[ JavaScript ]]]` templates. See [Templates](../core/templates/).

## Card Identification (`id` and `tags`)

`id` and `tags` are used by the [Rules Engine](../core/rules/) to target cards for conditional style patches.

```yaml live
type: custom:lcards-button
id: kitchen-light-btn        # unique identifier - target with rules selector `#kitchen-light-btn`
tags:
  - kitchen
  - lights
  - nav
```

- `id` targets a single specific card (`#kitchen-light-btn`)
- `tags` target groups of cards (`.lights`, `.nav`)
- Neither field affects visual appearance directly: they exist solely for rules targeting and can be helpful with debug logging.

---

## Sizing (`height`, `width`, `min_height`, `min_width`, `max_height`, `max_width`)

### Default behaviour

By default you don't need to set any of these. LCARdS cards are `width: 100%; height: 100%`; they fill whatever grid slot Home Assistant allocates. The card's SVG content automatically scales to fit the available space using a ResizeObserver that measures the rendered container size on every layout change. Use `grid_options` (below) to control how large that slot is.

The four sizing properties are **overrides** for situations where automatic slot-filling isn't sufficient.

### Override formats

All four properties accept the same value formats:

| Value | Result | Example |
|-------|--------|---------|
| Bare integer | Treated as pixels | `200` → `200px` |
| `px` value | Exact pixels | `200px` |
| `vh` / `vw` | Viewport-relative | `50vh` |
| `%` | Percentage of container | `100%` |
| `em` / `rem` | Font-relative | `10em` |

### `height` and `width`

Set an explicit CSS size on the card's host element, overriding whatever the container would normally assign.

```yaml live
type: custom:lcards-button
height: 200          # 200px
width: 500px
```

```yaml live
type: custom:lcards-button
height: 50vh         # half viewport height
width: 100%          # fill container
```

### `min_height` and `min_width`

Set a minimum size floor. The card can grow beyond this value but will not shrink below it. Useful when content length is dynamic and you want to prevent the card from collapsing while still allowing it to expand naturally.

```yaml live
type: custom:lcards-button
min_height: 40       # never shorter than 40px
min_width: 80        # never narrower than 80px
```

These override the CSS token defaults (`--lcars-button-min-height` and `--lcars-button-min-width`). When `height` is also set, it takes precedence and the `min-height` floor is cleared (`min-height: 0`) so the fixed height is respected exactly. `min_height` and `min_width` do not affect `getCardSize()`.

### `max_height` and `max_width`

Set a maximum size ceiling. The card can shrink below this value but will not grow beyond it. Useful for preventing a card from expanding too far in a flexible or dynamic layout.

```yaml live
type: custom:lcards-button
max_height: 200      # never taller than 200px
max_width: 400px     # never wider than 400px
```

Accepts the same formats as `height` and `width` (bare integer = px, or any CSS unit). `max_height` and `max_width` do not affect `getCardSize()`.

### When to use sizing overrides

- **Alert overlays**: explicit size because the overlay container uses `height: auto`
- **Horizontal stacks**: fill remaining space with `width: 100%`
- **Fixed-size panels**: embed a chart or MSD at an exact pixel height
- **Aspect-ratio layouts**: pair `height` with `width` to keep proportions consistent
- **Dynamic content**: use `min_height`/`min_width` to prevent collapse when content length varies

> **Note on `getCardSize()`**: HA uses `getCardSize()` to pre-allocate grid space before the card renders. When `height` is set in pixels, LCARdS uses that value to report grid rows (`px ÷ 56`, rounded up). For non-px units (`vh`, `%`, etc.) the card falls back to its default row count since the pixel value cannot be determined at configuration time.

---

## Overflow (`overflow`, `overflow_x`, `overflow_y`)

Controls what happens when a card's content exceeds its rendered size. Accepts the standard CSS overflow values.

| Value | Behaviour |
|-------|-----------|
| `visible` | Content is not clipped: overflows the card box |
| `hidden` | Content is clipped without a scrollbar |
| `clip` | Like `hidden` but also disallows programmatic scrolling |
| `scroll` | Always shows a scrollbar |
| `auto` | Adds a scrollbar only when content overflows |

```yaml live
type: custom:lcards-button
overflow: hidden        # clip any content that exceeds the card bounds
```

`overflow_x` and `overflow_y` set the horizontal and vertical axes independently and override `overflow` when both are present.

```yaml live
type: custom:lcards-button
overflow_x: hidden
overflow_y: auto        # vertical scrollbar only when needed
```

---

## Stacking (`z_index`)

Sets the CSS `z-index` on the card's host element, controlling its stacking order relative to adjacent cards in the same grid container. Useful when cards overlap: for example, an alert overlay, a floating panel, or an MSD embed.

```yaml live
type: custom:lcards-button
z_index: 10     # render above neighbouring cards (range: -999 to 9999)
```

---

## HA Grid Sizing (`grid_options`)

`grid_options` controls how the card occupies the Lovelace grid. This is the standard HA mechanism and is independent of `height`/`width`.

```yaml live
type: custom:lcards-button
grid_options:
  columns: 6    # span 6 grid columns (out of 12)
  rows: 2       # request 2 grid rows of height
```

| Field | Type | Description |
|-------|------|-------------|
| `columns` | number | Grid columns to span (HA grid is 12 columns wide) |
| `rows` | number | Grid rows to request |

### `height`/`width`/`min_height`/`min_width` vs `grid_options`

These two systems operate independently and serve different purposes:

| | `height` / `width` / `min_height` / `min_width` | `grid_options` |
|---|---|---|
| **What it sets** | CSS size of the card host element | HA grid slot allocation |
| **Effect on layout** | How large the card *renders* inside its slot | How large a *slot* HA reserves in the grid |
| **Typical use** | Overlays, stacks, fixed-px sizing, dynamic-content floors | Standard dashboard grid layout |
| **Units** | Any CSS unit or bare integer (= px) | Whole numbers only |

In most dashboard layouts you only need `grid_options`. Use the sizing properties when you need to override the rendered size independently of the grid slot, for example when a card is inside a fixed-size container that doesn't use the HA grid.

---

## Sizing inside `custom:layout-card`

Use LCARdS's own [Layout Card](layout-card/) (`custom:lcards-layout-card`) instead of [`custom:layout-card`](https://github.com/thomasloven/lovelace-layout-card). Inside `custom:layout-card`'s grid, LCARdS cards shrink to their minimum height (its grid rows default to `auto` height) and `card_margin` is ignored (the margins are hard-coded). The LCARdS Layout Card has neither problem, and adds the Layout Studio visual editor.

Moving over is a one-line change: set `type: custom:lcards-layout-card` and remove `layout_type`. The `layout` keys and each card's `view_layout` stay the same.

```yaml
type: custom:lcards-layout-card
layout:
  grid-template-columns: repeat(3, 1fr)
  grid-template-rows: 1fr
  height: 300px
cards:
  - type: custom:lcards-button
    preset: lozenge
```

::: details Staying on custom:layout-card?
Add this to the **layout-card itself** (not the LCARdS card) so its rows fill their height:

```yaml
type: custom:layout-card
layout_type: custom:grid-layout
card_mod:
  style: |
    grid-layout {
      --layout-height: 100% !important;
    }
```

`card_margin` stays broken there; the LCARdS Layout Card is the fix.
:::

---

## Card Features

All LCARdS cards support the following cross-cutting features in addition to the common properties above. Each links to the full reference page.

| Feature | Description |
|---------|-------------|
| [Text Labels](../core/text-fields.md) | Multiple positioned text fields with template support, per-field styling, and zone targeting |
| [Actions](../core/actions.md) | `tap_action`, `hold_action`, and `double_tap_action`, any HA action type |
| [Animations](../core/animations.md) | Trigger-based card animations (on load, on state change, etc.) |
| [Background Animations](../core/effects/background-animations.md) | Canvas-rendered animated backgrounds (grid, starfield, fluid, etc.) |
| [Card Sounds](../core/sounds.md) | Per-card audio playback tied to state changes or actions |
| [Rules Engine](../core/rules/) | Conditional style patches driven by entity state, time, or tags |
| [Data Sources](../core/datasources/) | Named entity subscriptions with history buffering and processing |
| [Templates](../core/templates/) | JS, token, DataSource, and Jinja2 template evaluation in any string field |
| [Themes](../core/themes/) | Design token system: colours, typography, borders, and component defaults |

::: tip Not every card supports every feature
Some features are card-specific; for example, `background_animation` is only available on cards that render a canvas layer (Button, Elbow, Slider). Check the individual card page for which features apply.
:::
