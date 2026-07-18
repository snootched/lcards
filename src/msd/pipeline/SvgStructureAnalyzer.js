/**
 * @fileoverview SvgStructureAnalyzer — derives MSD-ready structure from an
 * existing base_svg's own rendered silhouette: landmark anchor points and an
 * offset "shield bubble" boundary. Pure geometry over a rasterized mask, no
 * photographic noise to fight since the source is already clean vector art
 * (ported from the validated tools/svg-enhancer-poc/ prototype).
 *
 * Two cache tiers, both in-memory only (no localStorage/backend — deferred
 * per explicit decision): the rasterized mask (the expensive, shared step,
 * keyed by SVG content hash) and the shield-bubble boundary (a more
 * expensive derivation on top, keyed by content hash + its own params, since
 * re-tuning a slider in the Studio dialog re-requests the same params
 * repeatedly). Anchors are cheap enough on top of a cached mask to recompute
 * each call rather than needing their own cache tier.
 */

import { computeObjectHash } from '../../utils/hashing.js';
import { lcardsLog } from '../../utils/lcards-logging.js';

const MAX_DIMENSION = 960;
const MAX_CACHE_ENTRIES = 64;
// Morphological closing (dilate then erode by the same radius) applied to
// every mask before anchor/shield-bubble analysis. Bridges small internal
// gaps (greebles, portholes, and - critically - dense multi-element
// illustrations like a deck-plan cutaway, where dozens of disconnected
// shapes at every cross-section otherwise defeat the column-run heuristic
// entirely) without growing the true outer edge. Validated empirically
// against both a simple twin-nacelle hull (confirmed this radius does NOT
// merge the two nacelles into one blob - that would silently break
// lateral_a/b) and a complex cutaway illustration (confirmed it recovers a
// clean, traceable outer silhouette). Not yet scaled/tunable per-asset -
// both validated cases were close in scale, revisit if a very
// differently-scaled asset needs different treatment.
const CLOSING_RADIUS = 14;

const _maskCache = new Map();
const _maskCacheOrder = [];
const _shieldCache = new Map();
const _shieldCacheOrder = [];

function cacheSet(map, order, key, value) {
  map.set(key, value);
  order.push(key);
  if (order.length > MAX_CACHE_ENTRIES) {
    const oldest = order.shift();
    if (oldest) map.delete(oldest);
  }
}

function rasterDimensions(viewBox) {
  const [, , vw, vh] = viewBox;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(vw, vh));
  return { W: Math.max(1, Math.round(vw * scale)), H: Math.max(1, Math.round(vh * scale)) };
}

function rasterizeToMaskData(svgContent, W, H) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        // Known solid backdrop: anything drawn over it is foreground, no
        // color-distance/background-sampling needed (unlike a raster photo).
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, 0, 0, W, H);
        const { data } = ctx.getImageData(0, 0, W, H);
        resolve(data);
      } catch (e) {
        reject(e);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('[SvgStructureAnalyzer] Failed to rasterize SVG content'));
    };
    img.src = url;
  });
}

function buildMask(rgba, W, H) {
  const mask = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    mask[i] = (rgba[o] > 12 || rgba[o + 1] > 12 || rgba[o + 2] > 12) ? 1 : 0;
  }
  return mask;
}

async function getOrBuildMask(svgContent, viewBox) {
  const key = computeObjectHash(svgContent);
  const cached = _maskCache.get(key);
  if (cached) return cached;

  const { W, H } = rasterDimensions(viewBox);
  const rgba = await rasterizeToMaskData(svgContent, W, H);
  const rawMask = buildMask(rgba, W, H);
  // Closing bridges internal gaps (greebles on a simple hull; dozens of
  // disconnected elements on a complex cutaway illustration) without
  // growing the true outer edge; largest-connected-component then drops
  // anything still separate (stray marks, unrelated content elsewhere in
  // the canvas) so exactly one clean silhouette remains for everything
  // downstream (anchors AND shield-bubble) to work from.
  const mask = largestConnectedComponent(closeMask(rawMask, W, H, CLOSING_RADIUS), W, H);
  const entry = { mask, W, H };
  cacheSet(_maskCache, _maskCacheOrder, key, entry);

  // Debug aid: reports what fraction of the raster the foreground mask
  // actually covers, and its bounding box as a fraction of the full canvas,
  // AFTER closing/largest-component (i.e. what anchor/shield-bubble analysis
  // actually sees). If a multi-group SVG only partially rasterizes (a real,
  // seen-in-practice failure mode for complex files with many <use>/gradient
  // refs loaded via a detached Blob URL), this bounding box reads as
  // suspiciously smaller than [0-1, 0-1] - compare against how much of the
  // image should be ship.
  let minX = W, maxX = -1, minY = H, maxY = -1, fgCount = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) continue;
      fgCount++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  lcardsLog.trace('[SvgStructureAnalyzer] Mask computed and cached', {
    W, H, cacheSize: _maskCache.size,
    foregroundFraction: +(fgCount / (W * H)).toFixed(3),
    boundingBoxFraction: fgCount > 0
      ? { x: [+(minX / W).toFixed(2), +(maxX / W).toFixed(2)], y: [+(minY / H).toFixed(2), +(maxY / H).toFixed(2)] }
      : null,
  });
  return entry;
}

