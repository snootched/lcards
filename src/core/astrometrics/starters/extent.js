/**
 * @fileoverview How big a scene (or a starter's fragment) is, read from the
 * config alone: the radius round the origin that holds its points and
 * objects. An estimate (no three.js, no rotations): a point on an object is
 * as far out as the object's place plus its own distance; an object reaches
 * its place plus its radius (or half its size or length). Points only there
 * to aim at (a light, a facing: no label, no marker, nothing placed on them)
 * do not count. Used to size a part
 * to the scene it goes into when that scene's units have no name.
 */

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);
const num = (/** @type {any} */ v) => (Number.isFinite(Number(v)) ? Math.abs(Number(v)) : 0);
const len = (/** @type {any[]} */ v) => Math.hypot(...v.slice(0, 3).map(num));

/**
 * An object's own reach round its place: its radius, or half its largest size or length.
 * @param {Record<string, any>} o
 */
export function objectReach(o) {
  const size = Array.isArray(o.size) ? Math.max(0, ...o.size.map(num)) : num(o.size);
  // a sector volume's radius is [inner, outer]
  const radius = Array.isArray(o.radius) ? Math.max(0, ...o.radius.map(num)) : num(o.radius);
  return Math.max(radius, size / 2, num(o.length) / 2);
}

/**
 * The radius round the origin a list of points and objects fills, in its own units.
 * Objects inside a system count by the system's place only (they are in its units).
 * @param {{ points?: any[], objects?: any[] } | null | undefined} lists
 * @returns {number} 0 when there is nothing in it
 */
export function sceneExtent(lists) {
  const points = Array.isArray(lists?.points) ? lists.points.filter(isObj) : [];
  const objects = Array.isArray(lists?.objects) ? lists.objects.filter(isObj) : [];
  const pointById = new Map(points.filter((p) => p.id !== undefined).map((p) => [String(p.id), p]));
  const objectById = new Map(objects.filter((o) => o.id !== undefined).map((o) => [String(o.id), o]));
  /** @type {Map<any, number>} */
  const memo = new Map();
  /** @type {Set<any>} */
  const busy = new Set();

  /** How far a point is from the origin @param {any} p @returns {number} */
  const pointDist = (p) => {
    if (memo.has(p)) return /** @type {number} */ (memo.get(p));
    if (busy.has(p)) return 0;
    busy.add(p);
    let d = 0;
    // a point on an object sits round the object's place
    const host = typeof p.object === 'string' ? objectById.get(p.object) : undefined;
    const base = host ? placeDist(host) : 0;
    if (Array.isArray(p.xyz)) d = base + len(p.xyz);
    else if (Array.isArray(p.polar)) d = base + num(p.polar[0]);
    else if (host) d = base + objectReach(host);
    d += num(p.alt) + (Array.isArray(p.offset) ? len(p.offset) : 0);
    busy.delete(p);
    memo.set(p, d);
    return d;
  };

  /** How far an object's place is from the origin @param {any} o @returns {number} */
  const placeDist = (o) => {
    if (memo.has(o)) return /** @type {number} */ (memo.get(o));
    if (busy.has(o)) return 0;
    busy.add(o);
    let d = 0;
    if (Array.isArray(o.at)) d = len(o.at);
    else if (typeof o.at === 'string' && pointById.has(o.at)) d = pointDist(pointById.get(o.at));
    busy.delete(o);
    memo.set(o, d);
    return d;
  };

  // points something stands on (an object's or a point's `at`)
  const hosts = new Set([...objects, ...points].map((x) => x.at).filter((at) => typeof at === 'string'));
  const shown = (/** @type {any} */ p) => p.id === undefined || p.label !== undefined || p.marker !== undefined || hosts.has(String(p.id));
  let r = 0;
  for (const p of points) if (shown(p)) r = Math.max(r, pointDist(p));
  for (const o of objects) r = Math.max(r, placeDist(o) + (o.type === 'system' ? 0 : objectReach(o)));
  return r;
}
