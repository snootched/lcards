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

test('camera pad: a click steps, a hold keeps going, reset flies home, the corners fly, parts turn off', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    // hide: never: under load more than the idle time can pass between steps, and Playwright's click
    // checks what is under the pointer before moving it, so faded buttons would never wake
    await reconfigureCamera(page, { buttons: { hide: 'never' } });
    const buttons = page.locator('lcards-astrometrics-card .astro-buttons button');
    await expect(buttons).toHaveCount(9);
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
    // reset waits a moment for more taps (four play the tribute) before it flies home
    await page.waitForTimeout(700);
    const k = await settled(page);
    expect([Math.round(k.tx), Math.round(k.distance)]).toEqual([0, 200]);
    // the top-right corner flies forward: camera and target together, the distance kept
    await page.locator('lcards-astrometrics-card button[data-cmd="fly-forward"]').click();
    const f = await settled(page);
    expect(f.distance).toBeCloseTo(200, 3);
    expect(Math.hypot(f.tx, f.ty, f.tz)).toBeGreaterThan(50);
    // the pressed segment lights its path while held, and lets go on release
    const up = page.locator('lcards-astrometrics-card button[data-cmd="pan-up"]');
    const ub = await up.boundingBox();
    await page.mouse.move(ub.x + ub.width / 2, ub.y + ub.height / 2);
    await page.mouse.down();
    await expect(page.locator('lcards-astrometrics-card .astro-pad path.seg[data-seg="up"]')).toHaveClass(/pressed/);
    await page.mouse.up();
    await expect(page.locator('lcards-astrometrics-card .astro-pad path.seg[data-seg="up"]')).not.toHaveClass(/pressed/);
    // buttons: { zoom: false, position: top-left, size: 160 }: the zoom corners dim and do nothing; the pad keeps its shape
    await reconfigureCamera(page, { buttons: { zoom: false, position: 'top-left', size: 160, hide: 'never' } });
    await expect(buttons).toHaveCount(9);
    await expect(page.locator('lcards-astrometrics-card .astro-buttons')).toHaveAttribute('data-pos', 'top-left');
    await expect(page.locator('lcards-astrometrics-card button[data-cmd="zoom-in"]')).toBeDisabled();
    await expect(page.locator('lcards-astrometrics-card .astro-pad path.seg[data-seg="up-left"]')).toHaveClass(/off/);
    const before = (await settled(page)).distance;
    await page.locator('lcards-astrometrics-card button[data-cmd="zoom-in"]').click({ force: true });
    await page.waitForTimeout(300);
    expect((await settled(page)).distance).toBe(before);
    expect(Math.round((await page.locator('lcards-astrometrics-card .astro-pad').boundingBox()).width)).toBe(160);
    await expectNoErrors(page);
});

test('camera pad colours follow the theme: the D-pad tokens stay live CSS variables', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    const fill = (seg) => page.locator(`lcards-astrometrics-card .astro-pad path.seg[data-seg="${seg}"]`).evaluate((el) => getComputedStyle(el).fill);
    const arm = await fill('up');
    // the arm tips read the theme's button colour (components.dpad.segment.directional.fill.default, colors.card.button):
    // change it, the pad and the slider's fill follow without a re-render
    await page.evaluate(() => document.documentElement.style.setProperty('--lcars-card-button-color', 'rgb(1, 2, 3)'));
    await expect.poll(() => fill('up')).toBe('rgb(1, 2, 3)');
    expect(arm).not.toBe('rgb(1, 2, 3)');
    // the time slider: the value block in the same colour
    expect(await page.locator('lcards-astrometrics-card .astro-time-value').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(1, 2, 3)');
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

test('fly-to warp and duration reach the flight from the registry, the service event, an action and a tap', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    // a point whose own tap flies to it, with its own warp and duration
    await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const config = JSON.parse(JSON.stringify(card._rawConfig));
        config.points.push({ id: 'gate', xyz: [60, 0, 0], marker: 'diamond', label: 'GATE', tap_action: { action: 'fly-to', warp: true, duration: 250 } });
        window.__reconfigure(config);
    });
    await expect.poll(() => page.evaluate(() => !!/** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().labelItems.find((l) => l.id === 'gate')?.visible)).toBe(true);
    // record what each flight asks the camera rig for
    await page.evaluate(() => {
        const rig = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().rig;
        window.__flights = [];
        const fly = rig.flyTo.bind(rig);
        rig.flyTo = (to, opts = {}) => { window.__flights.push({ duration: opts.duration, warp: opts.warp }); return fly(to, { ...opts, duration: 0 }); };
    });
    const last = () => page.evaluate(() => window.__flights.at(-1));
    await page.evaluate(() => window.lcards.cards.astrometrics.flyTo('astro_cam', { point: 'svc' }, { duration: 300, warp: true }));
    expect(await last(), 'registry, a point: its duration and warp').toEqual({ duration: 300, warp: true });
    await page.evaluate(() => window.lcards.core.integrationService._handleLcardsEvent({ action: 'fly_to', card_id: 'astro_cam', view: 'top', duration: 200, warp: false }));
    expect(await last(), 'the service event, a view').toEqual({ duration: 200, warp: false });
    await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        card._actionHandler.runAction({ action: 'fly-to', card: 'astro_cam', point: 'svc', warp: true }, card.hass, card);
    });
    expect((await last()).warp, 'an action naming the card').toBe(true);
    // back to the overview, then tap the marker once its place on screen has settled
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('top', { duration: 0 }));
    const gateAt = () => page.evaluate(() => {
        const it = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().labelItems.find((l) => l.id === 'gate');
        return it?.visible ? [Math.round(it.sx), Math.round(it.sy)] : null;
    });
    await expect.poll(async () => {
        const a = await gateAt();
        await page.waitForTimeout(150);
        return a !== null && JSON.stringify(a) === JSON.stringify(await gateAt());
    }).toBe(true);
    await page.evaluate(() => {
        const d = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const it = d.labelItems.find((l) => l.id === 'gate');
        d.tap(it.sx, it.sy);
    });
    expect(await last(), 'a tap on a point with a fly-to of its own').toEqual({ duration: 250, warp: true });
    await expectNoErrors(page);
});

test('points list pick: the preview places a point on the next tap (xyz, a cell), Escape cancels', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
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
    const b = await sceneBox(page);
    const perPx = (2 * 200 * Math.tan((20 * Math.PI) / 180)) / b.h;
    // xyz on the ground
    await page.evaluate(() => { window.__list._pick({ id: 'svc', xyz: [-60, 0, 0] }); });
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
    await page.evaluate(() => { window.__list._pick({ id: 'svc', xyz: [0, 0, 0] }); });
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

test('nebula render: volume: the gas draws from outside and from inside', async ({ page }) => {
    await mountCase(page, 'astro-nebula-volume', { width: '800' });
    await sceneReady(page);
    const info = await page.evaluate(() => {
        const w = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world;
        const b = w.objects.get('neb');
        return { type: b?.type, mesh: b?.node.children[0]?.name, pick: b?.pickMeshes.length, prerender: typeof b?.prerender };
    });
    expect(info).toEqual({ type: 'nebula', mesh: 'nebula-volume', pick: 0, prerender: 'function' });
    /** Bright blue pixels (the gas; the grid and the planet are orange) */
    const gas = () => page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i + 2] > 40 && data[i + 2] > data[i] + 15) n++;
        return n / (data.length / 4);
    });
    await expect.poll(gas).toBeGreaterThan(0.02);
    // inside the region: gas across much of the view
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('inside', { duration: 0 }));
    await expect.poll(gas, { timeout: 5_000 }).toBeGreaterThan(0.15);
    await expectNoErrors(page);
});

test('nebula render: volume: a solid in front of the gas hides it (the solid depth pass)', async ({ page }) => {
    await mountCase(page, 'astro-nebula-volume-solid', { width: '600', height: '400' });
    await sceneReady(page);
    /** Mean colour of a small square at the middle of the canvas (the sphere), and the blue over the whole canvas */
    const probe = () => page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const { width, height } = canvas;
        const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
        const mid = [0, 0, 0];
        let n = 0;
        for (let y = -4; y <= 4; y++) for (let x = -4; x <= 4; x++) {
            const i = ((Math.round(height / 2) + y) * width + Math.round(width / 2) + x) * 4;
            mid[0] += data[i]; mid[1] += data[i + 1]; mid[2] += data[i + 2]; n++;
        }
        let blue = 0;
        for (let i = 0; i < data.length; i += 4) blue += data[i + 2];
        return { mid: mid.map((v) => v / n), blue };
    });
    await expect.poll(async () => (await probe()).blue).toBeGreaterThan(0);
    await page.waitForTimeout(300);
    const withGas = await probe();
    // the same scene without the nebula
    await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        window.__reconfigure({ ...card.config, objects: card.config.objects.filter((/** @type {any} */ o) => o.type !== 'nebula') });
    });
    await expect.poll(async () => (await sceneState(page))?.objects).toBe(1);
    await page.waitForTimeout(300);
    const bare = await probe();
    expect(withGas.blue, 'the gas shows round the sphere').toBeGreaterThan(bare.blue * 1.5);
    for (let c = 0; c < 3; c++) expect(Math.abs(withGas.mid[c] - bare.mid[c]), `channel ${c} of the sphere`).toBeLessThan(3);
    await expectNoErrors(page);
});

test('NB1 nebula shapes: each shape and the dusty band draw their gas (no shader errors)', async ({ page }) => {
    await mountCase(page, 'astro-nebula-shapes', { width: '800', height: '400' });
    await sceneReady(page);
    /** Share of lit pixels in each of the top row's four columns, and in the bottom band */
    const lit = () => page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const { width, height } = canvas;
        const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
        const share = (/** @type {number} */ x0, /** @type {number} */ x1, /** @type {number} */ y0, /** @type {number} */ y1) => {
            let n = 0, all = 0;
            for (let y = Math.round(y0 * height); y < y1 * height; y++) for (let x = Math.round(x0 * width); x < x1 * width; x++) {
                const i = (y * width + x) * 4;
                all++;
                if (data[i] + data[i + 1] + data[i + 2] > 60) n++;
            }
            return n / all;
        };
        return { top: [0, 1, 2, 3].map((c) => share(0.1 + c * 0.2, 0.1 + (c + 1) * 0.2, 0.1, 0.5)), band: share(0.15, 0.85, 0.6, 0.85) };
    });
    await expect.poll(async () => Math.min(...(await lit()).top)).toBeGreaterThan(0.05);
    expect((await lit()).band).toBeGreaterThan(0.05);
    await expectNoErrors(page);
});

