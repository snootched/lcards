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

test('slider: templated text fields are evaluated on the first render (shaped preset name/state)', async ({ page }) => {
    await mountCase(page, 'slider-shaped');
    const texts = () => page.locator('lcards-slider').evaluate(el => [...el.shadowRoot.querySelectorAll('text')].map(t => t.textContent.trim()).filter(Boolean));
    await expect.poll(texts).not.toEqual([]);
    const shown = await texts();
    expect(shown.join(' ')).not.toContain('[[[');
    expect(shown.join(' ')).toMatch(/DEMO/i);
    await expectNoErrors(page);
});

test('select menu: its option buttons never change the shared core\'s view of the entity', async ({ page }) => {
    // The options once coloured themselves from a synthetic hass (entity state rewritten
    // to on/off); forwarded to the core it showed 'off' in every other card using it.
    // They now see the real state and classify it with state_classification.
    await mountCase(page, 'select-menu');
    await expect.poll(() => page.locator('lcards-select-menu').evaluate(el => el.shadowRoot.querySelectorAll('lcards-button').length)).toBeGreaterThan(1);
    await page.waitForTimeout(500);
    const coreState = await page.evaluate(() => window.lcards.core._currentHass?.states?.['input_select.demo_mode']?.state);
    expect(coreState).toBe('Auto');
    await expectNoErrors(page);
});

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

test('slider: picard-gauge-vertical draws the picard component without component: in the config', async ({ page }) => {
    await mountCase(page, 'slider-picard-gauge', { height: '320' });
    await expect.poll(() => page.locator('lcards-slider').evaluate(el => /** @type {any} */ (el)._componentMetadata?.name)).toBe('picard');
    await expectNoErrors(page);
});

test('slider: picard-gauge-column draws both caps, the value in the top one and the entity name (or your content) in the bottom one', async ({ page }) => {
    await mountCase(page, 'slider-picard-column', { height: '400' });
    const caps = () => page.locator('lcards-slider').evaluate(el => ['border-top', 'border-bottom']
        .map(id => el.shadowRoot.getElementById(id)?.getBoundingClientRect().height ?? 0));
    await expect.poll(caps).toEqual([24, 24]);
    const texts = () => page.locator('lcards-slider').evaluate(el => [...el.shadowRoot.querySelectorAll('text')].map(t => t.textContent.trim()));
    await expect.poll(async () => (await texts()).some(t => /^demo level$/i.test(t))).toBe(true); // the name, by default
    await expect.poll(async () => (await texts()).some(t => /^40/.test(t))).toBe(true); // demo_level starts at 40
    // Your own content in the bottom cap wins over the name
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-slider', entity: 'input_number.demo_level', preset: 'picard-gauge-column', text: { name: { content: '3788' } } }));
    await expect.poll(texts).toContain('3788');
    await expectNoErrors(page);
});

test('slider: the value text is formatted by Home Assistant for the user locale (comma decimals), without its unit', async ({ page }) => {
    await mountCase(page, 'slider-picard-column', { height: '400' });
    const texts = () => page.locator('lcards-slider').evaluate(el => [...el.shadowRoot.querySelectorAll('text')].map(t => t.textContent.trim()));
    await page.evaluate(() => window.__setState('input_number.demo_level', '40.5'));
    // Home Assistant with a European number format: the value part, then the unit part
    await page.evaluate(() => {
        const card = window.__card;
        const parts = (s) => [{ type: 'value', value: String(s.state).replace('.', ',') }, { type: 'literal', value: ' ' }, { type: 'unit', value: '%' }];
        card.hass = { ...window.__hass, formatEntityStateToParts: parts, formatEntityState: (s) => parts(s).map(p => p.value).join('') };
    });
    await expect.poll(texts).toContain('40,5');
    expect((await texts()).some(t => t.includes('40.5'))).toBe(false);
    await expectNoErrors(page);
});

