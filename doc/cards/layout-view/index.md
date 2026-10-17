# Layout View

`custom:lcards-layout-view`

<video class="doc-video" src="/img/cards/layout-editing.webm" poster="/img/cards/layout-editing.webp" title="Editing a layout view: the dashboard, then Layout mode with coloured areas and track bands, then Card mode, then back to the dashboard" autoplay loop muted playsinline></video>

A custom dashboard **view type** with a built-in, in-view WYSIWYG CSS Grid editor: build a grid layout visually (drag to resize tracks, draw areas, drop cards into them) right on the dashboard, the way HA Sections works.

It reuses the [`custom:grid-layout`](https://github.com/thomasloven/lovelace-layout-card) (lovelace-layout-card) schema, so an existing `grid-layout` view usually moves over by changing only `type: custom:grid-layout` → `type: custom:lcards-layout-view`. A couple of differences apply; see [Compatibility with grid-layout](#compatibility-with-grid-layout).

---

## Quick Start

A view is configured in your dashboard's **raw config** (⋮ → *Edit dashboard* → ⋮ → *Raw configuration editor*), as one entry under `views:`.

```yaml
views:
  - title: Bridge
    type: custom:lcards-layout-view   # the whole view is a grid
    layout:
      grid-template-columns: "160px 1fr"
      grid-template-rows: "80px 1fr 60px"
      grid-template-areas: |
        "header header"
        "sidebar content"
        "footer footer"
      grid-gap: "8px"
    cards:
      - type: custom:lcards-elbow
        view_layout:
          grid-area: header
      - type: custom:lcards-button
        view_layout:
          grid-area: sidebar
      - type: weather-forecast
        view_layout:
          grid-area: content
```

The fastest way to build one is visually: add a blank view and edit it in place.

```yaml
views:
  - title: New Layout
    type: custom:lcards-layout-view   # blank 3×3 grid - enter edit mode to build
```

---

## Editing in the dashboard

Enter HA **edit mode** (top-right pencil). A toolbar strip appears above the grid with a **Layout | Cards** toggle; it sits in its own space, so it never covers your cards. The ⓘ button at its right end shows tips for the current mode. While editing, cards are inactive: a click selects or edits a card and never runs its tap action. Every change can be undone with HA's **Undo** button in the dashboard toolbar.

### Layout mode (the grid)

Build and shape the grid itself. Column and row headers sit in a gutter above and left of the grid, showing each track's size. Each area is drawn as a coloured outline with its name and the card placed in it, so the real cards stay visible.

Settings open in a **side panel** on the right (a sheet at the bottom on a phone). The grid narrows while it is open, so the panel never covers a card; it shows one thing at a time and follows the area you select.

- **Resize tracks**: drag the line between two columns or rows (in the header gutter, or between two different areas).
- **Track settings**: click a column or row header to open it in the side panel: size presets (`1fr`, `auto`, `200px`, `50%`, ...), a custom size, **Insert left/right** (or above/below) and **Delete**.
- **Add tracks**: the *Column* / *Row* buttons on the toolbar add one at the end; **Insert left/right** in a track's settings inserts one next to it.
- **Reorder tracks**: drag a column or row header.
- **Create an area**: click an empty cell, or drag across empty cells, then name it.
- **Resize or move an area**: click an area to select it, then drag one of the grips on its edges, or drag its name to move it. The target cells are previewed; red means another area is in the way, and nothing changes.
- **Area menu**: every area has a ⋮ button (top right) with **Rename**, **Add card**, **Area settings** (the [per-area settings](#per-area-settings): background, border, spacing...) and **Delete area**.
- **Grid settings**: the *tune* button on the toolbar sets `grid-gap`, `height`, `card_margin`, `padding`.
- **Area tint**: the toolbar slider sets how strongly areas are coloured. Raise it when an area's colour is close to the cards in it; lower it to see the cards and area backgrounds as they are. It starts at 60% and keeps your setting when you switch modes or reload (per browser).

### Card mode

Place and manage cards inside areas. Cards get the same controls as in HA's own views:

- **Edit a card**: hover (or tap) a card and click it: HA's card editor opens.
- **Card menu**: the ⋮ button (top right) has **Edit**, **Placement & spacing** ([per-card placement](#per-card-placement) in the side panel: alignment, margin, overflow) and **Delete** (asks first; HA's *Undo* toast can still bring the card back).
- **Add a card**: every empty area shows an **Add card** tile that opens HA's card picker; the new card is placed in that area automatically.
- **Stacked cards**: when several cards share one area (say a frame elbow behind an MSD, plus an alert overlay), the area shows a picker with one button per card. Pick a card to bring its edit controls to the front.

> Cards placed in the same area are layered on top of each other (useful for a frame elbow behind another card). To lay several cards out one after another in an area, put a `vertical-stack` (or `horizontal-stack`) card there instead.

---

## Layout properties

All keys live under `layout:` and use standard CSS Grid property names.

| Key | Description | Default |
|-----|-------------|---------|
| `grid-template-columns` | Column track sizes, e.g. `"160px 1fr 1fr"` | `1fr 1fr 1fr` |
| `grid-template-rows` | Row track sizes | `1fr 1fr 1fr` |
| `grid-template-areas` | Named area map (one quoted string per row) | - |
| `grid-gap` | Gap between cells, e.g. `"8px"` | `5px` |
| `height` | View height | `calc(100dvh - var(--header-height, 56px))` |
| `margin` | Outer margin of the grid container | - |
| `padding` | Inner padding of the grid container | - |
| `card_margin` | Default margin around every card | - |
| `card_overflow` | Default overflow for every card | `visible` |
| `place-items` / `place-content` | Grid alignment passthrough | - |
| `grid-auto-flow` / `grid-auto-columns` / `grid-auto-rows` | Grid auto-placement passthrough | - |
| `mediaquery` | Responsive overrides (see below) | - |
| `areas` | Per-area settings map (see [below](#per-area-settings)) | - |

### Responsive layouts (`mediaquery`)

Override grid template properties at given breakpoints:

```yaml
layout:
  grid-template-columns: "160px 1fr"
  mediaquery:
    "(max-width: 768px)":
      grid-template-columns: "1fr"
      grid-template-areas: |
        "header"
        "content"
        "sidebar"
        "footer"
```

---

## Placing cards (`view_layout`)

Each entry in `cards:` accepts a `view_layout` block that positions it in the grid. Any of these can be set in YAML; the editor surfaces the most common ones.

| Key | Description |
|-----|-------------|
| `grid-area` | Name of the area to place the card in (the usual way) |
| `grid-column` / `grid-row` | Explicit line-based placement instead of an area |
| `place-self` / `align-self` / `justify-self` | How the card sits in its cell: `stretch` (default), `start`, `center`, `end` |
| `margin` | Space around the card within its cell (overrides `card_margin`) |
| `overflow` | `visible` (default), `hidden`, `auto` (scroll) |
| `z-index` | Stacking order |

### Per-card placement

The card-mode **Placement** panel writes `place-self`, `margin`, and `overflow` for the selected card:

```yaml
cards:
  - type: custom:lcards-button
    view_layout:
      grid-area: content
      place-self: center   # don't stretch - center in the cell
      margin: "0"
      overflow: hidden
```

### Conditional cards

Use Home Assistant's **native card Visibility** for per-card conditions: open the card's editor and switch to the **Visibility** tab. It supports screen-size presets (mobile / tablet / desktop), plus state, user, numeric, time, and `and`/`or` conditions, and updates live as conditions change.

> The layout view does not implement its own per-card `show` option. A pasted `custom:grid-layout` config that uses `view_layout.show` will simply ignore that key; move the condition to the card's Visibility tab. (To vary the *grid itself* by screen size, use [`mediaquery`](#responsive-layouts-mediaquery) at the layout level.)

### Visibility-driven row sizing

When a card has a Visibility condition and occupies a row, the layout view can automatically collapse that row to `0px` when the card is hidden and restore it when the card appears, without any manual CSS.

**Requirements:**

1. The card must have an explicit, definite `layout.height` (e.g. `height: 10vh` or `height: 120px`), typically a `custom:lcards-layout-card`. Percentage and `auto` heights are not supported; the row would have nothing to size to.
2. Any Visibility condition type works (`state`, `numeric_state`, `screen`, `user`, `template`, `and`/`or`/`not`, …). The view follows HA's own verdict: it watches whether HA hid the card rather than re-evaluating the condition.
3. The row collapses only when **every** visibility-controlled card in it is hidden. Cards in the row without a Visibility condition don't hold it open, so a row is best owned by a single visibility-controlled card.

```yaml
cards:
  - type: custom:lcards-layout-card
    layout:
      height: 10vh                     # must be a definite, non-percentage height
      grid-template-areas: '"left banner"'
      grid-template-columns: auto 1fr
    view_layout:
      grid-area: top-bar               # the row containing top-bar collapses when hidden
    visibility:
      - condition: state
        entity_id: input_boolean.show_top_bar   # HA's Visibility editor saves this shape;
        state: "on"                             # the older `entity:` key works too
```

When `input_boolean.show_top_bar` is `"on"`, the row is set to `10vh`. When it's anything else, the row is set to `0px`. Any `1fr` rows in the layout are recomputed to fill the remaining space correctly. In dashboard edit mode every visibility-controlled row is expanded, matching HA showing every card while editing.

> **Sidebar / window resize:** row heights are recomputed automatically via a `ResizeObserver` whenever the host element changes size (HA sidebar opens/closes, window resized, dev tools toggled).

---

## Per-area settings

`layout.areas` styles an **area itself**, independent of any card in it, so an empty area can still show a background or border (LCARS panels), and the styling survives swapping the card out. This is an LCARdS extension (ignored by `custom:grid-layout`, so configs stay portable).

```yaml
layout:
  grid-template-areas: |
    "header header"
    "sidebar content"
  areas:
    header:
      background: "var(--lcars-ui-primary)"
      border-radius: "var(--ha-border-radius-lg)"
    sidebar:
      background: "theme:colors.ui.secondary"   # theme token
      margin: "6px"                              # inset the card
      place-self: stretch
    content:
      background-image: "url(/local/lcars/grid.png)"
      background-size: cover
```

| Key | Applies to | Notes |
|-----|-----------|-------|
| `background` | Surface | Color, `var(...)`, gradient, or a `theme:` token |
| `background-image` | Surface | `url(...)` or a CSS gradient |
| `background-size` | Surface | `cover` (default), `contain`, `100% 100%` (stretch), `auto` |
| `background-position` | Surface | `center` (default), `top`, `bottom`, `left`, `right` |
| `background-repeat` | Surface | `no-repeat` (default), `repeat`, `repeat-x`, `repeat-y` |
| `border-width` / `border-style` / `border-color` | Surface | Border around the area; color accepts `theme:` tokens |
| `border-radius` | Surface | Corner rounding |
| `place-self` | Placement | Default alignment for a card placed here |
| `margin` | Placement | Default inset of the card within the area |
| `overflow` | Placement | Default content overflow for the card |
| `z-index` | Surface | Stacking order of the area's backing |

**Precedence:** global defaults (`card_margin`, `card_overflow`) → per-area (`layout.areas`) → per-card (`view_layout`). A card's own setting always wins.

> The area backing is non-interactive and sits *behind* the card. For interactive LCARS chrome (elbows, buttons, frames) place an `lcards-elbow` / `lcards-button` card in the area instead; `areas` is only for simple surface decoration.

---

## Layout Card

The card version of the layout view, `custom:lcards-layout-card`, builds a sub-grid inside one area (or a panel on any dashboard) with the same `layout`, `view_layout` and `areas` options. It has its own page: [Layout Card](../layout-card/).

## Notes & limitations

- **One card per area**: use a stack card (or a nested [Layout Card](../layout-card/)) to group several.
- **`grid-gap` is grid-wide**: CSS grid has no per-cell gap.
- **Per-card visibility** uses HA's native [Visibility](#conditional-cards), not a `view_layout.show` key.

## Compatibility with grid-layout

The `layout` and `view_layout` schemas match lovelace-layout-card's grid view (`custom:grid-layout`), so configs move between the two by changing only the `type`. Two differences to know:

- **`layout.areas` is LCARdS-only.** The per-area surfaces (background, border, etc.) are an LCARdS extension. Moving a config to `custom:grid-layout` keeps everything else working; the area surfaces just aren't drawn there. Pasting a `grid-layout` config *into* LCARdS works fully.
- **`view_layout.show` is not supported.** Per-card conditions use HA's native [Visibility](#conditional-cards) instead. A pasted config using `show` will ignore that key; move the condition to the card's Visibility tab.

Everything else (grid templates, gaps, sizing/spacing, `mediaquery`, and `view_layout` placement) behaves the same in both.
