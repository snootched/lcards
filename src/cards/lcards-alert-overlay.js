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
 * hook as SoundManager and ThemeManager — no new plumbing required.
 *
 * Only one instance may be active per dashboard; duplicate instances
 * suppress themselves and log a warning.
 */

import { LitElement, html, css } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { createCardElement, applyHassToCard, applyCardConfig } from '../utils/ha-card-factory.js';
import { HATemplateEvaluator } from '../core/templates/HATemplateEvaluator.js';
import { getAlertOverlaySchema } from './schemas/lcards-alert-overlay-schema.js';

// Import editor component so getConfigElement() works (bundled together)
import '../editor/cards/lcards-alert-overlay-editor.js';

// ─────────────────────────────────────────────────────────────────────────────
// Module-level singleton guard
//
// HA can reconnect elements without a guaranteed disconnect→connect ordering
// (e.g. when exiting dashboard edit mode).  A module-level variable provides
// a synchronous, race-free claim that the DOM-based approach cannot guarantee.
//
// Rules:
//   - The first instance to call connectedCallback claims ownership.
//   - If _activeOverlay is set to a DIFFERENT instance, the newcomer is suppressed.
//   - If _activeOverlay is set to THIS instance (reconnect), ownership is re-confirmed.
//   - disconnectedCallback releases ownership only when this instance owns it.
// ─────────────────────────────────────────────────────────────────────────────
let _activeOverlay = null;

// ─────────────────────────────────────────────────────────────────────────────
// Per-condition built-in defaults
// These provide the floor values; alert_button overrides are applied on top.
// ─────────────────────────────────────────────────────────────────────────────
const CONDITION_DEFAULTS = {
    red_alert:    { preset: 'condition_red',    alertText: 'ALERT', subText: 'CONDITION: RED' },
    yellow_alert: { preset: 'condition_yellow', alertText: 'ALERT', subText: 'CONDITION: YELLOW' },
    blue_alert:   { preset: 'condition_blue',   alertText: 'ALERT', subText: 'CONDITION: BLUE' },
    black_alert:  { preset: 'condition_black',  alertText: 'ALERT', subText: 'CONDITION: BLACK' },
    gray_alert:   { preset: 'condition_gray',   alertText: 'ALERT', subText: 'CONDITION: GRAY' },
};

