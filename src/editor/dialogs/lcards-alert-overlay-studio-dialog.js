/**
 * @fileoverview lcards-alert-overlay-studio-dialog: the Alert Studio.
 *
 * The alert overlay card's one editor (its card editor is a launcher), on the
 * shared studio shell (README-STUDIO-DIALOG.md): tabs on the left (Config,
 * Backdrop, Conditions, YAML; the forms are in alert-studio/alert-studio-forms.js),
 * and on the right a mock screen (`lcards-alert-preview`) showing one alert
 * condition, picked in the floating toolbar or on the Conditions tab.
 *
 * The preview never raises an alert: input_select.lcards_alert_mode is not
 * touched, and nothing is shown on the real screen. Works on a copy of the
 * config; Save sends the whole config in `config-changed`, Cancel nothing.
 */

import { LitElement, html, css } from 'lit';
import { editorStyles } from '../base/editor-styles.js';
import { messageStyles } from '../base/surface-styles.js';
import { studioDialogStyles } from './studio-dialog-styles.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { getAlertOverlaySchema } from '../../cards/schemas/lcards-alert-overlay-schema.js';
import { docsUrl, DOCS } from '../../utils/docs-url.js';
import { AlertStudioForms, ALERT_CONDITIONS } from './alert-studio/alert-studio-forms.js';
import '../components/yaml/lcards-studio-yaml-tab.js';
import '../components/alert-overlay/lcards-alert-preview.js';

const TABS = [
    { id: 'config',     label: 'Config',     icon: 'mdi:cog-outline' },
    { id: 'backdrop',   label: 'Backdrop',   icon: 'mdi:blur' },
    { id: 'conditions', label: 'Conditions', icon: 'mdi:alert-outline' },
    { id: 'yaml',       label: 'YAML',       icon: 'mdi:code-braces' },
];

/** A config without its undefined values (deleted keys stay deleted). @param {any} c */
const clean = (c) => JSON.parse(JSON.stringify(c ?? {}));

export class LCARdSAlertOverlayStudioDialog extends AlertStudioForms(LitElement) {

    static get properties() {
        return {
            hass:             { attribute: false },
            _workingConfig:   { state: true },
            _condition:       { state: true },
            _activeTab:       { state: true },
            _toolbarExpanded: { state: true },
        };
    }

    set config(value) {
        this._handled       = false;
        this._initialConfig = clean(value);
        this._workingConfig = clean(value);
    }
    get config() { return this._workingConfig; }

    constructor() {
        super();
        /** @type {any} */
        this.hass = undefined;
        /** @type {any} */
        this._initialConfig = {};
        /** @type {any} */
        this._workingConfig = {};
        this._handled = false;
        this._condition = 'red_alert';
        this._activeTab = 'config';
        this._toolbarExpanded = true;
        this.cardType = 'alert-overlay';
        /** @type {any} */
        this._pickerDialog = null;
        /** A pill picked before anything is set (Customise the symbol, Your own card), per condition */
        /** @type {Record<string, string|undefined>} */
        this._pickedModes = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this._ensureCardElementEditor();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._pickerDialog?.remove();
        this._pickerDialog = null;
    }

    // ── The edit methods FormField and the forms use, on the working copy ────

    _getSchema() {
        return getAlertOverlaySchema();
    }

    /** @param {string} path */
    _getSchemaForPath(path) {
        // The card editors' path lookup (patternProperties, additionalProperties, oneOf)
        return LCARdSBaseEditor.prototype._getSchemaForPath.call(this, path);
    }

    /** @param {string} path */
    _getConfigValue(path) {
        /** @type {any} */
        let value = this._workingConfig;
        for (const key of path.split('.')) {
            if (value === undefined || value === null) return undefined;
            value = value[key];
        }
        return value;
    }

    /**
     * Set one key; empty values remove it (and empty parents).
     * @param {string} path
     * @param {any} value
     */
    _setConfigValue(path, value) {
        if (value === undefined || value === null || value === '') {
            this._removeConfigPath(path);
            return;
        }
        const next = clean(this._workingConfig);
        const keys = path.split('.');
        let node = next;
        for (const key of keys.slice(0, -1)) {
            if (!node[key] || typeof node[key] !== 'object') node[key] = {};
            node = node[key];
        }
        node[keys[keys.length - 1]] = value;
        this._workingConfig = next;
    }

