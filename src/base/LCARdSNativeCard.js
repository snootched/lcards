/**
 * @fileoverview LCARdS Native Card Base Class
 *
 * Native LitElement base implementation for all LCARdS cards.
 * Provides Home Assistant card interface compliance, shadow DOM management,
 * GUID-based identity, preview-mode detection, font loading, and the
 * protected lifecycle hook pattern consumed by {@link LCARdSCard}.
 */

import { LitElement, html, css, unsafeCSS } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';

/**
 * Normalise a config height/width value to a valid CSS length string.
 * A bare number or numeric string is treated as pixels.
 * A string that already contains a non-numeric character (e.g. "400px", "50vh")
 * is returned as-is. Falsy values return '' which clears any inline style.
 * @param {number|string} val
 * @returns {string}
 */
function _toCssLength(val) {
    if (val === null || val === undefined || val === '') return '';
    const n = Number(val);
    return Number.isFinite(n) ? `${n}px` : String(val);
}

/**
 * Return the pixel integer from a config height/width value, or null if the
 * value uses relative/viewport units that cannot be converted to px at
 * declaration time (vh, vw, %, em, rem, vmin, vmax, etc.).
 *
 * Used by getCardSize() so that only absolute pixel values contribute to
 * HA's stack-slot row calculation. Relative units are valid CSS and work
 * visually, but cannot be meaningfully mapped to 50px grid rows.
 * @param {number|string} val
 * @returns {number|null}
 */
function _toPxInt(val) {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    if (Number.isFinite(n)) return n;                          // bare integer
    const str = String(val).trim();
    if (/^[\d.]+px$/i.test(str)) return parseFloat(str);      // "400px"
    return null;   // em, rem, vh, vw, %, vmin, vmax, etc. — not convertible
}

/**
 * Base class for all LCARdS native cards.
 *
 * @extends LitElement
 *
 * Features:
 * - Native LitElement architecture with shadow DOM
 * - Home Assistant card interface compliance (`setConfig`, `hass` setter, `getCardSize`)
 * - Per-instance GUID for template and rules targeting
 * - Preview-mode detection (suppresses heavy work in the editor picker)
 * - Lazy mount resolution and font loading
 * - Error boundary: config errors render a visible error state instead of throwing
 */
export class LCARdSNativeCard extends LitElement {

    static get properties() {
        return {
            // NOTE: hass is NOT declared here because we have custom setter/getter
            // If you declare a property AND have a custom setter, Lit's reactive system conflicts
            config: { type: Object },
            _isPreviewMode: { type: Boolean, state: true },
            _mountResolved: { type: Boolean, state: true },
            _cardGuid: { type: String, state: true },
            _errorState: { type: Object, state: true }
        };
    }

    /** @returns {import('lit').CSSResultGroup} */
    static get styles() {
        return css`
            :host {
                display: block;
                position: relative;
                /* Allow CSS grid/flexbox to shrink below the SVG's intrinsic pixel size.
                 * Without these, min-width/min-height default to 'auto' which resolves to
                 * the SVG's natural content dimensions, preventing fr-column shrinkage. */
                min-width: 0;
                min-height: 0;
            }

            .lcards-card {
                width: 100%;
                height: 100%;
                position: relative;
                font-family: 'Antonio', 'Roboto', sans-serif;
            }

            /* Sizing reference div — has no content and no intrinsic size.
             * The ResizeObserver watches this element instead of the host so that
             * the SVG's pixel width/height attributes never feed back into the
             * measured container size, breaking the resize oscillation loop. */
            .lcards-size-ref {
                position: absolute;
                inset: 0;
                pointer-events: none;
                visibility: hidden;
            }

            .lcards-error {
                background: #ff4444;
                color: white;
                padding: 16px;
                border-radius: 8px;
                font-family: monospace;
                white-space: pre-wrap;
            }

            .lcards-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 64px;
                color: var(--primary-text-color, var(--lcards-moonlight, #d3d3d3));
            }

            /* LCARS font loading */
            @font-face {
                font-family: 'lcards_jeffries';
                src: url('/lcards/fonts/jeffries.woff2') format('woff2'),
                     url('/lcards/fonts/jeffries.woff') format('woff');
            }

            @font-face {
                font-family: 'lcards_microgramma';
                src: url('/lcards/fonts/microgramma.woff2') format('woff2'),
                     url('/lcards/fonts/microgramma.woff') format('woff');
            }
        `;
    }