test('NB2c Badlands: both presets draw their layers and columns (no shader errors)', async ({ page }) => {
    await mountCase(page, 'astro-badlands', { width: '800', height: '400' });
    await sceneReady(page);
    /** Share of lit pixels in the left and right halves */
    const lit = () => page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const { width, height } = canvas;
        const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
        const share = (/** @type {number} */ x0, /** @type {number} */ x1) => {
            let n = 0, all = 0;
            for (let y = Math.round(0.2 * height); y < 0.8 * height; y++) for (let x = Math.round(x0 * width); x < x1 * width; x++) {
                const i = (y * width + x) * 4;
                all++;
                if (data[i] + data[i + 1] + data[i + 2] > 60) n++;
            }
            return n / all;
        };
        return [share(0.05, 0.48), share(0.52, 0.95)];
    });
    await expect.poll(async () => Math.min(...(await lit()))).toBeGreaterThan(0.1);
    // the Voyager preset's lightning columns and strikes are lightning objects of the nebula's own
    const bolts = await page.evaluate(() => {
        const list = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world.list;
        const voy = list.find((/** @type {any} */ b) => b.id === 'voyager');
        return voy.node.children.filter((/** @type {any} */ c) => String(c.name).startsWith('lightning:')).map((/** @type {any} */ c) => c.name);
    });
    expect(bolts).toEqual(['lightning:voyager:columns', 'lightning:voyager:lightning']);
    await expectNoErrors(page);
});

test('NB3 Nexus: the wake trails up from the ribbon, discharges crawl off it, the ribbon moves', async ({ page }) => {
    await mountCase(page, 'astro-nexus', { width: '800', height: '400' });
    await sceneReady(page);
    /** Share of lit pixels in a band of rows (fractions of the height) */
    const lit = (/** @type {number} */ y0, /** @type {number} */ y1) => page.evaluate(([a, b]) => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const { width, height } = canvas;
        const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
        let n = 0, all = 0;
        for (let y = Math.round(a * height); y < b * height; y++) for (let x = Math.round(0.2 * width); x < 0.8 * width; x++) {
            const i = (y * width + x) * 4;
            all++;
            if (data[i] + data[i + 1] + data[i + 2] > 60) n++;
        }
        return n / all;
    }, [y0, y1]);
    // the ribbon sits low in the box: gas above it, little below
    await expect.poll(() => lit(0.35, 0.55)).toBeGreaterThan(0.2);
    expect(await lit(0.75, 0.95)).toBeLessThan(0.05);
    const ribbon = () => page.evaluate(() => {
        const list = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world.list;
        const nx = list.find((/** @type {any} */ b) => b.id === 'nexus');
        const tube = nx.lines.find((/** @type {any} */ l) => l.style.tube);
        return { y: Array.from(tube._abs.slice(0, 60)).map((v) => Math.round(v)), bolts: nx.node.children.filter((/** @type {any} */ c) => String(c.name).startsWith('lightning:')).map((/** @type {any} */ c) => c.name) };
    });
    const first = await ribbon();
    expect(first.bolts).toEqual(['lightning:nexus:lightning']);
    // the preset's waves run along it (speed 40)
    await expect.poll(async () => JSON.stringify((await ribbon()).y)).not.toBe(JSON.stringify(first.y));
    await expectNoErrors(page);
});

test('NB2c lightning: strikes flash and light the gas round them', async ({ page }) => {
    await mountCase(page, 'astro-lightning', { width: '600', height: '400' });
    await sceneReady(page);
    // three seconds of frames: the canvas's mean brightness with a bolt showing and without
    const seen = await page.evaluate(() => new Promise((resolve) => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const canvas = card.renderRoot.querySelector('.astro-scene canvas');
        const ctx = canvas.getContext('2d');
        const on = /** @type {number[]} */ ([]);
        const off = /** @type {number[]} */ ([]);
        const end = performance.now() + 3000;
        const frame = () => {
            const bolt = card._scene.debug().world.list.find((/** @type {any} */ b) => b.id === 'bolts');
            const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
            let sum = 0;
            for (let i = 0; i < data.length; i += 16) sum += data[i] + data[i + 1] + data[i + 2];
            const mean = sum / (data.length / 16);
            if (bolt.node.visible && bolt.lines[2].material.opacity > 0.6) on.push(mean);
            else if (!bolt.node.visible) off.push(mean);
            if (performance.now() < end) requestAnimationFrame(frame);
            else resolve({ on: on.length ? Math.max(...on) : 0, off: off.length ? Math.min(...off) : 0, strikes: on.length });
        };
        frame();
    }));
    const r = /** @type {{ on: number, off: number, strikes: number }} */ (seen);
    expect(r.strikes).toBeGreaterThan(0);
    // the gas lit round a strike: about 1.85 with lights, 1.05 with lights: false (the bolt alone)
    expect(r.on).toBeGreaterThan(r.off * 1.3);
    await expectNoErrors(page);
});

test('NB1 nebula dust: a dark lane hides the gas behind it', async ({ page }) => {
    await mountCase(page, 'astro-nebula-dust', { width: '600', height: '400' });
    await sceneReady(page);
    /** Mean brightness of a strip across the middle (the lane) */
    const mid = () => page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const { width, height } = canvas;
        const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
        let sum = 0, n = 0;
        for (let y = Math.round(height * 0.48); y < height * 0.52; y++) for (let x = Math.round(width * 0.35); x < width * 0.65; x++) {
            const i = (y * width + x) * 4;
            sum += data[i] + data[i + 1] + data[i + 2]; n++;
        }
        return sum / n;
    });
    await expect.poll(mid).toBeGreaterThan(0);
    await page.waitForTimeout(300);
    const dusty = await mid();
    // the same cloud without its dust
    await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const neb = card.config.objects[0];
        window.__reconfigure({ ...card.config, objects: [{ ...neb, clouds: neb.clouds.filter((/** @type {any} */ c) => !c.dust) }] });
    });
    await expect.poll(mid).toBeGreaterThan(dusty * 1.5);
    await expectNoErrors(page);
});

test('E8 planets: built-in maps load, fill_effect planet types and the Saturn ring band draw', async ({ page }) => {
    const failed = [];
    page.on('response', (r) => { if (r.url().includes('/lcards/images/') && !r.ok()) failed.push(r.url()); });
    await mountCase(page, 'astro-planets', { width: '800' });
    await sceneReady(page);
    const info = await page.evaluate(() => {
        const w = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world;
        return { objects: w.list.length, bands: w.objects.get('giant')?.pickMeshes[0]?.material?.uniforms?.uType?.value };
    });
    // textures arrive after the first frame: wait for every image to load
    await expect.poll(() => page.evaluate(() => {
        const w = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world;
        return ['jupiter', 'mars', 'moon', 'venus', 'rings'].map((id) => w.objects.get(id)?.pickMeshes[0]?.material?.map?.image?.width ?? 0);
    }), { timeout: 10_000 }).toEqual([2048, 2048, 2048, 2048, 1024]);
    expect(info.objects).toBe(13);
    expect(info.bands).toBe(3);
    expect(failed).toEqual([]);
    expect(await litPixels(page)).toBeGreaterThan(20_000);
    await expectNoErrors(page);
});

test('E8 belt: one instanced draw of rocks, moving (period, tumble), held by reduced motion', async ({ page }) => {
    await mountCase(page, 'astro-belt', { width: '800' });
    await sceneReady(page);
    const belt = await page.evaluate(() => {
        const b = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world.objects.get('belt');
        return { instanced: b.pickMeshes[0].isInstancedMesh, count: b.pickMeshes[0].count, ticks: typeof b.tick };
    });
    expect(belt).toEqual({ instanced: true, count: 1500, ticks: 'function' });
    expect(await litPixels(page)).toBeGreaterThan(5_000);
    const f0 = (await sceneState(page)).frames;
    await expect.poll(async () => (await sceneState(page)).frames, { timeout: 5_000 }).toBeGreaterThan(f0 + 10);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(300);
    const held = await sceneState(page);
    await page.waitForTimeout(400);
    expect((await sceneState(page)).frames - held.frames).toBeLessThanOrEqual(1);
    await expectNoErrors(page);
});

test('E8 trail: grows behind a moving point, as long as length, head on the point', async ({ page }) => {
    await mountCase(page, 'astro-trail', { width: '800' });
    await sceneReady(page);
    const wake = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const t = s.world.objects.get('wake');
        const line = t.lines[t.lines.length - 1];
        const p = s.world.places.get('ship');
        const pos = line.geometry.attributes.instanceStart.data.array;
        const n = line._segs.count;
        // the head: the last segment's end (vertices are relative to the trail's node, which sits on the head)
        const o = t.node.position;
        const head = [pos[(n - 1) * 6 + 3] + o.x, pos[(n - 1) * 6 + 4] + o.y, pos[(n - 1) * 6 + 5] + o.z];
        return { segments: n, visible: line.object.visible, head, ship: [p.x, p.y, p.z] };
    });
    await expect.poll(async () => (await wake()).segments, { timeout: 5_000 }).toBeGreaterThan(20);
    await page.waitForTimeout(2_500);
    const w = await wake();
    expect(w.visible).toBe(true);
    for (let i = 0; i < 3; i++) expect(Math.abs(w.head[i] - w.ship[i])).toBeLessThan(0.5);
    // 2 s at 90 degrees a second: about 180 degrees of the orbit, not the whole circle
    expect(w.segments).toBeLessThan(300);
    expect(await litPixels(page)).toBeGreaterThan(500);
    await expectNoErrors(page);
});

test('E8 cube: the Borg cube draws green machinery and hides the label behind it', async ({ page }) => {
    await mountCase(page, 'astro-cube', { width: '800' });
    await sceneReady(page);
    const cube = await page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const b = s.world.objects.get('borg');
        return { type: b.type, occluder: b.occluder, material: b.node.getObjectByName('cube').material.name };
    });
    expect(cube).toEqual({ type: 'cube', occluder: 'depth', material: 'lcards-borg-cube' });
    const green = () => page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i + 1] > 40 && data[i + 1] > data[i] + 8) n++;
        return n;
    });
    await expect.poll(green, { timeout: 5_000 }).toBeGreaterThan(5_000);
    const reasons = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        return Object.fromEntries(s.labelItems.map((l) => [l.id, l.reason]));
    });
    // one of the two is behind the cube from here, the other in front
    await expect.poll(async () => Object.values(await reasons()).sort(), { timeout: 5_000 }).toEqual(['occluded', 'ok']);
    await expectNoErrors(page);
});

test('E9 distance: objects out of range are not drawn, and appear as the camera closes in', async ({ page }) => {
    await mountCase(page, 'astro-distance', { width: '800' });
    await sceneReady(page);
    const state = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const shown = (/** @type {string} */ id) => s.world.outer.get(s.world.objects.get(id)).visible;
        return { planet: shown('planet'), orbit: shown('orbit'), disc: shown('disc'), alphas: s.objectAlphas };
    });
    await expect.poll(async () => (await state()).disc, { timeout: 5_000 }).toBe(true);
    let st = await state();
    expect(st.planet).toBe(false);
    expect(st.orbit).toBe(false);
    expect(await litPixels(page)).toBeGreaterThan(500);
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('near', { duration: 0 }));
    // shows and hides fade over time (FADE_MS): the planet is in once its fade is done
    await expect.poll(async () => (await state()).alphas.planet ?? 1, { timeout: 5_000 }).toBe(1);
    await expect.poll(async () => (await state()).disc, { timeout: 5_000 }).toBe(false);
    st = await state();
    expect(st.orbit).toBe(true);
    expect(st.disc).toBe(false);
    expect(st.alphas.planet).toBe(1);
    await expectNoErrors(page);
});

