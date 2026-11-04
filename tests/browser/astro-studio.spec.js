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
        // the harness has no ha-dialog: hold the studio at a fixed height as Home Assistant does
        // (90vh there), so the preview does not grow with the open tab's content
        await studio.updateComplete;
        const fixed = document.createElement('style');
        fixed.textContent = 'ha-dialog { display: block; } .dialog-content { height: 560px; display: flex; flex-direction: column; } .studio-layout { flex: 1; min-height: 0; }';
        studio.renderRoot.appendChild(fixed);
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

test('studio UX1: tabs in build order, the opening tab, a guide on every tab', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);
    const s = await page.evaluate(async () => {
        const studio = window.__studio;
        const first = studio._activeTab;
        const tabs = [...studio.renderRoot.querySelectorAll('ha-tab-group-tab')].map((t) => t.getAttribute('value'));
        const guides = {};
        for (const tab of ['starters', 'scene', 'objects', 'points', 'camera']) {
            studio._activeTab = tab;
            await studio.updateComplete;
            const g = studio.renderRoot.querySelector('.info-guide');
            guides[tab] = g ? [g.dataset.guide, !!g.expanded, g.querySelectorAll('.info-guide-links a').length > 0] : null;
        }
        return { first, tabs, guides };
    });
    expect(s.tabs).toEqual(['starters', 'scene', 'objects', 'points', 'camera', 'yaml']);
    expect(s.first).toBe('objects');
    // a card with a scene opens on its objects; the guides are closed, each with docs links
    expect(s.guides).toEqual({
        starters: ['astro-starters', false, true],
        scene: ['astro-overview', false, true],
        objects: ['astro-objects', false, true],
        points: ['astro-points', false, true],
        camera: ['astro-camera', false, true]
    });

    // a new card (empty, or the scene a new card is placed with) opens on the starters; the overview stays closed
    const fresh = await page.evaluate(async () => {
        const open = async (config) => {
            const studio = /** @type {any} */ (document.createElement('lcards-astrometrics-studio-dialog'));
            studio.hass = window.__studio.hass;
            studio.config = config;
            document.body.appendChild(studio);
            await studio.updateComplete;
            const first = studio._activeTab;
            const diagrams = {};
            for (const tab of ['starters', 'scene', 'objects', 'points', 'camera']) {
                studio._activeTab = tab;
                await studio.updateComplete;
                diagrams[tab] = studio.renderRoot.querySelector('.info-guide lcards-astro-diagram')?.kind;
            }
            studio._activeTab = 'scene';
            await studio.updateComplete;
            const overviewOpen = !!studio.renderRoot.querySelector('.info-guide')?.expanded;
            studio.remove();
            return { first, overviewOpen, diagrams };
        };
        const Card = customElements.get('lcards-astrometrics-card');
        const stub = Card.getStubConfig();
        return {
            empty: await open({ type: 'custom:lcards-astrometrics-card' }),
            stub: await open(stub),
            changed: await open({ ...stub, points: stub.points.slice(1) })
        };
    });
    const diagrams = { starters: 'starters', scene: 'scale', objects: 'distance', points: 'placement', camera: 'camera' };
    expect(fresh.empty).toEqual({ first: 'starters', overviewOpen: false, diagrams });
    expect(fresh.stub).toEqual({ first: 'starters', overviewOpen: false, diagrams });
    expect(fresh.changed).toMatchObject({ first: 'objects', overviewOpen: false });
});

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
    // keys for other shapes are hidden on a plane (radius)
    const keys = () => page.evaluate(async () => {
        const form = window.__studio.renderRoot.querySelector('[data-object="0"] lcards-astro-schema-form');
        await form.updateComplete;
        return [...form.renderRoot.querySelectorAll('[data-key]')].map((el) => el.dataset.key);
    });
    expect(await keys()).toContain('size');
    expect(await keys()).not.toContain('radius');

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
    // well to the right (the preview starts wider than 2:1, so its view is narrowed and closer)
    expect(xyz[0]).toBeGreaterThan(-30);
    expect(xyz[1]).toBe(0);
    expect(Math.abs(xyz[2])).toBeLessThan(2);
    expect(await page.evaluate(() => window.__studio._previewCard._scene.debug().keys.yaw)).toBe(yaw0);
    expect(await page.evaluate(() => [window.__studio._activeTab, window.__studio._selectedPoint])).toEqual(['points', 'svc']);
    // the marker followed the pointer
    await expect.poll(async () => Math.round(((await previewPoint(page, 'svc'))?.x ?? 0) - p.x)).toBeGreaterThan(80);

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
    const button = (starter, text) => dialog.locator(`[data-starter-detail="${starter}"] ha-button`).filter({ hasText: text });
    await page.evaluate(() => { window.__studio._activeTab = 'starters'; window.__studio._openStarter = 'planet'; });
    await expect(dialog.locator('pre.starter-yaml')).toContainText('planet_body');
    await page.evaluate(() => { window.__studio._starterParams = { planet: { prefix: 'mars', centre: 'svc' } }; });
    await expect(dialog.locator('pre.starter-yaml')).toContainText('mars_body');

    await button('planet', 'Add to the scene').click();
    await expect.poll(() => page.evaluate(() => window.__studio._workingConfig.points.map((p) => p.id))).toEqual(['svc', 'mars_body', 'mars_moon1', 'mars_moon2']);
    expect(await page.evaluate(() => window.__studio._workingConfig.objects.find((o) => o.id === 'mars_orbit').at)).toBe('svc');
    expect(await page.evaluate(() => window.__studio._starterMessage)).toEqual({ starter: 'planet', type: 'success', text: 'Planet with moons: added 3 points, 6 objects. Undo takes it out again.' });
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