    /** @param {string} path */
    _removeConfigPath(path) {
        const next = clean(this._workingConfig);
        const keys = path.split('.');
        /** @type {any[]} */
        const chain = [next];
        for (const key of keys.slice(0, -1)) {
            const child = chain[chain.length - 1]?.[key];
            if (!child || typeof child !== 'object') return;
            chain.push(child);
        }
        delete chain[chain.length - 1][keys[keys.length - 1]];
        // prune parents left empty
        for (let i = chain.length - 1; i > 0; i--) {
            if (Object.keys(chain[i]).length) break;
            delete chain[i - 1][keys[i - 1]];
        }
        this._workingConfig = next;
    }

    /**
     * Replace top-level keys (the forms pass whole subtrees: conditions, layers);
     * undefined removes one.
     * @param {Record<string, any>} updates
     */
    _updateConfig(updates) {
        this._workingConfig = clean({ ...this._workingConfig, ...updates });
    }

    /** @param {Event} e */
    _onTab(e) {
        const value = /** @type {any} */ (e.target).activeTab?.getAttribute('value');
        if (value) this._activeTab = value;
    }

    // ── Render ───────────────────────────────────────────────────────────────

    render() {
        return html`
            <ha-dialog open flexcontent header-title="Alert Studio"
                @closed=${(/** @type {Event} */ e) => { if (e.target === e.currentTarget) { e.stopPropagation(); this._handleCancel(); } }}>
                <div class="dialog-content">
                    <div class="studio-layout">
                        <div class="config-panel">
                            <ha-tab-group @wa-tab-show=${this._onTab}>
                                ${TABS.map((t) => html`
                                    <ha-tab-group-tab value=${t.id} ?active=${this._activeTab === t.id}>
                                        <ha-icon icon=${t.icon}></ha-icon>
                                        ${t.label}
                                    </ha-tab-group-tab>`)}
                            </ha-tab-group>
                            <div class="tab-content">${this._renderActiveTab()}</div>
                        </div>
                        <div class="preview-panel">
                            <div class="preview-stage">
                                <lcards-alert-preview
                                    .hass=${this.hass}
                                    .config=${this._workingConfig}
                                    .condition=${this._condition}>
                                </lcards-alert-preview>
                                ${this._renderToolbar()}
                                <div class="preview-notes">
                                    <span class="toolbar-status">Preview only: the alert mode doesn't change and nothing shows on your dashboards. Click the backdrop (overlay) or the symbol (band) to try a dismiss.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <ha-dialog-footer slot="footer">
                    <div class="footer-start" slot="secondaryAction">
                        <ha-button appearance="plain" @click=${() => window.open(docsUrl(DOCS.alertOverlay), '_blank', 'noopener')}>
                            <ha-icon icon="mdi:book-open-variant" slot="start"></ha-icon>
                            Documentation
                        </ha-button>
                    </div>
                    <ha-button slot="secondaryAction" appearance="plain" @click=${this._handleCancel}>Cancel</ha-button>
                    <ha-button slot="primaryAction" variant="brand" @click=${this._handleSave}>
                        <ha-icon icon="mdi:check" slot="start"></ha-icon>
                        Save
                    </ha-button>
                </ha-dialog-footer>
            </ha-dialog>
        `;
    }

    _renderActiveTab() {
        switch (this._activeTab) {
            case 'backdrop': return this._renderBackdropTab();
            case 'conditions': return this._renderConditionsTab();
            case 'yaml': return html`
                <lcards-studio-yaml-tab
                    .hass=${this.hass}
                    .config=${this._workingConfig}
                    .schema=${getAlertOverlaySchema()}
                    cardType="alert-overlay"
                    @yaml-config-changed=${(/** @type {CustomEvent} */ e) => { this._workingConfig = clean(e.detail.config); }}>
                </lcards-studio-yaml-tab>`;
            default: return this._renderConfigTab();
        }
    }

