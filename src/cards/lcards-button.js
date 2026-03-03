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
import { resolveStateColor } from '../utils/state-color-resolver.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';
import { deepMergeImmutable } from '../utils/deepMerge.js';
import { resolveThemeTokensRecursive } from '../utils/lcards-theme.js';
import { escapeHtml } from '../utils/StringUtils.js';
import { TemplateParser } from '../core/templates/TemplateParser.js';
import { RendererUtils } from '../msd/renderer/RendererUtils.js';
import { sanitizeSvg, extractViewBox, extractDataUriContent, escapeXmlAttribute } from '../utils/lcards-svg-helpers.js';
import { applyBaseSvgFilters } from '../msd/utils/BaseSvgFilters.js';
import { BackgroundAnimationRenderer } from '../core/packs/backgrounds/BackgroundAnimationRenderer.js';
import { SHAPE_TEXTURE_PRESETS } from '../core/packs/textures/presets/index.js';
import { ShapeTextureRenderer } from '../core/packs/textures/ShapeTextureRenderer.js';

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
            _buttonStyle: { type: Object, state: true },
            _buttonHoverStyle: { type: Object, state: true },
            _buttonPressedStyle: { type: Object, state: true },
            _isButtonHovering: { type: Boolean, state: true },
            _isButtonPressed: { type: Boolean, state: true }
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
        this._buttonHoverStyle = null;
        this._buttonPressedStyle = null;
        this._isButtonHovering = false;
        this._isButtonPressed = false;
        this._buttonInteractivityCleanup = null;
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

        // Background animation support
        this._backgroundRenderer = null;

        // Component preset tracking
        this._activePreset = null;          // Currently applied preset name
        this._activeRangeColorOverrides = null; // Transient color overrides from active range entry
        this._componentAnimations = null;   // Component-level animations (not segment-level)
        this._componentAnimationsRegistered = false; // Guard against double-registration
        this._rawUserComponentSegments = {};  // Raw user segment overrides (pre-CoreConfigManager)
        this._rawUserAnimations = [];         // Raw user config.animations (pre-injection)
    }

    /**
     * Called when config is set (override from base class)
     * @protected
     */
    _onConfigSet(config) {
        // Capture raw user segment overrides BEFORE super processes them with CoreConfigManager.
        // After super._onConfigSet, this.config[component] has already merged component defaults
        // into the user config, so we can no longer tell the two apart. Saving raw overrides here
        // lets _processComponentPresetFromMergedConfig apply the correct merge order:
        //   componentDefault ← presetSegments ← rawUserOverrides
        if (config?.component) {
            const compName = config.component;
            // Expand color: shorthand into segment style overrides so that:
            //   alert.color.shape → shape.style.fill
            //   alert.color.bars  → bars.style.stroke
            // Explicit segments: are always applied on top (highest priority).
            const explicitSegments = config[compName]?.segments || {};
            const colorShorthand  = config[compName]?.color || {};
            const colorSegments   = {};
            if (colorShorthand.shape) colorSegments.shape = { style: { fill:   colorShorthand.shape } };
            if (colorShorthand.bars)  colorSegments.bars  = { style: { stroke: colorShorthand.bars  } };
            this._rawUserComponentSegments = Object.keys(colorSegments).length > 0
                ? deepMergeImmutable(colorSegments, explicitSegments)
                : explicitSegments;
        } else {
            this._rawUserComponentSegments = {};
        }

        // Capture raw user animations BEFORE CoreConfigManager processing.
        // Component animation injection (step 4 of _processComponentPresetFromMergedConfig)
        // writes into config.animations on every preset change. Saving the original user-authored
        // entries here lets the merge always reconstruct correctly without accumulating stale values.
        this._rawUserAnimations = config?.animations
            ? JSON.parse(JSON.stringify(config.animations))
            : [];

        // Capture raw user text config BEFORE CoreConfigManager processing.
        // _processComponentPresetFromMergedConfig always merges component text defaults UNDER
        // the user’s original values. Using the raw capture (rather than this.config.text which
        // accumulates injected preset values) prevents stale preset content winning on preset
        // switches (e.g. range-driven condition_red → condition_green).
        this._rawUserComponentText = config?.text ? JSON.parse(JSON.stringify(config.text)) : {};

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

            // Range-based preset switching: evaluate on EVERY hass update, not just state
            // changes, because the trigger value may be an attribute (e.g. brightness) that
            // changes without the entity state changing (light stays "on" while brightness varies).
            if (this.config?.component && this.config?.ranges) {
                const matchedRange      = this._evaluateRangePreset(this.config.ranges);
                const newPreset         = matchedRange?.preset ?? null;
                const newColorOverrides = matchedRange?.color  ?? null;
                const colorChanged = JSON.stringify(newColorOverrides) !== JSON.stringify(this._activeRangeColorOverrides);
                if (newPreset !== this._activePreset || colorChanged) {
                    lcardsLog.debug(`[LCARdSButton] Range preset changed: ${this._activePreset} -> ${newPreset}`, { newColorOverrides });
                    this._activePreset            = newPreset;
                    this._activeRangeColorOverrides = newColorOverrides;
                    this._componentAnimationsRegistered = false; // Force re-registration
                    this._processSvgConfig();
                    this.requestUpdate();
                }
            }
        }
    }

    // ============================================================================
    // PHASE 1: FULL SVG BACKGROUND SUPPORT
    // ============================================================================

    /**
     * Process component preset from configuration.
     *
     * Merge hierarchy (low → high priority):
     *   1. componentDef.segments  — component author's defaults
     *   2. preset.segments        — named preset overrides (condition_red, etc.)
     *   3. _rawUserComponentSegments — user's explicit YAML overrides
     *
     * Active preset is determined by:
     *   - this._activePreset (range-driven, set by _evaluateRangePreset)
     *   - this.config.preset   (static name in YAML)
     *   - 'default'            (fallback — no overrides applied)
     *
     * Component-level animations (componentDef.animations) are stored in
     * this._componentAnimations and registered via _setupComponentAnimations()
     * AFTER the DOM is rendered (uses SVG container as scope so that target
     * selectors like '[id^="bar-"]' resolve via querySelectorAll).
     *
     * @private
     * @param {string} componentName
     */
    _processComponentPresetFromMergedConfig(componentName) {
        lcardsLog.debug(`[LCARdSButton] Processing component preset`, { componentName });

        // ── 1. Resolve component definition ──────────────────────────────────
        const core = window.lcards?.core;
        const componentManager = core?.getComponentManager?.();
        if (!componentManager) {
            lcardsLog.error(`[LCARdSButton] ComponentManager not available`);
            this._processedSvg = null;
            this._processedSegments = null;
            return;
        }

        const componentDef = componentManager.getComponent(componentName);
        if (!componentDef) {
            lcardsLog.error(`[LCARdSButton] Component not found: ${componentName}`);
            this._processedSvg = null;
            this._processedSegments = null;
            return;
        }

        // ── 2. Determine active preset name ───────────────────────────────────
        // Range-driven preset takes priority, then static YAML preset, then 'default'.
        const requestedPreset = this._activePreset || this.config.preset || 'default';

        // Build effective presets by merging user custom_presets over built-in ones.
        // This allows: (a) creating new named presets, (b) partially overriding built-in ones.
        // Same-named entries are deep-merged so the user only needs to specify what changes;
        // brand-new names are added as-is.  The component registry is NEVER mutated.
        const componentCustomPresets = this.config[componentName]?.custom_presets || {};
        let effectivePresets = componentDef.presets;
        if (Object.keys(componentCustomPresets).length > 0) {
            effectivePresets = { ...componentDef.presets };
            for (const [key, customVal] of Object.entries(componentCustomPresets)) {
                effectivePresets[key] = effectivePresets[key]
                    ? deepMergeImmutable(effectivePresets[key], customVal)
                    : customVal;
            }
        }

        let resolvedPreset = requestedPreset;
        // Validate against effectivePresets (includes user custom presets)
        if (!(resolvedPreset in effectivePresets) && resolvedPreset !== 'default') {
            lcardsLog.warn(`[LCARdSButton] Unknown preset "${resolvedPreset}" on component "${componentName}", falling back to "default"`);
            resolvedPreset = 'default';
        }
        // Synchronise _activePreset with what actually resolved.
        // When ranges are configured _activePreset is exclusively managed by
        // _evaluateRangePreset so that null means "no range matched yet".
        // Overwriting it here would cause a spurious "changed" event on the
        // first HASS update when _evaluateRangePreset legitimately returns null.
        if (!this.config?.ranges) {
            this._activePreset = resolvedPreset;
        }

        lcardsLog.debug(`[LCARdSButton] Using preset: ${resolvedPreset}`, {
            requestedPreset,
            availablePresets: Object.keys(effectivePresets),
            customPresets: Object.keys(componentCustomPresets)
        });

        // ── 3. Build effective segments ───────────────────────────────────────
        // Start from component defaults (immutable — never mutate the registry).
        let effectiveSegments = componentDef.segments
            ? JSON.parse(JSON.stringify(componentDef.segments))  // deep clone
            : {};

        // Resolve the named preset with full extends-chain support, then apply its
        // segment overrides on top of the component defaults.
        // Use effectivePresets (merged) so custom preset extends chains resolve correctly.
        const rawPresetData = effectivePresets[resolvedPreset];
        const presetData = rawPresetData
            ? this._resolveComponentPreset(rawPresetData, effectivePresets)
            : null;

        if (presetData?.segments) {
            effectiveSegments = deepMergeImmutable(effectiveSegments, presetData.segments);
        }

        // Apply raw user overrides (includes color: shorthand expansion from _onConfigSet).
        if (this._rawUserComponentSegments && Object.keys(this._rawUserComponentSegments).length > 0) {
            effectiveSegments = deepMergeImmutable(effectiveSegments, this._rawUserComponentSegments);
        }

        // Apply range-specific color overrides — highest priority, only when a range is active.
        // These override the static color: shorthand for the duration of the matched range.
        if (this._activeRangeColorOverrides) {
            const rc = this._activeRangeColorOverrides;
            const rangeColorSegments = {};
            if (rc.shape) rangeColorSegments.shape = { style: { fill:   rc.shape } };
            if (rc.bars)  rangeColorSegments.bars  = { style: { stroke: rc.bars  } };
            if (Object.keys(rangeColorSegments).length > 0) {
                effectiveSegments = deepMergeImmutable(effectiveSegments, rangeColorSegments);
            }
        }

        // ── 3b. Inject component/preset text field defaults into this.config.text ─────────────────
        // Component text fields (positions, fonts, default content) are merged with the active
        // preset's text overrides (preset wins over component). The combined defaults are then
        // injected into this.config.text UNDER the raw user YAML values so the user always wins.
        //
        // Using _rawUserComponentText (captured in _onConfigSet before CoreConfigManager) as the
        // dominant layer prevents accumulated preset values from winning on repeated calls (e.g.
        // range-driven preset switches).
        const componentTextDefaults = deepMergeImmutable(
            componentDef.text || {},
            presetData?.text  || {}
        );
        if (Object.keys(componentTextDefaults).length > 0) {
            this.config.text = deepMergeImmutable(componentTextDefaults, this._rawUserComponentText || {});
            lcardsLog.debug(`[LCARdSButton] Injected component text defaults`, {
                preset:          resolvedPreset,
                textFields:      Object.keys(componentTextDefaults),
                userOverrides:   Object.keys(this._rawUserComponentText || {})
            });
        }

        // ── 4. Get SVG content ────────────────────────────────────────────────
        const svgContent = componentDef.svg;
        if (!svgContent) {
            lcardsLog.error(`[LCARdSButton] Component "${componentName}" has no SVG content`);
            this._processedSvg = null;
            this._processedSegments = null;
            return;
        }

        // ── 5. Inject component animations into config.animations ─────────────
        // Merge hierarchy (low → high priority):
        //   1. componentDef.animations  — component author defaults (deep cloned)
        //   2. presetData.animations    — active preset overrides (matched by id)
        //   3. _rawUserAnimations       — user-authored YAML entries (matched by id or appended)
        //
        // The result is written to config.animations so the standard card-level animation
        // pipeline, the editor, and the YAML view all see a unified list.
        // _rawUserAnimations was captured in _onConfigSet before CoreConfigManager ran,
        // preventing accumulated stale values from winning on repeated preset switches.
        const componentAnims = componentDef.animations
            ? JSON.parse(JSON.stringify(componentDef.animations))
            : [];

        // Apply preset animation overrides on top of component defaults (by id)
        if (presetData?.animations) {
            for (const presetAnim of presetData.animations) {
                const idx = componentAnims.findIndex(a => a.id && a.id === presetAnim.id);
                if (idx >= 0) {
                    componentAnims[idx] = deepMergeImmutable(componentAnims[idx], presetAnim);
                } else {
                    componentAnims.push(presetAnim);
                }
            }
        }

        // Apply user overrides on top (by id), append user-only entries
        const mergedAnims = [...componentAnims];
        for (const userAnim of (this._rawUserAnimations || [])) {
            const idx = mergedAnims.findIndex(a => a.id && a.id === userAnim.id);
            if (idx >= 0) {
                mergedAnims[idx] = deepMergeImmutable(mergedAnims[idx], userAnim);
            } else {
                mergedAnims.push(userAnim);
            }
        }

        // Write merged list to config.animations (visible in YAML editor)
        this.config.animations = mergedAnims.length > 0 ? mergedAnims : undefined;

        // Keep _componentAnimations pointing at the component-originated entries so
        // _setupComponentAnimations can scope them to the SVG container element.
        // Only the entries that originated from componentDef are routed through the
        // SVG-scoped path; pure user-added card-level entries are already handled by
        // the base card's animation setup via config.animations.
        this._componentAnimations = mergedAnims.filter(a =>
            componentAnims.some(ca => ca.id && ca.id === a.id)
        );

        lcardsLog.debug(`[LCARdSButton] Injected component animations into config.animations`, {
            preset: resolvedPreset,
            total: mergedAnims.length,
            componentCount: this._componentAnimations.length,
            userCount: (this._rawUserAnimations || []).length
        });

        // ── 6. Build segment array and hand off to the SVG pipeline ───────────
        // The 'default' key is a fallback template (mirrors _convertSegmentsObjectToArray):
        // its properties are merged into every real segment, but it never becomes a segment
        // itself (there is no SVG element with id="default").
        const defaultSegCfg = effectiveSegments.default || {};
        const realSegmentEntries = Object.entries(effectiveSegments).filter(([id]) => id !== 'default');
        const mergedSegmentEntries = Object.keys(defaultSegCfg).length > 0
            ? realSegmentEntries.map(([id, segCfg]) => [id, deepMergeImmutable(defaultSegCfg, segCfg)])
            : realSegmentEntries;

        const svgConfig = {
            content: svgContent,
            enable_tokens: true,
            segments: mergedSegmentEntries.map(([id, segCfg]) => ({
                id,
                selector: segCfg.selector || `#${id}`,
                ...segCfg
            }))
        };

        lcardsLog.debug(`[LCARdSButton] Component segments ready`, {
            preset: resolvedPreset,
            segmentIds: svgConfig.segments.map(s => s.id),
            hasComponentAnimations: !!this._componentAnimations
        });

        this._finalizeSvgProcessing(svgConfig.content, svgConfig);

        // Store the component's text area map onto _processedSvg so that
        // _buildComponentTextMarkup can resolve per-field areas at render time.
        // Supports both:
        //   text_areas: { areaId: { x, y, width, height }, ... }  (new, multi-area)
        //   text_area:  { x, y, width, height }                    (old, wrapped as { default: ... })
        if (this._processedSvg) {
            if (componentDef.text_areas && Object.keys(componentDef.text_areas).length > 0) {
                this._processedSvg.componentTextAreas = componentDef.text_areas;
            } else if (componentDef.text_area) {
                this._processedSvg.componentTextAreas = { default: componentDef.text_area };
            }
        }
    }

    /**
     * Resolve a single component preset, following any `extends` chain.
     *
     * Mirrors StylePresetManager._resolvePreset / _resolveExtends:
     * - `extends` is a sibling preset name (just the key, e.g. `'condition_red'`)
     * - Base preset is fully resolved first (recursive, handles deep chains)
     * - Child is then deep-merged on top of base (deepMergeImmutable)
     * - Circular references are detected and broken with a warning
     *
     * @private
     * @param {Object} preset      - Raw preset object (may contain `extends`)
     * @param {Object} presetsMap  - The full `componentDef.presets` object
     * @param {string[]} [_stack]  - Internal recursion guard
     * @returns {Object} Fully merged preset (no `extends` key)
     */
    _resolveComponentPreset(preset, presetsMap, _stack = []) {
        if (!preset) return {};

        if (!preset.extends) {
            // Nothing to resolve — return a clean copy without the extends key
            const { extends: _, ...rest } = preset;
            return rest;
        }

        const parentName = preset.extends;

        // Circular reference guard
        if (_stack.includes(parentName)) {
            lcardsLog.warn(`[LCARdSButton] Circular component preset extends detected: ${[..._stack, parentName].join(' → ')}`);
            const { extends: _, ...rest } = preset;
            return rest;
        }

        const parentRaw = presetsMap?.[parentName];
        if (!parentRaw) {
            lcardsLog.warn(`[LCARdSButton] Component preset extends unknown parent: "${parentName}"`);
            const { extends: _, ...rest } = preset;
            return rest;
        }

        // Recursively resolve the parent first
        const resolvedParent = this._resolveComponentPreset(parentRaw, presetsMap, [..._stack, parentName]);

        // Strip extends from child, then merge: parent ← child
        const { extends: _, ...childWithoutExtends } = preset;
        const merged = deepMergeImmutable(resolvedParent, childWithoutExtends);

        lcardsLog.debug(`[LCARdSButton] Component preset extends resolved`, {
            parent: parentName,
            childKeys: Object.keys(childWithoutExtends),
            mergedSegments: Object.keys(merged.segments ?? {})
        });

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
        // After CoreConfigManager processing, component segments are already merged
        // into this.config[componentName] (e.g., this.config.dpad)
        if (this.config?.component) {
            this._processComponentPresetFromMergedConfig(this.config.component);
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
        return extractDataUriContent(dataUri);
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
                // New object-based format - auto-discover segment IDs from SVG (inherited method)
                const availableSegmentIds = this._extractSegmentIds(withTokens);

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

            // Merge default + user config (using immutable version to prevent mutation)
            const mergedConfig = deepMergeImmutable(defaultConfig, userConfig);

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
        return sanitizeSvg(svgContent, stripScripts);
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
        return extractViewBox(svgContent);
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
    _renderSvgBackground(processedSvg, buttonWidth, buttonHeight, extraMarkup = '') {
        const { content, viewBox, preserveAspectRatio } = processedSvg;

        // Extract inner SVG content (strip outer <svg> tag if present)
        let innerContent = content;
        const svgMatch = content.match(/<svg[^>]*>([\s\S]*)<\/svg>/i);
        if (svgMatch) {
            innerContent = svgMatch[1];
        }

        // Wrap in a nested SVG with proper scaling.
        // The outer button SVG has viewBox matching button dimensions;
        // the inner SVG scales the custom content to fit.
        // extraMarkup (e.g. component text elements) is injected at the end of
        // the inner <svg> so it shares the same viewBox coordinate space.
        return `
            <g class="button-bg-svg" style="pointer-events: all;">
                <svg x="0" y="0"
                     width="${buttonWidth}"
                     height="${buttonHeight}"
                     viewBox="${viewBox}"
                     preserveAspectRatio="${preserveAspectRatio}">
                    ${innerContent}
                    ${extraMarkup}
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
                // Resolve theme token via getThemeToken (with automatic provenance tracking)
                const tokenPath = value.replace('theme:', '');
                const resolvedValue = this.getThemeToken(tokenPath, value, `segment.style.${property}`);
                resolved[property] = resolvedValue;
                lcardsLog.trace(`[LCARdSButton] Resolved segment theme token "${value}" -> `, resolvedValue);
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

                // Text content for text-bearing segments (e.g. alert_text, sub_text).
                // May be a static string or a template token evaluated later.
                text: segment.text ?? null,

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

            lcardsLog.trace(`[LCARdSButton] Setting up segment "${segment.id}" on ${elements.length} elements`);

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
                    lcardsLog.debug(`[LCARdSButton] Stale element detected for segment: ${segment.id} — DOM was recreated (e.g. alert mode re-render)`);

                    // Stop any in-flight animations — they target the old detached element and
                    // will never visually complete. This also clears runningInstances so
                    // playAnimation can start fresh on the new element.
                    animationManager.stopAnimations(scopeKey);

                    // Update element reference in scope BEFORE playAnimation so it resolves
                    // scopeData.element → new element (isConnected check will pass).
                    existingScope.element = element;

                    // Update scope's anime.js root element
                    if (existingScope.scope && existingScope.scope.root) {
                        existingScope.scope.root = element;
                    }

                    // Update trigger manager's element reference
                    if (existingScope.triggerManager) {
                        existingScope.triggerManager.element = element;
                    }

                    // Re-fire on_load animations on the new element.
                    // Persistent (loop: true) on_load animations must restart when the DOM
                    // element is replaced — this is the common case when alert mode is
                    // restored on page load and triggers a HASS-propagated re-render.
                    const onLoadAnims = (segment.animations || []).filter(
                        a => (a.trigger || 'on_load') === 'on_load'
                    );
                    if (onLoadAnims.length > 0) {
                        lcardsLog.debug(`[LCARdSButton] Re-firing ${onLoadAnims.length} on_load animation(s) on refreshed element for segment: ${segment.id}`);
                        onLoadAnims.forEach(animDef => {
                            animationManager.playAnimation(scopeKey, animationManager.resolveAnimationDefinition(animDef));
                        });
                    }

                    lcardsLog.trace(`[LCARdSButton] ✅ Updated element reference for segment: ${segment.id}`);
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

        lcardsLog.trace(`[LCARdSButton] Triggering segment animation`, {
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

    // ============================================================================
    // COMPONENT ANIMATION + TEXT SUPPORT
    // ============================================================================

    /**
     * Resolve the value to compare against for a single range entry.
     *
     * Resolution order:
     *   1. range.attribute   — per-entry override
     *   2. config.ranges_attribute — card-level default
     *   3. entity.state      — fallback (works for numeric sensor entities)
     *
     * Special virtual attribute:
     *   "brightness_pct" — computes Math.round(attributes.brightness / 2.55)
     *   so that 0-100 values can be used directly for light brightness ranges.
     *
     * @private
     * @param {Object} range - Single range entry from config.ranges
     * @returns {*} Resolved value (may be null if attribute is absent)
     */
    _getEntityValueForRanges(range) {
        if (!this._entity) return null;
        const attr = range.attribute ?? this.config.ranges_attribute ?? null;
        if (!attr || attr === 'state') {
            return this._entity.state;
        }
        if (attr === 'brightness_pct') {
            const brightness = this._entity.attributes?.brightness;
            return brightness !== undefined ? Math.round(brightness / 2.55) : null;
        }
        const val = this._entity.attributes?.[attr];
        return val !== undefined ? val : null;
    }

    /**
     * Evaluate numeric / equality ranges to determine which preset name applies.
     * Returns null when no range matches (i.e. the static `this.config.preset`
     * or 'default' should be used instead).
     *
     * YAML example:
     *   ranges_attribute: brightness_pct   # evaluate light brightness as 0-100
     *   ranges:
     *     - preset: condition_red
     *       above: 80
     *     - preset: condition_yellow
     *       above: 50
     *       below: 80
     *     - preset: condition_green
     *       equals: "ok"
     *
     * Each entry may also override the attribute with its own `attribute` key.
     * Ranges are evaluated in order; the FIRST match wins.
     *
     * @private
     * @param {Array<{preset:string, attribute?:string, above?:number, below?:number, equals?:*, color?:Object}>} rangesConfig
     * @returns {Object|null} The matched range entry (containing .preset and optionally .color), or null if none match
     */
    _evaluateRangePreset(rangesConfig) {
        if (!rangesConfig || !Array.isArray(rangesConfig) || !this._entity) {
            return null;
        }

        for (const range of rangesConfig) {
            if (!range.preset) continue;

            const rawVal = this._getEntityValueForRanges(range);
            const strVal = String(rawVal ?? '');
            const numVal = parseFloat(rawVal);

            // Equality check (string comparison)
            if (range.equals !== undefined) {
                if (strVal === String(range.equals)) {
                    return range;
                }
                continue;
            }

            // Numeric range check — skip if value is null/undefined or non-numeric
            if (rawVal !== null && rawVal !== undefined && !isNaN(numVal)) {
                const aboveOk = range.above === undefined || numVal >= parseFloat(range.above);
                const belowOk = range.below === undefined || numVal <  parseFloat(range.below);
                if (aboveOk && belowOk) {
                    return range;
                }
            }
        }

        return null;
    }

    /**
     * Register component-level animations with AnimationManager, using the SVG
     * *container* element (not an individual segment element) as the scope.
     * This lets target selectors like '[id^="bar-"]' resolve all matching
     * elements via querySelectorAll when an animation fires.
     *
     * Must be called AFTER the SVG is in the DOM (from updated() / requestAnimationFrame).
     *
     * @private
     */
    _setupComponentAnimations() {
        if (!this._componentAnimations || this._componentAnimations.length === 0) {
            return;
        }

        const animationManager = this._singletons?.animationManager;
        if (!animationManager) {
            lcardsLog.debug('[LCARdSButton] AnimationManager not available, skipping component animations');
            return;
        }

        const cardId = this._getAnimationCardId();

        requestAnimationFrame(() => {
            const svgContainer = this.shadowRoot?.querySelector('.button-bg-svg svg');
            if (!svgContainer) {
                lcardsLog.warn('[LCARdSButton] SVG container not found for component animations');
                return;
            }

            const compAnimKey = `${cardId}:segment:component-0`;
            const existingScope = animationManager.scopes?.get(compAnimKey);

            // Detect stale DOM: the SVG is re-rendered (e.g. when the card's
            // measured size changes from the initial default).  unsafeHTML
            // replaces the entire <svg> element so all <line> bar elements are
            // new DOM nodes.  The previous animation instances are running on the
            // now-detached old elements (invisible).  Reset onLoadFired so the
            // animations re-play on the fresh elements.
            if (existingScope && existingScope.element !== svgContainer) {
                lcardsLog.debug(`[LCARdSButton] SVG re-rendered — resetting component animation scopes for re-play`);
                this._componentAnimations.forEach((_, index) => {
                    const scopeKey = `${cardId}:segment:component-${index}`;
                    const scope = animationManager.scopes?.get(scopeKey);
                    if (scope) {
                        // Pause zombie instances running on detached elements
                        scope.runningInstances?.forEach(instances => {
                            instances.forEach(inst => {
                                try { if (inst?.pause) inst.pause(); } catch (_e) {}
                            });
                        });
                        scope.runningInstances?.clear();
                        // Point to new container so querySelectorAll finds new bars
                        scope.element = svgContainer;
                        // Allow on_load to fire again on the new elements
                        scope.onLoadFired = false;
                    }
                });
                this._componentAnimationsRegistered = false;
            }

            // Nothing changed — skip
            if (this._componentAnimationsRegistered && existingScope?.element === svgContainer) {
                return;
            }

            // Register each animation as a named component-N segment so
            // AnimationManager can manage triggers, scoping, and on_load firing.
            this._componentAnimations.forEach((anim, index) => {
                animationManager.registerSegmentAnimations(
                    cardId,
                    `component-${index}`,
                    [anim],
                    svgContainer
                );
            });

            this._componentAnimationsRegistered = true;

            lcardsLog.debug(`[LCARdSButton] Registered ${this._componentAnimations.length} component animation(s)`, {
                cardId,
                targets: this._componentAnimations.map(a => a.target ?? 'self')
            });
        });
    }

    /**
     * Apply text content to text-bearing segments (e.g. alert_text, sub_text).
     * The text property supports template tokens via processTemplate(), so entity
     * state changes automatically update the displayed label.
     *
     * Safe to call multiple times; silently no-ops if DOM is not ready.
     *
     * @private
     * @returns {Promise<void>}
     */
    async _applySegmentText() {
        if (!this._processedSegments || this._processedSegments.length === 0) {
            return;
        }

        const svgContainer = this.shadowRoot?.querySelector('.button-bg-svg svg');
        if (!svgContainer) {
            return;
        }

        for (const segment of this._processedSegments) {
            if (segment.text == null) continue;

            const elements = svgContainer.querySelectorAll(segment.selector);
            if (elements.length === 0) continue;

            // Evaluate template (handles [[[JS]]], {token}, Jinja2, plain strings)
            let resolvedText;
            try {
                resolvedText = await this.processTemplate(String(segment.text));
            } catch (err) {
                lcardsLog.warn(`[LCARdSButton] Failed to evaluate text template for segment "${segment.id}"`, err);
                resolvedText = String(segment.text);
            }

            elements.forEach(el => {
                el.textContent = resolvedText ?? '';
            });
        }
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

        // Get entity object for actual state lookup
        const entity = entityState && this.config.entity ?
            this.hass.states[this.config.entity] : null;
        const actualState = entity?.state;
        const classifiedState = this._mapEntityStateToStyleState(actualState || entityState);

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

            // Priority 2: Entity state using resolveStateColor pattern
            if (entityState) {
                // Try actual entity state first
                if (actualState && style[actualState]) {
                    return style[actualState];
                }

                // Try classified state (on → active, off → inactive, etc.)
                if (classifiedState && style[classifiedState]) {
                    return style[classifiedState];
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
                    // State-based value - use resolveStateColor for consistency

                    // Priority 1: Interaction state (hover, pressed)
                    if (interactionState && interactionState in value) {
                        resolvedStyle[property] = value[interactionState];
                        return;
                    }

                    // Priority 2: Entity state using resolveStateColor
                    if (entityState) {
                        const resolved = resolveStateColor({
                            actualState,
                            classifiedState,
                            colorConfig: value,
                            fallback: value.default || value.inactive
                        });
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

                this._playSound('card_hover');
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

                    this._playSound('card_hold');
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

            this._playSound('card_tap');
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

                lcardsLog.trace(`[LCARdSButton] Updated segment "${segmentId}" style`, {
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

        // ALWAYS use card GUID for overlay registration (consistent ID space)
        // User can still set config.id for custom identification if needed
        const overlayId = this.config.id || this._cardGuid;

        lcardsLog.debug(`[LCARdSButton] Registering overlay with ID: ${overlayId}`, {
            hasConfigId: !!this.config.id,
            configId: this.config.id,
            hasEntity: !!this.config.entity,
            entity: this.config.entity,
            cardGuid: this._cardGuid,
            finalOverlayId: overlayId,
            tags: tags
        });

        this._registerOverlayForRules(overlayId, 'button', tags);

        // Setup actions after DOM is ready
        this.updateComplete.then(() => {
            this._setupButtonActions();
            this._actionsInitialized = true;
        });

        // Setup auto-sizing to respond to container size changes
        this._setupAutoSizing();

        // Apply filters after SVG is rendered
        if (this.config.filters && this.config.filters.length > 0) {
            this.updateComplete.then(() => {
                this._applyFilters();
            });
        }

        // Process initial templates if needed
        if (this._needsInitialTemplateProcessing) {
            lcardsLog.debug(`[LCARdSButton] Processing initial templates after firstUpdated`);
            this._scheduleTemplateUpdate();
            this._needsInitialTemplateProcessing = false;
        }

        // Initialize background animation if configured
        if (this.config.background_animation) {
            this.updateComplete.then(() => {
                this._initializeBackgroundAnimation();
            });
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
     * Apply filters to button SVG
     * Filters are applied to the root SVG element
     * @private
     */
    _applyFilters() {
        if (!this.config.filters || this.config.filters.length === 0) {
            return;
        }

        // Find the SVG element in the shadow root
        const svgElement = this.shadowRoot?.querySelector('svg');
        if (!svgElement) {
            lcardsLog.warn('[LCARdSButton] Cannot apply filters - SVG element not found');
            return;
        }

        lcardsLog.debug('[LCARdSButton] Applying filters to button SVG:', this.config.filters);

        // Apply filters using BaseSvgFilters utility
        applyBaseSvgFilters(svgElement, this.config.filters);
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

        // Re-process SVG configuration (in case config was replaced by CoreConfigManager).
        // For component cards this also re-injects component/preset text field defaults into
        // this.config.text so that subsequent template processing picks them up.
        this._processSvgConfig();

        // Re-resolve button style with the new merged config
        this._resolveButtonStyleSync();

        // Re-schedule template processing so component text field defaults (injected above)
        // are processed through processTemplate() and stored in _processedTemplates.
        if (this._initialized) {
            this._scheduleTemplateUpdate();
        }

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
                lcardsLog.trace(`[LCARdSButton] 🔄 Re-attaching actions after render (element changed)`);
                this._setupButtonActions();
                this._lastActionElement = buttonElement;
            }
        }

        // Setup segment interactivity after render (Phase 2)
        if (this._processedSegments && this._processedSegments.length > 0) {
            this._setupSegmentInteractivity();

            // Setup segment animations after interactivity
            this._setupSegmentAnimations();

            // Setup component-level animations (e.g. stagger-grid on all bars)
            // These use the SVG container as scope so multi-element selectors work.
            this._setupComponentAnimations();
        }

        // Setup base button interactivity (hover/pressed states)
        if (this._buttonHoverStyle || this._buttonPressedStyle) {
            this._setupButtonInteractivity();
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

        lcardsLog.trace(`[LCARdSButton] _resolveButtonStyleSync starting`, {
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
                lcardsLog.trace(`[LCARdSButton] Preset lookup result`, {
                    presetName: this.config.preset,
                    presetFound: !!preset,
                    presetKeys: preset ? Object.keys(preset) : [],
                    hasBorder: preset?.border,
                    borderRadius: preset?.border?.radius
                });
                if (preset) {
                    // Deep copy preset to avoid mutation issues
                    style = deepMergeImmutable({}, preset);
                    lcardsLog.trace(`[LCARdSButton] Applied preset '${this.config.preset}'`, {
                        borderRadius: preset.border?.radius,
                        borderWidth: preset.border?.width,
                        styleKeys: Object.keys(style)
                    });
                }
            }
        } else {
            lcardsLog.trace(`[LCARdSButton] No preset specified, starting with empty style`);
        }

        // 2. DEEP merge config styles (config wins over preset)
        if (this.config.style) {
            lcardsLog.trace(`[LCARdSButton] Merging config.style`, {
                hasBorder: !!this.config.style.border,
                borderRadius: this.config.style.border?.radius,
                borderWidth: this.config.style.border?.width
            });
            // First create a deep copy to avoid mutating the original config
            const configStyleCopy = JSON.parse(JSON.stringify(this.config.style));
            // Then resolve ALL tokens recursively (theme: and computed)
            const configWithTokens = resolveThemeTokensRecursive(configStyleCopy, this._singletons?.themeManager);
            // Then deep merge (handles nested objects)
            style = deepMergeImmutable(style, configWithTokens);
            lcardsLog.trace(`[LCARdSButton] Config styles merged`);
        }

        // 3. Get current button state and actual entity state
        const buttonState = this._getButtonState();
        const actualEntityState = this._entity?.state;

        // 4. Apply state-based theme defaults (only if not explicitly set in config)
        // Use CB-LCARS nested schema: card.color.background.{state}
        // Try actual entity state first (e.g., "heat"), then fall back to classified state (e.g., "inactive")
        if (!this._hasNestedValue(style, 'card.color.background', actualEntityState) &&
            !this._hasNestedValue(style, 'card.color.background', buttonState)) {

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

        // 7. Extract hover and pressed background colors for interaction states
        this._extractInteractionStyles(resolvedStyle, buttonState, actualEntityState);

        // Only update if changed (avoid unnecessary re-renders)
        if (!this._buttonStyle || JSON.stringify(this._buttonStyle) !== JSON.stringify(resolvedStyle)) {
            this._buttonStyle = resolvedStyle;
            lcardsLog.debug(`[LCARdSButton] Button style resolved (state: ${buttonState}), triggering re-render`);
            this.requestUpdate(); // Trigger re-render to apply new styles
        }
    }

    /**
     * Extract hover and pressed interaction styles from resolved style
     * Stores background colors for dynamic application during mouse events
     * Priority: hover/pressed > entity state > default
     * @private
     * @param {Object} resolvedStyle - Resolved button style
     * @param {string} buttonState - Current classified button state (active/inactive/unavailable)
     * @param {string} actualEntityState - Actual entity state (on/off/heat/cool/etc.)
     * @returns {Object} { hover: { backgroundColor }, pressed: { backgroundColor } }
     */
    _extractInteractionStyles(resolvedStyle, buttonState, actualEntityState) {
        const themeManager = this._singletons?.themeManager;

        // Extract hover background color directly from nested path
        // Interaction states are not entity states, so we access them directly
        let hoverBgColor = resolvedStyle.card?.color?.background?.hover;
        let pressedBgColor = resolvedStyle.card?.color?.background?.pressed;

        // Resolve theme tokens if present
        if (hoverBgColor && typeof hoverBgColor === 'string' && hoverBgColor.startsWith('theme:')) {
            const tokenPath = hoverBgColor.substring(6);
            hoverBgColor = themeManager?.getToken(tokenPath) || hoverBgColor;
        }

        if (pressedBgColor && typeof pressedBgColor === 'string' && pressedBgColor.startsWith('theme:')) {
            const tokenPath = pressedBgColor.substring(6);
            pressedBgColor = themeManager?.getToken(tokenPath) || pressedBgColor;
        }

        // Store interaction styles if defined
        this._buttonHoverStyle = hoverBgColor ? { backgroundColor: hoverBgColor } : null;
        this._buttonPressedStyle = pressedBgColor ? { backgroundColor: pressedBgColor } : null;

        lcardsLog.trace('[LCARdSButton] Extracted interaction styles', {
            hasHover: !!this._buttonHoverStyle,
            hasPressed: !!this._buttonPressedStyle,
            hoverColor: hoverBgColor,
            pressedColor: pressedBgColor,
            backgroundObject: resolvedStyle.card?.color?.background
        });

        // Return values for compatibility with base class signature
        // (used by elbow and slider which extend button)
        return {
            hover: this._buttonHoverStyle,
            pressed: this._buttonPressedStyle
        };
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
        // Priority: config.icon_style > resolvedStyle.icon_style (from preset)
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
        // Priority: explicit x/y > explicit x_percent/y_percent > iconStyle.position > resolvedStyle.icon_style.position > 'center' (default)
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
        if (!explicitX && !explicitXPercent && iconPosition === 'center' && resolvedStyle.icon_style?.position) {
            iconPosition = resolvedStyle.icon_style.position;
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
        } else if (resolvedStyle.icon_style?.padding !== undefined) {
            if (typeof resolvedStyle.icon_style.padding === 'number') {
                iconPadding = resolvedStyle.icon_style.padding;
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
        else if (resolvedStyle.icon_style?.padding && typeof resolvedStyle.icon_style.padding === 'object') {
            iconPaddingLeft = resolvedStyle.icon_style.padding.left ?? 0;
            iconPaddingRight = resolvedStyle.icon_style.padding.right ?? 0;
            iconPaddingTop = resolvedStyle.icon_style.padding.top ?? 0;
            iconPaddingBottom = resolvedStyle.icon_style.padding.bottom ?? 0;
        }

        // Resolve icon rotation (same as text fields)
        // Priority: iconStyle > preset > 0 (default)
        let iconRotation = 0; // default
        if (iconStyle.rotation !== undefined) {
            iconRotation = iconStyle.rotation;
        } else if (resolvedStyle.icon_style?.rotation !== undefined) {
            iconRotation = resolvedStyle.icon_style.rotation;
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
            const iconTokens = this._theme?.tokens?.components?.button?.icon || {};

            // Resolve icon color with state-based fallback chain
            // Priority: iconStyle > preset > theme token (state-based) > text color (state-based) > hardcoded
            let iconColor;

            lcardsLog.trace('[LCARdSButton] Resolving icon color for state:', buttonState);

            const actualEntityState = this._entity?.state;

            // 1. Check explicit iconStyle color
            if (iconStyle.color) {
                iconColor = resolveStateColor({
                    actualState: actualEntityState,
                    classifiedState: buttonState,
                    colorConfig: iconStyle.color,
                    fallback: iconStyle.color.active  // Legacy fallback
                });
                lcardsLog.trace('[LCARdSButton] Icon color from config:', iconColor);
            }
            // 2. Check preset/resolvedStyle color
            else if (resolvedStyle.icon_style?.color) {
                iconColor = resolveStateColor({
                    actualState: actualEntityState,
                    classifiedState: buttonState,
                    colorConfig: resolvedStyle.icon_style.color,
                    fallback: resolvedStyle.icon_style.color.active  // Legacy fallback
                });
                lcardsLog.trace('[LCARdSButton] Icon color from preset:', iconColor);
            }
            // 3. Check theme token (can be state-based)
            else if (iconTokens.color) {
                iconColor = resolveStateColor({
                    actualState: actualEntityState,
                    classifiedState: buttonState,
                    colorConfig: iconTokens.color,
                    fallback: iconTokens.color.active  // Legacy fallback
                });
                lcardsLog.trace('[LCARdSButton] Icon color from theme token:', iconColor);
            }
            // 4. Fall back to text color (also state-based)
            else if (this._buttonStyle?.text?.default?.color) {
                iconColor = resolveStateColor({
                    actualState: actualEntityState,
                    classifiedState: buttonState,
                    colorConfig: this._buttonStyle.text.default.color
                });
                lcardsLog.trace('[LCARdSButton] Icon color from text color:', iconColor);
            }
            // 5. Final hardcoded fallback
            else {
                iconColor = 'var(--lcars-color-text, #FFFFFF)';
                lcardsLog.warn('[LCARdSButton] Icon color using hardcoded fallback');
            }

            // Ensure iconColor is a string (not an object)
            if (typeof iconColor !== 'string') {
                lcardsLog.warn('[LCARdSButton] ⚠️ Icon color resolved to non-string:', iconColor);
                iconColor = 'var(--lcars-color-text, #FFFFFF)';
            }

            // Resolve match-light token → CSS variable
            iconColor = this._resolveMatchLightColor(iconColor);

            // Resolve icon size
            // Priority: iconStyle > preset > theme token > hardcoded
            let iconSize;
            if (iconStyle.size) {
                iconSize = iconStyle.size;
            } else if (resolvedStyle.icon_style?.size && typeof resolvedStyle.icon_style.size === 'number') {
                iconSize = resolvedStyle.icon_style.size;
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
            } else if (resolvedStyle.icon_style?.spacing !== undefined) {
                iconSpacing = resolvedStyle.icon_style.spacing;
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
            } else if (resolvedStyle.icon_style?.layout_spacing !== undefined) {
                layoutSpacing = resolvedStyle.icon_style.layout_spacing;
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
            } else if (resolvedStyle.icon_style?.area_size && typeof resolvedStyle.icon_style.area_size === 'number') {
                // Preset nested icon_style.area_size
                iconAreaSize = resolvedStyle.icon_style.area_size;
            }
            // If not specified, will be auto-calculated in _generateIconMarkup based on size + spacing + divider

            // Resolve divider settings
            // Priority: config.divider > preset > theme token > hardcoded
            let dividerWidth, dividerColor;

            // Divider width
            if (this.config.divider?.width !== undefined) {
                dividerWidth = this.config.divider.width;
            } else if (resolvedStyle.icon_style?.divider?.width !== undefined) {
                dividerWidth = resolvedStyle.icon_style.divider.width;
            } else if (resolvedStyle.icon_style?.interior?.width !== undefined) {
                // Legacy preset support for "interior" name
                dividerWidth = resolvedStyle.icon_style.interior.width;
            } else if (iconTokens.interior?.width !== undefined) {
                dividerWidth = iconTokens.interior.width;
            } else {
                dividerWidth = 6; // hardcoded fallback
            }

            // Divider color
            if (this.config.divider?.color) {
                dividerColor = this.config.divider.color;
            } else if (resolvedStyle.icon_style?.divider?.color) {
                dividerColor = resolvedStyle.icon_style.divider.color;
            } else if (resolvedStyle.icon_style?.interior?.color) {
                // Legacy preset support for "interior" name
                dividerColor = resolvedStyle.icon_style.interior.color;
            } else if (iconTokens.interior?.color) {
                dividerColor = iconTokens.interior.color;
            } else {
                dividerColor = 'black'; // hardcoded fallback
            }

            // Resolve icon area background (colors the entire icon area section)
            // Priority: config.icon_area_background > preset.icon_area_background > null
            let iconAreaBackground = null;
            if (this.config.icon_area_background) {
                iconAreaBackground = resolveStateColor({
                    actualState: actualEntityState,
                    classifiedState: buttonState,
                    colorConfig: this.config.icon_area_background,
                    fallback: this.config.icon_area_background.active || null  // Legacy fallback
                });
            } else if (resolvedStyle.icon_area_background) {
                iconAreaBackground = resolveStateColor({
                    actualState: actualEntityState,
                    classifiedState: buttonState,
                    colorConfig: resolvedStyle.icon_area_background,
                    fallback: resolvedStyle.icon_area_background.active || null  // Legacy fallback
                });
            }
            if (iconAreaBackground) {
                iconAreaBackground = this._resolveMatchLightColor(iconAreaBackground);
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
        lcardsLog.trace(`[LCARdSButton] _processCustomTemplates called for ${this._cardGuid}`);

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

        lcardsLog.trace(`[LCARdSButton] Merging preset text fields`, {
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

    // NOTE: _getButtonState() is now inherited from LCARdSCard base class
    // Provides standardized state classification across all cards

    /**
     * Setup action handlers on the rendered button
     * @private
     */
    /**
     * Setup button interactivity for hover and pressed states
     * Attaches mouse event listeners to apply interaction styles dynamically
     * Called after button is rendered in DOM
    /**
     * Setup button interactivity for hover and pressed states
     * Uses base class method for consistent interaction handling across all cards
     * @private
     */
    _setupButtonInteractivity() {
        // Find the button background element (rect or path)
        const buttonBg = this.shadowRoot?.querySelector('.button-bg');

        // Clean up previous listeners
        if (this._buttonInteractivityCleanup) {
            this._buttonInteractivityCleanup();
        }

        // Use base class method to setup interactivity
        this._buttonInteractivityCleanup = this._setupBaseInteractivity(buttonBg, {
            hoverStyle: this._buttonHoverStyle,
            pressedStyle: this._buttonPressedStyle,
            getRestoreColor: () => this._getCurrentEntityStateColor()
        });
    }

    /**
     * Get current entity state background color (dynamically calculated)
     * Used when returning from hover/pressed states to restore the correct color
     * Uses base class method for consistent color resolution
     * @private
     * @returns {string} Current background color based on entity state
     */
    _getCurrentEntityStateColor() {
        return this._resolveEntityStateColor(
            this._buttonStyle?.card?.color?.background,
            'var(--lcars-orange, #FF9900)'
        );
    }

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
            type: 'button',
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

        lcardsLog.trace(`[LCARdSButton] Size resolution:`, {
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

            // Apply filters after render completes
            if (this.config.filters && this.config.filters.length > 0) {
                this.updateComplete.then(() => {
                    this._applyFilters();
                });
            }

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
     * Returns true if the card is in a mode that supports shape_texture.
     * Only standard preset mode is supported (no custom SVG, no components).
     * @returns {boolean}
     * @protected
     */
    _supportsShapeTexture() {
        return !this._processedSvg && !this.config?.component && !this.config?.svg;
    }

    /**
     * Returns a stable short ID for this card instance, used to scope SVG def IDs.
     * @returns {string}
     * @private
     */
    _getTextureInstanceId() {
        if (!this._textureInstanceId) {
            this._textureInstanceId = Math.random().toString(36).slice(2, 7);
        }
        return this._textureInstanceId;
    }

    /**
     * Resolve shape_texture config for current card state.
     * Resolves theme tokens on color, applies state-based opacity and speed.
     * @returns {{ presetDef, resolvedConfig, opacity, blendMode }|null} null if disabled
     * @private
     */
    _resolveShapeTextureConfig() {
        const texConfig = this.config?.shape_texture;
        if (!texConfig || !texConfig.preset) return null;
        if (!this._supportsShapeTexture()) return null;

        const presetDef = SHAPE_TEXTURE_PRESETS[texConfig.preset];
        if (!presetDef) {
            lcardsLog.warn(`[LCARdSButton] Unknown shape_texture preset: ${texConfig.preset}`);
            return null;
        }

        const buttonState = this._buttonStyle?._currentState || this._getButtonState();
        const actualEntityState = this._entity?.state;

        // Merge user config with preset defaults
        const rawConfig = { ...presetDef.defaults, ...(texConfig.config || {}) };

        // Resolve theme tokens in color fields using the existing pattern
        const themeManager = this._singletons?.themeManager;
        let resolvedConfig = rawConfig;
        if (themeManager) {
            resolvedConfig = resolveThemeTokensRecursive(rawConfig, themeManager);
        }

        // Resolve state-based color on the 'color' field
        if (resolvedConfig.color && typeof resolvedConfig.color === 'object') {
            resolvedConfig = {
                ...resolvedConfig,
                color: resolveStateColor({
                    actualState: actualEntityState,
                    classifiedState: buttonState,
                    colorConfig: resolvedConfig.color,
                    fallback: 'rgba(255,255,255,0.2)'
                }) || 'rgba(255,255,255,0.2)'
            };
        }

        // Resolve state-based opacity
        let opacity = texConfig.opacity ?? 0.3;
        if (typeof opacity === 'object') {
            opacity = resolveStateColor({
                actualState: actualEntityState,
                classifiedState: buttonState,
                colorConfig: opacity,
                fallback: 0.3
            }) ?? 0.3;
            opacity = parseFloat(opacity);
        }

        // Resolve state-based speed multiplier
        let speed = texConfig.speed ?? null;
        if (speed !== null && typeof speed === 'object') {
            speed = resolveStateColor({
                actualState: actualEntityState,
                classifiedState: buttonState,
                colorConfig: speed,
                fallback: 1.0
            }) ?? 1.0;
            speed = parseFloat(speed);
        }
        if (speed !== null) {
            if (resolvedConfig.scroll_speed_x !== undefined) resolvedConfig = { ...resolvedConfig, scroll_speed_x: resolvedConfig.scroll_speed_x * speed };
            if (resolvedConfig.scroll_speed_y !== undefined) resolvedConfig = { ...resolvedConfig, scroll_speed_y: resolvedConfig.scroll_speed_y * speed };
            if (resolvedConfig.speed !== undefined) resolvedConfig = { ...resolvedConfig, speed: resolvedConfig.speed * speed };
        }

        const blendMode = texConfig.mix_blend_mode || 'normal';

        return { presetDef, resolvedConfig, opacity, blendMode };
    }

    /**
     * Generate the SVG shape texture layer markup string.
     * Returns empty string if texture is not configured or not supported.
     * @param {number} width
     * @param {number} height
     * @param {Object} border - Resolved border config
     * @param {string|null} shapePath - SVG path d= string for complex shapes, null for rect
     * @returns {string} SVG markup string
     * @private
     */
    _generateTextureMarkup(width, height, border, shapePath = null) {
        const resolved = this._resolveShapeTextureConfig();
        if (!resolved) return '';

        const { presetDef, resolvedConfig, opacity, blendMode } = resolved;
        const id = this._getTextureInstanceId();

        const renderer = new ShapeTextureRenderer(presetDef, resolvedConfig, id);
        return renderer.render(shapePath, width, height, border, blendMode, opacity);
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
        // Use CB-LCARS nested schema
        const buttonState = this._buttonStyle?._currentState || this._getButtonState();
        const actualEntityState = this._entity?.state;

        // Background color: card.color.background.{state}
        // Try actual entity state first (e.g., "heat"), then fall back to classified state (e.g., "inactive")
        const backgroundColor = this._resolveMatchLightColor(resolveStateColor({
            actualState: actualEntityState,
            classifiedState: buttonState,
            colorConfig: this._buttonStyle?.card?.color?.background,
            fallback: 'var(--lcars-orange, #FF9900)'
        }));

        // Text color: text.default.color.{state}
        const textColor = this._resolveMatchLightColor(resolveStateColor({
            actualState: actualEntityState,
            classifiedState: buttonState,
            colorConfig: this._buttonStyle?.text?.default?.color,
            fallback: 'var(--lcars-color-text, #FFFFFF)'
        }));

        // Border color: border.color.{state} or border.color (plain string)
        const borderColor = this._resolveMatchLightColor(resolveStateColor({
            actualState: actualEntityState,
            classifiedState: buttonState,
            colorConfig: this._buttonStyle?.border?.color,
            fallback: 'var(--lcars-color-secondary, #000000)'
        }));

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
        lcardsLog.trace(`[LCARdSButton] Rendering button background`, {
            hasProcessedSvg: !!this._processedSvg,
            hasContent: !!this._processedSvg?.content,
            contentLength: this._processedSvg?.content?.length
        });

        let backgroundMarkup;
        if (this._processedSvg && this._processedSvg.content) {
            // Use full SVG content as background (Phase 1)
            lcardsLog.trace(`[LCARdSButton] Using SVG background`);
            backgroundMarkup = this._renderSvgBackground(this._processedSvg, width, height);
        } else if (normalizedPath) {
            backgroundMarkup = this._renderCustomPathBackground(normalizedPath, backgroundColor);
        } else if (needsComplexPath) {
            backgroundMarkup = this._renderComplexButtonPath(width, height, border, backgroundColor);
        } else {
            lcardsLog.trace(`[LCARdSButton] Using simple rect background`);
            backgroundMarkup = this._renderButtonRect(width, height, border, backgroundColor);
        }

        // Generate separate border paths for clean corner joins
        // Note: Borders are rendered on top of SVG backgrounds when svg config is used
        const borderMarkup = this._processedSvg ? '' : this._renderIndividualBorderPaths(width, height, border);

        // Generate shape texture layer (SVG-native, injected between bg and border)
        const textureMarkup = this._supportsShapeTexture()
            ? this._generateTextureMarkup(width, height, border, normalizedPath)
            : '';

        // ViewBox no longer needs expansion for stroke overhang
        // Borders are now inset by strokeWidth/2, keeping them fully within natural dimensions
        // This replicates CSS border behavior where borders are drawn "inside" the box
        const viewBoxX = 0;
        const viewBoxY = 0;
        const viewBoxWidth = width;
        const viewBoxHeight = height;

        // Check if we're in icon-only mode (hide text when icon is shown)
        const iconOnly = this._processedIcon?.iconOnly && this._processedIcon?.show;

        // Generate text markup using multi-text system.
        //
        // For components with a text_area, text is embedded inside the component's
        // nested <svg> (viewBox coordinate space) so it scales 1:1 with the shape
        // at any button size.  font_size is therefore in viewBox units.
        // A <clipPath> using the text_area rect prevents overflow at small sizes.
        //
        // For all other modes, text lives in the outer button SVG (pixel space).
        let textMarkup = '';
        if (!iconOnly) {
            const textFields = this._resolveTextConfiguration();

            if (this._processedSvg?.componentTextAreas) {
                // Component mode: build text in viewBox space and inject into
                // the nested <svg> via _renderSvgBackground (cheap string op).
                // backgroundMarkup is re-generated here so the <clipPath> ids are
                // scoped inside the same <svg> element as the shape content.
                const componentTextSvg = this._buildComponentTextMarkup(
                    textFields, this._processedSvg.componentTextAreas
                );
                if (componentTextSvg) {
                    backgroundMarkup = this._renderSvgBackground(
                        this._processedSvg, width, height, componentTextSvg
                    );
                }
                // textMarkup stays '' — text already embedded in backgroundMarkup
            } else {
                // Standard mode: text in outer button SVG (pixel space)
                const processedFields = this._processTextFields(textFields, width, height, this._processedIcon);
                textMarkup = this._generateTextElements(processedFields);
            }
        }

        const svgString = `
            <svg width="${width}" height="${height}" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">
                <g data-button-id="button"
                   data-overlay-id="button"
                   class="button-group"
                   style="pointer-events: visiblePainted; cursor: pointer;">
                    ${backgroundMarkup}
                    ${textureMarkup}
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
        // Helper to parse radius values (handles numbers, CSS vars, theme tokens, and pixel strings)
        const parseRadius = (value, fallback) => {
            if (value === undefined || value === null) return fallback;

            // If it's already a number, use it
            if (typeof value === 'number') return value;

            const stringValue = String(value);

            // Resolve theme tokens (e.g., "theme:components.button.border.radius")
            let resolved = stringValue;
            if (stringValue.startsWith('theme:')) {
                const tokenPath = stringValue.replace('theme:', '');
                resolved = this.getThemeToken(tokenPath, stringValue, 'border.radius');
                lcardsLog.trace(`[LCARdSButton] Resolved theme token "${stringValue}" -> "${resolved}"`);
            }

            // Then resolve CSS variables (e.g., "var(--ha-card-border-radius, 34px)")
            resolved = ColorUtils.resolveCssVariable(resolved);

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
                const tokenPath = stringValue.replace('theme:', '');
                resolved = this.getThemeToken(tokenPath, stringValue, 'border.width');
            }

            // Then resolve CSS variables
            resolved = ColorUtils.resolveCssVariable(resolved);

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
        const actualEntityState = this._entity?.state;
        const globalColor = this._resolveMatchLightColor(resolveStateColor({
            actualState: actualEntityState,
            classifiedState: state,
            colorConfig: this._buttonStyle?.border?.color,
            fallback: 'var(--lcars-color-secondary, #000000)'
        }));

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

        // DEBUG: Log what we're working with
        lcardsLog.debug('[Button._resolveTextConfiguration] textConfig:', textConfig);
        lcardsLog.debug('[Button._resolveTextConfiguration] userDefaults:', userDefaults);

        // Get preset text fields from resolved button style
        const presetTextFields = this._buttonStyle?.text || {};

        // Get preset defaults from text.default (preset)
        const presetTextDefaults = this._buttonStyle?.text?.default || {};

        // Last-resort positions for well-known fields when nothing else specifies one.
        // NOTE: Only specify position here. Anchor/baseline should come from named position calculation!
        const presetDefaults = {
            label: { position: 'center' },
            name:  { position: 'top-left' },
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

            // DEBUG: Log font_size sources for this field
            lcardsLog.trace(`[Button._resolveTextConfiguration] Field '${fieldId}' font_size sources:`, {
                fieldConfig_font_size: fieldConfig.font_size,
                fieldConfig_size: fieldConfig.size,
                userDefaults_font_size: userDefaults.font_size,
                presetFieldConfig_font_size: presetFieldConfig.font_size,
                presetFieldConfig_size: presetFieldConfig.size,
                presetTextDefaults_font_size: this._buttonStyle?.text?.default?.font_size
            });

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
                // Priority: field config → preset field → user text.default → preset text.default → hardcoded named fallback
                position: fieldConfig.position || presetFieldConfig.position || userDefaults.position || presetTextDefaults.position || presetDefault.position || null,
                x: fieldConfig.x !== undefined ? fieldConfig.x : (presetFieldConfig.x !== undefined ? presetFieldConfig.x : null),
                y: fieldConfig.y !== undefined ? fieldConfig.y : (presetFieldConfig.y !== undefined ? presetFieldConfig.y : null),
                x_percent: fieldConfig.x_percent !== undefined ? fieldConfig.x_percent : (presetFieldConfig.x_percent !== undefined ? presetFieldConfig.x_percent : null),
                y_percent: fieldConfig.y_percent !== undefined ? fieldConfig.y_percent : (presetFieldConfig.y_percent !== undefined ? presetFieldConfig.y_percent : null),
                padding: fieldConfig.padding !== undefined ? fieldConfig.padding :
                        (userDefaults.padding !== undefined ? userDefaults.padding :
                        (presetFieldConfig.padding !== undefined ? presetFieldConfig.padding :
                        (presetTextDefaults.padding !== undefined ? presetTextDefaults.padding : 8))),
                font_size: fieldConfig.font_size || fieldConfig.size || userDefaults.font_size || presetFieldConfig.font_size || presetFieldConfig.size || this._buttonStyle?.text?.default?.font_size || 14,
                color: fieldConfig.color || userDefaults.color || presetFieldConfig.color || presetTextDefaults.color || null, // null means use default
                font_weight: fieldConfig.font_weight || userDefaults.font_weight || presetFieldConfig.font_weight || this._buttonStyle?.text?.default?.font_weight || 'normal',
                font_family: fieldConfig.font_family || userDefaults.font_family || presetFieldConfig.font_family || this._buttonStyle?.text?.default?.font_family || "'LCARS', 'Antonio', sans-serif",
                text_transform: fieldConfig.text_transform || userDefaults.text_transform || presetFieldConfig.text_transform || this._buttonStyle?.text?.default?.text_transform || 'none',
                anchor: fieldConfig.anchor || presetFieldConfig.anchor || presetDefault.anchor || null,
                baseline: fieldConfig.baseline || presetFieldConfig.baseline || presetDefault.baseline || null,
                rotation: fieldConfig.rotation !== undefined ? fieldConfig.rotation : (presetFieldConfig.rotation !== undefined ? presetFieldConfig.rotation : 0),
                show: fieldConfig.show !== undefined ? fieldConfig.show : (presetFieldConfig.show !== undefined ? presetFieldConfig.show : true),
                template: fieldConfig.template !== undefined ? fieldConfig.template : (presetFieldConfig.template !== undefined ? presetFieldConfig.template : true),

                // Component text-area routing and relative font sizing
                // text_area: which named area in componentDef.text_areas this field lives in
                // font_size_percent: font size as % of the text_area height (alternative to
                //   absolute viewBox-unit font_size; independent of viewBox coordinate scale)
                text_area: fieldConfig.text_area || presetFieldConfig.text_area || null,
                font_size_percent: fieldConfig.font_size_percent !== undefined ? fieldConfig.font_size_percent
                    : (presetFieldConfig.font_size_percent !== undefined ? presetFieldConfig.font_size_percent : null),

                // stretch: true → fill 100% of available width; number (0–1) → fill that fraction.
                // In component mode uses the text_area width; in standard mode uses container width.
                // Renders via SVG textLength + lengthAdjust="spacingAndGlyphs".
                stretch: fieldConfig.stretch !== undefined ? fieldConfig.stretch
                    : (userDefaults.stretch !== undefined ? userDefaults.stretch
                    : (presetFieldConfig.stretch !== undefined ? presetFieldConfig.stretch
                    : (presetTextDefaults.stretch !== undefined ? presetTextDefaults.stretch : null))),

                // Text background properties for "bar label" effect
                // Priority: field-specific config > text.default (config) > preset field config > text.default (preset) > null
                background: fieldConfig.background !== undefined ? fieldConfig.background :
                           (userDefaults.background !== undefined ? userDefaults.background :
                           (presetFieldConfig.background !== undefined ? presetFieldConfig.background :
                           (presetTextDefaults.background !== undefined ? presetTextDefaults.background : null))),
                background_padding: fieldConfig.background_padding !== undefined ? fieldConfig.background_padding :
                                   (userDefaults.background_padding !== undefined ? userDefaults.background_padding :
                                   (presetFieldConfig.background_padding !== undefined ? presetFieldConfig.background_padding :
                                   (presetTextDefaults.background_padding !== undefined ? presetTextDefaults.background_padding : 8))),
                background_radius: fieldConfig.background_radius !== undefined ? fieldConfig.background_radius :
                                  (userDefaults.background_radius !== undefined ? userDefaults.background_radius :
                                  (presetFieldConfig.background_radius !== undefined ? presetFieldConfig.background_radius :
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

            // Resolve color based on state (check actual entity state first, then classified state)
            const actualEntityState = this._entity?.state;
            let resolvedColor;

            if (field.color) {
                resolvedColor = resolveStateColor({
                    actualState: actualEntityState,
                    classifiedState: entityState,
                    colorConfig: field.color,
                    fallback: null
                });
            }

            // Use default text color if no field color specified
            if (!resolvedColor) {
                resolvedColor = resolveStateColor({
                    actualState: actualEntityState,
                    classifiedState: entityState,
                    colorConfig: this._buttonStyle?.text?.default?.color,
                    fallback: 'white'
                });
            }

            resolvedColor = this._resolveMatchLightColor(resolvedColor);

            processedFields.push({
                id: fieldId,
                content: content,
                x: x,
                y: y,
                font_size: field.font_size,
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
                const fontString = `${fontWeight} ${field.font_size}px ${fontFamily}`;

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
                    `fill="${escapeXmlAttribute(field.background)}"`,
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
                `font-size="${field.font_size}"`,
                `fill="${escapeXmlAttribute(field.color)}"`,
                `text-anchor="${field.anchor}"`,
                `dominant-baseline="${field.baseline}"`,
                `pointer-events="none"`  // Allow clicks to pass through to segments below
            ];

            if (field.font_weight) {
                textAttrs.push(`font-weight="${field.font_weight}"`);
            }

            if (field.font_family) {
                textAttrs.push(`font-family="${escapeXmlAttribute(field.font_family)}"`);
            }

            // Add rotation transform if specified (rotates around text origin point)
            if (field.rotation && field.rotation !== 0) {
                textAttrs.push(`transform="rotate(${field.rotation} ${field.x} ${field.y})"`);
            }

            // stretch: expand/compress glyphs to fill a fraction of the button width.
            // true → 100 %, number → that fraction (0–1).
            if (field.stretch != null && field.stretch !== false) {
                const factor = field.stretch === true ? 1.0 : Number(field.stretch);
                const containerWidth = this._containerSize?.width || 200;
                if (factor > 0) {
                    textAttrs.push(`textLength="${(containerWidth * factor).toFixed(3)}"`);
                    textAttrs.push('lengthAdjust="spacingAndGlyphs"');
                }
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
     * Build SVG text markup for a component in viewBox coordinate space.
     *
     * Text is injected *inside* the component's nested <svg> element so it
     * shares the viewBox coordinate system — font_size is in viewBox units and
     * everything scales 1:1 with the shape at any button size.
     *
     * Components declare one or more named text areas via `text_areas` in their
     * definition.  Each text field references its area via a `text_area` key;
     * if omitted, the first area in the map is used as the default.
     *
     * font_size is in viewBox units.  font_size_percent (% of the area's height)
     * is an alternative that is independent of the viewBox coordinate scale and
     * lets you express "fill N % of this container" naturally.
     *
     * One SVG <clipPath> per referenced text_area prevents overflow beyond the
     * shape interior at any button size.
     *
     * @private
     * @param {Object} textFields  Output of _resolveTextConfiguration()
     * @param {Object.<string,{x,y,width,height}>} componentTextAreas
     *   Named text-area rectangles in viewBox coordinate space.
     * @returns {string} SVG fragment (<clipPath>s + <text> elements) to inject
     *   inside the component's nested <svg>.
     */
    _buildComponentTextMarkup(textFields, componentTextAreas) {
        if (!textFields || !componentTextAreas) return '';

        const areaKeys = Object.keys(componentTextAreas);
        if (areaKeys.length === 0) return '';
        const defaultAreaKey = areaKeys[0];

        // Determine which areas are actually referenced (to generate clipPaths)
        const usedAreaIds = new Set();
        for (const [, field] of Object.entries(textFields)) {
            if (!field.show || !(field.content || '')) continue;
            const areaId = (field.text_area && componentTextAreas[field.text_area])
                ? field.text_area : defaultAreaKey;
            if (componentTextAreas[areaId]) usedAreaIds.add(areaId);
        }

        if (usedAreaIds.size === 0) return '';

        // One <clipPath> per referenced text_area, id scoped to this card instance
        const clipPaths = [];
        for (const areaId of usedAreaIds) {
            const ta = componentTextAreas[areaId];
            if (!ta) continue;
            const clipId = `comp-clip-${this._cardGuid}-${areaId}`;
            clipPaths.push(
                `<clipPath id="${clipId}">` +
                `<rect x="${ta.x}" y="${ta.y}" width="${ta.width}" height="${ta.height}"/>` +
                `</clipPath>`
            );
        }

        // Color resolution context
        const entityState       = this._getButtonState();
        const actualEntityState = this._entity?.state;

        const textElements = [];

        for (const [fieldId, field] of Object.entries(textFields)) {
            if (!field.show) continue;

            let content = field.content || '';
            if (!content) continue;

            // Text transform
            if (field.text_transform) {
                switch (field.text_transform) {
                    case 'uppercase':  content = content.toUpperCase();                                break;
                    case 'lowercase':  content = content.toLowerCase();                                break;
                    case 'capitalize': content = content.replace(/\b\w/g, c => c.toUpperCase()); break;
                }
            }

            // Resolve which text_area this field belongs to
            const areaId = (field.text_area && componentTextAreas[field.text_area])
                ? field.text_area : defaultAreaKey;
            const ta = componentTextAreas[areaId];
            if (!ta) continue;

            const clipId   = `comp-clip-${this._cardGuid}-${areaId}`;
            const taBounds = { left: ta.x, top: ta.y, width: ta.width, height: ta.height };

            // Font size: font_size_percent (% of area height) takes priority over
            // absolute viewBox-unit font_size so users can say "fill 55 % of this area"
            // without needing to know the viewBox scale.
            const fontSize = (field.font_size_percent != null)
                ? (ta.height * field.font_size_percent / 100)
                : field.font_size;

            // ── Position in viewBox coordinate space ──────────────────────────
            let x, y, anchor, baseline;

            if (field.position) {
                // 9-point named position within the text_area (viewBox coords)
                const pos = this._calculateNamedPosition(field.position, taBounds, field.padding);
                x        = pos.x;  y        = pos.y;
                anchor   = field.anchor   || pos.anchor;
                baseline = field.baseline || pos.baseline;
            } else if (field.x_percent != null && field.y_percent != null) {
                // Percentage within the text_area (viewBox units)
                x        = ta.x + ta.width  * field.x_percent / 100;
                y        = ta.y + ta.height * field.y_percent / 100;
                anchor   = field.anchor   || 'middle';
                baseline = field.baseline || 'middle';
            } else if (field.x != null && field.y != null) {
                // Explicit viewBox-unit coordinates
                x        = field.x;  y        = field.y;
                anchor   = field.anchor   || 'middle';
                baseline = field.baseline || 'middle';
            } else {
                // Default: centre of the text_area
                x        = ta.x + ta.width  / 2;
                y        = ta.y + ta.height / 2;
                anchor   = 'middle';
                baseline = 'middle';
            }

// ── Stretch pre-computation (must run before textAttrs so x/anchor are correct) ────
            // stretch: true → 100 % of available width; number (0-1) → that fraction.
            // Padding is respected as left/right inset — textLength shrinks and x shifts right.
            // For vertically-centred positions (baseline 'middle'), padding is NOT applied by
            // _calculateNamedPosition, so we apply padTop/padBottom as a y nudge here.
            let stretchTextLength = null;
            if (field.stretch != null && field.stretch !== false) {
                const factor = field.stretch === true ? 1.0 : Number(field.stretch);
                if (factor > 0) {
                    const pad = field.padding;
                    const padLeft   = (pad != null && typeof pad === 'object') ? (pad.left   ?? 0) : (Number(pad) || 0);
                    const padRight  = (pad != null && typeof pad === 'object') ? (pad.right  ?? 0) : (Number(pad) || 0);
                    const availWidth = ta.width - padLeft - padRight;
                    x = ta.x + padLeft;   // start at left inset edge
                    anchor = 'start';     // textLength extends rightward from x
                    stretchTextLength = (availWidth * factor).toFixed(3);

                    // Vertically-centred positions ('center', 'left-center', 'right-center',
                    // and the no-position default) all produce baseline='middle' and don't
                    // factor top/bottom padding into y.  Apply the imbalance here so callers
                    // can nudge text down (padTop > padBottom) or up (padBottom > padTop).
                    // Symmetric padding (e.g. padding:4) produces a net shift of zero.
                    if (baseline === 'middle') {
                        const padTop    = (pad != null && typeof pad === 'object') ? (pad.top    ?? 0) : (Number(pad) || 0);
                        const padBottom = (pad != null && typeof pad === 'object') ? (pad.bottom ?? 0) : (Number(pad) || 0);
                        y += padTop - padBottom;
                    }
                }
            }

            // ── Color resolution ──────────────────────────────────────────────
            let resolvedColor;
            if (field.color) {
                resolvedColor = resolveStateColor({
                    actualState:     actualEntityState,
                    classifiedState: entityState,
                    colorConfig:     field.color,
                    fallback:        null
                });
                // Resolve theme: tokens that resolveStateColor passes through as-is
                if (typeof resolvedColor === 'string' && resolvedColor.startsWith('theme:')) {
                    resolvedColor = this.getThemeToken(resolvedColor.replace('theme:', ''), resolvedColor);
                }
            }
            if (!resolvedColor) {
                resolvedColor = resolveStateColor({
                    actualState:     actualEntityState,
                    classifiedState: entityState,
                    colorConfig:     this._buttonStyle?.text?.default?.color,
                    fallback:        'white'
                });
            }
            resolvedColor = this._resolveMatchLightColor(resolvedColor);

            // ── Build <text> element ──────────────────────────────────────────
            const textAttrs = [
                `x="${x}"`,
                `y="${y}"`,
                `font-size="${fontSize}"`,
                `fill="${escapeXmlAttribute(resolvedColor)}"`,
                `text-anchor="${anchor}"`,
                `dominant-baseline="${baseline}"`,
                `clip-path="url(#${clipId})"`,
                `pointer-events="none"`,
                `data-field-id="${fieldId}"`
            ];

            if (field.font_weight) textAttrs.push(`font-weight="${field.font_weight}"`);
            if (field.font_family) textAttrs.push(`font-family="${escapeXmlAttribute(field.font_family)}"`);
            if (field.rotation && field.rotation !== 0) {
                textAttrs.push(`transform="rotate(${field.rotation} ${x} ${y})"`);
            }
            if (stretchTextLength !== null) {
                textAttrs.push(`textLength="${stretchTextLength}"`);
                textAttrs.push('lengthAdjust="spacingAndGlyphs"');
            }

            textElements.push(`<text ${textAttrs.join(' ')}>${escapeHtml(content)}</text>`);
        }

        if (textElements.length === 0) return '';

        return [...clipPaths, ...textElements].join('\n            ');
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
                <path class="button-border button-border-top"
                      id="border-top"
                      d="M ${startX} ${inset} L ${endX} ${inset}"
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
                    <path class="button-border button-border-right"
                          id="border-right"
                          d="M ${w - inset} ${startY} L ${w - inset} ${endY}"
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
                <path class="button-border button-border-bottom"
                      id="border-bottom"
                      d="M ${startX} ${h - inset} L ${endX} ${h - inset}"
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
                    <path class="button-border button-border-left"
                          id="border-left"
                          d="M ${inset} ${startY} L ${inset} ${endY}"
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
                <path class="button-border button-corner button-corner-top-left"
                      id="corner-top-left"
                      d="M ${inset} ${arcRadius + inset} A ${arcRadius} ${arcRadius} 0 0 1 ${arcRadius + inset} ${inset}"
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
                <path class="button-border button-corner button-corner-top-right"
                      id="corner-top-right"
                      d="M ${w - arcRadius - inset} ${inset} A ${arcRadius} ${arcRadius} 0 0 1 ${w - inset} ${arcRadius + inset}"
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
                <path class="button-border button-corner button-corner-bottom-right"
                      id="corner-bottom-right"
                      d="M ${w - inset} ${h - arcRadius - inset} A ${arcRadius} ${arcRadius} 0 0 1 ${w - arcRadius - inset} ${h - inset}"
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
                <path class="button-border button-corner button-corner-bottom-left"
                      id="corner-bottom-left"
                      d="M ${arcRadius + inset} ${h - inset} A ${arcRadius} ${arcRadius} 0 0 1 ${inset} ${h - arcRadius - inset}"
                      stroke="${cornerColor}"
                      stroke-width="${cornerWidth}"
                      stroke-linecap="square"
                      fill="none" />`;
        }

        return arcMarkup;
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
     * Resolve background animation inset from raw config value.
     * Base implementation: `'auto'` resolves to zero inset (no bars on button cards).
     * Overridden by lcards-elbow to compute from bar geometry.
     *
     * @param {Object|string|null} rawInset - Raw inset value from config (`{ top, right, bottom, left }`, `'auto'`, or null)
     * @returns {{ top: number, right: number, bottom: number, left: number }}
     * @protected
     */
    _resolveBackgroundAnimationInset(rawInset) {
        if (!rawInset || rawInset === 'auto') {
            return { top: 0, right: 0, bottom: 0, left: 0 };
        }
        return {
            top:    rawInset.top    ?? 0,
            right:  rawInset.right  ?? 0,
            bottom: rawInset.bottom ?? 0,
            left:   rawInset.left   ?? 0
        };
    }

    /**
     * Initialize background animation renderer
     * @private
     */
    _initializeBackgroundAnimation() {
        // Get the button container element
        const container = this.shadowRoot?.querySelector('.button-container');
        if (!container) {
            lcardsLog.warn('[LCARdSButton] Cannot initialize background - container not found');
            return;
        }

        // Log container state
        lcardsLog.debug('[LCARdSButton] Container dimensions:', {
            clientWidth: container.clientWidth,
            clientHeight: container.clientHeight,
            offsetWidth: container.offsetWidth,
            offsetHeight: container.offsetHeight
        });

        // Create a wrapper div for the background layer
        const backgroundLayer = document.createElement('div');
        backgroundLayer.style.position = 'absolute';
        backgroundLayer.style.top = '0';
        backgroundLayer.style.left = '0';
        backgroundLayer.style.width = '100%';
        backgroundLayer.style.height = '100%';
        backgroundLayer.style.zIndex = '-1';
        backgroundLayer.style.pointerEvents = 'none'; // Don't block button interactions

        // Insert at the beginning of container
        container.insertBefore(backgroundLayer, container.firstChild);

        // Log background layer dimensions after insertion
        lcardsLog.debug('[LCARdSButton] Background layer dimensions:', {
            clientWidth: backgroundLayer.clientWidth,
            clientHeight: backgroundLayer.clientHeight,
            offsetWidth: backgroundLayer.offsetWidth,
            offsetHeight: backgroundLayer.offsetHeight
        });

        // Resolve canvas inset from config.
        // Explicit inset objects are applied by _resolveConfig() inside init() — only
        // 'auto' insets need a post-init updateInset() call because their real value
        // depends on card geometry that is only available after construction.
        const bgConfig = this.config.background_animation;
        const rawInset = (bgConfig && !Array.isArray(bgConfig)) ? bgConfig.inset ?? null : null;

        // Initialize renderer
        this._backgroundRenderer = new BackgroundAnimationRenderer(
            backgroundLayer,
            bgConfig,
            this // Pass card instance for theme token resolution
        );

        const success = this._backgroundRenderer.init();
        if (success) {
            // For 'auto' insets, resolve the actual geometry-based inset and apply it now.
            // Explicit insets (objects or null) are already handled by _resolveConfig inside init().
            if (rawInset === 'auto') {
                this._backgroundRenderer.updateInset(this._resolveBackgroundAnimationInset(rawInset));
            }
            lcardsLog.info('[LCARdSButton] Background animation initialized');
        } else {
            lcardsLog.error('[LCARdSButton] Background animation initialization failed');
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

        // Clean up button interactivity listeners
        if (this._buttonInteractivityCleanup) {
            this._buttonInteractivityCleanup();
            this._buttonInteractivityCleanup = null;
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

        // Clean up background animation
        if (this._backgroundRenderer) {
            this._backgroundRenderer.destroy();
            this._backgroundRenderer = null;
        }

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
    getGridOptions() {
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
                label: {
                    content: 'LCARdS Button',
                    show: true,
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

        // Register JSON schema for validation
        configManager.registerCardSchema('button', buttonSchema, { version: '1.14.18' });

        lcardsLog.debug('[LCARdSButton] Registered with CoreConfigManager');
    }
}

// NOTE: Card registration (customElements.define and window.customCards) handled in src/lcards.js
// This ensures all core singletons are initialized before cards can be instantiated