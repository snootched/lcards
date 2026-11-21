/**
 * The Picard column's indicator lights run their CSS pulse (keyframes
 * lcards-slider-pulse in the slider's styles; SVG <animate> before 2026-11-17),
 * and stand still under reduced motion.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** The lights' running animations and their opacity. */
const lights = (page) => page.evaluate(() => {
    const slider = /** @type {any} */ (document.querySelector('lcards-slider'));
    const rects = [...slider.shadowRoot.querySelectorAll('rect')].filter((r) => r.style.animationName);
    return {
        count: rects.length,
        running: rects.filter((r) => r.getAnimations().some((a) => a.playState === 'running')).length,
        smil: slider.shadowRoot.querySelectorAll('animate').length,
    };
});

test('the Picard column lights pulse with a CSS animation', async ({ page }) => {
    await mountCase(page, 'slider-picard-column');
    await expect.poll(() => lights(page)).toEqual({ count: 3, running: 3, smil: 0 });
    await expectNoErrors(page);
});

test('the lights stand still under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mountCase(page, 'slider-picard-column');
    await page.waitForTimeout(300);
    expect(await lights(page)).toEqual({ count: 0, running: 0, smil: 0 });
});
