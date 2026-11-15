/**
 * Layer C: the layout view's `layout.height` values after the CSS collapse rewrite
 * (reports/strategies-plan.md S0.1). The old code shared fr rows from the host's
 * measured height whatever `layout.height` said; now CSS uses `layout.height`.
 *
 * Adds generated views to the lcards-test dashboard: the `collapse` view's grid
 * (rows `60px 1fr auto`, columns `120px 1fr minmax(0, auto)`) with each height
 * (default, 100%, auto, 80vh, 600px), with three row sets (the auto row beside fr,
 * fixed rows round fr, fr only), once with Visibility conditions (shown and hidden)
 * and once without. Records tracks, boxes and scrolling to
 * reports/ha-issues/<LAYOUT_HEIGHT_RUN_LABEL or "layout-height">.json, so a run on
 * an older bundle can be compared.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { HAClient, HA_URL, TEST_DASHBOARD, readToken, ensureHelpers, ensureDashboard } from './ha-client.mjs';

const TOKEN = readToken();
const LABEL = process.env.LAYOUT_HEIGHT_RUN_LABEL ?? 'layout-height';
const VISIBLE = 'input_boolean.lcards_test_visible';
const HEIGHTS = /** @type {const} */ ([['default', undefined], ['100pct', '100%'], ['auto', 'auto'], ['80vh', '80vh'], ['600px', '600px']]);
// The collapse view's rows (an auto row beside fr), fixed rows round fr, fr only.
const GRIDS = /** @type {const} */ ([['autorow', undefined], ['fixed', '60px 1fr 50px'], ['fr', '1fr 2fr 1fr']]);
/** @type {string[]} */
const PATHS = [];
for (const [g] of GRIDS) for (const [h] of HEIGHTS) for (const vis of ['vis', 'plain']) PATHS.push(`lh-${g}-${h}-${vis}`);

test.skip(!TOKEN, 'HA_TOKEN (or .ha-token) not set: skipping real-HA checks');

/** @type {HAClient} */
let client;
test.beforeAll(async () => {
    client = await HAClient.connect(TOKEN);
    await ensureHelpers(client);
    const config = await ensureDashboard(client);
    const base = config.views.find((/** @type {any} */ v) => v.path === 'collapse');
    const strip = (/** @type {any} */ c) => { const { visibility, ...rest } = c; return rest; };
    for (const [g, rows] of GRIDS) {
        for (const [name, height] of HEIGHTS) {
            for (const vis of [true, false]) {
                const view = structuredClone(base);
                view.path = `lh-${g}-${name}-${vis ? 'vis' : 'plain'}`;
                view.title = view.path;
                if (rows !== undefined) view.layout['grid-template-rows'] = rows;
                if (height !== undefined) view.layout.height = height;
                if (!vis) view.cards = view.cards.map(strip);
                config.views.push(view);
            }
        }
    }
    await client.call({ type: 'lovelace/config/save', url_path: TEST_DASHBOARD, config });
});
test.afterAll(async () => {
    await client?.callService('input_boolean', 'turn_on', { entity_id: VISIBLE });
    if (client) await ensureDashboard(client);
    client?.close();
});

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
    const v = /** @type {any} */ (view);
    const grid = v.shadowRoot.querySelector('#grid-root');
    const cs = getComputedStyle(grid);
    /** @type {Record<string, any>} */
    const areas = {};
    for (const el of grid.children) {
        if (el.classList.contains('area-surface')) continue;
        const r = el.getBoundingClientRect();
        areas[/** @type {any} */ (el).config?.view_layout?.['grid-area'] ?? '?'] = { w: Math.round(r.width), h: Math.round(r.height), hidden: el.hasAttribute('hidden') };
    }
    const host = v.getBoundingClientRect();
    const se = document.scrollingElement;
    return {
        hostH: Math.round(host.height), hostTop: Math.round(host.top),
        gridH: Math.round(grid.getBoundingClientRect().height),
        gridScrollH: grid.scrollHeight, gridClientH: grid.clientHeight,
        pageScrollH: se?.scrollHeight ?? null, innerH: window.innerHeight,
        rows: cs.gridTemplateRows, columns: cs.gridTemplateColumns, areas,
    };
});

test('layout view: layout.height values with and without visibility', async ({ page }) => {
    test.setTimeout(600_000);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
    }, { token: TOKEN, hassUrl: HA_URL });
    /** @type {Record<string, any>} */
    const report = {};
    for (const path of PATHS) {
        {
            const vis = path.endsWith('-vis');
            await client.callService('input_boolean', 'turn_on', { entity_id: VISIBLE });
            await page.goto(`/${TEST_DASHBOARD}/${path}`);
            await page.waitForFunction(() => customElements.get('lcards-layout-view'), null, { timeout: 30_000 });
            await page.waitForTimeout(3000);
            const shown = await measure(page);
            const entry = /** @type {Record<string, any>} */ ({ shown });
            if (vis) {
                await client.callService('input_boolean', 'turn_off', { entity_id: VISIBLE });
                await page.waitForTimeout(2000);
                entry.hidden = await measure(page);
                await client.callService('input_boolean', 'turn_on', { entity_id: VISIBLE });
                await page.waitForTimeout(2000);
            }
            report[path] = entry;
            const fmt = (/** @type {any} */ m) => `host ${m.hostH} rows ${m.rows} main ${m.areas.main.w}x${m.areas.main.h} scroll ${m.gridScrollH}/${m.gridClientH} page ${m.pageScrollH}/${m.innerH}`;
            console.log(`${path.padEnd(24)} shown  ${fmt(shown)}`);
            if (entry.hidden) console.log(`${''.padEnd(24)} hidden ${fmt(entry.hidden)}`);
        }
    }
    mkdirSync(new URL('../../reports/ha-issues/', import.meta.url), { recursive: true });
    writeFileSync(new URL(`../../reports/ha-issues/${LABEL}.json`, import.meta.url), JSON.stringify(report, null, 2));
    expect(Object.keys(report)).toHaveLength(PATHS.length);
    // Measured 2026-11-15 against the bundle before 87ecf911: with fixed or fr rows
    // every definite height fills exactly as before (the old code only rounded to
    // whole px); the old auto + fr rows bug (fr row 0px) is gone; height: auto grows
    // to its content and never scrolls.
    const px = (/** @type {string} */ list) => list.split(' ').map(parseFloat);
    const sum = (/** @type {string} */ list) => px(list).reduce((a, b) => a + b, 0);
    const GAPS = 10;
    for (const [path, entry] of Object.entries(report)) {
        const definite = !path.includes('-auto-');
        for (const [state, m] of Object.entries(entry)) {
            const at = `${path} ${state}`;
            expect(m.gridScrollH, `${at}: no scrolling`).toBe(m.gridClientH);
            expect(px(m.rows)[1], `${at}: the fr row has space`).toBeGreaterThan(50);
            if (definite) expect(Math.round(sum(m.rows) + GAPS), `${at}: rows fill the height`).toBe(m.hostH);
            if (definite && path.includes('-600px-')) expect(m.hostH, at).toBe(600);
            if (definite && path.includes('-80vh-')) expect(m.hostH, at).toBe(Math.round(m.innerH * 0.8));
            if (state === 'hidden') {
                expect([px(m.rows)[0], px(m.rows)[2]], `${at}: hidden rows collapse`).toEqual([0, 0]);
                expect(m.areas.main.h, `${at}: main takes the height`).toBe(Math.round(sum(m.rows)));
            }
        }
    }
});