function columnRuns(mask, W, H, x) {
  const runs = [];
  let start = -1;
  for (let y = 0; y <= H; y++) {
    const fg = y < H && mask[y * W + x] === 1;
    if (fg && start === -1) start = y;
    if (!fg && start !== -1) { runs.push([start, y - 1]); start = -1; }
  }
  return runs;
}

function rowRuns(mask, W, H, y) {
  const runs = [];
  let start = -1;
  for (let x = 0; x <= W; x++) {
    const fg = x < W && mask[y * W + x] === 1;
    if (fg && start === -1) start = x;
    if (!fg && start !== -1) { runs.push([start, x - 1]); start = -1; }
  }
  return runs;
}

function detectAnchors(mask, W, H) {
  let minX = W, maxX = -1, sumX = 0, sumY = 0, count = 0;
  const runsByX = [];
  for (let x = 0; x < W; x++) {
    const runs = columnRuns(mask, W, H, x);
    runsByX[x] = runs;
    if (runs.length) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      for (const [y0, y1] of runs) for (let y = y0; y <= y1; y++) { sumX += x; sumY += y; count++; }
    }
  }
  if (count === 0) return [];
  const centroid = { x: sumX / count, y: sumY / count };

  const bow = { x: maxX, y: (runsByX[maxX][0][0] + runsByX[maxX][0][1]) / 2 };
  const stern = { x: minX, y: (runsByX[minX][0][0] + runsByX[minX][0][1]) / 2 };

  // Same idea as bow/stern (the horizontal extremities), rotated 90°: the
  // topmost/bottommost points of the silhouette. Unlike lateral_a/b (which
  // only means something for a ship-hull-shaped twin structure), these
  // generalize to any closed silhouette - four extremities plus a center
  // gives usable attachment points on every side of an arbitrary shape.
  let minY = H, maxY = -1;
  const runsByY = [];
  for (let y = 0; y < H; y++) {
    const runs = rowRuns(mask, W, H, y);
    runsByY[y] = runs;
    if (runs.length) {
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const top = { x: (runsByY[minY][0][0] + runsByY[minY][0][1]) / 2, y: minY };
  const bottom = { x: (runsByY[maxY][0][0] + runsByY[maxY][0][1]) / 2, y: maxY };

  const twinXs = [];
  for (let x = minX; x <= maxX; x++) if (runsByX[x].length >= 2) twinXs.push(x);

  let lateralA = null, lateralB = null;
  if (twinXs.length) {
    const outerX = Math.abs(twinXs[0] - centroid.x) > Math.abs(twinXs[twinXs.length - 1] - centroid.x)
      ? twinXs[0] : twinXs[twinXs.length - 1];
    const sorted = [...runsByX[outerX]].sort((a, b) => a[0] - b[0]);
    lateralA = { x: outerX, y: (sorted[0][0] + sorted[0][1]) / 2 };
    lateralB = { x: outerX, y: (sorted[sorted.length - 1][0] + sorted[sorted.length - 1][1]) / 2 };
  }

  // Order matters for the dedup pass below: on designs where the twin
  // structure's own outer edge IS the bow/stern extremity (nacelles that
  // extend further than the hull body, e.g. ncc-1701-a), lateral_a/b and
  // extremity_bow/stern land on the same point. List laterals first so the
  // more specific name (lateral_a/b - "this is a twin-structure tip") wins
  // over the generic one, rather than whichever happened to be computed first.
  const raw = [
    lateralA && { id: 'lateral_a', ...lateralA },
    lateralB && { id: 'lateral_b', ...lateralB },
    { id: 'extremity_bow', ...bow },
    { id: 'extremity_stern', ...stern },
    { id: 'extremity_top', ...top },
    { id: 'extremity_bottom', ...bottom },
    { id: 'hull_center', ...centroid },
  ].filter(Boolean);

  const anchors = [];
  for (const a of raw) {
    const dup = anchors.find((b) => Math.hypot(a.x - b.x, a.y - b.y) < 6);
    if (!dup) anchors.push(a);
  }
  return anchors;
}

function dilate(mask, W, H, radius) {
  const out = new Uint8Array(W * H);
  const r2 = radius * radius;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (mask[y * W + x]) { out[y * W + x] = 1; continue; }
      let hit = false;
      for (let dy = -radius; dy <= radius && !hit; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > r2) continue;
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < W && yy < H && mask[yy * W + xx]) { hit = true; break; }
        }
      }
      out[y * W + x] = hit ? 1 : 0;
    }
  }
  return out;
}

