/**
 * Live card examples (```yaml live) on the card reference pages render the real
 * card from the published /lcards/ bundle, with no errors.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test, expect, watchErrors, waitForDemos, demoState, DOCS_BASE, gpuTag } from './support.js';

// Card types rendered by CardDemo (chart and data grid have their own demos; an alert
// overlay shows on the Alert Studio's mock screen, lcards-alert-preview).
const CARD_DEMO_TYPES = new Set(['lcards-button', 'lcards-elbow', 'lcards-slider', 'lcards-select-menu', 'lcards-msd-card', 'lcards-layout-card', 'lcards-astrometrics-card', 'lcards-alert-overlay', 'lcards-layout-view']);

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

/** The markdown source of a docs page path ('/cards/slider-card/' or '/core/colours'). */
const mdSource = (url) => readFileSync(join('doc', url.endsWith('/') ? `${url}index.md` : `${url}.md`), 'utf8');

test('the live-page scan finds the card pages', () => {
    const urls = PAGES.map(([u]) => u);
    for (const u of ['/cards/button/', '/cards/elbow/', '/cards/slider-card/', '/cards/select-menu/', '/cards/astrometrics/start', '/core/colours', '/cards/alert-overlay/band']) expect(urls).toContain(u);
});

test('an alert overlay example shows on a mock screen, and the condition buttons switch it', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/cards/alert-overlay/band');
    await waitForDemos(page, 5);
    const demo = page.locator('.card-demo').nth(3);
    const preview = demo.locator('lcards-alert-preview');
    await expect(preview).toHaveCount(1);
    // the band example keeps red alert as an overlay: the demo opens on yellow, shown as a band
    await expect.poll(() => preview.evaluate(el => el.condition)).toBe('yellow_alert');
    await expect(preview.locator('lcards-alert-band')).toHaveCount(1);
    // red alert: the symbol over the screen, no band
    await demo.getByRole('button', { name: 'red', exact: true }).click();
    await expect(demo.getByRole('button', { name: 'red', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => preview.evaluate(el => el.condition)).toBe('red_alert');
    await expect(preview.locator('lcards-alert-band')).toHaveCount(0);
    await expect(preview.locator('.content lcards-button')).toHaveCount(1);
    // the mock screen fills the panel's 16:9 box, never the real screen
    const box = await preview.boundingBox();
    expect(Math.round((box?.width ?? 0) / (box?.height ?? 1) * 9)).toBe(16);
    expect(await page.evaluate(() => window.lcards?.core?.portalOverlayManager?.has('alert-overlay') ?? false)).toBe(false);
    expect(errors).toEqual([]);
});

for (const [url, tags] of PAGES) {
    test(`${url}: every live example renders its card`, gpuTag(url), async ({ page }) => {
        const expected = tags.length;
        // a page of many WebGL cards (the astrometrics starters) needs longer than the default
        test.setTimeout(Math.max(60_000, expected * 3_000));
        const errors = watchErrors(page);
        await page.goto(url);
        await waitForDemos(page, expected);
        const demos = await demoState(page);
        expect(demos).toHaveLength(expected);
        for (const [i, d] of demos.entries()) {
            expect(d.fatal, `demo ${i + 1}`).toBeNull();
            // an alert overlay example mounts the Alert Studio's mock screen, a layout view the Layout Card
            expect(d.card, `demo ${i + 1}`).toBe({ 'lcards-alert-overlay': 'lcards-alert-preview', 'lcards-layout-view': 'lcards-layout-card' }[tags[i]] ?? tags[i]);
            // Docs examples are schema-clean: no warnings under the card.
            expect(d.messages, `demo ${i + 1}`).toEqual([]);
        }
        // Cards that need a definite height collapse to a sliver without one.
        const heights = await page.locator('.card-demo-mount > *').evaluateAll(els => els.map(el => Math.round(el.getBoundingClientRect().height)));
        for (const [i, h] of heights.entries()) expect(h, `demo ${i + 1} height`).toBeGreaterThan(30);
        // MSD shows "Initializing MSD..." until its pipeline renders (it hung without base_svg).
        await expect.poll(() => page.locator('.card-demo-mount').evaluateAll(els =>
            els.some(el => /Initializing MSD/.test(el.firstElementChild?.shadowRoot?.textContent ?? ''))), { timeout: 15_000 }).toBe(false);
        // Every colour variable an example's YAML names (without a fallback) exists here, so
        // it renders as written (Home Assistant-only variables such as --success-color render grey).
        const named = [...new Set([...mdSource(url).matchAll(/^```ya?ml[^\n]*\blive\b[^\n]*\n([\s\S]*?)^```/gm)]
            .flatMap(m => [...m[1].matchAll(/var\((--[a-z0-9-]+)\s*\)/g)].map(v => v[1])))];
        const missing = await page.locator('.card-demo-mount > *').first().evaluate((el, names) =>
            names.filter(n => !getComputedStyle(el).getPropertyValue(n).trim()), named);
        expect(missing, 'colour variables the docs site does not define').toEqual([]);
        // No text is drawn outside its card (a caption above a one-row card is clipped).
        // Astrometrics labels follow the camera and may leave the view by design.
        const clipped = await page.locator('.card-demo-mount > *').evaluateAll(els => els.flatMap((el, i) => {
            if (el.localName === 'lcards-astrometrics-card') return [];
            const box = el.getBoundingClientRect();
            const texts = [];
            const walk = (root) => root.querySelectorAll('*').forEach(n => {
                if (n.shadowRoot) walk(n.shadowRoot);
                if (n.localName === 'text' && n.textContent.trim()) texts.push(n);
            });
            if (el.shadowRoot) walk(el.shadowRoot);
            return texts.flatMap(t => {
                const r = t.getBoundingClientRect();
                if (!r.width || !r.height) return [];
                // A text box includes the font's full ascent and descent, so a large label
                // overshoots its card a little while looking fine: flag text mostly outside.
                const w = Math.max(0, Math.min(r.right, box.right) - Math.max(r.left, box.left));
                const h = Math.max(0, Math.min(r.bottom, box.bottom) - Math.max(r.top, box.top));
                const inside = (w * h) / (r.width * r.height);
                return inside < 0.6 ? [`demo ${i + 1} (${el.localName}): "${t.textContent.trim().slice(0, 30)}" ${Math.round(inside * 100)}% inside`] : [];
            });
        }));
        expect(clipped, 'text drawn outside its card').toEqual([]);
        expect(errors).toEqual([]);
    });
}

test('a slider drag badge stays inside the demo panel while dragging', async ({ page }) => {
    const pages = PAGES.filter(([u]) => mdSource(u).includes('drag_badge'));
    expect(pages.length).toBeGreaterThan(0);
    for (const [url, tags] of pages) {
        await page.goto(url);
        await waitForDemos(page, tags.length);
        const sliders = page.locator('.card-demo').filter({ has: page.locator('lcards-slider') });
        for (let i = 0; i < await sliders.count(); i++) {
            const demo = sliders.nth(i);
            const slider = demo.locator('lcards-slider');
            if (!(await slider.evaluate(el => el.config?.drag_badge?.enabled === true))) continue;
            const input = slider.locator('input[type="range"]');
            await input.scrollIntoViewIfNeeded();
            const box = await input.boundingBox();
            if (!box) continue;
            const vertical = box.height > box.width;
            const y = box.y + box.height / 2, x = box.x + box.width / 2;
            await page.mouse.move(x, y);
            await page.mouse.down();
            await page.mouse.move(vertical ? x : box.x + box.width * 0.6, vertical ? box.y + box.height * 0.4 : y, { steps: 5 });
            const [badge, panel] = await Promise.all([
                slider.evaluate(el => { const r = el.shadowRoot.querySelector('.drag-badge')?.getBoundingClientRect(); return r && r.width ? { top: r.top, bottom: r.bottom, left: r.left, right: r.right } : null; }),
                demo.locator('.card-demo-panel').boundingBox(),
            ]);
            await page.mouse.up();
            expect(badge, `${url} slider ${i + 1}: badge shows while dragging`).not.toBeNull();
            const inside = badge.top >= panel.y && badge.bottom <= panel.y + panel.height && badge.left >= panel.x && badge.right <= panel.x + panel.width;
            expect(inside, `${url} slider ${i + 1}: badge ${JSON.stringify(badge)} inside panel ${JSON.stringify(panel)}`).toBe(true);
        }
    }
});

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

    // Drag from the current value down to about 25% of the track (scrolled into view:
    // the overview's page map sits above the quick start).
    await input.scrollIntoViewIfNeeded();
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
    // Two of the heaviest demo pages: each is loaded once (it used to be twice, which
    // ran past the default 60 s on CI runners).
    test.setTimeout(120_000);
    const drawnHeights = (tag, component) => page.locator(`.card-demo-mount > ${tag}`).evaluateAll((els, component) => els
        .filter(el => el.config?.component === component)
        .map(el => Math.max(0, ...[...el.shadowRoot.querySelectorAll('svg')].map(s => s.getBoundingClientRect().height))), component);
    for (const [url, tag, checks] of [
        ['/cards/button/components', 'lcards-button', [['dpad', 250], ['alert', 180]]],
        // the flat shaped example is one row (56 px); a collapsed card is a few px
        ['/cards/slider-card/components', 'lcards-slider', [['shaped', 50], ['picard', 350]]],
    ]) {
        await page.goto(url);
        await waitForDemos(page, PAGES.find(([u]) => u === url)[1].length);
        await page.waitForTimeout(500);
        for (const [component, min] of checks) {
            const heights = await drawnHeights(tag, component);
            expect(heights.length, `${component} demos on ${url}`).toBeGreaterThan(0);
            for (const h of heights) expect(h, `${component} drawn height`).toBeGreaterThanOrEqual(min);
        }
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
