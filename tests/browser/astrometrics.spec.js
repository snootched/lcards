/**
 * lcards-astrometrics-card (E2b): the lazy runtime chunk loads and the three
 * design references draw on the shared WebGL context with their labels; an
 * idle static scene draws nothing; taps, holds and drags on points and
 * objects (service call, more-info, fly to a point, fly to a named view, a
 * drag is not a tap); reconfigure rebuilds; an alert change recolours the
 * scene; a lost context shows the card's message; disconnect gives the
 * context back; the card picker gets a static drawing; background_animation
 * draws behind the scene. Headless Chromium has WebGL2 through SwiftShader.
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

/** No card errors (the frame-budget guard of background effects is the machine's load) */
const expectNoErrors = async (page) => {
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
};

/** The scene's debug state (frames, keys, labels), or null before it exists */
const sceneState = (page) => page.evaluate(() => {
    const s = /** @type {any} */ (document.querySelector('#mount > *'))?._scene?.debug();
    if (!s) return null;
    return {
        ready: s.ready, failed: s.failed, frames: s.frames, clock: s.clock, keys: s.keys, projection: s.projection,
        labels: s.labels, objects: s.world?.list.length ?? 0, shown: s.labelItems.filter((l) => l.visible).length
    };
});

/** Wait for the scene to be built and drawn at least once */
async function sceneReady(page) {
    await expect.poll(async () => (await sceneState(page))?.ready && (await sceneState(page)).frames > 0, { timeout: 15_000 }).toBe(true);
}

/** Page coordinates of a point's marker */
const pointOnPage = (page, id) => page.evaluate((pid) => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const it = card._scene.debug().labelItems.find((l) => l.id === pid);
    const r = card.renderRoot.querySelector('.astro-scene').getBoundingClientRect();
    return it?.visible ? { x: r.left + it.sx, y: r.top + it.sy } : null;
}, id);

/** Pixels on the scene canvas that are not fully transparent */
const litPixels = (page) => page.evaluate(() => {
    const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) lit++;
    return lit;
});

/** Sum of the canvas's red channel (changes when the palette changes) */
const redSum = (page) => page.evaluate(() => {
    const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let r = 0;
    for (let i = 0; i < data.length; i += 4) r += data[i];
    return r;
});

const webglStats = (page) => page.evaluate(() => window.lcards.debug.webgl.stats());

test('galaxy: draws the scene with its labels on the shared context', async ({ page }) => {
    await mountCase(page, 'astro-galaxy', { width: '800' });
    await sceneReady(page);
    await expect.poll(() => litPixels(page)).toBeGreaterThan(2000);
    const s = await sceneState(page);
    expect(s.objects).toBe(13);
    expect(s.shown).toBeGreaterThan(10);
    expect(await webglStats(page)).toMatchObject({ users: 1, context: true });
    // the labels are real DOM text in the card
    await expect(page.locator('lcards-astrometrics-card .astro-label', { hasText: 'GALACTIC CORE' })).toBeVisible();
    await expectNoErrors(page);
});

test('sector map: tilt locked, renders the lettered grid, draws nothing while idle', async ({ page }) => {
    await mountCase(page, 'astro-sector', { width: '800' });
    await sceneReady(page);
    await expect(page.locator('lcards-astrometrics-card .astro-label', { hasText: 'Achernar' })).toBeVisible();
    await page.waitForTimeout(400);
    const before = (await sceneState(page)).frames;
    await page.waitForTimeout(800);
    expect((await sceneState(page)).frames).toBe(before);
    expect((await sceneState(page)).projection).toBe('orthographic');
    await expectNoErrors(page);
});

