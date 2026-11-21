/**
 * MSD Studio quick label (the Labelled schematic's leader styles): the
 * toolbar mode, its panel, a click on the part and a click for the label
 * write a label control and its leader line. The geometry and configs are
 * unit-tested in tests/editor/msd-quick-label.test.js; this holds the
 * Studio wiring (clicks to view-box points, the panel, one config change).
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

test.beforeEach(async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await page.evaluate(() => customElements.get('lcards-msd-card').getConfigElement());
});

/** The preview card's <svg>, through the Studio's own lookup */
const svgBox = (page) => page.evaluate(() => {
    const r = window.__msd._getPreviewSvgAndViewBox()?.svg.getBoundingClientRect();
    return r ? { x: r.x, y: r.y, width: r.width, height: r.height } : null;
});

test('MSD Studio quick label: part, then label, in the chosen style', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.evaluate(() => {
        const studio = document.createElement('lcards-msd-studio-dialog');
        studio.hass = window.__hass;
        studio.config = {
            type: 'custom:lcards-msd-card',
            msd: {
                base_svg: { source: 'builtin:enterprise-d-shuttlecraft15-anomaly' },
                view_box: [0, 0, 1000, 500],
                overlays: []
            }
        };
        document.body.appendChild(studio);
        window.__msd = studio;
        return studio.updateComplete;
    });
    await expect.poll(() => svgBox(page), { timeout: 20_000 }).not.toBeNull();
    await expect.poll(async () => (await svgBox(page))?.width ?? 0).toBeGreaterThan(100);

    // The toolbar button enters the mode; the panel shows with the guessed style (classic: no labels yet).
    await page.evaluate(async () => {
        const toggle = window.__msd.renderRoot.querySelector('.canvas-toolbar-toggle');
        if (toggle) { toggle.click(); await window.__msd.updateComplete; }
        window.__msd.renderRoot.querySelector('.canvas-toolbar-button[title^="Quick label"]').click();
    });
    await expect.poll(() => page.evaluate(() => window.__msd._activeMode)).toBe('quick_label');
    const panel = page.locator('lcards-msd-studio-dialog .quick-label-panel');
    await expect(panel).toBeVisible();
    expect(await page.evaluate(() => window.__msd._quickLabelState.style)).toBe('classic');
    // No labels yet: Medium (13/500 of the drawing's width).
    expect(await page.evaluate(() => window.__msd._quickLabelState.size)).toBe('medium');

    // Choose Picard tight in the panel; a click in the panel is not a canvas click.
    await panel.locator('ha-button', { hasText: 'Picard tight' }).click();
    expect(await page.evaluate(() => [window.__msd._quickLabelState.style, window.__msd._quickLabelState.targetPoint])).toEqual(['picard', null]);
    await page.evaluate(() => { window.__msd._quickLabelState = { ...window.__msd._quickLabelState, text: 'WARP CORE' }; });

    // Part at view-box (600, 250), label to its left at (200, 100).
    const box = await svgBox(page);
    const at = (vx, vy) => {
        const s = Math.max(1000 / box.width, 500 / box.height);
        const ox = (box.width - 1000 / s) / 2;
        const oy = (box.height - 500 / s) / 2;
        return [box.x + ox + vx / s, box.y + oy + vy / s];
    };
    await page.mouse.click(...at(600, 250));
    const picked = await page.evaluate(() => window.__msd._quickLabelState.targetPoint);
    expect(Math.abs(picked[0] - 600)).toBeLessThan(3);
    expect(Math.abs(picked[1] - 250)).toBeLessThan(3);
    await page.mouse.move(...at(300, 120));
    const dashed = page.locator('lcards-msd-studio-dialog line[stroke-dasharray="5,5"]');
    await expect(dashed).toHaveCount(1);
    expect(await dashed.evaluate((l) => l instanceof SVGLineElement && l.getBoundingClientRect().width > 0)).toBe(true);
    await page.mouse.click(...at(200, 100));

    const overlays = await page.evaluate(() => window.__msd._workingConfig.msd.overlays);
    expect(overlays.map(o => [o.id, o.type])).toEqual([['lbl_1', 'control'], ['ln_1', 'line']]);
    const [label, line] = overlays;
    expect(label.card.text.label.content).toBe('WARP CORE');
    expect(label.card.text.label.position).toBe('center-right');
    expect(label.attachment).toBe('right');
    expect(line.anchor).toBe('lbl_1');
    expect(line.anchor_side).toBe('right');
    expect(line.corner_radius).toBe(20); // Medium: 10 x 1000 / 500
    expect(label.card.text.label.font_size).toBe(26);
    expect(Math.abs(line.attach_to[0] - 600)).toBeLessThan(3);

    // The mode stays on for the next label, its style kept.
    expect(await page.evaluate(() => [window.__msd._activeMode, window.__msd._quickLabelState.style, window.__msd._quickLabelState.targetPoint])).toEqual(['quick_label', 'picard', null]);

    // The panel drags by its header and stays inside the preview.
    const handle = panel.locator('.quick-label-handle');
    const before = await panel.boundingBox();
    const h = await handle.boundingBox();
    await page.mouse.move(h.x + 20, h.y + h.height / 2);
    await page.mouse.down();
    await page.mouse.move(h.x + 220, h.y + h.height / 2 - 150, { steps: 5 });
    await page.mouse.up();
    const after = await panel.boundingBox();
    expect(Math.round(after.x - before.x)).toBe(200);
    expect(Math.round(after.y - before.y)).toBe(-150);
    // Dragging the panel placed nothing.
    expect(await page.evaluate(() => [window.__msd._workingConfig.msd.overlays.length, window.__msd._quickLabelState.targetPoint])).toEqual([2, null]);

    // Esc while placing a label (part picked, focus in the panel's text field).
    await page.mouse.click(...at(600, 250));
    expect(await page.evaluate(() => window.__msd._quickLabelState.targetPoint)).not.toBeNull();
    // Esc typed in the panel's text field (the harness has no real ha-input, so the
    // key is sent from it: the Studio's handler skips keys from inputs except this one)
    // leaves the mode at once, the half-placed label dropped, as in the other modes.
    await panel.locator('ha-input').first().evaluate((el) => {
        el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true }));
    });
    await expect.poll(() => page.evaluate(() => [window.__msd._activeMode, window.__msd._quickLabelState.targetPoint])).toEqual(['view', null]);

    // The X closes it too.
    await page.evaluate(() => window.__msd._setMode('quick_label'));
    await panel.locator('.quick-label-close').click();
    await expect.poll(() => page.evaluate(() => window.__msd._activeMode)).toBe('view');
    await expect(panel).toHaveCount(0);
});

