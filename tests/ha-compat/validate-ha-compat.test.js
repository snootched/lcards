/**
 * scripts/validate-ha-compat.js rules. Each "catches" fixture is a real
 * pattern that silently broke LCARdS against a newer HA; each "allows"
 * fixture is the corrected form that must keep passing.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scanText, RULES } from '../../scripts/validate-ha-compat.js';

const ids = (text, kind = 'js') => scanText(text, kind).map(h => h.rule.id);

test('every rule has an id, reason and fix', () => {
    for (const r of RULES) {
        assert.ok(r.id && r.reason && r.fix, r.id);
        assert.ok(r.pattern.global, `${r.id} must be a global regex`);
    }
});

test('catches unregistered/removed elements', () => {
    assert.deepEqual(ids('<mwc-icon-button @click=${f}>'), ['mwc-element']);
    assert.deepEqual(ids('<ha-textfield .value=${v}>'), ['ha-textfield']);
    assert.deepEqual(ids('<ha-circular-progress active>'), ['ha-circular-progress']);
    assert.deepEqual(ids('<ha-formfield .label=${"x"}>'), ['ha-formfield']);
    assert.deepEqual(ids('<paper-dropdown-menu>'), ['paper-element']);
});

test('catches ha-input helper= (ha-input only has hint), across lines and after arrow fns', () => {
    assert.deepEqual(ids('<ha-input .value=${v} helper="Pixels"></ha-input>'), ['ha-input-helper']);
    assert.deepEqual(ids('<ha-input\n  .value=${v}\n  @input=${(e) => this._set(e)}\n  .helper=${"x"}>'), ['ha-input-helper']);
    assert.deepEqual(ids('<ha-input .value=${v} hint="Pixels"></ha-input>'), []);
    // helper on ha-selector is a real property
    assert.deepEqual(ids('<ha-selector .helper=${"x"}></ha-selector>'), []);
});

test('catches ha-button raised (MWC attribute)', () => {
    assert.deepEqual(ids('<ha-button raised @click=${f}>'), ['ha-button-raised']);
    assert.deepEqual(ids('<ha-button\n  @click=${() => this._x()}\n  ?raised=${on}>'), ['ha-button-raised']);
    assert.deepEqual(ids('<ha-button appearance=${on ? "accent" : "plain"}>'), []);
});

test('catches ha-button sizes it does not have (ha-spinner\'s "small" is fine)', () => {
    assert.deepEqual(ids('<ha-button size="small" @click=${f}>'), ['ha-button-size']);
    assert.deepEqual(ids('<ha-button\n  appearance="plain"\n  size="medium">'), ['ha-button-size']);
    assert.deepEqual(ids('<ha-button size="s" @click=${f}>'), []);
    assert.deepEqual(ids('<ha-button size="xl">'), []);
    assert.deepEqual(ids('<ha-spinner size="small"></ha-spinner>'), []);
});

test('allows the corrected element forms', () => {
    assert.deepEqual(ids('<ha-icon-button .label=${"Up"}><ha-icon icon="mdi:arrow-up"></ha-icon></ha-icon-button>'), []);
    assert.deepEqual(ids('<ha-switch .checked=${on}>Invert Fill</ha-switch>'), []);
    assert.deepEqual(ids('<ha-spinner size="small"></ha-spinner>'), []);
    assert.deepEqual(ids('<ha-input .value=${v}></ha-input>'), []);
});

test('catches ha-icon-button icon= attribute, including across lines', () => {
    assert.deepEqual(ids('<ha-icon-button\n    icon="mdi:refresh"\n    @click=${f}>'), ['ha-icon-button-icon-attr']);
    // `icon=` on a child element is fine
    assert.deepEqual(ids('<ha-icon-button .label=${"R"}>\n  <ha-icon icon="mdi:refresh"></ha-icon>'), []);
});

test('catches dialogs/portals mounted on document.body', () => {
    assert.deepEqual(ids('document.body.appendChild(dialog);'), ['dialog-on-body']);
    assert.deepEqual(ids('document.body.appendChild(this._portal);'), ['dialog-on-body']);
    // temporary probes / non-HA overlays are fine
    assert.deepEqual(ids('document.body.appendChild(probe);'), []);
    assert.deepEqual(ids('mountDialogNearHomeAssistant(dialog, this);'), []);
});

test('catches dead CSS hooks', () => {
    assert.deepEqual(ids('style="--mdc-theme-primary: red"'), ['mdc-theme-primary']);
    assert.deepEqual(ids('.b { --mdc-icon-button-size: 20px; }'), ['mdc-icon-button-size']);
    assert.deepEqual(ids('--md-icon-button-icon-color: red;'), ['md-icon-button-vars']);
    assert.deepEqual(ids('--md-filter-chip-leading-space: 4px;'), ['md-chip-spacing']);
    assert.deepEqual(ids('--md-filter-chip-with-leading-icon-leading-space: 4px;'), ['md-chip-spacing']);
    assert.deepEqual(ids('--ha-assist-chip-container-height: 22px;'), ['chip-sizing']);
    assert.deepEqual(ids('--md-sys-color-primary: white;'), ['chip-sizing']);
    assert.deepEqual(ids('--mdc-dialog-max-width: 95vw;'), ['mdc-dialog-vars']);
    assert.deepEqual(ids('ha-dialog { --dialog-max-width: 600px; }'), ['mdc-dialog-vars']);
});

test('allows live hooks with similar names', () => {
    assert.deepEqual(ids('--ha-dialog-max-width: 600px;'), []);
    assert.deepEqual(ids('--ha-icon-button-size: 20px; --mdc-icon-size: 16px;'), []);
    assert.deepEqual(ids('--md-filter-chip-selected-container-color: red;'), []);
    assert.deepEqual(ids('--md-assist-chip-label-text-color: white; --md-sys-color-on-surface: white;'), []);
    assert.deepEqual(ids('--ha-assist-chip-filled-container-color: red;'), []);
});

test('suppression marker skips a deliberate line', () => {
    assert.deepEqual(ids('<mwc-icon-button> <!-- ha-compat-ignore -->'), []);
});

test('backend: catches voluptuous imports, allows probatio', () => {
    assert.deepEqual(ids('import voluptuous as vol\n', 'py'), ['voluptuous-import']);
    assert.deepEqual(ids('from voluptuous import Schema\n', 'py'), ['voluptuous-import']);
    assert.deepEqual(ids('import probatio as vol\n', 'py'), []);
    // js rules don't apply to python and vice versa
    assert.deepEqual(ids('import voluptuous as vol\n', 'js'), []);
});

test('reports the line of the match', () => {
    const [hit] = scanText('a\nb\n<mwc-icon-button>\n', 'js');
    assert.equal(hit.line, 3);
});