test('sky dome: the sun and moon are placed from the time and location', async ({ page }) => {
    // Local noon at the fake hass location (latitude 0, longitude 0): the sun is up
    await page.clock.setFixedTime(new Date('2026-06-21T12:00:00Z'));
    await mountCase(page, 'astro-sky', { width: '800' });
    await sceneReady(page);
    const sky = await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().sky);
    expect(sky.sun.altitude).toBeGreaterThan(40);
    await expect(page.locator('lcards-astrometrics-card .astro-label', { hasText: 'SOL' })).toBeVisible();
    await expectNoErrors(page);
});

test('tap on a point runs its tap_action; a drag from the same point does not', async ({ page }) => {
    await mountCase(page, 'astro-actions', { width: '800' });
    await sceneReady(page);
    const p = await pointOnPage(page, 'svc');
    expect(p).not.toBeNull();
    // drag: press on the marker, move 40 px, release
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x + 40, p.y, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => window.__hass.serviceCalls)).toEqual([]);
    // the drag panned (tilt is 90, not locked here: it orbits); find the point again and tap it
    const q = await pointOnPage(page, 'svc');
    await page.mouse.click(q.x, q.y);
    await expect.poll(() => page.evaluate(() => window.__hass.serviceCalls))
        .toEqual([{ domain: 'light', service: 'turn_on', data: { entity_id: 'light.demo' } }]);
    await expectNoErrors(page);
});

test('hold on a point runs its hold_action, and the release is not a tap', async ({ page }) => {
    await mountCase(page, 'astro-actions', { width: '800' });
    await sceneReady(page);
    const p = await pointOnPage(page, 'svc');
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.waitForTimeout(700);
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => window.__events.filter((e) => e.type === 'hass-more-info').map((e) => e.detail)))
        .toContainEqual({ entityId: 'switch.demo_switch' });
    expect(await page.evaluate(() => window.__hass.serviceCalls)).toEqual([]);
});

test('tap on a point without tap_action selects it and flies there; tap on an object flies to its view', async ({ page }) => {
    await mountCase(page, 'astro-actions', { width: '800' });
    await sceneReady(page);
    const hop = await pointOnPage(page, 'hop');
    await page.mouse.click(hop.x, hop.y);
    // the camera's target moves to the point (x 60)
    await expect.poll(async () => Math.round((await sceneState(page)).keys.tx), { timeout: 5000 }).toBe(60);
    // the selected label turns the alert colour
    const colour = await page.locator('lcards-astrometrics-card .astro-label', { hasText: 'HOP' }).evaluate((el) => getComputedStyle(el).color);
    const other = await page.locator('lcards-astrometrics-card .astro-label', { hasText: 'SERVICE' }).evaluate((el) => getComputedStyle(el).color);
    expect(colour).not.toBe(other);

    // back to the top view, then tap the box: it flies to the named view "side" (yaw 90)
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('top', { duration: 0 }));
    await expect.poll(async () => Math.round((await sceneState(page)).keys.tx)).toBe(0);
    const box = await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const s = card._scene.debug();
        const b = s.world.objects.get('box');
        const v = b.node.getWorldPosition(new (s.world.places.get('svc').constructor)()).project(s.rig.camera);
        const r = card.renderRoot.querySelector('.astro-scene').getBoundingClientRect();
        return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    });
    await page.mouse.click(box.x, box.y);
    await expect.poll(async () => Math.round((await sceneState(page)).keys.yaw), { timeout: 5000 }).toBe(90);
    expect(await page.evaluate(() => window.__hass.serviceCalls)).toEqual([]);
    await expectNoErrors(page);
});

test('reconfigure rebuilds the scene; the same config does not', async ({ page }) => {
    await mountCase(page, 'astro-actions', { width: '800' });
    await sceneReady(page);
    expect((await sceneState(page)).objects).toBe(2);
    const world = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world);
    const sameWorld = await page.evaluate(async () => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const before = card._scene.debug().world;
        window.__reconfigure(JSON.parse(JSON.stringify(card._rawConfig)));
        await new Promise((r) => setTimeout(r, 300));
        return card._scene.debug().world === before;
    });
    expect(sameWorld).toBe(true);
    await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const config = JSON.parse(JSON.stringify(card._rawConfig));
        config.objects.push({ type: 'ring', radius: 70 });
        window.__reconfigure(config);
    });
    await expect.poll(async () => (await sceneState(page)).objects).toBe(3);
    expect(await world(page)).toBeTruthy();
    await expectNoErrors(page);
});

