# Routing Engine (RouterCore)

`src/msd/routing/RouterCore.js` is the pathfinding engine behind every MSD line: one instance per MSD card (created by `MsdCardCoordinator`), shared by all line overlays on that card. It decides each line's pixel geometry — where it bends, how it avoids obstacles, and how multiple lines coordinate into bundles ("cable raceway" behavior).

User-facing behavior and configuration: [Line Routing & Channels](../../cards/msd/routing.md). This page covers the internals.

RouterCore has **zero DOM dependencies** — it's pure geometry and graph search, which is what makes it unit-testable: `tests/routing/*.test.js` (`npm run test:routing`, Node's built-in test runner) exercises it directly through a small harness (`tests/routing/helpers/router-harness.js`).

---

## Request Lifecycle

1. `AdvancedRenderer.render()` positions control overlays, waits for their DOM to settle, then resolves every overlay's anchor/attachment points.
2. **Discovery loop** (`AdvancedRenderer._discoverLineRoutes`): before anything renders, every line is routed — iterated in a **fixed order sorted by overlay id, not YAML order** — repeatedly, until a full sweep causes zero registry mutations (capped by `trunk_discovery_max_passes`). This is what makes bundling outcomes independent of declaration order. The loop must use the same *complete* anchor set (static + attachment-manager virtual anchors) the render pass uses — with bare static anchors, control-anchored lines silently fail to resolve and the loop no-ops.
3. **Render pass** (Pass 2b, declaration order for SVG z-ordering): each `LineOverlay.render()` calls `RouterCore.buildRouteRequest()` + `computePath()` — all cache hits once the loop has converged.
4. `computePath` dispatches on mode: `manual` / `direct` / corridor-chained (`_computeCorridorRouted`) / plain A* (`_computeGrid`, plus `_refineSmart` for `smart`).
5. After geometry is final (post corner-rounding, pre smoothing), the line's straight runs are **registered** into the shared registries, making its geometry visible to other lines' future routing decisions.

## Core Data Structures

| Structure | Contents | Purpose |
|---|---|---|
| `_trunks` | Trunk rows: bounds, `direction`, `origin` (`channel`/`discovered`), `sourceLineId` (creator), `crossCenter`, `members: Map<lineId, [flowLo, flowHi]>` | Bundling. Config channels are pre-seeded rows; discovered rows are created from lines' own straight runs (≥ `trunk_min_length`) |
| `_crossings` | Per-line straight-run records (≥ `crossing_min_length`) | Crossing avoidance occupancy |
| `_registryVersion` | Counter bumped **only on real registry mutations** | Folded into the route cache key — the mechanism that makes the discovery loop converge and steady state free |
| `_cache` | LRU route cache keyed on every request field + `_registryVersion` + viewBox + obstacle version | A line recomputes exactly when something it depends on changed |

## A* and Cost Biases

`_computeGrid` runs 4-direction A* over a coarse grid (`grid_resolution`) with a turn penalty, plus three per-cell bias layers looked up during the search:

- **Channel bias** (`_buildChannelCostGrid`): discount for moving *along* a prefer channel's flow direction; penalty inside avoid channels. A prefer discount can break the Manhattan heuristic's admissibility, so those searches fall back to h=0 (Dijkstra).
- **Crossing penalty** (`_buildCrossingCostGrid`): penalizes moving *orthogonally* through another line's registered segment. Always non-negative, so no admissibility concerns. **Bundle-mates are exempt** — lines sharing a trunk, and (prospectively) the occupants of a corridor being joined (`_crossingExemptIds` on corridor legs) — because reaching an outer lane legitimately crosses inner lanes, and penalizing that made A* sneak around segment endpoints instead.
- Cardinal `anchor_side`/`attach_side` guarantees are enforced *structurally* with fixed stub segments spliced around the search (`_applyCardinalStubs`), not as costs.

## Trunk-and-Branch (Bundling)

A channel is just a **pre-seeded trunk**; a discovered trunk is a corridor learned from another line's routed path. Both live in `_trunks` and flow through the same corridor-composition machinery:

