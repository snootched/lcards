/**
 * ComponentManager - Centralized Component Registry
 *
 * Manages all component definitions across LCARdS:
 * - Slider components (basic, picard, etc.)
 * - Button components (dpad, etc.)
 * - Elbow components (header-left, footer-right, etc.)
 * - Future: MSD backgrounds, custom components from external packs
 *
 * Components define structural UI patterns with:
 * - SVG shells (static or render functions)
 * - Zone definitions for content injection
 * - Configuration metadata (configurableOptions)
 * - Feature flags and orientation hints
 *
 * This singleton provides the single source of truth for component
 * definitions, accessible via window.lcards.core.componentManager.
 *
 * @module core/components/ComponentManager
 */

import { lcardsLog } from '../../utils/lcards-logging.js';

export class ComponentManager {
    constructor() {
        /** @type {Map<string, Object>} All registered components by name */
        this.components = new Map();

        /** @type {Map<string, Map<string, Object>>} Components grouped by inferred type */
        this.componentsByType = new Map();

        /** @type {boolean} Initialization state */
        this.initialized = false;

        lcardsLog.debug('[ComponentManager] Instance created');
    }

    /**
     * Initialize component manager by loading builtin component registry
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            lcardsLog.debug('[ComponentManager] Already initialized');
            return;
        }

        lcardsLog.debug('[ComponentManager] Initializing...');

        try {
            // Import unified component registry
            const componentsModule = await import('../packs/components/index.js');
            const { components } = componentsModule;

            // Register all components from registry
            let registeredCount = 0;
            Object.entries(components).forEach(([name, component]) => {
                this.registerComponent(name, component);
                registeredCount++;
            });

            this.initialized = true;
            lcardsLog.info(`[ComponentManager] ✅ Initialized with ${registeredCount} components`);

        } catch (error) {
            lcardsLog.error('[ComponentManager] Initialization failed:', error);
            throw error;
        }
    }

    /**
     * Register a component
     * @param {string} name - Component name/identifier
     * @param {Object} component - Component definition
     */
    registerComponent(name, component) {
        if (!name || !component) {
            lcardsLog.warn('[ComponentManager] Cannot register invalid component', { name, component });
            return;
        }

        // Store component
        this.components.set(name, component);

        // Infer type and categorize
        const type = this._inferComponentType(name, component);
        if (!this.componentsByType.has(type)) {
            this.componentsByType.set(type, new Map());
        }
        this.componentsByType.get(type).set(name, component);

        lcardsLog.trace(`[ComponentManager] Registered component: ${name} (type: ${type})`);
    }

    /**
     * Get a component by name
     * @param {string} name - Component name
     * @returns {Object|undefined} Component definition or undefined if not found
     */
    getComponent(name) {
        return this.components.get(name);
    }

    /**
     * Get component metadata
     * @param {string} name - Component name
     * @returns {Object|null} Component metadata or null if not found
     */
    getComponentMetadata(name) {
        const component = this.components.get(name);
        if (!component) {
            lcardsLog.debug(`[ComponentManager] Component not found: ${name}`);
            return null;
        }

        // If component has metadata property (new render function architecture)
        if (component.metadata) {
            return component.metadata;
        }

        // Construct minimal metadata for legacy components
        return {
            name: name,
            features: component.features || [],
            orientation: component.orientation || 'auto',
            description: component.description || null
        };
    }

    /**
     * Get all component names of a specific type
     * @param {string} type - Component type ('slider', 'button', 'elbow', etc.)
     * @returns {Array<string>} Array of component names
     */
    getComponentsByType(type) {
        const typeMap = this.componentsByType.get(type);
        return typeMap ? Array.from(typeMap.keys()) : [];
    }

    /**
     * Get all registered component names
     * @returns {Array<string>} Array of all component names
     */
    getAllComponentNames() {
        return Array.from(this.components.keys());
    }

    /**
     * Check if a component exists
     * @param {string} name - Component name
     * @returns {boolean} True if component is registered
     */
    hasComponent(name) {
        return this.components.has(name);
    }

    /**
     * Get all available component types
     * @returns {Array<string>} Array of type names
     */
    getComponentTypes() {
        return Array.from(this.componentsByType.keys());
    }

    /**
     * Infer component type from name and structure
     * @param {string} name - Component name
     * @param {Object} component - Component definition
     * @returns {string} Inferred type
     * @private
     */
    _inferComponentType(name, component) {
        // Check explicit type in metadata
        if (component.metadata?.type) {
            return component.metadata.type;
        }

        // Infer from name patterns
        if (name.includes('dpad') || name.includes('keypad')) {
            return 'button';
        }

        if (name === 'basic' || name.includes('picard') || name.includes('slider')) {
            return 'slider';
        }

        if (name.includes('elbow') || name.includes('header') || name.includes('footer')) {
            return 'elbow';
        }

        if (name.includes('msd') || name.includes('background')) {
            return 'msd';
        }

        // Default
        return 'unknown';
    }

    /**
     * Get debug information
     * @returns {Object} Debug info
     */
    getDebugInfo() {
        const typeBreakdown = {};
        this.componentsByType.forEach((components, type) => {
            typeBreakdown[type] = components.size;
        });

        return {
            initialized: this.initialized,
            totalComponents: this.components.size,
            componentsByType: typeBreakdown,
            componentNames: this.getAllComponentNames()
        };
    }

    /**
     * Register components from a pack
     * @param {Object} pack - Pack object with components
     */
    registerComponentsFromPack(pack) {
        if (!pack || !pack.components) {
            return;
        }

        lcardsLog.debug(`[ComponentManager] Registering components from pack: ${pack.id}`);

        let registeredCount = 0;
        Object.entries(pack.components).forEach(([name, component]) => {
            // Add pack reference to component
            const componentWithPack = {
                ...component,
                pack: pack.id
            };
            this.registerComponent(name, componentWithPack);
            registeredCount++;
        });

        lcardsLog.debug(`[ComponentManager] Registered ${registeredCount} components from pack: ${pack.id}`);
    }
}
