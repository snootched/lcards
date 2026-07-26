/**
 * @fileoverview RouterCore — path-routing engine for MSD line overlays.
 *
 * Computes SVG paths between anchor points using Manhattan, smart (A\*), or
 * waypoint-guided routing.  Results are cached by a content-addressable key
 * and invalidated when config or obstacles change.
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

// anchor_side/attach_side ('left'/'right'/'top'/'bottom') as outward unit
// vectors — unlike modeHint/modeHintLast ('xy'/'yx'), which only preserve an
// axis, these carry the actual departure/arrival direction. Used by both
// _computeManhattan (lead-out/lead-in stubs) and _computeGrid (direction-
// aware A* hint bias) — only ever consulted when a hint's source is
// genuinely 'anchor_side'/'attach_side' (not an explicit route_hint override
// or the geometry fallback, neither of which carry a real direction).
const CARDINAL_DIR = { left: [-1,0], right: [1,0], top: [0,-1], bottom: [0,1] };
const MIN_STUB_LENGTH = 24; // viewBox units — floor even when cornerRadius is 0
// Floor for a single A* grid-cell step cost. A full-weight 'prefer' channel
// discount (_buildChannelCostGrid) is a large negative delta added to the
// base step cost of 1 — without a floor above zero, a strong enough
// discount could drive a cell's cost to zero or negative, breaking A*'s
// admissibility guarantee against the h() heuristic (line ~751) and risking
// non-optimal or non-terminating search behavior.
const MIN_STEP_COST = 0.05;

/**
 * Corner-radius-driven minimum leg length for a given request.
 * _applyCornerRounding clamps each corner's radius to half its shorter
 * adjacent segment length (RouterCore.js, cornerRadii loop) — a leg shorter
 * than 2x the configured corner radius silently caps the rendered rounding,
 * however large cornerRadius is actually set to. Scaling with cornerRadius
 * keeps the leg long enough to let the full configured radius render. Only
 * meaningful when the corner style actually renders an arc/chamfer — a
 * 'miter' line has no radius to make room for, so it always gets the bare
 * floor regardless of whatever cornerRadius happens to be configured
 * (harmless leftover from a style switch, previously charged the same
 * inflated reservation for no visual benefit).
 * @param {object} req
 * @returns {number}
 */
function stubLengthFor(req) {
  const usesRadius = req.cornerStyle === 'round' || req.cornerStyle === 'bevel';
  return usesRadius ? Math.max(MIN_STUB_LENGTH, (req.cornerRadius || 0) * 2) : MIN_STUB_LENGTH;
}

/**
 * Lead-out/lead-in stub length for the two BLIND-splice call sites
 * (_applyCardinalStubs, _computeManhattan's fallback): a fixed, unsearched
 * segment spliced onto the true endpoint before any A-star/crossing-cost
 * evaluation runs. Reserving a large corner-radius-driven length here means
 * that length can never be routed around anything — including another
 * line's already-registered crossing segment, no matter how strongly
 * crossing_avoid_bias is configured. `corner_radius_mode: 'forced'`
 * (opt-in) keeps today's guaranteed-full-radius behavior via
 * stubLengthFor(); the default, 'auto', always uses the bare floor instead,
 * leaving the search entirely free to decide the route — rendered corner
 * radius still targets the full configured value wherever the chosen
 * path's own leg lengths allow it (existing clamp in
 * _applyCornerRounding, untouched by this).
 *
 * Deliberately NOT used by _pushBundledApproachLegs's bundled-corridor lane
 * nudge (still plain stubLengthFor there): that leg is already
 * independently pathfound through the crossing-cost grid inside
 * _computeCorridorRouted's leg loop — it isn't a blind splice, so it isn't
 * an instance of this problem — and shrinking it has its own previously-
 * confirmed, unrelated regression (see that function's own comment).
 *
 * `minAutoLength` (only consulted in 'auto' mode) floors the bare
 * MIN_STUB_LENGTH against the router's own RESOLVED grid_resolution (see
 * RouterCore.prototype._resolvedGridResolution) — a stub shorter than one
 * grid cell lands its own landing point inside the same cell _computeGrid
 * would place the raw anchor in, triggering the same-grid-cell
 * short-circuit (see _computeGrid's own comment) for virtually every leg
 * immediately after the stub. Confirmed as a real, measured effect: on a
 * large viewBox using the scalable default grid_resolution (which can
 * reach up to 64, while MIN_STUB_LENGTH is a flat 24 regardless of canvas
 * size), a line's very first post-stub decision routinely had no real
 * grid cell of its own to search from, producing convoluted, hard-to-
 * predict detours instead of the direct route a genuinely free search
 * would find — worse, not better, than a shorter search would suggest.
 * Callers that can't cheaply resolve this (e.g. a caller with no `this`)
 * may omit it; MIN_STUB_LENGTH alone remains the floor.
 * @param {object} req
 * @param {number} [minAutoLength] - the router's resolved grid_resolution;
 *   only used in 'auto' cornerRadiusMode, ignored in 'forced'.
 * @returns {number}
 */
function cardinalStubLengthFor(req, minAutoLength) {
  return req.cornerRadiusMode === 'forced' ? stubLengthFor(req) : Math.max(MIN_STUB_LENGTH, minAutoLength || 0);
}

// Fractions of [width, height] to add to `position` to get the box's actual
// top-left corner, matching MsdControlsRenderer._applyAttachmentOffset
// exactly (that one multiplies by literal width/height; these are the same
// offsets expressed as fractions so setOverlays can apply them directly to
// whatever size a given obstacle has). `position` is the point named by
// `attachment` — e.g. attachment:'center' means position is the box's
// CENTER, not its corner — so treating position as the top-left corner
// unconditionally (as setOverlays used to) registers the obstacle up to half
// the control's width/height away from where it's actually drawn.
const ATTACHMENT_OFFSET_FRAC = {
  'top-left': [0, 0],
  'top': [-0.5, 0],
  'top-center': [-0.5, 0],
  'top-right': [-1, 0],
  'left': [0, -0.5],
  'center': [-0.5, -0.5],
  'middle-center': [-0.5, -0.5],
  'right': [-1, -0.5],
  'bottom-left': [0, -1],
  'bottom': [-0.5, -1],
  'bottom-center': [-0.5, -1],
  'bottom-right': [-1, -1]
};

/**
 * Path-routing engine for MSD line overlays.
 *
 * Supports Manhattan basic routing, A\*-based smart routing through obstacles
 * and channels, and waypoint-guided routing.  Routes are cached in an LRU map
 * keyed on anchor positions, mode, and obstacle version.
 */
export class RouterCore {
  constructor(routingConfig, anchors, viewBox) {
    this.config = routingConfig || {};
    this.anchors = anchors || {};
    this.viewBox = viewBox;
    this._cache = new Map(); // key -> RouteResult
    this._cacheOrder = [];
    this._maxCache = 256;
    this._rev = 0; // increment to invalidate globally
    this._overlaysRef = null;
    this._obstacles = [];
    this._obsVersion = 0;
    this._gridCache = new Map(); // resolution|obsVersion -> occupancy grid
    // Separate from _gridCache: obstacle occupancy is global (every line sees
    // the same obstacles), but channel cost bias is opt-in per-line via
    // route_channels — folding it into the shared occupancy cache would leak
    // one line's prefer/avoid bias onto every other line at the same grid
    // resolution/viewBox. Keyed on the referencing line's own channel subset
    // (see _channelCostKey), not just resolution/viewBox.
    this._channelCostCache = new Map();
    // Keyed on the ASKING line's own id (a crossing entry never penalizes
    // its own owner — see _buildCrossingCostGrid) plus _registryVersion, not
    // _obsVersion: crossing/trunk registrations churn on essentially every
    // line recompute, and _obsVersion is reserved for structural
    // obstacle/viewBox changes — folding registry churn into it would force
    // _gridCache/_channelCostCache to rebuild as if obstacles changed every
    // time any line reroutes.
    this._crossingCostCache = new Map();
    this._channels = this._normalizeChannels(this.config.channels || {});
    // NOTE: bundling lane assignment is deliberately NOT tracked in any
    // stored map — it's derived fresh from trunk membership on every use
    // (see _trunkLaneAssignment for why statefulness here broke
    // discovery-loop convergence).

    // Debug logging for channel detection
    if (this._channels.length > 0) {
      lcardsLog.debug(`[RouterCore] Loaded ${this._channels.length} channels:`,
        this._channels.map(c => `${c.id}(${c.mode})`).join(', '));
    } else {
      lcardsLog.debug('[RouterCore] No channels loaded. Config.channels:', this.config.channels);
    }

    this._channelForcePenalty = Number(this.config.channel_force_penalty || 800);
    this._channelAvoidMultiplier = Number(this.config.channel_avoid_multiplier || 1.0);
    // NOTE: the old channel "shaping" knobs (channel_target_coverage,
    // channel_shaping_max_attempts, channel_shaping_span,
    // channel_min_coverage_gain) were removed — the post-hoc path-shaping
    // pass they configured was replaced by the per-cell A* cost bias
    // (_buildChannelCostGrid) and the real-cost corridor comparison
    // (_computeCorridorRouted), which have no equivalent parameters.

    // Trunk-and-branch: lines whose paths happen to run close and parallel
    // spontaneously bundle together (cable-raceway aesthetic), branching
    // apart only where their destinations actually diverge. Channels are
    // unified into this as "pre-seeded" trunks — always known in advance,
    // discoverable by any line whether or not it lists them in its own
    // route_channels — so a config channel and a trunk discovered from an
    // already-routed line's own path are the same shape and go through the
    // same leg-composition machinery (_computeCorridorRouted). See
    // _discoverTrunkCandidates/_registerLineSegments for the two halves of
    // the mechanism (finding a trunk to join; growing the registry after a
    // line finishes routing).
    this._trunkBundlingEnabled = this.config.trunk_bundling_enabled !== false;
    this._trunkProximity = Number(this.config.trunk_proximity ?? 32);
    this._trunkMinOverlap = Number(this.config.trunk_min_overlap ?? 60);
    this._trunkMinLength = Number(this.config.trunk_min_length ?? 60);
    this._trunkMaxJoinCandidates = Number(this.config.trunk_max_join_candidates ?? 2);
    this._trunkBundleWeight = Number(this.config.trunk_bundle_weight ?? 0.5);
    this._trunkLineSpacing = Number(this.config.trunk_line_spacing ?? 8);
    // Cap on how many discovery passes AdvancedRenderer's seed loop will run
    // before giving up on reaching a fixed point (see _registryVersion) —
    // guarantees termination even under a rare near-tie oscillation between
    // two candidate joins. Read here so it travels with the rest of the
    // trunk config rather than living only in the renderer.
    this._trunkDiscoveryMaxPasses = Number(this.config.trunk_discovery_max_passes ?? 4);
    // Seeded eagerly, same reasoning as _channels itself: bounds are static
    // config known at construction, so there's no lazy-rebuild story needed.
    // origin/sourceLineId/runIndex distinguish a config-sourced trunk (never
    // purged, never merges away) from one discovered at runtime from a
    // line's own routed path (purged/re-registered on that line's recompute
    // — see _purgeTrunksForLine).
    // members tracks each contributing line's OWN flow-axis sub-span
    // (Map<lineId, [lo, hi]>) so a trunk's overall bounds can be correctly
    // shrunk when one contributor is purged without discarding every other
    // contributor's extension (see _recomputeTrunkBounds) — a bare
    // Math.min/max accumulation with no per-contributor bookkeeping would
    // let the originating line's own recompute silently erase another
    // line's join. _baseX*/_baseY* preserve a channel's own configured
    // bounds so purging every joining line still leaves the channel at its
    // authored size, never smaller.
    this._trunks = this._seedTrunksFromChannels();
    // Bumped only when _trunks/_crossings actually mutate (see
    // _purgeLineRegistrations/_registerLineSegments) and folded into
    // _cacheKey. This is what lets a line whose upstream trunk/crossing
    // dependencies changed since its own last computation get forced to
    // recompute — without it, a repeated discovery pass over unchanged
    // requests would just keep hitting the route cache and never re-examine
    // newly-registered trunks from other lines.
    this._registryVersion = 0;

    // Crossing avoidance: a soft per-cell cost penalty (see
    // _buildCrossingCostGrid) discourages a line's path from cutting
    // orthogonally across another already-routed line's segment — traces
    // shouldn't cross unless there's a real reason to. Separate registry
    // from _trunks: bundling only cares about long, "worth joining" runs
    // (trunk_min_length), but a short stub leg right off a control can
    // still be crossed by another line and must still be avoidable, so
    // crossing_min_length is deliberately much smaller.
    this._crossingAvoidEnabled = this.config.crossing_avoid_enabled !== false;
    this._crossingAvoidBias = Number(this.config.crossing_avoid_bias ?? 4);
    this._crossingMinLength = Number(this.config.crossing_min_length ?? 12);
    this._crossings = [];
  }

  invalidate(id='*') {
    if (id === '*' ) {
      this._cache.clear();
      this._cacheOrder.length = 0;
      this._rev++;
    } else {
      // Cache key includes overlay id only indirectly; brute force purge by scan.
      for (const k of Array.from(this._cache.keys())) {
        if (k.includes(`@${id}|`)) {
          this._cache.delete(k);
          const i = this._cacheOrder.indexOf(k);
          if (i >= 0) this._cacheOrder.splice(i,1);
        }
      }
    }
  }

  /**
   * Fresh channel-seeded trunk rows — used at construction and again by
   * setOverlays' registry reset (see below).
   * @returns {Array<object>}
   * @private
   */
  _seedTrunksFromChannels() {
    return this._channels.map(c => ({
      ...c,
      origin: 'channel',
      sourceLineId: null,
      runIndex: null,
      members: new Map(),
      _baseX1: c.x1, _baseY1: c.y1, _baseX2: c.x2, _baseY2: c.y2
    }));
  }

  setOverlays(overlays) {
    if (!Array.isArray(overlays)) return;
    if (overlays === this._overlaysRef) return;
    this._overlaysRef = overlays;
    // Rebuild obstacle list (overlays with obstacle:true)
    const obs = [];
    for (const ov of overlays) {
      if (!ov || !ov.id) continue;
      const raw = ov._raw || ov.raw || {};
      const isObstacle = raw.obstacle === true;
      if (!isObstacle) continue;
      // Determine bounds. Prefer size+position (raw.position / raw.size) else anchor if available.
      let x = 0, y = 0, w = 0, h = 0;
      if (Array.isArray(raw.position) && Array.isArray(raw.size)) {
        const [px, py] = raw.position;
        [w,h] = raw.size;
        // raw.position is the point named by attachment, not necessarily the
        // box's top-left corner (see ATTACHMENT_OFFSET_FRAC) — applying the
        // wrong corner here registers the obstacle up to half the control's
        // width/height away from where it's actually drawn, which can steer
        // the pathfinder around empty space (or through the real control).
        const offset = ATTACHMENT_OFFSET_FRAC[raw.attachment] || ATTACHMENT_OFFSET_FRAC['top-left'];
        x = px + offset[0] * w;
        y = py + offset[1] * h;
      } else if (raw.anchor && this.anchors[raw.anchor]) {
        const [ax,ay] = this.anchors[raw.anchor];
        x = ax - 1; y = ay - 1; w = 2; h = 2;
      } else continue;
      if (!Number.isFinite(x+y+w+h) || w <= 0 || h <= 0) continue;
      obs.push({ id: ov.id, x1: x, y1: y, x2: x + w, y2: y + h });
    }
    this._obstacles = obs;
    this._obsVersion++;
    // Invalidate grids & route cache referencing old obstacles
    this._gridCache.clear();
    this._channelCostCache.clear();
    // Reset DISCOVERED routing state along with the route cache: a new
    // overlay set is a new routing problem, and the converged bundle
    // arrangement is a genuine near-tie in some layouts — multiple stable
    // fixed points exist, and which one the discovery loop lands in
    // depends on which line registered first. Persisting discovered
    // trunks/crossings across config edits made that a function of EDIT
    // HISTORY (confirmed live: reordering two lines in the YAML editor
    // flipped a line between two equal-cost shapes, and the seeded state
    // was self-sustaining forever after). Resetting here makes each
    // config's outcome a pure function of the config + the sorted
    // discovery loop. Costs nothing extra in practice — the route cache
    // is already fully invalidated below, so every route recomputes on
    // the next render regardless; the loop just re-converges from clean
    // state. Channel rows are re-seeded (authored config, not history).
    this._trunks = this._seedTrunksFromChannels();
    this._crossings = [];
    this._crossingCostCache.clear();
    this._registryVersion++;
    this.invalidate('*');
  }

  /**
   * Update the viewBox used for grid sizing/origin math (_computeGrid) and
   * route/grid cache keys. RouterCore otherwise captures `viewBox` once at
   * construction and never re-reads it — a live (non-remount) config update
   * that changes view_box would silently leave routed lines pinned to the OLD
   * origin/dimensions forever without this.
   * @param {[number,number,number,number]} viewBox - Resolved [minX, minY, width, height]
   */
  setViewBox(viewBox) {
    if (!Array.isArray(viewBox) || viewBox.length !== 4) return;
    const [x, y, w, h] = viewBox;
    if (![x, y, w, h].every(n => typeof n === 'number' && Number.isFinite(n))) return;
    const prev = this.viewBox;
    if (Array.isArray(prev) && prev.length === 4 &&
        prev[0] === x && prev[1] === y && prev[2] === w && prev[3] === h) {
      return; // unchanged - avoid pointless cache churn
    }
    this.viewBox = viewBox;
    // _cacheKey()/_computeGrid()'s gridKey already fold viewBox in, so stale
    // entries simply stop being matched - this clear is memory hygiene only
    // (_gridCache has no eviction policy, unlike the LRU-capped _cache).
    this._gridCache.clear();
    this._channelCostCache.clear();
    this.invalidate('*');
  }

  /**
   * Distance a point can travel in `dir` before leaving the routed viewBox
   * (minus a small margin so a stub doesn't render flush against the very
   * edge). A radius-driven stub length has no awareness of where the anchor
   * actually sits on the canvas — for an anchor already close to an edge
   * (e.g. anchor_side:'top' on a control near y=0), pushing the full stub
   * length in that direction can land past the edge entirely.
   * @param {number[]} point
   * @param {number[]} dir - one of CARDINAL_DIR's values
   * @returns {number}
   */
  _maxStubBeforeEdge(point, dir) {
    const vb = this.viewBox;
    if (!Array.isArray(vb) || vb.length !== 4) return Infinity;
    const [vx, vy, vw, vh] = vb;
    const margin = 2;
    if (dir[0] === -1) return point[0] - vx - margin;
    if (dir[0] === 1) return (vx + vw) - point[0] - margin;
    if (dir[1] === -1) return point[1] - vy - margin;
    if (dir[1] === 1) return (vy + vh) - point[1] - margin;
    return Infinity;
  }

  /**
   * Effective lead-out/lead-in stub length for a given direction, clamped so
   * it never pushes the stub point outside the routed viewBox. Shared by
   * _applyCardinalStubs (grid/smart) and _computeManhattan's stub fallback,
   * which both build lead-out/lead-in segments the same way. This is ONLY
   * the viewBox clamp — see _noOvershootStub for the separate, more
   * precise fix for overshoot/reversal (an earlier version conflated the
   * two into one "clamp against the other endpoint's raw coordinate"
   * heuristic, which broke once anchor/attach sides could interact more
   * subtly — see _noOvershootStub's docblock).
   * @param {number} desiredLength
   * @param {number[]} dir
   * @param {number[]} point - the endpoint the stub extends from
   * @returns {number}
   */
  _clampStubLength(desiredLength, dir, point) {
    const edgeLimit = this._maxStubBeforeEdge(point, dir);
    return Math.max(0, Math.min(desiredLength, edgeLimit));
  }

  /**
   * If extending `point` by `length` in `dir` would land past `otherPoint`'s
   * own coordinate on dir's axis (in dir's direction), shorten it to land
   * exactly even with otherPoint instead.
   *
   * `otherPoint` must be the OTHER endpoint's own already-stub-adjusted
   * position (e.g. p2s, not raw p2) — comparing against the raw endpoint
   * broke in two ways: when both anchor_side/attach_side land on the same
   * axis, each stub independently "safe" against the raw other point can
   * still end up on the wrong relative side of the OTHER stub once both are
   * applied (the two stubs interact, not just each stub vs. the raw point);
   * when a direction is perpendicular to the axis being checked, the raw
   * other point's coordinate on that axis is coincidental, not a real
   * constraint, and clamping against it shrinks the stub for no reason.
   * Comparing against the other stub's own resolved position handles both:
   * same-axis stubs correctly see each other's actual reach, and a
   * perpendicular stub's own axis is untouched by the other side at all so
   * its "other point" reference is unaffected by this distinction.
   * @param {number} length
   * @param {number[]} dir
   * @param {number[]} point - the endpoint this stub extends from
   * @param {number[]} otherPoint - the OTHER stub's own resolved endpoint
   * @returns {number}
   */
  _noOvershootStub(length, dir, point, otherPoint) {
    const axisIsX = dir[0] !== 0;
    const sign = axisIsX ? dir[0] : dir[1];
    const start = axisIsX ? point[0] : point[1];
    const otherCoord = axisIsX ? otherPoint[0] : otherPoint[1];
    const distToOther = otherCoord - start;
    // If the other point sits on the OPPOSITE side of us from the direction
    // we're traveling, it's behind us and can never be "passed" by moving
    // further away from it — e.g. anchor_side:'top' (moving to smaller y)
    // compared against an attach point far below (much larger y) has no
    // overshoot risk at all; treating that as an overshoot (an earlier
    // version of this check did) computes a nonsensical "corrected" length
    // using a reference point nowhere near where we're actually headed.
    if (Math.sign(distToOther) === -sign) return length;
    const wouldBe = start + sign * length;
    const overshoots = sign > 0 ? wouldBe > otherCoord : wouldBe < otherCoord;
    return overshoots ? Math.abs(distToOther) : length;
  }

  stats() {
    return {
      size: this._cache.size,
      max: this._maxCache,
      rev: this._rev,
      obstacles: this._obstacles.length,
      obsVersion: this._obsVersion,
      registryVersion: this._registryVersion,
      trunks: this._trunks.length,
      crossings: this._crossings.length
    };
  }

  /**
   * Extract channel array from overlay config
   * Consolidates access to route_channels vs routeChannels property
   * @param {object} raw - Raw overlay config
   * @returns {Array<string>} Array of channel IDs
   * @private
   */
  _getChannelArray(raw) {
    const channels = raw.route_channels || raw.routeChannels || [];
    // .slice() defensively — callers (e.g. _cacheKey) sort this array, and
    // without a copy that mutates the raw config's own route_channels array
    // in place (see _cacheKey's comment).
    return Array.isArray(channels) ? channels.slice() : [];
  }

  /**
   * Sorted, comma-joined key for the subset of a line's referenced channels
   * that actually contribute per-cell A* cost bias — 'prefer'/'avoid' only.
   * Force-mode channels contribute no per-cell bias (handled structurally as
   * mandatory-waypoint legs, see _computeForceRouted) so they're excluded
   * here even if referenced by the same line.
   * @param {string[]} channelIds - req.channels
   * @returns {string}
   * @private
   */
  _channelCostKey(channelIds) {
    if (!channelIds || !channelIds.length) return '';
    return channelIds
      .filter(id => this._channels.some(c => c.id === id && (c.mode === 'prefer' || c.mode === 'avoid')))
      .slice()
      .sort()
      .join(',');
  }

  /**
   * Debug introspection: get route info for an overlay ID
   * @param {string} overlayId - The overlay identifier
   * @returns {object|null} Route info with pts, d, meta, or null if not found
   */
  inspect(overlayId) {
    if (!overlayId) return null;

    // Cache keys are formatted as: `${req.id}@${x1},${y1}-${x2},${y2}|...`
    // Find the most recent cache entry for this overlay ID
    for (const [key, routeResult] of this._cache.entries()) {
      if (key.startsWith(`${overlayId}@`)) {
        // Found a cached route for this overlay
        return {
          overlayId,
          pts: routeResult.pts || [],
          d: routeResult.d || '',
          meta: routeResult.meta || {},
          cacheKey: key
        };
      }
    }

    // No cached route found
    return null;
  }


  /**
   * Build a route request object with both entry and exit direction hints.
   * If route_hint_last is not specified and the destination is an overlay with attach_side,
   * auto-set route_hint_last based on attach_side (left/right → xy; top/bottom → yx).
   * If only route_hint_last is set, use it for the last segment, first segment is auto.
   * If neither is set, fallback to geometry-based auto.
   * @param {object} overlay - The overlay config object
   * @param {number[]} a1 - Start anchor [x, y]
   * @param {number[]} a2 - End anchor [x, y]
   * @returns {object} Route request with modeHint and modeHintLast
   */
  buildRouteRequest(overlay, a1, a2) {
    const raw = overlay._raw || overlay.raw || {};
    const fs = overlay.finalStyle || {};

    // Removed route_channel_mode - channels now define their own mode (prefer/avoid/force)

    let smoothingMode = (
      raw.smoothing_mode ||
      raw.corner_smoothing_mode ||
      fs.smoothing_mode ||
      this.config.smoothing_mode ||
      (this.config.smoothing && this.config.smoothing.mode) ||
      'none'
    ).toLowerCase();
    const allowedSmooth = ['none','chaikin'];
    if (!allowedSmooth.includes(smoothingMode)) {
      smoothingMode = 'none';
    }

    // Parse both first and last segment hints
    // Expected values: 'xy' (horizontal first) or 'yx' (vertical first)
    let modeHint = (raw.route_hint || '').toLowerCase().trim();
    let modeHintLast = (raw.route_hint_last || '').toLowerCase().trim();
    let hintSourceFirst = raw.route_hint ? 'explicit' : 'auto';
    let hintSourceLast = raw.route_hint_last ? 'explicit' : null;

    // DEBUG: Log parsed route hints
    if (modeHint || modeHintLast) {
      lcardsLog.debug(`[RouterCore] Line '${raw.id}': Parsed route_hint='${modeHint}' (source: ${hintSourceFirst}), route_hint_last='${modeHintLast}' (source: ${hintSourceLast || 'none'})`);
    }

    // Derive modeHint (first segment) from anchor_side, and modeHintLast
    // (last segment) from attach_side, whenever route_hint/route_hint_last
    // aren't set explicitly. This applies regardless of whether the
    // anchor/attach_to resolves to a real overlay with attachment-point
    // geometry or a plain point coordinate: a point anchor can't be
    // repositioned to "its right side", but the side still expresses a
    // routing-direction intent (leave/arrive from that side) on its own.
    // Corner values (top-left, etc.) and 'center' are ambiguous for a single
    // axis and fall through to the geometry-based fallback below.
    if (!modeHint) {
      const anchorSide = (raw.anchor_side || '').toLowerCase();
      if (anchorSide === 'left' || anchorSide === 'right') {
        modeHint = 'xy'; // first segment horizontal
        hintSourceFirst = 'anchor_side';
      } else if (anchorSide === 'top' || anchorSide === 'bottom') {
        modeHint = 'yx'; // first segment vertical
        hintSourceFirst = 'anchor_side';
      }
    }
    if (!modeHintLast) {
      const attachSide = (raw.attach_side || '').toLowerCase();
      if (attachSide === 'left' || attachSide === 'right') {
        modeHintLast = 'yx'; // final horizontal
        hintSourceLast = 'attach_side';
      } else if (attachSide === 'top' || attachSide === 'bottom') {
        modeHintLast = 'xy'; // final vertical
        hintSourceLast = 'attach_side';
      }
    }
    // Geometry-based first segment if not provided
    if (!modeHint) {
      const [x1, y1] = a1;
      const [x2, y2] = a2;
      if (Number.isFinite(x1+y1+x2+y2)) {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        modeHint = dx >= dy ? 'xy' : 'yx';
      } else {
        modeHint = 'xy'; // safe fallback
      }
      hintSourceFirst = 'geometry';
    }
    if (!modeHintLast) {
      modeHintLast = modeHint;
      if (!hintSourceLast) hintSourceLast = hintSourceFirst;
    }

    // Always-on (not gated behind an explicit route_hint) so anchor_side/
    // attach_side-derived hints — and whether they were actually recognized
    // as such — are visible without needing to set route_hint explicitly.
    lcardsLog.debug(`[RouterCore] Line '${raw.id}': anchor_side='${raw.anchor_side || ''}' -> modeHint='${modeHint}' (source: ${hintSourceFirst}), attach_side='${raw.attach_side || ''}' -> modeHintLast='${modeHintLast}' (source: ${hintSourceLast})`);

    const smoothingIterations = Number(
      raw.smoothing_iterations ||
      raw.corner_smoothing_iterations ||
      fs.smoothing_iterations ||
      this.config.smoothing_iterations ||
      (this.config.smoothing && this.config.smoothing.iterations) ||
      0
    );
    const smoothingMaxPoints = Number(
      raw.smoothing_max_points ||
      fs.smoothing_max_points ||
      this.config.smoothing_max_points ||
      (this.config.smoothing && this.config.smoothing.max_points) ||
      160
    );

    // === Routing Mode Selection ===
    // Priority: explicit 'route' field > global default_mode > auto (= smart).
    // 'auto' always means full pathfinding — obstacle avoidance, trunk
    // bundling, crossing avoidance — regardless of whether obstacles or
    // channels happen to be present anywhere on the card. There is no more
    // conditional "upgrade": a line that wants the cheap, non-participating
    // alternative opts out explicitly with route: manhattan (no pathfinding,
    // no bundling, no crossing avoidance — a fixed 2-elbow shape) or
    // route: grid (pathfinding + bundling/crossing avoidance, without the
    // extra local-search refinement pass 'smart' adds on top). Both are
    // honored exactly as written now — an explicit manhattan/grid choice is
    // never silently overridden, unlike the old auto-upgrade behavior.
    let modeFull = (raw.route || '').toLowerCase().trim();
    if (!modeFull || modeFull === 'auto') {
      const globalDefault = (this.config.default_mode || '').toLowerCase().trim();
      modeFull = (globalDefault && globalDefault !== 'auto') ? globalDefault : 'smart';
    }

    return {
      id: overlay.id,
      a: a1,
      b: a2,
      modeFull,
      modeHint,
      modeHintLast,
      // Raw side strings (not just the axis-reduced modeHint/modeHintLast) —
      // _computeManhattan needs the actual left/right/top/bottom direction,
      // not just "this segment is horizontal/vertical", to depart/arrive on
      // the correct side instead of just the correct axis.
      anchorSide: (raw.anchor_side || '').toLowerCase(),
      attachSide: (raw.attach_side || '').toLowerCase(),
      _hintSourceFirst: hintSourceFirst,
      _hintSourceLast: hintSourceLast,
      avoidIds: Array.isArray(raw.avoid) ? raw.avoid.slice() : [],
      channels: this._getChannelArray(raw),
      cornerRadius: Number(raw.corner_radius || raw.cornerRadius || fs.corner_radius || 34),
      cornerStyle: (raw.corner_style || raw.cornerStyle || fs.corner_style || 'round').toLowerCase(),
      cornerRadiusMode: (raw.corner_radius_mode || raw.cornerRadiusMode || fs.corner_radius_mode || 'auto').toLowerCase(),
      cornerAngle: Number(raw.corner_angle ?? raw.cornerAngle ?? fs.corner_angle ?? 45),
      smoothingMode,
      smoothingIterations,
      smoothingMaxPoints,
      clearance: Number(raw.clearance || this.config.clearance || 0),
      proximity: Number(raw.smart_proximity || this.config.smart_proximity || 0),
      smart: {
        detourSpan: Number(this.config.smart_detour_span || 48),
        maxExtraBends: Number(this.config.smart_max_extra_bends || 3),
        minImprovement: Number(this.config.smart_min_improvement || 4),
        maxDetoursPerElbow: Number(this.config.smart_max_detours_per_elbow || 4)
      },
      waypoints: Array.isArray(raw.waypoints) ? raw.waypoints : [],
      _rev: this._rev
    };
  }

