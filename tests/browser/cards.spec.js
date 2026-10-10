/**
 * Layer A: every card renders from its fixture against a fake hass, using the
 * built bundle (run `npm run build` first).
 */
import { test, expect } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { mountCase, cardErrors, expectNoErrors } from './support.js';

/** Computed fill of the button background (normalised to rgb(), whatever the attribute form). */
const bgFill = (page) => page.locator('lcards-button path.button-bg').evaluate(el => getComputedStyle(el).fill);

const FIXTURES = readdirSync(new URL('./fixtures', import.meta.url))
    .map(f => f.replace(/\.yaml$/, ''))
    .filter(name => !name.endsWith('-invalid'));

/** Cards that size to 100% of their parent need a definite height, like an HA sections cell. */
const paramsFor = (name) => (name.startsWith('chart-') ? { height: '300' } : {});

for (const name of FIXTURES) {
    test(`${name}: renders without errors`, async ({ page }) => {
        const card = await mountCase(page, name, paramsFor(name));
        await expect(card).toBeVisible();
        const box = await card.boundingBox();
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
        await expectNoErrors(page);
    });
}

test('invalid config: validation error is logged, card still renders its placeholder', async ({ page }) => {
    await mountCase(page, 'chart-invalid', { height: '300' });
    // Regression: the startup theme-override load re-processed every card's config,
    // logging validation errors twice. Wait past its debounce before counting.
    await page.waitForTimeout(500);
    const errors = await cardErrors(page);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Config validation errors');
    expect(errors[0]).toContain('"field":"sources"');
    await expect(page.locator('lcards-chart .chart-preview')).toBeVisible();
});

test('button: state change switches the state colour', async ({ page }) => {
    await mountCase(page, 'button-more-info');
    await expect.poll(() => bgFill(page)).toBe('rgb(51, 51, 102)'); // inactive
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await expect.poll(() => bgFill(page)).toBe('rgb(255, 153, 0)');  // active
    await page.evaluate(() => window.__setState('switch.demo_switch', 'off'));
    await expect.poll(() => bgFill(page)).toBe('rgb(51, 51, 102)');
});

test('button: tap toggle calls the entity domain toggle service', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await page.locator('lcards-button path.button-bg').click();
    await expect.poll(() => page.evaluate(() => window.__hass.serviceCalls))
        .toEqual([{ domain: 'light', service: 'toggle', data: { entity_id: 'light.demo' } }]);
});

test('button: tap more-info fires hass-more-info for the entity', async ({ page }) => {
    await mountCase(page, 'button-more-info');
    await page.locator('lcards-button path.button-bg').click();
    await expect.poll(() => page.evaluate(() => window.__events.filter(e => e.type === 'hass-more-info').map(e => e.detail)))
        .toContainEqual({ entityId: 'switch.demo_switch' });
    expect(await page.evaluate(() => window.__hass.serviceCalls)).toEqual([]);
});

test('chart: lazy ApexCharts chunk loads and draws the mocked history', async ({ page }) => {
    const chunk = page.waitForResponse(r => /\/lcards\/chunks\/apexcharts[^/]*\.js$/.test(r.url()));
    await mountCase(page, 'chart-area', { height: '300' });
    expect((await chunk).status()).toBe(200);
    await expect(page.locator('lcards-chart .apexcharts-canvas')).toBeVisible();
    // Two series groups, each with a drawn path.
    await expect(page.locator('lcards-chart .apexcharts-area-series .apexcharts-series')).toHaveCount(2);
    await expect(page.locator('lcards-chart .apexcharts-legend-text')).toHaveText(['Inside', 'Outside']);
});

test('data grid: data mode renders the header row and live entity values', async ({ page }) => {
    await mountCase(page, 'data-grid-data');
    const grid = page.locator('lcards-data-grid');
    await expect(grid).toContainText('SYSTEM', { ignoreCase: true });
    await expect(grid).toContainText('Inside');
    await expect(grid).toContainText('°C');
    const before = await page.evaluate(() => window.__hass.states['sensor.demo_temperature'].state);
    await page.evaluate(() => window.__setState('sensor.demo_temperature', '42.5'));
    await expect(grid).toContainText('42.5');
    expect(before).not.toBe('42.5');
});

test('data grid: decorative mode fills a 6 x 6 grid of cells', async ({ page }) => {
    await mountCase(page, 'data-grid-decorative');
    const cells = page.locator('lcards-data-grid .grid-cell');
    await expect(cells).toHaveCount(36);
    for (const text of await cells.allTextContents()) expect(text.trim()).not.toBe('');
});

test('msd: lines are routed into SVG paths', async ({ page }) => {
    await mountCase(page, 'msd-channel');
    const paths = page.locator('lcards-msd-card path[data-overlay-id], lcards-msd-card [data-overlay-id] path');
    await expect.poll(() => paths.count()).toBeGreaterThanOrEqual(2);
    const ds = await paths.evaluateAll(els => els.map(e => e.getAttribute('d')));
    for (const d of ds) expect(d).toMatch(/^M\s*[\d.-]+[ ,][\d.-]+/);
});

test('rules: a card-level rule restyles its own card (config frozen like HA)', async ({ page }) => {
    await mountCase(page, 'button-rule');
    await expectNoErrors(page);
    await expect.poll(() => bgFill(page)).toBe('rgb(51, 51, 102)');
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await expect.poll(() => bgFill(page)).toBe('rgb(204, 0, 0)');
    await page.evaluate(() => window.__setState('switch.demo_switch', 'off'));
    await expect.poll(() => bgFill(page)).toBe('rgb(51, 51, 102)');
});

test('rules: a rule added to a live card\'s frozen config loads (editor change)', async ({ page }) => {
    await mountCase(page, 'button-rule');
    // Regression: setConfig passed HA's frozen config to the rule loader, which wrote
    // metadata onto the rule objects and threw, so the new rule never loaded.
    await page.evaluate(() => {
        const config = JSON.parse(JSON.stringify(window.__card._rawConfig ?? window.__card.config));
        config.rules = [...config.rules, {
            id: 'rule-button-on-green', priority: 10,
            when: { entity: 'switch.demo_switch', state: 'on' },
            apply: { overlays: { rule_button: { style: { card: { color: { background: '#00aa00' } } } } } },
        }];
        window.__reconfigure(config);
    });
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await expect.poll(() => bgFill(page)).toBe('rgb(0, 170, 0)');
    await expectNoErrors(page);
});

test('rules: the higher-priority rule wins, and rules on different keys both apply', async ({ page }) => {
    await mountCase(page, 'button-rule');
    await page.evaluate(() => {
        const config = JSON.parse(JSON.stringify(window.__card.config));
        config.rules = [
            { id: 'low', priority: 1, when: { entity: 'switch.demo_switch', state: 'on' },
              apply: { overlays: { rule_button: { style: { card: { color: { background: '#cc0000' } } } } } } },
            { id: 'high', priority: 50, when: { entity: 'switch.demo_switch', state: 'on' },
              apply: { overlays: { rule_button: { style: { card: { color: { background: '#00aa00' } } } } } } },
            { id: 'border', priority: 5, when: { entity: 'switch.demo_switch', state: 'on' },
              apply: { overlays: { rule_button: { style: { border: { width: 4, color: '#ffffff' } } } } } },
        ];
        window.__reconfigure(config);
    });
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    // Regression: patches were merged so the lowest priority won, and shallowly.
    await expect.poll(() => bgFill(page)).toBe('rgb(0, 170, 0)');
    await expectNoErrors(page);
});
