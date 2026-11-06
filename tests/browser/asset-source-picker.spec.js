/**
 * The shared file source picker (lcards-asset-source-picker): asset library,
 * custom path, Home Assistant media, and MSD's "none". The picker replaced
 * three hand-written copies (shape texture, image background, MSD base SVG)
 * and is the astrometrics Studio's field for models and textures; these
 * tests hold each call site's behaviour. The harness has no Home Assistant
 * elements, so fields are driven by their value-changed events and read back
 * from their `.selector` / `.value` properties.
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

/** Load the editor chunks (button: shape texture and backgrounds; MSD: its Studio; astrometrics) */
async function loadEditors(page) {
    await page.evaluate(async () => {
        await customElements.get('lcards-button').getConfigElement();
        await customElements.get('lcards-msd-card').getConfigElement();
        await customElements.get('lcards-astrometrics-card').getConfigElement();
        await customElements.whenDefined('lcards-asset-source-picker');
    });
}

/** The picker's selectors, by class (mode, asset, custom, media), as plain data */
const pickerState = (page, selector) => page.evaluate((sel) => {
    const picker = eval(sel);
    const out = { mode: picker._mode, value: picker.value, sel: {} };
    for (const s of picker.renderRoot.querySelectorAll('ha-selector')) {
        out.sel[s.className] = { selector: s.selector, value: s.value, label: s.label };
    }
    out.warning = !!picker.renderRoot.querySelector('lcards-message');
    return out;
}, selector);

/** Fire value-changed on one of the picker's selectors */
const choose = (page, selector, cls, value) => page.evaluate(([sel, c, v]) => {
    const picker = eval(sel);
    picker.renderRoot.querySelector(`ha-selector.${c}`).dispatchEvent(new CustomEvent('value-changed', { detail: { value: v } }));
    return picker.updateComplete;
}, [selector, cls, value]);

test.beforeEach(async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await loadEditors(page);
});

test('picker: mode follows the value; switching modes; library default; none', async ({ page }) => {
    const first = await page.evaluate(() => {
        const p = document.createElement('lcards-asset-source-picker');
        p.id = 'p';
        p.value = 'builtin:earth_blue_marble';
        p.assetTypes = ['image'];
        window.__events = [];
        p.addEventListener('value-changed', (e) => { window.__events.push(['value', e.detail.value]); p.value = e.detail.value; });
        p.addEventListener('mode-changed', (e) => window.__events.push(['mode', e.detail.mode, e.detail.previous]));
        document.body.appendChild(p);
        return p.updateComplete.then(() => p.renderRoot.querySelector('ha-selector.asset').selector.select.options[0].value);
    });
    const P = 'document.getElementById("p")';
    let st = await pickerState(page, P);
    expect(st.mode).toBe('asset');
    expect(st.sel.asset.value).toBe('builtin:earth_blue_marble');
    // library entries are pack-provided images only, labelled with their name
    expect(st.sel.asset.selector.select.options.every((o) => o.value.startsWith('builtin:'))).toBe(true);

    // to media: no value change until something is picked; the media selector filters by accept
    await choose(page, P, 'mode', 'media');
    st = await pickerState(page, P);
    expect(st.mode).toBe('media');
    expect(st.sel.media.selector).toEqual({ media: { accept: ['image/*'] } });
    expect(st.value).toBe('builtin:earth_blue_marble');
    await choose(page, P, 'media', { media_content_id: 'media-source://media_source/local/a.png', media_content_type: 'image/png' });
    st = await pickerState(page, P);
    expect([st.mode, st.value]).toEqual(['media', 'media-source://media_source/local/a.png']);
    expect(st.sel.media.value).toEqual({ media_content_id: 'media-source://media_source/local/a.png', media_content_type: '' });

    // to custom, clear it, type a path: stays custom throughout
    await choose(page, P, 'mode', 'custom');
    await choose(page, P, 'custom', '');
    expect((await pickerState(page, P)).mode).toBe('custom');
    await choose(page, P, 'custom', '/local/galaxy.jpg');
    st = await pickerState(page, P);
    expect([st.mode, st.value, st.sel.custom.value]).toEqual(['custom', '/local/galaxy.jpg', '/local/galaxy.jpg']);
    expect(st.warning).toBe(false);

    // back to the library: a non-library value becomes its first file
    await choose(page, P, 'mode', 'asset');
    st = await pickerState(page, P);
    expect([st.mode, st.value]).toEqual(['asset', first]);

    // the value changed from outside (YAML): the mode follows
    await page.evaluate(() => { document.getElementById('p').value = 'media-source://lcards/my_models/x.glb'; });
    expect((await pickerState(page, P)).mode).toBe('media');

    const events = await page.evaluate(() => window.__events);
    expect(events.filter((e) => e[0] === 'mode').map((e) => e[1])).toEqual(['media', 'custom', 'asset']);

    // none (MSD): '' and 'none' are no file; choosing it sets 'none'
    await page.evaluate(() => {
        const p = document.getElementById('p');
        p.noneLabel = 'None (ViewBox Only)';
        p.value = '';
    });
    expect((await pickerState(page, P)).mode).toBe('none');
    await choose(page, P, 'mode', 'custom');
    await choose(page, P, 'mode', 'none');
    st = await pickerState(page, P);
    expect([st.mode, st.value]).toEqual(['none', 'none']);
    expect(st.sel.asset ?? st.sel.custom ?? st.sel.media).toBeUndefined();
});

