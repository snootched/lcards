/**
 * Background effect parameters (C1): `target: background` animations, entity
 * bindings that glide, reduced motion, the alert-mode rebuild and layer order.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** A field of the first effect of background entry `index` */
const effectValue = (page, field, index = 0) => page.evaluate(([f, i]) => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const effect = card?._backgroundRenderer?.getHandles(i)[0]?.effects[0];
    return effect ? effect[f] : null;
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

test('the animation carries on across an alert-mode rebuild of the effects', async ({ page }) => {
    await mountCase(page, 'button-background-target');
    await expect.poll(() => effectValue(page, 'speed')).toBe(1);
    const firstEffect = await page.evaluateHandle(() => /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles()[0].effects[0]);
    await page.evaluate(() => window.__setState('input_select.demo_mode', 'Heat'));
    await expect.poll(() => effectValue(page, 'speed'), { timeout: 1500 }).toBeGreaterThan(1.5);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('red_alert'));
    await expect.poll(() => page.evaluate((old) => /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles()[0].effects[0] !== old, firstEffect), { timeout: 3000 }).toBe(true);
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
