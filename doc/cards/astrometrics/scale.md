---
description: "True scale on the LCARdS Astrometrics card: real units (km, AU, light years), a star system in its own units inside a galaxy, diving from a galaxy to a station, distances in each part's own units, and the Studio and starters for it."
---

# Scale

An [Astrometrics card](./) can be drawn to look right or to be right:

- **Built to fit** (most [starters](./starters)): sizes and distances picked so everything shows at once. Planets are big enough to see from across their system, a station is a sizeable part of its planet. Easy to read, nothing to tune, and not to scale.
- **True scale:** the real numbers, so what you see is how it is: a solar system in km where planets are dots from across it, a galaxy in light years with a station 1.5 km across inside it. The close views are where it shines; you pick what shows from afar with the [distance](./objects#distance) keys.

Both are the same card with the same keys. The **Solar system at true scale** and **Galaxy to station at true scale** [starters](./starters) are ready-made true-scale scenes.

## Units

Scene units are yours to pick, and positions, sizes and distances are all in them. For real data, name them with `units` on the card: `m`, `km`, `au`, `ly` or `pc`. The name tells the card how a [star system](#star-systems) inside relates to the scene; on its own it changes nothing on screen.

## One scene in real units

Build a scene with the real numbers and the card holds the whole range, from the whole system down to a station in front of Earth:

```yaml
type: custom:lcards-astrometrics-card
camera:
  view: station
  views:
    system: { target: sun, yaw: 40, tilt: 35, distance: 2100000000 }
    earth: { target: earth, yaw: 225, tilt: 12, distance: 70000 }
    station: { target: ds9, yaw: 330, tilt: 6, distance: 4 }
points:
  - { id: sun, xyz: [0, 0, 0], label: SOL, style: major }
  - { id: earth, polar: [149597870.7, 30], marker: dot, label: EARTH }
  - { id: ds9, at: earth, offset: [-21082, 0, 36515], label: DEEP SPACE 9, style: tiny }
objects:
  - { type: glow, at: sun, size: 9000000, color: var(--lcars-yellow) }
  - { type: sphere, at: sun, radius: 696340, fill_color: var(--lcars-yellow) }
  - { type: ring, radius: 149597870.7, width: 1, color: var(--lcars-blue) }
  - { type: sphere, at: earth, radius: 6371, image: builtin:earth_blue_marble }
  - { type: model, at: ds9, src: builtin:deep_space_nine, size: 1.452, material: original }
```

- **Depth:** a station 4 km away with Earth 42,000 km behind it and the Sun 150 million km further draws in the right order. When one depth range cannot hold the view, the card draws it in slices, far to near; a scene built to fit draws in one pass as before.
- **Distance limits** follow the scene: you can zoom in to half its smallest object and out to 20 times its size (a scene built to fit keeps 1 to 100,000). `limits.distance` sets your own.
- **Fly-to** over a long zoom moves evenly in log distance, so each factor of ten takes the same time, and zooming in the camera lines up on its target early instead of sweeping past it close up.
- **Orbit rings** add segments near the camera, so an orbit 150 million km across still passes through its planet seen from 70,000 km (an `orbit` ring adds them round its body).
- **What to expect:** at true scale, planets are dots from across their system (Earth is 1/23,000 of its orbit), so give them markers and labels; the close views are where it shines. The [distance](./objects#distance) keys still pick what shows when.

## Star systems

One set of units cannot hold a galaxy and a station: at 26,000 light years from the galactic core, numbers in light years are only good to about 30 km. A [`system`](./objects#system) object holds points and objects in units of their own, at a point of the scene: the galaxy in light years, Sol in km. Write each part with the numbers as published (star positions in ly or pc, orbits in AU or km, sizes in km).

```yaml
type: custom:lcards-astrometrics-card
units: ly
camera:
  view: galaxy
  views:
    galaxy: { target: core, yaw: 20, tilt: 35, distance: 140000 }
    earth: { target: earth, yaw: 225, tilt: 12, distance: 70000 }
    station: { target: ds9, yaw: 330, tilt: 6, distance: 4 }
points:
  - { id: core, xyz: [0, 0, 0], label: GALACTIC CORE, style: title }
  - { id: sol, polar: [26000, 200], alt: 60, marker: dot, label: SOL, style: major, tap_action: { action: fly-to, view: earth } }
objects:
  - { type: grid, shape: disc, radius: 50000, pattern: polar, line_spacing: 5000, spoke_count: 36, min_distance: 20 }
  - { type: glow, at: core, size: 30000 }
  - type: system
    id: sol_system
    at: sol
    units: km
    points:
      - { id: sun, xyz: [0, 0, 0] }
      - { id: earth, polar: [149597870.7, 30], marker: dot, label: EARTH, max_distance: 3000000000 }
      - { id: ds9, at: earth, offset: [-21082, 0, 36515], label: DEEP SPACE 9, style: tiny, max_distance: 3000000 }
    objects:
      - { type: glow, at: sun, size: 9000000, color: var(--lcars-yellow) }
      - { type: sphere, at: sun, radius: 696340, fill_color: var(--lcars-yellow) }
      - { type: ring, radius: 149597870.7, width: 1, color: var(--lcars-blue) }
      - { type: sphere, at: earth, radius: 6371, image: builtin:earth_blue_marble }
      - { type: model, at: ds9, src: builtin:deep_space_nine, size: 1.452, material: original }
```

- **Ids are card-wide:** views, `fly-to`, rules, templates and paths name a system's points and objects like any others.
- **Distances are in the owner's units:** a view's `distance` is in its target's units (the `station` view above is 4 km, the `galaxy` view 140,000 ly), and so are a point's or object's `fade`, `min_distance` and `max_distance`. A view with an `[x, y, z]` target, and `camera.limits`, are in scene units.
- **The camera follows:** within a few times its size of a system, the camera works in the system's units, so a station a few km across holds steady; further out it works in the scene's. Nothing on screen moves at the change, and a fly-to from the galaxy lands exactly on its target inside.
- **Galaxy-scale things in the close-ups:** a region's walls or a quadrant line thousands of light years long would cross a close-up of a planet. `hide_in_systems: true` on a point or object hides it while the camera is inside any system (within a few times its size, where it works in the system's units); outside every system it shows as usual. The [Star Trek galaxy](./starters#star-trek-galaxy) starter sets it on its regions, lines and names.
- **One level:** a system cannot hold another system (it reaches from a galaxy down to a station already). A system is not rotated: its axes are the scene's.

## The real Solar System

A point with `body: mars` sits where Mars really is at the scene date, on its real tilted, elliptical orbit. A sphere with `body: mars` turns as Mars really does: its axis tilted where the real pole points, its real sidereal day, its map's longitude 0 where the prime meridian is. A ring with `orbit: mars` draws the real orbit. All three follow the [scene clock](#the-scene-clock).

```yaml live
type: custom:lcards-astrometrics-card
height: 400
units: au
clock: { date: now, rate: 10 }
camera:
  buttons: true
  view: inner
  views:
    inner: { target: sun, yaw: 30, tilt: 40, distance: 4.5 }
points:
  - { id: sun, xyz: [0, 0, 0], label: SOL, style: major }
  - { id: mercury, body: mercury, marker: dot, label: MERCURY, style: tiny }
  - { id: venus, body: venus, marker: dot, label: VENUS, style: tiny }
  - { id: earth, body: earth, marker: dot, label: EARTH }
  - { id: mars, body: mars, marker: dot, label: MARS }
objects:
  - { type: glow, at: sun, size: 0.25, color: var(--lcars-yellow) }
  - { type: ring, orbit: mercury, width: 1, opacity: 0.5 }
  - { type: ring, orbit: venus, width: 1, opacity: 0.5 }
  - { type: ring, orbit: earth, width: 1, color: var(--lcars-blue) }
  - { type: ring, orbit: mars, width: 1, opacity: 0.5 }
```

- **Bodies:** `sun`, the planets, `pluto` and `ceres`, and the moons `moon` (Luna), `phobos`, `deimos`, `io`, `europa`, `ganymede`, `callisto`, `titan`, `triton` and `charon`. The [Solar system (real positions)](./starters#solar-system-real-positions) starter has them all, with their maps and the asteroid and Kuiper belts.
- **Where:** the Sun sits at the origin of the point's frame (the scene, or its [system](#star-systems)), in that frame's units: set `units` (km or au; without it au is assumed, with a warning). A moon is placed from the Sun too (its planet plus its own orbit), so it sits by its planet's point. `center: jupiter` measures from another body instead, for a scene centred on a planet.
- **Axes:** y is up toward ecliptic north, and bearing 0 (away from the default camera) is ecliptic longitude 90°, so the planets go round anticlockwise seen from above, as from the north.
- **Spheres and rings:** `body` replaces `spin` and `rotation`. Put the sphere at the body's point (`at: mars`) with its real radius. A ring with `body: saturn` lies in Saturn's equator (its rings). An `orbit` ring for a moon goes at its planet's point (`orbit: io`, `at: jupiter`); a planet's needs no `at`.
- **Accuracy:** planets from JPL's approximate elements (Standish), within a few hundredths of a degree for the inner planets and a few tenths for the giants, 3000 BC to 3000 AD; outside that they keep going, less exactly. Pluto and Ceres from JPL's small-body elements: a fraction of a degree for Pluto, a degree or two for Ceres outside 2000 to 2050. The Moon from the same series as the sky. The other moons from JPL's mean elements, within a degree from 2000 to 2026 and a few degrees out to 1950 and 2100 (Titan and Phobos up to 15). Rotation from the IAU models. Good for a picture of the sky, not for navigation.
- **True sizes:** at true scale the planets are dots from across the system, so give their points markers and labels, and fly in to see the bodies.

### The scene clock

`clock` on the card sets the scene date: where the real bodies are, how they are turned, and the [sky dome](./objects#grid) (`sky: sun | moon` points and paths) once it is set. It starts at `date` and runs on at `rate`:

```yaml
clock:
  date: now          # or an ISO date: 2026-10-30, 1969-07-20T20:17:00Z
  rate: 1            # days per second; live is real time, 0 holds it, negative runs back
```

- **On screen:** the [time slider](./index#controls) gets a date mode on a card with a clock: the date, its rate from a year a second backward to a year a second forward, and NOW. What it sets stays until the card's `clock` changes.
- **From other cards:** `tap_action: { action: set-clock, card: sol, date: now, rate: 30 }` on any LCARdS card; leave out `card` on the astrometrics card itself.
- **From automations:** the [`lcards.set_clock`](/configuration/ha-actions#lcards-set-clock) action, with `card_id`, `date` and or `rate`; `date` can be a date and time helper's state.
- **Separate from `time_scale`:** the clock moves the real bodies; `time_scale` and the speed slider run decorative motion (degree spins, scans, drift, moving dashes). Holding one does not hold the other.
- **Spins follow the clock exactly,** however fast it runs: at a year a second a planet turns hundreds of times a second and looks still or slow (the wagon-wheel effect). Slow the date down to watch it turn.

## Distances

Every distance is in the units of what it belongs to:

| Key | Units |
|---|---|
| A view's `distance` | Its target point's: the `station` view above is 4 km, the `galaxy` view 140,000 ly |
| A view with an `[x, y, z]` target | The scene's |
| `camera.limits` | The scene's |
| A point's or object's `fade`, `min_distance`, `max_distance` | Its own system's (the scene's outside one) |

An object's distance is to its nearest edge. A flat grid (`shape: plane` or `disc`, not deformed) is measured to its surface, so a galactic disc can hide once you dive into a star system above it: Sol sits 60 ly above the disc in the example, and `min_distance: 20` on the grid hides it there.

## In the Studio

The [Studio](./studio) edits a system's points and objects in the same Points and Objects tabs: open the system's row and select **Edit its points and objects** (or the folder button on the row). The tabs then show that system's lists, in its units, with a bar naming it and **Back to the scene**. Tapping a point or object on the preview opens the list it is in. Inside a system:

- **Place** and **Pick on preview** put points on the system's own ground plane, in its units.
- **Drag** moves a point on its system's plane.
- **Capture** a view while the camera looks at a point (after a fly-to it does): the view names the point, with the distance in its units.
- New ids are checked against the whole card, since ids are card-wide.
