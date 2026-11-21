/**
 * Built-in asset URLs resolve against the folder the bundle was loaded from
 * (src/utils/bundle-url.js). The versioned docs site serves the bundle from
 * /dev/lcards/ or /v/<version>/lcards/, and a root-absolute /lcards/... URL
 * fetched the latest channel's copy instead (404 for a model it predates).
 * serve.mjs mounts the same bundle at /base-test/lcards/; the harness loads it
 * from there with ?base=. Every bundle request must stay under that folder.
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

const BASE = '/base-test/lcards/';

/**
 * Record every request path the page makes for bundle files.
 * @param {import('@playwright/test').Page} page
 */
function watch(page) {
    /** @type {{ under: string[], root: string[], failed: string[] }} */
    const seen = { under: [], root: [], failed: [] };
    page.on('request', (r) => {
        const path = new URL(r.url()).pathname;
        if (path.startsWith(BASE)) seen.under.push(path);
        else if (path.startsWith('/lcards/')) seen.root.push(path);
    });
    page.on('response', (r) => { if (r.status() >= 400) seen.failed.push(r.url()); });
    return seen;
}

const model = (page) => page.evaluate(() => {
    const s = /** @type {any} */ (document.querySelector('#mount > *'))?._scene?.debug();
    return s?.world?.objects.get('ship')?.loadState() ?? null;
});

test('astrometrics: a built-in model and picture load from the bundle folder, not /lcards/', async ({ page }) => {
    const seen = watch(page);
    await mountCase(page, 'bundle-base-astro', { width: '800', base: BASE });
    expect(await page.evaluate(() => window.__LCARDS_BOOT__?.base)).toBe(BASE);
    await expect.poll(() => model(page), { timeout: 15_000 }).toBe('ready');
    await expect.poll(() => seen.under.some((p) => p.endsWith('/images/usgs-viking-mars-2048.webp')), { timeout: 10_000 }).toBe(true);
    // A built-in font: its stylesheet comes from the bundle folder, and the
    // stylesheet's relative url() pulls the font file from there too
    await page.evaluate(async () => {
        await window.lcards.core.assetManager.loadFont('lcards_microgramma');
        const link = /** @type {HTMLLinkElement | null} */ (document.getElementById('lcards-font-lcards_microgramma'));
        if (link && !link.sheet) await new Promise((done) => link.addEventListener('load', done, { once: true }));
        await document.fonts.load("16px 'lcards_microgramma'");
    });
    await expect.poll(() => seen.under.some((p) => p.startsWith(`${BASE}fonts/`) && /\.(woff2?|otf|ttf)$/.test(p)), { timeout: 10_000 }).toBe(true);

    expect(seen.under).toContain(`${BASE}models/galaxy-class.glb`);
    expect(seen.under.some((p) => p.startsWith(`${BASE}chunks/`))).toBe(true);
    // the font stylesheets' relative url()s follow them
    expect(seen.under.some((p) => p.startsWith(`${BASE}fonts/`) && p.endsWith('.css'))).toBe(true);
    expect(seen.root).toEqual([]);
    expect(seen.failed.filter((u) => !/favicon/.test(u))).toEqual([]);
    expect(await cardErrors(page)).toEqual([]);
});

test('MSD: a /lcards/... base_svg path written in the config resolves against the bundle folder', async ({ page }) => {
    const seen = watch(page);
    await mountCase(page, 'msd-auto-side', { width: '800', base: BASE });
    await expect.poll(() => seen.under.includes(`${BASE}msd/ncc-1701-a-blue.svg`), { timeout: 10_000 }).toBe(true);
    await expect.poll(() => page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        return !!card?.renderRoot?.querySelector('svg');
    }), { timeout: 10_000 }).toBe(true);
    expect(seen.root).toEqual([]);
    expect(seen.failed.filter((u) => !/favicon/.test(u))).toEqual([]);
    expect(await cardErrors(page)).toEqual([]);
});