test('alert mode recolours the scene (WebGL colours re-resolved), and green restores it', async ({ page }) => {
    await mountCase(page, 'astro-actions', { width: '800' });
    await sceneReady(page);
    await expect.poll(() => litPixels(page)).toBeGreaterThan(500);
    const green = await redSum(page);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('red_alert'));
    await expect.poll(() => redSum(page), { timeout: 5000 }).not.toBe(green);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('green_alert'));
    await expect.poll(() => redSum(page), { timeout: 5000 }).toBe(green);
    await expectNoErrors(page);
});

test('a lost context shows the card message; disconnect gives the context back', async ({ page }) => {
    await mountCase(page, 'astro-actions', { width: '800' });
    await sceneReady(page);
    expect(await webglStats(page)).toMatchObject({ users: 1, context: true });
    await page.evaluate(() => window.lcards.debug.webgl.loseContext());
    await expect(page.locator('lcards-astrometrics-card .astro-failure')).toContainText('3D VIEW UNAVAILABLE');
    await expect(page.locator('lcards-astrometrics-card .astro-failure')).toContainText('graphics context was lost');

    await mountCase(page, 'astro-actions', { width: '800' });
    await sceneReady(page);
    await page.evaluate(() => document.querySelector('#mount > *').remove());
    await expect.poll(() => webglStats(page)).toMatchObject({ users: 0, context: false });
});

test('card picker: a static drawing, no canvas and no WebGL', async ({ page }) => {
    await mountCase(page, 'astro-actions', { width: '800' });
    await sceneReady(page);
    await page.evaluate(async () => {
        if (!customElements.get('hui-card-picker')) customElements.define('hui-card-picker', class extends HTMLElement {});
        const picker = document.createElement('hui-card-picker');
        document.body.append(picker);
        const card = /** @type {any} */ (document.createElement('lcards-astrometrics-card'));
        card.setConfig(customElements.get('lcards-astrometrics-card').getStubConfig());
        card.hass = window.__hass;
        picker.append(card);
        await card.updateComplete;
        await new Promise((r) => setTimeout(r, 300));
    });
    const picked = page.locator('hui-card-picker lcards-astrometrics-card');
    await expect(picked.locator('svg.astro-preview')).toBeVisible();
    expect(await picked.locator('canvas').count()).toBe(0);
    // only the first card holds the context
    expect(await webglStats(page)).toMatchObject({ users: 1 });
});