    constructor() {
        super();
        this.hass = null;
        this.config = {};
        /** @type {boolean|'picker'|'editor'} */
        this._isPreviewMode = false;
        this._mountResolved = false;
        this._cardGuid = this._generateGuid();
        this._errorState = null;
        /** @type {string[]} */
        this._trackedEntities = [];

        lcardsLog.debug(`[LCARdSNativeCard] Created card with GUID: ${this._cardGuid}`);
    }

    // ============================================================================
    // Home Assistant Card Interface
    // ============================================================================

    /**
     * Set the card configuration
     * @param {Object} config - Card configuration
     */
    setConfig(config) {
        if (!config) {
            throw new Error('Invalid configuration');
        }

        try {
            // Deep clone config to prevent mutations from affecting HA's copy
            this.config = JSON.parse(JSON.stringify(config));
            this._errorState = null;

            // Detect preview mode
            this._isPreviewMode = this._detectPreviewMode();

            // Validate configuration
            this._validateConfig(config);

            lcardsLog.debug(`[LCARdSNativeCard] Config set for ${this._cardGuid}`, config);

            // Notify subclasses
            this._onConfigSet(config);

        } catch (error) {
            this._errorState = {
                message: `Configuration Error: ${error.message}`,
                stack: error.stack
            };
            lcardsLog.error(`[LCARdSNativeCard] Config error in ${this._cardGuid}:`, error);
        }
    }

    /**
     * Set Home Assistant object
     * @param {Object} hass - Home Assistant object
     */
    set hass(hass) {
        const oldHass = this._hass;
        this._hass = hass;

        // Log every hass update to see if it's even being called
        lcardsLog.trace(`[LCARdSNativeCard] HASS setter called for ${this._cardGuid}`, {
            hassChanged: oldHass !== hass,
            sameObject: oldHass === hass
        });

        if (hass && oldHass !== hass) {
            lcardsLog.debug(`[LCARdSNativeCard] HASS object changed for ${this._cardGuid} - calling _onHassChanged`);

            // Propagate HASS to HelperManager (ensures auto-switch works on any page with cards)
            if (window.lcards?.core?.helperManager) {
                window.lcards.core.helperManager.ingestHass(hass);
            }

            // Determine if this HASS change is relevant to this card
            const shouldUpdate = this._shouldUpdateOnHassChange(hass, oldHass);

            // Always call _onHassChanged (for monitoring, core updates, etc.)
            this._onHassChanged(hass, oldHass);

            // Only trigger re-render if relevant entities changed
            if (shouldUpdate) {
                lcardsLog.trace(`[LCARdSNativeCard] Requesting re-render for ${this._cardGuid} due to relevant entity changes`);
                this.requestUpdate();
            } else {
                lcardsLog.trace(`[LCARdSNativeCard] Skipping re-render for ${this._cardGuid} - no relevant entity changes`);
            }
        } else if (hass && oldHass === hass) {
            // This is normal - HA often mutates the HASS object in place
            lcardsLog.trace(`[LCARdSNativeCard] HASS object mutated in place for ${this._cardGuid}`);
        }
    }

    get hass() {
        return this._hass;
    }

    /**
     * Get card size for layout
     * @returns {number} Card height in rows
     */
    getCardSize() {
        return this._getCardSize();
    }

    /**
     * Get layout options for the card
     * @returns {Object} Layout options
     */
    getGridOptions() {
        return this._getGridOptions();
    }

    // ============================================================================
    // LitElement Lifecycle
    // ============================================================================

