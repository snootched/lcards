/**
 * Alert overlay content size (Layer A, built bundle). Regression: with no width or
 * height in the config, the content container was `width: auto` and the alert
 * symbol inside it `width: 100%`, so it collapsed to 0 px and only the blur showed.
 * The defaults are now a share of the screen (overlayContentSize).
 *
 * The overlay is a zero-size sentinel (no fixture: the fixture loop expects a
 * visible card), so it is mounted beside a button and driven through the
 * input_select.lcards_alert_mode helper, as in HA.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Mount an alert overlay with this config next to the harness card. */
const mountOverlay = (page, config) => page.evaluate(async (cfg) => {
    await customElements.whenDefined('lcards-alert-overlay');
    const el = document.createElement('lcards-alert-overlay');
    el.setConfig({ type: 'custom:lcards-alert-overlay', ...cfg });
    el.hass = window.__hass;
    document.body.appendChild(el);
    window.__overlay = el;
}, config);

const raiseAlert = (page) => page.evaluate(() => {
    window.__setState('input_select.lcards_alert_mode', {
        state: 'red_alert',
        attributes: { options: ['green_alert', 'red_alert', 'yellow_alert', 'blue_alert', 'black_alert', 'gray_alert'] },
    });
    window.__overlay.hass = window.__hass;
});

/** The mounted content card's box, once the portal has one. */
const contentBox = (page) => page.evaluate(() => {
    const el = window.lcards.core.portalOverlayManager._slots.get('alert-overlay')?.contentElement;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { width: Math.round(r.width), height: Math.round(r.height) };
});

test('no size set: the alert symbol gets a share of the screen, not 0 px', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mountCase(page, 'button-lozenge');
    await mountOverlay(page, {});
    await raiseAlert(page);
    await expect.poll(() => contentBox(page), { timeout: 10_000 }).not.toBeNull();
    // 60% of the width, 50% of the height.
    await expect.poll(async () => (await contentBox(page)).width).toBe(720);
    expect((await contentBox(page)).height).toBe(400);
    await expectNoErrors(page);
});

test('a configured width still wins, and the symbol keeps its aspect ratio', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mountCase(page, 'button-lozenge');
    await mountOverlay(page, { width: '300px' });
    await raiseAlert(page);
    await expect.poll(() => contentBox(page), { timeout: 10_000 }).not.toBeNull();
    await expect.poll(async () => (await contentBox(page)).width).toBe(300);
    // the height follows the alert symbol's aspect ratio (it was the button's 40 px minimum)
    await expect.poll(async () => (await contentBox(page)).height).toBeGreaterThan(200);
    await expectNoErrors(page);
});

// ── Ownership and edit mode (backlog clean-up (2), 2026-11-05) ───────────────
// One overlay owns the shared portal slot; the orders below each failed before.

const setupOwnership = (page) => page.evaluate(async () => {
    await customElements.whenDefined('lcards-alert-overlay');
    window.__mkOverlay = (cfg = {}) => {
        const el = document.createElement('lcards-alert-overlay');
        el.setConfig({ type: 'custom:lcards-alert-overlay', ...cfg });
        el.hass = window.__hass;
        return el;
    };
    window.__alertShown = () => !!window.lcards.core.portalOverlayManager._slots.get('alert-overlay')?.contentElement?.isConnected;
});
const settle = (page) => page.evaluate(() => new Promise((r) => setTimeout(r, 100)));

test('an overlay that connects and leaves before its claim does not hide the live alert', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await setupOwnership(page);
    await mountOverlay(page, {});
    await raiseAlert(page);
    await expect.poll(() => page.evaluate(() => window.__alertShown()), { timeout: 10_000 }).toBe(true);
    await page.evaluate(() => { const el = window.__mkOverlay(); document.body.appendChild(el); el.remove(); });
    await settle(page);
    expect(await page.evaluate(() => window.__alertShown())).toBe(true);
    await expectNoErrors(page);
});

test('a detached overlay never takes ownership; the next real one owns it', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await setupOwnership(page);
    await page.evaluate(() => { const el = window.__mkOverlay(); document.body.appendChild(el); el.remove(); window.__ghost = el; });
    await settle(page);
    await page.evaluate(() => { window.__overlay = window.__mkOverlay({ width: '300px' }); document.body.appendChild(window.__overlay); });
    await settle(page);
    expect(await page.evaluate(() => ({ ghost: !!window.__ghost._alertUnsubscribe, suppressed: window.__overlay._isSuppressed })))
        .toEqual({ ghost: false, suppressed: false });
    await raiseAlert(page);
    // the live card's config is the one shown
    await expect.poll(async () => (await contentBox(page))?.width, { timeout: 10_000 }).toBe(300);
});

test('an alert raised in edit mode shows when edit mode ends', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await setupOwnership(page);
    await mountOverlay(page, {});
    await page.evaluate(() => { window.__overlay.preview = true; });
    await settle(page);
    await raiseAlert(page);
    await settle(page);
    expect(await page.evaluate(() => window.__alertShown())).toBe(false);
    expect(await page.evaluate(() => window.__overlay.shadowRoot.textContent)).toContain('Alert overlay');
    await page.evaluate(() => { window.__overlay.preview = false; });
    await expect.poll(() => page.evaluate(() => window.__alertShown()), { timeout: 10_000 }).toBe(true);
});

test('the card editor preview neither owns the overlay nor says duplicate', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await setupOwnership(page);
    await mountOverlay(page, {});
    await settle(page);
    const preview = await page.evaluate(async () => {
        const dialog = document.createElement('hui-dialog-edit-card');
        document.body.appendChild(dialog);
        const root = dialog.attachShadow({ mode: 'open' });
        const el = window.__mkOverlay();
        el.preview = true;
        root.appendChild(el);
        await new Promise((r) => setTimeout(r, 100));
        return { suppressed: el._isSuppressed, text: el.shadowRoot.textContent };
    });
    expect(preview.suppressed).toBe(false);
    expect(preview.text).toContain('Alert overlay');
    expect(preview.text).not.toMatch(/duplicate/i);
    expect(await page.evaluate(() => window.__overlay._isSuppressed)).toBe(false);
});

test('a second dashboard overlay is the duplicate; it takes over when the first leaves', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await setupOwnership(page);
    await mountOverlay(page, {});
    await settle(page);
    await page.evaluate(() => { window.__second = window.__mkOverlay(); document.body.appendChild(window.__second); });
    await settle(page);
    expect(await page.evaluate(() => window.__second._isSuppressed)).toBe(true);
    await page.evaluate(() => window.__overlay.remove());
    await settle(page);
    expect(await page.evaluate(() => window.__second._isSuppressed)).toBe(false);
    await page.evaluate(() => { window.__overlay = window.__second; });
    await raiseAlert(page);
    await expect.poll(() => page.evaluate(() => window.__alertShown()), { timeout: 10_000 }).toBe(true);
});

test('dismiss_mode reset sets the alert mode back to green through the helper', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await setupOwnership(page);
    await mountOverlay(page, { dismiss_mode: 'reset' });
    await raiseAlert(page);
    await expect.poll(() => page.evaluate(() => window.__alertShown()), { timeout: 10_000 }).toBe(true);
    await page.evaluate(() => { window.__hass.serviceCalls.length = 0; window.__overlay._handleDismiss(); });
    await expect.poll(() => page.evaluate(() => window.__hass.serviceCalls.map((c) => [c.domain, c.service, c.data?.option ?? c.serviceData?.option])))
        .toEqual([['input_select', 'select_option', 'green_alert']]);
});
