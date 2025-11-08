/**
 * V2 Card Systems Manager
 *
 * Lightweight systems coordinator for V2 cards that provides:
 * - Access to singleton systems (themes, rules, animations, datasources)
 * - Template processing capabilities
 * - Style resolution
 * - DataSource subscription management
 * - Rule-based update handling
 *
 * This is a mini version of the full MSD SystemsManager, focused on
 * the essential capabilities needed by lightweight V2 cards.
 */

import { lcardsLog } from '../utils/lcards-logging.js';
import { lcardsCore } from '../core/lcards-core.js';
import { LightweightTemplateProcessor } from './LightweightTemplateProcessor.js';
import { V2StyleResolver } from './V2StyleResolver.js';

export class V2CardSystemsManager {
    constructor(cardInstance) {
        this.card = cardInstance;
        this.cardId = cardInstance._cardId;

        // Singleton system references (shared across all V2 cards)
        this.rulesEngine = null;
        this.themeManager = null;
        this.animationManager = null;
        this.dataSourceManager = null;
        this.validationService = null;

        // V2-specific local systems
        this.templateProcessor = null;
        this.styleResolver = null;

        // State tracking
        this.initialized = false;
        this.dataSourceSubscriptions = new Map(); // dsId -> subscription
        this.ruleCallbacks = new Set();

        lcardsLog.debug(`[V2CardSystemsManager] Created for card ${this.cardId}`);
    }

    /**
     * Initialize the systems manager
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            lcardsLog.debug(`[V2CardSystemsManager] Already initialized (${this.cardId})`);
            return;
        }

        try {
            // Wait for lcardsCore to be ready
            if (!lcardsCore || !lcardsCore.rulesManager) {
                throw new Error('lcardsCore not ready - singleton systems not available');
            }

            // Connect to singleton systems
            this.rulesEngine = lcardsCore.rulesManager;
            this.themeManager = lcardsCore.themeManager;
            this.animationManager = lcardsCore.animationManager;
            this.dataSourceManager = lcardsCore.dataSourceManager;
            this.validationService = lcardsCore.validationService;

            lcardsLog.debug(`[V2CardSystemsManager] Singleton connections established (${this.cardId})`);

            // Initialize local systems
            this.templateProcessor = new LightweightTemplateProcessor(this);
            this.styleResolver = new V2StyleResolver(this);

            await this.templateProcessor.initialize();
            await this.styleResolver.initialize();

            this.initialized = true;

            lcardsLog.info(`[V2CardSystemsManager] ✅ Initialization complete (${this.cardId})`);

        } catch (error) {
            lcardsLog.error(`[V2CardSystemsManager] ❌ Initialization failed (${this.cardId}):`, error);
            throw error;
        }
    }

    /**
     * Process a template with the given context
     * @param {string|Function} template - Template to process
     * @param {Object} context - Template context
     * @returns {Promise<any>} Processed result
     */
    async processTemplate(template, context = {}) {
        if (!this.templateProcessor) {
            lcardsLog.warn(`[V2CardSystemsManager] Template processor not ready (${this.cardId})`);
            return template;
        }

        return this.templateProcessor.process(template, context);
    }

    /**
     * Resolve styles using theme tokens and state overrides
     * @param {Object} baseStyle - Base style object
     * @param {Array<string>} themeTokens - Array of theme token paths
     * @param {Object} stateOverrides - State-based style overrides
     * @returns {Object} Resolved style object
     */
    resolveStyle(baseStyle = {}, themeTokens = [], stateOverrides = {}) {
        if (!this.styleResolver) {
            lcardsLog.warn(`[V2CardSystemsManager] Style resolver not ready (${this.cardId})`);
            return { ...baseStyle, ...stateOverrides };
        }

        return this.styleResolver.resolveStyle(baseStyle, themeTokens, stateOverrides);
    }

    /**
     * Get theme token by path
     * @param {string} tokenPath - Dot-notation path to token
     * @param {any} fallback - Fallback value if token not found
     * @returns {any} Token value or fallback
     */
    getThemeToken(tokenPath, fallback = null) {
        if (!this.themeManager) {
            lcardsLog.warn(`[V2CardSystemsManager] Theme manager not ready (${this.cardId})`);
            return fallback;
        }

        try {
            return this.themeManager.getToken(tokenPath, fallback);
        } catch (error) {
            lcardsLog.warn(`[V2CardSystemsManager] Theme token fetch failed (${this.cardId}):`, error);
            return fallback;
        }
    }

    /**
     * Get active theme information
     * @returns {Object|null} Active theme info
     */
    getActiveTheme() {
        if (!this.themeManager) {
            return null;
        }

        try {
            return this.themeManager.getActiveTheme();
        } catch (error) {
            lcardsLog.warn(`[V2CardSystemsManager] Active theme fetch failed (${this.cardId}):`, error);
            return null;
        }
    }

    /**
     * Subscribe to a data source
     * @param {Object} dsConfig - DataSource configuration
     * @param {Function} callback - Update callback
     * @returns {Promise<string>} Subscription ID
     */
    async subscribeToDataSource(dsConfig, callback) {
        if (!this.dataSourceManager) {
            throw new Error('DataSource manager not available');
        }

        try {
            const subscriptionId = await this.dataSourceManager.subscribe(dsConfig, callback);
            this.dataSourceSubscriptions.set(subscriptionId, { dsConfig, callback });

            lcardsLog.debug(`[V2CardSystemsManager] DataSource subscribed (${this.cardId}):`, subscriptionId);
            return subscriptionId;

        } catch (error) {
            lcardsLog.error(`[V2CardSystemsManager] DataSource subscription failed (${this.cardId}):`, error);
            throw error;
        }
    }

