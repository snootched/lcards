/**
 * Data grid fixes from the D2 docs audit (2026-11-07). The cascade leaves the
 * cells' colour to its tween; under reduced motion it doesn't run, so the cells
 * must keep their own colour (they fell back to the inherited text colour).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const cellColours = (page) => page.evaluate(() => {
    const grid = document.querySelector('lcards-data-grid');
    return [...grid.shadowRoot.querySelectorAll('.grid-cell')].slice(0, 3).map((c) => getComputedStyle(c).color);
});

test('under reduced motion a cascade grid keeps its cells\' own colour', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mountCase(page, 'data-grid-cascade', { width: '400' });
    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-data-grid', data_mode: 'decorative', format: 'mixed',
        grid: { 'grid-template-rows': 'repeat(3, auto)', 'grid-template-columns': 'repeat(4, minmax(60px, 1fr))' },
        style: { color: 'rgb(0, 200, 0)' },
        animations: [{ preset: 'cascade-color', params: { colors: ['rgb(255, 0, 0)', 'rgb(0, 0, 255)', 'rgb(255, 255, 0)'] } }],
    }));
    await expect.poll(() => cellColours(page)).toEqual(['rgb(0, 200, 0)', 'rgb(0, 200, 0)', 'rgb(0, 200, 0)']);
    // motion allowed again: the cascade takes the colours back
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(async () => (await cellColours(page)).some((c) => c !== 'rgb(0, 200, 0)'), { timeout: 8000 }).toBe(true);
    await expectNoErrors(page);
});
