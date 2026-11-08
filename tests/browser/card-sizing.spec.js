/**
 * Card size overrides (doc/cards/common.md, Sizing): a % width or height is the
 * card's size, set once on the card. The button and slider also gave it to their
 * inner container, so it applied twice (width: 50% drew a quarter of the cell).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** The card's box and its drawing's box. */
const boxes = (page, tag) => page.evaluate((tag) => {
    const card = document.querySelector(tag);
    const inner = card.shadowRoot.querySelector('.button-container, .slider-container');
    const r = (/** @type {Element} */ e) => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; };
    return { card: r(card), inner: r(inner), parent: r(card.parentElement) };
}, tag);

test('a button with a % width or height is that share of its cell, drawn once', async ({ page }) => {
    await mountCase(page, 'button-lozenge', { width: '400', height: '200' });
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-button', entity: 'light.demo', preset: 'lozenge', width: '50%', height: '50%' }));
    await expect.poll(() => boxes(page, 'lcards-button')).toMatchObject({ card: [200, 100], inner: [200, 100] });
    // px sizes are unchanged
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-button', entity: 'light.demo', preset: 'lozenge', width: 120, height: 60 }));
    await expect.poll(() => boxes(page, 'lcards-button')).toMatchObject({ card: [120, 60], inner: [120, 60] });
    // a % max_width caps the card, not a share of it
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-button', entity: 'light.demo', preset: 'lozenge', max_width: '50%' }));
    await expect.poll(async () => (await boxes(page, 'lcards-button')).inner[0]).toBe(200);
    await expectNoErrors(page);
});

test('a slider with a % height is that share of its cell, drawn once', async ({ page }) => {
    await mountCase(page, 'button-lozenge', { width: '400', height: '200' });
    await page.evaluate(() => {
        const old = document.querySelector('lcards-button');
        const host = old.parentElement;
        old.remove();
        const s = /** @type {any} */ (document.createElement('lcards-slider'));
        s.setConfig({ type: 'custom:lcards-slider', entity: 'light.demo', preset: 'pills-basic', height: '50%' });
        s.hass = window.__hass;
        host.appendChild(s);
    });
    await expect.poll(() => boxes(page, 'lcards-slider')).toMatchObject({ card: [400, 100], inner: [400, 100] });
    await expectNoErrors(page);
});

test('a chart keeps its configured height after it first measures its cell', async ({ page }) => {
    await mountCase(page, 'chart-line', { width: '400', height: '300' });
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-chart', sources: [{ entity: 'sensor.demo_temperature' }], height: 150 }));
    // the first-measure auto sizing cleared the host's height on cards that don't set it again in render
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => {
        const c = document.querySelector('lcards-chart');
        return [c.style.height, Math.round(c.getBoundingClientRect().height)];
    })).toEqual(['150px', 150]);
    await expectNoErrors(page);
});

test('a button in a layout cell of a definite height follows the cell, not its preset floor', async ({ page }) => {
    await mountCase(page, 'layout-card-short-row', { width: '400' });
    const heights = () => page.evaluate(() => {
        const layout = document.querySelector('lcards-layout-card');
        return [...layout.shadowRoot.querySelectorAll('lcards-button')].map((b) => ({
            fits: b.hasAttribute('data-lcards-cell-fits'),
            card: Math.round(b.getBoundingClientRect().height),
            drawn: Math.round(b.shadowRoot.querySelector('svg')?.getBoundingClientRect().height ?? 0),
        }));
    });
    // the 40px row: the drawing is 40px (it was the theme's 56px, spilling into the next row);
    // the auto row keeps the preset's floor, so the button stays visible
    await expect.poll(heights).toEqual([
        { fits: true, card: 40, drawn: 40 },
        expect.objectContaining({ fits: false }),
    ]);
    const [, auto] = await heights();
    expect(auto.drawn).toBeGreaterThanOrEqual(40);
    await expectNoErrors(page);
});
