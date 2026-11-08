---
description: "Astrometrics card live data: points with their own entity, positions from entity attributes (a phone on a globe, the sun on a dome), label templates with sky values, settings and colours from entities, guided tours, rules that recolour, relabel, hide or move points and objects, and fly-to from other cards and automations."
---

# Live Data

Points take their text, colour and even their position from Home Assistant, and rules change points and objects as entities change. None of it rebuilds the scene: a label or a colour changes in place, a point moves on the next frame.

## A point's entity

**`entity` on a point is that point's own entity: its label templates read it, its colour maps follow its state, and its actions act on it.** Use it for a point that stands for a device: a light, a switch, a phone.

- Label [templates](#templates) read it as `entity` (`{entity.state}`, `{entity.attributes.friendly_name}`).
- Colour [state maps](/core/colours) on the point and its text fields follow its state, with the card's `state_classification`.
- `more-info` and `toggle` actions without an `entity` act on it, and a [position](#positions-from-entities) can come from its attributes.

```yaml live controls
type: custom:lcards-astrometrics-card
height: 280
camera:
  views:
    top:
      target: [0, 0, 0]
      tilt: 70
      distance: 120
points:
  - id: lamp
    entity: switch.demo_switch
    xyz: [-20, 0, 0]
    marker: square
    style: major
    # follows the switch: tap to toggle it
    color:
      active: var(--lcars-orange)
      inactive: var(--lcars-blue)
    text:
      label:
        content: "{entity.attributes.friendly_name}"
      state:
        content: "{entity.state}"
        position: bottom-right
        font_size: 11
    tap_action:
      action: toggle
objects:
  - type: grid
    shape: plane
    size: 100
    line_spacing: 10
```

| Key | Type | Default | Description |
|---|---|---|---|
| `entity` | string | - | The point's entity: templates read it, state colour maps follow it, `more-info` and `toggle` act on it, positions can come from it |
| `color` | colour / state map | by style | The point's colour, a state map by this entity: see [Markers](./points#markers) |

## Positions from entities

**`xyz`, `polar`, `latlon` and `altaz` take numbers, or `entity` to read them from an entity's attributes: a phone on a globe, the sun on a sky dome.** The point moves when they change, and paths, rings and beams that use it follow.

- The entity defaults to the point's own `entity`.
- Each form reads attributes by default names: `latitude` and `longitude` (a person, a device tracker, a zone), `azimuth` and `elevation` (`sun.sun`), `x`, `y` and `z`, or `distance` and `bearing`. Change them with the form's own keys; `state` as a name reads the entity's state.
- A point is hidden while one of its numbers is missing or not a number.

```yaml live
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 10, 0]
      yaw: 160
      tilt: 20
      distance: 190
points:
  # the sun from sun.sun's azimuth and elevation, on the dome
  - id: sun
    altaz:
      entity: sun.sun
    object: sky
    marker: dot
    color: var(--lcars-yellow)
    label: SOL
  # home from zone.home's latitude and longitude, on the globe
  - id: home
    latlon:
      entity: zone.home
    object: earth
    marker: reticle
    label: HOME
objects:
  - type: grid
    id: sky
    shape: dome
    radius: 80
    line_spacing_deg: 15
  - type: sphere
    id: earth
    at: [0, 20, 0]
    radius: 15
    image: builtin:earth_blue_marble
```

::: details More about positions from entities
- **A probe from a sensor's attributes:** a point with `entity: sensor.probe_track` and `polar: { attributes: [range, heading] }` reads its distance from the sensor's `range` attribute and its bearing from `heading`.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `latlon.entity` | string | the point's `entity` | The entity to read: a person, a device tracker, a zone |
| `latlon.latitude` | string | `latitude` | The attribute holding the latitude |
| `latlon.longitude` | string | `longitude` | The attribute holding the longitude |
| `altaz.entity` | string | the point's `entity` | The entity to read, such as `sun.sun` |
| `altaz.azimuth` | string | `azimuth` | The attribute holding the azimuth |
| `altaz.altitude` | string | `elevation` | The attribute holding the altitude |
| `xyz.entity` | string | the point's `entity` | The entity to read |
| `xyz.attributes` | list | `[x, y, z]` | The three attributes holding x, y and z |
| `polar.entity` | string | the point's `entity` | The entity to read |
| `polar.attributes` | list | `[distance, bearing]` | The two attributes holding the distance and the bearing |

## Templates

**Label `content` takes the four [template types](/core/templates/) as on every card: `{entity.state}` tokens, `[[[ JavaScript ]]]`, `{{ Jinja2 }}` (evaluated by Home Assistant) and `{ds:name}` [data sources](/core/datasources/).** Besides `entity`, `states`, `config`, `variables` and `theme`, label templates can read the sun and moon (`sky`) and the point's own config (`point`).

- A template is evaluated again only when something it reads changes: its entities, a data source, or the sky.
- The sky values update every minute, and work in all four types: `{sky.moon.illumination}`, `[[[ return Math.round(sky.sun.altitude) ]]]`, `{{ sky.moon.illumination }}`.
- The angles have one decimal; for whole degrees, round in JavaScript: `[[[ return 'SOL ' + Math.round(sky.sun.altitude) + '°' ]]]`.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    sky:
      target: [0, 20, 0]
      yaw: 180
      tilt: 20
      distance: 190
points:
  - id: sun
    sky: sun
    object: dome
    marker: dot
    label: "SOL {sky.sun.altitude}°"
    color: var(--lcars-yellow)
  - id: moon
    sky: moon
    object: dome
    marker: moon_phase
    label: "LUNA {sky.moon.illumination}%"
objects:
  - type: grid
    id: dome
    shape: dome
    radius: 80
    line_spacing_deg: 15
```

::: details More about templates
- **JavaScript templates** may read any state, so they run again on every change the card tracks.
- **Template off:** `template: false` on a field shows its `content` as written.
:::

| Name | Type | What it is |
|---|---|---|
| `sky.sun.azimuth` | number | The sun now, degrees to one decimal (from `sun.sun` when it exists) |
| `sky.sun.altitude` | number | The sun's height above the horizon, degrees to one decimal |
| `sky.moon.azimuth` | number | The moon now, degrees to one decimal (computed from the time and your location) |
| `sky.moon.altitude` | number | The moon's height above the horizon, degrees to one decimal |
| `sky.moon.illumination` | number | How much of the moon is lit, whole percent |
| `sky.moon.waxing` | boolean | `true` while it grows |
| `point` | object | The point's own config (`{point.id}`) |

## Settings from entities

**Any number on a point or object can follow an entity instead of holding still: a shield bubble's opacity follows the shields, a glow's size follows the power.** Write the key as `entity` with an `input` range and an `output` range, the same words as `map_range` in [animations](/core/animations) and the rules' `map_range_cond`.

- A value outside `input` stays at the end of `output`, unless `clamp: false`. No value (unavailable, not a number) gives the key's default.
- Templates work too: `spin: "[[[ return states['input_number.lcards_test_power'].state / 10 ]]]"`, or `{{ }}` and `{entity.state}`.
- An object's `opacity`, `radius`, `size` and `spin` ease to their new value without rebuilding anything; most other keys rebuild that one object or point, at most four times a second, and step.

```yaml live controls
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 20
      distance: 160
objects:
  - type: sphere
    id: shields
    at: [-35, 0, 0]
    radius: 30
    fill:
      color: var(--lcars-blue)
    # shields 0 to 100 % gives an opacity of 0 to 0.6
    opacity:
      entity: input_number.lcards_test_shields
      output: [0, 0.6]
  - type: glow
    id: core
    at: [40, 0, 0]
    color: var(--lcars-orange)
    # power 0 to 100 % gives a glow 10 to 60 across, easing over 1 s
    size:
      entity: input_number.lcards_test_power
      input: [0, 100]
      output: [10, 60]
      smooth: 1000
```

::: details More about settings from entities
- **What else changes in place:** some types take more keys of their own that ease without a rebuild: a belt's `radius` (each side too), `thickness` and `count` (the band widens or thins round the same rocks); a comet's `nucleus.size`, `coma.size`, `tail.length` and `glow`; a nebula's `drift` (each side too: the clouds speed up or slow down from where they are) and `density`; a crystalline entity's `glow` and `opacity`. A colour of any object crossfades to its new value (see [Colours from entities](#colours-from-entities)). Any other key (a deformation's `amplitude`, a galaxy's `arms.count`, a point's `alt`) rebuilds that one object or point.
- **A bound belt `count`** builds for the top of its `output` and draws fewer, so keep `output` no higher than you need.
- **Pairs:** a setting that takes `[a, b]` (a belt's `[inner, outer]` radius and `[smallest, largest]` rock size, a grid's or image's `[w, d]` size, a ring's ellipse, a nebula's drift) can have either side follow an entity of its own: `radius: [{ entity: input_number.lcards_test_shields, output: [40, 70] }, 90]`. A whole `radius` bound to one entity gives one number (for a belt, the outer edge with the inner at 0.8 of it) and scales in place; a bound side rebuilds the object, except a belt's radius and a nebula's drift, which ease. In the Astrometrics Studio each box of a pair has its own link button.
- **Whole numbers:** how-many settings (a belt's `count`, a galaxy's `arms.count` and `stars.count`, a nebula's `count`, a lightning object's `branches`, a wobble's `lobes`, a polar grid's `spoke_count`, `num_octaves`, `major.row_interval` and `major.col_interval`) take the mapped value rounded, so `count: { entity: input_number.lcards_test_power, output: [100, 500] }` gives 233 rocks at 33.3 %, and the object rebuilds only when the whole number changes.
- **Not bound:** lists of three (`[x, y, z]`, `rotation`) do not follow entities, and a `seed` takes only a plain number (a new pattern would rebuild the object).
- **On the card:** `time_scale`, `warp_factor`, `clock.rate` and `clock.date` follow entities the same way (`clock: { date: { entity: input_datetime.lcards_test_date } }` shows the planets on the date in a helper). Positions follow entities their own way: see [Positions from entities](#positions-from-entities).
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `entity` | string | required | The entity to follow |
| `attribute` | string | - | Read this attribute instead of the state |
| `input` | `[low, high]` | the entity's `min` and `max`, else `[0, 100]` | The range of the entity's value. `min` and `max` are an `input_number`'s attributes |
| `output` | `[low, high]` | - | The range of the setting the input maps to. Left out: the entity's number as it is |
| `clamp` | boolean | `true` | `false`: a value outside `input` carries on past the ends of `output` |
| `smooth` | number | `600` | How long a change eases, ms, for a key that changes in place. `0` steps |

### Colours from entities

**Any colour on an object can follow an entity or a template too: its `color`, a part's `color` (such as `edges.color` or `core.color`), each colour in a `colors` list, and the colours of a `fill.effect`.** Write it as a [state map](/core/colours) with the entity it reads, using the same state words as the other cards.

- With no key matching, a value that is itself a colour is used, so `color: { entity: light.desk, attribute: rgb_color }` follows a light's colour.
- A colour change crossfades that object to the new colour in place over a moment, with no rebuild: its motion carries on.
- A point's colour already follows the point's own entity: see [A point's entity](#a-point-s-entity).

```yaml live controls
type: custom:lcards-astrometrics-card
height: 320
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 35
      distance: 220
objects:
  - type: grid
    id: deck
    shape: plane
    size: 120
    # the lines turn orange while the toggle is on
    color:
      entity: input_boolean.lcards_test_toggle
      active: var(--lcars-orange)
      inactive: var(--lcars-gray)
    # the frame turns red above 80 % power
    edges:
      color:
        entity: input_number.lcards_test_power
        "above:80": var(--lcars-red)
        default: var(--lcars-blue)
  - type: nebula
    id: cloud
    at: [0, 25, 0]
    radius: 50
    # two clouds placed by hand take the colours in order:
    # the first stays blue, the second follows the mode
    clouds:
      - xyz: [-28, 0, 0]
        radius: 24
      - xyz: [28, 0, 0]
        radius: 24
    colors:
      - var(--lcars-blue)
      - entity: input_select.lcards_test_mode
        alpha: var(--lcars-violet)
        beta: var(--lcars-orange)
        default: var(--lcars-red)
```

::: details More about colours from entities
- **Templates:** `color: "[[[ return states['input_boolean.lcards_test_toggle'].state === 'on' ? 'var(--lcars-red)' : 'var(--lcars-blue)' ]]]"`, or `{{ }}`. The result is a colour (`[r, g, b]` works too).
- **Nothing matching**, and no `default`: the colour the key has when it is left out.
- **How often:** a colour change crossfades at most four times a second; under reduced motion it changes at once. A model, whose look comes from its file, is built again instead.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `entity` | string | required | The entity to follow |
| `attribute` | string | - | Match this attribute's value instead of the state |
| `<state>` | colour | - | The colour for that exact state or attribute value (`heat`, `alpha`) |
| `active` | colour | - | The colour while the entity is on, with the card's `state_classification` |
| `inactive` | colour | - | The colour while the entity is off |
| `unavailable` | colour | - | The colour while the entity is unavailable or unknown |
| `zero` | colour | - | The colour when the value is the number 0 |
| `non_zero` | colour | - | The colour when the value is any other number |
| `above:N` | colour | - | The colour when the value is above N |
| `below:N` | colour | - | The colour when the value is below N |
| `between:A:B` | colour | - | The colour when the value is between A and B |
| `default` | colour | - | The colour when nothing else matches |

### A guided tour

**`camera.view` can follow an entity: the camera flies to `views[n]` when the entity's value is `n` (counting from 0), or to the view an `input_select`'s option names.** Step the number from an automation, a script or buttons (`input_number.increment`), and the card flies from stop to stop.

- A number is rounded and held to the list, so a value past the last stop stays on the last.
- A stop can set the [scene clock](./scale#the-scene-clock) too: `view`, with `date` and `rate`.
- Leave `views` out when the entity's state is the view's name.

```yaml live controls
type: custom:lcards-astrometrics-card
height: 320
camera:
  view:
    entity: input_number.lcards_test_stage
    views:
      - wide
      - planet
      - moon
  views:
    wide:
      target: [0, 0, 0]
      yaw: 20
      tilt: 35
      distance: 170
    planet:
      target: planet
      yaw: 40
      tilt: 20
      distance: 60
    moon:
      target: moon
      yaw: 200
      tilt: 15
      distance: 25
points:
  # each tap sets the stage, and the camera follows it
  - id: home
    xyz: [-50, 0, 0]
    marker: diamond
    label: STAGE 0 (TAP)
    tap_action:
      action: perform-action
      perform_action: input_number.set_value
      target:
        entity_id: input_number.lcards_test_stage
      data:
        value: 0
  - id: planet
    xyz: [20, 0, 0]
    label: STAGE 1 (TAP)
    tap_action:
      action: perform-action
      perform_action: input_number.set_value
      target:
        entity_id: input_number.lcards_test_stage
      data:
        value: 1
  - id: moon
    xyz: [45, 4, 10]
    label: STAGE 2 (TAP)
    tap_action:
      action: perform-action
      perform_action: input_number.set_value
      target:
        entity_id: input_number.lcards_test_stage
      data:
        value: 2
objects:
  - type: sphere
    at: planet
    radius: 12
    fill:
      effect:
        preset: gas_giant
  - type: sphere
    at: moon
    radius: 3
    color: var(--lcars-gray)
  - type: grid
    shape: disc
    radius: 70
    pattern: polar
    line_spacing: 10
    spoke_count: 12
    opacity: 0.4
```

| Key | Type | Default | Description |
|---|---|---|---|
| `camera.view.entity` | string | required | The entity whose value picks the view |
| `camera.view.attribute` | string | - | Read this attribute instead of the state |
| `camera.view.views` | list | - | The stops in order: a view name, or `view` with `date` and `rate` |
| `camera.view.views[].view` | string | required | The named view to fly to |
| `camera.view.views[].date` | string | - | Set the scene date there: `now` or an ISO date |
| `camera.view.views[].rate` | number / string | - | Set the date's rate there: `live`, days per second, or with a unit (`1 h/s`, `30 d/s`, `1 y/s`) |

## Rules

**Points and objects with an `id` are [rule](/core/rules/) targets, as MSD overlays are: a rule's `apply.overlays` patches them with their own keys.** Use it to recolour, relabel, hide or move points and objects while an entity is in some state.

- When the rule stops matching, the point or object goes back to its config.
- A patched point label is rebuilt on its own; the rest of the scene stays. An object whose patch changes only colours crossfades in place, and other keys build that object again, nothing else.
- Ids are page-wide: two cards with a point `sol` both match a rule on `sol`. Use distinct ids, or tags, when a dashboard has several astrometrics or MSD cards.

```yaml live controls
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    top:
      target: [0, 0, 0]
      tilt: 70
      distance: 130
labels:
  styles:
    hostile:
      font_size: 16
      font_weight: bold
      color: var(--lcars-alert-red)
points:
  # tap to toggle the alert
  - id: alert_switch
    xyz: [-35, 0, 25]
    marker: square
    label: RED ALERT (TAP)
    tap_action:
      action: toggle
      entity: input_boolean.lcards_test_toggle
  - id: warbird
    xyz: [20, 0, -10]
    marker: triangle
    label: CONTACT
  - id: escort
    xyz: [-10, 0, -20]
    marker: dot
    tags:
      - patrol
    label: ESCORT
objects:
  - type: ring
    id: neutral_zone
    radius: 45
    color: var(--lcars-blue)
rules:
  - id: red_alert_contacts
    when:
      entity: input_boolean.lcards_test_toggle
      state: "on"
    apply:
      overlays:
        # a point
        warbird:
          style: hostile
          label: HOSTILE CONTACT
        # every point or object tagged patrol
        "tag:patrol":
          color: var(--lcars-alert-red)
        # an object
        neutral_zone:
          visible: false
```

::: details More about rules
- **Selectors:** an id, `tag:<name>` (points and objects take `tags`), `type:astrometrics-point` or `type:astrometrics-object`, `pattern:<regex>`, `all`.
- **Point keys a rule can patch:** `label`, `text`, `style`, `color`, `marker`, `priority`, `overlap`, `visible`, `opacity`, the distance keys (`fade`, `min_distance`, `max_distance`), `tap_action`, `card` and the placement forms (a rule can move a point).
- **Object keys:** any of their keys. `visible` and the distance keys change it without a rebuild.
- **MSD-style patches:** `style: { color: var(--lcars-red) }` patches the colour. A plain string `style` is the label style.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `rules` | list | - | The card's [rules](/core/rules/) |
| `apply.overlays` | object | - | Patches by selector: a point or object id, `tag:<name>`, `type:astrometrics-point`, `type:astrometrics-object`, `pattern:<regex>` or `all` |
| `tags` | list | - | On a point or object: names for `tag:<name>` selectors |

## Fly-to from other cards and automations

**Give the astrometrics card an `id`, then any LCARdS card can fly its camera with a `fly-to` action naming it in `card`, with a `view` or a `point`.** From an automation, the [`lcards.fly_to`](/configuration/ha-actions#lcards-fly-to) action does the same on every open dashboard (or only the devices and users you target).

- The camera of every open card with that id flies, in the same browser.
- The two examples below work together: the button flies the camera of the card above it.

```yaml live
# the card to fly: its id is galaxy
type: custom:lcards-astrometrics-card
id: galaxy
height: 280
camera:
  views:
    wide:
      target: [0, 0, 0]
      yaw: 20
      tilt: 40
      distance: 170
backdrop:
  stars:
    count: 2000
points:
  - id: earth
    polar: [45, 120]
    marker: dot
    label: EARTH
objects:
  - type: grid
    shape: disc
    radius: 70
    pattern: polar
    line_spacing: 10
    spoke_count: 12
```

```yaml live
type: custom:lcards-button
preset: lozenge
text:
  name:
    content: EARTH
    show: true
style:
  card:
    color:
      background:
        default: var(--lcars-orange)
tap_action:
  action: fly-to
  card: galaxy          # the astrometrics card's id
  point: earth          # or view: <a camera view>
  duration: 2500        # optional, ms
  warp: true            # optional: streak the stars on the way (false: never)
```

::: details More about flying from outside
- **Browser console:** `window.lcards.cards.astrometrics` has `getAll()`, `get(id)` and `flyTo(id, view or { point }, { duration, warp })`.
- **The scene date:** `set-clock` takes `card` the same way: see [Scene actions](./points#scene-actions).
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `id` | string | - | On the astrometrics card: the name other cards and automations use |
| `card` | string | required | On the action: the astrometrics card's `id` |
| `point` | string | - | A point id to fly to. Wins over `view` |
| `view` | string | - | A named view (`camera.views`) to fly to |
| `duration` | number | `camera.fly_duration` | How long the flight takes, ms |
| `warp` | boolean | the view's `warp`, else `camera.warp` | `true` streaks the stars on the way, `false` never |
