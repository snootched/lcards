/**
 * Alert Studio (lcards-alert-overlay-studio-dialog) and its mock screen
 * (lcards-alert-preview): each condition's alert is built in the frame by the
 * card's own config functions, at the configured size, with its layers; nothing
 * reaches the real screen or the alert mode helper.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Open the studio from the editor (as the Open Alert Studio button does). */
const openStudio = (page, config) => page.evaluate(async (cfg) => {
    const editor = /** @type {any} */ (await customElements.get('lcards-alert-overlay').getConfigElement());
    editor.hass = window.__hass;
    editor.setConfig({ type: 'custom:lcards-alert-overlay', ...cfg });
    document.body.appendChild(editor);
    window.__editorChanges = [];
    editor.addEventListener('config-changed', (e) => window.__editorChanges.push(e.detail.config));
    await editor._openAlertStudio();
    const studio = document.querySelector('lcards-alert-overlay-studio-dialog');
    await studio.updateComplete;
    window.__studio = studio;
    window.__bandDismissOnWindow = 0;
    window.addEventListener('lcards-alert-band-dismiss', () => window.__bandDismissOnWindow++);
}, config);

/** What the mock screen shows now. */
const previewState = (page) => page.evaluate(() => {
    const preview = window.__studio.renderRoot.querySelector('lcards-alert-preview');
    const root = preview.renderRoot;
    const screen = root.querySelector('.screen');
    const content = root.querySelector('.content');
    const child = content?.firstElementChild;
    return {
        tag: child?.tagName.toLowerCase() ?? null,
        widthShare: content && screen ? Math.round((content.offsetWidth / screen.offsetWidth) * 100) : null,
        blur: root.querySelector('.layer-backdrop')?.style.backdropFilter ?? '',
        condition: preview.condition,
    };
});

test('each condition shows on the mock screen; the alert mode is never touched', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await openStudio(page, { width: '40%', conditions: { yellow_alert: { display: 'band' } } });
    await expect.poll(() => previewState(page), { timeout: 10_000 }).toMatchObject({ tag: 'lcards-button', widthShare: 40, condition: 'red_alert' });
    expect((await previewState(page)).blur).toContain('blur');

    // Yellow: a band, without the default blur
    await page.evaluate(() => window.__studio.renderRoot.querySelector('.canvas-toolbar-button[data-condition="yellow_alert"]').click());
    await expect.poll(() => previewState(page)).toMatchObject({ tag: 'lcards-alert-band', condition: 'yellow_alert', blur: '' });
    // opening a condition on the Conditions tab shows it on the preview
    await page.evaluate(async () => {
        window.__studio._activeTab = 'conditions';
        await window.__studio.updateComplete;
        const sections = [...window.__studio.renderRoot.querySelectorAll('.tab-content lcards-form-section[data-condition]')];
        window.__sections = sections.map((x) => [x.dataset.condition, !!x.expanded]);
        const blue = sections.find((x) => x.dataset.condition === 'blue_alert');
        blue.dispatchEvent(new CustomEvent('expanded-changed', { detail: { expanded: true } }));
        await window.__studio.updateComplete;
    });
    expect(await page.evaluate(() => window.__sections)).toEqual([['red_alert', false], ['yellow_alert', false], ['blue_alert', false], ['black_alert', false], ['gray_alert', false]]);
    await expect.poll(() => previewState(page)).toMatchObject({ condition: 'blue_alert' });
    await page.evaluate(() => window.__studio.renderRoot.querySelector('.canvas-toolbar-button[data-condition="yellow_alert"]').click());
    await expect.poll(() => previewState(page)).toMatchObject({ tag: 'lcards-alert-band', condition: 'yellow_alert' });

    // A click on the band symbol dismisses in the preview only: it never reaches the real overlay's listener
    await page.evaluate(() => {
        const band = window.__studio.renderRoot.querySelector('lcards-alert-preview').renderRoot.querySelector('lcards-alert-band');
        band._dismiss();
    });
    expect(await page.evaluate(() => window.__bandDismissOnWindow)).toBe(0);
    await expect.poll(() => previewState(page)).toMatchObject({ tag: null });

    expect(await page.evaluate(() => window.__hass.serviceCalls)).toEqual([]);
    expect(await page.evaluate(() => window.lcards.core.portalOverlayManager.has('alert-overlay'))).toBe(false);
    await expectNoErrors(page);
});

