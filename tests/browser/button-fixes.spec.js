/**
 * Button card fixes from the D2 docs audit (2026-11-07), each reproduced here
 * against the built bundle first: component grid rows, segments.default
 * precedence, partial per-side borders, icon_style.padding_<side>, the pulse
 * texture, the level texture's color and shape_texture map_range's `entity`.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** The card element's own JS object (internals read through page.evaluate). */
const card = (page) => page.locator('lcards-button').first();

test('button components report the rows they draw to; the user\'s grid_options wins', async ({ page }) => {
    await mountCase(page, 'button-radar');
    const grid = () => card(page).evaluate(el => /** @type {any} */ (el).getGridOptions());
    expect(await grid()).toMatchObject({ columns: 6, rows: 5 });
    for (const [component, rows] of [['dpad', 5], ['dpad_voyager', 6], ['brackets', 5], ['alert', 4]]) {
        await page.evaluate((c) => window.__reconfigure({ type: 'custom:lcards-button', component: c }), component);
        await expect.poll(grid).toMatchObject({ rows });
    }
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-button', component: 'dpad', grid_options: { rows: 2, columns: 3 } }));
    await expect.poll(grid).toMatchObject({ rows: 2, columns: 3 });
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-button', preset: 'lozenge' }));
    await expect.poll(grid).toMatchObject({ rows: 1, columns: 4 });
    await expectNoErrors(page);
});

test('component segments: segments.default beats the theme, a segment\'s own style beats default', async ({ page }) => {
    await mountCase(page, 'button-dpad-segment-default');
    const fills = () => card(page).evaluate(el => {
        const root = /** @type {any} */ (el).shadowRoot;
        const probe = (v) => {
            const p = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            p.style.fill = v;
            root.querySelector('svg').appendChild(p);
            const out = getComputedStyle(p).fill;
            p.remove();
            return out;
        };
        const fill = (id) => { const n = root.querySelector(`[id="${id}"]`); return n ? getComputedStyle(n).fill : null; };
        return { left: fill('left'), center: fill('center'), up: fill('up'), orange: probe('#ff9900'), blue: probe('#3366cc') };
    });
    await expect.poll(async () => (await fills()).left).not.toBeNull();
    const f = await fills();
    expect(f).toMatchObject({ orange: 'rgb(255, 153, 0)', blue: 'rgb(51, 102, 204)' });
    expect(f.left).toBe(f.orange);
    expect(f.center).toBe(f.orange);
    expect(f.up).toBe(f.blue);
    await expectNoErrors(page);
});

test('border: a per-side width or per-corner radius object keeps the preset\'s value on the other sides', async ({ page }) => {
    await mountCase(page, 'button-border-partial');
    const border = () => card(page).evaluate(el => /** @type {any} */ (el)._resolveBorderConfiguration());
    const partial = await border();
    // the preset's own values, from the same card without the objects
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-button', entity: 'light.living_room', preset: 'outline', text: { name: { show: true } } }));
    await expect.poll(async () => (await border()).hasPerSideWidth).toBe(false);
    const preset = await border();
    expect(partial.perSideWidth.left).toBe(6);
    expect(partial.perSideWidth.top).toBe(preset.width);
    expect(partial.perSideWidth.right).toBe(preset.width);
    expect(partial.topLeft).toBe(24);
    expect(partial.topRight).toBe(preset.topRight);
    expect(partial.bottomRight).toBe(preset.bottomRight);
    expect(partial.bottomLeft).toBe(preset.bottomLeft);
    await expectNoErrors(page);
});

test('icon_style.padding_left is the left side of padding and wins over padding.left; other sides keep theirs', async ({ page }) => {
    await mountCase(page, 'button-icon-padding-side');
    const icon = () => card(page).evaluate(el => {
        const i = /** @type {any} */ (el)._processedIcon;
        return i && { left: i.padding_left, top: i.padding_top, right: i.padding_right };
    });
    await expect.poll(icon).toEqual({ left: 20, top: 3, right: 0 });
    await expectNoErrors(page);
});

test('shape_texture preset pulse draws a breathing glow', async ({ page }) => {
    await mountCase(page, 'button-texture-pulse');
    const effect = () => card(page).evaluate(el => /** @type {any} */ (el)._canvasTextureRenderer?._effect?.constructor?.name ?? null);
    await expect.poll(effect).toBe('PulseTextureEffect');
    // it draws: some pixel on the texture canvas is not transparent
    const painted = () => card(page).evaluate(el => {
        const canvas = /** @type {any} */ (el).shadowRoot.querySelector('canvas');
        if (!canvas || !canvas.width || !canvas.height) return false;
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) return true;
        return false;
    });
    await expect.poll(painted).toBe(true);
    await expectNoErrors(page);
});

