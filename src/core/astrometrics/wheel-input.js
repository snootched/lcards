/**
 * Astrometrics wheel input: a mouse wheel, a touchpad's two-finger swipe and
 * a pinch all arrive as `wheel` events. This tells them apart, as map tools
 * do (Mapbox GL, OpenLayers), from the events themselves:
 *
 * - `ctrlKey`: a pinch (browsers send a touchpad pinch as ctrl+wheel; a mouse
 *   ctrl+wheel zooms too, which is what people expect).
 * - `deltaMode` lines or pages: a mouse wheel (Firefox).
 * - X movement without shift: a touchpad (wheels have no X; shift+wheel turns
 *   a wheel's Y into X on some systems).
 * - A per-notch step: wheelDeltaY a multiple of 120 (Chrome, Safari), or a
 *   delta a multiple of Firefox's 4.000244 macOS step, or a whole delta of 50
 *   px or more: a mouse wheel. Small or fractional deltas: a touchpad.
 *
 * One gesture keeps the kind of its first event until a pause (momentum
 * scrolling sends small tails after a big start). None of this is certain (a
 * high-resolution wheel can look like a touchpad), so `camera.wheel` can
 * force zoom or pan.
 *
 * @module core/astrometrics/wheel-input
 */

/** A pause this long (ms) ends a wheel gesture */
export const WHEEL_GESTURE_GAP_MS = 300;

/** @typedef {'mouse' | 'touchpad' | 'pinch'} WheelKind */

/**
 * @typedef {Object} WheelLike
 * @property {number} deltaX
 * @property {number} deltaY
 * @property {number} [deltaMode]
 * @property {boolean} [ctrlKey]
 * @property {boolean} [shiftKey]
 * @property {number} [wheelDeltaY] - non-standard (Chrome, Safari)
 */

/**
 * The device one wheel event came from, judged on its own.
 * @param {WheelLike} e
 * @returns {WheelKind}
 */
export function wheelKindOf(e) {
  if (e.ctrlKey) return 'pinch';
  if (e.deltaMode) return 'mouse';
  const dx = e.deltaX || 0;
  const dy = e.deltaY || 0;
  if (dx !== 0 && !e.shiftKey) return 'touchpad';
  const v = dy !== 0 ? dy : dx;
  if (v === 0) return 'touchpad';
  const legacy = e.wheelDeltaY;
  // a touchpad's legacy delta is -3 times its delta (so 40 px would pass as a notch)
  if (typeof legacy === 'number' && legacy !== 0 && legacy % 120 === 0 && legacy !== -3 * dy) return 'mouse';
  if (Math.abs(v % 4.000244140625) < 1e-6) return 'mouse';
  return Number.isInteger(v) && Math.abs(v) >= 50 ? 'mouse' : 'touchpad';
}

/**
 * Classify a wheel event within its gesture: a pinch is always a pinch, any
 * other event keeps the kind the gesture started with.
 * @param {WheelLike} e
 * @param {{ kind: WheelKind, t: number } | null} gesture - the gesture so far (null for none)
 * @param {number} now - ms
 * @returns {{ kind: WheelKind, t: number }} the gesture after this event
 */
export function classifyWheel(e, gesture, now) {
  const own = wheelKindOf(e);
  if (own === 'pinch') return { kind: 'pinch', t: now };
  if (gesture && gesture.kind !== 'pinch' && now - gesture.t < WHEEL_GESTURE_GAP_MS) return { kind: gesture.kind, t: now };
  return { kind: own, t: now };
}

/**
 * What a wheel event does, by its kind and `camera.wheel`.
 * @param {WheelKind} kind
 * @param {'auto' | 'zoom' | 'pan'} [mode]
 * @returns {'zoom' | 'pan'}
 */
export function wheelAction(kind, mode = 'auto') {
  if (kind === 'pinch') return 'zoom';
  if (mode === 'zoom' || mode === 'pan') return mode;
  return kind === 'touchpad' ? 'pan' : 'zoom';
}

/**
 * The distance factor of one zoom event: a mouse notch (100 px) about 10 %,
 * a pinch's small deltas faster so a pinch feels like one on a touch screen.
 * @param {WheelLike} e
 * @param {WheelKind} kind
 */
export function wheelZoomFactor(e, kind) {
  const lines = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1;
  const dy = (e.deltaY || 0) * lines;
  const rate = kind === 'pinch' && Math.abs(dy) < 50 ? 0.01 : 0.001;
  return Math.exp(Math.max(-1, Math.min(1, dy * rate)));
}
