/**
 * LCARdS Button Card
 *
 * A feature-complete button implementation using the LCARdSCard foundation.
 * Supports multi-text labels, flexible positioning, state-based styling, and dynamic rules.
 *
 * Features:
 * - Multi-text label system with flexible positioning and rotation
 * - Icon area support (left, right, top, bottom, or absolute positioning)
 * - Template processing with Jinja2 syntax
 * - Theme token integration with computed token support
 * - Style preset system with deep merging
 * - Rules engine integration for dynamic styling
 * - Action handling (tap, hold, double-tap)
 * - SVG rendering with per-corner border radii
 * - Responsive auto-sizing for HA grid layouts
 *
 * @example Basic Button
 * ```yaml
 * type: custom:lcards-button
 * entity: light.bedroom
 * preset: lozenge
 * text:
 *   name:
 *     content: "Bedroom Light"
 * tap_action:
 *   action: toggle
 * ```
 *
 * @example Advanced Button with Multi-Text
 * ```yaml
 * type: custom:lcards-button
 * entity: sensor.temperature
 * preset: bullet
 * icon_area: left
 * icon:
 *   icon: mdi:thermometer
 * text:
 *   label:
 *     content: "Temperature"
 *     position: top-right
 *   value:
 *     content: "{entity.state}°C"
 *     position: bottom-right
 *     font_size: 20
 * ```
 *
 * @see {@link ../doc/architecture/button-schema-definition.md} for complete schema
 * @version 1.14.18
 */

import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { LCARdSCard } from '../base/LCARdSCard.js';
import { lcardsLog } from '../utils/lcards-logging.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';
import { deepMerge } from '../utils/deepMerge.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
import { escapeHtml } from '../utils/StringUtils.js';
import { TemplateParser } from '../core/templates/TemplateParser.js';
import { getComponent } from '../core/packs/components/index.js';
import { getShape } from '../core/packs/shapes/index.js';
import { RendererUtils } from '../msd/renderer/RendererUtils.js';

// Import unified schema
import { getButtonSchema } from './schemas/button-schema.js';

// Import editor component for getConfigElement()
import '../editor/cards/lcards-button-editor.js';

export class LCARdSButton extends LCARdSCard {

