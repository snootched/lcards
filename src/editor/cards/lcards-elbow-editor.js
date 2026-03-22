/**
 * @fileoverview LCARdS Elbow Editor
 *
 * Visual editor for LCARdS Elbow card with specialized UI for elbow geometry configuration.
 * Elbow cards extend lcards-button with LCARS elbow/corner treatments featuring 4 positions
 * and 2 styles (simple/segmented).
 *
 * Features:
 * - 7 main tabs: Config, Elbow Design, Text, Actions, Advanced, + 6 utility tabs
 * - Dynamic Elbow Design tab (changes based on simple/segmented style)
 * - Auto-calculation helpers for LCARS-formula curves
 * - State-based color editing for simple style
 * - Individual color pickers for segmented style segments
 * - Inherits button card functionality (text, actions, etc.)
 */

import { html } from 'lit';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { editorComponentStyles } from '../base/editor-component-styles.js';
import { configToYaml, yamlToConfig } from '../utils/yaml-utils.js';
import { getElbowSchema } from '../../cards/schemas/elbow-schema.js';
import '../components/shared/lcards-message.js';
import '../components/yaml/lcards-yaml-editor.js';
// Import shared form components
import '../components/shared/lcards-form-section.js';
import '../components/shared/lcards-color-picker.js';
// Import specialized editor components
import '../components/editors/lcards-grid-layout.js';
import '../components/editors/lcards-color-section-v2.js';
import '../components/editors/lcards-multi-text-editor-v2.js';
import '../components/editors/lcards-multi-action-editor.js';
import '../components/editors/lcards-padding-editor.js';
import '../components/editors/lcards-font-selector.js';
// Import animation and filter components
import '../components/lcards-animation-editor.js';
import '../components/lcards-filter-editor.js';
import '../components/lcards-shape-texture-editor.js';
// Import dashboard components
import '../components/dashboard/lcards-rules-dashboard.js';
// Import datasource components
import '../components/datasources/lcards-datasource-editor-tab.js';
// Import template components
import '../components/templates/lcards-template-evaluation-tab.js';
import '../components/theme-browser/lcards-theme-token-browser-tab.js';
import '../components/provenance/lcards-provenance-tab.js';

