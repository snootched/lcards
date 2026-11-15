/**
 * Layer C: which layout view tracks collapse when their card is hidden
 * (reports/shell-collapse-plan.md). The `collapse` view of the lcards-test
 * dashboard has one card per track kind (fixed row, fixed column, auto column,
 * auto row), all hidden by input_boolean.lcards_test_visible. Records resolved
 * tracks and boxes to reports/ha-issues/<COLLAPSE_RUN_LABEL or "collapse">.json.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { HAClient, HA_URL, TEST_DASHBOARD, readToken, ensureHelpers, ensureDashboard } from './ha-client.mjs';

const TOKEN = readToken();
const LABEL = process.env.COLLAPSE_RUN_LABEL ?? 'collapse';
const VISIBLE = 'input_boolean.lcards_test_visible';

test.skip(!TOKEN, 'HA_TOKEN (or .ha-token) not set: skipping real-HA checks');

/** @type {HAClient} */
let client;
test.beforeAll(async () => {
    client = await HAClient.connect(TOKEN);
    await ensureHelpers(client);
    await ensureDashboard(client);
});
test.afterAll(async () => {
    await client?.callService('input_boolean', 'turn_on', { entity_id: VISIBLE });
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
    return { rows: cs.gridTemplateRows, columns: cs.gridTemplateColumns, inlineRows: grid.style.gridTemplateRows || null, areas };
});

test('layout view: which tracks collapse when their card is hidden', async ({ page }) => {
    await client.callService('input_boolean', 'turn_on', { entity_id: VISIBLE });
    await page.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
    }, { token: TOKEN, hassUrl: HA_URL });
    await page.goto(`/${TEST_DASHBOARD}/collapse`);
    await page.waitForFunction(() => customElements.get('lcards-layout-view'), null, { timeout: 30_000 });
    await page.waitForTimeout(3500);
    const shown = await measure(page);
    await client.callService('input_boolean', 'turn_off', { entity_id: VISIBLE });
    await page.waitForTimeout(2500);
    const hidden = await measure(page);
    await client.callService('input_boolean', 'turn_on', { entity_id: VISIBLE });
    await page.waitForTimeout(2500);
    const again = await measure(page);
    const report = { shown, hidden, again };
    for (const [k, m] of Object.entries(report)) console.log(`${k.padEnd(7)} rows ${m.rows} | cols ${m.columns} | main ${m.areas.main.w}x${m.areas.main.h}`);
    mkdirSync(new URL('../../reports/ha-issues/', import.meta.url), { recursive: true });
    writeFileSync(new URL(`../../reports/ha-issues/${LABEL}.json`, import.meta.url), JSON.stringify(report, null, 2));
    // An LCARS screen keeps its size and reshapes inside: every track kind collapses
    // (fixed row, fixed column, auto row, auto column), fr takes the space.
    const px = (list) => list.split(' ').map(parseFloat);
    const [top, mid, foot] = px(shown.rows);
    expect([top, foot]).toEqual([60, 50]);
    expect(mid, 'the fr row gets its space next to an auto row').toBeGreaterThan(500);
    expect(px(shown.columns)[0]).toBe(120);
    // the two 5 px grid gaps stay beside the collapsed rows
    expect(hidden.rows).toBe(`0px ${top + mid + foot}px 0px`);
    expect(px(hidden.columns)[0], 'the fixed nav column collapses').toBe(0);
    expect(px(hidden.columns)[2], 'the auto side column collapses').toBe(0);
    expect(hidden.areas.main.h).toBe(top + mid + foot);
    expect(again).toEqual(shown);
});
