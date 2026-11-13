---
description: "True scale on the LCARdS Astrometrics card: real units (km, AU, light years), a star system in its own units inside a galaxy, diving from a galaxy to a station, distances in each part's own units, and the Studio and starters for it."
---

# Scale

**An [Astrometrics card](./) can be drawn to look right or to be right.** Both are the same card with the same keys.

- **Built to fit** (most [starters](./starters)): sizes and distances picked so everything shows at once. Planets are big enough to see from across their system, a station is a sizeable part of its planet. Easy to read, nothing to tune, and not to scale.
- **True scale:** the real numbers, so what you see is how it is: a solar system in km where planets are dots from across it, a galaxy in light years with a station 1.5 km across inside it. The close views are where it shines; you pick what shows from afar with the [distance](./objects#distance) keys.
- The **Solar system (real positions)** and **Galaxy to station at true scale** [starters](./starters) are ready-made true-scale scenes.

## Units

**`units` on the card names what one scene unit is, for real data: `m`, `km`, `au`, `ly` or `pc`.** Positions, sizes and distances are all in scene units; without a name they are your own.

- The name tells the card how a [star system](#star-systems) inside relates to the scene, draws a [model](./objects/ships#real-size) at its real size, places real bodies (`body:` points) at their real distances and gives a galaxy the Milky Way's radius in those units.
- It does not rescale what is already there: naming the units of a scene built in scene units only says what its numbers mean.
- Screen sizes (line widths, label sizes, marker sizes) are in px whatever the units, and a model's `length` is in metres. Every other length is in the units of the frame it is in: the scene's, or its [system's](#star-systems).
- In the [Studio](./start#the-studio) it is the **Units** section of the Scene tab, and the Studio shows the unit beside each length field (`units` when the scene names none).

```yaml live
type: custom:lcards-astrometrics-card
height: 300
# one unit is a km: the Earth below is 6,371 km in radius
units: km
camera:
  views:
    v:
      target: earth
      yaw: 200
      tilt: 15
      distance: 140000
backdrop:
  stars: true
points:
  - id: earth
    xyz: [0, 0, 0]
    label: EARTH
    style: major
objects:
  - type: sphere
    at: earth
    radius: 6371
    image: builtin:earth_blue_marble
  # a geostationary orbit, 42,164 km from Earth's centre
  - type: ring
    radius: 42164
    width: 1
    color: var(--lcars-blue)
```

::: details More about units
- **Each starter is in one set of units:**

| Starters | Units |
|---|---|
| Solar system (real positions) | km |
| Star Trek galaxy (and its Star Trek parts), Galaxy to station at true scale | ly (the station's system inside in km) |
| Every other scene | Scene units, built to fit |

- **Named units:** a part added to a scene (a planet, a belt, a comet, a nebula field, territories, the Badlands, the Nexus, the wormhole) starts at its real size: an Earth-sized planet one au out, the Badlands 10 ly across, the Nexus 1 ly long, the wormhole 40 km long, a comet 0.6 to 35 au from its star (Halley's). None of the three has a size on screen, so 10 ly, 1 ly and 40 km are plausible sizes, not canon.
- **Scene units, with something in the scene:** a part is sized to fit: about a quarter of the scene's size (a belt about half, out among the planets). The Nexus added to the Solar system starter is about 80 long, where Neptune's orbit is 160.
- **An empty scene:** a part keeps its own sizes.
- **Starbases and asteroids:** a starbase and a single asteroid keep their sizes in scene units (a model is drawn larger when it would be too small to see, [`model_scale`](./objects/ships#real-size)). What you type always wins.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `units` | string | - | What one scene unit is: `m` (metres), `km`, `au` (149,597,870.7 km), `ly` (light years) or `pc` (parsecs, 3.26 ly). Left out: scene units of your own |

## One scene in real units

**Build a scene with the real numbers and the card holds the whole range, from the whole system down to a station in front of Earth.** This one opens on Deep Space 9 4 km away, with Earth 42,000 km behind it and the Sun 150 million km further.

- **Depth:** the near station, Earth and the Sun draw in the right order. When one depth range cannot hold the view, the card draws it in slices, far to near; a scene built to fit draws in one pass.
- **Distance limits** follow the scene: you can zoom in to half its smallest object and out to 20 times its size (a scene built to fit keeps 1 to 100,000). [`camera.limits.distance`](./camera#camera-limits) sets your own.
- **Fly-to** over a long zoom moves evenly in log distance, so each factor of ten takes the same time, and zooming in the camera lines up on its target early instead of sweeping past it close up.
- **What to expect:** at true scale, planets are dots from across their system (Earth is 1/23,000 of its orbit), so give them markers and labels. The [distance](./objects#distance) keys still pick what shows when.

```yaml live
type: custom:lcards-astrometrics-card
height: 360
units: km
camera:
  view: station
  views:
    system:
      target: sun
      yaw: 40
      tilt: 35
      distance: 2100000000
    earth:
      target: earth
      yaw: 225
      tilt: 12
      distance: 70000
    station:
      target: ds9
      yaw: 330
      tilt: 6
      distance: 4
points:
  - id: sun
    xyz: [0, 0, 0]
    label: SOL
    style: major
    tap_action:
      action: fly-to
      view: system
  - id: earth
    polar: [149597870.7, 30]
    marker: dot
    label: EARTH
    tap_action:
      action: fly-to
      view: earth
  - id: ds9
    at: earth
    offset: [-21082, 0, 36515]
    label: DEEP SPACE 9
    style: tiny
objects:
  - type: glow
    at: sun
    size: 9000000
    color: var(--lcars-yellow)
  - type: sphere
    at: sun
    radius: 696340
    fill:
      color: var(--lcars-yellow)
  - type: ring
    radius: 149597870.7
    width: 1
    color: var(--lcars-blue)
  - type: sphere
    at: earth
    radius: 6371
    image: builtin:earth_blue_marble
  - type: model
    at: ds9
    src: builtin:deep_space_nine
    size: 1.452
    material: original
```

::: details More about real units
- **Orbit rings** add segments near the camera, so an orbit 150 million km across still passes through its planet seen from 70,000 km (an `orbit` ring adds them round its body).
:::

## Star systems

**A `system` object holds points and objects in units of their own, at a point of the scene: the galaxy in light years, Sol in km.** One set of units cannot hold a galaxy and a station: at 26,000 light years from the galactic core, numbers in light years are only good to about 30 km.

- Write each part with the numbers as published: star positions in ly or pc, orbits in AU or km, sizes in km.
- **Ids are card-wide:** views, `fly-to`, rules, templates and paths name a system's points and objects like any others.
- **Distances are in the owner's units:** a view's `distance` is in its target's units (the `station` view below is 4 km, the `galaxy` view 140,000 ly), and so are a point's or object's `fade`, `min_distance` and `max_distance`. A view with an `[x, y, z]` target, and `camera.limits`, are in scene units.
- **The camera follows:** within a few times its size of a system, the camera works in the system's units, so a station a few km across holds steady; further out it works in the scene's. Nothing on screen moves at the change, and a fly-to from the galaxy lands exactly on its target inside.

```yaml live
type: custom:lcards-astrometrics-card
height: 380
units: ly
camera:
  view: galaxy
  views:
    galaxy:
      target: core
      yaw: 20
      tilt: 35
      distance: 140000
    earth:
      target: earth
      yaw: 225
      tilt: 12
      distance: 70000
    station:
      target: ds9
      yaw: 330
      tilt: 6
      distance: 4
points:
  - id: core
    xyz: [0, 0, 0]
    label: GALACTIC CORE
    style: title
  # tap SOL to dive from the galaxy to Earth
  - id: sol
    polar: [26000, 200]
    alt: 60
    marker: dot
    label: SOL
    style: major
    tap_action:
      action: fly-to
      view: earth
objects:
  - type: grid
    shape: disc
    radius: 50000
    pattern: polar
    line_spacing: 5000
    spoke_count: 36
    min_distance: 20
  - type: glow
    at: core
    size: 30000
  # Sol, in km
  - type: system
    id: sol_system
    at: sol
    units: km
    points:
      - id: sun
        xyz: [0, 0, 0]
      - id: earth
        polar: [149597870.7, 30]
        marker: dot
        label: EARTH
        max_distance: 3000000000
      - id: ds9
        at: earth
        offset: [-21082, 0, 36515]
        label: DEEP SPACE 9
        style: tiny
        max_distance: 3000000
        tap_action:
          action: fly-to
          view: station
    objects:
      - type: glow
        at: sun
        size: 9000000
        color: var(--lcars-yellow)
      - type: sphere
        at: sun
        radius: 696340
        fill:
          color: var(--lcars-yellow)
      - type: ring
        radius: 149597870.7
        width: 1
        color: var(--lcars-blue)
      - type: sphere
        at: earth
        radius: 6371
        image: builtin:earth_blue_marble
      - type: model
        at: ds9
        src: builtin:deep_space_nine
        size: 1.452
        material: original
```

::: details More about star systems
- **Galaxy-scale things in the close-ups:** a region's walls or a quadrant line thousands of light years long would cross a close-up of a planet. `hide_in_systems: true` on a point or object hides it while the camera is inside any system (within a few times its size, where it works in the system's units); outside every system it shows as usual. A list of system ids (`hide_in_systems: [sol_system]`) hides it inside those systems only. The [Star Trek galaxy](./starters#star-trek-galaxy) starter sets it on its regions, lines and names.
- **One level:** a system cannot hold another system (it reaches from a galaxy down to a station already).
- **Not rotated:** a system's axes are the scene's.
- **The disc above:** Sol sits 60 ly above the disc, and `min_distance: 20` on the grid hides the disc once the camera is inside the system ([Distances](#distances)).
:::

### The system object

**`type: system` draws nothing itself: it holds `points` and `objects` written in its own units, at a point of the scene.**

- `units` inside a system needs the card's own `units`, so the card knows how the two relate. For units without a name, give `scale` instead: how many scene units one unit inside is.
- A system's objects can be any type but another `system`.

```yaml live
type: custom:lcards-astrometrics-card
height: 280
units: au
camera:
  views:
    v:
      target: star
      yaw: 20
      tilt: 35
      distance: 4
points:
  - id: star
    xyz: [0, 0, 0]
    label: STAR
    style: major
objects:
  - type: glow
    at: star
    size: 0.4
    color: var(--lcars-yellow)
  - type: ring
    radius: 1.5
    width: 1
    color: var(--lcars-blue)
  # a planet in km, 1.5 au out
  - type: system
    id: planet_system
    at: [0, 0, 1.5]
    units: km
    points:
      - id: planet
        xyz: [0, 0, 0]
        marker: dot
        label: PLANET
    objects:
      - type: sphere
        at: planet
        radius: 6000
        fill:
          color: var(--lcars-orange)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `id` | string | `system#n` | Its name |
| `at` | id / `[x, y, z]` | the origin | Where its origin sits: a point of the scene (it stays there), or `[x, y, z]` in scene units |
| `units` | string | the scene's | What one unit inside is: `m`, `km`, `au`, `ly` or `pc`. Needs the card's own `units` |
| `scale` | number | - | Scene units per unit inside, for units without a name. Wins over `units` |
| `points` | list | - | Its points, in its units ([Points](./points)) |
| `objects` | list | - | Its objects, in its units: any type but another `system` |
| `visible` | boolean | `true` | `false` hides everything in it (its points still work) |

## The real Solar System

**A point with `body: mars` sits where Mars really is at the scene date, on its real tilted, elliptical orbit.** A sphere with `body: mars` turns as Mars really does, and a ring with `orbit: mars` draws the real orbit. All three follow the [scene clock](#the-scene-clock).

- **Where:** the Sun sits at the origin of the point's frame (the scene, or its [system](#star-systems)), in that frame's units: set `units` (km or au; without it au is assumed, with a warning). A moon is placed from the Sun too (its planet plus its own orbit), so it sits by its planet's point. `center: jupiter` measures from another body instead, for a scene centred on a planet.
- **Axes:** y is up toward ecliptic north, and bearing 0 (away from the default camera) is ecliptic longitude 90°, so the planets go round anticlockwise seen from above, as from the north.
- **Spheres and rings:** on a sphere, `body` replaces `spin` and `rotation`: its axis is tilted where the real pole points, it turns in the real sidereal day, and its map's longitude 0 is where the prime meridian is. Put the sphere at the body's point (`at: mars`) with its real radius. A ring with `body: saturn` lies in Saturn's equator (its rings). An `orbit` ring for a moon goes at its planet's point (`orbit: io`, `at: jupiter`); a planet's needs no `at`.
- **True sizes:** at true scale the planets are dots from across the system, so give their points markers and labels, and fly in to see the bodies.

```yaml live
type: custom:lcards-astrometrics-card
height: 400
units: au
clock:
  date: now
  rate: 10
camera:
  buttons: true
  view: inner
  views:
    inner:
      target: sun
      yaw: 30
      tilt: 40
      distance: 4.5
points:
  - id: sun
    xyz: [0, 0, 0]
    label: SOL
    style: major
  - id: mercury
    body: mercury
    marker: dot
    label: MERCURY
    style: tiny
  - id: venus
    body: venus
    marker: dot
    label: VENUS
    style: tiny
  - id: earth
    body: earth
    marker: dot
    label: EARTH
  - id: mars
    body: mars
    marker: dot
    label: MARS
objects:
  - type: glow
    at: sun
    size: 0.25
    color: var(--lcars-yellow)
  - type: ring
    orbit: mercury
    width: 1
    opacity: 0.5
  - type: ring
    orbit: venus
    width: 1
    opacity: 0.5
  - type: ring
    orbit: earth
    width: 1
    color: var(--lcars-blue)
  - type: ring
    orbit: mars
    width: 1
    opacity: 0.5
```

::: details More about the real Solar System
- **Bodies:** `sun`, the planets, `pluto` and `ceres`, and the moons `moon` (Luna), `phobos`, `deimos`, `io`, `europa`, `ganymede`, `callisto`, `titan`, `triton` and `charon`. The [Solar system (real positions)](./starters#solar-system-real-positions) starter has them all, with their maps and the asteroid and Kuiper belts.
- **Accuracy:** planets from JPL's approximate elements (Standish), within a few hundredths of a degree for the inner planets and a few tenths for the giants, 3000 BC to 3000 AD; outside that they keep going, less exactly. Pluto and Ceres from JPL's small-body elements: a fraction of a degree for Pluto, a degree or two for Ceres outside 2000 to 2050. The Moon from the same series as the sky. The other moons from JPL's mean elements, within a degree from 2000 to 2026 and a few degrees out to 1950 and 2100 (Titan and Phobos up to 15). Rotation from the IAU models. Good for a picture of the sky, not for navigation.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `body` (point) | string | - | Place the point where this real body is at the scene date |
| `center` (point) | string | `sun` | With `body`: measure from this body instead, so it sits at the origin |
| `body` (sphere) | string | - | Turn the sphere as this body is turned. `spin` and `rotation` do not apply |
| `body` (ring) | string | - | Lay the ring in this body's equator (Saturn's rings) |
| `orbit` (ring) | string | - | Draw this body's real orbit. Put a moon's at its planet's point |

### The scene clock

**`clock` on the card sets the scene date: where the real bodies are, how they are turned, and the [sky dome](./objects/surfaces#grid) (`sky: sun | moon` points and paths) once it is set.** It starts at `date` and runs on at `rate`.

- `rate` is days per second as a number (`1` a day a second, `30` a month, `365.25` a year), or with a unit as the time slider shows it: `1 h/s`, `30 d/s`, `1 y/s`, `-1 d/s` (units `s`, `min`, `h`, `d`, `w`, `mo`, `y`). `live` is real time, `0` holds it, and a negative rate runs back.
- **On screen:** the [time slider](./camera#camera-buttons) gets a date mode on a card with a clock: the date, its rate from a year a second backward to a year a second forward, and NOW. What it sets stays until the card's `clock` changes.
- **Separate from `time_scale`:** the clock moves the real bodies; `time_scale` and the speed slider run decorative motion (degree spins, scans, drift, moving dashes). Holding one does not hold the other.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
units: au
clock:
  # the Apollo 11 landing, an hour a second
  date: "1969-07-20T20:17:00Z"
  rate: 1 h/s
camera:
  buttons: true
  views:
    v:
      target: sun
      yaw: 30
      tilt: 40
      distance: 3.5
points:
  - id: sun
    xyz: [0, 0, 0]
    label: SOL
    style: major
  - id: earth
    body: earth
    marker: dot
    label: EARTH
  - id: venus
    body: venus
    marker: dot
    label: VENUS
    style: tiny
objects:
  - type: glow
    at: sun
    size: 0.25
    color: var(--lcars-yellow)
  - type: ring
    orbit: earth
    width: 1
    color: var(--lcars-blue)
  - type: ring
    orbit: venus
    width: 1
    opacity: 0.5
```

::: details More about the clock
- **From other cards:** `tap_action` with `action: set-clock`, `card: sol` (the astrometrics card's `id`), `date: now` and `rate: 30` on any LCARdS card; leave out `card` on the astrometrics card itself.
- **From automations:** the [`lcards.set_clock`](/configuration/ha-actions#lcards-set-clock) action, with `card_id`, `date` and or `rate`; `date` can be a date and time helper's state.
- **From an entity:** `date` and `rate` can follow an entity (`date` an `input_datetime`), or a template ([Settings from entities](./data#settings-from-entities)).
- **Spins follow the clock exactly,** however fast it runs: at a year a second a planet turns hundreds of times a second and looks still or slow (the wagon-wheel effect). Slow the date down to watch it turn.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `clock.date` | string | `now` | The date the scene starts at: `now`, or an ISO date or date and time (`2026-10-30`, `1969-07-20T20:17:00Z`; a date alone is midnight UTC) |
| `clock.rate` | number / string | `live` | How fast the date runs: `live`, days per second, or with a unit (`1 h/s`) |

## Earth satellites

**A point with `satellite: iss` sits where that satellite is at the scene date, over the right place on an Earth sphere; a ring with `satellite:` draws its orbit.** The orbits ship with LCARdS, so it all works offline, and it follows the [scene clock](#the-scene-clock).

- **On an Earth:** `object` names the sphere the satellite goes round. Give that sphere `body: earth` so it turns as Earth really does, and the satellites sit over the right places. Heights are measured in the sphere's radii (an Earth of 6371 km), so it works at any size and in any units.
- **Which satellites:** built-in names (`iss`, `tiangong`, `hubble` and the geostationary weather satellites `goes_east`, `goes_west`, `meteosat`, `meteosat_iodc`, `himawari`, `geo_kompsat`, `insat`, `fengyun_4a`), or the NORAD number of a GPS or Galileo satellite.
- **Heights:** at `heights: real` the ISS skims the surface and geostationary satellites are almost six Earth radii out. `heights: diagram` lifts low orbits clear of the surface and brings high ones in, keeping their order; give the orbit ring the same point and it matches.
- **A whole constellation:** the [satellites object](#the-satellites-object) draws GPS, Galileo, the geostationary satellites or the space stations in one go.

```yaml live
type: custom:lcards-astrometrics-card
height: 380
clock:
  date: now
  rate: 2 min/s
camera:
  buttons: true
  views:
    v:
      target: earth
      yaw: 20
      tilt: 20
      distance: 75
points:
  - id: earth
    xyz: [0, 0, 0]
  # a low orbit, lifted clear of the surface
  - id: iss
    satellite: iss
    object: globe
    heights: diagram
    marker: dot
    label: ISS
  # geostationary: it stays over the same place as the Earth turns
  - id: goes
    satellite: goes_east
    object: globe
    heights: diagram
    marker: dot
    label: GOES EAST
objects:
  - type: sphere
    id: globe
    at: earth
    radius: 10
    body: earth
    image: builtin:earth_blue_marble
  - type: ring
    satellite: iss
    width: 1
    color: var(--lcars-orange)
  - type: ring
    satellite: goes
    width: 1
    color: var(--lcars-blue)
```

::: details More about Earth satellites
- **The data:** mean orbital elements from CelesTrak, refreshed for each LCARdS release; LCARdS downloads nothing. High orbits (GPS, Galileo, geostationary) stay right for months. A low one such as the ISS keeps its orbit for weeks, but drag and reboosts move it along that orbit, so its dot drifts as the data ages.
- **Live positions:** give a satellite point an `entity` whose attributes hold its `latitude` and `longitude` (or `lat` and `long`), from a satellite tracker integration. The dot eases onto each new position and moves on along its orbit between them, and a satellite LCARdS does not ship gets its orbit from two positions.
- **Accuracy:** Keplerian orbits with the Earth's flattening (the drift of the orbit's plane), without the short-period wobbles of full tracking: within a few tens of km of the data. Good for a picture, not for pointing an antenna.
- **The orbit ring** stays still while the Earth turns under it, as an orbit does, and follows a live orbit as its positions come in. Its `radius`, `inclination`, `node`, `arc`, `at` and `band` do not apply.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `satellite` (point) | string / number | - | A built-in name or a NORAD number: place the point where that satellite is, round the sphere in `object` |
| `heights` (point) | string | `real` | `real` to scale, or `diagram`: low orbits lifted, high ones brought in |
| `entity` (point) | string | - | With `satellite`: an entity whose `latitude` and `longitude` (or `lat` and `long`) are live positions |
| `satellite` (ring) | string | - | A satellite point's id: draw that satellite's orbit, at the point's heights |

### The satellites object

**`type: satellites` draws a whole group of real satellites round an Earth sphere: a dot for each, and their orbits with `orbits`.** Use it for GPS, Galileo or the geostationary belt without a point for each.

- Its satellites are points named `<id>.<NORAD number>` (`gps.39166`), so views and fly-to can name them; their orbits are rings named `<id>.<NORAD number>.orbit`.
- `satellites:` adds names or numbers to the group, or lists them on their own without a group. For one satellite with a label of your own, a live entity or a card, use a point with `satellite` instead.

```yaml live
type: custom:lcards-astrometrics-card
height: 380
clock:
  date: now
  rate: 10 min/s
camera:
  buttons: true
  views:
    v:
      target: [0, 0, 0]
      yaw: 30
      tilt: 35
      distance: 115
objects:
  - type: sphere
    id: globe
    radius: 10
    body: earth
    image: builtin:earth_blue_marble
  # GPS: six orbit planes, half a day round
  - type: satellites
    id: gps
    group: gps
    object: globe
    heights: diagram
    color: var(--lcars-yellow)
    orbits:
      width: 0.75
      opacity: 0.4
  # the geostationary weather satellites, named
  - type: satellites
    id: geo
    group: geostationary
    object: globe
    heights: diagram
    color: var(--lcars-blue)
    label: true
```

| Key | Type | Default | Description |
|---|---|---|---|
| `object` | string | required | The Earth sphere they go round (give it `body: earth`) |
| `group` | string | - | `gps`, `galileo`, `geostationary` or `stations` (the ISS and Tiangong) |
| `satellites` | list | - | Built-in names or NORAD numbers, added to the group's |
| `heights` | string | `real` | `real` to scale, or `diagram`: low orbits lifted, high ones brought in |
| `marker` | string | `dot` | The marker at each satellite, as a [point's](./points#markers) |
| `color` | colour | the theme text colour | The markers' colour, and the orbits' unless `orbits.color` is set |
| `label` | boolean | `false` | `true` labels each satellite with its name (tiny style) |
| `orbits` | boolean / object | `false` | `true` draws each orbit; an object sets their look |
| `orbits.width` | number | `1.5` | Line width, px |
| `orbits.color` | colour | the satellites' `color`, else `theme:colors.ui.secondary` | Line colour |
| `orbits.opacity` | number | `1` | Opacity of the lines, `0` to `1` |
| `orbits.dash` | list / object | - | A dash pattern, as on any [line](./objects/lines#line-keys) |
| `id` | string | `satellites#n` | Name of the group, the start of its points' and rings' ids |
| `visible` | boolean | `true` | `false` hides the satellites and their orbits |
| `look` | string | every look | `diagram` or `realistic`: which [look](./scene#looks-diagram-and-realistic) shows them |
| `opacity` | number | `1` | Opacity of the markers and labels, `0` to `1` |

## Distances

**Every distance is in the units of what it belongs to.** An object's distance is to its nearest edge.

- A flat grid (`shape: plane` or `disc`, not deformed) is measured to its surface, so a galactic disc can hide once you dive into a star system above it: Sol sits 60 ly above the disc in the [star systems](#star-systems) example, and `min_distance: 20` on the grid hides it there.

| Distance | Units |
|---|---|
| A view's `distance` | Its target point's: the `station` view above is 4 km, the `galaxy` view 140,000 ly |
| A view with an `[x, y, z]` target | The scene's |
| `camera.limits` | The scene's |
| A point's or object's `fade`, `min_distance`, `max_distance` | Its own system's (the scene's outside one) |

## In the Studio

**The [Studio](./start#the-studio) edits a system's points and objects in the same Points and Objects tabs: select Open on the system's row.** The tabs then show that system's lists, in its units, with a bar naming it and **Back to the scene**. Tapping a point or object on the preview opens the list it is in.

- **Place** and **Pick on preview** put points on the system's own ground plane, in its units, and **drag** moves a point on its system's plane.
- **Capture** a view while the camera looks at a point (after a fly-to it does): the view names the point, with the distance in its units. New ids are checked against the whole card, since ids are card-wide.
- **Starters** adds parts into the system. A part with sizes starts at real sizes in the system's units (an Earth-sized planet one au out in a km system), or sized to fit the system when it has no named units ([Units](#units)); a part in other units than the system's goes to the scene instead.
