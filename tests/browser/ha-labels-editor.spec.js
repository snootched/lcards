/**
 * The card editors list the Home Assistant labels of the card's entity under Tags
 * (reports/ha-labels-plan.md 1d): read-only chips with the label's name and id, the
 * tooltip saying where the label comes from. Sample labels: tests/helpers/card-env.js.
 */
import { test, expect } from '@playwright/test';
import { mountCase } from './support.js';

/** Mount the button editor for `entity` and read the labels row. */
async function labelsRow(page, entity) {
    return page.evaluate(async (entity) => {
        const editor = /** @type {any} */ (await customElements.get('lcards-button').getConfigElement());
        editor.hass = /** @type {any} */ (document.querySelector('#mount > *')).hass;
        editor.setConfig({ type: 'custom:lcards-button', ...(entity ? { entity } : {}) });
        document.body.appendChild(editor);
        await editor.updateComplete;
        /** @returns {any} */
        const find = (root) => {
            for (const el of root.querySelectorAll('*')) {
                if (el.tagName === 'LCARDS-HA-LABELS') return el;
                const inner = el.shadowRoot && find(el.shadowRoot);
                if (inner) return inner;
            }
            return null;
        };
        // the tags field is in the Card Identification section of the config tab
        let row = null;
        for (let i = 0; i < 50 && !row; i++) { row = find(editor.shadowRoot); if (!row) await new Promise(r => setTimeout(r, 100)); }
        if (!row) return { found: false };
        // label names arrive from config/label_registry/list
        for (let i = 0; i < 30 && !row._registry; i++) await new Promise(r => setTimeout(r, 100));
        await row.updateComplete;
        const chips = [...row.shadowRoot.querySelectorAll('ha-assist-chip')].map((c) => ({ label: c.label, title: c.title, icon: c.querySelector('ha-icon')?.icon ?? null }));
        const text = row.shadowRoot.textContent.replace(/\s+/g, ' ').trim();
        editor.remove();
        return { found: true, chips, text };
    }, entity);
}

test('editor: the entity\'s Home Assistant labels show under Tags, with names, ids and where they come from', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    const lights = await labelsRow(page, 'input_boolean.lcards_test_lights');
    expect(lights.found).toBe(true);
    expect(lights.chips).toEqual([{ label: 'LCARdS Test Crew · lcards_test_crew', title: 'On the entity. In rules: ha_label:lcards_test_crew', icon: 'mdi:account-group' }]);

    const doors = await labelsRow(page, 'input_boolean.lcards_test_doors');
    expect(doors.chips.map((c) => c.title)).toEqual(["On the entity's device. In rules: ha_label:lcards_test_crew"]);

    const power = await labelsRow(page, 'input_number.lcards_test_power');
    expect(power.chips.map((c) => c.label)).toEqual(['LCARdS Test Engine · lcards_test_engine']);
    expect(power.chips[0].title).toContain("entity's area");
});

test('editor: an entity without labels says so; no entity shows nothing', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    const plain = await labelsRow(page, 'switch.demo_switch');
    expect(plain.chips).toEqual([]);
    expect(plain.text).toBe('This entity has no labels in Home Assistant.');
    const none = await labelsRow(page, null);
    expect(none.found ? none.text : '').toBe('');
});
