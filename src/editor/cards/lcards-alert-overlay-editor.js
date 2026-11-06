/**
 * @fileoverview LCARdS Alert Overlay Editor
 *
 * A launcher for the Alert Studio (every setting, with a mock screen that
 * previews each alert condition without raising an alert), as the
 * Astrometrics and MSD editors are. The YAML tab holds the whole config.
 */

import { html, css } from 'lit';
import { fireEvent } from 'custom-card-helpers';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { configToYaml } from '../utils/yaml-utils.js';
import { docsUrl, DOCS } from '../../utils/docs-url.js';
import { mountDialogNearHomeAssistant } from '../../utils/lcards-shared-helpers.js';
import { displayFor, ALERT_CONDITION_KEYS } from '../../cards/alert-overlay-config.js';
import '../components/shared/lcards-message.js';

const DISMISS_LABELS = {
    'dismiss': 'Dismiss (hide only)',
    'reset': 'Reset to green alert',
    'auto-dismiss': 'Auto-dismiss',
    'auto-reset': 'Auto-reset to green alert',
};

export class LCARdSAlertOverlayEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'alert-overlay';
        /** @type {any} Open studio dialog, kept in sync with hass */
        this._studio = null;
    }

    /** @param {Map<string, unknown>} changedProps */
    updated(changedProps) {
        super.updated(changedProps);
        if (changedProps.has('hass') && this._studio) this._studio.hass = this.hass;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Config lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Strip legacy keys that were removed in the layers refactor before
     * handing config to the base editor for cloning and validation.
     * Prevents bogus validation errors when HA loads an old stored config.
     * @param {Object} config
     * @override
     */
    setConfig(config) {
        const migrated = this._stripLegacyKeys(config);
        super.setConfig(migrated);
    }

    /**
     * Remove keys that no longer exist in the schema from top-level config
     * and from each per-condition object, returning a clean copy.
     * @param {Object} config
     * @returns {Object}
     * @private
     */
    _stripLegacyKeys(config) {
        if (!config || typeof config !== 'object') return config;

        // Keys that were removed from the schema in the layers refactor
        const REMOVED_KEYS = ['backdrop_effect', 'backdrop_params'];

        const clean = { ...config };
        for (const key of REMOVED_KEYS) delete clean[key];

        // `backdrop` is deprecated but the schema still accepts it as an object.
        // If it was stored as a non-object (e.g. a string or boolean from old code),
        // strip it to prevent a type-mismatch validation error.
        if ('backdrop' in clean && (typeof clean.backdrop !== 'object' || clean.backdrop === null)) {
            delete clean.backdrop;
        }

        // Also strip from per-condition objects
        if (clean.conditions && typeof clean.conditions === 'object') {
            const conditions = {};
            for (const [condKey, condVal] of Object.entries(clean.conditions)) {
                if (condVal && typeof condVal === 'object') {
                    const c = { ...condVal };
                    for (const key of REMOVED_KEYS) delete c[key];
                    if ('backdrop' in c && (typeof c.backdrop !== 'object' || c.backdrop === null)) {
                        delete c.backdrop;
                    }
                    conditions[condKey] = c;
                } else {
                    conditions[condKey] = condVal;
                }
            }
            clean.conditions = conditions;
        }

        return clean;
    }

    _getTabDefinitions() {
        return [
            { label: 'Configuration', content: () => this._renderConfigurationTab() },
            ...this._getUtilityTabs(),
        ];
    }

    /** The studio launcher and a summary of what the card shows. */
    _renderConfigurationTab() {
        const config = this.config ?? {};
        const bands = ALERT_CONDITION_KEYS.filter((k) => displayFor(config, k) === 'band').length;
        const custom = ALERT_CONDITION_KEYS.filter((k) => config.conditions?.[k]?.content).length;
        const display = bands === 0 ? 'Overlay' : bands === ALERT_CONDITION_KEYS.length ? 'Band' : `Overlay, band for ${bands}`;
        const dismiss = /** @type {any} */ (DISMISS_LABELS)[config.dismiss_mode ?? 'dismiss'] ?? config.dismiss_mode;
        return html`
            <div class="info-card">
                <div class="info-card-content">
                    <h3>Alert Studio</h3>
                    <p>
                        <strong>Full-screen workspace</strong> with a mock screen that shows each alert condition:
                        the alert symbol or your card, or the band, with its size, position and screen effects.
                        The preview never changes the alert mode.
                    </p>
                    <div class="alert-stats">
                        <span><b>${display}</b></span>
                        <span><b>${dismiss}</b></span>
                        <span><b>${custom}</b> custom card${custom === 1 ? '' : 's'}</span>
                    </div>
                </div>
                <div class="info-card-actions">
                    <ha-button @click=${this._openAlertStudio}>
                        <ha-icon icon="mdi:alert-rhombus-outline" slot="start"></ha-icon>
                        Open Alert Studio
                    </ha-button>
                    <ha-button appearance="plain" @click=${() => window.open(docsUrl(DOCS.alertOverlay), '_blank', 'noopener')}>
                        Docs
                        <ha-icon icon="mdi:open-in-new" slot="end"></ha-icon>
                    </ha-button>
                </div>
            </div>
            <lcards-message type="info">
                Shows while <code>input_select.lcards_alert_mode</code> is an alert (red, yellow, blue, black or gray).
                Add one per dashboard; it takes no space on the dashboard.
            </lcards-message>
        `;
    }

    /** Open the Alert Studio on a copy of the config; Save replaces it (deleted keys must go). */
    async _openAlertStudio() {
        await import('../dialogs/lcards-alert-overlay-studio-dialog.js');
        const dialog = /** @type {any} */ (document.createElement('lcards-alert-overlay-studio-dialog'));
        dialog.hass = this.hass;
        dialog.config = JSON.parse(JSON.stringify(this.config || {}));
        this._studio = dialog;
        dialog.addEventListener('config-changed', (/** @type {CustomEvent} */ e) => {
            this.config = e.detail.config;
            this._isUpdatingYaml = true;
            this._yamlValue = configToYaml(this.config);
            requestAnimationFrame(() => { this._isUpdatingYaml = false; });
            fireEvent(this, 'config-changed', { config: this.config });
            this.requestUpdate();
        });
        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._studio === dialog) this._studio = null;
        });
        mountDialogNearHomeAssistant(dialog, this);
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                .alert-stats { display: flex; flex-wrap: wrap; gap: var(--ha-space-4); margin: var(--ha-space-2) 0 var(--ha-space-1); font-size: 13px; color: var(--primary-text-color); }
                .alert-stats b { color: var(--lcars-ui-primary, var(--primary-color)); }
            `,
        ];
    }
}

if (!customElements.get('lcards-alert-overlay-editor')) customElements.define('lcards-alert-overlay-editor', LCARdSAlertOverlayEditor);
