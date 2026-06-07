# Layout View

`custom:lcards-layout-view`

A custom dashboard **view type** with a built-in, in-view WYSIWYG CSS Grid editor — build a grid layout visually (drag to resize tracks, draw areas, drop cards into them) right on the dashboard, the way HA Sections works.

It reuses the [`custom:grid-layout`](https://github.com/thomasloven/lovelace-layout-card) (lovelace-layout-card) schema, so an existing `grid-layout` view usually moves over by changing only `type: custom:grid-layout` → `type: custom:lcards-layout-view`. A couple of differences apply — see [Compatibility with grid-layout](#compatibility-with-grid-layout).

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
    type: custom:lcards-layout-view   # blank 3×3 grid — enter edit mode to build
```

---

## Editing in the dashboard

Enter HA **edit mode** (top-right pencil) and a floating toolbar appears with two sub-modes:

### Layout mode (the grid)

Build and shape the grid itself:

- **Resize tracks** — drag the handle between two columns/rows.
- **Set a track size** — click a column/row header to open a size popover (presets like `1fr`, `auto`, `200px`, `50%`, or a custom value).
- **Add / insert tracks** — *Col* / *Row* buttons on the toolbar, or the `+` on a resize divider to insert in the middle.
- **Reorder tracks** — drag a column/row header.
- **Delete a track** — the `×` on its header (asks for confirmation).
- **Create an area** — drag across empty cells, or click the `+` in a single empty cell, then name it.
- **Rename / delete an area** — select the area, then use its toolbar.
- **Area settings** — the *tune* button on a selected area opens the [per-area panel](#per-area-settings) (background, border, spacing…).
- **Grid settings** — the *tune* button on the toolbar sets `grid-gap`, `height`, `card_margin`, `padding`.
- **Areas / Cells toggle** — the toolbar pill hides the coloured area overlays so you can preview the real cell/area backgrounds while configuring them.

### Card mode

Place and manage cards inside areas:

- **Add a card** — every empty area shows an **Add card** tile that opens HA's card picker; the new card is placed in that area automatically.
- **Edit / remove a card** — hover a card for its edit (✎) and remove (🗑) handles.
- **Placement & spacing** — the *tune* (✎-style) handle on a card opens a [per-card placement panel](#per-card-placement) (alignment, margin, overflow).

> One card per area. To place several cards in one area, put a `vertical-stack` (or `horizontal-stack`) card there.

---

## Layout properties

All keys live under `layout:` and use standard CSS Grid property names.

| Key | Description | Default |
|-----|-------------|---------|
| `grid-template-columns` | Column track sizes, e.g. `"160px 1fr 1fr"` | `1fr 1fr 1fr` |
| `grid-template-rows` | Row track sizes | `1fr 1fr 1fr` |
| `grid-template-areas` | Named area map (one quoted string per row) | — |
| `grid-gap` | Gap between cells, e.g. `"8px"` | `5px` |
| `height` | View height | `calc(100dvh - var(--header-height, 56px))` |
| `margin` | Outer margin of the grid container | — |
| `padding` | Inner padding of the grid container | — |
| `card_margin` | Default margin around every card | — |
| `card_overflow` | Default overflow for every card | `visible` |
| `place-items` / `place-content` | Grid alignment passthrough | — |
| `grid-auto-flow` / `grid-auto-columns` / `grid-auto-rows` | Grid auto-placement passthrough | — |
| `mediaquery` | Responsive overrides (see below) | — |
| `areas` | Per-area settings map (see [below](#per-area-settings)) | — |

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
| `place-self` / `align-self` / `justify-self` | How the card sits in its cell — `stretch` (default), `start`, `center`, `end` |
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
      place-self: center   # don't stretch — center in the cell
      margin: "0"
      overflow: hidden
```

### Conditional cards

Use Home Assistant's **native card Visibility** for per-card conditions — open the card's editor and switch to the **Visibility** tab. It supports screen-size presets (mobile / tablet / desktop), plus state, user, numeric, time, and `and`/`or` conditions, and updates live as conditions change.

> The layout view does not implement its own per-card `show` option. A pasted `custom:grid-layout` config that uses `view_layout.show` will simply ignore that key — move the condition to the card's Visibility tab. (To vary the *grid itself* by screen size, use [`mediaquery`](#responsive-layouts-mediaquery) at the layout level.)

---

## Per-area settings

`layout.areas` styles an **area itself**, independent of any card in it — so an empty area can still show a background or border (LCARS panels), and the styling survives swapping the card out. This is an LCARdS extension (ignored by `custom:grid-layout`, so configs stay portable).

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

> The area backing is non-interactive and sits *behind* the card. For interactive LCARS chrome (elbows, buttons, frames) place an `lcards-elbow` / `lcards-button` card in the area instead — `areas` is only for simple surface decoration.

---

## Layout Card

`custom:lcards-layout-card`

The **card** version of the layout view — a grid container you place *inside* a card slot, most often a single area of a layout view, to build a **sub-grid**. It uses the same `layout` + `view_layout` + `areas` schema as the view.

```yaml
# A layout view whose "controls" area holds a 2×2 sub-grid of buttons
type: custom:lcards-layout-view
layout:
  grid-template-areas: |
    "header"
    "controls"
cards:
  - type: custom:lcards-elbow
    view_layout: { grid-area: header }
  - type: custom:lcards-layout-card        # ← sub-grid in the "controls" area
    view_layout: { grid-area: controls }
    layout:
      grid-template-columns: "1fr 1fr"
      grid-template-rows: "1fr 1fr"
      grid-gap: "6px"
    cards:
      - type: custom:lcards-button
      - type: custom:lcards-button
      - type: custom:lcards-button
      - type: custom:lcards-button
```

### Editing
Unlike the view, the layout card is edited in its card editor (not on the dashboard). Opening it shows an **Open Layout Studio** button that launches a full-screen workspace:

- a large **canvas** with the same grid overlay — size tracks, draw/rename/delete areas, and style area backgrounds/borders;
- a **Layout** tab for global settings (gap, height, card margin, padding);
- a **tab per card** with an inline HA card editor and placement controls (area, align, margin, overflow), plus **Add card** / **Remove**.

Changes save through the normal card-config flow.

> **Card picker:** the first time you use **Add card** in a session, Home Assistant may not have loaded its card picker yet. If you see a "Card picker not ready" message, click **Add card** once on any dashboard view (you can cancel it) to load it, then come back — this is a Home Assistant limitation shared by other cards' editors.

### Notes
- **Height:** defaults to `100%`, so it fills the area it's placed in. For standalone use (e.g. a masonry view) set `layout.height` explicitly, otherwise `fr` rows have no height to divide.
- Child cards are built through HA's `hui-card`, so their native **Visibility** conditions work just like in the view.
- Layout cards can be nested for deeper sub-grids.

## Notes & limitations

- **One card per area** — use a stack card (or a nested [Layout Card](#layout-card)) to group several.
- **`grid-gap` is grid-wide** — CSS grid has no per-cell gap.
- **Per-card visibility** uses HA's native [Visibility](#conditional-cards), not a `view_layout.show` key.

## Compatibility with grid-layout

The `layout` and `view_layout` schemas match lovelace-layout-card's grid view (`custom:grid-layout`), so configs move between the two by changing only the `type`. Two differences to know:

- **`layout.areas` is LCARdS-only.** The per-area surfaces (background, border, etc.) are an LCARdS extension. Moving a config to `custom:grid-layout` keeps everything else working — the area surfaces just aren't drawn there. Pasting a `grid-layout` config *into* LCARdS works fully.
- **`view_layout.show` is not supported.** Per-card conditions use HA's native [Visibility](#conditional-cards) instead. A pasted config using `show` will ignore that key; move the condition to the card's Visibility tab.

Everything else — grid templates, gaps, sizing/spacing, `mediaquery`, and `view_layout` placement — behaves the same in both.
