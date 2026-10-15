/**
 * Live card examples (```yaml live) on the card reference pages render the real
 * card from the published /lcards/ bundle, with no errors.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test, expect, watchErrors, waitForDemos, demoState, DOCS_BASE } from './support.js';

// Card types rendered by CardDemo (chart and data grid have their own demos).
const CARD_DEMO_TYPES = new Set(['lcards-button', 'lcards-elbow', 'lcards-slider', 'lcards-select-menu', 'lcards-msd-card']);

/** Every docs page with ```yaml live blocks of CardDemo types, with the card tag of each block. */
function livePages() {
    const pages = [];
    (function walk(dir) {
        for (const name of readdirSync(dir)) {
            const p = join(dir, name);
            if (statSync(p).isDirectory()) { if (!['.vitepress', 'public'].includes(name)) walk(p); continue; }
            if (!name.endsWith('.md')) continue;
            const tags = [...readFileSync(p, 'utf8').matchAll(/^```ya?ml[^\n]*\blive\b[^\n]*\n([\s\S]*?)^```/gm)]
                .map(m => /^type:\s*["']?custom:([\w-]+)/m.exec(m[1])?.[1])
                .filter(tag => CARD_DEMO_TYPES.has(tag));
            if (!tags.length) continue;
            const rel = relative('doc', p).replace(/\\/g, '/').replace(/\.md$/, '');
            pages.push([`/${rel.replace(/(^|\/)index$/, '$1')}`, tags]);
        }
    })('doc');
    return pages;
}

const PAGES = livePages();

test('the live-page scan finds the card pages', () => {
    const urls = PAGES.map(([u]) => u);
    for (const u of ['/cards/button/', '/cards/elbow/', '/cards/slider-card/', '/cards/select-menu/', '/core/colours']) expect(urls).toContain(u);
});

for (const [url, tags] of PAGES) {
    test(`${url}: every live example renders its card`, async ({ page }) => {
        const errors = watchErrors(page);
        const expected = tags.length;
        await page.goto(url);
        await waitForDemos(page, expected);
        const demos = await demoState(page);
        expect(demos).toHaveLength(expected);
        for (const [i, d] of demos.entries()) {
            expect(d.fatal, `demo ${i + 1}`).toBeNull();
            expect(d.card, `demo ${i + 1}`).toBe(tags[i]);
            // Docs examples are schema-clean: no warnings under the card.
            expect(d.messages, `demo ${i + 1}`).toEqual([]);
        }
        // Cards that need a definite height collapse to a sliver without one.
        const heights = await page.locator('.card-demo-mount > *').evaluateAll(els => els.map(el => Math.round(el.getBoundingClientRect().height)));
        for (const [i, h] of heights.entries()) expect(h, `demo ${i + 1} height`).toBeGreaterThan(30);
        // MSD shows "Initializing MSD..." until its pipeline renders (it hung without base_svg).
        await expect.poll(() => page.locator('.card-demo-mount').evaluateAll(els =>
            els.some(el => /Initializing MSD/.test(el.firstElementChild?.shadowRoot?.textContent ?? ''))), { timeout: 15_000 }).toBe(false);
        expect(errors).toEqual([]);
    });
}

test('a toggle tap switches the sample entity and the card follows', async ({ page }) => {
    await page.goto('/cards/button/');
    await waitForDemos(page, PAGES.find(([u]) => u === '/cards/button/')[1].length);
    const first = page.locator('.card-demo').first();
    const bg = first.locator('lcards-button path.button-bg');
    const fill = () => bg.evaluate(el => getComputedStyle(el).fill);
    const before = await fill();
    await bg.click();
    await expect.poll(fill).not.toBe(before);
    await bg.click();
    await expect.poll(fill).toBe(before);
});

test('live cards load the bundle from this docs channel (its own base), not the site root', async ({ page }) => {
    const bundle = [];
    page.on('request', r => { if (/\/lcards\/lcards\.js/.test(r.url())) bundle.push(new URL(r.url()).pathname); });
    await page.goto('/cards/button/');
    await waitForDemos(page, PAGES.find(([u]) => u === '/cards/button/')[1].length);
    expect(bundle.length).toBeGreaterThan(0);
    for (const path of bundle) expect(path).toBe(`${DOCS_BASE}lcards/lcards.js`);
});

test('pages without live cards do not load the LCARdS bundle', async ({ page }) => {
    const bundle = [];
    page.on('request', r => { if (r.url().includes('/lcards/lcards.js')) bundle.push(r.url()); });
    await page.goto('/core/datasources/processor-reference');
    await page.waitForLoadState('load');
    await page.waitForTimeout(2000);
    expect(bundle).toEqual([]);
});

test('a slider drag sets the sample light and the slider keeps the new value', async ({ page }) => {
    await page.goto('/cards/slider-card/');
    await waitForDemos(page, PAGES.find(([u]) => u === '/cards/slider-card/')[1].length);
    const slider = page.locator('.card-demo').first().locator('lcards-slider');
    const input = slider.locator('input[type="range"]');
    const value = () => input.inputValue();
    const brightness = () => page.evaluate(async () => (await globalThis.__lcardsDocsEnv).hass.states['light.bedroom'].attributes.brightness);
    const before = Number(await value());

    expect(before).toBeGreaterThan(60); // the sample light starts at ~78%

    // Drag from the current value down to about 25% of the track.
    const box = await input.boundingBox();
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * before / 100, y);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.25, y, { steps: 8 });
    await page.mouse.up();

    await expect.poll(brightness).toBeLessThan(100);
    const after = Number(await value());
    expect(after).toBeLessThan(40);
    // It stays there once the state round trip and any re-render have settled.
    await page.waitForTimeout(1500);
    expect(Number(await value())).toBeCloseTo(after, 0);
});

