/**
 * LCARdS Alert Overlay Card
 *
 * A screen-wide, per-dashboard overlay that reacts to
 * `input_select.lcards_alert_mode` and displays a full-screen backdrop
 * plus a content card when the system is in an alert state
 * (red / yellow / blue / black / gray).
 *
 * Dismisses and hides itself when the mode returns to `green_alert` or
 * `default`.  Uses the same `helperManager.subscribeToHelper('alert_mode', …)`
 * hook as SoundManager and ThemeManager — no new plumbing required.
 *
 * @extends LitElement
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { createCardElement, applyHassToCard, applyCardConfig } from '../utils/ha-card-factory.js';
import { getAlertOverlaySchema } from './schemas/lcards-alert-overlay-schema.js';

export class LCARdSAlertOverlay extends LitElement {

    // -------------------------------------------------------------------------
    // Reactive properties
    // -------------------------------------------------------------------------

    static get properties() {
        return {
            hass:              { type: Object },
            config:            { type: Object },
            _isActive:         { type: Boolean, state: true },
            _activeCondition:  { type: String,  state: true },
            _isDismissed:      { type: Boolean, state: true },
        };
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._hass             = null;
        this._contentElement   = null;
        this._alertUnsubscribe = null;
        this._isActive         = false;
        this._activeCondition  = null;
        this._isDismissed      = false;
    }

    // -------------------------------------------------------------------------
    // HASS setter — forward to mounted content card
    // -------------------------------------------------------------------------

    set hass(value) {
        this._hass = value;
        if (this._contentElement) {
            applyHassToCard(this._contentElement, value, 'alert-overlay-hass');
        }
    }

    get hass() {
        return this._hass;
    }

    // -------------------------------------------------------------------------
    // Card API
    // -------------------------------------------------------------------------

    setConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('[LCARdSAlertOverlay] Invalid config — must be an object');
        }
        this.config = config;
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    connectedCallback() {
        super.connectedCallback();

        // Subscribe to alert_mode changes via HelperManager
        const helperManager = window.lcards?.core?.helperManager;
        if (helperManager) {
            this._alertUnsubscribe = helperManager.subscribeToHelper(
                'alert_mode',
                this._handleAlertModeChange.bind(this),
            );
            lcardsLog.debug('[LCARdSAlertOverlay] Subscribed to alert_mode helper');
        } else {
            lcardsLog.warn('[LCARdSAlertOverlay] HelperManager not available — alert subscription skipped');
        }

        // Read current mode immediately so we don't miss an already-active alert
        const currentMode =
            window.lcards?.core?.helperManager?.getHelperValue('alert_mode') ??
            this._hass?.states?.['input_select.lcards_alert_mode']?.state;

        if (currentMode) {
            this._handleAlertModeChange(currentMode);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this._alertUnsubscribe?.();
        this._alertUnsubscribe = null;
        this._unmountContentCard();
    }

    // -------------------------------------------------------------------------
    // Alert mode handling
    // -------------------------------------------------------------------------

    _handleAlertModeChange(newMode) {
        const isInactive = !newMode || newMode === 'green_alert' || newMode === 'default';

        if (isInactive) {
            this._isActive        = false;
            this._isDismissed     = false;
            this._unmountContentCard();
        } else {
            this._activeCondition = newMode;
            this._isDismissed     = false;
            this._isActive        = true;
            this._mountContentCard(newMode);
        }
    }

    // -------------------------------------------------------------------------
    // Content card lifecycle
    // -------------------------------------------------------------------------

    async _mountContentCard(condition) {
        // Remove any previous content card first
        this._unmountContentCard();

        const conditionConfig = this.config?.conditions?.[condition];
        const cardConfig      = conditionConfig?.content ?? this._getDefaultContent(condition);

        if (!cardConfig) {
            lcardsLog.warn(`[LCARdSAlertOverlay] No content config for condition: ${condition}`);
            return;
        }

        const el = await createCardElement(cardConfig.type, 'alert-overlay');
        if (!el) {
            lcardsLog.warn(`[LCARdSAlertOverlay] Failed to create card element for type: ${cardConfig.type}`);
            return;
        }

        // Apply HASS before config (as required by ha-card-factory conventions)
        if (this._hass) {
            applyHassToCard(el, this._hass, 'alert-overlay-mount');
        }

        await applyCardConfig(el, cardConfig, 'alert-overlay');

        this._contentElement = el;

        // Attach to content container inside the shadow root
        const container = this.renderRoot?.querySelector('.alert-overlay-content-card');
        if (container) {
            container.appendChild(el);
        }

        this.requestUpdate();
    }

    _unmountContentCard() {
        if (this._contentElement) {
            this._contentElement.remove();
            this._contentElement = null;
        }
    }

    // -------------------------------------------------------------------------
    // Default fallback content
    // -------------------------------------------------------------------------

    _getDefaultContent(condition) {
        const DEFAULTS = {
            red_alert:    { preset: 'condition_red',    alert_text: 'ALERT', sub_text: 'CONDITION: RED' },
            yellow_alert: { preset: 'condition_yellow', alert_text: 'ALERT', sub_text: 'CONDITION: YELLOW' },
            blue_alert:   { preset: 'condition_blue',   alert_text: 'ALERT', sub_text: 'CONDITION: BLUE' },
            black_alert:  { preset: 'condition_black',  alert_text: 'ALERT', sub_text: 'CONDITION: BLACK' },
            gray_alert:   { preset: 'condition_gray',   alert_text: 'ALERT', sub_text: 'CONDITION: GRAY' },
        };

        const def = DEFAULTS[condition];
        if (!def) return null;

        return {
            type:      'custom:lcards-button',
            component: 'alert',
            alert:     { preset: def.preset },
            text: {
                alert_text: { content: def.alert_text },
                sub_text:   { content: def.sub_text },
            },
        };
    }

    // -------------------------------------------------------------------------
    // Style / layout helpers
    // -------------------------------------------------------------------------

    _getEffectiveBackdrop() {
        const global    = this.config?.backdrop ?? {};
        const perCond   = this.config?.conditions?.[this._activeCondition]?.backdrop ?? {};
        return {
            blur:    perCond.blur    ?? global.blur    ?? '8px',
            opacity: perCond.opacity ?? global.opacity ?? 0.6,
            color:   perCond.color   ?? global.color   ?? 'rgba(0,0,0,0.5)',
        };
    }

    _getEffectiveSize() {
        const perCond = this.config?.conditions?.[this._activeCondition];
        return {
            width:  perCond?.width  ?? this.config?.width  ?? 'auto',
            height: perCond?.height ?? this.config?.height ?? 'auto',
        };
    }

    _getEffectivePosition() {
        const position =
            this.config?.conditions?.[this._activeCondition]?.position ??
            this.config?.position ??
            'center';

        const positionMap = {
            'top-left':      { alignItems: 'flex-start', justifyContent: 'flex-start' },
            'top':           { alignItems: 'flex-start', justifyContent: 'center' },
            'top-center':    { alignItems: 'flex-start', justifyContent: 'center' },
            'top-right':     { alignItems: 'flex-start', justifyContent: 'flex-end' },
            'left':          { alignItems: 'center',     justifyContent: 'flex-start' },
            'left-center':   { alignItems: 'center',     justifyContent: 'flex-start' },
            'center':        { alignItems: 'center',     justifyContent: 'center' },
            'right':         { alignItems: 'center',     justifyContent: 'flex-end' },
            'right-center':  { alignItems: 'center',     justifyContent: 'flex-end' },
            'bottom-left':   { alignItems: 'flex-end',   justifyContent: 'flex-start' },
            'bottom':        { alignItems: 'flex-end',   justifyContent: 'center' },
            'bottom-center': { alignItems: 'flex-end',   justifyContent: 'center' },
            'bottom-right':  { alignItems: 'flex-end',   justifyContent: 'flex-end' },
        };

        return positionMap[position] ?? positionMap['center'];
    }

    // -------------------------------------------------------------------------
    // Dismiss handling
    // -------------------------------------------------------------------------

    _handleDismiss() {
        this._isDismissed = true;
        this._isActive    = false;
        this._unmountContentCard();

        const dismissMode = this.config?.dismiss_mode;
        if (dismissMode === 'reset') {
            this._hass?.callService('input_select', 'select_option', {
                entity_id: 'input_select.lcards_alert_mode',
                option:    'green_alert',
            });
        }
    }

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    render() {
        if (!this._isActive || this._isDismissed) {
            return html``;
        }

        const backdrop = this._getEffectiveBackdrop();
        const size     = this._getEffectiveSize();
        const pos      = this._getEffectivePosition();

        return html`
            <div class="alert-overlay-host" style="position:fixed;inset:0;z-index:9000;">
                <div
                    class="alert-overlay-backdrop"
                    @click=${this._handleDismiss}
                    style="
                        position:absolute;
                        inset:0;
                        backdrop-filter: blur(${backdrop.blur});
                        -webkit-backdrop-filter: blur(${backdrop.blur});
                        background: ${backdrop.color};
                        opacity: ${backdrop.opacity};
                        cursor: pointer;
                    "
                ></div>
                <div
                    class="alert-overlay-content-wrapper"
                    style="
                        position:absolute;
                        inset:0;
                        display:flex;
                        pointer-events:none;
                        align-items:${pos.alignItems};
                        justify-content:${pos.justifyContent};
                    "
                >
                    <div
                        class="alert-overlay-content-card"
                        style="
                            pointer-events:auto;
                            width:${size.width};
                            height:${size.height};
                        "
                    ></div>
                </div>
            </div>
        `;
    }

    // -------------------------------------------------------------------------
    // Styles
    // -------------------------------------------------------------------------

    static get styles() {
        return css`
            :host {
                display: contents;
            }

            .alert-overlay-host {
                position: fixed;
                inset: 0;
                z-index: 9000;
            }

            .alert-overlay-backdrop {
                position: absolute;
                inset: 0;
                cursor: pointer;
            }

            .alert-overlay-content-wrapper {
                position: absolute;
                inset: 0;
                display: flex;
                pointer-events: none;
            }

            .alert-overlay-content-card {
                pointer-events: auto;
            }
        `;
    }

    // -------------------------------------------------------------------------
    // HA card API
    // -------------------------------------------------------------------------

    static getConfigElement() {
        // Editor stub — full editor implementation in Phase 2
        return document.createElement('lcards-alert-overlay-editor');
    }

    static getStubConfig() {
        return {
            type: 'custom:lcards-alert-overlay',
            dismiss_mode: 'dismiss',
            backdrop: {
                blur:    '8px',
                opacity: 0.6,
                color:   'rgba(0,0,0,0.5)',
            },
            position: 'center',
        };
    }

    static registerSchema() {
        window.lcards?.core?.configManager?.registerCardSchema(
            'lcards-alert-overlay',
            getAlertOverlaySchema(),
        );
    }
}

// NOTE: Card registration handled in src/lcards.js initializeCustomCard().then()
