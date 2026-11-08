---
description: "Layout view: a dashboard view that is one CSS grid, built and edited in place on the dashboard, compatible with lovelace-layout-card's grid-layout."
---

# Layout View

`custom:lcards-layout-view`

<video class="doc-video" src="/img/cards/layout-editing.webm" poster="/img/cards/layout-editing.webp" title="Editing a layout view: the dashboard, then Layout mode with coloured areas and track bands, then Card mode, then back to the dashboard" autoplay loop muted playsinline></video>

**The layout view is a dashboard view type that lays the whole view out as one CSS grid, which you build and edit in place on the dashboard.** Drag track sizes, draw named areas and drop cards into them, the way Home Assistant's sections view works, for LCARS layouts where every panel has its place.

- It reads the same `layout` and `view_layout` keys as lovelace-layout-card's `custom:grid-layout`, so a `grid-layout` view usually moves over by changing only its `type`; see [Compatibility with grid-layout](#compatibility-with-grid-layout).
- The live examples on this page draw the view's grid with the [Layout Card](/cards/layout-card/), which shares its layout code, in a box 320 px tall. On a dashboard the view fills the screen below the header.

::: tip Try it
Add a blank layout view (below), open the dashboard's edit mode and build the grid in place: no YAML needed.
:::

## Quick Start

**A layout view is one entry under `views:` in the dashboard's raw configuration (Edit dashboard, then Raw configuration editor).** The examples on this page show that one entry; it goes in the `views:` list with a dash in front.

- With no `layout` the view is a blank 3 by 3 grid: open edit mode and build it there.
- With `layout`, name the areas in `grid-template-areas` and place each card in one with `view_layout.grid-area`.

```yaml live
# A header, a sidebar and a content area
type: custom:lcards-layout-view
title: Bridge
layout:
  grid-template-columns: 160px 1fr
  grid-template-rows: 60px 1fr
  grid-template-areas: |
    "header header"
    "sidebar content"
  grid-gap: 8px
cards:
  - type: custom:lcards-elbow
    elbow:
      type: header-left
      segment:
        color: var(--lcards-orange)
    view_layout:
      grid-area: header
  - type: custom:lcards-button
    preset: lozenge
    text:
      name:
        content: SIDEBAR
        show: true
    view_layout:
      grid-area: sidebar
  - type: custom:lcards-button
    preset: outline
    text:
      name:
        content: CONTENT
        show: true
    view_layout:
      grid-area: content
```

```yaml
# A blank view: build it in edit mode
views:
  - title: New Layout
    type: custom:lcards-layout-view
```

## Editing in the dashboard

**In the dashboard's edit mode a toolbar above the grid switches between Layout mode (the grid) and Card mode (the cards in it).** The toolbar sits in its own space, so it never covers your cards.

- While editing, cards don't run their tap actions: a click selects or edits a card. Home Assistant's **Undo** button in the dashboard toolbar undoes every change.
- The ⓘ button at the right end of the toolbar shows tips for the current mode.

### Layout mode (the grid)

**Layout mode shapes the grid itself: tracks, areas and their settings.** Column and row headers sit in a gutter above and left of the grid, showing each track's size, and each area is drawn as a coloured outline with its name, so the real cards stay visible.

- Settings open in a side panel on the right (a sheet at the bottom on a phone); the grid narrows while it is open, so the panel never covers a card.
- Drag the line between two columns or rows to resize them, and drag a header to reorder. Click a header for its size presets (`1fr`, `auto`, `200px`, `50%`, ...), **Insert left/right** (or above/below) and **Delete**.
- Click an empty cell (or drag across empty cells) to create an area, and click an area to select it: drag its edge grips to resize it or its name to move it. Red cells mean another area is in the way.

::: details More about Layout mode
- **Add tracks:** the toolbar's *Column* and *Row* buttons add one at the end; **Insert** in a track's settings adds one next to it.
- **Area menu:** each area's ⋮ button has **Rename**, **Add card**, **Area settings** (its [per-area settings](#per-area-settings)) and **Delete area**.
- **Grid settings:** the toolbar's *tune* button sets `grid-gap`, `height`, `card_margin` and `padding`.
- **Area tint:** the toolbar slider sets how strongly areas are coloured: raise it when an area's colour is close to its cards, lower it to see the cards and backgrounds as they are. It starts at 60% and is kept per browser.
:::

### Card mode

**Card mode places and edits the cards inside the areas, with the same controls as Home Assistant's own views.** Hover or tap a card and click it to open Home Assistant's card editor.

