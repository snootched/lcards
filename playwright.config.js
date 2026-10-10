import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

/**
 * Browser tests (Layers A and B) against the built bundle in custom_components/lcards/.
 * Run `npm run build` first. Uses the system Chromium; no browser download.
 *
 *   npm run test:browser   component tests (tests/browser/*.spec.js except visual)
 *   npm run test:visual    screenshot baselines (local only; --update-snapshots to refresh)
 */
const PORT = Number(process.env.LCARDS_TEST_PORT ?? 4870);

export default defineConfig({
    testDir: 'tests/browser',
    timeout: 30_000,
    fullyParallel: true,
    reporter: process.env.CI ? 'line' : 'list',
    use: {
        baseURL: `http://127.0.0.1:${PORT}`,
        viewport: { width: 800, height: 600 },
        // System Chromium locally (no download); CI installs Playwright's own build.
        launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined) },
    },
    webServer: {
        command: `node tests/browser/serve.mjs ${PORT}`,
        url: `http://127.0.0.1:${PORT}/harness.html`,
        reuseExistingServer: !process.env.CI,
    },
    projects: [
        { name: 'component', testIgnore: /visual\.spec\.js/ },
        {
            name: 'visual',
            testMatch: /visual\.spec\.js/,
            // An absolute pixel budget: a ratio (e.g. 1%) let a whole missing label (~0.7% of a
            // button) pass. threshold is the per-pixel colour tolerance (anti-aliasing).
            expect: { toHaveScreenshot: { maxDiffPixels: 40, threshold: 0.2, animations: 'disabled' } },
        },
    ],
});
