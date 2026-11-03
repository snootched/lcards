---
description: "Astrometrics card effects in 3D: nebula clouds, scan bands, moving dashes and pulses, animated planet and grid fills (plasma, fluid, contour), warp streaks and dust."
---

# Effects

The [background animation](/core/effects/background-animations) presets, rebuilt as parts of the 3D scene: they sit in space and move with the camera instead of being a flat layer behind it. Every effect is still unless you give it a speed, so a scene with nothing moving draws nothing; under reduced motion (the system setting) they all hold still.

<CardGallery set="astro-effects" />

## Nebula

`type: nebula` puts clouds of gas in the scene, in the look of the [nebula](/core/effects/background-animations/preset-reference#nebula) preset with `volumetric: true`. Each cloud is a few soft puffs facing the camera at slightly different depths, so as you turn the camera the clouds shift against each other and against the grids. A cloud fades as you fly into it, and a planet hides the clouds behind it.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v: { target: [0, 0, 0], yaw: 20, tilt: 25, distance: 300 }
backdrop:
  stars: { count: 2000 }
objects:
  - { type: grid, shape: disc, radius: 100, pattern: polar, line_spacing: 10, spoke_count: 36 }
  - type: nebula
    size: [220, 50, 220]
    cloud_count: 8
    seed: 5
    drift: 3
    colors: [var(--lcars-violet), var(--lcars-blue), var(--lcars-red)]
```

| Key | What it does |
|---|---|
| `radius` or `size` | The region the clouds fill: a ball of `radius` (default 100), or a box `[width, height, depth]` (one number for a cube), round `at`. |
| `cloud_count`, `seed` | How many clouds (1 to 10, default 4) the seed places; the same seed always places the same clouds. |
| `clouds` | Place them yourself instead: a list of `{ xyz, radius, color, opacity }`; `size: [width, height, depth]` and `rotation: [x, y, z]` make one an ellipsoid, `dust: true` a [dust cloud](#shapes-dust-and-colour). |
| `render` | `puffs` (default) or `volume`: [gas you can fly into](#gas-you-can-fly-into). |
| `min_radius`, `max_radius` | Cloud sizes, scene units (default 0.15 and 0.4 of the region; 0.25 and 0.55 with `render: volume`). |
| `brightness` | `[dimmest, brightest]`: each cloud's opacity is picked at random between them (default `[0.3, 0.8]`); a cloud's own `opacity` wins. |
| `colors` | One colour, or a list the seed picks from per cloud. Default `var(--lcars-violet)`. |
| `turbulence` | How ragged the edges are, 0 to 1 (default 0.5). |
| `noise_scale` | Detail of the gas per scene unit; lower is larger, smoother wisps. |
| `drift` | How fast the gas churns, scene units per second (`[x, y]` for a direction). Default 0, still. [Following an entity](./data#settings-from-entities) it eases to each new speed. |
| `blend` | `add` (default: light adds up) or `normal`. |
| `density` | With `render: volume`: how thick the gas is (default 1; 2 is twice as thick). [Following an entity](./data#settings-from-entities) it eases to each new value. |
| `stretch` | How drawn out each seeded cloud is, 0 (round, default) to 1 (long and flat), each turned its own way. |
| `core_color` | A colour deep in the gas, running out to the cloud colours at the edges. |
| `shape`, `dust`, `dust_count`, `dust_color` | With `render: volume`: [shapes, dust and colour](#shapes-dust-and-colour). |

Clouds are never tappable, so they never get in the way of points behind them. A label for a cloud is a [point](./points) at the same place.

### Gas you can fly into

`render: volume` draws the same clouds (the same seed, colours and brightness) as one body of gas filling the region, instead of puffs. Fly into it and there is gas all round you, which puffs facing the camera cannot give. The gas fades out toward the edges of the region, so its box or ball never shows. A planet, model or other solid object inside the gas hides the gas behind it, and the gas in front of it still shows.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  view: outside
  views:
    outside: { target: [0, 0, 0], yaw: 20, tilt: 20, distance: 300 }
    inside: { target: [40, 0, 10], yaw: 200, tilt: 6, distance: 30 }
backdrop:
  stars: { count: 2000 }
points:
  - { id: fly_in, xyz: [40, 0, 10], label: FLY INSIDE, tap_action: { action: fly-to, view: inside } }
  - { id: fly_out, xyz: [-90, 0, 0], label: BACK OUT, tap_action: { action: fly-to, view: outside } }
objects:
  - { type: grid, shape: disc, radius: 100, pattern: polar, line_spacing: 10, spoke_count: 36 }
  - { type: sphere, at: [30, 0, -20], radius: 14, fill_color: var(--lcars-orange) }
  - type: nebula
    render: volume
    size: [220, 60, 220]
    cloud_count: 7
    seed: 5
    drift: 2
    colors: [var(--lcars-violet), var(--lcars-blue)]
```

`turbulence` erodes the clouds into wisps and holes (0 gives smooth blobs), and `density` makes the gas thicker or thinner. A volume is drawn at half the screen's resolution, which soft gas does not show, and costs about as much as the puffs.

### Shapes, dust and colour

With `render: volume`, `shape` gives the gas a form, after the real nebulae. The clouds still give the clumps and the colours inside the form, so `cloud_count`, `seed` and `colors` keep working; turn the form with `rotation`.

| `shape` | The gas |
|---|---|
| `clouds` (default) | The clouds themselves. |
| `shell` | A thin hollow sphere: a ring with a dark middle from any side (the Ring nebula). |
| `bipolar` | An hourglass along the object's y axis: two hollow lobes joined at a narrow waist, the gas streaked outward (the Butterfly, the Hourglass). |
| `filaments` | Long thin strands running along the object's x axis (the Veil). |
| `cavity` | A thick cup round a hollow that opens on the object's +z side: a bright bowl seen from there, a crescent from the side (a blister, as in Orion). |

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v: { target: [0, 0, 0], yaw: 0, tilt: 10, distance: 420 }
backdrop:
  stars: { count: 2000 }
objects:
  - { type: nebula, render: volume, shape: shell, at: [-150, 60, 0], radius: 55, cloud_count: 8, colors: [var(--lcars-ice), var(--lcars-violet)] }
  - { type: nebula, render: volume, shape: bipolar, at: [-50, 60, 0], radius: 55, cloud_count: 8, colors: [var(--lcars-orange), var(--lcars-red)], core_color: var(--lcards-moonlight) }
  - { type: nebula, render: volume, shape: filaments, at: [50, 60, 0], radius: 55, cloud_count: 8, stretch: 0.5, colors: [var(--lcars-red), var(--lcars-ice)] }
  - { type: nebula, render: volume, shape: cavity, at: [150, 60, 0], radius: 55, cloud_count: 8, colors: [var(--lcars-red), var(--lcars-orange)], core_color: var(--lcars-ice) }
  - { type: nebula, render: volume, at: [0, -70, 0], size: [300, 60, 80], cloud_count: 8, stretch: 0.7, dust_count: 3, colors: [var(--lcars-violet), var(--lcars-blue)], core_color: var(--lcars-ice) }
```

- `stretch` draws each seeded cloud out (0 round to 1 long and flat); placed by hand, a cloud takes `size` and `rotation` instead. The same seed with or without `stretch` places the same clouds.
- `core_color` colours the gas deep inside a cloud (in a shape: near its middle), running out to the cloud colours at the edges, as in the Hubble pictures.
- **Dust** is dark gas that hides the gas behind it: `dust_count` (0 to 4) lays dark clouds across the gas clouds, or mark a hand-placed cloud `dust: true`. `dust` sets how dark (0 to 1, default 0.8) and `dust_color` its colour (default black). With `blend: add` (the default) the dust darkens only this nebula's own gas, so the stars behind still show through; with `blend: normal` it hides what is behind the nebula too. A lane placed by hand through a bright cloud reads most clearly:

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v: { target: [0, 0, 0], yaw: 0, tilt: 0, distance: 400 }
backdrop:
  stars: { count: 2000 }
objects:
  - type: nebula
    render: volume
    radius: 130
    colors: [var(--lcars-orange)]
    clouds:
      - { xyz: [0, 0, 0], radius: 100, opacity: 0.9 }
      - { xyz: [0, 0, 40], size: [200, 20, 30], rotation: [0, 0, 20], dust: true }
```

## Scan bands

`scan_period` (seconds per sweep) on a `grid`, `sphere` or `volume` sends a bright band across its lines, as the background grid's `scan_period` does. A sphere sweeps from pole to pole, a dome from the top to its rim, a cylinder top to bottom, a polar disc rings out from its centre like a sensor ping, a plane runs south to north, and a volume sweeps down its walls. `scan_color` sets the band's colour (default `var(--lcards-moonlight)`).

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, 10, 0], yaw: 20, tilt: 25, distance: 260 }
objects:
  - { type: grid, shape: disc, radius: 100, pattern: polar, line_spacing: 10, spoke_count: 36, scan_period: 6, scan_color: var(--lcars-yellow) }
  - { type: sphere, at: [-50, 25, 0], radius: 22, scan_period: 5, color: var(--lcars-blue) }
  - { type: volume, shape: sector, radius: [55, 95], angle: [100, 170], height: [0, 30], scan_period: 4, color: var(--lcars-green) }
