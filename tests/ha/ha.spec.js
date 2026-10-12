/**
 * Layer C: smoke tests against the real dev HA (see playwright.ha.config.js).
 * Fixtures (lcards_test_* helpers, lcards-test dashboard) are created if missing.
 */
import { test, expect } from '@playwright/test';
import yaml from 'js-yaml';
import { readFileSync } from 'node:fs';
import { HAClient, HA_URL, TEST_DASHBOARD, readToken, ensureHelpers, ensureDashboard, setInputNumberMax } from './ha-client.mjs';

const TOKEN = readToken();
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
    await page.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
    }, { token: TOKEN, hassUrl: HA_URL });
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
        const notice = el.shadowRoot.querySelector('lcards-message.refresh-notice');
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
    // As a user does: pick the entity on the Basic tab, then open Processing.
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