test('E9 belt dots: far away the rocks are drawn as dots, close up as rocks again', async ({ page }) => {
    await mountCase(page, 'astro-belt', { width: '800' });
    await sceneReady(page);
    const form = () => page.evaluate(() => {
        const b = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world.objects.get('belt');
        return { rocks: b.node.getObjectByName('rocks').visible, dots: b.node.getObjectByName('dots').visible };
    });
    expect(await form()).toEqual({ rocks: true, dots: false });
    const fly = (distance) => page.evaluate((d) => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo({ target: [0, 0, 0], yaw: 20, tilt: 30, distance: d }, { duration: 0 }), distance);
    await fly(2500);
    await expect.poll(form, { timeout: 5_000 }).toEqual({ rocks: false, dots: true });
    expect(await litPixels(page)).toBeGreaterThan(30);
    await fly(150);
    await expect.poll(form, { timeout: 5_000 }).toEqual({ rocks: true, dots: false });
    await expectNoErrors(page);
});

test('E10 true scale: the Sun, Earth and Deep Space 9 in km draw at every view', async ({ page }) => {
    await mountCase(page, 'astro-true-scale', { width: '800' });
    await sceneReady(page);
    const state = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const ring = s.world.objects.get('earth_orbit').lines.at(-1);
        return { slices: s.depthSlices, model: s.world.objects.get('station').isReady(), ringSegs: ring._segs.count, keys: s.keys, limits: s.limits.distance };
    });
    const shot = async (name) => { if (process.env.LCARDS_SHOTS) await page.screenshot({ path: `${process.env.LCARDS_SHOTS}/true-scale-${name}.png` }); };
    const fly = (view, duration = 0) => page.evaluate(([v, d]) => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo(v, { duration: d }), [view, duration]);
    await expect.poll(async () => (await state()).model, { timeout: 15_000 }).toBe(true);
    // the station 4 km out, Earth and the Sun far behind: more than one depth slice
    await expect.poll(async () => (await state()).slices.length, { timeout: 5_000 }).toBeGreaterThan(1);
    let st = await state();
    // the default limits reach the station and the whole system
    expect(st.limits[0]).toBeLessThan(1);
    expect(st.limits[1]).toBeGreaterThan(2.1e9);
    expect(await litPixels(page)).toBeGreaterThan(2000);
    await shot('station');
    // Earth from 70,000 km: the orbit ring refined round Earth
    await fly('earth');
    await expect.poll(async () => (await state()).ringSegs, { timeout: 5_000 }).toBeGreaterThan(300);
    expect(await litPixels(page)).toBeGreaterThan(2000);
    await shot('earth');
    // the whole system: one pass is enough again, the ring back to its plain segments
    await fly('system');
    await expect.poll(async () => (await state()).ringSegs, { timeout: 5_000 }).toBeLessThan(300);
    await shot('system');
    // a log fly-to back to the station lands exactly on it
    await fly('station', 1200);
    await expect.poll(async () => (await state()).keys.distance, { timeout: 5_000 }).toBe(4);
    st = await state();
    await shot('station-after-fly');
    expect(st.slices.length).toBeGreaterThan(1);
    await expectNoErrors(page);
});

test('M3 face: motion: a ship on a tilted spinning orbit flies nose first; without it the ship keeps its turn', async ({ page }) => {
    await mountCase(page, 'astro-face', { width: '800' });
    await sceneReady(page);
    const state = () => page.evaluate(() => {
        const w = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world;
        const bow = (id) => {
            const g = w.outer.get(w.objects.get(id));
            const q = g.quaternion;
            // +z turned by q
            const x = 2 * (q.x * q.z + q.w * q.y), y = 2 * (q.y * q.z - q.w * q.x), z = 1 - 2 * (q.x * q.x + q.y * q.y);
            return [x, y, z];
        };
        const at = (id) => { const p = w.places.get(id); return [p.x, p.y, p.z]; };
        const rel = at('shuttle').map((c, i) => c - at('planet')[i]);
        return { facing: bow('model#1'), sliding: bow('model#2'), shuttle: bow('model#3'), pos: at('facing'), shuttleRel: rel };
    });
    // two states a couple of frames apart (a long wait under load would measure a chord, not the heading)
    await page.waitForTimeout(300);
    const a = await state();
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r)))));
    const b = await state();
    const unit = (v) => { const l = Math.hypot(...v); return v.map((c) => c / l); };
    const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    const travel = unit(b.pos.map((c, i) => c - a.pos[i]));
    // nose along the travel (it tips with the 20-degree tilt), upright
    expect(dot(b.facing, travel)).toBeGreaterThan(0.97);
    expect(Math.abs(b.facing[1])).toBeGreaterThan(0.05);
    // without face: the turn it was given (none)
    expect(b.sliding).toEqual([0, 0, 1]);
    // the shuttle round a moving planet: along its orbit round the planet (not the planet's way)
    const shuttleTravel = unit(b.shuttleRel.map((c, i) => c - a.shuttleRel[i]));
    expect(dot(b.shuttle, shuttleTravel)).toBeGreaterThan(0.9);
    if (process.env.LCARDS_SHOTS) await page.screenshot({ path: `${process.env.LCARDS_SHOTS}/face-motion.png` });
    await expectNoErrors(page);
});

test('M3 face: motion under reduced motion: the ships hold still, facing along their orbits', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mountCase(page, 'astro-face', { width: '800' });
    await sceneReady(page);
    const state = () => page.evaluate(() => {
        const w = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world;
        const q = w.outer.get(w.objects.get('model#1')).quaternion;
        const p = w.places.get('facing');
        return { bow: [2 * (q.x * q.z + q.w * q.y), 2 * (q.y * q.z - q.w * q.x), 1 - 2 * (q.x * q.x + q.y * q.y)], pos: [p.x, p.y, p.z] };
    });
    const a = await state();
    await page.waitForTimeout(300);
    const b = await state();
    expect(b.pos).toEqual(a.pos);
    // polar [60, 0] is north of the base; a prograde spin carries it west (the ring tipped 20 degrees about x)
    expect(b.bow[0]).toBeLessThan(-0.95);
    expect(Math.abs(b.bow[0] * b.pos[0] + b.bow[1] * b.pos[1] + b.bow[2] * b.pos[2])).toBeLessThan(1e-3);
    await expectNoErrors(page);
});

test('E10/R4a true-scale starters: the solar system in km draws whole, at Jupiter, Saturn and Earth', async ({ page }) => {
    // 21 textured bodies and two belts: slow on SwiftShader when the suite runs in parallel
    test.setTimeout(90_000);
    await mountCase(page, 'astro-true-solar', { width: '800' });
    await sceneReady(page);
    const shot = async (name) => { if (process.env.LCARDS_SHOTS) await page.screenshot({ path: `${process.env.LCARDS_SHOTS}/true-solar-${name}.png` }); };
    const fly = (view) => page.evaluate((v) => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo(v, { duration: 0 }), view);
    const labels = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().labelItems.filter((l) => l.visible).map((l) => l.id));
    // the whole system, Neptune 4.5 billion km out: the outer planets' labels (the inner ones crowd round the Sun)
    await expect.poll(async () => (await labels()).sort(), { timeout: 5_000 }).toEqual(expect.arrayContaining(['jupiter', 'neptune', 'saturn', 'uranus']));
    expect(await litPixels(page)).toBeGreaterThan(2000);
    await shot('system');
    for (const view of ['jupiter', 'saturn', 'earth']) {
        await fly(view);
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        expect(await litPixels(page), view).toBeGreaterThan(4000);
        await shot(view);
    }
    await expectNoErrors(page);
});

test('E10 star system: a dive from a galaxy in ly to a station in km, the frame changing on the way', async ({ page }) => {
    await mountCase(page, 'astro-dive', { width: '800' });
    await sceneReady(page);
    const state = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const ds9 = s.world.places.get('ds9');
        const label = (id) => { const it = s.labelItems.find((l) => l.id === id); return it?.visible ? [it.sx, it.sy] : null; };
        return {
            frame: s.frame, keys: s.keys, slices: s.depthSlices, model: s.world.objects.get('station').isReady(),
            ds9: ds9 ? [ds9.x, ds9.y, ds9.z] : null, earth: label('earth'), ds9Label: label('ds9'), sol: label('sol'), changes: s.frameChanges
        };
    });
    const shot = async (name) => { if (process.env.LCARDS_SHOTS) await page.screenshot({ path: `${process.env.LCARDS_SHOTS}/dive-${name}.png` }); };
    const fly = (view, duration = 0) => page.evaluate(([v, d]) => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo(v, { duration: d }), [view, duration]);
    // the galaxy: the scene's own frame
    let st = await state();
    expect(st.frame).toBe('root');
    await expect.poll(async () => (await state()).sol, { timeout: 5_000 }).not.toBeNull();
    expect(await litPixels(page)).toBeGreaterThan(2000);
    await shot('galaxy');
    await fly('near_sol');
    expect((await state()).frame).toBe('root');
    await shot('near-sol');
    // Earth from 70,000 km: inside the system, in km
    await fly('earth');
    await expect.poll(async () => (await state()).frame, { timeout: 5_000 }).toBe('sol_system');
    await expect.poll(async () => (await state()).earth, { timeout: 5_000 }).not.toBeNull();
    expect(await litPixels(page)).toBeGreaterThan(2000);
    await shot('earth');
    // no jump at a frame change: the same view drawn in the galaxy's frame puts Earth and DS9 where they were
    const before = await state();
    await page.evaluate(() => { const d = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug(); d.holdFrame(true); d.setFrame('root'); });
    await page.evaluate(() => { /** @type {any} */ (document.querySelector('#mount > *'))._scene.requestFrame(); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); });
    const flipped = await state();
    expect(flipped.frame).toBe('root');
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().holdFrame(false));
    for (const id of ['earth', 'ds9Label']) {
        expect(flipped[id], id).not.toBeNull();
        expect(Math.hypot(flipped[id][0] - before[id][0], flipped[id][1] - before[id][1]), id).toBeLessThan(1);
    }
    // the station, 4 km out: depth slices, and the camera on DS9 exactly
    await fly('station');
    await expect.poll(async () => (await state()).frame, { timeout: 5_000 }).toBe('sol_system');
    await expect.poll(async () => (await state()).model, { timeout: 15_000 }).toBe(true);
    await expect.poll(async () => (await state()).slices.length, { timeout: 5_000 }).toBeGreaterThan(1);
    st = await state();
    expect(st.frame).toBe('sol_system');
    expect([st.keys.tx, st.keys.ty, st.keys.tz]).toEqual(st.ds9);
    expect(await litPixels(page)).toBeGreaterThan(2000);
    await shot('station');
    // the Studio's capture and picks here: the view names DS9 with its distance in km, the ground is the system's
    const studio = await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const c = card.shadowRoot.querySelector('canvas');
        const x = c.clientWidth / 2;
        const y = c.clientHeight / 2;
        return { view: card._scene.viewNow(), system: card._scene.placeAt(x, y, 'xyz', undefined, 'sol_system'), scene: card._scene.placeAt(x, y, 'xyz') };
    });
    expect(studio.view.target).toBe('ds9');
    expect(studio.view.distance).toBe(4);
    expect(Math.hypot(studio.system[0] - st.ds9[0], studio.system[2] - st.ds9[2])).toBeLessThan(1);
    expect(studio.system[1]).toBe(0);
    // without a system: the galaxy's ground, in light years
    expect(studio.scene).not.toBeNull();
    expect(Math.hypot(studio.scene[0], studio.scene[2])).toBeGreaterThan(20000);
    expect(Math.hypot(studio.scene[0], studio.scene[2])).toBeLessThan(40000);
    // out to the galaxy and all the way back in one fly-to: lands on DS9 exactly, in the system's km
    await fly('galaxy', 1500);
    await expect.poll(async () => (await state()).frame, { timeout: 8_000 }).toBe('root');
    await fly('station', 2500);
    await expect.poll(async () => (await state()).keys.distance, { timeout: 8_000 }).toBe(4);
    st = await state();
    expect(st.frame).toBe('sol_system');
    expect([st.keys.tx, st.keys.ty, st.keys.tz]).toEqual(st.ds9);
    await shot('station-after-dive');
    await expectNoErrors(page);
});

