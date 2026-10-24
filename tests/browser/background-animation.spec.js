/**
 * Background effect parameters (C1): `target: background` animations, entity
 * bindings that glide, reduced motion, recolour in place on alert (F1) and layer order.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** A field of the first effect of background entry `index` */
const effectValue = (page, field, index = 0) => page.evaluate(([f, i]) => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const effect = card?._backgroundRenderer?.getHandles(i)[0]?.effects[0];
    // WebGL effects that wrap a Canvas2D model (the grid) keep its fields there
    const target = effect?.model ?? effect;
    return target ? target[f] : null;
}, [field, index]);

/** Stop every animation of every scope (what a rule or `while` ending does) */
const stopAll = (page) => page.evaluate(() => {
    const am = window.lcards.core.animationManager;
    [...am.scopes.keys()].forEach((id) => am.stopAnimations(id));
});

test('target: background ramps the effect speed (gated by to_state)', async ({ page }) => {
    await mountCase(page, 'button-background-target');
    await page.waitForTimeout(300);
    expect(await effectValue(page, 'speed'), 'state Auto: to_state Heat not met').toBe(1);
    await page.evaluate(() => window.__setState('input_select.demo_mode', 'Cool'));
    await page.waitForTimeout(300);
    expect(await effectValue(page, 'speed'), 'state Cool: still not met').toBe(1);
    await page.evaluate(() => window.__setState('input_select.demo_mode', 'Heat'));
    await expect.poll(() => effectValue(page, 'speed'), { timeout: 1500 }).toBeGreaterThan(1.5);
    expect(await effectValue(page, 'speed'), 'mid-ramp, not jumped').toBeLessThan(8);
    await expect.poll(() => effectValue(page, 'speed'), { timeout: 3000 }).toBe(8);
    await expectNoErrors(page);
});

test('stopping a running background animation restores the parameter', async ({ page }) => {
    await mountCase(page, 'button-background-target');
    await page.evaluate(() => window.__setState('input_select.demo_mode', 'Heat'));
    await expect.poll(() => effectValue(page, 'speed'), { timeout: 1500 }).toBeGreaterThan(1.5);
    await stopAll(page);
    await expect.poll(() => effectValue(page, 'speed')).toBe(1);
    await expectNoErrors(page);
});

test('an alert-mode change recolours in place: same effects, same canvas, the animation carries on (F1)', async ({ page }) => {
    await mountCase(page, 'button-background-target');
    await expect.poll(() => effectValue(page, 'speed')).toBe(1);
    const before = await page.evaluateHandle(() => {
        const bg = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer;
        return { effect: bg.getHandles()[0].effects[0], stars: bg.getHandles()[0].effects[0].stars, canvas: bg.canvas };
    });
    await page.evaluate(() => window.__setState('input_select.demo_mode', 'Heat'));
    await expect.poll(() => effectValue(page, 'speed'), { timeout: 1500 }).toBeGreaterThan(1.5);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('red_alert'));
    await page.waitForTimeout(300);
    expect(await page.evaluate((old) => {
        const bg = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer;
        const effect = bg.getHandles()[0].effects[0];
        return { effect: effect === old.effect, stars: effect.stars === old.stars, canvas: bg.canvas === old.canvas };
    }, before)).toEqual({ effect: true, stars: true, canvas: true });
    await expect.poll(() => effectValue(page, 'speed'), { timeout: 3000 }).toBe(8);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('green_alert'));
    await expectNoErrors(page);
});

test('an entity-bound value glides to the new value', async ({ page }) => {
    await mountCase(page, 'button-background-bound');
    await expect.poll(() => effectValue(page, 'scrollSpeedX')).toBe(80);
    await page.evaluate(() => window.__setState('input_number.demo_level', '90'));
    await expect.poll(() => effectValue(page, 'scrollSpeedX'), { timeout: 1500 }).toBeGreaterThan(85);
    expect(await effectValue(page, 'scrollSpeedX'), 'mid-glide').toBeLessThan(175);
    await expect.poll(() => effectValue(page, 'scrollSpeedX'), { timeout: 3000 }).toBe(180);
    await expectNoErrors(page);
});

