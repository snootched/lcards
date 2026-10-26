---
description: "Astrometrics card points: named places on the plane, on a planet, in the sky or in a sector map cell, with labels on the LCARdS text system, markers, visibility ranges and tap actions."
---

# Points

A point is a named place in the scene. It is placed once and referred to by its `id` from paths, rings, beams, object positions and camera views. With a `label` or a `marker` it also shows on the scene.

```yaml
points:
  - id: vega                 # unique name
    polar: [64, 160]         # where: exactly one placement form
    label: Vega              # optional text (or text: for styled fields)
    marker: triangle         # optional marker
    style: minor             # label style
    tap_action: { action: fly-to }
```

## Placement forms

Each point takes exactly one of these. `offset: [x, y, z]` moves any of them by scene units.

| Form | Meaning |
|---|---|
| `xyz: [x, y, z]` | Scene coordinates; y is up. |
| `polar: [distance, bearing]` | On the scene plane: distance from the centre and a bearing (0 north, clockwise). `alt` lifts it. |
| `latlon: [lat, lon]` + `object` | On a sphere. Longitude 0 faces the default camera, east to the right. Turns with the sphere's `spin`. |
| `altaz: [azimuth, altitude]` + `object` | On a sky dome: azimuth clockwise from north, altitude up from the horizon. |
| `sky: sun` or `sky: moon` + `object` | The sun or moon on a dome, now (from the time and your Home Assistant location). |
| `cell: AF3` + `object` | The centre of a cell of a sector map (a plane grid with `axis_labels`). |
| `at: <point>` | At another point; add `offset` to move away from it. |

`object` names the object the point stands on. With `xyz` or `polar` it is optional: the point then moves and spins with that object. `alt` lifts a point off the surface (`latlon`, `altaz`, `sky`) or the plane (`polar`).

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  views:
    side: { target: [0, 0, 0], yaw: 30, tilt: 25, distance: 120 }
points:
  - { id: origin, xyz: [0, 0, 0], marker: dot, label: XYZ }
  - { id: bearing, polar: [35, 90], marker: diamond, label: POLAR 35 AT 90 }
  - { id: lifted, at: bearing, offset: [0, 15, 0], marker: triangle, label: AT + OFFSET }
  - { id: lander, latlon: [20, 0], object: globe, alt: 0.5, marker: reticle, label: LATLON 20 0 }
objects:
  - { type: grid, shape: disc, radius: 50, pattern: polar, line_spacing: 10, spoke_count: 12 }
  - { type: sphere, id: globe, at: [-30, 12, 0], radius: 10, spin: 10 }
```

A point can sit on a point that sits on an object that sits on a point: the planet orbits the star, the away team stands on the planet. A reference that loops back on itself is refused (and logged).

## Labels

A point's label is LCARdS text, with the same [text-field keys](/core/text-fields) as the button, elbow and slider cards: font, size, weight, case, letter spacing, colour (a state map too), a background box, templates. `label: Vega` is short for one field called `label`; `text:` gives a point as many fields as you like, each placed round the point.

```yaml
points:
  - id: shuttle
    entity: device_tracker.shuttle_1
    xyz: [20, 0, 30]
    marker: reticle
    text:
      default: { font_size: 13 }                 # every field of this point
      label:
        content: "{entity.attributes.friendly_name}"
        color: { default: var(--lcards-moonlight), not_home: var(--lcars-orange) }
      status:
        content: "{entity.state}"
        position: bottom-right                   # under the label, right of the point
        font_size: 10
        background: { default: black }           # the LCARS bar-break box
```

| Key | What it does |
|---|---|
| `content` | The text. [Templates](/core/templates/) are evaluated, with the point's `entity`; `template: false` shows it as written. See [Live data](./data#templates). |
| `position` | Where the field sits round the point: `center-right` (right of the marker, the default with a marker), `center` (on the point, the default without), `top-left`, `bottom-center`, ... `right`, `left`, `top` and `bottom` are short for the middle ones. Fields with the same position stack. |
| `font_size`, `font_weight`, `font_family`, `text_transform`, `letter_spacing` | As on every card. `font_family` takes the LCARdS fonts (`lcards_eurostile`, `lcards_microgramma`, ...), loaded when used. |
| `color` | A colour or a [state map](/core/colours) by the point's entity. A `selected` key colours the field while the point is selected (default: the theme's alert colour). |
| `background`, `background_padding`, `background_radius`, `background_width`, `background_min_width` | A box behind the text, as on the [bar-label buttons](/core/text-fields#text-background). |
| `padding` | Moves the field, px (a number, or `{ top, right, bottom, left }`). |
| `rotation` | Turns the field, degrees. |
| `show`, `display_format` | As on every card. |

The text-field keys that place text in a card's zones (`zone`, `x`, `y`, `x_percent`, `y_percent`, `anchor`, `baseline`, `stretch`, `font_size_percent`, `cap_height_ratio`) mean nothing round a point; the checker reports them as unknown.

### Styles and defaults

`style` picks a label style. The four built-ins set the size and the rank when labels overlap: `title` (34 px, 100), `major` (20 px, 80), `minor` (13 px, 40, the default) and `tiny` (10 px, 10). `labels.styles` changes them or adds your own, and `labels.default` sets keys for every label on the card:

```yaml
labels:
  default: { font_family: lcards_eurostile, text_transform: uppercase }
  styles:
    major: { font_size: 22 }
    hostile: { font_size: 16, font_weight: bold, color: var(--lcars-alert-red), priority: 90 }
