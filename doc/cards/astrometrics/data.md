---
description: "Astrometrics card live data: points with their own entity, positions from entity attributes (a phone on a globe, the sun on a dome), label templates with sky values, and rules that recolour, relabel, hide or move points and objects."
---

# Live data

Points take their text, colour and even their position from Home Assistant, and rules change points and objects as entities change. None of it rebuilds the scene: a label or a colour changes in place, a point moves on the next frame.

## A point's entity

`entity` on a point is that point's own entity:

- its label [templates](#templates) read it as `entity` (`{entity.state}`, `{entity.attributes.friendly_name}`),
- colour [state maps](/core/colours) on the point and its text fields follow its state (with the card's `state_classification`),
- `more-info` and `toggle` actions without an `entity` act on it,
- a [position](#positions-from-entities) can come from its attributes.

```yaml live
type: custom:lcards-astrometrics-card
height: 280
camera:
  views:
    top: { target: [0, 0, 0], tilt: 70, distance: 120 }
points:
  - id: lamp
    entity: switch.demo_switch
    xyz: [-20, 0, 0]
    marker: square
    style: major
    color: { active: var(--lcars-orange), inactive: var(--lcars-gray) }
    text:
      label: { content: "{entity.attributes.friendly_name}" }
      state: { content: "{entity.state}", position: bottom-right, font_size: 11 }
    tap_action: { action: toggle }
objects:
  - { type: grid, shape: plane, size: 100, line_spacing: 10 }
```

## Positions from entities

`xyz`, `polar`, `latlon` and `altaz` take numbers, or `{ entity }` to read them from an entity's attributes. The point moves when they change (paths, rings and beams that use it follow), and is hidden while one is missing or not a number. `entity` defaults to the point's own.

| Form | Reads (default attribute names) | Change them with |
|---|---|---|
| `latlon: { entity }` | `latitude`, `longitude` (a person, a device tracker, a zone) | `latitude:`, `longitude:` |
| `altaz: { entity }` | `azimuth`, `elevation` (`sun.sun`) | `azimuth:`, `altitude:` |
| `xyz: { entity }` | `x`, `y`, `z` | `attributes:` three attribute names |
| `polar: { entity }` | `distance`, `bearing` | `attributes: [distance, bearing]` |

`state` as an attribute name reads the entity's state.

```yaml
points:
  # A phone on a globe, labelled with its owner and state
  - id: phone
    entity: device_tracker.phone
    latlon: { entity: device_tracker.phone }
    object: earth
    marker: reticle
    text:
      label: { content: "{entity.attributes.friendly_name}" }
      where: { content: "{entity.state}", position: bottom-right, font_size: 10 }
  # The sun from sun.sun on a sky dome
  - { id: sun, altaz: { entity: sun.sun }, object: sky, marker: dot, label: SOL }
  # A probe whose distance and bearing are two sensors' worth of attributes
  - id: probe
    entity: sensor.probe_track
    polar: { attributes: [range, heading] }
    marker: diamond
    label: PROBE
objects:
  - { type: sphere, id: earth, radius: 30, image: builtin:earth_blue_marble }
  - { type: grid, id: sky, shape: dome, radius: 80 }
```

## Templates

Label `content` takes the four [template types](/core/templates/) as on every card: `{entity.state}` tokens, `[[[ JavaScript ]]]`, `{{ Jinja2 }}` (evaluated by Home Assistant) and `{ds:name}` [data sources](/core/datasources/). A template is evaluated again only when something it reads changes: its entities, a data source, or the sky.

Besides `entity`, `states`, `config`, `variables` and `theme`, label templates have:

| Name | What it is |
|---|---|
| `sky.sun.azimuth`, `sky.sun.altitude` | The sun now, degrees to one decimal (from `sun.sun` when it exists). |
| `sky.moon.azimuth`, `sky.moon.altitude` | The moon now, degrees to one decimal (computed from the time and your location). |
| `sky.moon.illumination` | How much of the moon is lit, whole percent. |
| `sky.moon.waxing` | `true` while it grows. |
| `point` | The point's own config (`{point.id}`). |

The sky values update every minute. They work in all four types: `{sky.moon.illumination}`, `[[[ return Math.round(sky.sun.altitude) ]]]`, `{{ sky.moon.illumination }}`.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    sky: { target: [0, 20, 0], yaw: 180, tilt: 20, distance: 190 }
points:
  - { id: sun, sky: sun, object: dome, marker: dot, label: "SOL {sky.sun.altitude}°", color: var(--lcars-yellow) }
  - { id: moon, sky: moon, object: dome, marker: moon_phase, label: "LUNA {sky.moon.illumination}%" }
objects:
  - { type: grid, id: dome, shape: dome, radius: 80, line_spacing_deg: 15 }
```

For whole degrees, round in JavaScript: `[[[ return 'SOL ' + Math.round(sky.sun.altitude) + '°' ]]]`.

## Settings from entities

Any number on a point or object can follow an entity instead of holding still: a shield bubble's opacity follows the shields, a wormhole's glow follows the power. Write the key as `{ entity, to }`:

```yaml
type: custom:lcards-astrometrics-card
objects:
  - type: sphere
    id: shields
    radius: 30
    fill_color: var(--lcars-blue)
    # shields 0 to 100 % gives an opacity of 0 to 0.6
    opacity: { entity: input_number.lcards_test_shields, to: [0, 0.6] }
  - type: glow
    id: core
    # power 0 to 100 % gives a glow 10 to 60 across, easing over 1 s
    size: { entity: input_number.lcards_test_power, range: [0, 100], to: [10, 60], smooth: 1000 }
```

| Key | What it does |
|---|---|
| `entity` | The entity to follow. |
| `attribute` | Read this attribute instead of the state. |
| `range` | `[low, high]` of the entity's value. Default the entity's `min` and `max` (an `input_number`), else 0 to 100. |
| `to` | `[low, high]` of the setting the range maps to. Leave it out to use the entity's number as it is. |
| `smooth` | How long a change eases, ms (default 600; `0` steps). |

- **Clamped:** a value outside `range` stays at the end of `to`.
- **No value** (unavailable, not a number): the key's default.
- **Templates** work too: `spin: "[[[ return states['input_number.lcards_test_power'].state / 10 ]]]"`, or `{{ }}` and `{entity.state}`.
- **What changes in place:** an object's `opacity`, `radius`, `size` and `spin` ease to their new value without rebuilding anything. Any other key (a deformation's `amplitude`, a belt's `count`, a point's `alt`) rebuilds that one object or point, at most four times a second, and steps.
- **Whole numbers:** how-many settings (a belt's `count`, a galaxy's `arms` and `stars`, a nebula's `cloud_count`, a wobble's `lobes`, a polar grid's `spoke_count`, `num_octaves`, `major_row_interval` and `major_col_interval`) take the mapped value rounded, so `count: { entity: input_number.lcards_test_power, to: [100, 500] }` gives 233 rocks at 33.3 %, and the object rebuilds only when the whole number changes. Seeds do not follow entities.
- **On the card:** `time_scale`, `clock.rate` and `clock.date` follow entities the same way (`clock: { date: { entity: input_datetime.lcards_test_date } }` shows the planets on the date in a helper). Positions follow entities their own way: see [Positions from entities](#positions-from-entities).
- Pairs and lists (`[x, y, z]`, `rotation`) and whole numbers (`count`, `spoke_count`) do not follow entities yet.

### A guided tour

`camera.view` can follow an entity: the camera flies to `views[n]` when the entity's value is `n` (counting from 0), or to the view an `input_select`'s option names. A stop can set the [scene clock](./scale#the-scene-clock) too:

```yaml
type: custom:lcards-astrometrics-card
camera:
  view:
    entity: input_number.lcards_test_stage
    views: [galaxy, sol, { view: earth, date: now, rate: 0 }, { view: jupiter, rate: 1 }]
  views:
    galaxy: { target: [0, 0, 0], yaw: 20, tilt: 35, distance: 400 }
    sol: { target: [0, 0, 0], yaw: 40, tilt: 35, distance: 120 }
    earth: { target: [0, 0, 0], yaw: 225, tilt: 12, distance: 30 }
    jupiter: { target: [0, 0, 0], yaw: 200, tilt: 10, distance: 60 }
```

Step the number from an automation, a script or buttons (`input_number.increment`), and the card flies from stop to stop.

## Rules

Points and objects with an `id` are [rule](/core/rules/) targets, as MSD overlays are. A rule's `apply.overlays` patches them with their own keys:

```yaml
rules:
  - id: red_alert_contacts
    when: { entity: binary_sensor.intruder, state: "on" }
    apply:
      overlays:
        warbird: { style: hostile, label: HOSTILE CONTACT }   # a point
        "tag:patrol": { color: var(--lcars-alert-red) }      # every point or object tagged patrol
        neutral_zone: { visible: false }                     # an object
```

- **Selectors:** an id, `tag:<name>` (points and objects take `tags`), `type:astrometrics-point` or `type:astrometrics-object`, `pattern:<regex>`, `all`.
- **Points** take `label`, `text`, `style`, `color`, `marker`, `priority`, `visible`, `opacity` and the placement forms (a rule can move a point). A patched label is rebuilt on its own; the rest of the scene stays.
- **Objects** take any of their keys: `visible` shows or hides the object, anything else (a colour, an opacity, a size) builds that object again, nothing else.
- MSD-style patches work too: `{ style: { color: red } }` patches the colour. A plain string `style` is the label style.
- When the rule stops matching, the point or object goes back to its config.

Ids are page-wide: two cards with a point `sol` both match a rule on `sol`. Use distinct ids, or tags, when a dashboard has several astrometrics or MSD cards.

## Fly-to from other cards and automations

Give the astrometrics card an `id`, then any LCARdS card can fly its camera with a `fly-to` action naming it in `card`, with a `view` or a `point`:

```yaml
type: custom:lcards-button
preset: lozenge
text:
  name: { content: EARTH, show: true }
tap_action:
  action: fly-to
  card: galaxy          # the astrometrics card's id
  point: earth          # or view: <a camera view>
  duration: 2500        # optional, ms
```

The camera of every open card with that id flies, in the same browser. From an automation use the [`lcards.fly_to`](/configuration/ha-actions#lcards-fly-to) action, which reaches every open dashboard (or only the devices and users you target).

In the browser console, `window.lcards.cards.astrometrics` has `getAll()`, `get(id)` and `flyTo(id, view or { point }, { duration })`.

