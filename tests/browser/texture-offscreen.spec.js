/**
 * A shape texture pauses while its card is off screen and resumes when it is back,
 * as background animations do (2026-11-17: it kept drawing at 30 fps off screen).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

test('a shape texture pauses off screen and resumes on screen', async ({ page }) => {
    await mountCase(page, 'button-texture-pulse', { width: '300', height: '60' });
    const state = () => page.evaluate(() => {
        const r = /** @type {any} */ (window).__card._canvasTextureRenderer?._renderer;
        return r ? { running: r._isRunning, suspended: r._isSuspended } : null;
    });
    await expect.poll(state).toEqual({ running: true, suspended: false });
    await page.evaluate(() => { /** @type {any} */ (window).__card.style.transform = 'translateY(5000px)'; });
    await expect.poll(state).toEqual({ running: true, suspended: true });
    await page.evaluate(() => { /** @type {any} */ (window).__card.style.transform = ''; });
    await expect.poll(state).toEqual({ running: true, suspended: false });
    await expectNoErrors(page);
});
