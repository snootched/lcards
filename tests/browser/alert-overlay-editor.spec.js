/**
 * Alert overlay editor (backlog clean-up (2), 2026-11-05): its static fields render
 * through FormField from the card schema. Every converted path must resolve in the
 * schema (FormField shows a "No schema found" warning otherwise), the labels stay,
 * and a change writes the config key, a blank removes it.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

const CONFIG = {
    type: 'custom:lcards-alert-overlay',
    dismiss_mode: 'auto-dismiss',
    auto_dismiss_seconds: 10,
    display: 'band',
    conditions: { red_alert: { width: '300px' } },
};

test('every field resolves in the schema; a change writes the key, a blank removes it', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    const result = await page.evaluate(async (config) => {
        const editor = /** @type {any} */ (await customElements.get('lcards-alert-overlay').getConfigElement());
        editor.hass = window.__hass;
        editor.setConfig(config);
        document.body.appendChild(editor);
        await editor.updateComplete;
        await new Promise((r) => setTimeout(r, 200));
        const root = editor.shadowRoot;
        const warnings = [...root.querySelectorAll('ha-alert')].map((a) => a.textContent.trim()).filter((t) => /schema/i.test(t));
        const labels = [...root.querySelectorAll('ha-selector, lcards-position-picker')].map((s) => s.label);
        const byLabel = (l) => [...root.querySelectorAll('ha-selector')].find((s) => s.label === l);
        const fire = (el, value) => el.dispatchEvent(new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
        fire(byLabel('Speed'), 2);
        await editor.updateComplete;
        const speed = editor.config.band?.speed;
        fire([...root.querySelectorAll('ha-selector')].filter((s) => s.label === 'Width (override)')[0], '');
        await editor.updateComplete;
        return { warnings, labels, speed, conditions: editor.config.conditions };
    }, CONFIG);
    expect(result.warnings).toEqual([]);
    expect(result.labels).toEqual(expect.arrayContaining([
        'Dismiss Mode', 'Auto-Dismiss After (seconds)', 'Position', 'Width', 'Height', 'Display', 'Band position', 'Speed',
        'Phase (degrees)', 'Show the alert symbol', 'Display (override)', 'Width (override)', 'Auto-Dismiss Override (seconds)',
        'Symbol animation speed',
    ]));
    expect(result.speed).toBe(2);
    // the red alert width (the condition's only key) is gone, and so is the empty condition
    expect(result.conditions?.red_alert?.width).toBeUndefined();
    await expectNoErrors(page);
});
