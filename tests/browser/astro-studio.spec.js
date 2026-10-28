/**
 * The Astrometrics Studio (E7): opened on a card's config, its preview is a
 * live astrometrics card in edit mode: a tap selects the point or object
 * under it (no action runs) and opens it in its list. Objects are added from
 * the type picker and edited through forms generated from the schema; Save
 * sends the whole config. The harness has no Home Assistant elements, so
 * fields are driven by their value-changed events.
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

/** Open the studio on the mounted card's config */
async function openStudio(page) {
    await page.evaluate(async () => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        await customElements.get('lcards-astrometrics-card').getConfigElement(); // loads the editor chunk
        await customElements.whenDefined('lcards-astrometrics-studio-dialog');
        const studio = /** @type {any} */ (document.createElement('lcards-astrometrics-studio-dialog'));
        studio.hass = card.hass;
        studio.config = JSON.parse(JSON.stringify(card._rawConfig));
        studio.addEventListener('config-changed', (e) => { window.__saved = e.detail.config; });
        document.body.appendChild(studio);
        window.__studio = studio;
        // the dashboard card steps aside so taps reach the preview
        card.style.display = 'none';
    });
    await expect.poll(() => page.evaluate(() => {
        const s = window.__studio._previewCard?._scene?.debug();
        return !!s?.ready && s.frames > 0;
    }), { timeout: 15_000 }).toBe(true);
}

/** Page coordinates of a point's marker on the studio preview */
const previewPoint = (page, id) => page.evaluate((pid) => {
    const card = window.__studio._previewCard;
    const it = card._scene.debug().labelItems.find((l) => l.id === pid);
    const r = card.renderRoot.querySelector('.astro-scene').getBoundingClientRect();
    return it?.visible ? { x: r.left + it.sx, y: r.top + it.sy } : null;
}, id);

test('studio: the preview selects instead of acting; objects from the type picker and schema forms; Save', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);

    // a tap on svc selects it (its perform-action does not run)
    const p = await previewPoint(page, 'svc');
    expect(p).not.toBeNull();
    await page.mouse.click(p.x, p.y);
    await expect.poll(() => page.evaluate(() => [window.__studio._activeTab, window.__studio._selectedPoint])).toEqual(['points', 'svc']);
    expect(await page.evaluate(() => window.__hass.serviceCalls)).toEqual([]);
    // the points list opened its row
    await expect.poll(() => page.evaluate(() => window.__studio.renderRoot.querySelector('lcards-astro-points-editor')?._expanded)).toBe(0);

    // a tap on the floor grid opens it in the objects list
    const r = await page.evaluate(() => window.__studio._previewCard.renderRoot.querySelector('.astro-scene').getBoundingClientRect().toJSON());
    await page.mouse.click(r.x + r.width / 2 + 40, r.y + r.height / 2 + 40);
    await expect.poll(() => page.evaluate(() => [window.__studio._activeTab, window.__studio._expandedObject])).toEqual(['objects', 0]);

    // edit the floor's line spacing through its generated field
    await page.evaluate(async () => {
        const studio = window.__studio;
        await studio.updateComplete;
        const form = studio.renderRoot.querySelector('[data-object="0"] lcards-astro-schema-form');
        await form.updateComplete;
        const field = form.renderRoot.querySelector('ha-selector[data-key="line_spacing"]');
        field.dispatchEvent(new CustomEvent('value-changed', { detail: { value: 40 } }));
    });
    expect(await page.evaluate(() => window.__studio._workingConfig.objects[0].line_spacing)).toBe(40);
    // keys for other shapes are hidden on a plane (radius), shown with "Show every key"
    const keys = () => page.evaluate(async () => {
        const form = window.__studio.renderRoot.querySelector('[data-object="0"] lcards-astro-schema-form');
        await form.updateComplete;
        return [...form.renderRoot.querySelectorAll('[data-key]')].map((el) => el.dataset.key);
    });
    expect(await keys()).toContain('size');
    expect(await keys()).not.toContain('radius');
    await page.evaluate(() => { window.__studio._showAll = true; });
    await expect.poll(keys).toContain('radius');

    // add a ring: it gets a fresh id and the preview builds it
    await page.evaluate(() => window.__studio._addObject('ring'));
    expect(await page.evaluate(() => window.__studio._workingConfig.objects.map((o) => o.id))).toEqual(['floor', 'ring1']);
    await expect.poll(() => page.evaluate(() => window.__studio._previewCard._scene.debug().world?.list.length)).toBe(2);

    // Save sends the whole config
    await page.evaluate(() => window.__studio._save());
    const saved = await page.evaluate(() => window.__saved);
    expect(saved.objects).toEqual([
        { type: 'grid', id: 'floor', shape: 'plane', size: [240, 160], line_spacing: 40 },
        { type: 'ring', id: 'ring1', radius: 50 }
    ]);
    expect(saved.points[0].id).toBe('svc');
    expect(saved.height).toBe(400);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('studio: Pick on preview places a point through the preview card, no window events', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);
    await page.evaluate(async () => {
        const studio = window.__studio;
        studio._activeTab = 'points';
        await studio.updateComplete;
        const list = studio.renderRoot.querySelector('lcards-astro-points-editor');
        await list.updateComplete;
        list._pick(list.config.points[0]);
    });
    const banner = page.locator('lcards-astrometrics-studio-dialog lcards-astrometrics-card .astro-pick');
    await expect(banner).toContainText('TAP TO PLACE SERVICE');
    const r = await page.evaluate(() => window.__studio._previewCard.renderRoot.querySelector('.astro-scene').getBoundingClientRect().toJSON());
    await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    await expect(banner).toHaveCount(0);
    const xyz = await page.evaluate(() => window.__studio._workingConfig.points[0].xyz);
    expect(Math.abs(xyz[0])).toBeLessThan(1);
    expect(Math.abs(xyz[2])).toBeLessThan(1);
});

