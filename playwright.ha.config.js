import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

/**
 * Layer C: real-HA smoke tests against the dev HA (local only, never CI).
 * Needs a long-lived token in $HA_TOKEN or .ha-token (gitignored); skips without one.
 * Run `npm run build` first: the bind-mounted custom_components/lcards/ is what HA serves.
 *
 *   npm run test:ha
 */
export default defineConfig({
    testDir: 'tests/ha',
    testMatch: /\.spec\.js$/,
    timeout: 60_000,
    workers: 1,            // tests change shared HA state
    fullyParallel: false,
    reporter: 'list',
    use: {
        baseURL: process.env.HA_URL ?? 'http://localhost:8123',
        viewport: { width: 1400, height: 900 },
        // HA's frontend reloads the page when its service worker takes control, which
        // a fresh browser profile does a few seconds into every test: block it.
        serviceWorkers: 'block',
        // System Chromium locally (no download); CI installs Playwright's own build.
        launchOptions: { executablePath: process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined) },
    },
});
