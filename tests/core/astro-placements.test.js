/**
 * Astrometrics placements (src/core/astrometrics/placements.js): every form
 * on the one convention (0 = north = -z, clockwise from above, east = +x),
 * offsets, cycles refused, points on a spinning object following it, the
 * sky form, cell codes and what counts as dynamic.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Group, Vector3 } from 'three';
import { Placements, bearingXZ, lettersToIndex, indexToLetters, parseCell } from '../../src/core/astrometrics/placements.js';

const near = (v, xyz, eps = 1e-6) => {
  assert.ok(v, 'resolved');
  for (let i = 0; i < 3; i++) assert.ok(Math.abs(v.getComponent(i) - xyz[i]) < eps, `${v.toArray()} vs ${xyz}`);
};

test('polar: bearing 0 is north (-z), 90 east (+x), clockwise from above', () => {
  const p = new Placements({ points: [
    { id: 'n', polar: [10, 0] }, { id: 'e', polar: [10, 90] }, { id: 's', polar: [10, 180] }, { id: 'w', polar: [10, 270], alt: 3 }
  ] });
  near(p.get('n'), [0, 0, -10]);
  near(p.get('e'), [10, 0, 0]);
  near(p.get('s'), [0, 0, 10]);
  near(p.get('w'), [-10, 3, 0]);
  assert.deepEqual(bearingXZ(2, 90).map((v) => Math.round(v * 1e9) / 1e9 + 0), [2, 0]);
});

test('xyz, at + offset, literals', () => {
  const p = new Placements({ points: [{ id: 'a', xyz: [1, 2, 3] }, { id: 'b', at: 'a', offset: [1, 0, -1] }, { id: 'c', at: 'b' }] });
  near(p.get('a'), [1, 2, 3]);
  near(p.get('b'), [2, 2, 2]);
  near(p.get('c'), [2, 2, 2]);
  near(p.resolve([4, 5, 6]), [4, 5, 6]);
  assert.equal(p.resolve('nope'), null);
  assert.equal(p.resolve([1, 2]), null);
});

test('altaz on a dome: azimuth like polar, altitude up, radius + alt', () => {
  const dome = new Group();
  dome.position.set(0, 5, 0);
  dome.updateMatrixWorld();
  const p = new Placements({ points: [
    { id: 'n', altaz: [0, 0], object: 'sky', alt: 10 }, { id: 'zenith', altaz: [123, 90], object: 'sky' }, { id: 'e45', altaz: [90, 45], object: 'sky' }
  ], hosts: new Map([['sky', { node: dome, radius: 100 }]]) });
  near(p.get('n'), [0, 5, -110]);
  near(p.get('zenith'), [0, 105, 0], 1e-4);
  const h = 100 * Math.SQRT1_2;
  near(p.get('e45'), [h, 5 + h, 0], 1e-4);
});

test('latlon: lon 0 faces +z (the default camera), east to the right; follows a spinning sphere', () => {
  const planet = new Group();
  planet.position.set(10, 0, 0);
  planet.updateMatrixWorld();
  const hosts = new Map([['planet', { node: planet, radius: 5, moving: true }]]);
  const p = new Placements({ points: [
    { id: 'front', latlon: [0, 0], object: 'planet' }, { id: 'east', latlon: [0, 90], object: 'planet' }, { id: 'pole', latlon: [90, 0], object: 'planet', alt: 1 }
  ], hosts });
  near(p.get('front'), [10, 0, 5]);
  near(p.get('east'), [15, 0, 0]);
  near(p.get('pole'), [10, 6, 0]);
  // Spin a quarter turn prograde (rotation.y positive moves the front east)
  planet.rotation.y = Math.PI / 2;
  planet.updateMatrixWorld();
  near(p.get('front'), [10, 0, 5], 1e-6);
  p.invalidate();
  near(p.get('front'), [15, 0, 0], 1e-6);
  assert.equal(p.isDynamic('front'), true);
});

test('cycles are refused (null), the rest still resolves', () => {
  const p = new Placements({ points: [{ id: 'a', at: 'b' }, { id: 'b', at: 'a' }, { id: 'self', at: 'self' }, { id: 'ok', xyz: [1, 1, 1] }] });
  assert.equal(p.get('a'), null);
  assert.equal(p.get('b'), null);
  assert.equal(p.get('self'), null);
  near(p.get('ok'), [1, 1, 1]);
});

test('sky: the body altaz from the sky state; dynamic', () => {
  const dome = new Group();
  dome.updateMatrixWorld();
  let sky = { sun: { azimuth: 90, altitude: 0 }, moon: { azimuth: 180, altitude: 30 } };
  const p = new Placements({ points: [{ id: 'sun', sky: 'sun', object: 'dome' }, { id: 'moon', sky: 'moon', object: 'dome' }, { id: 'tag', at: 'sun', offset: [0, 2, 0] }],
    hosts: new Map([['dome', { node: dome, radius: 50 }]]), sky: () => /** @type {any} */ (sky) });
  near(p.get('sun'), [50, 0, 0]);
  near(p.get('tag'), [50, 2, 0]);
  const c = 50 * Math.cos(Math.PI / 6);
  near(p.get('moon'), [0, 25, c], 1e-6);
  sky = { ...sky, sun: { azimuth: 0, altitude: 0 } };
  p.invalidate();
  near(p.get('sun'), [0, 0, -50]);
  assert.equal(p.isDynamic('tag'), true);
  assert.equal(p.isDynamic('nope'), false);
});

test('cell: the host turns a code into a local centre; unknown host or cell is null', () => {
  const grid = new Group();
  grid.position.set(100, 0, 0);
  grid.updateMatrixWorld();
  const p = new Placements({ points: [{ id: 'x', cell: 'B2', object: 'map', offset: [0, 1, 0] }, { id: 'bad', cell: 'Z9', object: 'map' }, { id: 'lost', cell: 'A1', object: 'nothing' }],
    hosts: new Map([['map', { node: grid, cellPoint: (code) => (code === 'B2' ? new Vector3(5, 0, 5) : null) }]]) });
  near(p.get('x'), [105, 1, 5]);
  assert.equal(p.get('bad'), null);
  assert.equal(p.get('lost'), null);
});

test('column letters: A = 0, Z = 25, AA = 26, AD = 29, round trip; cell codes parse', () => {
  assert.equal(lettersToIndex('A'), 0);
  assert.equal(lettersToIndex('Z'), 25);
  assert.equal(lettersToIndex('AA'), 26);
  assert.equal(lettersToIndex('ad'), 29);
  assert.equal(lettersToIndex('A1'), -1);
  for (const i of [0, 25, 26, 51, 52, 701, 702]) assert.equal(lettersToIndex(indexToLetters(i)), i);
  assert.deepEqual(parseCell('AF3'), { col: 'AF', row: 3 });
  assert.equal(parseCell('3AF'), null);
});
