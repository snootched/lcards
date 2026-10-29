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
- **Orbit rings** add segments near the camera, so an orbit 150 million km across still passes through its planet seen from 70,000 km.
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
- **One level:** a system cannot hold another system (it reaches from a galaxy down to a station already). A system is not rotated: its axes are the scene's.

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
