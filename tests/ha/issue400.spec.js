/**
 * Layer C checks for GitHub issue #400 on the dev Home Assistant (the
 * `issue-400` view of the lcards-test dashboard): children of an
 * lcards-layout-card with `visibility:` or inside a `conditional` card, in
 * `auto`, `minmax(0, max-content)` and `1fr` rows, and whether a hidden nav
 * card collapses its column. One case per layout card, toggled by
 * input_boolean.lcards_test_visible.
 *
 * Measurements go to reports/ha-issues/issue400.json.
 */
import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { HAClient, HA_URL, TEST_DASHBOARD, readToken, ensureHelpers, ensureDashboard } from './ha-client.mjs';

const TOKEN = readToken();
const CASES = [
    'vis-select-auto', 'cond-select-auto', 'cond-stock-button-auto', 'cond-lcards-button-auto',
    'stock-button-auto', 'lcards-button-auto', 'cond-stock-button-maxcontent', 'cond-stock-button-fr', 'nav-column',
];

test.skip(!TOKEN, 'HA_TOKEN (or .ha-token) not set: skipping real-HA checks');

/** @type {HAClient} */
let client;

test.beforeAll(async () => {
    client = await HAClient.connect(TOKEN);
    await ensureHelpers(client);
    await ensureDashboard(client);
});

test.afterAll(async () => {
    await client?.callService('input_boolean', 'turn_on', { entity_id: 'input_boolean.lcards_test_visible' });
    client?.close();
});

const setVisible = (on) => client.callService('input_boolean', on ? 'turn_on' : 'turn_off', { entity_id: 'input_boolean.lcards_test_visible' });

/** Size of each layout card's grid children, in case order. */
const measure = (page) => page.evaluate(() => {
    const layouts = [];
    const walk = (/** @type {Document|ShadowRoot} */ root) => root.querySelectorAll('*').forEach((el) => {
        if (el.tagName === 'LCARDS-LAYOUT-CARD') layouts.push(el);
        else if (el.shadowRoot) walk(el.shadowRoot);
    });
    walk(document);
    const box = (/** @type {Element|null|undefined} */ el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
    };
    return layouts.map((layout) => {
        const grid = layout.shadowRoot?.querySelector('#grid-root');
        const children = [...(grid?.children ?? [])].filter((el) => !el.classList.contains('area-surface'));
        return children.map((huiCard) => {
            /** @type {any} */
            const card = huiCard.firstElementChild;
            // the card a conditional card shows (hui-conditional-card holds a hui-card or the card)
            const inner = card?.tagName === 'HUI-CONDITIONAL-CARD' ? (card.querySelector('*') ?? card.shadowRoot?.querySelector('*')) : null;
            return {
                wrapper: huiCard.tagName.toLowerCase(),
                card: card?.tagName.toLowerCase() ?? null,
                hidden: huiCard.hasAttribute('hidden') || getComputedStyle(huiCard).display === 'none',
                box: box(huiCard),
                cardBox: box(card),
                innerTag: inner?.tagName.toLowerCase() ?? null,
                innerBox: box(inner),
            };
        });
    });
});

test('#400: layout card children with visibility and conditional cards, by row sizing', async ({ page }) => {
    await setVisible(true);
    await page.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
    }, { token: TOKEN, hassUrl: HA_URL });
    await page.goto(`/${TEST_DASHBOARD}/issue-400`);
    await page.waitForFunction(() => customElements.get('lcards-layout-card'), null, { timeout: 30_000 });
    await page.waitForTimeout(4000);
    const shown = await measure(page);
    await setVisible(false);
    await page.waitForTimeout(2500);
    const hidden = await measure(page);
    await setVisible(true);
    await page.waitForTimeout(2500);
    const again = await measure(page);

    const report = Object.fromEntries(CASES.map((name, i) => [name, { shown: shown[i], hidden: hidden[i], shownAgain: again[i] }]));
    mkdirSync(new URL('../../reports/ha-issues/', import.meta.url), { recursive: true });
    writeFileSync(new URL('../../reports/ha-issues/issue400.json', import.meta.url), JSON.stringify(report, null, 2));
    for (const [name, r] of Object.entries(report)) {
        const fmt = (m) => (m ?? []).map((c) => `${c.card}${c.innerTag ? `>${c.innerTag}` : ''} ${c.hidden ? 'HIDDEN' : 'shown'} ${c.box?.w}x${c.box?.h}${c.innerBox ? ` inner ${c.innerBox.w}x${c.innerBox.h}` : ''}`).join(' | ');
        console.log(`${name.padEnd(30)} on: ${fmt(r.shown)}\n${''.padEnd(30)} off: ${fmt(r.hidden)}\n${''.padEnd(30)} on again: ${fmt(r.shownAgain)}`);
    }
    expect(shown.length).toBe(CASES.length);

    // Every child with a condition shows, hides with the condition, and comes back
    for (const name of CASES.filter((n) => /^(vis|cond)-/.test(n))) {
        const r = report[name];
        expect(r.shown[0].hidden, `${name} shown`).toBe(false);
        expect(r.shown[0].box.h, `${name} has a height when shown`).toBeGreaterThan(0);
        expect(r.hidden[0].hidden, `${name} hidden`).toBe(true);
        expect(r.shownAgain[0].hidden, `${name} back`).toBe(false);
        expect(r.shownAgain[0].box.h).toBe(r.shown[0].box.h);
    }
    // Children without a condition ignore the helper
    for (const name of ['stock-button-auto', 'lcards-button-auto']) expect(report[name].hidden[0].hidden).toBe(false);
    // minmax(0, max-content) keeps the row inside the 160 px layout card
    expect(report['cond-stock-button-maxcontent'].shown[0].box.h).toBeLessThanOrEqual(160);
    // The nav card hides; its 120 px column is not collapsed (no track collapse yet:
    // backlog). Measured only, so this check shows when that feature lands.
    expect(report['nav-column'].hidden[0].hidden).toBe(true);
    console.log('nav column with the nav hidden: main card width', report['nav-column'].hidden[1].box.w, 'of', report['nav-column'].shown[1].box.w + report['nav-column'].shown[0].box.w);
});