/** The followed point's distance from the camera target, current frame units */
const followGap = (page, id) => page.evaluate((pid) => {
    const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
    const p = s.world.places.get(pid);
    return Math.hypot(p.x - s.keys.tx, p.y - s.keys.ty, p.z - s.keys.tz);
}, id);

test('N1 follow: a tap on a moving point lands on it and keeps it centred; zoom keeps it, a pan keeps following offset from it', async ({ page }) => {
    await mountCase(page, 'astro-follow', { width: '800' });
    await sceneReady(page);
    const ship = await pointOnPage(page, 'ship');
    await page.mouse.click(ship.x, ship.y);
    // lands on where the ship is now, not where it was at the tap
    await expect.poll(async () => (await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().follow)), { timeout: 5000 })
        .toEqual({ id: 'ship', moving: true });
    await page.waitForTimeout(900);
    expect(await followGap(page, 'ship')).toBeLessThan(0.5);
    const before = (await sceneState(page)).keys;
    await page.waitForTimeout(400);
    const after = (await sceneState(page)).keys;
    expect(Math.hypot(after.tx - before.tx, after.tz - before.tz)).toBeGreaterThan(2);
    expect(await followGap(page, 'ship')).toBeLessThan(0.5);

    // the wheel zooms about the ship (the cursor is elsewhere) and keeps following
    const b = await sceneBox(page);
    await page.mouse.move(b.x + 40, b.y + 40);
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(200);
    expect(await followGap(page, 'ship')).toBeLessThan(0.5);
    expect((await sceneState(page)).keys.distance).toBeLessThan(before.distance);

    // a pan (shift-drag) keeps following, offset from the ship: the gap holds while the ship moves on
    await page.keyboard.down('Shift');
    await page.mouse.move(b.x + b.w / 2, b.y + b.h / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.w / 2 + 40, b.y + b.h / 2, { steps: 3 });
    await page.mouse.up();
    await page.keyboard.up('Shift');
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().follow)).toEqual({ id: 'ship', moving: true });
    const gap = await followGap(page, 'ship');
    expect(gap).toBeGreaterThan(0.5);
    const parked = (await sceneState(page)).keys;
    await page.waitForTimeout(300);
    const still = (await sceneState(page)).keys;
    expect(Math.hypot(still.tx - parked.tx, still.tz - parked.tz)).toBeGreaterThan(1);
    expect(Math.abs((await followGap(page, 'ship')) - gap)).toBeLessThan(0.5);

    // fly forward (W) keeps following too, and the ship stays selected
    const followState = () => page.evaluate(() => {
        const d = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        return { follow: d.follow, selected: !!d.labelItems.find((l) => l.id === 'ship')?.selected };
    });
    await page.locator('lcards-astrometrics-card .astro-scene').focus();
    await page.keyboard.press('w');
    await page.waitForTimeout(300);
    expect(await followState()).toEqual({ follow: { id: 'ship', moving: true }, selected: true });
    // a tap on blank space lets go, and the highlight goes with it
    await page.mouse.click(b.x + 20, b.y + b.h - 20);
    expect(await followState()).toEqual({ follow: null, selected: false });
    await expectNoErrors(page);
});

test('follow an object on a moving point: frameObject flies to the point and follows it, in the Studio too (a point drag lets go)', async ({ page }) => {
    await mountCase(page, 'astro-follow', { width: '800' });
    await sceneReady(page);
    const follow = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().follow);
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.frameObject('rock'));
    await expect.poll(follow, { timeout: 5000 }).toEqual({ id: 'ship', moving: true });
    await page.waitForTimeout(900);
    expect(await followGap(page, 'ship')).toBeLessThan(0.5);
    // edit mode (the Studio's preview): showing it follows as well
    await page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene;
        s.flyTo('top', { duration: 0 });
        s.setEditMode({ onSelect: () => {}, onDrag: () => {} });
    });
    expect(await follow()).toBeNull();
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.frameObject('rock'));
    await expect.poll(follow, { timeout: 5000 }).toEqual({ id: 'ship', moving: true });
    await page.waitForTimeout(900);
    expect(await followGap(page, 'ship')).toBeLessThan(0.5);
    // grabbing the ship's label to drag it lets go first
    const ship = await pointOnPage(page, 'ship');
    await page.mouse.move(ship.x, ship.y);
    await page.mouse.down();
    expect(await follow()).toBeNull();
    await page.mouse.up();
    await expectNoErrors(page);
});

test('N1 follow: a still point never counts as moving; flying to a view or tapping blank space lets go; follow: false never follows', async ({ page }) => {
    await mountCase(page, 'astro-follow', { width: '800' });
    await sceneReady(page);
    const scene = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().follow);
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('base', { duration: 0 }));
    await page.waitForTimeout(200);
    expect(await scene()).toEqual({ id: 'base', moving: false });
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('ship'));
    await expect.poll(scene).toEqual({ id: 'ship', moving: true });
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('top', { duration: 0 }));
    expect(await scene()).toBeNull();

    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('ship', { duration: 0 }));
    await expect.poll(scene).toEqual({ id: 'ship', moving: true });
    const b = await sceneBox(page);
    await page.mouse.click(b.x + 20, b.y + b.h - 20);
    expect(await scene()).toBeNull();

    await reconfigureCamera(page, { follow: false });
    await page.waitForTimeout(100);
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('ship', { duration: 0 }));
    expect(await scene()).toBeNull();
    await expectNoErrors(page);
});

/** Send a wheel event at the scene's centre (deltas in px unless deltaMode) */
const wheelAt = (page, init) => page.evaluate((i) => {
    const el = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, ...i }));
}, init);

test('N1 wheel: a touchpad swipe pans, a pinch (ctrl+wheel) zooms, a mouse notch zooms; wheel: zoom zooms a swipe', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    for (let i = 0; i < 5; i++) await wheelAt(page, { deltaX: 8.5, deltaY: 0 });
    let k = await settled(page);
    expect(k.tx).toBeGreaterThan(5);
    expect(k.distance).toBeCloseTo(200, 3);
    await page.waitForTimeout(400);
    await wheelAt(page, { deltaY: -6, ctrlKey: true });
    k = await settled(page);
    expect(k.distance).toBeLessThan(195);
    await page.waitForTimeout(400);
    const d0 = k.distance;
    await wheelAt(page, { deltaY: 100 });
    expect((await settled(page)).distance).toBeGreaterThan(d0 * 1.05);

    await reconfigureCamera(page, { wheel: 'zoom' });
    await page.waitForTimeout(400);
    const k0 = await settled(page);
    await wheelAt(page, { deltaX: 0, deltaY: 20.5 });
    const k1 = await settled(page);
    expect(k1.distance).toBeGreaterThan(k0.distance);
    expect(k1.tx).toBeCloseTo(k0.tx, 6);
});

test('N1 middle-drag pans', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    const b = await sceneBox(page);
    await page.mouse.move(b.x + b.w / 2, b.y + b.h / 2);
    await page.mouse.down({ button: 'middle' });
    await page.mouse.move(b.x + b.w / 2 - 80, b.y + b.h / 2, { steps: 4 });
    await page.mouse.up({ button: 'middle' });
    const k = await settled(page);
    expect(k.tx).toBeGreaterThan(5);
    expect(k.yaw).toBeCloseTo(0, 3);
});

test('N1 buttons: hide idle fades them after a few seconds and a pointer move brings them back; toggle folds them', async ({ page }) => {
    await mountCase(page, 'astro-follow', { width: '800' });
    await sceneReady(page);
    const group = page.locator('lcards-astrometrics-card .astro-buttons');
    // under load the scene can take longer than the idle time to be ready: wake them first
    const box = await sceneBox(page);
    await page.mouse.move(box.x + 60, box.y + 60);
    await page.mouse.move(box.x + 70, box.y + 66);
    await expect(group).not.toHaveAttribute('data-idle', '');
    await expect(group).toHaveAttribute('data-idle', '', { timeout: 6000 });
    expect(await group.evaluate((el) => el.inert)).toBe(true);
    const b = await sceneBox(page);
    await page.mouse.move(b.x + 100, b.y + 100);
    await page.mouse.move(b.x + 120, b.y + 110);
    await expect(group).not.toHaveAttribute('data-idle', '');

    await reconfigureCamera(page, { buttons: { hide: 'toggle' } });
    const buttons = page.locator('lcards-astrometrics-card .astro-buttons button');
    await expect(buttons).toHaveCount(10);
    await page.locator('lcards-astrometrics-card button[data-cmd="fold"]').click();
    await expect(buttons).toHaveCount(1);
    await page.locator('lcards-astrometrics-card button[data-cmd="unfold"]').click();
    await expect(buttons).toHaveCount(10);
    await page.waitForTimeout(3500);
    await expect(group).not.toHaveAttribute('data-idle', '');
    await expectNoErrors(page);
});

test('N1 labels: a tap on the label text (not the point) flies to the point and follows it', async ({ page }) => {
    await mountCase(page, 'astro-follow', { width: '800' });
    await sceneReady(page);
    // hold the motion so the label stays put while it is measured and tapped
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.setTimeScale(0));
    const box = await page.locator('lcards-astrometrics-card .astro-label', { hasText: 'SHIP' }).boundingBox();
    const point = await pointOnPage(page, 'ship');
    // the far end of the label's box, well past the 18 px round the point
    const x = Math.abs(box.x - point.x) > Math.abs(box.x + box.width - point.x) ? box.x + 3 : box.x + box.width - 3;
    expect(Math.abs(x - point.x)).toBeGreaterThan(20);
    await page.mouse.click(x, box.y + box.height / 2);
    await expect.poll(() => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().follow?.id), { timeout: 5000 }).toBe('ship');
});