test('studio: drag a point on its plane (no orbit), box an object, place a point on the floor', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);
    const yaw0 = await page.evaluate(() => window.__studio._previewCard._scene.debug().keys.yaw);

    // drag svc 120 px to the right: xyz x grows, y (height) stays 0, the camera does not turn
    const p = await previewPoint(page, 'svc');
    expect(p).not.toBeNull();
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x + 60, p.y, { steps: 5 });
    // shown live before the release, the config untouched until then
    await expect.poll(() => page.evaluate(() => window.__studio._status)).toMatch(/^svc: xyz /);
    expect(await page.evaluate(() => window.__studio._workingConfig.points[0].xyz)).toEqual([-60, 0, 0]);
    await page.mouse.move(p.x + 120, p.y, { steps: 5 });
    await page.mouse.up();
    const xyz = await page.evaluate(() => window.__studio._workingConfig.points[0].xyz);
    expect(xyz[0]).toBeGreaterThan(-20);
    expect(xyz[1]).toBe(0);
    expect(Math.abs(xyz[2])).toBeLessThan(2);
    expect(await page.evaluate(() => window.__studio._previewCard._scene.debug().keys.yaw)).toBe(yaw0);
    expect(await page.evaluate(() => [window.__studio._activeTab, window.__studio._selectedPoint])).toEqual(['points', 'svc']);
    // the marker followed the pointer
    await expect.poll(async () => Math.round(((await previewPoint(page, 'svc'))?.x ?? 0) - p.x)).toBeGreaterThan(100);

    // opening the floor's row boxes it on the scene; closing it clears the box
    await page.evaluate(() => { window.__studio._activeTab = 'objects'; return window.__studio._selectObject(0); });
    await expect.poll(() => page.evaluate(() => {
        const d = window.__studio._previewCard._scene.debug();
        return [d.boxed, !!d.selectionBox];
    })).toEqual(['floor', true]);
    await page.evaluate(() => window.__studio._selectObject(-1));
    await expect.poll(() => page.evaluate(() => !!window.__studio._previewCard._scene.debug().selectionBox)).toBe(false);

    // place mode: a tap on the floor adds a point on its cell
    await page.evaluate(() => window.__studio._setPlacing(true));
    await expect.poll(() => page.evaluate(() => window.__studio._placing)).toBe(true);
    const r = await page.evaluate(() => window.__studio._previewCard.renderRoot.querySelector('.astro-scene').getBoundingClientRect().toJSON());
    await page.mouse.click(r.x + r.width / 2 + 40, r.y + r.height / 2 + 40);
    await expect.poll(() => page.evaluate(() => window.__studio._workingConfig.points.length)).toBe(2);
    const placed = await page.evaluate(() => window.__studio._workingConfig.points[1]);
    expect(placed).toMatchObject({ id: 'point1', object: 'floor', marker: 'dot', label: 'NEW POINT' });
    expect(placed.cell).toMatch(/^[A-Z]+\d+$/);
    expect(await page.evaluate(() => [window.__studio._placing, window.__studio._activeTab, window.__studio._selectedPoint])).toEqual([false, 'points', 'point1']);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('studio: a ring (lines only, no pick mesh) is selected by a tap near its line', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);
    await page.evaluate(() => window.__studio._addObject('ring'));
    await expect.poll(() => page.evaluate(() => window.__studio._previewCard._scene.debug().world?.list.length)).toBe(2);
    await page.evaluate(() => window.__studio._selectObject(-1));
    await page.waitForTimeout(300);
    // the ring (radius 50, top view): its east edge on screen, 5 px off the line
    const spot = await page.evaluate(() => {
        const card = window.__studio._previewCard;
        const d = card._scene.debug();
        const r = card.renderRoot.querySelector('.astro-scene').getBoundingClientRect();
        d.rig.apply(); // the camera as the next frame has it (a resize may not have drawn yet)
        const v = d.world.scene.position.clone().set(50, 0, 0).project(d.rig.camera);
        return { x: r.left + ((v.x + 1) / 2) * r.width + 5, y: r.top + ((1 - v.y) / 2) * r.height };
    });
    await page.mouse.click(spot.x, spot.y);
    await expect.poll(() => page.evaluate(() => [window.__studio._activeTab, window.__studio._expandedObject])).toEqual(['objects', 1]);
    expect(await page.evaluate(() => window.__studio._previewCard._scene.debug().boxed)).toBe('ring1');
});

