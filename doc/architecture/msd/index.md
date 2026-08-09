# MSD Rendering Pipeline

> Internal architecture of the `lcards-msd` card — how config becomes a rendered Master Systems Display.

---

## Overview

The MSD card has a dedicated rendering pipeline that lives in `src/msd/`. It is significantly more complex than simple LCARdS cards because it composes a base SVG with an arbitrary number of positioned overlay cards, routes SVG lines between them, and applies per-overlay animations and rules.

Non-MSD cards should use `LCARdSCard` directly — the MSD pipeline is purposely isolated.

---

## Pipeline Stages

```
User config (YAML)
    │
    ▼
1. ConfigProcessor            → validate + merge pack defaults + extract SVG anchors
    │
    ▼
2. MsdCardCoordinator         → init core systems (packs, themes, datasources, rules, RouterCore)
    │
    ▼
3. CardModel.buildCardModel() → resolve base_svg/viewBox/filters, normalize overlay shape
    │
    ▼
4. AnimationManager.initialize(overlays)   → register animation definitions
    │                                          (before ModelBuilder even exists, well before any render)
    ▼
5. ModelBuilder                → resolve overlay positions, sizes, anchor bindings
    │                             (constructed here; computeResolvedModel() re-runs on every re-render)
    ▼  (produces resolvedModel)
6. AdvancedRenderer            → produce SVG markup + overlay DOM elements
    │   ├─ OverlayBase instances (control overlays)
    │   ├─ LineOverlay instances (SVG line routing)
    │   └─ ShapeOverlay instances (polyline/rect/circle geometry)
    │
    ▼
7. AnimationManager.onOverlayRendered(...) → wire each already-registered animation
    │                                          to its now-rendered DOM element
    ▼
Rendered card (Shadow DOM updated)
```

Note the two-step animation split: `AnimationManager.initialize()` (step 4) only *registers* animation definitions per overlay ID — it runs before `ModelBuilder` is even constructed, long before any DOM exists. Wiring those registrations to actual rendered elements happens later, per-overlay, via `AnimationManager.onOverlayRendered()` (step 7), after `AdvancedRenderer.render()` completes. See `src/msd/pipeline/PipelineCore.js`'s `initMsdPipeline()`.

---

## Key Classes

| Class | File | Role |
|---|---|---|
| `PipelineCore` | `msd/pipeline/PipelineCore.js` | Top-level entry — orchestrates all stages; returns `_msdPipeline` API |
| `ConfigProcessor` | `msd/pipeline/ConfigProcessor.js` | Validates config, merges pack defaults, extracts SVG metadata and anchors |
| `MsdCardCoordinator` | `msd/pipeline/MsdCardCoordinator.js` | Initialises core systems in correct dependency order before overlay processing |
| `CardModel` (`buildCardModel`) | `msd/model/CardModel.js` | Resolves `base_svg` source/filters, resolves the viewBox, normalizes the overlay list into a consistent shape |
| `ModelBuilder` | `msd/pipeline/ModelBuilder.js` | Resolves overlay geometry, binding to SVG anchors, viewport scaling |
| `AdvancedRenderer` | `msd/renderer/AdvancedRenderer.js` | Main render orchestrator; creates `OverlayBase` / `LineOverlay` instances per overlay |
| `OverlayBase` | `msd/overlays/OverlayBase.js` | Base class for control overlays — position, size, embedded HA card |
| `RouterCore` | `msd/routing/RouterCore.js` | Pathfinding engine — A* routing, obstacle/crossing avoidance, trunk-and-branch bundling, channels; one instance per card. See [Routing Engine](./routing.md) |
| `LineOverlay` | `msd/overlays/LineOverlay.js` | Per-line renderer — resolves anchors, requests the route from `RouterCore`, builds SVG markup |
| `ShapeOverlay` | `msd/overlays/ShapeOverlay.js` | Renders `shape` overlays (`polyline`/`rect`/`circle`) — sibling of `LineOverlay`, not a subclass; shares its style-resolution logic by adaptation, not inheritance |
| `AttachmentPointManager` | `msd/renderer/AttachmentPointManager.js` | Resolves named attachment points on overlays for line endpoints |
| `ViewportScaling` | `msd/renderer/ViewportScaling.js` | Scales overlay coords for the current dashboard viewport |
| `AnchorProcessor` | `msd/pipeline/AnchorProcessor.js` | Extracts named coordinate anchors from the base SVG |

---

## Overlay Types

