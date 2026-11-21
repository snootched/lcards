/**
 * @fileoverview The Astrometrics Studio's camera views (pure, unit tested).
 *
 * A view is captured from the preview's camera keys: the target is written as
 * a point id when the camera looks at a point (after a fly-to it does), else
 * as coordinates. Views keep their YAML order, so moving one rebuilds the map.
 * Renaming a view also renames what flies to it: `camera.view` and every
 * `action: fly-to` with `view:` on this card (not those with `card:`, which
 * fly another card's camera).
 */

/** Default field of view (camera-rig DEFAULT_KEYS.fov): not written when unchanged */
const DEFAULT_FOV = 40;
/** How near a point the camera target must be to be written as its id, scene units (keys are rounded to 0.1) */
const POINT_SNAP = 0.1;

const isObj = (/** @type {any} */ v) => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * The views map of a camera config (never null).
 * @param {any} camera
 * @returns {Record<string, any>}
 */
export function viewsOf(camera) {
  return isObj(camera) && isObj(camera.views) ? camera.views : {};
}

/**
 * The name of the view the card starts on: camera.view, else the first.
 * @param {any} camera
 * @returns {string | undefined}
 */
export function startViewName(camera) {
  const views = viewsOf(camera);
  const name = camera?.view;
  return name !== undefined && views[name] ? String(name) : Object.keys(views)[0];
}

/**
 * The id of the point at a position, nearest first, or null.
 * @param {number[]} target
 * @param {Record<string, number[]>} positions
 * @returns {string | null}
 */
export function pointAt(target, positions) {
  let best = null;
  let bestDist = POINT_SNAP;
  for (const [id, p] of Object.entries(positions)) {
    const d = Math.hypot(p[0] - target[0], p[1] - target[1], p[2] - target[2]);
    if (d <= bestDist) {
      best = id;
      bestDist = d;
    }
  }
  return best;
}

/**
 * A view from the camera now. Over an existing view its other keys (warp)
 * stay; fov is written when it differs from the default or was already set.
 * @param {{ target: number[], yaw: number, tilt: number, distance: number, fov: number, projection: string }} keys
 * @param {Record<string, number[]>} positions - point positions (scene pointPositions)
 * @param {Record<string, any>} [previous]
 * @returns {Record<string, any>}
 */
export function captureView(keys, positions, previous = {}) {
  const { fov: _fov, projection: _projection, ...kept } = isObj(previous) ? previous : {};
  /** @type {Record<string, any>} */
  const view = { ...kept, target: pointAt(keys.target, positions) ?? keys.target, yaw: keys.yaw, tilt: keys.tilt, distance: keys.distance };
  if (keys.projection === 'orthographic') view.projection = 'orthographic';
  else if (keys.fov !== DEFAULT_FOV || previous?.fov !== undefined) view.fov = keys.fov;
  return view;
}

/**
 * A free view name (view1, view2, ...).
 * @param {Record<string, any>} views
 */
export function freshViewName(views) {
  let n = 1;
  while (`view${n}` in views) n++;
  return `view${n}`;
}

/**
 * A camera config with views replaced (camera left out when nothing is left).
 * @param {any} camera
 * @param {Record<string, any>} views
 * @returns {Record<string, any> | undefined}
 */
export function withViews(camera, views) {
  const next = { ...(isObj(camera) ? camera : {}) };
  if (Object.keys(views).length) next.views = views;
  else delete next.views;
  if (next.view !== undefined && !(next.view in views)) delete next.view;
  return Object.keys(next).length ? next : undefined;
}

/**
 * Add a view or replace one, keeping the order.
 * @param {any} camera
 * @param {string} name
 * @param {Record<string, any>} view
 */
export function setView(camera, name, view) {
  return withViews(camera, { ...viewsOf(camera), [name]: view });
}

/**
 * Remove a view (camera.view goes with it).
 * @param {any} camera
 * @param {string} name
 */
export function deleteView(camera, name) {
  const { [name]: _gone, ...rest } = viewsOf(camera);
  return withViews(camera, rest);
}

/**
 * Move a view up (-1) or down (1).
 * @param {any} camera
 * @param {string} name
 * @param {number} delta
 */
export function moveView(camera, name, delta) {
  const entries = Object.entries(viewsOf(camera));
  const i = entries.findIndex(([k]) => k === name);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= entries.length) return withViews(camera, viewsOf(camera));
  [entries[i], entries[j]] = [entries[j], entries[i]];
  return withViews(camera, Object.fromEntries(entries));
}

/**
 * Why a name cannot be used for a view, or null.
 * @param {Record<string, any>} views
 * @param {string} name
 * @param {string} [current] - the view being renamed
 */
export function viewNameProblem(views, name, current) {
  if (!name.trim()) return 'A view needs a name.';
  if (name !== current && name in views) return `There is already a view named ${name}.`;
  return null;
}

/**
 * Rename a view in a whole card config: the views key (same place in the
 * order), camera.view, and this card's fly-to actions that name it.
 * @param {Record<string, any>} config
 * @param {string} from
 * @param {string} to
 * @returns {Record<string, any>}
 */
export function renameView(config, from, to) {
  if (from === to) return config;
  const camera = config.camera;
  const views = Object.fromEntries(Object.entries(viewsOf(camera)).map(([k, v]) => [k === from ? to : k, v]));
  const next = renameFlyTo({ ...config }, from, to);
  next.camera = { ...withViews(camera, views), ...(camera?.view === from ? { view: to } : {}) };
  return next;
}

/**
 * @param {any} value
 * @param {string} from
 * @param {string} to
 * @returns {any}
 */
function renameFlyTo(value, from, to) {
  if (Array.isArray(value)) return value.map((v) => renameFlyTo(v, from, to));
  if (!isObj(value)) return value;
  /** @type {Record<string, any>} */
  const out = {};
  for (const [k, v] of Object.entries(value)) out[k] = k === 'camera' ? v : renameFlyTo(v, from, to);
  if (out.action === 'fly-to' && out.view === from && out.card === undefined) out.view = to;
  return out;
}

/**
 * One line about a view: target, then the angles.
 * @param {any} view
 */
export function viewSummary(view) {
  if (!isObj(view)) return '';
  const r = (/** @type {any} */ v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v);
  const target = Array.isArray(view.target) ? view.target.map(r).join(', ') : view.target;
  return [
    target !== undefined ? `at ${target}` : null,
    view.yaw !== undefined ? `yaw ${r(view.yaw)}` : null,
    view.tilt !== undefined ? `tilt ${r(view.tilt)}` : null,
    view.distance !== undefined ? `distance ${r(view.distance)}` : null,
    view.projection === 'orthographic' ? 'flat' : null
  ].filter(Boolean).join(' · ');
}
