/**
 * Elbow card fixes from the D2 docs audit (2026-11-07), each reproduced here
 * against the built bundle first: per-segment entity_id and actions, the
 * segmented frame's inner ring colour fallback, inset: auto and the symbiont on
 * open / contained / bar types, the shape texture clip on a segmented elbow,
 * segmented bar_width: theme, and CSS lengths on frame sizes.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** The card element's own JS object (internals read through page.evaluate). */
const card = (page) => page.locator('lcards-elbow').first();

/** Computed fill of the first element matching `selector` in the card's shadow root. */
const fill = (page, selector) => card(page).evaluate((el, sel) => {
    const n = /** @type {any} */ (el).shadowRoot.querySelector(sel);
    return n ? getComputedStyle(n).fill : null;
}, selector);

const ORANGE = 'rgb(255, 153, 0)';
const BLUE = 'rgb(51, 102, 204)';

/** Viewport point `dx, dy` px into the card's svg (top-left origin). */
const svgPoint = (page, dx, dy) => card(page).evaluate((el, [x, y]) => {
    const r = /** @type {any} */ (el).shadowRoot.querySelector('svg').getBoundingClientRect();
    return { x: r.left + x, y: r.top + y };
}, [dx, dy]);

test('segmented elbow: each segment\'s colour follows its own entity_id, live; the others follow the card entity', async ({ page }) => {
    await mountCase(page, 'elbow-segment-entity', { width: '400', height: '200' });
    // light.demo is on (outer: active), switch.demo_switch is off (inner: inactive)
    await expect.poll(() => fill(page, 'path.elbow-outer')).toBe(ORANGE);
    await expect.poll(() => fill(page, 'path.elbow-inner')).toBe(BLUE);
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    await expect.poll(() => fill(page, 'path.elbow-inner')).toBe(ORANGE);
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await expect.poll(() => fill(page, 'path.elbow-outer')).toBe(BLUE);
    expect(await fill(page, 'path.elbow-inner')).toBe(ORANGE);
    await expectNoErrors(page);
});

test('segmented elbow: a segment runs its own actions on its own entity, else the card\'s actions', async ({ page }) => {
    await mountCase(page, 'elbow-segment-entity', { width: '400', height: '200' });
    await expect.poll(() => fill(page, 'path.elbow-inner')).toBe(BLUE);
    const calls = () => page.evaluate(() => window.__hass.serviceCalls.map(c => c.data?.entity_id ?? c.target?.entity_id));
    // which entities got a more-info (the harness records each event on both window and document)
    const moreInfo = () => page.evaluate(() => [...new Set(window.__events.filter(e => e.type === 'hass-more-info').map(e => e.detail.entityId))]);

    // inner segment (header-left: its vertical bar starts at x = 90 + 4): no tap_action
    // of its own, so the card's toggle runs, on the segment's entity
    let p = await svgPoint(page, 100, 190);
    await page.mouse.click(p.x, p.y);
    await expect.poll(calls).toEqual(['switch.demo_switch']);

    // outer segment's vertical bar: the card's toggle on the card entity
    p = await svgPoint(page, 10, 190);
    await page.mouse.click(p.x, p.y);
    await expect.poll(calls).toEqual(['switch.demo_switch', 'light.demo']);

    // inner segment hold_action: more-info on its own entity
    p = await svgPoint(page, 100, 190);
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.waitForTimeout(800);
    await page.mouse.up();
    await expect.poll(moreInfo).toEqual(['switch.demo_switch']);
    expect(await calls()).toHaveLength(2); // the hold did not also tap

    // outer segment double_tap_action: more-info on the card entity
    p = await svgPoint(page, 10, 190);
    await page.mouse.dblclick(p.x, p.y);
    await expect.poll(moreInfo).toEqual(['switch.demo_switch', 'light.demo']);
    await page.waitForTimeout(400);
    expect(await calls()).toHaveLength(2); // the double tap did not also tap
    await expectNoErrors(page);
});

test('segmented frame: the inner ring takes the outer ring\'s colour when inner_frame.color is not set', async ({ page }) => {
    await mountCase(page, 'elbow-frame-inner-fallback');
    await expect.poll(() => fill(page, 'path.elbow-bg')).toBe(ORANGE);
    await expect.poll(() => fill(page, 'path.elbow-frame-inner')).toBe(ORANGE);
    await expectNoErrors(page);
});