test('background_animation draws behind the scene, flat, on its own layer', async ({ page }) => {
    await mountCase(page, 'astro-actions', { width: '800' });
    await sceneReady(page);
    await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        window.__reconfigure({ ...JSON.parse(JSON.stringify(card._rawConfig)), background_animation: [{ preset: 'starfield', config: { count: 80 } }] });
    });
    await expect.poll(() => page.evaluate(() => !!/** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer)).toBe(true);
    await expect(page.locator('lcards-astrometrics-card .astro-bg canvas')).toHaveCount(1);
    // removing it takes the layer away
    await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const config = JSON.parse(JSON.stringify(card._rawConfig));
        delete config.background_animation;
        window.__reconfigure(config);
    });
    await expect(page.locator('lcards-astrometrics-card .astro-bg canvas')).toHaveCount(0);
    await expectNoErrors(page);
});

// ── E3a: live data (text system, entities, templates, rules) ────────────────

/** A label's DOM: the element colour (marker) and each field's text and colour */
const labelDom = (page, id) => page.evaluate((pid) => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const el = card.renderRoot.querySelector(`.astro-label[data-id="${pid}"]`);
    if (!el) return null;
    const fields = Object.fromEntries([...el.querySelectorAll('.f')].map((f) => [f.dataset.field, {
        text: f.textContent, color: getComputedStyle(f).color, background: getComputedStyle(f).backgroundColor,
        transform: getComputedStyle(f).textTransform, font: getComputedStyle(f).fontFamily
    }]));
    return { color: getComputedStyle(el).color, fields };
}, id);

/** A point's world position now (null: not placed) */
const pointWorld = (page, id) => page.evaluate((pid) => {
    const w = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world;
    const v = w.places.get(pid);
    return v ? [v.x, v.y, v.z].map((n) => Math.round(n * 10) / 10) : null;
}, id);

test('labels on the text system: templates from the point\'s entity, state colours, labels.default, a sky template', async ({ page }) => {
    await mountCase(page, 'astro-data', { width: '800' });
    await sceneReady(page);
    // lamp: switch.demo_switch is off -> inactive grey; the rule is on (demo_toggle on) -> green wins
    await expect.poll(async () => (await labelDom(page, 'lamp'))?.color).toBe('rgb(0, 255, 0)');
    const lamp = await labelDom(page, 'lamp');
    expect(lamp.fields.label.transform).toBe('uppercase');
    expect(lamp.fields.label.font).toContain('Antonio');
    // the sky template resolves (no raw template text ever shows)
    await expect.poll(async () => (await labelDom(page, 'luna'))?.fields.label.text).toMatch(/^LUNA \d+%$/);
    // sky angles reach templates to one decimal
    await expect.poll(async () => (await labelDom(page, 'sol'))?.fields.label.text).toMatch(/^SOL -?\d+(\.\d)?$/);
    // the shuttle has no entity yet: no position, no template text
    expect(await pointWorld(page, 'shuttle')).toBeNull();
    expect((await labelDom(page, 'shuttle')).fields.label.text).toBe('');
    await expectNoErrors(page);
});

test('an entity-bound point appears and moves with its entity; the path to it follows; its label updates', async ({ page }) => {
    await mountCase(page, 'astro-data', { width: '800' });
    await sceneReady(page);
    const builds = (await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().builds));
    await page.evaluate(() => window.__setState('device_tracker.shuttle', { state: 'home', attributes: { friendly_name: 'Shuttle Two', x: 30, y: 0, z: 20 } }));
    await expect.poll(() => pointWorld(page, 'shuttle')).toEqual([30, 0, 20]);
    await expect.poll(async () => (await labelDom(page, 'shuttle'))?.fields.label.text).toBe('Shuttle Two');
    expect((await labelDom(page, 'shuttle')).color).toBe('rgb(0, 0, 255)');
    expect((await labelDom(page, 'shuttle')).fields.status.background).toBe('rgb(0, 0, 0)');
    const routeEnd = () => page.evaluate(() => {
        const w = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world;
        return w.objects.get('route').dynamic;
    });
    expect(await routeEnd()).toBe(true);
    // move it and change the state: position, text and colour follow, no rebuild
    await page.evaluate(() => window.__setState('device_tracker.shuttle', { state: 'not_home', attributes: { x: -20, z: -30 } }));
    await expect.poll(() => pointWorld(page, 'shuttle')).toEqual([-20, 0, -30]);
    await expect.poll(async () => (await labelDom(page, 'shuttle'))?.color).toBe('rgb(255, 0, 0)');
    await expect.poll(async () => (await labelDom(page, 'shuttle'))?.fields.status.text).toBe('not_home');
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().builds)).toBe(builds);
    await expectNoErrors(page);
});

