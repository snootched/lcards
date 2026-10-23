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
});
