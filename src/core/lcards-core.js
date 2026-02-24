/**
 * LCARdSCore - Central Infrastructure Coordinator
 *
 * Singleton managing all shared systems for LCARdS cards.
 * Initializes lazily on first card load and provides the foundation
 * for multi-card coordination and standalone overlay cards.
 *
 * Phase 1: Core systems extraction and coordination
 * - SystemsManager for entity tracking
 * - Card registration and lifecycle
 * - Lazy initialization pattern
 *
 * Future phases will add:
 * - DataSourceManager extraction
 * - RulesManager extraction
 * - Pipeline creation
 * - Overlay registration
 *
 * @module core/lcards-core
 */

import { lcardsLog } from '../utils/lcards-logging.js';
import { CoreSystemsManager } from './systems-manager/index.js';
import { DataSourceManager } from './data-sources/DataSourceManager.js';  // ✅ Moved to Core
import { RulesEngine } from './rules/RulesEngine.js';  // ✅ Moved to Core
import { ThemeManager } from './themes/ThemeManager.js';  // ✅ Moved to Core
import { AnimationManager } from './animation/AnimationManager.js';
import { AnimationPerformanceMonitor } from './animation/PerformanceMonitor.js';  // ✅ Performance monitoring
import { CoreValidationService } from './validation-service/index.js';
import { ComponentManager } from './components/ComponentManager.js';  // ✅ Component registry

import { StylePresetManager } from './presets/StylePresetManager.js';  // ✅ Moved to Core
import { AnimationRegistry } from './animation/AnimationRegistry.js';  // ✅ Moved to Core
import { LCARdSActionHandler } from '../base/LCARdSActionHandler.js';  // ✅ Unified action handling
import { CoreConfigManager } from './config-manager/index.js';  // ✅ Unified config processing
import { injectPalette } from './themes/paletteInjector.js';  // ✅ CB-LCARS palette injection
import { PackManager } from './PackManager.js';  // ✅ Pack registration system
import { AssetManager } from './assets/AssetManager.js';  // ✅ Asset management system
import { DataSourceDebugAPI } from '../api/DataSourceDebugAPI.js';  // ✅ DataSource debug tools
import { LCARdSHelperManager } from './helpers/lcards-helper-manager.js';  // ✅ Helper management system
import { SoundManager } from './sound/SoundManager.js';  // ✅ Sound management system

/**
 * LCARdSCore - Central coordinator for all LCARdS infrastructure
 *
 * This singleton provides:
 * - Shared system management (SystemsManager, DataSourceManager, RulesManager)
 * - Card registration and lifecycle
 * - Lazy initialization (heavy systems load on first card)
 * - Order-independent card loading
 * - Multi-instance support
 */
class LCARdSCore {
    constructor() {
        // ===== SHARED SYSTEMS (Lazy-initialized) =====
        this.systemsManager = null;      // Entity state tracking
        this.dataSourceManager = null;   // Data fetching/polling (Phase 1b)
        this.rulesManager = null;        // Rule evaluation (Phase 1c)
        this.themeManager = null;        // Theme and style management (Phase 2a)
        this.animationManager = null;    // Animation coordination (Phase 2a)
        this.performanceMonitor = null;  // Performance monitoring (Phase 2a)
        this.validationService = null;   // Config validation and error reporting (Phase 2a)
        this.stylePresetManager = null;  // Unified style system: presets + CSS utilities (Phase 2b)
        this.animationRegistry = null;   // Animation instance caching (Phase 2b)
        this.actionHandler = null;       // Unified action handling system
        this.configManager = null;       // Unified configuration processing
        this.packManager = null;         // Pack loading and registration (Phase 4)
        this.assetManager = null;        // Asset management system (Phase 4)
        this.componentManager = null;    // Component registry (Phase 4)
        this.helperManager = null;       // Helper management system (Phase 5)
        this.soundManager = null;         // Sound management system (Phase 2g)

        // ===== REGISTRIES =====
        this._cardInstances = new Map();     // Map<cardId, CardContext>
        this._overlayInstances = new Map();  // Phase 2: overlay tracking (currently delegated to SystemsManager._overlayRegistry)
        this._cardLoadOrder = [];            // Array<cardId> for debugging

        // ===== INITIALIZATION STATE =====
        this._coreInitialized = false;
        this._coreInitPromise = null;
        this._pendingCards = [];  // Cards waiting for core initialization

        // ===== HASS TRACKING =====
        this._currentHass = null;
        this._pendingHass = null;           // Latest HASS for microtask deduplication (Issue 8)
        this._hassIngestScheduled = false;  // Deduplication guard (Issue 8)

        lcardsLog.debug('[LCARdSCore] 🚀 Singleton created (lazy init pending)');
    }