test('MSD Studio quick label: snaps to an anchor; copied style for new labels and pasted onto others', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.evaluate(() => {
        const studio = document.createElement('lcards-msd-studio-dialog');
        studio.hass = window.__hass;
        studio.config = {
            type: 'custom:lcards-msd-card',
            msd: {
                base_svg: { source: 'builtin:enterprise-d-shuttlecraft15-anomaly' },
                view_box: [0, 0, 1000, 500],
                anchors: { warp_core: [600, 250] },
                overlays: []
            }
        };
        document.body.appendChild(studio);
        window.__msd = studio;
        return studio.updateComplete;
    });
    await expect.poll(async () => (await svgBox(page))?.width ?? 0, { timeout: 20_000 }).toBeGreaterThan(100);
    await page.evaluate(() => window.__msd._setMode('quick_label'));
    // Measure once the preview has stopped moving (layout settles under load).
    let box = await svgBox(page);
    await expect.poll(async () => {
        const next = await svgBox(page);
        const still = JSON.stringify(next) === JSON.stringify(box);
        box = next;
        return still;
    }, { intervals: [200] }).toBe(true);
    const at = (vx, vy) => {
        const s = Math.max(1000 / box.width, 500 / box.height);
        return [box.x + (box.width - 1000 / s) / 2 + vx / s, box.y + (box.height - 500 / s) / 2 + vy / s];
    };
    const ring = page.locator('lcards-msd-studio-dialog circle.quick-label-snap');

    // Near the anchor: a ring shows, the click joins the line to it by name.
    await page.mouse.move(...at(606, 254));
    await expect(ring).toHaveCount(1);
    // Drawn as SVG (an html`` circle inside the <svg> exists but never paints), on the anchor.
    const drawn = await ring.evaluate((c) => { const r = c.getBoundingClientRect(); return { svg: c instanceof SVGCircleElement, x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }; });
    expect(drawn.svg).toBe(true);
    expect(drawn.w).toBeGreaterThan(10);
    const [ax, ay] = at(600, 250);
    expect(Math.abs(drawn.x - ax)).toBeLessThan(2);
    expect(Math.abs(drawn.y - ay)).toBeLessThan(2);
    await page.mouse.click(...at(606, 254));
    expect(await page.evaluate(() => [window.__msd._quickLabelState.target, window.__msd._quickLabelState.targetPoint])).toEqual(['warp_core', [600, 250]]);
    await page.mouse.click(...at(300, 120));
    let overlays = await page.evaluate(() => window.__msd._workingConfig.msd.overlays);
    expect(overlays[1].attach_to).toBe('warp_core');

    // Out of reach, or with Alt held: a plain point.
    await page.mouse.move(...at(800, 400));
    await expect(ring).toHaveCount(0);
    await page.keyboard.down('Alt');
    await page.mouse.click(...at(604, 252));
    await page.keyboard.up('Alt');
    expect(await page.evaluate(() => typeof window.__msd._quickLabelState.target)).toBe('object');
    // The label lines up with the first one's row (guide shown), within reach.
    const firstY = overlays[0].position[1];
    await page.mouse.move(...at(300, firstY + 3));
    await expect(page.locator('lcards-msd-studio-dialog line.quick-label-guide')).not.toHaveCount(0);
    expect(await page.locator('lcards-msd-studio-dialog line.quick-label-guide').first().evaluate((l) => l instanceof SVGLineElement)).toBe(true);
    await page.mouse.click(...at(300, firstY + 3));
    overlays = await page.evaluate(() => window.__msd._workingConfig.msd.overlays);
    expect(overlays[2].position[1]).toBe(firstY);

    // Restyle the first label by hand, copy it: the panel offers the copied style.
    await page.evaluate(() => {
        const ov = structuredClone(window.__msd._workingConfig.msd.overlays);
        ov[0].card.text.label.color = 'theme:colors.ui.primary';
        ov[1].style.color = 'theme:colors.ui.primary';
        window.__msd._setNestedValue('msd.overlays', ov);
        window.__msd._copyOverlayStyle(ov[0]);
    });
    const copied = page.locator('lcards-msd-studio-dialog .quick-label-panel ha-button', { hasText: 'Copied style' });
    await copied.click();
    await page.mouse.click(...at(900, 300));
    await page.mouse.click(...at(750, 420));
    overlays = await page.evaluate(() => window.__msd._workingConfig.msd.overlays);
    expect(overlays[4].card.text.label.color).toBe('theme:colors.ui.primary');
    expect(overlays[5].style.color).toBe('theme:colors.ui.primary');
    expect(overlays[5].anchor_side).toBe('right');

    // Paste to all labels: the second one picks it up, its text and place kept.
    await page.evaluate(() => window.__msd._pasteOverlayStyle(['lbl_2']));
    overlays = await page.evaluate(() => window.__msd._workingConfig.msd.overlays);
    expect(overlays[2].card.text.label.color).toBe('theme:colors.ui.primary');
    expect(overlays[3].style.color).toBe('theme:colors.ui.primary');
    expect(overlays[2].position[1]).toBe(firstY);
});

