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
    │   └─ LineOverlay instances (SVG line routing)
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
| `AttachmentPointManager` | `msd/renderer/AttachmentPointManager.js` | Resolves named attachment points on overlays for line endpoints |
| `ViewportScaling` | `msd/renderer/ViewportScaling.js` | Scales overlay coords for the current dashboard viewport |
| `AnchorProcessor` | `msd/pipeline/AnchorProcessor.js` | Extracts named coordinate anchors from the base SVG |

---

## Overlay Types

| Type | Class | Description |
|---|---|---|
| `control` | `OverlayBase` | Positions an arbitrary HA card (including LCARdS cards) at SVG coordinates |
| `line` | `LineOverlay` | SVG polyline from source overlay to target overlay with smart routing |

---

## Base SVG & Anchors

The MSD card renders a base SVG as its background. Named anchor points embedded in the SVG (`id="anchor__name"`) are extracted by `AnchorProcessor` and made available for overlay `position` config so overlays can snap to SVG geometry.

```yaml
type: custom:lcards-msd
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
- [Manual Routing](../../cards/msd/manual-routing.md)
- [Card Foundation](../cards/lcards-card-foundation.md)
