/**
 * Layer C: smoke tests against the real dev HA (see playwright.ha.config.js).
 * Fixtures (lcards_test_* helpers, lcards-test dashboard) are created if missing.
 */
import { test, expect } from '@playwright/test';
import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { HAClient, HA_URL, TEST_DASHBOARD, readToken, ensureHelpers, ensureDashboard, setInputNumberMax } from './ha-client.mjs';

const TOKEN = readToken();
/** The fixed LCARdS device id the tests' browser uses (see openDashboard). */
const TEST_DEVICE_ID = '1c4d5e57-0000-4000-8000-00000000c0de';
const PKG_VERSION = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')).version;

test.skip(!TOKEN, 'HA_TOKEN (or .ha-token) not set: skipping real-HA smoke tests');

/** @type {HAClient} */
let client;

test.beforeAll(async () => {
    client = await HAClient.connect(TOKEN);
    await ensureHelpers(client);
    await ensureDashboard(client);
});

test.afterAll(() => client?.close());

/** Log in with the token and collect LCARdS errors from the page. */
async function openDashboard(page, path, dashboard = TEST_DASHBOARD) {
    const errors = [];
    page.on('pageerror', (e) => { if (/lcards/i.test(`${e.message}\n${e.stack}`)) errors.push(`pageerror: ${e.message}`); });
    page.on('console', (m) => {
        if (m.type() === 'error' && /lcards/i.test(`${m.text()} ${m.location()?.url ?? ''}`)) errors.push(m.text().slice(0, 500));
    });
    await page.addInitScript(({ token, hassUrl, deviceId }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
        // One device for every run: a fresh profile would register a new _device_* storage key each time.
        localStorage.setItem('lcards_device_id', deviceId);
    }, { token: TOKEN, hassUrl: HA_URL, deviceId: TEST_DEVICE_ID });
    await page.goto(`/${dashboard}/${path}`);
    // HA shell rendered with live hass, and the LCARdS core up.
    await page.waitForFunction(() => {
        const ha = document.querySelector('home-assistant');
        return !!(ha?.shadowRoot && ha.hass?.states && window.lcards?.core?.themeManager);
    }, null, { timeout: 30_000 });
    // The loader stub loads the main chunk asynchronously; cards are defined after core init.
    await page.evaluate(() => customElements.whenDefined('lcards-button'));
    return errors;
}

const settle = (page, ms = 1500) => page.waitForTimeout(ms);

test.beforeEach(async () => {
    await client.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_toggle' });
    await client.callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.lcards_test_visible' });
    await client.callService('lcards', 'clear_alert');
    await client.callService('input_select', 'select_option', { entity_id: 'input_select.lcards_test_mode', option: 'alpha' });
    await setInputNumberMax(client, 'lcards_test_value', 100);
});

test('cards view loads without LCARdS errors; integration version matches package.json', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await expect(page.locator('lcards-button').first()).toBeVisible();
    await expect(page.locator('lcards-data-grid')).toContainText('Toggle');
    await settle(page);
    expect(errors).toEqual([]);
    const info = await client.call({ type: 'lcards/info' });
    expect(info.version).toBe(PKG_VERSION);
});

test('toggle button flips the input_boolean', async ({ page }) => {
    await openDashboard(page, 'cards');
    const button = page.locator('lcards-button', { hasText: 'TOGGLE' });
    await button.locator('path.button-bg').click();
    await expect.poll(async () => (await client.getState('input_boolean.lcards_test_toggle'))?.state).toBe('on');
});

test('more-info tap opens HA\'s more-info dialog', async ({ page }) => {
    await openDashboard(page, 'cards');
    await page.locator('lcards-button', { hasText: 'MORE INFO' }).locator('path.button-bg').click();
    await expect(page.locator('ha-more-info-dialog')).toBeAttached();
    await expect(page.locator('ha-more-info-dialog')).toContainText('LCARdS Test Value');
});

test('lcards.red_alert / clear_alert services switch the alert mode on the page', async ({ page }) => {
    await openDashboard(page, 'cards');
    const mode = () => page.evaluate(() => window.lcards.core.themeManager.getAlertMode());
    // The page follows the helper only once the helper manager has seen it (its first
    // hass snapshot): a change before that is the page's starting state, not a change.
    await page.waitForFunction(() => window.lcards.core.helperManager?._valueCache?.get('alert_mode') === 'green_alert', null, { timeout: 15_000 });
    // The mode updates after the alert transition plays, which can take several seconds.
    await client.callService('lcards', 'red_alert');
    await expect.poll(mode, { timeout: 15_000 }).toBe('red_alert');
    await client.callService('lcards', 'clear_alert');
    await expect.poll(mode, { timeout: 15_000 }).toBe('green_alert');
});

/** Every lazily loaded card editor and a config that opens it. */
const EDITORS = [
    ['lcards-button', { type: 'custom:lcards-button', entity: 'input_boolean.lcards_test_toggle', preset: 'lozenge' }],
    ['lcards-elbow', { type: 'custom:lcards-elbow', elbow: { type: 'header-left' } }],
    ['lcards-slider', { type: 'custom:lcards-slider', entity: 'input_number.lcards_test_value' }],
    ['lcards-chart', { type: 'custom:lcards-chart', sources: [{ entity: 'input_number.lcards_test_value' }] }],
    ['lcards-data-grid', { type: 'custom:lcards-data-grid', data_mode: 'decorative' }],
    ['lcards-msd-card', { type: 'custom:lcards-msd-card', msd: { base_svg: { source: 'none' }, view_box: [0, 0, 600, 300] } }],
    ['lcards-alert-overlay', { type: 'custom:lcards-alert-overlay' }],
    ['lcards-select-menu', { type: 'custom:lcards-select-menu', entity: 'input_select.lcards_test_mode' }],
    ['lcards-layout-card', { type: 'custom:lcards-layout-card', cards: [] }],
];

/** Mount a card's editor inside home-assistant (HA's Lit contexts resolve there). */
async function mountEditor(page, tag, config) {
    return page.evaluate(async ({ tag, config }) => {
        const editor = await customElements.get(tag).getConfigElement();
        const ha = document.querySelector('home-assistant');
        editor.hass = ha.hass;
        editor.setConfig(config);
        editor.id = 'lcards-test-editor';
        ha.shadowRoot.appendChild(editor);
        return editor.localName;
    }, { tag, config });
}

/** lcards-* elements in the editor's rendered tree that never got defined. */
const undefinedLcardsElements = (page) => page.evaluate(() => {
    const out = new Set();
    const walk = (root) => {
        for (const el of root.querySelectorAll('*')) {
            if (el.localName.startsWith('lcards-') && !customElements.get(el.localName)) out.add(el.localName);
            if (el.shadowRoot) walk(el.shadowRoot);
        }
    };
    const editor = document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-editor');
    if (editor?.shadowRoot) walk(editor.shadowRoot);
    return [...out];
});

const removeEditor = (page) => page.evaluate(() =>
    document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-editor')?.remove());

test('every card editor loads on demand and renders inside HA; cards are offered to the picker', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    const types = await page.evaluate(() => (window.customCards ?? []).map(c => c.type));
    for (const t of ['lcards-button', 'lcards-chart', 'lcards-slider', 'lcards-elbow', 'lcards-data-grid']) {
        expect(types).toContain(t);
    }
    for (const [tag, config] of EDITORS) {
        const editorTag = await mountEditor(page, tag, config);
        expect(editorTag).toMatch(/^lcards-.*-editor$/);
        const editor = page.locator('#lcards-test-editor');
        // Tabbed editors show a tab group (nested; the first is the top level); the
        // layout card editor is a single "Open Layout Studio" panel instead.
        const root = tag === 'lcards-layout-card' ? editor.getByText('Open Layout Studio') : editor.locator('ha-tab-group').first();
        await expect(root, tag).toBeVisible({ timeout: 15_000 });
        await expect(editor.locator('ha-alert[alert-type="error"]')).toHaveCount(0);
        // Split-bundle guard: an editor must not rely on elements another chunk defines.
        await page.waitForTimeout(300);
        expect(await undefinedLcardsElements(page), tag).toEqual([]);
        await removeEditor(page);
    }
    await settle(page);
    expect(errors).toEqual([]);
});

test('rules editor shows the refresh notice for edited or removed rules', async ({ page }) => {
    await openDashboard(page, 'cards');
    await mountEditor(page, 'lcards-button', EDITORS[0][1]); // loads the rules dashboard with the editor
    const text = await page.evaluate(async () => {
        const el = document.createElement('lcards-rules-dashboard');
        el.hass = document.querySelector('home-assistant').hass;
        el.cardId = 'test';
        document.querySelector('home-assistant').shadowRoot.appendChild(el);
        await el.updateComplete;
        const notice = el.shadowRoot.querySelector('.refresh-notice');
        const out = notice?.textContent.replace(/\s+/g, ' ').trim() ?? null;
        el.remove();
        return out;
    });
    expect(text).toContain('apply after a page refresh');
    await removeEditor(page);
});

test('config panel loads on demand from the sidebar URL', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    const panelChunks = [];
    page.on('request', r => { if (/\/chunks\/lcards-config-panel-[^/]+\.js$/.test(r.url())) panelChunks.push(r.url()); });
    await page.goto('/lcards-config');
    await expect(page.locator('lcards-config-panel-impl')).toBeAttached({ timeout: 20_000 });
    await expect(page.locator('lcards-config-panel-impl ha-tab-group').first()).toBeVisible();
    expect(panelChunks).toHaveLength(1);
    await settle(page);
    expect(errors).toEqual([]);
});

