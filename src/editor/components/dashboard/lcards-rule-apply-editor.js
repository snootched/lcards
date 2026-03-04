/**
 * LCARdS Rule Apply Editor
 *
 * Visual editor for the `apply` section of a rule.
 * Supports overlay targets with quick-patches and tag-based targeting,
 * plus an advanced YAML fallback.
 *
 * @element lcards-rule-apply-editor
 * @fires value-changed - When apply object changes (detail: { value: applyObject })
 *
 * @property {Object} value  - The `apply` object
 * @property {Object} hass   - Home Assistant instance
 * @property {Object} editor - Parent editor instance (for context)
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../../../utils/lcards-logging.js';
import { configToYaml, yamlToConfig } from '../../utils/yaml-utils.js';
import '../shared/lcards-form-section.js';

/** Prefix used for non-selectable group header entries in the overlay dropdown */
const OVERLAY_GROUP_PREFIX = '__group_';

export class LCARdSRuleApplyEditor extends LitElement {
    static get properties() {
        return {
            value:               { type: Object },
            hass:                { type: Object },
            editor:              { type: Object },
            _overlayTargets:     { type: Array, state: true },
            _tags:               { type: Array, state: true },
            _yamlText:           { type: String, state: true },
            _yamlError:          { type: String, state: true },
            _yamlExpanded:       { type: Boolean, state: true },
            _addOverlayPending:  { type: Boolean, state: true },
            _newOverlayId:       { type: String, state: true }
        };
    }

    constructor() {
        super();
        this.value = {};
        this._overlayTargets = [];
        this._tags = [];
        this._yamlText = '';
        this._yamlError = '';
        this._yamlExpanded = false;
        this._addOverlayPending = false;
        this._newOverlayId = '';
    }

    static get styles() {
        return css`
            :host { display: block; }

            .overlay-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 8px;
            }

            .overlay-item {
                background: var(--secondary-background-color, rgba(0,0,0,0.05));
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 8px;
                overflow: hidden;
            }

            .overlay-item-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background: var(--card-background-color, #fff);
                border-bottom: 1px solid var(--divider-color, #e0e0e0);
            }

            .overlay-id {
                font-family: monospace;
                font-weight: 600;
                font-size: 13px;
            }

            .overlay-item-content {
                padding: 8px 12px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .quick-patches-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }

            .remove-btn {
                background: none;
                border: none;
                cursor: pointer;
                padding: 4px;
                border-radius: 4px;
                color: var(--error-color, #f44336);
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            .remove-btn:hover {
                background: var(--error-color, #f44336);
                color: white;
            }

            .add-overlay-row {
                display: flex;
                gap: 8px;
                align-items: flex-end;
                margin-top: 4px;
            }

            .add-overlay-row ha-selector {
                flex: 1;
                margin-bottom: 0;
            }

            .add-btn {
                display: flex;
                align-items: center;
                gap: 4px;
                background: none;
                border: 1px dashed var(--primary-color, #03a9f4);
                border-radius: 8px;
                color: var(--primary-color, #03a9f4);
                cursor: pointer;
                padding: 8px 16px;
                width: 100%;
                justify-content: center;
                font-size: 13px;
                transition: all 0.2s;
                margin-top: 4px;
            }

            .add-btn:hover {
                background: var(--primary-color, #03a9f4);
                color: white;
            }

            ha-selector {
                display: block;
                margin-bottom: 8px;
            }

            .yaml-area {
                width: 100%;
                min-height: 150px;
                font-family: 'Roboto Mono', monospace;
                font-size: 12px;
                padding: 8px;
                border: 1px solid var(--divider-color, #e0e0e0);
                border-radius: 4px;
                background: var(--secondary-background-color, #f5f5f5);
                color: var(--primary-text-color);
                resize: vertical;
                box-sizing: border-box;
            }

            .yaml-error {
                color: var(--error-color, #f44336);
                font-size: 12px;
                margin-top: 4px;
            }

            .section-gap {
                margin-bottom: 12px;
            }

            ha-button {
                margin-top: 4px;
            }
        `;
    }

    willUpdate(changedProps) {
        if (changedProps.has('value')) {
            this._syncFromValue();
        }
    }

    _syncFromValue() {
        const v = this.value || {};
        // Build overlay targets list from apply.overlays
        if (v.overlays && typeof v.overlays === 'object') {
            this._overlayTargets = Object.keys(v.overlays);
        } else {
            this._overlayTargets = [];
        }
        this._tags = v.tags || [];
        // Sync YAML
        try {
            this._yamlText = configToYaml(v);
            this._yamlError = '';
        } catch (err) {
            this._yamlError = String(err);
        }
    }