    /**
     * Initialize core systems
     * Safe to call multiple times - only initializes once
     *
     * @param {Object} hass - Home Assistant instance
     * @returns {Promise<void>}
     */
    async initialize(hass) {
        // Return existing promise if already initializing
        if (this._coreInitPromise) {
            lcardsLog.debug('[LCARdSCore] Core initialization already in progress, waiting...');
            return this._coreInitPromise;
        }

        // Return immediately if already initialized
        if (this._coreInitialized) {
            lcardsLog.debug('[LCARdSCore] Core already initialized, updating HASS');
            this._updateHass(hass);
            return;
        }

        // Start initialization
        this._coreInitPromise = this._performInitialization(hass);

        try {
            await this._coreInitPromise;
        } finally {
            this._coreInitPromise = null;
        }
    }

    /**
     * Perform the actual initialization
     * @private
     */
    async _performInitialization(hass) {
        lcardsLog.debug('[LCARdSCore] Initializing core systems...');

        try {
            // Store HASS reference
            this._currentHass = hass;

            // ✅ PHASE 1: Inject CB-LCARS palette as --lcards-* CSS variables
            // This must happen BEFORE ThemeManager initialization so fallback colors are available
            injectPalette();
            lcardsLog.debug('[LCARdSCore] ✅ CB-LCARS palette injected as --lcards-* CSS variables');

            // Initialize SystemsManager (Phase 1a)
            this.systemsManager = new CoreSystemsManager();
            this.systemsManager.initialize(hass);
            lcardsLog.debug('[LCARdSCore] ✅ SystemsManager initialized');

            // Initialize DataSourceManager (Phase 1b) - ✅ Real MSD DataSourceManager as singleton
            this.dataSourceManager = new DataSourceManager(hass);
            // NOTE: DataSourceManager will be properly initialized later by MSD SystemsManager
            lcardsLog.debug('[LCARdSCore] ✅ DataSourceManager created (MSD will initialize)');

            // Initialize RulesManager (Phase 1c)
            this.rulesManager = new RulesEngine();
            // 🔗 CRITICAL: Connect systemsManager so RulesEngine can access overlay registry
            this.rulesManager.systemsManager = this.systemsManager;
            lcardsLog.debug('[LCARdSCore] ✅ RulesManager initialized and connected to SystemsManager');

            // Initialize ThemeManager (Phase 2a) - ✅ Real MSD ThemeManager as singleton
            // Note: Themes will be loaded by PackManager, not here
            this.themeManager = new ThemeManager();
            lcardsLog.debug('[LCARdSCore] ✅ ThemeManager created (awaiting pack loading)');

            // Initialize AnimationManager (Phase 2a)
            this.animationManager = new AnimationManager(this.systemsManager);
            await this.animationManager.initialize([], { suppressMountWarning: true }); // Suppress mount warning during core init
            lcardsLog.debug('[LCARdSCore] ✅ AnimationManager initialized');

            // Initialize PerformanceMonitor (Phase 2a)
            this.performanceMonitor = new AnimationPerformanceMonitor();
            lcardsLog.debug('[LCARdSCore] ✅ PerformanceMonitor created (will start when 3D backgrounds are used)');

            // Initialize ValidationService (Phase 2a)
            this.validationService = new CoreValidationService({
                validateEntities: true,
                cacheResults: true,
                debug: false
            });
            await this.validationService.initialize(hass);
            lcardsLog.debug('[LCARdSCore] ✅ ValidationService initialized');

            // Initialize ConfigManager (Phase 2a+) - ✅ CRITICAL: Must be early for card initialization
            // Cards need config processing from the moment they're created
            this.configManager = new CoreConfigManager();
            await this.configManager.initialize({
                validationService: this.validationService
                // Note: themeManager and stylePresetManager will be added to context after they initialize
            });
            lcardsLog.debug('[LCARdSCore] ✅ ConfigManager initialized (early - before cards need it)');

            // Initialize StylePresetManager (Phase 2b) - ✅ Unified style system (replaces CoreStyleLibrary)
            // This now includes both preset management AND CSS utilities
            // Note: Presets will be loaded by PackManager, not here
            this.stylePresetManager = new StylePresetManager();
            this.stylePresetManager.initializeCSSUtilities(); // Initialize CSS utilities now
            lcardsLog.debug('[LCARdSCore] ✅ StylePresetManager created (awaiting pack loading)');

            // Initialize AnimationRegistry (Phase 2b) - ✅ Real MSD AnimationRegistry as singleton
            this.animationRegistry = new AnimationRegistry();
            lcardsLog.debug('[LCARdSCore] ✅ AnimationRegistry initialized');

            // Initialize ActionHandler (Phase 2c) - ✅ Unified action handling for all cards
            this.actionHandler = new LCARdSActionHandler();
            lcardsLog.debug('[LCARdSCore] ✅ ActionHandler initialized');

            // Initialize AssetManager (Phase 2d) - ✅ Unified asset management system
            this.assetManager = new AssetManager();
            await this.assetManager.initialize();
            lcardsLog.debug('[LCARdSCore] ✅ AssetManager initialized');

            // Initialize ComponentManager (Phase 2e) - ✅ Component registry for all card types
            this.componentManager = new ComponentManager();
            await this.componentManager.initialize();
            lcardsLog.debug('[LCARdSCore] ✅ ComponentManager initialized');

            // Initialize HelperManager (Phase 2f) - ✅ Helper management system
            this.helperManager = new LCARdSHelperManager(hass);
            lcardsLog.debug('[LCARdSCore] ✅ HelperManager initialized');

            // Initialize SoundManager (Phase 2g) - ✅ UI sound system
            this.soundManager = new SoundManager();
            await this.soundManager.initialize(this);
            lcardsLog.debug('[LCARdSCore] ✅ SoundManager initialized');

            // Initialize PackManager (Phase 2e) - ✅ Centralized pack loading and registration
            // PackManager is the ONLY place that loads builtin packs
            this.packManager = new PackManager(this);
            await this.packManager.loadBuiltinPacks(['core', 'lcards_buttons', 'lcards_sliders', 'lcars_fx', 'builtin_themes']);
            lcardsLog.debug('[LCARdSCore] PackManager loaded all packs and registered to managers');

            // Activate default theme after packs are loaded
            try {
                await this.themeManager.activateTheme('lcards-default');
                lcardsLog.debug('[LCARdSCore] Default theme activated');
            } catch (error) {
                lcardsLog.error('[LCARdSCore] ❌ Theme activation failed:', error);
            }

            // Update ConfigManager context with late-initialized systems (Phase 2e)
            // ConfigManager was initialized early (after ValidationService), now add theme/style managers
            if (this.configManager) {
                await this.configManager.updateContext({
                    themeManager: this.themeManager,
                    stylePresetManager: this.stylePresetManager
                });
                lcardsLog.debug('[LCARdSCore] ✅ ConfigManager context updated with theme/style managers');
            }

            // Attach DataSource debug API (Phase 3+)
            if (typeof window !== 'undefined') {
                window.lcards = window.lcards || {};
                window.lcards.debug = window.lcards.debug || {};
                window.lcards.debug.datasources = DataSourceDebugAPI.create();
                lcardsLog.debug('[LCARdSCore] ✅ DataSource debug API attached at window.lcards.debug.datasources');
            }

            this._coreInitialized = true;

            // Mount global UI sound listener and alert subscription (after core is marked ready)
            this.soundManager.mountGlobalUIListener();
            this.soundManager.subscribeToAlertMode();
            lcardsLog.debug('[LCARdSCore] ✅ SoundManager global listeners mounted');

            // Process any cards that were waiting
            if (this._pendingCards.length > 0) {
                lcardsLog.debug(`[LCARdSCore] Processing ${this._pendingCards.length} pending cards`);

                for (const pendingCard of this._pendingCards) {
                    try {
                        const context = await this._registerCardInternal(
                            pendingCard.cardId,
                            pendingCard.card,
                            pendingCard.config
                        );
                        pendingCard.resolve(context);
                    } catch (error) {
                        lcardsLog.error(`[LCARdSCore] Failed to process pending card ${pendingCard.cardId}:`, error);
                        pendingCard.reject(error);
                    }
                }

                this._pendingCards = [];
            }

            lcardsLog.info('[LCARdSCore] ✅ Core systems initialized successfully');

        } catch (error) {
            lcardsLog.error('[LCARdSCore] ❌ Core initialization failed:', error);
            this._coreInitialized = false;
            throw error;
        }
    }

