---
name: lcards-models
description: Build or revise a built-in astrometrics 3D model (builtin:<name>: a starship, starbase or station) from reference stills and canon dimensions, made in code as GLB. Use when the user asks to add a new ship or station model, revise an existing one ("it looks off", "wrong size", "the arms are too curved"), add detail (windows, lights, textures), or check a model against its references or against ship scale.
---

# LCARdS built-in models

The built-in models (`builtin:constitution_class_refit`, `galaxy_class`, `deep_space_nine`, `earth_spacedock`, `utopia_planitia_drydock`, ...) are fan art made in code: a Node script builds three.js geometry and exports GLB to `src/assets/models/`. No third-party mesh, texture or traced artwork ships; reference stills are screen captures of copyrighted material, kept local in `reports/refs/` (not committed), used only to measure from.

Never commit, stage or push unless the user asks. The user checks the result in Home Assistant.

## Where things are

- Generators: `scripts/make-starbases.mjs` (stations), `scripts/make-ships.mjs` (ships; `--meshopt` also writes the test fixture). Shared geometry `scripts/lib/model-kit.mjs`: `latheY` (round profiles), `ringY` (closed rings), `latheZ` (hulls along z), `loft` (tubes through section rings, capped, auto-facing), `aerofoil`, `part`, `exportGlb`, `lean`, `roundedRect` (a section; `power` 0.45 boxy, 1 ellipse/lens), `bezier` (centre lines), `frame` (radial/tangent axes at a bearing), `placed` (a named part with a meaningful origin). In `make-starbases.mjs`: `hoop`, `beam`, `spire`. In `make-ships.mjs`: `tubeZ` (hulls and nacelles through rounded sections), `windowQuads` / `windowRing` / `windowRow` (lit windows as single quads: a box per window cost nine times the bytes).
- Pack entry (url, label, description, `parts` list): `src/core/packs/lcards-images-pack.js` `model_assets`.
- Docs table of models and parts: `doc/cards/astrometrics/objects.md` (Built-in models).
- Size test: `tests/core/astro-model.test.js` (`SIZES`, within 5%; every pack part must exist). Browser: `tests/browser/astro-model.spec.js` + `fixtures/astro-starbases.yaml`.
- Everything naming parts or sizes: `grep -rn "builtin:<name>\|part: <part>" src demo doc tests`. Starters in `src/core/astrometrics/starters/` (then `node scripts/generate-astro-starters-doc.js`), demo views in `demo/views/*.yaml` (often a block-YAML copy of a starter: edit both), the browser fixture.
- Comparison renders: `node scripts/render-model.mjs <glb> <outdir> [views json]` (ortho side/front/top/bottom plus perspective). Put renders in `tmp/` or the scratchpad, never in `src/`.

## Inputs to ask for (the user supplies them)

One folder per model, `reports/refs/m<N>/<model>/`, any file names. Most useful, in this order:

1. **Canon dimensions** (technical manuals, Memory Alpha): overall length/beam/height, plus sub-dimensions (ring diameters, core heights, pylon spans). These win over any drawing.
2. **Orthographic plates**: side, top, front elevations from technical manuals or data sheets, ideally with a scale bar or a "shown to scale" comparison with a ship.
3. Film/episode stills and model photos from several angles: for detail and to judge character, not to measure.
4. Optional `notes.md`: dimensions with sources, which source to trust when they disagree, what looks wrong today.

Ask for dimensions up front; in M2 the first pass guessed proportions from stills and the user had to supply canon numbers in round 2.

## Method

1. Convert stills to PNG and make one contact sheet per model (`magick montage`); read the sheet, then the two or three best plates full size.
2. Write the plan (`reports/astro-<session>-plan.md`): per model, what is wrong or needed, the measurements, the part list.
3. **Measure from orthographic plates in pixels**, convert with one scale factor anchored on a canon dimension (the overall width), and write profiles as `[radius, y]` pairs in metres. Check every published sub-dimension against the result.
4. Build, run `node scripts/make-starbases.mjs <id>`, render with `render-model.mjs` from the same angles as the plates, montage stills and renders side by side, compare silhouettes. Iterate before showing the user.
5. Check against ships: the model's own dimensions must be canon, since `size` (largest extent, scene units) scales each model per scene. Any scene with a ship next to a station must use matching ratios (ship size = station size x ship metres / station metres). Say so when a starter is deliberately not to scale.
6. Pack entry, docs table, size test, starters, demo view, fixtures; `npm run build`, `npm test`, `npm run test:browser`; `npm run demo:push` for the user's review.

## Conventions

