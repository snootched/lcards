/**
 * State changes must not pile up event listeners. A component button sets its
 * segments up again on every update, on the same SVG elements when the markup did
 * not change; its cleanup left the three touch listeners, so a dpad gained 3
 * listeners per segment per update (+12 MB every 15 s on the security gallery
 * dashboard, 2026-11-17).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

test.beforeEach(async ({ page }) => {
    // Net listeners per target, counted before any script runs
    await page.addInitScript(() => {
        const add = EventTarget.prototype.addEventListener;
        const remove = EventTarget.prototype.removeEventListener;
        /** @type {Set<string>} */
        const live = new Set();
        const ids = new WeakMap();
        let next = 0;
        const key = (/** @type {any} */ t, /** @type {string} */ type, /** @type {any} */ fn, /** @type {any} */ o) => {
            if (!ids.has(t)) ids.set(t, ++next);
            if (!ids.has(fn)) ids.set(fn, ++next);
            const capture = typeof o === 'boolean' ? o : !!o?.capture;
            return `${ids.get(t)}|${type}|${ids.get(fn)}|${capture}`;
        };
        EventTarget.prototype.addEventListener = function (type, fn, o) {
            if (fn) live.add(key(this, type, fn, o));
            return add.call(this, type, fn, o);
        };
        EventTarget.prototype.removeEventListener = function (type, fn, o) {
            if (fn) live.delete(key(this, type, fn, o));
            return remove.call(this, type, fn, o);
        };
        /** @type {any} */ (window).__liveListeners = () => live.size;
    });
});

test('a dpad does not gain listeners as its entities change', async ({ page }) => {
    await mountCase(page, 'button-dpad-entities');
    const toggle = async (/** @type {number} */ n) => {
        for (let i = 0; i < n; i++) {
            await page.evaluate((on) => window.__setState('light.demo', on ? 'on' : 'off'), i % 2 === 0);
            await page.waitForTimeout(60);
        }
    };
    // settle: first renders, fonts, animations set up
    await toggle(4);
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => /** @type {any} */ (window).__liveListeners());
    await toggle(20);
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => /** @type {any} */ (window).__liveListeners());
    // 20 updates over 9 segment paths used to add 540 listeners
    expect(after - before).toBeLessThan(10);
    await expectNoErrors(page);
});
