/**
 * Layout of the WebGL Borg intro (borg-layout.js): counts follow the params,
 * a seed repeats the layout, timings match the classic intro, the cube is closed.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBorgLayout, borgCubeSegments, BORG_INTRO_MS, BORG_GROW_MS, BORG_MAX_SITES } from '../../src/core/screen-effects/effects/borg-layout.js';

test('sites and tendrils follow the params', () => {
    const l = buildBorgLayout(1000, 600, { siteCount: 5, tendrilsPerSite: 3, seed: 1 });
    assert.equal(l.sites.length, 5);
    const tendrils = l.curves.filter(c => c.kind === 0 && c.dur === BORG_GROW_MS);
    assert.equal(tendrils.length, 15);
    // Each tendril forks into 2 or 3 branches
    const branches = l.curves.filter(c => c.kind === 0 && c.dur === BORG_GROW_MS / 2);
    assert.ok(branches.length >= 30 && branches.length <= 45, `branches: ${branches.length}`);
});

test('out-of-range params are clamped', () => {
    const l = buildBorgLayout(800, 600, { siteCount: 99, tendrilsPerSite: 0, seed: 2 });
    assert.equal(l.sites.length, BORG_MAX_SITES);
    assert.equal(l.curves.filter(c => c.dur === BORG_GROW_MS).length, BORG_MAX_SITES);
    assert.equal(buildBorgLayout(800, 600, { siteCount: 'x' }).sites.length, 7);
});

test('a seed gives the same layout', () => {
    const a = buildBorgLayout(1200, 800, { seed: 42 });
    const b = buildBorgLayout(1200, 800, { seed: 42 });
    const c = buildBorgLayout(1200, 800, { seed: 43 });
    assert.deepEqual(a, b);
    assert.notDeepEqual(a.sites, c.sites);
});

test('timings follow the classic intro, and every site front reaches the far corner', () => {
    const W = 1000, H = 600;
    const l = buildBorgLayout(W, H, { seed: 3 });
    for (const s of l.sites) {
        assert.ok(s.x >= 0 && s.x <= W && s.y >= 0 && s.y <= H);
        assert.ok(s.spawnAt >= BORG_INTRO_MS && s.spawnAt <= BORG_INTRO_MS + 4200);
        const far = Math.max(...[[0, 0], [W, 0], [0, H], [W, H]].map(([x, y]) => Math.hypot(x - s.x, y - s.y)));
        assert.equal(s.reach, far);
    }
    assert.equal(l.allGrownAt, Math.max(...l.sites.map(s => s.spawnAt)) + 300 + BORG_GROW_MS);
    for (const br of l.curves.filter(c => c.kind === 1)) assert.ok(br.start >= l.allGrownAt);
    assert.equal(l.junctions.length, l.curves.filter(c => c.kind === 1).length);
    assert.ok(l.settledAt > l.cubeAt + 3000, 'the cube has emerged in the settled frame');
});

test('the cube has its 12 outer edges inside the unit cube', () => {
    const segs = borgCubeSegments(() => 0.5);
    assert.equal(segs.filter(s => s[6] === 1).length, 12);
    for (const s of segs) {
        assert.equal(s.length, 7);
        for (const v of s.slice(0, 6)) assert.ok(Math.abs(v) <= 1.05, `vertex ${v}`);
    }
});
