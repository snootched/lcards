---
description: "Astrometrics card camera: named views to fly between, the view the card opens on, mouse, touch and key controls, the on-card D-pad and time slider, following a moving point, limits, fly-to timing and auto-rotate."
---

# Camera and Views

**The camera orbits a target, and named views let a tap fly it from one place in the scene to another.** Four numbers place it: `yaw` (the way it faces: `0` faces north), `tilt` (how high above the target), `distance` and `fov` (the field of view).

- Bearings are degrees clockwise from north, as on a compass seen from above, and north is away from the camera in the default view: `yaw: 0` looks north, `yaw: 90` looks east.
- Fly between views with a `tap_action` on a point or object (`action: fly-to`, see [Points: actions](./points#actions)), or from other cards and automations ([Live data: fly-to](./data#fly-to-from-other-cards-and-automations)).
- In the [Astrometrics Studio](./start#the-studio)'s Camera tab, move the preview's camera and select **Capture view** to write a view where the camera is.

## camera.views

**Named views of the scene, and the one the card opens on.** A view is a target and the numbers that place the camera round it; `camera.view` names the view shown first.

- `target` is a point id or `[x, y, z]`. When the target is a point that moves, the camera [follows it](#following-a-point).
- The view the card opens on faces north at a tilt of 35 when it leaves out `yaw` and `tilt`, and frames the whole scene when it leaves out `distance`. A view flown to later keeps the camera's current numbers for any key it leaves out.
- With no views at all, the camera frames the whole scene from a bearing of 20 and a tilt of 35.
- `projection: orthographic` removes the perspective, for a flat map; `distance` then sets the zoom.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  view: galaxy
  views:
    galaxy:
      target: core
      yaw: 20
      tilt: 35
      distance: 260
    # straight down, without perspective
    map:
      target: core
      tilt: 90
      distance: 300
      projection: orthographic
backdrop:
  stars: true
points:
  - id: core
    xyz: [0, 0, 0]
    label: GALACTIC CORE
    style: title
  - id: to_map
    polar: [45, 300]
    marker: reticle
    label: MAP VIEW
    tap_action:
      action: fly-to
      view: map
  - id: to_galaxy
    polar: [45, 120]
    marker: reticle
    label: GALAXY VIEW
    tap_action:
      action: fly-to
      view: galaxy
objects:
  - type: grid
    shape: disc
    radius: 100
    pattern: polar
    line_spacing: 10
    spoke_count: 36
```

::: details More about views
- **Wide cards:** on a card wider than 2:1 the field of view narrows, so the view is never wider than on a 2:1 card; a very wide angle would stretch planets near the sides out of shape. A wide, short card therefore shows the scene closer: move `distance` back to fit more in.
- **Distances in a system:** a view's `distance` is in its target's units, so a view of a station inside a [star system](./scale#star-systems) in km is a few km away. A view with an `[x, y, z]` target is in scene units.
- **A guided tour:** `camera.view` can follow an entity instead of naming a view, so a slider or a select flies the camera from stop to stop. See [Live data: a guided tour](./data#a-guided-tour).
- **In the Studio:** a captured view writes the target as a point's id when the camera looks at a point (after flying to it), else as coordinates. Each view flies, renames (actions that fly to it follow the new name), reorders and becomes the start view with **Start here**.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `camera.view` | string / object | the first view | The view the card opens on. Or a [guided tour](./data#a-guided-tour): `entity` and its stops |
| `camera.views` | object | - | Your views, by name |
| `camera.views.<name>.target` | id / `[x, y, z]` | the scene's centre | What the camera looks at. A view flown to later keeps the current target when it leaves this out |
| `camera.views.<name>.yaw` | number | `0` | The way the camera faces, degrees: `0` faces north, `90` east |
| `camera.views.<name>.tilt` | number | `35` | The camera's height angle, degrees: `0` level with the target, `90` straight down. `-90` to `90` |
| `camera.views.<name>.distance` | number | frames the scene | Distance from the target, in the target's units. With `projection: orthographic`, the zoom |
| `camera.views.<name>.fov` | number | `40` | Vertical field of view, degrees, perspective only. Held between `5` and `150` |
| `camera.views.<name>.projection` | string | `perspective` | `perspective`: far things look smaller. `orthographic`: no perspective, a flat map |
| `camera.views.<name>.warp` | boolean | `camera.warp` | Stars and dust streak while the camera flies here ([warp](./effects#warp-and-dust)) |

## Controls

**Drag to orbit, pan and zoom with a mouse, a touchpad, a touch screen or the keys.** These keys change what each gesture does, or turn the controls off.

| To | Mouse | Touchpad | Touch screen | Keys (card focused) |
|---|---|---|---|---|
| Orbit round the target | Drag | Click and drag, or shift + two-finger swipe | Drag one finger | Shift + arrows |
| Pan | Shift-drag, right-drag or middle-drag | Two-finger swipe | Two fingers | Arrows |
| Zoom | Wheel, toward the pointer | Pinch, toward the pointer | Pinch | `+` / `-` |
| Fly forward or back (camera and target together, so you travel through the scene; slower near a planet, model or cube, so you never fly into it) | | | | `W` / `S`, `Page Up` / `Page Down` |
| Draw small models larger, or at their [real size](./objects/ships#real-size) again | | | | `V` |
| Fly in toward a spot | Double-click blank space (shift: out) | Double-tap blank space | Double-tap blank space | |
| Fly to a point and follow it | Click the point or its label | Tap the point or its label | Tap the point or its label | |
| Fly in close to what stands at a point (a station, a ship, a planet) | Double-click the point or its label | Double-tap it | Double-tap it | |
| Let go of a followed point | Click blank space | Tap blank space | Tap blank space | |
| Back to the start view | | | | `Home` |

- `drag: pan` swaps orbit and pan for a one-finger or left-button drag. With `limits.tilt` locked to one value (`[90, 90]`), a drag always pans, as on a map.
- Pan moves along the screen by default, so a side view pans up and down and a top view pans across the map. `pan: ground` keeps the target at its height.
- `controls: false` turns off dragging, zooming, double-tap and keys, and leaves the camera to fly-to actions, `auto_rotate` and the [on-card buttons](#camera-buttons).

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  # a one-finger drag moves across the map
  drag: pan
  pan: ground
  # each zoom step is a smaller change
  zoom_step: 1.5
  double_tap: none
  views:
    v:
      target: [0, 0, 0]
      yaw: 0
      tilt: 55
      distance: 220
objects:
  - type: grid
    shape: plane
    size: 200
    line_spacing: 20
    color: var(--lcars-blue)
  - type: ring
    radius: 40
    color: var(--lcars-orange)
```

::: details More about controls
- **Touchpad or mouse wheel:** both send the same wheel events, so the card tells them apart by the events (a wheel moves in whole steps, a two-finger swipe in small ones and sideways too). A swipe pans, a mouse wheel zooms, and a pinch always zooms. If your mouse has a smooth wheel that pans instead, set `wheel: zoom`; `wheel: pan` makes every wheel event pan.
- **Double-tap on a point:** on a point without a `tap_action` of its own, or with a `fly-to`, a double-tap flies in close: to a few times the size of the largest object standing at the point, or much closer than now when nothing stands there. A station a few km across seen from the far side of its planet is a double-tap away.
- **Taps on points and objects** whose `tap_action` is another action run it on each tap; `double_tap` never changes that.
- **The on-card buttons** do the same as the keys; press and hold keeps moving.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `camera.controls` | boolean | `true` | Drag, zoom, double-tap and keys. `false`: the camera moves only by fly-to, `auto_rotate` and the buttons |
| `camera.drag` | string | `orbit` | What a one-finger or left-button drag does: `orbit` (shift or the right button pans) or `pan` (shift or the right button orbits). A middle-button drag always pans |
| `camera.pan` | string | `screen` | `screen`: pan along the screen. `ground`: across the ground plane, the target keeps its height |
| `camera.wheel` | string | `auto` | `auto`: a mouse wheel zooms and a touchpad swipe pans. `zoom`: every wheel event zooms. `pan`: every wheel event pans |
| `camera.zoom_to` | string | `cursor` | Where the wheel and pinch zoom toward: `cursor` (the spot under the pointer stays put) or `target` (straight in and out) |
| `camera.zoom_step` | number | `2` | Distance factor of one zoom step (double-tap, zoom buttons, `+` and `-`). `2` halves the distance. More than `1` |
| `camera.double_tap` | string | `zoom` | `zoom`: a double-tap flies in toward the spot, or close to a point. `none`: nothing |

## Following a point

**After the camera flies to a point, it stays on the point while the point moves:** a ship on its orbit, a planet round its star, a phone placed from its entity.

- Any fly-to that lands on a point starts it: a tap on the point, a `fly-to` action, a view whose `target` is the point, a fly-to from another card or an automation.
- Orbit and zoom work round the point as usual, and the wheel and pinch zoom straight in on it rather than toward the pointer. A pan or a fly forward or back keeps following, offset from the point, so a planet on a fast [scene clock](./scale#the-scene-clock) does not race out of view.
- A double-tap, a tap on blank space or a fly-to somewhere else lets go, and the point is no longer highlighted.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  follow: true
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 35
      distance: 140
points:
  - id: sun
    xyz: [0, 0, 0]
    label: SUN
    style: major
  # tap the ship: the camera flies to it and rides along
  - id: ship
    polar: [45, 0]
    object: orbit
    marker: dot
    label: TAP TO FOLLOW
objects:
  - type: glow
    at: sun
    size: 30
    color: var(--lcars-yellow)
  - type: ring
    id: orbit
    radius: 45
    spin: 15
    width: 1
    opacity: 0.4
```

::: details More about following
- **Objects on a moving point:** a fly-to an object standing on a moving point (`at: <point id>`: a comet on its orbit, a ship model on a moving point) flies to the point and follows it the same way, in the card and in the Studio's preview. Dragging a point in the Studio lets go first.
- **Points that stand still** are not affected.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `camera.follow` | boolean | `true` | Keep a point at the centre while it moves, after a fly-to lands on it. `false`: the camera stays where it landed |

## camera.buttons

**An LCARdS D-pad on the card that moves the camera, with a time slider under it.** It does what the keys do, so a touch screen without a keyboard can pan, zoom and fly forward too.

- The arms pan, the centre flies back to the start view, the left corners zoom in (top) and out (bottom), and the right corners fly forward (top) and back (bottom). Press and hold keeps moving.
- It takes the D-pad colours of your theme (the `components.dpad` theme tokens, as on a button with `component: dpad`), so it follows HA-LCARS and alert modes.
- The buttons fade out after three seconds without input on the card and come back when the pointer moves over it, on a touch or a key (`hide: idle`).
- `buttons: true` shows all of them in the bottom right.

```yaml live
type: custom:lcards-astrometrics-card
height: 360
camera:
  buttons:
    position: bottom-right
    size: 150
    hide: never
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 35
      distance: 150
backdrop:
  stars: true
points:
  - id: sun
    xyz: [0, 0, 0]
    label: SUN
    style: major
objects:
  - type: glow
    at: sun
    size: 30
    color: var(--lcars-yellow)
  - type: ring
    radius: 50
    spin: 10
    dash: [6, 8]
    color: var(--lcars-blue)
```

::: details More about the buttons
- **The time slider** slows the scene's motion (orbits, spins, drift) down to a tenth, holds it, or speeds it up to four times, so a fast ship is easy to tap. It changes the view only; `time_scale` on the card sets the speed it starts at ([Scene and Looks](./scene#units-and-motion)).
- **The date slider:** on a card with a [clock](./scale#the-scene-clock), the slider can set the scene date's rate instead: a year, a month or a day a second backward, paused, live, then an hour, a day, a month or a year a second forward, with the date above it and NOW to go back to today. The clock button beside it switches between the two sliders.
- **The size button** shows under the pad while a model is drawn at its [real size](./objects/ships#real-size): REAL SIZE keeps models in proportion, VISIBLE SIZE draws each small one at least 40 px across (the `V` key does the same). It changes the view only.
- **Off parts:** `pan`, `zoom`, `travel` or `reset: false` dims those parts of the pad and turns them off.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `camera.buttons` | boolean / object | off | `true` for every button in the bottom right, or the keys below |
| `camera.buttons.position` | string | `bottom-right` | Where they sit: `top-left`, `top-center`, `top-right`, `center-left`, `center`, `center-right`, `bottom-left`, `bottom-center` or `bottom-right` |
| `camera.buttons.size` | number | `180` | How big the D-pad is, px across, `64` to `320` |
| `camera.buttons.pan` | boolean | `true` | The arms pan. `false`: dimmed and off |
| `camera.buttons.zoom` | boolean | `true` | The left corners zoom. `false`: dimmed and off |
| `camera.buttons.travel` | boolean | `true` | The right corners fly forward and back, as `W` and `S`. `false`: dimmed and off |
| `camera.buttons.reset` | boolean | `true` | The centre flies back to the start view. `false`: dimmed and off |
| `camera.buttons.scale` | boolean | `true` | The model size button, shown while a model is at its real size. `false` hides it |
| `camera.buttons.time` | boolean / string | `true` | The time slider. `speed`: the motion's speed. `date`: the scene clock's rate. `both`: either, with a switch. `true`: both on a card with a `clock`, else speed. `false` hides it |
| `camera.buttons.hide` | string | `idle` | `idle`: fade out after three seconds without input. `never`: always shown. `toggle`: a small button folds them away and back |

## camera.limits

**Where drag and zoom stop: how low and high the camera may tilt, how near and far it may go, and where the point it looks at may wander.**

- A tilt range of one value (`[90, 90]`) locks the tilt, and a one-finger drag then pans, as on a map.
- The point the camera looks at stays inside a sphere 1.5 times the size of the scene, so panning cannot lose it. Set your own sphere (`radius`, optional `center`) or box (`x`, `y`, `z` ranges; an axis left out is free), or `false` for none.
- Limits are in scene units, also while the camera is inside a [star system](./scale#star-systems).

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  # a flat map: straight down, panning stays over the grid
  limits:
    tilt: [90, 90]
    distance: [80, 400]
    target:
      x: [-100, 100]
      z: [-100, 100]
  views:
    map:
      target: [0, 0, 0]
      tilt: 90
      distance: 260
objects:
  - type: grid
    shape: plane
    size: 200
    line_spacing: 20
    color: var(--lcars-blue)
```

| Key | Type | Default | Description |
|---|---|---|---|
| `camera.limits.tilt` | `[min, max]` | `[-90, 90]` | Lowest and highest tilt, degrees |
| `camera.limits.distance` | `[min, max]` | `[1, 100000]` | Nearest and farthest distance, scene units. A scene at true scale widens it: down to half its smallest object, out to 20 times its size |
| `camera.limits.yaw` | `[min, max]` | no limit | Yaw range, degrees |
| `camera.limits.target` | object / `false` | a sphere 1.5 times the scene | Where the point the camera looks at may go. `false`: anywhere |
| `camera.limits.target.radius` | number | - | A sphere this big, scene units |
| `camera.limits.target.center` | `[x, y, z]` | the scene's centre | The sphere's centre |
| `camera.limits.target.x` | `[min, max]` | free | A box: its x range. Also `y` and `z` |

## Flying and turning

**How long a fly-to takes, how it eases, whether the stars streak on the way, and a camera that turns on its own.**

- A fly-to over a long zoom moves evenly in log distance, so each factor of ten takes the same time ([Scale](./scale#one-scene-in-real-units)).
- `camera.warp` streaks the stars and dust on every fly-to; a view's own `warp` wins. The card's `warp` key is different: it holds the scene at warp ([Effects: going to warp](./effects#going-to-warp)).
- `auto_rotate` pauses while you drag. Under reduced motion it stops, and a fly-to jumps instead of flying, without streaks.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  auto_rotate: 4
  fly_duration: 2500
  ease: outQuad
  warp: true
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 30
      distance: 200
backdrop:
  stars:
    count: 2500
points:
  - id: core
    xyz: [0, 0, 0]
    label: CORE
    style: major
  - id: outpost
    polar: [70, 120]
    marker: diamond
    label: TAP TO FLY
objects:
  - type: grid
    shape: disc
    radius: 90
    pattern: polar
    line_spacing: 15
    spoke_count: 24
  - type: glow
    at: core
    size: 40
```

| Key | Type | Default | Description |
|---|---|---|---|
| `camera.fly_duration` | number | `1600` | How long a fly-to takes, ms |
| `camera.ease` | string | `inOutCubic` | The fly-to's easing: an anime.js easing name such as `inOutCubic`, `outQuad` or `linear` |
| `camera.warp` | boolean / object | `false` | Every fly-to streaks the stars and dust. Or `entity` (and `attribute`): fly-tos streak while it is on (`on`, `true` or a number above 0) |
| `camera.auto_rotate` | number | `0` | Turn round the target, degrees per second; negative turns the other way. `0` is off |
