/**
 * Issue #424: the connection overlay plays with Home Assistant unreachable.
 *
 * The overlay shows when the browser has lost Home Assistant, which also serves
 * LCARdS, so whatever it fetches on demand then fails. Its warm-up loads that
 * while the server is reachable. Each test warms up (or not), then blocks
 * /lcards/ (Playwright turns the HTTP cache off while a route is set, so only
 * what is held in memory counts) and runs the disconnect.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/**
 * Set the overlay config on the live service (no tolerance, so it shows at once).
 * @param {import('@playwright/test').Page} page
 * @param {Record<string, any>} partial
 */
async function configure(page, partial) {
    await page.evaluate((p) => {
        const svc = window.lcards.core.connectionOverlayService;
        svc._applyPartialConfig({ enabled: true, disconnect_delay_ms: 0, ...p });
        svc._configLoaded = true;
        svc._isConnected = true; // the fake hass carries no `connected` flag
    }, partial);
}

/**
 * Whether a face of this family has downloaded (document.fonts.check() is true
 * for a family with no faces at all, so it can't tell).
 * @param {import('@playwright/test').Page} page
 * @param {string} family
 */
async function faceLoaded(page, family) {
    return page.evaluate((f) => [...document.fonts].some((face) => face.family.replace(/["']/g, '') === f && face.status === 'loaded'), family);
}

/** @param {import('@playwright/test').Page} page */
async function warmUp(page) {
    return page.evaluate(() => window.lcards.core.connectionOverlayService.warmUp());
}

/**
 * Take the server away and run the service's real disconnect path.
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>} the /lcards/ requests that failed from here on
 */
async function disconnect(page) {
    /** @type {string[]} */
    const blocked = [];
    await page.route('**/lcards/**', (route) => {
        blocked.push(new URL(route.request().url()).pathname);
        return route.abort('internetdisconnected');
    });
    await page.evaluate(() => {
        const svc = window.lcards.core.connectionOverlayService;
        svc._isConnected = false;
        svc._onDisconnected();
    });
    return blocked;
}

const BORG = { message: { mode: 'borg' } };

test('Borg mode: without the warm-up the intro and font cannot load (the #424 failure)', async ({ page }) => {
    await mountCase(page, 'button-on-show');
    await configure(page, BORG);
    const blocked = await disconnect(page);
    await page.waitForTimeout(1500);
    await expect(page.locator('canvas[data-lcards-renderer]')).toHaveCount(0);
    expect(await faceLoaded(page, 'lcards_borg')).toBe(false);
    expect(blocked.some((p) => p.includes('borg-worker-sources'))).toBe(true);
});

test('Borg mode: after the warm-up the intro plays and the Borg font shows offline', async ({ page }) => {
    await mountCase(page, 'button-on-show');
    await configure(page, BORG);
    const { loaded, failed } = await warmUp(page);
    expect(failed).toEqual([]);
    expect(loaded).toEqual(expect.arrayContaining(['preset:borg-assimilation', 'font:lcards_borg']));

    const blocked = await disconnect(page);
    const canvas = page.locator('canvas[data-lcards-renderer]');
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toHaveAttribute('data-lcards-ready', 'true');
    expect(await faceLoaded(page, 'lcards_borg')).toBe(true);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--lcars-font'))).toContain('lcards_borg');
    expect(blocked).toEqual([]);
    await expectNoErrors(page);
});

test('text mode: the message font is downloaded ahead', async ({ page }) => {
    await mountCase(page, 'button-on-show');
    await configure(page, { message: { mode: 'text', text: 'Connection Lost', font: 'lcards_jeffries' } });
    expect(await faceLoaded(page, 'lcards_jeffries')).toBe(false);
    const { failed } = await warmUp(page);
    expect(failed).toEqual([]);
    expect(await faceLoaded(page, 'lcards_jeffries')).toBe(true);

    const blocked = await disconnect(page);
    await expect(page.getByText('Connection Lost')).toBeVisible();
    expect(blocked).toEqual([]);
    await expectNoErrors(page);
});

test('card mode: a card with lazy code (a chart) renders offline', async ({ page }) => {
    await mountCase(page, 'button-on-show');
    await configure(page, {
        width: '600px',
        height: '300px',
        message: { mode: 'card' },
        content: { type: 'custom:lcards-chart', sources: [{ entity: 'sensor.demo_temperature' }] },
    });
    const { failed, loaded } = await warmUp(page);
    expect(failed).toEqual([]);
    expect(loaded).toContain('card:custom:lcards-chart');
    // The warm-up card is gone again.
    await expect(page.locator('[data-lcards-overlay-warmup]')).toHaveCount(0);

    const blocked = await disconnect(page);
    await expect(page.locator('[data-lcards-pom-content-connection-overlay] .apexcharts-canvas')).toHaveCount(1);
    expect(blocked).toEqual([]);
    await expectNoErrors(page);
});

test('card mode: without the warm-up the chart cannot load its code offline', async ({ page }) => {
    await mountCase(page, 'button-on-show');
    await configure(page, {
        width: '600px',
        height: '300px',
        message: { mode: 'card' },
        content: { type: 'custom:lcards-chart', sources: [{ entity: 'sensor.demo_temperature' }] },
    });
    const blocked = await disconnect(page);
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-lcards-pom-content-connection-overlay] .apexcharts-canvas')).toHaveCount(0);
    expect(blocked.some((p) => p.includes('apexcharts'))).toBe(true);
});
