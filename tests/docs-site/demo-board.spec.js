/**
 * The live demo page (getting-started/live-demo.md, <DemoBoard />): every release's
 * public demo views (demo/order.yaml) are listed in the topic tree's order in the side
 * menu, topics open and close, a heavy view waits for its Load button, the New in filter
 * keeps this release's (when there are older views), the page is wide, an astrometrics view and a WebGL
 * background view mount their real cards with no errors, switching views replaces
 * the cards, the alert buttons change the page's alert mode, and the charts
 * follow their sliders.
 *
 * A smoke test of the page, not of every view: tests/docs/demo-dashboard.test.js
 * checks every view's config, and `npm run demo:push -- --check` shows each one in
 * Home Assistant.
 */
import { loadDemo, boardReleases, frameGroups } from '../../scripts/lib/demo-dashboard.js';
import { docsRelease } from '../../doc/.vitepress/theme/demo.data.js';
import { test, expect, watchErrors } from './support.js';

const DEMO = loadDemo();
const RELEASE = docsRelease();
const VIEWS = boardReleases(DEMO, { board: 'public' })
    .flatMap(r => r.views.map(v => ({ ...v, release: r.version })))
    .sort((a, b) => a.rank - b.rank);
/** The menu's topics in order: those with public views. */
const TOPICS = DEMO.topics.filter(t => VIEWS.some(v => v.topic === t.id));
const URL_PATH = '/getting-started/live-demo';

/** Wait until the board has mounted every card of the view. */
async function viewMounted(page, path) {
    await page.waitForFunction((p) => document.querySelector('.demo-board-stage')?.dataset.ready === p, path, { timeout: 45_000 });
}

/** Open a view's topic in the menu (if closed) and pick the view; load it if it is heavy. */
async function pickView(page, view) {
    const topic = page.locator(`.demo-board-topic[data-topic="${view.topic}"]`);
    if (await topic.getAttribute('aria-expanded') !== 'true') await topic.click();
    await page.locator(`.demo-board-topic-views button[data-view="${view.path}"]`).click();
    if (view.heavy) await page.locator('.demo-board-load').click();
}

/**
 * Open the page and pick a view. Waits for the menu first: until the page is
 * hydrated a click on it does nothing.
 */
async function openView(page, view) {
    await page.goto(URL_PATH);
    await expect(page.locator('.demo-board-topic').first()).toHaveAttribute('aria-expanded', 'true');
    await page.waitForFunction(() => document.querySelector('.demo-board-poster, .demo-board-stage[data-ready]'));
    await pickView(page, view);
    await viewMounted(page, view.path);
}

test('the menu lists every release\'s public views in the topic tree\'s order, by group', async ({ page }) => {
    await page.goto(URL_PATH);
    expect(VIEWS.length).toBeGreaterThan(5);
    const topics = page.locator('.demo-board-topic');
    await expect(topics).toHaveCount(TOPICS.length);
    expect(await topics.evaluateAll(els => els.map(e => e.dataset.topic))).toEqual(TOPICS.map(t => t.id));
    // the first topic starts open, the rest closed
    expect(await topics.evaluateAll(els => els.map(e => e.getAttribute('aria-expanded')))).toEqual(TOPICS.map((_, i) => String(i === 0)));
    for (const t of TOPICS.slice(1)) await page.locator(`.demo-board-topic[data-topic="${t.id}"]`).click();
    const listed = await page.locator('.demo-board-topic-views button').evaluateAll(els => els.map(e => e.dataset.view));
    expect(listed).toEqual(VIEWS.map(v => v.path));
    // group headings in the tree's order (named groups with public views)
    const groups = TOPICS.flatMap(t => t.groups.filter(g => g.title && g.views.some(f => VIEWS.some(v => v.file === f))).map(g => g.title));
    await expect(page.locator('.demo-board-group')).toHaveText(groups, { ignoreCase: true });
    await expect(page.locator('.demo-board-error')).toHaveCount(0);
});

test('a topic closes and opens again on a click', async ({ page }) => {
    await page.goto(URL_PATH);
    const first = page.locator(`.demo-board-topic[data-topic="${TOPICS[0].id}"]`);
    await expect(first).toHaveAttribute('aria-expanded', 'true');
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('.demo-board-topic-views')).toHaveCount(0);
    await first.click();
    await expect(first).toHaveAttribute('aria-expanded', 'true');
});

test('the page opens on the first view; a heavy view mounts nothing until Load', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(URL_PATH);
    const first = VIEWS[0];
    await expect(page.locator('.demo-board-title')).toHaveText(first.title);
    expect(first.heavy, 'the first view (the showcase) is heavy').toBe(true);
    await expect(page.locator('.demo-board-poster')).toBeVisible();
    await page.waitForTimeout(1000);
    await expect(page.locator('.demo-board-cell')).toHaveCount(0);
    await page.locator('.demo-board-load').click();
    await expect(page.locator('.demo-board-poster')).toHaveCount(0);
    await viewMounted(page, first.path);
    expect(errors).toEqual([]);
});

