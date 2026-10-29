/**
 * Bundle structure: loader stub, single main chunk, lazy editors and size budget.
 * Runs against the built bundle (npm run build first).
 */
import { test, expect } from '@playwright/test';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { mountCase, expectNoErrors } from './support.js';

const DIST = new URL('../../custom_components/lcards/', import.meta.url);

/** The nine cards and their (lazily loaded) editor tags. */
const CARDS = [
    'button', 'elbow', 'slider', 'chart', 'data-grid', 'alert-overlay', 'select-menu', 'layout-card',
].map(c => [`lcards-${c}`, `lcards-${c}-editor`]).concat([['lcards-msd-card', 'lcards-msd-editor'], ['lcards-astrometrics-card', 'lcards-astrometrics-editor']]);

test('the loader stub is loaded once with its query, and the main chunk once', async ({ page }) => {
    const requests = [];
    page.on('request', r => { if (r.url().includes('/lcards/')) requests.push(new URL(r.url())); });
    await mountCase(page, 'button-lozenge');
    const stubLoads = requests.filter(u => u.pathname === '/lcards/lcards.js');
    expect(stubLoads.map(u => u.search)).toEqual(['?v=test']);
    expect(requests.filter(u => /\/lcards\/chunks\/lcards-main-[^/]+\.js$/.test(u.pathname))).toHaveLength(1);
});

test('loading an editor chunk reuses the same core (no second copy of the bundle)', async ({ page }) => {
    const requests = [];
    page.on('request', r => { if (r.url().includes('/lcards/lcards.js')) requests.push(r.url()); });
    await mountCase(page, 'button-lozenge');
    const same = await page.evaluate(async () => {
        const core = window.lcards.core;
        await customElements.get('lcards-button').getConfigElement();
        return window.lcards.core === core;
    });
    expect(same).toBe(true);
    // Regression guard: a chunk importing shared code from the entry would re-request
    // lcards.js without its query string and run a second bundle.
    expect(requests).toHaveLength(1);
});

test('?log= on the loader URL sets the global log level', async ({ page }) => {
    await mountCase(page, 'button-lozenge', { log: 'warn' });
    expect(await page.evaluate(() => window.lcards.getGlobalLogLevel())).toBe('warn');
});

test('rendering cards loads no editor code', async ({ page }) => {
    const editorChunks = [];
    page.on('request', r => { if (/\/chunks\/[^/]*editor[^/]*\.js$/.test(r.url())) editorChunks.push(r.url()); });
    for (const name of ['button-lozenge', 'slider-pills', 'elbow-header-left', 'data-grid-data', 'msd-channel', 'astro-actions']) {
        await mountCase(page, name);
    }
    await mountCase(page, 'chart-area', { height: '300' });
    expect(editorChunks).toEqual([]);
});

for (const [cardTag, editorTag] of CARDS) {
    test(`${cardTag}: getConfigElement() loads and defines its editor`, async ({ page }) => {
        await mountCase(page, 'button-lozenge');
        const result = await page.evaluate(async ({ cardTag, editorTag }) => {
            const before = !!customElements.get(editorTag);
            const el = await customElements.get(cardTag).getConfigElement();
            return { before, tag: el.localName, defined: !!customElements.get(editorTag), upgraded: el instanceof customElements.get(editorTag) };
        }, { cardTag, editorTag });
        expect(result).toEqual({ before: false, tag: editorTag, defined: true, upgraded: true });
        await expectNoErrors(page);
    });
}

test('size budget: tiny loader, main chunk under its ceiling', () => {
    const chunks = readdirSync(new URL('chunks/', DIST));
    const main = chunks.find(f => /^lcards-main-.*\.js$/.test(f));
    expect(main, 'chunks/lcards-main-*.js').toBeTruthy();
    const size = (rel) => statSync(new URL(rel, DIST)).size;
    expect(size('lcards.js')).toBeLessThanOrEqual(2 * 1024);
    // Measured 2026-10-10 after the split: 1.94 MB raw / 418 KB br. Ceilings leave
    // ~10% headroom; a change that pulls editors back into the main chunk fails here.
    // 2,150,000 until 2026-10-25: E3b's astrometrics card side (fly-to registry, camera
    // buttons, editor pick mode) took it to 2.155 MB; the editor and runtime stay lazy.
    expect(size(`chunks/${main}`)).toBeLessThanOrEqual(2_200_000);
    // 460,000 until 2026-10-23: the main chunk had crept to ~460 KB br; C2's
    // background tier (scene effect classes, two presets, schemas) took it over.
    expect(size(`chunks/${main}.br`)).toBeLessThanOrEqual(480_000);
});