```

## Moving dashes and pulses

On a `ring`, `path` or `beam`:

- `flow_speed` moves a dashed line's dashes along it, px per second (negative runs backwards). Dashes keep their px size at any distance, so they move at the same speed on screen near or far.
- `pulse` sends bright pulses along the line, as the [flow](/core/effects/background-animations/preset-reference#flow) preset's streaks: `true`, or `{ length, gap, width, color, speed }` (px; default 14 px pulses 90 px apart at 80 px per second, in `var(--lcards-moonlight)`). Pulses add light, so on a coloured line they burn toward white. With `flow_speed` set, the pulses move at that speed.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v: { target: [0, 0, 0], yaw: 20, tilt: 40, distance: 320 }
points:
  - { id: hub, xyz: [0, 0, 0], marker: diamond, label: HUB, style: major }
  - { id: alpha, polar: [70, 30], marker: dot, label: ALPHA }
  - { id: beta, polar: [60, 150], marker: dot, label: BETA }
  - { id: gamma, polar: [80, 260], marker: dot, label: GAMMA }
objects:
  - { type: grid, shape: disc, radius: 100, pattern: polar, line_spacing: 20, spoke_count: 12, opacity: 0.5 }
  - { type: path, from: hub, to: alpha, arc: 10, color: var(--lcars-orange), pulse: true }
  - { type: path, from: hub, to: beta, arc: 10, color: var(--lcars-orange), dash: [8, 6], flow_speed: 30 }
  - { type: path, from: hub, to: gamma, arc: 10, width: 2, color: var(--lcars-blue), pulse: { length: 24, gap: 120, color: var(--lcars-yellow) } }
  - { type: ring, radius: 100, width: 2, dash: [12, 8], flow_speed: 20 }
```

