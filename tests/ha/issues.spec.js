/**
 * Layer C checks for GitHub issues #408 and #409 on the dev Home Assistant
 * (the `issues` view of the lcards-test dashboard: a layout view with many
 * cards, data sources, a rule, a chart and an MSD).
 *
 * - #408: the page opens one `state_changed` subscription in all, shared by
 *   helpers, data sources and the rules engine, and each still gets its updates.
 * - #409: opening the view by in-app navigation connects each LCARdS element
 *   about once (Home Assistant assigns the view's cards several times); an MSD in
 *   it shows on every reload; edit mode raises no chart errors.
 *
 * Measurements go to reports/ha-issues/<ISSUE_RUN_LABEL or "run">.json for the
 * issue replies (run once on a build without the fixes as "before").
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { HAClient, HA_URL, TEST_DASHBOARD, readToken, ensureHelpers, ensureDashboard } from './ha-client.mjs';

const TOKEN = readToken();
const TEST_DEVICE_ID = '1c4d5e57-0000-4000-8000-00000000c0de';
const LABEL = process.env.ISSUE_RUN_LABEL ?? 'run';
const REPORT = new URL(`../../reports/ha-issues/${LABEL}.json`, import.meta.url);
/** Assert the fixed behaviour; off for a "before" run, which only measures. */
const STRICT = process.env.ISSUE_RUN_STRICT !== '0';

test.skip(!TOKEN, 'HA_TOKEN (or .ha-token) not set: skipping real-HA checks');

/** @type {HAClient} */
let client;
/** @type {Record<string, any>} */
const report = {};

test.beforeAll(async () => {
    client = await HAClient.connect(TOKEN);
    await ensureHelpers(client);
    await ensureDashboard(client);
    await client.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_toggle' });
    await client.callService('input_number', 'set_value', { entity_id: 'input_number.lcards_test_value', value: 10 });
    await client.callService('lcards', 'clear_alert');
});

test.afterAll(async () => {
    client?.close();
    mkdirSync(new URL('../../reports/ha-issues/', import.meta.url), { recursive: true });
    const old = existsSync(REPORT) ? JSON.parse(readFileSync(REPORT, 'utf8')) : {};
    writeFileSync(REPORT, JSON.stringify({ ...old, ...report, label: LABEL, at: new Date().toISOString() }, null, 2));
});

/** Log in with the token; record every outgoing websocket message from page load on. */
async function open(page, path) {
    const problems = [];
    // LCARdS problems only. The test browser blocks service workers, so Home
    // Assistant's own register-service-worker throws on every page: not ours.
    page.on('pageerror', (e) => { if (/lcards/i.test(`${e.message}\n${e.stack}`)) problems.push(`pageerror: ${e.message}`); });
    page.on('console', (m) => {
        const text = m.text();
        const ours = /lcards/i.test(`${text} ${m.location()?.url ?? ''}`);
        if ((m.type() === 'error' && ours) || /Chart update failed|reading 'radar'/i.test(text)) {
            problems.push(`${m.type()}: ${text.replace(/%c.*?bold; /, '').slice(0, 300)}`);
        }
    });
    await page.addInitScript(({ token, hassUrl, deviceId }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
        localStorage.setItem('lcards_device_id', deviceId);
        /** @type {any[]} */
        const out = [];
        /** @type {any} */ (window).__wsOut = out;
        const send = WebSocket.prototype.send;
        WebSocket.prototype.send = function (data) {
            try { out.push(JSON.parse(String(data))); } catch { /* binary */ }
            return send.call(this, data);
        };
    }, { token: TOKEN, hassUrl: HA_URL, deviceId: TEST_DEVICE_ID });
    await page.goto(`/${TEST_DASHBOARD}/${path}`);
    await page.waitForFunction(() => {
        const ha = document.querySelector('home-assistant');
        return !!(ha?.shadowRoot && ha.hass?.states && window.lcards?.core?.themeManager);
    }, null, { timeout: 30_000 });
    await page.evaluate(() => customElements.whenDefined('lcards-button'));
    return problems;
}

/** Every LCARdS element on the page, through shadow roots. */
const countLcards = (page) => page.evaluate(() => {
    let n = 0;
    const walk = (/** @type {Document|ShadowRoot} */ root) => root.querySelectorAll('*').forEach((el) => {
        if (el.tagName.startsWith('LCARDS-')) n++;
        if (el.shadowRoot) walk(el.shadowRoot);
    });
    walk(document);
    return n;
});