const POSITION_MAP = {
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
        this._isSuppressed     = false;
        this._editMode         = false;
        this._editModePoller   = null;
        this._portalStyleEl    = null;
        this._dismissEl        = null;
        this._wrapperEl        = null;
        this._contentContainer = null;
        this._autoDismissTimer = null;
        // True only while *this overlay* is the entity that applied the current
        // SEM slots.  When false (alert inactive or trigger_effect owns the
        // slots) we must not call clearSlot — that would wipe effects we don't
        // own.  See _updatePortalStyles / _removePortal.
        this._ownsSemSlots = false;
    }

    // -------------------------------------------------------------------------
    // HASS setter — forward to mounted content card
    // -------------------------------------------------------------------------

    set hass(value) {
        this._hass = value;
        if (this._contentElement) {
            applyHassToCard(this._contentElement, value, 'alert-overlay-hass');
        }
        // Detect edit mode changes reactively via the hass setter — HA calls
        // this on every state update so it catches enter/exit of edit mode.
        const inEdit = this._isInEditMode();
        if (inEdit !== this._editMode) {
            this._editMode = inEdit;
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

        // ── Edit mode polling ─────────────────────────────────────────────────
        // HA adds ?edit=1 to the URL when entering edit mode via history.pushState,
        // which does not fire popstate/location-changed. Poll the URL so the
        // placeholder appears/disappears immediately without waiting for a
        // hass state update.
        this._editModePoller = setInterval(() => {
            const inEdit = this._isInEditMode();
            if (inEdit !== this._editMode) this._editMode = inEdit;
        }, 400);

        // ── Singleton guard (deferred) ────────────────────────────────────────
        // HA can call connectedCallback on a new instance BEFORE calling
        // disconnectedCallback on the old one (e.g. when exiting edit mode).
        // Defer the ownership check one microtask so that any in-flight
        // disconnectedCallback has a chance to clear _activeOverlay first.
        // We save a reference to `this` so the closure always targets the right
        // instance even if multiple elements queue microtasks simultaneously.
        const self = this;
        Promise.resolve().then(() => self._claimOwnership());
    }

    _claimOwnership() {
        if (_activeOverlay !== null && _activeOverlay !== this) {
            // Another live instance already owns the overlay.
            lcardsLog.warn(
                '[LCARdSAlertOverlay] Another instance is already active. ' +
                'Remove duplicate lcards-alert-overlay cards from your dashboard. ' +
                'This instance will be suppressed.'
            );
            this._isSuppressed = true;

            // Listen for the owner to release so we can retry.
            // One-shot listener — either we claim next time or suppress again.
            const onRelease = () => {
                window.removeEventListener('lcards-alert-overlay-released', onRelease);
                // Only retry if we are still connected to the DOM.
                if (this.isConnected) {
                    this._claimOwnership();
                }
            };
            window.addEventListener('lcards-alert-overlay-released', onRelease, { once: true });
            return;
        }

        // Claim ownership (covers both first-connect and reconnect cases)
        _activeOverlay     = this;
        this._isSuppressed = false;

        this._createPortal();
        this._subscribeToAlertMode();

        // Replay current mode in case alert was already active when we connected
        const currentMode =
            window.lcards?.core?.helperManager?.getHelperValue('alert_mode') ??
            this._hass?.states?.['input_select.lcards_alert_mode']?.state;

        if (currentMode) {
            this._handleAlertModeChange(currentMode);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        clearInterval(this._editModePoller);
        this._editModePoller = null;

        if (this._isSuppressed) {
            this._isSuppressed = false;
            return;
        }

        this._alertUnsubscribe?.();
        this._alertUnsubscribe = null;
        this._unmountContentCard();
        this._removePortal();

        // Release module-level ownership only if we hold it.
        // After releasing, fire a synthetic event so any suppressed sibling
        // instance that was created while we were still alive (race window)
        // can retry claiming ownership.
        this._clearAutoDismissTimer();

        if (_activeOverlay === this) {
            _activeOverlay = null;
            window.dispatchEvent(new CustomEvent('lcards-alert-overlay-released'));
        }
    }

    // -------------------------------------------------------------------------
    // HelperManager subscription
    // -------------------------------------------------------------------------

    _subscribeToAlertMode() {
        this._alertUnsubscribe?.();
        this._alertUnsubscribe = null;

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

    // -------------------------------------------------------------------------
    // Edit mode detection
    // -------------------------------------------------------------------------

    _isInEditMode() {
        const dashboardEl = this.closest?.('hui-root, ha-panel-lovelace') ??
            document.querySelector('hui-root, ha-panel-lovelace');
        if (/** @type {any} */ (dashboardEl)?.editMode) return true;
        if (this.closest?.('hui-card-picker, hui-card-preview')) return true;
        if (window.location.href.includes('edit=1')) return true;
        return false;
    }

    // -------------------------------------------------------------------------
    // Alert mode handling
    // -------------------------------------------------------------------------

    _handleAlertModeChange(newMode) {
        if (this._isSuppressed) return;

        if (this._isInEditMode()) {
            lcardsLog.debug('[LCARdSAlertOverlay] Edit mode active — overlay suppressed');
            return;
        }

        const isInactive = !newMode || newMode === 'green_alert' || newMode === 'default';

        if (isInactive) {
            this._clearAutoDismissTimer();
            this._isActive        = false;
            this._isDismissed     = false;
            this._unmountContentCard();
        } else {
            this._clearAutoDismissTimer();
            this._activeCondition = newMode;
            this._isDismissed     = false;
            this._isActive        = true;
            this._mountContentCard(newMode);
            this._startAutoDismissTimer(newMode);
        }
    }

    // -------------------------------------------------------------------------
    // Content card lifecycle
    // -------------------------------------------------------------------------

    async _mountContentCard(condition) {
        this._unmountContentCard();

        const cardConfig = this._buildCardConfig(condition);

        if (!cardConfig) {
            lcardsLog.warn(`[LCARdSAlertOverlay] No content config for condition: ${condition}`);
            return;
        }

        const el = await createCardElement(cardConfig.type, 'alert-overlay');
        if (!el) {
            lcardsLog.warn(`[LCARdSAlertOverlay] Failed to create card element for type: ${cardConfig.type}`);
            return;
        }

        // Guard: portal may have been removed during the async await above
        // (e.g. condition changed, overlay dismissed, or card disconnected).
        // The element was created but cannot be mounted — destroy it to avoid a leak.
        if (!this._contentContainer) {
            el.remove();
            lcardsLog.debug('[LCARdSAlertOverlay] Portal gone during card creation — element discarded');
            return;
        }

        // ── Attach to DOM BEFORE setConfig ────────────────────────────────────
        // LCARdS cards initialize their singletons and set _initialized = true
        // only after connectedCallback / firstUpdated. If setConfig is called
        // while the element is detached (as createCardElement's temp-div
        // upgrade strategy leaves it), CoreConfigManager processes correctly
        // but _rawUserComponentText may be stale and template processing may
        // run against incomplete singletons.
        //
        // Attaching first means connectedCallback fires, singletons are wired
        // up, and t setConfig call lands on a fully-initialised card.
        this._contentElement = el;

        if (this._contentContainer) {
            // Mark the element so the portal stylesheet can override its inline
            // aspect-ratio with !important (lcards-button re-applies it every render).
            el.setAttribute('data-lcards-overlay-content', '');
            this._contentContainer.appendChild(el);
        }

        // Apply HASS first (required before setConfig on some card types)
        if (this._hass) {
            applyHassToCard(el, this._hass, 'alert-overlay-mount');
        }

        // Now configure — card is in the real DOM, singletons available.
        // Pre-evaluate any Jinja2 templates in text content fields using the
        // overlay's own hass connection (more reliable than evaluating inside
        // the newly-mounted child card whose websocket path may not be settled).
        //
        // Why only Jinja2? JS ([[[...]]]) and token ({entity.state}) templates
        // are synchronous and do not depend on a settled websocket — lcards-button's
        // own template pipeline handles those safely after mount.  Jinja2 requires
        // a websocket round-trip, which can race against a fresh card element's
        // connection setup, so we resolve it here via the overlay's already-stable
        // HASS connection before handing the config to the child card.
        const resolvedConfig = await this._resolveTextTemplates(cardConfig);
        await applyCardConfig(el, resolvedConfig, 'alert-overlay');

        this.requestUpdate();
    }

    /**
     * Walk all text fields in a card config, evaluate any Jinja2 content
     * strings ({{ ... }} / {% ... %}) using this overlay's settled HASS
     * websocket, and return an updated config copy.
     *
     * JS ([[[...]]]) and token ({entity.state}) templates are intentionally
     * NOT resolved here — they are synchronous and handled by lcards-button's
     * own template pipeline after the card is mounted.
     *
     * @param {Object} cardConfig
     * @returns {Promise<Object>}
     */
    async _resolveTextTemplates(cardConfig) {
        if (!this._hass || !cardConfig?.text) return cardConfig;

        const evaluator = new HATemplateEvaluator({ hass: this._hass });
        const resolvedText = {};

        for (const [fieldId, fieldCfg] of Object.entries(cardConfig.text)) {
            const content = fieldCfg?.content;
            if (typeof content === 'string' &&
                (content.includes('{{') || content.includes('{%'))) {
                try {
                    resolvedText[fieldId] = { ...fieldCfg, content: await evaluator.evaluate(content) };
                    lcardsLog.debug(`[LCARdSAlertOverlay] Resolved Jinja2 in '${fieldId}'`);
                } catch (e) {
                    lcardsLog.warn(`[LCARdSAlertOverlay] Jinja2 eval failed for '${fieldId}':`, e);
                    resolvedText[fieldId] = fieldCfg;
                }
            } else {
                resolvedText[fieldId] = fieldCfg;
            }
        }

        return { ...cardConfig, text: resolvedText };
    }

    _unmountContentCard() {
        if (this._contentElement) {
            this._contentElement.remove();
            this._contentElement = null;
        }
    }

    // -------------------------------------------------------------------------
    // Card config builder
    //
    // Three-tier resolution for each condition:
    //   1. conditions.<key>.content   — full custom HA card (user supplies everything)
    //   2. conditions.<key>.alert_button — patch specific fields on the default button
    //   3. Built-in default           — preset + hardcoded text
    //
    // The alert_button tier builds the config EXPLICITLY here rather than relying
    // on lcards-button's internal component-preset text injection, which runs
    // asynchronously and can race with / overwrite user-supplied text values.
    // -------------------------------------------------------------------------

    _buildCardConfig(condition) {
        const condCfg = this.config?.conditions?.[condition] ?? {};

        // Tier 1: full custom card
        if (condCfg.content) {
            return condCfg.content;
        }

        const def = CONDITION_DEFAULTS[condition];
        if (!def) return null;

        const ab = condCfg.alert_button ?? {};

        // Tier 2 / 3: build explicit button config.
        // Text values are resolved HERE so the button receives final strings
        // directly in its text config — bypassing any post-setConfig injection
        // from the component preset system that could overwrite them.
        //
        // Build text dynamically: start with built-in defaults for the two
        // standard fields, then overlay ALL keys from alert_button.text so
        // any additional text field supported by the button component is
        // forwarded rather than silently dropped.
        const defaultText = {
            alert_text: { content: def.alertText },
            sub_text:   { content: def.subText   },
        };
        const overrideText = ab.text ?? {};
        // Merge: for the two standard keys use the override's .content value if
        // present; for any other keys pass the override field object through as-is.
        const mergedText = { ...defaultText };
        for (const [fieldId, fieldCfg] of Object.entries(overrideText)) {
            if (fieldId in mergedText && fieldCfg?.content !== undefined) {
                mergedText[fieldId] = { ...mergedText[fieldId], content: fieldCfg.content };
            } else {
                mergedText[fieldId] = fieldCfg;
            }
        }
        const card = {
            type:      'custom:lcards-button',
            component: 'alert',
            preset:    def.preset,
            text:      mergedText,
        };

        // Forward component-level color overrides if present (e.g. alert.color.shape)
        if (ab.alert) {
            card.alert = ab.alert;
        }

        return card;
    }

    // -------------------------------------------------------------------------
    // Portal management
    // -------------------------------------------------------------------------

    _createPortal() {
        if (this._wrapperEl) return;

        const sem = window.lcards?.core?.screenEffectManager;
        if (!sem) {
            lcardsLog.error('[LCARdSAlertOverlay] ScreenEffectManager unavailable — portal creation aborted');
            return;
        }

        // Claim the SEM portal; ensures the portal div is visible when overlay is active.
        sem.setOverlayOccupied(true);
        const portal = sem.portal;

        // Dismiss click-catcher — sits above SE effect slots (z:10), transparent,
        // receives backdrop clicks so the content wrapper (z:11, pointerEvents:none)
        // does not block them.
        this._dismissEl = document.createElement('div');
        Object.assign(this._dismissEl.style, {
            position:      'absolute',
            inset:         '0',
            zIndex:        '10',
            pointerEvents: 'none',   // toggled to 'auto' when dismiss is allowed
            cursor:        'pointer',
        });
        this._dismissEl.addEventListener('click', () => this._handleDismiss());

        // Content wrapper — flex positioner, above dismiss layer.
        this._wrapperEl = document.createElement('div');
        Object.assign(this._wrapperEl.style, {
            position:      'absolute',
            inset:         '0',
            zIndex:        '11',
            display:       'flex',
            pointerEvents: 'none',
        });

        this._contentContainer = document.createElement('div');
        // Display as flex so the mounted card child stretches to fill the explicit
        // width/height set on this container.  Without this, a block-level child
        // with aspect-ratio (set by lcards-button) ignores the container height and
        // computes its own height from the aspect-ratio × width, causing overflow.
        Object.assign(this._contentContainer.style, {
            pointerEvents: 'auto',
            display:       'flex',
            alignItems:    'stretch',
        });

        // Inject a stylesheet rule that beats any inline `aspect-ratio` the
        // mounted card sets on its own host element (lcards-button does this
        // on every render after resolving the SVG viewBox).  Using !important
        // from a <style> tag beats inline styles without JS intervention on
        // every render cycle.  Cards target via data-lcards-overlay-content.
        this._portalStyleEl = document.createElement('style');
        this._portalStyleEl.textContent = [
            '[data-lcards-overlay-content] {',
            '  aspect-ratio: unset !important;',
            '  width:        100%   !important;',
            '  height:       100%   !important;',
            '  min-height:   0      !important;',
            '}',
        ].join('\n');
        document.head.appendChild(this._portalStyleEl);

        this._wrapperEl.appendChild(this._contentContainer);
        portal.appendChild(this._dismissEl);
        portal.appendChild(this._wrapperEl);

        lcardsLog.debug('[LCARdSAlertOverlay] Portal attached to ScreenEffectManager');
    }

    _removePortal() {
        const sem = window.lcards?.core?.screenEffectManager;
        if (sem && this._ownsSemSlots) {
            sem.clearSlot('backdrop');
            sem.clearSlot('color');
            sem.clearSlot('canvas');
            sem.setOverlayOccupied(false);
            this._ownsSemSlots = false;
        }
        this._dismissEl?.remove();
        this._wrapperEl?.remove();
        this._portalStyleEl?.remove();
        this._dismissEl        = null;
        this._wrapperEl        = null;
        this._contentContainer = null;
        this._portalStyleEl    = null;
        lcardsLog.debug('[LCARdSAlertOverlay] Portal detached from ScreenEffectManager');
    }

    _updatePortalStyles() {
        if (!this._wrapperEl) return;

        const sem     = window.lcards?.core?.screenEffectManager;
        const visible = this._isActive && !this._isDismissed && !this._isInEditMode();

        if (!visible) {
            if (sem && this._ownsSemSlots) {
                // Only clear slots we applied — never touch slots set by
                // trigger_effect or other external callers.
                sem.clearSlot('backdrop');
                sem.clearSlot('color');
                sem.clearSlot('canvas');
                sem.setOverlayOccupied(false);
                this._ownsSemSlots = false;
            }
            this._dismissEl.style.display = 'none';
            this._wrapperEl.style.display  = 'none';
            return;
        }

        sem?.setOverlayOccupied(true);
        this._dismissEl.style.display = '';
        this._wrapperEl.style.display  = 'flex';

        // Apply each slot layer independently.  Clear all three slots first so
        // that disabling or switching a single-slot preset never leaves stale
        // effects from a previous activation on the other slots.
        if (sem) {
            const layers = this._resolveBackdropLayers();
            sem.clearSlot('backdrop');
            sem.clearSlot('color');
            sem.clearSlot('canvas');
            for (const [slot, layerCfg] of Object.entries(layers)) {
                if (layerCfg?.preset) {
                    const { preset, ...params } = layerCfg;
                    sem.applySlot(slot, preset, params);
                }
            }
            // We are now the owner of whatever slots we've applied.
            this._ownsSemSlots = true;
        }

        // Backdrop clicks always allowed to dismiss (pointer-events: auto).
        this._dismissEl.style.pointerEvents = 'auto';

        const size = this._getEffectiveSize();
        const pos  = this._getEffectivePosition();

        this._wrapperEl.style.alignItems     = pos.alignItems;
        this._wrapperEl.style.justifyContent = pos.justifyContent;

        this._contentContainer.style.width  = size.width;
        this._contentContainer.style.height = size.height;
    }

    // -------------------------------------------------------------------------
    // Style / layout helpers
    // -------------------------------------------------------------------------

    /**
     * Resolve the final per-slot layer configuration by merging global `layers`
     * with per-condition overrides.  Each slot in the returned object is either
     * `{ preset, ...params }` or `null` (slot explicitly disabled).
     *
     * Priority: per-condition layer slot > global layer slot > legacy migration > default.
     *
     * @returns {{ backdrop: Object|null, color: Object|null, canvas: Object|null }}
     */
    _resolveBackdropLayers() {
        const globalLayers  = this._getConfiguredLayers(this.config ?? {});
        const condLayersRaw = this.config?.conditions?.[this._activeCondition]?.layers ?? null;
        if (!condLayersRaw) return globalLayers;

        // Per-condition: only override slots explicitly present (key exists).
        return {
            backdrop: 'backdrop' in condLayersRaw ? condLayersRaw.backdrop : globalLayers.backdrop,
            color:    'color'    in condLayersRaw ? condLayersRaw.color    : globalLayers.color,
            canvas:   'canvas'   in condLayersRaw ? condLayersRaw.canvas   : globalLayers.canvas,
        };
    }

    /**
     * Extract { backdrop, color, canvas } slot configs from a config object,
     * migrating legacy schemas automatically.
     * @private
     */
    _getConfiguredLayers(cfg) {
        // Current schema: layers key.
        if (cfg.layers) {
            return {
                backdrop: cfg.layers.backdrop ?? null,
                color:    cfg.layers.color    ?? null,
                canvas:   cfg.layers.canvas   ?? null,
            };
        }

        // Legacy schema: backdrop.blur / opacity / color.
        if (cfg.backdrop) {
            return this._promoteLegacyBackdrop(cfg.backdrop);
        }

        // Default: blur-only, no color or canvas overlay.
        return { backdrop: { preset: 'blur', amount: '8px' }, color: null, canvas: null };
    }

    /**
     * Promote the legacy `backdrop.{blur, opacity, color}` object to per-slot layers.
     * Opacity is folded into the color alpha to preserve the visual result.
     * @private
     */
    _promoteLegacyBackdrop(backdrop) {
        const result = { backdrop: null, color: null, canvas: null };
        if (backdrop.blur) {
            result.backdrop = { preset: 'blur', amount: backdrop.blur };
        }
        if (backdrop.color || backdrop.opacity !== undefined) {
            const opacity = typeof backdrop.opacity === 'number' ? backdrop.opacity : 0.6;
            const color   = backdrop.color ?? 'rgba(0,0,0,0.5)';
            result.color  = { preset: 'color-tint', color: this._promoteColorWithOpacity(color, opacity) };
        }
        return result;
    }

    /**
     * Fold a separate opacity multiplier into the alpha channel of a CSS rgba() colour.
     * Used when promoting old `backdrop.color` + `backdrop.opacity` values.
     *
     * @param {string} color   - CSS colour string, ideally rgba().
     * @param {number} opacity - Multiplier (0–1).
     * @returns {string}
     * @private
     */
    _promoteColorWithOpacity(color, opacity) {
        const m = color.match(
            /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/
        );
        if (m) {
            const a = parseFloat(m[4] ?? '1') * opacity;
            return `rgba(${m[1]},${m[2]},${m[3]},${Math.min(1, a).toFixed(2)})`;
        }
        return color;
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
        return POSITION_MAP[position] ?? POSITION_MAP['center'];
    }

    // -------------------------------------------------------------------------
    // Dismiss handling
    // -------------------------------------------------------------------------

    _handleDismiss() {
        this._clearAutoDismissTimer();
        this._isDismissed = true;
        this._isActive    = false;
        this._unmountContentCard();

        if (this.config?.dismiss_mode === 'reset' || this.config?.dismiss_mode === 'auto-reset') {
            this._hass?.callService('input_select', 'select_option', {
                entity_id: 'input_select.lcards_alert_mode',
                option:    'green_alert',
            });
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

    updated(changedProps) {
        super.updated?.(changedProps);
        // Toggle host attribute so CSS can switch display: contents → block
        if (this._editMode) {
            this.setAttribute('data-edit-mode', '');
        } else {
            this.removeAttribute('data-edit-mode');
        }
        this._updatePortalStyles();
    }

    // -------------------------------------------------------------------------
    // Render
    // -------------------------------------------------------------------------

    render() {
        // Outside edit mode this element is invisible — the visible overlay
        // lives in a portal on document.body.
        if (!this._editMode) return html``;

        const conditions = this.config?.conditions ?? {};
        const conditionKeys = Object.keys(conditions);
        const isDuplicate = this._isSuppressed;

        return html`
            <div class="edit-placeholder ${isDuplicate ? 'is-duplicate' : ''}">
                <div class="ep-header">
                    <span class="ep-icon">&#9888;</span>
                    <span class="ep-title">Alert Overlay</span>
                    ${isDuplicate ? html`<span class="ep-badge">DUPLICATE — INACTIVE</span>` : html`<span class="ep-badge ep-badge--active">ACTIVE</span>`}
                </div>
                <div class="ep-body">
                    ${isDuplicate
                        ? html`<p class="ep-warn">This card is suppressed. Only one alert overlay can be active per dashboard. Remove this card.</p>`
                        : html`
                            <p class="ep-info">Overlay is active. It will appear over the full dashboard when an alert mode is triggered.</p>
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
                box-sizing: border-box;
                width: 100%;
                min-height: 64px;
                border: 2px dashed var(--lcards-orange, #ff7700);
                border-radius: 8px;
                padding: 10px 14px;
                background: rgba(0,0,0,0.45);
                font-family: Antonio, sans-serif;
                color: var(--lcards-moonlight, #dfe1e8);
            }
            .is-duplicate {
                border-color: var(--lcars-alert-red);
                background: rgba(80,0,0,0.45);
            }
            .ep-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 6px;
            }
            .ep-icon {
                font-size: 1.1em;
                color: var(--lcards-orange, #ff7700);
                line-height: 1;
            }
            .is-duplicate .ep-icon {
                color: var(--lcars-alert-red);
            }
            .ep-title {
                font-size: 0.85em;
                font-weight: 600;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                opacity: 0.9;
            }
            .ep-badge {
                margin-left: auto;
                font-size: 0.65em;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                padding: 2px 7px;
                border-radius: 4px;
                background: rgba(255,68,68,0.25);
                color: var(--lcars-alert-red);
                border: 1px solid var(--lcars-alert-red);
            }
            .ep-badge--active {
                background: rgba(255,119,0,0.2);
                color: var(--lcards-orange, #ff7700);
                border-color: var(--lcards-orange, #ff7700);
            }
            .ep-body {
                font-size: 0.75em;
                opacity: 0.75;
                line-height: 1.4;
            }
            .ep-info, .ep-warn {
                margin: 0 0 6px;
            }
            .ep-warn {
                color: var(--lcars-alert-red);
                opacity: 1;
            }
            .ep-conditions {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 4px;
            }
            .ep-cond {
                font-size: 0.9em;
                padding: 1px 6px;
                border-radius: 3px;
                background: rgba(255,119,0,0.15);
                border: 1px solid rgba(255,119,0,0.4);
                letter-spacing: 0.05em;
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