    /**
     * Register a card instance
     * Can be called before core is initialized (card will queue)
     *
     * @param {string} cardId - Unique card identifier
     * @param {Object} card - Card instance
     * @param {Object} config - Card configuration
     * @returns {Promise<Object>} Card context
     */
    async registerCard(cardId, card, config) {
        // Generate unique ID if not provided
        if (!cardId) {
            cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }

        // If core not initialized, queue the card
        if (!this._coreInitialized) {
            lcardsLog.debug(`[LCARdSCore] Core not ready, queuing card: ${cardId}`);

            return new Promise((resolve, reject) => {
                this._pendingCards.push({
                    cardId,
                    card,
                    config,
                    resolve,
                    reject
                });
            });
        }

        // Core is ready, register immediately
        return this._registerCardInternal(cardId, card, config);
    }

    /**
     * Internal card registration (core must be initialized)
     * @private
     */
    async _registerCardInternal(cardId, card, config) {
        lcardsLog.debug(`[LCARdSCore] Registering card: ${cardId}`);

        // Create card context via SystemsManager
        const systemsContext = this.systemsManager.registerCard(cardId, card, config);

        const cardContext = {
            cardId,
            card,
            config,
            registeredAt: Date.now(),

            // Core system references
            systemsManager: this.systemsManager,
            dataSourceManager: this.dataSourceManager,
            rulesManager: this.rulesManager,
            themeManager: this.themeManager,
            animationManager: this.animationManager,
            validationService: this.validationService,
            stylePresetManager: this.stylePresetManager,
            configManager: this.configManager,
            componentManager: this.componentManager,

            // Convenience methods - prefer SystemsManager for entity access (has caching)
            getEntityState: (entityId) => this.systemsManager.getEntityState(entityId),
            subscribeToEntity: (entityId, callback) => this.systemsManager.subscribeToEntity(entityId, callback, cardId),
            unsubscribeFromEntity: (entityId, callback) => this.systemsManager.unsubscribeFromEntity(entityId, callback),

            // Data source methods (for advanced use cases)
            subscribeToDataSource: (entityId, callback) => this.dataSourceManager?.subscribeToEntity(entityId, callback),
            getDataSourceState: (entityId) => this.dataSourceManager?.getEntityState(entityId),

            // Rules methods (for advanced rule-based overlays)
            addRule: (rule) => this.rulesManager?.addRule(rule),
            removeRule: (ruleId) => this.rulesManager?.removeRule(ruleId),
            evaluateRules: () => this.rulesManager?.evaluateAll((entityId) => this.systemsManager.getEntityState(entityId)),

            // Lifecycle
            destroy: () => this.unregisterCard(cardId)
        };

        this._cardInstances.set(cardId, cardContext);
        this._cardLoadOrder.push(cardId);

        lcardsLog.info(`[LCARdSCore] ✅ Card registered: ${cardId}`);
        return cardContext;
    }