test('layout view edit mode loads the grid edit overlay on demand', async ({ page }) => {
    const errors = await openDashboard(page, 'layout');
    expect(await page.evaluate(() => !!customElements.get('lcards-grid-edit-overlay'))).toBe(false);
    await page.goto(`/${TEST_DASHBOARD}/layout?edit=1`);
    await expect(page.locator('lcards-grid-edit-overlay')).toBeAttached({ timeout: 20_000 });
    // Created first, defined (upgraded) once its chunk arrives.
    await expect.poll(() => page.evaluate(() => !!customElements.get('lcards-grid-edit-overlay'))).toBe(true);
    await settle(page);
    expect(errors).toEqual([]);
});

async function seedHistory() {
    for (const value of [20, 60, 35, 80]) {
        await client.callService('input_number', 'set_value', { entity_id: 'input_number.lcards_test_value', value });
        await new Promise(r => setTimeout(r, 400));
    }
}

test('chart (sections view) draws recorder history of the test helper', async ({ page }) => {
    await seedHistory();
    const errors = await openDashboard(page, 'chart-sections');
    const series = page.locator('lcards-chart .apexcharts-series path').first();
    await expect(series).toBeAttached({ timeout: 20_000 });
    expect((await series.getAttribute('d'))?.length).toBeGreaterThan(10);
    expect(errors).toEqual([]);
});

// Known limitation: the chart sizes to 100% of its parent and masonry columns give it
// no definite height, so it renders 0px tall. Masonry is not a supported target.
test.fixme('chart (masonry view) gets a real height and draws', async ({ page }) => {
    const errors = await openDashboard(page, 'chart-masonry');
    const container = page.locator('lcards-chart .chart-container');
    await expect(container).toBeAttached();
    await expect.poll(async () => (await container.boundingBox())?.height ?? 0, { timeout: 15_000 }).toBeGreaterThan(50);
    await expect(page.locator('lcards-chart .apexcharts-canvas')).toBeVisible();
    expect(errors).toEqual([]);
});

test('layout view: a visibility-conditioned card hides and its row collapses', async ({ page }) => {
    const errors = await openDashboard(page, 'layout');
    const conditional = page.locator('lcards-button', { hasText: 'CONDITIONAL' });
    const rows = () => page.evaluate(() => {
        const find = (root) => {
            for (const el of root.querySelectorAll('*')) {
                if (el.localName === 'lcards-layout-view') return el;
                if (el.shadowRoot) { const hit = find(el.shadowRoot); if (hit) return hit; }
            }
            return null;
        };
        const view = find(document);
        const grid = view?.shadowRoot?.querySelector('#grid-root') ?? view?.querySelector('#grid-root');
        return grid ? getComputedStyle(grid).gridTemplateRows.split(' ')[0] : null;
    });
    await expect(conditional).toBeVisible();
    expect(await rows()).toBe('80px');
    await client.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_visible' });
    await expect(conditional).toBeHidden();
    await expect.poll(rows).toBe('0px');
    await client.callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.lcards_test_visible' });
    await expect(conditional).toBeVisible();
    await expect.poll(rows).toBe('80px');
    expect(errors).toEqual([]);
});

test('msd view routes its lines', async ({ page }) => {
    const errors = await openDashboard(page, 'msd');
    await expect.poll(() => page.locator('lcards-msd-card [data-overlay-id] path, lcards-msd-card path[data-overlay-id]').count(), { timeout: 15_000 })
        .toBeGreaterThanOrEqual(2);
    expect(errors).toEqual([]);
});

test('read-only sweep: every lcards-regression view loads without LCARdS errors', async ({ page }) => {
    const config = await client.call({ type: 'lovelace/config', url_path: 'lcards-regression' }).catch(() => null);
    test.skip(!config, 'lcards-regression dashboard not found');
    const errors = await openDashboard(page, '0', 'lcards-regression');
    for (let i = 0; i < config.views.length; i++) {
        const before = errors.length;
        if (i > 0) await page.goto(`/lcards-regression/${config.views[i].path ?? i}`);
        await page.waitForFunction(() => !!window.lcards?.core);
        await settle(page, 2500);
        for (const e of errors.slice(before)) errors[errors.indexOf(e)] = `[view ${config.views[i].title ?? i}] ${e}`;
    }
    expect(errors).toEqual([]);
});

// ── S2 regressions ───────────────────────────────────────────────────────

/** Computed fill of a button's background (normalised to rgb()), found by its label text. */
const buttonFill = (page, label) => page.locator('lcards-button', { hasText: label }).locator('path.button-bg')
    .evaluate(el => getComputedStyle(el).fill);

test('rules: entity_attr condition follows the attribute (S2 fix)', async ({ page }) => {
    const errors = await openDashboard(page, 'rules');
    await expect.poll(() => buttonFill(page, 'ATTR RULE')).toBe('rgb(51, 51, 102)');
    // Regression: `entity_attr:` rules never matched, and were indexed under the domain.
    await setInputNumberMax(client, 'lcards_test_value', 200);
    await expect.poll(() => buttonFill(page, 'ATTR RULE'), { timeout: 10_000 }).toBe('rgb(204, 0, 0)');
    await setInputNumberMax(client, 'lcards_test_value', 100);
    await expect.poll(() => buttonFill(page, 'ATTR RULE'), { timeout: 10_000 }).toBe('rgb(51, 51, 102)');
    expect(errors).toEqual([]);
});

test('rules: a card moved in the DOM (disconnect, reconnect) still follows its rules', async ({ page }) => {
    const errors = await openDashboard(page, 'rules');
    await expect.poll(() => buttonFill(page, 'ATTR RULE')).toBe('rgb(51, 51, 102)');
    // HA moves cards between columns while laying out a view: the disconnect
    // unregistered the card from the rules engine and nothing registered it again.
    await page.locator('lcards-button', { hasText: 'ATTR RULE' }).evaluate((card) => {
        const parent = card.parentNode, next = card.nextSibling;
        card.remove();
        parent.insertBefore(card, next);
    });
    await setInputNumberMax(client, 'lcards_test_value', 200);
    await expect.poll(() => buttonFill(page, 'ATTR RULE'), { timeout: 10_000 }).toBe('rgb(204, 0, 0)');
    await setInputNumberMax(client, 'lcards_test_value', 100);
    await expect.poll(() => buttonFill(page, 'ATTR RULE'), { timeout: 10_000 }).toBe('rgb(51, 51, 102)');
    expect(errors).toEqual([]);
});

test('rules: `condition: |` block-scalar JavaScript rule matches (S2 fix)', async ({ page }) => {
    const errors = await openDashboard(page, 'rules');
    await expect.poll(() => buttonFill(page, 'JS RULE')).toBe('rgb(51, 51, 102)');
    // Regression: the trailing newline of a YAML block scalar broke [[[ ]]] parsing.
    await client.callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.lcards_test_toggle' });
    await expect.poll(() => buttonFill(page, 'JS RULE'), { timeout: 10_000 }).toBe('rgb(0, 170, 0)');
    await client.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_toggle' });
    await expect.poll(() => buttonFill(page, 'JS RULE'), { timeout: 10_000 }).toBe('rgb(51, 51, 102)');
    expect(errors).toEqual([]);
});

test('templates: {token} and {{ jinja }} mixed in one label both render (S2 fix)', async ({ page }) => {
    const errors = await openDashboard(page, 'rules');
    const label = page.locator('lcards-button', { has: page.locator('text[data-field-id="label"]') })
        .filter({ hasText: '/' }).locator('text[data-field-id="label"]');
    // Regression: token replacement blanked the inside of {{ }}, sending "off / {}" to HA.
    await expect(label).toHaveText(/^off \/ alpha$/i, { timeout: 10_000 });
    await client.callService('input_select', 'select_option', { entity_id: 'input_select.lcards_test_mode', option: 'gamma' });
    await client.callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.lcards_test_toggle' });
    await expect(label).toHaveText(/^on \/ gamma$/i, { timeout: 10_000 });
    expect(errors).toEqual([]);
});

test('theme overrides: startup load does not re-process cards; a real change does', async ({ page }) => {
    await openDashboard(page, 'cards');
    await page.waitForTimeout(1000); // past the startup override load and its 50 ms debounce
    const result = await page.evaluate(async () => {
        const tm = window.lcards.core.themeManager;
        let events = 0;
        window.addEventListener('lcards:theme-overrides-changed', () => { events++; });
        const wait = () => new Promise(r => setTimeout(r, 200));
        await tm.loadOverrides();            // unchanged: no event
        await wait();
        const afterReload = events;
        await tm.setOverride('colors.ui.primary', '#123456', 'device');
        await wait();
        const value = tm.resolver.resolve('colors.ui.primary');
        const afterSet = events;
        await tm.clearOverride('colors.ui.primary', 'device');
        await wait();
        return { afterReload, afterSet, afterClear: events, value };
    });
    expect(result).toEqual({ afterReload: 0, afterSet: 1, afterClear: 2, value: '#123456' });
});

/**
 * Data source studio (S8): the Processing tab previews the pipeline over the
 * entity's real history, edits processors inline, and reports pipeline errors.
 */
