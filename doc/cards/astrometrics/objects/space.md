---
description: "Astrometrics card space phenomena: nebulae, asteroid belts, single asteroids, comets, spiral galaxies and the Crystalline Entity."
---

# Space Phenomena

Things space is full of: gas clouds, asteroid belts and single rocks, comets, galaxies and the Crystalline Entity. The keys every object takes (`id`, `at`, `rotation`, `spin`, `opacity` ...) are on the [Objects](../objects#keys-every-object-takes) page. In the diagram [look](../index#looks-diagram-and-realistic), a belt, an asteroid, a comet, a galaxy, the Crystalline Entity and a volume nebula are drawn as wireframes.

## nebula

**Clouds of gas in the scene, in the look of the nebula background preset.** Use it for a nebula on a star map, a gas cloud round a station, or a storm to fly into.

- The clouds are soft puffs that face the camera at slightly different depths, so they shift against each other as the camera turns, and fade as you fly into them.
- `render: volume` draws the same clouds as one body of gas you can fly into. Only a volume nebula takes `shape`, `dust`, `density` and `lightning`.
- A preset starts you from a named nebula: `badlands` and `badlands_voyager` (the plasma storms of Deep Space Nine and Voyager) or `nexus` (the ribbon from Star Trek Generations). Every key you set wins over the preset's.
- The [Effects](../effects#nebula) page has the full guide with more examples: shapes, dust lanes, the Badlands and the Nexus.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 20
      distance: 260
backdrop:
  stars:
    count: 2000
objects:
  # puffs (the default)
  - type: nebula
    at: [-75, 0, 0]
    radius: 70
    count: 6
    seed: 5
    drift: 3
    min_radius: 20
    max_radius: 40
    colors: [var(--lcars-violet), var(--lcars-ice)]
  # the same kind of clouds as gas you can fly into
  - type: nebula
    render: volume
    at: [75, 0, 0]
    radius: 70
    count: 6
    seed: 5
    drift: 3
    colors: [var(--lcars-orange), var(--lcars-red)]
```

::: details More about nebulae
- **Never tappable:** clouds never catch a tap, so they never get in the way of points behind them. To label a cloud, put a [point](../points) at the same place.
- **Hand-placed clouds:** each entry in `clouds` takes `xyz` (scene units from the object), `radius`, `color`, `opacity`, `size: [width, height, depth]` with `rotation: [x, y, z]` for an ellipsoid, and `dust: true` for a dark dust cloud (volume only). See [Shapes, dust and colour](../effects#shapes-dust-and-colour).
- **Presets and your own box:** a preset's box is 500 across (the Nexus: 2000 long). With a `size` of your own, the preset's `drift` and ribbon speed scale with it, so the gas moves as fast for its size; a drift or speed you set stays as written.
- **Entities:** `drift` and `density` can [follow an entity](../data#settings-from-entities); they ease to each new value.
- **Reduced motion:** the gas holds still.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `radius` | number | `100` | The clouds fill a ball this big round `at`, scene units |
| `size` | number / `[w, h, d]` | - | Or a box, scene units (one number for a cube). Wins over `radius` |
| `count` | number | `4` | How many clouds the seed places, 1 to 10 |
| `seed` | number | `1` | The same seed always places the same clouds |
| `clouds` | list | - | Clouds placed by hand (up to 10), instead of `count` and the seed |
| `colors` | colour / list | `var(--lcars-violet)` | One colour, or a list the seed picks from per cloud |
| `min_radius` | number | 0.15 of the region | Smallest cloud radius, scene units. 0.25 with `render: volume` |
| `max_radius` | number | 0.4 of the region | Largest cloud radius, scene units. 0.55 with `render: volume` |
| `brightness` | `[min, max]` | `[0.3, 0.8]` | Each cloud's opacity is picked between these. A cloud's own `opacity` wins |
| `turbulence` | number | `0.5` | How ragged the edges are, `0` to `1` |
| `noise_scale` | number | about 1.5 cells a cloud | Detail of the gas per scene unit: lower is larger, smoother wisps |
| `drift` | number / `[x, y]` | `0` | How fast the gas churns, scene units per second. `[x, y]` gives a direction. `0` is still |
| `stretch` | number | `0` | How drawn out each seeded cloud is, `0` (round) to `1` (long and flat), each turned its own way |
| `core.color` | colour | - | A colour deep in the gas, running out to the cloud colours at the edges |
| `blend` | string | `add` | `add`: light adds up. `normal`: drawn over what is behind |
| `render` | string | `puffs` | `puffs`, or `volume`: [gas you can fly into](../effects#gas-you-can-fly-into) |
| `density` | number | `1` | `render: volume`: how thick the gas is (`2` is twice as thick) |
| `shape` | string | `clouds` | `render: volume`: the form of the gas: `clouds`, `shell`, `bipolar`, `filaments`, `cavity`, `layers` or `wake`. See [Shapes, dust and colour](../effects#shapes-dust-and-colour) |
| `dust.count` | number | `0` | `render: volume`: dark dust clouds the seed lays across the gas, 0 to 4 |
| `dust.amount` | number | `0.8` | How dark the dust is, `0` to `1` |
| `dust.color` | colour | black | The dust's colour |
| `preset` | string | - | `badlands`, `badlands_voyager` or `nexus`. See [the Badlands](../effects#the-badlands-layers-columns-and-lightning) and [the Nexus](../effects#the-nexus-a-ribbon-and-its-wake) |
| `gap`, `veins`, `band`, `columns` | | | `shape: layers`: see [the Badlands](../effects#the-badlands-layers-columns-and-lightning) |
| `ribbon`, `wake` | | | `shape: wake`: see [the Nexus](../effects#the-nexus-a-ribbon-and-its-wake) |
| `lightning` | boolean / object | `false` | `render: volume`: strikes in the gas that light it, with the [lightning object's](./lines#lightning) keys |

## belt

**An asteroid belt: a band of low-poly rocks round its centre.** Use it round a star or a planet, or as a field of rocks to fly through.

- `at` is the centre: a point id or `[x, y, z]`. A point id makes the belt follow a star or planet when it moves.
- The belt is lit from its centre, as by its star: the side of each rock facing the centre is bright, the far side dark.
- The rocks are one draw, so thousands of them are fine. `rotation` tilts the belt and `spin` turns it as one piece.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 22
      distance: 150
points:
  - id: sun
    xyz: [0, 0, 0]
    label: SOL
    style: minor
objects:
  - type: glow
    at: sun
    size: 40
    color: var(--lcars-yellow)
  - type: sphere
    at: sun
    radius: 6
    fill:
      color: var(--lcars-yellow)
    color: var(--lcars-orange)
    line_spacing_deg: 30
  - type: belt
    at: sun
    radius: [45, 62]
    count: 1500
    size: [0.3, 1.8]
    period: 40
    colors:
      - var(--lcards-gray-light)
      - var(--lcards-gray-medium)
      - var(--lcards-yellow-dark)
```

Close up, the rocks are rough and faceted:

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [50, 0, 0]
      yaw: 250
      tilt: 10
      distance: 16
objects:
  - type: glow
    size: 30
    color: var(--lcars-yellow)
  - type: belt
    radius: [44, 56]
    thickness: 4
    count: 1500
    size: [0.2, 1.6]
    tumble: 20
    color: var(--lcars-khaki)
```

::: details More about belts
- **Orbits:** with `period`, the rocks at the inner edge go round once in that many seconds, and the outer rocks take longer, as real orbits do.
- **Entities:** `radius` (each edge too), `thickness` and `count` can [follow an entity](../data#settings-from-entities). They change in place and ease: the band widens, thins or fills round the same rocks.
- **From far away:** when even the largest rocks would be under about 1.5 px, the rocks are drawn as dots of the same size and shade (cheaper, and it looks the same). Zoom in and they are rocks again.
- **Reduced motion:** `period` and `tumble` hold still.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `radius` | number / `[inner, outer]` | `[80, 100]` | The band's inner and outer radius, scene units. One number is the outer radius, and the inner is 0.8 of it |
| `thickness` | number | 0.15 of the band's width | How far the rocks spread above and below the plane, scene units |
| `count` | number | `600` | How many rocks, at most 5000 |
| `size` | number / `[smallest, largest]` | `[0.4, 1.6]` | Rock size, scene units: many small ones and a few large. One number is the largest, and the smallest is a quarter of it |
| `seed` | number | `1` | A different number gives a different belt; the same config always gives the same one |
| `period` | number | `0` | Seconds for the inner edge to go round once. `0` is still |
| `tumble` | number | `30` | How fast each rock turns on its own axis, degrees per second (each a little faster or slower). `0` is still |
| `color` | colour | `var(--lcards-gray-light)` | The rocks' colour, varied a little per rock |
| `colors` | list | - | Several rock colours: each rock takes one, picked by the seed. Wins over `color` |

## asteroid

**One rock for a close look: a single asteroid, a moonlet, a rock by a station.** For many rocks round a centre, use a [belt](#belt).

- Set `light` to its star (a point id or `[x, y, z]`). The side facing it is lit and the far side dark, with a hard edge between them.
- `tumble` turns it on its own axis; `spin`, `face` and `rotation` turn it as they turn any object.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 30
      tilt: 12
      distance: 30
points:
  - id: sun
    xyz: [-70, 20, 40]
  - id: rock_label
    xyz: [0, 9, 0]
    label: 433 EROS
    style: minor
objects:
  - type: glow
    at: sun
    size: 14
    color: var(--lcars-yellow)
  - type: asteroid
    id: eros
    size: 16
    seed: 4
    tumble: 12
    light: sun
```

::: details More about asteroids
- **The shape:** the rock has broad lumps, craters and fine roughness, stretched its own way, with flat faces that catch the light.
- **From far away:** when it would be under about 1.5 px, it is drawn as a dot, as bright as its lit part seen from where you are.
- **Reduced motion:** `tumble` holds still.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `size` | number | `4` | Largest extent, scene units |
| `seed` | number | `1` | A different number gives a different rock; the same config always gives the same one |
| `tumble` | number | `10` | How fast it turns on its own axis (picked by the seed), degrees per second. `0` is still |
| `light` | id / `[x, y, z]` | the frame's origin | Where the light comes from: a point id (a star that moves too) or `[x, y, z]`. Left out, the scene's origin, or the star of the [system](../scale#the-system-object) it is in |
| `color` | colour | `var(--lcards-gray-light)` | The rock's colour on its lit side |
| `occlude` | boolean | `true` | Hide labels and cards behind it |

## comet

**A comet: a small dark nucleus, a glowing coma round it and two tails that always point away from its star.** Use it on an orbit through a star system, or as a single visitor in a close-up.

- Set `light` to the star (a point id or `[x, y, z]`). The tails point away from it and the nucleus is lit from it.
- There are two tails: a straight, bluish ion tail and a broader dust tail that bends back along the comet's path as it moves.
- `activity.mode: distance` makes the comet grow and brighten near its star and fade away from it.
- `face`, `spin` and `rotation` turn the nucleus, never the tails.

On an orbit centred off its star, this comet swings in, grows its tails and brightens, then fades as it swings out:

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v:
      target: [30, 0, 0]
      yaw: 0
      tilt: 55
      distance: 330
points:
  - id: sun
    xyz: [0, 0, 0]
    label: STAR
    style: minor
  - id: comet_at
    polar: [100, 300]
    object: orbit
objects:
  - type: glow
    at: sun
    size: 40
    color: var(--lcars-yellow)
  - type: ring
    id: orbit
    at: [75, 0, 0]
    radius: 100
    spin: 10
    width: 1
    color: theme:colors.ui.secondary
    opacity: 0.4
  - type: comet
    at: comet_at
    light: sun
    tail:
      length: 90
    coma:
      size: 8
    activity:
      mode: distance
      range: [25, 175]
```

::: details More about comets
- **Activity by distance:** with `activity.mode: distance`, the coma, the tails and the glow are scaled every frame: full at the near end of `range` and closer, falling with the square of the distance, and gone at the far end.
- **Entities:** `nucleus.size`, `coma.size`, `tail.length` and `glow` can [follow an entity](../data#settings-from-entities); they change in place.
- **Motion:** the tails stream with the scene clock. Under reduced motion they hold still, and so does the nucleus's tumble.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `light` | id / `[x, y, z]` | the frame's origin | The star: a point id or `[x, y, z]`. Left out, as for an [asteroid](#asteroid) |
| `color` | colour | `var(--lcards-moonlight)` | The coma and the dust tail, unless they set their own |
| `nucleus.size` | number | `2` | The nucleus's largest extent, scene units |
| `nucleus.color` | colour | `var(--lcards-gray-medium-dark)` | The nucleus's colour |
| `nucleus.tumble` | number | `10` | How fast the nucleus turns, degrees per second. `0` is still |
| `coma.size` | number | `10` | The diameter of the glowing cloud round the nucleus, scene units |
| `coma.color` | colour | `color` | The coma's colour |
| `tail.length` | number | `60` | How far the tails reach away from the star, scene units. The dust tail fades sooner |
| `ion_tail` | boolean / object | `true` | The straight ion tail. `false` turns it off |
| `ion_tail.color` | colour | `var(--lcards-blue-medium)` | The ion tail's colour |
| `dust_tail` | boolean / object | `true` | The broad dust tail. `false` turns it off |
| `dust_tail.color` | colour | `color` | The dust tail's colour |
| `glow` | number | `1` | Opacity of the coma and the tails, `0` to `1`. The nucleus stays |
| `activity.mode` | string | `fixed` | `fixed`: as set. `distance`: grows and brightens near its star |
| `activity.range` | `[near, far]` | `[50, 300]` | With `mode: distance`: full at `near` and closer, gone at `far`, scene units (the system's, in a system) |
| `seed` | number | `1` | A different number gives a different nucleus and tails |

## galaxy

**A spiral galaxy in 3D, made of seeded stars. By default it is the Milky Way.** Use it as the map behind a galaxy-scale scene, with your points on it.

- Everything scales with `radius`: 50,000 by default, which is light years with `units: ly`.
- The Sun's place is 0.52 of the radius toward bearing 180 (`polar: [26000, 180]` at the default size), where a scene puts its Sol point.
- `arms.count` (1 to 8) makes a generic spiral of equal arms instead of the Milky Way.
- Every star is at its own place, so the galaxy shows parallax as you fly through it.

```yaml live
type: custom:lcards-astrometrics-card
height: 360
units: ly
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 40
      distance: 120000
points:
  - id: sol
    polar: [26000, 180]
    marker: dot
    label: SOL
objects:
  - type: galaxy
    stars:
      count: 30000
```

::: details More about the galaxy
- **What it is made of:** the stars are points of light at any distance, as the backdrop's, along a central bar, a bulge, spiral arms and a thin disc. A soft glow runs along the arms and at the core, with darker dust lanes on the arms' inner edges.
- **The Milky Way:** the default has the bar, the two major arms (Scutum-Centaurus and Perseus) from its ends, the two minor arms (Sagittarius and Norma) between them, and the Orion spur where the Sun is.
- **The bar:** the arms start at the ends of the bar and turn with it when you change `bar.angle`.
- **From far away:** fewer of the stars draw.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `radius` | number | 50,000 light years | The disc's radius: `50000` in plain scene units or `ly`, converted for other named [units](../scale#units) |
| `thickness` | number | `0.02` | The disc's thickness as a fraction of the radius, up to `0.5` |
| `arms.count` | number | - | A spiral of this many equal arms, 1 to 8. Leave it out for the Milky Way |
| `arms.pitch` | number | `12` | How tightly the arms wind, degrees, 4 to 45. Larger opens them |
| `arms.color` | colour | `var(--lcars-blue)` | The colour the arm stars lean toward, and the arms' glow |
| `bar.length` | number | `0.32` | The bar's half-length as a fraction of the radius, up to `0.8`. `0` is no bar |
| `bar.angle` | number | `153` | The bearing of the bar's near end, degrees: 27 degrees off the line to the Sun, as in the Milky Way |
| `stars.count` | number | `40000` | How many stars, at most 100,000 |
| `stars.color` | colour | `var(--lcards-moonlight)` | The stars' base colour |
| `seed` | number | `3` | A different number gives a different scatter of stars |
| `core.color` | colour | `var(--lcars-yellow)` | The bulge and bar stars and the core's glow |
| `glow` | number | `0.6` | Opacity of the glow along the arms and at the core, `0` to `1`. `0` is none |
| `dust.amount` | number | `0.5` | Opacity of the dust lanes, `0` to `1`. `0` is none |
| `dust.color` | colour | the background colour | The dust lanes' colour |

## crystalline

**The Crystalline Entity (Star Trek: The Next Generation, "Datalore" and "Silicon Avatar"), made in code.** Use it beside a ship or a planet for an encounter scene.

- `size` is its height along the spine (the object's y axis). It fits inside a spindle `size` tall and 0.8 of that across.
- It needs no light: it is lit from inside by its core. It is see-through, so it hides no labels.
- `spin` turns it slowly about its spine; `face` and `rotation` turn it as they turn any object.

The example puts the Constitution-class ship beside it at its real size (305 m, in a scene in [`units: km`](../scale#units)), and a beam from the entity's core to the ship:

```yaml live
type: custom:lcards-astrometrics-card
height: 380
units: km
camera:
  views:
    v:
      target: [-0.8, 0, 0]
      yaw: 0
      tilt: 5
      distance: 5
points:
  - id: entity_at
    xyz: [0, 0, 0]
  - id: ship_at
    xyz: [-2.1, -0.1, 0.3]
    label: USS ENTERPRISE
    style: minor
objects:
  - type: crystalline
    id: entity
    at: entity_at
    spin: 2
  - type: model
    id: ship
    src: builtin:constitution_class_refit
    at: ship_at
  - type: beam
    from: entity_at
    to: ship_at
    width: 10
    color: var(--lcards-moonlight)
    pulse: true
```

::: details More about the Crystalline Entity
- **The shape:** a glowing faceted spine along the object's y axis, a starburst core at its middle with crystal spikes round it, and branches in tiers round the spine that fork again and again, bending a little at each joint and ending in Y-shaped tips and thorns.
- **The crystal:** glassy and see-through, lit from inside by the core, with bright edges. The same `seed` always gives the same entity.
- **Its size:** no canon size exists. The production design was two or three Enterprise-D lengths (642 m each), and on screen it dwarfs the ship, so the default is 3 km.
- **From far away:** when it would be under about 10 px tall, it is drawn as a dot in the core colour. Nearer, the finer forks draw only once it is large enough on screen to show them.
- **Entities:** `glow` and `opacity` can [follow an entity](../data#settings-from-entities) in place, and a new `color` crossfades in as every object's does.
- **Reduced motion:** the core's pulse and the spin hold still.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `size` | number | 3 km | Height along the spine: `3` with `units: km`, converted for other named units, `3000` in plain scene units |
| `seed` | number | `7` | A different number gives a different branching |
| `branches` | number | `4` | How many times the branches fork, 1 to 5. Each level is smaller; the last are thorns |
| `color` | colour | `var(--lcards-blue-medium)` | The crystal's colour; its edges lean toward the core colour. `var(--lcars-african-violet)` gives the lavender of the show |
| `glow` | number | `0.7` | How brightly the core shines and how far its light reaches, `0` to `1`. `0`: a dim core and only the edges lit. `1`: a large bright core lighting the inner branches |
| `opacity` | number | `1` | `0` to `1` |
| `blend` | string | `add` | `add`: overlapping crystal glows. `normal`: drawn over what is behind it |
| `core.color` | colour | `var(--lcards-moonlight)` | The starburst's rays and the light along the spine |
| `core.period` | number | `6` | Seconds per slow pulse of the core. `0` holds it steady |
