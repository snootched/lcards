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
import { CoreDataSourceManager } from './data-sources/index.js';
import { CoreRulesManager } from './rules-engine/index.js';
import { CoreThemeManager } from './theme-manager/index.js';
import { CoreAnimationManager } from './animation-manager/index.js';
import { CoreValidationService } from './validation-service/index.js';

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
        this.validationService = null;   // Config validation and error reporting (Phase 2a)
        this.styleLibrary = null;        // Style presets (Phase 1d)

        // ===== REGISTRIES =====
        this._cardInstances = new Map();     // Map<cardId, CardContext>
        this._overlayInstances = new Map();  // Map<overlayId, OverlayContext> (Phase 2)
        this._cardLoadOrder = [];            // Array<cardId> for debugging

        // ===== INITIALIZATION STATE =====
        this._coreInitialized = false;
        this._coreInitPromise = null;
        this._pendingCards = [];  // Cards waiting for core initialization

        // ===== HASS TRACKING =====
        this._currentHass = null;

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
        lcardsLog.info('[LCARdSCore] 🚀 Initializing core systems...');

        try {
            // Store HASS reference
            this._currentHass = hass;

            // Initialize SystemsManager (Phase 1a)
            this.systemsManager = new CoreSystemsManager();
            this.systemsManager.initialize(hass);
            lcardsLog.debug('[LCARdSCore] ✅ SystemsManager initialized');

            // Initialize DataSourceManager (Phase 1b)
            this.dataSourceManager = new CoreDataSourceManager(hass);
            await this.dataSourceManager.initialize();
            lcardsLog.debug('[LCARdSCore] ✅ DataSourceManager initialized');

            // Initialize RulesManager (Phase 1c)
            this.rulesManager = new CoreRulesManager();
            await this.rulesManager.initialize();
            lcardsLog.debug('[LCARdSCore] ✅ RulesManager initialized');

            // Initialize ThemeManager (Phase 2a)
            this.themeManager = new CoreThemeManager();
            await this.themeManager.initialize(); // Lightweight init without packs
            lcardsLog.debug('[LCARdSCore] ✅ ThemeManager initialized');

            // Initialize AnimationManager (Phase 2a)
            this.animationManager = new CoreAnimationManager();
            await this.animationManager.initialize();
            lcardsLog.debug('[LCARdSCore] ✅ AnimationManager initialized');

            // Initialize ValidationService (Phase 2a)
            this.validationService = new CoreValidationService({
                validateEntities: true,
                cacheResults: true,
                debug: false
            });
            await this.validationService.initialize(hass);
            lcardsLog.debug('[LCARdSCore] ✅ ValidationService initialized');

            // TODO Phase 1d: Initialize StyleLibrary

            this._coreInitialized = true;

            // Process any cards that were waiting
            if (this._pendingCards.length > 0) {
                lcardsLog.debug(`[LCARdSCore] Processing ${this._pendingCards.length} pending cards`);

                for (const pendingCard of this._pendingCards) {
                    try {
                        await this._registerCardInternal(
                            pendingCard.cardId,
                            pendingCard.card,
                            pendingCard.config
                        );
                    } catch (error) {
                        lcardsLog.error(`[LCARdSCore] Failed to process pending card ${pendingCard.cardId}:`, error);
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

            // Convenience methods - prefer SystemsManager for entity access (has caching)
            getEntityState: (entityId) => this.systemsManager.getEntityState(entityId),
            subscribeToEntity: (entityId, callback) => this.systemsManager.subscribeToEntity(entityId, callback),
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
    }

    /**
     * Ingest HASS updates (called from card HASS update handlers)
     * @param {Object} hass - Updated HASS instance
     */
    ingestHass(hass) {
        if (hass !== this._currentHass) {
            this._updateHass(hass);
        }
    }

    /**
     * Get debug information about the core state
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        const systems = this.systemsManager ? 'CoreSystemsManager ready' : 'Not initialized';
        const dataSources = this.dataSourceManager ? 'CoreDataSourceManager ready' : 'Not initialized';
        const rules = this.rulesManager ? 'CoreRulesManager ready' : 'Not initialized';
        const themes = this.themeManager ? 'CoreThemeManager ready' : 'Not initialized';

        return {
            coreInitialized: this._coreInitialized,
            cardCount: this._cardInstances.size,
            cardLoadOrder: [...this._cardLoadOrder],
            pendingCards: this._pendingCards.length,
            systems,
            dataSources,
            rules,
            themes,

            systemsManager: this.systemsManager ? this.systemsManager.getDebugInfo() : null,
            dataSourceManager: this.dataSourceManager ? this.dataSourceManager.getDebugInfo() : null,
            rulesManager: this.rulesManager ? this.rulesManager.getDebugInfo() : null,
            themeManager: this.themeManager ? this.themeManager.getDebugInfo() : null,
            animationManager: this.animationManager ? this.animationManager.getDebugInfo() : null,
            validationService: this.validationService ? this.validationService.getDebugInfo() : null,

            hasHass: !!this._currentHass
        };
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
     * Manually update HASS state (for testing)
     * @param {Object} hass - HASS object
     */
    updateHass(hass) {
        this._currentHass = hass;

        // Forward to systems
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

        // Forward to registered cards
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