/**
 * Recordings (<video class="doc-video">, the dashboard gallery and card pages) open
 * large in the lightbox on a click, with the browser's controls (fullscreen, pause,
 * seek), and stop when it closes (doc/.vitepress/theme/index.ts openVideoLightbox).
 */
import { test, expect } from './support.js';

test('a gallery video opens large with controls and stops on close', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/getting-started/dashboard-gallery#picard-display-over-controls');
    const video = page.locator('video.doc-video[src$="picard-display.webm"]');
    await expect(video).toHaveCSS('cursor', 'zoom-in');
    await video.click();
    const dialog = page.locator('dialog.mz-svg-lightbox.is-video');
    await expect(dialog).toBeVisible();
    const big = dialog.locator('video');
    await expect(big).toHaveAttribute('src', /picard-display\.webm$/);
    expect(await big.evaluate(v => /** @type {HTMLVideoElement} */ (v).controls)).toBe(true);
    // larger than the page's own video
    const [small, large] = [await video.boundingBox(), await big.boundingBox()];
    expect(large?.width ?? 0).toBeGreaterThan((small?.width ?? 0) * 1.2);
    await page.screenshot({ path: test.info().outputPath('video-lightbox.png') });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('dialog.mz-svg-lightbox video')).toHaveCount(0);
});