/** The level effect's fill colour and level, with the colour the card resolves '#3366cc' to. */
const level = (page) => card(page).evaluate(el => {
    const c = /** @type {any} */ (el);
    const e = c._canvasTextureRenderer?._effect;
    return e && { color: e._colorA, blue: c._resolveColorValue('#3366cc', ''), orange: c._resolveColorValue('#ff9900', ''), fill: e._fillPct };
});

test('level texture: config.color is the fill, not the preset\'s green; an explicit color_a still wins', async ({ page }) => {
    await mountCase(page, 'button-texture-level-color');
    await expect.poll(() => level(page)).not.toBeNull();
    const l = await level(page);
    expect(l.color).toBe(l.blue);
    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-button', preset: 'capped',
        shape_texture: { preset: 'level', config: { color_a: '#ff9900', color: '#3366cc' } },
    }));
    await expect.poll(async () => (await level(page))?.color).toBe(l.orange);
    await expectNoErrors(page);
});

test('shape_texture map_range takes entity (as everywhere else); entity_id, the older name, still works', async ({ page }) => {
    const config = (mapRange) => ({
        type: 'custom:lcards-button', preset: 'capped',
        shape_texture: { preset: 'level', config: { color: '#3366cc', fill_pct: { map_range: mapRange } } },
    });
    await mountCase(page, 'button-texture-level-color');
    const state = await page.evaluate(() => Number(/** @type {any} */ (window).__card.hass.states['sensor.demo_humidity'].state));
    await page.evaluate((c) => window.__reconfigure(c), config({ entity: 'sensor.demo_humidity', input: [0, 100], output: [0, 100] }));
    await expect.poll(async () => (await level(page))?.fill).toBeCloseTo(state, 5);
    await page.evaluate((c) => window.__reconfigure(c), config({ entity_id: 'sensor.demo_humidity', input: [0, 200], output: [0, 100] }));
    await expect.poll(async () => (await level(page))?.fill).toBeCloseTo(state / 2, 5);
    await expectNoErrors(page);
});

test('shape_texture { template, default } on any numeric key: the template\'s number, or default when it gives none (D2 batch 5)', async ({ page }) => {
    // fill_pct always had its own handling; other keys got the object as is
    const config = (template) => ({
        type: 'custom:lcards-button', preset: 'capped',
        shape_texture: { preset: 'level', config: { color: '#3366cc', fill_pct: 50, wave_height: { template, default: 3 } } },
    });
    const wave = () => card(page).evaluate(el => /** @type {any} */ (el)._canvasTextureRenderer?._effect?._waveHeight);
    await mountCase(page, 'button-texture-level-color');
    await page.evaluate((c) => window.__reconfigure(c), config('[[[ return 9 ]]]'));
    await expect.poll(wave).toBe(9);
    await page.evaluate((c) => window.__reconfigure(c), config('[[[ return "n/a" ]]]'));
    await expect.poll(wave).toBe(3);
    await expectNoErrors(page);
});

test('a free icon at a named position sits inside the button, padding from its edges', async ({ page }) => {
    const card = await mountCase(page, 'button-icon-free-position', { width: '300', height: '120' });
    const box = await card.evaluate(el => {
        const fo = el.shadowRoot.querySelector('ha-icon').closest('foreignObject');
        return ['x', 'y', 'width', 'height'].map(a => Number(fo.getAttribute(a)));
    });
    const [x, y, w, h] = box;
    expect(w).toBe(32);
    expect(y).toBe(10);              // top: padding from the top edge (was -6, half off the card)
    expect(x + w).toBeCloseTo(300 - 10, 0); // right: padding from the right edge
    expect(h).toBe(32);
});

test("the user's style.text.default.color beats a preset's text.default.color", async ({ page }) => {
    const card = await mountCase(page, 'button-style-text-colour', { width: '300', height: '60' });
    const fill = () => card.evaluate(el => {
        const t = [...el.shadowRoot.querySelectorAll('text')].find(n => n.textContent.includes('OFFLINE'));
        return t && getComputedStyle(t).fill;
    });
    await expect.poll(fill).not.toBe('rgb(0, 0, 0)');
    const orange = await page.evaluate(() => {
        const d = document.createElement('div'); d.style.color = 'var(--lcards-orange)'; document.body.append(d);
        const c = getComputedStyle(d).color; d.remove(); return c;
    });
    expect(await fill()).toBe(orange);
});

test('alert.color.bars shows while the bar sweep runs', async ({ page }) => {
    const card = await mountCase(page, 'button-alert-bars-colour', { width: '300', height: '250' });
    const samples = [];
    for (let i = 0; i < 12; i++) {
        samples.push(await card.evaluate(el => {
            const bar = el.shadowRoot.querySelector('#bar-3');
            return bar && getComputedStyle(bar).stroke;
        }));
        await page.waitForTimeout(150);
    }
    expect(samples).toContain('rgb(0, 255, 0)');      // the sweep settles on the bars colour
    expect(samples).not.toContain('rgb(204, 0, 0)');   // never on the preset's trail red
});
