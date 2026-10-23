/**
 * stagger-flash runs on native WAAPI (per-element loops, keyframe offsets), handed to
 * AnimationManager as handles: tracked, stopped by stopAnimations(), and never started
 * under reduced motion. The alert band reads the same WAAPI animations for its phase.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

async function bars(page, overlayId) {
    await mountCase(page, 'button-on-show');
    await page.evaluate(async (overlayId) => {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        for (let i = 1; i <= 6; i++) {
            const line = document.createElementNS(ns, 'line');
            line.setAttribute('class', 'bar');
            line.setAttribute('stroke', '#333333');
            for (const [k, v] of Object.entries({ x1: 0, y1: i * 10, x2: 100, y2: i * 10 })) line.setAttribute(k, String(v));
            svg.appendChild(line);
        }
        document.body.appendChild(svg);
        window.__svg = svg;
        const am = window.lcards.core.animationManager;
        await am.onOverlayRendered(overlayId, svg, {});
        await am.playAnimation(overlayId, {
            trigger: 'on_load', preset: 'stagger-flash', target: '.bar',
            params: { lead_color: '#ffffff', trail_color: '#444444', duration: 1200, loop: true },
        });
    }, overlayId);
    await page.waitForTimeout(100); // WAAPI starts a tick after setup
}

const state = (page, overlayId) => page.evaluate((overlayId) => ({
    waapi: [...window.__svg.querySelectorAll('.bar')].reduce((n, el) => n + el.getAnimations().length, 0),
    handles: (window.lcards.core.animationManager.scopes.get(overlayId).runningInstances.get('on_load') ?? [])
        .filter(i => i.animation !== undefined && !i.completed).length,
}), overlayId);

test('stagger-flash animations are tracked, and stopAnimations ends them', async ({ page }) => {
    await bars(page, 'flash_stop');
    expect(await state(page, 'flash_stop')).toEqual({ waapi: 6, handles: 6 });
    await page.evaluate(() => window.lcards.core.animationManager.stopAnimations('flash_stop', 'on_load'));
    expect((await state(page, 'flash_stop')).waapi, 'WAAPI animations cancelled').toBe(0);
    await expectNoErrors(page);
});

test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('stagger-flash never starts', async ({ page }) => {
        await bars(page, 'flash_rm');
        expect((await state(page, 'flash_rm')).waapi).toBe(0);
        await expectNoErrors(page);
    });
});