    connectedCallback() {
        super.connectedCallback();

        lcardsLog.debug(`[LCARdSNativeCard] Connected: ${this._cardGuid}`);

        // Re-detect whether we're inside the card editor dialog now that the card
        // is in the DOM. setConfig() runs before connectedCallback() (HA inserts the
        // element after configuration), so shadow-DOM-piercing ancestor checks always
        // return false at setConfig() time. We only need to catch the editor dialog
        // case here — dashboard edit mode and card-picker detection are handled by
        // _detectPreviewMode() (called from setConfig()) once the card is placed in
        // its final context, and by each card's _handleFirstUpdate() override.
        // NOTE: intentionally does NOT call the full _detectPreviewMode() to avoid
        // falsely setting _isPreviewMode=true for dashboard edit mode, which would
        // break cards that use _isPreviewMode to decide whether to render a placeholder.
        if (this._checkForAncestor(['hui-dialog-edit-card'])) {
            lcardsLog.debug(`[LCARdSNativeCard] Preview detection: card editor dialog detected (connectedCallback)`);
            this._isPreviewMode = true;
        }

        // Load fonts if needed
        this._loadFonts();

        // Resolve mount element
        this._resolveMountElement();

        // Notify subclasses
        this._onConnected();
    }

    disconnectedCallback() {
        super.disconnectedCallback();

        lcardsLog.debug(`[LCARdSNativeCard] Disconnected: ${this._cardGuid}`);

        // Cleanup
        this._cleanup();

        // Notify subclasses
        this._onDisconnected();
    }

    firstUpdated(changedProperties) {
        super.firstUpdated(changedProperties);

        lcardsLog.debug(`[LCARdSNativeCard] First updated: ${this._cardGuid}`);

        // Mark mount as resolved
        this._mountResolved = true;

        // Notify subclasses
        this._onFirstUpdated(changedProperties);
    }

    updated(changedProperties) {
        super.updated(changedProperties);

        // Re-apply margin-height compensation after every Lit render cycle.
        // This handles the case where setConfig() (or any other code path) cleared
        // `this.style.height` after the auto-sizing rAF had already installed
        // `calc(100% - Npx)`.  `_parentMarginV` is the cached vertical-margin
        // total computed by _setupAutoSizing; if it's > 0 and the inline height
        // is gone, restore it so the card doesn't overflow its grid row.
        if (this._parentMarginV > 0 && !this.style.height) {
            this.style.height = `calc(100% - ${this._parentMarginV}px)`;
        }

        if (changedProperties.has('config') || changedProperties.has('hass')) {
            this._onUpdated(changedProperties);
        }
    }

    render() {
        if (this._errorState) {
            return html`
                <div class="lcards-error">
                    <strong>LCARdS Error</strong><br>
                    ${this._errorState.message}
                </div>
            `;
        }

        if (!this._mountResolved) {
            return html`
                <div class="lcards-loading">
                    Loading LCARdS...
                </div>
            `;
        }

        return html`
            <div class="lcards-card">
                ${this._renderCard()}
            </div>
            <!-- Sizing reference: no content, sized purely by CSS/grid.
                 ResizeObserver watches this div to avoid SVG intrinsic-size feedback loops. -->
            <div class="lcards-size-ref" aria-hidden="true"></div>
        `;
    }

    // ============================================================================
    // Protected Methods for Subclasses
    // ============================================================================

    /**
     * Determine if the card should re-render based on HASS changes
     * Checks if the card's entity or any tracked entities changed
     * Subclasses may override to add additional entity dependency checks.
     * @param {Object} newHass - New HASS object
     * @param {Object} oldHass - Previous HASS object
     * @returns {boolean} True if re-render needed
     * @protected
     */
    _shouldUpdateOnHassChange(newHass, oldHass) {
        // First HASS update - always render
        if (!oldHass) {
            return true;
        }

        // Check if card's configured entity changed
        if (this.config?.entity) {
            const oldState = oldHass?.states?.[this.config.entity];
            const newState = newHass?.states?.[this.config.entity];
            if (oldState !== newState) {
                return true;
            }
        }

        // Check if any tracked entities changed (from templates)
        if (this._trackedEntities && this._trackedEntities.length > 0) {
            const hasTrackedChanges = this._trackedEntities.some(entityId => {
                const oldState = oldHass?.states?.[entityId];
                const newState = newHass?.states?.[entityId];
                return oldState !== newState;
            });
            if (hasTrackedChanges) {
                return true;
            }
        }

        // No relevant changes - skip re-render
        return false;
    }

