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
- **Studio:** the card editor opens the [Astrometrics Studio](./studio), a full-screen editor with the live scene: tap, drag and place points on it, edit every object in a form, capture camera views, and start from a [starter](./starters).
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

## Starters

Rather than start from an empty scene, start from a [starter](./starters) and change it. Starters are ready-made **scenes** (a galaxy with territories, a sector map, the sky dome with the sun and moon, a solar system, a Federation map, a starbase approach) and **parts** to add to a scene (a planet with moons, an asteroid belt, a nebula field, a set of territories). The Studio's Starters tab copies one into your card; the [Starters](./starters) page shows each one as a live card with its YAML.

## Camera and views

The camera orbits a target. Four numbers place it: `yaw` (the bearing it looks from: 0 looks north, 90 looks east), `tilt` (0 is level with the target, 90 is straight down), `distance` and `fov` (the vertical field of view, default 40 degrees). On a card wider than 2:1 the field of view narrows so the view is never wider than on a 2:1 card: a very wide angle would stretch planets near the sides out of shape. A wide, short card therefore shows the scene closer; move `distance` back to fit more in. A view is a named set of them:

```yaml
camera:
  view: galaxy                # shown first (default: the first view)
  views:
    galaxy: { target: core, yaw: 20, tilt: 35, distance: 280 }
    map: { target: core, tilt: 90, distance: 300, projection: orthographic }
  controls: true              # drag, zoom, double-tap, keys (default true)
  buttons: true               # on-card pan, zoom and reset buttons, fade when idle (default off)
  follow: true                # stay on a moving point after flying to it (default true)
  limits: { tilt: [5, 90], distance: [20, 800] }
  auto_rotate: 2              # degrees per second (0 = off)
  fly_duration: 1600          # ms
  ease: inOutCubic
  warp: false                 # stars streak on every fly-to (or warp: true in one view)
```

