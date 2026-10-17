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
