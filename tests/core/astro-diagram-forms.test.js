// Diagram forms (objects/diagram.js): each type's LCARS wireframe is a part shown in the diagram look
// only, its body a part shown in the realistic and mixed looks, so the mixed look draws as before.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const { partWeights, lookTargets } = await import('../../src/core/astrometrics/looks.js');
const { TYPE_SAMPLES } = await import('../../src/core/astrometrics/object-samples.js');
const { boxRuns } = await import('../../src/core/astrometrics/effects/cube.js');
const effects = await import('../../src/core/astrometrics/effects/index.js');

const ctx = () => /** @type {any} */ ({ color: () => [0.9, 0.5, 0.1, 1], places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null, effects });

/** The built object of a type's sample @param {string} type */
function sampleObject(type) {
  const s = /** @type {any} */ (TYPE_SAMPLES)[type];
  const w = buildScene({ points: s.points, objects: s.objects }, ctx());
  const b = w.list.find((x) => x.type === type);
  assert.ok(b, `${type} built`);
  return b;
}

/** How many segments a FatLine object draws @param {any} obj */
const segments = (obj) => obj.geometry.instanceCount ?? obj.geometry.attributes.instanceStart?.count ?? 0;

for (const type of ['glow', 'cube', 'asteroid', 'belt']) {
  test(`${type}: a wireframe for the diagram look only, its body for the realistic and mixed looks`, () => {
    const b = /** @type {any} */ (sampleObject(type));
    const parts = b.lookParts;
    assert.ok(parts?.diagramOnly?.length, 'a diagram-only part');
    assert.ok(parts?.realistic?.length, 'the body as the realistic part');
    for (const d of parts.diagramOnly) {
      assert.equal(d.visible, false, 'hidden until the look shows it');
      assert.ok(segments(d) > 0, 'the wireframe has lines');
      assert.ok(b.lines.some((/** @type {any} */ l) => l.object === d), 'a line the runtime sizes (out.lines)');
    }
  });
}

test('the looks: the wireframe only in the diagram look, the body in realistic and mixed (mixed as before)', () => {
  const w = (/** @type {'diagram' | 'realistic' | 'mixed'} */ look) => partWeights(lookTargets(look));
  assert.deepEqual([w('diagram').diagramOnly, w('diagram').realistic], [1, 0]);
  assert.deepEqual([w('mixed').diagramOnly, w('mixed').realistic], [0, 1]);
  assert.deepEqual([w('realistic').diagramOnly, w('realistic').realistic], [0, 1]);
});

test('cube wireframe: the 12 edges and a 3-by-3 grid on each face', () => {
  const runs = boxRuns(1, 2, 3, 3);
  // 3 axes x 2 faces x 4 lines; every line spans its axis, end to end
  assert.equal(runs.length, 24);
  for (const r of runs) assert.equal(r.length, 6);
  const lengths = new Set(runs.map((r) => Math.hypot(r[3] - r[0], r[4] - r[1], r[5] - r[2])));
  assert.deepEqual([...lengths].sort(), [2, 4, 6]);
});

test('belt wireframe: the edge rings follow a live radius', () => {
  const b = /** @type {any} */ (sampleObject('belt'));
  const line = b.lines.find((/** @type {any} */ l) => l.object.name === 'diagram');
  const reach = () => {
    const p = line.object.geometry.attributes.instanceStart.data.array;
    let m = 0;
    for (let i = 0; i < p.length; i += 3) m = Math.max(m, Math.hypot(p[i], p[i + 2]));
    return m;
  };
  const before = reach();
  b.live('radius', before * 1.5);
  assert.ok(Math.abs(reach() - before * 1.5) < before * 0.01, 'the outer ring moved out');
});