test('N1 labels on objects: the label stands off the ship with a leader, never hidden by the ship while it moves; a tap on the hull follows it', async ({ page }) => {
    await mountCase(page, 'astro-leader', { width: '800' });
    await sceneReady(page);
    const label = page.locator('lcards-astrometrics-card .astro-label', { hasText: 'SHIP' });
    const leader = page.locator('lcards-astrometrics-card .astro-leader[data-leader="ship"]');
    // the model loaded and the depth image is in: sampled while the ship circles, the label always shows
    await page.waitForTimeout(500);
    const samples = [];
    for (let i = 0; i < 20; i++) {
        samples.push(await page.evaluate(() => {
            const card = /** @type {any} */ (document.querySelector('#mount > *'));
            const it = card._scene.debug().labelItems.find((/** @type {any} */ l) => l.id === 'ship');
            return { reason: it.reason, gap: it.gap, reach: it.reach };
        }));
        await page.waitForTimeout(50);
    }
    expect(samples.filter((s) => s.reason !== 'ok'), JSON.stringify(samples)).toEqual([]);
    expect(samples.every((s) => s.reach > 5 && s.gap > s.reach)).toBe(true);
    expect(Number(await leader.evaluate((el) => getComputedStyle(el).opacity))).toBeGreaterThan(0);

    // held still: the label's box clears the hull on screen
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.setTimeScale(0));
    await page.waitForTimeout(200);
    const point = await pointOnPage(page, 'ship');
    const reach = await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().labelItems.find((/** @type {any} */ l) => l.id === 'ship').reach);
    const box = await label.boundingBox();
    const near = Math.min(Math.abs(box.x - point.x), Math.abs(box.x + box.width - point.x));
    expect(near).toBeGreaterThan(reach);
    // a tap on the hull (no marker, past the 18 px round the point) selects and follows
    await page.mouse.click(point.x, point.y + Math.min(reach * 0.7, reach - 2));
    await expect.poll(() => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().follow?.id), { timeout: 5000 }).toBe('ship');
});

test('grid options: a pixel height takes the sections rows it needs (no running into the next card); no height, its default 400 px', async ({ page }) => {
    await mountCase(page, 'astro-follow', { width: '800' });
    await sceneReady(page);
    const rows = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *')).getGridOptions().rows);
    // height 400: 400 px plus the gap in 64 px rows
    expect(await rows()).toBe(7);
    await page.evaluate(() => window.__reconfigure({ ...(/** @type {any} */ (document.querySelector('#mount > *'))).config, height: 650 }));
    expect(await rows()).toBe(11);
    await page.evaluate(() => { const c = { ...(/** @type {any} */ (document.querySelector('#mount > *'))).config }; delete c.height; window.__reconfigure(c); });
    expect(await rows()).toBe(7);
    await page.evaluate(() => window.__reconfigure({ ...(/** @type {any} */ (document.querySelector('#mount > *'))).config, grid_options: { rows: 4 } }));
    expect(await rows()).toBe(4);
});

test('N1 time: the slider slows, holds and speeds the scene; time_scale sets the start; buttons.time: false hides it', async ({ page }) => {
    await mountCase(page, 'astro-follow', { width: '800' });
    await sceneReady(page);
    const clock = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().clock);
    const slider = page.locator('lcards-astrometrics-card .astro-time input');
    await expect(slider).toHaveCount(1);
    await expect(page.locator('lcards-astrometrics-card .astro-time-value')).toHaveText('1×');
    // stop 0: hold
    await slider.fill('0');
    await expect(page.locator('lcards-astrometrics-card .astro-time-value')).toHaveText('HOLD');
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.timeScale())).toBe(0);
    const c0 = await clock();
    await page.waitForTimeout(300);
    expect(await clock()).toBe(c0);
    // stop 6: four times as fast
    await slider.fill('6');
    const c1 = await clock();
    await page.waitForTimeout(500);
    expect((await clock()) - c1).toBeGreaterThan(1000);

    await reconfigureCamera(page, { buttons: { time: false } });
    await expect(slider).toHaveCount(0);
    await page.evaluate(() => {
        const raw = JSON.parse(JSON.stringify(/** @type {any} */ (document.querySelector('#mount > *'))._rawConfig));
        window.__reconfigure({ ...raw, time_scale: 0.5 });
    });
    await expect.poll(() => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.timeScale())).toBe(0.5);
    await expectNoErrors(page);
});

test('R4a clock: body points sit where the ephemeris puts them; the date slider runs the date; NOW; set-clock from the registry and lcards.set_clock', async ({ page }) => {
    // about 5 s alone; the full parallel suite (the heavy galaxy scenes) can stretch it past the default 30 s
    test.setTimeout(90_000);
    const { position, toScene, AU_KM } = await import('../../src/core/astrometrics/ephemeris.js');
    const T0 = Date.UTC(2026, 9, 30, 12);
    const J2000 = Date.UTC(2000, 0, 1, 12);
    /** where a body point should be, au (scene axes) */
    const want = (body, ms) => toScene(position(body, ms)).map((v) => v / AU_KM);
    await mountCase(page, 'astro-clock', { width: '800' });
    await sceneReady(page);
    const state = () => page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const s = card._scene;
        const places = s.debug().world.places;
        const at = (id) => { const v = places.get(id); return v ? [v.x, v.y, v.z] : null; };
        return { clock: s.clock(), mars: at('mars'), earth: at('earth'), moon: at('moon') };
    });
    const close = (a, b, eps) => a.every((v, i) => Math.abs(v - b[i]) < eps);
    let st = await state();
    expect(st.clock.date).toBe(T0);
    expect(st.clock.rate).toBe(0);
    expect(close(st.mars, want('mars', T0), 1e-6)).toBe(true);
    expect(close(st.earth, want('earth', T0), 1e-6)).toBe(true);
    // Luna by Earth: 384,000 km is 0.0026 au
    const d = Math.hypot(st.moon[0] - st.earth[0], st.moon[1] - st.earth[1], st.moon[2] - st.earth[2]);
    expect(d).toBeGreaterThan(0.0023);
    expect(d).toBeLessThan(0.0028);

    // the time slider: a card with a clock shows the date slider (and the switch)
    const date = page.locator('lcards-astrometrics-card .astro-date');
    await expect(date).toHaveCount(1);
    await expect(page.locator('lcards-astrometrics-card .astro-date-text')).toHaveText(/^2026-10-3\d \d\d:\d\d$/);
    await expect(page.locator('lcards-astrometrics-card .astro-date .astro-time-value').last()).toHaveText('PAUSED');
    // a day a second: the date runs on, and Mars with it
    await page.locator('lcards-astrometrics-card .astro-date input').fill('6');
    await expect(page.locator('lcards-astrometrics-card .astro-date .astro-time-value').last()).toHaveText('1 D/S');
    await page.waitForTimeout(600);
    st = await state();
    expect(st.clock.rate).toBe(1);
    expect(st.clock.date - T0).toBeGreaterThan(0.3 * 86400000);
    await expect.poll(async () => close((await state()).mars, want('mars', T0), 1e-6), { timeout: 3000 }).toBe(false);
    // NOW: today, live
    await page.locator('lcards-astrometrics-card [data-cmd="clock-now"]').click();
    st = await state();
    expect(Math.abs(st.clock.date - Date.now())).toBeLessThan(5000);
    expect(st.clock.rate).toBeCloseTo(1 / 86400, 12);
    // the switch shows the speed slider instead
    await page.locator('lcards-astrometrics-card [data-cmd="time-mode"]').click();
    await expect(page.locator('lcards-astrometrics-card .astro-date')).toHaveCount(0);
    await expect(page.locator('lcards-astrometrics-card .astro-time-value')).toHaveText('1×');

    // the registry (set-clock actions from other cards) and lcards.set_clock
    expect(await page.evaluate(() => window.lcards.cards.astrometrics.setClock('astro_clock', { date: '2000-01-01T12:00:00Z', rate: 0 }))).toBe(1);
    await expect.poll(async () => close((await state()).mars, want('mars', J2000), 1e-6), { timeout: 3000 }).toBe(true);
    await page.evaluate(() => window.lcards.core.integrationService._handleLcardsEvent({ action: 'set_clock', card_id: 'astro_clock', date: '2026-10-30T12:00:00Z' }));
    await expect.poll(async () => (await state()).clock.date, { timeout: 3000 }).toBe(T0);
    expect((await state()).clock.rate).toBe(0);
    // a rebuild for another reason keeps the set date; a new clock in the config wins
    await reconfigureCamera(page, { auto_rotate: 0 });
    await page.evaluate(() => window.lcards.cards.astrometrics.setClock('astro_clock', { date: '2000-01-01T12:00:00Z' }));
    await reconfigureCamera(page, { fly_duration: 100 });
    await expect.poll(async () => (await state()).clock.date, { timeout: 3000 }).toBe(J2000);
    await page.evaluate(() => {
        const raw = JSON.parse(JSON.stringify(/** @type {any} */ (document.querySelector('#mount > *'))._rawConfig));
        window.__reconfigure({ ...raw, clock: { date: '2026-01-01', rate: 0 } });
    });
    await expect.poll(async () => (await state()).clock.date, { timeout: 3000 }).toBe(Date.UTC(2026, 0, 1));
    await expectNoErrors(page);
});