    /** The preview's floating toolbar (the studios' canvas toolbar): the condition, replay. */
    _renderToolbar() {
        const toggle = () => { this._toolbarExpanded = !this._toolbarExpanded; };
        if (!this._toolbarExpanded) {
            return html`
                <div class="canvas-toolbar collapsed">
                    <button class="canvas-toolbar-toggle" title="Show the toolbar" aria-label="Show the toolbar" @click=${toggle}>
                        <ha-icon icon="mdi:tools"></ha-icon>
                    </button>
                </div>`;
        }
        return html`
            <div class="canvas-toolbar">
                <div class="canvas-toolbar-buttons">
                    <div class="canvas-toolbar-group">
                        <span class="canvas-toolbar-group-label">Condition</span>
                        ${ALERT_CONDITIONS.map((c) => html`
                            <button class="canvas-toolbar-button ${this._condition === c.key ? 'active' : ''}" data-condition=${c.key}
                                title=${`Show ${c.label}`} aria-label=${`Show ${c.label}`} aria-pressed=${this._condition === c.key ? 'true' : 'false'}
                                @click=${() => { this._condition = c.key; }}>
                                <ha-icon icon=${c.icon}></ha-icon>
                            </button>`)}
                    </div>
                    <div class="canvas-toolbar-group">
                        <span class="canvas-toolbar-group-label">Preview</span>
                        <button class="canvas-toolbar-button" data-tool="replay" title="Show the alert again" aria-label="Show the alert again"
                            @click=${() => /** @type {any} */ (this.renderRoot.querySelector('lcards-alert-preview'))?.replay()}>
                            <ha-icon icon="mdi:replay"></ha-icon>
                        </button>
                    </div>
                </div>
                <button class="canvas-toolbar-toggle" title="Hide the toolbar" aria-label="Hide the toolbar" @click=${toggle}>
                    <ha-icon icon="mdi:chevron-right"></ha-icon>
                </button>
            </div>`;
    }

    _handleSave() {
        if (this._handled) return;
        this._handled = true;
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: clean(this._workingConfig) }, bubbles: true, composed: true,
        }));
        this._handleClose();
    }

    _handleCancel() {
        if (this._handled) return;
        this._handled = true;
        this._handleClose();
    }

    _handleClose() {
        this.dispatchEvent(new CustomEvent('closed', { bubbles: true, composed: true }));
    }

    static get styles() {
        return [
            editorStyles,
            studioDialogStyles,
            messageStyles,
            css`
                :host { display: block; }
                .studio-layout { grid-template-columns: 40% 60%; grid-template-rows: minmax(0, 1fr); }
                ha-tab-group { flex-shrink: 0; }
                .tab-content { padding: var(--ha-space-4); }
                lcards-form-section { display: block; }
                .preview-stage { position: relative; flex: 1; min-height: 0; display: flex; padding: 72px var(--ha-space-4) 56px; }
                lcards-alert-preview { flex: 1; min-height: 0; min-width: 0; }
                .canvas-toolbar { align-items: center; }
                .preview-notes { position: absolute; left: var(--ha-space-3); bottom: var(--ha-space-3); max-width: calc(100% - 24px); pointer-events: none; }
                .mode-pills { display: flex; margin-bottom: var(--ha-space-3); }
                .mode-pills ha-button::part(base) { border-radius: 0; border-inline-end: none; }
                .mode-pills ha-button:first-child::part(base) { border-start-start-radius: var(--ha-border-radius-pill); border-end-start-radius: var(--ha-border-radius-pill); }
                .mode-pills ha-button:last-child::part(base) { border-start-end-radius: var(--ha-border-radius-pill); border-end-end-radius: var(--ha-border-radius-pill); }
                .content-buttons { display: flex; flex-wrap: wrap; gap: var(--ha-space-2); margin-bottom: var(--ha-space-2); }
                .card-editor-host { border-top: var(--ha-border-width-sm) solid var(--divider-color); padding-top: var(--ha-space-3); }
                .field-caption { font-size: 12px; font-weight: 500; color: var(--secondary-text-color); margin: var(--ha-space-2) 0 var(--ha-space-1); padding: 0 2px; }
            `,
        ];
    }
}

if (!customElements.get('lcards-alert-overlay-studio-dialog')) {
    customElements.define('lcards-alert-overlay-studio-dialog', LCARdSAlertOverlayStudioDialog);
}
