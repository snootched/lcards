---
description: "Astrometrics card points: named places on the plane, on a planet, in the sky or in a sector map cell, with LCARS labels, markers, visibility ranges and tap actions."
---

# Points

A point is a named place in the scene. It is placed once and referred to by its `id` from paths, rings, beams, object positions and camera views. With a `label` or a `marker` it also shows on the scene.

```yaml
points:
  - id: vega                 # unique name
    polar: [64, 160]         # where: exactly one placement form
    label: Vega              # optional text
    marker: triangle         # optional marker
    style: minor             # label size
    tap_action: { action: fly-to }
```

## Placement forms

Each point takes exactly one of these. `offset: [x, y, z]` moves any of them by scene units.

| Form | Meaning |
|---|---|
| `xyz: [x, y, z]` | Scene coordinates; y is up. |
| `polar: [distance, bearing]` + `y` | On the scene plane: distance from the centre and a bearing (0 north, clockwise). `y` lifts it. |
| `latlon: [lat, lon]` + `on` | On a sphere. Longitude 0 faces the default camera, east to the right. Turns with the sphere's `spin`. |
| `altaz: [azimuth, altitude]` + `on` | On a sky dome: azimuth clockwise from north, altitude up from the horizon. |
| `sky: sun` or `sky: moon` + `on` | The sun or moon on a dome, now (from the time and your Home Assistant location). |
| `cell: AF3` + `on` | The centre of a cell of a sector map (a plane grid with `axis_labels`). |
| `at: <point>` | At another point; add `offset` to move away from it. |

`on` names the object the point stands on. With `xyz` or `polar` it is optional: the point then moves and spins with that object. `alt` lifts a `latlon`, `altaz` or `sky` point off the surface.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    side: { target: [0, 0, 0], yaw: 30, tilt: 25, distance: 120 }
points:
  - { id: origin, xyz: [0, 0, 0], marker: dot, label: XYZ }
  - { id: bearing, polar: [35, 90], marker: diamond, label: POLAR 35 AT 90 }
  - { id: lifted, at: bearing, offset: [0, 15, 0], marker: triangle, label: AT + OFFSET }
  - { id: lander, latlon: [20, 0], on: globe, alt: 0.5, marker: reticle, label: LATLON 20 0 }
objects:
  - { type: grid, shape: disc, radius: 50, pattern: polar, line_spacing: 10, spoke_count: 12 }
  - { type: sphere, id: globe, at: [-30, 12, 0], radius: 10, spin: 10 }
```

A point can sit on a point that sits on an object that sits on a point: the planet orbits the star, the away team stands on the planet. A reference that loops back on itself is refused (and logged).

## Labels and markers

| Key | What it does |
|---|---|
| `label` | Text at the point, in the LCARS font. |
| `style` | `title` (34 px), `major` (20), `minor` (13, default) or `tiny` (10). When labels overlap, the larger style wins, then the nearer one. |
| `priority` | Overrides the style's rank in that contest (title 100, major 80, minor 40, tiny 10). |
| `marker` | `dot`, `triangle`, `diamond`, `square`, `reticle`, `moon_phase` (the moon's lit part) or `none`. A point with a marker can be tapped. |
| `color` | Label and marker colour. CSS variables (`var(--lcars-blue)`) stay live, so alert modes recolour them. |
| `anchor` | `right` of the marker (the default with a marker), `left`, or `center` on the point (the default without). |

<CardGallery set="astro-markers" />

<CardGallery set="astro-label-styles" />

## Visibility

| Key | What it does |
|---|---|
| `max_distance` | Hidden when the camera is farther than this: detail that appears as you zoom in. |
| `min_distance` | Hidden when the camera is closer than this. |
| `fade: [start, end]` | Fades out between these camera distances. |
| `below_horizon` | Sky points under the horizon: `dim` (the default for `sky`), `hide`, or `show` (the default for `altaz`). |

Labels behind a planet are hidden; the see-through volumes and grids hide nothing.

## Actions

`tap_action` and `hold_action` take any card action (`more-info`, `toggle`, `perform-action`, `navigate`, `url`, `none`), plus `fly-to`:

- A point with no `tap_action` and a marker: a tap selects it (its label turns the alert colour) and flies the camera to it.
- `{ action: fly-to }`: the same, stated explicitly (on an object: fly to its middle).
- `{ action: fly-to, view: map }`: fly to the named view instead.
- A point's own `view: { distance, tilt, yaw }` sets where the camera lands when it flies to that point.

A drag never fires a tap (a press that moves more than 6 px is a drag), and a hold (half a second) fires `hold_action`, not `tap_action`.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  view: wide
  views:
    wide: { target: [0, 0, 0], yaw: 20, tilt: 40, distance: 160 }
points:
  - id: lamp
    xyz: [-30, 0, 0]
    marker: square
    label: LIGHT
    tap_action: { action: toggle, entity: light.demo }
    hold_action: { action: more-info, entity: light.demo }
  - id: probe
    xyz: [30, 0, 10]
    marker: diamond
    label: PROBE
    view: { distance: 30, tilt: 15 }
objects:
  - { type: grid, shape: plane, size: 120, line_spacing: 10 }
```
