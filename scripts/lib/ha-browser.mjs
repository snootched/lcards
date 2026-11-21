/**
 * Headless Chromium logged in to the dev Home Assistant with a long-lived token
 * (sidebar hidden, service workers blocked). Shared by dashboard-shots.mjs and
 * demo-push.mjs.
 */
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { HA_URL } from '../../tests/ha/ha-client.mjs';

/** System Chromium when there is one (CHROMIUM_PATH overrides). */
export function launchChromium({ headless = true } = {}) {
    return chromium.launch({
        headless,
        // The real GPU for WebGL (else SwiftShader on the CPU, and real-time videos stutter).
        args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=vulkan', '--enable-features=Vulkan'],
        executablePath: process.env.CHROMIUM_PATH ?? (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined),
    });
}

/** A browser context logged in with the token. */
export async function newHAContext(browser, token, { width = 1600, height = 1000, scale = 1 } = {}) {
    const context = await browser.newContext({ baseURL: HA_URL, viewport: { width, height }, deviceScaleFactor: scale, serviceWorkers: 'block' });
    await context.addInitScript(({ token, hassUrl }) => {
        localStorage.setItem('hassTokens', JSON.stringify({
            access_token: token, token_type: 'Bearer', expires_in: 1e9, hassUrl,
            clientId: `${hassUrl}/`, expires: Date.now() + 1e12, refresh_token: '',
        }));
        localStorage.setItem('dockedSidebar', JSON.stringify('always_hidden'));
    }, { token, hassUrl: HA_URL });
    return context;
}

/** Open /<dashboard>/<view> and wait for LCARdS to load and the cards to settle. */
export async function openDashboardView(page, dashboard, viewPath, settle = 3000) {
    await page.goto(`/${dashboard}/${viewPath}`);
    await page.waitForFunction(() => !!window.lcards?.core?.themeManager, null, { timeout: 30_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(settle);
    // A fixed wait is not always enough: an MSD can still show "Initializing" and
    // Jinja templates (a round trip to Home Assistant) their raw text. Wait (bounded)
    // until every MSD has drawn and no LCARdS text still holds {{ }} or {% %}.
    await page.waitForFunction(() => {
        let ready = true;
        const walk = (/** @type {Document|ShadowRoot} */ root) => {
            for (const el of root.querySelectorAll('*')) {
                if (!ready) return;
                const any = /** @type {any} */ (el);
                if (el.tagName === 'LCARDS-MSD-CARD' && any._msdRevealed !== true) ready = false;
                if (el.tagName.startsWith('LCARDS-') && el.shadowRoot
                    && [...el.shadowRoot.querySelectorAll('text, tspan')].some(t => /\{\{|\{%/.test(t.textContent ?? ''))) ready = false;
                if (el.shadowRoot) walk(el.shadowRoot);
            }
        };
        walk(document);
        return ready;
    }, null, { timeout: 20_000, polling: 500 }).catch(() => {});
}

/** Collect LCARdS page errors (message plus the top stack frames). HA's own frontend throws one on load with service workers blocked. */
export function collectLcardsErrors(page) {
    const errors = [];
    page.on('pageerror', e => {
        if (!/lcards/i.test(`${e.message}\n${e.stack ?? ''}`)) return;
        errors.push([e.message, ...(e.stack ?? '').split('\n').slice(1, 4).map(l => l.trim())].join(' | '));
    });
    page.on('console', m => { if (m.type() === 'error' && /lcards/i.test(m.text())) errors.push(m.text().slice(0, 200)); });
    return errors;
}
