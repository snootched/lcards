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

// Import editor component so getConfigElement() works (bundled together)
import '../editor/cards/lcards-alert-overlay-editor.js';

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
        // Portal DOM elements (appended to document.body to escape any CSS filter
        // stacking context applied to home-assistant-main by paletteInjector).
        this._portalEl         = null;
        this._blurEl           = null;
        this._tintEl           = null;
        this._wrapperEl        = null;
        this._contentContainer = null;
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

        // Create the portal element on document.body so the overlay is never a
        // descendant of home-assistant-main.  This is required because
        // paletteInjector.setAlertMode() temporarily applies `filter: blur()` to
        // that element, which creates a new CSS stacking context that traps all
        // position:fixed children — making them invisible behind the filter layer.
        this._createPortal();

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
        this._removePortal();
    }

    // -------------------------------------------------------------------------
    // Edit mode detection
    // -------------------------------------------------------------------------

    /**
     * Returns true when the dashboard is currently in edit mode so the overlay
     * can suppress itself and avoid stacking on top of the card editor UI.
     * Uses the same three-heuristic approach as LCARdSNativeCard._detectPreviewMode().
     */
    _isInEditMode() {
        // 1. Dashboard element property (most reliable)
        const dashboardEl = this.closest?.('hui-root, ha-panel-lovelace') ??
            document.querySelector('hui-root, ha-panel-lovelace');
        if (dashboardEl?.editMode) return true;

        // 2. Inside the card picker / preview (editor context)
        if (this.closest?.('hui-card-picker, hui-card-preview')) return true;

        // 3. URL flag
        if (window.location.href.includes('edit=1')) return true;

        return false;
    }

    // -------------------------------------------------------------------------
    // Alert mode handling
    // -------------------------------------------------------------------------

    _handleAlertModeChange(newMode) {
        // Never show the overlay while the dashboard is being edited — multiple
        // component instances would all activate, stacking overlays on top of the
        // card editor and making it impossible to interact with.
        if (this._isInEditMode()) {
            lcardsLog.debug('[LCARdSAlertOverlay] Dashboard in edit mode — suppressing overlay');
            return;
        }

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

        // Attach to portal content container (on document.body, outside home-assistant-main)
        if (this._contentContainer) {
            this._contentContainer.appendChild(el);
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
    // Portal management
    // -------------------------------------------------------------------------

    /**
     * Create the overlay DOM structure directly on document.body.
     * This ensures the overlay is never a descendant of home-assistant-main so
     * it is unaffected by any CSS filter stacking context applied to that element.
     */
    _createPortal() {
        if (this._portalEl) return;

        // Root container
        this._portalEl = document.createElement('div');
        this._portalEl.setAttribute('data-lcards-alert-portal', '');
        Object.assign(this._portalEl.style, {
            position: 'fixed',
            inset:    '0',
            zIndex:   '9000',
            display:  'none',
        });

        // Layer 1: backdrop-filter only — no opacity so blur runs at full strength.
        // backdrop-filter creates its own stacking context, so explicit z-indexes are
        // required on all three siblings to guarantee paint order.
        this._blurEl = document.createElement('div');
        Object.assign(this._blurEl.style, { position: 'absolute', inset: '0', zIndex: '1' });

        // Layer 2: tint — background colour + opacity, no filter
        this._tintEl = document.createElement('div');
        Object.assign(this._tintEl.style, {
            position: 'absolute', inset: '0', zIndex: '2', cursor: 'pointer',
        });
        this._tintEl.addEventListener('click', () => this._handleDismiss());

        // Content wrapper (flex container for positioning) — z-index:3 ensures it always
        // paints above the tint even when backdrop-filter disrupts implicit DOM ordering.
        this._wrapperEl = document.createElement('div');
        Object.assign(this._wrapperEl.style, {
            position:      'absolute',
            inset:         '0',
            zIndex:        '3',
            display:       'flex',
            pointerEvents: 'none',
        });

        // Content card slot
        this._contentContainer = document.createElement('div');
        this._contentContainer.style.pointerEvents = 'auto';

        this._wrapperEl.appendChild(this._contentContainer);
        this._portalEl.appendChild(this._blurEl);
        this._portalEl.appendChild(this._tintEl);
        this._portalEl.appendChild(this._wrapperEl);
        document.body.appendChild(this._portalEl);

        lcardsLog.debug('[LCARdSAlertOverlay] Portal container created on document.body');
    }

    _removePortal() {
        this._portalEl?.remove();
        this._portalEl         = null;
        this._blurEl           = null;
        this._tintEl           = null;
        this._wrapperEl        = null;
        this._contentContainer = null;
        lcardsLog.debug('[LCARdSAlertOverlay] Portal container removed');
    }

    /**
     * Sync the portal element's visibility and inline styles with current state.
     * Called from updated() so it runs after every reactive-property change.
     */
    _updatePortalStyles() {
        if (!this._portalEl) return;

        const visible = this._isActive && !this._isDismissed && !this._isInEditMode();
        this._portalEl.style.display = visible ? '' : 'none';
        if (!visible) return;

        const backdrop = this._getEffectiveBackdrop();
        const size     = this._getEffectiveSize();
        const pos      = this._getEffectivePosition();

        // Blur layer
        this._blurEl.style.backdropFilter       = `blur(${backdrop.blur})`;
        this._blurEl.style.webkitBackdropFilter = `blur(${backdrop.blur})`;

        // Tint layer
        this._tintEl.style.background = backdrop.color;
        this._tintEl.style.opacity    = String(backdrop.opacity);

        // Content wrapper layout
        this._wrapperEl.style.alignItems     = pos.alignItems;
        this._wrapperEl.style.justifyContent = pos.justifyContent;

        // Content sizing
        this._contentContainer.style.width  = size.width;
        this._contentContainer.style.height = size.height;
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
            preset:    def.preset,
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
    // Lifecycle — sync portal after every reactive-state change
    // -------------------------------------------------------------------------

    updated(changedProps) {
        super.updated?.(changedProps);
        this._updatePortalStyles();
    }

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    render() {
        // The visible overlay lives in a portal on document.body (managed
        // imperatively by _createPortal / _updatePortalStyles) so that it is
        // never subject to the CSS filter stacking context that paletteInjector
        // temporarily applies to home-assistant-main during palette transitions.
        // This element itself has no visible DOM.
        return html``;
    }

    // -------------------------------------------------------------------------
    // Styles
    // -------------------------------------------------------------------------

    static get styles() {
        return css`
            :host {
                display: contents;
            }
        `;
    }

    // -------------------------------------------------------------------------
    // HA card API
    // -------------------------------------------------------------------------

    static getConfigElement() {
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
            'alert-overlay',
            getAlertOverlaySchema(),
        );
    }
}

// NOTE: Card registration handled in src/lcards.js initializeCustomCard().then()
