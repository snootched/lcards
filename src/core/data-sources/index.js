/**
 * [CoreDataSourceManager] Simplified data source manager for the LCARdS core
 * 🎯 Provides basic entity data management for shared core infrastructure
 *
 * Extracted from MSD DataSourceManager but simplified to focus on core entity
 * subscription and state management without the complex transformations and aggregations.
 */

export class CoreDataSourceManager {
    constructor(hass) {
        this.hass = hass;
        this.entitySubscriptions = new Map(); // entityId -> Set of callbacks
        this.entityStates = new Map(); // entityId -> latest state
        this.initialized = false;

        this._log('debug', '[CoreDataSourceManager] 🎯 Created core data source manager');
    }

    /**
     * Simple internal logging method
     * @private
     */
    _log(level, message, ...args) {
        if (typeof window !== 'undefined' && window.lcards?.debug?.log) {
            window.lcards.debug.log(level, message, ...args);
        } else {
            // Fallback to console
            const method = console[level] || console.log;
            method(message, ...args);
        }
    }    /**
     * Initialize the data source manager
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        this._log('debug', '[CoreDataSourceManager] 🚀 Initializing core data source manager');

        // Populate initial entity states from HASS
        if (this.hass?.states) {
            for (const [entityId, state] of Object.entries(this.hass.states)) {
                this.entityStates.set(entityId, state);
            }

            this._log('debug', `[CoreDataSourceManager] 📊 Loaded ${this.entityStates.size} initial entity states`);
        }

        this.initialized = true;
    }

    /**
     * Update HASS reference and refresh entity states
     * @param {Object} hass - New HASS object
     */
    updateHass(hass) {
        const prevHass = this.hass;
        this.hass = hass;

        if (!hass?.states) {
            return;
        }

        // Track changed entities
        const changedEntities = [];

        // Update existing entities and find changes
        for (const [entityId, newState] of Object.entries(hass.states)) {
            const prevState = this.entityStates.get(entityId);

            // Update our stored state
            this.entityStates.set(entityId, newState);

            // Check if state actually changed
            if (!prevState ||
                prevState.state !== newState.state ||
                prevState.last_changed !== newState.last_changed) {
                changedEntities.push(entityId);
            }
        }

        // Notify subscribers of changed entities
        if (changedEntities.length > 0) {
            this._log('debug', `[CoreDataSourceManager] 🔄 ${changedEntities.length} entities changed: ${changedEntities.slice(0, 5).join(', ')}${changedEntities.length > 5 ? '...' : ''}`);

            for (const entityId of changedEntities) {
                this._notifyEntitySubscribers(entityId);
            }
        }
    }

    /**
     * Get current state of an entity
     * @param {string} entityId - Entity ID to get state for
     * @returns {Object|null} Entity state object or null if not found
     */
    getEntityState(entityId) {
        return this.entityStates.get(entityId) || null;
    }

    /**
     * Subscribe to entity changes
     * @param {string} entityId - Entity ID to subscribe to
     * @param {Function} callback - Callback function (entityId, newState) => {}
     * @returns {Function} Unsubscribe function
     */
    subscribeToEntity(entityId, callback) {
        if (!this.entitySubscriptions.has(entityId)) {
            this.entitySubscriptions.set(entityId, new Set());
        }

        const subscribers = this.entitySubscriptions.get(entityId);
        subscribers.add(callback);

        this._log('debug', `[CoreDataSourceManager] 📡 Entity subscription added for ${entityId} (total: ${subscribers.size})`);

        // Return unsubscribe function
        return () => {
            subscribers.delete(callback);
            if (subscribers.size === 0) {
                this.entitySubscriptions.delete(entityId);
            }
            this._log('debug', `[CoreDataSourceManager] 🔌 Entity subscription removed for ${entityId}`);
        };
    }

    /**
     * Get all subscribed entity IDs
     * @returns {string[]} Array of entity IDs with active subscriptions
     */
    getSubscribedEntities() {
        return Array.from(this.entitySubscriptions.keys());
    }

    /**
     * Notify all subscribers of an entity change
     * @private
     */
    _notifyEntitySubscribers(entityId) {
        const subscribers = this.entitySubscriptions.get(entityId);
        if (!subscribers || subscribers.size === 0) {
            return;
        }

        const entityState = this.entityStates.get(entityId);

        this._log('debug', `[CoreDataSourceManager] 📢 Notifying ${subscribers.size} subscribers of ${entityId} change`);

        for (const callback of subscribers) {
            try {
                callback(entityId, entityState);
            } catch (error) {
                this._log('warn', `[CoreDataSourceManager] ⚠️ Error in entity subscription callback for ${entityId}:`, error);
            }
        }
    }

    /**
     * Get entity subscriptions (for debugging and testing)
     * @returns {Object} Entity subscriptions by card/source
     */
    getEntitySubscriptions() {
        const subscriptionInfo = {};

        this.entitySubscriptions.forEach((callbacks, entityId) => {
            subscriptionInfo[entityId] = {
                subscriberCount: callbacks.size,
                subscribers: Array.from(callbacks).map(cb => cb.name || 'anonymous')
            };
        });

        return subscriptionInfo;
    }

    /**
     * Get debug information about the data source manager
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            initialized: this.initialized,
            entityCount: this.entityStates.size,
            subscriptionCount: this.entitySubscriptions.size,
            subscribedEntities: Array.from(this.entitySubscriptions.keys()),
            hasHass: !!this.hass
        };
    }

    /**
     * Clean up resources
     */
    destroy() {
        this._log('debug', '[CoreDataSourceManager] 🧹 Destroying core data source manager');

        this.entitySubscriptions.clear();
        this.entityStates.clear();
        this.hass = null;
        this.initialized = false;
    }
}