/**
 * MSD line and shape colours follow a theme on the card's view or section (found in the
 * LCARS samples rollout, 2026-11-11: classic-bracket's lines took the page root's colours).
 * The pipeline's first render ran before the card handed itself to the coordinator, so
 * colours were made concrete against <html>; plain colours are never resolved again.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const VIEW_THEME = { '--lcars-ui-quaternary': '#774477', '--lcars-ui-tertiary': '#cc6666' };

/** @param {import('@playwright/test').Page} page @param {string} sel @param {string} name */
const attr = (page, sel, name) => page.evaluate(([s, n]) => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    return card?.renderRoot?.querySelector(s)?.getAttribute(n) ?? null;
}, [sel, name]);

test('MSD line and shape colours resolve against a themed view on the first render', async ({ page }) => {
    await mountCase(page, 'msd-theme-lines', { width: '800', vars: JSON.stringify(VIEW_THEME) });
    await expect.poll(() => attr(page, '#line_a .line-path', 'stroke'), { timeout: 10000 }).not.toBeNull();

    expect(await attr(page, '#line_a .line-path', 'stroke')).toBe('#774477');   // theme: token
    expect(await attr(page, '#line_b .line-path', 'stroke')).toBe('#cc6666');   // var()
    expect(await attr(page, '#shape_a .shape-path', 'stroke')).toBe('#cc6666');
    expect(await attr(page, '#shape_a .shape-path', 'fill')).toBe('#774477');
    await expectNoErrors(page);
});
