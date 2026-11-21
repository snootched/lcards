---
description: "Astrometrics card lines and light: routes (path), beams, trails behind moving points, lightning and soft glows."
---

# Lines and Light

Lines through the scene and lights in it: routes, beams, trails behind moving points, lightning and glows. The keys every object takes (`id`, `at`, `rotation`, `opacity`, `visible` ...) are on the [Objects](../objects#keys-every-object-takes) page.

## path

**A line through a list of points, or from one point to another.** Use it for a route between places, a supply line, or an outline drawn in the scene.

- List the places in `points` (point ids or `[x, y, z]`), or give just `from` and `to`. A path through point ids moves when those points move.
- `arc` bends each leg upward into a curve, so a route between two places on a map reads as a flight path rather than a straight line.
- A path with `at` is a shape drawn round that point: each `[x, y, z]` is measured from `at`, so the shape moves and turns with it.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 40
      distance: 170
points:
  - id: star
    xyz: [0, 0, 0]
    marker: reticle
    label: STAR
  - id: outpost
    polar: [60, 250]
    marker: dot
    label: OUTPOST
  - id: relay
    polar: [55, 60]
    marker: dot
    label: RELAY
objects:
  - type: ring
    at: star
    radius: 30
    color: var(--lcars-blue)
  # a route from the outpost past the star to the relay
  - type: path
    points: [outpost, star, relay]
    arc: 15
    width: 2
    colors: [var(--lcars-orange), var(--lcars-yellow)]
    glow: true
  # a pipe drawn round the star, with pulses running along it
  - type: path
    at: star
    points:
      - [-40, -25, 0]
      - [0, -32, 0]
      - [40, -25, 0]
    arc: 6
    width: 8
    line_look: tube
    pulse: true
    color: var(--lcars-blue)
```

::: details More about path
- **Ids and offsets together:** with `at`, a point id in `points` still means that point, wherever it is; only the `[x, y, z]` entries are measured from `at`.
- **The track of the sun or moon:** `sky: sun` (or `moon`) with `object: <dome grid id>` draws today's track across the sky on that dome, split where it goes under the horizon. `points`, `from` and `to` are not used then.
- **Looks:** a path is part of the diagram look; the realistic [look](../scene#looks-diagram-and-realistic) hides it unless the path sets `look: all`.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `points` | list | - | The places the line passes through, in order: point ids or `[x, y, z]`. With `at`, each `[x, y, z]` is an offset from `at` |
| `from` | id / `[x, y, z]` | - | Start, instead of `points` |
| `to` | id / `[x, y, z]` | - | End, instead of `points` |
| `arc` | number | `0` | Lift each leg into a curve this high at its middle, scene units. `0` is straight |
| `sky` | string | - | `sun` or `moon`: draw today's track of that body on the dome in `object` |
| `object` | string | - | With `sky`: the id of the dome grid to draw on |
| `alt` | number | `0` | With `sky`: height above the dome, scene units |
| `color` | colour | `var(--lcars-orange)` | Line colour |
| [Line keys](#line-keys) | | | `width`, `dash`, `colors`, `glow`, `line_look`, `blend` and `pulse` |

### Line keys

**How a line is drawn: its width, dashes, colours, glow and pulses.** The same keys work on a `path`, a [ring](./surfaces#ring) and (all but `glow` and `line_look`) a [trail](#trail).

- Widths, dashes and pulses are measured in screen pixels, so a line keeps its thickness however close the camera is.
- `pulse` sends bright dashes along the line, like data moving down a conduit. Moving dashes and pulses are explained with more examples on the [Effects](../effects#moving-dashes-and-pulses) page.

```yaml live
type: custom:lcards-astrometrics-card
height: 260
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 50
      distance: 150
objects:
  # dashed
  - type: path
    from: [-60, 0, -30]
    to: [60, 0, -30]
    width: 2
    dash: [8, 6]
    color: var(--lcars-blue)
  # a colour fade with a glow under it
  - type: path
    from: [-60, 0, 0]
    to: [60, 0, 0]
    width: 3
    colors: [var(--lcars-orange), var(--lcars-yellow)]
    glow: true
  # a lit pipe with pulses
  - type: path
    from: [-60, 0, 30]
    to: [60, 0, 30]
    width: 10
    line_look: tube
    color: var(--lcars-blue)
    pulse:
      color: var(--lcars-yellow)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `width` | number | `1.5` | Line width, px |
| `dash` | list / object | solid | Dashes as `[on, off]` in px (more pairs repeat). Or `pattern: [on, off]` with `speed` (px per second; negative runs backwards) to move them |
| `color` | colour | per type | Line colour |
| `colors` | `[from, to]` | - | Fade from the first colour to the second along the line. Wins over `color` |
| `glow` | boolean / number | off | A soft halo under the line: `true` is 4 times the line's width, or give the factor (at least 1) |
| `line_look` | string | `flat` | `flat`: one brightness. `tube`: shaded like a lit pipe (dark edges, a bright stripe); reads best from about 6 px wide |
| `blend` | string | `normal` | `add`: light adds up where lines cross, so they glow |
| `pulse` | boolean / object | off | Bright pulses moving along the line. `true`, or the keys below |
| `pulse.length` | number | `14` | Pulse length, px |
| `pulse.gap` | number | `90` | Space between pulses, px |
| `pulse.width` | number | line width + 1 | Pulse width, px |
| `pulse.color` | colour | `var(--lcards-moonlight)` | Pulse colour. Pulses add light, so they look whiter than this on a bright line |
| `pulse.speed` | number | `80` | px per second, when `dash.speed` is not set |

Moving dashes and pulses stop under reduced motion.

## beam

**A glowing straight line between two places: a tractor beam, a phaser, a transporter lock.** It is drawn as a wide, soft haze round a thin bright core, so it reads as light rather than a drawn line.

- `from` and `to` take point ids or `[x, y, z]`. A beam between points follows them when they move.
- `width` sets the haze; the bright core stays thin whatever the width.

```yaml live
type: custom:lcards-astrometrics-card
height: 280
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 25
      tilt: 20
      distance: 140
backdrop:
  stars:
    count: 1500
points:
  - id: station
    xyz: [-45, 0, 0]
    marker: reticle
    label: STATION
  - id: ship
    xyz: [45, 10, 0]
    marker: dot
    label: SHIP
objects:
  - type: beam
    from: station
    to: ship
    width: 14
    color: var(--lcars-blue)
    pulse: true
```

| Key | Type | Default | Description |
|---|---|---|---|
| `from` | id / `[x, y, z]` | - | One end |
| `to` | id / `[x, y, z]` | - | The other end |
| `width` | number | `12` | Width of the haze, px. The core stays thin |
| `color` | colour | `theme:colors.ui.secondary` | Beam colour |
| `pulse` | boolean / object | off | Pulses moving along the beam, as on a [line](#line-keys) |

## trail

**A line behind a moving point, showing where it has been: a ship's wake, the last stretch of a planet's orbit.**

- The point must move: ride a spinning ring, stand on a model part during an animation, or be placed from an entity's state. A point that stands still leaves no trail.
- The trail starts empty when the card opens and grows as the point moves, up to `length` seconds of travel.
- The tail fades to black, which is the background in space. Over a bright planet, set `fade_tail: false`.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 35
      distance: 120
points:
  - id: sun
    xyz: [0, 0, 0]
  - id: ship
    polar: [40, 0]
    object: orbit
    marker: dot
    label: SHIP
    style: minor
  - id: probe
    polar: [22, 180]
    object: inner
    marker: dot
    label: PROBE
    style: tiny
objects:
  - type: glow
    at: sun
    size: 30
    color: var(--lcars-yellow)
  # the points ride these two spinning rings
  - type: ring
    id: orbit
    radius: 40
    spin: 20
    width: 0.5
    opacity: 0.2
    rotation: [12, 0, 0]
  - type: ring
    id: inner
    radius: 22
    spin: -45
    width: 0.5
    opacity: 0.2
  - type: trail
    point: ship
    length: 6
    width: 3
  - type: trail
    point: probe
    length: 3
    width: 2
    color: var(--lcars-blue)
```

::: details More about trail
- **Drawn where the point stands:** a moon on a ring round a planet that is itself on an orbit leaves its trail round the planet, riding along with it, not the looping track it makes through the scene.
- **Entities:** a point placed from an entity leaves a line through the positions it reported since the card opened.
- **Reduced motion:** a point on a ring holds still, so its trail stops growing. A point that jumps with an entity still leaves its line.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `point` | string | required | The id of the point to follow |
| `length` | number | `10` | How far back the trail reaches, in seconds of the point's travel |
| `fade_tail` | boolean | `true` | Fade from the colour at the point to black at the tail. `false`: one colour all along |
| `color` | colour | `var(--lcars-orange)` | Colour at the point |
| `width`, `dash`, `blend`, `pulse` | | | As the [line keys](#line-keys) |

## lightning

**Jagged, forked bolts of lightning: quick strikes at random places, or columns that stay lit.** Put it inside a volume nebula and each bolt lights the gas round it, as in a storm.

- `mode: strike` (the default) flashes a bolt now and then somewhere in the region, mostly from high to low.
- `mode: column` holds `count` bolts from the region's floor to its ceiling, crawling and flickering.
- The region is a ball (`radius`) or a box (`size`) round the object's place (`at`).
- Under reduced motion no strikes show, and columns stand still and dim.

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 30
      tilt: 6
      distance: 300
backdrop:
  stars:
    count: 2000
objects:
  - type: nebula
    render: volume
    size: [400, 220, 400]
    count: 10
    colors: [var(--lcars-orange), var(--lcars-red)]
    seed: 5
    density: 1.6
    max_radius: 160
  - type: lightning
    size: [260, 170, 260]
    rate: 2
    color: var(--lcars-space-white)
    glow:
      color: var(--lcars-lavender)
    branches: 4
    seed: 4
```

::: details More about lightning
- **A strike** is a quick rise, a fade and a weaker second stroke, then a pause of about `1 / rate` seconds (the pauses vary).
- **Lighting the gas:** a bolt lights any [volume nebula](../effects#gas-you-can-fly-into) it falls in, in its own colour, without linking the two. `lights: false` turns that off.
- **Lightning on a nebula itself:** a volume nebula can also have strikes of its own (`lightning:` on the nebula, see [the Badlands](../effects#the-badlands-layers-columns-and-lightning)), or discharges crawling along its ribbon (`mode: crawl`, see [the Nexus](../effects#the-nexus-a-ribbon-and-its-wake)).
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `mode` | string | `strike` | `strike`: bolts that flash and go. `column`: bolts held from floor to ceiling |
| `radius` | number | `50` | The region as a ball round `at`, scene units |
| `size` | number / `[w, h, d]` | - | The region as a box, scene units. Wins over `radius` |
| `rate` | number | `0.5` | `strike`: about how many strikes a second. `0`: none. Can [follow an entity](../data#settings-from-entities) |
| `flash` | number | `150` | `strike`: how long a strike shows, ms |
| `count` | number | `1` | `column`: how many columns (1 to 10), spread over the region |
| `speed` | number | `1` | `column`: how fast the bolts crawl and flicker. `0.5` is half as fast, `0` still. Can follow an entity |
| `color` | colour | `var(--lcards-moonlight)` | The bolt's bright core |
| `glow` | boolean / object | `true` | The soft glow round the bolt. `false` for none, or `color` and `width` (times the bolt's width, default 6) |
| `width` | number | `2` | The bolt's width, px. Branches are about half as wide |
| `jaggedness` | number | `0.5` strike, `0.25` column | How far the bolt zigzags, from `0` (straight) to `1` |
| `branches` | number | `3` strike, `1` column | Forks off the bolt; each may fork once more |
| `brightness` | number | `1` | How strongly a bolt lights the gas, `0` to `2`. Can follow an entity |
| `lights` | boolean | `true` | Light the gas of a volume nebula the bolt is in |
| `seed` | number | `1` | Where the strikes fall and how the bolts are shaped; the same seed gives the same storm |

## glow

**A soft round light that always faces the camera: a star, a galactic core, a beacon.** It is a light, not a solid: it brightens what is behind it and has no edge.

- Place it with `at` (a point id or `[x, y, z]`); `size` is its diameter in scene units.
- `falloff` shapes it: a low value is a wide, even haze, a high value a small bright core with a faint halo.

```yaml live
type: custom:lcards-astrometrics-card
height: 260
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 15
      distance: 160
backdrop:
  stars:
    count: 1500
objects:
  # a wide, even haze
  - type: glow
    at: [-45, 0, 0]
    size: 60
    falloff: 0.5
    color: var(--lcars-orange)
  # the default
  - type: glow
    at: [0, 0, 0]
    size: 60
    color: var(--lcars-yellow)
  # a tight bright core
  - type: glow
    at: [45, 0, 0]
    size: 60
    falloff: 6
    color: var(--lcars-blue)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `size` | number | `60` | Diameter, scene units |
| `color` | colour | `var(--lcards-moonlight)` | Colour of the light |
| `opacity` | number | `0.9` | Strength, `0` to `1` |
| `falloff` | number | `2` | How fast it fades from the middle: higher is a tighter, brighter core. At least `0.25` |
| `blend` | string | `add` | `add`: light adds up with what is behind. `normal`: drawn over it |
