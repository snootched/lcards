/**
 * Light cards follow the light's colour, brightness and attributes while its state
 * stays "on" (match-light, match-brightness, state_attribute), off and on again, and
 * after a reconnect. Since 2026-11-17 the light colour hook runs only when the
 * colour or brightness changed: before, every Home Assistant update (any entity)
 * made each light button resolve its whole style. The drawn colours here were
 * recorded on the old code and must not change.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** @param {import('@playwright/test').Page} page */
const setLight = (page, value, entity = 'light.demo') =>
    page.evaluate(([e, v]) => window.__setState(e, v), [entity, value]);

test('a light button follows colour, brightness and effect, and ignores other entities', async ({ page }) => {
    await mountCase(page, 'button-light-attributes', { width: '300', height: '60' });
    await page.evaluate(() => {
        const c = /** @type {any} */ (window).__card;
        c.__resolves = 0;
        const original = c._resolveButtonStyleSync.bind(c);
        c._resolveButtonStyleSync = (/** @type {any[]} */ ...a) => { c.__resolves++; return original(...a); };
    });
    const drawn = () => page.evaluate(() => {
        const c = /** @type {any} */ (window).__card;
        const root = c.shadowRoot;
        const bg = root.querySelector('.button-group')?.querySelector('path, rect');
        const fill = (/** @type {Element|null} */ e) => e ? (e.getAttribute('fill') || getComputedStyle(e).fill) : null;
        return {
            bg: fill(bg),
            level: fill(root.querySelector('text[data-field-id="label"]')),
            name: fill(root.querySelector('text[data-field-id="name"]')),
            variable: getComputedStyle(document.documentElement).getPropertyValue(`--lcards-light-color-${c._cardGuid}`),
            resolves: c.__resolves,
        };
    });

    await setLight(page, { state: 'on', attributes: { rgb_color: [255, 0, 0], brightness: 255, effect: 'none' } });
    await expect.poll(drawn).toMatchObject({ bg: 'rgb(255, 0, 0)', level: '#ffffff', name: 'var(--lcars-white)', variable: 'rgb(255, 0, 0)' });

    // colour only (state stays on)
    await setLight(page, { attributes: { rgb_color: [0, 0, 255] } });
    await expect.poll(drawn).toMatchObject({ bg: 'rgb(0, 0, 255)', variable: 'rgb(0, 0, 255)' });

    // brightness only: match-brightness
    await setLight(page, { attributes: { brightness: 64 } });
    await expect.poll(drawn).toMatchObject({ bg: 'rgb(0, 0, 255)', level: 'rgba(255, 255, 255, 0.251)' });

    // effect only (same colour and brightness): state_attribute
    await setLight(page, { attributes: { effect: 'rainbow' } });
    await expect.poll(drawn).toMatchObject({ name: 'var(--lcars-yellow)' });

    // other entities change: no style work for this card
    const before = (await drawn()).resolves;
    for (let i = 0; i < 10; i++) await setLight(page, String(i), 'sensor.demo_temperature');
    await page.waitForTimeout(200);
    expect((await drawn()).resolves).toBe(before);

    // off, then on in a new colour
    await setLight(page, 'off');
    await expect.poll(drawn).toMatchObject({ bg: 'rgb(109, 116, 140)', level: 'var(--lcars-white)', variable: '' });
    await setLight(page, { state: 'on', attributes: { rgb_color: [0, 255, 0], effect: 'none' } });
    await expect.poll(drawn).toMatchObject({ bg: 'rgb(0, 255, 0)', name: 'var(--lcars-white)', variable: 'rgb(0, 255, 0)' });

    // a reconnect writes the page variable again (the disconnect removed it)
    await page.evaluate(() => {
        const c = /** @type {any} */ (window).__card;
        const parent = c.parentElement;
        c.remove();
        parent.appendChild(c);
    });
    await expect.poll(drawn).toMatchObject({ bg: 'rgb(0, 255, 0)', variable: 'rgb(0, 255, 0)' });
    await expectNoErrors(page);
});

test('a light slider\'s match-light gradient follows the light\'s colour', async ({ page }) => {
    await mountCase(page, 'slider-light-gradient', { width: '400', height: '60' });
    const fills = () => page.evaluate(() => {
        const html = /** @type {any} */ (window).__card.shadowRoot.innerHTML;
        return [...html.matchAll(/fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
    });
    await setLight(page, { state: 'on', attributes: { rgb_color: [255, 0, 0], brightness: 200 } });
    await expect.poll(fills).toContain('#660000');
    await setLight(page, { attributes: { rgb_color: [0, 0, 255] } });
    await expect.poll(fills).toContain('#000066');
    expect(await fills()).not.toContain('#660000');
    await expectNoErrors(page);
});