test('shape texture: the image preset source goes through the picker', async ({ page }) => {
    const E = 'window.__tex.renderRoot.querySelector("lcards-asset-source-picker")';
    await page.evaluate(() => {
        const ed = document.createElement('lcards-shape-texture-editor');
        ed.config = { preset: 'image', config: { source: '/local/room.jpg', size: 'cover' } };
        window.__out = [];
        ed.addEventListener('texture-changed', (e) => { window.__out.push(e.detail.value); ed.config = e.detail.value; });
        document.body.appendChild(ed);
        window.__tex = ed;
        return ed.updateComplete;
    });
    let st = await pickerState(page, E);
    expect([st.mode, st.sel.custom.value, st.sel.custom.label]).toEqual(['custom', '/local/room.jpg', 'Image URL']);
    await choose(page, E, 'mode', 'asset');
    const out = await page.evaluate(() => window.__out.at(-1));
    expect(out.preset).toBe('image');
    expect(out.config.size).toBe('cover');
    expect(out.config.source).toMatch(/^builtin:/);
    // media: images and SVGs
    await choose(page, E, 'mode', 'media');
    st = await pickerState(page, E);
    expect(st.sel.media.selector).toEqual({ media: { accept: ['image/*'] } });
    expect(await cardErrors(page)).toEqual([]);
});

test('image background: the effect source goes through the picker', async ({ page }) => {
    const E = 'window.__bg.renderRoot.querySelector("lcards-asset-source-picker")';
    await page.evaluate(() => {
        const ed = document.createElement('lcards-background-animation-editor');
        ed.config = [{ preset: 'image', config: { source: 'builtin:earth_blue_marble' } }];
        ed._expandedEffects = { 0: true };
        window.__out = [];
        ed.addEventListener('effects-changed', (e) => { window.__out.push(e.detail.value); ed.config = e.detail.value; });
        document.body.appendChild(ed);
        window.__bg = ed;
        return ed.updateComplete;
    });
    await expect.poll(() => page.evaluate(() => !!window.__bg.renderRoot.querySelector('lcards-asset-source-picker'))).toBe(true);
    let st = await pickerState(page, E);
    expect([st.mode, st.sel.asset.value]).toEqual(['asset', 'builtin:earth_blue_marble']);
    await choose(page, E, 'mode', 'custom');
    await choose(page, E, 'custom', '/local/stars.png');
    const out = await page.evaluate(() => window.__out.at(-1));
    expect(out[0].config.source).toBe('/local/stars.png');
    expect(out[0].preset).toBe('image');
    st = await pickerState(page, E);
    expect(st.mode).toBe('custom');
    expect(await cardErrors(page)).toEqual([]);
});

test('MSD Studio: base SVG source through the picker; none switches the viewBox to custom and back', async ({ page }) => {
    await page.evaluate(() => {
        const studio = document.createElement('lcards-msd-studio-dialog');
        studio.hass = window.__hass;
        studio.config = { type: 'custom:lcards-msd-card', msd: { base_svg: { source: '/local/ship.svg' }, view_box: [0, 0, 400, 200] } };
        document.body.appendChild(studio);
        window.__msd = studio;
        return studio.updateComplete;
    });
    const E = 'window.__msd.renderRoot.querySelector("lcards-asset-source-picker")';
    await expect.poll(() => page.evaluate(() => !!window.__msd.renderRoot.querySelector('lcards-asset-source-picker'))).toBe(true);
    let st = await pickerState(page, E);
    expect([st.mode, st.sel.custom.value]).toEqual(['custom', '/local/ship.svg']);
    expect(st.sel.media === undefined).toBe(true);

    // none: source 'none', the viewBox goes custom (it was set), the info note shows
    await choose(page, E, 'mode', 'none');
    let w = await page.evaluate(() => ({
        source: window.__msd._workingConfig.msd.base_svg.source,
        mode: window.__msd._svgSourceMode,
        viewBoxMode: window.__msd._viewBoxMode,
        note: [...window.__msd.renderRoot.querySelectorAll('lcards-message')].some((m) => /No base SVG/.test(m.textContent))
    }));
    expect(w).toEqual({ source: 'none', mode: 'none', viewBoxMode: 'custom', note: true });

    // the library: its first SVG, and the viewBox back to auto
    await choose(page, E, 'mode', 'asset');
    w = await page.evaluate(() => ({
        source: window.__msd._workingConfig.msd.base_svg.source,
        mode: window.__msd._svgSourceMode,
        viewBoxMode: window.__msd._viewBoxMode
    }));
    expect(w.mode).toBe('asset');
    expect(w.source).toMatch(/^builtin:/);
    expect(w.viewBoxMode).toBe('auto');

    // media: SVG only
    await choose(page, E, 'mode', 'media');
    st = await pickerState(page, E);
    expect(st.sel.media.selector).toEqual({ media: { accept: ['image/svg+xml'] } });
});

