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
      const shieldMask = dilate(mask, W, H, dilateRadius);
      const start = findStart(shieldMask, W, H);
      if (!start) return [];
      const raw = traceBoundary(shieldMask, W, H, start[0], start[1]);
      const simplified = simplifyPolyline(raw, simplifyTolerance);
      const points = simplified.map(([x, y]) => rasterToSvgPoint(x, y, viewBox, W, H));
      cacheSet(_shieldCache, _shieldCacheOrder, cacheKey, points);
      return points;
    } catch (e) {
      lcardsLog.warn('[SvgStructureAnalyzer] Shield-bubble computation failed', e);
      return [];
    }
  }
}
