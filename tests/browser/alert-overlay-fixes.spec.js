/**
 * Alert overlay fixes from the D2 docs audit (2026-11-07), each reproduced here
 * against the built bundle first: `layers: null` turns the effects off, a
 * per-condition legacy `backdrop` applies, an alert raised on this device only
 * (a targeted lcards.* action, or no helper) shows the overlay, and `band.phase`
 * with nothing to lock to stops retrying instead of piling up timers.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const OPTIONS = ['green_alert', 'red_alert', 'yellow_alert', 'blue_alert', 'black_alert', 'gray_alert'];

/** Mount an alert overlay with this config next to the harness card. */
const mountOverlay = (page, config) => page.evaluate(async (cfg) => {
    await customElements.whenDefined('lcards-alert-overlay');
    const el = document.createElement('lcards-alert-overlay');
    el.setConfig({ type: 'custom:lcards-alert-overlay', ...cfg });
    el.hass = window.__hass;
    document.body.appendChild(el);
    window.__overlay = el;
    // Count content mounts (a double-fired alert mounts twice).
    window.__mounts = 0;
    const mount = el._mountContentCard.bind(el);
    el._mountContentCard = (c) => { window.__mounts++; return mount(c); };
    await new Promise((r) => setTimeout(r, 50));
}, config);

const setHelper = (page, state) => page.evaluate(([s, options]) => {
    window.__setState('input_select.lcards_alert_mode', { state: s, attributes: { options } });
    window.__overlay.hass = window.__hass;
}, [state, OPTIONS]);

/** The portal slot: what the overlay shows, or null. */
const shown = (page) => page.evaluate(() => {
    const slot = window.lcards.core.portalOverlayManager._slots.get('alert-overlay');
    const el = slot?.contentElement;
    if (!el?.isConnected) return null;
    return { tag: el.localName, layers: slot.options?.layers ?? null };
});

test('layers: null shows the alert with no screen effects (not the default blur)', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await mountOverlay(page, { layers: null });
    await setHelper(page, 'red_alert');
    await expect.poll(() => shown(page), { timeout: 10_000 }).not.toBeNull();
    expect((await shown(page)).layers).toEqual({ backdrop: null, color: null, canvas: null });
    await expectNoErrors(page);
});

test('a per-condition legacy backdrop applies to that condition', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await mountOverlay(page, { conditions: { red_alert: { backdrop: { blur: '20px' } } } });
    await setHelper(page, 'red_alert');
    await expect.poll(() => shown(page), { timeout: 10_000 }).not.toBeNull();
    expect((await shown(page)).layers.backdrop).toEqual({ preset: 'blur', amount: '20px' });
    await expectNoErrors(page);
});

test('a targeted alert (helper unchanged) shows and clears the overlay on this device', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await mountOverlay(page, {});
    await setHelper(page, 'green_alert');
    const targeted = (mode) => page.evaluate((m) => window.lcards.core.integrationService._handleLcardsEvent({
        action: 'set_alert_mode', mode: m, target_user_ids: [window.__hass.user.id],
    }), mode);
    await targeted('red_alert');
    await expect.poll(() => shown(page), { timeout: 10_000 }).not.toBeNull();
    // The helper was not written: the alert stays on this device.
    expect(await page.evaluate(() => window.__hass.states['input_select.lcards_alert_mode'].state)).toBe('green_alert');
    await targeted('green_alert');
    await expect.poll(() => shown(page), { timeout: 10_000 }).toBeNull();
    await expectNoErrors(page);
});

test('with no alert helper, window.lcards.setAlertMode shows the overlay', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await mountOverlay(page, {});
    expect(await page.evaluate(() => window.__hass.states['input_select.lcards_alert_mode'])).toBeUndefined();
    await page.evaluate(() => window.lcards.setAlertMode('red_alert'));
    await expect.poll(() => shown(page), { timeout: 10_000 }).not.toBeNull();
    await expectNoErrors(page);
});

test('an alert through the helper mounts the content once (no double fire)', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await mountOverlay(page, {});
    await setHelper(page, 'green_alert');
    // In Home Assistant the helper is in core's first hass; here it was added later,
    // and core only takes a new hass when a card's own entities change.
    await page.evaluate(() => { window.lcards.core.ingestHass(window.__hass); });
    await page.waitForTimeout(50);
    // Broadcast: setAlertMode writes the helper (the fake hass records the call), and
    // the helper's state change, as Home Assistant would send it, raises the overlay.
    await page.evaluate(() => window.lcards.setAlertMode('red_alert'));
    await setHelper(page, 'red_alert');
    await expect.poll(() => shown(page), { timeout: 10_000 }).not.toBeNull();
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => window.__mounts)).toBe(1);
    await expectNoErrors(page);
});

// ── band.phase with nothing to lock to ────────────────────────────────────────
// Before, each _syncPhase without a symbol bar animation scheduled a 250 ms retry
// forever, and the 3 s interval and every update started another chain.

/** Count the band's _syncPhase calls from now on. */
const countSync = (page) => page.evaluate(() => {
    const band = window.lcards.core.portalOverlayManager._slots.get('alert-overlay')?.contentElement;
    window.__band = band;
    window.__syncs = 0;
    const sync = band._syncPhase.bind(band);
    band._syncPhase = () => { window.__syncs++; return sync(); };
});
const syncsDuring = async (page, ms) => {
    await page.evaluate(() => { window.__syncs = 0; });
    await page.waitForTimeout(ms);
    return page.evaluate(() => window.__syncs);
};

for (const [name, config] of [
    ['emblem: false', { display: 'band', band: { phase: 180, emblem: false } }],
    ['a custom content card', { display: 'band', band: { phase: 180 }, conditions: { red_alert: { content: { type: 'custom:lcards-button', preset: 'lozenge', text: { name: { content: 'RED', show: true } } } } } }],
]) {
    test(`band.phase with ${name}: the retries stop instead of piling up`, async ({ page }) => {
        await mountCase(page, 'button-lozenge');
        await mountOverlay(page, config);
        await setHelper(page, 'red_alert');
        await expect.poll(async () => (await shown(page))?.tag, { timeout: 10_000 }).toBe('lcards-alert-band');
        await countSync(page);
        await page.waitForTimeout(6500);
        expect(await syncsDuring(page, 1000)).toBeLessThanOrEqual(1);
        // Gone with the band: nothing left running.
        await setHelper(page, 'green_alert');
        await expect.poll(() => shown(page)).toBeNull();
        expect(await syncsDuring(page, 1000)).toBe(0);
        await expectNoErrors(page);
    });
}
