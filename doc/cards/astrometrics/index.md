---
description: "The LCARdS Astrometrics card (custom:lcards-astrometrics-card): 3D scenes in the style of the astrometrics lab and stellar cartography. Sector maps, galaxy discs, sky domes with the sun and moon, labelled points you tap to fly to."
---

# Astrometrics

`custom:lcards-astrometrics-card`

![Astrometrics card: a galaxy disc with bearing labels round its rim, the galactic core glowing yellow, Federation space as a blue see-through sector, Borg space as a green one, crossing beams and a small blue planet with its orbits](/img/cards/astrometrics.webp)

A 3D scene in the style of the astrometrics lab and stellar cartography: a lettered sector map, a galaxy disc with territories, a planet with an away team on it, or the sky over your home with the sun and moon where they are now. Drag to orbit, zoom, tap a point to fly to it.

- **Objects** draw the scene: grids (plane, disc, dome, sphere, cylinder), see-through territory volumes, planets, orbits and rings, routes, beams, images and glows. See [Objects](./objects).
- **Points** are named places with an optional label and marker: on the plane, on a planet, in the sky, in a sector map cell. Paths, rings, beams and the camera refer to them by id. See [Points](./points).
- **Camera** orbits a target. Named views let a tap fly the camera from the galaxy to a planet and back.
- **Light on the device:** the scene draws only when something moves (a drag, a fly-to, a spinning planet). An idle card costs nothing, and every astrometrics card on a page shares one WebGL context.

## Quick start

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  view: galaxy
  views:
    galaxy: { target: core, yaw: 20, tilt: 35, distance: 260 }
    map: { target: core, tilt: 90, distance: 300 }
backdrop:
  stars: true
points:
  - { id: core, xyz: [0, 0, 0], label: GALACTIC CORE, style: title }
  - { id: vega, polar: [64, 160], marker: triangle, label: Vega }
  - { id: rigel, polar: [88, 95], marker: diamond, label: Rigel }
  - id: home
    polar: [45, 300]
    marker: reticle
    label: MAP VIEW
    tap_action: { action: fly-to, view: map }
objects:
  - { type: grid, shape: disc, radius: 100, pattern: polar, line_spacing: 10, spoke_count: 36, ring_labels: { step: 30 } }
  - { type: ring, radius: 100, width: 2 }
  - { type: glow, at: core, size: 50 }
```

Drag to turn the disc, scroll or pinch to zoom. Tap **Vega** to fly to it; tap **MAP VIEW** to fly to the view named `map`.

Scene units are yours to choose: here the disc has a radius of 100. Line widths, dashes and label sizes are in px, so they look the same at any zoom. Bearings are in degrees: **0 is north** (away from the camera in the default view), **clockwise** seen from above.

## The three references

### Galaxy with territories

Federation and Borg space as see-through volumes, crossing beams, a planet orbiting on its own point with an away team on its surface, and a route between two stars.

```yaml live
type: custom:lcards-astrometrics-card
height: 460
camera:
  view: galaxy
  views:
    galaxy: { target: core, yaw: 20, tilt: 35, distance: 280 }
    map: { target: core, tilt: 90, distance: 300 }
    planet: { target: nimbus, yaw: 60, tilt: 20, distance: 40 }
backdrop:
  stars: { count: 2500 }
points:
  - { id: core, xyz: [0, 0, 0], label: GALACTIC CORE, style: title }
  - { id: sagittarius, polar: [45, 300], label: Sagittarius Arm, style: major }
  - { id: federation, polar: [75, 135], alt: 22, label: FEDERATION, style: major, color: var(--lcars-blue) }
  - { id: borg, polar: [30, 345], alt: 44, label: BORG SPACE, style: major, color: var(--lcars-green) }
  - { id: talos, polar: [52, 310], marker: dot, label: Talos IV, style: tiny, max_distance: 200 }
  - { id: vega, polar: [64, 160], marker: triangle, label: Vega, style: minor }
  - id: nimbus
    polar: [72, 236]
    alt: 12
    marker: reticle
    label: NIMBUS III
    tap_action: { action: fly-to, view: planet }
  - { id: away, latlon: [10, 40], object: planet, alt: 0.3, marker: dot, label: AWAY TEAM, style: tiny, color: var(--lcars-orange) }