points:
  - { id: warbird, polar: [70, 40], marker: triangle, style: hostile, label: Warbird }
```

A field takes its keys from, lowest first: the built-in style, `labels.default`, `labels.styles.<style>`, the point's `color`, the point's `text.default`, the field. Ring and axis labels of a grid take a `style` and a `text: { default: ... }` the same way.

```yaml live
type: custom:lcards-astrometrics-card
height: 300
camera:
  views:
    top: { target: [0, 0, 0], tilt: 70, distance: 140 }
labels:
  default: { text_transform: uppercase, letter_spacing: 1 }
  styles:
    hostile: { font_size: 16, font_weight: bold, color: var(--lcars-alert-red), priority: 90 }
points:
  - { id: base, xyz: [-30, 0, 10], marker: square, style: major, label: Starbase 12 }
  - id: warbird
    xyz: [25, 0, -15]
    marker: triangle
    style: hostile
    text:
      label: { content: Warbird }
      class: { content: D'deridex class, position: bottom-right, font_size: 10, font_weight: normal, color: var(--lcards-moonlight) }
  - id: buoy
    xyz: [20, 0, 25]
    marker: dot
    text:
      label: { content: Buoy 7, background: { default: var(--lcars-orange) }, color: black, background_radius: 8 }
objects:
  - { type: grid, shape: plane, size: 120, line_spacing: 10 }
```

### Priority and placement

When a label would overlap another one, or run off the card, it first tries the other side of its point (left instead of right, above instead of below); it keeps that side while the scene turns, and goes back once its own side is clear. Only when no side is free is it hidden: the higher `priority` wins, then the nearer label. A point's `priority` overrides its style's.

`overlap: true` keeps a label from ever being hidden: it still moves to a free side when it can, else it shows over the other label. Set it on a point, on a style in `labels.styles`, or for the whole card with `labels.overlap` (the most specific wins). It suits a scene with few labels that must always show (compass letters, your home); in a busy galaxy, hiding the lower-priority labels keeps it readable.

```yaml
labels:
  overlap: true                 # every label on this card
  styles:
    tiny: { overlap: false }    # except the small ones
points:
  - { id: north, altaz: [0, 0], object: sky, label: "N", overlap: true }
```

## Markers

`marker` draws `dot`, `triangle`, `diamond`, `square`, `reticle`, `moon_phase` (the moon's lit part) or `none` at the point. A point with a marker can be tapped. `color` on the point colours the marker, and is the default for its text fields (a state map follows the point's entity). Without it the marker takes its style's colour; a field's own `color` colours only that text.

<CardGallery set="astro-markers" />

<CardGallery set="astro-label-styles" />

## Visibility

| Key | What it does |
|---|---|
| `max_distance` | Hidden when the camera is farther than this: detail that appears as you zoom in. |
| `min_distance` | Hidden when the camera is closer than this. |
| `fade: [start, end]` | Fades out between these camera distances. |
| `below_horizon` | Sky points under the horizon: `dim` (the default for `sky`), `hide`, or `show` (the default for `altaz`). |

Labels behind a planet are hidden; the see-through volumes and grids hide nothing.

## Actions

`tap_action` and `hold_action` take any card action (`more-info`, `toggle`, `perform-action`, `navigate`, `url`, `none`), plus `fly-to`:

- A point with no `tap_action` and a marker: a tap selects it (its label turns the alert colour, or the `selected` colour of its colour map) and flies the camera to it.
- `more-info` and `toggle` without an `entity` act on the point's `entity` (else the card's).
- `{ action: fly-to }`: the same, stated explicitly (on an object: fly to its middle).
- `{ action: fly-to, view: map }`: fly to the named view instead.
- A point's own `view: { distance, tilt, yaw }` sets where the camera lands when it flies to that point.

A drag never fires a tap (a press that moves more than 6 px is a drag), and a hold (half a second) fires `hold_action`, not `tap_action`.

```yaml live
type: custom:lcards-astrometrics-card
height: 340
camera:
  view: wide
  views:
    wide: { target: [0, 0, 0], yaw: 20, tilt: 40, distance: 160 }
points:
  - id: lamp
    xyz: [-30, 0, 0]
    marker: square
    label: LIGHT
    tap_action: { action: toggle, entity: light.demo }
    hold_action: { action: more-info, entity: light.demo }
  - id: probe
    xyz: [30, 0, 10]
    marker: diamond
    label: PROBE
    view: { distance: 30, tilt: 15 }
objects:
  - { type: grid, shape: plane, size: 120, line_spacing: 10 }
```