test('button: bar-label-left sizes its label to the bar, and an explicit font_size wins', async ({ page }) => {
    await mountCase(page, 'button-bar-label-font-size', { height: '48' });
    const size = () => page.locator('lcards-button').evaluate(el => [...el.shadowRoot.querySelectorAll('text')]
        .find(t => t.textContent.trim() === 'MISSION OPS')?.getAttribute('font-size'));
    await expect.poll(size).toBe('20');
    // font_size_percent sizes it against the bar
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-button', preset: 'bar-label-left', height: 48, min_height: 0, text: { label: { content: 'MISSION OPS', font_size_percent: 50 } } }));
    await expect.poll(async () => Number(await size())).toBeGreaterThan(22);
    await expect.poll(async () => Number(await size())).toBeLessThan(32);
    await expectNoErrors(page);
});

test('slider: a fractional tick interval labels the scale with its decimals', async ({ page }) => {
    await mountCase(page, 'slider-picard-column', { height: '400' });
    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-slider', entity: 'input_number.demo_level', preset: 'picard-gauge-column',
        style: { gauge: { scale: { tick_marks: { major: { interval: 12.5 }, minor: { interval: 2.5 } }, labels: { enabled: true } } } },
    }));
    const texts = () => page.locator('lcards-slider').evaluate(el => [...el.shadowRoot.querySelectorAll('text')].map(t => t.textContent.trim()));
    await expect.poll(texts).toContain('12.5');
    const labels = await texts();
    expect(labels).toContain('37.5');
    expect(labels.some(t => /\d\.\d{3,}/.test(t))).toBe(false); // no floating-point noise
    await expectNoErrors(page);
});

test('button: state change switches the state colour', async ({ page }) => {
    await mountCase(page, 'button-more-info');
    await expect.poll(() => bgFill(page)).toBe('rgb(51, 51, 102)'); // inactive
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await expect.poll(() => bgFill(page)).toBe('rgb(255, 153, 0)');  // active
    await page.evaluate(() => window.__setState('switch.demo_switch', 'off'));
    await expect.poll(() => bgFill(page)).toBe('rgb(51, 51, 102)');
});

test('button: a text field colour can be a JS template, and follows the entity', async ({ page }) => {
    await mountCase(page, 'button-text-color-template');
    const fill = () => page.locator('lcards-button').evaluate(el => {
        const t = [...el.shadowRoot.querySelectorAll('text')].find(x => x.textContent.trim() === 'LEVEL');
        return t ? getComputedStyle(t).fill : null;
    });
    await expect.poll(fill).toBe('rgb(0, 255, 0)'); // demo_level starts at 40
    await page.evaluate(() => window.__setState('input_number.demo_level', '90'));
    await expect.poll(fill).toBe('rgb(255, 0, 0)');
    await expectNoErrors(page);
});

test('button: {entity.state} formats again when Home Assistant swaps in its locale formatter', async ({ page }) => {
    // Home Assistant's first hass formats as the raw state; the locale-aware formatter
    // comes later in a new hass with no entity change (frontend connection-mixin.ts,
    // state-display-mixin.ts). Cards rendered before then showed "18.8" for "18,8 °C".
    await mountCase(page, 'button-text-token-update');
    const texts = () => page.locator('lcards-button').evaluate(el => [...el.shadowRoot.querySelectorAll('text')].map(t => t.textContent.trim()).filter(Boolean).join('/'));
    await expect.poll(texts).toContain('40');
    await page.evaluate(() => {
        const card = window.__card;
        const hass = window.__hass;
        const raw = (s, v) => String(v ?? s.state);
        card.hass = { ...hass, formatEntityState: raw, formatEntityStateToParts: (s, v) => [{ type: 'value', value: raw(s, v) }] };
    });
    await expect.poll(texts).toMatch(/(^|\/)40($|\/)/);
    await page.evaluate(() => {
        const card = window.__card;
        const hass = card.hass;
        const fmt = (s, v) => `${String(v ?? s.state).replace('.', ',')},0 LOC`;
        card.hass = { ...hass, locale: { ...(hass.locale ?? {}), number_format: 'comma_decimal' }, formatEntityState: fmt, formatEntityStateToParts: (s, v) => [{ type: 'value', value: fmt(s, v) }] };
    });
    await expect.poll(texts).toContain('40,0 LOC');
    await expectNoErrors(page);
});