test('astrometrics: model src and textures are pickers (models from the model library, media model/*)', async ({ page }) => {
    // the field kind comes from the schema annotation (assetSource), checked in node
    // (tests/editor/astro-studio-fields.test.js); here the rendered field
    await page.evaluate(() => {
        const form = document.createElement('lcards-astro-schema-form');
        form.schema = { src: { type: 'string', assetSource: 'model', description: 'The file.' }, image: { type: 'string', assetSource: 'image', description: 'A texture.' } };
        form.value = { src: 'builtin:constitution_class_refit' };
        window.__form = form;
        window.__changes = [];
        form.addEventListener('form-changed', (e) => window.__changes.push(e.detail.value));
        document.body.appendChild(form);
        return form.updateComplete;
    });
    const M = 'window.__form.renderRoot.querySelector("lcards-asset-source-picker[data-key=src]")';
    const I = 'window.__form.renderRoot.querySelector("lcards-asset-source-picker[data-key=image]")';
    let st = await pickerState(page, M);
    expect([st.mode, st.sel.asset.value]).toEqual(['asset', 'builtin:constitution_class_refit']);
    const models = st.sel.asset.selector.select.options.map((o) => o.value);
    expect(models).toEqual(expect.arrayContaining(['builtin:constitution_class_refit', 'builtin:deep_space_nine', 'builtin:earth_spacedock', 'builtin:utopia_planitia_drydock']));
    expect(models.every((v) => !/earth_blue_marble/.test(v))).toBe(true);
    expect(st.sel.asset.selector.select.options.find((o) => o.value === 'builtin:deep_space_nine').label).toMatch(/Deep Space 9/);
    await choose(page, M, 'mode', 'media');
    st = await pickerState(page, M);
    expect(st.sel.media.selector).toEqual({ media: { accept: ['model/*'] } });
    await choose(page, M, 'media', { media_content_id: 'media-source://lcards/my_models/odyssey.glb', media_content_type: 'model/gltf-binary' });
    expect(await page.evaluate(() => window.__changes.at(-1))).toEqual({ src: 'media-source://lcards/my_models/odyssey.glb' });
    // a texture field lists images, not models
    st = await pickerState(page, I);
    expect(st.mode).toBe('custom');
    await choose(page, I, 'mode', 'asset');
    expect(await page.evaluate(() => window.__changes.at(-1).image)).toMatch(/^builtin:/);
    expect(await page.evaluate(() => window.__changes.at(-1).image)).not.toMatch(/constitution/);
});

test('astrometrics: a model given as media-source:// loads through the media browser', async ({ page }) => {
    await mountCase(page, 'astro-starbases', { width: '900' });
    await page.evaluate(() => {
        // the fake hass has no media source: answer for LCARdS's own (as the integration would)
        const am = window.lcards.core.assetManager;
        window.__resolved = [];
        am.resolveMediaSourceUrl = async (id) => {
            window.__resolved.push(id);
            return id === 'media-source://lcards/my_models/ds9.glb' ? '/lcards/models/deep-space-nine.glb' : null;
        };
        const card = document.querySelector('#mount > *');
        const cfg = JSON.parse(JSON.stringify(card._rawConfig));
        cfg.objects = [{ type: 'model', id: 'mine', src: 'media-source://lcards/my_models/ds9.glb', size: 90, material: 'original' },
            { type: 'model', id: 'missing', src: 'media-source://lcards/my_models/nope.glb', at: [120, 0, 0], size: 40 }];
        cfg.points = [{ id: 'ops', object: 'mine', part: 'ops', label: 'OPS', marker: 'dot' }];
        window.__reconfigure(cfg);
    });
    const states = () => page.evaluate(() => {
        const s = document.querySelector('#mount > *')._scene?.debug();
        return ['mine', 'missing'].map((id) => s?.world?.objects.get(id)?.loadState());
    });
    await expect.poll(states, { timeout: 20_000 }).toEqual(['ready', 'failed']);
    expect(await page.evaluate(() => window.__resolved.sort())).toEqual(['media-source://lcards/my_models/ds9.glb', 'media-source://lcards/my_models/nope.glb']);
    // parts of a user model work like a built-in's (placed on the frame after the file is in)
    await expect.poll(() => page.evaluate(() => document.querySelector('#mount > *')._scene.debug().world.places.get('ops')?.y), { timeout: 5_000 }).toBeGreaterThan(5);
});
