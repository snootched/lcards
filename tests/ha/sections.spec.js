/**
 * Layer C: the LCARS section strategies (src/strategies/lcards-section-strategies.js)
 * on a sections view of the hidden `lcards-test-sections` dashboard, targeting the
 * test bridge (TEST_ROOMS in ha-client.mjs: template lamps and sensors) plus some
 * gallery helpers. Each section renders its LCARdS cards for the right entities, and
 * Home Assistant lists all three under Community sections in Create section.
 */
import { test, expect } from '@playwright/test';
import { HAClient, HA_URL, readToken, ensureHelpers, ensureTestRooms, GALLERY_HELPERS } from './ha-client.mjs';

const TOKEN = readToken();
const DASH = 'lcards-test-sections';

test.skip(!TOKEN, 'HA_TOKEN (or .ha-token) not set: skipping real-HA checks');

test('LCARS sections: each renders its entities, in both looks; all three are in the chooser', async ({ page }) => {
    test.setTimeout(120_000);
    const client = await HAClient.connect(TOKEN);
    await ensureHelpers(client, GALLERY_HELPERS);
    const areas = await ensureTestRooms(client);
    const dashboards = await client.call({ type: 'lovelace/dashboards/list' });
    if (!dashboards.some((d) => d.url_path === DASH)) {
        await client.call({ type: 'lovelace/dashboards/create', url_path: DASH, title: 'LCARdS Test Sections', mode: 'storage', require_admin: false, show_in_sidebar: false });
    }
    const numbers = ['power', 'shields'].map((x) => `input_number.lcards_test_${x}`);
    const toggles = ['doors', 'warp'].map((x) => `input_boolean.lcards_test_${x}`);
    await client.call({ type: 'lovelace/config/save', url_path: DASH, config: { views: [{ type: 'sections', path: 's', title: 'S', max_columns: 4, sections: [
        { strategy: { type: 'custom:lcars-readings', target: { area_id: areas.bridge } } },
        { strategy: { type: 'custom:lcars-gauges', title: 'LEVELS', target: { entity_id: numbers } } },
        { strategy: { type: 'custom:lcars-controls', target: { entity_id: toggles, area_id: areas.bridge } } },
        { strategy: { type: 'custom:lcars-controls', look: 'picard', frame: true, target: { entity_id: toggles } } },
    ] }] } });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({ access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl, clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '' }));
    }, { token: TOKEN, hassUrl: HA_URL });
    await page.goto(`/${DASH}/s`);

    /** Entities and titles per section, in order. */
    const read = () => page.evaluate(() => {
        /** @type {any[]} */
        const sections = [];
        const walk = (/** @type {Document|ShadowRoot} */ root) => {
            for (const el of root.querySelectorAll('*')) {
                if (el.tagName === 'HUI-GRID-SECTION') sections.push(el);
                if (el.shadowRoot) walk(el.shadowRoot);
            }
        };
        walk(document);
        return sections.map((sec) => {
            /** @type {any[]} */
            const found = [];
            const inner = (/** @type {any} */ root) => {
                for (const el of root.querySelectorAll('*')) {
                    if (el.tagName.startsWith('LCARDS-')) found.push(el);
                    if (el.shadowRoot) inner(el.shadowRoot);
                }
            };
            inner(sec.shadowRoot ?? sec);
            const title = found.find((el) => el.config?.preset === 'bar-label-left')?.config?.text?.label?.content;
            const entities = [...new Set(found.map((el) => el.config?.entity).filter(Boolean))].sort();
            // classic readings: the number column, a pill per sensor (bullet), in order
            const rows = found.filter((el) => el.config?.preset === 'bullet').map((el) => el.config.entity);
            return { title, entities, rows };
        });
    });
    await expect.poll(async () => (await read()).length, { timeout: 30_000 }).toBe(4);
    await expect.poll(async () => (await read())[1].entities.length, { timeout: 15_000 }).toBe(2);
    const [readings, gauges, controls, picardControls] = await read();
    expect(readings.title).toBe('LCARDS TEST BRIDGE');
    expect(readings.rows).toEqual(['sensor.lcards_test_bridge_temperature', 'sensor.lcards_test_bridge_humidity']);
    expect(gauges).toMatchObject({ title: 'LEVELS', entities: numbers });
    expect(controls.entities).toEqual([...toggles, 'light.lcards_test_lamp']);
    expect(picardControls.entities).toEqual(toggles);

    // the chooser: Create section → Automatic section lists the four under Community sections
    await page.goto(`/${DASH}/s?edit=1`);
    await page.locator('button.create-section').last().click({ timeout: 15_000 });
    await page.locator('hui-dialog-create-section').getByText('Automatic section').click();
    for (const name of ['LCARS readings', 'LCARS gauges', 'LCARS controls']) {
        await expect(page.getByRole('button', { name, exact: true })).toBeVisible({ timeout: 15_000 });
    }
    await expect(page.getByRole('button', { name: 'LCARS blocks', exact: true })).toHaveCount(0);
    client.close();
});