test('button: token and JS text follow the entity on a panel without an action', async ({ page }) => {
    await mountCase(page, 'button-text-token-update');
    const texts = () => page.locator('lcards-button').evaluate(el => [...el.shadowRoot.querySelectorAll('text')].map(t => t.textContent.trim()).filter(Boolean).join('/'));
    await expect.poll(texts).toContain('LOW');
    await page.evaluate(() => window.__setState('input_number.demo_level', '90'));
    await expect.poll(texts).toContain('HIGH');
    expect(await texts()).toContain('90');
    await expectNoErrors(page);
});

test('layout card: a nested button\'s text follows its entity', async ({ page }) => {
    await mountCase(page, 'layout-card-nested-text');
    const texts = () => page.locator('lcards-button').evaluate(el => [...el.shadowRoot.querySelectorAll('text')].map(t => t.textContent.trim()).filter(Boolean).join('/'));
    await expect.poll(texts).toContain('LOW');
    await page.evaluate(() => window.__setState('input_number.demo_level', '90'));
    await expect.poll(texts).toContain('HIGH');
    await expectNoErrors(page);
});

test('button: color-shift aimed at the shape recolours it on tap', async ({ page }) => {
    await mountCase(page, 'button-color-shift');
    await page.locator('lcards-button path.button-bg').click();
    // anime.js writes rgba() between the two colours (the hover tint is a color-mix(), not this)
    const fill = () => page.locator('lcards-button path.button-bg').getAttribute('fill');
    await expect.poll(fill, { timeout: 1500 }).toMatch(/^rgba\(/);
    await expectNoErrors(page);
});

test('button: tap toggle turns the entity off from on, as Home Assistant\'s toggle does', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await page.locator('lcards-button path.button-bg').click();
    await expect.poll(() => page.evaluate(() => window.__hass.serviceCalls))
        .toEqual([{ domain: 'light', service: 'turn_off', data: { entity_id: 'light.demo' } }]);
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

test('rules: a plain-string condition never applies its patch and logs a warning', async ({ page }) => {
    const warnings = [];
    page.on('console', m => { if (m.type() === 'warning') warnings.push(m.text()); });
    await mountCase(page, 'button-rule-condition-invalid');
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await page.waitForTimeout(500);
    // Regression: the condition compiled to "always", so the rule matched everywhere.
    expect(await bgFill(page)).toBe('rgb(51, 51, 102)');
    expect(warnings.some(w => w.includes('Plain string condition not supported'))).toBe(true);
});

test('chart: the first draw waits for every series (a late one does not rescale it mid-animation)', async ({ page }) => {
    // The second series' history arrives 1.2 s after the first.
    await mountCase(page, 'chart-two-series', { height: '300', historyDelay: 'sensor.demo_outdoor_temperature:1200' });
    const chart = page.locator('lcards-chart');
    await expect.poll(() => chart.evaluate(el => !!el._chart), { timeout: 10_000 }).toBe(true);
    const lengths = await chart.evaluate(el => el._seriesPoints.map(p => p?.length ?? 0));
    expect(lengths).toHaveLength(2);
    expect(Math.min(...lengths)).toBeGreaterThan(0);
    await expectNoErrors(page);
});

test('chart: a series that never answers does not hold the chart back', async ({ page }) => {
    await mountCase(page, 'chart-two-series', { height: '300', historyDelay: 'sensor.demo_outdoor_temperature:60000' });
    const chart = page.locator('lcards-chart');
    await expect.poll(() => chart.evaluate(el => !!el._chart), { timeout: 6_000 }).toBe(true);
    await expectNoErrors(page);
});

test('elbow symbiont: a uix block on the embedded card is passed through, and imprint still applies after it (imprint.enabled: false turns both imprint and custom_style off, live)', async ({ page }) => {
    await mountCase(page, 'elbow-symbiont-uix');
    const inner = () => page.locator('lcards-elbow').evaluate(el => {
        const card = el.shadowRoot.querySelector('#lcards-symbiont-host lcards-button');
        return card && {
            uix: card.config?.uix?.style ?? card._config?.uix?.style ?? null,
            imprint: card.shadowRoot?.querySelector('#lcards-symbiont-imprint')?.textContent ?? null,
        };
    });
    await expect.poll(async () => (await inner())?.imprint ?? null).not.toBeNull();
    const on = await inner();
    expect(on.uix).toContain('outline');
    expect(on.imprint).toMatch(/#123456|rgb\(18, 52, 86\)/);
    expect(on.imprint).toContain('opacity: 0.9');

    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-elbow', elbow: { type: 'header-left' },
        symbiont: { enabled: true, card: { type: 'custom:lcards-button', preset: 'lozenge', uix: { style: ':host { outline: 1px solid red; }' } },
            imprint: { enabled: false, background: '#123456' }, custom_style: ':host { opacity: 0.9; }' },
    }));
    await page.waitForTimeout(800);
    const off = await inner();
    expect(off?.imprint ?? null).toBeNull();

    // And back on, with a new colour, without waiting for a state change.
    await page.evaluate(() => window.__reconfigure({
        type: 'custom:lcards-elbow', elbow: { type: 'header-left' },
        symbiont: { enabled: true, card: { type: 'custom:lcards-button', preset: 'lozenge' }, imprint: { background: '#654321' } },
    }));
    await expect.poll(async () => (await inner())?.imprint ?? '').toMatch(/#654321|rgb\(101, 67, 33\)/);
    await expectNoErrors(page);
});

test('layout card outside HA: LCARdS children are built directly (docs demos, this harness) and render', async ({ page }) => {
    const card = await mountCase(page, 'layout-card-children', { width: '600' });
    const kids = () => card.evaluate(el => [...el.shadowRoot.querySelectorAll('lcards-button, lcards-elbow, hui-error-card')].map(n => n.localName));
    await expect.poll(kids).toEqual(['lcards-button', 'lcards-button', 'lcards-button', 'lcards-elbow']);
    const box = await page.locator('lcards-layout-card lcards-elbow').boundingBox();
    expect(box?.width).toBeGreaterThan(300);
    await card.screenshot({ path: test.info().outputPath('layout.png') });
    await expectNoErrors(page);
});

test('select menu without a preset: its option buttons draw (their style resolves on connect)', async ({ page }) => {
    const card = await mountCase(page, 'select-menu', { width: '400', height: '300' });
    await expect.poll(() => card.evaluate(el => [...el.shadowRoot.querySelectorAll('lcards-button')].filter(b => b.shadowRoot.querySelector('.button-bg')).length)).toBe(4);
    await expectNoErrors(page);
});

test('select menu: a tap selects the option through the option button (select_option on the entity); card size follows the option rows', async ({ page }) => {
    const card = await mountCase(page, 'select-menu-toggle-tab', { width: '600' });
    await expect.poll(() => card.evaluate(el => el.shadowRoot.querySelectorAll('lcards-button').length)).toBe(4);
    // 4 options in 4 columns: one row
    expect(await card.evaluate(el => el.getCardSize())).toBe(1);
    await page.locator('lcards-select-menu lcards-button').nth(2).locator('.button-bg').click();
    await expect.poll(() => page.evaluate(() => window.__hass.serviceCalls))
        .toEqual([{ domain: 'input_select', service: 'select_option', data: { option: 'Heat' }, target: { entity_id: 'input_select.demo_mode' } }]);
    // one column: a row each
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-select-menu', entity: 'input_select.demo_mode', preset: 'toggle-tab', grid: { columns: 1 } }));
    await expect.poll(() => card.evaluate(el => el.getCardSize())).toBe(4);
    await expectNoErrors(page);
});

test('select menu: getGridOptions asks for enough sections-grid rows to show every option; grid_options.rows still wins', async ({ page }) => {
    const card = await mountCase(page, 'select-menu', { width: '400' });
    await expect.poll(() => card.evaluate(el => el.shadowRoot.querySelectorAll('lcards-button').length)).toBe(4);
    const rows = () => card.evaluate(el => el.getGridOptions().rows);
    // 4 options, one column, 56px rows, 4px gaps: 236px needs 4 rows of 56px + 8px gaps (248px)
    expect(await rows()).toBe(4);
    const gridHeight = await card.evaluate(el => el.shadowRoot.querySelector('.sm-grid').getBoundingClientRect().height);
    expect(gridHeight).toBeGreaterThan(3 * 56 + 2 * 8);
    expect(gridHeight).toBeLessThanOrEqual(4 * 56 + 3 * 8);
    const base = { type: 'custom:lcards-select-menu', entity: 'input_select.demo_mode' };
    // a horizontal strip stays one row
    await page.evaluate((c) => window.__reconfigure({ ...c, grid: { columns: 4 } }), base);
    await expect.poll(rows).toBe(1);
    await page.evaluate((c) => window.__reconfigure({ ...c, grid: { 'grid-template-columns': 'repeat(2, 1fr)' } }), base);
    await expect.poll(rows).toBe(2);
    // shorter rows: 4 x 40px + 3 x 4px = 172px fits 3 rows
    await page.evaluate((c) => window.__reconfigure({ ...c, grid: { columns: 1, 'grid-auto-rows': '40px' } }), base);
    await expect.poll(rows).toBe(3);
    // a pixel height sizes it instead
    await page.evaluate((c) => window.__reconfigure({ ...c, height: 300 }), base);
    await expect.poll(rows).toBe(5);
    // the user's own rows win
    await page.evaluate((c) => window.__reconfigure({ ...c, grid_options: { rows: 2 } }), base);
    await expect.poll(rows).toBe(2);
    await expectNoErrors(page);
});

test('select menu with a preset that styles through style: (toggle-tab): options are styled on the first render, not after a click', async ({ page }) => {
    const card = await mountCase(page, 'select-menu-toggle-tab', { width: '600' });
    const backgrounds = () => card.evaluate(el => [...el.shadowRoot.querySelectorAll('lcards-button')]
        .map(b => String(b._buttonStyle?.card?.color?.background?.inactive ?? '')));
    await expect.poll(async () => (await backgrounds()).length).toBe(4);
    for (const bg of await backgrounds()) expect(bg).toContain('card-top-color');
    await expectNoErrors(page);
});

test('layout card with repeat() tracks: cards in every named area get a cell', async ({ page }) => {
    const card = await mountCase(page, 'layout-card-repeat-areas', { width: '600' });
    const sizes = () => card.evaluate(el => [...el.shadowRoot.querySelector('#grid-root').children]
        .filter(c => c.localName.startsWith('lcards-'))
        .map(c => Math.round(c.getBoundingClientRect().width)));
    await expect.poll(async () => (await sizes()).length).toBe(4);
    const [slider, ...pills] = await sizes();
    expect(slider).toBeGreaterThan(500);
    for (const w of pills) expect(w).toBeGreaterThan(150);
    await expectNoErrors(page);
});

test('layout card mediaquery: a matching query swaps the grid; it follows the viewport live', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 700 });
    const card = await mountCase(page, 'layout-card-mediaquery', { width: '600' });
    const boxes = () => card.evaluate(el => [...el.shadowRoot.querySelector('#grid-root').children]
        .filter(c => c.localName.startsWith('lcards-'))
        .map(c => { const r = c.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y) }; }));
    await expect.poll(async () => (await boxes()).length).toBe(2);
    let [a, b] = await boxes();
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBe(a.y);
    await page.setViewportSize({ width: 600, height: 700 });
    await expect.poll(async () => { const [p, q] = await boxes(); return q.y > p.y && q.x === p.x; }).toBe(true);
    await page.setViewportSize({ width: 1000, height: 700 });
    await expect.poll(async () => { const [p, q] = await boxes(); return q.y === p.y; }).toBe(true);
    await expectNoErrors(page);
});

