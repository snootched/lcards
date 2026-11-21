/**
 * anime.js adapter for background effects.
 *
 * Teaches anime.js (4.5 `registerAdapter`, from the `animejs/adapters`
 * sub-path, which shares the core registry with `animate`) to read and write
 * the parameters of an EffectHandle. Everything anime.js has then works on a
 * background: easing, springs, timelines, `revert()` (which puts parameters
 * back through the same setters), and so LCARdS triggers, rules and the
 * reduced-motion gate.
 *
 * The getter returns a number or a concrete colour string; for a colour,
 * anime.js hands the setter `undefined` and the channels in
 * `tween._numbers` (`[r, g, b, a]`), turned back into `rgba()` here.
 *
 * @module core/packs/backgrounds/effect-adapter
 */
import { registerAdapter } from 'animejs/adapters';
import { isEffectHandle } from './effect-handle.js';

let _registered = false;

/** @type {Map<string, { get: (t: any) => any, set: (t: any, v: any, tween: any) => void }>} */
const _entries = new Map();

/**
 * @param {number[]} n - `[r, g, b, a]`
 * @returns {string}
 */
export function rgbaFromNumbers(n) {
  const c = (/** @type {number} */ v) => Math.max(0, Math.min(255, Math.round(v)));
  const a = n[3] === undefined ? 1 : Math.max(0, Math.min(1, n[3]));
  return `rgba(${c(n[0])}, ${c(n[1])}, ${c(n[2])}, ${Math.round(a * 1000) / 1000})`;
}

/**
 * @param {string} name
 */
function entryFor(name) {
  let entry = _entries.get(name);
  if (!entry) {
    entry = {
      get: (t) => t.getProp(name),
      set: (t, v, tween) => t.setProp(name, v === undefined && tween?._numbers ? rgbaFromNumbers(tween._numbers) : v)
    };
    _entries.set(name, entry);
  }
  return entry;
}

/**
 * Register the adapter once (idempotent). Called from lcards-main.js.
 */
export function registerEffectAdapter() {
  if (_registered) return;
  _registered = true;
  const adapter = registerAdapter(isEffectHandle);
  adapter.registerPropertyResolver((target, name) => (target.has(name) ? entryFor(name) : null));
}

/** anime.js parameters that are timing or playback, not effect properties */
export const EFFECT_TIMING_KEYS = new Set([
  'duration', 'delay', 'ease', 'loop', 'loopDelay', 'alternate', 'reversed', 'autoplay',
  'playbackRate', 'playbackEase', 'frameRate', 'composition', 'modifier',
  'onBegin', 'onComplete', 'onUpdate', 'onLoop', 'onPause', 'onRender', 'onBeforeUpdate'
]);
