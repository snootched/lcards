/**
 * A wormhole whose power follows a light's brightness (0 to 255): while the light is off it has
 * no brightness, and every setting the starter wrote takes its `default` (the wormhole closed),
 * not the object's own default (the gas, glows and shaft at full size: blown out).
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

const values = (page) => page.evaluate(() => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    return Object.fromEntries([...card._settingValues.entries()]);
});

test('a light that is off closes the wormhole; on at full brightness opens it', async ({ page }) => {
    await mountCase(page, 'astro-wormhole-light', { width: '800' });
    await expect.poll(async () => Object.keys(await values(page)).length, { timeout: 15_000 }).toBeGreaterThan(20);
    await page.evaluate(() => window.__setState('light.demo', { state: 'off', attributes: { friendly_name: 'Demo', brightness: null } }));
    await expect.poll(async () => (await values(page))['object:wormhole_gas:radius']).toBe(2.126);
    const off = await values(page);
    // every setting has a number: none is left to its object's default
    for (const [k, v] of Object.entries(off)) expect(v, k).not.toBeNull();
    expect(off['object:wormhole_gas:opacity']).toBe(0);
    expect(off['object:wormhole_light_16:opacity']).toBe(0);
    expect(off['object:wormhole_funnel:well.morph']).toBe(1);
    await page.locator('#mount').screenshot({ path: process.env.CARD_SHOT ?? 'tmp/astro-wormhole-light-off.png' });
    await page.evaluate(() => window.__setState('light.demo', { state: 'on', attributes: { friendly_name: 'Demo', brightness: 255 } }));
    await expect.poll(async () => (await values(page))['object:wormhole_gas:radius']).toBe(14.175);
    expect((await values(page))['object:wormhole_funnel:well.morph']).toBe(0);
    expect(await cardErrors(page)).toEqual([]);
});