objects:
  - type: grid
    shape: disc
    radius: 100
    pattern: polar
    line_spacing: 10
    spoke_count: 36
    major_row_interval: 3
    ring_labels: { step: 10, radius: 106 }
  - { type: ring, radius: 100, width: 3, color: theme:colors.ui.secondary }
  - type: volume
    id: federation_space
    shape: sector
    radius: [55, 95]
    angle: [100, 170]
    height: [-6, 18]
    cells: { ring: 10, angle: 10, layer: 8 }
    color: var(--lcars-blue)
    tap_action: { action: fly-to }
  - type: volume
    shape: sector
    radius: [18, 42]
    angle: [330, 360]
    height: [0, 40]
    color: var(--lcars-green)
  - { type: glow, at: core, size: 70 }
  - { type: beam, from: [-180, 0, 0], to: [180, 0, 0] }
  - { type: beam, from: [0, 0, -180], to: [0, 0, 180] }
  - { type: sphere, id: planet, at: nimbus, radius: 6, spin: 8 }
  - { type: ring, at: nimbus, radius: 10, inclination: 20, width: 1.5 }
  - { type: path, points: [talos, vega], arc: 12, dash: [6, 4], color: var(--lcars-orange) }
```

Tap **NIMBUS III** to fly to the planet view, or tap the Federation volume to fly to it.

### Sector map

A flat lettered grid seen from straight above, with territories filled cell by cell. `limits.tilt: [90, 90]` locks the tilt, so a one-finger drag pans the map instead of turning it.

```yaml live
type: custom:lcards-astrometrics-card
height: 380
camera:
  view: map
  views:
    map: { target: [0, 0, 0], tilt: 90, distance: 1250, projection: orthographic }
  limits: { tilt: [90, 90] }
objects:
  - type: grid
    id: sectors
    shape: plane
    size: [1200, 600]
    line_spacing: 40
    axis_labels: { columns: letters, rows: numbers, column_start: AD }
    cells:
      - { from: AF3, to: AH6, color: var(--lcars-blue), opacity: 0.3, shade: 0.4, edges: true }
      - { from: AL2, to: AO5, color: var(--lcars-green), opacity: 0.25, shade: 0.4 }
      - { from: AL9, to: AP12, color: var(--lcars-red), opacity: 0.3, shade: 0.4 }
points:
  - { id: ufp, cell: AG4, object: sectors, label: UNITED FEDERATION OF PLANETS, style: major }
  - { id: sb10, cell: AJ2, object: sectors, offset: [8, 0, 12], marker: triangle, label: Starbase 10 }
  - { id: achernar, cell: AN3, object: sectors, marker: diamond, label: Achernar }
  - { id: qualor, cell: AL6, object: sectors, marker: dot, label: Qualor, style: tiny, max_distance: 1300 }
```

### Sky dome: the sun and moon

A dome over your home with the sun and moon where they are now and today's tracks across the sky. Positions come from the time and your Home Assistant location; when `sun.sun` exists its azimuth and elevation are used for the sun. They are updated every minute.

```yaml live
type: custom:lcards-astrometrics-card
height: 380
camera:
  view: horizon
  views:
    horizon: { target: [0, 15, 0], yaw: 180, tilt: 28, distance: 260 }
    zenith: { target: [0, 0, 0], tilt: 90, distance: 260 }
objects:
  - { type: grid, id: sky, shape: dome, radius: 100, pattern: both, line_spacing_deg: 15 }
  - { type: ring, radius: 100, width: 3, color: theme:colors.ui.primary }
  - { type: path, sky: sun, object: sky, dash: [6, 4], color: var(--lcars-yellow) }
  - { type: path, sky: moon, object: sky, dash: [6, 4], color: var(--lcars-blue) }
points:
  - { id: sun, sky: sun, object: sky, marker: reticle, label: SOL }
  - { id: moon, sky: moon, object: sky, marker: moon_phase, label: LUNA }
  - { id: north, altaz: [0, 0], object: sky, label: "N", style: major, overlap: true }
  - { id: east, altaz: [90, 0], object: sky, label: E, style: major, overlap: true }
  - { id: south, altaz: [180, 0], object: sky, label: S, style: major, overlap: true }
  - { id: west, altaz: [270, 0], object: sky, label: W, style: major, overlap: true }