| Type | Class | Description |
|---|---|---|
| `control` | `OverlayBase` | Positions an arbitrary HA card (including LCARdS cards) at SVG coordinates |
| `line` | `LineOverlay` | SVG polyline from source overlay to target overlay with smart routing |
| `shape` | `ShapeOverlay` | Freeform geometry: `kind: polyline` (routed path via `RouterCore` forced to `manual` mode), `rect`/`circle` (native `<rect>`/`<ellipse>`, reusing controls' `position`+`size` convention) |

---

## Base SVG & Anchors

The MSD card renders a base SVG as its background. Named anchor points embedded in the SVG (`id="anchor__name"`) are extracted by `AnchorProcessor` and made available for overlay `position` config so overlays can snap to SVG geometry.

```yaml
type: custom:lcards-msd-card
svg: /local/lcards/assets/my-ship.svg
overlays:
  - id: warp_status
    position:
      anchor: warp_core      # binds to <circle id="anchor__warp_core"> in SVG
    card:
      type: custom:lcards-button
      # ...
```

---

## Line Routing

All pathfinding lives in **`RouterCore`** (one instance per MSD card, shared by every line). `LineOverlay` resolves a line's endpoints and asks `RouterCore` for the path; `AdvancedRenderer` runs a **pre-render discovery loop** that routes every line (in a fixed sorted order) until the router's shared trunk/crossing registries stabilize — making bundling and crossing-avoidance outcomes independent of YAML declaration order — before the real render pass consumes the cached results.

The engine provides: A* grid routing with obstacle avoidance, cardinal `anchor_side`/`attach_side` guarantees, trunk-and-branch bundling (parallel lines share evenly-spaced lanes; channels are pre-seeded trunks), crossing avoidance, and corner rounding/beveling/smoothing.

Full internals — registries, derived lane assignment, convergence discipline, caching: [Routing Engine (RouterCore)](./routing.md). User-facing configuration: [Line Routing & Channels](../../cards/msd/routing.md). Manual waypoints: [Manual Routing](../../cards/msd/manual-routing.md).

---

## Shape Attachment Points

`shape` overlays register into `AttachmentPointManager` the same way controls do, so a `line` can `attach_to` one. This happens inline in `AdvancedRenderer`'s render loop, right after each shape renders (before any line that might target it):

- **`rect`/`circle`** — `OverlayUtils.computeAttachmentPoints()` (the same bbox-corner math controls use) registers the standard 9-point grid, *plus* kebab-case aliases for the 4 corners (`top-left`, `top-right`, `bottom-left`, `bottom-right`) alongside the camelCase keys. The alias matters: `LineOverlay._resolveAttachTo()` lowercases `attach_side` before building its virtual-anchor lookup key, and `'topLeft'.toLowerCase()` → `'topleft'` matches neither casing — only the kebab-case alias survives that transform. Controls have carried this same alias for the same reason since `MsdControlsRenderer._computeAttachmentPointsFromBox`; shape registration mirrors it explicitly rather than inheriting it.
- **`polyline`** — each resolved vertex is registered individually as `<overlayId>.vertex<N>` (`AttachmentPointManager.setAnchor`), since the fixed 9-key bbox struct can't represent an arbitrary vertex count.

The MSD Studio editor's Connect Mode overlay (`_renderAttachmentPointsOverlay()` in the Studio dialog) and its drag-snap detector (`_getAttachmentTargetAt()`) both render/detect shape attachment points using this same convention, so clicking or drag-snapping onto a shape in the editor produces an `attach_side` value that resolves correctly at runtime.

---

## Delta Updates

After the initial render, overlay state changes (templates, rule patches, entity state) are applied as targeted DOM mutations rather than full re-renders. `AdvancedRenderer` tracks `overlayElementCache` per overlay ID and patches only the affected element.

---

## Pipeline API

The card's `_msdPipeline` property exposes:

```javascript
_msdPipeline.render()          // Force full re-render
_msdPipeline.updateOverlay(id) // Patch single overlay
_msdPipeline.getModel()        // Resolved model snapshot
_msdPipeline.coordinator       // MsdCardCoordinator reference
```

---

## See Also

- [MSD Card — User Guide](../../cards/msd/)
- [Control Overlay](../../cards/msd/control-overlay.md)
- [Line Overlay](../../cards/msd/line-overlay.md)
- [Shape Overlay](../../cards/msd/shape-overlay.md)
- [Manual Routing](../../cards/msd/manual-routing.md)
- [Card Foundation](../cards/lcards-card-foundation.md)
