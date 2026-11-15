/**
 * fit on text fields (reports/text-fit-plan.md): long text shrinks, then wraps, then
 * ends in an ellipsis, inside its zone; without fit it runs out. A plain button
 * (card text) and a picard-gauge-column cap (component zone text).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** The card's box and every drawn text's box, in page px. */
const boxes = (page, tag) => page.evaluate((tag) => {
    const card = document.querySelector(tag);
    const r = card.getBoundingClientRect();
    const texts = [...card.shadowRoot.querySelectorAll('text')].map((t) => {
        const b = t.getBoundingClientRect();
        return { text: t.textContent, left: b.left, right: b.right, top: b.top, bottom: b.bottom, tspans: t.querySelectorAll('tspan').length, size: Number(t.getAttribute('font-size')) };
    });
    return { card: { left: r.left, right: r.right, top: r.top, bottom: r.bottom }, texts };
}, tag);

const inside = (t, c) => t.left >= c.left - 1 && t.right <= c.right + 1 && t.top >= c.top - 1 && t.bottom <= c.bottom + 1;

test('a long label in a small button: shrinks and wraps inside it; without fit it runs out', async ({ page }) => {
    await mountCase(page, 'button-text-fit', { width: '120', height: '48' });
    await expect.poll(async () => (await boxes(page, 'lcards-button')).texts.length).toBeGreaterThan(0);
    const fit = await boxes(page, 'lcards-button');
    const label = fit.texts.find((t) => t.text.includes('PRIMARY') || t.text.includes('…'));
    expect(label, JSON.stringify(fit.texts)).toBeTruthy();
    expect(inside(label, fit.card), JSON.stringify({ label, card: fit.card })).toBe(true);
    expect(label.tspans).toBe(2);
    expect(label.size).toBeLessThan(20);

    // a one-line limit: shrinks to the minimum, then the ellipsis
    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-button', preset: 'panel-light', min_height: 0,
        text: { label: { content: 'PRIMARY SYSTEMS DISPLAY', position: 'center-right', font_size: 20, fit: { max_lines: 1 } } },
    }));
    await expect.poll(async () => (await boxes(page, 'lcards-button')).texts.some((t) => t.text.endsWith('…'))).toBe(true);
    const one = await boxes(page, 'lcards-button');
    expect(inside(one.texts.find((t) => t.text.endsWith('…')), one.card)).toBe(true);

    // without fit the label runs past the left edge
    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-button', preset: 'panel-light', min_height: 0,
        text: { label: { content: 'PRIMARY SYSTEMS DISPLAY', position: 'center-right', font_size: 20 } },
    }));
    await expect.poll(async () => {
        const b = await boxes(page, 'lcards-button');
        return b.texts.some((t) => t.text === 'PRIMARY SYSTEMS DISPLAY' && t.left < b.card.left - 1);
    }).toBe(true);
    await expectNoErrors(page);
});

test('a picard gauge cap: a long name fits the cap with fit', async ({ page }) => {
    await mountCase(page, 'slider-picard-column', { width: '64', height: '300' });
    const config = (fit) => ({
        type: 'custom:lcards-slider', entity: 'input_number.demo_level', preset: 'picard-gauge-column',
        text: { name: { content: 'LCARDS TEST SHIELDS', ...(fit ? { fit: true } : {}) } },
    });
    await page.evaluate((c) => window.__reconfigure(c), config(true));
    const capText = async () => {
        const b = await boxes(page, 'lcards-slider');
        return { b, t: b.texts.find((t) => /SHIELDS|LCARDS|…/.test(t.text)) };
    };
    await expect.poll(async () => !!(await capText()).t).toBe(true);
    const { b, t } = await capText();
    expect(t.left >= b.card.left - 1 && t.right <= b.card.right + 1, JSON.stringify({ t, card: b.card })).toBe(true);
    await expectNoErrors(page);
});
