/**
 * prefers-reduced-motion: AnimationManager settles animations instead of playing
 * them. Loops never run; finite ones (entrance, on_show) land on their end state.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Tracked anime.js instances that are still running, across every scope. */
const running = (page) => page.evaluate(() => {
    let n = 0;
    window.lcards.core.animationManager.scopes.forEach((scope) => {
        scope.runningInstances?.forEach((list) => list.forEach((i) => { if (i && !i.completed) n++; }));
    });
    return n;
});

/**
 * Lowest opacity seen on the card or anything in its shadow root, sampled every
 * frame from page start for `ms` (the on_show fade runs while the card mounts).
 */
async function sampleMinOpacity(page) {
    await page.addInitScript(() => {
        window.__minOpacity = 1;
        const tick = () => {
            const card = document.querySelector('#mount > *');
            if (card) {
                for (const el of [card, ...(card.shadowRoot?.querySelectorAll('*') ?? [])]) {
                    const o = parseFloat(getComputedStyle(el).opacity);
                    if (o < window.__minOpacity) window.__minOpacity = o;
                }
            }
            requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    });
}

test('control: without reduced motion the looping pulse runs', async ({ page }) => {
    await mountCase(page, 'button-pulse-load');
    await expect.poll(() => running(page)).toBeGreaterThan(0);
});

test('control: without reduced motion the on_show fade is seen part-way', async ({ page }) => {
    await sampleMinOpacity(page);
    await mountCase(page, 'button-on-show');
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => window.__minOpacity)).toBeLessThan(0.9);
});

/** Screenshots of the page while the Borg screen effect runs: before, then twice 700 ms apart. */
async function borgShots(page) {
    await mountCase(page, 'button-on-show');
    const blank = await page.screenshot();
    await page.evaluate(() => { window.lcards.core.screenEffectManager.play('borg-assimilation', { duration: 10000, siteCount: 4 }); });
    await page.waitForTimeout(6000); // sites spawn over the first ~5 s
    const first = await page.screenshot();
    await page.waitForTimeout(700);
    const second = await page.screenshot();
    return { blank, first, second };
}

test('control: without reduced motion the Borg effect keeps moving', async ({ page }) => {
    const { blank, first, second } = await borgShots(page);
    expect(first.equals(blank), 'something is drawn').toBe(false);
    expect(first.equals(second), 'frames differ').toBe(false);
});

test('switching reduced motion on stops loops but keeps essential_motion ones', async ({ page }) => {
    await mountCase(page, 'button-pulse-essential');
    await expect.poll(() => running(page)).toBeGreaterThan(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(300);
    expect(await running(page)).toBeGreaterThan(0);
    await expectNoErrors(page);
});

test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('a looping on_load pulse never runs', async ({ page }) => {
        await mountCase(page, 'button-pulse-load');
        await page.waitForTimeout(800);
        expect(await running(page)).toBe(0);
        await expectNoErrors(page);
    });

    test('an on_show fade lands on its end state at once', async ({ page }) => {
        await sampleMinOpacity(page);
        await mountCase(page, 'button-on-show');
        await page.waitForTimeout(600);
        expect(await page.evaluate(() => window.__minOpacity), 'never seen part-faded').toBe(1);
        expect(await running(page)).toBe(0);
        await expectNoErrors(page);
    });

    test('the Borg effect draws its settled picture once and holds it', async ({ page }) => {
        const { blank, first, second } = await borgShots(page);
        expect(first.equals(blank), 'the settled picture is drawn').toBe(false);
        expect(first.equals(second), 'it does not move').toBe(true);
        await expectNoErrors(page);
    });

    test('an animation with essential_motion: true plays anyway', async ({ page }) => {
        await mountCase(page, 'button-pulse-essential');
        await expect.poll(() => running(page)).toBeGreaterThan(0);
        await expectNoErrors(page);
    });

    test('essential_motion keeps stagger-flash running (its own WAAPI start honours it)', async ({ page }) => {
        await mountCase(page, 'button-on-show');
        const waapi = await page.evaluate(async () => {
            const ns = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            for (let i = 0; i < 3; i++) {
                const line = document.createElementNS(ns, 'line');
                line.setAttribute('class', 'bar');
                line.setAttribute('stroke', '#333333');
                svg.appendChild(line);
            }
            document.body.appendChild(svg);
            const am = window.lcards.core.animationManager;
            await am.onOverlayRendered('flash_essential', svg, {});
            await am.playAnimation('flash_essential', {
                trigger: 'on_load', preset: 'stagger-flash', target: '.bar', essential_motion: true,
                params: { lead_color: '#ffffff', trail_color: '#444444', duration: 1200, loop: true },
            });
            await new Promise(r => setTimeout(r, 100));
            return [...svg.querySelectorAll('.bar')].reduce((n, el) => n + el.getAnimations().length, 0);
        });
        expect(waapi).toBe(3);
        await expectNoErrors(page);
    });
});
