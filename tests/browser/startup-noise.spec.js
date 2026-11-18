/**
 * Startup log noise (HA-LCARS feedback from a Fire HD 8 kiosk, 2026-11-18): every
 * page load logged 10 to 30 "[LCARdSSlider] No component renderer available":
 * each render before the slider's component had loaded warned (the loading check
 * covered only a component set in the config, not one a preset sets).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

for (const name of ['slider-shaped', 'slider-picard-column', 'slider-pills', 'slider-gauge']) {
    test(`${name}: no "No component renderer" warnings while it loads, and it draws`, async ({ page }) => {
        /** @type {string[]} */
        const warnings = [];
        page.on('console', (m) => { if (m.type() === 'warning' && m.text().includes('No component renderer')) warnings.push(m.text()); });
        await mountCase(page, name, { width: '300', height: '300' });
        await expect.poll(() => page.evaluate(() => !!(/** @type {any} */ (window).__card.shadowRoot.querySelector('svg'))), { timeout: 5000 }).toBe(true);
        await page.waitForTimeout(500);
        expect(warnings).toEqual([]);
        expect(await page.evaluate(() => /** @type {any} */ (window).__card.shadowRoot.textContent.includes('Component not loaded'))).toBe(false);
        await expectNoErrors(page);
    });
}