/** Every arc in the card's SVG paths: radius and centre (from the end points, sweep and large-arc flags) */
const elbowArcs = (page) => page.locator('lcards-elbow').evaluate((el) => {
    const out = [];
    for (const p of el.shadowRoot.querySelectorAll('path')) {
        const tok = (p.getAttribute('d') ?? '').match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
        let i = 0, x = 0, y = 0, cmd = '';
        const num = () => Number(tok[i++]);
        while (i < tok.length) {
            if (/[a-zA-Z]/.test(tok[i])) cmd = tok[i++];
            if (cmd === 'M' || cmd === 'L') { x = num(); y = num(); }
            else if (cmd === 'H') x = num();
            else if (cmd === 'V') y = num();
            else if (cmd === 'A') {
                const r = num(); num(); num(); const large = num(); const sweep = num(); const nx = num(); const ny = num();
                if (r > 0.01) {
                    const mx = (x + nx) / 2, my = (y + ny) / 2, dx = nx - x, dy = ny - y, d = Math.hypot(dx, dy);
                    const h = Math.sqrt(Math.max(0, r * r - (d / 2) ** 2)), s = large !== sweep ? 1 : -1;
                    out.push({ r, cx: mx - s * h * dy / d, cy: my + s * h * dx / d, path: p.id || '' });
                }
                x = nx; y = ny;
            } else i++;
        }
    }
    return out;
});
/** Pairs of arcs on one centre (within 0.5 px): the bends, as [outer r, inner r] */
const bends = (arcs) => {
    const out = [];
    for (const a of arcs) for (const b of arcs) {
        if (a !== b && a.r > b.r && a.path === b.path && Math.hypot(a.cx - b.cx, a.cy - b.cy) < 0.5) out.push([a.r, b.r]);
    }
    return out;
};

