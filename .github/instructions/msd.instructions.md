---
applyTo: src/msd/**
---

# LCARdS MSD (Master Systems Display) Rules

---

## When to Use MSD vs LCARdSCard

| Need | Use |
|------|-----|
| Single-purpose card (button, slider, chart, label) | `LCARdSCard` |
| Full-canvas SVG with multiple overlays, routing lines | `LCARdSMSDCard` (extends `LCARdSCard`) |
| Complex multi-overlay display with drag-drop studio editor | `LCARdSMSDCard` |

`LCARdSMSDCard` is **not** a separate base class — it extends `LCARdSCard` and adds the MSD **pipeline** on top. All card lifecycle rules still apply.

---

## MSD Pipeline Stages

The pipeline runs on every config update (`_handleFirstUpdate`, `_onConfigUpdated`):

```
Config (raw YAML)
  ↓
ConfigProcessor      — normalizes, expands shortcuts, resolves pack refs (delegates pack merging to core.configManager.processConfig())
  ↓
PipelineCore.initMsdPipeline()  — top-level orchestrator; creates MsdCardCoordinator (owns RouterCore + the other
  │                                 per-card singletons: themeManager, dataSourceManager, animationManager, ...)
  ├─ CardModel.buildCardModel()      — resolves base_svg/viewBox/filters, normalizes overlay shape
  └─ new ModelBuilder(mergedConfig, cardModel, coordinator)
       ↓ (on every re-render)
     ModelBuilder.computeResolvedModel() — merges packs + presets into the final resolved overlay tree
  ↓
AdvancedRenderer     — renders SVG base + overlay positions, phase 2a (controls) / 2b (lines), then a z_index reorder pass
  ↓
AnimationManager     — wires triggers to rendered overlay elements (+ base_svg, via a synthetic `__msd_base_svg` scope)
  ↓
DOM output           — SVG `<g>` overlay groups + foreignObject-embedded HA cards for controls
```

Each stage produces an immutable model that the next stage consumes. Don't mutate pipeline output objects — create new configs and re-run the pipeline.

---

## Overlay Architecture

There are exactly **three overlay types**: `line`, `control`, and `shape`. Anything else (buttons, charts, labels) is a regular LCARdS card embedded *inside* a `control` overlay's `card:` config — MSD does not define its own widget types for those.

```yaml
overlays:
  - id: my-control
    type: control
    position: hub              # named anchor, another control's id, or [x, y]
    size: [120, 40]
    attachment: center         # which point of THIS control aligns to position
    z_index: 200                # optional; default 200 for controls (paints over lines)
    locked: false                # optional; editor-only — disables drag/resize in MSD Studio
    card:
      type: custom:lcards-button
      preset: lozenge
      # ...any normal card config...

  - id: my-line
    type: line
    anchor: my-control          # start: named anchor, overlay id, or [x, y]
    anchor_side: right          # which side of the anchor overlay it departs from
    attach_to: other-control    # end: named anchor, overlay id, or [x, y]
    attach_side: left
    route: auto                 # auto | direct | manhattan | smart | grid | manual
    route_hint: xy               # initial segment direction hint (xy/yx/empty)
    style:
      color: var(--lcards-blue)  # literal/token, OR a state-color object (see below)
      width: 4
      marker_end: { type: diamond, size: 33 }
    animations: [ ... ]         # optional, see Animations section below
    z_index: 100                 # optional; default 100 for lines (paints under controls)

  - id: my-shape
    type: shape
    kind: rect                  # polyline | rect | circle
    position: hub                # rect/circle: same convention as control (named anchor or [x, y])
    size: [180, 120]
    corner_style: round
    corner_radius: 12
    entity: binary_sensor.bay_occupied   # optional: drives style.color / style.fill state keys
    style:
      color: var(--lcards-orange)
      width: 2
      fill: var(--lcards-orange)          # meaningful on rect/circle/closed-polyline, unlike line
      fill_opacity: 0.15
    z_index: 50                  # optional; default 50 for shapes (paints under lines)
    locked: false                 # optional; editor-only — disables drag/resize in MSD Studio
```

Control overlays use `position`/`size`/`attachment`; line overlays use `anchor`/`attach_to`/`*_side`/`*_gap`; `rect`/`circle` shapes use `position`/`size` exactly like controls, `polyline` shapes use `points`/`closed` instead. `position_side` (control-only) targets a specific side of another *control* when `position` references its id, mirroring line `attach_side`. **Overlays are rendered as SVG `<g>` elements positioned in viewBox coordinate space** — control overlays specifically use `<foreignObject>` to embed the HA card; never position them with CSS.

`locked` is supported on `control` and `shape` overlays only (not `line` — line/polyline hit-testing already goes through real rendered path geometry, not a synthetic bounding box, so they don't share the "large mostly-empty overlay blocks smaller ones underneath" problem locking solves). It's purely an MSD Studio editor concept — disables drag/resize/vertex-editing on the canvas (a locked overlay's hit-box becomes `pointer-events: none`, so clicks fall through to whatever's visually underneath) but has no effect on runtime rendering; a locked overlay stays fully editable via its list-panel Lock icon or property form.

### Shape overlays

`ShapeOverlay` (`src/msd/overlays/ShapeOverlay.js`) is a **sibling of `LineOverlay`, not a subclass** — it has its own `_resolveShapeStyles()` adapted from the functional subset of `LineOverlay._resolveLineStyles()` (deliberate, scoped duplication; see the file header comment before "fixing" this by extracting a shared base — a second consumer needing the exact same logic hasn't shown up yet). Three `kind`s:

- **`polyline`** — `points` (literal `[x,y]` or static anchor-name strings, min 2) + `closed`. Renders via `RouterCore.buildRouteRequest()`/`computePath()` forced to `route: 'manual'` — the same public methods `LineOverlay` itself calls, so corner-rounding/Chaikin smoothing (`corner_style`/`corner_radius`/`corner_angle`/`smoothing_mode`/`smoothing_iterations`, all reused as-is from the line/root-level fields) come for free. `RouterCore._cacheKey()` folds `req.waypoints` into the key, so an interior-point edit with endpoints unchanged can't hit a stale cached path; `ShapeOverlay`'s own `routerCore.invalidate(overlay.id)` call before every `computePath()` is now belt-and-suspenders, not load-bearing.
- **`rect`/`circle`** — native `<rect>`/`<ellipse>` (never `<circle>`; `ellipse` with `rx=size[0]/2, ry=size[1]/2` is a strict superset), reusing `position`+`size` exactly like `control` overlays (no `attachment` offset map — `position` is always the top-left corner). `corner_radius` maps to `rx`/`ry` for `rect`; no effect on `circle`.

**Attachment points**: shapes register into `AttachmentPointManager` inline in `AdvancedRenderer`'s render loop (before `_buildVirtualAnchorsFromAllOverlays` and before any line that might target the shape renders), so a `line` can `attach_to` a shape's corner/vertex exactly like it attaches to a control. `rect`/`circle` get the standard 9-point bbox grid via `OverlayUtils.computeAttachmentPoints()` **plus kebab-case corner aliases** (`top-left`/`top-right`/`bottom-left`/`bottom-right` alongside the camelCase keys) — required because `LineOverlay._resolveAttachTo()` lowercases `attach_side` before building its lookup key, and `'topLeft'.toLowerCase()` matches neither casing; only the alias survives. `polyline` vertices register individually as `<shapeId>.vertex<N>`. If you touch shape attachment registration, keep the alias — dropping it silently breaks corner attachment with no error, just a wrong/fallback position.

**Fill is a first-class citizen for shapes** (unlike `line`, where fill is incidental to self-intersecting paths) — `style.fill` accepts the same state-color object as `style.color`, resolved against the shape's own `entity`/`state_attribute`/`ranges_attribute`. Both `AdvancedRenderer.updateLineEntityColors()` (live entity-bound refresh) and `lcards-msd.js`'s rules-engine DOM-patch fast path handle `fill` in parallel with `color`/stroke — if you add a third live-refreshed style property to either overlay type, update both paths, not just one (a real gap that shipped and was reported before being caught: fill silently never refreshed live while stroke did).

### Line state-color (entity-bound stroke color)

`style.color` accepts the same state-color object shape used by buttons/sliders, resolved against the line's own `entity` field (line overlays have their own `entity`/`state_attribute`/`ranges_attribute`, independent of any control's entity):

```yaml
- type: line
  entity: binary_sensor.reactor_core
  style:
    color:
      active: var(--lcards-green)
      inactive: var(--lcards-red)
```

### Markers

`style.marker_start` / `style.marker_mid` / `style.marker_end`: `{ type: arrow|triangle|diamond|dot|line|square|rect, size, fill, stroke, stroke_width, align: center|edge }`. `fill`/`stroke` accept the literal string `"match_line"` to inherit the line's own resolved color and stay in sync when it changes live (entity-bound or templated).

---

## Animations in MSD

All three overlay types accept an `animations:` array (line/control/shape), and `base_svg.animations:` targets elements *inside* the parsed base SVG by id/class using the same syntax. All four registration points funnel through the same `AnimationManager`/`ANIMATION_PRESET_PARAMS_SCHEMAS` system documented in `.github/instructions/animation.instructions.md` — see that file for the full preset reference, canonical-field semantics, and `map_range` live-speed adjustment. MSD-specific notes:

- **Controls need `data-overlay-id` to animate at all** — `MsdControlsRenderer.js` sets this on every control's `<foreignObject>` specifically so `PipelineCore`'s animated-overlay DOM lookup can find it. If you ever touch control-rendering code, don't drop this attribute.
- **`target`/`target-selector` scope**: an animation declared on an overlay is scoped to that overlay's own rendered subtree by default (`overlayElement.querySelectorAll(selector)` for `target`); `base_svg.animations` is scoped to `#__msd-base-content` specifically via `searchRootSelector` in the editor's target picker.
- **RulesEngine-triggered animations** (`apply.animations` targeting an overlay by `overlay:`/`tag:`/`type:`/`pattern:`) need the target overlay to already have registered a scope — `AnimationManager.initialize()` cross-references rules against overlays at startup and registers an empty scope for any direct-`overlay:`-targeted overlay with no animations of its own, so a rule can still play an animation on it. This does **not** extend to `tag:`/`type:`/`pattern:` targeting yet — a rule using those against a zero-animation overlay will silently fail to find a scope.
- **`motionpath` preset's `params.shape`** (self-contained "tracer" mode — draws and moves its own shape along a path, e.g. for "energy flow along a line") is the recommended way to animate something traveling along a line — target an existing control/base_svg element for `motionpath` only if you specifically need to move something that already exists for other reasons.

---

## Z-Ordering

`z_index` is supported on all three overlay types. Implicit defaults (applied when unset) reproduce the pre-Phase-3 paint order plus `shape`'s slot beneath it: **controls: 200, lines: 100, shapes: 50** (controls paint over lines, lines over shapes). Background (`base_svg` / `background_animation`) is *not* part of this numeric scale — it's always furthest back via plain CSS `z-index: -1`, in a separate DOM subtree.

---

## Background Layer System

Two independent mechanisms, don't conflate them:

- **`base_svg.render_visual: false`** — stops the base SVG from being *painted* (it's still parsed for anchors as normal) — use when you want a plain image/animated background instead of the SVG blueprint itself as the visual.
- **`background_animation`** — the same layered canvas background system used by buttons/elbows (`BackgroundAnimationRenderer`, `BACKGROUND_PRESETS`), including the `image` preset for a plain static image background. Lives in its own DOM subtree behind the SVG.

Typical pairing: `render_visual: false` + `background_animation: { layers: [{ preset: image, ... }] }` for "just use a photo/jpg with manually-placed anchors, no complex SVG blueprint."

---

## Routing Lines

Per-line routing choices — `route`/`route_hint`/`route_hint_last`/`waypoints`/`route_channels` — live directly on each `type: line` overlay (see Overlay Architecture above). Global routing *tunables* (trunk/crossing knobs, grid/turn penalties, smoothing, cost weights) live in the `msd.routing` object, and authored channels live in `msd.channels` (NOT `msd.routing.channels` — `MsdCardCoordinator` assembles RouterCore's config as `{ ...mergedConfig.routing, channels: mergedConfig.channels }`). `route: manual` uses `waypoints` (coordinates — optionally `[x, y, radius]` to override that corner's `corner_radius` — or anchor names, in path order); every other `route` value is pathfinding — don't hand-position routed lines, the pipeline computes the path from the anchor points and routing mode. Caveat: `route: auto` always means full pathfinding (it resolves to `smart`, or `default_mode` if one is configured) regardless of whether obstacles/channels are present. The cheap escape hatch (no bundling/crossing-avoidance) is choosing `route: manhattan` or `route: grid` explicitly. RouterCore internals (registries, derived lane assignment, discovery-loop convergence discipline): `doc/architecture/msd/routing.md`.

A channel's own `route_channels`-based opt-in and RouterCore's automatic trunk *discovery* are two separate mechanisms — `route_channels` on a line controls whether a channel is mandatory/cost-biased for it, but discovery runs for every `auto`/`smart`/`grid` line regardless, offering ANY nearby channel as a bundling candidate whether or not that line references it. Set `discoverable: false` on a `msd.channels.<id>` entry to scope it to only lines that explicitly list it in their own `route_channels`.

`route_hint`/`route_hint_last` (`xy`=horizontal first/vertical last, `yx`=vertical first/horizontal last) govern `smart`/`grid` modes too, not just `manhattan` — `RouterCore._computeGrid()` both biases its A* search toward the hint and, more importantly, uses it to pick the elbow direction when snapping the grid-quantized path back onto the exact anchor/attach coordinate (the dominant factor in practice, since typical anchor spacing vs. `grid_resolution` usually collapses the A* search itself into a single row/column with no real direction choice). Get the direction right here specifically — if the elbow logic ever needs to insert a new corner near an anchor, it must extend the grid's own existing leg in place when that leg already runs the hinted direction, rather than unconditionally inserting a new point; doing the latter leaves the grid's original corner behind as a redundant micro-detour ("go the wrong way a few px, then correct back") that reads as the line looping/spiraling near the anchor.

`anchor_side`/`attach_side` (`left`/`right`/`top`/`bottom`) auto-derive `route_hint`/`route_hint_last` when the hint isn't set explicitly — this applies unconditionally, including when the referenced `anchor`/`attach_to` is a plain `[x, y]` coordinate or a named point anchor (e.g. an SVG-scavenged extremity) with no bbox to actually reposition against. Corner values (`top-left`, etc.) and `center` are ambiguous for a single axis and fall through to the geometry-based default (`dx >= dy ? 'xy' : 'yx'`). Precedence: explicit `route_hint`/`route_hint_last` > `anchor_side`/`attach_side` > geometry.

**Corner clearance is stroke-width-aware**: a rounded/beveled corner's radius is clamped against neighboring lines' rendered *edges*, not centerlines — `style.width` (default `2`) is netted out of the raw distance in `_distanceToNearestOtherLineSegment`. A thicker line gets a smaller effective radius at the same lane spacing; this is the fix for the "outer edge curves, inner edge squares off" artifact at high stroke width, not a separate arc-math concern. A per-line `stub_length` override (viewBox units) can also bypass the router's own auto/forced stub-length computation directly — see `doc/cards/msd/routing.md`'s "Corner Size" section.

**Known, deliberately-deferred routing limitations** (each investigated with a real attempted fix, not just noticed): `trunk_proximity` is a hard bundling cutoff with a confirmed cliff at its boundary — a widening attempt regressed an already-correct scenario and was reverted; `_mergeCorridors`'s chain ordering can rarely pick a suboptimal order when a line chains through mixed horizontal/vertical trunks (only seen in synthetic many-line stress tests). Full details: `doc/architecture/msd/routing.md`'s "Known Limitations" section.

---

## MSD Studio Dialog

The visual editor (`src/editor/dialogs/lcards-msd-studio-dialog.js`) is the primary way users configure MSD cards. A few conventions if you're touching it:

- **Shared chrome**: `studio-dialog-styles.js` for the main dialog frame (imported by all Studio dialogs — Chart/Layout/Data Grid/MSD); `studio-subform-dialog-styles.js` for nested subform dialogs (line/control edit forms, the embedded card-editor modal) — both use distinctly-named classes (`.subform-*`) specifically to avoid colliding with the main dialog's own canvas-interaction class lookups (`.preview-panel`/`.config-panel`).
- **Live preview**: `lcards-msd-live-preview.js` fully destroys/recreates the preview `<lcards-msd-card>` on every config change *and* hass tick — if you're wiring something that depends on a stable live-preview element reference (e.g. an animation editor's target picker), don't cache it; re-fetch via `_getLivePreviewCardElement()` on demand. Two complementary mechanisms handle this, and new code should prefer the second over inventing a third: a manual "Refresh Element List" button (dispatches a `refresh-targets` event the parent catches with `this.requestUpdate()`, which re-fetches the card element fresh); and, since a user won't always know that button exists or when they need it, a **self-healing retry**: when a scoped DOM query comes up empty (e.g. `<lcards-animation-editor>`'s `searchRootSelector` lookup failing in `_getTargetOptions()`), the component that owns the failing query dispatches that same `refresh-targets` event itself *and* calls `this.requestUpdate()` on itself unconditionally — the latter matters because if the parent's re-fetch happens to return the exact same object reference (element wasn't swapped, just hadn't finished rendering yet), Lit's property-diffing (`!==`) won't re-invoke the child's `render()` on its own. Bound the retry (e.g. ~10 attempts, short delay) so a selector that can genuinely never resolve doesn't loop forever. Don't reach for a fixed-delay `setTimeout` guess instead — it was tried first here and confirmed unreliable, since neither the preview's debounce nor the MSD pipeline's render time is fixed.
- **Editing an existing control/line, not creating a new one**: always resolve the array index via the *stable* editing id captured at edit-open time (`_editingControlId`/`_editingLineId`), never via the live, user-editable ID form field — renaming while editing must update in place, not push a duplicate.
- **Saving a control/line**: spread the existing overlay object before applying explicit field overrides (`{...existingOverlay, ...explicitFields}`), so fields the form doesn't manage survive a GUI save instead of being silently dropped. Controls, lines, and shapes each have a dedicated Animations subtab (`_renderControlFormAnimation()`/`_renderLineFormAnimation()`/`_renderShapeFormAnimation()`) wired to their own `_<x>FormAnimations`/`_<x>FormData.animations` state and saved explicitly — not relying on the spread-survives-unmanaged-fields fallback.
- **Debug canvas overlays** (grid, bounding boxes, channels, routing grid, discovered trunks, etc.) follow one array-driven pattern: a `{ key, prop, icon, tooltip }` entry in `overlayToggles`, a matching `_<prop>` reactive property (default `false` — these are debug aids, off by default), a `_render<X>Overlay()` method reusing `_getPreviewSvgAndViewBox()`'s coordinate-transform pattern, and a call site in the main overlay-render list. The Routing Grid (amber, router's own resolved `grid_resolution`, via `router.resolvedGridResolution()`) and Discovered Trunks (cyan, `origin: 'discovered'` rows only — config-authored channels are left to the existing channels overlay to avoid double-rendering, via `router.trunks()`) both reach the live router the same way: `preview.msdCard._msdPipeline?.coordinator?.router`. Add new debug overlays the same way rather than inventing a new toggle mechanism.

---

## Accessing the MSD from the Browser Console

```javascript
// Get all MSD cards
window.lcards.cards.msd.getAll()

// Get by config ID
window.lcards.cards.msd.getById('my-msd')

// Debug: inspect pipeline state
window.lcards.debug.msd.*

// Access card's pipeline directly (from the element)
const card = window.lcards.cards.msd.getById('my-msd');
card._msdPipeline        // full pipeline instance
card._msdConfig          // processed MSD config
card._fullConfig         // merged config (packs + user)
```

---

## `_applyRulePatches()` in MSD

`LCARdSMSDCard` overrides `_applyRulePatches()` (unlike simple cards which use the single-overlay base implementation). MSD patches are keyed per overlay ID and applied to the overlay model, then trigger a pipeline re-render of only the affected overlays.

Do **not** call `this._getMergedStyleWithRules()` directly in MSD overlay renderers — rule patches to overlay configs are injected by `PipelineCore` before `AdvancedRenderer` runs.

---

## Pack System Integration

Packs are loaded by `PackManager` and can supply themes, presets, animation configs, and overlay type definitions. MSD merges packs via `mergePacks()` from `src/core/packs/mergePacks.js`.

When writing MSD overlay logic that references preset names or theme tokens, assume packs are loaded before render — the `PackManager` initializes synchronously during HASS first contact.

---

## MSD Debug API

```javascript
// Inspect overlay positions/geometry
window.lcards.debug.msd.overlays.tree('my-msd')       // full resolved overlay tree
window.lcards.debug.msd.overlays.list('my-msd')       // flat overlay list
window.lcards.debug.msd.overlays.getBBox('my-overlay-id', 'my-msd')

// Force pipeline re-run
window.lcards.debug.msd.pipeline.rerun('my-msd')

// Dump pipeline instance
window.lcards.debug.msd.pipeline.getInstance('my-msd')

// Routing: read a line's cached route (incl. meta.debug: resolved
// stubLength/gridResolution/cornerRadiusMode/cornerRadius), router stats,
// or every trunk row currently in effect
window.lcards.debug.msd.routing.inspect('line_id')
window.lcards.debug.msd.routing.stats()
window.lcards.debug.msd.routing.trunks('my-msd')
```

---

## Anti-patterns

❌ Don't create a custom base class between `LCARdSCard` and `LCARdSMSDCard` — the hierarchy is fixed
❌ Don't mutate overlay config objects returned by the pipeline — they are shared; create new config and re-run
❌ Don't position overlay elements with CSS manually — always use `position`/`anchor` in the overlay config so routing lines stay connected
❌ Don't call `AnimationManager.onOverlayRendered()` directly — `PipelineCore` calls it automatically after rendering each overlay
❌ Don't hand-position routed lines — the pipeline computes paths from anchors + routing mode; per-line choices go on the `line` overlay, global tunables in `msd.routing`, channels in `msd.channels`
❌ Don't call `RouterCore.computePath()` with endpoints other than a line's real resolved anchors ("just to inspect"/"so the HUD sees it") — registration is a side effect of routing, and synthetic requests pollute the trunk/crossing registries under the real line's id, breaking order independence; `RouterCore.inspect(id)` reads the cache without computing
❌ Don't add a new overlay `type` for something that's really just a differently-configured control — MSD has three types (`line`/`control`/`shape`); a fourth needs a genuinely new geometry/rendering primitive to justify it (the bar `shape` cleared), not a `card:` variant, which belongs inside a `control`'s `card:` config instead
❌ Don't animate a control without checking it has `data-overlay-id` set on its `<foreignObject>` — without it, `AnimationManager` can never find the element to attach to
❌ Don't reintroduce `style.glow`/`glow_color`/`glow_size`, `pulse_speed`, `flow_speed`, a style-level `smoothing` enum, `segment_colors`, or `status_indicator` on `line`/`shape` — these were removed as confirmed-dead schema surface (parsed, never rendered); the equivalent behavior already exists via the `glow`/`pulse`/`march` animation presets (`animations:` array) at zero extra implementation cost
❌ Don't add a fixed-delay `setTimeout` to paper over MSD Studio's live-preview staleness — see "Live preview" above for why that was tried and replaced with a self-healing retry
❌ Don't reintroduce a card-level `msd.debug` config option (`enabled`/`show_anchors`/`show_routing` or similar) or a `DebugManager`-style class reading it — removed as confirmed-dead: the config-driven renderer that would've consumed it (`MsdDebugRenderer`) was deleted years ago, and debug visualization in MSD Studio (grid, anchors, bounding boxes, routing, attachment points) has been an independent editor-only HTML-overlay system ever since, driven directly by the Studio dialog's own reactive properties (`_showBoundingBoxes` etc.), not by anything in the saved card config