    /**
     * Unsubscribe from a data source
     * @param {string} subscriptionId - Subscription ID to cancel
     */
    async unsubscribeFromDataSource(subscriptionId) {
        if (!this.dataSourceManager) {
            return;
        }

        try {
            await this.dataSourceManager.unsubscribe(subscriptionId);
            this.dataSourceSubscriptions.delete(subscriptionId);

            lcardsLog.debug(`[V2CardSystemsManager] DataSource unsubscribed (${this.cardId}):`, subscriptionId);

        } catch (error) {
            lcardsLog.warn(`[V2CardSystemsManager] DataSource unsubscription failed (${this.cardId}):`, error);
        }
    }

    /**
     * Register for rule-based updates
     * @param {Function} callback - Rule update callback
     * @returns {Function} Unregister function
     */
    registerForRuleUpdates(callback) {
        if (!this.rulesEngine) {
            lcardsLog.warn(`[V2CardSystemsManager] Rules engine not available (${this.cardId})`);
            return () => {}; // No-op unregister function
        }

        try {
            this.ruleCallbacks.add(callback);
            const unregister = this.rulesEngine.registerCallback(this.cardId, callback);

            lcardsLog.debug(`[V2CardSystemsManager] Rule callback registered (${this.cardId})`);

            // Return enhanced unregister that cleans up local tracking
            return () => {
                unregister();
                this.ruleCallbacks.delete(callback);
            };

        } catch (error) {
            lcardsLog.error(`[V2CardSystemsManager] Rule callback registration failed (${this.cardId}):`, error);
            return () => {}; // No-op unregister function
        }
    }

    /**
     * Trigger animation on the card
     * @param {string} animationType - Type of animation
     * @param {Object} config - Animation configuration
     * @returns {Promise<void>}
     */
    async triggerAnimation(animationType, config = {}) {
        if (!this.animationManager) {
            lcardsLog.warn(`[V2CardSystemsManager] Animation manager not available (${this.cardId})`);
            return;
        }

        try {
            await this.animationManager.triggerAnimation(this.card, animationType, config);
            lcardsLog.debug(`[V2CardSystemsManager] Animation triggered (${this.cardId}):`, animationType);

        } catch (error) {
            lcardsLog.error(`[V2CardSystemsManager] Animation failed (${this.cardId}):`, error);
        }
    }

    /**
     * Get entity state from SystemsManager
     * @param {string} entityId - Entity ID to fetch
     * @returns {Object|null} Entity state or null
     */
    getEntityState(entityId) {
        if (!lcardsCore || !lcardsCore.systemsManager) {
            return null;
        }

        try {
            return lcardsCore.systemsManager.getEntityState(entityId);
        } catch (error) {
            lcardsLog.warn(`[V2CardSystemsManager] Entity state fetch failed (${this.cardId}):`, error);
            return null;
        }
    }

    /**
     * Subscribe to entity updates
     * @param {string} entityId - Entity ID to watch
     * @param {Function} callback - Update callback
     * @returns {Function} Unsubscribe function
     */
    subscribeToEntity(entityId, callback) {
        if (!lcardsCore || !lcardsCore.systemsManager) {
            lcardsLog.warn(`[V2CardSystemsManager] SystemsManager not available for entity subscription (${this.cardId})`);
            return () => {}; // No-op unsubscribe function
        }

        try {
            return lcardsCore.systemsManager.subscribeToEntity(entityId, callback);
        } catch (error) {
            lcardsLog.error(`[V2CardSystemsManager] Entity subscription failed (${this.cardId}):`, error);
            return () => {}; // No-op unsubscribe function
        }
    }

    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        return {
            cardId: this.cardId,
            initialized: this.initialized,

            // Singleton connections
            singletonConnections: {
                rulesEngine: !!this.rulesEngine,
                themeManager: !!this.themeManager,
                animationManager: !!this.animationManager,
                dataSourceManager: !!this.dataSourceManager,
                validationService: !!this.validationService
            },

            // Local systems
            localSystems: {
                templateProcessor: !!this.templateProcessor,
                styleResolver: !!this.styleResolver
            },

            // Subscriptions
            subscriptions: {
                dataSourceCount: this.dataSourceSubscriptions.size,
                ruleCallbackCount: this.ruleCallbacks.size
            },

            // Active theme
            activeTheme: this.getActiveTheme()?.id || 'none'
        };
    }

    /**
     * Clean up resources and subscriptions
     */
    async destroy() {
        lcardsLog.debug(`[V2CardSystemsManager] Destroying (${this.cardId})`);

        try {
            // Clean up data source subscriptions
            for (const [subscriptionId] of this.dataSourceSubscriptions) {
                await this.unsubscribeFromDataSource(subscriptionId);
            }
            this.dataSourceSubscriptions.clear();

            // Clean up rule callbacks
            this.ruleCallbacks.clear();

            // Destroy local systems
            if (this.templateProcessor) {
                await this.templateProcessor.destroy();
                this.templateProcessor = null;
            }

            if (this.styleResolver) {
                await this.styleResolver.destroy();
                this.styleResolver = null;
            }

            // Clear singleton references
            this.rulesEngine = null;
            this.themeManager = null;
            this.animationManager = null;
            this.dataSourceManager = null;
            this.validationService = null;

            this.initialized = false;

            lcardsLog.debug(`[V2CardSystemsManager] ✅ Destroyed (${this.cardId})`);

        } catch (error) {
            lcardsLog.error(`[V2CardSystemsManager] ❌ Destruction failed (${this.cardId}):`, error);
        }
    }
}