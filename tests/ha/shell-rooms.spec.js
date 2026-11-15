/**
 * Layer C: the LCARS shell's room light lists, built from the registries
 * (reports/strategies-plan.md S1.5; no auto-entities). A hidden
 * `lcards-test-shell-rooms` dashboard runs the strategy with a room selector over
 * two test areas (TEST_ROOMS in ha-client.mjs: template lamps, no real lights).
 *
 * Picking a room shows its lights and hides the others; a room without lights
 * shows its note; moving a lamp into a room regenerates the dashboard with it (Home
 * Assistant regenerates a strategy dashboard when the entity registry changes).
 */
import { test, expect } from '@playwright/test';
import { HAClient, HA_URL, readToken, ensureHelpers, ensureTestRooms, TEST_ROOMS } from './ha-client.mjs';

const TOKEN = readToken();
const DASHBOARD = 'lcards-test-shell-rooms';
const ROOM = 'input_select.lcards_test_room';

test.skip(!TOKEN, 'HA_TOKEN (or .ha-token) not set: skipping real-HA checks');

/** @type {HAClient} */
let client;
/** @type {{ bridge: string, cargo: string }} */
let areas;

test.beforeAll(async () => {
    client = await HAClient.connect(TOKEN);
    areas = await ensureTestRooms(client);
    await ensureHelpers(client, {
        [ROOM]: { type: 'input_select/create', name: 'LCARdS Test Room', options: Object.values(TEST_ROOMS.areas) },
    });
    const dashboards = await client.call({ type: 'lovelace/dashboards/list' });
    if (!dashboards.some((d) => d.url_path === DASHBOARD)) {
        await client.call({
            type: 'lovelace/dashboards/create', url_path: DASHBOARD, title: 'LCARdS Test Shell Rooms',
            mode: 'storage', require_admin: false, show_in_sidebar: false,
        });
    }
    await client.call({
        type: 'lovelace/config/save', url_path: DASHBOARD,
        config: { strategy: { type: 'custom:lcars-shell', room_selector_entity: ROOM } },
    });
});

test.afterAll(async () => {
    await client?.call({ type: 'config/entity_registry/update', entity_id: 'light.lcards_test_lamp_2', area_id: null });
    client?.close();
});

const pick = (/** @type {string} */ option) => client.callService('input_select', 'select_option', { entity_id: ROOM, option });

/** Shown light sliders (entity ids), the "no lights" note, and the list cell's width. */
const lists = (/** @type {import('@playwright/test').Page} */ page) => page.evaluate(() => {
    /** @type {any[]} */
    const found = [];
    const walk = (/** @type {Document|ShadowRoot|Element} */ root) => {
        for (const el of root.querySelectorAll('*')) {
            if (el.tagName === 'LCARDS-SLIDER' || el.tagName === 'LCARDS-BUTTON' || el.tagName === 'LCARDS-LAYOUT-CARD') found.push(el);
            if (el.shadowRoot) walk(el.shadowRoot);
        }
    };
    walk(document);
    const shown = (/** @type {any} */ el) => el.checkVisibility() && el.getBoundingClientRect().height > 0;
    const listCell = found.find(el => el.tagName === 'LCARDS-LAYOUT-CARD' && el._config?.view_layout?.['grid-area'] === 'list');
    return {
        lights: found.filter(el => el.tagName === 'LCARDS-SLIDER' && shown(el)).map(el => el.config?.entity).sort(),
        note: found.some(el => el.tagName === 'LCARDS-BUTTON' && shown(el) && el.config?.text?.label?.content === 'No lights in this room'),
        listWidth: listCell ? Math.round(listCell.getBoundingClientRect().width) : null,
    };
});

test('shell rooms: lights per room from the registries, regenerated when a lamp moves', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
    }, { token: TOKEN, hassUrl: HA_URL });
    await pick(TEST_ROOMS.areas.bridge);
    await page.goto(`/${DASHBOARD}/lcars`);
    await page.waitForFunction(() => customElements.get('lcards-layout-view'), null, { timeout: 30_000 });
    await expect.poll(() => lists(page).then(l => l.lights), { timeout: 15_000 }).toEqual(['light.lcards_test_lamp']);
    const bridge = await lists(page);
    expect(bridge.note).toBe(false);
    expect(bridge.listWidth, 'the list cell has its width').toBeGreaterThan(100);

    // A room without lights: no sliders, the note instead; the column keeps its width.
    await pick(TEST_ROOMS.areas.cargo);
    await expect.poll(() => lists(page).then(l => l.note), { timeout: 10_000 }).toBe(true);
    const cargo = await lists(page);
    expect(cargo.lights).toEqual([]);
    expect(cargo.listWidth).toBe(bridge.listWidth);

    // Move the second lamp into the bridge: the dashboard regenerates, no reload.
    await client.call({ type: 'config/entity_registry/update', entity_id: 'light.lcards_test_lamp_2', area_id: areas.bridge });
    await pick(TEST_ROOMS.areas.bridge);
    await expect.poll(() => lists(page).then(l => l.lights), { timeout: 20_000 })
        .toEqual(['light.lcards_test_lamp', 'light.lcards_test_lamp_2']);
});