test('the demo helpers start as a fresh Home Assistant install has them (the showcase at its first stop, warp off, the mixed look)', async ({ page }) => {
    const light = VIEWS.find(v => !v.heavy);
    await openView(page, light);
    const states = await page.evaluate(() => {
        const s = document.querySelector('.demo-board-cell > *')?.hass?.states ?? {};
        return Object.fromEntries(['input_number.lcards_test_stage', 'input_boolean.lcards_test_warp', 'input_select.lcards_test_look'].map(id => [id, s[id]?.state]));
    });
    expect(states).toEqual({ 'input_number.lcards_test_stage': '0', 'input_boolean.lcards_test_warp': 'off', 'input_select.lcards_test_look': 'MIXED' });
});

test('the showcase\'s controls work without Home Assistant: NEXT and PREV step the stop, PLAY TOUR runs the tour script', async ({ page }) => {
    const showcase = VIEWS.find(v => v.path === 'astro-showcase');
    await openView(page, showcase);
    const state = (id) => page.evaluate(async (x) => (await globalThis.__lcardsDocsEnv).hass.states[x]?.state, id);
    const stage = 'input_number.lcards_test_stage';
    // a button by the name in its config (its label is drawn in SVG)
    const button = (name) => page.evaluateHandle((n) => {
        // into the layout cards' shadow roots
        const all = (root) => [...root.querySelectorAll('*')].flatMap(el => [el, ...(el.shadowRoot ? all(el.shadowRoot) : [])]);
        return all(document.querySelector('.demo-board-stage')).find(el => el.localName === 'lcards-button'
            && String(/** @type {any} */ (el).config?.text?.name?.content ?? '').includes(n));
    }, name);
    const tap = async (name) => (await button(name)).asElement().click();
    await tap('NEXT');
    await expect.poll(() => state(stage)).toBe('1');
    await tap('PREV');
    await expect.poll(() => state(stage)).toBe('0');
    await tap('PLAY TOUR');
    await expect.poll(() => state('script.lcards_test_tour')).toBe('on');
    await tap('PLAY TOUR');
    await expect.poll(() => state('script.lcards_test_tour')).toBe('off');
});

test('data grid: the cells draw at once, the Jinja2 note renders, and tapping an entity cell toggles it every time', async ({ page }) => {
    const grid = VIEWS.find(v => v.path === 'datagrid-data');
    await page.goto(URL_PATH);
    await expect(page.locator('.demo-board-topic').first()).toHaveAttribute('aria-expanded', 'true');
    await pickView(page, grid);
    // the view's data grid (the first data grid is the header's description)
    const card = page.locator('.demo-board-stage lcards-data-grid').nth(1);
    // well before the Jinja2 cell's render times out (no Home Assistant here): the entity cells are there
    await expect(card.getByText('64 %')).toBeVisible({ timeout: 3000 });
    // the Jinja2 note renders here too (tests/helpers/ha-jinja.js): shields at 64 are holding
    await expect(card.getByText('Holding', { exact: true })).toBeVisible();
    const state = () => page.evaluate(async () => (await globalThis.__lcardsDocsEnv).hass.states['input_boolean.lcards_test_lights']?.state);
    const before = await state();
    const after = before === 'on' ? 'off' : 'on';
    await card.getByText(before, { exact: true }).first().click();
    await expect.poll(state).toBe(after);
    // again from the same cell (its handler is set up once: it must act on the state now)
    await card.getByText(after, { exact: true }).first().click();
    await expect.poll(state).toBe(before);
    await card.getByText(before, { exact: true }).first().click();
    await expect.poll(state).toBe(after);
});

test('the New in filter: shown only when there are older views; then it keeps this release\'s', async ({ page }) => {
    await page.goto(URL_PATH);
    await expect(page.locator('.demo-board-topic').first()).toBeVisible();
    const fresh = VIEWS.filter(v => v.release === RELEASE);
    if (fresh.length === VIEWS.length || !fresh.length) {
        await expect(page.locator('.demo-board-filter')).toHaveCount(0);
        return;
    }
    await page.locator('.demo-board-filter button', { hasText: `New in ${RELEASE}` }).click();
    const counts = await page.locator('.demo-board-topic').evaluateAll(els => els.map(e => [e.dataset.topic, Number(e.querySelector('.count')?.textContent)]));
    expect(counts).toEqual(TOPICS.map(t => [t.id, fresh.filter(v => v.topic === t.id).length]).filter(([, n]) => n));
});