    /**
     * Unregister card when destroyed
     * Cleanup subscriptions, rules, overlays, etc.
     *
     * @param {string} cardId - Card to unregister
     */
    unregisterCard(cardId) {
        const cardContext = this._cardInstances.get(cardId);
        if (!cardContext) {
            lcardsLog.warn(`[LCARdSCore] Cannot unregister unknown card: ${cardId}`);
            return;
        }

        // Cleanup with SystemsManager
        if (this.systemsManager) {
            this.systemsManager.unregisterCard(cardId);
        }

        // TODO: Cleanup with DataSourceManager (when needed)
        // TODO: Cleanup card-specific rules with RulesManager (if needed)

        // Remove from registries
        this._cardInstances.delete(cardId);

        // Remove from load order
        const loadOrderIndex = this._cardLoadOrder.indexOf(cardId);
        if (loadOrderIndex >= 0) {
            this._cardLoadOrder.splice(loadOrderIndex, 1);
        }

        lcardsLog.info(`[LCARdSCore] ✅ Card unregistered: ${cardId}`);
    }

    /**
     * Update HASS instance (called when HASS updates)
     * @param {Object} hass - Updated HASS instance
     */
    _updateHass(hass) {
        this._currentHass = hass;

        lcardsLog.debug(`[Core] _updateHass distributing to subsystems`, {
            hasSystemsManager: !!this.systemsManager,
            hasDataSourceManager: !!this.dataSourceManager,
            hasRulesManager: !!this.rulesManager,
            hasThemeManager: !!this.themeManager,
            hasAnimationManager: !!this.animationManager,
            hasSoundManager: !!this.soundManager
        });

        // Forward to all systems
        if (this.systemsManager) {
            this.systemsManager.updateHass(hass);
        }

        if (this.dataSourceManager) {
            this.dataSourceManager.updateHass(hass);
        }

        if (this.rulesManager) {
            this.rulesManager.updateHass(hass);
        }

        if (this.themeManager) {
            this.themeManager.updateHass(hass);
        }

        if (this.animationManager) {
            this.animationManager.updateHass(hass);
        }

        if (this.validationService) {
            this.validationService.updateHass(hass);
        }

        if (this.soundManager) {
            this.soundManager.updateHass(hass);
        }

        // StylePresetManager doesn't need HASS updates (it's theme/pack based)
    }