test('studio: a star system opens in the Points and Objects tabs; a tap inside it opens its list; ids stay card-wide', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-dive', { width: '800' });
    await openStudio(page);
    const studio = () => page.evaluate(() => {
        const s = window.__studio;
        return { tab: s._activeTab, scope: s._scope, points: s._points.map((p) => p.id), objects: s._objects.length, bar: !!s.renderRoot.querySelector('.scope-bar') };
    });
    // the scene's lists first
    expect(await studio()).toMatchObject({ scope: -1, points: ['core', 'sol', 'vega'], bar: false });
    // the system's row: its points and objects are not form fields; its open button opens its lists
    const sys = await page.evaluate(() => window.__studio._workingConfig.objects.findIndex((o) => o.type === 'system'));
    await page.evaluate(async (i) => {
        const s = window.__studio;
        s._activeTab = 'objects';
        s._selectObject(i);
        await s.updateComplete;
    }, sys);
    const formKeys = await page.evaluate(async (i) => {
        const form = window.__studio.renderRoot.querySelector(`[data-object="${i}"] lcards-astro-schema-form`);
        await form.updateComplete;
        return [...form.renderRoot.querySelectorAll('[data-key]')].map((el) => el.dataset.key);
    }, sys);
    expect(formKeys).toContain('units');
    expect(formKeys).not.toContain('points');
    await page.evaluate(async (i) => {
        const s = window.__studio;
        s.renderRoot.querySelector(`[data-object="${i}"] [data-action="open-system"]`).click();
        await s.updateComplete;
    }, sys);
    let st = await studio();
    expect(st).toMatchObject({ scope: sys, bar: true });
    expect(st.points).toContain('ds9');
    expect(st.objects).toBeGreaterThan(5);
    // a new point in the system: written into the system, with an id the scene's points do not use
    await page.evaluate(async () => {
        const s = window.__studio;
        s._activeTab = 'points';
        await s.updateComplete;
        const pe = s.renderRoot.querySelector('lcards-astro-points-editor');
        pe.takenIds = [...pe.takenIds, 'point1'];
        pe._add();
    });
    const added = await page.evaluate(() => {
        const sysCfg = window.__studio._workingConfig.objects.find((o) => o.type === 'system');
        return { inSystem: sysCfg.points.at(-1).id, scene: window.__studio._workingConfig.points.length };
    });
    expect(added.scene).toBe(3);
    expect(added.inSystem).toBe('point2');
    // back to the scene, then a tap on SOL (a scene point) and a select of DS9 (a system point) open the right lists
    await page.evaluate(() => window.__studio._openScope(-1));
    await page.evaluate(() => window.__studio._onSceneSelect({ kind: 'point', id: 'ds9' }));
    st = await studio();
    expect(st).toMatchObject({ tab: 'points', scope: sys });
    await page.evaluate(() => window.__studio._onSceneSelect({ kind: 'point', id: 'sol' }));
    expect((await studio()).scope).toBe(-1);
    // a system object without an id, by the id the scene gives it (the scene's own glow is glow#1)
    const ringId = await page.evaluate((i) => window.__studio._objectIdIn(i, 0), sys);
    expect(ringId).toBe('glow#2');
    expect(await page.evaluate(() => [...window.__studio._previewCard._scene.debug().world.objects.keys()])).toContain(ringId);
    await page.evaluate((id) => window.__studio._onSceneSelect({ kind: 'object', id }), ringId);
    expect(await page.evaluate(() => [window.__studio._activeTab, window.__studio._scope, window.__studio._expandedObject])).toEqual(['objects', sys, 0]);
    expect(await cardErrors(page)).toEqual([]);
});

