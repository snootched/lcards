/**
 * Card bugs from the D2 batch 5 (core) docs audit, in the browser.
 *  - rule animations never reached a slider (or a chart) because rules looked
 *    the animation scope up as {type}-{guid}; cards now register their scope
 *  - the slider registered for rules as slider-{id} with only the tag `slider`
 *  - a rule that stopped matching stopped other rules' loops on the same card
 *  - rules never reached an elbow either (its scope looked up as elbow-{guid});
 *    its on_entity_change without its own entity is guarded here too
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Running instances on the card's own animation scope for a trigger. */
const running = (page, trigger) => page.evaluate((t) => {
    const card = /** @type {any} */ (window).__card;
    const scope = window.lcards.core.animationManager.scopes.get(card._getAnimationSetup().overlayId);
    return (scope?.runningInstances.get(t) ?? []).filter((/** @type {any} */ i) => i && !i.completed).length;
}, trigger);

test('a rule animates a slider by its id and its tags', async ({ page }) => {
    await mountCase(page, 'rule-anim-slider');
    await expect.poll(() => running(page, 'on_rule'), { timeout: 10_000 }).toBeGreaterThan(0);
    const reg = await page.evaluate(() => window.lcards.core.systemsManager.getOverlayRegistry().get('rule_slider'));
    expect(reg?.tags).toEqual(['slider', 'deck']);
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await expect.poll(() => running(page, 'on_rule'), { timeout: 10_000 }).toBe(0);
    await expectNoErrors(page);
});

test('one rule stopping leaves another rule\'s loop on the same card running', async ({ page }) => {
    await mountCase(page, 'rule-anim-two-rules');
    await expect.poll(() => running(page, 'on_rule'), { timeout: 10_000 }).toBe(2);
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await expect.poll(() => running(page, 'on_rule'), { timeout: 10_000 }).toBe(1);
    await expectNoErrors(page);
});

test('a rule animates an elbow; its on_entity_change without its own entity plays on a state change', async ({ page }) => {
    await mountCase(page, 'elbow-entity-change');
    await expect.poll(() => running(page, 'on_rule'), { timeout: 10_000 }).toBe(1);
    const before = await running(page, 'on_entity_change');
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await expect.poll(() => running(page, 'on_entity_change'), { timeout: 10_000 }).toBeGreaterThan(before);
    await expectNoErrors(page);
});

test('text fields: x/y without an anchor, and a background box measured with the field\'s font', async ({ page }) => {
    const card = await mountCase(page, 'text-fields-audit', { width: '300', height: '80' });
    const info = await card.evaluate((el) => {
        const root = /** @type {any} */ (el).shadowRoot;
        const texts = [...root.querySelectorAll('text')];
        const xy = texts.find((t) => t.textContent.trim() === 'XY');
        const name = texts.find((t) => t.textContent.includes('WIDE BOLD NAME'));
        const rect = name?.previousElementSibling?.tagName === 'rect' ? name.previousElementSibling : null;
        return {
            anchor: xy?.getAttribute('text-anchor'),
            textWidth: name?.getBBox().width ?? 0,
            bgWidth: Number(rect?.getAttribute('width') ?? 0),
        };
    });
    expect(info.anchor).not.toBe('null');
    // the box holds the bold 20px text (it was sized for a thin Antonio at NaN px)
    expect(info.bgWidth).toBeGreaterThanOrEqual(info.textWidth);
    await expectNoErrors(page);
});

test('a select menu\'s card sounds reach its option buttons', async ({ page }) => {
    await mountCase(page, 'select-menu');
    await page.evaluate(() => window.__reconfigure({ type: 'custom:lcards-select-menu', entity: 'input_select.demo_mode', sounds: { card_tap: 'none' } }));
    await expect.poll(() => page.locator('lcards-select-menu').evaluate((el) =>
        [...el.shadowRoot.querySelectorAll('lcards-button')].map((b) => /** @type {any} */ (b).config?.sounds?.card_tap)
    )).toContain('none');
    await expectNoErrors(page);
});

test('icon_area_background takes a template, and follows the entity', async ({ page }) => {
    const card = await mountCase(page, 'button-icon-area-template', { width: '300', height: '80' });
    const fills = () => card.evaluate((el) => [.../** @type {any} */ (el).shadowRoot.querySelectorAll('[fill]')].map((n) => n.getAttribute('fill')));
    await expect.poll(fills).toContain('#ff0000');
    expect((await fills()).some((f) => f.includes('[[['))).toBe(false);
    await page.evaluate(() => window.__setState('light.demo', 'off'));
    await expect.poll(fills).toContain('#0000ff');
    await expectNoErrors(page);
});

test('text.default wins over a preset\'s field settings and carries anchor', async ({ page }) => {
    const card = await mountCase(page, 'text-default-wins', { width: '300', height: '60' });
    const label = () => card.evaluate((el) => {
        const t = [.../** @type {any} */ (el).shadowRoot.querySelectorAll('text')].find((n) => n.textContent.includes('DECK 7'));
        return t && { anchor: t.getAttribute('text-anchor'), x: Number(t.getAttribute('x')) };
    });
    await expect.poll(label).not.toBeUndefined();
    const l = await label();
    expect(l.anchor).toBe('end');
    expect(l.x).toBeGreaterThan(150); // on the right, not the preset's left
    await expectNoErrors(page);
});

test('an elbow ignores the deprecated preset key', async ({ page }) => {
    await mountCase(page, 'elbow-colour');
    const style = () => page.evaluate(() => JSON.stringify(/** @type {any} */ (window).__card._buttonStyle?.border ?? null));
    const plain = await style();
    const cfg = await page.evaluate(() => /** @type {any} */ (window).__card._rawConfig ?? /** @type {any} */ (window).__card.config);
    await page.evaluate((c) => window.__reconfigure({ ...c, preset: 'lozenge' }), cfg);
    await page.waitForTimeout(500);
    expect(await style()).toBe(plain);
});
