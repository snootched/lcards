/**
 * The docs dev server (`npm run docs:serve`) renders live cards and playgrounds too.
 * Regression: CardDemo used import('/lcards/lcards.js'), which Vite's dev server
 * rejects for files in public/ ("can only be referenced via HTML tags").
 */
import { test, expect, watchErrors, waitForDemos, demoState } from './support.js';

test('dev server: live examples and a playground render real cards', async ({ page }) => {
    test.setTimeout(120_000); // the first dev-server page load compiles the theme
    const errors = watchErrors(page);
    const viteErrors = [];
    page.on('console', m => { if (/Failed to load url|public/.test(m.text())) viteErrors.push(m.text()); });

    await page.goto('/cards/button/');
    await waitForDemos(page, 2);
    for (const d of await demoState(page)) {
        expect(d.fatal).toBeNull();
        expect(d.card).toBe('lcards-button');
    }

    await page.goto('/cards/slider-card/playground');
    await waitForDemos(page, 1);
    expect((await demoState(page))[0].card).toBe('lcards-slider');

    expect(viteErrors).toEqual([]);
    expect(errors).toEqual([]);
});

// Regression: after a rebuild under a running dev server, new chunk names got the
// HTML fallback ("Expected a JavaScript module script but the server responded with
// text/html"). The dev server now serves /lcards/ from the build output directly.
test('dev server: a chunk written after startup is served as JavaScript, uncached', async ({ request }) => {
    const { writeFileSync, rmSync } = await import('node:fs');
    const file = 'custom_components/lcards/chunks/zz-dev-server-test.js';
    writeFileSync(file, 'export const ok = 1;\n');
    try {
        const res = await request.get('/lcards/chunks/zz-dev-server-test.js');
        expect(res.status()).toBe(200);
        expect(res.headers()['content-type']).toContain('javascript');
        expect(res.headers()['cache-control']).toBe('no-cache');
        expect(await res.text()).toContain('export const ok');
        // Paths outside the bundle folder are not served from disk.
        expect((await request.get('/lcards/..%2Fmanifest.json')).headers()['content-type'] ?? '').not.toContain('application/json');
    } finally {
        rmSync(file, { force: true });
    }
});

test('dev server: a processor lab runs and charts', async ({ page }) => {
    test.setTimeout(120_000);
    const errors = watchErrors(page);
    await page.goto('/core/datasources/processor-reference');
    const lab = page.locator('.processor-lab').first();
    const chart = lab.locator('.processor-lab-chart .apexcharts-svg');
    // Scroll again until it shows: VitePress scrolls to the top once it has loaded.
    await expect.poll(async () => { await lab.scrollIntoViewIfNeeded(); return chart.isVisible(); },
        { timeout: 60_000, intervals: [500, 1000, 2000] }).toBe(true);
    await expect(lab.locator('.processor-lab-table tbody tr').first()).toBeVisible();
    expect(errors).toEqual([]);
});

// Regression: llms.txt and llms-full.txt are written into the built site only, so the
// dev server answered 404; it now makes them on request.
test('dev server: llms.txt and llms-full.txt are served', async ({ request }) => {
    for (const file of ['llms.txt', 'llms-full.txt']) {
        const res = await request.get(`/${file}`);
        expect(res.status(), file).toBe(200);
        expect(res.headers()['content-type']).toContain('text/plain');
        expect(await res.text()).toMatch(/^# LCARdS/);
    }
});
