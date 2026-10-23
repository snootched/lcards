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

test('animating an SVG group keeps its authored transform (translate, rotate, scale, matrix)', async ({ page }) => {
    // _migrateTransformAttrToStyle moves the attribute into style.transform as a
    // matrix compensated for the preset's transform-origin (skew sets center +
    // fill-box). Before 2026-10 only translate() survived; rotate/scale forms jumped.
    await mountCase(page, 'button-on-show');
    const result = await page.evaluate(async () => {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '400');
        svg.setAttribute('height', '300');
        document.body.appendChild(svg);
        const am = window.lcards.core.animationManager;
        await am.onOverlayRendered('transform_probe', svg, {});
        const cases = {
            translate: 'translate(50,20)', translateSpaced: 'translate(50 20)', matrix: 'matrix(1,0,0,1,30,10)',
            rotate: 'rotate(30)', rotateAbout: 'rotate(30 50 50)', scaleTranslate: 'scale(2) translate(5 5)',
            rotatedMatrix: 'matrix(0.866,0.5,-0.5,0.866,20,-10)',
        };
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

for (const file of ['enterprise-d-shuttlecraft15-anomaly.svg', 'ncc-1701-kelvin.svg']) {
    test(`${file}: animating its transformed elements does not change how it is drawn`, async ({ page }) => {
        await mountCase(page, 'button-on-show');
        const result = await page.evaluate(async (file) => {
            const text = await (await fetch(`/lcards/msd/${file}`)).text();
            const host = document.createElement('div');
            host.style.width = '1200px';
            document.body.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            shadow.innerHTML = text;
            const svg = shadow.querySelector('svg');
            svg.setAttribute('width', '1200');
            const transformed = [...svg.querySelectorAll('[transform]')]
                .filter(el => /rotate|scale|matrix/.test(el.getAttribute('transform')) && el.getBBox().width > 0);
            transformed.forEach((el, i) => el.setAttribute('data-probe', String(i)));
            const box = (el) => { const r = el.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; };
            const before = transformed.map(box);
            const am = window.lcards.core.animationManager;
            await am.onOverlayRendered('svg_probe', svg, {});
            // scale sets transform-origin: center + fill-box, the case the compensation is for
            await am.playAnimation('svg_probe', { trigger: 'on_tap', preset: 'scale', target: '[data-probe]', params: { scale: 1, duration: 30 } });
            await new Promise(r => setTimeout(r, 300));
            const after = transformed.map(box);
            // Sub-pixel noise only: the browser keeps about 6 significant digits of the matrix
            const diff = (i) => Math.max(...before[i].map((v, k) => Math.abs(v - after[i][k])));
            const maxDiff = Math.max(0, ...transformed.map((_el, i) => diff(i)));
            const moved = transformed.map((el, i) => diff(i) > 0.25 ? `${el.tagName}#${el.id} ${before[i]} -> ${after[i]}` : null).filter(Boolean);
            return { count: transformed.length, moved: moved.slice(0, 5), movedCount: moved.length, maxDiff };
        }, file);
        expect(result.count, 'elements with rotate/scale/matrix transforms').toBeGreaterThan(0);
        expect(result.moved, `${result.movedCount} of ${result.count} moved (largest difference ${result.maxDiff.toFixed(3)} px)`).toEqual([]);
        console.log(`${file}: ${result.count} transformed elements, largest box difference ${result.maxDiff.toFixed(3)} px`);
        await expectNoErrors(page);
    });
}
