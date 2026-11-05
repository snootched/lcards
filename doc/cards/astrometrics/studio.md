---
description: "The Astrometrics Studio: a full-screen editor for the LCARdS Astrometrics card with the live scene. Select, drag and place points on the scene, edit every object type in a form, capture camera views and start from a library of scenes and parts."
---

# Astrometrics Studio

![The Astrometrics Studio: the Objects tab on the left with a grid and a sphere in the list, the live scene on the right with a box round the selected planet](/img/cards/astrometrics-studio.webp)

The Studio edits an [Astrometrics card](./) next to its live scene. In the dashboard's edit mode, edit the card and select **Open Astrometrics Studio**. It works on a copy: **Save** writes it to the card, **Cancel** leaves the card as it was.

The preview is the real card, with your entities, templates, label styles, pinned cards and effects, so what you see is what the dashboard shows. Taps on it select instead of running actions.

## On the scene

The toolbar over the preview has four groups. The arrow at its end folds it away to one button.

- **Tools**: place a point, and **measure**: tap two places (a point's marker, an object's surface or the ground) and the line between them shows with its length in the open scene's or system's units, and once more in the next named unit when the units are named (`4.2 ly (266,000 au)`). A third tap starts again; Escape stops.
- **View**: back to the start view; fly to what is selected (also `F`); **quick views**, top, front and side in turn, flat (orthographic) round where the camera looks, for placing things exactly (Home goes back); fly forward and fly back: camera and target move together along the view, so you travel through the scene; hold to keep going.
- **Preview**, which changes only the preview, never the card: [visible size](./objects#visible-size) draws small models larger; **look** steps through diagram, realistic and mixed, and back to the card's own; **hold** stops all motion and the scene clock, so moving and spinning things are easy to tap and drag; **isolate** shows the selected object alone (a system with what it holds).
- **Edit**: undo and redo.

The units of the open scene or system, and a scale bar for where the camera looks, sit at the bottom right of the preview.

- **Turn the view** as on the dashboard: drag to orbit, shift-drag, middle-drag or two fingers to pan, scroll or pinch to zoom (a touchpad swipe pans), `W` and `S` to fly forward and back. The preview does not follow moving points. The home button in the toolbar goes back to the start view.
- **Select:** tap a point or an object to open it in its list. An object gets a box round it; a ring, path or beam is selected by tapping near its line. Opening a row in a list selects it on the scene too.
- **Drag a point** to move it. `xyz` and `polar` points slide at their own height, so a drag never changes `y` or `alt`; `latlon`, `altaz` and `cell` points follow the surface of their object. The toolbar shows the new numbers while you drag, and the point keeps its placement form. Points placed by `sky`, `at`, `part` or an entity do not drag.
- **Drag an object by its point.** An object whose `at` names a point moves with that point, so dragging the object drags the point (and everything else standing at it). A body (a sphere, a model) drags this way at any time, as a press on it is a press on its point. Any other object (a grid, a ring, a volume) drags once it is selected; before that, a drag on it turns the view. The object stays selected in the Objects tab and the point's new numbers are saved. An object placed by `at: [x, y, z]` (or with no `at`) does not drag: type its position in its form, or give it a point to stand on.
- **Place a point** (the marker button in the toolbar): the next tap adds a point there. On a sphere it gets `latlon`, on a dome `altaz`, on a plane grid its `cell`, on another object `xyz` on that object, and on blank space `xyz` on the ground. Escape cancels. An object needs an `id` for a point to stand on it.

## Undo and redo

Every change in the Studio can be undone: **Ctrl+Z** (Cmd+Z on a Mac) or the undo button in the toolbar, and **Ctrl+Shift+Z** or **Ctrl+Y** to redo. Typing in one field, or dragging one slider, is one step. In a text box and in the YAML tab's editor the keys undo your typing there instead. Cancel still leaves the card as it was when you opened the Studio.

## Tabs

The tabs are in the order a card is built. The Studio opens on **Starters** for a new card (empty, or still the scene a new card is placed with), else on **Objects**. Each tab starts with a short guide (closed; select it to open) with links to these pages.

| Tab | Edits |
|---|---|
| **Starters** | A gallery of whole scenes and parts to try and copy into the card. |
| **Scene** | How the scene works, then sections: Units (the scene's units, see [Scale: Units](./scale#units)), Look, Time (the scene date, its rate, the time scale), Warp, Space (stars and depth dust), Background (a background animation behind the scene) and Labels. |
| **Objects** | Every object, with a form for its type. |
| **Points** | Every point: placement, the object it stands on, entity, label, style, marker, colour, a pinned card. See [Points: in the Astrometrics Studio](./points#in-the-astrometrics-studio). |
| **Camera** | The named views and the view the card starts with (or a guided tour), then sections: Controls, On-card buttons, Flying, Turning and Limits. |
| **YAML** | The whole config, with completion from the card's schema. |

### Objects

**Add object** opens a gallery of every type, a picture and a line each, grouped by what they are for: **Maps and grids**, **Bodies**, **Routes and motion**, **Light and clouds**, **Ships and models** and **Systems** (the same lines as [Objects: which type for what](./objects#which-type-for-what)). Select one to add it. The new object gets an id and the keys its type needs: a path or beam runs between the first two points of the scene, or across the centre when there are none. It is placed where the preview looks (on the point there, when there is one), and when its default size would be lost in the view or fill it, it is sized to the view: a grid added to a galaxy seen from 140,000 light years is 100,000 across. Changing a grid's or volume's shape keeps its size (a plane's `size` becomes a disc's `radius`). A model added where the scene or open system names its units has no `size`: it is drawn at its [real size](./objects#real-size). The preview flies to it once its file is in, and again when you pick another file. Its form says what the file measures and how it is drawn, with **Show**, **Fit to view**, **File size** and **Real size**, and **Length (m)** for a file not at its true scale.

Each row says the object's id, its type and one key value (its shape, size or where it stands), and whether it is hidden or follows an entity. Each object's form is made from the card's options for its type and grouped by what the keys do: the type's shape and size first, then **Appearance** (colours, opacity, line widths, effects; open), **Position and motion** (`at`, rotation, face, spin), **Visibility and distance** (visible, the distance fades, `hide_in_systems`, `look`) and **Actions and tags**, with **Advanced** for the few keys most scenes never need. Numbers with a fixed range (opacity, 0 to 1) are sliders with a box beside them; fonts use the font picker, colour lists the colour list editor, and a length shows its unit beside its value: the scene's (or the open system's) `units`, `units` when it names none, `px` for screen sizes and `m` for a model's length. Nested options (a fill effect, ring labels, cells) open as sections of their own; an option you switch on (stars, dust, buttons, pulse) has its switch in its section's header. The shape of a grid, volume or image is a row of pictures: select one to change it. Keys that apply only to another shape or pattern of the same type (a grid's `spoke_count` on a plane, say) are hidden until set. A brightness range (stars, dust, a nebula's clouds) is two sliders, the faintest and the brightest. Actions and anything the form cannot show as fields are YAML editors with completion.

A prism volume's outline has its own panel: a row per corner (x and z from the object's position, with move up, move down and remove), **Add corner**, **Edit on preview** and **Draw new outline**. Edit on preview puts the corners on the prism's base in the preview: drag one to move it (it snaps to the spacing of a grid in the scene, else to about a twentieth of the outline; hold Shift to place it freely), tap a + between two corners to add one there, and select a corner and press Delete to remove it. Draw new outline starts over: tap the ground for each corner in order, then tap the first corner (or **Close outline**) to finish. Each change is one undo step; Esc or **Done** stops.

A field with a link button can follow an entity: the button turns it into a panel under the field's name with the entity, its attribute (a list of that entity's attributes), range and to boxes of [Settings from entities](./data#settings-from-entities), and the button with a line through it turns it back into a plain value. Numbers, the scene's `look`, `warp`, the clock's `date` and `rate` all have one. A template on a key shows as text in the same kind of panel. Settings that follow entities in your YAML load the same way: the object's row says what it follows, and a section that holds one (Appearance for `opacity`, Position and motion for `spin`, a deformation step) opens on its own.

### Scene

- **Time:** the scene date is **Now** or a **Date and time** (a date picker). Its rate is a list: Live (real time), Paused, and an hour, a day, 30 days or a year a second, forward or backward; **Custom** takes any amount of seconds, minutes, hours, days, weeks, months or years a second. The time scale is a slider from 0 (hold) to 4 times as fast; faster can be typed.
- **Space** holds the stars and the depth dust, which are part of the 3D scene and turn with the camera. **Background** is the same background animation editor as on other LCARdS cards: a flat picture behind the scene that does not turn with the camera.
- **Labels:** **Every label** sets what all labels start from, with the same text controls as the button and elbow editors (font picker with a preview, size, weight, letter spacing, transform, position, colours, background). **Label styles** lists the built-in title, major, minor and tiny styles with their size and priority; open one to change it (what you set wins over the built-in) and use the restore button to go back. Add your own styles by name. Overlap and pixel snapping are switches.

### Camera

The Views section ends with **Start with**: the view the card opens on, or (the route button) a guided tour: an entity and its stops, each a view and, if you want, the scene date and rate there. Below it, the camera's settings are in sections: Controls (drag, pan, wheel, zoom, double-tap), On-card buttons, Flying (duration, easing, follow, warp streaks), Turning (auto-rotate) and Limits.

File fields (a model's `src`, a planet's or ring's `image`, an image object's `src`) pick from the asset library, a custom path, or the Home Assistant media browser, where your own models are under **LCARdS**, **My models**. See [Your own models](./models#pick-it).

Each object can move up or down the list, be duplicated (with a new id) or deleted.

A [`system`](./objects#system) row has an **Open** button, shown while the row is closed: the preview flies to the system and the Points, Objects and Starters tabs edit its lists, in its units, until **Back to the scene** (which flies back to the start view). See [Scale: in the Studio](./scale#in-the-studio).

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

[Starters](./starters) are ready-made scenes and parts, copied into your config: change anything afterwards, nothing refers back to them. The tab shows them as a gallery of pictures, scenes first, then parts. Select one to open it: a larger picture, what it is, what it adds ("Adds 4 points, 6 objects"), its settings, and the YAML it adds (under **YAML**, following the settings as you change them).

- **Try in the preview** shows the starter on the card without changing anything. A bar over the preview names it: **Keep** puts it in, **Discard** goes back. While you try one, its settings can still change (the preview follows) and the other tabs wait.
- **Scenes** (a galaxy, a sector map, the sky dome, a solar system, a Federation map, a starbase approach, ...): **Use this scene** replaces the card's scene. **Merge into the scene** adds its points, objects and views to yours and keeps your camera settings, start view and backdrop.
- **Parts** (a planet with moons, an asteroid belt, a nebula field, a set of territories, ...): **Add to the scene** adds one next to what is there. Its ids start with the name you give it (`mars_body`, `mars_orbit`), so the same part can be added twice under two names. Its centre is a point of your scene (such as `sun`) or coordinates.

With a system open, parts go into that system (its ids still unique across the card, its views the card's). A part with sizes (a planet, a belt, a comet, a nebula field, territories, the Badlands, the Nexus, the wormhole, a starbase) starts at real sizes when the scene or system names its units: a planet the size of Earth one au out in a km or au system, a starbase at its model's real length. In a scene without named units it is sized to fit what is there (about a quarter of the scene's size), and its settings say **Sized to fit this scene**; in an empty scene it keeps its own sizes. The size fields show their units, and what you type wins. An open scene starter says which units it is in. The scene's units are set in the Scene tab, **Units** ([Scale: Units](./scale#units)).

A part in other units than your scene (the Star Trek parts are in light years) cannot go next to it: its tile is dimmed and says so. Open it to start over with the scene it is made for and add it (**Start with Star Trek galaxy and add it**), or to let it replace the scene; a scene in other units can replace yours but not merge. In an open system such a part offers **Back to the scene to add it**, and scenes always act on the whole card. The chip at the bottom right of the preview shows the units of the scene, or of the open system. Under it, a scale bar shows how long a round length ("20,000 ly", "10,000 km") is on the preview where the camera looks; it changes as you zoom, so you can see what sizes to type for a new object.

A starter you put in is one undo step: undo takes it out again. If any point, object or view id it adds is already in the card, nothing is added and the message names them.

## YAML stays yours

The Studio writes the same YAML you would write by hand, and keeps keys it has no field for. Anything can be finished in the YAML tab, or after Save in the card editor's YAML.