test('elbow concentric band: a thin inner band keeps one width round the bend (arcs on one centre, a bar apart)', async ({ page }) => {
    await mountCase(page, 'elbow-concentric-band', { height: '200' });
    await expect.poll(async () => (await elbowArcs(page)).length).toBeGreaterThan(3);
    const band = bends(await elbowArcs(page)).filter(([o, i]) => Math.abs(o - i - 6) < 0.5);
    expect(band.length).toBeGreaterThan(0); // the band's outer and inner arcs: one centre, 6 apart
    await expectNoErrors(page);
});

test('elbow thin frame: the turning corners stay one width, the open side ends square', async ({ page }) => {
    await mountCase(page, 'elbow-frame-thin', { height: '200' });
    await expect.poll(async () => (await elbowArcs(page)).length).toBeGreaterThan(0);
    const arcs = await elbowArcs(page);
    expect(arcs).toHaveLength(4); // two corners, outer and inner each; none at the open ends
    expect(bends(arcs).map(([o, i]) => [Math.round(o), Math.round(i)])).toEqual([[60, 48], [60, 48]]);
});

test('elbow thin simple: equal thin bars with a large curve keep one width round the bend', async ({ page }) => {
    await mountCase(page, 'elbow-thin-simple', { height: '200' });
    await expect.poll(async () => (await elbowArcs(page)).length).toBeGreaterThan(0);
    expect(bends(await elbowArcs(page)).map(([o, i]) => [Math.round(o), Math.round(i)])).toEqual([[60, 48]]);
});

