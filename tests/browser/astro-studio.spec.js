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
        s.renderRoot.querySelector(`[data-object="${i}"] .system-open ha-button`).click();
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