// Same computation as dilate(), but yields back to the event loop every few
// rows instead of running as one uninterrupted O(W*H*radius^2) block. Used
// specifically for analyzeShieldBubble()'s dilate step, which (unlike
// closeMask()'s one-time, cached, fixed-small-radius dilate) re-runs at a
// user-controlled radius on every Preview click, over a raster padMask()
// already grew to accommodate that same radius - the cost compounds
// multiplicatively at high radius values and was measured to genuinely
// freeze the tab (not just "feel slow") for several seconds, blocking even
// devtools interaction. Yielding trades a bit of total wall-clock time for
// keeping the main thread responsive and letting the browser actually paint
// (the loading spinner) throughout, not just once before blocking.
async function dilateAsync(mask, W, H, radius) {
  const out = new Uint8Array(W * H);
  const r2 = radius * radius;
  const YIELD_EVERY_ROWS = 8;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (mask[y * W + x]) { out[y * W + x] = 1; continue; }
      let hit = false;
      for (let dy = -radius; dy <= radius && !hit; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > r2) continue;
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < W && yy < H && mask[yy * W + xx]) { hit = true; break; }
        }
      }
      out[y * W + x] = hit ? 1 : 0;
    }
    if (y % YIELD_EVERY_ROWS === 0) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }
  return out;
}

function erode(mask, W, H, radius) {
  const out = new Uint8Array(W * H);
  const r2 = radius * radius;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!mask[y * W + x]) { out[y * W + x] = 0; continue; }
      let allSet = true;
      for (let dy = -radius; dy <= radius && allSet; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (dx * dx + dy * dy > r2) continue;
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H || !mask[yy * W + xx]) { allSet = false; break; }
        }
      }
      out[y * W + x] = allSet ? 1 : 0;
    }
  }
  return out;
}

// Dilate then erode by the same radius ("closing"): bridges gaps smaller
// than ~2*radius apart without growing the true outer boundary outward,
// unlike dilation alone.
function closeMask(mask, W, H, radius) {
  return erode(dilate(mask, W, H, radius), W, H, radius);
}

// Embed a mask into a larger, zero-padded array of size (W+2*pad, H+2*pad).
// getOrBuildMask's mask is tight to the SVG's own native silhouette - zero
// margin - so dilating right up against its raster edge silently clips the
// growth exactly there, no matter how large a radius is requested. Shield-
// bubble analysis needs room to grow beyond the native artwork's own
// bounds (e.g. into a much larger custom view_box with space to spare), so
// it pads before dilating; anchor detection doesn't need this and keeps
// using the tight, shared, unpadded mask as-is.
function padMask(mask, W, H, pad) {
  const paddedW = W + pad * 2, paddedH = H + pad * 2;
  const out = new Uint8Array(paddedW * paddedH);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (mask[y * W + x]) out[(y + pad) * paddedW + (x + pad)] = 1;
    }
  }
  return { mask: out, W: paddedW, H: paddedH };
}

