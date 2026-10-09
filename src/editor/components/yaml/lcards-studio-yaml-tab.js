/**
 * @fileoverview YAML tab for configuration studios
 *
 * Wraps lcards-yaml-editor (schema completion, lint, "Options here" panel)
 * for a studio's working config. Edits are parsed and fired as
 * `yaml-config-changed`; the studio applies them to its working copy and
 * preview, and Save keeps them.
 *
 * The editor text is only replaced when the config changes from outside
 * (another tab, a reset). When the studio echoes back the config it just
 * received from here (possibly normalised), the text and cursor are left
 * alone so typing is never interrupted.
 *
 * @element lcards-studio-yaml-tab
 * @fires yaml-config-changed - detail: { config } (only for YAML that parses to an object)
 */

import { LitElement, html, css } from 'lit';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import '../shared/lcards-message.js';
import './lcards-yaml-editor.js';

export class LCARdSStudioYamlTab extends LitElement {
    static get properties() {
        return {
            hass: { type: Object },
            /** Config to show (the studio's current config, in user-facing form) */
            config: { type: Object },
            schema: { type: Object },
            /** Card type for docs links, e.g. 'data-grid' */
            cardType: { type: String },
            /** Optional note shown above the editor */
            note: { type: String },
            _text: { type: String, state: true }
        };
    }

    constructor() {
        super();
        this.hass = null;
        this.config = null;
        this.schema = null;
        this.cardType = '';
        this.note = '';
        this._text = '';
        this._lastJson = null;
        this._echoPending = false;
    }

    static get styles() {
        return css`
            :host {
                display: flex;
                flex-direction: column;
                gap: var(--ha-space-3);
            }
        `;
    }

    /** @param {Map<string, unknown>} changed */
    willUpdate(changed) {
        if (!changed.has('config')) return;
        const json = JSON.stringify(this.config ?? {});
        const echo = this._echoPending;
        this._echoPending = false;
        if (json === this._lastJson) return;
        this._lastJson = json;
        // The studio's (possibly normalised) response to our own edit: keep the user's text.
        if (echo) return;
        this._text = configToYaml(this.config ?? {});
    }

    render() {
        return html`
            <lcards-message type="info">
                ${this.note || 'Edit the whole configuration as YAML. Changes show in the preview; Save keeps them.'}
            </lcards-message>
            <lcards-yaml-editor
                .value=${this._text}
                .schema=${this.schema}
                .cardType=${this.cardType}
                .hass=${this.hass}
                @value-changed=${this._onChange}>
            </lcards-yaml-editor>
        `;
    }

    /** @param {CustomEvent} e @private */
    _onChange(e) {
        e.stopPropagation();
        let config;
        try {
            config = yamlToConfig(e.detail.value);
        } catch (error) {
            lcardsLog.debug('[StudioYamlTab] YAML does not parse yet; not applied', error?.message);
            return;
        }
        if (!config || typeof config !== 'object' || Array.isArray(config)) return;
        this._text = e.detail.value;
        this._lastJson = JSON.stringify(config);
        this._echoPending = true;
        this.dispatchEvent(new CustomEvent('yaml-config-changed', { detail: { config } }));
    }
}

if (!customElements.get('lcards-studio-yaml-tab')) customElements.define('lcards-studio-yaml-tab', LCARdSStudioYamlTab);
