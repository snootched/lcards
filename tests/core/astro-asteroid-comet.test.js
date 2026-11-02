/**
 * Astrometrics `type: asteroid` (AC1 part 2), headless: the seeded rock
 * shape, tumble, the light from a point / [x, y, z] / its frame's origin
 * (the scene builder's light pass), the dot far away, and occlusion; the comet
 * (AC1 part 3): activity, tails away from the light, tails, live keys.
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

const env = installJsdom();
after(() => env.restore());
const { buildScene } = await import('../../src/core/astrometrics/scene-builder.js');
const { asteroidGeometry, tumbleAxis, buildAsteroid } = await import('../../src/core/astrometrics/objects/asteroid.js');
const { PerspectiveCamera, Vector3 } = await import('three');

/** @param {any} [extra] */
function ctx(extra = {}) {
  return { color: () => [0.6, 0.6, 0.6, 1], places: null, sky: () => null, requestFrame: () => {}, loadTexture: () => null, ...extra };
}

test('asteroid shape: seeded, centred, largest extent 2, not a sphere, smooth normals', () => {
  const a = asteroidGeometry(3);
  const b = asteroidGeometry(3);
  assert.deepEqual([...a.getAttribute('position').array.slice(0, 300)], [...b.getAttribute('position').array.slice(0, 300)], 'the same seed, the same rock');
  assert.notDeepEqual([...asteroidGeometry(4).getAttribute('position').array.slice(0, 300)], [...a.getAttribute('position').array.slice(0, 300)]);
  a.computeBoundingBox();
  const box = /** @type {any} */ (a.boundingBox);
  const size = box.getSize(new Vector3());
  const centre = box.getCenter(new Vector3());
  assert.ok(Math.abs(Math.max(size.x, size.y, size.z) - 2) < 1e-6, `largest extent ${size.toArray()}`);
  assert.ok(centre.length() < 1e-6);
  assert.ok(Math.min(size.x, size.y, size.z) < 1.7, 'stretched: not round');
  // smooth: every corner at one place has one normal
  const pos = a.getAttribute('position');
  const nor = a.getAttribute('normal');
  /** @type {Map<string, string>} */
  const seen = new Map();
  for (let i = 0; i < pos.count; i++) {
    const k = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    const n = `${nor.getX(i).toFixed(3)},${nor.getY(i).toFixed(3)},${nor.getZ(i).toFixed(3)}`;
    if (seen.has(k)) assert.equal(seen.get(k), n);
    else seen.set(k, n);
  }
  assert.ok(Math.abs(tumbleAxis(5).length() - 1) < 1e-9);
  assert.deepEqual(tumbleAxis(5), tumbleAxis(5));
});

test('asteroid: size is its largest extent, tumble turns it (0 holds it still), it hides labels', () => {
  const b = /** @type {any} */ (buildAsteroid({ id: 'r', size: 10, seed: 2, tumble: 90 }, /** @type {any} */ (ctx())));
  const rock = b.node.getObjectByName('rock');
  assert.equal(rock.scale.x, 5);
  assert.equal(b.radius, 5);
  assert.equal(b.occludes, true);
  assert.equal(b.occluder, 'depth');
  const before = rock.parent.quaternion.clone();
  assert.equal(b.tick(16, 1000), true);
  assert.ok(rock.parent.quaternion.angleTo(before) > 1, 'turned about 90 degrees in a second');
  assert.equal(/** @type {any} */ (buildAsteroid({ id: 's', tumble: 0 }, /** @type {any} */ (ctx()))).tick, null);
  assert.equal(/** @type {any} */ (buildAsteroid({ id: 'o', occlude: false }, /** @type {any} */ (ctx()))).occludes, false);
});

test('asteroid light: a point id, [x, y, z] in its frame, else its frame\'s origin; into view space before drawing', () => {
  const w = buildScene({
    points: [{ id: 'star', xyz: [100, 0, 0] }],
    objects: [
      { type: 'asteroid', id: 'by_point', at: [10, 0, 0], light: 'star' },
      { type: 'asteroid', id: 'by_xyz', light: [0, 50, 0] },
      { type: 'asteroid', id: 'default', at: [5, 0, 0] },
      { type: 'system', id: 'sys', at: [1000, 0, 0], scale: 2, objects: [{ type: 'asteroid', id: 'inside', at: [3, 0, 0] }] }
    ]
  }, /** @type {any} */ (ctx()));
  w.layout();
  /** @param {string} id */
  const lightOf = (id) => {
    const b = /** @type {any} */ (w.objects.get(id));
    const rock = b.node.getObjectByName('rock');
    const cam = new PerspectiveCamera();
    cam.updateMatrixWorld();
    rock.onBeforeRender(null, null, cam);
    // the camera at the origin looking down -z: view space is world space
    return rock.material.uniforms.uLight.value.toArray().map((/** @type {number} */ v) => Math.round(v * 1000) / 1000);
  };
  assert.deepEqual(lightOf('by_point'), [100, 0, 0]);
  assert.deepEqual(lightOf('by_xyz'), [0, 50, 0]);
  assert.deepEqual(lightOf('default'), [0, 0, 0]);
  const sys = w.frames.get('sys');
  const origin = sys.node.localToWorld(new Vector3()).toArray().map((v) => Math.round(v * 1000) / 1000);
  assert.deepEqual(lightOf('inside'), origin, 'inside a system: the system\'s origin (its star)');
});

