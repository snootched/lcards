/**
 * Borg assimilation intro (F1): the default `renderer: auto` draws on WebGL2 in
 * its worker and moves; `renderer: canvas` plays the classic Canvas2D intro;
 * without WebGL2 on the page the classic one plays. Headless Chromium has
 * WebGL2 through SwiftShader. Reduced motion is covered in reduced-motion.spec.js.
 *
 * BORG_SHOTS=<dir> saves a screenshot of each case (for a look, not compared).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const SHOTS = process.env.BORG_SHOTS;

/**
 * Play the effect and wait for its canvas.
 * @param {import('@playwright/test').Page} page
 * @param {Object} params
 */
async function play(page, params = {}) {
    await mountCase(page, 'button-on-show');
    await page.evaluate((p) => {
        window.lcards.core.screenEffectManager.play('borg-assimilation', { duration: 30000, siteCount: 4, seed: 7, ...p });
    }, params);
    const canvas = page.locator('canvas[data-lcards-renderer]');
    await expect(canvas).toHaveCount(1);
    return canvas;
}

/** @param {import('@playwright/test').Page} page @param {string} name */
async function shot(page, name) {
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

test('the default draws on WebGL in its worker, and moves', async ({ page }) => {
    const blank = await (async () => { await mountCase(page, 'button-on-show'); return page.screenshot(); })();
    const canvas = await play(page);
    await expect(canvas).toHaveAttribute('data-lcards-renderer', 'webgl');
    await expect(canvas).toHaveAttribute('data-lcards-ready', 'true');
    await page.waitForTimeout(7000);
    const first = await page.screenshot();
    await shot(page, 'webgl-7s');
    await page.waitForTimeout(700);
    const second = await page.screenshot();
    expect(first.equals(blank), 'something is drawn').toBe(false);
    expect(first.equals(second), 'frames differ').toBe(false);
    if (SHOTS) {
        await page.waitForTimeout(6000);
        await shot(page, 'webgl-14s');
    }
    await expectNoErrors(page);
});

test('renderer: canvas plays the classic intro', async ({ page }) => {
    const canvas = await play(page, { renderer: 'canvas' });
    await expect(canvas).toHaveAttribute('data-lcards-renderer', 'canvas');
    await expect(canvas).toHaveCSS('mix-blend-mode', 'multiply');
    await page.waitForTimeout(SHOTS ? 7000 : 300);
    await shot(page, 'classic-7s');
    await expectNoErrors(page);
});

test('without WebGL2 the classic intro plays', async ({ page }) => {
    await page.addInitScript(() => {
        const get = HTMLCanvasElement.prototype.getContext;
        // @ts-expect-error -- test stub: no webgl2 on the page
        HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
            return type === 'webgl2' ? null : get.call(this, type, ...rest);
        };
    });
    const canvas = await play(page);
    await expect(canvas).toHaveAttribute('data-lcards-renderer', 'canvas');
    await expectNoErrors(page);
});

test('cube, corruption and overrun can be turned off', async ({ page }) => {
    const canvas = await play(page, { cube: false, corruption: 0, overrun: 0 });
    await expect(canvas).toHaveAttribute('data-lcards-ready', 'true');
    await page.waitForTimeout(SHOTS ? 9000 : 300);
    await shot(page, 'webgl-plain-9s');
    await expectNoErrors(page);
});

test('cubeStyle: the detailed cube (default) and the classic wireframe both draw, and differ', async ({ page }) => {
    // The cube is fully in about 11 s after the start; seeded, so both runs share the layout
    test.setTimeout(60_000);
    const centre = async () => page.screenshot({ clip: { x: 300, y: 200, width: 200, height: 200 } });
    const canvas = await play(page);
    await expect(canvas).toHaveAttribute('data-lcards-ready', 'true');
    await page.waitForTimeout(12_000);
    const detailed = await centre();
    await shot(page, 'cube-detailed-12s');
    if (SHOTS) for (const s of [6, 12]) { await page.waitForTimeout(6000); await shot(page, `cube-detailed-${12 + s}s`); }
    await expectNoErrors(page);

    const classicCanvas = await play(page, { cubeStyle: 'classic' });
    await expect(classicCanvas).toHaveAttribute('data-lcards-ready', 'true');
    await page.waitForTimeout(12_000);
    const classic = await centre();
    await shot(page, 'cube-classic-12s');
    expect(detailed.equals(classic), 'the styles differ').toBe(false);
    await expectNoErrors(page);
});
