/**
 * W1: the Bajoran wormhole builder (starters/wormhole.js) and the realistic
 * mouth (wormholeMouth): every reference resolves, the inside is diagram
 * only, the pipeline runs unbroken from the throat into the first lobe, and
 * power drives the mouth.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bajoranWormhole, pipelineStrand } from '../../src/core/astrometrics/starters/wormhole.js';
import { wormholeMouth } from '../../src/core/astrometrics/starters/scene-star-trek-galaxy.js';

const REFS = ['at', 'face', 'from', 'to', 'object'];

test('every point and object reference resolves to a point or object it defines (or the mouth)', () => {
  const w = bajoranWormhole({ prefix: 'wh', at: 'mouth', power: 'input_number.p' });
  const ids = new Set(['mouth', ...w.points.map((p) => p.id), ...w.objects.map((o) => o.id)]);
  assert.equal(ids.size, 1 + w.points.length + w.objects.length, 'ids are unique');
  for (const item of [...w.points, ...w.objects]) {
    for (const k of REFS) if (typeof item[k] === 'string') assert.ok(ids.has(item[k]), `${item.id}.${k} -> ${item[k]}`);
    for (const p of item.points ?? []) if (typeof p === 'string') assert.ok(ids.has(p), `${item.id}.points -> ${p}`);
  }
});

test('the inside is diagram only; the mouth has a part in each look', () => {
  const w = bajoranWormhole({ prefix: 'wh', at: 'mouth' });
  const mouthIds = new Set(wormholeMouth({ prefix: 'wh', at: 'mouth', aim: 'wh_down', radius: 9, depth: 7 }).objects.map((o) => o.id));
  for (const o of w.objects) if (!mouthIds.has(o.id)) assert.equal(o.look, 'diagram', `${o.id} is diagram only`);
  const looks = new Set(w.objects.filter((o) => mouthIds.has(o.id)).map((o) => o.look));
  assert.ok(looks.has('diagram') && looks.has('realistic'));
  assert.ok(w.objects.some((o) => o.fill?.effect?.type === 'swirl' && o.look === 'realistic'), 'the realistic mouth is a swirl');
  assert.ok(w.objects.filter((o) => o.type === 'path').every((o) => o.line_look === 'tube'), 'pipeline and throat are tubes');
});

test('a pipeline strand runs unbroken from under the throat into the first lobe, and scales with size', () => {
  const s = pipelineStrand(0, 1);
  for (let i = 1; i < s.length; i++) {
    const d = Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1], s[i][2] - s[i - 1][2]);
    assert.ok(d < 1.2, `step ${i} is ${d}`);
  }
  // starts under the mouth (the throat is 7 down), ends at the first lobe (20 along, 9 down), within the twist
  assert.ok(Math.abs(s[0][0]) < 1e-9 && Math.abs(s[0][1] + 7) < 1);
  const end = s[s.length - 1];
  assert.ok(Math.abs(end[0] - 20) < 0.3 && Math.abs(end[1] + 9) < 1);
  const twice = pipelineStrand(0, 2);
  assert.ok(Math.abs(twice[10][1] - 2 * s[10][1]) < 0.01);
});

test('with power the mouth opens with the entity; without, it is fully open', () => {
  const on = wormholeMouth({ prefix: 'm', at: 'a', aim: 'b', radius: 10, depth: 4, power: 'input_number.p' });
  const funnel = on.objects.find((o) => o.id === 'm_funnel');
  assert.deepEqual(funnel.radius, { entity: 'input_number.p', output: [2.25, 15], smooth: 1500 });
  assert.ok(on.objects.find((o) => o.id === 'm_wisps').opacity.entity);
  const off = wormholeMouth({ prefix: 'm', at: 'a', aim: 'b', radius: 10, depth: 4 });
  assert.equal(off.objects.find((o) => o.id === 'm_funnel').radius, 15);
});

test('the far mouth is coaxial rings, square to the axis, each wider and further along (a funnel opening)', () => {
  const w = bajoranWormhole({ prefix: 'wh', at: 'mouth' });
  const rings = w.objects.filter((o) => o.id.startsWith('wh_far_mouth_ring_'));
  assert.ok(rings.length >= 3);
  const pts = new Map(w.points.map((p) => [p.id, p]));
  let last = { x: -Infinity, r: 0 };
  for (const r of rings) {
    assert.equal(r.face, 'wh_east', `${r.id} faces along the axis`);
    assert.equal(r.rotation, undefined, `${r.id} has no tilt of its own`);
    const [x, y, z] = pts.get(r.at).offset;
    assert.equal(y, -9); assert.equal(z, 0);
    assert.ok(x > last.x && r.radius > last.r, `${r.id} is further on and wider`);
    last = { x, r: r.radius };
  }
});
