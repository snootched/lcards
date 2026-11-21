/**
 * The sequence preset is one anime.js timeline per animation: steps name their own
 * targets inside the card (resolved in the card's root, not document), steps without
 * one animate the animation's targets together, and stopping reverts every step.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Mount any card (brings up core), then a plain SVG with rects r1..r3 inside a shadow root. */
async function setup(page, overlayId) {
    await mountCase(page, 'button-on-show');
    await page.evaluate(async (overlayId) => {
        // A shadow root, like a card: document-level selectors would find nothing here
        const host = document.createElement('div');
        document.body.appendChild(host);
        const shadow = host.attachShadow({ mode: 'open' });
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        for (const id of ['r1', 'r2', 'r3']) {
            const rect = document.createElementNS(ns, 'rect');
            rect.id = id;
            rect.setAttribute('class', 'cell');
            rect.setAttribute('width', '40');
            rect.setAttribute('height', '20');
            rect.style.opacity = '0';
            svg.appendChild(rect);
        }
        shadow.appendChild(svg);
        window.__svg = svg;
        await window.lcards.core.animationManager.onOverlayRendered(overlayId, svg, {});
    }, overlayId);
}

/** Play and record each rect's start time (first frame its opacity leaves 0). */
const play = (page, overlayId, def) => page.evaluate(async ({ overlayId, def }) => {
    const cells = ['r1', 'r2', 'r3'].map(id => window.__svg.querySelector(`#${id}`));
    const starts = [null, null, null];
    const t0 = performance.now();
    window.lcards.core.animationManager.playAnimation(overlayId, def);
    await new Promise((resolve) => {
        const tick = () => {
            const now = performance.now() - t0;
            cells.forEach((c, i) => { if (starts[i] === null && parseFloat(getComputedStyle(c).opacity) > 0.02) starts[i] = now; });
            if (starts.every(s => s !== null) || now > 3000) resolve(); else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
    const tracked = window.lcards.core.animationManager.scopes.get(overlayId).runningInstances.get(def.trigger)?.length ?? 0;
    return { starts, tracked };
}, { overlayId, def });

const fade = { opacity: [0, 1], duration: 250 };

test('steps animate their own targets inside the card, at their offsets', async ({ page }) => {
    await setup(page, 'seq_targets');
    const { starts, tracked } = await play(page, 'seq_targets', {
        trigger: 'on_tap', preset: 'sequence', target: '#r1',
        params: { steps: [
            { target: '#r1', ...fade },
            { target: '#r2', ...fade },              // after r1
            { target: '#r3', ...fade, offset: '<<' }, // together with r2
        ] },
    });
    expect(starts.every(s => s !== null), 'all three steps ran').toBe(true);
    expect(starts[1] - starts[0]).toBeGreaterThan(150);
    expect(Math.abs(starts[2] - starts[1])).toBeLessThan(60);
    expect(tracked, 'one timeline, tracked once').toBe(1);
    await expectNoErrors(page);
});

test('a step without a target animates all the animation targets in one timeline', async ({ page }) => {
    await setup(page, 'seq_all');
    const { starts, tracked } = await play(page, 'seq_all', {
        trigger: 'on_tap', preset: 'sequence', target: '.cell', params: { steps: [{ ...fade }] },
    });
    expect(starts.every(s => s !== null)).toBe(true);
    expect(Math.max(...starts) - Math.min(...starts)).toBeLessThan(60);
    expect(tracked).toBe(1);
    await expectNoErrors(page);
});

test('stopping the sequence reverts every step', async ({ page }) => {
    await setup(page, 'seq_stop');
    await page.evaluate(async () => {
        const am = window.lcards.core.animationManager;
        await am.playAnimation('seq_stop', {
            trigger: 'on_hover', preset: 'sequence', target: '#r1', loop: true,
            params: { loop: true, steps: [{ target: '#r1', opacity: [0, 1], duration: 300 }, { target: '#r2', opacity: [0, 1], duration: 300, offset: '<<' }] },
        });
        await new Promise(r => setTimeout(r, 150));
        am.stopAnimations('seq_stop', 'on_hover');
    });
    const opacities = await page.evaluate(() => ['r1', 'r2'].map(id => window.__svg.querySelector(`#${id}`).style.opacity));
    expect(opacities).toEqual(['0', '0']);
    await expectNoErrors(page);
});

test('a data-grid change highlight runs through AnimationManager', async ({ page }) => {
    // It used to call the preset and anime.js directly: untracked, no preset setup
    await mountCase(page, 'data-grid-highlight');
    /** Running highlight instances, and the cells they animate */
    const running = () => page.evaluate(() => {
        const cells = [];
        window.lcards.core.animationManager.scopes.forEach((s) => {
            for (const i of s.runningInstances.get('on_cell_change') ?? []) {
                if (!i.completed) cells.push(...i.targets.map((t) => `${t.dataset.row},${t.dataset.col}`));
            }
        });
        return cells;
    });
    await expect.poll(running, { timeout: 3000 }).toEqual([]); // first-load highlights finish
    await page.evaluate(() => window.__setState('input_number.demo_level', '77'));
    await expect.poll(running, { timeout: 3000 }).toEqual(['0,1']);
    await expectNoErrors(page);
});

test('the custom preset passes raw anime.js properties through; the legacy type: custom shape runs too', async ({ page }) => {
    await setup(page, 'seq_custom');
    const result = await page.evaluate(async () => {
        const am = window.lcards.core.animationManager;
        await am.playAnimation('seq_custom', { trigger: 'on_tap', preset: 'custom', target: '#r1', params: { opacity: [0, 0.6], duration: 60, targets: '#nowhere' } });
        await am.playAnimation('seq_custom', { trigger: 'on_tap', type: 'custom', target: '#r2', animejs: { opacity: [0, 0.4], duration: 60 } });
        await new Promise(r => setTimeout(r, 300));
        const r1 = window.__svg.querySelector('#r1');
        const r2 = window.__svg.querySelector('#r2');
        return { r1: r1.style.opacity, r2: r2.style.opacity, attrs: r2.getAttributeNames() };
    });
    expect([result.r1, result.r2]).toEqual(['0.6', '0.4']);
    expect(result.attrs).not.toContain('animejs');
    await expectNoErrors(page);
});
