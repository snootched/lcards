/**
 * The shared text-field editor (lcards-text-field-editor): one field's
 * settings, used by the button, elbow and slider text fields and the
 * Astrometrics Studio's labels. It leaves out keys its host's schema does not
 * have, so for the cards every key it knows must resolve (none may vanish),
 * and letter spacing (once missing from the card editors) is there.
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

/** Every key the text-field editor can show */
const KEYS = ['show', 'content', 'display_format', 'position', 'font_family', 'font_weight', 'font_size', 'letter_spacing',
    'anchor', 'baseline', 'text_transform', 'rotation', 'padding', 'background', 'background_padding', 'background_radius',
    'background_width', 'background_min_width', 'color'];

for (const card of ['lcards-button', 'lcards-elbow', 'lcards-slider']) {
    test(`${card}: the text-field editor shows every text key, letter spacing included`, async ({ page }) => {
        await mountCase(page, 'button-lozenge');
        const result = await page.evaluate(async ({ tag, keys }) => {
            const editor = /** @type {any} */ (await customElements.get(tag).getConfigElement());
            editor.hass = /** @type {any} */ (document.querySelector('#mount > *')).hass;
            editor.setConfig({ type: `custom:${tag}`, text: { name: { content: 'NAME' } } });
            document.body.appendChild(editor);
            await editor.updateComplete;
            await customElements.whenDefined('lcards-text-field-editor');
            const missing = keys.filter((k) => !editor._getSchemaForPath(`text.name.${k}`));
            const field = /** @type {any} */ (document.createElement('lcards-text-field-editor'));
            field.editor = editor;
            field.config = editor.config;
            field.basePath = 'text.name';
            field.name = 'name';
            document.body.appendChild(field);
            await field.updateComplete;
            const sections = [...field.shadowRoot.querySelectorAll('lcards-form-section')].map((s) => s.header);
            return { missing, sections };
        }, { tag: card, keys: KEYS });
        expect(result.missing).toEqual([]);
        expect(result.sections).toEqual(expect.arrayContaining(['Font', 'Alignment', 'Padding', 'Background']));
    });
}