- Every empty area shows an **Add card** tile that opens Home Assistant's card picker; the new card goes in that area.
- Each card's ⋮ button has **Edit**, **Placement & spacing** ([per-card placement](#per-card-placement) in the side panel) and **Delete**; Home Assistant's *Undo* toast can bring a deleted card back.
- When several cards share an area (a frame elbow behind an MSD, say), the area shows a picker with one button per card: pick one to bring its controls to the front.

::: details More about cards in one area
- **Layered, not listed:** cards in the same area are drawn on top of each other, which suits a frame elbow behind another card. To lay cards out one after another in an area, put a `vertical-stack` or `horizontal-stack` card there, or a nested [Layout Card](/cards/layout-card/).
:::

## Layout properties

**`layout` holds the grid itself, in CSS Grid's own property names: the column and row tracks, the named areas and the gap between cells.** Set only what you need; a view with no `layout` is 3 by 3.

- `grid-template-areas` names the cells: one quoted string per row, one name per column, and `.` for a cell with no area. A name repeated across neighbouring cells makes one larger area.
- Track sizes take any CSS value: `1fr` shares the free space, `auto` fits the content, and px, % and `vh` are fixed.
- A button, elbow or slider placed straight in a cell of a fixed height (px or `vh` rows, or `fr` rows in a grid with a height) fills that cell even when it is shorter than the button's usual 56 px; in an `auto` row it keeps that minimum so it stays visible.

```yaml live
# Three columns, the middle one twice as wide; a button-high top row
type: custom:lcards-layout-view
layout:
  grid-template-columns: 1fr 2fr 1fr
  grid-template-rows: 56px 1fr
  grid-template-areas: |
    "bar bar bar"
    "left middle right"
  grid-gap: 6px
  padding: 4px
cards:
  - type: custom:lcards-button
    preset: lozenge
    text:
      name:
        content: OPERATIONS
        show: true
    view_layout:
      grid-area: bar
  - type: custom:lcards-button
    preset: outline
    view_layout:
      grid-area: left
  - type: custom:lcards-button
    preset: outline
    view_layout:
      grid-area: middle
  - type: custom:lcards-button
    preset: outline
    view_layout:
      grid-area: right
```

