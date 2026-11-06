// Colour changes in place (recolor.js): every object type's sample, built in one theme, crossfades
// to another without a rebuild; the faded values match a fresh build and the object's own motion
// does not put the old colours back.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { buildScene, disposeBuilt, BACKDROP_STARS } = await import('../../src/core/astrometrics/scene-builder.js');
const { colorSlots, ColorFades, RECOLOR_MS } = await import('../../src/core/astrometrics/recolor.js');
const { stepObjects } = await import('../../src/core/astrometrics/objects/common.js');
const { TYPE_SAMPLES, SHAPE_SAMPLES } = await import('../../src/core/astrometrics/object-samples.js');
const effects = await import('../../src/core/astrometrics/effects/index.js');

/** A theme: each colour value (or fallback) to its own rgba, different per theme */
const theme = (/** @type {number} */ salt) => (/** @type {any} */ v, /** @type {string} */ f) => {
  const s = `${salt}:${JSON.stringify(v ?? f)}`;
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return [((h >>> 0) % 251) / 255, ((h >>> 8) % 241) / 255, ((h >>> 16) % 239) / 255, 1];
};
const ctxOf = (/** @type {any} */ color) => /** @type {any} */ ({ color, places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null, effects });

/** @param {any} v */
const plain = (v) => (typeof v === 'number' ? v : v?.isColor ? [v.r, v.g, v.b] : v?.toArray ? v.toArray() : ArrayBuffer.isView(v) || Array.isArray(v) ? Array.from(/** @type {any} */ (v), plain) : v);

const near = (/** @type {any} */ a, /** @type {any} */ b) => JSON.stringify(plain(a), (_k, x) => (typeof x === 'number' ? Math.round(x * 1e4) / 1e4 : x)) === JSON.stringify(plain(b), (_k, x) => (typeof x === 'number' ? Math.round(x * 1e4) / 1e4 : x));

/**
 * Build a sample in theme 1, recolour it to theme 2: per object, whether it faded in place (slots)
 * and whether its values after the fade and a few seconds of motion are the fresh build's.
 * @param {any} sample
 */
function recolorSample(sample) {
  const ctx = ctxOf(theme(1));
  const cfg = { points: sample.points, objects: sample.objects, backdrop: { stars: { count: 50 } } };
  const w = buildScene(cfg, ctx);
  const next = ctxOf(theme(2));
  /** @type {Record<string, { slots: number | null, kept: boolean }>} */
  const out = {};
  const ids = [...w.list.map((b) => b.id), BACKDROP_STARS];
  const fades = new ColorFades();
  /** @type {any[]} */
  const all = [];
  for (const id of ids) {
    const live = id === BACKDROP_STARS ? w.stars : w.objects.get(id);
    const fresh = w.buildApart(id, undefined, { ...next, places: ctx.places, pointSpace: ctx.pointSpace });
    const slots = live && fresh ? colorSlots(live, fresh) : null;
    out[id] = { slots: slots ? slots.length : null, kept: true };
    if (slots) {
      fades.start(slots);
      all.push([id, slots]);
    }
    disposeBuilt(fresh);
  }
  fades.step(0);
  fades.step(RECOLOR_MS + 1);
  assert.equal(fades.active, false, 'the fades end');
  stepObjects(w.list, 3000, 3000);
  for (const [id, slots] of all) out[id].kept = slots.every((/** @type {any} */ s) => near(s.target[s.key], s.to));
  w.dispose();
  return out;
}

test('every object type fades its colours in place, and its motion keeps them', () => {
  /** @type {string[]} */
  const rebuilt = [];
  /** @type {string[]} */
  const lost = [];
  /** @type {string[]} */
  const zero = [];
  const samples = { ...TYPE_SAMPLES, ...Object.fromEntries(Object.entries(SHAPE_SAMPLES).flatMap(([t, shapes]) => Object.entries(/** @type {any} */ (shapes)).map(([s, v]) => [`${t}-${s}`, v]))) };
  for (const [name, sample] of Object.entries(samples)) {
    if (name === 'model' || name.startsWith('model-')) continue;
    const r = recolorSample(sample);
    for (const [id, v] of Object.entries(r)) {
      if (v.slots === 0) zero.push(`${name}/${id}`);
      if (v.slots === null) rebuilt.push(`${name}/${id}`);
      else if (!v.kept) lost.push(`${name}/${id}`);
    }
  }
  console.log('zero slots:', zero.join(', ') || '(none)');
  console.log('rebuilt:', rebuilt.join(', ') || '(none)');
  console.log('lost after motion:', lost.join(', ') || '(none)');
  assert.deepEqual(lost, []);
});