test('R4a date panel: wide enough for the date, NOW, the slider and the rate, and clear of the camera buttons in every corner', async ({ page }) => {
    await mountCase(page, 'astro-clock', { width: '800' });
    await sceneReady(page);
    /** boxes of the parts that must not overlap */
    const boxes = () => page.evaluate(() => {
        const root = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot;
        const r = (sel) => { const e = root.querySelector(sel); if (!e) return null; const b = e.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
        return {
            card: r('.astro-card'), panel: r('.astro-time'), text: r('.astro-date-text'), now: r('[data-cmd="clock-now"]'),
            slider: r('.astro-time input'), zoomIn: r('[data-cmd="zoom-in"]'), zoomOut: r('[data-cmd="zoom-out"]')
        };
    });
    const overlap = (a, b) => a && b && a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
    const inside = (a, c) => a.x >= c.x - 0.5 && a.y >= c.y - 0.5 && a.x + a.w <= c.x + c.w + 0.5 && a.y + a.h <= c.y + c.h + 0.5;
    for (const position of ['bottom-right', 'bottom-left', 'top-center']) {
        await reconfigureCamera(page, { buttons: { position, hide: 'never' } });
        await expect(page.locator('lcards-astrometrics-card .astro-date')).toHaveCount(1);
        const b = await boxes();
        expect(b.panel.w, position).toBeGreaterThan(200);
        for (const k of ['zoomIn', 'zoomOut']) expect(overlap(b.panel, b[k]), `${position}: the panel over ${k}`).toBeFalsy();
        expect(overlap(b.text, b.now), `${position}: the date under NOW`).toBeFalsy();
        expect(b.slider.w, `${position}: a usable slider`).toBeGreaterThan(100);
        for (const k of ['text', 'now', 'slider']) expect(inside(b[k], b.panel), `${position}: ${k} inside the panel`).toBe(true);
        expect(inside(b.panel, b.card), `${position}: the panel on the card`).toBe(true);
    }
    // the speed slider with the switch: wide too, clear of the buttons
    await page.locator('lcards-astrometrics-card [data-cmd="time-mode"]').click();
    const s = await boxes();
    expect(s.panel.w).toBeGreaterThan(200);
    expect(overlap(s.panel, s.zoomIn) || overlap(s.panel, s.zoomOut)).toBeFalsy();
    await expectNoErrors(page);
});

test('R4b settings from entities: opacity and size ease to their entity, a template rebuilds its object, the camera tours on the stage', async ({ page }) => {
    await mountCase(page, 'astro-bindings', { width: '800' });
    await sceneReady(page);
    const live = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().live);
    const debug = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const glow = s.world.objects.get('core');
        const well = s.world.objects.get('well');
        // the glow's drawn size: the size it was built at times its live scale
        return { builds: s.objectBuilds, glowSize: Number(glow.config.size) * glow.node.scale.x, amplitude: well.config.deform?.[0]?.amplitude, keys: s.keys, alpha: s.objectAlphas.bubble };
    });
    // shields 50: the bubble at 0.3 (the first value lands at once)
    await page.evaluate(() => window.__setState('input_number.lcards_test_shields', '50'));
    await expect.poll(async () => (await live())['bubble.opacity']?.value, { timeout: 5000 }).toBeCloseTo(0.3, 6);
    await expect.poll(async () => (await debug()).alpha, { timeout: 5000 }).toBeCloseTo(0.3, 3);
    // shields 100: eases (on its way, then there)
    await page.evaluate(() => window.__setState('input_number.lcards_test_shields', '100'));
    await page.waitForTimeout(150);
    const mid = (await live())['bubble.opacity'];
    expect(mid.to).toBeCloseTo(0.6, 6);
    expect(mid.value).toBeGreaterThan(0.3);
    expect(mid.value).toBeLessThan(0.6);
    await expect.poll(async () => (await live())['bubble.opacity'].value, { timeout: 3000 }).toBeCloseTo(0.6, 6);

    // power 0 then 100: the glow's size 10 then 60 (node scale against the size it was built at; a first
    // value also rebuilds it at that size, so built size times scale is what shows)
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '0'));
    await expect.poll(async () => (await live())['core.size']?.value, { timeout: 5000 }).toBeCloseTo(10, 6);
    const builds = (await debug()).builds;
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '100'));
    await expect.poll(async () => (await live())['core.size'].value, { timeout: 3000 }).toBeCloseTo(60, 6);
    await expect.poll(async () => (await debug()).glowSize, { timeout: 3000 }).toBeCloseTo(60, 3);
    // the wobble's template: power / 1000, a rebuild of the grid (not every frame)
    await expect.poll(async () => (await debug()).amplitude, { timeout: 3000 }).toBeCloseTo(0.1, 6);
    expect((await debug()).builds).toBeGreaterThan(builds);

    // the tour: stage 1 flies to far (and holds the clock there), stage 0 back to near
    await page.evaluate(() => window.__setState('input_number.lcards_test_stage', '1'));
    await expect.poll(async () => Math.round((await debug()).keys.distance), { timeout: 6000 }).toBe(400);
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.clock().rate)).toBe(0);
    await page.evaluate(() => window.__setState('input_number.lcards_test_stage', '0'));
    await expect.poll(async () => Math.round((await debug()).keys.distance), { timeout: 6000 }).toBe(120);
    await expectNoErrors(page);
});

test('whole-number settings and type live keys: a belt\'s count and inner edge ease in place, the belt never rebuilds', async ({ page }) => {
    await mountCase(page, 'astro-bindings', { width: '800' });
    await sceneReady(page);
    const belt = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const b = s.world.objects.get('rocks');
        const mesh = b?.node.getObjectByName('rocks');
        // the belt's node: the same one unless the belt is rebuilt (power also drives other objects here)
        return { count: mesh?.count ?? null, most: mesh?.instanceMatrix.count ?? null, node: b?.node.uuid, inner: s.live['rocks.radius.0'], radius: b?.radius };
    });
    // power 33.3: 100 + 0.333 * 900 = 399.7 rocks, so 400 (a count binding builds for the top of output, 1000,
    // above the 600 it draws before a value; the scene's first build has no settings yet, so the card builds the belt once more for it)
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '33.3'));
    await expect.poll(async () => (await belt()).count, { timeout: 5000 }).toBe(400);
    await expect.poll(async () => (await belt()).most, { timeout: 5000 }).toBe(1000);
    await page.waitForTimeout(600);
    const node = (await belt()).node;
    // 100: all 1000, eased, the same belt
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '100'));
    // on its way (seen between the two), then there
    await expect.poll(async () => { const n = (await belt()).count; return n > 400 && n < 1000; }, { timeout: 3000, intervals: [30] }).toBe(true);
    await expect.poll(async () => (await belt()).count, { timeout: 5000 }).toBe(1000);
    // the inner edge on its own entity (a side of the pair): shields 50 gives 40 + 0.5 * 30 = 55, the outer stays 90
    await page.evaluate(() => window.__setState('input_number.lcards_test_shields', '50'));
    await expect.poll(async () => (await belt()).inner?.value, { timeout: 5000 }).toBeCloseTo(55, 6);
    expect((await belt()).radius).toBe(90);
    await page.waitForTimeout(400);
    expect((await belt()).node).toBe(node);
    await expectNoErrors(page);
});

test('NB2b colours from entities: a state map (state, active / inactive, above:N), a colours item and a template rebuild their object with the colour', async ({ page }) => {
    await mountCase(page, 'astro-colours', { width: '800' });
    await sceneReady(page);
    const colors = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const cfg = (/** @type {string} */ id) => s.world.objects.get(id)?.config ?? {};
        return { deck: cfg('deck').color, edges: cfg('deck').edges?.color, cloud: cfg('cloud').colors?.[1], bubble: cfg('bubble').color, builds: s.objectBuilds };
    });
    // orange pixels on the canvas: the deck's lines, drawn in the colour
    const orange = () => page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) if (data[i] > 170 && data[i + 1] > 90 && data[i + 1] < 190 && data[i + 2] < 90) n++;
        return n;
    });
    await page.evaluate(() => window.__setState('input_boolean.lcards_test_toggle', 'on'));
    await expect.poll(async () => (await colors()).deck, { timeout: 5000 }).toBe('#ff9900');
    await expect.poll(orange, { timeout: 5000 }).toBeGreaterThan(500);
    await page.evaluate(() => window.__setState('input_boolean.lcards_test_toggle', 'off'));
    await expect.poll(async () => (await colors()).deck, { timeout: 5000 }).toBe('#808080');
    await expect.poll(orange, { timeout: 5000 }).toBeLessThan(100);
    // a number over 80: the edges' above:80 key and the sphere's template
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '50'));
    await expect.poll(async () => (await colors()).edges, { timeout: 5000 }).toBe('#0000ff');
    await expect.poll(async () => (await colors()).bubble, { timeout: 5000 }).toBe('#00ff00');
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '90'));
    await expect.poll(async () => (await colors()).edges, { timeout: 5000 }).toBe('#ff0000');
    await expect.poll(async () => (await colors()).bubble, { timeout: 5000 }).toBe('#ff0000');
    // one item of a colours list by its own entity; the other stays
    await page.evaluate(() => window.__setState('input_select.lcards_test_mode', 'beta'));
    await expect.poll(async () => (await colors()).cloud, { timeout: 5000 }).toBe('#ff6600');
    await page.evaluate(() => window.__setState('input_select.lcards_test_mode', 'delta'));
    await expect.poll(async () => (await colors()).cloud, { timeout: 5000 }).toBe('#ff0000');
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world.objects.get('cloud').config.colors[0])).toBe('#3366ff');
    // the same colour again does not rebuild
    const before = (await colors()).builds;
    await page.evaluate(() => window.__setState('input_select.lcards_test_mode', 'gamma'));
    await page.waitForTimeout(600);
    expect((await colors()).builds).toBe(before);
    await expectNoErrors(page);
});

test('AC1 asteroid: one rock, the half toward its light bright, the far half dark', async ({ page }) => {
    await mountCase(page, 'astro-asteroid', { width: '800' });
    await sceneReady(page);
    expect(await litPixels(page)).toBeGreaterThan(5000);
    const halves = await page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const { width, height } = canvas;
        const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
        let left = 0, right = 0;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const v = data[i] + data[i + 1] + data[i + 2];
            if (x < width / 2) left += v; else right += v;
        }
        return { left, right };
    });
    expect(halves.left).toBeGreaterThan(halves.right * 3);
    await expectNoErrors(page);
});

test('nebula drift from an entity eases in place: no rebuild, the clouds keep drifting', async ({ page }) => {
    await mountCase(page, 'astro-nebula-drift', { width: '800' });
    await sceneReady(page);
    const neb = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const b = s.world.objects.get('neb');
        const u = b?.node.children[0]?.material.uniforms;
        return { node: b?.node.uuid, live: s.live['neb.drift'], x: u ? u.uWarpCell.value.x + u.uWarpLocal.value.x : null };
    });
    await expect.poll(async () => (await neb()).node).toBeTruthy();
    const first = await neb();
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '100'));
    await expect.poll(async () => (await neb()).live?.value, { timeout: 5000 }).toBeCloseTo(12, 3);
    const a = await neb();
    await page.waitForTimeout(300);
    const b = await neb();
    expect(b.x, 'the clouds drift').toBeGreaterThan(a.x);
    expect(b.node, 'the same nebula, not rebuilt').toBe(first.node);
    await expectNoErrors(page);
});

test('AC1 comet: the tails light the side away from the star; tail_length eases in place', async ({ page }) => {
    await mountCase(page, 'astro-comet', { width: '800' });
    await sceneReady(page);
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '100'));
    const comet = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const b = s.world.objects.get('comet');
        return { node: b.node.uuid, length: b.node.getObjectByName('ion_tail').material.uniforms.uLength.value, live: s.live['comet.tail.length'] };
    });
    await expect.poll(async () => (await comet()).length, { timeout: 5000 }).toBeCloseTo(80, 3);
    await page.waitForTimeout(600);
    const node = (await comet()).node;
    const halves = await page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const { width, height } = canvas;
        const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
        let left = 0, right = 0;
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const v = data[i] + data[i + 1] + data[i + 2];
            if (x < width * 0.4) left += v; else if (x > width * 0.6) right += v;
        }
        return { left, right };
    });
    expect(halves.right).toBeGreaterThan(halves.left * 2);
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '0'));
    await expect.poll(async () => { const n = (await comet()).length; return n > 20 && n < 80; }, { timeout: 3000, intervals: [30] }).toBe(true);
    await expect.poll(async () => (await comet()).length, { timeout: 5000 }).toBeCloseTo(20, 3);
    expect((await comet()).node).toBe(node);
    await expectNoErrors(page);
});