    _getAvailableOverlays() {
        try {
            return window.lcards?.core?.systemsManager?.getAllTargetableOverlays() || [];
        } catch (e) {
            return [];
        }
    }

    _getAvailableTags() {
        try {
            return window.lcards?.core?.systemsManager?.getAllTags() || [];
        } catch (e) {
            return [];
        }
    }

    _emit(newValue) {
        this.value = newValue;
        // Note: _syncFromValue() is called via willUpdate when .value changes — do NOT call it here too
        this.dispatchEvent(new CustomEvent('value-changed', {
            detail: { value: newValue },
            bubbles: true,
            composed: true
        }));
    }

    _getOverlayConfig(overlayId) {
        return (this.value?.overlays || {})[overlayId] || {};
    }

    _setOverlayPatch(overlayId, patchPath, patchValue) {
        const current = { ...(this.value || {}) };
        const overlays = { ...(current.overlays || {}) };
        // Deep set path in overlay config
        const overlay = this._deepSetPath({ ...(overlays[overlayId] || {}) }, patchPath, patchValue);
        overlays[overlayId] = overlay;
        this._emit({ ...current, overlays });
    }

    _deepSetPath(obj, path, value) {
        const parts = path.split('.');
        if (parts.length === 1) {
            return { ...obj, [parts[0]]: value };
        }
        const key = parts[0];
        const rest = parts.slice(1).join('.');
        return {
            ...obj,
            [key]: this._deepSetPath(obj[key] || {}, rest, value)
        };
    }

    _deepGetPath(obj, path) {
        const parts = path.split('.');
        let cur = obj;
        for (const p of parts) {
            if (!cur || typeof cur !== 'object') return undefined;
            cur = cur[p];
        }
        return cur;
    }

    _handleAddOverlay() {
        if (!this._newOverlayId || !this._newOverlayId.trim()) return;
        const id = this._newOverlayId.trim();
        // Reject group-header sentinel values that may be selected from the dropdown
        if (id.startsWith(OVERLAY_GROUP_PREFIX)) return;
        if (this._overlayTargets?.includes(id)) return;
        const current = { ...(this.value || {}) };
        const overlays = { ...(current.overlays || {}), [id]: {} };
        this._newOverlayId = '';
        this._addOverlayPending = false;
        this._emit({ ...current, overlays });
    }

    /**
     * Build grouped overlay options for the dropdown picker.
     * Groups overlays by sourceCardId.
     * @param {Array} overlays - Array of overlay metadata from systemsManager
     * @returns {Array} Array of { value, label } options
     * @private
     */
    _buildOverlayOptions(overlays) {
        if (!overlays || overlays.length === 0) return [];

        // Group by sourceCardId
        const grouped = {};
        for (const overlay of overlays) {
            const src = overlay.sourceCardId || 'unknown';
            if (!grouped[src]) grouped[src] = [];
            grouped[src].push(overlay);
        }

        // Flatten to options list with group labels as disabled separators
        const options = [];
        for (const [srcId, items] of Object.entries(grouped)) {
            options.push({ value: `${OVERLAY_GROUP_PREFIX}${srcId}`, label: `── ${srcId} ──`, disabled: true });
            for (const ov of items) {
                const tags = ov.tags?.length ? `  [${ov.tags.join(', ')}]` : '';
                options.push({ value: ov.id, label: `${ov.id}${tags}` });
            }
        }
        return options;
    }

    _handleRemoveOverlay(overlayId) {
        const current = { ...(this.value || {}) };
        const overlays = { ...(current.overlays || {}) };
        delete overlays[overlayId];
        this._emit({ ...current, overlays });
    }

    _handleTagsChange(e) {
        const tags = e.detail.value;
        const current = { ...(this.value || {}) };
        if (!tags || tags.length === 0) {
            delete current.tags;
        } else {
            current.tags = tags;
        }
        this._emit(current);
    }

    _handleYamlChange(e) {
        const text = e.target.value;
        this._yamlText = text;
        try {
            const parsed = yamlToConfig(text);
            this._yamlError = '';
            this._emit(parsed || {});
        } catch (err) {
            this._yamlError = `YAML error: ${err.message}`;
        }
    }

