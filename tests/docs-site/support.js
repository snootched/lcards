/**
 * Helpers for the docs-site specs (built site served by vitepress preview).
 */
import { test as base, expect } from '@playwright/test';

/**
 * The docs channel's base (DOCS_BASE: /, /dev/ or /v/<version>/; see
 * doc/.vitepress/config.mts). Specs use root-relative paths ('/cards/button/');
 * these fixtures put them under the base, so the same specs test every channel.
 */
export const DOCS_BASE = process.env.DOCS_BASE ?? '/';
export const underBase = (url) => (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? DOCS_BASE + url.slice(1) : url);

export const test = base.extend({
    page: async ({ page }, use) => {
        // The card bundle loads MSD SVGs, sounds, fonts and images from the root
        // /lcards/ path (where HA serves them). On the live site the root keeps every
        // channel's assets (scripts/docs-deploy.mjs); a /dev/ or /v/ build tested on
        // its own has only its own copy, so send those requests there.
        if (DOCS_BASE !== '/') {
            await page.route(/^https?:\/\/[^/]+\/lcards\//, (route) => {
                const url = new URL(route.request().url());
                url.pathname = DOCS_BASE + url.pathname.slice(1);
                return route.continue({ url: url.toString() });
            });
        }
        const goto = page.goto.bind(page);
        page.goto = (url, options) => goto(underBase(url), options);
        await use(page);
    },
    request: async ({ request }, use) => {
        const get = request.get.bind(request);
        request.get = (url, options) => get(underBase(url), options);
        await use(request);
    },
});
export { expect };

/** Collect page errors and LCARdS console errors for a page. */
export function watchErrors(page) {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
    page.on('console', (m) => {
        if (m.type() === 'error' && /lcards/i.test(`${m.text()} ${m.location()?.url ?? ''}`)) errors.push(m.text().slice(0, 300));
    });
    return errors;
}

/** Wait until every card demo on the page has mounted its card (or failed). */
export async function waitForDemos(page, expected) {
    await page.waitForFunction((n) => {
        const demos = [...document.querySelectorAll('.card-demo')];
        if (demos.length < n) return false;
        return demos.every(d => d.querySelector('.card-demo-mount > *') || d.querySelector('.card-demo-overlay.is-error'));
    }, expected, { timeout: 30_000 });
}

/** Snapshot of every card demo on the page. */
export function demoState(page) {
    return page.evaluate(() => [...document.querySelectorAll('.card-demo')].map(d => ({
        card: d.querySelector('.card-demo-mount > *')?.localName ?? null,
        fatal: d.querySelector('.card-demo-overlay.is-error')?.textContent ?? null,
        messages: [...d.querySelectorAll('.card-demo-messages li')].map(li => li.textContent.trim()),
    })));
}
