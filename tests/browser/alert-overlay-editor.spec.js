/**
 * Alert overlay editing (2026-11-06): the card editor is a launcher for the Alert
 * Studio, which holds every field (alert-studio/alert-studio-forms.js). Fields
 * render through FormField from the card schema (a path missing from it shows
 * "No schema found"); overlay-only and band-only fields follow each condition's
 * display; the info guides carry their diagrams; a content card is edited inline
 * with its own card editor.
 */
import { test, expect } from '@playwright/test';
import { mountCase, expectNoErrors } from './support.js';

/** Open the studio from the card editor with this config. */
const openStudio = (page, config) => page.evaluate(async (cfg) => {
    document.querySelector('lcards-alert-overlay-studio-dialog')?.remove();
    const editor = /** @type {any} */ (await customElements.get('lcards-alert-overlay').getConfigElement());
    editor.hass = window.__hass;
    editor.setConfig({ type: 'custom:lcards-alert-overlay', ...cfg });
    document.body.appendChild(editor);
    window.__editor = editor;
    await editor._openAlertStudio();
    const studio = document.querySelector('lcards-alert-overlay-studio-dialog');
    await studio.updateComplete;
    window.__studio = studio;
}, config);

/** Labels, section headers and FormField warnings on one tab (and condition). */
const tabView = (page, tab, condition = 'red_alert') => page.evaluate(async ({ tab, condition }) => {
    const studio = window.__studio;
    studio._activeTab = tab;
    studio._condition = condition;
    await studio.updateComplete;
    await new Promise((r) => setTimeout(r, 150));
    const tabRoot = studio.renderRoot.querySelector('.tab-content');
    // On the Conditions tab, one condition's own section (all five are listed)
    const root = tab === 'conditions' ? tabRoot.querySelector(`lcards-form-section[data-condition="${condition}"]`) : tabRoot;
    return {
        labels: [...root.querySelectorAll('ha-selector, lcards-position-picker')].map((s) => s.label),
        headers: [...root.querySelectorAll('lcards-form-section')].map((s) => s.header),
        warnings: [...root.querySelectorAll('ha-alert')].map((a) => a.textContent.trim()).filter((t) => /schema/i.test(t)),
        diagrams: [...tabRoot.querySelectorAll('lcards-alert-overlay-diagram')].map((d) => d.kind),
        inDisplay: [...([...root.querySelectorAll('lcards-form-section')].find((x) => x.header === 'Display')?.querySelectorAll('ha-selector, lcards-position-picker') ?? [])].map((x) => x.label),
    };
}, { tab, condition });

test('the card editor is a launcher: one Configuration tab with Open Alert Studio and Docs, no fields', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    const view = await page.evaluate(async () => {
        const editor = /** @type {any} */ (await customElements.get('lcards-alert-overlay').getConfigElement());
        editor.hass = window.__hass;
        editor.setConfig({ type: 'custom:lcards-alert-overlay', display: 'band' });
        document.body.appendChild(editor);
        await editor.updateComplete;
        const root = editor.shadowRoot;
        return {
            tabs: editor._getTabDefinitions().map((t) => t.label),
            buttons: [...root.querySelectorAll('ha-button')].map((b) => b.textContent.trim()),
            fields: root.querySelectorAll('.tab-panel:not([hidden]) ha-selector').length,
        };
    });
    expect(view.tabs[0]).toBe('Configuration');
    expect(view.tabs).not.toContain('Backdrop');
    expect(view.buttons).toEqual(expect.arrayContaining(['Open Alert Studio', 'Docs']));
    expect(view.fields).toBe(0);
});

