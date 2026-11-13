/**
 * Settings by state: an astrometrics number that follows an entity takes the state colour
 * keys with numbers. A matching state wins (exact, range, then the card's active / inactive),
 * then the range mapping, then default; with no state keys, an active entity (playing) is the
 * high end of input.
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

const value = (page, key) => page.evaluate((k) => /** @type {any} */ (document.querySelector('#mount > *'))._settingValues.get(k), key);

test('a value per state, the classified active / inactive, a range key and the range', async ({ page }) => {
    await mountCase(page, 'astro-state-settings', { width: '800' });
    await page.evaluate(() => {
        window.__setState('input_boolean.lcards_test_toggle', 'on');
        window.__setState('input_select.lcards_test_mode', 'beta');
        window.__setState('media_player.tv', { state: 'playing', attributes: { friendly_name: 'TV' } });
        window.__setState('sensor.cpu', { state: '90', attributes: { friendly_name: 'CPU' } });
    });
    await expect.poll(() => value(page, 'object:bubble:opacity'), { timeout: 15_000 }).toBe(0.15);
    expect(await value(page, 'object:beacon:size')).toBe(35);
    expect(await value(page, 'object:player:size')).toBe(40);
    expect(await value(page, 'object:cpu:size')).toBe(50);
    await page.evaluate(() => {
        window.__setState('input_boolean.lcards_test_toggle', 'off');
        window.__setState('input_select.lcards_test_mode', 'delta');
        window.__setState('media_player.tv', 'idle');
        window.__setState('sensor.cpu', '50');
    });
    await expect.poll(() => value(page, 'object:bubble:opacity')).toBe(0.6);
    expect(await value(page, 'object:beacon:size')).toBe(5);
    expect(await value(page, 'object:player:size')).toBe(4);
    expect(await value(page, 'object:cpu:size')).toBe(12.5);
    expect(await cardErrors(page)).toEqual([]);
});
