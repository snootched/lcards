---
description: "Button card custom SVG: draw the button from your own SVG markup or file, with every element that has an id a tappable segment with its own entity, colours and actions."
---

# Custom SVG

Your own drawing as a button: inline SVG markup or an SVG file, with parts you can tap.

## svg

**`svg` draws the button from your own SVG, and elements with an `id` become segments with their own entity, colours and actions.** Use it for a floor plan of switches, a ship schematic or any control the presets and components don't cover.

- Configure a segment under `svg.segments.<id>` with the same [segment keys](./components#segment-keys) as a component. With a `default` entry, every element that has an `id` becomes a segment; without one, only the ids you list do.
- The SVG is drawn to fit the card, keeping its proportions (`xMidYMid meet`), from its own `viewBox` (or `0 0 100 100` when it has none).

```yaml live
type: custom:lcards-button
svg:
  content: |
    <svg viewBox="0 0 200 100">
      <rect id="btn-a" x="10" y="10" width="80" height="80" rx="8"/>
      <rect id="btn-b" x="110" y="10" width="80" height="80" rx="8"/>
    </svg>
  segments:
    default:
      style:
        fill:
          active: var(--lcars-orange)
          inactive: var(--lcars-gray)
          hover: var(--lcars-yellow)
    btn-a:
      entity: light.zone_a
      tap_action:
        action: toggle
    btn-b:
      entity: light.zone_b
      tap_action:
        action: toggle
grid_options:
  rows: 2
```

::: details More about svg
- **Tokens in the markup:** `{{entity.state}}` and `{{entity.attributes.<name>}}` are replaced with the card entity's values, `{{entity.state == 'on' ? 'a' : 'b'}}` picks one of two words, and `theme:<token path>` is replaced with the theme's value. `enable_tokens: false` turns this off.
- **Colours in the markup:** CSS variables in an SVG `fill` attribute are not read the same way in every browser. Colours set in a segment's `style` always work, because the card resolves them.
- **Scripts:** `<script>`, `<iframe>`, `<embed>` and `<object>` elements are removed unless `allow_scripts: true`. Event attributes (`onclick` ...) and `javascript:` or `data:` links are always removed.
- **Text:** `<text>` elements in the SVG let taps through to the segment beneath them.
- **Files:** `src` takes a URL, such as a file under `/local/`, or a `data:` URI.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `svg.content` | string | - | Inline SVG markup |
| `svg.src` | string | - | URL of an SVG file, instead of `content` |
| `svg.viewBox` | string | the SVG's own, else `0 0 100 100` | The drawing's coordinate box |
| `svg.preserveAspectRatio` | string | `xMidYMid meet` | How the drawing fits the card |
| `svg.enable_tokens` | boolean | `true` | Replace `{{entity...}}` and `theme:` tokens in the markup |
| `svg.allow_scripts` | boolean | `false` | Keep `<script>` elements in the SVG |
| `svg.segments.default` | object | - | [Segment keys](./components#segment-keys) for every element with an `id` |
| `svg.segments.<id>` | object | - | [Segment keys](./components#segment-keys) for the element with that `id` |
