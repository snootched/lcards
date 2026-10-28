---
description: "Astrometrics card objects: grid surfaces (plane, disc, dome, sphere, cylinder), sector maps, territory volumes, planets, rings, routes, beams, images, glows, nebulae and 3D models (glTF) as holograms."
---

# Objects

`objects` is the list of what the scene draws, in order. Each has a `type`; the rest of its keys depend on the type.

<CardGallery set="astro-objects" />

## Which type for what

| You want | Use |
|---|---|
| A planet, moon or globe (solid, hides what is behind it, can wear a map) | [`sphere`](#sphere) |
| A wireframe: a sector map, a galaxy disc, a sky dome, a see-through ball, a tube, a gravity well | [`grid`](#grid) |
| A territory or region of space (a see-through box of cells) | [`volume`](#volume) |
| An orbit, a range ring, a rim | [`ring`](#ring) |
| A route through points, an arched route, the sun's track | [`path`](#path) |
| A weapon, transporter or sensor beam (a glowing straight line) | [`beam`](#beam) |
| A star, a galactic core, a beacon (a soft light) | [`glow`](#glow) |
| Clouds of gas | [`nebula`](#nebula) |
| Your own picture on the plane | [`image`](#image) |
| A ship, a station, any 3D model | [`model`](#model) |

## Keys every object takes

| Key | What it does |
|---|---|
| `id` | A name for points standing on it (`object`), rules and fly-to. Default `type#n`: the first grid is `grid#1`. |
| `at` | Where it sits: a point id (it follows the point) or `[x, y, z]`. Default the origin. |
| `rotation: [x, y, z]` | Turns it, degrees: y is a bearing, x tips it toward the camera, z rolls it. |
| `spin` | Turns it round its own vertical axis, degrees per second. Points on it turn with it. |
| `opacity`, `visible` | Opacity 0 to 1; `visible: false` hides it (its points still work). |
| `tags` | Tags for [rules](./data#rules): a rule on `tag:<name>` changes every object with the tag. |
| `tap_action`, `hold_action`, `view` | As on [points](./points#actions). An object without a `tap_action` is not tappable. |

Colours are theme tokens (`theme:colors.ui.primary`), CSS variables (`var(--lcars-blue)`) or plain colours. Widths and dashes are px.

Moving effects (nebula clouds, scan bands on grids, spheres and volumes, moving dashes and pulses on lines, animated fills on spheres and grids, warp streaks) are on the [Effects](./effects) page.

## grid

A grid surface. `shape` picks it: `plane` (`size`), `disc` (`radius`, or `[inner, outer]` for a hole in the middle), `dome` (a half sphere), `sphere`, `cylinder` (`radius`, `height`) or `well` (a funnel, [below](#wells-and-wormholes)). Any shape can be [deformed](#deformed-grids). The line keys are the [background grid](/core/effects/background-animations/preset-reference#grid)'s: `pattern`, `line_spacing`, `major_row_interval`, `major_col_interval`, `line_width`, `line_width_major`, `color`, `color_major`, `fill_color`, `spoke_count`, `hex_radius`, `dot_radius`, `back_opacity`. On curved shapes `line_spacing_deg` puts rings and meridians every N degrees.

- `edges` (default on): outlines on the open edges: the rim of a disc, dome or well, the ends of a cylinder, the frame of a plane; `edge_width` (default `line_width_major`) and `edge_color` (default `color_major`).
- `ring_labels: { step, radius, start, alt, style, color }`: bearing labels round a disc or dome.

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

### Wells and wormholes

`shape: well` is a funnel down from its rim: `radius` is the rim, `depth` how far down it goes (default the radius), and the profile is the background grid well's: `well_shape` (`trumpet`, the gravity well; `cone`; `bowl`; `wormhole`, two trumpets throat to throat) with `well_throat` (the throat as a fraction of the rim, default 0.15), or any `well_profile` (diameters from the rim down, such as `[1, 0.3, 0.6]`). The rim sits at the object's position, and the rings are spaced evenly along the surface however steep it gets. `border` draws the rim, and a wormhole's lower mouth.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, -40, 0], yaw: 20, tilt: 25, distance: 260 }
objects:
  - { type: grid, shape: disc, radius: [50, 60], at: [-65, 0, 0], pattern: polar, spoke_count: 24, line_spacing: 5 }
  - { type: grid, shape: well, radius: 50, depth: 60, at: [-65, 0, 0], line_spacing_deg: 15 }
  - { type: grid, shape: well, well_shape: wormhole, well_throat: 0.25, radius: 40, depth: 110, at: [65, 0, 0], line_spacing_deg: 20, color: var(--lcars-blue) }
```

### Deformed grids

`deform` is a list of deformations applied in order to any grid, and to a [sphere](#sphere). Round the axis on a cylinder, sphere, dome or well; up and down on a plane or disc. The lines are painted on the surface and stretch with it; edges, cell fills and points standing on the grid (`object: <grid>`) move with it, and picking a point on it in the editor gives its place on the undeformed grid. Amplitudes are fractions of the grid's size (its radius, or half a plane's longer side). A deformation is a still shape until you give it a `period` (seconds per cycle) or, for noise, a `drift`; moving ones run on the scene clock and hold still under reduced motion.

| `type` | Round an axis | On a plane or disc | Keys (defaults) |
|---|---|---|---|
| `wobble` | Bulges travelling round (jelly) | Ripples across it, larger toward the edge | `amplitude` (0.08), `lobes` (3; 0 swells the whole ring), `waves` (1: along the axis, so the bulges spiral), `period` (seconds for a bulge to travel round) |
| `bend` | The axis bends toward `bearing` | The sheet curls up along `bearing` | `amplitude` (0.25), `bearing` (0), `motion`: `sway` (to and fro), `circle` (the bend turns round: a tornado) or `none`; `period` (seconds per sway or turn), `anchor` |
| `twist` | Turns more toward the far end | A whirlpool: most at the centre, none at the rim | `angle` (90 degrees), `period` (with one, it swings between plus and minus `angle`), `anchor` |
| `noise` | Smooth lumps in and out | Smooth hills and hollows | `amplitude` (0.05), `base_frequency` (detail per scene unit, as on [fills](./effects#animated-surface-fills); default about 3 lumps across), `num_octaves` (2), `drift` (scene units per second), `seed` |

`anchor` (`bottom`, `top` or `middle`) is the end of the axis that stays put. A deformed grid is drawn with finer patches than a plain one and is moved on the CPU each frame while it moves: about 0.05 ms per grid for wobble, bend and twist on a desktop; drifting noise costs more (about 0.25 ms for a plane).

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v: { target: [0, 30, 0], yaw: 15, tilt: 15, distance: 300 }
objects:
  - id: jelly
    type: grid
    shape: cylinder
    radius: 25
    height: 70
    at: [-85, 35, 0]
    line_spacing_deg: 20
    color: var(--lcars-orange)
    deform:
      - { type: wobble, amplitude: 0.15, lobes: 3, waves: 1, period: 4 }
  - id: tornado
    type: grid
    shape: well
    well_profile: [1, 0.35, 0.15, 0.08]
    radius: 40
    depth: 110
    at: [0, 110, 0]
    line_spacing_deg: 20
    color: var(--lcars-blue)
    deform:
      - { type: twist, angle: 120, anchor: top }
      - { type: bend, amplitude: 0.5, motion: circle, period: 7, anchor: top }
  - id: whirlpool
    type: grid
    shape: disc
    radius: 45
    at: [85, 0, 0]
    pattern: polar
    spoke_count: 18
    line_spacing: 6
    deform:
      - { type: twist, angle: 150 }
      - { type: wobble, amplitude: 0.06, lobes: 0, waves: 3, period: 2.5 }
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

Each `cells` entry is a range `from` one corner cell `to` the other (or one `cell`), with `color`, `opacity`, `shade` (0 to 1: each cell a little lighter or darker, as on a printed map; the same cell always gets the same shade), `seed` and `edges` (an outline: `true` or `{ width, color, opacity }`). The [sector map reference](./#sector-map) shows them together.

## volume

A see-through box of grid cells: a territory. `shape: sector` spans `radius: [inner, outer]`, bearings `angle: [from, to]` (to may pass 360 to cross north) and `height: [bottom, top]` round the centre; `shape: box` is `size: [w, h, d]` round `at`.

| Key | What it does |
|---|---|
| `cells` | Cell size on the faces: `ring`, `angle` (degrees), `layer` for a sector; `x`, `y`, `z` for a box |
| `color`, `face_opacity` | Colour, and the face lines' opacity (the edges stay brighter) |
| `line_width`, `edges`, `edge_width`, `edge_color` | Face line width; outline on or off; outline width and colour (default `color`) |
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

A planet or globe: latitude and longitude lines (`line_spacing_deg`, or `lat_step` and `lon_step` for different spacings) over a solid body (`fill_color`, `fill_opacity`) that hides what is behind it, labels included (`occlude: false` turns that off). `image` wraps a map around it: `builtin:earth_blue_marble` is the Earth, shipped with LCARdS (NASA's Blue Marble, July 2004), or your own equirectangular picture (`/local/mars.jpg`; longitude 0 in the middle). The grid line keys (`color`, `line_width`, ...) work as on a grid, and `deform` as on a grid sphere. `latlon` points stand on it and turn with its `spin`. For a see-through wireframe ball with no body, use a [grid](#grid) with `shape: sphere`.

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
  - { type: sphere, id: earth, radius: 15, image: builtin:earth_blue_marble, line_spacing_deg: 30, color: var(--lcars-blue) }
```

The image's credit: NASA Earth Observatory, Blue Marble: Next Generation. NASA texture maps are not subject to copyright in the United States.

## ring

A circle or ellipse: an orbit, a rim, a range ring. `at` is its centre (a point id: the ring follows it), `radius` (or `[a, b]` for an ellipse), `inclination` and `node` (the bearing of the line where an inclined ring crosses the plane), `arc: [from, to]` for part of it, and the line keys below.

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
  - { type: ring, at: star, radius: 30, inclination: 25, node: 40, color: var(--lcars-blue) }
  - { type: ring, at: star, radius: [70, 50], dash: [4, 4] }
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
