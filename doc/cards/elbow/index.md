---
description: "Elbow card: the LCARS corner bars, caps, slanted bars and frames that give a dashboard its shape, with text on the bars, actions and an optional embedded card."
moved_anchors:
  common-properties: /cards/common
  config-structure: /cards/elbow/#card-options
  elbow-styles: /cards/elbow/bars#elbow-styles
  simple-default: /cards/elbow/bars#elbow-segment
  segmented-tng-picard-style: /cards/elbow/bars#elbow-segments
  segment-options-simple-style: /cards/elbow/bars#elbow-segment
  arc-radius-modes: /cards/elbow/bars#arc-radius-modes
  segments-options-segmented-style: /cards/elbow/bars#elbow-segments
  outer-segment-and-inner-segment-fields: /cards/elbow/bars#segment-keys
  ha-lcars-theme-binding: /cards/elbow/bars#ha-lcars-theme-binding
  frame-type: /cards/elbow/frame#elbow-frame
  segmented-frame: /cards/elbow/frame#segmented-frame
  text-labels: /cards/elbow/appearance#text-labels
  background-animation-inset: /cards/elbow/appearance#background-animation-inset
  auto-inset-recommended: /cards/elbow/appearance#background-animation-inset
  manual-inset: /cards/elbow/appearance#background-animation-inset
  shape-texture: /cards/elbow/appearance#shape-texture
  symbiont: /cards/elbow/symbiont
  basic-example: /cards/elbow/symbiont#embedding-a-card
  symbiont-options: /cards/elbow/symbiont#embedding-a-card
  size-anchor: /cards/elbow/symbiont#size-and-anchor
  imprint: /cards/elbow/symbiont#imprint
  state-reactive-imprint: /cards/elbow/symbiont#imprint
  border-radius-options: /cards/elbow/symbiont#imprint-border-radius
  custom-style: /cards/elbow/symbiont#custom-style
  using-uix-with-symbiont: /cards/elbow/symbiont#using-uix-with-symbiont
  lazy-loaded-home-assistant-card-types: /cards/elbow/symbiont#embedding-a-card
---

# Elbow Card

`custom:lcards-elbow`

**The L-shaped corner bars, caps and frames that give an LCARS screen its shape.** Put one at each corner of a section, run a bar across the top, or draw a frame round a whole area.

- `elbow.type` picks the shape and `elbow.segment` sizes its bars; every other key is optional.
- The elbow is a [button](../button/) underneath, so it takes the same text labels, actions, rules, animations, sounds and templates.
- The open area inside the bars can hold another card, styled to match: see [Symbiont](./symbiont).

::: tip Try it
- The card editor's tabs cover the options on these pages, with a live preview.
- The [Playground](./playground) lets you edit elbow YAML here in the docs and see the result.
:::

| Page | Covers |
|------|--------|
| [Bars and Curves](./bars) | Simple and segmented styles, bar sizes, corner curves, diagonal cuts, HA-LCARS sizes |
| [Frames](./frame) | `type: frame`: a border of two to four sides, single or double |
| [Colour, Text and Effects](./appearance) | Fill colours, text on the bars, shape textures, background animations |
| [Symbiont](./symbiont) | Another card inside the elbow, styled to match it |
| [Playground](./playground) | Edit YAML and see the elbow live |

---

## Quick start

**A header corner with a label on its top bar.** Change `type` to `footer-left` for the matching corner at the bottom of a section.

