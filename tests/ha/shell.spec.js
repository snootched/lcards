/**
 * Layer C: the LCARS shell strategy (custom:lcars-shell) on the dev Home
 * Assistant, as the strategy generates it (reports/shell-collapse-plan.md,
 * phase 0 baseline). A hidden `lcards-test-shell` dashboard runs the strategy with
 * lcards_test_* helpers: the top bar follows input_boolean.lcards_test_visible,
 * the right sidebar input_boolean.lcards_test_toggle, the page selector
 * input_select.lcards_test_mode (no room selector: no auto-entities needed).
 *
 * Records the view's resolved tracks and every area's box with each part shown
 * and hidden, to reports/ha-issues/<SHELL_RUN_LABEL or "shell">.json.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { HAClient, HA_URL, readToken, ensureHelpers } from './ha-client.mjs';

const TOKEN = readToken();
export const SHELL_DASHBOARD = 'lcards-test-shell';
const LABEL = process.env.SHELL_RUN_LABEL ?? 'shell';
const TOP = 'input_boolean.lcards_test_visible';
const RIGHT = 'input_boolean.lcards_test_toggle';

test.skip(!TOKEN, 'HA_TOKEN (or .ha-token) not set: skipping real-HA checks');

/** @type {HAClient} */
let client;

test.beforeAll(async () => {
    client = await HAClient.connect(TOKEN);
    await ensureHelpers(client);
    const dashboards = await client.call({ type: 'lovelace/dashboards/list' });
    if (!dashboards.some((d) => d.url_path === SHELL_DASHBOARD)) {
        await client.call({
            type: 'lovelace/dashboards/create', url_path: SHELL_DASHBOARD, title: 'LCARdS Test Shell',
            mode: 'storage', require_admin: false, show_in_sidebar: false,
        });
    }
    await client.call({
        type: 'lovelace/config/save', url_path: SHELL_DASHBOARD,
        config: { strategy: { type: 'custom:lcars-shell', page_selector_entity: 'input_select.lcards_test_mode', top_bar_entity: TOP, right_sidebar_entity: RIGHT } },
    });
});

test.afterAll(async () => {
    await client?.callService('input_boolean', 'turn_on', { entity_id: TOP });
    await client?.callService('input_boolean', 'turn_off', { entity_id: RIGHT });
    client?.close();
});

const set = (entity, on) => client.callService('input_boolean', on ? 'turn_on' : 'turn_off', { entity_id: entity });

/** The shell view's resolved tracks and each area's box (grid children keyed by grid-area). */
const measure = (page) => page.evaluate(() => {
    let view = null;
    const walk = (/** @type {Document|ShadowRoot} */ root) => {
        for (const el of root.querySelectorAll('*')) {
            if (el.tagName === 'LCARDS-LAYOUT-VIEW') { view = el; return; }
            if (el.shadowRoot) walk(el.shadowRoot);
            if (view) return;
        }
    };
    walk(document);
    if (!view) return null;
    const v = /** @type {any} */ (view);
    const grid = v.shadowRoot.querySelector('#grid-root');
    const cs = getComputedStyle(grid);
    const host = v.getBoundingClientRect();
    /** @type {Record<string, any>} */
    const areas = {};
    for (const el of grid.children) {
        if (el.classList.contains('area-surface')) continue;
        const area = /** @type {any} */ (el).config?.view_layout?.['grid-area'] ?? el.style.gridArea ?? '?';
        const r = el.getBoundingClientRect();
        areas[area] = {
            x: Math.round(r.x - host.x), y: Math.round(r.y - host.y), w: Math.round(r.width), h: Math.round(r.height),
            hidden: el.hasAttribute('hidden') || getComputedStyle(el).display === 'none',
        };
    }
    return {
        host: { w: Math.round(host.width), h: Math.round(host.height) },
        rows: cs.gridTemplateRows, columns: cs.gridTemplateColumns,
        inlineRows: grid.style.gridTemplateRows || null,
        areas,
    };
});

test('shell strategy: top bar and right sidebar collapse and come back', async ({ page }) => {
    await set(TOP, true);
    await set(RIGHT, true);
    await page.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
    }, { token: TOKEN, hassUrl: HA_URL });
    await page.goto(`/${SHELL_DASHBOARD}/lcars`);
    await page.waitForFunction(() => customElements.get('lcards-layout-view'), null, { timeout: 30_000 });
    await page.waitForTimeout(4000);

    const steps = [
        ['both shown', null],
        ['top bar hidden', () => set(TOP, false)],
        ['both hidden', () => set(RIGHT, false)],
        ['sidebar only hidden', () => set(TOP, true)],
        ['both shown again', () => set(RIGHT, true)],
    ];
    /** @type {Record<string, any>} */
    const report = {};
    for (const [name, act] of steps) {
        if (act) { await act(); await page.waitForTimeout(2500); }
        report[name] = await measure(page);
        const m = report[name];
        const a = (k) => (m?.areas?.[k] ? `${m.areas[k].w}x${m.areas[k].h}${m.areas[k].hidden ? ' hidden' : ''}` : '-');
        console.log(`${String(name).padEnd(20)} rows: ${m?.rows}\n${''.padEnd(20)} cols: ${m?.columns}\n${''.padEnd(20)} header-border ${a('header-border')} | sidebar-right ${a('sidebar-right')} | content-panel ${a('content-panel')} | header ${a('header')}`);
    }
    mkdirSync(new URL('../../reports/ha-issues/', import.meta.url), { recursive: true });
    writeFileSync(new URL(`../../reports/ha-issues/${LABEL}.json`, import.meta.url), JSON.stringify(report, null, 2));
    expect(report['both shown']).not.toBeNull();
    // Same shape as the phase 0 baseline (reports/shell-collapse-plan.md) in every
    // state: the top bar row and the right sidebar column collapse, the content
    // panel takes their space, the screen keeps its size.
    const box = (state, area) => report[state].areas[area];
    expect(report['top bar hidden'].rows.split(' ')[0]).toBe('0px');
    expect(box('top bar hidden', 'content-panel').h - box('both shown', 'content-panel').h).toBe(box('both shown', 'header-border').h);
    expect(report['both hidden'].columns.split(' ').at(-1)).toBe('0px');
    expect(box('both hidden', 'content-panel').w - box('top bar hidden', 'content-panel').w).toBe(box('both shown', 'sidebar-right').w);
    expect(report['both shown again']).toEqual(report['both shown']);
    for (const state of Object.keys(report)) expect(report[state].host).toEqual(report['both shown'].host);
});
