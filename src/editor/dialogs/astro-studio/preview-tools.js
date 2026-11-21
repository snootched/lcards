/**
 * @fileoverview The Astrometrics Studio's preview tools (pure, unit tested):
 * the measure tool's text, the isolate filter on the preview's config, the
 * quick views and the preview's look. Nothing here is saved: the Studio
 * applies them to the preview only.
 */

import { UNITS } from '../../../core/astrometrics/names.js';
import { sceneObjectIds } from './systems.js';

/** Quick views, in the order the toolbar button steps through them (orthographic, round where the camera looks) */
export const QUICK_VIEWS = /** @type {const} */ ([
  { name: 'top', label: 'Top', yaw: 0, tilt: 90 },
  { name: 'front', label: 'Front', yaw: 0, tilt: 0 },
  { name: 'side', label: 'Side', yaw: 90, tilt: 0 }
]);

/**
 * A quick view's keys round the camera now (`cameraKeys`: target in scene
 * units, distance, lens).
 * @param {number} index - in QUICK_VIEWS
 * @param {{ target: number[], distance: number, fov: number }} now
 */
export function quickViewKeys(index, now) {
  const v = QUICK_VIEWS[index];
  return { target: now.target, distance: now.distance, fov: now.fov, yaw: v.yaw, tilt: v.tilt, projection: 'orthographic' };
}

/** The preview's look override, in the order the toolbar button steps through them (null: as the card says) */
export const PREVIEW_LOOKS = /** @type {const} */ ([null, 'diagram', 'realistic', 'mixed']);

/**
 * The next look after `look` on the toolbar button.
 * @param {string | null} look
 * @returns {string | null}
 */
export function nextLook(look) {
  const i = PREVIEW_LOOKS.indexOf(/** @type {any} */ (look));
  return PREVIEW_LOOKS[(i + 1) % PREVIEW_LOOKS.length];
}

/** @param {number} v */
const sig = (v) => {
  const a = Math.abs(v);
  if (a >= 1e6) {
    for (const [n, word] of /** @type {const} */ ([[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million']])) {
      if (a >= n) return `${Number((v / n).toPrecision(3)).toLocaleString('en-US')} ${word}`;
    }
  }
  return Number(v.toPrecision(3)).toLocaleString('en-US');
};

/** Named units from small to large: a length is also shown in its unit's neighbour (m is never the other) */
const LADDER = /** @type {const} */ (['m', 'km', 'au', 'ly', 'pc']);

/**
 * The measure tool's text: the distance from a to b in the scope's units,
 * and once more in the next smaller named unit (else the next larger) when
 * that reads well (0.01 to a billion), e.g. `4.2 ly (266,000 au)`,
 * `1 au (150 million km)`.
 * @param {number[]} a
 * @param {number[]} b
 * @param {string | undefined} units - the scope's (m, km, au, ly, pc), or none: scene units
 */
export function measureText(a, b, units) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const i = LADDER.indexOf(/** @type {any} */ (units));
  if (i < 0) return `${sig(d)} ${units || 'scene units'}`;
  const metres = d * UNITS[LADDER[i]];
  const also = [LADDER[i - 1], LADDER[i + 1]]
    .filter((u) => u !== undefined && u !== 'm')
    .map((u) => /** @type {const} */ ([u, metres / UNITS[u]]))
    .find(([, v]) => v >= 0.01 && v < 1e9);
  return `${sig(d)} ${units}${also ? ` (${sig(also[1])} ${also[0]})` : ''}`;
}

/**
 * The preview's config with every object but `id` hidden (`visible:
 * false`); a system holding it stays, with its other objects hidden.
 * Points stay. Unknown ids leave the config as it is.
 * @param {any} config
 * @param {string} id - as the scene names it (`sceneObjectIds`)
 */
export function isolateConfig(config, id) {
  const objects = Array.isArray(config?.objects) ? config.objects : [];
  const ids = sceneObjectIds(config);
  const hide = (/** @type {any} */ o) => (o && typeof o === 'object' ? { ...o, visible: false } : o);
  let found = false;
  const next = objects.map((o, i) => {
    if (ids.scene[i] === id) {
      found = true;
      return o;
    }
    const inside = ids.systems.get(i);
    if (inside) {
      const at = inside.indexOf(id);
      if (at >= 0) found = true;
      const kids = Array.isArray(o.objects) ? o.objects.map((k, j) => (j === at ? k : hide(k))) : o.objects;
      return { ...o, objects: kids, ...(at >= 0 ? {} : { visible: false }) };
    }
    return hide(o);
  });
  return found ? { ...config, objects: next } : config;
}
