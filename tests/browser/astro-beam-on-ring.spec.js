/**
 * A beam to a point on a spinning ring follows the point (G1, the radar scope's sweep). Rings
 * were built in the same pass as beams and registered as hosts after it, so the beam never
 * learnt its end moved; and a ring whose spin follows an entity counted as still if it was
 * built at 0.
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

/** A beam's far end as drawn (its first line's last vertex), rounded */
const tip = (page, id) => page.evaluate((bid) => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const abs = card._scene.debug().world.objects.get(bid)?.lines?.[0]?._abs;
    return abs ? Array.from(abs.slice(-3)).map((v) => Math.round(v)) : null;
}, id);

test('a beam to a point on a spinning ring follows it, also when the spin follows an entity from 0', async ({ page }) => {
    await mountCase(page, 'astro-beam-on-ring', { width: '600' });
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '0'));
    await expect.poll(() => tip(page, 'fixed_beam'), { timeout: 15_000 }).not.toBeNull();
    const a = await tip(page, 'fixed_beam');
    await expect.poll(() => tip(page, 'fixed_beam')).not.toEqual(a);
    // the bound ring holds still at 0, then turns once its entity says so, and its beam follows
    const b0 = await tip(page, 'bound_beam');
    await page.waitForTimeout(500);
    expect(await tip(page, 'bound_beam')).toEqual(b0);
    await page.evaluate(() => window.__setState('input_number.lcards_test_power', '100'));
    await expect.poll(() => tip(page, 'bound_beam')).not.toEqual(b0);
    expect(await cardErrors(page)).toEqual([]);
});
