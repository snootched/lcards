/**
 * Card galleries (<CardGallery set="..." />) render a real card in every tile,
 * with a usable height and no errors.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test, expect, watchErrors } from './support.js';

/** Every docs page using CardGallery, with the gallery set names in page order. */
function galleryPages() {
    const pages = [];
    (function walk(dir) {
        for (const name of readdirSync(dir)) {
            const p = join(dir, name);
            if (statSync(p).isDirectory()) { if (!['.vitepress', 'public'].includes(name)) walk(p); continue; }
            if (!name.endsWith('.md')) continue;
            const sets = [...readFileSync(p, 'utf8').matchAll(/<CardGallery set="([\w-]+)"/g)].map(m => m[1]);
            if (!sets.length) continue;
            const rel = relative('doc', p).replace(/\\/g, '/').replace(/\.md$/, '');
            pages.push([`/${rel.replace(/(^|\/)index$/, '$1')}`, sets]);
        }
    })('doc');
    return pages;
}

const PAGES = galleryPages();

test('the gallery scan finds the gallery pages', () => {
    const urls = PAGES.map(([u]) => u);
    for (const u of ['/cards/button/', '/cards/elbow/', '/cards/slider-card/', '/cards/select-menu/', '/core/presets']) expect(urls).toContain(u);
});

for (const [url, sets] of PAGES) {
    test(`${url}: every gallery tile renders its card`, async ({ page }) => {
        const errors = watchErrors(page);
        await page.goto(url);
        const galleries = page.locator('.card-gallery');
        await expect(galleries).toHaveCount(sets.length);
        await expect(page.locator('.card-gallery-error')).toHaveCount(0);

        // Every tile has its card mounted.
        await page.waitForFunction(() => [...document.querySelectorAll('.card-gallery-mount')].every(m => m.firstElementChild), null, { timeout: 30_000 });
        const tiles = await page.locator('.card-gallery-tile').evaluateAll(figs => figs.map(f => ({
            label: f.querySelector('figcaption code')?.textContent,
            card: f.querySelector('.card-gallery-mount > *')?.localName ?? null,
            height: Math.round(f.querySelector('.card-gallery-mount > *')?.getBoundingClientRect().height ?? 0),
        })));
        expect(tiles.length).toBeGreaterThan(sets.length);
        for (const t of tiles) {
            expect(t.card, t.label).toMatch(/^lcards-/);
            expect(t.height, `${t.label} height`).toBeGreaterThan(20);
        }
        expect(errors).toEqual([]);
    });
}

test('elbow demos get at least three grid rows of height', async ({ page }) => {
    await page.goto('/cards/elbow/');
    await page.waitForFunction(() => [...document.querySelectorAll('.card-gallery-mount')].every(m => m.firstElementChild), null, { timeout: 30_000 });
    const heights = await page.locator('.card-gallery-mount').evaluateAll(els => els.map(el => el.getBoundingClientRect().height));
    // 3 rows of HA's sections grid: 3 * 56 + 2 * 8.
    for (const h of heights) expect(h).toBeGreaterThanOrEqual(184);
});