    /**
     * Called when config is set - override in subclasses
     * @protected
     */
    _onConfigSet(config) {
        // Apply explicit size overrides to the host element so the card
        // constrains itself in any container — stacks, overlays, masonry, etc.
        // Accepts a bare number (treated as px) or a CSS string with units.
        // Clears the inline style when the property is absent so the host
        // reverts to 100% × 100% of its grid/stack cell as normal.
        //
        // Important: if LCARdSCard._setupAutoSizing() has already applied a
        // margin-compensation height (e.g. `calc(100% - 13px)` to account for
        // layout-card card_margin), we must NOT clobber it here.  A config-height
        // override takes absolute priority; absent that, preserve any live
        // margin compensation that the auto-sizing rAF already installed.
        const explicitH = _toCssLength(config.height ?? '');
        if (explicitH) {
            // Explicit config height wins; also clear any margin compensation state
            // so auto-sizing won't re-apply calc() on the next reconnect.
            this.style.height = explicitH;
            this._parentMarginV = undefined;
        } else if (this._parentMarginV > 0) {
            // Re-apply active margin compensation — setConfig clears inline styles
            // by default, but we must preserve/restore the layout-card correction.
            this.style.height = `calc(100% - ${this._parentMarginV}px)`;
        } else {
            // No explicit height and no active compensation → clear inline style.
            this.style.removeProperty('height');
        }
        this.style.width      = _toCssLength(config.width      ?? '');
        this.style.maxHeight   = _toCssLength(config.max_height ?? '');
        this.style.maxWidth    = _toCssLength(config.max_width  ?? '');
        // Apply min-height/min-width to the host element — suppressed when the
        // corresponding exact dimension is also set (config.height/config.width wins;
        // CSS min-* always overrides height/width when larger, so we clear it).
        if (explicitH) {
            this.style.removeProperty('min-height');
        } else {
            this.style.minHeight = _toCssLength(config.min_height ?? '');
        }
        const explicitW = _toCssLength(config.width ?? '');
        if (explicitW) {
            this.style.removeProperty('min-width');
        } else {
            this.style.minWidth = _toCssLength(config.min_width ?? '');
        }

        const validOverflow = ['visible', 'hidden', 'clip', 'scroll', 'auto'];
        this.style.overflow  = validOverflow.includes(config.overflow)   ? config.overflow   : '';
        this.style.overflowX = validOverflow.includes(config.overflow_x) ? config.overflow_x : '';
        this.style.overflowY = validOverflow.includes(config.overflow_y) ? config.overflow_y : '';
        this.style.zIndex    = config.z_index != null ? String(config.z_index) : '';
    }

    /**
     * Convert a config height/width value to an integer pixel count, or null
     * if the value uses relative/viewport units (vh, vw, %, em, rem, …) that
     * cannot be resolved to px at declaration time.
     *
     * Use this in getCardSize() so that relative-unit values fall back to
     * the card's default row calculation rather than producing a nonsense number.
     *
     * @param {number|string} val - e.g. 400, "400", "400px", "50vh"
     * @returns {number|null}
     * @protected
     */
    _configPx(val) {
        return _toPxInt(val);
    }

    /**
     * Called when HASS changes - override in subclasses
     * @protected
     */
    _onHassChanged(newHass, oldHass) {
        // Override in subclasses
    }

    /**
     * Called when connected to DOM - override in subclasses
     * @protected
     */
    _onConnected() {
        // Override in subclasses
    }

