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

test('editor: a point on a model part (parts from the built-in list and from the preview), a pinned card', async ({ page }) => {
    await mountCase(page, 'astro-model', { width: '800' });
    await expect.poll(async () => (await model(page))?.state, { timeout: 15_000 }).toBe('ready');
    await page.evaluate(async () => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        await customElements.get('lcards-astrometrics-card').getConfigElement(); // loads the editor chunk
        await customElements.whenDefined('lcards-astro-points-editor');
        const list = /** @type {any} */ (document.createElement('lcards-astro-points-editor'));
        list.preview = card; // the Studio's live card
        list.config = JSON.parse(JSON.stringify(card._rawConfig));
        list.addEventListener('points-changed', (e) => { window.__points = e.detail.value; list.config = { ...list.config, points: e.detail.value }; });
        document.body.appendChild(list);
        await list.updateComplete;
        window.__list = list;
    });
    // the built-in model's parts come from the asset registry
    expect(await page.evaluate(() => window.__list._partsFor('ship'))).toContain('nacelle_port');
    // a user file: the preview reports the parts once the model is in
    const fromPreview = await page.evaluate(async () => {
        const list = window.__list;
        list.config = { ...list.config, objects: list.config.objects.map((o) => (o.id === 'ship' ? { ...o, src: '/local/ship.glb' } : o)) };
        list._partsFor('ship');
        await new Promise((r) => setTimeout(r, 50));
        return list._parts.ship;
    });
    expect(fromPreview).toEqual(expect.arrayContaining(['bridge', 'nacelle_port', 'bussard_starboard']));
    // switching a point to "part" puts it on the model at its first part; the offset is xyz
    const placed = await page.evaluate(() => {
        const list = window.__list;
        const i = list.config.points.findIndex((p) => p.id === 'bridge');
        list._setForm(i, { id: 'bridge', xyz: [1, 2, 3], label: 'BRIDGE' }, 'part');
        return window.__points[i];
    });
    expect(placed).toMatchObject({ id: 'bridge', object: 'ship', part: expect.any(String) });
    expect(placed.xyz).toBeUndefined();
    // the inline card editor's change goes into the point's card, not up as the card's own config
    const pinned = await page.evaluate(() => {
        const list = window.__list;
        let leaked = false;
        list.addEventListener('config-changed', () => { leaked = true; });
        const i = list.config.points.findIndex((p) => p.id === 'port');
        const ev = new CustomEvent('config-changed', { detail: { config: { type: 'tile', entity: 'light.demo' } }, bubbles: true, composed: true });
        list._onCardConfigChanged(i, ev);
        return { card: window.__points[i].card, leaked: leaked || !ev.cancelBubble };
    });
    expect(pinned.card).toEqual({ show: 'always', width: 120, card: { type: 'tile', entity: 'light.demo' } });
    expect(pinned.leaked).toBe(false);
    expect(await cardErrors(page)).toEqual([]);
});

test('E8 starbases: the built-in starbases load and points sit on their parts', async ({ page }) => {
    const missing = [];
    page.on('response', (r) => { if (r.status() >= 400) missing.push(r.url()); });
    await mountCase(page, 'astro-starbases', { width: '900' });
    const states = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        return ['ds9', 'dock', 'dry'].map((id) => s.world.objects.get(id)?.loadState());
    });
    await expect.poll(states, { timeout: 20_000 }).toEqual(['ready', 'ready', 'ready']);
    const where = await page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        return Object.fromEntries(['ops', 'doors', 'berth'].map((id) => {
            const p = s.world.places.get(id);
            return [id, p ? [p.x, p.y, p.z] : null];
        }));
    });
    // Ops above DS9's middle, the front space door in the top cone of Spacedock's cap (100
    // tall, the door about 35 above its middle, 21 out), the berth in the drydock's middle
    expect(where.ops[0]).toBeCloseTo(-110, 0);
    expect(where.ops[1]).toBeGreaterThan(5);
    expect(where.doors[1]).toBeGreaterThan(30);
    expect(where.doors[1]).toBeLessThan(40);
    expect(where.doors[2]).toBeGreaterThan(15);
    expect(Math.abs(where.berth[0] - 110)).toBeLessThan(2);
    expect(Math.abs(where.berth[1])).toBeLessThan(2);
    expect(await cardErrors(page)).toEqual([]);
    expect(missing.filter((u) => !/favicon/.test(u))).toEqual([]);
});

