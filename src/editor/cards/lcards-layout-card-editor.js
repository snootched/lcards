/**
 * @fileoverview lcards-layout-card-editor — GUI editor for lcards-layout-card.
 *
 * HA's card-edit dialog is too small for grid WYSIWYG, so this editor is just a
 * launcher: it shows a summary and opens the full-screen Layout Studio
 * (lcards-layout-studio-dialog), which hosts the live preview + grid overlay and
 * the per-card tabs. The studio emits `config-changed`; we relay it to HA.
 */

import { html, css } from 'lit';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { fireEvent } from 'custom-card-helpers';
import { configToYaml } from '../utils/yaml-utils.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { parseLayoutConfig, getAreaNames } from '../../views/layout-grid-utils.js';

// Side-effect import: registers <lcards-layout-studio-dialog>.
import '../dialogs/lcards-layout-studio-dialog.js';

export class LCARdSLayoutCardEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'layout-card';
        this._studioDialog = null;
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
        this._studioDialog?.remove();
        this._studioDialog = null;
    }

    render() {
        const cards = this.config?.cards ?? [];
        const { columns, rows, areas } = parseLayoutConfig(this.config?.layout);
        const areaNames = getAreaNames(areas);

        return html`
            <div class="info-card">
                <div class="info-card-content">
                    <h3>🔲 Layout Studio</h3>
                    <p>
                        <strong>Full-screen grid workspace</strong> with live preview
                        <br />
                        Size tracks, draw areas, style backgrounds, and place cards visually.
                    </p>
                    <div class="lc-stats">
                        <span><b>${columns.length}</b> cols × <b>${rows.length}</b> rows</span>
                        <span><b>${areaNames.length}</b> area${areaNames.length === 1 ? '' : 's'}</span>
                        <span><b>${cards.length}</b> card${cards.length === 1 ? '' : 's'}</span>
                    </div>
                </div>
                <div class="info-card-actions">
                    <ha-button raised @click=${this._openStudio}>
                        <ha-icon icon="mdi:view-grid-plus" slot="start"></ha-icon>
                        Open Layout Studio
                    </ha-button>
                </div>
            </div>
        `;
    }

    _openStudio() {
        const dialog = document.createElement('lcards-layout-studio-dialog');
        // @ts-ignore - custom props
        dialog.hass = this.hass;
        // @ts-ignore
        dialog.config = JSON.parse(JSON.stringify(this.config ?? {}));
        this._studioDialog = dialog;

        dialog.addEventListener('config-changed', (e) => {
            // @ts-ignore
            const cfg = e.detail?.config;
            if (!cfg) return;
            this.config = cfg;
            this._yamlValue = configToYaml(this.config);
            fireEvent(this, 'config-changed', { config: this.config });
            this.requestUpdate();
        });
        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._studioDialog === dialog) this._studioDialog = null;
        });

        document.body.appendChild(dialog);
        lcardsLog.debug('[LayoutCardEditor] Opened Layout Studio');
    }

    static get styles() {
        return [
            ...super.styles,
            css`
                .lc-stats { display: flex; gap: 16px; margin: 8px 0 4px; font-size: 13px; color: var(--primary-text-color); }
                .lc-stats b { color: var(--lcars-ui-primary, var(--primary-color)); }
            `,
        ];
    }
}

if (!customElements.get('lcards-layout-card-editor')) {
    customElements.define('lcards-layout-card-editor', LCARdSLayoutCardEditor);
}