    /**
     * Ingest HASS updates (called from card HASS update handlers)
     * Deduplicates multiple per-tick calls so only one _updateHass propagation fires per microtask.
     * @param {Object} hass - Updated HASS instance
     */
    ingestHass(hass) {
        if (!hass) return;
        this._pendingHass = hass; // always take the latest
        if (this._hassIngestScheduled) return; // already scheduled this tick
        this._hassIngestScheduled = true;
        Promise.resolve().then(() => {
            this._hassIngestScheduled = false;
            if (this._pendingHass) {
                this._updateHass(this._pendingHass);
                this._pendingHass = null;
            }
        });
    }

    /**
     * Get debug information about the core state
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        const systems = this.systemsManager ? 'CoreSystemsManager ready' : 'Not initialized';
        const dataSources = this.dataSourceManager ? 'DataSourceManager ready' : 'Not initialized';
        const rules = this.rulesManager ? 'CoreRulesManager ready' : 'Not initialized';
        const themes = this.themeManager ? 'ThemeManager ready' : 'Not initialized';
        const actions = this.actionHandler ? 'ActionHandler ready' : 'Not initialized';
        const assets = this.assetManager ? 'AssetManager ready' : 'Not initialized';

        return {
            coreInitialized: this._coreInitialized,
            cardCount: this._cardInstances.size,
            cardLoadOrder: [...this._cardLoadOrder],
            pendingCards: this._pendingCards.length,
            systems,
            dataSources,
            rules,
            themes,
            actions,
            assets,

            systemsManager: this.systemsManager ? this.systemsManager.getDebugInfo() : null,
            dataSourceManager: this.dataSourceManager ? this.dataSourceManager.getDebugInfo() : null,
            rulesManager: this.rulesManager ? this._getRulesManagerDebugInfo() : null,
            themeManager: this.themeManager ? this.themeManager.getDebugInfo() : null,
            animationManager: this.animationManager ? this._getAnimationManagerDebugInfo() : null,
            validationService: this.validationService ? this.validationService.getDebugInfo() : null,

            stylePresetManager: this.stylePresetManager ? this._getStylePresetManagerDebugInfo() : null,
            animationRegistry: this.animationRegistry ? this._getAnimationRegistryDebugInfo() : null,
            actionHandler: this.actionHandler ? this._getActionHandlerDebugInfo() : null,
            configManager: this.configManager ? this.configManager.getDebugInfo() : null,
            assetManager: this.assetManager ? this._getAssetManagerDebugInfo() : null,

            hasHass: !!this._currentHass
        };
    }

    /**
     * Get debug info from RulesEngine (real MSD class)
     * @private
     */
    _getRulesManagerDebugInfo() {
        if (!this.rulesManager) return null;

        try {
            return {
                type: 'RulesEngine',
                rulesCount: this.rulesManager.rules?.length || 0,
                rulesById: this.rulesManager.rulesById?.size || 0,
                dirtyRules: this.rulesManager.dirtyRules?.size || 0,
                evalCounts: this.rulesManager.evalCounts || {},
                hasDataSourceManager: !!this.rulesManager.dataSourceManager,
                recentMatches: this.rulesManager.getRecentMatches ? this.rulesManager.getRecentMatches(10000) : [],
                trace: this.rulesManager.getTrace ? this.rulesManager.getTrace() : null
            };
        } catch (error) {
            lcardsLog.warn('[LCARdSCore] Failed to get RulesEngine debug info:', error);
            return { type: 'RulesEngine', error: error.message };
        }
    }