// Cards drawn to their cell height (D-pad, alert, shaped, Picard) collapsed to a
// thin strip or a tiny icon when the demo gave them only the 1 row they report.
test('cards drawn to their cell height render at a usable size', async ({ page }) => {
    const drawnHeights = (tag, component) => page.locator(`.card-demo-mount > ${tag}`).evaluateAll((els, component) => els
        .filter(el => el.config?.component === component)
        .map(el => Math.max(0, ...[...el.shadowRoot.querySelectorAll('svg')].map(s => s.getBoundingClientRect().height))), component);
    for (const [url, tag, component, min] of [
        ['/cards/button/', 'lcards-button', 'dpad', 250],
        ['/cards/button/', 'lcards-button', 'alert', 180],
        ['/cards/slider-card/', 'lcards-slider', 'shaped', 150],
        ['/cards/slider-card/', 'lcards-slider', 'picard', 350],
    ]) {
        await page.goto(url);
        await waitForDemos(page, PAGES.find(([u]) => u === url)[1].length);
        await page.waitForTimeout(500);
        const heights = await drawnHeights(tag, component);
        expect(heights.length, `${component} demos on ${url}`).toBeGreaterThan(0);
        for (const h of heights) expect(h, `${component} drawn height`).toBeGreaterThanOrEqual(min);
    }
});

test('a read-only sensor slider says so instead of offering toggles', async ({ page }) => {
    await page.goto('/cards/slider-card/');
    await waitForDemos(page, PAGES.find(([u]) => u === '/cards/slider-card/')[1].length);
    const captions = await page.locator('.card-demo').evaluateAll(demos => demos.map(d => ({
        entity: d.querySelector('.card-demo-mount > *')?.config?.entity ?? '',
        caption: d.querySelector('.card-demo-caption')?.textContent ?? '',
    })));
    const sensors = captions.filter(c => c.entity.startsWith('sensor.'));
    expect(sensors.length).toBeGreaterThan(0);
    for (const c of sensors) {
        expect(c.caption).toContain('Read-only');
        expect(c.caption).not.toContain('toggle');
    }
});