test('MSD Studio quick label with the Attachment Points overlay on: dots pick the part, Esc cancels', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.evaluate(() => {
        const studio = document.createElement('lcards-msd-studio-dialog');
        studio.hass = window.__hass;
        studio.config = {
            type: 'custom:lcards-msd-card',
            msd: {
                base_svg: { source: 'builtin:enterprise-d-shuttlecraft15-anomaly' },
                view_box: [0, 0, 1000, 500],
                anchors: { warp_core: [600, 250] },
                overlays: [
                    { id: 'slider', type: 'control', position: [800, 150], size: [80, 40], attachment: 'right', card: { type: 'custom:lcards-slider' } }
                ]
            }
        };
        document.body.appendChild(studio);
        window.__msd = studio;
        return studio.updateComplete;
    });
    await expect.poll(async () => (await svgBox(page))?.width ?? 0, { timeout: 20_000 }).toBeGreaterThan(100);
    await page.evaluate(async () => {
        window.__msd._showAttachmentPoints = true;
        await window.__msd._setMode('quick_label');
        await window.__msd.updateComplete;
    });
    const state = () => page.evaluate(() => ({ mode: window.__msd._activeMode, ...window.__msd._quickLabelState, connect: window.__msd._connectLineState.source }));
    const dot = (id, point) => page.locator(`lcards-msd-studio-dialog .attachment-point[data-connection-id="${id}"][data-connection-point="${point}"]`);

    // The slider's top dot: the part, by name and side (the slider sits right-attached: its box is 720-800).
    await dot('slider', 'top').click();
    let s = await state();
    expect([s.target, s.targetSide, s.targetPoint, s.connect]).toEqual(['slider', 'top', [760, 130], null]);

    // Esc while placing: the half-placed label is dropped and the mode left, as in the other modes.
    await page.keyboard.press('Escape');
    s = await state();
    expect([s.mode, s.targetPoint]).toEqual(['view', null]);
    await page.evaluate(() => window.__msd._setMode('quick_label'));

    // The anchor's dot, then a label spot on the drawing.
    await dot('warp_core', 'center').click();
    expect((await state()).target).toBe('warp_core');
    const box = await svgBox(page);
    const sc = Math.max(1000 / box.width, 500 / box.height);
    await page.mouse.click(box.x + (box.width - 1000 / sc) / 2 + 300 / sc, box.y + (box.height - 500 / sc) / 2 + 400 / sc);
    const overlays = await page.evaluate(() => window.__msd._workingConfig.msd.overlays);
    const line = overlays.find(o => o.type === 'line');
    expect([line.attach_to, line.attach_side]).toEqual(['warp_core', 'center']);
    expect((await state()).connect).toBeNull();

    // Esc with nothing picked leaves the mode too.
    await page.keyboard.press('Escape');
    expect((await state()).mode).toBe('view');
});
