/**
 * Layout view edit mode: the editor chrome must not cover or steal the pointer
 * from what it edits (reports/layout-edit-usability-2026-10-17.md).
 *
 * The view is mounted in edit mode against a fake lovelace (saves recorded in
 * window.__saves). HA's dropdown / button elements are stubbed with their real
 * box behaviour (ha-dropdown is display: contents), which is what hit-testing needs.
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

const VIEW = {
    type: 'custom:lcards-layout-view',
    layout: {
        height: '700px',
        'grid-template-columns': '170px 1fr 1fr',
        'grid-template-rows': '64px 140px 1fr',
        'grid-template-areas': '"header header header" "side temp humid" "side chart chart"',
        'grid-gap': '6px',
    },
    cards: [
        { type: 'custom:test-card', view_layout: { 'grid-area': 'header' } },
        { type: 'custom:test-card', view_layout: { 'grid-area': 'temp' } },
        { type: 'custom:test-card', view_layout: { 'grid-area': 'humid' } },
        { type: 'custom:test-card', view_layout: { 'grid-area': 'chart' }, tap_action: { action: 'toggle' } },
    ],
};

/** Mount the view in edit mode; resolves once the grid edit overlay has measured. */
async function mountView(page, viewConfig = VIEW) {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mountCase(page, 'button-lozenge'); // loads the bundle
    await page.evaluate(async (viewConfig) => {
        const def = (tag, display = 'inline-block', extra = '') => {
            if (customElements.get(tag)) return;
            customElements.define(tag, class extends HTMLElement {
                connectedCallback() { this.style.cssText += `display:${display};${extra}`; }
            });
        };
        def('ha-dropdown', 'contents');
        def('ha-dropdown-item', 'block');
        def('ha-icon-button', 'inline-block', 'width:var(--ha-icon-button-size,48px);height:var(--ha-icon-button-size,48px);');
        def('ha-button', 'inline-block', 'height:32px;min-width:60px;');
        def('wa-button-group', 'inline-flex');
        def('ha-input', 'block', 'height:40px;');
        def('ha-selector', 'block', 'height:40px;');
        // A card that records taps (its tap action must never run in edit mode).
        window.__taps = 0;
        if (!customElements.get('test-card')) {
            customElements.define('test-card', class extends HTMLElement {
                connectedCallback() {
                    // Not cssText: that would wipe the grid placement the view applied.
                    Object.assign(this.style, { display: 'block', height: '100%', background: '#345' });
                    this.addEventListener('click', () => { window.__taps++; });
                }
            });
        }
        document.getElementById('mount').innerHTML = '';
        document.body.style.margin = '0';
        // The HA design tokens the edit chrome uses (HA defines them; the harness doesn't).
        const root = document.documentElement.style;
        [1, 2, 3, 4].forEach(n => root.setProperty(`--ha-space-${n}`, `${n * 4}px`));
        root.setProperty('--ha-border-width-sm', '1px');
        root.setProperty('--ha-border-width-md', '2px');
        window.__saves = [];
        const view = document.createElement('lcards-layout-view');
        view.style.cssText = 'position:absolute;left:0;top:0;width:1100px;';
        view.index = 0;
        view.setConfig(viewConfig);
        view.cards = viewConfig.cards.map((config) => {
            const el = document.createElement('test-card');
            el.config = config;
            return el;
        });
        const lovelace = {
            editMode: true,
            config: { views: [viewConfig] },
            saveConfig: async (cfg) => { window.__saves.push(cfg); },
        };
        view.lovelace = lovelace;
        window.__view = view;
        document.body.appendChild(view);
        await customElements.whenDefined('lcards-grid-edit-overlay');
        await new Promise(r => setTimeout(r, 300));
    }, viewConfig);
}