    /**
     * Called when disconnected from DOM - override in subclasses
     * @protected
     */
    _onDisconnected() {
        // Override in subclasses
    }

    /**
     * Called on first update - override in subclasses
     * @protected
     */
    _onFirstUpdated(changedProperties) {
        // Override in subclasses
    }

    /**
     * Called on updates - override in subclasses
     * @protected
     */
    _onUpdated(changedProperties) {
        // Override in subclasses
    }

    /**
     * Render the card content - MUST be overridden in subclasses
     * @protected
     * @returns {import('lit').TemplateResult}
     */
    _renderCard() {
        return html`<div>Override _renderCard() in subclass</div>`;
    }

    /**
     * Get card size - override in subclasses
     * @protected
     */
    _getCardSize() {
        return 1;
    }

    /**
     * Get layout options - override in subclasses
     * @protected
     */
    _getGridOptions() {
        return {};
    }

    /**
     * Validate configuration - override in subclasses
     * @protected
     */
    _validateConfig(config) {
        // Basic validation - override for specific requirements
        if (!config.type) {
            throw new Error('Card type is required');
        }
    }

    // ============================================================================
    // Template Pattern Support
    // ============================================================================

    /**
     * Return the per-instance GUID used for template, rules, and logging identity.
     * @returns {string}
     */
    getCardGuid() {
        return this._cardGuid;
    }

    /**
     * Return `true` when the card is running inside the HA editor card-picker preview.
     * @returns {boolean|'picker'|'editor'}
     */
    isPreviewMode() {
        return this._isPreviewMode;
    }

    /**
     * Return `true` once the shadow DOM has been attached and `firstUpdated` has fired.
     * @returns {boolean}
     */
    isMountResolved() {
        return this._mountResolved;
    }

    /**
     * Get the mount element (shadowRoot)
     */
    getMountElement() {
        return this.shadowRoot;
    }

    // ============================================================================
    // Private Implementation
    // ============================================================================