// @ts-ignore - TS2417: static side extends - getConfigElement signature
export class LCARdSElbowEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'elbow';
        this._cardElement = null;
        this._symbioCardPickerDialogRef = null;
        this._symbioCardEditorDialogRef = null;
        this._yamlDebounceTimer = null;
        this._cssDebounceTimer = null;
    }

    /**
     * Called after first render — find the live card preview element
     * @override
     */
    firstUpdated() {
        super.firstUpdated?.(/** @type {any} */ ({}));
        this._tryFindCardElement();
    }

    /**
     * Retry finding the card element across animation frames
     * @private
     */
    _tryFindCardElement() {
        let attempts = 0;
        const maxAttempts = 10;
        const tryFind = () => {
            attempts++;
            this._findCardElement();
            if (!this._cardElement && attempts < maxAttempts) {
                requestAnimationFrame(tryFind);
            }
        };
        requestAnimationFrame(tryFind);
    }

    /**
     * Locate the live card preview element by traversing the HA editor DOM.
     *
     * DOM structure in HA card editor:
     *   hui-dialog-edit-card > ha-dialog (shadow) > .content
     *     ├─ .element-editor  ← this editor lives here
     *     └─ .element-preview ← card preview lives here
     * @private
     */
    _findCardElement() {
        const cardType = `lcards-${this.cardType}`;

        if (this._cardElement?.isConnected) return;

        let card = null;

        const wrapper = this.closest('.wrapper');
        if (wrapper) {
            const shadowRoot = wrapper.getRootNode();
            if (shadowRoot && shadowRoot !== document) {
                // @ts-ignore - TS2339: auto-suppressed
                const shadowHost = shadowRoot.host;
                if (shadowHost) {
                    const editorContainer = shadowHost.parentElement;
                    if (editorContainer) {
                        const content = editorContainer.parentElement;
                        if (content) {
                            const preview = content.querySelector('.element-preview');
                            if (preview) {
                                const searchInShadows = (root, depth = 0) => {
                                    if (depth > 5) return null;
                                    const found = root.querySelector(cardType);
                                    if (found) return found;
                                    const elements = root.querySelectorAll('*');
                                    for (const el of elements) {
                                        if (el.shadowRoot) {
                                            const inShadow = searchInShadows(el.shadowRoot, depth + 1);
                                            if (inShadow) return inShadow;
                                        }
                                    }
                                    return null;
                                };
                                card = preview.querySelector(cardType) || searchInShadows(preview);
                            }
                        }
                    }
                }
            }
        }

        // Fallback: global search
        if (!card) {
            card = document.querySelector(cardType);
            if (!card) {
                for (const el of document.querySelectorAll('*')) {
                    if (el.shadowRoot) {
                        card = el.shadowRoot.querySelector(cardType);
                        if (card) break;
                    }
                }
            }
        }

        if (card && card !== this._cardElement) {
            this._cardElement = card;
            this.requestUpdate();
        }
    }

    /**
     * Listen for card-picker-result events dispatched by the picker dialog.
     * @override
     */
    connectedCallback() {
        super.connectedCallback?.();
        this._boundHandleCardPickerResult = this._handleSymbiontCardPickerResult.bind(this);
        document.addEventListener('lcards-symbiont-card-picker-result', this._boundHandleCardPickerResult);
    }

    /**
     * Clean up dialog and event listener.
     * @override
     */
    disconnectedCallback() {
        super.disconnectedCallback?.();
        if (this._boundHandleCardPickerResult) {
            document.removeEventListener('lcards-symbiont-card-picker-result', this._boundHandleCardPickerResult);
        }
        if (this._symbioCardPickerDialogRef) {
            this._symbioCardPickerDialogRef.remove();
            this._symbioCardPickerDialogRef = null;
        }
        if (this._symbioCardEditorDialogRef) {
            this._symbioCardEditorDialogRef.remove();
            this._symbioCardEditorDialogRef = null;
        }
        clearTimeout(this._yamlDebounceTimer);
        clearTimeout(this._cssDebounceTimer);
    }

    static get styles() {
        return [super.styles, editorComponentStyles];
    }

    /**
     * Get tab definitions for the elbow editor
     * @returns {Array<{label: string, content: Function}>}
     * @private
     */
    _getTabDefinitions() {
        return [
            { label: 'Config', content: () => this._renderFromConfig(this._getConfigTabConfig()) },
            { label: 'Elbow Design', content: () => this._renderElbowDesignTab() },
            { label: 'Text', content: () => this._renderTextTab() },
            { label: 'Symbiont', content: () => this._renderSymbiontTab() },
            { label: 'Actions', content: () => this._renderActionsTab() },
            { label: 'Effects', content: () => this._renderEffectsTab() },
            { label: 'Sound', content: () => this._renderSoundTab() },
            ...this._getUtilityTabs()
        ];
    }

    // ──────────────────────────────────────────────────────────────
    // Symbiont Card Picker
    // ──────────────────────────────────────────────────────────────

    /**
     * Open hui-card-picker in a dialog so the user can select the symbiont
     * card type without hand-editing YAML.
     *
     * Pattern mirrors lcards-msd-editor._handleCardPickerRequest().
     * Result is returned via a document event 'lcards-symbiont-card-picker-result'
     * to avoid issues with shadow-DOM event boundaries.
     * @private
     */
    async _openSymbiontCardPicker() {
        // hui-card-picker is loaded in the background by connectedCallback.
        // If it still isn't available, bail with a helpful message rather than
        // re-triggering ll-create-card (which would show HA's native Add-Card
        // dialog visibly in the sidebar).
        if (!customElements.get('hui-card-picker')) {
            lcardsLog.warn('[ElbowEditor] hui-card-picker not loaded yet. Click "Add Card" on the dashboard once to prime it, then try again.');
            // Show a transient notification via HA if possible
            try {
                const ha = document.querySelector('home-assistant');
                // @ts-ignore - TS2339: auto-suppressed
                if (ha?.showToast) {
                    // @ts-ignore - TS2339: auto-suppressed
                    ha.showToast({ message: 'Card picker loading… please try again in a moment.', duration: 3000 });
                } else {
                    alert('Card picker not ready yet. Click "Add Card" on any dashboard view once to enable it, then try again.');
                }
            } catch (_) { /* ignore */ }
            return;
        }

        // Close any already-open picker
        if (this._symbioCardPickerDialogRef) {
            this._symbioCardPickerDialogRef.remove();
            this._symbioCardPickerDialogRef = null;
        }

        const dialog = document.createElement('ha-dialog');
        // @ts-ignore - TS2339: auto-suppressed
        dialog.headerTitle = 'Select Symbiont Card Type';

        this._symbioCardPickerDialogRef = dialog;
        document.body.appendChild(dialog);
        // @ts-ignore - TS2339: auto-suppressed
        dialog.open = true;

        // @ts-ignore - TS2339: auto-suppressed
        await dialog.updateComplete;

        const picker = document.createElement('hui-card-picker');
        // CRITICAL: set hass and lovelace BEFORE appending so firstUpdated has data
        // @ts-ignore - TS2339: auto-suppressed
        picker.hass = this.hass;
        // @ts-ignore - TS2339: auto-suppressed
        picker.lovelace = this._getSymbiontLovelace();
        picker.style.cssText = 'padding: 24px; display: block;';
        dialog.appendChild(picker);

        await new Promise(r => setTimeout(r, 100));
        // @ts-ignore - TS2339: auto-suppressed
        picker.requestUpdate?.();
        // @ts-ignore - TS2339: auto-suppressed
        if (picker.updateComplete) await picker.updateComplete;

        picker.addEventListener('config-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            const selectedConfig = e.detail?.config;
            lcardsLog.debug('[ElbowEditor] Symbiont card type selected:', selectedConfig?.type);

            document.dispatchEvent(new CustomEvent('lcards-symbiont-card-picker-result', {
                detail: { config: selectedConfig }
            }));

            // @ts-ignore - TS2339: auto-suppressed
            dialog.open = false;
        });

        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._symbioCardPickerDialogRef === dialog) {
                this._symbioCardPickerDialogRef = null;
            }
        });
    }

    /**
     * Handle card-picker result — update symbiont.card config.
     * @param {CustomEvent} e
     * @private
     */
    _handleSymbiontCardPickerResult(e) {
        const config = e.detail?.config;
        if (!config) return;
        lcardsLog.debug('[ElbowEditor] Applying symbiont card config from picker:', config.type);
        this._setConfigValue('symbiont.card', config);
    }

    /**
     * Open hui-card-element-editor in a dialog to graphically configure the
     * selected symbiont card. Pattern mirrors MSD studio's card editor modal.
     * @private
     */
    async _openSymbiontCardEditor() {
        const currentCard = this.config?.symbiont?.card;
        if (!currentCard?.type) return;

        if (!customElements.get('hui-card-element-editor')) {
            lcardsLog.warn('[ElbowEditor] hui-card-element-editor not available yet');
            return;
        }

        // Close any already-open editor
        if (this._symbioCardEditorDialogRef) {
            this._symbioCardEditorDialogRef.remove();
            this._symbioCardEditorDialogRef = null;
        }

        const dialog = document.createElement('ha-dialog');
        // @ts-ignore - TS2339: auto-suppressed
        dialog.headerTitle = `Edit: ${currentCard.type}`;
        dialog.setAttribute('prevent-scrim-close', '');
        this._symbioCardEditorDialogRef = dialog;

        const container = document.createElement('div');
        container.style.cssText = 'padding: 16px; min-height: 300px; min-width: 420px; box-sizing: border-box;';

        const editor = document.createElement('hui-card-element-editor');
        // @ts-ignore - TS2339: auto-suppressed
        editor.hass = this.hass;
        // @ts-ignore - TS2339: auto-suppressed
        editor.lovelace = this._getSymbiontLovelace();
        // @ts-ignore - TS2339: auto-suppressed
        editor.value = JSON.parse(JSON.stringify(currentCard));

        let tempConfig = JSON.parse(JSON.stringify(currentCard));

        editor.addEventListener('config-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            if (e.detail?.config && typeof e.detail.config === 'object' && e.detail.config.type) {
                // @ts-ignore - TS2339: auto-suppressed
                tempConfig = e.detail.config;
            }
        });
        editor.addEventListener('value-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            if (e.detail?.value && typeof e.detail.value === 'object' && e.detail.value.type) {
                // @ts-ignore - TS2339: auto-suppressed
                tempConfig = e.detail.value;
            }
        });

        container.appendChild(editor);
        dialog.appendChild(container);

        const actionsDiv = document.createElement('div');
        actionsDiv.slot = 'footer';
        actionsDiv.style.cssText = 'display:flex; gap:8px;';

        const cancelButton = document.createElement('ha-button');
        cancelButton.textContent = 'Cancel';
        // @ts-ignore - TS2339: auto-suppressed
        cancelButton.addEventListener('click', () => { dialog.open = false; });

        const saveButton = document.createElement('ha-button');
        saveButton.textContent = 'Save';
        saveButton.addEventListener('click', () => {
            if (tempConfig?.type) {
                this._setConfigValue('symbiont.card', JSON.parse(JSON.stringify(tempConfig)));
                lcardsLog.debug('[ElbowEditor] Symbiont card config saved from editor:', tempConfig.type);
            }
            // @ts-ignore - TS2339: auto-suppressed
            dialog.open = false;
        });

        actionsDiv.appendChild(cancelButton);
        actionsDiv.appendChild(saveButton);
        dialog.appendChild(actionsDiv);

        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._symbioCardEditorDialogRef === dialog) {
                this._symbioCardEditorDialogRef = null;
            }
        });

        document.body.appendChild(dialog);
        // @ts-ignore - TS2339: auto-suppressed
        setTimeout(() => { dialog.open = true; }, 10);
        lcardsLog.debug('[ElbowEditor] Opened symbiont card editor dialog for:', currentCard.type);
    }

    /**
     * Get the lovelace config for hui-card-picker / hui-card-element-editor.
     *
     * IMPORTANT: hui-card-picker expects a plain LovelaceConfig object with `views`
     * at the root — NOT the full lovelace wrapper (which has `config`, `saveConfig`, etc.).
     * Pattern mirrors lcards-msd-editor._getLovelace() exactly.
     * @returns {Object}
     * @private
     */
    _getSymbiontLovelace() {
        // Unwrap: if lovelace is the wrapper object, pull its .config; otherwise use it directly
        let lovelaceConfig = this.lovelace?.config || this.lovelace || {};

        // Ensure views exists
        if (!lovelaceConfig.views) {
            lovelaceConfig = { ...lovelaceConfig, views: [] };
        }

        // hui-card-picker needs at least one view to render
        if (lovelaceConfig.views.length === 0) {
            lovelaceConfig = {
                ...lovelaceConfig,
                views: [{ title: 'Home', path: 'home', cards: [] }]
            };
        }

        return lovelaceConfig;
    }

    // ──────────────────────────────────────────────────────────────
    // Component Lookup Helpers
    // ──────────────────────────────────────────────────────────────

    /**
     * Get an elbow component by type via ComponentManager.
     * @param {string} type
     * @returns {Object|undefined}
     * @private
     */
    _getElbowComponent(type) {
        return window.lcards?.core?.componentManager?.getComponent(type);
    }

    /**
     * Return all elbow component entries as [[name, definition], ...] pairs.
     * @returns {Array<[string, Object]>}
     * @private
     */
    _getElbowComponentEntries() {
        const cm = window.lcards?.core?.componentManager;
        if (!cm) return [];
        return cm.getComponentsByType('elbow')
            .map(name => [name, cm.getComponent(name)]);
    }

    /**
     * Config tab - Elbow configuration and basic settings
     * @returns {Array} Config tab definition
     * @private
     */
    _getConfigTabConfig() {
        const elbowType = this.config.elbow?.type || 'header-left';
        const elbowStyle = this._getElbowStyle();

        // Get supported styles from component features
        const component = this._getElbowComponent(elbowType);
        const supportedFeatures = component?.features || ['simple'];
        const supportsSegmented = supportedFeatures.includes('segmented');

        // Build style options based on component support
        const styleOptions = [
            { value: 'simple', label: 'Simple (single elbow)' }
        ];

        if (supportsSegmented) {
            styleOptions.push({ value: 'segmented', label: 'Segmented (Picard-style double)' });
        }

        // @ts-ignore - TS2345: auto-suppressed
        return [...this._buildConfigTab({
            infoMessage: 'Configure your LCARS elbow card. Elbows are positioned borders with rounded corners that create the iconic LCARS interface aesthetic.',
            modeSections: [
                {
                    type: 'section',
                    header: 'Elbow Configuration',
                    description: 'Choose elbow position and style',
                    icon: 'mdi:vector-polyline',
                    expanded: false,
                    outlined: true,
                    children: [
                        {
                            type: 'custom',
                            render: () => html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${'Elbow Position'}
                                    .helper=${'Position of the elbow corner on the card'}
                                    .selector=${{
                                        select: {
                                            mode: 'dropdown',
                                            options: this._getElbowComponentEntries().map(([key, component]) => ({
                                                value: key,
                                                label: component.metadata?.name || key
                                            }))
                                        }
                                    }}
                                    .value=${elbowType}
                                    @value-changed=${this._handleElbowTypeChange}>
                                </ha-selector>

                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${'Elbow Style'}
                                    .helper=${supportsSegmented
                                        ? (elbowStyle === 'simple'
                                            ? 'Simple: Single elbow with one curve'
                                            : 'Segmented: Double concentric elbows with gap (TNG aesthetic)')
                                        : 'This component only supports simple style'}
                                    .selector=${{
                                        select: {
                                            mode: 'dropdown',
                                            options: styleOptions
                                        }
                                    }}
                                    .value=${elbowStyle}
                                    .disabled=${!supportsSegmented}
                                    @value-changed=${this._handleStyleChange}>
                                </ha-selector>
                            `
                        }
                    ]
                }
            ],
            basicFields: [
                { path: 'entity', label: 'Entity', helper: '[Optional] Entity to control' },
                { path: 'id', label: 'Card ID', helper: '[Optional] Custom ID for targeting with rules and animations' },
                { path: 'tags', label: 'Tags', helper: 'Select existing tags or type new ones for rule targeting' }
            ]
        }),
        {
            type: 'section',
            header: 'Sizing',
            description: 'Override card dimensions — useful in stacks, overlays, or any auto-height container',
            icon: 'mdi:resize',
            expanded: false,
            outlined: true,
            children: [
                {
                    type: 'grid',
                    columns: 2,
                    children: [
                        { type: 'field', path: 'height' },
                        { type: 'field', path: 'width' }
                    ]
                }
            ]
        }
        ];
    }

    /**
     * Elbow Design tab - Geometry and colors configuration
     * Dynamically changes based on simple vs segmented style
     * @returns {TemplateResult}
     * @private
     */
    _renderElbowDesignTab() {
        const elbowType  = this.config.elbow?.type  || 'header-left';
        const elbowStyle = this._getElbowStyle();

        if (elbowType === 'frame') {
            return this._renderFrameDesign();
        }

        if (elbowStyle === 'segmented') {
            return this._renderSegmentedDesign();
        } else {
            return this._renderSimpleDesign();
        }
    }

    /**
     * Render frame design section — per-side widths, per-corner curves, segmented ring
     * @returns {TemplateResult}
     * @private
     */
    _renderFrameDesign() {
        const frame = this.config.elbow?.frame || {};
        const elbowStyle = this._getElbowStyle();
        const isSegmented = elbowStyle === 'segmented';

        // Shorthand defaults (mirrors _validateElbowConfig logic)
        const defBW = frame.bar_width  ?? 90;
        const defBH = frame.bar_height ?? defBW;
        const defOC = frame.outer_curve ?? Math.round(defBW / 2);
        const defIC = frame.inner_curve ?? Math.round(defOC / 2);

        const sideThickness = (key) => {
            const s = frame[key] || {};
            const rawVal = s.bar_width ?? s.bar_height ?? s.thickness;
            if (rawVal !== undefined) return rawVal;
            return (key === 'top' || key === 'bottom') ? defBH : defBW;
        };
        const sideEnabled = (key) => (frame[key] || {}).enabled !== false;

        // Segmented inner frame
        const innerFc   = frame.segments?.inner_frame || {};
        const iDefBW    = innerFc.bar_width  ?? 28;
        const iDefBH    = innerFc.bar_height ?? iDefBW;
        const iDefOC    = innerFc.outer_curve ?? Math.round(iDefBW / 2);
        const iDefIC    = innerFc.inner_curve ?? Math.round(iDefOC / 2);
        const segGap    = frame.segments?.gap ?? 4;

        const cornerOuter = (ck) => frame.corners?.[ck]?.outer_curve ?? defOC;
        const cornerInner = (ck) => frame.corners?.[ck]?.inner_curve ?? defIC;

        const renderSideRow = (key, label) => html`
            <div style="display: flex; align-items: center; gap: 12px; padding: 4px 0;">
                <ha-selector
                    style="flex: 0 0 140px;"
                    .hass=${this.hass}
                    .label=${label}
                    .selector=${{ boolean: {} }}
                    .value=${sideEnabled(key)}
                    @value-changed=${(e) => this._setConfigValue(`elbow.frame.${key}.enabled`, e.detail.value)}>
                </ha-selector>
                ${sideEnabled(key) ? html`
                    <ha-selector
                        style="flex: 1;"
                        .hass=${this.hass}
                        .label=${'Thickness (px)'}
                        .selector=${{ number: { min: 1, max: 500, step: 1, mode: 'box', unit_of_measurement: 'px' } }}
                        .value=${sideThickness(key)}
                        @value-changed=${(e) => {
                            const k = (key === 'top' || key === 'bottom') ? 'bar_height' : 'bar_width';
                            this._setConfigValue(`elbow.frame.${key}.${k}`, e.detail.value);
                        }}>
                    </ha-selector>
                ` : ''}
            </div>
        `;

        const renderCornerRow = (ck, label) => {
            const isOpenCorner = (ck.includes('right') && !sideEnabled('right'))
                              || (ck.includes('left')  && !sideEnabled('left'))
                              || (ck.includes('top')   && !sideEnabled('top'))
                              || (ck.includes('bottom') && !sideEnabled('bottom'));
            const outerLabel = isOpenCorner ? 'End cap outer (px)' : 'Outer curve (px)';
            const innerLabel = isOpenCorner ? 'End cap inner (px)' : 'Inner curve (px)';
            return html`
                <div style="display: flex; align-items: center; gap: 8px; padding: 2px 0;">
                    <span style="flex: 0 0 130px; font-size: 13px; color: var(--secondary-text-color);">${label}</span>
                    <ha-selector
                        style="flex: 1;"
                        .hass=${this.hass}
                        .label=${outerLabel}
                        .selector=${{ number: { min: 0, max: 250, step: 1, mode: 'box', unit_of_measurement: 'px' } }}
                        .value=${cornerOuter(ck)}
                        @value-changed=${(e) => this._setConfigValue(`elbow.frame.corners.${ck}.outer_curve`, e.detail.value)}>
                    </ha-selector>
                    <ha-selector
                        style="flex: 1;"
                        .hass=${this.hass}
                        .label=${innerLabel}
                        .helper=${'Rounded curve on the inner corner of the bar; only applied when both adjacent sides are enabled'}
                        .selector=${{ number: { min: 0, max: 250, step: 1, mode: 'box', unit_of_measurement: 'px' } }}
                        .value=${cornerInner(ck)}
                        @value-changed=${(e) => this._setConfigValue(`elbow.frame.corners.${ck}.inner_curve`, e.detail.value)}>
                    </ha-selector>
                </div>
            `;
        };

        return html`
            <lcards-message
                type="info"
                message="Frame type draws a rectangular border (ring) around the card. Each side can be independently enabled/disabled and sized. Open sides get rounded end-caps via the corner curves.">
            </lcards-message>

            <!-- Shorthand defaults -->
            <lcards-form-section
                header="Default Dimensions"
                description="Shorthand values applied to all sides/corners unless individually overridden below"
                icon="mdi:border-all"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector .hass=${this.hass}
                    .label=${'Default Side Width (left/right)'}
                    .helper=${'Applied to left and right bars unless overridden'}
                    .selector=${{ number: { min: 1, max: 500, step: 1, mode: 'slider', unit_of_measurement: 'px' } }}
                    .value=${defBW}
                    @value-changed=${(e) => this._setConfigValue('elbow.frame.bar_width', e.detail.value)}>
                </ha-selector>

                <ha-selector .hass=${this.hass}
                    .label=${'Default Side Height (top/bottom)'}
                    .helper=${'Applied to top and bottom bars unless overridden'}
                    .selector=${{ number: { min: 1, max: 500, step: 1, mode: 'slider', unit_of_measurement: 'px' } }}
                    .value=${defBH}
                    @value-changed=${(e) => this._setConfigValue('elbow.frame.bar_height', e.detail.value)}>
                </ha-selector>

                <ha-selector .hass=${this.hass}
                    .label=${'Default Outer Corner Curve'}
                    .helper=${'Outer corner/end-cap arc radius — applied to all 4 corners unless overridden'}
                    .selector=${{ number: { min: 0, max: 250, step: 1, mode: 'slider', unit_of_measurement: 'px' } }}
                    .value=${defOC}
                    @value-changed=${(e) => this._setConfigValue('elbow.frame.outer_curve', e.detail.value)}>
                </ha-selector>

                <ha-selector .hass=${this.hass}
                    .label=${'Default Inner Corner Curve'}
                    .helper=${'Default inner corner curve; only applied when both adjacent sides are enabled — open-side corners are always square'}
                    .selector=${{ number: { min: 0, max: 250, step: 1, mode: 'slider', unit_of_measurement: 'px' } }}
                    .value=${defIC}
                    @value-changed=${(e) => this._setConfigValue('elbow.frame.inner_curve', e.detail.value)}>
                </ha-selector>
            </lcards-form-section>

            <!-- Per-side control -->
            <lcards-form-section
                header="Per-Side Control"
                description="Enable or disable each side and override its thickness. Disabled sides create open ends with rounded end-caps."
                icon="mdi:border-style"
                ?expanded=${true}
                ?outlined=${true}>

                ${renderSideRow('top',    'Top bar')}
                ${renderSideRow('bottom', 'Bottom bar')}
                ${renderSideRow('left',   'Left bar')}
                ${renderSideRow('right',  'Right bar')}
            </lcards-form-section>

            <!-- Per-corner curves -->
            <lcards-form-section
                header="Per-Corner Curves"
                description="Override outer and inner arc radii per corner. When an adjacent side is disabled, these become end-cap arcs."
                icon="mdi:vector-curve"
                ?expanded=${false}
                ?outlined=${true}>

                ${renderCornerRow('top_left',     'Top-left')}
                ${renderCornerRow('top_right',    'Top-right')}
                ${renderCornerRow('bottom_left',  'Bottom-left')}
                ${renderCornerRow('bottom_right', 'Bottom-right')}
            </lcards-form-section>

            <!-- Segmented (double ring) -->
            ${isSegmented ? html`
                <lcards-form-section
                    header="Inner Ring (Segmented)"
                    description="Configure the inner frame ring dimensions. The inner ring is inset from the outer ring by the gap."
                    icon="mdi:border-inside"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector .hass=${this.hass}
                        .label=${'Gap between rings (px)'}
                        .selector=${{ number: { min: 0, max: 50, step: 1, mode: 'box', unit_of_measurement: 'px' } }}
                        .value=${segGap}
                        @value-changed=${(e) => this._setConfigValue('elbow.frame.segments.gap', e.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${'Inner ring width (left/right)'}
                        .selector=${{ number: { min: 1, max: 500, step: 1, mode: 'slider', unit_of_measurement: 'px' } }}
                        .value=${iDefBW}
                        @value-changed=${(e) => this._setConfigValue('elbow.frame.segments.inner_frame.bar_width', e.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${'Inner ring height (top/bottom)'}
                        .selector=${{ number: { min: 1, max: 500, step: 1, mode: 'slider', unit_of_measurement: 'px' } }}
                        .value=${iDefBH}
                        @value-changed=${(e) => this._setConfigValue('elbow.frame.segments.inner_frame.bar_height', e.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${'Inner ring outer curve'}
                        .selector=${{ number: { min: 0, max: 250, step: 1, mode: 'slider', unit_of_measurement: 'px' } }}
                        .value=${iDefOC}
                        @value-changed=${(e) => this._setConfigValue('elbow.frame.segments.inner_frame.outer_curve', e.detail.value)}>
                    </ha-selector>

                    <ha-selector .hass=${this.hass}
                        .label=${'Inner ring inner curve'}
                        .helper=${'Inner ring corner curve; only applied when both adjacent sides are enabled — open-side corners are always square'}
                        .selector=${{ number: { min: 0, max: 250, step: 1, mode: 'slider', unit_of_measurement: 'px' } }}
                        .value=${iDefIC}
                        @value-changed=${(e) => this._setConfigValue('elbow.frame.segments.inner_frame.inner_curve', e.detail.value)}>
                    </ha-selector>
                </lcards-form-section>

                <lcards-form-section
                    header="Inner Ring Colours"
                    description="State-based colours for the inner (secondary) frame ring"
                    icon="mdi:palette-outline"
                    ?expanded=${false}
                    ?outlined=${true}>

                    <lcards-color-section-v2
                        .editor=${this}
                        .entityId=${this.config?.entity || ''}
                        basePath="elbow.frame.segments.inner_frame.color"
                        header="Inner Ring Colours"
                        description="Inner ring colour per entity state"
                        .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                        ?allowCustomStates=${true}
                        ?expanded=${false}>
                    </lcards-color-section-v2>
                </lcards-form-section>
            ` : ''}

            <!-- Frame colour -->
            <lcards-form-section
                header="Frame Colours"
                description="State-based colours for the frame ring"
                icon="mdi:palette"
                ?expanded=${true}
                ?outlined=${true}>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="elbow.segment.color"
                    header="Frame Colours"
                    description="Frame colour per entity state"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            ${this._renderShapeTextureSection()}
        `;
    }

    /**
     * Render simple style design section
     * @returns {TemplateResult}
     * @private
     */
    _renderSimpleDesign() {
        const segment = this.config.elbow?.segment || {};
        // Preserve 'theme' strings - don't default them to numbers
        const barWidth = segment.bar_width !== undefined ? segment.bar_width : 90;
        const barHeight = segment.bar_height !== undefined ? segment.bar_height : barWidth;
        const outerCurve = segment.outer_curve ?? 'auto';
        const isOuterAuto = outerCurve === 'auto';
        const innerCurve = segment.inner_curve;

        // Calculate auto values for helper text (handle 'theme' case)
        const numericBarWidth = typeof barWidth === 'number' ? barWidth : 90;
        const numericBarHeight = typeof barHeight === 'number' ? barHeight : 90;
        const calculatedOuterCurve = numericBarWidth / 2;
        const calculatedInnerCurve = (isOuterAuto ? calculatedOuterCurve : outerCurve) / 2;

        return html`
            <lcards-message
                type="info"
                message="Configure dimensions and curves for your simple elbow. Bar dimensions control thickness, while outer_curve/inner_curve control the depth (scale) of the diagonal cut into the corner - independent of bar thickness.">
            </lcards-message>

            <!-- Visual Diagram -->
            <lcards-form-section
                header="Elbow Geometry Diagram"
                description="Visual reference for understanding elbow dimensions"
                icon="mdi:ruler"
                ?expanded=${true}
                ?outlined=${true}>

                <div style="padding: 30px; background: var(--ha-card-background, #1c1c1c); border-radius: var(--ha-card-border-radius, 12px); text-align: center;">
                    <svg viewBox="0 0 400 250" style="max-width: 500px; width: 100%; height: auto;">
                        <!-- Background -->
                        <rect x="0" y="0" width="400" height="300" fill="transparent" stroke="none"/>

                        <!-- Example Elbow (header-left style) -->
                        <g id="elbow-example">
                            <!-- Vertical bar (bar_width controls this) -->
                            <rect x="50" y="50" width="80" height="200" fill="var(--primary-color, #FF9900)" opacity="0.7"/>
                            <!-- Horizontal bar (bar_height controls this) -->
                            <rect x="50" y="50" width="300" height="30" fill="var(--primary-color, #FF9900)" opacity="0.7"/>

                            <!-- Outer arc (outer_curve) - the "bite" depth -->
                            <path d="M 130 50 A 44 40 0 0 0 48 100"
                                  fill="none"
                                  stroke="var(--accent-color, #00FFFF)"
                                  stroke-width="3"
                                  stroke-dasharray="5,5"/>
                            <!-- Outer diagonal extension line showing depth -->
                            <line x1="90" y1="50" x2="90" y2="90"
                                  stroke="var(--accent-color, #00FFFF)"
                                  stroke-width="1"
                                  stroke-dasharray="2,2"
                                  opacity="0.5"/>

                            <!-- Inner arc (inner_curve) -->
                            <path d="M 130 80 A 20 20 0 0 0 110 100"
                                  fill="none"
                                  stroke="var(--warning-color, #FFAA00)"
                                  stroke-width="3"
                                  stroke-dasharray="5,5"/>
                            <!-- Inner diagonal extension line -->
                            <line x1="110" y1="80" x2="110" y2="100"
                                  stroke="var(--warning-color, #FFAA00)"
                                  stroke-width="1"
                                  stroke-dasharray="2,2"
                                  opacity="0.5"/>
                        </g>

                        <!-- Labels with arrows -->
                        <!-- bar_width label -->
                        <line x1="50" y1="200" x2="160" y2="200" stroke="white" stroke-width="2" marker-end="url(#arrowhead)"/>
                        <text x="165" y="195" fill="white" font-size="14" font-weight="bold">bar_width</text>
                        <text x="165" y="210" fill="white" font-size="11" opacity="0.7">(vertical thickness)</text>

                        <!-- bar_height label -->
                        <line x1="200" y1="80" x2="200" y2="35" stroke="white" stroke-width="2" marker-end="url(#arrowhead)"/>
                        <text x="165" y="14" fill="white" font-size="14" font-weight="bold">bar_height</text>
                        <text x="165" y="30" fill="white" font-size="11" opacity="0.7">(horizontal thickness)</text>

                        <!-- outer_curve label -->
                        <line x1="90" y1="70" x2="67" y2="38" stroke="var(--accent-color, #00FFFF)" stroke-width="2" marker-end="url(#arrowhead-cyan)"/>
                        <text x="0" y="12" fill="var(--accent-color, #00FFFF)" font-size="14" font-weight="bold">outer_curve</text>
                        <text x="0" y="26" fill="var(--accent-color, #00FFFF)" font-size="11" opacity="0.9">(cut depth/scale)</text>

                        <!-- inner_curve label -->
                        <line x1="120" y1="90" x2="160" y2="120" stroke="var(--warning-color, #FFAA00)" stroke-width="2" marker-end="url(#arrowhead-yellow)"/>
                        <text x="165" y="135" fill="var(--warning-color, #FFAA00)" font-size="14" font-weight="bold">inner_curve</text>
                        <text x="165" y="150" fill="var(--warning-color, #FFAA00)" font-size="11" opacity="0.9">(inner cut depth)</text>

                        <!-- Arrow markers -->
                        <defs>
                            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                <polygon points="0 0, 10 3, 0 6" fill="white" />
                            </marker>
                            <marker id="arrowhead-cyan" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                <polygon points="0 0, 10 3, 0 6" fill="var(--accent-color, #00FFFF)" />
                            </marker>
                            <marker id="arrowhead-yellow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
                                <polygon points="0 0, 10 3, 0 6" fill="var(--warning-color, #FFAA00)" />
                            </marker>
                        </defs>
                    </svg>
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Bar Dimensions"
                description="Configure the thickness of the elbow bars (static values or dynamic theme binding)"
                icon="mdi:resize"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Width Mode (Vertical)'}
                    .helper=${barWidth === 'theme'
                        ? '🎨 Dynamic: Binds to input_number.lcars_vertical helper'
                        : '📏 Static: Fixed pixel value'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'theme', label: 'Theme Binding (input_number.lcars_vertical)' }
                            ]
                        }
                    }}
                    .value=${barWidth === 'theme' ? 'theme' : 'static'}
                    @value-changed=${(e) => this._handleBarWidthModeChange(e)}>
                </ha-selector>

                ${barWidth !== 'theme' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Bar Width (Vertical)'}
                        .helper=${'Thickness of the vertical sidebar'}
                        .selector=${{
                            number: {
                                min: 10,
                                max: 500,
                                step: 5,
                                mode: 'slider',
                                unit_of_measurement: 'px'
                            }
                        }}
                        .value=${typeof barWidth === 'number' ? barWidth : 90}
                        @value-changed=${(e) => this._setConfigValue('elbow.segment.bar_width', e.detail.value)}>
                    </ha-selector>
                ` : html`
                    <lcards-message type="info" title="Theme Integration">
                        Bar width will dynamically follow <code>input_number.lcars_vertical</code> entity state.
                        Create this helper in Home Assistant configuration to enable theme integration.
                    </lcards-message>
                `}

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Height Mode (Horizontal)'}
                    .helper=${barHeight === 'theme'
                        ? '🎨 Dynamic: Binds to input_number.lcars_horizontal helper'
                        : '📏 Static: Fixed pixel value'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'theme', label: 'Theme Binding (input_number.lcars_horizontal)' }
                            ]
                        }
                    }}
                    .value=${barHeight === 'theme' ? 'theme' : 'static'}
                    @value-changed=${(e) => this._handleBarHeightModeChange(e)}>
                </ha-selector>

                ${barHeight !== 'theme' ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Bar Height (Horizontal)'}
                        .helper=${'Thickness of the horizontal bar'}
                        .selector=${{
                            number: {
                                min: 10,
                                max: 500,
                                step: 5,
                                mode: 'slider',
                                unit_of_measurement: 'px'
                            }
                        }}
                        .value=${typeof barHeight === 'number' ? barHeight : 90}
                        @value-changed=${(e) => this._setConfigValue('elbow.segment.bar_height', e.detail.value)}>
                    </ha-selector>
                ` : html`
                    <lcards-message type="info" title="Theme Integration">
                        Bar height will dynamically follow <code>input_number.lcars_horizontal</code> entity state.
                        Create this helper in Home Assistant configuration to enable theme integration.
                    </lcards-message>
                `}
            </lcards-form-section>

            <lcards-form-section
                header="Corner Curves"
                description="Control the depth/scale of the diagonal cut. Tip: Use thin bars (20px) with large curves (60-80px) for dramatic diagonal cuts."
                icon="mdi:vector-curve"
                ?expanded=${true}
                ?outlined=${true}>

                <div class="form-row">
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Outer Curve Radius - Enable Manual Mode'}
                        .helper=${isOuterAuto
                            ? `Auto mode active: Outer radius = bar_width ÷ 2 = ${calculatedOuterCurve.toFixed(1)}px (LCARS formula)`
                            : 'Manual mode: Set custom outer curve radius below'}
                        .selector=${{ boolean: {} }}
                        .value=${!isOuterAuto}
                        @value-changed=${this._handleOuterCurveModeChange}>
                    </ha-selector>
                </div>

                ${!isOuterAuto ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Outer Curve Radius'}
                        .helper=${'Controls the depth/scale of the diagonal cut. Increase for deeper "bite" into corner (independent of bar thickness)'}
                        .selector=${{
                            number: {
                                min: 0,
                                max: 250,
                                step: 5,
                                mode: 'slider',
                                unit_of_measurement: 'px'
                            }
                        }}
                        .value=${typeof outerCurve === 'number' ? outerCurve : calculatedOuterCurve}
                        @value-changed=${(e) => this._setConfigValue('elbow.segment.outer_curve', e.detail.value)}>
                    </ha-selector>
                ` : ''}

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Inner Curve Radius'}
                    .helper=${innerCurve !== undefined
                        ? `Current: ${innerCurve}px (controls inner cut depth - default would be ${calculatedInnerCurve.toFixed(1)}px using LCARS formula)`
                        : `Using LCARS formula: outer_curve ÷ 2 = ${calculatedInnerCurve.toFixed(1)}px (controls inner cut depth)`}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 250,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${innerCurve ?? calculatedInnerCurve}
                    @value-changed=${(e) => this._setConfigValue('elbow.segment.inner_curve', e.detail.value)}>
                </ha-selector>

                ${this._isDiagonalCapType() ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Diagonal Angle Mode'}
                        .helper=${segment.diagonal_angle === 'theme'
                            ? '🎨 Dynamic: Binds to input_number.lcars_elbow_angle helper'
                            : '📏 Static: Fixed angle value'}
                        .selector=${{
                            select: {
                                mode: 'dropdown',
                                options: [
                                    { value: 'static', label: 'Static Value' },
                                    { value: 'theme', label: 'Theme Binding (input_number.lcars_elbow_angle)' }
                                ]
                            }
                        }}
                        .value=${segment.diagonal_angle === 'theme' ? 'theme' : 'static'}
                        @value-changed=${(e) => this._handleDiagonalAngleModeChange(e)}>
                    </ha-selector>

                    ${segment.diagonal_angle !== 'theme' ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Diagonal Cut Angle'}
                            .helper=${'Angle of diagonal cuts (0° = horizontal, 45° = diagonal, 90° = vertical)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 90,
                                    step: 5,
                                    mode: 'slider',
                                    unit_of_measurement: '°'
                                }
                            }}
                            .value=${typeof segment.diagonal_angle === 'number' ? segment.diagonal_angle : 45}
                            @value-changed=${(e) => this._setConfigValue('elbow.segment.diagonal_angle', e.detail.value)}>
                        </ha-selector>
                    ` : html`
                        <lcards-message type="info" title="Theme Integration">
                            Diagonal angle will dynamically follow <code>input_number.lcars_elbow_angle</code> entity state.
                            Create this helper in Home Assistant configuration to enable theme integration.
                        </lcards-message>
                    `}
                ` : ''}
            </lcards-form-section>

            <lcards-form-section
                header="Elbow Colours"
                description="State-based colours for the elbow"
                icon="mdi:palette"
                ?expanded=${true}
                ?outlined=${true}>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="elbow.segment.color"
                    header="Segment Colours"
                    description="Elbow segment colour for each state - supports custom states"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            ${this._renderShapeTextureSection()}
        `;
    }

    /**
     * Render the shape texture section for Elbow Design tab.
     * @returns {TemplateResult}
     * @private
     */
    _renderShapeTextureSection() {
        return html`
            <lcards-form-section
                header="Shape Texture"
                description="Apply an SVG texture or animation pattern inside the elbow shape"
                icon="mdi:texture"
                ?expanded=${!!this.config?.shape_texture?.preset}
                ?outlined=${true}>
                <lcards-shape-texture-editor
                    .hass=${this.hass}
                    .config=${this.config?.shape_texture ?? null}
                    @texture-changed=${(e) => {
                        if (e.detail.value) {
                            this._setConfigValue('shape_texture', e.detail.value);
                        } else {
                            this._removeConfigPath('shape_texture');
                        }
                    }}>
                </lcards-shape-texture-editor>
            </lcards-form-section>
        `;
    }

    /**
     * Render segmented style design section
     * @returns {TemplateResult}
     * @private
     */
    _renderSegmentedDesign() {
        const segments = this.config.elbow?.segments || {};
        const gap = segments.gap ?? 4;
        const outerSegment = segments.outer_segment || {};
        const innerSegment = segments.inner_segment || {};

        const isInnerOuterCurveManual = innerSegment.outer_curve !== undefined;

        return html`
            <lcards-message
                type="info"
                message="Configure your segmented (Picard-style) double elbow with outer and inner concentric segments.">
            </lcards-message>

            <lcards-form-section
                header="Segment Spacing"
                description="Gap between outer and inner segments"
                icon="mdi:resize"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Segment Gap'}
                    .helper=${`Gap between outer and inner segments (default: 4px)`}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 50,
                            step: 1,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${gap}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.gap', e.detail.value)}>
                </ha-selector>
            </lcards-form-section>

            <lcards-form-section
                header="Outer Segment (Frame)"
                description="Outer elbow dimensions and colour"
                icon="mdi:vector-square"
                ?expanded=${true}
                ?outlined=${true}>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="elbow.segments.outer_segment.color"
                    header="Outer Segment Colour"
                    description="Colour states for outer frame segment - supports custom states like 'heat', 'cool', etc."
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Width'}
                    .helper=${'Vertical bar thickness'}
                    .selector=${{
                        number: {
                            min: 10,
                            max: 500,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${outerSegment.bar_width ?? 90}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.bar_width', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Height'}
                    .helper=${'Horizontal bar thickness'}
                    .selector=${{
                        number: {
                            min: 10,
                            max: 500,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${outerSegment.bar_height ?? outerSegment.bar_width ?? 90}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.bar_height', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Outer Curve'}
                    .helper=${'Outer corner radius'}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 250,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${outerSegment.outer_curve ?? (outerSegment.bar_width ?? 90) / 2}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.outer_curve', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Inner Curve'}
                    .helper=${'Inner corner radius'}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 250,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${outerSegment.inner_curve ?? (outerSegment.outer_curve ?? (outerSegment.bar_width ?? 90) / 2) / 2}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.inner_curve', e.detail.value)}>
                </ha-selector>

                ${this._isDiagonalCapType() ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Diagonal Angle Mode'}
                        .helper=${outerSegment.diagonal_angle === 'theme'
                            ? '🎨 Dynamic: Binds to input_number.lcars_elbow_angle helper'
                            : '📏 Static: Fixed angle value'}
                        .selector=${{
                            select: {
                                mode: 'dropdown',
                                options: [
                                    { value: 'static', label: 'Static Value' },
                                    { value: 'theme', label: 'Theme Binding (input_number.lcars_elbow_angle)' }
                                ]
                            }
                        }}
                        .value=${outerSegment.diagonal_angle === 'theme' ? 'theme' : 'static'}
                        @value-changed=${(e) => this._handleOuterDiagonalAngleModeChange(e)}>
                    </ha-selector>

                    ${outerSegment.diagonal_angle !== 'theme' ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Diagonal Cut Angle'}
                            .helper=${'Angle of diagonal cuts (0° = horizontal, 45° = diagonal, 90° = vertical)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 90,
                                    step: 5,
                                    mode: 'slider',
                                    unit_of_measurement: '°'
                                }
                            }}
                            .value=${typeof outerSegment.diagonal_angle === 'number' ? outerSegment.diagonal_angle : 45}
                            @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.diagonal_angle', e.detail.value)}>
                        </ha-selector>
                    ` : html`
                        <lcards-message type="info" title="Theme Integration">
                            Diagonal angle will dynamically follow <code>input_number.lcars_elbow_angle</code> entity state.
                            Create this helper in Home Assistant configuration to enable theme integration.
                        </lcards-message>
                    `}
                ` : ''}
            </lcards-form-section>

            <lcards-form-section
                header="Inner Segment (Content Area)"
                description="Inner elbow dimensions and colour"
                icon="mdi:vector-square-open"
                ?expanded=${true}
                ?outlined=${true}>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="elbow.segments.inner_segment.color"
                    header="Inner Segment Colour"
                    description="Colour states for inner content segment - supports custom states like 'heat', 'cool', etc."
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

            <lcards-form-section
                header="Inner Segment (Content Area)"
                description="Inner elbow dimensions and colour"
                icon="mdi:vector-square-open"
                ?expanded=${true}
                ?outlined=${true}>

                <div class="form-row">
                    <label>Manual Outer Curve Override</label>
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Manual Mode'}
                        .helper=${isInnerOuterCurveManual
                            ? 'Manual mode: custom inner segment outer curve'
                            : 'Auto mode: calculated for concentricity with outer segment'}
                        .selector=${{ boolean: {} }}
                        .value=${isInnerOuterCurveManual}
                        @value-changed=${this._handleInnerOuterCurveToggle}>
                    </ha-selector>
                </div>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Width'}
                    .helper=${'Vertical bar thickness'}
                    .selector=${{
                        number: {
                            min: 10,
                            max: 500,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${innerSegment.bar_width ?? 60}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.bar_width', e.detail.value)}>
                </ha-selector>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Height'}
                    .helper=${'Horizontal bar thickness'}
                    .selector=${{
                        number: {
                            min: 10,
                            max: 500,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${innerSegment.bar_height ?? innerSegment.bar_width ?? 60}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.bar_height', e.detail.value)}>
                </ha-selector>

                ${isInnerOuterCurveManual ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Outer Curve'}
                        .helper=${'Outer corner radius'}
                        .selector=${{
                            number: {
                                min: 0,
                                max: 250,
                                step: 5,
                                mode: 'slider',
                                unit_of_measurement: 'px'
                            }
                        }}
                        .value=${innerSegment.outer_curve ?? this._calculateInnerOuterCurveAuto()}
                        @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.outer_curve', e.detail.value)}>
                    </ha-selector>
                ` : ''}

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Inner Curve'}
                    .helper=${'Inner corner radius'}
                    .selector=${{
                        number: {
                            min: 0,
                            max: 250,
                            step: 5,
                            mode: 'slider',
                            unit_of_measurement: 'px'
                        }
                    }}
                    .value=${innerSegment.inner_curve ?? (innerSegment.outer_curve ?? this._calculateInnerOuterCurveAuto()) / 2}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.inner_curve', e.detail.value)}>
                </ha-selector>

                ${this._isDiagonalCapType() ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Diagonal Angle Mode'}
                        .helper=${innerSegment.diagonal_angle === 'theme'
                            ? '🎨 Dynamic: Binds to input_number.lcars_elbow_angle helper'
                            : '📏 Static: Fixed angle value'}
                        .selector=${{
                            select: {
                                mode: 'dropdown',
                                options: [
                                    { value: 'static', label: 'Static Value' },
                                    { value: 'theme', label: 'Theme Binding (input_number.lcars_elbow_angle)' }
                                ]
                            }
                        }}
                        .value=${innerSegment.diagonal_angle === 'theme' ? 'theme' : 'static'}
                        @value-changed=${(e) => this._handleInnerDiagonalAngleModeChange(e)}>
                    </ha-selector>

                    ${innerSegment.diagonal_angle !== 'theme' ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Diagonal Cut Angle'}
                            .helper=${'Angle of diagonal cuts (defaults to outer segment angle)'}
                            .selector=${{
                                number: {
                                    min: 0,
                                    max: 90,
                                    step: 5,
                                    mode: 'slider',
                                    unit_of_measurement: '°'
                                }
                            }}
                            .value=${typeof innerSegment.diagonal_angle === 'number' ? innerSegment.diagonal_angle : (outerSegment.diagonal_angle ?? 45)}
                            @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.diagonal_angle', e.detail.value)}>
                        </ha-selector>
                    ` : html`
                        <lcards-message type="info" title="Theme Integration">
                            Diagonal angle will dynamically follow <code>input_number.lcars_elbow_angle</code> entity state.
                            Create this helper in Home Assistant configuration to enable theme integration.
                        </lcards-message>
                    `}
                ` : ''}
            </lcards-form-section>
        `;
    }

    /**
     * Symbiont tab - embed another HA card in the elbow content area
     * @returns {TemplateResult}
     * @private
     */
    _renderSymbiontTab() {
        const symbiont      = this.config?.symbiont || {};
        const enabled       = symbiont.enabled || false;
        const imprint       = symbiont.imprint || {};
        const imprintEnabled = imprint.enabled !== false;
        const borderRadius  = imprint.border_radius || {};

        // Serialize current card config as YAML for the inline code editor
        const cardYaml = symbiont.card ? configToYaml(symbiont.card) : '';

        return html`
            <div class="tab-content-container">
                <lcards-message type="info">
                    <strong>Symbiont Card</strong>
                    <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">
                        Embed any Home Assistant card inside the elbow’s content area.
                        Enable <strong>Imprint</strong> to inject background color, text color, and font
                        directly into the child card’s shadow root — no card-mod required.
                        If the embedded card config includes a <code>card_mod</code> block and
                        card-mod is installed, LCARdS will defer to card-mod instead.
                    </p>
                </lcards-message>

                <!-- Master Enable -->
                <lcards-form-section
                    header="Symbiont"
                    description="Embed another HA card inside the elbow content area"
                    icon="mdi:card-multiple"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Enable Symbiont'}
                        .helper=${'Embed another HA card in the elbow content area'}
                        .selector=${{ boolean: {} }}
                        .value=${enabled}
                        @value-changed=${(e) => this._setConfigValue('symbiont.enabled', e.detail.value)}>
                    </ha-selector>
                </lcards-form-section>

                ${enabled ? html`

                    <!-- Embedded Card Selection -->
                    <lcards-form-section
                        header="Embedded Card"
                        description="Choose the card type and configure it"
                        icon="mdi:card-multiple-outline"
                        ?expanded=${true}
                        ?outlined=${true}>

                        ${symbiont.card ? html`
                            <div style="display:flex; align-items:center; gap:8px; padding: 4px 0 8px;">
                                <ha-icon icon="mdi:card-outline" style="color: var(--primary-color);"></ha-icon>
                                <span style="font-weight:500;">${symbiont.card.type}</span>
                            </div>
                        ` : html`
                            <lcards-message type="warning" message="No card selected. Use the button below to pick a card type.">
                            </lcards-message>
                        `}

                        <div style="display:flex; gap:8px; flex-wrap:wrap; padding-bottom:8px;">
                            <ha-button @click=${() => this._openSymbiontCardPicker()}>
                                <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                                ${symbiont.card ? 'Change Card Type' : 'Select Card Type'}
                            </ha-button>
                            ${symbiont.card ? html`
                                <ha-button
                                    .title=${'Open the card\'s own graphical editor'}
                                    @click=${() => this._openSymbiontCardEditor()}>
                                    <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                                    Edit Card
                                </ha-button>
                                <ha-button
                                    .title=${'Clear selected card'}
                                    @click=${() => this._setConfigValue('symbiont.card', undefined)}>
                                    <ha-icon icon="mdi:close" slot="start"></ha-icon>
                                    Remove Card
                                </ha-button>
                            ` : ''}
                        </div>

                        ${symbiont.card ? html`
                            <lcards-message type="info" message="Edit the full card configuration as YAML below. The card type field must remain as-is or use the 'Change Card Type' button above.">
                            </lcards-message>
                            <ha-code-editor
                                .hass=${this.hass}
                                .value=${cardYaml}
                                mode="yaml"
                                @value-changed=${(e) => {
                                    const raw = e.detail.value;
                                    clearTimeout(this._yamlDebounceTimer);
                                    this._yamlDebounceTimer = setTimeout(() => {
                                        try {
                                            const parsed = yamlToConfig(raw);
                                            if (parsed && typeof parsed === 'object') {
                                                this._setConfigValue('symbiont.card', parsed);
                                            }
                                        } catch (_err) {
                                            // Ignore YAML parse errors while typing
                                        }
                                    }, 750);
                                }}>
                            </ha-code-editor>
                        ` : ''}
                    </lcards-form-section>

                    <!-- Position / Padding -->
                    <lcards-form-section
                        header="Position"
                        description="Additional padding inside the elbow content area (px, on top of bar offsets)"
                        icon="mdi:move-resize"
                        ?expanded=${false}
                        ?outlined=${true}>

                        <lcards-padding-editor
                            .editor=${this}
                            .config=${this.config}
                            path="symbiont.position"
                            label="Content Area Padding"
                            helper="Extra inset from each edge of the elbow content area (the card already starts inside the elbow bars automatically)">
                        </lcards-padding-editor>
                    </lcards-form-section>

                    <!-- Imprint -->
                    <lcards-form-section
                        header="Imprint"
                        description="Inject styles directly into the embedded card&#39;s shadow root"
                        icon="mdi:palette-swatch"
                        ?expanded=${true}
                        ?outlined=${true}>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Enable Imprint'}
                            .helper=${'Inject background color, text color, and font into the embedded card (no card-mod required). Automatically defers to card_mod if present in the card config and card-mod is installed.'}
                            .selector=${{ boolean: {} }}
                            .value=${imprintEnabled}
                            @value-changed=${(e) => this._setConfigValue('symbiont.imprint.enabled', e.detail.value)}>
                        </ha-selector>

                        ${imprintEnabled ? html`

                            <!-- Background Color -->
                            <lcards-form-section
                                header="Background Colour"
                                description="Background colour injected into the embedded card (state-aware)"
                                icon="mdi:format-color-fill"
                                ?expanded=${false}
                                ?outlined=${true}>

                                <lcards-color-section-v2
                                    .editor=${this}
                                    .entityId=${this.config?.entity || ''}
                                    basePath="symbiont.imprint.background"
                                    header="Background"
                                    description="Background colour for each state — null = transparent (do not imprint)"
                                    .suggestedStates=${['default', 'active', 'inactive']}
                                    ?allowCustomStates=${true}
                                    ?expanded=${false}>
                                </lcards-color-section-v2>
                            </lcards-form-section>

                            <!-- Text -->
                            <lcards-form-section
                                header="Text"
                                description="Text colour, font size, and font family"
                                icon="mdi:format-text"
                                ?expanded=${false}
                                ?outlined=${true}>

                                <lcards-color-section-v2
                                    .editor=${this}
                                    .entityId=${this.config?.entity || ''}
                                    basePath="symbiont.imprint.text.color"
                                    header="Text Colour"
                                    description="Text colour for each state — null = do not imprint"
                                    .suggestedStates=${['default', 'active', 'inactive']}
                                    ?allowCustomStates=${true}
                                    ?expanded=${false}>
                                </lcards-color-section-v2>

                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${'Font Size'}
                                    .helper=${'Font size injected into embedded card (e.g. "14px"). Leave empty to not imprint.'}
                                    .selector=${{ text: {} }}
                                    .value=${imprint.text?.font_size || ''}
                                    @value-changed=${(e) => this._setConfigValue('symbiont.imprint.text.font_size', e.detail.value || undefined)}>
                                </ha-selector>

                                <lcards-font-selector
                                    .hass=${this.hass}
                                    .value=${imprint.text?.font_family || ''}
                                    .showPreview=${true}
                                    .label=${'Font Family'}
                                    .helper=${'Font family injected into the embedded card. Leave empty to not imprint.'}
                                    @value-changed=${(e) => this._setConfigValue('symbiont.imprint.text.font_family', e.detail.value || undefined)}>
                                </lcards-font-selector>
                            </lcards-form-section>

                            <!-- Border Radius -->
                            <lcards-form-section
                                header="Border Radius"
                                description="Per-corner radius injected into the embedded card"
                                icon="mdi:rounded-corner"
                                ?expanded=${false}
                                ?outlined=${true}>

                                <lcards-message type="info" message="Each corner can be: Default (don't inject), Match (use elbow inner arc radius), or Custom (explicit px value).">
                                </lcards-message>

                                ${(['top_left','top_right','bottom_left','bottom_right']).map(key => {
                                    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                                    const raw   = borderRadius[key];
                                    const mode  = raw === 'match' ? 'match' : (raw === null || raw === undefined) ? 'default' : 'custom';
                                    const numVal = typeof raw === 'number' ? raw : 0;
                                    return html`
                                        <div style="display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--divider-color); overflow:hidden;">
                                            <span style="flex:0 0 90px; font-size:13px; color:var(--secondary-text-color); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${label}</span>
                                            <ha-selector
                                                .hass=${this.hass}
                                                .selector=${{ select: { mode: 'dropdown', options: [
                                                    { value: 'default', label: 'Default (no inject)' },
                                                    { value: 'match',   label: 'Match elbow arc' },
                                                    { value: 'custom',  label: 'Custom (px)' }
                                                ]}}}
                                                .value=${mode}
                                                style="flex:1; min-width:0;"
                                                @value-changed=${(e) => {
                                                    const m = e.detail.value;
                                                    if (m === 'default') this._setConfigValue('symbiont.imprint.border_radius.' + key, undefined);
                                                    else if (m === 'match') this._setConfigValue('symbiont.imprint.border_radius.' + key, 'match');
                                                    else this._setConfigValue('symbiont.imprint.border_radius.' + key, numVal);
                                                }}>
                                            </ha-selector>
                                            ${mode === 'custom' ? html`
                                                <ha-selector
                                                    .hass=${this.hass}
                                                    .selector=${{ number: { min: 0, max: 200, step: 1, mode: 'box', unit_of_measurement: 'px' } }}
                                                    .value=${numVal}
                                                    style="flex:0 0 110px;"
                                                    @value-changed=${(e) => this._setConfigValue('symbiont.imprint.border_radius.' + key, e.detail.value)}>
                                                </ha-selector>
                                            ` : ''}
                                        </div>
                                    `;
                                })}
                            </lcards-form-section>

                        ` : ''}
                    </lcards-form-section>

                    <!-- Advanced / Custom Style -->
                    <lcards-form-section
                        header="Advanced"
                        description="Raw CSS injected into child card shadow root after imprint styles"
                        icon="mdi:code-tags"
                        ?expanded=${false}
                        ?outlined=${true}>

                        <lcards-message type="info" message="Raw CSS injected into the embedded card&#39;s shadow root after imprint styles. Works without card-mod. If the card config includes a card_mod block and card-mod is installed, native injection is skipped automatically.">
                        </lcards-message>

                        <ha-code-editor
                            .hass=${this.hass}
                            .value=${symbiont.custom_style || ''}
                            @value-changed=${(e) => {
                                const raw = e.detail.value;
                                clearTimeout(this._cssDebounceTimer);
                                this._cssDebounceTimer = setTimeout(() => {
                                    this._setConfigValue('symbiont.custom_style', raw || undefined);
                                }, 750);
                            }}>
                        </ha-code-editor>
                    </lcards-form-section>

                ` : ''}
            </div>
        `;
    }

    /**
     * Render text tab
     * @returns {TemplateResult}
     * @private
     */
    _renderTextTab() {
        // CRITICAL: Use this.config?.text to ensure Lit reactivity when config changes
        const textConfig = this.config?.text || {};
        return html`
            <lcards-multi-text-editor-v2
                .editor=${this}
                .text=${textConfig}
                .hass=${this.hass}
                @text-changed=${(e) => {
                    // CRITICAL: Replace entire text object, don't merge (deepMerge won't delete fields)
                    this.config = { ...this.config, text: e.detail.value };
                    this._updateConfig(this.config, 'visual');
                }}>
            </lcards-multi-text-editor-v2>
        `;
    }

    /**
     * Actions tab - uses multi-action editor (card-level actions only)
     * @returns {TemplateResult}
     * @private
     */
    _renderActionsTab() {
        return html`
            <lcards-multi-action-editor
                .hass=${this.hass}
                .actions=${{
                    tap_action: this.config.tap_action,
                    hold_action: this.config.hold_action,
                    double_tap_action: this.config.double_tap_action
                }}
                @value-changed=${this._handleActionsChange}>
            </lcards-multi-action-editor>
        `;
    }

    // ==================== Helper Methods ====================

    /**
     * Check if current elbow type is a diagonal-cap variant
     * @returns {boolean}
     * @private
     */
    _isDiagonalCapType() {
        const elbowType = this.config.elbow?.type || 'header-left';
        return elbowType.includes('diagonal-cap');
    }

    /**
     * Get current elbow style (simple or segmented)
     * @returns {string} 'simple' or 'segmented'
     * @private
     */
    _getElbowStyle() {
        return this.config.elbow?.style || 'simple';
    }

    /**
     * Get inner curve helper text showing LCARS formula calculation
     * @param {number} calculatedValue - Auto-calculated inner curve value
     * @param {number|undefined} currentValue - Current inner curve value
     * @returns {string}
     * @private
     */
    _getInnerCurveHelperText(calculatedValue, currentValue) {
        if (currentValue !== undefined) {
            return `Current: ${currentValue}px (default would be ${calculatedValue.toFixed(1)}px using LCARS formula: outer / 2)`;
        }
        return `LCARS formula: outer_curve / 2 = ${calculatedValue.toFixed(1)}px (default if not specified)`;
    }

    // ==================== Event Handlers ====================

    /**
     * Handle elbow type change (header-left, header-right, etc.)
     * Reset to simple if new type doesn't support segmented
     * @param {CustomEvent} event
     * @private
     */
    _handleElbowTypeChange(event) {
        const newType = event.detail.value;
        this._setConfigValue('elbow.type', newType);

        // Check if new component supports current style
        const component = this._getElbowComponent(newType);
        const supportedFeatures = component?.features || ['simple'];
        const currentStyle = this._getElbowStyle();

        // If current style is segmented but new component doesn't support it, reset to simple
        if (currentStyle === 'segmented' && !supportedFeatures.includes('segmented')) {
            this._setConfigValue('elbow.style', 'simple');
            // Show a message to user
            this.dispatchEvent(new CustomEvent('show-notification', {
                bubbles: true,
                composed: true,
                detail: {
                    message: 'Style changed to Simple - selected component does not support Segmented mode',
                    duration: 3000
                }
            }));
        }
    }

    /**
     * Handle style change (simple vs segmented)
     * @param {CustomEvent} event
     * @private
     */
    _handleStyleChange(event) {
        const newStyle = event.detail.value;
        const currentStyle = this._getElbowStyle();

        if (newStyle === currentStyle) return;

        // Get schema to pull defaults
        const schema = getElbowSchema({
            availablePresets: [],
            positionEnum: []
        });

        // Create new elbow config with appropriate structure
        const newElbowConfig = {
            type: this.config.elbow?.type || 'header-left',
            style: newStyle
        };

        if (newStyle === 'simple') {
            // Initialize simple style structure using schema defaults
            const segmentDefaults = schema.properties.elbow.properties.segment.default || {
                bar_width: 90,
                bar_height: 90,
                outer_curve: 'auto'
            };
            newElbowConfig.segment = { ...segmentDefaults };
            // Don't copy over segments config
        } else {
            // Initialize segmented style structure using schema defaults
            const segmentsDefaults = schema.properties.elbow.properties.segments.default || {
                gap: 4,
                outer_segment: {
                    bar_width: 90,
                    bar_height: 90
                },
                inner_segment: {
                    bar_width: 60,
                    bar_height: 60
                }
            };
            newElbowConfig.segments = JSON.parse(JSON.stringify(segmentsDefaults)); // Deep clone
            // Don't copy over segment config
        }

        this._setConfigValue('elbow', newElbowConfig);
        this.requestUpdate();
    }

    /**
     * Handle outer curve mode toggle (auto vs manual)
     * @param {CustomEvent} event
     * @private
     */
    _handleOuterCurveModeChange(event) {
        const isManual = event.detail.value;

        if (isManual) {
            // Switch to manual mode - set a numeric value
            const barWidth = this.config.elbow?.segment?.bar_width;
            // Handle 'theme' - use default numeric value for calculation
            const numericBarWidth = typeof barWidth === 'number' ? barWidth : 90;
            const calculatedValue = numericBarWidth / 2;
            this._setConfigValue('elbow.segment.outer_curve', calculatedValue);
        } else {
            // Switch to auto mode
            this._setConfigValue('elbow.segment.outer_curve', 'auto');
        }

        this.requestUpdate();
    }

    /**
     * Handle bar width mode change (static vs theme)
     * @param {CustomEvent} event
     * @private
     */
    _handleBarWidthModeChange(event) {
        const newMode = event.detail.value;

        if (newMode === 'theme') {
            // Switch to theme mode
            this._setConfigValue('elbow.segment.bar_width', 'theme');
        } else {
            // Switch to static mode - use default or current numeric value
            const currentValue = this.config.elbow?.segment?.bar_width;
            const defaultValue = typeof currentValue === 'number' ? currentValue : 90;
            this._setConfigValue('elbow.segment.bar_width', defaultValue);
        }

        this.requestUpdate();
    }

    /**
     * Handle bar height mode change (static vs theme)
     * @param {CustomEvent} event
     * @private
     */
    _handleBarHeightModeChange(event) {
        const newMode = event.detail.value;

        if (newMode === 'theme') {
            // Switch to theme mode
            this._setConfigValue('elbow.segment.bar_height', 'theme');
        } else {
            // Switch to static mode - use default or current numeric value
            const currentValue = this.config.elbow?.segment?.bar_height;
            const defaultValue = typeof currentValue === 'number' ? currentValue : 90;
            this._setConfigValue('elbow.segment.bar_height', defaultValue);
        }

        this.requestUpdate();
    }

    /**
     * Handle inner segment outer curve override toggle
     * @param {CustomEvent} event
     * @private
     */
    _handleInnerOuterCurveToggle(event) {
        const isManual = event.detail.value;

        if (isManual) {
            // Switch to manual mode - calculate initial concentric value
            const calculatedValue = this._calculateInnerOuterCurveAuto();
            this._setConfigValue('elbow.segments.inner_segment.outer_curve', calculatedValue);
        } else {
            // Switch to auto mode - remove the property
            const newConfig = { ...this.config };
            if (newConfig.elbow?.segments?.inner_segment?.outer_curve !== undefined) {
                delete newConfig.elbow.segments.inner_segment.outer_curve;
                this.config = newConfig;
                this._validateConfig();
                this._yamlValue = configToYaml(this.config);

                this.dispatchEvent(new CustomEvent('config-changed', {
                    detail: { config: this.config },
                    bubbles: true,
                    composed: true
                }));
            }
        }

        this.requestUpdate();
    }

    /**
     * Handle diagonal angle mode change for simple mode (static vs theme)
     * @param {CustomEvent} event
     * @private
     */
    _handleDiagonalAngleModeChange(event) {
        const newMode = event.detail.value;

        if (newMode === 'theme') {
            // Switch to theme mode
            this._setConfigValue('elbow.segment.diagonal_angle', 'theme');
        } else {
            // Switch to static mode - use default or current numeric value
            const currentValue = this.config.elbow?.segment?.diagonal_angle;
            const defaultValue = typeof currentValue === 'number' ? currentValue : 45;
            this._setConfigValue('elbow.segment.diagonal_angle', defaultValue);
        }

        this.requestUpdate();
    }

    /**
     * Handle outer segment diagonal angle mode change (static vs theme)
     * @param {CustomEvent} event
     * @private
     */
    _handleOuterDiagonalAngleModeChange(event) {
        const newMode = event.detail.value;

        if (newMode === 'theme') {
            // Switch to theme mode
            this._setConfigValue('elbow.segments.outer_segment.diagonal_angle', 'theme');
        } else {
            // Switch to static mode - use default or current numeric value
            const currentValue = this.config.elbow?.segments?.outer_segment?.diagonal_angle;
            const defaultValue = typeof currentValue === 'number' ? currentValue : 45;
            this._setConfigValue('elbow.segments.outer_segment.diagonal_angle', defaultValue);
        }

        this.requestUpdate();
    }

    /**
     * Handle inner segment diagonal angle mode change (static vs theme)
     * @param {CustomEvent} event
     * @private
     */
    _handleInnerDiagonalAngleModeChange(event) {
        const newMode = event.detail.value;

        if (newMode === 'theme') {
            // Switch to theme mode
            this._setConfigValue('elbow.segments.inner_segment.diagonal_angle', 'theme');
        } else {
            // Switch to static mode - use default or current numeric value
            const currentValue = this.config.elbow?.segments?.inner_segment?.diagonal_angle;
            const outerAngle = this.config.elbow?.segments?.outer_segment?.diagonal_angle;
            const defaultValue = typeof currentValue === 'number' ? currentValue :
                               (typeof outerAngle === 'number' ? outerAngle : 45);
            this._setConfigValue('elbow.segments.inner_segment.diagonal_angle', defaultValue);
        }

        this.requestUpdate();
    }

    /**
     * Calculate auto-concentric outer curve for inner segment
     * @returns {number}
     * @private
     */
    _calculateInnerOuterCurveAuto() {
        const outerSegment = this.config.elbow?.segments?.outer_segment || {};
        const gap = this.config.elbow?.segments?.gap ?? 4;
        const outerBarWidth = outerSegment.bar_width ?? 90;
        const innerBarWidth = this.config.elbow?.segments?.inner_segment?.bar_width ?? 60;
        const outerCurve = outerSegment.outer_curve ?? (outerBarWidth / 2);

        // Concentric calculation: outer segment's outer curve - gap - inner segment's bar width
        return Math.max(0, outerCurve - gap - innerBarWidth);
    }

    /**
     * Handle actions change from multi-action editor
     * @param {CustomEvent} event
     * @private
     */
    _handleActionsChange(event) {
        const actions = event.detail.value;

        // Create update object, only including defined actions
        const updates = {};

        // Add actions that are actually configured
        if (actions.tap_action) {
            updates.tap_action = actions.tap_action;
        }
        if (actions.hold_action) {
            updates.hold_action = actions.hold_action;
        }
        if (actions.double_tap_action) {
            updates.double_tap_action = actions.double_tap_action;
        }

        // Remove actions that are no longer in the actions object
        const newConfig = { ...this.config, ...updates };

        if (!actions.tap_action && this.config.tap_action) {
            delete newConfig.tap_action;
        }
        if (!actions.hold_action && this.config.hold_action) {
            delete newConfig.hold_action;
        }
        if (!actions.double_tap_action && this.config.double_tap_action) {
            delete newConfig.double_tap_action;
        }

        // Update entire config with cleaned version
        this.config = newConfig;
        this._validateConfig();
        this._yamlValue = configToYaml(this.config);

        // Fire config-changed event
        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Delete a config value by path
     * @param {string} path - Dot-notation path
     * @private
     */
    _deleteConfigValue(path) {
        const newConfig = { ...this.config };
        const keys = path.split('.');
        let current = newConfig;

        // Navigate to parent
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) return; // Path doesn't exist
            current = current[keys[i]];
        }

        // Delete the final key
        delete current[keys[keys.length - 1]];

        this.config = newConfig;
        this._validateConfig();
        this._yamlValue = configToYaml(this.config);

        this.dispatchEvent(new CustomEvent('config-changed', {
            detail: { config: this.config },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Render Effects tab - Animations + Filters combined
     * @returns {TemplateResult}
     * @private
     */
    _renderEffectsTab() {
        return html`
            <div class="tab-content-container">
                <!-- Info Message -->
                <lcards-message type="info">
                    <strong>Combining Effects:</strong>
                    <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.4;">
                        Animations and filters work together. For example:
                        <br/>• Add a <strong>glow filter</strong> with a <strong>pulse animation</strong> for breathing light effects
                        <br/>• Use <strong>blur + brightness filters</strong> with <strong>hover animations</strong> for depth effects
                        <br/>• Apply <strong>SVG filters</strong> for advanced effects like displacement maps or morphology
                    </p>
                </lcards-message>

                <!-- Animations Section -->
                <lcards-form-section
                    header="Animations"
                    description="Trigger visual animations on user interactions or entity state changes"
                    icon="mdi:animation"
                    ?expanded=${true}>

                    <lcards-animation-editor
                        .hass=${this.hass}
                        .animations=${this.config.animations || []}
                        .cardElement=${this._cardElement}
                        @animations-changed=${(e) => {
                            this._updateConfig({ animations: e.detail.value });
                        }}>
                    </lcards-animation-editor>
                </lcards-form-section>

                <!-- Filters Section -->
                <lcards-form-section
                    header="Filters"
                    description="Apply visual filters to the entire elbow (CSS and SVG filter primitives)"
                    icon="mdi:auto-fix"
                    ?expanded=${true}>

                    <lcards-filter-editor
                        .hass=${this.hass}
                        .filters=${this.config.filters || []}
                        @filters-changed=${(e) => {
                            this._updateConfig({ filters: e.detail.value });
                        }}>
                    </lcards-filter-editor>
                </lcards-form-section>

                <!-- Background Animation Section -->
                <lcards-form-section
                    header="Background Animation"
                    description="Animated canvas backgrounds (grids, hexagons, diagonals, nebulas, starfields, etc.)"
                    icon="mdi:grid"
                    ?expanded=${true}>

                    <lcards-background-animation-editor
                        .hass=${this.hass}
                        .config=${this.config.background_animation ?? []}
                        @effects-changed=${(e) => {
                            const cleaned = { ...this.config };
                            delete cleaned.background_animation;
                            this.config = cleaned;
                            this._updateConfig({ background_animation: e.detail.value });
                        }}>
                    </lcards-background-animation-editor>

                </lcards-form-section>
            </div>
        `;
    }
}

customElements.define('lcards-elbow-editor', LCARdSElbowEditor);
