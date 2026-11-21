/**
 * W1: the Bajoran wormhole builder (starters/wormhole.js) and the realistic
 * mouth (wormholeMouth): every reference resolves, the inside is diagram
 * only, the pipeline runs unbroken from the throat into the first lobe, and
 * power drives the mouth.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bajoranWormhole, pipelineStrand } from '../../src/core/astrometrics/starters/wormhole.js';
import { wormholeMouth, wormholePower } from '../../src/core/astrometrics/starters/scene-star-trek-galaxy.js';

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

test('inside: false is the mouth only: its entrance, gas and funnel, no inside, no throat tube, every reference resolves', () => {
  const w = bajoranWormhole({ prefix: 'wh', at: 'mouth', power: 'input_number.p', inside: false });
  const ids = new Set(['mouth', ...w.points.map((p) => p.id), ...w.objects.map((o) => o.id)]);
  for (const item of [...w.points, ...w.objects]) {
    for (const k of REFS) if (typeof item[k] === 'string') assert.ok(ids.has(item[k]), `${item.id}.${k} -> ${item[k]}`);
    for (const p of item.points ?? []) if (typeof p === 'string') assert.ok(ids.has(p), `${item.id}.points -> ${p}`);
  }
  for (const id of ['wh_entrance', 'wh_funnel', 'wh_gas', 'wh_mouth', 'wh_heart']) assert.ok(ids.has(id), id);
  for (const id of ['wh_strand_1', 'wh_negative_outer', 'wh_ring_singularity_ring', 'wh_membrane_outer', 'wh_far_mouth_ring_1', 'wh_label_pipeline', 'wh_throat_tube']) assert.ok(!ids.has(id), `no ${id}`);
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
  // the funnel keeps its rim: its mouth morphs out of a needle and its tunnel deepens (faster)
  assert.equal(funnel.radius, 15);
  assert.deepEqual(funnel.well.to, { profile: [0.02, 0.02] });
  assert.deepEqual(funnel.well.morph, { entity: 'input_number.p', output: [1, 0], default: 1, smooth: 1200 });
  assert.deepEqual(funnel.depth, { entity: 'input_number.p', output: [0.08, 4], default: 0.08, smooth: 700 });
  // the gas: a whirlpool facing the aim, blooming with the entity
  const gas = on.objects.find((o) => o.id === 'm_gas');
  assert.equal(gas.shape, 'whirlpool');
  assert.equal(gas.face, 'b');
  assert.deepEqual(gas.radius, { entity: 'input_number.p', output: [2.363, 15.75], default: 2.363, smooth: 1500 });
  assert.ok(on.objects.find((o) => o.id === 'm_wisps').opacity.entity);
  // the sparkle and the shaft of light shrink to a dot at the centre and fade out
  const vortex = on.objects.find((o) => o.id === 'm_vortex');
  assert.deepEqual(vortex.radius, { entity: 'input_number.p', output: [0.3, 15], default: 0.3, smooth: 1500 });
  assert.deepEqual(vortex.opacity, { entity: 'input_number.p', output: [0, 0.45], default: 0, smooth: 1500 });
  // the beam draws back into the mouth: the further up a glow, the more power it needs
  // (where its opacity, rising along the power, crosses 0)
  let below = -1;
  for (const light of on.objects.filter((o) => /^m_light_\d+$/.test(o.id))) {
    assert.equal(light.size.entity, 'input_number.p');
    assert.ok(light.size.output[0] <= 0.02 * light.size.output[1] + 0.001, `${light.id} shrinks to a dot`);
    assert.equal(light.opacity.input, undefined, 'the entity\'s own range');
    const [lo, hi] = light.opacity.output;
    const out = -lo / (hi - lo);
    assert.ok(out > below, `${light.id} goes out before the one below it`);
    below = out;
  }
  const off = wormholeMouth({ prefix: 'm', at: 'a', aim: 'b', radius: 10, depth: 4 });
  const still = off.objects.find((o) => o.id === 'm_funnel');
  assert.equal(still.radius, 15);
  assert.equal(still.depth, 4);
  assert.equal(still.well.morph, undefined);
  assert.equal(off.objects.find((o) => o.id === 'm_gas').radius, 15.75);
});

test('power follows an entity with its attribute and input range, or holds a number', () => {
  // a light's brightness: the attribute and its 0 to 255 go on every setting that follows it
  const lamp = { entity: 'light.desk', attribute: 'brightness', input: [0, 255] };
  const on = wormholeMouth({ prefix: 'm', at: 'a', aim: 'b', radius: 10, depth: 4, power: lamp });
  const bound = [];
  const walk = (v, path) => {
    if (v && typeof v === 'object' && !Array.isArray(v) && typeof v.entity === 'string') bound.push([path, v]);
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`);
  };
  for (const o of on.objects) walk(o, o.id);
  assert.ok(bound.length > 25, `${bound.length} settings follow it`);
  for (const [path, b] of bound) {
    // closed while the light is off (no brightness): each setting's closed value, the shaft out
    assert.equal(b.default, Math.max(0, b.output[0]), `${path} default`);
    assert.equal(b.entity, 'light.desk', path);
    assert.equal(b.attribute, 'brightness', path);
    assert.deepEqual(b.input, [0, 255], path);
    assert.ok(Array.isArray(b.output), path);
  }
  // no templates: the wobble is a mapping too
  assert.ok(!JSON.stringify(on.objects).includes('[[['));
  // the beam: each glow out below its share, whatever the range (the output starts below 0)
  const lights = on.objects.filter((o) => /^m_light_\d+$/.test(o.id));
  assert.deepEqual(lights[0].opacity.output[0], 0);
  assert.ok(lights.at(-1).opacity.output[0] < 0);
  // an entity id alone: input from the entity (min and max, else 0 to 100)
  assert.deepEqual(wormholePower('input_number.p').bind, { entity: 'input_number.p' });
  assert.equal(wormholePower('input_number.p').fixed, null);
  assert.equal(wormholePower({ entity: '' }).bind, null);
  assert.equal(wormholePower({ entity: '' }).fixed, null);
  // by state: each state's power (0 to 100) becomes each setting's own value, default too
  const tv = wormholeMouth({ prefix: 'm', at: 'a', aim: 'b', radius: 10, depth: 4, power: { entity: 'media_player.tv', playing: 100, paused: 40, default: 0 } });
  const tvGas = tv.objects.find((o) => o.id === 'm_gas').radius;
  assert.deepEqual(tvGas, { entity: 'media_player.tv', output: [2.363, 15.75], playing: 15.75, paused: 7.718, default: 2.363, smooth: 1500 });
  assert.equal(tv.objects.find((o) => o.id === 'm_funnel').well.morph.paused, 0.6);
  assert.equal(tv.objects.find((o) => o.id === 'm_light_16').opacity.playing, 0.04);
  // a number: where that power puts each setting; 100 and none are fully open
  const half = wormholeMouth({ prefix: 'm', at: 'a', aim: 'b', radius: 10, depth: 4, power: 50 });
  const funnel = half.objects.find((o) => o.id === 'm_funnel');
  assert.equal(funnel.well.morph, 0.5);
  assert.equal(funnel.depth, 2.04);
  assert.equal(half.objects.find((o) => o.id === 'm_light_16').opacity, 0);
  const open = wormholeMouth({ prefix: 'm', at: 'a', aim: 'b', radius: 10, depth: 4, power: 100 });
  assert.deepEqual(open, wormholeMouth({ prefix: 'm', at: 'a', aim: 'b', radius: 10, depth: 4 }));
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
