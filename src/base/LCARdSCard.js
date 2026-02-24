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
import { ProvenanceTracker } from '../utils/provenance-tracker.js';
import { escapeXmlAttribute } from '../utils/lcards-svg-helpers.js';
import { resolveStateColor } from '../utils/state-color-resolver.js';

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
                    color: var(--primary-text-color, var(--lcards-moonlight, #d3d3d3));
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

        // Unified provenance tracker
        this._provenanceTracker = new ProvenanceTracker(this._cardGuid);

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
        this._datasourceSubscriptions = new Map(); // Track datasource subscriptions (sourceId -> unsubscribe function)

        lcardsLog.trace(`[LCARdSCard] Constructor called for ${this._getDisplayId()}`);
    }

    /**
     * Called when element is added to DOM
     * @override
     */
    connectedCallback() {
        super.connectedCallback();

        // CRITICAL FIX: Set --ha-card-border-width globally if not already set
        // This prevents infinite resize loops in the card picker when theme is not loaded
        // The theme normally sets this, but without it, HA's card infrastructure
        // causes layout instability due to undefined border width calculations
        if (!getComputedStyle(document.documentElement).getPropertyValue('--ha-card-border-width').trim()) {
            document.documentElement.style.setProperty('--ha-card-border-width', '0px');
            lcardsLog.debug('[LCARdSCard] Set global --ha-card-border-width to prevent resize loops');
        }
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

            // Track provenance in unified tracker
            if (this._provenanceTracker && result.provenance) {
                this._provenanceTracker.trackConfig(result.provenance);
            }

            lcardsLog.trace(`[LCARdSCard] Config processed`, {
                valid: result.valid,
                hasProvenance: !!result.provenance,
                mergeOrder: result.provenance?.merge_order
            });

            // Update with processed config if valid
            if (result.valid && result.mergedConfig) {
                lcardsLog.trace(`[LCARdSCard] Updating config with merged result`, {
                    hasMergedConfig: !!result.mergedConfig,
                    hasProvenanceInMerged: !!result.mergedConfig.__provenance,
                    mergedConfigKeys: Object.keys(result.mergedConfig),
                    cardType: this.constructor.CARD_TYPE
                });

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
            cardId: this._getDisplayId()
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
                        this._getDisplayId(),  // Pass card identifier (uses config.id if available)
                        false            // Not auto-created (explicit config)
                    );

                    // Track this datasource for cleanup
                    this._registeredDataSources.add(name);

                    // Subscribe to datasource for real-time template updates
                    const unsubscribe = source.subscribe((data) => {
                        lcardsLog.trace(`[LCARdSCard] DataSource ${name} updated, re-evaluating templates`, {
                            value: data.v,
                            cardId: this._getDisplayId()
                        });
                        // Re-process custom templates when datasource data changes (if card implements it)
                        if (typeof this._processCustomTemplates === 'function') {
                            this._processCustomTemplates();
                        }
                    });

                    // Track subscription for cleanup
                    if (!this._datasourceSubscriptions) {
                        this._datasourceSubscriptions = new Map();
                    }
                    this._datasourceSubscriptions.set(name, unsubscribe);

                    lcardsLog.debug(`[LCARdSCard] Created DataSource '${name}'`, {
                        entity: config.entity,
                        hasHistory: !!config.history,
                        windowSeconds: config.window_seconds,
                        cardId: this._getDisplayId()
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
     * Extract datasource references from config and register card as dependent
     * This enables tracking which cards consume which datasources via templates
     * AND subscribes to those datasources for real-time template updates
     * @private
     */
    async _registerTemplateDatasourceDependencies() {
        const dataSourceManager = this._singletons?.dataSourceManager;
        if (!dataSourceManager) {
            return;
        }

        // Extract all datasource references from config
        const datasourceRefs = this._extractDatasourceReferences(this.config);

        if (datasourceRefs.size === 0) {
            return;
        }

        lcardsLog.debug(`[LCARdSCard] Found ${datasourceRefs.size} datasource references in templates`, {
            cardId: this._getDisplayId(),
            datasources: Array.from(datasourceRefs)
        });

        // Register this card as a dependent for each datasource it references
        // AND subscribe for real-time updates
        for (const sourceId of datasourceRefs) {
            // Try to get datasource with retry logic (datasources might be initializing)
            const source = await this._waitForDatasource(sourceId, 5000); // 5 second timeout

            if (source) {
                // Add card to tracking (createDataSource handles both new and existing sources)
                // Pass null config since source already exists, just tracking the dependency
                try {
                    await dataSourceManager.createDataSource(
                        sourceId,
                        source.cfg, // Use existing config
                        this._getDisplayId(), // Card ID
                        false // Not auto-created
                    );
                } catch (error) {
                    lcardsLog.warn(`[LCARdSCard] Failed to register as dependent of datasource ${sourceId}:`, error);
                }

                // Track for cleanup
                if (!this._registeredDataSources) {
                    this._registeredDataSources = new Set();
                }
                this._registeredDataSources.add(sourceId);

                // NEW: Subscribe to datasource for real-time template updates
                if (!this._datasourceSubscriptions.has(sourceId)) {
                    const unsubscribe = source.subscribe((data) => {
                        lcardsLog.trace(`[LCARdSCard] Datasource ${sourceId} updated, triggering template re-evaluation`, {
                            cardId: this._getDisplayId(),
                            value: data.v,
                            timestamp: data.t
                        });

                        // Trigger template re-evaluation when datasource changes
                        this._scheduleTemplateUpdate();
                    });

                    this._datasourceSubscriptions.set(sourceId, unsubscribe);

                    lcardsLog.debug(`[LCARdSCard] Subscribed to datasource ${sourceId} for real-time template updates`, {
                        cardId: this._getDisplayId()
                    });
                }

                lcardsLog.debug(`[LCARdSCard] Registered card ${this._getDisplayId()} as dependent of datasource ${sourceId}`);
            } else {
                lcardsLog.warn(`[LCARdSCard] Datasource ${sourceId} referenced in template but not found in DataSourceManager after timeout`, {
                    cardId: this._getDisplayId()
                });
            }
        }
    }

    /**
     * Wait for a datasource to become available (with retry logic)
     * @param {string} sourceId - Datasource ID to wait for
     * @param {number} timeoutMs - Maximum time to wait in milliseconds
     * @returns {Promise<Object|null>} DataSource instance or null if timeout
     * @private
     */
    async _waitForDatasource(sourceId, timeoutMs = 5000) {
        const dataSourceManager = this._singletons?.dataSourceManager;
        if (!dataSourceManager) {
            return null;
        }

        const startTime = Date.now();
        const checkInterval = 100; // Check every 100ms

        while (Date.now() - startTime < timeoutMs) {
            const source = dataSourceManager.getSource(sourceId);
            if (source) {
                lcardsLog.trace(`[LCARdSCard] Datasource ${sourceId} found after ${Date.now() - startTime}ms`, {
                    cardId: this._getDisplayId()
                });
                return source;
            }

            // Wait before next check
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        return null;
    }

    /**
     * Recursively extract datasource references from config object
     * Looks for {datasource:name}, {ds:name}, and {name} patterns in string values
     * @param {*} obj - Config object or value to scan
     * @param {Set<string>} refs - Accumulated datasource references
     * @returns {Set<string>} Set of datasource IDs referenced
     * @private
     */
    _extractDatasourceReferences(obj, refs = new Set()) {
        if (!obj) return refs;

        if (typeof obj === 'string') {
            // Match {datasource:name} or {ds:name}
            const explicitMatches = obj.matchAll(/\{(?:datasource|ds):([^}:.]+)(?:[:.][^}]*)?\}/g);
            for (const match of explicitMatches) {
                refs.add(match[1]);
            }

            // Match legacy {name} syntax (but avoid false positives like {entity.state})
            // Only consider it a datasource if it doesn't have a dot (which would be a token)
            const legacyMatches = obj.matchAll(/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g);
            for (const match of legacyMatches) {
                const ref = match[1];
                // Skip if it looks like a token (entity, config, variables, etc.)
                if (!['entity', 'config', 'variables', 'hass', 'theme'].includes(ref)) {
                    refs.add(ref);
                }
            }
        } else if (Array.isArray(obj)) {
            obj.forEach(item => this._extractDatasourceReferences(item, refs));
        } else if (typeof obj === 'object') {
            Object.values(obj).forEach(value => this._extractDatasourceReferences(value, refs));
        }

        return refs;
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

        // Register datasource dependencies from templates if singletons ready
        if (this._singletons?.dataSourceManager) {
            this._registerTemplateDatasourceDependencies();
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

        // Now that singletons are initialized, register datasource dependencies from templates
        if (this._singletons?.dataSourceManager && this.config) {
            this._registerTemplateDatasourceDependencies();
        }

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

                // Update stored size
                this._containerSize = { width, height };

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

            // Register this card with LCARdSCore (populates _cardInstances and delegates to SystemsManager)
            if (core && this._cardGuid) {
                // registerCard returns a Promise for pending-queue cards; resolve and store context
                Promise.resolve(core.registerCard(this._cardGuid, this, this.config))
                    .then(ctx => {
                        this._cardContext = ctx;
                        lcardsLog.trace(`[LCARdSCard] Registered with LCARdSCore: ${this._cardGuid}`);
                    })
                    .catch(err => {
                        lcardsLog.error(`[LCARdSCard] Failed to register with LCARdSCore: ${this._cardGuid}`, err);
                    });
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
    _registerOverlayForRules(overlayId, type, tags = []) {
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
            type: type,
            tags: this._overlayTags,
            sourceCardId: this._cardGuid
        });

        // Register callback with RulesEngine (SINGLE callback per card)
        // Callback evaluates rules and applies relevant patches
        const callback = async () => {
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
        };

        this._singletons.rulesEngine.setReEvaluationCallback(callback);
        this._rulesCallback = callback; // Store function reference for cleanup

        this._overlayRegistered = true;

        lcardsLog.debug(`[LCARdSCard] Registered overlay for rules: ${this._overlayId}`, {
            tags: this._overlayTags,
            cardGuid: this._cardGuid
        });

        // Trigger initial rule evaluation if HASS is already available
        // This ensures rules are applied even if the light is already ON during page load
        if (this.hass) {
            lcardsLog.trace(`[LCARdSCard] HASS available, triggering initial rule evaluation for ${this._overlayId}`);
            this._singletons.rulesEngine.markAllDirty();
            // Trigger the callback we just registered
            if (this._rulesCallback) {
                this._rulesCallback();
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
        if (this._rulesCallback && this._singletons?.rulesEngine) {
            this._singletons.rulesEngine.removeReEvaluationCallback(this._rulesCallback);
            this._rulesCallback = null;
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

        // Skip warning if no overlayId - some cards (like MSD) override this method entirely
        if (!overlayPatches) {
            return;
        }

        if (!this._overlayId) {
            // Card doesn't use single overlay ID (e.g., MSD with multiple overlays)
            // This is expected if the card overrides _applyRulePatches()
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

        // Track rule patches in provenance tracker
        if (this._provenanceTracker) {
            // Get rulesEngine - try singletons first, fallback to global
            const rulesEngine = this._singletons?.rulesEngine || window.lcards?.core?.rulesManager;

            lcardsLog.debug(`[LCARdSCard] 🔍 Starting rule patch tracking for ${this._overlayId}`, {
                hasRulesEngine: !!rulesEngine,
                hasTrackMethod: !!(rulesEngine && rulesEngine.trackRulePatch),
                mergedPatchKeys: Object.keys(mergedPatch),
                myPatchesCount: myPatches.length,
                source: this._singletons?.rulesEngine ? 'singletons' : 'global',
                firstPatch: myPatches[0] // Show first patch structure
            });

            // Helper to recursively track patches for all fields
            const trackPatchesRecursive = (patchObj, configObj, pathPrefix = '') => {
                if (!patchObj || typeof patchObj !== 'object') return;

                for (const [key, value] of Object.entries(patchObj)) {
                    // Skip metadata fields
                    if (key === 'id' || key === 'ruleId' || key === 'ruleCondition') continue;

                    const fieldPath = pathPrefix ? `${pathPrefix}.${key}` : key;
                    const originalValue = configObj?.[key];

                    // If value is an object, recurse
                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        trackPatchesRecursive(value, originalValue || {}, fieldPath);
                    } else {
                        // Track this field patch
                        // Get rule info from patches (first patch that has this field)
                        const rulePatch = myPatches.find(p => {
                            // Navigate to the nested property to check if it exists
                            const parts = fieldPath.split('.');
                            let obj = p;
                            for (const part of parts) {
                                if (!obj || typeof obj !== 'object') return false;
                                obj = obj[part];
                            }
                            return obj !== undefined;
                        });

                        const ruleId = rulePatch?.ruleId || 'unknown';
                        const ruleCondition = rulePatch?.ruleCondition || 'unknown condition';

                        lcardsLog.debug(`[LCARdSCard] 📝 Tracking patch: ${fieldPath}`, {
                            ruleId,
                            originalValue,
                            newValue: value,
                            foundRulePatch: !!rulePatch
                        });

                        // Track the patch
                        if (rulesEngine && rulesEngine.trackRulePatch) {
                            rulesEngine.trackRulePatch(
                                fieldPath,
                                originalValue,
                                value,
                                ruleId,
                                ruleCondition,
                                this._provenanceTracker
                            );
                        } else {
                            lcardsLog.warn('[LCARdSCard] ⚠️ Cannot track patch - no rulesEngine.trackRulePatch method');
                        }
                    }
                }
            };

            // Track all patched fields (not just style)
            trackPatchesRecursive(mergedPatch, this.config);
        }

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
            const dataSourceManager = window.lcards?.core?.dataSourceManager;

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
            // This enables datasource access: {datasource:sensor_temp}
            const evaluator = new UnifiedTemplateEvaluator({
                hass: this.hass,
                context: context,
                dataSourceManager: dataSourceManager
            });

            // Use async evaluation to support all template types (JavaScript, Tokens, Datasources, Jinja2)
            const result = await evaluator.evaluateAsync(template);

            // Track template provenance
            if (this._provenanceTracker) {
                // Extract dependencies from evaluator if available
                const dependencies = [];
                if (this._entity?.entity_id) {
                    dependencies.push(this._entity.entity_id);
                }

                // Determine processor type
                let processor = 'unknown';
                if (template.includes('{%') || template.includes('{{')) {
                    processor = 'jinja2';
                } else if (template.includes('[[[')) {
                    processor = 'javascript';
                } else if (template.includes('{datasource:') || template.includes('{ds:')) {
                    processor = 'datasource';
                }

                // Generate a simple hash for field ID to avoid collisions
                // Use template + timestamp for uniqueness
                let hash = 0;
                for (let i = 0; i < template.length; i++) {
                    hash = ((hash << 5) - hash) + template.charCodeAt(i);
                    hash = hash & hash; // Convert to 32-bit integer
                }
                const fieldId = `template_${Math.abs(hash)}`;

                this._provenanceTracker.trackTemplate(
                    fieldId,
                    template,
                    result,
                    dependencies,
                    processor
                );
            }

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
            const dataSourceManager = window.lcards?.core?.dataSourceManager;

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
     * Base implementation tracks primary entity, animation trigger entities, and rule entities.
     * Subclasses should override to add their specific template sources.
     * @private
     */
    _updateTrackedEntities() {
        const trackedEntities = new Set();

        // Add primary entity
        if (this.config.entity) {
            trackedEntities.add(this.config.entity);
        }

        // Add animation trigger entities (for on_entity_change animations)
        if (this.config.animations && Array.isArray(this.config.animations)) {
            this.config.animations.forEach(anim => {
                if (anim.trigger === 'on_entity_change' && anim.entity) {
                    trackedEntities.add(anim.entity);
                }
            });
        }

        // Add rule condition entities
        if (this.config.rules && Array.isArray(this.config.rules)) {
            this.config.rules.forEach(rule => {
                if (rule.when && rule.when.entity) {
                    trackedEntities.add(rule.when.entity);
                }
                // Also check for 'all' and 'any' compound conditions
                if (rule.when && rule.when.all && Array.isArray(rule.when.all)) {
                    rule.when.all.forEach(cond => {
                        if (cond.entity) trackedEntities.add(cond.entity);
                    });
                }
                if (rule.when && rule.when.any && Array.isArray(rule.when.any)) {
                    rule.when.any.forEach(cond => {
                        if (cond.entity) trackedEntities.add(cond.entity);
                    });
                }
            });
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
     * Automatically tracks token resolution in provenance for debugging.
     *
     * @param {string} tokenPath - Dot-notation path (e.g., 'colors.accent.primary')
     * @param {*} fallback - Fallback value if token not found
     * @param {string|string[]} usedByField - Field(s) using this token (for provenance)
     * @returns {*} Token value or fallback
     */
    getThemeToken(tokenPath, fallback = null, usedByField = null) {
        if (!this._singletons?.themeManager) {
            return fallback;
        }

        try {
            const value = this._singletons.themeManager.getToken(tokenPath, fallback);

            // Automatically track token resolution in provenance
            if (this._provenanceTracker && value !== fallback) {
                const originalRef = `theme:${tokenPath}`;
                const resolutionChain = [{
                    step: 'token_lookup',
                    value: value,
                    source: 'theme.tokens',
                    themeId: this._singletons.themeManager.activeThemeId
                }];

                // Normalize usedByField to array
                const usedByFields = usedByField
                    ? (Array.isArray(usedByField) ? usedByField : [usedByField])
                    : [];

                this._provenanceTracker.trackThemeToken(
                    tokenPath,
                    originalRef,
                    value,
                    resolutionChain,
                    usedByFields
                );

                lcardsLog.trace(`[LCARdSCard] Tracked theme token: ${tokenPath}`, {
                    value,
                    usedByFields
                });
            }

            return value;
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
     * Enhanced to support more domains and state patterns.
     * Alias: _getButtonState() for backward compatibility
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

        // Unavailable/Unknown is universal
        if (state === 'unavailable' || state === 'unknown') {
            return 'unavailable';
        }

        // Comprehensive active states across all HA domains
        const activeStates = [
            'on', 'open', 'playing', 'home', 'heat', 'cool', 'auto',
            'fan_only', 'dry', 'locked', 'armed_home', 'armed_away',
            'armed_night', 'armed_vacation', 'armed_custom_bypass',
            'cleaning', 'mowing', 'docked', 'returning', 'paused',
            'active', 'above_horizon'
        ];

        if (activeStates.includes(state)) {
            return 'active';
        }

        // Inactive states (OFF, unlocked, closed, idle, etc.)
        return 'inactive';
    }

    /**
     * Alias for _classifyEntityState() for backward compatibility
     * Used by button, elbow, and slider cards
     * @returns {string} State classification
     * @protected
     */
    _getButtonState() {
        return this._classifyEntityState();
    }

    // ============================================================================
    // STATE-BASED COLOR RESOLUTION
    // ============================================================================

    /**
     * Resolve state-based color with entity context
     * Wrapper around resolveStateColor utility that automatically provides
     * entity state and classification
     *
     * @param {Object|string} colorConfig - Color config (state object or plain string)
     * @param {string} fallback - Fallback color if not resolved
     * @returns {string|null} Resolved color value
     * @protected
     *
     * @example
     * // Resolve background color based on entity state
     * const bgColor = this._resolveEntityStateColor(
     *     this._buttonStyle?.card?.color?.background,
     *     'var(--lcars-orange, #FF9900)'
     * );
     */
    _resolveEntityStateColor(colorConfig, fallback = null) {
        const actualEntityState = this._entity?.state;
        const classifiedState = this._getButtonState();

        return resolveStateColor({
            actualState: actualEntityState,
            classifiedState: classifiedState,
            colorConfig: colorConfig,
            fallback: fallback
        });
    }

    /**
     * Resolve theme token to concrete value
     * Handles theme: prefix resolution
     *
     * @param {string} value - Value to resolve (may be theme token or plain value)
     * @returns {string} Resolved value
     * @protected
     */
    _resolveThemeToken(value) {
        if (!value || typeof value !== 'string') {
            return value;
        }

        // Check if it's a theme token
        if (value.startsWith('theme:')) {
            const tokenPath = value.replace('theme:', '');
            return this.getThemeToken(tokenPath, value);
        }

        return value;
    }

    // ============================================================================
    // INTERACTION STATES (hover/pressed)
    // ============================================================================

    /**
     * Extract interaction style colors (hover/pressed) from resolved style
     * Resolves theme tokens and returns ready-to-use color values
     *
     * @param {Object} resolvedStyle - Fully resolved style object
     * @returns {Object} { hover: { backgroundColor }, pressed: { backgroundColor } }
     * @protected
     *
     * @example
     * const { hover, pressed } = this._extractInteractionStyles(this._buttonStyle);
     * if (hover) {
     *     // Setup hover interactions
     * }
     */
    _extractInteractionStyles(resolvedStyle) {
        if (!resolvedStyle) {
            return { hover: null, pressed: null };
        }

        // Extract hover color from style.card.color.background.hover
        const hoverColor = resolvedStyle.card?.color?.background?.hover;

        // Extract pressed color from style.card.color.background.pressed
        const pressedColor = resolvedStyle.card?.color?.background?.pressed;

        return {
            hover: hoverColor ? {
                backgroundColor: this._resolveThemeToken(hoverColor)
            } : null,
            pressed: pressedColor ? {
                backgroundColor: this._resolveThemeToken(pressedColor)
            } : null
        };
    }

    /**
     * Setup interaction state listeners (hover/pressed/leave)
     * Attaches mouse/touch event listeners to element for visual feedback
     *
     * Returns cleanup function to remove all listeners
     *
     * @param {HTMLElement} targetElement - Element to attach listeners to (e.g., .button-bg)
     * @param {Object} options - Configuration options
     * @param {Object} options.hoverStyle - Hover style object with backgroundColor
     * @param {Object} options.pressedStyle - Pressed style object with backgroundColor
     * @param {Function} options.getRestoreColor - Function that returns color to restore on leave
     * @returns {Function} Cleanup function to remove all listeners
     * @protected
     *
     * @example
     * const buttonBg = this.shadowRoot?.querySelector('.button-bg');
     * const { hover, pressed } = this._extractInteractionStyles(this._buttonStyle);
     *
     * this._interactivityCleanup = this._setupBaseInteractivity(buttonBg, {
     *     hoverStyle: hover,
     *     pressedStyle: pressed,
     *     getRestoreColor: () => this._resolveEntityStateColor(
     *         this._buttonStyle?.card?.color?.background,
     *         'var(--lcars-orange, #FF9900)'
     *     )
     * });
     */
    _setupBaseInteractivity(targetElement, { hoverStyle, pressedStyle, getRestoreColor }) {
        // Skip if no interaction styles defined
        if (!hoverStyle && !pressedStyle) {
            lcardsLog.trace('[LCARdSCard] No interaction styles defined, skipping interactivity setup');
            return () => {};
        }

        // Skip if target element not found (common during initial render cycles)
        if (!targetElement) {
            lcardsLog.trace('[LCARdSCard] Target element not found for interactivity setup (likely not rendered yet)');
            return () => {};
        }

        // Interaction state tracking
        let isHovering = false;
        let isPressed = false;

        /**
         * Apply color to target element
         * Uses style.fill for SVG elements (higher specificity than setAttribute)
         */
        const applyColor = (color) => {
            if (!targetElement || !color) {
                lcardsLog.trace('[LCARdSCard] Skipping color application', {
                    hasTarget: !!targetElement,
                    hasColor: !!color
                });
                return;
            }

            // Use style.fill for higher CSS specificity (overrides inline style="fill: ...")
            targetElement.style.fill = color;

            lcardsLog.trace('[LCARdSCard] Applied interaction color', {
                color,
                element: targetElement.className,
                tagName: targetElement.tagName
            });
        };

        // Event handlers
        const handleMouseEnter = (e) => {
            if (hoverStyle && !isPressed) {
                isHovering = true;
                lcardsLog.trace('[LCARdSCard] Applying hover style', {
                    backgroundColor: hoverStyle.backgroundColor
                });
                applyColor(hoverStyle.backgroundColor);
            }
            e.stopPropagation(); // Prevent button-level hover interference
        };

        const handleMouseLeave = (e) => {
            isHovering = false;
            if (!isPressed) {
                // Restore to current entity state color (recalculate dynamically)
                const restoreColor = getRestoreColor();
                lcardsLog.trace('[LCARdSCard] Restoring color on leave', {
                    restoreColor
                });
                applyColor(restoreColor);
            }
            e.stopPropagation();
        };

        const handleMouseDown = (e) => {
            if (pressedStyle) {
                isPressed = true;
                applyColor(pressedStyle.backgroundColor);
            }
            e.stopPropagation();
        };

        const handleMouseUp = (e) => {
            isPressed = false;
            // Return to hover or entity state
            if (isHovering && hoverStyle) {
                applyColor(hoverStyle.backgroundColor);
            } else {
                const restoreColor = getRestoreColor();
                applyColor(restoreColor);
            }
            e.stopPropagation();
        };

        // Attach listeners
        targetElement.addEventListener('mouseenter', handleMouseEnter);
        targetElement.addEventListener('mouseleave', handleMouseLeave);
        targetElement.addEventListener('mousedown', handleMouseDown);
        targetElement.addEventListener('mouseup', handleMouseUp);

        // Touch support
        targetElement.addEventListener('touchstart', handleMouseDown, { passive: true });
        targetElement.addEventListener('touchend', handleMouseUp);

        lcardsLog.debug('[LCARdSCard] Interaction listeners attached', {
            hasHover: !!hoverStyle,
            hasPressed: !!pressedStyle,
            element: targetElement.className
        });

        // Return cleanup function
        return () => {
            targetElement.removeEventListener('mouseenter', handleMouseEnter);
            targetElement.removeEventListener('mouseleave', handleMouseLeave);
            targetElement.removeEventListener('mousedown', handleMouseDown);
            targetElement.removeEventListener('mouseup', handleMouseUp);
            targetElement.removeEventListener('touchstart', handleMouseDown);
            targetElement.removeEventListener('touchend', handleMouseUp);

            lcardsLog.trace('[LCARdSCard] Interaction listeners removed');
        };
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
            callback,
            this._cardGuid
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

        // Build card-level sound overrides from config.sounds
        const sounds = this.config?.sounds ?? {};
        const CARD_SOUND_EVENTS = ['card_tap', 'card_hold', 'card_double_tap', 'card_hover'];
        const soundOverride = {};
        if (sounds.enabled === false) {
            for (const evt of CARD_SOUND_EVENTS) soundOverride[evt] = null;
        } else {
            for (const evt of CARD_SOUND_EVENTS) {
                if (evt in sounds) soundOverride[evt] = sounds[evt];
            }
        }

        // Prepare options for unified action handler
        const actionOptions = {
            ...options,
            animations: this.config.animations,
            getAnimationSetup: () => this._getAnimationSetup(),
            shadowRoot: this.shadowRoot,
            entity: this.config.entity, // Pass card's entity as default for actions
            ...(Object.keys(soundOverride).length > 0 && { soundOverride })
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

    /**
     * Play a sound for the given event type, respecting card-level sounds config.
     *
     * Resolution order:
     *   1. sounds.enabled === false  → silent (card fully muted)
     *   2. sounds[eventType]         → card-level override (null = mute, string = asset)
     *   3. Fall through to SoundManager global resolution
     *
     * Use this for direct play call sites (sliders, toggles). ActionHandler uses
     * the soundOverride option from setupActions() for tap/hold/hover events.
     *
     * @param {string} eventType - Sound event type key (e.g. 'slider_drag_start')
     * @protected
     */
    _playSound(eventType) {
        const sm = window.lcards?.core?.soundManager;
        if (!sm) return;
        const sounds = this.config?.sounds ?? {};
        if (sounds.enabled === false) return;
        if (eventType in sounds) {
            sm.play(eventType, { cardOverride: sounds[eventType] });
        } else {
            sm.play(eventType);
        }
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
     * Lifecycle hook - card disconnected from DOM
     * @protected
     */
    _onDisconnected() {
        // --- Datasource subscriptions ---
        if (this._datasourceSubscriptions && this._datasourceSubscriptions.size > 0) {
            this._datasourceSubscriptions.forEach((unsubscribe, sourceId) => {
                try {
                    unsubscribe();
                    lcardsLog.trace(`[LCARdSCard] Unsubscribed from datasource ${sourceId}`, {
                        cardId: this._getDisplayId()
                    });
                } catch (error) {
                    lcardsLog.warn(`[LCARdSCard] Error unsubscribing from datasource ${sourceId}:`, error);
                }
            });
            this._datasourceSubscriptions.clear();
        }

        // --- Datasource tracking ---
        if (this._singletons?.dataSourceManager && this._registeredDataSources) {
            this._registeredDataSources.forEach(sourceName => {
                this._singletons.dataSourceManager.removeCardFromSource(
                    sourceName,
                    this._getDisplayId()
                );
            });
            this._registeredDataSources.clear();
        }

        // --- Entity subscriptions ---
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

        // --- Rules / overlay ---
        this._unregisterOverlayFromRules();

        // --- Light color CSS variable ---
        this._cleanupLightColorVariable();

        // --- Resize observer ---
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
            this._resizeObserver = null;
        }

        // --- Core unregister (handles _cardInstances, _cardLoadOrder, SystemsManager) ---
        const core = window.lcards?.core;
        if (core && this._cardGuid) {
            try {
                core.unregisterCard(this._cardGuid);
                lcardsLog.debug(`[LCARdSCard] Unregistered from LCARdSCore: ${this._cardGuid}`);
            } catch (error) {
                lcardsLog.error('[LCARdSCard] Error unregistering from LCARdSCore:', error);
            }
        }

        // Action handler cleanup is handled by setupActions() cleanup function

        lcardsLog.trace(`[LCARdSCard] Disconnected and cleaned up: ${this._getDisplayId()}`);

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
        return ColorUtils.hsToRgb(h, s, brightness);
    }

    // ============================================================================
    // PROVENANCE API - Public methods for debugging and troubleshooting
    // ============================================================================

    /**
     * Get provenance data for debugging
     *
     * Returns information about where configuration values, styles, and
     * resolved settings originated from (defaults, presets, user overrides,
     * rules, theme tokens, etc.)
     *
     * @param {string} [path] - Optional path to specific provenance data
     * @returns {any} Provenance data (full or at path)
     *
     * @example
     * // From browser console:
     * const card = document.querySelector('lcards-button');
     *
     * // Get all provenance
     * card.getProvenance();
     *
     * // Get config provenance
     * card.getProvenance('config');
     *
     * // Get specific field source
     * card.getProvenance('config.field_sources.style.color');
     */
    getProvenance(path = null) {
        if (!this._provenanceTracker) {
            lcardsLog.warn(`[LCARdSCard] Provenance tracker not initialized`);
            return null;
        }
        return this._provenanceTracker.getProvenance(path);
    }

    /**
     * Get pretty-printed debug output of provenance information
     *
     * Prints formatted provenance data to console for easy troubleshooting.
     * Shows config merge order, field sources, theme tokens, rule patches,
     * and template processing information.
     *
     * @returns {string} Formatted provenance information
     *
     * @example
     * // From browser console:
     * const card = document.querySelector('lcards-button');
     * console.log(card.debugProvenance());
     *
     * // Output:
     * // 🔍 Provenance for button-abc123
     * //   📦 Config Merge Order
     * //     ['card_defaults', 'theme_defaults', 'preset_lozenge', 'user_config']
     * //   📋 Field Sources (Sample)
     * //     style.color: user_config
     * //     style.borderRadius: preset_lozenge
    /**
     * Get pretty-printed debug output of provenance information
     *
     * Prints formatted provenance data to console for easy troubleshooting.
     * Shows config merge order, field sources, theme tokens, rule patches,
     * and template processing information.
     *
     * @param {boolean} [toConsole=true] - If true, outputs directly to console with collapsible groups
     * @returns {string|undefined} Formatted string if toConsole=false, undefined otherwise
     *
     * @example
     * // From browser console (NEW - outputs directly with collapsible groups):
     * const card = document.querySelector('lcards-button');
     * card.debugProvenance(); // or card.debugProvenance(true)
     *
     * // Legacy string output (for backwards compatibility):
     * console.log(card.debugProvenance(false));
     *
     * // Output to console shows collapsible groups:
     * // 🔍 Provenance for button-abc123
     * //   ▶ 📦 Config Merge Order
     * //   ▶ 📋 Field Sources (45 total)
     * //       ▶ card_defaults (20 fields)
     * //       ▶ preset_dpad (15 fields)
     * //       ▶ user_config (10 fields)
     * //   ▶ 🎨 Theme Tokens (3)
     * //   ▶ ⚙️ Rule Patches (2)
     */
    debugProvenance(toConsole = true) {
        if (!this._provenanceTracker) {
            lcardsLog.warn(`[LCARdSCard] Provenance tracker not initialized`);
            if (toConsole) {
                console.warn('Provenance tracker not initialized');
                return;
            }
            return 'Provenance tracker not initialized';
        }
        return this._provenanceTracker.debugProvenance(toConsole);
    }

    /**
     * Get the source layer for a specific config field
     *
     * Supports deep field paths like 'dpad.segments.default.style.fill'
     *
     * @param {string} fieldPath - Dot-notation field path
     * @returns {string|null} Source layer name or null if not found
     *
     * @example
     * const card = document.querySelector('lcards-button');
     * card.getFieldSource('dpad'); // 'card_defaults'
     * card.getFieldSource('dpad.segments.default'); // 'card_defaults'
     * card.getFieldSource('dpad.segments.default.style.fill'); // 'user_config'
     */
    getFieldSource(fieldPath) {
        if (!this._provenanceTracker) {
            return null;
        }
        return this._provenanceTracker.getFieldSource(fieldPath);
    }

    /**
     * Get all fields from a specific source layer
     *
     * @param {string} layerName - Layer name (e.g., 'card_defaults', 'user_config')
     * @returns {string[]} Array of field paths from that layer
     *
     * @example
     * const card = document.querySelector('lcards-button');
     * card.getFieldsFromLayer('user_config');
     * // Returns: ['dpad.segments.default.style.fill', 'label', ...]
     */
    getFieldsFromLayer(layerName) {
        if (!this._provenanceTracker) {
            return [];
        }
        return this._provenanceTracker.getFieldsFromLayer(layerName);
    }

    /**
     * Check if a field or any of its children were overridden by user
     *
     * @param {string} fieldPrefix - Field path prefix to check
     * @returns {boolean} True if user overrode this field or any children
     *
     * @example
     * const card = document.querySelector('lcards-button');
     * card.hasUserOverride('dpad.segments.default.style');
     * // Returns true if any field under dpad.segments.default.style is from user_config
     */
    hasUserOverride(fieldPrefix) {
        if (!this._provenanceTracker) {
            return false;
        }
        return this._provenanceTracker.hasUserOverride(fieldPrefix);
    }

    /**
     * Get config provenance as a tree structure
     *
     * Reconstructs the flat field sources into a hierarchical tree showing
     * the source layer for each field and its nested children.
     *
     * @returns {Object} Tree structure with __source annotations
     *
     * @example
     * const card = document.querySelector('lcards-button');
     * const tree = card.getConfigTree();
     * console.log(tree);
     * // {
     * //   dpad: {
     * //     __source: 'card_defaults',
     * //     segments: {
     * //       __source: 'card_defaults',
     * //       default: {
     * //         __source: 'card_defaults',
     * //         style: {
     * //           __source: 'preset_dpad',
     * //           fill: {
     * //             __source: 'user_config'
     * //           }
     * //         }
     * //       }
     * //     }
     * //   }
     * // }
     */
    getConfigTree() {
        if (!this._provenanceTracker) {
            return {};
        }
        return this._provenanceTracker.getConfigTree();
    }

    /**
     * Print config tree to console in readable format
     *
     * Shows hierarchical view of config with source layers.
     * Perfect for understanding the complete config merge hierarchy.
     *
     * @param {string} [title] - Optional title for output
     *
     * @example
     * const card = document.querySelector('lcards-button');
     * card.printConfigTree();
     * // Console output:
     * // 📋 Config Provenance Tree
     * //   ▶ dpad [card_defaults]
     * //       ▶ segments [card_defaults]
     * //           ▶ default [card_defaults]
     * //               ▶ style [preset_dpad]
     * //                   fill [user_config]
     * //   label [user_config]
     * //   entity [user_config]
     */
    printConfigTree(title) {
        if (!this._provenanceTracker) {
            console.warn('Provenance tracker not initialized');
            return;
        }
        this._provenanceTracker.printConfigTree(title);
    }

    // ========================================================================
    // Component System: Zone & Segment Methods
    // ========================================================================
    // These methods provide unified zone and segment handling for all cards.
    // Migrated from individual card implementations (slider, button) to base
    // class to eliminate code duplication and provide consistent API.
    //
    // Zones: Empty SVG groups where cards inject runtime content (track, text, etc.)
    // Segments: Pre-defined SVG shapes with IDs that map to styles + actions
    // ========================================================================

    /**
     * Load component and extract zones/segments
     *
     * This is the main entry point for component loading. It:
     * 1. Stores the component SVG
     * 2. Extracts zones (data-zone attributes) for content injection
     * 3. Extracts segment IDs for interactivity setup
     *
     * Subclasses should call this in their initialization to get access
     * to zones and segments without reimplementing the extraction logic.
     *
     * @param {Object} componentDef - Component definition with svg, segments, etc.
     * @returns {Promise<void>}
     * @protected
     *
     * @example
     * async _initialize() {
     *     const componentDef = getComponent(this.config.component);
     *     await this._loadComponent(componentDef);
     *     // Now zones and segments are available via this._zones and this._componentSegments
     * }
     */
    async _loadComponent(componentDef) {
        if (!componentDef) {
            lcardsLog.warn('[LCARdSCard] No component definition provided to _loadComponent');
            return;
        }

        // Initialize zones map if not already present
        if (!this._zones) {
            this._zones = new Map();
        }

        // Store component SVG content
        this._componentSvgContent = componentDef.svg || null;

        // Store component segments for later processing
        this._componentSegments = componentDef.segments || null;

        // Extract zones from SVG if present
        if (this._componentSvgContent) {
            // We need to parse the SVG to extract zones
            // This is done after the SVG is inserted into the DOM
            // For now, just store the SVG and wait for it to be rendered
            lcardsLog.debug('[LCARdSCard] Component loaded, zones will be extracted after render');
        }
    }

    // ============================================================================
    // Zone Management Methods
    // ============================================================================

    /**
     * Extract zones from rendered SVG component
     *
     * Parses data-zone attributes from the component SVG to identify
     * injection points for dynamic content. Zones must have:
     * - data-zone="name" attribute
     * - data-bounds="x,y,width,height" attribute (optional, will use defaults)
     *
     * This should be called after the SVG is rendered into the DOM.
     *
     * @param {Element} [svgElement] - Optional SVG element to parse (defaults to this._componentSvg)
     * @protected
     *
     * @example
     * firstUpdated() {
     *     super.firstUpdated();
     *     const svg = this.shadowRoot.querySelector('.component-svg');
     *     this._extractZones(svg);
     * }
     */
    _extractZones(svgElement = null) {
        const svg = svgElement || this._componentSvg;

        if (!svg) {
            if (this._zones) {
                this._zones.clear();
            }
            return;
        }

        if (!this._zones) {
            this._zones = new Map();
        } else {
            this._zones.clear();
        }

        const zoneElements = svg.querySelectorAll('[data-zone]');

        zoneElements.forEach(el => {
            const zoneName = el.getAttribute('data-zone');
            const boundsStr = el.getAttribute('data-bounds');

            if (!boundsStr) {
                lcardsLog.warn(`[LCARdSCard] Zone "${zoneName}" missing data-bounds attribute`);
                // Use sensible defaults for zones without explicit bounds
                const defaultBounds = { x: 0, y: 0, width: 100, height: 20 };
                this._zones.set(zoneName, {
                    element: el,
                    bounds: defaultBounds
                });
                return;
            }

            // Parse bounds: "x,y,width,height"
            const [x, y, width, height] = boundsStr.split(',').map(v => parseFloat(v.trim()));

            this._zones.set(zoneName, {
                element: el,
                bounds: { x, y, width, height }
            });

            lcardsLog.trace(`[LCARdSCard] Zone "${zoneName}" extracted with bounds:`, { x, y, width, height });
        });

        lcardsLog.debug(`[LCARdSCard] Extracted ${this._zones.size} zones from component SVG`);
    }

    /**
     * Get zone by name
     *
     * Returns zone metadata including the DOM element and bounding box.
     *
     * @param {string} zoneName - Name of the zone (e.g., 'track', 'text')
     * @returns {Object|undefined} Zone object with element and bounds, or undefined
     * @protected
     *
     * @example
     * const trackZone = this._getZone('track');
     * if (trackZone) {
     *     console.log('Track zone bounds:', trackZone.bounds);
     * }
     */
    _getZone(zoneName) {
        return this._zones?.get(zoneName);
    }

    /**
     * Inject content into a zone
     *
     * Clears the zone's existing content and injects new SVG markup.
     * The content should be valid SVG elements (paths, rects, groups, etc.).
     *
     * @param {string} zoneName - Name of the zone to inject into
     * @param {string} content - SVG markup to inject
     * @protected
     *
     * @example
     * const trackContent = `<rect x="0" y="0" width="100" height="20" fill="blue"/>`;
     * this._injectIntoZone('track', trackContent);
     */
    _injectIntoZone(zoneName, content) {
        const zone = this._getZone(zoneName);
        if (!zone) {
            lcardsLog.warn(`[LCARdSCard] Cannot inject into unknown zone: ${zoneName}`);
            return;
        }

        // Clear existing content
        zone.element.innerHTML = '';

        // Inject new content
        if (content) {
            zone.element.innerHTML = content;
            lcardsLog.trace(`[LCARdSCard] Injected content into zone "${zoneName}"`);
        }
    }

    /**
     * Extract segment IDs from SVG content
     *
     * Auto-discovers all elements with ID attributes in the SVG.
     * These IDs map to segment configurations for styling and interactivity.
     *
     * @param {string} svgContent - SVG markup to parse
     * @returns {Array<string>} Array of discovered segment IDs
     * @protected
     *
     * @example
     * const ids = this._extractSegmentIds(svgContent);
     * // Returns: ['up', 'down', 'left', 'right', 'center']
     */
    _extractSegmentIds(svgContent) {
        if (!svgContent) return [];

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgContent, 'image/svg+xml');

            // Check for parse errors
            const parseError = doc.querySelector('parsererror');
            if (parseError) {
                lcardsLog.warn('[LCARdSCard] SVG parse error during ID extraction:', parseError.textContent);
                return [];
            }

            // Find all elements with ID attributes
            const elementsWithIds = doc.querySelectorAll('[id]');
            const segmentIds = Array.from(elementsWithIds).map(el => el.id);

            lcardsLog.debug(`[LCARdSCard] Discovered ${segmentIds.length} segment IDs from SVG:`, segmentIds);

            return segmentIds;
        } catch (error) {
            lcardsLog.error('[LCARdSCard] Failed to extract segment IDs from SVG:', error);
            return [];
        }
    }

    /**
     * Process segment configuration
     *
     * Converts object-based segment config (from component definition or user config)
     * to internal array format used for rendering and interactivity.
     *
     * Merges default segment config with per-segment overrides and validates
     * that configured segments exist in the SVG.
     *
     * @param {Object} segmentsObject - Segment configuration (keyed by ID)
     * @param {Array<string>} availableIds - Segment IDs discovered from SVG
     * @returns {Array<Object>} Processed segment configuration array
     * @protected
     *
     * @example
     * const segments = this._processSegmentConfig(
     *     { up: { style: { fill: 'red' } }, down: { style: { fill: 'blue' } } },
     *     ['up', 'down', 'left', 'right']
     * );
     * // Returns array with merged default + per-segment config
     */
    _processSegmentConfig(segmentsObject, availableIds) {
        if (!segmentsObject) return [];

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
                lcardsLog.warn(`[LCARdSCard] Segment "${id}" configured but not found in SVG (no matching id attribute)`);
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

        lcardsLog.debug(`[LCARdSCard] Processed ${segmentsArray.length} segments from ${availableIds.length} discovered IDs`, {
            configured: segmentsArray.map(s => s.id),
            discovered: availableIds
        });

        return segmentsArray;
    }

    /**
     * Check if a segment should be skipped (no config and no defaults)
     *
     * @param {Object} userConfig - User-provided segment configuration
     * @param {Object} defaultConfig - Default configuration
     * @returns {boolean} True if segment should be skipped
     * @protected
     */
    _shouldSkipSegment(userConfig, defaultConfig) {
        const hasUserConfig = userConfig.tap_action ||
                             userConfig.hold_action ||
                             userConfig.double_tap_action ||
                             userConfig.style ||
                             userConfig.animations ||
                             userConfig.entity;

        const hasDefaultConfig = defaultConfig.tap_action ||
                                defaultConfig.hold_action ||
                                defaultConfig.double_tap_action ||
                                defaultConfig.style ||
                                defaultConfig.animations ||
                                defaultConfig.entity;

        return !hasUserConfig && !hasDefaultConfig;
    }

    /**
     * Setup segment interactivity
     *
     * Applies styles and attaches event listeners to segments in the rendered SVG.
     * This handles:
     * - Initial styling based on entity state
     * - Click/hold/double-click action handlers
     * - Hover effects
     * - State-based style updates
     *
     * Should be called after the SVG is rendered and segments are processed.
     * Subclasses may need to override this to customize interaction behavior.
     *
     * @param {Array<Object>} segments - Processed segment configuration array
     * @param {Element} svgContainer - SVG container element
     * @protected
     *
     * @example
     * firstUpdated() {
     *     super.firstUpdated();
     *     const svg = this.shadowRoot.querySelector('.component-svg');
     *     this._setupSegmentInteractivity(this._processedSegments, svg);
     * }
     */
    _setupSegmentInteractivity(segments, svgContainer) {
        if (!segments || segments.length === 0) {
            return;
        }

        if (!svgContainer) {
            lcardsLog.debug('[LCARdSCard] SVG container not yet rendered for segments (will retry on next update)');
            return;
        }

        // Clean up previous segment listeners
        if (this._segmentCleanups && this._segmentCleanups.length > 0) {
            this._segmentCleanups.forEach(cleanup => cleanup());
        }
        this._segmentCleanups = [];

        // Setup each segment
        segments.forEach(segment => {
            // Find target elements using CSS selector
            const elements = svgContainer.querySelectorAll(segment.selector);

            if (elements.length === 0) {
                lcardsLog.warn(`[LCARdSCard] No elements found for segment selector: ${segment.selector}`);
                return;
            }

            lcardsLog.debug(`[LCARdSCard] Setting up segment "${segment.id}" on ${elements.length} elements`);

            elements.forEach(element => {
                // Apply initial style if provided
                if (segment.style) {
                    this._applySegmentStyle(element, segment.style);
                }

                // Attach action handlers if card has action handler system
                if (this._actionHandler && (segment.tap_action || segment.hold_action || segment.double_tap_action)) {
                    const cleanup = this._attachSegmentActions(element, segment);
                    if (cleanup) {
                        this._segmentCleanups.push(cleanup);
                    }
                }
            });
        });

        lcardsLog.debug(`[LCARdSCard] Segment interactivity setup complete for ${segments.length} segments`);
    }

    /**
     * Apply style to a segment element
     *
     * @param {Element} element - SVG element
     * @param {Object} style - Style properties to apply
     * @protected
     */
    _applySegmentStyle(element, style) {
        if (!element || !style) return;

        Object.entries(style).forEach(([prop, value]) => {
            // Handle special properties
            if (prop === 'stroke-width') {
                element.setAttribute('stroke-width', value);
            } else {
                element.style[prop] = value;
            }
        });
    }

    /**
     * Attach action handlers to a segment element
     *
     * @param {Element} element - SVG element
     * @param {Object} segment - Segment configuration with actions
     * @returns {Function} Cleanup function to remove listeners
     * @protected
     */
    _attachSegmentActions(element, segment) {
        // This is a placeholder - subclasses should implement if needed
        // or use LCARdSActionHandler directly
        const listeners = [];

        if (segment.tap_action) {
            const handler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this._actionHandler.handleAction(segment.tap_action, this.hass, this.config, segment.entity);
            };
            element.addEventListener('click', handler);
            listeners.push(() => element.removeEventListener('click', handler));
        }

        // Return cleanup function
        return () => listeners.forEach(cleanup => cleanup());
    }
}