test('elbow bar-slant-right: the bar is the whole card, slanted at the right end, with its label on it', async ({ page }) => {
    const card = await mountCase(page, 'elbow-bar-slant', { width: '300' });
    const info = () => card.evaluate(el => ({
        d: el.shadowRoot.querySelector('path')?.getAttribute('d') ?? '',
        text: [...el.shadowRoot.querySelectorAll('text')].map(t => t.textContent.trim()).join(' '),
    }));
    await expect.poll(async () => (await info()).text).toContain('LCARS');
    const { d } = await info();
    const pts = [...d.matchAll(/[ML] ([\d.]+) ([\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
    expect(pts).toHaveLength(4);
    expect(pts[1][0]).toBeGreaterThan(pts[2][0]); // top edge longer than the bottom: the right end is cut
    await expectNoErrors(page);
});

test('button components brackets and radar render their segments', async ({ page }) => {
    for (const [name, ids] of [['button-brackets', ['left', 'right']], ['button-radar', ['sweep', 'rings', 'rim']]]) {
        const card = await mountCase(page, name, { width: '200' });
        await expect.poll(() => card.evaluate((el, want) => want.filter(id => el.shadowRoot.querySelector(`#${id}`)).length, ids)).toBe(ids.length);
        await expectNoErrors(page);
    }
});

test('a component text field can use the whole symbol (zone: full), as a plain button can', async ({ page }) => {
    const card = await mountCase(page, 'button-alert-symbol', { height: '220' });
    await expect.poll(() => card.evaluate((el) => !!el.shadowRoot.querySelector('text'))).toBe(true);
    const r = await card.evaluate((el) => {
        const zones = el._processedSvg?.componentZones ?? {};
        const corner = [...el.shadowRoot.querySelectorAll('text')].find((t) => t.textContent.trim() === 'FULL');
        return { keys: Object.keys(zones), y: corner ? Number(corner.getAttribute('y')) : null, alertTop: zones.alert_line?.y };
    });
    expect(r.keys).toEqual(['alert_line', 'sub_line', 'full']);
    // the corner text sits at the top of the symbol, above the label zones (alert_line starts at y 25.26)
    expect(r.y).not.toBeNull();
    expect(r.y).toBeLessThan(r.alertTop);
});

test('button: a label set to an empty string stays empty (not the preset\'s template source)', async ({ page }) => {
    await mountCase(page, 'button-empty-label');
    await page.waitForTimeout(500);
    const text = await page.locator('lcards-button').evaluate(el => [...el.shadowRoot.querySelectorAll('text')].map(t => t.textContent).join('|'));
    expect(text).not.toContain('return');
    expect(text).not.toContain('Math.random');
    await expectNoErrors(page);
});

test('button-interactive: a button with no entity and no action is decorative (arrow, no hover colour); with an entity it is interactive', async ({ page }) => {
    /** @param {string} name */
    const probe = async (name) => {
        await mountCase(page, name);
        const read = () => page.evaluate(() => {
            const card = /** @type {any} */ (document.querySelector('#mount > *'));
            const g = card.shadowRoot.querySelector('[data-overlay-id="button"]');
            const bg = card.shadowRoot.querySelector('[data-overlay-id="button"] path, [data-overlay-id="button"] rect');
            return { cursor: getComputedStyle(g).cursor, fill: bg ? getComputedStyle(bg).fill : null };
        });
        const before = await read();
        const box = await page.locator('#mount > *').boundingBox();
        if (!box) throw new Error('no card');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(300);
        const after = await read();
        await page.mouse.move(0, 0);
        return { before, after };
    };
    const deco = await probe('button-decorative');
    expect(deco.before.cursor).toBe('default');
    expect(deco.after.fill).toBe(deco.before.fill);
    await expectNoErrors(page);
    const live = await probe('button-decorative-twin');
    expect(live.before.cursor).toBe('pointer');
    await expectNoErrors(page);
});
