/**
 * Models on astrometrics (E4): the built-in ship loads from the model library
 * in its own chunk and swaps in the hologram for the stand-in box; points on
 * its parts show, the port nacelle (seen from starboard) and its card hide
 * behind the hull through the depth pass and show again from above; the
 * collector follows the turning bussard.
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

const model = (page) => page.evaluate(() => {
    const s = /** @type {any} */ (document.querySelector('#mount > *'))?._scene?.debug();
    const ship = s?.world?.objects.get('ship');
    if (!ship) return null;
    let holo = 0;
    ship.node.traverse((o) => { if (o.material?.name === 'lcards-hologram') holo++; });
    return { ready: s.ready && s.frames > 0, state: ship.loadState(), holo, placeholder: !!ship.node.getObjectByName('placeholder') };
});

const reasons = (page) => page.evaluate(() => {
    const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
    return Object.fromEntries(s.labelItems.map((l) => [l.id, l.reason]));
});

const portCardOpacity = (page) => page.evaluate(() => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const el = card.renderRoot.querySelector('.astro-pin[data-id="port"]');
    return el ? Number(el.style.opacity) : null;
});

test('the built-in ship loads as a hologram and the far side hides behind it', async ({ page }) => {
    const missing = [];
    page.on('response', (r) => { if (r.status() >= 400) missing.push(r.url()); });
    await mountCase(page, 'astro-model', { width: '800' });
    await expect.poll(async () => (await model(page))?.state, { timeout: 15_000 }).toBe('ready');
    const m = await model(page);
    expect(m.placeholder).toBe(false);
    expect(m.holo).toBeGreaterThan(10);
    // the depth image arrives a frame late
    await expect.poll(async () => (await reasons(page)).port, { timeout: 5_000 }).toBe('occluded');
    const r = await reasons(page);
    expect(r.bridge).toBe('ok');
    expect(r.starboard).toBe('ok');
    await expect.poll(() => portCardOpacity(page)).toBe(0);
    // from above, port is in the open
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('top', { duration: 0 }));
    await expect.poll(async () => (await reasons(page)).port, { timeout: 5_000 }).toBe('ok');
    await expect.poll(() => portCardOpacity(page)).toBe(1);
    expect(await cardErrors(page)).toEqual([]);
    expect(missing.filter((u) => !/favicon/.test(u))).toEqual([]);
});

test('a point on an animated part follows it', async ({ page }) => {
    await mountCase(page, 'astro-model', { width: '800' });
    await expect.poll(async () => (await model(page))?.state, { timeout: 15_000 }).toBe('ready');
    const where = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const p = s.world.places.get('collector');
        return p ? [p.x, p.y, p.z] : null;
    });
    const a = await where();
    await expect.poll(async () => {
        const b = await where();
        return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    }, { timeout: 5_000 }).toBeGreaterThan(0.2);
});
