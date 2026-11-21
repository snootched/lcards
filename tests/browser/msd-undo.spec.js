/**
 * MSD Studio undo and redo (the shared studio-history.js, as the Astrometrics
 * Studio): steps come from snapshots of the working config, so in-place edits
 * count too; changes to the same keys in a row (a drag, typing) merge; Ctrl+Z,
 * Ctrl+Shift+Z / Ctrl+Y and the footer buttons; nothing while a form is open.
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

test.beforeEach(async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await page.evaluate(() => customElements.get('lcards-msd-card').getConfigElement());
    await page.evaluate(() => {
        const studio = document.createElement('lcards-msd-studio-dialog');
        studio.hass = window.__hass;
        studio.config = {
            type: 'custom:lcards-msd-card',
            msd: { base_svg: { source: 'builtin:enterprise-d-shuttlecraft15-anomaly' }, view_box: [0, 0, 1000, 500], overlays: [] }
        };
        document.body.appendChild(studio);
        window.__msd = studio;
        return studio.updateComplete;
    });
});

const overlays = (page) => page.evaluate(() => (window.__msd._workingConfig.msd.overlays || []).map(o => o.id));
const can = (page) => page.evaluate(() => [window.__msd._history.canUndo, window.__msd._history.canRedo]);
/** Wait until the Studio has taken its snapshot of the change (it checks at most every 400 ms after a render, later while the page is busy). */
const settle = (page) => expect.poll(() => page.evaluate(() => window.__msd._historyBase === JSON.stringify(window.__msd._workingConfig)), { timeout: 5000 }).toBe(true);

test('MSD Studio undo and redo: keys, buttons, in-place edits, merged drags, forms', async ({ page }) => {
    expect(await can(page)).toEqual([false, false]);

    // A change through _setNestedValue, then one made in place (the Studio does both).
    await page.evaluate(() => window.__msd._setNestedValue('msd.overlays', [{ id: 'lbl_1', type: 'control', position: [100, 100], size: [100, 40], card: { type: 'custom:lcards-button', preset: 'text-only' } }]));
    await settle(page);
    await page.evaluate(() => { window.__msd._workingConfig.msd.anchors = { warp_core: [600, 250] }; window.__msd.requestUpdate(); });
    await settle(page);
    expect(await can(page)).toEqual([true, false]);

    // Ctrl+Z: the anchor goes; again: the label goes.
    await page.keyboard.press('Control+z');
    expect(await page.evaluate(() => window.__msd._workingConfig.msd.anchors)).toBeUndefined();
    expect(await overlays(page)).toEqual(['lbl_1']);
    await page.keyboard.press('Control+z');
    expect(await overlays(page)).toEqual([]);
    expect(await can(page)).toEqual([false, true]);

    // Ctrl+Shift+Z and Ctrl+Y redo.
    await page.keyboard.press('Control+Shift+z');
    expect(await overlays(page)).toEqual(['lbl_1']);
    await page.keyboard.press('Control+y');
    expect(await page.evaluate(() => window.__msd._workingConfig.msd.anchors)).toEqual({ warp_core: [600, 250] });

    // A drag: the same position changed many times in a row is one step.
    for (let i = 1; i <= 8; i++) {
        await page.evaluate((x) => { window.__msd._workingConfig.msd.overlays[0].position = [100 + x * 10, 100]; window.__msd.requestUpdate(); }, i);
        await page.waitForTimeout(120);
    }
    await settle(page);
    expect(await page.evaluate(() => window.__msd._workingConfig.msd.overlays[0].position)).toEqual([180, 100]);
    await page.keyboard.press('Control+z');
    expect(await page.evaluate(() => window.__msd._workingConfig.msd.overlays[0].position)).toEqual([100, 100]);

    // A new change drops the redo steps.
    await page.evaluate(() => window.__msd._setNestedValue('msd.overlays', []));
    await settle(page);
    expect((await can(page))[1]).toBe(false);

    // The footer buttons do the same; both off while a form is open.
    const undoBtn = page.locator('lcards-msd-studio-dialog ha-button.history-undo');
    const redoBtn = page.locator('lcards-msd-studio-dialog ha-button.history-redo');
    await undoBtn.click();
    expect(await overlays(page)).toEqual(['lbl_1']);
    await expect(redoBtn).not.toHaveAttribute('disabled');
    await redoBtn.click();
    expect(await overlays(page)).toEqual([]);
    await page.evaluate(async () => { window.__msd._showLineForm = true; await window.__msd.updateComplete; });
    await expect(undoBtn).toHaveAttribute('disabled');
    await page.keyboard.press('Control+z');
    expect(await overlays(page)).toEqual([]);
});

test('MSD Studio undo: a quick label placed in the tool is one step, and the tool is left', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await expect.poll(() => page.evaluate(() => window.__msd._getPreviewSvgAndViewBox()?.svg.getBoundingClientRect().width ?? 0), { timeout: 20_000 }).toBeGreaterThan(100);
    await page.evaluate(() => window.__msd._setMode('quick_label'));
    const box = await page.evaluate(() => { const r = window.__msd._getPreviewSvgAndViewBox().svg.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
    const s = Math.max(1000 / box.width, 500 / box.height);
    const at = (vx, vy) => [box.x + (box.width - 1000 / s) / 2 + vx / s, box.y + (box.height - 500 / s) / 2 + vy / s];
    await page.mouse.click(...at(600, 250));
    await page.mouse.click(...at(300, 120));
    expect(await overlays(page)).toEqual(['lbl_1', 'ln_1']);
    await settle(page);
    // Pick the next part, then undo: the label and its line go in one step and the tool is left.
    await page.mouse.click(...at(700, 300));
    await page.keyboard.press('Control+z');
    expect(await overlays(page)).toEqual([]);
    expect(await page.evaluate(() => [window.__msd._activeMode, window.__msd._quickLabelState.targetPoint])).toEqual(['view', null]);
});