- **Discovery** (`_discoverTrunkCandidates`): a line finds joinable trunks by flow-axis overlap (≥ `trunk_min_overlap`) and cross-axis proximity (≤ `trunk_proximity`). Exclusions: corridors already referenced explicitly, trunks the line itself *created* (self-reference), and ghost shells with zero members. Membership is deliberately **not** an exclusion — a joined line must be able to re-discover its own trunk on recompute, or joining would silently revert on the next recompute ("join ratchet").
- **Composition** (`_computeCorridorRouted`): approach leg → through leg → depart leg per corridor, each leg independently pathfound. A discovered trunk (or prefer channel) chain is an *optional candidate* compared against the plain route by real cost; only `force` channels are mandatory. Force chains skip trunk discovery entirely — nothing can cost-vet an addition to a mandatory chain.
- **Registration** (`_registerLineSegments` → `_mergeOrRegisterTrunk`): a finished route's straight runs merge into geometrically-matching trunk rows as member spans, or create new rows. Registration is **diff-in-place**: matching entries update (identical geometry reports no change), and only entries the scan didn't touch are dropped. Rows are never deleted (emptied "shell" rows reactivate on rejoin).

## Lane Assignment — Derived, Never Stored

`_trunkLaneAssignment(corridor, lineId)` computes `{laneIndex, laneCount, offset}` as a **pure function of the trunk's current member set** on every call:

- **Discovered trunk**: the creator (`sourceLineId`) implicitly holds lane 0 at offset 0 — its path *is* the centerline (`crossCenter`). Joiners (members minus creator, plus the asking line, sorted lexicographically) alternate sides: `+s, -s, +2s, -2s, …`. The row's cross-axis band width is likewise derived from joiner count (`_trunkBandHalfWidth`), grown symmetrically so the band center never drifts.
- **Config channel**: all users get centered offsets `(i − (n−1)/2) × line_spacing`, clamped to the authored band.

There is deliberately **no stored lane state**. The predecessor (`_channelLineIndex`, a permanent insertion-order map) caused the engine's recurring failure class: stateful per-corridor bookkeeping that the discovery loop couldn't converge over. Membership changes bump `_registryVersion` (lanes depend on membership), while identical re-registration is a strict no-op.

## Convergence Discipline

The discovery loop only terminates affordably because of three invariants — every one was violated at least once by a "delete-then-recreate" or "stored assignment" pattern before being fixed:

1. **Idempotence**: re-registering identical geometry must not report a change (no purge-before-register anywhere in the routine flow).
2. **Derived state**: anything computed *from* the registries (lanes, band widths, lane counts) is recomputed from current state, never incrementally mutated.
3. **History independence**: `setOverlays` with a changed overlay set resets the discovered registries (channels re-seed from config). Bundle arrangements can be genuine cost ties with multiple stable outcomes — whichever line routes first picks the winner — so each config's outcome must be a function of the config plus the fixed loop order, never of edit history.

The regression suite encodes these directly: the fixed-point test (cache-cleared recompute reproduces the converged answer with zero version bumps) is the canary for the whole class.

**Debug forensics**: each cache entry's key embeds the `_registryVersion` it was stored at (`…|RV:n`), so `[...router._cache.keys()]` reconstructs the order lines were actually computed in — how the discovery-loop no-op bug was diagnosed live.

## Pitfalls

- `route: auto` without obstacles/channels resolves to **manhattan**, which never bundles or avoids crossings. Demos/tests of those features need `route: smart`.
- `grid_resolution` values ≤ 4 are silently coerced to 32.
- `channels` config lives at `msd.channels`, not `msd.routing.channels` (`MsdCardCoordinator` assembles RouterCore's config as `{ ...mergedConfig.routing, channels: mergedConfig.channels }`).
- Never call `computePath` with endpoints other than the line's real resolved anchors "just to inspect" — registration is a side effect of routing, and synthetic requests pollute the registries under the real line's id. `RouterCore.inspect(id)` reads the cache without computing.
- `route: direct`/`manual` results still register — intentional (walls/backbones participate in avoidance and bundling) — but they never *react* to other lines.

## See Also

- [Line Routing & Channels](../../cards/msd/routing.md) — user-facing configuration
- [MSD Pipeline](./index.md) — the rendering pipeline RouterCore plugs into
- `tests/routing/` — the executable specification