function largestConnectedComponent(mask, W, H) {
  const visited = new Uint8Array(W * H);
  let best = null, bestSize = 0;
  const stack = [];
  for (let start = 0; start < W * H; start++) {
    if (mask[start] !== 1 || visited[start]) continue;
    stack.length = 0;
    stack.push(start);
    visited[start] = 1;
    const component = [start];
    while (stack.length) {
      const idx = stack.pop();
      const x = idx % W, y = (idx / W) | 0;
      if (x > 0 && mask[idx - 1] === 1 && !visited[idx - 1]) { visited[idx - 1] = 1; stack.push(idx - 1); component.push(idx - 1); }
      if (x < W - 1 && mask[idx + 1] === 1 && !visited[idx + 1]) { visited[idx + 1] = 1; stack.push(idx + 1); component.push(idx + 1); }
      if (y > 0 && mask[idx - W] === 1 && !visited[idx - W]) { visited[idx - W] = 1; stack.push(idx - W); component.push(idx - W); }
      if (y < H - 1 && mask[idx + W] === 1 && !visited[idx + W]) { visited[idx + W] = 1; stack.push(idx + W); component.push(idx + W); }
    }
    if (component.length > bestSize) { bestSize = component.length; best = component; }
  }
  const out = new Uint8Array(W * H);
  if (best) for (const idx of best) out[idx] = 1;
  return out;
}

function findStart(mask, W, H) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (mask[y * W + x] === 1) return [x, y];
  return null;
}

// Moore-neighbor boundary tracing - simpler than marching squares, blocky
// but fine since this feeds an invisible/lightly-styled animation target.
function traceBoundary(mask, W, H, startX, startY) {
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const isFg = (x, y) => x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;
  const points = [];
  let cx = startX, cy = startY, dir = 6, iterations = 0;
  do {
    points.push([cx, cy]);
    let found = false;
    for (let i = 0; i < 8; i++) {
      const d = (dir + 6 + i) % 8;
      const [dx, dy] = dirs[d];
      if (isFg(cx + dx, cy + dy)) { cx += dx; cy += dy; dir = d; found = true; break; }
    }
    if (!found) break;
    iterations++;
  } while ((cx !== startX || cy !== startY) && iterations < W * H);
  return points;
}

function simplifyPolyline(points, tolerance) {
  if (points.length < 3 || tolerance <= 0) return points;
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [px, py] = out[out.length - 1];
    const [x, y] = points[i];
    if (Math.hypot(x - px, y - py) >= tolerance) out.push(points[i]);
  }
  return out;
}

function rasterToSvgPoint(x, y, viewBox, W, H) {
  const [vbX, vbY, vw, vh] = viewBox;
  return [vbX + (x * vw) / W, vbY + (y * vh) / H];
}

function anchorsFromMask(mask, W, H, viewBox) {
  const result = {};
  for (const a of detectAnchors(mask, W, H)) {
    result[a.id] = rasterToSvgPoint(a.x, a.y, viewBox, W, H);
  }
  return result;
}

function angleFromCentroidDeg(point, centroid) {
  return Math.atan2(point[1] - centroid.y, point[0] - centroid.x) * 180 / Math.PI;
}

// Same idea as RouterCore._computeManual's "remove duplicate consecutive
// points" pass - the seeded boundary point at a section's seam can land
// extremely close to (or exactly on top of) the adjacent raw data point.
function dedupeConsecutive(points) {
  const out = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [px, py] = out[out.length - 1];
    const [x, y] = points[i];
    if (Math.hypot(x - px, y - py) > 1e-6) out.push(points[i]);
  }
  return out;
}

export class SvgStructureAnalyzer {
  /**
   * @param {string} svgContent
   * @param {[number,number,number,number]} viewBox
   * @returns {Promise<Object<string,[number,number]>>} anchor name -> [x,y] in SVG viewBox space
   */
  static async analyzeAnchors(svgContent, viewBox) {
    if (!svgContent) return {};
    try {
      const { mask, W, H } = await getOrBuildMask(svgContent, viewBox);
      return anchorsFromMask(mask, W, H, viewBox);
    } catch (e) {
      lcardsLog.warn('[SvgStructureAnalyzer] Anchor computation failed, continuing without computed anchors', e);
      return {};
    }
  }