/** Rects (page coordinates) of overlay parts, by selector. */
const rects = (page, sel) => page.evaluate((s) => {
    const ov = window.__view.shadowRoot.querySelector('lcards-grid-edit-overlay');
    return [...ov.shadowRoot.querySelectorAll(s)].map(e => {
        const r = e.getBoundingClientRect();
        return { id: e.id, cls: e.className, left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    });
}, sel);

/** What the pointer would hit at (x, y) inside the overlay: [id, class] of the topmost element, walked to a known part. */
const hitAt = (page, x, y) => page.evaluate(([px, py]) => {
    const ov = window.__view.shadowRoot.querySelector('lcards-grid-edit-overlay');
    let el = ov.shadowRoot.elementFromPoint(px, py);
    while (el && !(el.matches?.('ha-icon-button, .area-overlay, .rh-seg, .col-header, .row-header, .cell-target, .edit-bar'))) {
        el = el.parentElement ?? el.getRootNode()?.host ?? null;
    }
    return el ? `${el.localName}${el.id ? '#' + el.id : ''}.${String(el.className).trim().split(/\s+/).join('.')}` : null;
}, [x, y]);

test('grid mode: column headers and the toolbar sit outside the cells', async ({ page }) => {
    await mountView(page);
    const areas = await rects(page, '.area-overlay');
    const headers = await rects(page, '.col-header');
    const [bar] = await rects(page, '.edit-bar');
    const firstTop = Math.min(...areas.map(a => a.top));
    expect(headers).toHaveLength(3);
    for (const h of headers) expect(h.bottom).toBeLessThanOrEqual(firstTop);
    expect(bar.bottom).toBeLessThanOrEqual(Math.min(...headers.map(h => h.top)));
    // Row headers sit left of the first column.
    const firstLeft = Math.min(...areas.map(a => a.left));
    for (const h of await rects(page, '.row-header')) expect(h.right).toBeLessThanOrEqual(firstLeft);
});

test('grid mode: a row-0 area menu button is hit over its whole height (never a header)', async ({ page }) => {
    await mountView(page);
    const triggers = await rects(page, '#ao-header .area-menu ha-icon-button');
    expect(triggers).toHaveLength(1);
    const t = triggers[0];
    expect(t.width).toBeGreaterThan(20);
    const cx = t.left + t.width / 2;
    for (const y of [t.top + 1, t.top + t.height / 2, t.bottom - 1]) {
        expect(await hitAt(page, cx, y)).toMatch(/^ha-icon-button/);
    }
    // It sits at the area's top-right corner (ha-dropdown is display: contents).
    const [area] = await rects(page, '#ao-header');
    expect(area.right - t.right).toBeLessThan(12);
});

test('grid mode: the middle of a spanning area is the area, not a resize handle', async ({ page }) => {
    await mountView(page);
    const [chart] = await rects(page, '#ao-chart');
    const [temp] = await rects(page, '#ao-temp');
    const [humid] = await rects(page, '#ao-humid');
    const boundaryX = (temp.right + humid.left) / 2; // column 2|3 boundary, which `chart` spans
    expect(await hitAt(page, boundaryX, chart.top + chart.height / 2)).toMatch(/^div#ao-chart/);
    // Between two different areas the boundary is a resize handle.
    expect(await hitAt(page, boundaryX, temp.top + temp.height / 2)).toMatch(/rh-seg/);
});

test('grid mode: a resize drag released outside the view ends (no stuck drag)', async ({ page }) => {
    await mountView(page);
    const [seg] = await rects(page, '#rh-col-1-g');
    await page.mouse.move(seg.left + seg.width / 2, seg.top + 4);
    await page.mouse.down();
    await page.mouse.move(seg.left + 40, seg.top + 4, { steps: 4 });
    await page.mouse.move(1190, 790, { steps: 4 }); // outside the 1100px-wide view
    await page.mouse.up();
    const state = await page.evaluate(() => {
        const ov = window.__view.shadowRoot.querySelector('lcards-grid-edit-overlay');
        return { drag: ov._resizeDrag, saves: window.__saves.length };
    });
    expect(state.drag).toBeNull();
    expect(state.saves).toBe(1); // the resize was committed once
});

test('grid mode: pointercancel ends a rubber-band selection', async ({ page }) => {
    await mountView(page);
    await page.evaluate(() => {
        const ov = window.__view.shadowRoot.querySelector('lcards-grid-edit-overlay');
        ov._selStart = { r: 0, c: 0 }; ov._selEnd = { r: 0, c: 1 }; ov._selDrag = true;
        ov.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
    });
    const state = await page.evaluate(() => {
        const ov = window.__view.shadowRoot.querySelector('lcards-grid-edit-overlay');
        return { drag: ov._selDrag, start: ov._selStart, popup: ov._showNameInput };
    });
    expect(state).toEqual({ drag: false, start: null, popup: false });
});

test('card mode: cards are inert, controls follow HA (pencil + top-right menu)', async ({ page }) => {
    await mountView(page);
    await page.evaluate(async () => { window.__view._editSubMode = 'cards'; await window.__view.updateComplete; });
    await page.waitForTimeout(200);
    const info = await page.evaluate(() => {
        const root = window.__view.shadowRoot;
        const wraps = [...root.querySelectorAll('.card-edit-wrap')];
        const wrap = wraps[3].getBoundingClientRect();
        const trig = wraps[3].querySelector('.card-edit-menu ha-icon-button').getBoundingClientRect();
        const grid = root.querySelector('#grid-root').getBoundingClientRect();
        const bar = root.querySelector('.edit-bar').getBoundingClientRect();
        return {
            inert: wraps.map(w => w.querySelector('test-card').inert),
            controls: wraps.every(w => w.querySelector('.card-edit-control')),
            menuRightGap: wrap.right - trig.right,
            menuTopGap: trig.top - wrap.top,
            barBelowGridTop: bar.bottom <= Math.min(...wraps.map(w => w.getBoundingClientRect().top)),
            wrapCenter: [wrap.left + wrap.width / 2, wrap.top + wrap.height / 2],
            gridTop: grid.top,
        };
    });
    expect(info.inert).toEqual([true, true, true, true]);
    expect(info.controls).toBe(true);
    expect(info.menuRightGap).toBeLessThan(12);
    expect(info.menuTopGap).toBeLessThan(12);
    expect(info.barBelowGridTop).toBe(true);
    // A real click on the card never reaches it (its tap action can't run).
    await page.mouse.click(info.wrapCenter[0], info.wrapCenter[1]);
    expect(await page.evaluate(() => window.__taps)).toBe(0);
});

test('leaving edit mode makes cards interactive again', async ({ page }) => {
    await mountView(page);
    await page.evaluate(async () => {
        const v = window.__view;
        v.lovelace = { ...v.lovelace, editMode: false };
        await v.updateComplete;
    });
    const inert = await page.evaluate(() => [...window.__view.shadowRoot.querySelectorAll('test-card')].map(c => c.inert));
    expect(inert).toEqual([false, false, false, false]);
});

test('placement: changing one overflow axis keeps the other, in one save', async ({ page }) => {
    await mountView(page);
    const saved = await page.evaluate(async () => {
        const v = window.__view;
        // The card currently has the shorthand (both axes auto).
        const cards = v._config.cards.map((c, i) => i === 1 ? { ...c, view_layout: { ...c.view_layout, overflow: 'auto' } } : c);
        v._config = { ...v._config, cards };
        window.__saves.length = 0;
        v._setOverflow(1, 'hidden', 'auto');
        await new Promise(r => setTimeout(r, 50));
        return { count: window.__saves.length, vl: window.__saves.at(-1).views[0].cards[1].view_layout };
    });
    expect(saved.count).toBe(1);
    expect(saved.vl).toEqual({ 'grid-area': 'temp', 'overflow-x': 'hidden', 'overflow-y': 'auto' });
});

test('card mode: stacked cards in one area get a picker; the picked card takes the pointer', async ({ page }) => {
    const stacked = {
        ...VIEW,
        cards: [
            ...VIEW.cards,
            { type: 'custom:stack-a', view_layout: { 'grid-area': 'chart' } },
            { type: 'custom:stack-b', view_layout: { 'grid-area': 'chart', 'z-index': 5 } },
        ],
    };
    await mountView(page, stacked);
    await page.evaluate(async () => { window.__view._editSubMode = 'cards'; await window.__view.updateComplete; });
    await page.waitForTimeout(200);
    const state = () => page.evaluate(() => {
        const root = window.__view.shadowRoot;
        const wraps = [...root.querySelectorAll('.card-edit-wrap')];
        const active = root.querySelector('.card-edit-wrap.stack-active');
        const r = active.getBoundingClientRect();
        // What a click in the middle of the area reaches.
        const hit = root.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('.card-edit-wrap');
        return {
            pills: [...root.querySelectorAll('.stack-picker ha-button')].map(b => b.textContent.trim()),
            active: wraps.indexOf(active),
            hit: wraps.indexOf(hit),
            inactive: root.querySelectorAll('.card-edit-wrap.stack-inactive').length,
            zIndex: active.style.zIndex,
        };
    });
    // One picker (chart holds 3 cards), the top card in front by default.
    let s = await state();
    expect(s.pills).toEqual(['test-card', 'stack-a', 'stack-b']);
    expect(s.active).toBe(5);
    expect(s.inactive).toBe(2);
    expect(s.hit).toBe(5);
    // Picking the bottom card brings it above the stack's own z-index (5).
    await page.evaluate(() => window.__view.shadowRoot.querySelectorAll('.stack-picker ha-button')[0].click());
    s = await state();
    expect(s.active).toBe(3);
    expect(s.hit).toBe(3);
    expect(Number(s.zIndex)).toBeGreaterThan(5);
});

const FREE = {
    type: 'custom:lcards-layout-view',
    layout: {
        height: '600px',
        'grid-template-columns': '1fr 1fr 1fr',
        'grid-template-rows': '1fr 1fr 1fr',
        'grid-template-areas': '"a . ." ". . ." ". . b"',
        'grid-gap': '6px',
    },
    cards: [{ type: 'custom:test-card', view_layout: { 'grid-area': 'a' } }],
};

/** Centre (page coords) of the empty cell target at r,c, or of an overlay part. */
const centre = async (page, sel) => {
    const [r] = await rects(page, sel);
    return [r.left + r.width / 2, r.top + r.height / 2];
};
const lastAreas = (page) => page.evaluate(() => window.__saves.at(-1)?.views[0].layout['grid-template-areas'] ?? null);

test('area: drag an edge grip to resize, the name chip to move; blocked targets do nothing', async ({ page }) => {
    await mountView(page, FREE);
    // Select a, then drag its right grip over the third column.
    await page.mouse.click(...(await centre(page, '#ao-a')));
    const [gx, gy] = await centre(page, '#ag-e');
    const [tx, ty] = await centre(page, '#ct-0-2');
    await page.mouse.move(gx, gy);
    await page.mouse.down();
    await page.mouse.move(tx, ty, { steps: 6 });
    expect(await rects(page, '.area-preview.ok')).toHaveLength(1);
    await page.mouse.up();
    expect(await lastAreas(page)).toBe('"a a a"\n". . ."\n". . b"');

    // Move a down one row by its name chip.
    await page.waitForTimeout(200);
    const saves = await page.evaluate(() => window.__saves.length);
    const [cx, cy] = await centre(page, '#ao-a .area-name');
    const [mx, my] = await centre(page, '#ct-1-1');
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(mx, my, { steps: 6 });
    await page.mouse.up();
    expect(await lastAreas(page)).toBe('". . ."\n"a a a"\n". . b"');
    expect(await page.evaluate(() => window.__saves.length)).toBe(saves + 1);

    // Moving onto b is shown as blocked and saves nothing.
    await page.waitForTimeout(200);
    const [bx, by] = await centre(page, '#ao-b');
    const [c2x, c2y] = await centre(page, '#ao-a .area-name');
    await page.mouse.move(c2x, c2y);
    await page.mouse.down();
    await page.mouse.move(bx, by, { steps: 6 });
    expect(await rects(page, '.area-preview.blocked')).toHaveLength(1);
    await page.mouse.up();
    expect(await page.evaluate(() => window.__saves.length)).toBe(saves + 1);
});

test('dock: a track opens in the dock, the grid narrows instead of being covered', async ({ page }) => {
    await mountView(page);
    const gridWidth = () => page.evaluate(() => window.__view.shadowRoot.querySelector('#grid-root').getBoundingClientRect().width);
    const before = await gridWidth();
    await page.mouse.click(...(await centre(page, '#ch-1')));
    await page.waitForTimeout(300);
    const [dock] = await rects(page, '#dock');
    expect(dock.width).toBeGreaterThan(300);
    expect(await page.evaluate(() => window.__view.hasAttribute('dock-open'))).toBe(true);
    expect(before - await gridWidth()).toBeGreaterThan(300);
    // No area reaches under the dock.
    for (const a of await rects(page, '.area-overlay')) expect(a.right).toBeLessThanOrEqual(dock.left + 1);
    // The dock follows the selection: area settings replace the track.
    await page.evaluate(() => window.__view.shadowRoot.querySelector('lcards-grid-edit-overlay')._openAreaSettings('temp'));
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => window.__view.shadowRoot.querySelector('lcards-grid-edit-overlay').shadowRoot.querySelector('#dock .edit-panel-title').textContent)).toBe('Area: temp');
    // Escape closes it and the grid gets its width back.
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    expect(await rects(page, '#dock')).toHaveLength(0);
    expect(Math.abs(before - await gridWidth())).toBeLessThan(2);
});

