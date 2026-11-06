/**
 * @fileoverview The Alert Studio's forms (lcards-alert-overlay-studio-dialog):
 * the Config, Backdrop and Conditions tabs. A mixin over the studio, which
 * supplies the config (`config`, `hass`) and the edit methods FormField uses
 * (`_getSchemaForPath`, `_getConfigValue`, `_setConfigValue`,
 * `_removeConfigPath`, `_updateConfig`), and `_condition` (the condition the
 * Conditions tab and the preview show).
 *
 * Moved here from the card editor, which is now a launcher for the studio.
 */

import { html } from 'lit';
import { keyed } from 'lit/directives/keyed.js';
import { LCARdSFormFieldHelper as FormField } from '../../components/shared/lcards-form-field.js';
import { renderInfoGuide } from '../../components/shared/info-guide.js';
import { parseColor } from '../../../core/themes/color-syntax.js';
import { displayFor, builtInSymbol, symbolPatch, mergePatch, patchDiff, ALERT_BUTTON_FIXED_KEYS } from '../../../cards/alert-overlay-config.js';
import { mountDialogNearHomeAssistant } from '../../../utils/lcards-shared-helpers.js';
import { showInfoDialog, showConfirmDeleteDialog } from '../../../views/layout-edit-dialogs.js';
import '../../components/shared/lcards-message.js';
import '../../components/shared/lcards-form-section.js';
import '../../components/shared/lcards-alert-overlay-diagram.js';
import '../../components/editors/lcards-grid-layout.js';
import '../../components/shared/lcards-color-picker.js';

/** All alert conditions the overlay reacts to */
export const ALERT_CONDITIONS = [
    { key: 'red_alert',    label: 'Red Alert',    short: 'Red',    icon: 'mdi:alert-circle' },
    { key: 'yellow_alert', label: 'Yellow Alert', short: 'Yellow', icon: 'mdi:alert' },
    { key: 'blue_alert',   label: 'Blue Alert',   short: 'Blue',   icon: 'mdi:information' },
    { key: 'black_alert',  label: 'Black Alert',  short: 'Black',  icon: 'mdi:ghost' },
    { key: 'gray_alert',   label: 'Gray Alert',   short: 'Gray',   icon: 'mdi:circle-off-outline' },
];

const POSITION_OPTIONS = [
    { value: 'top-left',      label: 'Top Left' },
    { value: 'top',           label: 'Top Center' },
    { value: 'top-right',     label: 'Top Right' },
    { value: 'left',          label: 'Left' },
    { value: 'center-left',   label: 'Left Center' },
    { value: 'center',        label: 'Center' },
    { value: 'right',         label: 'Right' },
    { value: 'center-right',  label: 'Right Center' },
    { value: 'bottom-left',   label: 'Bottom Left' },
    { value: 'bottom',        label: 'Bottom Center' },
    { value: 'bottom-right',  label: 'Bottom Right' },
];

/**
 * Whether an object has at least one non-empty leaf value (alert_button
 * overrides can leave empty shells behind after individual removals).
 * @param {*} o
 * @returns {boolean}
 */
const _hasLeaf = (o) => o && typeof o === 'object'
    ? Object.values(o).some(_hasLeaf)
    : (o !== undefined && o !== '' && o !== null);

/**
 * @template {new (...args: any[]) => any} T
 * @param {T} Base
 */
