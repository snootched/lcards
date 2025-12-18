/**
 * LCARdS Card Foundation
 *
 * Minimal base class for single-purpose cards that leverage
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
import { LCARdSActionHandler } from './LCARdSActionHandler.js';
import { UnifiedTemplateEvaluator } from '../core/templates/UnifiedTemplateEvaluator.js';
import { TemplateParser } from '../core/templates/TemplateParser.js';
import { deepMerge } from '../core/config-manager/merge-helpers.js';
import { ColorUtils } from '../core/themes/ColorUtils.js';

/**
 * Base class for simple LCARdS cards
 *
 * Extends LCARdSNativeCard to inherit all HA integration,
 * adds singleton access and helper methods.
 *
 * ## Lifecycle Hooks (Override in Subclass)
 *
 * ### _handleHassUpdate(newHass, oldHass)
 * Called when HASS object updates. Use for:
 * - Updating entity references
 * - Recomputing derived state
 * - Triggering style resolution
 *
 * ### _handleFirstUpdate(changedProps)
 * Called once on first render. Use for:
 * - Registering overlays with RulesEngine
 * - Setting up subscriptions
 * - Initial style resolution
 *
 * ### _renderCard()
 * Called on every render. Return card content HTML.
 *
 * ### _onRulePatchesChanged(patches)
 * Called when rule patches change. Use for:
 * - Re-resolving styles with new patches
 * - Triggering re-render
 * - Updating derived state
 *
 * **CRITICAL:** Always call `this.requestUpdate()` after applying patches,
 * or call a method that does (like `_resolveButtonStyle()`).
 *
 * @example
 * // Minimal implementation with RulesEngine:
 * export class MyCard extends LCARdSCard {
 *     constructor() {
 *         super();
 *         this._cardStyle = {};
 *     }
 *
 *     _handleFirstUpdate() {
 *         super._handleFirstUpdate();
 *         this._registerOverlayForRules({
 *             id: `my-card-${this._cardGuid}`,
 *             type: 'button'
 *         });
 *         this._resolveStyle();
 *     }
 *
 *     _onRulePatchesChanged(patches) {
 *         this._resolveStyle(); // Re-resolve with new patches
 *     }
 *
 *     _resolveStyle() {
 *         let style = { ...this.config.style };
 *         style = this._getMergedStyleWithRules(style); // Apply patches
 *         this._cardStyle = style;
 *         this.requestUpdate(); // CRITICAL!
 *     }
 *
 *     _renderCard() {
 *         return html`<div style="color: ${this._cardStyle.primary}">Content</div>`;
 *     }
 * }
 */
export class LCARdSCard extends LCARdSNativeCard {

