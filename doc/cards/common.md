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
