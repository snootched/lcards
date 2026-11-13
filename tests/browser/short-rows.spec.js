/**
 * Cards in short rows (session group A, 2026-11-12; seen in the LCARS samples rollout):
 * - a select menu with grid.height '100%' and no grid-auto-rows fills a 30 px row (its rows
 *   kept the 56 px default and scrolled);
 * - a two-row data grid in a short elbow frame: rows never shrink below one line, so with a
 *   small gap and no padding both rows fit 48 px (doc/cards/data-grid/index.md);
 * - a gauge-basic slider in a minmax(0, 1fr) row was reported about 14 px low (design pilot,
 *   2026-11-11); not reproduced in the harness or the dev Home Assistant, kept as a guard.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

test('select menu grid.height 100% fills a 30 px row', async ({ page }) => {
    await mountCase(page, 'select-menu-fill-row', { width: '600', height: '30' });
    const measure = () => page.evaluate(() => {
        const menu = /** @type {any} */ (document.querySelector('lcards-select-menu'));
        const grid = menu.shadowRoot.querySelector('.sm-grid');
        const buttons = [...grid.querySelectorAll('lcards-button')].map(b => Math.round(b.getBoundingClientRect().height));
        return { buttons, scrolls: grid.scrollHeight > grid.clientHeight + 1 };
    });
    await expect.poll(async () => (await measure()).buttons).toEqual([30, 30, 30, 30]);
    expect((await measure()).scrolls).toBe(false);
    await expectNoErrors(page);
});

test('a two-row data grid fits a 48 px elbow frame with a small gap and no padding', async ({ page }) => {
    await mountCase(page, 'elbow-symbiont-data-grid', { width: '300', height: '68' });
    const measure = () => page.evaluate(() => {
        const grid = /** @type {any} */ (document.querySelector('lcards-elbow')).shadowRoot.querySelector('lcards-data-grid');
        const box = grid.getBoundingClientRect();
        const cells = [...grid.shadowRoot.querySelectorAll('.grid-cell')].map(c => c.getBoundingClientRect());
        return { height: Math.round(box.height), cells: cells.length, inside: cells.every(c => c.bottom <= box.bottom + 0.5) };
    });
    await expect.poll(async () => (await measure()).cells).toBe(4);
    expect(await measure()).toEqual({ height: 48, cells: 4, inside: true });
    await expectNoErrors(page);
});

test('a gauge slider sits at the top of a flexible row and of a fixed row, like the button beside it', async ({ page }) => {
    await mountCase(page, 'layout-card-slider-flex-row', { width: '600' });
    const tops = () => page.evaluate(() => {
        const layout = /** @type {any} */ (document.querySelector('#mount > *'));
        const root = layout.shadowRoot ?? layout;
        const top = (/** @type {Element} */ el) => Math.round((el.shadowRoot?.querySelector('ha-card, svg') ?? el).getBoundingClientRect().top);
        return { sliders: [...root.querySelectorAll('lcards-slider')].map(top), buttons: [...root.querySelectorAll('lcards-button')].map(top) };
    });
    await expect.poll(async () => (await tops()).sliders.length).toBe(2);
    const { sliders, buttons } = await tops();
    expect(sliders).toEqual(buttons);
    await expectNoErrors(page);
});
