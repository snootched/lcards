---
description: "The Astrometrics Studio: a full-screen editor for the LCARdS Astrometrics card with the live scene. Select, drag and place points on the scene, edit every object type in a form, capture camera views and start from a library of scenes and parts."
---

# Astrometrics Studio

![The Astrometrics Studio: the Objects tab on the left with a grid and a sphere in the list, the live scene on the right with a box round the selected planet](/img/cards/astrometrics-studio.webp)

The Studio edits an [Astrometrics card](./) next to its live scene. In the dashboard's edit mode, edit the card and select **Open Astrometrics Studio**. It works on a copy: **Save** writes it to the card, **Cancel** leaves the card as it was.

The preview is the real card, with your entities, templates, label styles, pinned cards and effects, so what you see is what the dashboard shows. Taps on it select instead of running actions.

## On the scene

- **Turn the view** as on the dashboard: drag to orbit, shift-drag, middle-drag or two fingers to pan, scroll or pinch to zoom (a touchpad swipe pans). The preview does not follow moving points. The home button in the toolbar goes back to the start view.
- **Select:** tap a point or an object to open it in its list. An object gets a box round it; a ring, path or beam is selected by tapping near its line. Opening a row in a list selects it on the scene too.
- **Drag a point** to move it. `xyz` and `polar` points slide at their own height, so a drag never changes `y` or `alt`; `latlon`, `altaz` and `cell` points follow the surface of their object. The toolbar shows the new numbers while you drag, and the point keeps its placement form. Points placed by `sky`, `at`, `part` or an entity do not drag.
- **Place a point** (the marker button in the toolbar): the next tap adds a point there. On a sphere it gets `latlon`, on a dome `altaz`, on a plane grid its `cell`, on another object `xyz` on that object, and on blank space `xyz` on the ground. Escape cancels. An object needs an `id` for a point to stand on it.

## Tabs

| Tab | Edits |
|---|---|
| **Scene** | The backdrop (stars and dust), label defaults, styles, overlap and snapping, and a background animation behind the scene. |
| **Points** | Every point: placement, the object it stands on, entity, label, style, marker, colour, a pinned card. See [Points: in the Astrometrics Studio](./points#in-the-astrometrics-studio). |
| **Objects** | Every object, with a form for its type. |
| **Camera** | The named views, and the camera's controls, buttons, limits, auto-rotate and fly-to settings. |
| **Starters** | Whole scenes and parts to copy into the card. |
| **YAML** | The whole config, with completion from the card's schema. |

### Objects

**Add object** shows every type with what it is for (the same list as [Objects: which type for what](./objects#which-type-for-what)). The new object gets an id and the keys its type needs: a path or beam runs between the first two points of the scene, or across the centre when there are none.

Each object's form is made from the card's options for its type: placement first (`at`, rotation, spin, visibility, opacity), then the type's own keys, then actions and tags. Nested options (a fill effect, ring labels, cells) open as sections of their own. **Show every key** also lists keys that apply only to other shapes of the same type (a grid's `spoke_count` on a plane, say); they are hidden until set. Actions and anything the form cannot show as fields are YAML editors with completion.

Each object can move up or down the list, be duplicated (with a new id) or deleted.

A [`system`](./objects#system) row has **Edit its points and objects**: the Points and Objects tabs then edit that system's lists, in its units, until **Back to the scene**. See [Scale: in the Studio](./scale#in-the-studio).

### Camera views

Move the preview's camera where you want it and select **Capture view**: the camera's target, yaw, tilt and distance become a new named view (`fov` and `projection` too, when they are not the defaults). The target is written as a point's id when the camera looks at a point (fly to the point first), else as coordinates rounded to 0.1. Capturing never moves the camera.

Each view in the list:

- **Fly to** flies the preview there.
- **Capture over this view** writes where the camera is now over the view's numbers, keeping its other keys (such as `warp`).
- **Start here** makes it the view the card starts on (`camera.view`, marked with a star).
- **Name** renames it; `fly-to` actions on this card's points and objects that name the view follow the new name.
- Move up, move down and delete. Deleting the start view makes the first view the start.

The view's own keys are below as a form. See [Camera and views](./#camera-and-views) for what each one does.

### Starters

[Starters](./starters) are ready-made scenes and parts, copied into your config: change anything afterwards, nothing refers back to them.

- **Scenes** (a galaxy, a sector map, the sky dome, a solar system, a Federation map, a starbase approach): **Use this scene** replaces the card's scene (it asks first when there is one). **Merge into the scene** adds its points, objects and views to yours and keeps your camera settings, start view and backdrop.
- **Parts** (a planet with moons, an asteroid belt, a nebula field, a set of territories): **Add to the scene** adds one next to what is there. Its ids start with the name you give it (`mars_body`, `mars_orbit`), so the same part can be added twice under two names. Its centre is a point of your scene (such as `sun`) or coordinates.

Open a starter to see its settings and the YAML it adds, which follows the settings as you type. If any point, object or view id it adds is already in the card, nothing is added and the message names them.

## YAML stays yours

The Studio writes the same YAML you would write by hand, and keeps keys it has no field for. Anything can be finished in the YAML tab, or after Save in the card editor's YAML.