  /**
   * @param {string} svgContent
   * @param {[number,number,number,number]} viewBox
   * @param {{dilateRadius?: number, simplifyTolerance?: number}} [options]
   * @returns {Promise<Array<[number,number]>>} closed boundary points in SVG viewBox space
   */
  static async analyzeShieldBubble(svgContent, viewBox, { dilateRadius = 18, simplifyTolerance = 2 } = {}) {
    if (!svgContent) return [];
    const cacheKey = `${computeObjectHash(svgContent)}|r:${dilateRadius}|s:${simplifyTolerance}`;
    const cached = _shieldCache.get(cacheKey);
    if (cached) return cached;

    try {
      const { mask, W, H } = await getOrBuildMask(svgContent, viewBox);
      // Pad by the dilate radius (plus a small buffer so the boundary trace
      // has room to walk the fully-rounded dilation shape without hitting
      // the padded array's own edge and clipping it flat) - see padMask().
      const pad = Math.ceil(dilateRadius) + 4;
      const { mask: paddedMask, W: paddedW, H: paddedH } = padMask(mask, W, H, pad);
      const shieldMask = await dilateAsync(paddedMask, paddedW, paddedH, dilateRadius);
      const start = findStart(shieldMask, paddedW, paddedH);
      if (!start) return [];
      const raw = traceBoundary(shieldMask, paddedW, paddedH, start[0], start[1]);
      const simplified = simplifyPolyline(raw, simplifyTolerance);
      // Un-pad back to the original (native) raster's coordinate origin
      // before mapping to SVG space - rasterToSvgPoint's scale factor is
      // derived from the original W/H, not the padded dimensions.
      const points = simplified.map(([x, y]) => rasterToSvgPoint(x - pad, y - pad, viewBox, W, H));
      cacheSet(_shieldCache, _shieldCacheOrder, cacheKey, points);
      return points;
    } catch (e) {
      lcardsLog.warn('[SvgStructureAnalyzer] Shield-bubble computation failed', e);
      return [];
    }
  }