test('a state colour map follows the point\'s entity', async ({ page }) => {
    await mountCase(page, 'astro-data', { width: '800' });
    await sceneReady(page);
    // the rule wins while demo_toggle is on: turn it off first
    await page.evaluate(() => window.__setState('input_boolean.demo_toggle', 'off'));
    await expect.poll(async () => (await labelDom(page, 'lamp'))?.color).toBe('rgb(128, 128, 128)');
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await expect.poll(async () => (await labelDom(page, 'lamp'))?.color).toBe('rgb(255, 165, 0)');
    await expectNoErrors(page);
});

test('rules on points and objects: a colour and a hide without rebuilding the world, undone when the rule ends', async ({ page }) => {
    await mountCase(page, 'astro-data', { width: '800' });
    await sceneReady(page);
    const dbg = () => page.evaluate(() => {
        const d = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const earth = d.world.objects.get('earth');
        return { builds: d.builds, objectBuilds: d.objectBuilds, earthVisible: d.world.outer.get(earth).visible };
    });
    await expect.poll(async () => (await dbg()).earthVisible).toBe(false);
    const before = await dbg();
    expect((await labelDom(page, 'lamp')).color).toBe('rgb(0, 255, 0)');
    expect(await labelDom(page, 'base')).toMatchObject({ color: 'rgb(255, 255, 0)', fields: { label: { text: 'BASE ALERT' } } });
    await page.evaluate(() => window.__setState('input_boolean.demo_toggle', 'off'));
    await expect.poll(async () => (await labelDom(page, 'lamp'))?.color).toBe('rgb(128, 128, 128)');
    await expect.poll(async () => (await dbg()).earthVisible).toBe(true);
    await expect.poll(async () => (await labelDom(page, 'base'))?.fields.label.text).toBe('BASE');
    const after = await dbg();
    expect(after.builds).toBe(before.builds);
    // only the route (a colour change) is built again; the globe's hide is a toggle
    expect(after.objectBuilds).toBe(before.objectBuilds + 1);
    await expectNoErrors(page);
});

test('labels mirror to dodge each other and the card edge; a label measured while mirrored still sits on its point', async ({ page }) => {
    await mountCase(page, 'astro-labels', { width: '800' });
    await sceneReady(page);
    const markerOffset = () => page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const it = card._scene.debug().labelItems.find((l) => l.id === 'base');
        const host = card.renderRoot.querySelector('.astro-scene').getBoundingClientRect();
        const mk = card.renderRoot.querySelector('.astro-label[data-id="base"] .mk').getBoundingClientRect();
        return Math.hypot(mk.left + mk.width / 2 - host.left - it.sx, mk.top + mk.height / 2 - host.top - it.sy);
    });
    expect(await markerOffset()).toBeLessThan(1.5);
    // mirror it, measure it mirrored, then let the layout put it back
    await page.evaluate(() => {
        const d = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const it = d.labelItems.find((l) => l.id === 'base');
        it.flip = 1;
        d.labelLayer.update(d.rig.camera, 800, 320, []);
        d.labelLayer.invalidateSizes();
        /** @type {any} */ (document.querySelector('#mount > *'))._scene.requestFrame();
    });
    await page.waitForTimeout(300);
    expect(await markerOffset()).toBeLessThan(1.5);
    await expectNoErrors(page);
});

// ── Camera controls (E3b) ────────────────────────────────────────────────────

/** The scene's box on the page */
const sceneBox = (page) => page.evaluate(() => {
    const r = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene').getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
});

/** setConfig with camera keys changed */
const reconfigureCamera = (page, patch) => page.evaluate((camera) => {
    const raw = JSON.parse(JSON.stringify(/** @type {any} */ (document.querySelector('#mount > *'))._rawConfig));
    window.__reconfigure({ ...raw, camera: { ...raw.camera, ...camera } });
}, patch);

/** Wait for the camera to stop (no fly-to, no held motion) and return its keys */
async function settled(page) {
    await expect.poll(() => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().rig.flying), { timeout: 5000 }).toBe(false);
    return (await sceneState(page)).keys;
}

