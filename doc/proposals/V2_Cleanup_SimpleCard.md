# LCARdS Architecture Cleanup & Simplification Proposal

**Document Version**: 1.0
**Date**: 2025-11-09
**Author**: Architecture Review Team
**Status**: Ready for Implementation

---

## 📋 Executive Summary

This proposal outlines a comprehensive cleanup of the incomplete V2 card architecture and replacement with a simplified, production-ready foundation. The current V2 system introduced unnecessary complexity that prevented successful implementation. This proposal defines a clear, prescriptive path forward.

**Goals**:
1. Remove incomplete V2 architecture that created confusion
2. Implement clean `LCARdSSimpleCard` foundation
3. Maintain all working MSD functionality
4. Create clear migration path for legacy templates
5. Eliminate architectural ambiguity

**Timeline**: 2-3 days for complete implementation
**Risk Level**: Low (preserves all working functionality)

---

## 🎯 Problem Statement

### Current Architecture Issues

1. **Three Overlapping Base Classes**:
   - `LCARdSNativeCard` - Working, used by MSD ✓
   - `LCARdSV2Card` - Over-engineered, caused rendering failures ✗
   - `LCARdSV2ButtonCard` - Caught in V2 complexity, SVG won't render ✗

2. **V2CardSystemsManager Complexity**:
   - Auto-subscribes to overlays (wrong abstraction level)
   - Rule callback management (cards don't need this)
   - Overlay target registration (cards aren't overlays)
   - Template processor with excessive caching
   - Style resolver with multi-layer resolution

3. **Confusion About Purpose**:
   - V2 cards tried to be "lightweight MSD"
   - Mixed concerns between card infrastructure and rendering
   - Unclear when to use Native vs V2 vs MSD patterns

4. **Critical Failure Point**:
   - V2 button card couldn't render SVG properly
   - ButtonRenderer integration unclear
   - Action attachment inconsistent
   - Template processing overcomplicated

---

## ✅ Proposed Solution

### Two-Tier Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LitElement (from lit)                │
└─────────────────────────────────────────────────────────┘
                            │
                            ↓
┌─────────────────────────────────────────────────────────┐
│              LCARdSNativeCard (KEEP AS-IS)              │
│  • Home Assistant card interface                        │
│  • Shadow DOM management                                │
│  • Action handling                                      │
│  • Preview mode detection                               │
│  • Font loading                                         │
└─────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴───────┐
                    │               │
                    ↓               ↓
        ┌───────────────────┐   ┌──────────────────┐
        │ LCARdSSimpleCard  │   │  LCARdSMSDCard   │
        │      (NEW)        │   │  (KEEP AS-IS)    │
        └───────────────────┘   └──────────────────┘
                 │
                 ↓
        ┌────────────────┐
        │  Simple Cards  │
        │  • Button      │
        │  • Label       │
        │  • Status      │
        └────────────────┘
```

### Architecture Principles

1. **LCARdSNativeCard**: Foundation infrastructure (UNCHANGED)
2. **LCARdSSimpleCard**: Minimal helpers for singleton access (NEW)
3. **LCARdSMSDCard**: Complex multi-overlay system (UNCHANGED)
4. **Simple Cards**: Lightweight implementations using SimpleCard (NEW)

---

## 📂 Files to Delete

### Complete Removal List

```bash
# V2 Foundation (Failed Architecture)
src/base/LCARdSV2Card.js                    # DELETE - Over-engineered base
src/base/V2CardSystemsManager.js            # DELETE - Wrong abstraction
src/base/V2StyleResolver.js                 # DELETE - Unnecessary complexity
src/base/LightweightTemplateProcessor.js    # DELETE - Over-cached

# V2 Card Implementations
src/cards/lcards-v2-button.js               # DELETE - Failed implementation

# Documentation
doc/V2_FOUNDATION_COMPLETE.md               # DELETE - Outdated
doc/architecture/v2-card-foundation.md      # DELETE - Wrong approach
```

### Files to Keep (Preserve Working Functionality)

```bash
# Core Foundation (WORKING)
src/base/LCARdSNativeCard.js                # KEEP - Working HA integration
src/base/LCARdSActionHandler.js             # KEEP - Working actions
src/base/index.js                           # UPDATE - Remove V2 exports

# MSD System (WORKING)
src/cards/lcards-msd.js                     # KEEP - Working MSD implementation
src/msd/**/*                                # KEEP - All MSD functionality

# Singletons (WORKING)
src/core/**/*                               # KEEP - Theme, rules, animations

# Renderers (WORKING)
src/msd/renderer/**/*                       # KEEP - ButtonRenderer, TextRenderer, etc.
```

---

## 🔨 Implementation Plan

### Phase 1: Cleanup (1 day)

#### Step 1.1: Delete V2 Files

```bash
#!/bin/bash
# Execute this script to remove V2 architecture

# Remove V2 base classes
rm src/base/LCARdSV2Card.js
rm src/base/V2CardSystemsManager.js
rm src/base/V2StyleResolver.js
rm src/base/LightweightTemplateProcessor.js

# Remove V2 card implementations
rm src/cards/lcards-v2-button.js

# Remove V2 documentation
rm doc/V2_FOUNDATION_COMPLETE.md
rm doc/architecture/v2-card-foundation.md

# Note: Keep test files for reference during migration
# test/test-v2-foundation.html - Can be adapted for SimpleCard testing
```

#### Step 1.2: Update Base Exports

**File**: `src/base/index.js`

```javascript
/**
 * LCARdS Base Components
 *
 * Barrel export for all base architecture components
 */

export { LCARdSNativeCard } from './LCARdSNativeCard.js';
export { LCARdSActionHandler } from './LCARdSActionHandler.js';

// REMOVED: V2Card exports (deleted architecture)
// export { LCARdSV2Card } from './LCARdSV2Card.js';
// export { V2CardSystemsManager } from './V2CardSystemsManager.js';
```

#### Step 1.3: Verify Build

```bash
npm run build

# Expected: Clean build with no V2 references
# Expected: No import errors
# Expected: MSD card still works
```

---

### Phase 2: Create LCARdSSimpleCard (1 day)

#### Step 2.1: Create Simple Card Base Class

**File**: `src/base/LCARdSSimpleCard.js` (NEW)

```javascript
/**
 * LCARdS Simple Card Foundation
 *
 * Minimal base class for simple, single-purpose cards that leverage
 * singleton architecture without MSD complexity.
 *
 * Philosophy:
 * - Card controls everything explicitly
 * - No auto-subscriptions or magic behavior
 * - Helpers available when needed
 * - Clear, predictable lifecycle
 *
 * Use Cases:
 * - Simple buttons with actions
 * - Status displays
 * - Labels with templates
 * - Single-entity cards
 *
 * NOT for:
 * - Multi-overlay displays (use LCARdSMSDCard)
 * - Complex routing/navigation
 * - Multi-entity grids
 */

import { html, css } from 'lit';
import { lcardsLog } from '../utils/lcards-logging.js';
import { LCARdSNativeCard } from './LCARdSNativeCard.js';

/**
 * Base class for simple LCARdS cards
 *
 * Extends LCARdSNativeCard to inherit all HA integration,
 * adds singleton access and helper methods.
 */
export class LCARdSSimpleCard extends LCARdSNativeCard {

    static get properties() {
        return {
            ...super.properties,

            // Simple card state
            _entity: { type: Object, state: true },
            _singletons: { type: Object, state: true },
            _initialized: { type: Boolean, state: true }
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                :host {
                    display: block;
                    width: 100%;
                    height: 100%;
                }

                .simple-card-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                .simple-card-error {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100px;
                    padding: 16px;
                    background: var(--error-background-color, rgba(244, 67, 54, 0.1));
                    border: 1px solid var(--error-color, #f44336);
                    border-radius: 4px;
                    color: var(--error-color, #f44336);
                    font-size: 14px;
                }

                .simple-card-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100px;
                    color: var(--primary-text-color);
                    font-size: 14px;
                    opacity: 0.7;
                }
            `
        ];
    }

    constructor() {
        super();

        // Simple card state
        this._entity = null;
        this._singletons = null;
        this._initialized = false;

        lcardsLog.debug(`[LCARdSSimpleCard] Constructor called for ${this._cardGuid}`);
    }

    /**
     * Called when config is set
     * @protected
     */
    _onConfigSet(config) {
        super._onConfigSet(config);

        // Store entity reference if present
        if (config.entity && this.hass) {
            this._entity = this.hass.states[config.entity];
        }

        lcardsLog.debug(`[LCARdSSimpleCard] Config set for ${this._cardGuid}`, {
            entity: config.entity,
            hasEntity: !!this._entity
        });
    }

    /**
     * Called when HASS changes
     * @protected
     */
    _onHassChanged(newHass, oldHass) {
        super._onHassChanged(newHass, oldHass);

        // Update entity reference
        if (this.config.entity) {
            this._entity = newHass.states[this.config.entity];
        }

        // Call card-specific HASS handler
        if (typeof this._handleHassUpdate === 'function') {
            this._handleHassUpdate(newHass, oldHass);
        }
    }

    /**
     * Called when connected to DOM
     * @protected
     */
    _onConnected() {
        super._onConnected();

        // Initialize singleton access
        this._initializeSingletons();

        lcardsLog.debug(`[LCARdSSimpleCard] Connected: ${this._cardGuid}`);
    }

    /**
     * Called on first update
     * @protected
     */
    _onFirstUpdated(changedProperties) {
        super._onFirstUpdated(changedProperties);

        // Mark as initialized
        this._initialized = true;

        // Call card-specific initialization
        if (typeof this._handleFirstUpdate === 'function') {
            this._handleFirstUpdate(changedProperties);
        }

        lcardsLog.debug(`[LCARdSSimpleCard] First updated: ${this._cardGuid}`);
    }

    /**
     * Initialize singleton system access
     * @private
     */
    _initializeSingletons() {
        try {
            // Get core singletons via unified API
            const core = window.lcards?.core;

            if (!core) {
                lcardsLog.warn(`[LCARdSSimpleCard] Core singletons not available`);
                return;
            }

            this._singletons = {
                themeManager: core.getThemeManager(),
                rulesEngine: core.rulesManager,
                animationManager: core.animationManager,
                dataSourceManager: core.dataSourceManager,
                validationService: core.validationService,
                actionHandler: core.actionHandler,
                stylePresetManager: core.getStylePresetManager()
            };

            lcardsLog.debug(`[LCARdSSimpleCard] Singletons initialized for ${this._cardGuid}`, {
                hasTheme: !!this._singletons.themeManager,
                hasRules: !!this._singletons.rulesEngine,
                hasAnimations: !!this._singletons.animationManager,
                hasDataSources: !!this._singletons.dataSourceManager
            });

        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleCard] Singleton initialization failed:`, error);
        }
    }

    // ============================================================================
    // HELPER METHODS - Available to subclasses
    // ============================================================================

    /**
     * Process a template string with current context
     *
     * Supports button-card syntax:
     * - JavaScript: [[[return entity.state === 'on' ? 'Active' : 'Inactive']]]
     * - Tokens: {{entity.attributes.friendly_name}}
     *
     * @param {string} template - Template string to process
     * @returns {string} Processed result
     */
    processTemplate(template) {
        if (!template || typeof template !== 'string') {
            return template;
        }

        // Quick check for templates
        const hasJavaScript = template.includes('[[[') && template.includes(']]]');
        const hasTokens = template.includes('{{') && template.includes('}}');

        if (!hasJavaScript && !hasTokens) {
            return template;
        }

        try {
            // Create evaluation context
            const context = {
                entity: this._entity,
                config: this.config,
                hass: this.hass,
                states: this.hass?.states || {},
                user: this.hass?.user || {},
                // Helper functions
                Math,
                String,
                Number,
                Boolean,
                parseFloat,
                parseInt
            };

            // Process JavaScript templates [[[code]]]
            let result = template;
            if (hasJavaScript) {
                result = result.replace(/\[\[\[([\s\S]*?)\]\]\]/g, (match, code) => {
                    try {
                        const func = new Function(...Object.keys(context), `return ${code}`);
                        const value = func(...Object.values(context));
                        return value !== null && value !== undefined ? String(value) : '';
                    } catch (error) {
                        lcardsLog.warn(`[LCARdSSimpleCard] Template evaluation failed:`, error);
                        return match;
                    }
                });
            }

            // Process token templates {{token}}
            if (hasTokens) {
                result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
                    try {
                        const value = this._resolveTokenPath(path.trim(), context);
                        return value !== null && value !== undefined ? String(value) : '';
                    } catch (error) {
                        lcardsLog.warn(`[LCARdSSimpleCard] Token resolution failed:`, error);
                        return match;
                    }
                });
            }

            return result;

        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleCard] Template processing failed:`, error);
            return template;
        }
    }

    /**
     * Resolve dot-notation token path
     * @private
     */
    _resolveTokenPath(path, context) {
        const parts = path.split('.');
        let current = context;

        for (const part of parts) {
            if (current === null || current === undefined) {
                return null;
            }
            current = current[part];
        }

        return current;
    }

    /**
     * Get theme token value
     *
     * @param {string} tokenPath - Dot-notation path (e.g., 'colors.accent.primary')
     * @param {*} fallback - Fallback value if token not found
     * @returns {*} Token value or fallback
     */
    getThemeToken(tokenPath, fallback = null) {
        if (!this._singletons?.themeManager) {
            return fallback;
        }

        try {
            return this._singletons.themeManager.getToken(tokenPath, fallback);
        } catch (error) {
            lcardsLog.warn(`[LCARdSSimpleCard] Theme token fetch failed:`, error);
            return fallback;
        }
    }

    /**
     * Get style preset configuration
     *
     * @param {string} overlayType - Type of overlay (e.g., 'button', 'text')
     * @param {string} presetName - Name of the preset (e.g., 'lozenge', 'picard')
     * @returns {Object|null} Preset configuration or null
     */
    getStylePreset(overlayType, presetName) {
        if (!this._singletons?.stylePresetManager) {
            return null;
        }

        try {
            return this._singletons.stylePresetManager.getPreset(
                overlayType,
                presetName,
                this._singletons.themeManager
            );
        } catch (error) {
            lcardsLog.warn(`[LCARdSSimpleCard] Preset fetch failed:`, error);
            return null;
        }
    }

    /**
     * Resolve styles with theme tokens and state overrides
     *
     * @param {Object} baseStyle - Base style object
     * @param {Array<string>} themeTokens - Array of theme token paths to apply
     * @param {Object} stateOverrides - State-based style overrides
     * @returns {Object} Resolved style object
     */
    resolveStyle(baseStyle = {}, themeTokens = [], stateOverrides = {}) {
        let resolved = { ...baseStyle };

        // Apply theme tokens
        themeTokens.forEach(tokenPath => {
            const value = this.getThemeToken(tokenPath);
            if (value !== null && value !== undefined) {
                // Extract property name from path (last segment)
                const property = tokenPath.split('.').pop();
                resolved[property] = value;
            }
        });

        // Apply state overrides (highest priority)
        resolved = { ...resolved, ...stateOverrides };

        return resolved;
    }

    /**
     * Get entity state
     *
     * @param {string} entityId - Entity ID (optional, defaults to card's entity)
     * @returns {Object|null} Entity state or null
     */
    getEntityState(entityId = null) {
        const id = entityId || this.config.entity;
        if (!id || !this.hass) {
            return null;
        }

        return this.hass.states[id] || null;
    }

    /**
     * Call Home Assistant service
     *
     * @param {string} domain - Service domain (e.g., 'light')
     * @param {string} service - Service name (e.g., 'turn_on')
     * @param {Object} data - Service data
     * @returns {Promise<void>}
     */
    async callService(domain, service, data = {}) {
        if (!this.hass) {
            lcardsLog.warn(`[LCARdSSimpleCard] Cannot call service - no HASS instance`);
            return;
        }

        try {
            await this.hass.callService(domain, service, data);
            lcardsLog.debug(`[LCARdSSimpleCard] Called service ${domain}.${service}`, data);
        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleCard] Service call failed:`, error);
        }
    }

    /**
     * Setup action handlers on element
     *
     * @param {HTMLElement} element - Target element
     * @param {Object} actions - Action configurations
     * @returns {Function} Cleanup function
     */
    setupActions(element, actions) {
        if (!element || !actions) {
            return () => {};
        }

        const cleanupFunctions = [];

        // Tap action
        if (actions.tap_action) {
            const tapHandler = () => {
                this._executeAction(actions.tap_action);
            };
            element.addEventListener('click', tapHandler);
            cleanupFunctions.push(() => element.removeEventListener('click', tapHandler));
        }

        // Hold action
        if (actions.hold_action) {
            let holdTimer;
            const holdStart = () => {
                holdTimer = setTimeout(() => {
                    this._executeAction(actions.hold_action);
                }, 500);
            };
            const holdEnd = () => {
                if (holdTimer) {
                    clearTimeout(holdTimer);
                    holdTimer = null;
                }
            };

            element.addEventListener('pointerdown', holdStart);
            element.addEventListener('pointerup', holdEnd);
            element.addEventListener('pointercancel', holdEnd);

            cleanupFunctions.push(() => {
                element.removeEventListener('pointerdown', holdStart);
                element.removeEventListener('pointerup', holdEnd);
                element.removeEventListener('pointercancel', holdEnd);
                if (holdTimer) clearTimeout(holdTimer);
            });
        }

        // Double tap action
        if (actions.double_tap_action) {
            let tapCount = 0;
            let tapTimer;
            const handleTap = () => {
                tapCount++;
                if (tapCount === 1) {
                    tapTimer = setTimeout(() => {
                        tapCount = 0;
                    }, 300);
                } else if (tapCount === 2) {
                    clearTimeout(tapTimer);
                    tapCount = 0;
                    this._executeAction(actions.double_tap_action);
                }
            };

            element.addEventListener('click', handleTap);
            cleanupFunctions.push(() => {
                element.removeEventListener('click', handleTap);
                if (tapTimer) clearTimeout(tapTimer);
            });
        }

        return () => {
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }

    /**
     * Execute action configuration
     * @private
     */
    _executeAction(actionConfig) {
        if (!actionConfig || !this.hass) {
            return;
        }

        const action = actionConfig.action;

        switch (action) {
            case 'toggle':
                this._handleToggle(actionConfig);
                break;
            case 'more-info':
                this._handleMoreInfo(actionConfig);
                break;
            case 'call-service':
                this._handleCallService(actionConfig);
                break;
            case 'navigate':
                this._handleNavigate(actionConfig);
                break;
            case 'url':
                this._handleUrl(actionConfig);
                break;
            case 'none':
                // Do nothing
                break;
            default:
                lcardsLog.warn(`[LCARdSSimpleCard] Unknown action: ${action}`);
        }
    }

    /**
     * Handle toggle action
     * @private
     */
    _handleToggle(actionConfig) {
        const entityId = actionConfig.entity || this.config.entity;
        if (!entityId) return;

        const domain = entityId.split('.')[0];
        this.callService(domain, 'toggle', { entity_id: entityId });
    }

    /**
     * Handle more-info action
     * @private
     */
    _handleMoreInfo(actionConfig) {
        const entityId = actionConfig.entity || this.config.entity;
        if (!entityId) return;

        const event = new CustomEvent('hass-more-info', {
            detail: { entityId },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    /**
     * Handle call-service action
     * @private
     */
    _handleCallService(actionConfig) {
        const service = actionConfig.service;
        if (!service) return;

        const [domain, serviceAction] = service.split('.');
        this.callService(domain, serviceAction, actionConfig.service_data || {});
    }

    /**
     * Handle navigate action
     * @private
     */
    _handleNavigate(actionConfig) {
        const path = actionConfig.navigation_path;
        if (!path) return;

        window.history.pushState(null, '', path);
        window.dispatchEvent(new CustomEvent('location-changed', {
            detail: { replace: false },
            bubbles: true,
            composed: true
        }));
    }

    /**
     * Handle URL action
     * @private
     */
    _handleUrl(actionConfig) {
        const url = actionConfig.url_path;
        if (!url) return;

        window.open(url, '_blank');
    }

    // ============================================================================
    // RENDER - Subclasses MUST implement _renderCard()
    // ============================================================================

    /**
     * Render the card content
     * @protected
     */
    _renderCard() {
        if (!this._initialized) {
            return html`
                <div class="simple-card-container">
                    <div class="simple-card-loading">
                        Initializing...
                    </div>
                </div>
            `;
        }

        // Subclasses must implement this
        return html`
            <div class="simple-card-container">
                <div class="simple-card-error">
                    Subclass must implement _renderCard()
                </div>
            </div>
        `;
    }
}
```

#### Step 2.2: Update Base Exports

**File**: `src/base/index.js`

```javascript
/**
 * LCARdS Base Components
 *
 * Barrel export for all base architecture components
 */

export { LCARdSNativeCard } from './LCARdSNativeCard.js';
export { LCARdSActionHandler } from './LCARdSActionHandler.js';
export { LCARdSSimpleCard } from './LCARdSSimpleCard.js'; // NEW
```

---

### Phase 3: Create Example Simple Button (0.5 days)

#### Step 3.1: Implement Simple Button Card

**File**: `src/cards/lcards-simple-button.js` (NEW)

```javascript
/**
 * LCARdS Simple Button Card
 *
 * A clean, straightforward button implementation using the SimpleCard foundation.
 * Demonstrates the proper use of the simplified architecture.
 *
 * Features:
 * - Template processing for label/content
 * - Theme token integration
 * - Style preset support
 * - Action handling
 * - SVG rendering via ButtonRenderer
 *
 * Configuration:
 * ```yaml
 * type: custom:lcards-simple-button
 * entity: light.bedroom
 * label: "Bedroom Light"
 * preset: lozenge  # Optional: button style preset
 * tap_action:
 *   action: toggle
 * ```
 */

import { html, css, unsafeHTML } from 'lit';
import { LCARdSSimpleCard } from '../base/LCARdSSimpleCard.js';
import { ButtonRenderer } from '../msd/renderer/core/ButtonRenderer.js';
import { lcardsLog } from '../utils/lcards-logging.js';

export class LCARdSSimpleButtonCard extends LCARdSSimpleCard {

    static get properties() {
        return {
            ...super.properties,
            _processedLabel: { type: String, state: true },
            _processedContent: { type: String, state: true },
            _buttonStyle: { type: Object, state: true }
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                .button-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .button-svg {
                    display: block;
                    width: 100%;
                    height: auto;
                    max-width: 300px;
                }
            `
        ];
    }

    constructor() {
        super();
        this._processedLabel = '';
        this._processedContent = '';
        this._buttonStyle = null;
        this._actionCleanup = null;
    }

    /**
     * Handle HASS updates - process templates when entity changes
     * @private
     */
    _handleHassUpdate(newHass, oldHass) {
        // Process templates when entity state changes
        if (this.config.entity && this._entity) {
            const oldState = oldHass?.states[this.config.entity]?.state;
            const newState = this._entity.state;

            if (oldState !== newState) {
                this._processTemplates();
            }
        }
    }

    /**
     * Handle first update - setup initial state
     * @private
     */
    _handleFirstUpdate(changedProperties) {
        // Process templates initially
        this._processTemplates();

        // Resolve button style
        this._resolveButtonStyle();

        // Setup actions after render
        setTimeout(() => this._setupButtonActions(), 0);
    }

    /**
     * Process template strings in configuration
     * @private
     */
    _processTemplates() {
        // Process label template
        const rawLabel = this.config.label || this.config.text || '';
        this._processedLabel = this.processTemplate(rawLabel);

        // Process content template
        const rawContent = this.config.content || this.config.value || '';
        this._processedContent = this.processTemplate(rawContent);

        lcardsLog.debug(`[LCARdSSimpleButtonCard] Templates processed:`, {
            label: this._processedLabel,
            content: this._processedContent
        });
    }

    /**
     * Resolve button style from config, preset, and theme
     * @private
     */
    _resolveButtonStyle() {
        // Start with base style from config
        let style = { ...(this.config.style || {}) };

        // Apply preset if specified
        if (this.config.preset) {
            const preset = this.getStylePreset('button', this.config.preset);
            if (preset) {
                // Preset has lower priority than explicit config
                style = { ...preset, ...style };
                lcardsLog.debug(`[LCARdSSimpleButtonCard] Applied preset '${this.config.preset}'`);
            }
        }

        // Get state-based overrides
        const stateOverrides = this._getStateOverrides();

        // Resolve with theme tokens
        this._buttonStyle = this.resolveStyle(style, [
            'colors.accent.primary',
            'colors.text.primary'
        ], stateOverrides);

        lcardsLog.debug(`[LCARdSSimpleButtonCard] Button style resolved:`, this._buttonStyle);
    }

    /**
     * Get state-based style overrides
     * @private
     */
    _getStateOverrides() {
        if (!this._entity) {
            return {};
        }

        const state = this._entity.state;
        const overrides = {};

        // Apply state-specific colors
        switch (state) {
            case 'on':
                overrides.color = 'var(--accent-color, #ff9900)';
                break;
            case 'off':
                overrides.color = 'var(--disabled-color, #666666)';
                overrides.opacity = 0.6;
                break;
            case 'unavailable':
                overrides.color = 'var(--error-color, #ff0000)';
                overrides.opacity = 0.4;
                break;
        }

        return overrides;
    }

    /**
     * Setup action handlers on the rendered button
     * @private
     */
    _setupButtonActions() {
        // Clean up previous actions
        if (this._actionCleanup) {
            this._actionCleanup();
            this._actionCleanup = null;
        }

        // Find button element
        const buttonGroup = this.shadowRoot.querySelector('[data-button-id]');
        if (!buttonGroup) {
            lcardsLog.warn(`[LCARdSSimpleButtonCard] Button element not found for action setup`);
            return;
        }

        // Get action configurations
        const actions = {
            tap_action: this.config.tap_action || { action: 'toggle' },
            hold_action: this.config.hold_action,
            double_tap_action: this.config.double_tap_action
        };

        // Setup actions using helper
        this._actionCleanup = this.setupActions(buttonGroup, actions);

        lcardsLog.debug(`[LCARdSSimpleButtonCard] Actions setup complete`);
    }

    /**
     * Render the button card
     * @protected
     */
    _renderCard() {
        if (!this._initialized) {
            return super._renderCard();
        }

        try {
            // Get button dimensions
            const width = this.config.width || 200;
            const height = this.config.height || 60;

            // Build button configuration for ButtonRenderer
            const buttonConfig = {
                id: this._cardGuid,
                label: this._processedLabel,
                content: this._processedContent,
                tap_action: this.config.tap_action,
                hold_action: this.config.hold_action,
                double_tap_action: this.config.double_tap_action
            };

            // Render button using ButtonRenderer
            const result = ButtonRenderer.render(
                buttonConfig,
                this._buttonStyle,
                { width, height },
                { x: 0, y: 0 },
                {
                    cellId: this._cardGuid,
                    gridContext: false,
                    cardInstance: this
                }
            );

            if (!result || !result.markup) {
                throw new Error('ButtonRenderer returned no markup');
            }

            return html`
                <div class="button-container">
                    <svg
                        class="button-svg"
                        width="${width}"
                        height="${height}"
                        viewBox="0 0 ${width} ${height}">
                        ${unsafeHTML(result.markup)}
                    </svg>
                </div>
            `;

        } catch (error) {
            lcardsLog.error(`[LCARdSSimpleButtonCard] Render failed:`, error);

            return html`
                <div class="simple-card-error">
                    Button render failed: ${error.message}
                </div>
            `;
        }
    }

    /**
     * Cleanup on disconnect
     */
    disconnectedCallback() {
        if (this._actionCleanup) {
            this._actionCleanup();
            this._actionCleanup = null;
        }
        super.disconnectedCallback();
    }

    /**
     * Get card size for Home Assistant layout
     */
    getCardSize() {
        return 1;
    }

    /**
     * Get stub config for card picker
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-simple-button',
            entity: 'light.example',
            label: 'Example Button',
            preset: 'lozenge',
            tap_action: {
                action: 'toggle'
            }
        };
    }
}

// Register the card
customElements.define('lcards-simple-button', LCARdSSimpleButtonCard);

// Register with card picker
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'lcards-simple-button',
    name: 'LCARdS Simple Button',
    description: 'Simple LCARS-styled button with actions and templates',
    preview: true
});

lcardsLog.debug('[LCARdSSimpleButtonCard] Card registered');
```

#### Step 3.2: Register Card in Entry Point

**File**: `src/lcards.js`

```javascript
// ... existing imports ...

// Import simple cards
import './cards/lcards-simple-button.js'; // NEW

// ... rest of file unchanged ...
```

---

### Phase 4: Documentation (0.5 days)

#### Step 4.1: Create Architecture Documentation

**File**: `doc/architecture/simple-card-foundation.md` (NEW)

````markdown
# LCARdS Simple Card Architecture

## Overview

The Simple Card foundation provides a minimal, clear base for building single-purpose Home Assistant cards that leverage LCARdS singleton systems without MSD complexity.

## Philosophy

**Explicit Over Magic**
- Card explicitly requests what it needs
- No auto-subscriptions or hidden behavior
- Clear, predictable lifecycle

**Minimal Foundation**
- Only essential helpers provided
- Card owns its rendering logic
- Simple template processing

**Singleton Integration**
- Direct access to theme, rules, animations
- No intermediate abstraction layers
- Cards use what they need

## Class Hierarchy

```
LitElement
    ↓
LCARdSNativeCard (HA integration, shadow DOM, actions)
    ↓
LCARdSSimpleCard (singleton access, helpers)
    ↓
[Your Simple Card] (rendering, logic)
```

## When to Use

### Use Simple Card For:
- ✅ Single-purpose cards (buttons, labels, status)
- ✅ Cards with 1-3 entities
- ✅ Template-driven content
- ✅ Action-based interactions
- ✅ Simple state displays

### Use MSD Card For:
- ✅ Multi-overlay displays
- ✅ Complex navigation/routing
- ✅ Grid-based layouts
- ✅ Custom SVG composition
- ✅ Advanced animation sequences

## Creating a Simple Card

### Basic Structure

```javascript
import { html } from 'lit';
import { LCARdSSimpleCard } from '../base/LCARdSSimpleCard.js';

export class MySimpleCard extends LCARdSSimpleCard {

    // 1. Define reactive properties
    static get properties() {
        return {
            ...super.properties,
            _myState: { type: String, state: true }
        };
    }

    // 2. Initialize state
    constructor() {
        super();
        this._myState = 'initial';
    }

    // 3. Handle HASS updates (optional)
    _handleHassUpdate(newHass, oldHass) {
        // Process entity changes
        this._myState = this._entity?.state || 'unknown';
    }

    // 4. Render your content
    _renderCard() {
        return html`
            <div class="my-card">
                <!-- Your rendering here -->
            </div>
        `;
    }
}
```

### Available Helpers

#### Template Processing

```javascript
// Process [[[JavaScript]]] and {{tokens}}
const result = this.processTemplate(template);
```

#### Theme Access

```javascript
// Get theme token value
const color = this.getThemeToken('colors.accent.primary', '#ff9900');

// Get style preset
const preset = this.getStylePreset('button', 'lozenge');
```

#### Style Resolution

```javascript
// Combine base + theme + state
const style = this.resolveStyle(
    baseStyle,                    // Base styles
    ['colors.primary'],           // Theme tokens to apply
    { opacity: 0.8 }              // State overrides
);
```

#### Entity Access

```javascript
// Get current entity
const entity = this._entity;

// Get other entity
const other = this.getEntityState('light.bedroom');
```

#### Service Calls

```javascript
// Call HA service
await this.callService('light', 'turn_on', {
    entity_id: 'light.bedroom',
    brightness: 255
});
```

#### Actions

```javascript
// Setup action handlers
this._actionCleanup = this.setupActions(element, {
    tap_action: { action: 'toggle' },
    hold_action: { action: 'more-info' }
});
```

## Example: Simple Label Card

```javascript
import { html, css } from 'lit';
import { LCARdSSimpleCard } from '../base/LCARdSSimpleCard.js';

export class LCARdSSimpleLabelCard extends LCARdSSimpleCard {

    static get properties() {
        return {
            ...super.properties,
            _displayText: { type: String, state: true }
        };
    }

    static get styles() {
        return [
            super.styles,
            css`
                .label-container {
                    padding: 16px;
                    font-family: var(--lcars-font-family, 'Antonio', sans-serif);
                    font-size: 18px;
                    color: var(--primary-text-color);
                }
            `
        ];
    }

    _handleHassUpdate(newHass, oldHass) {
        // Process template when entity changes
        const template = this.config.text || '{{entity.state}}';
        this._displayText = this.processTemplate(template);
    }

    _renderCard() {
        return html`
            <div class="label-container">
                ${this._displayText}
            </div>
        `;
    }
}

customElements.define('lcards-simple-label', LCARdSSimpleLabelCard);
```

## Best Practices

### 1. Minimal State

Only store what you need:

```javascript
constructor() {
    super();
    this._displayValue = null;  // ✅ Minimal state
}
```

### 2. Explicit Processing

Process templates explicitly:

```javascript
_handleHassUpdate(newHass, oldHass) {
    // ✅ Explicit: only when needed
    this._value = this.processTemplate(this.config.value);
}
```

### 3. Clear Lifecycle

Use provided hooks:

```javascript
_handleFirstUpdate() {
    // ✅ Initial setup
    this._setupCard();
}

_handleHassUpdate() {
    // ✅ React to changes
    this._updateDisplay();
}
```

### 4. Cleanup

Always cleanup resources:

```javascript
disconnectedCallback() {
    if (this._cleanup) {
        this._cleanup();  // ✅ Release resources
    }
    super.disconnectedCallback();
}
```

## Testing

Create test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Simple Card Test</title>
    <script type="module" src="/dist/lcards.js"></script>
</head>
<body>
    <lcards-simple-button
        entity="light.bedroom"
        label="Test Button"
        preset="lozenge">
    </lcards-simple-button>
</body>
</html>
```

## Migration from V2

### Before (V2 - Complex)

```javascript
// ❌ Over-engineered
export class MyV2Card extends LCARdSV2Card {
    constructor() {
        super();
        this.systemsManager = new V2CardSystemsManager(this);
        // ... complex initialization
    }

    _applyOverlayPatch(patch) {
        // ... overlay logic (wrong abstraction)
    }
}
```

### After (Simple - Clean)

```javascript
// ✅ Clean and clear
export class MySimpleCard extends LCARdSSimpleCard {
    _renderCard() {
        const text = this.processTemplate(this.config.text);
        return html`<div>${text}</div>`;
    }
}
```

## Summary

Simple Card provides exactly what you need:
- ✅ Singleton access
- ✅ Template processing
- ✅ Style resolution
- ✅ Action handling
- ✅ Entity management

Nothing more, nothing less.
````

#### Step 4.2: Update Main Architecture Doc

**File**: `doc/architecture/README.md`

Add section after MSD description:

```markdown
## Simple Card Architecture

For single-purpose cards that don't need MSD's multi-overlay system, use the Simple Card foundation.

**Key Features**:
- Extends `LCARdSNativeCard` for HA integration
- Provides helper methods for common tasks
- Direct singleton system access
- No auto-subscriptions or magic behavior
- Explicit, predictable lifecycle

**Documentation**: See [simple-card-foundation.md](./simple-card-foundation.md)

**Example Cards**:
- `lcards-simple-button` - Button with actions and templates
- `lcards-simple-label` - Text display with templating
- `lcards-simple-status` - Entity status indicator
```

---

### Phase 5: Testing & Validation (0.5 days)

#### Step 5.1: Create Test File

**File**: `test/test-simple-card.html` (NEW)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LCARdS Simple Card Test</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 20px;
            background: #1a1a1a;
            color: #ffffff;
        }

        .test-section {
            margin: 40px 0;
            padding: 20px;
            border: 1px solid #333;
            border-radius: 4px;
        }

        .test-section h2 {
            margin-top: 0;
            color: #ff9900;
        }

        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .test-card {
            padding: 20px;
            background: #2a2a2a;
            border-radius: 4px;
        }

        .test-card h3 {
            margin-top: 0;
            color: #00ffff;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <h1>LCARdS Simple Card Foundation Tests</h1>

    <!-- Test 1: Basic Button -->
    <div class="test-section">
        <h2>Test 1: Basic Button</h2>
        <div class="test-grid">
            <div class="test-card">
                <h3>Default Style</h3>
                <lcards-simple-button
                    entity="light.test"
                    label="Test Button">
                </lcards-simple-button>
            </div>

            <div class="test-card">
                <h3>With Preset</h3>
                <lcards-simple-button
                    entity="light.test"
                    label="Lozenge Button"
                    preset="lozenge">
                </lcards-simple-button>
            </div>
        </div>
    </div>

    <!-- Test 2: Template Processing -->
    <div class="test-section">
        <h2>Test 2: Template Processing</h2>
        <div class="test-grid">
            <div class="test-card">
                <h3>JavaScript Template</h3>
                <lcards-simple-button
                    entity="light.test"
                    label="[[[return entity.state.toUpperCase()]]]">
                </lcards-simple-button>
            </div>

            <div class="test-card">
                <h3>Token Template</h3>
                <lcards-simple-button
                    entity="light.test"
                    label="{{entity.attributes.friendly_name}}">
                </lcards-simple-button>
            </div>
        </div>
    </div>

    <!-- Test 3: Actions -->
    <div class="test-section">
        <h2>Test 3: Actions</h2>
        <div class="test-grid">
            <div class="test-card">
                <h3>Toggle Action</h3>
                <lcards-simple-button
                    entity="light.test"
                    label="Toggle Light"
                    tap_action='{"action": "toggle"}'>
                </lcards-simple-button>
            </div>

            <div class="test-card">
                <h3>More Info Action</h3>
                <lcards-simple-button
                    entity="light.test"
                    label="Light Info"
                    tap_action='{"action": "more-info"}'>
                </lcards-simple-button>
            </div>
        </div>
    </div>

    <!-- Mock Home Assistant -->
    <script>
        // Create mock HASS instance
        window.hass = {
            states: {
                'light.test': {
                    entity_id: 'light.test',
                    state: 'on',
                    attributes: {
                        friendly_name: 'Test Light',
                        brightness: 255
                    }
                }
            },
            callService: (domain, service, data) => {
                console.log('Service call:', domain, service, data);

                // Mock toggle
                if (service === 'toggle') {
                    const entity = window.hass.states[data.entity_id];
                    if (entity) {
                        entity.state = entity.state === 'on' ? 'off' : 'on';
                        // Trigger update
                        document.querySelectorAll('lcards-simple-button').forEach(card => {
                            if (card.hass) {
                                card.hass = { ...window.hass };
                            }
                        });
                    }
                }
            },
            user: {
                name: 'Test User'
            }
        };

        // Initialize mock LCARdS core
        window.lcards = {
            core: {
                getThemeManager: () => ({
                    getToken: (path, fallback) => fallback
                }),
                getStylePresetManager: () => ({
                    getPreset: (type, name) => null
                }),
                rulesManager: {},
                animationManager: {},
                dataSourceManager: {},
                validationService: {},
                actionHandler: {}
            }
        };

        console.log('Mock HASS initialized:', window.hass);
    </script>

    <!-- Load LCARdS -->
    <script type="module" src="../dist/lcards.js"></script>

    <!-- Initialize cards with mock HASS -->
    <script type="module">
        // Wait for custom elements to be defined
        await customElements.whenDefined('lcards-simple-button');

        // Set HASS on all cards
        document.querySelectorAll('lcards-simple-button').forEach(card => {
            card.hass = window.hass;
        });

        console.log('Cards initialized with HASS');
    </script>
</body>
</html>
```

#### Step 5.2: Validation Checklist

Create checklist for validation:

```markdown
# Simple Card Validation Checklist

## Build Verification
- [ ] `npm run build` completes without errors
- [ ] No V2 imports in bundle
- [ ] Simple button card included in bundle
- [ ] No console errors on load

## Functionality Tests
- [ ] Button renders with SVG
- [ ] ButtonRenderer produces correct markup
- [ ] Tap action triggers service call
- [ ] Template processing works ([[[code]]])
- [ ] Token replacement works ({{token}})
- [ ] Entity state updates trigger re-render
- [ ] Style presets apply correctly
- [ ] Theme tokens resolve properly

## Integration Tests
- [ ] MSD card still works (unchanged)
- [ ] Singletons accessible from simple card
- [ ] Action handler works correctly
- [ ] Preview mode detection works
- [ ] Card picker shows simple button

## Cleanup Verification
- [ ] No V2 files in src/
- [ ] No V2 references in imports
- [ ] No V2 documentation
- [ ] Clean git status (only intended changes)
```

---

## 📊 Migration Impact Analysis

### Files Affected Summary

| Category | Files Changed | Lines Deleted | Lines Added |
|----------|--------------|---------------|-------------|
| Deleted | 6 | ~2,000 | 0 |
| New | 3 | 0 | ~800 |
| Modified | 2 | ~20 | ~30 |
| **Total** | **11** | **~2,020** | **~830** |

### Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Break MSD functionality | Low | MSD untouched, uses separate base class |
| Break existing cards | Low | Only V2 cards affected (none in production) |
| Compilation errors | Low | Clean deletion + new implementation |
| Testing coverage gaps | Medium | Comprehensive test HTML provided |
| Documentation gaps | Low | Full architecture doc included |

---

## 🎯 Success Criteria

### Must Have
- ✅ V2 architecture completely removed
- ✅ Simple Card foundation implemented
- ✅ Example button card working
- ✅ Clean build with no errors
- ✅ MSD card unchanged and functional
- ✅ Documentation complete

### Should Have
- ✅ Test HTML file functional
- ✅ Template processing working
- ✅ Action handling working
- ✅ Style presets accessible
- ✅ Theme tokens resolving

### Nice to Have
- 🎯 Additional simple card examples (label, status)
- 🎯 Migration guide for legacy templates
- 🎯 Performance benchmarks
- 🎯 Card picker screenshots

---

## 📝 Implementation Notes for Coding Agents

### Order of Operations

**CRITICAL**: Follow this exact order to avoid dependency issues:

1. **Phase 1: Cleanup**
   - Delete V2 files first
   - Update exports
   - Verify build

2. **Phase 2: Create Foundation**
   - Implement `LCARdSSimpleCard`
   - Update exports
   - Verify build

3. **Phase 3: Create Example**
   - Implement `lcards-simple-button`
   - Register in entry point
   - Verify build

4. **Phase 4: Documentation**
   - Create architecture doc
   - Update main README
   - Create test file

5. **Phase 5: Testing**
   - Run test HTML
   - Verify all checklist items
   - Create validation report

### Key Decision Points

1. **If ButtonRenderer integration fails**:
   - Fallback to direct SVG rendering
   - Log detailed error information
   - Create fallback button template

2. **If template processing fails**:
   - Ensure context object is complete
   - Check for syntax errors in templates
   - Verify entity state is available

3. **If action handling fails**:
   - Verify element exists before setup
   - Check action configuration format
   - Ensure HASS instance is valid

### Testing Strategy

**Unit Testing** (during development):
- Test template processor independently
- Test style resolver independently
- Test action setup independently

**Integration Testing** (after completion):
- Test with mock HASS instance
- Test with real Home Assistant (if available)
- Test in card picker
- Test in dashboard edit mode

**Validation Testing** (final check):
- Run full test suite
- Verify all checklist items
- Check console for errors/warnings
- Verify MSD unchanged

---

## 📋 Acceptance Criteria

This proposal is complete when:

1. ✅ All V2 files deleted
2. ✅ `LCARdSSimpleCard` implemented and working
3. ✅ `lcards-simple-button` implemented and rendering
4. ✅ Test HTML file functional
5. ✅ Documentation complete
6. ✅ Build completes without errors
7. ✅ MSD card unchanged and functional
8. ✅ All validation checklist items pass

---

## 🔄 Rollback Plan

If critical issues arise:

1. **Immediate**: Revert to last known good commit
2. **Identify**: Determine failure point (cleanup, foundation, or example)
3. **Fix**: Address specific issue
4. **Re-test**: Verify fix doesn't introduce new issues
5. **Resume**: Continue from fixed point

**Rollback Command**:
```bash
git reset --hard <commit-before-changes>
git clean -fd
npm run build
```

---

## ✅ Next Steps

1. **Review Proposal**: Stakeholder approval
2. **Assign Implementation**: Developer or coding agent
3. **Execute Phases**: Follow order strictly
4. **Validate**: Complete all checklist items
5. **Document**: Create completion report
6. **Deploy**: Merge to main branch

---

**End of Proposal**

This document provides complete, prescriptive guidance for removing the failed V2 architecture and implementing the clean Simple Card foundation. All file content, implementation steps, and validation procedures are included.