    /**
     * Get debug info from AnimationManager (real MSD class)
     * @private
     */
    _getAnimationManagerDebugInfo() {
        if (!this.animationManager) return null;

        try {
            return {
                type: 'AnimationManager',
                initialized: this.animationManager.initialized || false,
                scopesCount: this.animationManager.scopes?.size || 0,
                customPresetsCount: this.animationManager.customPresets?.size || 0,
                timelinesCount: this.animationManager.timelines?.size || 0,
                activeAnimationsCount: this.animationManager.activeAnimations?.size || 0,
                registeredAnimationsCount: this.animationManager.registeredAnimations?.size || 0,
                hasMountEl: !!this.animationManager.mountEl,
                hasSystemsManager: !!this.animationManager.systemsManager
            };
        } catch (error) {
            lcardsLog.warn('[LCARdSCore] Failed to get AnimationManager debug info:', error);
            return { type: 'AnimationManager', error: error.message };
        }
    }

    /**
     * Get debug info from StylePresetManager (real MSD class)
     * @private
     */
    _getStylePresetManagerDebugInfo() {
        if (!this.stylePresetManager) return null;

        try {
            return {
                type: 'StylePresetManager',
                initialized: this.stylePresetManager.initialized || false,
                packCount: this.stylePresetManager.loadedPacks?.length || 0,
                cacheSize: this.stylePresetManager.presetCache?.size || 0,
                availableTypes: this.stylePresetManager._getAvailableOverlayTypes ? this.stylePresetManager._getAvailableOverlayTypes() : []
            };
        } catch (error) {
            lcardsLog.warn('[LCARdSCore] Failed to get StylePresetManager debug info:', error);
            return { type: 'StylePresetManager', error: error.message };
        }
    }