```

Below the horizon, sky points dim (`below_horizon: dim`, the default) and the tracks stop at the horizon. The moon marker shows its lit part.

## Camera and views

The camera orbits a target. Four numbers place it: `yaw` (the bearing it looks from: 0 looks north, 90 looks east), `tilt` (0 is level with the target, 90 is straight down), `distance` and `fov`. A view is a named set of them:

```yaml
camera:
  view: galaxy                # shown first (default: the first view)
  views:
    galaxy: { target: core, yaw: 20, tilt: 35, distance: 280 }
    map: { target: core, tilt: 90, distance: 300, projection: orthographic }
  controls: true              # drag, zoom, double-tap, keys (default true)
  buttons: true               # on-card pan, zoom and reset buttons (default off)
  limits: { tilt: [5, 90], distance: [20, 800] }
  auto_rotate: 2              # degrees per second (0 = off)
  fly_duration: 1600          # ms
  ease: inOutCubic
  warp: false                 # stars streak on every fly-to (or warp: true in one view)
```

- `target` is a point id (the camera follows the point if it moves) or `[x, y, z]`.
- A view without `yaw` faces north. With no views at all the camera frames the whole scene.
- `projection: orthographic` removes the perspective (a flat map); `distance` then sets the zoom.
- Fly between views with a `tap_action` on a point or object: `{ action: fly-to, view: map }` (see [Points: actions](./points#actions)), or from other cards and automations ([Live data: fly-to](./data#fly-to-from-other-cards-and-automations)).

### Controls

| Input | Does |
|---|---|
| Drag | Orbit round the target (`drag: pan` swaps this with panning) |
| Shift-drag, right-drag, two fingers | Pan |
| Wheel, pinch | Zoom toward the pointer (`zoom_to: target` zooms straight in) |
| Double-tap or double-click blank space | Fly one zoom step in toward that spot, which becomes the centre; with shift, out |
| Arrow keys (card focused) | Pan; with shift, orbit |
| `+` / `-` | Zoom one step |
| `Home` | Back to the start view |
| `buttons` | The same on the card: pan arrows, zoom, reset. Press and hold keeps moving |

Taps on points and on objects with a `tap_action` are never a double-tap: they run their action each time.

```yaml
camera:
  drag: orbit            # or pan: a one-finger drag moves the view
  pan: screen            # or ground: panning stays on the ground plane
  zoom_to: cursor        # or target
  zoom_step: 2           # each step halves (or doubles) the distance
  double_tap: zoom       # or none
  buttons: { position: bottom-right, pan: true, zoom: true, reset: true }
  limits:
    target: { radius: 300 }   # or a box { x: [a, b], z: [a, b] }, or false
```

- **Pan** moves along the screen by default, so a side view pans up and down and a top view pans across the map. `pan: ground` keeps the target on its height.
- **Target limit:** the point the camera looks at stays inside a sphere 1.5 times the size of the scene, so panning cannot lose it. Set your own sphere (`radius`, optional `center`) or box, or `false` for none.
- With `limits.tilt` locked to one value, a one-finger drag always pans (a map). `controls: false` turns off dragging, zooming, double-tap and keys, and leaves the camera to fly-to actions, `auto_rotate` and the buttons.

## Labels

Point labels are LCARdS text, with the [text-field keys](/core/text-fields) of the other cards: fonts, sizes, weights, colours with state maps, background boxes, templates, several fields round one point. `labels.default` sets keys for every label, `labels.styles` changes the built-in styles (`title`, `major`, `minor`, `tiny`) or adds your own. See [Points: labels](./points#labels) and [Live data](./data).

When two labels overlap the higher priority wins (the larger style), then the nearer one. They move by sub-pixel steps, which looks smooth while the scene turns; on a weak device `labels: { snap: true }` rounds them to whole pixels.

## Backdrop

`backdrop.stars` puts stars at infinity behind the scene: they turn with the camera and never move when it pans. `true` uses the defaults; the settings take the [starfield](/core/effects/background-animations/preset-reference#starfield) background preset's names:

```yaml
backdrop:
  stars:
    count: 2500
    min_radius: 0.4       # px
    max_radius: 1.4
    min_opacity: 0.3
    max_opacity: 1
    colors: [var(--lcards-moonlight), var(--lcars-blue)]
    seed: 7
