/**
 * Cards on astrometrics points (E4): an always card is mounted next to its
 * point and gets hass (a state change reaches it); a tap card opens on a tap
 * on its point (selecting it), closes on a blank tap and on Escape; a card
 * whose point goes behind a sphere hides; keys typed in a card do not move
 * the camera.
 */
import { test, expect } from '@playwright/test';
import { mountCase, cardErrors } from './support.js';

const sceneState = (page) => page.evaluate(() => {
    const s = /** @type {any} */ (document.querySelector('#mount > *'))?._scene?.debug();
    return s ? { ready: s.ready, frames: s.frames, keys: s.keys } : null;
});

async function sceneReady(page) {
    await expect.poll(async () => (await sceneState(page))?.ready && (await sceneState(page)).frames > 0, { timeout: 15_000 }).toBe(true);
}

const pointOnPage = (page, id) => page.evaluate((pid) => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const it = card._scene.debug().labelItems.find((l) => l.id === pid);
    const r = card.renderRoot.querySelector('.astro-scene').getBoundingClientRect();
    return it?.visible ? { x: r.left + it.sx, y: r.top + it.sy } : null;
}, id);

/** A point card's box: opacity, page rect, and whether it holds a mounted card */
const cardBox = (page, id) => page.evaluate((pid) => {
    const card = /** @type {any} */ (document.querySelector('#mount > *'));
    const el = card.renderRoot.querySelector(`.astro-pin[data-id="${pid}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { opacity: Number(el.style.opacity), x: r.left, y: r.top, w: r.width, mounted: !!el.querySelector('lcards-button') };
}, id);

test('an always card sits next to its point and follows hass', async ({ page }) => {
    await mountCase(page, 'astro-cards', { width: '800' });
    await sceneReady(page);
    await expect.poll(async () => (await cardBox(page, 'bridge'))?.opacity).toBe(1);
    const p = await pointOnPage(page, 'bridge');
    const box = await cardBox(page, 'bridge');
    expect(box.mounted).toBe(true);
    expect(box.w).toBe(160);
    // bottom-right of the point
    expect(box.x).toBeGreaterThan(p.x);
    expect(box.y).toBeGreaterThan(p.y);
    const stateOf = () => page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        return card.renderRoot.querySelector('.astro-pin[data-id="bridge"] lcards-button').hass?.states['light.demo']?.state;
    });
    expect(await stateOf()).toBe('on');
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await expect.poll(stateOf).toBe('off');
    expect(await cardErrors(page)).toEqual([]);
});

test('a tap card opens on a tap on its point, closes on a blank tap and on Escape', async ({ page }) => {
    await mountCase(page, 'astro-cards', { width: '800' });
    await sceneReady(page);
    // built only when first opened
    expect((await cardBox(page, 'eng'))?.mounted ?? false).toBe(false);
    const p = await pointOnPage(page, 'eng');
    await page.mouse.click(p.x, p.y);
    await expect.poll(async () => (await cardBox(page, 'eng'))?.opacity).toBe(1);
    expect((await cardBox(page, 'eng')).mounted).toBe(true);
    // selected, and the camera did not fly
    expect(await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.debug().labelItems.find((l) => l.id === 'eng').selected)).toBe(true);
    expect(Math.round((await sceneState(page)).keys.tx)).toBe(0);
    // a blank tap closes it
    const r = await page.locator('lcards-astrometrics-card .astro-scene').boundingBox();
    await page.mouse.click(r.x + 400, r.y + 380);
    await expect.poll(async () => (await cardBox(page, 'eng')).opacity).toBe(0);
    // open again, Escape closes it
    await page.mouse.click(p.x, p.y);
    await expect.poll(async () => (await cardBox(page, 'eng')).opacity).toBe(1);
    await page.locator('lcards-astrometrics-card .astro-scene').focus();
    await page.keyboard.press('Escape');
    await expect.poll(async () => (await cardBox(page, 'eng')).opacity).toBe(0);
    expect(await page.evaluate(() => window.__hass.serviceCalls)).toEqual([]);
    expect(await cardErrors(page)).toEqual([]);
});

test('a card whose point is behind a sphere hides; keys typed in a card are not camera keys', async ({ page }) => {
    await mountCase(page, 'astro-cards', { width: '800' });
    await sceneReady(page);
    await expect.poll(async () => (await cardBox(page, 'deep'))?.opacity).toBe(1);
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('side', { duration: 0 }));
    await expect.poll(async () => (await cardBox(page, 'deep')).opacity).toBe(0);
    await page.evaluate(() => /** @type {any} */ (document.querySelector('#mount > *'))._scene.flyTo('top', { duration: 0 }));
    await expect.poll(async () => (await cardBox(page, 'bridge')).opacity).toBe(1);
    const before = (await sceneState(page)).keys;
    await page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const btn = card.renderRoot.querySelector('.astro-pin[data-id="bridge"] lcards-button');
        btn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, composed: true }));
        btn.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft', bubbles: true, composed: true }));
    });
    await page.waitForTimeout(300);
    expect((await sceneState(page)).keys.tx).toBe(before.tx);
    expect(await cardErrors(page)).toEqual([]);
});

test('point-card actions, fly-to point_card, a fixed height and a leader (F2)', async ({ page }) => {
    await mountCase(page, 'astro-cards', { width: '800' });
    await sceneReady(page);
    const eng = () => page.evaluate(() => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        const el = card.renderRoot.querySelector('.astro-pin[data-id="eng"]');
        const line = card.renderRoot.querySelector('.astro-leaders line[data-id="eng"]');
        const s = card._scene.debug();
        return {
            opacity: el ? Number(el.style.opacity) : 0,
            height: el?.getBoundingClientRect().height ?? 0,
            line: line ? { opacity: Number(line.style.opacity), x1: Number(line.getAttribute('x1')), x2: Number(line.getAttribute('x2')), stroke: line.style.stroke } : null,
            selected: s.selected ?? null
        };
    });
    const run = (action) => page.evaluate((a) => {
        const card = /** @type {any} */ (document.querySelector('#mount > *'));
        card._actionHandler.runAction(a, card.hass, card);
    }, action);
    // the action from any card (by the astrometrics card's id): open
    await run({ action: 'point-card', card: 'astro_cards', point: 'eng', point_card: 'open' });
    await expect.poll(async () => (await eng()).opacity).toBe(1);
    const open = await eng();
    expect(open.height).toBe(60);
    // the leader: from beside the point (x 460 on an 800 px top view) to the card on its right
    expect(open.line?.opacity).toBe(1);
    expect(open.line.x2).toBeGreaterThan(open.line.x1);
    expect(open.line.stroke).not.toBe('');
    // open again: stays open; toggle closes; close on a closed card does nothing
    await run({ action: 'point-card', card: 'astro_cards', point: 'eng', point_card: 'open' });
    await page.waitForTimeout(200);
    expect((await eng()).opacity).toBe(1);
    await run({ action: 'point-card', card: 'astro_cards', point: 'eng' });
    await expect.poll(async () => (await eng()).opacity).toBe(0);
    expect((await eng()).line.opacity).toBe(0);
    await run({ action: 'point-card', card: 'astro_cards', point: 'eng', point_card: 'close' });
    await page.waitForTimeout(200);
    expect((await eng()).opacity).toBe(0);
    // fly-to with point_card: open
    await run({ action: 'fly-to', card: 'astro_cards', point: 'eng', point_card: 'open', duration: 0 });
    await expect.poll(async () => (await eng()).opacity).toBe(1);
    await page.locator('#mount').screenshot({ path: process.env.CARD_SHOT ?? 'tmp/astro-cards-leader.png' });
    expect(await cardErrors(page)).toEqual([]);
});
