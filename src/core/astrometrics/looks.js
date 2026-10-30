/**
 * Looks: one scene drawn as an LCARS diagram, realistically, or both. The
 * card's `look` (`diagram`, `realistic` or `mixed`, the default; or
 * `{ entity }` whose state names one) picks which objects and points show:
 * one with `look: diagram` shows in the diagram and mixed looks, one with
 * `look: realistic` in the realistic and mixed looks, one without a `look`
 * always. A wireframe wormhole and its glowing vortex, a wire globe and a
 * textured planet: each carries its look, and a switch crossfades them.
 *
 * Pure (no three.js): the runtime eases the weights and multiplies them in.
 *
 * @module core/astrometrics/looks
 */

/** The card's looks */
export const LOOKS = /** @type {const} */ (['diagram', 'realistic', 'mixed']);

/** What an object or point can belong to */
export const OBJECT_LOOKS = /** @type {const} */ (['diagram', 'realistic']);

/** How long a look change crossfades, ms */
export const LOOK_FADE_MS = 600;

/** @typedef {{ diagram: number, realistic: number }} LookWeights */

/**
 * A look from a config value or an entity's state (any case, spaces
 * trimmed); null when it names none.
 * @param {any} value
 * @returns {'diagram' | 'realistic' | 'mixed' | null}
 */
export function parseLook(value) {
  const s = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return /** @type {any} */ (LOOKS).includes(s) ? /** @type {any} */ (s) : null;
}

/**
 * How much of each object look shows under a card look (1 shown, 0 hidden).
 * @param {'diagram' | 'realistic' | 'mixed'} look
 * @returns {LookWeights}
 */
export function lookTargets(look) {
  return { diagram: look === 'realistic' ? 0 : 1, realistic: look === 'diagram' ? 0 : 1 };
}

/**
 * Move the weights toward their targets by `dt` ms of a `ms` fade (in place).
 * @param {LookWeights} w
 * @param {LookWeights} to
 * @param {number} dt
 * @param {number} [ms]
 * @returns {boolean} whether they are still moving
 */
export function stepLook(w, to, dt, ms = LOOK_FADE_MS) {
  const step = ms > 0 ? Math.max(0, dt) / ms : 1;
  let moving = false;
  for (const k of OBJECT_LOOKS) {
    const d = to[k] - w[k];
    if (d === 0) continue;
    w[k] = Math.abs(d) <= step ? to[k] : w[k] + Math.sign(d) * step;
    if (w[k] !== to[k]) moving = true;
  }
  return moving;
}

/**
 * The alpha a point's or object's `look` gives it under the weights.
 * @param {any} def - its config
 * @param {LookWeights} w
 */
export function lookAlpha(def, w) {
  const look = def?.look;
  return look === 'diagram' || look === 'realistic' ? w[look] : 1;
}
