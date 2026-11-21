/**
 * Renders per state change (2026-11-17, perf review item 12). A hass change of an
 * entity a card uses renders the new state at once; the template pass that follows
 * asked for one more render even when it had already asked for one itself (button,
 * slider) or found nothing changed (an elbow without templates): buttons and sliders
 * drew three times per change, the third identical. The DOM after every change was
 * compared with the old bundle's for every button, elbow and slider fixture.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Count the card's renders from now on. */
const countRenders = (page) => page.evaluate(() => {
    const c = /** @type {any} */ (window).__card;
    const proto = Object.getPrototypeOf(c);
    /** @type {any} */ (window).__renders = 0;
    c.update = function (/** @type {any[]} */ ...a) { /** @type {any} */ (window).__renders++; return proto.update.apply(this, a); };
});
const renders = (page) => page.evaluate(() => /** @type {any} */ (window).__renders);
const text = (page) => page.evaluate(() => /** @type {any} */ (window).__card.shadowRoot.textContent.replace(/\s+/g, ' '));

test('a button with a token template: two renders per change, the text follows every change', async ({ page }) => {
    await mountCase(page, 'button-text-token-update', { width: '400', height: '120' });
    await page.waitForTimeout(800);
    await countRenders(page);
    for (const v of ['12', '57', '93']) {
        await page.evaluate((v) => window.__setState('input_number.demo_level', v), v);
        await expect.poll(() => text(page), { timeout: 3000 }).toContain(v);
    }
    await page.waitForTimeout(400);
    expect(await renders(page)).toBe(6);
    await expectNoErrors(page);
});

test('an elbow without templates: one render per change', async ({ page }) => {
    await mountCase(page, 'elbow-entity-change', { width: '400', height: '200' });
    await page.waitForTimeout(800);
    await countRenders(page);
    for (const s of ['off', 'on', 'off']) {
        await page.evaluate((s) => window.__setState('light.demo', s), s);
        await page.waitForTimeout(300);
    }
    expect(await renders(page)).toBe(3);
    await expectNoErrors(page);
});

test('a slider: two renders per change, the value follows', async ({ page }) => {
    await mountCase(page, 'slider-picard-column', { width: '200', height: '400' });
    await page.waitForTimeout(800);
    await countRenders(page);
    for (const v of ['15', '60']) {
        await page.evaluate((v) => window.__setState('input_number.demo_level', v), v);
        await page.waitForTimeout(400);
    }
    expect(await renders(page)).toBe(4);
    await expectNoErrors(page);
});
