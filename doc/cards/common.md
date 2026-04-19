# Common Card Properties

LCARdS share a set of common top-level configuration properties regardless of card type.  This page documents them alongside how sizing interacts with the HA grid system.

## Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Custom card ID for [Rules Engine](../core/rules/) targeting (e.g. `my-light-btn`) |
| `tags` | list | One or more string tags for Rules Engine group targeting (e.g. `[nav, lights]`) |
| `height` | number / string | CSS height override applied to the card host element (see below) |
| `width` | number / string | CSS width override applied to the card host element (see below) |
| `min_height` | number / string | Minimum height floor — card will not shrink below this value (see below) |
| `min_width` | number / string | Minimum width floor — card will not shrink below this value (see below) |
| `grid_options` | object | HA grid sizing — `rows` and `columns` for the Lovelace grid (see below) |
| `data_sources` | object | Named data source definitions — see [Data Sources](../core/datasources/) |
| `triggers_update` | list | Extra entity IDs that trigger template re-evaluation — see [Templates](../core/templates/#manual-tracking-with-triggers-update) |

## Card Identification (`id` and `tags`)

`id` and `tags` are used by the [Rules Engine](../core/rules/) to target cards for conditional style patches.

```yaml
type: custom:lcards-button
id: kitchen-light-btn        # unique identifier — target with rules selector `#kitchen-light-btn`
tags:
  - kitchen
  - lights
  - nav
```

- `id` targets a single specific card (`#kitchen-light-btn`)
- `tags` target groups of cards (`.lights`, `.nav`)
- Neither field affects visual appearance directly — they exist solely for rules targeting and can be helpful with debug logging.

---

## Sizing (`height`, `width`, `min_height`, `min_width`)

### Default behaviour

By default you don't need to set any of these. LCARdS cards are `width: 100%; height: 100%` — they fill whatever grid slot Home Assistant allocates. The card's SVG content automatically scales to fit the available space using a ResizeObserver that measures the rendered container size on every layout change. Use `grid_options` (below) to control how large that slot is.

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

```yaml
type: custom:lcards-button
height: 200          # 200px
width: 500px
```

```yaml
type: custom:lcards-button
height: 50vh         # half viewport height
width: 100%          # fill container
```

### `min_height` and `min_width`

Set a minimum size floor. The card can grow beyond this value but will not shrink below it. Useful when content length is dynamic and you want to prevent the card from collapsing while still allowing it to expand naturally.

```yaml
type: custom:lcards-button
min_height: 40       # never shorter than 40px
min_width: 80        # never narrower than 80px
```

These override the CSS token defaults (`--lcars-button-min-height` and `--lcars-button-min-width`). When `height` is also set, it takes precedence and the `min-height` floor is cleared (`min-height: 0`) so the fixed height is respected exactly. `min_height` and `min_width` do not affect `getCardSize()`.

### When to use sizing overrides

- **Alert overlays** — explicit size because the overlay container uses `height: auto`
- **Horizontal stacks** — fill remaining space with `width: 100%`
- **Fixed-size panels** — embed a chart or MSD at an exact pixel height
- **Aspect-ratio layouts** — pair `height` with `width` to keep proportions consistent
- **Dynamic content** — use `min_height`/`min_width` to prevent collapse when content length varies

> **Note on `getCardSize()`**: HA uses `getCardSize()` to pre-allocate grid space before the card renders. When `height` is set in pixels, LCARdS uses that value to report grid rows (`px ÷ 56`, rounded up). For non-px units (`vh`, `%`, etc.) the card falls back to its default row count since the pixel value cannot be determined at configuration time.

---

## HA Grid Sizing (`grid_options`)

`grid_options` controls how the card occupies the Lovelace grid. This is the standard HA mechanism and is independent of `height`/`width`.

```yaml
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

In most dashboard layouts you only need `grid_options`. Use the sizing properties when you need to override the rendered size independently of the grid slot — for example when a card is inside a fixed-size container that doesn't use the HA grid.

---

## Sizing inside `custom:layout-card`

[`custom:layout-card`](https://github.com/thomasloven/lovelace-layout-card) arranges cards in a CSS Grid, Masonry, or other layout. By default it sets `--layout-height: auto` on the grid container, which means grid rows size to their content rather than stretching to fill the allocated height. LCARdS cards rely on `height: 100%` on their host element to fill the row — with `auto` height rows this collapses the card to its minimum height.

### Symptom

Cards inside a `custom:layout-card` grid shrink to their minimum height instead of filling the row.

### Fix

Add a `card_mod` entry to the **layout-card itself** (not the LCARdS card) to override the layout height variable:

```yaml
type: custom:layout-card
layout_type: custom:grid-layout
layout:
  grid-template-columns: repeat(3, 1fr)
  grid-template-rows: 200px
card_mod:
  style: |
    grid-layout {
      --layout-height: 100% !important;
    }
cards:
  - type: custom:lcards-button
    # ...
```

This forces the grid-layout shadow host to stretch its items to fill the row height rather than collapsing to content size.

> **Note**: `card_mod` must target the `grid-layout` element, which is the shadow root of layout-card's internal renderer. The selector `grid-layout { ... }` is the correct target regardless of which `layout_type` you use with grid-based layouts.

### `card_margin` and overflow

If you use `card_margin` on your layout-card (a feature of custom patched versions), LCARdS automatically compensates for the vertical margin so cards do not overflow their row boundaries. No additional configuration is needed for margin handling.