test('area tint: defaults to 60% and sticks across Layout / Cards switches and reloads', async ({ page }) => {
    const tint = () => page.evaluate(() => window.__view.shadowRoot.querySelector('lcards-grid-edit-overlay')
        .shadowRoot.querySelector('.t-tint input').value);
    await mountView(page);
    await page.evaluate(() => localStorage.removeItem('lcards-layout-area-tint'));
    await page.reload();
    await mountView(page);
    expect(await tint()).toBe('60');
    await page.evaluate(() => {
        const input = window.__view.shadowRoot.querySelector('lcards-grid-edit-overlay').shadowRoot.querySelector('.t-tint input');
        input.value = '25';
        input.dispatchEvent(new Event('input'));
    });
    // Cards mode removes the overlay; back in Layout mode a new one is created.
    await page.evaluate(async () => {
        const v = window.__view;
        v._editSubMode = 'cards'; await v.updateComplete;
        v._editSubMode = 'grid'; await v.updateComplete;
    });
    await page.waitForTimeout(300);
    expect(await tint()).toBe('25');
    await page.reload();
    await mountView(page);
    expect(await tint()).toBe('25');
});

// The layout studio's dialog scales while it opens; the overlay used to measure
// mid-scale and keep areas ~85% of their cards' size (2026-10-17).
test('grid mode: chrome lines up with the cards inside a scaled container', async ({ page }) => {
    await mountView(page);
    const sizes = await page.evaluate(async () => {
        const v = window.__view;
        const box = document.createElement('div');
        box.style.cssText = 'position:absolute;left:0;top:0;width:1100px;transform:scale(0.8);transform-origin:0 0;';
        v.parentNode.insertBefore(box, v);
        box.appendChild(v);
        await new Promise(r => setTimeout(r, 400));
        const ov = v.shadowRoot.querySelector('lcards-grid-edit-overlay');
        ov.refresh();
        await new Promise(r => setTimeout(r, 100));
        const area = ov.shadowRoot.querySelector('#ao-temp');
        const card = [...v.shadowRoot.querySelectorAll('#grid-root > *')].find(c => c.config?.view_layout?.['grid-area'] === 'temp');
        // Both in layout (untransformed) px.
        return {
            area: [area.offsetLeft, area.offsetTop, area.offsetWidth, area.offsetHeight],
            card: [card.offsetLeft, card.offsetTop, card.offsetWidth, card.offsetHeight],
        };
    });
    for (let i = 0; i < 4; i++) expect(Math.abs(sizes.area[i] - sizes.card[i])).toBeLessThan(2);
});

