/**
 * Home Assistant labels against the dev Home Assistant (reports/ha-labels-plan.md):
 * rules targeting `ha_label:`, conditions on `target: { label_id }`, a label changed
 * in the entity registry while the page is open, and the editor pieces (the labels
 * row's chips, Home Assistant's target selector) in Home Assistant's own frontend.
 * Creates the lcards_test_crew / lcards_test_engine labels (ensureLabels).
 */
import { test, expect } from '@playwright/test';
import {
    HAClient, HA_URL, TEST_DASHBOARD, readToken, ensureHelpers, ensureDashboard,
    GALLERY_HELPERS, ensureLabels, setEntityLabel,
} from './ha-client.mjs';

const TOKEN = readToken();
const TOGGLE = 'input_boolean.lcards_test_toggle';
const LIGHTS = 'input_boolean.lcards_test_lights';
const DOORS = 'input_boolean.lcards_test_doors';

/** @type {HAClient} */
let client;

test.beforeAll(async () => {
    client = await HAClient.connect(TOKEN);
    await ensureHelpers(client);
    await ensureHelpers(client, GALLERY_HELPERS);
    await ensureLabels(client);
    await ensureDashboard(client);
});
test.afterAll(async () => {
    await setEntityLabel(client, LIGHTS, 'lcards_test_crew', true).catch(() => {});
    await client?.callService('input_boolean', 'turn_off', { entity_id: TOGGLE });
    client?.close();
});

async function open(page) {
    const errors = [];
    page.on('pageerror', (e) => { if (/lcards/i.test(`${e.message}\n${e.stack}`)) errors.push(`pageerror: ${e.message}`); });
    page.on('console', (m) => { if (m.type() === 'error' && /lcards/i.test(`${m.text()} ${m.location()?.url ?? ''}`)) errors.push(m.text().slice(0, 500)); });
    await page.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
    }, { token: TOKEN, hassUrl: HA_URL });
    await page.goto(`/${TEST_DASHBOARD}/labels`);
    await page.waitForFunction(() => !!(document.querySelector('home-assistant')?.hass?.states && window.lcards?.core?.themeManager), null, { timeout: 30_000 });
    await page.evaluate(() => customElements.whenDefined('lcards-button'));
    await page.waitForTimeout(2500);
    return errors;
}

const fill = (page, label) => page.locator('lcards-button', { hasText: label }).locator('path.button-bg')
    .evaluate(el => getComputedStyle(el).fill);

test('labels: ha_label: targets the labelled card; a target condition follows a label change in the registry', async ({ page }) => {
    await client.callService('input_boolean', 'turn_off', { entity_id: TOGGLE });
    await client.callService('input_boolean', 'turn_on', { entity_id: LIGHTS });
    await client.callService('input_boolean', 'turn_off', { entity_id: DOORS });
    const errors = await open(page);

    // ha_label: target, driven by the toggle
    await expect.poll(() => fill(page, 'LABEL TARGET')).toBe('rgb(51, 51, 102)');
    await client.callService('input_boolean', 'turn_on', { entity_id: TOGGLE });
    await expect.poll(() => fill(page, 'LABEL TARGET'), { timeout: 10_000 }).toBe('rgb(204, 0, 0)');

    // target condition, match: all over lights (on) and doors (off)
    await expect.poll(() => fill(page, 'LABEL CONDITION')).toBe('rgb(51, 51, 102)');
    await client.callService('input_boolean', 'turn_on', { entity_id: DOORS });
    await expect.poll(() => fill(page, 'LABEL CONDITION'), { timeout: 10_000 }).toBe('rgb(0, 170, 0)');
    await client.callService('input_boolean', 'turn_off', { entity_id: LIGHTS });
    await expect.poll(() => fill(page, 'LABEL CONDITION'), { timeout: 10_000 }).toBe('rgb(51, 51, 102)');

    // the label taken off the lights in Home Assistant: the lights card is no longer a
    // target, and the condition is left with the doors (on)
    await setEntityLabel(client, LIGHTS, 'lcards_test_crew', false);
    await expect.poll(() => fill(page, 'LABEL TARGET'), { timeout: 10_000 }).toBe('rgb(51, 51, 102)');
    await expect.poll(() => fill(page, 'LABEL CONDITION'), { timeout: 10_000 }).toBe('rgb(0, 170, 0)');
    await setEntityLabel(client, LIGHTS, 'lcards_test_crew', true);
    await expect.poll(() => fill(page, 'LABEL TARGET'), { timeout: 10_000 }).toBe('rgb(204, 0, 0)');
    expect(errors).toEqual([]);
});