## Animated surface fills

`fill_effect` paints a [plasma](/core/effects/background-animations/preset-reference#plasma), [fluid](/core/effects/background-animations/preset-reference#fluid) or [contour-field](/core/effects/background-animations/preset-reference#contour-field) pattern, `bands` (belts round the latitude, a gas giant) or `swirl` (gas spiralling in, below), on a `sphere`'s body or under a `grid`'s lines: a star's surface, a gas giant's bands, an ocean, a density map. The pattern is drawn in 3D, so it has no seam round a sphere and no pinch at its poles, and it turns with `spin`. On a sphere it is painted over `fill` in place of `image`, and the body still hides what is behind it.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v: { target: [0, 10, 0], yaw: 15, tilt: 30, distance: 230 }
objects:
  - type: grid
    shape: plane
    size: [220, 140]
    line_spacing: 20
    opacity: 0.6
    fill_effect: { type: contour, colors: [var(--lcars-blue), var(--lcars-green), var(--lcars-yellow), var(--lcars-orange)], num_bands: 6, fill_level: 0.3, opacity: 0.5 }
  - { type: sphere, at: [-60, 30, 0], radius: 24, line_spacing_deg: 30, opacity: 0.4, fill_effect: { type: plasma, color_a: var(--lcars-orange), color_b: var(--lcars-yellow), speed: 2 } }
  - { type: sphere, at: [10, 30, -10], radius: 20, opacity: 0.3, spin: 4, fill_effect: { type: contour, colors: [var(--lcars-orange), var(--lcars-yellow), var(--lcars-red)], num_bands: 8 } }
  - { type: sphere, at: [70, 25, 10], radius: 18, color: var(--lcars-blue), fill_effect: { type: fluid, color: var(--lcars-blue) } }
```

| Key | What it does |
|---|---|
| `preset` | A [planet type](#planet-types) to start from; the keys you set win over it. |
| `type` | `plasma` (two-colour bands), `fluid` (a one-colour wash), `contour` (stepped topographic bands), `bands` (belts round the latitude) or `swirl` (gas spiralling in). Default the preset's type, else `plasma`. |
| `color_a`, `color_b` | `plasma`: its two colours (default `var(--lcars-blue)` and `var(--lcars-orange)`). |
| `color` | `fluid`: the wash colour; its alpha is how strong the wash is. |
| `colors`, `num_bands`, `fill_level`, `fill_color`, `blend_colors` | `contour`: as on the contour-field preset (stops from low to high, how many bands, flooding the lowest ones). |
| `colors`, `num_bands`, `turbulence`, `blend_colors` | `bands`: the belt colours, repeated from the south pole to the north; how many belts pole to pole; how much their edges swirl (0 straight to 1 stormy, default 0.3); soft or hard edges. The belts follow the object's y axis, so they suit a sphere. |
| `colors`, `turbulence` | `swirl`: colour stops from the middle out to the rim; how much the gas clumps and how ragged its edge is (default 0.3). |
| `base_frequency`, `num_octaves` | Detail: features per scene unit (default about 3 across the radius) and layers of finer detail. |
| `speed` | How fast the pattern flows through the object, scene units per second; `swirl`: how fast the gas turns at the rim. Default 0, still. |
| `opacity` | The fill's opacity. |

### Swirls

`type: swirl` is gas spiralling in round the object's y axis: a whirlpool, an accretion disc, a wormhole's mouth. It turns faster toward the middle and is streaked along the spiral, with dark lanes of thinner gas between the streaks, a rippled heart and a ragged outer edge that trails off in wisps (`turbulence`). `colors` run from the heart out to the rim, and `speed` is how fast it turns at the rim. On a `well` grid the gas pours down the funnel; on a `disc` it lies flat. Set `line_width: 0` and `edges: false` on the grid to show the gas alone.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v: { target: [0, -2, 0], yaw: 20, tilt: 40, distance: 34 }
objects:
  - type: grid
    shape: well
    well_throat: 0.07
    radius: 15
    depth: 5
    line_width: 0
    edges: false
    fill_effect:
      type: swirl
      colors: [var(--lcards-moonlight), var(--lcards-orange-lightest), var(--lcars-violet), var(--lcards-blue-medium), var(--lcars-violet), var(--lcards-blue-dark)]
      speed: 3
      turbulence: 0.8
      num_octaves: 5
  - { type: glow, at: [0, 3, 0], size: 10, color: var(--lcards-orange-lightest) }
```

The [Bajoran wormhole starter](./starters#bajoran-wormhole) builds a whole mouth from it, with a shaft of light, sparkling stars and wisps of gas.

### Planet types

`preset` starts the fill from a planet type: its type, colours (from the LCARdS palette, so they follow the theme) and detail. Anything you set on top wins, so `{ preset: gas_giant, num_bands: 9 }` is a gas giant with fewer belts.

| `preset` | Looks like | Built on |
|---|---|---|
| `gas_giant` | Jupiter: orange and cream belts, stormy edges | `bands` |
| `ringed_giant` | Saturn: pale gold belts, calm | `bands` |
| `ice_giant` | Uranus: pale blue, faint belts | `bands` |
| `storm_giant` | Neptune: deep blue belts, streaked | `bands` |
| `clouds` | Venus from space: a cream cloud deck, slowly churning | `bands` |
| `lava` | Dark crust with glowing cracks | `contour` |
| `ice` | White and pale blue ice | `contour` |
| `rocky` | Grey highlands and plains | `contour` |
| `terran` | Oceans, land and ice caps | `contour` |

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    v: { target: [0, 0, 0], yaw: 0, tilt: 10, distance: 130 }
objects:
  - { type: sphere, at: [-48, 14, 0], radius: 10, fill_effect: { preset: gas_giant }, line_width: 0.5, spin: 8 }
  - { type: sphere, at: [-16, 14, 0], radius: 10, fill_effect: { preset: ringed_giant }, line_width: 0.5, spin: 8 }
  - { type: sphere, at: [16, 14, 0], radius: 10, fill_effect: { preset: ice_giant }, line_width: 0.5, spin: 8 }
  - { type: sphere, at: [48, 14, 0], radius: 10, fill_effect: { preset: storm_giant }, line_width: 0.5, spin: 8 }
  - { type: sphere, at: [-48, -14, 0], radius: 10, fill_effect: { preset: clouds }, line_width: 0.5, spin: 8 }
  - { type: sphere, at: [-16, -14, 0], radius: 10, fill_effect: { preset: lava }, line_width: 0.5, spin: 8 }
  - { type: sphere, at: [16, -14, 0], radius: 10, fill_effect: { preset: ice }, line_width: 0.5, spin: 8 }
  - { type: sphere, at: [48, -14, 0], radius: 10, fill_effect: { preset: terran }, line_width: 0.5, spin: 8 }
```

## Warp and dust

A fly-to with `warp` streaks the stars past the camera, by how fast it moves for its distance from what it looks at, so a hop between planets streaks as a jump across the galaxy does. Turn it on for every fly-to with `camera.warp: true`, or for one view with `warp: true` in that view (a point's or object's `view` takes it too), or for one action with `warp: true` on its `fly-to` (or the [`lcards.fly_to`](/configuration/ha-actions#lcards-fly-to) action); `false` there turns it off. `camera.warp: { entity: input_boolean.warp_travel }` follows a toggle: fly-tos streak while it is on. The streaks grow with the camera's speed and shrink back to stars as it lands.

- `backdrop.stars.streak` scales the streaks (default 1; 0 never streaks).
- `backdrop.stars.spectrum: true` splits each streak into colour, as a Doppler shift of the star's own colour: violet toward the tail (nearer the direction of flight) and red toward the head. White stars show the whole rainbow; a blue star streaks green to violet, its tail fading as it shifts past violet, and a red star the other way. `spectrum_direction: reverse` puts violet at the head instead.
- `backdrop.dust` adds depth dust: faint particles that fill the space round the camera wherever it goes. Unlike the stars at infinity they stay put as the camera moves, so every pan and fly-to shows depth, and they streak in a warp too. The dust has no edge: particles fade out at `radius` from the camera and new ones fade in ahead as it travels, and coming back to a place shows the same dust. It takes the stars' keys (`count`, default 800; `min_radius`, `max_radius`, `brightness`, `colors`, `opacity`, `seed`, `spectrum`) plus `spectrum_direction` and `radius`, how far round the camera it reaches (default 1.5 times the scene's size; smaller is denser and shows depth on smaller moves).

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  view: far
  fly_duration: 2400
  views:
    far: { target: [0, 0, 0], yaw: 20, tilt: 20, distance: 600 }
    near: { target: [40, 5, 30], yaw: 30, tilt: 10, distance: 25, warp: true }
  buttons: true
backdrop:
  stars: { count: 4000, max_radius: 1.4, spectrum: true }
  dust: { count: 1500 }
points:
  - { id: core, xyz: [0, 0, 0], label: GALACTIC CORE, style: title, tap_action: { action: fly-to, view: near } }
objects:
  - { type: grid, shape: disc, radius: 100, pattern: polar, line_spacing: 10, spoke_count: 36, opacity: 0.6 }
  - { type: glow, at: core, size: 50, color: var(--lcars-yellow), tap_action: { action: fly-to, view: far } }
```

Tap the label to warp in; tap the glow to fly back out.

### Going to warp

`warp` on the card sends the ship to warp where it is: the scene's own backdrop stars and dust streak along the view (with `backdrop.stars.spectrum`, in colour), and the [warp starfield](/core/effects/background-animations/preset-reference#warp-starfield) streams past behind the scene; `false` drops out of warp again. `warp_factor` (1 to 9.9, default 6) sets how long the streaks grow and how fast they stream. Both can follow entities, so a toggle and a slider make an ENGAGE button and a warp factor control:

```yaml
warp: { entity: input_boolean.warp }
warp_factor: { entity: input_number.warp_factor, output: [1, 9.9] }
```

`warp` reads `on`, `true` or a number above 0 as engaged. Going to warp takes about two seconds, dropping out a little less. Nothing streams under reduced motion. `camera.warp` is different: it streaks the stars only while a fly-to moves the camera.

## Cost

Measured on an Intel Arc laptop GPU at 1300 x 866 px, each effect adds about 1 to 2 ms per frame while it moves: well inside a 60 frames per second budget. A still effect costs nothing between frames, because a still scene draws nothing. The nebula and fill shaders load in a small extra download the first time a card uses one. A nebula with `render: volume` adds about 1 ms seen from outside and 1.5 ms from inside the gas; a `shape`, `stretch`, `core_color` or dust adds at most 0.8 ms more.
