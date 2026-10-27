---
description: "Astrometrics card objects: grid surfaces (plane, disc, dome, sphere, cylinder), sector maps, territory volumes, planets, rings, routes, beams, images, glows, nebulae and 3D models (glTF) as holograms."
---

# Objects

`objects` is the list of what the scene draws, in order. Each has a `type`; the rest of its keys depend on the type.

<CardGallery set="astro-objects" />

## Keys every object takes

| Key | What it does |
|---|---|
| `id` | A name for points (`on`), paths and rings. Default `type#n`: the first grid is `grid#1`. |
| `at` | Where it sits: a point id (it follows the point) or `[x, y, z]`. Default the origin. |
| `rotation: [x, y, z]` | Turns it, degrees: y is a bearing, x tips it toward the camera, z rolls it. |
| `spin` | Turns it round its own vertical axis, degrees per second. Points on it turn with it. |
| `opacity`, `visible` | Opacity 0 to 1; `visible: false` hides it (its points still work). |
| `tap_action`, `hold_action`, `view` | As on [points](./points#actions). An object without a `tap_action` is not tappable. |

Colours are theme tokens (`theme:colors.ui.primary`), CSS variables (`var(--lcars-blue)`) or plain colours. Widths and dashes are px.

Moving effects (nebula clouds, scan bands on grids, spheres and volumes, moving dashes and pulses on lines, animated fills on spheres and grids, warp streaks) are on the [Effects](./effects) page.

## grid

A grid surface. `shape` picks it: `plane` (`size`), `disc` (`radius`, `inner_radius`), `dome` (a half sphere), `sphere` or `cylinder` (`radius`, `height`). The line keys are the [background grid](/core/effects/background-animations/preset-reference#grid)'s: `pattern`, `line_spacing`, `major_row_interval`, `major_col_interval`, `line_width`, `line_width_major`, `color`, `color_major`, `fill_color`, `spoke_count`, `hex_radius`, `dot_radius`, `back_opacity`. On curved shapes `line_spacing_deg` puts rings and meridians every N degrees.

- `border` (default on): edge lines on the rim of a disc or dome and the frame of a plane.
- `ring_labels: { step, radius, start, y, style, color }`: bearing labels round a disc or dome.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, 20, 0], yaw: 30, tilt: 25, distance: 230 }
objects:
  - { type: grid, shape: disc, radius: 60, at: [-70, 0, 0], pattern: polar, line_spacing: 10, spoke_count: 24, ring_labels: { step: 45, style: tiny } }
  - { type: grid, shape: dome, radius: 45, at: [50, 0, 0], line_spacing_deg: 15, color: var(--lcars-blue) }
  - { type: grid, shape: cylinder, radius: 15, height: 60, at: [0, 30, -70], line_spacing_deg: 30, color: var(--lcars-orange) }
```

### Sector maps

A plane grid with `axis_labels` names its columns and rows (AF3 is column AF, row 3). `cells` fills ranges of them, and points can stand in a cell (`cell: AF3`, `object: <grid>`).

| `axis_labels` key | What it does |
|---|---|
| `columns`, `rows` | `letters` or `numbers` (default letters across, numbers down) |
| `column_start`, `row_start` | The first name, such as `AD` |
| `pad` | Zero-pad numbers to N digits; default the widest label, at least 2 (01, 02, ...); 0 turns it off |
| `every` | Label every Nth column and row |
| `offset`, `style`, `color` | Distance outside the edge, label size and colour |

Each `cells` entry is a range `from` one corner cell `to` the other (or one `cell`), with `color`, `opacity`, `shade` (0 to 1: each cell a little lighter or darker, as on a printed map; the same cell always gets the same shade), `seed` and `border` (`true` or `{ width, color, opacity }`). The [sector map reference](./#sector-map) shows them together.

## volume

A see-through box of grid cells: a territory. `shape: sector` spans `radius: [inner, outer]`, bearings `angle: [from, to]` (to may pass 360 to cross north) and `height: [bottom, top]` round the centre; `shape: box` is `size: [w, h, d]` round `at`.

| Key | What it does |
|---|---|
| `cells` | Cell size on the faces: `ring`, `angle` (degrees), `layer` for a sector; `x`, `y`, `z` for a box |
| `color`, `face_opacity` | Colour, and the face lines' opacity (the edges stay brighter) |
| `line_width`, `edges`, `edge_width` | Face line width; outline on or off; outline width |
| `back_opacity` | The far faces (1: a wireframe, nothing hidden) |

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v: { target: [0, 5, 0], yaw: 200, tilt: 30, distance: 190 }
objects:
  - { type: grid, shape: disc, radius: 80, pattern: polar, line_spacing: 20, spoke_count: 12 }
  - { type: volume, shape: sector, radius: [30, 75], angle: [100, 170], height: [0, 20], cells: { ring: 9, angle: 10, layer: 10 }, color: var(--lcars-blue) }
  - { type: volume, shape: box, at: [-40, 10, -30], size: [30, 20, 20], color: var(--lcars-orange) }
```