export const AlertStudioForms = (Base) => class extends Base {

    // ─────────────────────────────────────────────────────────────────────────
    // Tab 1 — Config
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * How a condition shows: its own `display`, else the card's, else overlay
     * (as the card decides it).
     * @param {string} condKey
     * @returns {'overlay'|'band'}
     */
    _displayFor(condKey) {
        return displayFor(this.config, condKey);
    }

    /**
     * Whether any alert condition shows this way (settings for the other way are hidden).
     * @param {'overlay'|'band'} mode
     */
    _anyDisplay(mode) {
        return ALERT_CONDITIONS.some((c) => this._displayFor(c.key) === mode);
    }

    _renderConfigTab() {
        const dismissMode = this.config?.dismiss_mode ?? 'dismiss';
        const isAuto      = dismissMode === 'auto-dismiss' || dismissMode === 'auto-reset';

        return html`
            <div class="tab-content-container">


                <lcards-message type="info">
                    Shows an overlay or a band while <code>input_select.lcards_alert_mode</code> is an alert
                    (red, yellow, blue, black or gray). Add one per dashboard view.
                </lcards-message>

                ${this._renderDisplaySection()}

                <!-- The alert symbol, for every condition (alert_button) -->
                <lcards-form-section
                    header="Alert symbol"
                    description="Change the alert symbol for every condition: text, colours, animations and more. A condition can change it again, or show your own card (Conditions tab)."
                    icon="mdi:alert-rhombus-outline"
                    ?expanded=${_hasLeaf(this.config?.alert_button ?? {})}
                    ?outlined=${true}>
                    ${this._renderSymbolEditor(null, 'alert_button')}
                </lcards-form-section>

                <!-- Dismiss Behaviour -->
                <lcards-form-section
                    header="Dismiss Behaviour"
                    description="What a click does: on the backdrop (overlay) or on the alert symbol (band)"
                    icon="mdi:close-circle-outline"
                    ?expanded=${true}
                    ?outlined=${true}>

                    ${FormField.renderField(this, 'dismiss_mode', {
                        label: 'Dismiss Mode',
                        helper: {
                            'dismiss':      'Dismiss: hides the overlay only; the input_select is not changed',
                            'reset':        'Reset: hides the overlay AND sets input_select back to green_alert',
                            'auto-dismiss': 'Auto-Dismiss: overlay hides automatically after the configured timeout',
                            'auto-reset':   'Auto-Reset: overlay hides automatically AND resets alert_mode after the configured timeout',
                        }[dismissMode] ?? '',
                        selectorOverride: { select: { mode: 'dropdown', options: [
                            { value: 'dismiss',      label: 'Dismiss (hide overlay only)' },
                            { value: 'reset',        label: 'Reset (hide + set alert_mode to green_alert)' },
                            { value: 'auto-dismiss', label: 'Auto-Dismiss (hide after timeout)' },
                            { value: 'auto-reset',   label: 'Auto-Reset (hide + reset alert_mode after timeout)' },
                        ]}},
                    })}

                    ${isAuto ? FormField.renderField(this, 'auto_dismiss_seconds', {
                        label: 'Auto-Dismiss After (seconds)',
                        helper: 'Overlay will dismiss automatically after this many seconds. Individual conditions can override this value in the Conditions tab.',
                        selectorOverride: { number: { min: 1, step: 1, mode: 'box' } },
                    }) : ''}
                </lcards-form-section>


            </div>
        `;
    }

    /**
     * Display: the modal overlay or the band across the screen, with the overlay's
     * position and size and the band settings (each while some condition uses it).
     * @returns {TemplateResult}
     * @private
     */
    _renderDisplaySection() {
        const display = this.config?.display ?? 'overlay';
        const band = this.config?.band ?? {};
        const set = (key, value) => this._setConfigValue(`band.${key}`, value === '' || value === null ? undefined : value);
        return html`
            <lcards-form-section
                header="Display"
                description="A modal overlay, or a band of dashes across the screen that leaves the dashboard usable"
                icon="mdi:alert-rhombus-outline"
                ?expanded=${true}
                ?outlined=${true}>

                ${FormField.renderField(this, 'display', {
                    label: 'Display',
                    helper: display === 'band'
                        ? 'Band: dashes in the alert colour across the screen with the alert symbol in the middle. Clicks reach the dashboard; click the symbol to dismiss.'
                        : 'Overlay: a backdrop over the dashboard with the alert symbol (or your content card) in the middle.',
                    selectorOverride: { select: { mode: 'dropdown', options: [
                        { value: 'overlay', label: 'Overlay (backdrop and symbol)' },
                        { value: 'band',    label: 'Band (dashes across the screen)' },
                    ]}},
                })}

                ${this._anyDisplay('overlay') ? html`
                    ${display === 'band' ? html`
                        <lcards-message type="info"
                            message="Some conditions show as an overlay (their Display override): this position and size apply to them.">
                        </lcards-message>` : ''}
                    ${renderInfoGuide({
                        header: 'How the overlay works',
                        id: 'guide-overlay',
                        body: html`
                            <lcards-alert-overlay-diagram kind="overlay"></lcards-alert-overlay-diagram>
                            <p>The screen effect layers (Backdrop tab) cover the dashboard, and the alert symbol (or your content card) sits on top.</p>
                            <ul>
                                <li><strong>Position</strong> picks one of nine anchors on the screen.</li>
                                <li><strong>Width</strong> and <strong>Height</strong> are CSS sizes: a percentage is of the screen. With a width and no height, the alert symbol keeps its shape.</li>
                                <li>A click on the backdrop dismisses (see Dismiss Behaviour).</li>
                                <li>Conditions can override the position and size (Conditions tab).</li>
                            </ul>
                        `,
                    })}
                    ${FormField.renderField(this, 'position', {
                        label: 'Overlay position',
                        helper: 'Where the alert symbol (or content card) sits on the screen',
                    })}
                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'width', {
                            label: 'Width',
                            helper: 'CSS width, e.g. 400px or 50% (of the screen)',
                            selectorOverride: { text: {} },
                        })}
                        ${FormField.renderField(this, 'height', {
                            label: 'Height',
                            helper: 'CSS height, e.g. 300px or 40%. Blank = 50% for the alert symbol (from the width when one is set)',
                            selectorOverride: { text: {} },
                        })}
                    </lcards-grid-layout>
                ` : ''}

                ${this._anyDisplay('band') ? html`
                    ${display !== 'band' ? html`
                        <lcards-message type="info"
                            message="Some conditions show as a band (their Display override): these band settings apply to them.">
                        </lcards-message>` : ''}
                    ${renderInfoGuide({
                        header: 'How the band works',
                        id: 'guide-band',
                        body: html`
                            <lcards-alert-overlay-diagram kind="band"></lcards-alert-overlay-diagram>
                            <p>A row of dashes in the alert colour runs across the screen with the alert symbol in the middle. The dashboard stays usable: only the symbol takes clicks, and a click on it dismisses.</p>
                            <ul>
                                <li><strong>Band position</strong>: top, center, bottom, or a percentage of the screen height.</li>
                                <li><strong>Dash width</strong>, <strong>gap</strong> and <strong>band height</strong> shape the dashes; <strong>grow</strong> makes them swell as the sweep passes.</li>
                                <li><strong>Symbol size</strong> is a multiple of the band height.</li>
                                <li><strong>Sweep direction</strong>, <strong>speed</strong> and <strong>phase</strong> time the animation against the symbol's bars.</li>
                            </ul>
                        `,
                    })}
                    <lcards-grid-layout>
                        ${FormField.renderField(this, 'band.position', {
                            label: 'Band position',
                            helper: 'top, center, bottom, or a percentage of the screen height (e.g. 75%)',
                            selectorOverride: { select: { mode: 'dropdown', custom_value: true, options: [
                                { value: 'top', label: 'Top' }, { value: 'center', label: 'Center' }, { value: 'bottom', label: 'Bottom' },
                            ]}},
                        })}
                        ${FormField.renderField(this, 'band.animation', {
                            label: 'Animation',
                            selectorOverride: { select: { mode: 'dropdown', options: [
                                { value: 'sweep', label: 'Sweep (outward from the symbol)' },
                                { value: 'flash', label: 'Flash (all together)' },
                                { value: 'none',  label: 'None' },
                            ]}},
                        })}
                        ${FormField.renderField(this, 'band.direction', {
                            label: 'Sweep direction',
                            selectorOverride: { select: { mode: 'dropdown', options: [
                                { value: 'outward', label: 'Outward (from the symbol)' },
                                { value: 'inward',  label: 'Inward (from the edges)' },
                            ]}},
                        })}
                        ${FormField.renderField(this, 'band.speed', {
                            label: 'Speed',
                            helper: 'Multiplier: 2 = twice as fast. The symbol bars follow it',
                            selectorOverride: { number: { min: 0.25, max: 4, step: 0.25, mode: 'box' } },
                        })}
                        ${FormField.renderField(this, 'band.phase', {
                            label: 'Phase (degrees)',
                            helper: 'Lock the band to the symbol bar sweep, this many degrees later. 180 with an outward sweep: one sweep from the symbol out to the edges. Blank = not locked',
                            selectorOverride: { number: { min: 0, max: 360, step: 15, mode: 'box' } },
                        })}
                        ${FormField.renderField(this, 'band.height', {
                            label: 'Band height',
                            helper: 'CSS length, e.g. 48px or 5vh',
                            selectorOverride: { text: {} },
                        })}
                        ${FormField.renderField(this, 'band.emblem_scale', {
                            label: 'Symbol size',
                            helper: 'Symbol height as a multiple of the band height',
                            selectorOverride: { number: { min: 1, max: 10, step: 0.5, mode: 'box' } },
                        })}
                        ${FormField.renderField(this, 'band.dash_width', {
                            label: 'Dash width (px)',
                            selectorOverride: { number: { min: 1, max: 100, step: 1, mode: 'box' } },
                        })}
                        ${FormField.renderField(this, 'band.dash_gap', {
                            label: 'Dash gap (px)',
                            selectorOverride: { number: { min: 0, max: 100, step: 1, mode: 'box' } },
                        })}
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Dash corner radius (px)'}
                            .helper=${'Capped at half the dash width'}
                            .selector=${{ number: { min: 0, max: 100, step: 0.5, mode: 'box' } }}
                            .value=${typeof band.dash_radius === 'number' ? band.dash_radius : 0}
                            .disabled=${band.dash_radius === 'pill'}
                            @value-changed=${(e) => set('dash_radius', Number(e.detail.value) > 0 ? Number(e.detail.value) : undefined)}>
                        </ha-selector>
                        <ha-selector
                            .hass=${this.hass}
                            .label=${'Pill ends'}
                            .helper=${'Fully rounded dash ends (overrides the radius)'}
                            .selector=${{ boolean: {} }}
                            .value=${band.dash_radius === 'pill'}
                            @value-changed=${(e) => set('dash_radius', e.detail.value ? 'pill' : undefined)}>
                        </ha-selector>
                        ${FormField.renderField(this, 'band.grow', {
                            label: 'Grow',
                            helper: 'Peak dash height as a multiple of the band height, with the animation. 1 = no growth',
                            selectorOverride: { number: { min: 1, max: 4, step: 0.1, mode: 'box' } },
                        })}
                    </lcards-grid-layout>
                    ${FormField.renderField(this, 'band.emblem', {
                        label: 'Show the alert symbol',
                        helper: 'Without it, only auto-dismiss or the alert mode changing hides the band',
                        selectorOverride: { boolean: {} },
                    })}
                    <div class="field-caption">Dash colour (blank = the condition colour)</div>
                    <lcards-color-picker
                        .hass=${this.hass}
                        .value=${band.color ?? ''}
                        .showPreview=${true}
                        @value-changed=${(e) => set('color', e.detail.value || undefined)}>
                    </lcards-color-picker>
                ` : ''}
            </lcards-form-section>
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

                ${this._anyDisplay('band') ? html`
                <lcards-message type="info"
                    message=${this._anyDisplay('overlay')
                        ? 'A band has no backdrop unless you set one here: the default blur is for overlays only.'
                        : 'A band has no backdrop unless you set one here (the dashboard stays visible and usable).'}>
                </lcards-message>
                ` : ''}

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

                ${renderInfoGuide({
                    header: 'How condition overrides work',
                    body: html`
                        <lcards-alert-overlay-diagram kind="conditions"></lcards-alert-overlay-diagram>
                        <p>Each condition sets what shows while that alert mode is active.</p>
                        <ul>
                            <li><strong>Alert symbol</strong> shows the built-in symbol, with the changes for every condition (Config tab, Alert symbol).</li>
                            <li><strong>Customise the symbol</strong> changes it for this condition only, in the symbol's own button editor; only what you change is saved.</li>
                            <li><strong>Your own card</strong> replaces the symbol with any card.</li>
                            <li>Everything else overrides the defaults on the <strong>Config</strong> and <strong>Backdrop</strong> tabs.</li>
                        </ul>
                    `,
                })}

                ${ALERT_CONDITIONS.map(c => this._renderConditionSection(c))}

            </div>
        `;
    }

    /**
     * Render one collapsible condition section.
     * @param {{ key: string, label: string, icon: string }} cond
     * @returns {TemplateResult}
     * @private
     */
    _renderConditionSection(cond) {
        const condCfg    = this.config?.conditions?.[cond.key] ?? {};
        const hasContent = !!(condCfg.content?.type);
        const condKey    = cond.key;


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
        const isBand            = this._displayFor(condKey) === 'band';

        const mode = this._symbolMode(condKey);
        return html`
            <lcards-form-section
                header="${cond.label}"
                description=${{ symbol: 'The alert symbol', custom: 'The alert symbol, customised', card: `Your own card: ${condCfg.content?.type ?? 'pick one'}` }[mode]}
                icon="${cond.icon}"
                data-condition=${condKey}
                ?outlined=${true}
                @expanded-changed=${(/** @type {CustomEvent} */ e) => {
                    // Opening a condition shows it on the preview (the toolbar picks it too)
                    if (e.target === e.currentTarget && e.detail?.expanded) this._condition = condKey;
                }}>

                <!-- ── What shows: the symbol, the symbol customised, or your own card ── -->
                <div class="mode-pills">
                    <wa-button-group childSelector="ha-button">
                        ${[['symbol', 'Alert symbol'], ['custom', 'Customise the symbol'], ['card', 'Your own card']].map(([m, label]) => html`
                            <ha-button iconTag="ha-svg-icon" variant="brand" size="s" data-mode=${m}
                                .appearance=${mode === m ? 'accent' : 'filled'}
                                @click=${() => this._setSymbolMode(condKey, m)}>
                                ${label}
                            </ha-button>`)}
                    </wa-button-group>
                </div>

                ${mode === 'symbol' ? html`
                    <lcards-message type="info"
                        message=${_hasLeaf(this.config?.alert_button ?? {})
                            ? 'The built-in alert symbol, with the changes for every condition (Config tab, Alert symbol).'
                            : 'The built-in alert symbol. Change it for every condition on the Config tab (Alert symbol), or for this one with Customise the symbol.'}>
                    </lcards-message>`
                : mode === 'custom' ? this._renderSymbolEditor(condKey, `conditions.${condKey}.alert_button`)
                : this._renderContentCardSection(condKey, condCfg, hasContent)}

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
                    description=${isBand
                        ? 'Display and timeout for this condition. Shown as a band: it spans the screen, so there is no position or size to set.'
                        : 'Display, overlay position and size, and timeout for this condition only. Leave blank to use the card defaults.'}
                    icon="mdi:move-resize"
                    ?expanded=${!!(pos || width || height || condAutoSeconds || condCfg.display)}
                    ?outlined=${true}>

                    ${FormField.renderField(this, `conditions.${condKey}.display`, {
                        label: 'Display (override)',
                        helper: 'Overlay or band for this condition only',
                        value: condCfg.display ?? '',
                        selectorOverride: { select: { mode: 'dropdown', options: [
                            { value: '', label: '(Use global default)' },
                            { value: 'overlay', label: 'Overlay (backdrop and symbol)' },
                            { value: 'band',    label: 'Band (dashes across the screen)' },
                        ]}},
                    })}

                    ${isBand ? '' : html`
                    <ha-selector
                        .hass=${this.hass}
                        .label=${'Position (override)'}
                        .helper=${'Content anchor point override for this condition. Leave unset to use global default'}
                        .selector=${{ select: { mode: 'dropdown', options: [
                            { value: '', label: '(Use global default)' },
                            ...POSITION_OPTIONS,
                        ]}}}
                        .value=${pos}
                        @value-changed=${(e) => this._setConditionProp(condKey, 'position', e.detail.value || undefined)}>
                    </ha-selector>

                    <lcards-grid-layout>
                        ${FormField.renderField(this, `conditions.${condKey}.width`, {
                            label: 'Width (override)',
                            helper: 'CSS width override, e.g. 400px; blank = global default',
                            selectorOverride: { text: {} },
                        })}
                        ${FormField.renderField(this, `conditions.${condKey}.height`, {
                            label: 'Height (override)',
                            helper: 'CSS height override, e.g. 300px; blank = global default',
                            selectorOverride: { text: {} },
                        })}
                    </lcards-grid-layout>
                    `}

                    ${isAutoMode ? FormField.renderField(this, `conditions.${condKey}.auto_dismiss_seconds`, {
                        label: 'Auto-Dismiss Override (seconds)',
                        helper: 'Override the global auto-dismiss timeout for this condition only. Leave blank to use the global value.',
                        selectorOverride: { number: { min: 1, step: 1, mode: 'box' } },
                    }) : ''}
                </lcards-form-section>

            </lcards-form-section>
        `;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Config helpers — conditions
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * The alert symbol's changes at one level: the card's `alert_button` (every
     * condition) or a condition's. Quick fields for the common changes, then the
     * symbol's own lcards-button editor showing it as it will look; only what
     * differs from the level below (the built-in symbol, plus the card's changes for
     * a condition) is saved.
     * @param {string|null} condKey - null for the card level
     * @param {string} basePath - 'alert_button' or 'conditions.<key>.alert_button'
     */
    _renderSymbolEditor(condKey, basePath) {
        const ab = this._getConfigValue(basePath) ?? {};
        const subTextVal = ab.text?.sub_text?.content ?? '';
        // Jinja2 entity template: {{states('sensor.foo')}}
        const entityMatch = /^\{\{states\('([^']+)'\)\}\}$/.exec(subTextVal);
        const entityId = entityMatch ? entityMatch[1] : '';
        const subTextMode = entityMatch ? 'entity' : 'static';
        const DEFAULT_ALERT_ENTITY = 'input_text.lcards_alert_message';
        const set = (/** @type {string} */ path, /** @type {any} */ value) => this._setConfigValue(`${basePath}.${path}`, value);
        const shownAs = /** @type {string} */ (condKey ?? this._condition ?? 'red_alert');
        const label = ALERT_CONDITIONS.find((c) => c.key === shownAs)?.label ?? shownAs;

        return html`
            <lcards-message type="info"
                message=${condKey
                    ? 'Set only what you want to change for this condition; the rest comes from the alert symbol (and the changes for every condition).'
                    : `Changes here apply to every condition; each keeps its own colours. Shown with the ${label} colours (pick the condition in the toolbar).`}>
            </lcards-message>

            ${FormField.renderField(this, `${basePath}.speed`, {
                label: 'Symbol animation speed',
                helper: 'Multiplier for the symbol bar sweep: 2 = twice as fast. Blank = normal (in band mode: the band speed)',
                selectorOverride: { number: { min: 0.25, max: 4, step: 0.25, mode: 'box' } },
            })}

            <ha-selector
                .hass=${this.hass}
                .label=${'Alert label'}
                .required=${false}
                .helper=${'The top label. Blank = the default (ALERT)'}
                .selector=${{ text: {} }}
                .value=${ab.text?.alert_text?.content ?? ''}
                @value-changed=${(/** @type {CustomEvent} */ e) => set('text.alert_text.content', e.detail.value)}>
            </ha-selector>

            <ha-selector
                .hass=${this.hass}
                .label=${'Sub-text source'}
                .helper=${'A fixed message, or an entity state (an automation can set the message)'}
                .selector=${{ select: { mode: 'list', options: [
                    { value: 'static', label: 'Static text' },
                    { value: 'entity', label: 'Entity state' },
                ]}}}
                .value=${subTextMode}
                @value-changed=${(/** @type {CustomEvent} */ e) => set('text.sub_text.content',
                    e.detail.value === 'entity' ? `{{states('${entityId || DEFAULT_ALERT_ENTITY}')}}` : '')}>
            </ha-selector>

            ${subTextMode === 'entity' ? html`
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Sub-text entity'}
                    .helper=${'Entity whose state is the sub-text (e.g. input_text.lcards_alert_message)'}
                    .selector=${{ entity: {} }}
                    .value=${entityId || DEFAULT_ALERT_ENTITY}
                    @value-changed=${(/** @type {CustomEvent} */ e) => { if (e.detail.value) set('text.sub_text.content', `{{states('${e.detail.value}')}}`); }}>
                </ha-selector>
            ` : html`
                <ha-selector
                    .hass=${this.hass}
                    .label=${'Sub-text'}
                    .required=${false}
                    .helper=${'The message under the label. Blank = the default (e.g. CONDITION: RED)'}
                    .selector=${{ text: {} }}
                    .value=${subTextVal}
                    @value-changed=${(/** @type {CustomEvent} */ e) => set('text.sub_text.content', e.detail.value)}>
                </ha-selector>
            `}

            <lcards-form-section
                header="Every button setting"
                description="The symbol's own lcards-button editor: colours, text fields, segments, animations and more"
                icon="mdi:gesture-tap-button"
                outlined>
                ${customElements.get('hui-card-element-editor') ? html`
                    <div class="card-editor-host">
                        ${keyed(`symbol:${basePath}:${shownAs}`, html`
                            <hui-card-element-editor
                                .hass=${this.hass}
                                .lovelace=${this._contentLovelace()}
                                .value=${this._symbolEditorValue(condKey, shownAs)}
                                @config-changed=${(/** @type {CustomEvent} */ e) => this._onSymbolEdited(condKey, shownAs, basePath, e)}>
                            </hui-card-element-editor>`)}
                    </div>` : html`
                    <lcards-message type="info"
                        message="Home Assistant's card editor is not loaded here: set other button keys on the YAML tab, under alert_button.">
                    </lcards-message>`}
            </lcards-form-section>
        `;
    }

    /**
     * The level below a symbol editor: the built-in symbol, plus the card's changes
     * when editing a condition.
     * @param {string|null} condKey
     * @param {string} shownAs - the condition whose preset is shown
     */
    _symbolBelow(condKey, shownAs) {
        const base = builtInSymbol(shownAs);
        if (!condKey) return base;
        const { speed, ...cardPatch } = symbolPatch({ alert_button: this.config?.alert_button }, shownAs);
        return mergePatch(base, cardPatch);
    }

    /**
     * What the symbol editor shows: the symbol as it will look at this level.
     * @param {string|null} condKey
     * @param {string} shownAs
     */
    _symbolEditorValue(condKey, shownAs) {
        const own = { ...(this._getConfigValue(condKey ? `conditions.${condKey}.alert_button` : 'alert_button') ?? {}) };
        delete own.speed;
        for (const key of ALERT_BUTTON_FIXED_KEYS) delete own[key];
        return mergePatch(this._symbolBelow(condKey, shownAs), own);
    }

    /**
     * An edit in the symbol's button editor: save what differs from the level below.
     * @param {string|null} condKey
     * @param {string} shownAs
     * @param {string} basePath
     * @param {CustomEvent} e
     */
    _onSymbolEdited(condKey, shownAs, basePath, e) {
        e.stopPropagation();
        const cfg = e.detail?.config ?? e.detail?.value;
        if (!cfg?.type) return;
        const diff = patchDiff(JSON.parse(JSON.stringify(cfg)), this._symbolBelow(condKey, shownAs)) ?? {};
        for (const key of ALERT_BUTTON_FIXED_KEYS) delete diff[key];
        const speed = this._getConfigValue(`${basePath}.speed`);
        const next = speed !== undefined ? { ...diff, speed } : diff;
        if (condKey) this._setConditionProp(condKey, 'alert_button', Object.keys(next).length ? next : undefined);
        else this._updateConfig({ alert_button: Object.keys(next).length ? next : undefined });
    }

    /**
     * Which pill a condition shows: its own card, the symbol customised (it has
     * changes, or the pill was just picked), or the plain symbol.
     * @param {string} condKey
     * @returns {'symbol'|'custom'|'card'}
     */
    _symbolMode(condKey) {
        const condCfg = this.config?.conditions?.[condKey] ?? {};
        if (condCfg.content?.type) return 'card';
        const picked = this._pickedModes?.[condKey];
        if (picked) return picked;
        return _hasLeaf(condCfg.alert_button ?? {}) ? 'custom' : 'symbol';
    }

    /**
     * Switch a condition's pill. Leaving a customised symbol or your own card for
     * the plain symbol (or a card for the customised symbol) removes it, after asking.
     * @param {string} condKey
     * @param {string} mode
     */
    async _setSymbolMode(condKey, mode) {
        const current = this._symbolMode(condKey);
        if (mode === current) return;
        const condCfg = this.config?.conditions?.[condKey] ?? {};
        const label = ALERT_CONDITIONS.find((c) => c.key === condKey)?.label ?? condKey;
        if (current === 'card' && mode !== 'card') {
            const ok = await showConfirmDeleteDialog({
                title: 'Remove your card?',
                message: `${label} shows your ${condCfg.content?.type ?? ''} card. Switching removes it from this condition (Cancel the studio to get it back).`,
                confirmText: 'Remove',
            });
            if (!ok) return;
            this._setConditionProp(condKey, 'content', undefined);
        } else if (current === 'custom' && mode === 'symbol' && _hasLeaf(condCfg.alert_button ?? {})) {
            const ok = await showConfirmDeleteDialog({
                title: 'Remove the changes?',
                message: `${label} has its own changes to the alert symbol. Switching removes them (Cancel the studio to get them back).`,
                confirmText: 'Remove',
            });
            if (!ok) return;
            this._setConditionProp(condKey, 'alert_button', undefined);
        }
        this._pickedModes = { ...this._pickedModes, [condKey]: mode === 'symbol' ? undefined : mode };
        this.requestUpdate();
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
            ...(isCondition ? [{ value: '__inherit__', label: '(Inherit global)' }] : []),
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
        if (spec.type === 'boolean') {
            return html`
                <ha-selector
                    .hass=${this.hass}
                    .label=${spec.label}
                    .helper=${spec.helper ?? ''}
                    .selector=${{ boolean: {} }}
                    .value=${typeof value === 'boolean' ? value : fallback !== false}
                    @value-changed=${(e) => onChange(e.detail.value)}>
                </ha-selector>
            `;
        }
        if (spec.type === 'select') {
            return html`
                <ha-selector
                    .hass=${this.hass}
                    .label=${spec.label}
                    .helper=${spec.helper ?? ''}
                    .selector=${{ select: { mode: 'dropdown', options: spec.options ?? [] } }}
                    .value=${value ?? fallback ?? ''}
                    @value-changed=${(e) => onChange(e.detail.value || undefined)}>
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
        const c = parseColor(color);
        if (c) return `rgba(${c.r},${c.g},${c.b},${Math.min(1, c.a * opacity).toFixed(2)})`;
        return color;
    }

    /**
     * Remove the custom content card for a condition.
     * @private
     */
    _removeConditionContent(condKey) {
        this._setConditionProp(condKey, 'content', undefined);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Conditions: the picked condition, its content card
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Your own card for a condition (`content`): picked with Home Assistant's card
     * picker, edited inline with its own editor (as the Layout Studio does).
     * @param {string} condKey
     * @param {any} condCfg
     * @param {boolean} hasContent
     */
    _renderContentCardSection(condKey, condCfg, hasContent) {
        return html`
            <lcards-form-section
                header="Content card"
                description=${hasContent
                    ? `${condCfg.content.type}: shown instead of the alert symbol, edited here`
                    : 'Any card in place of the alert symbol'}
                icon="mdi:card-multiple-outline"
                ?expanded=${true}
                outlined>
                ${hasContent ? html`
                    <div class="content-buttons">
                        <ha-button appearance="plain" @click=${() => this._openContentCardPicker(condKey)}>
                            <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                            Change card type
                        </ha-button>
                        <ha-button appearance="plain" variant="danger" @click=${() => this._removeConditionContent(condKey)}>
                            <ha-icon icon="mdi:close" slot="start"></ha-icon>
                            Remove
                        </ha-button>
                    </div>
                    ${customElements.get('hui-card-element-editor') ? html`
                    <div class="card-editor-host">
                        ${keyed(`${condKey}:${condCfg.content.type}`, html`
                            <hui-card-element-editor
                                .hass=${this.hass}
                                .lovelace=${this._contentLovelace()}
                                .value=${condCfg.content}
                                @config-changed=${(/** @type {CustomEvent} */ e) => this._onContentChanged(condKey, e)}>
                            </hui-card-element-editor>`)}
                    </div>` : html`
                    <lcards-message type="info"
                        message=${`Home Assistant's card editor is not loaded here: edit the ${condCfg.content.type} card on the YAML tab.`}>
                    </lcards-message>`}
                ` : html`
                    <lcards-message type="info"
                        message="Any card in place of the alert symbol, edited here with its own editor.">
                    </lcards-message>
                    <div class="content-buttons">
                        <ha-button @click=${() => this._openContentCardPicker(condKey)}>
                            <ha-icon icon="mdi:cards-playing-outline" slot="start"></ha-icon>
                            Pick a card
                        </ha-button>
                    </div>
                `}
            </lcards-form-section>
        `;
    }

    /**
     * A change from the inline card editor.
     * @param {string} condKey
     * @param {CustomEvent} e
     */
    _onContentChanged(condKey, e) {
        e.stopPropagation();
        const cfg = e.detail?.config ?? e.detail?.value;
        if (cfg?.type) this._setConditionProp(condKey, 'content', JSON.parse(JSON.stringify(cfg)));
    }

    /**
     * Load Home Assistant's card editor (hui-card-element-editor) if it isn't yet:
     * it comes with the card editor dialog, so a studio opened elsewhere loads it
     * through the stack card's editor, which imports it. Re-renders once defined.
     */
    async _ensureCardElementEditor() {
        if (customElements.get('hui-card-element-editor')) return;
        customElements.whenDefined('hui-card-element-editor').then(() => this.requestUpdate());
        try {
            const helpers = await /** @type {any} */ (window).loadCardHelpers?.();
            await helpers?.createCardElement({ type: 'vertical-stack', cards: [] });
            // the element comes back before its class is defined: ask the class
            await customElements.whenDefined('hui-vertical-stack-card');
            await /** @type {any} */ (customElements.get('hui-vertical-stack-card'))?.getConfigElement?.();
        } catch {
            // Without it the content card is edited on the YAML tab (the section says so)
        }
    }

    /** Minimal lovelace config for hui-card-picker and hui-card-element-editor. */
    _contentLovelace() {
        return { views: [{ title: 'Home', path: 'home', cards: [] }] };
    }

    /**
     * Pick a card type for a condition (Home Assistant's card picker, in a dialog).
     * @param {string} condKey
     */
    async _openContentCardPicker(condKey) {
        if (!customElements.get('hui-card-picker')) {
            showInfoDialog({
                title: 'Card picker not ready',
                message: 'Home Assistant hasn\u2019t loaded its card picker yet. On any dashboard, click \u201cAdd card\u201d once (you can cancel it), then come back and try again.',
            });
            return;
        }
        this._pickerDialog?.remove();
        const dialog = /** @type {any} */ (document.createElement('ha-dialog'));
        dialog.headerTitle = 'Select a card';
        this._pickerDialog = dialog;
        mountDialogNearHomeAssistant(dialog, /** @type {any} */ (this));
        dialog.open = true;
        await dialog.updateComplete;
        const picker = /** @type {any} */ (document.createElement('hui-card-picker'));
        picker.hass = this.hass;
        picker.lovelace = this._contentLovelace();
        picker.style.cssText = 'padding:24px; display:block;';
        dialog.appendChild(picker);
        await new Promise(r => setTimeout(r, 80));
        picker.requestUpdate?.();
        picker.addEventListener('config-changed', (/** @type {CustomEvent} */ e) => {
            e.stopPropagation();
            const selected = e.detail?.config;
            dialog.open = false;
            if (selected?.type) {
                this._setConditionProp(condKey, 'alert_button', undefined);
                this._setConditionProp(condKey, 'content', JSON.parse(JSON.stringify(selected)));
            }
        });
        dialog.addEventListener('closed', (/** @type {Event} */ e) => {
            e.stopPropagation();
            dialog.remove();
            if (this._pickerDialog === dialog) this._pickerDialog = null;
        });
    }
};
