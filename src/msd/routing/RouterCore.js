/**
 * @fileoverview RouterCore — path-routing engine for MSD line overlays.
 *
 * Computes SVG paths between anchor points using Manhattan, smart (A\*), or
 * waypoint-guided routing.  Results are cached by a content-addressable key
 * and invalidated when config or obstacles change.
 */

import { lcardsLog } from '../../utils/lcards-logging.js';
import { getValidChannelTypes, WAYPOINT_CONFIG } from './routing-constants.js';

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
    this._channels = this._normalizeChannels(this.config.channels || {});
    this._channelLineCount = new Map(); // channelId -> count of lines routed through

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
        [x,y] = raw.position;
        [w,h] = raw.size;
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
    this.invalidate('*');
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
    return Array.isArray(channels) ? channels : [];
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

    // Improved destination overlay detection:
    // 1. If attach_side is present we treat destination as an overlay (even if anchor not yet resolved)
    // 2. If attach_to is not an existing anchor id we assume it is an overlay id (will be resolved later)
    let isDestinationOverlay = false;
    if (raw.attach_side) {
      isDestinationOverlay = true;
    } else if (typeof raw.attach_to === 'string' && raw.attach_to) {
      if (!this.anchors[raw.attach_to]) {
        isDestinationOverlay = true;
      }
    }

    // Auto-set modeHintLast based on attach_side when not explicitly provided
    if (!modeHintLast && isDestinationOverlay) {
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
      _hintSourceFirst: hintSourceFirst,
      _hintSourceLast: hintSourceLast,
      _modeAutoUpgraded: modeAutoUpgraded,
      _autoUpgradeReason: autoUpgradeReason,
      avoidIds: Array.isArray(raw.avoid) ? raw.avoid.slice() : [],
      channels: this._getChannelArray(raw),
      cornerRadius: Number(raw.corner_radius || raw.cornerRadius || fs.corner_radius || 0),
      cornerStyle: (raw.corner_style || raw.cornerStyle || fs.corner_style || 'miter').toLowerCase(),
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
    const avoidKey = req.avoidIds.sort().join(',');
    const chanKey = req.channels.sort().join(',');
    return `${req.id}@${x1},${y1}-${x2},${y2}|${req.modeFull}|${req.modeHint}|A:${avoidKey}|C:${chanKey}|R:${req._rev}|O:${this._obsVersion}|P:${req.proximity}|CR:${req.cornerRadius}|CS:${req.cornerStyle}|SM:${req.smoothingMode}|SI:${req.smoothingIterations}`;
  }

  computePath(req) {
    const key = this._cacheKey(req);
      const cached = this._cache.get(key);
      if (cached) {
        return { ...cached, meta: { ...cached.meta, cache_hit: true } };
      }
      let result;
      const mode = req.modeFull;
      try {
        // Special handling for force channels - use forced routing instead of grid
        const hasForceChannels = req.channels?.length > 0 &&
          this._channels.some(c => req.channels.includes(c.id) && c.mode === 'force');

        lcardsLog.debug(`[RouterCore] Route '${req.id}': mode=${mode}, channels=${req.channels?.join(',') || 'none'}, hasForce=${hasForceChannels}`);

        if (mode === 'manual') {
          lcardsLog.debug(`[RouterCore] Using manual routing for '${req.id}' with ${req.waypoints?.length || 0} waypoints`);
          result = this._computeManual(req);
        } else if (hasForceChannels && (mode === 'smart' || mode === 'grid')) {
          lcardsLog.debug(`[RouterCore] Using forced routing for '${req.id}'`);
          result = this._computeWaypoint(req);
        } else if (mode === 'grid') {
          result = this._computeGrid(req);
        } else if (mode === 'smart') {
          // Compute base grid, then refine with A* for smart routing
            const gridBase = this._computeGrid(req, { smart: true });
          if (gridBase) {
            result = this._refineSmart(req, gridBase);
          }
        }
      } catch (e) {
        lcardsLog.warn('[MSD v1] smart/grid router error; fallback to manhattan', e);
      }
      if (!result) {
        result = this._computeManhattan(req);
      }

      if (result && req.cornerStyle === 'round' && req.cornerRadius > 0) {
        const arcApplied = this._applyCornerRounding(result, req.cornerRadius, req.id);
        if (arcApplied) result = arcApplied;
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
    const width = vb[2];
    const height = vb[3];
    const baseRes = Number(this.config.grid_resolution || 64);
    const res = baseRes > 4 ? baseRes : 32;
    const cols = Math.max(2, Math.ceil(width / res));
    const rows = Math.max(2, Math.ceil(height / res));
    const clearance = Math.max(0, req.clearance || this.config.clearance || 0);

    const gridKey = `${res}|${this._obsVersion}|${clearance}`;
    let occ = this._gridCache.get(gridKey);
    if (!occ) {
      occ = this._buildOccupancy(cols, rows, res, clearance);
      this._gridCache.set(gridKey, occ);
    }

    const w2c = (x)=>Math.min(cols-1, Math.max(0, Math.round(x / res)));
    const h2c = (y)=>Math.min(rows-1, Math.max(0, Math.round(y / res)));
    const c2x = (c)=> c * res;
    const c2y = (r)=> r * res;

    const start = { c: w2c(req.a[0]), r: h2c(req.a[1]) };
    const goal  = { c: w2c(req.b[0]), r: h2c(req.b[1]) };

    // A* (4-direction) with turn penalty
    const open = new MinHeap();
    const key = (c,r)=>`${c},${r}`;
    const gScore = new Map();
    const came = new Map();
    const direction = new Map(); // Track direction to each cell
    const h = (c,r)=> Math.abs(c-goal.c)+Math.abs(r-goal.r);

    // Get turn penalty from config (default: 2)
    const turnPenalty = Number(this.config.turn_penalty ?? 2);

    gScore.set(key(start.c,start.r),0);
    open.push({ c:start.c, r:start.r, f:h(start.c,start.r) });

    const blocked = (c,r)=> occ[r] && occ[r][c] === 1;

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

        // Add turn penalty if direction changed (but not on first move)
        const isDirectionChange = curDir && curDir !== newDir;
        const moveCost = 1 + (isDirectionChange ? turnPenalty : 0);
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
    const pts = [];
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
    // Ensure final destination snapping
    const origStart = pts[0].slice();
    const origEnd = pts[pts.length-1].slice();
    pts[0] = [req.a[0], req.a[1]];
    pts[pts.length-1] = [req.b[0], req.b[1]];

    // NEW: If snapping created diagonals, insert proper Manhattan elbows
    // Check first segment
    if (pts.length >= 2 && pts[0][0] !== origStart[0] && pts[0][1] !== origStart[1]) {
      // First point was diagonal-snapped, check if it created diagonal with second point
      if (pts[0][0] !== pts[1][0] && pts[0][1] !== pts[1][1]) {
        // Diagonal exists - insert elbow maintaining grid's original direction
        if (origStart[0] === pts[1][0]) {
          // Was vertical from grid, keep that
          pts.splice(1, 0, [pts[1][0], pts[0][1]]);
        } else if (origStart[1] === pts[1][1]) {
          // Was horizontal from grid, keep that
          pts.splice(1, 0, [pts[0][0], pts[1][1]]);
        } else {
          // Grid had elbow, respect the direction toward grid point
          const dx = Math.abs(origStart[0] - pts[0][0]);
          const dy = Math.abs(origStart[1] - pts[0][1]);
          if (dx > dy) {
            pts.splice(1, 0, [origStart[0], pts[0][1]]);
          } else {
            pts.splice(1, 0, [pts[0][0], origStart[1]]);
          }
        }
      }
    }
    // Check last segment
    const lastIdx = pts.length - 1;
    if (lastIdx >= 1 && pts[lastIdx][0] !== origEnd[0] && pts[lastIdx][1] !== origEnd[1]) {
      // Last point was diagonal-snapped, check if it created diagonal with second-to-last
      if (pts[lastIdx-1][0] !== pts[lastIdx][0] && pts[lastIdx-1][1] !== pts[lastIdx][1]) {
        // Diagonal exists - insert elbow maintaining grid's original direction
        if (origEnd[0] === pts[lastIdx-1][0]) {
          // Was vertical from grid, keep that
          pts.splice(lastIdx, 0, [pts[lastIdx-1][0], pts[lastIdx][1]]);
        } else if (origEnd[1] === pts[lastIdx-1][1]) {
          // Was horizontal from grid, keep that
          pts.splice(lastIdx, 0, [pts[lastIdx][0], pts[lastIdx-1][1]]);
        } else {
          // Grid had elbow, respect the direction toward grid point
          const dx = Math.abs(origEnd[0] - pts[lastIdx][0]);
          const dy = Math.abs(origEnd[1] - pts[lastIdx][1]);
          if (dx > dy) {
            pts.splice(lastIdx, 0, [origEnd[0], pts[lastIdx][1]]);
          } else {
            pts.splice(lastIdx, 0, [pts[lastIdx][0], origEnd[1]]);
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
    let channelInfo = this._channelDelta(pts, req);
    let shapingMeta = null;

    // Check if any of the line's referenced channels have prefer or force mode
    const referencedChannels = req.channels?.length ? this._channels.filter(c => req.channels.includes(c.id)) : [];
    const hasPreferOrForce = referencedChannels.some(c => c.mode === 'prefer' || c.mode === 'force');
    const hasForce = referencedChannels.some(c => c.mode === 'force');

    if (hasPreferOrForce) {
      const desired = hasForce ? 1.0 : this._channelTargetCoverage;
      if (channelInfo.coverage < desired) {
        const shapeRes = this._shapeForChannels(req, pts, channelInfo, desired);
        if (shapeRes && shapeRes.accepted) {
          pts = shapeRes.pts;
          channelInfo = this._channelDelta(pts, req); // recompute
          shapingMeta = shapeRes.meta;
        } else if (shapeRes) {
          shapingMeta = shapeRes.meta;
        }
      }
    }
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
            forcedOutside: channelInfo.forcedOutside,
            ...(shapingMeta ? { shaping: shapingMeta } : {})
          }
        } : {})
      }
    };
  }

  _buildOccupancy(cols, rows, res, clearance) {
    // 0 = free, 1 = blocked
    const occ = Array.from({ length: rows }, () => new Uint8Array(cols));
    if (!this._obstacles.length) return occ;
    for (const ob of this._obstacles) {
      const x1 = ob.x1 - clearance;
      const y1 = ob.y1 - clearance;
      const x2 = ob.x2 + clearance;
      const y2 = ob.y2 + clearance;

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

    // Get or initialize line count for this channel
    if (!this._channelLineCount.has(channelId)) {
      this._channelLineCount.set(channelId, 0);
    }

    const lineIndex = this._channelLineCount.get(channelId);
    this._channelLineCount.set(channelId, lineIndex + 1);

    // Center the bundle: offset both positively and negatively
    // Line 0: -spacing, Line 1: 0, Line 2: +spacing, Line 3: +2*spacing, etc.
    const offset = (lineIndex * spacing) - (spacing / 2);

    lcardsLog.debug(`[RouterCore] Channel '${channelId}': Line ${lineIndex} offset = ${offset} viewBox units (spacing: ${spacing})`);
    return offset;
  }

  /**
   * Simple waypoint routing for waypoint-type channels
   * Creates Manhattan-style paths that go through waypoint channel centers
   * Only forces detour if simple Manhattan doesn't already pass through
   * Respects channel direction (horizontal vs vertical flow)
   * Now includes line bundling with configurable spacing
   * @param {object} req - Route request with waypoint channels
   * @returns {object} Route result with path through waypoints
   * @private
   */
  _computeWaypoint(req) {
    const [x1, y1] = req.a;
    const [x2, y2] = req.b;

    // Get force channels
    const chanSet = new Set(req.channels);
    const waypoints = this._channels
      .filter(c => chanSet.has(c.id) && c.mode === 'force')
      .map(c => ({
        id: c.id,
        cx: (c.x1 + c.x2) / 2,
        cy: (c.y1 + c.y2) / 2,
        x1: c.x1,
        x2: c.x2,
        y1: c.y1,
        y2: c.y2,
        direction: c.direction  // 'horizontal' or 'vertical'
      }));

    if (waypoints.length === 0) {
      // No waypoints, fall back to manhattan
      return this._computeManhattan(req);
    }

    // For simplicity, use first waypoint (TODO: support multiple waypoints with ordering)
    const wp = waypoints[0];

    // Determine which Manhattan orientation to try
    // Priority: 1) User's explicit route_hint, 2) Channel direction, 3) Geometry
    let preferredMode;
    if (req.modeHint === 'xy' || req.modeHint === 'yx') {
      // User explicitly specified a hint - use it
      preferredMode = req.modeHint;
      lcardsLog.debug(`[RouterCore] Using explicit route_hint: ${preferredMode} for waypoint '${wp.id}'`);
    } else {
      // Fall back to channel direction matching
      // Horizontal channel → prefer xy mode (horizontal segment through channel)
      // Vertical channel → prefer yx mode (vertical segment through channel)
      preferredMode = wp.direction === 'horizontal' ? 'xy' : 'yx';
    }
    const alternateMode = preferredMode === 'xy' ? 'yx' : 'xy';

    // Check if simple Manhattan routing already passes through the waypoint
    const tryManhattan = (mode) => {
      if (x1 === x2 || y1 === y2) {
        return [[x1, y1], [x2, y2]]; // Direct line
      }
      if (mode === 'xy') {
        // Horizontal first: [start] → [x2, y1] → [x2, y2]
        return [[x1, y1], [x2, y1], [x2, y2]];
      } else {
        // Vertical first: [start] → [x1, y2] → [x2, y2]
        return [[x1, y1], [x1, y2], [x2, y2]];
      }
    };

    // Check if a Manhattan path intersects the waypoint WITH CORRECT DIRECTION
    const pathIntersectsWaypointCorrectly = (pts, requiredDirection) => {
      for (let i = 1; i < pts.length; i++) {
        const [px1, py1] = pts[i-1];
        const [px2, py2] = pts[i];

        // Determine segment orientation
        const isHorizontal = py1 === py2 && px1 !== px2;
        const isVertical = px1 === px2 && py1 !== py2;

        // Check if this segment passes through waypoint bounds
        const segMinX = Math.min(px1, px2);
        const segMaxX = Math.max(px1, px2);
        const segMinY = Math.min(py1, py2);
        const segMaxY = Math.max(py1, py2);

        // Check overlap with waypoint rectangle
        if (segMaxX >= wp.x1 && segMinX <= wp.x2 &&
            segMaxY >= wp.y1 && segMinY <= wp.y2) {
          // Found intersection - now check if direction matches
          if (requiredDirection === 'horizontal' && isHorizontal) {
            return true;  // Horizontal segment through horizontal channel ✓
          }
          if (requiredDirection === 'vertical' && isVertical) {
            return true;  // Vertical segment through vertical channel ✓
          }
          // Wrong direction through channel
          return false;
        }
      }
      return false;
    };

    // Try preferred direction first (matches channel flow direction)
    const preferredPath = tryManhattan(preferredMode);
    if (pathIntersectsWaypointCorrectly(preferredPath, wp.direction)) {
      lcardsLog.debug(`[RouterCore] Waypoint '${wp.id}': Simple Manhattan (${preferredMode}) matches ${wp.direction} channel direction`);
      const d = this._polylineToPath(preferredPath);
      const channelInfo = this._channelDelta(preferredPath, req);

      return {
        d,
        pts: preferredPath,
        meta: {
          strategy: 'waypoint-manhattan',
          cost: this._costSimple(preferredPath),
          segments: preferredPath.length - 1,
          bends: Math.max(0, preferredPath.length - 2),
          waypoint: {
            id: wp.id,
            direction: wp.direction,
            natural: true  // Path naturally passes through in correct direction
          },
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

    // Alternate direction won't work - it would pass through in wrong direction
    lcardsLog.debug(`[RouterCore] Waypoint '${wp.id}': Simple Manhattan doesn't pass through in ${wp.direction} direction - forcing detour`);

    // Force route through waypoint with correct direction
    // Priority: 1) User's explicit route_hint, 2) Channel direction
    let detourDirection = wp.direction; // Default to channel direction
    if (req.modeHint === 'xy' || req.modeHint === 'yx') {
      // User explicitly specified a hint - respect it for detour routing
      // CRITICAL: The channel direction determines HOW the line flows THROUGH the channel
      // - If we want to go HORIZONTAL first (xy), the channel must flow VERTICALLY (so we approach horizontally)
      // - If we want to go VERTICAL first (yx), the channel must flow HORIZONTALLY (so we approach vertically)
      // This is INVERTED from what you might expect!
      detourDirection = (req.modeHint === 'xy') ? 'vertical' : 'horizontal';
      lcardsLog.debug(`[RouterCore] Waypoint '${wp.id}': route_hint=${req.modeHint} → detour flows ${detourDirection} (approach is ${req.modeHint === 'xy' ? 'horizontal' : 'vertical'})`);
    } else {
      lcardsLog.debug(`[RouterCore] Waypoint '${wp.id}': Using channel direction (${wp.direction}) for detour`);
    }

    lcardsLog.debug(`[RouterCore] Waypoint '${wp.id}': Forcing ${detourDirection} detour through center (${wp.cx}, ${wp.cy})`);

    // Calculate bundling offset for this line
    const channel = this._channels.find(c => c.id === wp.id);
    const lineOffset = this._getChannelLineOffset(wp.id, req.id, channel?.line_spacing || 0);

    const pts = [];
    pts.push([x1, y1]);

    if (detourDirection === 'horizontal') {
      // Horizontal flow through channel
      // Determine optimal Y position within channel based on where we're coming from/going to
      const entryY = Math.max(wp.y1, Math.min(wp.y2, y1));  // Clamp to channel bounds
      const exitY = Math.max(wp.y1, Math.min(wp.y2, y2));
      let throughY = (entryY + exitY) / 2;  // Midpoint between entry and exit

      // Apply bundling offset (perpendicular to flow direction)
      throughY += lineOffset;
      throughY = Math.max(wp.y1, Math.min(wp.y2, throughY));  // Keep within bounds

      // Move to channel entry
      if (y1 !== throughY) {
        pts.push([x1, throughY]);
      }

      // Horizontal segment through channel (enter at left edge, exit at right edge)
      const enterX = Math.max(wp.x1, Math.min(wp.x2, x1));
      const exitX = Math.max(wp.x1, Math.min(wp.x2, x2));

      if (x1 < wp.x1) {
        // Entering from left - route to left edge, across, to right edge
        if (throughY !== pts[pts.length - 1][1]) pts.push([x1, throughY]);
        pts.push([wp.x1, throughY]);  // Left edge
        pts.push([exitX, throughY]);  // Exit point
      } else if (x1 > wp.x2) {
        // Entering from right - route to right edge, across, to left edge
        if (throughY !== pts[pts.length - 1][1]) pts.push([x1, throughY]);
        pts.push([wp.x2, throughY]);  // Right edge
        pts.push([exitX, throughY]);  // Exit point
      } else {
        // Already inside channel horizontally
        pts.push([exitX, throughY]);
      }

      // Exit to destination
      if (throughY !== y2) {
        pts.push([exitX, y2]);
      }
      if (exitX !== x2) {
        pts.push([x2, y2]);
      }
    } else {
      // Vertical flow through channel
      // Determine optimal X position within channel
      const entryX = Math.max(wp.x1, Math.min(wp.x2, x1));
      const exitX = Math.max(wp.x1, Math.min(wp.x2, x2));
      let throughX = (entryX + exitX) / 2;

      // Apply bundling offset (perpendicular to flow direction)
      throughX += lineOffset;
      throughX = Math.max(wp.x1, Math.min(wp.x2, throughX));  // Keep within bounds

      // Move to channel entry
      if (x1 !== throughX) {
        pts.push([throughX, y1]);
      }

      // Vertical segment through channel
      const enterY = Math.max(wp.y1, Math.min(wp.y2, y1));
      const exitY = Math.max(wp.y1, Math.min(wp.y2, y2));

      if (y1 < wp.y1) {
        // Entering from top
        if (throughX !== pts[pts.length - 1][0]) pts.push([throughX, y1]);
        pts.push([throughX, wp.y1]);  // Top edge
        pts.push([throughX, exitY]);  // Exit point
      } else if (y1 > wp.y2) {
        // Entering from bottom
        if (throughX !== pts[pts.length - 1][0]) pts.push([throughX, y1]);
        pts.push([throughX, wp.y2]);  // Bottom edge
        pts.push([throughX, exitY]);  // Exit point
      } else {
        // Already inside channel vertically
        pts.push([throughX, exitY]);
      }

      // Exit to destination
      if (throughX !== x2) {
        pts.push([x2, exitY]);
      }
      if (exitY !== y2) {
        pts.push([x2, y2]);
      }
    }

    // Ensure we end at destination
    if (pts[pts.length - 1][0] !== x2 || pts[pts.length - 1][1] !== y2) {
      pts.push([x2, y2]);
    }

    // Remove duplicate points
    const cleaned = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const last = cleaned[cleaned.length - 1];
      if (pts[i][0] !== last[0] || pts[i][1] !== last[1]) {
        cleaned.push(pts[i]);
      }
    }

    const d = this._polylineToPath(cleaned);
    const channelInfo = this._channelDelta(cleaned, req);

    return {
      d,
      pts: cleaned,
      meta: {
        strategy: 'waypoint-detour',
        cost: this._costSimple(cleaned),
        segments: cleaned.length - 1,
        bends: Math.max(0, cleaned.length - 2),
        waypoint: {
          id: wp.id,
          direction: detourDirection, // Use actual detour direction, not channel direction
          center: [wp.cx, wp.cy],
          natural: false  // Had to force detour to maintain direction
        },
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

  /**
   * Manhattan routing supporting independent first and last segment hints.
   * @param {object} req - Route request with modeHint and modeHintLast
   */
  _computeManhattan(req) {
    const [x1, y1] = req.a;
    const [x2, y2] = req.b;
    const firstMode = (req.modeHint === 'yx') ? 'yx' : 'xy';
    const lastMode  = (req.modeHintLast === 'yx') ? 'yx' : 'xy';
    let pts;
    if (x1 === x2 || y1 === y2) {
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
          weight: Number(c.weight || c.w || 0.5),
          mode,  // 'prefer', 'avoid', or 'force'
          direction,  // 'horizontal' or 'vertical'
          line_spacing: Number(c.line_spacing ?? 8)  // Gap between bundled lines
        };
      });
  }

  /**
   * Calculate channel influence on route cost
   * Supports bundling (prefer), avoiding, force, and waypoint channel types
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
          lcardsLog.debug(`[RouterCore] Route '${req.id}' missed forced channel '${chan.id}'`);
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

    const channelInfo = this._channelDelta(bestPts, req);
    // Channel shaping (only prefer/force & if coverage below target)
    let shapingMeta = null;

    // Check if any of the line's referenced channels have prefer or force mode
    const referencedChannels = req.channels?.length ? this._channels.filter(c => req.channels.includes(c.id)) : [];
    const hasPreferOrForce = referencedChannels.some(c => c.mode === 'prefer' || c.mode === 'force');
    const hasForce = referencedChannels.some(c => c.mode === 'force');

    if (hasPreferOrForce) {
      const desired = hasForce ? 1.0 : this._channelTargetCoverage;
      if (channelInfo.coverage < desired) {
        const shapeRes = this._shapeForChannels(req, bestPts, channelInfo, desired);
        if (shapeRes && shapeRes.accepted) {
          bestPts = shapeRes.pts;
          // recompute penalties
          const newChan = this._channelDelta(bestPts, req);
          const { penalty: newProx } = this._segmentProximityPenalty(bestPts, req.clearance, req.proximity, proxW);
            bestPenalty = newProx; // proximity might change slightly (rare) – reassign
          shapingMeta = shapeRes.meta;
          // recompute cost with new channel delta
          bestCost = this._costComposite(bestPts, bendW, proxW, bestPenalty, newChan.delta);
          // overwrite channelInfo for meta
          channelInfo.inside = newChan.inside;
          channelInfo.outside = newChan.outside;
          channelInfo.coverage = newChan.coverage;
          channelInfo.delta = newChan.delta;
          channelInfo.forcedOutside = newChan.forcedOutside;
        } else if (shapeRes) {
          shapingMeta = shapeRes.meta;
        }
      }
    }
    // REPLACED duplicate const bestCost decl with in-place update earlier
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
        forcedOutside: channelInfo.forcedOutside,
        ...(shapingMeta ? { shaping: shapingMeta } : {})
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
      // If a->b and b->c are collinear, skip b
      if ((a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1])) continue;
      out.push(b);
    }
    out.push(pts[pts.length-1]);
    return out;
  }

  _shapeForChannels(req, pts, channelInfo, desiredCoverage) {
    const attemptsMax = this._channelShapingMaxAttempts;
    const span = this._channelShapingSpan;
    const minGain = this._channelMinCoverageGain;
    const chanIds = new Set(req.channels);
    const chans = this._channels.filter(c => chanIds.has(c.id));
    if (!chans.length) return null;

    const coverage0 = channelInfo.coverage;
    let bestPts = pts.slice();
    let bestCoverage = coverage0;
    let accepted = false;
    let attempts = 0;
    let coverageHistory = [Number(coverage0.toFixed(4))];
    const referencedChannels = req.channels?.length ? this._channels.filter(c => req.channels.includes(c.id)) : [];
    const forceMode = referencedChannels.some(c => c.mode === 'force');

    function midpoint(a,b){ return [(a[0]+b[0])/2,(a[1]+b[1])/2]; }
    const inAny = (x,y)=>chans.some(c=> x>=c.x1 && x<=c.x2 && y>=c.y1 && y<=c.y2);

    const segsOutside = () => {
      const list = [];
      for (let i=1;i<bestPts.length;i++){
        const a=bestPts[i-1], b=bestPts[i];
        const len=Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1]);
        if(!len) continue;
        const [mx,my]=midpoint(a,b);
        if(!inAny(mx,my)) list.push({i,len,a,b,mx,my});
      }
      return list.sort((x,y)=>y.len-x.len);
    };

    while (attempts < attemptsMax) {
      attempts++;
      const outsideSegs = segsOutside();
      if (!outsideSegs.length) break; // fully inside
      // pick the largest outside segment
      const seg = outsideSegs[0];
      // Try shifting its interior elbow(s) if any
      // Identify candidate elbow indices around this segment
      const elbowIndices = [];
      if (seg.i-1 > 0) elbowIndices.push(seg.i-1);
      if (seg.i < bestPts.length-1) elbowIndices.push(seg.i);

      let improved = false;
      for (const ei of elbowIndices) {
        const copy = bestPts.map(p=>p.slice());
        // shift target elbow towards nearest channel center
        const e = copy[ei];
        // Compute shortest move vector to enter any channel (axis aligned)
        let bestMove = null;
        let bestMoveDist = Infinity;
        chans.forEach(c => {
          // For a point outside, compute minimal axis step into rect
            const dx = (e[0] < c.x1) ? (c.x1 - e[0]) :
                       (e[0] > c.x2) ? (c.x2 - e[0]) : 0;
            const dy = (e[1] < c.y1) ? (c.y1 - e[1]) :
                       (e[1] > c.y2) ? (c.y2 - e[1]) : 0;
          // Only consider moving along one axis per attempt (choose smaller non-zero)
          if (dx !==0 && dy !==0) {
            // pick smaller
            if (Math.abs(dx) < Math.abs(dy)) {
              if (Math.abs(dx) < bestMoveDist) { bestMoveDist = Math.abs(dx); bestMove = [dx,0]; }
            } else {
              if (Math.abs(dy) < bestMoveDist) { bestMoveDist = Math.abs(dy); bestMove = [0,dy]; }
            }
          } else if (dx !==0 || dy !==0) {
            const d = Math.abs(dx||dy);
            if (d < bestMoveDist) { bestMoveDist = d; bestMove = [dx,dy]; }
          }
        });
        if (!bestMove) continue;
        // scale move to span (limit)
        const mv = [
          bestMove[0] === 0 ? 0 : Math.sign(bestMove[0]) * Math.min(Math.abs(bestMove[0]), span),
          bestMove[1] === 0 ? 0 : Math.sign(bestMove[1]) * Math.min(Math.abs(bestMove[1]), span)
        ];
        copy[ei] = [e[0] + mv[0], e[1] + mv[1]];
        // Compact polyline if collinear introduced
        const compact = this._compactPolyline(copy);
        const newChan = this._channelDelta(compact, req);
        const gain = newChan.coverage - bestCoverage;
        if (gain >= minGain) {
          bestPts = compact;
          bestCoverage = newChan.coverage;
          coverageHistory.push(Number(bestCoverage.toFixed(4)));
          improved = true;
          if (forceMode && bestCoverage >= 0.999) break;
          if (!forceMode && bestCoverage >= desiredCoverage) break;
        }
      }
      if (!improved) break;
      if ((forceMode && bestCoverage >= 0.999) || (!forceMode && bestCoverage >= desiredCoverage)) {
        accepted = true;
        break;
      }
    }

    // Force downgrade if still outside & force mode
    let downgraded = false;
    if (forceMode && bestCoverage < 0.999) {
      downgraded = true;
      // mark but caller meta will keep mode=force + forcedOutside flag (HUD can show downgrade)
    }

    return {
      accepted,
      pts: bestPts,
      meta: {
        attempts,
        coverageBefore: Number(coverage0.toFixed(4)),
        coverageAfter: Number(bestCoverage.toFixed(4)),
        coverageHistory,
        accepted,
        downgraded
      }
    };
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
      let r = Math.min(radiusGlobal, lenIn / 2, lenOut / 2);
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
