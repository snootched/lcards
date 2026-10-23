/**
 * Text presets with no `target` run on the card's button group. They must split
 * the <text> inside it, not the group itself: splitting the group replaced the
 * background path with <tspan>s and the button went black (0x0 group).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const snapshot = (card) => card.evaluate((el) => {
    const g = el.shadowRoot.querySelector('[data-button-id]');
    const r = g.getBoundingClientRect();
    return {
        size: `${Math.round(r.width)}x${Math.round(r.height)}`,
        hasBg: !!g.querySelector('.button-bg'),
        text: g.querySelector('text')?.textContent.replace(/\s+/g, ' ').trim(),
    };
});

for (const preset of ['text-scramble', 'text-reveal', 'text-typewriter', 'text-glitch']) {
    test(`${preset} on an untargeted button keeps the button and restores its text`, async ({ page }) => {
        const card = await mountCase(page, 'button-text-preset');
        if (preset !== 'text-scramble') {
            await page.evaluate((p) => {
                const config = JSON.parse(JSON.stringify(window.__card.config));
                config.animations[0].preset = p;
                window.__reconfigure(config);
            }, preset);
            await page.waitForTimeout(300);
        }
        const before = await snapshot(card);
        expect(before.text).toBe('TEXT PRESET');

        await card.click();
        await page.waitForTimeout(150);
        const during = await snapshot(card);
        expect(during.hasBg, 'background path kept').toBe(true);
        const [w, h] = during.size.split('x').map(Number);
        expect(w, 'group not collapsed').toBeGreaterThan(100);
        expect(h, 'group not collapsed').toBeGreaterThan(20);

        await expect.poll(async () => (await snapshot(card)).text, { timeout: 5000 }).toBe('TEXT PRESET');
        expect((await snapshot(card)).hasBg).toBe(true);
        await expectNoErrors(page);
    });
}
