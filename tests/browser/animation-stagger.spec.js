/**
 * Stagger presets start their targets in the documented order: measured on a 3x3
 * grid of SVG rects, as the frame each rect's opacity first leaves 0.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Mount any card (brings up core), then a 3x3 grid of rects r0..r8 (row-major). */
async function grid(page, overlayId) {
    await mountCase(page, 'button-on-show');
    await page.evaluate(async (overlayId) => {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '200');
        svg.setAttribute('height', '200');
        for (let i = 0; i < 9; i++) {
            const rect = document.createElementNS(ns, 'rect');
            rect.id = `r${i}`;
            rect.setAttribute('class', 'cell');
            for (const [k, v] of Object.entries({ x: (i % 3) * 60, y: Math.floor(i / 3) * 60, width: 40, height: 40 })) rect.setAttribute(k, String(v));
            rect.style.opacity = '0';
            svg.appendChild(rect);
        }
        document.body.appendChild(svg);
        window.__svg = svg;
        await window.lcards.core.animationManager.onOverlayRendered(overlayId, svg, {});
    }, overlayId);
}

/**
 * Play an opacity 0 to 1 animation on every cell and return each cell's start
 * time (ms after play, frame resolution), in r0..r8 order.
 */
const startTimes = (page, overlayId, def) => page.evaluate(async ({ overlayId, def }) => {
    const cells = [...window.__svg.querySelectorAll('.cell')];
    const starts = cells.map(() => null);
    const t0 = performance.now();
    await new Promise((resolve) => {
        const tick = () => {
            const now = performance.now() - t0;
            cells.forEach((c, i) => { if (starts[i] === null && parseFloat(getComputedStyle(c).opacity) > 0.02) starts[i] = now; });
            if (starts.every((s) => s !== null) || now > 4000) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        window.lcards.core.animationManager.playAnimation(overlayId, { trigger: 'on_tap', target: '.cell', ...def });
    });
    return starts;
}, { overlayId, def });

/** Indices sorted by start time. */
const order = (starts) => starts.map((s, i) => [s, i]).sort((a, b) => a[0] - b[0]).map(([, i]) => i);

const params = { property: 'opacity', from_value: 0, to_value: 1, duration: 100, delay: 150 };

test('stagger-grid from center starts the middle cell first and the corners last', async ({ page }) => {
    await grid(page, 'st_center');
    const starts = await startTimes(page, 'st_center', { preset: 'stagger-grid', params: { ...params, grid: [3, 3], from: 'center' } });
    const o = order(starts);
    expect(o[0]).toBe(4);
    expect(o.slice(-4).sort()).toEqual([0, 2, 6, 8]);
    await expectNoErrors(page);
});

test('stagger-grid from a [col, row] cell starts at that cell', async ({ page }) => {
    await grid(page, 'st_cell');
    const starts = await startTimes(page, 'st_cell', { preset: 'stagger-grid', params: { ...params, grid: [3, 3], from: [2, 0] } });
    const o = order(starts);
    expect(o[0]).toBe(2);
    expect(o.at(-1)).toBe(6);
    await expectNoErrors(page);
});

test('stagger-grid from edges is the reverse of center', async ({ page }) => {
    await grid(page, 'st_edges');
    const starts = await startTimes(page, 'st_edges', { preset: 'stagger-grid', params: { ...params, grid: [3, 3], from: 'edges' } });
    expect(order(starts).at(-1)).toBe(4);
    await expectNoErrors(page);
});

test('stagger-wave reversed runs from the last target', async ({ page }) => {
    await grid(page, 'st_wave');
    const starts = await startTimes(page, 'st_wave', {
        preset: 'stagger-wave', params: { property: 'opacity', amplitude: 1, duration: 300, delay: 150, direction: 'reverse' },
    });
    expect(order(starts)).toEqual([8, 7, 6, 5, 4, 3, 2, 1, 0]);
    await expectNoErrors(page);
});

test('stagger-radial measures real positions from a corner', async ({ page }) => {
    await grid(page, 'st_radial');
    const starts = await startTimes(page, 'st_radial', { preset: 'stagger-radial', params: { ...params, from: [1, 1] } });
    const o = order(starts);
    expect(o[0]).toBe(8);
    expect(o.at(-1)).toBe(0);
    await expectNoErrors(page);
});

test('cascade staggers multiple targets (it used to start them all at once)', async ({ page }) => {
    await grid(page, 'st_cascade');
    const starts = await startTimes(page, 'st_cascade', { preset: 'cascade', params: { stagger: 120, duration: 100 } });
    expect(order(starts)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(starts[8] - starts[0]).toBeGreaterThan(700);
    await expectNoErrors(page);
});