test('double-tap in blank space zooms toward the spot (shift: out); on a tappable point it never zooms', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    const b = await sceneBox(page);
    const perPx = (2 * 200 * Math.tan((20 * Math.PI) / 180)) / b.h;
    // 100 px right of the centre, on the floor
    await page.mouse.dblclick(b.x + b.w / 2 + 100, b.y + b.h / 2);
    let k = await settled(page);
    expect(k.distance).toBeCloseTo(100, 3);
    expect(k.tx).toBeCloseTo(100 * perPx, 1);
    expect(k.tz).toBeCloseTo(0, 1);
    await page.keyboard.down('Shift');
    await page.mouse.dblclick(b.x + b.w / 2, b.y + b.h / 2);
    await page.keyboard.up('Shift');
    k = await settled(page);
    expect(k.distance).toBeCloseTo(200, 3);
    // a double-click on the service point runs its action twice and leaves the camera be
    const p = await pointOnPage(page, 'svc');
    const before = await settled(page);
    await page.mouse.dblclick(p.x, p.y);
    await expect.poll(() => page.evaluate(() => window.__hass.serviceCalls.length)).toBe(2);
    k = await settled(page);
    expect(k).toEqual(before);
    // double_tap: none
    await reconfigureCamera(page, { double_tap: 'none' });
    await page.waitForTimeout(100);
    const still = await settled(page);
    await page.mouse.dblclick(b.x + b.w / 2 + 100, b.y + b.h / 2 + 50);
    await page.waitForTimeout(600);
    expect((await settled(page)).distance).toBe(still.distance);
    await expectNoErrors(page);
});

test('wheel zooms toward the cursor: the spot under it stays put', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    const b = await sceneBox(page);
    const at = { x: b.x + b.w / 2 + 150, y: b.y + b.h / 2 - 80 };
    const spot = await page.evaluate(({ x, y, w, h }) => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().rig.spotAt(x, y, w, h), { x: at.x - b.x, y: at.y - b.y, w: b.w, h: b.h });
    await page.mouse.move(at.x, at.y);
    await page.mouse.wheel(0, -300);
    await expect.poll(async () => (await sceneState(page)).keys.distance).toBeLessThan(200);
    const onScreen = await page.evaluate((p) => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        s.rig.apply();
        const v = s.world.places.get('svc').clone().set(p[0], p[1], p[2]).project(s.rig.camera);
        return v;
    }, spot);
    expect((onScreen.x + 1) / 2 * b.w).toBeCloseTo(at.x - b.x, 0);
    expect((1 - onScreen.y) / 2 * b.h).toBeCloseTo(at.y - b.y, 0);
});

test('camera buttons: a click steps, a hold keeps going, reset flies home', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    const buttons = page.locator('lcards-astrometrics-card .astro-buttons button');
    await expect(buttons).toHaveCount(7);
    await page.locator('lcards-astrometrics-card button[data-cmd="zoom-in"]').click();
    expect((await settled(page)).distance).toBeCloseTo(100, 3);
    const right = page.locator('lcards-astrometrics-card button[data-cmd="pan-right"]');
    await right.click();
    const step = (await settled(page)).tx;
    expect(step).toBeGreaterThan(0);
    const box = await right.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(900);
    await page.mouse.up();
    const held = (await settled(page)).tx;
    expect(held).toBeGreaterThan(step * 2.5);
    await page.locator('lcards-astrometrics-card button[data-cmd="reset"]').click();
    const k = await settled(page);
    expect([Math.round(k.tx), Math.round(k.distance)]).toEqual([0, 200]);
    // buttons: { zoom: false, position: top-left }
    await reconfigureCamera(page, { buttons: { zoom: false, position: 'top-left' } });
    await expect(buttons).toHaveCount(5);
    await expect(page.locator('lcards-astrometrics-card .astro-buttons')).toHaveAttribute('data-pos', 'top-left');
    await expectNoErrors(page);
});