test('studio: capture a view where the camera is (no jump), target named by its point, rename, start view', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);
    const scene = () => page.evaluate(() => window.__studio._previewCard._scene.debug().keys);
    await page.evaluate(async () => {
        window.__studio._activeTab = 'camera';
        const s = await window.__studio._previewCard.studioScene();
        await s.flyTo({ target: 'svc', yaw: 30, tilt: 40, distance: 90 }, { duration: 0 });
    });
    const before = await scene();
    await page.evaluate(() => window.__studio._captureView(null));
    const views = await page.evaluate(() => window.__studio._workingConfig.camera.views);
    expect(Object.keys(views)).toEqual(['top', 'view1']);
    expect(views.view1).toMatchObject({ target: 'svc', yaw: 30, tilt: 40, distance: 90 });
    // the new view is not the start view: the preview stays put after the rebuild
    await page.waitForTimeout(400);
    expect(await scene()).toEqual(before);
    await expect(page.locator('lcards-astrometrics-studio-dialog lcards-form-section[data-view="view1"]')).toHaveCount(1);

    // rename follows camera.view; Start here moves the camera to it
    await page.evaluate(() => window.__studio._renameView('top', 'view1'));
    expect(await page.evaluate(() => window.__studio._viewError)).toMatch(/already a view named view1/);
    await page.evaluate(() => window.__studio._renameView('top', 'overhead'));
    expect(await page.evaluate(() => window.__studio._workingConfig.camera)).toMatchObject({ view: 'overhead' });
    expect(await page.evaluate(() => Object.keys(window.__studio._workingConfig.camera.views))).toEqual(['overhead', 'view1']);
    await page.evaluate(() => window.__studio._setCamera({ ...window.__studio._workingConfig.camera, view: 'view1' }, { now: true }));
    await page.evaluate(() => window.__studio._flyToView(window.__studio._workingConfig.camera.views.overhead));
    await expect.poll(async () => (await scene()).tilt).toBe(90);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('studio: starters: a part round a card point (it orbits), clashes refused, a scene merged', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);
    const dialog = page.locator('lcards-astrometrics-studio-dialog');
    const button = (starter, text) => dialog.locator(`[data-starter="${starter}"] ha-button`).filter({ hasText: text });
    await page.evaluate(() => { window.__studio._activeTab = 'starters'; window.__studio._openStarter = 'planet'; });
    await expect(dialog.locator('pre.starter-yaml')).toContainText('planet_body');
    await page.evaluate(() => {
        window.__studio._setStarterParam('planet', 'prefix', 'mars');
        window.__studio._setStarterParam('planet', 'centre', 'svc');
    });
    await expect(dialog.locator('pre.starter-yaml')).toContainText('mars_body');

    await button('planet', 'Add to the scene').click();
    await expect.poll(() => page.evaluate(() => window.__studio._workingConfig.points.map((p) => p.id))).toEqual(['svc', 'mars_body', 'mars_moon1', 'mars_moon2']);
    expect(await page.evaluate(() => window.__studio._workingConfig.objects.find((o) => o.id === 'mars_orbit').at)).toBe('svc');
    expect(await page.evaluate(() => window.__studio._starterMessage)).toEqual({ starter: 'planet', type: 'success', text: 'Planet with moons: added 3 points, 6 objects.' });
    // the planet goes round: the orbit ring spins and the point stands on it
    await expect.poll(() => page.evaluate(() => window.__studio._previewCard._scene.debug().world?.list.length)).toBe(7);
    const at = () => page.evaluate(() => window.__studio._previewCard._scene.pointPositions().mars_body);
    const p0 = await at();
    await page.waitForTimeout(800);
    const p1 = await at();
    expect(Math.hypot(p1[0] - p0[0], p1[2] - p0[2])).toBeGreaterThan(0.5);

    // the same prefix again is refused, naming the clash
    await button('planet', 'Add to the scene').click();
    await expect.poll(() => page.evaluate(() => window.__studio._starterMessage?.type)).toBe('error');
    expect(await page.evaluate(() => window.__studio._starterMessage.text)).toMatch(/^Already in this card: point mars_body, /);

    // the solar system's top view clashes with the card's; the sector map merges: its views join, the start view stays
    await page.evaluate(() => { window.__studio._openStarter = 'solar_system'; });
    await button('solar_system', 'Merge into the scene').click();
    await expect.poll(() => page.evaluate(() => window.__studio._starterMessage?.text)).toMatch(/view top\. Replace the scene/);
    await page.evaluate(() => { window.__studio._openStarter = 'sector_map'; });
    await button('sector_map', 'Merge into the scene').click();
    await expect.poll(() => page.evaluate(() => Object.keys(window.__studio._workingConfig.camera.views))).toEqual(['top', 'map']);
    expect(await page.evaluate(() => window.__studio._workingConfig.camera.view)).toBe('top');
    expect(await page.evaluate(() => window.__studio._workingConfig.objects.map((o) => o.id).slice(-1))).toEqual(['sectors']);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});
