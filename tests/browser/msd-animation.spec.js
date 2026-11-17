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

// 2026-11-17: removing an MSD left its animation scopes in the shared
// AnimationManager (the detached SVG, a TriggerManager with entity subscriptions,
// loops still running); each new card element (every dashboard edit) added more.
test('a removed MSD tears its animation scopes down; mounted again, they come back', async ({ page }) => {
    await mountCase(page, 'msd-animation-scopes');
    /** The card's scope ids: the guid-suffixed ones, and overlay ids whose element is in the card. */
    const ownScopes = () => page.evaluate(() => {
        const card = /** @type {any} */ (window).__card;
        const out = [];
        window.lcards.core.animationManager.scopes.forEach((s, id) => {
            if (id.endsWith(`:${card._msdInstanceGuid}`) || s.element?.getRootNode() === card.shadowRoot) out.push(id);
        });
        return out.sort();
    });
    const live = (/** @type {string[]} */ ids) => page.evaluate((ids) => ids.filter((id) => window.lcards.core.animationManager.scopes.has(id)), ids);
    await expect.poll(async () => (await ownScopes()).map((id) => id.replace(/:.*/, '')), { timeout: 10_000 })
        .toEqual(['__msd_animations', '__msd_base_svg', 'conduit_upper']);
    const ids = await ownScopes();
    await page.evaluate(() => { const c = /** @type {any} */ (window).__card; /** @type {any} */ (window).__parent = c.parentElement; c.remove(); });
    await expect.poll(() => live(ids)).toEqual([]);
    await page.evaluate(() => { /** @type {any} */ (window).__parent.appendChild(/** @type {any} */ (window).__card); });
    await expect.poll(async () => (await ownScopes()).map((id) => id.replace(/:.*/, '')), { timeout: 10_000 })
        .toEqual(['__msd_animations', '__msd_base_svg', 'conduit_upper']);
    await expectNoErrors(page);
});
