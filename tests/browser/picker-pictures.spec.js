/**
 * Home Assistant's card picker (src/utils/picker-picture.js): the cards that can't
 * draw a live preview there show a picture of a real card instead, from the bundle's
 * images. Each card's stub config is mounted inside a stand-in hui-card-picker.
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

const CARDS = [
    ['lcards-astrometrics-card', 'astrometrics'],
    ['lcards-msd-card', 'msd'],
    ['lcards-layout-card', 'layout-card'],
    ['lcards-chart', 'chart'],
    ['lcards-alert-overlay', 'alert-overlay'],
    ['lcards-select-menu', 'select-menu'],
];

for (const [tag, picture] of CARDS) {
    test(`card picker: ${tag} shows its picture`, async ({ page }) => {
        await mountCase(page, 'button-lozenge');
        await page.evaluate(async (tag) => {
            if (!customElements.get('hui-card-picker')) customElements.define('hui-card-picker', class extends HTMLElement {});
            const picker = document.createElement('hui-card-picker');
            picker.style.cssText = 'display:block;width:380px';
            document.body.append(picker);
            const Card = /** @type {any} */ (customElements.get(tag));
            const card = /** @type {any} */ (document.createElement(tag));
            card.setConfig(Card.getStubConfig ? Card.getStubConfig() : { type: `custom:${tag}` });
            card.hass = window.__hass;
            picker.append(card);
            await card.updateComplete;
        }, tag);
        const img = page.locator(`hui-card-picker ${tag} img.lcards-picker-picture`);
        await expect(img).toBeVisible();
        expect(await img.getAttribute('src')).toMatch(new RegExp(`/images/picker/${picture}\\.webp$`));
        // loaded, 16:9, at least 480 px (the rendered ones are 768; astrometrics reuses a 480 starter picture)
        await expect.poll(() => img.evaluate((el) => /** @type {HTMLImageElement} */ (el).naturalWidth)).toBeGreaterThanOrEqual(480);
        const ratio = await img.evaluate((el) => { const i = /** @type {HTMLImageElement} */ (el); return i.naturalWidth / i.naturalHeight; });
        expect(Math.abs(ratio - 16 / 9)).toBeLessThan(0.02);
        const box = await img.boundingBox();
        expect(Math.round(box?.width ?? 0)).toBe(380);
        // the card is as tall as its picture: a stub height (astrometrics' 400 px) or a
        // stylesheet floor (the chart's 200 px) would stretch the tile and its row
        const cardHeight = await page.locator(`hui-card-picker ${tag}`).evaluate((el) => Math.round(el.getBoundingClientRect().height));
        expect(cardHeight).toBeLessThanOrEqual(Math.round(380 * 9 / 16) + 2);
    });
}
