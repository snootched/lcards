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
    // The WebGL grid keeps its colours on its GridEffect model
    const gridColor = () => page.evaluate(() => {
        const e = document.querySelector('lcards-button')._backgroundRenderer?.renderer?.effects?.[0];
        return (e?.model ?? e)?.color ?? null;
    });
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

// ── Themed scopes ────────────────────────────────────────────────────────────
// Home Assistant writes a view's, section's or card's own theme as inline
// variables on that element (and records them in element.__themes); inside it
// those values win over the page root, so alert mode shifts each scope too.

/** Wrap the card in an element themed the way Home Assistant themes a view. */
const themeAround = (page, tag, vars, cacheKey = 'Test Theme') => page.evaluate(({ t, v, k }) => {
    const card = document.querySelector(t);
    const wrap = document.createElement('div');
    wrap.__themes = { cacheKey: k, keys: Object.fromEntries(Object.keys(v).map(n => [n, ''])) };
    for (const [n, val] of Object.entries(v)) wrap.style.setProperty(n, val);
    card.parentNode.insertBefore(wrap, card);
    wrap.appendChild(card);
}, { t: tag, v: vars, k: cacheKey });

const varAt = (page, tag, name) => page.evaluate(({ t, n }) => getComputedStyle(document.querySelector(t)).getPropertyValue(n).trim(), { t: tag, n: name });

test('alert mode shifts a view with its own theme, and green restores its own colours', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await themeAround(page, 'lcards-button', { '--lcars-ui-primary': '#ff9966', '--lcars-ui-tertiary': 'var(--lcars-ui-primary)' });
    expect(await varAt(page, 'lcards-button', '--lcars-ui-primary')).toBe('#ff9966');

    await setAlert(page, 'red_alert');
    await expect.poll(() => varAt(page, 'lcards-button', '--lcars-ui-primary')).not.toBe('#ff9966');
    const red = await varAt(page, 'lcards-button', '--lcars-ui-primary');
    await setAlert(page, 'blue_alert');
    await expect.poll(() => varAt(page, 'lcards-button', '--lcars-ui-primary')).not.toBe(red);   // from the original, no drift
    // a value that references another variable is left alone and follows it
    expect(await varAt(page, 'lcards-button', '--lcars-ui-tertiary')).toBe(await varAt(page, 'lcards-button', '--lcars-ui-primary'));

    await setAlert(page, 'green_alert');
    await expect.poll(() => varAt(page, 'lcards-button', '--lcars-ui-primary')).toBe('#ff9966');
    await expectNoErrors(page);
});

test('a themed view opened during an alert is shifted after navigation', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await setAlert(page, 'red_alert');
    await themeAround(page, 'lcards-button', { '--lcars-ui-primary': '#ff9966' }, 'Late Theme');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('location-changed')));
    await expect.poll(() => varAt(page, 'lcards-button', '--lcars-ui-primary'), { timeout: 3000 }).not.toBe('#ff9966');
    await setAlert(page, 'green_alert');
    await expect.poll(() => varAt(page, 'lcards-button', '--lcars-ui-primary')).toBe('#ff9966');
    await expectNoErrors(page);
});
