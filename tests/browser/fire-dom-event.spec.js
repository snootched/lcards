/**
 * #407: a button's tap_action fire-dom-event fires Home Assistant's ll-custom
 * event with the whole action config, bubbling out of the card, so Local
 * Conditional Card and browser_mod (which listen on the page) receive it.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

test('tap_action fire-dom-event reaches the page as ll-custom with the payload', async ({ page }) => {
    const card = await mountCase(page, 'button-fire-dom-event');
    await page.evaluate(() => {
        window.__llCustom = [];
        document.addEventListener('ll-custom', (ev) => window.__llCustom.push(ev.detail));
    });
    await card.click();
    await expect.poll(() => page.evaluate(() => window.__llCustom.length)).toBe(1);
    expect(await page.evaluate(() => window.__llCustom[0])).toEqual({
        action: 'fire-dom-event',
        local_conditional_card: { action: 'set', ids: [{ test_daily: 'hide' }, { test_hourly: 'show' }] },
    });
    await expectNoErrors(page);
});
