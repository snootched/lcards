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

test('a configured width still wins', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await mountCase(page, 'button-lozenge');
    await mountOverlay(page, { width: '300px' });
    await raiseAlert(page);
    await expect.poll(() => contentBox(page), { timeout: 10_000 }).not.toBeNull();
    await expect.poll(async () => (await contentBox(page)).width).toBe(300);
    expect((await contentBox(page)).height).toBeGreaterThan(0);
    await expectNoErrors(page);
});
