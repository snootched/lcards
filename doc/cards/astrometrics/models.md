---
description: "Your own 3D models on the LCARdS Astrometrics card: put a glTF file (.glb or .gltf) in the My models folder, pick it in the Astrometrics Studio, then size, turn and label it. Where models come from, licensing, and making a big model light."
---

# Your own models

The [model](./objects#model) object draws a 3D model from a glTF file (`.glb` or `.gltf`). LCARdS ships a few [built-in models](./objects#built-in-models) (the Constitution-class and Galaxy-class starships, Deep Space 9, Earth Spacedock, a Utopia Planitia drydock). Any other ship, station or object can come from a file of your own.

In short:

1. Get a `.glb` file (see [where models come from](#where-models-come-from)).
2. Copy it into `/config/www/lcards/models/` (the [My models folder](#the-my-models-folder)).
3. In the [Astrometrics Studio](./studio), add a model object, set **Src** to **Browse Home Assistant media**, and pick it under **LCARdS**, **My models**.
4. Set its `size`, and `rotation` if it faces the wrong way ([make it fit](#make-it-fit)).

## Where models come from

- **Community sites** such as Sketchfab have many fan-made ship and station models, some free to download. Pick **GLB** when the site offers it; a **glTF** download is a folder (a `.gltf` file with a `.bin` file and textures) that works too, kept together.
- **Your own**, made in Blender or any 3D tool that exports glTF.

**Check the license before you use a model.** Fan-made models of ships from films and series are fan art of designs their studios own, and some uploads are taken from games without permission even when the page shows an open license. LCARdS does not ship, link to or download third-party models; what you load on your own dashboard is your call.

## The My models folder

LCARdS keeps your models in `/config/www/lcards/models/` and shows that folder in the Home Assistant media browser as **LCARdS**, **My models**.

- `/config/www/lcards/` is the LCARdS user folder; `models/` in it is for your models (other kinds of files may get folders beside it later).
- LCARdS creates the folder when it starts. **Updating LCARdS never touches it**: updates replace `custom_components/lcards/`, not `www/`. It is in your Home Assistant backups like the rest of `/config`.
- Like everything in `/config/www`, the files can be fetched without logging in by anyone who can reach your Home Assistant and knows their names. Keep only models there.
- Copy files in with the File editor or Studio Code Server add-on, a Samba share, or any way you reach `/config`. Subfolders are fine (`ships/odyssey.glb`). Keep a `.gltf` and its `.bin` and texture files together in one folder.
- The browser lists `.glb` and `.gltf` files only. Uploading through the media browser does not work here: Home Assistant's own media folder only takes audio, video and images, which is why LCARdS has its own.

## Pick it

In the Studio, a model's **Src** (and every image field: a planet's texture, an image object) has three sources:

| Source | What it sets | For |
|---|---|---|
| **Asset library** | `builtin:<name>` | The models (or images) LCARdS ships |
| **Custom path** | `/local/...` or an `https://` URL | A file anywhere in `/config/www` (it is `/local/...`), or on a web server that allows it |
| **Browse Home Assistant media** | `media-source://...` | My models (and, for images, your Home Assistant media) |

The same in YAML:

```yaml
objects:
  # from My models, as the media browser picks it
  - { type: model, id: odyssey, src: media-source://lcards/my_models/odyssey.glb, size: 60 }
  # any file in /config/www
  - { type: model, id: runabout, src: /local/models/runabout.glb, size: 8 }
```

A file from another web server only loads if that server allows it (CORS); download the file instead when in doubt. A page that offers a download does not count: the link has to be the file itself.

## Make it fit

A model from elsewhere comes in its maker's units, facing their way, with their part names.

| Key | Use |
|---|---|
| `size` | Its largest extent in scene units. Whatever units the file uses, `size` scales it to fit. To keep models in proportion, leave `size` out in a scene with `units`: each is drawn at its [real size](./objects#real-size). |
| `length` | Its real length in metres, for a file not at its true scale (many downloads are not): drawn that long at its [real size](./objects#real-size), whatever the file measures. |
| `file_units` | The units the file was made in (`m` default; `cm`, `mm`, `km`, `ft`, `in`), for its real size. glTF files are in metres unless their maker got it wrong: if a model comes out a hundred times too large, try `cm`; at an odd scale, give its `length` instead. |
| `rotation` | `[x, y, z]` degrees. LCARdS models face +z (bow forward); a model that comes in sideways or nose-up needs a quarter turn, e.g. `rotation: [0, 90, 0]` or `[-90, 0, 0]`. |
| `material` | `hologram` (default) works on any model: glow, rim, scanlines, edges. `original` shows the file's own colours and textures, lit. |
| `face: motion` | On a moving point, the model turns to face where it is going. See [points](./points). |

**Labels on its parts.** `part:` puts a point on a named part (a node in the file). Names in downloaded files are often like `Object_12`; in the Studio's Points tab the part list fills in from the file once it has loaded, so you can try them. See [points on a model](./objects#model).

## Make it light

The model is drawn on every frame the scene moves, and downloaded with the dashboard. The built-in ship has 6,500 triangles in 147 KB; models made for games or renders can have 100,000 or more, and tens of MB of textures.

- **Feature edges** are off by default on a model over 250,000 triangles: working them out takes seconds on a model that dense (2.5 million triangles froze the page for 11 seconds), and they would be noise anyway. `edges: true` draws them.
- **Any size loads**, but every device that shows the dashboard downloads the whole file and holds it in memory: a 100 MB model is slow to appear on a phone and may not load on a small tablet. A smaller file is better for all of them.
- **Compress and simplify** with [glTF Transform](https://gltf-transform.dev/) (needs Node.js):

```sh
npx @gltf-transform/cli inspect ship.glb                     # triangles, textures, sizes
npx @gltf-transform/cli simplify ship.glb ship-small.glb --ratio 0.25
npx @gltf-transform/cli resize ship-small.glb ship-small.glb --width 1024 --height 1024
npx @gltf-transform/cli meshopt ship-small.glb ship-small.glb
```

- **Draco** compression is not supported (the loader is not shipped); `meshopt` above writes a file the card reads. Blender's Decimate modifier also reduces triangles before export.
- A hologram ignores textures, so a model you only show as a hologram can be exported without them.

## When it does not show

A dim stand-in box shows while the file loads, and stays if it fails. The browser console (filter on `Astrometrics`) says why:

- **not found / could not resolve:** the path or the picked file is gone; pick it again.
- **slow to appear, or the tab runs out of memory:** the file is too big for that device; see [make it light](#make-it-light).
- **Draco-compressed:** convert it with `meshopt` as above.
- **blocked (CORS):** the file is on a server that does not allow it; copy it into My models.
- **has no part:** the name is not in the file; the message lists the names it has.