test('the page is wide on a desktop and stacks the menu on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(URL_PATH);
    expect(await page.locator('.vp-doc').evaluate(el => el.getBoundingClientRect().width)).toBeGreaterThan(1200);
    await page.setViewportSize({ width: 390, height: 900 });
    const menu = await page.locator('.demo-board-menu').boundingBox();
    const main = await page.locator('.demo-board-main').boundingBox();
    expect(menu.y + menu.height).toBeLessThanOrEqual(main.y);
    expect(menu.width).toBeGreaterThan(300);
});

// One astrometrics scene and one WebGL background view: the two heavy kinds of card.
const SAMPLES = [
    VIEWS.find(v => v.text.includes('custom:lcards-astrometrics-card')),
    VIEWS.find(v => v.text.includes('background_animation') && !v.text.includes('custom:lcards-astrometrics-card')),
];
for (const view of SAMPLES) {
    // the astrometrics view runs locally only (support.js gpuTag): CI draws WebGL on the CPU
    test(`${view?.path}: every card mounts, no errors`, view?.text.includes('custom:lcards-astrometrics-card') ? { tag: '@gpu' } : {}, async ({ page }) => {
        expect(view).toBeTruthy();
        const errors = watchErrors(page);
        await openView(page, view);
        const cards = await page.locator('.demo-board-cell > *').evaluateAll(els => els.map(e => ({
            tag: e.localName, height: Math.round(e.getBoundingClientRect().height),
        })));
        // the generated header (one layout card framing the description), then the view's cards in
        // their LCARS frames (one cell each; an overlay card stays outside them)
        const own = (view.config.sections ?? []).reduce((n, sec) => {
            const cards = sec.cards ?? [];
            const overlays = cards.filter(c => c.type === 'custom:lcards-alert-overlay').length;
            return n + overlays + frameGroups(cards.filter(c => c.type !== 'custom:lcards-alert-overlay')).length;
        }, 0);
        // a layout view (the showcase) mounts its own cards, its header already in its head area
        if (view.config.type === 'custom:lcards-layout-view') expect(cards.length).toBe(view.config.cards.length);
        // plus the header: one frame (the header bar round the description)
        else expect(cards.length).toBe(own + 1);
        for (const c of cards) {
            expect(c.tag).toMatch(/^lcards-/);
            // the alert overlay has no size until an alert mode is on
            if (c.tag !== 'lcards-alert-overlay') expect(c.height, c.tag).toBeGreaterThan(10);
        }
        await expect(page.locator('.demo-board-error')).toHaveCount(0);
        expect(errors).toEqual([]);
    });
}

test('switching views replaces the cards', async ({ page }) => {
    const second = VIEWS.filter(v => !v.heavy)[1];
    await openView(page, second);
    // the generated header section plus the view's own sections, nothing left of the first view
    await expect(page.locator('.demo-board-section')).toHaveCount((second.config.sections?.length ?? 0) + 1);
});

test('the alert buttons switch the alert mode', async ({ page }) => {
    const withAlerts = VIEWS.find(v => v.text.includes('perform_action: lcards.red_alert'));
    expect(withAlerts, 'a view with alert buttons').toBeTruthy();
    await openView(page, withAlerts);
    // the alert buttons are the first cards after the generated header, in its frame's content grid
    const alerts = page.locator('.demo-board-section').nth(1).locator('lcards-layout-card lcards-layout-card lcards-button');
    await alerts.first().click();
    await expect.poll(() => page.evaluate(() => window.lcards.getAlertMode())).toBe('red_alert');
    await alerts.nth(1).click(); // CLEAR (red, clear: the views keep only what their cards follow)
    await expect.poll(() => page.evaluate(() => window.lcards.getAlertMode())).toBe('green_alert');
});

test('the charts follow their sliders on the sample entities (a live history stream)', async ({ page }) => {
    const charts = VIEWS.find(v => v.path === 'chart-sources');
    expect(charts, 'the chart sources view').toBeTruthy();
    await openView(page, charts);
    const chart = page.locator('.demo-board-stage lcards-chart').first();
    const last = () => chart.evaluate(el => /** @type {any} */ (el)._seriesPoints?.[0]?.at(-1)?.v);
    await expect.poll(last, { timeout: 15_000 }).not.toBeUndefined();
    const before = await last();
    // drag the POWER slider down to near its left end
    const slider = page.locator('.demo-board-stage lcards-slider').first();
    await slider.scrollIntoViewIfNeeded();
    const box = await slider.boundingBox();
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.6, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.35, y, { steps: 8 });
    await page.mouse.up();
    await expect.poll(last, { timeout: 5_000 }).not.toBe(before);
    expect(await last()).toBeLessThan(before);
});
