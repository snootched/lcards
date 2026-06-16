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

import { html, svg } from 'lit';
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

    static get properties() {
        return {
            ...super.properties,
            _liveOuterCurve:  { type: Number, state: true },
            _liveInnerCurve:  { type: Number, state: true },
            _liveSegOuterOC:  { type: Number, state: true },
            _liveSegOuterIC:  { type: Number, state: true },
            _liveSegInnerOC:  { type: Number, state: true },
            _liveSegInnerIC:  { type: Number, state: true },
            _segCurveTab:     { type: String, state: true },
        };
    }

    constructor() {
        super();
        this.cardType = 'elbow';
        this._cardElement = null;
        this._symbioCardPickerDialogRef = null;
        this._symbioCardEditorDialogRef = null;
        this._yamlDebounceTimer = null;
        this._cssDebounceTimer = null;
        this._liveOuterCurve = null;
        this._liveInnerCurve = null;
        this._liveSegOuterOC = null;
        this._liveSegOuterIC = null;
        this._liveSegInnerOC = null;
        this._liveSegInnerIC = null;
        this._segCurveTab = 'outer';
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
            { label: 'Zones', content: () => this._renderZonesTab() },
            { label: 'Text', content: () => this._renderTextTab() },
            { label: 'Symbiont', content: () => this._renderSymbiontTab() },
            { label: 'Actions', content: () => this._renderActionsTab() },
            { label: 'Effects', content: () => this._renderEffectsTab() },
            { label: 'Sound', content: () => this._renderSoundTab(['card_tap', 'card_hold', 'card_double_tap', 'card_hover', 'toggle_on', 'toggle_off']) },
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
                },
                {
                    type: 'section',
                    header: 'Entity',
                    description: 'Entity to observe and attribute for state range conditions',
                    icon: 'mdi:home-automation',
                    expanded: false,
                    outlined: true,
                    children: [
                        {
                            type: 'custom',
                            render: () => html`
                                <ha-selector
                                    .hass=${this.hass}
                                    .label=${'Entity'}
                                    .helper=${'[Optional] Entity whose state drives colour and icon changes'}
                                    .selector=${{ entity: {} }}
                                    .value=${this.config?.entity || ''}
                                    @value-changed=${(e) => {
                                        const v = e.detail.value;
                                        if (v) this._setConfigValue('entity', v);
                                        else   this._removeConfigPath('entity');
                                    }}>
                                </ha-selector>
                            `
                        },
                        {
                            type: 'custom',
                            render: () => this._renderRangesAttributeSelector()
                        },
                        {
                            type: 'custom',
                            render: () => this._renderStateAttributeSelector()
                        },
                        {
                            type: 'custom',
                            render: () => this._renderStateClassificationElseSelector()
                        }
                    ]
                }
            ],
            basicFields: [
                { path: 'id', label: 'Card ID', helper: '[Optional] Custom ID for targeting with rules and animations' },
                { path: 'tags', label: 'Tags', helper: 'Select existing tags or type new ones for rule targeting' }
            ],
            showBasicSection: true,
            basicSectionHeader: 'Card Identification'
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
                        { type: 'field', path: 'width' },
                        { type: 'field', path: 'min_height' },
                        { type: 'field', path: 'min_width' },
                        { type: 'field', path: 'max_height' },
                        { type: 'field', path: 'max_width' },
                        { type: 'field', path: 'overflow' },
                        { type: 'field', path: 'z_index' },
                        { type: 'field', path: 'overflow_x' },
                        { type: 'field', path: 'overflow_y' },
                    ]
                },
                { type: 'custom', render: () => this._renderLayoutCardHint() }
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
                        .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero', 'hover', 'pressed']}
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
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>
            </lcards-form-section>

            ${this._renderShapeTextureSection()}
        `;
    }

    /**
     * Returns true when a dimension value is a CSS expression (clamp/calc/vw/vh/etc.)
     * set via YAML — distinct from 'theme', 'auto', or plain numbers.
     * @param {*} val
     * @returns {boolean}
     * @private
     */
    _isCssExpr(val) {
        if (typeof val !== 'string' || val === '') return false;
        if (val === 'theme' || val === 'auto') return false;
        if (['arm_width', 'arm_height', 'arm_max', 'arm_min', 'arm_fill'].includes(val)) return false;
        if (/^\s*-?\d+(\.\d+)?\s*(px)?\s*$/.test(val)) return false;
        return true;
    }

    /**
     * Render a read-only banner for a CSS expression value set via YAML.
     * Provides a 'Clear' button that reverts the field to a plain numeric default
     * so the user can switch back to the slider UI without hand-editing YAML.
     *
     * @param {string} label       - Field label
     * @param {string} cssValue    - The CSS expression string to display
     * @param {string} configPath  - Dot-path to pass to _setConfigValue when clearing
     * @param {*}      clearValue  - Value to set when the user clears the expression
     * @returns {TemplateResult}
     * @private
     */
    _renderCssField(label, cssValue, configPath, clearValue) {
        return html`
            <ha-selector
                .hass=${this.hass}
                .label=${label}
                .helper=${'CSS length: vw, vh, clamp(), calc(), etc. Switch mode dropdown to revert to slider.'}
                .selector=${{ text: {} }}
                .value=${cssValue || ''}
                @value-changed=${(e) => {
                    const v = (e.detail.value || '').trim();
                    // If user blanks the field, revert to the numeric/string fallback
                    if (v === '') {
                        this._setConfigValue(configPath, clearValue);
                    } else {
                        this._setConfigValue(configPath, v);
                    }
                }}>
            </ha-selector>
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
        const barHeight = segment.bar_height !== undefined ? segment.bar_height : (typeof barWidth === 'number' ? barWidth : 90);
        const outerCurve = segment.outer_curve ?? 'auto';
        const OUTER_CURVE_KEYWORDS = ['auto', 'arm_width', 'arm_height', 'arm_max', 'arm_min', 'arm_fill'];
        const isOuterKeyword = OUTER_CURVE_KEYWORDS.includes(outerCurve);
        const isOuterAuto = outerCurve === 'auto' || outerCurve === 'arm_width';
        const innerCurve = segment.inner_curve;
        const INNER_CURVE_KEYWORDS = ['auto', 'arm_width', 'arm_height', 'arm_max', 'arm_min', 'arm_fill'];
        const isInnerKeyword = INNER_CURVE_KEYWORDS.includes(innerCurve);

        // Detect CSS expressions so the UI never clobbers them
        const isCssBarWidth   = this._isCssExpr(barWidth);
        const isCssBarHeight  = this._isCssExpr(barHeight);
        const isCssOuterCurve = this._isCssExpr(outerCurve);
        const isCssInnerCurve = !isInnerKeyword && this._isCssExpr(innerCurve);

        // Clamp config
        const outerCurveClamp = segment.outer_curve_clamp ?? 'card';
        const isClampManual = typeof outerCurveClamp === 'number';
        const clampModeValue = isClampManual ? 'manual' : outerCurveClamp;

        // Calculate resolved values for helper text (handle 'theme' case)
        const numericBarWidth = typeof barWidth === 'number' ? barWidth : 90;
        const numericBarHeight = typeof barHeight === 'number' ? barHeight : 90;
        const armMin = Math.min(numericBarWidth, numericBarHeight);
        const armMax = Math.max(numericBarWidth, numericBarHeight);
        const calculatedOuterCurve = (() => {
            if (outerCurve === 'arm_height') return numericBarHeight / 2;
            if (outerCurve === 'arm_max') return armMax / 2;
            if (outerCurve === 'arm_min') return armMin / 2;
            if (outerCurve === 'arm_fill') return armMax;
            return numericBarWidth / 2; // 'auto', 'arm_width', or fallback
        })();
        const effectiveOuter = typeof outerCurve === 'number' ? outerCurve : calculatedOuterCurve;
        const calculatedInnerCurve = (() => {
            if (innerCurve === 'arm_width') return numericBarWidth / 2;
            if (innerCurve === 'arm_height') return numericBarHeight / 2;
            if (innerCurve === 'arm_max') return armMax / 2;
            if (innerCurve === 'arm_min') return armMin / 2;
            if (innerCurve === 'arm_fill') return armMax;
            return effectiveOuter / 2; // 'auto', undefined, or fallback
        })();

        // Drive the selects: keyword modes map to themselves; numeric → 'manual'; CSS → 'css'
        const outerCurveModeValue = isCssOuterCurve ? 'css' : (typeof outerCurve === 'number' ? 'manual' : outerCurve);
        const innerCurveModeValue = isCssInnerCurve ? 'css' : (typeof innerCurve === 'number' ? 'manual' : (innerCurve ?? 'auto'));

        return html`
            <!-- Static reference diagram -->
            <lcards-form-section
                header="Elbow Geometry Reference"
                description="How the four dimensions map to the physical LCARS elbow shape"
                icon="mdi:ruler-square"
                ?expanded=${false}
                ?outlined=${true}>

                <div style="padding: 16px; text-align: center;">
                    ${this._renderElbowReferenceDiagram()}
                </div>
            </lcards-form-section>

            <lcards-form-section
                header="Bar Dimensions"
                description="Thickness of the two arms"
                icon="mdi:resize"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Bar Width Mode (Vertical)'}
                    .helper=${isCssBarWidth
                        ? 'CSS expression — edit via YAML'
                        : barWidth === 'theme'
                            ? 'Dynamic — follows input_number.lcars_vertical'
                            : 'Static pixel value'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'theme',  label: 'Theme Binding (input_number.lcars_vertical)' },
                                { value: 'css',    label: 'CSS Expression (YAML only)' }
                            ]
                        }
                    }}
                    .value=${isCssBarWidth ? 'css' : barWidth === 'theme' ? 'theme' : 'static'}
                    @value-changed=${(e) => this._handleBarWidthModeChange(e)}>
                </ha-selector>

                ${isCssBarWidth
                    ? this._renderCssField('Bar Width (Vertical)', barWidth, 'elbow.segment.bar_width', 90)
                    : barWidth !== 'theme' ? html`
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
                    .helper=${isCssBarHeight
                        ? 'CSS expression — edit via YAML'
                        : barHeight === 'theme'
                            ? 'Dynamic — follows input_number.lcars_horizontal'
                            : 'Static pixel value'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'theme',  label: 'Theme Binding (input_number.lcars_horizontal)' },
                                { value: 'css',    label: 'CSS Expression (YAML only)' }
                            ]
                        }
                    }}
                    .value=${isCssBarHeight ? 'css' : barHeight === 'theme' ? 'theme' : 'static'}
                    @value-changed=${(e) => this._handleBarHeightModeChange(e)}>
                </ha-selector>

                ${isCssBarHeight
                    ? this._renderCssField('Bar Height (Horizontal)', barHeight, 'elbow.segment.bar_height', 90)
                    : barHeight !== 'theme' ? html`
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
                description="Arc radii for the outer and inner corners"
                icon="mdi:vector-curve"
                ?expanded=${true}
                ?outlined=${true}>

                <!-- Live arc preview — uses live slider value during drag, config value otherwise -->
                <div style="padding: 12px 0 4px; text-align: center;">
                    ${this._renderCurveLivePreview(
                        this._liveOuterCurve ?? (typeof outerCurve === 'number' ? outerCurve : calculatedOuterCurve),
                        this._liveInnerCurve ?? (typeof innerCurve === 'number' ? innerCurve : calculatedInnerCurve),
                        numericBarWidth, numericBarHeight, clampModeValue, outerCurveClamp,
                        this._parseStylePx(this.config?.style?.height ?? this.config?.height),
                        this._parseStylePx(this.config?.style?.width ?? this.config?.width)
                    )}
                </div>

                <!-- Outer curve -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Outer Arc Radius'}
                    .helper=${isCssOuterCurve ? 'CSS expression — edit via YAML' : `→ ${calculatedOuterCurve.toFixed(1)} px`}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'auto',       label: 'auto / arm_width  (bar_width ÷ 2)' },
                                { value: 'arm_height', label: 'arm_height  (bar_height ÷ 2)' },
                                { value: 'arm_max',    label: 'arm_max  (max arm ÷ 2)  ★ paired elbows' },
                                { value: 'arm_min',    label: 'arm_min  (min arm ÷ 2)' },
                                { value: 'arm_fill',   label: 'arm_fill  (max arm — full sweep)' },
                                { value: 'manual',     label: 'manual  (explicit px)' },
                                ...(isCssOuterCurve ? [{ value: 'css', label: 'CSS expression (YAML only)' }] : []),
                            ]
                        }
                    }}
                    .value=${outerCurveModeValue}
                    @value-changed=${this._handleOuterCurveModeChange}>
                </ha-selector>

                ${isCssOuterCurve
                    ? this._renderCssField('Outer Curve Radius', outerCurve, 'elbow.segment.outer_curve', 'auto')
                    : outerCurveModeValue === 'manual' ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Outer Curve Radius'}
                            .selector=${{ number: { min: 0, max: 250, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                            .value=${typeof outerCurve === 'number' ? outerCurve : calculatedOuterCurve}
                            @input=${(e) => { const v = Number(e.composedPath?.()?.[0]?.value); if (!isNaN(v)) this._liveOuterCurve = v; }}
                            @value-changed=${(e) => { this._liveOuterCurve = null; this._setConfigValue('elbow.segment.outer_curve', e.detail.value); }}>
                        </ha-selector>
                    ` : this._renderCurveModeMessage('outer', outerCurveModeValue, calculatedOuterCurve, numericBarWidth, numericBarHeight)}

                <!-- Inner curve -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Inner Arc Radius'}
                    .helper=${isCssInnerCurve ? 'CSS expression — edit via YAML' : `→ ${calculatedInnerCurve.toFixed(1)} px`}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'auto',       label: 'auto  (outer ÷ 2, LCARS formula)' },
                                { value: 'arm_max',    label: 'arm_max  (max arm ÷ 2)' },
                                { value: 'arm_width',  label: 'arm_width  (bar_width ÷ 2)' },
                                { value: 'arm_height', label: 'arm_height  (bar_height ÷ 2)' },
                                { value: 'arm_min',    label: 'arm_min  (min arm ÷ 2)' },
                                { value: 'arm_fill',   label: 'arm_fill  (max arm)' },
                                { value: 'manual',     label: 'manual  (explicit px)' },
                                ...(isCssInnerCurve ? [{ value: 'css', label: 'CSS expression (YAML only)' }] : []),
                            ]
                        }
                    }}
                    .value=${innerCurveModeValue}
                    @value-changed=${this._handleInnerCurveModeChange}>
                </ha-selector>

                ${isCssInnerCurve
                    ? this._renderCssField('Inner Curve Radius', innerCurve, 'elbow.segment.inner_curve', 'auto')
                    : innerCurveModeValue === 'manual' ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Inner Curve Radius'}
                            .selector=${{ number: { min: 0, max: 250, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                            .value=${typeof innerCurve === 'number' ? innerCurve : calculatedInnerCurve}
                            @input=${(e) => { const v = Number(e.composedPath?.()?.[0]?.value); if (!isNaN(v)) this._liveInnerCurve = v; }}
                            @value-changed=${(e) => { this._liveInnerCurve = null; this._setConfigValue('elbow.segment.inner_curve', e.detail.value); }}>
                        </ha-selector>
                    ` : this._renderCurveModeMessage('inner', innerCurveModeValue, calculatedInnerCurve, numericBarWidth, numericBarHeight, calculatedOuterCurve)}

                <!-- Curve clamp -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Curve Clamp'}
                    .helper=${'Controls how the arc radius is limited at render time'}
                    .selector=${{
                        select: {
                            mode: 'dropdown',
                            options: [
                                { value: 'card',   label: 'card  — clamp to card viewport (default)' },
                                { value: 'none',   label: 'none  — no clamp (consistent paired elbows)' },
                                { value: 'manual', label: 'manual  — explicit px ceiling' },
                            ]
                        }
                    }}
                    .value=${clampModeValue}
                    @value-changed=${this._handleClampModeChange}>
                </ha-selector>

                ${isClampManual ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Clamp Ceiling'}
                        .selector=${{ number: { min: 0, max: 500, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                        .value=${typeof outerCurveClamp === 'number' ? outerCurveClamp : 60}
                        @value-changed=${(e) => this._setConfigValue('elbow.segment.outer_curve_clamp', e.detail.value)}>
                    </ha-selector>
                ` : html`
                    <lcards-message
                        type=${clampModeValue === 'none' ? 'success' : 'info'}
                        message=${clampModeValue === 'none'
                            ? 'No clamping — the arc radius is exactly the computed value. The SVG clips overflow at the card edge. Use this for paired elbows in different-height cards so both render identically.'
                            : 'The arc radius is clamped to min(card_width, card_height) at render time. Two elbows with the same config in differently-sized cards may render with different radii. Use none to prevent this.'}>
                    </lcards-message>
                `}

                ${this._isDiagonalCapType() ? html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Diagonal Angle Mode'}
                        .helper=${segment.diagonal_angle === 'theme'
                            ? 'Dynamic — follows input_number.lcars_elbow_angle'
                            : 'Static angle value'}
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
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero', 'hover', 'pressed']}
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
        const CURVE_KEYWORDS = ['auto', 'arm_width', 'arm_height', 'arm_max', 'arm_min', 'arm_fill'];

        // ── Outer segment resolved values ──────────────────────────────────
        const outerBW = typeof outerSegment.bar_width  === 'number' ? outerSegment.bar_width  : 90;
        const outerBH = typeof outerSegment.bar_height === 'number' ? outerSegment.bar_height : outerBW;
        const outerArmMin = Math.min(outerBW, outerBH);
        const outerArmMax = Math.max(outerBW, outerBH);

        const outerOC = outerSegment.outer_curve ?? 'auto';
        const isOuterOCKw  = CURVE_KEYWORDS.includes(outerOC);
        const isCssOuterOC = !isOuterOCKw && this._isCssExpr(outerOC);
        const outerOCMode  = isCssOuterOC ? 'css' : (typeof outerOC === 'number' ? 'manual' : outerOC);
        const outerOCPx = (() => {
            if (typeof outerOC === 'number') return outerOC;
            if (outerOC === 'arm_height') return outerBH / 2;
            if (outerOC === 'arm_max')    return outerArmMax / 2;
            if (outerOC === 'arm_min')    return outerArmMin / 2;
            if (outerOC === 'arm_fill')   return outerArmMax;
            return outerBW / 2; // auto / arm_width
        })();

        const outerIC = outerSegment.inner_curve;
        const isOuterICKw  = CURVE_KEYWORDS.includes(outerIC);
        const isCssOuterIC = !isOuterICKw && this._isCssExpr(outerIC);
        const outerICMode  = isCssOuterIC ? 'css' : (typeof outerIC === 'number' ? 'manual' : (outerIC ?? 'auto'));
        const outerICPx = (() => {
            if (typeof outerIC === 'number') return outerIC;
            if (outerIC === 'arm_width')  return outerBW / 2;
            if (outerIC === 'arm_height') return outerBH / 2;
            if (outerIC === 'arm_max')    return outerArmMax / 2;
            if (outerIC === 'arm_min')    return outerArmMin / 2;
            if (outerIC === 'arm_fill')   return outerArmMax;
            return outerOCPx / 2; // auto / undefined
        })();

        const outerClamp     = outerSegment.outer_curve_clamp ?? 'card';
        const outerClampMode = typeof outerClamp === 'number' ? 'manual' : outerClamp;

        // ── Inner segment resolved values ──────────────────────────────────
        const innerBW = typeof innerSegment.bar_width  === 'number' ? innerSegment.bar_width  : 60;
        const innerBH = typeof innerSegment.bar_height === 'number' ? innerSegment.bar_height : innerBW;
        const innerArmMin = Math.min(innerBW, innerBH);
        const innerArmMax = Math.max(innerBW, innerBH);

        // Concentric formula cascades through the outer segment's clamp before subtracting gap.
        // This matches the card: clamp outer first, then derive inner from that clamped value.
        const cardHPx = this._parseStylePx(this.config?.style?.height ?? this.config?.height);
        const outerMaxORForCascade = outerClampMode === 'none' ? Infinity
            : typeof outerClamp === 'number' ? outerClamp
            : (cardHPx ?? Infinity);
        const outerClampedOCForCascade = Math.max(0, Math.min(outerOCPx, outerMaxORForCascade));
        const outerClampedICForCascade = outerOCPx > 0
            ? Math.max(0, outerICPx * (outerClampedOCForCascade / outerOCPx))
            : 0;
        const innerOCAutoValue = Math.max(0, outerClampedICForCascade - gap);
        const innerOC = innerSegment.outer_curve;
        const isInnerOCKw  = CURVE_KEYWORDS.includes(innerOC);
        const isCssInnerOC = !isInnerOCKw && this._isCssExpr(innerOC);
        const innerOCMode  = isCssInnerOC ? 'css' : (typeof innerOC === 'number' ? 'manual' : (innerOC ?? 'auto'));
        const innerOCPx = (() => {
            if (typeof innerOC === 'number') return innerOC;
            if (innerOC === 'arm_height') return innerBH / 2;
            if (innerOC === 'arm_max')    return innerArmMax / 2;
            if (innerOC === 'arm_min')    return innerArmMin / 2;
            if (innerOC === 'arm_fill')   return innerArmMax;
            if (isInnerOCKw)              return innerBW / 2; // arm_width / auto
            return innerOCAutoValue; // undefined = concentric auto
        })();

        const innerIC = innerSegment.inner_curve;
        const isInnerICKw  = CURVE_KEYWORDS.includes(innerIC);
        const isCssInnerIC = !isInnerICKw && this._isCssExpr(innerIC);
        const innerICMode  = isCssInnerIC ? 'css' : (typeof innerIC === 'number' ? 'manual' : (innerIC ?? 'auto'));
        const innerICPx = (() => {
            if (typeof innerIC === 'number') return innerIC;
            if (innerIC === 'arm_width')  return innerBW / 2;
            if (innerIC === 'arm_height') return innerBH / 2;
            if (innerIC === 'arm_max')    return innerArmMax / 2;
            if (innerIC === 'arm_min')    return innerArmMin / 2;
            if (innerIC === 'arm_fill')   return innerArmMax;
            return innerOCPx / 2; // auto / undefined
        })();

        // Live preview values — pick up slider drag before commit
        const previewOC      = this._liveSegOuterOC ?? (typeof outerOC === 'number' ? outerOC : outerOCPx);
        const previewIC      = this._liveSegOuterIC ?? (typeof outerIC === 'number' ? outerIC : outerICPx);
        const previewInnerOC = this._liveSegInnerOC ?? innerOCPx;
        const previewInnerIC = this._liveSegInnerIC ?? innerICPx;

        return html`
            <lcards-message
                type="info"
                message="Picard-style double elbow: an outer frame segment and an inner content segment separated by a gap.">
            </lcards-message>

            <!-- ── Geometry Reference ──────────────────────────────────────── -->
            <lcards-form-section
                header="Geometry Reference"
                description="Fixed-proportion diagram showing the segmented elbow structure"
                icon="mdi:help-circle-outline"
                ?expanded=${false}
                ?outlined=${true}>
                <div style="padding: 8px 0; text-align: center;">
                    ${this._renderSegmentedElbowReferenceDiagram()}
                </div>
            </lcards-form-section>

            <!-- ── Segment Spacing ─────────────────────────────────────────── -->
            <lcards-form-section
                header="Segment Spacing"
                description="Gap between outer and inner segments"
                icon="mdi:resize"
                ?expanded=${true}
                ?outlined=${true}>

                <ha-selector
                    .hass=${this.hass}
                    .label=${'Segment Gap'}
                    .helper=${'Space between the two segments (default: 4px)'}
                    .selector=${{ number: { min: 0, max: 50, step: 1, mode: 'slider', unit_of_measurement: 'px' } }}
                    .value=${gap}
                    @value-changed=${(e) => this._setConfigValue('elbow.segments.gap', e.detail.value)}>
                </ha-selector>
            </lcards-form-section>

            <!-- ── Outer Segment ────────────────────────────────────────────── -->
            <lcards-form-section
                header="Outer Segment (Frame)"
                description="Colour and dimensions for the outer elbow"
                icon="mdi:vector-square"
                ?expanded=${true}
                ?outlined=${true}>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="elbow.segments.outer_segment.color"
                    header="Colour"
                    description="Colour states for outer frame segment"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <lcards-form-section
                    header="Bar Dimensions"
                    icon="mdi:ruler"
                    ?expanded=${true}
                    ?outlined=${false}>

                    ${this._isCssExpr(outerSegment.bar_width) ? html`
                        <ha-selector .hass=${this.hass} .label=${'Bar Width Mode'}
                            .helper=${'📐 CSS expression active'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'css', label: 'CSS Expression (vw/vh/clamp/calc)' }
                            ]}}}
                            .value=${'css'}
                            @value-changed=${(e) => this._handleDimModeChange(e.detail.value, 'elbow.segments.outer_segment.bar_width', 90, 'clamp(60px, 8vw, 120px)')}>
                        </ha-selector>
                        ${this._renderCssField('Bar Width', outerSegment.bar_width, 'elbow.segments.outer_segment.bar_width', 90)}
                    ` : html`
                        <ha-selector .hass=${this.hass} .label=${'Bar Width Mode'}
                            .helper=${'📏 Static: Fixed pixel value'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'css', label: 'CSS Expression (vw/vh/clamp/calc)' }
                            ]}}}
                            .value=${'static'}
                            @value-changed=${(e) => this._handleDimModeChange(e.detail.value, 'elbow.segments.outer_segment.bar_width', 90, 'clamp(60px, 8vw, 120px)')}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${'Bar Width'} .helper=${'Vertical bar thickness'}
                            .selector=${{ number: { min: 10, max: 500, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                            .value=${typeof outerSegment.bar_width === 'number' ? outerSegment.bar_width : 90}
                            @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.bar_width', e.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isCssExpr(outerSegment.bar_height) ? html`
                        <ha-selector .hass=${this.hass} .label=${'Bar Height Mode'}
                            .helper=${'📐 CSS expression active'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'css', label: 'CSS Expression (vw/vh/clamp/calc)' }
                            ]}}}
                            .value=${'css'}
                            @value-changed=${(e) => this._handleDimModeChange(e.detail.value, 'elbow.segments.outer_segment.bar_height', 90, 'clamp(40px, 6vh, 90px)')}>
                        </ha-selector>
                        ${this._renderCssField('Bar Height', outerSegment.bar_height, 'elbow.segments.outer_segment.bar_height', 90)}
                    ` : html`
                        <ha-selector .hass=${this.hass} .label=${'Bar Height Mode'}
                            .helper=${'📏 Static: Fixed pixel value'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'css', label: 'CSS Expression (vw/vh/clamp/calc)' }
                            ]}}}
                            .value=${'static'}
                            @value-changed=${(e) => this._handleDimModeChange(e.detail.value, 'elbow.segments.outer_segment.bar_height', 90, 'clamp(40px, 6vh, 90px)')}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${'Bar Height'} .helper=${'Horizontal bar thickness'}
                            .selector=${{ number: { min: 10, max: 500, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                            .value=${typeof outerSegment.bar_height === 'number' ? outerSegment.bar_height : outerBW}
                            @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.bar_height', e.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isDiagonalCapType() ? html`
                        <ha-selector .hass=${this.hass}
                            .label=${'Diagonal Angle Mode'}
                            .helper=${outerSegment.diagonal_angle === 'theme'
                                ? '🎨 Dynamic: Binds to input_number.lcars_elbow_angle helper'
                                : '📏 Static: Fixed angle value'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'theme', label: 'Theme Binding (input_number.lcars_elbow_angle)' }
                            ]}}}
                            .value=${outerSegment.diagonal_angle === 'theme' ? 'theme' : 'static'}
                            @value-changed=${(e) => this._handleOuterDiagonalAngleModeChange(e)}>
                        </ha-selector>
                        ${outerSegment.diagonal_angle !== 'theme' ? html`
                            <ha-selector .hass=${this.hass} .label=${'Diagonal Cut Angle'}
                                .helper=${'Angle of diagonal cuts (0° = horizontal, 45° = diagonal, 90° = vertical)'}
                                .selector=${{ number: { min: 0, max: 90, step: 5, mode: 'slider', unit_of_measurement: '°' } }}
                                .value=${typeof outerSegment.diagonal_angle === 'number' ? outerSegment.diagonal_angle : 45}
                                @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.diagonal_angle', e.detail.value)}>
                            </ha-selector>
                        ` : html`
                            <lcards-message type="info" title="Theme Integration">
                                Diagonal angle will dynamically follow <code>input_number.lcars_elbow_angle</code>.
                            </lcards-message>
                        `}
                    ` : ''}
                </lcards-form-section>
            </lcards-form-section>

            <!-- ── Inner Segment ─────────────────────────────────────────────── -->
            <lcards-form-section
                header="Inner Segment (Content Area)"
                description="Colour and dimensions for the inner elbow"
                icon="mdi:vector-square-open"
                ?expanded=${true}
                ?outlined=${true}>

                <lcards-color-section-v2
                    .editor=${this}
                    .entityId=${this.config?.entity || ''}
                    basePath="elbow.segments.inner_segment.color"
                    header="Colour"
                    description="Colour states for inner content segment"
                    .suggestedStates=${['default', 'active', 'inactive', 'unavailable', 'zero', 'non_zero', 'hover', 'pressed']}
                    ?allowCustomStates=${true}
                    ?expanded=${false}>
                </lcards-color-section-v2>

                <lcards-form-section
                    header="Bar Dimensions"
                    icon="mdi:ruler"
                    ?expanded=${true}
                    ?outlined=${false}>

                    ${this._isCssExpr(innerSegment.bar_width) ? html`
                        <ha-selector .hass=${this.hass} .label=${'Bar Width Mode'}
                            .helper=${'📐 CSS expression active'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'css', label: 'CSS Expression (vw/vh/clamp/calc)' }
                            ]}}}
                            .value=${'css'}
                            @value-changed=${(e) => this._handleDimModeChange(e.detail.value, 'elbow.segments.inner_segment.bar_width', 60, 'clamp(40px, 5vw, 80px)')}>
                        </ha-selector>
                        ${this._renderCssField('Bar Width', innerSegment.bar_width, 'elbow.segments.inner_segment.bar_width', 60)}
                    ` : html`
                        <ha-selector .hass=${this.hass} .label=${'Bar Width Mode'}
                            .helper=${'📏 Static: Fixed pixel value'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'css', label: 'CSS Expression (vw/vh/clamp/calc)' }
                            ]}}}
                            .value=${'static'}
                            @value-changed=${(e) => this._handleDimModeChange(e.detail.value, 'elbow.segments.inner_segment.bar_width', 60, 'clamp(40px, 5vw, 80px)')}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${'Bar Width'} .helper=${'Vertical bar thickness'}
                            .selector=${{ number: { min: 10, max: 500, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                            .value=${typeof innerSegment.bar_width === 'number' ? innerSegment.bar_width : 60}
                            @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.bar_width', e.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isCssExpr(innerSegment.bar_height) ? html`
                        <ha-selector .hass=${this.hass} .label=${'Bar Height Mode'}
                            .helper=${'📐 CSS expression active'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'css', label: 'CSS Expression (vw/vh/clamp/calc)' }
                            ]}}}
                            .value=${'css'}
                            @value-changed=${(e) => this._handleDimModeChange(e.detail.value, 'elbow.segments.inner_segment.bar_height', 60, 'clamp(30px, 4vh, 60px)')}>
                        </ha-selector>
                        ${this._renderCssField('Bar Height', innerSegment.bar_height, 'elbow.segments.inner_segment.bar_height', 60)}
                    ` : html`
                        <ha-selector .hass=${this.hass} .label=${'Bar Height Mode'}
                            .helper=${'📏 Static: Fixed pixel value'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'css', label: 'CSS Expression (vw/vh/clamp/calc)' }
                            ]}}}
                            .value=${'static'}
                            @value-changed=${(e) => this._handleDimModeChange(e.detail.value, 'elbow.segments.inner_segment.bar_height', 60, 'clamp(30px, 4vh, 60px)')}>
                        </ha-selector>
                        <ha-selector .hass=${this.hass} .label=${'Bar Height'} .helper=${'Horizontal bar thickness'}
                            .selector=${{ number: { min: 10, max: 500, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                            .value=${typeof innerSegment.bar_height === 'number' ? innerSegment.bar_height : innerBW}
                            @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.bar_height', e.detail.value)}>
                        </ha-selector>
                    `}

                    ${this._isDiagonalCapType() ? html`
                        <ha-selector .hass=${this.hass}
                            .label=${'Diagonal Angle Mode'}
                            .helper=${innerSegment.diagonal_angle === 'theme'
                                ? '🎨 Dynamic: Binds to input_number.lcars_elbow_angle helper'
                                : '📏 Static: Fixed angle value'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'static', label: 'Static Value' },
                                { value: 'theme', label: 'Theme Binding (input_number.lcars_elbow_angle)' }
                            ]}}}
                            .value=${innerSegment.diagonal_angle === 'theme' ? 'theme' : 'static'}
                            @value-changed=${(e) => this._handleInnerDiagonalAngleModeChange(e)}>
                        </ha-selector>
                        ${innerSegment.diagonal_angle !== 'theme' ? html`
                            <ha-selector .hass=${this.hass} .label=${'Diagonal Cut Angle'}
                                .helper=${'Angle of diagonal cuts (defaults to outer segment angle)'}
                                .selector=${{ number: { min: 0, max: 90, step: 5, mode: 'slider', unit_of_measurement: '°' } }}
                                .value=${typeof innerSegment.diagonal_angle === 'number' ? innerSegment.diagonal_angle : (outerSegment.diagonal_angle ?? 45)}
                                @value-changed=${(e) => this._setConfigValue('elbow.segments.inner_segment.diagonal_angle', e.detail.value)}>
                            </ha-selector>
                        ` : html`
                            <lcards-message type="info" title="Theme Integration">
                                Diagonal angle will dynamically follow <code>input_number.lcars_elbow_angle</code>.
                            </lcards-message>
                        `}
                    ` : ''}
                </lcards-form-section>
            </lcards-form-section>

            <!-- ── Corner Curves ────────────────────────────────────────────── -->
            <lcards-form-section
                header="Corner Curves"
                description="Arc radii for both segments — dual preview updates live as you drag"
                icon="mdi:vector-curve"
                ?expanded=${true}
                ?outlined=${true}>

                <!-- Dual-segment live preview -->
                <div style="padding: 8px 0 4px; text-align: center;">
                    ${this._renderSegmentedLivePreview(
                        previewOC, previewIC, outerBW, outerBH,
                        previewInnerOC, previewInnerIC, innerBW, innerBH,
                        gap, outerClampMode, outerClamp,
                        this._parseStylePx(this.config?.style?.height ?? this.config?.height),
                        this._parseStylePx(this.config?.style?.width ?? this.config?.width),
                        innerOC === undefined,
                        innerSegment.inner_curve === undefined || innerSegment.inner_curve === 'auto'
                    )}
                </div>

                <!-- Outer segment curves subsection -->
                <lcards-form-section
                    header="Outer Segment"
                    icon="mdi:vector-square"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <ha-selector .hass=${this.hass}
                        .label=${'Outer Arc Radius'}
                        .helper=${isCssOuterOC ? 'CSS expression — edit via YAML' : `→ ${outerOCPx.toFixed(1)} px`}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: 'auto',       label: 'auto / arm_width  (bar_width ÷ 2)' },
                            { value: 'arm_height', label: 'arm_height  (bar_height ÷ 2)' },
                            { value: 'arm_max',    label: 'arm_max  (max arm ÷ 2)  ★ paired elbows' },
                            { value: 'arm_min',    label: 'arm_min  (min arm ÷ 2)' },
                            { value: 'arm_fill',   label: 'arm_fill  (max arm — full sweep)' },
                            { value: 'manual',     label: 'manual  (explicit px)' },
                            ...(isCssOuterOC ? [{ value: 'css', label: 'CSS expression (YAML only)' }] : []),
                        ]}}}
                        .value=${outerOCMode}
                        @value-changed=${(e) => this._handleSegCurveModeChange('elbow.segments.outer_segment.outer_curve', e.detail.value, Math.round(outerOCPx), 'clamp(30px, 4vw, 60px)', true)}>
                    </ha-selector>
                    ${isCssOuterOC
                        ? this._renderCssField('Outer Arc Radius', outerOC, 'elbow.segments.outer_segment.outer_curve', Math.round(outerOCPx))
                        : outerOCMode === 'manual' ? html`
                            <ha-selector .hass=${this.hass} .label=${'Outer Arc Radius'}
                                .selector=${{ number: { min: 0, max: 250, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                                .value=${typeof outerOC === 'number' ? outerOC : outerOCPx}
                                @input=${(e) => { const v = Number(e.composedPath?.()?.[0]?.value); if (!isNaN(v)) this._liveSegOuterOC = v; }}
                                @value-changed=${(e) => { this._liveSegOuterOC = null; this._setConfigValue('elbow.segments.outer_segment.outer_curve', e.detail.value); }}>
                            </ha-selector>
                        ` : this._renderCurveModeMessage('outer', outerOCMode, outerOCPx, outerBW, outerBH)}

                    <ha-selector .hass=${this.hass}
                        .label=${'Inner Arc Radius'}
                        .helper=${isCssOuterIC ? 'CSS expression — edit via YAML' : `→ ${outerICPx.toFixed(1)} px`}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: 'auto',       label: 'auto  (outer ÷ 2, LCARS formula)' },
                            { value: 'arm_max',    label: 'arm_max  (max arm ÷ 2)' },
                            { value: 'arm_width',  label: 'arm_width  (bar_width ÷ 2)' },
                            { value: 'arm_height', label: 'arm_height  (bar_height ÷ 2)' },
                            { value: 'arm_min',    label: 'arm_min  (min arm ÷ 2)' },
                            { value: 'arm_fill',   label: 'arm_fill  (max arm)' },
                            { value: 'manual',     label: 'manual  (explicit px)' },
                            ...(isCssOuterIC ? [{ value: 'css', label: 'CSS expression (YAML only)' }] : []),
                        ]}}}
                        .value=${outerICMode}
                        @value-changed=${(e) => this._handleSegCurveModeChange('elbow.segments.outer_segment.inner_curve', e.detail.value, Math.round(outerICPx), 'clamp(15px, 2vw, 30px)', false)}>
                    </ha-selector>
                    ${isCssOuterIC
                        ? this._renderCssField('Inner Arc Radius', outerIC, 'elbow.segments.outer_segment.inner_curve', Math.round(outerICPx))
                        : outerICMode === 'manual' ? html`
                            <ha-selector .hass=${this.hass} .label=${'Inner Arc Radius'}
                                .selector=${{ number: { min: 0, max: 250, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                                .value=${typeof outerIC === 'number' ? outerIC : outerICPx}
                                @input=${(e) => { const v = Number(e.composedPath?.()?.[0]?.value); if (!isNaN(v)) this._liveSegOuterIC = v; }}
                                @value-changed=${(e) => { this._liveSegOuterIC = null; this._setConfigValue('elbow.segments.outer_segment.inner_curve', e.detail.value); }}>
                            </ha-selector>
                        ` : this._renderCurveModeMessage('inner', outerICMode, outerICPx, outerBW, outerBH, outerOCPx)}

                    <ha-selector .hass=${this.hass}
                        .label=${'Curve Clamp'}
                        .helper=${{
                            card:   'card  — clamp to card dimensions (default)',
                            none:   'none  — no clamp; card clips SVG overflow',
                            manual: `manual  — ceiling at ${typeof outerClamp === 'number' ? outerClamp : 100} px`,
                        }[outerClampMode] ?? ''}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: 'card',   label: 'card  (clamp to card size)' },
                            { value: 'none',   label: 'none  (no clamp — use with arm_max for paired elbows)' },
                            { value: 'manual', label: 'manual  (explicit px ceiling)' },
                        ]}}}
                        .value=${outerClampMode}
                        @value-changed=${(e) => this._handleSegClampModeChange('elbow.segments.outer_segment.outer_curve_clamp', e.detail.value, 100)}>
                    </ha-selector>
                    ${outerClampMode === 'manual' ? html`
                        <ha-selector .hass=${this.hass} .label=${'Clamp Ceiling'}
                            .selector=${{ number: { min: 0, max: 500, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                            .value=${typeof outerClamp === 'number' ? outerClamp : 100}
                            @value-changed=${(e) => this._setConfigValue('elbow.segments.outer_segment.outer_curve_clamp', e.detail.value)}>
                        </ha-selector>
                    ` : ''}
                </lcards-form-section>

                <!-- Inner segment curves subsection -->
                <lcards-form-section
                    header="Inner Segment"
                    icon="mdi:vector-square-open"
                    ?expanded=${true}
                    ?outlined=${false}>

                    <ha-selector .hass=${this.hass}
                        .label=${'Outer Arc Radius'}
                        .helper=${isCssInnerOC ? 'CSS expression — edit via YAML' : `→ ${innerOCPx.toFixed(1)} px`}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: 'auto',       label: `auto  (concentric → ${innerOCAutoValue.toFixed(1)} px)` },
                            { value: 'arm_height', label: 'arm_height  (bar_height ÷ 2)' },
                            { value: 'arm_max',    label: 'arm_max  (max arm ÷ 2)' },
                            { value: 'arm_min',    label: 'arm_min  (min arm ÷ 2)' },
                            { value: 'arm_fill',   label: 'arm_fill  (max arm)' },
                            { value: 'manual',     label: 'manual  (explicit px)' },
                            ...(isCssInnerOC ? [{ value: 'css', label: 'CSS expression (YAML only)' }] : []),
                        ]}}}
                        .value=${innerOCMode}
                        @value-changed=${(e) => this._handleSegCurveModeChange('elbow.segments.inner_segment.outer_curve', e.detail.value, Math.round(innerOCPx), 'clamp(20px, 3vw, 45px)', true)}>
                    </ha-selector>
                    ${isCssInnerOC
                        ? this._renderCssField('Outer Arc Radius', innerOC, 'elbow.segments.inner_segment.outer_curve', Math.round(innerOCPx))
                        : innerOCMode === 'manual' ? html`
                            <ha-selector .hass=${this.hass} .label=${'Outer Arc Radius'}
                                .selector=${{ number: { min: 0, max: 250, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                                .value=${typeof innerOC === 'number' ? innerOC : innerOCPx}
                                @input=${(e) => { const v = Number(e.composedPath?.()?.[0]?.value); if (!isNaN(v)) this._liveSegInnerOC = v; }}
                                @value-changed=${(e) => { this._liveSegInnerOC = null; this._setConfigValue('elbow.segments.inner_segment.outer_curve', e.detail.value); }}>
                            </ha-selector>
                        ` : this._renderCurveModeMessage('outer', innerOCMode, innerOCPx, innerBW, innerBH)}

                    <ha-selector .hass=${this.hass}
                        .label=${'Inner Arc Radius'}
                        .helper=${isCssInnerIC ? 'CSS expression — edit via YAML' : `→ ${innerICPx.toFixed(1)} px`}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: 'auto',       label: 'auto  (outer ÷ 2, LCARS formula)' },
                            { value: 'arm_max',    label: 'arm_max  (max arm ÷ 2)' },
                            { value: 'arm_width',  label: 'arm_width  (bar_width ÷ 2)' },
                            { value: 'arm_height', label: 'arm_height  (bar_height ÷ 2)' },
                            { value: 'arm_min',    label: 'arm_min  (min arm ÷ 2)' },
                            { value: 'arm_fill',   label: 'arm_fill  (max arm)' },
                            { value: 'manual',     label: 'manual  (explicit px)' },
                            ...(isCssInnerIC ? [{ value: 'css', label: 'CSS expression (YAML only)' }] : []),
                        ]}}}
                        .value=${innerICMode}
                        @value-changed=${(e) => this._handleSegCurveModeChange('elbow.segments.inner_segment.inner_curve', e.detail.value, Math.round(innerICPx), 'clamp(10px, 1.5vw, 22px)', false)}>
                    </ha-selector>
                    ${isCssInnerIC
                        ? this._renderCssField('Inner Arc Radius', innerIC, 'elbow.segments.inner_segment.inner_curve', Math.round(innerICPx))
                        : innerICMode === 'manual' ? html`
                            <ha-selector .hass=${this.hass} .label=${'Inner Arc Radius'}
                                .selector=${{ number: { min: 0, max: 250, step: 5, mode: 'slider', unit_of_measurement: 'px' } }}
                                .value=${typeof innerIC === 'number' ? innerIC : innerICPx}
                                @input=${(e) => { const v = Number(e.composedPath?.()?.[0]?.value); if (!isNaN(v)) this._liveSegInnerIC = v; }}
                                @value-changed=${(e) => { this._liveSegInnerIC = null; this._setConfigValue('elbow.segments.inner_segment.inner_curve', e.detail.value); }}>
                            </ha-selector>
                        ` : this._renderCurveModeMessage('inner', innerICMode, innerICPx, innerBW, innerBH, innerOCPx)}

                </lcards-form-section>
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

                    <!-- Container Behavior -->
                    <lcards-form-section
                        header="Container"
                        description="Overflow and scrolling behavior for the symbiont content area"
                        icon="mdi:dock-window"
                        ?expanded=${false}
                        ?outlined=${true}>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Overflow'}
                            .helper=${'Sets both axes unless overridden below. Default: hidden (clips content).'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: 'hidden',  label: 'Hidden — clips content (default)' },
                                { value: 'visible', label: 'Visible — content paints outside' },
                                { value: 'clip',    label: 'Clip — hard clip, no scroll' },
                                { value: 'scroll',  label: 'Scroll — always shows scrollbar' },
                                { value: 'auto',    label: 'Auto — scrollbar only when needed' },
                            ] } }}
                            .value=${symbiont.overflow ?? 'hidden'}
                            @value-changed=${(e) => this._setConfigValue('symbiont.overflow', e.detail.value === 'hidden' ? undefined : e.detail.value)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Overflow X (horizontal)'}
                            .helper=${'Overrides the Overflow setting for the horizontal axis only.'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: '',        label: '— inherit from Overflow —' },
                                { value: 'hidden',  label: 'Hidden' },
                                { value: 'visible', label: 'Visible' },
                                { value: 'clip',    label: 'Clip' },
                                { value: 'scroll',  label: 'Scroll' },
                                { value: 'auto',    label: 'Auto' },
                            ] } }}
                            .value=${symbiont.overflow_x ?? ''}
                            @value-changed=${(e) => this._setConfigValue('symbiont.overflow_x', e.detail.value || undefined)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Overflow Y (vertical)'}
                            .helper=${'Overrides the Overflow setting for the vertical axis only.'}
                            .selector=${{ select: { mode: 'dropdown', options: [
                                { value: '',        label: '— inherit from Overflow —' },
                                { value: 'hidden',  label: 'Hidden' },
                                { value: 'visible', label: 'Visible' },
                                { value: 'clip',    label: 'Clip' },
                                { value: 'scroll',  label: 'Scroll' },
                                { value: 'auto',    label: 'Auto' },
                            ] } }}
                            .value=${symbiont.overflow_y ?? ''}
                            @value-changed=${(e) => this._setConfigValue('symbiont.overflow_y', e.detail.value || undefined)}>
                        </ha-selector>
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

                    <!-- Size & Anchor -->
                    <lcards-form-section
                        header="Size & Anchor"
                        description="Constrain the symbiont to an explicit size and anchor it within the content area"
                        icon="mdi:arrow-expand-all"
                        ?expanded=${false}
                        ?outlined=${true}>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Width'}
                            .helper=${'CSS width of the symbiont container — e.g. "50%" or "200px". Leave blank to fill the available area.'}
                            .selector=${{ text: {} }}
                            .value=${symbiont.size?.width ?? ''}
                            @value-changed=${(e) => this._setConfigValue('symbiont.size.width', e.detail.value || null)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Height'}
                            .helper=${'CSS height of the symbiont container — e.g. "50%" or "150px". Leave blank to fill the available area.'}
                            .selector=${{ text: {} }}
                            .value=${symbiont.size?.height ?? ''}
                            @value-changed=${(e) => this._setConfigValue('symbiont.size.height', e.detail.value || null)}>
                        </ha-selector>

                        ${(symbiont.size?.width != null || symbiont.size?.height != null) ? html`
                            <ha-selector
                                .hass=${this.hass}
                                .label=${'Anchor'}
                                .helper=${'Where to place the sized container within the content area'}
                                .selector=${{ select: { mode: 'dropdown', options: [
                                    { value: 'top-left',      label: 'Top Left'      },
                                    { value: 'top-center',    label: 'Top Center'    },
                                    { value: 'top-right',     label: 'Top Right'     },
                                    { value: 'middle-left',   label: 'Middle Left'   },
                                    { value: 'center',        label: 'Center'        },
                                    { value: 'middle-right',  label: 'Middle Right'  },
                                    { value: 'bottom-left',   label: 'Bottom Left'   },
                                    { value: 'bottom-center', label: 'Bottom Center' },
                                    { value: 'bottom-right',  label: 'Bottom Right'  },
                                ] } }}
                                .value=${symbiont.anchor ?? 'top-left'}
                                @value-changed=${(e) => this._setConfigValue('symbiont.anchor', e.detail.value)}>
                            </ha-selector>
                        ` : ''}

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
                                    .suggestedStates=${['default', 'active', 'inactive', 'zero', 'non_zero']}
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
                                    .suggestedStates=${['default', 'active', 'inactive', 'zero', 'non_zero']}
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
     * Build a zone-name → label map for the zone routing dropdown,
     * derived from the current elbow configuration (no live card instance needed).
     * @param {Object} elbowCfg - this.config.elbow
     * @returns {Object.<string,string>} zoneName → human label
     * @private
     */
    _buildAvailableZones(elbowCfg) {
        const type  = elbowCfg.type  || 'header-left';
        const style = elbowCfg.style || 'simple';

        // Frame — sides present in config
        if (type === 'frame') {
            const sides = elbowCfg.frame?.sides || {};
            const zones = {};
            if (sides.top?.enabled)    zones.top    = 'Top';
            if (sides.bottom?.enabled) zones.bottom = 'Bottom';
            if (sides.left?.enabled)   zones.left   = 'Left';
            if (sides.right?.enabled)  zones.right  = 'Right';
            zones.body = 'Body (interior)';
            return zones;
        }

        // Segmented (Picard-style double elbow)
        if (style === 'segmented') {
            return {
                outer_vertical_bar:   'Outer Vertical Bar',
                inner_vertical_bar:   'Inner Vertical Bar',
                outer_horizontal_bar: 'Outer Horizontal Bar',
                inner_horizontal_bar: 'Inner Horizontal Bar',
                body:                 'Body (open area)'
            };
        }

        // Simple L-shaped elbow (default)
        return {
            vertical_bar:   'Vertical Bar',
            horizontal_bar: 'Horizontal Bar',
            body:           'Body (open area)'
        };
    }

    /**
     * Render text tab
     * @returns {TemplateResult}
     * @private
     */
    _renderTextTab() {
        // CRITICAL: Use this.config?.text to ensure Lit reactivity when config changes
        const textConfig = this.config?.text || {};

        // Build available zones from the current elbow configuration.
        const availableZones = { ...this._buildAvailableZones(this.config?.elbow || {}) };
        // Always merge user-defined config.zones so any custom zones appear in the selector.
        for (const name of Object.keys(this.config?.zones || {})) {
            if (!availableZones[name]) {
                availableZones[name] = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            }
        }

        return html`
            <lcards-multi-text-editor-v2
                .editor=${this}
                .text=${textConfig}
                .hass=${this.hass}
                .availableZones=${availableZones}
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
        const mode = event.detail.value;
        if (mode === 'css') return; // read-only; set via YAML

        if (mode === 'manual') {
            const barWidth = this.config.elbow?.segment?.bar_width;
            const numericBarWidth = typeof barWidth === 'number' ? barWidth : 90;
            this._setConfigValue('elbow.segment.outer_curve', numericBarWidth / 2);
        } else {
            // Keyword modes: 'auto', 'arm_width', 'arm_height', 'arm_max', 'arm_min', 'arm_fill'
            // 'auto' and 'arm_width' are equivalent; store 'auto' as canonical for backward compat
            this._setConfigValue('elbow.segment.outer_curve', mode === 'arm_width' ? 'auto' : mode);
        }

        this.requestUpdate();
    }

    /**
     * Render a static labeled SVG diagram explaining the four geometry terms.
     * This is the collapsed reference at the top of the Elbow Design tab.
     */
    /**
     * Fixed-proportion reference diagram for the segmented (double) elbow.
     * Shows both outer (orange) and inner (cyan) segments with key dimension labels.
     */
    _renderSegmentedElbowReferenceDiagram() {
        // Fixed reference geometry — chosen to make both segments clearly visible
        const oBW = 45, oBH = 18, oOR = 65, oIR = 28;
        const cW = 230, cH = 140;
        const gap = 4;
        const iBW = 28, iBH = 11;
        const iOR = 33;  // oOR − gap − iBW = 65 − 4 − 28
        const iIR = 13;  // approx oIR − gap − iBH
        const ox = oBW + gap;  // 49 — inner segment left/top offset
        const oy = oBH + gap;  // 22

        const outerPath = `M ${oOR} 0 L ${cW} 0 L ${cW} ${oBH} L ${oBW + oIR} ${oBH} A ${oIR} ${oIR} 0 0 0 ${oBW} ${oBH + oIR} L ${oBW} ${cH} L 0 ${cH} L 0 ${oOR} A ${oOR} ${oOR} 0 0 1 ${oOR} 0 Z`;
        const innerPath = `M ${ox + iOR} ${oy} L ${cW} ${oy} L ${cW} ${oy + iBH} L ${ox + iBW + iIR} ${oy + iBH} A ${iIR} ${iIR} 0 0 0 ${ox + iBW} ${oy + iBH + iIR} L ${ox + iBW} ${cH} L ${ox} ${cH} L ${ox} ${oy + iOR} A ${iOR} ${iOR} 0 0 1 ${ox + iOR} ${oy} Z`;

        return html`
            <svg viewBox="0 0 380 185" style="width: 100%; max-width: 480px; height: auto;" overflow="hidden">
                <defs>
                    <marker id="sgA" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="var(--secondary-text-color,#aaa)"/>
                    </marker>
                    <marker id="sgDH" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto-start-reverse">
                        <polygon points="0 0,8 2.5,0 5" fill="var(--secondary-text-color,#aaa)"/>
                    </marker>
                    <marker id="sgC" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#00CFFF"/>
                    </marker>
                    <marker id="sgB" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#5599FF"/>
                    </marker>
                    <marker id="sgO" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#FF8C00"/>
                    </marker>
                    <marker id="sgY" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#FFAA33"/>
                    </marker>
                </defs>

                <g transform="translate(120, 28)">
                    <!-- Card outline -->
                    <rect x="0" y="0" width="${cW}" height="${cH}" fill="none"
                          stroke="var(--divider-color,#333)" stroke-width="1" stroke-dasharray="3,2"/>

                    <!-- Outer segment (blue) -->
                    <path d="${outerPath}" fill="#5599FF" opacity="0.80"/>

                    <!-- Inner segment (orange) -->
                    <path d="${innerPath}" fill="#FF8C00" opacity="0.85"/>

                    <!-- outer seg. outer_curve arc — cyan -->
                    <path d="M ${oOR} 0 A ${oOR} ${oOR} 0 0 0 0 ${oOR}"
                          fill="none" stroke="#00CFFF" stroke-width="2" stroke-dasharray="5,3"/>
                    <line x1="-15" y1="18" x2="14" y2="18" stroke="#00CFFF" stroke-width="1.5" marker-end="url(#sgC)"/>
                    <text x="-17" y="13" fill="#00CFFF" font-size="11" text-anchor="end" font-family="monospace">outer_curve</text>
                    <text x="-17" y="25" fill="#00CFFF" font-size="9" text-anchor="end">outer seg.</text>

                    <!-- outer seg. inner_curve arc — blue -->
                    <path d="M ${oBW + oIR} ${oBH} A ${oIR} ${oIR} 0 0 0 ${oBW} ${oBH + oIR}"
                          fill="none" stroke="#5599FF" stroke-width="2" stroke-dasharray="5,3"/>
                    <line x1="-15" y1="40" x2="${oBW + oIR - 8}" y2="${oBH + oIR - 8}"
                          stroke="#5599FF" stroke-width="1.5" marker-end="url(#sgB)"/>
                    <text x="-17" y="36" fill="#5599FF" font-size="11" text-anchor="end" font-family="monospace">inner_curve</text>
                    <text x="-17" y="48" fill="#5599FF" font-size="9" text-anchor="end">outer seg.</text>

                    <!-- bar_width: horizontal double-headed arrow showing width of vertical arm -->
                    <line x1="0" y1="115" x2="${oBW}" y2="115"
                          stroke="var(--secondary-text-color,#aaa)" stroke-width="1.5"
                          marker-start="url(#sgDH)" marker-end="url(#sgDH)"/>
                    <line x1="0" y1="111" x2="0" y2="119" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <line x1="${oBW}" y1="111" x2="${oBW}" y2="119" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <text x="-6" y="110" fill="var(--primary-text-color,#fff)" font-size="11" text-anchor="end" font-family="monospace">bar_width</text>
                    <text x="-6" y="122" fill="var(--secondary-text-color,#aaa)" font-size="9" text-anchor="end">outer seg.</text>

                    <!-- bar_height: vertical double-headed arrow showing height of horizontal arm -->
                    <line x1="${cW - 25}" y1="0" x2="${cW - 25}" y2="${oBH}"
                          stroke="var(--secondary-text-color,#aaa)" stroke-width="1.5"
                          marker-start="url(#sgDH)" marker-end="url(#sgDH)"/>
                    <line x1="${cW - 29}" y1="0" x2="${cW - 21}" y2="0" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <line x1="${cW - 29}" y1="${oBH}" x2="${cW - 21}" y2="${oBH}" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <text x="${cW - 25}" y="-13" fill="var(--primary-text-color,#fff)" font-size="11" text-anchor="middle" font-family="monospace">bar_height</text>
                    <text x="${cW - 25}" y="-2" fill="var(--secondary-text-color,#aaa)" font-size="9" text-anchor="middle">outer seg.</text>

                    <!-- gap annotation: dashed guide at inner left edge + measurement label -->
                    <line x1="${ox}" y1="${oBH + 2}" x2="${ox}" y2="${cH - 2}"
                          stroke="var(--divider-color,#555)" stroke-width="1" stroke-dasharray="2,2"/>
                    <line x1="${oBW + 1}" y1="${cH * 0.62}" x2="${ox - 1}" y2="${cH * 0.62}"
                          stroke="var(--secondary-text-color,#888)" stroke-width="1.5"/>
                    <text x="${(oBW + ox) / 2}" y="${cH * 0.62 - 4}" fill="var(--secondary-text-color,#aaa)"
                          font-size="9" text-anchor="middle" font-family="monospace">gap</text>

                    <!-- inner seg. outer_curve arc — orange, leader into content area -->
                    <path d="M ${ox + iOR} ${oy} A ${iOR} ${iOR} 0 0 0 ${ox} ${oy + iOR}"
                          fill="none" stroke="#FF8C00" stroke-width="1.8" stroke-dasharray="4,3" opacity="0.9"/>
                    <line x1="${ox + 46}" y1="${oy + 47}" x2="${ox + 24}" y2="${oy + 24}"
                          stroke="#FF8C00" stroke-width="1.5" marker-end="url(#sgO)"/>
                    <text x="${ox + 48}" y="${oy + 44}" fill="#FF8C00" font-size="9" text-anchor="start">inner seg.</text>
                    <text x="${ox + 48}" y="${oy + 56}" fill="#FF8C00" font-size="11" text-anchor="start" font-family="monospace">outer_curve</text>

                    <!-- inner seg. inner_curve arc — amber, L-shaped leader routes below orange labels then up to arc -->
                    <path d="M ${ox + iBW + iIR} ${oy + iBH} A ${iIR} ${iIR} 0 0 0 ${ox + iBW} ${oy + iBH + iIR}"
                          fill="none" stroke="#FFAA33" stroke-width="1.8" stroke-dasharray="4,3" opacity="0.9"/>
                    <polyline points="${ox+110},${oy+95} ${ox+iBW+9},${oy+95} ${ox+iBW+9},${oy+iBH+11}"
                              fill="none" stroke="#FFAA33" stroke-width="1.5" marker-end="url(#sgY)"/>
                    <text x="${ox + 112}" y="${oy + 82}" fill="#FFAA33" font-size="9" text-anchor="start">inner seg.</text>
                    <text x="${ox + 112}" y="${oy + 94}" fill="#FFAA33" font-size="11" text-anchor="start" font-family="monospace">inner_curve</text>
                </g>
            </svg>
        `;
    }

    /**
     * Live dynamic SVG showing BOTH segments scaled to fit the preview area.
     */
    _renderSegmentedLivePreview(outerOC, outerIC, outerBW, outerBH, innerOC, innerIC, innerBW, innerBH, gapPx, clampMode, clampCeil, cardH, cardW, innerOCIsConcentric = false, innerICDerivesFromOC = false) {
        if (!outerBW || !outerBH) return html``;

        // Scale so outer bar_width ≤ 90px, bar_height ≤ 50px, outer_curve ≤ 110px
        const k = Math.min(90 / outerBW, 50 / outerBH, 110 / Math.max(outerOC || 1, 1), 2.5);

        // Outer segment scaled
        const bW = outerBW * k;
        const bH = outerBH * k;
        const oR = outerOC * k;
        const oIR = Math.min(outerIC * k, Math.max(0, oR - 0.5));

        // Preview card size
        const cH = Math.max(oR + 28, bH * 2.5, 70);
        const cW = Math.max(bW * 2, 170);

        // Card boundary indicators (only when style.height/width are explicit px values)
        const cardHSc = typeof cardH === 'number' && cardH > 0 ? cardH * k : null;
        const cardWSc = typeof cardW === 'number' && cardW > 0 ? cardW * k : null;

        // Clamp outer arc for display — card clamp uses actual card dims when known
        const oRp  = clampMode === 'manual' && typeof clampCeil === 'number'
            ? Math.min(oR, clampCeil * k, cH - 1, cW - 1)
            : clampMode === 'card' && (cardHSc !== null || cardWSc !== null)
                ? Math.min(oR, cardHSc ?? Infinity, cardWSc ?? Infinity, cH - 1, cW - 1)
                : Math.min(oR, cH - 1, cW - 1);
        const oIRp = oR > 0 ? Math.max(0, oIR * (oRp / oR)) : 0;

        const showCardH = cardHSc !== null && cardHSc > 2 && cardHSc < cH;
        const showCardW = cardWSc !== null && cardWSc > 2 && cardWSc < cW;
        const cardHOverflow = showCardH && oRp > cardHSc;
        const cardWOverflow = showCardW && oRp > cardWSc;

        // Clamped real-px values for labels (null when not clamped)
        const outerOCClampedPx = oRp < oR - 0.5 ? oRp / k : null;
        const outerICClampedPx = oIRp < oIR - 0.5 ? oIRp / k : null;

        // The L-shape path already traces only the arm perimeter — the content area is naturally
        // outside the closed path, so no evenodd trick is needed.
        const outerBandPath =
            `M ${oRp} 0 L ${cW} 0 L ${cW} ${bH} L ${bW + oIRp} ${bH} A ${oIRp} ${oIRp} 0 0 0 ${bW} ${bH + oIRp} L ${bW} ${cH} L 0 ${cH} L 0 ${oRp} A ${oRp} ${oRp} 0 0 1 ${oRp} 0 Z`;

        // Inner segment: minimum visible gap of 4px for preview clarity
        const gpDisplay = Math.max(gapPx * k, 4);
        const iBW = innerBW * k;
        const iBH = innerBH * k;
        const ox  = bW + gpDisplay;
        const oy  = bH + gpDisplay;
        const icW = cW - ox;
        const icH = cH - oy;

        // When inner outer_curve is concentric (config undefined), cascade from the clamped
        // outer inner_curve (oIRp) rather than from the pre-clamp geometry value.
        const iORraw = innerOCIsConcentric
            ? Math.max(0, oIRp - gapPx * k)
            : innerOC * k;
        const iOR = Math.max(0, Math.min(iORraw, icH - 0.5, icW - 0.5));
        const iIR = (innerOCIsConcentric && innerICDerivesFromOC)
            ? Math.max(0, Math.min(iOR / 2, iOR - 0.5))
            : Math.max(0, Math.min(innerIC * k, iOR - 0.5));

        const hasInner = iBW > 0 && iBH > 0 && icW > iBW && icH > iBH;
        const innerPath = hasInner
            ? `M ${ox + iOR} ${oy} L ${cW} ${oy} L ${cW} ${oy + iBH} L ${ox + iBW + iIR} ${oy + iBH} A ${iIR} ${iIR} 0 0 0 ${ox + iBW} ${oy + iBH + iIR} L ${ox + iBW} ${cH} L ${ox} ${cH} L ${ox} ${oy + iOR} A ${iOR} ${iOR} 0 0 1 ${ox + iOR} ${oy} Z`
            : null;

        const legendH = hasInner ? 74 : 46;
        const svgH = cH + legendH;
        const svgW = cW + 20;

        return html`
            <svg viewBox="0 0 ${svgW} ${svgH}" style="width: 100%; max-width: 380px; height: auto;" overflow="hidden">
                <g transform="translate(8, 6)">
                    <!-- Card background — makes the gap between segments visible -->
                    <rect x="0" y="0" width="${cW}" height="${cH}"
                          fill="var(--ha-card-background-color,var(--card-background-color,#1c1c2a))"
                          stroke="var(--divider-color,#444)" stroke-width="1" stroke-dasharray="4,3" rx="2"/>

                    <!-- Outer segment arms — blue, L-path naturally excludes the content area -->
                    <path d="${outerBandPath}" fill="#5599FF" opacity="0.85"/>
                    <!-- outer outer_curve arc -->
                    <path d="M ${oRp} 0 A ${oRp} ${oRp} 0 0 0 0 ${oRp}"
                          fill="none" stroke="#00CFFF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    <!-- outer inner_curve arc -->
                    ${oIRp > 2 ? svg`
                        <path d="M ${bW + oIRp} ${bH} A ${oIRp} ${oIRp} 0 0 0 ${bW} ${bH + oIRp}"
                              fill="none" stroke="#5599FF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    ` : ''}

                    <!-- Inner segment — orange, sits inside the gap -->
                    ${hasInner ? svg`
                        <path d="${innerPath}" fill="#FF8C00" opacity="0.85"/>
                        <!-- inner outer_curve arc -->
                        ${iOR > 2 ? svg`
                            <path d="M ${ox + iOR} ${oy} A ${iOR} ${iOR} 0 0 0 ${ox} ${oy + iOR}"
                                  fill="none" stroke="#FF8C00" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.85"/>
                        ` : ''}
                        <!-- inner inner_curve arc -->
                        ${iIR > 2 ? svg`
                            <path d="M ${ox + iBW + iIR} ${oy + iBH} A ${iIR} ${iIR} 0 0 0 ${ox + iBW} ${oy + iBH + iIR}"
                                  fill="none" stroke="#FFAA33" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                        ` : ''}
                    ` : ''}

                    <!-- Card boundary lines — dashed line + faint overlay shows what the card clips -->
                    ${showCardH ? svg`
                        ${cardHOverflow ? svg`
                            <rect x="0" y="${cardHSc}" width="${cW}" height="${cH - cardHSc}"
                                  fill="#FF4444" opacity="0.10"/>
                        ` : ''}
                        <line x1="0" y1="${cardHSc}" x2="${cW}" y2="${cardHSc}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${cW - 3}" y="${cardHSc - 3}" fill="#FF4444" font-size="8" text-anchor="end" opacity="0.9">↕ ${cardH}px</text>
                    ` : ''}
                    ${showCardW ? svg`
                        ${cardWOverflow ? svg`
                            <rect x="${cardWSc}" y="0" width="${cW - cardWSc}" height="${cH}"
                                  fill="#FF4444" opacity="0.10"/>
                        ` : ''}
                        <line x1="${cardWSc}" y1="0" x2="${cardWSc}" y2="${cH}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${cardWSc + 3}" y="10" fill="#FF4444" font-size="8" text-anchor="start" opacity="0.9">↔ ${cardW}px</text>
                    ` : ''}

                    <!-- Clamp indicator (bottom-right) -->
                    ${clampMode === 'none' ? svg`
                        <text x="${cW - 2}" y="${cH - 5}" fill="#7BCF7B" font-size="9" text-anchor="end" opacity="0.8">no clamp</text>
                    ` : clampMode === 'card' ? svg`
                        <text x="${cW - 2}" y="${cH - 5}" fill="var(--secondary-text-color,#888)" font-size="9" text-anchor="end" opacity="0.7">card clamp</text>
                    ` : svg`
                        <text x="${cW - 2}" y="${cH - 5}" fill="var(--warning-color,#FFA500)" font-size="9" text-anchor="end" opacity="0.8">fixed clamp</text>
                    `}

                    <!-- Legend -->
                    <circle cx="4" cy="${cH + 14}" r="4" fill="#00CFFF" opacity="0.9"/>
                    <text x="12" y="${cH + 18}" fill="#00CFFF" font-size="9" font-family="monospace">outer_curve = ${outerOCClampedPx !== null ? `${outerOC.toFixed(1)}→${outerOCClampedPx.toFixed(1)}px` : `${outerOC.toFixed(1)}px`}</text>
                    <circle cx="4" cy="${cH + 30}" r="4" fill="#5599FF" opacity="0.9"/>
                    <text x="12" y="${cH + 34}" fill="#5599FF" font-size="9" font-family="monospace">inner_curve = ${outerICClampedPx !== null ? `${outerIC.toFixed(1)}→${outerICClampedPx.toFixed(1)}px` : `${outerIC.toFixed(1)}px`}</text>
                    ${hasInner ? svg`
                        <circle cx="4" cy="${cH + 46}" r="4" fill="#FF8C00" opacity="0.9"/>
                        <text x="12" y="${cH + 50}" fill="#FF8C00" font-size="9" font-family="monospace">outer_curve = ${innerOCIsConcentric ? `${(iOR / k).toFixed(1)}px` : `${innerOC.toFixed(1)}px`}</text>
                        <circle cx="4" cy="${cH + 62}" r="4" fill="#FFAA33" opacity="0.9"/>
                        <text x="12" y="${cH + 66}" fill="#FFAA33" font-size="9" font-family="monospace">inner_curve = ${(innerOCIsConcentric && innerICDerivesFromOC) ? `${(iIR / k).toFixed(1)}px` : `${innerIC.toFixed(1)}px`}</text>
                    ` : ''}
                </g>
            </svg>
        `;
    }

    _renderElbowReferenceDiagram() {
        // Fixed proportions: bW=80, bH=22, oR=60, iR=30 — always the same reference shape
        const bW = 80, bH = 22, oR = 60, iR = 30;
        const cW = 230, cH = 140;

        // Inner arc center: (bW, bH). Start: (bW + iR, bH), End: (bW, bH + iR).
        const elbowPath = `M ${oR} 0 L ${cW} 0 L ${cW} ${bH} L ${bW + iR} ${bH} A ${iR} ${iR} 0 0 0 ${bW} ${bH + iR} L ${bW} ${cH} L 0 ${cH} L 0 ${oR} A ${oR} ${oR} 0 0 1 ${oR} 0 Z`;

        return html`
            <svg viewBox="0 0 380 185" style="width: 100%; max-width: 480px; height: auto;" overflow="hidden">
                <defs>
                    <marker id="rda" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="var(--secondary-text-color,#aaa)"/>
                    </marker>
                    <marker id="rdaDH" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto-start-reverse">
                        <polygon points="0 0,8 2.5,0 5" fill="var(--secondary-text-color,#aaa)"/>
                    </marker>
                    <marker id="rdc" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#00CFFF"/>
                    </marker>
                    <marker id="rdy" markerWidth="8" markerHeight="8" refX="7" refY="2.5" orient="auto">
                        <polygon points="0 0,8 2.5,0 5" fill="#FFAA33"/>
                    </marker>
                </defs>

                <g transform="translate(120, 28)">
                    <!-- Elbow fill -->
                    <path d="${elbowPath}" fill="var(--primary-color,#FF9900)" opacity="0.75"/>

                    <!-- bar_width: horizontal double-headed arrow showing width (thickness) of vertical arm -->
                    <line x1="0" y1="115" x2="${bW}" y2="115"
                          stroke="var(--secondary-text-color,#aaa)" stroke-width="1.5"
                          marker-start="url(#rdaDH)" marker-end="url(#rdaDH)"/>
                    <line x1="0" y1="111" x2="0" y2="119" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <line x1="${bW}" y1="111" x2="${bW}" y2="119" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <text x="-6" y="110" fill="var(--primary-text-color,#fff)" font-size="11" text-anchor="end" font-family="monospace">bar_width</text>
                    <text x="-6" y="122" fill="var(--secondary-text-color,#aaa)" font-size="9" text-anchor="end">vertical arm</text>

                    <!-- bar_height: vertical double-headed arrow showing height (thickness) of horizontal arm -->
                    <line x1="${cW - 25}" y1="0" x2="${cW - 25}" y2="${bH}"
                          stroke="var(--secondary-text-color,#aaa)" stroke-width="1.5"
                          marker-start="url(#rdaDH)" marker-end="url(#rdaDH)"/>
                    <line x1="${cW - 29}" y1="0" x2="${cW - 21}" y2="0" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <line x1="${cW - 29}" y1="${bH}" x2="${cW - 21}" y2="${bH}" stroke="var(--secondary-text-color,#aaa)" stroke-width="1"/>
                    <text x="${cW - 25}" y="-13" fill="var(--primary-text-color,#fff)" font-size="11" text-anchor="middle" font-family="monospace">bar_height</text>
                    <text x="${cW - 25}" y="-2" fill="var(--secondary-text-color,#aaa)" font-size="9" text-anchor="middle">horiz. arm</text>

                    <!-- outer_curve arc highlight — leader line points at arc midpoint (18,18) -->
                    <path d="M ${oR} 0 A ${oR} ${oR} 0 0 0 0 ${oR}"
                          fill="none" stroke="#00CFFF" stroke-width="2.5" stroke-dasharray="5,3"/>
                    <line x1="-15" y1="18" x2="14" y2="18" stroke="#00CFFF" stroke-width="1.5" marker-end="url(#rdc)"/>
                    <text x="-17" y="13" fill="#00CFFF" font-size="11" text-anchor="end" font-family="monospace">outer_curve</text>
                    <text x="-17" y="25" fill="#4DDDFF" font-size="9" text-anchor="end">sweep radius</text>

                    <!-- inner_curve arc highlight -->
                    <path d="M ${bW + iR} ${bH} A ${iR} ${iR} 0 0 0 ${bW} ${bH + iR}"
                          fill="none" stroke="#FFAA33" stroke-width="2.5" stroke-dasharray="5,3"/>
                    <line x1="${bW}" y1="${bH + iR}" x2="${bW + 30}" y2="${bH + iR + 30}" stroke="#FFAA33" stroke-width="1.5" marker-end="url(#rdy)"/>
                    <text x="${bW + 32}" y="${bH + iR + 35}" fill="#FFAA33" font-size="11" text-anchor="start" font-family="monospace">inner_curve</text>
                    <text x="${bW + 32}" y="${bH + iR + 47}" fill="#FFCC77" font-size="9" text-anchor="start">concave corner</text>
                </g>
            </svg>
        `;
    }

    /**
     * Live dynamic SVG showing the actual computed arc geometry.
     * Scales all dimensions so the result always fits the preview area.
     */
    _renderCurveLivePreview(outerR, innerR, barW, barH, clampMode, clampCeil, cardH, cardW) {
        // Scale so bar_width = max 90px, bar_height = max 50px, outer_curve = max 110px
        const k = Math.min(90 / barW, 50 / barH, 110 / (outerR || 1), 2.5);
        const bW = barW * k;
        const bH = barH * k;
        const oR = outerR * k;
        const iR = Math.min(innerR * k, oR - 0.5);

        // Preview card: height = outer radius + content strip
        const cH = Math.max(oR + 28, bH * 2.5, 70);
        const cW = Math.max(bW * 2, 170);

        // Card boundary indicators (only when style.height/width are explicit px values)
        const cardHSc = typeof cardH === 'number' && cardH > 0 ? cardH * k : null;
        const cardWSc = typeof cardW === 'number' && cardW > 0 ? cardW * k : null;

        // Apply configured clamp mode — card clamp uses actual card dims when known
        const oRp = clampMode === 'manual' && typeof clampCeil === 'number'
            ? Math.min(oR, clampCeil * k, cH - 1, cW - 1)
            : clampMode === 'card' && (cardHSc !== null || cardWSc !== null)
                ? Math.min(oR, cardHSc ?? Infinity, cardWSc ?? Infinity, cH - 1, cW - 1)
                : Math.min(oR, cH - 1, cW - 1);
        const iRp = oR > 0 ? Math.max(0, iR * (oRp / oR)) : 0;

        const showCardH = cardHSc !== null && cardHSc > 2 && cardHSc < cH;
        const showCardW = cardWSc !== null && cardWSc > 2 && cardWSc < cW;
        const cardHOverflow = showCardH && oRp > cardHSc;
        const cardWOverflow = showCardW && oRp > cardWSc;

        // Clamped real-px values for labels (null when not clamped)
        const outerClampedPx = oRp < oR - 0.5 ? oRp / k : null;
        const innerClampedPx = iRp < iR - 0.5 ? iRp / k : null;

        const elbowPath = `M ${oRp} 0 L ${cW} 0 L ${cW} ${bH} L ${bW + iRp} ${bH} A ${iRp} ${iRp} 0 0 0 ${bW} ${bH + iRp} L ${bW} ${cH} L 0 ${cH} L 0 ${oRp} A ${oRp} ${oRp} 0 0 1 ${oRp} 0 Z`;

        // Label positions
        const outerLabelX = oRp > 40 ? oRp / 2 - 4 : oRp + 8;
        const outerLabelY = oRp > 40 ? oRp / 2 - 4 : 4;
        const innerLabelX = bW + iRp / 2;
        const innerLabelY = bH + iRp + 14;

        // Total SVG height including padding for labels below
        const svgH = cH + 44;
        const svgW = cW + 20;

        return html`
            <svg viewBox="0 0 ${svgW} ${svgH}" style="width: 100%; max-width: 380px; height: auto;" overflow="hidden">
                <defs>
                    <marker id="lpa" markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
                        <polygon points="0 0,7 2.5,0 5" fill="#00CFFF"/>
                    </marker>
                    <marker id="lpb" markerWidth="7" markerHeight="7" refX="6" refY="2.5" orient="auto">
                        <polygon points="0 0,7 2.5,0 5" fill="#FFAA33"/>
                    </marker>
                </defs>

                <g transform="translate(8, 6)">
                    <!-- Card outline -->
                    <rect x="0" y="0" width="${cW}" height="${cH}"
                          fill="none" stroke="var(--divider-color,#444)" stroke-width="1" stroke-dasharray="4,3" rx="2"/>

                    <!-- Elbow fill -->
                    <path d="${elbowPath}" fill="var(--primary-color,#FF9900)" opacity="0.8"/>

                    <!-- Outer arc annotation -->
                    <path d="M ${oRp} 0 A ${oRp} ${oRp} 0 0 0 0 ${oRp}"
                          fill="none" stroke="#00CFFF" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    <text x="${outerLabelX}" y="${outerLabelY}"
                          fill="#00CFFF" font-size="10" text-anchor="middle" font-family="monospace"
                          dominant-baseline="auto">${outerClampedPx !== null ? `${outerR.toFixed(1)}→${outerClampedPx.toFixed(1)}px` : `${outerR.toFixed(1)}px`}</text>

                    <!-- Inner arc annotation -->
                    <path d="M ${bW + iRp} ${bH} A ${iRp} ${iRp} 0 0 0 ${bW} ${bH + iRp}"
                          fill="none" stroke="#FFAA33" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.9"/>
                    ${iRp > 6 ? svg`
                        <text x="${innerLabelX}" y="${innerLabelY}"
                              fill="#FFAA33" font-size="10" text-anchor="middle" font-family="monospace">${innerClampedPx !== null ? `${innerR.toFixed(1)}→${innerClampedPx.toFixed(1)}px` : `${innerR.toFixed(1)}px`}</text>
                    ` : ''}

                    <!-- Card boundary lines — dashed line + faint overlay shows what the card clips -->
                    ${showCardH ? svg`
                        ${cardHOverflow ? svg`
                            <rect x="0" y="${cardHSc}" width="${cW}" height="${cH - cardHSc}"
                                  fill="#FF4444" opacity="0.10"/>
                        ` : ''}
                        <line x1="0" y1="${cardHSc}" x2="${cW}" y2="${cardHSc}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${cW - 3}" y="${cardHSc - 3}" fill="#FF4444" font-size="8" text-anchor="end" opacity="0.9">↕ ${cardH}px</text>
                    ` : ''}
                    ${showCardW ? svg`
                        ${cardWOverflow ? svg`
                            <rect x="${cardWSc}" y="0" width="${cW - cardWSc}" height="${cH}"
                                  fill="#FF4444" opacity="0.10"/>
                        ` : ''}
                        <line x1="${cardWSc}" y1="0" x2="${cardWSc}" y2="${cH}"
                              stroke="#FF4444" stroke-width="1.5" stroke-dasharray="5,3" opacity="0.8"/>
                        <text x="${cardWSc + 3}" y="10" fill="#FF4444" font-size="8" text-anchor="start" opacity="0.9">↔ ${cardW}px</text>
                    ` : ''}

                    <!-- Clamp-mode indicator (bottom-right) -->
                    ${clampMode === 'none' ? svg`
                        <text x="${cW - 2}" y="${cH - 5}" fill="#7BCF7B" font-size="9" text-anchor="end" opacity="0.8">no clamp</text>
                    ` : clampMode === 'card' ? svg`
                        <text x="${cW - 2}" y="${cH - 5}" fill="var(--secondary-text-color,#888)" font-size="9" text-anchor="end" opacity="0.7">card clamp</text>
                    ` : svg`
                        <text x="${cW - 2}" y="${cH - 5}" fill="var(--warning-color,#FFA500)" font-size="9" text-anchor="end" opacity="0.8">fixed clamp</text>
                    `}

                    <!-- Legend row below card -->
                    <circle cx="4" cy="${cH + 14}" r="4" fill="#00CFFF" opacity="0.9"/>
                    <text x="12" y="${cH + 18}" fill="#00CFFF" font-size="10" font-family="monospace">outer_curve = ${outerClampedPx !== null ? `${outerR.toFixed(1)}→${outerClampedPx.toFixed(1)}px` : `${outerR.toFixed(1)}px`}</text>
                    <circle cx="4" cy="${cH + 30}" r="4" fill="#FFAA33" opacity="0.9"/>
                    <text x="12" y="${cH + 34}" fill="#FFAA33" font-size="10" font-family="monospace">inner_curve = ${innerClampedPx !== null ? `${innerR.toFixed(1)}→${innerClampedPx.toFixed(1)}px` : `${innerR.toFixed(1)}px`}</text>
                </g>
            </svg>
        `;
    }

    /**
     * Render a contextual info message for the selected curve mode.
     * @param {'outer'|'inner'} which
     * @param {string} mode  - the selected keyword
     * @param {number} resolvedPx - the computed radius in px
     * @param {number} barW, barH - arm dimensions
     * @param {number} [outerPx] - for inner mode: the outer radius (for 'auto' description)
     */
    _renderCurveModeMessage(which, mode, resolvedPx, barW, barH, outerPx) {
        const f = (n) => n.toFixed(1);
        const messages = which === 'outer' ? {
            auto:       `bar_width ÷ 2 = ${f(barW / 2)} px. Classic LCARS sweep from the vertical arm.`,
            arm_height: `bar_height ÷ 2 = ${f(barH / 2)} px. Based on the horizontal arm — ${barH < barW ? 'smaller than auto for this config' : 'useful when bar_height is the dominant arm'}.`,
            arm_max:    `max(${barW}, ${barH}) ÷ 2 = ${f(Math.max(barW, barH) / 2)} px. Uses the larger arm — same as auto when bar_width ≥ bar_height. Recommended for consistent paired elbows.`,
            arm_min:    `min(${barW}, ${barH}) ÷ 2 = ${f(Math.min(barW, barH) / 2)} px. Tightest arc, based on the thinner arm. ${barW !== barH ? 'Significantly smaller than auto for asymmetric bars.' : 'Equal bars — same as auto.'}`,
            arm_fill:   `max(${barW}, ${barH}) = ${f(Math.max(barW, barH))} px. Maximum sweep — fills the entire dominant arm. Dramatic effect; arc may be clipped by the card edge.`,
        } : {
            auto:       `outer_curve ÷ 2 = ${f((outerPx || resolvedPx * 2) / 2)} px. LCARS concentric formula — matches the outer arc's curvature family.`,
            arm_max:    `max(${barW}, ${barH}) ÷ 2 = ${f(Math.max(barW, barH) / 2)} px. Independent of outer_curve — based on the larger arm.`,
            arm_width:  `bar_width ÷ 2 = ${f(barW / 2)} px. Based on the vertical arm width.`,
            arm_height: `bar_height ÷ 2 = ${f(barH / 2)} px. Based on the horizontal arm — ${barH < barW ? 'tighter than arm_width for this config' : 'same as arm_width for this config'}.`,
            arm_min:    `min(${barW}, ${barH}) ÷ 2 = ${f(Math.min(barW, barH) / 2)} px. Tightest inner arc.`,
            arm_fill:   `max(${barW}, ${barH}) = ${f(Math.max(barW, barH))} px. Very large inner arc — likely exceeds the outer. Use with care.`,
        };

        const text = messages[mode];
        if (!text) return '';
        return html`
            <lcards-message type="info" message="${text}"></lcards-message>
        `;
    }

    _handleInnerCurveModeChange(event) {
        const mode = event.detail.value;
        if (mode === 'css') return; // read-only; set via YAML

        if (mode === 'manual') {
            const seg = this.config.elbow?.segment || {};
            const barWidth = typeof seg.bar_width === 'number' ? seg.bar_width : 90;
            this._setConfigValue('elbow.segment.inner_curve', Math.round(barWidth / 4));
        } else if (mode === 'auto') {
            // 'auto' is the default — remove the key so it's computed from outer_curve / 2
            this._setConfigValue('elbow.segment.inner_curve', undefined);
        } else {
            this._setConfigValue('elbow.segment.inner_curve', mode);
        }

        this.requestUpdate();
    }

    _handleClampModeChange(event) {
        const mode = event.detail.value;
        if (mode === 'manual') {
            this._setConfigValue('elbow.segment.outer_curve_clamp', 60);
        } else if (mode === 'card') {
            // 'card' is the default — remove the key
            this._setConfigValue('elbow.segment.outer_curve_clamp', undefined);
        } else {
            this._setConfigValue('elbow.segment.outer_curve_clamp', mode); // 'none'
        }

        this.requestUpdate();
    }

    /**
     * Generic curve-mode handler for segmented outer/inner curve fields.
     * @param {string}  path        - config path
     * @param {string}  mode        - selected mode value
     * @param {number}  defaultPx   - numeric default for 'manual'
     * @param {string}  defaultCss  - CSS starter expression
     * @param {boolean} isOuterCurve - true: map 'arm_width'→'auto' (outer compat); false: keep as-is (inner)
     */
    _handleSegCurveModeChange(path, mode, defaultPx, defaultCss, isOuterCurve) {
        if (mode === 'manual') {
            this._setConfigValue(path, defaultPx);
        } else if (mode === 'css') {
            this._setConfigValue(path, defaultCss);
        } else if (mode === 'auto') {
            this._setConfigValue(path, undefined); // undefined = default (auto)
        } else {
            // keyword: outer curve maps arm_width→'auto' for backward compat; inner keeps as-is
            this._setConfigValue(path, (isOuterCurve && mode === 'arm_width') ? 'auto' : mode);
        }
        this.requestUpdate();
    }

    /**
     * Generic clamp-mode handler for segmented outer_curve_clamp fields.
     * @param {string} path       - config path
     * @param {string} mode       - 'card' | 'none' | 'manual'
     * @param {number} defaultPx  - numeric default for 'manual'
     */
    _handleSegClampModeChange(path, mode, defaultPx) {
        if (mode === 'manual') {
            this._setConfigValue(path, defaultPx);
        } else if (mode === 'card') {
            this._setConfigValue(path, undefined); // 'card' is the default — remove key
        } else {
            this._setConfigValue(path, mode); // 'none'
        }
        this.requestUpdate();
    }

    /**
     * Generic dimension mode change handler for segmented fields.
     * Switching to 'css' seeds a starter expression so the text input appears immediately.
     * Switching to 'static' reverts to a plain numeric default.
     *
     * @param {string} newMode       - 'static' | 'css'
     * @param {string} configPath    - Dot-path to update via _setConfigValue
     * @param {number} defaultNumber - Numeric value to use when reverting to static
     * @param {string} starterCss    - Starter CSS expression to seed on 'css' selection
     * @private
     */
    _handleDimModeChange(newMode, configPath, defaultNumber, starterCss) {
        if (newMode === 'css') {
            this._setConfigValue(configPath, starterCss);
        } else {
            this._setConfigValue(configPath, defaultNumber);
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

        if (newMode === 'css') {
            // Switch to CSS expression mode — seed with a starter expression so
            // the text input appears immediately for the user to edit.
            this._setConfigValue('elbow.segment.bar_width', 'clamp(60px, 8vw, 120px)');
        } else if (newMode === 'theme') {
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

        if (newMode === 'css') {
            // Switch to CSS expression mode — seed with a starter expression.
            this._setConfigValue('elbow.segment.bar_height', 'clamp(40px, 6vh, 90px)');
            this.requestUpdate();
            return;
        }
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

    /** Extract a numeric pixel value from a CSS string like "40px". Returns null for "auto", "8vh", etc. */
    _parseStylePx(value) {
        if (typeof value !== 'string') return null;
        const m = value.match(/^(\d+(?:\.\d+)?)px$/);
        return m ? parseFloat(m[1]) : null;
    }
}

if (!customElements.get('lcards-elbow-editor')) customElements.define('lcards-elbow-editor', LCARdSElbowEditor);