test('asteroid far away is a dot (with slack), near it is the rock again', () => {
  const b = /** @type {any} */ (buildAsteroid({ id: 'r', size: 4 }, /** @type {any} */ (ctx())));
  b.node.updateMatrixWorld(true);
  const cam = new PerspectiveCamera(50, 2, 0.1, 1e7);
  const at = (/** @type {number} */ d) => {
    cam.position.set(0, 0, d);
    cam.updateMatrixWorld();
    b.lod({ camera: cam, height: 600, dpr: 1 });
    return b.node.getObjectByName('dot').visible;
  };
  assert.equal(at(50), false);
  assert.equal(at(1e5), true);
  assert.equal(at(50), false);
});

test('comet activity: full at near, the square of the distance, none at far', async () => {
  const { activityAt } = await import('../../src/core/astrometrics/objects/comet.js');
  assert.equal(activityAt(10, 50, 300), 1);
  assert.equal(activityAt(50, 50, 300), 1);
  assert.equal(activityAt(300, 50, 300), 0);
  assert.equal(activityAt(1000, 50, 300), 0);
  const mid = activityAt(100, 50, 300);
  assert.ok(mid > 0.2 && mid < 0.3, `${mid}: about a quarter at twice near`);
  assert.ok(activityAt(150, 50, 300) < mid);
  assert.equal(activityAt(100, 300, 50), mid, 'either order');
});

test('comet: tails away from the light in its own space (face and rotation turn the nucleus, not the tails); tails picks which; live keys', async () => {
  const { buildComet, tailParticles } = await import('../../src/core/astrometrics/objects/comet.js');
  assert.deepEqual(tailParticles(50, 3).along, tailParticles(50, 3).along, 'seeded');
  const w = buildScene({
    points: [{ id: 'star', xyz: [-100, 0, 0] }],
    objects: [
      { type: 'comet', id: 'c', at: [0, 0, 0], light: 'star', rotation: [0, 90, 0], tail_length: 50 },
      { type: 'comet', id: 'ion', at: [0, 0, 50], tails: 'ion' },
      { type: 'comet', id: 'none', at: [0, 0, -50], tails: 'none' }
    ]
  }, /** @type {any} */ (ctx()));
  w.layout();
  const c = /** @type {any} */ (w.objects.get('c'));
  const cam = new PerspectiveCamera();
  cam.position.set(0, 0, 200);
  cam.updateMatrixWorld();
  c.lod({ camera: cam, height: 600, dpr: 1 });
  const ion = c.node.getObjectByName('ion_tail');
  const dust = c.node.getObjectByName('dust_tail');
  // the tail's direction, back in world space: away from the star, +x
  const dir = ion.material.uniforms.uDir.value.clone().transformDirection(c.node.matrixWorld);
  assert.ok(dir.distanceTo(new Vector3(1, 0, 0)) < 1e-6, `tail along ${dir.toArray()}`);
  assert.equal(ion.material.uniforms.uLength.value, 50);
  assert.ok(dust, 'both by default');
  const names = (/** @type {string} */ id) => /** @type {any} */ (w.objects.get(id)).node.children.map((/** @type {any} */ n) => n.name).filter((/** @type {string} */ n) => n.endsWith('_tail'));
  assert.deepEqual(names('ion'), ['ion_tail']);
  assert.deepEqual(names('none'), []);
  // live: the length, the coma, the glow, the nucleus (null: as built)
  assert.equal(c.live('tail_length', 80), true);
  assert.equal(ion.material.uniforms.uLength.value, 80);
  c.live('coma_size', 20);
  assert.equal(c.node.getObjectByName('glow:').children[0].scale.x, 20);
  c.live('glow', 0);
  assert.equal(ion.visible, false, 'no glow: no tails');
  c.live('size', 4);
  assert.equal(c.node.getObjectByName('asteroid:c').scale.x, 2);
  for (const k of ['tail_length', 'coma_size', 'glow', 'size']) c.live(k, null);
  assert.equal(ion.material.uniforms.uLength.value, 50);
  assert.equal(ion.visible, true);
  assert.equal(c.live('seed', 3), false);
});

test('comet activity: distance scales the tails by the distance to its light', async () => {
  const w = buildScene({
    points: [{ id: 'star', xyz: [0, 0, 0] }],
    objects: [
      { type: 'comet', id: 'near', at: [40, 0, 0], light: 'star', activity: 'distance', activity_range: [50, 300] },
      { type: 'comet', id: 'mid', at: [100, 0, 0], light: 'star', activity: 'distance', activity_range: [50, 300] },
      { type: 'comet', id: 'far', at: [400, 0, 0], light: 'star', activity: 'distance', activity_range: [50, 300] }
    ]
  }, /** @type {any} */ (ctx()));
  w.layout();
  const cam = new PerspectiveCamera();
  cam.updateMatrixWorld();
  const len = (/** @type {string} */ id) => {
    const b = /** @type {any} */ (w.objects.get(id));
    b.lod({ camera: cam, height: 600, dpr: 1 });
    return b.node.getObjectByName('dust_tail').material.uniforms.uLength.value;
  };
  assert.equal(len('near'), 60);
  assert.ok(len('mid') > 10 && len('mid') < 20);
  assert.equal(len('far'), 0);
});

test('comet bounds reach as far as its tail (a fly-to frames the comet whole)', async () => {
  const { localBounds } = await import('../../src/core/astrometrics/distance-fade.js');
  const w = buildScene({ objects: [{ type: 'comet', id: 'c', tail_length: 60, coma_size: 10 }] }, /** @type {any} */ (ctx()));
  assert.equal(localBounds(/** @type {any} */ (w.objects.get('c')).node).radius, 65);
});
