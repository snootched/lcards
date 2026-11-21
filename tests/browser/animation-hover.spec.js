/**
 * on_hover / on_leave on a real pointer (2026-11-19, Live Demo triggers view):
 * - a button whose only job is a hover animation listens for the pointer (it was
 *   decorative by default and never did);
 * - moving across the card's own text and shapes neither starts the loop again nor
 *   stops it (the capture listener also got every child's enter and leave).
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Running instances of one trigger on the mounted card's scope. */
const running = (page, trigger) => page.evaluate((trigger) => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const scope = window.lcards.core.animationManager.scopes.get(`button-${card._cardGuid}`);
    return scope?.runningInstances.get(trigger)?.length ?? 0;
}, trigger);

test('a hover-only button glows while the pointer is on it, once, and stops on leave', async ({ page }) => {
    const card = await mountCase(page, 'button-hover-only');
    const box = await card.boundingBox();
    if (!box) throw new Error('no box');
    await page.mouse.move(box.x - 20, box.y - 20);
    // in at the left, across the label at the right, and back
    await page.mouse.move(box.x + 10, box.y + box.height / 2, { steps: 4 });
    await expect.poll(() => running(page, 'on_hover')).toBe(1);
    await page.mouse.move(box.x + box.width - 12, box.y + box.height - 10, { steps: 12 });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
    await page.waitForTimeout(150);
    expect(await running(page, 'on_hover')).toBe(1);
    // the hand cursor: it is meant to be touched
    expect(await page.evaluate(() => [...document.querySelector('#mount > *').shadowRoot.querySelectorAll('[style*="cursor"]')]
        .map((el) => /** @type {HTMLElement} */ (el).style.cursor))).toContain('pointer');
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 40, { steps: 4 });
    await expect.poll(() => running(page, 'on_hover')).toBe(0);
    await expectNoErrors(page);
});
