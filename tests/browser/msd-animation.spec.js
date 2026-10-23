/**
 * base_svg.animations on two MSD cards in one view: each card's animations keep
 * running. Both used to register the same AnimationManager scope id, so whichever
 * card registered last tore the other one's down (which one won depended on load order).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Running instances per base-SVG scope. */
const baseScopes = (page) => page.evaluate(() => {
    const out = [];
    window.lcards.core.animationManager.scopes.forEach((s, id) => {
        if (id.startsWith('__msd_base_svg')) out.push([...s.runningInstances.values()].flat().filter(i => !i.completed).length);
    });
    return out;
});

test('two MSD cards each keep their base_svg animation', async ({ page }) => {
    await mountCase(page, 'msd-base-animation');
    await expect.poll(() => baseScopes(page), { timeout: 10_000 }).toEqual([1]);
    await page.evaluate(async () => {
        const config = JSON.parse(JSON.stringify(window.__card.config));
        config.msd.base_svg.source = 'builtin:ncc-1701-kelvin';
        config.msd.base_svg.animations[0].target = '#rect4827';
        await window.__mountExtra(config);
    });
    await expect.poll(() => baseScopes(page), { timeout: 10_000 }).toEqual([1, 1]);
    await expectNoErrors(page);
});
