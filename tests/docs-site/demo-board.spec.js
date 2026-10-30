/**
 * The live demo page (getting-started/live-demo.md, <DemoBoard />): this release's
 * public demo views (demo/order.yaml) are listed, an astrometrics view and a WebGL
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

const VIEWS = boardReleases(loadDemo(), { board: 'public', release: docsRelease() }).flatMap(r => r.views);
const URL_PATH = '/getting-started/live-demo';

/** Wait until the board has mounted every card of the view. */
async function viewMounted(page, path) {
    await page.waitForFunction((p) => document.querySelector('.demo-board-stage')?.dataset.ready === p, path, { timeout: 45_000 });
}

/**
 * Open the page and pick a view. Waits for the first view first: until the page is
 * hydrated a click on the picker does nothing.
 */
async function openView(page, view) {
    await page.goto(URL_PATH);
    await viewMounted(page, VIEWS[0].path);
    if (view.path !== VIEWS[0].path) {
        await page.locator('.demo-board-picker button', { hasText: new RegExp(`^${view.title}$`) }).click();
    }
    await viewMounted(page, view.path);
}

test('the page lists this release\'s public views', async ({ page }) => {
    await page.goto(URL_PATH);
    expect(VIEWS.length).toBeGreaterThan(5);
    await expect(page.locator('.demo-board-picker button')).toHaveText(VIEWS.map(v => v.title));
    await expect(page.locator('.demo-board-error')).toHaveCount(0);
});

// One astrometrics scene and one WebGL background view: the two heavy kinds of card.
const SAMPLES = [
    VIEWS.find(v => v.text.includes('custom:lcards-astrometrics-card')),
    VIEWS.find(v => v.text.includes('background_animation') && !v.text.includes('custom:lcards-astrometrics-card')),
];
for (const view of SAMPLES) {
    test(`${view?.path}: every card mounts, no errors`, async ({ page }) => {
        expect(view).toBeTruthy();
        const errors = watchErrors(page);
        await openView(page, view);
        const cards = await page.locator('.demo-board-cell > *').evaluateAll(els => els.map(e => ({
            tag: e.localName, height: Math.round(e.getBoundingClientRect().height),
        })));
        // the generated header (one layout card, the description), then the view's cards in
        // their LCARS frames (one cell each; an overlay card stays outside them)
        const own = (view.config.sections ?? []).reduce((n, sec) => {
            const cards = sec.cards ?? [];
            const overlays = cards.filter(c => c.type === 'custom:lcards-alert-overlay').length;
            return n + overlays + frameGroups(cards.filter(c => c.type !== 'custom:lcards-alert-overlay')).length;
        }, 0);
        // a layout view (the showcase) mounts its own cards, its header already in its head area
        if (view.config.type === 'custom:lcards-layout-view') expect(cards.length).toBe(view.config.cards.length);
        else expect(cards.length).toBe(own + (view.description ? 2 : 1));
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
    const [, second] = VIEWS;
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