test('size budget: three.js and the anime.js three adapter stay out of the main chunk', () => {
    const chunks = readdirSync(new URL('chunks/', DIST));
    const main = chunks.find(f => /^lcards-main-.*\.js$/.test(f));
    const mainSource = readFileSync(new URL(`chunks/${main}`, DIST), 'utf8');
    expect(mainSource.includes('isAnimejsInstanceProxy'), 'three adapter in the main chunk').toBe(false);
    expect(/WebGLRenderer|WEBGL_multisampled_render_to_texture/.test(mainSource), 'three.js in the main chunk').toBe(false);
    // Measured 2026-10-23 (three 0.186.1): three 552 KB raw / 114 KB br, adapter 14 / 4 KB br,
    // runtime + scenes ~6 KB raw. Ceiling ~10% over the whole tier.
    // Rollup names the three.js chunk after whichever module it merged first
    // (three.module, or the adapter's instance module), so find it by content.
    // (No manualChunks: it would pull anime.js core in too, and main would import it.)
    const js = chunks.filter(f => f.endsWith('.js'));
    const three = js.find(f => readFileSync(new URL(`chunks/${f}`, DIST), 'utf8').includes('WEBGL_multisampled_render_to_texture'));
    expect(three, 'a lazy chunk holds three.js').toBeTruthy();
    expect(mainSource.includes(`"./${three}"`) && !mainSource.includes(`import("./${three}")`), 'main imports the three.js chunk statically').toBe(false);
    const tier = [three, ...js.filter(f => /^(three-runtime|warp-starfield|grid|holo-sphere|field-scene|contour-field|plasma|fluid|nebula|noise-glsl|scene-helpers)-[\w-]{8}\.js$/.test(f))];
    const total = (ext) => tier.reduce((sum, f) => sum + statSync(new URL(`chunks/${f}${ext}`, DIST)).size, 0);
    // 640 to 700 KB raw, 136 to 155 KB br (2026-10-27, E4 models): three.js is one module, so
    // the classes only the lazy glTF loader uses (its materials, interpolants, AnimationMixer,
    // EdgesGeometry) join the shared three chunk: measured 671 KB / 149 KB br. The Line2 family
    // moved out to the astrometrics runtime chunk at the same time.
    expect(total('')).toBeLessThanOrEqual(700_000);
    // 135 to 136 KB br (2026-10-25, E3a): the same raw bytes compress ~150 B larger when the
    // main chunk's export names shift (the three chunk imports a few short names from it).
    expect(total('.br')).toBeLessThanOrEqual(155_000);
});

test('size budget: the astrometrics runtime and schema are lazy chunks of their own', () => {
    const chunks = readdirSync(new URL('chunks/', DIST));
    const main = chunks.find(f => /^lcards-main-.*\.js$/.test(f));
    const mainSource = readFileSync(new URL(`chunks/${main}`, DIST), 'utf8');
    expect(mainSource.includes('[Astrometrics] scene unavailable'), 'astrometrics runtime in the main chunk').toBe(false);
    expect(mainSource.includes('A see-through box of grid cells'), 'astrometrics schema in the main chunk').toBe(false);
    const js = chunks.filter(f => f.endsWith('.js'));
    const runtime = js.find(f => readFileSync(new URL(`chunks/${f}`, DIST), 'utf8').includes('[Astrometrics] scene unavailable'));
    expect(runtime, 'a lazy chunk holds the astrometrics runtime').toBeTruthy();
    expect(js.some(f => /^astrometrics-schema-[\w-]{8}\.js$/.test(f)), 'the schema chunk').toBe(true);
    // Measured 2026-10-25: runtime 76 KB raw / 25 KB br (three.js and the Line2 family are in the three chunk).
    // E3a (labels on the text system) and E3b (zoom to cursor, keys, picking) took it to
    // 95 KB raw / 30.6 KB br the same day; ceilings ~10% over that.
    // E4 (2026-10-27): 114 KB raw / 36.7 KB br: cards on points, the depth pass, and the Line2
    // family (~15 KB raw) moving here from the three chunk once the model chunk imported three too.
    // E7 Part 2 (2026-10-27): 125 KB raw / 40.8 KB br: Studio edit mode (select any object, point drag,
    // selection box, placement for new points); its maths is a lazy chunk of its own (edit-tools, 3 KB),
    // loaded with the first edit mode. Ceilings ~10% over that.
    // E10 Part 1 (2026-10-29): 143 KB raw / 46.2 KB br after E8 and E9 (objects, distance fades,
    // markers) and E10's true scale (depth slices, log fly-to, ring refinement). Ceilings ~10% over.
    const size = (f) => statSync(new URL(`chunks/${f}`, DIST)).size;
    expect(size(/** @type {string} */ (runtime))).toBeLessThanOrEqual(157_000);
    expect(size(`${runtime}.br`)).toBeLessThanOrEqual(51_000);
    // the edit maths stays out of the runtime chunk
    expect(js.some(f => /^edit-tools-[\w-]{8}\.js$/.test(f)), 'the edit-tools chunk').toBe(true);
    // E6: the scene effects (nebula and their noise shaders) are a chunk of their own, loaded only
    // when a config uses them; 6 KB raw when it began (2026-10-25)
    const effects = js.find(f => readFileSync(new URL(`chunks/${f}`, DIST), 'utf8').includes('pull the gradient inside'));
    expect(effects, 'a lazy chunk holds the scene effects').toBeTruthy();
    expect(effects).not.toBe(runtime);
    expect(mainSource.includes('pull the gradient inside'), 'scene effects in the main chunk').toBe(false);
    // E4: the glTF loader and meshopt decoder are a chunk of their own, loaded only for a model
    // (82 KB raw when it began, 2026-10-27)
    const models = js.find(f => readFileSync(new URL(`chunks/${f}`, DIST), 'utf8').includes('Draco-compressed files are not supported'));
    expect(models, 'a lazy chunk holds the model loader').toBeTruthy();
    expect(models).not.toBe(runtime);
    expect(mainSource.includes('Draco-compressed files are not supported'), 'model loader in the main chunk').toBe(false);
    expect(size(/** @type {string} */ (models))).toBeLessThanOrEqual(95_000);
});

test('rules: editing an existing rule keeps the old rule until a page refresh (documented)', async ({ page }) => {
    await mountCase(page, 'button-rule');
    await page.evaluate(() => {
        const config = JSON.parse(JSON.stringify(window.__card.config));
        config.rules[0].apply.overlays.rule_button.style.card.color.background = '#00aa00';
        window.__reconfigure(config);
    });
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    // Pinned behaviour (doc/core/rules: "Refresh after changing an existing rule").
    await expect.poll(() => page.locator('lcards-button path.button-bg').evaluate(el => getComputedStyle(el).fill))
        .toBe('rgb(204, 0, 0)');
});