test('labels: a data grid row repeats per labelled entity and follows a label change', async ({ page }) => {
    const errors = await open(page);
    const grid = page.locator('lcards-data-grid', { hasText: 'LABEL GRID' });
    const names = async () => {
        const t = (await grid.locator('.grid-cell').allTextContents()).map(s => s.trim());
        return t.filter((_, i) => i % 2 === 0).slice(1);
    };
    await expect.poll(names, { timeout: 10_000 }).toEqual(['LCARdS Test Power', 'LCARdS Test Shields']);
    await setEntityLabel(client, 'input_number.lcards_test_shields', 'lcards_test_engine', false);
    try {
        await expect.poll(names, { timeout: 10_000 }).toEqual(['LCARdS Test Power']);
    } finally {
        await setEntityLabel(client, 'input_number.lcards_test_shields', 'lcards_test_engine', true);
    }
    await expect.poll(names, { timeout: 10_000 }).toEqual(['LCARdS Test Power', 'LCARdS Test Shields']);
    expect(errors).toEqual([]);
});

test('labels: a chart draws a series per labelled entity and follows a label change', async ({ page }) => {
    const errors = await open(page);
    const legend = page.locator('lcards-chart').locator('.apexcharts-legend-text');
    await expect.poll(() => legend.allTextContents(), { timeout: 15_000 }).toEqual(['LCARdS Test Power', 'LCARdS Test Shields']);
    await setEntityLabel(client, 'input_number.lcards_test_shields', 'lcards_test_engine', false);
    try {
        await expect.poll(() => legend.allTextContents(), { timeout: 15_000 }).toEqual(['LCARdS Test Power']);
    } finally {
        await setEntityLabel(client, 'input_number.lcards_test_shields', 'lcards_test_engine', true);
    }
    await expect.poll(() => legend.allTextContents(), { timeout: 15_000 }).toEqual(['LCARdS Test Power', 'LCARdS Test Shields']);
    expect(errors).toEqual([]);
});

test('labels: the editor lists the entity\'s labels, and Home Assistant\'s target selector loads', async ({ page }) => {
    const errors = await open(page);
    const result = await page.evaluate(async (entity) => {
        const ha = /** @type {any} */ (document.querySelector('home-assistant'));
        const editor = /** @type {any} */ (await customElements.get('lcards-button').getConfigElement());
        editor.hass = ha.hass;
        editor.setConfig({ type: 'custom:lcards-button', entity });
        ha.shadowRoot.appendChild(editor);
        await editor.updateComplete;
        const find = (root, tag) => {
            for (const el of root.querySelectorAll('*')) {
                if (el.tagName === tag) return el;
                const inner = el.shadowRoot && find(el.shadowRoot, tag);
                if (inner) return inner;
            }
            return null;
        };
        let row = null;
        for (let i = 0; i < 50 && !row; i++) { row = find(editor.shadowRoot, 'LCARDS-HA-LABELS'); if (!row) await new Promise(r => setTimeout(r, 100)); }
        for (let i = 0; i < 30 && row && !row._registry; i++) await new Promise(r => setTimeout(r, 100));
        await row?.updateComplete;
        const chips = row ? [...row.shadowRoot.querySelectorAll('ha-assist-chip')] : [];
        editor.remove();

        // the row on its own (in the editor it sits in a section that may be closed):
        // the chip must render with a size in Home Assistant's frontend
        const alone = /** @type {any} */ (document.createElement('lcards-ha-labels'));
        alone.hass = ha.hass;
        alone.entity = entity;
        ha.shadowRoot.appendChild(alone);
        for (let i = 0; i < 30 && !alone._registry; i++) await new Promise(r => setTimeout(r, 100));
        await alone.updateComplete;
        await new Promise(r => setTimeout(r, 300));
        const chipBox = alone.shadowRoot.querySelector('ha-assist-chip')?.getBoundingClientRect();
        alone.remove();

        // the condition editor's "Entities by label, area or device" uses this selector
        const selector = /** @type {any} */ (document.createElement('ha-selector'));
        selector.hass = ha.hass;
        selector.selector = { target: {} };
        selector.value = { label_id: 'lcards_test_crew' };
        ha.shadowRoot.appendChild(selector);
        let targetLoaded = false;
        for (let i = 0; i < 50 && !targetLoaded; i++) {
            targetLoaded = !!customElements.get('ha-selector-target') && !!selector.shadowRoot?.querySelector('ha-selector-target');
            if (!targetLoaded) await new Promise(r => setTimeout(r, 100));
        }
        selector.remove();
        return {
            found: !!row,
            labels: chips.map((c) => c.label),
            chipDefined: !!customElements.get('ha-assist-chip'),
            chipVisible: !!chipBox && chipBox.width > 0 && chipBox.height > 0,
            targetLoaded,
        };
    }, LIGHTS);
    expect(result.found).toBe(true);
    expect(result.labels).toEqual(['LCARdS Test Crew · lcards_test_crew']);
    expect(result.chipDefined).toBe(true);
    expect(result.chipVisible).toBe(true);
    expect(result.targetLoaded).toBe(true);
    expect(errors).toEqual([]);
});