test('UX1 P6c real size: without size in a km scene the built-in models sit in proportion', async ({ page }) => {
    await mountCase(page, 'astro-real-size', { width: '800' });
    const info = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))?._scene;
        return s ? Object.fromEntries(['station', 'ship', 'feet', 'sized', 'long'].map((id) => [id, s.modelInfo(id)])) : null;
    });
    await expect.poll(async () => Object.values((await info()) ?? {}).every(Boolean), { timeout: 20_000 }).toBe(true);
    const m = await info();
    expect(m.ship.real).toBe(true);
    expect(m.ship.size).toBeCloseTo(0.289, 2);
    expect(m.station.size).toBeCloseTo(1.455, 2);
    // the station is five times the ship, as in canon
    expect(m.station.size / m.ship.size).toBeCloseTo(1455 / 289, 1);
    expect(m.feet.size).toBeCloseTo(0.289 * 0.3048, 2);
    expect(m.sized.real).toBe(false);
    expect(m.sized.size).toBeCloseTo(0.5, 3);
    // length: its real length whatever the file measures, and still real
    expect(m.long.real).toBe(true);
    expect(m.long.size).toBeCloseTo(1.061, 3);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('a model that takes a moment to download shows the loading ring until it is in', async ({ page }) => {
    // hold the file back, so the ring has time to show
    await page.route('**/*.glb', async (route) => {
        const res = await route.fetch();
        await new Promise((r) => setTimeout(r, 1500));
        await route.fulfill({ response: res });
    });
    await mountCase(page, 'astro-real-size', { width: '800' });
    const ring = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))?._scene?.debug().loading ?? null);
    await expect.poll(async () => (await ring())?.visible, { timeout: 10_000 }).toBe(true);
    expect((await ring()).text).toMatch(/^(Loading \d+ models?|Preparing)/);
    await expect.poll(async () => (await ring())?.visible, { timeout: 20_000 }).toBe(false);
    const placed = await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.modelInfo('ship'));
    expect(placed?.real).toBe(true);
});

test('UX1 P6c visible size: the size button, the V key and model_scale draw small real-size models larger; sized ones stay', async ({ page }) => {
    await mountCase(page, 'astro-real-size', { width: '800' });
    const card = '#mount > *';
    // far out (40 km): the 289 m ship is a few px across
    const config = await page.evaluate((sel) => /** @type {any} */ (document.querySelector(sel)).config, card);
    const far = { ...config, camera: { ...config.camera, buttons: { hide: 'never' }, views: { near: { target: [0, 0, 0], yaw: 30, tilt: 20, distance: 40 } } } };
    await page.evaluate((c) => window.__reconfigure(c), far);
    const state = () => page.evaluate((sel) => {
        const el = /** @type {any} */ (document.querySelector(sel));
        const s = el._scene;
        const fit = (id) => s.debug().world.objects.get(id)?.node.getObjectByName('fit')?.scale.x ?? null;
        const b = el.renderRoot.querySelector('.astro-scale');
        return { mode: s.modelScale(), button: b?.textContent.trim() ?? null, pressed: b?.getAttribute('aria-pressed') ?? null, ship: fit('ship'), sized: fit('sized') };
    }, card);
    await expect.poll(async () => (await state()).button, { timeout: 20_000 }).toBe('Real size');
    await expect.poll(async () => (await state()).ship, { timeout: 20_000 }).toBeCloseTo(0.001, 6);
    const sizedBefore = (await state()).sized;
    // the button: visible size, the ship drawn at least 40 px across (many times its real size from 40 km)
    await page.evaluate((sel) => /** @type {any} */ (document.querySelector(sel)).renderRoot.querySelector('.astro-scale').click(), card);
    await expect.poll(async () => (await state()).ship, { timeout: 5_000 }).toBeGreaterThan(0.004);
    let s = await state();
    expect([s.mode, s.button, s.pressed]).toEqual(['visible', 'Visible size', 'true']);
    expect(s.sized).toBeCloseTo(sizedBefore, 9);
    // the V key on the scene: real again
    await page.evaluate((sel) => {
        const wrap = /** @type {any} */ (document.querySelector(sel)).renderRoot.querySelector('.astro-scene');
        wrap.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', bubbles: true }));
    }, card);
    await expect.poll(async () => (await state()).ship, { timeout: 5_000 }).toBeCloseTo(0.001, 6);
    expect((await state()).mode).toBe('real');
    // model_scale: visible starts there
    await page.evaluate((c) => window.__reconfigure({ ...c, model_scale: 'visible' }), far);
    await expect.poll(async () => (await state()).ship, { timeout: 20_000 }).toBeGreaterThan(0.004);
    expect((await state()).mode).toBe('visible');
    // close in (1 km), the ship is over 40 px at its real size: real again by itself
    await page.evaluate((sel) => /** @type {any} */ (document.querySelector(sel))._scene.flyTo({ tx: 1.2, ty: 0, tz: 0, distance: 1 }, { duration: 0 }), card);
    await expect.poll(async () => (await state()).ship, { timeout: 5_000 }).toBeCloseTo(0.001, 6);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});
