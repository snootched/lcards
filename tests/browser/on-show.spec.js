/**
 * on_show animations play each time a card is attached to the page (HA attaches a
 * card when its view opens and whenever a visibility condition shows it), and not
 * again while it stays attached (state changes, re-renders).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Count on_show plays from page start (the first one happens while the card mounts). */
async function countOnShow(page) {
    await page.addInitScript(() => {
        window.__onShowPlays = 0;
        const hook = setInterval(() => {
            const am = window.lcards?.core?.animationManager;
            if (!am) return;
            clearInterval(hook);
            const play = am.playAnimation.bind(am);
            am.playAnimation = (scopeId, animDef, ...rest) => {
                if (animDef?.trigger === 'on_show') window.__onShowPlays++;
                return play(scopeId, animDef, ...rest);
            };
        }, 5);
    });
}

const plays = (page) => page.evaluate(() => window.__onShowPlays);

/** Detach the card and attach it again, as HA does when a visibility condition flips. */
const reattach = (page) => page.evaluate(() => {
    const mount = document.querySelector('#mount');
    const card = mount.firstElementChild;
    card.remove();
    return new Promise(r => setTimeout(() => { mount.appendChild(card); r(); }, 100));
});

for (const name of ['button-on-show', 'elbow-on-show', 'data-grid-on-show', 'msd-on-show']) {
    test(`${name}: plays when attached, again when re-attached, not on state changes`, async ({ page }) => {
        await countOnShow(page);
        await mountCase(page, name);
        await expect.poll(() => plays(page)).toBeGreaterThan(0);
        await page.waitForTimeout(600);
        const afterMount = await plays(page);

        await page.evaluate(() => window.__setState('switch.demo_switch', 'on'));
        await page.evaluate(() => window.__setState('light.demo', 'off'));
        await page.waitForTimeout(600);
        expect(await plays(page), 'state changes must not replay on_show').toBe(afterMount);

        await reattach(page);
        await expect.poll(() => plays(page)).toBeGreaterThan(afterMount);
        await page.waitForTimeout(600);
        const afterReattach = await plays(page);

        await page.evaluate(() => window.__setState('switch.demo_switch', 'off'));
        await page.waitForTimeout(600);
        expect(await plays(page)).toBe(afterReattach);
        await expectNoErrors(page);
    });
}

test('button-on-show: the entrance is visible (starts transparent, ends opaque)', async ({ page }) => {
    await mountCase(page, 'button-on-show');
    await page.waitForTimeout(800);
    const opacity = () => page.locator('lcards-button').evaluate(el => {
        const g = el.shadowRoot.querySelector('[data-overlay-id="button"]');
        return Number(getComputedStyle(g).opacity);
    });
    expect(await opacity()).toBeGreaterThan(0.95);

    await reattach(page);
    // Sampled while the 300 ms fade runs: somewhere below fully opaque.
    const samples = [];
    for (let i = 0; i < 12; i++) { samples.push(await opacity()); await page.waitForTimeout(25); }
    expect(Math.min(...samples)).toBeLessThan(0.9);
    await page.waitForTimeout(500);
    expect(await opacity()).toBeGreaterThan(0.95);
});
