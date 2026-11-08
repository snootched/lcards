---
description: "Background animations: stacking several effects into one background, the zoom wrapper that turns any effect into layers zooming outward, and example backgrounds."
---

# Stacking and Zoom

Several effects in one background, and the zoom wrapper that gives any effect a sense of depth. The keys of one entry are on the [Background Animations](/core/effects/background-animations#effect-options) page.

## Effect stacking

**List several effects to layer them: the first entry is drawn at the bottom, the last on top.** Each entry has its own preset, `config` and optional `zoom`.

- Give the upper layers see-through colours (`alpha()`, or rgba with an alpha below 1), or they cover the layers under them.
- Two or three layers are usually enough; each one adds drawing work on every frame.

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: TACTICAL
    show: true
grid_options:
  rows: 4
background_animation:
  # bottom: a fast diagonal hatch
  - preset: grid-diagonal
    config:
      line_spacing: 80
      color: alpha(var(--lcars-orange), 0.2)
      scroll_speed_x: 50
  # middle: a slow grid
  - preset: grid
    config:
      line_spacing: 40
      color: alpha(var(--lcars-orange), 0.25)
      scroll_speed_x: 10
      scroll_speed_y: 10
  # top: zooming hexagons
  - preset: grid-hexagonal
    config:
      hex_radius: 30
      color: alpha(var(--lcars-ice), 0.35)
    zoom:
      layers: 4
      duration: 18
```

::: details More about stacking
- **Changed in 2026.10:** earlier versions drew the stack upside down (the last entry at the bottom). If you tuned a stacked background to that order, reverse the list.
- **Lining up:** stacked grids line up best with the same `line_spacing`, or multiples of it.
- **Zoom and scrolling:** a zoomed layer usually looks best with its scroll speeds at `0`, so the zoom is the only motion.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `background_animation` | list | - | The effects, bottom layer first. Each entry: see [Effect options](/core/effects/background-animations#effect-options) |

## Zoom wrapper

**`zoom` draws an effect as several copies that grow from the centre and fade, like flying through it.** It works on any preset, a grid or a nebula as well as a starfield.

- The copies (`layers`) are spread evenly through the cycle, so one is always fading in as another fades out.
- Each copy grows from `scale_from` to `scale_to` over `duration` seconds. It fades in over the first `opacity_fade_in` percent of that time and fades out from `opacity_fade_out` percent to the end.
- An empty `zoom:` object turns it on with every default.
- For real depth rather than scaled copies, use the grid's [floor view](./preset-reference#grid-views-and-camera), its [surfaces](./preset-reference#grid-surfaces), or [`warp-starfield`](./preset-reference#warp-starfield).

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: ZOOM
    show: true
grid_options:
  rows: 4
background_animation:
  - preset: grid
    config:
      line_spacing: 50
      color: alpha(var(--lcars-ice), 0.5)
    zoom:
      layers: 5
      scale_from: 0.5
      scale_to: 2
      duration: 15
      opacity_fade_in: 15
      opacity_fade_out: 75
```

::: details More about the zoom wrapper
- **Starfields:** a zoomed `starfield` gets a separate star layout for each layer, so the copies don't show the same stars.
- **WebGL presets:** the effect is drawn once per frame and the layers are scaled copies of that frame.
- **Speed:** `speed` also runs the zoom cycle faster (a warp effect), whether it is fixed in `config`, bound to an entity or animated.
- **How many layers:** three or four layers look smooth; more cost more drawing per frame.
:::

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `zoom` | object | - | Turns the zoom on for this entry |
| `zoom.layers` | number | `4` | Copies of the effect zooming at once, at least `1` |
| `zoom.scale_from` | number | `0.5` | Scale a copy starts at; `1` is the effect's normal size |
| `zoom.scale_to` | number | `2` | Scale a copy reaches at the end of the cycle |
| `zoom.duration` | number | `15` | Seconds for one copy to grow from `scale_from` to `scale_to` |
| `zoom.opacity_fade_in` | number | `15` | Percent of the cycle over which a copy fades in (0 to 100) |
| `zoom.opacity_fade_out` | number | `75` | Percent of the cycle at which a copy starts to fade out (0 to 100) |

## Examples

**Backgrounds to copy and adapt.** Each is a single card; the keys are on the [Preset Reference](./preset-reference).

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: LCARS GRID
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: grid
    config:
      line_spacing: 50
      color: alpha(var(--lcars-orange), 0.3)
      scroll_speed_x: 15
      scroll_speed_y: 15
```

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: HONEYCOMB
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: grid-hexagonal
    config:
      hex_radius: 35
      color: alpha(var(--lcars-ice), 0.4)
    zoom:
      layers: 5
      scale_from: 0.5
      scale_to: 2
      duration: 15
```

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: DIAGONAL STRIPES
    show: true
grid_options:
  rows: 3
background_animation:
  - preset: grid-diagonal
    config:
      line_spacing: 60
      line_width: 2
      color: alpha(var(--lcars-orange), 0.5)
      scroll_speed_x: 40
```

```yaml live
type: custom:lcards-button
preset: outline
text:
  name:
    content: LAYERED
    show: true
grid_options:
  rows: 4
background_animation:
  # base: a grid with a faint fill
  - preset: grid
    config:
      line_spacing: 80
      color: alpha(var(--lcars-orange), 0.3)
      fill_color: alpha(var(--lcars-orange), 0.05)
      scroll_speed_x: 10
      scroll_speed_y: 10
  # middle: diagonal lines
  - preset: grid-diagonal
    config:
      line_spacing: 100
      color: alpha(var(--lcars-orange), 0.2)
      scroll_speed_x: 30
  # top: zooming hexagons
  - preset: grid-hexagonal
    config:
      hex_radius: 40
      color: alpha(var(--lcars-ice), 0.25)
    zoom:
      layers: 4
      duration: 20
```
