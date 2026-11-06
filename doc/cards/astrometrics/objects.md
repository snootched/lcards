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
| A territory or region of space (see-through cells: a box, a pie slice or any outline) | [`volume`](#volume) |
| An orbit, a range ring, a rim | [`ring`](#ring) |
| A route through points, an arched route, the sun's track | [`path`](#path) |
| A weapon, transporter or sensor beam (a glowing straight line) | [`beam`](#beam) |
| Where a moving point has been (a fading line behind a ship or planet) | [`trail`](#trail) |
| A star, a galactic core, a beacon (a soft light) | [`glow`](#glow) |
| Clouds of gas | [`nebula`](#nebula) |
| An asteroid belt (a band of rocks round a centre) | [`belt`](#belt) |
| One asteroid up close (a tumbling rock, lit from its star) | [`asteroid`](#asteroid) |
| A comet (a nucleus, a glowing coma and tails pointing away from its star) | [`comet`](#comet) |
| A spiral galaxy (stars, arms, a bar and dust; the Milky Way by default) | [`galaxy`](#galaxy) |
| Your own picture on the plane | [`image`](#image) |
| A ship, a station, any 3D model | [`model`](#model) |
| A Borg cube (or a plain shaded box) | [`cube`](#cube) |
| The Crystalline Entity (a glowing crystal spine and branches round a starburst core) | [`crystalline`](#crystalline) |
| Lightning: bolts that flash and go, or held flickering columns (lights the gas of a volume nebula it strikes in) | [`lightning`](#lightning) |
| A star system at true scale inside a larger scene (its own points and objects, in units of its own) | [`system`](#system) |

## Keys every object takes

| Key | What it does |
|---|---|
| `id` | A name for points standing on it (`object`), rules and fly-to. Default `type#n`: the first grid is `grid#1`. |
| `at` | Where it sits: a point id (it follows the point) or `[x, y, z]`. Default the origin. |
| `rotation: [x, y, z]` | Turns it, degrees: y is a bearing, x tips it toward the camera, z rolls it. |
| `spin` | Turns it round its own vertical axis, degrees per second. Points on it turn with it. |
| `look` | `diagram` or `realistic`: shows only in that [look](./#looks-diagram-and-realistic) of the card (and in `mixed`). Left out, it shows in every look, and an object with a diagram form switches its parts with the look (a mapped sphere, a filled grid, a model with its own materials, a glow, cube, asteroid, belt, comet, galaxy, crystalline entity or volume nebula as its wireframe; a ring drawn as a line or a path hides in the realistic look). `all`: every look, as configured. |
| `face` | `motion`: at a moving point, it turns to face where the point is going ([below](#facing-the-way-it-goes)). A point id: it turns toward that point ([facing a point](#facing-a-point)). |
| `opacity`, `visible` | Opacity 0 to 1; `visible: false` hides it (its points still work). |
| `max_distance`, `min_distance`, `fade` | Shown only within a camera distance, as on points: [below](#distance). |
| `hide_in_systems` | `true` hides it while the camera is inside a [star system](./scale#star-systems), so galaxy-scale volumes and lines step aside in the close-ups; a list of system ids hides it in those only (a route that belongs in the systems at its ends). Points take it too. |
| `tags` | Tags for [rules](./data#rules): a rule on `tag:<name>` changes every object with the tag. |
| `tap_action`, `hold_action`, `view` | As on [points](./points#actions). An object without a `tap_action` is not tappable. |

Colours are theme tokens (`theme:colors.ui.primary`), CSS variables (`var(--lcars-blue)`) or plain colours. Widths and dashes are px.

Moving effects (nebula clouds, scan bands on grids, spheres and volumes, moving dashes and pulses on lines, animated fills on spheres and grids, warp streaks) are on the [Effects](./effects) page.

### Facing the way it goes

An object `at` a moving point slides along with it, keeping its own turn. With `face: motion` it turns to face where the point is going instead: its +z (the bow of every built-in model) along the travel, its top up, so a ship rides its orbit nose first and banks nowhere. `rotation` applies on top, in the object's own frame: for a model file whose bow is along +x, `rotation: [0, 90, 0]` turns the bow onto the travel.

The heading comes from the point's movement, however it moves (a spinning ring, an entity, a rule), measured on the object the point stands on: a ship on a ring round a planet that is itself on an orbit faces round the planet, not along the planet's way. Before the point first moves, and under reduced motion (which holds spin), a point on a spinning object faces along the spin; anything else keeps its `rotation` until the point moves.

```yaml
type: custom:lcards-astrometrics-card
camera:
  views:
    v: { target: [0, 0, 0], yaw: 20, tilt: 35, distance: 120 }
points:
  - { id: ship, polar: [40, 90], object: orbit, label: ENTERPRISE, style: tiny }
objects:
  - { type: ring, id: orbit, radius: 40, spin: 12, width: 0.5, opacity: 0.4 }
  - { type: model, at: ship, src: builtin:constitution_class_refit, size: 8, face: motion }
  - { type: trail, point: ship, length: 4, width: 2 }
```

### Facing a point

`face: <point id>` turns the object toward a point, wherever the point is, even in another star system or across the galaxy, and keeps it turned as either moves. Most objects turn their +z to it, top up. An object round an axis (a grid other than a plane, a ring, a belt, a galaxy) turns down its axis instead, so a [well](#wells-and-wormholes)'s narrow end leads to the point and a ring lies across the way to it. `rotation` applies on top.

Two wells facing each other make one wormhole: a mouth at each end, and a line from throat to throat (a point on each well at `[0, -depth, 0]`, the bottom of its axis) as the throat stretched thin between them:

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, 0, 0], yaw: 0, tilt: 25, distance: 340 }
points:
  - { id: alpha, xyz: [-110, 0, 0] }
  - { id: gamma, xyz: [110, 0, 0] }
  - { id: alpha_throat, object: mouth_alpha, xyz: [0, -50, 0] }
  - { id: gamma_throat, object: mouth_gamma, xyz: [0, -50, 0] }
objects:
  - { type: grid, id: mouth_alpha, shape: well, well: { throat: 0.1 }, radius: 40, depth: 50, at: alpha, face: gamma, line_spacing_deg: 20, color: var(--lcars-blue) }
  - { type: grid, id: mouth_gamma, shape: well, well: { throat: 0.1 }, radius: 40, depth: 50, at: gamma, face: alpha, line_spacing_deg: 20, color: var(--lcars-blue) }
  - { type: path, points: [alpha_throat, gamma_throat], dash: { pattern: [6, 4], speed: 30 }, color: var(--lcars-yellow), width: 2 }
```

An arched path (`arc`) leaves each end rising: it climbs about 3.14 times its `arc` over the distance between the ends. To line a mouth up with it, face a point that much above the far end (`{ id: aim, at: gamma, offset: [0, 12566, 0] }` for an `arc` of 4000). The [Star Trek galaxy starter](./starters#star-trek-galaxy)'s Bajoran wormhole is built this way.

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

A grid surface. `shape` picks it: `plane` (`size`), `disc` (`radius`, or `[inner, outer]` for a hole in the middle), `dome` (a half sphere), `sphere`, `cylinder` (`radius`, `height`) or `well` (a funnel, [below](#wells-and-wormholes)). Any shape can be [deformed](#deformed-grids). The line keys follow the [background grid](/core/effects/background-animations/preset-reference#grid): `pattern`, `line_spacing`, `line_width`, `color`, `spoke_count`, `hex_radius`, `dot_radius`, `back_opacity`; `major: { row_interval, col_interval, line_width, color }` for the brighter major lines, and `fill: { color }` behind the lines. On curved shapes `line_spacing_deg` puts rings and meridians every N degrees.

- `edges` (default on): outlines on the open edges: the rim of a disc, dome or well, the ends of a cylinder, the frame of a plane. `false` turns them off; `edges: { width, color }` sets them (default the major lines' width and colour).
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

`shape: well` is a funnel down from its rim: `radius` is the rim, `depth` how far down it goes (default the radius), and the profile is set in `well`: `well.shape` (`trumpet`, the gravity well; `cone`; `bowl`; `wormhole`, two trumpets throat to throat) with `well.throat` (the throat as a fraction of the rim, default 0.15), or any `well.profile` (diameters from the rim down, such as `[1, 0.3, 0.6]`). A profile can narrow several times, and diameters above 1 bulge past the rim, so `[0.1, 0.7, 1, 0.85, 0.45, 0.1]` is a rounded lobe with a neck at each end (the [Bajoran wormhole starter](./starters#bajoran-wormhole) chains three). The rim sits at the object's position, and the rings are spaced evenly along the surface however steep it gets. `border` draws the rim, and a wormhole's lower mouth.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, -40, 0], yaw: 20, tilt: 25, distance: 260 }
objects:
  - { type: grid, shape: disc, radius: [50, 60], at: [-65, 0, 0], pattern: polar, spoke_count: 24, line_spacing: 5 }
  - { type: grid, shape: well, radius: 50, depth: 60, at: [-65, 0, 0], line_spacing_deg: 15 }
  - { type: grid, shape: well, well: { shape: wormhole, throat: 0.25 }, radius: 40, depth: 110, at: [65, 0, 0], line_spacing_deg: 20, color: var(--lcars-blue) }
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
    well: { profile: [1, 0.35, 0.15, 0.08] }
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

A see-through box of grid cells: a territory. `shape: sector` spans `radius: [inner, outer]`, bearings `angle: [from, to]` (to may pass 360 to cross north) and `height: [bottom, top]` round the centre; `shape: box` is `size: [w, h, d]` round `at`; `shape: prism` is any border you draw, `outline: [[x, z], ...]` (at least three points, from `at`; -z is north) between `height: [bottom, top]`, for territories that are not pie slices. In the Astrometrics Studio you can [draw and drag the outline on the preview](./studio#objects).

| Key | What it does |
|---|---|
| `cells` | Cell size on the faces: `ring`, `angle` (degrees), `layer` for a sector; `width`, `height`, `depth` for a box or a prism |
| `color`, `faces.opacity` | Colour, and the face lines' opacity (the edges stay brighter) |
| `line_width`, `edges` | Face line width; the outline: `true` (default), `false`, or `{ width, color }` (default `color`) |
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
  - type: volume
    shape: prism
    at: [-35, 0, 35]
    height: [0, 12]
    outline: [[-20, -10], [5, -18], [22, -2], [12, 16], [-14, 14]]
    color: var(--lcars-green)
```

## sphere

A planet or globe: latitude and longitude lines (`line_spacing_deg`, or `lat_step` and `lon_step` for different spacings) over a solid body (`fill: { color, opacity }`) that hides what is behind it, labels included (`occlude: false` turns that off). `image` wraps a map around it: one of the [built-in planet maps](#built-in-planet-maps), or your own equirectangular picture (`/local/mars.jpg`; longitude 0 in the middle). For a planet with no map (or a made-up one), a [`fill.effect` preset](./effects#planet-types) paints a planet type. The grid line keys (`color`, `line_width`, ...) work as on a grid, and `deform` as on a grid sphere. `latlon` points stand on it and turn with its `spin`. For a see-through wireframe ball with no body, use a [grid](#grid) with `shape: sphere`.

`body: earth` (any [real body](./scale#the-real-solar-system)) turns the sphere as that body really is at the scene date: its axis tilted where the real pole points, a real sidereal day, and longitude 0 of its map where its prime meridian is, so `latlon` points stand over the real places. `spin` and `rotation` do not apply then.

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
| `builtin:sun_sdo` | Sun (extreme ultraviolet, the chromosphere; Carrington longitude 0 in the middle) | NASA Scientific Visualization Studio 30362, STEREO EUVI and SDO AIA 304 Å map (2012) |
| `builtin:phobos_viking` | Phobos | USGS Astrogeology, Viking orbiter global mosaic |
| `builtin:ceres_dawn` | Ceres | USGS Astrogeology, Dawn Framing Camera global mosaic (October 2015) |
| `builtin:io_galileo` | Io | USGS Astrogeology, Galileo SSI and Voyager colour merge mosaic |
| `builtin:europa_galileo` | Europa | USGS Astrogeology, Voyager and Galileo SSI global mosaic |
| `builtin:ganymede_galileo` | Ganymede | USGS Astrogeology, Voyager and Galileo SSI colour mosaic |
| `builtin:callisto_galileo` | Callisto | USGS Astrogeology, Voyager and Galileo SSI global mosaic |
| `builtin:titan_cassini` | Titan (the surface under its haze, near infrared) | USGS Astrogeology, Cassini ISS global mosaic |
| `builtin:triton_voyager` | Triton | USGS Astrogeology, Voyager 2 colour mosaic; most of the north was never seen and is grey |
| `builtin:charon_new_horizons` | Charon | USGS Astrogeology, New Horizons global mosaic (July 2017); the far south was never seen and is grey |

Saturn, Uranus and Neptune have no public-domain global maps: use the `ringed_giant`, `ice_giant` and `storm_giant` [planet types](./effects#planet-types), and Venus as seen from space (a cloud deck) is the `clouds` type. (A 2025 Cassini global map of Saturn exists, but it has gaps at the poles and the rings' shadow across the south, and no clear licence.) Deimos has no global map: give it a grey `fill.color`. Saturn's rings are a [ring band](#ring).

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

`orbit: mars` draws a [real body's](./scale#the-real-solar-system) orbit at the scene date instead: an ellipse with its parent at a focus, tilted and turned as it really is, in the frame's units. Leave `at` out for a planet (the Sun sits at the origin) and put a moon's at its planet (`orbit: io`, `at: jupiter`). `body: saturn` lays a ring in that body's equator (Saturn's rings, below).

With `band: { image }`, the ring is a flat band from `band.inner_radius` (default half the radius) out to `radius`, the picture laid across its width: its left edge on the inner rim, its right edge on the outer. `builtin:saturn_rings` is Saturn's rings from the D ring to the F ring, drawn from their published radii: use `radius` 2.33 and `band.inner_radius` 1.11 times the planet's radius. `band.opacity` fades it and `band.color` tints it. A planet in its middle hides the far side of the band, and the near side passes in front. The ring's line is drawn too only when you set `width`.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v: { target: [0, 0, 0], yaw: 25, tilt: 18, distance: 50 }
objects:
  - { type: sphere, id: saturn, radius: 8, fill: { effect: { preset: ringed_giant } }, line_width: 0.5, spin: 12 }
  - { type: ring, radius: 18.6, band: { image: builtin:saturn_rings, inner_radius: 8.9 }, inclination: 27 }
```

## path

A line through `points` (ids or `[x, y, z]`), or `from` / `to`. With `at`, each `[x, y, z]` is an offset from `at`, turned with `rotation` and `face`, so a drawn shape (a pipeline, an outline) moves with its point; ids stay where they are. `arc` lifts each leg into a curve by that height at its middle. With `sky: sun` or `sky: moon` and `object: <dome>`, it is today's track across the sky, cut at the horizon.

**Line keys** (`ring` and `path`): `width` (px), `dash: [on, off]` (px: the dashes keep their size however close the camera is; `dash: { pattern, speed }` moves them), `color`, or `colors: [from, to]` (fades along the line), `glow` (`true`, or a width factor: an even halo under the line), `line_look: tube` (shaded as a lit pipe across its width: dark edges and a bright stripe, best from 6 px or so; pulses on it become bands of light round it), `blend: add`.

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
  - { type: path, points: [a, star, b], arc: 15, width: 2, colors: [var(--lcars-orange), var(--lcars-yellow)], glow: true }
  - { type: path, at: star, points: [[-40, -25, 0], [0, -32, 0], [40, -25, 0]], arc: 6, width: 8, line_look: tube, glow: 2, pulse: true, color: var(--lcars-blue) }
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

The trail is drawn on the object the point stands on: a moon on a ring round a planet that is itself on an orbit leaves its trail round the planet, riding along with it, not the looping track it makes through the scene. The trail is built while the card is open: it starts empty and grows as the point moves. A point placed from an entity leaves a line through the positions it reported since the card opened. Under reduced motion a point on a ring holds still, so its trail stops growing; a point that jumps with an entity still leaves its line.

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

A Borg cube, the same one as the [Borg screen effect](/core/borg) draws: machinery carved into every face, a rail lattice over it, green light from the recesses and glow spots pulsing deep inside. It sits in the scene like any object: it turns with `rotation` and `spin`, other objects pass into its recesses, and labels behind it hide. `shape: box` is a plain shaded box with its edges instead.

| Key | What it does |
|---|---|
| `shape` | `borg` (default) or `box`. |
| `size` | Scene units: one number for a cube, or `[x, y, z]` for a box. Default 20. |
| `color` | `borg`: the light from inside and the hull's tint (default `var(--lcards-green-medium)`). `box`: the box (default `var(--lcards-gray-medium)`). |
| `glow.color` | `borg`: the glow spots (default `var(--lcards-green-lightest)`). |
| `detail` | `borg`: `true` (default) carves the machinery into the faces; `false` draws flat faces with the lattice, for slow graphics hardware. |
| `seed` | `borg`: where the glow spots sit. |
| `edges`, `opacity` | `box`: its edges (`true` by default, `false`, or `{ color }`, default `theme:colors.ui.secondary`) and how see-through it is. |
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

## lightning

Jagged, forked bolts. With `mode: strike` (the default) a bolt flashes at a random place in the object's region, mostly from high to low: a quick rise, a fade and a weaker second stroke, then a pause. With `mode: column` it holds `count` bolts from the region's floor to its ceiling, crawling and flickering. A bolt inside a [volume nebula](./effects#gas-you-can-fly-into) lights the gas round it in its own colour; any volume nebula it falls in, nothing to link.

| Key | What it does |
|---|---|
| `mode` | `strike` (default) or `column`. |
| `radius`, `size` | The region round `at`: a ball (`radius`, default 50) or a box `[width, height, depth]`. Strikes fall inside it; columns stand on its floor. |
| `rate` | `strike`: about how many strikes a second (default 0.5; the pauses vary round it). 0: none. Can [follow an entity](./data#settings-from-entities). |
| `flash` | `strike`: how long a strike shows, ms (default 150). |
| `count` | `column`: how many columns, spread over the region (default 1). |
| `speed` | `column`: how fast the held bolts crawl (take a new shape) and flicker: 1 (default) as drawn, 0.5 half as fast, 0 still. Can follow an entity. |
| `color` | The bolt (its bright core). Default `var(--lcards-moonlight)`. |
| `glow` | The soft glow round it: `true` (default), `false`, or `{ color, width }` (`width` times the bolt's, default 6). |
| `width` | The bolt's width, px (default 2); its branches are about half as wide. |
| `jaggedness` | How far the channel zigzags, 0 (straight) to 1. Default 0.5 for a strike, 0.25 for a column. |
| `branches` | Forks off the channel, each may fork once more. Default 3 for a strike, 1 for a column. |
| `brightness` | How strongly it lights the gas, 0 to 2 (default 1). Can follow an entity. |
| `lights` | `false`: the bolts only, the gas stays dark. |
| `seed` | Where the strikes fall and how the bolts are shaped. |

Under reduced motion no strike shows and columns stand still and dim. A volume nebula can also have strikes of its own (`lightning:` on the nebula, see [the Badlands](./effects#the-badlands-layers-columns-and-lightning)), or discharges crawling along its ribbon (`mode: crawl`, see [the Nexus](./effects#the-nexus-a-ribbon-and-its-wake)).

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v: { target: [0, 0, 0], yaw: 30, tilt: 6, distance: 300 }
backdrop:
  stars: { count: 2000 }
objects:
  - { type: nebula, render: volume, size: [400, 220, 400], count: 10, colors: [var(--lcars-orange), var(--lcars-red)], seed: 5, density: 1.6, max_radius: 160 }
  - { type: lightning, size: [260, 170, 260], rate: 2, color: var(--lcars-space-white), glow: { color: var(--lcars-lavender) }, branches: 4, seed: 4 }
```

## nebula

Clouds of gas in the scene, in the look of the nebula background preset: `radius` or `size` (the region), `count`, `seed`, `colors`, `turbulence`, `drift`. `preset: badlands` or `badlands_voyager` starts from the Badlands. See [Effects: nebula](./effects#nebula).

## belt

An asteroid belt: a band of low-poly rocks round its centre (`at`, a point id or `[x, y, z]`; a point id makes it follow a star or planet). The rocks are lit from that centre, as by its star: the side facing it is bright, the far side dark.

| Key | What it does |
|---|---|
| `radius` | `[inner, outer]` radius of the band, scene units. One number is the outer radius (the inner is 0.8 of it). Default `[80, 100]`. Either edge can [follow an entity](./data#settings-from-entities) of its own. |
| `thickness` | How far the rocks spread above and below the plane. Default 0.15 of the band's width. |
| `count` | How many rocks, at most 5000 (default 600). They are one draw, so thousands are fine. |
| `size` | `[smallest, largest]` rock, scene units: many small ones and a few large. Default `[0.4, 1.6]`. |
| `seed` | A different number gives a different belt; the same config always gives the same one. |
| `period` | Seconds for the inner edge to go round once. The outer rocks take longer, as real orbits do. Default 0 (still). |
| `tumble` | How fast each rock turns on its own axis, degrees per second (each a little faster or slower). Default 30; 0 holds them still. |
| `color` | The rocks' colour, varied a little per rock. Default `var(--lcards-gray-light)`. |
| `colors` | Several rock colours: each rock takes one, picked by the `seed` (wins over `color`). |

`rotation` tilts the belt, and `spin` turns it as one piece. `period` and `tumble` hold still under reduced motion. Following an entity, `radius` (each edge too), `thickness` and `count` change in place and ease: the band widens, thins or fills round the same rocks. From far away, when even the largest rocks would be under about 1.5 px, the rocks are drawn as dots of the same size and shade (cheaper, and it looks the same); zoom in and they are rocks again.

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
  - { type: sphere, at: sun, radius: 6, fill: { color: var(--lcars-yellow) }, color: var(--lcars-orange), line_spacing_deg: 30 }
  - { type: belt, at: sun, radius: [45, 62], count: 1500, size: [0.3, 1.8], period: 40, colors: [var(--lcards-gray-light), var(--lcards-gray-medium), var(--lcards-yellow-dark)] }
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

## asteroid

One rock for a close look: broad lumps, craters and fine roughness, stretched its own way, with flat faces that catch the light. It tumbles on its own axis and is lit from its star (`light`), with a hard edge between day and night. For many rocks round a centre, use a [belt](#belt).

| Key | What it does |
|---|---|
| `size` | Largest extent, scene units. Default 4. |
| `seed` | A different number gives a different rock; the same config always gives the same one. |
| `tumble` | How fast it turns on its own axis (picked by the seed), degrees per second. Default 10; 0 holds it still. |
| `light` | Where the light comes from: a point id (a star that moves too), or `[x, y, z]`. Default the origin of the frame it is in: the scene's origin, or a [system](#system)'s star. |
| `color` | The rock's colour on its lit side. Default `var(--lcards-gray-light)`. |
| `occlude` | Hide labels and cards behind it (default true). |

`spin`, `face` and `rotation` turn it as for any object; `tumble` holds still under reduced motion. It hides labels behind it. From far away, when it would be under about 1.5 px, it is drawn as a dot, as bright as its lit part seen from where you are.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, 0, 0], yaw: 30, tilt: 12, distance: 30 }
points:
  - { id: sun, xyz: [-70, 20, 40] }
  - { id: rock_label, xyz: [0, 9, 0], label: 433 EROS, style: minor }
objects:
  - { type: glow, at: sun, size: 14, color: var(--lcars-yellow) }
  - { type: asteroid, id: eros, size: 16, seed: 4, tumble: 12, light: sun }
```

## comet

A comet: a small dark nucleus (an [asteroid](#asteroid)'s rock), a glowing coma round it and two tails pointing away from its star (`light`). The ion tail is narrow, straight and bluish; the dust tail is broader and paler, and bends back along the comet's path as it moves (a gentle fixed curve while it stands still). The tails stream outward with the scene clock and hold still under reduced motion. `face`, `spin` and `rotation` turn the nucleus, never the tails.

| Key | What it does |
|---|---|
| `nucleus` | The nucleus: `size` (its largest extent, scene units, default 2), `color` (default `var(--lcards-gray-medium-dark)`) and `tumble` (how fast it turns, default 10 degrees per second). |
| `coma` | The glowing cloud round the nucleus: `size` (its diameter, default 10) and `color` (default `color`). |
| `tail.length` | How far the tails reach away from the star. Default 60. |
| `glow` | Opacity of the coma and the tails, 0 to 1 (the nucleus stays). Default 1. |
| `ion_tail`, `dust_tail` | Each tail: `true` (default), `false`, or `{ color }` (the ion tail `var(--lcards-blue-medium)`, the dust tail `color`). |
| `light` | The star: a point id, or `[x, y, z]`. Default the origin of its frame, as for an [asteroid](#asteroid). |
| `activity` | `mode: fixed` (default): as set. `mode: distance`: the coma, the tails and the glow grow as the comet nears its star and fade as it leaves, every frame; `range: [near, far]`: full at near and closer, falling with the square of the distance, gone at far (default `[50, 300]`). |
| `seed` | The nucleus's shape. |
| `color` | The coma and the dust tail, unless they set their own. Default `var(--lcards-moonlight)`. |

`nucleus.size`, `coma.size`, `tail.length` and `glow` can [follow an entity](./data#settings-from-entities) and ease in place (with `activity.mode: distance`, an entity's value is the comet at full activity).

On an orbit centred off its star, the comet below swings in, grows its tails and brightens, then fades as it swings out:

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v: { target: [30, 0, 0], yaw: 0, tilt: 55, distance: 330 }
points:
  - { id: sun, xyz: [0, 0, 0], label: STAR, style: minor }
  - { id: comet_at, polar: [100, 300], object: orbit }
objects:
  - { type: glow, at: sun, size: 40, color: var(--lcars-yellow) }
  - { type: ring, id: orbit, at: [75, 0, 0], radius: 100, spin: 10, width: 1, color: theme:colors.ui.secondary, opacity: 0.4 }
  - { type: comet, at: comet_at, light: sun, tail: { length: 90 }, coma: { size: 8 }, activity: { mode: distance, range: [25, 175] } }
```

## galaxy

A spiral galaxy in 3D: seeded stars (points of light at any distance, as the backdrop's) along a central bar, a bulge, spiral arms and a thin disc, with a soft glow along the arms and at the core and darker dust lanes on the arms' inner edges. Every star is at its own place, so flying through the galaxy shows parallax, and far away fewer of them draw.

By default it is the Milky Way: the bar, the two major arms (Scutum-Centaurus and Perseus) from its ends, the two minor arms (Sagittarius and Norma) between them, and the Orion spur where the Sun is. Everything scales with `radius` (default 50,000, light years with `units: ly`); **the Sun's place** is 0.52 of the radius toward bearing 180 (`polar: [26000, 180]` at the default size), where a scene puts its Sol point. `arms: 2` (to 8) makes a generic spiral of equal arms instead.

| Key | What it does |
|---|---|
| `radius` | The disc's radius (default 50,000) |
| `arms` | `count`: a spiral of this many equal arms (leave out for the Milky Way); `pitch`: how tightly they wind, degrees (default 12); `color`: the colour the arm stars lean toward, and the arms' glow |
| `bar` | `length`: the bar's half-length as a fraction of the radius (default 0.32; 0 none); `angle`: the bearing of its near end (default 153, 27 degrees off the line to the Sun; the arms turn with it) |
| `thickness` | The disc's thickness as a fraction of the radius (default 0.02) |
| `stars`, `seed` | `stars: { count, color }`: how many stars (default 40,000, at most 100,000) and their base colour; `seed`: their scatter |
| `core.color` | The bulge and the core's glow (theme colours by default) |
| `glow`, `dust` | The glow's opacity (0 to 1; 0 none); the dust lanes: `dust: { amount, color }` (opacity, and the colour, the background by default) |

```yaml live
type: custom:lcards-astrometrics-card
height: 360
units: ly
camera:
  views:
    v: { target: [0, 0, 0], yaw: 20, tilt: 40, distance: 120000 }
points:
  - { id: sol, polar: [26000, 180], marker: dot, label: SOL }
objects:
  - { type: galaxy, stars: { count: 30000 } }
```

## crystalline

The Crystalline Entity (Star Trek: The Next Generation, "Datalore" and "Silicon Avatar"), made in code: a glowing faceted spine along the object's y axis, a starburst core at its middle with crystal spikes round it, and branches in tiers round the spine that fork again and again, bending a little at each joint and ending in Y-shaped tips and thorns. It all fits a spindle `size` tall and 0.8 of that across. The crystal is glassy and see-through, lit from inside by the core, with bright edges; it needs no light of its own. The same `seed` always gives the same entity.

| Key | What it does |
|---|---|
| `size` | Height along the spine. Default 3 km: 3 with `units: km`, converted for other named units, 3000 in plain scene units. No canon size exists: the production design was two or three Enterprise-D lengths (642 m each), and on screen it dwarfs the ship. |
| `seed` | A different number gives a different branching. Default 7. |
| `branches` | How many times the branches fork, 1 to 5 (each level smaller; the last are thorns). Default 4. |
| `color` | The crystal's colour; its edges lean toward the core colour. Default `var(--lcards-blue-medium)`; `var(--lcars-african-violet)` gives the lavender of the show. |
| `glow` | How brightly the core shines and how far its light reaches into the crystal, 0 to 1. 0: a dim core and only the edges lit; 1: a large bright core lighting the inner branches. Default 0.7. |
| `opacity` | 0 to 1. Default 1. |
| `blend` | `add` (default): overlapping crystal glows. `normal`: drawn over what is behind it. |
| `core` | The starburst: `color` (its rays and the light along the spine, default `var(--lcards-moonlight)`) and `period` (seconds per slow pulse, default 6; 0 holds it steady). |

Turn it slowly about its spine with `spin`; `face` and `rotation` turn it as any object. The pulse and the spin hold still under reduced motion. Far away, when it would be under about 10 px tall, it is drawn as a dot in the core colour; nearer, the finer forks draw only once it is large enough on screen to show them. `glow` and `opacity` can [follow an entity](./data#settings-from-entities) in place, and a new `color` crossfades in as every object's does. The entity is see-through, so it hides no labels.

Next to it below is the Constitution-class ship at its real size (305 m), and a beam from the entity's core to the ship:

```yaml live
type: custom:lcards-astrometrics-card
height: 380
units: km
camera:
  views:
    v: { target: [-0.8, 0, 0], yaw: 0, tilt: 5, distance: 5 }
points:
  - { id: entity_at, xyz: [0, 0, 0] }
  - { id: ship_at, xyz: [-2.1, -0.1, 0.3], label: USS ENTERPRISE, style: minor }
objects:
  - { type: crystalline, id: entity, at: entity_at, spin: 2 }
  - { type: model, id: ship, src: builtin:constitution_class_refit, at: ship_at }
  - { type: beam, from: entity_at, to: ship_at, width: 10, color: var(--lcards-moonlight), pulse: true }
```

## glow

A soft light that always faces the camera: a galactic core, a star, a beacon. `size` (diameter, scene units), `color`, `opacity`, `falloff` (higher is a tighter, brighter core) and `blend` (`add`, the default, or `normal`).

## image

Your own picture lying on the scene plane: `src` (`/local/galaxy.jpg`), `size` (`[w, d]`), `shape` (`plane` or `disc`), `y`, `opacity`. `blend: add` makes black see-through, for a photo of space on black. Grids drawn at the same height draw over it.

```yaml
- { type: image, src: /local/milky-way.jpg, size: 220, shape: disc, blend: add, opacity: 0.8 }
```

## model

A 3D model from a glTF file (`.glb` or `.gltf`): a starship, your house, a satellite. For a file of your own (where to put it, picking it, making it fit and light), see [Your own models](./models). By default it is drawn as a hologram (a glow with a bright rim, scanlines and its feature edges); `material: original` shows the file's own materials, lit.

```yaml
- type: model
  id: ship
  src: builtin:constitution_class_refit     # or /local/models/ship.glb
  size: 70                      # its largest extent, scene units
  scan: { period: 5 }           # a scan band sweeps along it every 5 seconds
  animation: all                # loop the file's animation clips
```

| Key | What it does |
|---|---|
| `src` | The file. `builtin:<name>` is a model shipped with LCARdS (see [built-in models](#built-in-models)). Your own goes in `/config/www/` and is `/local/...` here. |
| `size` | Its largest extent in scene units: the file is scaled and centred to fit. Leave it out to draw the model at its [real size](#real-size). |
| `length` | Its real length in metres (its largest extent), for a file not made at its true scale: drawn that long at its [real size](#real-size), whatever the file measures. |
| `file_units` | The units the file was made in, for its real size: `m` (default), `cm`, `mm`, `km`, `ft` or `in`. |
| `material` | `hologram` (default) or `original`. |
| `color`, `rim.color`, `opacity`, `scanlines` | The hologram's body colour, rim colour, brightness and scanline strength. |
| `solid` | `true` (default): the hologram hides its own far side. `false`: see-through. |
| `blend` | `add` (default) or `normal`. |
| `scan` | A scan band sweeping along the model: `{ period, color }`, seconds per sweep. |
| `edges` | Feature edges as lines (on for holograms, off on a model over 250,000 triangles: see [make it light](./models#make-it-light)): `true`, `false`, or `{ angle, color }`, where faces meet at more than `angle` degrees. |
| `animation` | Clips to loop: `all`, a clip name or a list. The built-in ship's clip is `bussards`. |
| `occlude` | Hide labels and cards behind it (default `true`). |

A stand-in box shows while the file loads. Files compressed with meshopt load; Draco-compressed files do not (the browser console says why).

### Real size

A model without `size`, in a scene with `units` (or in a [star system](./scale#star-systems) with them), is drawn at its real size: the file's own measurements, converted from `file_units` (metres by default, as glTF files and the built-in models are) to the scene's units. Ships and stations then sit in proportion to each other and to the planets: the Constitution-class ship is 0.305 km long beside Deep Space 9's 1.45 km, round a planet 12,742 km across. Set `size` to draw one larger on purpose. A scene without `units` has no real size: a model without `size` is drawn 50 across.

Many downloaded models are not made at their true scale: a Star Trek Online Odyssey-class ship from Sketchfab measures 53 units long, so read as metres it would be drawn 53 m long. Give such a model its real `length` in metres (the Odyssey is 1,061 m) and it is drawn that long, whatever the file measures. `length` stays right in any scene units, where a `size` would need changing with them. `size`, when set, wins over both.

```yaml
type: custom:lcards-astrometrics-card
units: km
points:
  - { id: ds9, xyz: [0, 0, 0] }
  - { id: ship, xyz: [2, 0, 1] }
objects:
  - { type: model, id: station, src: builtin:deep_space_nine, at: ds9, material: original }
  - { type: model, id: ship, src: builtin:constitution_class_refit, at: ship }
  # a download made in feet
  - { type: model, id: runabout, src: /local/models/runabout.glb, at: [1, 0, -1], file_units: ft }
  # a download at an odd scale: its real length in metres
  - { type: model, id: odyssey, src: /local/models/odyssey.glb, at: [-3, 0, 2], length: 1061 }
```

In the Astrometrics Studio, the model's form shows what its file measures and how it is drawn (a file read at its own measurements says to set **Length (m)** when it is not at its true scale), with **Show** (flies the preview to the model), **Fit to view** (a size about a fifth of the preview's view), **File size** (its largest extent as the size, for a file made in the scene's units) and **Real size** (clears `size`). A new model in a scene with units starts at its real size, and the preview flies to it once its file is in (and again when you pick another file), so a real-size ship is never a lost speck.

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
  - { type: model, id: ship, src: builtin:constitution_class_refit, size: 70, scan: { period: 5 }, animation: all }
```

Labels on the far side of the ship hide behind it: drag to turn the ship until the port nacelle is behind the hull, and its label goes. Models hide labels by their real shape (a small depth image of the scene, taken only when the camera or the model moves), not by a bounding sphere.

### Visible size

At its real size a ship is a speck in a view of a whole star system. `model_scale: visible` on the card draws each model that is at its real size at least 40 px across, scaled about its centre, and at its real size again once you are close enough for that to be larger; points on it grow with it. Models with their own `size` are left as they are. On screen, the size button under the [camera buttons](./#controls), the `V` key, a `set-model-scale` action and the Astrometrics Studio's toolbar switch it; that is not saved.

```yaml
type: custom:lcards-astrometrics-card
units: km
model_scale: visible
camera:
  buttons: true
points:
  - { id: ds9, xyz: [0, 0, 0] }
objects:
  - { type: model, id: station, src: builtin:deep_space_nine, at: ds9, material: original }
  - { type: model, id: ship, src: builtin:constitution_class_refit, at: [30, 0, 10] }
```

### Built-in models

Fan art made in code for LCARdS (no third-party model), recreating the designs seen on screen. All are in metres with Y up; `material: original` shows their own colours and lit windows.

| `src` | What it is | Parts (`part:`) |
|---|---|---|
| `builtin:constitution_class_refit` | The refit Constitution-class starship of the films (USS Enterprise NCC-1701-A): 305 m long, 144.5 m across the saucer, the bow toward +z. One animation clip, `bussards` (the collectors pulse). | `saucer`, `bridge`, `sensor_dome`, `impulse`, `neck`, `torpedo_launcher`, `secondary_hull`, `deflector`, `shuttle_bay`, `pylon_port`, `pylon_starboard`, `nacelle_port`, `nacelle_starboard`, `bussard_port`, `bussard_starboard`, `grille_port`, `grille_starboard`, `windows` |
| `builtin:galaxy_class` | The Galaxy-class starship of The Next Generation (USS Enterprise NCC-1701-D): 642.5 m long, about 470 m across the saucer, the bow toward +z. One animation clip, `bussards`. | the same names as the Constitution, without `sensor_dome` |
| `builtin:deep_space_nine` | Deep Space 9 (Terok Nor), the Cardassian station of Deep Space Nine: 1452 m across, the docking pylons 969 m tip to tip. | `ops`, `upper_core`, `promenade`, `lower_core` (its bottom tip), `sail_towers`, `spokes` (three thin ones, between the bridges), `habitat_ring`, `docking_ring`, `crossover_bridges` (three), `docking_ports`, `windows`, `upper_pylon_1` to `upper_pylon_3` and `lower_pylon_1` to `lower_pylon_3` (their tips) |
| `builtin:earth_spacedock` | Earth Spacedock, from Star Trek III: The Search for Spock onward: 3800 m across and about 5480 m tall. | `antennas` (the top), `cap`, `space_doors` (the front door), `underdish`, `neck`, `hull`, `stem`, `base` (the sphere), `towers` (their tips, the bottom), `panels`, `windows` |
| `builtin:utopia_planitia_drydock` | A drydock of the Utopia Planitia Fleet Yards over Mars, sized for a Galaxy-class ship: about 760 m long, the bow end toward +z. Place several for the yards. | `frame` (ribs and rails), `deck`, `keel`, `lights`, `berth` (where a ship sits), `bow`, `stern` |

Both ships use one set of part names, so a scene that labels `bridge` or `nacelle_port` works with either.

Rings, rims and round hulls (`habitat_ring`, `docking_ring`, `cap`, `promenade`, `underdish`, `neck`, `hull`) put their part point on the front face (+z), so a label sits on the structure rather than in the middle of the station.

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

**Your own models.** The built-in ship (6,500 triangles, 147 KB) costs about 1.5 ms a frame on a laptop GPU, depth image included; the starbases have 15,000 to 20,000 triangles. Every extra triangle costs a little more. The model loader is a separate download the first time a card uses a model. For the My models folder, picking a file, sizing and turning it, and making a big model light, see [Your own models](./models).

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
      - { type: sphere, at: sun, radius: 696340, fill: { color: var(--lcars-yellow) } }
      - { type: ring, radius: 149597870.7, width: 1, color: var(--lcars-blue) }
      - { type: sphere, at: earth, radius: 6371, image: builtin:earth_blue_marble }
```
