/**
 * The Static and Pixelate screen effects keep moving, and hold one frame under
 * reduced motion. Since 2026-11-17 Static copies a random window of noise made
 * once (it made 100,000 random pixels every frame) and Pixelate draws one pixel
 * per block for CSS to scale (it made one fillRect per block); about 8 and 11
 * times less main thread at a quarter CPU speed, and they look the same.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** The effect canvas's pixels, hashed, and its buffer size. */
const frame = (page) => page.evaluate(() => {
    const c = /** @type {HTMLCanvasElement} */ (document.querySelector('[data-lcards-se-slot="canvas"]'));
    const d = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d')).getImageData(0, 0, c.width, c.height).data;
    let h = 0;
    for (let i = 0; i < d.length; i += 97) h = (h * 31 + d[i]) | 0;
    return { hash: h, size: `${c.width}x${c.height}`, shown: getComputedStyle(c).display !== 'none' };
});

const apply = (page, name) => page.evaluate((name) => window.lcards.core.screenEffectManager.apply(name, {}), name);

for (const name of ['static', 'pixelate']) {
    test(`${name} keeps changing, at the low-resolution buffer size`, async ({ page }) => {
        await page.setViewportSize({ width: 800, height: 600 });
        await mountCase(page, 'button-lozenge');
        await apply(page, name);
        await page.waitForTimeout(400);
        const a = await frame(page);
        await page.waitForTimeout(400);
        const b = await frame(page);
        expect(a.shown).toBe(true);
        expect(b.hash).not.toBe(a.hash);
        // static: 4 px per noise pixel; pixelate: one pixel per 8 px block (rounded up)
        expect(a.size).toBe(name === 'static' ? '200x150' : '100x75');
        await expectNoErrors(page);
    });

    test(`${name} holds one frame under reduced motion`, async ({ page }) => {
        await page.setViewportSize({ width: 800, height: 600 });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await mountCase(page, 'button-lozenge');
        await apply(page, name);
        await page.waitForTimeout(400);
        const a = await frame(page);
        await page.waitForTimeout(400);
        expect((await frame(page)).hash).toBe(a.hash);
    });
}
