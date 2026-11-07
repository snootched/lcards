---
description: "Astrometrics card ships and stations: 3D models (built-in ships and starbases, glTF files) at real or visible size, and the Borg cube."
---

# Ships and Stations

Ships, stations and other made things: 3D models (the built-in ships and starbases, or your own glTF files) and the Borg cube. The keys every object takes (`id`, `at`, `rotation`, `opacity`, `visible` ...) are on the [Objects](../objects#keys-every-object-takes) page.

## model

**A 3D model from a glTF file (`.glb` or `.gltf`): a starship, a station, or anything else made as a model.** It is drawn as a hologram by default: a glow with a bright rim, scanlines and its feature edges.

- `material: original` shows the file's own materials instead, lit.
- Leave out `size` to draw the model at its [real size](#real-size); give `size` to scale it to fit.
- Your own file goes in `/config/www/` and is `/local/...` in `src`. Where to put it, how to pick it and how to keep it light are on [Your own models](../models).

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 150
      tilt: 20
      distance: 130
backdrop:
  stars:
    count: 1500
objects:
  # a hologram with a scan band and its animation looping
  - type: model
    id: refit
    src: builtin:constitution_class_refit
    at: [-30, 0, 0]
    size: 55
    scan:
      period: 5
    animation: all
  # the file's own materials, lit
  - type: model
    id: galaxy
    src: builtin:galaxy_class
    at: [30, 0, 0]
    size: 55
    material: original
```

::: details More about model
- **While it loads:** a stand-in box shows until the file is in.
- **Compression:** files compressed with meshopt load. Draco-compressed files do not load; the browser console says why.
- **Big models:** feature edges are left off on a model over 250,000 triangles, because working them out freezes the page for seconds. `edges: true` draws them anyway. See [make it light](../models#make-it-light).
- **Labels behind it:** a model hides labels and cards behind it by its real shape, not by a bounding sphere. See [Points on a model](#points-on-a-model).
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `src` | string | required | The file. `builtin:<name>` is a model shipped with LCARdS (see [built-in models](#built-in-models)); your own is `/local/...` |
| `size` | number | real size | Its largest extent, scene units: the file is scaled and centred to fit. Left out: its [real size](#real-size) |
| `length` | number | - | Its real length in metres (its largest extent), for a file not made at its true scale. See [real size](#real-size) |
| `file_units` | string | `m` | The units the file was made in, for its real size: `m`, `cm`, `mm`, `km`, `ft` or `in` |
| `material` | string | `hologram` | `hologram`: a glow with a bright rim and scanlines. `original`: the file's own materials, lit |
| `color` | colour | `var(--lcars-blue)` | The hologram's body colour |
| `rim.color` | colour | `var(--lcards-moonlight)` | The hologram's rim colour |
| `opacity` | number | `0.85` | The hologram's brightness, `0` to `1` |
| `scanlines` | number | `0.5` | Scanline strength, `0` (none) to `1` |
| `solid` | boolean | `true` | `true`: the hologram hides its own far side. `false`: see-through |
| `blend` | string | `add` | The hologram's blending: `add` or `normal` |
| `scan.period` | number | `0` | A bright band sweeping along the model, seconds per sweep. `0`: none. Stops under reduced motion |
| `scan.color` | colour | `var(--lcards-moonlight)` | The scan band's colour |
| `edges` | boolean / object | on for a hologram | Feature edges as lines. Off with `material: original`, and on a model over 250,000 triangles |
| `edges.angle` | number | `30` | Draw an edge where faces meet at more than this angle, degrees |
| `edges.color` | colour | the rim colour | Edge colour |
| `animation` | string / list | - | Clips to loop: `all`, a clip name or a list of names. Both built-in ships have one clip, `bussards` |
| `occlude` | boolean | `true` | Hide labels and cards behind it |

### Points on a model

**A point with `object:` set to a model's id stands on that model: a label on the bridge, a marker on a nacelle.** The point moves and turns with the model.

- `xyz` is then in the file's own coordinates, so changing `size` never moves the points.
- `part:` puts a point on a named part of the file (a node), so it follows that part when an animation moves it. With `part`, `xyz` is an offset from the part.
- Labels on the far side of the model hide behind it: drag to turn the ship below until the port nacelle is behind the hull, and its label goes.

```yaml live
type: custom:lcards-astrometrics-card
height: 380
camera:
  view: three
  views:
    three:
      target: [0, -6, 0]
      yaw: 145
      tilt: 22
      distance: 105
backdrop:
  stars:
    count: 1500
points:
  - id: bridge
    object: ship
    part: bridge
    label: BRIDGE
    marker: dot
    style: major
  - id: deflector
    object: ship
    part: deflector
    label: DEFLECTOR
    marker: dot
  - id: port
    object: ship
    part: nacelle_port
    label: PORT NACELLE
    marker: dot
  - id: starboard
    object: ship
    part: nacelle_starboard
    label: STARBOARD NACELLE
    marker: dot
objects:
  - type: grid
    shape: disc
    radius: 70
    pattern: polar
    line_spacing: 10
    spoke_count: 24
    at: [0, -25, 0]
  - type: model
    id: ship
    src: builtin:constitution_class_refit
    size: 70
    scan:
      period: 5
    animation: all
```

::: details More about points on a model
- **In the Astrometrics Studio:** **Pick on preview** places a point on the model's surface, and the part list fills in from the file.
- **How models hide labels:** by their real shape, from a small depth image of the scene that is taken only when the camera or the model moves.
- **More placement forms** for points are on the [Points](../points#placement-forms) page.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `object` | string | - | On the point: the id of the model it stands on |
| `xyz` | `[x, y, z]` | - | On the point: where it sits, in the file's own coordinates (with `part`: an offset from the part) |
| `part` | string | - | On the point: the name of a part (node) of the model; the point follows it. A model's parts are listed under [built-in models](#built-in-models) |

### Real size

**A model without `size`, in a scene with `units`, is drawn at its real size.** Ships and stations then sit in proportion to each other and to the planets.

- The scene needs `units` (or the model must be in a [star system](../scale#star-systems) that has them). Without `units`, a model without `size` is drawn 50 scene units across.
- The file is read in `file_units`: metres by default, as glTF files and the built-in models are.
- For a file not made at its true scale, give its real `length` in metres and it is drawn that long, whatever the file measures. `size` wins over both; set it to draw a model larger on purpose.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
units: km
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 30
      tilt: 20
      distance: 2.6
backdrop:
  stars:
    count: 1500
points:
  - id: ds9
    xyz: [0, 0, 0]
  - id: ship
    xyz: [0.9, 0.2, 0.6]
    label: NCC-1701-A
    style: minor
objects:
  # Deep Space 9, 1.45 km across
  - type: model
    id: station
    src: builtin:deep_space_nine
    at: ds9
    material: original
  # the refit Constitution-class ship, 0.305 km long
  - type: model
    id: ship
    src: builtin:constitution_class_refit
    at: ship
```

::: details More about real size
- **In proportion:** the Constitution-class ship is 0.305 km long beside Deep Space 9's 1.45 km, round a planet 12,742 km across.
- **Downloaded models:** many are not made at their true scale. A Star Trek Online Odyssey-class ship from Sketchfab measures 53 units long, so read as metres it would be drawn 53 m long. Give it its real `length` in metres (the Odyssey is 1,061 m).
- **Any units:** `length` stays right in any scene units, where a `size` would need changing with them.
- **Your own files,** with a file made in feet and one at an odd scale:

  ```yaml
  objects:
    # a download made in feet
    - type: model
      id: runabout
      src: /local/models/runabout.glb
      at: [1, 0, -1]
      file_units: ft
    # a download at an odd scale: its real length in metres
    - type: model
      id: odyssey
      src: /local/models/odyssey.glb
      at: [-3, 0, 2]
      length: 1061
  ```

- **In the Astrometrics Studio:** the model's form shows what its file measures and how it is drawn. A file read at its own measurements says to set **Length (m)** when it is not at its true scale. **Show** flies the preview to the model, **Fit to view** sets a size about a fifth of the preview's view, **File size** sets its largest extent as the size (for a file made in the scene's units) and **Real size** clears `size`.
- **New models:** a new model in a scene with units starts at its real size, and the preview flies to it once its file is in (and again when you pick another file), so a real-size ship is never a lost speck.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `units` | string | - | On the card: what one scene unit is (`m`, `km`, `au`, `ly` or `pc`). See [Scale](../scale#units) |
| `size` | number | - | Wins over the real size: its largest extent, scene units |
| `length` | number | - | Its real length in metres. Wins over `file_units` |
| `file_units` | string | `m` | The units the file was made in: `m`, `cm`, `mm`, `km`, `ft` or `in` |

### Visible size

**At its real size a ship is a speck in a view of a whole star system. `model_scale: visible` on the card draws it large enough to see.**

- Each model is drawn at least 40 px across, scaled about its centre, and at its real size again once you are close enough for that to be larger.
- Only real-size models grow: a model with its own `size` is left as it is. Points on a model grow with it.
- You can switch it on screen with the size button under the [camera buttons](../#controls), the `V` key, a `set-model-scale` action or the Astrometrics Studio's toolbar. That is not saved.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
units: km
model_scale: visible
camera:
  views:
    v:
      target: [15, 0, 5]
      yaw: 20
      tilt: 30
      distance: 90
backdrop:
  stars:
    count: 1500
points:
  - id: ds9
    xyz: [0, 0, 0]
    label: DEEP SPACE 9
    style: minor
  - id: ship
    xyz: [30, 0, 10]
    label: NCC-1701-A
    style: minor
objects:
  - type: model
    id: station
    src: builtin:deep_space_nine
    at: ds9
    material: original
  - type: model
    id: ship
    src: builtin:constitution_class_refit
    at: ship
```

| Key | Type | Default | Description |
|---|---|---|---|
| `model_scale` | string | `real` | On the card: how real-size models start. `real`: in proportion, however small. `visible`: at least 40 px across |
| `camera.buttons.scale` | boolean | `true` | The size button beside the camera buttons, shown only when a model is drawn at its real size. `false` hides it |
| `model_scale` (action) | string | `toggle` | On a `set-model-scale` action: `real`, `visible` or `toggle`. See [actions](../points#actions) |

### Built-in models

**Ships and stations shipped with LCARdS: fan art made in code (no third-party model), recreating the designs seen on screen.** Use one in `src` as `builtin:<name>`.

- All of them are in metres, with Y up, so they come in at their [real size](#real-size).
- `material: original` shows their own colours and lit windows.
- Both ships use one set of part names, so a scene that labels `bridge` or `nacelle_port` works with either.
- Rings, rims and round hulls put their part point on the front face (+z), so a label sits on the structure rather than in the middle of the station.

```yaml live
type: custom:lcards-astrometrics-card
height: 420
camera:
  view: station
  views:
    station:
      target: [0, 0, 0]
      yaw: 30
      tilt: 10
      distance: 170
backdrop:
  stars:
    count: 1500
points:
  - id: ops
    object: ds9
    part: ops
    label: OPS
    marker: dot
    style: major
  - id: promenade
    object: ds9
    part: promenade
    label: PROMENADE
    marker: dot
  - id: pylon
    object: ds9
    part: upper_pylon_1
    label: UPPER PYLON 1
    marker: dot
objects:
  - type: model
    id: ds9
    src: builtin:deep_space_nine
    size: 90
    material: original
```

::: details More about the built-in models
- **Parts on the front face:** the rings, rims and round hulls with their point on the front face are `habitat_ring`, `docking_ring`, `cap`, `promenade`, `underdish`, `neck` and `hull`.
- **Your own files:** for the My models folder, picking a file, sizing and turning it, and keeping a big model light, see [Your own models](../models).
:::

| `src` | What it is | Parts (`part:`) |
|---|---|---|
| `builtin:constitution_class_refit` | The refit Constitution-class starship of the films (USS Enterprise NCC-1701-A): 305 m long, 144.5 m across the saucer, the bow toward +z. One animation clip, `bussards` (the collectors pulse). | `saucer`, `bridge`, `sensor_dome`, `impulse`, `impulse_exhaust`, `neck`, `torpedo_launcher`, `secondary_hull`, `deflector`, `shuttle_bay`, `pylon_port`, `pylon_starboard`, `nacelle_port`, `nacelle_starboard`, `bussard_port`, `bussard_starboard`, `grille_port`, `grille_starboard`, `windows` |
| `builtin:galaxy_class` | The Galaxy-class starship of The Next Generation (USS Enterprise NCC-1701-D): 642.5 m long, about 470 m across the saucer, the bow toward +z. One animation clip, `bussards`. | the same names as the Constitution, without `sensor_dome` |
| `builtin:deep_space_nine` | Deep Space 9 (Terok Nor), the Cardassian station of Deep Space Nine: 1452 m across, the docking pylons 969 m tip to tip. | `ops`, `upper_core`, `promenade`, `lower_core` (its bottom tip), `sail_towers`, `spokes` (three thin ones, between the bridges), `habitat_ring`, `docking_ring`, `crossover_bridges` (three), `docking_ports`, `windows`, `upper_pylon_1` to `upper_pylon_3` and `lower_pylon_1` to `lower_pylon_3` (their tips) |
| `builtin:earth_spacedock` | Earth Spacedock, from Star Trek III: The Search for Spock onward: 3800 m across and about 5480 m tall. | `antennas` (the top), `cap`, `space_doors` (the front door), `underdish`, `neck`, `hull`, `stem`, `base` (the sphere), `towers` (their tips, the bottom), `panels`, `windows` |
| `builtin:utopia_planitia_drydock` | A drydock of the Utopia Planitia Fleet Yards over Mars, sized for a Galaxy-class ship: about 760 m long, the bow end toward +z. Place several for the yards. | `frame` (ribs and rails), `deck`, `keel`, `lights`, `berth` (where a ship sits), `bow`, `stern` |

## cube

**A Borg cube, the same one as the [Borg screen effect](/core/borg) draws, or a plain shaded box.** It has machinery carved into every face, a rail lattice over it, green light from the recesses and glow spots pulsing deep inside.

- It sits in the scene like any object: it turns with `rotation` and `spin`, other objects pass into its recesses, and labels behind it hide.
- For the cube's green halo, put a `glow` at the same point.
- For many cubes or a slow tablet, use `detail: false`.

```yaml live
type: custom:lcards-astrometrics-card
height: 380
camera:
  views:
    v:
      target: [8, 0, 0]
      yaw: 35
      tilt: 20
      distance: 75
backdrop:
  stars:
    count: 1500
points:
  - id: cube
    xyz: [0, 0, 0]
  - id: name
    at: cube
    offset: [0, 18, 0]
    label: BORG CUBE
    style: major
objects:
  # the Borg cube with a glow behind it for its halo
  - type: glow
    at: cube
    size: 60
    color: var(--lcards-green-medium)
    opacity: 0.5
  - type: cube
    at: cube
    size: 20
    spin: 5
  # a plain box
  - type: cube
    shape: box
    at: [30, -5, 0]
    size: [8, 4, 12]
```

::: details More about the cube
- **Reduced motion:** the glow spots pulse on the scene clock, so they hold still under reduced motion.
- **Cost:** the carved cube costs about as much as the screen effect's cube for the pixels it covers. One cube filling the card is fine on a laptop.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `shape` | string | `borg` | `borg`: the Borg cube. `box`: a shaded box with its edges |
| `size` | number / `[x, y, z]` | `20` | Scene units: one number for a cube, or `[x, y, z]` for a box |
| `color` | colour | `var(--lcards-green-medium)` (borg), `var(--lcards-gray-medium)` (box) | `borg`: the light from inside and the hull's tint. `box`: the box |
| `glow.color` | colour | `var(--lcards-green-lightest)` | `borg`: the glow spots |
| `detail` | boolean | `true` | `borg`: `true` carves the machinery into the faces; `false` draws flat faces with the lattice, for slow graphics hardware |
| `seed` | number | `1` | `borg`: where the glow spots sit. A different number moves them |
| `edges` | boolean / object | `true` | `box`: draw its edges |
| `edges.color` | colour | `theme:colors.ui.secondary` | `box`: the edge colour |
| `opacity` | number | `1` | `box`: how see-through it is, `0` to `1`. A Borg cube ignores it |
| `occlude` | boolean | `true` | Hide labels and cards behind it |
