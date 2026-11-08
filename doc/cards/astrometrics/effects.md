---
description: "Astrometrics card effects in 3D: nebula clouds and gas to fly into (shapes, dust, the Badlands, the Nexus), scan bands, moving dashes and pulses, animated planet and grid fills (plasma, fluid, contour, bands, swirls, planet types), warp streaks and dust."
---

# Effects

The [background animation](/core/effects/background-animations) presets, rebuilt as parts of the 3D scene: they sit in space and move with the camera instead of being a flat layer behind it. Every effect is still unless you give it a speed, so a scene with nothing moving draws nothing; under reduced motion (the system setting) they all hold still.

<CardGallery set="astro-effects" />

## Nebula

**`type: nebula` puts clouds of gas in the scene, in the look of the [nebula](/core/effects/background-animations/preset-reference#nebula) preset with `volumetric: true`.** Use it for a nebula on a star map, a gas cloud round a station, or a storm to fly into.

- Each cloud is a few soft puffs facing the camera at slightly different depths, so as you turn the camera the clouds shift against each other and against the grids.
- A cloud fades as you fly into it, and a planet hides the clouds behind it.
- Every key of the object is in the [nebula](./objects/space#nebula) table; the sections below show what the volume, shapes, dust and presets do.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 25
      distance: 300
backdrop:
  stars:
    count: 2000
objects:
  - type: grid
    shape: disc
    radius: 100
    pattern: polar
    line_spacing: 10
    spoke_count: 36
  - type: nebula
    size: [220, 50, 220]
    count: 8
    seed: 5
    drift: 3
    colors: [var(--lcars-violet), var(--lcars-blue), var(--lcars-red)]
```

::: details More about nebulae
- **Never tappable:** clouds never catch a tap, so they never get in the way of points behind them. A label for a cloud is a [point](./points) at the same place.
- **The seed:** `count` clouds are placed by `seed` inside the region; the same seed always places the same clouds, and picks each cloud's colour from `colors`.
- **Entities:** `drift` (and with `render: volume`, `density`) can [follow an entity](./data#settings-from-entities); it eases to each new value.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `radius` | number | `100` | The clouds fill a ball this big round `at`, scene units |
| `size` | number / `[w, h, d]` | - | Or a box, scene units (one number for a cube). Wins over `radius` |
| `count` | number | `4` | How many clouds the seed places, 1 to 10 |
| `seed` | number | `1` | The same seed always places the same clouds |
| `colors` | colour / list | `var(--lcars-violet)` | One colour, or a list the seed picks from per cloud |
| `drift` | number / `[x, y]` | `0` | How fast the gas churns, scene units per second. `[x, y]` gives a direction. `0` is still |
| [Nebula keys](./objects/space#nebula) | | | `clouds`, `color`, `min_radius`, `max_radius`, `brightness`, `turbulence`, `noise_scale`, `blend` and the rest |

### Gas you can fly into

**`render: volume` draws the same clouds (the same seed, colours and brightness) as one body of gas filling the region, instead of puffs.** Fly into it and there is gas all round you, which puffs facing the camera cannot give.

- The gas fades out toward the edges of the region, so its box or ball never shows.
- A planet, model or other solid object inside the gas hides the gas behind it, and the gas in front of it still shows.
- `turbulence` erodes the clouds into wisps and holes (0 gives smooth blobs), and `density` makes the gas thicker or thinner.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  view: outside
  views:
    outside:
      target: [0, 0, 0]
      yaw: 20
      tilt: 20
      distance: 300
    inside:
      target: [40, 0, 10]
      yaw: 200
      tilt: 6
      distance: 30
backdrop:
  stars:
    count: 2000
points:
  # tap the labels to fly in and out
  - id: fly_in
    xyz: [40, 0, 10]
    label: FLY INSIDE
    tap_action:
      action: fly-to
      view: inside
  - id: fly_out
    xyz: [-90, 0, 0]
    label: BACK OUT
    tap_action:
      action: fly-to
      view: outside
objects:
  - type: grid
    shape: disc
    radius: 100
    pattern: polar
    line_spacing: 10
    spoke_count: 36
  - type: sphere
    at: [30, 0, -20]
    radius: 14
    fill:
      color: var(--lcars-orange)
  - type: nebula
    render: volume
    size: [220, 60, 220]
    count: 7
    seed: 5
    drift: 2
    colors: [var(--lcars-violet), var(--lcars-blue)]
```

::: details More about volume gas
- **Bigger clouds:** with `render: volume`, the clouds' default sizes are 0.25 and 0.55 of the region (`min_radius`, `max_radius`), so the gas fills it.
- **Resolution:** a volume is drawn at half the screen's resolution, which soft gas does not show.
- **Volume only:** `shape`, `dust`, `density` and `lightning` work only with `render: volume`.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `render` | string | `puffs` | `puffs`: soft puffs facing the camera. `volume`: one body of gas you can fly into |
| `density` | number | `1` | `render: volume`: how thick the gas is (`2` is twice as thick) |
| `turbulence` | number | `0.5` | How ragged the edges are, `0` to `1` |

### Shapes, dust and colour

**With `render: volume`, `shape` gives the gas a form, after the real nebulae: a hollow shell, an hourglass, long filaments, a cavity.** The clouds still give the clumps and the colours inside the form, so `count`, `seed` and `colors` keep working; turn the form with `rotation`.

- `stretch` draws each seeded cloud out (0 round to 1 long and flat), each turned its own way. The same seed with or without `stretch` places the same clouds.
- `core.color` colours the gas deep inside a cloud (in a shape: near its middle), running out to the cloud colours at the edges, as in the Hubble pictures.
- Dust is dark gas that hides the gas behind it: see [Dust lanes](#dust-lanes).

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 10
      distance: 420
backdrop:
  stars:
    count: 2000
objects:
  # the Ring nebula
  - type: nebula
    render: volume
    shape: shell
    at: [-150, 60, 0]
    radius: 55
    count: 8
    colors: [var(--lcars-ice), var(--lcars-violet)]
  # the Butterfly
  - type: nebula
    render: volume
    shape: bipolar
    at: [-50, 60, 0]
    radius: 55
    count: 8
    colors: [var(--lcars-orange), var(--lcars-red)]
    core:
      color: var(--lcards-moonlight)
  # the Veil
  - type: nebula
    render: volume
    shape: filaments
    at: [50, 60, 0]
    radius: 55
    count: 8
    stretch: 0.5
    colors: [var(--lcars-red), var(--lcars-ice)]
  # a blister, as in Orion
  - type: nebula
    render: volume
    shape: cavity
    at: [150, 60, 0]
    radius: 55
    count: 8
    colors: [var(--lcars-red), var(--lcars-orange)]
    core:
      color: var(--lcars-ice)
  # stretched clouds with dust across them
  - type: nebula
    render: volume
    at: [0, -70, 0]
    size: [300, 60, 80]
    count: 8
    stretch: 0.7
    dust:
      count: 3
    colors: [var(--lcars-violet), var(--lcars-blue)]
    core:
      color: var(--lcars-ice)
```

::: details More about the shapes
- **`clouds`** (the default): the clouds themselves.
- **`shell`:** a thin hollow sphere, a ring with a dark middle from any side (the Ring nebula).
- **`bipolar`:** an hourglass along the object's y axis, two hollow lobes joined at a narrow waist, the gas streaked outward (the Butterfly, the Hourglass).
- **`filaments`:** long thin strands running along the object's x axis (the Veil).
- **`cavity`:** a thick cup round a hollow that opens on the object's +z side: a bright bowl seen from there, a crescent from the side (a blister, as in Orion).
- **`layers`:** a floor and a ceiling of gas across a box with a gap between: see [the Badlands](#the-badlands-layers-columns-and-lightning).
- **`wake`:** a bright ribbon waving along the object's x axis and a sheet of gas trailing it: see [the Nexus](#the-nexus-a-ribbon-and-its-wake).
- **Hand-placed clouds** take `size` and `rotation` instead of `stretch`: see [Dust lanes](#dust-lanes).
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `shape` | string | `clouds` | `render: volume`: the form of the gas: `clouds`, `shell`, `bipolar`, `filaments`, `cavity`, `layers` or `wake` |
| `stretch` | number | `0` | How drawn out each seeded cloud is, `0` (round) to `1` (long and flat) |
| `core.color` | colour | - | A colour deep in the gas, running out to the cloud colours at the edges. Left out: the cloud colours throughout |

### Dust lanes

**Dust is dark gas in a volume nebula that hides the gas behind it: lay a few dark clouds across the gas with `dust.count`, or place one by hand with `dust: true`.** A lane placed by hand through a bright cloud reads most clearly.

- With `blend: add` (the default) the dust darkens only this nebula's own gas, so the stars behind still show through; with `blend: normal` it hides what is behind the nebula too.
- Dust clouds the seed lays have a seed of their own, so adding dust moves no gas cloud.
- `clouds` places clouds by hand, instead of `count` and the seed: up to 10 gas clouds and 4 dust clouds.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 0
      distance: 400
backdrop:
  stars:
    count: 2000
objects:
  - type: nebula
    render: volume
    radius: 130
    colors: [var(--lcars-orange)]
    clouds:
      # a bright cloud
      - xyz: [0, 0, 0]
        radius: 100
        opacity: 0.9
      # a long dark lane across it
      - xyz: [0, 0, 40]
        size: [200, 20, 30]
        rotation: [0, 0, 20]
        dust: true
```

| Key | Type | Default | Description |
|---|---|---|---|
| `dust.count` | number | `0` | Dark dust clouds the seed lays across the gas clouds, 0 to 4 |
| `dust.amount` | number | `0.8` | How dark the dust is, `0` to `1` |
| `dust.color` | colour | black | The dust's colour |
| `clouds` | list | - | Clouds placed by hand, instead of `count` and the seed |
| `clouds[].xyz` | `[x, y, z]` | `[0, 0, 0]` | Where the cloud sits, scene units from the object |
| `clouds[].radius` | number | halfway between `min_radius` and `max_radius` | Cloud radius, scene units |
| `clouds[].size` | `[w, h, d]` | - | Or an ellipsoid, scene units. Replaces `radius` |
| `clouds[].rotation` | `[x, y, z]` | - | Turns the ellipsoid, degrees, as an object's `rotation` |
| `clouds[].color` | colour | the next of `colors` | This cloud's colour. Without it, the clouds take `colors` in order |
| `clouds[].opacity` | number | the middle of `brightness` | Opacity, `0` to `1` |
| `clouds[].dust` | boolean | `false` | `render: volume`: a dark dust cloud (`dust.amount`, `dust.color`) instead of glowing gas |

### The Badlands: layers, columns and lightning

**The Badlands, the plasma storms of Deep Space Nine and Voyager, start from a preset: `preset: badlands` (Deep Space Nine) or `preset: badlands_voyager` (Voyager).** Fly the camera into the gap between the sheets.

- `badlands`: liquid fire in yellow, orange and red, an orange band glowing between the sheets, fire columns thick and thin.
- `badlands_voyager`: peach and mauve layers, held pink lightning columns, strikes that light the gas.
- Every key you set wins over the preset's; in `band`, `columns` and `lightning` key by key, so `columns: { count: 3 }` keeps the preset's kind and colour.

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 30
      tilt: 3
      distance: 110
backdrop:
  stars:
    count: 2000
objects:
  - type: nebula
    preset: badlands
```

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 200
      tilt: 3
      distance: 160
backdrop:
  stars:
    count: 2000
objects:
  - type: nebula
    preset: badlands_voyager
```

::: details More about the Badlands
- **What the presets are:** both are `render: volume` with `shape: layers` in a `size: [500, 140, 500]` box (Voyager's 160 high): a floor and a ceiling of gas with their surfaces rolled into ridges, `colors` running from each sheet's surface into its depth.
- **Deep Space Nine's** sets `veins: 0.8`, a narrower `gap` of `0.4`, a brighter band and eight fire columns from `1` to `3` times the usual width.
- **Voyager's** sets seven lightning columns, a butter-coloured band and strikes in the gas.
- **Your own box:** the preset's box is 500 across; with a `size` (or `radius`) of your own, its `drift` scales with it, so the gas churns as fast for its size. A drift you set stays as you wrote it.
- **Turning parts off:** `band: false` or `lightning: false` drops that part of the preset; `true` keeps the preset's settings.
- **Lightning anywhere:** `lightning` works on any volume nebula, not only `layers`, and a [lightning object](./objects/lines#lightning) striking inside any volume nebula lights its gas too. The strikes take the nebula's `seed` unless you give them one.
- **Reduced motion:** the columns stand still and no strike shows.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `preset` | string | - | `badlands`, `badlands_voyager` (or `nexus`, [below](#the-nexus-a-ribbon-and-its-wake)): a named nebula to start from |
| `gap` | number | `0.56` | `shape: layers`: how much of the height is open between the sheets, `0` (they touch) to `0.9` |
| `veins` | number | `0` | `shape: layers`: bright fine veins in the sheets' surfaces with darker gas between (liquid fire), `0` to `1` |
| `band` | boolean / object | `false` | `shape: layers`: light glowing in the gap, brightest in a thin sheet at its middle |
| `band.brightness` | number | `1` | How bright, `0` to `3` |
| `band.width` | number | `0.08` | How far the glow reaches from the middle, a fraction of half the height |
| `band.color` | colour | `var(--lcards-moonlight)` | The band's colour |
| `columns` | object | - | `shape: layers`: columns from the floor to the ceiling: see [Columns](#columns) |
| `lightning` | boolean / object | `false` | Strikes inside the gas that light it: `true`, or the [lightning object's](./objects/lines#lightning) `rate`, `flash`, `color`, `glow`, `width`, `jaggedness`, `branches`, `brightness` and `seed` |

### Columns

**`columns` stands fire, vortices or held lightning from the floor to the ceiling of a `layers` nebula, spread over the region.** A field of vortices, with the funnels joined into columns, is a storm of its own.

- `fire` is rising flame, wide at the foot with a splash ring on the floor; its white-hot heart takes `columns.color` and its edge the sheets' surface colour.
- `vortex` is a twisting funnel, narrow at its middle (`waist`) and dark at its rim.
- `lightning` is a held, crawling bolt that lights the gas round it.

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 200
      tilt: 4
      distance: 150
backdrop:
  stars:
    count: 2000
objects:
  - type: nebula
    render: volume
    shape: layers
    size: [500, 160, 500]
    count: 6
    seed: 8
    drift: [3, 0]
    colors: [var(--lcars-violet-creme), var(--lcars-violet), var(--lcars-blue)]
    band:
      brightness: 0.8
      color: var(--lcars-violet-creme)
    columns:
      count: 6
      kind: vortex
      waist: 0.4
      width: 1.5
      color: var(--lcars-violet-creme)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `columns.kind` | string | `fire` | `fire`, `vortex` or `lightning` |
| `columns.count` | number | `4` | How many, 1 to 10, spread over the region |
| `columns.width` | number / `[min, max]` | `1` | `fire` and `vortex`: how thick, times the usual. A pair gives each column its own width between them, so thick columns and thin strands stand together |
| `columns.waist` | number | `0.2` | `vortex`: how wide the middle is against the ends, `0.05` (two funnels meeting at a point) to `1` (one straight column) |
| `columns.speed` | number | `1` | `lightning`: how fast the bolts crawl and flicker. `0.5` is half as fast, `0` still |
| `columns.color` | colour | `var(--lcards-moonlight)` | The fire's white-hot heart, the vortex, or the bolt |
| `columns.glow.color` | colour | the column colour | `lightning`: the glow round the bolts |

### The Nexus: a ribbon and its wake

**The Nexus, the ribbon of energy in Star Trek Generations, starts from `preset: nexus`: a white-hot ribbon waving across a long box, a wake of pink and red gas streaming out behind it, and small discharges crawling off it and lighting the gas.**

- The preset is `render: volume` with `shape: wake` in a `size: [2000, 500, 500]` box: the ribbon waves along the object's x axis near the bottom of the region and the gas trails up from it, `colors` running from the ribbon out, white-hot right at it.
- Every key you set wins over the preset's; in `ribbon`, `wake` and `lightning` key by key.

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v:
      target: [0, -60, 0]
      yaw: 8
      tilt: 6
      distance: 1500
backdrop:
  stars:
    count: 3000
objects:
  - type: nebula
    preset: nexus
```

::: details More about the Nexus
- **Your own box:** with a `size` (or `radius`) of your own, the ribbon's `speed` scales with its length, so the waves run as fast for its size. A speed you set stays as you wrote it.
- **Discharges:** `lightning.mode: crawl` (the preset's) puts short bolts and small loops on the ribbon that flicker and jump along it, in place of strikes. It works only with `shape: wake`.
- **The glow's colour** defaults to the first of `colors`.
- **Reduced motion:** the ribbon holds still, and the discharges stand still and dim.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `ribbon` | boolean / object | `true` | `shape: wake`: the bright line and the curve it follows. `false`: the gas only |
| `ribbon.waves` | number | `2.5` | How many waves along it, end to end |
| `ribbon.amplitude` | number | `0.2` | How far it waves, a fraction of half the region's height (a little less in depth), up to `0.5` |
| `ribbon.speed` | number | `0` (the preset: `40`) | How fast the waves run along it, scene units a second; the wake streams out from it as fast. Negative runs the other way |
| `ribbon.width` | number | `6` (the preset: `4`) | The line's width, px |
| `ribbon.color` | colour | `var(--lcards-moonlight)` | The line's colour, and the gas right at it |
| `ribbon.glow` | boolean / object | `true` | The glow round the line and in the gas near it |
| `ribbon.glow.color` | colour | the first of `colors` | The glow's colour |
| `ribbon.glow.width` | number | `8` | How wide the outer glow is, times the line's width |
| `wake.side` | string | `up` | Which way the gas trails: `up`, or `down` (the ribbon near the top). Turn the object with `rotation` to trail it another way |
| `wake.lean` | number | `0` | How far the gas leans along the ribbon as it goes out, `-1` to `1`: a fan trailing to one side, seen from afar |
| `lightning.mode` | string | `strike` (the preset: `crawl`) | `crawl`: discharges crawling off the ribbon. `strike`: bolts in the gas |
| `lightning.count` | number | `6` | `crawl`: how many at once, 1 to 40 |
| `lightning.reach` | number | `0.35` | `crawl`: how far they stand off the ribbon, a fraction of half the height |
| `lightning.speed` | number | `1` | `crawl`: how fast they flicker, reshape and jump |

### A travelling Nexus

**To send the Nexus travelling, put it `at:` a moving point with `face: motion`.** Facing turns the object's +z along the travel, so `rotation: [-90, 0, 0]` turns the wake (its +y) to trail behind.

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 35
      distance: 7000
backdrop:
  stars:
    count: 3000
points:
  - id: nexus
    polar: [2500, 0]
    object: track
    label: NEXUS
objects:
  # the point rides this spinning ring
  - type: ring
    id: track
    radius: 2500
    spin: 3
    width: 0.5
    opacity: 0.15
  - type: nebula
    preset: nexus
    at: nexus
    size: [1500, 400, 400]
    face: motion
    rotation: [-90, 0, 0]
```

| Key | Type | Default | Description |
|---|---|---|---|
| [Keys every object takes](./objects#keys-every-object-takes) | | | `at`, `face` and `rotation`; see [Facing the way it goes](./objects#facing-the-way-it-goes) |

## Scan bands

**`scan` on a `grid`, `sphere`, `volume` or `model` sends a bright band across its lines, as the background grid's `scan_period` does.** Use it for a sensor sweep across a map, a planet being scanned, or a ship's hologram.

- A sphere sweeps from pole to pole, a dome from the top to its rim, a cylinder top to bottom, and a plane runs south to north.
- A polar disc rings out from its centre like a sensor ping, and a volume sweeps down its walls.
- On a [model](./objects/ships#model) the band runs along its longest side, in the hologram look.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 10, 0]
      yaw: 20
      tilt: 25
      distance: 260
objects:
  # a ping ringing out from the centre
  - type: grid
    shape: disc
    radius: 100
    pattern: polar
    line_spacing: 10
    spoke_count: 36
    scan:
      period: 6
      color: var(--lcars-yellow)
  # pole to pole
  - type: sphere
    at: [-50, 25, 0]
    radius: 22
    color: var(--lcars-blue)
    scan:
      period: 5
  # down the walls
  - type: volume
    shape: sector
    radius: [55, 95]
    angle: [100, 170]
    height: [0, 30]
    color: var(--lcars-green)
    scan:
      period: 4
```

| Key | Type | Default | Description |
|---|---|---|---|
| `scan.period` | number | `0` | Seconds per sweep. `0`: none. Stops under reduced motion |
| `scan.color` | colour | `var(--lcards-moonlight)` | The band's colour |

## Moving dashes and pulses

**A dashed line can move its dashes along it, and any line can send bright pulses along it, as the [flow](/core/effects/background-animations/preset-reference#flow) preset's streaks do.** Use it for traffic on a route, power along a conduit, or a ring that turns.

- `dash` with `pattern` and `speed` moves the dashes on a `ring`, `path` or `trail`, `speed` px per second (negative runs backwards). Dashes keep their px size at any distance, so they move at the same speed on screen near or far.
- `pulse` works on a `ring`, `path`, `trail` and `beam`. Pulses add light, so on a coloured line they burn toward white.
- With `dash.speed` set, the pulses move at that speed too; else at `pulse.speed`.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 40
      distance: 320
points:
  - id: hub
    xyz: [0, 0, 0]
    marker: diamond
    label: HUB
    style: major
  - id: alpha
    polar: [70, 30]
    marker: dot
    label: ALPHA
  - id: beta
    polar: [60, 150]
    marker: dot
    label: BETA
  - id: gamma
    polar: [80, 260]
    marker: dot
    label: GAMMA
objects:
  - type: grid
    shape: disc
    radius: 100
    pattern: polar
    line_spacing: 20
    spoke_count: 12
    opacity: 0.5
  # pulses with the defaults
  - type: path
    from: hub
    to: alpha
    arc: 10
    color: var(--lcars-orange)
    pulse: true
  # moving dashes
  - type: path
    from: hub
    to: beta
    arc: 10
    color: var(--lcars-orange)
    dash:
      pattern: [8, 6]
      speed: 30
  # longer, rarer yellow pulses
  - type: path
    from: hub
    to: gamma
    arc: 10
    width: 2
    color: var(--lcars-blue)
    pulse:
      length: 24
      gap: 120
      color: var(--lcars-yellow)
  # a ring whose dashes turn
  - type: ring
    radius: 100
    width: 2
    dash:
      pattern: [12, 8]
      speed: 20
```

| Key | Type | Default | Description |
|---|---|---|---|
| `dash.pattern` | list | solid | Dashes as `[on, off]` in px (more pairs repeat) |
| `dash.speed` | number | `0` | Move the dashes (and pulses) along the line, px per second; negative runs backwards |
| `pulse` | boolean / object | off | Bright pulses moving along the line: `true`, or their settings |
| [Line keys](./objects/lines#line-keys) | | | `pulse.length` (`14`), `pulse.gap` (`90`), `pulse.width`, `pulse.color` (`var(--lcards-moonlight)`) and `pulse.speed` (`80`) |

## Animated surface fills

**`fill.effect` paints an animated pattern on a `sphere`'s body or under a `grid`'s lines: a star's surface, a gas giant's bands, an ocean, a density map.** The types are the [plasma](/core/effects/background-animations/preset-reference#plasma), [fluid](/core/effects/background-animations/preset-reference#fluid) and [contour-field](/core/effects/background-animations/preset-reference#contour-field) presets, plus `bands` (belts round the latitude, a gas giant) and `swirl` (gas spiralling in, [below](#swirls)).

- The pattern is drawn in 3D, so it has no seam round a sphere and no pinch at its poles, and it turns with `spin`.
- On a sphere it is painted over `fill.color` in place of `image`, and the body still hides what is behind it.
- `preset` starts from a [planet type](#planet-types); the keys you set win over it.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 10, 0]
      yaw: 15
      tilt: 30
      distance: 230
objects:
  # contour bands under a grid's lines
  - type: grid
    shape: plane
    size: [220, 140]
    line_spacing: 20
    opacity: 0.6
    fill:
      effect:
        type: contour
        colors: [var(--lcars-blue), var(--lcars-green), var(--lcars-yellow), var(--lcars-orange)]
        num_bands: 6
        fill_level: 0.3
        opacity: 0.5
  # a star's surface
  - type: sphere
    at: [-60, 30, 0]
    radius: 24
    line_spacing_deg: 30
    opacity: 0.4
    fill:
      effect:
        type: plasma
        color_a: var(--lcars-orange)
        color_b: var(--lcars-yellow)
        speed: 2
  - type: sphere
    at: [10, 30, -10]
    radius: 20
    opacity: 0.3
    spin: 4
    fill:
      effect:
        type: contour
        colors: [var(--lcars-orange), var(--lcars-yellow), var(--lcars-red)]
        num_bands: 8
  # an ocean
  - type: sphere
    at: [70, 25, 10]
    radius: 18
    color: var(--lcars-blue)
    fill:
      effect:
        type: fluid
        color: var(--lcars-blue)
```

::: details More about fills
- **Detail:** `base_frequency` is features per scene unit, about 3 across the object's radius by default; `num_octaves` adds layers of finer detail.
- **Motion:** with `speed` above 0 the pattern flows through the object; under reduced motion it holds still.
- **Entities:** the fill's numbers and colours can follow entities, as on any object: see [Live data](./data#settings-from-entities).
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `fill.effect.preset` | string | - | A [planet type](#planet-types) to start from |
| `fill.effect.type` | string | the preset's, else `plasma` | `plasma` (two-colour bands), `fluid` (a one-colour wash), `contour` (stepped topographic bands), `bands` (belts round the latitude) or `swirl` (gas spiralling in) |
| `fill.effect.color_a` | colour | `var(--lcars-blue)` | `plasma`: the first colour |
| `fill.effect.color_b` | colour | `var(--lcars-orange)` | `plasma`: the second colour |
| `fill.effect.color` | colour | `var(--lcars-blue)` | `fluid`: the wash colour; its alpha is how strong the wash is |
| `fill.effect.colors` | colour / list | blue to orange | `contour`: stops from low to high. `bands`: the belt colours, repeated from the south pole to the north. `swirl`: stops from the middle out to the rim |
| `fill.effect.num_bands` | number | `5` | `contour`: how many bands. `bands`: how many belts pole to pole. `2` to `64` |
| `fill.effect.fill_level` | number | `0` | `contour`: flood the lowest bands, `0` to `0.95` |
| `fill.effect.fill_color` | colour | see-through | `contour`: the colour over the flooded bands |
| `fill.effect.blend_colors` | boolean | `true` | `contour` and `bands`: colours fade between bands. `false`: hard edges |
| `fill.effect.turbulence` | number | `0.3` | `bands`: how much the belt edges swirl, `0` (straight) to `1` (stormy). `swirl`: how much the gas clumps and how ragged its edge is |
| `fill.effect.base_frequency` | number | about 3 across the radius | Detail: features per scene unit. Lower is larger features |
| `fill.effect.num_octaves` | number | `2` contour, `3` plasma, `4` the others | Layers of finer detail, `1` (smooth) to `8` (rough) |
| `fill.effect.speed` | number | `0` | How fast the pattern flows through the object, scene units per second. `swirl`: how fast the gas turns at the rim |
| `fill.effect.opacity` | number | `1` | The fill's opacity, `0` to `1` |

### Swirls

**`type: swirl` is gas spiralling in round the object's y axis: a whirlpool, an accretion disc, a wormhole's mouth.** On a `well` grid the gas pours down the funnel; on a `disc` it lies flat.

- It turns faster toward the middle and is streaked along the spiral, with dark lanes of thinner gas between the streaks, a rippled heart and a ragged outer edge that trails off in wisps (`turbulence`).
- `colors` run from the heart out to the rim, and `speed` is how fast it turns at the rim.
- Set `line_width: 0` and `edges: false` on the grid to show the gas alone.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v:
      target: [0, -2, 0]
      yaw: 20
      tilt: 40
      distance: 34
objects:
  - type: grid
    shape: well
    well:
      throat: 0.07
    radius: 15
    depth: 5
    line_width: 0
    edges: false
    fill:
      effect:
        type: swirl
        colors: [var(--lcards-moonlight), var(--lcards-orange-lightest), var(--lcars-violet), var(--lcards-blue-medium), var(--lcars-violet), var(--lcards-blue-dark)]
        speed: 3
        turbulence: 0.8
        num_octaves: 5
  - type: glow
    at: [0, 3, 0]
    size: 10
    color: var(--lcards-orange-lightest)
```

::: details More about swirls
- **A whole wormhole:** the [Bajoran wormhole starter](./starters#bajoran-wormhole) builds a mouth from a swirl, with a shaft of light, sparkling stars and wisps of gas.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| [Fill keys](#animated-surface-fills) | | | `type: swirl` with `colors`, `speed`, `turbulence` and the detail keys |

### Planet types

**`preset` starts a fill from a planet type: its type, colours (from the LCARdS palette, so they follow the theme) and detail.** Anything you set on top wins, so `preset: gas_giant` with `num_bands: 9` is a gas giant with fewer belts.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 10
      distance: 130
objects:
  - type: sphere
    at: [-48, 14, 0]
    radius: 10
    line_width: 0.5
    spin: 8
    fill:
      effect:
        preset: gas_giant
  - type: sphere
    at: [-16, 14, 0]
    radius: 10
    line_width: 0.5
    spin: 8
    fill:
      effect:
        preset: ringed_giant
  - type: sphere
    at: [16, 14, 0]
    radius: 10
    line_width: 0.5
    spin: 8
    fill:
      effect:
        preset: ice_giant
  - type: sphere
    at: [48, 14, 0]
    radius: 10
    line_width: 0.5
    spin: 8
    fill:
      effect:
        preset: storm_giant
  - type: sphere
    at: [-48, -14, 0]
    radius: 10
    line_width: 0.5
    spin: 8
    fill:
      effect:
        preset: clouds
  - type: sphere
    at: [-16, -14, 0]
    radius: 10
    line_width: 0.5
    spin: 8
    fill:
      effect:
        preset: lava
  - type: sphere
    at: [16, -14, 0]
    radius: 10
    line_width: 0.5
    spin: 8
    fill:
      effect:
        preset: ice
  - type: sphere
    at: [48, -14, 0]
    radius: 10
    line_width: 0.5
    spin: 8
    fill:
      effect:
        preset: terran
```

| `preset` | Looks like | Built on |
|---|---|---|
| `gas_giant` | Jupiter: orange and cream belts, stormy edges | `bands` |
| `ringed_giant` | Saturn: pale gold belts, calm | `bands` |
| `ice_giant` | Uranus: pale blue, faint belts | `bands` |
| `storm_giant` | Neptune: deep blue belts, streaked | `bands` |
| `clouds` | Venus from space: a cream cloud deck, slowly churning | `bands` |
| `lava` | Dark crust with glowing cracks | `contour` |
| `ice` | White and pale blue ice | `contour` |
| `rocky` | Grey highlands and plains | `contour` |
| `terran` | Oceans, land and ice caps | `contour` |

## Warp and dust

**A fly-to with `warp` streaks the stars past the camera, and `backdrop.dust` fills the space round the camera with faint particles that show depth on every move.** The streaks grow with the camera's speed and shrink back to stars as it lands.

- Turn warp on for every fly-to with `camera.warp: true`, for one view with `warp: true` in that view (a point's or object's `view` takes it too), or for one action with `warp: true` on its `fly-to` (or the [`lcards.fly_to`](/configuration/ha-actions#lcards-fly-to) action); `false` there turns it off.
- The streaks follow how fast the camera moves for its distance from what it looks at, so a hop between planets streaks as a jump across the galaxy does.
- The dust stays put as the camera moves, unlike the stars at infinity, and streaks in a warp too. It has no edge: particles fade out at `radius` from the camera and new ones fade in ahead as it travels, and coming back to a place shows the same dust.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  view: far
  fly_duration: 2400
  views:
    far:
      target: [0, 0, 0]
      yaw: 20
      tilt: 20
      distance: 600
    near:
      target: [40, 5, 30]
      yaw: 30
      tilt: 10
      distance: 25
      warp: true
  buttons: true
backdrop:
  stars:
    count: 4000
    max_radius: 1.4
    spectrum: true
  dust:
    count: 1500
points:
  # tap the label to warp in
  - id: core
    xyz: [0, 0, 0]
    label: GALACTIC CORE
    style: title
    tap_action:
      action: fly-to
      view: near
objects:
  - type: grid
    shape: disc
    radius: 100
    pattern: polar
    line_spacing: 10
    spoke_count: 36
    opacity: 0.6
  # tap the glow to fly back out
  - type: glow
    at: core
    size: 50
    color: var(--lcars-yellow)
    tap_action:
      action: fly-to
      view: far
```

::: details More about warp and dust
- **Following a toggle:** `camera.warp` with an `entity` makes fly-tos streak while it is on (`on`, `true`, `yes`, `engaged`, `open`, `home`, or a number above 0), such as an `input_boolean`.
- **Spectrum:** `backdrop.stars.spectrum: true` splits each streak into colour, as a Doppler shift of the star's own colour: violet toward the tail (nearer the direction of flight) and red toward the head. White stars show the whole rainbow; a blue star streaks green to violet, its tail fading as it shifts past violet, and a red star the other way. `spectrum.direction: reverse` puts violet at the head instead.
- **Denser dust:** a smaller `radius` is denser and shows depth on smaller moves.
- **Reduced motion:** nothing streaks.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `camera.warp` | boolean / object | `false` | Every fly-to streaks the stars and dust; a view's own `warp` wins |
| `camera.warp.entity` | string | - | Fly-tos streak while this entity is on |
| `camera.warp.attribute` | string | - | Read this attribute instead of the state |
| `camera.views.<name>.warp` | boolean | `camera.warp` | Streak on the way to this view |
| `backdrop.stars.streak` | number | `1` | How long the streaks are, a multiple of the usual length. `0`: never |
| `backdrop.stars.spectrum` | boolean / object | off | Split each streak into colour |
| `backdrop.stars.spectrum.direction` | string | `doppler` | `doppler`: violet toward the tail. `reverse`: violet toward the head |
| `backdrop.dust` | boolean / object | off | Depth dust round the camera: `true`, or the keys below |
| `backdrop.dust.count` | number | `800` | How many particles (about half are within reach of the camera at any time) |
| `backdrop.dust.radius` | number | 1.5 times the scene's radius | How far round the camera the dust reaches, scene units |
| `backdrop.dust.min_radius` | number | `0.4` | Smallest particle radius, px |
| `backdrop.dust.max_radius` | number | `1` | Largest particle radius, px |
| `backdrop.dust.brightness` | `[min, max]` | `[0.35, 1]` | Each particle's brightness is picked between these |
| `backdrop.dust.color` | colour | `var(--lcards-moonlight)` | Particle colour |
| `backdrop.dust.colors` | list | - | Several colours, picked per particle. Wins over `color` |
| `backdrop.dust.opacity` | number | `1` | Fades the whole dust layer, `0` to `1` |
| `backdrop.dust.seed` | number | `7` | The same seed places the same dust |
| `backdrop.dust.spectrum` | boolean / object | off | Split the dust's streaks into colour, as on the stars |

### Going to warp

**`warp` on the card sends the ship to warp where it is: the scene's own backdrop stars and dust streak along the view, and the [warp starfield](/core/effects/background-animations/preset-reference#warp-starfield) streams past behind the scene.** `false` drops out of warp again; both `warp` and `warp_factor` can follow entities, so a toggle and a slider make an ENGAGE button and a warp factor control.

- `warp` reads `on`, `true`, `yes`, `engaged`, `open`, `home` or a number above 0 as engaged.
- Going to warp takes about two seconds, dropping out a little less; a change of warp factor eases too.
- `camera.warp` is different: it streaks the stars only while a fly-to moves the camera.

```yaml live controls
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 10
      distance: 120
backdrop:
  stars:
    count: 3000
    spectrum: true
  dust:
    count: 1500
# at warp while the toggle is on: tap ENGAGE
warp:
  entity: input_boolean.demo_toggle
# the warp factor from a slider, 1 to 9.9
warp_factor:
  entity: input_number.lcards_test_power
  output: [1, 9.9]
points:
  - id: engage
    xyz: [0, 0, 0]
    marker: square
    style: major
    label: ENGAGE (TAP)
    tap_action:
      action: toggle
      entity: input_boolean.demo_toggle
```

::: details More about going to warp
- **With spectrum:** with `backdrop.stars.spectrum`, the backdrop streaks are in colour.
- **Reduced motion:** nothing streams.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `warp` | boolean / object | `false` | Go to warp. `false` drops out |
| `warp.entity` | string | - | At warp while this entity is on |
| `warp.attribute` | string | - | Read this attribute instead of the state |
| `warp_factor` | number | `6` | How long the streaks grow and how fast they stream, `1` to `9.9`. Can [follow an entity](./data#settings-from-entities) |

## Cost

**A still effect costs nothing between frames, because a still scene draws nothing; an effect that moves costs a little on every frame.** Most scenes stay well inside the time a smooth frame allows.

- A volume nebula costs more than puffs, and a little more again seen from inside the gas. A `shape`, `stretch`, `core.color` or dust adds a little on top.
- The Badlands are the costliest effect, most of all from inside with columns and `veins`; their lightning adds little.
- The Nexus costs little more than a plain volume nebula.
- The nebula and fill shaders load in a small extra download the first time a card uses one.
