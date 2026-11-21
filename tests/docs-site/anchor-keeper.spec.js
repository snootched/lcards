/**
 * A link to a heading keeps it in view while the live examples above it mount and grow
 * (doc/.vitepress/theme/anchor-keeper.ts). lcars-patterns#fleet-tiles sits under dozens of
 * examples: before the fix the heading ended up thousands of px below the window.
 * The reader's own scroll stops it.
 */
import { test, expect } from './support.js';

/** @param {import('@playwright/test').Page} page @param {string} id */
const top = (page, id) => page.evaluate(i => Math.round(document.getElementById(i)?.getBoundingClientRect().top ?? -1e6), id);

test('a linked heading stays in view while the examples above it load', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/getting-started/lcars-patterns#fleet-tiles');
    await page.waitForTimeout(300);
    const first = await top(page, 'fleet-tiles');
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(200);
    // the examples above keep mounting for several seconds
    await page.waitForTimeout(8000);
    expect(Math.abs((await top(page, 'fleet-tiles')) - first)).toBeLessThanOrEqual(2);
});

test('scrolling yourself lets go of the heading', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto('/getting-started/lcars-patterns#fleet-tiles');
    await page.waitForTimeout(500);
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, -3000);
    await page.waitForTimeout(800);
    const after = await page.evaluate(() => scrollY);
    await page.waitForTimeout(6000);
    // the page grows below and above, but nothing scrolls the reader back
    expect(Math.abs((await page.evaluate(() => scrollY)) - after)).toBeLessThan(5);
});
