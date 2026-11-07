---
description: "Astrometrics card surfaces: grids (plane, disc, dome, sphere, cylinder, wells and wormholes, deformed grids, sector maps), planets with built-in maps, territory volumes, rings and pictures (image)."
---

# Grids, Spheres and Volumes

Surfaces and regions: wireframe grids of every shape, planets and globes, see-through territories, rings, and your own pictures on the plane. The keys every object takes (`id`, `at`, `rotation`, `spin`, `opacity`, `visible` ...) are on the [Objects](../objects#keys-every-object-takes) page.

## grid

**A see-through wireframe surface: a flat map, a galaxy disc, a sky dome, a tube or a funnel.** `shape` picks the surface, and each shape has its own size keys.

- On the curved shapes (`dome`, `sphere`, `cylinder` and `well`), `line_spacing_deg` is easier than `line_spacing`: it puts rings and meridians every N degrees, and always fits a whole number round, so there is no seam.
- A disc with `radius: [inner, outer]` has a hole in the middle.
- Any shape can be [deformed](#deformed-grids), and a plane can be a lettered [sector map](#sector-maps). A funnel is a [well](#wells-and-wormholes).

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 20, 0]
      yaw: 30
      tilt: 25
      distance: 230
objects:
  # a polar disc with bearing labels round its rim
  - type: grid
    shape: disc
    radius: 60
    at: [-70, 0, 0]
    pattern: polar
    line_spacing: 10
    spoke_count: 24
    ring_labels:
      step: 45
      style: tiny
  # a dome, lines every 15 degrees
  - type: grid
    shape: dome
    radius: 45
    at: [50, 0, 0]
    line_spacing_deg: 15
    color: var(--lcars-blue)
  # a cylinder
  - type: grid
    shape: cylinder
    radius: 15
    height: 60
    at: [0, 30, -70]
    line_spacing_deg: 30
    color: var(--lcars-orange)
```

::: details More about grid
- **The same names as the background grid:** `pattern`, `line_spacing`, `line_width`, `color`, `major`, `spoke_count`, `hex_radius`, `dot_radius` and `back_opacity` mean what they mean on the [background grid](/core/effects/background-animations/preset-reference#grid), measured in scene units instead of px (widths stay in px).
- **Edges:** `edges` outlines the open edges: the rim of a disc, dome or well, the ends of a cylinder, the frame of a plane. A grid sphere has no open edge.
- **Polar lines on a curved shape:** with `pattern: polar`, `spoke_count` sets how many meridians go round; without it, there is one every `line_spacing_deg`.
- **A solid planet** is a [sphere](#sphere): a grid with `shape: sphere` is a see-through wireframe ball.
- **Fills and scan bands:** `fill.effect` paints an [animated fill](../effects#animated-surface-fills) under the lines, and `scan` sends a [scan band](../effects#scan-bands) across them.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `shape` | string | `plane` | `plane`, `disc`, `dome` (a half sphere), `sphere`, `cylinder` or `well` (a funnel) |
| `size` | number / `[w, d]` | `200` | `plane`: width and depth, scene units. One number is a square |
| `radius` | number / `[inner, outer]` | `100` | Every shape but `plane`: the radius (a well's rim), scene units. A disc also takes `[inner, outer]` for a hole |
| `height` | number | the radius | `cylinder`: its height, scene units |
| `depth` | number | the radius | `well`: how far down it goes from the rim, scene units |
| `well` | object | trumpet | `well`: the funnel's profile, see [Wells and wormholes](#wells-and-wormholes) |
| `pattern` | string | `both`; `polar` on a disc | `both` (rows and columns), `horizontal`, `vertical`, `diagonal`, `hexagonal`, `dots` or `polar` (rings and spokes) |
| `line_spacing` | number | plane `10`, disc radius / 10, curved 15 degrees of arc | Distance between lines, scene units |
| `line_spacing_deg` | number | `15` on curved shapes | Curved shapes: rings and meridians every N degrees. Disc: a spoke every N degrees (wins over `spoke_count`) |
| `spoke_count` | number | disc `36`, plane `12` | `pattern: polar`: spokes round the centre (meridians on a curved shape) |
| `hex_radius` | number | `line_spacing` | `pattern: hexagonal`: hexagon size, scene units |
| `dot_radius` | number | 8% of `line_spacing` | `pattern: dots`: dot radius, scene units |
| `line_width` | number | `1` | Line width, px |
| `color` | colour | `theme:colors.ui.tertiary` | Line colour |
| `major.row_interval` | number | `0` | A brighter, wider line every N rows (rings on a disc). `0`: none |
| `major.col_interval` | number | `0` | The same every N columns (spokes on a disc) |
| `major.line_width` | number | 1.5 x `line_width`, at least `1.5` | Major line width, px |
| `major.color` | colour | `color`, brighter | Major line colour |
| `back_opacity` | number | plane and disc `1`, curved `0.25` | Opacity of the far side seen through the surface, `0` to `1`. `0` hides it |
| `fill.color` | colour | none | A colour behind the lines |
| `fill.effect` | object | - | An [animated fill](../effects#animated-surface-fills) under the lines |
| `edges` | boolean / object | `true` | Outline the open edges. `false` for none, or the keys below |
| `edges.width` | number | `major.line_width` | Edge width, px |
| `edges.color` | colour | `major.color`, else `color` | Edge colour |
| `ring_labels.step` | number | `10` | Disc or dome: a bearing label every N degrees round the edge |
| `ring_labels.radius` | number | 1.06 x `radius` | How far out the labels sit, scene units |
| `ring_labels.start` | number | `0` | The first bearing labelled, degrees |
| `ring_labels.alt` | number | `0` | Height of the labels above the plane, scene units |
| `ring_labels.style` | string | `minor` | Label style (built in or from `labels.styles`) |
| `ring_labels.color` | colour | - | Label colour |
| `ring_labels.text` | object | - | Text keys for every label, under `text.default` (font, size, background ...) |
| `blend` | string | `normal` | `add`: light adds up where lines cross, so they glow |
| `scan` | object | off | A [scan band](../effects#scan-bands) sweeping across the lines: `scan.period` (seconds per sweep) and `scan.color` |
| `deform` | list | - | Warps of the surface, see [Deformed grids](#deformed-grids) |
| `axis_labels`, `cells` | object, list | - | `plane`: a lettered map, see [Sector maps](#sector-maps) |

### Wells and wormholes

**`shape: well` is a funnel down from its rim: a gravity well, a cone, a bowl or a wormhole.** The rim sits at the object's position and the funnel goes down `depth` from there.

- `well.shape` picks a named profile and `well.throat` sets how narrow it gets. For any other profile, list its widths from the rim down in `well.profile`.
- `edges` draws the rim and, when the bottom is open, the bottom opening too.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, -40, 0]
      yaw: 20
      tilt: 25
      distance: 260
objects:
  # a disc with a hole, and a gravity well hanging from it
  - type: grid
    shape: disc
    radius: [50, 60]
    at: [-65, 0, 0]
    pattern: polar
    spoke_count: 24
    line_spacing: 5
  - type: grid
    shape: well
    radius: 50
    depth: 60
    at: [-65, 0, 0]
    line_spacing_deg: 15
  # a wormhole: two trumpets throat to throat
  - type: grid
    shape: well
    well:
      shape: wormhole
      throat: 0.25
    radius: 40
    depth: 110
    at: [65, 0, 0]
    line_spacing_deg: 20
    color: var(--lcars-blue)
```

::: details More about wells
- **Any profile:** a profile can narrow several times, and values above `1` bulge past the rim. `[0.1, 0.7, 1, 0.85, 0.45, 0.1]` is a rounded lobe with a neck at each end; the [Bajoran wormhole starter](../starters#bajoran-wormhole) chains three.
- **Even rings:** the rings are spaced evenly along the surface, however steep it gets.
- **The named shapes never bulge:** they stay inside the rim all the way down.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `radius` | number | `100` | The rim's radius, scene units |
| `depth` | number | the radius | How far down it goes, scene units |
| `well.shape` | string | `trumpet` | `trumpet` (a gravity well: flat at the rim, plunging to the throat), `cone`, `bowl` (round at the bottom) or `wormhole` (two trumpets throat to throat, the throat halfway down) |
| `well.throat` | number | `0.15` | The throat's width as a fraction of the rim, `0.02` to `1` |
| `well.profile` | list | - | Any profile: widths as fractions of the rim, from the rim down, evenly spaced along the depth (2 to 32 values). A smooth curve passes through each. `[1, 0.2, 1]` is an hourglass. Replaces `well.shape` |

#### Two mouths, one wormhole

**Two wells [facing](../objects#facing-a-point) each other make one wormhole: a mouth at each end, and a line from throat to throat as the throat stretched thin between them.** Each end of the line is a point standing on its well at `[0, -depth, 0]`, the bottom of the well's axis.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 25
      distance: 340
points:
  - id: alpha
    xyz: [-110, 0, 0]
  - id: gamma
    xyz: [110, 0, 0]
  # the bottom of each well
  - id: alpha_throat
    object: mouth_alpha
    xyz: [0, -50, 0]
  - id: gamma_throat
    object: mouth_gamma
    xyz: [0, -50, 0]
objects:
  - type: grid
    id: mouth_alpha
    shape: well
    well:
      throat: 0.1
    radius: 40
    depth: 50
    at: alpha
    face: gamma
    line_spacing_deg: 20
    color: var(--lcars-blue)
  - type: grid
    id: mouth_gamma
    shape: well
    well:
      throat: 0.1
    radius: 40
    depth: 50
    at: gamma
    face: alpha
    line_spacing_deg: 20
    color: var(--lcars-blue)
  # the throat between them
  - type: path
    points: [alpha_throat, gamma_throat]
    dash:
      pattern: [6, 4]
      speed: 30
    color: var(--lcars-yellow)
    width: 2
```

::: details Lining a mouth up with an arched path
- **Where an arch points:** an arched path (`arc`) leaves each end rising. It climbs about 3.14 times its `arc` over the distance between the ends.
- **Aiming the mouth:** to line a mouth up with it, face a point that much above the far end. For an `arc` of 4000, that is a point `aim` with `at: gamma` and `offset: [0, 12566, 0]`. The [Star Trek galaxy starter](../starters#star-trek-galaxy)'s Bajoran wormhole is built this way.
:::

### Deformed grids

**`deform` warps a grid's surface: a wobbling jelly, a tornado, a whirlpool, rolling hills.** It is a list of deformations applied in order, on any grid shape and on a [sphere](#sphere).

- On a cylinder, sphere, dome or well a deformation works round the axis; on a plane or disc it moves the surface up and down.
- `wobble` sends bulges round (ripples across a flat grid), `bend` bends the axis (a flat sheet curls), `twist` turns the far end more than the near one (a whirlpool on a flat grid), and `noise` adds smooth lumps.
- A deformation stands still until you give it a `period` (seconds per cycle) or, for `noise`, a `drift`.
- The lines are painted on the surface and stretch with it. Edges, cell fills and points standing on the grid (`object: <grid>`) move with it too.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v:
      target: [0, 30, 0]
      yaw: 15
      tilt: 15
      distance: 300
objects:
  # jelly: a wobbling cylinder
  - id: jelly
    type: grid
    shape: cylinder
    radius: 25
    height: 70
    at: [-85, 35, 0]
    line_spacing_deg: 20
    color: var(--lcars-orange)
    deform:
      - type: wobble
        amplitude: 0.15
        lobes: 3
        waves: 1
        period: 4
  # a tornado: a twisted well whose bend turns round
  - id: tornado
    type: grid
    shape: well
    well:
      profile: [1, 0.35, 0.15, 0.08]
    radius: 40
    depth: 110
    at: [0, 110, 0]
    line_spacing_deg: 20
    color: var(--lcars-blue)
    deform:
      - type: twist
        angle: 120
        anchor: top
      - type: bend
        amplitude: 0.5
        motion: circle
        period: 7
        anchor: top
  # a whirlpool: a twisted disc with ripples
  - id: whirlpool
    type: grid
    shape: disc
    radius: 45
    at: [85, 0, 0]
    pattern: polar
    spoke_count: 18
    line_spacing: 6
    deform:
      - type: twist
        angle: 150
      - type: wobble
        amplitude: 0.06
        lobes: 0
        waves: 3
        period: 2.5
```

::: details More about deformed grids
- **Sizes:** amplitudes are fractions of the grid's size: its radius, or half a plane's longer side.
- **Picking in the Studio:** picking a point on a deformed grid gives its place on the undeformed grid.
- **Reduced motion:** moving deformations run on the scene clock and hold still under reduced motion.
- **Cost:** a deformed grid is drawn with finer patches than a plain one and is moved on the processor each frame while it moves; drifting `noise` costs the most.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `type` | string | required | `wobble`, `bend`, `twist` or `noise` |
| `amplitude` | number | wobble `0.08`, bend `0.25`, noise `0.05` | How far the surface moves, a fraction of the grid's size |
| `period` | number | `0` | `wobble`, `bend`, `twist`: seconds per cycle (a bulge travels round once, a sway goes to and fro, the bend turns once, the twist swings). `0`: a still shape |
| `lobes` | number | `3` | `wobble`: bulges round the circumference. `0` swells the whole ring at once; on a flat grid, ripples ring out from the centre |
| `waves` | number | `1` | `wobble`: waves along the axis (out from the centre of a flat grid), so the bulges spiral |
| `bearing` | number | `0` | `bend`: the direction it bends toward, degrees (0 north, clockwise from above) |
| `motion` | string | `sway` | `bend`: `sway` (to and fro), `circle` (the bend turns round, a tornado) or `none` (a still bend) |
| `angle` | number | `90` | `twist`: degrees turned at the far end (at the centre of a flat grid). With a `period`, the twist swings between plus and minus this |
| `anchor` | string | `bottom` | `bend`, `twist` round an axis: the end that stays put, `bottom`, `top` or `middle` (both ends move) |
| `base_frequency` | number | about 3 lumps across the grid's size | `noise`: detail per scene unit; lower is larger lumps, as on [fills](../effects#animated-surface-fills) |
| `num_octaves` | number | `2` | `noise`: layers of finer detail, `1` to `6` |
| `drift` | number | `0` | `noise`: how fast the lumps drift through the grid, scene units per second |
| `seed` | number | `0` | `noise`: changes the pattern |

### Sector maps

**A plane grid with named columns and rows, like a printed map: AF3 is column AF, row 3.** Use it for a sector chart with filled territories and places named by their cell.

- `axis_labels` writes the column names along the top (north) edge and the row names down the left edge.
- `cells` fills ranges of cells: each entry fills a rectangle `from` one corner cell `to` the other, or one `cell`.
- A point stands in the middle of a cell with `cell: AF3` and `object: <the grid's id>`. The [sector map starter](../starters#sector-map) shows a full map.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  view: map
  views:
    map:
      target: [0, 0, 0]
      tilt: 90
      distance: 300
      projection: orthographic
points:
  - id: outpost
    cell: AF3
    object: sectors
    marker: diamond
    label: OUTPOST
objects:
  - type: grid
    id: sectors
    shape: plane
    size: [240, 160]
    line_spacing: 20
    axis_labels:
      column_start: AD
    cells:
      # a territory with a shaded, outlined look
      - from: AE2
        to: AG5
        color: var(--lcars-blue)
        opacity: 0.3
        shade: 0.4
        edges: true
      # one cell
      - cell: AK7
        color: var(--lcars-orange)
        opacity: 0.4
```

::: details More about sector maps
- **Without `axis_labels`:** cells and `cell:` points still work, named from A1 in the top left; only the labels are missing.
- **Shading:** with `shade`, each cell is a little lighter or darker than its neighbours. The same cell always gets the same shade, and `seed` picks a different set.
- **Out of range:** a range that runs past the edge of the grid is cut at the edge.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `axis_labels.columns` | string | `letters` | How columns are named: `letters` or `numbers` |
| `axis_labels.rows` | string | `numbers` | How rows are named: `letters` or `numbers` |
| `axis_labels.column_start` | string / number | `A` or `1` | The first column's name, such as `AD` |
| `axis_labels.row_start` | string / number | `1` or `A` | The first row's name |
| `axis_labels.pad` | number | the widest label, at least 2 | Zero-pad numbers to this many digits (01, 02 ...). `0` turns it off |
| `axis_labels.every` | number | `1` | Label every Nth column and row |
| `axis_labels.offset` | number | 0.6 x `line_spacing` | How far outside the edge the labels sit, scene units |
| `axis_labels.style` | string | `tiny` | Label style (built in or from `labels.styles`) |
| `axis_labels.color` | colour | - | Label colour |
| `axis_labels.text` | object | - | Text keys for every label, under `text.default` |
| `cells[].from` | string | - | The first corner cell of a range, such as `AF3` |
| `cells[].to` | string | `from` | The opposite corner cell |
| `cells[].cell` | string | - | One cell, instead of `from` and `to` |
| `cells[].color` | colour | `var(--lcars-blue)` | Fill colour |
| `cells[].opacity` | number | `0.25` | Fill opacity, `0` to `1` |
| `cells[].shade` | number | `0` | How much each cell's brightness varies, `0` to `1` |
| `cells[].seed` | number | `0` | Changes which cells are lighter and darker with `shade` |
| `cells[].edges` | boolean / object | off | An outline round the range: `true`, or the keys below |
| `cells[].edges.width` | number | `1.5` | Outline width, px |
| `cells[].edges.color` | colour | the fill colour | Outline colour |
| `cells[].edges.opacity` | number | `0.9` | Outline opacity, `0` to `1` |

## volume

**A see-through box of grid cells: a territory, a sector of space, a restricted zone.** Its faces are grids, its edges are drawn brighter, and you can see through it.

- `shape: sector` is a slice of a disc round the object's place: between two radii, two bearings and two heights. A sector's second bearing may pass 360, so it can cross north.
- `shape: box` is a box of `size` centred on `at`. `shape: prism` is any border you draw (`outline`) between two heights, for territories that are not pie slices.
- In the Astrometrics Studio you can [draw and drag a prism's outline on the preview](../studio#objects).

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 5, 0]
      yaw: 200
      tilt: 30
      distance: 215
objects:
  - type: grid
    shape: disc
    radius: 80
    pattern: polar
    line_spacing: 20
    spoke_count: 12
  # a sector, with its own cell sizes
  - type: volume
    shape: sector
    radius: [30, 75]
    angle: [100, 170]
    height: [0, 20]
    cells:
      ring: 9
      angle: 10
      layer: 10
    color: var(--lcars-blue)
  # a box
  - type: volume
    shape: box
    at: [-40, 10, -30]
    size: [30, 20, 20]
    color: var(--lcars-orange)
  # a prism with a drawn border
  - type: volume
    shape: prism
    at: [-35, 0, 35]
    height: [0, 12]
    outline:
      - [-20, -10]
      - [5, -18]
      - [22, -2]
      - [12, 16]
      - [-14, 14]
    color: var(--lcars-green)
```

::: details More about volume
- **The outline:** a prism's `outline` needs at least three `[x, z]` points, in order round the border and measured from `at`. -z is north. A prism without a usable outline is drawn as a sector.
- **Wireframe by default:** `back_opacity` is `1`, so the far faces show as brightly as the near ones. Lower it to dim the far faces, so the near ones stand out.
- **Scan bands:** `scan` sweeps a [scan band](../effects#scan-bands) down the walls, top to bottom.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `shape` | string | `sector` | `sector`, `box` or `prism` |
| `radius` | `[inner, outer]` | `[50, 100]` | `sector`: the two radii, scene units |
| `angle` | `[from, to]` | `[0, 90]` | `sector`: the two bearings, degrees clockwise from north |
| `height` | `[bottom, top]` | `[0, 10]` | `sector` and `prism`: the floor and the ceiling, scene units |
| `size` | number / `[w, h, d]` | `20` | `box`: width, height and depth, scene units. One number is a cube |
| `outline` | list | - | `prism`: the border as `[x, z]` points from `at`, scene units |
| `cells.ring` | number | a quarter of the depth | `sector`: cell size outward, scene units |
| `cells.angle` | number | `10` | `sector`: cell width round, degrees |
| `cells.layer` | number | half the height | `sector`: cell height, scene units |
| `cells.width` | number | box a quarter of the width, prism an eighth | `box` and `prism`: cell size across (along a prism's walls), scene units |
| `cells.height` | number | box a quarter of the height, prism half | `box` and `prism`: cell size up, scene units |
| `cells.depth` | number | box a quarter of the depth, prism an eighth | `box` and `prism`: cell size along z, scene units |
| `color` | colour | `var(--lcars-blue)` | Colour of the faces, and of the edges unless `edges.color` is set |
| `line_width` | number | `1` | Face line width, px |
| `faces.opacity` | number | `0.45` | Opacity of the face lines, `0` to `1`. The edges stay brighter |
| `edges` | boolean / object | `true` | Draw the outline edges. `false` for none, or the keys below |
| `edges.width` | number | `1.5` | Edge width, px |
| `edges.color` | colour | `color` | Edge colour |
| `back_opacity` | number | `1` | Opacity of the far faces, `0` to `1`. `1` is a wireframe with nothing hidden |
| `blend` | string | `normal` | `add`: light adds up where lines cross |
| `scan` | object | off | A [scan band](../effects#scan-bands) down the walls: `scan.period` and `scan.color` |

## sphere

**A planet or globe: latitude and longitude lines over a solid body.** The body hides the lines and objects behind it, so a sphere reads as a solid world.

- `image` wraps a map round the body: one of the [built-in planet maps](#built-in-planet-maps), or your own picture. With no map (or for a made-up planet), a [`fill.effect` preset](../effects#planet-types) paints a planet type.
- `body: earth` (or any [real body](../scale#the-real-solar-system)) turns the sphere as that body really is at the scene date.
- Points with `latlon` and `object: <the sphere's id>` stand on it and turn with its `spin`.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 15
      distance: 60
points:
  - id: base
    latlon: [15, -20]
    object: world
    alt: 0.3
    marker: dot
    label: BASE CAMP
    color: var(--lcars-orange)
objects:
  - type: sphere
    id: world
    radius: 14
    spin: 12
    lat_step: 15
    lon_step: 20
    color: var(--lcars-blue)
```

::: details More about sphere
- **Your own map** is an equirectangular picture, longitude 0 in the middle: a path such as `/local/mars.jpg`, or a Home Assistant media item (`media-source://...`).
- **A real body:** with `body`, the axis is tilted where the real pole points, the sphere turns once a real sidereal day, and longitude 0 of its map is where the body's prime meridian is, so `latlon` points stand over the real places. `spin` and `rotation` do not apply then.
- **Deforming it:** `deform` works as on a [grid](#deformed-grids) sphere, and the body, lines and points on it move together.
- **A see-through ball** with no body is a [grid](#grid) with `shape: sphere`.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `radius` | number | `10` | Radius, scene units |
| `line_spacing_deg` | number | `15` | A latitude and a longitude line every N degrees (longitude rounded to fit round) |
| `lat_step` | number | `line_spacing_deg` | Latitude lines every N degrees, when different |
| `lon_step` | number | `line_spacing_deg` | Longitude lines every N degrees, when different |
| `color` | colour | `theme:colors.ui.tertiary` | Line colour |
| `line_width` | number | `1` | Line width, px |
| `pattern`, `major`, `blend` | | | As on a [grid](#grid) |
| `back_opacity` | number | `0` | Opacity of the lines on the far side |
| `fill.color` | colour | `black` | The body's colour |
| `fill.opacity` | number | `0.85` | The body's opacity, `0` to `1` |
| `fill.effect` | object | - | An [animated fill](../effects#animated-surface-fills) or [planet type](../effects#planet-types) painted on the body, in place of `image` |
| `image` | string / object | - | A map on the body instead of `fill.color`: the picture, or the two keys below |
| `image.src` | string | - | The map: `builtin:<name>`, `/local/...` or `media-source://...` |
| `image.opacity` | number | `1` | Map opacity, `0` to `1` |
| `occlude` | boolean | `true` | Hide labels behind the sphere. `false` shows them through it |
| `body` | string | - | A [real body](../scale#the-real-solar-system): turn the sphere as it really is at the scene date |
| `deform` | list | - | Warps of the planet, as on a [grid](#deformed-grids) |
| `scan` | object | off | A [scan band](../effects#scan-bands) from pole to pole: `scan.period` and `scan.color` |

**The Earth, with your home on it.** `zone.home` has your latitude and longitude, so a point that follows it stands where you live:

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: -40
      tilt: 30
      distance: 55
points:
  - id: home
    entity: zone.home
    latlon:
      entity: zone.home
    object: earth
    alt: 0.3
    marker: reticle
    label: HOME
    overlap: true
  - id: greenwich
    latlon: [51.48, 0]
    object: earth
    marker: dot
    label: Greenwich
    style: tiny
objects:
  - type: sphere
    id: earth
    radius: 15
    image: builtin:earth_blue_marble
    line_spacing_deg: 30
    color: var(--lcars-blue)
```

### Built-in planet maps

**Planet and moon maps that ship with LCARdS, for a sphere's `image`.** Each is 2048 x 1024 with longitude 0 in the middle, and all are public domain: NASA and USGS imagery is not subject to copyright in the United States.

- Saturn, Uranus and Neptune have no public-domain global maps, so use the `ringed_giant`, `ice_giant` and `storm_giant` [planet types](../effects#planet-types) for them. Saturn's rings are a [ring band](#ring-band).
- Venus as seen from space (a cloud deck) is the `clouds` planet type; the Venus map shows the surface under the clouds. Deimos has no global map, so give it a grey `fill.color`.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 12
      distance: 120
objects:
  - type: sphere
    at: [-45, 0, 0]
    radius: 9
    image: builtin:mercury_messenger
    line_width: 0.5
    spin: 10
  - type: sphere
    at: [-22, 0, 0]
    radius: 9
    image: builtin:venus_magellan
    line_width: 0.5
    spin: 10
  - type: sphere
    at: [0, 0, 0]
    radius: 9
    image: builtin:moon_lroc
    line_width: 0.5
    spin: 10
  - type: sphere
    at: [22, 0, 0]
    radius: 9
    image: builtin:mars_viking
    line_width: 0.5
    spin: 10
  - type: sphere
    at: [45, 0, 0]
    radius: 9
    image: builtin:jupiter_cassini
    line_width: 0.5
    spin: 10
```

::: details More about the maps
- **No Saturn map:** a 2025 Cassini global map of Saturn exists, but it has gaps at the poles and the rings' shadow across the south, and no clear licence.
:::

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

## ring

**A circle or ellipse: an orbit, a rim, a range ring.** It is a line, drawn with the same [line keys](./lines#line-keys) as a path, so it can be dashed, glow or carry pulses.

- `at` is its centre. With a point id the ring follows that point.
- `inclination` tilts the ring about its line of nodes, and `node` turns that line: the bearing where an inclined ring crosses the plane.
- `orbit: mars` draws a [real body's](../scale#the-real-solar-system) orbit at the scene date instead of a circle you size yourself.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 30
      distance: 170
points:
  - id: star
    xyz: [0, 0, 0]
    marker: reticle
    label: STAR
objects:
  # a range ring
  - type: ring
    at: star
    radius: 30
    color: var(--lcars-blue)
  # an inclined, dashed ellipse
  - type: ring
    at: star
    radius: [60, 45]
    inclination: 20
    node: 40
    dash: [8, 6]
    color: var(--lcars-orange)
  # a quarter arc, glowing
  - type: ring
    at: star
    radius: 75
    arc: [0, 90]
    width: 3
    glow: true
    color: var(--lcars-yellow)
```

::: details More about ring
- **Orbits:** an `orbit` is an ellipse with its parent at a focus, tilted and turned as it really is, in the frame's units. Leave `at` out for a planet (the Sun sits at the origin) and put a moon's at its planet (`orbit: io`, `at: jupiter`). `radius`, `inclination`, `node`, `arc` and `band` do not apply then.
- **In a body's equator:** `body: saturn` lays the ring in that body's equator at the scene date; `inclination` and `node` tilt it from there, and `rotation` does not apply.
- **Looks:** a ring drawn as a line is part of the diagram look; the realistic [look](../index#looks-diagram-and-realistic) hides it. A ring with a band picture stays.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `radius` | number / `[a, b]` | `100` | Radius, scene units, or `[a, b]` for an ellipse (`a` along the line of nodes) |
| `inclination` | number | `0` | Tilt of the ring's plane about the line of nodes, degrees |
| `node` | number | `0` | Bearing of the line of nodes, degrees |
| `arc` | `[from, to]` | whole ring | Only part of the ring, degrees round it |
| `orbit` | string | - | A real body's name: draw its orbit at the scene date |
| `body` | string | - | A real body's name: lay the ring in its equator |
| `band` | object | - | A flat band with a picture, see [Ring band](#ring-band) |
| `color` | colour | `theme:colors.ui.secondary` | Line colour |
| [Line keys](./lines#line-keys) | | | `width`, `dash`, `colors`, `glow`, `line_look`, `blend` and `pulse` |

### Ring band

**`band` turns a ring into a flat band with a picture laid across it: planetary rings, an accretion disc.** `builtin:saturn_rings` is Saturn's rings.

- The band runs from `band.inner_radius` out to the ring's `radius`. The picture lies across its width: its left edge on the inner rim, its right edge on the outer; its height is not used.
- A planet in the middle hides the far side of the band, and the near side passes in front of the planet.
- With a band, the ring's own line is drawn only when you set `width`.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 25
      tilt: 18
      distance: 50
objects:
  - type: sphere
    id: saturn
    radius: 8
    fill:
      effect:
        preset: ringed_giant
    line_width: 0.5
    spin: 12
  - type: ring
    radius: 18.6
    band:
      image: builtin:saturn_rings
      inner_radius: 8.9
    inclination: 27
```

::: details More about ring bands
- **Saturn's rings to scale:** `builtin:saturn_rings` runs from the D ring to the F ring, drawn from their published radii. Use a `radius` of 2.33 and a `band.inner_radius` of 1.11 times the planet's radius.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `band.image` | string | - | The picture: `builtin:saturn_rings`, `/local/...` or `media-source://...` |
| `band.inner_radius` | number / `[a, b]` | half the radius | The band's inner edge, scene units, or `[a, b]` for an ellipse |
| `band.opacity` | number | `1` | The band's opacity, `0` to `1` |
| `band.color` | colour | none | A tint the picture is multiplied by. Without it, the picture's own colours |

## image

**Your own picture lying flat on the scene plane: a galaxy photo under a map, a chart, a floor plan.** Grids drawn at the same height draw over it, so it works as a backdrop for a grid.

- The picture sits just under the plane by default (`alt: -0.01`), so a grid at height 0 draws its lines on top.
- `blend: add` makes black in the picture see-through, which suits a photo of space on black.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 50
      distance: 260
objects:
  # a nebula photo, black made see-through
  - type: image
    src: builtin:nebula_orange_red
    size: 160
    shape: disc
    blend: add
    opacity: 0.8
  # a grid drawn over it
  - type: grid
    shape: disc
    radius: 80
    pattern: polar
    line_spacing: 20
    spoke_count: 12
    color: var(--lcars-blue)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `src` | string | - | The picture: `builtin:<name>`, a path or URL (`/local/galaxy.jpg`), or a Home Assistant media item (`media-source://...`) |
| `size` | number / `[w, d]` | `200` | Width and depth, scene units. One number is a square; a disc takes the width as its diameter |
| `shape` | string | `plane` | `plane` (a rectangle) or `disc` |
| `alt` | number | `-0.01` | Height above the plane, scene units |
| `blend` | string | `normal` | `add`: black in the picture becomes see-through |
| `opacity` | number | `1` | Opacity, `0` to `1` |
