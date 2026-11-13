/**
 * F2 well morph (fixture astro-well-morph.yaml): well.morph and depth follow
 * entities and ease in place: the surface is rewritten (no rebuild), the rim
 * line and the twist follow the new shape.
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

const funnel = (page) => page.evaluate(() => {
    const s = /** @type {any} */ (document.querySelector('#mount > *'))?._scene?.debug();
    const b = s?.world?.objects.get('funnel');
    if (!b || !s.ready) return null;
    const pos = b.gridFaces[0].children[0].geometry.getAttribute('position').array;
    let rim = 0, minY = Infinity;
    for (let i = 0; i < pos.length; i += 3) {
        rim = Math.max(rim, Math.hypot(pos[i], pos[i + 2]));
        minY = Math.min(minY, pos[i + 1]);
    }
    const line = b.lines[0];
    let lineR = 0;
    const seg = line.segmentPositions();
    for (let i = 0; i < seg.length; i += 3) lineR = Math.max(lineR, Math.hypot(seg[i], seg[i + 2]));
    return { builds: s.objectBuilds, node: b.node.uuid, rim, depth: -minY, lineR, dynamic: !!b.dynamic };
});

test('a well closes into a needle and sinks as its entities change, in place', async ({ page }) => {
    await mountCase(page, 'astro-well-morph', { width: '800' });
    await page.evaluate(() => {
        window.__setState('input_number.lcards_test_power', '0');
        window.__setState('input_number.lcards_test_shields', '0');
    });
    await expect.poll(async () => (await funnel(page))?.rim ?? 0, { timeout: 10_000 }).toBeGreaterThan(49);
    await expect.poll(async () => (await funnel(page))?.depth, { timeout: 5_000 }).toBeCloseTo(10, 0);
    const open = /** @type {any} */ (await funnel(page));
    // closed: the rim draws into the centre (a needle 0.02 of the rim: radius 1), the rim line with it
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '100'));
    await expect.poll(async () => (await funnel(page)).rim, { timeout: 5_000 }).toBeLessThan(1.1);
    const closed = /** @type {any} */ (await funnel(page));
    expect(closed.lineR).toBeLessThan(1.1);
    // halfway: in between
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '50'));
    await expect.poll(async () => (await funnel(page)).rim, { timeout: 5_000 }).toBeCloseTo(25.5, 0);
    // sinks: depth 60
    await page.evaluate(() => window.__setState('input_number.lcards_test_shields', '100'));
    await expect.poll(async () => (await funnel(page)).depth, { timeout: 5_000 }).toBeCloseTo(60, 0);
    const last = /** @type {any} */ (await funnel(page));
    // all in place: the same object, no rebuild; its bounds measured afresh from now on
    // (cached at the built size, the depth passes clipped the deeper funnel)
    expect(last.dynamic).toBe(true);
    expect(last.node).toBe(open.node);
    expect(last.builds).toBe(open.builds);
    await page.locator('#mount').screenshot({ path: process.env.WELL_SHOT ?? 'tmp/astro-well-morph.png' });
    expect(await cardErrors(page)).toEqual([]);
});
