---
description: "Astrometrics card objects: which object type to use for a planet, grid, territory, route, nebula, ship or galaxy, and the keys every object takes (placement, facing, distance)."
moved_anchors:
  grid: /cards/astrometrics/objects/surfaces#grid
  wells-and-wormholes: /cards/astrometrics/objects/surfaces#wells-and-wormholes
  deformed-grids: /cards/astrometrics/objects/surfaces#deformed-grids
  sector-maps: /cards/astrometrics/objects/surfaces#sector-maps
  volume: /cards/astrometrics/objects/surfaces#volume
  sphere: /cards/astrometrics/objects/surfaces#sphere
  built-in-planet-maps: /cards/astrometrics/objects/surfaces#built-in-planet-maps
  ring: /cards/astrometrics/objects/surfaces#ring
  path: /cards/astrometrics/objects/lines#path
  beam: /cards/astrometrics/objects/lines#beam
  trail: /cards/astrometrics/objects/lines#trail
  lightning: /cards/astrometrics/objects/lines#lightning
  glow: /cards/astrometrics/objects/lines#glow
  nebula: /cards/astrometrics/objects/space#nebula
  belt: /cards/astrometrics/objects/space#belt
  asteroid: /cards/astrometrics/objects/space#asteroid
  comet: /cards/astrometrics/objects/space#comet
  galaxy: /cards/astrometrics/objects/space#galaxy
  crystalline: /cards/astrometrics/objects/space#crystalline
  model: /cards/astrometrics/objects/ships#model
  real-size: /cards/astrometrics/objects/ships#real-size
  visible-size: /cards/astrometrics/objects/ships#visible-size
  built-in-models: /cards/astrometrics/objects/ships#built-in-models
  cube: /cards/astrometrics/objects/ships#cube
  image: /cards/astrometrics/objects/surfaces#image
  system: /cards/astrometrics/scale#the-system-object
---

# Objects

**`objects` is the list of what the scene draws: planets, grids, routes, nebulas, ships.** Each object has a `type`, and its other keys depend on the type.