    /** Card type identifier for CoreConfigManager */
    static CARD_TYPE = 'button';

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
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                }

                .button-svg:hover {
                    opacity: 0.8;
                }
            `
        ];
    }

    constructor() {
        super();
        this._buttonStyle = null;
        this._lastActionElement = null;
        this._containerSize = { width: 200, height: 56 };
        this._resizeObserver = null;
        this._fontsChecked = false; // Track if fonts have been loaded

        // SVG background support (Phase 1)
        this._processedSvg = null;

        // Segmented SVG support (Phase 2)
        this._processedSegments = null;
        this._segmentCleanups = [];
        this._segmentElements = new Map(); // Stores segment ID → { element, segment config }
        this._segmentEntityStates = new Map(); // Stores entity ID → last known state
        this._registeredSegmentAnimations = new Set(); // Tracks which segments have animations registered
    }

    /**
     * Called when config is set (override from base class)
     * @protected
     */
    _onConfigSet(config) {
        super._onConfigSet(config);

        // Process SVG configuration if present (Phase 1)
        this._processSvgConfig();

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
            lcardsLog.debug(`[LCARdSButton] Config changed, re-setting up actions`);
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
                lcardsLog.debug(`[LCARdSButton] Entity state changed: ${oldState} -> ${newState}`, {
                    entityId: this.config.entity,
                    oldState,
                    newState,
                    entity: this._entity
                });

                // Re-resolve button style when entity state changes for reactive color updates
                this._resolveButtonStyleSync();

                lcardsLog.debug(`[LCARdSButton] Button style re-resolved after state change`);

                // Schedule template processing AFTER style resolution
                this._scheduleTemplateUpdate();

                // Trigger card-level on_entity_change animations AFTER render completes
                // Use requestAnimationFrame to ensure DOM is updated first
                if (this.config.animations) {
                    requestAnimationFrame(() => {
                        const animationManager = window.lcards?.core?.getAnimationManager?.();
                        const elementId = `button-${this._cardGuid}`;
                        if (animationManager && elementId) {
                            animationManager.triggerAnimations(elementId, 'on_entity_change');
                            lcardsLog.debug(`[LCARdSButton] Card-level on_entity_change animations triggered`);
                        }
                    });
                }
            }
        }
    }

    // ============================================================================
    // PHASE 1: FULL SVG BACKGROUND SUPPORT
    // ============================================================================

    /**
     * Process component preset configuration
     * Loads component preset from pack system, resolves shape, merges with user config,
     * and resolves theme tokens.
     *
     * NOTE: Component presets are loaded directly from component registry for now.
     * Future enhancement: Support external SVG files via /hacsfiles/lcards/ URL paths
     * (similar to MSD base_svg files).
     *
     * @private
     * @param {string} componentName - Name of component preset to load
     */
    _processComponentPreset(componentName) {
        lcardsLog.debug(`[LCARdSButton] Processing component preset`, { componentName });

        // Load component preset
        const componentPreset = getComponent(componentName);
        if (!componentPreset) {
            lcardsLog.error(`[LCARdSButton] Component preset not found: ${componentName}`);
            this._processedSvg = null;
            this._processedSegments = null;
            return;
        }

        // Load shape SVG
        const shapeName = componentPreset.shape;
        const shapeContent = getShape(shapeName);
        if (!shapeContent) {
            lcardsLog.error(`[LCARdSButton] Shape not found for component: ${shapeName}`);
            this._processedSvg = null;
            this._processedSegments = null;
            return;
        }

        lcardsLog.debug(`[LCARdSButton] Loaded component preset`, {
            id: componentPreset.id,
            shape: shapeName,
            hasSegments: !!componentPreset.segments
        });

        // Create SVG config from component preset
        const svgConfig = {
            content: shapeContent,
            enable_tokens: true,
            segments: []
        };

        // DON'T resolve tokens yet - singletons not available during config processing!
        // Store component segments with token references, will resolve during render
        // Merge component segments with user-provided segments
        const userSegmentsConfig = this.config[componentName] || {};
        const userSegments = userSegmentsConfig.segments || {};

        const mergedSegments = this._mergeComponentSegments(componentPreset.segments, userSegments);

        // Convert to segment array format expected by _finalizeSvgProcessing
        // Auto-generate selector from segment ID if not explicitly provided
        svgConfig.segments = Object.entries(mergedSegments).map(([id, config]) => ({
            id,
            selector: config.selector || `#${id}`,  // Default to ID selector if not specified
            ...config
        }));

        lcardsLog.debug(`[LCARdSButton] Component segments merged`, {
            componentSegmentCount: Object.keys(componentPreset.segments).length,
            userSegmentCount: Object.keys(userSegments).length,
            finalSegmentCount: svgConfig.segments.length
        });

        // Process through normal SVG pipeline
        this._finalizeSvgProcessing(svgConfig.content, svgConfig);
    }

    /**
     * Resolve theme tokens in component segment definitions
     * @private
     * @param {Object} segments - Component preset segments with token references
     * @returns {Object} Segments with resolved theme token values
     */
    _resolveComponentSegmentTokens(segments) {
        const resolved = {};
        const themeTokens = this._themeTokens || {};

        for (const [segmentId, segmentConfig] of Object.entries(segments)) {
            resolved[segmentId] = {};

            // Resolve each property that might contain theme tokens
            for (const [prop, value] of Object.entries(segmentConfig)) {
                if (typeof value === 'string') {
                    // Check if it's a theme token reference (e.g., "components.dpad.segment.directional.fill")
                    resolved[segmentId][prop] = this._resolveThemeToken(value, themeTokens);
                } else if (typeof value === 'object' && value !== null) {
                    // Handle nested objects (e.g., fill: { active: '...', inactive: '...' })
                    resolved[segmentId][prop] = {};
                    for (const [state, stateValue] of Object.entries(value)) {
                        resolved[segmentId][prop][state] =
                            typeof stateValue === 'string'
                                ? this._resolveThemeToken(stateValue, themeTokens)
                                : stateValue;
                    }
                } else {
                    resolved[segmentId][prop] = value;
                }
            }
        }

        return resolved;
    }

    /**
     * Resolve a single theme token reference
     * @private
     * @param {string} tokenPath - Dot-notation path to theme token
     * @param {Object} themeTokens - Theme token object (unused, kept for API compatibility)
     * @returns {*} Resolved token value or original path if not found
     */
    _resolveThemeToken(tokenPath, themeTokens) {
        // If not a token path, return as-is
        if (!tokenPath.includes('.')) {
            return tokenPath;
        }

        // Use ThemeManager resolver for proper token resolution
        if (this._singletons?.themeManager?.resolver) {
            const resolved = this._singletons.themeManager.resolver.resolve(tokenPath, tokenPath);
            lcardsLog.trace(`[LCARdSButton] Resolved component token "${tokenPath}" -> "${resolved}"`);
            return resolved;
        } else {
            lcardsLog.warn(
                `[LCARdSButton] Cannot resolve component token "${tokenPath}" - ThemeManager not available`
            );
            return tokenPath;
        }
    }

    /**
     * Merge component preset segments with user-provided segments
     * User config takes precedence, but preserves component defaults
     * Supports dpad.default for default properties applied to all segments
     * @private
     * @param {Object} componentSegments - Resolved component preset segments
     * @param {Object} userSegments - User-provided segment overrides
     * @returns {Object} Merged segment configuration
     */
    _mergeComponentSegments(componentSegments, userSegments) {
        const merged = { ...componentSegments };

        // Extract default configuration (if provided)
        // Similar to text.default pattern
        const defaultConfig = userSegments.default || {};

        // Deep merge user segments into component segments
        for (const [segmentId, userConfig] of Object.entries(userSegments)) {
            // Skip 'default' - it's configuration, not a segment to render
            if (segmentId === 'default') continue;

            if (merged[segmentId]) {
                // Three-way merge: component preset < default config < segment-specific config
                // This allows default to provide common properties while segment-specific overrides
                const withDefaults = deepMerge(merged[segmentId], defaultConfig);
                merged[segmentId] = deepMerge(withDefaults, userConfig);
            } else {
                // User defined a new segment not in component preset
                // Apply defaults first, then segment-specific config
                merged[segmentId] = deepMerge(defaultConfig, userConfig);
            }
        }

        // If there are segments in merged that weren't in userSegments,
        // apply default config to them as well
        for (const segmentId of Object.keys(merged)) {
            if (!userSegments[segmentId] && Object.keys(defaultConfig).length > 0) {
                merged[segmentId] = deepMerge(merged[segmentId], defaultConfig);
            }
        }

        return merged;
    }

    /**
     * Process SVG configuration from card config
     * Handles inline content, external URLs, data URIs, and component presets
     * @private
     */
    _processSvgConfig() {
        lcardsLog.debug(`[LCARdSButton] _processSvgConfig called`, {
            hasSvgConfig: !!this.config?.svg,
            hasComponent: !!this.config?.component,
            config: this.config?.svg
        });

        if (!this.config?.svg && !this.config?.component) {
            this._processedSvg = null;
            this._processedSegments = null;
            return;
        }

        // Check for component preset first
        if (this.config?.component) {
            this._processComponentPreset(this.config.component);
            return;
        }

        const svgConfig = this.config.svg;
        let svgContent = null;

        // Priority 1: Inline content
        if (svgConfig.content) {
            lcardsLog.debug(`[LCARdSButton] Processing inline SVG content`, {
                contentLength: svgConfig.content?.length
            });
            svgContent = svgConfig.content;
            this._finalizeSvgProcessing(svgContent, svgConfig);
        }
        // Priority 2: External URL or data URI (async)
        else if (svgConfig.src) {
            // Handle data URIs synchronously
            if (svgConfig.src.startsWith('data:')) {
                try {
                    // Extract SVG content from data URI
                    const dataContent = this._extractDataUriContent(svgConfig.src);
                    this._finalizeSvgProcessing(dataContent, svgConfig);
                } catch (error) {
                    lcardsLog.error(`[LCARdSButton] Data URI parse failed:`, error);
                    this._processedSvg = null;
                }
            } else {
                // Fetch external URL asynchronously
                this._fetchExternalSvg(svgConfig.src, svgConfig);
            }
        } else {
            this._processedSvg = null;
            this._processedSegments = null;
        }
    }

    /**
     * Extract content from a data URI
     * @private
     * @param {string} dataUri - Data URI string
     * @returns {string} Decoded content
     */
    _extractDataUriContent(dataUri) {
        // Format: data:image/svg+xml,<svg>...</svg> or data:image/svg+xml;base64,...
        const commaIndex = dataUri.indexOf(',');
        if (commaIndex === -1) {
            throw new Error('Invalid data URI format');
        }

        const header = dataUri.substring(0, commaIndex);
        const content = dataUri.substring(commaIndex + 1);

        if (header.includes(';base64')) {
            // Base64 encoded
            return atob(content);
        } else {
            // URL encoded
            return decodeURIComponent(content);
        }
    }

    /**
     * Fetch external SVG file asynchronously
     * @private
     * @param {string} url - URL to fetch
     * @param {Object} svgConfig - SVG configuration
     */
    async _fetchExternalSvg(url, svgConfig) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load SVG: ${response.statusText}`);
            }
            const svgContent = await response.text();
            this._finalizeSvgProcessing(svgContent, svgConfig);

            // Trigger re-render after async fetch
            this.requestUpdate();
        } catch (error) {
            lcardsLog.error(`[LCARdSButton] SVG fetch failed:`, error);
            this._processedSvg = null;
        }
    }

    /**
     * Finalize SVG processing after content is available
     * @private
     * @param {string} svgContent - Raw SVG content
     * @param {Object} svgConfig - SVG configuration
     */
    _finalizeSvgProcessing(svgContent, svgConfig) {
        if (!svgContent) {
            this._processedSvg = null;
            return;
        }

        // Sanitize SVG (remove scripts, event handlers, javascript: URLs)
        const sanitized = this._sanitizeSvg(svgContent, svgConfig.allow_scripts !== true);

        // Process tokens if enabled ({{entity.state}}, theme:tokens)
        let withTokens = sanitized;
        if (svgConfig.enable_tokens !== false) {
            withTokens = this._processTokensInSvg(sanitized);
        }

        // Extract viewBox from SVG or use config
        const viewBox = svgConfig.viewBox || this._extractViewBox(withTokens) || '0 0 100 100';

        this._processedSvg = {
            content: withTokens,
            viewBox: viewBox,
            preserveAspectRatio: svgConfig.preserveAspectRatio || 'xMidYMid meet'
        };

        lcardsLog.debug(`[LCARdSButton] SVG processing complete`, {
            hasContent: !!this._processedSvg.content,
            contentLength: this._processedSvg.content?.length,
            viewBox: this._processedSvg.viewBox,
            preserveAspectRatio: this._processedSvg.preserveAspectRatio,
            tokensWereProcessed: svgConfig.enable_tokens !== false
        });

        // Process segments if defined
        if (svgConfig.segments) {
            // Check if it's object-based (new format) or array-based (legacy)
            if (typeof svgConfig.segments === 'object' && !Array.isArray(svgConfig.segments)) {
                // New object-based format - auto-discover segment IDs from SVG
                const availableSegmentIds = this._extractSegmentIdsFromSvg(withTokens);
                
                // Convert object-based config to internal array format
                const segmentsArray = this._convertSegmentsObjectToArray(
                    svgConfig.segments,
                    availableSegmentIds
                );
                
                this._processSegmentConfig(segmentsArray);
            } else if (Array.isArray(svgConfig.segments)) {
                // Legacy array-based format - process directly
                this._processSegmentConfig(svgConfig.segments);
            }
        }
    }

    /**
     * Extract segment IDs from SVG content
     * Scans for elements with id attributes to enable auto-discovery
     * @private
     * @param {string} svgContent - SVG markup
     * @returns {Array<string>} Array of discovered segment IDs
     */
    _extractSegmentIdsFromSvg(svgContent) {
        if (!svgContent) return [];
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');
            
            // Check for parse errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                lcardsLog.warn('[LCARdSButton] SVG parse error during ID extraction:', parseError.textContent);
                return [];
            }
            
            // Find all elements with ID attributes
            const elementsWithIds = doc.querySelectorAll('[id]');
            const segmentIds = Array.from(elementsWithIds).map(el => el.id);
            
            lcardsLog.debug(`[LCARdSButton] Discovered ${segmentIds.length} segment IDs from SVG:`, segmentIds);
            
            return segmentIds;
        } catch (error) {
            lcardsLog.error('[LCARdSButton] Failed to extract segment IDs from SVG:', error);
            return [];
        }
    }

    /**
     * Convert object-based segment config to internal array format
     * Merges default config with per-segment overrides
     * @private
     * @param {Object} segmentsObject - User segment configuration (keyed by ID)
     * @param {Array<string>} availableIds - Segment IDs discovered from SVG
     * @returns {Array<Object>} Segment configuration array
     */
    _convertSegmentsObjectToArray(segmentsObject, availableIds) {
        const defaultConfig = segmentsObject.default || {};
        const segmentsArray = [];
        
        // Get all segment IDs to process (discovered + user-defined)
        const userSegmentIds = Object.keys(segmentsObject).filter(id => id !== 'default');
        const allSegmentIds = new Set([...availableIds, ...userSegmentIds]);
        
        // Convert availableIds to Set for O(1) lookup performance
        const availableIdsSet = new Set(availableIds);
        
        // Validate user-defined segments exist in SVG
        userSegmentIds.forEach(id => {
            if (!availableIdsSet.has(id)) {
                lcardsLog.warn(`[LCARdSButton] Segment "${id}" configured but not found in SVG (no matching id attribute)`);
            }
        });
        
        // Convert each segment to array item
        allSegmentIds.forEach(id => {
            const userConfig = segmentsObject[id] || {};
            
            // Skip if no user config and no default (nothing to do)
            if (this._shouldSkipSegment(userConfig, defaultConfig)) {
                return;
            }
            
            // Merge default + user config
            const mergedConfig = deepMerge(defaultConfig, userConfig);
            
            // Auto-generate selector if not provided
            const selector = userConfig.selector || `#${id}`;
            
            segmentsArray.push({
                id,
                selector,
                ...mergedConfig
            });
        });
        
        lcardsLog.debug(`[LCARdSButton] Converted segments: ${segmentsArray.length} configured, ${availableIds.length} discovered`, {
            configured: segmentsArray.map(s => s.id),
            discovered: availableIds
        });
        
        return segmentsArray;
    }

    /**
     * Check if a segment should be skipped (no config and no defaults)
     * @private
     * @param {Object} userConfig - User-provided segment configuration
     * @param {Object} defaultConfig - Default configuration
     * @returns {boolean} True if segment should be skipped
     */
    _shouldSkipSegment(userConfig, defaultConfig) {
        const hasUserConfig = userConfig.tap_action || 
                             userConfig.hold_action || 
                             userConfig.double_tap_action || 
                             userConfig.style || 
                             userConfig.animations ||
                             userConfig.entity;
        
        const hasDefaultConfig = Object.keys(defaultConfig).length > 0;
        
        return !hasUserConfig && !hasDefaultConfig;
    }

    /**
     * Sanitize SVG content to prevent XSS attacks
     * Strips dangerous elements and attributes while preserving visual content
     * @private
     * @param {string} svgContent - Raw SVG markup
     * @param {boolean} stripScripts - Remove <script> tags (default: true)
     * @returns {string} Sanitized SVG markup
     */
    _sanitizeSvg(svgContent, stripScripts = true) {
        // Strip XML declaration if present (causes parsing errors when wrapping)
        // Matches: <?xml version="1.0" encoding="UTF-8" standalone="no"?>
        let cleanedContent = svgContent.trim().replace(/^<\?xml[^?]*\?>\s*/i, '');

        // Wrap content in <svg> if not already wrapped (allows fragments like <rect/><defs/>)
        let wrappedContent = cleanedContent;
        if (!wrappedContent.startsWith('<svg')) {
            wrappedContent = `<svg xmlns="http://www.w3.org/2000/svg">${cleanedContent}</svg>`;
        }

        // Parse SVG to DOM (in memory, not attached to document)
        const parser = new DOMParser();
        const doc = parser.parseFromString(wrappedContent, 'image/svg+xml');

        // Check for parsing errors
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
            lcardsLog.error('[LCARdSButton] Invalid SVG markup:', parserError.textContent);
            return '';
        }

        const svg = doc.documentElement;

        // Strip dangerous elements
        if (stripScripts) {
            const dangerousElements = svg.querySelectorAll('script, iframe, embed, object, foreignObject[src], use[href^="data:"], use[xlink\\:href^="data:"]');
            dangerousElements.forEach(el => el.remove());
        }

        // Strip event handlers (onclick, onload, onerror, etc.)
        const allElements = svg.querySelectorAll('*');
        allElements.forEach(el => {
            Array.from(el.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        // Strip dangerous URL schemes in href/xlink:href
        // Checks for javascript:, data:, and vbscript: schemes
        const dangerousSchemes = ['javascript:', 'data:', 'vbscript:'];
        allElements.forEach(el => {
            ['href', 'xlink:href'].forEach(attr => {
                const value = el.getAttribute(attr);
                if (value) {
                    const trimmedLower = value.trim().toLowerCase();
                    if (dangerousSchemes.some(scheme => trimmedLower.startsWith(scheme))) {
                        el.removeAttribute(attr);
                    }
                }
            });
        });

        // Make text elements click-through so they don't interfere with segment interactions
        // This allows pointer events to pass through to interactive segments beneath
        const textElements = svg.querySelectorAll('text, tspan, foreignObject');
        textElements.forEach(el => {
            el.setAttribute('pointer-events', 'none');
        });

        // Return the full SVG (including wrapper if we added one)
        // _renderSvgBackground will strip the outer <svg> tag if present
        return new XMLSerializer().serializeToString(svg);
    }

    /**
     * Process template tokens in SVG content
     * Supports {{entity.state}}, theme:tokens (including computed tokens)
     * @private
     * @param {string} svgContent - Sanitized SVG markup
     * @returns {string} SVG with tokens replaced
     */
    _processTokensInSvg(svgContent) {
        if (!svgContent) return svgContent;

        let processed = svgContent;

        // Process entity tokens: {{entity.state}}, {{entity.attributes.friendly_name}}, etc.
        const entityTokenPattern = /\{\{entity\.([^}]+)\}\}/g;
        processed = processed.replace(entityTokenPattern, (match, path) => {
            if (!this._entity) return match;

            const parts = path.split('.');
            let value = this._entity;
            for (const part of parts) {
                if (value === null || value === undefined) return match;
                value = value[part];
            }

            return value !== undefined ? String(value) : match;
        });

        // Process theme tokens: theme:colors.lcars.orange, etc.
        // ThemeManager.getToken() handles computed tokens automatically
        const themeTokenPattern = /theme:([a-zA-Z0-9._]+)/g;
        processed = processed.replace(themeTokenPattern, (match, tokenPath) => {
            const value = this.getThemeToken(tokenPath);
            return value !== null && value !== undefined ? String(value) : match;
        });

        // Process conditional expressions for fill colors: {{entity.state == 'on' ? 'color1' : 'color2'}}
        const conditionalPattern = /\{\{entity\.state\s*==\s*['"]([^'"]+)['"]\s*\?\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]\}\}/g;
        processed = processed.replace(conditionalPattern, (match, compareValue, trueValue, falseValue) => {
            if (!this._entity) return match;
            return this._entity.state === compareValue ? trueValue : falseValue;
        });

        return processed;
    }

    /**
     * Extract viewBox attribute from SVG content
     * @private
     * @param {string} svgContent - SVG markup
     * @returns {string|null} ViewBox value or null
     */
    _extractViewBox(svgContent) {
        const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
        return viewBoxMatch ? viewBoxMatch[1] : null;
    }

    /**
     * Render full SVG content as button background
     * Handles viewBox scaling and aspect ratio preservation
     * @private
     * @param {Object} processedSvg - Processed SVG configuration
     * @param {number} buttonWidth - Button width
     * @param {number} buttonHeight - Button height
     * @returns {string} SVG markup
     */
    _renderSvgBackground(processedSvg, buttonWidth, buttonHeight) {
        const { content, viewBox, preserveAspectRatio } = processedSvg;

        // Extract inner SVG content (strip outer <svg> tag if present)
        let innerContent = content;
        const svgMatch = content.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
        if (svgMatch) {
            innerContent = svgMatch[1];
        }

        // Wrap in a nested SVG with proper scaling
        // The outer button SVG has viewBox matching button dimensions
        // The inner SVG scales the custom content to fit
        return `
            <g class="button-bg-svg" style="pointer-events: all;">
                <svg x="0" y="0"
                     width="${buttonWidth}"
                     height="${buttonHeight}"
                     viewBox="${viewBox}"
                     preserveAspectRatio="${preserveAspectRatio}">
                    ${innerContent}
                </svg>
            </g>
        `;
    }

    // ============================================================================
    // PHASE 2: SEGMENTED SVG (MULTI-ACTION REGIONS)
    // ============================================================================

    /**
     * Resolve theme tokens in segment style configuration
     * Converts 'theme:token.path' strings to their resolved state objects
     * Then resolves any computed tokens (darken/lighten/alpha) within those state objects
     * @private
     * @param {Object} style - Style object with potential theme token references
     * @returns {Object} Style object with fully resolved theme and computed tokens
     */
    _resolveSegmentThemeTokens(style) {
        if (!style || typeof style !== 'object') {
            return {};
        }

        const resolved = {};

        for (const [property, value] of Object.entries(style)) {
            if (typeof value === 'string' && value.startsWith('theme:')) {
                // Resolve theme token via ThemeManager
                const tokenPath = value.replace('theme:', '');
                if (this._singletons?.themeManager?.resolver) {
                    const resolvedValue = this._singletons.themeManager.resolver.resolve(tokenPath, value);
                    resolved[property] = resolvedValue;
                    lcardsLog.trace(`[LCARdSButton] Resolved segment theme token "${value}" -> `, resolvedValue);
                } else {
                    // Keep original token reference - will be resolved later when ThemeManager is available
                    lcardsLog.trace(`[LCARdSButton] Deferring resolution of segment token "${value}" (ThemeManager not yet available)`);
                    resolved[property] = value;
                }
            } else if (typeof value === 'object' && value !== null) {
                // Recursively resolve nested objects
                resolved[property] = this._resolveSegmentThemeTokens(value);
            } else {
                // Keep as-is (already a concrete value)
                resolved[property] = value;
            }
        }

        // Now resolve any computed tokens (darken/lighten/alpha) within the resolved state objects
        if (this._singletons?.themeManager) {
            const fullyResolved = resolveThemeTokensRecursive(resolved, this._singletons.themeManager);
            lcardsLog.trace(`[LCARdSButton] Fully resolved segment tokens with computed tokens`);
            return fullyResolved;
        }

        return resolved;
    }

    /**
     * Process SVG segment configuration
     * Sets up interactive regions with independent actions and styles
     * @private
     * @param {Array} segments - Array of segment configurations
     */
    _processSegmentConfig(segments) {
        if (!segments || !Array.isArray(segments) || segments.length === 0) {
            this._processedSegments = null;
            return;
        }

        this._processedSegments = segments.map(segment => {
            // Validate segment config
            if (!segment.selector) {
                lcardsLog.warn('[LCARdSButton] Segment missing selector:', segment);
                return null;
            }

            // Resolve theme tokens in segment styles
            // This converts 'theme:components.dpad.segment.directional.fill'
            // into the state object {active: 'color', inactive: 'color', ...}
            const resolvedStyle = this._resolveSegmentThemeTokens(segment.style);

            return {
                id: segment.id || `segment-${Math.random().toString(36).substring(2, 11)}`,
                selector: segment.selector,

                // Actions
                tap_action: segment.tap_action,
                hold_action: segment.hold_action,
                double_tap_action: segment.double_tap_action,

                // Style configuration with state-based values
                // Follows existing Button convention: style.{property}.{state}
                // States: default, active, inactive, unavailable, hover
                style: resolvedStyle,

                // Entity-driven state (optional)
                entity: segment.entity,  // Different entity per segment

                // Animation config (optional)
                animations: segment.animations
            };
        }).filter(s => s !== null);

        // Collect segment entities for HASS change tracking
        this._collectSegmentEntities();

        lcardsLog.debug(`[LCARdSButton] Processed ${this._processedSegments.length} segments`);
    }

    /**
     * Collect entities from segments and add to tracked entities
     * This ensures HASS updates trigger re-render when segment entities change
     * @private
     */
    _collectSegmentEntities() {
        if (!this._processedSegments || this._processedSegments.length === 0) {
            return;
        }

        // Initialize tracked entities array if not exists
        if (!this._trackedEntities) {
            this._trackedEntities = [];
        }

        // Collect unique entity IDs from segments
        const segmentEntities = new Set();

        this._processedSegments.forEach(segment => {
            // Use segment entity if specified, otherwise inherit from card
            const entityId = segment.entity || this.config?.entity;
            if (entityId) {
                segmentEntities.add(entityId);
            }
        });

        // Add segment entities to tracked entities (avoid duplicates)
        segmentEntities.forEach(entityId => {
            if (!this._trackedEntities.includes(entityId)) {
                this._trackedEntities.push(entityId);
            }
        });

        if (segmentEntities.size > 0) {
            lcardsLog.debug(`[LCARdSButton] Tracking ${segmentEntities.size} segment entities for HASS updates`, {
                entities: Array.from(segmentEntities)
            });
        }
    }

    /**
     * Setup interactive segments in rendered SVG
     * Attaches event listeners and applies initial styles
     * Called in updated() lifecycle after SVG is in DOM
     * @private
     */
    _setupSegmentInteractivity() {
        if (!this._processedSegments || this._processedSegments.length === 0) {
            return;
        }

        // Find the rendered SVG in shadow DOM
        // For segmented SVG, content is inside the nested SVG within the button-bg-svg group
        const svgContainer = this.shadowRoot?.querySelector('.button-bg-svg svg');
        if (!svgContainer) {
            // This is expected on initial render before SVG is in DOM - it will be called again
            lcardsLog.debug('[LCARdSButton] SVG container not yet rendered for segments (will retry on next update)');
            return;
        }

        // Clean up previous segment listeners
        if (this._segmentCleanups && this._segmentCleanups.length > 0) {
            this._segmentCleanups.forEach(cleanup => cleanup());
        }
        this._segmentCleanups = [];

        // Setup each segment
        this._processedSegments.forEach(segment => {
            // Find target elements using CSS selector
            const elements = svgContainer.querySelectorAll(segment.selector);

            if (elements.length === 0) {
                lcardsLog.warn(`[LCARdSButton] No elements found for segment selector: ${segment.selector}`);
                return;
            }

            lcardsLog.debug(`[LCARdSButton] Setting up segment "${segment.id}" on ${elements.length} elements`);

            elements.forEach(element => {
                // Get entity state for initial styling
                const entityId = segment.entity || this.config.entity;
                const entityState = entityId ? this._getEntityState(entityId) : null;

                // Apply initial style based on entity state (or default if no entity)
                // Pass null for interaction state, entity state for entity (or null if no entity)
                const initialStyle = this._resolveSegmentStyleForState(segment.style, null, entityState);
                this._applySegmentStyle(element, initialStyle);

                // Always attach segment listeners for styling and interaction
                const cleanup = this._attachSegmentListeners(element, segment);
                this._segmentCleanups.push(cleanup);
            });
        });
    }

    /**
     * Setup segment animations after interactivity is established
     * Called after _setupSegmentInteractivity() in updated()
     * @private
     */
    _setupSegmentAnimations() {
        if (!this._processedSegments || this._processedSegments.length === 0) {
            return;
        }

        const animationManager = this._singletons?.animationManager;
        if (!animationManager) {
            lcardsLog.debug('[LCARdSButton] AnimationManager not available, skipping segment animations');
            return;
        }

        // Generate unique card ID for animation scope
        const cardId = this._getAnimationCardId();

        // Wait for next frame to ensure SVG is fully rendered in shadow DOM
        requestAnimationFrame(() => {
            this._processedSegments.forEach(segment => {
                // Skip segments without animations
                if (!segment.animations || segment.animations.length === 0) {
                    return;
                }

                const element = this.shadowRoot?.querySelector('.button-bg-svg svg')?.querySelector(segment.selector);
                if (!element) {
                    lcardsLog.warn(`[LCARdSButton] Segment element not found for animation: ${segment.selector}`);
                    return;
                }

                // Check if already registered and if the element reference is stale
                const scopeKey = `${cardId}:segment:${segment.id}`;
                const existingScope = animationManager.scopes.get(scopeKey);

                // If scope exists but element is different (DOM was recreated), update the reference
                if (existingScope && existingScope.element !== element) {
                    lcardsLog.debug(`[LCARdSButton] Updating stale element reference for segment: ${segment.id}`);

                    // Update element reference in scope
                    existingScope.element = element;

                    // Update scope's anime.js root element
                    if (existingScope.scope && existingScope.scope.root) {
                        existingScope.scope.root = element;
                    }

                    // Update trigger manager's element reference
                    if (existingScope.triggerManager) {
                        existingScope.triggerManager.element = element;
                    }

                    lcardsLog.debug(`[LCARdSButton] ✅ Updated element reference for segment: ${segment.id}`);
                    return;
                }

                // Skip if already registered with valid element
                if (this._registeredSegmentAnimations.has(segment.id)) {
                    return;
                }

                // Register animations with AnimationManager
                animationManager.registerSegmentAnimations(
                    cardId,
                    segment.id,
                    segment.animations,
                    element
                );

                // Mark as registered
                this._registeredSegmentAnimations.add(segment.id);

                lcardsLog.debug(`[LCARdSButton] Registered animations for segment: ${segment.id}`, {
                    animationCount: segment.animations.length
                });
            });
        });
    }

    /**
     * Generate unique card ID for animation scoping
     * @private
     * @returns {string} Card ID for animation scope
     */
    _getAnimationCardId() {
        // Use config ID, then card GUID, then generate a fallback random ID
        const cardId = this.config?.id || this._cardGuid || `card-${Math.random().toString(36).substring(2, 11)}`;
        return `button-${cardId}`;
    }

    /**
     * Trigger segment animation via AnimationManager
     * @private
     * @param {string} segmentId - Segment identifier
     * @param {string} trigger - Animation trigger (on_tap, on_hover, on_leave, on_entity_change)
     */
    async _triggerSegmentAnimation(segmentId, trigger) {
        const animationManager = this._singletons?.animationManager;
        if (!animationManager) {
            return;
        }

        const cardId = this._getAnimationCardId();

        lcardsLog.debug(`[LCARdSButton] Triggering segment animation`, {
            cardId,
            segmentId,
            trigger
        });

        await animationManager.playSegmentAnimation(cardId, segmentId, trigger);
    }

    /**
     * Stop segment animation via AnimationManager
     * @private
     * @param {string} segmentId - Segment identifier
     * @param {string} [trigger] - Optional trigger to stop (stops all if not specified)
     */
    _stopSegmentAnimation(segmentId, trigger = null) {
        const animationManager = this._singletons?.animationManager;
        if (!animationManager) {
            return;
        }

        const cardId = this._getAnimationCardId();
        animationManager.stopSegmentAnimations(cardId, segmentId, trigger);
    }

    /**
     * Resolve segment style with support for interaction and entity states
     *
     * Priority Resolution:
     * 1. Interaction state (if active): pressed > hover
     * 2. Entity state (if defined): on/off/playing/etc. or active/inactive/unavailable
     * 3. Default fallback
     *
     * Supported States:
     * - Interaction: hover, pressed
     * - Button mapped: active, inactive, unavailable, unknown, default
     * - Direct entity states: on, off, playing, paused, locked, etc.
     *
     * @private
     * @param {Object} style - Style configuration object
     * @param {string} interactionState - Interaction state (hover, pressed, or null)
     * @param {string} entityState - Entity state (on, off, playing, etc. or null)
     * @returns {Object} Resolved style object with concrete values
     *
     * @example
     * // Config: { default: "gray", hover: "yellow", pressed: "red", active: "orange" }
     * _resolveSegmentStyleForState(style, 'hover', null) // Returns hover value
     * _resolveSegmentStyleForState(style, null, 'on') // Returns active value (on → active)
     * _resolveSegmentStyleForState(style, 'pressed', 'on') // Returns pressed value (interaction priority)
     */
    _resolveSegmentStyleForState(style, interactionState = null, entityState = null) {
        if (!style || typeof style !== 'object') {
            return {};
        }

        // Check if this is a state-first format (state → properties) or property-first format (property → states)
        const firstKey = Object.keys(style)[0];
        const firstValue = style[firstKey];

        // Detect format by checking if first key is a state name and value is an object with style properties
        const isStateFirst = firstValue && typeof firstValue === 'object' &&
                            ('fill' in firstValue || 'stroke' in firstValue || 'opacity' in firstValue);

        if (isStateFirst) {
            // State-first format: { active: { fill: '#ff9966', stroke: '#ffbb88' }, hover: { stroke: '#fff' } }
            // This is the format used in the YAML examples

            // Priority 1: Interaction state (hover, pressed)
            if (interactionState && style[interactionState]) {
                return style[interactionState];
            }

            // Priority 2: Entity state (direct or mapped)
            if (entityState) {
                // Try direct match first
                if (style[entityState]) {
                    return style[entityState];
                }

                // Try mapped state (on → active, off → inactive, etc.)
                const mappedState = this._mapEntityStateToStyleState(entityState);
                if (mappedState && style[mappedState]) {
                    return style[mappedState];
                }
            }

            // Priority 3: Default fallback
            if (style.default) {
                return style.default;
            }

            // Priority 4: Return first available state
            return firstValue;

        } else {
            // Property-first format: { fill: { active: '#ff9966', inactive: '#6688aa' }, stroke: { ... } }
            // This is the alternative format

            const resolvedStyle = {};

            Object.entries(style).forEach(([property, value]) => {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    // State-based value - use priority resolution

                    // Priority 1: Interaction state (hover, pressed)
                    if (interactionState && interactionState in value) {
                        resolvedStyle[property] = value[interactionState];
                        return;
                    }

                    // Priority 2: Entity state (direct or mapped)
                    if (entityState) {
                        const resolved = this._resolveStyleForState(value, entityState, 'default');
                        if (resolved !== undefined) {
                            resolvedStyle[property] = resolved;
                            return;
                        }
                    }

                    // Priority 3: Default fallback
                    if ('default' in value) {
                        resolvedStyle[property] = value.default;
                    } else if ('inactive' in value) {
                        // Use 'inactive' as default if 'default' doesn't exist
                        resolvedStyle[property] = value.inactive;
                    } else if ('active' in value) {
                        // Last resort: use 'active' state
                        resolvedStyle[property] = value.active;
                    } else {
                        // Use first available value
                        resolvedStyle[property] = Object.values(value)[0];
                    }
                } else {
                    // Direct value (not state-based)
                    resolvedStyle[property] = value;
                }
            });

            return resolvedStyle;
        }
    }

    /**
     * Attach event listeners to a segment element
     * Handles hover, pressed (interaction), and entity state styling
     * @private
     * @param {SVGElement} element - SVG element to attach listeners to
     * @param {Object} segment - Segment configuration
     * @returns {Function} Cleanup function
     */
    _attachSegmentListeners(element, segment) {
        // Get entity state for this segment
        const entityId = segment.entity || this.config.entity;
        const entityState = entityId ? this._getEntityState(entityId) : null;

        // Store element reference for later updates
        this._segmentElements.set(segment.id, {
            element,
            segment,
            entityId,
            currentEntityState: entityState
        });

        // Track which entities are used by segments
        if (entityId) {
            this._segmentEntityStates.set(entityId, entityState);
        }

        // Resolve styles for interaction states
        const hoverStyle = this._resolveSegmentStyleForState(segment.style, 'hover', entityState);
        const pressedStyle = this._resolveSegmentStyleForState(segment.style, 'pressed', entityState);

        // Apply initial state (entity state or default)
        const initialStyle = this._resolveSegmentStyleForState(segment.style, null, entityState);
        this._applySegmentStyle(element, initialStyle);

        // Check if segment has animations
        const hasAnimations = segment.animations && segment.animations.length > 0;

        let isPressed = false;

        // Hover handlers
        const handleMouseEnter = (e) => {
            if (!isPressed) {
                // Apply hover style if defined, otherwise keep entity state style
                const hasHoverStyle = Object.keys(hoverStyle).some(k => hoverStyle[k] !== initialStyle[k]);
                if (hasHoverStyle) {
                    this._applySegmentStyle(element, hoverStyle);
                }

                // Trigger hover animation
                if (hasAnimations) {
                    this._triggerSegmentAnimation(segment.id, 'on_hover');
                }
            }
            e.stopPropagation(); // Prevent button-level hover
        };

        const handleMouseLeave = (e) => {
            if (!isPressed) {
                // Return to entity state style
                this._applySegmentStyle(element, initialStyle);

                // Stop hover animations and trigger leave animation
                // Use requestAnimationFrame to ensure hover animations are fully stopped
                // before starting leave animations
                if (hasAnimations) {
                    this._stopSegmentAnimation(segment.id, 'on_hover');
                    requestAnimationFrame(() => {
                        this._triggerSegmentAnimation(segment.id, 'on_leave');
                    });
                }
            }
            e.stopPropagation();
        };

        // Hold action handler (long press)
        let holdTimer = null;
        const handleHoldStart = () => {
            if (segment.hold_action) {
                holdTimer = setTimeout(() => {
                    lcardsLog.debug(`[LCARdSButton] Segment "${segment.id}" held`);

                    // Trigger hold animation
                    if (hasAnimations) {
                        this._triggerSegmentAnimation(segment.id, 'on_hold');
                    }

                    this._executeSegmentAction(segment.hold_action, segment);
                    holdTimer = null;
                }, 500); // 500ms hold threshold
            }
        };

        const handleHoldCancel = () => {
            if (holdTimer) {
                clearTimeout(holdTimer);
                holdTimer = null;
            }
        };

        // Pressed (mousedown) handlers
        const handleMouseDown = (e) => {
            isPressed = true;
            // Apply pressed style if defined
            const hasPressedStyle = Object.keys(pressedStyle).some(k => pressedStyle[k] !== initialStyle[k]);
            if (hasPressedStyle) {
                this._applySegmentStyle(element, pressedStyle);
            }
            handleHoldStart(); // Start hold timer
            e.stopPropagation(); // Prevent button-level action
        };

        const handleMouseUp = (e) => {
            isPressed = false;
            handleHoldCancel(); // Cancel hold timer
            // Return to hover style (mouse still over element)
            const hasHoverStyle = Object.keys(hoverStyle).some(k => hoverStyle[k] !== initialStyle[k]);
            if (hasHoverStyle) {
                this._applySegmentStyle(element, hoverStyle);
            } else {
                this._applySegmentStyle(element, initialStyle);
            }
            e.stopPropagation();
        };

        // Tap action handler
        const handleClick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            lcardsLog.debug(`[LCARdSButton] Segment "${segment.id}" clicked`);

            // Trigger tap animation
            if (hasAnimations) {
                this._triggerSegmentAnimation(segment.id, 'on_tap');
            }

            if (segment.tap_action) {
                this._executeSegmentAction(segment.tap_action, segment);
            }
        };

        // Handle mouse leave while pressed - cancel hold and reset style
        const handleMouseLeaveWhilePressed = (e) => {
            if (isPressed) {
                handleHoldCancel();
            }
            handleMouseLeave(e);
        };

        // Attach listeners
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeaveWhilePressed);
        element.addEventListener('mousedown', handleMouseDown);
        element.addEventListener('mouseup', handleMouseUp);
        element.addEventListener('click', handleClick);

        // Touch support
        element.addEventListener('touchstart', (e) => {
            handleMouseDown(e);
        }, { passive: true });
        element.addEventListener('touchend', (e) => {
            handleMouseUp(e);
        });
        element.addEventListener('touchcancel', handleHoldCancel);

        // Make element pointer-interactive
        element.style.pointerEvents = 'all';
        element.style.cursor = 'pointer';

        // Mark as segment for button-level action filtering
        element.setAttribute('data-lcards-segment', segment.id);

        // Return cleanup function
        return () => {
            // Remove from tracking maps
            this._segmentElements.delete(segment.id);

            element.removeEventListener('mouseenter', handleMouseEnter);
            element.removeEventListener('mouseleave', handleMouseLeaveWhilePressed);
            element.removeEventListener('mousedown', handleMouseDown);
            element.removeEventListener('mouseup', handleMouseUp);
            element.removeEventListener('click', handleClick);
            // Note: anonymous functions for touch events can't be removed exactly,
            // but the element will be garbage collected when the SVG is regenerated
            if (holdTimer) clearTimeout(holdTimer);
        };
    }

    /**
     * Apply style object to SVG element
     * Handles fill, stroke, opacity, transform, etc.
     * @private
     * @param {SVGElement} element - Target SVG element
     * @param {Object} style - Style object to apply (already resolved from state objects)
     */
    _applySegmentStyle(element, style) {
        if (!style || Object.keys(style).length === 0) return;

        Object.entries(style).forEach(([key, value]) => {
            // Value should already be resolved to a concrete string
            // (state extraction happens in _resolveSegmentStyleForState)

            // Convert camelCase to kebab-case for SVG attributes
            const attrName = key.replace(/([A-Z])/g, '-$1').toLowerCase();

            // Handle special cases
            if (key === 'fill' || key === 'stroke' || key === 'opacity') {
                element.setAttribute(attrName, value);
            } else if (key === 'strokeWidth' || key === 'stroke-width') {
                element.setAttribute('stroke-width', value);
            } else if (key === 'transform') {
                element.setAttribute('transform', value);
            } else {
                // Generic attribute setting
                element.setAttribute(attrName, value);
            }
        });
    }

    /**
     * Refresh segment styles based on current entity states
     * Called when HASS updates and entity states have changed
     * @private
     * @param {Set<string>|null} changedEntityIds - Set of entity IDs that changed (or null to update all)
     */
    _refreshSegmentStyles(changedEntityIds = null) {
        if (!this._segmentElements || this._segmentElements.size === 0) return;

        lcardsLog.debug(`[LCARdSButton] Refreshing segment styles`, {
            totalSegments: this._segmentElements.size,
            changedEntities: changedEntityIds ? Array.from(changedEntityIds) : 'all'
        });

        this._segmentElements.forEach((segmentData, segmentId) => {
            const { element, segment, entityId, currentEntityState } = segmentData;

            // Skip if we have a filter and this entity didn't change
            if (changedEntityIds && entityId && !changedEntityIds.has(entityId)) {
                return;
            }

            // Get current entity state
            const newEntityState = entityId ? this._getEntityState(entityId) : null;

            // Only update if state actually changed (or no filter)
            if (!changedEntityIds || newEntityState !== currentEntityState) {
                // Update tracked state
                segmentData.currentEntityState = newEntityState;
                if (entityId) {
                    this._segmentEntityStates.set(entityId, newEntityState);
                }

                // Resolve and apply new style (no interaction state, just entity state)
                const newStyle = this._resolveSegmentStyleForState(segment.style, null, newEntityState);
                this._applySegmentStyle(element, newStyle);

                // Trigger entity change animation if segment has animations
                if (segment.animations && segment.animations.length > 0) {
                    this._triggerSegmentAnimation(segmentId, 'on_entity_change');
                }

                lcardsLog.debug(`[LCARdSButton] Updated segment "${segmentId}" style`, {
                    entityId,
                    oldState: currentEntityState,
                    newState: newEntityState
                });
            }
        });
    }

    /**
     * Execute action for a segment
     * Uses unified action handler from base class
     * @private
     * @param {Object} action - Action configuration
     * @param {Object} segment - Segment configuration (for entity context)
     */
    async _executeSegmentAction(action, segment) {
        if (!action || action.action === 'none') return;

        // Use segment's entity if specified, otherwise card's entity
        const entityId = segment.entity || this.config.entity;

        // Build action context
        const actionContext = {
            entity: entityId,
            segment: segment.id
        };

        lcardsLog.debug(`[LCARdSButton] Executing segment action`, {
            action: action.action,
            service: action.service,
            target: action.target,
            serviceData: action.service_data || action.data,
            entityId,
            segmentId: segment.id
        });

        switch (action.action) {
            case 'toggle':
                if (entityId) {
                    const [domain] = entityId.split('.');
                    await this.hass?.callService(domain, 'toggle', { entity_id: entityId });
                }
                break;

            case 'call-service':
                if (action.service) {
                    const [domain, service] = action.service.split('.');

                    // Build service data from multiple possible sources
                    const serviceData = {
                        ...(action.service_data || action.data || {}),
                    };

                    // Handle target parameter (new HA format)
                    // target can contain: entity_id, device_id, area_id, label_id
                    let target = action.target ? { ...action.target } : undefined;

                    // If no target specified but entityId exists, add it to service data
                    if (!target && entityId && !serviceData.entity_id) {
                        serviceData.entity_id = entityId;
                    }

                    // Call service with target if provided, otherwise just service data
                    if (target) {
                        await this.hass?.callService(domain, service, serviceData, target);
                    } else {
                        await this.hass?.callService(domain, service, serviceData);
                    }
                }
                break;

            case 'navigate':
                if (action.navigation_path) {
                    window.history.pushState(null, '', action.navigation_path);
                    window.dispatchEvent(new CustomEvent('location-changed'));
                }
                break;

            case 'more-info':
                if (entityId) {
                    const event = new CustomEvent('hass-more-info', {
                        detail: { entityId },
                        bubbles: true,
                        composed: true
                    });
                    this.dispatchEvent(event);
                }
                break;

            case 'fire-dom-event':
                // Custom event for advanced integrations
                const customEvent = new CustomEvent(action.event_type || 'segment-action', {
                    detail: {
                        segment: segment.id,
                        action: action,
                        context: actionContext
                    },
                    bubbles: true,
                    composed: true
                });
                this.dispatchEvent(customEvent);
                break;

            default:
                lcardsLog.warn(`[LCARdSButton] Unknown segment action: ${action.action}`);
        }
    }

    /**
     * Handle first update - setup initial state
     * @private
     */
    _handleFirstUpdate(changedProperties) {
        // Register this button with RulesEngine for dynamic styling
        const tags = ['button'];
        if (this.config.preset) {
            tags.push(this.config.preset);
        }
        if (this._entity) {
            tags.push('entity-based');
        }

        // Merge custom tags from config for bulk rule targeting
        if (this.config.tags && Array.isArray(this.config.tags)) {
            tags.push(...this.config.tags);
        }

        // Use card ID directly - config.id takes precedence over entity ID
        const overlayId = this.config.id || this.config.entity || this._cardGuid;

        lcardsLog.debug(`[LCARdSButton] Registering overlay with ID: ${overlayId}`, {
            hasConfigId: !!this.config.id,
            configId: this.config.id,
            hasEntity: !!this.config.entity,
            entity: this.config.entity,
            cardGuid: this._cardGuid,
            finalOverlayId: overlayId,
            tags: tags
        });

        this._registerOverlayForRules(overlayId, tags);

        // Setup actions after DOM is ready
        this.updateComplete.then(() => {
            this._setupButtonActions();
            this._actionsInitialized = true;
        });

        // Setup auto-sizing to respond to container size changes
        this._setupAutoSizing();

        // Process initial templates if needed
        if (this._needsInitialTemplateProcessing) {
            lcardsLog.debug(`[LCARdSButton] Processing initial templates after firstUpdated`);
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

        // CRITICAL: Always trigger re-render when templates change
        // Template changes affect text content even if button style doesn't change
        // (e.g., {entity.state} templates need to re-render when state changes)
        this.requestUpdate();
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

            if (hasStylePresetManager) {
                // StylePresetManager is available - resolve and render now
                this._resolveButtonStyleSync();
                this.requestUpdate();
            } else {
                // StylePresetManager not available yet - wait for it
                this._waitForStylePresetManager();
            }
        }

        // CRITICAL: Re-resolve segment theme tokens now that ThemeManager is available
        // Segments are initially processed in setConfig, before singletons are initialized
        if (this._processedSegments && this._singletons?.themeManager) {
            // Re-process each segment to resolve theme tokens
            for (const segment of this._processedSegments) {
                if (segment.style) {
                    segment.style = this._resolveSegmentThemeTokens(segment.style);
                }
            }

            // Trigger re-render to apply resolved colors
            this.requestUpdate();
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

                lcardsLog.debug(`[LCARdSButton] StylePresetManager now available after ${attempt * delayMs}ms`);

                // Re-resolve styles with preset data
                this._resolveButtonStyleSync();

                // Trigger re-render
                this.requestUpdate();
                return;
            }

            // Wait before next attempt
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        lcardsLog.warn(`[LCARdSButton] StylePresetManager did not become available after ${maxAttempts * delayMs}ms`);
    }

    /**
     * Hook called after rule patches change (from base class)
     * Card-specific handling for rule patches
     * @protected
     */
    _onRulePatchesChanged() {
        // If text was patched, clear the processed template cache so it re-evaluates
        if (this._lastRulePatches?.text) {
            lcardsLog.debug(`[LCARdSButton] Text patched by rules, clearing template cache and _originalContent`);

            // Clear processed templates cache
            this._processedTemplates = {};

            // Clear _originalContent from all text fields so they re-evaluate
            if (this.config.text && typeof this.config.text === 'object') {
                for (const [fieldId, fieldConfig] of Object.entries(this.config.text)) {
                    if (fieldConfig && typeof fieldConfig === 'object' && fieldConfig._originalContent) {
                        delete fieldConfig._originalContent;
                        lcardsLog.trace(`[LCARdSButton] Cleared _originalContent for field: ${fieldId}`);
                    }
                }
            }

            // Trigger template reprocessing (async)
            this._processTemplates().then(() => {
                lcardsLog.debug(`[LCARdSButton] Template reprocessing complete after rule patch`);
            });
        }

        // Re-resolve button style to merge new rule patches
        this._resolveButtonStyleSync();
    }

    /**
     * Hook called when config is updated by CoreConfigManager
     * Re-resolve button style to ensure _processedIcon and other cached values are up-to-date
     * @protected
     */
    _onConfigUpdated() {
        lcardsLog.debug(`[LCARdSButton] Config updated by CoreConfigManager, re-resolving button style and SVG`);

        // Re-process SVG configuration (in case config was replaced by CoreConfigManager)
        this._processSvgConfig();

        // Re-resolve button style with the new merged config
        this._resolveButtonStyleSync();
    }

    /**
     * Ensure fonts are loaded before measuring text
     * Triggers a re-render once fonts are available to get accurate measurements
     * @private
     */
    async _ensureFontsLoaded() {
        try {
            // Check if document.fonts API is available
            if (!document.fonts || !document.fonts.load) {
                lcardsLog.debug('[LCARdSButton] Font Loading API not available');
                return;
            }

            // Try to load Antonio font explicitly
            await document.fonts.load('100 56px Antonio');

            // Clear text measurement cache to force remeasure with loaded font
            if (window.lcards?._textMeasureCache) {
                window.lcards._textMeasureCache.clear();
            }

            // Trigger re-render with correct font measurements
            this.requestUpdate();

            lcardsLog.debug('[LCARdSButton] Fonts loaded, re-rendering with correct measurements');
        } catch (error) {
            lcardsLog.debug(`[LCARdSButton] Font loading check failed: ${error.message}`);
        }
    }

    /**
     * Lit lifecycle - called after every render
     * Re-attach actions because Lit recreates DOM elements
     */
    updated(changedProperties) {
        super.updated(changedProperties);

        // Ensure fonts are loaded before rendering text backgrounds
        // This prevents measuring with fallback fonts (Helvetica) instead of Antonio
        if (!this._fontsChecked) {
            this._fontsChecked = true;
            this._ensureFontsLoaded();
        }

        // Only re-attach actions if we have relevant changes and actions are initialized
        // This prevents excessive re-attachment on every render
        if (this._actionsInitialized) {
            const buttonElement = this.shadowRoot.querySelector('[data-overlay-id="button"]');

            // Check if the button element exists and if we need to re-attach
            // (Lit recreates SVG on every render, so we need to re-attach)
            if (buttonElement && buttonElement !== this._lastActionElement) {
                lcardsLog.debug(`[LCARdSButton] 🔄 Re-attaching actions after render (element changed)`);
                this._setupButtonActions();
                this._lastActionElement = buttonElement;
            }
        }

        // Setup segment interactivity after render (Phase 2)
        if (this._processedSegments && this._processedSegments.length > 0) {
            this._setupSegmentInteractivity();

            // Setup segment animations after interactivity
            this._setupSegmentAnimations();
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

        lcardsLog.debug(`[LCARdSButton] _resolveButtonStyleSync starting`, {
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
                lcardsLog.warn(`[LCARdSButton] StylePresetManager not available yet, preset '${this.config.preset}' will be deferred`);
                // Return early - don't process anything until StylePresetManager is ready
                // This prevents rendering with incomplete/default values
                return;
            } else {
                const preset = this.getStylePreset('button', this.config.preset);
                lcardsLog.debug(`[LCARdSButton] Preset lookup result`, {
                    presetName: this.config.preset,
                    presetFound: !!preset,
                    presetKeys: preset ? Object.keys(preset) : [],
                    hasBorder: preset?.border,
                    borderRadius: preset?.border?.radius
                });
                if (preset) {
                    // Deep copy preset to avoid mutation issues
                    style = deepMerge({}, preset);
                    lcardsLog.debug(`[LCARdSButton] Applied preset '${this.config.preset}'`, {
                        borderRadius: preset.border?.radius,
                        borderWidth: preset.border?.width,
                        styleKeys: Object.keys(style)
                    });
                }
            }
        } else {
            lcardsLog.debug(`[LCARdSButton] No preset specified, starting with empty style`);
        }

        // 2. DEEP merge config styles (config wins over preset)
        if (this.config.style) {
            lcardsLog.debug(`[LCARdSButton] Merging config.style`, {
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
            lcardsLog.trace(`[LCARdSButton] Config styles merged`);
        }

        // 3. Get current button state
        const buttonState = this._getButtonState();

        // 4. Apply state-based theme defaults (only if not explicitly set in config)
        // Use CB-LCARS nested schema: card.color.background.{state}
        if (!this._hasNestedValue(style, 'card.color.background', buttonState)) {

            let bgToken = `components.button.background.${buttonState}`;
            let backgroundColor = this.getThemeToken(bgToken);

            // If 'default' state not found in theme, fall back to 'active'
            if (!backgroundColor && buttonState === 'default') {
                bgToken = `components.button.background.active`;
                backgroundColor = this.getThemeToken(bgToken);
            }

            if (backgroundColor) {
                // Resolve computed tokens in the theme value
                const resolved = this._singletons?.themeManager?.resolver?.resolve(backgroundColor, backgroundColor) || backgroundColor;

                if (!style.card) style.card = {};
                if (!style.card.color) style.card.color = {};
                if (!style.card.color.background) style.card.color.background = {};
                style.card.color.background[buttonState] = resolved;

                lcardsLog.trace(`[LCARdSButton] Theme default applied: card.color.background.${buttonState}`);
            }
        }

        // Apply text color defaults using text.default.color.{state}
        if (!this._hasNestedValue(style, 'text.default.color', buttonState)) {

            let textToken = `components.button.text.color.${buttonState}`;
            let textColor = this.getThemeToken(textToken);

            // If 'default' state not found in theme, fall back to 'active'
            if (!textColor && buttonState === 'default') {
                textToken = `components.button.text.color.active`;
                textColor = this.getThemeToken(textToken);
            }

            if (textColor) {
                if (!style.text) style.text = {};
                if (!style.text.default) style.text.default = {};
                if (!style.text.default.color) style.text.default.color = {};
                style.text.default.color[buttonState] = textColor;

                lcardsLog.trace(`[LCARdSButton] Theme default applied: text.default.color.${buttonState}`);
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
            lcardsLog.debug(`[LCARdSButton] Button style resolved (state: ${buttonState}), triggering re-render`);
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
        // Determine show_icon
        // Priority: icon_only mode > config.show_icon > resolvedStyle.show_icon > false (default)
        let show_icon = false;
        const iconOnlyMode = this.config.icon_only || resolvedStyle.icon_only || false;

        if (iconOnlyMode) {
            // icon_only mode implicitly requires showing the icon
            show_icon = true;
        } else if (this.config.show_icon !== undefined) {
            show_icon = this.config.show_icon;
        } else if (resolvedStyle.show_icon !== undefined) {
            show_icon = resolvedStyle.show_icon;
        }

        // Determine icon name (always a string: 'mdi:star', 'si:github', 'entity', etc.)
        let iconName = this.config.icon;

        // If no icon specified but show_icon is true and we have an entity, default to 'entity'
        if (!iconName && show_icon && this._entity) {
            iconName = 'entity';
        }

        // Get icon style config
        // Priority: config.icon_style > resolvedStyle.icon
        const iconStyle = this.config.icon_style || {};

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
            lcardsLog.warn(`[LCARdSButton] Invalid icon_area: ${iconArea}, defaulting to 'left'`);
            iconArea = 'left';
        }

        // Determine icon position WITHIN the icon area (or absolute if icon_area is 'none')
        // Priority: explicit x/y > explicit x_percent/y_percent > iconStyle.position > resolvedStyle.icon.position > 'center' (default)
        let iconPosition = 'center'; // default - centered within area
        let explicitX = null, explicitY = null;
        let explicitXPercent = null, explicitYPercent = null;

        // Check for explicit coordinates first (highest priority)
        if (iconStyle.x !== undefined && iconStyle.y !== undefined) {
            explicitX = iconStyle.x;
            explicitY = iconStyle.y;
        } else if (iconStyle.x_percent !== undefined && iconStyle.y_percent !== undefined) {
            explicitXPercent = iconStyle.x_percent;
            explicitYPercent = iconStyle.y_percent;
        } else if (iconStyle.position) {
            iconPosition = iconStyle.position;
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
        // Priority: iconStyle > preset > 8 (default)
        let iconPadding = 8; // default
        if (iconStyle.padding !== undefined) {
            // Check if padding is a number (simple padding) or object (directional padding)
            if (typeof iconStyle.padding === 'number') {
                iconPadding = iconStyle.padding;
            }
            // If it's an object, iconPadding stays at default; directional values extracted below
        } else if (resolvedStyle.icon?.padding !== undefined) {
            if (typeof resolvedStyle.icon.padding === 'number') {
                iconPadding = resolvedStyle.icon.padding;
            }
        }

        // Resolve directional icon padding (for area-based positioning)
        // Priority: iconStyle > preset > 0 (default)
        let iconPaddingLeft = 0;
        let iconPaddingRight = 0;
        let iconPaddingTop = 0;
        let iconPaddingBottom = 0;

        // Extract from iconStyle first
        if (iconStyle.padding && typeof iconStyle.padding === 'object') {
            iconPaddingLeft = iconStyle.padding.left ?? 0;
            iconPaddingRight = iconStyle.padding.right ?? 0;
            iconPaddingTop = iconStyle.padding.top ?? 0;
            iconPaddingBottom = iconStyle.padding.bottom ?? 0;
        }
        // Fall back to preset if not in config
        else if (resolvedStyle.icon?.padding && typeof resolvedStyle.icon.padding === 'object') {
            iconPaddingLeft = resolvedStyle.icon.padding.left ?? 0;
            iconPaddingRight = resolvedStyle.icon.padding.right ?? 0;
            iconPaddingTop = resolvedStyle.icon.padding.top ?? 0;
            iconPaddingBottom = resolvedStyle.icon.padding.bottom ?? 0;
        }

        // Resolve icon rotation (same as text fields)
        // Priority: iconStyle > preset > 0 (default)
        let iconRotation = 0; // default
        if (iconStyle.rotation !== undefined) {
            iconRotation = iconStyle.rotation;
        } else if (resolvedStyle.icon?.rotation !== undefined) {
            iconRotation = resolvedStyle.icon.rotation;
        }

        // Store processed icon configuration
        // Parse the icon string to get type (mdi, si, entity) and icon name
        const parsedIcon = this._parseIconString(iconName);

        lcardsLog.trace('[LCARdSButton] Icon parsed:', parsedIcon);

        // Only process icon if both icon exists AND show_icon is true
        if (parsedIcon && show_icon) {
            // Handle 'entity' icon - either type='entity' OR type='mdi' with icon='entity'
            // This covers both cases from base class _parseIconString
            if (parsedIcon.type === 'entity' || (parsedIcon.type === 'mdi' && parsedIcon.icon === 'entity')) {
                // Use HA's state-aware icon resolution (respects entity.attributes.icon + state-based defaults)
                const entityIcon = this._resolveEntityIcon(this._entity);

                lcardsLog.trace('[LCARdSButton] Resolved entity icon:', entityIcon);

                // Re-parse the resolved entity icon to get its type (mdi/si) and name
                const resolvedParsed = this._parseIconString(entityIcon);
                if (resolvedParsed) {
                    lcardsLog.trace('[LCARdSButton] Parsed entity icon:', resolvedParsed);
                    parsedIcon.type = resolvedParsed.type;
                    parsedIcon.icon = resolvedParsed.icon;
                }
            }

            // Get current button state for state-based colors
            const buttonState = this._getButtonState();

            // Get theme tokens for icons
            const iconTokens = this._theme?.tokens?.components?.button?.base?.icon || {};

            // Resolve icon color with state-based fallback chain
            // Priority: iconStyle > preset > theme token (state-based) > text color (state-based) > hardcoded
            let iconColor;

            lcardsLog.trace('[LCARdSButton] Resolving icon color for state:', buttonState);

            // 1. Check explicit iconStyle color
            if (iconStyle.color) {
                // Check if it's state-based (object with active/inactive keys)
                if (typeof iconStyle.color === 'object') {
                    iconColor = iconStyle.color[buttonState] ||
                               iconStyle.color.default ||
                               iconStyle.color.active;
                } else {
                    iconColor = iconStyle.color;
                }
                lcardsLog.trace('[LCARdSButton] Icon color from config:', iconColor);
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
                lcardsLog.trace('[LCARdSButton] Icon color from preset:', iconColor);
            }
            // 3. Check theme token (can be state-based)
            else if (iconTokens.color) {
                if (typeof iconTokens.color === 'object') {
                    iconColor = iconTokens.color[buttonState] ||
                               iconTokens.color.default ||
                               iconTokens.color.active;
                    lcardsLog.trace('[LCARdSButton] Icon color from theme token (state-based):', iconColor);
                } else {
                    iconColor = iconTokens.color;
                    lcardsLog.trace('[LCARdSButton] Icon color from theme token:', iconColor);
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
                lcardsLog.trace('[LCARdSButton] Icon color from text color:', iconColor);
            }
            // 5. Final hardcoded fallback
            else {
                iconColor = 'var(--lcars-color-text, #FFFFFF)';
                lcardsLog.warn('[LCARdSButton] Icon color using hardcoded fallback');
            }

            // Ensure iconColor is a string (not an object)
            if (typeof iconColor !== 'string') {
                console.warn('[LCARdSButton] Icon color resolved to non-string:', iconColor);
                iconColor = 'var(--lcars-color-text, #FFFFFF)';
            }

            // Resolve icon size
            // Priority: iconStyle > preset > theme token > hardcoded
            let iconSize;
            if (iconStyle.size) {
                iconSize = iconStyle.size;
            } else if (resolvedStyle.icon?.size && typeof resolvedStyle.icon.size === 'number') {
                iconSize = resolvedStyle.icon.size;
            } else if (iconTokens.size && typeof iconTokens.size === 'number') {
                iconSize = iconTokens.size;
            } else {
                iconSize = 24; // hardcoded fallback
            }

            // Resolve icon spacing (space around icon for clamping calculation)
            // Priority: config.icon_style > preset > theme token > hardcoded
            let iconSpacing;
            if (this.config.icon_style?.spacing !== undefined) {
                iconSpacing = this.config.icon_style.spacing;
            } else if (resolvedStyle.icon?.spacing !== undefined) {
                iconSpacing = resolvedStyle.icon.spacing;
            } else if (iconTokens.spacing !== undefined) {
                iconSpacing = iconTokens.spacing;
            } else {
                iconSpacing = 8; // hardcoded fallback
            }

            // Resolve layout spacing (spacing around icon area for auto-size calculation)
            // Priority: config.icon_style > preset > theme token > hardcoded
            let layoutSpacing;
            if (this.config.icon_style?.layout_spacing !== undefined) {
                layoutSpacing = this.config.icon_style.layout_spacing;
            } else if (resolvedStyle.icon?.layout_spacing !== undefined) {
                layoutSpacing = resolvedStyle.icon.layout_spacing;
            } else if (iconTokens.layout_spacing !== undefined) {
                layoutSpacing = iconTokens.layout_spacing;
            } else {
                layoutSpacing = 8; // hardcoded fallback
            }

            // Resolve icon area size (width for left/right, height for top/bottom)
            // Priority: config.icon_area_size > preset.icon_area_size > preset.icon.area_size > auto-calculated from size
            let iconAreaSize;
            if (this.config.icon_area_size !== undefined) {
                // Top-level icon_area_size
                iconAreaSize = this.config.icon_area_size;
            } else if (resolvedStyle.icon_area_size !== undefined) {
                // Preset top-level icon_area_size
                iconAreaSize = resolvedStyle.icon_area_size;
            } else if (resolvedStyle.icon?.area_size && typeof resolvedStyle.icon.area_size === 'number') {
                // Preset nested icon.area_size
                iconAreaSize = resolvedStyle.icon.area_size;
            }
            // If not specified, will be auto-calculated in _generateIconMarkup based on size + spacing + divider

            // Resolve divider settings
            // Priority: config.divider > preset > theme token > hardcoded
            let dividerWidth, dividerColor;

            // Divider width
            if (this.config.divider?.width !== undefined) {
                dividerWidth = this.config.divider.width;
            } else if (resolvedStyle.icon?.divider?.width !== undefined) {
                dividerWidth = resolvedStyle.icon.divider.width;
            } else if (resolvedStyle.icon?.interior?.width !== undefined) {
                // Legacy preset support for "interior" name
                dividerWidth = resolvedStyle.icon.interior.width;
            } else if (iconTokens.interior?.width !== undefined) {
                dividerWidth = iconTokens.interior.width;
            } else {
                dividerWidth = 6; // hardcoded fallback
            }

            // Divider color
            if (this.config.divider?.color) {
                dividerColor = this.config.divider.color;
            } else if (resolvedStyle.icon?.divider?.color) {
                dividerColor = resolvedStyle.icon.divider.color;
            } else if (resolvedStyle.icon?.interior?.color) {
                // Legacy preset support for "interior" name
                dividerColor = resolvedStyle.icon.interior.color;
            } else if (iconTokens.interior?.color) {
                dividerColor = iconTokens.interior.color;
            } else {
                dividerColor = 'black'; // hardcoded fallback
            }

            // Resolve icon area background (colors the entire icon area section)
            // Priority: config.icon_area_background > preset.icon_area_background > null
            let iconAreaBackground = null;
            if (this.config.icon_area_background) {
                if (typeof this.config.icon_area_background === 'object') {
                    iconAreaBackground = this.config.icon_area_background[buttonState] ||
                                        this.config.icon_area_background.default ||
                                        this.config.icon_area_background.active ||
                                        null;
                } else {
                    iconAreaBackground = this.config.icon_area_background;
                }
            } else if (resolvedStyle.icon_area_background) {
                if (typeof resolvedStyle.icon_area_background === 'object') {
                    iconAreaBackground = resolvedStyle.icon_area_background[buttonState] ||
                                        resolvedStyle.icon_area_background.default ||
                                        resolvedStyle.icon_area_background.active ||
                                        null;
                } else {
                    iconAreaBackground = resolvedStyle.icon_area_background;
                }
            }

            this._processedIcon = {
                type: parsedIcon.type,
                icon: parsedIcon.icon,

                // Icon area configuration (where reserved space is)
                area: iconArea,      // 'left', 'right', 'top', 'bottom', or 'none'
                areaBackground: iconAreaBackground,  // Background color for icon area section

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
                areaBackground: iconAreaBackground, // Icon area background color (state-resolved)

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
     * Override base class _processIcon() to prevent conflicts with preset icon configuration.
     * Button card handles icon processing in _processIconConfiguration() which properly
     * supports preset icon positioning and state-based colors.
     * @override
     */
    async _processIcon() {
        lcardsLog.trace(`[LCARdSButton] _processIcon override (no-op)`);
    }

    /**
     * Process custom templates for multi-text system
     * Override base class hook to handle text.{fieldId}.content templates
     * @protected
     * @override
     */
    async _processCustomTemplates() {
        lcardsLog.debug(`[LCARdSButton] _processCustomTemplates called for ${this._cardGuid}`);

        // Track if any templates changed to avoid unnecessary re-renders
        let hasChanges = false;

        // Initialize storage for processed templates (survives config replacement)
        if (!this._processedTemplates) {
            this._processedTemplates = {};
        }

        // Ensure this.config.text exists
        if (!this.config.text) {
            this.config.text = {};
        }

        // First, merge in preset text fields that aren't in config
        // This ensures preset templates get processed too
        const presetTextFields = this._buttonStyle?.text || {};

        lcardsLog.debug(`[LCARdSButton] Merging preset text fields`, {
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
                lcardsLog.trace(`[LCARdSButton] Added preset text field '${fieldId}'`);
                hasChanges = true;
            } else {
                // Field exists in config - merge preset properties as defaults
                const configField = this.config.text[fieldId];
                let fieldChanged = false;

                for (const [propKey, propValue] of Object.entries(presetFieldConfig)) {
                    if (configField[propKey] === undefined && propValue !== undefined) {
                        configField[propKey] = propValue;
                        fieldChanged = true;
                        lcardsLog.trace(`[LCARdSButton] Merged preset property '${propKey}' into '${fieldId}'`);
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
                    // Preserve original template string on first pass
                    if (!fieldConfig._originalContent) {
                        fieldConfig._originalContent = fieldConfig.content;
                    }

                    lcardsLog.trace(`[LCARdSButton] Processing template field '${fieldId}'`);

                    // Always process from original template, not previously processed content
                    const processedContent = await this.processTemplate(fieldConfig._originalContent);

                    // Store in _processedTemplates (survives config replacement)
                    const previousProcessed = this._processedTemplates[fieldId];
                    if (previousProcessed !== processedContent) {
                        this._processedTemplates[fieldId] = processedContent;
                        hasChanges = true;
                        lcardsLog.trace(`[LCARdSButton] Template field '${fieldId}' changed:`, processedContent);
                    }
                }
            }
        }

        lcardsLog.debug(`[LCARdSButton] Template processing complete`, {
            hasChanges,
            fieldCount: this.config.text ? Object.keys(this.config.text).length : 0
        });

        if (hasChanges) {
            // Extract and track entities from templates for auto-updates
            this._updateTrackedEntities();

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

        lcardsLog.trace(`[LCARdSButton] Tracking ${this._trackedEntities.length} entities`, this._trackedEntities);
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
            lcardsLog.trace(`[LCARdSButton] HASS not available yet, deferring action setup`);
            return;
        }

        // Clean up previous actions
        if (this._actionCleanup) {
            this._actionCleanup();
            this._actionCleanup = null;
        }

        // Find the button group element in shadow DOM
        const buttonElement = this.shadowRoot.querySelector('[data-overlay-id="button"]');

        if (!buttonElement) {
            lcardsLog.trace(`[LCARdSButton] Button element not found yet`);
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
        const elementId = `button-${this._cardGuid}`;

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

        lcardsLog.trace(`[LCARdSButton] Actions attached to button element`);
    }

    /**
     * Button-specific animation setup configuration
     * @returns {Object} Animation setup for buttons
     * @protected
     */
    _getAnimationSetup() {
        return {
            overlayId: `button-${this._cardGuid}`,
            elementSelector: '[data-overlay-id="button"]'
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
            lcardsLog.debug(`[LCARdSButton] Delaying render - waiting for preset resolution: ${this.config.preset}`);
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
        lcardsLog.trace(`[LCARdSButton] Rendering button ${this._overlayId}`);

        // ✨ Use container size if available, otherwise config or defaults
        // This enables auto-sizing for HA grid cards and responsive layouts
        const width = this.config.width || this._containerSize?.width || 400;
        const height = this.config.height || this._containerSize?.height || 56;

        lcardsLog.debug(`[LCARdSButton] Size resolution:`, {
            'config.width': this.config.width,
            'config.height': this.config.height,
            '_containerSize': this._containerSize,
            'final width': width,
            'final height': height
        });

        // Build button configuration
        const buttonConfig = {
            id: 'button',
            label: this._processedTexts.label,
            content: this._processedTexts.content,
            texts: this._processedTexts.texts,
            preset: this.config.preset, // Pass preset for corner radius calculation
            style: this._buttonStyle,
            size: [width, height]
        };

        // Render synchronously with fallback SVG
        try {
            const svgMarkup = this._generateButtonSVG(width, height, buttonConfig);

            // Add cache-busting comment to force DOM update when style changes
            const timestamp = Date.now();

            return html`
                <div class="button-container" data-render-time="${timestamp}">
                    ${unsafeHTML(svgMarkup)}
                </div>
            `;

        } catch (error) {
            lcardsLog.error(`[LCARdSButton] Render failed:`, error);

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
        let iconY, dividerY, areaY;
        if (area === 'top') {
            areaY = strokeWidth;
            iconY = strokeWidth + iconYOffset;
            dividerY = strokeWidth + iconAreaContentHeight;
        } else { // bottom
            areaY = strokeWidth + availableHeight - iconAreaHeight;
            iconY = strokeWidth + availableHeight - iconAreaHeight + dividerWidth + iconYOffset;
            dividerY = strokeWidth + availableHeight - iconAreaHeight;
        }

        // Icon area background (colored rectangle behind entire icon area)
        const areaBackground = iconConfig.areaBackground;
        let areaBackgroundMarkup = '';
        if (areaBackground && areaBackground !== 'transparent') {
            const areaX = strokeWidth;
            const areaWidth = availableWidth;
            areaBackgroundMarkup = `
                <rect x="${areaX}" y="${areaY}"
                      width="${areaWidth}" height="${iconAreaHeight}"
                      fill="${areaBackground}"
                      class="icon-area-background" />
            `;
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
                <!-- Icon area background -->
                ${areaBackgroundMarkup}
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
                    lcardsLog.debug('[LCARdSButton] Icon-only mode - Resolving entity icon:', {
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
            // Note: ha-icon component has internal layout that may not perfectly align with container,
            // so we apply a small adjustment for better visual centering
            const iconVisualAdjustment = 2; // Compensate for ha-icon internal padding/alignment

            if (iconPosition.includes('top')) {
                // Align to top of button
                iconY = strokeWidth + spacing + paddingTop;
            } else if (iconPosition.includes('bottom')) {
                // Align to bottom of button
                iconY = strokeWidth + availableHeight - actualIconSize - spacing - paddingBottom;
            } else {
                // Center vertically within button (with visual adjustment for ha-icon)
                iconY = strokeWidth + (availableHeight - actualIconSize) / 2 + paddingTop - paddingBottom - iconVisualAdjustment;
            }

            // Position icon horizontally (from button interior edge)
            iconX = position === 'left'
                ? strokeWidth + iconXOffset
                : availableWidth + strokeWidth - iconAreaWidth + dividerWidth + iconXOffset;

            // Icon area background (colored rectangle behind entire icon area)
            const areaBackground = iconConfig.areaBackground;
            let areaBackgroundMarkup = '';
            if (areaBackground && areaBackground !== 'transparent') {
                const areaX = position === 'left'
                    ? strokeWidth
                    : availableWidth + strokeWidth - iconAreaWidth;
                const areaY = strokeWidth;
                const areaWidth = iconAreaWidth;
                const areaHeight = availableHeight;
                areaBackgroundMarkup = `
                    <rect x="${areaX}" y="${areaY}"
                          width="${areaWidth}" height="${areaHeight}"
                          fill="${areaBackground}"
                          class="icon-area-background" />
                `;
            }

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

                lcardsLog.trace('[LCARdSButton] Icon resolved:', iconName);

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
                    <!-- Icon area background -->
                    ${areaBackgroundMarkup}
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
    _generateButtonSVG(width, height, config) {
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
        // Priority: SVG background (Phase 1) > custom path > complex path > simple rect
        lcardsLog.debug(`[LCARdSButton] Rendering button background`, {
            hasProcessedSvg: !!this._processedSvg,
            hasContent: !!this._processedSvg?.content,
            contentLength: this._processedSvg?.content?.length
        });

        let backgroundMarkup;
        if (this._processedSvg && this._processedSvg.content) {
            // Use full SVG content as background (Phase 1)
            lcardsLog.debug(`[LCARdSButton] Using SVG background`);
            backgroundMarkup = this._renderSvgBackground(this._processedSvg, width, height);
        } else if (normalizedPath) {
            backgroundMarkup = this._renderCustomPathBackground(normalizedPath, backgroundColor);
        } else if (needsComplexPath) {
            backgroundMarkup = this._renderComplexButtonPath(width, height, border, backgroundColor);
        } else {
            lcardsLog.debug(`[LCARdSButton] Using simple rect background`);
            backgroundMarkup = this._renderButtonRect(width, height, border, backgroundColor);
        }

        // Generate separate border paths for clean corner joins
        // Note: Borders are rendered on top of SVG backgrounds when svg config is used
        const borderMarkup = this._processedSvg ? '' : this._renderIndividualBorderPaths(width, height, border);

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

            // Generate SVG text elements normally
            // For bar labels, the filled background + text background creates the "break" effect
            textMarkup = this._generateTextElements(processedFields);
        }

        const svgString = `
            <svg width="${width}" height="${height}" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">
                <g data-button-id="button"
                   data-overlay-id="button"
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

            // Resolve theme tokens (e.g., "theme:components.button.border.radius")
            let resolved = stringValue;
            if (stringValue.startsWith('theme:')) {
                if (this._singletons?.themeManager?.resolver) {
                    const tokenPath = stringValue.replace('theme:', '');
                    resolved = this._singletons.themeManager.resolver.resolve(tokenPath, stringValue);
                    lcardsLog.trace(`[LCARdSButton] Resolved theme token "${stringValue}" -> "${resolved}"`);
                } else {
                    lcardsLog.warn(`[LCARdSButton] Cannot resolve theme token "${stringValue}" - ThemeManager not available {hasSingletons: ${!!this._singletons}, hasThemeManager: ${!!this._singletons?.themeManager}, hasResolver: ${!!this._singletons?.themeManager?.resolver}}`);
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
                    lcardsLog.warn(`[LCARdSButton] Cannot resolve theme token "${stringValue}" - ThemeManager not available`);
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

        lcardsLog.debug('[LCARdSButton] Border radius resolution:', {
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

        lcardsLog.debug('[LCARdSButton] Parsed corner radii:', {
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

        // Extract user-defined defaults from text.default (config)
        const userDefaults = textConfig.default || {};

        // Get preset text fields from resolved button style
        const presetTextFields = this._buttonStyle?.text || {};

        // Get preset defaults from text.default (preset)
        const presetTextDefaults = this._buttonStyle?.text?.default || {};

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

            // Use processed template content if available (stored in _processedTemplates)
            // This survives config replacement by CoreConfigManager
            // Check if key EXISTS in _processedTemplates (not if value is truthy - empty string is valid!)
            const content = this._processedTemplates && fieldId in this._processedTemplates
                ? this._processedTemplates[fieldId]  // Use processed template value (may be empty string)
                : (fieldConfig.content || presetFieldConfig.content || '');  // Fall back to raw config

            // Resolve field configuration with defaults
            // Priority: config field-specific > preset field-specific > text.default > theme default > hardcoded fallback
            resolvedFields[fieldId] = {
                id: fieldId,
                content: content,
                position: fieldConfig.position || presetFieldConfig.position || presetDefault.position || null,
                x: fieldConfig.x !== undefined ? fieldConfig.x : (presetFieldConfig.x !== undefined ? presetFieldConfig.x : null),
                y: fieldConfig.y !== undefined ? fieldConfig.y : (presetFieldConfig.y !== undefined ? presetFieldConfig.y : null),
                x_percent: fieldConfig.x_percent !== undefined ? fieldConfig.x_percent : (presetFieldConfig.x_percent !== undefined ? presetFieldConfig.x_percent : null),
                y_percent: fieldConfig.y_percent !== undefined ? fieldConfig.y_percent : (presetFieldConfig.y_percent !== undefined ? presetFieldConfig.y_percent : null),
                padding: fieldConfig.padding !== undefined ? fieldConfig.padding :
                        (presetFieldConfig.padding !== undefined ? presetFieldConfig.padding :
                        (userDefaults.padding !== undefined ? userDefaults.padding :
                        (presetTextDefaults.padding !== undefined ? presetTextDefaults.padding : 8))),
                size: fieldConfig.font_size || fieldConfig.size || presetFieldConfig.font_size || presetFieldConfig.size || userDefaults.font_size || this._buttonStyle?.text?.default?.font_size || 14,
                color: fieldConfig.color || presetFieldConfig.color || userDefaults.color || presetTextDefaults.color || null, // null means use default
                font_weight: fieldConfig.font_weight || presetFieldConfig.font_weight || userDefaults.font_weight || this._buttonStyle?.text?.default?.font_weight || 'normal',
                font_family: fieldConfig.font_family || presetFieldConfig.font_family || userDefaults.font_family || this._buttonStyle?.text?.default?.font_family || "'LCARS', 'Antonio', sans-serif",
                text_transform: fieldConfig.text_transform || presetFieldConfig.text_transform || userDefaults.text_transform || this._buttonStyle?.text?.default?.text_transform || 'none',
                anchor: fieldConfig.anchor || presetFieldConfig.anchor || presetDefault.anchor || null,
                baseline: fieldConfig.baseline || presetFieldConfig.baseline || presetDefault.baseline || null,
                rotation: fieldConfig.rotation !== undefined ? fieldConfig.rotation : (presetFieldConfig.rotation !== undefined ? presetFieldConfig.rotation : 0),
                show: fieldConfig.show !== undefined ? fieldConfig.show : (presetFieldConfig.show !== undefined ? presetFieldConfig.show : true),
                template: fieldConfig.template !== undefined ? fieldConfig.template : (presetFieldConfig.template !== undefined ? presetFieldConfig.template : true),

                // Text background properties for "bar label" effect
                // Priority: field-specific config > preset field config > text.default (config) > text.default (preset) > null
                background: fieldConfig.background !== undefined ? fieldConfig.background :
                           (presetFieldConfig.background !== undefined ? presetFieldConfig.background :
                           (userDefaults.background !== undefined ? userDefaults.background :
                           (presetTextDefaults.background !== undefined ? presetTextDefaults.background : null))),
                background_padding: fieldConfig.background_padding !== undefined ? fieldConfig.background_padding :
                                   (presetFieldConfig.background_padding !== undefined ? presetFieldConfig.background_padding :
                                   (userDefaults.background_padding !== undefined ? userDefaults.background_padding :
                                   (presetTextDefaults.background_padding !== undefined ? presetTextDefaults.background_padding : 8))),
                background_radius: fieldConfig.background_radius !== undefined ? fieldConfig.background_radius :
                                  (presetFieldConfig.background_radius !== undefined ? presetFieldConfig.background_radius :
                                  (userDefaults.background_radius !== undefined ? userDefaults.background_radius :
                                  (presetTextDefaults.background_radius !== undefined ? presetTextDefaults.background_radius : 4)))
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

            // Apply padding offset for visual adjustment (e.g., to nudge centered text)
            // Padding is directional: positive values push text away from that edge
            if (field.padding) {
                const padding = typeof field.padding === 'number'
                    ? { top: field.padding, right: field.padding, bottom: field.padding, left: field.padding }
                    : field.padding;

                // For vertically centered text (baseline: 'middle'), apply vertical padding offset
                // This includes 'center', 'left-center', and 'right-center' positions
                if (baseline === 'middle' || baseline === 'central') {
                    y += (padding.bottom || 0) - (padding.top || 0);
                }

                // For horizontally positioned text, apply horizontal padding
                if (anchor === 'start') {
                    x += (padding.left || 0);
                } else if (anchor === 'end') {
                    x -= (padding.right || 0);
                }
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
                rotation: field.rotation,  // NEW: pass through rotation

                // Text background properties for "bar label" effect
                background: field.background,
                background_padding: field.background_padding,
                background_radius: field.background_radius
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
            // Render background rectangle if specified (before text so text appears on top)
            if (field.background) {
                // Calculate background bounds based on text properties
                const bgPadding = field.background_padding ?? 8;
                const bgRadius = field.background_radius ?? 4;

                // Use actual text measurement for accurate sizing
                const fontFamily = field.fontFamily || 'Antonio, Helvetica Neue, sans-serif';
                const fontWeight = field.weight || 100;
                const fontString = `${fontWeight} ${field.size}px ${fontFamily}`;

                const metrics = RendererUtils.measureText(field.content, fontString);
                const textWidth = metrics.width;

                const bgWidth = textWidth + (bgPadding * 2);

                // For bar labels, use container height but round up to ensure full coverage
                // (e.g., 55.984375 → 56). This respects custom row heights while preventing gaps.
                const bgHeight = (Math.ceil(this._containerSize?.height || (metrics.height + (bgPadding * 2))) + 1);

                // Calculate background position based on text anchor
                let bgX = field.x;
                let bgY = 0; // Start at top of button for bar labels

                // Adjust X based on text-anchor to ensure padding on both sides
                if (field.anchor === 'middle') {
                    // Text centered at X, so background centered at X
                    bgX = field.x - (bgWidth / 2);
                } else if (field.anchor === 'end') {
                    // Text ends at X, so background ends at X + padding
                    bgX = field.x - bgWidth + bgPadding;
                } else if (field.anchor === 'start') {
                    // Text starts at X, so background starts at X - padding
                    bgX = field.x - bgPadding;
                }

                // Build background rect attributes
                const bgAttrs = [
                    `class="text-background"`,
                    `data-field-id="${field.id}-bg"`,
                    `x="${bgX}"`,
                    `y="${bgY}"`,
                    `width="${bgWidth}"`,
                    `height="${bgHeight}"`,
                    `rx="${bgRadius}"`,
                    `ry="${bgRadius}"`,
                    `fill="${field.background}"`,
                    `pointer-events="none"`
                ];

                // Apply rotation transform if specified (same as text rotation)
                if (field.rotation !== 0) {
                    bgAttrs.push(`transform="rotate(${field.rotation} ${field.x} ${field.y})"`);
                }

                const bgRect = `<rect ${bgAttrs.join(' ')} />`;
                textElements.push(bgRect);
            }

            // Build SVG <text> element
            const textAttrs = [
                `x="${field.x}"`,
                `y="${field.y}"`,
                `font-size="${field.size}"`,
                `fill="${field.color}"`,
                `text-anchor="${field.anchor}"`,
                `dominant-baseline="${field.baseline}"`,
                `pointer-events="none"`  // Allow clicks to pass through to segments below
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
     * Generate bar label with auto-sized colored bars that fill space around text
     * Used for bar-label-* presets with border.width: 'auto'
     * @private
     * @param {Array} processedFields - Processed text field configurations
     * @param {number} width - Button width
     * @param {number} height - Button height
     * @param {Object} border - Border configuration
     * @returns {Object} { barMarkup, textMarkup }
     */
    _generateBarLabelWithAutoSizing(processedFields, width, height, border) {
        if (!processedFields || processedFields.length === 0) {
            return { barMarkup: '', textMarkup: '' };
        }

        const field = processedFields[0];  // Bar labels typically use a single text field
        const barElements = [];
        const textElements = [];

        // Get border color (use active state by default)
        const buttonState = this._getButtonState();
        const borderColor = border.individualSides?.left?.color ||
                          border.individualSides?.right?.color ||
                          border.color?.[buttonState] ||
                          border.color?.default ||
                          'var(--lcars-card-button, var(--picard-medium-light-gray))';

        // Calculate text background dimensions
        const bgPadding = field.background_padding || 15;
        const bgRadius = field.background_radius || 0;

        // Estimate text width
        const charWidth = field.size * 0.6;
        const textWidth = field.content.length * charWidth;
        const bgWidth = textWidth + (bgPadding * 2);
        const bgHeight = height;  // Full height for bar labels

        // Calculate background position based on text anchor and position
        let bgX = field.x;
        if (field.anchor === 'middle') {
            bgX = field.x - (bgWidth / 2);
        } else if (field.anchor === 'end') {
            bgX = field.x - bgWidth;
        }

        // Determine which bars to render based on border configuration
        const hasLeftBar = border.individualSides?.left?.width === 'auto';
        const hasRightBar = border.individualSides?.right?.width === 'auto';

        // Render left bar (from edge to text background)
        if (hasLeftBar && bgX > 0) {
            barElements.push(`
                <rect class="bar-left"
                      x="0"
                      y="0"
                      width="${bgX}"
                      height="${height}"
                      fill="${borderColor}"
                      pointer-events="none" />`);
        }

        // Render right bar (from text background to edge)
        if (hasRightBar && (bgX + bgWidth) < width) {
            const rightBarX = bgX + bgWidth;
            const rightBarWidth = width - rightBarX;
            barElements.push(`
                <rect class="bar-right"
                      x="${rightBarX}"
                      y="0"
                      width="${rightBarWidth}"
                      height="${height}"
                      fill="${borderColor}"
                      pointer-events="none" />`);
        }

        // Render text background (black box that "breaks" the bar)
        if (field.background) {
            let bgY = 0;  // Full height, start from top

            // Build background rect
            const bgRect = `<rect class="text-background"
                                  data-field-id="${field.id}-bg"
                                  x="${bgX}"
                                  y="${bgY}"
                                  width="${bgWidth}"
                                  height="${bgHeight}"
                                  rx="${bgRadius}"
                                  ry="${bgRadius}"
                                  fill="${field.background}"
                                  pointer-events="none" />`;
            textElements.push(bgRect);
        }

        // Build text element
        const textAttrs = [
            `x="${field.x}"`,
            `y="${field.y}"`,
            `font-size="${field.size}"`,
            `fill="${field.color}"`,
            `text-anchor="${field.anchor}"`,
            `dominant-baseline="${field.baseline}"`,
            `pointer-events="none"`
        ];

        if (field.font_weight) {
            textAttrs.push(`font-weight="${field.font_weight}"`);
        }

        if (field.font_family) {
            textAttrs.push(`font-family="${field.font_family}"`);
        }

        textAttrs.push(`data-field-id="${field.id}"`);

        const textElement = `<text ${textAttrs.join(' ')}>${escapeHtml(field.content)}</text>`;
        textElements.push(textElement);

        return {
            barMarkup: barElements.join('\n                    '),
            textMarkup: textElements.join('\n                    ')
        };
    }

    /**
     * Render simple button using rect element (uniform radius)
     * Background only - no stroke (borders rendered separately)
     * @private
     */
    _renderButtonRect(width, height, border, backgroundColor) {
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

        // Use 'butt' linecap for square corners (clean joins without overlap)
        // Use 'square' linecap for rounded corners (fills gap between arc and straight border)
        const lineCap = hasAnyRadius ? 'square' : 'butt';

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
     * Handle HASS changes
     * Monitors entity state changes for segments and updates their styles
     * @override
     * @param {Object} hass - New HASS object
     * @param {Object} oldHass - Previous HASS object
     */
    _onHassChanged(hass, oldHass) {
        super._onHassChanged(hass, oldHass);

        // Skip if no segments with entities
        if (!this._segmentEntityStates || this._segmentEntityStates.size === 0) {
            return;
        }

        // Check which entity states changed
        const changedEntityIds = new Set();

        this._segmentEntityStates.forEach((oldState, entityId) => {
            const newState = hass.states[entityId]?.state;
            if (newState !== oldState) {
                changedEntityIds.add(entityId);
            }
        });

        // Refresh segment styles if any tracked entities changed
        if (changedEntityIds.size > 0) {
            lcardsLog.debug(`[LCARdSButton] Entity states changed, refreshing segments`, {
                changedEntities: Array.from(changedEntityIds)
            });
            this._refreshSegmentStyles(changedEntityIds);
        }
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

        // Clean up segment listeners (Phase 2)
        if (this._segmentCleanups && this._segmentCleanups.length > 0) {
            this._segmentCleanups.forEach(cleanup => cleanup());
            this._segmentCleanups = [];
        }

        // Clean up segment animations
        if (this._registeredSegmentAnimations && this._registeredSegmentAnimations.size > 0) {
            const animationManager = this._singletons?.animationManager;
            if (animationManager) {
                const cardId = this._getAnimationCardId();
                animationManager.destroyCardSegmentScopes(cardId);
            }
            this._registeredSegmentAnimations.clear();
        }

        // Clear segment tracking maps
        if (this._segmentElements) {
            this._segmentElements.clear();
        }
        if (this._segmentEntityStates) {
            this._segmentEntityStates.clear();
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
     * Home Assistant manages layout through grid_options in config, which includes:
     * - columns: number of columns to span
     * - rows: number of rows to span
     * This method provides defaults if not specified.
     * @returns {Object} Layout configuration
     */
    getLayoutOptions() {
        // HA uses grid_options.columns and grid_options.rows
        // Provide sensible defaults if not configured
        const gridOptions = this.config.grid_options || {};
        return {
            grid_columns: gridOptions.columns || 4,  // Default to 4 columns
            grid_rows: gridOptions.rows || 1,        // Default to 1 row
            grid_min_columns: 1,
            grid_min_rows: 1
        };
    }

    /**
     * Get stub config for card picker
     */
    static getStubConfig() {
        return {
            type: 'custom:lcards-button',
            entity: 'light.example',
            preset: 'lozenge',
            tap_action: {
                action: 'toggle'
            },
            text: {
                name: {
                    content: 'LCARdS Button',
                }
            }
        };
    }

    /**
     * Get config element for visual editor
     * @returns {HTMLElement} Editor element
     */
    static getConfigElement() {
        // Static import - editor bundled with card (webpack config doesn't support splitting)
        return document.createElement('lcards-button-editor');
    }

    /**
     * Register schema with CoreConfigManager
     * Called by lcards.js after core initialization
     * @static
     */
    static registerSchema() {
        const configManager = window.lcards?.core?.configManager;

        if (!configManager) {
            lcardsLog.error('[LCARdSButton] CoreConfigManager not available for schema registration');
            return;
        }

        // Get available presets from StylePresetManager
        const stylePresetManager = window.lcards?.core?.stylePresetManager;
        const availablePresets = stylePresetManager?.getAvailablePresets('button') || [];

        lcardsLog.debug('[LCARdSButton] Registering schema with presets:', availablePresets);

        // Register behavioral defaults (NO STYLES - those come from theme/presets)
        configManager.registerCardDefaults('button', {
            enable_hold_action: true,   // Hold actions enabled
            enable_double_tap: false    // Double-tap disabled by default
        });

        // Position options with proper labels
        const positionEnum = [
            'top-left', 'top-center', 'top-right',
            'left-center', 'center', 'right-center',
            'bottom-left', 'bottom-center', 'bottom-right',
            'top', 'bottom', 'left', 'right'
        ];

        // Build simplified schema (no $ref resolution needed)
        const buttonSchema = getButtonSchema({
            availablePresets,
            positionEnum
        });

        // Register JSON schema for validation (v1.14.18+)
        configManager.registerCardSchema('button', buttonSchema, { version: '1.14.18' });

        lcardsLog.debug('[LCARdSButton] Registered with CoreConfigManager');
    }
}

// NOTE: Card registration (customElements.define and window.customCards) handled in src/lcards.js
// This ensures all core singletons are initialized before cards can be instantiated