    /**
     * Get debug info from AnimationRegistry (real MSD class)
     * @private
     */
    _getAnimationRegistryDebugInfo() {
        if (!this.animationRegistry) return null;

        try {
            return {
                type: 'AnimationRegistry',
                cacheSize: this.animationRegistry.cache?.size || 0,
                maxCacheSize: this.animationRegistry.maxCacheSize || 0,
                perfStats: this.animationRegistry.perfStats || {},
                usageStats: this.animationRegistry.usageStats?.size || 0
            };
        } catch (error) {
            lcardsLog.warn('[LCARdSCore] Failed to get AnimationRegistry debug info:', error);
            return { type: 'AnimationRegistry', error: error.message };
        }
    }

    /**
     * Get debug info from ActionHandler
     * @private
     */
    _getActionHandlerDebugInfo() {
        if (!this.actionHandler) return null;

        try {
            return {
                type: 'LCARdSActionHandler',
                registeredElements: this.actionHandler._registeredElements?.constructor?.name || 'WeakMap',
                activeHandlers: this.actionHandler._activeHandlers?.size || 0,
                initialized: true
            };
        } catch (error) {
            lcardsLog.warn('[LCARdSCore] Failed to get ActionHandler debug info:', error);
            return { type: 'LCARdSActionHandler', error: error.message };
        }
    }

    /**
     * Get debug info from AssetManager
     * @private
     */
    _getAssetManagerDebugInfo() {
        if (!this.assetManager) return null;

        try {
            const registries = {};
            this.assetManager.listTypes().forEach(type => {
                const registry = this.assetManager.getRegistry(type);
                registries[type] = {
                    assetCount: registry.assets.size,
                    loadingCount: registry.loadingPromises.size,
                    assets: registry.list()
                };
            });

            return {
                type: 'AssetManager',
                registriesCount: this.assetManager.registries.size,
                supportedTypes: this.assetManager.listTypes(),
                registries
            };
        } catch (error) {
            lcardsLog.warn('[LCARdSCore] Failed to get AssetManager debug info:', error);
            return { type: 'AssetManager', error: error.message };
        }
    }

    /**
     * PUBLIC API METHODS FOR TESTING AND DEBUGGING
     */

    /**
     * Get the number of registered cards
     * @returns {number} Number of registered cards
     */
    getCardCount() {
        return this._cardInstances.size;
    }

    /**
     * Get card information
     * @returns {Object} Card registry information
     */
    getCardInfo() {
        const cardInfo = {};
        this._cardInstances.forEach((context, cardId) => {
            cardInfo[cardId] = {
                loadOrder: this._cardLoadOrder.indexOf(cardId),
                hasConfig: !!context.config,
                initialized: context.initialized || false
            };
        });
        return cardInfo;
    }

    /**
     * Get entity subscriptions across all cards
     * @returns {Object} Entity subscriptions by card
     */
    getEntitySubscriptions() {
        if (!this.dataSourceManager) {
            return {};
        }
        return this.dataSourceManager.getEntitySubscriptions();
    }

    /**
     * Get the number of registered rules
     * @returns {number} Number of rules
     */
    getRulesCount() {
        if (!this.rulesManager) {
            return 0;
        }
        return this.rulesManager.getRulesCount();
    }

    /**
     * Get rules information
     * @returns {Object} Rules information
     */
    getRulesInfo() {
        if (!this.rulesManager) {
            return {};
        }
        return this.rulesManager.getRulesInfo();
    }