/** The MSD card in the issues view, through shadow roots. */
const msdRevealed = () => {
    const find = (/** @type {Document|ShadowRoot} */ root) => {
        for (const el of root.querySelectorAll('*')) {
            if (el.tagName === 'LCARDS-MSD-CARD') return el;
            const inner = el.shadowRoot && find(el.shadowRoot);
            if (inner) return inner;
        }
        return null;
    };
    const card = /** @type {any} */ (find(document));
    return card?._msdRevealed === true && !!card._msdPipeline;
};

/** Text and markup of the LCARdS button whose config id is `id`. */
const buttonMarkup = (page, id) => page.evaluate((id) => {
    const find = (/** @type {Document|ShadowRoot} */ root) => {
        for (const el of root.querySelectorAll('*')) {
            if (el.tagName === 'LCARDS-BUTTON' && /** @type {any} */ (el).config?.id === id) return el;
            const inner = el.shadowRoot && find(el.shadowRoot);
            if (inner) return inner;
        }
        return null;
    };
    return find(document)?.shadowRoot?.innerHTML ?? '';
}, id);

test('#408: one state_changed subscription for helpers, data sources and rules, and each still updates', async ({ page }) => {
    const problems = await open(page, 'issues');
    await page.waitForFunction(msdRevealed, null, { timeout: 30_000 });
    await page.waitForTimeout(3000);

    const subs = await page.evaluate(() => {
        const out = /** @type {any} */ (window).__wsOut;
        /** @type {Record<string, number>} */
        const byType = {};
        for (const m of out) {
            const key = m.type === 'subscribe_events' ? `subscribe_events:${m.event_type ?? '*'}` : m.type;
            if (/^subscribe|^lcards\/subscribe|history\/stream|render_template/.test(key)) byType[key] = (byType[key] ?? 0) + 1;
        }
        const core = window.lcards.core;
        return {
            byType,
            stateChanged: out.filter((m) => m.type === 'subscribe_events' && m.event_type === 'state_changed').length,
            helpers: core.helperManager.getDebugInfo().watchedHelpers,
            dataSources: core.dataSourceManager.sources.size,
            rulesWatching: !!core.rulesManager.hassUnsubscribe,
        };
    });
    report.issue408 = subs;
    console.log('#408 subscriptions', JSON.stringify(subs));

    // Each listener still gets its own updates through the shared subscription.
    await client.callService('input_number', 'set_value', { entity_id: 'input_number.lcards_test_value', value: 42 });
    await expect.poll(() => buttonMarkup(page, 'issue_ds_button'), { timeout: 10_000 }).toContain('42');
    await client.callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.lcards_test_toggle' });
    await expect.poll(async () => (await buttonMarkup(page, 'issue_rule_button')).toLowerCase(), { timeout: 10_000 }).toContain('#00aa00');
    await page.waitForFunction(() => window.lcards.core.helperManager?._valueCache?.get('alert_mode') === 'green_alert', null, { timeout: 15_000 });
    await client.callService('lcards', 'red_alert');
    await expect.poll(() => page.evaluate(() => window.lcards.core.themeManager.getAlertMode()), { timeout: 15_000 }).toBe('red_alert');
    await client.callService('lcards', 'clear_alert');
    await expect.poll(() => page.evaluate(() => window.lcards.core.themeManager.getAlertMode()), { timeout: 15_000 }).toBe('green_alert');
    await client.callService('input_boolean', 'turn_off', { entity_id: 'input_boolean.lcards_test_toggle' });

    report.issue408.problems = problems;
    if (STRICT) {
        expect(subs.dataSources).toBeGreaterThan(0);
        expect(subs.helpers).toBeGreaterThan(10);
        expect(subs.rulesWatching).toBe(true);
        expect(subs.stateChanged).toBe(1);
        expect(problems).toEqual([]);
    }
});

