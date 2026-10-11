/**
 * Helpers for the docs-site specs (built site served by vitepress preview).
 */

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