    /**
     * Generate unique GUID for card instance
     * @private
     */
    _generateGuid() {
        return 'lcards-' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Walk up the DOM tree (piercing shadow root boundaries) and check whether
     * any ancestor element matches one of the given tag-name selectors.
     * This is needed because `Element.closest()` cannot cross shadow DOM
     * boundaries, but the HA editor places cards inside nested shadow roots.
     * @param {string[]} selectors  Lower-case custom-element tag names to test
     * @returns {boolean}
     * @protected
     */
    _checkForAncestor(selectors) {
        let current = /** @type {Element | null} */ (this);
        const maxLevels = 20;

        for (let i = 0; i < maxLevels && current; i++) {
            for (const selector of selectors) {
                if (current.tagName?.toLowerCase() === selector.toLowerCase()) {
                    return true;
                }
            }
            // Traverse shadow DOM boundaries: try parentElement, then shadow host
            current = current.parentElement ||
                /** @type {ShadowRoot} */ (current.parentNode)?.host ||
                /** @type {ShadowRoot} */ (current.getRootNode())?.host;
        }

        return false;
    }

    /**
     * Detect if running in preview mode
     * @protected
     * @returns {boolean|'picker'|'editor'}
     */
    _detectPreviewMode() {
        // Heuristics for preview mode detection
        const parentElement = this.parentElement;
        if (!parentElement) {
            lcardsLog.debug(`[LCARdSNativeCard] Preview detection: no parent element`);
            return false;
        }

        // Check for dashboard edit mode
        const dashboardEl = parentElement.closest('hui-root, ha-panel-lovelace');
        if (dashboardEl && /** @type {any} */ (dashboardEl).editMode) {
            lcardsLog.debug(`[LCARdSNativeCard] Preview detection: dashboard edit mode detected`);
            return true;
        }

        // Check for card picker
        const cardPickerEl = parentElement.closest('hui-card-picker, hui-card-preview');
        if (cardPickerEl) {
            lcardsLog.debug(`[LCARdSNativeCard] Preview detection: card picker detected`, {
                cardPickerTag: cardPickerEl.tagName,
                parentTag: parentElement.tagName,
                parentClass: parentElement.className
            });
            return true;
        }

        // Check for card editor dialog — must pierce shadow DOM boundaries because
        // hui-dialog-edit-card uses shadow DOM and closest() stops at the boundary.
        // When a card is inside this dialog its IntersectionObserver would fire
        // immediately with isIntersecting:false (the backgroundLayer div is clipped
        // by the dialog's overflow boundary before layout settles), permanently
        // suspending background animations before any frame renders.
        if (this._checkForAncestor(['hui-dialog-edit-card'])) {
            lcardsLog.debug(`[LCARdSNativeCard] Preview detection: card editor dialog detected`);
            return true;
        }

        // Check URL for edit mode
        if (window.location.href.includes('edit=1')) {
            lcardsLog.debug(`[LCARdSNativeCard] Preview detection: URL edit mode detected`);
            return true;
        }

        lcardsLog.debug(`[LCARdSNativeCard] Preview detection: not in preview mode`, {
            parentTag: parentElement.tagName,
            parentClass: parentElement.className,
            url: window.location.href
        });
        return false;
    }

    /**
     * Load LCARS fonts
     * Registers a one-shot 'loadingdone' listener on the browser FontFaceSet so
     * that any card re-renders once all fonts (loaded on-demand via AssetManager)
     * are fully available.  This prevents text being measured / rendered with the
     * fallback font on first paint.
     * @private
     */
    _loadFonts() {
        if (!document.fonts) return;

        // Scan the card's own config for every font-family value that starts with
        // 'lcards_' and load each one.  This covers any custom font the user may have
        // referenced (not just the built-in two), and window.lcards.loadFont() is
        // idempotent so calling it multiple times is safe.
        const fontsToLoad = new Set();
        const _scanForFonts = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            const ff = obj.font_family;
            if (typeof ff === 'string') {
                ff.split(',').forEach(part => {
                    const name = part.trim().replace(/^['"]|['"]$/g, '');
                    if (name.startsWith('lcards_')) fontsToLoad.add(name);
                });
            }
            for (const v of Object.values(obj)) {
                if (v && typeof v === 'object') _scanForFonts(v);
            }
        };
        _scanForFonts(this.config);
        fontsToLoad.forEach(f => window.lcards?.loadFont?.(f));

        // Bind handler with reference so we can remove it in _cleanup()
        this._fontLoadingDoneHandler = () => {
            lcardsLog.debug(`[LCARdSNativeCard] Fonts loaded, triggering re-render: ${this._cardGuid}`);

            // Invalidate text measurement cache so sizes are re-measured with real fonts
            window.lcards?.clearTextMeasureCache?.();

            this.requestUpdate();
        };

        document.fonts.addEventListener('loadingdone', this._fontLoadingDoneHandler);

        // Backup: document.fonts.ready resolves when currently-loading fonts finish.
        // Handles the race where loadingdone already fired before our listener registered.
        document.fonts.ready.then(() => {
            window.lcards?.clearTextMeasureCache?.();
            this.requestUpdate();
        });

        lcardsLog.trace(`[LCARdSNativeCard] Font loading initialized: ${this._cardGuid}`);
    }

    /**
     * Resolve mount element
     * @private
     */
    _resolveMountElement() {
        // For native LitElement, mount is shadowRoot
        // This ensures compatibility with existing template patterns
        setTimeout(() => {
            this._mountResolved = true;
            this.requestUpdate();
        }, 0);
    }

    /**
     * Cleanup resources
     * @private
     */
    _cleanup() {
        // Remove font loading listener
        if (this._fontLoadingDoneHandler && document.fonts) {
            document.fonts.removeEventListener('loadingdone', this._fontLoadingDoneHandler);
            this._fontLoadingDoneHandler = null;
        }

        // Subclasses can override to add cleanup logic
    }
}