async function openStudio(page, { mode = 'edit', config }) {
    await mountEditor(page, 'lcards-elbow', EDITORS[1][1]); // its chunk defines the studio dialog
    await page.evaluate(async ({ mode, config }) => {
        await customElements.whenDefined('lcards-datasource-studio-dialog');
        const ha = document.querySelector('home-assistant');
        const dialog = document.createElement('lcards-datasource-studio-dialog');
        dialog.id = 'lcards-test-studio';
        dialog.hass = ha.hass;
        dialog.mode = mode;
        if (mode === 'edit') { dialog.sourceName = 'lab'; dialog.sourceConfig = config; }
        ha.shadowRoot.appendChild(dialog);
        dialog.open = true;
        await dialog.updateComplete;
    }, { mode, config });
    return page.locator('#lcards-test-studio');
}
const closeStudio = (page) => page.evaluate(() => document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-studio')?.remove());
const studioConfig = (page) => page.evaluate(() => document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-studio')._workingConfig);

test('chart studio: "Manage data sources" opens an HA dialog with the content inset from its edges', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await mountEditor(page, 'lcards-chart', EDITORS[3][1]);
    await page.evaluate(async () => {
        const editor = document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-editor');
        await editor.updateComplete;
        await editor._openChartStudio();
    });
    const studio = page.locator('lcards-chart-studio-dialog');
    await studio.getByRole('button', { name: 'Manage data sources' }).click();
    const sources = studio.locator('ha-dialog.datasources-dialog');
    const tab = sources.locator('lcards-datasource-editor-tab');
    await expect(tab.locator('.launcher')).toBeVisible();
    // The launcher sits inside the dialog's padding, not against its sides.
    const gaps = await sources.evaluate(d => {
        const panel = d.shadowRoot.querySelector('wa-dialog').shadowRoot.querySelector('[part~="dialog"]').getBoundingClientRect();
        const launcher = d.querySelector('lcards-datasource-editor-tab').shadowRoot.querySelector('.launcher').getBoundingClientRect();
        return { left: launcher.left - panel.left, right: panel.right - launcher.right };
    });
    expect(gaps.left).toBeGreaterThanOrEqual(12);
    expect(gaps.right).toBeGreaterThanOrEqual(12);
    // Add source opens the data source studio with its inset inside the dialog's padding;
    // Cancel returns to the data sources dialog.
    await tab.getByRole('button', { name: 'Add source' }).click();
    const add = tab.locator('lcards-datasource-studio-dialog');
    await expect(add.locator('.studio-layout')).toBeVisible();
    const addGaps = await add.evaluate(el => {
        const d = el.shadowRoot.querySelector('ha-dialog');
        const panel = d.shadowRoot.querySelector('wa-dialog').shadowRoot.querySelector('[part~="dialog"]').getBoundingClientRect();
        const inset = el.shadowRoot.querySelector('.studio-layout').getBoundingClientRect();
        return { left: inset.left - panel.left, right: panel.right - inset.right };
    });
    expect(addGaps.left).toBeGreaterThanOrEqual(12);
    expect(addGaps.right).toBeGreaterThanOrEqual(12);
    await add.getByRole('button', { name: 'Cancel' }).click();
    await expect(add.locator('.studio-layout')).toHaveCount(0);
    await expect(tab.locator('.launcher')).toBeVisible();
    // Close shuts this dialog only; the chart studio stays open.
    await sources.locator('ha-button[data-dialog="close"]').click();
    await expect(sources).toHaveCount(0);
    await expect(studio.getByRole('button', { name: 'Manage data sources' })).toBeVisible();
    await page.evaluate(() => document.querySelector('lcards-chart-studio-dialog')?.remove()
        ?? document.querySelector('home-assistant').shadowRoot.querySelector('lcards-chart-studio-dialog')?.remove());
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('data source studio: the inset fills the dialog on every tab', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    const studio = await openStudio(page, { config: { entity: 'input_number.lcards_test_value' } });
    const layout = studio.locator('.studio-layout');
    await expect(layout).toHaveCount(1);
    // offsetHeight: layout size, unaffected by the dialog's opening scale
    const height = () => layout.evaluate(el => el.offsetHeight);
    const minimum = await page.evaluate(() => window.innerHeight * 0.6);
    const tabs = studio.locator('.config-panel').getByRole('tab');
    const heights = [];
    for (let i = 0; i < await tabs.count(); i++) {
        await tabs.nth(i).click();
        heights.push(await height());
    }
    expect(heights.length).toBeGreaterThan(1);
    for (const h of heights) {
        expect(h).toBeGreaterThan(minimum);
        expect(Math.abs(h - heights[0])).toBeLessThan(2);
    }
    await closeStudio(page);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('data source studio: the preview shows real history beside the tabs; processors edit inline', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    for (const value of [20, 40, 30, 60]) {
        await client.callService('input_number', 'set_value', { entity_id: 'input_number.lcards_test_value', value });
    }
    const studio = await openStudio(page, { config: {
        entity: 'input_number.lcards_test_value',
        processing: { smoothed: { type: 'smooth', alpha: 0.3 } },
    } });
    await studio.getByRole('tab', { name: 'Processing' }).click();

    const preview = studio.locator('lcards-processor-preview');
    const series = preview.locator('.apexcharts-series[seriesName]');
    await expect(preview.locator('.apexcharts-svg')).toBeVisible({ timeout: 20_000 });
    await expect(series).toHaveCount(2); // raw + smoothed
    await expect(preview.locator('.meta')).toContainText('input_number.lcards_test_value');

    // The span is configurable: the data source's own (6 h) by default, any of the offered spans on demand.
    const previewHours = () => preview.evaluate(el => el._history?.hours);
    expect(await previewHours()).toBe(6);
    await preview.locator('ha-selector.span').click();
    await preview.getByRole('menuitem', { name: 'Last 24 h' }).click();
    await expect.poll(previewHours).toBe(24);
    await expect(series).toHaveCount(2);

    // Add a processor inline: it appears in the tree, the form and the chart.
    await studio.getByRole('button', { name: 'Add' }).click();
    await studio.getByRole('button', { name: 'Create' }).click();
    await expect(studio.locator('lcards-processor-tree-editor .node')).toHaveCount(2);
    await expect(series).toHaveCount(3);
    expect(Object.keys((await studioConfig(page)).processing)).toEqual(['smoothed', 'smooth']);

    // "Use in a chart": an lcards-chart config for this source, over the span the preview shows.
    await studio.locator('.chart-yaml summary').click();
    const chartText = await studio.locator('ha-code-editor.chart-yaml-code').evaluate(el => el.value);
    const chart = yaml.load(chartText);
    expect(chart.type).toBe('custom:lcards-chart');
    expect(chart.graph_span).toBe('24h');
    expect(chart.sources.map(src => src.buffer ?? 'raw')).toEqual(['raw', 'smoothed', 'smooth']);

    // Edit as YAML opens the code editor.
    await studio.getByRole('button', { name: 'Edit as YAML' }).click();
    await expect(studio.locator('lcards-processor-form lcards-yaml-editor .cm-editor')).toBeVisible();

    // Deleting a processor another one uses asks in an HA dialog, not the browser's confirm().
    page.on('dialog', d => { throw new Error(`native ${d.type()} dialog: ${d.message()}`); });
    await page.evaluate(() => {
        const d = document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-studio');
        d._workingConfig = { ...d._workingConfig, processing: { base: { type: 'round' }, top: { type: 'round', input_source: 'base' } } };
    });
    await studio.locator('lcards-processor-tree-editor .node').first().click();
    await studio.getByRole('button', { name: 'Delete' }).click();
    // (the ha-dialog host has no box of its own; its buttons do)
    const confirmDelete = page.locator('ha-dialog', { hasText: 'uses it as input' }).getByRole('button', { name: 'Delete' });
    await expect(confirmDelete).toBeVisible();
    await confirmDelete.click();
    await expect.poll(async () => Object.keys((await studioConfig(page)).processing)).toEqual(['top']);
    expect((await studioConfig(page)).processing.top.input_source).toBeUndefined();

    // A pipeline error (a cycle) is reported from the real ProcessorManager.
    await page.evaluate(() => {
        const d = document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-studio');
        d._workingConfig = { ...d._workingConfig, processing: { a: { type: 'round', input_source: 'b' }, b: { type: 'round', input_source: 'a' } } };
    });
    await expect.poll(() => studio.locator('lcards-processor-tree-editor lcards-message[type="error"]').evaluateAll(els => els.map(e => e.message).join(' ')))
        .toMatch(/Circular dependency/);

    await closeStudio(page);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('data source studio: history preload off writes enabled: false; a new source shows no errors before input', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    let studio = await openStudio(page, { config: { entity: 'input_number.lcards_test_value' } });
    await studio.getByRole('tab', { name: 'History & Timing' }).click();
    await studio.locator('ha-selector').filter({ hasText: 'Preload history' }).locator('ha-switch').click();
    await expect.poll(async () => (await studioConfig(page)).history).toEqual({ enabled: false });
    await closeStudio(page);

    studio = await openStudio(page, { mode: 'add' });
    await expect(studio.getByText('Entity is required')).toHaveCount(0);
    await studio.locator('.tab-content ha-selector').first().locator('input').fill('lab');
    await expect(studio.getByText('Entity is required')).toBeVisible();
    await closeStudio(page);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('data source studio: a new source previews its entity\'s history (no attribute placeholder in the config)', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await client.callService('input_number', 'set_value', { entity_id: 'input_number.lcards_test_value', value: 42 });
    const studio = await openStudio(page, { mode: 'add' });
    // As a user does: pick the entity on the Source tab, then open Processing.
    await page.evaluate(() => document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-studio')
        ._updateConfig('entity', 'input_number.lcards_test_value'));
    expect((await studioConfig(page)).attribute).toBeUndefined();
    await studio.getByRole('tab', { name: 'Processing' }).click();
    const preview = studio.locator('lcards-processor-preview');
    await expect.poll(() => preview.evaluate(el => el._history?.points?.length ?? -1), { timeout: 20_000 }).toBeGreaterThan(0);
    await closeStudio(page);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('data source studio: a long pipeline scrolls, so every processor is reachable', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await page.setViewportSize({ width: 1280, height: 800 });
    const processing = Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`p${i}`, { type: 'round', precision: i % 3 }]));
    const studio = await openStudio(page, { config: { entity: 'input_number.lcards_test_value', processing } });
    await studio.getByRole('tab', { name: 'Processing' }).click();
    await expect(studio.locator('lcards-processor-preview .apexcharts-svg')).toBeVisible({ timeout: 20_000 });
    // What a user can reach: after wheeling down over the dialog (a wheel can't
    // scroll an overflow: hidden box, unlike scrollIntoView), the element lies inside
    // the dialog's visible area.
    const contentBox = () => page.evaluate(() => {
        const r = document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-studio')
            .shadowRoot.querySelector('.tab-content').getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    const box = await contentBox();
    await page.mouse.move(box.x, box.y);
    for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    const inView = async (locator) => {
        const b = await locator.boundingBox();
        return !!b && b.y >= box.top - 1 && b.y + b.height <= box.bottom + 1;
    };
    const last = studio.locator('lcards-processor-tree-editor .node').last();
    // At the bottom: the form's actions and the end of the tree are on screen.
    expect(await inView(studio.getByRole('button', { name: 'Delete' }))).toBe(true);
    expect(await inView(last)).toBe(true);
    await last.click();
    await expect(last).toHaveClass(/selected/);
    // The form's actions at the bottom are reachable too.
    await studio.getByRole('button', { name: 'Delete' }).click();
    await expect(studio.locator('lcards-processor-tree-editor .node')).toHaveCount(7);
    await closeStudio(page);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

/**
 * Main Engineering (UI consistency B1): each sub-tab renders its tool, the data
 * source browser opens on the studio shell, and deleting a source other cards use
 * asks in an HA dialog.
 */
async function openMainEngineering(page, config) {
    await mountEditor(page, 'lcards-button', config);
    const editor = page.locator('#lcards-test-editor');
    await editor.getByRole('tab', { name: /Main Engineering/ }).dispatchEvent('click');
    return editor;
}

test('Main Engineering: every sub-tab renders its tool', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    const editor = await openMainEngineering(page, { type: 'custom:lcards-button', entity: 'input_boolean.lcards_test_toggle', preset: 'lozenge' });
    for (const [tab, tag] of [
        ['Data Sources', 'lcards-datasource-editor-tab'], ['Rules', 'lcards-rules-dashboard'],
        ['Theme', 'lcards-card-theme-tab'], ['Provenance', 'lcards-provenance-tab'],
        ['Templates', 'lcards-template-evaluation-tab'],
    ]) {
        await editor.getByRole('tab', { name: tab, exact: true }).dispatchEvent('click');
        await expect(editor.locator(tag), tab).toHaveCount(1);
    }
    // Only the active sub-tab is rendered.
    await expect(editor.locator('lcards-datasource-editor-tab')).toHaveCount(0);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Main Engineering: the data source browser opens on the studio shell and shows a source', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await page.evaluate(() => window.lcards.core.dataSourceManager.createDataSource('me_probe',
        { entity: 'input_number.lcards_test_value', history: { enabled: false } }, 'other-card'));
    const editor = await openMainEngineering(page, { type: 'custom:lcards-button', entity: 'input_boolean.lcards_test_toggle', preset: 'lozenge' });
    // The launcher is the black inset card (the page background), with an icon heading.
    const launcher = editor.locator('lcards-datasource-editor-tab .launcher');
    await expect(launcher.locator('.launcher-head ha-icon')).toHaveAttribute('icon', 'mdi:database-search');
    expect(await launcher.evaluate(el => {
        const probe = document.createElement('div');
        probe.style.background = 'var(--primary-background-color)';
        el.parentNode.appendChild(probe);
        const want = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return getComputedStyle(el).backgroundColor === want;
    })).toBe(true);
    await editor.getByRole('button', { name: 'Browse sources' }).dispatchEvent('click');
    const browser = editor.locator('lcards-datasource-browser');
    const layout = browser.locator('.studio-layout');
    await expect(layout).toHaveCount(1);
    // The inset fills the dialog's fixed height, whatever the detail pane holds
    // (offsetHeight: layout size, unaffected by the dialog's opening scale).
    const height = () => layout.evaluate(el => el.offsetHeight);
    const empty = await height();
    expect(empty).toBeGreaterThan(await page.evaluate(() => window.innerHeight * 0.6));
    await browser.locator('.tree-node-content', { hasText: 'me_probe' }).first().dispatchEvent('click');
    await expect(browser.locator('.detail-header h3')).toHaveText('me_probe');
    expect(Math.abs(await height() - empty)).toBeLessThan(2);
    await browser.locator('ha-button[data-dialog="close"]').dispatchEvent('click');
    await expect(browser.locator('.studio-layout')).toHaveCount(0);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Main Engineering: deleting a source other cards use asks in an HA dialog', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    page.on('dialog', d => { throw new Error(`native ${d.type()} dialog: ${d.message()}`); });
    await page.evaluate(() => window.lcards.core.dataSourceManager.createDataSource('me_shared',
        { entity: 'input_number.lcards_test_value', history: { enabled: false } }, 'other-card'));
    const editor = await openMainEngineering(page, { type: 'custom:lcards-button', entity: 'input_boolean.lcards_test_toggle', preset: 'lozenge',
        data_sources: { me_shared: { entity: 'input_number.lcards_test_value' } } });
    const item = editor.locator('lcards-card-datasources-list lcards-form-section', { hasText: 'me_shared' });
    await item.getByText('me_shared').first().dispatchEvent('click');
    await item.getByRole('button', { name: 'Remove' }).dispatchEvent('click');
    const cancel = page.locator('ha-dialog', { hasText: 'Other cards use it' }).getByRole('button', { name: 'Cancel' });
    await expect(cancel).toBeVisible();
    await cancel.click();
    // Cancelled: the source stays in the config.
    expect(await editor.evaluate(el => Object.keys(el.config.data_sources))).toEqual(['me_shared']);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

/**
 * Rules tab (B2): the shared launcher, HA dialogs for details, add/edit and
 * delete; the old lcards-dialog wrapper is gone.
 */
const RULE_CARD = { type: 'custom:lcards-button', id: 'test_attr_rule', preset: 'lozenge', rules: [{
    id: 'test-attr-rule',
    when: { entity_attr: 'input_number.lcards_test_value', attribute: 'max', above: 150 },
    apply: { overlays: { test_attr_rule: { style: { card: { color: { background: '#cc0000' } } } } } },
}] };

async function openRulesTab(page) {
    const errors = await openDashboard(page, 'rules');
    page.on('dialog', d => { throw new Error(`native ${d.type()} dialog: ${d.message()}`); });
    const editor = await openMainEngineering(page, RULE_CARD);
    await editor.getByRole('tab', { name: 'Rules', exact: true }).dispatchEvent('click');
    const dash = editor.locator('lcards-rules-dashboard');
    await expect(dash.locator('.launcher')).toBeVisible();
    return { errors, editor, dash };
}
const editorRules = (page) => page.evaluate(() =>
    document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-editor').config.rules ?? []);

test("Rules: the launcher counts rules; this card's rules edit as YAML, others' are read-only", async ({ page }) => {
    const { errors, dash } = await openRulesTab(page);
    await expect(dash.locator('.launcher-stats')).toContainText('1 targeting this card');
    await expect(dash.locator('.rules-table tr', { hasText: 'test-attr-rule' }).first()).toBeVisible();

    // Another card's rule: read-only YAML, no engine keys.
    await dash.getByText('All rules on this page').first().dispatchEvent('click');
    await dash.locator('tr', { hasText: 'test-js-rule' }).getByRole('button', { name: 'View rule' }).click();
    const dialog = dash.locator('ha-dialog.rule-details');
    const yamlEditor = dialog.locator('lcards-yaml-editor');
    expect(await yamlEditor.evaluate(el => el.readOnly)).toBe(true);
    const viewed = yaml.load(await yamlEditor.evaluate(el => el.value));
    expect(viewed.id).toBe('test-js-rule');
    expect(Object.keys(viewed).filter(k => k.startsWith('_'))).toEqual([]);
    await dialog.locator('ha-button[data-dialog="close"]').click();
    await expect(dialog).toHaveCount(0);

    // This card's rule: edit the whole rule as YAML; Save takes what was just typed.
    await dash.locator('.rules-table tr', { hasText: 'test-attr-rule' }).first().getByRole('button', { name: 'Edit as YAML' }).click();
    expect(await yamlEditor.evaluate(el => el.readOnly)).toBe(false);
    expect(await yamlEditor.evaluate(el => Object.keys(el.schema.properties.apply.properties.overlays.properties)))
        .toEqual(expect.arrayContaining(['test_attr_rule']));
    await yamlEditor.locator('.cm-content').click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('\npriority: 7');
    await dialog.getByRole('button', { name: 'Save' }).click();
    await expect(dialog).toHaveCount(0);
    expect((await editorRules(page))[0].priority).toBe(7);
    // The engine still runs the old version until a refresh, and the row says so.
    await expect(dash.locator('.rules-table tr', { hasText: 'test-attr-rule' }).first().locator('.pending'))
        .toHaveText('Changed: refresh to apply');
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Rules: a new rule shows in the list at once', async ({ page }) => {
    const { errors, dash } = await openRulesTab(page);
    await dash.getByRole('button', { name: 'Add rule' }).click();
    const ruleDialog = dash.locator('lcards-rule-editor-dialog');
    await ruleDialog.getByRole('textbox', { name: 'Rule ID' }).fill('test-new-rule');
    await ruleDialog.getByRole('button', { name: 'Start with test_attr_rule' }).click();
    await ruleDialog.locator('lcards-yaml-editor .cm-content').click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('text:\n  label:\n    content: NEW');
    await ruleDialog.getByRole('button', { name: 'Create rule' }).click(); // right away: Save flushes the YAML
    await expect(ruleDialog.locator('ha-dialog')).toHaveCount(0);
    const rules = await editorRules(page);
    expect(rules.find(r => r.id === 'test-new-rule')?.apply?.overlays?.test_attr_rule?.text?.label?.content).toBe('NEW');
    await expect(dash.locator('.launcher-stats')).toContainText('2 targeting this card');
    await expect(dash.locator('.rules-table tr', { hasText: 'test-new-rule' }).first()).toBeVisible();
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Rules: "Start with this card" on a card without an id asks for one and sets it', async ({ page }) => {
    const errors = await openDashboard(page, 'rules');
    page.on('dialog', d => { throw new Error(`native ${d.type()} dialog: ${d.message()}`); });
    const editor = await openMainEngineering(page, { type: 'custom:lcards-button', entity: 'input_boolean.lcards_test_toggle', preset: 'lozenge' });
    await editor.getByRole('tab', { name: 'Rules', exact: true }).dispatchEvent('click');
    const dash = editor.locator('lcards-rules-dashboard');
    await dash.getByRole('button', { name: 'Add rule' }).click();
    const apply = dash.locator('lcards-rule-apply-editor');
    await apply.getByRole('button', { name: 'Start with this card' }).click();
    const prompt = page.locator('ha-dialog', { hasText: 'Rules target cards by id' });
    await expect(prompt.getByRole('textbox')).toHaveValue('lcards_test_toggle');
    await prompt.getByRole('button', { name: 'Set id' }).click();
    await expect.poll(() => editor.evaluate(el => el.config.id)).toBe('lcards_test_toggle');
    await expect(apply.locator('lcards-yaml-editor .cm-content')).toContainText('lcards_test_toggle:');
    expect(await apply.locator('lcards-yaml-editor').evaluate(el => Object.keys(el.schema.properties.overlays.properties)))
        .toContain('lcards_test_toggle');
    await dash.locator('lcards-rule-editor-dialog').getByRole('button', { name: 'Cancel' }).click();
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Rules: Add rule opens the rule editor in an HA dialog; only the ID is required', async ({ page }) => {
    const { errors, dash } = await openRulesTab(page);
    expect(await page.evaluate(() => customElements.get('lcards-dialog'))).toBeUndefined();
    const ruleDialog = dash.locator('lcards-rule-editor-dialog');
    for (let round = 0; round < 2; round++) { // reopens after Cancel
        await dash.getByRole('button', { name: 'Add rule' }).click();
        await expect(ruleDialog.locator('ha-dialog')).toHaveAttribute('header-title', 'Add Rule');
        const required = await ruleDialog.evaluate(el => [...el.shadowRoot.querySelectorAll('.identity-grid ha-selector, .identity-right ha-selector')]
            .filter(s => s.selector?.text || s.selector?.number).map(s => [s.label, s.required]));
        expect(required).toEqual([['Rule ID', true], ['Name (optional)', false], ['Priority', false]]);
        await ruleDialog.getByRole('button', { name: 'Cancel' }).click();
        await expect(ruleDialog.locator('ha-dialog')).toHaveCount(0);
    }
    // The editor around it is still open.
    await expect(dash.locator('.launcher')).toBeVisible();
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Rules: deleting a rule asks in an HA dialog; Cancel keeps it, Delete removes it', async ({ page }) => {
    const { errors, dash } = await openRulesTab(page);
    const confirm = page.locator('ha-dialog', { hasText: "removed from this card's config" });
    await dash.getByRole('button', { name: 'Delete rule' }).first().click();
    await confirm.getByRole('button', { name: 'Cancel' }).click();
    expect((await editorRules(page)).map(r => r.id)).toEqual(['test-attr-rule']);
    await dash.getByRole('button', { name: 'Delete rule' }).first().click();
    await confirm.getByRole('button', { name: 'Delete' }).click();
    await expect.poll(async () => (await editorRules(page)).length).toBe(0);
    // Still running until a refresh: listed as removed, with no edit buttons.
    await dash.getByText('All rules on this page').first().dispatchEvent('click');
    const removedRow = dash.locator('.rules-table tr', { hasText: 'test-attr-rule' }).first();
    await expect(removedRow.locator('.pending')).toHaveText('Removed: refresh to apply');
    await expect(removedRow.getByRole('button', { name: 'Edit rule' })).toHaveCount(0);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test("Rules: Apply is the LCARdS YAML editor; it starts with this card and completes the card's keys", async ({ page }) => {
    const { errors, dash } = await openRulesTab(page);
    await dash.getByRole('button', { name: 'Add rule' }).click();
    const apply = dash.locator('lcards-rule-editor-dialog lcards-rule-apply-editor');
    await apply.getByRole('button', { name: 'Start with test_attr_rule' }).click();
    const yamlEditor = apply.locator('lcards-yaml-editor');
    await expect(yamlEditor.locator('.cm-content')).toContainText('test_attr_rule:');
    // The schema knows this card's patch keys.
    expect(await yamlEditor.evaluate(el => Object.keys(el.schema.properties.overlays.properties.test_attr_rule.properties)))
        .toEqual(expect.arrayContaining(['style', 'text']));
    // Ctrl+Space under the card's key lists its settings.
    await yamlEditor.locator('.cm-content').click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type('tex');
    await page.keyboard.press('Control+Space');
    await expect(yamlEditor.locator('.cm-tooltip-autocomplete')).toContainText('text');
    await page.keyboard.press('Escape');
    // Typed YAML reaches the rule (after the editor's typing pause).
    await page.keyboard.type('t:\n  label:\n    content: RED ALERT');
    await expect.poll(() => apply.evaluate(el => el.value?.overlays?.test_attr_rule?.text?.label?.content), { timeout: 10_000 })
        .toBe('RED ALERT');
    await dash.locator('lcards-rule-editor-dialog').getByRole('button', { name: 'Cancel' }).click();
    await removeEditor(page);
    expect(errors).toEqual([]);
});

/**
 * Templates tab and sandbox (B3): one row per field with its live result,
 * the sandbox on the card's context with completion, test values and Save to field.
 */
const TPL_CARD = { type: 'custom:lcards-button', id: 'tpl_card', entity: 'input_number.lcards_test_value', preset: 'lozenge',
    variables: { unit: 'kW' },
    text: {
        label: { content: 'Value {entity.state} {variables.unit}', show: true },
        name: { content: '[[[ return variables.unit + "!" ]]]', show: true },
        state: { content: '{{ states("input_boolean.lcards_test_toggle") }}', show: true },
    },
    style: { card: { color: { background: { default: '{colors.text.onDark}' } } } } };

async function openTemplatesTab(page) {
    const errors = await openDashboard(page, 'cards');
    page.on('dialog', d => { throw new Error(`native ${d.type()} dialog: ${d.message()}`); });
    const editor = await openMainEngineering(page, TPL_CARD);
    await editor.getByRole('tab', { name: 'Templates', exact: true }).dispatchEvent('click');
    const tab = editor.locator('lcards-template-evaluation-tab');
    await expect(tab.locator('.launcher')).toBeVisible();
    return { errors, editor, tab };
}
const fieldRow = (tab, path) => tab.locator('.field', { has: tab.page().locator('.path', { hasText: new RegExp(`^${path.replace(/[.[\]]/g, '\\$&')}$`) }) });

test('Templates: one row per field with its live result (variables, JavaScript, Jinja2); mistakes flagged', async ({ page }) => {
    const { errors, tab } = await openTemplatesTab(page);
    await expect(tab.locator('.field')).toHaveCount(4);
    await expect(fieldRow(tab, 'text.label.content').locator('.result .value')).toHaveText(/^Value \S+ kW$/);
    await expect(fieldRow(tab, 'text.name.content').locator('.result .value')).toHaveText('kW!');
    await expect(fieldRow(tab, 'text.state.content').locator('.result .value')).toHaveText(/^(on|off)$/);
    await expect(fieldRow(tab, 'style.card.color.background.default').locator('.mistake')).toContainText('Missing the theme: prefix');
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test("Templates: Open in sandbox loads the whole field on the card's entity; Save to field writes it", async ({ page }) => {
    const { errors, editor, tab } = await openTemplatesTab(page);
    await fieldRow(tab, 'text.label.content').getByRole('button', { name: 'Open in sandbox' }).click();
    const sandbox = tab.locator('lcards-template-sandbox');
    await expect(sandbox.locator('ha-dialog')).toHaveAttribute('header-title', 'Template: text.label.content');
    await expect(sandbox.locator('lcards-template-editor .cm-content')).toHaveText('Value {entity.state} {variables.unit}');
    await expect(sandbox.locator('.result .value')).toHaveText(/^Value \S+ kW$/);
    await expect(sandbox.locator('.result .status')).toContainText('Resolved');
    expect(await sandbox.evaluate(el => el._entityId)).toBe('input_number.lcards_test_value');
    await sandbox.locator('lcards-template-editor .cm-content').click();
    await page.keyboard.press('Control+End');
    await page.keyboard.type(' OK');
    await sandbox.getByRole('button', { name: 'Save to text.label.content' }).click(); // right away: Save flushes
    await expect(sandbox.locator('ha-dialog')).toHaveCount(0);
    await expect.poll(() => editor.evaluate(el => el.config.text.label.content)).toBe('Value {entity.state} {variables.unit} OK');
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Template sandbox: completion offers attributes, data sources and theme paths; test values stand in', async ({ page }) => {
    const { errors, tab } = await openTemplatesTab(page);
    await page.evaluate(() => window.lcards.core.dataSourceManager.createDataSource('tpl_ds',
        { entity: 'input_number.lcards_test_value', history: { enabled: false } }, 'other-card'));
    await tab.getByRole('button', { name: 'Open sandbox' }).click();
    const sandbox = tab.locator('lcards-template-sandbox');
    const cm = sandbox.locator('lcards-template-editor .cm-content');
    const popup = sandbox.locator('lcards-template-editor .cm-tooltip-autocomplete');
    await cm.click();
    // Every character reaches the editor (HA's one-key shortcuts, such as "e", don't take them)
    await page.keyboard.type('{entity.attributes.');
    await expect(cm).toHaveText('{entity.attributes.');
    await expect(popup).toContainText('max');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('{ds:');
    await expect(popup).toContainText('tpl_ds');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('{theme:');
    await expect(popup).toContainText('colors');
    await page.keyboard.press('Escape');
    // Escape closed the list only: the sandbox stays open
    await expect(popup).toHaveCount(0);
    await expect(sandbox.locator('ha-dialog')).toHaveCount(1);
    // Insert chips open completion too
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
    await sandbox.locator('.inserts').getByRole('button', { name: 'Variable', exact: true }).click();
    await expect(popup).toContainText('unit');
    await page.keyboard.press('Escape');

    // An example with test values: the data source is a test value
    await sandbox.evaluate(el => el._loadExample('datasource'));
    await expect(sandbox.locator('.result .value')).toHaveText('Core temperature: 87.5 °C');
    await expect(sandbox.locator('.used tr', { hasText: 'core_temp' }).locator('.src')).toHaveText('test');
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Template sandbox: every example resolves', async ({ page }) => {
    const { errors, tab } = await openTemplatesTab(page);
    await tab.getByRole('button', { name: 'Open sandbox' }).click();
    const sandbox = tab.locator('lcards-template-sandbox');
    const ids = await sandbox.evaluate(el => Object.keys(el.constructor.EXAMPLES ?? {}).length
        ? Object.keys(el.constructor.EXAMPLES) : [...el.renderRoot.querySelectorAll('.examples ha-selector')].flatMap(s => s.selector.select.options.map(o => o.value)));
    expect(ids.length).toBeGreaterThan(10);
    for (const id of ids) {
        await sandbox.evaluate((el, id) => el._loadExample(id), id);
        await expect(sandbox.locator('.result .status'), id).toContainText(/^\s*Resolved\s/);
    }
    await removeEditor(page);
    expect(errors).toEqual([]);
});

/**
 * Provenance (B4a): the inspector reads the card rendered from the editor's
 * config (the preview), never another card on the page.
 */
test('Provenance: the tab reads the card rendered from this config; without one it shows nothing', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    const config = { type: 'custom:lcards-button', id: 'prov_preview', entity: 'input_boolean.lcards_test_toggle', preset: 'lozenge',
        style: { card: { color: { background: { active: 'theme:colors.ui.primary' } } } } };
    const editor = await openMainEngineering(page, config);
    await editor.getByRole('tab', { name: 'Provenance', exact: true }).dispatchEvent('click');
    const tab = editor.locator('lcards-provenance-tab');
    // No preview yet: nothing to inspect (the dashboard's own buttons are not this card)
    await expect.poll(() => tab.evaluate(el => el._provenance)).toBeNull();

    // A preview: a card mounted from the same config
    await page.evaluate((c) => {
        const ha = document.querySelector('home-assistant');
        const card = document.createElement('lcards-button');
        card.id = 'lcards-test-preview';
        card.setConfig(c);
        card.hass = ha.hass;
        ha.shadowRoot.appendChild(card);
    }, config);
    await expect.poll(() => tab.evaluate(async (el) => { await el._loadProvenance(); return el._provenance?.context?.card_id; })).toBe('prov_preview');
    const token = await tab.evaluate(el => el._provenance.theme_tokens['colors.ui.primary']);
    expect(token.used_by_fields).toContain('style.card.color.background.active');
    expect(token.resolution_chain[0].step).toMatch(/lookup|override/);
    await page.evaluate(() => document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-preview')?.remove());
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Provenance: a field only a rule sets (height) shows in the tree while the rule matches', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await client.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_toggle' });
    const config = { type: 'custom:lcards-button', id: 'prov_rule_card', entity: 'input_boolean.lcards_test_toggle', preset: 'lozenge',
        rules: [{ id: 'size-rule', when: { entity: 'input_boolean.lcards_test_toggle', state: 'on' },
            apply: { overlays: { prov_rule_card: { height: 120 } } } }] };
    const editor = await openMainEngineering(page, config);
    await page.evaluate((c) => {
        const ha = document.querySelector('home-assistant');
        const card = document.createElement('lcards-button');
        card.id = 'lcards-test-preview';
        card.setConfig(c);
        card.hass = ha.hass;
        ha.shadowRoot.appendChild(card);
    }, config);
    const tree = () => page.evaluate(() => document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-preview').getProvenance().config.tree);
    await client.callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.lcards_test_toggle' });
    await expect.poll(async () => (await tree()).height?.__source).toBe('rules');
    await client.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_toggle' });
    await expect.poll(async () => (await tree()).height).toBeUndefined();
    await page.evaluate(() => document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-preview')?.remove());
    await removeEditor(page);
    expect(errors).toEqual([]);
});

/** Mount a card from `config` inside home-assistant, standing in for the editor's preview. */
const mountPreview = (page, config) => page.evaluate((c) => {
    const ha = document.querySelector('home-assistant');
    document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-preview')?.remove();
    const card = document.createElement(c.type.replace('custom:', ''));
    card.id = 'lcards-test-preview';
    card.setConfig(c);
    card.hass = ha.hass;
    ha.shadowRoot.appendChild(card);
}, config);
const removePreview = (page) => page.evaluate(() => document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-preview')?.remove());

async function openInspector(page, config) {
    const editor = await openMainEngineering(page, config);
    await mountPreview(page, config);
    await editor.getByRole('tab', { name: 'Provenance', exact: true }).dispatchEvent('click');
    const tab = editor.locator('lcards-provenance-tab');
    await expect(tab.locator('.launcher-stats')).toContainText('fields');
    await tab.getByRole('button', { name: 'Open inspector' }).click();
    const dialog = tab.locator('ha-dialog');
    await expect(dialog.locator('.studio-layout')).toBeVisible();
    return { editor, tab, dialog };
}

test('Provenance inspector: a field shows its value now and the trail (your config, the token chain)', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await client.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_toggle' });
    const config = { type: 'custom:lcards-button', id: 'prov_insp', entity: 'input_boolean.lcards_test_toggle', preset: 'lozenge',
        style: { card: { color: { background: { active: 'theme:colors.ui.primary', inactive: '#333366' } } } } };
    const { dialog } = await openInspector(page, config);
    await expect(dialog).toHaveAttribute('header-title', 'Provenance: prov_insp');
    // Search narrows the tree to the field
    await dialog.locator('ha-input.search input').fill('background.active');
    await dialog.locator('.field-row[data-path="style.card.color.background.active"]').click();
    const trail = dialog.locator('.trail');
    await expect(trail.locator('.config-step.wins')).toContainText('Your config');
    await expect(trail.locator('.token-step')).toContainText('theme:colors.ui.primary');
    await expect(trail.locator('.token-step')).toContainText('Value on this card');
    await expect(dialog.locator('.now .swatch')).toHaveCount(1);
    // The token's own view, and back to the field from "Used by"
    // A state-keyed field: its value now is the branch that applies (the toggle is off: inactive)
    await dialog.locator('ha-input.search input').fill('');
    await dialog.locator('.field-row[data-path="style.card.color.background"]').click();
    await expect(dialog.locator('.runtime-step[data-layer="state"]')).toContainText('branch "inactive"');
    await expect(dialog.locator('.now .value')).toHaveText('#333366');
    await dialog.locator('.field-row[data-path="style.card.color.background.active"]').click();
    await trail.getByRole('button', { name: 'Open token' }).click();
    await expect(dialog.locator('.chain-step[data-step="lookup"]')).toHaveCount(1);
    await expect(dialog.locator('.chain-step[data-step="value"]')).toHaveCount(1);
    await dialog.locator('.uses').getByRole('button', { name: 'style.card.color.background.active' }).click();
    await expect(dialog.locator('.detail-title h3')).toHaveText('style.card.color.background.active');
    await dialog.locator('ha-button[data-dialog="close"]').click();
    await expect(dialog).toHaveCount(0);
    await removePreview(page);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Provenance inspector: live follows the card (a rule applying); paused holds until refresh', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await client.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_toggle' });
    const config = { type: 'custom:lcards-button', id: 'prov_live', entity: 'input_boolean.lcards_test_toggle', preset: 'lozenge',
        rules: [{ id: 'live-rule', when: { entity: 'input_boolean.lcards_test_toggle', state: 'on' },
            apply: { overlays: { prov_live: { height: 140 } } } }] };
    const { dialog } = await openInspector(page, config);
    const heightRow = dialog.locator('.field-row[data-path="height"]');
    await expect(heightRow).toHaveCount(0);
    // Live: the rule applies and the field appears, without reopening
    await client.callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.lcards_test_toggle' });
    await expect(heightRow).toHaveCount(1);
    await heightRow.click();
    await expect(dialog.locator('.rule-step')).toContainText('live-rule');
    // Paused: the rule stops, the view holds (and says it changed) until refresh
    await dialog.locator('ha-switch.live-switch').click();
    await client.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_toggle' });
    await expect(dialog.locator('ha-switch.live-switch')).toContainText('Paused (changed)');
    await expect(heightRow).toHaveCount(1);
    await dialog.getByRole('button', { name: 'Refresh' }).click();
    await expect(heightRow).toHaveCount(0);
    await removePreview(page);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

/**
 * Theme (UI consistency B5b): a card editor's Theme tab lists that card's tokens
 * and opens the config panel's Theme Studio / Pack Explorer in a new browser tab;
 * the panel opens on the tab a ?tab= link names.
 */
test("Theme tab: the card's tokens with their values; links open the panel's Theme Studio and Pack Explorer", async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    const config = { type: 'custom:lcards-button', id: 'theme_tab', entity: 'input_boolean.lcards_test_toggle', preset: 'lozenge',
        style: { card: { color: { background: { active: 'theme:colors.ui.primary', inactive: '#333366' } } } } };
    const editor = await openMainEngineering(page, config);
    await mountPreview(page, config);
    await editor.getByRole('tab', { name: 'Theme', exact: true }).dispatchEvent('click');
    const tab = editor.locator('lcards-card-theme-tab');
    const row = tab.locator('.token[data-path="colors.ui.primary"]');
    await expect(row).toContainText('theme:colors.ui.primary');
    await expect(row).toContainText('style.card.color.background.active');
    await expect(row.locator('.swatch')).toHaveCount(1);
    // The full browser is no longer embedded in the editor
    await expect(editor.locator('lcards-theme-token-browser-tab')).toHaveCount(0);
    await page.evaluate(() => { window.__opened = []; window.open = (url) => { window.__opened.push(url); return null; }; });
    await tab.getByRole('button', { name: 'Open Theme Studio' }).click();
    await tab.getByRole('button', { name: 'Pack Explorer' }).click();
    expect(await page.evaluate(() => window.__opened)).toEqual(['/lcards-config?tab=theme', '/lcards-config?tab=packs']);
    await removePreview(page);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Config panel: ?tab= opens that tab (theme, packs)', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    for (const [name, label, tag] of [['theme', 'Theme Studio', 'lcards-theme-token-browser-tab'], ['packs', 'Pack Explorer', 'lcards-pack-explorer-tab']]) {
        await page.goto(`/lcards-config?tab=${name}`);
        const panel = page.locator('lcards-config-panel-impl');
        await expect(panel.locator(tag)).toBeAttached({ timeout: 20_000 });
        await expect(panel.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'true');
        await settle(page, 800);
        await expect(panel.getByRole('tab', { name: label })).toHaveAttribute('aria-selected', 'true');
    }
    expect(errors).toEqual([]);
});

test('Theme Studio: alert lab mode is an ha-selector (no raw select); picking a mode shows its parameters', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await page.goto('/lcards-config?tab=theme');
    const studio = page.locator('lcards-config-panel-impl lcards-theme-token-browser-tab');
    await expect(studio.locator('ha-selector').first()).toBeAttached({ timeout: 20_000 });
    expect(await studio.evaluate(el => el.shadowRoot.querySelectorAll('select').length)).toBe(0);
    await expect(studio.getByRole('tab', { name: 'LCARdS Alert Mode Lab' })).toHaveAttribute('aria-selected', 'true');
    // Green is the baseline: no parameters; red has them
    await studio.evaluate(el => el.shadowRoot.querySelector('ha-selector').dispatchEvent(
        new CustomEvent('value-changed', { detail: { value: 'green_alert' } })));
    await expect(studio.locator('.parameter-controls lcards-message')).toHaveCount(1);
    await studio.evaluate(el => el.shadowRoot.querySelector('ha-selector').dispatchEvent(
        new CustomEvent('value-changed', { detail: { value: 'red_alert' } })));
    await expect(studio.locator('.parameter-controls lcards-form-section').first()).toHaveJSProperty('header', 'Core Transform Parameters');
    // No emoji left in the studio's text
    const text = await studio.evaluate(el => el.shadowRoot.textContent);
    expect(text).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    await page.evaluate(() => window.lcards.setAlertMode?.('green_alert'));
    expect(errors).toEqual([]);
});

test('Slider editor: direction buttons write the config; range presets are HA buttons', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await mountEditor(page, 'lcards-slider', { type: 'custom:lcards-slider', entity: 'input_number.lcards_test_value' });
    const editor = page.locator('#lcards-test-editor');
    await editor.getByRole('tab', { name: 'Slider Track' }).dispatchEvent('click');
    const vis = editor.locator('lcards-slider-range-visualizer');
    await expect(vis).toBeAttached();
    await vis.evaluate(el => { el.closest('lcards-form-section').expanded = true; });
    expect(await vis.evaluate(el => el.shadowRoot.querySelectorAll('input, select, .preset-buttons button').length)).toBe(0);
    await vis.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await vis.locator('.direction-button', { hasText: 'Top→Bottom' }).click();
    await expect.poll(() => page.evaluate(() => {
        const c = document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-editor').config;
        return [c.style?.track?.orientation, c.style?.track?.invert_fill];
    })).toEqual(['vertical', true]);
    await vis.getByRole('button', { name: 'Match ranges' }).click();
    await removeEditor(page);
    expect(errors).toEqual([]);
});

/**
 * Studios (UI consistency B6): each studio's inset keeps one height on every tab
 * (flexcontent; no per-studio heights), and the footers match.
 */
const STUDIOS = [
    ['MSD', 'lcards-msd-card', EDITORS[5][1], '_openMsdStudio', 'lcards-msd-studio-dialog'],
    ['Chart', 'lcards-chart', EDITORS[3][1], '_openChartStudio', 'lcards-chart-studio-dialog'],
    ['Data Grid', 'lcards-data-grid', EDITORS[4][1], '_openConfigurationStudio', 'lcards-data-grid-studio-dialog-v4'],
    ['Layout', 'lcards-layout-card', { type: 'custom:lcards-layout-card', cards: [] }, '_openStudio', 'lcards-layout-studio-dialog'],
];

async function openCardStudio(page, tag, config, method, dialogTag) {
    await mountEditor(page, tag, config);
    await page.evaluate(async (method) => {
        const editor = document.querySelector('home-assistant').shadowRoot.getElementById('lcards-test-editor');
        await editor.updateComplete;
        await editor[method]();
    }, method);
    const dialog = page.locator(dialogTag);
    await expect(dialog.locator('.studio-layout').first()).toBeVisible({ timeout: 20_000 });
    return dialog;
}
const removeStudio = (page, dialogTag) => page.evaluate((t) => {
    const ha = document.querySelector('home-assistant').shadowRoot;
    ha.querySelectorAll(t).forEach(d => d.remove());
}, dialogTag);

for (const [name, tag, config, method, dialogTag] of STUDIOS) {
    test(`${name} studio: the inset keeps one height on every tab; footer Cancel then brand Save`, async ({ page }) => {
        const errors = await openDashboard(page, 'cards');
        const dialog = await openCardStudio(page, tag, config, method, dialogTag);
        await expect(dialog.locator('ha-dialog').first()).toHaveAttribute('flexcontent', '');
        const tabs = dialog.locator('.config-panel ha-tab-group').first().locator('ha-tab-group-tab');
        const heights = [];
        for (let i = 0; i < await tabs.count(); i++) {
            await tabs.nth(i).dispatchEvent('click');
            await settle(page, 500);
            heights.push(Math.round((await dialog.locator('.studio-layout').first().boundingBox()).height));
        }
        expect(new Set(heights).size, `heights ${heights}`).toBe(1);
        // Footer: the last two buttons are Cancel (plain) and Save (brand)
        const buttons = dialog.locator('ha-dialog').first().locator(':scope > [slot="footer"] > ha-button'); // not the .footer-start group
        const n = await buttons.count();
        await expect(buttons.nth(n - 2)).toHaveText('Cancel');
        await expect(buttons.nth(n - 1)).toHaveAttribute('variant', 'brand');
        await expect(buttons.nth(n - 1).locator('ha-icon')).toHaveAttribute('icon', 'mdi:check');
        await removeStudio(page, dialogTag);
        await removeEditor(page);
        expect(errors).toEqual([]);
    });
}

test('MSD studio: Documentation and Reset sit at the start of the footer', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    const [, tag, config, method, dialogTag] = STUDIOS[0];
    const dialog = await openCardStudio(page, tag, config, method, dialogTag);
    const footer = dialog.locator('ha-dialog').first().locator(':scope > [slot="footer"]');
    const box = async (name) => (await footer.getByRole('button', { name }).boundingBox());
    const [docs, reset, cancel] = [await box('Documentation'), await box('Reset'), await box('Cancel')];
    const footerBox = await footer.boundingBox();
    expect(docs.x - footerBox.x).toBeLessThan(40);
    // A gap between the start group (Documentation, Reset) and Cancel
    expect(cancel.x - (reset.x + reset.width)).toBeGreaterThan(100);
    await removeStudio(page, dialogTag);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('Config panel: every tab\'s text uses the panel font (the theme\'s body font), not the page\'s Roboto', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    for (const [name, tag] of [
        ['helpers', 'lcards-form-section'], ['connectivity', 'lcards-connectivity-tab'], ['sounds', 'lcards-sound-config-tab'],
        ['users', 'lcards-users-devices-tab'], ['packs', 'lcards-pack-explorer-tab'], ['storage', 'lcards-storage-explorer-tab'],
    ]) {
        await page.goto(`/lcards-config?tab=${name}`);
        const panel = page.locator('lcards-config-panel-impl');
        await expect(panel.locator(tag).first()).toBeAttached({ timeout: 20_000 });
        await settle(page);
        const { host, off } = await panel.evaluate((el) => {
            const first = (node) => getComputedStyle(node).fontFamily.split(',')[0].replace(/["']/g, '').trim();
            const host = first(el);
            const code = first(document.body.appendChild(Object.assign(document.createElement('code'), { style: 'font-family: var(--ha-font-family-code)' })));
            // Text that sets its own font on purpose: the LCARS banner, font previews, code
            const SKIP = '.banner-title, .banner-version, .preview, .font-sample, ha-code-editor, .mono, .entity-id, .helper-entity-id, .field-value';
            const off = [];
            const walk = (root) => {
                for (const node of root.children) {
                    if (node.matches(SKIP)) continue;
                    const text = [...node.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent.trim()).join('').trim();
                    const rect = node.getBoundingClientRect();
                    if (text && rect.width && rect.height) {
                        const f = first(node);
                        if (f !== host && f !== code && f !== 'monospace') off.push(`${node.tagName.toLowerCase()}.${node.className}: ${text.slice(0, 30)} (${f})`);
                    }
                    if (node.shadowRoot) walk(node.shadowRoot);
                    walk(node);
                }
            };
            walk(el.shadowRoot);
            return { host, off: off.slice(0, 10) };
        });
        expect(off, `${name}: text not in the panel font (${host})`).toEqual([]);
    }
    expect(errors).toEqual([]);
});

test('Config panel: Storage lists its keys on a fresh load; a key opens to its JSON; device keys stay collapsed', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await page.goto('/lcards-config?tab=storage');
    const storage = page.locator('lcards-config-panel-impl lcards-storage-explorer-tab');
    const settings = storage.locator('lcards-form-section').first();
    await expect(settings).toHaveJSProperty('header', 'Settings', { timeout: 20_000 });
    await expect(storage.getByText('Integration not available')).toHaveCount(0);
    const rows = settings.locator('ha-expansion-panel.key-panel');
    await expect(rows.first()).toBeVisible();
    // Opening a key shows its value (expanded-changed carries detail.expanded)
    await rows.first().click({ position: { x: 80, y: 20 } });
    await expect(rows.first().locator('ha-code-editor')).toHaveCount(1);
    // Group rows render only while open (there can be thousands of _device_* keys)
    expect(await storage.evaluate(el => [...el.shadowRoot.querySelectorAll('lcards-form-section')]
        .filter(s => s.header !== 'Settings' && !s.expanded)
        .every(s => s.querySelectorAll('ha-expansion-panel').length === 0))).toBe(true);
    expect(errors).toEqual([]);
});

test('Config panel: Pack Explorer previews render real cards (preset, component, texture)', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await page.goto('/lcards-config?tab=packs');
    const explorer = page.locator('lcards-config-panel-impl lcards-pack-explorer-tab');
    await expect(explorer.locator('.tree-node').first()).toBeAttached({ timeout: 20_000 });
    for (const type of ['preset', 'component', 'component-preset', 'texture_preset']) {
        const size = await explorer.evaluate(async (el, type) => {
            const find = (ns) => { for (const n of ns) { if (n.type === type) return n; const f = n.children && find(n.children); if (f) return f; } };
            el._handleNodeClick(find(el._treeData));
            await el.updateComplete;
            await new Promise(r => setTimeout(r, 800));
            const card = el.shadowRoot.querySelector('.preset-preview-frame > *');
            const r = card?.getBoundingClientRect();
            return card ? { w: r.width, h: r.height, rendered: (card.shadowRoot?.innerHTML.length ?? 0) > 200 } : null;
        }, type);
        expect(size, `${type}: preview card`).not.toBeNull();
        expect(size.w, `${type}: preview width`).toBeGreaterThan(50);
        expect(size.h, `${type}: preview height`).toBeGreaterThan(20);
        expect(size.rendered, `${type}: card rendered`).toBe(true);
    }
    expect(errors).toEqual([]);
});

test('Config panel: the selected tab sticks (click right after load, set from code, Welcome links)', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    await page.goto('/lcards-config');
    const panel = page.locator('lcards-config-panel-impl');
    await panel.waitFor({ state: 'attached', timeout: 20_000 });
    const selected = () => panel.evaluate(el => [...el.shadowRoot.querySelectorAll('ha-tab-group-tab')]
        .find(t => t.getAttribute('aria-selected') === 'true')?.getAttribute('value'));
    await panel.getByRole('tab', { name: /Sounds/ }).click();
    await settle(page);
    expect(await selected()).toBe('4');
    await panel.evaluate(el => { el._selectedTab = 3; });
    await settle(page);
    expect(await selected()).toBe('3');
    await panel.evaluate(el => { el._selectedTab = 0; });
    await settle(page, 800);
    await panel.evaluate(el => el.shadowRoot.querySelector('lcards-about-tab').dispatchEvent(
        new CustomEvent('lcards-navigate-tab', { detail: { tab: 1 }, bubbles: true, composed: true })));
    await settle(page);
    expect(await selected()).toBe('1');
    expect(errors).toEqual([]);
});

test('Layout studio: a new layout card shows the grid tools on a fresh page (overlay chunk loaded)', async ({ page }) => {
    const errors = await openDashboard(page, 'cards');
    // A fresh page: no layout view has been edited, so only the studio can load the overlay.
    expect(await page.evaluate(() => !!customElements.get('lcards-grid-edit-overlay'))).toBe(false);
    const [, tag, , method, dialogTag] = STUDIOS[3];
    const stub = { type: 'custom:lcards-layout-card', layout: { 'grid-template-columns': '1fr 1fr', 'grid-template-rows': 'auto' }, cards: [] };
    const dialog = await openCardStudio(page, tag, stub, method, dialogTag);
    expect(await page.evaluate(() => !!customElements.get('lcards-grid-edit-overlay'))).toBe(true);
    const overlay = dialog.locator('.canvas lcards-grid-edit-overlay');
    await expect.poll(() => overlay.evaluate(el => el.shadowRoot?.querySelectorAll('*').length ?? 0)).toBeGreaterThan(5);
    await removeStudio(page, dialogTag);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

// HA ignores ONE lovelace_updated event per save. Adding a card through HA saves once,
// then the view saves again to give the card its grid-area: before the view waited
// for HA's event, the second event showed "Dashboard updated in another session".
test('layout view: adding a card to an area saves without the "another session" toast', async ({ page }) => {
    await page.addInitScript(() => {
        window.__toasts = [];
        document.addEventListener('hass-notification', (e) => window.__toasts.push(e.detail?.message ?? ''), true);
    });
    const errors = await openDashboard(page, 'layout');
    await page.goto(`/${TEST_DASHBOARD}/layout?edit=1`);
    await expect(page.locator('lcards-grid-edit-overlay')).toBeAttached({ timeout: 20_000 });
    await settle(page);
    const MARK = 'lcards add-card save test';
    const last = await page.evaluate(async (mark) => {
        const find = (root) => {
            for (const el of root.querySelectorAll('*')) {
                if (el.localName === 'lcards-layout-view') return el;
                if (el.shadowRoot) { const f = find(el.shadowRoot); if (f) return f; }
            }
            return null;
        };
        const v = find(document);
        const view = v.lovelace.config.views[v.index];
        const views = [...v.lovelace.config.views];
        views[v.index] = { ...view, cards: [...view.cards, { type: 'markdown', content: mark }] };
        v._pendingAddArea = 'main'; // what the area's "Add card" sets before HA's card picker saves
        await v.lovelace.saveConfig({ ...v.lovelace.config, views });
        await new Promise(r => setTimeout(r, 3000));
        const cards = v.lovelace.config.views[v.index].cards;
        const result = cards[cards.length - 1];
        // Clean up.
        const cleaned = [...v.lovelace.config.views];
        cleaned[v.index] = { ...cleaned[v.index], cards: cards.filter(c => c.content !== mark) };
        await v.lovelace.saveConfig({ ...v.lovelace.config, views: cleaned });
        return result;
    }, MARK);
    expect(last).toEqual({ type: 'markdown', content: MARK, view_layout: { 'grid-area': 'main' } });
    await settle(page);
    expect(await page.evaluate(() => window.__toasts.filter(t => /another session/i.test(t)))).toEqual([]);
    expect(errors).toEqual([]);
});

test('Layout studio: grid headers and toolbar sit outside the cells (reserved edit gutter)', async ({ page }, testInfo) => {
    const errors = await openDashboard(page, 'cards');
    const [, tag, , method, dialogTag] = STUDIOS[3];
    const stub = {
        type: 'custom:lcards-layout-card',
        layout: { 'grid-template-columns': '1fr 1fr', 'grid-template-rows': '80px 1fr', 'grid-template-areas': '"top top" "left right"' },
        cards: [],
    };
    const dialog = await openCardStudio(page, tag, stub, method, dialogTag);
    const overlay = dialog.locator('.canvas lcards-grid-edit-overlay');
    await expect.poll(() => overlay.evaluate(el => el.shadowRoot?.querySelectorAll('.area-overlay').length ?? 0)).toBe(3);
    await settle(page, 800);
    const geo = await overlay.evaluate((el) => {
        const r = (/** @type {Element} */ e) => e.getBoundingClientRect();
        const root = el.shadowRoot;
        const areas = [...root.querySelectorAll('.area-overlay')].map(r);
        return {
            areaTop: Math.min(...areas.map(a => a.top)),
            areaLeft: Math.min(...areas.map(a => a.left)),
            colHeaderBottom: Math.max(...[...root.querySelectorAll('.col-header')].map(e => r(e).bottom)),
            rowHeaderRight: Math.max(...[...root.querySelectorAll('.row-header')].map(e => r(e).right)),
            barBottom: r(root.querySelector('.edit-bar')).bottom,
        };
    });
    expect(geo.colHeaderBottom).toBeLessThanOrEqual(geo.areaTop);
    expect(geo.rowHeaderRight).toBeLessThanOrEqual(geo.areaLeft);
    expect(geo.barBottom).toBeLessThanOrEqual(geo.areaTop);
    await page.screenshot({ path: testInfo.outputPath('layout-studio.png') });
    await removeStudio(page, dialogTag);
    await removeEditor(page);
    expect(errors).toEqual([]);
});

test('storage/delete_many removes the given keys with one call and leaves the rest', async () => {
    await client.call({ type: 'lcards/storage/set', data: { lcards_test_bulk_a: 1, lcards_test_bulk_b: 2, lcards_test_bulk_keep: 3 } });
    const result = await client.call({ type: 'lcards/storage/delete_many', keys: ['lcards_test_bulk_a', 'lcards_test_bulk_b', 'lcards_test_bulk_missing'] });
    expect(result).toEqual({ ok: true, removed: 2 });
    const { value } = await client.call({ type: 'lcards/storage/get' });
    expect(Object.keys(value).filter(k => k.startsWith('lcards_test_bulk_'))).toEqual(['lcards_test_bulk_keep']);
    await client.call({ type: 'lcards/storage/delete', key: 'lcards_test_bulk_keep' });
});