::: details More about layout
- **Grid-wide gap:** `grid-gap` is the same between every pair of cells; CSS grid has no gap per cell. Use a card's `view_layout.margin` or an area's `margin` to space one card.
- **Passed through:** `place-items`, `place-content`, `grid-auto-flow`, `grid-auto-columns` and `grid-auto-rows` go to the grid as they are.
- **Height:** with a `height` other than `auto` the grid scrolls when its content is taller.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `layout.grid-template-columns` | string | `1fr 1fr 1fr` | Column track sizes, such as `160px 1fr 1fr` |
| `layout.grid-template-rows` | string | `1fr 1fr 1fr` | Row track sizes |
| `layout.grid-template-areas` | string | - | Area names: one quoted string per row |
| `layout.grid-gap` | string | `5px` | Gap between cells; `gap` is read too |
| `layout.height` | string | `calc(100dvh - var(--header-height, 56px))` | The grid's height: the screen below the header |
| `layout.margin` | string | - | Space outside the grid |
| `layout.padding` | string | - | Space inside the grid, round the cells |
| `layout.card_margin` | string | - | Space round every card in its cell |
| `layout.card_overflow` | string | `visible` | Overflow for every card: `visible`, `hidden` or `auto` |
| `layout.place-items` | string | - | Passed to the grid as it is; so is `place-content` |
| `layout.grid-auto-flow` | string | - | Passed to the grid as it is; so are `grid-auto-columns` and `grid-auto-rows` |
| `layout.mediaquery` | object | - | Grid changes for a screen size; see [below](#responsive-layouts-mediaquery) |
| `layout.areas` | object | - | Settings per area; see [Per-area settings](#per-area-settings) |

### Responsive layouts (mediaquery)

**`mediaquery` changes the grid for a screen size: a different set of columns, rows, areas or gap while a CSS media query matches.** Use it to stack the areas in one column on a phone.

- Each key is a media query (`"(max-width: 768px)"`) and its value the grid keys to use while it matches. When several match, the later ones win.
- Cards keep their `grid-area`, so name the same areas in every arrangement.

```yaml live
# Side by side on a wide screen, stacked below 768 px (narrow your window to see it)
type: custom:lcards-layout-view
layout:
  grid-template-columns: 1fr 1fr
  grid-template-rows: 1fr
  grid-template-areas: |
    "first second"
  grid-gap: 6px
  mediaquery:
    "(max-width: 768px)":
      grid-template-columns: 1fr
      grid-template-rows: 1fr 1fr
      grid-template-areas: |
        "first"
        "second"
cards:
  - type: custom:lcards-button
    preset: outline
    text:
      name:
        content: FIRST
        show: true
    view_layout:
      grid-area: first
  - type: custom:lcards-button
    preset: outline
    text:
      name:
        content: SECOND
        show: true
    view_layout:
      grid-area: second
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `layout.mediaquery.<query>` | object | - | While the query matches: `grid-template-columns`, `grid-template-rows`, `grid-template-areas` and `grid-gap` to use instead |

## Placing cards (view_layout)

**Each card's `view_layout` says where it goes in the grid: usually the name of an area, or grid lines for a card that spans cells without one.** A card with no `view_layout` takes the next free cell.

- `grid-area` is the usual way; `grid-column` and `grid-row` place a card by line numbers instead (`1 / 3` spans the first two columns).

```yaml live
# By area, and by grid lines
type: custom:lcards-layout-view
layout:
  grid-template-columns: 1fr 1fr 1fr
  grid-template-rows: 1fr 1fr
  grid-template-areas: |
    "top top top"
    ". . ."
cards:
  - type: custom:lcards-button
    preset: outline
    text:
      name:
        content: AREA TOP
        show: true
    view_layout:
      grid-area: top
  - type: custom:lcards-button
    preset: outline
    text:
      name:
        content: LINES 2 TO 4
        show: true
    view_layout:
      grid-column: 2 / 4
      grid-row: "2"
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `view_layout.grid-area` | string | - | The area to place the card in |
| `view_layout.grid-column` | string | - | Column lines instead of an area, such as `1 / 3` |
| `view_layout.grid-row` | string | - | Row lines instead of an area |

### Per-card placement

**`place-self`, `margin`, `overflow` and `z-index` set how one card sits in its cell.** Card mode's **Placement & spacing** panel writes them.

- By default a card stretches to fill its cell; `place-self: center` keeps its own size in the middle instead (a card needs a size of its own for that, such as a `height` and `width`).

```yaml live
# A smaller card centred in its area, with a margin round another
type: custom:lcards-layout-view
layout:
  grid-template-columns: 1fr 1fr
  grid-template-rows: 1fr
  grid-template-areas: |
    "left right"
cards:
  - type: custom:lcards-button
    preset: lozenge
    width: 160
    height: 56
    text:
      name:
        content: CENTRED
        show: true
    view_layout:
      grid-area: left
      place-self: center
  - type: custom:lcards-button
    preset: outline
    text:
      name:
        content: MARGIN
        show: true
    view_layout:
      grid-area: right
      margin: 24px
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `view_layout.place-self` | string | `stretch` | `stretch`, `start`, `center` or `end`, both ways; `align-self` and `justify-self` set one way |
| `view_layout.margin` | string | the area's, else `card_margin` | Space round the card in its cell |
| `view_layout.overflow` | string | the area's, else `card_overflow` | `visible`, `hidden` or `auto` (scroll) |
| `view_layout.z-index` | number | - | Stacking order where cards overlap |

### Conditional cards

**Use Home Assistant's own card visibility to show a card only sometimes: open the card's editor and its Visibility tab.** It has screen size presets (mobile, tablet, desktop) and state, user, numeric, time, `and` and `or` conditions, and follows them live.

- The layout view has no `view_layout.show` key: a pasted `grid-layout` config that uses it ignores it, so move the condition to the Visibility tab. To change the grid itself by screen size, use [`mediaquery`](#responsive-layouts-mediaquery).

### Visibility-driven row sizing

**When a card with a Visibility condition is hidden, the row it fills collapses to 0 and the other rows take the space; it comes back when the card shows again.** Use it for a banner or bar that appears only sometimes.

- The card needs a definite height to size its row to: a [Layout Card](/cards/layout-card/) with a `layout.height` such as `10vh` or `120px` (not a percentage or `auto`).
- The row collapses only when every card in it that has a Visibility condition is hidden; cards without a condition don't hold it open, so give such a row one card.
- In edit mode every row shows, as Home Assistant shows every card while editing.

The example is plain YAML: Home Assistant decides visibility, and the docs have no dashboard to do it.

```yaml
# Part of a view's cards: the top-bar row collapses while the helper is off
cards:
  - type: custom:lcards-layout-card
    layout:
      height: 10vh
      grid-template-areas: |
        "left banner"
      grid-template-columns: auto 1fr
    view_layout:
      grid-area: top-bar
    visibility:
      - condition: state
        entity_id: input_boolean.show_top_bar
        state: "on"
```

::: details More about row sizing
- **Any condition:** every Visibility condition type works (`state`, `numeric_state`, `screen`, `user`, `template`, `and`, `or`, `not`): the view follows whether Home Assistant hid the card rather than checking the condition itself. The older `entity:` key in a state condition works too.
- **Resizing:** rows are worked out again whenever the view changes size (the sidebar opens, the window is resized).
:::

## Per-area settings

**`layout.areas` styles an area itself, whatever card is in it: a background, a border, and default spacing for its card.** An empty area still shows its background, so it can be an LCARS panel on its own, and the styling stays when you swap the card.

- Settings are per area name; the keys are CSS property names.
- A card's own `view_layout` wins over its area's settings, which win over the grid-wide `card_margin` and `card_overflow`.
- The area's backing sits behind the card and takes no taps. For LCARS chrome you can tap (elbows, buttons, frames), place an `lcards-elbow` or `lcards-button` card in the area instead.

```yaml live
# A coloured header panel, a bordered sidebar with an inset card, an empty gradient panel
type: custom:lcards-layout-view
layout:
  grid-template-columns: 160px 1fr
  grid-template-rows: 48px 1fr
  grid-template-areas: |
    "header header"
    "sidebar content"
  grid-gap: 8px
  areas:
    header:
      background: var(--lcards-orange)
      border-radius: var(--ha-border-radius-lg)
    sidebar:
      border-width: 2px
      border-style: solid
      border-color: theme:colors.ui.secondary
      margin: 8px
    content:
      background-image: linear-gradient(135deg, var(--lcards-blue-darkest), transparent)
cards:
  - type: custom:lcards-button
    preset: lozenge
    text:
      name:
        content: INSET
        show: true
    view_layout:
      grid-area: sidebar
```

::: details More about area settings
- **Portable:** `layout.areas` is an LCARdS addition. `custom:grid-layout` ignores it, so a config still works there, just without the area surfaces.
- **Images:** a `background-image` can be a `url(/local/...)` image of your own as well as a gradient.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `layout.areas.<area>.background` | string | - | Colour, `var(...)`, gradient or `theme:` token |
| `layout.areas.<area>.background-image` | string | - | `url(...)` or a CSS gradient |
| `layout.areas.<area>.background-size` | string | `cover` | `cover`, `contain`, `100% 100%` (stretch) or `auto` |
| `layout.areas.<area>.background-position` | string | `center` | `center`, `top`, `bottom`, `left` or `right` |
| `layout.areas.<area>.background-repeat` | string | `no-repeat` | `no-repeat`, `repeat`, `repeat-x` or `repeat-y` |
| `layout.areas.<area>.border-width` | string | - | Border round the area, such as `2px` |
| `layout.areas.<area>.border-style` | string | - | `solid`, `dashed` and the other CSS border styles |
| `layout.areas.<area>.border-color` | string | - | Border colour; takes `theme:` tokens |
| `layout.areas.<area>.border-radius` | string | - | Corner rounding |
| `layout.areas.<area>.place-self` | string | - | Default placement for the area's card |
| `layout.areas.<area>.margin` | string | - | Default space round the area's card |
| `layout.areas.<area>.overflow` | string | - | Default overflow for the area's card |
| `layout.areas.<area>.z-index` | number | - | Stacking order of the area's backing |

## Layout Card

**The [Layout Card](/cards/layout-card/) (`custom:lcards-layout-card`) is the card version of the layout view: the same `layout`, `view_layout` and `areas`, in one card.** Use it for a grid inside one area of a layout view, or for a grid panel on any dashboard.

## Notes & limitations

**A few things the grid can't do, and what to use instead.**

- One card per area is the usual layout: use a stack card (or a nested Layout Card) to group several in one area.
- `grid-gap` is grid-wide: CSS grid has no gap per cell.
- Per-card conditions use Home Assistant's [Visibility](#conditional-cards), not a `view_layout.show` key.

## Compatibility with grid-layout

**The `layout` and `view_layout` keys are the same as lovelace-layout-card's grid view (`custom:grid-layout`), so a config moves between the two by changing only its `type`.** Grid templates, gaps, sizes, spacing, `mediaquery` and `view_layout` placement behave the same in both.

- `layout.areas` is LCARdS only: in `custom:grid-layout` everything else works and the area surfaces are not drawn. A `grid-layout` config pasted into LCARdS works fully.
- `view_layout.show` is not supported: per-card conditions use Home Assistant's [Visibility](#conditional-cards) instead, and a pasted config ignores the key.
