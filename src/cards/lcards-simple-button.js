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

import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSSimpleCard } from '../base/LCARdSSimpleCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';
import { deepMerge } from '../utils/deepMerge.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
import { escapeHtml } from '../utils/StringUtils.js';
import { TemplateParser } from '../core/templates/TemplateParser.js';

export class LCARdSSimpleButtonCard extends LCARdSSimpleCard {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'simple-button';

    static get properties() {
        return {
            ...super.properties,
            _buttonStyle: { type: Object, state: true }
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

                .button-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                }

                .button-svg {
                    display: block;
                    width: 200px;
                    height: 60px;
                    cursor: pointer;
                }

                .button-svg:hover {
                    opacity: 0.8;
                }

                /* These styles are now applied inline for dynamic rule-based changes
                   Removed !important to allow inline styles to work */
            `
        ];
    }

    constructor() {
        super();
        this._buttonStyle = null;
        this._lastActionElement = null; // Track last element actions were attached to
        this._containerSize = { width: 200, height: 56 }; // Default size (1-row HA grid cell = 56px), updated by ResizeObserver
        this._resizeObserver = null;
    }

    /**
     * Called when config is set (override from base class)
     * @protected
     */
    _onConfigSet(config) {
        super._onConfigSet(config);

        // Resolve button style early (before template processing)
        // This ensures _buttonStyle is populated with preset text fields
        // before _processCustomTemplates() tries to access them
        this._resolveButtonStyleSync();

        // Re-process templates now that button style is resolved
        // (The base class already called _processTemplates(), but _buttonStyle was null at that time)
        if (this._initialized) {
            this._scheduleTemplateUpdate();
        } else {
            // Not initialized yet - schedule it to happen after firstUpdated
            this._needsInitialTemplateProcessing = true;
        }

        // Re-setup actions if config changes after initial setup
        if (this._actionsInitialized) {
            lcardsLog.debug(`[LCARdSSimpleButtonCard] Config changed, re-setting up actions`);
            this.updateComplete.then(() => {
                this._setupButtonActions();
            });
        }
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
                lcardsLog.debug(`[LCARdSSimpleButtonCard] Entity state changed: ${oldState} -> ${newState}`, {
                    entityId: this.config.entity,
                    oldState,
                    newState,
                    entity: this._entity
                });

                // ✨ ENHANCEMENT: Re-resolve button style when entity state changes
                // This makes the button color update reactively (without requiring page refresh)
                // State-based colors are applied in _resolveButtonStyleSync()
                this._resolveButtonStyleSync();

                lcardsLog.debug(`[LCARdSSimpleButtonCard] Button style re-resolved after state change`);

                // Schedule template processing AFTER style resolution (so preset text fields are available)
                this._scheduleTemplateUpdate();
            }
        }
    }

    /**
     * Handle first update - setup initial state
     * @private
     */
    _handleFirstUpdate(changedProperties) {
        // Register this button with RulesEngine for dynamic styling
        // Tags: button type and preset (if any)
        const tags = ['button'];
        if (this.config.preset) {
            tags.push(this.config.preset);
        }
        if (this._entity) {
            tags.push('entity-based');
        }

        // ⭐ Merge custom tags from config
        if (this.config.tags && Array.isArray(this.config.tags)) {
            tags.push(...this.config.tags);
        }

        // ✅ SIMPLIFIED: Use card ID directly (no suffix)
        // If user sets id:my_button, overlay registers as "my_button" (not "my_button_button")
        const overlayId = this.config.id || this.config.entity || this._cardGuid;

        lcardsLog.debug(`[LCARdSSimpleButtonCard] Registering overlay with ID: ${overlayId}`, {
            hasConfigId: !!this.config.id,
            configId: this.config.id,
            hasEntity: !!this.config.entity,
            entity: this.config.entity,
            cardGuid: this._cardGuid,
            finalOverlayId: overlayId,
            tags: tags  // ⭐ Log tags for debugging
        });

        this._registerOverlayForRules(overlayId, tags);

        // Setup actions after DOM is ready (original simple approach)
        this.updateComplete.then(() => {
            this._setupButtonActions();
            this._actionsInitialized = true;
        });

        // ✨ Setup auto-sizing via base class (triggers requestUpdate on resize)
        this._setupAutoSizing();

        // Process initial templates if needed (after button style is resolved)
        if (this._needsInitialTemplateProcessing) {
            lcardsLog.debug(`[LCARdSSimpleButtonCard] Processing initial templates after firstUpdated`);
            this._scheduleTemplateUpdate();
            this._needsInitialTemplateProcessing = false;
        }
    }

    /**
     * Hook called after templates are processed (from base class)
     * @protected
     */
    _onTemplatesChanged() {
        // Resolve button style after templates change
        // Note: This may be called before singletons are initialized
        // In that case, _onConnected() will re-resolve styles
        this._resolveButtonStyleSync();
    }

    /**
     * Hook called when connected to DOM (after singletons initialized)
     * @protected
     */
    _onConnected() {
        super._onConnected();

        // CRITICAL: Re-resolve styles now that StylePresetManager is available
        // The initial _onTemplatesChanged() call happens before singletons are initialized,
        // so we must re-run style resolution here to pick up presets
        if (this.config.preset) {
            const hasStylePresetManager = !!this._singletons?.stylePresetManager;

            lcardsLog.debug(`[LCARdSSimpleButtonCard] Re-resolving styles after singletons initialized`, {
                hasStylePresetManager,
                preset: this.config.preset
            });

            if (hasStylePresetManager) {
                // StylePresetManager is available - resolve and render now
                this._resolveButtonStyleSync();
                this.requestUpdate();
            } else {
                // StylePresetManager not available yet - wait for it
                lcardsLog.debug(`[LCARdSSimpleButtonCard] Waiting for StylePresetManager to become available`);
                this._waitForStylePresetManager();
            }
        }
    }

    /**
     * Wait for StylePresetManager to become available and then re-resolve styles
     * @private
     */
    async _waitForStylePresetManager() {
        const maxAttempts = 50; // 5 seconds max
        const delayMs = 100;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Check if StylePresetManager is now available
            const core = window.lcards?.core;
            if (core?.getStylePresetManager && core.getStylePresetManager()) {
                // Update our singletons reference
                if (this._singletons) {
                    this._singletons.stylePresetManager = core.getStylePresetManager();
                }

                lcardsLog.debug(`[LCARdSSimpleButtonCard] StylePresetManager now available after ${attempt * delayMs}ms`);

                // Re-resolve styles with preset data
                this._resolveButtonStyleSync();

                // Trigger re-render
                this.requestUpdate();
                return;
            }

            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        lcardsLog.warn(`[LCARdSSimpleButtonCard] StylePresetManager did not become available after ${maxAttempts * delayMs}ms`);
    }

    /**
     * Hook called after rule patches change (from base class)
     * @protected
     */
    _onRulePatchesChanged() {
        // Re-resolve button style to merge new rule patches
        this._resolveButtonStyleSync();
    }

    /**
     * Hook called when config is updated by CoreConfigManager
     * Re-resolve button style to ensure _processedIcon and other cached values are up-to-date
     * @protected
     */
    _onConfigUpdated() {
        lcardsLog.debug(`[LCARdSSimpleButtonCard] Config updated by CoreConfigManager, re-resolving button style`);
        // Re-resolve button style with the new merged config
        this._resolveButtonStyleSync();
    }

    /**
     * Lit lifecycle - called after every render
     * Re-attach actions because Lit recreates DOM elements
     */
    updated(changedProperties) {
        super.updated(changedProperties);

        // Only re-attach actions if we have relevant changes and actions are initialized
        // This prevents excessive re-attachment on every render
        if (this._actionsInitialized) {
            const buttonElement = this.shadowRoot.querySelector('[data-overlay-id="simple-button"]');

            // Check if the button element exists and if we need to re-attach
            // (Lit recreates SVG on every render, so we need to re-attach)
            if (buttonElement && buttonElement !== this._lastActionElement) {
                lcardsLog.debug(`[LCARdSSimpleButtonCard] 🔄 Re-attaching actions after render (element changed)`);
                this._setupButtonActions();
                this._lastActionElement = buttonElement;
            }
        }
    }

    /**
     * Resolve button style with full priority chain
     *
     * Follows CB-LCARS schema:
     * - card.color.background.{active|inactive|unavailable}
     * - card.color.{active|inactive|unavailable} (for borders)
     * - text.{label|name|state}.color.{active|inactive|unavailable}
     *
     * **Style Priority (low to high):**
     * 1. Preset styles (if specified)
     * 2. Config styles (overrides preset) - DEEP MERGE
     * 3. Theme token resolution (including computed tokens)
     * 4. State-based defaults (only if not explicitly set)
     * 5. Rule patches (highest priority via _getMergedStyleWithRules)
     *
     * **Performance:**
     * - Uses JSON.stringify comparison to prevent unnecessary re-renders
     * - Only triggers requestUpdate() if style actually changed
     * - Called on: first update, HASS updates, rule patch changes
     *
     * **CRITICAL:** Always call `this.requestUpdate()` after style changes
     * to trigger Lit re-render. Without this, visual updates won't happen.
     *
     * @private
     */
    _resolveButtonStyleSync() {
        // 1. Start with preset (if specified)
        let style = {};

        // Check StylePresetManager availability - try singletons first, then global core
        const core = window.lcards?.core;
        const stylePresetManager = this._singletons?.stylePresetManager || core?.getStylePresetManager?.();

        lcardsLog.debug(`[LCARdSSimpleButtonCard] _resolveButtonStyleSync starting`, {
            hasPreset: !!this.config.preset,
            presetName: this.config.preset,
            hasGetStylePreset: typeof this.getStylePreset === 'function',
            hasSingletons: !!this._singletons,
            hasStylePresetManager: !!stylePresetManager,
            source: this._singletons?.stylePresetManager ? 'singletons' : (stylePresetManager ? 'core' : 'none')
        });

        if (this.config.preset) {
            // Check if StylePresetManager is available (either via singletons or core)
            if (!stylePresetManager) {
                lcardsLog.warn(`[LCARdSSimpleButtonCard] StylePresetManager not available yet, preset '${this.config.preset}' will be deferred`);
                // Return early - don't process anything until StylePresetManager is ready
                // This prevents rendering with incomplete/default values
                return;
            } else {
                const preset = this.getStylePreset('button', this.config.preset);
                lcardsLog.debug(`[LCARdSSimpleButtonCard] Preset lookup result`, {
                    presetName: this.config.preset,
                    presetFound: !!preset,
                    presetKeys: preset ? Object.keys(preset) : [],
                    hasBorder: preset?.border,
                    borderRadius: preset?.border?.radius
                });
                if (preset) {
                    // Deep copy preset to avoid mutation issues
                    style = deepMerge({}, preset);
                    lcardsLog.debug(`[LCARdSSimpleButtonCard] Applied preset '${this.config.preset}'`, {
                        borderRadius: preset.border?.radius,
                        borderWidth: preset.border?.width,
                        styleKeys: Object.keys(style)
                    });
                }
            }
        } else {
            lcardsLog.debug(`[LCARdSSimpleButtonCard] No preset specified, starting with empty style`);
        }

        // 2. DEEP merge config styles (config wins over preset)
        if (this.config.style) {
            lcardsLog.debug(`[LCARdSSimpleButtonCard] Merging config.style`, {
                hasBorder: !!this.config.style.border,
                borderRadius: this.config.style.border?.radius,
                borderWidth: this.config.style.border?.width
            });
            // First create a deep copy to avoid mutating the original config
            const configStyleCopy = JSON.parse(JSON.stringify(this.config.style));
            // Then resolve ALL tokens recursively (theme: and computed)
            const configWithTokens = resolveThemeTokensRecursive(configStyleCopy, this._singletons?.themeManager);
            // Then deep merge (handles nested objects)
            style = deepMerge(style, configWithTokens);
            lcardsLog.trace(`[LCARdSSimpleButtonCard] Deep merged config styles`);
        }

        // 3. Get current button state
        const buttonState = this._getButtonState();

        // 4. Apply state-based theme defaults (only if not explicitly set in config)
        // Use CB-LCARS nested schema: card.color.background.{state}
        if (!this._hasNestedValue(style, 'card.color.background', buttonState)) {

            let bgToken = `components.button.base.background.${buttonState}`;
            let backgroundColor = this.getThemeToken(bgToken);

            // If 'default' state not found in theme, fall back to 'active'
            if (!backgroundColor && buttonState === 'default') {
                bgToken = `components.button.base.background.active`;
                backgroundColor = this.getThemeToken(bgToken);
            }

            if (backgroundColor) {
                // Resolve computed tokens in the theme value
                const resolved = this._singletons?.themeManager?.resolver?.resolve(backgroundColor, backgroundColor) || backgroundColor;

                if (!style.card) style.card = {};
                if (!style.card.color) style.card.color = {};
                if (!style.card.color.background) style.card.color.background = {};
                style.card.color.background[buttonState] = resolved;

                lcardsLog.trace(`[LCARdSSimpleButtonCard] Applied theme default: card.color.background.${buttonState} = ${resolved}`);
            }
        }

        // Apply text color defaults using text.default.color.{state}
        if (!this._hasNestedValue(style, 'text.default.color', buttonState)) {

            let textToken = `components.button.base.text.default.color.${buttonState}`;
            let textColor = this.getThemeToken(textToken);

            // If 'default' state not found in theme, fall back to 'active'
            if (!textColor && buttonState === 'default') {
                textToken = `components.button.base.text.default.color.active`;
                textColor = this.getThemeToken(textToken);
            }

            if (textColor) {
                if (!style.text) style.text = {};
                if (!style.text.default) style.text.default = {};
                if (!style.text.default.color) style.text.default.color = {};
                style.text.default.color[buttonState] = textColor;

                lcardsLog.trace(`[LCARdSSimpleButtonCard] Applied theme default: text.default.color.${buttonState} = ${textColor}`);
            }
        }

        // Apply opacity for non-active states (only if entity exists and not set in config)
        if (this._entity && style.opacity === undefined) {
            if (buttonState === 'inactive') {
                style.opacity = 0.7;
            } else if (buttonState === 'unavailable') {
                style.opacity = 0.5;
            }
        }

        // 5. Merge with rules-based styles (rules have highest priority)
        let resolvedStyle = this._getMergedStyleWithRules(style);

        // Store current button state for rendering
        resolvedStyle._currentState = buttonState;

        // 6. Process icon configuration from preset/config
        this._processIconConfiguration(resolvedStyle);

        // Only update if changed (avoid unnecessary re-renders)
        if (!this._buttonStyle || JSON.stringify(this._buttonStyle) !== JSON.stringify(resolvedStyle)) {
            this._buttonStyle = resolvedStyle;
            lcardsLog.debug(`[LCARdSSimpleButtonCard] Button style resolved (state: ${buttonState}), triggering re-render`);
            this.requestUpdate(); // Trigger re-render to apply new styles
        }
    }

    /**
     * Process icon configuration from preset/config
     * Extracts icon-related properties and stores them for rendering
     * Handles both flat (legacy) and nested (new) icon config structures
     * Resolves state-based colors from theme tokens
     * @private
     */
    _processIconConfiguration(resolvedStyle) {
        // Determine show_icon
        // Priority: config.icon.show > config.show_icon > resolvedStyle.show_icon (from preset) > false (default)
        // Special case: if icon_only is true, implicitly set show_icon to true
        let show_icon = false;
        const iconOnlyMode = this.config.icon_only || resolvedStyle.icon_only || false;

        if (iconOnlyMode) {
            // icon_only mode implicitly requires showing the icon
            show_icon = true;
        } else if (typeof this.config.icon === 'object' && this.config.icon?.show !== undefined) {
            // Check nested icon.show first
            show_icon = this.config.icon.show;
        } else if (this.config.show_icon !== undefined) {
            show_icon = this.config.show_icon;
        } else if (resolvedStyle.show_icon !== undefined) {
            show_icon = resolvedStyle.show_icon;
        }

        // Determine icon name
        // Support both flat config.icon='mdi:star' and nested config.icon.icon='mdi:star'
        let iconName;
        if (typeof this.config.icon === 'string') {
            // Flat format: icon: 'mdi:star' or icon: 'entity'
            iconName = this.config.icon;
        } else if (typeof this.config.icon === 'object' && this.config.icon?.icon) {
            // Nested format: icon: { icon: 'mdi:star', ... }
            iconName = this.config.icon.icon;
        }
        // If no icon specified but show_icon is true and we have an entity, default to 'entity'
        else if (show_icon && this._entity && !iconName) {
            iconName = 'entity';
        }

        // Determine icon_area (where the icon's reserved space is)
        // Priority: config.icon_area > resolvedStyle.icon_area > 'left' (default)
        let iconArea = 'left'; // default
        if (this.config.icon_area !== undefined) {
            iconArea = this.config.icon_area;
        } else if (resolvedStyle.icon_area !== undefined) {
            iconArea = resolvedStyle.icon_area;
        }

        // Validate icon_area
        const validAreas = ['left', 'right', 'top', 'bottom', 'none'];
        if (!validAreas.includes(iconArea)) {
            lcardsLog.warn(`[LCARdSSimpleButtonCard] Invalid icon_area: ${iconArea}, defaulting to 'left'`);
            iconArea = 'left';
        }

        // Determine icon position WITHIN the icon area (or absolute if icon_area is 'none')
        // Priority: explicit x/y > explicit x_percent/y_percent > config.icon.position > resolvedStyle.icon.position > 'center' (default)
        let iconPosition = 'center'; // default - centered within area
        let explicitX = null, explicitY = null;
        let explicitXPercent = null, explicitYPercent = null;

        // Check for explicit coordinates first (highest priority)
        if (typeof this.config.icon === 'object') {
            if (this.config.icon.x !== undefined && this.config.icon.y !== undefined) {
                explicitX = this.config.icon.x;
                explicitY = this.config.icon.y;
            } else if (this.config.icon.x_percent !== undefined && this.config.icon.y_percent !== undefined) {
                explicitXPercent = this.config.icon.x_percent;
                explicitYPercent = this.config.icon.y_percent;
            } else if (this.config.icon.position) {
                iconPosition = this.config.icon.position;
            }
        }

        // Check resolved style (includes preset) if no explicit positioning
        if (!explicitX && !explicitXPercent && iconPosition === 'center' && resolvedStyle.icon?.position) {
            iconPosition = resolvedStyle.icon.position;
        }

        // Normalize position names (e.g., 'left' -> 'left-center', 'top' -> 'top-center')
        if (!explicitX && !explicitXPercent) {
            iconPosition = this._normalizePositionName(iconPosition);
        }

        // Resolve icon padding (same as text fields)
        // Priority: config > preset > 8 (default)
        let iconPadding = 8; // default
        if (typeof this.config.icon === 'object' && this.config.icon?.padding !== undefined) {
            // Check if padding is a number (simple padding) or object (directional padding)
            if (typeof this.config.icon.padding === 'number') {
                iconPadding = this.config.icon.padding;
            }
            // If it's an object, iconPadding stays at default; directional values extracted below
        } else if (resolvedStyle.icon?.padding !== undefined) {
            if (typeof resolvedStyle.icon.padding === 'number') {
                iconPadding = resolvedStyle.icon.padding;
            }
        }

        // Resolve directional icon padding (for area-based positioning)
        // Priority: config > preset > 0 (default)
        let iconPaddingLeft = 0;
        let iconPaddingRight = 0;
        let iconPaddingTop = 0;
        let iconPaddingBottom = 0;

        // Extract from config first
        if (typeof this.config.icon === 'object' && this.config.icon?.padding) {
            const configPadding = this.config.icon.padding;
            if (typeof configPadding === 'object') {
                iconPaddingLeft = configPadding.left ?? 0;
                iconPaddingRight = configPadding.right ?? 0;
                iconPaddingTop = configPadding.top ?? 0;
                iconPaddingBottom = configPadding.bottom ?? 0;
            }
        }
        // Fall back to preset if not in config
        else if (resolvedStyle.icon?.padding && typeof resolvedStyle.icon.padding === 'object') {
            iconPaddingLeft = resolvedStyle.icon.padding.left ?? 0;
            iconPaddingRight = resolvedStyle.icon.padding.right ?? 0;
            iconPaddingTop = resolvedStyle.icon.padding.top ?? 0;
            iconPaddingBottom = resolvedStyle.icon.padding.bottom ?? 0;
        }

        // Resolve icon rotation (same as text fields)
        // Priority: config > preset > 0 (default)
        let iconRotation = 0; // default
        if (typeof this.config.icon === 'object' && this.config.icon?.rotation !== undefined) {
            iconRotation = this.config.icon.rotation;
        } else if (resolvedStyle.icon?.rotation !== undefined) {
            iconRotation = resolvedStyle.icon.rotation;
        }

        // Store processed icon configuration
        // Parse the icon string to get type (mdi, si, entity) and icon name
        const parsedIcon = this._parseIconString(iconName);

        lcardsLog.debug('[LCARdSSimpleButtonCard] Icon parsing result:', {
            iconName,
            parsedIcon,
            hasEntity: !!this._entity,
            entityIcon: this._entity?.attributes?.icon
        });

        if (parsedIcon) {
            // Handle 'entity' icon - either type='entity' OR type='mdi' with icon='entity'
            // This covers both cases from base class _parseIconString
            if (parsedIcon.type === 'entity' || (parsedIcon.type === 'mdi' && parsedIcon.icon === 'entity')) {
                // Use HA's state-aware icon resolution (respects entity.attributes.icon + state-based defaults)
                const entityIcon = this._resolveEntityIcon(this._entity);

                lcardsLog.debug('[LCARdSSimpleButtonCard] Resolving entity icon:', {
                    entityId: this._entity?.entity_id,
                    entityState: this._entity?.state,
                    resolvedIcon: entityIcon,
                    timestamp: Date.now(),
                    note: 'Using HA stateIcon() for state-aware resolution'
                });
                // Re-parse the resolved entity icon to get its type (mdi/si) and name
                const resolvedParsed = this._parseIconString(entityIcon);
                if (resolvedParsed) {
                    lcardsLog.debug('[LCARdSSimpleButtonCard] Parsed icon result:', {
                        type: resolvedParsed.type,
                        icon: resolvedParsed.icon
                    });
                    parsedIcon.type = resolvedParsed.type;
                    parsedIcon.icon = resolvedParsed.icon;
                }
            }

            // Get current button state for state-based colors
            const buttonState = this._getButtonState();

            // Get theme tokens for icons
            const iconTokens = this._theme?.tokens?.components?.button?.base?.icon || {};

            // Resolve icon color with state-based fallback chain
            // Priority: config > preset > theme token (state-based) > text color (state-based) > hardcoded
            let iconColor;

            lcardsLog.debug('[LCARdSSimpleButtonCard] Icon color resolution:', {
                buttonState,
                'config.icon': this.config.icon,
                'resolvedStyle.icon': resolvedStyle.icon,
                'iconTokens.color': iconTokens.color,
                '_buttonStyle.text': this._buttonStyle?.text
            });

            // 1. Check explicit config color
            if (typeof this.config.icon === 'object' && this.config.icon?.color) {
                // Check if it's state-based (object with active/inactive keys)
                if (typeof this.config.icon.color === 'object') {
                    iconColor = this.config.icon.color[buttonState] ||
                               this.config.icon.color.default ||
                               this.config.icon.color.active;
                } else {
                    iconColor = this.config.icon.color;
                }
                lcardsLog.debug('[LCARdSSimpleButtonCard] Icon color from config:', iconColor);
            }
            // 2. Check preset/resolvedStyle color
            else if (resolvedStyle.icon?.color) {
                // Check if it's state-based
                if (typeof resolvedStyle.icon.color === 'object') {
                    iconColor = resolvedStyle.icon.color[buttonState] ||
                               resolvedStyle.icon.color.default ||
                               resolvedStyle.icon.color.active;
                } else {
                    iconColor = resolvedStyle.icon.color;
                }
                lcardsLog.debug('[LCARdSSimpleButtonCard] Icon color from preset/resolvedStyle:', iconColor);
            }
            // 3. Check theme token (can be state-based)
            else if (iconTokens.color) {
                if (typeof iconTokens.color === 'object') {
                    iconColor = iconTokens.color[buttonState] ||
                               iconTokens.color.default ||
                               iconTokens.color.active;
                    lcardsLog.debug('[LCARdSSimpleButtonCard] Icon color from theme token (state-based):', {
                        buttonState,
                        'iconTokens.color[buttonState]': iconTokens.color[buttonState],
                        'iconTokens.color.default': iconTokens.color.default,
                        'iconTokens.color.active': iconTokens.color.active,
                        resolved: iconColor
                    });
                } else {
                    iconColor = iconTokens.color;
                    lcardsLog.debug('[LCARdSSimpleButtonCard] Icon color from theme token (static):', iconColor);
                }
            }
            // 4. Fall back to text color (also state-based)
            else if (this._buttonStyle?.text?.default?.color) {
                const textColor = this._buttonStyle.text.default.color;
                if (typeof textColor === 'object') {
                    iconColor = textColor[buttonState] ||
                               textColor.default ||
                               textColor.active;
                } else {
                    iconColor = textColor;
                }
                lcardsLog.debug('[LCARdSSimpleButtonCard] Icon color from text color:', iconColor);
            }
            // 5. Final hardcoded fallback
            else {
                iconColor = 'var(--lcars-color-text, #FFFFFF)';
                lcardsLog.warn('[LCARdSSimpleButtonCard] Icon color using hardcoded fallback');
            }

            // Ensure iconColor is a string (not an object)
            if (typeof iconColor !== 'string') {
                console.warn('[LCARdSSimpleButtonCard] Icon color resolved to non-string:', iconColor);
                iconColor = 'var(--lcars-color-text, #FFFFFF)';
            }

            // Resolve icon size
            // Priority: config > preset > theme token > hardcoded
            let iconSize;
            if (typeof this.config.icon === 'object' && this.config.icon?.size) {
                iconSize = this.config.icon.size;
            } else if (resolvedStyle.icon?.size && typeof resolvedStyle.icon.size === 'number') {
                iconSize = resolvedStyle.icon.size;
            } else if (iconTokens.size && typeof iconTokens.size === 'number') {
                iconSize = iconTokens.size;
            } else {
                iconSize = 24; // hardcoded fallback
            }

            // Resolve icon spacing (space around icon for clamping calculation)
            // Priority: config > preset > theme token > hardcoded
            let iconSpacing;
            if (typeof this.config.icon === 'object' && this.config.icon?.spacing !== undefined) {
                iconSpacing = this.config.icon.spacing;
            } else if (resolvedStyle.icon?.spacing !== undefined) {
                iconSpacing = resolvedStyle.icon.spacing;
            } else if (iconTokens.spacing !== undefined) {
                iconSpacing = iconTokens.spacing;
            } else {
                iconSpacing = 8; // hardcoded fallback
            }

            // Resolve layout spacing (spacing around icon area for auto-size calculation)
            // Priority: config > preset > theme token > hardcoded
            let layoutSpacing;
            if (typeof this.config.icon === 'object' && this.config.icon?.layout_spacing !== undefined) {
                layoutSpacing = this.config.icon.layout_spacing;
            } else if (resolvedStyle.icon?.layout_spacing !== undefined) {
                layoutSpacing = resolvedStyle.icon.layout_spacing;
            } else if (iconTokens.layout_spacing !== undefined) {
                layoutSpacing = iconTokens.layout_spacing;
            } else {
                layoutSpacing = 8; // hardcoded fallback
            }

            // Resolve icon area size (width for left/right, height for top/bottom)
            // Priority: config.icon_area_size > config.icon.area_size > preset.icon_area_size > preset.icon.area_size > auto-calculated from size
            let iconAreaSize;
            if (this.config.icon_area_size !== undefined) {
                // Top-level icon_area_size (matches icon_area schema)
                iconAreaSize = this.config.icon_area_size;
            } else if (typeof this.config.icon === 'object' && this.config.icon?.area_size) {
                // Nested icon.area_size (alternate format)
                iconAreaSize = this.config.icon.area_size;
            } else if (resolvedStyle.icon_area_size !== undefined) {
                // Preset top-level icon_area_size
                iconAreaSize = resolvedStyle.icon_area_size;
            } else if (resolvedStyle.icon?.area_size && typeof resolvedStyle.icon.area_size === 'number') {
                // Preset nested icon.area_size
                iconAreaSize = resolvedStyle.icon.area_size;
            }
            // If not specified, will be auto-calculated in _generateIconMarkup based on size + spacing + divider

            // Resolve divider settings (renamed from "interior" for clarity)
            // Priority: config > preset > theme token > hardcoded
            let dividerWidth, dividerColor;

            // Divider width
            if (typeof this.config.icon === 'object' && this.config.icon?.divider?.width !== undefined) {
                dividerWidth = this.config.icon.divider.width;
            } else if (typeof this.config.icon === 'object' && this.config.icon?.interior?.width !== undefined) {
                // Legacy support for "interior" name
                dividerWidth = this.config.icon.interior.width;
            } else if (resolvedStyle.icon?.divider?.width !== undefined) {
                dividerWidth = resolvedStyle.icon.divider.width;
            } else if (resolvedStyle.icon?.interior?.width !== undefined) {
                // Legacy support for "interior" name
                dividerWidth = resolvedStyle.icon.interior.width;
            } else if (iconTokens.interior?.width !== undefined) {
                dividerWidth = iconTokens.interior.width;
            } else {
                dividerWidth = 6; // hardcoded fallback
            }

            // Divider color
            if (typeof this.config.icon === 'object' && this.config.icon?.divider?.color) {
                dividerColor = this.config.icon.divider.color;
            } else if (typeof this.config.icon === 'object' && this.config.icon?.interior?.color) {
                // Legacy support for "interior" name
                dividerColor = this.config.icon.interior.color;
            } else if (resolvedStyle.icon?.divider?.color) {
                dividerColor = resolvedStyle.icon.divider.color;
            } else if (resolvedStyle.icon?.interior?.color) {
                // Legacy support for "interior" name
                dividerColor = resolvedStyle.icon.interior.color;
            } else if (iconTokens.interior?.color) {
                dividerColor = iconTokens.interior.color;
            } else {
                dividerColor = 'black'; // hardcoded fallback
            }

            // Resolve icon background (optional badge/indicator style)
            // Priority: config > preset > null (no background by default)
            let iconBackground = null;
            const configBg = typeof this.config.icon === 'object' ? this.config.icon.background : null;
            const presetBg = resolvedStyle.icon?.background;

            if (configBg || presetBg) {
                const bgSource = configBg || presetBg;
                iconBackground = {};

                // Background color (state-based)
                if (bgSource.color) {
                    if (typeof bgSource.color === 'object') {
                        iconBackground.color = bgSource.color[buttonState] ||
                                             bgSource.color.default ||
                                             bgSource.color.active ||
                                             'transparent';
                    } else {
                        iconBackground.color = bgSource.color;
                    }
                } else {
                    iconBackground.color = 'transparent';
                }

                // Background radius
                if (bgSource.radius !== undefined) {
                    iconBackground.radius = bgSource.radius;
                } else {
                    iconBackground.radius = 4; // default square with slight rounding
                }

                // Background padding (space between icon and background edge)
                if (bgSource.padding !== undefined) {
                    iconBackground.padding = bgSource.padding;
                } else {
                    iconBackground.padding = 4; // default
                }
            }

            this._processedIcon = {
                type: parsedIcon.type,
                icon: parsedIcon.icon,

                // Icon area configuration (where reserved space is)
                area: iconArea,      // 'left', 'right', 'top', 'bottom', or 'none'

                // Position WITHIN the icon area (or absolute if area is 'none')
                position: iconPosition,  // Named position (normalized)
                x: explicitX,            // Explicit x coordinate
                y: explicitY,            // Explicit y coordinate
                x_percent: explicitXPercent,  // Percentage x position
                y_percent: explicitYPercent,  // Percentage y position
                padding: iconPadding,         // Padding around icon (for centered/named positions)
                padding_left: iconPaddingLeft,     // Directional padding (for area-based positioning)
                padding_right: iconPaddingRight,   // Directional padding
                padding_top: iconPaddingTop,       // Directional padding
                padding_bottom: iconPaddingBottom, // Directional padding
                rotation: iconRotation,       // Rotation angle in degrees

                // Visual properties
                size: iconSize,      // Visual icon size
                spacing: iconSpacing, // Space around icon (affects clamping and area calculation)
                layoutSpacing: layoutSpacing, // Spacing around icon area for auto-size calculation
                areaSize: iconAreaSize, // Area size (width for left/right, height for top/bottom) - optional, auto-calculated if not set
                color: iconColor,    // State-resolved color

                // Background (badge style)
                background: iconBackground,  // { color, radius, padding } or null

                // Divider (legacy feature)
                divider: {           // Renamed from "interior" for clarity
                    width: dividerWidth,
                    color: dividerColor
                },

                // Display control
                show: show_icon,
                iconOnly: iconOnlyMode  // Support icon-only mode (hides text)
            };
        } else {
            this._processedIcon = null;
        }
    }

    /**
     * Override base class _processIcon() to prevent it from overwriting
     * the icon configuration we've already processed via _processIconConfiguration()
     *
     * The base class's _processIcon() doesn't understand presets and would
     * reset the icon position to 'left' instead of using the preset's position.
     *
     * @override
     */
    async _processIcon() {
        // Button card handles icon processing in _processIconConfiguration()
        // which is called from _resolveButtonStyleSync() and properly handles
        // preset icon configuration including position.
        // Do nothing here to prevent base class from overwriting it.
        lcardsLog.trace(`[LCARdSSimpleButtonCard] _processIcon called (no-op, using _processIconConfiguration instead)`);
    }

    /**
     * Process custom templates for multi-text system
     * Override base class hook to handle text.{fieldId}.content templates
     * @protected
     * @override
     */
    async _processCustomTemplates() {
        lcardsLog.debug(`[LCARdSSimpleButtonCard] _processCustomTemplates called for ${this._cardGuid}`);

        // Track if any templates changed to avoid unnecessary re-renders
        let hasChanges = false;

        // Ensure this.config.text exists
        if (!this.config.text) {
            this.config.text = {};
        }

        // First, merge in preset text fields that aren't in config
        // This ensures preset templates get processed too
        const presetTextFields = this._buttonStyle?.text || {};

        lcardsLog.debug(`[LCARdSSimpleButtonCard] Merging preset text fields`, {
            presetFieldIds: Object.keys(presetTextFields),
            configFieldIds: Object.keys(this.config.text),
            cardGuid: this._cardGuid
        });

        for (const [fieldId, presetFieldConfig] of Object.entries(presetTextFields)) {
            // Skip 'default' - it's configuration, not a field
            if (fieldId === 'default' || !presetFieldConfig || typeof presetFieldConfig !== 'object') {
                continue;
            }

            // If field doesn't exist in config, add it from preset
            if (!this.config.text[fieldId]) {
                this.config.text[fieldId] = { ...presetFieldConfig };
                lcardsLog.debug(`[LCARdSSimpleButtonCard] Added preset field '${fieldId}' to config`, {
                    content: presetFieldConfig.content,
                    cardGuid: this._cardGuid
                });
                hasChanges = true; // Mark as changed since we added a field
            } else {
                // Field exists in config - merge preset properties as defaults
                // Only add preset properties that aren't in the config
                const configField = this.config.text[fieldId];
                let fieldChanged = false;

                for (const [propKey, propValue] of Object.entries(presetFieldConfig)) {
                    if (configField[propKey] === undefined && propValue !== undefined) {
                        configField[propKey] = propValue;
                        fieldChanged = true;

                        lcardsLog.debug(`[LCARdSSimpleButtonCard] Merged preset property '${propKey}' into field '${fieldId}'`, {
                            value: propValue,
                            cardGuid: this._cardGuid
                        });
                    }
                }

                if (fieldChanged) {
                    hasChanges = true;
                }
            }
        }

        // Process multi-text field templates (now includes both config and preset fields)
        if (this.config.text && typeof this.config.text === 'object') {
            for (const [fieldId, fieldConfig] of Object.entries(this.config.text)) {
                // Skip 'default' - it's configuration, not a field
                if (fieldId === 'default' || !fieldConfig || typeof fieldConfig !== 'object') {
                    continue;
                }

                // Process template if enabled (default is true)
                const shouldTemplate = fieldConfig.template !== false;
                if (shouldTemplate && fieldConfig.content) {
                    lcardsLog.debug(`[LCARdSSimpleButtonCard] Processing template for field '${fieldId}'`, {
                        originalContent: fieldConfig.content,
                        cardGuid: this._cardGuid
                    });

                    const processedContent = await this.processTemplate(fieldConfig.content);

                    lcardsLog.debug(`[LCARdSSimpleButtonCard] Template processed for field '${fieldId}'`, {
                        originalContent: fieldConfig.content,
                        processedContent,
                        changed: this.config.text[fieldId].content !== processedContent,
                        cardGuid: this._cardGuid
                    });

                    // Check if content actually changed
                    if (this.config.text[fieldId].content !== processedContent) {
                        // Store processed content back in config for rendering
                        // (This modifies config in-place, which is safe since it's already been merged)
                        this.config.text[fieldId].content = processedContent;
                        hasChanges = true;
                    }
                }
            }
        }

        lcardsLog.debug(`[LCARdSSimpleButtonCard] _processCustomTemplates complete`, {
            hasChanges,
            finalFieldIds: Object.keys(this.config.text),
            cardGuid: this._cardGuid
        });

        if (hasChanges) {
            // Extract and track entities from templates for auto-updates
            this._updateTrackedEntities();

            lcardsLog.debug(`[LCARdSSimpleButtonCard] Multi-text templates processed for ${this._cardGuid}`);

            // Call subclass hook for style resolution after template changes
            if (typeof this._onTemplatesChanged === 'function') {
                this._onTemplatesChanged();
            }
        }
    }

    /**
     * Extract and track entities from templates (override base class)
     * Tracks dependencies from multi-text field templates
     * @private
     * @override
     */
    _updateTrackedEntities() {
        // Call parent to get base tracking (primary entity)
        super._updateTrackedEntities();

        const trackedEntities = new Set(this._trackedEntities || []);

        // Add multi-text field templates
        if (this.config.text && typeof this.config.text === 'object') {
            for (const [fieldId, fieldConfig] of Object.entries(this.config.text)) {
                if (fieldId === 'default' || !fieldConfig?.content) continue;

                const template = fieldConfig.content;
                if (typeof template === 'string') {
                    const deps = TemplateParser.extractDependencies(template);
                    deps.forEach(entityId => trackedEntities.add(entityId));
                }
            }
        }

        this._trackedEntities = Array.from(trackedEntities);

        lcardsLog.trace(`[LCARdSSimpleButtonCard] Tracking ${this._trackedEntities.length} entities for ${this._cardGuid}:`, this._trackedEntities);
    }

    /**
     * Translate HA entity state to button state
     * Uses base class _classifyEntityState() for standardized state classification
     * @private
     * @returns {string} Button state: 'active', 'inactive', 'unavailable', or 'default'
     */
    _getButtonState() {
        return this._classifyEntityState(this._entity);
    }

    /**
     * Setup action handlers on the rendered button
     * @private
     */
    /**
     * Setup action handlers on the rendered button
     * Uses base class shadow-DOM-aware action system
     * @private
     */
    _setupButtonActions() {
        if (!this.hass) {
            lcardsLog.trace(`[LCARdSSimpleButtonCard] HASS not available yet, deferring action setup`);
            return;
        }

        // Clean up previous actions
        if (this._actionCleanup) {
            this._actionCleanup();
            this._actionCleanup = null;
        }

        // Find the button group element in shadow DOM
        const buttonElement = this.shadowRoot.querySelector('[data-overlay-id="simple-button"]');

        if (!buttonElement) {
            lcardsLog.trace(`[LCARdSSimpleButtonCard] Button element not found yet`);
            return;
        }

        // Build action configuration
        const actions = {
            tap_action: this.config.tap_action || { action: 'toggle' },
            hold_action: this.config.hold_action,
            double_tap_action: this.config.double_tap_action
        };

        // Get AnimationManager from core singletons (may not be ready yet)
        // Use getter function for late binding
        const getAnimationManager = () => {
            // Try singletons first (card instance)
            if (this._singletons?.animationManager) {
                return this._singletons.animationManager;
            }
            // Fall back to global singleton
            return window.lcards?.core?.animationManager;
        };

        // Build elementId for animation targeting
        const elementId = `simple-button-${this._cardGuid}`;

        // Use base class method to setup actions
        this._actionCleanup = this.setupActions(
            buttonElement,
            actions,
            {
                animationManager: getAnimationManager(),
                getAnimationManager,
                elementId: elementId,
                entity: this.config.entity,
                animations: this.config.animations
            }
        );

        lcardsLog.trace(`[LCARdSSimpleButtonCard] Actions attached successfully`);
    }

    /**
     * Button-specific animation setup configuration
     * @returns {Object} Animation setup for buttons
     * @protected
     */
    _getAnimationSetup() {
        return {
            overlayId: `simple-button-${this._cardGuid}`,
            elementSelector: '[data-overlay-id="simple-button"]'
        };
    }    /**
     * Render the button card
     * @protected
     */
    _renderCard() {
        if (!this._initialized) {
            return super._renderCard();
        }

        // If we have a preset but haven't resolved styles yet, wait
        // This prevents rendering with default/incomplete values
        if (this.config.preset && !this._buttonStyle) {
            lcardsLog.debug(`[LCARdSSimpleButtonCard] Delaying render - waiting for preset resolution: ${this.config.preset}`);
            return html`<div class="lcards-card">Loading preset...</div>`;
        }

        // Return a promise-based template for async rendering
        return this._renderButtonContent();
    }

    /**
     * Render button content
     * @private
     */
    _renderButtonContent() {
        lcardsLog.trace(`[LCARdSSimpleButtonCard] Rendering button for ${this._overlayId}`);

        // ✨ Use container size if available, otherwise config or defaults
        // This enables auto-sizing for HA grid cards and responsive layouts
        const width = this.config.width || this._containerSize?.width || 200;
        const height = this.config.height || this._containerSize?.height || 56;

        lcardsLog.debug(`[LCARdSSimpleButtonCard] Size resolution:`, {
            'config.width': this.config.width,
            'config.height': this.config.height,
            '_containerSize': this._containerSize,
            'final width': width,
            'final height': height
        });

        // Build button configuration
        const buttonConfig = {
            id: 'simple-button',
            label: this._processedTexts.label,
            content: this._processedTexts.content,
            texts: this._processedTexts.texts,
            preset: this.config.preset, // Pass preset for corner radius calculation
            style: this._buttonStyle,
            size: [width, height]
        };

        // Render synchronously with fallback SVG
        try {
            const svgMarkup = this._generateSimpleButtonSVG(width, height, buttonConfig);

            // Add cache-busting comment to force DOM update when style changes
            const timestamp = Date.now();

            return html`
                <div class="button-container" data-render-time="${timestamp}">
                    ${unsafeHTML(svgMarkup)}
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
     * Generate inline SVG for button rendering
     *
     * **CRITICAL DESIGN DECISION:** Uses inline styles instead of CSS classes
     *
     * **Why Inline Styles:**
     * 1. ✅ Evaluated fresh on every render (picks up variable changes)
     * 2. ✅ No browser caching issues with `<style>` blocks
     * 3. ✅ No CSS specificity problems
     * 4. ✅ No `!important` conflicts
     * 5. ✅ Works with Lit's re-rendering system
     *
     * **Why NOT CSS Classes:**
     * - ❌ Browser caches `<style>` blocks even when SVG regenerates
     * - ❌ CSS class definitions are static (don't change when variables change)
     * - ❌ `!important` rules block inline style overrides
     * - ❌ No way to dynamically update without full DOM replacement
     *
     * **Style Variables:**
     * - `primary`: Background color (from resolved style with rule patches)
     * - `textColor`: Text color (from resolved style with rule patches)
     *
     * Both are interpolated directly into style strings, ensuring rule-based
     * changes are immediately reflected in the rendered SVG.
     *
     * @param {number} width - SVG width
     * @param {number} height - SVG height
     * @param {Object} config - Button configuration (preset, label)
     * @returns {string} SVG markup string
     * @private
     */
    /**
     * Generate icon markup using flexible positioning system (like text fields)
     * Supports explicit coordinates, percentages, named positions, padding, rotation, and backgrounds
     *
     * @param {Object} iconConfig - Processed icon configuration
     * @param {number} buttonWidth - Button width
     * @param {number} buttonHeight - Button height
     * @returns {Object} { markup: string, widthUsed: 0 } - Icon markup and width (always 0 for flexible positioning)
     * @private
     */
    _generateFlexibleIconMarkup(iconConfig, buttonWidth, buttonHeight) {
        if (!iconConfig) return { markup: '', widthUsed: 0 };

        const iconSize = iconConfig.size || 24;
        const iconColor = iconConfig.color || 'currentColor';
        const padding = iconConfig.padding || 0;
        const rotation = iconConfig.rotation || 0;
        const background = iconConfig.background; // { color, radius, padding } or null

        // Calculate icon position
        let iconX, iconY;

        // Priority 1: Explicit coordinates
        if (iconConfig.x !== null && iconConfig.y !== null) {
            iconX = iconConfig.x;
            iconY = iconConfig.y;
        }
        // Priority 2: Percentage coordinates
        else if (iconConfig.x_percent !== null && iconConfig.y_percent !== null) {
            iconX = (buttonWidth * iconConfig.x_percent) / 100;
            iconY = (buttonHeight * iconConfig.y_percent) / 100;
        }
        // Priority 3: Named position
        else {
            // Use text positioning system (icons positioned like text)
            const textAreaBounds = {
                left: 0,
                width: buttonWidth,
                height: buttonHeight
            };
            const position = this._calculateNamedPosition(iconConfig.position, textAreaBounds, padding);

            // Icons are centered on their position point (unlike text which uses anchor/baseline)
            // So we offset by half the icon size
            iconX = position.x - (iconSize / 2);
            iconY = position.y - (iconSize / 2);
        }

        // Generate icon name string
        const iconName = iconConfig.type === 'entity'
            ? (this._entity?.attributes?.icon || 'mdi:help-circle')
            : `${iconConfig.type}:${iconConfig.icon}`;

        // Generate background if configured
        let backgroundMarkup = '';
        if (background && background.color && background.color !== 'transparent') {
            const bgPadding = background.padding || 4;
            const bgSize = iconSize + (bgPadding * 2);
            const bgX = iconX - bgPadding;
            const bgY = iconY - bgPadding;
            const bgRadius = background.radius || 4;

            // Convert percentage radius to pixels (for circular backgrounds like '50%')
            const radiusValue = typeof bgRadius === 'string' && bgRadius.endsWith('%')
                ? (bgSize * parseFloat(bgRadius)) / 100
                : bgRadius;

            backgroundMarkup = `
                <rect x="${bgX}" y="${bgY}"
                      width="${bgSize}" height="${bgSize}"
                      rx="${radiusValue}" ry="${radiusValue}"
                      fill="${background.color}"
                      class="icon-background" />
            `;
        }

        // Generate icon element
        const iconElement = `
            <foreignObject x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}">
                <ha-icon xmlns="http://www.w3.org/1999/xhtml"
                         icon="${iconName}"
                         style="width: ${iconSize}px; height: ${iconSize}px; --mdc-icon-size: ${iconSize}px; color: ${iconColor}; display: flex; align-items: center; justify-content: center;"></ha-icon>
            </foreignObject>
        `;

        // Apply rotation if specified
        const rotationTransform = rotation !== 0
            ? `transform="rotate(${rotation} ${iconX + iconSize / 2} ${iconY + iconSize / 2})"`
            : '';

        const markup = `
            <g class="icon-group flexible-position"
               data-position="${iconConfig.position || 'custom'}"
               ${rotationTransform}>
                ${backgroundMarkup}
                ${iconElement}
            </g>
        `.trim();

        // Flexible icons don't consume text area width
        return { markup, widthUsed: 0 };
    }

    /**
     * Generate icon markup for area-based positioning (left/right with divider)
     * Creates reserved space with divider, positions icon within that area using icon.position
     *
     * @param {Object} iconConfig - Processed icon configuration
     * @param {number} buttonWidth - Button width
     * @param {number} buttonHeight - Button height
     * @returns {Object} { markup: string, widthUsed: number } - Icon markup and horizontal space used
     * @private
     */
    _generateAreaBasedIconMarkup(iconConfig, buttonWidth, buttonHeight) {
        // Handle null/undefined iconConfig
        if (!iconConfig) {
            return { markup: '', widthUsed: 0 };
        }

        const iconArea = iconConfig.area || 'left';

        // Route to appropriate implementation based on area orientation
        if (iconArea === 'top' || iconArea === 'bottom') {
            // Top/bottom areas use horizontal divider
            return this._generateIconMarkupTopBottom(iconConfig, buttonWidth, buttonHeight, iconArea);
        } else {
            // Left/right areas use vertical divider (existing implementation)
            const legacyPosition = iconArea === 'right' ? 'right' : 'left';
            return this._generateIconMarkup(iconConfig, buttonWidth, buttonHeight, legacyPosition);
        }
    }

    /**
     * Generate icon markup for top/bottom area-based positioning with horizontal divider
     * @private
     */
    _generateIconMarkupTopBottom(iconConfig, buttonWidth, buttonHeight, area) {
        if (!iconConfig) return { markup: '', widthUsed: 0 };

        const requestedSize = iconConfig.size || 24; // Visual icon size
        const spacing = iconConfig.spacing ?? 8; // Space around icon

        // Divider settings from iconConfig (already resolved with priority chain)
        const dividerWidth = iconConfig.divider?.width ?? 6;
        const dividerColor = iconConfig.divider?.color ?? 'black';

        // Get padding values (defaults to 0)
        const paddingLeft = iconConfig.padding_left || 0;
        const paddingRight = iconConfig.padding_right || 0;
        const paddingTop = iconConfig.padding_top || 0;
        const paddingBottom = iconConfig.padding_bottom || 0;

        // Get button border/stroke width from button style
        const buttonBorder = this._buttonStyle?.border || this._buttonStyle?.card?.border || {};
        const strokeWidth = buttonBorder.width !== undefined ? parseInt(buttonBorder.width) : 2;

        const availableHeight = buttonHeight - (strokeWidth * 2);
        const availableWidth = buttonWidth - (strokeWidth * 2);

        // Get icon position within area (e.g., 'left', 'center', 'right', 'top-left', etc.)
        const iconPosition = iconConfig.position || 'center';

        // Calculate icon area total height
        let iconAreaHeight;
        if (iconConfig.areaSize) {
            // Use explicit area size (height for top/bottom areas)
            iconAreaHeight = iconConfig.areaSize;
        } else {
            // Auto-calculate area height using layout spacing from config/preset/theme
            const layoutSpacing = iconConfig.layoutSpacing || 8;
            iconAreaHeight = requestedSize + layoutSpacing * 2 + dividerWidth;
        }

        // Constrain icon to fit within button WIDTH (with configurable spacing)
        const maxIconWidth = availableWidth - (spacing * 2);
        const actualIconSize = Math.min(requestedSize, maxIconWidth);

        // Calculate icon area content height (excluding the divider)
        const iconAreaContentHeight = iconAreaHeight - dividerWidth;

        // Determine horizontal position within button
        let iconX;
        if (iconPosition.includes('left')) {
            // Align to left edge
            iconX = strokeWidth + spacing + paddingLeft;
        } else if (iconPosition.includes('right')) {
            // Align to right edge
            iconX = strokeWidth + availableWidth - actualIconSize - spacing - paddingRight;
        } else {
            // Center horizontally
            iconX = strokeWidth + (availableWidth - actualIconSize) / 2 + paddingLeft - paddingRight;
        }

        // Determine vertical position within icon area
        let iconYOffset;
        if (iconPosition.includes('top')) {
            // Align to top of icon area
            iconYOffset = spacing + paddingTop;
        } else if (iconPosition.includes('bottom')) {
            // Align to bottom of icon area
            iconYOffset = iconAreaContentHeight - actualIconSize - spacing - paddingBottom;
        } else {
            // Center vertically within icon area
            iconYOffset = (iconAreaContentHeight - actualIconSize) / 2 + paddingTop - paddingBottom;
        }

        // Position icon vertically based on area placement
        let iconY, dividerY;
        if (area === 'top') {
            iconY = strokeWidth + iconYOffset;
            dividerY = strokeWidth + iconAreaContentHeight;
        } else { // bottom
            iconY = strokeWidth + availableHeight - iconAreaHeight + dividerWidth + iconYOffset;
            dividerY = strokeWidth + availableHeight - iconAreaHeight;
        }

        // Horizontal divider positioning
        // Account for border stroke width - divider should NOT overlap with border strokes
        // Left border stroke fills space from x=0 to x=strokeWidth
        // Right border stroke fills space from x=(width-strokeWidth) to x=width
        // Divider should start after left border ends and end before right border starts
        const dividerX = strokeWidth;
        const dividerLength = buttonWidth - (strokeWidth * 2);

        // Determine icon type and rendering
        let iconElement = '';
        if (iconConfig.type === 'entity' || iconConfig.type === 'mdi' || iconConfig.type === 'si') {
            const iconName = iconConfig.type === 'entity'
                ? (this._entity?.attributes?.icon || 'mdi:help-circle')
                : `${iconConfig.type}:${iconConfig.icon}`;

            // Calculate rotation transform if needed
            const rotation = iconConfig.rotation || 0;
            const rotationTransform = rotation !== 0
                ? `transform: rotate(${rotation}deg);`
                : '';

            iconElement = `
                <foreignObject x="${iconX}" y="${iconY}" width="${actualIconSize}" height="${actualIconSize}">
                    <ha-icon xmlns="http://www.w3.org/1999/xhtml"
                             icon="${iconName}"
                             style="width: ${actualIconSize}px; height: ${actualIconSize}px; --mdc-icon-size: ${actualIconSize}px; color: ${iconConfig.color || 'currentColor'}; display: flex; align-items: center; justify-content: center; ${rotationTransform}"></ha-icon>
                </foreignObject>`;
        }

        const markup = `
            <g class="icon-group" data-position="${area}">
                <!-- Horizontal divider line between icon and text -->
                <rect
                    class="icon-divider"
                    x="${dividerX}"
                    y="${dividerY}"
                    width="${dividerLength}"
                    height="${dividerWidth}"
                    style="fill: ${dividerColor};"
                />
                ${iconElement}
            </g>
        `.trim();

        // Return height used instead of width for top/bottom
        return { markup, widthUsed: 0, heightUsed: iconAreaHeight };
    }

    /**
     * LEGACY: Generate icon markup for left/right area-based positioning
     * @deprecated - Will be replaced by _generateAreaBasedIconMarkup with proper icon.position support
     * @private
     */
    _generateIconMarkup(iconConfig, buttonWidth, buttonHeight, position) {
        if (!iconConfig) return { markup: '', widthUsed: 0 };

        const requestedSize = iconConfig.size || 24; // Visual icon size
        const spacing = iconConfig.spacing ?? 8; // Space around icon (configurable!)

        // Divider settings from iconConfig (already resolved with priority chain)
        const dividerWidth = iconConfig.divider?.width ?? 6;
        const dividerColor = iconConfig.divider?.color ?? 'black';

        // Get padding values (defaults to 0)
        const paddingLeft = iconConfig.padding_left || 0;
        const paddingRight = iconConfig.padding_right || 0;
        const paddingTop = iconConfig.padding_top || 0;
        const paddingBottom = iconConfig.padding_bottom || 0;

        // Get button border/stroke width from button style
        // Check resolved button style for border width
        const buttonBorder = this._buttonStyle?.border || this._buttonStyle?.card?.border || {};
        const strokeWidth = buttonBorder.width !== undefined ? parseInt(buttonBorder.width) : 2;

        const availableHeight = buttonHeight - (strokeWidth * 2);
        const availableWidth = buttonWidth - (strokeWidth * 2);

        // Icon-only mode: center the icon, no divider
        const iconOnly = iconConfig.iconOnly;

        let iconX, iconY, dividerX, dividerY, dividerHeight, iconAreaWidth;

        if (iconOnly) {
            // In icon-only mode, center the icon and use no divider
            // Constrain icon to fit within button bounds with spacing
            const maxIconHeight = availableHeight - (spacing * 2);
            const maxIconWidth = availableWidth - (spacing * 2);
            const actualIconSize = Math.min(requestedSize, maxIconHeight, maxIconWidth);

            // Center horizontally and vertically with padding
            iconX = strokeWidth + (availableWidth - actualIconSize) / 2 + paddingLeft - paddingRight;
            iconY = strokeWidth + (availableHeight - actualIconSize) / 2 + paddingTop - paddingBottom;

            // No divider in icon-only mode
            dividerX = null;
            iconAreaWidth = 0; // Icon doesn't consume text space

            // Determine icon type and rendering
            let iconElement = '';
            if (iconConfig.type === 'entity' || iconConfig.type === 'mdi' || iconConfig.type === 'si') {
                // Resolve 'entity' type to actual entity icon
                const iconName = iconConfig.type === 'entity'
                    ? (this._entity?.attributes?.icon || 'mdi:help-circle')
                    : `${iconConfig.type}:${iconConfig.icon}`;

                // Debug logging for entity icon resolution
                if (iconConfig.type === 'entity') {
                    lcardsLog.debug('[LCARdSSimpleButtonCard] Icon-only mode - Resolving entity icon:', {
                        entityId: this._entity?.entity_id,
                        entityIcon: this._entity?.attributes?.icon,
                        resolvedIconName: iconName
                    });
                }

                // Calculate rotation transform if needed
                const rotation = iconConfig.rotation || 0;
                const rotationTransform = rotation !== 0
                    ? `transform: rotate(${rotation}deg);`
                    : '';

                iconElement = `
                    <foreignObject x="${iconX}" y="${iconY}" width="${actualIconSize}" height="${actualIconSize}">
                        <ha-icon xmlns="http://www.w3.org/1999/xhtml"
                                 icon="${iconName}"
                                 style="width: ${actualIconSize}px; height: ${actualIconSize}px; --mdc-icon-size: ${actualIconSize}px; color: ${iconConfig.color || 'currentColor'}; display: flex; align-items: center; justify-content: center; ${rotationTransform}"></ha-icon>
                    </foreignObject>`;
            }

            const markup = `
                <g class="icon-group" data-position="center">
                    ${iconElement}
                </g>
            `.trim();

            return { markup, widthUsed: iconAreaWidth };

        } else {
            // Normal mode: position icon within its area with divider

            // Get icon position within area (e.g., 'top', 'center', 'bottom', 'top-left', etc.)
            const iconPosition = iconConfig.position || 'center';

            // Calculate icon area total width
            // Option 1: Use explicit area_size from config if provided
            // Option 2: Auto-calculate based on requested icon size and divider
            if (iconConfig.areaSize) {
                iconAreaWidth = iconConfig.areaSize;
            } else {
                // Auto-calculate area width using layout spacing from config/preset/theme
                // This provides consistent horizontal layout regardless of vertical spacing setting
                // Vertical spacing (iconConfig.spacing) only affects icon SIZE clamping
                const layoutSpacing = iconConfig.layoutSpacing || 8;
                iconAreaWidth = requestedSize + layoutSpacing * 2 + dividerWidth;
            }

            // Constrain icon to fit within button HEIGHT (with configurable spacing)
            // This is the actual rendered icon size - using configurable spacing
            const maxIconHeight = availableHeight - (spacing * 2);
            const actualIconSize = Math.min(requestedSize, maxIconHeight);

            // Calculate icon area content width (excluding the divider)
            const iconAreaContentWidth = iconAreaWidth - dividerWidth;

            // Determine horizontal position within icon area
            let iconXOffset;
            if (iconPosition.includes('left')) {
                // Align to left edge of icon area
                iconXOffset = spacing + paddingLeft;
            } else if (iconPosition.includes('right')) {
                // Align to right edge of icon area
                iconXOffset = iconAreaContentWidth - actualIconSize - spacing - paddingRight;
            } else {
                // Center horizontally within icon area
                iconXOffset = (iconAreaContentWidth - actualIconSize) / 2 + paddingLeft - paddingRight;
            }

            // Determine vertical position within button
            if (iconPosition.includes('top')) {
                // Align to top of button
                iconY = strokeWidth + spacing + paddingTop;
            } else if (iconPosition.includes('bottom')) {
                // Align to bottom of button
                iconY = strokeWidth + availableHeight - actualIconSize - spacing - paddingBottom;
            } else {
                // Center vertically within button
                iconY = strokeWidth + (availableHeight - actualIconSize) / 2 + paddingTop - paddingBottom;
            }

            // Position icon horizontally (from button interior edge)
            iconX = position === 'left'
                ? strokeWidth + iconXOffset
                : availableWidth + strokeWidth - iconAreaWidth + dividerWidth + iconXOffset;

            // Divider positioning - account for border inset and stroke width
            // Borders are drawn with centered strokes, so they occupy full strokeWidth of space
            const strokeInset = strokeWidth / 2;

            // Position divider X at the boundary between icon area and text area
            // For left position: divider is at the right edge of icon area
            // For right position: divider is at the left edge of icon area
            // The icon area starts at strokeInset (aligned with left border inset)
            dividerX = position === 'left'
                ? strokeInset + iconAreaContentWidth
                : buttonWidth - strokeInset - iconAreaWidth;

            // Divider Y and height - should NOT overlap with border strokes
            // Top border stroke fills space from y=0 to y=strokeWidth
            // Bottom border stroke fills space from y=(height-strokeWidth) to y=height
            // Divider should start after top border ends and end before bottom border starts
            dividerY = strokeWidth;
            dividerHeight = buttonHeight - (strokeWidth * 2);

            // Determine icon type and rendering
            let iconElement = '';
            if (iconConfig.type === 'entity' || iconConfig.type === 'mdi' || iconConfig.type === 'si') {
                // Resolve 'entity' type to actual entity icon
                const iconName = iconConfig.type === 'entity'
                    ? (this._entity?.attributes?.icon || 'mdi:help-circle')
                    : `${iconConfig.type}:${iconConfig.icon}`;

                // Debug logging for entity icon resolution
                if (iconConfig.type === 'entity') {
                    lcardsLog.debug('[LCARdSSimpleButtonCard] Normal mode - Resolving entity icon:', {
                        entityId: this._entity?.entity_id,
                        entityIcon: this._entity?.attributes?.icon,
                        resolvedIconName: iconName
                    });
                }

                // Calculate rotation transform if needed
                // Rotation is around the center of the icon
                const rotation = iconConfig.rotation || 0;
                const rotationTransform = rotation !== 0
                    ? `transform: rotate(${rotation}deg);`
                    : '';

                iconElement = `
                    <foreignObject x="${iconX}" y="${iconY}" width="${actualIconSize}" height="${actualIconSize}">
                        <ha-icon xmlns="http://www.w3.org/1999/xhtml"
                                 icon="${iconName}"
                                 style="width: ${actualIconSize}px; height: ${actualIconSize}px; --mdc-icon-size: ${actualIconSize}px; color: ${iconConfig.color || 'currentColor'}; display: flex; align-items: center; justify-content: center; ${rotationTransform}"></ha-icon>
                    </foreignObject>`;
            }

            const markup = `
                <g class="icon-group" data-position="${position}">
                    <!-- Divider line between icon and text -->
                    <rect
                        class="icon-divider"
                        x="${dividerX}"
                        y="${dividerY}"
                        width="${dividerWidth}"
                        height="${dividerHeight}"
                        style="fill: ${dividerColor};"
                    />
                    ${iconElement}
                </g>
            `.trim();

            return { markup, widthUsed: iconAreaWidth };
        }
    }

    /**
     * Generate SVG markup for a simple button
     * @param {number} width - SVG width
     * @param {number} height - SVG height
     * @param {Object} config - Button configuration (preset, label)
     * @returns {string} SVG markup string
     * @private
     */
    _generateSimpleButtonSVG(width, height, config) {
        // Read styling from _buttonStyle (resolved from preset/tokens)
        // Use CB-LCARS nested schema (v1.14.18+)
        const buttonState = this._buttonStyle?._currentState || this._getButtonState();

        // Background color: card.color.background.{state}
        const backgroundColor = this._buttonStyle?.card?.color?.background?.[buttonState] ||
                               this._buttonStyle?.card?.color?.background?.default ||
                               'var(--lcars-orange, #FF9900)';

        // Text color: text.default.color.{state}
        const textColor = this._buttonStyle?.text?.default?.color?.[buttonState] ||
                         this._buttonStyle?.text?.default?.color?.default ||
                         'var(--lcars-color-text, #FFFFFF)';

        // Border color: border.color.{state} or border.color (plain string)
        const borderColor = this._buttonStyle?.border?.color?.[buttonState] ||
                           this._buttonStyle?.border?.color?.default ||
                           this._buttonStyle?.border?.color ||
                           'var(--lcars-color-secondary, #000000)';

        // Font properties: text.default.font_*
        const fontSize = this._buttonStyle?.text?.default?.font_size || '14px';
        const fontWeight = this._buttonStyle?.text?.default?.font_weight || 'bold';
        const fontFamily = this._buttonStyle?.text?.default?.font_family || "'LCARS', 'Antonio', sans-serif";

        const text = config.label || 'LCARdS Button';

        // Resolve border configuration with per-corner support
        const border = this._resolveBorderConfiguration();

        // Clamp corner radii to half the button height to prevent overlapping
        // This ensures lozenge/bullet buttons create perfect half-circles
        const maxRadius = height / 2;
        border.topLeft = Math.min(border.topLeft, maxRadius);
        border.topRight = Math.min(border.topRight, maxRadius);
        border.bottomRight = Math.min(border.bottomRight, maxRadius);
        border.bottomLeft = Math.min(border.bottomLeft, maxRadius);
        border.radius = Math.min(border.radius, maxRadius);

        // Generate icon markup if present
        const iconArea = this._processedIcon?.area || 'left';
        const iconPosition = this._processedIcon?.position || 'center';

        // Determine rendering mode based on icon_area
        // area: 'none' → Flexible positioning (icon positioned like text)
        // area: left/right → Area-based with vertical divider
        // area: top/bottom → Area-based with horizontal divider (future)
        const usesIconArea = this._processedIcon && iconArea !== 'none';

        // Check if icon uses explicit coordinates (always flexible)
        const hasExplicitCoords = this._processedIcon && (
            this._processedIcon.x !== null ||
            this._processedIcon.x_percent !== null
        );

        let iconData = { markup: '', widthUsed: 0 };  // Default to empty icon
        if (this._processedIcon) {
            if (!usesIconArea || hasExplicitCoords) {
                // Flexible positioning: icon_area is 'none' or explicit coordinates
                iconData = this._generateFlexibleIconMarkup(this._processedIcon, width, height);
            } else {
                // Area-based positioning: icon_area is left/right/top/bottom
                iconData = this._generateAreaBasedIconMarkup(this._processedIcon, width, height);
            }
        }

        // Calculate text position accounting for icon area
        let textX = width / 2;
        if (usesIconArea && iconData.widthUsed > 0) {
            const textAreaWidth = width - iconData.widthUsed;
            const textAreaStart = iconArea === 'left' ? iconData.widthUsed : 0;
            textX = textAreaStart + (textAreaWidth / 2);
        }

        // Determine if we need complex path rendering
        const needsComplexPath = border.hasIndividualRadius || border.hasIndividualSides;

        // Check for custom SVG path first (chevrons, trapezoids, etc.)
        const customPathData = this._getCustomPath(this._buttonStyle);

        // Normalize custom path if provided
        let normalizedPath = null;
        if (customPathData) {
            normalizedPath = this._normalizePathTo100(
                customPathData.path,
                customPathData.preserveAspectRatio
            );
        }

        // Generate button background (fill only, no stroke)
        const backgroundMarkup = normalizedPath
            ? this._renderCustomPathBackground(normalizedPath, backgroundColor)
            : needsComplexPath
                ? this._renderComplexButtonPath(width, height, border, backgroundColor)
                : this._renderSimpleButtonRect(width, height, border, backgroundColor);

        // Generate separate border paths for clean corner joins
        const borderMarkup = this._renderIndividualBorderPaths(width, height, border);

        // ViewBox no longer needs expansion for stroke overhang
        // Borders are now inset by strokeWidth/2, keeping them fully within natural dimensions
        // This replicates CSS border behavior where borders are drawn "inside" the box
        const viewBoxX = 0;
        const viewBoxY = 0;
        const viewBoxWidth = width;
        const viewBoxHeight = height;

        // Check if we're in icon-only mode (hide text when icon is shown)
        const iconOnly = this._processedIcon?.iconOnly && this._processedIcon?.show;

        // Generate text markup using multi-text system
        let textMarkup = '';
        if (!iconOnly) {
            // Resolve text configuration (handles legacy label and new text object)
            const textFields = this._resolveTextConfiguration();

            // Process text fields (resolve positions, colors, etc.)
            const processedFields = this._processTextFields(textFields, width, height, this._processedIcon);

            // Generate SVG text elements
            textMarkup = this._generateTextElements(processedFields);
        }

        const svgString = `
            <svg width="${width}" height="${height}" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">
                <g data-button-id="simple-button"
                   data-overlay-id="simple-button"
                   class="button-group"
                   style="pointer-events: visiblePainted; cursor: pointer;">
                    ${backgroundMarkup}
                    ${borderMarkup}
                    ${iconData.markup}
                    ${textMarkup}
                </g>
            </svg>
        `.trim();

        return svgString;
    }

    /**
     * Resolve border configuration from button style
     * Uses nested CB-LCARS schema only: border.{width|radius|color}
     * @private
     * @returns {Object} Border configuration
     */
    _resolveBorderConfiguration() {
        // Helper to resolve CSS variables to actual values
        const resolveCSSVariable = (value) => {
            if (!value || typeof value !== 'string') return value;

            // Check if it's a CSS variable
            const varMatch = value.match(/^var\((--[^,)]+)(?:,\s*(.+))?\)$/);
            if (!varMatch) return value;

            const varName = varMatch[1];
            const fallbackValue = varMatch[2];

            // Try to get computed value from document root
            if (typeof getComputedStyle !== 'undefined') {
                const computedValue = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
                if (computedValue) {
                    return computedValue;
                }
            }

            // Use fallback if provided
            if (fallbackValue) {
                return fallbackValue.trim();
            }

            return value;
        };

        // Helper to parse radius values (handles numbers, CSS vars, theme tokens, and pixel strings)
        const parseRadius = (value, fallback) => {
            if (value === undefined || value === null) return fallback;

            // If it's already a number, use it
            if (typeof value === 'number') return value;

            const stringValue = String(value);

            // Resolve theme tokens (e.g., "theme:components.button.base.radius.full")
            let resolved = stringValue;
            if (stringValue.startsWith('theme:')) {
                if (this._singletons?.themeManager?.resolver) {
                    const tokenPath = stringValue.replace('theme:', '');
                    resolved = this._singletons.themeManager.resolver.resolve(tokenPath, stringValue);
                    lcardsLog.trace(`[LCARdSSimpleButtonCard] Resolved theme token "${stringValue}" -> "${resolved}"`);
                } else {
                    lcardsLog.warn(`[LCARdSSimpleButtonCard] Cannot resolve theme token "${stringValue}" - ThemeManager not available {hasSingletons: ${!!this._singletons}, hasThemeManager: ${!!this._singletons?.themeManager}, hasResolver: ${!!this._singletons?.themeManager?.resolver}}`);
                }
            }

            // Then resolve CSS variables (e.g., "var(--ha-card-border-radius, 34px)")
            resolved = resolveCSSVariable(resolved);

            // Try to parse as number (handles "25" or "25px")
            const parsed = parseFloat(resolved);
            return isNaN(parsed) ? fallback : parsed;
        };

        // Helper to parse width values (handles numbers, theme tokens, and pixel strings like "3px")
        const parseWidth = (value, fallback) => {
            if (value === undefined || value === null) return fallback;

            // If it's already a number, use it
            if (typeof value === 'number') return value;

            const stringValue = String(value);

            // Resolve theme tokens first
            let resolved = stringValue;
            if (stringValue.startsWith('theme:')) {
                if (this._singletons?.themeManager?.resolver) {
                    const tokenPath = stringValue.replace('theme:', '');
                    resolved = this._singletons.themeManager.resolver.resolve(tokenPath, stringValue);
                } else {
                    lcardsLog.warn(`[LCARdSSimpleButtonCard] Cannot resolve theme token "${stringValue}" - ThemeManager not available`);
                }
            }

            // Then resolve CSS variables
            resolved = resolveCSSVariable(resolved);

            // Try to parse as number (handles "3" or "3px")
            const parsed = parseFloat(resolved);
            return isNaN(parsed) ? fallback : parsed;
        };

        // Get current state for state-based colors
        const state = this._getButtonState();

        // Width: border.width (can be object for per-side or single value)
        let globalWidth = 2;
        const nestedWidth = this._buttonStyle?.border?.width;
        if (nestedWidth !== undefined && typeof nestedWidth !== 'object') {
            globalWidth = parseWidth(nestedWidth, 2);
        }

        // Per-side widths (border.width.{side})
        const perSideWidth = {
            top: parseWidth(nestedWidth?.top, globalWidth),
            right: parseWidth(nestedWidth?.right, globalWidth),
            bottom: parseWidth(nestedWidth?.bottom, globalWidth),
            left: parseWidth(nestedWidth?.left, globalWidth)
        };
        const hasPerSideWidth = typeof nestedWidth === 'object' && (
            nestedWidth.top !== undefined ||
            nestedWidth.right !== undefined ||
            nestedWidth.bottom !== undefined ||
            nestedWidth.left !== undefined
        );

        // Color: border.color.{state} or border.color (plain string)
        const nestedColor = this._buttonStyle?.border?.color;
        let globalColor = 'var(--lcars-color-secondary, #000000)';
        if (nestedColor !== undefined) {
            if (typeof nestedColor === 'object') {
                // Try state, then 'default', then 'active', then hardcoded fallback
                globalColor = nestedColor[state] || nestedColor.default || nestedColor.active || globalColor;
            } else {
                globalColor = nestedColor;
            }
        }

        // Radius: border.radius (can be object for per-corner or single value)
        let globalRadius = 20;
        const nestedRadius = this._buttonStyle?.border?.radius;

        lcardsLog.debug('[LCARdSSimpleButtonCard] Border radius resolution:', {
            nestedRadius,
            isObject: typeof nestedRadius === 'object'
        });

        if (nestedRadius !== undefined && typeof nestedRadius !== 'object') {
            globalRadius = parseRadius(nestedRadius, 20);
        }

        // Check for individual corner radii (border.radius.{corner})
        const hasIndividualRadius = !!(
            this._buttonStyle?.border?.radius?.top_left !== undefined ||
            this._buttonStyle?.border?.radius?.top_right !== undefined ||
            this._buttonStyle?.border?.radius?.bottom_left !== undefined ||
            this._buttonStyle?.border?.radius?.bottom_right !== undefined
        );

        // Check for individual border sides (border.{side})
        const borderTop = this._buttonStyle?.border?.top;
        const borderRight = this._buttonStyle?.border?.right;
        const borderBottom = this._buttonStyle?.border?.bottom;
        const borderLeft = this._buttonStyle?.border?.left;

        const hasIndividualSides = !!(borderTop || borderRight || borderBottom || borderLeft);

        // Process individual sides (border.{side}.width and border.{side}.color)
        const individualSides = {
            top: borderTop ? {
                width: parseWidth(borderTop.width, globalWidth),
                color: borderTop.color || globalColor
            } : null,
            right: borderRight ? {
                width: parseWidth(borderRight.width, globalWidth),
                color: borderRight.color || globalColor
            } : null,
            bottom: borderBottom ? {
                width: parseWidth(borderBottom.width, globalWidth),
                color: borderBottom.color || globalColor
            } : null,
            left: borderLeft ? {
                width: parseWidth(borderLeft.width, globalWidth),
                color: borderLeft.color || globalColor
            } : null
        };

        // Resolve individual corner radii from nested schema
        const topLeft = parseRadius(
            this._buttonStyle?.border?.radius?.top_left,
            globalRadius
        );
        const topRight = parseRadius(
            this._buttonStyle?.border?.radius?.top_right,
            globalRadius
        );
        const bottomRight = parseRadius(
            this._buttonStyle?.border?.radius?.bottom_right,
            globalRadius
        );
        const bottomLeft = parseRadius(
            this._buttonStyle?.border?.radius?.bottom_left,
            globalRadius
        );

        lcardsLog.debug('[LCARdSSimpleButtonCard] Parsed corner radii:', {
            topLeft,
            topRight,
            bottomRight,
            bottomLeft,
            globalRadius,
            rawTopLeft: this._buttonStyle?.border?.radius?.top_left
        });

        return {
            // Global values
            width: globalWidth,
            color: globalColor,
            radius: parseRadius(globalRadius, 20),

            // Per-side widths (border.width.{side})
            perSideWidth: hasPerSideWidth ? perSideWidth : null,
            hasPerSideWidth,

            // Individual corner radii
            topLeft,
            topRight,
            bottomRight,
            bottomLeft,

            // Individual border sides (border.{side}.width and color)
            individualSides: hasIndividualSides ? individualSides : null,

            // Flags
            hasIndividualRadius,
            hasIndividualSides
        };
    }

    /**
     * Parse and resolve text configuration for multi-text label system
     * Supports both legacy `label` property and new `text` object with arbitrary field IDs
     * @private
     */
    _resolveTextConfiguration() {
        const config = this.config || {};

        // Parse text object with arbitrary field IDs
        const textConfig = config.text || {};
        const resolvedFields = {};

        // Extract user-defined defaults from text.default
        const userDefaults = textConfig.default || {};

        // Get preset text fields from resolved button style
        const presetTextFields = this._buttonStyle?.text || {};

        // Default positions for preset fields
        // NOTE: Only specify position here. Anchor/baseline should come from named position calculation!
        const presetDefaults = {
            label: { position: userDefaults.position || this._buttonStyle?.text?.default?.position || 'center' },
            name: { position: 'top-left' },
            state: { position: 'bottom-right' }
        };

        // Collect all field IDs from both config and preset
        const allFieldIds = new Set([
            ...Object.keys(textConfig),
            ...Object.keys(presetTextFields)
        ]);

        // Process each text field (from config OR preset)
        for (const fieldId of allFieldIds) {
            // Skip 'default' - it's configuration, not a field to render
            if (fieldId === 'default') continue;

            const fieldConfig = textConfig[fieldId] || {};
            const presetFieldConfig = presetTextFields[fieldId] || {};

            // Skip if both are not objects (shouldn't happen, but safety check)
            if (typeof fieldConfig !== 'object' && typeof presetFieldConfig !== 'object') continue;

            // Get preset defaults if this is a known field
            const presetDefault = presetDefaults[fieldId] || {};

            // Resolve field configuration with defaults
            // Priority: config field-specific > preset field-specific > text.default > theme default > hardcoded fallback
            resolvedFields[fieldId] = {
                id: fieldId,
                content: fieldConfig.content || presetFieldConfig.content || '',
                position: fieldConfig.position || presetFieldConfig.position || presetDefault.position || null,
                x: fieldConfig.x !== undefined ? fieldConfig.x : (presetFieldConfig.x !== undefined ? presetFieldConfig.x : null),
                y: fieldConfig.y !== undefined ? fieldConfig.y : (presetFieldConfig.y !== undefined ? presetFieldConfig.y : null),
                x_percent: fieldConfig.x_percent !== undefined ? fieldConfig.x_percent : (presetFieldConfig.x_percent !== undefined ? presetFieldConfig.x_percent : null),
                y_percent: fieldConfig.y_percent !== undefined ? fieldConfig.y_percent : (presetFieldConfig.y_percent !== undefined ? presetFieldConfig.y_percent : null),
                padding: fieldConfig.padding !== undefined ? fieldConfig.padding : (presetFieldConfig.padding !== undefined ? presetFieldConfig.padding : 8),
                size: fieldConfig.font_size || fieldConfig.size || presetFieldConfig.font_size || presetFieldConfig.size || userDefaults.font_size || this._buttonStyle?.text?.default?.font_size || 14,
                color: fieldConfig.color || presetFieldConfig.color || userDefaults.color || null, // null means use default
                font_weight: fieldConfig.font_weight || presetFieldConfig.font_weight || userDefaults.font_weight || this._buttonStyle?.text?.default?.font_weight || 'normal',
                font_family: fieldConfig.font_family || presetFieldConfig.font_family || userDefaults.font_family || this._buttonStyle?.text?.default?.font_family || "'LCARS', 'Antonio', sans-serif",
                text_transform: fieldConfig.text_transform || presetFieldConfig.text_transform || userDefaults.text_transform || this._buttonStyle?.text?.default?.text_transform || 'none',
                anchor: fieldConfig.anchor || presetFieldConfig.anchor || presetDefault.anchor || null,
                baseline: fieldConfig.baseline || presetFieldConfig.baseline || presetDefault.baseline || null,
                rotation: fieldConfig.rotation !== undefined ? fieldConfig.rotation : (presetFieldConfig.rotation !== undefined ? presetFieldConfig.rotation : 0),
                show: fieldConfig.show !== undefined ? fieldConfig.show : (presetFieldConfig.show !== undefined ? presetFieldConfig.show : true),
                template: fieldConfig.template !== undefined ? fieldConfig.template : (presetFieldConfig.template !== undefined ? presetFieldConfig.template : true)
            };
        }

        return resolvedFields;
    }

    /**
     * Calculate the available text area bounds excluding icon area and divider
     * @private
     */
    _calculateTextAreaBounds(buttonWidth, buttonHeight, iconConfig) {
        // No icon - text uses full button area
        if (!iconConfig || !iconConfig.show) {
            return {
                left: 0,
                width: buttonWidth,
                height: buttonHeight
            };
        }

        // Get icon area placement (left/right/top/bottom/none)
        const iconArea = iconConfig.area || 'left';

        // If icon_area is 'none', icon doesn't reserve space
        if (iconArea === 'none') {
            return {
                left: 0,
                width: buttonWidth,
                height: buttonHeight
            };
        }

        // Calculate icon area size (width for left/right, height for top/bottom)
        const dividerWidth = iconConfig.divider?.width || 6;
        let iconAreaSize;
        if (iconConfig.areaSize) {
            iconAreaSize = iconConfig.areaSize;
        } else {
            // Auto-calculate: icon size + layout spacing + divider
            const iconSize = iconConfig.size || 24;
            const layoutSpacing = iconConfig.layoutSpacing || 8;
            iconAreaSize = iconSize + layoutSpacing * 2 + dividerWidth;
        }

        // For left/right areas, adjust horizontal bounds
        if (iconArea === 'left') {
            // Icon on left: text area is right side excluding icon and divider
            return {
                left: iconAreaSize + dividerWidth,
                top: 0,
                width: buttonWidth - iconAreaSize - dividerWidth,
                height: buttonHeight
            };
        } else if (iconArea === 'right') {
            // Icon on right: text area is left side excluding icon and divider
            return {
                left: 0,
                top: 0,
                width: buttonWidth - iconAreaSize - dividerWidth,
                height: buttonHeight
            };
        } else if (iconArea === 'top') {
            // Icon on top: text area is bottom excluding icon and divider
            return {
                left: 0,
                top: iconAreaSize + dividerWidth,
                width: buttonWidth,
                height: buttonHeight - iconAreaSize - dividerWidth
            };
        } else if (iconArea === 'bottom') {
            // Icon on bottom: text area is top excluding icon and divider
            return {
                left: 0,
                top: 0,
                width: buttonWidth,
                height: buttonHeight - iconAreaSize - dividerWidth
            };
        }

        // Fallback: full width
        return {
            left: 0,
            top: 0,
            width: buttonWidth,
            height: buttonHeight
        };
    }

    /**
     * Normalize position name to handle synonyms
     * Maps edge shortcuts to full centered positions:
     * - 'left' → 'left-center'
     * - 'right' → 'right-center'
     * - 'top' → 'top-center'
     * - 'bottom' → 'bottom-center'
     *
     * @param {string} position - Position name (e.g., 'left', 'top-left', 'center')
     * @returns {string} Normalized position name
     * @private
     */
    _normalizePositionName(position) {
        if (!position || typeof position !== 'string') {
            return position;
        }

        const synonyms = {
            'left': 'left-center',
            'right': 'right-center',
            'top': 'top-center',
            'bottom': 'bottom-center'
        };

        return synonyms[position] || position;
    }

    /**
     * Calculate coordinates for a named text position with padding
     * @private
     */
    _calculateNamedPosition(position, textAreaBounds, padding) {
        // Normalize position name (handle synonyms like 'left' → 'left-center')
        position = this._normalizePositionName(position);

        // Parse padding (support simple number or directional object)
        const parsePadding = (p) => {
            if (typeof p === 'number') {
                return { top: p, right: p, bottom: p, left: p };
            }
            return {
                top: p?.top ?? 8,
                right: p?.right ?? 8,
                bottom: p?.bottom ?? 8,
                left: p?.left ?? 8
            };
        };

        const pad = parsePadding(padding);
        const { left, top = 0, width, height } = textAreaBounds;

        // Calculate positions relative to text area (with vertical offset for top/bottom icon areas)
        const positions = {
            'center': {
                x: left + (width / 2),
                y: top + (height / 2),
                anchor: 'middle',
                baseline: 'middle'  // 'middle' is more visually centered than 'central'
            },
            'top-left': {
                x: left + pad.left,
                y: top + pad.top,
                anchor: 'start',
                baseline: 'hanging'
            },
            'top-right': {
                x: left + width - pad.right,
                y: top + pad.top,
                anchor: 'end',
                baseline: 'hanging'
            },
            'top-center': {
                x: left + (width / 2),
                y: top + pad.top,
                anchor: 'middle',
                baseline: 'hanging'
            },
            'bottom-left': {
                x: left + pad.left,
                y: top + height - pad.bottom,
                anchor: 'start',
                baseline: 'alphabetic'
            },
            'bottom-right': {
                x: left + width - pad.right,
                y: top + height - pad.bottom,
                anchor: 'end',
                baseline: 'alphabetic'
            },
            'bottom-center': {
                x: left + (width / 2),
                y: top + height - pad.bottom,
                anchor: 'middle',
                baseline: 'alphabetic'
            },
            'left-center': {
                x: left + pad.left,
                y: top + (height / 2),
                anchor: 'start',
                baseline: 'middle'  // 'middle' is more visually centered than 'central'
            },
            'right-center': {
                x: left + width - pad.right,
                y: top + (height / 2),
                anchor: 'end',
                baseline: 'middle'  // 'middle' is more visually centered than 'central'
            }
        };

        return positions[position] || positions['center'];
    }

    /**
     * Process text fields and calculate final positions and styling
     * @private
     */
    _processTextFields(textFields, buttonWidth, buttonHeight, iconConfig) {
        const processedFields = [];
        const textAreaBounds = this._calculateTextAreaBounds(buttonWidth, buttonHeight, iconConfig);

        // Get entity state for color resolution
        const entityState = this._getButtonState();

        for (const [fieldId, field] of Object.entries(textFields)) {
            // Skip if not visible
            if (!field.show) continue;

            // Resolve content (template processing done elsewhere, just use content)
            let content = field.content || '';
            if (!content) continue; // Skip empty content

            // Apply text transformation
            if (field.text_transform) {
                switch (field.text_transform) {
                    case 'uppercase':
                        content = content.toUpperCase();
                        break;
                    case 'lowercase':
                        content = content.toLowerCase();
                        break;
                    case 'capitalize':
                        content = content.replace(/\b\w/g, c => c.toUpperCase());
                        break;
                    // 'none' or any other value: leave as-is
                }
            }

            // Priority 1: Explicit x/y coordinates
            let x, y, anchor, baseline;

            if (field.x !== null && field.y !== null) {
                x = field.x;
                y = field.y;
                anchor = field.anchor;
                baseline = field.baseline;
            }
            // Priority 2: Relative percentages (Phase 2 feature, placeholder for now)
            else if (field.x_percent !== null && field.y_percent !== null) {
                const top = textAreaBounds.top || 0;
                x = textAreaBounds.left + (textAreaBounds.width * field.x_percent / 100);
                y = top + (textAreaBounds.height * field.y_percent / 100);
                anchor = field.anchor;
                baseline = field.baseline;
            }
            // Priority 3: Named position
            else if (field.position) {
                const pos = this._calculateNamedPosition(field.position, textAreaBounds, field.padding);
                x = pos.x;
                y = pos.y;
                // Use field's anchor/baseline if specified, otherwise use position's default
                anchor = field.anchor || pos.anchor;
                baseline = field.baseline || pos.baseline;
            }
            // Priority 4: Default center position
            else {
                const top = textAreaBounds.top || 0;
                x = textAreaBounds.left + (textAreaBounds.width / 2);
                y = top + (textAreaBounds.height / 2);
                anchor = 'middle';
                baseline = 'central';
            }

            // Resolve color based on state
            let resolvedColor;
            if (field.color) {
                if (typeof field.color === 'string') {
                    resolvedColor = field.color;
                } else if (typeof field.color === 'object') {
                    // State-based color
                    if (entityState === 'unavailable') {
                        resolvedColor = field.color.unavailable || field.color.inactive || 'gray';
                    } else if (entityState === 'on' || entityState === 'active') {
                        resolvedColor = field.color.active || 'white';
                    } else {
                        resolvedColor = field.color.inactive || 'gray';
                    }
                }
            }
            // Use default text color if no field color specified
            if (!resolvedColor) {
                const textColor = this._buttonStyle?.text?.default?.color;
                if (typeof textColor === 'string') {
                    resolvedColor = textColor;
                } else if (typeof textColor === 'object') {
                    if (entityState === 'unavailable') {
                        resolvedColor = textColor.unavailable || textColor.inactive || 'gray';
                    } else if (entityState === 'on' || entityState === 'active') {
                        resolvedColor = textColor.active || 'white';
                    } else {
                        resolvedColor = textColor.inactive || 'gray';
                    }
                } else {
                    resolvedColor = 'white'; // Final fallback
                }
            }

            processedFields.push({
                id: fieldId,
                content: content,
                x: x,
                y: y,
                size: field.size,
                color: resolvedColor,
                font_weight: field.font_weight,
                font_family: field.font_family,
                anchor: anchor,
                baseline: baseline,
                rotation: field.rotation  // NEW: pass through rotation
            });
        }

        return processedFields;
    }

    /**
     * Generate SVG text elements from processed text fields
     * @private
     */
    _generateTextElements(processedFields) {
        if (!processedFields || processedFields.length === 0) return '';

        const textElements = [];

        for (const field of processedFields) {
            // Build SVG <text> element
            const textAttrs = [
                `x="${field.x}"`,
                `y="${field.y}"`,
                `font-size="${field.size}"`,
                `fill="${field.color}"`,
                `text-anchor="${field.anchor}"`,
                `dominant-baseline="${field.baseline}"`
            ];

            if (field.font_weight) {
                textAttrs.push(`font-weight="${field.font_weight}"`);
            }

            if (field.font_family) {
                textAttrs.push(`font-family="${field.font_family}"`);
            }

            // Add rotation transform if specified (rotates around text origin point)
            if (field.rotation && field.rotation !== 0) {
                textAttrs.push(`transform="rotate(${field.rotation} ${field.x} ${field.y})"`);
            }

            // Add data attribute for field ID (useful for debugging and AnimJS targeting)
            textAttrs.push(`data-field-id="${field.id}"`);

            // Build complete text element
            const textElement = `<text ${textAttrs.join(' ')}>${escapeHtml(field.content)}</text>`;
            textElements.push(textElement);
        }

        return textElements.join('\n        ');
    }

    /**
     * Render simple button using rect element (uniform radius)
     * Background only - no stroke (borders rendered separately)
     * @private
     */
    _renderSimpleButtonRect(width, height, border, backgroundColor) {
        return `<rect
                    class="button-bg button-clickable"
                    x="0"
                    y="0"
                    width="${width}"
                    height="${height}"
                    rx="${border.radius}"
                    ry="${border.radius}"
                    style="fill: ${backgroundColor}; pointer-events: all;"
                />`;
    }

    /**
     * Render custom SVG path background
     * Enables completely custom shapes (chevrons, trapezoids, etc.)
     *
     * Supports two coordinate systems:
     * 1. Normalized (0-100): Default, works with button's viewBox="0 0 100 100"
     * 2. Custom viewBox: Specify via style.custom_path_viewbox for exact coordinates
     *
     * @private
     * @param {string} customPath - SVG path data (e.g., "M 10,10 L 180,10...")
     * @param {string} backgroundColor - Fill color
     * @returns {string} SVG markup
     *
     * @example
     * // Normalized coordinates (0-100)
     * style: { custom_path: 'M 0,0 L 100,0 L 80,100 L 0,100 Z' }
     *
     * @example
     * // Custom coordinates with viewBox
     * style: {
     *   custom_path: 'M 300,40 C 240,160 180,320 160,460 ...',
     *   custom_path_viewbox: '0 0 600 600'
     * }
     */
    _renderCustomPathBackground(customPath, backgroundColor) {
        return `<path
                    class="button-bg button-clickable"
                    d="${customPath}"
                    fill="${backgroundColor}"
                    style="pointer-events: all;"
                />`;
    }

    /**
     * Render complex button using path element (per-corner radii)
     * Ported from MSD ButtonRenderer for consistency
     * Render complex button using path element (per-corner radii)
     * Background only - no stroke (borders rendered separately)
     * @private
     */
    _renderComplexButtonPath(width, height, border, backgroundColor) {
        // Generate path without stroke inset (borders handled separately)
        const path = this._generateComplexBorderPath(width, height, border, 0);

        let markup = `<path
                        class="button-bg button-clickable"
                        d="${path}"
                        fill="${backgroundColor}"
                        style="pointer-events: all;"
                    />`;

        return markup;
    }

    /**
     * Generate complex SVG path for individual corner radii
     * Ported from MSD ButtonRenderer
     * @private
     * @param {number} width - Button width
     * @param {number} height - Button height
     * @param {Object} border - Border configuration with individual corner radii
     * @param {number} strokeWidth - Stroke width for proper inset calculation
     * @returns {string} SVG path string
     */
    _generateComplexBorderPath(width, height, border, strokeWidth = 0) {
        // Calculate inset to keep stroke within bounds
        // Stroke is drawn centered on the path, so we need to inset by half the stroke width
        const inset = strokeWidth / 2;

        // Ensure all radius values are valid numbers and adjust for inset
        // The visual radius should be maintained, but we need to account for the inset space
        const topLeft = Math.max(0, (Number(border.topLeft) || 0) - inset);
        const topRight = Math.max(0, (Number(border.topRight) || 0) - inset);
        const bottomRight = Math.max(0, (Number(border.bottomRight) || 0) - inset);
        const bottomLeft = Math.max(0, (Number(border.bottomLeft) || 0) - inset);

        // Ensure width and height are valid numbers
        const w = Number(width) || 100;
        const h = Number(height) || 40;

        // Adjust dimensions for stroke inset
        const x0 = inset;
        const y0 = inset;
        const x1 = w - inset;
        const y1 = h - inset;

        // Start from top-left corner, accounting for radius
        let path = `M ${x0 + topLeft} ${y0}`;

        // Top edge to top-right corner
        path += ` L ${x1 - topRight} ${y0}`;

        // Top-right corner curve (use circular arc for exact match with border)
        if (topRight > 0) {
            path += ` A ${topRight} ${topRight} 0 0 1 ${x1} ${y0 + topRight}`;
        } else {
            path += ` L ${x1} ${y0}`;
        }

        // Right edge to bottom-right corner
        path += ` L ${x1} ${y1 - bottomRight}`;

        // Bottom-right corner curve (use circular arc)
        if (bottomRight > 0) {
            path += ` A ${bottomRight} ${bottomRight} 0 0 1 ${x1 - bottomRight} ${y1}`;
        } else {
            path += ` L ${x1} ${y1}`;
        }

        // Bottom edge to bottom-left corner
        path += ` L ${x0 + bottomLeft} ${y1}`;

        // Bottom-left corner curve (use circular arc)
        if (bottomLeft > 0) {
            path += ` A ${bottomLeft} ${bottomLeft} 0 0 1 ${x0} ${y1 - bottomLeft}`;
        } else {
            path += ` L ${x0} ${y1}`;
        }

        // Left edge to top-left corner
        path += ` L ${x0} ${y0 + topLeft}`;

        // Top-left corner curve (use circular arc)
        if (topLeft > 0) {
            path += ` A ${topLeft} ${topLeft} 0 0 1 ${x0 + topLeft} ${y0}`;
        } else {
            path += ` L ${x0} ${y0}`;
        }

        path += ` Z`;

        return path;
    }

    /**
     * Check if button style uses custom SVG path
     * Enables completely custom shapes (chevrons, trapezoids, etc.)
     * Now with auto-normalization and aspect ratio preservation!
     * @private
     * @param {Object} style - Resolved button style
     * @returns {Object|null} Object with {path, preserveAspectRatio} or null
     */
    _getCustomPath(style) {
        // Check for custom_path in style root
        if (style.custom_path) {
            return {
                path: style.custom_path,
                preserveAspectRatio: style.custom_path_preserve_aspect !== false // Default true
            };
        }

        // Check for path in border config (alternative location)
        if (style.border?.custom_path) {
            return {
                path: style.border.custom_path,
                preserveAspectRatio: style.border.custom_path_preserve_aspect !== false
            };
        }

        return null;
    }

    /**
     * Parse SVG path and extract bounding box
     * Supports M, L, C (cubic bezier), Q (quadratic), A (arc), H, V, Z commands
     * @private
     * @param {string} pathData - SVG path data string
     * @returns {Object} Bounding box {minX, minY, maxX, maxY, width, height}
     */
    _getPathBounds(pathData) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        // Simple parser - extracts all numbers from path
        const numbers = pathData.match(/-?\d+\.?\d*/g)?.map(Number) || [];

        // Process coordinates in pairs
        for (let i = 0; i < numbers.length; i += 2) {
            const x = numbers[i];
            const y = numbers[i + 1];

            if (x !== undefined && y !== undefined) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }

        // Handle edge case: no valid coordinates found
        if (!isFinite(minX)) {
            return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
        }

        return {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * Normalize SVG path to 0-100 coordinate space
     * Handles aspect ratio preservation and centering
     * @private
     * @param {string} pathData - Original SVG path data
     * @param {boolean} preserveAspectRatio - Whether to maintain aspect ratio (default: true)
     * @returns {string} Normalized path data
     */
    _normalizePathTo100(pathData, preserveAspectRatio = true) {
        // Get original bounds
        const bounds = this._getPathBounds(pathData);

        // If already in 0-100 range (with small tolerance), return as-is
        const isAlreadyNormalized =
            bounds.minX >= -5 && bounds.minY >= -5 &&
            bounds.maxX <= 105 && bounds.maxY <= 105;

        if (isAlreadyNormalized) {
            return pathData;
        }

        // Calculate scale factors
        let scaleX = 100 / bounds.width;
        let scaleY = 100 / bounds.height;

        // Preserve aspect ratio - use smaller scale factor for both dimensions
        if (preserveAspectRatio) {
            const scale = Math.min(scaleX, scaleY);
            scaleX = scale;
            scaleY = scale;
        }

        // Calculate offsets to center the shape
        const offsetX = -bounds.minX * scaleX;
        const offsetY = -bounds.minY * scaleY;

        // Center if aspect ratios don't match
        const scaledWidth = bounds.width * scaleX;
        const scaledHeight = bounds.height * scaleY;
        const centerOffsetX = preserveAspectRatio ? (100 - scaledWidth) / 2 : 0;
        const centerOffsetY = preserveAspectRatio ? (100 - scaledHeight) / 2 : 0;

        // Transform path: scale and translate to 0-100 space
        // This is a simple transformation - replace all number pairs
        return pathData.replace(/-?\d+\.?\d*/g, (match, offset, string) => {
            const num = parseFloat(match);

            // Determine if this is an X or Y coordinate by context
            // Count preceding numbers to determine position
            const precedingNumbers = string.substring(0, offset).match(/-?\d+\.?\d*/g) || [];
            const isX = precedingNumbers.length % 2 === 0;

            if (isX) {
                return (num * scaleX + offsetX + centerOffsetX).toFixed(2);
            } else {
                return (num * scaleY + offsetY + centerOffsetY).toFixed(2);
            }
        });
    }


    /**
     * Render individual border paths for complex borders
     * Ported from MSD ButtonRenderer for clean corner joins
     * @private
     */
    _renderIndividualBorderPaths(width, height, border) {
        let borderMarkup = '';

        // Helper to safely get border width with fallbacks
        const safeGetBorderWidth = (side, fallback = border.width) => {
            if (border.individualSides && border.individualSides[side]) {
                return border.individualSides[side].width;
            }
            if (border.perSideWidth && border.perSideWidth[side] !== undefined) {
                return border.perSideWidth[side];
            }
            return fallback;
        };

        // Helper to safely get border color with fallbacks
        const safeGetBorderColor = (side, fallback = border.color) => {
            if (border.individualSides && border.individualSides[side]) {
                return border.individualSides[side].color;
            }
            return fallback;
        };

        // Get corner radii
        const topLeft = Number(border.topLeft) || 0;
        const topRight = Number(border.topRight) || 0;
        const bottomRight = Number(border.bottomRight) || 0;
        const bottomLeft = Number(border.bottomLeft) || 0;

        const w = Number(width) || 100;
        const h = Number(height) || 40;

        // Get border widths for rendering
        const topWidth = safeGetBorderWidth('top');
        const rightWidth = safeGetBorderWidth('right');
        const bottomWidth = safeGetBorderWidth('bottom');
        const leftWidth = safeGetBorderWidth('left');

        // Check if any corner has a radius (needed for corner arc rendering)
        const hasAnyRadius = topLeft > 0 || topRight > 0 || bottomRight > 0 || bottomLeft > 0;

        // Use square line caps to fill gaps between paths
        // Square caps extend by strokeWidth/2 perpendicular to path, creating seamless joins
        const lineCap = 'square';

        // Inset borders by strokeWidth/2 to keep full stroke visible within viewBox
        // This replicates CSS border behavior where borders are drawn "inside" the box

        // Top border (inset by topWidth/2 to keep full stroke visible)
        if (topWidth > 0) {
            const topColor = safeGetBorderColor('top');
            const inset = topWidth / 2;
            // Draw from corner radius positions (or edge if no radius)
            const startX = topLeft > 0 ? topLeft : 0;
            const endX = topRight > 0 ? w - topRight : w;
            borderMarkup += `
                <path d="M ${startX} ${inset} L ${endX} ${inset}"
                      stroke="${topColor}"
                      stroke-width="${topWidth}"
                      stroke-linecap="${lineCap}"
                      fill="none" />`;
        }

        // Right border (inset by rightWidth/2 to keep full stroke visible)
        if (rightWidth > 0) {
            const rightColor = safeGetBorderColor('right');
            const inset = rightWidth / 2;
            // Start/end at the INSET positions of adjacent borders for perfect joins
            const topBorderInset = topWidth > 0 ? topWidth / 2 : 0;
            const bottomBorderInset = bottomWidth > 0 ? bottomWidth / 2 : 0;
            const startY = topRight > 0 ? topRight : topBorderInset;
            const endY = bottomRight > 0 ? h - bottomRight : h - bottomBorderInset;
            // Only render if corners don't meet/overlap and line is long enough
            // When endY <= startY, corners meet or overlap - skip the line
            if (endY > startY && (endY - startY) > rightWidth) {
                borderMarkup += `
                    <path d="M ${w - inset} ${startY} L ${w - inset} ${endY}"
                          stroke="${rightColor}"
                          stroke-width="${rightWidth}"
                          stroke-linecap="${lineCap}"
                          fill="none" />`;
            }
        }

        // Bottom border (inset by bottomWidth/2 to keep full stroke visible)
        if (bottomWidth > 0) {
            const bottomColor = safeGetBorderColor('bottom');
            const inset = bottomWidth / 2;
            const startX = bottomRight > 0 ? w - bottomRight : w;
            const endX = bottomLeft > 0 ? bottomLeft : 0;
            borderMarkup += `
                <path d="M ${startX} ${h - inset} L ${endX} ${h - inset}"
                      stroke="${bottomColor}"
                      stroke-width="${bottomWidth}"
                      stroke-linecap="${lineCap}"
                      fill="none" />`;
        }

        // Left border (inset by leftWidth/2 to keep full stroke visible)
        if (leftWidth > 0) {
            const leftColor = safeGetBorderColor('left');
            const inset = leftWidth / 2;
            // Start/end at the INSET positions of adjacent borders for perfect joins
            const topBorderInset = topWidth > 0 ? topWidth / 2 : 0;
            const bottomBorderInset = bottomWidth > 0 ? bottomWidth / 2 : 0;
            const startY = bottomLeft > 0 ? h - bottomLeft : h - bottomBorderInset;
            const endY = topLeft > 0 ? topLeft : topBorderInset;
            // Only render if corners don't meet/overlap and line is long enough
            // When startY <= endY, corners meet or overlap - skip the line
            if (startY > endY && (startY - endY) > leftWidth) {
                borderMarkup += `
                    <path d="M ${inset} ${startY} L ${inset} ${endY}"
                          stroke="${leftColor}"
                          stroke-width="${leftWidth}"
                          stroke-linecap="${lineCap}"
                          fill="none" />`;
            }
        }

        // Render corner arcs if any corner has a radius (individual or global)
        if (hasAnyRadius) {
            borderMarkup += this._renderCornerArcs(width, height, border);
        }

        return borderMarkup;
    }

    /**
     * Render corner arc paths for individual corner radii
     * Ported from MSD ButtonRenderer
     * @private
     */
    _renderCornerArcs(width, height, border) {
        let arcMarkup = '';

        // Get corner radii
        const topLeft = Number(border.topLeft) || 0;
        const topRight = Number(border.topRight) || 0;
        const bottomRight = Number(border.bottomRight) || 0;
        const bottomLeft = Number(border.bottomLeft) || 0;

        const w = Number(width) || 100;
        const h = Number(height) || 40;

        // Get border widths for corners (use adjacent sides or global)
        const getCornerWidth = (side1, side2) => {
            const width1 = border.individualSides?.[side1]?.width || border.perSideWidth?.[side1] || border.width;
            const width2 = border.individualSides?.[side2]?.width || border.perSideWidth?.[side2] || border.width;
            return Math.max(width1, width2); // Use the larger width for clean joins
        };

        const getCornerColor = (side1, side2) => {
            // Prefer side1's color, fallback to side2, then global
            return border.individualSides?.[side1]?.color ||
                   border.individualSides?.[side2]?.color ||
                   border.color;
        };

        // Helper to get individual border widths
        const getBorderWidth = (side) => {
            return border.individualSides?.[side]?.width || border.perSideWidth?.[side] || border.width;
        };

        // Top-left corner arc using SVG arc command for perfect 90° tangency
        // Arcs are inset to match the inset borders (replicating CSS border behavior)
        if (topLeft > 0) {
            const cornerWidth = getCornerWidth('top', 'left');
            const cornerColor = getCornerColor('top', 'left');
            const inset = cornerWidth / 2;
            // Reduce arc radius by inset to keep stroke centered on the inset path
            const arcRadius = Math.max(topLeft - inset, inset);
            arcMarkup += `
                <path d="M ${inset} ${arcRadius + inset} A ${arcRadius} ${arcRadius} 0 0 1 ${arcRadius + inset} ${inset}"
                      stroke="${cornerColor}"
                      stroke-width="${cornerWidth}"
                      stroke-linecap="square"
                      fill="none" />`;
        }

        // Top-right corner arc (inset from right and top edges)
        if (topRight > 0) {
            const cornerWidth = getCornerWidth('top', 'right');
            const cornerColor = getCornerColor('top', 'right');
            const inset = cornerWidth / 2;
            const arcRadius = Math.max(topRight - inset, inset);
            arcMarkup += `
                <path d="M ${w - arcRadius - inset} ${inset} A ${arcRadius} ${arcRadius} 0 0 1 ${w - inset} ${arcRadius + inset}"
                      stroke="${cornerColor}"
                      stroke-width="${cornerWidth}"
                      stroke-linecap="square"
                      fill="none" />`;
        }

        // Bottom-right corner arc (inset from right and bottom edges)
        if (bottomRight > 0) {
            const cornerWidth = getCornerWidth('right', 'bottom');
            const cornerColor = getCornerColor('right', 'bottom');
            const inset = cornerWidth / 2;
            const arcRadius = Math.max(bottomRight - inset, inset);
            arcMarkup += `
                <path d="M ${w - inset} ${h - arcRadius - inset} A ${arcRadius} ${arcRadius} 0 0 1 ${w - arcRadius - inset} ${h - inset}"
                      stroke="${cornerColor}"
                      stroke-width="${cornerWidth}"
                      stroke-linecap="square"
                      fill="none" />`;
        }

        // Bottom-left corner arc (inset from left and bottom edges)
        if (bottomLeft > 0) {
            const cornerWidth = getCornerWidth('bottom', 'left');
            const cornerColor = getCornerColor('bottom', 'left');
            const inset = cornerWidth / 2;
            const arcRadius = Math.max(bottomLeft - inset, inset);
            arcMarkup += `
                <path d="M ${arcRadius + inset} ${h - inset} A ${arcRadius} ${arcRadius} 0 0 1 ${inset} ${h - arcRadius - inset}"
                      stroke="${cornerColor}"
                      stroke-width="${cornerWidth}"
                      stroke-linecap="square"
                      fill="none" />`;
        }

        return arcMarkup;
    }

    /**
     * Escape XML characters for safe SVG text
     * @private
     */
    _escapeXML(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Cleanup on disconnect
     */
    disconnectedCallback() {
        // Clean up action listeners
        if (this._actionCleanup) {
            this._actionCleanup();
            this._actionCleanup = null;
        }

        // Clean up ResizeObserver
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        // Clear element reference
        this._lastActionElement = null;

        super.disconnectedCallback();
    }

    /**
     * Get card size for Home Assistant layout
     * Returns height in units of ~50px rows
     * @returns {number} Card height in rows
     */
    getCardSize() {
        // Calculate based on configured or auto-sized height
        const height = this.config.height || this._containerSize?.height || 60;
        // Convert to HA grid units (each unit is ~50px)
        return Math.ceil(height / 50);
    }

    /**
     * Get layout options for Home Assistant grid system
     * @returns {Object} Layout configuration
     */
    getLayoutOptions() {
        return {
            grid_columns: this.config.grid_columns || 2,  // Default span 2 columns
            grid_rows: this.config.grid_rows || 1,        // Default span 1 row
            grid_min_columns: this.config.grid_min_columns || 1,
            grid_min_rows: this.config.grid_min_rows || 1
        };
    }

    /**
     * Get stub config for card picker
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-simple-button',
            entity: 'light.example',
            label: 'LCARdS Button',
            preset: 'lozenge',
            tap_action: {
                action: 'toggle'
            }
        };
    }
}

// NOTE: Card registration moved to src/lcards.js initializeCustomCard().then()
// This ensures all core singletons (including StylePresetManager) are initialized
// before cards can be instantiated, preventing race conditions.

// Register with CoreConfigManager (behavioral defaults and schema)
if (window.lcardsCore?.configManager) {
    const configManager = window.lcardsCore.configManager;

    // Register behavioral defaults (NO STYLES - those come from theme/presets)
    configManager.registerCardDefaults('simple-button', {
        show_label: true,           // Display label by default
        show_icon: false,           // No icon by default
        enable_hold_action: true,   // Hold actions enabled
        enable_double_tap: false    // Double-tap disabled by default
    });

    // Register JSON schema for validation
    configManager.registerCardSchema('simple-button', {
        type: 'object',
        properties: {
            // Core Properties
            entity: {
                type: 'string',
                description: 'Entity ID to control'
            },
            id: {
                type: 'string',
                description: 'Custom overlay ID for rule targeting (optional - auto-generated if omitted)'
            },
            tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for bulk rule targeting (e.g., ["controlled", "indicator"])'
            },

            // Display Properties
            label: {
                type: 'string',
                description: 'Button label text (supports Jinja2 templates)'
            },
            content: {
                type: 'string',
                description: 'Additional content text (supports Jinja2 templates)'
            },
            preset: {
                type: 'string',
                description: 'Style preset name (e.g., "lozenge", "pill", "bullet")'
            },
            show_label: {
                type: 'boolean',
                description: 'Whether to display the label'
            },
            show_icon: {
                type: 'boolean',
                description: 'Whether to display an icon'
            },
            icon: {
                oneOf: [
                    { type: 'string' },
                    {
                        type: 'object',
                        properties: {
                            icon: { type: 'string', description: 'Icon name (e.g., "mdi:lightbulb", "entity")' },
                            position: {
                                type: 'string',
                                enum: ['left', 'right', 'center', 'top', 'bottom'],
                                description: 'Icon position relative to text'
                            },
                            size: { type: 'number', description: 'Icon size in pixels (controls area width)' },
                            color: { type: 'string', description: 'Icon color (CSS color or "inherit")' },
                            padding_left: { type: 'number', description: 'Left padding in pixels' },
                            padding_right: { type: 'number', description: 'Right padding in pixels' },
                            padding_top: { type: 'number', description: 'Top padding in pixels' },
                            padding_bottom: { type: 'number', description: 'Bottom padding in pixels' }
                        }
                    }
                ],
                description: 'Icon configuration: string ("entity", "mdi:lightbulb") or object with options'
            },

            // Style Properties
            style: {
                type: 'object',
                description: 'Style overrides (color, textColor, fontSize, etc.)'
            },
            width: {
                type: 'number',
                description: 'Fixed width in pixels (optional - auto-sizes to container by default)'
            },
            height: {
                type: 'number',
                description: 'Fixed height in pixels (optional - auto-sizes to container by default)'
            },

            // Grid Layout Properties
            grid_columns: {
                type: 'number',
                description: 'Number of grid columns to span (default: 2)',
                minimum: 1
            },
            grid_rows: {
                type: 'number',
                description: 'Number of grid rows to span (default: 1)',
                minimum: 1
            },
            grid_min_columns: {
                type: 'number',
                description: 'Minimum columns required (default: 1)',
                minimum: 1
            },
            grid_min_rows: {
                type: 'number',
                description: 'Minimum rows required (default: 1)',
                minimum: 1
            },

            // Action Properties
            tap_action: {
                type: 'object',
                description: 'Action to perform on tap'
            },
            hold_action: {
                type: 'object',
                description: 'Action to perform on hold'
            },
            double_tap_action: {
                type: 'object',
                description: 'Action to perform on double-tap'
            },

            // Rules & Animations
            rules: {
                type: 'array',
                description: 'Card-local rules for dynamic styling based on entity states',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        when: { type: 'object' },
                        apply: { type: 'object' }
                    },
                    required: ['id', 'when', 'apply']
                }
            },
            animations: {
                type: 'array',
                description: 'Animation configurations (experimental)',
                items: { type: 'object' }
            }
        }
        // No required fields - allows decorative/static buttons without entities
    }, { version: '1.0' });

    lcardsLog.debug('[LCARdSSimpleButtonCard] Registered with CoreConfigManager');
}

// Register with card picker
window.customCards = window.customCards || [];
window.customCards.push({
    type: 'lcards-simple-button',
    name: 'LCARdS Button',
    description: 'LCARS-styled button with actions and templates',
    preview: true
});

lcardsLog.debug('[LCARdSSimpleButtonCard] Card registered');