test('R4c1 galaxy: the Milky Way draws in light years, fewer stars far away, a prism territory at Sol', async ({ page }) => {
    await mountCase(page, 'astro-galaxy-object', { width: '800' });
    await sceneReady(page);
    expect(await litPixels(page)).toBeGreaterThan(8000);
    const stars = () => page.evaluate(() => {
        const w = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world;
        return w.objects.get('milky_way').field.mesh.geometry.instanceCount;
    });
    const near = await stars();
    // about 400 px across on this 400 px card: most of the 40,000
    expect(near).toBeGreaterThan(20000);
    // ten times further: the galaxy is small on screen, most of its stars do not draw
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo({ target: [0, 0, 0], yaw: 20, tilt: 35, distance: 1500000 }, { duration: 0 }));
    await expect.poll(stars, { timeout: 3000 }).toBeLessThan(near / 2);
    // the territory: two caps and six walls
    const faces = await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world.objects.get('federation').gridFaces.length);
    expect(faces).toBe(8);
    await expectNoErrors(page);
});

test('R4c2 Star Trek galaxy: every view draws; Federation space hides the near powers\' regions and shows the capitals', async ({ page }) => {
    // eight views of the whole galaxy on SwiftShader: about 30 s alone, slower beside the rest of the suite
    test.setTimeout(180_000);
    await mountCase(page, 'astro-star-trek', { width: '800' });
    await sceneReady(page);
    const fly = (v) => page.evaluate((x) => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo(x, { duration: 0 }), v);
    const shown = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().labelItems.filter((l) => l.visible).map((l) => l.id));
    const alphas = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().objectAlphas);
    await expect.poll(shown, { timeout: 5000 }).toEqual(expect.arrayContaining(['alpha', 'beta', 'gamma_q', 'delta_q']));
    for (const view of ['galaxy', 'quadrants', 'federation', 'neighbours', 'bajor', 'gamma', 'delta', 'barrier']) {
        await fly(view);
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        expect(await litPixels(page), view).toBeGreaterThan(2000);
    }
    await fly('neighbours');
    await expect.poll(shown, { timeout: 5000 }).toEqual(expect.arrayContaining(['sol', 'vulcan', 'tellar', 'andoria']));
    await fly('federation');
    await expect.poll(shown, { timeout: 5000 }).toEqual(expect.arrayContaining(['sol', 'qonos', 'romulus', 'bajor']));
    await fly('bajor');
    await expect.poll(shown, { timeout: 5000 }).toEqual(expect.arrayContaining(['bajor', 'cardassia']));
    await fly('federation');
    // inside the Federation region: its walls (and the other near powers' names) are hidden
    await expect.poll(async () => (await alphas()).federation_space, { timeout: 3000 }).toBe(0);
    expect(await shown()).not.toContain('klingon_name');
    await expectNoErrors(page);
});

test('R4d hide_in_systems: a galaxy-scale line and label show outside every system and step aside inside one', async ({ page }) => {
    await mountCase(page, 'astro-hide-in-systems', { width: '800' });
    await sceneReady(page);
    const state = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const vega = s.labelItems.find((l) => l.id === 'vega');
        return { frame: s.frame, line: s.objectAlphas.core_line, other: s.objectAlphas.other_line, sol: s.objectAlphas.sol_line, vega: vega?.alphaScale };
    });
    const fly = (v) => page.evaluate((x) => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo(x, { duration: 0 }), v);
    await fly('near_sol');
    await expect.poll(async () => (await state()).frame, { timeout: 5000 }).toBe('root');
    let st = await state();
    expect(st.line ?? 1).toBeGreaterThan(0);
    expect(st.vega).toBe(1);
    await fly('station');
    await expect.poll(async () => (await state()).frame, { timeout: 5000 }).toBe('sol_system');
    st = await state();
    expect(st.line).toBe(0);
    expect(st.vega).toBe(0);
    // a list: hidden in the systems it names only
    expect(st.sol).toBe(0);
    expect(st.other ?? 1).toBeGreaterThan(0);
    await expectNoErrors(page);
});

test('looks: the card look follows an input_select; each look shows its own objects and labels, crossfading', async ({ page }) => {
    await mountCase(page, 'astro-looks', { width: '600' });
    await sceneReady(page);
    /** which objects and labels show, and the look */
    const shown = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const vis = (/** @type {string} */ id) => s.world.outer.get(s.world.objects.get(id)).visible;
        const label = (/** @type {string} */ id) => !!s.labelItems.find((l) => l.id === id)?.visible;
        return { look: s.look, wire: vis('wire'), real: vis('real'), always: vis('always'), wireName: label('wire_name'), realName: label('real_name') };
    });
    // the sample state (Auto) names no look: mixed, everything shows
    await expect.poll(shown).toEqual({ look: 'mixed', wire: true, real: true, always: true, wireName: true, realName: true });
    await page.evaluate(() => window.__setState('input_select.lcards_test_look', 'Diagram'));
    await expect.poll(shown, { timeout: 3000 }).toEqual({ look: 'diagram', wire: true, real: false, always: true, wireName: true, realName: false });
    // halfway through the crossfade both globes draw
    await page.evaluate(() => window.__setState('input_select.lcards_test_look', 'REALISTIC'));
    await page.waitForTimeout(250);
    const mid = await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().lookWeights);
    expect(mid.diagram).toBeGreaterThan(0);
    expect(mid.diagram).toBeLessThan(1);
    await expect.poll(shown, { timeout: 3000 }).toEqual({ look: 'realistic', wire: false, real: true, always: true, wireName: false, realName: true });
    await page.evaluate(() => window.__setState('input_select.lcards_test_look', 'mixed'));
    await expect.poll(shown, { timeout: 3000 }).toEqual({ look: 'mixed', wire: true, real: true, always: true, wireName: true, realName: true });
    // the bound galaxy was rebuilt at its value: its stars are sized to the canvas, not to 1 px (each would cover the view)
    const res = await page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        return s.world.objects.get('swirl').field.mesh.material.uniforms.uRes.value.toArray();
    });
    expect(res[0]).toBeGreaterThan(100);
    expect(res[1]).toBeGreaterThan(100);
    await expectNoErrors(page);
});

test('look parts: a mapped sphere is lines over a plain body in the diagram look, the bare map when realistic; an original model gets a hologram twin', async ({ page }) => {
    await mountCase(page, 'astro-look-parts', { width: '600' });
    await sceneReady(page);
    /** pixels that read as the map (red-brown) and as the lines (green) */
    const parts = () => page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        let map = 0, lines = 0;
        for (let i = 0; i < data.length; i += 4) {
            const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
            if (r > 60 && r > g + 15 && r > b + 25) map++;
            else if (g > 120 && g > r + 60 && g > b + 60) lines++;
        }
        return { map, lines };
    });
    const look = (v) => page.evaluate((x) => window.__setState('input_select.lcards_test_look', x), v);
    // the sample state names no look: mixed, as configured (lines over the map)
    await expect.poll(async () => (await parts()).map, { timeout: 8000 }).toBeGreaterThan(2000);
    expect((await parts()).lines).toBeGreaterThan(200);
    // diagram: the plain body stands in for the map, the lines stay
    await look('DIAGRAM');
    await expect.poll(async () => (await parts()).map, { timeout: 3000 }).toBeLessThan(50);
    expect((await parts()).lines).toBeGreaterThan(200);
    // realistic: the bare map
    await look('REALISTIC');
    await expect.poll(async () => (await parts()).lines, { timeout: 3000 }).toBeLessThan(50);
    expect((await parts()).map).toBeGreaterThan(2000);
    // the model: its own materials are the realistic part, a hologram twin (hidden outside the diagram look) the diagram's
    await expect.poll(() => page.evaluate(() => {
        const b = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world.objects.get('ship');
        const twin = b.lookParts?.diagramOnly?.[0];
        let holo = 0;
        twin?.traverse((o) => { if (o.material?.name === 'lcards-hologram') holo++; });
        return { realistic: b.lookParts?.realistic?.length ?? 0, holo: holo > 0, hidden: twin?.visible === false };
    }), { timeout: 10_000 }).toEqual({ realistic: 1, holo: true, hidden: true });
    await expectNoErrors(page);
});

test('double-tap on a point flies in close to what stands there (4 times its radius), else much closer', async ({ page }) => {
    await mountCase(page, 'astro-close', { width: '700' });
    await sceneReady(page);
    const base = await pointOnPage(page, 'base');
    await page.mouse.dblclick(base.x, base.y);
    await expect.poll(async () => (await sceneState(page)).keys.distance, { timeout: 5000 }).toBeLessThan(8.01);
    const k = (await sceneState(page)).keys;
    expect(k.distance).toBeGreaterThan(7.99);
    expect(Math.hypot(k.tx - 40, k.ty, k.tz)).toBeLessThan(0.01);
    await expectNoErrors(page);
});

test('warp: an entity engages it, the streak layer comes in and the scene\'s stars streak; off drops out and lets the layer go', async ({ page }) => {
    await mountCase(page, 'astro-warp', { width: '600' });
    await sceneReady(page);
    const state = () => page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        // the scene's own backdrop stars streak along the view (their tail)
        const tail = card._scene.debug().world.stars?.field?.mesh.material.uniforms.uTail.value.length() ?? 0;
        return { level: card._warp?.level ?? 0, factor: card._warp?.factor ?? null, layer: !!card.renderRoot.querySelector('.astro-warp canvas'), streaks: tail > 0 };
    });
    expect((await state()).level).toBe(0);
    await page.evaluate(() => window.__setState('input_boolean.lcards_test_warp', 'on'));
    await expect.poll(async () => (await state()).level, { timeout: 6000 }).toBe(1);
    expect(await state()).toEqual({ level: 1, factor: 8, layer: true, streaks: true });
    await page.evaluate(() => window.__setState('input_boolean.lcards_test_warp', 'off'));
    await expect.poll(async () => (await state()).level, { timeout: 6000 }).toBe(0);
    expect((await state()).layer).toBe(false);
    await expect.poll(async () => (await state()).streaks, { timeout: 3000 }).toBe(false);
    await expectNoErrors(page);
});

test('tribute: four quick taps on reset play it (warp, the constellation, the dedication); a tap ends it and the scene comes back', async ({ page }) => {
    test.setTimeout(90_000);
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    const b = await sceneBox(page);
    await page.mouse.move(b.x + b.w / 2, b.y + b.h / 2);
    // the camera turned away from its start view: four taps play the tribute, they do not reset it
    const yaw = await page.evaluate(() => {
        const rig = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().rig;
        rig.keys.yaw += 40;
        return rig.keys.yaw;
    });
    const reset = page.locator('lcards-astrometrics-card button[data-cmd="reset"]');
    await expect(reset).toBeVisible();
    // four quick real clicks on the button (at its place: no per-click waits, so a loaded machine keeps them quick)
    const r = /** @type {{ x: number, y: number, width: number, height: number }} */ (await reset.boundingBox());
    for (let i = 0; i < 4; i++) await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    const overlay = page.locator('lcards-astrometrics-card .astro-tribute');
    await expect(overlay).toHaveCount(1, { timeout: 15_000 });
    await expect.poll(() => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._warp?.target ?? 0)).toBe(1);
    await expect(overlay).toContainText('SIR PATRICK STEWART');
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().keys.yaw)).toBe(yaw);
    // a tap on it ends it
    await page.mouse.click(b.x + b.w / 2, b.y + b.h / 2);
    await expect(overlay).toHaveCount(0, { timeout: 8000 });
    await expect.poll(() => page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        return { warp: card._warp?.target ?? 0, playing: !!card._tribute, opacity: card.renderRoot.querySelector('.astro-host').style.opacity };
    }), { timeout: 3000 }).toEqual({ warp: 0, playing: false, opacity: '1' });
    await expectNoErrors(page);
});

