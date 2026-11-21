/**
 * Astrometrics deformed grids (E5): a deformed well draws, keeps drawing
 * while it moves, and the point on it follows the surface; a still deform
 * (noise, speed 0) does not tick; reduced motion holds the shape.
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

const sceneState = (page) => page.evaluate(() => {
    const s = /** @type {any} */ (document.querySelector('#mount > *'))?._scene?.debug();
    return s ? { ready: s.ready, frames: s.frames, clock: s.clock } : null;
});

/** The tornado's point in the scene, and what the deformed objects report */
const probe = (page) => page.evaluate(() => {
    const w = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world;
    const eye = w.places.get('eye');
    const t = w.objects.get('tornado');
    const terrain = w.objects.get('terrain');
    return {
        eye: eye ? [eye.x, eye.y, eye.z] : null,
        tornado: { moving: t.moving, tick: typeof t.tick },
        terrain: { moving: terrain.moving, tick: terrain.tick === null, warp: typeof terrain.warp },
        outpost: !!w.places.get('outpost')
    };
});

const litPixels = (page) => page.evaluate(() => {
    const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) lit++;
    return lit;
});

test('deformed grids draw and move; the point on the tornado follows it; a still deform does not tick', async ({ page }) => {
    await mountCase(page, 'astro-deform', { width: '800' });
    await expect.poll(async () => (await sceneState(page))?.ready && (await sceneState(page)).frames > 0, { timeout: 15_000 }).toBe(true);
    await expect.poll(() => litPixels(page)).toBeGreaterThan(2000);
    const a = await probe(page);
    expect(a.tornado).toEqual({ moving: true, tick: 'function' });
    expect(a.terrain).toEqual({ moving: false, tick: true, warp: 'function' });
    expect(a.outpost).toBe(true);
    await expect(page.locator('lcards-astrometrics-card .astro-label', { hasText: 'VORTEX' })).toBeVisible();
    // the bend circles (0.5 cycles/s): the eye at the bottom moves
    await page.waitForTimeout(500);
    const b = await probe(page);
    expect(Math.hypot(b.eye[0] - a.eye[0], b.eye[2] - a.eye[2])).toBeGreaterThan(1);
    expect(b.eye[1]).toBeCloseTo(0, 0);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
    // reduced motion: the clock holds, the shape and the point stay
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(300);
    const held = await probe(page);
    const s0 = await sceneState(page);
    await page.waitForTimeout(400);
    expect((await sceneState(page)).clock).toBe(s0.clock);
    expect((await probe(page)).eye).toEqual(held.eye);
});