  /**
   * Split a closed boundary polyline (as returned by analyzeShieldBubble)
   * into N open sub-polylines of EQUAL ARC LENGTH along the already-traced
   * perimeter, each sharing an exact interpolated boundary point with its
   * neighbors so adjacent sections render with no visible gap between them.
   *
   * Deliberately arc-length-based, not angle-from-centroid-based (an earlier
   * version bucketed points by angle-from-centroid while walking the trace,
   * assuming that angle increases ~monotonically once per revolution - true
   * for a simple, roughly convex/star-shaped hull, but false for a strongly
   * non-convex one, e.g. twin nacelles on pylons far out to the sides: the
   * angle-from-centroid genuinely doubles back locally while tracing along a
   * nacelle's outer edge, which silently stitched unrelated, non-adjacent
   * arcs of the perimeter into the same "section" - confirmed via real
   * NCC-1701 output showing 300-600 unit teleport jumps within single
   * sections). Cutting by arc length instead has no such assumption to
   * violate: walking forward along a simple closed curve, distance traveled
   * only ever increases, so there is no "did it backtrack" ambiguity,
   * regardless of how non-convex the shape is.
   *
   * startAngleDeg (0 = +X axis, SVG/raster space y-down, increasing
   * clockwise) is used ONLY to choose which arc-length position section 0 is
   * CENTERED on - purely a labeling/orientation choice (e.g. so a caller's
   * "fore" section actually sits near the bow), entirely decoupled from how
   * section sizes are computed. In this file's own anchor convention
   * (detectAnchors above), extremity_bow sits at maxX - i.e. the bow/fore
   * direction is +X - so the default startAngleDeg=0 centers section 0 near
   * the bow, matching the 4-way 'fore' name a caller assigns to it.
   *
   * @param {Array<[number,number]>} closedPoints - ordered closed-loop boundary
   * @param {number} sectionCount - N >= 2
   * @param {{startAngleDeg?: number}} [options]
   * @returns {Array<Array<[number,number]>>} sectionCount open polylines, each
   *   with >= 2 points, ordered starting from startAngleDeg going clockwise;
   *   section i's last point === section (i+1) % N's first point (by value).
   */
  static splitBoundaryIntoSections(closedPoints, sectionCount, { startAngleDeg = 0 } = {}) {
    if (!Array.isArray(closedPoints) || !Number.isInteger(sectionCount) || sectionCount < 2 ||
        closedPoints.length < sectionCount * 2) {
      return [];
    }

    const n = closedPoints.length;
    let cx = 0, cy = 0;
    for (const [x, y] of closedPoints) { cx += x; cy += y; }
    const centroid = { x: cx / n, y: cy / n };

    // Per-segment lengths in original trace order (segLen[i] = distance from
    // closedPoints[i] to closedPoints[(i+1)%n]; segLen[n-1] is the closing
    // segment), and each point's cumulative arc-length position.
    const segLen = new Array(n);
    const cumAtIdx = new Array(n);
    let acc = 0;
    for (let i = 0; i < n; i++) {
      cumAtIdx[i] = acc;
      const a = closedPoints[i], b = closedPoints[(i + 1) % n];
      segLen[i] = Math.hypot(b[0] - a[0], b[1] - a[1]);
      acc += segLen[i];
    }
    const totalLength = acc;
    if (totalLength <= 0) return [];
    const sectionLength = totalLength / sectionCount;
    const mod = (v) => ((v % totalLength) + totalLength) % totalLength;

    // Pick the point whose angle-from-centroid is closest to startAngleDeg -
    // a pure labeling choice (section 0's arc-length center), unrelated to
    // how the actual cuts are computed below.
    let bowIdx = 0, bestDiff = Infinity;
    for (let i = 0; i < n; i++) {
      const diff = Math.abs(((angleFromCentroidDeg(closedPoints[i], centroid) - startAngleDeg + 540) % 360) - 180);
      if (diff < bestDiff) { bestDiff = diff; bowIdx = i; }
    }

    // Rotate the traversal to start exactly at section 0's own opening cut
    // (bowIdx's arc-length position, offset back by half a section) rather
    // than at closedPoints[0] (wherever traceBoundary()/findStart() happened
    // to begin) - same reasoning as the earlier angle-based version: the
    // slice active at the array's wrap point would otherwise get its closing
    // boundary computed before its opening one.
    const firstCut = mod(cumAtIdx[bowIdx] - sectionLength / 2);
    let rotateStart = 0;
    for (let i = 0; i < n; i++) {
      if (cumAtIdx[i] >= firstCut) { rotateStart = i; break; }
    }

    // Seed section 0's exact opening point once and reuse the identical
    // value as the closing point of whichever section is active at the very
    // end of the walk, guaranteeing they're exactly equal (not just close).
    const seedPrevIdx = (rotateStart - 1 + n) % n;
    const seedPrevLen = cumAtIdx[seedPrevIdx];
    const seedLen = cumAtIdx[rotateStart];
    const seedLenUnwrapped = seedLen < seedPrevLen ? seedLen + totalLength : seedLen;
    const seedStep = seedLenUnwrapped - seedPrevLen;
    const seedFrac = seedStep > 0 ? (mod(firstCut - seedPrevLen)) / seedStep : 0;
    const a0 = closedPoints[seedPrevIdx], b0 = closedPoints[rotateStart];
    const seedPt = [a0[0] + (b0[0] - a0[0]) * seedFrac, a0[1] + (b0[1] - a0[1]) * seedFrac];

    const sections = Array.from({ length: sectionCount }, () => []);
    let currentSlice = 0;
    sections[0].push(seedPt, closedPoints[rotateStart]);
    let cum = 0; // arc length walked since rotateStart, in this rotated frame - always increasing

    for (let k = 1; k < n; k++) {
      const idx = (rotateStart + k) % n;
      const prevIdx = (rotateStart + k - 1) % n;
      const stepLen = segLen[prevIdx];
      const prevCum = cum;
      cum += stepLen;

      // Walk every section boundary crossed within this one segment -
      // usually zero or one, but a very fine sectionCount relative to a long
      // segment can cross more than one.
      let boundary = (currentSlice + 1) * sectionLength;
      let guard = 0;
      while (boundary <= cum && guard++ <= sectionCount) {
        const frac = stepLen > 0 ? (boundary - prevCum) / stepLen : 0;
        const a = closedPoints[prevIdx], b = closedPoints[idx];
        const cutPt = [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
        const nextSlice = (currentSlice + 1) % sectionCount;
        sections[currentSlice].push(cutPt);
        sections[nextSlice].push(cutPt);
        currentSlice = nextSlice;
        boundary += sectionLength;
      }

      sections[currentSlice].push(closedPoints[idx]);
    }

    // Close the loop: whichever section is active after processing all
    // remaining points must end exactly back at seedPt (reused, not
    // recomputed, for exact equality with section 0's own first point).
    sections[currentSlice].push(seedPt);

    return sections.map(dedupeConsecutive);
  }
}
