import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

/**
 * Docs-site tests: live card demos and playgrounds.
 *   built - the built site (vitepress preview), every docs-site spec
 *   dev   - the dev server (vitepress dev) that `npm run docs:serve` runs, a smoke spec
 *           (it loads public/ files differently, which once broke the demos there)
 * Run `npm run docs:build` first (it also publishes the LCARdS bundle at /lcards/).
 *
 *   npm run test:docs
 */
const BUILT = Number(process.env.LCARDS_DOCS_PORT ?? 4871);
const DEV = BUILT + 1;
// The docs channel's base (DOCS_BASE, e.g. /dev/): both servers serve the site under it,
// and tests/docs-site/support.js puts every spec path under it.
const BASE = process.env.DOCS_BASE ?? '/';
const GPU_ARGS = ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan'];
const chromium = process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

export default defineConfig({
    testDir: 'tests/docs-site',
    timeout: 60_000,
    fullyParallel: true,
    // Each demo page loads the full card bundle; a few at a time keeps runs fast and stable.
    // CI runners have 4 cores and no GPU: 2 workers there.
    workers: process.env.CI ? 2 : 4,
    // A test that fails once on a slow CI runner and then passes is reported as flaky.
    retries: process.env.CI ? 2 : 0,
    reporter: process.env.CI ? 'line' : 'list',
    // CI skips the pages of many WebGL cards (support.js gpuTag): no GPU there. All run locally.
    grepInvert: process.env.CI ? /@gpu/ : undefined,
    use: {
        viewport: { width: 1300, height: 900 },
        // vitepress preview brotli-compresses every response at the highest quality, uncached:
        // 4 s for the 2.2 MB LCARdS main chunk and 2 s for the theme chunk, on every page of
        // every test (most of the 12 minutes CI took). Uncompressed is instant on localhost.
        extraHTTPHeaders: { 'Accept-Encoding': 'identity' },
        // System Chromium locally (no download); CI installs Playwright's own build.
        // Locally WebGL runs on the real GPU (Vulkan through ANGLE): without these flags
        // headless Chromium draws with SwiftShader on the CPU, and the WebGL demos crawl.
        // CI has no GPU and keeps the default.
        launchOptions: { executablePath: chromium, args: process.env.CI ? [] : GPU_ARGS },
    },
    webServer: [
        {
            command: `npx vitepress preview doc --host 127.0.0.1 --port ${BUILT}`,
            url: `http://127.0.0.1:${BUILT}${BASE}`,
            reuseExistingServer: !process.env.CI,
        },
        {
            command: `node scripts/copy-docs-bundle.js && npx vitepress dev doc --host 127.0.0.1 --port ${DEV} --strictPort`,
            url: `http://127.0.0.1:${DEV}${BASE}`,
            reuseExistingServer: !process.env.CI,
            timeout: 120_000,
        },
    ],
    projects: [
        { name: 'built', testIgnore: /dev-server\.spec\.js/, use: { baseURL: `http://127.0.0.1:${BUILT}` } },
        { name: 'dev', testMatch: /dev-server\.spec\.js/, use: { baseURL: `http://127.0.0.1:${DEV}` } },
    ],
});
