---
description: "Astrometrics card points: named places on the plane, on a planet, in the sky, in a sector map cell or on a part of a 3D model, with labels on the LCARdS text system, markers, visibility ranges, tap actions and Lovelace cards pinned to them."
---

# Points

**A point is a named place in the scene: placed once, then referred to by its `id` from paths, rings, beams, object positions and camera views.** With a `label` or a `marker` it also shows on the scene, and with a `tap_action` or a `card` it becomes something to tap.

```yaml live
type: custom:lcards-astrometrics-card
height: 260
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 45
      distance: 140
points:
  - id: vega                 # a unique name
    polar: [40, 120]         # where: exactly one placement form
    label: Vega              # text shown at the point
    marker: triangle         # a marker
    style: major             # the label style
    tap_action:
      action: fly-to         # a tap flies the camera there
objects:
  - type: grid
    shape: disc
    radius: 60
    pattern: polar
    line_spacing: 10
    spoke_count: 12
```

## In the Astrometrics Studio

**The card editor opens the [Astrometrics Studio](./start#the-studio), a full-screen editor with the live scene, and its Points tab lists every point.** Add, duplicate, reorder and remove points there, and set each one's placement, the object it stands on, entity, label, style, marker, colour and the main label text keys. Other keys stay as they are; edit them in the YAML tab.

- **Pick on preview** (the crosshair on a row) places a point with a tap: the preview shows "TAP TO PLACE ..." and the next tap writes the point's numbers, in its own form. `xyz` and `polar` land on the ground (y = 0), or on the surface of the object in `object`; `latlon` lands on a sphere, `altaz` on a dome, `cell` on a plane grid's cell. Drag to turn the view first if you need to; Escape or Cancel stops picking.
- **On the scene**, tap a point to open its row, drag it to move it, or add one with **Place a point** in the toolbar. See [The Studio](./start#the-studio).
- **A part of a model** puts a point on a named part of a model object: the part list comes from the built-in model, or from the preview once it has loaded your file. The offset moves the point from the part's origin.
- **The Card section** pins a Lovelace card to the point: **Add card** opens Home Assistant's card picker, and the card's own editor opens below, as in a stack card. Show, position and width set how it appears.

::: details More about the Studio and points
- **Points that cannot be picked:** points placed by `sky`, `at` or an entity are not picked on the preview.
- **On a model:** a picked `xyz` lands on the model's surface, in the model file's own coordinates. See [model](./objects/ships#model).
- **Card picker not ready:** if the picker says it is not ready, select **Add card** on any dashboard once (you can cancel it) and try again.
:::

## Placement forms

**Each point takes exactly one placement form: scene coordinates, a bearing on the plane, a place on a globe or a dome, the sun or moon, a real planet, a sector map cell, another point, or a part of a model.** `offset: [x, y, z]` then moves any of them by scene units.

- `object` names the object the point stands on. `latlon`, `altaz`, `sky`, `cell` and `part` need it; with `xyz` or `polar` it is optional, and the point then moves and spins with that object.
- A point can sit on a point that sits on an object that sits on a point: the planet orbits the star, the away team stands on the planet. A reference that loops back on itself is refused (and logged).
- `xyz`, `polar`, `latlon` and `altaz` can also read their numbers from an entity: see [Positions from entities](./data#positions-from-entities).

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    side:
      target: [0, 0, 0]
      yaw: 30
      tilt: 25
      distance: 120
points:
  # scene coordinates
  - id: origin
    xyz: [0, 0, 0]
    marker: dot
    label: XYZ
  # distance and bearing on the plane
  - id: bearing
    polar: [35, 90]
    marker: diamond
    label: POLAR 35 AT 90
  # another point, moved up
  - id: lifted
    at: bearing
    offset: [0, 15, 0]
    marker: triangle
    label: AT + OFFSET
  # on the globe, lifted off its surface
  - id: lander
    latlon: [20, 0]
    object: globe
    alt: 0.5
    marker: reticle
    label: LATLON 20 0
objects:
  - type: grid
    shape: disc
    radius: 50
    pattern: polar
    line_spacing: 10
    spoke_count: 12
  - type: sphere
    id: globe
    at: [-30, 12, 0]
    radius: 10
    spin: 10
```

::: details More about placement
- **Longitude 0** on a sphere faces the default camera, with east to the right. A `latlon` point turns with the sphere's `spin`.
- **The sun and moon** with `sky` are placed from the time and your Home Assistant location (`sun.sun` when it exists), updated every minute; with a [clock](./scale#the-scene-clock) on the card, at the scene date instead of now.
- **Real bodies** with `body` sit where that Sun, planet, dwarf planet or moon is at the scene date, in the scene's or system's units. See [The real Solar System](./scale#the-real-solar-system).
- **A model part** with `part`: the point follows the part as it moves, and `xyz` is then an offset in the part's coordinates. See [model](./objects/ships#model).
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `id` | string | required | Unique name of the point, used by `at`, `target`, `from`, `to`, `points` and views |
| `xyz` | `[x, y, z]` | - | Scene coordinates; y is up. With `object`: local to that object (on a model, in the file's coordinates) |
| `polar` | `[distance, bearing]` | - | On the scene plane: distance from the centre, scene units, and a bearing in degrees (0 north, clockwise seen from above) |
| `latlon` | `[lat, lon]` | - | Latitude and longitude, degrees, on the sphere in `object` |
| `altaz` | `[azimuth, altitude]` | - | On the sky dome in `object`: azimuth clockwise from north, altitude up from the horizon, degrees |
| `sky` | string | - | `sun` or `moon`: that body on the dome in `object`, now or at the scene date |
| `body` | string | - | A real Sun, planet, dwarf planet or moon (`mars`), at the scene date |
| `center` | string | - | With `body`: measure from this body instead of the Sun (`jupiter`) |
| `cell` | string | - | The centre of a sector map cell (`AF3`) on the plane grid in `object`, which needs `axis_labels` |
| `at` | string | - | At another point, by id |
| `part` | string | - | On a named part of the [model](./objects/ships#model) in `object`; it follows the part |
| `object` | string | - | The object the point stands on, by id |
| `alt` | number | `0` | Height above the surface (`latlon`, `altaz`, `sky`) or the plane (`polar`), scene units |
| `offset` | `[x, y, z]` | - | Moves the point by these scene units from where its form puts it |

## Labels

**A point's label is LCARdS text, with the same [text-field keys](/core/text-fields) as the button, elbow and slider cards: font, size, weight, case, letter spacing, colour (a state map too), a background box, templates.** `label: Vega` is short for one field called `label`; `text:` gives a point as many fields as you like, each placed round the point.

- Fields with the same `position` stack. Without a `position`, a field sits right of the marker (`center-right`), or on the point when there is no marker (`center`).
- `text.default` holds keys every field of this point inherits; it is not drawn itself.
- Text-field keys that place text in a card's zones (`zone`, `x`, `y`, `x_percent`, `y_percent`, `anchor`, `baseline`, `stretch`, `font_size_percent`, `cap_height_ratio`) mean nothing round a point; the checker reports them as unknown.

```yaml live controls
type: custom:lcards-astrometrics-card
height: 260
camera:
  views:
    top:
      target: [0, 0, 0]
      tilt: 70
      distance: 110
points:
  - id: switch
    entity: switch.demo_switch
    xyz: [-15, 0, 0]
    marker: reticle
    text:
      # every field of this point
      default:
        font_size: 14
      label:
        content: "{entity.attributes.friendly_name}"
        color:
          default: var(--lcards-moonlight)
          "off": var(--lcars-orange)
      # under the label, right of the point
      status:
        content: "{entity.state}"
        position: bottom-right
        font_size: 11
        color: var(--lcars-black)
        # the LCARS bar-break box
        background:
          default: var(--lcars-orange)
objects:
  - type: grid
    shape: plane
    size: 100
    line_spacing: 10
```

::: details More about label text
- **Templates** in `content` are evaluated with the point's `entity`, and with `sky` and `point` as well: see [Live data: templates](./data#templates).
- **Fonts:** `font_family` takes the LCARdS fonts (`lcards_eurostile`, `lcards_microgramma`, ...), loaded when used. The default is the theme's LCARS font (Antonio).
- **Selected points:** a `selected` key in a `color` map colours the field while the point is selected. Without one, a selected point's label takes the theme's alert colour.
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `label` | string / number | - | Text shown at the point: short for `text.label.content` |
| `text` | object | - | Text fields by name (`label` is the main one) |
| `text.default` | object | - | Keys every text field of this point inherits |
| `content` | string | - | A field's text. [Templates](/core/templates/) are evaluated |
| `template` | boolean | `true` | `false` shows `content` as written |
| `show` | boolean | `true` | `false` hides the field |
| `display_format` | string | - | As on every card: see [Display format](/core/text-fields-content#display-format) |
| `position` | string | `center-right` with a marker, else `center` | Where the field sits round the point: `center`, `center-right`, `top-left`, `bottom-center` and the other six. `right`, `left`, `top` and `bottom` are short for the middle ones |
| `font_size` | number / string | by style | px (a number) or a CSS size |
| `font_weight` | string / number | - | As on every card |
| `font_family` | string | the theme's LCARS font | A font name or one of the LCARdS fonts |
| `text_transform` | string | - | `uppercase`, `lowercase`, `capitalize` |
| `letter_spacing` | number / string | - | px (a number) or a CSS length |
| `color` | colour / state map | by style | A colour, or a [state map](/core/colours) by the point's entity; a `selected` key colours it while the point is selected |
| `background` | colour / state map | - | A box behind the text, as on the [bar-label buttons](/core/text-fields-style#text-background) |
| `background_padding` | number | `8` | Space between the text and the sides of its box, px |
| `background_radius` | number | `4` | Corner radius of the box, px |
| `background_width` | number | - | A fixed box width, px |
| `background_min_width` | number | - | A smallest box width, px |
| `padding` | number / object | - | Moves the field, px: a number, or `top`, `right`, `bottom` and `left` |
| `rotation` | number | - | Turns the field, degrees |

### Styles and defaults

**`style` picks a label style, which sets the size, the colour and the rank when labels overlap.** The four built-ins are `title` (34 px), `major` (20 px), `minor` (13 px, the default) and `tiny` (10 px); `labels.styles` changes them or adds your own, and `labels.default` sets keys for every label on the card.

- A field takes its keys from, lowest first: the built-in style, `labels.default`, `labels.styles.<style>`, the point's `color`, the point's `text.default`, the field.
- Ring and axis labels of a grid take a `style` and a `text.default` the same way.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    top:
      target: [0, 0, 0]
      tilt: 70
      distance: 140
labels:
  default:
    text_transform: uppercase
    letter_spacing: 1
  styles:
    # a style of your own
    hostile:
      font_size: 16
      font_weight: bold
      color: var(--lcars-alert-red)
      priority: 90
points:
  - id: base
    xyz: [-30, 0, 10]
    marker: square
    style: major
    label: Starbase 12
  - id: warbird
    xyz: [25, 0, -15]
    marker: triangle
    style: hostile
    text:
      label:
        content: Warbird
      class:
        content: D'deridex class
        position: bottom-right
        font_size: 10
        font_weight: normal
        color: var(--lcards-moonlight)
  - id: buoy
    xyz: [20, 0, 25]
    marker: dot
    text:
      label:
        content: Buoy 7
        color: var(--lcars-black)
        background: var(--lcars-orange)
        background_radius: 8
objects:
  - type: grid
    shape: plane
    size: 120
    line_spacing: 10
```

::: details More about the built-in styles
- **The four styles:**

  | Style | Size | Priority | Colour |
  |---|---|---|---|
  | `title` | 34 px, letter spacing 1 | `100` | `var(--lcards-moonlight)` |
  | `major` | 20 px | `80` | `var(--lcards-moonlight)` |
  | `minor` | 13 px | `40` | the theme's text colour |
  | `tiny` | 10 px | `10` | the theme's text colour |

- **Changing a built-in:** `labels.styles.major` with only `font_size: 22` keeps the rest of `major` (its colour and priority).
:::

| Key | Type | Default | Description |
|---|---|---|---|
| `style` | string | `minor` | The point's label style: `title`, `major`, `minor`, `tiny` or one of yours. An unknown name is drawn as `minor` |
| `labels.default` | object | - | Text keys every label on the card inherits (`font_family`, `text_transform`, `letter_spacing`, ...), over the built-in styles |
| `labels.styles` | object | - | Label styles by name: change a built-in or add your own |
| `labels.styles.<name>` | object | - | A style: text keys plus `priority` and `overlap` |
| `labels.snap` | boolean | `false` | Round label positions to whole px: crisper text on a weak device, steppier in fast motion |

### Priority and placement

**When a label would overlap another one, or run off the card, it first tries the other side of its point; only when no side is free is it hidden, and the higher `priority` wins.**

- A label that moved keeps its new side while the scene turns, and goes back once its own side is clear.
- Between two labels of the same priority, the nearer one wins.
- `overlap: true` keeps a label from ever being hidden: it still moves to a free side when it can, else it shows over the other label. It suits a scene with few labels that must always show (compass letters, your home); in a busy galaxy, hiding the lower-priority labels keeps it readable.

```yaml live
type: custom:lcards-astrometrics-card
height: 260
camera:
  views:
    top:
      target: [0, 0, 0]
      tilt: 70
      distance: 120
labels:
  # every label on this card
  overlap: true
  styles:
    # except the small ones
    tiny:
      overlap: false
points:
  - id: home
    xyz: [0, 0, 0]
    marker: square
    style: major
    label: HOME
  # close to home: moves to a free side, or shows over it
  - id: shed
    xyz: [4, 0, 1]
    marker: dot
    label: SHED
  # tiny, and in the way: hidden
  - id: gate
    xyz: [2, 0, -1]
    marker: dot
    style: tiny
    label: GATE
objects:
  - type: grid
    shape: plane
    size: 100
    line_spacing: 10
```

| Key | Type | Default | Description |
|---|---|---|---|
| `priority` | number | by style | Which label wins when two overlap: higher wins. Overrides its style's |
| `overlap` | boolean | the style's, else `labels.overlap` | Never hide this label when labels overlap |
| `labels.overlap` | boolean | `false` | The same for every label on the card |
| `labels.styles.<name>.priority` | number | - | The priority of labels in this style |
| `labels.styles.<name>.overlap` | boolean | - | Labels in this style are never hidden |

### Labels on ships and planets

**When a model, a globe or a cube sits at a point (its `at:` names the point), the point's label stands off the object's edge on screen, with a thin leader line back to it, so it never sits on the hull.**

- The gap follows the object's size as the camera moves in and out.
- The object never hides its own point's label, and a tap on the object (or the label) selects the point and flies to it, as on a marker.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 30
      distance: 200
points:
  - id: enterprise
    polar: [70, 0]
    object: patrol
    label: ENTERPRISE
  # no leader line
  - id: base
    xyz: [0, 0, 0]
    label: STARBASE 11
    leader: false
objects:
  - type: ring
    id: patrol
    radius: 70
    spin: 4
  - type: model
    src: builtin:constitution_class_refit
    at: enterprise
    size: 16
    face: motion
  - type: sphere
    at: base
    radius: 12
```

| Key | Type | Default | Description |
|---|---|---|---|
| `leader` | boolean | `true` | With a model, globe or cube at the point: `false` leaves out the line from the object's edge to the label |

## Markers

**`marker` draws a shape at the point: a dot, a triangle, a diamond, a square, a reticle, a starship or a starbase seen from above, or the moon's lit part.** A point with a marker can be tapped.

- `color` on the point colours the marker, and is the default for its text fields; a state map follows the point's entity. A field's own `color` colours only that text.
- `ship` and `starbase` stand in for a model far away: see [Distance](./objects#distance).

```yaml live
type: custom:lcards-astrometrics-card
height: 240
camera:
  views:
    top:
      target: [0, 0, 0]
      tilt: 70
      distance: 110
points:
  - id: patrol
    xyz: [-25, 0, 0]
    marker: ship
    color: var(--lcars-orange)
    label: PATROL
  - id: station
    xyz: [20, 0, 0]
    marker: starbase
    color: var(--lcars-blue)
    label: STATION
objects:
  - type: grid
    shape: plane
    size: 100
    line_spacing: 10
```

<CardGallery set="astro-markers" />

<CardGallery set="astro-label-styles" />

| Key | Type | Default | Description |
|---|---|---|---|
| `marker` | string | `none` | `dot`, `triangle`, `diamond`, `square`, `reticle` (a target ring), `ship`, `starbase`, `moon_phase` (the moon's lit part, from the sky) or `none` |
| `color` | colour / state map | by style | The marker's colour, and the default for the text fields. A state map by the point's entity; a `selected` key while it is selected. Built-in styles: `var(--lcards-moonlight)` for `title` and `major`, the theme's text colour for `minor` and `tiny` |

## Visibility

**A point can hide its label and marker, show them only in one look of the card, fade them, or show them only within a range of camera distances.** Distance ranges show detail as you zoom in, and hide it again as you zoom out.

- A hidden point still places the things that use it. [Rules](./data#rules) use `visible` to hide and show points.
- Labels behind a planet, a model, an asteroid or a cube are hidden; the see-through volumes and grids hide nothing.
- Objects take the same three distance keys, measured to their nearest edge: see [Distance](./objects#distance).

```yaml live
type: custom:lcards-astrometrics-card
height: 280
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 20
      tilt: 40
      distance: 160
points:
  - id: sector
    xyz: [0, 0, 0]
    marker: reticle
    style: major
    label: SECTOR 001
  # hidden from where the camera starts: zoom in to see it
  - id: detail
    xyz: [15, 0, 10]
    marker: dot
    label: OUTPOST (ZOOM IN)
    max_distance: 120
  # half see-through
  - id: faint
    xyz: [-25, 0, -10]
    marker: dot
    label: FAINT
    opacity: 0.4
objects:
  - type: grid
    shape: disc
    radius: 50
    pattern: polar
    line_spacing: 10
    spoke_count: 12
```

| Key | Type | Default | Description |
|---|---|---|---|
| `visible` | boolean | `true` | `false` hides the label, marker and card; the point still places other things |
| `look` | string | - | `diagram` or `realistic`: the label and marker show only in that [look](./scene#looks-diagram-and-realistic) of the card (and in `mixed`) |
| `opacity` | number | `1` | Opacity of the label and marker, `0` to `1` |
| `max_distance` | number | - | Hidden when the camera is farther than this, scene units |
| `min_distance` | number | - | Hidden when the camera is closer than this, scene units |
| `fade` | `[start, end]` | - | Fully shown nearer than `start`, gone past `end`, scene units from the camera |
| `below_horizon` | string | `dim` for `sky`, `show` for `altaz` | Sky points under the horizon: `dim`, `hide` or `show` |
| `hide_in_systems` | boolean / list | - | Hide the label and marker while the camera is inside a [star system](./scale#star-systems); a list of system ids hides it in those only |

## Actions

**`tap_action` and `hold_action` take any card action (`more-info`, `toggle`, `perform-action`, `navigate`, `url`, `none`), plus `fly-to`, which flies the camera to the point.**

- A point with no `tap_action` and a marker (or a model or globe sitting at it) selects on a tap: its label turns the alert colour (or the `selected` colour of its colour map), and the camera flies to it.
- `more-info` and `toggle` without an `entity` act on the point's `entity`, else the card's.
- A point's own `view` sets where the camera lands when it flies to that point.
- A drag never fires a tap (a press that moves more than 6 px is a drag), and a hold (half a second) fires `hold_action`, not `tap_action`.

```yaml live controls
type: custom:lcards-astrometrics-card
height: 340
camera:
  view: wide
  views:
    wide:
      target: [0, 0, 0]
      yaw: 20
      tilt: 40
      distance: 160
points:
  # tap to toggle the light, hold for its dialog
  - id: lamp
    xyz: [-30, 0, 0]
    marker: square
    label: LIGHT
    tap_action:
      action: toggle
      entity: light.demo
    hold_action:
      action: more-info
      entity: light.demo
  # tap to fly in close, with a low camera
  - id: probe
    xyz: [30, 0, 10]
    marker: diamond
    label: PROBE
    view:
      distance: 30
      tilt: 15
objects:
  - type: grid
    shape: plane
    size: 120
    line_spacing: 10
```

| Key | Type | Default | Description |
|---|---|---|---|
| `tap_action` | action | select and fly-to, with a marker | Action on a tap. A point with a marker, a `tap_action` or a `card` can be tapped |
| `hold_action` | action | - | Action on a hold of half a second |
| `view.distance` | number | a close-up | Where the camera lands when it flies to this point: distance from it, scene units |
| `view.tilt` | number | the current tilt | Camera height angle on landing, degrees: `0` level, `90` straight down |
| `view.yaw` | number | the current yaw | The way the camera faces on landing, degrees |
| `view.warp` | boolean | `camera.warp` | Stars and dust streak on the way here (see [Warp and dust](./effects#warp-and-dust)) |
| [Scene action keys](#scene-actions) | | | `fly-to`, `set-clock` and `set-model-scale` |

### Scene actions

**Three actions belong to the astrometrics card: `fly-to` moves the camera, `set-clock` sets the scene date, and `set-model-scale` switches the models between their real size and visible size.** On the card's own points and objects they act on this card; from any other LCARdS card, `card` names the astrometrics card (its `id`).

- `action: fly-to` alone flies to the point (on an object: to its middle). With `view`, it flies to that named view instead; with `point`, to that point.
- `duration` and `warp` on the action win over the card's `camera.fly_duration` and `camera.warp` and the view's own `warp`.
- Flying from other cards and from automations is on [Live data](./data#fly-to-from-other-cards-and-automations).

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  view: wide
  views:
    wide:
      target: [0, 0, 0]
      yaw: 20
      tilt: 40
      distance: 160
    map:
      target: [0, 0, 0]
      tilt: 90
      distance: 120
points:
  # fly to the named view, slowly
  - id: overview
    xyz: [-30, 0, 0]
    marker: diamond
    label: MAP VIEW (TAP)
    tap_action:
      action: fly-to
      view: map
      duration: 3000
  # back to the start, streaking the stars
  - id: back
    xyz: [30, 0, 0]
    marker: diamond
    label: WIDE VIEW (TAP)
    tap_action:
      action: fly-to
      view: wide
      warp: true
backdrop:
  stars:
    count: 2000
objects:
  - type: grid
    shape: plane
    size: 120
    line_spacing: 10
```

| Key | Type | Default | Description |
|---|---|---|---|
| `action` | string | - | `fly-to`, `set-clock` or `set-model-scale` (or any other card action) |
| `card` | string | this card | The astrometrics card to act on, by its `id`. Needed from any other LCARdS card |
| `view` | string | - | `fly-to`: a named view (`camera.views`) to fly to instead of the point |
| `point` | string | - | `fly-to`: a point id to fly to. Wins over `view` |
| `duration` | number | `camera.fly_duration` | `fly-to`: how long the flight takes, ms |
| `warp` | boolean | the view's `warp`, else `camera.warp` | `fly-to`: `true` streaks the stars on the way, `false` never |
| `date` | string | - | `set-clock`: the [scene date](./scale#the-scene-clock), `now` or an ISO date |
| `rate` | number / string | - | `set-clock`: days per second, or `live` |
| `model_scale` | string | `toggle` | `set-model-scale`: `real`, `visible` or `toggle`, as in [visible size](./objects/ships#visible-size). Not saved |

## Cards on points

**`card` pins any Lovelace card to the point: a tile, an entities card, an LCARdS button.** It follows the point as the camera moves, and hides when the point is off screen, behind a planet or a model, or out of its `max_distance` range.

- `show: tap` (the default): a tap on the point opens its card and selects the point; a tap anywhere else, another point or Escape closes it. One card is open at a time. A `tap_action` then runs only when it is `fly-to` (the card opens and the camera flies).
- `show: always`: the card is always shown, a small control panel standing in the scene.
- A point with a card needs no label or marker: the card is what shows. Its visibility conditions work as on a dashboard.
- A rule can patch `card` like any other point key; only that card is built again.

```yaml live controls
type: custom:lcards-astrometrics-card
height: 360
camera:
  views:
    v:
      target: [0, 0, 0]
      yaw: 25
      tilt: 30
      distance: 110
points:
  # always shown
  - id: relay
    xyz: [-25, 0, 0]
    marker: diamond
    label: RELAY
    card:
      show: always
      position: top-left
      width: 150
      card:
        type: custom:lcards-button
        entity: input_boolean.demo_toggle
        preset: lozenge
        text:
          name:
            content: RELAY POWER
            show: true
  # opens on a tap
  - id: outpost
    xyz: [25, 0, 10]
    marker: dot
    label: OUTPOST (TAP)
    card:
      position: top-right
      width: 170
      card:
        type: custom:lcards-button
        entity: switch.demo_switch
        preset: lozenge
        text:
          name:
            content: SHIELDS
            show: true
objects:
  - type: grid
    shape: disc
    radius: 50
    pattern: polar
    line_spacing: 10
    spoke_count: 12
```

| Key | Type | Default | Description |
|---|---|---|---|
| `card.card` | object | required | The card config, as on a dashboard (`type` and its own keys) |
| `card.show` | string | `tap` | `tap`: opens on a tap on the point. `always`: always shown |
| `card.position` | string | `center-right` | Where the card sits round the point, with the label position names. It stays inside the scene |
| `card.offset` | `[x, y]` | `[0, 0]` | Moves the card from where `position` puts it, px |
| `card.width` | number | `280` | Card width, px (at least `80`); the height follows the card |
