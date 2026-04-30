/**
 * @fileoverview LCARdS Alert Overlay Editor
 *
 * Visual editor for custom:lcards-alert-overlay.
 *
 * Tabs:
 *   1. Config   — dismiss mode, global position / size defaults
 *   2. Backdrop — global blur / opacity / colour defaults
 *   3. Conditions — per-condition content card + layout & backdrop overrides
 *   4. YAML     ┐
 *   5. 🖖       ┘ (utility tabs from base)
 */

import { html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { lcardsLog } from '../../utils/lcards-logging.js';
import { LCARdSBaseEditor } from '../base/LCARdSBaseEditor.js';
import { editorComponentStyles } from '../base/editor-component-styles.js';
import { configToYaml, yamlToConfig } from '../utils/yaml-utils.js';

import '../components/shared/lcards-message.js';
import '../components/shared/lcards-form-section.js';
import '../components/yaml/lcards-yaml-editor.js';
import '../components/editors/lcards-grid-layout.js';
import '../components/shared/lcards-color-picker.js';
import '../components/provenance/lcards-provenance-tab.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** All alert conditions the overlay reacts to */
const ALERT_CONDITIONS = [
    { key: 'red_alert',    label: 'Red Alert',    icon: 'mdi:alert-circle',      iconColor: '#cc0000' },
    { key: 'yellow_alert', label: 'Yellow Alert', icon: 'mdi:alert',             iconColor: '#c8a000' },
    { key: 'blue_alert',   label: 'Blue Alert',   icon: 'mdi:information',       iconColor: '#1a5fb4' },
    { key: 'black_alert',  label: 'Black Alert',  icon: 'mdi:ghost',             iconColor: '#333333' },
    { key: 'gray_alert',   label: 'Gray Alert',   icon: 'mdi:circle-off-outline', iconColor: '#888888' },
];

const POSITION_OPTIONS = [
    { value: 'top-left',      label: 'Top Left' },
    { value: 'top',           label: 'Top Center' },
    { value: 'top-right',     label: 'Top Right' },
    { value: 'left',          label: 'Left' },
    { value: 'left-center',   label: 'Left Center' },
    { value: 'center',        label: 'Center' },
    { value: 'right',         label: 'Right' },
    { value: 'right-center',  label: 'Right Center' },
    { value: 'bottom-left',   label: 'Bottom Left' },
    { value: 'bottom',        label: 'Bottom Center' },
    { value: 'bottom-right',  label: 'Bottom Right' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Editor
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recursively test whether an object has at least one non-empty leaf value.
 * Used to detect whether alert_button overrides or similar nested config
 * objects carry any meaningful data vs. being empty shell objects left over
 * after individual leaf removals.
 *
 * @param {*} o
 * @returns {boolean}
 */
const _hasLeaf = (o) => o && typeof o === 'object'
    ? Object.values(o).some(_hasLeaf)
    : (o !== undefined && o !== '' && o !== null);

// @ts-ignore - TS2417: static side extends - getConfigElement signature
export class LCARdSAlertOverlayEditor extends LCARdSBaseEditor {

    constructor() {
        super();
        this.cardType = 'alert-overlay';

        /** Dialog refs for content-card picker / editor */
        this._cardPickerDialogRef   = null;
        this._cardEditorDialogRef   = null;

        /** Which condition's content card picker is currently open */
        this._activePickerCondition = null;
        this._activeEditorCondition = null;

        /** Debounce timers for per-condition YAML code editors */
        this._yamlDebounceTimers = {};
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

    // ─────────────────────────────────────────────────────────────────────────
    // Card picker event plumbing (mirrors LCARdSElbowEditor exactly)
    // ─────────────────────────────────────────────────────────────────────────

    connectedCallback() {
        super.connectedCallback?.();
        this._boundHandlePickerResult = this._handleCardPickerResult.bind(this);
        document.addEventListener('lcards-overlay-card-picker-result', this._boundHandlePickerResult);
    }

    disconnectedCallback() {
        super.disconnectedCallback?.();
        if (this._boundHandlePickerResult) {
            document.removeEventListener('lcards-overlay-card-picker-result', this._boundHandlePickerResult);
        }
        this._cardPickerDialogRef?.remove();
        this._cardPickerDialogRef = null;
        this._cardEditorDialogRef?.remove();
        this._cardEditorDialogRef = null;
        Object.values(this._yamlDebounceTimers).forEach(clearTimeout);
    }

    static get styles() {
        return [super.styles, editorComponentStyles];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tabs
    // ─────────────────────────────────────────────────────────────────────────

    _getTabDefinitions() {
        return [
            { label: 'Config',     content: () => this._renderConfigTab() },
            { label: 'Backdrop',   content: () => this._renderBackdropTab() },
            { label: 'Conditions', content: () => this._renderConditionsTab() },
            ...this._getUtilityTabs(),
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tab 1 — Config
    // ─────────────────────────────────────────────────────────────────────────

    _renderConfigTab() {
        const dismissMode = this.config?.dismiss_mode ?? 'dismiss';
        const isAuto      = dismissMode === 'auto-dismiss' || dismissMode === 'auto-reset';
        const autoDismissSeconds = this.config?.auto_dismiss_seconds ?? '';
        const position    = this.config?.position    ?? 'center';
        const width       = this.config?.width       ?? '';
        const height      = this.config?.height      ?? '';

        return html`
            <div class="tab-content-container">

                <lcards-message type="info">
                    <strong>Alert Overlay</strong>
                    <p style="margin:8px 0 0 0; font-size:13px; line-height:1.4;">
                        This card renders a full-screen backdrop + content card whenever
                        <code>input_select.lcards_alert_mode</code> is set to an active alert state
                        (red / yellow / blue / black / gray).
                        Add one overlay card per dashboard view.
                    </p>
                </lcards-message>

                <!-- Dismiss Behaviour -->
                <lcards-form-section
                    header="Dismiss Behaviour"
                    description="What happens when the user clicks the backdrop"
                    icon="mdi:close-circle-outline"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Dismiss Mode'}
                        .helper=${{
                            'dismiss':      'Dismiss: hides the overlay only — the input_select is not changed',
                            'reset':        'Reset: hides the overlay AND sets input_select back to green_alert',
                            'auto-dismiss': 'Auto-Dismiss: overlay hides automatically after the configured timeout',
                            'auto-reset':   'Auto-Reset: overlay hides automatically AND resets alert_mode after the configured timeout',
                        }[dismissMode] ?? ''}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: 'dismiss',      label: 'Dismiss (hide overlay only)' },
                            { value: 'reset',        label: 'Reset (hide + set alert_mode to green_alert)' },
                            { value: 'auto-dismiss', label: 'Auto-Dismiss (hide after timeout)' },
                            { value: 'auto-reset',   label: 'Auto-Reset (hide + reset alert_mode after timeout)' },
                        ]}}}
                        .value=${dismissMode}
                        @value-changed=${(e) => this._setConfigValue('dismiss_mode', e.detail.value)}>
                    </ha-selector>

                    ${isAuto ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Auto-Dismiss After (seconds)'}
                            .helper=${'Overlay will dismiss automatically after this many seconds. Individual conditions can override this value in the Conditions tab.'}
                            .selector=${{ number: { min: 1, step: 1, mode: 'box' } }}
                            .value=${autoDismissSeconds !== '' ? Number(autoDismissSeconds) : undefined}
                            @value-changed=${(e) => this._setConfigValue('auto_dismiss_seconds', e.detail.value ? Number(e.detail.value) : undefined)}>
                        </ha-selector>
                    ` : ''}
                </lcards-form-section>

                <!-- Global Position & Size (defaults, overridable per condition) -->
                <lcards-form-section
                    header="Default Content Position & Size"
                    description="Where the content card appears inside the overlay. Can be overridden per condition in the Conditions tab."
                    icon="mdi:move-resize"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Position'}
                        .helper=${'Anchor point for the content card within the overlay'}
                        .selector=${{ select: { mode: 'dropdown', options: POSITION_OPTIONS }}}
                        .value=${position}
                        @value-changed=${(e) => this._setConfigValue('position', e.detail.value)}>
                    </ha-selector>

                    <lcards-grid-layout>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Width'}
                            .helper=${'CSS width for the content card (e.g. 400px, 50%, auto)'}
                            .selector=${{ text: {} }}
                            .value=${width}
                            @value-changed=${(e) => this._setConfigValue('width', e.detail.value || undefined)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Height'}
                            .helper=${'CSS height for the content card (e.g. 300px, auto)'}
                            .selector=${{ text: {} }}
                            .value=${height}
                            @value-changed=${(e) => this._setConfigValue('height', e.detail.value || undefined)}>
                        </ha-selector>
                    </lcards-grid-layout>
                </lcards-form-section>

            </div>
        `;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tab 2 — Backdrop
    // ─────────────────────────────────────────────────────────────────────────

    _renderBackdropTab() {
        const globalLayers = this.config?.layers ?? {};
        const hasLegacyBackdrop = !!(this.config?.backdrop && !this.config?.layers);

        return html`
            <div class="tab-content-container">

                <lcards-message type="info">
                    <strong>Global Screen Effect Layers</strong>
                    <p style="margin:8px 0 0 0; font-size:13px; line-height:1.4;">
                        Configure each effect layer independently. Applied to all alert
                        conditions unless overridden per-condition.
                    </p>
                </lcards-message>

                ${hasLegacyBackdrop ? html`
                <lcards-message type="warning">
                    This card is using the legacy <code>backdrop:</code> config format. Your settings are still applied correctly.
                    Change any layer option below and save to migrate to the updated format.
                </lcards-message>
                ` : ''}

                ${this._renderSlotSection({ slot: 'backdrop', slotLabel: 'Backdrop Filter',  slotIcon: 'mdi:blur',           layerCfg: globalLayers.backdrop })}
                ${this._renderSlotSection({ slot: 'color',    slotLabel: 'Color Overlay',     slotIcon: 'mdi:palette',        layerCfg: globalLayers.color    })}
                ${this._renderSlotSection({ slot: 'canvas',   slotLabel: 'Canvas Effect',     slotIcon: 'mdi:image-multiple', layerCfg: globalLayers.canvas   })}

            </div>
        `;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tab 3 — Conditions
    // ─────────────────────────────────────────────────────────────────────────

    _renderConditionsTab() {
        return html`
            <div class="tab-content-container">

                <lcards-message type="info">
                    <strong>Per-condition overrides</strong>
                    <p style="margin:8px 0 0 0; font-size:13px; line-height:1.4;">
                        Each section below lets you customise what is shown when that alert mode
                        is active. <strong>Alert Button Overrides</strong> — patch the default LCARdS alert button
                        text and colours without replacing the full card. <em>Content card</em> — replace the default
                        entirely with any HA card. All other settings
                        override the global defaults from the <strong>Config</strong> and
                        <strong>Backdrop</strong> tabs.
                    </p>
                </lcards-message>

                ${ALERT_CONDITIONS.map(c => this._renderConditionSection(c))}

            </div>
        `;
    }

    /**
     * Render one collapsible condition section.
     * @param {{ key: string, label: string, icon: string, iconColor: string }} cond
     * @returns {TemplateResult}
     * @private
     */
    _renderConditionSection(cond) {
        const condCfg    = this.config?.conditions?.[cond.key] ?? {};
        const hasContent = !!(condCfg.content?.type);
        const cardYaml   = hasContent ? configToYaml(condCfg.content) : '';
        const condKey    = cond.key;

        // Determine whether any alert_button override leaf values exist so we can
        // mutually hide the Content Card and Alert Button Overrides sections.
        const hasAlertButtonOverrides = _hasLeaf(condCfg.alert_button ?? {});

        // Per-condition layer overrides
        const condLayers = condCfg.layers;  // undefined = no condition override at all

        // Per-condition layout overrides
        const pos    = condCfg.position ?? '';
        const width  = condCfg.width    ?? '';
        const height = condCfg.height   ?? '';

        // Auto-dismiss per-condition override (only relevant when global mode is auto-*)
        const globalDismissMode = this.config?.dismiss_mode ?? 'dismiss';
        const isAutoMode        = globalDismissMode === 'auto-dismiss' || globalDismissMode === 'auto-reset';
        const condAutoSeconds   = condCfg.auto_dismiss_seconds ?? '';

        return html`
            <lcards-form-section
                header="${cond.label}"
                description="${
                    hasContent
                        ? `Custom content: ${condCfg.content?.type}`
                        : condCfg.alert_button
                            ? 'Default button (with overrides)'
                            : 'Using built-in default content'
                }"
                icon="${cond.icon}"
                ?expanded=${false}
                ?outlined=${true}>

                <!-- ── Content Card ── -->
                <!-- Hidden when alert_button overrides are active and no custom card is set.
                     In that case a compact mode-switch hint is shown instead. -->
                ${(hasContent || !hasAlertButtonOverrides) ? html`
                    <lcards-form-section
                        header="Content Card"
                        description="HA card rendered inside the overlay for this condition"
                        icon="mdi:card-multiple-outline"
                        ?expanded=${true}
                        ?outlined=${true}>

                        ${hasContent ? html`
                            <div style="display:flex; align-items:center; gap:8px; padding:4px 0 8px;">
                                <ha-icon icon="mdi:card-outline" style="color:var(--primary-color);"></ha-icon>
                                <span style="font-weight:500;">${condCfg.content.type}</span>
                            </div>
                        ` : html`
                            <lcards-message
                                type="info"
                                message="No custom card set — the built-in lcards-button default will be used for this condition.">
                            </lcards-message>
                        `}

                        <div style="display:flex; gap:8px; flex-wrap:wrap; padding-bottom:8px;">
                            <ha-button @click=${() => this._openContentCardPicker(condKey)}>
                                <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                                ${hasContent ? 'Change Card Type' : 'Select Card Type'}
                            </ha-button>
                            ${hasContent ? html`
                                <ha-button @click=${() => this._openContentCardEditor(condKey)}>
                                    <ha-icon icon="mdi:pencil" slot="start"></ha-icon>
                                    Edit Card
                                </ha-button>
                                <ha-button @click=${() => this._removeConditionContent(condKey)}>
                                    <ha-icon icon="mdi:close" slot="start"></ha-icon>
                                    Remove
                                </ha-button>
                            ` : ''}
                        </div>

                        ${hasContent ? html`
                            <lcards-message
                                type="info"
                                message="Edit the full card config as YAML below. Use 'Change Card Type' or 'Edit Card' buttons above for a guided editor.">
                            </lcards-message>
                            <ha-code-editor
                                .hass=${this.hass}
                                .value=${cardYaml}
                                mode="yaml"
                                @value-changed=${(e) => this._handleConditionYamlChange(condKey, e.detail.value)}>
                            </ha-code-editor>
                        ` : ''}
                    </lcards-form-section>
                ` : html`
                    <!-- Compact mode-switch hint shown when alert_button overrides are active -->
                    <div style="display:flex; align-items:center; gap:8px; padding:4px 0 8px; color:var(--secondary-text-color); font-size:0.9em;">
                        <ha-icon icon="mdi:pencil-box-outline" style="flex-shrink:0; color:var(--primary-color);"></ha-icon>
                        <span style="flex:1;">Using default button with overrides (see below). Clear overrides to use a custom card, or:</span>
                        <ha-button @click=${async () => {
                            this._clearAlertButton(condKey);
                            await this.updateComplete;
                            this._openContentCardPicker(condKey);
                        }}>
                            <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                            Switch to Custom Card
                        </ha-button>
                    </div>
                `}

                <!-- ── Default Alert Button Overrides ── -->
                ${!hasContent ? this._renderAlertButtonOverridesSection(condKey, condCfg) : ''}

                <!-- ── Screen Effect Overrides ── -->
                <lcards-form-section
                    header="Screen Effect Overrides"
                    description="Override individual effect layers for this condition. Unset slots inherit the global default."
                    icon="mdi:blur"
                    ?expanded=${!!condLayers}
                    ?outlined=${true}>

                    ${this._renderSlotSection({ slot: 'backdrop', slotLabel: 'Backdrop Filter',  slotIcon: 'mdi:blur',           condKey, condLayersObj: condLayers ?? null })}
                    ${this._renderSlotSection({ slot: 'color',    slotLabel: 'Color Overlay',     slotIcon: 'mdi:palette',        condKey, condLayersObj: condLayers ?? null })}
                    ${this._renderSlotSection({ slot: 'canvas',   slotLabel: 'Canvas Effect',     slotIcon: 'mdi:image-multiple', condKey, condLayersObj: condLayers ?? null })}

                </lcards-form-section>

                <!-- ── Layout Overrides ── -->
                <lcards-form-section
                    header="Layout Overrides"
                    description="Override content position or size for this condition only. Leave blank to use global defaults."
                    icon="mdi:move-resize"
                    ?expanded=${!!(pos || width || height || condAutoSeconds)}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Position (override)'}
                        .helper=${'Content anchor point override for this condition — leave unset to use global default'}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: '', label: '— Use global default —' },
                            ...POSITION_OPTIONS,
                        ]}}}
                        .value=${pos}
                        @value-changed=${(e) => this._setConditionProp(condKey, 'position', e.detail.value || undefined)}>
                    </ha-selector>

                    <lcards-grid-layout>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Width (override)'}
                            .helper=${'CSS width override, e.g. 400px — blank = global default'}
                            .selector=${{ text: {} }}
                            .value=${width}
                            @value-changed=${(e) => this._setConditionProp(condKey, 'width', e.detail.value || undefined)}>
                        </ha-selector>

                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Height (override)'}
                            .helper=${'CSS height override, e.g. 300px — blank = global default'}
                            .selector=${{ text: {} }}
                            .value=${height}
                            @value-changed=${(e) => this._setConditionProp(condKey, 'height', e.detail.value || undefined)}>
                        </ha-selector>
                    </lcards-grid-layout>

                    ${isAutoMode ? html`
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Auto-Dismiss Override (seconds)'}
                            .helper=${'Override the global auto-dismiss timeout for this condition only. Leave blank to use the global value.'}
                            .selector=${{ number: { min: 1, step: 1, mode: 'box' } }}
                            .value=${condAutoSeconds !== '' ? Number(condAutoSeconds) : undefined}
                            @value-changed=${(e) => this._setConditionProp(condKey, 'auto_dismiss_seconds', e.detail.value ? Number(e.detail.value) : undefined)}>
                        </ha-selector>
                    ` : ''}
                </lcards-form-section>

            </lcards-form-section>
        `;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Config helpers — conditions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Render the "Default Alert Button Overrides" collapsible section for a condition.
     * Only shown when no custom `content:` card is set.
     * @param {string} condKey
     * @param {object} condCfg
     * @returns {TemplateResult}
     * @private
     */
    _renderAlertButtonOverridesSection(condKey, condCfg) {
        const ab = condCfg.alert_button ?? {};
        const alertLabel  = ab.text?.alert_text?.content ?? '';
        const subTextVal  = ab.text?.sub_text?.content ?? '';
        // Jinja2 entity template: {{states('sensor.foo')}}
        const isEntityMode = /^\{\{states\('([^']+)'\)\}\}$/.test(subTextVal);

        // Extract entity ID from Jinja2 token if in entity mode
        const entityMatch = isEntityMode ? subTextVal.match(/^\{\{states\('([^']+)'\)\}\}$/) : null;
        const entityId    = entityMatch ? entityMatch[1] : '';

        const subTextMode = isEntityMode ? 'entity' : 'static';
        // Recursively check for non-empty leaf values — avoids false positives from
        // empty ancestor objects left behind after individual leaf removals.
        const hasOverrides = _hasLeaf(ab);

        /** Default entity for the alert message helper */
        const DEFAULT_ALERT_ENTITY = 'input_text.lcards_alert_message';

        return html`
            <lcards-form-section
                header="Default Alert Button Overrides"
                description="Patch the built-in alert button text and colours without replacing the full card"
                icon="mdi:pencil-box-outline"
                ?expanded=${hasOverrides}
                ?outlined=${true}>

                <lcards-message
                    type="info"
                    message="These overrides are applied on top of the built-in default alert button. Only specify the fields you want to change — type, component, and preset are inherited automatically. Has no effect when a custom Content Card is set above.">
                </lcards-message>

                <!-- Alert label -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Alert Label (alert_text)'}
                    .helper=${'Override the top alert label text — leave blank to use the built-in default (e.g. ALERT)'}
                    .selector=${{ text: {} }}
                    .value=${alertLabel}
                    @value-changed=${(e) => this._setAlertButtonProp(condKey, 'text.alert_text.content', e.detail.value)}>
                </ha-selector>

                <!-- Sub-text mode toggle -->
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Sub-text Source'}
                    .helper=${'Choose whether the sub-text is a static string or driven by an entity state'}
                    .selector=${{ select: { mode: 'list', options: [
                        { value: 'static', label: 'Static text' },
                        { value: 'entity', label: 'Entity state' },
                    ]}}}
                    .value=${subTextMode}
                    @value-changed=${(e) => {
                        const mode = e.detail.value;
                        if (mode === 'entity') {
                            // Switch to entity mode — pre-fill with default helper entity if blank
                            const defaultEntity = entityId || DEFAULT_ALERT_ENTITY;
                            this._setAlertButtonProp(condKey, 'text.sub_text.content', `{{states('${defaultEntity}')}}`);
                        } else {
                            // Switch to static mode — clear the token
                            this._setAlertButtonProp(condKey, 'text.sub_text.content', '');
                        }
                    }}>
                </ha-selector>

                ${subTextMode === 'entity' ? html`
                    <!-- Entity selector -->
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Sub-text Entity'}
                        .helper=${'Entity whose state is shown as the sub-text message (e.g. input_text.lcards_alert_message)'}
                        .selector=${{ entity: {} }}
                        .value=${entityId || DEFAULT_ALERT_ENTITY}
                        @value-changed=${(e) => {
                            const eid = e.detail.value;
                            if (eid) {
                                this._setAlertButtonProp(condKey, 'text.sub_text.content', `{{states('${eid}')}}`);
                            }
                        }}>
                    </ha-selector>
                ` : html`
                    <!-- Static text input -->
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Sub-text Content'}
                        .helper=${'Override the sub-text message — leave blank to use the built-in default (e.g. CONDITION: RED)'}
                        .selector=${{ text: {} }}
                        .value=${isEntityMode ? '' : subTextVal}
                        @value-changed=${(e) => this._setAlertButtonProp(condKey, 'text.sub_text.content', e.detail.value)}>
                    </ha-selector>
                `}

                ${hasOverrides ? html`
                    <ha-button @click=${() => this._clearAlertButton(condKey)}>
                        <ha-icon icon="mdi:restore" slot="start"></ha-icon>
                        Clear overrides (use built-in defaults)
                    </ha-button>
                ` : ''}
            </lcards-form-section>
        `;
    }

    /**
     * Set a nested property under conditions.<condKey>.alert_button.
     * @param {string} condKey
     * @param {string} path  - e.g. 'text.sub_text.content'
     * @param {*}      value - empty string or undefined removes the key
     * @private
     */
    _setAlertButtonProp(condKey, path, value) {
        if (value !== undefined && value !== '') {
            this._setConfigValue(`conditions.${condKey}.alert_button.${path}`, value);
        } else {
            this._removeConfigPath(`conditions.${condKey}.alert_button.${path}`);
        }
    }

    /**
     * Remove the entire alert_button block for a condition.
     * @param {string} condKey
     * @private
     */
    _clearAlertButton(condKey) {
        this._removeConfigPath(`conditions.${condKey}.alert_button`);
    }

    /**
     * Set a top-level property on a per-condition block.
     * @param {string} condKey
     * @param {string} prop
     * @param {*} value  - undefined = remove key
     * @private
     */
    _setConditionProp(condKey, prop, value) {
        const conditions = JSON.parse(JSON.stringify(this.config?.conditions ?? {}));
        conditions[condKey] = conditions[condKey] ?? {};

        if (value === undefined || value === null) {
            delete conditions[condKey][prop];
        } else {
            conditions[condKey][prop] = value;
        }

        // Prune empty condition objects
        if (Object.keys(conditions[condKey]).length === 0) {
            delete conditions[condKey];
        }
        if (Object.keys(conditions).length === 0) {
            this._updateConfig({ conditions: undefined });
        } else {
            this._updateConfig({ conditions });
        }
    }

    /**
     * Set a backdrop sub-property on a per-condition block.
     * @private
     */
    // ─────────────────────────────────────────────────────────────────────
    // Screen effect layer helpers
    // ─────────────────────────────────────────────────────────────────────

    /**
     * Return SEM presets compatible with a given slot.
     * @param {'backdrop'|'color'|'canvas'} slot
     * @returns {Array<Object>}
     */
    _getSlotPresets(slot) {
        return (window.lcards?.screenEffect?.catalog() ?? [])
            .filter(p => p.slot === slot);
    }

    /**
     * Render a single effect slot section with preset dropdown + param fields.
     *
     * For global sections pass `layerCfg` and no `condKey`.
     * For condition sections pass `condKey` and `condLayersObj`; `layerCfg` is ignored.
     *
     * Dropdown values:
     *   '__inherit__' — slot not overridden for this condition (inherit global)
     *   '__none__'    — slot explicitly disabled
     *   '<preset>'    — that preset is active
     *
     * @param {Object} opts
     * @param {'backdrop'|'color'|'canvas'} opts.slot
     * @param {string}       opts.slotLabel
     * @param {string}       opts.slotIcon
     * @param {Object|null}  [opts.layerCfg]      - For global sections: the current slot config.
     * @param {string|null}  [opts.condKey]        - Set for condition sections.
     * @param {Object|null}  [opts.condLayersObj]  - The full condition layers object (or null).
     */
    _renderSlotSection({ slot, slotLabel, slotIcon, layerCfg = undefined, condKey = null, condLayersObj = null }) {
        const isCondition  = !!condKey;
        const slotInCond   = isCondition && condLayersObj != null && (slot in condLayersObj);
        const slotPresets  = this._getSlotPresets(slot);

        let dropdownValue;
        let activeLayerCfg;
        if (isCondition) {
            if (!slotInCond)                      { dropdownValue = '__inherit__'; activeLayerCfg = null; }
            else if (!condLayersObj[slot]?.preset) { dropdownValue = '__none__';    activeLayerCfg = null; }
            else                                   { dropdownValue = condLayersObj[slot].preset; activeLayerCfg = condLayersObj[slot]; }
        } else {
            dropdownValue  = layerCfg?.preset ?? '__none__';
            activeLayerCfg = layerCfg ?? null;
        }

        const options = [
            ...(isCondition ? [{ value: '__inherit__', label: '— Inherit global —' }] : []),
            { value: '__none__', label: 'None (disabled)' },
            ...slotPresets.map(p => ({ value: p.name, label: p.label ?? p.name })),
        ];

        const presetDef = slotPresets.find(p => p.name === dropdownValue);

        return html`
            <lcards-form-section
                header="${slotLabel}"
                icon="${slotIcon}"
                ?expanded=${!!presetDef}
                ?outlined=${true}>

                ${keyed(dropdownValue, html`
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Effect Preset'}
                    .selector=${{ select: { mode: 'dropdown', options }}}
                    .value=${dropdownValue}
                    @value-changed=${(e) => {
                        if (isCondition) this._setConditionLayerPreset(condKey, slot, e.detail.value);
                        else             this._setGlobalLayerPreset(slot, e.detail.value);
                    }}>
                </ha-selector>
                `)}

                ${presetDef?.params_schema?.length ? html`
                    ${presetDef.params_schema.map(spec => this._renderParamField({
                        spec,
                        value:    activeLayerCfg?.[spec.key],
                        fallback: presetDef.defaults?.[spec.key] ?? spec.placeholder,
                        onChange: (val) => isCondition
                            ? this._setConditionLayerParam(condKey, slot, spec.key, val)
                            : this._setGlobalLayerParam(slot, spec.key, val),
                    }))}
                ` : ''}
            </lcards-form-section>
        `;
    }

    /**
     * Render one param field from a params_schema spec.
     */
    _renderParamField({ spec, value, fallback, onChange }) {
        if (spec.type === 'number') {
            const numVal = typeof value    === 'number' ? value
                         : typeof fallback === 'number' ? fallback
                         : (spec.min ?? 0);
            return html`
                <ha-selector
                    .hass=${this.hass}
                    .label=${spec.label}
                    .helper=${spec.helper ?? ''}
                    .selector=${{ number: {
                        min: spec.min ?? 0, max: spec.max ?? 1,
                        step: spec.step ?? 0.1, mode: 'slider',
                    }}}
                    .value=${numVal}
                    @value-changed=${(e) => onChange(e.detail.value)}>
                </ha-selector>
            `;
        }
        const strVal = value    !== undefined ? String(value)
                     : fallback !== undefined ? String(fallback)
                     : '';
        if (spec.type === 'color-text') {
            return html`
                <div style="margin-bottom:4px;">
                    <div style="font-size:12px;font-weight:500;color:var(--secondary-text-color);margin-bottom:4px;padding:0 2px;">
                        ${spec.label}
                    </div>
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${strVal}
                        .showPreview=${true}
                        @value-changed=${(e) => onChange(e.detail.value || undefined)}>
                    </lcards-color-picker>
                    ${spec.helper ? html`
                        <div style="font-size:11px;color:var(--secondary-text-color);margin-top:2px;padding:0 2px;">
                            ${spec.helper}
                        </div>` : ''}
                </div>
            `;
        }
        return html`
            <ha-selector
                .hass=${this.hass}
                .label=${spec.label}
                .helper=${spec.helper ?? (spec.placeholder ? `e.g. ${spec.placeholder}` : '')}
                .selector=${{ text: {} }}
                .value=${strVal}
                @value-changed=${(e) => onChange(e.detail.value || undefined)}>
            </ha-selector>
        `;
    }

    // ── Global backdrop setters ─────────────────────────────────────────────────────────

    _setGlobalLayerPreset(slot, presetOrSpecial) {
        const layers = { ...this._getMigratedLayers() };
        if (presetOrSpecial === '__none__') {
            layers[slot] = null;
        } else {
            const existing = layers[slot];
            layers[slot] = (existing?.preset === presetOrSpecial) ? existing : { preset: presetOrSpecial };
        }
        this._updateConfig({ layers, backdrop_effect: undefined, backdrop_params: undefined, backdrop: undefined });
    }

    _setGlobalLayerParam(slot, key, value) {
        const layers = { ...this._getMigratedLayers() };
        if (!layers[slot]) layers[slot] = {};
        if (value !== undefined && value !== '') {
            layers[slot] = { ...layers[slot], [key]: value };
        } else {
            const { [key]: _, ...rest } = layers[slot];
            layers[slot] = rest;
        }
        this._updateConfig({ layers });
    }

    /**
     * Build a starting `layers` object from whatever schema is currently in config,
     * migrating legacy keys in one shot before any global layer mutation.
     * @private
     */
    _getMigratedLayers() {
        if (this.config?.layers) return JSON.parse(JSON.stringify(this.config.layers));
        const cfg = this.config ?? {};
        if (cfg.backdrop) {
            const bd = cfg.backdrop;
            const layers = {};
            if (bd.blur) layers.backdrop = { preset: 'blur', amount: bd.blur };
            if (bd.color || bd.opacity !== undefined) {
                const opacity = typeof bd.opacity === 'number' ? bd.opacity : 0.6;
                layers.color  = { preset: 'color-tint', color: this._promotedColor(bd.color ?? 'rgba(0,0,0,0.5)', opacity) };
            }
            return layers;
        }
        return { backdrop: { preset: 'blur', amount: '8px' } };
    }

    // ── Per-condition backdrop setters ───────────────────────────────────────────────

    _setConditionLayerPreset(condKey, slot, presetOrSpecial) {
        const conditions = JSON.parse(JSON.stringify(this.config?.conditions ?? {}));
        conditions[condKey] = conditions[condKey] ?? {};
        // Remove any stale per-condition backdrop keys.
        delete conditions[condKey].backdrop;
        delete conditions[condKey].backdrop_effect;
        delete conditions[condKey].backdrop_params;

        if (presetOrSpecial === '__inherit__') {
            if (conditions[condKey].layers) {
                delete conditions[condKey].layers[slot];
                if (Object.keys(conditions[condKey].layers).length === 0) delete conditions[condKey].layers;
            }
        } else if (presetOrSpecial === '__none__') {
            conditions[condKey].layers = conditions[condKey].layers ?? {};
            conditions[condKey].layers[slot] = null;
        } else {
            conditions[condKey].layers = conditions[condKey].layers ?? {};
            const existing = conditions[condKey].layers[slot];
            conditions[condKey].layers[slot] = (existing?.preset === presetOrSpecial) ? existing : { preset: presetOrSpecial };
        }
        if (Object.keys(conditions[condKey]).length === 0) delete conditions[condKey];
        this._updateConfig({ conditions: Object.keys(conditions).length ? conditions : undefined });
    }

    _setConditionLayerParam(condKey, slot, key, value) {
        const conditions = JSON.parse(JSON.stringify(this.config?.conditions ?? {}));
        conditions[condKey] = conditions[condKey] ?? {};
        conditions[condKey].layers = conditions[condKey].layers ?? {};
        conditions[condKey].layers[slot] = conditions[condKey].layers[slot] ?? {};
        if (value !== undefined && value !== '') {
            conditions[condKey].layers[slot][key] = value;
        } else {
            delete conditions[condKey].layers[slot][key];
        }
        this._updateConfig({ conditions });
    }

    /**
     * Fold a separate opacity into rgba() alpha. Used when migrating old backdrop schema.
     * @param {string} color
     * @param {number} opacity
     * @returns {string}
     */
    _promotedColor(color, opacity) {
        const m = color.match(
            /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/
        );
        if (m) {
            const a = parseFloat(m[4] ?? '1') * opacity;
            return `rgba(${m[1]},${m[2]},${m[3]},${Math.min(1, a).toFixed(2)})`;
        }
        return color;
    }

    /**
     * Remove the custom content card for a condition.
     * @private
     */
    _removeConditionContent(condKey) {
        this._setConditionProp(condKey, 'content', undefined);
    }

    /**
     * Handle YAML changes in the per-condition content card editor.
     * @private
     */
    _handleConditionYamlChange(condKey, rawYaml) {
        clearTimeout(this._yamlDebounceTimers[condKey]);
        this._yamlDebounceTimers[condKey] = setTimeout(() => {
            try {
                const parsed = yamlToConfig(rawYaml);
                if (parsed && typeof parsed === 'object' && parsed.type) {
                    this._setConditionProp(condKey, 'content', parsed);
                }
            } catch (_) {
                // Ignore YAML parse errors while typing
            }
        }, 750);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Content card picker (mirrors elbow editor pattern)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Open hu-card-picker so the user can select a content card type for a condition.
     * @param {string} condKey
     * @private
     */
    async _openContentCardPicker(condKey) {
        if (!customElements.get('hui-card-picker')) {
            lcardsLog.warn('[AlertOverlayEditor] hui-card-picker not loaded yet. Click "Add Card" on the dashboard once to prime it, then try again.');
            try {
                const ha = document.querySelector('home-assistant');
                // @ts-ignore - TS2339: auto-suppressed
                if (ha?.showToast) {
                    // @ts-ignore - TS2339: auto-suppressed
                    ha.showToast({ message: 'Card picker loading — click "Add Card" once on any dashboard view to enable it, then try again.', duration: 4000 });
                }
            } catch (_) { /* ignore */ }
            return;
        }

        this._cardPickerDialogRef?.remove();
        this._cardPickerDialogRef = null;
        this._activePickerCondition = condKey;

        const dialog = document.createElement('ha-dialog');
        // @ts-ignore - TS2339: auto-suppressed
        dialog.headerTitle = 'Select Content Card Type';

        this._cardPickerDialogRef = dialog;
        document.body.appendChild(dialog);
        // @ts-ignore - TS2339: auto-suppressed
        dialog.open = true;

        // @ts-ignore - TS2339: auto-suppressed
        await dialog.updateComplete;

        const picker = document.createElement('hui-card-picker');
        // @ts-ignore - TS2339: auto-suppressed
        picker.hass     = this.hass;
        // @ts-ignore - TS2339: auto-suppressed
        picker.lovelace = this._getContentCardLovelace();
        picker.style.cssText = 'padding:24px; display:block;';
        dialog.appendChild(picker);

        await new Promise(r => setTimeout(r, 100));
        // @ts-ignore - TS2339: auto-suppressed
        picker.requestUpdate?.();
        // @ts-ignore - TS2339: auto-suppressed
        if (picker.updateComplete) await picker.updateComplete;

        picker.addEventListener('config-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            const selected = e.detail?.config;
            lcardsLog.debug('[AlertOverlayEditor] Content card type selected:', selected?.type);

            document.dispatchEvent(new CustomEvent('lcards-overlay-card-picker-result', {
                detail: { condKey, config: selected }
            }));

            // @ts-ignore - TS2339: auto-suppressed
            dialog.open = false;
        });

        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._cardPickerDialogRef === dialog) {
                this._cardPickerDialogRef = null;
            }
        });
    }

    /**
     * Handle the result from the card picker.
     * @private
     */
    _handleCardPickerResult(e) {
        const { condKey, config } = e.detail ?? {};
        if (!config) return;
        lcardsLog.debug('[AlertOverlayEditor] Applying content card config from picker:', config.type);
        this._setConditionProp(condKey, 'content', config);
    }

    /**
     * Open hui-card-element-editor to graphically configure the selected content card.
     * @param {string} condKey
     * @private
     */
    async _openContentCardEditor(condKey) {
        const currentCard = this.config?.conditions?.[condKey]?.content;
        if (!currentCard?.type) return;

        if (!customElements.get('hui-card-element-editor')) {
            lcardsLog.warn('[AlertOverlayEditor] hui-card-element-editor not available yet');
            return;
        }

        this._cardEditorDialogRef?.remove();
        this._cardEditorDialogRef = null;
        this._activeEditorCondition = condKey;

        const dialog = document.createElement('ha-dialog');
        // @ts-ignore - TS2339: auto-suppressed
        dialog.headerTitle = `Edit: ${currentCard.type}`;
        dialog.setAttribute('prevent-scrim-close', '');
        this._cardEditorDialogRef = dialog;

        const container = document.createElement('div');
        container.style.cssText = 'padding:16px; min-height:300px; min-width:420px; box-sizing:border-box;';

        const editor = document.createElement('hui-card-element-editor');
        // @ts-ignore - TS2339: auto-suppressed
        editor.hass     = this.hass;
        // @ts-ignore - TS2339: auto-suppressed
        editor.lovelace = this._getContentCardLovelace();
        // @ts-ignore - TS2339: auto-suppressed
        editor.value    = JSON.parse(JSON.stringify(currentCard));

        let tempConfig = JSON.parse(JSON.stringify(currentCard));
        editor.addEventListener('config-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            if (e.detail?.config?.type) tempConfig = e.detail.config;
        });
        editor.addEventListener('value-changed', (e) => {
            // @ts-ignore - TS2339: auto-suppressed
            if (e.detail?.value?.type) tempConfig = e.detail.value;
        });

        container.appendChild(editor);
        dialog.appendChild(container);

        const actionsDiv = document.createElement('div');
        actionsDiv.slot = 'footer';
        actionsDiv.style.cssText = 'display:flex; gap:8px;';

        const cancelBtn = document.createElement('ha-button');
        cancelBtn.textContent = 'Cancel';
        // @ts-ignore - TS2339: auto-suppressed
        cancelBtn.addEventListener('click', () => { dialog.open = false; });

        const saveBtn = document.createElement('ha-button');
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', () => {
            if (tempConfig?.type) {
                this._setConditionProp(condKey, 'content', JSON.parse(JSON.stringify(tempConfig)));
                lcardsLog.debug('[AlertOverlayEditor] Content card saved from editor:', tempConfig.type);
            }
            // @ts-ignore - TS2339: auto-suppressed
            dialog.open = false;
        });

        actionsDiv.appendChild(cancelBtn);
        actionsDiv.appendChild(saveBtn);
        dialog.appendChild(actionsDiv);

        dialog.addEventListener('closed', () => {
            dialog.remove();
            if (this._cardEditorDialogRef === dialog) {
                this._cardEditorDialogRef = null;
            }
        });

        document.body.appendChild(dialog);
        // @ts-ignore - TS2339: auto-suppressed
        dialog.open = true;
    }

    /**
     * Minimal lovelace config needed by hui-card-picker and hui-card-element-editor.
     * @returns {Object}
     * @private
     */
    _getContentCardLovelace() {
        let lc = this.lovelace?.config || this.lovelace || {};
        if (!lc.views) lc = { ...lc, views: [] };
        if (lc.views.length === 0) {
            lc = { ...lc, views: [{ title: 'Home', path: 'home', cards: [] }] };
        }
        return lc;
    }
}

// Register custom element
if (!customElements.get('lcards-alert-overlay-editor')) customElements.define('lcards-alert-overlay-editor', LCARdSAlertOverlayEditor);
