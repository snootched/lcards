/**
 * three.js background tier (C2): warp-starfield and grid-floor render through
 * the page's one shared WebGL context into the card's Canvas2D canvas,
 * animate through the EffectHandle, keep their scene across an alert change,
 * hold a frame under reduced motion, release the context, and fall back to
 * Canvas2D without WebGL or after a context loss.
 * Headless Chromium has WebGL2 through SwiftShader.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors, cardErrors } from './support.js';

/** What each background entry is drawn with, and whether its scene is up */
const entries = (page) => page.evaluate(() => {
    const bg = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer;
    return bg.renderer.effects.map((e) => ({ type: e.constructor.name, ready: e._scene ? true : e._scene === null ? false : undefined }));
});

/** Pixels on the background canvas that are not fully transparent */
const litPixels = (page) => page.evaluate(() => {
    const canvas = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.canvas;
    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    for (let i = 3; i < data.length; i += 4) if (data[i] > 0) lit++;
    return lit;
});

const effectField = (page, field) => page.evaluate((f) =>
    /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0]?.effects[0]?.[f], field);

const webglStats = (page) => page.evaluate(() => window.lcards.debug.webgl.stats());

test('warp-starfield loads its scene on the shared context and draws into the card canvas', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    await expect.poll(() => litPixels(page)).toBeGreaterThan(20);
    expect(await webglStats(page)).toMatchObject({ users: 1, context: true, created: 1 });
    await expectNoErrors(page);
});

test('target: background ramps warp speed through the handle', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    expect(await effectField(page, 'speed')).toBe(1);
    await page.evaluate(() => window.__setState('input_select.demo_mode', 'Heat'));
    await expect.poll(() => effectField(page, 'speed'), { timeout: 1500 }).toBeGreaterThan(1.5);
    expect(await effectField(page, 'speed'), 'mid-ramp').toBeLessThan(8);
    await expect.poll(() => effectField(page, 'speed'), { timeout: 3000 }).toBe(8);
    await expectNoErrors(page);
});

test('an alert change recolours the scene in place: same effect, same scene, same context (F1)', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    const before = await page.evaluateHandle(() => {
        const e = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0].effects[0];
        return { effect: e, scene: e._scene };
    });
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('red_alert'));
    await page.waitForTimeout(500);
    expect(await page.evaluate((old) => {
        const e = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.getHandles(0)[0].effects[0];
        return { effect: e === old.effect, scene: e._scene === old.scene };
    }, before)).toEqual({ effect: true, scene: true });
    expect(await webglStats(page)).toMatchObject({ users: 1, created: 1 });
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('green_alert'));
    await expectNoErrors(page);
});

test('a warp ramp started just before the alert re-render runs to the end (to_state / from_state on the alert entity)', async ({ page }) => {
    // What lcards.red_alert does: the alert helper changes, then the palette.
    // The re-render used to replay check_on_load (restarting the ramp and firing
    // the from_state ramp-down, which cancelled it), so warp lasted a moment.
    await mountCase(page, 'elbow-warp-alert', { height: '300' });
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    await page.evaluate(() => window.__setState('input_select.lcards_alert_mode', 'green_alert'));
    await page.waitForTimeout(300);
    await page.evaluate(() => window.__setState('input_select.lcards_alert_mode', 'red_alert'));
    await page.waitForTimeout(100);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('red_alert'));
    await expect.poll(() => effectField(page, 'speed'), { timeout: 4000 }).toBe(8);
    await page.waitForTimeout(1000);
    expect(await effectField(page, 'speed'), 'still at warp').toBe(8);
    await page.evaluate(() => window.__setState('input_select.lcards_alert_mode', 'green_alert'));
    await expect.poll(() => effectField(page, 'speed'), { timeout: 5000 }).toBe(1);
    await page.evaluate(() => window.lcards.core.themeManager.setAlertMode('green_alert'));
});

test('a mixed stack keeps entry order and shares one context between two scenes', async ({ page }) => {
    await mountCase(page, 'button-webgl-stack');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([
        { type: 'GridFloorEffect', ready: true },
        { type: 'SolidEffect', ready: undefined },
        { type: 'WarpStarfieldEffect', ready: true }
    ]);
    expect(await webglStats(page)).toMatchObject({ users: 2, context: true, created: 1 });
    await expectNoErrors(page);
});

test('10 remove/re-add cycles (view switches): the context is given back each time, never two alive', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    for (let i = 0; i < 10; i++) {
        await page.evaluate(() => { window.__parked = document.querySelector('#mount > *'); window.__parked.remove(); });
        await expect.poll(() => webglStats(page)).toMatchObject({ users: 0, context: false });
        await page.evaluate(() => document.querySelector('#mount').appendChild(window.__parked));
        await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
        expect(await webglStats(page)).toMatchObject({ users: 1, context: true });
    }
    expect((await webglStats(page)).created).toBe(11);
    // Lifecycle, not frame time: under a loaded CPU the SwiftShader first frames
    // can trip the 500 ms frame-budget guard, which is working as designed
    expect((await cardErrors(page)).filter((e) => !/Frame took \d+ms/.test(e))).toEqual([]);
});

test('a lost context swaps the entry for its Canvas2D fallback', async ({ page }) => {
    await mountCase(page, 'button-warp-starfield');
    await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
    await page.evaluate(() => window.lcards.debug.webgl.loseContext());
    await expect.poll(() => entries(page)).toEqual([{ type: 'StarfieldEffect', ready: undefined }]);
    // The handle still drives it: the warp animation lands on the fallback
    await page.evaluate(() => window.__setState('input_select.demo_mode', 'Heat'));
    await expect.poll(() => effectField(page, 'speed'), { timeout: 3000 }).toBe(8);
});

test.describe('no WebGL', () => {
    test.beforeEach(async ({ page }) => {
        await page.addInitScript(() => { delete (/** @type {any} */ (window)).WebGL2RenderingContext; });
    });

    test('warp-starfield draws the plain starfield with the same config', async ({ page }) => {
        await mountCase(page, 'button-warp-starfield');
        await expect.poll(() => entries(page)).toEqual([{ type: 'StarfieldEffect', ready: undefined }]);
        expect(await effectField(page, 'count')).toBe(400);
        await expect.poll(() => litPixels(page)).toBeGreaterThan(20);
        await expectNoErrors(page);
    });
});

test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the held frame shows the scene once it has loaded', async ({ page }) => {
        await mountCase(page, 'button-warp-starfield');
        await expect.poll(() => entries(page), { timeout: 10_000 }).toEqual([{ type: 'WarpStarfieldEffect', ready: true }]);
        await expect.poll(() => litPixels(page)).toBeGreaterThan(5);
        const clock = await effectField(page, '_elapsedTime');
        await page.waitForTimeout(500);
        expect(await effectField(page, '_elapsedTime'), 'no motion while held').toBe(clock);
        await expectNoErrors(page);
    });
});
