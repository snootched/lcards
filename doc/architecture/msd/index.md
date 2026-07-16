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
1. ConfigProcessor        → validate + merge pack defaults + extract SVG anchors
    │
    ▼
2. MsdCardCoordinator     → init core systems (packs, themes, datasources, rules)
    │
    ▼
3. ModelBuilder           → resolve overlay positions, sizes, anchor bindings
    │
    ▼  (produces resolvedModel)
4. AdvancedRenderer       → produce SVG markup + overlay DOM elements
    │   ├─ OverlayBase instances (control overlays)
    │   ├─ LineOverlay instances (SVG line routing)
    │   └─ ShapeOverlay instances (polyline/rect/circle geometry)
    │
    ▼
5. AnimationManager.initialize(overlays)
    │
    ▼
Rendered card (Shadow DOM updated)
```

---

## Key Classes

| Class | File | Role |
|---|---|---|
| `PipelineCore` | `msd/pipeline/PipelineCore.js` | Top-level entry — orchestrates all stages; returns `_msdPipeline` API |
| `ConfigProcessor` | `msd/pipeline/ConfigProcessor.js` | Validates config, merges pack defaults, extracts SVG metadata and anchors |
| `MsdCardCoordinator` | `msd/pipeline/MsdCardCoordinator.js` | Initialises core systems in correct dependency order before overlay processing |
| `ModelBuilder` | `msd/pipeline/ModelBuilder.js` | Resolves overlay geometry, binding to SVG anchors, viewport scaling |
| `AdvancedRenderer` | `msd/renderer/AdvancedRenderer.js` | Main render orchestrator; creates `OverlayBase` / `LineOverlay` instances per overlay |
| `OverlayBase` | `msd/overlays/OverlayBase.js` | Base class for control overlays — position, size, embedded HA card |
| `LineOverlay` | `msd/overlays/LineOverlay.js` | SVG line routing, avoid-obstacle algorithm, attachment point resolution |
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

`LineOverlay` computes polyline paths between two overlay attachment points. The routing algorithm:

1. Resolves source/target attachment points (top/bottom/left/right/center or named)
2. Picks orthogonal or diagonal routing strategy based on relative positions
3. Applies obstacle avoidance by sampling other overlay bounding boxes
4. Falls back to direct straight line if routing fails

Manual routing waypoints can override the algorithm — see [Manual Routing](../../cards/msd/manual-routing.md).

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
