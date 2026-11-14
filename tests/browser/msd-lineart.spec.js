/**
 * builtin:galaxy-class-lineart (made by scripts/make-msd-lineart.mjs): the card
 * loads the line-art blueprint, its lines take the theme colour (currentColor
 * under a var() colour), its named anchors resolve and a line joins one by name.
 * The file itself is checked in tests/core/msd-lineart.test.js.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

test('the line-art Galaxy class loads, its anchors resolve and a line joins the warp core', async ({ page }) => {
    await mountCase(page, 'msd-lineart', { width: '1000' });
    const card = () => page.evaluate(() => {
        const c = /** @type {any} */ (document.querySelector('#mount > *'));
        const anchors = c._msdPipeline?.getResolvedModel?.()?.anchors || {};
        const outline = c.renderRoot.querySelector('#__msd-base-content .lineart-outline');
        const line = c.renderRoot.querySelector('#core_line .line-path');
        return {
            anchors: Object.keys(anchors),
            warpCore: anchors.warp_core || null,
            outline: outline ? { d: (outline.getAttribute('d') || '').length, stroke: getComputedStyle(outline).stroke } : null,
            lineD: line?.getAttribute('d') || null,
            // The label's button shapes: nothing may inherit a stroke from the drawing.
            labelStrokes: (() => {
                const btn = c.renderRoot.querySelector('lcards-button');
                if (!btn?.shadowRoot) return null;
                return [...btn.shadowRoot.querySelectorAll('rect, path')].map(e => getComputedStyle(e).stroke);
            })()
        };
    });
    await expect.poll(async () => (await card()).lineD, { timeout: 15_000 }).not.toBeNull();
    const s = await card();
    for (const name of ['bridge', 'saucer', 'neck', 'engineering', 'warp_core', 'impulse', 'shuttle_bay', 'deflector', 'torpedo', 'nacelle', 'bussard', 'pylon']) {
        expect(s.anchors, name).toContain(name);
    }
    expect(s.outline?.d).toBeGreaterThan(1000);
    // currentColor resolved from the theme variable (or its fallback): a real colour, not black.
    expect(s.outline?.stroke).toMatch(/^rgb/);
    expect(s.outline?.stroke).not.toBe('rgb(0, 0, 0)');
    // The line ends on the warp core anchor.
    const pts = [...(s.lineD || '').matchAll(/(-?[\d.]+)[ ,]+(-?[\d.]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
    const end = pts[pts.length - 1];
    expect(Math.hypot(end[0] - s.warpCore[0], end[1] - s.warpCore[1])).toBeLessThan(2);
    // The drawing's paint stays on its own group: the label's background has no stroke.
    await expect.poll(async () => (await card()).labelStrokes?.length ?? 0).toBeGreaterThan(0);
    expect((await card()).labelStrokes?.every(v => v === 'none')).toBe(true);
    await expectNoErrors(page);
});
