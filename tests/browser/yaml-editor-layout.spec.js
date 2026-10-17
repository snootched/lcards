/**
 * The YAML editor's popups (completion, hover) live in a zero-size host out of the
 * layout flow. CodeMirror gives its popup container the editor's theme class, and
 * that theme sets a height (up to 600px): while the container sat in the editor's
 * flex column it took that height and squeezed the code area to a sliver (Layout
 * Studio's YAML tab, 2026-10).
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

const YAML = ['type: custom:lcards-layout-card', 'layout:', '  grid-gap: 6px', 'cards:',
    ...Array.from({ length: 20 }, (_, i) => [`  - type: custom:lcards-button`, `    preset: filled`, `    name: B${i}`]).flat()].join('\n');

test('the code area gets the editor height; the popup host takes none', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    const sizes = await page.evaluate(async (yaml) => {
        await customElements.get('lcards-button').getConfigElement(); // loads the editor chunk
        await customElements.whenDefined('lcards-yaml-editor');
        const host = document.createElement('div');
        host.style.cssText = 'display: flex; flex-direction: column; height: 700px; width: 600px;';
        const editor = document.createElement('lcards-yaml-editor');
        editor.style.cssText = 'flex: 1; min-height: 0;';
        editor.value = yaml;
        host.appendChild(editor);
        document.body.appendChild(host);
        await new Promise(r => setTimeout(r, 1000));
        const root = editor.shadowRoot;
        const h = (sel) => root.querySelector(sel)?.getBoundingClientRect().height ?? -1;
        return { body: h('.editor-body'), code: h('.editor-container'), tooltipHost: h('.tooltip-host') };
    }, YAML);
    expect(sizes.code).toBeGreaterThanOrEqual(400);
    // The code area fits inside its row instead of overflowing a squeezed one.
    expect(sizes.body).toBeGreaterThanOrEqual(sizes.code);
    expect(sizes.tooltipHost).toBe(0);
});

// Maximize covers the window even inside a container that makes position: fixed
// relative to itself (a transformed dialog: HA's own edit-card dialog, every studio),
// and the code area is no longer held to its normal 600px cap.
test('maximize fills the window from inside a transformed container', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 1000 });
    await mountCase(page, 'button-lozenge');
    const sizes = await page.evaluate(async (yaml) => {
        await customElements.get('lcards-button').getConfigElement();
        await customElements.whenDefined('lcards-yaml-editor');
        const box = document.createElement('div');
        box.style.cssText = 'position: absolute; left: 300px; top: 200px; width: 500px; height: 500px; transform: translateZ(0);';
        const editor = document.createElement('lcards-yaml-editor');
        editor.value = yaml;
        box.appendChild(editor);
        document.body.appendChild(box);
        await new Promise(r => setTimeout(r, 800));
        editor._toggleMaximize();
        await new Promise(r => setTimeout(r, 400));
        const r = editor.getBoundingClientRect();
        const code = editor.shadowRoot.querySelector('.cm-editor').getBoundingClientRect();
        const result = { box: [r.left, r.top, r.width, r.height], code: code.height };
        editor._toggleMaximize();
        result.restored = editor.getBoundingClientRect().width;
        return result;
    }, YAML);
    expect(sizes.box).toEqual([0, 0, 1200, 1000]);
    expect(sizes.code).toBeGreaterThan(800);
    expect(sizes.restored).toBe(500); // back inside its container
});

// CodeMirror draws its search panel's fields and buttons at 70% (labels 80%) of the
// editor font; ours are full size, matching the code.
test('the search panel (Ctrl+F) uses the editor font size', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await page.evaluate(async (yaml) => {
        await customElements.get('lcards-button').getConfigElement();
        await customElements.whenDefined('lcards-yaml-editor');
        const editor = document.createElement('lcards-yaml-editor');
        editor.id = 'yaml-under-test';
        editor.value = yaml;
        document.body.appendChild(editor);
        await new Promise(r => setTimeout(r, 800));
    }, YAML);
    await page.locator('#yaml-under-test .cm-content').click();
    await page.keyboard.press('Control+f');
    const sizes = await page.locator('#yaml-under-test').evaluate((el) => {
        const panel = el.shadowRoot.querySelector('.cm-search');
        const size = (sel) => getComputedStyle(panel.querySelector(sel)).fontSize;
        return { field: size('.cm-textfield'), button: size('.cm-button'), label: size('label') };
    });
    expect(sizes).toEqual({ field: '14px', button: '14px', label: '14px' });
});

// The "Options here" panel opens in every editor (discoverability). Hiding it used to be
// remembered for all editors in localStorage; it is now per editor, and the old
// setting is cleared.
test('the options panel shows in every editor, even after it was hidden before', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('lcards-yaml-options-panel', '0'));
    await mountCase(page, 'button-lozenge');
    const state = await page.evaluate(async () => {
        await customElements.get('lcards-button').getConfigElement();
        await customElements.whenDefined('lcards-yaml-editor');
        const schema = { type: 'object', properties: { name: { type: 'string', description: 'A name' } } };
        const make = async () => {
            const editor = document.createElement('lcards-yaml-editor');
            editor.schema = schema;
            editor.value = 'name: x\n';
            document.body.appendChild(editor);
            await new Promise(r => setTimeout(r, 600));
            return editor;
        };
        const panel = (e) => !!e.shadowRoot.querySelector('lcards-yaml-options-panel');
        const first = await make();
        const shownFirst = panel(first);
        first._toggleOptions();
        await first.updateComplete;
        const hiddenAfterToggle = !panel(first);
        const second = await make();
        return { shownFirst, hiddenAfterToggle, shownSecond: panel(second), stored: localStorage.getItem('lcards-yaml-options-panel') };
    });
    expect(state).toEqual({ shownFirst: true, hiddenAfterToggle: true, shownSecond: true, stored: null });
});