test('#409: navigating to a layout view connects each LCARdS element about once', async ({ page }) => {
    const problems = await open(page, 'cards');
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
        const w = /** @type {any} */ (window);
        const P = customElements.get('lcards-layout-view').prototype;
        const d = /** @type {PropertyDescriptor} */ (Object.getOwnPropertyDescriptor(P, 'cards'));
        let prev = /** @type {any[]|null} */ (null);
        w.__sets = [];
        Object.defineProperty(P, 'cards', {
            configurable: true, get: d.get, set(v) {
                const a = v || [];
                w.__sets.push({ n: a.length, identical: !!prev && a.length === prev.length && a.every((el, i) => el === prev?.[i]) });
                prev = [...a];
                return d.set?.call(this, v);
            },
        });
        let p = customElements.get('lcards-button').prototype;
        while (p && p.constructor.name !== 'LCARdSNativeCard') p = Object.getPrototypeOf(p);
        const cc = p.connectedCallback;
        w.__conn = 0;
        p.connectedCallback = function (...a) { w.__conn++; return cc.apply(this, a); };
        history.pushState(null, '', `${location.pathname.replace(/[^/]+$/, '')}issues`);
        window.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
    });
    await page.waitForFunction(msdRevealed, null, { timeout: 30_000 });
    await page.waitForTimeout(3000);
    const elements = await countLcards(page);
    const measured = await page.evaluate(() => {
        const w = /** @type {any} */ (window);
        return { connects: w.__conn, cardsAssignments: w.__sets.length, identicalAssignments: w.__sets.filter((s) => s.identical).length };
    });
    // As in the report: child cards fire card-updated (streamline-card does, once its
    // templates load), and hui-view hands the layout view the same cards again each time.
    const afterUpdates = await page.evaluate(async () => {
        const w = /** @type {any} */ (window);
        w.__conn = 0;
        w.__sets.length = 0;
        const huiCards = [];
        const walk = (/** @type {Document|ShadowRoot} */ root) => root.querySelectorAll('*').forEach((el) => {
            if (el.tagName === 'HUI-CARD') huiCards.push(el);
            if (el.shadowRoot) walk(el.shadowRoot);
        });
        walk(document);
        for (const card of huiCards.slice(0, 3)) card.dispatchEvent(new Event('card-updated'));
        await new Promise((r) => setTimeout(r, 1500));
        return { cardUpdatedEvents: Math.min(3, huiCards.length), cardsAssignments: w.__sets.length, identicalAssignments: w.__sets.filter((s) => s.identical).length, connects: w.__conn };
    });
    const msdStillShown = await page.evaluate(msdRevealed);
    report.issue409 = { navigation: { ...measured, lcardsElements: elements, connectsPerElement: +(measured.connects / elements).toFixed(2) }, afterUpdates, msdStillShown, problems };
    console.log('#409', JSON.stringify(report.issue409));
    if (STRICT) {
        // Each element connects once; a little slack for cards Home Assistant itself recreates.
        expect(measured.connects).toBeLessThanOrEqual(Math.ceil(elements * 1.2));
        // The same cards assigned again reconnect nothing.
        expect(afterUpdates.cardsAssignments).toBeGreaterThan(0);
        expect(afterUpdates.connects).toBe(0);
        expect(msdStillShown).toBe(true);
        expect(problems).toEqual([]);
    }
});

test('#409: an MSD in a layout view shows on every reload', async ({ page }) => {
    const problems = await open(page, 'issues');
    const results = [];
    for (let i = 0; i < 6; i++) {
        if (i) await page.reload();
        const shown = await page.waitForFunction(msdRevealed, null, { timeout: 20_000 }).then(() => true, () => false);
        results.push(shown);
    }
    report.msdReloads = { shown: results.filter(Boolean).length, of: results.length, problems };
    console.log('#409 MSD reloads', JSON.stringify(report.msdReloads));
    if (STRICT) {
        expect(results.every(Boolean)).toBe(true);
        expect(problems).toEqual([]);
    }
});

test('edit mode on the layout view raises no chart errors', async ({ page }) => {
    const problems = await open(page, 'issues');
    await page.waitForFunction(msdRevealed, null, { timeout: 30_000 });
    const setEdit = (on) => page.evaluate((on) => {
        const find = (/** @type {Document|ShadowRoot} */ root) => {
            for (const el of root.querySelectorAll('*')) {
                if (el.tagName === 'HUI-ROOT') return el;
                const inner = el.shadowRoot && find(el.shadowRoot);
                if (inner) return inner;
            }
            return null;
        };
        /** @type {any} */ (find(document))?.lovelace?.setEditMode(on);
    }, on);
    for (let i = 0; i < 3; i++) {
        await setEdit(true);
        await page.waitForTimeout(1500);
        await client.callService('input_number', 'set_value', { entity_id: 'input_number.lcards_test_value', value: 20 + i });
        await page.waitForTimeout(500);
        await setEdit(false);
        await page.waitForTimeout(1500);
    }
    report.editMode = { problems };
    console.log('edit mode', JSON.stringify(report.editMode));
    if (STRICT) expect(problems).toEqual([]);
});