test('the first background entry is the bottom layer', async ({ page }) => {
    await mountCase(page, 'button-background-stack');
    const pixel = () => page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const canvas = card._backgroundRenderer.canvas;
        const [r, g, b] = canvas.getContext('2d').getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
        return [r, g, b];
    });
    await expect.poll(pixel).toEqual([0, 0, 255]);
    await expectNoErrors(page);
});

test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('a bound value snaps, and the held frame is redrawn', async ({ page }) => {
        await mountCase(page, 'button-background-bound');
        await expect.poll(() => effectValue(page, 'scrollSpeedX')).toBe(80);
        await page.evaluate(() => window.__setState('input_number.demo_level', '90'));
        await expect.poll(() => effectValue(page, 'scrollSpeedX'), { timeout: 300 }).toBe(180);
        await expectNoErrors(page);
    });

    test('a target: background animation lands on its end value at once', async ({ page }) => {
        await mountCase(page, 'button-background-target');
        await page.evaluate(() => window.__setState('input_select.demo_mode', 'Heat'));
        await expect.poll(() => effectValue(page, 'speed'), { timeout: 400 }).toBe(8);
        await expectNoErrors(page);
    });
});

test('setConfig rebuilds the background when background_animation changes, and keeps it otherwise', async ({ page }) => {
    await mountCase(page, 'button-background');
    const card = () => page.evaluate(() => {
        const c = /** @type {any} */ (document.querySelector('#mount > *'));
        const e = c._backgroundRenderer?.getHandles()[0]?.effects[0];
        return { effect: e?.constructor.name ?? null, layers: c.shadowRoot.querySelectorAll('.button-container > div > canvas').length };
    });
    await expect.poll(card).toEqual({ effect: 'GridGLEffect', layers: 1 });
    const mark = () => page.evaluate(() => { /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.__mark = 1; });
    const marked = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer?.__mark === 1);
    const base = { type: 'custom:lcards-button', entity: 'light.demo', preset: 'lozenge' };
    const grid = [{ preset: 'grid', config: { color: 'var(--lcards-orange)' } }];

    await mark();
    await page.evaluate((c) => window.__reconfigure(c), { ...base, background_animation: grid, text: { name: { content: 'Other' } } });
    await page.waitForTimeout(200);
    expect(await marked(), 'unrelated change keeps the running background').toBe(true);

    await page.evaluate((c) => window.__reconfigure(c), { ...base, background_animation: [{ preset: 'starfield' }] });
    await expect.poll(card).toEqual({ effect: 'StarfieldEffect', layers: 1 });

    await page.evaluate((c) => window.__reconfigure(c), base);
    await expect.poll(card).toEqual({ effect: null, layers: 0 });

    await page.evaluate((c) => window.__reconfigure(c), { ...base, background_animation: grid });
    await expect.poll(card).toEqual({ effect: 'GridGLEffect', layers: 1 });
    await expectNoErrors(page);
});

test('the canvas buffer follows the card when it changes size (no squashed background)', async ({ page }) => {
    await mountCase(page, 'button-background', { width: '400' });
    const size = () => page.evaluate(() => {
        const c = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.canvas;
        const r = c.getBoundingClientRect();
        return { buffer: c.width, shown: Math.round(r.width), bufferH: c.height, shownH: Math.round(r.height) };
    });
    await expect.poll(async () => { const s = await size(); return s.buffer === s.shown && s.bufferH === s.shownH; }).toBe(true);
    for (const width of ['250px', '520px']) {
        await page.evaluate((w) => { /** @type {HTMLElement} */ (document.querySelector('#mount')).style.width = w; }, width);
        await expect.poll(async () => { const s = await size(); return s.buffer === s.shown && s.bufferH === s.shownH; }, { message: width }).toBe(true);
    }
    await expectNoErrors(page);
});