  _cacheKey(req) {
    const [x1,y1] = req.a;
    const [x2,y2] = req.b;
    // .slice() before sort — Array.prototype.sort mutates in place, and
    // req.channels' declared order is meaningful (force-channel chain
    // sequencing in _computeForceRouted uses route_channels' authored
    // order). Sorting it here for the cache key must not permanently
    // reorder the overlay's own raw config.
    const avoidKey = req.avoidIds.slice().sort().join(',');
    const chanKey = req.channels.slice().sort().join(',');
    // viewBox is included so a pan/resize (unchanged anchors/mode/obstacles)
    // can't hit a route cached under the previous origin/dimensions.
    const vb = this.viewBox || [0,0,400,200];
    // RV (registryVersion) makes a repeated computePath call for the SAME
    // request recompute rather than cache-hit whenever any line's trunk/
    // crossing registration has mutated since this entry was cached — the
    // mechanism that lets a bounded discovery loop (see AdvancedRenderer
    // _discoverLineRoutes) converge without ever calling invalidate().
    return `${req.id}@${x1},${y1}-${x2},${y2}|${req.modeFull}|${req.modeHint}|A:${avoidKey}|C:${chanKey}|R:${req._rev}|O:${this._obsVersion}|P:${req.proximity}|CR:${req.cornerRadius}|CS:${req.cornerStyle}|CRM:${req.cornerRadiusMode}|SM:${req.smoothingMode}|SI:${req.smoothingIterations}|VB:${vb[0]},${vb[1]},${vb[2]},${vb[3]}|RV:${this._registryVersion}`;
  }

  /**
   * When anchor_side/attach_side resolves to a real cardinal direction
   * ('left'/'right'/'top'/'bottom'), build short, fixed lead-out/lead-in
   * stub points in that exact direction (same stubLengthFor()/logic
   * _computeManhattan uses for its own algorithm) and return a request whose
   * a/b are the *stub* endpoints — so whichever pathfinder runs between them
   * can't second-guess the required departure/arrival side, it just finds a
   * path between two points that are already offset the required way.
   * @param {object} req
   * @returns {{ stubReq: object, prefix: number[][], suffix: number[][] }}
   */
  _applyCardinalStubs(req) {
    const anchorDir = req._hintSourceFirst === 'anchor_side' ? CARDINAL_DIR[req.anchorSide] : null;
    const attachDir = req._hintSourceLast === 'attach_side' ? CARDINAL_DIR[req.attachSide] : null;
    if (!anchorDir && !attachDir) {
      return { stubReq: req, prefix: [], suffix: [] };
    }
    const stubLength = cardinalStubLengthFor(req, this._resolvedGridResolution());
    const [x1, y1] = req.a;
    const [x2, y2] = req.b;
    const p1 = [x1, y1];
    const p2 = [x2, y2];

    // Two-step clamp: first the viewBox edge (independent per stub), then
    // — using each stub's own edge-clamped position as the OTHER stub's
    // reference — shorten either stub that would otherwise land past where
    // the other one ends up (see _noOvershootStub).
    const anchorFull = anchorDir ? this._clampStubLength(stubLength, anchorDir, p1) : stubLength;
    const attachFull = attachDir ? this._clampStubLength(stubLength, attachDir, p2) : stubLength;
    const p1sFull = anchorDir ? [x1 + anchorDir[0]*anchorFull, y1 + anchorDir[1]*anchorFull] : p1;
    const p2sFull = attachDir ? [x2 + attachDir[0]*attachFull, y2 + attachDir[1]*attachFull] : p2;
    const anchorStub = anchorDir ? this._noOvershootStub(anchorFull, anchorDir, p1, p2sFull) : stubLength;
    const attachStub = attachDir ? this._noOvershootStub(attachFull, attachDir, p2, p1sFull) : stubLength;

    const p1s = anchorDir ? [x1 + anchorDir[0]*anchorStub, y1 + anchorDir[1]*anchorStub] : p1;
    const p2s = attachDir ? [x2 + attachDir[0]*attachStub, y2 + attachDir[1]*attachStub] : p2;
    return {
      stubReq: { ...req, a: p1s, b: p2s },
      prefix: anchorDir ? [p1] : [],
      suffix: attachDir ? [p2] : []
    };
  }

  computePath(req) {
    const key = this._cacheKey(req);
      const cached = this._cache.get(key);
      if (cached) {
        return { ...cached, meta: { ...cached.meta, cache_hit: true } };
      }
      let result;
      const mode = req.modeFull;
      // Force channels are mandatory; prefer channels/trunks are optional
      // candidates (see _computeCorridorRouted's own comment for why a
      // plain per-cell cost bias alone can't reliably pull a route toward
      // one). explicitCorridors is the same derivation _computeChannelRouted
      // used to do internally, hoisted up here so it can be merged with
      // discovered trunks below.
      const explicitCorridors = req.channels?.length > 0
        ? req.channels.map(id => this._channels.find(c => c.id === id && (c.mode === 'force' || c.mode === 'prefer'))).filter(Boolean)
        : [];
      const hasForceChannels = explicitCorridors.some(c => c.mode === 'force');

      // A cardinal anchor_side/attach_side ('left'/'right'/'top'/'bottom')
      // must be honored absolutely, regardless of routing mode — not just
      // biased. _computeManhattan already guarantees this for its own
      // algorithm via fixed lead-out/lead-in stub segments; do the same here
      // for grid/smart routing by pathfinding between the *stub* endpoints
      // and splicing the guaranteed-direction segments back on afterward —
      // so "left" always means "always departs/arrives from the left" no
      // matter what the pathfinder decides in between. Excluded: manual
      // (fully user-controlled via waypoints) and direct (meant to stay a
      // literal, unprocessed 2-point line). Corridor-routed lines
      // (_computeCorridorRouted) go through the SAME stub-eligible path —
      // it only ever applies the outer anchor_side/attach_side hint at the
      // true first/last leg boundary (every interior leg boundary uses
      // 'channel_axis' instead), so there's no risk of double-applying the
      // stub the way the old _computeWaypoint's internal _computeManhattan
      // fallback could.
      const { stubReq, prefix, suffix } = (mode !== 'manual' && mode !== 'direct')
        ? this._applyCardinalStubs(req)
        : { stubReq: req, prefix: [], suffix: [] };
      lcardsLog.debug(`[RouterCore] Line '${req.id}': a=${JSON.stringify(req.a)} b=${JSON.stringify(req.b)} -> stubReq.a=${JSON.stringify(stubReq.a)} stubReq.b=${JSON.stringify(stubReq.b)} prefix=${JSON.stringify(prefix)} suffix=${JSON.stringify(suffix)}`);

      // Trunk-and-branch: discover any nearby, joinable trunks (config
      // channels the line never referenced, or runs already registered
      // from another line's finished route — see _discoverTrunkCandidates)
      // and merge them with the line's own explicit corridors. A discovered
      // trunk is never mandatory the way a force channel is — it's folded
      // into the same optional-candidate cost comparison prefer channels
      // already use below. A FORCE chain skips discovery entirely: the
      // chained result is used unconditionally (no cost comparison), so a
      // discovered trunk appended to it would become mandatory with no
      // vetting at all — confirmed to chain force-channel users through
      // each other's freshly-registered approach runs, zigzagging between
      // near-parallel corridors and never converging.
      const discoveredTrunks = (mode === 'smart' || mode === 'grid') && !hasForceChannels
        ? this._discoverTrunkCandidates(req.id, req.a, req.b, new Set(explicitCorridors.map(c => c.id)), explicitCorridors)
        : [];
      if (discoveredTrunks.length) {
        lcardsLog.debug(`[RouterCore] Line '${req.id}': discovered ${discoveredTrunks.length} joinable trunk(s): ${discoveredTrunks.map(t => `${t.id}(overlap=${t.overlap.toFixed(1)})`).join(', ')}`);
      }
      const corridors = this._mergeCorridors(explicitCorridors, discoveredTrunks, stubReq);
      const usesCorridorRouting = corridors.length > 0 && (mode === 'smart' || mode === 'grid');

      // Alternative corridor sets worth comparing on real cost, not just the
      // one full union tried until now: chaining through EVERY discovered
      // trunk together can cost more than joining just the single best one,
      // when 2+ trunks are each independently "close enough" to pass
      // discovery's proximity/overlap gates without actually being on the
      // same natural path. Confirmed in the field (real user report): a
      // line bundled with a short, off-axis trunk for part of its journey —
      // forcing an actual crossing of that trunk's own line on the way out
      // of it — even though a SECOND, better-aligned trunk alone already
      // covered the line's full journey end-to-end, more cheaply, with no
      // crossing at all.
      //
      // Tried solo regardless of `_isMember`: membership here only means
      // this line's own rendered path happened to run near that trunk's
      // centerline (_mergeOrRegisterTrunk's proximity match, evaluated
      // AFTER the fact against whatever route was actually chosen) — it is
      // NOT a record of a deliberate, cost-vetted join decision, and
      // confirmed in the field to arrive before the SECOND trunk is even
      // discovered (so a membership-based exclusion here never actually
      // triggers for exactly the config that motivated this fix). A
      // genuinely necessary multi-leg chain (e.g. a real horizontal/
      // vertical/horizontal journey, each leg its own trunk) is unaffected:
      // trying one of its trunks solo just produces a costlier, incomplete
      // route that the comparison below naturally rejects in favor of the
      // full chain — no special-casing needed, real cost already decides.
      const corridorOptions = discoveredTrunks.length > 1
        ? [corridors, ...discoveredTrunks.map(t => this._mergeCorridors(explicitCorridors, [t], stubReq))]
        : [corridors];

      try {
        lcardsLog.debug(`[RouterCore] Route '${req.id}': mode=${mode}, channels=${req.channels?.join(',') || 'none'}, hasForce=${hasForceChannels}`);

        const computePlain = () => {
          if (mode === 'grid') return this._computeGrid(stubReq);
          const gridBase = this._computeGrid(stubReq, { smart: true });
          return gridBase ? this._refineSmart(stubReq, gridBase) : null;
        };

        if (mode === 'manual') {
          lcardsLog.debug(`[RouterCore] Using manual routing for '${req.id}' with ${req.waypoints?.length || 0} waypoints`);
          result = this._computeManual(req);
        } else if (mode === 'direct') {
          result = this._computeDirect(req);
        } else if (usesCorridorRouting) {
          if (hasForceChannels) {
            // Force channels are mandatory — always use the full merged
            // chain regardless of cost (corridorOptions' per-trunk
            // alternatives only ever apply to optional prefer/discovered
            // trunks; hasForceChannels guarantees `corridors` itself is
            // non-empty, so _computeCorridorRouted should never return null
            // here, but the null-check keeps this branch safe either way).
            const chained = this._computeCorridorRouted(stubReq, mode === 'smart', corridors);
            lcardsLog.debug(`[RouterCore] Using corridor-forced routing for '${req.id}' (mandatory)`);
            result = chained;
          } else {
            // Prefer-channel/trunk-only: every corridor OPTION (the full
            // merged chain, plus — when 2+ fresh trunks exist — each on its
            // own; see corridorOptions above) and the plain, uncorridored
            // route are all optional candidates — only worth it if actually
            // bundling costs less overall. Compared on an EFFECTIVE cost —
            // each candidate's own reported meta.cost (distance+bends+
            // channelDelta) plus _segmentCrossingPenalty(pts) — not
            // meta.cost alone: a corridor "ride this trunk" leg's endpoints
            // are fixed by the trunk itself, so a genuine crossing with
            // another line's own path is often unavoidable for that
            // candidate's shape, yet was never reflected in meta.cost at
            // all. Confirmed as a real bug: a solo-trunk candidate with two
            // real crossings beat a same-length alternative with only one,
            // purely because crossings weren't part of either compared
            // cost. meta.cost itself is left unmodified on the returned
            // result — this penalty is a comparison-time tiebreaker, not a
            // claim about the chosen route's own reported cost.
            const plain = computePlain();
            const effectiveCost = (candidate) => candidate.meta.cost + this._segmentCrossingPenalty(candidate.pts, req.id);
            let best = plain;
            let bestCost = plain ? effectiveCost(plain) : Infinity;
            let bestLabel = plain ? 'plain' : null;
            for (const opt of corridorOptions) {
              const candidate = this._computeCorridorRouted(stubReq, mode === 'smart', opt);
              if (!candidate) continue;
              const cost = effectiveCost(candidate);
              if (!best || cost <= bestCost) {
                best = candidate;
                bestCost = cost;
                bestLabel = opt.map(c => c.id).join('+');
              }
            }
            lcardsLog.debug(`[RouterCore] Route '${req.id}': chose '${bestLabel ?? 'none'}' (effective cost=${Number.isFinite(bestCost) ? bestCost.toFixed(1) : 'n/a'}) among ${corridorOptions.length} corridor option(s) + plain`);
            result = best;
          }
        } else if (mode === 'grid' || mode === 'smart') {
          result = computePlain();
        }
      } catch (e) {
        lcardsLog.warn('[MSD v1] smart/grid router error; fallback to manhattan', e);
      }
      lcardsLog.debug(`[RouterCore] Line '${req.id}': inner result.pts (pre-splice) = ${JSON.stringify(result?.pts)}`);
      if (!result) {
        result = this._computeManhattan(req);
      } else if (prefix.length || suffix.length) {
        let pts = [...prefix, ...result.pts, ...suffix];
        // A fixed cardinal stub's own landing point (result.pts[0] when
        // prefix is set, or result.pts[last] when suffix is set) is purely
        // an internal device (see _applyCardinalStubs) — unlike a
        // channel_axis-forced crossing point (which only ever occurs
        // INSIDE _computeCorridorRouted's own leg composition, never at
        // this outermost splice), nothing downstream depends on it
        // surviving. When the stub overshoots past where the route
        // actually needs to go next (e.g. a discovered trunk's own
        // lane-offset entry sits BEHIND the stub's fixed reach), the
        // spliced result reverses direction right at that landing point.
        // Confirmed as a real, unfixable-at-the-leg-level bug: the
        // correction leg's own pathfinding is already locally correct —
        // there's no better shape for a short, obstacle-free step
        // backward — so this can only be resolved here, at the splice
        // boundary, by dropping the redundant landing point and
        // connecting the true anchor/attach point directly to wherever
        // the route actually continues.
        // Only collapse when the resulting DIRECT segment (skipping the
        // landing point entirely) doesn't cut through an obstacle — the
        // landing point being non-load-bearing for direction doesn't mean
        // the detour around it was pointless: the stub's own path via that
        // point may have been the only reason an obstacle got avoided in
        // the first place. Confirmed as a real bug the naive unconditional
        // version caused: collapsing a reversal produced a straight line
        // directly through a control's own obstacle box, trading a visible
        // "turnaround" for something worse.
        const collapseReversal = (a, b, c) => {
          const sameX = a[0] === b[0] && b[0] === c[0];
          const sameY = a[1] === b[1] && b[1] === c[1];
          if (!sameX && !sameY) return false;
          const d1 = sameX ? (b[1] - a[1]) : (b[0] - a[0]);
          const d2 = sameX ? (c[1] - b[1]) : (c[0] - b[0]);
          if (d1 === 0 || d2 === 0 || Math.sign(d1) === Math.sign(d2)) return false;
          return !this._segmentCrossesObstacle(a, c);
        };
        if (prefix.length === 1 && pts.length >= 3 && collapseReversal(pts[0], pts[1], pts[2])) {
          pts = [pts[0], ...pts.slice(2)];
        }
        if (suffix.length === 1 && pts.length >= 3 && collapseReversal(pts[pts.length - 3], pts[pts.length - 2], pts[pts.length - 1])) {
          pts = [...pts.slice(0, pts.length - 2), pts[pts.length - 1]];
        }
        result = {
          ...result,
          pts,
          d: this._polylineToPath(pts),
          meta: { ...result.meta, segments: pts.length - 1, bends: Math.max(0, pts.length - 2) }
        };
      }
      lcardsLog.debug(`[RouterCore] Line '${req.id}': final pts (post-splice) = ${JSON.stringify(result?.pts)}`);

      if (result && req.cornerStyle === 'round' && req.cornerRadius > 0) {
        const arcApplied = this._applyCornerRounding(result, req.cornerRadius, req.id);
        if (arcApplied) result = arcApplied;
      } else if (result && req.cornerStyle === 'bevel' && req.cornerRadius > 0) {
        const bevelApplied = this._applyCornerBeveling(result, req.cornerRadius, req.cornerAngle, req.id);
        if (bevelApplied) result = bevelApplied;
      }
      // Trunk registration must happen here: after corner-rounding/beveling
      // (confirmed neither touches pts, only d) and before smoothing
      // (confirmed it DOES replace pts with curved points — registering
      // after smoothing would poison the trunk registry with non-axis-
      // aligned "segments"). Only runs on the cache-miss path reached here
      // (a cache hit returns early above), so nothing about this line
      // changing means nothing about its trunk registrations should either.
      // No purge-then-re-register: _registerLineSegments diffs BOTH
      // registries in place (update matching entries, then drop only
      // genuinely stale ones), so an identical recompute is a strict
      // version no-op — see its own comment for why that discipline is
      // load-bearing for discovery-loop convergence.
      let joinedForeignTrunk = false;
      if (result) {
        joinedForeignTrunk = this._registerLineSegments(req.id, result.pts, req.a, req.b);
      }
      // Apply smoothing AFTER corner arcs (arcs preserved, path rebuilt as polyline if smoothing > 0)
      if (result && req.smoothingMode !== 'none' && req.smoothingIterations > 0) {
        const smoothApplied = this._applySmoothing(result, req);
        if (smoothApplied) result = smoothApplied;
      }

      // Re-derive the storage key rather than reusing the lookup key from
      // the top of this function: registration above may just have bumped
      // _registryVersion, and the entry must be stored under the key a
      // FUTURE identical request will actually compute (i.e. reflecting
      // this call's own registration side effect), or every repeat of this
      // exact request would perpetually miss and re-register, never
      // reaching a stable cache hit.
      //
      // Skipped entirely when this call just made this line a NEW member of
      // a trunk it doesn't own (joinedForeignTrunk) — that new membership is
      // exactly what makes _discoverTrunkCandidates' membership bypass
      // offer that trunk as a routing candidate, but only on a FUTURE call.
      // Storing this call's result under the post-registration key would
      // make the very next identical request look like an already-stable
      // cache hit forever, silently hiding the newly-eligible trunk from
      // ever being reconsidered (confirmed: without this, a line that
      // coincidentally overlaps another line's trunk registers as a member
      // with zero effect on its own geometry, permanently).
      if (!joinedForeignTrunk) {
        const storeKey = this._cacheKey(req);
        this._cache.set(storeKey, result);
        this._cacheOrder.push(storeKey);
        if (this._cacheOrder.length > this._maxCache) {
          const oldest = this._cacheOrder.shift();
          if (oldest) this._cache.delete(oldest);
        }
      }
      return { ...result, meta: { ...result.meta, cache_hit: false } };
  }

  /**
   * Manual routing through explicit waypoints
   * Creates a polyline path through user-specified coordinates
   * @param {object} req - Route request with waypoints array
   * @returns {object} Route result with manual path
   * @private
   */
  _computeManual(req) {
    const [x1, y1] = req.a;
    const [x2, y2] = req.b;
    const waypoints = req.waypoints || [];

    // Build path: start → waypoints → end
    const pts = [[x1, y1]];

    // Add all waypoints (support both coordinate arrays and named anchors)
    for (const wp of waypoints) {
      if (Array.isArray(wp) && wp.length >= 2) {
        // Coordinate waypoint: [x, y]
        pts.push([Number(wp[0]), Number(wp[1])]);
      } else if (typeof wp === 'string' && this.anchors[wp]) {
        // Named anchor waypoint: "anchor_name"
        const anchorPos = this.anchors[wp];
        if (Array.isArray(anchorPos) && anchorPos.length >= 2) {
          pts.push([Number(anchorPos[0]), Number(anchorPos[1])]);
        }
      }
    }

    // Add endpoint
    pts.push([x2, y2]);

    // Remove duplicate consecutive points
    const cleaned = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const last = cleaned[cleaned.length - 1];
      if (pts[i][0] !== last[0] || pts[i][1] !== last[1]) {
        cleaned.push(pts[i]);
      }
    }

    const d = this._polylineToPath(cleaned);

