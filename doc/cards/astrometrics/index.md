---
description: "The LCARdS Astrometrics card (custom:lcards-astrometrics-card): 3D scenes in the style of the astrometrics lab and stellar cartography. Sector maps, galaxy discs, sky domes with the sun and moon, labelled points you tap to fly to."
---

# Astrometrics

`custom:lcards-astrometrics-card`

![Astrometrics card: a galaxy disc with bearing labels round its rim, the galactic core glowing yellow, Federation space as a blue see-through sector, Borg space as a green one, crossing beams and a small blue planet with its orbits](/img/cards/astrometrics.webp)

**A 3D scene in the style of the astrometrics lab and stellar cartography: a lettered sector map, a galaxy disc with territories, a planet with an away team on it, or the sky over your home with the sun and moon where they are now.** Drag to orbit, scroll or pinch to zoom, and tap a point to fly to it.

- **Objects** draw the scene (grids, planets, territories, routes, nebulas, ships), and **points** are the named places on it that labels, routes and the camera refer to by id.
- The camera orbits a target, and named views let a tap fly it from the galaxy to a planet and back.
- The scene draws only when something moves, so an idle card costs nothing, and every astrometrics card and WebGL background on a page shares one WebGL context.

::: tip Try it
- The card editor opens the [Astrometrics Studio](./start#the-studio): a full-screen editor with the live scene, where you tap, drag and place points, edit every object in a form, capture camera views and start from a starter.
- [Getting Started](./start) has a first card to copy and every starter with its picture.
:::

## How a scene is sized

**One card holds one scene, and every position, size and distance in it is in scene units: your own, or real ones you name.** Most scenes are built to fit; a true-scale scene uses the real numbers and can reach from a galaxy down to a station.

- **Scene units** are yours to pick: a disc of radius 100, planets 5 across. Nothing is to scale, and everything shows at once. This is the easy way, and most starters work like this.
- **Named units** (`units: ly`, `pc`, `au`, `km` or `m` on the card) say what one unit is, so real numbers come out right: a galaxy 100,000 light years across, a planet at its real distance, a model at its real size (a model's `length` is in metres and is converted to the scene's units).
- **A star system** (a `system` object placed at one of the scene's points) is a scene inside the scene, with units of its own: a galaxy in light years holds a solar system in km. As the camera flies close it switches to the system's units, so one card spans the whole range.
- **Screen sizes** (line widths, dashes, label and marker sizes) are in px, the same at any zoom. Every other length (`radius`, `size`, `line_spacing`, positions) is in scene units.

<AstroScaleDiagram />

[Scale](./scale) has the details: units, star systems, the real Solar System and the scene clock.

## Where to start

**Pick the starter closest to what you want and change it; it is quicker than an empty scene.** The Studio's Starters tab adds one with a few settings, and [Getting Started](./start#starters) shows them all with pictures.

| You want | Start with |
|---|---|
| A galaxy map with territories | [Galaxy with territories](./starters#galaxy-with-territories) (scene units), [Federation map](./starters#federation-map) (scene units), [Star Trek galaxy](./starters#star-trek-galaxy) (ly) |
| A sector map or tactical grid | [Sector map](./starters#sector-map) (scene units) |
| Planets and orbits | [Solar system](./starters#solar-system) (scene units), [Solar system (real positions)](./starters#solar-system-real-positions) (km, the planets where they are on the scene clock's date) |
| The sky over your home | [Sky dome: the sun and moon](./starters#sky-dome-the-sun-and-moon) (scene units; the sun and moon where they are now, from your Home Assistant location) |
| A ship or starbase close up | [Starbase approach](./starters#starbase-approach), [Deep Space 9](./starters#deep-space-9), [Utopia Planitia yards](./starters#utopia-planitia-yards), [Borg encounter](./starters#borg-encounter) (scene units) |
| From a galaxy down to a station | [Galaxy to station at true scale](./starters#galaxy-to-station-at-true-scale) (ly, with a solar system in km inside) |
| Something of your own | The [quick start](./start#quick-start): a grid and a few points (scene units) |

## Pages

| Page | Covers |
|------|--------|
| [Getting Started](./start) | A first card, the starters with pictures, and the card's own options |
| [Starters](./starters) | Every ready-made scene and part as a live card with its YAML |
| [Points](./points) | Named places: where they sit, labels, markers, actions, cards pinned to them |
| [Objects](./objects) | Which object type to use for what, and the keys every object takes |
| [Camera and Views](./camera) | Named views, controls, the on-card buttons, following a point, limits |
| [Scene and Looks](./scene) | Units and motion, the diagram and realistic looks, stars, background, labels |
| [Live Data](./data) | Points and settings that follow entities, templates, rules, a guided tour |
| [Effects](./effects) | Nebulas, scan bands, moving dashes, animated fills, warp and dust |
| [Scale](./scale) | Real units, star systems in their own units, the real Solar System and the scene clock |
| [Your Own Models](./models) | Ships and stations from your own glTF files |
