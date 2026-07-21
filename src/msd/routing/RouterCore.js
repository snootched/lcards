/**
 * @fileoverview RouterCore — path-routing engine for MSD line overlays.
 *
 * Computes SVG paths between anchor points using Manhattan, smart (A\*), or
 * waypoint-guided routing.  Results are cached by a content-addressable key
 * and invalidated when config or obstacles change.
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { getValidChannelTypes, WAYPOINT_CONFIG } from './routing-constants.js';

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
 * Lead-out/lead-in stub length for a given request. _applyCornerRounding
 * clamps each corner's radius to half its shorter adjacent segment length
 * (RouterCore.js, cornerRadii loop) — a fixed stub shorter than 2x the
 * configured corner radius silently caps the rounding at the stub, however
 * large cornerRadius is actually set to. Scaling with cornerRadius keeps the
 * stub long enough to let the full configured radius render.
 * @param {object} req
 * @returns {number}
 */
function stubLengthFor(req) {
  return Math.max(MIN_STUB_LENGTH, (req.cornerRadius || 0) * 2);
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
    this._channels = this._normalizeChannels(this.config.channels || {});
    this._channelLineIndex = new Map(); // channelId -> Map(lineId -> stable bundling lane index)

    // Debug logging for channel detection
    if (this._channels.length > 0) {
      lcardsLog.debug(`[RouterCore] Loaded ${this._channels.length} channels:`,
        this._channels.map(c => `${c.id}(${c.mode})`).join(', '));
    } else {
      lcardsLog.debug('[RouterCore] No channels loaded. Config.channels:', this.config.channels);
    }

    this._channelForcePenalty = Number(this.config.channel_force_penalty || 800);
    this._channelAvoidMultiplier = Number(this.config.channel_avoid_multiplier || 1.0);
    this._channelTargetCoverage = Number(this.config.channel_target_coverage ?? 0.6);
    this._channelShapingMaxAttempts = Number(this.config.channel_shaping_max_attempts ?? 12);
    this._channelShapingSpan = Number(this.config.channel_shaping_span ?? 32);
    this._channelMinCoverageGain = Number(this.config.channel_min_coverage_gain ?? 0.04);

    // Trunk-and-branch: lines whose paths happen to run close and parallel
    // spontaneously bundle together (cable-raceway aesthetic), branching
    // apart only where their destinations actually diverge. Channels are
    // unified into this as "pre-seeded" trunks — always known in advance,
    // discoverable by any line whether or not it lists them in its own
    // route_channels — so a config channel and a trunk discovered from an
    // already-routed line's own path are the same shape and go through the
    // same leg-composition machinery (_computeCorridorRouted). See
    // _discoverTrunkCandidates/_registerTrunkSegments for the two halves of
    // the mechanism (finding a trunk to join; growing the registry after a
    // line finishes routing).
    this._trunkBundlingEnabled = this.config.trunk_bundling_enabled !== false;
    this._trunkProximity = Number(this.config.trunk_proximity ?? 32);
    this._trunkMinOverlap = Number(this.config.trunk_min_overlap ?? 60);
    this._trunkMinLength = Number(this.config.trunk_min_length ?? 60);
    this._trunkMaxJoinCandidates = Number(this.config.trunk_max_join_candidates ?? 2);
    this._trunkBundleWeight = Number(this.config.trunk_bundle_weight ?? 0.5);
    this._trunkLineSpacing = Number(this.config.trunk_line_spacing ?? 8);
    // Seeded eagerly, same reasoning as _channels itself: bounds are static
    // config known at construction, so there's no lazy-rebuild story needed.
    // origin/sourceLineId/runIndex distinguish a config-sourced trunk (never
    // purged, never merges away) from one discovered at runtime from a
    // line's own routed path (purged/re-registered on that line's recompute
    // — see _purgeTrunksForLine).
    this._trunks = this._channels.map(c => ({ ...c, origin: 'channel', sourceLineId: null, runIndex: null }));
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
      obsVersion: this._obsVersion
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

    // === Intelligent Routing Mode Selection ===
    // Priority: explicit 'route' field > global default_mode > auto-detection > manhattan fallback
    let modeFull = (raw.route || '').toLowerCase().trim();
    let modeAutoUpgraded = false;
    let autoUpgradeReason = null;

    // Step 1: If no explicit mode, check global default
    if (!modeFull || modeFull === 'auto') {
      const globalDefault = (this.config.default_mode || '').toLowerCase().trim();
      if (globalDefault && globalDefault !== 'auto') {
        modeFull = globalDefault;
      }
    }

    // Step 2: Auto-upgrade if still no mode or manhattan + complexity detected
    if (!modeFull || modeFull === 'auto' || modeFull === 'manhattan') {
      const channels = this._getChannelArray(raw);
      const hasChannels = channels.length > 0;
      const hasObstacles = this._obstacles && this._obstacles.length > 0;

      // Check if auto-upgrade is enabled (default: true)
      const autoUpgradeEnabled = this.config.auto_upgrade_simple_lines !== false;

      if (autoUpgradeEnabled && (!modeFull || modeFull === 'auto' || modeFull === 'manhattan')) {
        // Upgrade to smart if channels are present
        if (hasChannels) {
          modeFull = 'smart';
          modeAutoUpgraded = true;
          autoUpgradeReason = 'channels_present';
          lcardsLog.debug(`[RouterCore] Auto-upgraded route '${overlay.id}' to smart mode (${channels.length} channel(s) configured)`);
        }
        // Upgrade to smart if obstacles exist
        else if (hasObstacles) {
          modeFull = 'smart';
          modeAutoUpgraded = true;
          autoUpgradeReason = 'obstacles_present';
          lcardsLog.debug(`[RouterCore] Auto-upgraded route '${overlay.id}' to smart mode (${this._obstacles.length} obstacle(s) detected)`);
        }
      }

      // Step 3: Fallback to manhattan if no upgrade conditions met
      if (!modeFull || modeFull === 'auto') {
        modeFull = 'manhattan';
      }
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
      _modeAutoUpgraded: modeAutoUpgraded,
      _autoUpgradeReason: autoUpgradeReason,
      avoidIds: Array.isArray(raw.avoid) ? raw.avoid.slice() : [],
      channels: this._getChannelArray(raw),
      cornerRadius: Number(raw.corner_radius || raw.cornerRadius || fs.corner_radius || 34),
      cornerStyle: (raw.corner_style || raw.cornerStyle || fs.corner_style || 'round').toLowerCase(),
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
    return `${req.id}@${x1},${y1}-${x2},${y2}|${req.modeFull}|${req.modeHint}|A:${avoidKey}|C:${chanKey}|R:${req._rev}|O:${this._obsVersion}|P:${req.proximity}|CR:${req.cornerRadius}|CS:${req.cornerStyle}|SM:${req.smoothingMode}|SI:${req.smoothingIterations}|VB:${vb[0]},${vb[1]},${vb[2]},${vb[3]}`;
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
    const stubLength = stubLengthFor(req);
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
      // already use below.
      const discoveredTrunks = (mode === 'smart' || mode === 'grid')
        ? this._discoverTrunkCandidates(stubReq, new Set(explicitCorridors.map(c => c.id)))
        : [];
      if (discoveredTrunks.length) {
        lcardsLog.debug(`[RouterCore] Line '${req.id}': discovered ${discoveredTrunks.length} joinable trunk(s): ${discoveredTrunks.map(t => `${t.id}(overlap=${t.overlap.toFixed(1)})`).join(', ')}`);
      }
      const corridors = this._mergeCorridors(explicitCorridors, discoveredTrunks, stubReq);
      const usesCorridorRouting = corridors.length > 0 && (mode === 'smart' || mode === 'grid');

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
          const chained = this._computeCorridorRouted(stubReq, mode === 'smart', corridors);
          if (hasForceChannels || !chained) {
            // Force channels are mandatory — always use the chained route
            // regardless of cost. (chained should never be null here since
            // hasForceChannels guarantees at least one matching channel,
            // but the null-check keeps this branch safe either way.)
            lcardsLog.debug(`[RouterCore] Using corridor-forced routing for '${req.id}' (mandatory)`);
            result = chained;
          } else {
            // Prefer-channel/trunk-only: the chained route is an optional
            // candidate — only worth it if actually bundling through the
            // corridor(s) costs less overall than the plain route. Compare
            // real, distance-based total costs (both already include
            // whatever channelDelta reward they legitimately earn).
            const plain = computePlain();
            const useChained = plain ? chained.meta.cost <= plain.meta.cost : true;
            lcardsLog.debug(`[RouterCore] Route '${req.id}': corridor candidate cost=${chained.meta.cost.toFixed(1)} vs plain cost=${plain?.meta.cost?.toFixed(1) ?? 'n/a'} -> using ${useChained ? 'chained' : 'plain'}`);
            result = useChained ? chained : plain;
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
        const pts = [...prefix, ...result.pts, ...suffix];
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
      if (result) {
        this._purgeTrunksForLine(req.id);
        this._registerTrunkSegments(req.id, result.pts);
      }
      // Apply smoothing AFTER corner arcs (arcs preserved, path rebuilt as polyline if smoothing > 0)
      if (result && req.smoothingMode !== 'none' && req.smoothingIterations > 0) {
        const smoothApplied = this._applySmoothing(result, req);
        if (smoothApplied) result = smoothApplied;
      }

      this._cache.set(key, result);
      this._cacheOrder.push(key);
      if (this._cacheOrder.length > this._maxCache) {
        const oldest = this._cacheOrder.shift();
        if (oldest) this._cache.delete(oldest);
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

  _computeGrid(req, flags={}) {
    const vb = this.viewBox || [0,0,400,200];
    const originX = vb[0];
    const originY = vb[1];
    const width = vb[2];
    const height = vb[3];
    const baseRes = Number(this.config.grid_resolution || 64);
    const res = baseRes > 4 ? baseRes : 32;
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
      if (cur.c === goal.c && cur.r === goal.r) { found = true; break; }
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
        let moveCost = Math.max(MIN_STEP_COST, 1 + chanDelta) + (isDirectionChange ? turnPenalty : 0);

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
            const anchorSideDir = CARDINAL_DIR[req.anchorSide];
            if (anchorSideDir && dc === -anchorSideDir[0] && dr === -anchorSideDir[1]) continue;
          } else if (req._hintSourceFirst === 'channel_axis') {
            // Force-channel leg boundary: this leg's very first move must
            // cross exactly along the channel's flow axis (unlike the
            // anchor_side reversal-only block above, ANY off-axis first move
            // is wrong here — a channel is entered horizontally or it isn't
            // a horizontal crossing at all). Plain boolean, not the
            // 'xy'/'yx' string convention, to avoid its first-vs-last sign
            // inversion (see _channelAxisHorizontalFirst/Last on the request).
            if (isHorizontalMove !== req._channelAxisHorizontalFirst) continue;
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
            const sideDir = CARDINAL_DIR[req.attachSide];
            if (sideDir && sideDir[0] === dc && sideDir[1] === dr) continue;
          } else if (req._hintSourceLast === 'channel_axis') {
            // Symmetric to the first-move case above: this leg's arrival
            // into the goal must cross exactly along the channel's flow
            // axis. Hard block (not a penalty) on any off-axis arrival.
            if (isHorizontalMove !== req._channelAxisHorizontalLast) continue;
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
      if (req._hintSourceFirst === 'anchor_side') {
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
      if (req._hintSourceLast === 'attach_side') {
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
        const alreadyCorrect = wantsHorizontalLast ? actuallyHorizontal : actuallyVertical;
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
        ...(req._modeAutoUpgraded ? {
          modeAutoUpgraded: true,
          autoUpgradeReason: req._autoUpgradeReason
        } : {}),
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

      // Mark grid cells that actually intersect with obstacle bounds
      // Use floor for all bounds to avoid expanding obstacles beyond their actual size
      const c0 = Math.max(0, Math.floor(x1 / res));
      const r0 = Math.max(0, Math.floor(y1 / res));
      const c1 = Math.min(cols-1, Math.floor(x2 / res));
      const r1 = Math.min(rows-1, Math.floor(y2 / res));

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
   * Get bundling offset for a line in a channel
   * Distributes lines evenly with spacing to avoid overlap
   * @param {string} channelId - Channel identifier
   * @param {string} lineId - Line identifier
   * @param {number} spacing - Gap between lines in pixels
   * @returns {number} Offset in pixels (positive or negative)
   * @private
   */
  _getChannelLineOffset(channelId, lineId, spacing) {
    if (!spacing || spacing === 0) return 0;

    // Stable per-(channelId, lineId) index rather than a monotonic call
    // counter — a counter that only ever increments means every full
    // route-cache invalidation (obstacle change, viewBox change, config
    // edit) causes every affected line to recompute and re-call this,
    // permanently advancing the counter further, so the same line could get
    // a *different* bundling lane after a later invalidation than it had
    // before even though nothing about that line or channel changed.
    if (!this._channelLineIndex.has(channelId)) {
      this._channelLineIndex.set(channelId, new Map());
    }
    const lineMap = this._channelLineIndex.get(channelId);
    if (!lineMap.has(lineId)) {
      lineMap.set(lineId, lineMap.size);
    }
    const lineIndex = lineMap.get(lineId);

    // Center the bundle: offset both positively and negatively
    // Line 0: -spacing, Line 1: 0, Line 2: +spacing, Line 3: +2*spacing, etc.
    const offset = (lineIndex * spacing) - (spacing / 2);

    lcardsLog.debug(`[RouterCore] Channel '${channelId}': Line ${lineIndex} offset = ${offset} viewBox units (spacing: ${spacing})`);
    return offset;
  }

  /**
   * Raw (non-centered) 0,1,2,... lane index for a line at a channel —
   * companion to _getChannelLineOffset, used where a centered ±offset
   * would be unsafe (see _pushBundledApproachLegs's corridorOffset: a
   * centered offset can point BACKWARD relative to the line's own
   * established travel direction, and two different lines' centered
   * offsets can share the same magnitude — e.g. -8/+8 — which collide once
   * reduced to a same-direction distance). A monotonic per-line index has
   * neither problem: applied in a single safe direction it's always
   * distinct and never negative. Must be called AFTER
   * _getChannelLineOffset for the same (channelId, lineId) in the same
   * leg-building pass, since that call is what populates the map.
   * @param {string} channelId
   * @param {string} lineId
   * @returns {number}
   * @private
   */
  _getChannelLineIndex(channelId, lineId) {
    return this._channelLineIndex.get(channelId)?.get(lineId) ?? 0;
  }

  /**
   * Removes every trunk this line previously registered (origin:'discovered'
   * with sourceLineId === lineId), before re-scanning its freshly-computed
   * path. Mirrors invalidate(id)'s own scan-and-purge pattern (line ~113),
   * applied to _trunks instead of _cache. Channel-seeded entries
   * (sourceLineId: null) never match and always survive — only a full
   * config-driven reconstruction of this RouterCore instance touches those.
   * @param {string} lineId
   * @private
   */
  _purgeTrunksForLine(lineId) {
    this._trunks = this._trunks.filter(t => t.sourceLineId !== lineId);
  }

  /**
   * Scans a finished route's points for long-enough straight (axis-aligned)
   * runs and registers each as a trunk another line could later discover
   * and join. Must run on the pre-smoothing polyline — _applySmoothing
   * replaces pts with curved points, which would poison the registry with
   * non-axis-aligned "segments." A run shorter than _trunkMinLength isn't
   * registered at all: a short post-stub jog (or a corridor nudge — see
   * _pushBundledApproachLegs) is not something another line should try to
   * join.
   * @param {string} lineId
   * @param {number[][]} pts
   * @private
   */
  _registerTrunkSegments(lineId, pts) {
    if (!this._trunkBundlingEnabled) return;
    // Compact collinear runs first — a straight route commonly has interior
    // points that aren't real corners at all (e.g. both ends of a stub
    // splice happening to continue in the same direction the inner path
    // already travels), and scanning raw consecutive pairs would register
    // each such sub-run as its own separate, artificially-short trunk
    // instead of the one real corridor they together represent. Same
    // helper _computeCorridorRouted's own leg concatenation already relies
    // on for this exact purpose.
    const compacted = this._compactPolyline(pts);
    let runIndex = 0;
    for (let i = 1; i < compacted.length; i++) {
      const a = compacted[i - 1], b = compacted[i];
      const horizontal = a[1] === b[1];
      const vertical = a[0] === b[0];
      if (!horizontal && !vertical) continue; // shouldn't happen pre-smoothing; guard anyway
      const length = horizontal ? Math.abs(b[0] - a[0]) : Math.abs(b[1] - a[1]);
      if (length < this._trunkMinLength) continue;
      this._mergeOrRegisterTrunk(lineId, runIndex++, a, b, horizontal);
    }
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
   * (sourceLineId, runIndex), never a monotonic counter, so re-registering
   * a line with unchanged geometry is a no-op and re-registering with
   * changed geometry can't leak a stale entry under an old id (see
   * _purgeTrunksForLine, which always runs first).
   * @param {string} lineId
   * @param {number} runIndex
   * @param {number[]} a
   * @param {number[]} b
   * @param {boolean} horizontal
   * @private
   */
  _mergeOrRegisterTrunk(lineId, runIndex, a, b, horizontal) {
    const flow = horizontal ? 0 : 1;
    const cross = horizontal ? 1 : 0;
    const flowLo = Math.min(a[flow], b[flow]);
    const flowHi = Math.max(a[flow], b[flow]);
    const crossCoord = a[cross]; // a[cross] === b[cross] by construction (axis-aligned)

    const existing = this._trunks.find(t => {
      if (t.direction !== (horizontal ? 'horizontal' : 'vertical')) return false;
      if (t.sourceLineId === lineId) return false;
      const tCrossCenter = horizontal ? (t.y1 + t.y2) / 2 : (t.x1 + t.x2) / 2;
      if (Math.abs(tCrossCenter - crossCoord) > this._trunkProximity) return false;
      const tFlowLo = horizontal ? t.x1 : t.y1;
      const tFlowHi = horizontal ? t.x2 : t.y2;
      return Math.min(flowHi, tFlowHi) - Math.max(flowLo, tFlowLo) >= -this._trunkProximity;
    });
    if (existing) {
      if (horizontal) {
        existing.x1 = Math.min(existing.x1, flowLo);
        existing.x2 = Math.max(existing.x2, flowHi);
      } else {
        existing.y1 = Math.min(existing.y1, flowLo);
        existing.y2 = Math.max(existing.y2, flowHi);
      }
      return;
    }

    const half = this._trunkLineSpacing / 2;
    this._trunks.push({
      id: `trunk:${lineId}:${runIndex}`,
      x1: horizontal ? flowLo : crossCoord - half,
      y1: horizontal ? crossCoord - half : flowLo,
      x2: horizontal ? flowHi : crossCoord + half,
      y2: horizontal ? crossCoord + half : flowHi,
      direction: horizontal ? 'horizontal' : 'vertical',
      weight: this._trunkBundleWeight,
      mode: 'prefer',
      line_spacing: this._trunkLineSpacing,
      origin: 'discovered',
      sourceLineId: lineId,
      runIndex
    });
  }

  /**
   * Finds trunks (config-seeded channels and/or previously-discovered runs
   * from other lines) worth trying to join for this request — two
   * independently-tunable thresholds, not a vague "check if it's close":
   * flow-axis overlap between the line's own span and the trunk's span
   * must be >= trunk_min_overlap (joining is only worth it for a real
   * shared stretch, not a coincidental few-pixel graze), and the
   * perpendicular distance from the line's approximate path to the
   * trunk's lane center must be <= trunk_proximity. Runs on stubReq.a/b
   * alone — not an already-computed plain route — so a line with no
   * nearby trunk never pays for an extra pathfinding pass.
   * @param {object} stubReq
   * @param {Set<string>} excludeIds - ids already present as explicit corridors in the chain
   * @returns {Array<object>} candidate trunks (each tagged with `overlap`), sorted by overlap desc, capped at trunk_max_join_candidates
   * @private
   */
  _discoverTrunkCandidates(stubReq, excludeIds) {
    if (!this._trunkBundlingEnabled || !this._trunks.length) return [];
    const [a, b] = [stubReq.a, stubReq.b];
    const candidates = [];
    for (const t of this._trunks) {
      if (excludeIds.has(t.id) || t.sourceLineId === stubReq.id) continue;
      const horizontal = t.direction === 'horizontal';
      const flow = horizontal ? 0 : 1;
      const cross = horizontal ? 1 : 0;
      const lineFlowLo = Math.min(a[flow], b[flow]);
      const lineFlowHi = Math.max(a[flow], b[flow]);
      const tFlowLo = horizontal ? t.x1 : t.y1;
      const tFlowHi = horizontal ? t.x2 : t.y2;
      const overlap = Math.min(lineFlowHi, tFlowHi) - Math.max(lineFlowLo, tFlowLo);
      if (overlap < this._trunkMinOverlap) continue;
      const tCrossCenter = horizontal ? (t.y1 + t.y2) / 2 : (t.x1 + t.x2) / 2;
      // Mirrors _channelCrossingPoints' own throughCoord averaging — a
      // rough approximation of where this line's path would sit on the
      // cross axis, good enough for a "is this worth trying" gate (the
      // actual join geometry is computed precisely later, only if this
      // candidate is used).
      const lineCrossApprox = (a[cross] + b[cross]) / 2;
      if (Math.abs(lineCrossApprox - tCrossCenter) > this._trunkProximity) continue;
      candidates.push({ ...t, overlap });
    }
    candidates.sort((p, q) => q.overlap - p.overlap);
    return candidates.slice(0, this._trunkMaxJoinCandidates);
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
   * @returns {{ entry: number[], exit: number[], horizontal: boolean, entryAlreadyInside: boolean, exitAlreadyInside: boolean, laneOffset: number, laneIndex: number, lineSpacing: number }}
   * @private
   */
  _channelCrossingPoints(chan, approachPoint, departPoint, lineId) {
    const horizontal = chan.direction === 'horizontal';
    const flow = horizontal ? 0 : 1;   // axis index the line travels along through the channel
    const cross = horizontal ? 1 : 0;  // axis index perpendicular to flow (bundling axis)
    const lo = horizontal ? chan.x1 : chan.y1;
    const hi = horizontal ? chan.x2 : chan.y2;
    const crossLo = horizontal ? chan.y1 : chan.x1;
    const crossHi = horizontal ? chan.y2 : chan.x2;

    const offset = this._getChannelLineOffset(chan.id, lineId, chan.line_spacing);
    let throughCoord = (
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
    const entryFlow = Math.max(lo, Math.min(hi, approachFlow));
    const exitFlow = Math.max(lo, Math.min(hi, departFlow));

    // True when clamping didn't move the reference point at all — i.e. the
    // approach/depart point was already within the channel's flow-axis
    // span, so the leg touching that boundary is fundamentally a
    // cross-axis-only move (only throughCoord differs). Hard-constraining
    // such a leg's direction to the channel's flow axis anyway is
    // geometrically incompatible with "start and end share this flow
    // coordinate" and forces an artificial there-and-back detour just to
    // satisfy it (confirmed empirically on both boundaries). The caller
    // should relax that leg's hint to a plain geometry fallback instead of
    // a hard 'channel_axis' block when true.
    const entryAlreadyInside = entryFlow === approachFlow;
    const exitAlreadyInside = exitFlow === departFlow;

    const entry = horizontal ? [entryFlow, throughCoord] : [throughCoord, entryFlow];
    const exit  = horizontal ? [exitFlow, throughCoord]  : [throughCoord, exitFlow];
    // laneIndex (raw 0,1,2,...) is exposed alongside the centered laneOffset
    // for the approach/depart legs' own shared corridor (see
    // _pushBundledApproachLegs) — a centered offset can point backward
    // relative to a line's established travel direction, and two lines'
    // centered offsets can share a magnitude (e.g. -8/+8), so the corridor
    // uses the raw index in a single safe direction instead.
    return {
      entry, exit, horizontal, entryAlreadyInside, exitAlreadyInside,
      laneOffset: offset,
      laneIndex: this._getChannelLineIndex(chan.id, lineId),
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
      _channelAxisHorizontalLast: lastHint.source === 'channel_axis' ? lastHint.horizontal : undefined
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
   * When `lineSpacing` is set and this line has more than one sibling at
   * the channel (laneIndex/lineSpacing — see _getChannelLineIndex), splits
   * into three legs that nudge onto this line's own corridor immediately,
   * travel the whole shared stretch already separated, then correct back
   * to the true boundary coordinate at the very end. The nudge uses the
   * RAW per-line lane index (0,1,2,...), not the crossing's own centered
   * ±offset: a centered value can point backward relative to the leg's
   * established travel direction (confirmed: produced a real reversal
   * right after the anchor's own stub), and two different lines' centered
   * offsets can share a magnitude (e.g. -8/+8), which would collide once
   * reduced to a single safe direction. The raw index, always applied in
   * this leg's own net flow direction (`Math.sign(to[flow]-from[flow])`),
   * is always non-negative and always distinct per line, so it can never
   * reverse and never collide. Without meaningful spacing (single line, or
   * line_spacing:0), a plain two-leg cross-then-flow split is still used so
   * the correction at least happens early rather than late.
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
   *   that channel (see _getChannelLineIndex)
   * @param {number} lineSpacing - that channel's line_spacing
   * @param {object} firstHint - the true hint governing departure from `from`
   * @param {object} lastHint - the true hint governing arrival at `to`
   * @private
   */
  _pushBundledApproachLegs(legs, stubReq, from, to, horizontal, laneIndex, lineSpacing, firstHint, lastHint) {
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
    const corridorOffset = lineSpacing && laneIndex > 0 && from[flow] !== to[flow]
      ? Math.sign(to[flow] - from[flow]) * Math.min(rawOffset, available)
      : 0;
    if (!corridorOffset) {
      // No real bundling need — either this line is alone at this channel,
      // or it's line 0's own un-offset lane. Fall back to a single, unsplit
      // leg with the TRUE hints, letting the pathfinder pick its own
      // natural, hint-compatible shape exactly as it did before this
      // feature existed. This is not just the simpler option: forcing a
      // specific correction order unconditionally can directly conflict
      // with the true boundary hint's own hard-blocked direction — e.g.
      // anchor_side:'top' hard-blocks straight-down travel, but a blind
      // cross-axis-first order for a horizontal channel with a top/bottom
      // departure side IS straight-down travel. Confirmed as a real
      // regression: produced a genuine reversal for exactly that
      // combination.
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
    legs.push(this._buildLegRequest(stubReq, from, nudge, { source: 'geometry' }, { source: 'geometry' }));
    legs.push(this._buildLegRequest(stubReq, nudge, mid, { source: 'geometry' }, { source: 'geometry' }));
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
  _computeCorridorRouted(stubReq, smart, corridors) {
    const chainChannels = corridors;
    if (!chainChannels.length) return null;

    const legs = [];
    let cursor = stubReq.a;
    // Mirrors entryAlreadyInside on the OTHER boundary: true when the
    // previous channel's exit point didn't actually move from its own
    // depart reference (already inside that channel's span), meaning the
    // leg departing FROM it is fundamentally a cross-axis-only move too.
    let prevExitAlreadyInside = false;
    let lastLaneIndex = 0;
    let lastLineSpacing = 0;
    for (let k = 0; k < chainChannels.length; k++) {
      const chan = chainChannels[k];
      const next = chainChannels[k + 1];
      const nextRef = next ? [(next.x1 + next.x2) / 2, (next.y1 + next.y2) / 2] : stubReq.b;
      const { entry, exit, horizontal, entryAlreadyInside, exitAlreadyInside, laneIndex, lineSpacing } = this._channelCrossingPoints(chan, cursor, nextRef, stubReq.id);

      this._pushBundledApproachLegs(legs, stubReq, cursor, entry, horizontal, laneIndex, lineSpacing,
        k === 0
          ? { source: stubReq._hintSourceFirst, mode: stubReq.modeHint, anchorSide: stubReq.anchorSide }
          : (prevExitAlreadyInside ? { source: 'geometry' } : { source: 'channel_axis', horizontal: chainChannels[k - 1].direction === 'horizontal' }),
        entryAlreadyInside ? { source: 'geometry' } : { source: 'channel_axis', horizontal });
      legs.push(this._buildLegRequest(stubReq, entry, exit,
        { source: 'channel_axis', horizontal },
        { source: 'channel_axis', horizontal }));
      cursor = exit;
      prevExitAlreadyInside = exitAlreadyInside;
      lastLaneIndex = laneIndex;
      lastLineSpacing = lineSpacing;
    }
    const lastChan = chainChannels[chainChannels.length - 1];
    this._pushBundledApproachLegs(legs, stubReq, cursor, stubReq.b, lastChan.direction === 'horizontal', lastLaneIndex, lastLineSpacing,
      prevExitAlreadyInside ? { source: 'geometry' } : { source: 'channel_axis', horizontal: lastChan.direction === 'horizontal' },
      { source: stubReq._hintSourceLast, mode: stubReq.modeHintLast, attachSide: stubReq.attachSide });

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
        ...(stubReq._modeAutoUpgraded ? {
          modeAutoUpgraded: true,
          autoUpgradeReason: stubReq._autoUpgradeReason
        } : {}),
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
    const anchorDir = req._hintSourceFirst === 'anchor_side' ? CARDINAL_DIR[req.anchorSide] : null;
    const attachDir = req._hintSourceLast === 'attach_side' ? CARDINAL_DIR[req.attachSide] : null;

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
        const stubLength = stubLengthFor(req);
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

        const raw = [p1, p1s, elbow, p2s, p2];
        pts = raw.filter((pt,i) => i === 0 || pt[0] !== raw[i-1][0] || pt[1] !== raw[i-1][1]);
        if (pts.length < 2) pts = [p1, p2];
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
        ...(req._modeAutoUpgraded ? {
          modeAutoUpgraded: true,
          autoUpgradeReason: req._autoUpgradeReason
        } : {}),
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
      const minImprove = req.smart.min_improvement;
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
          // Reduce both radii proportionally to use 65% of segment (leave 35% gap)
          const scale = (segmentLength * 0.65) / totalTrim;
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
