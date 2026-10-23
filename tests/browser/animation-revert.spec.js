/**
 * Stopping a looping animation returns its target to the pre-animation state.
 * Since anime.js 4.4, revert() restores SVG attributes (fill, stroke, ...) as well
 * as inline styles; on 4.3 a stopped fill animation stayed on whatever frame it
 * was on when it stopped. Driven through AnimationManager on a plain SVG element
 * so no card repaint can restore the colour on revert()'s behalf.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

test('stopping a looping fill animation restores the original fill attribute', async ({ page }) => {
    await mountCase(page, 'button-on-show'); // any card: brings up core + AnimationManager
    await page.evaluate(async () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '40');
        rect.setAttribute('height', '20');
        rect.setAttribute('fill', '#333366');
        svg.appendChild(rect);
        document.body.appendChild(svg);
        window.__rect = rect;
        const am = window.lcards.core.animationManager;
        await am.onOverlayRendered('revert_probe', svg, {});
        await am.playAnimation('revert_probe', {
            trigger: 'on_hover',
            preset: 'color-shift',
            target: 'rect',
            params: { property: 'fill', color_from: '#333366', color_to: '#00ff00', duration: 400, loop: true, alternate: true },
        });
    });
    const fill = () => page.evaluate(() => window.__rect.getAttribute('fill'));

    await expect.poll(fill, { timeout: 3000 }).not.toBe('#333366');
    await page.waitForTimeout(150); // land mid-loop
    await page.evaluate(() => window.lcards.core.animationManager.stopAnimations('revert_probe', 'on_hover'));
    expect(await fill()).toBe('#333366');
    await page.waitForTimeout(500);
    expect(await fill(), 'stays restored once stopped').toBe('#333366');
    await expectNoErrors(page);
});

test('animating an SVG group keeps its authored translate or matrix transform', async ({ page }) => {
    // _migrateTransformAttrToStyle copies the attribute into style.transform before
    // anime.js touches it. Authored rotate()/scale() forms are a known gap (lost on
    // anime.js 4.3 and 4.5 alike; see reports/handoffs/animejs-upgrade-4.5.md).
    await mountCase(page, 'button-on-show');
    const result = await page.evaluate(async () => {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '400');
        svg.setAttribute('height', '300');
        document.body.appendChild(svg);
        const am = window.lcards.core.animationManager;
        await am.onOverlayRendered('transform_probe', svg, {});
        const cases = { translate: 'translate(50,20)', matrix: 'matrix(1,0,0,1,30,10)' };
        const box = (el) => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round).join(','); };
        const out = {};
        for (const [name, transform] of Object.entries(cases)) {
            const g = document.createElementNS(ns, 'g');
            g.id = `g_${name}`;
            g.setAttribute('transform', transform);
            const rect = document.createElementNS(ns, 'rect');
            for (const [k, v] of Object.entries({ x: 100, y: 100, width: 40, height: 20 })) rect.setAttribute(k, String(v));
            g.appendChild(rect);
            svg.appendChild(g);
            out[name] = { before: box(rect) };
            await am.playAnimation('transform_probe', {
                trigger: 'on_tap', preset: 'skew', target: `#g_${name}`, params: { skewX: 0, skewY: 0, duration: 50 },
            });
        }
        await new Promise(r => setTimeout(r, 300));
        for (const name of Object.keys(cases)) out[name].after = box(svg.querySelector(`#g_${name} rect`));
        return out;
    });
    for (const [name, { before, after }] of Object.entries(result)) {
        expect(after, `${name} moved`).toBe(before);
    }
    await expectNoErrors(page);
});