## sphere

A planet or globe: latitude and longitude lines (`lat_step`, `lon_step`) over a dark body (`fill`, `fill_opacity`) that hides what is behind it, labels included (`occlude: false` turns that off). `image` wraps a map around it: `builtin:earth_blue_marble` is the Earth, shipped with LCARdS (NASA's Blue Marble, July 2004), or your own equirectangular picture (`/local/mars.jpg`; longitude 0 in the middle). The grid line keys (`color`, `line_width`, ...) work as on a grid. `latlon` points stand on it and turn with its `spin`.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v: { target: [0, 0, 0], yaw: 0, tilt: 15, distance: 60 }
points:
  - { id: base, latlon: [15, -20], object: world, alt: 0.3, marker: dot, label: BASE CAMP, color: var(--lcars-orange) }
objects:
  - { type: sphere, id: world, radius: 14, spin: 12, lat_step: 15, lon_step: 20, color: var(--lcars-blue) }
```

The Earth, with your home on it (`zone.home` has its latitude and longitude):

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, 0, 0], yaw: -40, tilt: 30, distance: 55 }
points:
  - id: home
    entity: zone.home
    latlon: { entity: zone.home }
    object: earth
    alt: 0.3
    marker: reticle
    label: HOME
    overlap: true
  - { id: greenwich, latlon: [51.48, 0], object: earth, marker: dot, label: Greenwich, style: tiny }
objects:
  - { type: sphere, id: earth, radius: 15, image: builtin:earth_blue_marble, lat_step: 30, lon_step: 30, color: var(--lcars-blue) }
```

The image's credit: NASA Earth Observatory, Blue Marble: Next Generation. NASA texture maps are not subject to copyright in the United States.

## ring

A circle or ellipse: an orbit, a rim, a range ring. `radius` (or `[a, b]` for an ellipse), `around` (a point; the ring follows it), `inclination` and `node` (the bearing of the line where an inclined ring crosses the plane), `arc: [from, to]` for part of it, and the line keys below.

## path

A line through `points` (ids or `[x, y, z]`), or `from` / `to`. `arc` lifts each leg into a curve by that height at its middle. With `sky: sun` or `sky: moon` and `object: <dome>`, it is today's track across the sky, cut at the horizon.

**Line keys** (`ring` and `path`): `width` (px), `dash: [on, off]` (px: the dashes keep their size however close the camera is), `color`, `color_to` (fades along the line), `glow` (`true`, or a width factor), `blend: add`.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v: { target: [0, 0, 0], yaw: 20, tilt: 40, distance: 170 }
points:
  - { id: star, xyz: [0, 0, 0], marker: reticle, label: STAR }
  - { id: a, polar: [60, 250], marker: dot, label: OUTPOST }
  - { id: b, polar: [55, 60], marker: dot, label: RELAY }
objects:
  - { type: ring, around: star, radius: 30, inclination: 25, node: 40, color: var(--lcars-blue) }
  - { type: ring, around: star, radius: [70, 50], dash: [4, 4] }
  - { type: path, points: [a, star, b], arc: 15, width: 2, color: var(--lcars-orange), color_to: var(--lcars-yellow), glow: true }
```

## beam

A glowing straight line from `from` to `to` (point ids or `[x, y, z]`): a wide soft glow (`width`, px) round a thin bright core.

## nebula

Clouds of gas in the scene, in the look of the nebula background preset: `radius` or `size` (the region), `cloud_count`, `seed`, `colors`, `turbulence`, `drift`. See [Effects: nebula](./effects#nebula).

## glow

A soft light that always faces the camera: a galactic core, a star, a beacon. `size` (diameter, scene units), `color`, `opacity`, `falloff` (higher is a tighter, brighter core) and `blend` (`add`, the default, or `normal`).

## image

Your own picture lying on the scene plane: `src` (`/local/galaxy.jpg`), `size` (`[w, d]`), `shape` (`plane` or `disc`), `y`, `opacity`. `blend: add` makes black see-through, for a photo of space on black. Grids drawn at the same height draw over it.

```yaml
- { type: image, src: /local/milky-way.jpg, size: 220, shape: disc, blend: add, opacity: 0.8 }
```

## model

A 3D model from a glTF file (`.glb` or `.gltf`): a starship, your house, a satellite. By default it is drawn as a hologram (a glow with a bright rim, scanlines and its feature edges); `material: original` shows the file's own materials, lit.

```yaml
- type: model
  id: ship
  src: builtin:constitution     # or /local/models/ship.glb
  size: 70                      # its largest extent, scene units
  scan_period: 5                # a scan band sweeps along it every 5 seconds
  animation: all                # loop the file's animation clips
```

| Key | What it does |
|---|---|
| `src` | The file. `builtin:constitution` is a Constitution-class starship shipped with LCARdS. Your own goes in `/config/www/` and is `/local/...` here. |
| `size` | Its largest extent in scene units (default 50): the file is scaled and centred to fit. |
| `material` | `hologram` (default) or `original`. |
| `color`, `rim_color`, `opacity`, `scanlines` | The hologram's body colour, rim colour, brightness and scanline strength. |
| `solid` | `true` (default): the hologram hides its own far side. `false`: see-through. |
| `blend` | `add` (default) or `normal`. |
| `scan_period`, `scan_color` | A scan band sweeping along the model, seconds per sweep. |
| `edges`, `edge_angle`, `edge_color` | Feature edges as lines (on for holograms): where faces meet at more than `edge_angle` degrees. |
| `animation` | Clips to loop: `all`, a clip name or a list. The built-in ship's clip is `bussards`. |
| `occlude` | Hide labels and cards behind it (default `true`). |
| `max_file_size` | The largest file it loads, MB (default 20). |

A stand-in box shows while the file loads. Files compressed with meshopt load; Draco-compressed files do not (the browser console says why).

**Points on a model** use `object:` with the model's id. `xyz` is then in the file's own coordinates, so `size` never moves them, and `part:` puts a point on a named part (a node in the file) so it follows that part when an animation moves it. In the card editor, **Pick on preview** places a point on the model's surface, and the part list fills in from the file. See [placement forms](./points#placement-forms).

The built-in ship's parts: `saucer`, `bridge`, `sensor_dome`, `impulse`, `neck`, `secondary_hull`, `deflector`, `shuttle_bay`, `pylon_port`, `pylon_starboard`, `nacelle_port`, `nacelle_starboard`, `bussard_port`, `bussard_starboard`, `grille_port`, `grille_starboard`. It is 289 m long with the bow toward +z and Y up: fan art made in code for LCARdS, no third-party model.

```yaml live
type: custom:lcards-astrometrics-card
height: 380
camera:
  view: three
  views:
    three: { target: [0, -6, 0], yaw: 145, tilt: 22, distance: 105 }
backdrop:
  stars: { count: 1500 }
points:
  - { id: bridge, object: ship, part: bridge, label: BRIDGE, marker: dot, style: major }
  - { id: deflector, object: ship, part: deflector, label: DEFLECTOR, marker: dot }
  - { id: port, object: ship, part: nacelle_port, label: PORT NACELLE, marker: dot }
  - { id: starboard, object: ship, part: nacelle_starboard, label: STARBOARD NACELLE, marker: dot }
objects:
  - { type: grid, shape: disc, radius: 70, pattern: polar, line_spacing: 10, spoke_count: 24, at: [0, -25, 0] }
  - { type: model, id: ship, src: builtin:constitution, size: 70, scan_period: 5, animation: all }
```

Labels on the far side of the ship hide behind it: drag to turn the ship until the port nacelle is behind the hull, and its label goes. Models hide labels by their real shape (a small depth image of the scene, taken only when the camera or the model moves), not by a bounding sphere.

**Your own models.** The built-in ship (6,500 triangles, 147 KB) costs about 1.5 ms a frame on a laptop GPU, depth image included. Every extra triangle costs a little more, so simplify a model before you use it (Blender's Decimate modifier, or `gltf-transform simplify`) and compress it with `gltf-transform meshopt`. Name the parts you want points on in the file. The model loader is a separate download the first time a card uses a model.