    /**
     * Get StylePresetManager instance
     * @returns {StylePresetManager|null} Style preset manager or null if not initialized
     */
    getStylePresetManager() {
        return this.stylePresetManager;
    }

    /**
     * Get ThemeManager instance
     * @returns {ThemeManager|null} Theme manager or null if not initialized
     */
    getThemeManager() {
        return this.themeManager || null;
    }

    /**
     * Get AnimationManager instance
     * @returns {AnimationManager|null} Animation manager or null if not initialized
     */
    getAnimationManager() {
        return this.animationManager || null;
    }

    /**
     * Get AssetManager instance
     * @returns {AssetManager|null} Asset manager or null if not initialized
     */
    getAssetManager() {
        return this.assetManager || null;
    }

    /**
     * Get ComponentManager instance
     * @returns {ComponentManager|null} Component manager or null if not initialized
     */
    getComponentManager() {
        return this.componentManager || null;
    }

    /**
     * Public HASS update method.
     * Distributes HASS to all subsystems AND pushes directly to registered card instances.
     * The card-push is required for MSD cards whose controls live in shadow DOM and
     * do not receive hass from HA directly — they rely on this push to get HASS updates.
     *
     * Called from: test harness, and any external code that needs to force a HASS update.
     * For normal card-triggered updates, prefer ingestHass() which deduplicates per tick.
     *
     * @param {Object} hass - Updated HASS instance
     */
    updateHass(hass) {
        if (!hass) return;

        // Distribute to all subsystems (shared path with ingestHass)
        this._updateHass(hass);

        // Additionally push directly to each registered card instance.
        // This is intentional: MSD card controls live in shadow DOM and are not
        // reachable by HA's native hass setter — they receive HASS only via this push.
        // For standard cards this is a same-reference no-op (setter guard: oldHass !== hass).
        this._cardInstances.forEach((context) => {
            if (context.card && typeof context.card.hass !== 'undefined') {
                context.card.hass = hass;
            }
        });
    }

    /**
     * Get performance information (placeholder)
     * @returns {Object} Performance metrics
     */
    getPerformanceInfo() {
        return {
            cardsRegistered: this._cardInstances.size,
            coreInitialized: this._coreInitialized,
            pendingCards: this._pendingCards.length,
            memoryUsage: 'Not implemented',
            initializationTime: 'Not tracked'
        };
    }    /**
     * Destroy the core and all systems
     */
    destroy() {
        lcardsLog.info('[LCARdSCore] 🚨 Destroying core systems...');

        // Unregister all cards
        Array.from(this._cardInstances.keys()).forEach(cardId => {
            this.unregisterCard(cardId);
        });

        // Destroy systems
        if (this.systemsManager) {
            this.systemsManager.destroy();
            this.systemsManager = null;
        }

        if (this.dataSourceManager) {
            this.dataSourceManager.destroy();
            this.dataSourceManager = null;
        }

        if (this.rulesManager) {
            this.rulesManager.destroy();
            this.rulesManager = null;
        }

        if (this.themeManager) {
            this.themeManager.destroy();
            this.themeManager = null;
        }

        if (this.animationManager) {
            this.animationManager.destroy();
            this.animationManager = null;
        }

        if (this.validationService) {
            this.validationService.destroy();
            this.validationService = null;
        }

        if (this.stylePresetManager) {
            this.stylePresetManager.destroyCSSUtilities();
            this.stylePresetManager = null;
        }

        if (this.soundManager) {
            this.soundManager.destroy();
            this.soundManager = null;
        }

        // Reset state
        this._coreInitialized = false;
        this._currentHass = null;
        this._pendingCards = [];

        lcardsLog.info('[LCARdSCore] ✅ Core systems destroyed');
    }
}

// Export singleton instance
export const lcardsCore = new LCARdSCore();

// Also export class for testing
export { LCARdSCore };