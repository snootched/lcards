/**
 * An on_tap animation on a button whose tap toggles its entity keeps playing when
 * Home Assistant pushes the new state (the card re-renders its SVG for the new colour).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Largest scale seen on any element of the card's shadow root, per frame, for `ms`. */
const sampleMaxScale = (page, ms) => page.evaluate((ms) => new Promise((resolve) => {
    const card = document.querySelector('#mount > *');
    let max = 1;
    const end = performance.now() + ms;
    const tick = () => {
        for (const el of card.shadowRoot.querySelectorAll('*')) {
            const t = getComputedStyle(el).transform;
            if (t && t.startsWith('matrix(')) max = Math.max(max, parseFloat(t.slice(7)));
        }
        if (performance.now() < end) requestAnimationFrame(tick); else resolve(max);
    };
    requestAnimationFrame(tick);
}), ms);

test('control: an on_tap animation plays when the state does not change', async ({ page }) => {
    const card = await mountCase(page, 'button-tap-custom');
    await card.click();
    expect(await sampleMaxScale(page, 900)).toBeGreaterThan(1.15);
    await expectNoErrors(page);
});

test('an on_tap animation survives the state change its own tap causes', async ({ page }) => {
    const card = await mountCase(page, 'button-tap-custom');
    await card.click();
    // What Home Assistant does once the toggle service call lands: early in the
    // animation, before its peak (scale 1.3 at 400 ms)
    await page.waitForTimeout(100);
    await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
    // Sampled only from the re-render on: the peak must still come
    expect(await sampleMaxScale(page, 800)).toBeGreaterThan(1.15);
    await expectNoErrors(page);
});