test('inset: auto and the symbiont follow each type\'s arms (open, contained and bar types too)', async ({ page }) => {
    await mountCase(page, 'elbow-insets', { width: '400', height: '200' });
    const read = () => card(page).evaluate(el => {
        const c = /** @type {any} */ (el);
        const host = c.shadowRoot.querySelector('.lcards-symbiont-container');
        const px = (v) => parseFloat(v);
        const symbiont = host && { top: px(host.style.top), right: px(host.style.right), bottom: px(host.style.bottom), left: px(host.style.left) };
        return { inset: c._resolveBackgroundAnimationInset('auto'), symbiont, type: c._elbowConfig.type };
    });
    const cases = {
        'header-open':      { top: 20, right: 0,  bottom: 0,  left: 0 },
        'footer-open':      { top: 0,  right: 0,  bottom: 20, left: 0 },
        'header-contained': { top: 20, right: 90, bottom: 0,  left: 90 },
        'footer-contained': { top: 0,  right: 90, bottom: 20, left: 90 },
        'bar-slant-right':  { top: 0,  right: 0,  bottom: 0,  left: 0 },
        'header-left':      { top: 20, right: 0,  bottom: 0,  left: 90 },
        'footer-right':     { top: 0,  right: 90, bottom: 20, left: 0 },
        'diagonal-cap-right': { top: 20, right: 90, bottom: 0, left: 0 },
    };
    for (const [type, want] of Object.entries(cases)) {
        await page.evaluate((t) => window.__reconfigure({
            type: 'custom:lcards-elbow',
            elbow: { type: t, segment: { bar_width: 90, bar_height: 20 } },
            symbiont: { enabled: true, card: { type: 'custom:lcards-button', preset: 'lozenge' } },
        }), type);
        await expect.poll(async () => (await read()).type).toBe(type);
        await expect.poll(async () => { const r = await read(); return { type, inset: r.inset, symbiont: r.symbiont }; })
            .toEqual({ type, inset: want, symbiont: want });
    }
    await expectNoErrors(page);
});

test('segmented elbow: the shape texture is clipped to the two segments', async ({ page }) => {
    await mountCase(page, 'elbow-segmented-texture', { width: '400', height: '200' });
    // fraction of painted pixels in a box (fractions of the canvas)
    const painted = (box) => card(page).evaluate((el, [x0, y0, x1, y1]) => {
        const canvas = /** @type {any} */ (el).shadowRoot.querySelector('canvas');
        if (!canvas || !canvas.width || !canvas.height) return null;
        const w = canvas.width, h = canvas.height;
        const data = canvas.getContext('2d').getImageData(Math.round(x0 * w), Math.round(y0 * h), Math.round((x1 - x0) * w), Math.round((y1 - y0) * h)).data;
        let n = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++;
        return n / (data.length / 4);
    }, box);
    // the outer segment's horizontal bar (y 0..20 of 200) is textured
    await expect.poll(() => painted([0.5, 0.01, 0.9, 0.09])).toBeGreaterThan(0.5);
    // the open body (right of x 124, below y 34) is not
    expect(await painted([0.5, 0.4, 0.95, 0.95])).toBe(0);
    await expectNoErrors(page);
});

test('segmented elbow: bar_width / bar_height theme follow the HA-LCARS helpers (90 until they exist)', async ({ page }) => {
    await mountCase(page, 'elbow-segmented-theme', { width: '400', height: '200' });
    const outer = () => card(page).evaluate(el => {
        const g = /** @type {any} */ (el)._elbowGeometry;
        return g?.outer ? { w: g.outer.horizontal, h: g.outer.vertical } : null;
    });
    await expect.poll(outer).toEqual({ w: 90, h: 90 });
    expect(await page.locator('lcards-elbow path.elbow-outer').count()).toBe(1);
    await page.evaluate(() => {
        window.__setState('input_number.lcars_vertical', { state: '120', attributes: { min: 0, max: 300 } });
        window.__setState('input_number.lcars_horizontal', { state: '24', attributes: { min: 0, max: 300 } });
    });
    await expect.poll(outer).toEqual({ w: 120, h: 24 });
    await expectNoErrors(page);
});

test('frame: bar_width / bar_height take CSS lengths', async ({ page }) => {
    await mountCase(page, 'elbow-frame-css', { width: '400', height: '200' });
    const sides = () => card(page).evaluate(el => {
        const z = /** @type {any} */ (el)._zones;
        return z?.get('body')?.bounds ?? null;
    });
    // left/right 24px, top/bottom 16px
    await expect.poll(sides).toMatchObject({ x: 24, y: 16 });
    await expectNoErrors(page);
});