- Y up, metres, origin in the middle of the model's bounding box (the card centres on it anyway); ships face +z (bow), stations put part 1 at +z.
- Parts are named nodes; a point with `part:` sits on the node's origin, so place origins where a label belongs: the front face of a ring or round hull (+z), the tip of a pylon, the top of an antenna. A point flush with or inside a surface is hidden by it: lift door/window origins clear of the surface.
- Part names are API once released (configs use them). Before a release, rename outright; after, keep or deprecate.
- Size budget: about 300 to 400 KB and under 20k triangles per model so far. Models load lazily (`/lcards/models/`), not in the main chunk, but every one ships in the release.

## Lessons from M2 (DS9, Spacedock, Utopia Planitia, 2026-10-29/30)

- **Drawings are often slightly from above.** Data-sheet elevations draw horizontal discs as ellipses; the top of a cap seen as a trapezoid is perspective, not slope. Measure heights on vertical edges (cylinder sides, rim bands), take tops and slopes from true side views or canon numbers.
- **Side views of 3-fold or 6-fold stations are projections.** DS9's pylons are 120 degrees apart, so a side plate shows them at different apparent radii. Measure an arm from the view where it is nearly edge-on to its plane, or render your model at the plate's angle (DS9's to-scale plate matched a render at about 50 degrees) instead of reading radii off it.
- **Joints start inside what they join.** A loft that starts at a section plane offset from the ring (DS9 pylons began 16 m off the ring plane) leaves a visible wedge between upper and lower parts. Start lofts inside the ring/hull they grow from, with the root section level there.
- **One section growing in two directions makes a block.** Flaring a pylon root along the bridge and along the ring with one boxy section gave a square foot. Use separate webs, each growing in one direction, and a lens section (`roundedRect(..., power = 1)`) for webs that should taper to their edges.
- **Be stingy with curvature; follow the plate.** First-pass DS9 pylons bulged out then hooked hard inward; the user called them over-curved. Fit the centre-line Bezier to the plate's arm (root, mid-height, tip), with only a modest turn-in at the tip.
- **Rings and arms read flat when built to blueprint line thickness.** Give rings real height (DS9 docking ring 40 m, habitat ring 60 m) and arms depth; the user flagged "quite flat".
- **Count structures from the top view.** DS9 has three wide bridges running core to docking ring plus three thin flanged spokes core to habitat ring, not six of either; Spacedock has four large doors in the top cone, not a hatch on top.
- **Where features sit matters as much as their shape.** DS9's weapon sail towers stand through the habitat ring, mirrored above and below it, not on the core.
- **Look at it in a scene too.** Render the starter that uses the model (temporary fixture in `tests/browser/fixtures/`, harness `tests/browser/serve.mjs`; starters return `views` at top level, the card wants them under `camera.views`) to catch hidden labels and bad framing.

## Users' own models

Users load third-party or self-made GLB files; LCARdS never ships or links to third-party models (licensing: many fan models are extracted from games). Route: `/config/www/lcards/models/` (created at setup, served on `/lcards-user/models/` (the LCARdS user folder `/config/www/lcards/` is served on `/lcards-user/`; other user file kinds go in sibling folders), survives upgrades), browsable as LCARdS, My models through `custom_components/lcards/media_source.py` (Home Assistant's own media folder refuses glTF); `src: media-source://lcards/my_models/<file>` resolves in `scene-runtime.js` `fileUrl()`. The Studio's file fields use `lcards-asset-source-picker` (schema annotation `assetSource: 'model' | 'image'`). Docs: `doc/cards/astrometrics/models.md`. Plan and results: `reports/astro-model-sources-plan.md`.

## Detail: what is possible

The format is glTF 2.0 binary (GLB); the loader (`src/core/astrometrics/model/index.js`) takes plain or meshopt-compressed files (not Draco), named nodes, PBR materials, textures and animation clips. `material: hologram` (the default) ignores materials and textures and draws rim glow, scanlines and edges; `material: original` shows them lit.

- **Windows and lights**: emissive materials on thin bands or small boxes (as now). Cheap, and they read at a distance. Real light sources in the scene are costly; prefer emissive geometry.
- **Textures**: possible in GLB (a window pattern or panel lines as an emissive or colour map). Made in code (a generated canvas or pixel buffer, e.g. a window grid) they stay our own work; they cost file size (a 1024 px PNG is 100 KB or more) and need UVs (`lean()` drops UVs today: keep them on parts that get a texture).
- **Animation clips**: the ships' `bussards` clip (a pulse); `animation:` plays them.
- **Hand-authored models**: a model made in Blender or similar and exported as GLB works the same way (`src:` a `/local/...` file for users; a built-in if it is our own work and the user agrees to ship it). Keep the conventions above: Y up, metres, origin in the middle, named nodes for parts, no Draco, a few hundred KB.