- Text without a `zone` goes in the open area; `zone: horizontal_bar` puts it on the bar (see [Text labels](./appearance#text-labels)).

```yaml live
type: custom:lcards-elbow
elbow:
  type: header-left
  segment:
    bar_width: 90
    bar_height: 20
    color: var(--lcars-orange)
text:
  title:
    content: ENGINEERING
    zone: horizontal_bar
    position: right
    color: var(--lcars-black)
```

## Elbow types

**`elbow.type` picks the shape: a corner, a bar with elbows at both ends, a plain bar, a cut corner, a slanted bar or a frame.** Every type is shown here with the same bar sizes.

- The four corners, the four diagonal caps and the frame also come in the [segmented style](./bars#elbow-styles); the other types draw the simple style whatever `style` says.
- An unknown type draws `header-left`.

<CardGallery set="elbow-types" />

| Type | Shape | Styles |
|------|-------|--------|
| `header-left` | Top-left corner: vertical bar on the left, horizontal bar on top | simple, segmented |
| `header-right` | Top-right corner: vertical bar on the right, horizontal bar on top | simple, segmented |
| `footer-left` | Bottom-left corner: vertical bar on the left, horizontal bar at the bottom | simple, segmented |
| `footer-right` | Bottom-right corner: vertical bar on the right, horizontal bar at the bottom | simple, segmented |
| `header-contained` | Horizontal bar on top with mirrored elbows at both ends | simple |
| `footer-contained` | Horizontal bar at the bottom with mirrored elbows at both ends | simple |
| `header-open` | A plain horizontal bar at the top, no vertical arms | simple |
| `footer-open` | A plain horizontal bar at the bottom, no vertical arms | simple |
| `diagonal-cap-left` | Top-left corner with both corners cut straight instead of curved ([diagonal cuts](./bars#diagonal-cuts)) | simple, segmented |
| `diagonal-cap-right` | Top-right corner, cut | simple, segmented |
| `diagonal-cap-footer-left` | Bottom-left corner, cut | simple, segmented |
| `diagonal-cap-footer-right` | Bottom-right corner, cut | simple, segmented |
| `bar-slant-right` | The whole card is one bar with a slanted right end ([diagonal cuts](./bars#diagonal-cuts)) | simple |
| `bar-slant-left` | The same, slanted on the left | simple |
| `bar-parallelogram` | Both ends slanted the same way | simple |
| `frame` | A rectangular border of two to four sides, with its own thickness per side and curves per corner ([Frames](./frame)) | simple, segmented |

## Card options

**The elbow's own top-level keys.** The shape keys live under `elbow`; the blocks after it have their own pages.

- The elbow also takes the keys every LCARdS card takes (`height`, `grid_options`, `id`, `tags`, `animations`, `sounds`, `data_sources` ...): see [Common card properties](../common). In a sections view it asks for 4 columns and 2 rows.

```yaml live
type: custom:lcards-elbow
entity: light.kitchen
elbow:
  type: footer-left
  style: segmented
  segments:
    outer_segment:
      bar_width: 80
      bar_height: 16
      color: var(--lcars-orange)
    inner_segment:
      bar_width: 24
      bar_height: 8
      color: var(--lcars-african-violet)
tap_action:
  action: toggle
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `elbow` | object | a `header-left` elbow | The shape. Without it the card draws a `header-left` elbow with a 120 px side bar and a 20 px top bar |
| `elbow.type` | string | `header-left` | The shape: see [Elbow types](#elbow-types) |
| `elbow.style` | string | `simple` | `simple` (one elbow) or `segmented` (two with a gap): see [Elbow styles](./bars#elbow-styles) |
| `elbow.segment` | object | - | Bar sizes, curves and colour of a simple elbow: see [elbow.segment](./bars#elbow-segment). Its `color` also paints a frame |
| `elbow.segments` | object | - | The two elbows of the segmented style: see [elbow.segments](./bars#elbow-segments) |
| `elbow.frame` | object | - | Sides and corners of `type: frame`: see [Frames](./frame) |
| `entity` | string | - | The entity whose state picks the [fill colour](./appearance#colours) and the actions act on |
| `preset` | string | - | A button style preset to start from (`lozenge`, `pill` ...) |
| `text` | object | - | Text on the bars or in the open area: see [Text labels](./appearance#text-labels) |
| `tap_action` | object | `none` | What a tap does; `hold_action` and `double_tap_action` too. See [Actions](/core/actions) |
| `interactive` | boolean | `true` | `false` turns off the hover and pressed colours; actions still run. See [interactive](/core/actions#interactive) |
| `style.cursor` | string | pointer, or arrow when not interactive | The mouse cursor over the elbow. See [style.cursor](/core/actions#style-cursor) |
| `shape_texture` | object | - | A texture inside the elbow's fill: see [Shape texture](./appearance#shape-texture) |
| `background_animation` | list / object | - | An animated background in the open area: see [Background animation inset](./appearance#background-animation-inset) |
| `filters` | list | - | CSS and SVG filters on the whole elbow: see [Filters](/core/effects/filters) |
| `symbiont` | object | - | Another card inside the elbow: see [Symbiont](./symbiont) |
| `ranges_attribute` | string | - | The attribute that [range colours](/core/colours#range-conditions-on-non-numeric-entities-ranges-attribute) compare, for entities whose state is not a number |
| `state_attribute` | string | - | The attribute whose value picks [exact-match colours](/core/colours#exact-match-keys-from-an-attribute-state-attribute) |
| `state_classification` | object | - | Your own mapping of states to active, inactive and more: see [Custom state classification](/core/colours#custom-state-classification-state-classification) |