    render() {
        const availableOverlays = this._getAvailableOverlays();
        const availableTags = this._getAvailableTags();

        return html`
            <div @value-changed=${(e) => e.stopPropagation()}>
                <!-- Overlay Targets Section -->
                <lcards-form-section
                    class="section-gap"
                    header="Overlay Targets"
                    description="Target specific overlays and apply patches to them"
                    icon="mdi:layers"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <div class="overlay-list">
                        ${this._overlayTargets.map(overlayId => this._renderOverlayItem(overlayId))}
                    </div>

                    ${this._addOverlayPending ? html`
                        <div class="add-overlay-row">
                            ${availableOverlays.length > 0 ? html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${'Select Overlay'}
                                    .helper=${'Choose from live overlays or type a custom ID below'}
                                    .selector=${{ select: {
                                        mode: 'dropdown',
                                        custom_value: true,
                                        options: this._buildOverlayOptions(availableOverlays)
                                    } }}
                                    .value=${this._newOverlayId}
                                    @value-changed=${(e) => this._newOverlayId = e.detail.value}>
                                </ha-selector>
                            ` : html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${'Overlay ID'}
                                    .helper=${'No live overlays found — type an overlay ID manually'}
                                    .selector=${{ text: {} }}
                                    .value=${this._newOverlayId}
                                    @value-changed=${(e) => this._newOverlayId = e.detail.value}>
                                </ha-selector>
                            `}
                            <ha-button
                                variant="brand"
                                appearance="accent"
                                ?disabled=${!this._newOverlayId || (this._overlayTargets?.includes(this._newOverlayId.trim()) ?? false)}
                                @click=${this._handleAddOverlay}>
                                Add
                            </ha-button>
                            <ha-button
                                appearance="plain"
                                @click=${() => { this._addOverlayPending = false; this._newOverlayId = ''; }}>
                                Cancel
                            </ha-button>
                        </div>
                    ` : html`
                        <button class="add-btn" @click=${() => this._addOverlayPending = true}>
                            <ha-icon icon="mdi:plus"></ha-icon>
                            Add Overlay Target
                        </button>
                    `}
                </lcards-form-section>

                <!-- Tags Section -->
                <lcards-form-section
                    class="section-gap"
                    header="Tag Targeting"
                    description="Apply patches to all overlays with these tags"
                    icon="mdi:tag-multiple"
                    ?expanded=${false}
                    ?outlined=${false}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Tags'}
                        .selector=${{ select: {
                            multiple: true,
                            custom_value: true,
                            options: availableTags.map(t => typeof t === 'string' ? { value: t, label: t } : t)
                        } }}
                        .value=${this._tags}
                        @value-changed=${this._handleTagsChange}>
                    </ha-selector>
                </lcards-form-section>

                <!-- Advanced YAML Section -->
                <lcards-form-section
                    header="Advanced YAML"
                    description="Directly edit the full apply object as YAML"
                    icon="mdi:code-braces"
                    ?expanded=${this._yamlExpanded}
                    ?outlined=${false}
                    @expanded-changed=${(e) => this._yamlExpanded = e.detail.expanded}>

                    <textarea
                        class="yaml-area"
                        .value=${this._yamlText}
                        @input=${this._handleYamlChange}
                        spellcheck="false"
                        placeholder="overlays:\n  my_overlay:\n    style:\n      card:\n        color:\n          background:\n            active: 'var(--lcars-green)'">
                    </textarea>
                    ${this._yamlError ? html`<div class="yaml-error">${this._yamlError}</div>` : ''}
                </lcards-form-section>
            </div>
        `;
    }

    _renderOverlayItem(overlayId) {
        const overlayConfig = this._getOverlayConfig(overlayId);
        const bgColor = this._deepGetPath(overlayConfig, 'style.card.color.background.active') || '';
        const opacity = this._deepGetPath(overlayConfig, 'style.opacity') ?? '';
        const labelText = this._deepGetPath(overlayConfig, 'text.label') || '';

        return html`
            <div class="overlay-item">
                <div class="overlay-item-header">
                    <span class="overlay-id">${overlayId}</span>
                    <button class="remove-btn" @click=${() => this._handleRemoveOverlay(overlayId)} title="Remove overlay target">
                        <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                </div>
                <div class="overlay-item-content">
                    <div class="quick-patches-grid">
                        <!-- Background color -->
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Background Color'}
                            .selector=${{ text: {} }}
                            .value=${bgColor}
                            @value-changed=${(e) => this._setOverlayPatch(overlayId, 'style.card.color.background.active', e.detail.value)}>
                        </ha-selector>
                        <!-- Opacity -->
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Opacity (0–1)'}
                            .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' } }}
                            .value=${opacity !== '' ? Number(opacity) : 1}
                            @value-changed=${(e) => this._setOverlayPatch(overlayId, 'style.opacity', e.detail.value)}>
                        </ha-selector>
                    </div>
                    <!-- Label text -->
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Label Text'}
                        .selector=${{ text: {} }}
                        .value=${labelText}
                        @value-changed=${(e) => this._setOverlayPatch(overlayId, 'text.label', e.detail.value)}>
                    </ha-selector>
                </div>
            </div>
        `;
    }
}

customElements.define('lcards-rule-apply-editor', LCARdSRuleApplyEditor);
