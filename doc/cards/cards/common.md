# Common Card Properties

Every LCARdS card shares a set of universal top-level properties regardless of card type. This page documents them alongside how sizing interacts with the HA grid system.

---

## Universal Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Custom card ID for [Rules Engine](../../core/rules/README.md) targeting (e.g. `my-light-btn`) |
| `tags` | list | One or more string tags for Rules Engine group targeting (e.g. `[nav, lights]`) |
| `height` | string | CSS height override applied to the card host element (see below) |
| `width` | string | CSS width override applied to the card host element (see below) |
| `grid_options` | object | HA grid sizing — `rows` and `columns` for the Lovelace grid (see below) |
| `data_sources` | object | DataSource definitions — see [DataSources](../../core/datasources/README.md) |

---

## Card Identification (`id` and `tags`)

`id` and `tags` are used by the [Rules Engine](../../core/rules/README.md) to target cards for conditional style patches.

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
- Neither field affects visual appearance directly — they exist solely for rules targeting

---

## Sizing (`height` and `width`)

These properties set an explicit CSS size on the card's host element, overriding whatever the container would normally assign.

### Accepted formats

| Value | Result | Example |
|-------|--------|---------|
| Bare integer | Treated as pixels | `200` → `200px` |
| `px` value | Exact pixels | `200px` |
| `vh` / `vw` | Viewport-relative | `50vh` |
| `%` | Percentage of container | `100%` |
| `em` / `rem` | Font-relative | `10em` |

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

### When to use this

These overrides are most useful when a card's natural size would be wrong or unpredictable:

- **Alert overlays** — cards used as overlay content need an explicit size because the overlay container uses `height: auto`
- **Horizontal stacks** — when you need cards to fill remaining space (`width: 100%`)
- **Fixed-size panels** — embedding a chart or MSD at a specific pixel height
- **Aspect-ratio layouts** — pairing with `width` to keep proportions consistent

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

### `height`/`width` vs `grid_options`

These two systems operate independently and serve different purposes:

| | `height` / `width` | `grid_options` |
|---|---|---|
| **What it sets** | CSS size of the card host element | HA grid slot allocation |
| **Effect on layout** | How large the card *renders* inside its slot | How large a *slot* HA reserves in the grid |
| **Typical use** | Overlays, stacks, fixed-px sizing | Standard dashboard grid layout |
| **Units** | Any CSS unit or bare integer (= px) | Whole numbers only |

In most dashboard layouts you only need `grid_options`. Use `height`/`width` when you need to override the rendered size independently of the grid slot — for example when a card is inside a fixed-size container that doesn't use the HA grid.
