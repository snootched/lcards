/**
 * Visibility-driven track collapse (reports/shell-collapse-plan.md): an LCARS
 * screen keeps its size and reshapes inside it. A hidden card's row or column goes
 * to 0 (fixed, auto and fr tracks alike), the fr tracks take the space, the grid
 * never changes height. Also the regression: an `auto` row next to an `fr` row
 * used to leave the fr row at 0 px (the old JavaScript fr measuring).
 *
 * Cards are stand-ins hidden the way hui-card hides itself: the `hidden` attribute
 * plus a bubbling, composed `card-visibility-changed` event.
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

const AREAS = '"top top top" "nav main side" "foot foot foot"';
const ROWS = '60px 1fr auto';
const COLUMNS = '120px 1fr minmax(0, auto)';
const CARDS = [
    { area: 'top', cond: true, style: 'height:100%' },
    { area: 'nav', cond: true, style: 'height:100%' },
    { area: 'main', cond: false, style: 'height:100%' },
    { area: 'side', cond: true, style: 'height:100%;width:150px' },
    { area: 'foot', cond: true, style: 'height:50px' },
];

/** Mount a layout view (kind 'view') or a layout card (kind 'card') 1000 x 800 with the cards. */
async function mount(page, kind) {
    await page.setViewportSize({ width: 1000, height: 800 });
    await mountCase(page, 'button-lozenge'); // loads the bundle
    await page.evaluate(async ({ kind, AREAS, ROWS, COLUMNS, CARDS }) => {
        if (!customElements.get('collapse-card')) {
            customElements.define('collapse-card', class extends HTMLElement {
                setConfig(c) { this.config = c; }
                connectedCallback() { this.style.cssText += ';background:#345;box-sizing:border-box'; }
            });
        }
        document.getElementById('mount').innerHTML = '';
        document.body.style.margin = '0';
        const visibility = [{ condition: 'state', entity: 'input_boolean.x', state: 'on' }];
        const cards = CARDS.map((c) => ({ type: 'custom:collapse-card', view_layout: { 'grid-area': c.area }, ...(c.cond ? { visibility } : {}) }));
        const layout = { 'grid-template-columns': COLUMNS, 'grid-template-rows': ROWS, 'grid-template-areas': AREAS, 'grid-gap': '0px', height: '800px' };
        let host;
        if (kind === 'view') {
            host = document.createElement('lcards-layout-view');
            host.style.cssText = 'display:block;width:1000px;';
            host.setConfig({ type: 'custom:lcards-layout-view', layout, cards });
            host.cards = cards.map((c, i) => Object.assign(document.createElement('collapse-card'), { id: CARDS[i].area, config: c }));
            host.lovelace = { editMode: false, config: { views: [{ layout, cards }] }, saveConfig: async () => {} };
            document.body.appendChild(host);
        } else {
            host = document.createElement('lcards-layout-card');
            host.setConfig({ type: 'custom:lcards-layout-card', layout, cards });
            document.getElementById('mount').style.cssText = 'width:1000px;padding:0';
            document.getElementById('mount').appendChild(host);
        }
        await host.updateComplete;
        await new Promise((r) => setTimeout(r, 200));
        const grid = host.shadowRoot.querySelector('#grid-root');
        [...grid.children].filter((el) => el.tagName === 'COLLAPSE-CARD').forEach((el, i) => {
            el.id = CARDS[i].area;
            // these stand in for hui-card children, hidden by hand (setHidden): not for the
            // layout card's own no-hui-card fallback, which would check their conditions
            delete el._lcardsVisibility;
            el.hidden = false;
            el.style.display = '';
            el.style.cssText += `;${CARDS[i].style}`;
            el.dispatchEvent(new Event('card-visibility-changed', { bubbles: true, composed: true }));
        });
        await new Promise((r) => setTimeout(r, 100));
        window.__host = host;
    }, { kind, AREAS, ROWS, COLUMNS, CARDS });
}

/** Hide (or show) cards the way hui-card does, then wait for the re-resolve. */
const setHidden = (page, ids) => page.evaluate(async (ids) => {
    const grid = window.__host.shadowRoot.querySelector('#grid-root');
    for (const el of grid.querySelectorAll('collapse-card')) {
        const hide = ids.includes(el.id);
        if (el.hidden !== hide) {
            el.hidden = hide;
            el.dispatchEvent(new Event('card-visibility-changed', { bubbles: true, composed: true }));
        }
    }
    await new Promise((r) => setTimeout(r, 100));
}, ids);

const measure = (page) => page.evaluate(() => {
    const grid = window.__host.shadowRoot.querySelector('#grid-root');
    const cs = getComputedStyle(grid);
    const main = grid.querySelector('#main').getBoundingClientRect();
    return {
        height: Math.round(grid.getBoundingClientRect().height),
        rows: cs.gridTemplateRows, columns: cs.gridTemplateColumns,
        main: [Math.round(main.width), Math.round(main.height)],
    };
});

for (const kind of ['view', 'card']) {
    test(`${kind}: an auto row next to an fr row leaves the fr row its space`, async ({ page }) => {
        await mount(page, kind);
        const m = await measure(page);
        expect(m.rows).toBe('60px 690px 50px');
        expect(m.main).toEqual([730, 690]);
    });

    test(`${kind}: each hidden card collapses its track; the screen keeps its height`, async ({ page }) => {
        await mount(page, kind);
        const cases = [
            [['top'], '0px 750px 50px', '120px 730px 150px', [730, 750]],
            [['foot'], '60px 740px 0px', '120px 730px 150px', [730, 740]],
            [['nav'], '60px 690px 50px', '0px 850px 150px', [850, 690]],
            [['side'], '60px 690px 50px', '120px 880px 0px', [880, 690]],
            [['top', 'nav', 'side', 'foot'], '0px 800px 0px', '0px 1000px 0px', [1000, 800]],
            [[], '60px 690px 50px', '120px 730px 150px', [730, 690]],
        ];
        for (const [hidden, rows, columns, main] of cases) {
            await setHidden(page, hidden);
            const m = await measure(page);
            expect(m, `hidden: ${hidden.join('+') || 'none'}`).toEqual({ height: 800, rows, columns, main });
        }
    });
}

test('outside Home Assistant (no hui-card) a layout card hides a child whose Visibility condition fails, and collapses its column', async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 400 });
    const card = await mountCase(page, 'layout-card-visibility', { width: '600' });
    const state = () => card.evaluate((host) => {
        const [nav, main] = /** @type {any[]} */ (host._cardElements);
        return { navHidden: !!nav.hidden, navShown: nav.getBoundingClientRect().width > 0, mainWidth: Math.round(main.getBoundingClientRect().width) };
    });
    // light.demo starts off in the harness: NAV hidden, MAIN takes the whole width
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await expect.poll(state).toEqual({ navHidden: true, navShown: false, mainWidth: 600 });
    await page.evaluate(() => window.__setState('light.demo', 'on'));
    await expect.poll(state).toEqual({ navHidden: false, navShown: true, mainWidth: 480 });
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await expect.poll(state).toEqual({ navHidden: true, navShown: false, mainWidth: 600 });
});
