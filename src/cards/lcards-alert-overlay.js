/**
 * @fileoverview LCARdS Alert Overlay Card (`lcards-alert-overlay`).
 *
 * A screen-wide, per-dashboard overlay that reacts to
 * `input_select.lcards_alert_mode` and displays a full-screen backdrop
 * plus a content card when the system is in an alert state
 * (red / yellow / blue / black / gray).
 *
 * Dismisses and hides itself when the mode returns to `green_alert` or
 * `default`.  Uses the same `helperManager.subscribeToHelper('alert_mode', …)`
 * hook as SoundManager and ThemeManager, plus the `lcards-alert-mode-local`
 * window event that `window.lcards.setAlertMode()` fires when the helper is not
 * written (a targeted `lcards.*_alert` action, or no helper), so an alert raised
 * on this device only shows here too.
 *
 * Only one instance may be active per dashboard; duplicate instances
 * suppress themselves and log a warning.
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { getAlertOverlaySchema } from './schemas/lcards-alert-overlay-schema.js';
import { resolveBandConfig } from './alert-band-layout.js';
import {
    displayFor, overlayContentSize, overlayPosition, buildContentConfig, resolveLayers, bandLayers, resolveJinjaText, ALERT_CONDITION_KEYS,
} from './alert-overlay-config.js';

export { overlayContentSize, DEFAULT_CONTENT_WIDTH, DEFAULT_SYMBOL_HEIGHT } from './alert-overlay-config.js';
import './lcards-alert-band.js';


// ─────────────────────────────────────────────────────────────────────────────
// Module-level singleton guard
//
// HA can connect a new instance before disconnecting the old one (e.g. when
// exiting dashboard edit mode), so the claim is deferred one microtask.
//
// Rules:
//   - A connected instance outside the card editor / picker claims ownership.
//   - If _activeOverlay is a DIFFERENT instance, the newcomer is suppressed and
//     retries when the owner releases (`lcards-alert-overlay-released`).
//   - If _activeOverlay is THIS instance (reconnect), ownership is re-confirmed.
//   - Only the owner's disconnect hides the portal and releases ownership; an
//     instance that left before its deferred claim ran never claims.
//   - The card editor's preview and the card picker never claim: they render a
//     placeholder, not the duplicate warning.
// ─────────────────────────────────────────────────────────────────────────────
let _activeOverlay = null;

export class LCARdSAlertOverlay extends LitElement {

    // -------------------------------------------------------------------------
    // Reactive properties
    // -------------------------------------------------------------------------

    static get properties() {
        return {
            hass:             { type: Object },
            config:           { type: Object },
            _isActive:        { type: Boolean, state: true },
            _activeCondition: { type: String,  state: true },
            _isDismissed:     { type: Boolean, state: true },
            _editMode:        { type: Boolean, state: true },
            // Set by Home Assistant's hui-card on every card element: true while
            // the dashboard is in edit mode and in the card editor's preview.
            preview:          { type: Boolean },
            editMode:         { type: Boolean },
        };
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
        super();
        this._hass             = null;
        this._alertUnsubscribe = null;
        /** @type {((e: Event) => void)|null} */
        this._localModeHandler = null;
        this._isActive         = false;
        this._activeCondition  = null;
        this._isDismissed      = false;
        this._isSuppressed     = false;
        this._editMode         = false;
        this.preview           = false;
        this.editMode          = false;
        /** In the card editor's preview or the card picker: never owns the overlay. */
        this._inEditor         = false;
        /** @type {(() => void)|null} */
        this._releaseListener  = null;
        this._autoDismissTimer = null;
        /** @type {(() => void)|null} */
        this._bandDismissHandler = null;
    }

    // -------------------------------------------------------------------------
    // HASS setter — forward to mounted content card
    // -------------------------------------------------------------------------

    set hass(value) {
        this._hass = value;
    }

    get hass() {
        return this._hass;
    }

    // -------------------------------------------------------------------------
    // Card API
    // -------------------------------------------------------------------------

    setConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('[LCARdSAlertOverlay] Invalid config - must be an object');
        }
        this.config = config;

        // Remount when config changes while active so alert_button / content
        // overrides take effect immediately without toggling the alert mode.
        if (!this._isSuppressed && this._isActive && !this._isDismissed && this._activeCondition) {
            this._mountContentCard(this._activeCondition);
        }
    }

    // -------------------------------------------------------------------------
    // Lifecycle
    // -------------------------------------------------------------------------

    connectedCallback() {
        super.connectedCallback();
        this._inEditor = this._checkForAncestor(['hui-dialog-edit-card', 'hui-card-picker']);
        this._editMode = this._isInEditMode();

        // ── Singleton guard (deferred) ────────────────────────────────────────
        // HA can call connectedCallback on a new instance BEFORE calling
        // disconnectedCallback on the old one (e.g. when exiting edit mode).
        // Defer the ownership check one microtask so that any in-flight
        // disconnectedCallback has a chance to clear _activeOverlay first.
        if (!this._inEditor) Promise.resolve().then(() => this._claimOwnership());
    }

    _claimOwnership() {
        // Disconnected before the deferred claim ran: never own the overlay.
        if (!this.isConnected) return;
        if (_activeOverlay !== null && _activeOverlay !== this) {
            // Another live instance already owns the overlay.
            lcardsLog.warn(
                '[LCARdSAlertOverlay] Another instance is already active. ' +
                'Remove duplicate lcards-alert-overlay cards from your dashboard. ' +
                'This instance will be suppressed.'
            );
            this._isSuppressed = true;

            // Listen for the owner to release so we can retry (one-shot: either
            // we claim next time or suppress again and listen again).
            this._removeReleaseListener();
            this._releaseListener = () => {
                this._releaseListener = null;
                this._claimOwnership();
            };
            window.addEventListener('lcards-alert-overlay-released', this._releaseListener, { once: true });
            return;
        }

        // Claim ownership (covers both first-connect and reconnect cases)
        _activeOverlay     = this;
        this._isSuppressed = false;

        this._subscribeToAlertMode();

        // Replay current mode in case alert was already active when we connected
        // (the helper manager reads the entity's state until its cache fills).
        const currentMode = this._currentAlertMode();

        if (currentMode) {
            this._handleAlertModeChange(currentMode);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        if (this._bandDismissHandler) {
            window.removeEventListener('lcards-alert-band-dismiss', this._bandDismissHandler);
            this._bandDismissHandler = null;
        }
        this._removeReleaseListener();
        this._isSuppressed = false;

        // Only the owner tears down the shared portal: an instance that never
        // claimed (suppressed, in the editor, or gone before its deferred claim
        // ran) must not hide the live alert.
        if (_activeOverlay !== this) return;

        this._unsubscribeFromAlertMode();
        this._clearAutoDismissTimer();
        window.lcards?.core?.portalOverlayManager?.hide('alert-overlay');

        // Release, then tell any suppressed sibling (created while we were still
        // alive) to retry its claim.
        _activeOverlay = null;
        window.dispatchEvent(new CustomEvent('lcards-alert-overlay-released'));
    }

    _removeReleaseListener() {
        if (!this._releaseListener) return;
        window.removeEventListener('lcards-alert-overlay-released', this._releaseListener);
        this._releaseListener = null;
    }

    // -------------------------------------------------------------------------
    // HelperManager subscription
    // -------------------------------------------------------------------------

    _subscribeToAlertMode() {
        this._unsubscribeFromAlertMode();

        // A mode set on this device only (targeted action, or no helper): the helper
        // does not change, so its subscription below never fires for it.
        this._localModeHandler = (/** @type {any} */ e) => this._handleAlertModeChange(e.detail?.mode);
        window.addEventListener('lcards-alert-mode-local', this._localModeHandler);

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
    }

    _unsubscribeFromAlertMode() {
        this._alertUnsubscribe?.();
        this._alertUnsubscribe = null;
        if (this._localModeHandler) window.removeEventListener('lcards-alert-mode-local', this._localModeHandler);
        this._localModeHandler = null;
    }

    /**
     * The alert mode to replay on connect: the helper's, unless it is inactive
     * while this device shows an alert of its own (a targeted action, or no helper).
     * @returns {string|null|undefined}
     */
    _currentAlertMode() {
        const helperMode = window.lcards?.core?.helperManager?.getHelperValue('alert_mode');
        const localMode  = window.lcards?.core?.themeManager?.getAlertMode?.();
        const inactive = (/** @type {any} */ m) => !m || m === 'green_alert' || m === 'default';
        return inactive(helperMode) && ALERT_CONDITION_KEYS.includes(localMode) ? localMode : helperMode;
    }

    // -------------------------------------------------------------------------
    // Edit mode detection
    // -------------------------------------------------------------------------

    /** Home Assistant sets `preview` (and the older `editMode`) on the card element. */
    _isInEditMode() {
        return this._inEditor || this.preview === true || this.editMode === true;
    }

    /**
     * Whether an ancestor (across shadow roots) has one of these tag names.
     * @param {string[]} tags - Lower-case tag names
     * @returns {boolean}
     */
    _checkForAncestor(tags) {
        /** @type {any} */
        let node = this;
        for (let i = 0; i < 30 && node; i++) {
            if (tags.includes(node.tagName?.toLowerCase())) return true;
            node = node.parentElement || node.parentNode?.host || node.getRootNode?.()?.host;
        }
        return false;
    }

    // -------------------------------------------------------------------------
    // Alert mode handling
    // -------------------------------------------------------------------------

    _handleAlertModeChange(newMode) {
        if (this._isSuppressed) return;

        const isInactive = !newMode || newMode === 'green_alert' || newMode === 'default';

        if (isInactive) {
            this._clearAutoDismissTimer();
            this._isActive        = false;
            this._isDismissed     = false;
            window.lcards?.core?.portalOverlayManager?.hide('alert-overlay');
        } else {
            this._clearAutoDismissTimer();
            this._activeCondition = newMode;
            this._isDismissed     = false;
            this._isActive        = true;
            // In edit mode the alert is noted, not shown: it shows (and its
            // auto-dismiss countdown starts) when edit mode ends.
            if (this._isInEditMode()) {
                lcardsLog.debug('[LCARdSAlertOverlay] Edit mode active: alert shows when it ends');
                return;
            }
            this._mountContentCard(newMode);
            this._startAutoDismissTimer(newMode);
        }
    }

    // -------------------------------------------------------------------------
    // Content card lifecycle
    // -------------------------------------------------------------------------

    async _mountContentCard(condition) {
        // What shows (alert-overlay-config.js, shared with the Alert Studio preview)
        const cardConfig = buildContentConfig(this.config, condition);

        if (!cardConfig) {
            lcardsLog.warn(`[LCARdSAlertOverlay] No content config for condition: ${condition}`);
            return;
        }

        // Pre-evaluate Jinja2 templates in text fields using the overlay's settled
        // HASS connection before handing the config to POM.
        // JS ([[[...]]]) and token ({entity.state}) templates are synchronous and
        // are handled by lcards-button's own pipeline after mount.
        const resolvedConfig = await resolveJinjaText(cardConfig, this._hass);

        // Guard: condition or active state may have changed during async resolution.
        if (!this._isActive || this._isSuppressed || this._activeCondition !== condition) {
            lcardsLog.debug('[LCARdSAlertOverlay] Condition changed during template resolution — mount aborted');
            return;
        }

        const pom = window.lcards?.core?.portalOverlayManager;
        if (!pom) {
            lcardsLog.warn('[LCARdSAlertOverlay] PortalOverlayManager unavailable');
            return;
        }

        if (displayFor(this.config, condition) === 'band') {
            this._showBand(pom, condition, resolvedConfig);
            return;
        }

        const size     = overlayContentSize(this.config, condition);
        const layers   = resolveLayers(this.config, condition);
        const position = overlayPosition(this.config, condition);

        pom.show('alert-overlay', {
            position,
            width:     size.width,
            height:    size.height,
            dismiss:   true,
            onDismiss: () => this._handleDismiss(),
            content:   resolvedConfig,
            layers,
        });

        this.requestUpdate();
    }

    /**
     * Show the alert band: full screen, clicks pass through except on the
     * emblem, which dismisses. Backdrop layers only when the config sets them.
     * @param {any} pom - PortalOverlayManager
     * @param {string} condition
     * @param {Object} emblem - Emblem card config (the alert button or `content`)
     */
    _showBand(pom, condition, emblem) {
        this._listenForBandDismiss();
        pom.show('alert-overlay', {
            position:    'top-left',
            width:       '100%',
            height:      '100%',
            dismiss:     false,
            passThrough: true,
            content: {
                type: 'custom:lcards-alert-band',
                condition,
                band: resolveBandConfig(this.config, condition),
                emblem,
            },
            layers: bandLayers(this.config, condition),
        });
        this.requestUpdate();
    }

    /** The band's emblem fires `lcards-alert-band-dismiss` (composed) when clicked. */
    _listenForBandDismiss() {
        if (this._bandDismissHandler) return;
        this._bandDismissHandler = () => {
            if (!this._isActive || this._isSuppressed) return;
            this._handleDismiss();
            window.lcards?.core?.portalOverlayManager?.hide('alert-overlay');
        };
        window.addEventListener('lcards-alert-band-dismiss', this._bandDismissHandler);
    }

    // -------------------------------------------------------------------------
    // Dismiss handling
    // -------------------------------------------------------------------------

    _handleDismiss() {
        this._clearAutoDismissTimer();
        this._isDismissed = true;
        this._isActive    = false;
        // PortalOverlayManager calls hide('alert-overlay') after this callback returns
        // when triggered via the dismiss button.  The auto-dismiss timer path
        // calls pom.hide() explicitly after this method.

        if (this.config?.dismiss_mode === 'reset' || this.config?.dismiss_mode === 'auto-reset') {
            const helperManager = window.lcards?.core?.helperManager;
            if (helperManager?.getHelperValue('alert_mode') === this._activeCondition) {
                helperManager.setHelperValue('alert_mode', 'green_alert')
                    .catch((/** @type {any} */ e) => lcardsLog.warn('[LCARdSAlertOverlay] Reset to green alert failed:', e));
            } else {
                // An alert on this device only (targeted, or no helper): reset it here.
                window.lcards?.setAlertMode?.('green_alert', { skipHelperSync: true })
                    ?.catch?.((/** @type {any} */ e) => lcardsLog.warn('[LCARdSAlertOverlay] Reset to green alert failed:', e));
            }
        }
    }

    // -------------------------------------------------------------------------
    // Auto-dismiss timer
    // -------------------------------------------------------------------------

    /**
     * Start an auto-dismiss countdown for the given condition if the
     * effective dismiss_mode is `auto-dismiss` or `auto-reset`.
     * Any previously running timer is cleared first.
     *
     * @param {string} condition — active condition key (e.g. 'red_alert')
     */
    _startAutoDismissTimer(condition) {
        this._clearAutoDismissTimer();

        const mode = this.config?.dismiss_mode;
        if (mode !== 'auto-dismiss' && mode !== 'auto-reset') return;

        const seconds = this._getEffectiveAutoDismissSeconds(condition);
        if (!seconds || seconds <= 0) {
            lcardsLog.warn('[LCARdSAlertOverlay] auto-dismiss mode active but auto_dismiss_seconds is unset or invalid — timer not started');
            return;
        }

        lcardsLog.debug(`[LCARdSAlertOverlay] Auto-dismiss timer started: ${seconds}s for condition ${condition}`);
        this._autoDismissTimer = setTimeout(() => {
            lcardsLog.debug(`[LCARdSAlertOverlay] Auto-dismiss timer fired for condition ${condition}`);
            this._handleDismiss();
            window.lcards?.core?.portalOverlayManager?.hide('alert-overlay');
        }, seconds * 1000);
    }

    /** Cancel any running auto-dismiss timer. */
    _clearAutoDismissTimer() {
        if (this._autoDismissTimer !== null) {
            clearTimeout(this._autoDismissTimer);
            this._autoDismissTimer = null;
        }
    }

    /**
     * Resolve the effective auto-dismiss duration (seconds) for a condition.
     * Per-condition `auto_dismiss_seconds` takes precedence over the global value.
     *
     * @param {string} condition
     * @returns {number|null}
     */
    _getEffectiveAutoDismissSeconds(condition) {
        return (
            this.config?.conditions?.[condition]?.auto_dismiss_seconds ??
            this.config?.auto_dismiss_seconds ??
            null
        );
    }

    // -------------------------------------------------------------------------
    // Lifecycle — sync portal after every reactive-state change
    // -------------------------------------------------------------------------

    willUpdate(changedProps) {
        if (changedProps.has('preview') || changedProps.has('editMode')) {
            this._editMode = this._isInEditMode();
        }
    }

    updated(changedProps) {
        super.updated?.(changedProps);
        // Toggle host attribute so CSS can switch display: contents → block
        if (this._editMode) {
            this.setAttribute('data-edit-mode', '');
        } else {
            this.removeAttribute('data-edit-mode');
        }
        // Only sync overlay visibility on edit mode transitions — not on every render.
        if (changedProps.has('_editMode')) {
            if (this._editMode) {
                window.lcards?.core?.portalOverlayManager?.hide('alert-overlay');
            } else if (this._isActive && !this._isDismissed && this._activeCondition) {
                this._mountContentCard(this._activeCondition);
                // An alert raised during edit mode starts its countdown now.
                if (this._autoDismissTimer === null) this._startAutoDismissTimer(this._activeCondition);
            }
        }
    }

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    render() {
        // Outside edit mode this element is invisible: the visible overlay
        // lives in a portal on document.body.
        if (!this._editMode) return html``;

        const conditionKeys = Object.keys(this.config?.conditions ?? {});
        const isDuplicate = this._isSuppressed;
        const badge = this._inEditor ? ''
            : isDuplicate ? html`<span class="ep-badge ep-badge--duplicate">Duplicate · inactive</span>`
            : html`<span class="ep-badge">Active</span>`;

        return html`
            <div class="edit-placeholder ${isDuplicate ? 'is-duplicate' : ''}">
                <div class="ep-header">
                    <ha-icon class="ep-icon" icon="mdi:alert-outline"></ha-icon>
                    <span class="ep-title">Alert overlay</span>
                    ${badge}
                </div>
                <div class="ep-body">
                    ${isDuplicate
                        ? html`<p class="ep-warn">This card is suppressed. Only one alert overlay can be active per dashboard. Remove this card.</p>`
                        : html`
                            <p class="ep-info">Shows over the whole dashboard while an alert mode is raised.</p>
                            ${conditionKeys.length > 0 ? html`
                                <div class="ep-conditions">
                                    ${conditionKeys.map(k => html`<span class="ep-cond">${k}</span>`)}
                                </div>` : ''}
                        `}
                </div>
            </div>
        `;
    }

    static get styles() {
        return css`
            :host {
                display: contents;
            }
            :host([data-edit-mode]) {
                display: block;
            }
            .edit-placeholder {
                --ep-accent: var(--lcards-orange);
                box-sizing: border-box;
                width: 100%;
                min-height: 64px;
                border: var(--ha-border-width-md) dashed var(--ep-accent);
                border-radius: var(--ha-border-radius-md);
                padding: 10px 14px;
                background-color: color-mix(
                    in srgb,
                    var(--secondary-background-color) 50%,
                    color-mix(in srgb, var(--primary-background-color) 25%, transparent)
                );
                font-family: var(--lcars-font, 'Antonio'), sans-serif;
                color: var(--primary-text-color);
            }
            .is-duplicate {
                --ep-accent: var(--lcars-alert-red, var(--lcards-orange-dark));
            }
            .ep-header {
                display: flex;
                align-items: center;
                gap: var(--ha-space-2);
                margin-bottom: 6px;
            }
            .ep-icon {
                --mdc-icon-size: 1.2em;
                color: var(--ep-accent);
            }
            .ep-title {
                font-size: 0.85em;
                font-weight: 600;
                letter-spacing: 0.08em;
                text-transform: uppercase;
            }
            .ep-badge {
                margin-left: auto;
                font-size: 0.65em;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                padding: 2px 7px;
                border-radius: var(--ha-border-radius-sm);
                color: var(--ep-accent);
                border: var(--ha-border-width-sm) solid var(--ep-accent);
                background: color-mix(in srgb, var(--ep-accent) 20%, transparent);
            }
            .ep-body {
                font-size: 0.75em;
                line-height: 1.4;
                color: var(--secondary-text-color);
            }
            .ep-info, .ep-warn {
                margin: 0 0 6px;
            }
            .ep-warn {
                color: var(--ep-accent);
            }
            .ep-conditions {
                display: flex;
                flex-wrap: wrap;
                gap: var(--ha-space-1);
                margin-top: var(--ha-space-1);
            }
            .ep-cond {
                font-size: 0.9em;
                padding: 1px 6px;
                border-radius: var(--ha-border-radius-sm);
                border: var(--ha-border-width-sm) solid color-mix(in srgb, var(--ep-accent) 40%, transparent);
                background: color-mix(in srgb, var(--ep-accent) 15%, transparent);
                letter-spacing: 0.05em;
            }
        `;
    }

    // -------------------------------------------------------------------------
    // HA card API
    // -------------------------------------------------------------------------

    static async getConfigElement() {
        // Editors load on demand (HA awaits getConfigElement), keeping them out of
        // the bundle every dashboard loads.
        await import('../editor/cards/lcards-alert-overlay-editor.js');
        return document.createElement('lcards-alert-overlay-editor');
    }

    static getStubConfig() {
        return {
            type:         'custom:lcards-alert-overlay',
            dismiss_mode: 'dismiss',
            height:       '33%',
            width:        '50%',
            layers: {
                backdrop: { preset: 'blur', amount: '8px' },
            },
            position: 'center',
        };
    }

    static registerSchema() {
        window.lcards?.core?.configManager?.registerCardSchema(
            'alert-overlay',
            getAlertOverlaySchema(),
        );
    }
}

// NOTE: Card registration handled in src/lcards.js initializeCustomCard().then()