    static get properties() {
        return {
            ...super.properties,

            // Card state
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

                .lcards-card-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                .lcards-card-error {
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

                .lcards-card-loading {
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

        // Card state
        this._entity = null;
        this._singletons = null;
        this._initialized = false;

        // Action handler (unified utility)
        this._actionHandler = new LCARdSActionHandler();

        // Template processing state
        this._templateUpdateScheduled = false;
        this._processedTexts = {
            label: '',
            content: '',
            texts: []
        };
        this._processedIcon = null; // Processed icon configuration

        // Entity tracking for Jinja2 template updates
        this._trackedEntities = [];

        // Config provenance tracking (from CoreConfigManager)
        this._provenance = null;

        // Rules integration state
        this._overlayId = null;           // Unique overlay ID for this card
        this._overlayTags = [];           // Tags for rule targeting
        this._rulesCallbackIndex = null;  // Callback index from RulesEngine (SINGLE callback)
        this._lastRulePatches = null;     // Cache of last applied patches
        this._overlayRegistered = false;  // Track if overlay is registered
        this._hasRulesToLoad = false;     // Flag to defer rule loading until singletons are ready
        this._hassMonitoringSetup = false; // Flag to prevent duplicate monitoring setup

        // DataSource tracking for cleanup
        this._registeredDataSources = new Set(); // Track datasources registered by this card

        lcardsLog.trace(`[LCARdSCard] Constructor called for ${this._getDisplayId()}`);
    }

    /**
     * Get display ID for logging - uses custom ID if provided, otherwise GUID
     * @returns {string} Display ID
     * @private
     */
    _getDisplayId() {
        return this.config?.id || this._cardGuid;
    }

    /**
     * Set card configuration with CoreConfigManager processing
     * @param {Object} config - Raw card configuration
     * @override
     */
    setConfig(config) {
        if (!config) {
            throw new Error('Invalid configuration');
        }

        // CRITICAL: setConfig MUST be synchronous for Home Assistant!
        // Store raw config immediately, then process asynchronously

        lcardsLog.trace(`[LCARdSCard] setConfig called`, {
            hasId: !!config.id,
            id: config.id,
            hasPreset: !!config.preset,
            preset: config.preset,
            entity: config.entity
        });

        // Call parent with raw config immediately (synchronous)
        super.setConfig(config);

        // Start async config processing in background (don't await!)
        // Store the promise so subclasses can wait for it if needed
        this._configProcessingPromise = this._processConfigAsync(config).catch(error => {
            lcardsLog.error(`[LCARdSCard] Async config processing failed:`, error);
        });
    }

    /**
     * Process config asynchronously through CoreConfigManager
     * This runs in the background after setConfig completes synchronously
     * @param {Object} rawConfig - Raw card configuration
     * @private
     */
    async _processConfigAsync(rawConfig) {
        const core = window.lcards?.core || window.lcardsCore;

        if (!core?.configManager?.initialized) {
            lcardsLog.trace(`[LCARdSCard] CoreConfigManager not available`);
            return;
        }

        try {
            const cardType = this.constructor.CARD_TYPE || rawConfig.type || 'simple-card';

            lcardsLog.trace(`[LCARdSCard] Processing config with CoreConfigManager`, {
                cardType,
                hasPreset: !!rawConfig.preset
            });

            const result = await core.configManager.processConfig(
                rawConfig,
                cardType,
                { hass: this.hass }
            );

            // Log validation results
            if (result.errors?.length > 0) {
                lcardsLog.error(`[LCARdSCard] Config validation errors:`, result.errors);
            }
            if (result.warnings?.length > 0) {
                lcardsLog.warn(`[LCARdSCard] Config validation warnings:`, result.warnings);
            }

            // Store provenance for debugging
            this._provenance = result.provenance;

            lcardsLog.trace(`[LCARdSCard] Config processed`, {
                valid: result.valid,
                hasProvenance: !!result.provenance,
                mergeOrder: result.provenance?.merge_order
            });

            // Update with processed config if valid
            if (result.valid && result.mergedConfig) {
                // Update internal config
                this.config = result.mergedConfig;

                // Allow subclasses to react to config changes before render
                // (e.g., button card needs to re-resolve styles when config changes)
                if (this._onConfigUpdated) {
                    this._onConfigUpdated();
                }

                // Trigger re-render with processed config
                this.requestUpdate();
            }

            // Process data_sources config if present (for advanced DataSource configs)
            if (result.mergedConfig?.data_sources) {
                await this._processDataSourcesConfig(result.mergedConfig.data_sources);
            }

        } catch (error) {
            lcardsLog.error(`[LCARdSCard] CoreConfigManager processing failed:`, error);
        }
    }

    /**
     * Process data_sources configuration to create advanced DataSource instances
     * Allows LCARdSCards to define DataSources with full config (window_seconds,
     * minEmitMs, coalesceMs, history preload, etc.) without requiring MSD.
     *
     * @example
     * ```yaml
     * type: custom:lcards-chart
     * data_sources:
     *   cpu_temp:
     *     entity: sensor.cpu_temp
     *     window_seconds: 3600
     *     minEmitMs: 250
     *     coalesceMs: 120
     *     history: { preload: true, hours: 6 }
     * source: cpu_temp
     * ```
     *
     * @param {Object} dataSourcesConfig - data_sources configuration object
     * @private
     */
    async _processDataSourcesConfig(dataSourcesConfig) {
        if (!dataSourcesConfig || typeof dataSourcesConfig !== 'object') {
            return;
        }

        const dataSourceManager = this._singletons?.dataSourceManager;
        if (!dataSourceManager) {
            lcardsLog.warn(`[LCARdSCard] Cannot process data_sources: DataSourceManager not available`);
            return;
        }

        lcardsLog.debug(`[LCARdSCard] Processing data_sources config`, {
            sourceCount: Object.keys(dataSourcesConfig).length,
            sources: Object.keys(dataSourcesConfig),
            cardId: this._cardGuid
        });

        // Initialize tracking set if needed
        if (!this._registeredDataSources) {
            this._registeredDataSources = new Set();
        }

        try {
            // Create each data source using DataSourceManager.createDataSource()
            const promises = Object.entries(dataSourcesConfig).map(async ([name, config]) => {
                try {
                    // Pass cardId and autoCreated=false for explicitly configured datasources
                    const source = await dataSourceManager.createDataSource(
                        name,
                        config,
                        this._cardGuid,  // Pass card identifier
                        false            // Not auto-created (explicit config)
                    );
                    
                    // Track this datasource for cleanup
                    this._registeredDataSources.add(name);
                    
                    lcardsLog.debug(`[LCARdSCard] Created DataSource '${name}'`, {
                        entity: config.entity,
                        hasHistory: !!config.history,
                        windowSeconds: config.window_seconds,
                        cardId: this._cardGuid
                    });
                    return source;
                } catch (error) {
                    lcardsLog.error(`[LCARdSCard] Failed to create DataSource '${name}':`, error);
                    return null;
                }
            });

            await Promise.all(promises);

            lcardsLog.debug(`[LCARdSCard] data_sources processing complete`);

        } catch (error) {
            lcardsLog.error(`[LCARdSCard] data_sources processing failed:`, error);
        }
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

        // Load rules from config into RulesEngine if singletons are ready
        // This handles the case where config is set after connection
        if (config.rules && Array.isArray(config.rules) && config.rules.length > 0) {
            if (this._singletons?.rulesEngine) {
                // Singletons already initialized - load rules now
                this._loadRulesFromConfig(config.rules);
                this._hasRulesToLoad = false; // Clear flag
            } else {
                // Singletons not ready yet - set flag for loading in _onConnected
                this._hasRulesToLoad = true;
            }
        }

        lcardsLog.debug(`[LCARdSCard] Config set for ${this._getDisplayId()}`, {
            entity: config.entity,
            hasEntity: !!this._entity,
            rulesCount: config.rules?.length || 0,
            hasAnimations: !!config.animations,
            animationsCount: config.animations?.length || 0,
            hasTapAction: !!config.tap_action,
            hasHoldAction: !!config.hold_action,
            singletonsReady: !!this._singletons,
            finalConfig: config  // Log the entire final config for debugging
        });

        // Process templates whenever config changes (async to support Jinja2)
        if (this._initialized) {
            // Already initialized - schedule template update
            this._scheduleTemplateUpdate();
        } else {
            // First config set before firstUpdated - process templates
            this._processTemplates();
        }
    }

    /**
     * Called when HASS changes
     * @protected
     */
    async _onHassChanged(newHass, oldHass) {
        super._onHassChanged(newHass, oldHass);

        lcardsLog.debug(`[LCARdSCard] _onHassChanged called for ${this._cardGuid}`, {
            hasCore: !!window.lcards?.core,
            hasConfig: !!this.config,
            configEntity: this.config?.entity,
            entityState: newHass?.states?.[this.config?.entity]?.state
        });

        // Update entity reference
        if (this.config.entity) {
            this._entity = newHass.states[this.config.entity];

            // Export light color CSS variable if this is a light entity
            this._updateLightColorVariable();
        }

        // Set up efficient entity-based rule monitoring on first HASS (once only)
        lcardsLog.trace(`[LCARdSCard] Checking monitoring setup for ${this._getDisplayId()}`, {
            _hassMonitoringSetup: this._hassMonitoringSetup,
            hasRulesManager: !!(this._singletons?.rulesEngine),
            hasNewHass: !!newHass,
            hasOldHass: !!oldHass,
            oldHassIsNull: oldHass === null,
            oldHassIsUndefined: oldHass === undefined,
            shouldSetup: !this._hassMonitoringSetup && !!(this._singletons?.rulesEngine) && !!newHass && !oldHass
        });

        if (!this._hassMonitoringSetup && this._singletons?.rulesEngine && newHass && !oldHass) {
            this._hassMonitoringSetup = true;
            lcardsLog.trace(`[LCARdSCard] Setting up entity-based monitoring for ${this._getDisplayId()}`);
            try {
                await this._singletons.rulesEngine.setupHassMonitoring(newHass);
                lcardsLog.trace(`[LCARdSCard] Entity-based rule monitoring enabled for ${this._getDisplayId()}`);
            } catch (error) {
                lcardsLog.error(`[LCARdSCard] Failed to setup rule monitoring:`, error);
            }
        }

        // Forward HASS to core singleton ONLY if relevant entities changed
        // This prevents unnecessary subsystem updates when unrelated entities change
        if (window.lcards?.core) {
            // Check if this card's entity or any rule-dependent entities changed
            const cardEntityChanged = this.config?.entity &&
                oldHass?.states?.[this.config.entity] !== newHass?.states?.[this.config.entity];

            const trackedEntitiesChanged = this._trackedEntities?.some(entityId =>
                oldHass?.states?.[entityId] !== newHass?.states?.[entityId]
            );

            if (!oldHass || cardEntityChanged || trackedEntitiesChanged) {
                lcardsLog.trace(`[LCARdSCard] Forwarding HASS to core.ingestHass() for ${this._cardGuid}`, {
                    reason: !oldHass ? 'initial' : cardEntityChanged ? 'card entity' : 'tracked entity',
                    cardEntity: this.config?.entity,
                    trackedCount: this._trackedEntities?.length || 0
                });
                window.lcards.core.ingestHass(newHass);
            } else {
                lcardsLog.trace(`[LCARdSCard] Skipping core.ingestHass() - no relevant entity changes for ${this._cardGuid}`);
            }
        } else {
            lcardsLog.warn(`[LCARdSCard] ⚠️ No core singleton available for ${this._cardGuid}`);
        }

        // Check if any tracked entities changed (for Jinja2 template updates)
        if (this._trackedEntities && this._trackedEntities.length > 0) {
            const hasChanges = this._trackedEntities.some(entityId => {
                const oldState = oldHass?.states?.[entityId];
                const newState = newHass?.states?.[entityId];
                return oldState !== newState;
            });

            if (hasChanges) {
                // Re-process templates when tracked entities change
                this._scheduleTemplateUpdate();
            }
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
    async _onConnected() {
        super._onConnected();

        // Initialize singleton access
        this._initializeSingletons();

        // Now that singletons are initialized, load rules from config
        if (this._hasRulesToLoad && this.config.rules) {
            this._loadRulesFromConfig(this.config.rules);
            this._hasRulesToLoad = false; // Clear flag after loading

            // IMPORTANT: Set up monitoring AFTER rules are compiled (so dependency index is populated)
            // Try to setup monitoring now that we have singletons AND rules (if HASS already arrived)
            if (!this._hassMonitoringSetup && this._singletons?.rulesEngine && this._hass) {
                this._hassMonitoringSetup = true;
                lcardsLog.trace(`[LCARdSCard] Setting up entity-based monitoring (after rules loaded) for ${this._getDisplayId()}`, {
                    hasRulesEngine: !!this._singletons.rulesEngine,
                    hasHass: !!this._hass,
                    hasConnection: !!this._hass?.connection,
                    hasSubscribeEvents: !!(this._hass?.connection?.subscribeEvents)
                });
                try {
                    await this._singletons.rulesEngine.setupHassMonitoring(this._hass);
                    // Verify it actually worked
                    if (this._singletons.rulesEngine.hassUnsubscribe) {
                        lcardsLog.trace(`[LCARdSCard] Entity-based rule monitoring enabled for ${this._getDisplayId()}`);
                    } else {
                        lcardsLog.warn(`[LCARdSCard] setupHassMonitoring() completed but no subscription created for ${this._getDisplayId()}`);
                    }
                } catch (error) {
                    lcardsLog.error(`[LCARdSCard] Failed to setup rule monitoring:`, error);
                }
            }
        }

        lcardsLog.trace(`[LCARdSCard] Connected: ${this._getDisplayId()}`);
    }

    /**
     * Called on first update
     * @protected
     */
    _onFirstUpdated(changedProperties) {
        super._onFirstUpdated(changedProperties);

        // Mark as initialized
        this._initialized = true;

        // NOTE: Do NOT register rules callback here - subclasses should call
        // _registerOverlayForRules() in their own _handleFirstUpdate() hook
        // to avoid duplicate registrations

        // Call card-specific initialization
        if (typeof this._handleFirstUpdate === 'function') {
            this._handleFirstUpdate(changedProperties);
        }

        lcardsLog.trace(`[LCARdSCard] First updated: ${this._getDisplayId()}`);
    }

    /**
     * Cleanup when card is removed from DOM
     */
    disconnectedCallback() {
        super.disconnectedCallback();

        // Remove this card from all datasource tracking
        if (this._singletons?.dataSourceManager && this._registeredDataSources) {
            this._registeredDataSources.forEach(sourceName => {
                this._singletons.dataSourceManager.removeCardFromSource(
                    sourceName,
                    this._cardGuid
                );
            });
            this._registeredDataSources.clear();
        }

        // Unregister overlay and rules callback (consolidated cleanup)
        this._unregisterOverlayFromRules();

        // Cleanup light color CSS variable
        this._cleanupLightColorVariable();

        // Cleanup resize observer if set up
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        lcardsLog.trace(`[LCARdSCard] Disconnected and cleaned up: ${this._getDisplayId()}`);
    }

    /**
     * Setup ResizeObserver for automatic container size tracking
     * Enables cards to automatically respond to grid cell size changes
     *
     * Subclasses should:
     * 1. Call this method in their initialization (e.g., _handleFirstUpdate)
     * 2. Store size in this._containerSize = { width, height }
     * 3. Use the size values in their rendering logic
     *
     * @param {Function} onResize - Optional callback: (width, height) => void
     * @protected
     *
     * @example
     * _handleFirstUpdate() {
     *     super._handleFirstUpdate();
     *     this._setupAutoSizing((width, height) => {
     *         this._containerSize = { width, height };
     *         this.requestUpdate();
     *     });
     * }
     */
    _setupAutoSizing(onResize = null) {
        // Clean up existing observer if any
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }

        this._resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0) return;

            const { width, height } = entries[0].contentRect;

            // Only process if size actually changed (avoid thrashing)
            if (!this._containerSize ||
                width !== this._containerSize.width ||
                height !== this._containerSize.height) {

                // Update stored size if property exists
                if (this._containerSize !== undefined) {
                    this._containerSize = { width, height };
                }

                lcardsLog.trace(`[LCARdSCard] Container resized to ${width}x${height} for ${this._getDisplayId()}`);

                // Call custom callback if provided
                if (onResize && typeof onResize === 'function') {
                    onResize(width, height);
                } else {
                    // Default: trigger re-render
                    this.requestUpdate();
                }
            }
        });

        // Observe this element (the custom element itself)
        // The web component should fill its container via CSS (width: 100%, height: 100%)
        this._resizeObserver.observe(this);

        lcardsLog.trace(`[LCARdSCard] Auto-sizing enabled for ${this._getDisplayId()}`, {
            element: this.tagName,
            hasCallback: !!onResize
        });
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
                lcardsLog.warn(`[LCARdSCard] Core singletons not available`);
                return;
            }

            const animationManager = core.getAnimationManager();
            lcardsLog.trace(`[LCARdSCard] AnimationManager singleton check for ${this._cardGuid}`, {
                hasGetMethod: typeof core.getAnimationManager === 'function',
                managerResult: !!animationManager,
                managerType: animationManager?.constructor?.name,
                coreAnimMgr: !!core.animationManager,
                directAccess: !!core.animationManager
            });

            this._singletons = {
                systemsManager: core.systemsManager,
                themeManager: core.getThemeManager(),
                rulesEngine: core.rulesManager,
                animationManager: animationManager,
                dataSourceManager: core.dataSourceManager,
                validationService: core.validationService,
                actionHandler: core.actionHandler,
                stylePresetManager: core.getStylePresetManager()
            };

            // Register this card with CoreSystemsManager for entity tracking
            if (this._singletons.systemsManager && this._cardGuid) {
                this._cardContext = this._singletons.systemsManager.registerCard(
                    this._cardGuid,
                    this,
                    this.config
                );
                lcardsLog.trace(`[LCARdSCard] Registered with CoreSystemsManager: ${this._cardGuid}`);
            }

            lcardsLog.trace(`[LCARdSCard] Singletons initialized for ${this._cardGuid}`, {
                hasSystemsManager: !!this._singletons.systemsManager,
                hasTheme: !!this._singletons.themeManager,
                hasRules: !!this._singletons.rulesEngine,
                hasAnimations: !!this._singletons.animationManager,
                hasDataSources: !!this._singletons.dataSourceManager
            });

        } catch (error) {
            lcardsLog.error(`[LCARdSCard] Singleton initialization failed:`, error);
        }
    }

    // ============================================================================
    // RULES INTEGRATION - Dynamic styling via RulesEngine
    // ============================================================================

    /**
     * Load rules from card config into the global RulesEngine
     * Follows MSD pattern: add rules to shared engine
     *
     * @param {Array} rules - Array of rule objects from card config
     * @private
     */
    _loadRulesFromConfig(rules) {
        if (!this._singletons?.rulesEngine) {
            lcardsLog.warn('[LCARdSCard] RulesEngine not available, cannot load rules from config');
            return;
        }

        if (!Array.isArray(rules) || rules.length === 0) {
            return;
        }

        try {
            const rulesEngine = this._singletons.rulesEngine;
            let addedCount = 0;

            // Get source card ID for tracking
            const sourceCardId = this.config?.id || this._cardGuid || 'unknown-card';
            // Infer card type from config.type or constructor name
            const sourceCardType = this.config?.type?.replace('custom:', '') || this.constructor.name || 'simple';

            // Add each rule to the shared engine (skip duplicates by ID)
            rules.forEach(rule => {
                // Ensure rule has an ID
                if (!rule.id) {
                    lcardsLog.warn('[LCARdSCard] Rule missing ID, skipping:', rule);
                    return;
                }

                // Skip if rule already exists in engine
                if (rulesEngine.rulesById.has(rule.id)) {
                    lcardsLog.debug(`[LCARdSCard] Rule ${rule.id} already exists in engine, skipping`);
                    return;
                }

                // Add metadata for tracking which card registered this rule
                rule._sourceCardId = sourceCardId;
                rule._sourceCardType = sourceCardType;

                // Add rule to engine
                rulesEngine.rules.push(rule);
                addedCount++;
            });

            if (addedCount > 0) {
                // Rebuild indexes and compile new rules
                rulesEngine.buildRulesIndex();
                rulesEngine.buildDependencyIndex();
                rulesEngine._compileRules();
                rulesEngine.markAllDirty(); // Mark all rules dirty for initial evaluation

                lcardsLog.info(`[LCARdSCard] Loaded ${addedCount} rules from ${sourceCardId} (${sourceCardType}). Total rules in engine: ${rulesEngine.rules.length}`);
            }

        } catch (error) {
            lcardsLog.error('[LCARdSCard] Failed to load rules from config:', error);
        }
    }

    /**
     * Register this card's overlay with the RulesEngine for dynamic styling based on entity states
     *
     * This method integrates the card with the RulesEngine, enabling rule-based style patches
     * to be applied dynamically when entity states change. It should be called once during
     * card initialization (typically in _handleFirstUpdate()).
     *
     * **What it does:**
     * 1. Registers overlay with CoreSystemsManager for metadata tracking
     * 2. Sets up callback with RulesEngine for rule re-evaluation
     * 3. Triggers initial rule evaluation if HASS is available
     * 4. Caches rule patches for efficient style merging
     *
     * **Lifecycle:**
     * - Called by subclass in _handleFirstUpdate()
     * - Automatically triggers initial evaluation if HASS available
     * - Sets up callback for future rule re-evaluations
     * - Cleanup handled automatically in _onDisconnected()
     *
     * @param {Object} overlay - Overlay configuration object
     * @param {string} overlay.id - Unique overlay identifier (e.g., 'lcards-button-' + cardGuid)
     * @param {string} overlay.type - Overlay type ('button', 'label', 'status', etc.)
     * @param {Object} [overlay.metadata] - Additional metadata (entity, cardType, etc.)
     * @param {Array<string>} [overlay.tags] - Tags for rule targeting (optional)
     *
     * @example
     * // In your card's _handleFirstUpdate():
     * _handleFirstUpdate() {
     *     super._handleFirstUpdate();
     *
     *     this._registerOverlayForRules({
     *         id: `lcards-button-${this._cardGuid}`,
     *         type: 'button',
     *         metadata: {
     *             entity: this.config.entity,
     *             cardType: 'button'
     *         }
     *     });
     *
     *     this._resolveButtonStyle(); // Initial style resolution
     * }
     *
     * @protected
     */
    _registerOverlayForRules(overlayId, tags = []) {
        if (!this._singletons?.rulesEngine || !this._singletons?.systemsManager) {
            lcardsLog.debug('[LCARdSCard] Rules or SystemsManager not available, skipping overlay registration');
            return;
        }

        // Prevent duplicate registration
        if (this._overlayRegistered) {
            lcardsLog.warn(`[LCARdSCard] Overlay already registered for ${this._getDisplayId()}, skipping duplicate registration`);
            return;
        }

        // Use the provided overlayId directly (no suffix appending)
        // For simple cards with single overlays, pass the card ID directly
        // This makes rule targeting intuitive: user sets id:my_button, rule targets my_button
        this._overlayId = overlayId;
        this._overlayTags = Array.isArray(tags) ? tags : [tags];

        // Register overlay with CoreSystemsManager
        this._singletons.systemsManager.registerOverlay(this._overlayId, {
            id: this._overlayId,
            tags: this._overlayTags,
            sourceCardId: this._cardGuid
        });

        // Register callback with RulesEngine (SINGLE callback per card)
        // Callback evaluates rules and applies relevant patches
        this._rulesCallbackIndex = this._singletons.rulesEngine.setReEvaluationCallback(async () => {
            lcardsLog.trace(`[LCARdSCard] Rules re-evaluation callback triggered for ${this._overlayId}`);

            try {
                // Evaluate dirty rules to get patches
                const ruleResults = await this._singletons.rulesEngine.evaluateDirty({
                    entity: this.config?.entity,  // Pass bound entity ID for JavaScript context
                    getEntity: (entityId) => {
                        const state = this.hass?.states?.[entityId];
                        lcardsLog.trace(`[LCARdSCard] getEntity(${entityId}) => ${state?.state}`);
                        return state;
                    }
                });

                // Apply patches if any exist
                if (ruleResults && ruleResults.overlayPatches) {
                    this._applyRulePatches(ruleResults.overlayPatches);
                }
            } catch (error) {
                lcardsLog.error(`[LCARdSCard] Error in rules callback for ${this._overlayId}:`, error);
            }
        });

        this._overlayRegistered = true;

        lcardsLog.debug(`[LCARdSCard] Registered overlay for rules: ${this._overlayId}`, {
            tags: this._overlayTags,
            callbackIndex: this._rulesCallbackIndex,
            cardGuid: this._cardGuid
        });

        // Trigger initial rule evaluation if HASS is already available
        // This ensures rules are applied even if the light is already ON during page load
        if (this.hass) {
            lcardsLog.trace(`[LCARdSCard] HASS available, triggering initial rule evaluation for ${this._overlayId}`);
            this._singletons.rulesEngine.markAllDirty();
            // Trigger the callback we just registered
            if (this._rulesCallbackIndex >= 0) {
                const callbacks = this._singletons.rulesEngine._reEvaluationCallbacks || [];
                if (callbacks[this._rulesCallbackIndex]) {
                    callbacks[this._rulesCallbackIndex]();
                }
            }
        }
    }

    /**
     * Unregister overlay from rules system during cleanup
     * @protected
     */
    _unregisterOverlayFromRules() {
        if (!this._overlayRegistered) {
            return; // Nothing to clean up
        }

        // Remove callback from RulesEngine
        if (this._rulesCallbackIndex !== null && this._singletons?.rulesEngine) {
            this._singletons.rulesEngine.removeReEvaluationCallback(this._rulesCallbackIndex);
            this._rulesCallbackIndex = null;
            lcardsLog.debug(`[LCARdSCard] Removed rules callback for ${this._overlayId}`);
        }

        // Unregister overlay from SystemsManager
        if (this._overlayId && this._singletons?.systemsManager) {
            this._singletons.systemsManager.unregisterOverlay(this._overlayId);
            lcardsLog.debug(`[LCARdSCard] Unregistered overlay: ${this._overlayId}`);
        }

        this._overlayId = null;
        this._overlayTags = [];
        this._lastRulePatches = null;
        this._overlayRegistered = false;
    }

    /**
     * Apply rule patches to this card's overlay
     * Filters patches for this card's overlay and triggers efficient update
     *
     * @param {Array} overlayPatches - Array of overlay patches from RulesEngine
     * @private
     */
    _applyRulePatches(overlayPatches) {
        lcardsLog.trace(`[LCARdSCard] _applyRulePatches called for ${this._overlayId}`, {
            patchesProvided: Array.isArray(overlayPatches) ? overlayPatches.length : 0,
            overlayId: this._overlayId
        });

        if (!overlayPatches || !this._overlayId) {
            lcardsLog.warn(`[LCARdSCard] Cannot apply patches - missing overlayPatches or overlayId`);
            return;
        }

        // Find patches for this card's overlay
        const myPatches = overlayPatches.filter(patch => patch.id === this._overlayId);

        if (myPatches.length === 0) {
            // No patches for this overlay - clear cached patches if any existed
            if (this._lastRulePatches !== null) {
                this._lastRulePatches = null;
                lcardsLog.debug(`[LCARdSCard] Cleared rule patches for ${this._overlayId}`);

                // Call subclass hook to handle style resolution after patch clearing
                if (typeof this._onRulePatchesChanged === 'function') {
                    this._onRulePatchesChanged();
                }

                this.requestUpdate(); // Trigger re-render to clear rule styles
            }
            return;
        }

        // Merge all patches for this overlay (later patches override)
        const mergedPatch = myPatches.reduce((acc, patch) => ({
            ...acc,
            ...patch,
            style: {
                ...(acc.style || {}),
                ...(patch.style || {})
            }
        }), {});

        // Check if patches actually changed (avoid unnecessary updates)
        const patchesChanged = JSON.stringify(this._lastRulePatches) !== JSON.stringify(mergedPatch);

        if (!patchesChanged) {
            lcardsLog.trace(`[LCARdSCard] Rule patches unchanged for ${this._overlayId}`);
            return;
        }

        // Cache patches for style resolution
        this._lastRulePatches = mergedPatch;

        lcardsLog.debug(`[LCARdSCard] Applied rule patches to ${this._overlayId}`, {
            patchCount: myPatches.length,
            patchKeys: Object.keys(mergedPatch)
        });

        // Deep merge patches into config (for non-style properties like text, dpad, etc.)
        // This ensures rules can patch any config property, not just style
        this.config = deepMerge({ ...this.config }, this._lastRulePatches);

        // Call subclass hook to handle card-specific updates after patch changes
        // Subclasses can use this to clear caches, reprocess templates, etc.
        if (typeof this._onRulePatchesChanged === 'function') {
            this._onRulePatchesChanged();
        }

        // Trigger efficient update using Lit's change detection
        this.requestUpdate();
    }

    /**
     * Merge base config style with active rule patches
     *
     * Rule patches have **highest priority** in the style resolution chain and will
     * override any matching properties from the config style. This method should be
     * called as the final step in your style resolution logic.
     *
     * **IMPORTANT:** As of v1.26+, this now performs a DEEP MERGE of the entire
     * patch config, not just the `style` property. This allows rules to patch any
     * config property including `text.*`, `dpad.*`, `icon.*`, etc.
     *
     * **Style Resolution Priority (low to high):**
     * 1. Preset styles
     * 2. Config styles
     * 3. Theme token resolution
     * 4. State overrides
     * 5. Rule patches (applied by this method)
     *
     * **Performance:**
     * - Returns immediately if no rule patches active
     * - Deep merge for nested objects (text, dpad, etc.)
     * - No DOM interaction (pure computation)
     *
     * @param {Object} configStyle - Base style/config from preset/theme resolution
     * @returns {Object} Merged config with rule patches applied (rules override config)
     *
     * @example
     * // In your style resolution method:
     * _resolveButtonStyle() {
     *     // 1. Start with config
     *     let style = { ...(this.config.style || {}) };
     *
     *     // 2. Apply preset
     *     if (this.config.preset) {
     *         const preset = this.getStylePreset('button', this.config.preset);
     *         style = { ...preset, ...style };
     *     }
     *
     *     // 3. Apply theme tokens
     *     style = this.resolveStyle(style, ['colors.primary']);
     *
     *     // 4. Apply rule patches (highest priority - can patch ANY config property)
     *     style = this._getMergedStyleWithRules(style); // Call this last
     *
     *     this._buttonStyle = style;
     *     this.requestUpdate();
     * }
     *
     * @protected
     */
    _getMergedStyleWithRules(configStyle = {}) {
        if (!this._lastRulePatches) {
            return configStyle;
        }

        // Deep merge entire patch into config (not just .style)
        // This allows rules to patch text, dpad, icon, and other top-level properties
        return deepMerge(configStyle, this._lastRulePatches);
    }

    // ============================================================================
    // STATE MAPPING UTILITIES - Unified state resolution for buttons and segments
    // ============================================================================

    /**
     * Map entity state to Button style state convention
     * Supports both direct matching and mapped states
     *
     * @param {string} entityState - Raw entity state (on/off/playing/etc)
     * @param {string} domain - Entity domain (light/media_player/etc) - optional
     * @returns {string} Mapped state (active/inactive/unavailable/unknown/custom)
     *
     * @example
     * _mapEntityStateToStyleState('on') // Returns 'active'
     * _mapEntityStateToStyleState('playing') // Returns 'active'
     * _mapEntityStateToStyleState('buffering') // Returns 'buffering' (custom, passed through)
     */
    _mapEntityStateToStyleState(entityState, domain = null) {
        if (!entityState) return 'default';

        const normalizedState = entityState.toLowerCase();

        // Map to standard Button states
        switch (normalizedState) {
            // Active states (entity is "on" or actively doing something)
            case 'on':
            case 'playing':
            case 'locked':
            case 'home':
            case 'open':
            case 'opening':
            case 'cleaning':
            case 'mowing':
            case 'armed_home':
            case 'armed_away':
            case 'armed_night':
            case 'armed_custom_bypass':
            case 'pending':
            case 'triggered':
            case 'active':
            case 'running':
            case 'heating':
            case 'cooling':
            case 'fan':
            case 'dry':
            case 'heat_cool':
                return 'active';

            // Inactive states (entity is "off" or idle)
            case 'off':
            case 'paused':
            case 'idle':
            case 'stopped':
            case 'standby':
            case 'unlocked':
            case 'away':
            case 'closed':
            case 'closing':
            case 'docked':
            case 'returning':
            case 'disarmed':
            case 'inactive':
                return 'inactive';

            // Special states
            case 'unavailable':
                return 'unavailable';
            case 'unknown':
                return 'unknown';

            // Custom states: return as-is for direct matching
            // Examples: buffering, loading, error, charging, etc.
            default:
                return normalizedState;
        }
    }

    /**
     * Resolve style value for a given state with fallback chain
     * Supports direct state matching, mapped states, and defaults
     *
     * Priority:
     * 1. Direct state match (e.g., "playing" in config)
     * 2. Mapped state (e.g., "playing" → "active" → use "active" value)
     * 3. Default fallback
     *
     * @param {Object} styleConfig - Style configuration (can be nested object or direct value)
     * @param {string} state - Current state to resolve (entity state or interaction state)
     * @param {string} fallbackState - Fallback if state not found (default: 'default')
     * @returns {*} Resolved style value
     *
     * @example
     * // Config: { default: "gray", active: "orange", playing: "yellow" }
     * _resolveStyleForState(config, 'playing') // Returns "yellow" (direct match)
     * _resolveStyleForState(config, 'on') // Returns "orange" (mapped: on → active)
     * _resolveStyleForState(config, 'buffering') // Returns "gray" (fallback to default)
     */
    _resolveStyleForState(styleConfig, state, fallbackState = 'default') {
        // If styleConfig is not an object, it's a direct value (not state-based)
        if (!styleConfig || typeof styleConfig !== 'object' || Array.isArray(styleConfig)) {
            return styleConfig;
        }

        // Priority 1: Direct state match
        if (state in styleConfig) {
            return styleConfig[state];
        }

        // Priority 2: Mapped state (e.g., "on" → "active")
        const mappedState = this._mapEntityStateToStyleState(state);
        if (mappedState !== state && mappedState in styleConfig) {
            return styleConfig[mappedState];
        }

        // Priority 3: Fallback state
        if (fallbackState in styleConfig) {
            return styleConfig[fallbackState];
        }

        // Priority 4: Default key
        if ('default' in styleConfig) {
            return styleConfig.default;
        }

        // Priority 5: First available value (last resort)
        const values = Object.values(styleConfig);
        return values.length > 0 ? values[0] : undefined;
    }

    /**
     * Get entity state for a given entity ID
     *
     * @param {string} entityId - Entity ID to look up
     * @returns {string|null} Entity state or null if not found
     */
    _getEntityState(entityId) {
        if (!entityId || !this.hass?.states) return null;
        const entity = this.hass.states[entityId];
        return entity?.state || null;
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
    /**
     * Process template content with support for JavaScript, tokens, and Jinja2
     *
     * @param {string} template - Template string to process
     * @returns {Promise<string>} Processed template
     * @protected
     */
    async processTemplate(template) {
        if (!template || typeof template !== 'string') {
            return template;
        }

        try {
            // Create evaluation context
            const context = {
                entity: this._entity,
                config: this.config,
                hass: this.hass,
                variables: this.config?.variables || {},
                theme: this._singletons?.themeManager?.getCurrentTheme?.()
            };

            // Get dataSourceManager from global singleton (if available)
            const dataSourceManager = window.lcards?.debug?.msd?.pipelineInstance?.systemsManager?.dataSourceManager;

            // Check if template has datasource references but manager not available yet
            // Only match actual datasource syntax: {datasource:name} or {ds:name}
            const hasDatasources = template.includes('{datasource:') || template.includes('{ds:');
            if (hasDatasources && !dataSourceManager) {
                // Schedule a retry when DataSourceManager becomes available
                this._scheduleDatasourceRetry();

                lcardsLog.trace('[LCARdSCard] Datasource template detected but DataSourceManager not ready, will retry', {
                    cardGuid: this._cardGuid,
                    template: template.substring(0, 50)
                });
            }

            // Use UnifiedTemplateEvaluator for consistent template processing
            // This enables datasource access: {datasource:sensor.temp}
            const evaluator = new UnifiedTemplateEvaluator({
                hass: this.hass,
                context: context,
                dataSourceManager: dataSourceManager
            });

            // Use async evaluation to support all template types (JavaScript, Tokens, Datasources, Jinja2)
            const result = await evaluator.evaluateAsync(template);
            return result;

        } catch (error) {
            lcardsLog.error(`[LCARdSCard] Template processing failed:`, error);
            return template;
        }
    }

    /**
     * Schedule a retry of template processing when DataSourceManager becomes available
     * @private
     */
    _scheduleDatasourceRetry() {
        // Only schedule once
        if (this._datasourceRetryScheduled) {
            return;
        }
        this._datasourceRetryScheduled = true;

        // Poll for DataSourceManager availability
        const checkInterval = setInterval(() => {
            const dataSourceManager = window.lcards?.debug?.msd?.pipelineInstance?.systemsManager?.dataSourceManager;

            if (dataSourceManager) {
                clearInterval(checkInterval);
                if (this._datasourceTimeoutId) {
                    clearTimeout(this._datasourceTimeoutId);
                    this._datasourceTimeoutId = null;
                }
                this._datasourceRetryScheduled = false;

                lcardsLog.info('[LCARdSCard] DataSourceManager now available, re-processing templates', {
                    cardGuid: this._cardGuid
                });

                // Trigger template re-processing
                this._scheduleTemplateUpdate();
            }
        }, 100); // Check every 100ms

        // Give up after 10 seconds
        this._datasourceTimeoutId = setTimeout(() => {
            if (this._datasourceRetryScheduled) {
                clearInterval(checkInterval);
                this._datasourceRetryScheduled = false;
                this._datasourceTimeoutId = null;
                lcardsLog.warn('[LCARdSCard] DataSourceManager not available after timeout', {
                    cardGuid: this._cardGuid
                });
            }
        }, 10000);
    }    /**
     * Schedule template processing to avoid Lit update cycles
     * @protected
     */
    _scheduleTemplateUpdate() {
        if (this._templateUpdateScheduled) return;

        this._templateUpdateScheduled = true;
        requestAnimationFrame(async () => {
            this._templateUpdateScheduled = false;

            // Process templates (async for Jinja2 support)
            await this._processTemplates();

            // Re-render only if we're not in an update cycle
            if (!this.hasUpdated || this.updateComplete === Promise.resolve()) {
                this.requestUpdate();
            } else {
                // Wait for current update to complete
                this.updateComplete.then(() => {
                    this.requestUpdate();
                });
            }
        });
    }

    /**
     * Process templates (async to support Jinja2)
     * Subclasses should override to define their text processing
     * @protected
     */
    async _processTemplates() {
        // Process icon configuration
        await this._processIcon();

        // Call subclass-specific template processing hook
        if (typeof this._processCustomTemplates === 'function') {
            await this._processCustomTemplates();
        }
    }

    /**
     * Extract and track entities from Jinja2 templates
     * Base implementation only tracks primary entity.
     * Subclasses should override to add their specific template sources.
     * @private
     */
    _updateTrackedEntities() {
        const trackedEntities = new Set();

        // Add primary entity
        if (this.config.entity) {
            trackedEntities.add(this.config.entity);
        }

        this._trackedEntities = Array.from(trackedEntities);

        lcardsLog.trace(`[LCARdSCard] Tracking ${this._trackedEntities.length} entities for ${this._cardGuid}:`, this._trackedEntities);
    }

    /**
     * Process icon configuration
     * Resolves icon source (entity icon, MDI, Simple Icons, etc.)
     * @protected
     */
    async _processIcon() {
        if (!this.config.show_icon) {
            this._processedIcon = null;
            return;
        }

        const iconConfig = this.config.icon;

        // No icon config - try to use entity icon
        if (!iconConfig || iconConfig === 'entity') {
            if (this._entity && this._entity.attributes?.icon) {
                this._processedIcon = {
                    type: 'entity',
                    icon: this._entity.attributes.icon,
                    position: 'left',
                    size: 24,
                    color: 'inherit'
                };
            } else {
                this._processedIcon = null;
            }
            return;
        }

        // Simple string icon (e.g., "mdi:lightbulb")
        if (typeof iconConfig === 'string') {
            this._processedIcon = this._parseIconString(iconConfig);
            return;
        }

        // Full object configuration
        if (typeof iconConfig === 'object' && iconConfig.icon) {
            const parsed = this._parseIconString(iconConfig.icon);
            this._processedIcon = {
                ...parsed,
                position: iconConfig.position || 'left',
                size: iconConfig.size || 24,
                color: iconConfig.color || 'inherit',
                padding_left: iconConfig.padding_left || 0,
                padding_right: iconConfig.padding_right || 0,
                padding_top: iconConfig.padding_top || 0,
                padding_bottom: iconConfig.padding_bottom || 0
            };
            return;
        }

        // Fallback: no valid icon
        this._processedIcon = null;
    }

    /**
     * Parse icon string into type and name
     * Supports: 'mdi:icon', 'si:icon', 'entity', plain names
     * Does not set defaults - those come from theme tokens in _processIconConfiguration
     * @private
     */
    _parseIconString(iconString) {
        if (!iconString) {
            return null;
        }

        // Handle 'entity' keyword
        if (iconString === 'entity' && this._entity?.attributes?.icon) {
            return {
                type: 'entity',
                icon: this._entity.attributes.icon
                // position, size and color will be resolved from theme tokens
            };
        }

        // Parse prefix:name format
        if (iconString.includes(':')) {
            const [prefix, name] = iconString.split(':', 2);

            switch (prefix.toLowerCase()) {
                case 'mdi':
                    return {
                        type: 'mdi',
                        icon: name // Just the name without prefix
                        // position, size and color will be resolved from theme tokens
                    };
                case 'si':
                    return {
                        type: 'si',
                        icon: name // Just the name without prefix
                        // position, size and color will be resolved from theme tokens
                    };
                default:
                    // Unknown prefix, treat as MDI
                    return {
                        type: 'mdi',
                        icon: name
                        // position, size and color will be resolved from theme tokens
                    };
            }
        }

        // Plain name - assume MDI
        return {
            type: 'mdi',
            icon: iconString
            // position, size and color will be resolved from theme tokens
        };
    }

    /**
     * Resolve icon for entity using HA's state-aware logic
     * Replicates Home Assistant's icon resolution without DOM manipulation
     * @param {Object} entity - Entity state object
     * @returns {string} Icon name (e.g., 'mdi:lightbulb-on')
     * @protected
     */
    _resolveEntityIcon(entity) {
        if (!entity) {
            return 'mdi:bookmark';
        }

        // Priority 1: Explicit icon override in attributes
        if (entity.attributes?.icon) {
            return entity.attributes.icon;
        }

        // Priority 2: State-aware domain icons
        const domain = entity.entity_id.split('.')[0];
        const state = entity.state;

        // Domain-specific state-aware icon mappings (from HA source)
        const stateIconMap = {
            'light': {
                'on': 'mdi:lightbulb',
                'off': 'mdi:lightbulb-off',
                'unavailable': 'mdi:lightbulb-question'
            },
            'switch': {
                'on': 'mdi:toggle-switch',
                'off': 'mdi:toggle-switch-off-outline',
                'unavailable': 'mdi:toggle-switch-off-outline'
            },
            'binary_sensor': {
                'on': 'mdi:radiobox-marked',
                'off': 'mdi:radiobox-blank',
                'unavailable': 'mdi:help-circle-outline'
            },
            'lock': {
                'locked': 'mdi:lock',
                'unlocked': 'mdi:lock-open',
                'jammed': 'mdi:lock-alert',
                'unavailable': 'mdi:lock-off-outline'
            },
            'cover': {
                'open': 'mdi:window-open',
                'closed': 'mdi:window-closed',
                'opening': 'mdi:arrow-up-box',
                'closing': 'mdi:arrow-down-box',
                'unavailable': 'mdi:window-closed-variant'
            },
            'fan': {
                'on': 'mdi:fan',
                'off': 'mdi:fan-off',
                'unavailable': 'mdi:fan-off'
            },
            'climate': {
                'heat': 'mdi:fire',
                'cool': 'mdi:snowflake',
                'heat_cool': 'mdi:thermometer',
                'auto': 'mdi:thermostat-auto',
                'dry': 'mdi:water-percent',
                'fan_only': 'mdi:fan',
                'off': 'mdi:thermostat',
                'unavailable': 'mdi:thermostat-box'
            },
            'media_player': {
                'playing': 'mdi:play',
                'paused': 'mdi:pause',
                'idle': 'mdi:stop',
                'off': 'mdi:power',
                'unavailable': 'mdi:cast-off'
            },
            'person': {
                'home': 'mdi:home-account',
                'not_home': 'mdi:account-arrow-right',
                'unavailable': 'mdi:account-question'
            },
            'device_tracker': {
                'home': 'mdi:home',
                'not_home': 'mdi:home-export-outline',
                'unavailable': 'mdi:help-circle-outline'
            },
            'alarm_control_panel': {
                'armed_home': 'mdi:shield-home',
                'armed_away': 'mdi:shield-lock',
                'armed_night': 'mdi:shield-moon',
                'armed_vacation': 'mdi:shield-airplane',
                'armed_custom_bypass': 'mdi:shield-half-full',
                'pending': 'mdi:shield-outline',
                'arming': 'mdi:shield-outline',
                'disarmed': 'mdi:shield-off',
                'triggered': 'mdi:bell-ring',
                'unavailable': 'mdi:shield-off-outline'
            },
            'door': {
                'open': 'mdi:door-open',
                'closed': 'mdi:door-closed',
                'unavailable': 'mdi:door'
            },
            'garage_door': {
                'open': 'mdi:garage-open',
                'closed': 'mdi:garage',
                'opening': 'mdi:garage-alert',
                'closing': 'mdi:garage-alert',
                'unavailable': 'mdi:garage-variant'
            },
            'window': {
                'open': 'mdi:window-open-variant',
                'closed': 'mdi:window-closed-variant',
                'unavailable': 'mdi:window-closed'
            }
        };

        // Check for state-specific icon
        if (stateIconMap[domain] && stateIconMap[domain][state]) {
            return stateIconMap[domain][state];
        }

        // Priority 3: Static domain icons (fallback)
        const domainIconMap = {
            'alarm_control_panel': 'mdi:shield',
            'automation': 'mdi:robot',
            'binary_sensor': 'mdi:radiobox-blank',
            'calendar': 'mdi:calendar',
            'camera': 'mdi:video',
            'climate': 'mdi:thermostat',
            'counter': 'mdi:counter',
            'cover': 'mdi:window-closed',
            'device_tracker': 'mdi:account',
            'fan': 'mdi:fan',
            'group': 'mdi:google-circles-communities',
            'humidifier': 'mdi:air-humidifier',
            'input_boolean': 'mdi:toggle-switch-outline',
            'input_datetime': 'mdi:calendar-clock',
            'input_number': 'mdi:ray-vertex',
            'input_select': 'mdi:format-list-bulleted',
            'input_text': 'mdi:form-textbox',
            'light': 'mdi:lightbulb',
            'lock': 'mdi:lock',
            'media_player': 'mdi:cast',
            'person': 'mdi:account',
            'plant': 'mdi:flower',
            'remote': 'mdi:remote',
            'scene': 'mdi:palette',
            'script': 'mdi:script-text',
            'sensor': 'mdi:eye',
            'sun': 'mdi:white-balance-sunny',
            'switch': 'mdi:toggle-switch-outline',
            'timer': 'mdi:timer-outline',
            'vacuum': 'mdi:robot-vacuum',
            'water_heater': 'mdi:thermometer',
            'weather': 'mdi:weather-cloudy',
            'zone': 'mdi:map-marker-radius'
        };

        if (domainIconMap[domain]) {
            return domainIconMap[domain];
        }

        // Final fallback
        return 'mdi:bookmark';
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
            lcardsLog.warn(`[LCARdSCard] Theme token fetch failed:`, error);
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
        // Try singletons first, then fall back to global core
        const core = window.lcards?.core;
        const stylePresetManager = this._singletons?.stylePresetManager || core?.getStylePresetManager?.();
        const themeManager = this._singletons?.themeManager || core?.getThemeManager?.();

        if (!stylePresetManager) {
            return null;
        }

        try {
            return stylePresetManager.getPreset(
                overlayType,
                presetName,
                themeManager
            );
        } catch (error) {
            lcardsLog.warn(`[LCARdSCard] Preset fetch failed:`, error);
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
     * Check if a nested value exists at a path
     * Useful for checking theme token paths before applying styles
     *
     * @param {Object} obj - Object to check
     * @param {string} path - Dot-notation path (e.g., 'card.color.background')
     * @param {string} finalKey - Final key to check (e.g., 'active', 'inactive')
     * @returns {boolean} True if the nested path and final key exist
     * @protected
     *
     * @example
     * const style = { card: { color: { background: { active: '#fff' } } } };
     * this._hasNestedValue(style, 'card.color.background', 'active'); // true
     * this._hasNestedValue(style, 'card.color.background', 'hover'); // false
     */
    _hasNestedValue(obj, path, finalKey) {
        const parts = path.split('.');
        let current = obj;

        for (const part of parts) {
            if (!current || typeof current !== 'object' || !(part in current)) {
                return false;
            }
            current = current[part];
        }

        // Check if finalKey exists in the final object
        return current && typeof current === 'object' && finalKey in current;
    }

    /**
     * Classify entity state into standardized categories
     * Useful for determining which theme colors/styles to apply
     *
     * @param {Object} entity - Entity state object (optional, uses card's entity if not provided)
     * @returns {string} State classification: 'active', 'inactive', 'unavailable', or 'default'
     * @protected
     *
     * @example
     * const state = this._classifyEntityState(this._entity);
     * const color = this.getThemeToken(`colors.button.${state}`);
     */
    _classifyEntityState(entity = null) {
        const targetEntity = entity || this._entity;

        if (!targetEntity) {
            // Cards without entities use the 'default' state
            // (falls back to 'active' in theme defaults if 'default' not specified)
            return 'default';
        }

        const state = targetEntity.state;

        // Unavailable is universal
        if (state === 'unavailable' || state === 'unknown') {
            return 'unavailable';
        }

        // Active states (ON, locked, open, home, playing, etc.)
        if (state === 'on' || state === 'locked' || state === 'open' ||
            state === 'home' || state === 'playing' || state === 'active') {
            return 'active';
        }

        // Inactive states (OFF, unlocked, closed, etc.)
        return 'inactive';
    }

    /**
     * Get entity state
     *
     * Uses CoreSystemsManager for cached entity access when available,
     * falls back to direct HASS access for backwards compatibility.
     *
     * @param {string} entityId - Entity ID (optional, defaults to card's entity)
     * @returns {Object|null} Entity state or null
     */
    getEntityState(entityId = null) {
        const id = entityId || this.config.entity;
        if (!id) {
            return null;
        }

        // Use CoreSystemsManager for cached access (preferred)
        if (this._singletons?.systemsManager) {
            return this._singletons.systemsManager.getEntityState(id);
        }

        // Fallback to direct HASS access (backwards compatibility)
        if (this.hass) {
            return this.hass.states[id] || null;
        }

        return null;
    }

    /**
     * Subscribe to entity state changes
     *
     * Uses CoreSystemsManager's subscription system for efficient change notifications.
     * Automatically tracks subscriptions for cleanup on card destroy.
     *
     * @param {string} entityId - Entity to monitor
     * @param {Function} callback - Called on change: callback(entityId, newState, oldState)
     * @returns {Function} Unsubscribe function
     *
     * @example
     * // Subscribe to temperature sensor
     * const unsubscribe = this.subscribeToEntity('sensor.temperature', (id, newState, oldState) => {
     *   console.log('Temperature changed from', oldState.state, 'to', newState.state);
     *   this.requestUpdate();
     * });
     *
     * // Later, unsubscribe
     * unsubscribe();
     */
    subscribeToEntity(entityId, callback) {
        if (!entityId || typeof callback !== 'function') {
            lcardsLog.warn('[LCARdSCard] Invalid entityId or callback for subscription');
            return () => {}; // No-op unsubscribe
        }

        if (!this._singletons?.systemsManager) {
            lcardsLog.warn('[LCARdSCard] CoreSystemsManager not available for subscription');
            return () => {}; // No-op unsubscribe
        }

        // Initialize subscription tracking if needed
        if (!this._entitySubscriptions) {
            this._entitySubscriptions = new Set();
        }

        // Subscribe via CoreSystemsManager
        const unsubscribe = this._singletons.systemsManager.subscribeToEntity(
            entityId,
            callback
        );

        // Track subscription for automatic cleanup
        this._entitySubscriptions.add(unsubscribe);

        lcardsLog.debug(`[LCARdSCard] Subscribed to entity: ${entityId} (card: ${this._cardGuid})`);

        // Return unsubscribe function
        return () => {
            this._entitySubscriptions.delete(unsubscribe);
            unsubscribe();
        };
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
            lcardsLog.warn(`[LCARdSCard] Cannot call service - no HASS instance`);
            return;
        }

        try {
            await this.hass.callService(domain, service, data);
            lcardsLog.debug(`[LCARdSCard] Called service ${domain}.${service}`, data);
        } catch (error) {
            lcardsLog.error(`[LCARdSCard] Service call failed:`, error);
        }
    }

    // ============================================================================
    // ACTION SYSTEM - Unified action handler
    // ============================================================================

    /**
     * Setup action handlers on element with full animation support
     *
     * Delegates to unified LCARdSActionHandler for consistent behavior
     * across all card types.
     *
     * @param {HTMLElement} element - Target element (must be in shadow DOM)
     * @param {Object} actions - Action configurations (tap_action, hold_action, double_tap_action)
     * @param {Object} options - Additional options
     * @param {Object} options.animationManager - AnimationManager instance for triggering animations
     * @param {string} options.elementId - Element ID for animation targeting
     * @returns {Function} Cleanup function
     */
    setupActions(element, actions = {}, options = {}) {
        if (!element) {
            return () => {};
        }

        // Prepare options for unified action handler
        const actionOptions = {
            ...options,
            animations: this.config.animations,
            getAnimationSetup: () => this._getAnimationSetup(),
            shadowRoot: this.shadowRoot,
            entity: this.config.entity // Pass card's entity as default for actions
        };

        // Delegate to unified action handler
        return this._actionHandler.setupActions(
            element,
            actions,
            this.hass,
            actionOptions
        );
    }

    /**
     * Hook for subclasses to provide animation-specific setup
     * @returns {Object} Animation setup configuration
     * @protected
     */
    _getAnimationSetup() {
        // Default implementation - subclasses should override
        return {
            overlayId: `lcards-card-${this._cardGuid}`,
            elementSelector: '[data-overlay-id]'
        };
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
                <div class="lcards-card-container">
                    <div class="lcards-card-loading">
                        Initializing...
                    </div>
                </div>
            `;
        }

        // Subclasses must implement this
        return html`
            <div class="lcards-card-container">
                <div class="lcards-card-error">
                    Subclass must implement _renderCard()
                </div>
            </div>
        `;
    }

    // ============================================================================
    // LIFECYCLE HOOKS
    // ============================================================================

    /**
     * Called when disconnected from DOM
     * @protected
     */
    /**
     * Lifecycle hook - card disconnected from DOM
     * @protected
     */
    _onDisconnected() {
        // Cleanup rules integration
        this._unregisterOverlayFromRules();

        // Cleanup entity subscriptions
        if (this._entitySubscriptions) {
            this._entitySubscriptions.forEach(unsubscribe => {
                try {
                    unsubscribe();
                } catch (error) {
                    lcardsLog.error('[LCARdSCard] Error unsubscribing from entity:', error);
                }
            });
            this._entitySubscriptions.clear();
            lcardsLog.debug(`[LCARdSCard] Cleaned up entity subscriptions for ${this._cardGuid}`);
        }

        // Unregister from CoreSystemsManager
        if (this._singletons?.systemsManager && this._cardGuid) {
            try {
                this._singletons.systemsManager.unregisterCard(this._cardGuid);
                lcardsLog.debug(`[LCARdSCard] Unregistered from CoreSystemsManager: ${this._cardGuid}`);
            } catch (error) {
                lcardsLog.error('[LCARdSCard] Error unregistering from CoreSystemsManager:', error);
            }
        }

        // Action handler cleanup is handled by setupActions() cleanup function

        super._onDisconnected();
    }

    /**
     * Update light color CSS variable for "Match Light Colour" feature
     * Exports --lcards-light-color-{cardGuid} variable with entity's current color
     * @protected
     */
    _updateLightColorVariable() {
        if (!this._entity || !this.config.entity) {
            return;
        }

        // Only process light entities
        if (!this.config.entity.startsWith('light.')) {
            return;
        }

        const varName = `--lcards-light-color-${this._cardGuid}`;

        // Check if light is on
        if (this._entity.state !== 'on') {
            // Light is off, remove variable or set to default
            document.documentElement.style.removeProperty(varName);
            return;
        }

        // Get color from entity attributes
        let color = null;

        // Try RGB color first
        if (this._entity.attributes.rgb_color) {
            const [r, g, b] = this._entity.attributes.rgb_color;
            color = `rgb(${r}, ${g}, ${b})`;
        }
        // Try HS color
        else if (this._entity.attributes.hs_color) {
            const [h, s] = this._entity.attributes.hs_color;
            // Convert HS to RGB (simplified conversion)
            const rgb = this._hsToRgb(h, s, this._entity.attributes.brightness || 255);
            color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
        }
        // Try color temp
        else if (this._entity.attributes.color_temp) {
            // For color temp, use a default warm white
            // More sophisticated conversion could be added
            color = '#ffd89b';
        }

        // Apply brightness if available
        if (color && this._entity.attributes.brightness) {
            const brightness = this._entity.attributes.brightness / 255;
            // Adjust color brightness
            color = ColorUtils.alpha(color, brightness);
        }

        // Set the CSS variable
        if (color) {
            document.documentElement.style.setProperty(varName, color);
            lcardsLog.trace(`[LCARdSCard] Set light color variable ${varName} = ${color}`);
        }
    }

    /**
     * Cleanup light color CSS variable
     * @protected
     */
    _cleanupLightColorVariable() {
        if (this._cardGuid) {
            const varName = `--lcards-light-color-${this._cardGuid}`;
            document.documentElement.style.removeProperty(varName);
            lcardsLog.trace(`[LCARdSCard] Cleaned up light color variable ${varName}`);
        }
    }

    /**
     * Convert HS color to RGB
     * @param {number} h - Hue (0-360)
     * @param {number} s - Saturation (0-100)
     * @param {number} brightness - Brightness (0-255)
     * @returns {Array<number>} [r, g, b]
     * @private
     */
    _hsToRgb(h, s, brightness = 255) {
        h = h / 360;
        s = s / 100;
        const v = brightness / 255;

        let r, g, b;

        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);

        switch (i % 6) {
            case 0: r = v; g = t; b = p; break;
            case 1: r = q; g = v; b = p; break;
            case 2: r = p; g = v; b = t; break;
            case 3: r = p; g = q; b = v; break;
            case 4: r = t; g = p; b = v; break;
            case 5: r = v; g = p; b = q; break;
        }

        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255)
        ];
    }
}