/**
 * An MSD detached and re-attached while its pipeline is still initialising (Home
 * Assistant does this while it builds a view, #409) finishes and shows, instead
 * of sticking on "Initializing MSD...": the reconnect used to wait on the load
 * the disconnect had made stale, which could never reveal the card.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

test('an MSD moved during its initialisation still finishes and shows', async ({ page }) => {
    await mountCase(page, 'msd-palette', { width: '600', height: '400' });
    await page.waitForFunction(() => document.querySelector('lcards-msd-card')?._msdRevealed === true, null, { timeout: 20_000 });

    await page.evaluate(async () => {
        const card = /** @type {any} */ (document.querySelector('lcards-msd-card'));
        const parent = card.parentNode;
        // a reconnect starts a load; move the card again while that load runs
        card.remove();
        parent.appendChild(card);
        await new Promise((resolve) => setTimeout(resolve, 0));
        card.remove();
        parent.appendChild(card);
    });

    await page.waitForFunction(() => {
        const card = /** @type {any} */ (document.querySelector('lcards-msd-card'));
        return card?._msdRevealed === true && !!card._msdPipeline;
    }, null, { timeout: 20_000 });
    await expect(page.locator('lcards-msd-card').getByText('Initializing MSD')).toHaveCount(0);
    await expectNoErrors(page);
});