    return {
      d,
      pts: cleaned,
      meta: {
        strategy: 'manual',
        cost: this._costSimple(cleaned),
        segments: cleaned.length - 1,
        bends: Math.max(0, cleaned.length - 2),
        waypoints: waypoints.length,
        editable: true
      }
    };
  }

  /**
   * grid_resolution's default when the config leaves it unset — scaled off
   * the viewBox's own shorter dimension rather than a single flat number.
   * A fixed default is only ever "right" by coincidence: it depends on how
   * large the author's own view_box happens to be, which varies a lot
   * across real MSDs (a few hundred units for a compact panel, thousands
   * for a full ship blueprint). Targeting a roughly constant CELL COUNT
   * across the shorter axis instead keeps routing granularity relative to
   * the diagram's own scale, so a small MSD isn't stuck with a grid too
   * coarse to route around a single control, and a huge one doesn't pay
   * for needlessly fine A* search. Clamped to [16, 64] — 64 is today's old
   * flat default (a ceiling, not a target: large viewBoxes behave exactly
   * as before), 16 is a floor fine enough to be useful without users
   * accidentally landing in genuinely slow territory just by picking a
   * small view_box. Explicit `grid_resolution` in config always overrides
   * this — this only ever runs when it's unset.
   * @returns {number}
   */
  _defaultGridResolution() {
    const vb = this.viewBox || [0, 0, 400, 200];
    const shortSide = Math.min(vb[2], vb[3]);
    const targetCellsAcross = 12;
    return Math.min(64, Math.max(16, shortSide / targetCellsAcross));
  }

  /**
   * The grid_resolution actually in effect for this router right now —
   * explicit config if set, else the scalable default — mirroring
   * _computeGrid's own `baseRes = Number(this.config.grid_resolution ||
   * this._defaultGridResolution())` exactly, including its own coercion
   * (values <= 4 silently floor to 32; _computeGrid's own comment covers
   * why). Recomputed fresh on every call rather than cached: viewBox (and
   * therefore the scalable default) can change live via setViewBox(), and
   * config could in principle too — this must never go stale the way a
   * cached value could. Used by cardinalStubLengthFor's 'auto'-mode floor
   * to keep the mandatory cardinal stub at least one grid cell long,
   * regardless of how large grid_resolution's own default grows for a big
   * viewBox.
   * @returns {number}
   */
  _resolvedGridResolution() {
    const baseRes = Number(this.config.grid_resolution || this._defaultGridResolution());
    return baseRes > 4 ? baseRes : 32;
  }

  _computeGrid(req, flags={}) {
    const vb = this.viewBox || [0,0,400,200];
    const originX = vb[0];
    const originY = vb[1];
    const width = vb[2];
    const height = vb[3];
    const res = this._resolvedGridResolution();
    const cols = Math.max(2, Math.ceil(width / res));
    const rows = Math.max(2, Math.ceil(height / res));
    const clearance = Math.max(0, req.clearance || this.config.clearance || 0);

    // Cache key includes the full viewBox (origin + size), not just
    // resolution/obstacles/clearance — without this, panning or resizing the
    // viewBox with an unchanged resolution/obstacle-version/clearance would
    // silently reuse a grid built for the previous origin/dimensions.
    const gridKey = `${res}|${this._obsVersion}|${clearance}|${originX},${originY},${width},${height}`;
    let occ = this._gridCache.get(gridKey);
    if (!occ) {
      occ = this._buildOccupancy(cols, rows, res, clearance, originX, originY);
      this._gridCache.set(gridKey, occ);
    }

    // Per-cell prefer/avoid channel cost bias — separate cache from
    // occupancy (see _channelCostCache's constructor comment): keyed on this
    // line's own referenced channel subset, not just resolution/viewBox,
    // since bias is opt-in per line rather than global like obstacles.
    const chanKey = this._channelCostKey(req.channels);
    const chanCostKey = `${chanKey}|${res}|${originX},${originY},${width},${height}`;
    let chanCost = this._channelCostCache.get(chanCostKey);
    if (!chanCost) {
      chanCost = this._buildChannelCostGrid(cols, rows, res, originX, originY, req.channels);
      this._channelCostCache.set(chanCostKey, chanCost);
    }

    // Per-cell crossing-avoidance penalty — see _buildCrossingCostGrid.
    // Keyed on this line's own id (self-exclusion), any corridor-leg
    // exemption list (see _computeCorridorRouted's legBase), and
    // _registryVersion (not _obsVersion — registry churn is unrelated to
    // obstacle changes).
    const exemptIds = req._crossingExemptIds || [];
    const crossCostKey = `${req.id}|E:${exemptIds.join(',')}|${res}|${originX},${originY},${width},${height}|${this._registryVersion}`;
    let crossCost = this._crossingCostCache.get(crossCostKey);
    if (!crossCost) {
      crossCost = this._buildCrossingCostGrid(cols, rows, res, originX, originY, req.id, exemptIds);
      this._crossingCostCache.set(crossCostKey, crossCost);
    }

    // World coordinates are relative to the viewBox's own origin (vb[0]/vb[1]),
    // which is not always [0,0] — a custom view_box can legitimately pan into
    // negative minX/minY. Without subtracting/adding the origin here, any
    // sufficiently negative world coordinate would clamp to grid cell 0
    // regardless of its true position.
    const w2c = (x)=>Math.min(cols-1, Math.max(0, Math.round((x - originX) / res)));
    const h2c = (y)=>Math.min(rows-1, Math.max(0, Math.round((y - originY) / res)));
    const c2x = (c)=> c * res + originX;
    const c2y = (r)=> r * res + originY;

    const start = { c: w2c(req.a[0]), r: h2c(req.a[1]) };
    const goal  = { c: w2c(req.b[0]), r: h2c(req.b[1]) };

    // A* (4-direction) with turn penalty
    const open = new MinHeap();
    const key = (c,r)=>`${c},${r}`;
    const gScore = new Map();
    const came = new Map();
    const direction = new Map(); // Track direction to each cell
    // Plain Manhattan-distance heuristic assumes a minimum step cost of 1 —
    // admissible (never overestimates true remaining cost) as long as every
    // real step costs >= 1. A 'prefer' channel discount (_buildChannelCostGrid)
    // can drop a step's cost as low as MIN_STEP_COST, which breaks that
    // assumption: the heuristic can then OVERESTIMATE the true cost of a
    // discounted route, causing A* to pop the goal via a costlier
    // undiscounted path before ever fully exploring the genuinely cheaper
    // discounted one — a real optimality violation, confirmed empirically
    // (a route through a wide, closely-adjacent prefer channel that should
    // undercut the direct path was not found without this). Fall back to
    // h=0 (uniform-cost/Dijkstra, always admissible) whenever this request
    // references any 'prefer'-mode channel; grids here are small enough
    // (bounded by maxIterations below) that the performance cost is
    // negligible. 'avoid'-only or no-channel requests keep the informed
    // heuristic — positive-only deltas only ever make costs higher, so
    // admissibility is unaffected and the search stays fast.
    const hasPreferChannel = req.channels?.some(id =>
      this._channels.some(c => c.id === id && c.mode === 'prefer'));
    const h = hasPreferChannel
      ? () => 0
      : (c,r)=> Math.abs(c-goal.c)+Math.abs(r-goal.r);

    // Get turn penalty from config (default: 2)
    const turnPenalty = Number(this.config.turn_penalty ?? 2);
    // Penalty applied when a move disagrees with the configured route_hint
    // (first segment) / route_hint_last (final segment). req.modeHint is
    // always populated (explicit config, attach_side-derived, or geometry
    // fallback — see buildRouteRequest()) but was previously never consulted
    // here, so grid/smart routes ignored route_hint entirely. A penalty
    // (rather than a hard constraint) still lets A* route around a real
    // obstacle sitting in the hinted direction.
    const hintPenalty = Number(this.config.route_hint_penalty ?? 6);

    gScore.set(key(start.c,start.r),0);
    open.push({ c:start.c, r:start.r, f:h(start.c,start.r) });

    // _buildOccupancy rasterizes an obstacle's own boundary cell too — the
    // exact cell its own attach point sits on. The start cell already never
    // hits this check (pushed onto the open set directly, above); the goal
    // cell did, though, so a route between two obstacle-flagged overlays
    // could never step into its own goal, silently falling back to
    // _computeManhattan (see computePath). Exempting both explicitly here
    // only affects the single start/goal cell each route touches — it
    // doesn't weaken avoidance of any other obstacle along the path.
    const blocked = (c,r) => {
      if ((c === start.c && r === start.r) || (c === goal.c && r === goal.r)) return false;
      return occ[r] && occ[r][c] === 1;
    };

    const maxIterations = cols*rows * 4; // guard
    let iterations = 0;
    let found = false;

    while(!open.isEmpty() && iterations++ < maxIterations) {
      const cur = open.pop();
      if (cur.c === goal.c && cur.r === goal.r) {
        // A same-cell collapse — start and goal snap to the same grid
        // cell — short-circuits here, on the very first pop, BEFORE the
        // neighbor-expansion loop below ever runs. That loop is where
        // EVERY directional-hint check lives (the anchor_side/anchor_stub
        // reversal-block, the channel_axis hard axis-lock) — so any leg
        // whose endpoints are closer than ~1 grid cell apart skipped every
        // hint check entirely, regardless of source. Confirmed via
        // execution: a corridor-approach leg's raw endpoints collapsed to
        // the same cell at a real grid_resolution, and the exact reversal
        // it represented rendered completely unvalidated. Re-check the
        // RAW, un-snapped req.a->req.b displacement against whichever hard
        // hints actually apply — same predicates the neighbor loop uses
        // below, just evaluated once against the real coordinates instead
        // of a single grid step. 'anchor_stub'/'attach_stub' are included
        // here (not just 'anchor_side'/'attach_side'): the neighbor loop
        // hard-blocks both identically (a soft cost-penalty version of
        // 'anchor_stub' was tried and reverted — see that branch's own
        // comment), so exempting them here would leave the same-cell path
        // inconsistent with the multi-step path for the exact leg this fix
        // targets. Only 'geometry'/no hint are truly unchecked, preserving
        // today's collapse-acceptance behavior for genuinely unconstrained
        // legs.
        if (cur.c === start.c && cur.r === start.r) {
          const dxRaw = req.b[0] - req.a[0];
          const dyRaw = req.b[1] - req.a[1];
          let hintViolated = false;
          if (req._hintSourceFirst === 'anchor_side' || req._hintSourceFirst === 'anchor_stub') {
            const dir = CARDINAL_DIR[req.anchorSide];
            if (dir) {
              const axisIsX = dir[0] !== 0;
              const rawDelta = axisIsX ? dxRaw : dyRaw;
              if (rawDelta !== 0 && Math.sign(rawDelta) === -(axisIsX ? dir[0] : dir[1])) hintViolated = true;
            }
          } else if (req._hintSourceFirst === 'channel_axis' && (req._channelAxisHorizontalFirst ? dxRaw : dyRaw) !== 0) {
            // Only enforced when the REQUIRED axis itself has real raw
            // distance to cover — mirrors the neighbor loop's own
            // degenerate-axis relief (see its comment): this hint can
            // describe a channel other than the one this exact leg
            // crosses, and when that axis is already zero for this leg,
            // "violating" it would only ever mean rejecting a collapse
            // that has nowhere better to go anyway.
            const isHorizontalDominant = Math.abs(dxRaw) >= Math.abs(dyRaw);
            if (isHorizontalDominant !== req._channelAxisHorizontalFirst) hintViolated = true;
          }
          if (!hintViolated && (req._hintSourceLast === 'attach_side' || req._hintSourceLast === 'attach_stub')) {
            const dir = CARDINAL_DIR[req.attachSide];
            if (dir) {
              const axisIsX = dir[0] !== 0;
              const rawDelta = axisIsX ? dxRaw : dyRaw;
              if (rawDelta !== 0 && Math.sign(rawDelta) === (axisIsX ? dir[0] : dir[1])) hintViolated = true;
            }
          } else if (!hintViolated && req._hintSourceLast === 'channel_axis' && (req._channelAxisHorizontalLast ? dxRaw : dyRaw) !== 0) {
            const isHorizontalDominant = Math.abs(dxRaw) >= Math.abs(dyRaw);
            if (isHorizontalDominant !== req._channelAxisHorizontalLast) hintViolated = true;
          }
          if (hintViolated) break; // found stays false -> null, caller falls back
        }
        found = true;
        break;
      }
      const gCur = gScore.get(key(cur.c,cur.r));
      const curDir = direction.get(key(cur.c,cur.r)); // Previous direction

      for (const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nc = cur.c+dc, nr = cur.r+dr;
        if (nc<0||nr<0||nc>=cols||nr>=rows) continue;
        if (blocked(nc,nr)) continue;

        const nk = key(nc,nr);
        const newDir = `${dc},${dr}`;
        const isHorizontalMove = dr === 0;

        // Add turn penalty if direction changed (but not on first move)
        const isDirectionChange = curDir && curDir !== newDir;
        // Prefer/avoid channel bias on the destination cell being entered —
        // consistent with blocked(nc,nr) above already gating on the
        // destination cell. Floored so a full-weight 'prefer' discount can
        // never drive a step's cost to zero/negative (see MIN_STEP_COST).
        // 'prefer' only rewards a move along the channel's own configured
        // direction (horizOnly/vertOnly); 'avoid' (anyDir) applies regardless.
        const chanDelta = (chanCost.anyDir[nr]?.[nc] || 0) +
          (isHorizontalMove ? (chanCost.horizOnly[nr]?.[nc] || 0) : (chanCost.vertOnly[nr]?.[nc] || 0));
        // Crossing-avoidance penalty — a move that is horizontal crosses a
        // VERTICAL registered segment (and vice versa); disjoint from
        // chanDelta's horizOnly/vertOnly reward tables by construction (see
        // _buildCrossingCostGrid), so parallel bundling through a trunk's
        // cell is never also penalized here. Always >= 0, so it never
        // threatens h()'s admissibility the way a 'prefer' discount does —
        // no h=0 fallback needed for this term.
        //
        // Unlike chanDelta (checked at the destination cell only), a
        // registered segment is geometrically zero-height/width — it marks
        // exactly ONE row (for a horizontal segment) or column (vertical),
        // never a span. A vertical move can arrive AT that row (destination
        // = the marked row) or depart FROM it (source = the marked row,
        // destination is the next row over) depending purely on which
        // direction the path happens to approach from — checking only the
        // destination cell would silently miss the "departing" case (a
        // move whose destination is the row just past the wall never sees
        // the wall's own marked row at all). Checking both the source and
        // destination cell/row catches the crossing regardless of approach
        // direction, without double-counting a single wall (a move's
        // source and destination row/column are always distinct for a real
        // move, so only one of the two terms can be nonzero for any one
        // wall — summing just covers "whichever side it's marked on").
        const crossDelta = isHorizontalMove
          ? (crossCost.horiz[nr]?.[cur.c] || 0) + (crossCost.horiz[nr]?.[nc] || 0)
          : (crossCost.vert[cur.r]?.[nc] || 0) + (crossCost.vert[nr]?.[nc] || 0);
        let moveCost = Math.max(MIN_STEP_COST, 1 + chanDelta + crossDelta) + (isDirectionChange ? turnPenalty : 0);

        // Bias the very first move away from the start anchor toward
        // route_hint: 'xy' wants a horizontal first move, 'yx' vertical
        // (same convention as _computeManhattan's firstMode).
        if (!curDir && req.modeHint) {
          if (req._hintSourceFirst === 'anchor_side') {
            // Not a full direction requirement — computePath's stub-splice
            // (_applyCardinalStubs) already guarantees the correct departure
            // side externally via a fixed lead-out segment, so forcing a
            // specific axis here too is redundant and can force an
            // unnecessary extra step (e.g. anchor_side:left + a target
            // straight below: the stub already went left, this pathfinder
            // just needs to go down immediately). Only block the one
            // direction that's a true reversal of the stub's own departure
            // — arriving back at the exact point the stub just left,
            // wasting its reach — which is the mirror of the last-move
            // block below. Perpendicular or continuing-forward moves are
            // both fine and left unbiased.
            //
            // EXCEPT when the goal requires ZERO travel on the CROSS axis
            // (perpendicular to anchorSide's own direction) — the mirror
            // image of channel_axis's degenerate-axis relief below: there,
            // the REQUIRED axis had no distance to cover; here, ALL the
            // distance is on the very axis this block restricts, and the
            // cross axis offers no alternative progress at all. Blocking
            // the one direct direction then forces an artificial detour
            // (step off-axis, travel, step back) that adds bends for no
            // obstacle-avoidance reason — and confirmed as a real bug: the
            // detour's own last move (returning to the goal's cross-axis
            // coordinate) can land in either direction with equal cost, so
            // A* picks arbitrarily, and about half the time that choice
            // then reverses against whatever leg comes immediately after
            // this one, at a splice point (the goal itself) that's
            // genuinely mandatory and can't be collapsed away afterward.
            const anchorSideDir = CARDINAL_DIR[req.anchorSide];
            if (anchorSideDir) {
              const crossIsY = anchorSideDir[0] !== 0;
              const crossDegenerate = crossIsY ? (req.a[1] === req.b[1]) : (req.a[0] === req.b[0]);
              if (!crossDegenerate && dc === -anchorSideDir[0] && dr === -anchorSideDir[1]) continue;
            }
          } else if (req._hintSourceFirst === 'anchor_stub') {
            // Same exact-reversal shape (and same degenerate-cross-axis
            // relief) as the 'anchor_side' branch above, and — despite this
            // leg's start being a resolved stub/cursor, not the raw anchor
            // (see _computeCorridorRouted's k===0 hint downgrade) — still a
            // HARD block here, not a cost penalty. A soft penalty was tried
            // and reverted: `route_hint_penalty` (default 6, a small flat
            // one-time cost) is easily outweighed by even a modest
            // detour-cost difference elsewhere in the grid, so A* started
            // choosing small, GENUINELY UNNECESSARY backtracks whenever
            // grid quantization happened to make one look marginally
            // cheaper (confirmed: introduced NEW reversals at resolutions
            // that had none before). The real fix for "a reversal really is
            // the only option" lives entirely in _computeManhattan's
            // degenerate-and-soft bailout (see anchorHard/attachHard
            // there) — that fallback only activates when _computeGrid
            // legitimately returns null, exactly the hard-block outcome
            // this branch produces, so keeping this hard costs nothing: the
            // genuinely-necessary case is still handled, just one level
            // down, and A* itself never explores a needless reversal it
            // shouldn't have.
            const anchorSideDir = CARDINAL_DIR[req.anchorSide];
            if (anchorSideDir) {
              const crossIsY = anchorSideDir[0] !== 0;
              const crossDegenerate = crossIsY ? (req.a[1] === req.b[1]) : (req.a[0] === req.b[0]);
              if (!crossDegenerate && dc === -anchorSideDir[0] && dr === -anchorSideDir[1]) continue;
            }
          } else if (req._hintSourceFirst === 'channel_axis') {
            // Force-channel leg boundary: this leg's very first move must
            // cross exactly along the channel's flow axis (unlike the
            // anchor_side reversal-only block above, ANY off-axis first move
            // is wrong here — a channel is entered horizontally or it isn't
            // a horizontal crossing at all). Plain boolean, not the
            // 'xy'/'yx' string convention, to avoid its first-vs-last sign
            // inversion (see _channelAxisHorizontalFirst/Last on the request).
            //
            // EXCEPT when this leg's own raw endpoints already share that
            // exact axis's coordinate (zero available distance to cover on
            // it). This hint can describe a DIFFERENT channel than the one
            // this leg itself crosses — see _pushBundledApproachLegs's
            // unsplit-fallback branch: firstHint there carries the
            // PREVIOUS channel's own flow axis, as a "continue smoothly out
            // of that corridor" preference, not a claim that THIS leg
            // crosses it too. When the axis is degenerate for this leg,
            // hard-blocking every move except one that covers zero real
            // distance leaves no legal non-detour choice, forcing a
            // synthetic out-and-back zigzag purely to satisfy an
            // unsatisfiable preference. Confirmed as a real bug via a
            // higher-line-count stress scenario: a leg whose fixed
            // start/end shared an x-coordinate (a straight vertical
            // correction) was forced to jog sideways and back for no
            // geometric reason.
            const axisFlow = req._channelAxisHorizontalFirst ? 0 : 1;
            if (req.a[axisFlow] !== req.b[axisFlow]) {
              if (isHorizontalMove !== req._channelAxisHorizontalFirst) continue;
            }
          } else {
            const wantsHorizontalFirst = req.modeHint === 'xy';
            if (wantsHorizontalFirst !== isHorizontalMove) moveCost += hintPenalty;
          }
        }
        // Bias the final move into the goal toward route_hint_last: 'xy'
        // means the last segment is vertical, 'yx' horizontal (see
        // _computeManhattan's lastMode comment for the same convention).
        if (nc === goal.c && nr === goal.r && req.modeHintLast) {
          if (req._hintSourceLast === 'attach_side') {
            // Hard block, but only the exact OPPOSITE of the fixed suffix
            // segment's own direction — that's the one approach that's a
            // true reversal (arrive still heading outward, then immediately
            // reverse inward for the fixed stub right where they meet, a
            // visible pinch). A perpendicular approach is just a normal
            // corner, not a reversal, and allowing it matters: blocking
            // every direction except one exact match forces the path to
            // detour by at least one full grid cell to line up with that
            // single allowed approach, even when a perpendicular or
            // near-immediate approach would already be correct (e.g. two
            // controls only slightly offset — the previous all-but-one-
            // direction block was forcing an entire extra grid cell of
            // travel just to satisfy it). CARDINAL_DIR[attachSide] is the
            // side's OUTWARD normal — arriving while still moving that way
            // is the only case that reverses for the fixed suffix segment,
            // which then travels the opposite (inward) way into the real
            // endpoint.
            //
            // Mirrors anchor_side's own degenerate-cross-axis relief (see
            // its comment): when the approach requires ZERO travel on the
            // cross axis (perpendicular to attachSide's own direction),
            // every bit of real distance is on the axis this block
            // restricts, and blocking the one direct arrival direction
            // forces an artificial detour with an arbitrary, potentially
            // reversal-prone last move instead.
            const sideDir = CARDINAL_DIR[req.attachSide];
            if (sideDir) {
              const crossIsY = sideDir[0] !== 0;
              const crossDegenerate = crossIsY ? (req.a[1] === req.b[1]) : (req.a[0] === req.b[0]);
              if (!crossDegenerate && sideDir[0] === dc && sideDir[1] === dr) continue;
            }
          } else if (req._hintSourceLast === 'attach_stub') {
            // Hard mirror of 'attach_side' above (including the same
            // degenerate-cross-axis relief) — see the 'anchor_stub' comment
            // on the first-move side for why this stays a hard block
            // otherwise (a soft cost penalty was tried and reverted: it let
            // A* choose genuinely unnecessary reversals whenever grid
            // quantization made one look marginally cheaper elsewhere).
            const sideDir = CARDINAL_DIR[req.attachSide];
            if (sideDir) {
              const crossIsY = sideDir[0] !== 0;
              const crossDegenerate = crossIsY ? (req.a[1] === req.b[1]) : (req.a[0] === req.b[0]);
              if (!crossDegenerate && sideDir[0] === dc && sideDir[1] === dr) continue;
            }
          } else if (req._hintSourceLast === 'channel_axis') {
            // Symmetric to the first-move case above: this leg's arrival
            // into the goal must cross exactly along the channel's flow
            // axis. Hard block (not a penalty) on any off-axis arrival —
            // except, mirroring the first-move degenerate-axis relief
            // above, when this leg's own raw endpoints already share that
            // axis's coordinate (zero available distance on it), where the
            // hard block would force the same kind of unsatisfiable,
            // synthetic zigzag right before arrival instead of on departure.
            const axisFlow = req._channelAxisHorizontalLast ? 0 : 1;
            if (req.a[axisFlow] !== req.b[axisFlow]) {
              if (isHorizontalMove !== req._channelAxisHorizontalLast) continue;
            } else if (req._continuationDirLast) {
              // The axis-lock just relieved itself (degenerate axis),
              // leaving zero constraint at all — fall back to the same
              // narrower "don't reverse a known continuation" check the
              // dedicated 'continuation' source uses below. See
              // _computeCorridorRouted's entryHint comment: this is
              // exactly the shape that produced a real, reported
              // reversal before this fallback existed.
              const dir = req._continuationHorizontalLast ? [req._continuationDirLast, 0] : [0, req._continuationDirLast];
              if (dc === -dir[0] && dr === -dir[1]) continue;
            }
          } else if (req._hintSourceLast === 'continuation') {
            // Hard block on ONLY the exact reversal of a KNOWN continuation
            // direction — the immediately-following leg's own flow
            // direction (see _computeCorridorRouted's own comment on
            // `continuationDir`), not a full-axis lock. Exactly the same
            // shape as the attach_side/attach_stub blocks above, just
            // sourced from a chained leg's own known direction instead of
            // a user-authored CARDINAL_DIR[attachSide]. A perpendicular
            // arrival is a normal corner and stays unconstrained.
            const dir = req._continuationHorizontalLast ? [req._continuationDirLast, 0] : [0, req._continuationDirLast];
            if (dc === -dir[0] && dr === -dir[1]) continue;
          } else {
            const wantsHorizontalLast = req.modeHintLast === 'yx';
            if (wantsHorizontalLast !== isHorizontalMove) moveCost += hintPenalty;
          }
        }

        const gNew = gCur + moveCost;

        if (gNew < (gScore.get(nk) ?? Infinity)) {
            gScore.set(nk,gNew);
            came.set(nk, [cur.c,cur.r]);
            direction.set(nk, newDir);
            const f = gNew + h(nc,nr);
            open.push({ c:nc, r:nr, f });
        }
      }
    }

    if (!found) {
      return null; // caller will fallback
    }

    // Reconstruct
    const pathCells = [];
    let cc = goal.c, cr = goal.r;
    while(true) {
      pathCells.push([cc,cr]);
      if (cc === start.c && cr === start.r) break;
      const prev = came.get(key(cc,cr));
      if (!prev) break;
      [cc,cr] = prev;
    }
    pathCells.reverse();

    // Compress straight runs into polyline world coords
    let pts = [];
    let lastDir = null;
    for (let i=0;i<pathCells.length;i++) {
      const [pc,pr] = pathCells[i];
      const wx = c2x(pc);
      const wy = c2y(pr);
      if (i===0) { pts.push([wx,wy]); continue; }
      const [pcPrev,prPrev] = pathCells[i-1];
      const dir = [pc-pcPrev, pr-prPrev].join(',');
      if (dir !== lastDir) {
        // new direction, keep previous cell as corner (if not already added)
        pts.push([wx,wy]);
        lastDir = dir;
      } else {
        // same direction – update last point to current (extend segment)
        pts[pts.length-1] = [wx,wy];
      }
    }
    // Guard: start and goal can legitimately collapse into the same grid cell
    // (always possible for close anchors; far more likely with any two
    // sufficiently negative world coordinates prior to the origin-aware w2c/h2c
    // above). When that happens `pts` has length 1, and without this guard the
    // two snap assignments below both target pts[0] — the second clobbering the
    // first, losing the start coordinate and rendering as a bare "M x,y" with no
    // "L" (an invisible line). Must run before origStart/origEnd are captured.
    if (pts.length < 2) {
      pts = [pts[0], pts[0].slice()];
    }

    // Ensure final destination snapping
    const origStart = pts[0].slice();
    const origEnd = pts[pts.length-1].slice();
    pts[0] = [req.a[0], req.a[1]];
    pts[pts.length-1] = [req.b[0], req.b[1]];

    // Snapping the grid-rounded path back onto the exact anchor/attach
    // coordinates can leave the first/last segment diagonal. Direction is
    // decided by req.modeHint/modeHintLast (route_hint / route_hint_last, or
    // their attach_side/geometry-derived defaults — buildRouteRequest()
    // always populates both).
    //
    // If the grid's own first/last leg ALREADY runs in the hinted direction
    // (common — grid corners live at cell-center coordinates, only slightly
    // off the anchor's exact coordinate), extend that same leg to the exact
    // coordinate by adjusting the corner in place rather than inserting a
    // new point. Inserting unconditionally (the previous approach) leaves
    // the grid's original corner in the array too, producing a spurious
    // "wrong way, then back" leg between the new elbow and the old one —
    // e.g. anchor at y=-104 with the grid's real corner at cell-center
    // y=-132 rendered as a ~28px detour up and back down before continuing.
    // Only insert a genuine new elbow when the grid's leg runs the other way.
    // Check first segment
    if (pts.length >= 2) {
      const gridFirstHorizontal = origStart[1] === pts[1][1];
      const gridFirstVertical = origStart[0] === pts[1][0];
      if (req._hintSourceFirst === 'anchor_side' || req._hintSourceFirst === 'anchor_stub') {
        // The stub (computePath's _applyCardinalStubs) already guarantees
        // the true departure direction externally, via a separate fixed
        // segment before req.a — this inner leg just needs to connect
        // orthogonally to the exact stub point, on whichever axis the
        // grid's own path already shares with it. Re-enforcing a specific
        // axis here too (the modeHint-driven branches below) is redundant
        // and, when the grid's own natural axis differs, inserts a spurious
        // near-zero elbow that starves corner rounding right at the stub —
        // e.g. a 2-3px "phantom" segment between the stub's exact endpoint
        // and the grid's nearest cell, capping that corner's radius far
        // below the configured value even though real room exists nearby.
        if (gridFirstHorizontal) {
          pts[1] = [pts[1][0], pts[0][1]];
        } else if (gridFirstVertical) {
          pts[1] = [pts[0][0], pts[1][1]];
        } else if (pts[0][0] !== pts[1][0] && pts[0][1] !== pts[1][1]) {
          pts.splice(1, 0, [pts[1][0], pts[0][1]]);
        }
      } else if (req._hintSourceFirst === 'channel_axis') {
        // Degenerate-axis relief, mirroring the last-move reshape's own
        // (this session's fix): when this leg's raw endpoints already
        // share the REQUIRED axis's own coordinate, forcing the
        // reconstructed path onto the (unsatisfiable) required axis
        // anyway would insert a spurious elbow trying to fake an
        // impossible direction. Confirmed as a real, reported bug: this
        // exact reshape (previously always falling into the generic soft
        // branch below, which has no such relief) undid the neighbor
        // loop's own correctly-directioned departure from a previous
        // corridor's exit.
        const wantsHorizontalFirst = req._channelAxisHorizontalFirst;
        const requiredAxisFlow = wantsHorizontalFirst ? 0 : 1;
        if (req.a[requiredAxisFlow] !== req.b[requiredAxisFlow]) {
          if (wantsHorizontalFirst && gridFirstHorizontal) {
            pts[1] = [pts[1][0], pts[0][1]];
          } else if (!wantsHorizontalFirst && gridFirstVertical) {
            pts[1] = [pts[0][0], pts[1][1]];
          } else if (pts[0][0] !== pts[1][0] && pts[0][1] !== pts[1][1]) {
            if (wantsHorizontalFirst) {
              pts.splice(1, 0, [pts[1][0], pts[0][1]]);
            } else {
              pts.splice(1, 0, [pts[0][0], pts[1][1]]);
            }
          }
        }
      } else {
        const wantsHorizontalFirst = req.modeHint !== 'yx';
        if (wantsHorizontalFirst && gridFirstHorizontal) {
          pts[1] = [pts[1][0], pts[0][1]];
        } else if (!wantsHorizontalFirst && gridFirstVertical) {
          pts[1] = [pts[0][0], pts[1][1]];
        } else if (pts[0][0] !== pts[1][0] && pts[0][1] !== pts[1][1]) {
          if (wantsHorizontalFirst) {
            pts.splice(1, 0, [pts[1][0], pts[0][1]]);
          } else {
            pts.splice(1, 0, [pts[0][0], pts[1][1]]);
          }
        }
      }
    }
    // Check last segment (same relaxation for attach_side-derived hints —
    // see the first-segment comment above)
    let lastIdx = pts.length - 1;
    if (lastIdx >= 1) {
      const gridLastHorizontal = origEnd[1] === pts[lastIdx-1][1];
      const gridLastVertical = origEnd[0] === pts[lastIdx-1][0];
      if (req._hintSourceLast === 'attach_side' || req._hintSourceLast === 'attach_stub') {
        if (gridLastHorizontal) {
          pts[lastIdx-1] = [pts[lastIdx-1][0], pts[lastIdx][1]];
        } else if (gridLastVertical) {
          pts[lastIdx-1] = [pts[lastIdx][0], pts[lastIdx-1][1]];
        } else if (pts[lastIdx-1][0] !== pts[lastIdx][0] && pts[lastIdx-1][1] !== pts[lastIdx][1]) {
          pts.splice(lastIdx, 0, [pts[lastIdx-1][0], pts[lastIdx][1]]);
        }
      } else if (req._hintSourceLast === 'channel_axis') {
        // Hard requirement, unlike attach_side (soft, reversal-only) or the
        // generic geometry-preference branch below: a corridor crossing's
        // arrival direction is non-negotiable — arriving on the wrong axis
        // means the rendered path doesn't actually travel along the
        // corridor's own configured direction. The generic branches only
        // ever recognize "already matches" or "genuinely diagonal" — they
        // silently do nothing when the segment is ALREADY orthogonal but on
        // the WRONG axis, which can happen once the first-segment fix above
        // (which doesn't know about this hard constraint) has already
        // picked a shape. Confirmed as a real bug: a short trunk-join leg's
        // first-segment fix picked the geometry-preferred axis, incidentally
        // leaving the last segment orthogonal on the axis this hard
        // requirement forbids.
        // NOTE: deliberately NOT reusing gridLastHorizontal/gridLastVertical
        // here — those compare origEnd (the grid's pre-snap natural last
        // point) against pts[lastIdx-1], which is a reasonable proxy for a
        // simple 2-point leg (where pts[lastIdx-1] is the true start) but
        // becomes a stale, unrelated comparison once the path has 3+ points
        // (pts[lastIdx-1] is then a real interior elbow that may coincidentally
        // share a coordinate with origEnd for reasons that have nothing to do
        // with whether the ACTUAL final segment is orthogonal). Confirmed as
        // a real bug: a 4-point channel-crossing leg had a genuinely diagonal
        // final segment while gridLastHorizontal still read true by
        // coincidence, so this hard check must test the real, current
        // segment directly instead.
        const actuallyHorizontal = pts[lastIdx-1][1] === pts[lastIdx][1];
        const actuallyVertical = pts[lastIdx-1][0] === pts[lastIdx][0];
        const wantsHorizontalLast = req._channelAxisHorizontalLast;
        // Degenerate-axis relief, mirroring the main neighbor loop's own
        // (this session's earlier fix): when this leg's raw endpoints
        // already share the REQUIRED axis's own coordinate, forcing the
        // reconstructed path's final segment onto that axis anyway is
        // geometrically backwards — the leg's true, unavoidable direction
        // is the OTHER axis, and the neighbor loop already validated
        // (there, via the continuationDir fallback when this exact
        // degenerate case applies) that its own natural final segment is
        // correct. Confirmed as a real, reported bug: this reshape step
        // had no equivalent relief at all, so it force-corrected an
        // already-correct vertical final segment into a horizontal one,
        // reintroducing the exact reversal the neighbor loop's own
        // continuationDir fallback had just prevented.
        const requiredAxisFlow = wantsHorizontalLast ? 0 : 1;
        const requiredAxisDegenerate = req.a[requiredAxisFlow] === req.b[requiredAxisFlow];
        const alreadyCorrect = requiredAxisDegenerate || (wantsHorizontalLast ? actuallyHorizontal : actuallyVertical);
        if (!alreadyCorrect) {
          if (!actuallyHorizontal && !actuallyVertical) {
            // Genuinely diagonal. The naive fix (insert
            // [pts[lastIdx-1][0], pts[lastIdx][1]] or its mirror) can leave
            // a needlessly SHORT segment when pts[lastIdx-1] is itself just
            // the grid's rough cell-center approximation sitting close to
            // (but not exactly on) the true snap coordinate — confirmed as a
            // real case: a grid corner 5px off from the exact required
            // point produced a tiny reversal-adjacent segment that then
            // capped corner-rounding far below the configured radius. If
            // the point before pts[lastIdx-1] already shares the coordinate
            // the new elbow would keep from pts[lastIdx-1], pts[lastIdx-1]
            // is redundant — replace it instead of inserting alongside it,
            // collapsing the rough grid corner directly into the exact one.
            const newElbow = wantsHorizontalLast
              ? [pts[lastIdx-1][0], pts[lastIdx][1]]
              : [pts[lastIdx][0], pts[lastIdx-1][1]];
            const precedingStillValid = lastIdx >= 2 && (
              wantsHorizontalLast
                ? pts[lastIdx-2][0] === newElbow[0]
                : pts[lastIdx-2][1] === newElbow[1]
            );
            if (precedingStillValid) {
              pts[lastIdx-1] = newElbow;
            } else {
              pts.splice(lastIdx, 0, newElbow);
            }
          } else if (lastIdx >= 2) {
            // Already orthogonal, but on the wrong axis. Can't fix by
            // inserting a point built from pts[lastIdx-1]/pts[lastIdx]
            // alone — combining their own coordinates just reproduces one
            // of them, since they already share an axis. Replace
            // pts[lastIdx-1] using the point before it as the "free"
            // reference coordinate instead, which keeps the PRECEDING
            // segment orthogonal too (possibly on a different axis than
            // before — still valid, since all that's required there is
            // axis-alignment, not a specific one).
            pts[lastIdx-1] = wantsHorizontalLast
              ? [pts[lastIdx-2][0], pts[lastIdx][1]]
              : [pts[lastIdx][0], pts[lastIdx-2][1]];
          }
          // lastIdx === 1 with an already-wrong-axis 2-point path is a
          // narrow residual edge case (pts[lastIdx-1] is the true start,
          // req.a, which must not move) — left unfixed rather than risk a
          // worse detour; needs req.a/req.b already perfectly axis-aligned
          // on exactly the wrong axis, not observed in practice.
        }
      } else {
        const wantsHorizontalLast = req.modeHintLast === 'yx';
        if (wantsHorizontalLast && gridLastHorizontal) {
          pts[lastIdx-1] = [pts[lastIdx-1][0], pts[lastIdx][1]];
        } else if (!wantsHorizontalLast && gridLastVertical) {
          pts[lastIdx-1] = [pts[lastIdx][0], pts[lastIdx-1][1]];
        } else if (pts[lastIdx-1][0] !== pts[lastIdx][0] && pts[lastIdx-1][1] !== pts[lastIdx][1]) {
          if (wantsHorizontalLast) {
            pts.splice(lastIdx, 0, [pts[lastIdx-1][0], pts[lastIdx][1]]);
          } else {
            pts.splice(lastIdx, 0, [pts[lastIdx][0], pts[lastIdx-1][1]]);
          }
        }
      }
    }
    // If compression produced a single diagonal segment, insert a Manhattan elbow.
    if (pts.length === 2) {
      const [sx, sy] = pts[0];
      const [tx, ty] = pts[1];
      if (sx !== tx && sy !== ty) {
        const mode = (req.modeHint === 'yx') ? 'yx' : 'xy';
        if (mode === 'yx') {
          pts.splice(1, 0, [sx, ty]);
        } else {
          pts.splice(1, 0, [tx, sy]);
        }
      }
    }

    const bendW = (this.config?.cost_defaults?.bend ?? 10);
    const proxW = (this.config?.cost_defaults?.proximity ?? 4);
    const { penalty: proxPenalty } = this._segmentProximityPenalty(pts, req.clearance, req.proximity, proxW);
    // Reporting only — geometry for prefer/avoid channels is now decided
    // during the A* search itself via the per-cell cost bias (chanCost,
    // above), not by nudging the already-found path afterward. Force
    // channels never reach this method at the top level (computePath routes
    // them through _computeForceRouted instead), so there's nothing left
    // here that needs to *shape* pts toward a channel.
    const channelInfo = this._channelDelta(pts, req);
    const totalCost = this._costComposite(pts, bendW, proxW, proxPenalty, channelInfo.delta);
    const d = this._polylineToPath(pts);
    return {
      d,
      pts,
      meta: {
        strategy: flags.smart ? 'grid-smart-preface' : 'grid',
        cost: totalCost,
        segments: pts.length - 1,
        bends: Math.max(0, pts.length - 2),
        grid: { resolution: res, iterations },
        ...(req.channels?.length ? {
          channel: {
            mode: channelInfo.mode,
            insidePx: channelInfo.inside,
            outsidePx: channelInfo.outside,
            coveragePct: Number((channelInfo.coverage*100).toFixed(1)),
            deltaCost: channelInfo.delta,
            forcedOutside: channelInfo.forcedOutside
          }
        } : {})
      }
    };
  }

  _buildOccupancy(cols, rows, res, clearance, originX = 0, originY = 0) {
    // 0 = free, 1 = blocked
    const occ = Array.from({ length: rows }, () => new Uint8Array(cols));
    if (!this._obstacles.length) return occ;
    for (const ob of this._obstacles) {
      // Obstacle bounds are world coordinates; make them grid-relative before
      // the floor/clamp below, same as w2c/h2c in _computeGrid — otherwise an
      // obstacle entirely in negative-origin territory silently never gets
      // marked (c0/r0 clamp to 0, c1/r1 stay negative, the marking loop below
      // never executes).
      const x1 = ob.x1 - clearance - originX;
      const y1 = ob.y1 - clearance - originY;
      const x2 = ob.x2 + clearance - originX;
      const y2 = ob.y2 + clearance - originY;

      // Mark every grid cell a real point somewhere inside the obstacle
      // could snap to. Must match _computeGrid's own w2c/h2c conversion
      // (Math.round, not floor) exactly — a floor-based range here can
      // leave a gap: a world y strictly inside an obstacle (e.g. y=793
      // inside a box spanning 760-810) can ROUND to a cell (17, at
      // res=48) that a FLOOR-based marking (rows 15-16) never covered,
      // silently letting a path point land there as if unobstructed.
      // Confirmed as a real, reported bug: a discovered trunk's own
      // crossing leg cut straight through a control's box because its own
      // A* search never saw that cell as blocked at all — not a
      // trunk-specific issue, a plain rounding mismatch between how
      // obstacles get marked and how every path point gets snapped,
      // latent since _buildOccupancy was written. Math.round on both
      // bounds is provably correct here (not just a looser floor/ceil
      // approximation): rounding is monotonic, so the set of cells any
      // point in [lo,hi] can round into is exactly [round(lo/res),
      // round(hi/res)] inclusive.
      const c0 = Math.max(0, Math.round(x1 / res));
      const r0 = Math.max(0, Math.round(y1 / res));
      const c1 = Math.min(cols-1, Math.round(x2 / res));
      const r1 = Math.min(rows-1, Math.round(y2 / res));

      for (let r=r0; r<=r1; r++) {
        const row = occ[r];
        for (let c=c0; c<=c1; c++) {
          row[c] = 1;
        }
      }
    }
    return occ;
  }

  /**
   * Per-cell additive A* traversal-cost delta from a line's referenced
   * 'prefer'/'avoid' channels — negative (discount) inside a prefer channel,
   * positive (penalty) inside an avoid channel, scaled by that channel's own
   * `weight`. Unlike _buildOccupancy (global obstacles, shared by every
   * line), this is built per referencing line's own channel subset — a line
   * that doesn't reference a channel must see zero bias from it. Mirrors
   * _buildOccupancy's floor/clamp cell-marking loop for consistency.
   *
   * Returns three grids rather than one: a 'prefer' discount is only
   * awarded to a move that actually travels along the channel's configured
   * `direction` — otherwise a line that merely clips through the box on an
   * unrelated (e.g. perpendicular) leg gets full credit for "using" the
   * channel with no incentive to ever turn and travel through it the way
   * it's configured, which is exactly what a direction-agnostic single
   * grid produced in practice (confirmed: a line's vertical leg happened to
   * pass through a horizontal channel's x-range and got the discount
   * without ever entering horizontally). 'avoid' has no such distinction —
   * avoiding an area is symmetric regardless of approach direction — so it
   * always lands in `anyDir`.
   * @param {number} cols
   * @param {number} rows
   * @param {number} res - grid resolution (viewBox units per cell)
   * @param {number} originX
   * @param {number} originY
   * @param {string[]} channelIds - req.channels (the line's route_channels)
   * @returns {{ anyDir: Float32Array[], horizOnly: Float32Array[], vertOnly: Float32Array[] }}
   */
  _buildChannelCostGrid(cols, rows, res, originX, originY, channelIds) {
    const anyDir = Array.from({ length: rows }, () => new Float32Array(cols));
    const horizOnly = Array.from({ length: rows }, () => new Float32Array(cols));
    const vertOnly = Array.from({ length: rows }, () => new Float32Array(cols));
    if (!channelIds || !channelIds.length) return { anyDir, horizOnly, vertOnly };
    const idSet = new Set(channelIds);
    const relevant = this._channels.filter(c => idSet.has(c.id) && (c.mode === 'prefer' || c.mode === 'avoid'));
    if (!relevant.length) return { anyDir, horizOnly, vertOnly };
    // Scaled against the existing flat per-step costs in _computeGrid's A*
    // loop (base 1, turnPenalty default 2, hintPenalty default 6) so weight
    // has a real, monotonic effect without either doing nothing or
    // dominating the search entirely at weight:1.
    const preferBias = Number(this.config.channel_prefer_bias ?? 0.9);
    const avoidBias = Number(this.config.channel_avoid_bias ?? 3);
    for (const chan of relevant) {
      const c0 = Math.max(0, Math.floor((chan.x1 - originX) / res));
      const r0 = Math.max(0, Math.floor((chan.y1 - originY) / res));
      const c1 = Math.min(cols - 1, Math.floor((chan.x2 - originX) / res));
      const r1 = Math.min(rows - 1, Math.floor((chan.y2 - originY) / res));
      let target, delta;
      if (chan.mode === 'avoid') {
        target = anyDir;
        delta = avoidBias * chan.weight * this._channelAvoidMultiplier;
      } else {
        target = chan.direction === 'horizontal' ? horizOnly : vertOnly;
        delta = -preferBias * chan.weight;
      }
      for (let r = r0; r <= r1; r++) {
        const row = target[r];
        for (let c = c0; c <= c1; c++) row[c] += delta; // overlapping channels sum
      }
    }
    return { anyDir, horizOnly, vertOnly };
  }

  /**
   * Per-cell additive A* traversal-cost penalty for moving ORTHOGONALLY
   * across another already-routed line's registered segment — the mirror
   * image of _buildChannelCostGrid's prefer-direction discount, but always
   * non-negative (a deterrent, not a discount), so unlike a 'prefer' bias it
   * never threatens A*'s heuristic admissibility (see MIN_STEP_COST/h()'s
   * own comment) and needs no h=0/Dijkstra fallback.
   *
   * A horizontal registered segment only ever writes into `vert` (a
   * VERTICAL move through one of its cells crosses it); a vertical segment
   * only ever writes into `horiz`. This is deliberately disjoint from
   * _buildChannelCostGrid's horizOnly/vertOnly reward tables — parallel
   * travel through a trunk's cell keeps earning that reward and is
   * structurally exempt from this penalty (they never populate the same
   * grid from the same source segment), while a perpendicular move through
   * that same cell only ever sees this penalty.
   * @param {number} cols
   * @param {number} rows
   * @param {number} res
   * @param {number} originX
   * @param {number} originY
   * @param {string} askingLineId - never penalize a line for crossing its own in-progress route
   * @param {string[]} [exemptLineIds] - corridor-leg exemption (see _computeCorridorRouted): occupants of a corridor being joined don't repel the legs approaching it
   * @returns {{ horiz: Float32Array[], vert: Float32Array[] }}
   */
  _buildCrossingCostGrid(cols, rows, res, originX, originY, askingLineId, exemptLineIds = []) {
    const horiz = Array.from({ length: rows }, () => new Float32Array(cols)); // penalizes horizontal moves
    const vert = Array.from({ length: rows }, () => new Float32Array(cols)); // penalizes vertical moves
    if (!this._crossingAvoidEnabled || !this._crossings.length) return { horiz, vert };
    // Bundle-mates don't repel each other: lines sharing a trunk coordinate
    // via lane assignment, and their entry/exit stubs necessarily sit right
    // next to every other member's path — penalizing those as "crossings"
    // pushes a trunk's own creator OFF its own centerline the moment a
    // joiner registers its stubs (confirmed: an unobstructed straight
    // creator detoured a full grid row to dodge its joiner's two stub
    // cells, destabilizing the very trunk the joiner had just joined).
    // Non-mates still see every penalty unchanged. Derived fresh from live
    // membership; the caller's cache key already includes _registryVersion,
    // which membership changes bump.
    const mates = new Set(exemptLineIds);
    for (const t of this._trunks) {
      if (!t.members?.has(askingLineId)) continue;
      for (const id of t.members.keys()) mates.add(id);
    }
    for (const seg of this._crossings) {
      if (seg.lineId === askingLineId || mates.has(seg.lineId)) continue;
      const target = seg.direction === 'horizontal' ? vert : horiz;
      const c0 = Math.max(0, Math.floor((seg.x1 - originX) / res));
      const r0 = Math.max(0, Math.floor((seg.y1 - originY) / res));
      const c1 = Math.min(cols - 1, Math.floor((seg.x2 - originX) / res));
      const r1 = Math.min(rows - 1, Math.floor((seg.y2 - originY) / res));
      for (let r = r0; r <= r1; r++) {
        const row = target[r];
        for (let c = c0; c <= c1; c++) row[c] += this._crossingAvoidBias; // overlapping crossings sum
      }
    }
    return { horiz, vert };
  }

  /**
   * Lane assignment for one line at one corridor (config channel or
   * discovered trunk) — a PURE function of the corridor's current member
   * set, recomputed fresh on every call. Deliberately NOT a stored,
   * insertion-order map: a stateful "who registered first" assignment
   * (the former _channelLineIndex) was the last piece of per-corridor
   * bookkeeping with no purge/versioning discipline, and pre-seeding it at
   * trunk creation to fix the creator-lane gap demonstrably broke
   * discovery-loop convergence (transient trunks left permanent lane
   * reservations behind — see ROUTING_ENGINE_BRIEF.md §7). A pure
   * function of the CURRENT member set can't accumulate history-dependent
   * drift across passes by construction; membership changes bump
   * _registryVersion (see _registerLineSegments), which is what forces
   * affected lines to recompute with fresh assignments.
   *
   * Discovered trunk: the creator (sourceLineId) implicitly holds lane 0
   * at offset 0 — its own path IS the centerline (crossCenter), so it
   * never moves. Joiners (member set minus creator, plus the asking line)
   * are grouped by their recorded NATURAL SIDE (see
   * _mergeOrRegisterTrunk — which side of the centerline each joiner's own
   * true, un-bundled endpoints actually lean toward, a pure function of
   * their own geometry, never a prior pass's lane offset): negative-side
   * joiners get negative offsets, non-negative/unknown-side joiners get
   * positive, each side's own magnitude growing by that joiner's 1-based
   * position within its OWN side group (lexicographic tie-break within a
   * group). A joiner with no recorded side yet (never registered at this
   * trunk before — e.g. a prospective candidate mid-discovery) falls into
   * the non-negative group, matching the group most existing tests
   * exercise. This replaces blind index-parity alternation (+s,-s,+2s,...
   * by insertion-sorted order), which put two joiners on OPPOSITE sides of
   * a shared trunk purely because their ids happened to sort that way —
   * confirmed as a real, avoidable crossing between one joiner's own stub
   * and the other's bundled lane.
   *
   * Config channel: no implicit centerline owner — every user (member set
   * plus the asking line, sorted) gets a centered offset
   * (i - (n-1)/2) * spacing: n=1 -> 0, n=2 -> ±s/2, n=3 -> -s/0/+s.
   * Deliberately NOT made side-aware — there's no creator centerline to
   * bias around here, and the reported crossing bug was specifically a
   * discovered-trunk case; kept unchanged to bound this fix's scope.
   *
   * laneIndex is the raw non-negative per-line position (creator 0,
   * joiners 1,2,... / users 0,1,2,...) consumed by
   * _pushBundledApproachLegs's nudge-distance formula, which needs a
   * distinct, never-negative value per line (a centered ± offset can point
   * backward relative to a leg's travel direction, and two lines' centered
   * offsets can share a magnitude). For a discovered trunk it's now
   * derived from the same side-grouped order the offset itself uses
   * (negative-side group first, then non-negative), not raw lexicographic
   * order — still just a distinct positive integer per line, direction
   * itself is carried entirely by offset's sign.
   * @param {object} corridor - channel or discovered-trunk object (id is what's resolved against the live registry)
   * @param {string} lineId
   * @returns {{ laneIndex: number, laneCount: number, offset: number }}
   * @private
   */
  _trunkLaneAssignment(corridor, lineId) {
    // Always read the LIVE registry row — corridor may be a stale spread
    // copy (see _discoverTrunkCandidates) or a bare config-channel object
    // (every channel has a same-id trunk row seeded at construction).
    const row = this._trunks.find(t => t.id === corridor.id) ?? corridor;
    const spacing = Number(corridor.line_spacing ?? row.line_spacing ?? this._trunkLineSpacing) || 0;
    const ids = new Set(row.members?.keys());
    ids.add(lineId);
    if (row.origin === 'discovered') {
      ids.delete(row.sourceLineId);
      if (!ids.has(lineId) || !spacing) return { laneIndex: 0, laneCount: ids.size + 1, offset: 0 };
      const sideOf = (id) => row.members?.get(id)?.[2] ?? 0;
      const negatives = [...ids].filter(id => sideOf(id) < 0).sort();
      const positives = [...ids].filter(id => sideOf(id) >= 0).sort();
      const laneCount = negatives.length + positives.length + 1;
      const negIdx = negatives.indexOf(lineId);
      const inNegativeGroup = negIdx >= 0;
      const withinGroupIdx = inNegativeGroup ? negIdx : positives.indexOf(lineId);
      const offset = (inNegativeGroup ? -1 : 1) * spacing * (withinGroupIdx + 1);
      const ordered = [...negatives, ...positives];
      return { laneIndex: ordered.indexOf(lineId) + 1, laneCount, offset };
    }
    const users = [...ids].sort();
    const i = users.indexOf(lineId);
    const n = users.length;
    return { laneIndex: i, laneCount: n, offset: spacing ? (i - (n - 1) / 2) * spacing : 0 };
  }

  /**
   * Removes this line's own contribution from every trunk it's a member of.
   * NOT part of the routine per-recompute flow — _registerLineSegments now
   * diffs trunk membership in place (update matching entries, drop only
   * stale ones), so nothing purges before re-registration anymore (a
   * purge-then-recreate cycle unconditionally looks like a change, which
   * defeats discovery-loop convergence — the "shell row" bug class, see
   * _registerLineSegments). Kept as a standalone primitive for cases that
   * genuinely want a full clear (e.g. a line removed from the MSD
   * entirely), mirroring _purgeCrossingsForLine.
   *
   * A row is NEVER deleted here, even when its last member is removed —
   * an emptied discovered row keeps its bounds untouched (shell row, not a
   * real geometry change) so its original owner re-registering the same
   * geometry finds it again via the normal geometric match and reports no
   * change. A truly-abandoned shell just lingers — harmless, since a
   * members.size===0 discovered row is skipped by _discoverTrunkCandidates
   * and reactivates the instant its owner (or anyone matching) registers
   * into it again.
   * @param {string} lineId
   * @returns {boolean} whether anything changed (membership counts as a
   *   change even when bounds don't move — lane assignment derives from
   *   membership, see _trunkLaneAssignment)
   * @private
   */
  _purgeTrunksForLine(lineId) {
    let changed = false;
    for (const t of this._trunks) {
      if (!t.members?.has(lineId)) continue;
      t.members.delete(lineId);
      changed = true;
      // A channel trunk still has a meaningful, deterministic bounds to
      // fall back to at zero members (its own configured span) — always
      // safe/idempotent to recompute. A discovered trunk has no such
      // fallback; leave its bounds exactly as they were (shell row) rather
      // than trying to compute a bounds-of-nothing.
      if (t.origin === 'discovered' && t.members.size === 0) continue;
      this._recomputeTrunkBounds(t);
    }
    return changed;
  }

  /**
   * Recomputes a trunk's flow-axis bounds as the union of every current
   * member's own sub-span (plus, for a channel-seeded trunk, its original
   * configured bounds — a channel never shrinks below what it was
   * authored as, even once every joining line has been purged).
   *
   * For a DISCOVERED trunk, additionally recomputes the cross-axis band as
   * a pure function of the current joiner count, symmetric around the
   * creator's own centerline (crossCenter): half-width grows by one
   * line_spacing per side-pair of joiners (the alternating ± lane scheme in
   * _trunkLaneAssignment), so a joiner's through-leg at ±k·spacing always
   * measures as "inside" the band (_corridorDelta) once joined. Symmetric
   * growth keeps the band's center — what trunk matching and discovery
   * proximity test against — pinned to the creator's path regardless of
   * how many lines join. Channel-origin trunks keep their authored
   * cross-axis bounds untouched.
   * @param {object} trunk
   * @returns {boolean} whether the trunk's bounds actually changed
   * @private
   */
  _recomputeTrunkBounds(trunk) {
    const horizontal = trunk.direction === 'horizontal';
    let lo = trunk.origin === 'channel' ? (horizontal ? trunk._baseX1 : trunk._baseY1) : Infinity;
    let hi = trunk.origin === 'channel' ? (horizontal ? trunk._baseX2 : trunk._baseY2) : -Infinity;
    for (const span of trunk.members.values()) {
      lo = Math.min(lo, span[0]);
      hi = Math.max(hi, span[1]);
    }
    let changed = horizontal ? (trunk.x1 !== lo || trunk.x2 !== hi) : (trunk.y1 !== lo || trunk.y2 !== hi);
    if (horizontal) { trunk.x1 = lo; trunk.x2 = hi; } else { trunk.y1 = lo; trunk.y2 = hi; }
    if (trunk.origin === 'discovered' && Number.isFinite(trunk.crossCenter)) {
      const half = this._trunkBandHalfWidth(trunk, null);
      const cLo = trunk.crossCenter - half;
      const cHi = trunk.crossCenter + half;
      if (horizontal) {
        if (trunk.y1 !== cLo || trunk.y2 !== cHi) { trunk.y1 = cLo; trunk.y2 = cHi; changed = true; }
      } else {
        if (trunk.x1 !== cLo || trunk.x2 !== cHi) { trunk.x1 = cLo; trunk.x2 = cHi; changed = true; }
      }
    }
    return changed;
  }

  /**
   * Cross-axis half-width of a discovered trunk's band for a given member
   * set — spacing/2 (the creator's own lane) plus one spacing per member of
   * whichever NATURAL-SIDE group (see _mergeOrRegisterTrunk/
   * _trunkLaneAssignment) is larger, matching _trunkLaneAssignment's own
   * side-grouped offsets so every assigned lane's through-leg midpoint
   * falls inside the band. Sizing by the LARGER group (not
   * `ceil(joiners/2)`, which assumed joiners always split evenly across
   * both sides — true only for the old lineId-alternation scheme) is
   * load-bearing: confirmed as a real bug when two joiners both happened
   * to share the same natural side, needing a real half-width of
   * `spacing/2 + spacing*2`, while the old formula only ever budgeted
   * `spacing/2 + spacing*1` — the resulting band clamp forced one joiner's
   * real (`_trunkLaneAssignment`-computed) offset back inside the
   * too-narrow band, producing an unnecessary correction leg with no
   * directional guarantee, i.e. exactly the reversal-causing shape this
   * whole area of the router exists to prevent.
   * `extraLineId` (may be null) is counted as a prospective joiner if it
   * isn't already a member — used by _discoverTrunkCandidates to size a
   * candidate's band as if the asking line had already joined; without
   * that, a first joiner's own through-leg at ±spacing would measure
   * "outside" the not-yet-widened band, never earn the prefer reward, and
   * the join could never win the cost comparison (a deadlock: the band
   * only widens on join, but the join needs the widened band to be
   * chosen). A prospective (not-yet-registered) extraLineId has no
   * recorded side yet, so — matching _trunkLaneAssignment's own fallback —
   * it's sized as a worst-case addition to the non-negative group.
   * @param {object} trunk
   * @param {string|null} extraLineId
   * @returns {number}
   * @private
   */
  _trunkBandHalfWidth(trunk, extraLineId) {
    const spacing = trunk.line_spacing || this._trunkLineSpacing;
    let negCount = 0, posCount = 0;
    for (const [id, span] of trunk.members?.entries() ?? []) {
      if (id === trunk.sourceLineId) continue;
      if ((span?.[2] ?? 0) < 0) negCount++; else posCount++;
    }
    if (extraLineId && extraLineId !== trunk.sourceLineId && !trunk.members?.has(extraLineId)) {
      posCount++; // unknown side -> non-negative group, same fallback as _trunkLaneAssignment
    }
    return spacing / 2 + spacing * Math.max(negCount, posCount);
  }

  /**
   * Removes every crossing-avoidance entry this line previously registered,
   * unconditionally. NOT part of the routine per-recompute flow (see
   * _registerLineSegments's targeted diff instead) — kept as a standalone
   * primitive for cases that genuinely want a full clear (e.g. a line
   * removed from the MSD entirely).
   * @param {string} lineId
   * @returns {boolean} whether any entry was actually removed
   * @private
   */
  _purgeCrossingsForLine(lineId) {
    const before = this._crossings.length;
    this._crossings = this._crossings.filter(c => c.lineId !== lineId);
    return this._crossings.length !== before;
  }

  /**
   * Scans a finished route's points ONCE for straight (axis-aligned) runs
   * and registers each into every applicable per-line registry — trunks
   * (bundling, gated by _trunkMinLength) and crossings (avoidance, gated by
   * the much smaller _crossingMinLength, since even a short stub leg must
   * still be avoidable). One _compactPolyline call, one shared runIndex,
   * one _registryVersion bump if anything actually changed. Must run on
   * the pre-smoothing polyline — _applySmoothing replaces pts with curved
   * points, which would poison both registries with non-axis-aligned
   * "segments."
   *
   * BOTH registries use the same diff-in-place discipline (no purge before
   * the scan): matching entries are updated in place (identical geometry
   * reports changed=false), and only entries this scan did NOT touch are
   * dropped afterward (genuinely stale leftovers from a shape change). A
   * purge-then-recreate cycle would unconditionally look like a change on
   * every recompute, permanently defeating the "steady state = no version
   * bump = cache hits" property the discovery loop's bounded cost depends
   * on — the same failure class fixed three separate times in this
   * subsystem (trunk shell rows, blanket crossing purges, and the stateful
   * lane map replaced by _trunkLaneAssignment).
   *
   * Trunk MEMBERSHIP changes (a line joining or leaving a row) always
   * count as registry changes, even when the row's bounds don't move —
   * lane assignment and lane count are derived from membership
   * (_trunkLaneAssignment), so other bundled lines must be re-examined
   * whenever the member set shifts.
   * @param {string} lineId
   * @param {number[][]} pts
   * @param {number[]} [rawA] - the line's true, un-stubbed start anchor
   *   (req.a) — used only to derive each trunk contribution's natural
   *   side (see _mergeOrRegisterTrunk), never for span/geometry.
   * @param {number[]} [rawB] - the line's true, un-stubbed end/attach
   *   point (req.b), same purpose as rawA.
   * @returns {boolean} whether this scan made lineId a brand-new member of
   *   a trunk it doesn't own (see _mergeOrRegisterTrunk's foreignJoinFlag
   *   comment) — computePath uses this to skip caching, so the next pass
   *   gets a genuine chance to route through the newly-eligible trunk
   *   instead of looking like an already-stable cache hit forever.
   * @private
   */
  _registerLineSegments(lineId, pts, rawA = null, rawB = null) {
    // Compact collinear runs first — a straight route commonly has interior
    // points that aren't real corners at all (e.g. both ends of a stub
    // splice happening to continue in the same direction the inner path
    // already travels), and scanning raw consecutive pairs would register
    // each such sub-run as its own separate, artificially-short entry
    // instead of the one real straight run they together represent. Same
    // helper _computeCorridorRouted's own leg concatenation already relies
    // on for this exact purpose.
    const compacted = this._compactPolyline(pts);
    let runIndex = 0;
    let changed = false;
    // Tracks which of this line's crossing ids this scan actually produced,
    // and which trunk rows this scan claimed a member span in — see the
    // diff-in-place discipline in the docblock above.
    const touchedCrossingIds = this._crossingAvoidEnabled ? new Set() : null;
    // Membership scanning runs whenever there are rows to match — even with
    // trunk_bundling_enabled:false, config channels are seeded rows whose
    // lane assignment derives from membership (_trunkLaneAssignment), so
    // lines routing through a channel must still register into it. The
    // toggle only disables CREATING new discovered rows (spontaneous
    // bundling) — see _mergeOrRegisterTrunk's create gate.
    const touchedTrunks = (this._trunkBundlingEnabled || this._trunks.length) ? new Set() : null;
    // See _mergeOrRegisterTrunk's comment on foreignJoinFlag: set when this
    // scan makes this line a brand-new member of a row it doesn't own,
    // so computePath knows not to cache this call's result.
    const foreignJoinFlag = { joined: false };
    // Trunk-match candidates are deferred (see the length-ordered pass
    // below) rather than matched immediately in positional order — crossing
    // registration has no such ordering concern (every qualifying run gets
    // its own independent entry, never competes with a sibling run for the
    // same slot) and stays exactly as before.
    const trunkCandidates = touchedTrunks ? [] : null;
    for (let i = 1; i < compacted.length; i++) {
      const a = compacted[i - 1], b = compacted[i];
      const horizontal = a[1] === b[1];
      const vertical = a[0] === b[0];
      if (!horizontal && !vertical) continue; // shouldn't happen pre-smoothing; guard anyway
      const idx = runIndex++;
      const length = horizontal ? Math.abs(b[0] - a[0]) : Math.abs(b[1] - a[1]);
      if (trunkCandidates && length >= this._trunkMinLength) {
        trunkCandidates.push({ idx, a, b, horizontal, length });
      }
      if (this._crossingAvoidEnabled && length >= this._crossingMinLength) {
        touchedCrossingIds.add(`cross:${lineId}:${idx}`);
        if (this._registerCrossingSegment(lineId, idx, a, b, horizontal)) changed = true;
      }
    }
    // Match LONGEST run first, not positional (flow-position) order. A
    // short, purely-artifactual leg (e.g. a corridor-approach nudge —
    // internal to how the route was constructed, never meant to represent
    // an independent trunk-riding contribution) can coincidentally sit
    // within trunk_proximity of an existing trunk's own centerline, exactly
    // like a genuine trunk-riding run would. Processed in positional order,
    // whichever run comes first claims the match via touchedTrunks — if
    // that's the short artifactual one, the REAL, much longer trunk-riding
    // run (processed later) finds the trunk already claimed and spawns its
    // own spurious new one instead. Confirmed as a real, PRE-EXISTING bug,
    // not introduced by any single change this session: reproduced with an
    // already-shipped, entirely natural corridorOffset!=0 corridor join, no
    // grace-zone/taper changes involved. Run length is a strictly better
    // signal of "this line genuinely rides this trunk" than "whichever run
    // happened to come first in the polyline" — this is the only thing
    // that changes; _mergeOrRegisterTrunk itself, crossing registration,
    // and ID assignment (idx stays tied to positional order) are untouched.
    if (trunkCandidates) {
      trunkCandidates.sort((x, y) => y.length - x.length);
      for (const c of trunkCandidates) {
        if (this._mergeOrRegisterTrunk(lineId, c.idx, c.a, c.b, c.horizontal, touchedTrunks, foreignJoinFlag, rawA, rawB)) changed = true;
      }
    }
    // Post-scan membership diff: this line leaves any trunk row the scan
    // didn't re-claim (its shape moved away from that row). Rows are never
    // deleted — see _purgeTrunksForLine's shell-row comment.
    if (touchedTrunks) {
      for (const t of this._trunks) {
        if (!t.members?.has(lineId) || touchedTrunks.has(t)) continue;
        t.members.delete(lineId);
        changed = true;
        if (t.origin === 'discovered' && t.members.size === 0) continue;
        this._recomputeTrunkBounds(t);
      }
    }
    if (touchedCrossingIds) {
      for (let i = this._crossings.length - 1; i >= 0; i--) {
        const c = this._crossings[i];
        if (c.lineId === lineId && !touchedCrossingIds.has(c.id)) {
          this._crossings.splice(i, 1);
          changed = true;
        }
      }
    }
    if (changed) this._registryVersion++;
    return foreignJoinFlag.joined;
  }

  /**
   * Registers one straight run as a crossing-avoidance occupancy entry.
   * Pure per-line bookkeeping — no merging with other lines' entries (that
   * would only matter for bundling, a different concern handled by
   * _mergeOrRegisterTrunk). id is a pure function of (lineId, runIndex),
   * same rationale as a trunk's id: re-registering unchanged geometry is a
   * true no-op, and changed geometry can't leak a stale entry under an old
   * id (see _registerLineSegments's post-scan diff, which removes stale
   * leftover ids without ever deleting-then-recreating an unchanged one).
   * @param {string} lineId
   * @param {number} runIndex
   * @param {number[]} a
   * @param {number[]} b
   * @param {boolean} horizontal
   * @returns {boolean} whether a new entry was created or an existing one's span actually changed
   * @private
   */
  _registerCrossingSegment(lineId, runIndex, a, b, horizontal) {
    const id = `cross:${lineId}:${runIndex}`;
    const x1 = Math.min(a[0], b[0]), x2 = Math.max(a[0], b[0]);
    const y1 = Math.min(a[1], b[1]), y2 = Math.max(a[1], b[1]);
    const existing = this._crossings.find(c => c.id === id);
    if (existing) {
      const changed = existing.x1 !== x1 || existing.y1 !== y1 || existing.x2 !== x2 || existing.y2 !== y2;
      existing.x1 = x1; existing.y1 = y1; existing.x2 = x2; existing.y2 = y2;
      return changed;
    }
    this._crossings.push({ id, lineId, runIndex, x1, y1, x2, y2, direction: horizontal ? 'horizontal' : 'vertical' });
    return true;
  }

  /**
   * Extends an existing nearby, same-direction, overlapping trunk's
   * flow-span rather than spawning a coincident duplicate (without this, a
   * force-channel line's own through-leg would register as a SEPARATE
   * trunk sitting right on top of the channel's own pre-seeded one, and
   * two lines merely occupying slightly different lanes of the same shared
   * run would each spawn their own trunk instead of recognizing the one
   * that's already there). The merge test is purely geometric — agnostic
   * to origin — so a line that routes through a channel naturally merges
   * into that channel's own seeded trunk. Otherwise registers a new entry
   * with id `trunk:${lineId}:${runIndex}` — a pure function of
   * (creating lineId, runIndex), never a monotonic counter, so re-
   * registering a line with unchanged geometry is a no-op and re-
   * registering with changed geometry can't leak a stale entry under an
   * old id (see _purgeTrunksForLine, which always runs first).
   *
   * Records this line's contribution in `members` and recomputes the
   * trunk's overall bounds from the full member set (_recomputeTrunkBounds)
   * rather than a raw Math.min/max against the trunk's PREVIOUS bounds —
   * a raw accumulation can never shrink, so a line that's later purged
   * (e.g. the very line that created this trunk, recomputing on its own
   * next turn) would leave every other member's extension permanently
   * stuck in the bounds forever, even after that member itself is gone.
   *
   * A trunk the line is ALREADY a member of is a valid match (its span is
   * updated in place; an identical span reports changed=false) — there is
   * no purge before the scan anymore, so "already a member" is the normal
   * steady-state case, not a conflict. What IS excluded is a trunk this
   * same scan already claimed for a different run of the same line
   * (`touchedTrunks`) — one member span per trunk per line; a second
   * qualifying run registers its own trunk instead. A NEW member always
   * reports changed=true even when the row's bounds don't move, because
   * lane assignment derives from membership (see _registerLineSegments).
   * @param {string} lineId
   * @param {number} runIndex
   * @param {number[]} a
   * @param {number[]} b
   * @param {boolean} horizontal
   * @param {Set<object>|null} touchedTrunks - rows already claimed by this scan; the matched/created row is added
   * @returns {boolean} whether membership or bounds actually changed
   * @private
   */
  _mergeOrRegisterTrunk(lineId, runIndex, a, b, horizontal, touchedTrunks = null, foreignJoinFlag = null, rawA = null, rawB = null) {
    const flow = horizontal ? 0 : 1;
    const cross = horizontal ? 1 : 0;
    const flowLo = Math.min(a[flow], b[flow]);
    const flowHi = Math.max(a[flow], b[flow]);
    const crossCoord = a[cross]; // a[cross] === b[cross] by construction (axis-aligned)

    const existing = this._trunks.find(t => {
      if (t.direction !== (horizontal ? 'horizontal' : 'vertical')) return false;
      if (touchedTrunks?.has(t)) return false;
      const tCrossCenter = t.crossCenter ?? (horizontal ? (t.y1 + t.y2) / 2 : (t.x1 + t.x2) / 2);
      if (Math.abs(tCrossCenter - crossCoord) > this._trunkProximity) return false;
      const tFlowLo = horizontal ? t.x1 : t.y1;
      const tFlowHi = horizontal ? t.x2 : t.y2;
      return Math.min(flowHi, tFlowHi) - Math.max(flowLo, tFlowLo) >= -this._trunkProximity;
    });
    // Natural side: which side of THIS trunk row's own STABLE centerline
    // (existing.crossCenter when joining a row, or crossCoord itself when
    // creating one — crossCoord IS what becomes the new row's crossCenter,
    // see below) the line's true, un-bundled journey actually leans
    // toward — a pure function of the line's own raw endpoints (never a
    // prior pass's own lane offset, which would just entrench whatever an
    // earlier, possibly-arbitrary pass produced). Deliberately measured
    // against the trunk's centerline, NOT against crossCoord (this
    // specific segment's own registered position) — a joiner already
    // riding an offset lane has crossCoord = crossCenter + itsOwnOffset,
    // and comparing the raw endpoint to ITS OWN already-offset position
    // instead of the shared centerline collapses the signal (confirmed:
    // produced side=0 for every joiner in a test where each line's raw
    // endpoint exactly matched its own registered segment). Used by
    // _trunkLaneAssignment to bias which side a joiner lands on, instead
    // of pure lineId lexicographic order — confirmed as a real bug: two
    // joiners landed on OPPOSITE sides of a shared trunk purely because
    // their ids happened to sort that way, producing an avoidable crossing
    // between one line's own stub and the other's bundled lane. 0 (no
    // lean either way, or raw endpoints unavailable) falls back to the old
    // lexicographic-only behavior for that line — see _trunkLaneAssignment.
    const centerlineForSide = existing
      ? (existing.crossCenter ?? (horizontal ? (existing.y1 + existing.y2) / 2 : (existing.x1 + existing.x2) / 2))
      : crossCoord;
    // Reference point for natural side: whichever raw endpoint (anchor or
    // attach) sits closer, on the FLOW axis, to THIS run — not the average
    // of both. _registerLineSegments calls this once per straight run a
    // line's route decomposes into, always passing the same whole-line
    // rawA/rawB regardless of which run is being registered; averaging
    // them ties every run's side to the line's overall start-to-end
    // displacement, which a distant destination can dominate even for a
    // run that's really about the ANCHOR end of the journey. Confirmed as
    // a real bug via a live user report: a line whose anchor sat clearly
    // south of a trunk it was joining right after departure got assigned
    // a NORTH-side lane instead, purely because its own destination lay
    // far enough north to pull the (anchor+attach)/2 average across the
    // trunk's centerline — even though this run has nothing to do with
    // the destination yet. Picking the flow-closer endpoint instead makes
    // each run's side reflect the geometry actually local to it: a run
    // near the anchor leans on the anchor's own side, a run near the
    // attach point leans on that side instead.
    const flowMid = (flowLo + flowHi) / 2;
    const refPoint = (rawA && rawB)
      ? (Math.abs(rawA[flow] - flowMid) <= Math.abs(rawB[flow] - flowMid) ? rawA : rawB)
      : (rawA || rawB);
    const naturalSide = refPoint ? Math.sign(refPoint[cross] - centerlineForSide) : 0;
    if (existing) {
      touchedTrunks?.add(existing);
      const prev = existing.members.get(lineId);
      // Re-registering an exactly-unchanged contribution must NOT report a
      // change — otherwise a converged discovery loop would never reach a
      // fixed point (every pass would bump _registryVersion and force
      // every other line to recompute forever, defeating the cap's "stop
      // once nothing changed" exit condition). Natural side is included in
      // the comparison: lane assignment derives from it too
      // (_trunkLaneAssignment), so a changed side is a real change even
      // when the span didn't move.
      if (prev && prev[0] === flowLo && prev[1] === flowHi && (prev[2] ?? 0) === naturalSide) return false;
      const isNewMember = !prev;
      // A line becoming a member of a row it did NOT create happens purely
      // as a side effect of ITS OWN independent geometry coincidentally
      // landing near another line's trunk (_discoverTrunkCandidates' gate
      // — see its own comment on the membership bypass — never offered
      // this row as a routing candidate before now, since membership is
      // exactly what makes it eligible next time). Flagged so computePath
      // can skip caching this call's result: the cache-store key already
      // folds in the _registryVersion bump this same call causes, which
      // would otherwise make the NEXT lookup for this exact line look like
      // a stable cache hit forever, silently hiding the newly-eligible
      // trunk from ever being reconsidered by discovery.
      if (isNewMember && existing.sourceLineId !== lineId && foreignJoinFlag) foreignJoinFlag.joined = true;
      existing.members.set(lineId, [flowLo, flowHi, naturalSide]);
      const boundsChanged = this._recomputeTrunkBounds(existing);
      return isNewMember || boundsChanged;
    }

    // Creating NEW rows is what trunk_bundling_enabled actually toggles —
    // matching into existing rows (above) must keep working regardless,
    // since config channels' lane assignment depends on membership.
    if (!this._trunkBundlingEnabled) return false;

    const half = this._trunkLineSpacing / 2;
    // crossCenter records the creator's own path coordinate as a stable
    // fact of the row — the centerline every lane offset is measured from
    // (_trunkLaneAssignment) and the anchor the cross-axis band grows
    // symmetrically around as joiners arrive (_recomputeTrunkBounds).
    // Deriving it from the bounds midpoint instead would let band updates
    // feed back into the centerline itself.
    const trunk = {
      id: `trunk:${lineId}:${runIndex}`,
      x1: horizontal ? flowLo : crossCoord - half,
      y1: horizontal ? crossCoord - half : flowLo,
      x2: horizontal ? flowHi : crossCoord + half,
      y2: horizontal ? crossCoord + half : flowHi,
      crossCenter: crossCoord,
      direction: horizontal ? 'horizontal' : 'vertical',
      weight: this._trunkBundleWeight,
      mode: 'prefer',
      line_spacing: this._trunkLineSpacing,
      origin: 'discovered',
      sourceLineId: lineId,
      runIndex,
      // The creator's own natural side is unused (see _trunkLaneAssignment
      // — the creator is removed from the joiner set entirely, it always
      // holds the centerline), stored anyway for shape consistency across
      // every members entry.
      members: new Map([[lineId, [flowLo, flowHi, naturalSide]]])
    };
    this._trunks.push(trunk);
    touchedTrunks?.add(trunk);
    return true;
  }

  /**
   * Finds trunks (config-seeded channels and/or previously-discovered runs
   * from other lines) worth trying to join for this request — two
   * independently-tunable thresholds, not a vague "check if it's close":
   * flow-axis overlap between the line's own span and the trunk's span
   * must be >= trunk_min_overlap (joining is only worth it for a real
   * shared stretch, not a coincidental few-pixel graze), and the
   * perpendicular distance from the line's approximate path to the
   * trunk's lane center must be <= trunk_proximity.
   *
   * Runs on the line's TRUE raw anchor/attach points (`a`/`b` — req.a/b,
   * pre-stub), not the stub-shifted `stubReq.a`/`stubReq.b` this used to
   * take directly. Confirmed as a real, non-cosmetic bug: the mandatory
   * cardinal stub (_applyCardinalStubs) exists purely to guarantee
   * departure/arrival direction and, since the grid-resolution-aware floor
   * (see cardinalStubLengthFor), to escape the same-grid-cell short-
   * circuit — neither purpose has anything to do with "is my overall
   * journey near this trunk." But because discovery used to read the
   * stub-shifted position, stub length was silently doing double duty:
   * whenever a stub's own direction ran along a trunk's CROSS axis (e.g. a
   * horizontal stub approaching a vertical trunk), lengthening the stub
   * for the same-cell fix also dragged the discovery reference point
   * sideways — directly changing the cross-axis proximity verdict.
   * Verified by a direct A/B test (same line, only the resolved
   * grid_resolution changed): a longer stub caused a line to discover and
   * bundle into a trunk a shorter stub did not, producing a completely
   * different route topology, not just a different-looking corner. Using
   * the true anchor makes "is this line's journey near that trunk" a
   * function of the line's own real geometry again, independent of an
   * unrelated implementation detail.
   *
   * Still no extra pathfinding pass paid for a line with no nearby trunk —
   * `a`/`b` are the request's already-known endpoints, no route is
   * computed to evaluate this.
   * @param {string} lineId
   * @param {number[]} a - the line's true raw anchor point (req.a, NOT stubReq.a)
   * @param {number[]} b - the line's true raw attach point (req.b, NOT stubReq.b)
   * @param {Set<string>} excludeIds - ids already present as explicit corridors in the chain
   * @param {Array<object>} [explicitCorridors] - the chain's own corridor objects, for geometric-redundancy filtering
   * @returns {Array<object>} candidate trunks (each tagged with `overlap`), sorted by overlap desc, capped at trunk_max_join_candidates
   * @private
   */
  _discoverTrunkCandidates(lineId, a, b, excludeIds, explicitCorridors = []) {
    if (!this._trunkBundlingEnabled || !this._trunks.length) return [];
    // A candidate that's geometrically redundant with a corridor already in
    // the chain (same direction, centerline inside that corridor's own
    // cross band ± proximity, overlapping flow span) can only ever add a
    // zigzag — the line already travels that region via the explicit
    // corridor, and chaining through both forces an entry/exit pair into
    // each. Typical source: another channel user's own approach/through
    // runs registering as discovered trunks right on top of the channel.
    const redundantWithChain = (t, horizontal, tCrossCenter, tFlowLo, tFlowHi) =>
      explicitCorridors.some(c => {
        if ((c.direction === 'horizontal') !== horizontal) return false;
        const cCrossLo = horizontal ? c.y1 : c.x1;
        const cCrossHi = horizontal ? c.y2 : c.x2;
        if (tCrossCenter < cCrossLo - this._trunkProximity || tCrossCenter > cCrossHi + this._trunkProximity) return false;
        const cFlowLo = horizontal ? c.x1 : c.y1;
        const cFlowHi = horizontal ? c.x2 : c.y2;
        return Math.min(tFlowHi, cFlowHi) - Math.max(tFlowLo, cFlowLo) > 0;
      });
    const candidates = [];
    for (const t of this._trunks) {
      // Exclusions: explicitly-referenced corridors (already in the chain),
      // and trunks this line itself CREATED — a creator joining its own
      // trunk would be pure self-reference. Mere MEMBERSHIP is deliberately
      // NOT an exclusion (it used to be): a joiner becomes a member the
      // moment its bundled route registers, and excluding members meant a
      // joined line's very next recompute couldn't see its own trunk
      // anymore and silently reverted to an independent route, permanently
      // ("join ratchet" — the bundle only survived as long as the route
      // cache did, confirmed by the fixed-point regression test). A member
      // re-discovering its trunk just re-evaluates the same join
      // cost-comparison and re-lands on the same lane — that's what makes
      // "joined" a genuine fixed point.
      if (excludeIds.has(t.id) || t.sourceLineId === lineId) continue;
      // A ghost shell — a discovered row whose every member (creator
      // included) has moved away — keeps its row for cheap reactivation
      // (see _purgeTrunksForLine) but shouldn't attract NEW joiners to a
      // centerline nobody occupies anymore.
      if (t.origin === 'discovered' && t.members?.size === 0) continue;
      const horizontal = t.direction === 'horizontal';
      const flow = horizontal ? 0 : 1;
      const cross = horizontal ? 1 : 0;
      const lineFlowLo = Math.min(a[flow], b[flow]);
      const lineFlowHi = Math.max(a[flow], b[flow]);
      const tFlowLo = horizontal ? t.x1 : t.y1;
      const tFlowHi = horizontal ? t.x2 : t.y2;
      const overlap = Math.min(lineFlowHi, tFlowHi) - Math.max(lineFlowLo, tFlowLo);
      if (overlap < this._trunkMinOverlap) continue;
      const tCrossCenter = t.crossCenter ?? (horizontal ? (t.y1 + t.y2) / 2 : (t.x1 + t.x2) / 2);
      // Mirrors _channelCrossingPoints' own throughCoord averaging — a
      // rough approximation of where this line's path would sit on the
      // cross axis, good enough for a "is this worth trying" gate (the
      // actual join geometry is computed precisely later, only if this
      // candidate is used). Bypassed when this line is ALREADY a
      // registered member of the trunk: membership was earned by an
      // actually-computed segment's own crossCenter proximity
      // (_mergeOrRegisterTrunk's "existing" matcher, which tests the real
      // segment, not a whole-line proxy) — that's strictly more accurate
      // than this average, and can disagree with it for a line whose
      // journey has a short shared approach run near one end but a
      // far/differently-angled destination (confirmed in the field: a
      // line silently became a registered member of another line's trunk
      // via its own independent route, yet this gate rejected offering
      // that same trunk back to it on the next pass, so the membership
      // had zero effect on the rendered path — perfect unbundled overlap
      // instead of lane-separated bundling). Membership itself
      // self-corrects every pass regardless (see _registerLineSegments'
      // post-scan diff), so this can't pin a line to a trunk its geometry
      // has actually moved away from.
      const isMember = t.members?.has(lineId);
      if (!isMember) {
        const lineCrossApprox = (a[cross] + b[cross]) / 2;
        if (Math.abs(lineCrossApprox - tCrossCenter) > this._trunkProximity) continue;
      }
      if (redundantWithChain(t, horizontal, tCrossCenter, tFlowLo, tFlowHi)) continue;
      const cand = { ...t, overlap, _isMember: isMember };
      // Prospective band: size this candidate's cross-axis bounds as if the
      // asking line had already joined (see _trunkBandHalfWidth's comment
      // for the deadlock this prevents). Only the request-local copy is
      // widened — the registry row itself grows via _recomputeTrunkBounds
      // when the join actually registers.
      if (t.origin === 'discovered' && Number.isFinite(t.crossCenter)) {
        const half = this._trunkBandHalfWidth(t, lineId);
        if (horizontal) { cand.y1 = t.crossCenter - half; cand.y2 = t.crossCenter + half; }
        else { cand.x1 = t.crossCenter - half; cand.x2 = t.crossCenter + half; }
      }
      candidates.push(cand);
    }
    candidates.sort((p, q) => q.overlap - p.overlap);
    if (candidates.length <= this._trunkMaxJoinCandidates) return candidates;
    // trunk_max_join_candidates caps how many NEW trunks a line will start
    // trying, not how many it's allowed to keep once already a genuine
    // member of each — an already-established multi-trunk membership chain
    // (e.g. a 3-leg horizontal/vertical/horizontal journey, each leg its
    // own trunk) must not have one of its legs arbitrarily dropped just
    // because a fourth, unrelated candidate happens to have more raw
    // flow-axis overlap. Confirmed as a real failure mode: capping by
    // overlap alone kept two same-direction (horizontal) trunks over the
    // vertical one connecting them, producing a genuine zigzag (the line
    // had to independently bridge the gap the dropped trunk would have
    // covered, registering a brand-new uncoordinated trunk of its own in
    // the process instead of reusing the existing one it was already
    // riding). Existing members always survive; the cap only limits how
    // many additional, not-yet-joined candidates get added on top.
    const members = candidates.filter(c => c._isMember);
    const fresh = candidates.filter(c => !c._isMember);
    const freshSlots = Math.max(0, this._trunkMaxJoinCandidates - members.length);
    return [...members, ...fresh.slice(0, freshSlots)];
  }

  /**
   * Entry/exit boundary points for one force-channel crossing, generalizing
   * _computeWaypoint's enter/exit clamp math to an arbitrary position in a
   * chain of channels. approachPoint/departPoint are reference points on
   * either side (the previous cursor and the next channel's center, or the
   * true endpoint for the last channel in the chain) used only to pick which
   * edge is the "near" one and to center the bundled crossing lane — not
   * themselves part of the returned path.
   * @param {object} chan - normalized channel {x1,y1,x2,y2,direction,weight,line_spacing,id}
   * @param {number[]} approachPoint
   * @param {number[]} departPoint
   * @param {string} lineId - req.id, for bundling offset lookup
   * @param {number} [taperBaseline] - minimum flow-axis room to reserve for
   *   a cross-axis-only correction instead of leaving it a zero-length
   *   kink (see the entryFlow/exitFlow grace-zone comment below); 0
   *   preserves the old always-minimal-distance behavior
   * @returns {{ entry: number[], exit: number[], horizontal: boolean, entryAlreadyInside: boolean, exitAlreadyInside: boolean, laneOffset: number, laneIndex: number, laneCount: number, lineSpacing: number }}
   * @private
   */
  _channelCrossingPoints(chan, approachPoint, departPoint, lineId, taperBaseline = 0) {
    const horizontal = chan.direction === 'horizontal';
    const flow = horizontal ? 0 : 1;   // axis index the line travels along through the channel
    const cross = horizontal ? 1 : 0;  // axis index perpendicular to flow (bundling axis)
    const lo = horizontal ? chan.x1 : chan.y1;
    const hi = horizontal ? chan.x2 : chan.y2;
    const crossLo = horizontal ? chan.y1 : chan.x1;
    const crossHi = horizontal ? chan.y2 : chan.x2;

    const { laneIndex, laneCount, offset } = this._trunkLaneAssignment(chan, lineId);
    // A discovered trunk's lanes are measured from the creator's own
    // centerline (crossCenter) — not from wherever this line happens to
    // approach — so a joiner always lands a whole lane offset BESIDE the
    // creator's path, never averaged toward it. Config channels have no
    // implicit centerline owner; their reference stays the approach/depart
    // average within the authored band, exactly as before.
    let throughCoord = Number.isFinite(chan.crossCenter)
      ? chan.crossCenter + offset
      : (
          Math.max(crossLo, Math.min(crossHi, approachPoint[cross])) +
          Math.max(crossLo, Math.min(crossHi, departPoint[cross]))
        ) / 2 + offset;
    throughCoord = Math.max(crossLo, Math.min(crossHi, throughCoord));

    const approachFlow = approachPoint[flow];
    const departFlow = departPoint[flow];

    // Clamping each reference point independently to the channel's
    // flow-axis span unifies every case that used to need separate
    // branches: outside on either side snaps to the near edge; already
    // inside is a no-op (keeps its own coordinate); both on the same side
    // both snap to that same near edge (a short graze, not a full
    // traversal-and-back). Critically, this also fixes a real overshoot
    // bug the branch-based version had: when the DEPART reference sits
    // BETWEEN lo and hi (e.g. the true final endpoint's flow coordinate
    // happens to fall within the channel's span, even though it's actually
    // far away on the cross axis), the old logic still forced the exit all
    // the way to the far edge — then had to reverse back toward the depart
    // point's real (shorter) coordinate to continue. Confirmed in the
    // field: a real line whose destination's x fell inside a horizontal
    // channel's x-range produced exactly this there-and-back reversal.
    // Clamping the depart point directly gives the true minimal exit
    // coordinate in every case.
    let entryFlow = Math.max(lo, Math.min(hi, approachFlow));
    let exitFlow = Math.max(lo, Math.min(hi, departFlow));

    // Grace zone: when the approach point already sits inside the channel's
    // flow-axis span AND a real cross-axis lane correction is still
    // required, reserve a small amount of flow-axis room instead of
    // leaving the boundary at EXACTLY the approach point's own coordinate —
    // otherwise the cross-axis correction becomes a zero-length kink with
    // no adjacent segment length for corner-rounding to work with.
    // `taperBaseline` (the same stubLengthFor(stubReq) baseline
    // _pushBundledApproachLegs already uses for its own nudge) is reserved
    // toward wherever the line actually continues, capped at HALF the
    // total flow-axis room available. `laneCount > 1` mirrors
    // _pushBundledApproachLegs's own gate.
    //
    // ENTRY side only, deliberately — an equivalent exit-side taper was
    // tried and reverted: `departPoint` here is `_corridorRefPoint`'s own
    // look-ahead reference for the NEXT channel in a chain (see
    // _computeCorridorRouted's own comment on `nextRef`), not always the
    // line's true final destination — tapering the exit away from that
    // reference re-introduces a small mismatch with the next channel's own
    // entry computation right at the chain boundary, producing a tiny
    // (sub-pixel-scale) residual reversal there. The true final tail leg
    // (last channel in the chain, departPoint genuinely is stubReq.b) has
    // no such conflict, but isn't distinguished from an interior chain
    // boundary at this call site, so exit tapering is skipped uniformly
    // rather than risk it. The entry side has no equivalent look-ahead
    // dependency, so it stays safe.
    //
    // An earlier version of this exact fix was reverted after it broke
    // trunk-lanes.test.js (a trunk's own creator stopped holding its
    // centerline, and a 2-line scenario stopped converging) — root-caused
    // to a SEPARATE, pre-existing latent bug in _registerLineSegments (now
    // fixed there: trunk-matching now prefers the LONGEST run, not
    // positional order, so an artificially-lengthened nudge leg can no
    // longer steal an existing trunk's match from the real, much longer
    // trunk-riding run behind it). That fix is a prerequisite for this one
    // to be safe — reintroducing this taper without it reproduces the
    // exact same regression.
    if (taperBaseline > 0 && laneCount > 1 && entryFlow === approachFlow && throughCoord !== approachPoint[cross]) {
      const halfSpan = Math.abs(departFlow - approachFlow) / 2;
      const dir = Math.sign(departFlow - approachFlow);
      if (dir !== 0) entryFlow = Math.max(lo, Math.min(hi, approachFlow + dir * Math.min(taperBaseline, halfSpan)));
    }

    // True when the boundary sits at EXACTLY the approach/depart point's
    // own coordinate — i.e. the leg touching that boundary is fundamentally
    // a cross-axis-only move (only throughCoord differs), whether because
    // clamping never moved it at all, or the grace-zone taper above didn't
    // apply. Hard-constraining such a leg's direction to the channel's flow
    // axis anyway is geometrically incompatible with "start and end share
    // this flow coordinate" and forces an artificial there-and-back detour
    // just to satisfy it (confirmed empirically on both boundaries). The
    // caller should relax that leg's hint to a plain geometry fallback
    // instead of a hard 'channel_axis' block when true.
    const entryAlreadyInside = entryFlow === approachFlow;
    const exitAlreadyInside = exitFlow === departFlow;

    const entry = horizontal ? [entryFlow, throughCoord] : [throughCoord, entryFlow];
    const exit  = horizontal ? [exitFlow, throughCoord]  : [throughCoord, exitFlow];
    // laneIndex (raw 0,1,2,...) is exposed alongside the signed laneOffset
    // for the approach/depart legs' own shared corridor (see
    // _pushBundledApproachLegs) — a signed offset can point backward
    // relative to a line's established travel direction, and two lines'
    // offsets can share a magnitude (e.g. -8/+8), so the corridor uses the
    // raw index in a single safe direction instead.
    //
    // laneCount is how many distinct lines currently occupy this corridor
    // (including the asker; for a discovered trunk, including its creator)
    // — see _pushBundledApproachLegs for why this, not laneIndex, is the
    // right gate for whether a nudge/split is actually needed. All three
    // derive from live trunk membership (_trunkLaneAssignment), never from
    // stored assignment state.
    return {
      entry, exit, horizontal, entryAlreadyInside, exitAlreadyInside,
      laneOffset: offset,
      laneIndex,
      laneCount,
      lineSpacing: chan.line_spacing
    };
  }

  /**
   * Build a synthetic single-leg request reusing a base request's routing
   * config (clearance, proximity, cornerRadius, channels, etc.) with new
   * endpoints and per-leg direction hints. firstHint/lastHint are one of:
   * `{ source: 'anchor_side'|'attach_side'|<other>, mode, anchorSide/attachSide }`
   * for the true start/end of the whole line, `{ source: 'channel_axis',
   * horizontal }` for a force-channel leg boundary, or `{ source: 'geometry' }`
   * for a boundary that isn't a real edge-crossing (see _channelCrossingPoints'
   * entryAlreadyInside) and should just fall back to the same dx/dy-based
   * axis preference buildRouteRequest uses for a line with no explicit hint
   * — hard-constraining such a boundary to the channel's flow axis would be
   * geometrically incompatible with it (start and end already share that
   * axis's coordinate) and forces an artificial detour.
   *
   * modeHint/modeHintLast strings are set in addition to the boolean
   * _channelAxisHorizontal* fields because other code (the post-A* grid-snap
   * relaxation and the diagonal-elbow fallback) branches on those strings
   * directly and isn't aware of 'channel_axis'. NOTE the two hint strings use
   * opposite conventions for "horizontal": modeHint:'xy' means horizontal
   * *first*, but modeHintLast:'xy' means vertical *last* ('yx' is horizontal
   * last) — see the A* loop's wantsHorizontalFirst/wantsHorizontalLast checks.
   * @param {object} base
   * @param {number[]} a
   * @param {number[]} b
   * @param {object} firstHint
   * @param {object} lastHint
   * @returns {object}
   * @private
   */
  _buildLegRequest(base, a, b, firstHint, lastHint) {
    const geomAxis = () => {
      const dx = Math.abs(b[0] - a[0]), dy = Math.abs(b[1] - a[1]);
      return dx >= dy ? 'xy' : 'yx';
    };
    const modeHint = firstHint.source === 'geometry'
      ? geomAxis()
      : (firstHint.mode ?? (firstHint.horizontal ? 'xy' : 'yx'));
    const modeHintLast = lastHint.source === 'geometry'
      ? geomAxis() // buildRouteRequest mirrors modeHint's own value when neither is explicit — same convention here
      : (lastHint.mode ?? (lastHint.horizontal ? 'yx' : 'xy'));
    return {
      ...base,
      a, b,
      modeHint,
      modeHintLast,
      _hintSourceFirst: firstHint.source,
      _hintSourceLast: lastHint.source,
      anchorSide: firstHint.anchorSide ?? base.anchorSide,
      attachSide: lastHint.attachSide ?? base.attachSide,
      _channelAxisHorizontalFirst: firstHint.source === 'channel_axis' ? firstHint.horizontal : undefined,
      _channelAxisHorizontalLast: lastHint.source === 'channel_axis' ? lastHint.horizontal : undefined,
      // Carried whenever present, regardless of the hint's own primary
      // source — see _computeCorridorRouted's entryHint comment: a
      // 'channel_axis' hint on the ARRIVAL/last side can ALSO carry a
      // continuationDir as a fallback for when its own axis-lock relieves
      // itself (degenerate axis), not just a bare 'continuation' source.
      // First-side equivalents (departure) were tried and reverted this
      // session — verified via the full test suite to make no observable
      // difference for the one scenario they were built for (a deeper,
      // separate _mergeCorridors chain-ordering defect was the actual
      // cause there; see scale-stress.test.js), so not carried here.
      _continuationDirLast: lastHint.continuationDir,
      _continuationHorizontalLast: lastHint.continuationDir !== undefined ? lastHint.horizontal : undefined
    };
  }

  /**
   * Pushes the "between crossings" leg (departure from an anchor/previous
   * exit toward the next channel entry, or toward the true final endpoint).
   * A single unsplit leg lets the pathfinder pick its own bend order, which
   * typically minimizes bends by traveling the long (flow) direction first
   * and correcting the short (cross) distance only right at the end —
   * meaning two lines that share a similar departure point (e.g. the same
   * stub x-coordinate from vertically-stacked same-anchor_side controls)
   * run visually coincident for nearly their whole length, diverging only
   * in the final few pixels before each one's own bundled lane. Confirmed
   * as a real, reported issue: "two of the lines touch each other before
   * coming into the channel."
   *
   * When `lineSpacing` is set and MORE THAN ONE line has registered at this
   * channel/trunk so far (`laneCount > 1` — see `_channelCrossingPoints`'s
   * `laneCount`, NOT this line's own `laneIndex`), splits into three legs
   * that nudge onto this line's own corridor immediately, travel the whole
   * shared stretch already separated, then correct back to the true
   * boundary coordinate at the very end. The nudge uses the RAW per-line
   * lane index (0,1,2,...), not the crossing's own centered ±offset: a
   * centered value can point backward relative to the leg's established
   * travel direction (confirmed: produced a real reversal right after the
   * anchor's own stub), and two different lines' centered offsets can
   * share a magnitude (e.g. -8/+8), which would collide once reduced to a
   * single safe direction. The raw index, always applied in this leg's own
   * net flow direction (`Math.sign(to[flow]-from[flow])`), is always
   * non-negative and always distinct per line, so it can never reverse and
   * never collide.
   *
   * Gating on `laneCount > 1` rather than `laneIndex > 0` is deliberate and
   * fixes a real, confirmed bug: whichever single line happens to register
   * FIRST at a corridor always has `laneIndex === 0`, and gating on that
   * index alone meant lane 0 NEVER got this nudge treatment, regardless of
   * how many siblings later joined — so lane 0 kept taking the single,
   * unconstrained fallback below and could ride visually coincident with a
   * sibling for nearly its whole length, the EXACT symptom this whole
   * mechanism exists to prevent, just relocated onto lane 0 specifically.
   * `laneCount` (how many DISTINCT lines have registered here, regardless
   * of which index THIS line holds) is the correct gate: "is there really
   * something to separate from," not "am I the second-or-later line."
   * Because the discovery loop (`AdvancedRenderer._discoverLineRoutes`)
   * re-evaluates every line multiple times as the registry fills in, lane
   * 0's own later passes correctly see `laneCount` grow past 1 the moment
   * a sibling joins, and self-correct into the split — something a single
   * declaration-order pass could never guarantee for whichever line
   * happened to arrive first.
   *
   * Without meaningful spacing (`lineSpacing` falsy) or with no real
   * sibling (`laneCount <= 1`, this line is genuinely alone here), the
   * plain unsplit fallback below is used — there's nothing to separate
   * from, and forcing a specific correction order unconditionally can
   * directly conflict with the true boundary hint's own hard-blocked
   * direction (see the fallback's own comment).
   *
   * The interior boundaries (the nudge and the cross-axis correction) are
   * intentionally left unconstrained ('geometry') rather than hard-blocked
   * to the channel's flow axis: they're small, interior adjustments, not
   * real edge-crossings — the actual directional guarantee only needs to
   * hold at the TRUE boundaries, which are the fixed stub segment already
   * spliced on before `from`, and `to` itself (the real channel entry/exit
   * or endpoint).
   * @param {object[]} legs - leg array to push onto
   * @param {object} stubReq - base request (for _buildLegRequest)
   * @param {number[]} from
   * @param {number[]} to
   * @param {boolean} horizontal - the RELEVANT channel's own flow axis (the
   *   one being approached, or — for the trailing leg — the one just
   *   departed), not necessarily related to `from`/`to`'s own geometry
   * @param {number} laneIndex - this line's raw 0,1,2,... lane index at
   *   that channel (see _trunkLaneAssignment)
   * @param {number} laneCount - how many distinct lines have registered at
   *   that channel/trunk so far (see _channelCrossingPoints)
   * @param {number} lineSpacing - that channel's line_spacing
   * @param {object} firstHint - the true hint governing departure from `from`
   * @param {object} lastHint - the true hint governing arrival at `to`
   * @private
   */
  _pushBundledApproachLegs(legs, stubReq, from, to, horizontal, laneIndex, laneCount, lineSpacing, firstHint, lastHint) {
    const flow = horizontal ? 0 : 1;
    // Baseline uses the SAME threshold as the cardinal-side lead-out/lead-in
    // stubs (2x corner radius, floored at MIN_STUB_LENGTH) — a nudge whose
    // length is just the raw per-line spacing (e.g. 8px) caps the corner-
    // rounding formula's own lenIn/2 clamp at 4px regardless of the
    // configured radius, and a consecutive-corner adjustment (in
    // _applyCornerRounding, meant to prevent two REAL adjacent corners'
    // trims from overlapping) then shrinks it further because it doesn't
    // know a degenerate 180° pass-through point (the collinear stub-to-
    // nudge boundary) isn't a real competing corner. Confirmed as a real
    // regression: rendered as a near-sharp corner instead of the
    // configured radius. Each line still gets a distinct, non-overlapping
    // lane (the baseline is shared by every offset line; only the
    // `laneIndex * lineSpacing` term needs to differ between them), just
    // comfortably long enough to round properly too.
    // Clamped to the actual distance available to `to` — unreachable/inert
    // for today's config-channel callers (a real channel entry is
    // typically far enough from the anchor that this never binds), but
    // load-bearing once a discovered trunk's entry point can legitimately
    // sit close to a line's own anchor (the exact scenario this whole
    // feature targets: near-adjacent departures). Without the clamp, the
    // nudge can overshoot past `to` and produce a reversal — the same
    // class of bug _noOvershootStub was built to prevent for cardinal
    // stubs, applied here to the corridor nudge instead.
    const rawOffset = stubLengthFor(stubReq) + laneIndex * lineSpacing;
    const available = Math.abs(to[flow] - from[flow]);
    const corridorOffset = lineSpacing && laneCount > 1 && from[flow] !== to[flow]
      ? Math.sign(to[flow] - from[flow]) * Math.min(rawOffset, available)
      : 0;
    if (!corridorOffset) {
      // NOTE: a cross-axis-only split (from[flow] === to[flow'] but
      // from[cross] !== to[cross]) was tried here — unconditionally
      // downgrading firstHint to 'geometry' whenever laneCount > 1 — and
      // reverted. It regressed a case where the existing hard hint was
      // harmless: a line routing around its own anchor box's obstacle
      // needed a sideways-first move regardless, which the hard
      // "don't reverse the stub's departure" block already produced for
      // free; discarding that hint let the pathfinder wander into a
      // slightly different, wobblier detour instead. The genuinely-needed
      // case (a discovered trunk's real lane-offset entry falls behind the
      // stub, forcing an actual reversal) is handled by
      // _computeManhattan's degenerate-and-soft bailout once _computeGrid
      // legitimately returns null for the (still hard-blocked, via 1a's
      // 'anchor_stub'/'attach_stub' downgrade) unsplit fallback below —
      // no separate softening needed here.
      // No real bundling need — this line is genuinely alone at this
      // channel/trunk (laneCount <= 1) or there's no spacing configured.
      // Fall back to a single, unsplit leg with the TRUE hints, letting
      // the pathfinder pick its own natural, hint-compatible shape exactly
      // as it did before this feature existed. This is not just the
      // simpler option: forcing a specific correction order unconditionally
      // can directly conflict with the true boundary hint's own
      // hard-blocked direction — e.g. anchor_side:'top' hard-blocks
      // straight-down travel, but a blind cross-axis-first order for a
      // horizontal channel with a top/bottom departure side IS
      // straight-down travel. Confirmed as a real regression: produced a
      // genuine reversal for exactly that combination.
      legs.push(this._buildLegRequest(stubReq, from, to, firstHint, lastHint));
      return;
    }
    // A real corridor to separate: nudge onto this line's own lane
    // immediately (a small FLOW-axis move — safe regardless of firstHint,
    // since it's perpendicular to whatever cross-axis direction firstHint
    // might hard-block), travel the shared stretch there, then correct
    // back to the true boundary coordinate. Both interior boundaries are
    // left unconstrained ('geometry') — they're small interior
    // adjustments, not real edge-crossings, so the true directional
    // guarantee only needs to hold at the real boundaries: the fixed stub
    // already spliced on before `from`, and `to` itself.
    const nudge = horizontal ? [from[0] + corridorOffset, from[1]] : [from[0], from[1] + corridorOffset];
    const mid = horizontal ? [nudge[0], to[1]] : [to[0], nudge[1]];
    // `mid` coincides EXACTLY with `to` whenever corridorOffset reached its
    // full `available` clamp (the common case — corridorOffset's own
    // magnitude is capped at `available`, i.e. |to[flow]-from[flow]|, so
    // nudge[flow] lands exactly on to[flow] whenever rawOffset >=
    // available). When that happens, the (nudge,mid) leg IS the true
    // final arrival at `to` — its own hardcoded {geometry} last-hint
    // otherwise leaves that arrival's direction completely unconstrained,
    // with no visibility into whatever comes immediately after `to`
    // (typically the mandatory entry->exit crossing this whole approach
    // exists to reach). Confirmed as a real, reported bug: an unconstrained
    // arrival detoured around an obstacle and came back from the wrong
    // side, producing a same-axis reversal right at `to` — a mandatory
    // point the post-hoc reversal backstop correctly refuses to collapse.
    // The (mid,to) leg below still gets `lastHint` too, for the rarer case
    // where they're NOT the same point (corridorOffset clamped by
    // `rawOffset` instead, leaving genuine residual distance for a real
    // third leg) — passing the real hint to whichever leg turns out to be
    // the actual final arrival, without needing to know in advance which
    // one that'll be.
    const midIsTo = mid[0] === to[0] && mid[1] === to[1];
    legs.push(this._buildLegRequest(stubReq, from, nudge, { source: 'geometry' }, { source: 'geometry' }));
    legs.push(this._buildLegRequest(stubReq, nudge, mid, { source: 'geometry' }, midIsTo ? lastHint : { source: 'geometry' }));
    legs.push(this._buildLegRequest(stubReq, mid, to, { source: 'channel_axis', horizontal }, lastHint));
  }

  /**
   * Orders the corridors a line will chain through. Explicit route_channels
   * keep their authored order unchanged — load-bearing for force-channel
   * chains, where the user's declared sequence is the only signal
   * expressing intent. Discovered trunks have no authored order at all, so
   * they're appended, sorted by ascending flow-distance from the line's own
   * start point. A suboptimal merge order here can only make the resulting
   * chain lose the cost-comparison against the plain route more often —
   * never produce a broken path, since each leg is still independently
   * pathfound and direction-guaranteed.
   * @param {Array<object>} explicitCorridors
   * @param {Array<object>} discoveredTrunks
   * @param {object} stubReq
   * @returns {Array<object>}
   * @private
   */
  _mergeCorridors(explicitCorridors, discoveredTrunks, stubReq) {
    if (!discoveredTrunks.length) return explicitCorridors;
    const distTo = (t) => {
      const horizontal = t.direction === 'horizontal';
      const flow = horizontal ? 0 : 1;
      const lo = horizontal ? t.x1 : t.y1;
      const hi = horizontal ? t.x2 : t.y2;
      return Math.min(Math.abs(stubReq.a[flow] - lo), Math.abs(stubReq.a[flow] - hi));
    };
    const sorted = discoveredTrunks.slice().sort((p, q) => distTo(p) - distTo(q));
    return [...explicitCorridors, ...sorted];
  }

  /**
   * Channel-forced routing: composes the force AND prefer channels
   * referenced by stubReq (in their declared route_channels order) into
   * legs — approach, through, approach, through, ..., depart — each
   * computed by the SAME _computeGrid (and, in smart mode, _refineSmart)
   * used everywhere else, so every leg automatically inherits obstacle
   * avoidance and prefer/avoid cost bias. Only the true first leg's start
   * and true last leg's end carry the outer request's real
   * anchor_side/attach_side hints; every channel-boundary crossing gets a
   * 'channel_axis' hard block instead (see the A* loop's
   * _hintSourceFirst/_hintSourceLast === 'channel_axis' branches),
   * guaranteeing the crossing itself follows the channel's configured
   * direction with no U-turn.
   *
   * This candidate is MANDATORY for 'force' channels but OPTIONAL for
   * 'prefer' ones — the caller (computePath) decides whether to actually
   * use it. That split exists because a per-cell A* cost bias
   * (_buildChannelCostGrid) can only ever discount a cell down to
   * MIN_STEP_COST (never negative — A* needs non-negative edges to stay
   * correct), which caps the total achievable reward at roughly
   * `channel_width_in_cells × ~1` — nowhere near enough to outweigh a real
   * detour to a channel that isn't already on the natural path. Building
   * this candidate and comparing its REAL, distance-based cost (via
   * _channelDelta, not grid cells) against the plain route's cost sidesteps
   * that ceiling entirely — confirmed necessary in the field: at
   * grid_resolution 64 a ~190px-wide prefer channel could get at most ~2.7
   * total discount, while even a one-turn detour costs more than that.
   * @param {object} stubReq - already stub-shifted request (see computePath)
   * @param {boolean} smart - whether to run _refineSmart per leg
   * @param {Array<object>} corridors - explicit force/prefer channels AND/OR
   *   discovered trunks to chain through, in the order they should be
   *   visited (see _mergeCorridors — explicit route_channels keep their
   *   authored order; discovered trunks are appended by proximity). A
   *   channel and a discovered trunk are indistinguishable here — both are
   *   plain {id,x1,y1,x2,y2,direction,weight,line_spacing} objects.
   * @returns {object|null} route result, or null if `corridors` is empty
   * @private
   */

  /**
   * A corridor's own reference point on its lane-offset centerline, not its
   * raw geometric midpoint — used as the "next corridor" lookahead when
   * computing the PREVIOUS corridor's exit clamp. See the call site's
   * comment for the overshoot-then-reverse bug this fixes.
   * @param {object} chan
   * @param {string} lineId
   * @returns {number[]}
   * @private
   */
  _corridorRefPoint(chan, lineId) {
    const horizontal = chan.direction === 'horizontal';
    const flowMid = horizontal ? (chan.x1 + chan.x2) / 2 : (chan.y1 + chan.y2) / 2;
    const offset = Number.isFinite(chan.crossCenter) ? this._trunkLaneAssignment(chan, lineId).offset : 0;
    const throughCoord = Number.isFinite(chan.crossCenter)
      ? chan.crossCenter + offset
      : (horizontal ? (chan.y1 + chan.y2) / 2 : (chan.x1 + chan.x2) / 2);
    return horizontal ? [flowMid, throughCoord] : [throughCoord, flowMid];
  }

  _computeCorridorRouted(stubReq, smart, corridors) {
    const chainChannels = corridors;
    if (!chainChannels.length) return null;
    // A force channel is mandatory by definition (user-authored, always
    // honored regardless of cost — see computePath's hasForceChannels
    // branch, which uses this candidate unconditionally with no
    // alternative to fall back to) — never reject one for landing inside
    // an obstacle; that's a config issue for the user to resolve, not
    // something to silently override. Only optional (prefer/discovered)
    // chains are ever rejected below.
    const hasForceChannel = chainChannels.some(c => c.mode === 'force');

    // Prospective bundle-mate exemption: while routing TOWARD a corridor,
    // crossing penalties from that corridor's own occupants must not apply
    // — reaching an outer lane legitimately crosses the inner lanes
    // (that's how a real raceway works), and penalizing those crossings
    // made A* sneak AROUND the end of the occupants' registered runs
    // instead (confirmed: a joiner's approach leg detoured sideways past
    // the trunk's own flow start, polluting the trunk's bounds with the
    // detour). _buildCrossingCostGrid's own membership-based exemption
    // can't cover this — on a line's FIRST join evaluation it isn't a
    // member yet. Applied to the leg requests only, never to stubReq
    // itself: the plain-route candidate this chained result is compared
    // against keeps full crossing penalties (it isn't joining anything).
    const exemptIds = new Set();
    for (const chan of chainChannels) {
      const row = this._trunks.find(t => t.id === chan.id);
      if (row?.sourceLineId) exemptIds.add(row.sourceLineId);
      for (const id of row?.members?.keys() ?? []) exemptIds.add(id);
    }
    const legBase = exemptIds.size
      ? { ...stubReq, _crossingExemptIds: [...exemptIds].sort() }
      : stubReq;

    const legs = [];
    let cursor = stubReq.a;
    // Every point that is a REAL, meaningful crossing along this chain —
    // a channel's own entry/exit (from _channelCrossingPoints) and the
    // two ends of the whole chained route (stubReq.a/.b). Collected by
    // coordinate, not by which hint string happens to be attached to
    // whichever leg touches the point: _pushBundledApproachLegs's own
    // interior 'nudge'/'mid' correction points are explicitly documented
    // as NOT real edge-crossings, yet the leg departing FROM 'mid' is
    // still given a 'channel_axis' hint on that side purely to steer that
    // leg's own search direction toward the channel's flow axis — using
    // hint-source alone to decide "must this point survive?" would
    // wrongly protect 'mid' too (confirmed: a real reversal at exactly
    // such a point was missed this way before this was reworked to track
    // geometric role instead of hint string). See
    // _collapseSoftLegReversals for how this set is used.
    const mandatoryPoints = new Set([this._ptKey(stubReq.a), this._ptKey(stubReq.b)]);
    // Mirrors entryAlreadyInside on the OTHER boundary: true when the
    // previous channel's exit point didn't actually move from its own
    // depart reference (already inside that channel's span), meaning the
    // leg departing FROM it is fundamentally a cross-axis-only move too.
    let prevExitAlreadyInside = false;
    let lastLaneIndex = 0;
    let lastLaneCount = 1;
    let lastLineSpacing = 0;
    for (let k = 0; k < chainChannels.length; k++) {
      const chan = chainChannels[k];
      const next = chainChannels[k + 1];
      // The next corridor's own OFFSET entry, not its raw geometric
      // midpoint — see _corridorRefPoint. Using the raw midpoint here can
      // clamp THIS corridor's exit to its own flow boundary even when the
      // next corridor's real (lane-offset) entry sits well inside that
      // boundary, producing a needless overshoot-to-the-boundary then
      // backtrack (a true 180-degree reversal on the same axis, not a real
      // corner — confirmed rendering as a degenerate zero-length
      // corner-rounding arc).
      const nextRef = next ? this._corridorRefPoint(next, stubReq.id) : stubReq.b;
      const { entry, exit, horizontal, entryAlreadyInside, exitAlreadyInside, laneIndex, laneCount, lineSpacing } = this._channelCrossingPoints(chan, cursor, nextRef, stubReq.id, stubLengthFor(legBase));
      // Reject this whole candidate chain outright if a trunk's own
      // lane-offset entry/exit lands strictly inside an obstacle — see
      // _pointInsideObstacle's own comment. This is a hard rejection, not
      // a detour-and-continue: the boundary itself is the problem, not the
      // path leading to it, and _computeGrid's own goal-cell exemption
      // would otherwise let a leg cut straight through to reach it anyway.
      // computePath's own corridor-vs-plain (and solo-trunk-vs-solo-trunk)
      // comparison already treats a null candidate as simply unavailable,
      // falling back to whichever OTHER candidate remains — exactly the
      // right behavior here, since the plain route is fully obstacle-aware
      // on its own.
      if (!hasForceChannel && (this._pointInsideObstacle(entry) || this._pointInsideObstacle(exit))) return null;
      mandatoryPoints.add(this._ptKey(entry));
      mandatoryPoints.add(this._ptKey(exit));

      // k===0's `from` (cursor) is stubReq.a — the STUB's landing point,
      // not the true raw anchor. _applyCardinalStubs already spent the
      // hard, unconditional "don't reverse this direction" guarantee
      // getting there (computePath:763-765, once, before trunk discovery
      // even runs) — re-propagating the raw 'anchor_side' source here
      // makes every downstream consumer (_computeGrid's reversal-block,
      // _computeManhattan's stub+elbow construction) treat this inner
      // correction leg as if it still needed that same hard guarantee,
      // even when a discovered trunk's real lane-offset entry requires a
      // short, legitimate step back toward (or past) the stub point.
      // Downgraded to 'anchor_stub': _computeGrid still hard-blocks the
      // exact reversal for this source too (a soft cost-penalty version
      // was tried and reverted — it let A* choose genuinely unnecessary
      // reversals whenever grid quantization made one look marginally
      // cheaper). What actually changes for 'anchor_stub' vs 'anchor_side'
      // is the FALLBACK when that hard block leaves no path: the
      // corridor-routed leg loop (below) retries via _computeGrid again
      // with the source relaxed to 'geometry' — still obstacle-aware,
      // unlike _computeManhattan — before ever falling to Manhattan.
      // Confirmed as a real bug: a line whose bundled entry point fell
      // between its raw anchor and its own stub reach produced a same-axis
      // 180-degree reversal that the un-downgraded hard block simply had
      // no valid non-reversing shape to return for.
      // When entry sits exactly at the approach's own flow coordinate
      // (entryAlreadyInside), the approach leg used to get a bare
      // 'geometry' hint — fully unconstrained, including on its own LAST
      // move into `entry`. That leg's own A* search has zero visibility
      // into the fact that the VERY NEXT leg (entry->exit, immediately
      // following) needs to continue in a specific, already-known
      // direction — so an obstacle detour elsewhere in this same leg can
      // arrive at `entry` from whichever side is locally cheapest,
      // including the exact wrong one, producing a same-axis reversal
      // right at `entry` (mandatory, so the post-hoc collapse backstop
      // correctly refuses to touch it). Confirmed as a real, reported bug
      // (both in a higher-line-count stress scenario and, later, in this
      // exact turnaround-regression config once an unrelated obstacle-grid
      // fix shifted which cells were blocked). Fixed the same SAFE way
      // attach_side/attach_stub already do — a hard block on ONLY the
      // exact reversal of a known direction, never the full axis — using
      // the entry->exit crossing's own already-known flow direction as
      // that reference, instead of CARDINAL_DIR[someSide]. A soft,
      // cost-based version of this was deliberately not attempted: this
      // exact class of fix (soft penalty on a directional preference) was
      // already tried elsewhere this session and reverted for letting A*
      // choose genuinely unnecessary reversals under grid quantization.
      //
      // continuationDir is carried as SUPPLEMENTARY info on the hint
      // regardless of entryAlreadyInside, not just used to pick the
      // top-level hint source: the !entryAlreadyInside case still uses the
      // full 'channel_axis' axis-lock as its PRIMARY guarantee (stronger
      // than a reversal-only block, kept wherever it's actually
      // satisfiable) — but that axis-lock has its own, EARLIER degenerate-
      // axis relief (this session's own channel_axis fix: when this leg's
      // raw endpoints already share the required axis's coordinate, the
      // lock is unconditionally dropped to avoid an unsatisfiable, forced
      // detour). Confirmed as a real, reported bug: exactly that relief
      // firing left an 'channel_axis'-sourced arrival with ZERO actual
      // constraint (same as bare 'geometry'), reproducing the identical
      // wrong-side-approach reversal the entryAlreadyInside branch below
      // was built to prevent. continuationDir is the fallback _computeGrid
      // reaches for the moment the axis-lock relieves itself, so the
      // narrower "don't reverse" guarantee still holds either way.
      const continuationFlowIdx = horizontal ? 0 : 1;
      const continuationDir = Math.sign(exit[continuationFlowIdx] - entry[continuationFlowIdx]);
      const entryHint = !entryAlreadyInside
        ? { source: 'channel_axis', horizontal, continuationDir }
        : (continuationDir !== 0
          ? { source: 'continuation', continuationDir, horizontal }
          : { source: 'geometry' });
      this._pushBundledApproachLegs(legs, legBase, cursor, entry, horizontal, laneIndex, laneCount, lineSpacing,
        k === 0
          ? { source: stubReq._hintSourceFirst === 'anchor_side' ? 'anchor_stub' : stubReq._hintSourceFirst, mode: stubReq.modeHint, anchorSide: stubReq.anchorSide }
          : (prevExitAlreadyInside ? { source: 'geometry' } : { source: 'channel_axis', horizontal: chainChannels[k - 1].direction === 'horizontal' }),
        entryHint);
      legs.push(this._buildLegRequest(legBase, entry, exit,
        { source: 'channel_axis', horizontal },
        { source: 'channel_axis', horizontal }));
      cursor = exit;
      prevExitAlreadyInside = exitAlreadyInside;
      lastLaneIndex = laneIndex;
      lastLaneCount = laneCount;
      lastLineSpacing = lineSpacing;
    }
    // Mirrors the k===0 downgrade above: `to` here is stubReq.b, the
    // arrival stub's landing point, not the true raw attach point.
    const lastChan = chainChannels[chainChannels.length - 1];
    this._pushBundledApproachLegs(legs, legBase, cursor, stubReq.b, lastChan.direction === 'horizontal', lastLaneIndex, lastLaneCount, lastLineSpacing,
      prevExitAlreadyInside ? { source: 'geometry' } : { source: 'channel_axis', horizontal: lastChan.direction === 'horizontal' },
      { source: stubReq._hintSourceLast === 'attach_side' ? 'attach_stub' : stubReq._hintSourceLast, mode: stubReq.modeHintLast, attachSide: stubReq.attachSide });

    let pts = [];
    let totalIterations = 0;
    for (const legReq of legs) {
      // Declared without an initializer (matching computePath's own
      // result variable) so TS infers a union across every possible
      // assignment below instead of narrowing to _computeGrid's return
      // shape alone, which doesn't structurally match _computeManhattan's.
      let legResult;
      legResult = this._computeGrid(legReq);
      if (smart && legResult) legResult = this._refineSmart(legReq, legResult);
      // A null result for a leg carrying 'anchor_stub'/'attach_stub' means
      // the hard reversal-block correctly rejected the ONLY direction A*
      // was willing to consider first/last — but this leg's start/end is
      // already a resolved stub, not the raw anchor (see the k===0/last-leg
      // hint downgrade above), so a short reversal really is a legitimate
      // correction here, not a visible backtrack into the source box.
      // Retry through _computeGrid again (NOT straight to _computeManhattan
      // below) with those sources relaxed to 'geometry' — _computeGrid is
      // still obstacle-aware, _computeManhattan never is. Confirmed as a
      // real bug the naive alternative (falling straight to
      // _computeManhattan's own softened elbow construction) caused: for a
      // leg that also needed to route around an obstacle, the non-
      // obstacle-aware Manhattan fallback drew a straight line directly
      // through it. This retry only ever fires when the hard attempt
      // genuinely failed — a leg that already finds a valid non-reversing,
      // obstacle-avoiding path (the common case) is completely unaffected.
      if (!legResult && (legReq._hintSourceFirst === 'anchor_stub' || legReq._hintSourceFirst === 'attach_stub' || legReq._hintSourceLast === 'anchor_stub' || legReq._hintSourceLast === 'attach_stub')) {
        const relaxedLegReq = {
          ...legReq,
          _hintSourceFirst: (legReq._hintSourceFirst === 'anchor_stub' || legReq._hintSourceFirst === 'attach_stub') ? 'geometry' : legReq._hintSourceFirst,
          _hintSourceLast: (legReq._hintSourceLast === 'anchor_stub' || legReq._hintSourceLast === 'attach_stub') ? 'geometry' : legReq._hintSourceLast
        };
        legResult = this._computeGrid(relaxedLegReq);
        if (smart && legResult) legResult = this._refineSmart(relaxedLegReq, legResult);
      }
      if (!legResult) legResult = this._computeManhattan(legReq);
      totalIterations += legResult.meta?.grid?.iterations || 0;
      const legPts = legResult.pts;
      if (!pts.length) {
        pts.push(...legPts);
      } else {
        const last = pts[pts.length - 1];
        const startIdx = (legPts[0][0] === last[0] && legPts[0][1] === last[1]) ? 1 : 0;
        pts.push(...legPts.slice(startIdx));
      }
    }
    // Generalized version of computePath's own outer stub-splice collapse
    // (see its comment for the full rationale and the obstacle-crossing
    // guard's own history): every leg here is pathfound independently, so
    // a reversal can in principle appear at ANY splice between two legs,
    // not just the outermost stub boundary — this session found and
    // patched several distinct mechanisms that could produce one (see
    // this file's other comments referencing 'anchor_stub'/'attach_stub'),
    // and there is no way to prove no further mechanism exists. Rather
    // than keep chasing individual causes, collapse any reversal found at
    // a point that isn't one of this chain's real crossings (mandatoryPoints,
    // built above from each channel's own entry/exit and the chain's own
    // two ends — NOT from leg hint-source strings, which are ambiguous:
    // _pushBundledApproachLegs's own interior 'mid' correction point
    // carries a 'channel_axis' hint on its departure side purely to steer
    // that leg's search direction, even though the point itself is
    // explicitly documented as not a real edge-crossing — confirmed this
    // matters: an early hint-string-based version of this backstop missed
    // exactly this shape of reversal), and never when the direct
    // replacement segment would cross an obstacle.
    pts = this._collapseSoftLegReversals(pts, mandatoryPoints);
    pts = this._compactPolyline(pts);

    // Reporting only — geometry already guaranteed by leg construction.
    // _corridorDelta (not _channelDelta) because a discovered trunk is
    // never present in this._channels, so _channelDelta (which filters
    // this._channels by req.channels) could never see it — this is the
    // one piece of the routing pipeline that actually needs to know about
    // trunks that aren't config-sourced channels.
    const channelInfo = this._corridorDelta(pts, chainChannels, stubReq.id);
    const bendW = (this.config?.cost_defaults?.bend ?? 10);
    const proxW = (this.config?.cost_defaults?.proximity ?? 4);
    const { penalty: proxPenalty } = this._segmentProximityPenalty(pts, stubReq.clearance, stubReq.proximity, proxW);
    return {
      d: this._polylineToPath(pts),
      pts,
      meta: {
        strategy: 'corridor-routed',
        cost: this._costComposite(pts, bendW, proxW, proxPenalty, channelInfo.delta),
        segments: pts.length - 1,
        bends: Math.max(0, pts.length - 2),
        grid: { iterations: totalIterations },
        chainChannels: chainChannels.map((c, i) => ({ id: c.id, mode: c.mode, leg: i })),
        channel: {
          mode: channelInfo.mode,
          insidePx: channelInfo.inside,
          outsidePx: channelInfo.outside,
          coveragePct: Number((channelInfo.coverage * 100).toFixed(1)),
          deltaCost: channelInfo.delta,
          forcedOutside: channelInfo.forcedOutside
        }
      }
    };
  }

  /**
   * route: 'direct' — a literal 2-point straight line, no elbow, no
   * obstacle avoidance, matching its own documentation (LineOverlay docs /
   * Studio UI both describe it this way — before this method existed,
   * 'direct' fell through to _computeManhattan and got the same elbow shape
   * as every other unrecognized mode).
   * @param {object} req - Route request
   */
  _computeDirect(req) {
    const pts = [req.a, req.b];
    return {
      d: this._polylineToPath(pts),
      pts,
      meta: { strategy: 'direct', cost: this._costSimple(pts), segments: 1, bends: 0 }
    };
  }

  /**
   * Manhattan routing supporting independent first and last segment hints.
   * @param {object} req - Route request with modeHint and modeHintLast
   */
  _computeManhattan(req) {
    const [x1, y1] = req.a;
    const [x2, y2] = req.b;
    const firstMode = (req.modeHint === 'yx') ? 'yx' : 'xy';
    const lastMode  = (req.modeHintLast === 'yx') ? 'yx' : 'xy';

    // anchor_side/attach_side ('left'/'right'/'top'/'bottom') carry a real
    // outward direction, unlike modeHint/modeHintLast which only ever
    // preserve an axis ('xy'/'yx') — 'left' means "depart/arrive from the
    // left", not just "this segment is horizontal". Only apply when the hint
    // actually came from anchor_side/attach_side (not an explicit
    // route_hint/route_hint_last override or the geometry fallback below),
    // so every other case keeps behaving exactly as before.
    // 'anchor_stub'/'attach_stub' (see _computeCorridorRouted's k===0 hint
    // downgrade) carry the same direction preference but are NOT the true
    // raw anchor/attach point — this leg's own start/end is already a
    // resolved stub. anchorHard/attachHard distinguish the two below, for
    // the degenerate-elbow bailout.
    const anchorDir = (req._hintSourceFirst === 'anchor_side' || req._hintSourceFirst === 'anchor_stub') ? CARDINAL_DIR[req.anchorSide] : null;
    const attachDir = (req._hintSourceLast === 'attach_side' || req._hintSourceLast === 'attach_stub') ? CARDINAL_DIR[req.attachSide] : null;
    const anchorHard = req._hintSourceFirst === 'anchor_side';
    const attachHard = req._hintSourceLast === 'attach_side';

    let pts;
    if (anchorDir || attachDir) {
      const p1 = [x1,y1], p2 = [x2,y2];

      // Try the plain lastMode-only elbow first (no stub at all) — for many
      // geometries it already departs/arrives the correct way on its own
      // (e.g. the anchor and target just happen to already be offset in the
      // right direction), and using it directly gives corner rounding the
      // full natural segment length to work with. Forcing a stub on top
      // unconditionally would only shorten that, or worse — if the natural
      // offset is smaller than the stub length, force an unwanted overshoot.
      const naturalElbow = lastMode === 'xy' ? [x2, y1] : [x1, y2];
      const matchesDir = (from, to, dir) => {
        const axisIsX = dir[0] !== 0;
        const delta = axisIsX ? (to[0] - from[0]) : (to[1] - from[1]);
        const wantSign = axisIsX ? dir[0] : dir[1];
        return Math.sign(delta) === Math.sign(wantSign);
      };
      const firstLegOk = !anchorDir || matchesDir(p1, naturalElbow, anchorDir);
      // Arrival should continue in the OPPOSITE direction of attachDir's own
      // outward normal (inward, toward the real endpoint) — same convention
      // as the A* hint bias's sign fix above.
      const lastLegOk = !attachDir || matchesDir(naturalElbow, p2, [-attachDir[0], -attachDir[1]]);

      if (firstLegOk && lastLegOk) {
        pts = [p1, naturalElbow, p2];
      } else {
        // Natural elbow departs/arrives the wrong way — fall back to fixed
        // lead-out/lead-in stub segments in the correct direction, without
        // which firstMode was computed but never consulted (below), so the
        // elbow shape came from lastMode alone: a line could ride back along
        // its own source box's edge, and only the *axis* (not the side) of
        // its final approach into the target was guaranteed.
        const stubLength = cardinalStubLengthFor(req, this._resolvedGridResolution());
        // Same two-step clamp as _applyCardinalStubs (grid/smart) — edge
        // first, then shorten either stub that would land past the OTHER
        // stub's own resolved position (see _noOvershootStub).
        const anchorFull = anchorDir ? this._clampStubLength(stubLength, anchorDir, p1) : stubLength;
        const attachFull = attachDir ? this._clampStubLength(stubLength, attachDir, p2) : stubLength;
        const p1sFull = anchorDir ? [x1 + anchorDir[0]*anchorFull, y1 + anchorDir[1]*anchorFull] : p1;
        const p2sFull = attachDir ? [x2 + attachDir[0]*attachFull, y2 + attachDir[1]*attachFull] : p2;
        const anchorStubLen = anchorDir ? this._noOvershootStub(anchorFull, anchorDir, p1, p2sFull) : stubLength;
        const attachStubLen = attachDir ? this._noOvershootStub(attachFull, attachDir, p2, p1sFull) : stubLength;
        const p1s = anchorDir ? [x1 + anchorDir[0]*anchorStubLen, y1 + anchorDir[1]*anchorStubLen] : p1;
        const p2s = attachDir ? [x2 + attachDir[0]*attachStubLen, y2 + attachDir[1]*attachStubLen] : p2;

        // There are only two possible single-bend elbows connecting p1s to
        // p2s — bend at (p2s.x, p1s.y) or at (p1s.x, p2s.y). Bend continues
        // the departure stub's own axis first (if present), else arrives via
        // the arrival stub's axis last — same convention the lastMode-only
        // logic above used, just correctly directional now.
        const elbowA = [p2s[0], p1s[1]]; // p1s -> elbowA is horizontal
        const elbowB = [p1s[0], p2s[1]]; // p1s -> elbowB is vertical
        let elbow = anchorDir
          ? (anchorDir[0] !== 0 ? elbowA : elbowB)
          : (attachDir[0] !== 0 ? elbowB : elbowA);

        // If p1s and p2s are already closer together (in the departure axis)
        // than stubLength pushed past, "continue the departure axis"
        // overshoots past the target and has to reverse back to reach it —
        // e.g. anchor_side:left with a target only slightly to the left:
        // continuing further left past a large stub, then reversing right,
        // is worse than just turning immediately. Swap elbows in that case.
        if (anchorDir) {
          const axisIsX = anchorDir[0] !== 0;
          const legDelta = axisIsX ? (elbow[0] - p1s[0]) : (elbow[1] - p1s[1]);
          const wantSign = axisIsX ? anchorDir[0] : anchorDir[1];
          if (legDelta !== 0 && Math.sign(legDelta) !== Math.sign(wantSign)) {
            elbow = elbow === elbowA ? elbowB : elbowA;
          }
        } else if (attachDir) {
          // Symmetric check for the attachDir-only case: the elbow->p2s leg
          // should move in the direction attachDir's fixed final stub will
          // then continue (inward, opposite attachDir's own outward normal)
          // — else the path arrives at the elbow already past p2s and has
          // to reverse into the fixed stub.
          const axisIsX = attachDir[0] !== 0;
          const legDelta = axisIsX ? (p2s[0] - elbow[0]) : (p2s[1] - elbow[1]);
          const wantSign = axisIsX ? -attachDir[0] : -attachDir[1];
          if (legDelta !== 0 && Math.sign(legDelta) !== Math.sign(wantSign)) {
            elbow = elbow === elbowA ? elbowB : elbowA;
          }
        }

        // Degenerate-and-soft bailout: when p1s/p2s already share a
        // coordinate (e.g. this leg's start is already at its own
        // viewBox-edge stub limit, so its stub length collapsed to 0),
        // BOTH candidate elbows coincide with p1s or p2s — there is no
        // non-degenerate detour this construction can produce, and the
        // anti-reversal swap above has nothing real to swap to. For a
        // HARD anchor/attach (the true raw-anchor case), keep today's
        // behavior: the raw (possibly reversed) segment is still the
        // correct output, since the hard guarantee has nowhere else to
        // come from. For a SOFT source (this leg's start/end is already a
        // resolved stub, not a raw anchor — see anchorHard/attachHard
        // above), abandon this construction and fall through to the same
        // plain, direction-agnostic elbow used below when neither
        // anchorDir nor attachDir applies at all. Confirmed as the actual
        // fix for a real reversal: a corridor-approach leg whose start was
        // already stub-clamped to zero remaining room produced exactly
        // this degenerate shape, and the raw reversed 2-point segment fell
        // out untouched.
        const elbowDegenerate =
          (elbow[0] === p1s[0] && elbow[1] === p1s[1] && !anchorHard) ||
          (elbow[0] === p2s[0] && elbow[1] === p2s[1] && !attachHard);
        if (elbowDegenerate) {
          if (x1 === x2 || y1 === y2) {
            pts = [[x1, y1], [x2, y2]];
          } else if (lastMode === 'xy') {
            pts = [[x1, y1], [x2, y1], [x2, y2]];
          } else {
            pts = [[x1, y1], [x1, y2], [x2, y2]];
          }
        } else {
          const raw = [p1, p1s, elbow, p2s, p2];
          pts = raw.filter((pt,i) => i === 0 || pt[0] !== raw[i-1][0] || pt[1] !== raw[i-1][1]);
          if (pts.length < 2) pts = [p1, p2];
        }
      }
    } else if (x1 === x2 || y1 === y2) {
      pts = [[x1,y1],[x2,y2]];
    } else {
      // We honor lastMode for the final segment orientation.
      // lastMode = 'xy' => final segment is along Y (because order x then y)
      // lastMode = 'yx' => final segment is along X.
      if (lastMode === 'xy') {
        // Final vertical => elbow shares x2, start y1
        pts = [[x1,y1],[x2,y1],[x2,y2]];
      } else {
        // lastMode === 'yx' final horizontal => elbow shares y2, start x1
        pts = [[x1,y1],[x1,y2],[x2,y2]];
      }
      // If explicit first hint conflicts, we could insert an intermediate elbow (optional)
      // For now, we accept 3-point L shape determined by lastMode.
    }
    const d = this._polylineToPath(pts);
    return {
      d,
      pts,
      meta: {
        strategy: 'manhattan-basic',
        cost: this._costSimple(pts),
        segments: pts.length - 1,
        bends: Math.max(0, pts.length - 2),
        hint: {
          first: req.modeHint,
            last: req.modeHintLast,
          sourceFirst: req._hintSourceFirst,
          sourceLast: req._hintSourceLast
        }
      }
    };
  }

  _polylineToPath(pts) {
    if (!pts.length) return '';
    let p = `M${pts[0][0]},${pts[0][1]}`;
    for (let i=1;i<pts.length;i++) {
      p += ` L${pts[i][0]},${pts[i][1]}`;
    }
    return p;
  }

  _costSimple(pts) {
    let dist = 0;
    for (let i=1;i<pts.length;i++) {
      const dx = pts[i][0]-pts[i-1][0];
      const dy = pts[i][1]-pts[i-1][1];
      dist += Math.abs(dx)+Math.abs(dy);
    }
    const bends = Math.max(0, pts.length-2);
    const bendWeight = (this.config?.cost_defaults?.bend ?? 10);
    return dist + bends * bendWeight;
  }

  _costComposite(pts, bendsWeight, proximityWeight, proximityPenalty, channelDelta = 0) {
    // distance + bendsWeight*bends + proximityWeight*penalty
    let dist = 0;
    for (let i=1;i<pts.length;i++) {
      dist += Math.abs(pts[i][0]-pts[i-1][0]) + Math.abs(pts[i][1]-pts[i-1][1]);
    }
    const bends = Math.max(0, pts.length - 2);
    return dist + bends * bendsWeight + proximityPenalty * proximityWeight + channelDelta;
  }

  _segmentProximityPenalty(pts, clearance, proximity, proximityWeightRaw) {
    if (!proximity || !this._obstacles.length) return { penalty: 0, detail: [] };
    const band = clearance + proximity;
    let total = 0;
    const detail = [];
    for (let i=1;i<pts.length;i++) {
      const a = pts[i-1], b = pts[i];
      const segPenalty = this._nearestObstacleBandOverlap(a, b, band);
      if (segPenalty > 0) {
        total += segPenalty;
        detail.push({ i, segPenalty });
      }
    }
    return { penalty: total, detail };
  }

  /**
   * Total crossing-avoidance penalty for a FINISHED candidate polyline,
   * counting genuine perpendicular crossings against every OTHER line's
   * registered segments (`this._crossings`) — the post-hoc counterpart to
   * `_buildCrossingCostGrid`'s per-cell A* search bias, weighted by the same
   * `crossing_avoid_bias`. Needed because a route's FINAL reported
   * `meta.cost` (via `_costComposite`) never included this signal: the
   * search-time bias can steer an individual leg's shape away from a
   * crossing when there's room to maneuver, but a corridor "ride this
   * trunk" leg's endpoints are fixed by the trunk itself, so the search often
   * has no alternative shape to choose — and even when it does, the
   * penalty it paid during search was never carried into the final cost
   * used to compare WHOLE CANDIDATE ROUTES against each other (e.g.
   * computePath's corridor-vs-plain, or solo-trunk-A-vs-solo-trunk-B,
   * comparisons). Confirmed as a real bug: a solo-trunk candidate with two
   * genuine line crossings won a cost comparison against a same-length
   * alternative with only one, purely because crossings weren't part of
   * either candidate's compared cost at all.
   *
   * No bundle-mate exemption is needed here (unlike _buildCrossingCostGrid,
   * which steers a whole leg's shape and must not repel true bundle-mates
   * apart) — mates run PARALLEL along a shared trunk lane, and this counts
   * only genuine PERPENDICULAR crossings, so a parallel bundled run can
   * never register as one regardless of membership.
   * Weighted by `cost_defaults.crossing` (default 50), deliberately its OWN
   * constant rather than reusing `crossing_avoid_bias` (the A* search's
   * per-cell steering bias, default 4): that value is tuned to nudge a
   * search that still has room to maneuver, not to meaningfully separate
   * two already-finished ROUTES in a whole-candidate cost comparison —
   * confirmed too weak for that job in the field (a real crossing-count
   * difference of 2 vs 1 moved the comparison by barely 8 units, dwarfed by
   * a much larger corridor-discount gap between the two candidates). A
   * crossing is a discrete, countable defect (this or that many, not a
   * function of how many grid cells wide it happens to render at whatever
   * resolution), so this counts real geometric intersections directly,
   * independent of grid_resolution.
   * @param {number[][]} pts
   * @param {string} askingLineId - never penalize a line for crossing its own registered segments
   * @returns {number} pre-weighted penalty, added directly to a cost total (not multiplied further)
   * @private
   */
  _segmentCrossingPenalty(pts, askingLineId) {
    if (!this._crossingAvoidEnabled || !this._crossings.length) return 0;
    const weight = Number(this.config?.cost_defaults?.crossing ?? 50);
    let penalty = 0;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const vertical = a[0] === b[0];
      if (!vertical && a[1] !== b[1]) continue; // not axis-aligned; shouldn't happen, skip defensively
      const lo = vertical ? Math.min(a[1], b[1]) : Math.min(a[0], b[0]);
      const hi = vertical ? Math.max(a[1], b[1]) : Math.max(a[0], b[0]);
      for (const seg of this._crossings) {
        if (seg.lineId === askingLineId) continue;
        const segVertical = seg.direction === 'vertical';
        if (segVertical === vertical) continue; // parallel; can't perpendicular-cross
        const fixedCoord = vertical ? a[0] : a[1];
        const segLo = segVertical ? seg.y1 : seg.x1;
        const segHi = segVertical ? seg.y2 : seg.x2;
        const segFixed = segVertical ? seg.x1 : seg.y1;
        if (segFixed > lo && segFixed < hi && fixedCoord > segLo && fixedCoord < segHi) {
          penalty += weight;
        }
      }
    }
    return penalty;
  }

  /**
   * True if the axis-aligned segment a->b passes through the interior of
   * any registered obstacle (strict overlap, not merely touching an edge —
   * a segment that only grazes an obstacle's boundary isn't cutting
   * through its rendered area). Used to gate the splice-boundary reversal
   * collapse above: dropping a stub's landing point is only safe when the
   * resulting direct segment doesn't newly cut through an obstacle the
   * original (reversing) path happened to avoid via that very point.
   * @param {number[]} a
   * @param {number[]} b
   * @returns {boolean}
   * @private
   */
  _segmentCrossesObstacle(a, b) {
    if (!this._obstacles.length) return false;
    const vertical = a[0] === b[0];
    if (!vertical && a[1] !== b[1]) return false; // only axis-aligned segments are checked
    const x1 = Math.min(a[0], b[0]), x2 = Math.max(a[0], b[0]);
    const y1 = Math.min(a[1], b[1]), y2 = Math.max(a[1], b[1]);
    for (const ob of this._obstacles) {
      if (vertical) {
        if (a[0] <= ob.x1 || a[0] >= ob.x2) continue;
        if (y2 > ob.y1 && y1 < ob.y2) return true;
      } else {
        if (a[1] <= ob.y1 || a[1] >= ob.y2) continue;
        if (x2 > ob.x1 && x1 < ob.x2) return true;
      }
    }
    return false;
  }

  /**
   * True if point `p` sits strictly inside any registered obstacle
   * (touching a boundary edge doesn't count — matches
   * _segmentCrossesObstacle's own convention). Used to reject a discovered
   * trunk's own entry/exit boundary as a valid corridor candidate:
   * _channelCrossingPoints computes lane-offset positions with zero
   * obstacle awareness (the cross-axis offset is a pure function of lane
   * count/spacing, never checked against what's actually there), and
   * _computeGrid's own goal-cell exemption — built for "a route's TRUE
   * anchor/attach point legitimately sits on its own control's obstacle
   * boundary" — gets applied uniformly to every leg's goal, including an
   * intermediate trunk-crossing point that has nothing to do with the
   * obstacle it happens to land inside. Confirmed as a real, reported
   * defect: a trunk's own lane offset placed a line's crossing point
   * strictly inside a completely unrelated control's box, and the route
   * cut straight through it instead of failing to reach an invalid target.
   * @param {number[]} p
   * @returns {boolean}
   * @private
   */
  _pointInsideObstacle(p) {
    for (const ob of this._obstacles) {
      if (p[0] > ob.x1 && p[0] < ob.x2 && p[1] > ob.y1 && p[1] < ob.y2) return true;
    }
    return false;
  }

  _nearestObstacleBandOverlap(a, b, band) {
    // Axis-aligned segments only
    const vertical = a[0] === b[0];
    const x1 = Math.min(a[0], b[0]);
    const x2 = Math.max(a[0], b[0]);
    const y1 = Math.min(a[1], b[1]);
    const y2 = Math.max(a[1], b[1]);
    let worst = 0;
    for (const ob of this._obstacles) {
      // Quick reject bounding box enlarged by band
      if (x2 < ob.x1 - band || x1 > ob.x2 + band || y2 < ob.y1 - band || y1 > ob.y2 + band) continue;
      let d;
      if (vertical) {
        // Distance from line x=a.x to obstacle horizontal span
        if (a[0] < ob.x1) d = ob.x1 - a[0];
        else if (a[0] > ob.x2) d = a[0] - ob.x2;
        else d = 0;
      } else {
        if (a[1] < ob.y1) d = ob.y1 - a[1];
        else if (a[1] > ob.y2) d = a[1] - ob.y2;
        else d = 0;
      }
      if (d < band) {
        const p = (band - d); // linear penalty (could square later)
        if (p > worst) worst = p;
      }
    }
    return worst;
  }

  /**
   * Normalize channel configurations
   * Supports three channel types: bundling (default), avoiding, waypoint
   * @param {Array} list - Array of channel config objects
   * @returns {Array} Normalized channel objects with validated types
   * @private
   */
  /**
   * Normalize channel configurations from object or array format
   * New model: mode (prefer|avoid|force) replaces type (bundling|avoiding|waypoint)
   * @param {Object|Array} channelsInput - Channels as object {id: config} or array
   * @returns {Array} Normalized channel objects with mode field
   * @private
   */
  _normalizeChannels(channelsInput) {
    // Handle both object format {channel_id: {bounds, mode}} and legacy array format
    let list = [];

    if (!channelsInput) return [];

    if (Array.isArray(channelsInput)) {
      // Legacy array format: [{id, rect, type}]
      list = channelsInput;
    } else if (typeof channelsInput === 'object') {
      // New object format: {channel_id: {bounds, mode, direction}}
      list = Object.entries(channelsInput).map(([id, config]) => ({
        id,
        rect: config.bounds || config.rect,  // Support both 'bounds' and 'rect'
        mode: config.mode,  // 'prefer', 'avoid', or 'force'
        type: config.type,  // Legacy: 'bundling', 'avoiding', 'waypoint'
        direction: config.direction,  // 'horizontal', 'vertical', or 'auto'
        weight: config.weight,
        w: config.w
      }));
    }

    return list
      .filter(c => c && Array.isArray(c.rect) && c.rect.length === 4)
      .map(c => {
        const [x,y,w,h] = c.rect;

        // Normalize mode: new 'mode' field takes precedence, fallback to legacy 'type'
        let mode = c.mode;
        if (!mode && c.type) {
          // Backwards compatibility: map old type to new mode
          const typeToMode = {
            'bundling': 'prefer',
            'avoiding': 'avoid',
            'waypoint': 'force'
          };
          mode = typeToMode[c.type.toLowerCase()] || 'prefer';
        }
        mode = (mode || 'prefer').toLowerCase();

        // Validate mode
        if (!['prefer', 'avoid', 'force'].includes(mode)) {
          lcardsLog.warn(`[RouterCore] Invalid channel mode '${c.mode}' for channel '${c.id}', defaulting to 'prefer'`);
          mode = 'prefer';
        }

        // Determine direction: explicit or auto-detect from shape
        let direction = (c.direction || 'auto').toLowerCase();
        if (!['horizontal', 'vertical', 'auto'].includes(direction)) {
          direction = 'auto';
        }

        if (direction === 'auto') {
          // Auto-detect: wide = horizontal, tall = vertical
          direction = w >= h ? 'horizontal' : 'vertical';
        }

        return {
          id: c.id || `chan_${x}_${y}`,
          x1: x, y1: y, x2: x + w, y2: y + h,
          // `||` treats an explicit weight:0 as "not specified" and silently
          // substitutes the 0.5 default — a real, meaningful configuration
          // (reference this channel for bundling/observability, but exert
          // zero pull) was indistinguishable from omitting weight entirely.
          // ?? only falls through on null/undefined.
          weight: Number(c.weight ?? c.w ?? 0.5),
          mode,  // 'prefer', 'avoid', or 'force'
          direction,  // 'horizontal' or 'vertical'
          line_spacing: Number(c.line_spacing ?? 8)  // Gap between bundled lines
        };
      });
  }

  /**
   * Calculate channel influence on route cost — thin wrapper over
   * _corridorDelta for the existing "channel referenced by id" call
   * pattern (_computeGrid/_refineSmart's own post-hoc reporting). Kept
   * separate from _corridorDelta so those callers don't need to know
   * about corridors that aren't config-sourced channels (discovered
   * trunks, see _computeCorridorRouted) — they only ever report on what a
   * line's own req.channels explicitly named.
   * @param {Array} pts - Route points
   * @param {object} req - Route request
   * @returns {object} Channel delta with coverage stats and waypoint tracking
   * @private
   */
  _channelDelta(pts, req) {
    if (!this._channels.length || !req.channels || !req.channels.length) {
      return { delta: 0, inside: 0, outside: 0, coverage: 0, forcedOutside: false };
    }
    // Filter to requested channel IDs (ignore unknown)
    const chanSet = new Set(req.channels);
    const chans = this._channels.filter(c => chanSet.has(c.id));
    return this._corridorDelta(pts, chans, req.id);
  }

  /**
   * Calculate corridor influence on route cost — supports bundling
   * (prefer), avoiding, force, and (via mode:'prefer') discovered trunks,
   * for an EXPLICIT corridor list rather than one derived from
   * this._channels ∩ req.channels. This is what makes a discovered trunk
   * (never present in this._channels, so invisible to _channelDelta)
   * visible to the cost-comparison decision in computePath.
   * @param {Array} pts - Route points
   * @param {Array} chans - Normalized channel/trunk objects to measure against
   * @param {string} [routeId] - for debug logging only
   * @returns {object} Channel delta with coverage stats
   * @private
   */
  _corridorDelta(pts, chans, routeId = null) {
    if (!chans.length) return { delta: 0, inside: 0, outside: 0, coverage: 0, forcedOutside: false };

    let inside = 0;
    let outside = 0;

    // Measure coverage for each segment
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i-1], b = pts[i];
      const segLen = Math.abs(a[0]-b[0]) + Math.abs(a[1]-b[1]);
      if (segLen === 0) continue;

      // Midpoint (orthogonal segments, so use center)
      const mx = (a[0] + b[0]) / 2;
      const my = (a[1] + b[1]) / 2;

      // Check if segment is inside any requested channel
      const inChan = chans.some(c => mx >= c.x1 && mx <= c.x2 && my >= c.y1 && my <= c.y2);
      if (inChan) inside += segLen;
      else outside += segLen;
    }

    const coverage = inside / (inside + outside || 1);
    let delta = 0;
    let forcedOutside = false;

    // Apply channel influence based on each channel's mode
    for (const chan of chans) {
      const chanInside = pts.slice(1).reduce((sum, pt, i) => {
        const prev = pts[i];
        const segLen = Math.abs(pt[0] - prev[0]) + Math.abs(pt[1] - prev[1]);
        const mx = (prev[0] + pt[0]) / 2;
        const my = (prev[1] + pt[1]) / 2;
        return sum + (mx >= chan.x1 && mx <= chan.x2 && my >= chan.y1 && my <= chan.y2 ? segLen : 0);
      }, 0);

      if (chan.mode === 'prefer') {
        // Reward routing through channel (subtract cost)
        delta -= chanInside * chan.weight;
      } else if (chan.mode === 'avoid') {
        // Penalize routing through channel
        delta += chanInside * chan.weight * this._channelAvoidMultiplier;
      } else if (chan.mode === 'force') {
        // High penalty if channel is missed
        if (chanInside === 0) {
          delta += this._channelForcePenalty;
          forcedOutside = true;
          lcardsLog.debug(`[RouterCore] Route '${routeId}' missed forced channel '${chan.id}'`);
        } else {
          // Reward for passing through
          delta -= chanInside * chan.weight;
        }
      }
    }


    return {
      delta,
      inside,
      outside,
      coverage,
      forcedOutside
    };
  }

  _refineSmart(req, gridBase) {
    if (!gridBase || !Array.isArray(gridBase.pts) || gridBase.pts.length < 2) return gridBase;
    const bendW = (this.config?.cost_defaults?.bend ?? 10);
    const proxW = (this.config?.cost_defaults?.proximity ?? 4);
    const { penalty: penaltyBefore } = this._segmentProximityPenalty(gridBase.pts, req.clearance, req.proximity, proxW);
    let bestPts = gridBase.pts.slice();
    let bestPenalty = penaltyBefore;
    let bestCost = this._costComposite(bestPts, bendW, proxW, bestPenalty);
    let detoursTried = 0;
    let detoursAccepted = 0;

    if (req.proximity > 0 && bestPts.length > 2) {
      // Try shifting each elbow (not endpoints)
      const span = req.smart.detourSpan;
      const maxExtraBends = req.smart.maxExtraBends;
      // req.smart.minImprovement (camelCase — see buildRouteRequest's smart
      // block). This read used snake_case for years, yielding undefined —
      // NaN in the acceptance comparison below — so smart refinement never
      // accepted a single detour and all four smart_* knobs were inert.
      const minImprove = req.smart.minImprovement;
      for (let i=1;i<bestPts.length-1;i++) {
        const elbow = bestPts[i];
        const prev = bestPts[i-1];
        const next = bestPts[i+1];
        const verticalIn = prev[0] === elbow[0]; // incoming dir
        const horizontalOut = elbow[1] === next[1]; // outgoing dir
        // Only elbows where both dirs present (true elbow)
        if ((verticalIn && horizontalOut) || (!verticalIn && !horizontalOut)) {
          // Determine orthogonal shift axis (shift elbow along one axis to widen clearance)
          const candidates = [];
          if (verticalIn && horizontalOut) {
            // elbow shape └ or ┌ etc. shift in a box: along x and y
            candidates.push([elbow[0] + span, elbow[1]]);
            candidates.push([elbow[0] - span, elbow[1]]);
            candidates.push([elbow[0], elbow[1] + span]);
            candidates.push([elbow[0], elbow[1] - span]);
          } else {
            candidates.push([elbow[0] + span, elbow[1]]);
            candidates.push([elbow[0] - span, elbow[1]]);
            candidates.push([elbow[0], elbow[1] + span]);
            candidates.push([elbow[0], elbow[1] - span]);
          }
          let tries = 0;
          for (const c of candidates) {
            if (tries++ >= req.smart.maxDetoursPerElbow) break;
            detoursTried++;
            const newPts = bestPts.slice();
            newPts[i] = c;
            // Prevent duplicate successive collinear points (basic)
            const compact = this._compactPolyline(newPts);
            if (compact.length - bestPts.length > maxExtraBends) continue;
            const { penalty: p2 } = this._segmentProximityPenalty(compact, req.clearance, req.proximity, proxW);
            const cost2 = this._costComposite(compact, bendW, proxW, p2);
            if (cost2 + minImprove <= bestCost) {
              bestCost = cost2;
              bestPts = compact;
              bestPenalty = p2;
              detoursAccepted++;
            }
          }
        }
      }
    }

    // Reporting only — see _computeGrid's identical comment. Prefer/avoid
    // geometry is already decided by the A* search's per-cell cost bias
    // (this smart pass's gridBase came from a _computeGrid call that already
    // applied it); force channels never reach this method (computePath
    // routes them through _computeForceRouted instead).
    const channelInfo = this._channelDelta(bestPts, req);
    bestCost = this._costComposite(bestPts, bendW, proxW, bestPenalty, channelInfo.delta);
    const d = this._polylineToPath(bestPts);
    const baseMeta = gridBase.meta || {};
    baseMeta.strategy = 'smart';
    baseMeta.cost = bestCost;
    baseMeta.bends = Math.max(0, bestPts.length - 2);
    baseMeta.segments = bestPts.length - 1;
    baseMeta.smart = {
      penaltyBefore,
      penaltyAfter: bestPenalty,
      detoursTried,
      detoursAccepted
    };
    if (req.channels?.length) {
      baseMeta.channel = {
        mode: channelInfo.mode,
        insidePx: channelInfo.inside,
        outsidePx: channelInfo.outside,
        coveragePct: Number((channelInfo.coverage*100).toFixed(1)),
        deltaCost: channelInfo.delta,
        forcedOutside: channelInfo.forcedOutside
      };
    }
    return { d, pts: bestPts, meta: baseMeta };
  }

  /**
   * String key for a point, used to test set membership by coordinate
   * rather than by object identity or array index.
   * @param {number[]} p
   * @private
   */
  _ptKey(p) {
    return p[0] + ',' + p[1];
  }

  /**
   * Structural backstop for _computeCorridorRouted: a chained route is
   * assembled from independently-pathfound legs, spliced together at
   * whatever point each leg's own construction chose as its boundary (see
   * _pushBundledApproachLegs / the k===0 and last-leg hint downgrades).
   * This session found and fixed several distinct mechanisms that could
   * make two adjacent legs meet at a splice point in a way that reverses
   * direction on the same axis — each one a different root cause, in a
   * different function, discovered only via real MSD configs (most
   * recently via a higher-line-count stress scenario, after the earlier,
   * hint-source-string-based version of this same backstop shipped:
   * that version wrongly treated a 'channel_axis'-hinted interior 'mid'
   * point from _pushBundledApproachLegs as sacred, even though that hint
   * only steers the leg's own search direction — the point itself is
   * explicitly documented as not a real edge-crossing, and missed exactly
   * that reversal shape). Rather than assume no further mechanism exists,
   * this collapses any reversal found at a point that isn't one of this
   * chain's real crossings — `mandatoryPoints`, built in
   * _computeCorridorRouted directly from each channel's own entry/exit
   * and the whole chain's own two ends, by coordinate, independent of
   * which hint string a leg touching that point happens to carry — mirroring
   * computePath's own outer stub-splice collapse (including its
   * obstacle-crossing guard: dropping the splice point must never trade a
   * visible reversal for cutting through an obstacle the detour via that
   * point was the only reason avoided).
   * @param {number[][]} pts
   * @param {Set<string>} mandatoryPoints
   * @returns {number[][]}
   * @private
   */
  _collapseSoftLegReversals(pts, mandatoryPoints) {
    if (pts.length <= 2) return pts;
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = out[out.length - 1];
      const b = pts[i];
      const c = pts[i + 1];
      if (!mandatoryPoints.has(this._ptKey(b))) {
        const sameX = a[0] === b[0] && b[0] === c[0];
        const sameY = a[1] === b[1] && b[1] === c[1];
        if (sameX || sameY) {
          const d1 = sameX ? (b[1] - a[1]) : (b[0] - a[0]);
          const d2 = sameX ? (c[1] - b[1]) : (c[0] - b[0]);
          if (d1 !== 0 && d2 !== 0 && Math.sign(d1) !== Math.sign(d2) && !this._segmentCrossesObstacle(a, c)) {
            continue; // drop b: a soft splice point that reversed direction
          }
        }
      }
      out.push(b);
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  _compactPolyline(pts) {
    if (pts.length <= 2) return pts;
    const out = [pts[0]];
    for (let i=1;i<pts.length-1;i++) {
      const a = out[out.length-1];
      const b = pts[i];
      const c = pts[i+1];
      const sameX = a[0] === b[0] && b[0] === c[0];
      const sameY = a[1] === b[1] && b[1] === c[1];
      if (sameX || sameY) {
        // Collinear on this axis — but only drop b if a->b->c is genuinely
        // redundant (monotonic or stationary). If the two legs run in
        // OPPOSITE directions along that axis, b marks a real reversal —
        // dropping it wouldn't just tidy the polyline, it would silently
        // erase the fact that a reversal happened at all. Confirmed via a
        // force-channel chain whose mandatory crossing point got compacted
        // away this way, making the rendered path skip the channel entirely
        // while still reporting it as "visited" internally.
        const d1 = sameX ? (b[1] - a[1]) : (b[0] - a[0]);
        const d2 = sameX ? (c[1] - b[1]) : (c[0] - b[0]);
        if (d1 === 0 || d2 === 0 || Math.sign(d1) === Math.sign(d2)) continue;
      }
      out.push(b);
    }
    out.push(pts[pts.length-1]);
    return out;
  }

  /**
   * Shortest distance from point `p` to any OTHER line's registered
   * axis-aligned segment (`this._crossings`), used to keep corner-rounding
   * from bulging into another line's rendered path — see
   * _applyCornerRounding's own comment for why this is needed (rounding is
   * otherwise entirely blind to other lines' geometry). Distance to an
   * axis-aligned segment is the perpendicular distance when `p` projects
   * onto the segment's span, else the distance to the nearer endpoint —
   * the standard point-to-segment formula, specialized for
   * horizontal/vertical segments only (every registered segment is one or
   * the other).
   * @param {number[]} p
   * @param {string} askingLineId - never measure against a line's own segments
   * @returns {number} Infinity if no other segments are registered
   * @private
   */
  _distanceToNearestOtherLineSegment(p, askingLineId) {
    if (!this._crossings.length) return Infinity;
    let best = Infinity;
    for (const seg of this._crossings) {
      if (seg.lineId === askingLineId) continue;
      let dx, dy;
      if (seg.direction === 'horizontal') {
        dx = p[0] < seg.x1 ? seg.x1 - p[0] : p[0] > seg.x2 ? p[0] - seg.x2 : 0;
        dy = Math.abs(p[1] - seg.y1);
      } else {
        dy = p[1] < seg.y1 ? seg.y1 - p[1] : p[1] > seg.y2 ? p[1] - seg.y2 : 0;
        dx = Math.abs(p[0] - seg.x1);
      }
      const d = Math.hypot(dx, dy);
      if (d < best) best = d;
    }
    return best;
  }

  _applyCornerRounding(routeResult, radiusGlobal, routeId = null) {
    const pts = routeResult.pts;
    if (!Array.isArray(pts) || pts.length < 3) {
      return null;
    }
    const arcMin = 1;
    let arcCount = 0;
    let totalTrim = 0;
    const parts = [];
    let lastOut = pts[0].slice();
    parts.push(`M${lastOut[0]},${lastOut[1]}`);

    // Pre-calculate radii for all corners to detect conflicts
    const cornerRadii = [];
    for (let i = 1; i < pts.length - 1; i++) {
      const pPrev = pts[i - 1];
      const p = pts[i];
      const pNext = pts[i + 1];
      const vIn = [p[0] - pPrev[0], p[1] - pPrev[1]];
      const vOut = [pNext[0] - p[0], pNext[1] - p[1]];
      const lenIn = Math.sqrt(vIn[0] * vIn[0] + vIn[1] * vIn[1]);
      const lenOut = Math.sqrt(vOut[0] * vOut[0] + vOut[1] * vOut[1]);
      // A point where vIn/vOut point in the exact same direction (cross=0,
      // dot>0) isn't a real corner — it's a straight pass-through (e.g. a
      // collinear waypoint left over from stitching legs together) that
      // the render loop below already skips (its tangentDist naturally
      // goes to 0). Without this check it still gets a nonzero pre-calc
      // radius here purely from lenIn/lenOut, which then falsely competes
      // with a genuinely adjacent real corner for the same shared segment
      // in the "adjust consecutive corners" step right below — shrinking
      // that real corner's radius for no reason, since the degenerate
      // point never actually consumes any of that segment itself.
      // Confirmed as a real bug: a channel-bundling nudge point immediately
      // after a collinear stub segment shrank the next real corner from 4
      // to 2.6px, compounding an already-too-short segment.
      const cross = vIn[0] * vOut[1] - vIn[1] * vOut[0];
      const dot = vIn[0] * vOut[0] + vIn[1] * vOut[1];
      const isStraightThrough = cross === 0 && dot > 0;
      let r = isStraightThrough ? 0 : Math.min(radiusGlobal, lenIn / 2, lenOut / 2);
      // Clamp against bulging into another line's own registered path.
      // Corner rounding is otherwise entirely blind to other lines'
      // geometry — the underlying straight polyline can have a real (if
      // small) gap to another line, yet still round into it, because
      // rounding never re-checks anything once the route's own shape is
      // decided. Confirmed as a real bug via a live user report and a
      // flattened-arc intersection check: two lines' straight polylines
      // only grazed a shared corner point (zero real crossing), yet their
      // independently-rounded corners — each shrunk small by short
      // adjacent segments, so both already tightly packed near that same
      // point — bulged into each other, producing a crossing that didn't
      // exist in the underlying route at all.
      //
      // For an ORTHOGONAL corner (the overwhelming majority in this
      // router), the fillet's center sits at a FIXED direction from the
      // sharp corner point, independent of radius: `center = p +
      // radius*(vOutUnit - vInUnit)` (magnitude sqrt(2), since perpendicular
      // unit vectors) — the standard construction (tangent points sit
      // exactly `radius` from the corner along each leg; the center is
      // equidistant `radius` from both, offset perpendicular to each line).
      // Every point on the actual SWEPT arc (the 90° quarter nearest the
      // corner) is then within `radius` of that center. This lets the
      // clearance check target the arc's OWN true position — a circle of
      // `radius` centered at `center` — instead of conservatively assuming
      // the whole arc could be anywhere within `radius` of the sharp
      // corner point itself (the first version of this fix): that
      // assumption is safe but often needlessly tight, since a corner can
      // curve AWAY from a nearby line just as easily as toward it, and
      // still forced a tiny radius even when the arc's own real sweep
      // never came remotely close. Confirmed as a real case: a corner
      // curving away from a line only 8 units away (by raw point distance)
      // was clamped to ~7 despite the true arc never leaving a region ~1
      // unit from where it started, when it had genuine room for a much
      // larger, requested radius.
      //
      // Binary search (not a closed form) because the target function —
      // distance from a moving center to the nearest OTHER line's nearest
      // segment, minus the trial radius — has a kink wherever the nearest
      // segment changes or the center's projection crosses a segment
      // endpoint; 20 iterations is comfortably enough precision for a
      // visual radius and cheap enough to run per corner. r=0 (a sharp,
      // un-rounded corner) is always trivially safe as the search floor —
      // zero radius means zero arc extent, regardless of raw clearance.
      if (!isStraightThrough && routeId) {
        const isOrthCorner = (vIn[0] === 0 || vIn[1] === 0) && (vOut[0] === 0 || vOut[1] === 0) &&
          !(vIn[0] === 0 && vIn[1] === 0) && !(vOut[0] === 0 && vOut[1] === 0) &&
          !(Math.sign(vIn[0]) === Math.sign(vOut[0]) && vIn[0] !== 0) &&
          !(Math.sign(vIn[1]) === Math.sign(vOut[1]) && vIn[1] !== 0);
        if (isOrthCorner && lenIn > 0 && lenOut > 0) {
          const vInUnit = [vIn[0] / lenIn, vIn[1] / lenIn];
          const vOutUnit = [vOut[0] / lenOut, vOut[1] / lenOut];
          const offsetDir = [vOutUnit[0] - vInUnit[0], vOutUnit[1] - vInUnit[1]];
          let lo = 0, hi = r;
          for (let iter = 0; iter < 20; iter++) {
            const mid = (lo + hi) / 2;
            const center = [p[0] + mid * offsetDir[0], p[1] + mid * offsetDir[1]];
            const clearance = this._distanceToNearestOtherLineSegment(center, routeId);
            if (clearance - mid >= arcMin) lo = mid; else hi = mid;
          }
          r = lo;
        } else {
          // Non-orthogonal (rare in this Manhattan-style router — not
          // rigorously covered by the fillet-center proof above, whose
          // tangentDist formula depends on the corner's own angle) falls
          // back to the original, safe-but-conservative point-distance
          // bound instead.
          const clearance = this._distanceToNearestOtherLineSegment(p, routeId);
          if (clearance < r) r = Math.max(0, clearance - arcMin);
        }
      }
      cornerRadii.push({ index: i, radius: r, lenIn, lenOut });
    }

    // Adjust radii if consecutive corners have overlapping trims
    for (let i = 0; i < cornerRadii.length - 1; i++) {
      const curr = cornerRadii[i];
      const next = cornerRadii[i + 1];

      // Check if these corners share a segment (consecutive in point array)
      if (next.index === curr.index + 1) {
        const segmentLength = curr.lenOut; // Same as next.lenIn
        const totalTrim = curr.radius + next.radius;

        // Check if trim points overlap or leave insufficient space
        // Trigger when combined trims exceed 70% of segment (leaving less than 30% for the line)
        if (totalTrim >= segmentLength * 0.70) {
          // Reduce both radii proportionally to leave a gap — normally 35%
          // (use 65% of the segment), reserved so two GENUINELY separate
          // corners that just happen to be moderately close still show a
          // visibly distinct straight bit between them. For a very short
          // shared segment (a handful of px — below this same function's
          // own arcMin-based floor for a meaningful corner at all), that
          // reasoning doesn't hold: there's no perceptibly "visible gap"
          // left at 35% vs 5% either way, and insisting on one anyway
          // forces BOTH radii below arcMin, rendering a sharp double-kink
          // instead of any rounding at all. This is exactly the shape of a
          // corridor-bundling nudge's own tiny cross-axis correction leg —
          // genuinely two ends of ONE transition, not two independently
          // competing corners — so use a much more generous 95% target
          // there instead, letting a small but real, visible curve render.
          const target = segmentLength <= arcMin * 4 ? 0.95 : 0.65;
          const scale = (segmentLength * target) / totalTrim;
          curr.radius *= scale;
          next.radius *= scale;
        }
      }
    }

    for (let i = 1; i < pts.length - 1; i++) {
      const pPrev = pts[i - 1];
      const p = pts[i];
      const pNext = pts[i + 1];
      const vIn = [p[0] - pPrev[0], p[1] - pPrev[1]];
      const vOut = [pNext[0] - p[0], pNext[1] - p[1]];

      // Get pre-calculated (possibly adjusted) radius for this corner
      const cornerData = cornerRadii[i - 1];
      let r = cornerData.radius;
      const lenInNorm = cornerData.lenIn;
      const lenOutNorm = cornerData.lenOut;

      // Check if orthogonal (for special handling)
      const isOrth = (vIn[0] === 0 || vIn[1] === 0) && (vOut[0] === 0 || vOut[1] === 0) && !(vIn[0] === 0 && vIn[1] === 0) && !(vOut[0] === 0 && vOut[1] === 0) && !(Math.sign(vIn[0]) === Math.sign(vOut[0]) && vIn[0] !== 0) && !(Math.sign(vIn[1]) === Math.sign(vOut[1]) && vIn[1] !== 0);

      // Handle non-orthogonal corners with general angle rounding
      if (!isOrth) {
        if (lenInNorm < 0.01 || lenOutNorm < 0.01) {
          // Degenerate case - just draw to corner
          if (p[0] !== lastOut[0] || p[1] !== lastOut[1]) {
            parts.push(`L${p[0]},${p[1]}`);
            lastOut = p.slice();
          }
          continue;
        }

        const uIn = [vIn[0] / lenInNorm, vIn[1] / lenInNorm];
        const uOut = [vOut[0] / lenOutNorm, vOut[1] / lenOutNorm];

        if (r < arcMin) {
          if (p[0] !== lastOut[0] || p[1] !== lastOut[1]) {
            parts.push(`L${p[0]},${p[1]}`);
            lastOut = p.slice();
          }
          continue;
        }

        // Calculate angle between directions (incoming reversed to forward direction)
        const dot = (-uIn[0]) * uOut[0] + (-uIn[1]) * uOut[1];
        const angleRad = Math.acos(Math.max(-1, Math.min(1, dot)));
        const halfAngle = angleRad / 2;

        // Distance from corner to tangent points along each line
        const tangentDist = r / Math.tan(halfAngle);

        // Clamp tangent distance to available segment length
        const maxTrimIn = Math.min(tangentDist, lenInNorm - 1);
        const maxTrimOut = Math.min(tangentDist, lenOutNorm - 1);
        const actualTrim = Math.min(maxTrimIn, maxTrimOut);

        // If trim is too small, skip arc
        if (actualTrim < arcMin) {
          if (p[0] !== lastOut[0] || p[1] !== lastOut[1]) {
            parts.push(`L${p[0]},${p[1]}`);
            lastOut = p.slice();
          }
          continue;
        }

        // Calculate actual arc radius that fits
        const actualRadius = actualTrim * Math.tan(halfAngle);

        // Tangent points
        const pInTrim = [p[0] - uIn[0] * actualTrim, p[1] - uIn[1] * actualTrim];
        const pOutTrim = [p[0] + uOut[0] * actualTrim, p[1] + uOut[1] * actualTrim];

        // Line to trimmed incoming point
        if (pInTrim[0] !== lastOut[0] || pInTrim[1] !== lastOut[1]) {
          parts.push(`L${pInTrim[0]},${pInTrim[1]}`);
        }

        // Determine sweep direction using cross product
        const cross = vIn[0] * vOut[1] - vIn[1] * vOut[0];
        const sweep = cross > 0 ? 1 : 0;

        const largeArc = 0; // Corner rounding always uses small arc

        // Arc to trimmed outgoing point
        parts.push(`A${actualRadius},${actualRadius} 0 ${largeArc} ${sweep} ${pOutTrim[0]},${pOutTrim[1]}`);
        totalTrim += 2 * actualTrim;
        arcCount++;
        lastOut = pOutTrim;
        continue;
      }
      // For orthogonal segments - use pre-calculated radius
      if (r < arcMin) {
        if (p[0] !== lastOut[0] || p[1] !== lastOut[1]) {
          parts.push(`L${p[0]},${p[1]}`);
          lastOut = p.slice();
        }
        continue;
      }
      // Trim points
      let pInTrim = p.slice();
      if (vIn[0] !== 0) {
        pInTrim[0] = p[0] - Math.sign(vIn[0]) * r;
      } else {
        pInTrim[1] = p[1] - Math.sign(vIn[1]) * r;
      }
      let pOutTrim = p.slice();
      if (vOut[0] !== 0) {
        pOutTrim[0] = p[0] + Math.sign(vOut[0]) * r;
      } else {
        pOutTrim[1] = p[1] + Math.sign(vOut[1]) * r;
      }
      // Line to trimmed incoming point
      if (pInTrim[0] !== lastOut[0] || pInTrim[1] !== lastOut[1]) {
        parts.push(`L${pInTrim[0]},${pInTrim[1]}`);
      }
      // Determine sweep flag (clockwise vs counter-clockwise) using z of 2D cross
      const cross = vIn[0] * vOut[1] - vIn[1] * vOut[0];
      const sweep = cross < 0 ? 0 : 1;
      // Use small arc (90°) => large-arc-flag = 0
      parts.push(`A${r},${r} 0 0 ${sweep} ${pOutTrim[0]},${pOutTrim[1]}`);
      totalTrim += 2 * r;
      arcCount++;
      lastOut = pOutTrim;
    }
    // Last point
    const pEnd = pts[pts.length - 1];
    if (pEnd[0] !== lastOut[0] || pEnd[1] !== lastOut[1]) {
      parts.push(`L${pEnd[0]},${pEnd[1]}`);
    }
    // If no arcs applied, skip
    if (!arcCount) {
      return null;
    }
    const newResult = {
      ...routeResult,
      d: parts.join(' '),
      meta: {
        ...routeResult.meta,
        arc: {
          count: arcCount,
          trimPx: Math.round(totalTrim)
        }
      }
    };
    return newResult;
  }

  /**
   * Replace sharp corners with a straight diagonal chamfer cut, sized and angled
   * like the elbow card's "diagonal-cap" corners (see
   * src/core/packs/components/elbows/index.js): at each orthogonal corner, the cut
   * length along the horizontal edge is `size * cos(angle)` and along the vertical
   * edge is `size * sin(angle)` — 45° gives a symmetric diagonal, 0°/90° collapses
   * onto one edge (no visible cut, i.e. "square"). Non-orthogonal corners (possible
   * with manual waypoints) fall back to a symmetric chamfer along the corner
   * bisector, ignoring angle.
   */
  _applyCornerBeveling(routeResult, sizeGlobal, angleDeg, routeId = null) {
    const pts = routeResult.pts;
    if (!Array.isArray(pts) || pts.length < 3) {
      return null;
    }
    const cutMin = 1;
    let cutCount = 0;
    let totalTrim = 0;
    const angleRad = (Number.isFinite(angleDeg) ? angleDeg : 45) * Math.PI / 180;
    const parts = [];
    let lastOut = pts[0].slice();
    parts.push(`M${lastOut[0]},${lastOut[1]}`);

    // Pre-calculate per-corner cut sizes (clamped to half-segment-length), with the
    // same consecutive-corner conflict scaling as _applyCornerRounding.
    const cornerSizes = [];
    for (let i = 1; i < pts.length - 1; i++) {
      const pPrev = pts[i - 1];
      const p = pts[i];
      const pNext = pts[i + 1];
      const lenIn = Math.hypot(p[0] - pPrev[0], p[1] - pPrev[1]);
      const lenOut = Math.hypot(pNext[0] - p[0], pNext[1] - p[1]);
      const size = Math.min(sizeGlobal, lenIn / 2, lenOut / 2);
      cornerSizes.push({ index: i, size, lenIn, lenOut });
    }
    for (let i = 0; i < cornerSizes.length - 1; i++) {
      const curr = cornerSizes[i];
      const next = cornerSizes[i + 1];
      if (next.index === curr.index + 1) {
        const segmentLength = curr.lenOut;
        const combinedTrim = curr.size + next.size;
        if (combinedTrim >= segmentLength * 0.70) {
          const scale = (segmentLength * 0.65) / combinedTrim;
          curr.size *= scale;
          next.size *= scale;
        }
      }
    }

    for (let i = 1; i < pts.length - 1; i++) {
      const pPrev = pts[i - 1];
      const p = pts[i];
      const pNext = pts[i + 1];
      const vIn = [p[0] - pPrev[0], p[1] - pPrev[1]];
      const vOut = [pNext[0] - p[0], pNext[1] - p[1]];
      const cornerData = cornerSizes[i - 1];
      const size = cornerData.size;

      if (size < cutMin || cornerData.lenIn < 0.01 || cornerData.lenOut < 0.01) {
        if (p[0] !== lastOut[0] || p[1] !== lastOut[1]) {
          parts.push(`L${p[0]},${p[1]}`);
          lastOut = p.slice();
        }
        continue;
      }

      const uIn = [vIn[0] / cornerData.lenIn, vIn[1] / cornerData.lenIn];
      const uOut = [vOut[0] / cornerData.lenOut, vOut[1] / cornerData.lenOut];
      const isOrth = (vIn[0] === 0 || vIn[1] === 0) && (vOut[0] === 0 || vOut[1] === 0);

      let inCut, outCut;
      if (isOrth) {
        const inIsHorizontal = vIn[1] === 0;
        inCut = inIsHorizontal ? size * Math.cos(angleRad) : size * Math.sin(angleRad);
        outCut = inIsHorizontal ? size * Math.sin(angleRad) : size * Math.cos(angleRad);
      } else {
        // General-angle corner: symmetric chamfer, angle not applicable.
        inCut = size;
        outCut = size;
      }

      const pInTrim = [p[0] - uIn[0] * inCut, p[1] - uIn[1] * inCut];
      const pOutTrim = [p[0] + uOut[0] * outCut, p[1] + uOut[1] * outCut];

      if (pInTrim[0] !== lastOut[0] || pInTrim[1] !== lastOut[1]) {
        parts.push(`L${pInTrim[0]},${pInTrim[1]}`);
      }
      parts.push(`L${pOutTrim[0]},${pOutTrim[1]}`);
      totalTrim += inCut + outCut;
      cutCount++;
      lastOut = pOutTrim;
    }

    const pEnd = pts[pts.length - 1];
    if (pEnd[0] !== lastOut[0] || pEnd[1] !== lastOut[1]) {
      parts.push(`L${pEnd[0]},${pEnd[1]}`);
    }
    if (!cutCount) {
      return null;
    }
    return {
      ...routeResult,
      d: parts.join(' '),
      meta: {
        ...routeResult.meta,
        bevel: {
          count: cutCount,
          trimPx: Math.round(totalTrim)
        }
      }
    };
  }

  _applySmoothing(routeResult, req) {
    const mode = req.smoothingMode;
    if (mode === 'none' || req.smoothingIterations <= 0) return null;
    let iters = Math.min(5, Math.max(1, req.smoothingIterations|0));
    if (!Array.isArray(routeResult.pts) || routeResult.pts.length < 3) return null;
    if (mode !== 'chaikin') return null; // only mode supported now
    let pts = routeResult.pts.map(p=>[p[0],p[1]]);
    // If arcs already applied we try to reconstruct polyline from original pts (already available)
    // Chaikin corner cutting
    for (let k=0; k<iters; k++) {
      const next = [pts[0]];
      for (let i=0;i<pts.length-1;i++){
        const p=pts[i], q=pts[i+1];
        const Q=[0.75*p[0]+0.25*q[0], 0.75*p[1]+0.25*q[1]];
        const R=[0.25*p[0]+0.75*q[0], 0.25*p[1]+0.75*q[1]];
        next.push(Q,R);
        if (next.length >= req.smoothingMaxPoints) break;
      }
      next.push(pts[pts.length-1]);
      pts = next;
      if (pts.length >= req.smoothingMaxPoints) break;
    }
    // Build path (polyline with many short segments)
    const d = pts.reduce((acc,p,i)=> acc + (i?` L${p[0]},${p[1]}`:`M${p[0]},${p[1]}`),'');
    const newMeta = {
      ...routeResult.meta,
      smooth: {
        mode,
        iterations: iters,
        points: pts.length,
        addedPoints: pts.length - routeResult.pts.length
      }
    };
    return { ...routeResult, d, pts, meta: newMeta };
  }
}

// Simple min-heap for A*
class MinHeap {
  constructor(){ this.a=[]; }
  push(n){ this.a.push(n); this._up(this.a.length-1); }
  pop(){
    if(!this.a.length) return null;
    const top=this.a[0];
    const last=this.a.pop();
    if(this.a.length){ this.a[0]=last; this._down(0); }
    return top;
  }
  isEmpty(){ return this.a.length===0; }
  _up(i){
    while(i>0){
      const p=(i-1)>>1;
      if(this.a[p].f <= this.a[i].f) break;
      [this.a[p],this.a[i]]=[this.a[i],this.a[p]];
      i=p;
    }
  }
  _down(i){
    const n=this.a.length;
    while(true){
      let l=i*2+1, r=l+1, m=i;
      if(l<n && this.a[l].f < this.a[m].f) m=l;
      if(r<n && this.a[r].f < this.a[m].f) m=r;
      if(m===i) break;
      [this.a[m],this.a[i]]=[this.a[i],this.a[m]];
      i=m;
    }
  }
}