test('camera.warp from an entity: fly-tos streak while it is on, not while it is off', async ({ page }) => {
    await mountCase(page, 'astro-warp', { width: '600' });
    await sceneReady(page);
    const flyWarp = async (view) => {
        await page.evaluate((v) => { /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo(v); }, view);
        await page.waitForTimeout(300);
        return page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().rig.warp);
    };
    await page.evaluate(() => window.__setState('input_boolean.lcards_test_warp_travel', 'off'));
    expect(await flyWarp('far')).toBe(false);
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__setState('input_boolean.lcards_test_warp_travel', 'on'));
    expect(await flyWarp('v')).toBe(true);
    await expectNoErrors(page);
});

test('reset: one tap resets the view after a moment; two do nothing', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    const b = await sceneBox(page);
    await page.mouse.move(b.x + b.w / 2, b.y + b.h / 2);
    const turn = () => page.evaluate(() => {
        const rig = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().rig;
        rig.keys.yaw += 40;
        return rig.keys.yaw;
    });
    const yawNow = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().keys.yaw);
    const reset = page.locator('lcards-astrometrics-card button[data-cmd="reset"]');
    await expect(reset).toBeVisible();
    const r = /** @type {{ x: number, y: number, width: number, height: number }} */ (await reset.boundingBox());
    const click = () => page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    // two taps: nothing
    const turned = await turn();
    await click();
    await click();
    await page.waitForTimeout(1300);
    expect(await yawNow()).toBe(turned);
    // one tap: back to the start view once the wait is over
    await click();
    await expect.poll(yawNow, { timeout: 5000 }).not.toBe(turned);
    await expectNoErrors(page);
});

test('reset taps at an easy pace (about half a second apart) still play the tribute and do not reset', async ({ page }) => {
    await mountCase(page, 'astro-camera', { width: '800' });
    await sceneReady(page);
    const b = await sceneBox(page);
    await page.mouse.move(b.x + b.w / 2, b.y + b.h / 2);
    const yaw = await page.evaluate(() => {
        const rig = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().rig;
        rig.keys.yaw += 40;
        return rig.keys.yaw;
    });
    const reset = page.locator('lcards-astrometrics-card button[data-cmd="reset"]');
    await expect(reset).toBeVisible();
    const r = /** @type {{ x: number, y: number, width: number, height: number }} */ (await reset.boundingBox());
    for (let i = 0; i < 4; i++) {
        await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
        if (i === 0) await page.waitForTimeout(350);
        else if (i < 3) await page.waitForTimeout(650);
    }
    await expect(page.locator('lcards-astrometrics-card .astro-tribute')).toHaveCount(1, { timeout: 10_000 });
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().keys.yaw)).toBe(yaw);
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._tribute?.stop());
    await expectNoErrors(page);
});

test('depth dust fills the view round the camera wherever it is, and looks the same on a revisit', async ({ page }) => {
    await mountCase(page, 'astro-dust', { width: '800' });
    await sceneReady(page);
    /** Lit pixels outside the middle third of the canvas, and a hash of where they are */
    const outer = () => page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const { width: w, height: h } = canvas;
        const data = canvas.getContext('2d').getImageData(0, 0, w, h).data;
        let lit = 0;
        let hash = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (x > w / 3 && x < (2 * w) / 3 && y > h / 3 && y < (2 * h) / 3) continue;
                const i = (y * w + x) * 4 + 3;
                if (data[i] > 40) { lit++; hash = (hash * 31 + x * 7 + y) % 1000000007; }
            }
        }
        return { lit, hash };
    });
    const fly = (view) => page.evaluate((v) => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo(v, { duration: 0 }), view);
    const settle = () => page.waitForTimeout(250);
    // far outside the scene (20 x the reach): dust all round the edges, not a ball in the middle
    const far = await outer();
    expect(far.lit).toBeGreaterThan(150);
    for (const view of ['inside', 'away']) {
        await fly(view);
        await settle();
        expect((await outer()).lit, view).toBeGreaterThan(150);
    }
    // back where it started: the same dust
    await fly('far');
    await settle();
    expect(await outer()).toEqual(far);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('fly forward and back: W and S move camera and target together along the view, slowing near the Sun, into its system and out again', async ({ page }) => {
    // up to 80 flights, each waited out to its end: slower than 30 s under a loaded run
    test.setTimeout(120_000);
    await mountCase(page, 'astro-dive', { width: '800' });
    await sceneReady(page);
    const state = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        return { frame: s.frame, keys: s.keys, flying: s.rig.flying };
    });
    /** Press `key`, then wait until the camera has moved and its flight has ended (not a fixed time: a busy run is slower) */
    const step = async (key) => {
        const before = JSON.stringify((await state()).keys);
        await page.keyboard.press(key);
        await expect.poll(async () => {
            const st = await state();
            return JSON.stringify(st.keys) !== before && !st.flying;
        }, { timeout: 5_000 }).toBe(true);
    };
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('near_sol', { duration: 0 }));
    const a = (await state()).keys;
    await page.locator('lcards-astrometrics-card .astro-scene').focus();
    // one step: half the distance along the view, the distance and the angles kept
    await step('w');
    const b = (await state()).keys;
    expect(b.distance).toBeCloseTo(a.distance, 6);
    expect([b.yaw, b.tilt]).toEqual([a.yaw, a.tilt]);
    expect(Math.hypot(b.tx - a.tx, b.ty - a.ty, b.tz - a.tz)).toBeCloseTo(a.distance / 2, 3);
    // on toward Sol: each step goes half the way to the Sun's surface, so the steps shrink as it nears,
    // and the scene switches to the system's frame (km) on the way
    const camAt = (k) => {
        const t = k.tilt * Math.PI / 180, y = k.yaw * Math.PI / 180, c = Math.cos(t);
        return [k.tx + k.distance * c * Math.sin(y), k.ty + k.distance * Math.sin(t), k.tz + k.distance * c * Math.cos(y)];
    };
    const steps = [];
    let prev = camAt(b);
    for (let i = 0; i < 40; i++) {
        await step('PageUp');
        const st = await state();
        if (st.frame !== 'root') break;
        const now = camAt(st.keys);
        steps.push(Math.hypot(now[0] - prev[0], now[1] - prev[1], now[2] - prev[2]));
        prev = now;
    }
    await expect.poll(async () => (await state()).frame, { timeout: 3_000 }).toBe('sol_system');
    expect(steps.length).toBeGreaterThan(4);
    expect(steps[steps.length - 1]).toBeLessThan(steps[0] / 100);
    // and back out the way it came: the steps grow again
    for (let i = 0; i < 40 && (await state()).frame !== 'root'; i++) {
        await step(i % 2 ? 's' : 'PageDown');
    }
    await expect.poll(async () => (await state()).frame, { timeout: 3_000 }).toBe('root');
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('W1 wormhole pieces: the swirl turns, tube lines are shaded, a path at a point is drawn from it, the glow does not add up', async ({ page }) => {
    await mountCase(page, 'astro-wormhole', { width: '800' });
    await sceneReady(page);
    const read = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const funnel = s.world.objects.get('funnel');
        let fill = null;
        funnel.node.traverse((/** @type {any} */ c) => { if (c.material?.uniforms?.uTau) fill = c.material.uniforms; });
        const pipe = s.world.objects.get('pipe');
        const arch = s.world.objects.get('arch');
        const line = pipe.lines[1];
        const abs = line._abs;
        // the first vertex in world space (the node's pinned matrix)
        const e = pipe.node.matrixWorld.elements;
        const x = e[0] * abs[0] + e[4] * abs[1] + e[8] * abs[2] + e[12];
        return {
            type: fill?.uType.value, tau: [...fill.uTau.value], fade: [...fill.uFade.value],
            tube: 'USE_TUBE' in line.material.defines, pulseTube: 'USE_TUBE' in pipe.lines[2].material.defines,
            glowMax: arch.lines[0].material.blendEquation, firstX: x
        };
    });
    const a = await read();
    expect(a.type).toBe(4);
    expect(a.tube).toBe(true);
    expect(a.pulseTube).toBe(true);
    expect(a.glowMax).toBe(104); // MaxEquation
    expect(a.firstX).toBeCloseTo(20, 3);
    await page.waitForTimeout(400);
    const b = await read();
    expect(b.tau).not.toEqual(a.tau);
    expect(b.fade[0] + b.fade[1]).toBeCloseTo(1, 6);
    // the swirl draws: the middle of the card is lit
    const lit = await page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const { width, height } = canvas;
        const data = canvas.getContext('2d').getImageData(Math.floor(width * 0.3), Math.floor(height * 0.3), Math.floor(width * 0.4), Math.floor(height * 0.4)).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) sum += data[i] + data[i + 1] + data[i + 2];
        return sum / (data.length / 4);
    });
    expect(lit).toBeGreaterThan(20);
    await expectNoErrors(page);
});

test('CE1 crystalline: the spine lights the middle column, branches reach both sides; far away one dot; glow live', async ({ page }) => {
    await mountCase(page, 'astro-crystalline', { width: '800' });
    await sceneReady(page);
    expect(await litPixels(page)).toBeGreaterThan(20000);
    // brightness in five vertical bands: the spine's band brightest, the outer bands lit too
    const bands = () => page.evaluate(() => {
        const canvas = /** @type {any} */ (document.querySelector('#mount > *')).renderRoot.querySelector('.astro-scene canvas');
        const { width, height } = canvas;
        const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
        const out = [0, 0, 0, 0, 0];
        for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            out[Math.min(4, Math.floor((x / width) * 5))] += data[i] + data[i + 1] + data[i + 2];
        }
        return out;
    });
    const b = await bands();
    expect(b[2]).toBeGreaterThan(b[0]);
    expect(b[2]).toBeGreaterThan(b[4]);
    expect(b[1], 'branches to the left').toBeGreaterThan(0);
    expect(b[3], 'branches to the right').toBeGreaterThan(0);
    const entity = () => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug();
        const e = s.world.objects.get('entity');
        return { node: e.node.uuid, dot: e.node.getObjectByName('dot').visible, glow: e.node.getObjectByName('crystal').material.uniforms.uGlow.value, frames: s.frames };
    });
    // the core pulses, so the scene keeps drawing
    const f0 = (await entity()).frames;
    await page.waitForTimeout(400);
    expect((await entity()).frames).toBeGreaterThan(f0);
    // a setting from an entity changes in place
    const first = await entity();
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().world.objects.get('entity').live('glow', 0.2));
    expect((await entity()).glow).toBeCloseTo(0.2, 5);
    // far away: a dot
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('far', { duration: 0 }));
    await expect.poll(async () => (await entity()).dot).toBe(true);
    expect((await entity()).node).toBe(first.node);
    await expectNoErrors(page);
});
