---
description: "Getting started with the LCARdS Astrometrics card: a first card to copy, every starter scene and part with its picture, and the card's own options."
---

# Getting Started

**Start from the quick start below or from a starter, then open the card in the [Astrometrics Studio](#the-studio) to change it on the live scene.** Not sure which? [Where to start](./#where-to-start) matches what you want to a starter.

## Quick start

**A galaxy disc with three named stars: drag to turn it, scroll or pinch to zoom.** Tap **Vega** to fly to it; tap **MAP VIEW** to fly to the view named `map`.

- Scene units are yours to choose: here the disc has a radius of 100. Line widths, dashes and label sizes are in px, so they look the same at any zoom.
- Bearings are in degrees: **0 is north** (away from the camera in the default view), **clockwise** seen from above. `polar: [64, 160]` is 64 units out on a bearing of 160.

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  view: galaxy
  views:
    galaxy:
      target: core
      yaw: 20
      tilt: 35
      distance: 260
    map:
      target: core
      tilt: 90
      distance: 300
backdrop:
  stars: true
points:
  - id: core
    xyz: [0, 0, 0]
    label: GALACTIC CORE
    style: title
  - id: vega
    polar: [64, 160]
    marker: triangle
    label: Vega
  - id: rigel
    polar: [88, 95]
    marker: diamond
    label: Rigel
  - id: home
    polar: [45, 300]
    marker: reticle
    label: MAP VIEW
    tap_action:
      action: fly-to
      view: map
objects:
  - type: grid
    shape: disc
    radius: 100
    pattern: polar
    line_spacing: 10
    spoke_count: 36
    ring_labels:
      step: 30
  - type: ring
    radius: 100
    width: 2
  - type: glow
    at: core
    size: 50
```

## Starters

**A starter is a ready-made scene or part: add one, then change anything, since nothing refers back to it.** In the [Studio](#the-studio) the Starters tab adds one with a few settings and shows its YAML first; the [Starters](./starters) page has each one as a live card with its YAML to copy.

- **A scene** is a whole card: its camera views, points and objects. In the Studio, **Use this scene** replaces yours and **Merge into the scene** adds its points, objects and views to yours.
- **A part** adds itself to the scene you have, next to what is there: a planet with moons, a belt, a nebula field. Its ids start with its name (`planet_body`), so two of the same part need two names.
- A part is sized for where it goes: at its real size when the scene names its units, sized to fit when it is in scene units (see [How a scene is sized](./#how-a-scene-is-sized)). At its real size a planet is a dot in a light-year scene, so add it inside an open star system, in that system's units.

**Scenes:**

<AstroStarterTiles :items="[
  ['galaxy', 'Galaxy with territories', 'scene units'],
  ['sector_map', 'Sector map', 'scene units'],
  ['sky_dome', 'Sky dome: the sun and moon', 'scene units'],
  ['solar_system', 'Solar system', 'scene units'],
  ['federation_map', 'Federation map', 'scene units'],
  ['starbase_approach', 'Starbase approach', 'scene units'],
  ['deep_space_nine', 'Deep Space 9', 'scene units'],
  ['bajoran_wormhole', 'Bajoran wormhole', 'scene units'],
  ['utopia_planitia', 'Utopia Planitia yards', 'scene units'],
  ['borg_encounter', 'Borg encounter', 'scene units'],
  ['true_scale_solar_system', 'Solar system (real positions)', 'km'],
  ['true_scale_dive', 'Galaxy to station at true scale', 'ly, a system in km'],
  ['star_trek_galaxy', 'Star Trek galaxy', 'ly'],
]" />

**Parts:**

<AstroStarterTiles :items="[
  ['planet', 'Planet with moons'],
  ['asteroid_belt', 'Asteroid belt'],
  ['asteroid', 'Asteroid'],
  ['comet', 'Comet'],
  ['nebula_field', 'Nebula field'],
  ['badlands', 'Badlands (Deep Space Nine)'],
  ['badlands_voyager', 'Badlands (Voyager)'],
  ['nexus', 'The Nexus'],
  ['crystalline-entity', 'Crystalline Entity'],
  ['wormhole', 'Wormhole'],
  ['sector_volumes', 'Sector volume set'],
  ['starbase', 'Starbase'],
  ['st_minor_powers', 'Star Trek: minor powers'],
  ['st_delta_powers', 'Star Trek: Delta Quadrant powers'],
  ['st_transwarp', 'Star Trek: Borg transwarp network'],
]" />

## The Studio

**The card editor opens the Astrometrics Studio: a full-screen editor beside the live scene, where you build the card in forms and on the scene itself.** In the dashboard's edit mode, edit the card and select **Open Astrometrics Studio**.

![The Astrometrics Studio: the Objects tab on the left with a grid and a sphere in the list, the live scene on the right with a box round the selected planet](/img/cards/astrometrics-studio.webp)

- It works on a copy: **Save** writes it to the card, **Cancel** leaves the card as it was. Every change can be undone (Ctrl+Z, Cmd+Z on a Mac).
- The preview is the real card with your entities, so what you see is what the dashboard shows. Taps on it select instead of running actions.
- The Studio writes the same YAML you would write by hand and keeps keys it has no field for, so anything can be finished in its YAML tab.

| Tab | What you do there |
|---|---|
| **Starters** | Try a scene or part in the preview, then keep it. The Studio opens here for a new card |
| **Scene** | Units, look, the scene date, warp, stars, background and label styles |
| **Objects** | Add objects from a gallery of every type, and edit each in a form |
| **Points** | Place points and give them labels, markers, entities and actions |
| **Camera** | Capture views, pick the start view, and set the controls, buttons and limits |
| **YAML** | The whole config, with completion from the card's schema |

::: details More about the Studio
- **On the scene:** tap a point or object to open its row; drag a point to move it (it slides along the object it stands on); **Place a point** in the toolbar adds one where you tap next.
- **Capture a view:** move the preview's camera where you want it and select **Capture view** in the Camera tab: its target, yaw, tilt and distance become a new named view.
- **Star systems:** a `system` row in the Objects tab has an **Open** button. The preview flies to it, and the Points, Objects and Starters tabs then edit the system, in its own units.
- **Following an entity:** a field with a link button can follow an entity instead of holding a number (see [Settings from entities](./data#settings-from-entities)).
- **Measure and units:** the toolbar can measure between two places, and the units of the open scene or system, with a scale bar, sit at the bottom right of the preview.
- **Prisms:** a prism's outline can be drawn and dragged on the preview.
:::

## Card options

**The astrometrics card's own top-level keys.** Each block has its own page; this table links to it.

- The card also takes the keys every LCARdS card takes (`id`, `tags`, `sounds`, `grid_options`, `width`, `min_height`, `max_height` ...): see [Common card properties](../common).
- Any number on a point or object can follow an entity (`opacity` from a sensor, say): see [Settings from entities](./data#settings-from-entities).
- The [config checker](/getting-started/config-checker) also checks what the schema cannot: that each point has exactly one position, and that every id a point, path, ring, beam or view names exists.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
look: diagram
time_scale: 0.5
camera:
  buttons: true
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 30
      distance: 140
backdrop:
  stars: true
objects:
  - type: sphere
    radius: 25
    image: builtin:earth_blue_marble
    spin: 10
    line_spacing_deg: 15
    color: var(--lcars-blue)
  - type: ring
    radius: 45
    dash: [6, 8]
```

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `height` | number / string | `400` | Card height, px or CSS. The scene fills the card. On a sections view the card takes the grid rows its height needs, so it never runs into the card below (`grid_options.rows` overrides) |
| `camera` | object | frames the scene | Views, controls, buttons, limits and fly-to timing: see [Camera and Views](./camera) |
| `points` | list | - | Named points with labels and markers: see [Points](./points) |
| `objects` | list | - | What is drawn: see [Objects](./objects) and [Effects](./effects) |
| `look` | string / object | `mixed` | `diagram`, `realistic` or `mixed`, or an entity naming one: see [Looks](./scene#looks-diagram-and-realistic) |
| `units` | string | - | What one scene unit is: `m`, `km`, `au`, `ly` or `pc`. See [Scale: units](./scale#units) |
| `clock` | object | - | The scene date and how fast it runs, for the real Solar System and the sky: see [The scene clock](./scale#the-scene-clock) |
| `time_scale` | number | `1` | How fast the scene's motion runs: `0.5` half speed, `0` still. See [Units and motion](./scene#units-and-motion) |
| `model_scale` | string | `real` | `real` or `visible`: how models at their real size start. See [Visible size](./objects/ships#visible-size) |
| `warp` | boolean / object | off | Go to warp: the stars stream past behind the scene. `true`, or an entity. See [Going to warp](./effects#going-to-warp) |
| `warp_factor` | number | `6` | How fast the stars stream at warp, `1` to `9.9` |
| `backdrop` | object | - | `stars` and `dust`: see [Backdrop](./scene#backdrop) and [Effects: warp and dust](./effects#warp-and-dust) |
| `background_animation` | list | - | Flat background effects behind the scene: see [background_animation](./scene#background-animation) |
| `labels` | object | - | `default`, `styles`, `overlap` and `snap` for every label: see [Labels](./scene#labels) |
| `rules` | list | - | Rules on the card, its points and its objects: see [Live data: rules](./data#rules) |
| `state_classification`, `triggers_update`, `data_sources` | | | For point entities and label templates: see [Live data](./data) |
| `variables` | object | - | Your own named values, for templates as `variables.<name>` |
