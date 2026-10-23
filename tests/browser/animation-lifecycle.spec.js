/**
 * AnimationManager owns every instance it starts: destroying an overlay stops its
 * loops, a stop that arrives while an animation is still starting wins, a `while`
 * stop ends only its own animation, finished instances are not kept, and trigger
 * metadata (entity, from_state, ...) never reaches anime.js as a tween property.
 * Driven on plain SVG elements so no card repaint can mask a leaked animation.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Mount any card (brings up core), then a plain SVG with one rect per id. */
async function setup(page, overlayId, rectIds) {
    await mountCase(page, 'button-on-show');
    await page.evaluate(async ({ overlayId, rectIds }) => {
        const ns = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(ns, 'svg');
        for (const id of rectIds) {
            const rect = document.createElementNS(ns, 'rect');
            rect.id = id;
            rect.setAttribute('width', '40');
            rect.setAttribute('height', '20');
            rect.setAttribute('fill', '#333366');
            svg.appendChild(rect);
        }
        document.body.appendChild(svg);
        window.__svg = svg;
        await window.lcards.core.animationManager.onOverlayRendered(overlayId, svg, {});
    }, { overlayId, rectIds });
}

/** A looping fill animation definition on one rect. */
const fillLoop = (rectId, trigger = 'on_hover') => ({
    trigger,
    preset: 'color-shift',
    target: `#${rectId}`,
    params: { property: 'fill', color_from: '#333366', color_to: '#00ff00', duration: 300, loop: true, alternate: true },
});

const fill = (page, id) => page.evaluate((id) => window.__svg.querySelector(`#${id}`).getAttribute('fill'), id);

/** Fill values seen over `ms`, one sample per animation frame. */
const sampleFills = (page, id, ms) => page.evaluate(({ id, ms }) => new Promise((resolve) => {
    const seen = new Set();
    const el = window.__svg.querySelector(`#${id}`);
    const end = performance.now() + ms;
    const tick = () => {
        seen.add(el.getAttribute('fill'));
        if (performance.now() < end) requestAnimationFrame(tick); else resolve([...seen]);
    };
    requestAnimationFrame(tick);
}), { id, ms });

test('destroying an overlay stops its looping animations', async ({ page }) => {
    await setup(page, 'life_destroy', ['r1']);
    await page.evaluate((def) => window.lcards.core.animationManager.playAnimation('life_destroy', def), fillLoop('r1'));
    await expect.poll(() => fill(page, 'r1'), { timeout: 3000 }).not.toBe('#333366');

    await page.evaluate(() => window.lcards.core.animationManager.destroyOverlayScope('life_destroy'));
    expect(await sampleFills(page, 'r1', 500), 'no frame after destroy').toEqual(['#333366']);
    await expectNoErrors(page);
});

test('a stop that arrives while the animation is still starting wins', async ({ page }) => {
    await setup(page, 'life_race', ['r1']);
    // playAnimation is async (datasource params, target resolution); a quick
    // mouseleave calls stopAnimations before the hover instance exists.
    await page.evaluate((def) => {
        const am = window.lcards.core.animationManager;
        window.__pending = am.playAnimation('life_race', def);
        am.stopAnimations('life_race', 'on_hover');
    }, fillLoop('r1'));
    await page.evaluate(() => window.__pending);
    expect(await sampleFills(page, 'r1', 500)).toEqual(['#333366']);
    await expectNoErrors(page);
});

test('a later trigger after a stop still plays', async ({ page }) => {
    await setup(page, 'life_replay', ['r1']);
    await page.evaluate(async (def) => {
        const am = window.lcards.core.animationManager;
        am.stopAnimations('life_replay', 'on_hover');
        await am.playAnimation('life_replay', def);
    }, fillLoop('r1'));
    await expect.poll(() => fill(page, 'r1'), { timeout: 3000 }).not.toBe('#333366');
    await expectNoErrors(page);
});

test('stopping one animation of a trigger leaves the others running', async ({ page }) => {
    await setup(page, 'life_while', ['r1', 'r2']);
    await page.evaluate(async ({ a, b }) => {
        const am = window.lcards.core.animationManager;
        window.__defA = a;
        await am.playAnimation('life_while', a);
        await am.playAnimation('life_while', b);
    }, { a: fillLoop('r1', 'on_entity_change'), b: fillLoop('r2', 'on_entity_change') });
    await expect.poll(() => fill(page, 'r2'), { timeout: 3000 }).not.toBe('#333366');

    await page.evaluate(() => window.lcards.core.animationManager.stopAnimations('life_while', 'on_entity_change', window.__defA));
    expect(await sampleFills(page, 'r1', 400), 'stopped one restored').toEqual(['#333366']);
    expect((await sampleFills(page, 'r2', 400)).length, 'other still animating').toBeGreaterThan(1);
    await expectNoErrors(page);
});

test('finished instances are not kept', async ({ page }) => {
    await setup(page, 'life_prune', ['r1']);
    const count = await page.evaluate(async () => {
        const am = window.lcards.core.animationManager;
        const def = { trigger: 'on_tap', preset: 'fade', target: '#r1', params: { from: 0.5, to: 1, duration: 30 } };
        for (let i = 0; i < 5; i++) {
            await am.playAnimation('life_prune', def);
            await new Promise(r => setTimeout(r, 120));
        }
        return am.scopes.get('life_prune').runningInstances.get('on_tap')?.length ?? 0;
    });
    expect(count).toBeLessThanOrEqual(1);
    await expectNoErrors(page);
});

test('trigger metadata never reaches the element as attributes', async ({ page }) => {
    await setup(page, 'life_meta', ['r1']);
    const attrs = await page.evaluate(async () => {
        const am = window.lcards.core.animationManager;
        await am.playAnimation('life_meta', {
            trigger: 'on_entity_change', entity: 'switch.demo_switch', attribute: 'friendly_name',
            from_state: 'off', to_state: 'on', check_on_load: true, enabled: true, while: { state: 'on' },
            preset: 'fade', target: '#r1', params: { from: 0.5, to: 1, duration: 50 },
        });
        await new Promise(r => setTimeout(r, 200));
        return window.__svg.querySelector('#r1').getAttributeNames();
    });
    for (const key of ['entity', 'attribute', 'from_state', 'to_state', 'check_on_load', 'enabled', 'while']) {
        expect(attrs, key).not.toContain(key);
    }
    await expectNoErrors(page);
});

test('pulse and fade clean up when they finish', async ({ page }) => {
    // Their onComplete used anime.js v3's `animatables` and never ran
    await setup(page, 'life_cleanup', ['r1', 'r2']);
    const result = await page.evaluate(async () => {
        const am = window.lcards.core.animationManager;
        // 3 alternating iterations end on `to`; the cleanup puts `from` back
        await am.playAnimation('life_cleanup', { trigger: 'on_tap', preset: 'fade', target: '#r1', params: { from: 1, to: 0.3, duration: 40, loop: 2, alternate: true } });
        await am.playAnimation('life_cleanup', { trigger: 'on_tap', preset: 'pulse', target: '#r2', params: { duration: 40, loop: 1, alternate: true } });
        await new Promise(r => setTimeout(r, 500));
        const r1 = window.__svg.querySelector('#r1');
        const r2 = window.__svg.querySelector('#r2');
        return { opacity: r1.style.opacity, filter: r2.style.filter, transform: r2.style.transform };
    });
    expect(result).toEqual({ opacity: '1', filter: '', transform: '' });
    await expectNoErrors(page);
});