test('studio: every field resolves in the schema; a change writes the key, a blank removes it', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    // red alert an overlay (the card default), yellow alert a band: every field shows
    await openStudio(page, { dismiss_mode: 'auto-dismiss', auto_dismiss_seconds: 10, conditions: { red_alert: { width: '300px' }, yellow_alert: { display: 'band' } } });
    const config = await tabView(page, 'config');
    const red = await tabView(page, 'conditions', 'red_alert');
    expect([...config.warnings, ...red.warnings]).toEqual([]);
    expect(config.labels).toEqual(expect.arrayContaining(['Dismiss Mode', 'Auto-Dismiss After (seconds)', 'Display', 'Band position', 'Speed', 'Phase (degrees)', 'Show the alert symbol', 'Width', 'Height']));
    expect(config.labels).toContain('Overlay position');
    expect(red.labels).toEqual(expect.arrayContaining(['Display (override)', 'Width (override)', 'Auto-Dismiss Override (seconds)']));
    expect(config.labels).toEqual(expect.arrayContaining(['Symbol animation speed', 'Alert label', 'Sub-text'])); // the Alert symbol section

    const result = await page.evaluate(async () => {
        const studio = window.__studio;
        studio._activeTab = 'config';
        await studio.updateComplete;
        const root = studio.renderRoot.querySelector('.tab-content');
        const fire = (el, value) => el.dispatchEvent(new CustomEvent('value-changed', { detail: { value }, bubbles: true, composed: true }));
        fire([...root.querySelectorAll('ha-selector')].find((s) => s.label === 'Speed'), 2);
        studio._activeTab = 'conditions';
        await studio.updateComplete;
        const root2 = studio.renderRoot.querySelector('.tab-content');
        fire([...root2.querySelectorAll('ha-selector')].find((s) => s.label === 'Width (override)'), '');
        await studio.updateComplete;
        return studio._workingConfig;
    });
    expect(result.band?.speed).toBe(2);
    expect(result.conditions?.red_alert).toBeUndefined();
    expect(result.conditions?.yellow_alert).toEqual({ display: 'band' });
    await expectNoErrors(page);
});

test('dismiss mode is a dropdown, not the position picker', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await openStudio(page, {});
    const kinds = await page.evaluate(async () => {
        const studio = window.__studio;
        await studio.updateComplete;
        const root = studio.renderRoot.querySelector('.tab-content');
        return [...root.querySelectorAll('lcards-position-picker')].map((p) => p.label);
    });
    expect(kinds).toEqual(['Overlay position']);
});

test('band everywhere: no overlay position or size, the band settings show', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await openStudio(page, { display: 'band' });
    const config = await tabView(page, 'config');
    expect(config.labels).not.toContain('Overlay position');
    expect(config.labels).toContain('Band position');
    const red = await tabView(page, 'conditions', 'red_alert');
    expect(red.labels).not.toContain('Width (override)');
    expect(red.labels).not.toContain('Position (override)');
});

test('overlay everywhere: no band settings', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await openStudio(page, {});
    const config = await tabView(page, 'config');
    expect(config.labels).toContain('Overlay position');
    expect(config.labels).not.toContain('Band position');
    expect(config.inDisplay).toEqual(expect.arrayContaining(['Overlay position', 'Width', 'Height']));
    for (const c of ['red_alert', 'gray_alert']) expect((await tabView(page, 'conditions', c)).labels).toContain('Width (override)');
});

test('mixed: a band card with red alert as an overlay shows both; each condition its own size fields', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await openStudio(page, { display: 'band', conditions: { red_alert: { display: 'overlay' } } });
    const config = await tabView(page, 'config');
    expect(config.labels).toContain('Overlay position');
    expect(config.labels).toContain('Band position');
    expect((await tabView(page, 'conditions', 'red_alert')).labels).toContain('Width (override)');
    expect((await tabView(page, 'conditions', 'yellow_alert')).labels).not.toContain('Width (override)');
});

test('the info guides carry their diagrams', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await openStudio(page, { conditions: { yellow_alert: { display: 'band' } } });
    const config = await tabView(page, 'config');
    const conditions = await tabView(page, 'conditions');
    expect([...config.diagrams, ...conditions.diagrams].sort()).toEqual(['band', 'conditions', 'overlay']);
});

/** A stand-in for Home Assistant's card editor (the harness has none): keeps its value, can send an edit. */
const stubCardEditor = (page) => page.evaluate(() => {
    if (customElements.get('hui-card-element-editor')) return;
    customElements.define('hui-card-element-editor', class extends HTMLElement {
        edit(change) {
            const merge = (a, b) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' ? merge(o[k], v) : v; return o; };
            this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: merge(this.value, change) }, bubbles: true, composed: true }));
        }
    });
});

/** The pill a condition shows, and its symbol editor's value. */
const conditionState = (page, condition) => page.evaluate(async (condition) => {
    const studio = window.__studio;
    studio._activeTab = 'conditions';
    studio._condition = condition;
    await studio.updateComplete;
    const root = studio.renderRoot.querySelector(`.tab-content lcards-form-section[data-condition="${condition}"]`);
    const active = [...root.querySelectorAll('.mode-pills ha-button')].find((b) => b.appearance === 'accent')?.dataset.mode;
    return { mode: active, editorValue: root.querySelector('hui-card-element-editor')?.value ?? null };
}, condition);

