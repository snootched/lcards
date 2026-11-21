/**
 * Jinja2 templates stay subscribed (2026-11-18, Fire HD 8 kiosk feedback item 6).
 * A card used to subscribe to render_template, take one result and unsubscribe on
 * every change of an entity its template uses. Now each template keeps one
 * subscription; the harness answers like Home Assistant (renders again on a state
 * change and sends only a changed result).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const text = (page) => page.evaluate(() => /** @type {any} */ (window).__card.shadowRoot.textContent.replace(/\s+/g, ' '));
const templateSubs = (page) => page.evaluate(() => {
    const subs = /** @type {any} */ (window).__hass.connection.subs.filter((/** @type {any} */ s) => s.message?.type === 'render_template');
    return { total: subs.length, open: subs.filter((/** @type {any} */ s) => s.active).length };
});

test('a Jinja2 label follows every change on one open subscription', async ({ page }) => {
    await mountCase(page, 'button-jinja-live', { width: '400', height: '120' });
    await expect.poll(() => text(page), { timeout: 5000 }).toMatch(/LEVEL \d/);
    for (const v of ['12', '57', '93']) {
        await page.evaluate((v) => window.__setState('input_number.demo_level', v), v);
        await expect.poll(() => text(page), { timeout: 3000 }).toContain(`LEVEL ${v}`);
    }
    expect(await templateSubs(page)).toEqual({ total: 1, open: 1 });
    await expectNoErrors(page);
});

test('removed and added back (a move, edit mode): the label still follows, same subscription', async ({ page }) => {
    await mountCase(page, 'button-jinja-live', { width: '400', height: '120' });
    await expect.poll(() => text(page), { timeout: 5000 }).toMatch(/LEVEL \d/);
    await page.evaluate(() => {
        const card = /** @type {any} */ (window).__card;
        const parent = card.parentNode;
        parent.removeChild(card);
        parent.appendChild(card);
    });
    await page.evaluate(() => window.__setState('input_number.demo_level', '44'));
    await expect.poll(() => text(page), { timeout: 3000 }).toContain('LEVEL 44');
    expect(await templateSubs(page)).toEqual({ total: 1, open: 1 });
    await expectNoErrors(page);
});

test('a new config with another template: the old one is let go, the new one follows', async ({ page }) => {
    await mountCase(page, 'button-jinja-live', { width: '400', height: '120' });
    await expect.poll(() => text(page), { timeout: 5000 }).toMatch(/LEVEL \d/);
    await page.evaluate(() => {
        const config = structuredClone(/** @type {any} */ (window).__card._rawConfig);
        config.text.label.content = "NOW {{ states('input_number.demo_level') }}";
        /** @type {any} */ (window).__reconfigure(config);
    });
    await page.evaluate(() => window.__setState('input_number.demo_level', '61'));
    await expect.poll(() => text(page), { timeout: 3000 }).toContain('NOW 61');
    const subs = await templateSubs(page);
    expect(subs.total).toBe(2);
    await expectNoErrors(page);
});
