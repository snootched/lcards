---
description: "Astrometrics card scene settings: scene units, bearings and motion, the diagram and realistic looks, stars behind the scene, background animations, label defaults and styles, a header bar, what draws when, and when the 3D view is unavailable."
---

# Scene and Looks

**The settings for the whole scene: its units and motion, how it looks, what is behind it and how its labels are drawn.** What the scene holds is on the [Objects](./objects) and [Points](./points) pages; the camera is on [Camera and Views](./camera).

## Units and motion

**Scene units are yours to pick, and every moving key works in the same units: degrees or scene units per second.**

- Sizes, distances and positions are in scene units: a galaxy disc of radius 100, a planet of radius 10. Line widths, dashes, label sizes and card offsets are in px, so they hold their size at any zoom.
- For real data, name the units with `units` (`km`, `au`, `ly` ...): a solar system in km, a galaxy in light years with Sol inside it in km. The card holds the whole range, from a galaxy down to a station 1.5 km across. See [Scale](./scale).
- Motion is off until you set it. Turning is in degrees per second (`spin`, `camera.auto_rotate`); travel is in its own units per second (`dash.speed` in px, a fill's `speed` and a nebula's or noise's `drift` in scene units); repeating cycles are a `period` in seconds (`scan.period`, a deformation's `period`). Fly-to times are in ms, as everywhere in LCARdS.
- `time_scale` runs all that motion slower or faster. The sky, the [scene clock](./scale#the-scene-clock) and the camera are not affected.

```yaml live
type: custom:lcards-astrometrics-card
height: 280
# everything turns at half the speed it is set to
time_scale: 0.5
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 25
      distance: 130
objects:
  # 20 degrees a second, so 10 at this time scale
  - type: sphere
    radius: 25
    spin: 20
    line_spacing_deg: 15
    color: var(--lcars-blue)
  - type: ring
    radius: 40
    spin: -30
    dash: [6, 8]
    color: var(--lcars-orange)
```

::: details More about motion
- **Bearings** are degrees clockwise from north (north is away from the default camera), as on a compass seen from above.
- **On screen:** the time slider under the [camera buttons](./camera#camera-buttons) changes the speed without changing the config. A new `time_scale` in the config wins over it.
- **Reduced motion:** spins, scans, drift and moving dashes stop whatever `time_scale` is ([Performance and motion](#performance-and-motion)).
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `units` | string | - | What one scene unit is: `m`, `km`, `au`, `ly` or `pc`. Optional. See [Scale: units](./scale#units) |
| `time_scale` | number | `1` | Speed of the scene's motion (orbits, spins, drift, scans, trails): `0.5` half speed, `2` twice as fast, `0` holds it. Can [follow an entity](./data#settings-from-entities) |

## Looks: diagram and realistic

**One scene can be an LCARS diagram, a realistic view, or both.** Give an object or point `look: diagram` or `look: realistic`, and the card's `look` picks what shows.

- `diagram` shows what has `look: diagram`, `realistic` what has `look: realistic`, and `mixed` (the default) shows both. Anything without a `look` shows in every look, except orbits and routes (below).
- An object without a `look` that has a diagram part and a realistic part switches them by itself: a mapped planet is a wire globe in the diagram look and a photograph in the realistic one, with nothing extra to write. `look: all` keeps an object as configured in every look.
- Orbits and routes (a `ring` drawn as a line, a `path`) are part of the diagram: they show in the diagram and mixed looks and hide in the realistic one.
- Switching crossfades in place, without a rebuild.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
look: mixed
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 20
      distance: 150
points:
  - id: name
    xyz: [0, 38, 0]
    label: MARS
    style: minor
objects:
  # a wire globe in the diagram look, the map in the realistic one
  - type: sphere
    radius: 30
    image: builtin:mars_viking
    spin: 4
    line_spacing_deg: 15
    color: var(--lcars-blue)
  # diagram only
  - type: ring
    radius: 45
    dash: [6, 8]
    look: diagram
```

::: details More about looks
**What each object switches** when it has no `look`:

| Object | Diagram look | Realistic look |
|---|---|---|
| `sphere` with an `image` or a `fill.effect` | Its lines over a plain body (its `fill.color`) | The bare map or painted surface |
| `grid` with a `fill.effect` | Its lines | Its fill |
| `model` with `material: original` | A hologram | Its own materials |
| `glow` | A ring marker with four ticks, facing the camera | The glow |
| `cube` | Its edges and a grid on each face | The Borg cube or shaded box |
| `asteroid` | A wireframe of its rock | The lit rock |
| `belt` | Its inner and outer edges | The rocks |
| `comet` | Its nucleus as a wireframe, a ring round the coma, each tail as a line | Nucleus, coma and tails |
| `galaxy` | Each arm's spiral, the rim, a ring round the bulge and the bar | Stars, glow and dust |
| `crystalline` | Its spine and branches as lines, a ring round the core | The crystal and its core |
| `nebula` with `render: volume` | Its outline: a ball's three rings, a box's edges | The gas (and its lightning) |
| `ring` drawn as a line, `path` | The line | Hidden: orbits and routes are part of the diagram |

- **Mixed:** shows every object as configured. The wireframes (from `glow` down in the table) are drawn in the object's own colours and show in the diagram look only, so `mixed` draws those objects as configured, without the extra wireframe.
- **Rings with a band:** a ring with a `band` image (a planet's rings) is part of the realistic picture and shows in every look.
- **Far away:** an asteroid, belt or crystalline entity is a dot in every look.
- **No realistic form:** for what has none, such as a wormhole's wire funnel and its glowing vortex, give each part its own `look`.
- **From an entity:** `look` can follow an entity whose state (or `attribute`) names the look, in any case. An `input_select` with the options `DIAGRAM`, `REALISTIC` and `MIXED`, shown as a [select menu](../select-menu/) next to the card, makes a quick switch. The docs have no such helper, so this example is not live:

```yaml
look:
  entity: input_select.astro_look
```
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `look` | string / object | `mixed` | `diagram`, `realistic` or `mixed`: which objects and points show. Or the keys below |
| `look.entity` | string | - | An entity whose state names the look |
| `look.attribute` | string | - | Read this attribute instead of the state |
| `look` on an object or point | string | - | `diagram` or `realistic`; on an object also `all` (every look, as configured). See [Keys every object takes](./objects#keys-every-object-takes) |

## Backdrop

**Stars at infinity behind the scene: they turn with the camera and never move when it pans.** `stars: true` uses the defaults.

- Each star gets a random size between `min_radius` and `max_radius` and a random brightness within `brightness`; `seed` picks the same ones every time.
- `opacity` fades the whole layer, so the stars can sit quietly behind a busy scene.
- `backdrop.dust` adds depth dust: particles round the camera that stay put as it moves, so every move shows depth. It and the star streaks of a warp fly-to are on [Effects: warp and dust](./effects#warp-and-dust).

```yaml live
type: custom:lcards-astrometrics-card
height: 260
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 10
      distance: 150
backdrop:
  stars:
    count: 2500
    min_radius: 0.4
    max_radius: 1.4
    brightness: [0.3, 1]
    colors: [var(--lcards-moonlight), var(--lcars-blue)]
    seed: 7
objects:
  - type: glow
    at: [0, 0, 0]
    size: 40
    color: var(--lcars-yellow)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `backdrop.stars` | boolean / object | off | Stars at infinity. `true` for the defaults, or the keys below |
| `backdrop.stars.count` | number | `2000` | How many stars, `0` to `50000` |
| `backdrop.stars.min_radius` | number | `0.4` | Smallest star radius, px |
| `backdrop.stars.max_radius` | number | `1.2` | Largest star radius, px |
| `backdrop.stars.brightness` | `[low, high]` | `[0.35, 1]` | Each star's brightness is picked between these, `0` to `1` |
| `backdrop.stars.color` | colour | `var(--lcards-moonlight)` | Star colour |
| `backdrop.stars.colors` | list | - | Several colours, picked at random per star. Wins over `color` |
| `backdrop.stars.opacity` | number | `1` | Fades the whole layer, `0` to `1` |
| `backdrop.stars.seed` | number | `7` | The same seed places the same stars |
| `backdrop.stars.streak` | number | `1` | How long stars and dust streak in a warp fly-to, times the usual length. `0`: never. See [Effects](./effects#warp-and-dust) |
| `backdrop.stars.spectrum` | boolean / object | off | Streaks split into colour. See [Effects](./effects#warp-and-dust) |
| `backdrop.dust` | boolean / object | off | Depth dust round the camera. See [Effects: warp and dust](./effects#warp-and-dust) |

## background_animation

**A flat background effect behind the scene: a nebula, a warp starfield, a grid.** It takes any [background animation](/core/effects/background-animations), as on the MSD card.

- It does not turn with the camera: it is a picture behind the 3D scene. For clouds in the scene itself, use a [nebula object](./effects#nebula).
- It takes a list, so several effects can be layered behind the scene.

```yaml live
type: custom:lcards-astrometrics-card
height: 280
background_animation:
  - preset: nebula
    config:
      volumetric: true
      cloud_count: 4
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 30
      distance: 150
objects:
  - type: grid
    shape: disc
    radius: 60
    pattern: polar
    line_spacing: 10
    spoke_count: 24
```

| Key | Type | Default | Description |
|---|---|---|---|
| `background_animation` | list | - | Background effects behind the scene. See [Background animations](/core/effects/background-animations) |
| `background_animation[].preset` | string | required | The effect: `nebula`, `starfield`, `grid` ... |
| `background_animation[].config` | object | the preset's | The effect's own settings |

## Labels

**How every label on the card is drawn: the text keys they all start from, the label styles, overlap and pixel snapping.** Point labels are LCARdS text, with the [text-field keys](/core/text-fields) of the other cards: fonts, sizes, weights, colours with state maps, background boxes, templates.

- `labels.default` sets keys for every label. `labels.styles` changes the built-in styles (`title`, `major`, `minor`, `tiny`) or adds your own, which starts from `minor`; a point picks one with `style`. A style's keys win over `labels.default`, which wins over the built-in style.
- When two labels overlap, the higher priority wins (the larger style), then the nearer one. `overlap: true` keeps them all shown; each still moves to a free side of its point when it can.
- Labels move by sub-pixel steps, which looks smooth while the scene turns. On a weak device, `snap: true` rounds them to whole px.
- What a label says, and its fields round the point, are on [Points: labels](./points#labels).

```yaml live
type: custom:lcards-astrometrics-card
height: 280
labels:
  default:
    text_transform: uppercase
    letter_spacing: 1
  styles:
    # change a built-in style
    major:
      color: var(--lcars-orange)
    # add your own
    alert:
      font_size: 16
      color: var(--lcars-red)
      priority: 90
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 40
      distance: 160
points:
  - id: home
    xyz: [0, 0, 0]
    marker: reticle
    label: Starbase
    style: major
  - id: contact
    polar: [50, 60]
    marker: triangle
    label: Unknown contact
    style: alert
  - id: buoy
    polar: [45, 220]
    marker: dot
    label: Buoy
objects:
  - type: grid
    shape: disc
    radius: 70
    pattern: polar
    line_spacing: 10
    spoke_count: 24
```

| Key | Type | Default | Description |
|---|---|---|---|
| `labels.default` | object | - | Text keys every label on the card starts from (`font_family`, `text_transform`, `letter_spacing` ...), over the built-in styles |
| `labels.styles` | object | - | Label styles by name: a built-in (`title`, `major`, `minor`, `tiny`) to change, or your own. See [Points: styles and defaults](./points#styles-and-defaults) |
| `labels.styles.<name>.priority` | number | by style | Which label wins when two overlap: higher wins. Built in: `title` 100, `major` 80, `minor` 40, `tiny` 10 |
| `labels.styles.<name>.overlap` | boolean | `labels.overlap` | Labels of this style are never hidden by another label |
| `labels.overlap` | boolean | `false` | Never hide a label when labels overlap. `false` hides the lower-priority one, which keeps busy scenes readable |
| `labels.snap` | boolean | `false` | Round label positions to whole px: crisper text on weak devices, steppier fast motion |

## A header bar

**The card is the scene only: for an LCARS frame round it, put it in a Layout Card.** An elbow or a bar-label button above the scene makes an "ALPHA QUADRANT" header.

- The [Layout Card](../layout-card/) places the astrometrics card and its frame together, so they move and size as one.

## Performance and motion

**The scene draws only when something moves, so an idle card costs nothing.** Every astrometrics card and WebGL background on a page shares one WebGL context.

- The scene draws when the camera moves, a fly-to runs, an object spins or an [effect](./effects) moves, the sky timer ticks or the theme changes. A still scene draws nothing, and off screen or in a hidden tab nothing draws.
- Under reduced motion (the system setting), spin, `auto_rotate`, [deformations](./objects/surfaces#deformed-grids) and every [effect](./effects) (drift, scans, moving dashes, fills) stop, and a fly-to jumps instead of flying (no warp streaks).
- Alert modes recolour the scene in place: every object crossfades to the alert palette over a moment (at once under reduced motion), the camera and motion carry on, and labels follow the palette at once.

::: details More about drawing
- **The scene clock:** a [scene clock](./scale#the-scene-clock) faster than a minute a second draws every frame; at a minute a second or slower it draws once a second. Under reduced motion the clock keeps running (it is data, like the sky) but moves things once a second.
- **Models:** labels behind a model are hidden with a small depth image, made only while something moves. See [model](./objects/ships#model).
- **Alert modes and models:** a model is built again in its new colours.
:::

## When the 3D view is unavailable

**The card shows 3D VIEW UNAVAILABLE, with the reason, when it cannot draw the scene.** That happens when the browser has no WebGL, or when the graphics context was lost (a GPU reset, too many WebGL pages).

- Reloading the page starts the view again.