test('an edit in the studio shows in the preview; Save hands the whole config to the card editor, Cancel nothing', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await openStudio(page, {});
    await expect.poll(() => previewState(page), { timeout: 10_000 }).toMatchObject({ tag: 'lcards-button', widthShare: 60 });
    await page.evaluate(() => window.__studio._setConfigValue('width', '30%'));
    await expect.poll(async () => (await previewState(page)).widthShare).toBe(30);
    expect(await page.evaluate(() => window.__editorChanges.length)).toBe(0);
    await page.evaluate(() => window.__studio._handleSave());
    expect(await page.evaluate(() => window.__editorChanges.at(-1)?.width)).toBe('30%');

    await openStudio(page, {});
    await page.evaluate(() => window.__studio._handleCancel());
    expect(await page.evaluate(() => window.__editorChanges.length)).toBe(0);
});

test('closing the studio takes the preview layers down', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await openStudio(page, { layers: { backdrop: { preset: 'blur', amount: '6px' }, color: { preset: 'color-tint', color: 'rgba(255,0,0,0.3)' } } });
    await expect.poll(() => previewState(page), { timeout: 10_000 }).toMatchObject({ tag: 'lcards-button' });
    const layers = await page.evaluate(() => {
        const root = window.__studio.renderRoot.querySelector('lcards-alert-preview').renderRoot;
        const out = { color: root.querySelector('.layer-color').style.background };
        const preview = window.__studio.renderRoot.querySelector('lcards-alert-preview');
        window.__studio.remove();
        return { ...out, after: preview.renderRoot.querySelector('.layer-color').style.background, content: preview.renderRoot.querySelector('.content').childElementCount };
    });
    expect(layers.color).toContain('rgba(255, 0, 0, 0.3)');
    expect(layers.after).toBe('');
    expect(layers.content).toBe(0);
});

for (const preset of ['static', 'pixelate', 'glitch', 'scanlines']) {
    test(`a ${preset} canvas layer draws on the mock screen`, async ({ page }) => {
        await mountCase(page, 'button-lozenge');
        await openStudio(page, { layers: { canvas: { preset, opacity: 0.8 } } });
        await expect.poll(() => previewState(page), { timeout: 10_000 }).toMatchObject({ tag: 'lcards-button' });
        // the canvas presets draw into a <canvas> (a <div> threw "getContext is not a function" every frame)
        await expect.poll(() => page.evaluate(() => {
            const canvas = window.__studio.renderRoot.querySelector('lcards-alert-preview').renderRoot.querySelector('.layer-canvas');
            return { tag: canvas.localName, sized: canvas.width > 1 && canvas.height > 1 };
        }), { timeout: 5_000 }).toEqual({ tag: 'canvas', sized: true });
        await expectNoErrors(page);
    });
}

test('the preview mounts like a card on a fixed screen (the docs live examples)', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    const state = await page.evaluate(async () => {
        await window.lcards.loadAlertPreview();
        const box = Object.assign(document.createElement('div'), { style: 'width: 640px; height: 360px' });
        document.body.appendChild(box);
        const preview = /** @type {any} */ (document.createElement('lcards-alert-preview'));
        Object.assign(preview.style, { width: '100%', height: '100%' });
        preview.setConfig({ type: 'custom:lcards-alert-overlay', width: '50%', layers: { canvas: { preset: 'scanlines', lineHeight: 3 } } });
        preview.hass = window.__hass;
        preview.screenSize = { width: 1280, height: 720 };
        preview.condition = 'blue_alert';
        box.appendChild(preview);
        await new Promise((r) => setTimeout(r, 1500));
        const root = preview.renderRoot;
        return {
            screen: [root.querySelector('.screen').offsetWidth, root.querySelector('.screen').offsetHeight],
            content: root.querySelector('.content').offsetWidth,
            frame: Math.round(root.querySelector('.frame').getBoundingClientRect().width),
            tag: root.querySelector('.content').firstElementChild?.localName,
            canvas: [root.querySelector('.layer-canvas').width, Math.round(root.querySelector('.layer-canvas').getBoundingClientRect().width)],
        };
    });
    // laid out at 1280 x 720 whatever the window, scaled into the 640 px box; 50% is of that screen.
    // The canvas layer draws at the 640 px shown, so its pixel sizes (3 px scanlines) stay real
    // instead of blurring at half size.
    expect(state).toEqual({ screen: [1280, 720], content: 640, frame: 640, tag: 'lcards-button', canvas: [640, 640] });
    expect(await page.evaluate(() => window.__hass.serviceCalls)).toEqual([]);
    await expectNoErrors(page);
});