test('keyboard when focused: arrows pan, shift+arrows orbit, plus zooms, Home resets', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    await page.locator('lcards-astrometrics-card .astro-scene').focus();
    await page.keyboard.press('ArrowRight');
    expect((await settled(page)).tx).toBeGreaterThan(0);
    await page.keyboard.press('+');
    expect((await settled(page)).distance).toBeCloseTo(100, 3);
    await page.keyboard.press('Shift+ArrowLeft');
    expect((await settled(page)).yaw).toBeCloseTo(15, 3);
    await page.keyboard.press('Home');
    const k = await settled(page);
    expect([Math.round(k.tx), Math.round(k.distance), Math.round(k.yaw)]).toEqual([0, 200, 0]);
});

test('drag: pan moves the view instead of orbiting; panning stops at the target limit', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    const b = await sceneBox(page);
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    // default: orbit
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 60, cy, { steps: 4 });
    await page.mouse.up();
    let k = await settled(page);
    expect(k.yaw).not.toBeCloseTo(0, 1);
    await reconfigureCamera(page, { drag: 'pan' });
    await page.waitForTimeout(100);
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.home({ duration: 0 }));
    // pan far to the left, way past the scene
    for (let i = 0; i < 6; i++) {
        await page.mouse.move(cx - 300, cy);
        await page.mouse.down();
        await page.mouse.move(cx + 300, cy, { steps: 4 });
        await page.mouse.up();
    }
    k = await settled(page);
    expect(k.yaw).toBeCloseTo(0, 3);
    const limit = await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().limits.target);
    expect(limit.radius).toBeGreaterThan(100);
    expect(Math.hypot(k.tx - limit.center[0], k.tz - limit.center[2])).toBeCloseTo(limit.radius, 3);
    expect(k.tx).toBeLessThan(0);
    await expectNoErrors(page);
});

test('fly-to from outside: the registry, lcards_event fly_to, and a fly-to action naming the card', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    expect(await page.evaluate(() => {
        const reg = window.lcards.cards.astrometrics;
        return [reg.getAll().length, reg.get('astro_cam') === document.querySelector('#mount > *'), reg.get('nope')];
    })).toEqual([1, true, null]);
    // the registry: a point
    expect(await page.evaluate(() => window.lcards.cards.astrometrics.flyTo('astro_cam', { point: 'svc' }, { duration: 0 }))).toBe(1);
    await expect.poll(async () => Math.round((await settled(page)).tx)).toBe(-60);
    // the service's event: a view
    await page.evaluate(() => window.lcards.core.integrationService._handleLcardsEvent({ action: 'fly_to', card_id: 'astro_cam', view: 'top', duration: 0 }));
    await expect.poll(async () => Math.round((await settled(page)).tx)).toBe(0);
    // targeted at another device: ignored
    await page.evaluate(() => window.lcards.core.integrationService._handleLcardsEvent({ action: 'fly_to', card_id: 'astro_cam', point: 'svc', duration: 0, target_device_ids: ['someone-else'] }));
    await page.waitForTimeout(200);
    expect(Math.round((await settled(page)).tx)).toBe(0);
    // the action any LCARdS card runs
    await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        card._actionHandler.runAction({ action: 'fly-to', card: 'astro_cam', point: 'svc', duration: 0 }, card.hass, card);
    });
    await expect.poll(async () => Math.round((await settled(page)).tx)).toBe(-60);
    // gone from the registry once disconnected
    expect(await page.evaluate(() => {
        document.querySelector('#mount > *').remove();
        return window.lcards.cards.astrometrics.getAll().length;
    })).toBe(0);
    await expectNoErrors(page);
});

