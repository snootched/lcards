/**
 * Layer B: screenshot baselines for canonical cards. Local only (fonts render
 * differently across machines). Refresh after an intended visual change with:
 *   npm run test:visual -- --update-snapshots
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const FIXED_NOW = new Date('2026-10-09T12:00:00Z');

/** [fixture, harness params] */
const CASES = [
    ['button-lozenge', {}],
    ['button-picard', {}],
    ['button-bar-label', {}],
    ['button-more-info', {}],
    ['elbow-header-left', {}],
    ['elbow-segmented', {}],
    ['slider-pills', {}],
    ['slider-gauge', {}],
    ['slider-ring', { width: '260', height: '260' }],
    ['slider-picard-ring', { width: '260', height: '260' }],
    ['chart-area', { height: '300' }],
    ['data-grid-data', {}],
    ['data-grid-decorative', {}],
    ['msd-channel', {}],
];

for (const [name, params] of CASES) {
    test(`visual: ${name}`, async ({ page }) => {
        // Charts also need a fixed clock for their time axis. Only for charts: a
        // frozen clock elsewhere also freezes JS fade-ins at opacity 0.
        if (name.startsWith('chart-')) await page.clock.setFixedTime(FIXED_NOW);
        // now= pins sample entity values (they follow the time of day); seed= pins
        // generated values (decorative grids), reseeded just before the card mounts.
        await mountCase(page, name, { freeze: '1', now: String(FIXED_NOW.getTime()), seed: '1', ...params });
        if (name.startsWith('chart-')) await expect(page.locator('lcards-chart .apexcharts-canvas')).toBeVisible();
        await expectNoErrors(page);
        await expect(page.locator('#mount')).toHaveScreenshot(`${name}.png`);
    });
}

// The zoom wrapper over the WebGL grid (C5): the background canvas at a pinned
// zoom time (the button face would cover it in a card screenshot)
test('visual: grid + zoom on WebGL (background canvas)', async ({ page }) => {
    await mountCase(page, 'button-webgl-grid-zoom', { freeze: '1', width: '520' });
    await expect.poll(() => page.evaluate(() => {
        const z = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer.renderer.effects[0];
        return !!z?.baseEffect?._scene;
    }), { timeout: 10_000 }).toBe(true);
    const png = await page.evaluate(() => {
        const bg = /** @type {any} */ (document.querySelector('#mount > *'))._backgroundRenderer;
        bg.renderer.stop();
        bg.renderer.effects[0]._elapsedTime = 3;
        bg.renderer._drawEffects(0);
        const out = document.createElement('canvas');
        out.width = bg.canvas.width;
        out.height = bg.canvas.height;
        const ctx = /** @type {CanvasRenderingContext2D} */ (out.getContext('2d'));
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(bg.canvas, 0, 0);
        return out.toDataURL('image/png').split(',')[1];
    });
    await expectNoErrors(page);
    expect(Buffer.from(png, 'base64')).toMatchSnapshot('grid-zoom-webgl.png');
});

// Astrometrics (E2b): the galaxy reference under reduced motion (the planet's
// spin held, so the frame is still), the sector map, the labels, and a
// volume nebula round a planet (half-resolution march, solid depth), the nebula shapes (NB1), the Badlands presets (NB2c). The
// scene draws on demand: wait until it is built and has stopped drawing.
for (const name of ['astro-galaxy', 'astro-sector', 'astro-labels', 'astro-nebula-volume', 'astro-nebula-shapes', 'astro-badlands', 'astro-nexus', 'astro-crystalline']) {
    test(`visual: ${name}`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await mountCase(page, name, { freeze: '1', width: '800' });
        const frames = () => page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene?.debug().frames ?? 0);
        await expect.poll(async () => (await frames()) > 0, { timeout: 15_000 }).toBe(true);
        await expect.poll(async () => {
            const a = await frames();
            await page.waitForTimeout(300);
            return (await frames()) === a;
        }, { timeout: 10_000 }).toBe(true);
        await expectNoErrors(page);
        await expect(page.locator('#mount')).toHaveScreenshot(`${name}.png`);
    });
}