test('studio R4b: settings that follow entities load from the YAML: their fields, the sections that hold them open, the row says so', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-bindings', { width: '800' });
    await openStudio(page);
    /** an object's row: its summary, open sections (with their note) and binding fields (key=first value) */
    const row = (idx) => page.evaluate(async (i) => {
        const s = window.__studio;
        s._activeTab = 'objects';
        s._expandedObject = i;
        await s.updateComplete;
        await new Promise((r) => setTimeout(r, 200));
        const el = s.renderRoot.querySelector(`[data-object="${i}"]`);
        const deep = (root) => [...root.querySelectorAll('*')].flatMap((e) => [e, ...(e.shadowRoot ? deep(e.shadowRoot) : [])]);
        const all = deep(el);
        for (const f of el.querySelectorAll('lcards-astro-schema-form')) await f.updateComplete;
        return {
            summary: el.secondary,
            open: all.filter((x) => x.tagName === 'LCARDS-FORM-SECTION' && x.expanded && x.secondary === 'follows an entity').map((x) => x.header),
            bindings: deep(el).filter((x) => x.classList?.contains('binding')).map((b) => `${b.dataset.key}=${b.querySelector('ha-selector')?.value}`)
        };
    }, idx);
    // the bubble: opacity is an appearance key, so Appearance says so
    const bubble = await row(0);
    expect(bubble.summary).toContain('follows input_number.lcards_test_shields');
    expect(bubble.open).toEqual(['Appearance']);
    expect(bubble.bindings).toEqual(['opacity=input_number.lcards_test_shields']);
    // the glow: size is its own key
    const glow = await row(1);
    expect(glow.bindings).toEqual(['size=input_number.lcards_test_power']);
    // the grid: the wobble step that holds a template opens, and shows it
    const well = await row(2);
    expect(well.summary).toContain('a template');
    expect(well.open).toEqual(['1 · wobble']);
    expect(well.bindings[0]).toMatch(/^amplitude=\[\[\[ return Number/);
    expect((await cardErrors(page)).filter((e) => !/Frame took/.test(e))).toEqual([]);
});

test('studio UX1 P2: grouped object sections, sliders, bind panels, the look switch, the stars switch, a guided tour', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);
    /** the studio after a change, settled */
    const settle = () => page.evaluate(async () => {
        const s = window.__studio;
        await s.updateComplete;
        const deep = (root) => [...root.querySelectorAll('*')].flatMap((e) => [e, ...(e.shadowRoot ? deep(e.shadowRoot) : [])]);
        for (const f of deep(s.renderRoot).filter((e) => e.tagName === 'LCARDS-ASTRO-SCHEMA-FORM')) await f.updateComplete;
    });
    // an element anywhere under the studio (through every shadow root)
    await page.evaluate(() => {
        window.__find = (sel) => {
            const deep = (root) => [...root.querySelectorAll('*')].flatMap((e) => [e, ...(e.shadowRoot ? deep(e.shadowRoot) : [])]);
            return deep(window.__studio.renderRoot).filter((e) => e.matches(sel));
        };
    });

    // Objects: the floor's form in sections by meaning, Appearance open; no "other shapes" toggle
    await page.evaluate(() => { window.__studio._activeTab = 'objects'; window.__studio._expandedObject = 0; });
    await settle();
    const sections = await page.evaluate(() => window.__find('[data-object="0"] lcards-form-section[data-group]').map((x) => [x.header, x.expanded]));
    expect(sections).toEqual([['Appearance', true], ['Position and motion', false], ['Visibility and distance', false], ['Actions and tags', false]]);
    expect(await page.evaluate(() => window.__studio.renderRoot.textContent.includes('keys of other shapes'))).toBe(false);
    // opacity (0 to 1) is a slider; line spacing (unbounded) a box
    expect(await page.evaluate(() => window.__find('ha-selector[data-key="opacity"]')[0].selector.number.mode)).toBe('slider');
    expect(await page.evaluate(() => window.__find('ha-selector[data-key="line_spacing"]')[0].selector.number.mode)).toBe('box');

    // the bind button turns opacity into a panel under its name; the way back is in its header
    await page.evaluate(() => window.__find('[data-key="opacity-bind"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.objects[0].opacity)).toEqual({ entity: '' });
    expect(await page.evaluate(() => window.__find('lcards-form-section.binding[data-key="opacity"]')[0].header)).toBe('Opacity: follows an entity');
    // the attribute is a dropdown of the entity's attributes, once an entity is picked
    expect(await page.evaluate(() => window.__find('ha-selector[data-key="opacity~attribute"]').length)).toBe(0);
    await page.evaluate(() => window.__find('ha-selector[data-key="opacity~entity"]')[0]
        .dispatchEvent(new CustomEvent('value-changed', { detail: { value: 'input_number.lcards_test_shields' } })));
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.objects[0].opacity)).toEqual({ entity: 'input_number.lcards_test_shields' });
    expect(await page.evaluate(() => window.__find('ha-selector[data-key="opacity~attribute"]')[0].selector))
        .toEqual({ attribute: { entity_id: 'input_number.lcards_test_shields' } });
    await page.evaluate(() => window.__find('[data-key="opacity-unbind"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.objects[0].opacity)).toBeUndefined();

    // a colour binds too (NB2b): the entity, then a picker per state colour; back to a colour
    const before = await page.evaluate(() => window.__studio._workingConfig.objects[0].color);
    await page.evaluate(() => { window.__own = (sel) => window.__find(sel).filter((e) => /** @type {any} */ (e.getRootNode()).host?.value?.type === 'grid'); });
    await page.evaluate(() => window.__own('[data-key="color-bind"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__own('lcards-form-section.binding[data-key="color"]')[0].header)).toBe('Color: follows an entity');
    await page.evaluate(() => window.__own('ha-selector[data-key="color~entity"]')[0]
        .dispatchEvent(new CustomEvent('value-changed', { detail: { value: 'input_boolean.lcards_test_toggle' } })));
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.objects[0].color)).toEqual({ entity: 'input_boolean.lcards_test_toggle' });
    expect(await page.evaluate(() => window.__own('[data-key^="color~"] lcards-color-picker').length)).toBe(4);
    await page.evaluate(() => window.__own('[data-key="color~active"] lcards-color-picker')[0]
        .dispatchEvent(new CustomEvent('value-changed', { detail: { value: 'var(--lcars-orange)' } })));
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.objects[0].color)).toEqual({ entity: 'input_boolean.lcards_test_toggle', active: 'var(--lcars-orange)' });
    await page.evaluate(() => window.__own('[data-key="color-unbind"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.objects[0].color)).toBeUndefined();
    if (before !== undefined) await page.evaluate((c) => { window.__studio._workingConfig.objects[0].color = c; }, before);

    // Scene: sections by what they hold, each with an icon
    await page.evaluate(() => { window.__studio._activeTab = 'scene'; });
    await settle();
    expect(await page.evaluate(() => [...window.__studio.renderRoot.querySelectorAll('lcards-form-section[data-group]')].map((x) => [x.header, !!x.icon])))
        .toEqual([['Look', true], ['Time', true], ['Warp', true], ['Space', true], ['Background', true], ['Labels', true]]);
    expect(await page.evaluate(() => window.__find('lcards-background-animation-editor').length)).toBe(1);
    // the clock's rate: a preset, or a custom amount and unit
    const rate = (v) => page.evaluate((val) => window.__find('ha-selector[data-key="rate~preset"]')[0]
        .dispatchEvent(new CustomEvent('value-changed', { detail: { value: val } })), v);
    await rate('30 d/s');
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.clock)).toEqual({ rate: '30 d/s' });
    await rate('custom');
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.clock)).toEqual({ rate: '30 d/s' });
    await page.evaluate(() => window.__find('ha-selector[data-key="rate~unit"]')[0].dispatchEvent(new CustomEvent('value-changed', { detail: { value: 'h' } })));
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.clock)).toEqual({ rate: '30 h/s' });
    await rate('live');
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.clock)).toBeUndefined();
    // the date: now, or a date and time
    await page.evaluate(() => window.__find('[data-key="date"] ha-button[data-value="date"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.clock.date)).toMatch(/^\d{4}-\d\d-\d\d 00:00:00$/);
    await page.evaluate(() => window.__find('[data-key="date"] ha-button[data-value="now"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.clock)).toBeUndefined();
    // a built-in label style is overridden through the text controls, and reset
    await page.evaluate(() => window.__find('lcards-astro-labels-editor')[0]._style && window.__find('lcards-astro-labels-editor')[0]
        .shadowRoot.querySelector('lcards-text-field-editor[basepath="styles.major"]').editor._setConfigValue('styles.major.font_size', 24));
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.labels)).toEqual({ styles: { major: { font_size: 24 } } });
    await page.evaluate(() => window.__find('[data-key="reset-major"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.labels)).toBeUndefined();

    // the look is a pill switch (mixed, the default, leaves the key out); stars switch in its section header
    await page.evaluate(() => window.__find('[data-key="look"] ha-button[data-value="realistic"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.look)).toBe('realistic');
    await page.evaluate(() => window.__find('[data-key="look"] ha-button[data-value="mixed"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.look)).toBeUndefined();
    const sw = await page.evaluate(() => { const el = window.__find('ha-switch[data-key="stars-on"]')[0]; return el.slot; });
    expect(sw).toBe('header-icons');
    await page.evaluate(() => { const el = window.__find('ha-switch[data-key="stars-on"]')[0]; el.checked = true; el.dispatchEvent(new Event('change')); });
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.backdrop)).toEqual({ stars: true });

    // Camera: the start view sits with the views; the camera's settings in sections
    await page.evaluate(() => { window.__studio._activeTab = 'camera'; });
    await settle();
    expect(await page.evaluate(() => [...window.__studio.renderRoot.querySelectorAll('lcards-form-section[data-group]')].map((x) => x.header)))
        .toEqual(['Views', 'Controls', 'On-card buttons', 'Flying', 'Turning', 'Limits']);
    expect(await page.evaluate(() => !!window.__studio.renderRoot.querySelector('.views-section .start-view [data-key="view-tour"]')
        || window.__find('.start-view lcards-astro-schema-form').length > 0)).toBe(true);
    // the first view becomes a guided tour, gets an entity and a stop, and goes back to one view
    await page.evaluate(() => window.__find('[data-key="view-tour"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.camera.view)).toEqual({ entity: '', views: ['top'] });
    await page.evaluate(() => window.__find('ha-selector[data-key="view~entity"]')[0]
        .dispatchEvent(new CustomEvent('value-changed', { detail: { value: 'input_number.lcards_test_power' } })));
    await settle();
    await page.evaluate(() => window.__find('[data-key="view~add"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.camera.view)).toEqual({ entity: 'input_number.lcards_test_power', views: ['top', 'top'] });
    await page.evaluate(() => window.__find('[data-key="view-unbind"]')[0].click());
    await settle();
    expect(await page.evaluate(() => window.__studio._workingConfig.camera.view)).toBe('top');
    expect((await cardErrors(page)).filter((e) => !/Frame took/.test(e))).toEqual([]);
});

test('studio UX1 P4: starter gallery with pictures, try in the preview (keep, discard), undo and redo, the toolbar', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);
    const dialog = page.locator('lcards-astrometrics-studio-dialog');
    await page.evaluate(() => { window.__studio._activeTab = 'starters'; });

    // a tile per starter, each with its picture loaded
    const tiles = dialog.locator('.starter-tile');
    await expect(tiles.first()).toBeVisible();
    const pictures = await page.evaluate(async () => {
        const imgs = [...window.__studio.renderRoot.querySelectorAll('.starter-tile img')];
        await Promise.all(imgs.map((i) => { i.loading = 'eager'; return i.decode().catch(() => null); }));
        return { tiles: window.__studio.renderRoot.querySelectorAll('.starter-tile').length, loaded: imgs.filter((i) => i.naturalWidth > 0).length };
    });
    expect(pictures.loaded).toBe(pictures.tiles);
    expect(pictures.tiles).toBeGreaterThanOrEqual(20);

    // a tile opens its detail: what it adds, its settings form, the YAML
    await dialog.locator('.starter-tile[data-starter="planet"]').click();
    const detail = dialog.locator('[data-starter-detail="planet"]');
    await expect(detail.locator('.starter-adds')).toHaveText('Adds 4 points, 6 objects.');
    await expect(detail.locator('lcards-astro-schema-form')).toHaveCount(1);

    const counts = () => page.evaluate(() => {
        const s = window.__studio;
        return { working: s._workingConfig.objects.length, preview: s._previewCard._rawConfig.objects.length };
    });
    const before = await counts();
    const tabDisabled = () => page.evaluate(() => [...window.__studio.renderRoot.querySelectorAll('ha-tab-group-tab')].filter((t) => t.hasAttribute('disabled')).map((t) => t.getAttribute('value')));

    // try: the preview has the planet, the working copy does not, other tabs and undo wait
    await detail.locator('ha-button[data-action="try"]').click();
    await expect.poll(counts).toEqual({ working: before.working, preview: before.working + 6 });
    expect(await tabDisabled()).toEqual(['scene', 'objects', 'points', 'camera', 'yaml']);
    await expect(dialog.locator('.try-bar')).toContainText('Trying: Planet with moons');
    expect(await page.evaluate(() => window.__studio.renderRoot.querySelector('[data-tool="place"]').disabled)).toBe(true);

    // a setting changed while trying follows into the preview
    await page.evaluate(() => {
        const form = window.__studio.renderRoot.querySelector('[data-starter-detail="planet"] lcards-astro-schema-form');
        form.dispatchEvent(new CustomEvent('form-changed', { detail: { value: { ...form.value, moons: 4 } } }));
    });
    await expect.poll(counts).toEqual({ working: before.working, preview: before.working + 10 });

    // discard: back to the working copy
    await dialog.locator('.try-bar ha-button[data-try="discard"]').click();
    await expect.poll(counts).toEqual(before);
    expect(await tabDisabled()).toEqual([]);

    // try again and keep: one undo step
    await detail.locator('ha-button[data-action="try"]').click();
    await dialog.locator('.try-bar ha-button[data-try="keep"]').click();
    await expect.poll(counts).toEqual({ working: before.working + 10, preview: before.working + 10 });
    expect(await page.evaluate(() => window.__studio._history.canUndo)).toBe(true);

    // Ctrl+Z undoes it, Ctrl+Shift+Z brings it back (keys on the dialog, not in a text box)
    await dialog.locator('.starter-detail h3').click();
    await page.keyboard.press('Control+z');
    await expect.poll(counts).toEqual(before);
    await page.keyboard.press('Control+Shift+z');
    await expect.poll(counts).toEqual({ working: before.working + 10, preview: before.working + 10 });
    // the toolbar's undo button too
    await dialog.locator('[data-tool="undo"]').click();
    await expect.poll(counts).toEqual(before);

    // typing in one field is one undo step
    await page.evaluate(() => {
        const s = window.__studio;
        for (const n of [1, 12, 123]) s._setTop('time_scale', n);
    });
    await page.evaluate(() => window.__studio._undo());
    expect(await page.evaluate(() => window.__studio._workingConfig.time_scale)).toBeUndefined();

    // the toolbar collapses to its toggle and opens again
    await dialog.locator('.canvas-toolbar [data-tool="toggle"]').click();
    await expect(dialog.locator('.canvas-toolbar.collapsed')).toHaveCount(1);
    await expect(dialog.locator('[data-tool="undo"]')).toHaveCount(0);
    await dialog.locator('.canvas-toolbar [data-tool="toggle"]').click();
    await expect(dialog.locator('[data-tool="undo"]')).toHaveCount(1);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('studio UX1 P4 round 2: scenes and parts in their own sections, a part in other units dimmed and started with its scene, the units chip', async ({ page }) => {
    // about 8 s alone; the Star Trek galaxy and the true-scale dive build slowly beside the other WebGL tests in a full run
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);
    const dialog = page.locator('lcards-astrometrics-studio-dialog');
    await page.evaluate(() => { window.__studio._activeTab = 'starters'; });
    await expect(dialog.locator('lcards-form-section.starter-group')).toHaveCount(2);
    await expect(dialog.locator('[data-group="part"] .starter-tile[data-starter="planet"]')).toHaveCount(1);
    // the card has no units; the Star Trek parts are in ly
    await expect(dialog.locator('.units-chip ha-assist-chip')).toHaveAttribute('label', 'Scene: scene units');
    await expect(dialog.locator('.starter-tile[data-starter="st_minor_powers"]')).toHaveClass(/clash/);
    await expect(dialog.locator('.starter-tile[data-starter="planet"]')).not.toHaveClass(/clash/);
    await expect(dialog.locator('.starter-tile[data-starter="st_minor_powers"] .starter-note')).toContainText('In ly; this scene is in scene units');

    await dialog.locator('.starter-tile[data-starter="st_minor_powers"]').click();
    const detail = dialog.locator('[data-starter-detail="st_minor_powers"]');
    await expect(detail.locator('.starter-clash')).toContainText('It is made for Star Trek galaxy');
    await expect(detail.locator('ha-button[data-action="insert"]')).toContainText('Start with Star Trek galaxy and add it');

    // try: the galaxy and the part in the preview, the chip follows; the working copy waits
    await detail.locator('ha-button[data-action="try"]').click();
    await expect(dialog.locator('.units-chip ha-assist-chip')).toHaveAttribute('label', 'Scene: ly');
    expect(await page.evaluate(() => window.__studio._workingConfig.units)).toBeUndefined();
    await dialog.locator('.try-bar ha-button[data-try="keep"]').click();
    const kept = await page.evaluate(() => {
        const c = window.__studio._workingConfig;
        return { units: c.units, ferenginar: c.points.some((p) => p.id === 'ferenginar'), svc: c.points.some((p) => p.id === 'svc') };
    });
    expect(kept).toEqual({ units: 'ly', ferenginar: true, svc: false });
    expect(await page.evaluate(() => window.__studio._starterMessage.text)).toMatch(/^Star Trek galaxy, then Star Trek: minor powers: added /);
    // undo: the card's own scene again
    await page.evaluate(() => window.__studio._undo());
    await expect(dialog.locator('.units-chip ha-assist-chip')).toHaveAttribute('label', 'Scene: scene units');
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('studio UX1 P5: add-object gallery by group, shapes by picture, Open system on its row, parts into the open system in its units', async ({ page }) => {
    // about 8 s alone; the Star Trek galaxy and the true-scale dive build slowly beside the other WebGL tests in a full run
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-dive', { width: '800' });
    await openStudio(page);
    const root = (sel) => page.evaluate((q) => [...window.__studio.renderRoot.querySelectorAll(q)].map((el) => /** @type {HTMLElement} */ (el).dataset), sel);

    // the gallery: groups in order, a tile per type with its picture, system offered in the scene
    await page.evaluate(async () => { const s = window.__studio; s._activeTab = 'objects'; s._addingObject = true; await s.updateComplete; });
    expect((await root('[data-type-group]')).map((d) => d.typeGroup)).toEqual(['maps', 'bodies', 'routes', 'light', 'models', 'systems']);
    const tiles = (await root('[data-type]')).map((d) => d.type);
    expect(tiles).toHaveLength(18);
    expect(await page.evaluate(() => window.__studio.renderRoot.querySelector('[data-type="grid"] img').getAttribute('src'))).toBe('/lcards/images/astro-studio/type-grid.webp');
    await expect.poll(() => page.evaluate(() => window.__studio.renderRoot.querySelector('[data-type="grid"] img').naturalWidth)).toBeGreaterThan(0);
    const before = await page.evaluate(() => window.__studio._workingConfig.objects.length);
    await page.evaluate(() => window.__studio.renderRoot.querySelector('[data-type="volume"]').click());
    // added once the preview says where it looks (round 2)
    await expect.poll(() => page.evaluate(() => window.__studio._workingConfig.objects.length)).toBe(before + 1);
    const added = await page.evaluate(() => window.__studio._workingConfig.objects.at(-1));
    expect(added.type).toBe('volume');
    expect(await page.evaluate(() => window.__studio._workingConfig.objects.length)).toBe(before + 1);
    expect(await page.evaluate(() => window.__studio._addingObject)).toBe(false);

    // its shape is a row of pictures; a tap picks one, the default leaves the key out
    const shapes = () => page.evaluate(async (i) => {
        const form = window.__studio.renderRoot.querySelector(`[data-object="${i}"] lcards-astro-schema-form`);
        await form.updateComplete;
        return [...form.renderRoot.querySelectorAll('.shape-tile')].map((b) => [b.dataset.shape, b.getAttribute('aria-checked')]);
    }, before);
    expect(await shapes()).toEqual([['sector', 'true'], ['box', 'false'], ['prism', 'false']]);
    await page.evaluate((i) => window.__studio.renderRoot.querySelector(`[data-object="${i}"] lcards-astro-schema-form`).renderRoot.querySelector('[data-shape="box"]').click(), before);
    await expect.poll(() => page.evaluate((i) => window.__studio._workingConfig.objects[i].shape, before)).toBe('box');
    await page.evaluate((i) => window.__studio.renderRoot.querySelector(`[data-object="${i}"] lcards-astro-schema-form`).renderRoot.querySelector('[data-shape="sector"]').click(), before);
    await expect.poll(() => page.evaluate((i) => 'shape' in window.__studio._workingConfig.objects[i], before)).toBe(false);

    // the system's row: Open system shows while the row is closed
    const sys = await page.evaluate(() => window.__studio._workingConfig.objects.findIndex((o) => o.type === 'system'));
    await page.evaluate(async () => { const s = window.__studio; s._selectObject(-1); await s.updateComplete; });
    await page.evaluate((i) => window.__studio.renderRoot.querySelector(`[data-object="${i}"] [data-action="open-system"]`).click(), sys);
    expect(await page.evaluate(() => window.__studio._scope)).toBe(sys);
    // inside a system the gallery has no system tile
    await page.evaluate(async () => { const s = window.__studio; s._addingObject = true; await s.updateComplete; });
    expect((await root('[data-type]')).map((d) => d.type)).not.toContain('system');

    // Starters with the km system open: the scope bar, a planet sized in km, added into the system
    await page.evaluate(async () => { const s = window.__studio; s._activeTab = 'starters'; s._openStarter = 'planet'; await s.updateComplete; });
    expect(await page.evaluate(() => window.__studio.renderRoot.querySelector('.scope-bar')?.textContent)).toMatch(/Parts go into system/);
    await expect(page.locator('lcards-astrometrics-studio-dialog pre.starter-yaml')).toContainText('150000000');
    await page.locator('lcards-astrometrics-studio-dialog [data-action="insert"]').filter({ hasText: 'Add to system' }).click();
    const sysCfg = await page.evaluate((i) => window.__studio._workingConfig.objects[i], sys);
    expect(sysCfg.objects.find((o) => o.id === 'planet_globe').radius).toBe(6370);
    expect(await page.evaluate(() => window.__studio._workingConfig.objects.some((o) => o.id === 'planet_globe'))).toBe(false);

    // a part in ly cannot go into the km system: dimmed, and its button goes back to the scene
    await page.evaluate(async () => { const s = window.__studio; s._openStarter = null; await s.updateComplete; });
    expect(await page.evaluate(() => window.__studio.renderRoot.querySelector('[data-starter="st_minor_powers"]').classList.contains('clash'))).toBe(true);
    await page.evaluate(async () => { const s = window.__studio; s._openStarter = 'st_minor_powers'; await s.updateComplete; });
    await page.locator('lcards-astrometrics-studio-dialog [data-action="to-scene"]').click();
    expect(await page.evaluate(() => window.__studio._scope)).toBe(-1);
    // in the ly scene it adds
    expect(await page.evaluate(() => window.__studio.renderRoot.querySelector('[data-action="insert"]')?.textContent?.trim())).toBe('Add to the scene');
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('studio UX1 P5 round 2: a new object sized to the view and where it looks; Open flies to the system, Back flies home; a new shape keeps the size; the scale bar', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-dive', { width: '800' });
    await openStudio(page);
    const scene = () => page.evaluate(async () => { const sc = await window.__studio._previewCard.studioScene(); const d = sc.debug(); return { distance: d.keys.distance, frame: d.frame, flying: !!d.rig.fly }; });
    await expect.poll(async () => (await scene()).flying).toBe(false);
    // the scale bar under the units chip: a round length in the scene's units, about a fifth of the view
    const bar = () => page.evaluate(() => {
        const el = window.__studio.renderRoot.querySelector('.scale-bar');
        return el ? { label: el.querySelector('.scale-label').textContent.trim(), px: el.querySelector('.scale-line').getBoundingClientRect().width } : null;
    });
    await expect.poll(async () => (await bar())?.label).toMatch(/^[125]0*(,0+)* ly$/);
    expect((await bar()).px).toBeGreaterThan(80);
    expect((await bar()).px).toBeLessThan(400);

    // the galaxy from 140,000 ly: a grid at the core, a hundred thousand across (not 200 at the origin)
    await page.evaluate(async () => { const s = window.__studio; s._activeTab = 'objects'; s._addingObject = true; await s.updateComplete; });
    const before = await page.evaluate(() => window.__studio._workingConfig.objects.length);
    await page.evaluate(() => window.__studio.renderRoot.querySelector('[data-type="grid"]').click());
    await expect.poll(() => page.evaluate(() => window.__studio._workingConfig.objects.length)).toBe(before + 1);
    const grid = await page.evaluate(() => window.__studio._workingConfig.objects.at(-1));
    expect(grid).toEqual({ type: 'grid', id: 'grid1', at: 'core', size: 100000, line_spacing: 5000 });
    // a disc keeps its size
    await page.evaluate((i) => window.__studio.renderRoot.querySelector(`[data-object="${i}"] lcards-astro-schema-form`).renderRoot.querySelector('[data-shape="disc"]').click(), before);
    await expect.poll(() => page.evaluate((i) => window.__studio._workingConfig.objects[i].radius, before)).toBe(50000);

    // Open on the system's row: the preview flies into it (its frame), framing what it holds
    const sys = await page.evaluate(() => window.__studio._workingConfig.objects.findIndex((o) => o.type === 'system'));
    await page.evaluate(async () => { const s = window.__studio; s._addingObject = false; s._selectObject(-1); await s.updateComplete; });
    await page.evaluate((i) => window.__studio.renderRoot.querySelector(`[data-object="${i}"] [data-action="open-system"]`).click(), sys);
    await expect.poll(async () => (await scene()).frame, { timeout: 10_000 }).toBe('sol_system');
    await expect.poll(async () => (await scene()).flying, { timeout: 10_000 }).toBe(false);
    // the Earth's orbit (1 au) in view: a few au out, in km
    const inside = await scene();
    expect(inside.distance).toBeGreaterThan(1.5e8);
    expect(inside.distance).toBeLessThan(2e9);
    await expect.poll(async () => (await bar())?.label).toMatch(/ km$/);

    // a glow added in the system: sized in km for that view, on the sun it looks at
    const held = await page.evaluate((i) => window.__studio._workingConfig.objects[i].objects.length, sys);
    await page.evaluate(async () => { const s = window.__studio; s._addingObject = true; await s.updateComplete; });
    await page.evaluate(() => window.__studio.renderRoot.querySelector('[data-type="glow"]').click());
    await expect.poll(() => page.evaluate((i) => window.__studio._workingConfig.objects[i].objects.length, sys)).toBe(held + 1);
    const glow = await page.evaluate((i) => window.__studio._workingConfig.objects[i].objects.at(-1), sys);
    expect(glow.size).toBeGreaterThan(1e7);
    expect(glow.at).toBe('sun');

    // Back to the scene: the start view again
    await page.locator('lcards-astrometrics-studio-dialog .scope-bar ha-button').click();
    await expect.poll(async () => (await scene()).frame, { timeout: 10_000 }).toBe('root');
    await expect.poll(async () => (await scene()).flying, { timeout: 10_000 }).toBe(false);
    expect((await scene()).distance).toBeCloseTo(140000, -2);
    await expect.poll(async () => (await bar())?.label).toMatch(/ ly$/);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('studio UX1 P6a: fly forward and back on the toolbar move the preview camera and target together', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-camera', { width: '800' });
    await openStudio(page);
    const dialog = page.locator('lcards-astrometrics-studio-dialog');
    const keys = () => page.evaluate(() => window.__studio._previewCard._scene.debug().keys);
    const a = await keys();
    await dialog.locator('[data-tool="fly-forward"]').click();
    await expect.poll(async () => (await keys()).tx !== a.tx || (await keys()).tz !== a.tz, { timeout: 3_000 }).toBe(true);
    await page.waitForTimeout(400);
    const b = await keys();
    expect(b.distance).toBeCloseTo(a.distance, 6);
    expect(Math.hypot(b.tx - a.tx, b.ty - a.ty, b.tz - a.tz)).toBeCloseTo(a.distance / 2, 3);
    await dialog.locator('[data-tool="fly-back"]').click();
    await page.waitForTimeout(400);
    const c = await keys();
    expect(Math.hypot(c.tx - a.tx, c.ty - a.ty, c.tz - a.tz)).toBeLessThan(a.distance * 1e-3);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('studio UX1 P6c: the model form says what the file measures and how it is drawn; Fit to view, File size, Real size', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-real-size', { width: '800' });
    await openStudio(page);
    const panel = (i) => page.evaluate(async (k) => {
        const s = window.__studio;
        await s.updateComplete;
        const el = s.renderRoot.querySelector(`[data-object="${k}"] .model-size`);
        return el ? { mode: el.dataset.mode, text: el.querySelector('.hint').textContent.replace(/\s+/g, ' ').trim(), real: !el.querySelector('[data-action="real-size"]').hasAttribute('disabled') } : null;
    }, i);
    const click = (i, action) => page.evaluate(([k, a]) => window.__studio.renderRoot.querySelector(`[data-object="${k}"] [data-action="${a}"]`).click(), [i, action]);
    const obj = (i) => page.evaluate((k) => window.__studio._workingConfig.objects[k], i);
    await page.evaluate(async () => { const s = window.__studio; s._activeTab = 'objects'; s._selectObject(1); await s.updateComplete; });
    // the ship: real size in km, measured from the preview once it has loaded
    await expect.poll(async () => (await panel(1))?.text, { timeout: 20_000 }).toContain('File: 127 x 67.9 x 289 m (largest 289 m).');
    expect((await panel(1)).text).toContain('Drawn at its real size, as the file measures: 289 m = 0.289 km.');
    expect((await panel(1)).real).toBe(false);
    // Fit to view: a round size from the view (4 km out), then Real size clears it
    await click(1, 'fit-view');
    await expect.poll(async () => (await obj(1)).size).toBeGreaterThan(0);
    expect(String((await obj(1)).size)).toMatch(/^[125](\.0*)?$|^0\.[0]*[125]$/);
    await expect.poll(async () => (await panel(1)).mode).toBe('size');
    await click(1, 'real-size');
    await expect.poll(async () => 'size' in (await obj(1))).toBe(false);
    // File size: its largest extent as the size
    await click(1, 'file-size');
    await expect.poll(async () => (await obj(1)).size).toBeCloseTo(289, 0);
});

test('studio UX1 P6c: another file reads its own measurements and the preview flies to it; Show flies to a model', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-real-size', { width: '800' });
    await openStudio(page);
    const text = (i) => page.evaluate(async (k) => {
        const s = window.__studio;
        await s.updateComplete;
        return s.renderRoot.querySelector(`[data-object="${k}"] .model-size .hint`)?.textContent.replace(/\s+/g, ' ').trim() ?? '';
    }, i);
    const target = () => page.evaluate(async () => (await window.__studio._previewCard.studioScene()).viewNow().target);
    await page.evaluate(async () => { const s = window.__studio; s._activeTab = 'objects'; s._selectObject(1); await s.updateComplete; });
    await expect.poll(() => text(1), { timeout: 20_000 }).toContain('largest 289 m');
    // the ship becomes Deep Space 9: the panel waits for that file (not the ship's build), the preview flies to it
    await page.evaluate(() => {
        const s = window.__studio;
        const form = s.renderRoot.querySelector('[data-object="1"] lcards-astro-schema-form');
        form.dispatchEvent(new CustomEvent('form-changed', { detail: { value: { ...s._workingConfig.objects[1], src: 'builtin:deep_space_nine' } } }));
    });
    await expect.poll(() => text(1), { timeout: 20_000 }).toContain('largest 1,450 m');
    await expect.poll(async () => (await target())[0], { timeout: 10_000 }).toBeCloseTo(1.2, 1);
    // Show: the feet ship, at [-1.2, 0, 0]
    await page.evaluate(async () => { const s = window.__studio; s._selectObject(2); await s.updateComplete; });
    await expect.poll(() => text(2), { timeout: 20_000 }).toContain('File:');
    await page.evaluate(() => window.__studio.renderRoot.querySelector('[data-object="2"] [data-action="show-model"]').click());
    await expect.poll(async () => (await target())[0], { timeout: 10_000 }).toBeCloseTo(-1.2, 1);
    // the length field is in the form, labelled in metres
    await page.evaluate(async () => { const s = window.__studio; s._selectObject(4); await s.updateComplete; });
    await expect.poll(() => text(4), { timeout: 20_000 }).toContain('Drawn at its real length: 1,061 m = 1.06 km.');
});

test('studio UX1 P6c visible size: the toolbar toggle draws small models larger in the preview, not saved', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-real-size', { width: '800' });
    await openStudio(page);
    const tool = () => page.evaluate(async () => {
        const s = window.__studio;
        await s.updateComplete;
        const b = s.renderRoot.querySelector('[data-tool="model-scale"]');
        const scene = await s._previewCard?.studioScene?.().catch(() => null);
        return b ? { disabled: b.disabled, pressed: b.getAttribute('aria-pressed'), mode: scene?.modelScale?.() ?? null } : null;
    });
    await expect.poll(async () => (await tool())?.disabled, { timeout: 20_000 }).toBe(false);
    expect((await tool()).pressed).toBe('false');
    await page.evaluate(() => window.__studio.renderRoot.querySelector('[data-tool="model-scale"]').click());
    await expect.poll(async () => (await tool())?.mode).toBe('visible');
    expect((await tool()).pressed).toBe('true');
    expect(await page.evaluate(() => 'model_scale' in window.__studio._workingConfig)).toBe(false);
});

test('studio UX1 P6d: a prism outline edited on the preview: drag a corner (snapped), add one, remove one, draw a new outline', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-prism', { width: '800' });
    await openStudio(page);
    await page.evaluate(async () => { const s = window.__studio; s._activeTab = 'objects'; s._selectObject(1); await s.updateComplete; });
    const outline = () => page.evaluate(() => window.__studio._workingConfig.objects[1].outline);
    const click = (action) => page.evaluate((a) => window.__studio.renderRoot.querySelector(`[data-object="1"] [data-action="${a}"]`).click(), action);
    // the corner handles on the preview, in page px
    const handles = (cls) => page.evaluate((c) => {
        const card = window.__studio._previewCard;
        return [...card.renderRoot.querySelectorAll(`.astro-outline button.${c}`)].map((b) => { const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, hidden: b.hidden }; });
    }, cls);
    await expect.poll(async () => (await page.evaluate(() => window.__studio.renderRoot.querySelectorAll('[data-object="1"] .outline-row').length)), { timeout: 20_000 }).toBe(4);
    await click('outline-edit');
    await expect.poll(async () => (await handles('corner')).length, { timeout: 10_000 }).toBe(4);
    const c = await handles('corner');
    // px per unit across the first edge ([-5, -5] to [5, -5])
    const k = (c[1].x - c[0].x) / 10;
    expect(k).toBeGreaterThan(5);
    // corner 3 ([5, 5]) to about [8.1, 7.9]: snapped to the grid's 2, so [8, 8]
    await page.mouse.move(c[2].x, c[2].y);
    await page.mouse.down();
    await page.mouse.move(c[2].x + 1.5 * k, c[2].y + 1.5 * k, { steps: 4 });
    await page.mouse.move(c[2].x + 3.1 * k, c[2].y + 2.9 * k, { steps: 4 });
    await page.mouse.up();
    await expect.poll(outline).toEqual([[-5, -5], [5, -5], [8, 8], [-5, 5]]);
    // the + on the first edge adds a corner at its middle; Delete removes the selected one
    const m = await handles('middle');
    await page.mouse.click(m[0].x, m[0].y);
    await expect.poll(outline).toEqual([[-5, -5], [0, -5], [5, -5], [8, 8], [-5, 5]]);
    await page.keyboard.press('Delete');
    await expect.poll(outline).toEqual([[-5, -5], [5, -5], [8, 8], [-5, 5]]);
    // undo brings the corner back (each change is one step)
    await page.evaluate(() => window.__studio._undo());
    await expect.poll(outline).toEqual([[-5, -5], [0, -5], [5, -5], [8, 8], [-5, 5]]);
    // Escape ends the editing, not the Studio
    const h = await handles('corner');
    await page.mouse.click(h[0].x, h[0].y);
    await page.keyboard.press('Escape');
    await expect.poll(() => page.evaluate(() => window.__studio._outlineEdit)).toBe(null);
    expect(await page.evaluate(() => window.__studio.isConnected)).toBe(true);
    // Draw new outline: three taps on the ground, then the first corner closes it
    await click('outline-draw');
    const preview = await page.evaluate(() => { const r = window.__studio._previewCard.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await page.mouse.click(preview.x, preview.y);
    await page.mouse.click(preview.x + 4 * k, preview.y);
    await page.mouse.click(preview.x, preview.y + 4 * k);
    const first = (await handles('corner'))[0];
    await page.mouse.click(first.x, first.y);
    await expect.poll(async () => (await outline()).length).toBe(3);
    const drawn = await outline();
    expect(Math.abs(drawn[1][0] - drawn[0][0])).toBeCloseTo(4, 0);
    expect(await page.evaluate(() => window.__studio._outlineEdit?.draw)).toBe(false);
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('the preview sizes its canvas by layout, not by a CSS transform (the dialog opens from 0.8 scale)', async ({ page }) => {
    await mountCase(page, 'astro-prism', { width: '800' });
    // shrunk by a transform while a resize happens (as during the dialog's opening animation), then back
    const sizes = await page.evaluate(async () => {
        const mount = /** @type {HTMLElement} */ (document.querySelector('#mount'));
        mount.style.transform = 'scale(0.8)';
        mount.style.transformOrigin = '0 0';
        mount.style.width = '780px';
        await new Promise((r) => setTimeout(r, 300));
        mount.style.transform = '';
        await new Promise((r) => setTimeout(r, 300));
        const card = /** @type {any} */ (mount.firstElementChild);
        const c = card.renderRoot.querySelector('.astro-scene canvas');
        return { canvas: c.width / devicePixelRatio, client: c.clientWidth };
    });
    expect(Math.abs(sizes.canvas - sizes.client)).toBeLessThanOrEqual(1);
});

test('studio: either side of a pair follows an entity on its own (link button per side), and back to a number', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 1400, height: 900 });
    await mountCase(page, 'astro-belt-colors', { width: '800' });
    await openStudio(page);
    await page.evaluate(async () => { const s = window.__studio; s._activeTab = 'objects'; s._selectObject(0); await s.updateComplete; });
    const radius = () => page.evaluate(() => window.__studio._workingConfig.objects[0].radius);
    const deep = (sel) => page.evaluate((q) => {
        const find = (r) => { for (const el of r.querySelectorAll('*')) { if (el.matches?.(q)) return el; if (el.shadowRoot) { const f = find(el.shadowRoot); if (f) return f; } } return null; };
        return !!find(window.__studio.renderRoot);
    }, sel);
    const click = (sel) => page.evaluate((q) => {
        const find = (r) => { for (const el of r.querySelectorAll('*')) { if (el.matches?.(q)) return el; if (el.shadowRoot) { const f = find(el.shadowRoot); if (f) return f; } } return null; };
        find(window.__studio.renderRoot).click();
    }, sel);
    await expect.poll(() => deep('[data-key="radius-1-bind"]'), { timeout: 10_000 }).toBe(true);
    expect(await radius()).toEqual([40, 60]);
    // the outer side follows an entity; the inner keeps its number
    await click('[data-key="radius-1-bind"]');
    await expect.poll(radius).toEqual([40, { entity: '' }]);
    await expect.poll(() => deep('[data-side="1"]')).toBe(true);
    await expect.poll(() => deep('[data-key="radius~1-unbind"]')).toBe(true);
    // back to a number (the output's low, else 0)
    await click('[data-key="radius~1-unbind"]');
    await expect.poll(radius).toEqual([40, 0]);
});
