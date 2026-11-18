/**
 * GitHub #411 (2026-11-18): a blind slider built with control.invert_value and
 * style.track.invert_fill (fill from the top = the lowered part, drag up = open).
 * The slider works in a flipped space (max - value + min); the drag badge and
 * the scale labels showed that number (10 for a blind at 90). Every number it
 * shows is now the entity's; positions are unchanged.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

test('invert_value: the drag badge, the scale and aria show the entity value; the fill stays put', async ({ page }) => {
    await mountCase(page, 'slider-invert-blind', { width: '200', height: '400' });
    await page.evaluate(() => window.__setState('input_number.demo_level', '90'));
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
        const c = /** @type {any} */ (window).__card;
        const root = c.shadowRoot;
        const labels = [...root.querySelectorAll('text')]
            .map((t) => ({ t: t.textContent.trim(), y: t.getBoundingClientRect().y + t.getBoundingClientRect().height / 2 }))
            .filter((x) => /^\d+$/.test(x.t));
        const fill = root.querySelector('rect[data-fill-pos-base]')?.getBoundingClientRect();
        const handleY = fill ? fill.y + fill.height : null;
        const nearest = labels.reduce((a, b) => (Math.abs(b.y - handleY) < Math.abs(a.y - handleY) ? b : a));
        const top = labels.reduce((a, b) => (b.y < a.y ? b : a));
        return {
            badge: c._formatDragBadgeValue(),
            atHandle: nearest.t,
            top: top.t,
            fillShare: fill ? Math.round(100 * fill.height / root.querySelector('svg').getBoundingClientRect().height) : null,
            valuetext: root.querySelector('input.slider-input-overlay')?.getAttribute('aria-valuetext') ?? null,
        };
    });
    expect(r.badge).toBe('90');
    expect(r.atHandle).toBe('90');
    expect(r.top).toBe('100');
    // the fill (the lowered part) is still about a tenth of the track, from the top
    expect(r.fillShare).toBeGreaterThan(5);
    expect(r.fillShare).toBeLessThan(20);
    if (r.valuetext !== null) expect(r.valuetext).toBe('90');
    await expectNoErrors(page);
});

test('invert_value: ranges and value markers are placed by the entity value', async ({ page }) => {
    await mountCase(page, 'slider-invert-blind', { width: '200', height: '400' });
    await page.evaluate(() => window.__setState('input_number.demo_level', '90'));
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
        const root = /** @type {any} */ (window).__card.shadowRoot;
        const track = root.querySelector('svg').getBoundingClientRect();
        const centre = (/** @type {Element|null} */ el) => {
            if (!el) return null;
            const b = el.getBoundingClientRect();
            return (b.y + b.height / 2 - track.y) / track.height;
        };
        return { band: centre(root.querySelector('rect.range-bg')), marker: centre(root.querySelector('[data-lcards-role="range-marker"]')) };
    });
    // 100 is at the top: the 0-20 band sits in the bottom fifth, the 75 marker a quarter down
    expect(r.band).toBeGreaterThan(0.7);
    expect(r.marker).toBeGreaterThan(0.15);
    expect(r.marker).toBeLessThan(0.4);
    await expectNoErrors(page);
});

test('invert_fill alone: a range sits at the flipped end, as the fill and the scale do', async ({ page }) => {
    await mountCase(page, 'slider-invert-blind', { width: '200', height: '400' });
    await page.evaluate(() => {
        const config = JSON.parse(JSON.stringify(/** @type {any} */ (window).__card.config));
        delete config.control;
        return /** @type {any} */ (window).__reconfigure(config);
    });
    await page.waitForTimeout(800);
    const band = await page.evaluate(() => {
        const root = /** @type {any} */ (window).__card.shadowRoot;
        const track = root.querySelector('svg').getBoundingClientRect();
        const b = root.querySelector('rect.range-bg').getBoundingClientRect();
        return (b.y + b.height / 2 - track.y) / track.height;
    });
    // invert_fill puts 0 at the top: the 0-20 band is in the top fifth (it stayed at the bottom)
    expect(band).toBeLessThan(0.3);
    await expectNoErrors(page);
});
