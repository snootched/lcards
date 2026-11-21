/**
 * NB2c S3: the lightning bolt generator and its flash curve (pure).
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { installJsdom } from '../helpers/jsdom-env.js';

// the object module pulls in three.js lines and anime.js, which want a document
const env = installJsdom();
after(() => env.restore());
const { boltRuns, flashLevel, columnSpot, columnMotion } = await import('../../src/core/astrometrics/objects/lightning.js');

const A = [0, 100, 0];
const B = [20, -100, 10];

test('a bolt is seeded: the same seed gives the same bolt, another seed another', () => {
  assert.deepEqual(boltRuns(A, B, { seed: 4 }), boltRuns(A, B, { seed: 4 }));
  assert.notDeepEqual(boltRuns(A, B, { seed: 4 }).main, boltRuns(A, B, { seed: 5 }).main);
});

test('the main channel runs exactly from one end to the other', () => {
  const { main } = boltRuns(A, B, { seed: 2, levels: 6 });
  assert.deepEqual(main.slice(0, 3), A);
  assert.deepEqual(main.slice(-3), B);
  // 6 levels of midpoints: 2^6 + 1 points
  assert.equal(main.length / 3, 65);
});

test('branches: at least the count asked for (each may split once), each starting on the channel', () => {
  const { main, branches } = boltRuns(A, B, { seed: 9, branches: 3 });
  assert.ok(branches.length >= 3 && branches.length <= 6, `${branches.length} branches`);
  const onMain = (p) => main.some((_, i) => i % 3 === 0 && main[i] === p[0] && main[i + 1] === p[1] && main[i + 2] === p[2]);
  assert.ok(onMain(branches[0].slice(0, 3)));
  assert.equal(boltRuns(A, B, { seed: 9, branches: 0 }).branches.length, 0);
});

test('jaggedness 0 gives a straight channel; more strays further from the line', () => {
  const off = (j) => {
    const { main } = boltRuns([0, 100, 0], [0, -100, 0], { seed: 3, jaggedness: j });
    let m = 0;
    for (let i = 0; i < main.length; i += 3) m = Math.max(m, Math.hypot(main[i], main[i + 2]));
    return m;
  };
  assert.ok(off(0) < 1e-9);
  assert.ok(off(0.8) > off(0.3));
  assert.ok(off(0.5) < 100, 'stays near its line');
});

test('the flash rises, fades, strikes again weaker, then ends', () => {
  assert.equal(flashLevel(-5, 150), 0);
  assert.ok(flashLevel(20, 150) > 0.95);
  assert.ok(flashLevel(70, 150) < flashLevel(20, 150));
  const re = flashLevel(150 * 0.55 + 20, 150);
  assert.ok(re > flashLevel(150 * 0.55 - 5, 150) && re < 1);
  assert.ok(flashLevel(150 * 1.8, 150) < 0.05);
});

test('column speed scales the crawl and the flicker: half speed, half as many shapes; 0 holds still', () => {
  assert.equal(columnMotion(900, 1).step, 10, 'a new shape every 90 ms');
  assert.equal(columnMotion(900, 0.5).step, 5);
  assert.equal(columnMotion(1800, 0.5).level, columnMotion(900, 1).level, 'the flicker at half speed takes twice as long');
  const still = columnMotion(0, 0);
  for (const t of [100, 5000, 60000]) assert.deepEqual(columnMotion(t, 0), still);
  for (const t of [0, 37, 410, 9000]) {
    const { level } = columnMotion(t, 1);
    assert.ok(level >= 0.65 && level <= 1);
  }
});

test('column spots follow the volume shader spiral and stay inside the region', () => {
  const half = [250, 80, 250];
  for (let j = 0; j < 7; j++) {
    const [x, z] = columnSpot(j, 7, half);
    assert.ok(Math.abs(x) <= half[0] * 0.75 + 1e-9 && Math.abs(z) <= half[2] * 0.75 + 1e-9);
  }
  const fa = 0.7;
  assert.deepEqual(columnSpot(0, 4, half).map((v) => +v.toFixed(6)), [Math.cos(fa) * Math.sqrt(0.5 / 4) * 0.75 * 250, Math.sin(fa) * Math.sqrt(0.5 / 4) * 0.75 * 250].map((v) => +v.toFixed(6)));
});

test('crawl: discharges stand on the line, off it on the up side mostly, and light the gas faintly', async () => {
  const { buildLightning } = await import('../../src/core/astrometrics/objects/lightning.js');
  const line = [];
  for (let i = 0; i <= 50; i++) line.push(-500 + i * 20, 0, 0);
  const lit = [];
  const ctx = { color: () => [1, 1, 1, 1], objects: () => new Map([['n', { setLights: (_k, l) => lit.push(...l) }]]) };
  const out = buildLightning({ type: 'lightning', mode: 'crawl', count: 8, reach: 0.4, size: [1000, 200, 200], path: () => line, up: [0, 1, 0], seed: 3 }, /** @type {any} */ (ctx));
  out.tick(16, 1000);
  // every light sits within reach of the line, most above it
  assert.ok(lit.length >= 8);
  const reach = 0.4 * 100;
  for (const l of lit) {
    assert.ok(Math.abs(l.at[0]) <= 520 && Math.hypot(l.at[1], l.at[2]) <= reach * 1.5, JSON.stringify(l.at));
    assert.ok(l.level < 0.2, 'faint, not a strike');
  }
  assert.ok(lit.filter((l) => l.at[1] > 0).length > lit.length / 2, 'mostly the up side');
});

test('crawl without a line falls back to strikes', async () => {
  const { buildLightning } = await import('../../src/core/astrometrics/objects/lightning.js');
  const out = buildLightning({ type: 'lightning', mode: 'crawl', radius: 50 }, /** @type {any} */ ({ color: () => [1, 1, 1, 1] }));
  assert.equal(out.node.visible, false, 'a strike object waits hidden for its first strike');
});
