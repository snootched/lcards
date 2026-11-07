---
description: "Slider card: interactive sliders and read-only gauges for lights, covers, fans, climate, media players and sensors, as pill bars, ruler gauges, shaped fills and ring gauges."
moved_anchors:
  common-properties: /cards/common
  config-structure: /cards/slider-card/#card-options
  control-options: /cards/slider-card/control#control-options
  automatic-domain-behaviour: /cards/slider-card/control#automatic-domain-behaviour
  value-tween: /cards/slider-card/control#value-tween
  drag-value-badge: /cards/slider-card/control#drag-value-badge
  style-object: /cards/slider-card/styles
  style-track: /cards/slider-card/styles#style-track
  style-gauge: /cards/slider-card/styles#style-gauge
  style-border: /cards/slider-card/styles#style-border
  text-labels: /cards/slider-card/styles#text-labels
  annotated-example: /cards/slider-card/styles#putting-it-together
  ranges: /cards/slider-card/ranges
  range-band-fields: /cards/slider-card/ranges#range-band-fields
  value-marker-fields: /cards/slider-card/ranges#value-marker-fields
  label-fields: /cards/slider-card/ranges#label-fields
  ring-gauge: /cards/slider-card/components#ring-gauge
  scale: /cards/slider-card/components#scale
  value-markers: /cards/slider-card/components#value-markers
  centre-text: /cards/slider-card/components#centre-text
  shaped-component: /cards/slider-card/components#shaped-component
  picard-component: /cards/slider-card/components#picard-component
---

# Slider Card

`custom:lcards-slider`

**A slider you drag to set a light, cover, fan, thermostat or volume, or a read-only gauge for a sensor.** It comes in four looks: pill bars, ruler gauges, shaped fills and ring gauges.

- Most sliders need only `entity` and `preset`. The card works out from the entity what to control and over what range.
- The ring, shaped and Picard looks are taller than a pill bar, so in a sections view give them more rows with `grid_options.rows`.

::: tip Try it
- The card editor's tabs cover the options on these pages, with a live preview.
- The [Playground](./playground) lets you edit slider YAML here in the docs and see the result.
:::

| Page | Covers |
|------|--------|
| [Pills and Gauges](./styles) | The pill bar and ruler gauge: track, ticks, labels, indicator, borders, text |
| [Ring, Shaped and Picard](./components) | The ring gauge, shaped fills and the Picard gauge |
| [Ranges and Markers](./ranges) | Coloured value bands and live markers on the track |
| [Control and Motion](./control) | What it controls, min and max, value easing, the drag badge |
| [Playground](./playground) | Edit YAML and see the slider live |

---

## Quick start

**Two examples to start from: a light you drag, and a sensor shown as a gauge.**

- `style.track.display` sets the scale a gauge shows. What a slider can set is `control.min` and `control.max`, which come from the entity unless you change them ([Control and Motion](./control#control-options)).

```yaml live
type: custom:lcards-slider
entity: light.bedroom
preset: pills-left-border
```

```yaml live
type: custom:lcards-slider
entity: sensor.temperature
preset: gauge-basic
style:
  track:
    display:
      min: -10
      max: 40
      unit: "°C"
```

## Presets

**`preset` picks the look.** Every preset is shown here against a sample light; drag one to set its brightness.

- A preset is a starting point: any `style` key you set overrides it.
- Without a preset, lights, covers, fans, climate and the other draggable domains draw pills, and everything else (sensors) draws a gauge.

<CardGallery set="slider-presets" />

| Preset | Look |
|--------|------|
| `pills-basic` | Segmented pill bar |
| `pills-left-border` | Pill bar with an LCARS cap on the left |
| `pills-left-border-rounded` | Pill bar with a left cap and a rounded right end |
| `gauge-basic` | Ruler gauge: tick marks, labels and a fill bar |
| `gauge-left-border` | Ruler gauge with a left cap |
| `gauge-left-border-rounded` | Ruler gauge with a left cap and a rounded right end |
| `shaped-vertical` | Upright lozenge fill with text above and below ([shaped](./components#shaped-component)) |
| `shaped-horizontal` | Flat lozenge fill with text left and right ([shaped](./components#shaped-component)) |
| `ring` | Three-quarter ring, name above a large value ([ring](./components#ring-gauge)) |
| `picard-ring` | Near-full thick ring with flat ends ([ring](./components#ring-gauge)) |
| `picard-gauge-vertical` | Picard-style upright gauge ([Picard](./components#picard-component)) |

## Card options

**The slider's own top-level keys.** Each block has its own page; this table links to it.

- The slider also takes the keys every LCARdS card takes (`height`, `grid_options`, `id`, `tags`, `tap_action`, `animations`, `sounds`, `data_sources` ...): see [Common card properties](../common).

```yaml live
type: custom:lcards-slider
entity: light.bedroom
preset: gauge-left-border
control:
  min: 10 # never dimmer than 10 %
drag_badge:
  enabled: true
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `entity` | string | - | The entity to show and control. Its domain sets what the slider controls and its range: see [Control and Motion](./control#automatic-domain-behaviour) |
| `preset` | string | pills or gauge, by domain | The look: see [Presets](#presets) |
| `control` | object | by domain | The range, the step, read-only, inverted: see [Control options](./control#control-options) |
| `text` | object | from the preset | Text on the card: the name, the value, your own labels. See [Text labels](./styles#text-labels) |
| `style` | object | from the preset | Overrides for the preset: the [track and gauge](./styles), [ranges](./ranges), [ring, shaped and Picard](./components), [borders](./styles#style-border) |
| `component` | string | from the preset | `shaped`, `ring` or `picard` without a preset that sets it |
| `value_tween` | object | on | Eases the fill and markers to a new value when the entity changes: see [Value tween](./control#value-tween). Off when the device asks for reduced motion |
| `drag_badge` | object | off | A badge with the live value while you drag: see [Drag value badge](./control#drag-value-badge) |
| `ranges_attribute` | string | - | The attribute that [range colours](/core/colours#range-conditions-on-non-numeric-entities-ranges-attribute) compare, for entities whose state is not a number |
| `state_attribute` | string | - | The attribute whose value picks [exact-match colours](/core/colours#exact-match-keys-from-an-attribute-state-attribute) |