test('editor pick: the preview places a point on the next tap (xyz, a cell), Escape cancels', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    await page.evaluate(async () => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        await customElements.get('lcards-astrometrics-card').getConfigElement(); // loads the editor chunk
        await customElements.whenDefined('lcards-astro-points-editor');
        // the harness has no edit dialog: let the card listen as if it were the preview
        card._inEditDialog = true;
        card._listenForPicks();
        const list = /** @type {any} */ (document.createElement('lcards-astro-points-editor'));
        list.config = JSON.parse(JSON.stringify(card._rawConfig));
        list.addEventListener('points-changed', (e) => { window.__points = e.detail.value; list.config = { ...list.config, points: e.detail.value }; });
        document.body.appendChild(list);
        await list.updateComplete;
        window.__list = list;
    });
    const b = await sceneBox(page);
    const perPx = (2 * 200 * Math.tan((20 * Math.PI) / 180)) / b.h;
    // xyz on the ground
    await page.evaluate(() => window.__list._pick({ id: 'svc', xyz: [-60, 0, 0] }));
    await expect(page.locator('lcards-astrometrics-card .astro-pick')).toContainText('TAP TO PLACE SVC');
    await page.mouse.click(b.x + b.w / 2 + 100, b.y + b.h / 2);
    await expect(page.locator('lcards-astrometrics-card .astro-pick')).toHaveCount(0);
    const xyz = await page.evaluate(() => window.__points.find((p) => p.id === 'svc').xyz);
    expect(xyz[0]).toBeCloseTo(100 * perPx, 0);
    expect(xyz[1]).toBe(0);
    expect(Math.abs(xyz[2])).toBeLessThan(0.5);
    expect(await page.evaluate(() => window.__hass.serviceCalls)).toEqual([]);
    // a cell on the floor grid (240 x 160, cells of 20: columns A to L, rows 1 to 8)
    await page.evaluate(() => {
        const list = window.__list;
        list.config = { ...list.config, points: list.config.points.map((p) => (p.id === 'svc' ? { id: 'svc', cell: 'A1', object: 'floor', label: p.label } : p)) };
        list._pick(list.config.points.find((p) => p.id === 'svc'));
    });
    // 30 px below the middle: inside row 5 (row 4 ends at z = 0)
    await page.mouse.click(b.x + b.w / 2 + 100, b.y + b.h / 2 + 30);
    await expect.poll(() => page.evaluate(() => window.__points.find((p) => p.id === 'svc'))).toMatchObject({ cell: 'H5', object: 'floor' });
    expect(await page.evaluate(() => window.__points.find((p) => p.id === 'svc').xyz)).toBeUndefined();
    // Escape cancels; the next tap runs the point's action again
    await page.evaluate(() => window.__list._pick({ id: 'svc', xyz: [0, 0, 0] }));
    await expect(page.locator('lcards-astrometrics-card .astro-pick')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('lcards-astrometrics-card .astro-pick')).toHaveCount(0);
    expect(await page.evaluate(() => window.__list._picking)).toBe('');
    await expectNoErrors(page);
});

test('nebula: the effects chunk loads, a drifting nebula keeps drawing, reduced motion holds it', async ({ page }) => {
    await mountCase(page, 'astro-nebula', { width: '800' });
    await sceneReady(page);
    const neb = await page.evaluate(() => {
        const w = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world;
        const b = w.objects.get('neb');
        return b ? { type: b.type, ticks: typeof b.tick, pick: b.pickMeshes.length } : null;
    });
    expect(neb).toEqual({ type: 'nebula', ticks: 'function', pick: 0 });
    const f0 = (await sceneState(page)).frames;
    await expect.poll(async () => (await sceneState(page)).frames, { timeout: 5_000 }).toBeGreaterThan(f0 + 10);
    // reduced motion: the clock stops and the scene comes to rest
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(300);
    const held = await sceneState(page);
    await page.waitForTimeout(400);
    const later = await sceneState(page);
    expect(held.clock).toBeGreaterThan(0);
    expect(later.clock).toBe(held.clock);
    expect(later.frames - held.frames).toBeLessThanOrEqual(1);
});