- `target` is a point id (the camera [follows the point](#following-a-point) if it moves) or `[x, y, z]`.
- A view without `yaw` faces north. With no views at all the camera frames the whole scene.
- `projection: orthographic` removes the perspective (a flat map); `distance` then sets the zoom.
- Fly between views with a `tap_action` on a point or object: `{ action: fly-to, view: map }` (see [Points: actions](./points#actions)), or from other cards and automations ([Live data: fly-to](./data#fly-to-from-other-cards-and-automations)).
- In the [Astrometrics Studio](./studio#camera-views)'s Camera tab, move the preview's camera and **Capture view** to write a view where it is: the target is written as a point's id when the camera looks at a point (after flying to it), else as coordinates. Each view flies, renames (actions that fly to it follow the new name), reorders and becomes the start view with **Start here**.

### Controls

| To | Mouse | Touchpad | Touch screen | Keys (card focused) |
|---|---|---|---|---|
| Orbit round the target | Drag | Click and drag, or shift + two-finger swipe | Drag one finger | Shift + arrows |
| Pan | Shift-drag, right-drag or middle-drag | Two-finger swipe | Two fingers | Arrows |
| Zoom | Wheel, toward the pointer | Pinch, toward the pointer | Pinch | `+` / `-` |
| Fly in toward a spot | Double-click blank space (shift: out) | Double-tap blank space | Double-tap blank space | |
| Fly to a point and follow it | Click the point or its label | Tap the point or its label | Tap the point or its label | |
| Let go of a followed point | Pan, or click blank space | Pan, or tap blank space | Pan, or tap blank space | Arrows |
| Back to the start view | | | | `Home` |

`drag: pan` swaps orbit and pan for a one-finger or left-button drag, and with `limits.tilt` locked to one value a drag always pans (a map). The on-card `buttons` do the same as the keys (pan arrows, zoom, reset); press and hold keeps moving.

Taps on points and on objects with a `tap_action` are never a double-tap: they run their action each time.

```yaml
camera:
  drag: orbit            # or pan: a one-finger drag moves the view
  pan: screen            # or ground: panning stays on the ground plane
  wheel: auto            # or zoom (every wheel event zooms), pan (every wheel event pans)
  zoom_to: cursor        # or target
  zoom_step: 2           # each step halves (or doubles) the distance
  double_tap: zoom       # or none
  follow: true           # or false: the camera stays where a fly-to lands
  buttons: { position: bottom-right, pan: true, zoom: true, reset: true, time: true, hide: idle }
  limits:
    target: { radius: 300 }   # or a box { x: [a, b], z: [a, b] }, or false
```

- **Pan** moves along the screen by default, so a side view pans up and down and a top view pans across the map. `pan: ground` keeps the target on its height.
- **Touchpad or mouse wheel:** both send the same wheel events, so the card tells them apart by the events (a wheel moves in whole steps, a two-finger swipe in small ones and sideways too). A swipe pans, a mouse wheel zooms, and a pinch always zooms. If your mouse has a smooth wheel that pans instead, set `wheel: zoom`; `wheel: pan` makes every wheel event pan.
- **Target limit:** the point the camera looks at stays inside a sphere 1.5 times the size of the scene, so panning cannot lose it. Set your own sphere (`radius`, optional `center`) or box, or `false` for none.
- **Time slider:** under the buttons, it slows the scene's motion (orbits, spins, drift) down to a tenth, holds it, or speeds it up to four times, so a fast ship is easy to tap. It changes the view only; `time_scale` on the card sets the speed it starts at (`0.5` half speed, `0` still). `time: false` hides it.
- **Buttons** fade out after three seconds without input on the card and come back when the pointer moves over it, on a touch or a key (`hide: idle`). `hide: toggle` adds a small button that folds them away and back; `hide: never` keeps them shown.
- `controls: false` turns off dragging, zooming, double-tap and keys, and leaves the camera to fly-to actions, `auto_rotate` and the buttons.

### Following a point

After a fly-to lands on a point (a tap on it, a `fly-to` action, a view whose `target` is the point, a fly-to from another card or an automation), the camera stays on the point while it moves: a ship on its orbit, a planet round its star, a phone placed from its entity. Orbit and zoom work round it as usual, and the wheel and pinch zoom straight in on the point rather than toward the pointer. A pan, a double-tap, a tap on blank space or a fly-to somewhere else lets go; the point stays selected. A point that does not move is not affected. `follow: false` turns it off.

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
| `time_scale` | How fast the scene's motion runs (default 1; 0.5 half speed, 0 still). The sky and the camera are not affected ([Controls](#controls)) |
| `units` | What one scene unit is: `m`, `km`, `au`, `ly` or `pc` (optional; a [star system](./scale#star-systems) needs it to give its own) |
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

## True scale

Scene units can be real ones: a solar system in km, a galaxy in light years with Sol in km inside it as a [`system`](./objects#system). The card holds the whole range, from a galaxy down to a station 1.5 km across. See [Scale](./scale).

## Performance and motion

- **Render on demand:** the scene draws when the camera moves, a fly-to runs, an object spins or an [effect](./effects) moves, the sky timer ticks or the theme changes. A still scene draws nothing. Off screen and in a hidden tab nothing draws.
- **One WebGL context** for every astrometrics card and WebGL background on the page.
- **Models:** measured on an Intel Arc laptop GPU at 1300 x 866 px, the scene with the built-in ship draws in about 1.5 ms a frame; the depth image that hides labels behind it adds about 0.2 ms, only while something moves. See [model](./objects#model).
- **Reduced motion** (the system setting): spin, `auto_rotate`, [deformations](./objects#deformed-grids) and every [effect](./effects) (drift, scans, moving dashes, fills) stop, and fly-to jumps instead of flying (no warp streaks).
- **Alert modes** recolour the scene; labels follow the palette at once.

## When the 3D view is unavailable

The card shows **3D VIEW UNAVAILABLE** with the reason when the browser has no WebGL, or when the graphics context was lost (a GPU reset, too many WebGL pages). Reloading the page starts it again.
