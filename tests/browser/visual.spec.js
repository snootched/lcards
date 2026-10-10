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