- Pick a type in [Which type for what](#which-type-for-what); each links to its keys on one of the four pages below.
- Positions, sizes and distances are in scene units, set by the card's `units` ([Scale](./scale#units)). Line widths and dashes are in px.

| Page | Types |
|---|---|
| [Grids, Spheres and Volumes](./objects/surfaces) | grid, volume, sphere, ring, image |
| [Lines and Light](./objects/lines) | path, beam, trail, lightning, glow |
| [Space Phenomena](./objects/space) | nebula, belt, asteroid, comet, galaxy, crystalline |
| [Ships and Stations](./objects/ships) | model, cube |

<CardGallery set="astro-objects" />

## Which type for what

**The type to use for each thing you might want in the scene.** Each name links to its keys.

| You want | Use |
|---|---|
| A planet, moon or globe (solid, hides what is behind it, can wear a map) | [`sphere`](./objects/surfaces#sphere) |
| A wireframe: a sector map, a galaxy disc, a sky dome, a see-through ball, a tube, a gravity well | [`grid`](./objects/surfaces#grid) |
| A territory or region of space (see-through cells: a box, a pie slice or any outline) | [`volume`](./objects/surfaces#volume) |
| An orbit, a range ring, a rim | [`ring`](./objects/surfaces#ring) |
| A route through points, an arched route, the sun's track | [`path`](./objects/lines#path) |
| A weapon, transporter or sensor beam (a glowing straight line) | [`beam`](./objects/lines#beam) |
| Where a moving point has been (a fading line behind a ship or planet) | [`trail`](./objects/lines#trail) |
| A star, a galactic core, a beacon (a soft light) | [`glow`](./objects/lines#glow) |
| Clouds of gas | [`nebula`](./objects/space#nebula) |
| An asteroid belt (a band of rocks round a centre) | [`belt`](./objects/space#belt) |
| One asteroid up close (a tumbling rock, lit from its star) | [`asteroid`](./objects/space#asteroid) |
| A comet (a nucleus, a glowing coma and tails pointing away from its star) | [`comet`](./objects/space#comet) |
| A spiral galaxy (stars, arms, a bar and dust; the Milky Way by default) | [`galaxy`](./objects/space#galaxy) |
| Your own picture on the plane | [`image`](./objects/surfaces#image) |
| A ship, a station, any 3D model | [`model`](./objects/ships#model) |
| A Borg cube (or a plain shaded box) | [`cube`](./objects/ships#cube) |
| The Crystalline Entity (a glowing crystal spine and branches round a starburst core) | [`crystalline`](./objects/space#crystalline) |
| Lightning: bolts that flash and go, or held flickering columns (lights the gas of a volume nebula it strikes in) | [`lightning`](./objects/lines#lightning) |
| A star system at true scale inside a larger scene (its own points and objects, in units of its own) | [`system`](./scale#the-system-object) |

## Keys every object takes

**These keys work on every type: where the object sits, how it is turned, when it shows and what a tap does.**

- Colours take theme tokens (`theme:colors.ui.primary`), CSS variables (`var(--lcars-blue)`) or plain colours.
- Under reduced motion, moving parts (spin, pulses, drifting gas, strikes) stop; each type says what it shows instead. Moving effects are on the [Effects](./effects) page.

```yaml live
type: custom:lcards-astrometrics-card
height: 280
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 30
      distance: 110
points:
  - id: planet
    xyz: [25, 0, 0]
    label: PLANET
    style: minor
objects:
  - type: sphere
    at: planet
    radius: 6
  # sits at a point, tipped over and spinning
  - type: ring
    id: rings
    at: planet
    radius: 14
    rotation: [30, 0, 0]
    spin: 30
    color: var(--lcars-orange)
  # half see-through, with a tag for rules
  - type: grid
    shape: sphere
    at: [-25, 0, 0]
    radius: 15
    opacity: 0.5
    tags: [survey]
```

::: details More about keys every object takes
- **Looks:** an object without `look` shows in every look, and one with a diagram form switches its parts with the look: a mapped sphere, a filled grid, a glow, cube, asteroid, belt, comet, galaxy, crystalline entity or volume nebula shows its wireframe in the diagram look, and a model with its own materials shows as a hologram. A ring drawn as a line, and a path, hide in the realistic look. `look: all` shows it in every look, as configured.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `id` | string | `type#n` | A name for points standing on it (`object`), rules and fly-to. The first grid is `grid#1` |
| `at` | id / `[x, y, z]` | the origin | Where it sits: a point id (it follows the point) or `[x, y, z]` |
| `rotation` | `[x, y, z]` | `[0, 0, 0]` | Turns it, degrees: y is a bearing, x tips it toward the camera, z rolls it |
| `spin` | number | `0` | Turns it round its own vertical axis, degrees per second. Points on it turn with it |
| `face` | string | - | `motion`: [face the way it goes](#facing-the-way-it-goes). A point id: [face that point](#facing-a-point) |
| `look` | string | every look | `diagram`, `realistic` or `all`: which [look](./#looks-diagram-and-realistic) of the card shows it (`mixed` shows both) |
| `opacity` | number | `1` | `0` to `1`. Some types start lower (a model `0.85`, a glow `0.9`) |
| `visible` | boolean | `true` | `false` hides it; its points still work |
| `max_distance`, `min_distance`, `fade` | | | Shown only within a camera distance: see [Distance](#distance) |
| `hide_in_systems` | boolean / list | `false` | `true` hides it while the camera is inside a [star system](./scale#star-systems), so galaxy-scale volumes and lines step aside in the close-ups. A list of system ids hides it in those only |
| `tags` | list | - | Tags for [rules](./data#rules): a rule on `tag:<name>` changes every object with the tag |
| `tap_action`, `hold_action` | action | - | What a tap or a hold does, as on [points](./points#actions). An object without a `tap_action` is not tappable |
| `view` | object | - | Where the camera lands when it flies to the object: `distance`, `tilt`, `yaw`, `warp`. Keys left out keep the current ones; the distance defaults to a close-up |

### Facing the way it goes

**`face: motion` turns an object to face where its point is going: a ship rides its orbit nose first.**

- The object needs `at:` a moving point. Without `face`, the object slides along keeping its own turn.
- The bow is +z on every built-in model. A model file with its bow along +x needs `rotation: [0, 90, 0]`.

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
  - id: ship
    polar: [40, 90]
    object: orbit
    label: ENTERPRISE
    style: tiny
objects:
  - type: ring
    id: orbit
    radius: 40
    spin: 12
    width: 0.5
    opacity: 0.4
  - type: model
    at: ship
    src: builtin:constitution_class_refit
    size: 8
    face: motion
  - type: trail
    point: ship
    length: 4
    width: 2
```

::: details More about facing the way it goes
- **Level flight:** the object's top stays up, so a ship stays level. `rotation` applies on top, in the object's own frame.
- **Where the heading comes from:** the point's movement however it moves (a spinning ring, an entity, a rule), measured on the object the point stands on. A ship on a ring round a planet that is itself on an orbit faces round the planet, not along the planet's way.
- **Before it moves:** before the point first moves, and under reduced motion (which holds spin), a point on a spinning object faces along the spin. Anything else keeps its `rotation` until the point moves.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `face` | string | - | `motion`: turn the object's +z toward where its point is going, top up |

### Facing a point

**`face: <point id>` keeps an object turned toward a point, wherever it is (another star system, across the galaxy), as either moves.**

- Most objects turn their +z to the point, top up. Objects round an axis (a grid other than a plane, a ring, a belt, a galaxy) point their axis at it instead, so a ring lies face-on to it.
- A [well](./objects/surfaces#wells-and-wormholes)'s narrow end leads to the point it faces, and a wormhole is two wells facing each other.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 30
      distance: 130
points:
  - id: beacon
    polar: [45, 0]
    object: track
    marker: reticle
    label: BEACON
objects:
  - type: ring
    id: track
    radius: 45
    spin: 20
    opacity: 0.3
  # turns its +z (the bow) to the beacon
  - type: model
    src: builtin:constitution_class_refit
    size: 30
    face: beacon
  # turns its axis to the beacon, so it lies face-on to it
  - type: ring
    at: [0, 22, 0]
    radius: 8
    face: beacon
    color: var(--lcars-blue)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `face` | string | - | A point id: turn toward that point. `rotation` applies on top |

## Distance

**Show an object only within a range of camera distances: planets that appear as you zoom in.** Zoom into the star below: its planet and orbit appear as you close in, and the disc gives way.

- The distance is measured to the object's nearest edge, so a large grid does not vanish while you fly through it.
- To swap a model for a marker far away, give the model `max_distance: 60` and give a point with `marker: ship` (or `starbase`) `min_distance: 60`. Touching ranges cross-fade, so one stands in for the other.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 35
      distance: 420
points:
  - id: star
    xyz: [0, 0, 0]
    marker: dot
    label: SOL
    style: major
    min_distance: 140
  - id: earth
    polar: [30, 60]
    object: orbit
    label: EARTH
    style: minor
    max_distance: 150
objects:
  - type: glow
    size: 24
    color: var(--lcars-yellow)
  - type: ring
    id: orbit
    radius: 30
    color: var(--lcars-blue)
    spin: 6
    max_distance: 120
  - type: sphere
    at: earth
    radius: 2.5
    image: builtin:earth_blue_marble
    line_width: 0
    max_distance: 120
  # gives way as you close in
  - type: grid
    shape: disc
    radius: 90
    line_spacing: 30
    opacity: 0.6
    min_distance: 120
```

::: details More about distance
- **Points:** the keys are the same as on [points](./points#visibility).
- **Inside and above:** the distance is 0 when the camera is inside the object. A flat grid (`shape: plane` or `disc`, not deformed) is measured to its surface: above a galactic disc the distance is your height over it, so `min_distance` can hide the disc once you dive into a star system.
- **Out of range:** an object out of range is not drawn and cannot be tapped; its points keep their own ranges.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `max_distance` | number | - | Hidden when the camera is farther than this. It fades out over the next 10% of that distance |
| `min_distance` | number | - | Hidden when the camera is closer than this. It fades in over the 10% of that distance before it |
| `fade` | `[start, end]` | - | Fully shown nearer than `start`, gone past `end` |