```

`backdrop.dust` adds particles round the scene that stay put as the camera moves (depth on every move), and `streak` / `spectrum` shape the stars in a warp fly-to: see [Effects: warp and dust](./effects#warp-and-dust).

`background_animation` takes any [background animation](/core/effects/background-animations) (a nebula, a warp starfield, a grid) as a flat layer behind the scene, as on the MSD card. It does not turn with the camera; for clouds in the scene itself use a [nebula object](./effects#nebula).

```yaml
background_animation:
  - preset: nebula
    config: { volumetric: true, cloud_count: 4 }
```

## A header bar

The card is the scene only. For an LCARS frame round it (an "ALPHA QUADRANT" bar), put it in a [Layout Card](../layout-card/) with an elbow or a bar-label button above it.

## Options

| Option | What it does |
|---|---|
| `height` | Card height, px or CSS (default 400). The scene fills the card. |
| `camera` | `view`, `views`, `controls`, `drag`, `pan`, `zoom_to`, `zoom_step`, `double_tap`, `buttons`, `limits`, `auto_rotate`, `fly_duration`, `ease`, `warp` ([Camera and views](#camera-and-views), [Controls](#controls), [Effects: warp](./effects#warp-and-dust)) |
| `points` | Named points with labels and markers ([Points](./points)) |
| `objects` | What is drawn ([Objects](./objects), [Effects](./effects)) |
| `backdrop` | `stars`, `dust` ([Backdrop](#backdrop)) |
| `background_animation` | Flat background effects behind the scene ([Backdrop](#backdrop)) |
| `labels` | `default`, `styles`, `overlap`, `snap` ([Labels](#labels)) |
| `state_classification`, `triggers_update`, `data_sources` | For point entities and label templates ([Live data](./data)) |
| `rules` | Rules on the card, its points and its objects ([Live data: rules](./data#rules)) |
| `id`, `tags`, `sounds`, `variables`, `grid_options`, `width`, `min_height`, `max_height`, ... | As on every card ([Common options](../common)) |

The [config checker](/getting-started/config-checker) also checks what the schema cannot: that each point has exactly one position, and that every id a point, path, ring, beam or view names exists.

## Units and motion

- **Scene units** are yours to pick: a galaxy disc of radius 100, a planet of radius 10. Sizes, distances and positions are in scene units; line widths, dashes, label sizes and card offsets are in px, so they hold their size at any zoom.
- **Bearings** are degrees clockwise from north (north is away from the default camera), as on a compass seen from above.
- **Motion is off until you set it,** and every moving key follows one rule: turning in degrees per second (`spin`, `camera.auto_rotate`); travel in its own units per second (`flow_speed` in px, a fill's `speed` and a nebula's or noise's `drift` in scene units); repeating cycles as a `period` in seconds (`scan_period`, a deformation's `period`). Fly-to times are in ms, as everywhere in LCARdS.

## Performance and motion

- **Render on demand:** the scene draws when the camera moves, a fly-to runs, an object spins or an [effect](./effects) moves, the sky timer ticks or the theme changes. A still scene draws nothing. Off screen and in a hidden tab nothing draws.
- **One WebGL context** for every astrometrics card and WebGL background on the page.
- **Models:** measured on an Intel Arc laptop GPU at 1300 x 866 px, the scene with the built-in ship draws in about 1.5 ms a frame; the depth image that hides labels behind it adds about 0.2 ms, only while something moves. See [model](./objects#model).
- **Reduced motion** (the system setting): spin, `auto_rotate`, [deformations](./objects#deformed-grids) and every [effect](./effects) (drift, scans, moving dashes, fills) stop, and fly-to jumps instead of flying (no warp streaks).
- **Alert modes** recolour the scene; labels follow the palette at once.

## When the 3D view is unavailable

The card shows **3D VIEW UNAVAILABLE** with the reason when the browser has no WebGL, or when the graphics context was lost (a GPU reset, too many WebGL pages). Reloading the page starts it again.
