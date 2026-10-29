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
| Where a moving point has been (a fading line behind a ship or planet) | [`trail`](#trail) |
| A star, a galactic core, a beacon (a soft light) | [`glow`](#glow) |
| Clouds of gas | [`nebula`](#nebula) |
| An asteroid belt (a band of rocks round a centre) | [`belt`](#belt) |
| Your own picture on the plane | [`image`](#image) |
| A ship, a station, any 3D model | [`model`](#model) |
| A Borg cube (or a plain shaded box) | [`cube`](#cube) |
| A star system at true scale inside a larger scene (its own points and objects, in units of its own) | [`system`](#system) |

## Keys every object takes

| Key | What it does |
|---|---|
| `id` | A name for points standing on it (`object`), rules and fly-to. Default `type#n`: the first grid is `grid#1`. |
| `at` | Where it sits: a point id (it follows the point) or `[x, y, z]`. Default the origin. |
| `rotation: [x, y, z]` | Turns it, degrees: y is a bearing, x tips it toward the camera, z rolls it. |
| `spin` | Turns it round its own vertical axis, degrees per second. Points on it turn with it. |
| `opacity`, `visible` | Opacity 0 to 1; `visible: false` hides it (its points still work). |
| `max_distance`, `min_distance`, `fade` | Shown only within a camera distance, as on points: [below](#distance). |
| `tags` | Tags for [rules](./data#rules): a rule on `tag:<name>` changes every object with the tag. |
| `tap_action`, `hold_action`, `view` | As on [points](./points#actions). An object without a `tap_action` is not tappable. |

Colours are theme tokens (`theme:colors.ui.primary`), CSS variables (`var(--lcars-blue)`) or plain colours. Widths and dashes are px.

Moving effects (nebula clouds, scan bands on grids, spheres and volumes, moving dashes and pulses on lines, animated fills on spheres and grids, warp streaks) are on the [Effects](./effects) page.

## Distance

Any object can show only within a range of camera distances, with the same keys as [points](./points#visibility). The distance is from the camera to the nearest edge of the object (0 when the camera is inside it), so a large grid does not vanish while you fly through it. A flat grid (`shape: plane` or `disc`, not deformed) is measured to its surface: above a galactic disc the distance is your height over it, so `min_distance` can hide the disc once you dive into a star system.

| Key | What it does |
|---|---|
| `max_distance` | Hidden when the camera is farther than this: a planet that appears as you close in on its system. It fades out over the 10% past it. |
| `min_distance` | Hidden when the camera is closer than this: a sector outline that gives way to the system inside. It fades in over the 10% before it. |
| `fade: [start, end]` | Fades out between these distances. |

Two things with touching ranges cross-fade, so one can stand in for the other at a distance: a ship's model close up and a marker far away (`max_distance: 60` on the model, `min_distance: 60` on a point at it with `marker: ship` or `marker: starbase`). An object out of range is not drawn and cannot be tapped; its points keep their own ranges. Zoom into the star below: its planets and their orbits appear as you close in.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, 0, 0], yaw: 20, tilt: 35, distance: 420 }
points:
  - { id: star, xyz: [0, 0, 0], marker: dot, label: SOL, style: major, min_distance: 140 }
  - { id: earth, polar: [30, 60], object: orbit, label: EARTH, style: minor, max_distance: 150 }
objects:
  - { type: glow, id: sun, size: 24, color: var(--lcars-yellow) }
  - { type: ring, id: orbit, radius: 30, color: var(--lcars-blue), spin: 6, max_distance: 120 }
  - { type: sphere, at: earth, radius: 2.5, image: builtin:earth_blue_marble, line_width: 0, max_distance: 120 }
  - { type: ring, radius: 55, color: var(--lcars-blue), max_distance: 120 }
  - { type: grid, shape: disc, radius: 90, line_spacing: 30, opacity: 0.6, min_distance: 120 }
```

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

`deform` is a list of deformations applied in order to any grid, and to a [sphere](#sphere). Round the axis on a cylinder, sphere, dome or well; up and down on a plane or disc. The lines are painted on the surface and stretch with it; edges, cell fills and points standing on the grid (`object: <grid>`) move with it, and picking a point on it in the Studio gives its place on the undeformed grid. Amplitudes are fractions of the grid's size (its radius, or half a plane's longer side). A deformation is a still shape until you give it a `period` (seconds per cycle) or, for noise, a `drift`; moving ones run on the scene clock and hold still under reduced motion.

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

Each `cells` entry is a range `from` one corner cell `to` the other (or one `cell`), with `color`, `opacity`, `shade` (0 to 1: each cell a little lighter or darker, as on a printed map; the same cell always gets the same shade), `seed` and `edges` (an outline: `true` or `{ width, color, opacity }`). The [sector map starter](./starters#sector-map) shows them together.

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

A planet or globe: latitude and longitude lines (`line_spacing_deg`, or `lat_step` and `lon_step` for different spacings) over a solid body (`fill_color`, `fill_opacity`) that hides what is behind it, labels included (`occlude: false` turns that off). `image` wraps a map around it: one of the [built-in planet maps](#built-in-planet-maps), or your own equirectangular picture (`/local/mars.jpg`; longitude 0 in the middle). For a planet with no map (or a made-up one), a [`fill_effect` preset](./effects#planet-types) paints a planet type. The grid line keys (`color`, `line_width`, ...) work as on a grid, and `deform` as on a grid sphere. `latlon` points stand on it and turn with its `spin`. For a see-through wireframe ball with no body, use a [grid](#grid) with `shape: sphere`.

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

### Built-in planet maps

LCARdS ships these maps (2048 x 1024, longitude 0 in the middle). All are public domain: NASA and USGS imagery is not subject to copyright in the United States.

| `image` | Planet | Source |
|---|---|---|
| `builtin:earth_blue_marble` | Earth | NASA Earth Observatory, Blue Marble: Next Generation (July 2004) |
| `builtin:moon_lroc` | Moon | NASA Scientific Visualization Studio, CGI Moon Kit (Lunar Reconnaissance Orbiter colour) |
| `builtin:mercury_messenger` | Mercury | USGS Astrogeology, MESSENGER MDIS colour global mosaic |
| `builtin:venus_magellan` | Venus (the surface under its clouds) | USGS Astrogeology, Magellan radar mosaic in synthetic colour |
| `builtin:mars_viking` | Mars | USGS Astrogeology, Viking global colour mosaic |
| `builtin:jupiter_cassini` | Jupiter | NASA/JPL/Space Science Institute, Cassini map PIA07782 (December 2000) |
| `builtin:pluto_new_horizons` | Pluto | USGS Astrogeology, New Horizons global mosaic (July 2017); the far south was never seen and is grey |

Saturn, Uranus and Neptune have no public-domain global maps: use the `ringed_giant`, `ice_giant` and `storm_giant` [planet types](./effects#planet-types), and Venus as seen from space (a cloud deck) is the `clouds` type. Saturn's rings are a [ring band](#ring).

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v: { target: [0, 0, 0], yaw: 0, tilt: 12, distance: 120 }
objects:
  - { type: sphere, at: [-45, 0, 0], radius: 9, image: builtin:mercury_messenger, line_width: 0.5, spin: 10 }
  - { type: sphere, at: [-22, 0, 0], radius: 9, image: builtin:venus_magellan, line_width: 0.5, spin: 10 }
  - { type: sphere, at: [0, 0, 0], radius: 9, image: builtin:moon_lroc, line_width: 0.5, spin: 10 }
  - { type: sphere, at: [22, 0, 0], radius: 9, image: builtin:mars_viking, line_width: 0.5, spin: 10 }
  - { type: sphere, at: [45, 0, 0], radius: 9, image: builtin:jupiter_cassini, line_width: 0.5, spin: 10 }
```

## ring

A circle or ellipse: an orbit, a rim, a range ring. `at` is its centre (a point id: the ring follows it), `radius` (or `[a, b]` for an ellipse), `inclination` and `node` (the bearing of the line where an inclined ring crosses the plane), `arc: [from, to]` for part of it, and the line keys below.

With `image`, the ring is a flat band from `inner_radius` (default half the radius) out to `radius`, the picture laid across its width: its left edge on the inner rim, its right edge on the outer. `builtin:saturn_rings` is Saturn's rings from the D ring to the F ring, drawn from their published radii: use `radius` 2.33 and `inner_radius` 1.11 times the planet's radius. `image_opacity` fades it and `image_color` tints it. A planet in its middle hides the far side of the band, and the near side passes in front. The ring's line is drawn too only when you set `width`.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v: { target: [0, 0, 0], yaw: 25, tilt: 18, distance: 50 }
objects:
  - { type: sphere, id: saturn, radius: 8, fill_effect: { preset: ringed_giant }, line_width: 0.5, spin: 12 }
  - { type: ring, radius: 18.6, inner_radius: 8.9, inclination: 27, image: builtin:saturn_rings }
```

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

## trail

A line behind a moving point, showing where it has been: a ship's wake, the last stretch of a planet's orbit. `point` names the point to follow; it must move (on a spinning ring, on a model part during an animation, or placed from an entity's state).

| Key | What it does |
|---|---|
| `point` | The id of the point to follow. |
| `length` | How far back it reaches, in seconds of the point's motion (default 10). |
| `fade_tail` | `true` (default): bright at the point, fading to black at the tail, which is the background in space (over a planet the tail shows dark). `false`: one colour all along. |
| `width`, `dash`, `color`, `blend` | As on a path. Default colour `var(--lcars-orange)`. |

The trail is built while the card is open: it starts empty and grows as the point moves. A point placed from an entity leaves a line through the positions it reported since the card opened. Under reduced motion a point on a ring holds still, so its trail stops growing; a point that jumps with an entity still leaves its line.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, 0, 0], yaw: 20, tilt: 35, distance: 120 }
points:
  - { id: sun, xyz: [0, 0, 0] }
  - { id: ship, polar: [40, 0], object: orbit, marker: dot, label: SHIP, style: minor }
  - { id: probe, polar: [22, 180], object: inner, marker: dot, label: PROBE, style: tiny }
objects:
  - { type: glow, at: sun, size: 30, color: var(--lcars-yellow) }
  - { type: ring, id: orbit, radius: 40, spin: 20, width: 0.5, opacity: 0.2, rotation: [12, 0, 0] }
  - { type: ring, id: inner, radius: 22, spin: -45, width: 0.5, opacity: 0.2 }
  - { type: trail, point: ship, length: 6, width: 3 }
  - { type: trail, point: probe, length: 3, width: 2, color: var(--lcars-blue) }
```

## cube

A Borg cube, the same one as the [Borg screen effect](/core/borg) draws: machinery carved into every face, a rail lattice over it, green light from the recesses and glow spots pulsing deep inside. It sits in the scene like any object: it turns with `rotation` and `spin`, other objects pass into its recesses, and labels behind it hide. `style: plain` is a plain shaded box with its edges instead.

| Key | What it does |
|---|---|
| `style` | `borg` (default) or `plain`. |
| `size` | Scene units: one number for a cube, or `[x, y, z]` for a box. Default 20. |
| `color` | `borg`: the light from inside and the hull's tint (default `var(--lcards-green-medium)`). `plain`: the box (default `var(--lcards-gray-medium)`). |
| `glow_color` | `borg`: the glow spots (default `var(--lcards-green-lightest)`). |
| `detail` | `borg`: `true` (default) carves the machinery into the faces; `false` draws flat faces with the lattice, for slow graphics hardware. |
| `seed` | `borg`: where the glow spots sit. |
| `edges`, `edge_color`, `opacity` | `plain`: its edges (on by default, `theme:colors.ui.secondary`) and how see-through it is. |
| `occlude` | Hide labels and cards behind it (default `true`). |

The spots pulse on the scene clock, so they hold still under reduced motion. For the cube's green halo, put a `glow` at the same point. The carved cube costs about as much as the screen effect's cube for the pixels it covers: one cube filling the card is fine on a laptop; for many cubes or a slow tablet use `detail: false`.

```yaml live
type: custom:lcards-astrometrics-card
height: 380
camera:
  views:
    v: { target: [0, 0, 0], yaw: 35, tilt: 20, distance: 60 }
backdrop:
  stars: { count: 1500 }
points:
  - { id: cube, xyz: [0, 0, 0] }
  - { id: name, at: cube, offset: [0, 18, 0], label: BORG CUBE, style: major }
objects:
  - { type: glow, at: cube, size: 60, color: var(--lcards-green-medium), opacity: 0.5 }
  - { type: cube, at: cube, size: 20, spin: 5 }
```

## nebula

Clouds of gas in the scene, in the look of the nebula background preset: `radius` or `size` (the region), `cloud_count`, `seed`, `colors`, `turbulence`, `drift`. See [Effects: nebula](./effects#nebula).

## belt

An asteroid belt: a band of low-poly rocks round its centre (`at`, a point id or `[x, y, z]`; a point id makes it follow a star or planet). The rocks are lit from that centre, as by its star: the side facing it is bright, the far side dark.

| Key | What it does |
|---|---|
| `radius` | `[inner, outer]` radius of the band, scene units. One number is the outer radius (the inner is 0.8 of it). Default `[80, 100]`. |
| `thickness` | How far the rocks spread above and below the plane. Default 0.15 of the band's width. |
| `count` | How many rocks, at most 5000 (default 600). They are one draw, so thousands are fine. |
| `size` | `[smallest, largest]` rock, scene units: many small ones and a few large. Default `[0.4, 1.6]`. |
| `seed` | A different number gives a different belt; the same config always gives the same one. |
| `period` | Seconds for the inner edge to go round once. The outer rocks take longer, as real orbits do. Default 0 (still). |
| `tumble` | How fast each rock turns on its own axis, degrees per second (each a little faster or slower). Default 30; 0 holds them still. |
| `color` | The rocks' colour, varied a little per rock. Default `var(--lcards-gray-light)`. |

`rotation` tilts the belt, and `spin` turns it as one piece. `period` and `tumble` hold still under reduced motion. From far away, when even the largest rocks would be under about 1.5 px, the rocks are drawn as dots of the same size and shade (cheaper, and it looks the same); zoom in and they are rocks again.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, 0, 0], yaw: 20, tilt: 22, distance: 150 }
points:
  - { id: sun, xyz: [0, 0, 0], label: SOL, style: minor }
objects:
  - { type: glow, at: sun, size: 40, color: var(--lcars-yellow) }
  - { type: sphere, at: sun, radius: 6, fill_color: var(--lcars-yellow), color: var(--lcars-orange), line_spacing_deg: 30 }
  - { type: belt, at: sun, radius: [45, 62], count: 1500, size: [0.3, 1.8], period: 40 }
```

Close up, the rocks are rough and faceted:

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v: { target: [50, 0, 0], yaw: 250, tilt: 10, distance: 16 }
objects:
  - { type: glow, size: 30, color: var(--lcars-yellow) }
  - { type: belt, radius: [44, 56], thickness: 4, count: 1500, size: [0.2, 1.6], tumble: 20, color: var(--lcars-khaki) }
```

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
| `src` | The file. `builtin:<name>` is a model shipped with LCARdS (see [built-in models](#built-in-models)). Your own goes in `/config/www/` and is `/local/...` here. |
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

**Points on a model** use `object:` with the model's id. `xyz` is then in the file's own coordinates, so `size` never moves them, and `part:` puts a point on a named part (a node in the file) so it follows that part when an animation moves it. In the Astrometrics Studio, **Pick on preview** places a point on the model's surface, and the part list fills in from the file. See [placement forms](./points#placement-forms).

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

### Built-in models

Fan art made in code for LCARdS (no third-party model), recreating the designs seen on screen. All are in metres with Y up; `material: original` shows their own colours and lit windows.

| `src` | What it is | Parts (`part:`) |
|---|---|---|
| `builtin:constitution` | A Constitution-class starship (the original series), 289 m long, the bow toward +z. One animation clip, `bussards`. | `saucer`, `bridge`, `sensor_dome`, `impulse`, `neck`, `secondary_hull`, `deflector`, `shuttle_bay`, `pylon_port`, `pylon_starboard`, `nacelle_port`, `nacelle_starboard`, `bussard_port`, `bussard_starboard`, `grille_port`, `grille_starboard` |
| `builtin:deep_space_nine` | Deep Space 9 (Terok Nor), the Cardassian station of Deep Space Nine: about 1450 m across and 1070 m tall. | `ops`, `upper_core`, `promenade`, `lower_core` (its bottom tip), `habitat_ring`, `docking_ring`, `crossover_bridges`, `docking_ports`, `windows`, `upper_pylon_1` to `upper_pylon_3` and `lower_pylon_1` to `lower_pylon_3` (their tips) |
| `builtin:earth_spacedock` | Earth Spacedock, from Star Trek III: The Search for Spock onward: about 3810 m across and 5795 m tall. | `space_doors` (the top), `cap`, `stem`, `docking_ring`, `docking_ports`, `panels`, `windows`, `base` (the bottom tip) |
| `builtin:utopia_planitia_drydock` | A drydock of the Utopia Planitia Fleet Yards over Mars, sized for a Galaxy-class ship: about 760 m long, the bow end toward +z. Place several for the yards. | `frame`, `lights`, `berth` (where a ship sits), `bow`, `stern` |

Rings and rims (`habitat_ring`, `docking_ring`, `cap`, `promenade`) put their part point on the front face (+z), so a label sits on the structure rather than in the middle of the station.

```yaml live
type: custom:lcards-astrometrics-card
height: 420
camera:
  view: station
  views:
    station: { target: [0, 0, 0], yaw: 30, tilt: 10, distance: 170 }
backdrop:
  stars: { count: 1500 }
points:
  - { id: ops, object: ds9, part: ops, label: OPS, marker: dot, style: major }
  - { id: promenade, object: ds9, part: promenade, label: PROMENADE, marker: dot }
  - { id: pylon, object: ds9, part: upper_pylon_1, label: UPPER PYLON 1, marker: dot }
objects:
  - { type: model, id: ds9, src: builtin:deep_space_nine, size: 90, material: original }
```

**Your own models.** The built-in ship (6,500 triangles, 147 KB) costs about 1.5 ms a frame on a laptop GPU, depth image included; the starbases have 2,000 to 14,000 triangles. Every extra triangle costs a little more, so simplify a model before you use it (Blender's Decimate modifier, or `gltf-transform simplify`) and compress it with `gltf-transform meshopt`. Name the parts you want points on in the file. The model loader is a separate download the first time a card uses a model.

## system

A star system at true scale inside a larger scene: Sol in km at a point of a galaxy in light years. It draws nothing itself; it holds `points` and `objects` written in its own units, which keep their precision however small they are next to the scene. See [Scale: star systems](./scale#star-systems) for a whole dive from a galaxy to a station.

| Key | What it does |
|---|---|
| `id` | Its name (default `system#n`). |
| `at` | Where its origin sits: a point of the scene, or `[x, y, z]` in scene units. |
| `units` | What one unit inside is: `m`, `km`, `au`, `ly` or `pc`. Needs the card's own `units`. |
| `scale` | Scene units per unit inside, for units without a name (wins over `units`). |
| `points` | Its points, in its units ([Points](./points)). |
| `objects` | Its objects, in its units: any type but another `system`. |
| `visible` | `false` hides everything in it. |

```yaml
type: custom:lcards-astrometrics-card
units: ly
camera:
  views:
    sol: { target: sun, yaw: 40, tilt: 35, distance: 700000000 }
points:
  - { id: sol, xyz: [-8890, 60, 24430], marker: dot, label: SOL, style: major }
objects:
  - type: system
    at: sol
    units: km
    points:
      - { id: sun, xyz: [0, 0, 0] }
      - { id: earth, polar: [149597870.7, 30], marker: dot, label: EARTH }
    objects:
      - { type: sphere, at: sun, radius: 696340, fill_color: var(--lcars-yellow) }
      - { type: ring, radius: 149597870.7, width: 1, color: var(--lcars-blue) }
      - { type: sphere, at: earth, radius: 6371, image: builtin:earth_blue_marble }
```
