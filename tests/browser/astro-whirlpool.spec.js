/**
 * F2 whirlpool (fixture astro-whirlpool.yaml): a volume nebula with shape: whirlpool
 * builds and draws gas (a bright middle, darker toward the rim).
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

test('a whirlpool nebula draws a swirl of gas, brightest at its middle', async ({ page }) => {
    await mountCase(page, 'astro-whirlpool', { width: '800' });
    await expect.poll(() => page.evaluate(() => {
        const s = /** @type {any} */ (document.querySelector('#mount > *'))?._scene?.debug();
        return !!(s?.ready && s.frames > 2 && s.world.objects.get('swirl'));
    }), { timeout: 15_000 }).toBe(true);
    await page.waitForTimeout(1500);
    const shot = await page.locator('#mount').screenshot({ path: process.env.SWIRL_SHOT ?? 'tmp/astro-whirlpool.png' });
    // brightness at the middle and toward the rim (the canvas, read back as an image)
    const lum = await page.evaluate(async (b64) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        const g = /** @type {CanvasRenderingContext2D} */ (c.getContext('2d'));
        g.drawImage(img, 0, 0);
        // a 36 px patch: the core is mottled gas turning 20 degrees a second, and a
        // 6 px patch read 54 to 65 depending on which wisp was at the centre that
        // instant (flaky, 2026-11-19); 36 px reads a steady 97-99
        const at = (fx, fy) => { const d = g.getImageData(Math.round(img.width * fx) - 18, Math.round(img.height * fy) - 18, 36, 36).data; let s = 0; for (let i = 0; i < d.length; i += 4) s += d[i] + d[i + 1] + d[i + 2]; return s / (d.length / 4) / 3; };
        return { middle: at(0.5, 0.5), corner: at(0.05, 0.05) };
    }, shot.toString('base64'));
    expect(lum.middle).toBeGreaterThan(60);
    expect(lum.middle).toBeGreaterThan(lum.corner * 3);
    expect(await cardErrors(page)).toEqual([]);
});
