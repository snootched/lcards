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
    { value: 'top-center',    label: 'Top Center (alias)' },
    { value: 'top-right',     label: 'Top Right' },
    { value: 'left',          label: 'Left Center' },
    { value: 'center',        label: 'Center' },
    { value: 'right',         label: 'Right Center' },
    { value: 'bottom-left',   label: 'Bottom Left' },
    { value: 'bottom',        label: 'Bottom Center' },
    { value: 'bottom-center', label: 'Bottom Center (alias)' },
    { value: 'bottom-right',  label: 'Bottom Right' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Editor
// ─────────────────────────────────────────────────────────────────────────────

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
                        .helper=${dismissMode === 'reset'
                            ? 'Reset: hides the overlay AND sets input_select back to green_alert'
                            : 'Dismiss: hides the overlay only — the input_select is not changed'}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: 'dismiss', label: 'Dismiss (hide overlay only)' },
                            { value: 'reset',   label: 'Reset (hide + set alert_mode to green_alert)' },
                        ]}}}
                        .value=${dismissMode}
                        @value-changed=${(e) => this._setConfigValue('dismiss_mode', e.detail.value)}>
                    </ha-selector>
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
        const backdrop = this.config?.backdrop ?? {};
        const blur    = backdrop.blur    ?? '8px';
        const opacity = backdrop.opacity ?? 0.6;
        const color   = backdrop.color   ?? 'rgba(0,0,0,0.5)';

        return html`
            <div class="tab-content-container">

                <lcards-message type="info">
                    <strong>Backdrop defaults</strong>
                    <p style="margin:8px 0 0 0; font-size:13px; line-height:1.4;">
                        These values apply to <em>all</em> alert conditions unless overridden in the
                        <strong>Conditions</strong> tab.
                        <br><br>
                        The blur and the tint are rendered on separate layers — changing the tint
                        opacity will not weaken the blur effect.
                    </p>
                </lcards-message>

                <lcards-form-section
                    header="Blur"
                    description="Frosted-glass blur applied behind the overlay"
                    icon="mdi:blur"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Blur Amount'}
                        .helper=${'CSS blur value — e.g. 4px (subtle), 8px (standard), 20px (heavy)'}
                        .selector=${{ text: {} }}
                        .value=${blur}
                        @value-changed=${(e) => this._setConfigValue('backdrop.blur', e.detail.value || '8px')}>
                    </ha-selector>
                </lcards-form-section>

                <lcards-form-section
                    header="Tint"
                    description="Semi-transparent colour layer on top of the blurred background"
                    icon="mdi:palette"
                    ?expanded=${true}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Tint Color'}
                        .helper=${'Background color for the tint overlay. Use rgba() for control over alpha separately from the Opacity slider below. Examples: rgba(0,0,0,0.5)  rgba(180,0,0,0.4)'}
                        .selector=${{ text: {} }}
                        .value=${color}
                        @value-changed=${(e) => this._setConfigValue('backdrop.color', e.detail.value || 'rgba(0,0,0,0.5)')}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Tint Opacity'}
                        .helper=${'Overall opacity of the tint layer (0 = invisible, 1 = fully opaque). Set to 0 to show blur only with no color tint.'}
                        .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' }}}
                        .value=${opacity}
                        @value-changed=${(e) => this._setConfigValue('backdrop.opacity', e.detail.value)}>
                    </ha-selector>
                </lcards-form-section>

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
        const _hasLeaf = (o) => o && typeof o === 'object'
            ? Object.values(o).some(_hasLeaf)
            : (o !== undefined && o !== '' && o !== null);
        const hasAlertButtonOverrides = _hasLeaf(condCfg.alert_button ?? {});

        // Per-condition backdrop overrides
        const bd      = condCfg.backdrop ?? {};
        const bdBlur  = bd.blur    ?? '';
        const bdOpacity = typeof bd.opacity === 'number' ? bd.opacity : '';
        const bdColor = bd.color   ?? '';

        // Per-condition layout overrides
        const pos    = condCfg.position ?? '';
        const width  = condCfg.width    ?? '';
        const height = condCfg.height   ?? '';

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

                <!-- ── Backdrop Overrides ── -->
                <lcards-form-section
                    header="Backdrop Overrides"
                    description="Override the global backdrop settings for this condition only. Leave fields blank to use global defaults."
                    icon="mdi:blur"
                    ?expanded=${!!(bdBlur || typeof bd.opacity === 'number' || bdColor)}
                    ?outlined=${true}>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Blur Amount (override)'}
                        .helper=${'CSS blur override for this condition, e.g. 12px — leave blank to use global default'}
                        .selector=${{ text: {} }}
                        .value=${bdBlur}
                        @value-changed=${(e) => this._setConditionBackdrop(condKey, 'blur', e.detail.value || undefined)}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Tint Color (override)'}
                        .helper=${'CSS color override — e.g. rgba(200,0,0,0.3) — leave blank to use global default'}
                        .selector=${{ text: {} }}
                        .value=${bdColor}
                        @value-changed=${(e) => this._setConditionBackdrop(condKey, 'color', e.detail.value || undefined)}>
                    </ha-selector>

                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Tint Opacity (override)'}
                        .helper=${'Opacity 0–1, overrides global value for this condition. Set to 0 to hide tint. Leave empty for global default.'}
                        .selector=${{ number: { min: 0, max: 1, step: 0.05, mode: 'slider' }}}
                        .value=${typeof bd.opacity === 'number' ? bd.opacity : (this.config?.backdrop?.opacity ?? 0.6)}
                        @value-changed=${(e) => this._setConditionBackdrop(condKey, 'opacity', e.detail.value)}>
                    </ha-selector>

                    ${typeof bd.opacity === 'number' || bdBlur || bdColor ? html`
                        <ha-button @click=${() => this._clearConditionBackdrop(condKey)}>
                            <ha-icon icon="mdi:restore" slot="start"></ha-icon>
                            Clear backdrop overrides (use global)
                        </ha-button>
                    ` : ''}
                </lcards-form-section>

                <!-- ── Layout Overrides ── -->
                <lcards-form-section
                    header="Layout Overrides"
                    description="Override content position or size for this condition only. Leave blank to use global defaults."
                    icon="mdi:move-resize"
                    ?expanded=${!!(pos || width || height)}
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
        const _hasLeaf = (o) => o && typeof o === 'object'
            ? Object.values(o).some(_hasLeaf)
            : (o !== undefined && o !== '' && o !== null);
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
    _setConditionBackdrop(condKey, prop, value) {
        const conditions = JSON.parse(JSON.stringify(this.config?.conditions ?? {}));
        conditions[condKey] = conditions[condKey] ?? {};
        conditions[condKey].backdrop = conditions[condKey].backdrop ?? {};

        if (value === undefined || value === null) {
            delete conditions[condKey].backdrop[prop];
        } else {
            conditions[condKey].backdrop[prop] = value;
        }

        // Prune empty backdrop
        if (Object.keys(conditions[condKey].backdrop).length === 0) {
            delete conditions[condKey].backdrop;
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
     * Remove all backdrop overrides for a condition.
     * @private
     */
    _clearConditionBackdrop(condKey) {
        const conditions = JSON.parse(JSON.stringify(this.config?.conditions ?? {}));
        if (!conditions[condKey]) return;
        delete conditions[condKey].backdrop;
        if (Object.keys(conditions[condKey]).length === 0) {
            delete conditions[condKey];
        }
        this._updateConfig({ conditions: Object.keys(conditions).length ? conditions : undefined });
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
customElements.define('lcards-alert-overlay-editor', LCARdSAlertOverlayEditor);
