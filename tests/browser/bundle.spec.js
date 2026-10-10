/**
 * Bundle structure: loader stub, single main chunk, lazy editors and size budget.
 * Runs against the built bundle (npm run build first).
 */
import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import { mountCase, expectNoErrors } from './support.js';

const DIST = new URL('../../custom_components/lcards/', import.meta.url);

/** The nine cards and their (lazily loaded) editor tags. */
const CARDS = [
    'button', 'elbow', 'slider', 'chart', 'data-grid', 'alert-overlay', 'select-menu', 'layout-card',
].map(c => [`lcards-${c}`, `lcards-${c}-editor`]).concat([['lcards-msd-card', 'lcards-msd-editor']]);

test('the loader stub is loaded once with its query, and the main chunk once', async ({ page }) => {
    const requests = [];
    page.on('request', r => { if (r.url().includes('/lcards/')) requests.push(new URL(r.url())); });
    await mountCase(page, 'button-lozenge');
    const stubLoads = requests.filter(u => u.pathname === '/lcards/lcards.js');
    expect(stubLoads.map(u => u.search)).toEqual(['?v=test']);
    expect(requests.filter(u => /\/lcards\/chunks\/lcards-main-[^/]+\.js$/.test(u.pathname))).toHaveLength(1);
});

test('loading an editor chunk reuses the same core (no second copy of the bundle)', async ({ page }) => {
    const requests = [];
    page.on('request', r => { if (r.url().includes('/lcards/lcards.js')) requests.push(r.url()); });
    await mountCase(page, 'button-lozenge');
    const same = await page.evaluate(async () => {
        const core = window.lcards.core;
        await customElements.get('lcards-button').getConfigElement();
        return window.lcards.core === core;
    });
    expect(same).toBe(true);
    // Regression guard: a chunk importing shared code from the entry would re-request
    // lcards.js without its query string and run a second bundle.
    expect(requests).toHaveLength(1);
});

test('?log= on the loader URL sets the global log level', async ({ page }) => {
    await mountCase(page, 'button-lozenge', { log: 'warn' });
    expect(await page.evaluate(() => window.lcards.getGlobalLogLevel())).toBe('warn');
});

test('rendering cards loads no editor code', async ({ page }) => {
    const editorChunks = [];
    page.on('request', r => { if (/\/chunks\/[^/]*editor[^/]*\.js$/.test(r.url())) editorChunks.push(r.url()); });
    for (const name of ['button-lozenge', 'slider-pills', 'elbow-header-left', 'data-grid-data', 'msd-channel']) {
        await mountCase(page, name);
    }
    await mountCase(page, 'chart-area', { height: '300' });
    expect(editorChunks).toEqual([]);
});

for (const [cardTag, editorTag] of CARDS) {
    test(`${cardTag}: getConfigElement() loads and defines its editor`, async ({ page }) => {
        await mountCase(page, 'button-lozenge');
        const result = await page.evaluate(async ({ cardTag, editorTag }) => {
            const before = !!customElements.get(editorTag);
            const el = await customElements.get(cardTag).getConfigElement();
            return { before, tag: el.localName, defined: !!customElements.get(editorTag), upgraded: el instanceof customElements.get(editorTag) };
        }, { cardTag, editorTag });
        expect(result).toEqual({ before: false, tag: editorTag, defined: true, upgraded: true });
        await expectNoErrors(page);
    });
}

test('size budget: tiny loader, main chunk under its ceiling', () => {
    const chunks = readdirSync(new URL('chunks/', DIST));
    const main = chunks.find(f => /^lcards-main-.*\.js$/.test(f));
    expect(main, 'chunks/lcards-main-*.js').toBeTruthy();
    const size = (rel) => statSync(new URL(rel, DIST)).size;
    expect(size('lcards.js')).toBeLessThanOrEqual(2 * 1024);
    // Measured 2026-10-10 after the split: 1.94 MB raw / 418 KB br. Ceilings leave
    // ~10% headroom; a change that pulls editors back into the main chunk fails here.
    expect(size(`chunks/${main}`)).toBeLessThanOrEqual(2_150_000);
    expect(size(`chunks/${main}.br`)).toBeLessThanOrEqual(460_000);
});

test('rules: editing an existing rule keeps the old rule until a page refresh (documented)', async ({ page }) => {
    await mountCase(page, 'button-rule');
    await page.evaluate(() => {
        const config = JSON.parse(JSON.stringify(window.__card.config));
        config.rules[0].apply.overlays.rule_button.style.card.color.background = '#00aa00';
        window.__reconfigure(config);
    });
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    // Pinned behaviour (doc/core/rules: "Refresh after changing an existing rule").
    await expect.poll(() => page.locator('lcards-button path.button-bg').evaluate(el => getComputedStyle(el).fill))
        .toBe('rgb(204, 0, 0)');
});
