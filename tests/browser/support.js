/**
 * Shared helpers for the Playwright specs.
 */
import { expect } from '@playwright/test';

/** Errors that come from the harness environment, not from LCARdS. */
const IGNORED_ERRORS = [
    /favicon/i,
];

/**
 * Open the harness on a fixture and wait until the card has rendered.
 * @param {import('@playwright/test').Page} page
 * @param {string} name - fixture name (tests/browser/fixtures/<name>.yaml)
 * @param {Record<string,string>} [params] - extra query params (freeze, width)
 */
export async function mountCase(page, name, params = {}) {
    const query = new URLSearchParams({ case: name, ...params });
    await page.goto(`/harness.html?${query}`);
    await page.waitForFunction(() => window.__ready !== false, null, { timeout: 20_000 });
    const ready = await page.evaluate(() => window.__ready);
    if (ready === 'error') {
        throw new Error(`harness failed: ${(await page.evaluate(() => window.__errors)).join('\n')}`);
    }
    return page.locator('#mount > *').first();
}

/** lcards console errors seen so far (environment noise filtered out). */
export async function cardErrors(page) {
    const errors = await page.evaluate(() => window.__errors);
    return errors.filter(e => !IGNORED_ERRORS.some(re => re.test(e)));
}

export async function expectNoErrors(page) {
    expect(await cardErrors(page)).toEqual([]);
}
