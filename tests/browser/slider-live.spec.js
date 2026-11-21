/**
 * Live update (control.live_update; 2026-11-19, idea from the Hue-like light card):
 * a light follows a dragged slider, one call at a time and no more than five a
 * second, the release value sent last; any other domain is set once, on release.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Drag the slider's track from 20 % to 85 % of its width over about a second. */
async function drag(page, card) {
    const input = card.locator('.slider-input-overlay');
    const box = await input.boundingBox();
    if (!box) throw new Error('no slider input');
    const y = box.y + box.height / 2;
    await page.mouse.move(box.x + box.width * 0.2, y);
    await page.mouse.down();
    const callsAtStart = await calls(page);
    for (let i = 1; i <= 20; i++) {
        await page.mouse.move(box.x + box.width * (0.2 + 0.65 * i / 20), y);
        await page.waitForTimeout(50);
    }
    const duringDrag = (await calls(page)) - callsAtStart;
    await page.mouse.up();
    return { callsAtStart, duringDrag };
}

const calls = (page) => page.evaluate(() => window.__hass.serviceCalls.length);

test('a light follows the dragged slider: several calls while dragging, never a flood, the release value last', async ({ page }) => {
    const card = await mountCase(page, 'slider-live-light');
    const { callsAtStart, duringDrag } = await drag(page, card);
    // about a second of dragging: at most one call per 200 ms (plus the first at once)
    expect(duringDrag).toBeGreaterThanOrEqual(2);
    expect(duringDrag).toBeLessThanOrEqual(7);
    await page.waitForTimeout(400);
    const sent = await page.evaluate((from) => window.__hass.serviceCalls.slice(from), callsAtStart);
    expect(sent.every((c) => c.domain === 'light')).toBe(true);
    const final = await card.evaluate((el) => /** @type {any} */ (el)._sliderValue);
    const last = sent.at(-1)?.data;
    // the slider is in percent, the light takes brightness 0-255
    expect(last?.brightness).toBeDefined();
    expect(Math.abs(last.brightness / 2.55 - final)).toBeLessThanOrEqual(1);
    await expectNoErrors(page);
});

test('any other domain is set once, when the slider is let go', async ({ page }) => {
    const card = await mountCase(page, 'slider-live-number');
    const { callsAtStart, duringDrag } = await drag(page, card);
    expect(duringDrag).toBe(0);
    await page.waitForTimeout(300);
    expect((await calls(page)) - callsAtStart).toBe(1);
    await expectNoErrors(page);
});