test('pills: a condition shows the symbol, the symbol customised (it has changes) or your own card', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await stubCardEditor(page);
    await openStudio(page, { conditions: {
        yellow_alert: { alert_button: { text: { sub_text: { content: 'SHIELDS' } } } },
        blue_alert: { content: { type: 'markdown', content: 'hi' } },
    } });
    expect((await conditionState(page, 'red_alert')).mode).toBe('symbol');
    const yellow = await conditionState(page, 'yellow_alert');
    expect(yellow.mode).toBe('custom');
    // the button editor shows the symbol as it will look: the preset and the change
    expect(yellow.editorValue).toMatchObject({ type: 'custom:lcards-button', component: 'alert', preset: 'condition_yellow', text: { sub_text: { content: 'SHIELDS' } } });
    const blue = await conditionState(page, 'blue_alert');
    expect(blue).toMatchObject({ mode: 'card', editorValue: { type: 'markdown' } });
});

test('customise the symbol: an edit in its button editor saves only what changed, as the condition alert_button', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await stubCardEditor(page);
    await openStudio(page, { alert_button: { text: { alert_text: { content: 'ALL HANDS' } } } });
    await conditionState(page, 'red_alert');
    const config = await page.evaluate(async () => {
        const studio = window.__studio;
        const root = studio.renderRoot.querySelector('.tab-content lcards-form-section[data-condition="red_alert"]');
        root.querySelector('.mode-pills ha-button[data-mode="custom"]').click();
        await studio.updateComplete;
        const editor = root.querySelector('hui-card-element-editor');
        const shown = editor.value.text.alert_text.content;
        editor.edit({ text: { sub_text: { color: 'white' } }, style: { border: { width: 4 } } });
        await studio.updateComplete;
        return { shown, config: studio._workingConfig };
    });
    expect(config.shown).toBe('ALL HANDS'); // the card-level change shows in a condition's editor
    expect(config.config.conditions.red_alert.alert_button).toEqual({ text: { sub_text: { color: 'white' } }, style: { border: { width: 4 } } });
    expect(config.config.alert_button).toEqual({ text: { alert_text: { content: 'ALL HANDS' } } }); // the card level untouched
});

test('the Alert symbol section on the Config tab edits the card-level alert_button (every condition)', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await stubCardEditor(page);
    await openStudio(page, {});
    const result = await page.evaluate(async () => {
        const studio = window.__studio;
        studio._activeTab = 'config';
        await studio.updateComplete;
        const section = [...studio.renderRoot.querySelectorAll('lcards-form-section')].find((x) => x.header === 'Alert symbol');
        const editor = section.querySelector('hui-card-element-editor');
        editor.edit({ text: { sub_text: { font_size: 30 } }, preset: 'lozenge' });
        await studio.updateComplete;
        return studio._workingConfig.alert_button;
    });
    expect(result).toEqual({ text: { sub_text: { font_size: 30 } } }); // preset is never saved
});

test('back to the plain symbol asks before removing a condition\'s changes', async ({ page }) => {
    await mountCase(page, 'button-lozenge');
    await openStudio(page, { conditions: { red_alert: { alert_button: { speed: 2 } } } });
    await conditionState(page, 'red_alert');
    const answer = async (button) => page.evaluate(async (button) => {
        const studio = window.__studio;
        studio.renderRoot.querySelector('lcards-form-section[data-condition="red_alert"] .mode-pills ha-button[data-mode="symbol"]').click();
        await new Promise((r) => setTimeout(r, 50));
        // the harness has no real ha-dialog, so an answered one stays in the page: take the newest
        const dialog = [...document.querySelectorAll('ha-dialog')].filter((d) => d.headerTitle === 'Remove the changes?').at(-1);
        [...dialog.querySelectorAll('ha-button')].find((b) => b.textContent === button).click();
        await new Promise((r) => setTimeout(r, 50));
        await studio.updateComplete;
        return studio._workingConfig.conditions?.red_alert?.alert_button ?? null;
    }, button);
    expect(await answer('Cancel')).toEqual({ speed: 2 });
    expect(await answer('Remove')).toBeNull();
});
