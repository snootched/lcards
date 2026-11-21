/**
 * Layout view height: a grid taller than its height scrolls (the documented
 * behaviour); it used to be clipped, so the last rows were out of reach
 * (the B1 banner views, 2026-11-08). A view whose fr rows fill the screen shows
 * no scrollbar, and `height: auto` grows instead of scrolling.
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

/** Mount a layout view (not in edit mode) in an 800 px tall window; returns nothing. */
async function mountView(page, layout, rows) {
    await page.setViewportSize({ width: 1000, height: 800 });
    await mountCase(page, 'button-lozenge'); // loads the bundle
    await page.evaluate(async ({ layout, rows }) => {
        if (!customElements.get('test-card')) {
            customElements.define('test-card', class extends HTMLElement {
                connectedCallback() { Object.assign(this.style, { display: 'block', height: '100%', background: '#345' }); }
            });
        }
        document.getElementById('mount').innerHTML = '';
        document.body.style.margin = '0';
        const config = {
            type: 'custom:lcards-layout-view',
            layout: { 'grid-template-columns': '1fr', 'grid-template-rows': rows, 'grid-gap': '8px', ...layout },
            cards: [0, 1, 2, 3].map(i => ({ type: 'custom:test-card', view_layout: { 'grid-row': String(i + 1), 'grid-column': '1' } })),
        };
        const view = document.createElement('lcards-layout-view');
        view.style.cssText = 'display:block;width:1000px;';
        view.setConfig(config);
        view.cards = config.cards.map((c, i) => { const el = document.createElement('test-card'); el.id = `card-${i}`; el.config = c; return el; });
        view.lovelace = { editMode: false, config: { views: [config] }, saveConfig: async () => {} };
        window.__view = view;
        document.body.appendChild(view);
        await view.updateComplete;
        await new Promise(r => setTimeout(r, 400));
    }, { layout, rows });
}

/** The grid's scroll box and the last card's position inside it. */
const measure = (page) => page.evaluate(() => {
    const view = window.__view;
    const grid = view.shadowRoot.querySelector('#grid-root');
    const box = grid.getBoundingClientRect();
    const host = view.getBoundingClientRect();
    return {
        hostHeight: host.height,
        clientHeight: grid.clientHeight,
        scrollHeight: grid.scrollHeight,
        overflowY: getComputedStyle(grid).overflowY,
        gridBottom: box.bottom,
    };
});

test('a grid taller than the screen scrolls, and its last row can be reached', async ({ page }) => {
    await mountView(page, {}, 'repeat(4, 300px)');
    const m = await measure(page);
    expect(m.overflowY).toBe('auto');
    expect(m.scrollHeight).toBeGreaterThan(m.clientHeight + 300);
    // Scroll to the end: the last card is fully inside the grid's box.
    const fits = await page.evaluate(() => {
        const view = window.__view;
        const grid = view.shadowRoot.querySelector('#grid-root');
        grid.scrollTop = grid.scrollHeight;
        const g = grid.getBoundingClientRect();
        const last = view.cards[3].getBoundingClientRect();
        return { lastTop: last.top, lastBottom: last.bottom, gridTop: g.top, gridBottom: g.bottom, scrollTop: grid.scrollTop };
    });
    expect(fits.scrollTop).toBeGreaterThan(0);
    expect(fits.lastBottom).toBeLessThanOrEqual(fits.gridBottom + 1);
    expect(fits.lastTop).toBeGreaterThanOrEqual(fits.gridTop - 1);
});

test('fr rows that fill the screen show no scrollbar', async ({ page }) => {
    await mountView(page, {}, '80px 1fr 2fr 80px');
    const m = await measure(page);
    expect(m.scrollHeight).toBeLessThanOrEqual(m.clientHeight);
});

test('height: auto grows to its content instead of scrolling', async ({ page }) => {
    await mountView(page, { height: 'auto' }, 'repeat(4, 300px)');
    const m = await measure(page);
    expect(m.hostHeight).toBeGreaterThanOrEqual(4 * 300 + 3 * 8 - 1);
    expect(m.scrollHeight).toBeLessThanOrEqual(m.clientHeight + 1);
});
