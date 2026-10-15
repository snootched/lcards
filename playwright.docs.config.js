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
const chromium = process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

export default defineConfig({
    testDir: 'tests/docs-site',
    timeout: 60_000,
    fullyParallel: true,
    // Each demo page loads the full card bundle; a few at a time keeps runs fast and stable.
    workers: 4,
    reporter: process.env.CI ? 'line' : 'list',
    use: {
        viewport: { width: 1300, height: 900 },
        // System Chromium locally (no download); CI installs Playwright's own build.
        launchOptions: { executablePath: chromium },
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
