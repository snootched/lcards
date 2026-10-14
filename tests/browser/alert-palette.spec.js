/**
 * Alert modes recolour every card immediately (Layer A, built bundle).
 *
 * Alert modes rewrite the palette CSS variables; colours a card resolved to
 * concrete values (SVG attributes, Canvas2D, ApexCharts) cannot follow that on
 * their own. ThemeManager notifies LCARdSCard (subscribeToAlertMode) the moment
 * the variables are written, mid-transition, and LCARdSCard
 * re-resolves. Regression: with an alert transition, cards were notified only
 * after the transition finished, so the reveal showed the old palette until
 * something else made them redraw.
 *
 * Drives the real ThemeManager.setAlertMode() with no hass update, so nothing
 * but the palette change can trigger the repaint.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** The set of painted colours in the card (computed fill/stroke), sorted: ApexCharts rebuilds its SVG, so DOM order varies. */
const paint = (page, tag) => page.evaluate((t) => {
    const out = [];
    const walk = (root) => {
        for (const el of root.querySelectorAll('*')) {
            if (el instanceof SVGElement && !['svg', 'g', 'defs'].includes(el.tagName)) {
                const cs = getComputedStyle(el);
                out.push(cs.fill, cs.stroke);
            }
            if (el.shadowRoot) walk(el.shadowRoot);
        }
    };
    const card = document.querySelector(t);
    walk(card.shadowRoot ?? card);
    return [...new Set(out)].sort().join('|');
}, tag);

const setAlert = (page, mode) => page.evaluate((m) => window.lcards.core.themeManager.setAlertMode(m), mode);

const CASES = [
    ['slider-pills', 'lcards-slider', {}],
    ['button-lozenge', 'lcards-button', {}],
    ['elbow-header-left', 'lcards-elbow', {}],
    ['chart-line', 'lcards-chart', { height: '300' }],
    ['msd-palette', 'lcards-msd-card', {}],
];

/** A full re-process of every card (what a theme override change does); the reference for "no stale colour". */
const reprocessAll = (page) => page.evaluate(() => window.dispatchEvent(new CustomEvent('lcards:theme-overrides-changed')));

for (const [fixture, tag, params] of CASES) {
    test(`${fixture}: alert mode recolours immediately, with no stale colour, and green restores it`, async ({ page }) => {
        await mountCase(page, fixture, params);
        await expect.poll(() => paint(page, tag)).not.toBe('');
        const green = await paint(page, tag);

        await setAlert(page, 'blue_alert');
        await expect.poll(() => paint(page, tag), { timeout: 2000 }).not.toBe(green);
        await page.waitForTimeout(300);
        const afterAlert = await paint(page, tag);
        await reprocessAll(page);
        await page.waitForTimeout(300);
        expect(afterAlert).toBe(await paint(page, tag));

        await setAlert(page, 'green_alert');
        await expect.poll(() => paint(page, tag), { timeout: 2000 }).toBe(green);
        await expectNoErrors(page);
    });
}

test('with a transition, cards repaint while the transition is still running', async ({ page }) => {
    await mountCase(page, 'slider-pills');
    await expect.poll(() => paint(page, 'lcards-slider')).not.toBe('');
    const green = await paint(page, 'lcards-slider');

    // Transitions animate home-assistant-main; the harness has no HA shell, so add a stand-in.
    await page.evaluate(() => {
        const ha = document.createElement('home-assistant');
        ha.attachShadow({ mode: 'open' }).appendChild(document.createElement('home-assistant-main'));
        document.body.appendChild(ha);
        window.__alertDone = false;
        window.lcards.core.themeManager.setAlertMode('blue_alert', { transitionStyle: 'blur_fade' })
            .then(() => { window.__alertDone = true; });
    });
    await expect.poll(() => paint(page, 'lcards-slider'), { timeout: 2000 }).not.toBe(green);
    expect(await page.evaluate(() => window.__alertDone), 'repainted before the transition finished').toBe(false);
    await expect.poll(() => page.evaluate(() => window.__alertDone)).toBe(true);
    await expectNoErrors(page);
});

test('background animation: effects are rebuilt with the new palette', async ({ page }) => {
    await mountCase(page, 'button-background');
    const gridColor = () => page.evaluate(() => document.querySelector('lcards-button')._backgroundRenderer?.renderer?.effects?.[0]?.color ?? null);
    await expect.poll(gridColor).not.toBeNull();
    const green = await gridColor();

    await setAlert(page, 'blue_alert');
    await expect.poll(gridColor, { timeout: 2000 }).not.toBe(green);
    await setAlert(page, 'green_alert');
    await expect.poll(gridColor, { timeout: 2000 }).toBe(green);
    await expectNoErrors(page);
});

test('data grid: the cascade restarts with the new palette, data kept', async ({ page }) => {
    await page.addInitScript(() => {
        // Record the colours each cascade registration hands to anime.js
        window.__cascadeColors = [];
        const hook = setInterval(() => {
            const am = window.lcards?.core?.animationManager;
            if (!am || am.__hooked) return;
            const original = am.registerAnimation.bind(am);
            am.registerAnimation = (id, def, opts) => {
                if (def?.preset === 'cascade-color') window.__cascadeColors.push(def.params.colors.join(','));
                return original(id, def, opts);
            };
            am.__hooked = true;
            clearInterval(hook);
        }, 1);
    });
    await mountCase(page, 'data-grid-cascade');
    const last = () => page.evaluate(() => window.__cascadeColors.at(-1) ?? null);
    const cells = () => page.locator('lcards-data-grid .grid-cell').allTextContents();
    await expect.poll(last).not.toBeNull();
    const green = await last();
    const data = await cells();

    await setAlert(page, 'blue_alert');
    await expect.poll(last, { timeout: 2000 }).not.toBe(green);
    expect(await cells()).toEqual(data);
    await setAlert(page, 'green_alert');
    await expect.poll(last, { timeout: 2000 }).toBe(green);
    await expectNoErrors(page);
});
